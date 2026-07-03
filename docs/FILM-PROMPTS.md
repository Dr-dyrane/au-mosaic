# Film prompts · The Mosaic Maison

Generation brief for the site's film slots. One shared style block, then
one prompt per slot. Every film must loop: ask the generator for a
seamless loop, or make the last frame match the first.

## The style block (prepend to every prompt)

Cinematic luxury interior film, photoreal, shot on a locked tripod with
almost imperceptible motion. Warm near-black shadows, never blue-black.
Brass and gold accent light. Deep aquamarine water tones. Rich saturated
colour, gentle contrast, no HDR glow, no bloom. Slow, hypnotic, calm.
No people, no faces, no text, no logos, no watermark. Museum mood:
darkness with one lit subject.

## Delivery spec (all films)

16:9, 1920x1080 or 4K, 24 or 30 fps, 8 to 12 seconds, seamless loop,
highest bitrate mp4 available. I compress and wire them in; target under
10MB each on the site. Bonus for socials and WhatsApp status: a 9:16
crop of slots 1, 2, and 5.

## Slot 1 · Home hero (the money shot)

Dusk at a private villa. A still swimming pool holds the last amber
light of sunset; tiny ripples cross the water surface in slow motion,
catching warm brass reflections from villa lights at the far edge.
The mosaic floor of the pool shimmers faintly beneath the surface.
Composition: water surface fills the lower two thirds, villa silhouette
and deep indigo sky above. The ripples drift continuously so the loop
never rests.

## Slot 2 · Classic pool blues (piece film)

Macro shot, underwater. Sunlight caustics dance across a pristine blue
glass mosaic pool floor, shades from deep cobalt to pale aqua. The light
web ripples slowly and hypnotically over the perfect grid of small
square tiles. Crystal clear water, no debris, no bubbles rising. The
camera does not move; only the light does.

## Slot 3 · Glass mosaic (piece film)

A wall of small vibrant glass mosaic tiles in jewel colours, ruby,
amber, emerald, sapphire. A soft warm light sweep crosses the wall
diagonally, very slowly, making each glass square glint in turn like a
slow wave of sparkle. Dark room, only the wall is lit. Macro enough to
see the glass depth and the fine grout lines.

## Slot 4 · Art mosaic (piece film)

Extreme slow lateral drift across a handmade mosaic mural of a koi fish
in water, made of thousands of tiny glass tesserae in teal, terracotta,
and ivory. Gallery spotlight from above, dark surroundings. The drift
is slow enough to study individual tiles, like walking past a museum
piece.

## Slot 5 · The craft (about and trust sections)

Close shot of skilled hands in work gloves pressing a sheet of blue
glass mosaic into fresh white adhesive on a pool wall, then smoothing
it flat with a rubber float. Warm workshop light, shallow depth of
field, unhurried confident movements. The gesture reads as mastery,
not labour.

## Slot 6 · The Private Hammam (scene film)

A warm stone hammam interior. Thin steam drifts slowly through a single
shaft of warm light falling on wet stone mosaic. Droplets glisten on
the tile. Almost still; only the steam and one slow drip move.

## Slot 7 · The Dark Bath (scene film)

A matte black textured mosaic shower wall in a dark bathroom. A thin
sheet of water slides slowly down the tile, catching one warm brass
light from the side. The water film makes the dark texture glisten.
Minimal, sculptural, quiet.

## Slot 8 · The Infinity Terrace (scene film)

An infinity pool edge at golden hour. Water spills silently over the
vanishing edge toward a hazy horizon. Aqua mosaic glows beneath the
surface in the foreground. The sky holds amber and rose; the water
moves in one continuous slow sheet, loopable.

## Wiring

Send the files and they drop into FILM in src/lib/images.ts (hero) and
per-piece and per-scene slots I will add as the films arrive. Every slot
falls back to its still if a film is missing, so we can ship them one
at a time.
