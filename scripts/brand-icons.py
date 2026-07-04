"""Regenerate the app icons from the au mosaic mark.
The mark is the client's own sign read closely: smooth rounded
lowercase a and u, with the mosaic living INSIDE the letterforms,
tiny tesserae and visible grout. Keep the geometry and tones in
sync with AuMark in src/components/Mosaic.tsx.
Run from the repo root:  python3 scripts/brand-icons.py"""

from PIL import Image, ImageDraw

# The brand blues and the grout, as the sign wears them.
TONES = ["#2b5fc7", "#1e3e90", "#7fb3e8", "#c8e0f5", "#123064"]
GROUT = "#0a1a3e"
NIGHT = (7, 16, 34)

# Letter skeleton in the SVG's 150x70 space: strokes with round caps.
W_BOX, H_BOX = 150.0, 70.0
STROKE = 17.0


def rline(d, x0, y0, x1, y1, w, fill):
    """A line with round caps."""
    d.line([x0, y0, x1, y1], fill=fill, width=int(round(w)))
    r = w / 2
    for x, y in ((x0, y0), (x1, y1)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def draw_mark(size):
    ss = 4  # supersample for smooth curves
    S = size * ss
    # The mark fills 76% of the tile width, centred.
    k = (S * 0.76) / W_BOX
    ox = (S - W_BOX * k) / 2
    oy = (S - H_BOX * k) / 2

    def X(v):
        return ox + v * k

    def Y(v):
        return oy + v * k

    w = STROKE * k

    # 1. The letters as a mask.
    mask = Image.new("L", (S, S), 0)
    m = ImageDraw.Draw(mask)
    # a bowl: a ring at (38,42) r=18.
    ro, ri = (18 + STROKE / 2) * k, (18 - STROKE / 2) * k
    m.ellipse([X(38) - ro, Y(42) - ro, X(38) + ro, Y(42) + ro], fill=255)
    m.ellipse([X(38) - ri, Y(42) - ri, X(38) + ri, Y(42) + ri], fill=0)
    # a stem.
    rline(m, X(56), Y(24), X(56), Y(60), w, 255)
    # u bowl: the bottom half of a ring at (109,42) r=19.
    uo, ui = (19 + STROKE / 2) * k, (19 - STROKE / 2) * k
    m.pieslice([X(103) - uo, Y(42) - uo, X(103) + uo, Y(42) + uo], 0, 180, fill=255)
    m.pieslice([X(103) - ui, Y(42) - ui, X(103) + ui, Y(42) + ui], 0, 180, fill=0)
    m.rectangle([X(103) - uo, Y(42) - uo, X(103) + uo, Y(42)], fill=0)
    # u stems; the right one runs to the baseline.
    rline(m, X(84), Y(12), X(84), Y(42), w, 255)
    rline(m, X(122), Y(12), X(122), Y(42), w, 255)
    rline(m, X(122), Y(34), X(122), Y(60), w, 255)

    # 2. The tesserae, laid across the whole canvas.
    tiles = Image.new("RGB", (S, S), GROUT)
    t = ImageDraw.Draw(tiles)
    cell = max(6, S // 26)
    g = max(1, cell // 8)
    i = 0
    for yy in range(0, S, cell):
        for xx in range(0, S, cell):
            i += 1
            t.rounded_rectangle(
                [xx + g, yy + g, xx + cell - g, yy + cell - g],
                radius=max(1, cell // 7),
                fill=TONES[(i * 13 + 5) % len(TONES)],
            )

    # 3. The mosaic shows only inside the letters.
    img = Image.new("RGB", (S, S), NIGHT)
    img.paste(tiles, (0, 0), mask)
    return img.resize((size, size), Image.LANCZOS)


draw_mark(512).save("src/app/icon.png")
draw_mark(180).save("src/app/apple-icon.png")
fav = draw_mark(48).convert("RGBA")
fav.save("src/app/favicon.ico", sizes=[(48, 48)])
print("icons rebuilt: icon.png 512, apple-icon.png 180, favicon.ico 48")
