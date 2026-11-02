# Bloom

*Threshold, blur, add back · 1982 — · Technique Atlas*

Reference film: `videos/techbloom.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Bloom** (Threshold, blur, add back, 1982 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Bright light spreads in a lens and in film emulsion (halation), so overexposed highlights photograph with a soft halo. Tron (1982) got its glowing circuitry from backlit animation photographed through coloured filters. Real-time graphics rebuilt the look as a post-process — threshold the frame, blur the bright pass, add it back: Masaki Kawase’s GDC 2003 talk on Wreckless described stacking blurs of downsampled buffers, GPU Gems (2004) described the glow of Tron 2.0, and HDR bloom became standard in games from Half-Life 2: Lost Coast (2005) on. After Effects’ Glow effect exposes the same three controls: threshold, radius and intensity.
- Study these reference works: Tron (Steven Lisberger, Disney, 1982) · Ico (Team Ico, Sony, 2001) · Tron 2.0 (Monolith Productions, 2003)
- Motion DNA: Nothing in the picture moves; the pipeline does. An iris opens from the Token into a dark stage, then each pass takes about a bar and a half: the threshold sweeps up until only the hottest rim survives and down until even the word glows, the four blur levels fade in one per half-beat from tight to wide, the sum is added back. Then one parameter at a time — an intensity pulse, a radius squeeze and stretch, a threshold dip — before the iris closes onto paper.
- Visual DNA: The Technique Atlas stage turned into a dark rounded panel (#111216) with a faint grid; the Token in a hotter orange with a white-hot rim around its hole, MOTION in mid grey, a row of five grey lamps from luma 0.2 to 1.0 over a luma axis with an orange threshold marker. Right-hand pipeline thumbnails (source, bright pass on black, a 2×2 pyramid of blurs labelled by radius), three sliders in the top band, white callouts that light up when an element passes the threshold.
- Signature transitions: Iris from paper into the dark stage and back; cross-fades from pass to pass in the main view
- Key techniques: Soft-knee threshold, Blur pyramid · 4 radii, Additive composite

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Soft-knee threshold, Blur pyramid · 4 radii, Additive composite).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Soft-knee threshold and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "BLOOM", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects Glow (threshold · radius · intensity), Nuke Glow / Bloom, Game engines: HDR bright pass + downsampled Gaussian or Kawase blur chain, added before tone mapping, Canvas 2D: bright pass and four filter-blur levels on 320×180 offscreen canvases, drawn back with lighter compositing. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Bloom motion-graphics film (Threshold, blur, add back). Visual style: the Technique Atlas stage turned into a dark rounded panel (#111216) with a faint grid; the Token in a hotter orange with a white-hot rim around its hole, MOTION in mid grey, a row of five grey lamps from luma 0.2 to 1.0 over a luma axis with an orange threshold marker. Right-hand pipeline thumbnails (source, bright pass on black, a 2×2 pyramid of blurs labelled by radius), three sliders in the top band, white callouts that light up when an element passes the threshold. Motion: nothing in the picture moves; the pipeline does. An iris opens from the Token into a dark stage, then each pass takes about a bar and a half: the threshold sweeps up until only the hottest rim survives and down until even the word glows, the four blur levels fade in one per half-beat from tight to wide, the sum is added back. Then one parameter at a time — an intensity pulse, a radius squeeze and stretch, a threshold dip — before the iris closes onto paper. Signature moves: soft-knee threshold, blur pyramid · 4 radii, additive composite; transitions: iris from paper into the dark stage and back; cross-fades from pass to pass in the main view. In the tradition of Tron (Steven Lisberger, Disney, 1982) · Ico (Team Ico, Sony, 2001) · Tron 2.0 (Monolith Productions, 2003). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "BLOOM". Punchy sound design synced to every cut.
```
