# sasil.kr 캐러셀 게시 (IG Graph API)
# 실행: python -X utf8 publish.py <폴더명> <토큰파일경로>
#   예: python -X utf8 publish.py intro C:\...\sasil_page_token.txt
# 이미지는 GitHub(ssong032/sasil-ig-cards) main에 push된 JPG를 jsDelivr로 가져간다.
import json, sys, time, urllib.parse, urllib.request
from pathlib import Path

IG_ID = "17841462639186718"  # sasil.kr
API = "https://graph.facebook.com/v21.0"
CDN = "https://cdn.jsdelivr.net/gh/ssong032/sasil-ig-cards@main"
ROOT = Path(__file__).parent


def call(method, path, token, **params):
    params["access_token"] = token
    data = urllib.parse.urlencode(params).encode()
    if method == "GET":
        req = urllib.request.Request(f"{API}/{path}?{data.decode()}")
    else:
        req = urllib.request.Request(f"{API}/{path}", data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        err = json.load(e).get("error", {})
        sys.exit(f"API 오류 [{path}]: {err.get('message')} (code {err.get('code')}, sub {err.get('error_subcode')})")


def wait_finished(cid, token):
    for _ in range(30):
        st = call("GET", cid, token, fields="status_code")["status_code"]
        if st == "FINISHED":
            return
        if st in ("ERROR", "EXPIRED"):
            sys.exit(f"컨테이너 {cid} 상태 {st}")
        time.sleep(3)
    sys.exit(f"컨테이너 {cid} 시간 초과")


def main(folder, token_file):
    token = Path(token_file).read_text().strip()
    jpgs = sorted((ROOT / folder).glob("*.jpg"))
    caption = (ROOT / folder / "caption.txt").read_text(encoding="utf-8").strip()
    if not 2 <= len(jpgs) <= 10:
        sys.exit(f"이미지 수 {len(jpgs)}개: 캐러셀은 2~10장")
    kids = []
    for j in jpgs:
        url = f"{CDN}/{folder}/{j.name}"
        cid = call("POST", f"{IG_ID}/media", token, image_url=url, is_carousel_item="true")["id"]
        wait_finished(cid, token)
        kids.append(cid)
        print("이미지 준비:", j.name)
    car = call("POST", f"{IG_ID}/media", token, media_type="CAROUSEL",
               children=",".join(kids), caption=caption)["id"]
    wait_finished(car, token)
    mid = call("POST", f"{IG_ID}/media_publish", token, creation_id=car)["id"]
    link = call("GET", mid, token, fields="permalink")["permalink"]
    print("게시 완료:", link)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
