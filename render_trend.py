# 오늘의 이슈: 이슈 1개 = 카드뉴스 4장 (표지 / 무슨 일? / 포인트 3 / 정리·출처)
# 실행: python -X utf8 render_trend.py trend/2026-11-26-am
#   입력: trend/<배치>/issues.json, 사진은 trend/<배치>/src/
#   출력: trend/<배치>/<n>/01~04.jpg + caption.txt, trend/<배치>/batch.json (봇이 읽는 파일)
# 글자가 카드 밖으로 넘치면 오류를 내고 멈춘다.
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).parent
FONT = str(ROOT / "fonts" / "NotoSansKR-VF.ttf")
HERE = None  # 배치 폴더 (main 에서 정함)
BG = (21, 23, 30)
INK = "#F5F3EE"
MUTED = "#AEB4C2"
ACCENT = "#FFD23F"
W, H, PAD = 1080, 1350, 80
LIMIT = W - 2 * PAD


def font(size, weight=700):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([weight])
    return f


def lines(d, xy, text, f, fill, gap, label):
    x, y = xy
    for ln in text.split("\n"):
        w = d.textlength(ln, font=f)
        if w > LIMIT:
            raise SystemExit(f"[{label}] '{ln}' {int(w)}px > {LIMIT}px")
        d.text((x, y), ln, font=f, fill=fill)
        y += gap
    return y


def fade(h, start, power=1.4, top_dark=0):
    m = Image.new("L", (1, h))
    for y in range(h):
        t = max(0.0, (y - start) / max(1, h - start))
        m.putpixel((0, y), int(255 * min(1.0, t ** power)))
    return m.resize((W, h))


def photo(iss, h, focus=None):
    ph = Image.open(HERE / "src" / iss["photo"]).convert("RGB")
    return ImageOps.fit(ph, (W, h), Image.LANCZOS, centering=tuple(focus or iss.get("focus", (0.5, 0.5))))


def header(d, iss, page, dark_bg=True):
    d.text((PAD, 56), "오늘의 이슈", font=font(30, 700), fill=INK)
    t = f"{page}/4"
    f = font(30, 600)
    d.text((W - PAD - d.textlength(t, font=f), 56), t, font=f, fill=INK)


def pill(d, x, y, text, size=40):
    f = font(size, 900)
    tw = d.textlength(text, font=f)
    d.rounded_rectangle((x, y, x + tw + 44, y + size + 30), radius=(size + 30) // 2, fill=ACCENT)
    d.text((x + 22, y + 8), text, font=f, fill=BG)
    return y + size + 30


def top_shade(im, h=220, alpha=150):
    m = Image.new("L", (1, h))
    for y in range(h):
        m.putpixel((0, y), int(alpha * (1 - y / h)))
    im.paste(Image.new("RGB", (W, h), (0, 0, 0)), (0, 0), m.resize((W, h)))


def cover(iss):
    im = photo(iss, H)
    im.paste(Image.new("RGB", (W, H), BG), (0, 0), fade(H, 400, 0.9))
    top_shade(im)
    if iss.get("inset"):  # 인물 원형 사진 (선택)
        S = 380
        ins = ImageOps.fit(Image.open(HERE / "src" / iss["inset"]).convert("RGB"), (S, S), Image.LANCZOS,
                           centering=tuple(iss.get("inset_focus", (0.5, 0.3))))
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, S - 1, S - 1), fill=255)
        x0, y0 = W - PAD - S, 300
        ImageDraw.Draw(im).ellipse((x0 - 10, y0 - 10, x0 + S + 10, y0 + S + 10), fill=ACCENT)
        im.paste(ins, (x0, y0), mask)
    d = ImageDraw.Draw(im)
    header(d, iss, 1)
    y = pill(d, PAD, 760, f"이슈 {iss['rank']}위 · {iss['date']}", 36) + 36
    y = lines(d, (PAD, y), iss["title"], font(84, 900), INK, 104, "표지 제목")
    y = lines(d, (PAD, y + 20), iss["hook"], font(46, 700), ACCENT, 62, "표지 훅")
    d.text((PAD, H - 120), "넘겨서 자세히 보기  →", font=font(34, 600), fill=MUTED)
    return im


def band(iss, page, tag):
    im = Image.new("RGB", (W, H), BG)
    ph = photo({**iss, "photo": iss.get("band_photo", iss["photo"])}, 460, iss.get("band_focus"))
    im.paste(ph, (0, 0))
    im.paste(Image.new("RGB", (W, 460), BG), (0, 0), fade(460, 200, 1.3))
    top_shade(im, 200, 130)
    d = ImageDraw.Draw(im)
    header(d, iss, page)
    y = pill(d, PAD, 400, tag, 38)
    return im, d, y + 40


def what(iss):
    im, d, y = band(iss, 2, "무슨 일?")
    y = lines(d, (PAD, y), iss["what"], font(46, 700), INK, 66, "무슨 일")
    if y > H - 140:
        raise SystemExit("[무슨 일] 아래 여백 침범")
    return im


def points(iss):
    im, d, y = band(iss, 3, "알아두면 좋은 포인트")
    for i, p in enumerate(iss["points"], 1):
        d.text((PAD, y), str(i), font=font(54, 900), fill=ACCENT)
        y = lines(d, (PAD + 64, y + 4), p, font(42, 700), INK, 58, f"포인트{i}") + 34
    if y > H - 120:
        raise SystemExit("[포인트] 아래 여백 침범")
    return im


def wrap(iss):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    header(d, iss, 4)
    y = pill(d, PAD, 190, "한 줄 정리", 38) + 40
    y = lines(d, (PAD, y), iss["summary"], font(60, 900), INK, 80, "정리")
    y += 60
    d.line((PAD, y, W - PAD, y), fill="#2E323D", width=3)
    y += 40
    y = lines(d, (PAD, y), "출처\n" + iss["sources"], font(32, 500), MUTED, 46, "출처")
    y = lines(d, (PAD, y + 20), "사진\n" + iss["credit"], font(32, 500), MUTED, 46, "사진")
    if y > H - 260:
        raise SystemExit("[정리] 출처가 아래 CTA와 겹칩니다")
    d.text((PAD, H - 230), "지금 가장 뜨거운 이슈, 놓치지 마세요", font=font(40, 700), fill=ACCENT)
    d.text((PAD, H - 168), "팔로우하고 새로운 소식 받아보세요", font=font(40, 700), fill=INK)
    return im


SLOTS = {"am": ("07:30", "08:00"), "pm": ("11:00", None)}  # (승인 요청 시각, 게시 시각; None = 승인 즉시)


def main(batch_dir):
    global HERE
    HERE = Path(batch_dir).resolve()
    batch = HERE.name
    data = json.loads((HERE / "issues.json").read_text(encoding="utf-8"))
    if not 1 <= len(data) <= 10:
        raise SystemExit(f"이슈 수 {len(data)}: 1~10개여야 합니다")
    items = []
    for n, iss in enumerate(data, 1):
        cap = iss["caption"]
        if "—" in cap or "–" in cap:
            raise SystemExit(f"[{n}] 캡션에 긴 대시가 있습니다")
        if len(cap) > 2200:
            raise SystemExit(f"[{n}] 캡션이 2200자를 넘습니다")
        qa = iss.get("qa") or {}
        if "가능" not in str(qa.get("verdict", "")):
            raise SystemExit(f"[{n}] 검수 판정이 '게시 가능'이 아닙니다. 보류된 이슈는 issues.json 에서 빼세요")
        out = HERE / str(n)
        out.mkdir(exist_ok=True)
        files = []
        for i, fn in enumerate([cover, what, points, wrap], 1):
            fn(iss).convert("RGB").save(out / f"{i:02d}.jpg", quality=92)
            files.append(f"{n}/{i:02d}.jpg")
        (out / "caption.txt").write_text(cap, encoding="utf-8")
        title1 = " ".join(iss["title"].split("\n"))
        items.append({"n": n, "keyword": iss.get("keyword", ""), "title": title1,
                      "files": files, "caption": cap, "qa_score": qa.get("score"), "qa_verdict": qa.get("verdict")})
        print("완료:", n, title1)
    slot = batch.rsplit("-", 1)[-1]
    notify_at, publish_at = SLOTS.get(slot, (None, None))
    meta = {"batch": batch, "notify_at": notify_at, "publish_at": publish_at, "items": items}
    (HERE / "batch.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"batch.json 저장: {len(items)}개")


if __name__ == "__main__":
    main(sys.argv[1])
