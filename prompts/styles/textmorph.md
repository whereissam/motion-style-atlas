# Text Morphing

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
