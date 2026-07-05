ALTER TABLE "pieces" ADD COLUMN "application_tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
UPDATE pieces AS p
   SET application_tags = v.tags
  FROM (VALUES
    ('classic-pool-blues', '["Swimming pool","Pool floor art"]'::jsonb),
    ('aqua-turquoise-blends', '["Kitchen","Sink","Bathroom","Sitting room","Office","Swimming pool"]'::jsonb),
    ('deep-midnight-blends', '["Bathroom","Swimming pool"]'::jsonb),
    ('patterned-pool-borders', '["Swimming pool","Pool floor art"]'::jsonb),
    ('plain-blue-small-seed', '["Swimming pool"]'::jsonb),
    ('mixed-blue-big-seed', '["Swimming pool"]'::jsonb),
    ('solid-colour-glass', '["Kitchen","Bathroom","Sitting room","Office","Exterior"]'::jsonb),
    ('mixed-gradient-blends', '["Kitchen","Bathroom","Swimming pool"]'::jsonb),
    ('gold-metallic-accents', '["Sitting room","Office","Wall art"]'::jsonb),
    ('tiny-seed-gold', '["Sitting room","Office","Wall art"]'::jsonb),
    ('silver-crystal-mosaic', '["Sitting room","Office","Wall art"]'::jsonb),
    ('plain-white-mosaic', '["Kitchen","Bathroom","Swimming pool"]'::jsonb),
    ('black-mosaic', '["Bathroom","Swimming pool"]'::jsonb),
    ('green-mosaic', '["Kitchen","Bathroom","Sitting room"]'::jsonb),
    ('orange-mosaic', '["Sitting room","Wall art"]'::jsonb),
    ('pattern-picture-mosaics', '["Pool floor art","Logo art","Wall art"]'::jsonb),
    ('custom-murals', '["Pool floor art","Logo art","Wall art"]'::jsonb),
    ('stone-mosaic', '["Kitchen","Sitting room","Office"]'::jsonb),
    ('hexagon-marble', '["Bathroom"]'::jsonb),
    ('container-project-orders', '["Exterior","Swimming pool"]'::jsonb),
    ('custom-colours-sizes', '["Kitchen","Sink","Bathroom","Wall art"]'::jsonb)
  ) AS v(slug, tags)
  WHERE p.slug = v.slug
    AND p.application_tags = '[]'::jsonb;--> statement-breakpoint
INSERT INTO settings (key, value)
VALUES ('application_tags_seeded', '2026-07-04')
ON CONFLICT (key) DO NOTHING;
