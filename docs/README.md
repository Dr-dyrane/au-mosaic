# The documents, and what each one is for

Two laws, one ledger, one standards board, one contract. Nothing here
repeats; when two documents disagree, the law wins. The retired papers
(the product plan, the dated UX review, the old media brief) live in
git history: their decisions shipped, their prompts moved to the kit.

| Document | Role |
|---|---|
| DESIGN.md | The law. Palette, typography ramp, geometry, glass, motion. Read before touching any UI. |
| BRAND.md | The bridge. Instagram facts, product language, and how the site maps them into the house. |
| CRM.md | The back-office law and the session memory. The piece record as the heart, the ten laws, the rooms, the cautions paid for. Read before touching /admin. |
| SAAS-QA.md | The standards board. Modern SaaS admin checklist with honest verdicts. Update verdicts as passes land. |
| NEXT-STEPS.md | The open board. Documented gaps, owner-truth errands, and next build priorities. |
| QA.md | The ledger. Every checkpoint with evidence. Updated each pass, never rewritten. |
| THEMING.md | The theming contract. Nine tokens, three scenes; the whole job when brand colours arrive. |
| client/PROPOSAL-NONSO.md | The proposal Nonso saw. Business record. |
| client/VIDEO-SCRIPT.md | The 3-minute walkthrough script, word for word, for the WhatsApp video. |
| client/IMAGE-PROMPTS.md | The camera. House DNA block, still and film prompts, daylight twins, the eye gate. The owner generates; nothing ships ungated. |
| client/PRODUCT-IMAGE-LEDGER.md | The product-image ledger. Instagram product truth, generated draft batches, image verdicts, and rollback notes. |

## The culture, in five rules

1. Data lives in `src/lib`, style lives in `globals.css`, components
   compose, pages arrange. Nothing else owns anything.
2. Copy is Apple-terse: few words, human, no em dashes, one idea per
   sentence.
3. Every visual claim is measured or eye-verified before it ships;
   the evidence lands in QA.md.
4. Media is owned where possible, referenced in one module
   (`src/lib/images.ts`), gated by eye, compressed before commit.
5. Every pass ends the same way: build, lint, ledger, commit.
