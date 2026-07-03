"""The exclusive document: an AU Mosaic invoice as paper worth keeping.

Maison rules, printed: generous whitespace, serif display, gold
eyebrows letterspaced wide, tabular numbers in quiet sans, and not
one ruled line anywhere; weight and air do the separating. Customer
sees given prices only; the gap to list stays the owner's number.

Usage, from the repo root:
  python3 scripts/invoice.py --sample
  python3 scripts/invoice.py --order 8f14e45f
  python3 scripts/invoice.py --order 8f14e45f --png

--order accepts the full uuid or its first eight characters and
reads DATABASE_URL from .env (pip install psycopg2-binary once).
Output lands in invoices/, which git ignores. --png asks poppler's
pdftoppm for a 300dpi image beside the PDF; without poppler the PDF
alone is the artifact. Fonts prefer the maison stack (Didot, then
Bodoni 72, then Georgia) and fall back to DejaVu, checking the
naira glyph before trusting a face with money."""

import argparse
import os
import subprocess
import sys
from datetime import date, datetime
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "invoices"

# ---- the maison, in print tokens (day palette; toner has one theme) ----
INK = (0x17 / 255, 0x15 / 255, 0x0F / 255)
DUSK = (0x5D / 255, 0x56 / 255, 0x4A / 255)
MIST = (0x74 / 255, 0x6C / 255, 0x57 / 255)
GOLD = (0x85 / 255, 0x6A / 255, 0x30 / 255)
BRASS = (0xC2 / 255, 0xA1 / 255, 0x5C / 255)
GOLD_DEEP = (0x8F / 255, 0x74 / 255, 0x34 / 255)
STONE = (0xB8 / 255, 0xB2 / 255, 0xA6 / 255)

TILE_ROW = [BRASS, GOLD_DEEP, DUSK, STONE, INK]

PAGE_W, PAGE_H = A4
MARGIN = 64
NAIRA = "₦"

SITE = {
    "short": "AU Mosaic",
    "name": "AU Mosaic and Pool Materials",
    "location": "Agric Market, Lagos",
    "phone": "+234 707 755 0283",
    "strip": "AU MOSAIC AND POOL MATERIALS · LAGOS · FOSHAN",
}


# ---- fonts: the maison stack, honestly cascaded --------------------------------
def register(name: str, candidates) -> str | None:
    for path, index in candidates:
        if Path(path).exists():
            try:
                pdfmetrics.registerFont(TTFont(name, path, subfontIndex=index))
                return name
            except Exception:
                continue
    return None


def has_glyph(font_name: str, ch: str) -> bool:
    try:
        face = pdfmetrics.getFont(font_name).face
        return bool(face.charToGlyph.get(ord(ch)))
    except Exception:
        return False


def load_fonts():
    serif = register(
        "MaisonSerif",
        [
            ("/System/Library/Fonts/Supplemental/Didot.ttc", 0),
            ("/System/Library/Fonts/Supplemental/Bodoni 72.ttc", 0),
            ("/System/Library/Fonts/Supplemental/Georgia.ttf", 0),
            ("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 0),
        ],
    )
    sans = register(
        "MaisonSans",
        [
            ("/System/Library/Fonts/Supplemental/Arial.ttf", 0),
            ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 0),
        ],
    )
    sans_bold = register(
        "MaisonSansBold",
        [
            ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 0),
            ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 0),
        ],
    )
    if not (serif and sans and sans_bold):
        sys.exit("No usable fonts found on this machine.")
    return serif, sans, sans_bold


# ---- money: integer kobo in, naira text out ------------------------------------
def naira_text(kobo: int, money_font: str) -> str:
    sign = "-" if kobo < 0 else ""
    n = abs(int(kobo)) // 100
    symbol = NAIRA if has_glyph(money_font, NAIRA) else "NGN "
    return f"{sign}{symbol}{n:,}"


def fmt_date(d) -> str:
    if isinstance(d, str):
        d = datetime.fromisoformat(d)
    return d.strftime("%-d %B %Y") if os.name != "nt" else d.strftime("%d %B %Y")


# ---- data -----------------------------------------------------------------------
def sample_order():
    today = date.today()
    return {
        "id": "8f14e45f-ceea-467f-a8d9-52b6f0f0c8a1",
        "created_at": today.replace(day=max(1, today.day - 12) if today.day > 12 else 1),
        "customer": {"name": "Adaeze Okonkwo", "phone": "0803 555 0100", "area": "Lekki"},
        "lines": [
            {"name": "Emerald pool blend", "note": "", "qty": 24, "given": 18_500_00},
            {"name": "Midnight blends", "note": "feature wall", "qty": 12, "given": 22_000_00},
            {"name": "Gum cement, pool grade", "note": "", "qty": 6, "given": 9_500_00},
            {"name": "Fixing and site work", "note": "two rooms", "qty": 1, "given": 350_000_00},
        ],
        "payments": [
            {"at": today.replace(day=max(1, today.day - 9) if today.day > 9 else 2), "amount": 400_000_00, "method": "transfer", "note": "Zenith"},
            {"at": today.replace(day=max(1, today.day - 2) if today.day > 2 else 3), "amount": 250_000_00, "method": "cash", "note": ""},
        ],
        "facts": {"phone": SITE["phone"], "location": SITE["location"]},
    }


def env_database_url() -> str | None:
    env = ROOT / ".env"
    if not env.exists():
        return None
    for line in env.read_text().splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip()
    return None


def fetch_order(needle: str):
    try:
        import psycopg2  # type: ignore
    except ImportError:
        sys.exit("psycopg2 is not installed. Once: pip3 install psycopg2-binary")
    url = env_database_url()
    if not url:
        sys.exit(".env with DATABASE_URL not found; run from the repo root.")
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute(
        """select o.id, o.created_at, c.name, c.phone, c.area
           from orders o join customers c on c.id = o.customer_id
           where o.id::text = %s or o.id::text like %s limit 2""",
        (needle, needle.lower() + "%"),
    )
    rows = cur.fetchall()
    if len(rows) == 0:
        sys.exit("That order is not in the book.")
    if len(rows) > 1:
        sys.exit("Eight characters match two orders; paste the full id.")
    oid, created, cname, cphone, carea = rows[0]
    cur.execute(
        """select coalesce(p.name, nullif(i.description, ''), 'Work'),
                  case when p.name is not null then i.description else '' end,
                  i.quantity, i.given_price_kobo
           from order_items i left join pieces p on p.slug = i.piece_slug
           where i.order_id = %s""",
        (oid,),
    )
    lines = [
        {"name": r[0], "note": r[1] or "", "qty": r[2], "given": r[3]} for r in cur.fetchall()
    ]
    cur.execute(
        "select paid_at, amount_kobo, method, note from payments where order_id = %s order by paid_at",
        (oid,),
    )
    payments = [
        {"at": r[0], "amount": r[1], "method": r[2], "note": r[3] or ""} for r in cur.fetchall()
    ]
    facts = {"phone": SITE["phone"], "location": SITE["location"]}
    try:
        cur.execute("select key, value from settings where key in ('phone_display','location')")
        for k, v in cur.fetchall():
            if k == "phone_display" and v:
                facts["phone"] = v
            if k == "location" and v:
                facts["location"] = v
    except Exception:
        conn.rollback()
    conn.close()
    return {
        "id": str(oid),
        "created_at": created,
        "customer": {"name": cname, "phone": cphone or "", "area": carea or ""},
        "lines": lines,
        "payments": payments,
        "facts": facts,
    }


# ---- the sheet -------------------------------------------------------------------
def eyebrow(c, x, y, text, align="left", color=GOLD):
    """Letterspaced micro caps, the maison's 0.18em in print. Char
    spacing lives on the text object, not the canvas."""
    size, space = 6.8, 1.7
    w = c.stringWidth(text, "MaisonSansBold", size) + space * max(0, len(text) - 1)
    t = c.beginText()
    t.setFont("MaisonSansBold", size)
    t.setCharSpace(space)
    t.setFillColorRGB(*color)
    t.setTextOrigin(x - w if align == "right" else x, y)
    t.textOut(text)
    # Tc persists in the content stream; hand it back before leaving,
    # or the whole page inherits the tracking.
    t.setCharSpace(0)
    c.drawText(t)


def truncate(c, text, font, size, max_w):
    if c.stringWidth(text, font, size) <= max_w:
        return text
    while text and c.stringWidth(text + "...", font, size) > max_w:
        text = text[:-1]
    return text.rstrip() + "..."


def draw_invoice(order, out_pdf: Path):
    c = canvas.Canvas(str(out_pdf), pagesize=A4)
    c.setTitle(f"AU Mosaic invoice · order {order['id'][:8]}")
    right = PAGE_W - MARGIN

    billed = sum(l["given"] * l["qty"] for l in order["lines"])
    paid = sum(p["amount"] for p in order["payments"])
    balance = billed - paid
    money_serif = "MaisonSerif" if has_glyph("MaisonSerif", NAIRA) else "MaisonSans"

    def header(y):
        # The wordmark and the house facts.
        c.setFillColorRGB(*INK)
        c.setFont("MaisonSerif", 21)
        c.drawString(MARGIN, y, "AU Mosaic")
        c.setFont("MaisonSans", 8)
        c.setFillColorRGB(*DUSK)
        for i, line in enumerate([SITE["name"], order["facts"]["location"], order["facts"]["phone"]]):
            c.drawString(MARGIN, y - 16 - i * 11.5, line)
        # The only ornament: five tesserae, the house in miniature.
        tile, gap = 7, 3.5
        tx = right - (tile * len(TILE_ROW) + gap * (len(TILE_ROW) - 1))
        for i, col in enumerate(TILE_ROW):
            c.setFillColorRGB(*col)
            c.rect(tx + i * (tile + gap), y + 8, tile, tile, stroke=0, fill=1)
        c.setFillColorRGB(*INK)
        c.setFont("MaisonSerif", 26)
        c.drawRightString(right, y - 24, "Invoice")
        c.setFont("MaisonSans", 8)
        c.setFillColorRGB(*DUSK)
        meta = [
            f"Order {order['id'][:8]}",
            f"Opened {fmt_date(order['created_at'])}",
            f"Issued {fmt_date(datetime.now())}",
        ]
        for i, line in enumerate(meta):
            c.drawRightString(right, y - 40 - i * 11.5, line)
        return y - 78

    y = header(PAGE_H - MARGIN - 14)

    # Billed to.
    y -= 26
    eyebrow(c, MARGIN, y, "BILLED TO")
    c.setFillColorRGB(*INK)
    c.setFont("MaisonSerif", 13.5)
    c.drawString(MARGIN, y - 18, order["customer"]["name"])
    contact = " · ".join(x for x in (order["customer"]["phone"], order["customer"]["area"]) if x)
    if contact:
        c.setFont("MaisonSans", 8.5)
        c.setFillColorRGB(*DUSK)
        c.drawString(MARGIN, y - 31, contact)
    y -= 62

    # The lines. Columns breathe; nothing is ruled.
    col_qty, col_each, col_total = right - 150, right - 78, right
    name_w = col_qty - MARGIN - 70

    def table_head(yy):
        eyebrow(c, MARGIN, yy, "ITEM")
        eyebrow(c, col_qty, yy, "QTY", align="right")
        eyebrow(c, col_each, yy, "EACH", align="right")
        eyebrow(c, col_total, yy, "TOTAL", align="right")
        return yy - 20

    y = table_head(y)
    row_h = 24
    for line in order["lines"]:
        if y < 170:
            c.showPage()
            y = PAGE_H - MARGIN - 20
            y = table_head(y)
        c.setFillColorRGB(*INK)
        c.setFont("MaisonSerif", 10.5)
        name = truncate(c, line["name"], "MaisonSerif", 10.5, name_w)
        c.drawString(MARGIN, y, name)
        if line["note"]:
            c.setFont("MaisonSans", 7.5)
            c.setFillColorRGB(*MIST)
            c.drawString(
                MARGIN, y - 9.5, truncate(c, line["note"], "MaisonSans", 7.5, name_w)
            )
        c.setFont("MaisonSans", 9.5)
        c.setFillColorRGB(*INK)
        c.drawRightString(col_qty, y, f"{line['qty']:,}")
        c.drawRightString(col_each, y, naira_text(line["given"], "MaisonSans"))
        c.drawRightString(col_total, y, naira_text(line["given"] * line["qty"], "MaisonSans"))
        y -= row_h + (8 if line["note"] else 0)

    # Totals, right-shouldered.
    y -= 8
    c.setFont("MaisonSans", 9)
    c.setFillColorRGB(*DUSK)
    c.drawRightString(col_each, y, "Billed")
    c.setFillColorRGB(*INK)
    c.drawRightString(col_total, y, naira_text(billed, "MaisonSans"))
    y -= 15
    c.setFillColorRGB(*DUSK)
    c.drawRightString(col_each, y, "Paid to date")
    c.setFillColorRGB(*INK)
    c.drawRightString(col_total, y, naira_text(paid, "MaisonSans"))
    y -= 24
    word = "BALANCE DUE" if balance > 0 else ("SETTLED" if balance == 0 else "IN CREDIT")
    eyebrow(c, col_total, y, word, align="right")
    y -= 22
    c.setFillColorRGB(*INK)
    c.setFont(money_serif, 19)
    c.drawRightString(col_total, y, naira_text(abs(balance), money_serif))

    # Payments received.
    if order["payments"]:
        y -= 44
        eyebrow(c, MARGIN, y, "PAYMENTS RECEIVED")
        c.setFont("MaisonSans", 8.5)
        c.setFillColorRGB(*DUSK)
        for p in order["payments"]:
            y -= 13.5
            note = f" · {p['note']}" if p["note"] else ""
            c.drawString(
                MARGIN,
                y,
                f"{fmt_date(p['at'])} · {naira_text(p['amount'], 'MaisonSans')} by {p['method']}{note}",
            )

    # The close, and the house strip.
    c.setFont("MaisonSerif", 9.5)
    c.setFillColorRGB(*DUSK)
    c.drawString(
        MARGIN,
        MARGIN + 26,
        f"Thank you for building with {SITE['short']}.",
    )
    c.setFont("MaisonSans", 8)
    c.drawString(MARGIN, MARGIN + 13, f"Questions live on WhatsApp: {order['facts']['phone']}")
    eyebrow(c, MARGIN, MARGIN - 6, SITE["strip"], color=MIST)

    c.save()


# ---- run -------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Render an AU Mosaic invoice as paper.")
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--order", help="order id, full uuid or first eight characters")
    group.add_argument("--sample", action="store_true", help="render the demo order")
    ap.add_argument("--png", action="store_true", help="also render a 300dpi PNG (needs poppler)")
    args = ap.parse_args()

    load_fonts()
    order = sample_order() if args.sample else fetch_order(args.order)

    OUT_DIR.mkdir(exist_ok=True)
    out_pdf = OUT_DIR / f"invoice-{order['id'][:8]}.pdf"
    draw_invoice(order, out_pdf)
    print(f"paper: {out_pdf.relative_to(ROOT)}")

    if args.png:
        try:
            subprocess.run(
                ["pdftoppm", "-r", "300", "-png", "-singlefile", str(out_pdf), str(out_pdf.with_suffix(""))],
                check=True,
                capture_output=True,
            )
            print(f"paper: {out_pdf.with_suffix('.png').relative_to(ROOT)}")
        except (FileNotFoundError, subprocess.CalledProcessError):
            print("png skipped: poppler's pdftoppm is not on this machine; the PDF stands alone.")


if __name__ == "__main__":
    main()
