"""Regenerate the app icons from the au mosaic mark.
Keep the bitmap in sync with AuMark in src/components/Mosaic.tsx.
Run from the repo root:  python3 scripts/brand-icons.py"""

from PIL import Image, ImageDraw

A = [".#####.", "##...##", ".....##", ".######", "##...##", "##...##", ".######"]
U = ["##...##", "##...##", "##...##", "##...##", "##...##", "##...##", ".######"]
GRID = [A[r] + "." + U[r] + "." + ("##" if r >= 5 else "..") for r in range(7)]
BLUES = ["#a8def2", "#6cc4e6", "#3aa9d6", "#1e8fc0", "#1179a8", "#123f66", "#e8f6fb"]
GOLD = "#c2a15c"
NIGHT = (12, 11, 9)


def draw_mark(size):
    img = Image.new("RGBA", (size, size), NIGHT + (255,))
    d = ImageDraw.Draw(img)
    cols, rows = len(GRID[0]), len(GRID)
    pad = size * 0.14
    T = (size - 2 * pad) / cols
    top = (size - rows * T) / 2
    i = 0
    for r in range(rows):
        for c in range(cols):
            i += 1
            if GRID[r][c] != "#":
                continue
            x, y = pad + c * T, top + r * T
            g = min(max(0.5, T * 0.1), T * 0.35)
            col = GOLD if c >= cols - 2 else BLUES[(i * 13 + 5) % len(BLUES)]
            d.rounded_rectangle([x + g, y + g, x + T - g, y + T - g], radius=max(0.5, T * 0.15), fill=col)
    return img


draw_mark(512).save("src/app/icon.png")
draw_mark(180).save("src/app/apple-icon.png")
# favicon: RGBA required, Turbopack rejects RGB ICOs.
fav = draw_mark(48)
fav.save("src/app/favicon.ico", sizes=[(48, 48)])
print("icons rebuilt: icon.png 512, apple-icon.png 180, favicon.ico 48")
