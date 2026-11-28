# Part C research: 2026-11-28 pm batch (group C)

Researched 09:08 to about 09:25 KST.
Searches and fetches actually done:
- Google News RSS searches: 8 (4 main queries over 2 days, 4 follow-ups over 3 days)
- Google News link decoding: 1 batch of 20 links. 6 failed with 429; a second decode attempt was blocked.
- WebSearch: 9
- Article and page fetches with curl: 18. These were yna, tygem, sports.khan, newspim, zdnet, vietnam.vn (failed), jtbc (body not rendered), hankookilbo, wikitree, isplus, maxmovie, chosun, uahirise, dongascience (search page, rss, home, article).
- Crossref API: 1
- Wikimedia Commons API: 9 searches. Most returned 429, and only the "Shin Min-a" and "baduk board" searches returned results.
- Openverse API: 6
- Image downloads: 9, of which 6 are kept

---

## C1. 농심신라면배: 변상일, 이야마 유타에게 불계승 (2연승). Verdict: **USE**

**Caution:** 6국, 변상일 vs 투샤오위, is played **today, 11-28**. The articles do not give the start time. Check the result before posting. If the game has finished, rewrite the card so it is not stale. Do not write any 6국 result until two outlets report it.

Facts confirmed by 2 or more outlets (연합뉴스 = Y, 스포츠경향 = K, 뉴스핌 = N, 타이젬 = T):
- 27 Nov 2026: 제28회 농심신라면배 세계바둑최강전 본선 2차전 5국, played at 부산 농심호텔 (K writes "호텔농심"). [Y, K, N]
- 변상일 9단 beat 일본 이야마 유타 9단 by **134수 만에 백 불계승**. [Y, K, N, T]
- 이야마 was Japan's 3rd player. [Y, N]
- This is 변상일's 2연승. He first beat 중국 양딩신 9단 in 1차전 4국 in Beijing in September. [Y, K, N]
  - K adds that this stopped 양딩신's 4연승.
- 변상일 was knocked out without a win at the 16th, 23rd, 24th and 25th editions. This is his first winning streak in the tournament. [Y, N; K says "개인 첫 연승"]
- 상대전적 vs 이야마 is now 3승 2패. [Y, N]
- Next game: on **28 Nov** he plays China's 2nd player, **투샤오위 9단**, aiming for a 3연승. [Y, K, N]
  - Y adds that 변상일 is 0승 2패 against 투샤오위.
- Remaining players:
  - Japan: 이치리키 료 and 시바노 도라마루 (2 left). [Y]
  - China: 왕싱하오, 당이페이, 투샤오위, 랴오위안허 (4 left). [Y]
  - Korea: 변상일 plus 신진서, 신민준, 박정환 (4 left). [Y; K says "중국과 나란히 4명"]
- Korea is going for its 7th straight title (7연패). [K, 한국증권신문 headline]
- Prize money: 5억원 for the title. A player who wins 3 in a row gets a 연승 상금 of 1천만원. [Y, N, K]
- He recently won 삼성화재배. [Y, K, N]
- Quotes:
  - "서로 어려운 바둑이었는데 마지막에 이야마가 실수를 해서 운 좋게 이긴 것 같다" [Y]
  - K has a similar quote: "상대도 큰 실수를 해줘 운 좋게 이길 수 있었던 것 같다"
  - "3연승이 걸려 있기는 하지만 부담 없이 최대한 편하게 임할 생각" [K]

Sources:
- https://www.yna.co.kr/amp/view/AKR20261127089651007 (연합뉴스, 2026-11-27 18:05)
- https://sports.khan.co.kr/article/202611271741003 (스포츠경향)
- https://www.newspim.com/news/view/20261127001327 (뉴스핌, 2026-11-27 17:32)
- https://m.tygem.com/news/news_view.html?seq=39895&gubun=2 (타이젬, EUC-KR, only partly readable)
- http://www.ksdaily.co.kr/news/articleView.html?idxno=111663 (한국증권신문, headline only)

Photos:
- No free-license photo of 변상일 was found. The Commons search for "Byun Sang-il" hit a 429 (rate limit) and was not retried.
- `src/c1_baduk_board.jpg`, 1920x1495 (original 3682px)
  - Content: two Korean men playing baduk on a street, in front of a shop shutter. Wooden board, black and white stones.
  - License: CC BY 2.0. Author: Justin Holzworth.
  - Source: https://commons.wikimedia.org/w/index.php?curid=18011701 (File:Baduk.jpg)
  - **자료사진.** The faces of private people are visible. Crop to the board and hands if possible.
- Rejected:
  - Shipwreck-relic go stones: they don't look like baduk.
  - Old Japanese geisha go photo: off-tone.
  - European club photo: small, with identifiable people.

---

## C2. 화성 '지문 무늬' 암석 지형. Verdict: **USE, with caveat**

**Caveat:** this is not a new discovery.
- The image was taken by HiRISE on **28 Aug 2024** and published on **7 Oct 2024**.
- 지디넷 (28 Nov 2026) is re-reporting a ScienceAlert piece.
- On the card, say "2024년 촬영" rather than "새로 포착".

Confirmed facts: 지디넷 (Z) plus the original source, the NASA/UArizona HiRISE release (H). The only other Korean result was vietnam.vn's ko page (a weak source; the fetch failed).
- Spacecraft: **NASA 화성 정찰 궤도선(MRO), HiRISE 카메라.** This is an orbiter, not a rover. [Z, H]
- Place: **데달리아 평원 (Daedalia Planum)**, on the slopes of the Tharsis volcanic region, at **5,455 m** elevation. [Z, H]
- Pattern: bright boulders in long curving rows **5 to 10 m apart** that look like a fingerprint. Not seen elsewhere on Mars before. [Z, H]
  - H's title is "Zen Gardens on Mars", after Japanese dry rock gardens.
- Cause is unknown. Candidate explanations: [Z, H]
  - 'grain size convection' from freeze-thaw or temperature cycling
  - the Brazil nut effect from seismic shaking, if Tharsis is still active
- H closes with: "How these 'Zen gardens' form on Mars remains a mystery, for now." Written by Paul Geissler.
- Image area: about 5 km wide in black and white. [H]
  - Z says "가로 약 5㎞, 세로 약 15㎞".
- Acquired 28 Aug 2024, 14:28 local Mars time, latitude -24.977°, longitude 246.116°E. [H]

Sources:
- https://zdnet.co.kr/view/?no=20261127144837 (지디넷코리아, 2026-11-28 08:42)
- https://www.uahirise.org/ESP_084798_1550 (original HiRISE release)
- https://www.vietnam.vn/ko/bi-an-nhung-hang-da-ky-la-tren-sao-hoa (RSS only, not read)

Photos. Both are **public domain**, per the HiRISE usage policy ("All of the images produced by HiRISE ... are within the public domain"). Credit: NASA/JPL-Caltech/UArizona. Not a same-day photo, so mark (자료사진).
- `src/c2_mars_zen_garden_cut.jpg`, 1318x840
  - Content: close-up of the fingerprint rows, grayscale.
  - **It has a "100 m" scale bar** in the lower left. Crop it out or keep it as a scale hint.
  - Source: https://static.uahirise.org/images/2024/details/cut/ESP_084798_1550.jpg
- `src/c2_mars_zen_garden.jpg`, 1680x666
  - Content: a wider panoramic strip with no scale bar.
  - Source: https://static.uahirise.org/images/2024/details/ESP_084798_1550.jpg

---

## C3. 심해 관해파리 '바르그만니아 피로사'. Verdict: **USE only if one source is accepted (weak)**

Only **one news outlet** was found: 동아사이언스, 28 Nov 08:00, by 조윤진.
- Google News showed no second Korean outlet over 3 days.
- WebSearch found no MBARI press release.
- The **original paper** does exist (Crossref): Mańko, Maciej K. et al., "Integrating mitogenomes, morphology, and ecology reveals depth-structured diversification and two new species of deep-sea *Bargmannia* siphonophores (Cnidaria: Hydrozoa)". *Zoological Journal of the Linnean Society*, published 2026-10-01 (online), DOI 10.1093/zoolinnean/zlag150.

The paper matches 동아사이언스 on the journal and lead author. The facts below come from **동아사이언스 (D) only**, except where marked [D, paper]:
- The research team was led by 마치에이 만코 of 폴란드 그단스크대, working with 미국 몬터레이만수족관연구소 (MBARI) and others. [D, paper]
- Two new species: *Bargmannia pyrosa* and *Bargmannia marlena*. [D; the paper title says "two new species"]
- Published 16 Oct in the 린네학회 동물학 저널 (Zoological Journal of the Linnean Society). [D]
- *B. pyrosa* had been classified as *Bargmannia amoena* in a 1999 study. That means it went by another species' name for more than 20 years. [D]
- Method: ROV filming and collection, plus 155 museum specimens compared by morphology and DNA. [D]
- The genus *Bargmannia* goes from 6 species to 8. [D]
- 'pyrosa' comes from the Greek 'pyr' (fire) because of its red body. 'marlena' is named after Mańko's mother. [D]
- The species live at different depths. The team concludes that depth alone can drive speciation. [D, paper]
- D's photo of *B. pyrosa* was taken at 1,696 m in the Gulf of California (MBARI image, not free to use).

Sources:
- https://www.dongascience.com/ko/news/81105
- https://doi.org/10.1093/zoolinnean/zlag150

Photos. No free *B. pyrosa* photo exists; use a generic siphonophore photo as 자료사진.
- `src/c3_praya_dubia_siphonophore.jpg`, 1672x906
  - Content: a glowing string-like giant siphonophore, *Praya dubia*, on a black background. A different genus.
  - **Crop out the orange "G" panel label (top-left) and the scale bar (bottom-right).** It is a figure panel taken from a paper.
  - License: CC BY 4.0. Author: Catriona Munro, Stefan Siebert et al.
  - Source: https://commons.wikimedia.org/w/index.php?curid=160958892
  - 자료사진.
- `src/c3_bargmannia_si.jpg`, 1125x633
  - Content: a ROV camera view of a faint thin *Bargmannia* sp. colony in deep blue water. ROV hardware fills the left and bottom corners. Weak visually; crop needed.
  - License: CC0, via the Smithsonian NMNH open access program. Creator: NOAA.
  - Source: https://n2t.net/ark:/65665/3981466e0-79d8-48c2-acab-0da3479431ca
  - Same genus as the story. 자료사진.

---

## C4. '재혼 황후' 신민아. Verdict: **USE as a drama roundup; photo is weak**

Not excluded: this is promotional entertainment news, not private life. Avoid anything about her husband 김우빈 beyond the quote, and avoid comments about 'age'.

Outlets: 한국일보 (H), 맥스무비 (M), 일간스포츠 (I), 위키트리 (W), 조선 (C), JTBC (J, headline only), 연합 (Y, headline only).
- **디즈니+ 오리지널 시리즈.** [H, I, W]
- First released **11월 3일**. [I, W]
- 10 episodes, 2 per week on Wednesdays. [WebSearch summary of a tvreport/topstar result; not read directly]
- **Final episode released 11월 25일.** [H; the 25 Nov 재경일보 headline "최종회 공개"]
- Plot: Emperor 소비에슈 (주지훈) tells Empress 나비에 (신민아) he wants a divorce. She asks to remarry 하인리 (이종석) of 서왕국. [H, M]
- Based on a web novel and webtoon with a global fanbase. [M, W]
- According to Disney+, in the 3 days after release it became **the most-watched Disney+ local original worldwide** (역대 디즈니+ 로컬 오리지널 중 전 세계 최다 시청). [I, W]
  - W adds that the record covers Disney+ and Hulu together, per WebSearch.
- FlixPatrol: 2nd in Disney+ global TV shows on day 7. [I]
  - A WebSearch summary of other outlets also gives 2nd and "33개국 1위 (6일 기준)". Treat the country count as unconfirmed.
- 펀덱스, 11월 1주차 (11/2 to 11/8): TV·OTT 통합 드라마 화제성 1위. [I; WebSearch summary of another outlet]
- Interview on 27 Nov at a cafe in 삼청동, Seoul. [H, M]
- 신민아 called it a "첫 한국 로판드라마" and said "우려 알고 있었다". [J headline]
  - Y headline: "K-로판의 출발점".
- On a season 2: "시즌2 나오면 재혼한 황후 나와야죠". [C headline, SPOTV headline, 스포츠경향 headline]
- **Not confirmed, do not use:** "45개국 1위" (스포츠경향 headline only) and "디즈니+ 역대 1위" at the finale (스포츠서울 headline only).

Sources:
- https://www.hankookilbo.com/news/article/A2026112716440001639
- https://www.maxmovie.com/news/articleView.html?idxno=503212
- https://isplus.com/article/view/isp202611100137
- https://www.wikitree.co.kr/articles/1172833
- https://www.chosun.com/entertainments/broadcast/2026/11/27/GUZTQZJTGZRDQYRXMFSTMZBQME/
- https://news.jtbc.co.kr/article/NB12330192

Photos:
- **No usable 신민아 photo.** Every Commons file found is unsuitable:
  - Marie Claire, W magazine and LIONS CREATIVE files: magazine or agency material.
  - 티비텐 TV10 and K-POPIT files: video or broadcast captures.
  - KIYOUNG KIM 2008 Flickr photo, CC BY 2.0: a 2008 press conference shot, only 550px.
  - None of these is "Own work".
- Mood photo: `src/c4_versailles_chandeliers.jpg`, 1920x1440
  - Content: crystal chandeliers and a gilded painted ceiling in the Hall of Mirrors, Palace of Versailles.
  - **Two tourist heads and a camcorder at the bottom edge. Crop the bottom about 15%.**
  - License: CC BY-SA 3.0. Author: BrokenSphere.
  - Source: https://commons.wikimedia.org/w/index.php?curid=8912202 (File:Hall_of_Mirrors,_Palace_of_Versailles_chandeliers.JPG)
  - 자료사진. It is a real palace and not the drama's set, so the caption must not imply it is.

---

## Exclusions
None of the four needs exclusion on content grounds.
- C3 is weak on the two-outlet rule: one outlet plus the original journal paper.
- C2 is old news, re-reported, and needs the "2024년 촬영" framing.
