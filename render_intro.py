# 신기한 사실 계정: 프로필 사진 + 소개 카드뉴스 렌더러
# 실행: python -X utf8 render_intro.py
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
OUT_P = ROOT / "profile"
OUT_I = ROOT / "intro"
OUT_P.mkdir(exist_ok=True)
OUT_I.mkdir(exist_ok=True)

# 저장소에 넣은 폰트를 우선 사용 (클라우드 루틴에서도 같은 모양이 나오게)
FONT = str(ROOT / "fonts" / "NotoSansKR-VF.ttf")
BG = "#15171E"
INK = "#F5F3EE"
MUTED = "#9AA0AE"
ACCENT = "#FFD23F"
W, H = 1080, 1350
PAD = 96
BRAND = "다들 모르는 사실"


def font(size, weight=700):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([weight])
    return f


def text_block(d, xy, text, f, fill, spacing=1.18):
    """여러 줄 텍스트를 그리고 끝난 y 좌표를 돌려준다."""
    x, y = xy
    line_h = int(f.size * spacing)
    for line in text.split("\n"):
        d.text((x, y), line, font=f, fill=fill)
        y += line_h
    return y


def base(page, total, tag):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((PAD, 84), BRAND, font=font(34, 700), fill=MUTED)
    pg = f"{page}/{total}"
    f = font(34, 500)
    d.text((W - PAD - d.textlength(pg, font=f), 84), pg, font=f, fill=MUTED)
    if tag:
        f = font(36, 800)
        tw = d.textlength(tag, font=f)
        d.rounded_rectangle((PAD, 190, PAD + tw + 44, 190 + 64), radius=32, fill=ACCENT)
        d.text((PAD + 22, 196), tag, font=f, fill=BG)
    return im, d


def footer(d, text):
    f = font(36, 600)
    d.text((PAD, H - 150), text, font=f, fill=MUTED)


# ---------- 프로필 사진 ----------
def profile():
    S = 1080
    im = Image.new("RGB", (S, S), ACCENT)
    d = ImageDraw.Draw(im)
    f = font(400, 900)
    t = "사실?"
    bbox = d.textbbox((0, 0), t, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((S - tw) / 2 - bbox[0], (S - th) / 2 - bbox[1]), t, font=f, fill=BG)
    im.save(OUT_P / "profile_1080.png")
    # 검수용: 원형 크롭 + 실제 노출 크기(40px / 110px) 미리보기
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, S, S), fill=255)
    circ = Image.new("RGB", (S, S), "white")
    circ.paste(im, (0, 0), mask)
    prev = Image.new("RGB", (420, 180), "white")
    prev.paste(circ.resize((110, 110), Image.LANCZOS), (30, 35))
    prev.paste(circ.resize((40, 40), Image.LANCZOS), (200, 70))
    prev.save(OUT_P / "preview_small.png")


# ---------- 소개 카드뉴스 ----------
TOTAL = 6


def s1():
    im, d = base(1, TOTAL, "이 계정 소개")
    y = text_block(d, (PAD, 330), "다들 그렇게\n알고 있죠?", font(124, 900), INK)
    text_block(d, (PAD, y + 40), "사실은\n아니에요.", font(124, 900), ACCENT)
    footer(d, "옆으로 넘겨보세요  →")
    return im


def s2():
    im, d = base(2, TOTAL, "")
    text_block(d, (PAD, 210), "여기선\n이런 걸 올려요", font(92, 900), INK)
    items = [
        ("01", "해외에서 화제가 된\n신기한 사실"),
        ("02", "한국어로,\n1분 안에 읽히게"),
        ("03", "출처를 확인한\n내용만"),
    ]
    y = 560
    for num, txt in items:
        d.text((PAD, y), num, font=font(64, 900), fill=ACCENT)
        text_block(d, (PAD + 130, y + 2), txt, font(56, 700), INK, 1.25)
        y += 220
    return im


def example(page, tag, q, verdict, body, note):
    im, d = base(page, TOTAL, tag)
    y = text_block(d, (PAD, 310), q, font(84, 900), INK)
    d.text((PAD, y + 40), verdict, font=font(150, 900), fill=ACCENT)
    y = text_block(d, (PAD, y + 260), body, font(54, 700), INK, 1.35)
    text_block(d, (PAD, y + 40), note, font(40, 500), MUTED, 1.4)
    return im


def s3():
    return example(3, "예시 · 지리", "서울이 아테네보다\n남쪽에 있다?", "O",
                   "서울  북위 37.57°\n아테네  북위 37.98°",
                   "아테네가 훨씬 남쪽일 것 같지만\n서울이 약 0.4° 더 남쪽이에요.\n출처: 각 도시 중심 좌표")


def s4():
    return example(4, "예시 · 우주", "우주에서 헬멧을 벗으면\n몸이 터진다?", "X",
                   "안 터져요.\n대신 10~15초 안에\n정신을 잃어요.",
                   "출처: NASA 생체우주공학 데이터북 외")


def s5():
    return example(5, "예시 · 음식", "마트 바나나는\n전부 클론이다?", "거의 O",
                   "대부분 캐번디시 한 품종.\n씨가 없어서 새끼 줄기(흡지)를\n떼어 심어 번식해요.",
                   "그래서 유전적으로 거의 똑같아요.\n출처: 브리태니커")


def s6():
    im, d = base(6, TOTAL, "")
    y = text_block(d, (PAD, 440), "매일 하나씩,\n아는 척할 거리", font(104, 900), INK)
    y = text_block(d, (PAD, y + 80), "저장해두고 친구한테 보내기", font(54, 700), ACCENT)
    text_block(d, (PAD, y + 30), "팔로우하면\n내일 사실도 볼 수 있어요", font(54, 700), INK, 1.3)
    return im


if __name__ == "__main__":
    profile()
    for i, fn in enumerate([s1, s2, s3, s4, s5, s6], 1):
        fn().save(OUT_I / f"intro_{i:02d}.png")
    print("done")
