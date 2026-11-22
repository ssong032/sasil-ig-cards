# 매일 게시물 렌더러: posts/YYYY-MM-DD/spec.json -> 01.jpg ~ NN.jpg + manifest.json
# 실행: python -X utf8 render_post.py 2026-11-23
#
# spec.json 형식 (슬라이드 3~10장):
# {
#   "topic": "한 줄 주제 (중복 확인용)",
#   "caption": "인스타 캡션 (해시태그 3개 포함)",
#   "slides": [
#     {"type": "cover",   "tag": "지리 반전", "white": "흰 글씨\n두 줄", "yellow": "노란 글씨", "foot": "넘겨보세요  →"},
#     {"type": "qa",      "tag": "상식 1", "q": "질문?", "verdict": "X", "body": "설명", "note": "출처: ..."},  ← 질문 카드 + 정답 카드 2장이 됨
#     {"type": "compare", "tag": "비교 1", "title": "A vs B", "rows": [["A", "1.0°", true], ["B", "0.5°", false]], "note": "설명"},
#     {"type": "plain",   "tag": "그런데 왜?", "title": "제목", "body": "본문", "note": "회색 글씨", "foot": ""},
#     {"type": "cta",     "accent": "저장해두고 친구한테 보내기", "sub": "팔로우하면\n내일 사실도 볼 수 있어요"}
#   ]
# }
# 글자가 카드 밖으로 넘치면 오류를 내고 멈춘다 (자동 제작이라 사람이 못 보고 지나칠 수 있어서).
import json
import sys
from pathlib import Path

from PIL import ImageDraw, ImageFont

import render_intro as RI
import render_pinned as RP

ROOT = Path(__file__).parent
MAX_X = RI.W - RI.PAD  # 오른쪽 여백
MAX_Y = RI.H - 170     # 아래 여백 (footer 자리)


class Overflow(Exception):
    pass


def check_text(text, size, weight, limit=MAX_X - RI.PAD):
    f = RI.font(size, weight)
    d = ImageDraw.Draw(RI.Image.new("RGB", (10, 10)))
    for line in text.split("\n"):
        w = d.textlength(line, font=f)
        if w > limit:
            raise Overflow(f"'{line}' 가 {int(w)}px로 너무 깁니다 (최대 {limit}px). 줄을 나누거나 줄이세요.")


def check_bottom(im):
    """카드 아래쪽 여백(footer 위)에 글자가 침범했는지 확인한다."""
    px = im.load()
    bg = RI.Image.new("RGB", (1, 1), RI.BG).getpixel((0, 0))
    for y in range(MAX_Y, RI.H - 160):
        for x in range(0, RI.W, 4):
            if px[x, y] != bg:
                raise Overflow(f"본문이 카드 아래쪽(y={y})까지 내려왔습니다. 문장을 줄이세요.")


def build(s, page, total):
    t = s["type"]
    if t == "cover":
        size = s.get("size", 112)
        check_text(s["white"], size, 900); check_text(s["yellow"], size, 900)
        return RP.cover(page, total, s.get("tag", ""), s["white"], s["yellow"], s.get("foot", "넘겨보세요  →"), size)
    if t == "qa_q":  # 질문 카드: 정답은 다음 장
        check_text(s["q"], 96, 900)
        im, d = RI.base(page, total, s.get("tag", ""))
        y = RI.text_block(d, (RI.PAD, 360), s["q"], RI.font(96, 900), RI.INK)
        RI.text_block(d, (RI.PAD, y + 60), "O일까요, X일까요?", RI.font(60, 800), RI.ACCENT)
        RI.footer(d, "정답은 다음 장에서  →")
        return im
    if t == "qa_a":  # 정답 카드: 질문을 작게 다시 보여주고 판정 + 설명
        q1 = s["q"].replace("\n", " ")
        check_text(q1, 40, 600); check_text(s["body"], 52, 700); check_text(s.get("note", ""), 38, 500)
        im, d = RI.base(page, total, "정답")
        d.text((RI.PAD, 300), q1, font=RI.font(40, 600), fill=RI.MUTED)
        d.text((RI.PAD, 370), s["verdict"], font=RI.font(170, 900), fill=RI.ACCENT)
        y = RI.text_block(d, (RI.PAD, 630), s["body"], RI.font(52, 700), RI.INK, 1.35)
        RI.text_block(d, (RI.PAD, y + 40), s.get("note", ""), RI.font(38, 500), RI.MUTED, 1.4)
        return im
    if t == "compare":
        check_text(s["title"], 84, 900); check_text(s.get("note", ""), 48, 700)
        for name, val, _ in s["rows"]:
            nw = ImageDraw.Draw(RI.Image.new("RGB", (1, 1))).textlength(name, font=RI.font(60, 700))
            vw = ImageDraw.Draw(RI.Image.new("RGB", (1, 1))).textlength(val, font=RI.font(110, 900))
            if nw + vw + 40 > MAX_X - RI.PAD:
                raise Overflow(f"비교 행 '{name} {val}' 이 너무 깁니다.")
        return RP.compare(page, total, s.get("tag", ""), s["title"], [tuple(r) for r in s["rows"]], s.get("note", ""))
    if t == "plain":
        check_text(s["title"], 84, 900); check_text(s["body"], 52, 700); check_text(s.get("note", ""), 38, 500)
        return RP.plain(page, total, s.get("tag", ""), s["title"], s["body"], s.get("note", ""), s.get("foot", ""))
    if t == "cta":
        check_text(s.get("accent", ""), 54, 700); check_text(s.get("sub", ""), 54, 700)
        return RP.cta(page, total, s["accent"], s["sub"])
    raise ValueError(f"알 수 없는 슬라이드 type: {t}")


def main(ymd):
    out = ROOT / "posts" / ymd
    spec = json.loads((out / "spec.json").read_text(encoding="utf-8"))
    # qa 하나는 질문 카드 + 정답 카드 2장으로 나눈다 (정답은 넘겨야 보이게)
    slides = []
    for s in spec["slides"]:
        if s["type"] == "qa":
            slides += [{**s, "type": "qa_q"}, {**s, "type": "qa_a"}]
        else:
            slides.append(s)
    if not 3 <= len(slides) <= 10:
        sys.exit(f"슬라이드 수 {len(slides)} (qa는 2장으로 계산): 3~10장이어야 합니다")
    cap = spec["caption"]
    if "—" in cap or "–" in cap:
        sys.exit("캡션에 긴 대시(— –)가 있습니다. 쉼표나 마침표로 바꾸세요.")
    if len(cap) > 2200:
        sys.exit("캡션이 2200자를 넘습니다")
    for old in out.glob("*.jpg"):
        old.unlink()
    files = []
    for i, s in enumerate(slides, 1):
        try:
            im = build(s, i, len(slides))
            if s["type"] != "cover":
                check_bottom(im)
        except Overflow as e:
            sys.exit(f"[{i}번 슬라이드] {e}")
        name = f"{i:02d}.jpg"
        im.convert("RGB").save(out / name, quality=95)
        files.append(name)
    manifest = {"date": ymd, "topic": spec.get("topic", ""), "files": files, "caption": cap}
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"done: {len(files)}장 -> posts/{ymd}/")


if __name__ == "__main__":
    main(sys.argv[1])
