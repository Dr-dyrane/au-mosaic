# The documents, and what each one is for

One law, one ledger, one plan. Nothing here repeats; when two documents
disagree, the law wins.

| Document | Role |
|---|---|
| DESIGN.md | The law. Palette, typography ramp, geometry, glass, motion. Read before touching any UI. |
| CRM.md | The back-office law. The piece record as the heart, the ten laws, the rooms and their status, the measure of done. Read before touching /admin. |
| QA.md | The ledger. Every checkpoint with evidence: contrast math, imagery provenance, regression checks, the CMS seam. Updated each pass, never rewritten. |
| UX-REVIEW.md | The dated review. Benchmark verdict and the improvement map it produced. Historical once its tiers ship. |
| MEDIA-BRIEF.md | The generation brief. Style block, film slots, dimensional still recipe, reference frames. The owner generates; the gate is an eye check here before anything ships. |
| PLAN.md | The product plan. Why Apple Store and not shop.com, and the phases. |
| client/ | What Nonso sees. The proposal in markdown and the PDF built from it. Business emails only, never personal. |

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
