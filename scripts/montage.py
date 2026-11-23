"""Tile review screenshots into one image: python3 scripts/montage.py out.png in1.png in2.png ..."""
import sys
from PIL import Image
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f) for f in files]
w = max(i.width for i in ims); cols = 3
ims = [i.resize((w // 2, int(i.height * (w // 2) / i.width))) for i in ims]
cw = w // 2; rows = (len(ims) + cols - 1) // cols
rh = max(i.height for i in ims)
c = Image.new('RGB', (cols * cw + (cols - 1) * 8, rows * rh + (rows - 1) * 8), 'white')
for n, i in enumerate(ims):
    c.paste(i, ((n % cols) * (cw + 8), (n // cols) * (rh + 8)))
c.save(out)
