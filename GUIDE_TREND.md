# "오늘의 이슈" 카드뉴스 제작 지침 (클라우드 루틴용)

계정: 인스타 @sasil.kr, 브랜드 **"오늘의 이슈"**. 지금 한국 사람들이 많이 찾는 이슈를 카드 4장 + 게시글로 정리한다.
하루 두 번, 매일 반복:

| 회차 | 루틴 시작 | 배치 폴더 | 텔레그램 승인 요청 | 게시 |
|---|---|---|---|---|
| 오전 | 06:00 KST | `trend/D-am` | 07:30 | 08:00부터 (승인된 것만, 5분 간격) |
| 오후 | 09:30 KST | `trend/D-pm` | 11:00 | 승인 즉시 (5분 간격) |

D = 오늘 날짜(KST, `TZ=Asia/Seoul date +%F`). 텔레그램 발송과 게시는 Cloudflare 봇이 `trend/<배치>/batch.json` 을 보고 알아서 한다.
**루틴은 절대 인스타에 직접 올리지 않는다.** 승인 요청 시각 전에 push 를 끝내야 한다(오전 07:20, 오후 10:50까지).

## 1. 이슈 고르기 (조사·분석부)
- 1순위: 구글 트렌드 한국 급상승 RSS `https://trends.google.com/trending/rss?geo=KR` (항목마다 검색량 `ht:approx_traffic`, 관련 기사 제목·URL 포함).
  - 오전 회차: 새벽~아침에 뜬 검색어 위주. 오후 회차: 오전에 뜬 검색어 위주.
- 부족하면 구글 뉴스 한국 주요 뉴스 RSS `https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko` 에서 화제 이슈를 보탠다.
- **이슈 5~10개.** 검색량 순으로 순위(1위~)를 매긴다.
- **중복 금지:** `trend/*/issues.json` 과 `posts/*/spec.json` 의 keyword·title·topic 을 모두 읽고, 이미 다룬 주제(같은 사건·같은 경기·같은 인물의 같은 소식)는 쓰지 않는다. 같은 인물이라도 **새로운 사건**이면 가능.
- **빼는 이슈:** 사망·사고·범죄 피해자, 자살, 확인 안 된 루머·사생활 폭로, 정치인·정당 공방, 혐오, 미성년자 관련, 성적인 내용, 의료·투자 권유.
- 각 이슈의 사실은 **서로 다른 언론 2곳 이상**에서 확인한다(구글 뉴스 RSS 검색 `https://news.google.com/rss/search?q=<검색어>+when:2d&hl=ko&gl=KR&ceid=KR:ko` 로 기사 목록을 찾고, 기사 본문을 읽는다). 확인 못 한 내용은 쓰지 않는다.
- 조사 결과를 `trend/<배치>/brief.md` 에: 조사 시각, **실제 검색 횟수**, 후보 전체와 뺀 이유, 이슈별 출처 URL.

## 2. 사진 (가장 중요)
- **뉴스 사진, 구글 이미지, 방송 캡처, 연예인·선수 개인 SNS 사진은 절대 쓰지 않는다.**
- 쓸 수 있는 것: 상업적 이용 + 수정이 허용된 사진만. **CC0, 퍼블릭 도메인, CC BY, CC BY-SA** (NC·ND 금지).
  - 위키미디어 공용 API: `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=<검색어> filetype:bitmap&gsrnamespace=6&prop=imageinfo&iiprop=url|size|extmetadata&format=json`
    → `extmetadata.LicenseShortName`, `Artist`, `Credit`, `ImageDescription` 확인. 다운로드는 `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/<파일명>` (-L).
    User-Agent 는 `sasil-trend-cards/1.0 (github.com/ssong032/sasil-ig-cards)` 처럼 정직하게, 요청 사이 3초 이상 쉰다. 429가 나면 기다렸다가 다시 하거나 다른 출처로.
  - Openverse API: `https://api.openverse.org/v1/images/?q=<검색어>&license_type=commercial,modification` (플리커 CC 사진 포함, `url` 로 받기).
- 사진 고르는 순서: ① 그 인물·장소·팀의 자유 이용 사진 ② 관련 장소·물건 사진 ③ 분위기 자료사진(경기장, 동전 등).
  - **설명(ImageDescription)과 실제 사진을 직접 열어 확인**한다. 제목만 믿지 말 것(예: 인물 이름이 붙었지만 피규어·포스터 사진인 경우 있음). 포스터·로고·다른 사람 작품이 크게 찍힌 사진은 쓰지 않는다.
  - "Own work" 가 아니고 출처가 불분명한 인물 사진은 쓰지 않는다.
  - 인물 사진이 작으면 `inset`(표지 오른쪽 원형)으로 넣고 배경은 관련 자료사진으로. 얼굴이 원 안에 들어오게 미리 잘라서(`src/<이름>_face.jpg`) 넣는다.
  - 그날 사진이 아니면 credit 에 반드시 `(자료사진)`.
- 사진은 `trend/<배치>/src/` 에 저장(이 폴더는 git 에 올라가지 않는다).

## 3. 카드·게시글 (콘텐츠 제작부)
`trend/<배치>/issues.json` = 이슈 배열. 형식(예시는 `trend/2026-11-25-sample/issues.json`):
```
{"rank":1, "date":"11.26", "keyword":"구글 검색어 원문",
 "photo":"a.jpg", "focus":[0.5,0.5], "band_photo":"b.jpg"(선택), "band_focus":[0.5,0.5],
 "inset":"face.jpg"(선택), "inset_focus":[0.5,0.5],
 "title":"표지 제목 2줄 이내", "hook":"노란 한 줄",
 "what":"무슨 일? 본문 (줄바꿈 \n)", "points":["포인트1","포인트2","포인트3"],
 "summary":"한 줄 정리 (2줄 이내)", "sources":"출처 매체·날짜", "credit":"사진 설명\n작가 / 출처, 라이선스",
 "caption":"게시글 전문", "qa":{"score":88,"verdict":"게시 가능"}}
```
- **제목은 자극적으로, 사람들이 혹해서 넘겨보게.** 반전·숫자·궁금증("그런데…", "이유가 있었다", "16년 전 그 남자") 활용. 단 **사실과 다르거나 주체를 부풀리면 안 된다**(예: 실무진 의견을 "미국이 인정"으로 쓰지 말 것 → 물음표나 정확한 주체).
- 표지 pill 은 자동으로 `이슈 N위 · 날짜`. "급상승 검색어"라는 말은 쓰지 않는다.
- 게시글(caption): 첫 줄 = 제목보다 한 번 더 궁금하게 만드는 한두 문장 → "어제/오늘 구글에서 많이 찾아본 이슈에 \"검색어\"가 올랐어요." → 사실 2~3문단(해요체) → 공유 유도 + "팔로우하고 새로운 소식 받아보세요." → `출처:` 줄 → `사진:` 줄 → 해시태그 정확히 3개(`#이슈정리 #오늘의이슈` + 주제 1개).
  - 긴 대시(— –) 금지, 댓글 답장 약속 금지, 2200자 이내. 투자·코인 이슈는 "정보 제공용이며 투자 권유가 아니에요." 문장 필수.
  - 조롱·비하·단정적 비난 금지. 논란 이슈는 "~라는 주장이 나왔어요"처럼 확인된 범위만.
- 렌더링: `pip install pillow` 후 `python render_trend.py trend/<배치>`. 글자 넘침 오류가 나면 줄을 나누거나 줄인다. `trend/<배치>/<n>/01~04.jpg` 를 **직접 열어 보고** 사진 위치·얼굴 잘림을 고친다.

## 4. 검수 (검증·품질관리부, 독립 에이전트)
- 제작과 분리된 **서브에이전트**(Agent 도구)가 `org/04_검증품질관리부.md` 형식으로 이슈마다 검수한다. 검수자는 파일을 고치지 않는다.
- 모든 사실을 다시 검색해 확인, 사진 라이선스·설명 확인, 제목 과장 여부, 명예훼손·사생활 위험.
- 결과를 `trend/<배치>/qa.md` 에: 실제 검색 횟수, 이슈별 점수(/100)와 `최종 판정: 게시 가능|보류`.
- 필수 수정은 반영 후 다시 렌더링. **보류 이슈는 issues.json 에서 빼고**(빼고 나서도 5개 이상이 되도록 후보를 넉넉히), 각 이슈의 `qa` 에 점수·판정을 적는다. render_trend.py 는 판정이 "게시 가능"이 아니면 멈춘다.

## 5. push
`trend/<배치>/` (issues.json, brief.md, qa.md, <n>/*.jpg, caption.txt, batch.json) 를 main 에 커밋·push.
커밋 메시지: `trend <배치>: 이슈 N개 (<첫 검색어> 외)`. push 실패 시 `git pull --rebase` 후 다시.
