# 검수표 · 2026-11-25 · 동물 몸 반전 (웜뱃 네모 똥, 코알라 지문, 문어 파란 피, 플라밍고 회색 새끼)

검증·품질관리부(독립 에이전트)가 2026-11-24에 1차 검수했습니다. 파일은 수정하거나 만들지 않았습니다.
- **확인 범위:** GUIDE.md, org/04_검증품질관리부.md, spec.json, manifest.json, brief.md, 참고용 2026-11-24/qa.md를 읽었고, 01.jpg~09.jpg 9장은 Read로 모두 직접 열어 봤습니다.
- **실제 검색:** WebSearch 9회를 했습니다(일반 5회, allowed_domains 제한 4회: britannica.com·si.edu·smithsonianmag.com·nih.gov·livescience.com·abc.net.au·adelaide.edu.au 등).
- **사용하지 않은 것:** WebFetch와 curl은 쓰지 않았습니다(세션 정책상 차단). 그래서 원문을 직접 열지 못했고, 검색 결과 요약과 URL로 확인했습니다.
- **기계 점검:** spec.json과 manifest.json의 캡션이 서로 같고, 긴 대시(U+2014, U+2013)는 0건, '#'는 3개입니다.

## 1. 사실관계: 적합

- **01 표지, 캡션 첫 줄** "웜뱃 똥은 주사위처럼 네모나요": 확인했습니다. 웜뱃 똥은 정육면체에 가까운 모양입니다.
- **02** "장 속에서 만들어져요 / 장 벽에 단단한 부분과 말랑한 부분이 섞여 있어서 수축할 때마다 모서리가 생겨요": 확인했습니다.
  - Soft Matter(2021) 논문 "Intestines of non-uniform stiffness mold the corners of wombat feces"의 내용과 맞습니다. 장 둘레에 단단한 영역 2곳과 유연한 영역 2곳이 있고, 수축 속도가 달라 모서리가 생기며, 약 4만 번 수축하면서 모서리가 점점 뚜렷해집니다. 모양은 장의 마지막 구간에서 잡힙니다.
  - 주저자는 조지아공대 Patricia Yang과 David Hu이고, 태즈메이니아대 Scott Carver가 공동 저자입니다.
  - 출처: https://hu.gatech.edu/wp-content/uploads/2021/01/Hu21-wombat.pdf , https://www.rsc.org/news-events/articles/2021/jan/wombat-poo/ , https://www.smithsonianmag.com/smart-news/scientists-have-solved-mystery-how-wombats-poop-cubes-180976898/ , https://www.pbs.org/wgbh/nova/article/wombats-poop-cubes
- **02 note, 캡션** "2019년 이그노벨상 물리학상": 확인했습니다. 수상자는 Yang, Lee, Chan, Martin, Edwards, Carver, Hu입니다.
  - 주의할 점이 있습니다. 공식 발표가 수상 근거로 든 것은 2018년 APS 유체역학 분과 발표("How Do Wombats Make Cubed Poo?")입니다. Soft Matter 2021 논문은 같은 팀이 수상 뒤에 낸 후속 논문입니다.
  - 그래서 note의 "2019년 수상 연구 / 출처: Soft Matter(2021)"는 2021년 논문이 2019년에 상을 받은 것처럼 읽힐 수 있습니다. 사실 오류는 아니므로 권장 수정으로 분류했습니다.
  - 출처: https://improbable.com/2019/09/12/announcing-the-2019-ig-nobel-prize-winners/ , https://qbios.gatech.edu/node/312
- **03/04 코알라 지문** "현미경으로 봐도 사람 지문과 아주 비슷 / 따로 진화한 걸로 봐요": 확인했습니다.
  - 근거 논문은 Henneberg, Lambert, Leigh(1997) "Fingerprint homoplasy: Koalas and humans"입니다. 초록에 "microscopically and macroscopically similar"라고 적혀 있어 '현미경으로 봐도' 표현에 직접 근거가 있습니다.
  - 논문은 약 7천만 년 넘게 따로 진화한 계통이라고 봅니다. 라이브사이언스도 현미경으로도 쉽게 구별되지 않는다고 썼습니다. 카드의 "~로 봐요"는 표현 수위가 적절합니다.
  - 카드는 "범죄 현장 오인" 소문(근거 없음, Snopes)을 쓰지 않았습니다. 적절합니다.
  - 출처: https://digital.library.adelaide.edu.au/dspace/handle/2440/5433 , https://www.livescience.com/14007-koalas-human-fingerprints.html , https://www.abc.net.au/news/2018-07-01/biometrics-koalas-and-wood-glue-fascinating-fingerprint-facts/9920802 , https://www.snopes.com/fact-check/koala-fingerprints-crime-scene/
- **05/06 문어** "구리가 든 단백질이 산소를 날라서 파랗게 보여요 / 심장 3개": 확인했습니다.
  - 헤모시아닌은 구리 기반 산소 운반 단백질입니다. 산소와 결합하면 파랗고, 산소가 떨어지면 거의 무색입니다.
  - 카드 문장은 "산소를 날라서 파랗게"라 틀린 말은 아니지만, 항상 파랗다고 읽힐 여지가 있습니다. 그래서 권장 수정으로 분류했습니다.
  - 심장은 체심장 1개와 아가미 심장 2개로 모두 3개입니다.
  - 출처: https://www.smithsonianmag.com/science-nature/ten-wild-facts-about-octopuses-they-have-three-hearts-big-brains-and-blue-blood-7625828/ , https://www.britannica.com/animal/cephalopod/Form-and-function , https://www.britannica.com/animal/How-does-hemocyanin-make-cephalopod-blood-blue , https://www.britannica.com/science/hemocyanin , https://www.livescience.com/how-many-hearts-does-an-octopus-have
- **07/08 플라밍고** "새끼 때는 회색 솜털 / 먹이 속 카로티노이드가 쌓여 분홍빛": 확인했습니다.
  - 스미스소니언 국립동물원과 브리태니커 모두 "born a dull gray"이고 색은 유전이 아니라 먹이 때문이라고 합니다. 분홍색이 되기까지 몇 년이 걸립니다.
  - 출처 표기 "브리태니커, 스미스소니언 국립동물원"은 정확합니다.
  - 출처: https://nationalzoo.si.edu/animals/news/why-are-flamingos-pink-and-other-flamingo-facts , https://www.britannica.com/story/why-are-flamingos-pink , https://www.wwt.org.uk/wetland-centres/slimbridge/flamingo-diary/turning-pinker-gradually

## 2. 저작권: 적합
직접 만든 텍스트 카드(단색 배경과 글자)만 있습니다. 타인의 사진·영상·글이나 번역 원문을 그대로 옮긴 부분은 없습니다.

## 3. 광고 표현: 적합
협찬이나 제품 언급, 건강·투자 조언이 없습니다. 과장하거나 근거 없이 단정하는 표현도 없습니다.

## 4. 형식 점검
- **캡션:** 첫 줄이 핵심 반전, 본문 3문단, 공유 유도 1개("공유해서 퀴즈로 내보세요"), 해시태그 정확히 3개(#신기한사실 #잡학상식 #동물상식), 긴 대시 0건, 댓글 답장 약속 없음, manifest 캡션 일치.
- **카드 9장:** 넘치거나 잘린 글자 없음, 페이지 번호 1/9~9/9 정상. 질문 카드(03·05·07)는 답 노출 없음. 본문 카드(02·04·06·08) 모두 '출처:' 있음. 본문 3줄 이내, note 1~2줄.
- **말투와 오탈자:** 해요체 일관, 오탈자 없음.

## 5. 콘텐츠 품질: 91/100
- **좋은 점:** 표지 훅이 강하고, O/X 퀴즈로 끝까지 넘겨 보게 만드는 구성이 좋습니다. 출처도 기관과 논문 위주로 탄탄합니다.
- **감점:** 02 note의 수상 연도와 논문 연도가 같은 연구처럼 붙어 있음, 06의 문어 피 색 설명이 조금 단순함, 캡션의 "이그노벨상 물리학상" 표기 중복.

## 6. 수정해야 할 문구
**필수:** 없습니다.

**권장:**
1. **02 note 1행:** "2019년 이그노벨상 물리학상 수상 연구" → "같은 팀, 2019년 이그노벨 물리학상 수상".
2. **06 본문 2행:** "산소를 날라서 파랗게 보여요." → "산소와 붙으면 파랗게 보여요."
3. **캡션 2문단:** "2019년 이그노벨상 물리학상까지" → "2019년 이그노벨 물리학상까지".

## 7. 최종 게시 가능 여부
사실 오류, 저작권 문제, 광고 문제가 없고 형식 규칙도 모두 충족합니다. 위 권장 3건은 반영하지 않아도 게시할 수 있습니다.

---
제작부 후속 메모(2026-11-24): 권장 3건을 문구 그대로 모두 반영해 재렌더링했습니다(넘침 오류 없음). 02.jpg, 06.jpg를 눈으로 다시 확인했습니다. 표현만 바뀌었고 사실 주장은 위 검수 내용과 같습니다.

최종 판정: 게시 가능
