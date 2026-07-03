<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# House rules · The Mosaic Maison

Read `docs/DESIGN.md` before any UI change and `docs/README.md` for the
document map. The short version of the culture:

- Layers: data in `src/lib` (site, products, catalog, images, wa),
  primitives in `src/app/globals.css`, components in `src/components`,
  pages only compose. Pages reach the catalogue through
  `src/lib/catalog.ts`, never `products.ts` directly.
- Copy: Apple-terse. Few words, human prose, no em dashes anywhere in
  the repo, one idea per sentence.
- Type: the ramp is 11, 12, 14, 16, 20, 26 plus text-display-section,
  text-display-page, text-display-hero. No other sizes.
- Geometry: capsules for interactive chrome, 28px squircles for panels,
  22 to 26px for card media, 40px inset bands, screens full-bleed.
  Never a sharp rectangle inside a rounded parent. No borders, no
  hairlines: whitespace, imagery, and lucent surfaces separate.
- Media: URLs and paths live only in `src/lib/images.ts`. Owned assets
  in `public/media` (three-plus canonical files, everything else
  gitignored), eye-verified before shipping, compressed under ~400KB
  for stills. Every WhatsApp CTA carries a `data-wa` placement source.
- Verify ritual, every pass: `npx next build` (24 routes),
  `npx eslint src --max-warnings=0`, update `docs/QA.md`, commit with
  a story-telling message.
- Accessibility floor: WCAG AA measured, focus rings, skip link,
  reduced motion respected by every animation.
