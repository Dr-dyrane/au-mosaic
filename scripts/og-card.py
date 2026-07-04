"""Rebuild public/og.png from the owned dusk-villa frame.
Crop a 1200x630 band (villa line + waterline + mosaic foreground),
grade the edges darker, set the serif wordmark bottom-left in ivory
and gold. Run from the au-mosaic repo root once the image exists at
public/media/dusk-villa.jpg."""

from PIL import Image, ImageDraw, ImageFont, ImageEnhance

SRC = "public/media/dusk-villa.jpg"
OUT = "public/og.png"
W, H = 1200, 630

img = Image.open(SRC).convert("RGB")
# Crop band: keep villa + waterline in the upper-middle of the source.
sw, sh = img.size
target_ratio = W / H
band_h = int(sw / target_ratio)
top = int(sh * 0.18)  # start below the empty sky
if top + band_h > sh:
    top = sh - band_h
img = img.crop((0, top, sw, top + band_h)).resize((W, H), Image.LANCZOS)
img = ImageEnhance.Color(img).enhance(1.06)

# Darken the lower third so the words sit in the shadow.
overlay = Image.new("L", (W, H), 0)
od = ImageDraw.Draw(overlay)
for y in range(H):
    a = int(max(0, (y / H - 0.45)) * 300)
    od.line([(0, y), (W, y)], fill=min(a, 165))
img.paste(Image.new("RGB", (W, H), (12, 11, 9)), (0, 0), overlay)

d = ImageDraw.Draw(img)
caps = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)

# The owner's own sign carries the card: his mark, trimmed of its
# whisper-alpha, set in the shadowed band.
mark = Image.open("assets/brand/au-logo-master.png").convert("RGBA")
ma = mark.split()[3].point(lambda v: 255 if v > 24 else 0)
mark = mark.crop(ma.getbbox())
mh = 96
mark = mark.resize((round(mark.width * mh / mark.height), mh), Image.LANCZOS)
img.paste(mark, (70, H - 200), mark)

# Letterspaced eyebrow in the brand sky blue.
x = 74
for ch in "THE HOUSE OF MOSAIC":
    d.text((x, H - 84), ch, font=caps, fill=(127, 179, 232))
    x += d.textlength(ch, font=caps) + 7

img.save(OUT, "PNG")
print("og.png rebuilt", img.size)
