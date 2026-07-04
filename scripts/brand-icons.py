"""Regenerate the app icons from the au mosaic mark.
Keep the grid, ramp, and gradient arithmetic in sync with AuMark in
src/components/Mosaic.tsx.
Run from the repo root:  python3 scripts/brand-icons.py"""

from PIL import Image, ImageDraw

# Joined as his sign joins them: one shared stroke, the a's bowl
# rounding at its lower left, the u's tail dipping below the
# baseline and hooking back.
GRID = [
    ".######...##.",
    "##...##...##.",
    ".....##...##.",
    ".######...##.",
    "##...##...##.",
    "##...##...##.",
    "..##########.",
    ".........##..",
]

# The light lives in the sign: deep navy bottom-left brightening to
# glass top-right, hash jitter breaking the banding.
RAMP = ["#12275e", "#1e3e90", "#2b5fc7", "#5b8fd9", "#7fb3e8", "#c8e0f5"]
NIGHT = (7, 16, 34)

T = 10
ROWS, COLS = len(GRID), len(GRID[0])
BOX_W, BOX_H = COLS * T, ROWS * T


def tone(r, c, i):
    w = 0.55 * (1 - r / (ROWS - 1)) + 0.45 * (c / (COLS - 1))
    jitter = (((i * 13 + 5) % 5) - 2) * 0.35
    idx = min(len(RAMP) - 1, max(0, round(w * (len(RAMP) - 1) + jitter)))
    return RAMP[idx]


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def draw_mark(size):
    ss = 4
    S = size * ss
    k = (S * 0.80) / BOX_W
    ox = (S - BOX_W * k) / 2
    oy = (S - BOX_H * k) / 2
    img = Image.new("RGBA", (S, S), NIGHT + (255,))
    d = ImageDraw.Draw(img, "RGBA")

    i = 0
    for r in range(ROWS):
        for c in range(COLS):
            i += 1
            if GRID[r][c] != "#":
                continue
            x = ox + (c * T + 1) * k
            y = oy + (r * T + 1) * k
            s = (T - 2) * k
            d.rounded_rectangle(
                [x, y, x + s, y + s],
                radius=max(1, s * 0.2),
                fill=hex_rgb(tone(r, c, i)),
            )
    return img.resize((size, size), Image.LANCZOS)


draw_mark(512).save("src/app/icon.png")
draw_mark(180).save("src/app/apple-icon.png")
fav = draw_mark(48)
fav.save("src/app/favicon.ico", sizes=[(48, 48)])
print("icons rebuilt: icon.png 512, apple-icon.png 180, favicon.ico 48")
