# 고정 게시물 2·3번 렌더러 (1번은 render_intro.py의 소개 카드뉴스)
# 실행: python -X utf8 render_pinned.py
from pathlib import Path
from PIL import ImageDraw
from render_intro import font, text_block, base, footer, PAD, W, INK, MUTED, ACCENT, BG

ROOT = Path(__file__).parent


def cover(p, n, tag, white, yellow, foot, size=112):
    im, d = base(p, n, tag)
    y = text_block(d, (PAD, 330), white, font(size, 900), INK)
    text_block(d, (PAD, y + 40), yellow, font(size, 900), ACCENT)
    footer(d, foot)
    return im


def compare(p, n, tag, title, rows, note):
    """rows: [(도시, 위도문자열, 강조여부)]"""
    im, d = base(p, n, tag)
    y = text_block(d, (PAD, 310), title, font(84, 900), INK)
    y += 70
    for name, val, hi in rows:
        col = ACCENT if hi else INK
        d.text((PAD, y), name, font=font(60, 700), fill=col)
        f = font(110, 900)
        d.text((W - PAD - d.textlength(val, font=f), y - 30), val, font=f, fill=col)
        y += 170
    d.line((PAD, y - 20, W - PAD, y - 20), fill="#2A2E3A", width=3)
    text_block(d, (PAD, y + 20), note, font(48, 700), INK, 1.35)
    return im


def qa(p, n, tag, q, verdict, body, note):
    im, d = base(p, n, tag)
    y = text_block(d, (PAD, 310), q, font(84, 900), INK)
    d.text((PAD, y + 40), verdict, font=font(150, 900), fill=ACCENT)
    y = text_block(d, (PAD, y + 260), body, font(52, 700), INK, 1.35)
    text_block(d, (PAD, y + 40), note, font(38, 500), MUTED, 1.4)
    return im


def plain(p, n, tag, title, body, note="", foot=""):
    im, d = base(p, n, tag)
    y = text_block(d, (PAD, 310), title, font(84, 900), INK)
    y = text_block(d, (PAD, y + 60), body, font(52, 700), INK, 1.4)
    if note:
        text_block(d, (PAD, y + 40), note, font(38, 500), MUTED, 1.4)
    if foot:
        footer(d, foot)
    return im


def cta(p, n, accent_line, sub):
    im, d = base(p, n, "")
    y = text_block(d, (PAD, 440), "매일 하나씩,\n아는 척할 거리", font(104, 900), INK)
    y = text_block(d, (PAD, y + 80), accent_line, font(54, 700), ACCENT)
    text_block(d, (PAD, y + 30), sub, font(54, 700), INK, 1.3)
    return im


# ---------- 고정 2: 지리 반전 ----------
def pinned2():
    n = 8
    return [
        cover(1, n, "지리 반전", "서울이 아테네보다\n남쪽에 있다고?", "네, 진짜예요.",
              "도시 세 쌍으로 확인해보세요  →"),
        compare(2, n, "비교 1", "서울 vs 아테네",
                [("아테네", "37.98°", True), ("서울", "37.57°", False)],
                "아테네가 약 0.4° 더 북쪽이에요."),
        compare(3, n, "비교 2", "평양 vs 마드리드",
                [("마드리드", "40.42°", True), ("평양", "39.04°", False)],
                "스페인 마드리드가\n평양보다 약 1.4° 더 북쪽이에요."),
        compare(4, n, "비교 3", "서울 vs 샌프란시스코",
                [("샌프란시스코", "37.77°", True), ("서울", "37.57°", False)],
                "샌프란시스코도\n서울보다 약 0.2° 더 북쪽이에요."),
        plain(5, n, "그런데 왜?", "유럽은 왜 같은 위도인데\n겨울이 더 따뜻할까?",
              "대서양에서 불어오는 편서풍이\n바다의 온기를 대륙으로 실어 와요.\n\n한국은 겨울마다 시베리아에서 오는\n찬 북서풍을 정면으로 맞고요.",
              "그래서 한국 겨울은 실제 위도보다\n훨씬 북쪽처럼 느껴져요."),
        plain(6, n, "퀴즈", "그럼 이건?",
              "영국 런던 vs 캐나다 캘거리\n어디가 더 북쪽일까요?",
              "", "생각해보고 넘겨보세요  →"),
        compare(7, n, "정답", "런던이 더 북쪽",
                [("런던", "51.51°", True), ("캘거리", "51.05°", False)],
                "캐나다 캘거리보다\n런던이 약 0.5° 더 북쪽이에요."),
        cta(8, n, "친구한테 퀴즈로 내보기", "팔로우하면\n내일 사실도 볼 수 있어요"),
    ]


# ---------- 고정 3: 상식 반전 ----------
def pinned3():
    n = 6
    return [
        cover(1, n, "상식 반전", "다들 믿는 상식 3개,", "전부 틀렸어요.",
              "몇 개 믿고 있었는지 세어보세요  →", size=100),
        qa(2, n, "상식 1", "금붕어 기억력은\n3초다?", "X",
           "실험에서 금붕어는\n배운 걸 몇 주에서\n몇 달까지 기억했어요.",
           "출처: 영국 플리머스대(1994) 등 여러 행동 실험"),
        qa(3, n, "상식 2", "만리장성은\n우주에서 보인다?", "X",
           "지구 궤도에서 맨눈으로는\n거의 안 보여요. 폭이 몇 m뿐이고\n주변 땅과 색이 비슷해서요.",
           "출처: NASA, 중국 첫 우주인 양리웨이"),
        qa(4, n, "상식 3", "사람은 뇌의\n10%만 쓴다?", "X",
           "뇌 영상을 찍어 보면\n하루 동안 거의 모든 부위가 일해요.",
           "뇌는 몸무게의 약 2%인데\n에너지는 약 20%를 써요.\n출처: MIT 맥거번 뇌연구소 등"),
        plain(5, n, "몇 개였나요?", "3개 다 믿고 있었다면\n정상이에요.",
              "셋 다 아주 오래\n널리 퍼진 이야기거든요.\n\n다 알고 있었다면\n친구한테 퀴즈로 내보세요."),
        cta(6, n, "저장해두고 친구한테 보내기", "팔로우하면\n내일 사실도 볼 수 있어요"),
    ]


if __name__ == "__main__":
    for name, slides in [("pinned2_geo", pinned2()), ("pinned3_myths", pinned3())]:
        out = ROOT / name
        out.mkdir(exist_ok=True)
        for i, im in enumerate(slides, 1):
            im.save(out / f"{name}_{i:02d}.png")
    print("done")
