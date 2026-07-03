"""The theme gate, multi-palette. Reads every palette block in
src/app/globals.css and prints the WCAG contrast matrix for each house
in both modes, plus the scene system and the brass button per palette.
Run from the repo root before shipping any palette change:

    python3 scripts/theme-check.py

Anything under target on a text duty fails the gate."""

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
    la, lb = (lum(a), lum(b)) if isinstance(a, str) else (a, b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def block(css, selector):
    m = re.search(re.escape(selector) + r"\s*\{([^}]*)\}", css)
    if not m:
        return {}
    body = m.group(1)
    toks = dict(re.findall(r"--t-([a-z-]+):\s*(#[0-9a-fA-F]{6})", body))
    return toks


css = open(CSS).read()

palettes = {
    "maison": (":root", '[data-theme="light"]'),
    "lagoon": ('[data-palette="lagoon"]', '[data-palette="lagoon"][data-theme="light"]'),
    "terracotta": ('[data-palette="terracotta"]', '[data-palette="terracotta"][data-theme="light"]'),
    "onyx": ('[data-palette="onyx"]', '[data-palette="onyx"][data-theme="light"]'),
}

failures = 0
for pname, (dark_sel, light_sel) in palettes.items():
    dark = block(css, dark_sel)
    light = block(css, light_sel)
    # light blocks inherit hardware tokens from the dark block
    hw = {k: dark[k] for k in ("brass", "scene-gold-night", "scene-gold-day") if k in dark}
    print(f"\n=== {pname} ===")
    for mode, t in (("night", dark), ("day", light)):
        missing = {"sand", "shell", "ink", "dusk", "mist", "gold"} - set(t)
        if missing:
            print(f"  {mode}: missing tokens {sorted(missing)}")
            failures += 1
            continue
        for fg in ("ink", "dusk", "mist", "gold"):
            for bg in ("sand", "shell"):
                r = ratio(t[fg], t[bg])
                ok = r >= 4.5
                if not ok:
                    failures += 1
                print(f"  {mode:5} {fg:4} on {bg:5} {r:6.2f} {'PASS' if ok else 'FAIL'}")
    # brass button label
    if "brass" in hw:
        r = ratio("#14110b", hw["brass"])
        ok = r >= 4.5
        if not ok:
            failures += 1
        print(f"  button label on brass       {r:6.2f} {'PASS' if ok else 'FAIL'}")
    # scenes: worst-case image patches under the palette's scrims
    sn, sd = dark.get("sand"), light.get("sand")
    if sn and sd and "scene-gold-night" in hw and "scene-gold-day" in hw:
        def over(fg, scrim, alpha, img):
            mixed = lum(scrim) * alpha + img * (1 - alpha)
            lf = lum(fg)
            hi, lo = max(lf, mixed), min(lf, mixed)
            return (hi + 0.05) / (lo + 0.05)
        checks = [
            ("night scene gold, bright patch", hw["scene-gold-night"], sn, 0.84, 0.5, 3.0),
            ("night scene white ink, bright patch", "#ffffff", sn, 0.84, 0.5, 4.5),
            ("day scene ink, dark patch", light.get("ink", "#111111"), sd, 0.9, 0.2, 4.5),
            ("day scene gold, dark patch", hw["scene-gold-day"], sd, 0.9, 0.2, 4.5),
        ]
        for label, fg, scrim, alpha, img, need in checks:
            r = over(fg, scrim, alpha, img)
            ok = r >= need
            if not ok:
                failures += 1
            print(f"  {label:34} {r:6.2f} {'PASS' if ok else 'FAIL'} (need {need})")

print()
if failures:
    print(f"GATE FAILED: {failures} pair(s) under target. Do not ship.")
    sys.exit(1)
print("GATE PASSED: every house clears the matrix. Eye pass next, then QA.md.")
