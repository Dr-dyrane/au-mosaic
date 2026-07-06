# The order lifecycle, and the AI that reads it

Status: engine built and verified (2026-07-06). Review screen is the next lane.
Owner action needed: `CLAUDE_API_KEY` is set. Nothing to install.

## The thesis, in one line

WhatsApp stays the shop counter. The book learns to read a WhatsApp chat into a
draft order, the owner confirms it in one glance, and the money is tracked from
the first tap to settled. The AI reads. The owner decides. The price is never
the model's to set.

Everything below follows one rule: we do not change how Nonso sells. We only
make what happens around the selling remember itself, and we take the typing off
his hands where a machine can do it and he can check it in seconds.

## 1. The lifecycle he already lives, now tracked end to end

The path a sale walks, and where the book stands at each step. The five stages
are the exact `order_status` values already in the schema, so the ledger does
not move; we are adding the intake and the reading, not reshaping the book.

| Stage | Plain name | What just happened | Where the money sits | Screen |
| --- | --- | --- | --- | --- |
| `enquiry` | New enquiry | Someone messaged, or tapped a price on the site. Nothing promised. | Nothing owed | Customer, Fresh from the window |
| `quoted` | Quote sent | He priced specific pieces and sent it back on WhatsApp. | Quoted, unconfirmed | Order |
| `deposit` | Deposit paid | They committed. Part payment is in. The order is live. | Part paid, balance owing | Order, Payment |
| `delivered` | Delivered | Goods left the building. Stock came off the shelf by itself. | Balance usually still owing | Order, Delivery |
| `settled` | Settled | The balance is fully in. Nothing owed. | Zero owing, done | Owed clears, Insights counts it |

Two things stay true across every stage. The balance is always computed, billed
less paid, never stored, so it cannot drift. And nothing is ever deleted: a
wrong line gets a corrected line beside it, a return is a mirrored line, and the
history keeps both.

Delivered and settled are independent of each other on purpose. People pay in
full before delivery sometimes, and collect goods while still owing other times.
The stage tracks fulfilment; the balance number tracks money; they do not have
to move in lockstep.

## 2. Return from WhatsApp: three doors, one engine

The hard part was never the ledger. It was the return trip: a conversation
happens on WhatsApp, and that knowledge has to land in the book without Nonso
retyping it. There is no magic automatic bridge in the WhatsApp app; the app has
no hook we can catch. So we built the bridge as doors he opens, and made every
door feed the same engine.

Door A, paste a number (shipped). To add the customer. He copies the number in
WhatsApp, taps Paste on New customer, and the number lands cleaned. This is the
only reliable way to carry a number, because the export does not contain one.

Door B, read the chat (this build). To draft the order. Two ways in, same
result. He can paste the conversation text into a box, or upload the export as
the phone saved it. That export is almost always a `.zip`, with `_chat.txt`
sitting beside any shared photos; the book opens the zip, reads the text, and
leaves the media alone. A bare `.txt` export works too. Either way the book
takes the customer's side of the talk and reads it into a draft order he
confirms.

Door C, the Cloud API webhook (future, optional). To make Door B automatic. If
the business ever moves onto the WhatsApp Business Platform, an inbound message
would arrive as a webhook carrying the sender's number and text, and it would
call the very same engine. Nothing else would change. This needs a Meta setup
and a paid number, so it stays a later choice, not a dependency.

What the export actually carries, confirmed: a timeline, the sender names as
WhatsApp shows them, and the messages. No phone numbers. That is why the number
stays Door A and the words come through Door B. The two never merge in the file,
so we never pretend they do.

## 3. The architecture, kept modular on purpose

The whole design is one reusable engine with interchangeable doors in front of
it. Intake is decoupled from extraction, so a new door is a new adapter, never a
rewrite. Reading flows one way:

    intake (paste text | upload _chat.txt | future webhook)
        -> parse (only the chat file needs this step)
        -> engine: extractOrderLines(text, catalogue)
        -> OrderDraft (lines tied to real pieces, or flagged unknown)
        -> review screen (the owner edits and confirms)
        -> the existing order actions (createOrder, addLine)

Shipped this build, all new files, none of them CODEX's:

| File | Its one job |
| --- | --- |
| `src/lib/ai/client.ts` | The single call to Claude. Reads `CLAUDE_API_KEY`, forces one structured tool reply, times out, retries once. Never logs the key. |
| `src/lib/ai/extract-order.ts` | The engine. Free words plus the catalogue, out come draft lines. The `pieceSlug` is enum-fenced to slugs we sell. No price field exists. |
| `src/lib/ai/types.ts` | `DraftLine` and `OrderDraft`, the shape the review screen reads. |
| `src/lib/whatsapp/read-upload.ts` | Opens the uploaded export. A `.zip` gives up its `_chat.txt`; a bare `.txt` passes through. Media is ignored. Built-in zlib, no dependency. |
| `src/lib/whatsapp/parse-export.ts` | Deterministic parse of an exported chat into messages and participants. No network, no key, no model. |
| `src/lib/ai/chat-to-draft.ts` | The bridge. Parse the file, pick the customer's side, hand plain words to the engine. Also `textToDraft` for the paste path. |
| `src/lib/ai/catalog.ts` | The catalogue the engine is grounded in, and the last given price for a piece, drawn from the order book. |

Because the engine takes the catalogue as an argument, it has no database inside
it. That keeps it testable and keeps the doors thin. The parser was proven
against seven real line shapes: iPhone brackets with seconds, the narrow space
before PM, Android dash format, lowercase pm, a multi-line message, the
encryption notice, and a media stub. It kept the customer's four order lines and
dropped the rest.

## 4. The AI, precisely, and why this is enough

Model: Claude Haiku, pinned `claude-haiku-4-5-20251001`. It is the small, fast,
cheap model, and reading a short chat is exactly its weight class. Pricing is
about one naira of tokens per several chats, since a conversation is a few
hundred tokens in and a short list out.

Mechanism: we ask the model to fill one tool whose shape we fix, and take its
input object back. The reply is always that object, never a paragraph, so there
is nothing to parse and little to go wrong. The `pieceSlug` field is an enum of
the slugs the house actually sells plus an empty string, which means the model
is structurally unable to name a piece we do not stock. When the words match
nothing, it must say so with an empty slug and a low confidence. (The newer
Structured Outputs feature would harden this further with a guaranteed schema;
tool use is what we ship first because it is the most proven path.)

Privacy: the Claude API does not train on what we send, and it deletes traffic
after seven days by default. For a client's customer conversations that matters,
and it is a fact we can stand behind.

The key: it lives in the environment as `CLAUDE_API_KEY`, exactly like
`DATABASE_URL`. It is never printed, never committed, never shipped to the
browser. If it is missing, the book notices and falls back to plain typing, so
nothing breaks when there is no key and no signal.

## 5. Guardrails, the fences we will not move

1. The price is never the model's. There is no price field in what the model
   returns, and the catalogue has no stored price to fetch, so it has nothing to
   price with even if asked. The suggested price on the review screen comes from
   the ledger, the last price Nonso himself gave for that piece, and he confirms
   it by hand.
2. The owner confirms every line. A draft is a draft. Nothing becomes an order,
   a quote, a payment, or a WhatsApp message without a deliberate tap.
3. The catalogue is a fence, not a hint. The enum makes an invented piece
   impossible, not merely discouraged.
4. Doubt is shown, not hidden. Every line carries a confidence and an unknown
   flag, so the eye goes to what needs checking and the sure lines stay calm.
5. Nothing sends itself. No quote goes out, no reminder fires, no money is
   recorded except by his hand.
6. It degrades gracefully. No key, no signal, or a refusal all fall back to the
   plain form he already has. The AI is a shortcut, never a gate.
7. It stays cheap and quick. Input is capped, the reply is short, the call times
   out at twenty seconds and retries once, then steps aside.
8. Secrets stay secret. The key is read from the environment and never leaves
   the server.
9. The book still signs its history. Every order the review screen creates goes
   through the same actions that write the audit log, so an AI-assisted order
   reads the same as a hand-typed one.
10. Two hands, one tree. This lane is new files only; CODEX's Visualizer and
    globals.css were not touched.

## 6. Best UI/UX: the review screen

One screen, top to bottom, thumb-friendly, in his words not CRM words. The
pattern is propose then confirm, the human always in the last seat.

1. He arrives with the chat, by paste or by uploaded file, from a customer's
   page or a New order.
2. The book shows a draft, labelled a draft, never a finished quote.
3. Each line shows the exact customer words it was read from, so he sees what
   the machine read, not just what it decided.
4. Every line is editable in place: the piece, the count, the unit, and the
   price he is giving. A wrong line is one tap to fix, a missing one is one tap
   to add, a bad one is one tap to drop.
5. Unsure lines wear a quiet mark. Anything the book could not match to a piece
   sits at the top as "check this one", with the words it saw.
6. The price row starts from the ledger. Where he has sold that piece before,
   the last price he gave is filled in, ready to keep or change. Where he has
   not, it waits for his number.
7. One big button with the outcome on it: "Create the quote". Not "Submit". The
   button says what will happen, and only his tap makes it happen.

On confirm, the screen calls the same `createOrder` and `addLine` the book
already uses, so the order it makes is an ordinary order in every way.

## 7. CRM terms, made plain and put on the screen

The book speaks shop English, not software English. This is the glossary the
owner sees, and the words the buttons use.

| What software calls it | What the book says | What it means to him |
| --- | --- | --- |
| Contact, lead, prospect | Customer | Someone he sells to, saved once. |
| Lead, new enquiry | New enquiry | Someone asked. Nothing promised yet. |
| Opportunity, deal | Order | A real job, once it is real. |
| Quotation, estimate | Quote | The price he gave. |
| Invoice | Bill, or Invoice on the printed page | What the customer owes, on paper or PDF. |
| Down payment | Deposit | The part payment that starts the job. |
| Outstanding balance | Owing | What is still to be paid. |
| Paid in full | Settled | All in, nothing owed, done. |
| Pipeline | Orders | The list of jobs and where each sits. |

## 8. The build, in phases

Phase 0, done today: the engine and the parser, both verified by types, lint,
and a self-test of the parser against real chat lines. No UI yet, no risk to the
running site.

Phase 1, next, gated by his eye: the review screen and the import route, wired
to the existing order actions. This is the surface that most deserves a look
before it lands, so it waits for a nod.

Phase 2: seed the price from the ledger inside the review, and add "read a chat"
entry points on the customer page and on New order, so the door is where his
hand already is.

Phase 3, optional and later: the Cloud API webhook, for automatic intake. Same
engine, new door. Needs a Meta business setup and a paid number, so it is a
choice for when the volume asks for it, not before.

## 9. Evidence

The plan rests on live research, not memory. The load-bearing findings:

- Claude for structured reading: the API returns a fixed-shape tool object, an
  enum fences the output to real slugs, Haiku is the cheap fast tier, and the
  API does not train on our traffic and deletes it in seven days. Sources:
  platform.claude.com docs on tool use, models and pricing, and data retention.
- WhatsApp export shape: names not numbers, iPhone and Android formats, the
  invisible marks before AM/PM, multi-line and system and media edge cases.
  Sources: the Pustur whatsapp-chat-parser source and tests, the LangChain
  narrow-space issue, and IPED forensic notes on name versus number.
- The lifecycle and the review UX: the smallest pipeline that still tracks the
  money is enquiry, quote, deposit, delivered, settled; AI-drafted data should
  be shown with its source, edited in place, and confirmed by a human, never
  auto-committed. Sources: Shape of AI draft mode, Zapier and Databricks on
  human in the loop, Nielsen Norman and Baymard on simple mobile forms.

## 10. Design alignment, built to DESIGN.md and BACK-OFFICE-GOAL.md

The engine is headless, so it carries no design debt. The surfaces it feeds,
the draft review and the /share bridge, are held to the maison laws and the
eleven back-office guardrails. This is the contract for how they look, so
Phase 1 is built to the bar, not retrofitted to it. The first mockup used
borders, off-ramp type, and two buttons; the real one below does not.

### Archetype, not a new dashboard page

Reading a chat is a Form and Bridge flow, and the goal doc already fixes how
those behave: a create flow opens as a sheet on compact and in the inspector on
wide, and the Bridge (Share) is inbound intent, match, one action, sheet-like.
So the review is not a naked full-page route. It is one shared surface rendered
three ways: a detent sheet over the room on the phone, launched from the Orders
plus or a customer record; the trailing inspector beside the ledger on wide; and
the body of the existing /share route, which already sits in the coverage
matrix. This keeps the feature inside the shell's own vocabulary instead of
adding a page that would fail the squint test.

### Every element on the real primitives

| In the review | Primitive, not invention |
| --- | --- |
| The sheet or inspector chrome | `glass`, squircle, no edge |
| Each draft line, the customer card | `panel`, squircle 22 to 26, soft inner glow, no border |
| Section labels | `.eyebrow`, 11px gold micro-caps, 0.25em |
| Headings and the total | serif display (`.font-serif`), ink |
| Piece name, body copy | native sans, 16 body and 14 small, the closed ramp |
| Confidence marks | capsule `chip-glass`, "sure" in dusk, "check this one" in gold as an alert word |
| The source quote | dusk italic 14, the words the book read |
| Quantity and price fields | the `field` input, shell fill, squircle, no border, `tabular-nums` |
| Money everywhere | `naira()`, `tabular-nums`, aligned |
| The one action | a single `.btn-gold` capsule, "Create the quote" |
| Add a line, read a different chat | `.link-hair` gold underline links, never a second button |

### The states, all of them

- Empty: nothing read yet, a whisper in a panel, "Share a chat, or paste one, and the book reads it."
- Loading: the read takes a breath, so a skeleton in the room's shape fades in after 250ms; fast reads never flash it.
- Error with a way back: no key, no signal, or a read that failed lands as one quiet gold-marked line and drops to plain typing. The AI is never a dead end.
- Attention: low-confidence lines sit at the top wearing the gold "check this one" word; the sure lines stay calm.
- Offline: the office is a PWA; with no signal the door falls back to the manual new-order form.
- Pending: the gold action disables and speaks its verb, "reading", then "creating"; nothing commits until it resolves.
- Async announced: an aria-live line speaks "quote created" for a screen reader.

### Guardrail conformance

| Guardrail | How the feature meets it |
| --- | --- |
| G1 no edge | Panels and glass, glow and space; zero borders or hairlines. |
| G2 concentric | Capsule action and chips, squircle panels and sheet; no sharp rectangle in a rounded parent. |
| G3 two materials | Sheet and inspector are `glass`; lines and the customer card are `panel`; nothing new. |
| G4 closed ramp | Only 11 / 12 / 14 / 16 / 20 / 26 and the displays; serif display, native sans body. |
| G5 tabular | Prices and quantities `tabular-nums` via `naira()`, aligned down the column. |
| G6 glide | Sheet and inspector slide 240 to 500ms on ease-glide; reduced motion collapses to a still. |
| G7 whisper | Few words, no em dashes, Dyrane voice. "Read from your chat", not "extraction complete". |
| G8 one gold | "Create the quote" is the only gold fill; the rest are hairline links, plus the gold alert word on a line to check. |
| G9 AA and focus | Ink, dusk, gold clear 4.5:1 on the panels in both suns; the 1px gold focus ring, 4px offset, on every field and the action. |
| G10 safe | Creating the quote runs the existing `createOrder` and `addLine`, so it lands in the audit log; a draft is not real data, so trimming a line deletes nothing. No door is crossed, so no consequence sheet. |
| G11 size class | Sheet on compact, inspector on wide, by width and input, never by device guess. |

### Visible language

The owner never meets a machine word: not extract, parse, token, schema, or
model. He meets the book read your chat, here is the draft, check it, create the
quote. This holds the DESK-SHELL Visible Language Guardrail.

### Coordination

These surfaces are the admin shell, CODEX's active lane, and /share plus the
manifest sit there too. So this is prototype and gate: I build the review as a
shared component and show it for your eye, and the sheet, inspector, and /share
wiring land in step with CODEX through the handshake, one hand per file. The
coverage matrix gains the review states above so nothing leaks.
