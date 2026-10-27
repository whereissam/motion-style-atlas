# De Stijl

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
