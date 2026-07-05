"""Render the client proposal (docs/client/PROPOSAL-NONSO.md) as paper.

The proposal used to live only as a hand-made PDF whose words drifted from
the markdown and still named a domain since retired. This makes the
markdown the single source: edit the .md, run this, and the PDF is reborn
in the maison's own print manners — serif display, gold letterspaced
eyebrows, a five-tesserae ornament, a quiet house strip, and not one ruled
line the layout does not need.

Usage, from the repo root:
  python3 scripts/proposal.py              # writes docs/client/AU-Mosaic-Proposal.pdf
  python3 scripts/proposal.py OUT.pdf      # writes elsewhere

Fonts fall back to DejaVu, which carries the naira glyph. The write is a
temp-then-rename so it survives a mount that forbids unlink.
"""

import os
import re
import sys
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs/client/PROPOSAL-NONSO.md"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs/client/AU-Mosaic-Proposal.pdf"

# ---- the maison, in print tokens (day palette) --------------------------------
INK = (0x17 / 255, 0x15 / 255, 0x0F / 255)
DUSK = (0x4A / 255, 0x44 / 255, 0x3A / 255)
MIST = (0x74 / 255, 0x6C / 255, 0x57 / 255)
GOLD = (0x85 / 255, 0x6A / 255, 0x30 / 255)
STONE = (0xB8 / 255, 0xB2 / 255, 0xA6 / 255)
ROYAL_DEEP = (0x12 / 255, 0x27 / 255, 0x5E / 255)
ROYAL_NAVY = (0x1E / 255, 0x3E / 255, 0x90 / 255)
ROYAL = (0x2B / 255, 0x5F / 255, 0xC7 / 255)
SKY = (0x7F / 255, 0xB3 / 255, 0xE8 / 255)
GLASS = (0xC8 / 255, 0xE0 / 255, 0xF5 / 255)
TILE_ROW = [ROYAL_DEEP, ROYAL_NAVY, ROYAL, SKY, GLASS]

MARGIN = 58

DEJAVU = "/usr/share/fonts/truetype/dejavu"
SERIF, SANS, SANSB = "PSerif", "PSans", "PSansB"


def rgb(t):
    from reportlab.lib.colors import Color

    return Color(*t)


def register_fonts():
    faces = {
        SERIF: [f"{DEJAVU}/DejaVuSerif.ttf", "/System/Library/Fonts/Supplemental/Georgia.ttf"],
        SANS: [f"{DEJAVU}/DejaVuSans.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf"],
        SANSB: [f"{DEJAVU}/DejaVuSans-Bold.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"],
    }
    for name, paths in faces.items():
        for p in paths:
            if Path(p).exists():
                pdfmetrics.registerFont(TTFont(name, p))
                break
        else:
            sys.exit(f"No font for {name}")


# ---- markdown, only as much as this document speaks ----------------------------
def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def inline(s: str) -> str:
    s = esc(s.strip())
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    # bare urls read as quiet gold, no underline machinery needed
    s = re.sub(r"(https?://[^\s)]+)", r'<font color="#856A30">\1</font>', s)
    return s


def parse_blocks(md: str):
    lines = md.splitlines()
    blocks, i, n = [], 0, len(lines)
    para: list[str] = []

    def flush():
        nonlocal para
        if para:
            blocks.append(("p", " ".join(para)))
            para = []

    while i < n:
        ln = lines[i].rstrip()
        if not ln.strip():
            flush()
            i += 1
            continue
        if ln.startswith("### "):
            flush()
            blocks.append(("h3", ln[4:].strip()))
            i += 1
            continue
        if ln.startswith("## "):
            flush()
            blocks.append(("h2", ln[3:].strip()))
            i += 1
            continue
        if ln.startswith("# "):
            flush()
            blocks.append(("h1", ln[2:].strip()))
            i += 1
            continue
        if ln.strip() == "---":
            flush()
            i += 1
            continue
        if ln.lstrip().startswith("|"):
            flush()
            rows = []
            while i < n and lines[i].lstrip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not re.match(r"^[:\- ]+$", "".join(cells)):  # skip |---| rule
                    rows.append(cells)
                i += 1
            blocks.append(("table", rows))
            continue
        m = re.match(r"^(\d+)\.\s+(.*)", ln.strip())
        if m:
            flush()
            blocks.append(("ol", (m.group(1), m.group(2).strip())))
            i += 1
            continue
        if ln.strip().startswith("- "):
            flush()
            blocks.append(("bullet", ln.strip()[2:].strip()))
            i += 1
            continue
        para.append(ln.strip())
        i += 1
    flush()
    return blocks


# ---- styles --------------------------------------------------------------------
def styles():
    return {
        "h1": ParagraphStyle("h1", fontName=SERIF, fontSize=25, leading=29, textColor=rgb(INK), spaceBefore=6, spaceAfter=4),
        "kicker": ParagraphStyle("kicker", fontName=SANSB, fontSize=7.5, leading=12, textColor=rgb(GOLD), spaceAfter=10, spaceBefore=0),
        "h2": ParagraphStyle("h2", fontName=SERIF, fontSize=15, leading=19, textColor=rgb(INK), spaceBefore=20, spaceAfter=7),
        "h3": ParagraphStyle("h3", fontName=SERIF, fontSize=11.5, leading=15, textColor=rgb(INK), spaceBefore=13, spaceAfter=3),
        "body": ParagraphStyle("body", fontName=SANS, fontSize=9.6, leading=15.2, textColor=rgb(DUSK), spaceAfter=8, alignment=TA_LEFT),
        "li": ParagraphStyle("li", fontName=SANS, fontSize=9.6, leading=15, textColor=rgb(DUSK), leftIndent=16, spaceAfter=4, bulletIndent=2),
        "th": ParagraphStyle("th", fontName=SANSB, fontSize=7.2, leading=10, textColor=rgb(GOLD)),
        "td": ParagraphStyle("td", fontName=SANS, fontSize=9, leading=12.5, textColor=rgb(INK)),
    }


def build_story(blocks, st):
    story = []
    li_open = False
    for kind, val in blocks:
        if kind == "h1":
            story.append(Paragraph(inline(val), st["h1"]))
        elif kind == "p":
            story.append(Paragraph(inline(val), st["body"]))
        elif kind == "h2":
            story.append(Paragraph(esc(val).upper(), st["kicker"]))
        elif kind == "h3":
            story.append(Paragraph(inline(val), st["h3"]))
        elif kind == "ol":
            num, text = val
            story.append(Paragraph(f"{num}.&nbsp;&nbsp;" + inline(text), st["li"]))
        elif kind == "bullet":
            story.append(Paragraph("—&nbsp;&nbsp;" + inline(val), st["li"]))
        elif kind == "table":
            rows = val
            data = [[Paragraph(inline(c), st["th"] if r == 0 else st["td"]) for c in row] for r, row in enumerate(rows)]
            ncol = max(len(r) for r in rows)
            avail = A4[0] - 2 * MARGIN
            # first column wide, rest even
            w0 = avail * (0.40 if ncol <= 3 else 0.34)
            rest = (avail - w0) / (ncol - 1)
            colw = [w0] + [rest] * (ncol - 1)
            t = Table(data, colWidths=colw, hAlign="LEFT")
            t.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                        ("LINEBELOW", (0, 0), (-1, 0), 0.5, rgb(STONE)),
                        ("LINEBELOW", (0, -1), (-1, -1), 0.5, rgb(STONE)),
                    ]
                )
            )
            story.append(Spacer(1, 4))
            story.append(t)
            story.append(Spacer(1, 6))
    return story


# ---- the furniture on every page ----------------------------------------------
def furniture(canvas, doc):
    canvas.saveState()
    w, h = A4
    # top-left eyebrow
    canvas.setFillColorRGB(*GOLD)
    canvas.setFont(SANSB, 7)
    canvas.drawString(MARGIN, h - MARGIN + 20, "A U   M O S A I C")
    # top-right five tesserae, the house in miniature
    tile, gap = 7, 3.5
    tx = w - MARGIN - (tile * len(TILE_ROW) + gap * (len(TILE_ROW) - 1))
    for i, col in enumerate(TILE_ROW):
        canvas.setFillColorRGB(*col)
        canvas.rect(tx + i * (tile + gap), h - MARGIN + 18, tile, tile, stroke=0, fill=1)
    # footer strip
    canvas.setFillColorRGB(*MIST)
    canvas.setFont(SANSB, 6.6)
    canvas.drawString(MARGIN, MARGIN - 22, "A U   M O S A I C   A N D   P O O L   M A T E R I A L S   ·   L A G O S   ·   F O S H A N")
    canvas.setFillColorRGB(*STONE)
    canvas.setFont(SANS, 7.5)
    canvas.drawRightString(w - MARGIN, MARGIN - 22, f"{doc.page}")
    canvas.restoreState()


def main():
    register_fonts()
    md = SRC.read_text(encoding="utf-8")
    blocks = parse_blocks(md)
    st = styles()

    # lift the "Digital Transformation Proposal" line into a gold kicker under
    # the title if present
    story = build_story(blocks, st)

    tmp = OUT.with_suffix(".tmp.pdf")
    doc = BaseDocTemplate(
        str(tmp),
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN + 6,
        bottomMargin=MARGIN,
        title="AU Mosaic — Digital Transformation Proposal",
        author="Dyrane Academy",
    )
    frame = Frame(MARGIN, MARGIN, A4[0] - 2 * MARGIN, A4[1] - 2 * MARGIN - 6, id="body")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=furniture)])
    doc.build(story)

    os.replace(tmp, OUT)
    print(f"paper: {OUT.relative_to(ROOT) if OUT.is_relative_to(ROOT) else OUT}")


if __name__ == "__main__":
    main()
