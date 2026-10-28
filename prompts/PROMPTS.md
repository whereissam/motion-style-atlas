# Motion Style Atlas: Regeneration Prompts

Each of the 127 styles below has two prompts:

- **Build prompt**: a full director's brief. Give it to Claude or another coding model to make a procedural 10-second film (Canvas/WebGL + Web Audio), or hand it to a motion designer as a creative brief.
- **Video-model prompt**: a short descriptive prompt for text-to-video tools.

To match the atlas exactly, attach the reference film from `videos/` and, for coding models, `js/engine.js` (the shared timing, easing and audio helpers). Every film in the atlas follows the same contract: `MG.film({ id, dur, meta, setup, draw(c, t, W, H, st), score(A) })`.

## 01 · Visual Music
*After John Whitney · 1921 — · Graphic Design & Historical*

Reference film: `videos/whitney.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Visual Music** (After John Whitney, 1921 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Abstract-film pioneers Ruttmann and Fischinger "played" music with shapes. In 1960 John Whitney founded Motion Graphics Inc. and gave the field its name.
- Study these reference works: An Optical Poem (1938) · Catalog (1961) · Arabesque (1975)
- Motion DNA: Each element rotates at a speed proportional to its index; patterns lock whenever the speeds form whole-number ratios.
- Visual DNA: Glowing points on black, rosette symmetry, warm-to-cool hue ramp, almost no type.
- Signature transitions: Symmetry lock, collapse to a line
- Key techniques: Differential motion, Symmetry locks, Additive trails

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Differential motion, Symmetry locks, Additive trails).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Differential motion and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VISUAL MUSIC", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, Processing, TouchDesigner. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Visual Music motion-graphics film (After John Whitney). Visual style: glowing points on black, rosette symmetry, warm-to-cool hue ramp, almost no type. Motion: each element rotates at a speed proportional to its index; patterns lock whenever the speeds form whole-number ratios. Signature moves: differential motion, symmetry locks, additive trails; transitions: symmetry lock, collapse to a line. In the tradition of An Optical Poem (1938) · Catalog (1961) · Arabesque (1975). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VISUAL MUSIC". Punchy sound design synced to every cut.
```

## 02 · Cut-Paper Modernism
*After Saul Bass · 1955 — · Graphic Design & Historical*

Reference film: `videos/bass.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cut-Paper Modernism** (After Saul Bass, 1955 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Saul Bass turned title sequences from static cards into the opening act of the film: torn paper, bold silhouettes, jazz.
- Study these reference works: The Man with the Golden Arm (1955) · Vertigo (1958) · Psycho (1960)
- Motion DNA: Flat shapes enter on the beat with hard eases; one symbolic body part stands in for the whole story.
- Visual DNA: Two or three flat colours, torn edges, film grain, hand-cut condensed type.
- Signature transitions: Hard colour cut, slat split
- Key techniques: Rough-cut edges, Symbolic silhouettes, Hard colour cuts

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Rough-cut edges, Symbolic silhouettes, Hard colour cuts).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Rough-cut edges and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CUT-PAPER MODERNISM", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, SVG. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cut-Paper Modernism motion-graphics film (After Saul Bass). Visual style: two or three flat colours, torn edges, film grain, hand-cut condensed type. Motion: flat shapes enter on the beat with hard eases; one symbolic body part stands in for the whole story. Signature moves: rough-cut edges, symbolic silhouettes, hard colour cuts; transitions: hard colour cut, slat split. In the tradition of The Man with the Golden Arm (1955) · Vertigo (1958) · Psycho (1960). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CUT-PAPER MODERNISM". Punchy sound design synced to every cut.
```

## 03 · Bauhaus Geometry
*Primary Shapes in Rhythm · 1919 — · Graphic Design & Historical*

Reference film: `videos/bauhaus.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Bauhaus Geometry** (Primary Shapes in Rhythm, 1919 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The Bauhaus reduced form to circle, square and triangle in primary colours. Brand-identity motion still runs on that alphabet.
- Study these reference works: Kandinsky, Composition VIII (1923) · Schlemmer, Triadic Ballet (1922)
- Motion DNA: Shapes snap, roll and rotate on an 8th-note grid; every move lands exactly on the beat.
- Visual DNA: Red, yellow, blue and black on off-white; overprinted shapes; geometric sans.
- Signature transitions: Panel push-wipe, tile rotation waves
- Key techniques: Primary palette, Shape snapping, Poster resolve

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Primary palette, Shape snapping, Poster resolve).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Primary palette and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "BAUHAUS GEOMETRY", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, SVG, Canvas 2D, CSS. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Bauhaus Geometry motion-graphics film (Primary Shapes in Rhythm). Visual style: red, yellow, blue and black on off-white; overprinted shapes; geometric sans. Motion: shapes snap, roll and rotate on an 8th-note grid; every move lands exactly on the beat. Signature moves: primary palette, shape snapping, poster resolve; transitions: panel push-wipe, tile rotation waves. In the tradition of Kandinsky, Composition VIII (1923) · Schlemmer, Triadic Ballet (1922). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "BAUHAUS GEOMETRY". Punchy sound design synced to every cut.
```

## 04 · Art Deco Motion
*Machine-age Glamour · 1925 — · Graphic Design & Historical*

Reference film: `videos/artdeco.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Art Deco Motion** (Machine-age Glamour, 1925 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Named after the 1925 Exposition Internationale des Arts Décoratifs in Paris, Art Deco fused Cubist geometry, Egyptian and Aztec motifs and machine-age streamlining; Cassandre's posters and New York's setback skyscrapers made it the look of luxury and speed.
- Study these reference works: Chrysler Building crown (William Van Alen, 1930) · "Normandie" poster (A. M. Cassandre, 1935) · "Étoile du Nord" poster (Cassandre, 1927) · Radio City Music Hall (1932) · The Great Gatsby titles (2013)
- Motion DNA: Everything grows from one axis in mirrored pairs: a plumb line falls, rays fan out on the beat, arches stack like a fanfare, lines streak outward, and a sheen sweeps the gold.
- Visual DNA: Gold on black: sunbursts, stepped ziggurats, chevrons, scallop fans and streamlines in strict bilateral symmetry, with high-contrast inline capitals.
- Signature transitions: Line draw-on from the axis, symmetrical bloom, mask-rise reveals, specular sweeps, slow camera pull-out.
- Key techniques: Mirror-symmetric draw-on of every ornament, Metallic gold gradients with a travelling sheen, Inline display type rising through a horizon mask, Additive bloom on gold line-work

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Mirror-symmetric draw-on of every ornament, Metallic gold gradients with a travelling sheen, Inline display type rising through a horizon mask, Additive bloom on gold line-work).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Mirror-symmetric draw-on of every ornament and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ART DECO MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, SVG, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Art Deco Motion motion-graphics film (Machine-age Glamour). Visual style: gold on black: sunbursts, stepped ziggurats, chevrons, scallop fans and streamlines in strict bilateral symmetry, with high-contrast inline capitals. Motion: everything grows from one axis in mirrored pairs: a plumb line falls, rays fan out on the beat, arches stack like a fanfare, lines streak outward, and a sheen sweeps the gold. Signature moves: mirror-symmetric draw-on of every ornament, metallic gold gradients with a travelling sheen, inline display type rising through a horizon mask, additive bloom on gold line-work; transitions: line draw-on from the axis, symmetrical bloom, mask-rise reveals, specular sweeps, slow camera pull-out. In the tradition of Chrysler Building crown (William Van Alen, 1930) · "Normandie" poster (A. M. Cassandre, 1935) · "Étoile du Nord" poster (Cassandre, 1927) · Radio City Music Hall (1932) · The Great Gatsby titles (2013). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ART DECO MOTION". Punchy sound design synced to every cut.
```

## 05 · Constructivism
*Art into Life, Type as a Weapon · 1919 — · Graphic Design & Historical*

Reference film: `videos/constructivism.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Constructivism** (Art into Life, Type as a Weapon, 1919 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Born in revolutionary Russia, Constructivism rejected easel art for agit-prop, posters and film; El Lissitzky, Alexander Rodchenko and the Stenberg brothers built images from diagonals, flat red and black, sans-serif type and photomontage.
- Study these reference works: "Beat the Whites with the Red Wedge" (El Lissitzky, 1919) · Lengiz "Books" poster (Rodchenko, 1924) · "Kino-Eye" poster (Rodchenko, 1924) · "Man with a Movie Camera" poster (Stenberg brothers, 1929) · "Iron Foundry" (Mosolov, 1926–28)
- Motion DNA: Nothing drifts: a wedge strikes, words slam on steep angles, rays burst, the loudspeaker recoils with each shout, and the camera whips and rolls between blocks before pulling back to the poster.
- Visual DNA: Red, black and raw cream; wedge, circle and bar; condensed sans set on diagonals; halftone eye and radiating lines on letterpress paper.
- Signature transitions: Whip pans with motion blur, camera rolls, red flash on impact, slam-in scale stamps, final pull-back reveal.
- Key techniques: Steep diagonal camera with whip-pan blur, Procedural halftone photomontage, Hard slams with overshoot and shake, Hand-cut edges and print mottling

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Steep diagonal camera with whip-pan blur, Procedural halftone photomontage, Hard slams with overshoot and shake, Hand-cut edges and print mottling).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Steep diagonal camera with whip-pan blur and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CONSTRUCTIVISM", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Constructivism motion-graphics film (Art into Life, Type as a Weapon). Visual style: red, black and raw cream; wedge, circle and bar; condensed sans set on diagonals; halftone eye and radiating lines on letterpress paper. Motion: nothing drifts: a wedge strikes, words slam on steep angles, rays burst, the loudspeaker recoils with each shout, and the camera whips and rolls between blocks before pulling back to the poster. Signature moves: steep diagonal camera with whip-pan blur, procedural halftone photomontage, hard slams with overshoot and shake, hand-cut edges and print mottling; transitions: whip pans with motion blur, camera rolls, red flash on impact, slam-in scale stamps, final pull-back reveal. In the tradition of "Beat the Whites with the Red Wedge" (El Lissitzky, 1919) · Lengiz "Books" poster (Rodchenko, 1924) · "Kino-Eye" poster (Rodchenko, 1924) · "Man with a Movie Camera" poster (Stenberg brothers, 1929) · "Iron Foundry" (Mosolov, 1926–28). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CONSTRUCTIVISM". Punchy sound design synced to every cut.
```

## 06 · Psychedelic 60s
*Liquid Light and Melting Letters · 1966 — · Graphic Design & Historical*

Reference film: `videos/psychedelic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Psychedelic 60s** (Liquid Light and Melting Letters, 1966 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: In San Francisco's 1966–68 dance-hall scene, Wes Wilson, Victor Moscoso and others made concert posters whose letters swelled to fill shapes and whose complementary colours vibrated; liquid light shows of dyed oil on overhead projectors played behind the bands, and Peter Max and "Yellow Submarine" took the look to pop.
- Study these reference works: Fillmore Auditorium posters (Wes Wilson, 1966–67) · "Neon Rose" series (Victor Moscoso, 1967) · "Yellow Submarine" (Heinz Edelmann, 1968) · Peter Max posters (late 1960s) · Joshua Light Show at the Fillmore East (1968 —)
- Motion DNA: Nothing is rigid: colour pools, folds, spirals and cycles on the beat, flowers spring open, and letters flow like hot wax until they settle into a swollen, legible shape.
- Visual DNA: Same-value complementary colours that vibrate, liquid dye blobs, op-art spirals, outlined flowers and hand-lettering stretched to fill a balloon.
- Signature transitions: Kaleidoscope fold, spiral iris, liquid-edged radial wipes, zoom-through tunnel, melt-in with drips.
- Key techniques: Subtractive dye metaballs on a projector hotspot, Kaleidoscope fold and log-spiral op-art, Per-pixel shape-filling text warp, Blur-threshold "goo" lettering

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Subtractive dye metaballs on a projector hotspot, Kaleidoscope fold and log-spiral op-art, Per-pixel shape-filling text warp, Blur-threshold "goo" lettering).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Subtractive dye metaballs on a projector hotspot and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PSYCHEDELIC 60S", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, Liquid light show, GLSL. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Psychedelic 60s motion-graphics film (Liquid Light and Melting Letters). Visual style: same-value complementary colours that vibrate, liquid dye blobs, op-art spirals, outlined flowers and hand-lettering stretched to fill a balloon. Motion: nothing is rigid: colour pools, folds, spirals and cycles on the beat, flowers spring open, and letters flow like hot wax until they settle into a swollen, legible shape. Signature moves: subtractive dye metaballs on a projector hotspot, kaleidoscope fold and log-spiral op-art, per-pixel shape-filling text warp, blur-threshold "goo" lettering; transitions: kaleidoscope fold, spiral iris, liquid-edged radial wipes, zoom-through tunnel, melt-in with drips. In the tradition of Fillmore Auditorium posters (Wes Wilson, 1966–67) · "Neon Rose" series (Victor Moscoso, 1967) · "Yellow Submarine" (Heinz Edelmann, 1968) · Peter Max posters (late 1960s) · Joshua Light Show at the Fillmore East (1968 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PSYCHEDELIC 60S". Punchy sound design synced to every cut.
```

## 07 · Op Art Kinetic
*Optical Vibration · 1960 — · Graphic Design & Historical*

Reference film: `videos/opart.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Op Art Kinetic** (Optical Vibration, 1960 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Op (optical) art used precise black-and-white geometry to make flat paintings appear to move, swell and flicker on the retina; Bridget Riley and Victor Vasarely led it, and MoMA’s 1965 exhibition The Responsive Eye made it a global sensation.
- Study these reference works: Movement in Squares (Bridget Riley, 1961) · Current (Bridget Riley, 1964) · Fall (Bridget Riley, 1963) · Vega series (Victor Vasarely, 1957—) · The Responsive Eye (MoMA, 1965)
- Motion DNA: Precise, vibrating motion: periods collapse in clicks, lines undulate, squares fold and bulge, and two ring fields beat against each other until they lock still.
- Visual DNA: Pure black and white: dense parallel stripes, compressed checkerboards, spherical bulges and concentric rings, no colour and no texture.
- Signature transitions: Period-doubling, slanted wipe, fold relax into bulge, iris to moiré, ring flattening to stripes, phase-shift reveal
- Key techniques: Analytic anti-aliased stripe fields, Moiré interference, Lens-warped checkerboards

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Analytic anti-aliased stripe fields, Moiré interference, Lens-warped checkerboards).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Analytic anti-aliased stripe fields and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "OP ART KINETIC", held for about 1 s.

BUILD RULES
- Suggested tools: GLSL, Canvas 2D, After Effects. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Op Art Kinetic motion-graphics film (Optical Vibration). Visual style: pure black and white: dense parallel stripes, compressed checkerboards, spherical bulges and concentric rings, no colour and no texture. Motion: precise, vibrating motion: periods collapse in clicks, lines undulate, squares fold and bulge, and two ring fields beat against each other until they lock still. Signature moves: analytic anti-aliased stripe fields, moiré interference, lens-warped checkerboards; transitions: period-doubling, slanted wipe, fold relax into bulge, iris to moiré, ring flattening to stripes, phase-shift reveal. In the tradition of Movement in Squares (Bridget Riley, 1961) · Current (Bridget Riley, 1964) · Fall (Bridget Riley, 1963) · Vega series (Victor Vasarely, 1957—) · The Responsive Eye (MoMA, 1965). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "OP ART KINETIC". Punchy sound design synced to every cut.
```

## 08 · Memphis Design
*Postmodern Pop Pattern · 1981 — 1988 · Graphic Design & Historical*

Reference film: `videos/memphis.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Memphis Design** (Postmodern Pop Pattern, 1981 — 1988; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A Milan design collective founded by Ettore Sottsass in December 1980 and launched at the 1981 Salone del Mobile; it threw out good-taste modernism for laminate patterns, clashing colours and toy-like geometry, and its look later flooded 1980s TV graphics and packaging.
- Study these reference works: Carlton room divider (Ettore Sottsass, 1981) · Bacterio laminate (Ettore Sottsass, 1978) · Gabon & Zambia patterns (Nathalie Du Pasquier, 1982) · Super lamp (Martine Bedin, 1981) · Saved by the Bell title graphics (NBC, 1989)
- Motion DNA: Bouncy and overshoot-heavy: shapes drop with squash and stretch, slide in past their mark and spring back, all locked to a synth-pop beat.
- Visual DNA: Pastel and primary clashes, black-and-white laminate patterns, squiggles, confetti terrazzo, zig-zags, cylinders, cones and half-moons with hard black shadows.
- Signature transitions: Pattern panel slide, spring pop, drop-and-bounce, palette clash flash, confetti burst
- Key techniques: Laminate patterns: squiggle, terrazzo, grid, dots, Hard offset shadows & black keylines, Squash-and-stretch bounce stacking

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Laminate patterns: squiggle, terrazzo, grid, dots, Hard offset shadows & black keylines, Squash-and-stretch bounce stacking).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Laminate patterns: squiggle, terrazzo, grid, dots and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MEMPHIS DESIGN", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Illustrator. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Memphis Design motion-graphics film (Postmodern Pop Pattern). Visual style: pastel and primary clashes, black-and-white laminate patterns, squiggles, confetti terrazzo, zig-zags, cylinders, cones and half-moons with hard black shadows. Motion: bouncy and overshoot-heavy: shapes drop with squash and stretch, slide in past their mark and spring back, all locked to a synth-pop beat. Signature moves: laminate patterns: squiggle, terrazzo, grid, dots, hard offset shadows & black keylines, squash-and-stretch bounce stacking; transitions: pattern panel slide, spring pop, drop-and-bounce, palette clash flash, confetti burst. In the tradition of Carlton room divider (Ettore Sottsass, 1981) · Bacterio laminate (Ettore Sottsass, 1978) · Gabon & Zambia patterns (Nathalie Du Pasquier, 1982) · Super lamp (Martine Bedin, 1981) · Saved by the Bell title graphics (NBC, 1989). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MEMPHIS DESIGN". Punchy sound design synced to every cut.
```

## 09 · Y2K Graphic Design
*Chrome Tech-Optimism · 1997 — 2004 · Graphic Design & Historical*

Reference film: `videos/y2k.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Y2K Graphic Design** (Chrome Tech-Optimism, 1997 — 2004; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Millennium-era graphics fused tech optimism with the new 3D and vector tools: liquid chrome type, translucent candy plastic popularised by the 1998 iMac G3, HUD-like grids and pixel fonts, pushed furthest by Sheffield studio The Designers Republic.
- Study these reference works: iMac G3 Bondi Blue (Apple, 1998) · Wipeout 2097 packaging & HUD (The Designers Republic, 1996) · Warp Records sleeves (The Designers Republic, 1990s) · Sony PlayStation 2 launch identity (2000) · Windows XP Luna theme (2001)
- Motion DNA: Liquid and snappy: chrome blobs drop, split and orbit like mercury, candy capsules spring into line, HUD markers snap, and blobs fuse into bubble letters on the drop.
- Visual DNA: Iridescent chrome with a dark horizon line, ice-silver backgrounds, translucent aqua and candy plastics, lens rings, crosshairs, barcodes, 4-point star sparkles and tiny pixel type.
- Signature transitions: Mercury split, capsule carousel, blob converge, white flash, gooey glyph morph, shine sweep
- Key techniques: Environment-mapped liquid chrome, Translucent candy plastic, Pixel micro-type & HUD grids

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Environment-mapped liquid chrome, Translucent candy plastic, Pixel micro-type & HUD grids).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Environment-mapped liquid chrome and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "Y2K GRAPHIC DESIGN", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D / 3ds Max, Illustrator + Photoshop, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Y2K Graphic Design motion-graphics film (Chrome Tech-Optimism). Visual style: iridescent chrome with a dark horizon line, ice-silver backgrounds, translucent aqua and candy plastics, lens rings, crosshairs, barcodes, 4-point star sparkles and tiny pixel type. Motion: liquid and snappy: chrome blobs drop, split and orbit like mercury, candy capsules spring into line, HUD markers snap, and blobs fuse into bubble letters on the drop. Signature moves: environment-mapped liquid chrome, translucent candy plastic, pixel micro-type & hud grids; transitions: mercury split, capsule carousel, blob converge, white flash, gooey glyph morph, shine sweep. In the tradition of iMac G3 Bondi Blue (Apple, 1998) · Wipeout 2097 packaging & HUD (The Designers Republic, 1996) · Warp Records sleeves (The Designers Republic, 1990s) · Sony PlayStation 2 launch identity (2000) · Windows XP Luna theme (2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "Y2K GRAPHIC DESIGN". Punchy sound design synced to every cut.
```

## 10 · De Stijl
*Neoplasticism in Motion · 1917 — · Graphic Design & Historical*

Reference film: `videos/destijl.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **De Stijl** (Neoplasticism in Motion, 1917 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Founded in Leiden in 1917 around Theo van Doesburg’s magazine De Stijl, with Piet Mondrian, Vilmos Huszár, Bart van der Leck and Gerrit Rietveld. Mondrian’s Neoplasticism reduced painting to horizontal and vertical black lines, the three primaries and white, held in asymmetric balance; in New York his black lines dissolved into the pulsing yellow grid of Broadway Boogie Woogie.
- Study these reference works: Composition with Red, Blue and Yellow (Mondrian, 1930) · Broadway Boogie Woogie (Mondrian, 1942–43) · Red and Blue Chair (Rietveld, c. 1918–23) · De Stijl magazine masthead (Vilmos Huszár, 1917) · Counter-Composition V (van Doesburg, 1924) · Rietveld Schröder House (Utrecht, 1924)
- Motion DNA: Strictly horizontal and vertical: lines shoot across like pulled tape and stop dead, colour planes snap into their cells, then the whole grid slides to a new balance; in the boogie section small squares hop along the lines on the 16ths.
- Visual DNA: Off-white ground, heavy black lines of one weight, flat red, blue and yellow planes with a hint of brushed paint, never a diagonal, never a gradient; blocky constructed letters with gaps between the bars.
- Signature transitions: Line draw-on, plane snap-fill, grid rebalance, black-to-yellow recolour, blocks assemble into type
- Key techniques: Orthogonal line draw-on, Cells bound to live grid lines, Asymmetric rebalance, Boogie-Woogie block traffic

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Orthogonal line draw-on, Cells bound to live grid lines, Asymmetric rebalance, Boogie-Woogie block traffic).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Orthogonal line draw-on and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DE STIJL", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects (shape layers), SVG / CSS grid, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second De Stijl motion-graphics film (Neoplasticism in Motion). Visual style: off-white ground, heavy black lines of one weight, flat red, blue and yellow planes with a hint of brushed paint, never a diagonal, never a gradient; blocky constructed letters with gaps between the bars. Motion: strictly horizontal and vertical: lines shoot across like pulled tape and stop dead, colour planes snap into their cells, then the whole grid slides to a new balance; in the boogie section small squares hop along the lines on the 16ths. Signature moves: orthogonal line draw-on, cells bound to live grid lines, asymmetric rebalance, boogie-woogie block traffic; transitions: line draw-on, plane snap-fill, grid rebalance, black-to-yellow recolour, blocks assemble into type. In the tradition of Composition with Red, Blue and Yellow (Mondrian, 1930) · Broadway Boogie Woogie (Mondrian, 1942–43) · Red and Blue Chair (Rietveld, c. 1918–23) · De Stijl magazine masthead (Vilmos Huszár, 1917) · Counter-Composition V (van Doesburg, 1924) · Rietveld Schröder House (Utrecht, 1924). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DE STIJL". Punchy sound design synced to every cut.
```

## 11 · Risograph Animation
*Stencil-Duplicator Print Look · 1986 — · revival 2010s — · Graphic Design & Historical*

Reference film: `videos/risograph.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Risograph Animation** (Stencil-Duplicator Print Look, 1986 — · revival 2010s —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Riso Kagaku of Tokyo released its first Risograph digital duplicator in 1986: a thermal master stencil is burned and wrapped on an ink drum, and each colour is a separate pass of soy-based ink. Built for schools and offices, the machines were adopted by zine makers and art-book presses in the 2010s, and riso-printed flipbooks and frame-by-frame print animations, often faked digitally, turned its grain, fluorescent pink and loose registration into a motion look.
- Study these reference works: RISOGRAPH 007 (Riso Kagaku, 1986) · Print Gocco (Riso Kagaku, 1977) · Nieves zines (Zurich, Benjamin Sommerhalder) · Hato Press (London) · Colorama (Berlin) · Risotto Studio (Glasgow)
- Motion DNA: Animated on twos, and every drawing is a separate pull: the plates shift a few pixels and the grain changes each frame, so even a still image boils; colour arrives one drum pass at a time.
- Visual DNA: Cream uncoated paper, fluorescent pink, yellow and blue soy inks overprinting into orange, purple and green, grainy uneven solids, coarse halftone gradients, white knockouts and registration marks.
- Signature transitions: Drum pass wipe, overprint build-up, misregistration storm, paper jam smear, sheet eject and feed
- Key techniques: One offscreen plate per ink, multiplied, Per-frame misregistration, Stochastic ink coverage mask, Rotated halftone screens

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (One offscreen plate per ink, multiplied, Per-frame misregistration, Stochastic ink coverage mask, Rotated halftone screens).
- 5.0–8.0 s  Climax: the most spectacular moment, built on One offscreen plate per ink, multiplied and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RISOGRAPH ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Photoshop / Procreate riso brushes, Real Risograph print-and-scan, Canvas 2D (multiply compositing). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Risograph Animation motion-graphics film (Stencil-Duplicator Print Look). Visual style: cream uncoated paper, fluorescent pink, yellow and blue soy inks overprinting into orange, purple and green, grainy uneven solids, coarse halftone gradients, white knockouts and registration marks. Motion: animated on twos, and every drawing is a separate pull: the plates shift a few pixels and the grain changes each frame, so even a still image boils; colour arrives one drum pass at a time. Signature moves: one offscreen plate per ink, multiplied, per-frame misregistration, stochastic ink coverage mask, rotated halftone screens; transitions: drum pass wipe, overprint build-up, misregistration storm, paper jam smear, sheet eject and feed. In the tradition of RISOGRAPH 007 (Riso Kagaku, 1986) · Print Gocco (Riso Kagaku, 1977) · Nieves zines (Zurich, Benjamin Sommerhalder) · Hato Press (London) · Colorama (Berlin) · Risotto Studio (Glasgow). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RISOGRAPH ANIMATION". Punchy sound design synced to every cut.
```

## 12 · Neo-Brutalism
*Deliberately Unstyled · 2014 — · Graphic Design & Historical*

Reference film: `videos/brutalism.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Neo-Brutalism** (Deliberately Unstyled, 2014 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Named after Brutalist architecture’s béton brut, web brutalism began as a reaction to polished template sites: Pascal Deville’s brutalistwebsites.com (2014) collected pages that exposed raw HTML, default fonts and visible structure. Around 2020–21 product design softened it into neo-brutalism — thick black borders, hard offset shadows, flat loud colours and chunky grotesk type — popularised by Gumroad’s redesign and a wave of SaaS and portfolio UIs.
- Study these reference works: brutalistwebsites.com (Pascal Deville, 2014) · Craigslist (1995 —) and the Drudge Report as raw ancestors · Balenciaga.com redesign (2017) · Bloomberg Businessweek covers (Richard Turley, 2010–14) · Gumroad redesign (2021)
- Motion DNA: No easing and no apology: elements slam in at constant speed and stop dead with a one-frame jolt, buttons sink exactly into their shadows, layouts jump between grid states on the beat and windows pile up instead of fading.
- Visual DNA: Thick black borders, solid black offset shadows, flat loud fills (yellow, pink, lime, lilac), default or grotesk/monospace type at huge sizes, visible grid and HTML tags, zero gradients, zero blur.
- Signature transitions: Stylesheet-load hard cut, linear slam, press-in, grid reflow jump, window cascade, hard cut to title
- Key techniques: Hard-shadow boxes with press-in states, Exposed 12-column grid overlay, Linear, un-eased slams and jump cuts, Marquee tickers and stacked alert windows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hard-shadow boxes with press-in states, Exposed 12-column grid overlay, Linear, un-eased slams and jump cuts, Marquee tickers and stacked alert windows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hard-shadow boxes with press-in states and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "NEO-BRUTALISM", held for about 1 s.

BUILD RULES
- Suggested tools: HTML / CSS (border + box-shadow), Figma, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Neo-Brutalism motion-graphics film (Deliberately Unstyled). Visual style: thick black borders, solid black offset shadows, flat loud fills (yellow, pink, lime, lilac), default or grotesk/monospace type at huge sizes, visible grid and HTML tags, zero gradients, zero blur. Motion: no easing and no apology: elements slam in at constant speed and stop dead with a one-frame jolt, buttons sink exactly into their shadows, layouts jump between grid states on the beat and windows pile up instead of fading. Signature moves: hard-shadow boxes with press-in states, exposed 12-column grid overlay, linear, un-eased slams and jump cuts, marquee tickers and stacked alert windows; transitions: stylesheet-load hard cut, linear slam, press-in, grid reflow jump, window cascade, hard cut to title. In the tradition of brutalistwebsites.com (Pascal Deville, 2014) · Craigslist (1995 —) and the Drudge Report as raw ancestors · Balenciaga.com redesign (2017) · Bloomberg Businessweek covers (Richard Turley, 2010–14) · Gumroad redesign (2021). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "NEO-BRUTALISM". Punchy sound design synced to every cut.
```

## 13 · Dadaism
*Anti-Art, Chance and Sound Poetry · 1916 — 1924 · Graphic Design & Historical*

Reference film: `videos/dadaism.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Dadaism** (Anti-Art, Chance and Sound Poetry, 1916 — 1924; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Born at the Cabaret Voltaire in Zürich in February 1916, where Hugo Ball, Emmy Hennings, Tristan Tzara, Marcel Janco, Richard Huelsenbeck and Hans Arp staged sound poems, noise music and masks as a revolt against the logic that had produced the First World War. Berlin Dada (Raoul Hausmann, Hannah Höch, John Heartfield) invented political photomontage, Kurt Schwitters built Merz collages from rubbish in Hanover, and Hans Richter, Viking Eggeling and Marcel Duchamp carried it into abstract film.
- Study these reference works: Karawane (Hugo Ball, sound poem, 1916) · Cut with the Kitchen Knife Dada … (Hannah Höch, 1919–20) · Mechanical Head (Raoul Hausmann, c. 1920) · Squares Arranged According to the Laws of Chance (Hans Arp, 1916–17) · Rhythmus 21 (Hans Richter, 1921) · Anémic Cinéma (Marcel Duchamp, 1926) · Merz magazine (Kurt Schwitters, 1923–32)
- Motion DNA: Deliberately unreasonable: abstract rectangles breathe and collapse, discs spin hypnotically, cut-outs fall where chance puts them, words slam down crooked and then re-roll their faces and angles on every eighth note before being blown off the page.
- Visual DNA: Yellowed newsprint, black and one red, halftone photo cut-outs with scissor edges, gears and printers’ hands, and every word in a different wood or metal type, set at angles, in mismatched sizes, never on a grid.
- Signature transitions: Rhythmus collapse to iris, rotorelief cut, torn-sheet rise, chance drop, word slam, page blow-out, letter-by-letter title set
- Key techniques: Keyframed Rhythmus planes with one inversion, Rotating eccentric-circle rotorelief, Seeded chance drops and re-rolls, Mixed wood-type setting per word

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Keyframed Rhythmus planes with one inversion, Rotating eccentric-circle rotorelief, Seeded chance drops and re-rolls, Mixed wood-type setting per word).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Keyframed Rhythmus planes with one inversion and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DADAISM", held for about 1 s.

BUILD RULES
- Suggested tools: Physical photomontage and letterpress, 16 mm animation stand (Richter, Duchamp), After Effects cut-outs, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Dadaism motion-graphics film (Anti-Art, Chance and Sound Poetry). Visual style: yellowed newsprint, black and one red, halftone photo cut-outs with scissor edges, gears and printers’ hands, and every word in a different wood or metal type, set at angles, in mismatched sizes, never on a grid. Motion: deliberately unreasonable: abstract rectangles breathe and collapse, discs spin hypnotically, cut-outs fall where chance puts them, words slam down crooked and then re-roll their faces and angles on every eighth note before being blown off the page. Signature moves: keyframed rhythmus planes with one inversion, rotating eccentric-circle rotorelief, seeded chance drops and re-rolls, mixed wood-type setting per word; transitions: rhythmus collapse to iris, rotorelief cut, torn-sheet rise, chance drop, word slam, page blow-out, letter-by-letter title set. In the tradition of Karawane (Hugo Ball, sound poem, 1916) · Cut with the Kitchen Knife Dada … (Hannah Höch, 1919–20) · Mechanical Head (Raoul Hausmann, c. 1920) · Squares Arranged According to the Laws of Chance (Hans Arp, 1916–17) · Rhythmus 21 (Hans Richter, 1921) · Anémic Cinéma (Marcel Duchamp, 1926) · Merz magazine (Kurt Schwitters, 1923–32). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DADAISM". Punchy sound design synced to every cut.
```

## 14 · Mid-century Modern
*Atomic-Age Flat Colour · 1945 — 1969 · Graphic Design & Historical*

Reference film: `videos/midcentury.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Mid-century Modern** (Atomic-Age Flat Colour, 1945 — 1969; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The post-war look of the American 1950s and early ’60s: UPA’s limited animation (Gerald McBoing-Boing, 1950) and the TV backgrounds of Hanna-Barbera artists such as Ed Benedict and Art Lozzi, Mary Blair’s colour styling for Disney, Charley Harper’s geometric birds, Alexander Girard’s textiles for Herman Miller, and the furniture of Charles and Ray Eames. Atomic-age optimism turned into boomerangs, starbursts, kidney shapes and flat, textured colour printed slightly off its ink line.
- Study these reference works: Gerald McBoing-Boing (UPA, 1950) · The Flintstones / The Jetsons backgrounds (Hanna-Barbera, 1960–63) · It’s a Small World (Mary Blair, 1964) · Charley Harper’s Ford Times bird prints (1950s) · Girard textiles for Herman Miller (1952—) · Eames Lounge Chair (1956) · Sleeping Beauty backgrounds (Eyvind Earle, 1959)
- Motion DNA: Bouncy and optimistic: shapes pop on with a little overshoot, boomerangs whirl, the backdrop slides past in a smooth TV-cartoon pan while the characters move on twos, and sparkles twinkle on the off-beats of a cool-jazz combo.
- Visual DNA: Mustard, teal, burnt orange, olive and pink on cream; flat fills with a dry-brush texture, brown ink lines printed a few pixels off the colour, lollipop and triangle trees, butterfly roofs, kidney shapes, boomerangs and four-point starbursts.
- Signature transitions: Starburst pop and boomerang wipe, stage-set assembly, parallax pan, tilt-up to sky, tile wave flip, tile drop to title card
- Key techniques: Parallax backdrop pan, Off-register ink lines over flat fills, Geometric character on twos, Wave-flipped pattern tiles

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Parallax backdrop pan, Off-register ink lines over flat fills, Geometric character on twos, Wave-flipped pattern tiles).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Parallax backdrop pan and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MID-CENTURY MODERN", held for about 1 s.

BUILD RULES
- Suggested tools: Gouache backgrounds and cel overlay, Illustrator + After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Mid-century Modern motion-graphics film (Atomic-Age Flat Colour). Visual style: mustard, teal, burnt orange, olive and pink on cream; flat fills with a dry-brush texture, brown ink lines printed a few pixels off the colour, lollipop and triangle trees, butterfly roofs, kidney shapes, boomerangs and four-point starbursts. Motion: bouncy and optimistic: shapes pop on with a little overshoot, boomerangs whirl, the backdrop slides past in a smooth TV-cartoon pan while the characters move on twos, and sparkles twinkle on the off-beats of a cool-jazz combo. Signature moves: parallax backdrop pan, off-register ink lines over flat fills, geometric character on twos, wave-flipped pattern tiles; transitions: starburst pop and boomerang wipe, stage-set assembly, parallax pan, tilt-up to sky, tile wave flip, tile drop to title card. In the tradition of Gerald McBoing-Boing (UPA, 1950) · The Flintstones / The Jetsons backgrounds (Hanna-Barbera, 1960–63) · It’s a Small World (Mary Blair, 1964) · Charley Harper’s Ford Times bird prints (1950s) · Girard textiles for Herman Miller (1952—) · Eames Lounge Chair (1956) · Sleeping Beauty backgrounds (Eyvind Earle, 1959). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MID-CENTURY MODERN". Punchy sound design synced to every cut.
```

## 15 · Grunge Typography
*Distressed, Layered, Illegible · 1990 — 1999 · Graphic Design & Historical*

Reference film: `videos/grunge.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Grunge Typography** (Distressed, Layered, Illegible, 1990 — 1999; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The early-’90s reaction against Swiss order, made possible by the Macintosh: Emigre magazine (Rudy VanderLans and Zuzana Licko, from 1984) and its bitmap and distressed faces, Neville Brody’s experimental type magazine Fuse (from 1991), and above all David Carson’s art direction of Ray Gun (1992–95), which overlapped columns, cropped headlines off the page and once set an entire Bryan Ferry interview in Zapf Dingbats. Kyle Cooper’s hand-scratched, jittering title sequence for Se7en (1995) carried the look into motion and defined a decade of film and music-video titles.
- Study these reference works: Ray Gun (David Carson, 1992–95) · The End of Print (Carson and Lewis Blackwell, 1995) · Se7en title sequence (Kyle Cooper / R/GA, 1995) · Fuse (Neville Brody and Jon Wozencroft, 1991—) · Emigre magazine (VanderLans and Licko, 1984–2005) · Template Gothic (Barry Deck, 1990) · Beach Culture (Carson, 1989–91)
- Motion DNA: Nervous and handmade: the frame weaves and stutters on twos, scratched words flicker in double exposure, layers slide over each other at different speeds, letters jitter into place and the page tears into horizontal slices before the film slips its frame line.
- Visual DNA: Dirty bone paper and black, one rust accent; heavy condensed sans against Bodoni italic and typewriter, letters overprinted and eroded, columns colliding with blurred photographs, giant cropped words, hairline rules, folios and dingbats.
- Signature transitions: Hard cut from scratched film to print, staggered layer slides, slab shove, slice tear, frame-line slip
- Key techniques: Pre-eroded type through a distress texture, Gate weave and doubled exposures on twos, Overlapping justified columns, Self-sampled slice displacement

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Pre-eroded type through a distress texture, Gate weave and doubled exposures on twos, Overlapping justified columns, Self-sampled slice displacement).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Pre-eroded type through a distress texture and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GRUNGE TYPOGRAPHY", held for about 1 s.

BUILD RULES
- Suggested tools: QuarkXPress + photocopier, Scratched 35 mm film (Se7en), After Effects with Twitch / Wiggle, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Grunge Typography motion-graphics film (Distressed, Layered, Illegible). Visual style: dirty bone paper and black, one rust accent; heavy condensed sans against Bodoni italic and typewriter, letters overprinted and eroded, columns colliding with blurred photographs, giant cropped words, hairline rules, folios and dingbats. Motion: nervous and handmade: the frame weaves and stutters on twos, scratched words flicker in double exposure, layers slide over each other at different speeds, letters jitter into place and the page tears into horizontal slices before the film slips its frame line. Signature moves: pre-eroded type through a distress texture, gate weave and doubled exposures on twos, overlapping justified columns, self-sampled slice displacement; transitions: hard cut from scratched film to print, staggered layer slides, slab shove, slice tear, frame-line slip. In the tradition of Ray Gun (David Carson, 1992–95) · The End of Print (Carson and Lewis Blackwell, 1995) · Se7en title sequence (Kyle Cooper / R/GA, 1995) · Fuse (Neville Brody and Jon Wozencroft, 1991—) · Emigre magazine (VanderLans and Licko, 1984–2005) · Template Gothic (Barry Deck, 1990) · Beach Culture (Carson, 1989–91). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GRUNGE TYPOGRAPHY". Punchy sound design synced to every cut.
```

## 16 · Swiss Kinetic Type
*International Typographic Style · 1959 — · Typography & Text Motion*

Reference film: `videos/swiss.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Swiss Kinetic Type** (International Typographic Style, 1959 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The grid and sans-serif of Swiss graphic design, first set in motion by the North by Northwest title sequence.
- Study these reference works: North by Northwest titles (1959) · Se7en titles (1995)
- Motion DNA: Letters push through masks with fast-out eases and snap to grid columns on the beat.
- Visual DNA: Black, white and one red; 12-column grid; heavy grotesque against tiny captions.
- Signature transitions: Invert cut, slice offset, marquee step
- Key techniques: Mask reveals, Letter stagger, Grid snapping

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Mask reveals, Letter stagger, Grid snapping).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Mask reveals and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SWISS KINETIC TYPE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, CSS, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Swiss Kinetic Type motion-graphics film (International Typographic Style). Visual style: black, white and one red; 12-column grid; heavy grotesque against tiny captions. Motion: letters push through masks with fast-out eases and snap to grid columns on the beat. Signature moves: mask reveals, letter stagger, grid snapping; transitions: invert cut, slice offset, marquee step. In the tradition of North by Northwest titles (1959) · Se7en titles (1995). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SWISS KINETIC TYPE". Punchy sound design synced to every cut.
```

## 17 · Kuaishan Flash Type
*One Word per Beat · 2018 — · Typography & Text Motion*

Reference film: `videos/flash.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Kuaishan Flash Type** (One Word per Beat, 2018 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A beat-synced take on kinetic type that exploded on Douyin and in slideshow templates: one word fills the screen per beat.
- Study these reference works: Launch-event openers · year-end recap videos
- Motion DNA: Hard cut on every beat (120–130 BPM); each word lands with a short scale punch.
- Visual DNA: Black and white plus one highlight; ultra-bold sans; one word per frame.
- Signature transitions: Invert flash, zoom punch, countdown ring
- Key techniques: Word per beat, Zoom punch, Invert cuts

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Word per beat, Zoom punch, Invert cuts).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Word per beat and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "KUAISHAN FLASH TYPE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, CapCut, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Kuaishan Flash Type motion-graphics film (One Word per Beat). Visual style: black and white plus one highlight; ultra-bold sans; one word per frame. Motion: hard cut on every beat (120–130 BPM); each word lands with a short scale punch. Signature moves: word per beat, zoom punch, invert cuts; transitions: invert flash, zoom punch, countdown ring. In the tradition of Launch-event openers · year-end recap videos. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "KUAISHAN FLASH TYPE". Punchy sound design synced to every cut.
```

## 18 · Variable Font Motion
*Animated Type Axes · 2016 — · Typography & Text Motion*

Reference film: `videos/variablefont.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Variable Font Motion** (Animated Type Axes, 2016 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: OpenType Font Variations were announced jointly by Apple, Google, Microsoft and Adobe at ATypI Warsaw in 2016, letting one font file carry continuous design axes such as weight, width and optical size that can be animated like any other property.
- Study these reference works: Roboto Flex (Font Bureau / Google Fonts, 2022) · Decovar (David Berlow, 2017) · Amstelvar (David Berlow, 2016) · Bahnschrift (Aaron Bell / Microsoft, 2017) · DJR Font of the Month specimens
- Motion DNA: Letters never move position — they breathe in weight and width, waves travel through the word while every line stays locked to the frame edge.
- Visual DNA: Full-bleed grotesk on paper, ink and one signal red, specimen-sheet mono labels and axis sliders.
- Signature transitions: Hairline-to-black weight snaps, rows splitting and collapsing, width stretch to full bleed, hard cuts on the downbeat.
- Key techniques: Per-glyph wght / wdth interpolation, Justified rows solved to the frame edge, Phase-offset sine waves across glyphs

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Per-glyph wght / wdth interpolation, Justified rows solved to the frame edge, Phase-offset sine waves across glyphs).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Per-glyph wght / wdth interpolation and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VARIABLE FONT MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: CSS font-variation-settings, Canvas 2D, After Effects. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Variable Font Motion motion-graphics film (Animated Type Axes). Visual style: full-bleed grotesk on paper, ink and one signal red, specimen-sheet mono labels and axis sliders. Motion: letters never move position — they breathe in weight and width, waves travel through the word while every line stays locked to the frame edge. Signature moves: per-glyph wght / wdth interpolation, justified rows solved to the frame edge, phase-offset sine waves across glyphs; transitions: hairline-to-black weight snaps, rows splitting and collapsing, width stretch to full bleed, hard cuts on the downbeat. In the tradition of Roboto Flex (Font Bureau / Google Fonts, 2022) · Decovar (David Berlow, 2017) · Amstelvar (David Berlow, 2016) · Bahnschrift (Aaron Bell / Microsoft, 2017) · DJR Font of the Month specimens. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VARIABLE FONT MOTION". Punchy sound design synced to every cut.
```

## 19 · ASCII Motion
*Luminance as Characters · 1966 — · Typography & Text Motion*

Reference film: `videos/ascii.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **ASCII Motion** (Luminance as Characters, 1966 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Born when Kenneth Knowlton and Leon Harmon built pictures from printed symbols at Bell Labs in 1966, then carried on through teletype art, BBS ANSI scenes, the demoscene and real-time converters such as AAlib.
- Study these reference works: Studies in Perception I (Knowlton & Harmon, 1966) · ASCII Star Wars (Simon Jansen, 1997) · AAlib / BB demo (1997) · donut.c (Andy Sloane, 2006) · FIGlet banners (1991)
- Motion DNA: Nothing moves but the character in each fixed cell: motion is luminance changing glyphs on a rigid monospace grid.
- Visual DNA: Phosphor green on black with bloom and scanlines, density ramps from dot to @, then full-colour lolcat scans.
- Signature transitions: Character dissolve, scanline colour wipe, matrix-rain cascade, banner rain-in.
- Key techniques: Per-cell raymarched SDF, Luminance → glyph density ramp, Column cascade + banner reassembly

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Per-cell raymarched SDF, Luminance → glyph density ramp, Column cascade + banner reassembly).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Per-cell raymarched SDF and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ASCII MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, WebGL shader, Terminal. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second ASCII Motion motion-graphics film (Luminance as Characters). Visual style: phosphor green on black with bloom and scanlines, density ramps from dot to @, then full-colour lolcat scans. Motion: nothing moves but the character in each fixed cell: motion is luminance changing glyphs on a rigid monospace grid. Signature moves: per-cell raymarched sdf, luminance → glyph density ramp, column cascade + banner reassembly; transitions: character dissolve, scanline colour wipe, matrix-rain cascade, banner rain-in. In the tradition of Studies in Perception I (Knowlton & Harmon, 1966) · ASCII Star Wars (Simon Jansen, 1997) · AAlib / BB demo (1997) · donut.c (Andy Sloane, 2006) · FIGlet banners (1991). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ASCII MOTION". Punchy sound design synced to every cut.
```

## 20 · 3D Typography
*Extruded Letterforms · 1978 — · Typography & Text Motion*

Reference film: `videos/type3d.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **3D Typography** (Extruded Letterforms, 1978 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Grew out of the late-1970s and 1980s broadcast idents, when studios such as Robert Abel and Associates and Pacific Data Images flew chrome and extruded logos through computer-generated space; Cinema 4D and real-time engines later made it a staple of title design.
- Study these reference works: Superman title sequence (R/Greenberg Associates, 1978) · Robert Abel & Associates broadcast idents (1980s) · 20th Century Fox logo (CG version, 1994) · Universal Pictures logo (CG version, 1997)
- Motion DNA: Heavy letters tumble in with weight and bounce, the camera orbits to prove they are solid, then everything locks into a frontal hero lockup.
- Visual DNA: Chrome faces with horizon-band reflections on saturated plastic sides, dark studio cyclorama, glossy floor reflection, lens glint.
- Signature transitions: Drop-and-bounce landings, domino flips, camera whip-pan, glint sweep on the lock.
- Key techniques: Affine-projected glyph planes, Perspective layer-stack extrusion, Chrome env-band shading + floor reflection

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Affine-projected glyph planes, Perspective layer-stack extrusion, Chrome env-band shading + floor reflection).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Affine-projected glyph planes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "3D TYPOGRAPHY", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D, Three.js, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second 3D Typography motion-graphics film (Extruded Letterforms). Visual style: chrome faces with horizon-band reflections on saturated plastic sides, dark studio cyclorama, glossy floor reflection, lens glint. Motion: heavy letters tumble in with weight and bounce, the camera orbits to prove they are solid, then everything locks into a frontal hero lockup. Signature moves: affine-projected glyph planes, perspective layer-stack extrusion, chrome env-band shading + floor reflection; transitions: drop-and-bounce landings, domino flips, camera whip-pan, glint sweep on the lock. In the tradition of Superman title sequence (R/Greenberg Associates, 1978) · Robert Abel & Associates broadcast idents (1980s) · 20th Century Fox logo (CG version, 1994) · Universal Pictures logo (CG version, 1997). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "3D TYPOGRAPHY". Punchy sound design synced to every cut.
```

## 21 · Expressive Kinetic Type
*Type with a Voice · 1959 — · Typography & Text Motion*

Reference film: `videos/kinetic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Expressive Kinetic Type** (Type with a Voice, 1959 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Saul Bass and Pablo Ferro made words perform in film titles; in the 2000s After Effects lyric and dialogue pieces turned "kinetic typography" into a genre, where size, weight and placement follow the rhythm of a voice.
- Study these reference works: North by Northwest titles (Saul Bass, 1959) · Dr. Strangelove titles (Pablo Ferro, 1964) · Jamie xx, "Let's Do It Again" (2016) · Pulp Fiction kinetic type tributes (2000s)
- Motion DNA: Every word moves the way it is sung: whispers blur in, shouts slam with overshoot, stretched words track out and shaken words tremble, while the camera whips and rotates between phrases.
- Visual DNA: Black-weight grotesk against a hairline italic serif, bone on soot with one vermilion, all words locking into a single justified poster.
- Signature transitions: Whip pans with motion blur, 90° camera rolls, full-frame colour inversions on the downbeat, final pull-out reveal.
- Key techniques: Camera flies through a typographic poster, Spring slams, stretch & shake per glyph, Serif whisper vs. black sans shout

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Camera flies through a typographic poster, Spring slams, stretch & shake per glyph, Serif whisper vs. black sans shout).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Camera flies through a typographic poster and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "EXPRESSIVE KINETIC TYPE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Expressive Kinetic Type motion-graphics film (Type with a Voice). Visual style: black-weight grotesk against a hairline italic serif, bone on soot with one vermilion, all words locking into a single justified poster. Motion: every word moves the way it is sung: whispers blur in, shouts slam with overshoot, stretched words track out and shaken words tremble, while the camera whips and rotates between phrases. Signature moves: camera flies through a typographic poster, spring slams, stretch & shake per glyph, serif whisper vs. black sans shout; transitions: whip pans with motion blur, 90° camera rolls, full-frame colour inversions on the downbeat, final pull-out reveal. In the tradition of North by Northwest titles (Saul Bass, 1959) · Dr. Strangelove titles (Pablo Ferro, 1964) · Jamie xx, "Let's Do It Again" (2016) · Pulp Fiction kinetic type tributes (2000s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "EXPRESSIVE KINETIC TYPE". Punchy sound design synced to every cut.
```

## 22 · Text Morphing
*One Word Becomes the Next · 1991 — · Typography & Text Motion*

Reference film: `videos/textmorph.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Text Morphing** (One Word Becomes the Next, 1991 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Shape morphing went mainstream with the Beier–Neely field-morphing of Michael Jackson's "Black or White" (1991) and After Effects shape-layer tweening; on the web, sampling glyphs into particles let one word liquefy into the next.
- Study these reference works: "Black or White" morph sequence (Pacific Data Images, 1991) · After Effects shape-layer path morphs · Google I/O countdown experiments · Apple "Shot on iPhone" type transitions
- Motion DNA: Letters never cut: mass flows from word to word in a staggered wave, overshoots like a liquid, leaves a smear, then snaps crisp.
- Visual DNA: One heavy geometric face in bone white on near-black, an acid-lime trace of the motion, specimen-style mono read-outs.
- Signature transitions: Point-cloud morph, droplet burst, vortex ring, liquid splash on landing.
- Key techniques: Glyph raster → 5 px point cloud, Column-ordered point matching, Spring overshoot, curl & smear, Blur + threshold liquid render

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Glyph raster → 5 px point cloud, Column-ordered point matching, Spring overshoot, curl & smear, Blur + threshold liquid render).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Glyph raster → 5 px point cloud and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TEXT MORPHING", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, After Effects shape morph, WebGL particles. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Text Morphing motion-graphics film (One Word Becomes the Next). Visual style: one heavy geometric face in bone white on near-black, an acid-lime trace of the motion, specimen-style mono read-outs. Motion: letters never cut: mass flows from word to word in a staggered wave, overshoots like a liquid, leaves a smear, then snaps crisp. Signature moves: glyph raster → 5 px point cloud, column-ordered point matching, spring overshoot, curl & smear, blur + threshold liquid render; transitions: point-cloud morph, droplet burst, vortex ring, liquid splash on landing. In the tradition of "Black or White" morph sequence (Pacific Data Images, 1991) · After Effects shape-layer path morphs · Google I/O countdown experiments · Apple "Shot on iPhone" type transitions. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TEXT MORPHING". Punchy sound design synced to every cut.
```

## 23 · Editorial Typography
*The Magazine Page in Motion · 1934 — · Typography & Text Motion*

Reference film: `videos/editorial.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Editorial Typography** (The Magazine Page in Motion, 1934 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Alexey Brodovitch's Harper's Bazaar spreads made the magazine page a choreographed space of didone headlines, white space and photography; Pentagram, Wallpaper* and The New York Times Magazine later carried that grid-bound restraint into covers and features that move.
- Study these reference works: Harper's Bazaar (Alexey Brodovitch, 1934 — 1958) · Vogue covers and mastheads (Didot lineage) · Wallpaper* (1996 —) · The New York Times Magazine animated covers (2010s —) · Pentagram editorial systems
- Motion DNA: Nothing bounces: rules draw, lines rise through masks and columns set one line at a time on long, decelerating eases, punctuated by a single page turn.
- Visual DNA: High-contrast didone display type, justified serif body, drop cap and pull quote in oxblood on warm paper, duotone photography held in a precise grid.
- Signature transitions: Grid reveal, masked headline rise, image-box open, page turn, pull-back to the closed issue.
- Key techniques: Six-column grid with hairline rules, Masked line-by-line justified setting, Procedural duotone photographs, Perspective page turn

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Six-column grid with hairline rules, Masked line-by-line justified setting, Procedural duotone photographs, Perspective page turn).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Six-column grid with hairline rules and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "EDITORIAL TYPOGRAPHY", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, InDesign, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Editorial Typography motion-graphics film (The Magazine Page in Motion). Visual style: high-contrast didone display type, justified serif body, drop cap and pull quote in oxblood on warm paper, duotone photography held in a precise grid. Motion: nothing bounces: rules draw, lines rise through masks and columns set one line at a time on long, decelerating eases, punctuated by a single page turn. Signature moves: six-column grid with hairline rules, masked line-by-line justified setting, procedural duotone photographs, perspective page turn; transitions: grid reveal, masked headline rise, image-box open, page turn, pull-back to the closed issue. In the tradition of Harper's Bazaar (Alexey Brodovitch, 1934 — 1958) · Vogue covers and mastheads (Didot lineage) · Wallpaper* (1996 —) · The New York Times Magazine animated covers (2010s —) · Pentagram editorial systems. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "EDITORIAL TYPOGRAPHY". Punchy sound design synced to every cut.
```

## 24 · Typewriter Animation
*Slug-Struck Type · 1874 — · Typography & Text Motion*

Reference film: `videos/typewriter.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Typewriter Animation** (Slug-Struck Type, 1874 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The Sholes & Glidden "Type-Writer", sold by Remington from 1874, fixed the QWERTY layout and the look of monospaced slug-struck type; the Underwood No. 5 (1900) made front-strike visible writing the office standard. Film and television borrowed its rhythm for typed-on titles and location supers, and After Effects ships a "Typewriter" text preset that reveals one character at a time.
- Study these reference works: Sholes & Glidden Type-Writer (Remington, 1874) · Underwood No. 5 (1900) · Leroy Anderson, "The Typewriter" (1950) · Naked Lunch (David Cronenberg, 1991) · Atonement (Joe Wright, 2007; typewriter in Dario Marianelli’s score)
- Motion DNA: Time is quantised into keystrokes: each letter lands with a hard impact while the carriage steps one pitch left; a bell warns of the margin, the return lever throws the page back and ratchets a line, and mistakes are x-ed out instead of erased.
- Visual DNA: Monospaced slab-serif slugs pressed unevenly into off-white bond — heavy where the bar hit hard, broken where the ribbon ran dry, each letter a hair off the baseline — in black or red ribbon, framed by chrome and black enamel.
- Signature transitions: Carriage-return whip, line feed, pull-back reveal, macro dive into a single glyph, typed-on title card
- Key techniques: Per-keystroke timing with human jitter, Carriage escapement, bell & return, Uneven ribbon ink, misaligned slugs, Bichrome black/red ribbon

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Per-keystroke timing with human jitter, Carriage escapement, bell & return, Uneven ribbon ink, misaligned slugs, Bichrome black/red ribbon).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Per-keystroke timing with human jitter and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TYPEWRITER ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects (Typewriter text preset), Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Typewriter Animation motion-graphics film (Slug-Struck Type). Visual style: monospaced slab-serif slugs pressed unevenly into off-white bond — heavy where the bar hit hard, broken where the ribbon ran dry, each letter a hair off the baseline — in black or red ribbon, framed by chrome and black enamel. Motion: time is quantised into keystrokes: each letter lands with a hard impact while the carriage steps one pitch left; a bell warns of the margin, the return lever throws the page back and ratchets a line, and mistakes are x-ed out instead of erased. Signature moves: per-keystroke timing with human jitter, carriage escapement, bell & return, uneven ribbon ink, misaligned slugs, bichrome black/red ribbon; transitions: carriage-return whip, line feed, pull-back reveal, macro dive into a single glyph, typed-on title card. In the tradition of Sholes & Glidden Type-Writer (Remington, 1874) · Underwood No. 5 (1900) · Leroy Anderson, "The Typewriter" (1950) · Naked Lunch (David Cronenberg, 1991) · Atonement (Joe Wright, 2007; typewriter in Dario Marianelli’s score). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TYPEWRITER ANIMATION". Punchy sound design synced to every cut.
```

## 25 · Text-on-Path Motion
*Type Along a Curve · 1958 — · Typography & Text Motion*

Reference film: `videos/textpath.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Text-on-Path Motion** (Type Along a Curve, 1958 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Letters that ride a line instead of a baseline. Calligrams bent verse into pictures, Saul Bass and John Whitney built the Vertigo (1958) titles around turning spirals, and 1990s title designers such as Kyle Cooper made type itself a moving line. After Effects 6.0 (2003) brought text layers with Path Options, and ribbons, spirals and rotating rings of words became a staple of brand films.
- Study these reference works: Calligrammes (Guillaume Apollinaire, 1918) · Vertigo title sequence (Saul Bass & John Whitney, 1958) · Kyle Cooper / Imaginary Forces title work (1996 —) · After Effects text Path Options (Adobe, 2003) · SVG <textPath> (W3C, 2001)
- Motion DNA: Letters never move on their own: the path moves and the type flows along it — a line draws on, swells into a looping ribbon, winds into a turning spiral, collapses to a point and snaps shut as a rotating ring.
- Visual DNA: Heavy grotesk and an italic serif riding vermilion and ultramarine bands on warm paper; Bass-like flat shapes, hairline guides and a single circular seal.
- Signature transitions: Path draw-on, path morph, spiral collapse, ring burst, letters riding arcs into a lock-up
- Key techniques: Arc-length glyph placement, Perpendicular-to-path rotation, Path morph & first-margin flow, Ribbon band with knocked-out letters

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Arc-length glyph placement, Perpendicular-to-path rotation, Path morph & first-margin flow, Ribbon band with knocked-out letters).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Arc-length glyph placement and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TEXT-ON-PATH MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects (Path Options), SVG textPath, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Text-on-Path Motion motion-graphics film (Type Along a Curve). Visual style: heavy grotesk and an italic serif riding vermilion and ultramarine bands on warm paper; Bass-like flat shapes, hairline guides and a single circular seal. Motion: letters never move on their own: the path moves and the type flows along it — a line draws on, swells into a looping ribbon, winds into a turning spiral, collapses to a point and snaps shut as a rotating ring. Signature moves: arc-length glyph placement, perpendicular-to-path rotation, path morph & first-margin flow, ribbon band with knocked-out letters; transitions: path draw-on, path morph, spiral collapse, ring burst, letters riding arcs into a lock-up. In the tradition of Calligrammes (Guillaume Apollinaire, 1918) · Vertigo title sequence (Saul Bass & John Whitney, 1958) · Kyle Cooper / Imaginary Forces title work (1996 —) · After Effects text Path Options (Adobe, 2003) · SVG <textPath> (W3C, 2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TEXT-ON-PATH MOTION". Punchy sound design synced to every cut.
```

## 26 · Calligraphic Motion
*Thick & Thin, Stroke by Stroke · 1906 — · Typography & Text Motion*

Reference film: `videos/calligraphic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Calligraphic Motion** (Thick & Thin, Stroke by Stroke, 1906 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Edward Johnston’s Writing & Illuminating, & Lettering (1906) revived the broad-edged pen and taught that every letter is a sequence of strokes made at a constant pen angle; Hermann Zapf carried that hand into type and lettering (Palatino 1948, Zapfino 1998). Title designers and lettering artists made the write-on its film form, revealing a word in the order a scribe would draw it, with the nib’s thick-and-thin contrast intact.
- Study these reference works: Edward Johnston, Writing & Illuminating, & Lettering (1906) · Hermann Zapf, Pen and Graver (1952) · Saul Bass, The Age of Innocence title sequence (1993) · Seb Lester’s filmed calligraphy (2010s —) · Apple’s script “hello” (Macintosh, 1984 —)
- Motion DNA: Every letter is revealed in true stroke order and direction, a pen leading the mark; strokes accelerate through the straights and slow into the turns, the pen lifts and arcs between strokes, and a final flourish swings out faster than the letters.
- Visual DNA: Black-brown ink on cream laid paper with thick downstrokes and hairline upstrokes fixed by a 40° pen angle, a vermilion versal capital, pencil guide lines and a nib-width ladder in the margin, and glossy pooled ink at every stroke ending.
- Signature transitions: Macro on the nib, pull-back write-on, flourish under-swing, erase of the guide lines, title settle
- Key techniques: Broad-edge nib swept at a fixed angle, Stroke-order write-on, Pointed-pen pressure swells, Wet iron-gall ink pooling and drying

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Broad-edge nib swept at a fixed angle, Stroke-order write-on, Pointed-pen pressure swells, Wet iron-gall ink pooling and drying).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Broad-edge nib swept at a fixed angle and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CALLIGRAPHIC MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects (stroke write-on over hand-traced paths), Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Calligraphic Motion motion-graphics film (Thick & Thin, Stroke by Stroke). Visual style: black-brown ink on cream laid paper with thick downstrokes and hairline upstrokes fixed by a 40° pen angle, a vermilion versal capital, pencil guide lines and a nib-width ladder in the margin, and glossy pooled ink at every stroke ending. Motion: every letter is revealed in true stroke order and direction, a pen leading the mark; strokes accelerate through the straights and slow into the turns, the pen lifts and arcs between strokes, and a final flourish swings out faster than the letters. Signature moves: broad-edge nib swept at a fixed angle, stroke-order write-on, pointed-pen pressure swells, wet iron-gall ink pooling and drying; transitions: macro on the nib, pull-back write-on, flourish under-swing, erase of the guide lines, title settle. In the tradition of Edward Johnston, Writing & Illuminating, & Lettering (1906) · Hermann Zapf, Pen and Graver (1952) · Saul Bass, The Age of Innocence title sequence (1993) · Seb Lester’s filmed calligraphy (2010s —) · Apple’s script “hello” (Macintosh, 1984 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CALLIGRAPHIC MOTION". Punchy sound design synced to every cut.
```

## 27 · Typographic Collage
*Parole in Libertà · 1912 — · Typography & Text Motion*

Reference film: `videos/typocollage.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Typographic Collage** (Parole in Libertà, 1912 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: F. T. Marinetti’s Futurist “words-in-freedom” (from 1912; Zang Tumb Tuuum, 1914) broke the line of type into onomatopoeia, mathematical signs and mixed faces flung along diagonals; Dada and Russian Constructivist typographers cut and pasted found print, and 1970s punk flyers (Jamie Reid, Linder) turned ransom-note letters, ticket stubs and tape into a xerox vernacular. Motion designers animate it as stop-motion paste-up, a piece per frame.
- Study these reference works: F. T. Marinetti, Zang Tumb Tuuum (1914) · Marinetti, Les mots en liberté futuristes (1919) · Kurt Schwitters, Merz collages (1919 —) · Jamie Reid, sleeve and poster art for the Sex Pistols (1977) · Barbara Kruger, Untitled works (1980s)
- Motion DNA: Paste-up on twos: each scrap slaps down in two or three held frames, dropping out of focus and shadow, the camera stepping with it; words are spelled one found letter at a time along diagonals, a vowel stretches by repetition, and a sheet slides in whole to clear space for the title.
- Visual DNA: Wood type with grain in the ink, Bodoni and Anton headline cut-outs, newspaper columns, halftone, ticket stubs with perforations and masking tape on a newsprint table, in black, cream and Futurist red with the paper’s white core showing on torn edges.
- Signature transitions: Slap-down, word build, rule burst, sheet slide-over, strip paste and tape
- Key techniques: Found letters, one face per glyph, Torn and scissor-cut edges, Stop-motion on twos (12 fps), Diagonal Futurist composition

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Found letters, one face per glyph, Torn and scissor-cut edges, Stop-motion on twos (12 fps), Diagonal Futurist composition).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Found letters, one face per glyph and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TYPOGRAPHIC COLLAGE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects (stop-motion paste-up), Scanned print ephemera, Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Typographic Collage motion-graphics film (Parole in Libertà). Visual style: wood type with grain in the ink, Bodoni and Anton headline cut-outs, newspaper columns, halftone, ticket stubs with perforations and masking tape on a newsprint table, in black, cream and Futurist red with the paper’s white core showing on torn edges. Motion: paste-up on twos: each scrap slaps down in two or three held frames, dropping out of focus and shadow, the camera stepping with it; words are spelled one found letter at a time along diagonals, a vowel stretches by repetition, and a sheet slides in whole to clear space for the title. Signature moves: found letters, one face per glyph, torn and scissor-cut edges, stop-motion on twos (12 fps), diagonal futurist composition; transitions: slap-down, word build, rule burst, sheet slide-over, strip paste and tape. In the tradition of F. T. Marinetti, Zang Tumb Tuuum (1914) · Marinetti, Les mots en liberté futuristes (1919) · Kurt Schwitters, Merz collages (1919 —) · Jamie Reid, sleeve and poster art for the Sex Pistols (1977) · Barbara Kruger, Untitled works (1980s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TYPOGRAPHIC COLLAGE". Punchy sound design synced to every cut.
```

## 28 · Rubber Hose
*Golden-age Cartoon · 1920s — · 2D Animation & Illustration*

Reference film: `videos/rubberhose.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Rubber Hose** (Golden-age Cartoon, 1920s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The first sound-era cartoon style: limbs drawn as boneless tubes that bend anywhere, so characters can bounce, stretch and dance on every beat of the soundtrack. It grew out of Fleischer Studios and Ub Iwerks' animation for early Disney, and was revived wholesale by Studio MDHR's Cuphead.
- Study these reference works: Steamboat Willie (Disney / Ub Iwerks, 1928) · The Skeleton Dance (Disney, 1929) · Swing You Sinners! (Fleischer, 1930) · Minnie the Moocher (Fleischer, 1932) · Cuphead (Studio MDHR, 2017)
- Motion DNA: A constant squash-and-stretch bounce locked to the music, with rubber limbs that stretch and snap back for gags.
- Visual DNA: Pie-cut eyes, white gloves and ink-black bodies on a faded sepia world, seen through grain, flicker and a weaving film gate.
- Signature transitions: Iris-in, iris-out, squash cut, title card
- Key techniques: Boneless noodle limbs, Everything pulses on the beat, Iris-out to a title card

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Boneless noodle limbs, Everything pulses on the beat, Iris-out to a title card).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Boneless noodle limbs and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RUBBER HOSE", held for about 1 s.

BUILD RULES
- Suggested tools: Toon Boom Harmony, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Needs hand animation (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Rubber Hose motion-graphics film (Golden-age Cartoon). Visual style: pie-cut eyes, white gloves and ink-black bodies on a faded sepia world, seen through grain, flicker and a weaving film gate. Motion: a constant squash-and-stretch bounce locked to the music, with rubber limbs that stretch and snap back for gags. Signature moves: boneless noodle limbs, everything pulses on the beat, iris-out to a title card; transitions: iris-in, iris-out, squash cut, title card. In the tradition of Steamboat Willie (Disney / Ub Iwerks, 1928) · The Skeleton Dance (Disney, 1929) · Swing You Sinners! (Fleischer, 1930) · Minnie the Moocher (Fleischer, 1932) · Cuphead (Studio MDHR, 2017). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RUBBER HOSE". Punchy sound design synced to every cut.
```

## 29 · Silhouette Animation
*Paper-cut Shadow Puppetry · 1919 — · 2D Animation & Illustration*

Reference film: `videos/silhouette.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Silhouette Animation** (Paper-cut Shadow Puppetry, 1919 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Jointed figures cut from black card and lead are laid on a lit glass table and moved a fraction per frame, so the picture is pure silhouette against tinted light. Lotte Reiniger perfected it in The Adventures of Prince Achmed, the oldest surviving animated feature.
- Study these reference works: The Adventures of Prince Achmed (Lotte Reiniger, 1926) · Papageno (Reiniger, 1935) · Hansel and Gretel (Reiniger, 1955) · Princes et Princesses (Michel Ocelot, 2000) · Tales of the Night (Ocelot, 2011)
- Motion DNA: Stepped stop-motion of jointed card puppets: limbs pivot on hidden hinges, walk cycles click from pose to pose, wings flap in rigid sections.
- Visual DNA: Pure black filigree silhouettes, intricate as lace, against luminous gradients tinted amber, teal and rose like nitrate-era prints.
- Signature transitions: Tint change, vertical pan, dip to black, intertitle
- Key techniques: Hinged card puppets on twos, Tinted backlit glass, Lace cut-outs & filigree

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hinged card puppets on twos, Tinted backlit glass, Lace cut-outs & filigree).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hinged card puppets on twos and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SILHOUETTE ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Multiplane light table, Dragonframe, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs hand-cut puppets (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Silhouette Animation motion-graphics film (Paper-cut Shadow Puppetry). Visual style: pure black filigree silhouettes, intricate as lace, against luminous gradients tinted amber, teal and rose like nitrate-era prints. Motion: stepped stop-motion of jointed card puppets: limbs pivot on hidden hinges, walk cycles click from pose to pose, wings flap in rigid sections. Signature moves: hinged card puppets on twos, tinted backlit glass, lace cut-outs & filigree; transitions: tint change, vertical pan, dip to black, intertitle. In the tradition of The Adventures of Prince Achmed (Lotte Reiniger, 1926) · Papageno (Reiniger, 1935) · Hansel and Gretel (Reiniger, 1955) · Princes et Princesses (Michel Ocelot, 2000) · Tales of the Night (Ocelot, 2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SILHOUETTE ANIMATION". Punchy sound design synced to every cut.
```

## 30 · Monoline Line Art
*One Continuous Stroke · 1971 — · 2D Animation & Illustration*

Reference film: `videos/lineart.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Monoline Line Art** (One Continuous Stroke, 1971 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: From Osvaldo Cavandoli's La Linea to modern trim-path brand films: one constant line that draws, morphs and redraws.
- Study these reference works: La Linea (1971) · Picasso light drawings for LIFE (1949)
- Motion DNA: A single path grows by trim and re-forms point by point into the next object.
- Visual DNA: One colour stroke, round caps, constant weight, generous empty space.
- Signature transitions: Point-wise morph, retract-and-redraw
- Key techniques: Stroke draw-on, Line morphing, Negative space

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Stroke draw-on, Line morphing, Negative space).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Stroke draw-on and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MONOLINE LINE ART", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, SVG, Lottie. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Monoline Line Art motion-graphics film (One Continuous Stroke). Visual style: one colour stroke, round caps, constant weight, generous empty space. Motion: a single path grows by trim and re-forms point by point into the next object. Signature moves: stroke draw-on, line morphing, negative space; transitions: point-wise morph, retract-and-redraw. In the tradition of La Linea (1971) · Picasso light drawings for LIFE (1949). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MONOLINE LINE ART". Punchy sound design synced to every cut.
```

## 31 · Collage
*Cut-out Mixed Media · 1969 — · 2D Animation & Illustration*

Reference film: `videos/collage.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Collage** (Cut-out Mixed Media, 1969 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Terry Gilliam's cut-out animation for Monty Python's Flying Circus made jerky paper puppets a comic language.
- Study these reference works: Monty Python's Flying Circus (1969 — 1974)
- Motion DNA: Rigid cut-outs hinge at joints and move in stepped, deliberately crude frames.
- Visual DNA: Halftone dots, newsprint, torn edges, mismatched scale, paper shadows.
- Signature transitions: Paper tear, giant-object gag
- Key techniques: Torn paper, Halftone texture, Hinged cut-outs

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Torn paper, Halftone texture, Hinged cut-outs).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Torn paper and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "COLLAGE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Photoshop. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural + collage assets.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Collage motion-graphics film (Cut-out Mixed Media). Visual style: halftone dots, newsprint, torn edges, mismatched scale, paper shadows. Motion: rigid cut-outs hinge at joints and move in stepped, deliberately crude frames. Signature moves: torn paper, halftone texture, hinged cut-outs; transitions: paper tear, giant-object gag. In the tradition of Monty Python's Flying Circus (1969 — 1974). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "COLLAGE". Punchy sound design synced to every cut.
```

## 32 · Isometric
*Axonometric Worlds · 1982 — · 2D Animation & Illustration*

Reference film: `videos/isometric.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Isometric** (Axonometric Worlds, 1982 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A 30° parallel projection from technical drawing became the go-to view for explaining systems, cities and products.
- Study these reference works: Zaxxon (1982) · SimCity 2000 (1993) · Monument Valley (2014)
- Motion DNA: Blocks drop and stack on the beat inside a fixed parallel projection; the camera only pans and zooms.
- Visual DNA: Limited pastel palette, 2:1 tiles, soft long shadows, tiny details.
- Signature transitions: Pull-back reveal, day-to-dusk relight
- Key techniques: 30° projection, Stacked build-up, Long soft shadows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (30° projection, Stacked build-up, Long soft shadows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on 30° projection and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ISOMETRIC", held for about 1 s.

BUILD RULES
- Suggested tools: Illustrator, Canvas 2D, Blender. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Isometric motion-graphics film (Axonometric Worlds). Visual style: limited pastel palette, 2:1 tiles, soft long shadows, tiny details. Motion: blocks drop and stack on the beat inside a fixed parallel projection; the camera only pans and zooms. Signature moves: 30° projection, stacked build-up, long soft shadows; transitions: pull-back reveal, day-to-dusk relight. In the tradition of Zaxxon (1982) · SimCity 2000 (1993) · Monument Valley (2014). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ISOMETRIC". Punchy sound design synced to every cut.
```

## 33 · Anime Sakuga
*Japanese Key Animation · 1980s — · 2D Animation & Illustration*

Reference film: `videos/sakuga.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Anime Sakuga** (Japanese Key Animation, 1980s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Sakuga (作画, "drawing pictures") is what fans call the stand-out stretches of Japanese TV and film animation where a star key animator cuts loose. Yoshinori Kanada's angular effects and contorted poses defined it in the 1980s, Akira raised the ceiling, and animators such as Yutaka Nakamura carried it into modern action anime.
- Study these reference works: Galaxy Express 999 (Kanada effects, 1979) · Harmagedon (Kanada, 1983) · Akira (Katsuhiro Otomo, 1988) · Cowboy Bebop: The Movie (Yutaka Nakamura, 2001) · Mob Psycho 100 (Bones, 2016)
- Motion DNA: Limited animation on 2s and 3s: a long hold, then an explosive smear, impact frames that flip polarity for single frames, and shake that decays on the ones.
- Visual DNA: Two-tone cel shading with hard shadow shapes, backlit rim-light silhouettes, focus lines and angular Kanada flames with geometric light shards.
- Signature transitions: Smash cut, impact frame, screen split, white flash
- Key techniques: Holds then smears, Impact frames & inversion, Kanada perspective & angular FX

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Holds then smears, Impact frames & inversion, Kanada perspective & angular FX).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Holds then smears and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ANIME SAKUGA", held for about 1 s.

BUILD RULES
- Suggested tools: Paper key animation, CLIP STUDIO / OpenToonz, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs a key animator (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Anime Sakuga motion-graphics film (Japanese Key Animation). Visual style: two-tone cel shading with hard shadow shapes, backlit rim-light silhouettes, focus lines and angular Kanada flames with geometric light shards. Motion: limited animation on 2s and 3s: a long hold, then an explosive smear, impact frames that flip polarity for single frames, and shake that decays on the ones. Signature moves: holds then smears, impact frames & inversion, kanada perspective & angular fx; transitions: smash cut, impact frame, screen split, white flash. In the tradition of Galaxy Express 999 (Kanada effects, 1979) · Harmagedon (Kanada, 1983) · Akira (Katsuhiro Otomo, 1988) · Cowboy Bebop: The Movie (Yutaka Nakamura, 2001) · Mob Psycho 100 (Bones, 2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ANIME SAKUGA". Punchy sound design synced to every cut.
```

## 34 · Comic Book Motion
*Panels in Motion · 1930s — · 2D Animation & Illustration*

Reference film: `videos/comic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Comic Book Motion** (Panels in Motion, 1930s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Motion comics animate the printed page itself: panels, gutters, captions and balloons stay on screen while the camera travels between them. The look descends from four-colour newsprint — Ben-Day dots, slipping colour plates, onomatopoeia — and was rebuilt for cinema by Sony Pictures Animation in Spider-Man: Into the Spider-Verse (2018).
- Study these reference works: Batman (ABC TV series, 1966) · Whaam! (Roy Lichtenstein, 1963) · Watchmen Motion Comic (Warner Premiere, 2008) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018) · Spider-Man: Across the Spider-Verse (2023)
- Motion DNA: Characters move on twos while the camera glides on ones, diving panel to panel with a pull-back-push-in, then a figure smashes through the panel border into a full-frame sound effect.
- Visual DNA: Four-colour newsprint: heavy black key line, flat CMY fills shaded with Ben-Day dots, plates slipping a few pixels out of register, yellow caption boxes and typed speech balloons.
- Signature transitions: Gutter dive, panel-border break, impact flash, page turn to cover
- Key techniques: Ben-Day halftone, CMYK misregistration, Animation on twos, Panel-to-panel camera

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ben-Day halftone, CMYK misregistration, Animation on twos, Panel-to-panel camera).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ben-Day halftone and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "COMIC BOOK MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Clip Studio Paint, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural + hand-drawn.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Comic Book Motion motion-graphics film (Panels in Motion). Visual style: four-colour newsprint: heavy black key line, flat CMY fills shaded with Ben-Day dots, plates slipping a few pixels out of register, yellow caption boxes and typed speech balloons. Motion: characters move on twos while the camera glides on ones, diving panel to panel with a pull-back-push-in, then a figure smashes through the panel border into a full-frame sound effect. Signature moves: ben-day halftone, cmyk misregistration, animation on twos, panel-to-panel camera; transitions: gutter dive, panel-border break, impact flash, page turn to cover. In the tradition of Batman (ABC TV series, 1966) · Whaam! (Roy Lichtenstein, 1963) · Watchmen Motion Comic (Warner Premiere, 2008) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018) · Spider-Man: Across the Spider-Verse (2023). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "COMIC BOOK MOTION". Punchy sound design synced to every cut.
```

## 35 · Flat Explainer
*Material Motion · 2013 — · 2D Animation & Illustration*

Reference film: `videos/flat.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Flat Explainer** (Material Motion, 2013 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Disney's twelve principles, flattened. Material Design made meaningful motion a written spec.
- Study these reference works: Kurzgesagt (2013 —) · Google Material Design (2014)
- Motion DNA: Springs with overshoot; one shape morphs into the next so every shot is connected.
- Visual DNA: Flat colour, rounded geometry, no outlines, bright harmonious palette.
- Signature transitions: Shape morph, ripple-out, fold-in to logo
- Key techniques: Squash & stretch, Overshoot, Shape morphing

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Squash & stretch, Overshoot, Shape morphing).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Squash & stretch and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FLAT EXPLAINER", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Lottie, Rive, CSS. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Flat Explainer motion-graphics film (Material Motion). Visual style: flat colour, rounded geometry, no outlines, bright harmonious palette. Motion: springs with overshoot; one shape morphs into the next so every shot is connected. Signature moves: squash & stretch, overshoot, shape morphing; transitions: shape morph, ripple-out, fold-in to logo. In the tradition of Kurzgesagt (2013 —) · Google Material Design (2014). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FLAT EXPLAINER". Punchy sound design synced to every cut.
```

## 36 · Whiteboard
*Draw-along Explainer · 2010 — · 2D Animation & Illustration*

Reference film: `videos/whiteboard.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Whiteboard** (Draw-along Explainer, 2010 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: RSA Animate drew lectures live on a whiteboard, sparking a wave of hand-drawn explainer videos.
- Study these reference works: RSA Animate (2010 —)
- Motion DNA: A hand leads every stroke in sync with narration; the camera pans to follow and pulls out at the end.
- Visual DNA: Black marker on white, one or two accent colours, handwritten headlines.
- Signature transitions: Pan-to-next idea, pull-out reveal
- Key techniques: Hand-led strokes, Doodle icons, Mind-map build

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hand-led strokes, Doodle icons, Mind-map build).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hand-led strokes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "WHITEBOARD", held for about 1 s.

BUILD RULES
- Suggested tools: VideoScribe, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural + hand-drawn.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Whiteboard motion-graphics film (Draw-along Explainer). Visual style: black marker on white, one or two accent colours, handwritten headlines. Motion: a hand leads every stroke in sync with narration; the camera pans to follow and pulls out at the end. Signature moves: hand-led strokes, doodle icons, mind-map build; transitions: pan-to-next idea, pull-out reveal. In the tradition of RSA Animate (2010 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "WHITEBOARD". Punchy sound design synced to every cut.
```

## 37 · Chalkboard Animation
*The Chalk Talk · 1900s — · 2D Animation & Illustration*

Reference film: `videos/chalkboard.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Chalkboard Animation** (The Chalk Talk, 1900s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Lecture-hall chalk talks became a screen style when explainer makers began filming, or faking, a hand drawing on slate: dusty strokes, an eraser that never quite cleans, and diagrams that start to move. Henry Reich’s MinutePhysics (2011) made the drawn-science explainer a web genre, and Ze Frank’s hand-scrawled lettering set its voice.
- Study these reference works: MinutePhysics (Henry Reich, 2011 —) · True Facts (Ze Frank, 2012 —) · Feynman Lectures on Physics, Caltech chalk talks (1961–63) · Good Will Hunting hallway blackboard (1997)
- Motion DNA: A chalk stick leads every stroke at handwriting speed, taps to punctuate, then a finished diagram suddenly moves on twos; a felt eraser scrubs in fast zigzags.
- Visual DNA: Dusty, broken white strokes on a dark green slate, cloudy with the half-erased ghosts of earlier lessons, then accents in yellow and pink chalk.
- Signature transitions: Eraser wipe, write-on, diagram release, colour-chalk highlight
- Key techniques: Hand-led chalk strokes, Dry-chalk grain coverage, Eraser ghosting, Diagram comes alive

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hand-led chalk strokes, Dry-chalk grain coverage, Eraser ghosting, Diagram comes alive).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hand-led chalk strokes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CHALKBOARD ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects (write-on + texture), Hand-drawn frames, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural + hand-drawn.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Chalkboard Animation motion-graphics film (The Chalk Talk). Visual style: dusty, broken white strokes on a dark green slate, cloudy with the half-erased ghosts of earlier lessons, then accents in yellow and pink chalk. Motion: a chalk stick leads every stroke at handwriting speed, taps to punctuate, then a finished diagram suddenly moves on twos; a felt eraser scrubs in fast zigzags. Signature moves: hand-led chalk strokes, dry-chalk grain coverage, eraser ghosting, diagram comes alive; transitions: eraser wipe, write-on, diagram release, colour-chalk highlight. In the tradition of MinutePhysics (Henry Reich, 2011 —) · True Facts (Ze Frank, 2012 —) · Feynman Lectures on Physics, Caltech chalk talks (1961–63) · Good Will Hunting hallway blackboard (1997). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CHALKBOARD ANIMATION". Punchy sound design synced to every cut.
```

## 38 · Watercolour Animation 水彩动画
*Painted Washes in Motion · 1940s — · 2D Animation & Illustration*

Reference film: `videos/watercolor.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Watercolour Animation 水彩动画** (Painted Washes in Motion, 1940s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Transparent washes on textured paper, where pigment blooms, granulates and dries with dark edges, were first carried into animation as painted backgrounds — Disney’s Snow White (1937) and Bambi (1942), then Kazuo Oga’s Ghibli landscapes. Isao Takahata’s The Tale of the Princess Kaguya (2013) went further and animated the wash itself.
- Study these reference works: Bambi (Disney, 1942; backgrounds by Tyrus Wong) · My Neighbor Totoro (Studio Ghibli, 1988; art director Kazuo Oga) · The Snowman (Dianne Jackson, 1982) · The Tale of the Princess Kaguya (Isao Takahata, 2013) · Ernest & Celestine (2012)
- Motion DNA: Nothing cuts: washes spread at the wet front and dry in place, glazes change the light, and only small things — rain, a kite, birds — move across a scene that is still being painted.
- Visual DNA: Transparent glazes on rough cold-press paper: soft wet-in-wet skies, darker dried edges, granulating blues, cauliflower backruns and white paper left for clouds and light.
- Signature transitions: Wet bloom, glaze over, lift-out, wash write-on
- Key techniques: Wet-on-wet blooms, Edge darkening & backruns, Pigment granulation, Glazing & lifting

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Wet-on-wet blooms, Edge darkening & backruns, Pigment granulation, Glazing & lifting).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Wet-on-wet blooms and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "WATERCOLOUR ANIMATION 水彩动画", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-painted cels + TVPaint, Photoshop / After Effects, Canvas 2D (per-pixel washes). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Watercolour Animation 水彩动画 motion-graphics film (Painted Washes in Motion). Visual style: transparent glazes on rough cold-press paper: soft wet-in-wet skies, darker dried edges, granulating blues, cauliflower backruns and white paper left for clouds and light. Motion: nothing cuts: washes spread at the wet front and dry in place, glazes change the light, and only small things — rain, a kite, birds — move across a scene that is still being painted. Signature moves: wet-on-wet blooms, edge darkening & backruns, pigment granulation, glazing & lifting; transitions: wet bloom, glaze over, lift-out, wash write-on. In the tradition of Bambi (Disney, 1942; backgrounds by Tyrus Wong) · My Neighbor Totoro (Studio Ghibli, 1988; art director Kazuo Oga) · The Snowman (Dianne Jackson, 1982) · The Tale of the Princess Kaguya (Isao Takahata, 2013) · Ernest & Celestine (2012). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "WATERCOLOUR ANIMATION 水彩动画". Punchy sound design synced to every cut.
```

## 39 · Liquid Motion
*Metaballs · 2014 — · 2D Animation & Illustration*

Reference film: `videos/liquid.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Liquid Motion** (Metaballs, 2014 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Jim Blinn's 1982 "blobby objects" became a 2D transition trend, and later system UI.
- Study these reference works: Jim Blinn, blobby objects (1982) · Apple's Dynamic Island (2022)
- Motion DNA: Blobs attract, merge and pinch apart under a threshold field with elastic inertia.
- Visual DNA: Glossy gradient fluid, soft highlights, rounded type.
- Signature transitions: Liquid flood, condense into type
- Key techniques: Field + threshold, Merge & split, Liquid wipe

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Field + threshold, Merge & split, Liquid wipe).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Field + threshold and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LIQUID MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, WebGL, Canvas 2D, SVG filter. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Liquid Motion motion-graphics film (Metaballs). Visual style: glossy gradient fluid, soft highlights, rounded type. Motion: blobs attract, merge and pinch apart under a threshold field with elastic inertia. Signature moves: field + threshold, merge & split, liquid wipe; transitions: liquid flood, condense into type. In the tradition of Jim Blinn, blobby objects (1982) · Apple's Dynamic Island (2022). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LIQUID MOTION". Punchy sound design synced to every cut.
```

## 40 · Limited Animation
*Held Cels, Moving Mouths · 1950 — · 2D Animation & Illustration*

Reference film: `videos/limited.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Limited Animation** (Held Cels, Moving Mouths, 1950 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: UPA (United Productions of America) broke with Disney’s full animation in Gerald McBoing-Boing (1950, Oscar 1951): flat modernist backgrounds, colour laid off-register from the line, stylised characters and only the drawings a gag needed. Hanna-Barbera turned that economy into a television system from The Ruff and Reddy Show (1957) onward — held bodies with separate mouth cels, swapped heads, walk cycles over repeating pans, timing on twos and threes.
- Study these reference works: Gerald McBoing-Boing (UPA, Robert Cannon, 1950) · Rooty Toot Toot (UPA, John Hubley, 1951) · The Ruff and Reddy Show (Hanna-Barbera, 1957) · The Huckleberry Hound Show (Hanna-Barbera, 1958) · The Flintstones (Hanna-Barbera, 1960)
- Motion DNA: Eight drawings a second, many of them held: a body freezes while only a mouth cel changes, a head is swapped for another view in one frame, a walk cycle repeats over a background that steps past and visibly repeats, and a zip-out replaces motion with a puff and speed lines.
- Visual DNA: Flat mid-century colour fields in mustard, teal and coral printed slightly off-register from thin black line, geometric characters with triangle noses and pork-pie hats, asterisk stars and lollipop trees, and gouache dry-brush on the backgrounds.
- Signature transitions: Hard cut, held pose, head swap, zip-out with dust puff, pop-on title card
- Key techniques: Held cels with separate mouth drawings, Swap heads, no in-betweens, Walk cycle over a repeating pan, Timing on threes (8 drawings/s)

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Held cels with separate mouth drawings, Swap heads, no in-betweens, Walk cycle over a repeating pan, Timing on threes (8 drawings/s)).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Held cels with separate mouth drawings and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LIMITED ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Cel animation (exposure sheet on threes), Toon Boom Harmony (cut-out rigs), Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Limited Animation motion-graphics film (Held Cels, Moving Mouths). Visual style: flat mid-century colour fields in mustard, teal and coral printed slightly off-register from thin black line, geometric characters with triangle noses and pork-pie hats, asterisk stars and lollipop trees, and gouache dry-brush on the backgrounds. Motion: eight drawings a second, many of them held: a body freezes while only a mouth cel changes, a head is swapped for another view in one frame, a walk cycle repeats over a background that steps past and visibly repeats, and a zip-out replaces motion with a puff and speed lines. Signature moves: held cels with separate mouth drawings, swap heads, no in-betweens, walk cycle over a repeating pan, timing on threes (8 drawings/s); transitions: hard cut, held pose, head swap, zip-out with dust puff, pop-on title card. In the tradition of Gerald McBoing-Boing (UPA, Robert Cannon, 1950) · Rooty Toot Toot (UPA, John Hubley, 1951) · The Ruff and Reddy Show (Hanna-Barbera, 1957) · The Huckleberry Hound Show (Hanna-Barbera, 1958) · The Flintstones (Hanna-Barbera, 1960). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LIMITED ANIMATION". Punchy sound design synced to every cut.
```

## 41 · Children's Book Animation
*Picture-book Illustration in Motion · 1950s — · 2D Animation & Illustration*

Reference film: `videos/picturebook.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Children's Book Animation** (Picture-book Illustration in Motion, 1950s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Picture-book art carried to the screen with its paper, crayon and paint intact. Morton Schindel's Weston Woods "iconographic" films (from 1955) slowly panned across the original book illustrations; Dianne Jackson's The Snowman (1982) animated the soft coloured-pencil texture of Raymond Briggs's 1978 book; Studio AKA's Lost and Found (2008) and Magic Light Pictures' Julia Donaldson & Axel Scheffler films kept the page's look in motion. Eric Carle's painted tissue-paper collage and the deadpan restraint of Jon Klassen and Oliver Jeffers shaped the contemporary vocabulary.
- Study these reference works: Make Way for Ducklings (Weston Woods, 1955) · The Snowman (Dianne Jackson, 1982) · Lost and Found (Philip Hunt / Studio AKA, 2008, from Oliver Jeffers) · The Gruffalo (Jakob Schuh & Max Lang, 2009) · Room on the Broom (Jan Lachauer & Max Lang, 2012) · Eric Carle, The Very Hungry Caterpillar (book, 1969) · Jon Klassen, I Want My Hat Back (book, 2011)
- Motion DNA: Unhurried and quiet: the camera drifts, layers slide past each other in shallow parallax, the character does one small thing per page, and the story moves forward by turning the page. Eyes slide sideways instead of faces emoting.
- Visual DNA: Cream paper with visible tooth, translucent painted tissue shapes overlapping into darker layers, waxy broken crayon lines, coloured-pencil hatching over flat gouache skies, a small character with dot eyes, and serif story text set in the open sky of the spread.
- Signature transitions: Cover open, page turn, parallax drift, vertical pan, word-by-word text
- Key techniques: Paper-tooth crayon & coloured-pencil fills, Painted tissue-paper collage (multiply), Page-turn structure, Gentle multiplane parallax

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Paper-tooth crayon & coloured-pencil fills, Painted tissue-paper collage (multiply), Page-turn structure, Gentle multiplane parallax).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Paper-tooth crayon & coloured-pencil fills and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CHILDREN'S BOOK ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Scanned textures + After Effects / Moho, TVPaint, Stop-frame cut paper, Canvas 2D (texture patterns, strip-drawn page turn). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Children's Book Animation motion-graphics film (Picture-book Illustration in Motion). Visual style: cream paper with visible tooth, translucent painted tissue shapes overlapping into darker layers, waxy broken crayon lines, coloured-pencil hatching over flat gouache skies, a small character with dot eyes, and serif story text set in the open sky of the spread. Motion: unhurried and quiet: the camera drifts, layers slide past each other in shallow parallax, the character does one small thing per page, and the story moves forward by turning the page. Eyes slide sideways instead of faces emoting. Signature moves: paper-tooth crayon & coloured-pencil fills, painted tissue-paper collage (multiply), page-turn structure, gentle multiplane parallax; transitions: cover open, page turn, parallax drift, vertical pan, word-by-word text. In the tradition of Make Way for Ducklings (Weston Woods, 1955) · The Snowman (Dianne Jackson, 1982) · Lost and Found (Philip Hunt / Studio AKA, 2008, from Oliver Jeffers) · The Gruffalo (Jakob Schuh & Max Lang, 2009) · Room on the Broom (Jan Lachauer & Max Lang, 2012) · Eric Carle, The Very Hungry Caterpillar (book, 1969) · Jon Klassen, I Want My Hat Back (book, 2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CHILDREN'S BOOK ANIMATION". Punchy sound design synced to every cut.
```

## 42 · Rotoscope
*Traced Over Live Action · 1915 — · 2D Animation & Illustration*

Reference film: `videos/rotoscope.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Rotoscope** (Traced Over Live Action, 1915 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Max Fleischer patented the rotoscope in 1915: live-action film projected one frame at a time onto glass so an animator could trace real motion. Disney used traced footage as reference for Snow White, Ralph Bakshi built whole features on it, a-ha’s “Take On Me” turned it into a living pencil sketch, and Bob Sabiston’s Rotoshop gave Richard Linklater’s Waking Life and A Scanner Darkly their interpolated, swimming flats.
- Study these reference works: Out of the Inkwell (Max & Dave Fleischer, 1918–29) · Minnie the Moocher (Fleischer, with Cab Calloway, 1932) · Snow White and the Seven Dwarfs (Disney, 1937) · The Lord of the Rings (Ralph Bakshi, 1978) · Take On Me (a-ha, dir. Steve Barron, 1985) · Waking Life (Richard Linklater, 2001) · A Scanner Darkly (Linklater, 2006)
- Motion DNA: Real human timing that no animator would invent — the heel-strike, the decelerating last step, the weight settling, overlapping arm swing — carried straight into drawing; in pencil the line boils on twos, in Rotoshop the same contours swim smoothly between keyed traces.
- Visual DNA: A sepia live-action plate in a projector gate, translucent animation bond on pegs, blue line-of-action construction under graphite contours and diagonal hatching; then flat posterised colour fields, thin wobbling ink lines and backgrounds that breathe.
- Signature transitions: Freeze frame, sheet drop onto pegs, light-table switch-off, push-in to the hand, live-action breakthrough, colour flood from the hand, traced title
- Key techniques: Frozen plate traced on pegs, Pencil boil with offset hatching, Rotoshop-style swimming flats

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Frozen plate traced on pegs, Pencil boil with offset hatching, Rotoshop-style swimming flats).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Frozen plate traced on pegs and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ROTOSCOPE", held for about 1 s.

BUILD RULES
- Suggested tools: Rotoscope projector and glass easel, Rotoshop vector interpolation, After Effects / TVPaint rotoscoping, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (the live-action plate is synthesised from the same rig).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Rotoscope motion-graphics film (Traced Over Live Action). Visual style: a sepia live-action plate in a projector gate, translucent animation bond on pegs, blue line-of-action construction under graphite contours and diagonal hatching; then flat posterised colour fields, thin wobbling ink lines and backgrounds that breathe. Motion: real human timing that no animator would invent — the heel-strike, the decelerating last step, the weight settling, overlapping arm swing — carried straight into drawing; in pencil the line boils on twos, in Rotoshop the same contours swim smoothly between keyed traces. Signature moves: frozen plate traced on pegs, pencil boil with offset hatching, rotoshop-style swimming flats; transitions: freeze frame, sheet drop onto pegs, light-table switch-off, push-in to the hand, live-action breakthrough, colour flood from the hand, traced title. In the tradition of Out of the Inkwell (Max & Dave Fleischer, 1918–29) · Minnie the Moocher (Fleischer, with Cab Calloway, 1932) · Snow White and the Seven Dwarfs (Disney, 1937) · The Lord of the Rings (Ralph Bakshi, 1978) · Take On Me (a-ha, dir. Steve Barron, 1985) · Waking Life (Richard Linklater, 2001) · A Scanner Darkly (Linklater, 2006). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ROTOSCOPE". Punchy sound design synced to every cut.
```

## 43 · Frame by Frame
*Straight-ahead on Twos · 1908 — · 2D Animation & Illustration*

Reference film: `videos/framebyframe.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Frame by Frame** (Straight-ahead on Twos, 1908 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Every frame drawn by hand: since Émile Cohl’s Fantasmagorie and Winsor McCay’s Gertie, animators have drawn on punched paper over a light table and flipped the pages to feel the motion. Pencil tests check timing before anything is cleaned up; Richard Williams codified the craft in The Animator’s Survival Kit, while Bill Plympton’s boiling pencil and Ryan Woodward’s Thought of You leave the rough line on screen.
- Study these reference works: Fantasmagorie (Émile Cohl, 1908) · Gertie the Dinosaur (Winsor McCay, 1914) · Your Face (Bill Plympton, 1987) · The Man Who Planted Trees (Frédéric Back, 1987) · The Animator’s Survival Kit (Richard Williams, 2001) · Thought of You (Ryan Woodward, 2010)
- Motion DNA: Twelve drawings a second, each held for two frames: a straight-ahead flow from one drawing to the next, squash on contact and stretch on the fall, spacing that eases out of every arc, and a line that never sits still because no two drawings are traced exactly alike.
- Visual DNA: Warm animation bond on brass pegs over a light table, blue construction pencil under graphite, red and blue onion skins of the neighbouring drawings, an exposure sheet filling in down the side and hand-lettered notes in the margins.
- Signature transitions: Sheet drop onto pegs, ball-to-character metamorphosis, 2D squash turn, chronophotographic overlay, letter-by-letter title
- Key techniques: Bouncing-ball arcs and spacing, Onion skins either side, Boiling line on twos

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Bouncing-ball arcs and spacing, Onion skins either side, Boiling line on twos).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Bouncing-ball arcs and spacing and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FRAME BY FRAME", held for about 1 s.

BUILD RULES
- Suggested tools: Pencil on punched paper, light table and line tester, TVPaint / Toon Boom Harmony / Procreate Dreams, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (boil and registration jitter are seeded per drawing).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Frame by Frame motion-graphics film (Straight-ahead on Twos). Visual style: warm animation bond on brass pegs over a light table, blue construction pencil under graphite, red and blue onion skins of the neighbouring drawings, an exposure sheet filling in down the side and hand-lettered notes in the margins. Motion: twelve drawings a second, each held for two frames: a straight-ahead flow from one drawing to the next, squash on contact and stretch on the fall, spacing that eases out of every arc, and a line that never sits still because no two drawings are traced exactly alike. Signature moves: bouncing-ball arcs and spacing, onion skins either side, boiling line on twos; transitions: sheet drop onto pegs, ball-to-character metamorphosis, 2D squash turn, chronophotographic overlay, letter-by-letter title. In the tradition of Fantasmagorie (Émile Cohl, 1908) · Gertie the Dinosaur (Winsor McCay, 1914) · Your Face (Bill Plympton, 1987) · The Man Who Planted Trees (Frédéric Back, 1987) · The Animator’s Survival Kit (Richard Williams, 2001) · Thought of You (Ryan Woodward, 2010). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FRAME BY FRAME". Punchy sound design synced to every cut.
```

## 44 · Anime MG
*OP & Title-card Motion Graphics · 1995 — · 2D Animation & Illustration*

Reference film: `videos/animemg.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Anime MG** (OP & Title-card Motion Graphics, 1995 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Japanese TV anime compresses a whole show into a 90-second opening cut hard to its theme song: speed lines, smear frames, cel-flat colour, lens flares and huge type. Evangelion’s stark kanji title cards, Production I.G’s layered digital compositing, Shaft’s typographic interruptions and TRIGGER’s slammed katakana logos made the title card itself a motion-graphics form.
- Study these reference works: Neon Genesis Evangelion (Gainax, 1995) · Ghost in the Shell: Stand Alone Complex (Production I.G, 2002) · The Melancholy of Haruhi Suzumiya (Kyoto Animation, 2006) · Bakemonogatari (Shaft, 2009) · Kill la Kill (Trigger, 2013) · Promare (Trigger, 2019)
- Motion DNA: Cut to the beat: holds and slams on the downbeat, characters on twos against backgrounds panning on ones, smear multiples on fast limbs, slow-motion leaps across the sun, a single impact frame with decaying shake, springy logo slams and a closing shine.
- Visual DNA: Flat cel colour with one hard shadow tone, ink outlines, saturated red/yellow/cyan cards, heavy condensed English type paired with katakana, cel-shaded cumulus on gradient skies, hexagonal lens ghosts, warm light leaks, sparkles and halftone starbursts.
- Signature transitions: Anamorphic slit open, smash cut, panel slams and slides, tilt-up reveal, impact inversion, letterbox snap, white slash wipe, logo slam
- Key techniques: Speed lines and smear multiples, Beat-synced type-card slams, Cel shadow bands, flares, leaks

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Speed lines and smear multiples, Beat-synced type-card slams, Cel shadow bands, flares, leaks).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Speed lines and smear multiples and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ANIME MG", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-drawn cels and digital ink & paint, After Effects compositing (flares, leaks, type), Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Anime MG motion-graphics film (OP & Title-card Motion Graphics). Visual style: flat cel colour with one hard shadow tone, ink outlines, saturated red/yellow/cyan cards, heavy condensed English type paired with katakana, cel-shaded cumulus on gradient skies, hexagonal lens ghosts, warm light leaks, sparkles and halftone starbursts. Motion: cut to the beat: holds and slams on the downbeat, characters on twos against backgrounds panning on ones, smear multiples on fast limbs, slow-motion leaps across the sun, a single impact frame with decaying shake, springy logo slams and a closing shine. Signature moves: speed lines and smear multiples, beat-synced type-card slams, cel shadow bands, flares, leaks; transitions: anamorphic slit open, smash cut, panel slams and slides, tilt-up reveal, impact inversion, letterbox snap, white slash wipe, logo slam. In the tradition of Neon Genesis Evangelion (Gainax, 1995) · Ghost in the Shell: Stand Alone Complex (Production I.G, 2002) · The Melancholy of Haruhi Suzumiya (Kyoto Animation, 2006) · Bakemonogatari (Shaft, 2009) · Kill la Kill (Trigger, 2013) · Promare (Trigger, 2019). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ANIME MG". Punchy sound design synced to every cut.
```

## 45 · MoGraph
*Cinema 4D Cloner Look · 2006 — · 3D & CGI Motion*

Reference film: `videos/mograph.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **MoGraph** (Cinema 4D Cloner Look, 2006 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Cinema 4D's MoGraph module let designers drive arrays of objects with effectors, the signature of studio 3D motion.
- Study these reference works: ManvsMachine · Beeple, Everydays (2007 —)
- Motion DNA: Hundreds of clones driven by one field at a time: wave, ripple, twist, random, fall.
- Visual DNA: Studio grey gradient, soft shadows, white clay plus one bold accent.
- Signature transitions: Effector hand-off, scatter and re-form
- Key techniques: Cloner arrays, Effector waves, Camera orbit

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Cloner arrays, Effector waves, Camera orbit).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Cloner arrays and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MOGRAPH", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D, Houdini, Three.js. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second MoGraph motion-graphics film (Cinema 4D Cloner Look). Visual style: studio grey gradient, soft shadows, white clay plus one bold accent. Motion: hundreds of clones driven by one field at a time: wave, ripple, twist, random, fall. Signature moves: cloner arrays, effector waves, camera orbit; transitions: effector hand-off, scatter and re-form. In the tradition of ManvsMachine · Beeple, Everydays (2007 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MOGRAPH". Punchy sound design synced to every cut.
```

## 46 · Low Poly
*Faceted Geometry · 1990s — · 3D & CGI Motion*

Reference film: `videos/lowpoly.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Low Poly** (Faceted Geometry, 1990s —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Born of the polygon budgets of early real-time 3D (Virtua Fighter, the PlayStation era), low poly returned in the 2010s as a deliberate aesthetic: flat-shaded triangles, visible facets and pastel light.
- Study these reference works: Virtua Fighter (Sega, 1993) · Monument Valley (ustwo, 2014) · Alto’s Adventure (2015) · Firewatch key art (Olly Moss, 2016)
- Motion DNA: A smooth drone flyover that cranes up to reveal the range, then the world shatters into a triangle mosaic and an icon assembles facet by facet.
- Visual DNA: Flat-shaded triangles, warm key light against cool shadow sides, pastel sunset haze and a faceted sun.
- Signature transitions: Triangle mosaic wipe, facet-by-facet assembly, crane reveal, sun flare.
- Key techniques: Seeded fBm terrain on a jittered grid, Per-face Lambert shading + atmospheric fog, Painter’s depth sort of ~9k triangles

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Seeded fBm terrain on a jittered grid, Per-face Lambert shading + atmospheric fog, Painter’s depth sort of ~9k triangles).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Seeded fBm terrain on a jittered grid and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LOW POLY", held for about 1 s.

BUILD RULES
- Suggested tools: Blender (Decimate / flat shading), Cinema 4D, Three.js flatShading, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Low Poly motion-graphics film (Faceted Geometry). Visual style: flat-shaded triangles, warm key light against cool shadow sides, pastel sunset haze and a faceted sun. Motion: a smooth drone flyover that cranes up to reveal the range, then the world shatters into a triangle mosaic and an icon assembles facet by facet. Signature moves: seeded fbm terrain on a jittered grid, per-face lambert shading + atmospheric fog, painter’s depth sort of ~9k triangles; transitions: triangle mosaic wipe, facet-by-facet assembly, crane reveal, sun flare. In the tradition of Virtua Fighter (Sega, 1993) · Monument Valley (ustwo, 2014) · Alto’s Adventure (2015) · Firewatch key art (Olly Moss, 2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LOW POLY". Punchy sound design synced to every cut.
```

## 47 · Voxel Motion
*Volumetric Pixels · 2009 — · 3D & CGI Motion*

Reference film: `videos/voxel.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Voxel Motion** (Volumetric Pixels, 2009 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Voxels — volumetric pixels — came from medical imaging and 1990s voxel engines (Comanche, Outcast); Minecraft (2009) made the cube a mass aesthetic and MagicaVoxel (2013) gave motion designers a free, toy-like voxel studio with soft AO renders.
- Study these reference works: Comanche (NovaLogic, 1992) · Minecraft (Mojang, 2009) · MagicaVoxel (ephtracy, 2013) · Crossy Road (Hipster Whale, 2014) · Teardown (Tuxedo Labs, 2022)
- Motion DNA: Block-by-block construction layer after layer, a tiny character hop-walk, then a blast that freezes in bullet-time and rewinds into place.
- Visual DNA: Unit cubes with crisp edges, soft AO in creases, toy-like saturated palette, floating island diorama.
- Signature transitions: Layer build-up, block pop-in, explosion scatter, undo rewind.
- Key techniques: Orthographic camera orbit + painter’s sort, Face culling on an occupancy grid, Edge-based ambient occlusion per face

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Orthographic camera orbit + painter’s sort, Face culling on an occupancy grid, Edge-based ambient occlusion per face).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Orthographic camera orbit + painter’s sort and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VOXEL MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: MagicaVoxel, Blender (voxel remesh), Three.js InstancedMesh, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Voxel Motion motion-graphics film (Volumetric Pixels). Visual style: unit cubes with crisp edges, soft AO in creases, toy-like saturated palette, floating island diorama. Motion: block-by-block construction layer after layer, a tiny character hop-walk, then a blast that freezes in bullet-time and rewinds into place. Signature moves: orthographic camera orbit + painter’s sort, face culling on an occupancy grid, edge-based ambient occlusion per face; transitions: layer build-up, block pop-in, explosion scatter, undo rewind. In the tradition of Comanche (NovaLogic, 1992) · Minecraft (Mojang, 2009) · MagicaVoxel (ephtracy, 2013) · Crossy Road (Hipster Whale, 2014) · Teardown (Tuxedo Labs, 2022). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VOXEL MOTION". Punchy sound design synced to every cut.
```

## 48 · Glassmorphism 3D
*Frosted Depth · 2020 — · 3D & CGI Motion*

Reference film: `videos/glass3d.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Glassmorphism 3D** (Frosted Depth, 2020 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Frosted translucency runs from Windows Vista Aero (2007) and iOS 7 (2013) to macOS Big Sur (2020), when designer Michal Malewicz named “glassmorphism”; 3D renders of floating glass shapes over gradient blobs became its motion signature.
- Study these reference works: Windows Vista Aero Glass (2007) · iOS 7 Control Center (2013) · macOS Big Sur (2020) · Windows 11 Mica / Acrylic (2021) · Apple Liquid Glass (2025)
- Motion DNA: Weightless shapes drift in parallax on soft springs, converge in a swirl and part to reveal a UI card that assembles element by element.
- Visual DNA: Translucent frosted glass with bright rims over vivid blurred gradient blobs, deep soft shadows and gentle grain.
- Signature transitions: Parallax drift, spring pop, converge-and-reveal, light sweep.
- Key techniques: Background snapshot blurred by downsampling, Clipped refraction: magnified + offset copy, Specular rim, chromatic edge, offscreen soft shadows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Background snapshot blurred by downsampling, Clipped refraction: magnified + offset copy, Specular rim, chromatic edge, offscreen soft shadows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Background snapshot blurred by downsampling and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GLASSMORPHISM 3D", held for about 1 s.

BUILD RULES
- Suggested tools: Blender (Cycles glass + transmission), Spline, CSS backdrop-filter, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Glassmorphism 3D motion-graphics film (Frosted Depth). Visual style: translucent frosted glass with bright rims over vivid blurred gradient blobs, deep soft shadows and gentle grain. Motion: weightless shapes drift in parallax on soft springs, converge in a swirl and part to reveal a UI card that assembles element by element. Signature moves: background snapshot blurred by downsampling, clipped refraction: magnified + offset copy, specular rim, chromatic edge, offscreen soft shadows; transitions: parallax drift, spring pop, converge-and-reveal, light sweep. In the tradition of Windows Vista Aero Glass (2007) · iOS 7 Control Center (2013) · macOS Big Sur (2020) · Windows 11 Mica / Acrylic (2021) · Apple Liquid Glass (2025). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GLASSMORPHISM 3D". Punchy sound design synced to every cut.
```

## 49 · Soft Body Motion
*Jelly Physics · 2010s — · 3D & CGI Motion*

Reference film: `videos/softbody.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Soft Body Motion** (Jelly Physics, 2010s —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Grew out of cloth and soft-body solvers (Houdini Vellum, Cinema 4D Soft Body dynamics, Blender soft body) once they became fast enough for artists to loop; the squishy, glossy "oddly satisfying" jelly loop became a staple of Instagram and Behance motion reels in the late 2010s.
- Study these reference works: Andreas Wannerstedt — Oddly Satisfying loops (2017–) · SideFX Houdini Vellum launch demos (2018) · Tendril / ManvsMachine C4D soft-body reels · Cinema 4D R21 Soft Body showcases
- Motion DNA: Objects drop and hop on the beat, squash on contact, overshoot into stretch and wobble out on low-damped springs, so every landing reads as a satisfying rhythmic hit.
- Visual DNA: Glossy translucent candy colours, rounded bevels, soft studio key with coloured contact shadows on a seamless pastel set.
- Signature transitions: Drop-in, squash-and-stretch hits, sympathetic jiggle, letters landing as jelly.
- Key techniques: Analytic damped-spring squash, stretch and shear, Volume-preserving vertex deformation of rounded-box meshes, Wrap lighting + fresnel + transmitted colour shadows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Analytic damped-spring squash, stretch and shear, Volume-preserving vertex deformation of rounded-box meshes, Wrap lighting + fresnel + transmitted colour shadows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Analytic damped-spring squash, stretch and shear and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SOFT BODY MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Houdini Vellum, Cinema 4D Soft Body, Blender, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Soft Body Motion motion-graphics film (Jelly Physics). Visual style: glossy translucent candy colours, rounded bevels, soft studio key with coloured contact shadows on a seamless pastel set. Motion: objects drop and hop on the beat, squash on contact, overshoot into stretch and wobble out on low-damped springs, so every landing reads as a satisfying rhythmic hit. Signature moves: analytic damped-spring squash, stretch and shear, volume-preserving vertex deformation of rounded-box meshes, wrap lighting + fresnel + transmitted colour shadows; transitions: drop-in, squash-and-stretch hits, sympathetic jiggle, letters landing as jelly. In the tradition of Andreas Wannerstedt — Oddly Satisfying loops (2017–) · SideFX Houdini Vellum launch demos (2018) · Tendril / ManvsMachine C4D soft-body reels · Cinema 4D R21 Soft Body showcases. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SOFT BODY MOTION". Punchy sound design synced to every cut.
```

## 50 · Wireframe 3D
*Vector CRT · 1979 — · 3D & CGI Motion*

Reference film: `videos/wireframe.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Wireframe 3D** (Vector CRT, 1979 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Born on vector (XY) displays that drew glowing lines directly with the electron beam: Atari’s Battlezone (1980) and Tempest (1981) turned hidden-line wireframes into an aesthetic, which Tron (1982) and later technical CAD and Houdini/Blender wireframe renders carried forward.
- Study these reference works: Battlezone (Atari, 1980) · Tempest (Atari, 1981) · Tron (Disney, 1982) · Star Wars arcade (Atari, 1983) · Elite (Acornsoft, 1984) · Blade Runner 2049 UI wireframes (Territory Studio, 2017)
- Motion DNA: A low flight over a vector landscape, polyhedra drawing themselves edge by edge, a geodesic scanned by a moving plane, then every edge flies into a logo.
- Visual DNA: Pure glowing lines on black, green phosphor with white-hot cores and bright vertex dots, amber scan accents, CRT scanlines and bloom.
- Signature transitions: CRT power-on, edge-by-edge draw-on, scan sweep, edge morph into logo, glint sweep.
- Key techniques: Hidden-line terrain: rows filled black back-to-front, Face-visibility edge culling + depth-dimmed back edges, Phosphor bloom from downsampled blurred passes

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hidden-line terrain: rows filled black back-to-front, Face-visibility edge culling + depth-dimmed back edges, Phosphor bloom from downsampled blurred passes).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hidden-line terrain: rows filled black back-to-front and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "WIREFRAME 3D", held for about 1 s.

BUILD RULES
- Suggested tools: Vector display hardware, Blender Wireframe modifier, Houdini, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Wireframe 3D motion-graphics film (Vector CRT). Visual style: pure glowing lines on black, green phosphor with white-hot cores and bright vertex dots, amber scan accents, CRT scanlines and bloom. Motion: a low flight over a vector landscape, polyhedra drawing themselves edge by edge, a geodesic scanned by a moving plane, then every edge flies into a logo. Signature moves: hidden-line terrain: rows filled black back-to-front, face-visibility edge culling + depth-dimmed back edges, phosphor bloom from downsampled blurred passes; transitions: cRT power-on, edge-by-edge draw-on, scan sweep, edge morph into logo, glint sweep. In the tradition of Battlezone (Atari, 1980) · Tempest (Atari, 1981) · Tron (Disney, 1982) · Star Wars arcade (Atari, 1983) · Elite (Acornsoft, 1984) · Blade Runner 2049 UI wireframes (Territory Studio, 2017). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "WIREFRAME 3D". Punchy sound design synced to every cut.
```

## 51 · Exploded-view Animation
*Product Visualisation · 1500s / 1990s — · 3D & CGI Motion*

Reference film: `videos/exploded.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Exploded-view Animation** (Product Visualisation, 1500s / 1990s —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The exploded view comes from technical illustration (Leonardo’s machine studies, Agostino Ramelli, later engineering manuals); CAD and 3D product rendering in the 1990s–2000s turned it into motion, and Apple’s product films made the slow, precise disassembly a signature of premium launches.
- Study these reference works: Leonardo da Vinci, Codex Atlanticus (c. 1478–1519) · Apple “Designed by Apple in California” product films (2013) · Apple Watch launch film (2014) · Leica SL / Sony G Master lens cutaway animations · Teenage Engineering OP-1 exploded renders
- Motion DNA: A product holds, then its parts separate along the optical axis in a precise staggered cascade, labels draw on with leader lines, the assembly orbits, and everything snaps home with one satisfying click.
- Visual DNA: Seamless light studio, black anodised metal against chrome and copper, coated glass reflections, hairline leader lines and small engineering type.
- Signature transitions: Axial explode, leader-line draw-on, orbit, staggered re-assembly snap, light flash on the click.
- Key techniques: Surfaces of revolution from closed (r, z) profiles, Global painter’s sort of ~4k shaded quads, Studio environment-map shading: chrome, anodised, copper, coated glass

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Surfaces of revolution from closed (r, z) profiles, Global painter’s sort of ~4k shaded quads, Studio environment-map shading: chrome, anodised, copper, coated glass).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Surfaces of revolution from closed (r, z) profiles and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "EXPLODED-VIEW ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D / Redshift, KeyShot, SolidWorks Visualize, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Exploded-view Animation motion-graphics film (Product Visualisation). Visual style: seamless light studio, black anodised metal against chrome and copper, coated glass reflections, hairline leader lines and small engineering type. Motion: a product holds, then its parts separate along the optical axis in a precise staggered cascade, labels draw on with leader lines, the assembly orbits, and everything snaps home with one satisfying click. Signature moves: surfaces of revolution from closed (r, z) profiles, global painter’s sort of ~4k shaded quads, studio environment-map shading: chrome, anodised, copper, coated glass; transitions: axial explode, leader-line draw-on, orbit, staggered re-assembly snap, light flash on the click. In the tradition of Leonardo da Vinci, Codex Atlanticus (c. 1478–1519) · Apple “Designed by Apple in California” product films (2013) · Apple Watch launch film (2014) · Leica SL / Sony G Master lens cutaway animations · Teenage Engineering OP-1 exploded renders. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "EXPLODED-VIEW ANIMATION". Punchy sound design synced to every cut.
```

## 52 · Claymorphism
*Inflated Soft UI · 2021 — · 3D & CGI Motion*

Reference film: `videos/claymorphism.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Claymorphism** (Inflated Soft UI, 2021 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A UI and 3D-illustration trend that followed skeuomorphism (2000s), flat design (2013) and neumorphism (2020): puffy, matte, pastel objects that look inflated or moulded from soft clay, faked in CSS with an outer drop shadow plus two inset shadows. Michał Malewicz of Hype4 named and documented it in 2021, riding the wave of Blender-made 3D icon packs.
- Study these reference works: Michał Malewicz / Hype4 — "Claymorphism in user interfaces" (2021) · Blender 3D icon & illustration packs on Dribbble and Figma Community (2021—) · Microsoft Fluent 3D emoji (2021) · clay.css (Adrian Bece, 2022) · countless 3D onboarding illustrations in fintech and wellness apps
- Motion DNA: Everything is soft and springy: objects drop, squash on contact and overshoot on low-damped springs; buttons physically compress when pressed and icons drift and bob as if filled with air.
- Visual DNA: Puffy pastel shapes with rounded corners, a bright inner highlight top-left and a tinted inner shadow bottom-right, floating above a pale gradient on large soft coloured drop shadows.
- Signature transitions: Drop and bounce, blob-to-card inflate, spring pop-in, press squash, burst into pebbles
- Key techniques: Outer drop shadow + two inset shadows, Inflated rounded geometry, Pastel matte palette, Spring squash & stretch

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Outer drop shadow + two inset shadows, Inflated rounded geometry, Pastel matte palette, Spring squash & stretch).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Outer drop shadow + two inset shadows and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CLAYMORPHISM", held for about 1 s.

BUILD RULES
- Suggested tools: CSS box-shadow (outer + 2× inset), Figma / Spline, Blender, Canvas 2D (shadow compositing). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Claymorphism motion-graphics film (Inflated Soft UI). Visual style: puffy pastel shapes with rounded corners, a bright inner highlight top-left and a tinted inner shadow bottom-right, floating above a pale gradient on large soft coloured drop shadows. Motion: everything is soft and springy: objects drop, squash on contact and overshoot on low-damped springs; buttons physically compress when pressed and icons drift and bob as if filled with air. Signature moves: outer drop shadow + two inset shadows, inflated rounded geometry, pastel matte palette, spring squash & stretch; transitions: drop and bounce, blob-to-card inflate, spring pop-in, press squash, burst into pebbles. In the tradition of Michał Malewicz / Hype4 — "Claymorphism in user interfaces" (2021) · Blender 3D icon & illustration packs on Dribbble and Figma Community (2021—) · Microsoft Fluent 3D emoji (2021) · clay.css (Adrian Bece, 2022) · countless 3D onboarding illustrations in fintech and wellness apps. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CLAYMORPHISM". Punchy sound design synced to every cut.
```

## 53 · Cel-shaded 3D
*Toon Shading · 2000 — · 3D & CGI Motion*

Reference film: `videos/celshaded.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cel-shaded 3D** (Toon Shading, 2000 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Non-photorealistic rendering that makes 3D models look like inked animation cels: diffuse light is quantised into two or three hard bands through a ramp lookup, and black outlines come from the inverted-hull trick (the back faces of a slightly inflated copy) or from edge detection. Sega's Jet Set Radio (Smilebit, 2000) brought it to games, Nintendo's The Legend of Zelda: The Wind Waker (2002) made it a classic, and it runs through Borderlands (2009), Guilty Gear Xrd (2014) and the NPR films Spider-Man: Into the Spider-Verse (2018) and Arcane (2021).
- Study these reference works: Jet Set Radio (Smilebit / Sega, 2000) · The Legend of Zelda: The Wind Waker (Nintendo, 2002) · Ōkami (Clover Studio, 2006) · Borderlands (Gearbox, 2009) · Guilty Gear Xrd (Arc System Works, 2014) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018) · Arcane (Fortiche, 2021)
- Motion DNA: Real 3D camera moves — orbits, a wide reveal, a hard anime cut to a low skimming run — but everything reads as drawn: shading jumps between bands instead of gliding, and speed lines, spray dots and swirl clouds are graphic shapes.
- Visual DNA: Saturated flat colour in two or three hard tones per surface, cool violet shadows and warm highlights, constant-width ink silhouettes, a banded sea with white foam strokes, and puffy outlined clouds with a curl.
- Signature transitions: Lambert-to-toon wipe, orbit, hard cut, speed-line burst, spring-pop title
- Key techniques: Banded Lambert ramp (3 tones), Inverted-hull outlines, Flat anime palette with tinted shadows, Painter-sorted mesh projection

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Banded Lambert ramp (3 tones), Inverted-hull outlines, Flat anime palette with tinted shadows, Painter-sorted mesh projection).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Banded Lambert ramp (3 tones) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CEL-SHADED 3D", held for about 1 s.

BUILD RULES
- Suggested tools: Toon ramp shaders (Unity / Unreal / Blender), Blender Line Art / Freestyle, Pencil+ (3ds Max / Maya), Canvas 2D (CPU projection, band-split faces, painter's sort). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cel-shaded 3D motion-graphics film (Toon Shading). Visual style: saturated flat colour in two or three hard tones per surface, cool violet shadows and warm highlights, constant-width ink silhouettes, a banded sea with white foam strokes, and puffy outlined clouds with a curl. Motion: real 3D camera moves — orbits, a wide reveal, a hard anime cut to a low skimming run — but everything reads as drawn: shading jumps between bands instead of gliding, and speed lines, spray dots and swirl clouds are graphic shapes. Signature moves: banded lambert ramp (3 tones), inverted-hull outlines, flat anime palette with tinted shadows, painter-sorted mesh projection; transitions: lambert-to-toon wipe, orbit, hard cut, speed-line burst, spring-pop title. In the tradition of Jet Set Radio (Smilebit / Sega, 2000) · The Legend of Zelda: The Wind Waker (Nintendo, 2002) · Ōkami (Clover Studio, 2006) · Borderlands (Gearbox, 2009) · Guilty Gear Xrd (Arc System Works, 2014) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018) · Arcane (Fortiche, 2021). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CEL-SHADED 3D". Punchy sound design synced to every cut.
```

## 54 · Product Visualization
*Hero Renders on a Seamless Sweep · 2000s — · 3D & CGI Motion*

Reference film: `videos/productviz.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Product Visualization** (Hero Renders on a Seamless Sweep, 2000s —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The CG product film: a manufacturer’s CAD model is lit like a studio photograph — softboxes, strip lights and a seamless sweep — and turned slowly in front of the camera, so every edge reads as a line of light. It grew out of industrial-design rendering (Alias, later KeyShot and Octane) and was set as a genre by Apple’s product films from the 2000s on, then by the launch reels every phone, watch, headphone and sneaker brand now commissions.
- Study these reference works: Mac Pro reveal film (Apple, WWDC 2013) · Introducing Apple Watch (Apple, 2014) · Introducing iPhone X (Apple, 2017) · KeyShot renderer (Luxion, 2010)
- Motion DNA: Slow, weightless turntable rotation with long eases, light sweeping across edges rather than the object moving fast; a precise exploded-view separation that decelerates into place, holds for callouts, and snaps back together with a tiny settle.
- Visual DNA: A single hero object floating over a black-to-charcoal seamless sweep with a soft mirror floor; rim strips draw the silhouette in thin lines of light, big softboxes slide across glass as clean gradients, anodised colour, minimal thin sans type and hairline callouts.
- Signature transitions: Light-sweep reveal, turntable orbit, explode and collapse, screen wake, push to hero 3/4
- Key techniques: Area-light reflections on metal, Planar softbox mirrors in glass, Turntable orbit + exploded layers

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Area-light reflections on metal, Planar softbox mirrors in glass, Turntable orbit + exploded layers).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Area-light reflections on metal and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PRODUCT VISUALIZATION", held for about 1 s.

BUILD RULES
- Suggested tools: KeyShot / Octane / Redshift turntables, Cinema 4D or Blender with HDRI softbox rigs, CAD data (STEP) retopologised for render, Canvas 2D: CPU projection, area-light hit tests per band quad, mirrored softbox quads on caps, mirrored-camera floor pass. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Product Visualization motion-graphics film (Hero Renders on a Seamless Sweep). Visual style: a single hero object floating over a black-to-charcoal seamless sweep with a soft mirror floor; rim strips draw the silhouette in thin lines of light, big softboxes slide across glass as clean gradients, anodised colour, minimal thin sans type and hairline callouts. Motion: slow, weightless turntable rotation with long eases, light sweeping across edges rather than the object moving fast; a precise exploded-view separation that decelerates into place, holds for callouts, and snaps back together with a tiny settle. Signature moves: area-light reflections on metal, planar softbox mirrors in glass, turntable orbit + exploded layers; transitions: light-sweep reveal, turntable orbit, explode and collapse, screen wake, push to hero 3/4. In the tradition of Mac Pro reveal film (Apple, WWDC 2013) · Introducing Apple Watch (Apple, 2014) · Introducing iPhone X (Apple, 2017) · KeyShot renderer (Luxion, 2010). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PRODUCT VISUALIZATION". Punchy sound design synced to every cut.
```

## 55 · Architectural Motion
*Plan, Massing and Flythrough · 1990s — · 3D & CGI Motion*

Reference film: `videos/architectural.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Architectural Motion** (Plan, Massing and Flythrough, 1990s —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Archviz animation turns an unbuilt design into a camera journey: drawings become volumes, volumes take on materials and daylight, and a dolly or drone path walks the client through spaces that do not exist yet. It grew from 1990s 3ds Max and V-Ray walkthroughs for competitions and real-estate marketing; Alex Roman’s The Third & The Seventh (2009) showed it could be cinema, and real-time engines (Lumion, Twinmotion, Unreal) later made sun studies and flythroughs part of everyday design review.
- Study these reference works: The Third & The Seventh (Alex Roman, 2009) · Lumion (Act-3D, 2010) · Twinmotion (Abvent, later Epic Games) · Unreal Engine archviz walkthroughs
- Motion DNA: Slow, steady, physically plausible camera: a top-down plan that tilts into perspective, a measured orbit while the sun arcs overhead, then a gimbal-smooth drop to eye level and a lateral dolly — no shake, no snap, every move eased like a crane or drone.
- Visual DNA: Blueprint blue with white hairlines, dash-dot grids and poché walls; a white clay massing model with soft contact shadows; then honest materials — travertine, board-formed concrete, timber and glass — under a sky that moves from crisp noon to warm dusk with glowing interiors mirrored in a pool.
- Signature transitions: Line draw-on, plan-to-perspective tilt, extrusion, wireframe-to-solid crossfade, material wipe, sun sweep, eye-level dolly
- Key techniques: Blueprint plan extruded to massing, Exact cast shadows on box faces, Sun study sweep + dusk glow

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Blueprint plan extruded to massing, Exact cast shadows on box faces, Sun study sweep + dusk glow).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Blueprint plan extruded to massing and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ARCHITECTURAL MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: 3ds Max + V-Ray / Corona, Lumion, Twinmotion, Unreal Engine, Revit / Rhino / SketchUp source models, Canvas 2D: AABB painter sort, cast-shadow hulls per face plane, mirrored-camera pool reflection. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Architectural Motion motion-graphics film (Plan, Massing and Flythrough). Visual style: blueprint blue with white hairlines, dash-dot grids and poché walls; a white clay massing model with soft contact shadows; then honest materials — travertine, board-formed concrete, timber and glass — under a sky that moves from crisp noon to warm dusk with glowing interiors mirrored in a pool. Motion: slow, steady, physically plausible camera: a top-down plan that tilts into perspective, a measured orbit while the sun arcs overhead, then a gimbal-smooth drop to eye level and a lateral dolly — no shake, no snap, every move eased like a crane or drone. Signature moves: blueprint plan extruded to massing, exact cast shadows on box faces, sun study sweep + dusk glow; transitions: line draw-on, plan-to-perspective tilt, extrusion, wireframe-to-solid crossfade, material wipe, sun sweep, eye-level dolly. In the tradition of The Third & The Seventh (Alex Roman, 2009) · Lumion (Act-3D, 2010) · Twinmotion (Abvent, later Epic Games) · Unreal Engine archviz walkthroughs. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ARCHITECTURAL MOTION". Punchy sound design synced to every cut.
```

## 56 · 3D Character Animation
*Squash, Stretch and Performance · 1986 — · 3D & CGI Motion*

Reference film: `videos/character3d.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **3D Character Animation** (Squash, Stretch and Performance, 1986 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Keyframed CG characters that act: the hand-drawn principles of the Disney animators — squash and stretch, anticipation, arcs, follow-through, appeal — applied to 3D models, which John Lasseter set out in his 1987 SIGGRAPH paper after Pixar’s Luxo Jr. (1986) proved two desk lamps could carry a story. Pixar’s Toy Story (1995) made it a feature-film medium, and the soft-lit, rounded, expressive house style it set is now the default language of studio animation, game cinematics and mascot spots.
- Study these reference works: Luxo Jr. (John Lasseter, Pixar, 1986) · Toy Story (John Lasseter, Pixar, 1995) · Geri’s Game (Jan Pinkava, Pixar, 1997) · For the Birds (Ralph Eggleston, Pixar, 2000) · WALL·E (Andrew Stanton, Pixar, 2008) · The Illusion of Life (Frank Thomas & Ollie Johnston, 1981)
- Motion DNA: Acting in poses and timing: every action is announced by an anticipation in the opposite direction, travels on a clean parabolic arc with stretch along the velocity, lands in a squash that springs back through overshoot, while appendages lag and whip through after the body stops; eyes and brows lead the thought a few frames before the body moves.
- Visual DNA: A simple, rounded, saturated character with huge eyes and readable brows on a warm seamless cyc; soft key light with wrapped, subsurface-warm terminators, a cool fill, a bright rim, gentle contact shadows and ambient occlusion, glossy catchlights in the eyes.
- Signature transitions: Held shot with a slow push-in; staging and acting carry the cut points; breakdown captions name each principle
- Key techniques: Volume-kept squash and stretch, Lagged antenna follow-through, Ray-traced soft shadows + AO

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Volume-kept squash and stretch, Lagged antenna follow-through, Ray-traced soft shadows + AO).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Volume-kept squash and stretch and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "3D CHARACTER ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Maya / Presto rigs, keyframed in the graph editor, RenderMan / Arnold / Cycles with area lights + AO, Blender Grease-Pencil blocking, then splined, Canvas 2D: per-pixel ray tracer over ellipsoids (960×540, upscaled), analytic soft shadows and AO. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second 3D Character Animation motion-graphics film (Squash, Stretch and Performance). Visual style: a simple, rounded, saturated character with huge eyes and readable brows on a warm seamless cyc; soft key light with wrapped, subsurface-warm terminators, a cool fill, a bright rim, gentle contact shadows and ambient occlusion, glossy catchlights in the eyes. Motion: acting in poses and timing: every action is announced by an anticipation in the opposite direction, travels on a clean parabolic arc with stretch along the velocity, lands in a squash that springs back through overshoot, while appendages lag and whip through after the body stops; eyes and brows lead the thought a few frames before the body moves. Signature moves: volume-kept squash and stretch, lagged antenna follow-through, ray-traced soft shadows + ao; transitions: held shot with a slow push-in; staging and acting carry the cut points; breakdown captions name each principle. In the tradition of Luxo Jr. (John Lasseter, Pixar, 1986) · Toy Story (John Lasseter, Pixar, 1995) · Geri’s Game (Jan Pinkava, Pixar, 1997) · For the Birds (Ralph Eggleston, Pixar, 2000) · WALL·E (Andrew Stanton, Pixar, 2008) · The Illusion of Life (Frank Thomas & Ollie Johnston, 1981). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "3D CHARACTER ANIMATION". Punchy sound design synced to every cut.
```

## 57 · Generative Particles
*Flow Fields · 2001 — · Experimental & Generative*

Reference film: `videos/particles.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Generative Particles** (Flow Fields, 2001 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Creative coding tools such as Processing turned noise fields and particle systems into living, data-driven sculpture.
- Study these reference works: Processing (2001) · Refik Anadol, data sculptures
- Motion DNA: Thousands of particles advected through a noise field; attraction pulls them into form, release scatters them.
- Visual DNA: Dark ground, luminous additive strands, cool palette.
- Signature transitions: Converge into type, shockwave release
- Key techniques: Noise flow field, Additive trails, Form & dissolve

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Noise flow field, Additive trails, Form & dissolve).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Noise flow field and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GENERATIVE PARTICLES", held for about 1 s.

BUILD RULES
- Suggested tools: Processing, TouchDesigner, WebGL, Houdini. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Generative Particles motion-graphics film (Flow Fields). Visual style: dark ground, luminous additive strands, cool palette. Motion: thousands of particles advected through a noise field; attraction pulls them into form, release scatters them. Signature moves: noise flow field, additive trails, form & dissolve; transitions: converge into type, shockwave release. In the tradition of Processing (2001) · Refik Anadol, data sculptures. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GENERATIVE PARTICLES". Punchy sound design synced to every cut.
```

## 58 · Reaction–Diffusion
*Gray-Scott Patterns · 1952 — · Experimental & Generative*

Reference film: `videos/reactiondiffusion.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Reaction–Diffusion** (Gray-Scott Patterns, 1952 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Alan Turing's 1952 paper "The Chemical Basis of Morphogenesis" proposed that two diffusing, reacting chemicals could self-organise into spots and stripes; the Gray-Scott model (1983–84) and John Pearson's 1993 "Complex Patterns in a Simple System" map made it a staple of generative art.
- Study these reference works: A. M. Turing, The Chemical Basis of Morphogenesis (1952) · J. E. Pearson, Complex Patterns in a Simple System (Science, 1993) · Karl Sims, Reaction-Diffusion Tutorial & exhibits · Nervous System, Reaction lamps and jewellery · Greg Turk, Generating Textures on Arbitrary Surfaces Using Reaction-Diffusion (SIGGRAPH 1991)
- Motion DNA: Nothing is animated directly: two chemicals react and diffuse each step, so fronts grow, branch, split and settle as the feed and kill rates drift through regimes.
- Visual DNA: Organic coral, mitosis spots and labyrinths with crisp iso-contours, rendered as an embossed, specular height field in coral, teal and ivory on near-black.
- Signature transitions: Regime fronts sweeping across the field, pattern dissolve into a mask, mitosis splits, labyrinth infill
- Key techniques: Gray-Scott PDE on a grid, Feed/kill parameter fields, Height-field lighting

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Gray-Scott PDE on a grid, Feed/kill parameter fields, Height-field lighting).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Gray-Scott PDE on a grid and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "REACTION–DIFFUSION", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, WebGL, TouchDesigner, Houdini. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Reaction–Diffusion motion-graphics film (Gray-Scott Patterns). Visual style: organic coral, mitosis spots and labyrinths with crisp iso-contours, rendered as an embossed, specular height field in coral, teal and ivory on near-black. Motion: nothing is animated directly: two chemicals react and diffuse each step, so fronts grow, branch, split and settle as the feed and kill rates drift through regimes. Signature moves: gray-scott pde on a grid, feed/kill parameter fields, height-field lighting; transitions: regime fronts sweeping across the field, pattern dissolve into a mask, mitosis splits, labyrinth infill. In the tradition of A. M. Turing, The Chemical Basis of Morphogenesis (1952) · J. E. Pearson, Complex Patterns in a Simple System (Science, 1993) · Karl Sims, Reaction-Diffusion Tutorial & exhibits · Nervous System, Reaction lamps and jewellery · Greg Turk, Generating Textures on Arbitrary Surfaces Using Reaction-Diffusion (SIGGRAPH 1991). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "REACTION–DIFFUSION". Punchy sound design synced to every cut.
```

## 59 · Strange Attractors
*Lorenz · Clifford · De Jong · 1963 — · Experimental & Generative*

Reference film: `videos/attractor.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Strange Attractors** (Lorenz · Clifford · De Jong, 1963 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Edward Lorenz's 1963 paper "Deterministic Nonperiodic Flow" found the butterfly-shaped attractor in a three-equation weather model; Peter de Jong's and Clifford Pickover's 2D maps, popularised by Paul Bourke and A. K. Dewdney, turned iterated chaos into density images.
- Study these reference works: E. N. Lorenz, Deterministic Nonperiodic Flow (1963) · Clifford A. Pickover, Chaos in Wonderland (1994) · A. K. Dewdney, Computer Recreations, Scientific American (1987) · Paul Bourke, Strange Attractors gallery · Jos Leys, Étienne Ghys & Aurélien Alvarez, Chaos: A Mathematical Adventure (2013)
- Motion DNA: A single orbit never repeats: one bright point traces the flow, the camera orbits as millions of samples accumulate, and the parameters drift so the whole cloud morphs between attractors.
- Visual DNA: Filaments of light on black built from log-tone-mapped point density, chromatic wings in magenta and cyan, fine mono equations and live parameter readouts.
- Signature transitions: Lone-trail reveal, 3D-to-2D particle morph, parameter sweep, attractor crossfade, hero settle
- Key techniques: RK4 ODE integration, Million-point density buffers, Index-matched attractor morphs

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (RK4 ODE integration, Million-point density buffers, Index-matched attractor morphs).
- 5.0–8.0 s  Climax: the most spectacular moment, built on RK4 ODE integration and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "STRANGE ATTRACTORS", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, WebGL, TouchDesigner, Houdini. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Strange Attractors motion-graphics film (Lorenz · Clifford · De Jong). Visual style: filaments of light on black built from log-tone-mapped point density, chromatic wings in magenta and cyan, fine mono equations and live parameter readouts. Motion: a single orbit never repeats: one bright point traces the flow, the camera orbits as millions of samples accumulate, and the parameters drift so the whole cloud morphs between attractors. Signature moves: rk4 ode integration, million-point density buffers, index-matched attractor morphs; transitions: lone-trail reveal, 3D-to-2D particle morph, parameter sweep, attractor crossfade, hero settle. In the tradition of E. N. Lorenz, Deterministic Nonperiodic Flow (1963) · Clifford A. Pickover, Chaos in Wonderland (1994) · A. K. Dewdney, Computer Recreations, Scientific American (1987) · Paul Bourke, Strange Attractors gallery · Jos Leys, Étienne Ghys & Aurélien Alvarez, Chaos: A Mathematical Adventure (2013). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "STRANGE ATTRACTORS". Punchy sound design synced to every cut.
```

## 60 · Cellular Automata
*Conway's Game of Life · 1970 — · Experimental & Generative*

Reference film: `videos/lifegame.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cellular Automata** (Conway's Game of Life, 1970 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: John Horton Conway devised the Game of Life in 1970 and Martin Gardner published it in his October 1970 "Mathematical Games" column in Scientific American; one rule, B3/S23 on a square grid, produces gliders, guns and self-sustaining machines.
- Study these reference works: Martin Gardner, Mathematical Games: The fantastic combinations of John Conway's new solitaire game "life" (Scientific American, Oct 1970) · Bill Gosper, Gosper glider gun (1970) · Golly (open-source Life simulator) · Stephen Wolfram, A New Kind of Science (2002) · Paul Rendell, Turing machine in Life (2000)
- Motion DNA: Time is quantised into generations: each tick every cell is born, survives or dies by counting neighbours, and cells ease in and out between ticks while the camera pulls back to show the machines at scale.
- Visual DNA: A dark lab grid of square cells glowing like phosphor, hot amber newborns cooling to mint, with mono annotations naming each pattern.
- Signature transitions: Generation tick, exponential zoom-out, chaos burst, settling sweep, block-letter crystallisation
- Key techniques: B3/S23 rule on a bit grid, Soft birth/death interpolation, Exponential zoom-out

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (B3/S23 rule on a bit grid, Soft birth/death interpolation, Exponential zoom-out).
- 5.0–8.0 s  Climax: the most spectacular moment, built on B3/S23 rule on a bit grid and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CELLULAR AUTOMATA", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, WebGL, Golly, TouchDesigner. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cellular Automata motion-graphics film (Conway's Game of Life). Visual style: a dark lab grid of square cells glowing like phosphor, hot amber newborns cooling to mint, with mono annotations naming each pattern. Motion: time is quantised into generations: each tick every cell is born, survives or dies by counting neighbours, and cells ease in and out between ticks while the camera pulls back to show the machines at scale. Signature moves: b3/s23 rule on a bit grid, soft birth/death interpolation, exponential zoom-out; transitions: generation tick, exponential zoom-out, chaos burst, settling sweep, block-letter crystallisation. In the tradition of Martin Gardner, Mathematical Games: The fantastic combinations of John Conway's new solitaire game "life" (Scientific American, Oct 1970) · Bill Gosper, Gosper glider gun (1970) · Golly (open-source Life simulator) · Stephen Wolfram, A New Kind of Science (2002) · Paul Rendell, Turing machine in Life (2000). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CELLULAR AUTOMATA". Punchy sound design synced to every cut.
```

## 61 · Fractal Motion
*Infinite Zoom · 1980 — · Experimental & Generative*

Reference film: `videos/fractal.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Fractal Motion** (Infinite Zoom, 1980 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Benoit Mandelbrot imaged the set z ↦ z² + c at IBM in 1980 and made fractals a visual language with "The Fractal Geometry of Nature" (1982); smooth colouring and ever-deeper zooms turned its self-similar boundary into a genre of motion.
- Study these reference works: Benoit Mandelbrot, The Fractal Geometry of Nature (1982) · Peitgen & Richter, The Beauty of Fractals (1986) · Loren Carpenter, Vol Libre (1980) · Arthur C. Clarke, Fractals: The Colors of Infinity (1995) · Ultra Fractal (Frederik Slijkerman, 1999 —)
- Motion DNA: An exponential dolly: the camera divides its width by a constant factor every frame toward a fixed boundary point, so detail streams out of the centre forever while the palette flows through the bands.
- Visual DNA: Self-similar spirals and seahorse filaments in blue, white and molten gold, embossed by a raking light, with crisp black interior lakes.
- Signature transitions: Iteration-count reveal, infinite zoom, Mandelbrot-to-Julia parameter morph, exponential pull-back
- Key techniques: Escape-time iteration in float64, Smooth iteration count + palette cycling, Distance-estimate relief lighting

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Escape-time iteration in float64, Smooth iteration count + palette cycling, Distance-estimate relief lighting).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Escape-time iteration in float64 and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FRACTAL MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: GLSL, Canvas 2D, Ultra Fractal, TouchDesigner. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Fractal Motion motion-graphics film (Infinite Zoom). Visual style: self-similar spirals and seahorse filaments in blue, white and molten gold, embossed by a raking light, with crisp black interior lakes. Motion: an exponential dolly: the camera divides its width by a constant factor every frame toward a fixed boundary point, so detail streams out of the centre forever while the palette flows through the bands. Signature moves: escape-time iteration in float64, smooth iteration count + palette cycling, distance-estimate relief lighting; transitions: iteration-count reveal, infinite zoom, Mandelbrot-to-Julia parameter morph, exponential pull-back. In the tradition of Benoit Mandelbrot, The Fractal Geometry of Nature (1982) · Peitgen & Richter, The Beauty of Fractals (1986) · Loren Carpenter, Vol Libre (1980) · Arthur C. Clarke, Fractals: The Colors of Infinity (1995) · Ultra Fractal (Frederik Slijkerman, 1999 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FRACTAL MOTION". Punchy sound design synced to every cut.
```

## 62 · L-systems
*Algorithmic Botany · 1968 — · Experimental & Generative*

Reference film: `videos/lsystem.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **L-systems** (Algorithmic Botany, 1968 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The biologist Aristid Lindenmayer introduced parallel string-rewriting systems in 1968 to model the growth of algae; read by a turtle that draws, turns and branches, they became the grammar of computer-generated plants in Prusinkiewicz and Lindenmayer's "The Algorithmic Beauty of Plants" (1990).
- Study these reference works: A. Lindenmayer, Mathematical Models for Cellular Interaction in Development (J. Theor. Biology, 1968) · P. Prusinkiewicz & A. Lindenmayer, The Algorithmic Beauty of Plants (1990) · Alvy Ray Smith, Plants, Fractals and Formal Languages (SIGGRAPH 1984) · SpeedTree (IDV) · Houdini L-system SOP
- Motion DNA: Growth happens in generations: every bud rewrites at once, so new branches sprout simultaneously across the whole plant while older limbs thicken, sway and burst into leaf and blossom.
- Visual DNA: A botanical plate on warm laid paper: sepia ink branches with pipe-model taper, watercolour leaves and blossoms, a gilt dragon curve, and red-rubric figure captions with the rewriting rules set in mono.
- Signature transitions: Generation steps, camera pans across the plate, blossom pops, paper-fold unfolding, pull-back to a full garden
- Key techniques: Parallel string rewriting (OL-systems), Turtle interpretation with a branch stack, Generation-tagged growth + wind sway

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Parallel string rewriting (OL-systems), Turtle interpretation with a branch stack, Generation-tagged growth + wind sway).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Parallel string rewriting (OL-systems) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "L-SYSTEMS", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, Houdini, Processing, SpeedTree. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second L-systems motion-graphics film (Algorithmic Botany). Visual style: a botanical plate on warm laid paper: sepia ink branches with pipe-model taper, watercolour leaves and blossoms, a gilt dragon curve, and red-rubric figure captions with the rewriting rules set in mono. Motion: growth happens in generations: every bud rewrites at once, so new branches sprout simultaneously across the whole plant while older limbs thicken, sway and burst into leaf and blossom. Signature moves: parallel string rewriting (ol-systems), turtle interpretation with a branch stack, generation-tagged growth + wind sway; transitions: generation steps, camera pans across the plate, blossom pops, paper-fold unfolding, pull-back to a full garden. In the tradition of A. Lindenmayer, Mathematical Models for Cellular Interaction in Development (J. Theor. Biology, 1968) · P. Prusinkiewicz & A. Lindenmayer, The Algorithmic Beauty of Plants (1990) · Alvy Ray Smith, Plants, Fractals and Formal Languages (SIGGRAPH 1984) · SpeedTree (IDV) · Houdini L-system SOP. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "L-SYSTEMS". Punchy sound design synced to every cut.
```

## 63 · Boids
*Flocking Simulation · 1987 — · Experimental & Generative*

Reference film: `videos/boids.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Boids** (Flocking Simulation, 1987 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Craig Reynolds' SIGGRAPH 1987 paper "Flocks, Herds, and Schools: A Distributed Behavioral Model" showed that lifelike flocks emerge when every agent steers by three local rules (separation, alignment and cohesion), with no leader and no choreography.
- Study these reference works: Craig Reynolds, Stanley and Stella in "Breaking the Ice" (1987) · Batman Returns, bat swarms and penguin army (1992) · The Lion King, wildebeest stampede (1994) · Robert Hodgin, Flocking studies (2007 —) · Cabbibo / three.js GPGPU birds
- Motion DNA: No bird is animated: thousands of agents each steer from their neighbours at a fixed time step, so density waves ripple, the mass tears open around a predator, mills into a vortex and condenses into form.
- Visual DNA: Ink-black starling silhouettes with flickering wings against a dusk gradient of indigo, rose and amber over still water and reeds, with faint motion trails.
- Signature transitions: Pull-back from a single agent, flash expansion around a predator, vortex mill, condensation into a word, release
- Key techniques: Separation · alignment · cohesion steering, Spatial-hash neighbour search, Fixed-step deterministic cache

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Separation · alignment · cohesion steering, Spatial-hash neighbour search, Fixed-step deterministic cache).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Separation · alignment · cohesion steering and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "BOIDS", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, Houdini, Processing, Unity DOTS. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Boids motion-graphics film (Flocking Simulation). Visual style: ink-black starling silhouettes with flickering wings against a dusk gradient of indigo, rose and amber over still water and reeds, with faint motion trails. Motion: no bird is animated: thousands of agents each steer from their neighbours at a fixed time step, so density waves ripple, the mass tears open around a predator, mills into a vortex and condenses into form. Signature moves: separation · alignment · cohesion steering, spatial-hash neighbour search, fixed-step deterministic cache; transitions: pull-back from a single agent, flash expansion around a predator, vortex mill, condensation into a word, release. In the tradition of Craig Reynolds, Stanley and Stella in "Breaking the Ice" (1987) · Batman Returns, bat swarms and penguin army (1992) · The Lion King, wildebeest stampede (1994) · Robert Hodgin, Flocking studies (2007 —) · Cabbibo / three.js GPGPU birds. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "BOIDS". Punchy sound design synced to every cut.
```

## 64 · Audio Reactive
*Music Drives the Picture · 1998 — · Experimental & Generative*

Reference film: `videos/audioreactive.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Audio Reactive** (Music Drives the Picture, 1998 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Real-time visuals computed from sound: Winamp’s visualiser plug-ins (AVS 1999, Ryan Geiss’s MilkDrop 2001) put FFT-driven feedback art on every PC, VJ culture took it to club screens, and Ryoji Ikeda turned raw signal and data into monumental minimalist audiovisual works.
- Study these reference works: Ryan Geiss — MilkDrop (2001) · Nullsoft Winamp AVS (1999) · Ryoji Ikeda — test pattern (2008) & datamatics (2006) · Robert Hodgin — Magnetosphere / iTunes visualiser (2008) · Carsten Nicolai (alva noto) — unitxt (2008)
- Motion DNA: Nothing moves on its own: every pulse, zoom, flash and burst is an envelope of a kick, snare, hat or note, so motion lands exactly on the beat.
- Visual DNA: Ikeda monochrome — hairlines, barcodes and data readouts on black — exploding at the drop into MilkDrop’s saturated plasma, mirrored spectra and feedback tunnels.
- Signature transitions: Barcode strobe, inversion flash, build zoom, blackout breath, drop explosion, collapse to data
- Key techniques: Event list shared by score & picture, FFT-style radial spectrum & peak caps, Feedback tunnel, kick zoom, snare bursts

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Event list shared by score & picture, FFT-style radial spectrum & peak caps, Feedback tunnel, kick zoom, snare bursts).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Event list shared by score & picture and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "AUDIO REACTIVE", held for about 1 s.

BUILD RULES
- Suggested tools: Web Audio + Canvas 2D, TouchDesigner, GLSL (MilkDrop presets). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Audio Reactive motion-graphics film (Music Drives the Picture). Visual style: ikeda monochrome — hairlines, barcodes and data readouts on black — exploding at the drop into MilkDrop’s saturated plasma, mirrored spectra and feedback tunnels. Motion: nothing moves on its own: every pulse, zoom, flash and burst is an envelope of a kick, snare, hat or note, so motion lands exactly on the beat. Signature moves: event list shared by score & picture, fft-style radial spectrum & peak caps, feedback tunnel, kick zoom, snare bursts; transitions: barcode strobe, inversion flash, build zoom, blackout breath, drop explosion, collapse to data. In the tradition of Ryan Geiss — MilkDrop (2001) · Nullsoft Winamp AVS (1999) · Ryoji Ikeda — test pattern (2008) & datamatics (2006) · Robert Hodgin — Magnetosphere / iTunes visualiser (2008) · Carsten Nicolai (alva noto) — unitxt (2008). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "AUDIO REACTIVE". Punchy sound design synced to every cut.
```

## 65 · Slit-scan
*Time Smeared into Space · 1968 — · Experimental & Generative*

Reference film: `videos/slitscan.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Slit-scan** (Time Smeared into Space, 1968 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A camera photographs artwork through a narrow moving slit during one long exposure per frame, so each part of the image records a different moment. John Whitney explored it in the early 1960s; Douglas Trumbull built a slit-scan machine for the Stargate sequence of Kubrick's 2001: A Space Odyssey (1968). Bernard Lodge used it for Doctor Who's 1973 time tunnel, and digital "time-slice" video revived it by giving every row or column of pixels its own timestamp.
- Study these reference works: 2001: A Space Odyssey — Stargate sequence (Douglas Trumbull, 1968) · Doctor Who title sequence (Bernard Lodge, 1973) · Star Trek: The Next Generation warp effect (1987) · Golan Levin, An Informal Catalogue of Slit-Scan Video Artworks (2005—) · Adam Magyar, Urban Flow (slit-scan photography, 2000s)
- Motion DNA: Relentless forward rush: streaks of light pour out of a dark horizon toward the camera on two planes, colour shifts in sudden waves, the planes rotate and fold into a spinning tunnel; then time itself is sliced column by column.
- Visual DNA: Saturated backlit colour streaks on black, compressed to a thin dark horizon and smeared toward the frame edges, with chromatic washes swapping from amber and magenta to cyan, violet, red and green.
- Signature transitions: Slit opening, plane rotation, corridor-to-tunnel fold, white-out flash, slit wipe (time-slice exposure)
- Key techniques: Moving slit + long exposure, Per-pixel depth mapping (z = f / d), Corridor-to-tunnel morph, Column time-slice

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Moving slit + long exposure, Per-pixel depth mapping (z = f / d), Corridor-to-tunnel morph, Column time-slice).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Moving slit + long exposure and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SLIT-SCAN", held for about 1 s.

BUILD RULES
- Suggested tools: Slit-scan rig on animation stand, After Effects Time Displacement, TouchDesigner, Canvas 2D (per-pixel ImageData). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Slit-scan motion-graphics film (Time Smeared into Space). Visual style: saturated backlit colour streaks on black, compressed to a thin dark horizon and smeared toward the frame edges, with chromatic washes swapping from amber and magenta to cyan, violet, red and green. Motion: relentless forward rush: streaks of light pour out of a dark horizon toward the camera on two planes, colour shifts in sudden waves, the planes rotate and fold into a spinning tunnel; then time itself is sliced column by column. Signature moves: moving slit + long exposure, per-pixel depth mapping (z = f / d), corridor-to-tunnel morph, column time-slice; transitions: slit opening, plane rotation, corridor-to-tunnel fold, white-out flash, slit wipe (time-slice exposure). In the tradition of 2001: A Space Odyssey — Stargate sequence (Douglas Trumbull, 1968) · Doctor Who title sequence (Bernard Lodge, 1973) · Star Trek: The Next Generation warp effect (1987) · Golan Levin, An Informal Catalogue of Slit-Scan Video Artworks (2005—) · Adam Magyar, Urban Flow (slit-scan photography, 2000s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SLIT-SCAN". Punchy sound design synced to every cut.
```

## 66 · Raymarching
*Signed Distance Fields · 1989 — / 2008 — · Experimental & Generative*

Reference film: `videos/raymarch.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Raymarching** (Signed Distance Fields, 1989 — / 2008 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Instead of polygons, the scene is a single function returning the distance to the nearest surface; each pixel's ray steps forward by that distance until it touches something (John C. Hart's "sphere tracing", 1989/1996). The 4k-intro demoscene adopted it around 2008 (Iñigo Quilez's "Rendering Worlds with Two Triangles", Function 2008) and Shadertoy (Quilez & Pol Jeremias, 2013) made smooth-min blobs, soft shadows, AO and infinite repetition a shared visual language.
- Study these reference works: Iñigo Quilez / RGBA — Elevated (4k intro, Breakpoint 2009) · Iñigo Quilez, "Rendering Worlds with Two Triangles" (2008) · Shadertoy (2013 —) · Mercury — hg_sdf library & demos (2010s) · Media Molecule, Dreams (SDF sculpting, 2020)
- Motion DNA: Shapes are equations, so they melt into each other instead of colliding: blobs bud off and re-merge, a torus grows through them, space itself is repeated and twisted while the camera glides like a demo fly-through.
- Visual DNA: Perfectly smooth glossy primitives fused by soft fillets, a checkerboard floor with soft penumbrae and ambient occlusion, fog fading copies into a gradient sky — the canonical Shadertoy look, introduced through step-count and normal debug views.
- Signature transitions: Debug-view wipes (iterations → normals → lit), smooth-min budding, repetition reveal, twist, gather-back
- Key techniques: Sphere tracing a signed distance field, Polynomial smooth-min blending, Soft shadows (k·h/t) + 4-tap AO, Domain repetition & twist

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Sphere tracing a signed distance field, Polynomial smooth-min blending, Soft shadows (k·h/t) + 4-tap AO, Domain repetition & twist).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Sphere tracing a signed distance field and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RAYMARCHING", held for about 1 s.

BUILD RULES
- Suggested tools: GLSL fragment shader (Shadertoy), Demoscene 4k intros, TouchDesigner / Unity shaders, Canvas 2D (per-pixel CPU march, 480×270). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Raymarching motion-graphics film (Signed Distance Fields). Visual style: perfectly smooth glossy primitives fused by soft fillets, a checkerboard floor with soft penumbrae and ambient occlusion, fog fading copies into a gradient sky — the canonical Shadertoy look, introduced through step-count and normal debug views. Motion: shapes are equations, so they melt into each other instead of colliding: blobs bud off and re-merge, a torus grows through them, space itself is repeated and twisted while the camera glides like a demo fly-through. Signature moves: sphere tracing a signed distance field, polynomial smooth-min blending, soft shadows (k·h/t) + 4-tap ao, domain repetition & twist; transitions: debug-view wipes (iterations → normals → lit), smooth-min budding, repetition reveal, twist, gather-back. In the tradition of Iñigo Quilez / RGBA — Elevated (4k intro, Breakpoint 2009) · Iñigo Quilez, "Rendering Worlds with Two Triangles" (2008) · Shadertoy (2013 —) · Mercury — hg_sdf library & demos (2010s) · Media Molecule, Dreams (SDF sculpting, 2020). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RAYMARCHING". Punchy sound design synced to every cut.
```

## 67 · Feedback Loops
*Video Feedback / Howlaround · 1963 — · Experimental & Generative*

Reference film: `videos/feedback.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Feedback Loops** (Video Feedback / Howlaround, 1963 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Point a camera at the monitor showing its own picture and the image re-enters itself every frame: nested screens, spiralling trails and luminous blooms emerge from nothing but zoom, tilt and delay. Bernard Lodge built Doctor Who's 1963 title sequence from this BBC "howlaround"; 1970s video artists — Nam June Paik (with Shuya Abe's Paik–Abe Synthesizer, 1969–70) and Steina & Woody Vasulka at The Kitchen — made it a medium; digital frame feedback (MilkDrop, TouchDesigner, VJ software) adds zoom, rotation and hue shift on every pass.
- Study these reference works: Doctor Who title sequence (Bernard Lodge, BBC, 1963) · Nam June Paik & Shuya Abe, Paik–Abe Video Synthesizer (1969–70) · Steina & Woody Vasulka, video feedback works (1970s) · Queen, "Bohemian Rhapsody" video (Bruce Gowers, 1975) · MilkDrop (Ryan Geiss, 2001) · TouchDesigner feedback TOPs (Derivative, 2000s —)
- Motion DNA: Nothing is animated directly: one small moving thing is re-photographed again and again, so its past spirals inward or blooms outward. Changing the zoom, tilt or delay changes the whole organism at once; the motion is slow, breathing, self-similar.
- Visual DNA: A dark field with glowing structures: nested screens receding into a spiral tunnel, blooming petals of trailed light, colour cycling through the passes, CRT scanlines and soft bloom.
- Signature transitions: Infinite zoom through nested screens, crossfade between regimes, rotation reversal (fold), echo tunnel title
- Key techniques: Recursive zoom / rotate per pass, One-pass time delay per copy, Additive decay + hue shift per pass, Monitor-in-monitor tunnel

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Recursive zoom / rotate per pass, One-pass time delay per copy, Additive decay + hue shift per pass, Monitor-in-monitor tunnel).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Recursive zoom / rotate per pass and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FEEDBACK LOOPS", held for about 1 s.

BUILD RULES
- Suggested tools: Camera + monitor (analog howlaround), Video synthesizers & colorizers, TouchDesigner / MilkDrop frame feedback, Canvas 2D (N recursive copies as a function of t). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Feedback Loops motion-graphics film (Video Feedback / Howlaround). Visual style: a dark field with glowing structures: nested screens receding into a spiral tunnel, blooming petals of trailed light, colour cycling through the passes, CRT scanlines and soft bloom. Motion: nothing is animated directly: one small moving thing is re-photographed again and again, so its past spirals inward or blooms outward. Changing the zoom, tilt or delay changes the whole organism at once; the motion is slow, breathing, self-similar. Signature moves: recursive zoom / rotate per pass, one-pass time delay per copy, additive decay + hue shift per pass, monitor-in-monitor tunnel; transitions: infinite zoom through nested screens, crossfade between regimes, rotation reversal (fold), echo tunnel title. In the tradition of Doctor Who title sequence (Bernard Lodge, BBC, 1963) · Nam June Paik & Shuya Abe, Paik–Abe Video Synthesizer (1969–70) · Steina & Woody Vasulka, video feedback works (1970s) · Queen, "Bohemian Rhapsody" video (Bruce Gowers, 1975) · MilkDrop (Ryan Geiss, 2001) · TouchDesigner feedback TOPs (Derivative, 2000s —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FEEDBACK LOOPS". Punchy sound design synced to every cut.
```

## 68 · Noise Motion
*Perlin & curl-noise flow fields · 1985 — · Experimental & Generative*

Reference film: `videos/noisemotion.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Noise Motion** (Perlin & curl-noise flow fields, 1985 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Ken Perlin invented gradient noise for Tron and published it as "An Image Synthesizer" at SIGGRAPH 1985: a smooth, band-limited random function that became the default source of organic motion in computer graphics, earning him a Technical Achievement Academy Award in 1997. Generative artists turned it into motion by steering particles with it — angle-from-noise flow fields, and from 2007 Bridson's divergence-free curl noise — and Tyler Hobbs' Fidenza (2021) made packed, non-colliding flow-field curves a signature of long-form generative art.
- Study these reference works: Ken Perlin — "An Image Synthesizer", SIGGRAPH 1985 · Robert Bridson, Jim Hourihan & Marcus Nordenstam — "Curl-Noise for Procedural Fluid Flow", SIGGRAPH 2007 · Robert Hodgin — Magnetosphere (iTunes visualizer, 2008) · Tyler Hobbs — Fidenza (Art Blocks, 2021)
- Motion DNA: Everything moves because a smooth random field says so: ticks swing into alignment, particles are born, stream along the field and die, the whole flow slowly morphs as the noise is sampled through time, then freezes while wide ribbons grow along it from their seed points.
- Visual DNA: A warm cream print with pen-plotter ink hairlines and topographic contours, then flat Fidenza-like ribbons of varied width in vermilion, ochre, ultramarine, blush and sage that never touch, finished with a mat margin and a gallery label.
- Signature transitions: Contour map to tick field, ticks release into particles, flow freezes, ribbons grow, pull back to the framed print
- Key techniques: Perlin gradient noise, Curl-noise advection, Collision-packed ribbons

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Perlin gradient noise, Curl-noise advection, Collision-packed ribbons).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Perlin gradient noise and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "NOISE MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Processing / p5.js, openFrameworks / Cinder, TouchDesigner / Houdini, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Noise Motion motion-graphics film (Perlin & curl-noise flow fields). Visual style: a warm cream print with pen-plotter ink hairlines and topographic contours, then flat Fidenza-like ribbons of varied width in vermilion, ochre, ultramarine, blush and sage that never touch, finished with a mat margin and a gallery label. Motion: everything moves because a smooth random field says so: ticks swing into alignment, particles are born, stream along the field and die, the whole flow slowly morphs as the noise is sampled through time, then freezes while wide ribbons grow along it from their seed points. Signature moves: perlin gradient noise, curl-noise advection, collision-packed ribbons; transitions: contour map to tick field, ticks release into particles, flow freezes, ribbons grow, pull back to the framed print. In the tradition of Ken Perlin — "An Image Synthesizer", SIGGRAPH 1985 · Robert Bridson, Jim Hourihan & Marcus Nordenstam — "Curl-Noise for Procedural Fluid Flow", SIGGRAPH 2007 · Robert Hodgin — Magnetosphere (iTunes visualizer, 2008) · Tyler Hobbs — Fidenza (Art Blocks, 2021). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "NOISE MOTION". Punchy sound design synced to every cut.
```

## 69 · Shader Art
*Fragment shaders & live coding · 2000s — · Experimental & Generative*

Reference film: `videos/shaderart.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Shader Art** (Fragment shaders & live coding, 2000s —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Shader art paints every pixel with one small GPU program — a fragment shader that maps a pixel coordinate and the time to a colour — so images are built from maths rather than geometry: signed distance fields, noise, domain warping and folded space. It grew from the demoscene's size-limited intros and was codified by Inigo Quilez, whose articles on SDFs, fbm warping and cosine palettes became the standard references, and whose Shadertoy (2013, with Pol Jeremias) made it a browser-based community; live "shader showdown" battles in Bonzomatic put the coding itself on screen.
- Study these reference works: Inigo Quilez — articles on domain warping, 2D distance functions and cosine palettes (iquilezles.org) · Shadertoy (Inigo Quilez & Pol Jeremias, 2013) · Bonzomatic live-coding tool (Gargaj / Conspiracy) used for Revision's Shader Showdown · The Book of Shaders (Patricio Gonzalez Vivo & Jen Lowe)
- Motion DNA: The image is a pure function of time, so motion is continuous and endless: gradients cycle, blobs melt into each other through smooth-min, warped noise churns like smoke, the kaleidoscope rotates and its palette scrolls outward; each recompile wipes a new program down the screen on the beat.
- Visual DNA: Full-bleed per-pixel colour fields — the default cosine rainbow, orange-and-blue distance-field stripes with a white zero line, teal-and-sand marbled fbm, an eight-fold mirrored mandala in a cosine palette — under monospace GLSL with dark backing boxes and a status bar.
- Signature transitions: Typed code, compile, top-to-bottom scan wipe to the new program; code clears for the title
- Key techniques: Per-pixel shading, SDF smooth-min metaballs, fbm domain warping

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Per-pixel shading, SDF smooth-min metaballs, fbm domain warping).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Per-pixel shading and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SHADER ART", held for about 1 s.

BUILD RULES
- Suggested tools: GLSL fragment shaders (Shadertoy, Bonzomatic, KodeLife), TouchDesigner GLSL TOP, Canvas 2D ImageData emulation. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Shader Art motion-graphics film (Fragment shaders & live coding). Visual style: full-bleed per-pixel colour fields — the default cosine rainbow, orange-and-blue distance-field stripes with a white zero line, teal-and-sand marbled fbm, an eight-fold mirrored mandala in a cosine palette — under monospace GLSL with dark backing boxes and a status bar. Motion: the image is a pure function of time, so motion is continuous and endless: gradients cycle, blobs melt into each other through smooth-min, warped noise churns like smoke, the kaleidoscope rotates and its palette scrolls outward; each recompile wipes a new program down the screen on the beat. Signature moves: per-pixel shading, sdf smooth-min metaballs, fbm domain warping; transitions: typed code, compile, top-to-bottom scan wipe to the new program; code clears for the title. In the tradition of Inigo Quilez — articles on domain warping, 2D distance functions and cosine palettes (iquilezles.org) · Shadertoy (Inigo Quilez & Pol Jeremias, 2013) · Bonzomatic live-coding tool (Gargaj / Conspiracy) used for Revision's Shader Showdown · The Book of Shaders (Patricio Gonzalez Vivo & Jen Lowe). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SHADER ART". Punchy sound design synced to every cut.
```

## 70 · Clay Stop Motion
*Claymation · 1955 — · Analog, Physical & Stop Motion*

Reference film: `videos/claymation.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Clay Stop Motion** (Claymation, 1955 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Plasticine figures are re-sculpted by hand and photographed one frame at a time. Art Clokey's Gumby made it a TV staple in 1955; Will Vinton's studio coined "Claymation" in the late 1970s and Aardman refined it.
- Study these reference works: Gumby (Art Clokey, 1955) · Closed Mondays (Will Vinton & Bob Gardiner, 1974) · A Grand Day Out (Nick Park, 1989) · Creature Comforts (Aardman, 1989) · Chicken Run (2000)
- Motion DNA: Stepped 12 fps poses with broad squash and stretch, plus a faint boil as the clay is touched between frames.
- Visual DNA: Soft, matte plasticine with fingerprints and tool marks, lit like a miniature set whose exposure flickers slightly from frame to frame.
- Signature transitions: Morph, squash, clay smear, pop-in replacement
- Key techniques: Shot on twos · 12 fps, Thumbprints & shape boil, Plasticine squash & stretch

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Shot on twos · 12 fps, Thumbprints & shape boil, Plasticine squash & stretch).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Shot on twos · 12 fps and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CLAY STOP MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Dragonframe, Stop-motion rig, Canvas 2D (procedural homage). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Clay Stop Motion motion-graphics film (Claymation). Visual style: soft, matte plasticine with fingerprints and tool marks, lit like a miniature set whose exposure flickers slightly from frame to frame. Motion: stepped 12 fps poses with broad squash and stretch, plus a faint boil as the clay is touched between frames. Signature moves: shot on twos · 12 fps, thumbprints & shape boil, plasticine squash & stretch; transitions: morph, squash, clay smear, pop-in replacement. In the tradition of Gumby (Art Clokey, 1955) · Closed Mondays (Will Vinton & Bob Gardiner, 1974) · A Grand Day Out (Nick Park, 1989) · Creature Comforts (Aardman, 1989) · Chicken Run (2000). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CLAY STOP MOTION". Punchy sound design synced to every cut.
```

## 71 · Sand Animation
*Sand on a Light Table · 1969 — · Analog, Physical & Stop Motion*

Reference film: `videos/sand.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Sand Animation** (Sand on a Light Table, 1969 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Sand is pushed around on a backlit glass table and filmed frame by frame (or performed live), so every picture is wiped away to make the next. Caroline Leaf pioneered it at Harvard and the National Film Board of Canada.
- Study these reference works: Sand, or Peter and the Wolf (Caroline Leaf, 1969) · The Owl Who Married a Goose (Caroline Leaf, 1974) · Sandman (Eliot Noyes Jr., 1973) · Ab Ovo (Ferenc Cakó, 1987)
- Motion DNA: Continuous metamorphosis: one picture is swept, smeared and redrawn into the next without a single cut.
- Visual DNA: Grainy silhouettes on a warm glowing table, dark where sand is thick and luminous where fingers clear it.
- Signature transitions: Palm sweep, finger wipe, smear morph, carve-out reveal
- Key techniques: Backlit density: thin sand glows, Finger and palm sweeps, Metamorphosis without cuts

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Backlit density: thin sand glows, Finger and palm sweeps, Metamorphosis without cuts).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Backlit density: thin sand glows and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SAND ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Light table + overhead camera, Dragonframe, Canvas 2D (procedural homage). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Sand Animation motion-graphics film (Sand on a Light Table). Visual style: grainy silhouettes on a warm glowing table, dark where sand is thick and luminous where fingers clear it. Motion: continuous metamorphosis: one picture is swept, smeared and redrawn into the next without a single cut. Signature moves: backlit density: thin sand glows, finger and palm sweeps, metamorphosis without cuts; transitions: palm sweep, finger wipe, smear morph, carve-out reveal. In the tradition of Sand, or Peter and the Wolf (Caroline Leaf, 1969) · The Owl Who Married a Goose (Caroline Leaf, 1974) · Sandman (Eliot Noyes Jr., 1973) · Ab Ovo (Ferenc Cakó, 1987). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SAND ANIMATION". Punchy sound design synced to every cut.
```

## 72 · Xerox Motion
*Photocopy Zine · 1976 — · Analog, Physical & Stop Motion*

Reference film: `videos/xerox.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Xerox Motion** (Photocopy Zine, 1976 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Punk flyers and fanzines were cut, pasted and run through office photocopiers. Designers later animated the copier's own defects: toner noise, light-bar streaks, misregistration and generation loss.
- Study these reference works: Sniffin' Glue (Mark Perry, 1976) · Sex Pistols graphics (Jamie Reid, 1977) · Search & Destroy (V. Vale, 1977) · Black Flag flyers (Raymond Pettibon, late 1970s)
- Motion DNA: Choppy 8 fps cuts, copier light-bar sweeps and images that degrade a little more with every copy.
- Visual DNA: Black toner on coloured paper, misregistered spot colour, speckle, streaks and crooked paste-ups.
- Signature transitions: Light-bar scan, generation-loss cut, scan smear, negative flip
- Key techniques: 1-bit threshold + toner noise, Copy-of-a-copy generation loss, Ransom-note cut-and-paste type

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (1-bit threshold + toner noise, Copy-of-a-copy generation loss, Ransom-note cut-and-paste type).
- 5.0–8.0 s  Climax: the most spectacular moment, built on 1-bit threshold + toner noise and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "XEROX MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Photocopier + scanner, After Effects, Canvas 2D (procedural homage). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Xerox Motion motion-graphics film (Photocopy Zine). Visual style: black toner on coloured paper, misregistered spot colour, speckle, streaks and crooked paste-ups. Motion: choppy 8 fps cuts, copier light-bar sweeps and images that degrade a little more with every copy. Signature moves: 1-bit threshold + toner noise, copy-of-a-copy generation loss, ransom-note cut-and-paste type; transitions: light-bar scan, generation-loss cut, scan smear, negative flip. In the tradition of Sniffin' Glue (Mark Perry, 1976) · Sex Pistols graphics (Jamie Reid, 1977) · Search & Destroy (V. Vale, 1977) · Black Flag flyers (Raymond Pettibon, late 1970s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "XEROX MOTION". Punchy sound design synced to every cut.
```

## 73 · Paint-on-Glass
*Living Oil Paint · 1970s — · Analog, Physical & Stop Motion*

Reference film: `videos/paintglass.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Paint-on-Glass** (Living Oil Paint, 1970s —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Slow-drying oil paint is pushed around with fingers and brushes on a sheet of backlit glass and photographed one frame at a time; each frame is a repainting of the last, so images flow into each other. Aleksandr Petrov made it famous with The Old Man and the Sea (1999), which won the Academy Award.
- Study these reference works: The Street (Caroline Leaf, 1976) · The Cow (Aleksandr Petrov, 1989) · The Old Man and the Sea (Aleksandr Petrov, 1999) · My Love (Aleksandr Petrov, 2006) · Two Sisters (Caroline Leaf, 1990)
- Motion DNA: Nothing cuts: every image is wiped, smeared and repainted into the next, and the brushwork boils from frame to frame.
- Visual DNA: Thick directional strokes of luminous colour that follow the form, lit from behind so the thin paint glows like stained glass.
- Signature transitions: Swirl smear, palm wipe, repaint dissolve, stroke boil
- Key techniques: Directional oil strokes, Smear-morph transitions, Backlit glass glow

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Directional oil strokes, Smear-morph transitions, Backlit glass glow).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Directional oil strokes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PAINT-ON-GLASS", held for about 1 s.

BUILD RULES
- Suggested tools: Physical glass + camera, Canvas 2D, TVPaint. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Paint-on-Glass motion-graphics film (Living Oil Paint). Visual style: thick directional strokes of luminous colour that follow the form, lit from behind so the thin paint glows like stained glass. Motion: nothing cuts: every image is wiped, smeared and repainted into the next, and the brushwork boils from frame to frame. Signature moves: directional oil strokes, smear-morph transitions, backlit glass glow; transitions: swirl smear, palm wipe, repaint dissolve, stroke boil. In the tradition of The Street (Caroline Leaf, 1976) · The Cow (Aleksandr Petrov, 1989) · The Old Man and the Sea (Aleksandr Petrov, 1999) · My Love (Aleksandr Petrov, 2006) · Two Sisters (Caroline Leaf, 1990). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PAINT-ON-GLASS". Punchy sound design synced to every cut.
```

## 74 · Direct-on-Film
*Scratched & Painted Celluloid · 1930s — · Analog, Physical & Stop Motion*

Reference film: `videos/directfilm.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Direct-on-Film** (Scratched & Painted Celluloid, 1930s —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Cameraless animation: artists paint, dye, scratch and stick things straight onto film stock, frame by frame or along the strip, and project the result. Len Lye and Norman McLaren turned it into visual music.
- Study these reference works: A Colour Box (Len Lye, 1935) · Free Radicals (Len Lye, 1958) · Begone Dull Care (Norman McLaren & Evelyn Lambart, 1949) · Blinkity Blank (Norman McLaren, 1955) · Mothlight (Stan Brakhage, 1963)
- Motion DNA: Visual music: every bass step, cymbal and snare lands on the frame as a new blob, a leaping scratch or a starburst, boiling at 24 fps.
- Visual DNA: Translucent dye and white needle lines on celluloid, with sprocket holes, dust, hair, gate weave and flicker showing the medium.
- Signature transitions: Frame slip, colour/black flicker, burn-out, white flash
- Key techniques: Dye painted along the strip, Needle scratches on black leader, Projector weave & flicker

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Dye painted along the strip, Needle scratches on black leader, Projector weave & flicker).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Dye painted along the strip and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DIRECT-ON-FILM", held for about 1 s.

BUILD RULES
- Suggested tools: Film stock + paint + needle, Optical printer, Canvas 2D (procedural homage). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Direct-on-Film motion-graphics film (Scratched & Painted Celluloid). Visual style: translucent dye and white needle lines on celluloid, with sprocket holes, dust, hair, gate weave and flicker showing the medium. Motion: visual music: every bass step, cymbal and snare lands on the frame as a new blob, a leaping scratch or a starburst, boiling at 24 fps. Signature moves: dye painted along the strip, needle scratches on black leader, projector weave & flicker; transitions: frame slip, colour/black flicker, burn-out, white flash. In the tradition of A Colour Box (Len Lye, 1935) · Free Radicals (Len Lye, 1958) · Begone Dull Care (Norman McLaren & Evelyn Lambart, 1949) · Blinkity Blank (Norman McLaren, 1955) · Mothlight (Stan Brakhage, 1963). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DIRECT-ON-FILM". Punchy sound design synced to every cut.
```

## 75 · Cyanotype Motion
*Prussian-Blue Sun Prints · 1842 — · Analog, Physical & Stop Motion*

Reference film: `videos/cyanotype.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cyanotype Motion** (Prussian-Blue Sun Prints, 1842 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Paper brushed with iron salts turns Prussian blue where sunlight reaches it; objects laid on top stay white once the print is washed in water. John Herschel invented the process in 1842 and Anna Atkins used it for the first book illustrated with photographs.
- Study these reference works: Photographs of British Algae: Cyanotype Impressions (Anna Atkins, 1843–53) · Cyanotypes of British and Foreign Ferns (Anna Atkins & Anne Dixon, 1853) · cyanotype photograms by Bertha Evelyn Jaques (c. 1906)
- Motion DNA: Slow stop-motion: specimens are nudged between exposures, the blue builds with the light, and the wash reveals the picture in one sweep.
- Visual DNA: White botanical silhouettes on deep Prussian blue, with brushed edges, uneven emulsion, paper fibre and faint ghosts of earlier positions.
- Signature transitions: Brush coat, stepped rearrangement, sun burst, water wash, dry-down
- Key techniques: Brush-coated emulsion, Contact exposure under glass, Water-wash development

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Brush-coated emulsion, Contact exposure under glass, Water-wash development).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Brush-coated emulsion and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CYANOTYPE MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Sensitised paper + sunlight, Contact frame + water bath, Canvas 2D (procedural homage). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cyanotype Motion motion-graphics film (Prussian-Blue Sun Prints). Visual style: white botanical silhouettes on deep Prussian blue, with brushed edges, uneven emulsion, paper fibre and faint ghosts of earlier positions. Motion: slow stop-motion: specimens are nudged between exposures, the blue builds with the light, and the wash reveals the picture in one sweep. Signature moves: brush-coated emulsion, contact exposure under glass, water-wash development; transitions: brush coat, stepped rearrangement, sun burst, water wash, dry-down. In the tradition of Photographs of British Algae: Cyanotype Impressions (Anna Atkins, 1843–53) · Cyanotypes of British and Foreign Ferns (Anna Atkins & Anne Dixon, 1853) · cyanotype photograms by Bertha Evelyn Jaques (c. 1906). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CYANOTYPE MOTION". Punchy sound design synced to every cut.
```

## 76 · VHS Analog Video
*Home Video on Tape · 1976 — · Analog, Physical & Stop Motion*

Reference film: `videos/vhs.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **VHS Analog Video** (Home Video on Tape, 1976 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: JVC launched the VHS cassette in Japan in 1976, and by the mid-1980s VHS-C and full-size camcorders had put a video camera in millions of homes. Its colour-under recording keeps luma at roughly 240 lines and squeezes chroma into a narrow band, so colours smear and lag; helical-scan heads leave tracking bands and switching noise. Analog-horror and retro music videos later rebuilt these faults on purpose.
- Study these reference works: JVC HR-3300 "Vidstar" (first VHS deck, 1976) · Videodrome (David Cronenberg, 1983) · America's Funniest Home Videos (ABC, 1989 —) · V/H/S (2012) · Too Many Cooks (Casper Kelly, Adult Swim, 2014) · Local 58 (Kris Straub, 2015)
- Motion DNA: Handheld drift and a slow camcorder zoom, interrupted by the machine: picture rolls in after PLAY, tracking bands crawl through, the tape searches backwards with noise bars, and PAUSE freezes a jittering frame.
- Visual DNA: Soft, haloed luma with colours smeared to the right of their objects, warm tungsten light and an on-camera hotspot, a burned-in camcorder date stamp, torn bottom lines, white dropout streaks, and a razor-sharp VCR OSD floating on top.
- Signature transitions: Blue-back to PLAY roll, tracking slip, chroma loss, rewind search, pause freeze
- Key techniques: YIQ chroma bleed & delay, Tracking error & head-switching noise, Timebase wobble & dropouts, Crisp VCR on-screen display

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (YIQ chroma bleed & delay, Tracking error & head-switching noise, Timebase wobble & dropouts, Crisp VCR on-screen display).
- 5.0–8.0 s  Climax: the most spectacular moment, built on YIQ chroma bleed & delay and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VHS ANALOG VIDEO", held for about 1 s.

BUILD RULES
- Suggested tools: Camcorder + VCR (dub generations), After Effects (VHS presets, ntscQT), Canvas 2D (per-line YIQ decode). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second VHS Analog Video motion-graphics film (Home Video on Tape). Visual style: soft, haloed luma with colours smeared to the right of their objects, warm tungsten light and an on-camera hotspot, a burned-in camcorder date stamp, torn bottom lines, white dropout streaks, and a razor-sharp VCR OSD floating on top. Motion: handheld drift and a slow camcorder zoom, interrupted by the machine: picture rolls in after PLAY, tracking bands crawl through, the tape searches backwards with noise bars, and PAUSE freezes a jittering frame. Signature moves: yiq chroma bleed & delay, tracking error & head-switching noise, timebase wobble & dropouts, crisp vcr on-screen display; transitions: blue-back to PLAY roll, tracking slip, chroma loss, rewind search, pause freeze. In the tradition of JVC HR-3300 "Vidstar" (first VHS deck, 1976) · Videodrome (David Cronenberg, 1983) · America's Funniest Home Videos (ABC, 1989 —) · V/H/S (2012) · Too Many Cooks (Casper Kelly, Adult Swim, 2014) · Local 58 (Kris Straub, 2015). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VHS ANALOG VIDEO". Punchy sound design synced to every cut.
```

## 77 · Film Burn
*Light Leaks & Burn-through · 1966 — · Analog, Physical & Stop Motion*

Reference film: `videos/filmburn.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Film Burn** (Light Leaks & Burn-through, 1966 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Celluloid is fragile: light leaking into a camera or a can fogs the raw stock orange and red at the ends of each roll, and a print that jams in front of a projector lamp blisters and melts in seconds. Ingmar Bergman staged that burn-through on purpose in Persona (1966), Monte Hellman ended Two-Lane Blacktop (1971) with its last frame burning in the gate, and editors have used scanned light leaks and burn transitions ever since.
- Study these reference works: Persona (Ingmar Bergman, 1966) · Two-Lane Blacktop (Monte Hellman, 1971) · Fight Club (David Fincher, 1999; changeover "cigarette burns") · Decasia (Bill Morrison, 2002) · Grindhouse: Planet Terror (Robert Rodriguez, 2007)
- Motion DNA: A steady 24 fps print breathing with weave and flicker, interrupted by the projector: the framing slips to show the frame line, the strip stops dead, a hole bubbles and melts outward, and the reel flaps through flash frames.
- Visual DNA: Warm Kodachrome dusk, orange and red fogging blooming from the gate edges, brown scorched emulsion with blisters around a white-hot hole, black frame lines and perforations, dust, hairs and green-white scratches.
- Signature transitions: Light-leak flare, frame-line slip, burn-through to white, flash frames, run-out
- Key techniques: Light-leak fogging (screen blend), Projector burn-through & blistering, Gate weave, frame-line slip, flicker, Dust, hair, scratches, cue dots

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Light-leak fogging (screen blend), Projector burn-through & blistering, Gate weave, frame-line slip, flicker, Dust, hair, scratches, cue dots).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Light-leak fogging (screen blend) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FILM BURN", held for about 1 s.

BUILD RULES
- Suggested tools: 35mm projector + leader, Scanned light-leak / burn overlays (screen blend), Canvas 2D (procedural burn). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural homage (the real effect destroys the print).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Film Burn motion-graphics film (Light Leaks & Burn-through). Visual style: warm Kodachrome dusk, orange and red fogging blooming from the gate edges, brown scorched emulsion with blisters around a white-hot hole, black frame lines and perforations, dust, hairs and green-white scratches. Motion: a steady 24 fps print breathing with weave and flicker, interrupted by the projector: the framing slips to show the frame line, the strip stops dead, a hole bubbles and melts outward, and the reel flaps through flash frames. Signature moves: light-leak fogging (screen blend), projector burn-through & blistering, gate weave, frame-line slip, flicker, dust, hair, scratches, cue dots; transitions: light-leak flare, frame-line slip, burn-through to white, flash frames, run-out. In the tradition of Persona (Ingmar Bergman, 1966) · Two-Lane Blacktop (Monte Hellman, 1971) · Fight Club (David Fincher, 1999; changeover "cigarette burns") · Decasia (Bill Morrison, 2002) · Grindhouse: Planet Terror (Robert Rodriguez, 2007). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FILM BURN". Punchy sound design synced to every cut.
```

## 78 · Object Stop Motion
*Everyday Things, Frame by Frame · 1907 — · Analog, Physical & Stop Motion*

Reference film: `videos/objectstop.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Object Stop Motion** (Everyday Things, Frame by Frame, 1907 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Instead of puppets or clay, real household objects are moved a fraction between exposures so they seem to act on their own. J. Stuart Blackton's The Haunted Hotel (1907) had a breakfast table lay itself; Norman McLaren extended the trick to people as pixilation in Neighbours (1952); Jan Švankmajer turned food and utensils into uncanny actors; and PES made food out of non-food — Rubik's cubes, bubble wrap and Post-it notes — in Western Spaghetti (2008).
- Study these reference works: The Haunted Hotel (J. Stuart Blackton, 1907) · Neighbours (Norman McLaren, 1952) · Dimensions of Dialogue (Jan Švankmajer, 1982) · Food (Jan Švankmajer, 1992) · Western Spaghetti (PES, 2008) · Fresh Guacamole (PES, 2012)
- Motion DNA: Everything moves in 12 fps steps, as if nudged by an unseen hand: props shuffle in and hop to their marks, a paper egg spreads in a few exposures, beads re-scatter every frame like sizzling fat, and every resting object shivers by a pixel or two.
- Visual DNA: A warm overhead view of a pine tabletop with real drop shadows: a cast-iron pan on a ring of sticky-note flames, a golf-ball egg with a yellow button yolk, cork toast, ribbon bacon, a blue-rimmed plate and wooden letter tiles, under a faintly flickering key light.
- Signature transitions: None — props enter and exit the locked frame by hand; the title is spelled with tiles on the table
- Key techniques: Shot on twos at 12 fps, Object substitution (things stand in for food), Locked overhead camera on a tabletop, Per-frame placement jitter & light flicker

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Shot on twos at 12 fps, Object substitution (things stand in for food), Locked overhead camera on a tabletop, Per-frame placement jitter & light flicker).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Shot on twos at 12 fps and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "OBJECT STOP MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: DSLR on an overhead rig + Dragonframe, Hand-placed props, onion-skin checks, Canvas 2D (12 fps quantised time, cached exposures). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural homage (the real thing is shot frame by frame).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Object Stop Motion motion-graphics film (Everyday Things, Frame by Frame). Visual style: a warm overhead view of a pine tabletop with real drop shadows: a cast-iron pan on a ring of sticky-note flames, a golf-ball egg with a yellow button yolk, cork toast, ribbon bacon, a blue-rimmed plate and wooden letter tiles, under a faintly flickering key light. Motion: everything moves in 12 fps steps, as if nudged by an unseen hand: props shuffle in and hop to their marks, a paper egg spreads in a few exposures, beads re-scatter every frame like sizzling fat, and every resting object shivers by a pixel or two. Signature moves: shot on twos at 12 fps, object substitution (things stand in for food), locked overhead camera on a tabletop, per-frame placement jitter & light flicker; transitions: none — props enter and exit the locked frame by hand; the title is spelled with tiles on the table. In the tradition of The Haunted Hotel (J. Stuart Blackton, 1907) · Neighbours (Norman McLaren, 1952) · Dimensions of Dialogue (Jan Švankmajer, 1982) · Food (Jan Švankmajer, 1992) · Western Spaghetti (PES, 2008) · Fresh Guacamole (PES, 2012). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "OBJECT STOP MOTION". Punchy sound design synced to every cut.
```

## 79 · Puppet Animation
*Stop-motion puppets on a miniature set · 1910s — · Analog, Physical & Stop Motion*

Reference film: `videos/puppet.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Puppet Animation** (Stop-motion puppets on a miniature set, 1910s —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Puppet animation poses jointed figures on a miniature set and shoots them one frame at a time, so a body built of wood, wire, felt and silicone appears to live. Władysław Starewicz pioneered it in the 1910s, Jiří Trnka made Czech puppet film an art form from the late 1940s with carved wooden figures whose fixed faces act through light and posture, and studios such as Laika and Wes Anderson's crews later combined steel ball-and-socket armatures, furred and knitted costumes and libraries of replacement faces.
- Study these reference works: Władysław Starewicz — The Cameraman's Revenge (1912) · Jiří Trnka — The Emperor's Nightingale (1949), A Midsummer Night's Dream (1959), The Hand (1965) · Henry Selick / Laika — Coraline (2009) · Wes Anderson — Fantastic Mr. Fox (2009) · Laika — Kubo and the Two Strings (2016)
- Motion DNA: Everything moves in held steps at 12 frames a second: a walk clicks from pose to pose, the head snaps between angles, mouths and eyelids swap whole pieces from a tray, fur and felt boil slightly where hands touched them, a hop is held up by a rig arm, and the key light flickers by a percent from frame to frame.
- Visual DNA: A planimetric, symmetrical tabletop set in autumn oranges and mustards — painted dusk backdrop, cardboard hills, pompom felt trees on dowels, a balsa house with a lit window, a sand lane on green flock — and a felt fox puppet in a knitted jumper, scarf and corduroys with glass-bead eyes, then its steel armature in an x-ray pass.
- Signature transitions: Slate clap, stepped walk-in, head turn, mouth-tray insert, x-ray wipe to the armature, rig-arm hop, pull back to the set edge and studio
- Key techniques: 12 fps stepped posing, Replacement mouths & eyelids, Ball-and-socket armature

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (12 fps stepped posing, Replacement mouths & eyelids, Ball-and-socket armature).
- 5.0–8.0 s  Climax: the most spectacular moment, built on 12 fps stepped posing and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PUPPET ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Dragonframe stop-motion capture, Ball-and-socket armatures, 3D-printed replacement faces, Nuke rig removal, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs a built puppet and set (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Puppet Animation motion-graphics film (Stop-motion puppets on a miniature set). Visual style: a planimetric, symmetrical tabletop set in autumn oranges and mustards — painted dusk backdrop, cardboard hills, pompom felt trees on dowels, a balsa house with a lit window, a sand lane on green flock — and a felt fox puppet in a knitted jumper, scarf and corduroys with glass-bead eyes, then its steel armature in an x-ray pass. Motion: everything moves in held steps at 12 frames a second: a walk clicks from pose to pose, the head snaps between angles, mouths and eyelids swap whole pieces from a tray, fur and felt boil slightly where hands touched them, a hop is held up by a rig arm, and the key light flickers by a percent from frame to frame. Signature moves: 12 fps stepped posing, replacement mouths & eyelids, ball-and-socket armature; transitions: slate clap, stepped walk-in, head turn, mouth-tray insert, x-ray wipe to the armature, rig-arm hop, pull back to the set edge and studio. In the tradition of Władysław Starewicz — The Cameraman's Revenge (1912) · Jiří Trnka — The Emperor's Nightingale (1949), A Midsummer Night's Dream (1959), The Hand (1965) · Henry Selick / Laika — Coraline (2009) · Wes Anderson — Fantastic Mr. Fox (2009) · Laika — Kubo and the Two Strings (2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PUPPET ANIMATION". Punchy sound design synced to every cut.
```

## 80 · Pixilation
*Live actors, one frame at a time · 1908 — · Analog, Physical & Stop Motion*

Reference film: `videos/pixilation.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Pixilation** (Live actors, one frame at a time, 1908 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Pixilation animates real people and objects with the stop-motion camera: actors hold a pose for each exposure, move a little, and hold again, so on screen they glide, levitate and change clothes without ever walking. Émile Cohl and Segundo de Chomón used the trick in the 1900s; Norman McLaren made it an art form at the National Film Board of Canada with Neighbours (1952), which won an Academy Award, and the technique returned in music videos with Peter Gabriel’s Sledgehammer and in the short films of PES.
- Study these reference works: Neighbours (Norman McLaren, NFB, 1952) · A Chairy Tale (Norman McLaren & Claude Jutra, 1957) · Sledgehammer (Peter Gabriel, dir. Stephen R. Johnson, with Aardman and the Brothers Quay, 1986) · Western Spaghetti (PES, 2008) · Fresh Guacamole (PES, 2012)
- Motion DNA: Time is chopped into exposures: people slide along the ground with their legs locked, hop through the air without ever landing, sit on nothing and drive, and swap clothes, poses and places at every cut, while a little jitter between frames keeps every held pose alive.
- Visual DNA: Ordinary daylight locations shot on film: a park lawn with mowing stripes, railings, terraced houses and a street; actors in period clothes lit like photographs with a hard key light, contact shadows that stay on the grass, heavy grain, gate weave and slight exposure flicker from frame to frame.
- Signature transitions: Glide-in, levitating hop, bow, jump cuts on the third of a second, invisible-car ride, letter-per-frame title placement
- Key techniques: Stepped 12 fps exposures, Airborne-every-frame hops, Jump-cut costume swaps

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Stepped 12 fps exposures, Airborne-every-frame hops, Jump-cut costume swaps).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Stepped 12 fps exposures and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PIXILATION", held for about 1 s.

BUILD RULES
- Suggested tools: Film or DSLR camera with intervalometer, actors posed per frame, Dragonframe / Stop Motion Studio onion skinning, Canvas 2D (time quantised to 12 fps). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Pixilation motion-graphics film (Live actors, one frame at a time). Visual style: ordinary daylight locations shot on film: a park lawn with mowing stripes, railings, terraced houses and a street; actors in period clothes lit like photographs with a hard key light, contact shadows that stay on the grass, heavy grain, gate weave and slight exposure flicker from frame to frame. Motion: time is chopped into exposures: people slide along the ground with their legs locked, hop through the air without ever landing, sit on nothing and drive, and swap clothes, poses and places at every cut, while a little jitter between frames keeps every held pose alive. Signature moves: stepped 12 fps exposures, airborne-every-frame hops, jump-cut costume swaps; transitions: glide-in, levitating hop, bow, jump cuts on the third of a second, invisible-car ride, letter-per-frame title placement. In the tradition of Neighbours (Norman McLaren, NFB, 1952) · A Chairy Tale (Norman McLaren & Claude Jutra, 1957) · Sledgehammer (Peter Gabriel, dir. Stephen R. Johnson, with Aardman and the Brothers Quay, 1986) · Western Spaghetti (PES, 2008) · Fresh Guacamole (PES, 2012). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PIXILATION". Punchy sound design synced to every cut.
```

## 81 · Retrowave Chrome
*80s Neon & CGI · 1982 — · Digital, Internet & Screen*

Reference film: `videos/retro.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Retrowave Chrome** (80s Neon & CGI, 1982 —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Early CGI and MTV-era idents, revived in the 2010s alongside synthwave music.
- Study these reference works: Tron (1982) · Drive (2011) · Stranger Things titles (2016)
- Motion DNA: An infinite grid scrolls toward camera while neon letters slide slowly together in extreme close-up.
- Visual DNA: Magenta and cyan, striped sunset, chrome type, VHS scanlines.
- Signature transitions: VHS tracking band, white flash to chrome
- Key techniques: Perspective grid, Chrome gradients, Neon glow

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Perspective grid, Chrome gradients, Neon glow).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Perspective grid and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RETROWAVE CHROME", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Cinema 4D, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Retrowave Chrome motion-graphics film (80s Neon & CGI). Visual style: magenta and cyan, striped sunset, chrome type, VHS scanlines. Motion: an infinite grid scrolls toward camera while neon letters slide slowly together in extreme close-up. Signature moves: perspective grid, chrome gradients, neon glow; transitions: vHS tracking band, white flash to chrome. In the tradition of Tron (1982) · Drive (2011) · Stranger Things titles (2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RETROWAVE CHROME". Punchy sound design synced to every cut.
```

## 82 · Pixel Art
*8-bit · 1980 — · Digital, Internet & Screen*

Reference film: `videos/pixel.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Pixel Art** (8-bit, 1980 —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Born from the hardware limits of arcade and NES-era consoles, then kept alive as a deliberate aesthetic.
- Study these reference works: Super Mario Bros. (1985) · Celeste (2018)
- Motion DNA: Sprite cycles in few frames, parallax layers, motion snapped to whole pixels.
- Visual DNA: Low resolution scaled with nearest-neighbour, 16-colour palette, dithering, CRT mask.
- Signature transitions: Iris out, level-clear fanfare
- Key techniques: Low-res buffer, Limited palette, Chiptune sync

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Low-res buffer, Limited palette, Chiptune sync).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Low-res buffer and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PIXEL ART", held for about 1 s.

BUILD RULES
- Suggested tools: Aseprite, Canvas 2D, PICO-8. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Pixel Art motion-graphics film (8-bit). Visual style: low resolution scaled with nearest-neighbour, 16-colour palette, dithering, CRT mask. Motion: sprite cycles in few frames, parallax layers, motion snapped to whole pixels. Signature moves: low-res buffer, limited palette, chiptune sync; transitions: iris out, level-clear fanfare. In the tradition of Super Mario Bros. (1985) · Celeste (2018). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PIXEL ART". Punchy sound design synced to every cut.
```

## 83 · Glitch / Datamosh
*Beautiful Errors · 2005 — · Digital, Internet & Screen*

Reference film: `videos/glitch.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Glitch / Datamosh** (Beautiful Errors, 2005 —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Digital compression errors turned into an aesthetic. The cyan-red offset of TikTok's logo is its pop descendant.
- Study these reference works: Takeshi Murata, Monster Movie (2005) · Welcome to Heartbreak (2009)
- Motion DNA: Clean signal interrupted by frame-rate bursts of error that build to a full breakdown.
- Visual DNA: Channel offsets, macroblocks, static, monospace HUD.
- Signature transitions: Datamosh melt, static cut, reconnect
- Key techniques: RGB split, Slice displacement, Pixel melt

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (RGB split, Slice displacement, Pixel melt).
- 5.0–8.0 s  Climax: the most spectacular moment, built on RGB split and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GLITCH / DATAMOSH", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Avidemux, Canvas 2D, GLSL. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Glitch / Datamosh motion-graphics film (Beautiful Errors). Visual style: channel offsets, macroblocks, static, monospace HUD. Motion: clean signal interrupted by frame-rate bursts of error that build to a full breakdown. Signature moves: rgb split, slice displacement, pixel melt; transitions: datamosh melt, static cut, reconnect. In the tradition of Takeshi Murata, Monster Movie (2005) · Welcome to Heartbreak (2009). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GLITCH / DATAMOSH". Punchy sound design synced to every cut.
```

## 84 · Vaporwave
*Mall-soft Nostalgia · 2010 — · Digital, Internet & Screen*

Reference film: `videos/vaporwave.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Vaporwave** (Mall-soft Nostalgia, 2010 —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: An internet microgenre that slowed, looped and pitched down 1980s–90s muzak, smooth jazz and corporate pop; its visual language of classical busts, early Windows chrome, katakana and sunset grids formed on Tumblr and Bandcamp around 2010–2012.
- Study these reference works: Macintosh Plus — Floral Shoppe (2011) · Chuck Person — Eccojams Vol. 1 (2010) · James Ferraro — Far Side Virtual (2011) · Saint Pepsi — Hit Vibes (2013)
- Motion DNA: Slowed, looping, deliberately stalled motion: beats repeat, the tape rewinds and fast-forwards instead of cutting.
- Visual DNA: Marble statuary, pink/teal sunset gradients, perspective grids, fullwidth type and katakana, early-OS windows, all under VHS artefacts.
- Signature transitions: VHS tracking roll, rewind stutter, fast-forward, Win95 zoom-open, window drag trail, snow cut
- Key techniques: Classical bust + sunset grid, Win95 chrome & error cascades, VHS wobble, chopped & screwed time

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Classical bust + sunset grid, Win95 chrome & error cascades, VHS wobble, chopped & screwed time).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Classical bust + sunset grid and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VAPORWAVE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, VHS emulation. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Vaporwave motion-graphics film (Mall-soft Nostalgia). Visual style: marble statuary, pink/teal sunset gradients, perspective grids, fullwidth type and katakana, early-OS windows, all under VHS artefacts. Motion: slowed, looping, deliberately stalled motion: beats repeat, the tape rewinds and fast-forwards instead of cutting. Signature moves: classical bust + sunset grid, win95 chrome & error cascades, vhs wobble, chopped & screwed time; transitions: vHS tracking roll, rewind stutter, fast-forward, Win95 zoom-open, window drag trail, snow cut. In the tradition of Macintosh Plus — Floral Shoppe (2011) · Chuck Person — Eccojams Vol. 1 (2010) · James Ferraro — Far Side Virtual (2011) · Saint Pepsi — Hit Vibes (2013). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VAPORWAVE". Punchy sound design synced to every cut.
```

## 85 · Frutiger Aero
*Glossy Clean-tech Optimism · 2004 — 2013 · Digital, Internet & Screen*

Reference film: `videos/frutiger.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Frutiger Aero** (Glossy Clean-tech Optimism, 2004 — 2013; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A retroactively named mid-2000s look (the label spread in the late 2010s via the Consumer Aesthetics Research Institute) of glossy glass UI, aqua bubbles and green nature imagery, epitomised by Windows Vista’s Aero and early skeuomorphic iPhone OS.
- Study these reference works: Windows Vista Aero (2007) · Windows 7 (2009) · Mac OS X Aqua (2000) · iPhone OS 1–6 (2007–2012) · Nintendo Wii Menu (2006)
- Motion DNA: Buoyant, floating motion: rising bubbles, springy UI pops, gentle drifting light and slow camera lifts.
- Visual DNA: Sky-blue and lime gradients, wet glass with specular caps, aqua water and fish, rolling green hills, aurora swooshes and lens flares.
- Signature transitions: Underwater rise, water-surface breach, glass slide-in, bubble converge, shrink-fade, shine sweep
- Key techniques: Glossy half-pill highlights, Glass orbs, bubbles & water, Sky, grass hills & lens flares

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Glossy half-pill highlights, Glass orbs, bubbles & water, Sky, grass hills & lens flares).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Glossy half-pill highlights and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FRUTIGER AERO", held for about 1 s.

BUILD RULES
- Suggested tools: Photoshop / Illustrator, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Frutiger Aero motion-graphics film (Glossy Clean-tech Optimism). Visual style: sky-blue and lime gradients, wet glass with specular caps, aqua water and fish, rolling green hills, aurora swooshes and lens flares. Motion: buoyant, floating motion: rising bubbles, springy UI pops, gentle drifting light and slow camera lifts. Signature moves: glossy half-pill highlights, glass orbs, bubbles & water, sky, grass hills & lens flares; transitions: underwater rise, water-surface breach, glass slide-in, bubble converge, shrink-fade, shine sweep. In the tradition of Windows Vista Aero (2007) · Windows 7 (2009) · Mac OS X Aqua (2000) · iPhone OS 1–6 (2007–2012) · Nintendo Wii Menu (2006). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FRUTIGER AERO". Punchy sound design synced to every cut.
```

## 86 · CRT Terminal / Digital Rain
*Green Phosphor Code · 1999 — · Digital, Internet & Screen*

Reference film: `videos/terminal.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **CRT Terminal / Digital Rain** (Green Phosphor Code, 1999 —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Green P1-phosphor monochrome terminals defined early computing screens; The Matrix (1999) turned them into myth with its cascading “digital rain” of mirrored katakana and numerals, designed by Simon Whiteley.
- Study these reference works: The Matrix (1999) title & code rain · WarGames (1983) · Alien (1979) MU-TH-UR screens · IBM 5151 monochrome display (1981)
- Motion DNA: Discrete, character-by-character time: typing, ticking bars, then cascades of falling glyphs that resolve into meaning.
- Visual DNA: Monochrome green phosphor on black with bloom, scanlines, barrel-curved glass and vignette; mirrored half-width katakana columns with white-hot heads.
- Signature transitions: CRT power-on, character scramble-and-fall, rain sweep reveal, glyph lock
- Key techniques: Typed command lines & block cursor, ASCII progress bars, Katakana rain, phosphor bloom, curved glass

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Typed command lines & block cursor, ASCII progress bars, Katakana rain, phosphor bloom, curved glass).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Typed command lines & block cursor and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CRT TERMINAL / DIGITAL RAIN", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, GLSL shaders. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second CRT Terminal / Digital Rain motion-graphics film (Green Phosphor Code). Visual style: monochrome green phosphor on black with bloom, scanlines, barrel-curved glass and vignette; mirrored half-width katakana columns with white-hot heads. Motion: discrete, character-by-character time: typing, ticking bars, then cascades of falling glyphs that resolve into meaning. Signature moves: typed command lines & block cursor, ascii progress bars, katakana rain, phosphor bloom, curved glass; transitions: cRT power-on, character scramble-and-fall, rain sweep reveal, glyph lock. In the tradition of The Matrix (1999) title & code rain · WarGames (1983) · Alien (1979) MU-TH-UR screens · IBM 5151 monochrome display (1981). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CRT TERMINAL / DIGITAL RAIN". Punchy sound design synced to every cut.
```

## 87 · Retro Desktop UI
*Windows, Icons, Menus, Pointer · 1984 — 2001 · Digital, Internet & Screen*

Reference film: `videos/desktop.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Retro Desktop UI** (Windows, Icons, Menus, Pointer, 1984 — 2001; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The graphical desktop metaphor born at Xerox PARC (Alto, 1973; Star, 1981) reached the public with the 1-bit Apple Macintosh in 1984, became mass culture with Windows 95’s Start button and taskbar, and peaked in the glossy Luna theme of Windows XP in 2001.
- Study these reference works: Xerox Star 8010 (1981) · Apple Macintosh System 1, icons by Susan Kare (1984) · Windows 95 (1995) · Microsoft Solitaire win cascade, Wes Cherry (1990) · Windows XP Luna (2001)
- Motion DNA: The cursor is the protagonist: every move is a double-click, drag or menu pull answered by zoom rectangles, inverted highlights and a progress bar.
- Visual DNA: Native-resolution pixels scaled up crisp: 1-bit checker gray and striped title bars, teal desktop with grey 3D bevels and navy captions, then Luna blue glass, green Start and rolling-hill wallpaper.
- Signature transitions: Zoom-rect open, dithered dissolve, caption-bar zoom, Solitaire trail cascade, display mode-switch blackout, grayscale shut-down fade, CRT collapse
- Key techniques: Pixel-exact bevels & 1-bit dither, Zoom-rect window opening, Cursor-driven choreography

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Pixel-exact bevels & 1-bit dither, Zoom-rect window opening, Cursor-driven choreography).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Pixel-exact bevels & 1-bit dither and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RETRO DESKTOP UI", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, Pixel art, After Effects. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Retro Desktop UI motion-graphics film (Windows, Icons, Menus, Pointer). Visual style: native-resolution pixels scaled up crisp: 1-bit checker gray and striped title bars, teal desktop with grey 3D bevels and navy captions, then Luna blue glass, green Start and rolling-hill wallpaper. Motion: the cursor is the protagonist: every move is a double-click, drag or menu pull answered by zoom rectangles, inverted highlights and a progress bar. Signature moves: pixel-exact bevels & 1-bit dither, zoom-rect window opening, cursor-driven choreography; transitions: zoom-rect open, dithered dissolve, caption-bar zoom, Solitaire trail cascade, display mode-switch blackout, grayscale shut-down fade, CRT collapse. In the tradition of Xerox Star 8010 (1981) · Apple Macintosh System 1, icons by Susan Kare (1984) · Windows 95 (1995) · Microsoft Solitaire win cascade, Wes Cherry (1990) · Windows XP Luna (2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RETRO DESKTOP UI". Punchy sound design synced to every cut.
```

## 88 · Webcore / Web 1.0
*Early-internet Maximalism · 1994 — 2009 · Digital, Internet & Screen*

Reference film: `videos/webcore.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Webcore / Web 1.0** (Early-internet Maximalism, 1994 — 2009; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The hand-coded personal homepage of the early web: GeoCities (1994–2009), Angelfire and Tripod gave anyone free space, and amateurs filled it with tiled backgrounds, animated GIFs, MIDI files and blink/marquee tags; Olia Lialina and Dragan Espenschied later archived it as folk art.
- Study these reference works: GeoCities neighbourhoods (1994–2009) · Space Jam official site (1996) · Olia Lialina & Dragan Espenschied — One Terabyte of Kilobyte Age (2013–) · Internet Archive GifCities (2016) · Netscape Navigator 3 blink & marquee tags
- Motion DNA: Everything loops at once at GIF frame-rates: blinking, spinning, scrolling, counting, until pop-ups multiply into overload and collapse into one shouting lockup.
- Visual DNA: Black starfields and tiled textures, saturated rainbow WordArt with 3D extrusion, Times and Comic Sans, bevelled grey browser chrome and dial-up era status bars.
- Signature transitions: Dial-up connect, interlaced GIF load, stepped wheel scroll, pop-up multiplication, window implosion, white flash, starfield warp
- Key techniques: Tiled starfield & swirl backgrounds, Animated GIFs: NEW!, @, construction, Marquee, hit counter, pop-up cascade

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Tiled starfield & swirl backgrounds, Animated GIFs: NEW!, @, construction, Marquee, hit counter, pop-up cascade).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Tiled starfield & swirl backgrounds and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "WEBCORE / WEB 1.0", held for about 1 s.

BUILD RULES
- Suggested tools: HTML 3.2, Animated GIF, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Webcore / Web 1.0 motion-graphics film (Early-internet Maximalism). Visual style: black starfields and tiled textures, saturated rainbow WordArt with 3D extrusion, Times and Comic Sans, bevelled grey browser chrome and dial-up era status bars. Motion: everything loops at once at GIF frame-rates: blinking, spinning, scrolling, counting, until pop-ups multiply into overload and collapse into one shouting lockup. Signature moves: tiled starfield & swirl backgrounds, animated gifs: new!, @, construction, marquee, hit counter, pop-up cascade; transitions: dial-up connect, interlaced GIF load, stepped wheel scroll, pop-up multiplication, window implosion, white flash, starfield warp. In the tradition of GeoCities neighbourhoods (1994–2009) · Space Jam official site (1996) · Olia Lialina & Dragan Espenschied — One Terabyte of Kilobyte Age (2013–) · Internet Archive GifCities (2016) · Netscape Navigator 3 blink & marquee tags. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "WEBCORE / WEB 1.0". Punchy sound design synced to every cut.
```

## 89 · Old-school Screensaver
*Moving Pixels vs. Burn-in · 1983 — 2000s · Digital, Internet & Screen*

Reference film: `videos/screensaver.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Old-school Screensaver** (Moving Pixels vs. Burn-in, 1983 — 2000s; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Static images burned permanently into always-on CRT phosphor, so John Socha published SCRNSAVE for the IBM PC in 1983 to blank the screen. Berkeley Systems’ After Dark (1989) turned the idle screen into entertainment, Windows 3.1 (1992) made Starfield Simulation and Mystify universal, and the OpenGL savers of Windows NT 3.5 (1994) added 3D Pipes. The DVD player’s bouncing idle logo later became a shared ritual of waiting for the perfect corner hit.
- Study these reference works: SCRNSAVE (John Socha, 1983) · After Dark & Flying Toasters (Berkeley Systems, 1989) · Windows 3.1 Starfield Simulation & Mystify (1992) · 3D Pipes, Windows NT 3.5 OpenGL savers (1994) · The Office, “Scott’s Tots” corner hit (NBC, 2009)
- Motion DNA: Endless, unattended motion: constant-velocity bounces, stars streaming from a vanishing point, pipes growing segment by segment until the tube is full — no cuts and no story, only loops waiting for a keypress, until the badge finally kisses the corner.
- Visual DNA: Saturated primaries on pure black: 1-pixel vector lines, flat-shaded OpenGL tubes and an italic wordmark at VGA resolution, seen through the curved glass, scanlines and bloom of a yellowing beige monitor in a dark office.
- Signature transitions: Saver hand-off with mode-switch blackout, screen-fill reset, corner-hit flash, badge homes to centre
- Key techniques: Perspective-divide starfield, Polygon echo trails, Painter-sorted 3D pipe growth, Bounce, recolour & corner hit

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Perspective-divide starfield, Polygon echo trails, Painter-sorted 3D pipe growth, Bounce, recolour & corner hit).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Perspective-divide starfield and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "OLD-SCHOOL SCREENSAVER", held for about 1 s.

BUILD RULES
- Suggested tools: Win32 .scr (C), OpenGL 1.x, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Old-school Screensaver motion-graphics film (Moving Pixels vs. Burn-in). Visual style: saturated primaries on pure black: 1-pixel vector lines, flat-shaded OpenGL tubes and an italic wordmark at VGA resolution, seen through the curved glass, scanlines and bloom of a yellowing beige monitor in a dark office. Motion: endless, unattended motion: constant-velocity bounces, stars streaming from a vanishing point, pipes growing segment by segment until the tube is full — no cuts and no story, only loops waiting for a keypress, until the badge finally kisses the corner. Signature moves: perspective-divide starfield, polygon echo trails, painter-sorted 3d pipe growth, bounce, recolour & corner hit; transitions: saver hand-off with mode-switch blackout, screen-fill reset, corner-hit flash, badge homes to centre. In the tradition of SCRNSAVE (John Socha, 1983) · After Dark & Flying Toasters (Berkeley Systems, 1989) · Windows 3.1 Starfield Simulation & Mystify (1992) · 3D Pipes, Windows NT 3.5 OpenGL savers (1994) · The Office, “Scott’s Tots” corner hit (NBC, 2009). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "OLD-SCHOOL SCREENSAVER". Punchy sound design synced to every cut.
```

## 90 · Databending
*Corrupting the file, not the picture · 2000s — · Digital, Internet & Screen*

Reference film: `videos/databend.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Databending** (Corrupting the file, not the picture, 2000s —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Databending treats an image or video file as raw data and breaks it on purpose: bytes are overwritten in a hex or text editor, the file is opened as audio and run through effects, or a compressed video loses its keyframes so motion from one shot drags the pixels of another (datamoshing). It grew from circuit bending and net art in the early 2000s; Takeshi Murata’s Monster Movie (2005) and Rosa Menkman’s The Collapse of PAL (2010) and Glitch Moment/um (2011) made the compression artefacts themselves the subject, and datamosh reached music videos in the late 2000s.
- Study these reference works: Monster Movie (Takeshi Murata, 2005) · Untitled (Pink Dot) (Takeshi Murata, 2007) · The Collapse of PAL (Rosa Menkman, 2010) · A Vernacular of File Formats (Rosa Menkman, 2010) · Welcome to Heartbreak (Kanye West, dir. Nabil Elderkin, 2009)
- Motion DNA: Damage propagates in the order the decoder reads: a single changed byte slides everything after it, a deleted keyframe lets the next shot’s motion vectors push the last picture around so pixels bloom, smear and swirl in blocks, and the decay only ever moves forward until a clean keyframe resets it.
- Visual DNA: A real, colourful photograph broken along its compression grid: 8×8 blocks out of step with colour casts, stray DCT stripes, decoder grey where data ran out, blocky macroblock trails, banded rows where audio effects shifted bytes, plus the tools themselves — hex dumps, frame-type strips, a waveform.
- Signature transitions: Block-by-block decode, hex edit with decoder sweep, deleted I-frame into P-frame bleed, raw-audio echo, clean I-frame reset, drip
- Key techniques: JPEG block slip & DC shift, I-frame removal datamosh, Raw-audio echo on RGB bytes

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (JPEG block slip & DC shift, I-frame removal datamosh, Raw-audio echo on RGB bytes).
- 5.0–8.0 s  Climax: the most spectacular moment, built on JPEG block slip & DC shift and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DATABENDING", held for about 1 s.

BUILD RULES
- Suggested tools: Hex editor / text editor on JPEG and BMP, Audacity raw import and export, Avidemux / FFmpeg keyframe removal, Canvas 2D (per-block pixel buffers). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Databending motion-graphics film (Corrupting the file, not the picture). Visual style: a real, colourful photograph broken along its compression grid: 8×8 blocks out of step with colour casts, stray DCT stripes, decoder grey where data ran out, blocky macroblock trails, banded rows where audio effects shifted bytes, plus the tools themselves — hex dumps, frame-type strips, a waveform. Motion: damage propagates in the order the decoder reads: a single changed byte slides everything after it, a deleted keyframe lets the next shot’s motion vectors push the last picture around so pixels bloom, smear and swirl in blocks, and the decay only ever moves forward until a clean keyframe resets it. Signature moves: jpeg block slip & dc shift, i-frame removal datamosh, raw-audio echo on rgb bytes; transitions: block-by-block decode, hex edit with decoder sweep, deleted I-frame into P-frame bleed, raw-audio echo, clean I-frame reset, drip. In the tradition of Monster Movie (Takeshi Murata, 2005) · Untitled (Pink Dot) (Takeshi Murata, 2007) · The Collapse of PAL (Rosa Menkman, 2010) · A Vernacular of File Formats (Rosa Menkman, 2010) · Welcome to Heartbreak (Kanye West, dir. Nabil Elderkin, 2009). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DATABENDING". Punchy sound design synced to every cut.
```

## 91 · OS Window Animation
*Genie, Exposé, Snap & Flip · 2001 — 2012 · Digital, Internet & Screen*

Reference film: `videos/oswindow.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **OS Window Animation** (Genie, Exposé, Snap & Flip, 2001 — 2012; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: When GPUs began compositing the desktop, window managers turned every state change into motion: Mac OS X 10.0 (2001) shipped the genie minimise and the magnifying Dock, Exposé tiled every open window in 10.3 Panther (2003) and became Mission Control in 2011, and Windows Vista’s Aero glass (2007) brought Flip 3D, followed by drag-to-edge Aero Snap in Windows 7 (2009). The animations explain where a window went and where it came from, and their curves and timings became the reference vocabulary for UI motion design.
- Study these reference works: Mac OS X 10.0 Aqua, genie effect and Dock magnification (Apple, 2001) · Exposé in Mac OS X 10.3 Panther (2003) · Windows Vista Aero and Flip 3D (Microsoft, 2007) · Windows 7 Aero Snap (2009) · Compiz wobbly windows and desktop cube (2006)
- Motion DNA: Every transition is spatial and causal: windows zoom out of the icon that launched them and pour back into the dock that keeps them, tiles fly apart on a shared ease and return to their stacking order, a window dragged to the edge is offered a translucent half-screen and snaps into it, and a perspective stack rotates its cards one at a time.
- Visual DNA: A polished desktop of the 2000s: gradient wallpaper, translucent menu bar and glass dock with reflective rounded icons, white title bars with three coloured buttons and soft drop shadows, then a blue glass theme with tinted frames, sheen streaks, a glowing taskbar and a red close button.
- Signature transitions: Icon zoom-open, dock bounce, genie minimise, Exposé tile-out and pick, theme cross-fade, drag-to-edge snap with preview, Flip 3D cycle, settle to the front
- Key techniques: Strip-sliced genie warp, Fisheye dock magnification, Sliced perspective Flip 3D

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Strip-sliced genie warp, Fisheye dock magnification, Sliced perspective Flip 3D).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Strip-sliced genie warp and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "OS WINDOW ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Quartz Compositor / Desktop Window Manager on the GPU, Core Animation, Compiz, KWin effects, After Effects UI mock-ups, Canvas 2D (sliced warps of pre-rendered windows). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Homage — generic UI, no logos.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second OS Window Animation motion-graphics film (Genie, Exposé, Snap & Flip). Visual style: a polished desktop of the 2000s: gradient wallpaper, translucent menu bar and glass dock with reflective rounded icons, white title bars with three coloured buttons and soft drop shadows, then a blue glass theme with tinted frames, sheen streaks, a glowing taskbar and a red close button. Motion: every transition is spatial and causal: windows zoom out of the icon that launched them and pour back into the dock that keeps them, tiles fly apart on a shared ease and return to their stacking order, a window dragged to the edge is offered a translucent half-screen and snaps into it, and a perspective stack rotates its cards one at a time. Signature moves: strip-sliced genie warp, fisheye dock magnification, sliced perspective flip 3d; transitions: icon zoom-open, dock bounce, genie minimise, Exposé tile-out and pick, theme cross-fade, drag-to-edge snap with preview, Flip 3D cycle, settle to the front. In the tradition of Mac OS X 10.0 Aqua, genie effect and Dock magnification (Apple, 2001) · Exposé in Mac OS X 10.3 Panther (2003) · Windows Vista Aero and Flip 3D (Microsoft, 2007) · Windows 7 Aero Snap (2009) · Compiz wobbly windows and desktop cube (2006). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "OS WINDOW ANIMATION". Punchy sound design synced to every cut.
```

## 92 · Film Noir
*Light and Shadow · 1941 — · Cinematic & Film Language*

Reference film: `videos/filmnoir.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Film Noir** (Light and Shadow, 1941 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Hollywood crime pictures of the 1940s and 50s, shot by cinematographers such as John Alton and Robert Krasker, borrowed German Expressionist chiaroscuro: hard single-source light, deep shadow and oblique angles. French critic Nino Frank named the cycle "film noir" in 1946, and neo-noir and title designers have quoted its look ever since.
- Study these reference works: The Maltese Falcon (John Huston, 1941) · Double Indemnity (Billy Wilder, 1944) · Murder, My Sweet (Edward Dmytryk, 1944) · The Big Combo (Joseph H. Lewis, 1955) · The Third Man (Carol Reed, 1949) · Touch of Evil (Orson Welles, 1958) · Sin City (Robert Rodriguez, 2005)
- Motion DNA: Slow push-ins on Dutch angles while the light itself moves: a passing car sweeps blind shadows across the room, a door swings open to throw a wedge of light, and a lamp flickers out.
- Visual DNA: Hard chiaroscuro in black and white: venetian-blind slats, silhouettes in doorways, rain lit only inside a lamp cone, wet cobbles, curling smoke, heavy grain and a deco serif title.
- Signature transitions: Hard cut, silhouette wipe (a figure walks into the lens), lamp-out to black, blind-shadow wipe onto the title.
- Key techniques: Light-map compositing: blind patterns multiplied over albedo, Procedural turbulent smoke lit by the slats it crosses, Silhouette shadows cast by affine projection, Film grain, gate flicker, dust and vignette

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Light-map compositing: blind patterns multiplied over albedo, Procedural turbulent smoke lit by the slats it crosses, Silhouette shadows cast by affine projection, Film grain, gate flicker, dust and vignette).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Light-map compositing: blind patterns multiplied over albedo and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FILM NOIR", held for about 1 s.

BUILD RULES
- Suggested tools: Live action, Blender, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Film Noir motion-graphics film (Light and Shadow). Visual style: hard chiaroscuro in black and white: venetian-blind slats, silhouettes in doorways, rain lit only inside a lamp cone, wet cobbles, curling smoke, heavy grain and a deco serif title. Motion: slow push-ins on Dutch angles while the light itself moves: a passing car sweeps blind shadows across the room, a door swings open to throw a wedge of light, and a lamp flickers out. Signature moves: light-map compositing: blind patterns multiplied over albedo, procedural turbulent smoke lit by the slats it crosses, silhouette shadows cast by affine projection, film grain, gate flicker, dust and vignette; transitions: hard cut, silhouette wipe (a figure walks into the lens), lamp-out to black, blind-shadow wipe onto the title. In the tradition of The Maltese Falcon (John Huston, 1941) · Double Indemnity (Billy Wilder, 1944) · Murder, My Sweet (Edward Dmytryk, 1944) · The Big Combo (Joseph H. Lewis, 1955) · The Third Man (Carol Reed, 1949) · Touch of Evil (Orson Welles, 1958) · Sin City (Robert Rodriguez, 2005). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FILM NOIR". Punchy sound design synced to every cut.
```

## 93 · Long Exposure
*Light Trails · 1949 — · Cinematic & Film Language*

Reference film: `videos/longexposure.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Long Exposure** (Light Trails, 1949 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Holding a camera shutter open turns moving light into drawn lines. Gjon Mili made it famous in 1949 when he photographed Pablo Picasso drawing centaurs and bulls in the air with a small flashlight for LIFE magazine, and night-traffic and star-trail photography made the streaking ribbon a fixed image of the modern city.
- Study these reference works: Picasso Draws with Light (Gjon Mili, LIFE, 1949) · Man Ray, Space Writing (1935) · Frank and Lillian Gilbreth, light-motion studies (1914) · Michael Wesely, open-shutter architecture (1997 —) · Lucas Zimmermann, Traffic Lights (2013) · Ken Russell / Koyaanisqatsi freeway time-lapses (Godfrey Reggio, 1982)
- Motion DNA: A locked-off tripod frame where nothing moves but light: the shutter clicks open, ribbons of head- and tail-lights pile up, the stars wheel, a figure signs the air, and the click of the shutter closing freezes it all.
- Visual DNA: Deep blue night lifted by hours of exposure, red and white highway ribbons, concentric star arcs, sodium lamps with diffraction spikes, a ghostly painter and a cyan light-written signature.
- Signature transitions: Mirror-slap blackout, shutter open, accumulation build, shutter close freeze, title written in light.
- Key techniques: Additive persistence computed from t (trail = road covered since shutter open), Perspective road samples with depth-scaled ribbon width, Star arcs around the celestial pole, Halving blur pyramid bloom + 6-blade diffraction stars

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Additive persistence computed from t (trail = road covered since shutter open), Perspective road samples with depth-scaled ribbon width, Star arcs around the celestial pole, Halving blur pyramid bloom + 6-blade diffraction stars).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Additive persistence computed from t (trail = road covered since shutter open) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LONG EXPOSURE", held for about 1 s.

BUILD RULES
- Suggested tools: Camera, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Long Exposure motion-graphics film (Light Trails). Visual style: deep blue night lifted by hours of exposure, red and white highway ribbons, concentric star arcs, sodium lamps with diffraction spikes, a ghostly painter and a cyan light-written signature. Motion: a locked-off tripod frame where nothing moves but light: the shutter clicks open, ribbons of head- and tail-lights pile up, the stars wheel, a figure signs the air, and the click of the shutter closing freezes it all. Signature moves: additive persistence computed from t (trail = road covered since shutter open), perspective road samples with depth-scaled ribbon width, star arcs around the celestial pole, halving blur pyramid bloom + 6-blade diffraction stars; transitions: mirror-slap blackout, shutter open, accumulation build, shutter close freeze, title written in light. In the tradition of Picasso Draws with Light (Gjon Mili, LIFE, 1949) · Man Ray, Space Writing (1935) · Frank and Lillian Gilbreth, light-motion studies (1914) · Michael Wesely, open-shutter architecture (1997 —) · Lucas Zimmermann, Traffic Lights (2013) · Ken Russell / Koyaanisqatsi freeway time-lapses (Godfrey Reggio, 1982). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LONG EXPOSURE". Punchy sound design synced to every cut.
```

## 94 · Double Exposure
*Two Frames, One Image · 1860s — · Cinematic & Film Language*

Reference film: `videos/doubleexposure.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Double Exposure** (Two Frames, One Image, 1860s —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Exposing the same frame twice was first a darkroom accident, then a spirit-photography trick in the 1860s and a staple of silent-film dream sequences. The modern portrait-plus-landscape look, a silhouette filled with forest or city, came through album covers and posters and was fixed in motion by Elastic's 2014 title sequence for True Detective.
- Study these reference works: True Detective season 1 titles (Elastic, Patrick Clair, 2014) · The Man with the Rubber Head (Georges Méliès, 1901) · Vertigo title sequence (Saul Bass, 1958) · Christoffer Relander, We Are Nature (2012) · Dan Mountford, double-exposure portraits (2011) · Andreas Lie, Wilderness portraits (2013)
- Motion DNA: Slow and breathing: a drift through misty pines pulls back to reveal a head, birds burst out past its edge, smoke rolls the forest into a city at dusk, and a heartbeat pulse carries it to a quiet type lockup.
- Visual DNA: A pale paper ground, a profile silhouette filled with layered pines, mountains and towers, desaturated slate and fog tones with a single warm sun set behind the eye, film grain and soft vignette.
- Signature transitions: Pull-back reveal, bird scatter, smoke dissolve between landscapes, smoke-revealed title.
- Key techniques: Screen blend: dark portrait prints the landscape, bright sky stays paper, Parallax landscape layers drawn under a shared camera, fbm noise threshold as a smoke dissolve (with glowing rim), Multiply-blended type revealed through the same smoke

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Screen blend: dark portrait prints the landscape, bright sky stays paper, Parallax landscape layers drawn under a shared camera, fbm noise threshold as a smoke dissolve (with glowing rim), Multiply-blended type revealed through the same smoke).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Screen blend: dark portrait prints the landscape, bright sky stays paper and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DOUBLE EXPOSURE", held for about 1 s.

BUILD RULES
- Suggested tools: Camera, Photoshop, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Double Exposure motion-graphics film (Two Frames, One Image). Visual style: a pale paper ground, a profile silhouette filled with layered pines, mountains and towers, desaturated slate and fog tones with a single warm sun set behind the eye, film grain and soft vignette. Motion: slow and breathing: a drift through misty pines pulls back to reveal a head, birds burst out past its edge, smoke rolls the forest into a city at dusk, and a heartbeat pulse carries it to a quiet type lockup. Signature moves: screen blend: dark portrait prints the landscape, bright sky stays paper, parallax landscape layers drawn under a shared camera, fbm noise threshold as a smoke dissolve (with glowing rim), multiply-blended type revealed through the same smoke; transitions: pull-back reveal, bird scatter, smoke dissolve between landscapes, smoke-revealed title. In the tradition of True Detective season 1 titles (Elastic, Patrick Clair, 2014) · The Man with the Rubber Head (Georges Méliès, 1901) · Vertigo title sequence (Saul Bass, 1958) · Christoffer Relander, We Are Nature (2012) · Dan Mountford, double-exposure portraits (2011) · Andreas Lie, Wilderness portraits (2013). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DOUBLE EXPOSURE". Punchy sound design synced to every cut.
```

## 95 · Tilt-shift Miniature
*Miniature Faking · 2000s — · Cinematic & Film Language*

Reference film: `videos/tiltshift.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Tilt-shift Miniature** (Miniature Faking, 2000s —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Tilting a lens against the film plane (the Scheimpflug principle) lets photographers squeeze the plane of focus into a thin band. Shot from high above, that shallow focus mimics a macro lens over a model, so real cities read as toys; Olivo Barbieri's site specific series and Keith Loutit's stepped time-lapses made it a recognised genre in the 2000s.
- Study these reference works: Olivo Barbieri, site specific_ (2003 —) · Vincent Laforet, Tilt & Shift series (2006) · Keith Loutit, Bathtub series (2008 —) · Sam O'Hare, The Sandpit (2010) · Little Big Berlin (Christopher Häusler, 2012) · Joel Meyerowitz / Ben Thomas, Tiny Tokyo (2011)
- Motion DNA: A high locked-off view where everything below hops along in stepped time-lapse: cars, crowds, a turning ferris wheel and a ferry, while the band of focus racks in and slides across the town to pick out details.
- Visual DNA: Model-railway colours, a thin razor-sharp band through the middle of the frame with heavy graduated blur above and below, crisp miniature shadows, tiny dot people and a warm toy grade.
- Signature transitions: Rack focus in, focus-band slides (up, down, centre), time-lapse acceleration, title set into the focus band.
- Key techniques: True perspective town with painter-sorted boxes, gable roofs and cast shadows, Halving blur pyramid composited by distance from a focus band, Stepped 12 fps motion on a time-lapse clock that races at the climax, Saturated toy palette, tiny people, ferris wheel and harbour

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (True perspective town with painter-sorted boxes, gable roofs and cast shadows, Halving blur pyramid composited by distance from a focus band, Stepped 12 fps motion on a time-lapse clock that races at the climax, Saturated toy palette, tiny people, ferris wheel and harbour).
- 5.0–8.0 s  Climax: the most spectacular moment, built on True perspective town with painter-sorted boxes, gable roofs and cast shadows and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TILT-SHIFT MINIATURE", held for about 1 s.

BUILD RULES
- Suggested tools: Tilt-shift lens, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Tilt-shift Miniature motion-graphics film (Miniature Faking). Visual style: model-railway colours, a thin razor-sharp band through the middle of the frame with heavy graduated blur above and below, crisp miniature shadows, tiny dot people and a warm toy grade. Motion: a high locked-off view where everything below hops along in stepped time-lapse: cars, crowds, a turning ferris wheel and a ferry, while the band of focus racks in and slides across the town to pick out details. Signature moves: true perspective town with painter-sorted boxes, gable roofs and cast shadows, halving blur pyramid composited by distance from a focus band, stepped 12 fps motion on a time-lapse clock that races at the climax, saturated toy palette, tiny people, ferris wheel and harbour; transitions: rack focus in, focus-band slides (up, down, centre), time-lapse acceleration, title set into the focus band. In the tradition of Olivo Barbieri, site specific_ (2003 —) · Vincent Laforet, Tilt & Shift series (2006) · Keith Loutit, Bathtub series (2008 —) · Sam O'Hare, The Sandpit (2010) · Little Big Berlin (Christopher Häusler, 2012) · Joel Meyerowitz / Ben Thomas, Tiny Tokyo (2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TILT-SHIFT MINIATURE". Punchy sound design synced to every cut.
```

## 96 · Time-lapse
*Hours in Seconds · 1982 — · Cinematic & Film Language*

Reference film: `videos/timelapse.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Time-lapse** (Hours in Seconds, 1982 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Time-lapse began as a science tool, but Ron Fricke's cinematography for Godfrey Reggio's Koyaanisqatsi (1982) made it a film language of its own: an intervalometer exposes one frame every few seconds or minutes, often on a motion-control dolly, so clouds race, shadows sweep and a city's day plays out in seconds over a Philip Glass score. Fricke's Baraka (1992) and the BBC's Planet Earth (2006) carried the grammar to a global audience.
- Study these reference works: Koyaanisqatsi (Godfrey Reggio, cinematography Ron Fricke, 1982) · Powaqqatsi (Godfrey Reggio, 1988) · Chronos (Ron Fricke, 1985) · Baraka (Ron Fricke, 1992) · Samsara (Ron Fricke, 2011) · Planet Earth (BBC, 2006)
- Motion DNA: A locked-off frame on a slow motion-control slide while time itself accelerates: clouds stream and boil, shadows wheel across the desert floor, lights blink on window by window and the sky rotates.
- Visual DNA: Monument Valley buttes and a desert town under a sky that cycles from hard noon blue through golden hour, magenta afterglow and blue hour to a black field of star trails and a rose dawn.
- Signature transitions: None inside the shot: time is the transition; day-to-night "holy grail" exposure ramp, dawn swell into the title.
- Key techniques: Monotone-cubic hour curve: real-time open that ramps into 17 hours without stalls, Sky gradient model driven by solar elevation, with afterglow, Butte shadows projected along the sun vector; racing cloud shadows, Star trails as accumulated arcs around the pole; window-by-window town lights, Quarter-res blurred cloud layer, long-exposure headlight trails

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Monotone-cubic hour curve: real-time open that ramps into 17 hours without stalls, Sky gradient model driven by solar elevation, with afterglow, Butte shadows projected along the sun vector; racing cloud shadows, Star trails as accumulated arcs around the pole; window-by-window town lights, Quarter-res blurred cloud layer, long-exposure headlight trails).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Monotone-cubic hour curve: real-time open that ramps into 17 hours without stalls and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TIME-LAPSE", held for about 1 s.

BUILD RULES
- Suggested tools: Camera + intervalometer, Motion-control slider, LRTimelapse / After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Time-lapse motion-graphics film (Hours in Seconds). Visual style: monument Valley buttes and a desert town under a sky that cycles from hard noon blue through golden hour, magenta afterglow and blue hour to a black field of star trails and a rose dawn. Motion: a locked-off frame on a slow motion-control slide while time itself accelerates: clouds stream and boil, shadows wheel across the desert floor, lights blink on window by window and the sky rotates. Signature moves: monotone-cubic hour curve: real-time open that ramps into 17 hours without stalls, sky gradient model driven by solar elevation, with afterglow, butte shadows projected along the sun vector; racing cloud shadows, star trails as accumulated arcs around the pole; window-by-window town lights, quarter-res blurred cloud layer, long-exposure headlight trails; transitions: none inside the shot: time is the transition; day-to-night "holy grail" exposure ramp, dawn swell into the title. In the tradition of Koyaanisqatsi (Godfrey Reggio, cinematography Ron Fricke, 1982) · Powaqqatsi (Godfrey Reggio, 1988) · Chronos (Ron Fricke, 1985) · Baraka (Ron Fricke, 1992) · Samsara (Ron Fricke, 2011) · Planet Earth (BBC, 2006). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TIME-LAPSE". Punchy sound design synced to every cut.
```

## 97 · Match-cut Montage
*The Shape Holds, the World Changes · 1968 — · Cinematic & Film Language*

Reference film: `videos/matchcut.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Match-cut Montage** (The Shape Holds, the World Changes, 1968 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A graphic match cut joins two shots through a shared shape, position or movement so the eye glides across the edit. Kubrick's bone-to-satellite cut in 2001: A Space Odyssey (1968) and David Lean's match from a blown-out match flame to a desert sunrise in Lawrence of Arabia (1962) made it famous; Edgar Wright and countless title sequences turned it into rapid rhythmic montage.
- Study these reference works: Lawrence of Arabia (David Lean, 1962) · 2001: A Space Odyssey (Stanley Kubrick, 1968) · Psycho (Alfred Hitchcock, 1960; drain to eye) · Requiem for a Dream (Darren Aronofsky, 2000) · Shaun of the Dead (Edgar Wright, 2004) · Hot Fuzz (Edgar Wright, 2007)
- Motion DNA: Hard cuts on the beat while one shape stays nailed to the frame: rotation carries through iris, planet, coffee swirl, record and wheel; a station clock snaps to noon and pushes in until its hands become a pen, a tower and a rising rocket.
- Visual DNA: Every shot a different world and palette (macro skin and iris, deep space, a mint terrazzo café table, walnut hi-fi, a magenta street, a Lean-red desert, a station clock) unified by one locked circle and one locked line inside a 2.39 letterbox.
- Signature transitions: Graphic match cuts, motion match cuts, a stutter flurry of quarter-beat cuts, a push-in that converts circle to line, trail-to-lockup.
- Key techniques: Every shot drawn round one shared circle (R) or vertical bar (L), Slow push held across cuts so the shape never jumps, Clock-hand zoom that converts the circle chain into the line chain, Hairline match guide and flash on each cut, Letterbox edit readout: shot, timecode, cut ticks

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Every shot drawn round one shared circle (R) or vertical bar (L), Slow push held across cuts so the shape never jumps, Clock-hand zoom that converts the circle chain into the line chain, Hairline match guide and flash on each cut, Letterbox edit readout: shot, timecode, cut ticks).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Every shot drawn round one shared circle (R) or vertical bar (L) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MATCH-CUT MONTAGE", held for about 1 s.

BUILD RULES
- Suggested tools: Live action + editorial, After Effects / Premiere, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Match-cut Montage motion-graphics film (The Shape Holds, the World Changes). Visual style: every shot a different world and palette (macro skin and iris, deep space, a mint terrazzo café table, walnut hi-fi, a magenta street, a Lean-red desert, a station clock) unified by one locked circle and one locked line inside a 2.39 letterbox. Motion: hard cuts on the beat while one shape stays nailed to the frame: rotation carries through iris, planet, coffee swirl, record and wheel; a station clock snaps to noon and pushes in until its hands become a pen, a tower and a rising rocket. Signature moves: every shot drawn round one shared circle (r) or vertical bar (l), slow push held across cuts so the shape never jumps, clock-hand zoom that converts the circle chain into the line chain, hairline match guide and flash on each cut, letterbox edit readout: shot, timecode, cut ticks; transitions: graphic match cuts, motion match cuts, a stutter flurry of quarter-beat cuts, a push-in that converts circle to line, trail-to-lockup. In the tradition of Lawrence of Arabia (David Lean, 1962) · 2001: A Space Odyssey (Stanley Kubrick, 1968) · Psycho (Alfred Hitchcock, 1960; drain to eye) · Requiem for a Dream (Darren Aronofsky, 2000) · Shaun of the Dead (Edgar Wright, 2004) · Hot Fuzz (Edgar Wright, 2007). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MATCH-CUT MONTAGE". Punchy sound design synced to every cut.
```

## 98 · Split-screen Cinema
*Everything at Once · 1968 — · Cinematic & Film Language*

Reference film: `videos/splitscreen.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Split-screen Cinema** (Everything at Once, 1968 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Split screen divides one frame into simultaneous shots. Abel Gance used multi-screen in Napoléon (1927); designer-director Pablo Ferro's multi-panel montages for Norman Jewison's The Thomas Crown Affair (1968) made it a thriller grammar, Brian De Palma used it for suspense, the TV series 24 (2001) built its clock-driven identity on it, and Mike Figgis's Timecode (2000) told a whole film in four continuous quadrants.
- Study these reference works: The Thomas Crown Affair (Norman Jewison, montage by Pablo Ferro, 1968) · Grand Prix (John Frankenheimer, titles by Saul Bass, 1966) · Carrie (Brian De Palma, 1976) · Timecode (Mike Figgis, 2000) · 24 (Fox, 2001–2010) · (500) Days of Summer (Marc Webb, 2009)
- Motion DNA: The frame divides on the beat — 1, 2, 4, 9, 16 — with panels sliding and resizing like a tightening vice; every panel ticks to the same countdown until all converge on one shot and merge into a single full frame at zero.
- Visual DNA: Black gutters that flash red, a red telephone, a station clock, rain-wet streets, headlights, a CCTV feed, LED digits, a vault dial and a lit phone booth: noir teal and amber with signal-red accents, panel labels in mono.
- Signature transitions: Split, slide, resize, squeeze-to-hero, merge-to-full-frame white-out, title split by a sliding gutter.
- Key techniques: Grid as per-row column boundaries: panels split, slide and resize by interpolating edges, Sixteen procedural shots in a cover-fit virtual frame, All shots slaved to one countdown clock, Red gutter flash and slam on each split; staggered row slides, Squeeze-to-hero merge into one full frame at zero

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Grid as per-row column boundaries: panels split, slide and resize by interpolating edges, Sixteen procedural shots in a cover-fit virtual frame, All shots slaved to one countdown clock, Red gutter flash and slam on each split; staggered row slides, Squeeze-to-hero merge into one full frame at zero).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Grid as per-row column boundaries: panels split, slide and resize by interpolating edges and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SPLIT-SCREEN CINEMA", held for about 1 s.

BUILD RULES
- Suggested tools: Optical printer / multi-camera, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Split-screen Cinema motion-graphics film (Everything at Once). Visual style: black gutters that flash red, a red telephone, a station clock, rain-wet streets, headlights, a CCTV feed, LED digits, a vault dial and a lit phone booth: noir teal and amber with signal-red accents, panel labels in mono. Motion: the frame divides on the beat — 1, 2, 4, 9, 16 — with panels sliding and resizing like a tightening vice; every panel ticks to the same countdown until all converge on one shot and merge into a single full frame at zero. Signature moves: grid as per-row column boundaries: panels split, slide and resize by interpolating edges, sixteen procedural shots in a cover-fit virtual frame, all shots slaved to one countdown clock, red gutter flash and slam on each split; staggered row slides, squeeze-to-hero merge into one full frame at zero; transitions: split, slide, resize, squeeze-to-hero, merge-to-full-frame white-out, title split by a sliding gutter. In the tradition of The Thomas Crown Affair (Norman Jewison, montage by Pablo Ferro, 1968) · Grand Prix (John Frankenheimer, titles by Saul Bass, 1966) · Carrie (Brian De Palma, 1976) · Timecode (Mike Figgis, 2000) · 24 (Fox, 2001–2010) · (500) Days of Summer (Marc Webb, 2009). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SPLIT-SCREEN CINEMA". Punchy sound design synced to every cut.
```

## 99 · One-shot Camera Motion
*The Unbroken Take · 1958 — · Cinematic & Film Language*

Reference film: `videos/oneshot.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **One-shot Camera Motion** (The Unbroken Take, 1958 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A whole scene played as one continuous shot, with the camera craning, tracking and threading through doorways instead of cutting. Orson Welles opened Touch of Evil (1958) with a three-minute crane shot; the Steadicam (Garrett Brown, 1975) made Martin Scorsese's Copacabana walk in Goodfellas (1990) possible, and digital stitching let Alfonso Cuarón, Alejandro G. Iñárritu and Sam Mendes extend the illusion to whole sequences and films.
- Study these reference works: Touch of Evil (Orson Welles, 1958) · Goodfellas — Copacabana shot (Martin Scorsese, DP Michael Ballhaus, 1990) · Children of Men (Alfonso Cuarón, DP Emmanuel Lubezki, 2006) · Birdman (Alejandro G. Iñárritu, 2014) · 1917 (Sam Mendes, DP Roger Deakins, 2019)
- Motion DNA: One spline-smooth camera that never cuts: it cranes down, falls in behind its subjects, turns corners with them, floats through a tight kitchen aisle and finally rises and settles as the action resolves in front of it.
- Visual DNA: Anamorphic 2.39:1 frame, deep staging in real perspective, each room with its own light — sodium street, red corridor, green fluorescent kitchen, warm club — and the timecode running without a break.
- Signature transitions: None — doorways, a swinging door and the crane move do the work of cuts
- Key techniques: Crane-to-Steadicam move, Choreographed blocking ahead of camera, Doorway & window passes (hidden stitches), Continuous timecode, zero cuts

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Crane-to-Steadicam move, Choreographed blocking ahead of camera, Doorway & window passes (hidden stitches), Continuous timecode, zero cuts).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Crane-to-Steadicam move and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ONE-SHOT CAMERA MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Steadicam / crane / gimbal, Previs in Unreal or Blender, Canvas 2D (portal-ordered 3D projection). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural (needs choreography and rehearsal in live action).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second One-shot Camera Motion motion-graphics film (The Unbroken Take). Visual style: anamorphic 2.39:1 frame, deep staging in real perspective, each room with its own light — sodium street, red corridor, green fluorescent kitchen, warm club — and the timecode running without a break. Motion: one spline-smooth camera that never cuts: it cranes down, falls in behind its subjects, turns corners with them, floats through a tight kitchen aisle and finally rises and settles as the action resolves in front of it. Signature moves: crane-to-steadicam move, choreographed blocking ahead of camera, doorway & window passes (hidden stitches), continuous timecode, zero cuts; transitions: none — doorways, a swinging door and the crane move do the work of cuts. In the tradition of Touch of Evil (Orson Welles, 1958) · Goodfellas — Copacabana shot (Martin Scorsese, DP Michael Ballhaus, 1990) · Children of Men (Alfonso Cuarón, DP Emmanuel Lubezki, 2006) · Birdman (Alejandro G. Iñárritu, 2014) · 1917 (Sam Mendes, DP Roger Deakins, 2019). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ONE-SHOT CAMERA MOTION". Punchy sound design synced to every cut.
```

## 100 · Hyperlapse
*Moving Time-lapse · 2011 — · Cinematic & Film Language*

Reference film: `videos/hyperlapse.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Hyperlapse** (Moving Time-lapse, 2011 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A time-lapse in which the camera itself travels: one still is shot every few steps or metres, each aligned to a fixed point, then stabilised and played at video speed so the camera glides over distances while hours pass. Ron Fricke's motion-controlled driving shots for Koyaanisqatsi (1982) were early ancestors; Geoff Tompkinson, Shahab Gabriel and Rob Whitworth popularised hand-moved city hyperlapses with whip-pan "flow" transitions in the early 2010s, and Instagram's Hyperlapse app and Microsoft Research's Hyperlapse (both 2014) turned it into a phone feature.
- Study these reference works: Koyaanisqatsi (Godfrey Reggio, cinematography Ron Fricke, 1982) · Geoff Tompkinson's city hyperlapses (2012 —) · Barcelona GO! (Rob Whitworth, 2013) · Instagram Hyperlapse app (2014) · Microsoft Research Hyperlapse (Kopf, Cohen & Szeliski, SIGGRAPH 2014)
- Motion DNA: A steady, gliding forward push that never bobs, while everything else is fast-forwarded: clouds race out of the vanishing point, shadows sweep the street, traffic becomes streaks; whip pans snap between locations and the final push eases to a stop as the city keeps rushing.
- Visual DNA: Strict one-point perspective down an avenue and across a suspension bridge, the sky sliding from afternoon blue through a sunset into blue hour and night, windows switching on, ghosted pedestrians, red and white light ribbons, neon on wet asphalt and a faint frame-to-frame exposure shimmer.
- Signature transitions: Whip pans (motion-blurred swish) between locations, time jumping with each one
- Key techniques: One still every few metres, aligned to a fixed point, Warp stabilisation & deflicker, Whip-pan transitions between locations, Light trails from long-interval traffic

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (One still every few metres, aligned to a fixed point, Warp stabilisation & deflicker, Whip-pan transitions between locations, Light trails from long-interval traffic).
- 5.0–8.0 s  Climax: the most spectacular moment, built on One still every few metres, aligned to a fixed point and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "HYPERLAPSE", held for about 1 s.

BUILD RULES
- Suggested tools: DSLR on a tripod moved by hand, every few metres, After Effects Warp Stabilizer / LRTimelapse deflicker, Canvas 2D (one-point projection, procedural city). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Hyperlapse motion-graphics film (Moving Time-lapse). Visual style: strict one-point perspective down an avenue and across a suspension bridge, the sky sliding from afternoon blue through a sunset into blue hour and night, windows switching on, ghosted pedestrians, red and white light ribbons, neon on wet asphalt and a faint frame-to-frame exposure shimmer. Motion: a steady, gliding forward push that never bobs, while everything else is fast-forwarded: clouds race out of the vanishing point, shadows sweep the street, traffic becomes streaks; whip pans snap between locations and the final push eases to a stop as the city keeps rushing. Signature moves: one still every few metres, aligned to a fixed point, warp stabilisation & deflicker, whip-pan transitions between locations, light trails from long-interval traffic; transitions: whip pans (motion-blurred swish) between locations, time jumping with each one. In the tradition of Koyaanisqatsi (Godfrey Reggio, cinematography Ron Fricke, 1982) · Geoff Tompkinson's city hyperlapses (2012 —) · Barcelona GO! (Rob Whitworth, 2013) · Instagram Hyperlapse app (2014) · Microsoft Research Hyperlapse (Kopf, Cohen & Szeliski, SIGGRAPH 2014). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "HYPERLAPSE". Punchy sound design synced to every cut.
```

## 101 · High Contrast Cinema
*Black, White & One Spot Colour · 1980 — · Cinematic & Film Language*

Reference film: `videos/highcontrast.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **High Contrast Cinema** (Black, White & One Spot Colour, 1980 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Black-and-white pushed until the greys disappear: blacks crushed solid, highlights blown out, the image reduced to ink and paper, often with a single colour left alive in the frame. Martin Scorsese shot Raging Bull (1980) in stark monochrome, Steven Spielberg let one girl's red coat burn through Schindler's List (1993), Robert Rodriguez and Frank Miller turned Miller's comics into Sin City (2005) with digital keying and selective colour, and George Miller re-graded Mad Max: Fury Road as the Black & Chrome Edition (2016).
- Study these reference works: Raging Bull (Martin Scorsese, 1980) · Rumble Fish (Francis Ford Coppola, 1983) · Schindler's List (Steven Spielberg, 1993) · Sin City (Robert Rodriguez & Frank Miller, 2005) · The Spirit (Frank Miller, 2008) · Mad Max: Fury Road — Black & Chrome (George Miller, 2016)
- Motion DNA: Slow, deliberate push-ins and hard cuts like turning a page: a walk into a cone of light, a profile that barely turns, an overhead crowd flowing against one figure, and a single lightning beat that flips the sky before the title holds.
- Visual DNA: Pure black and pure white graphic shapes — lamp cones, window grids, a face carved by its shadow side, white-outlined silhouettes, slanting white rain and wet-street reflections — with one saturated red that stays in colour through every shot, plus comic-style narration boxes.
- Signature transitions: Hard cuts, a lightning flash, caption boxes
- Key techniques: Crushed blacks & clipped whites (no midtones), Selective colour — one hue spared, Inked rim outlines & silhouettes, Rain as white streaks (difference blend)

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Crushed blacks & clipped whites (no midtones), Selective colour — one hue spared, Inked rim outlines & silhouettes, Rain as white streaks (difference blend)).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Crushed blacks & clipped whites (no midtones) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "HIGH CONTRAST CINEMA", held for about 1 s.

BUILD RULES
- Suggested tools: Green-screen + digital backlot (Sin City), Power-window selective colour in DaVinci Resolve, Canvas 2D (two-tone vector, difference-blend rain). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second High Contrast Cinema motion-graphics film (Black, White & One Spot Colour). Visual style: pure black and pure white graphic shapes — lamp cones, window grids, a face carved by its shadow side, white-outlined silhouettes, slanting white rain and wet-street reflections — with one saturated red that stays in colour through every shot, plus comic-style narration boxes. Motion: slow, deliberate push-ins and hard cuts like turning a page: a walk into a cone of light, a profile that barely turns, an overhead crowd flowing against one figure, and a single lightning beat that flips the sky before the title holds. Signature moves: crushed blacks & clipped whites (no midtones), selective colour — one hue spared, inked rim outlines & silhouettes, rain as white streaks (difference blend); transitions: hard cuts, a lightning flash, caption boxes. In the tradition of Raging Bull (Martin Scorsese, 1980) · Rumble Fish (Francis Ford Coppola, 1983) · Schindler's List (Steven Spielberg, 1993) · Sin City (Robert Rodriguez & Frank Miller, 2005) · The Spirit (Frank Miller, 2008) · Mad Max: Fury Road — Black & Chrome (George Miller, 2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "HIGH CONTRAST CINEMA". Punchy sound design synced to every cut.
```

## 102 · FUI
*Fantasy User Interface · 2008 — · Cinematic & Film Language*

Reference film: `videos/hud.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **FUI** (Fantasy User Interface, 2008 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Screen graphics designed for sci-fi films: interfaces that do not exist but look like they should.
- Study these reference works: Iron Man (2008) · The Martian (2015) · Blade Runner 2049 (2017)
- Motion DNA: Many small systems tick at different rates; everything converges on a single lock event.
- Visual DNA: Cyan and amber hairlines on near-black, glow, monospaced labels.
- Signature transitions: Boot-up, alert recolour, lock flash
- Key techniques: Segmented rings, Text decode, Target lock

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Segmented rings, Text decode, Target lock).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Segmented rings and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FUI", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Unreal. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second FUI motion-graphics film (Fantasy User Interface). Visual style: cyan and amber hairlines on near-black, glow, monospaced labels. Motion: many small systems tick at different rates; everything converges on a single lock event. Signature moves: segmented rings, text decode, target lock; transitions: boot-up, alert recolour, lock flash. In the tradition of Iron Man (2008) · The Martian (2015) · Blade Runner 2049 (2017). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FUI". Punchy sound design synced to every cut.
```

## 103 · Cyberpunk Neon
*Rain, Neon, Kanji · 1982 — · Cinematic & Film Language*

Reference film: `videos/cyberpunk.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cyberpunk Neon** (Rain, Neon, Kanji, 1982 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: From Blade Runner to Cyberpunk 2077, rain-soaked neon cities. Hugely popular in Chinese "cyber-Chongqing" edits.
- Study these reference works: Blade Runner (1982) · Ghost in the Shell (1995) · Cyberpunk 2077 (2020)
- Motion DNA: Slow push through layered parallax while signs stutter on and rain falls.
- Visual DNA: Magenta and cyan neon, Chinese signage, puddle reflections, haze.
- Signature transitions: Blackout then neon ignition
- Key techniques: Neon flicker, Wet reflections, Parallax city

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Neon flicker, Wet reflections, Parallax city).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Neon flicker and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CYBERPUNK NEON", held for about 1 s.

BUILD RULES
- Suggested tools: Unreal, Blender, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cyberpunk Neon motion-graphics film (Rain, Neon, Kanji). Visual style: magenta and cyan neon, Chinese signage, puddle reflections, haze. Motion: slow push through layered parallax while signs stutter on and rain falls. Signature moves: neon flicker, wet reflections, parallax city; transitions: blackout then neon ignition. In the tradition of Blade Runner (1982) · Ghost in the Shell (1995) · Cyberpunk 2077 (2020). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CYBERPUNK NEON". Punchy sound design synced to every cut.
```

## 104 · Surreal Cinema
*Dream logic on film · 1928 — · Cinematic & Film Language*

Reference film: `videos/surreal.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Surreal Cinema** (Dream logic on film, 1928 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Surrealist film cuts the way a dream does: rooms open onto impossible places, objects turn into other objects and the intertitles lie about time. Luis Buñuel and Salvador Dalí’s Un Chien Andalou (1929) set the grammar, Maya Deren’s Meshes of the Afternoon (1943) looped a dreamer through her own house, Jan Švankmajer animated objects into uncanny life, and David Lynch carried the mode into curtained rooms with zigzag floors.
- Study these reference works: Un Chien Andalou (Luis Buñuel & Salvador Dalí, 1929) · L’Âge d’Or (Buñuel, 1930) · Meshes of the Afternoon (Maya Deren & Alexander Hammid, 1943) · Spellbound, dream sequence designed by Dalí (Alfred Hitchcock, 1945) · Dimensions of Dialogue (Jan Švankmajer, 1982) · Alice (Švankmajer, 1988) · Twin Peaks (David Lynch & Mark Frost, 1990) · Mulholland Drive (Lynch, 2001)
- Motion DNA: A slow camera that never stops: an even dolly that is suddenly pulled through a door, a tilt from cloud down to sand, a fall into an eye. Things move with dream patience — a key floating, men rising like balloons, a clock sagging — and one object turns into another in stepped stop-motion jumps.
- Visual DNA: Red pleated curtains over a black-and-white zigzag floor, a hooded figure with a mirror for a face, Magritte’s blue sky and sculpted clouds (an eye whose iris is sky, bowler-hatted men, a bird cut from sky, a night street under a noon sky), Dalí’s ochre plain, cliffs and melting clock, soft grain and lying intertitles.
- Signature transitions: Door as portal, tilt reveal, match on object (key becomes bird), a blink, zoom into the pupil as it turns into a keyhole
- Key techniques: Door-as-portal dolly, Stop-motion object morph, Zoom through a pupil

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Door-as-portal dolly, Stop-motion object morph, Zoom through a pupil).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Door-as-portal dolly and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SURREAL CINEMA", held for about 1 s.

BUILD RULES
- Suggested tools: 35mm camera, built sets and in-camera tricks, Stop-motion animation, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural homage.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Surreal Cinema motion-graphics film (Dream logic on film). Visual style: red pleated curtains over a black-and-white zigzag floor, a hooded figure with a mirror for a face, Magritte’s blue sky and sculpted clouds (an eye whose iris is sky, bowler-hatted men, a bird cut from sky, a night street under a noon sky), Dalí’s ochre plain, cliffs and melting clock, soft grain and lying intertitles. Motion: a slow camera that never stops: an even dolly that is suddenly pulled through a door, a tilt from cloud down to sand, a fall into an eye. Things move with dream patience — a key floating, men rising like balloons, a clock sagging — and one object turns into another in stepped stop-motion jumps. Signature moves: door-as-portal dolly, stop-motion object morph, zoom through a pupil; transitions: door as portal, tilt reveal, match on object (key becomes bird), a blink, zoom into the pupil as it turns into a keyhole. In the tradition of Un Chien Andalou (Luis Buñuel & Salvador Dalí, 1929) · L’Âge d’Or (Buñuel, 1930) · Meshes of the Afternoon (Maya Deren & Alexander Hammid, 1943) · Spellbound, dream sequence designed by Dalí (Alfred Hitchcock, 1945) · Dimensions of Dialogue (Jan Švankmajer, 1982) · Alice (Švankmajer, 1988) · Twin Peaks (David Lynch & Mark Frost, 1990) · Mulholland Drive (Lynch, 2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SURREAL CINEMA". Punchy sound design synced to every cut.
```

## 105 · Found Footage
*Archival collage cinema · 1958 — · Cinematic & Film Language*

Reference film: `videos/foundfootage.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Found Footage** (Archival collage cinema, 1958 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Found-footage film makes new cinema out of other people’s film: newsreels, home movies, educational reels and leader are cut together until their juxtaposition says something none of them meant. Bruce Conner’s A Movie (1958) set the form with mismatched stock shots and a premature THE END; Craig Baldwin’s Tribulation 99 (1991) built a mock conspiracy history from stock footage, and Christian Marclay’s The Clock (2010) assembled a 24-hour film from clock shots synchronised to real time.
- Study these reference works: Rose Hobart (Joseph Cornell, 1936) · A Movie (Bruce Conner, 1958) · Report (Bruce Conner, 1967) · Tribulation 99: Alien Anomalies Under America (Craig Baldwin, 1991) · Decasia (Bill Morrison, 2002) · The Clock (Christian Marclay, 2010)
- Motion DNA: Rhythm comes from the cut, not the camera: shots of 0.2–0.9 s from unrelated sources, eyeline and graphic matches that invent cause and effect, a cutting rate that accelerates toward noon, and the strip itself moving — gate weave, 18 fps home-movie judder against 24 fps newsreel, splice frames rolling the frame line through the gate.
- Visual DNA: An overscanned 16mm strip with perforations, frame lines, edge print and optical soundtrack in view; every shot a different stock — high-contrast newsreel, amber and blue tints, saturated home-movie colour, a soft dupe, grey academy leader; scratches, dust and hairs; typewritten captions that re-narrate the footage; trims hanging at the sides.
- Signature transitions: Hard cuts on tape splices with a frame-line roll, leader countdown, a false THE END, eyeline matches, clocks agreeing across cuts, title printed over the last shot
- Key techniques: Collage cutting across stocks, Overscan: perfs, edges, splices, Clocks synced to film time

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Collage cutting across stocks, Overscan: perfs, edges, splices, Clocks synced to film time).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Collage cutting across stocks and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FOUND FOOTAGE", held for about 1 s.

BUILD RULES
- Suggested tools: 16mm flatbed / optical printer, Archive scans with overscan, Canvas 2D (every “archival” shot procedurally drawn). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (no archival material used).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Found Footage motion-graphics film (Archival collage cinema). Visual style: an overscanned 16mm strip with perforations, frame lines, edge print and optical soundtrack in view; every shot a different stock — high-contrast newsreel, amber and blue tints, saturated home-movie colour, a soft dupe, grey academy leader; scratches, dust and hairs; typewritten captions that re-narrate the footage; trims hanging at the sides. Motion: rhythm comes from the cut, not the camera: shots of 0.2–0.9 s from unrelated sources, eyeline and graphic matches that invent cause and effect, a cutting rate that accelerates toward noon, and the strip itself moving — gate weave, 18 fps home-movie judder against 24 fps newsreel, splice frames rolling the frame line through the gate. Signature moves: collage cutting across stocks, overscan: perfs, edges, splices, clocks synced to film time; transitions: hard cuts on tape splices with a frame-line roll, leader countdown, a false THE END, eyeline matches, clocks agreeing across cuts, title printed over the last shot. In the tradition of Rose Hobart (Joseph Cornell, 1936) · A Movie (Bruce Conner, 1958) · Report (Bruce Conner, 1967) · Tribulation 99: Alien Anomalies Under America (Craig Baldwin, 1991) · Decasia (Bill Morrison, 2002) · The Clock (Christian Marclay, 2010). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FOUND FOOTAGE". Punchy sound design synced to every cut.
```

## 106 · Ukiyo-e Motion
*Woodblock Prints · 1670s — · Cultural & Regional*

Reference film: `videos/ukiyoe.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Ukiyo-e Motion** (Woodblock Prints, 1670s —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Edo-period Japan’s “pictures of the floating world”: a keyblock of black outlines is carved, then one block per colour is inked and rubbed onto damp washi with a baren, so every print is a stack of flat, registered colour layers. Hokusai and Hiroshige made imported Prussian blue and the graded bokashi wipe the look of the 1830s landscape print.
- Study these reference works: Under the Wave off Kanagawa (Hokusai, c.1831) · Thirty-six Views of Mount Fuji (Hokusai, 1830–32) · Sudden Shower over Shin-Ōhashi Bridge and Atake (Hiroshige, 1857) · One Hundred Famous Views of Edo (Hiroshige, 1856–58)
- Motion DNA: The image is pulled block by block like a real print, then moves only in held, graphic poses: the wave curls into its claw-foam peak, boats rock, Hiroshige rain slashes across and the seal lands.
- Visual DNA: Flat registered colour inside confident black keyblock lines, Prussian blue graded into bare paper, with woodgrain and fibre showing through the ink.
- Signature transitions: Block-by-block print pull, registration settle, rain veil, seal stamp
- Key techniques: Keyblock + colour-block layers, Prussian-blue bokashi, Woodgrain & washi texture

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Keyblock + colour-block layers, Prussian-blue bokashi, Woodgrain & washi texture).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Keyblock + colour-block layers and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "UKIYO-E MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Procreate. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Ukiyo-e Motion motion-graphics film (Woodblock Prints). Visual style: flat registered colour inside confident black keyblock lines, Prussian blue graded into bare paper, with woodgrain and fibre showing through the ink. Motion: the image is pulled block by block like a real print, then moves only in held, graphic poses: the wave curls into its claw-foam peak, boats rock, Hiroshige rain slashes across and the seal lands. Signature moves: keyblock + colour-block layers, prussian-blue bokashi, woodgrain & washi texture; transitions: block-by-block print pull, registration settle, rain veil, seal stamp. In the tradition of Under the Wave off Kanagawa (Hokusai, c.1831) · Thirty-six Views of Mount Fuji (Hokusai, 1830–32) · Sudden Shower over Shin-Ōhashi Bridge and Atake (Hiroshige, 1857) · One Hundred Famous Views of Edo (Hiroshige, 1856–58). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "UKIYO-E MOTION". Punchy sound design synced to every cut.
```

## 107 · Ink Wash 水墨
*Shan Shui Animation · 1960 — · Cultural & Regional*

Reference film: `videos/inkwash.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Ink Wash 水墨** (Shan Shui Animation, 1960 —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Chinese shan shui (“mountain-water”) painting builds a landscape from graded ink on absorbent xuan paper, leaving empty paper as mist and water. In 1960 the Shanghai Animation Film Studio found a way to animate it, layering ink-wash cels so tadpoles, fish and mountains bleed and breathe on screen.
- Study these reference works: Travellers among Mountains and Streams (Fan Kuan, c.1000) · Where Is Mama (Shanghai Animation Film Studio, 1960) · The Cowherd’s Flute (Te Wei, 1963) · Feelings of Mountains and Waters (Te Wei, 1988)
- Motion DNA: Slow and breathing: ink blooms and settles, tadpoles flick, and the landscape condenses out of mist as the camera drifts back; nothing cuts.
- Visual DNA: Monochrome ink from charcoal to the palest grey, soft bleeding edges on fibrous paper, half the frame left empty, with one red seal.
- Signature transitions: Ink bloom, mist dissolve, pull-back reveal, brush-written inscription
- Key techniques: Wet-paper ink bleed, Graded ink & dry-brush cun, Negative space as mist

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Wet-paper ink bleed, Graded ink & dry-brush cun, Negative space as mist).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Wet-paper ink bleed and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "INK WASH 水墨", held for about 1 s.

BUILD RULES
- Suggested tools: Layered ink-wash cels, Canvas 2D, TVPaint / After Effects. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Ink Wash 水墨 motion-graphics film (Shan Shui Animation). Visual style: monochrome ink from charcoal to the palest grey, soft bleeding edges on fibrous paper, half the frame left empty, with one red seal. Motion: slow and breathing: ink blooms and settles, tadpoles flick, and the landscape condenses out of mist as the camera drifts back; nothing cuts. Signature moves: wet-paper ink bleed, graded ink & dry-brush cun, negative space as mist; transitions: ink bloom, mist dissolve, pull-back reveal, brush-written inscription. In the tradition of Travellers among Mountains and Streams (Fan Kuan, c.1000) · Where Is Mama (Shanghai Animation Film Studio, 1960) · The Cowherd’s Flute (Te Wei, 1963) · Feelings of Mountains and Waters (Te Wei, 1988). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "INK WASH 水墨". Punchy sound design synced to every cut.
```

## 108 · Shadow Puppetry
*Piying 皮影戏 · Han dynasty — · Cultural & Regional*

Reference film: `videos/shadowpuppet.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Shadow Puppetry** (Piying 皮影戏, Han dynasty —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Chinese shadow play presses jointed puppets of scraped, dyed and hollow-carved donkey or cow hide against a backlit cloth screen, worked on rods while a band of suona, banhu, gongs and cymbals plays. Shaanxi and Tangshan are its best-known schools, and it was inscribed on UNESCO’s Intangible Cultural Heritage list in 2011.
- Study these reference works: To Live (Zhang Yimou, 1994) · The Pig Eats Watermelon (Wan Guchan, 1958) · Huaxian Shadow Play troupes, Shaanxi · Tangshan shadow play · UNESCO Intangible Cultural Heritage (2011)
- Motion DNA: Stiff jointed limbs that swing like pendulums from three rods, a body that glides on the main rod, and sudden flourishes such as the somersault and the frozen pose on a gong crash.
- Visual DNA: Profile figures in translucent red, green and yellow hide carved into lace, glowing through a warm lamp-lit cloth with a soft halo where they touch it and blurred rods below.
- Signature transitions: Blur-to-sharp press onto the screen, lift-off into soft shadow, lamp flare, gong-crash freeze
- Key techniques: Translucent dyed hide, Hollow-carved patterns, Rod-driven joints on a lamp-lit screen

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Translucent dyed hide, Hollow-carved patterns, Rod-driven joints on a lamp-lit screen).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Translucent dyed hide and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SHADOW PUPPETRY", held for about 1 s.

BUILD RULES
- Suggested tools: Physical puppets + lamp, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Shadow Puppetry motion-graphics film (Piying 皮影戏). Visual style: profile figures in translucent red, green and yellow hide carved into lace, glowing through a warm lamp-lit cloth with a soft halo where they touch it and blurred rods below. Motion: stiff jointed limbs that swing like pendulums from three rods, a body that glides on the main rod, and sudden flourishes such as the somersault and the frozen pose on a gong crash. Signature moves: translucent dyed hide, hollow-carved patterns, rod-driven joints on a lamp-lit screen; transitions: blur-to-sharp press onto the screen, lift-off into soft shadow, lamp flare, gong-crash freeze. In the tradition of To Live (Zhang Yimou, 1994) · The Pig Eats Watermelon (Wan Guchan, 1958) · Huaxian Shadow Play troupes, Shaanxi · Tangshan shadow play · UNESCO Intangible Cultural Heritage (2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SHADOW PUPPETRY". Punchy sound design synced to every cut.
```

## 109 · Dunhuang Murals
*Mogao 敦煌壁画 · 4th–14th c. · Cultural & Regional*

Reference film: `videos/dunhuang.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Dunhuang Murals** (Mogao 敦煌壁画, 4th–14th c.; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Over a thousand years, painters on the Silk Road covered the Mogao Caves near Dunhuang with mineral-pigment murals of Buddhist paradises, where flying apsaras (feitian) ride on trailing silk scarves. The Shanghai Animation Film Studio adapted the Cave 257 jataka into Nine-Coloured Deer in 1981.
- Study these reference works: Mogao Cave 257 Deer King Jataka (Northern Wei) · Cave 320 flying apsaras (Tang) · Cave 407 three-hare lotus ceiling (Sui) · Nine-Coloured Deer (Shanghai Animation Film Studio, 1981) · Dream of Dunhuang dance drama (Gansu, 1979)
- Motion DNA: Slow weightless glides on long curves, with the silk scarves doing the dancing: they trail the path, twist to show both faces, and keep rippling after the figure comes to rest.
- Visual DNA: Malachite, lapis, cinnabar and ochre on an earth-red ground, darkened flesh shading and fine iron-wire lines, under a skin of cracks and flaking plaster.
- Signature transitions: Lamp-light reveal, slow pull-back, ring-by-ring lotus bloom, flower rain, cartouche fade-in
- Key techniques: Mineral pigments on plaster, Iron-wire outline & contour shading, Trailing-scarf secondary motion

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Mineral pigments on plaster, Iron-wire outline & contour shading, Trailing-scarf secondary motion).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Mineral pigments on plaster and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DUNHUANG MURALS", held for about 1 s.

BUILD RULES
- Suggested tools: Mineral pigment on plaster, Procreate / Photoshop + AE, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Dunhuang Murals motion-graphics film (Mogao 敦煌壁画). Visual style: malachite, lapis, cinnabar and ochre on an earth-red ground, darkened flesh shading and fine iron-wire lines, under a skin of cracks and flaking plaster. Motion: slow weightless glides on long curves, with the silk scarves doing the dancing: they trail the path, twist to show both faces, and keep rippling after the figure comes to rest. Signature moves: mineral pigments on plaster, iron-wire outline & contour shading, trailing-scarf secondary motion; transitions: lamp-light reveal, slow pull-back, ring-by-ring lotus bloom, flower rain, cartouche fade-in. In the tradition of Mogao Cave 257 Deer King Jataka (Northern Wei) · Cave 320 flying apsaras (Tang) · Cave 407 three-hare lotus ceiling (Sui) · Nine-Coloured Deer (Shanghai Animation Film Studio, 1981) · Dream of Dunhuang dance drama (Gansu, 1979). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DUNHUANG MURALS". Punchy sound design synced to every cut.
```

## 110 · Islamic Geometry
*Girih & Zellige · 9th c. — · Cultural & Regional*

Reference film: `videos/islamic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Islamic Geometry** (Girih & Zellige, 9th c. —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Across the Islamic world, craftsmen generated star-and-polygon patterns with nothing but compass and straightedge, then cut them in tile (zellige), wood and stucco as interlacing strapwork (girih). Working scrolls such as the Topkapı Scroll record the construction lines behind the finished surfaces.
- Study these reference works: Alhambra zellige, Granada (14th c.) · Darb-i Imam shrine girih, Isfahan (1453) · Topkapı Scroll (15th–16th c.) · Ben Youssef Madrasa, Marrakesh (1560s) · Sheikh Lotfollah Mosque, Isfahan (1619)
- Motion DNA: Everything is constructed before it is decorated: arcs and ruled lines draw a grid, the star lines trace over it, colour floods out ring by ring, and an endless zoom shows the same rosette nested inside itself.
- Visual DNA: Eight-fold stars and rosettes in lapis, turquoise, green and ochre glaze on cream, bound by dark interlacing straps edged in gold, with no figures at all.
- Signature transitions: Compass sweep, ripple trace, tile flood, Droste zoom, medallion iris
- Key techniques: Compass-and-straightedge build, Polygons-in-contact star pattern, Over-under strapwork & Droste zoom

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Compass-and-straightedge build, Polygons-in-contact star pattern, Over-under strapwork & Droste zoom).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Compass-and-straightedge build and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ISLAMIC GEOMETRY", held for about 1 s.

BUILD RULES
- Suggested tools: Compass & straightedge, Canvas 2D, Illustrator / Houdini. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Islamic Geometry motion-graphics film (Girih & Zellige). Visual style: eight-fold stars and rosettes in lapis, turquoise, green and ochre glaze on cream, bound by dark interlacing straps edged in gold, with no figures at all. Motion: everything is constructed before it is decorated: arcs and ruled lines draw a grid, the star lines trace over it, colour floods out ring by ring, and an endless zoom shows the same rosette nested inside itself. Signature moves: compass-and-straightedge build, polygons-in-contact star pattern, over-under strapwork & droste zoom; transitions: compass sweep, ripple trace, tile flood, Droste zoom, medallion iris. In the tradition of Alhambra zellige, Granada (14th c.) · Darb-i Imam shrine girih, Isfahan (1453) · Topkapı Scroll (15th–16th c.) · Ben Youssef Madrasa, Marrakesh (1560s) · Sheikh Lotfollah Mosque, Isfahan (1619). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ISLAMIC GEOMETRY". Punchy sound design synced to every cut.
```

## 111 · Papel Picado
*Mexican Cut-Paper Banners · 19th c. — · Cultural & Regional*

Reference film: `videos/papelpicado.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Papel Picado** (Mexican Cut-Paper Banners, 19th c. —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Artisans in Puebla towns such as San Salvador Huixcolotla chisel stacks of tissue paper into lace-like banners, strung over streets, altars and churchyards for fiestas and the Día de Muertos ofrendas. Pixar’s Coco and The Book of Life made its fluttering colour a global shorthand for Mexico.
- Study these reference works: Coco (Pixar, 2017) · The Book of Life (Reel FX, 2014) · San Salvador Huixcolotla papel picado workshops, Puebla · Día de Muertos ofrendas · Fiestas patrias street decorations
- Motion DNA: A slow dolly under rows of banners that sway on sagging cords, each flag rippling and lifting in gusts, with marigold petals drifting through the light.
- Visual DNA: Hot pink, orange, purple, green and blue tissue cut into skulls, flowers, birds and lattice, glowing against a sunset sky, over candlelit streets and a marigold petal path.
- Signature transitions: Gust lifts a close-up flag away, dolly-through, petal storm, final banner settles to spell the title
- Key techniques: Chisel-cut tissue lattice, Backlit translucency, Wind flutter & dolly under the rows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Chisel-cut tissue lattice, Backlit translucency, Wind flutter & dolly under the rows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Chisel-cut tissue lattice and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PAPEL PICADO", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-chiselled tissue, Blender / Houdini cloth, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Papel Picado motion-graphics film (Mexican Cut-Paper Banners). Visual style: hot pink, orange, purple, green and blue tissue cut into skulls, flowers, birds and lattice, glowing against a sunset sky, over candlelit streets and a marigold petal path. Motion: a slow dolly under rows of banners that sway on sagging cords, each flag rippling and lifting in gusts, with marigold petals drifting through the light. Signature moves: chisel-cut tissue lattice, backlit translucency, wind flutter & dolly under the rows; transitions: gust lifts a close-up flag away, dolly-through, petal storm, final banner settles to spell the title. In the tradition of Coco (Pixar, 2017) · The Book of Life (Reel FX, 2014) · San Salvador Huixcolotla papel picado workshops, Puebla · Día de Muertos ofrendas · Fiestas patrias street decorations. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PAPEL PICADO". Punchy sound design synced to every cut.
```

## 112 · Guochao
*China Chic · 2018 — · Cultural & Regional*

Reference film: `videos/guochao.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Guochao** (China Chic, 2018 —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: When Li-Ning walked New York Fashion Week in 2018, traditional Chinese motifs became a modern visual language.
- Study these reference works: National Treasure (2017) · Yao-Chinese Folktales (2023)
- Motion DNA: Ink spreads, mountains rise in parallax layers, and the seal lands as the final percussive hit.
- Visual DNA: Vermilion, mineral blue, gold and ink; rice paper; moon-gate framing.
- Signature transitions: Ink bloom reveal, scroll unroll
- Key techniques: Ink bloom, Mountain parallax, Calligraphy & seal

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ink bloom, Mountain parallax, Calligraphy & seal).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ink bloom and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GUOCHAO", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Guochao motion-graphics film (China Chic). Visual style: vermilion, mineral blue, gold and ink; rice paper; moon-gate framing. Motion: ink spreads, mountains rise in parallax layers, and the seal lands as the final percussive hit. Signature moves: ink bloom, mountain parallax, calligraphy & seal; transitions: ink bloom reveal, scroll unroll. In the tradition of National Treasure (2017) · Yao-Chinese Folktales (2023). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GUOCHAO". Punchy sound design synced to every cut.
```

## 113 · Minhwa 민화
*Korean Folk Painting · 18th–19th c. — · Cultural & Regional*

Reference film: `videos/minhwa.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Minhwa 민화** (Korean Folk Painting, 18th–19th c. —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: In late Joseon Korea, anonymous itinerant painters made “people’s paintings” for ordinary homes: magpie-and-tiger pictures to ward off evil at New Year, chaekgeori bookshelf screens, peonies for wealth and the ten symbols of longevity. Flat mineral colour, firm ink outlines and a cheerfully foolish tiger set them apart from court painting; Yanagi Muneyoshi championed them, and the 2018 PyeongChang Olympic mascot Soohorang descends from that tiger.
- Study these reference works: Magpie and Tiger (Kkachi Horangi), 19th c., Leeum Museum of Art · Chaekgeori screens attributed to Yi Eung-rok (19th c.) · Sipjangsaeng ten-longevity screens (Joseon court and folk) · Moran-do peony screens · Soohorang, PyeongChang 2018 mascot
- Motion DNA: Paper-cut-out stiffness with comic timing: the tiger pops up on a spring and rolls its huge eyes, the magpie hops and caws, peonies burst open, and screen panels unfold in a zigzag.
- Visual DNA: Outlined, flattened forms in vermilion, ochre, malachite and indigo on yellowed hanji: a striped-and-spotted grinning tiger under a pine, a black-and-white magpie, scalloped peonies and stylised rocks.
- Signature transitions: Ink-then-colour reveal, scroll-viewing tilt, pull-back to a folding screen, panels unfolding, red seal stamp
- Key techniques: Ink outline, flat mineral colour, Obangsaek five-colour palette, Multi-perspective composition, Folding-screen (byeongpung) format

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ink outline, flat mineral colour, Obangsaek five-colour palette, Multi-perspective composition, Folding-screen (byeongpung) format).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ink outline, flat mineral colour and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MINHWA 민화", held for about 1 s.

BUILD RULES
- Suggested tools: Mineral pigment on hanji, Illustrator / Procreate + AE puppet, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Minhwa 민화 motion-graphics film (Korean Folk Painting). Visual style: outlined, flattened forms in vermilion, ochre, malachite and indigo on yellowed hanji: a striped-and-spotted grinning tiger under a pine, a black-and-white magpie, scalloped peonies and stylised rocks. Motion: paper-cut-out stiffness with comic timing: the tiger pops up on a spring and rolls its huge eyes, the magpie hops and caws, peonies burst open, and screen panels unfold in a zigzag. Signature moves: ink outline, flat mineral colour, obangsaek five-colour palette, multi-perspective composition, folding-screen (byeongpung) format; transitions: ink-then-colour reveal, scroll-viewing tilt, pull-back to a folding screen, panels unfolding, red seal stamp. In the tradition of Magpie and Tiger (Kkachi Horangi), 19th c., Leeum Museum of Art · Chaekgeori screens attributed to Yi Eung-rok (19th c.) · Sipjangsaeng ten-longevity screens (Joseon court and folk) · Moran-do peony screens · Soohorang, PyeongChang 2018 mascot. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MINHWA 민화". Punchy sound design synced to every cut.
```

## 114 · Folk Paper-cut
*Wycinanki · Vytynanky · 19th c. — · Cultural & Regional*

Reference film: `videos/wycinanki.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Folk Paper-cut** (Wycinanki · Vytynanky, 19th c. —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Rural Poland took up paper-cutting in the 19th century, when glazed coloured paper reached village markets: households cut decorations freehand with sheep shears to brighten whitewashed cottage walls and beams for Easter and Christmas. Kurpie cutters fold one sheet to cut symmetric single-colour leluja trees; Łowicz cutters glue many colours in layers into stars and roosters. Ukraine’s vytynanky are a close cousin.
- Study these reference works: Kurpie leluja and gwiazdy (Kurpie Green Forest region) · Łowicz kodry and gwiazdy, Łowicz Regional Museum · Czesława Kwoka, Kurpie paper-cutter (1932–2021) · Polish Ethnographic Museum collections, Warsaw · Ukrainian vytynanky, Kyiv and Lviv
- Motion DNA: Snip-by-snip reveals on the beat: shears trace the fold, scraps drop away, the sheet flips open into symmetry, and coloured layers slap down one on top of another like a mazurka step.
- Visual DNA: Matte, flat glazed paper in fuchsia, green, yellow, orange, cobalt and black on a whitewashed wall: mirrored trees of life, birds and roosters, scalloped stars and tiny slit veins, each layer with a crisp edge and soft shadow.
- Signature transitions: Scissor trace, fold-out flip, layer drop, cut-paper title
- Key techniques: Freehand scissor cutting on the fold, Mirror symmetry by unfolding, Layered glazed paper (Łowicz), Cut-out slits and holes as line

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Freehand scissor cutting on the fold, Mirror symmetry by unfolding, Layered glazed paper (Łowicz), Cut-out slits and holes as line).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Freehand scissor cutting on the fold and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FOLK PAPER-CUT", held for about 1 s.

BUILD RULES
- Suggested tools: Scissors + glazed paper, Illustrator / cut-out AE rigs, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Folk Paper-cut motion-graphics film (Wycinanki · Vytynanky). Visual style: matte, flat glazed paper in fuchsia, green, yellow, orange, cobalt and black on a whitewashed wall: mirrored trees of life, birds and roosters, scalloped stars and tiny slit veins, each layer with a crisp edge and soft shadow. Motion: snip-by-snip reveals on the beat: shears trace the fold, scraps drop away, the sheet flips open into symmetry, and coloured layers slap down one on top of another like a mazurka step. Signature moves: freehand scissor cutting on the fold, mirror symmetry by unfolding, layered glazed paper (łowicz), cut-out slits and holes as line; transitions: scissor trace, fold-out flip, layer drop, cut-paper title. In the tradition of Kurpie leluja and gwiazdy (Kurpie Green Forest region) · Łowicz kodry and gwiazdy, Łowicz Regional Museum · Czesława Kwoka, Kurpie paper-cutter (1932–2021) · Polish Ethnographic Museum collections, Warsaw · Ukrainian vytynanky, Kyiv and Lviv. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FOLK PAPER-CUT". Punchy sound design synced to every cut.
```

## 115 · Indian Miniature
*Mughal · Rajput · Pahari painting · 16th–19th c. · Cultural & Regional*

Reference film: `videos/miniature.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Indian Miniature** (Mughal · Rajput · Pahari painting, 16th–19th c.; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Album and manuscript painting of the Mughal court (from Akbar’s atelier in the 1560s) and of the Rajput kingdoms of Rajasthan and the Pahari hill states of the Punjab Himalaya. Painters burnished wasli paper, sketched a red-ochre khaka, laid mineral and lake pigments in flat layers and finished with gold; Persian conventions — a high horizon, tilted ground planes, cypress and garden — met Indian devotional subjects, above all the love of Radha and Krishna in the Gita Govinda and Bhagavata Purana.
- Study these reference works: Hamzanama for Akbar (c. 1562–77) · Jahangir album pages with gold-flowered hashiya margins (c. 1610–20) · Nainsukh of Guler, paintings for Balwant Singh of Jasrota (c. 1740s–50s) · Kangra Gita Govinda series (c. 1775–80) · Kishangarh “Bani Thani” type, Nihal Chand (c. 1750)
- Motion DNA: The painting is built the way a workshop built it — rules drawn, margin burnished, khaka sketched, colour laid layer by layer, gold applied last — then only gentle, devotional motion: a flute raised, a veil lifting, a peacock’s call, ripples in the tank, cranes crossing the sky.
- Visual DNA: A high-horizon garden terrace shown from above with upright profile figures, white marble pavilions with cusped arches and chhatris, rounded trees of countless leaves, jewel-tone lapis, vermilion and malachite on cream, fine dark outlines and glinting gold, inside rules, a lapis vine border and a gold-flowered hashiya.
- Signature transitions: Ruling-pen line draw, khaka-to-colour layering, gold-leaf sweep with sheen, slow camera glide across the folio, pull-back to the album page and its inscription
- Key techniques: Burnished wasli paper, red khaka underdrawing, Flat mineral pigments (lapis, malachite, vermilion, Indian yellow), Gold leaf and shell gold, burnished, Tilted perspective, profile figures, ornate hashiya margins

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Burnished wasli paper, red khaka underdrawing, Flat mineral pigments (lapis, malachite, vermilion, Indian yellow), Gold leaf and shell gold, burnished, Tilted perspective, profile figures, ornate hashiya margins).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Burnished wasli paper, red khaka underdrawing and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "INDIAN MINIATURE", held for about 1 s.

BUILD RULES
- Suggested tools: Mineral pigment and gold on wasli, Illustrator / Procreate + AE layered reveal, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Indian Miniature motion-graphics film (Mughal · Rajput · Pahari painting). Visual style: a high-horizon garden terrace shown from above with upright profile figures, white marble pavilions with cusped arches and chhatris, rounded trees of countless leaves, jewel-tone lapis, vermilion and malachite on cream, fine dark outlines and glinting gold, inside rules, a lapis vine border and a gold-flowered hashiya. Motion: the painting is built the way a workshop built it — rules drawn, margin burnished, khaka sketched, colour laid layer by layer, gold applied last — then only gentle, devotional motion: a flute raised, a veil lifting, a peacock’s call, ripples in the tank, cranes crossing the sky. Signature moves: burnished wasli paper, red khaka underdrawing, flat mineral pigments (lapis, malachite, vermilion, indian yellow), gold leaf and shell gold, burnished, tilted perspective, profile figures, ornate hashiya margins; transitions: ruling-pen line draw, khaka-to-colour layering, gold-leaf sweep with sheen, slow camera glide across the folio, pull-back to the album page and its inscription. In the tradition of Hamzanama for Akbar (c. 1562–77) · Jahangir album pages with gold-flowered hashiya margins (c. 1610–20) · Nainsukh of Guler, paintings for Balwant Singh of Jasrota (c. 1740s–50s) · Kangra Gita Govinda series (c. 1775–80) · Kishangarh “Bani Thani” type, Nihal Chand (c. 1750). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "INDIAN MINIATURE". Punchy sound design synced to every cut.
```

## 116 · African Pattern Animation
*Kente · Adinkra · Ndebele · 17th c. — today · Cultural & Regional*

Reference film: `videos/africanpattern.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **African Pattern Animation** (Kente · Adinkra · Ndebele, 17th c. — today; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Not one “African style” but distinct living traditions. Kente is woven by Asante and Ewe weavers in Ghana on horizontal treadle looms as narrow strips (about 10 cm) that are sewn edge to edge, alternating warp-faced stripes and weft-faced blocks; Adinkra cloth, also Asante, is ruled with a comb and stamped with carved-calabash symbols, each a named proverb; amaNdebele women in South Africa paint homestead walls with black-outlined geometry and flat colour, a practice Esther Mahlangu carried onto canvas, a BMW Art Car and global design.
- Study these reference works: Asante royal Kente (Bonwire, Ashanti Region) and Ewe Kente (Agotime, Volta Region) · Adinkra cloths from Ntonso, Ghana; symbol sets catalogued by W. Bruce Willis, The Adinkra Dictionary (1998) · Esther Mahlangu, BMW 525i Art Car (1991) and Magiciens de la Terre, Paris (1989) · Kente stoles in graduation and diaspora fashion
- Motion DNA: Motion follows the making: shuttle and beater on the 12/8 bell, strips sliding together into a checkerboard, stamps pressing down on the dotted-quarter beat with each symbol’s name, a brush tip tracing black outlines and colour flooding each field.
- Visual DNA: Gold, green, red and black Kente with blocky weft-faced motifs; black Adinkra symbols in comb-ruled squares on cream cotton; whitewashed Ndebele walls of stepped gables, razor-blade hexagons and ladder stripes in primary colour with thick black and fine white outlines.
- Signature transitions: Loom pull-back to sewn cloth, cloth slide-over, comb rake, stamp press, lime-wash brush wipe, collapse into a labelled triptych
- Key techniques: Narrow-strip treadle-loom weaving, strips sewn edge to edge, Comb-ruled grid and calabash stamps in badie-bark ink, Freehand black outlines filled with flat colour, Each motif named; meaning carried by symbol and colour

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Narrow-strip treadle-loom weaving, strips sewn edge to edge, Comb-ruled grid and calabash stamps in badie-bark ink, Freehand black outlines filled with flat colour, Each motif named; meaning carried by symbol and colour).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Narrow-strip treadle-loom weaving, strips sewn edge to edge and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "AFRICAN PATTERN ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Loom, stamp and brush as process animation, Illustrator / AE shape layers with trim paths, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second African Pattern Animation motion-graphics film (Kente · Adinkra · Ndebele). Visual style: gold, green, red and black Kente with blocky weft-faced motifs; black Adinkra symbols in comb-ruled squares on cream cotton; whitewashed Ndebele walls of stepped gables, razor-blade hexagons and ladder stripes in primary colour with thick black and fine white outlines. Motion: motion follows the making: shuttle and beater on the 12/8 bell, strips sliding together into a checkerboard, stamps pressing down on the dotted-quarter beat with each symbol’s name, a brush tip tracing black outlines and colour flooding each field. Signature moves: narrow-strip treadle-loom weaving, strips sewn edge to edge, comb-ruled grid and calabash stamps in badie-bark ink, freehand black outlines filled with flat colour, each motif named; meaning carried by symbol and colour; transitions: loom pull-back to sewn cloth, cloth slide-over, comb rake, stamp press, lime-wash brush wipe, collapse into a labelled triptych. In the tradition of Asante royal Kente (Bonwire, Ashanti Region) and Ewe Kente (Agotime, Volta Region) · Adinkra cloths from Ntonso, Ghana; symbol sets catalogued by W. Bruce Willis, The Adinkra Dictionary (1998) · Esther Mahlangu, BMW 525i Art Car (1991) and Magiciens de la Terre, Paris (1989) · Kente stoles in graduation and diaspora fashion. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "AFRICAN PATTERN ANIMATION". Punchy sound design synced to every cut.
```

## 117 · Variety Captions
*Huazi · 2013 — · Social & Commercial*

Reference film: `videos/huazi.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Variety Captions** (Huazi, 2013 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Borrowed from Japanese and Korean variety-show telops, then standard on Chinese reality TV.
- Study these reference works: Dad, Where Are We Going? (2013) · Running Man China (2014)
- Motion DNA: Every caption pops on a spring with an exact sound effect; the camera shakes on the punchline.
- Visual DNA: Chunky rounded type with stacked outlines, gradients, stickers and speed lines.
- Signature transitions: Desaturated "awkward silence", stamp-in
- Key techniques: Layered outlines, Elastic pop-in, SFX sync

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Layered outlines, Elastic pop-in, SFX sync).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Layered outlines and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VARIETY CAPTIONS", held for about 1 s.

BUILD RULES
- Suggested tools: Premiere, CapCut, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural over live footage.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Variety Captions motion-graphics film (Huazi). Visual style: chunky rounded type with stacked outlines, gradients, stickers and speed lines. Motion: every caption pops on a spring with an exact sound effect; the camera shakes on the punchline. Signature moves: layered outlines, elastic pop-in, sfx sync; transitions: desaturated "awkward silence", stamp-in. In the tradition of Dad, Where Are We Going? (2013) · Running Man China (2014). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VARIETY CAPTIONS". Punchy sound design synced to every cut.
```

## 118 · Scrapbook Journal
*Shouzhang · 2019 — · Social & Commercial*

Reference film: `videos/shouzhang.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Scrapbook Journal** (Shouzhang, 2019 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Japanese techō journaling meets stop motion: the cosy vlog look of Xiaohongshu and Bilibili.
- Study these reference works: Hobonichi Techo · Traveler's Notebook · journal vlogs
- Motion DNA: Everything steps at 12 fps with per-frame jitter, as if placed by hand.
- Visual DNA: Dot-grid paper, washi tape, polaroids, handwriting, warm desk light.
- Signature transitions: Tape slap, stamp thump
- Key techniques: 12 fps boil, Washi tape, Handwriting reveal

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (12 fps boil, Washi tape, Handwriting reveal).
- 5.0–8.0 s  Climax: the most spectacular moment, built on 12 fps boil and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SCRAPBOOK JOURNAL", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Procreate, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural + hand-drawn.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Scrapbook Journal motion-graphics film (Shouzhang). Visual style: dot-grid paper, washi tape, polaroids, handwriting, warm desk light. Motion: everything steps at 12 fps with per-frame jitter, as if placed by hand. Signature moves: 12 fps boil, washi tape, handwriting reveal; transitions: tape slap, stamp thump. In the tradition of Hobonichi Techo · Traveler's Notebook · journal vlogs. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SCRAPBOOK JOURNAL". Punchy sound design synced to every cut.
```

## 119 · Science Explainer
*Kepu · 2019 — · Social & Commercial*

Reference film: `videos/kepu.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Science Explainer** (Kepu, 2019 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Bilibili's knowledge channels made data-driven flat explainers mainstream, inspired by Kurzgesagt.
- Study these reference works: Powers of Ten (1977) · PaperClip, "Everything about COVID-19" (2020)
- Motion DNA: Ask, zoom through scales, count, then compare on an honest scale.
- Visual DNA: Dark navy, flat illustration, mono numerals, callout leaders.
- Signature transitions: Magnifier zoom, number collapse
- Key techniques: Question hook, Powers-of-ten zoom, To-scale data

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Question hook, Powers-of-ten zoom, To-scale data).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Question hook and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SCIENCE EXPLAINER", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, D3, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Science Explainer motion-graphics film (Kepu). Visual style: dark navy, flat illustration, mono numerals, callout leaders. Motion: ask, zoom through scales, count, then compare on an honest scale. Signature moves: question hook, powers-of-ten zoom, to-scale data; transitions: magnifier zoom, number collapse. In the tradition of Powers of Ten (1977) · PaperClip, "Everything about COVID-19" (2020). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SCIENCE EXPLAINER". Punchy sound design synced to every cut.
```

## 120 · Sports Broadcast
*Glass, Chrome and Score Bugs · 1994 — · Social & Commercial*

Reference film: `videos/sports.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Sports Broadcast** (Glass, Chrome and Score Bugs, 1994 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Network sports packages turned into motion-design showpieces after FOX launched its NFL coverage in 1994 with the persistent score box; ESPN, Sky Sports and Olympic broadcasters then built whole branded systems of chrome type, glass panels, stingers and lower thirds, now usually run live from real-time graphics engines.
- Study these reference works: NFL on FOX graphics package (1994 –, FoxBox score bug) · ESPN Monday Night Football open · Sky Sports Premier League graphics · NBC Sunday Night Football · Olympic Broadcasting Services graphics (OBS) · Hockey Night in Canada
- Motion DNA: Everything arrives with violence: panels slam in on the beat with overshoot and motion smears, numbers count up and lock, a spinning logo stinger swallows the frame, and a flare sweeps on the final lockup.
- Visual DNA: Deep arena navy with volumetric beams, team-colour glass panels with metal edges, chrome condensed italic type, gold accents, crests, a score bug, lower third and ticker.
- Signature transitions: Slam-ins, diagonal split, whip-outs, logo stinger with flash, wipe bars, lens-flare reveal.
- Key techniques: Extruded slab panels: metal side face, glass front, bevel light, Chrome type: banded gradient fill, extrusion, gleam sweep, Slam-in with overshoot, motion smear and camera shake on every hit, Anamorphic lens flare and light streaks in additive blend

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Extruded slab panels: metal side face, glass front, bevel light, Chrome type: banded gradient fill, extrusion, gleam sweep, Slam-in with overshoot, motion smear and camera shake on every hit, Anamorphic lens flare and light streaks in additive blend).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Extruded slab panels: metal side face, glass front, bevel light and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SPORTS BROADCAST", held for about 1 s.

BUILD RULES
- Suggested tools: Vizrt, Chyron / Ross XPression, Cinema 4D + After Effects, Unreal Engine, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Sports Broadcast motion-graphics film (Glass, Chrome and Score Bugs). Visual style: deep arena navy with volumetric beams, team-colour glass panels with metal edges, chrome condensed italic type, gold accents, crests, a score bug, lower third and ticker. Motion: everything arrives with violence: panels slam in on the beat with overshoot and motion smears, numbers count up and lock, a spinning logo stinger swallows the frame, and a flare sweeps on the final lockup. Signature moves: extruded slab panels: metal side face, glass front, bevel light, chrome type: banded gradient fill, extrusion, gleam sweep, slam-in with overshoot, motion smear and camera shake on every hit, anamorphic lens flare and light streaks in additive blend; transitions: slam-ins, diagonal split, whip-outs, logo stinger with flash, wipe bars, lens-flare reveal. In the tradition of NFL on FOX graphics package (1994 –, FoxBox score bug) · ESPN Monday Night Football open · Sky Sports Premier League graphics · NBC Sunday Night Football · Olympic Broadcasting Services graphics (OBS) · Hockey Night in Canada. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SPORTS BROADCAST". Punchy sound design synced to every cut.
```

## 121 · Luxury Brand Motion
*Maison Films · 1970s — · Social & Commercial*

Reference film: `videos/luxury.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Luxury Brand Motion** (Maison Films, 1970s —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Perfume, watch and fashion houses turned the television spot into a short film: Chanel N°5 commercials by Ridley Scott and later Luc Besson, Cartier’s "L’Odyssée" and the Hermès and Rolex idents set the grammar of slow macro product light, precious materials, silence and a single high-contrast serif wordmark.
- Study these reference works: Chanel N°5 “Share the Fantasy” (Ridley Scott, 1979) · Chanel N°5 “Le Loup” (Luc Besson, 1998) · Cartier “L’Odyssée de Cartier” (Bruno Aveillan, 2012) · Dior J’adore films · Rolex “Perpetual” brand films · Hermès brand films and idents
- Motion DNA: Everything is slow and precise: a pour in slow motion, light gliding across facets, a raking light turning over an embossed monogram, letters resolving out of blur while their tracking tightens; every move eases in and out.
- Visual DNA: Warm black, champagne gold and ivory; macro surfaces of liquid metal, silk and cut crystal; generous negative space; a thin, wide-tracked Didone wordmark with an italic tagline.
- Signature transitions: Slow dissolves, dip to black, light leaving the frame, letters resolving from blur.
- Key techniques: Per-pixel liquid-gold surface: radial ripples reflecting a softbox, Procedural silk height field with anisotropic sheen, Faceted crystal: per-facet normals lit by a gliding light, Blind emboss from offset blurred masks under raking light

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Per-pixel liquid-gold surface: radial ripples reflecting a softbox, Procedural silk height field with anisotropic sheen, Faceted crystal: per-facet normals lit by a gliding light, Blind emboss from offset blurred masks under raking light).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Per-pixel liquid-gold surface: radial ripples reflecting a softbox and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LUXURY BRAND MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Live action macro, Houdini FLIP, Cinema 4D + Redshift, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs 3D or live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Luxury Brand Motion motion-graphics film (Maison Films). Visual style: warm black, champagne gold and ivory; macro surfaces of liquid metal, silk and cut crystal; generous negative space; a thin, wide-tracked Didone wordmark with an italic tagline. Motion: everything is slow and precise: a pour in slow motion, light gliding across facets, a raking light turning over an embossed monogram, letters resolving out of blur while their tracking tightens; every move eases in and out. Signature moves: per-pixel liquid-gold surface: radial ripples reflecting a softbox, procedural silk height field with anisotropic sheen, faceted crystal: per-facet normals lit by a gliding light, blind emboss from offset blurred masks under raking light; transitions: slow dissolves, dip to black, light leaving the frame, letters resolving from blur. In the tradition of Chanel N°5 “Share the Fantasy” (Ridley Scott, 1979) · Chanel N°5 “Le Loup” (Luc Besson, 1998) · Cartier “L’Odyssée de Cartier” (Bruno Aveillan, 2012) · Dior J’adore films · Rolex “Perpetual” brand films · Hermès brand films and idents. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LUXURY BRAND MOTION". Punchy sound design synced to every cut.
```

## 122 · Logo Reveal
*Brand Sting & Studio Ident · 1930s — · Social & Commercial*

Reference film: `videos/logoreveal.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Logo Reveal** (Brand Sting & Studio Ident, 1930s —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Film studios turned their trademark into a few seconds of ceremony: the 20th Century Fox searchlight-and-fanfare ident (1935), MGM’s roaring lion and later Netflix’s “ta-dum” sonic logo with its 2019 ribbon ident. Identity studios such as Pentagram made the reveal a demonstration of the mark’s own geometry, so the logo appears to build itself from its construction.
- Study these reference works: 20th Century Fox ident and fanfare (Alfred Newman, 1933/1935) · MGM “Leo the Lion” · Netflix “ta-dum” sonic logo (2015) and ribbon ident (2019) · Pentagram identity motion for MIT Media Lab (2014) · Pixar’s Luxo Jr. lamp ident
- Motion DNA: Build-up, then one landing: construction lines and a pen trace lead to the moment the sun-dot springs in on the final note of the sonic logo, after which everything settles and holds still.
- Visual DNA: A geometric monogram on warm paper, ink black with one signal orange, a hairline grid, mono-type spec labels and a tightly kerned geometric sans wordmark.
- Signature transitions: Hard cuts between alternate takes, construction lines dissolving into the fill, light sweep, spring slide to lock-up.
- Key techniques: Mark defined by two tangent circles, reused for every take, Compass-swept construction circles and dimension guides, Outline traced with a line-dash pen, then an ink fill along the path, Source-atop light sweep; glyph-by-glyph tracking with font kerning kept

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Mark defined by two tangent circles, reused for every take, Compass-swept construction circles and dimension guides, Outline traced with a line-dash pen, then an ink fill along the path, Source-atop light sweep; glyph-by-glyph tracking with font kerning kept).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Mark defined by two tangent circles, reused for every take and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LOGO REVEAL", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Cinema 4D, Lottie. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Logo Reveal motion-graphics film (Brand Sting & Studio Ident). Visual style: a geometric monogram on warm paper, ink black with one signal orange, a hairline grid, mono-type spec labels and a tightly kerned geometric sans wordmark. Motion: build-up, then one landing: construction lines and a pen trace lead to the moment the sun-dot springs in on the final note of the sonic logo, after which everything settles and holds still. Signature moves: mark defined by two tangent circles, reused for every take, compass-swept construction circles and dimension guides, outline traced with a line-dash pen, then an ink fill along the path, source-atop light sweep; glyph-by-glyph tracking with font kerning kept; transitions: hard cuts between alternate takes, construction lines dissolving into the fill, light sweep, spring slide to lock-up. In the tradition of 20th Century Fox ident and fanfare (Alfred Newman, 1933/1935) · MGM “Leo the Lion” · Netflix “ta-dum” sonic logo (2015) and ribbon ident (2019) · Pentagram identity motion for MIT Media Lab (2014) · Pixar’s Luxo Jr. lamp ident. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LOGO REVEAL". Punchy sound design synced to every cut.
```

## 123 · App UI Motion
*Micro-interactions & Product Shots · 2007 — · Social & Commercial*

Reference film: `videos/appui.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **App UI Motion** (Micro-interactions & Product Shots, 2007 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The iPhone (2007) made physics part of the interface: rubber-band scrolling, momentum and springs. Google’s Material Design (2014) codified ripples and shared-element transitions, Dribbble turned the looping product shot into a portfolio genre, and Apple’s Dynamic Island (2022) made a hardware cutout morph like a living object.
- Study these reference works: iPhone OS rubber-band scrolling (2007) · Google Material Design motion guidelines (2014) · Apple iOS 7 spring animations (2013) · Apple “Dynamic Island” (iPhone 14 Pro, 2022) · Dribbble UI animation shots · Airbnb Lottie (2017)
- Motion DNA: Everything answers the finger: presses dip, releases spring back with a little overshoot, lists cascade in 70 ms steps and elements carry their identity from one screen into the next.
- Visual DNA: A clean device on a pastel gradient, soft cards and pill shapes, one brand green with a lime accent, Inter type and a translucent touch indicator.
- Signature transitions: Iris open, push, shared-element morph, pull and spring back, button-to-loader morph, app closing into its icon.
- Key techniques: Damped springs (response, damping fraction) on every property, Shared-element morph of rect, radius, image and type size, Rubber-band pull with hold-and-release, Live spring-curve readout synced to each beat

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Damped springs (response, damping fraction) on every property, Shared-element morph of rect, radius, image and type size, Rubber-band pull with hold-and-release, Live spring-curve readout synced to each beat).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Damped springs (response, damping fraction) on every property and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "APP UI MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Figma Smart Animate, Principle / ProtoPie, After Effects + Lottie, SwiftUI / Jetpack Compose. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second App UI Motion motion-graphics film (Micro-interactions & Product Shots). Visual style: a clean device on a pastel gradient, soft cards and pill shapes, one brand green with a lime accent, Inter type and a translucent touch indicator. Motion: everything answers the finger: presses dip, releases spring back with a little overshoot, lists cascade in 70 ms steps and elements carry their identity from one screen into the next. Signature moves: damped springs (response, damping fraction) on every property, shared-element morph of rect, radius, image and type size, rubber-band pull with hold-and-release, live spring-curve readout synced to each beat; transitions: iris open, push, shared-element morph, pull and spring back, button-to-loader morph, app closing into its icon. In the tradition of iPhone OS rubber-band scrolling (2007) · Google Material Design motion guidelines (2014) · Apple iOS 7 spring animations (2013) · Apple “Dynamic Island” (iPhone 14 Pro, 2022) · Dribbble UI animation shots · Airbnb Lottie (2017). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "APP UI MOTION". Punchy sound design synced to every cut.
```

## 124 · Data Storytelling
*Animated Data Journalism · 2006 — · Social & Commercial*

Reference film: `videos/datastory.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Data Storytelling** (Animated Data Journalism, 2006 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Hans Rosling’s animated Gapminder bubbles (TED 2006; BBC “200 Countries, 200 Years, 4 Minutes”, 2010) showed that a moving chart could carry a story. Newsrooms such as The New York Times graphics desk, The Guardian and The Pudding built scroll-driven, annotated charts that reveal data step by step, while bar-chart races spread across social video.
- Study these reference works: Hans Rosling, “The best stats you’ve ever seen” (TED, 2006) · BBC “The Joy of Stats”: 200 Countries, 200 Years, 4 Minutes (2010) · The New York Times “How the Virus Got Out” (2020) · The Pudding “The Largest Vocabulary in Hip Hop” (2017) · John Burn-Murdoch’s FT Covid trajectory charts (2020)
- Motion DNA: Motion serves the reading order: axes first, then data draws through time with a live cursor, notes pop in when the line reaches them, and each chart holds still long enough to be read before the next one.
- Visual DNA: Warm newsprint white, black serif headlines, a single editorial red for the story line, muted categorical colours, hairline gridlines, precise labels and an "Illustrative data" source line.
- Signature transitions: Header swaps with slide-up fades, axes growing from the origin, bars and bubbles popping in, number count-up.
- Key techniques: Every mark drawn to scale from the data functions: zero baselines, log-x where labelled, Annotations triggered as the line cursor passes each event, Soft-rank interpolation for a continuous bar-chart race, Gapminder bubbles: log income × lifespan, area ∝ population, year watermark

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Every mark drawn to scale from the data functions: zero baselines, log-x where labelled, Annotations triggered as the line cursor passes each event, Soft-rank interpolation for a continuous bar-chart race, Gapminder bubbles: log income × lifespan, area ∝ population, year watermark).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Every mark drawn to scale from the data functions: zero baselines, log-x where labelled and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DATA STORYTELLING", held for about 1 s.

BUILD RULES
- Suggested tools: D3.js, Flourish, Datawrapper, Scrollama / scrollytelling. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Data Storytelling motion-graphics film (Animated Data Journalism). Visual style: warm newsprint white, black serif headlines, a single editorial red for the story line, muted categorical colours, hairline gridlines, precise labels and an "Illustrative data" source line. Motion: motion serves the reading order: axes first, then data draws through time with a live cursor, notes pop in when the line reaches them, and each chart holds still long enough to be read before the next one. Signature moves: every mark drawn to scale from the data functions: zero baselines, log-x where labelled, annotations triggered as the line cursor passes each event, soft-rank interpolation for a continuous bar-chart race, gapminder bubbles: log income × lifespan, area ∝ population, year watermark; transitions: header swaps with slide-up fades, axes growing from the origin, bars and bubbles popping in, number count-up. In the tradition of Hans Rosling, “The best stats you’ve ever seen” (TED, 2006) · BBC “The Joy of Stats”: 200 Countries, 200 Years, 4 Minutes (2010) · The New York Times “How the Virus Got Out” (2020) · The Pudding “The Largest Vocabulary in Hip Hop” (2017) · John Burn-Murdoch’s FT Covid trajectory charts (2020). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DATA STORYTELLING". Punchy sound design synced to every cut.
```

## 125 · Podcast Visualizer
*The Audiogram Clip · 2017 — · Social & Commercial*

Reference film: `videos/podcast.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Podcast Visualizer** (The Audiogram Clip, 2017 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Audio does not autoplay in a social feed, so around 2017 podcasters began posting “audiograms”: a short clip turned into video with the cover art, an animated waveform and burned-in captions. WNYC’s open-source Audiogram tool (2016) and services such as Headliner and Wavve made the format a default promo, and word-by-word captions later spread from TikTok-era video podcasts.
- Study these reference works: WNYC Audiogram generator (open source, 2016) · Headliner audiograms (2017 —) · Wavve (2017 —) · Video-podcast clips on TikTok, Instagram Reels and YouTube Shorts (2020s)
- Motion DNA: Everything is driven by the voice: bars and avatar rings pulse per syllable, captions pop in word by word with the spoken word highlighted, and the layout snaps to whoever is talking.
- Visual DNA: A square cover tile, bold sans captions in white with a coloured highlight pill, rounded bars mirrored around a centre line, speaker chips and a thin scrub bar, over a dark gradient tinted by the cover art.
- Signature transitions: Cover spin-in, speaker switch, pull-quote blow-up, end-card fold
- Key techniques: Waveform / bar visualiser from audio envelope, Word-by-word captions, Speaker cards & active-speaker highlight, Cover art + progress bar template

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Waveform / bar visualiser from audio envelope, Word-by-word captions, Speaker cards & active-speaker highlight, Cover art + progress bar template).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Waveform / bar visualiser from audio envelope and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PODCAST VISUALIZER", held for about 1 s.

BUILD RULES
- Suggested tools: Headliner / Wavve templates, After Effects + audio-to-keyframes, Canvas 2D + Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Podcast Visualizer motion-graphics film (The Audiogram Clip). Visual style: a square cover tile, bold sans captions in white with a coloured highlight pill, rounded bars mirrored around a centre line, speaker chips and a thin scrub bar, over a dark gradient tinted by the cover art. Motion: everything is driven by the voice: bars and avatar rings pulse per syllable, captions pop in word by word with the spoken word highlighted, and the layout snaps to whoever is talking. Signature moves: waveform / bar visualiser from audio envelope, word-by-word captions, speaker cards & active-speaker highlight, cover art + progress bar template; transitions: cover spin-in, speaker switch, pull-quote blow-up, end-card fold. In the tradition of WNYC Audiogram generator (open source, 2016) · Headliner audiograms (2017 —) · Wavve (2017 —) · Video-podcast clips on TikTok, Instagram Reels and YouTube Shorts (2020s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PODCAST VISUALIZER". Punchy sound design synced to every cut.
```

## 126 · Concert VJ Loops
*Live visuals for stage & club · 1990s — · Social & Commercial*

Reference film: `videos/vj.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Concert VJ Loops** (Live visuals for stage & club, 1990s —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: VJs perform visuals live, triggering and mixing beat-locked loops on clip-launcher software (Resolume Arena, TouchDesigner, earlier VDMX and Modul8) onto LED walls and projection-mapped stage sets. The form grew out of club projection in the 1980s–90s; by the 2000s studios such as United Visual Artists built LED walls and custom software for Massive Attack, Daft Punk toured a light-up pyramid, and Amon Tobin’s ISAM stage turned a stack of cubes into a projection-mapped instrument.
- Study these reference works: UVA (United Visual Artists) — Massive Attack 100th Window tour LED wall (2003) and Heligoland tour (2010) · Daft Punk, Alive 2006/2007 pyramid stage · Amon Tobin, ISAM Live (2011), with Heavy Projects and V Squared Labs · Resolume Arena / TouchDesigner VJ sets in clubs and festivals
- Motion DNA: Everything is locked to the beat grid: loops cycle in bar lengths, kicks launch local rings rather than full-frame flashes, a build accelerates scroll speed and roll density, the drop changes clip on the downbeat and lasers fan on the bar.
- Visual DNA: A black stage with a wide LED wall of visible pixels, neon cyan, magenta and amber geometry — tunnels, data columns, nested triangles — bloom and floor reflections, a pyramid outline, a mapped cube booth, laser fans over a silhouetted crowd with raised hands and phone screens.
- Signature transitions: Dive through the software output preview onto the wall, clip cuts on the downbeat, scan sweeps, accelerating build, pulse decays, title resolved in LED pixels
- Key techniques: Clip launcher with BPM sync / tap tempo, LED wall mapping at low pixel pitch, Projection-mapped set pieces, Lasers and moving heads through haze

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Clip launcher with BPM sync / tap tempo, LED wall mapping at low pixel pitch, Projection-mapped set pieces, Lasers and moving heads through haze).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Clip launcher with BPM sync / tap tempo and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CONCERT VJ LOOPS", held for about 1 s.

BUILD RULES
- Suggested tools: Resolume Arena / TouchDesigner + LED processor, Notch / After Effects loop authoring, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Concert VJ Loops motion-graphics film (Live visuals for stage & club). Visual style: a black stage with a wide LED wall of visible pixels, neon cyan, magenta and amber geometry — tunnels, data columns, nested triangles — bloom and floor reflections, a pyramid outline, a mapped cube booth, laser fans over a silhouetted crowd with raised hands and phone screens. Motion: everything is locked to the beat grid: loops cycle in bar lengths, kicks launch local rings rather than full-frame flashes, a build accelerates scroll speed and roll density, the drop changes clip on the downbeat and lasers fan on the bar. Signature moves: clip launcher with bpm sync / tap tempo, led wall mapping at low pixel pitch, projection-mapped set pieces, lasers and moving heads through haze; transitions: dive through the software output preview onto the wall, clip cuts on the downbeat, scan sweeps, accelerating build, pulse decays, title resolved in LED pixels. In the tradition of UVA (United Visual Artists) — Massive Attack 100th Window tour LED wall (2003) and Heligoland tour (2010) · Daft Punk, Alive 2006/2007 pyramid stage · Amon Tobin, ISAM Live (2011), with Heavy Projects and V Squared Labs · Resolume Arena / TouchDesigner VJ sets in clubs and festivals. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CONCERT VJ LOOPS". Punchy sound design synced to every cut.
```

## 127 · SaaS Product Motion
*B2B launch film · 2010s — · Social & Commercial*

Reference film: `videos/saas.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **SaaS Product Motion** (B2B launch film, 2010s —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Software companies now launch features the way carmakers launch cars: with a short film in which the product interface itself is the hero. Through the late 2010s and 2020s teams such as Stripe, Linear and Vercel set the look — a dark stage lit by a drifting gradient mesh, app windows tilted in three-quarter perspective, a cursor demonstrating one feature, numbers counting up, and every move on a spring.
- Study these reference works: Stripe homepage animated gradient (2020) · Linear product launch and changelog films · Vercel Ship launch keynotes (2023 —) · Figma Config keynote product demos (2020 —)
- Motion DNA: Every arrival is a damped spring with a touch of overshoot; words rise in a 150 ms stagger and sharpen from blur, the window swings from three-quarter view to flat for the demo and back, satellite cards drift at their own depth for parallax, and numbers count up on an ease-out so they land, not stop.
- Visual DNA: Near-black stage under a slow violet–blue–pink gradient mesh, a faint grid, glassy dark cards with 1 px borders and a lit top edge, one violet accent, Geist type with tight tracking, crisp product UI (sidebar, issue rows, command menu, toast) and a cursor as the protagonist.
- Signature transitions: Spring-in headline, window rising in perspective, swing to flat and push in, command-menu scale-in, rows re-sorting on a spring, recede and fly-in of stat cards, fly-out to the logo lock-up
- Key techniques: 3/4 perspective UI cards, Cursor-driven feature demo, Springs and counters

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (3/4 perspective UI cards, Cursor-driven feature demo, Springs and counters).
- 5.0–8.0 s  Climax: the most spectacular moment, built on 3/4 perspective UI cards and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SAAS PRODUCT MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Figma → After Effects or Rive, React + Framer Motion / CSS springs, Canvas 2D (3D planes as affine cells). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (fictional product, no real logos).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second SaaS Product Motion motion-graphics film (B2B launch film). Visual style: near-black stage under a slow violet–blue–pink gradient mesh, a faint grid, glassy dark cards with 1 px borders and a lit top edge, one violet accent, Geist type with tight tracking, crisp product UI (sidebar, issue rows, command menu, toast) and a cursor as the protagonist. Motion: every arrival is a damped spring with a touch of overshoot; words rise in a 150 ms stagger and sharpen from blur, the window swings from three-quarter view to flat for the demo and back, satellite cards drift at their own depth for parallax, and numbers count up on an ease-out so they land, not stop. Signature moves: 3/4 perspective ui cards, cursor-driven feature demo, springs and counters; transitions: spring-in headline, window rising in perspective, swing to flat and push in, command-menu scale-in, rows re-sorting on a spring, recede and fly-in of stat cards, fly-out to the logo lock-up. In the tradition of Stripe homepage animated gradient (2020) · Linear product launch and changelog films · Vercel Ship launch keynotes (2023 —) · Figma Config keynote product demos (2020 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SAAS PRODUCT MOTION". Punchy sound design synced to every cut.
```

