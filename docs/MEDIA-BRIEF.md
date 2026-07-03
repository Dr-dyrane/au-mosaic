# Media brief · The Mosaic Maison

Generation brief for the site's film slots. One shared style block, then
one prompt per slot. Every film must loop: ask the generator for a
seamless loop, or make the last frame match the first.

## When video is hard: the dimensional still

Stills are enough. The site already supplies the motion: ken-burns
drift, pointer and gyroscope tilt, gallery vignette, scroll parallax.
What a still must bring is DEPTH, so the motion has something to move.
Take any slot prompt below, drop the motion sentences, and append this:

"Ultra detailed photoreal still. Strong depth of field: one sharp
subject in the foreground, softly blurred distance behind it. Raking
warm light travels across the mosaic so every tessera casts a tiny
shadow and the surface reads as relief, not print. Clear foreground,
midground, and background layers. 4K. Portrait 4:5 for piece cards,
16:9 for scenes."

Same reference frames, same style block, same rules. One good
dimensional still per slot upgrades the site today; films replace them
whenever generation cooperates, one at a time.

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

## Use the reference frame (the trick that made the hero work)

Each slot below carries the exact image the site shows today. Feed it
to the generator as the start frame (image to video mode) and add:
"Begin exactly on this frame. Keep the composition, framing, and colour
grading. Animate only the water, light, or steam. End near the opening
frame so it loops." The film then lands on the site with no visible
cut: its first frame is the poster, the poster is the page. If the tool
is text-only, attach the frame as a style reference instead.

## Slot 1 · Home hero · DELIVERED AS A STILL

The hero is the twilight villa still (hero-dusk.jpg): mosaic readable
tessera by tessera, interiors glowing, stars out. The film slot is
dormant by quality gate: the 720p loop softened the one surface that
must be the sharpest, so film re-enters only at 1080p or better,
eye-gated, using the pipeline that already works (start frame equals
the live still, poster equals first frame, seamless loop). The old
loop lives in git history.
Reference for the film re-roll:
https://au-mosaic.shop/media/hero-dusk.jpg

## Daylight variants: the theme follows the sun

Dark mode is the gallery at night, the house default. Light mode
rehangs the same works in daylight. Each night frame gets a daylight
twin, generated image to image from the live frame:

Feed the existing frame as the start image and prompt: "The exact
same scene and composition, relit in bright natural daylight. Soft
morning sun, pale warm ivory surroundings instead of darkness, same
materials, same camera, same framing. Keep every mosaic tile
identical. No people, no text, no watermark. Same resolution."

Priority order (night frames that clash in light mode):
1. hero-dusk: the same villa at bright morning
2. glass-jewels: the jewel wall on a white gallery wall, daylight
3. koi-mural and beetle-mural: daylight gallery light
4. hammam: skylight morning version
5. dusk-villa: the square villa at morning
6. terrace: bright blue-sky midday version
7. craft-hands: daylight workshop
8. dark-bath: stays dark in both themes by identity, skip unless a
   soft daylight version proves itself

Already daylight, no pair needed: borders, villa-palms, private-pool,
pool-blues. Drops land in public/media as <name>-day, and each wires
into DAY in src/lib/images.ts.

## Slot 2 · Classic pool blues (piece film)

Reference frame (the piece's live image):
https://images.pexels.com/photos/28287770/pexels-photo-28287770.jpeg?auto=compress&w=2000

Macro shot, underwater. Sunlight caustics dance across a pristine blue
glass mosaic pool floor, shades from deep cobalt to pale aqua. The light
web ripples slowly and hypnotically over the perfect grid of small
square tiles. Crystal clear water, no debris, no bubbles rising. The
camera does not move; only the light does.

## Slot 3 · Glass mosaic (piece film)

Reference frame (the piece's live image):
https://images.pexels.com/photos/28408521/pexels-photo-28408521/free-photo-of-pixelated-sunset.jpeg?auto=compress&w=2000

A wall of small vibrant glass mosaic tiles in jewel colours, ruby,
amber, emerald, sapphire. A soft warm light sweep crosses the wall
diagonally, very slowly, making each glass square glint in turn like a
slow wave of sparkle. Dark room, only the wall is lit. Macro enough to
see the glass depth and the fine grout lines.

## Slot 4 · Art mosaic (piece film)

Reference frames (the pieces' live images; fish first, beetle for murals):
https://images.pexels.com/photos/10231663/pexels-photo-10231663.jpeg?auto=compress&w=2000
https://images.pexels.com/photos/32325318/pexels-photo-32325318/free-photo-of-intricate-beetle-mosaic-artwork-detail.jpeg?auto=compress&w=2000

Extreme slow lateral drift across a handmade mosaic mural of a koi fish
in water, made of thousands of tiny glass tesserae in teal, terracotta,
and ivory. Gallery spotlight from above, dark surroundings. The drift
is slow enough to study individual tiles, like walking past a museum
piece.

## Slot 5 · The craft (about and trust sections)

No site still exists for this one: generate free from the prompt. The
patterned tiles below can serve as a style reference for the mosaic
being laid:
https://images.pexels.com/photos/14579397/pexels-photo-14579397.jpeg?auto=compress&w=2000

Close shot of skilled hands in work gloves pressing a sheet of blue
glass mosaic into fresh white adhesive on a pool wall, then smoothing
it flat with a rubber float. Warm workshop light, shallow depth of
field, unhurried confident movements. The gesture reads as mastery,
not labour.

## Slot 6 · The Private Hammam (scene film)

Reference frame (the scene's live image):
https://images.pexels.com/photos/7031713/pexels-photo-7031713.jpeg?auto=compress&w=2200

A warm stone hammam interior. Thin steam drifts slowly through a single
shaft of warm light falling on wet stone mosaic. Droplets glisten on
the tile. Almost still; only the steam and one slow drip move.

## Slot 7 · The Dark Bath (scene film)

Reference frame (the scene's live image):
https://images.pexels.com/photos/35189678/pexels-photo-35189678/free-photo-of-luxurious-modern-shower-with-dark-textured-tiles.jpeg?auto=compress&w=2200

A matte black textured mosaic shower wall in a dark bathroom. A thin
sheet of water slides slowly down the tile, catching one warm brass
light from the side. The water film makes the dark texture glisten.
Minimal, sculptural, quiet.

## Slot 8 · The Infinity Terrace (scene film)

Reference frame (the scene's live image):
https://images.pexels.com/photos/20975726/pexels-photo-20975726/free-photo-of-infinity-pool-and-patio-of-a-mountain-resort.jpeg?auto=compress&w=2600

An infinity pool edge at golden hour. Water spills silently over the
vanishing edge toward a hazy horizon. Aqua mosaic glows beneath the
surface in the foreground. The sky holds amber and rose; the water
moves in one continuous slow sheet, loopable.

## Wiring

Send the files and they drop into FILM in src/lib/images.ts (hero) and
per-piece and per-scene slots I will add as the films arrive. Every slot
falls back to its still if a film is missing, so we can ship them one
at a time.
