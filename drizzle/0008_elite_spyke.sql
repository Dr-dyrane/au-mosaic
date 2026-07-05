ALTER TABLE "pieces" ADD COLUMN "seed_size" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "pieces" ADD COLUMN "shade" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "pieces" ADD COLUMN "finish" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE pieces AS p
   SET seed_size = CASE WHEN p.seed_size = '' THEN v.seed_size ELSE p.seed_size END,
       shade = CASE WHEN p.shade = '' THEN v.shade ELSE p.shade END,
       finish = CASE WHEN p.finish = '' THEN v.finish ELSE p.finish END
  FROM (VALUES
    ('classic-pool-blues', 'Small and big seed', 'Deep, light, and mixed blue', 'Pool glass'),
    ('plain-blue-small-seed', 'Small seed', 'Plain blue', 'Gloss glass'),
    ('mixed-blue-big-seed', 'Big seed', 'Mixed blue', 'Gloss glass'),
    ('deep-midnight-blends', '', 'Deep blue', 'Gloss glass'),
    ('aqua-turquoise-blends', '', 'Aqua and turquoise', 'Gloss glass'),
    ('mixed-gradient-blends', '', 'Gradient blue', 'Gloss glass'),
    ('solid-colour-glass', '', 'White, black, crystal, and colour', 'Glass'),
    ('plain-white-mosaic', '', 'Plain white', 'Gloss glass'),
    ('black-mosaic', '', 'Black', 'Matte or gloss glass'),
    ('green-mosaic', '', 'Green', 'Gloss glass'),
    ('orange-mosaic', '', 'Orange', 'Gloss glass'),
    ('gold-metallic-accents', '', 'Gold, silver, and rose gold', 'Mirror glass'),
    ('tiny-seed-gold', 'Tiny seed', 'Gold', 'Mirror glass'),
    ('silver-crystal-mosaic', '', 'Silver', 'Crystal glass'),
    ('stone-mosaic', '', 'Stone', 'Matte stone'),
    ('hexagon-marble', '', 'Marble', 'Polished stone')
  ) AS v(slug, seed_size, shade, finish)
  WHERE p.slug = v.slug
    AND (p.seed_size = '' OR p.shade = '' OR p.finish = '');--> statement-breakpoint
INSERT INTO settings (key, value)
VALUES ('trade_facts_seeded', '2026-07-04')
ON CONFLICT (key) DO NOTHING;
