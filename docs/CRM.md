# The back office · the law

DESIGN.md governs the flagship. This governs the CRM. Every Phase 2
screen is measured against this document before it ships.

## Why this exists

Nonso's voice note asked for one thing: to manage his mosaic gallery
himself. His discovery record named the quiet losses: debts forgotten
on paper, discounts given too deep, records that live in notebooks.
So the CRM has one heart and two duties. The heart is the gallery.
The duties are to make the two losses visible.

## The heart: the piece record

The main feature of this CRM is the piece. Not a row in a table: a
record with a face, treated with the same respect the flagship gives
it. Everything about one piece lives in one place:

- Identity: name, slug (the same key the site has used since day one),
  the words on its page.
- The look: photographs (night and day), tile colours, how it renders
  when there is no photo yet.
- The stockroom: sheets in stock, warn-me-at level, when the next
  container lands.
- The money: price note today; price bands when he is ready.
- Presence: on the site or off it, one switch.
- Provenance, eventually: which orders sold it, which projects used
  it, so a piece carries its own history.

Customers, orders, debts, and deliveries all orbit the piece. When an
order line is written, it points at a piece. When a project is
published, it lists its pieces. The gallery is not a module of the
CRM; the CRM is the gallery's back room.

## The ten laws

1. The morning glance answers one question: is the house okay? Five
   numbers in three seconds, phone in one hand. Detail is behind a tap.
2. One room, one job. Never a mega-table. Card, then detail, then
   action: the same progressive disclosure as the flagship.
3. One gold button per screen. If a screen needs two, it is two
   screens. Everything else whispers in link-hair.
4. Shop-floor language, never database language. Sheets in stock,
   warn me at, container lands, who owes what. If the owner needs a
   manual, the screen failed. Empty states teach their own rooms.
   Forms answer back in sentences.
5. WhatsApp is the bloodstream; the CRM is the memory. Enquiries flow
   in from the site's taps, every customer opens into their chat,
   updates compose as prefilled messages. It remembers what the chats
   forget. It never replaces how he sells.
6. The invisible losses become numbers. List price beside given price
   on every order line: the discount leak, on screen. Payments against
   balances: forgotten debts, on screen. This is how the CRM pays for
   itself.
7. Same skin, same laws. Maison tokens, the type ramp, no borders,
   concentric geometry, both suns, all four houses. Walking from the
   gallery into the back room of the same building.
8. Nothing is ever lost. No hard deletes anywhere. Pieces go off the
   site; records archive. A man moving off paper must never fear the
   machine ate his book. An audit trail arrives when staff do.
9. Speed is the luxury. Saves answer instantly and in words. Money is
   integer kobo, so arithmetic is exact. Every open shows fresh truth.
10. One source of truth, eventually. The seam flips, the flagship
    reads what he edits, photos upload from his phone, real projects
    replace the concept studies. Site and back office become one
    organism.

## The rooms

| Room | Job | Status |
|---|---|---|
| The door | One password, signed cookie | Open |
| The morning glance | Five numbers, is the house okay | Open |
| The stockroom | Pieces grouped by range, stock states | Open |
| The piece record | One form, one Save: words, look, stock, presence | Open, photos pending |
| Customers | People, their chats, their history | Next |
| Orders | Lines with list and given price, the pipeline | Next |
| Who owes what | Balances, oldest first | Next |
| Deliveries | Address, driver, status | Planned |
| Invoices | A PDF from an order | Planned |
| Photos | Phone upload to Vercel Blob, night and day | Planned |
| The seam flip | Flagship reads the database | Last, deliberately |

## The measure of done

The owner opens his phone at the market and answers a customer's
"do you have the midnight blend, and how much" in under ten seconds,
from the stockroom, without leaving WhatsApp for more than one tap.
That is the bar every room must clear.

End state in one sentence: he runs a ten-year import business from
his phone with the same calm as browsing his own gallery.
