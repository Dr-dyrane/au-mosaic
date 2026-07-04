"""Regenerate the app icons from the owner's logo file.
The canonical mark is his art at assets/brand/au-logo-master.png;
this script trims the whisper-alpha padding, sets the mark on the
royal night canvas, and writes the icon set. The chrome's
theme-following pixel mark lives separately in AuMark
(src/components/Mosaic.tsx) and is not generated here.
Run from the repo root:  python3 scripts/brand-icons.py"""

from PIL import Image

MASTER = "assets/brand/au-logo-master.png"
NIGHT = (7, 16, 34, 255)


def trimmed():
    im = Image.open(MASTER).convert("RGBA")
    a = im.split()[3].point(lambda v: 255 if v > 24 else 0)
    return im.crop(a.getbbox())


def draw_mark(size, mark):
    img = Image.new("RGBA", (size, size), NIGHT)
    # The mark fills 78% of the tile's width, centred.
    w = int(size * 0.78)
    h = int(w * mark.height / mark.width)
    if h > size * 0.82:
        h = int(size * 0.82)
        w = int(h * mark.width / mark.height)
    m = mark.resize((w, h), Image.LANCZOS)
    img.paste(m, ((size - w) // 2, (size - h) // 2), m)
    return img


mark = trimmed()
draw_mark(512, mark).save("src/app/icon.png", optimize=True)
draw_mark(180, mark).save("src/app/apple-icon.png", optimize=True)
draw_mark(48, mark).save("src/app/favicon.ico", sizes=[(48, 48)])
print("icons rebuilt from the owner's logo: 512, 180, 48")
