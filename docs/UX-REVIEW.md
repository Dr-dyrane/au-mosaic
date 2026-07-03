# UX review · The Mosaic Maison

System product architect and UX review, data first. 2026-07-02.
Benchmarks: SICIS (fetched live), Apple HIG (documented practice).
Conversion for every decision: a WhatsApp tap. That is the only funnel.

## Verdict

7 out of 10 against the top of the market, up from the honest 4 before
the glass pass. The system is now senior grade: one geometry law, two
lucent materials, measured AA contrast, four client components, no
animation libraries, 24 static routes. What separates us from 9 is not
design mechanics anymore. It is content depth: proprietary photography,
proof of work, and product specifics. SICIS wins with a projects library
and audience routes, not with better buttons.

## Typography audit (census from code)

Fourteen static sizes and seven clamp ramps are in use. That is drift,
not a scale. Sizes 13 through 22 appear at one pixel intervals, which no
eye can distinguish and no system can defend.

| Finding | Data | Severity |
|---|---|---|
| No modular scale | 21 distinct sizes for ~9 roles | Moderate |
| Display leading split | 1.04, 1.05, 1.06 across heroes | Minor |
| Tracking variants | 0.25, 0.2, 0.18, 0.16, 0.14em | Minor |
| Serif discipline | 28 uses, headlines and names only, zero serif body | Pass |
| Measure | body locked to max-w-md and xs (roughly 55 to 65ch) | Pass |
| Contrast | all text AA, measured in QA.md | Pass |

Prescription, the Apple way (few sizes, big jumps):

| Role | Size | Replaces |
|---|---|---|
| micro caps (eyebrow, chrome) | 11px / 0.25em | 11 |
| links, meta | 12px / 0.18em | 12, 13 |
| body small | 14px | 14, 15 |
| body | 16px | 16, 17 |
| title small (card names) | 20px | 18, 19, 20, 21, 22 |
| title (env lines) | 26px | 24, 26 |
| section display | clamp(1.9rem, 4vw, 3rem) | 4 near-identical ramps |
| page display | clamp(2.4rem, 6.5vw, 4.2rem) | 2 ramps |
| hero display | clamp(2.8rem, 8vw, 5.5rem) | 1 ramp |

Display leading unifies at 1.05. Tracking collapses to 0.25 / 0.18 / 0.14.
Nine sizes, three trackings, one leading rule. Ship as tokens.

## Benchmark notes

SICIS (live fetch): leads with "Scalable Design Systems", routes by
audience (developers, architects, private clients), and closes with a
projects library of named case studies as downloadable PDFs. Their moat
is proof and segmentation. Page weight is heavy with tag managers and
webfonts; interaction polish is average. We are faster and cleaner; they
are deeper.

Apple: a type ramp of few sizes with big jumps, one action per screen,
sticky buy bar, progressive spec disclosure. We already run the buy bar,
the reveal, and the one-loud-thing law. What we lack from Apple is ramp
discipline (fixed above) and scroll-driven storytelling depth.

## Improvement map (impact on WhatsApp taps x effort)

### Now, code only, hours

| Change | Axis | Why |
|---|---|---|
| Ken-burns on PageHero images | animation | subpage heroes are static while home and piece move; consistency reads as quality |
| Safe-area inset on piece bar and float | native view | iPhone home indicator overlaps bottom-5 today; env(safe-area-inset-bottom) is the native tell |
| Active press state on all capsules | microinteractions | one CSS rule (active scale 0.97); makes glass feel physical |
| Nav active state covers /piece/* | UI elements | Collection tab goes dead on piece pages today |
| Piece bar exit animation | animation | it pops out on unmount; a reverse glide keeps the illusion |
| WhatsApp float hover label | microinteractions | unlabeled green circle; a chip-glass label on hover names the action |
| Type ramp tokens (table above) | typography | locks the scale before more surfaces ship |
| Analytics events on every wa() link with source prop | data | today we count pageviews; we should count taps by placement (hero, card, bar, float) or we are guessing |

### Next, needs client content, days

| Change | Axis | Why |
|---|---|---|
| Projects page (3 to 5 named jobs, photos, one line each) | proof | the SICIS moat; converts trade buyers; content exists in Nonso's WhatsApp history |
| Nonso's real photography replacing stock | luxury depth | stock is the ceiling on premiumness; already a Week 1 proposal ask |
| Audience routes (contractors, architects, homeowners) | architecture | SICIS segments; our trade section is one block on the tiles page |
| Per-piece colourway photos and specs (sheet size, finish) | product depth | Apple-grade product pages need specifics |

### Later, platform, sprint scale

| Change | Axis | Why |
|---|---|---|
| PWA manifest + maskable icon (installable, standalone) | native view | the site becomes an app on Nonso's phone; demo power and repeat visits |
| Scroll-driven hero parallax (CSS animation-timeline, progressive) | animation | cinema without JS; falls back safely |
| View Transitions API between pages when Next stabilizes it | native view | template fade today; shared-element piece transitions tomorrow |
| NGN price bands per range | conversion | quote-per-job stands, but bands qualify serious buyers before the chat |

## Measurement plan

Instrument first, argue never: fire a custom analytics event on every
WhatsApp link with its placement. KPI is tap-through rate by placement
and by page. Secondary: piece page depth (bar impressions), theme usage,
subpage entry rate from search. Review weekly; kill or promote patterns
by the numbers, not by taste.
