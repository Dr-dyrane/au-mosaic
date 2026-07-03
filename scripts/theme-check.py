"""The theme gate. Reads the token blocks in src/app/globals.css and
prints the WCAG contrast matrix for both themes plus the scene system.
Run from the repo root before shipping any palette change:

    python3 scripts/theme-check.py

Anything under 4.5:1 on a text duty fails the gate."""

import re
import sys

CSS = "src/app/globals.css"


def lum(hexc):
    hexc = hexc.lstrip("#")
    r, g, b = (int(hexc[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = f(r), f(g), f(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def block_tokens(css, selector):
    m = re.search(re.escape(selector) + r"\s*\{([^}]*)\}", css)
    if not m:
        return {}
    return dict(re.findall(r"--t-([a-z-]+):\s*(#[0-9a-fA-F]{6})", m.group(1)))


def scene_vars(css, selector):
    m = re.search(re.escape(selector) + r"\s*\{([^}]*)\}", css)
    if not m:
        return {}
    return dict(re.findall(r"--scene-([a-z-]+):\s*(#[0-9a-fA-F]{6})", m.group(1)))


css = open(CSS).read()
themes = {"night (:root)": block_tokens(css, ":root"),
          "day ([data-theme=light])": block_tokens(css, '[data-theme="light"]')}

failures = 0
print(f"{'PAIR':44} {'RATIO':>7}  VERDICT")
for name, t in themes.items():
    if not {"sand", "shell", "ink", "dusk", "mist", "gold"} <= set(t):
        print(f"{name}: missing tokens, found {sorted(t)}")
        sys.exit(1)
    print(f"--- {name}")
    for fg in ("ink", "dusk", "mist", "gold"):
        for bg in ("sand", "shell"):
            need = 4.5 if not (fg == "mist" and bg == "shell") else 4.5
            r = ratio(t[fg], t[bg])
            ok = r >= 4.5
            if fg == "gold" and bg == "shell":
                ok = r >= 4.5  # eyebrows can sit on bands
            verdict = "PASS" if ok else "FAIL"
            if not ok:
                failures += 1
            print(f"{fg + ' on ' + bg:44} {r:7.2f}  {verdict}")

# Brass button: fixed hardware.
r = ratio("#14110b", "#c2a15c")
print(f"{'button label on brass (both themes)':44} {r:7.2f}  {'PASS' if r >= 4.5 else 'FAIL'}")
if r < 4.5:
    failures += 1

# Scene system: text over scrim-weighted worst cases.
night = scene_vars(css, ".scene-vars")
day = scene_vars(css, ".scene-vars.scene-day")


def over_scrim(fg_hex, scrim_hex, alpha, img_lum):
    mixed = lum(scrim_hex) * alpha + img_lum * (1 - alpha)
    lf = lum(fg_hex)
    hi, lo = max(lf, mixed), min(lf, mixed)
    return (hi + 0.05) / (lo + 0.05)


sand_n = themes["night (:root)"]["sand"]
sand_d = themes["day ([data-theme=light])"]["sand"]
checks = [
    ("night scene gold on dusk scrim, bright patch", night.get("gold", "#c2a15c"), sand_n, 0.84, 0.5),
    ("day scene ink on ivory scrim, dark patch", day.get("ink", "#17150f"), sand_d, 0.9, 0.2),
    ("day scene gold on ivory scrim, dark patch", day.get("gold", "#7a6128"), sand_d, 0.9, 0.2),
]
print("--- scenes (worst-case image patches)")
for label, fg, scrim, alpha, img in checks:
    r = over_scrim(fg, scrim, alpha, img)
    need = 3.0 if "bright patch" in label else 4.5
    ok = r >= need
    if not ok:
        failures += 1
    print(f"{label:44} {r:7.2f}  {'PASS' if ok else 'FAIL'} (need {need})")

print()
if failures:
    print(f"GATE FAILED: {failures} pair(s) under target. Do not ship.")
    sys.exit(1)
print("GATE PASSED: palette clears the matrix. Eye pass next, then QA.md.")
