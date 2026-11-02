# Glitch

*Broken signal as a transition: split, shift, tear, quantise · 1990s — · Technique Atlas*

Reference film: `videos/techglitch.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Glitch** (Broken signal as a transition: split, shift, tear, quantise, 1990s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Glitch borrows the faults of electronic images — analogue sync tearing, misaligned colour channels, digital compression blocks — and stages them on purpose. Glitch music and art of the 1990s and 2000s made the error an aesthetic, Takeshi Murata’s Monster Movie (2005) pushed datamoshing (deleting the key frames of a compressed video so motion smears one picture into the next) into galleries, and Kanye West’s Welcome to Heartbreak video (2009) took it into the mainstream; editors now hide cuts inside RGB splits and block shifts from preset packs.
- Study these reference works: Monster Movie (Takeshi Murata, 2005; datamosh) · Welcome to Heartbreak, Kanye West (dir. Nabil Elderkin, 2009) · Chairlift, Evident Utensil (dir. Ray Tintori, 2009; datamosh)
- Motion DNA: Clean holds, then one bar of breakage per transition: the glitch amount swells and decays across eight sixteenths, jumping to a new seeded value on each one, with the hard cut landing on the beat in the middle where the damage is worst. Four operations arrive one transition at a time — channels split, slices shift, rows tear, blocks freeze and drag — and the last transition stacks all four before the final state settles clean.
- Visual DNA: The Technique Atlas stage with the picture framed in ink at the centre; Token states in orange, ink, blue and paper colourways; red and blue fringes, sideways-shifted bands, torn scanlines and a coarse block mosaic; a left-hand operation stack with live parameters and amount bars; slice and row offset charts on the right aligned to the picture; a sixteenth-note amount strip with the cut under the picture.
- Signature transitions: Glitch cuts: RGB split, block displacement, scanline tear, quantise hold, then all four stacked
- Key techniques: RGB channel offset, Seeded slice displacement, Quantised datamosh hold

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (RGB channel offset, Seeded slice displacement, Quantised datamosh hold).
- 5.0–8.0 s  Climax: the most spectacular moment, built on RGB channel offset and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GLITCH", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects / Premiere glitch presets (channel offset, displacement, mosaic), Datamosh: dropped I-frames in compressed video (Avidemux), Canvas 2D: slice drawImage, multiply + lighter channel split, 48×27 mosaic upscaled. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural with seeded hash noise.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Glitch motion-graphics film (Broken signal as a transition: split, shift, tear, quantise). Visual style: the Technique Atlas stage with the picture framed in ink at the centre; Token states in orange, ink, blue and paper colourways; red and blue fringes, sideways-shifted bands, torn scanlines and a coarse block mosaic; a left-hand operation stack with live parameters and amount bars; slice and row offset charts on the right aligned to the picture; a sixteenth-note amount strip with the cut under the picture. Motion: clean holds, then one bar of breakage per transition: the glitch amount swells and decays across eight sixteenths, jumping to a new seeded value on each one, with the hard cut landing on the beat in the middle where the damage is worst. Four operations arrive one transition at a time — channels split, slices shift, rows tear, blocks freeze and drag — and the last transition stacks all four before the final state settles clean. Signature moves: rgb channel offset, seeded slice displacement, quantised datamosh hold; transitions: glitch cuts: RGB split, block displacement, scanline tear, quantise hold, then all four stacked. In the tradition of Monster Movie (Takeshi Murata, 2005; datamosh) · Welcome to Heartbreak, Kanye West (dir. Nabil Elderkin, 2009) · Chairlift, Evident Utensil (dir. Ray Tintori, 2009; datamosh). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GLITCH". Punchy sound design synced to every cut.
```
