# 인스타 API는 JPEG만 받으므로 게시용 PNG를 JPG로 변환한다.
# 실행: python -X utf8 to_jpg.py
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent
for folder in ["intro", "pinned2_geo", "pinned3_myths"]:
    for png in sorted((ROOT / folder).glob("*.png")):
        Image.open(png).convert("RGB").save(png.with_suffix(".jpg"), quality=95)
print("done")
