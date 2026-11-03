# Iridescence

*Thin-film interference: colour from thickness and angle · 1704 / 1990s — · Rendering Looks*

Reference film: `videos/lookiridescent.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Iridescence** (Thin-film interference: colour from thickness and angle, 1704 / 1990s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Robert Hooke described the colours of thin plates in Micrographia (1665), and Isaac Newton measured them in Opticks (1704) — Newton’s rings, where colour follows the thickness of a film of air. Thomas Young explained them by interference around 1801: light reflected from the top and the bottom of a film recombines in or out of phase depending on the extra path 2·n·d·cos θ and the wavelength. Spectral and wave-optics renderers simulate it directly; production shaders approximate it, and Laurent Belcour and Pascal Barla’s “A Practical Extension to Microfacet Theory for the Modeling of Varying Iridescence” (SIGGRAPH 2017) made thin-film colour a standard layer of physically based materials.
- Study these reference works: Newton’s rings (Isaac Newton, Opticks, 1704) · Favrile glass (Louis Comfort Tiffany, 1890s; iridescent art glass) · Belcour & Barla, “A Practical Extension to Microfacet Theory for the Modeling of Varying Iridescence” (SIGGRAPH 2017)
- Motion DNA: The shared camera orbit sweeps the view angle across every surface, so bands of colour slide over the bevels of the Token and round the bubble as the camera moves. A wipe turns the plain paper studio into a dark set with a soap-bubble sphere and a beetle-shell Token; the film thickness then steps on the beat (420 → 250 → 560 → 780 → 430 nm), recolouring both at once, and the thickness noise grows from ±70 to ±170 nm while the bubble’s film drains and swirls faster.
- Visual DNA: A near-black studio with softbox reflections: a nearly invisible bubble drawn only by its reflections — magenta, gold, green and blue bands, darker at the thin top, the softboxes doubled on the front and back walls — and a dark Token whose lacquer glows through gold, violet and teal with angle. An interference-colour chart as the thickness ruler, a hue-vs-angle strip, thickness and view-angle passes.
- Signature transitions: Wipe from the plain studio to the dark set; beat-stepped film thickness; thickness noise ramp
- Key techniques: Two-beam Airy reflectance per λ, Spectral → RGB via CIE fits, LUT d × θ, Thickness noise, draining, swirl

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Two-beam Airy reflectance per λ, Spectral → RGB via CIE fits, LUT d × θ, Thickness noise, draining, swirl).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Two-beam Airy reflectance per λ and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "IRIDESCENCE", held for about 1 s.

BUILD RULES
- Suggested tools: Thin-film interference layers in production shaders (e.g. Arnold and RenderMan thin-film parameters, Belcour & Barla 2017), Spectral rendering and CIE colour-matching functions (analytic fits by Wyman, Sloan and Shirley, 2013), Canvas 2D + SDF tracer (js/look-kit.js): Airy two-beam reflectance over 35 wavelengths into a thickness × cos θ LUT, traced reflection, straight-through bubble with front- and back-wall films. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Iridescence motion-graphics film (Thin-film interference: colour from thickness and angle). Visual style: a near-black studio with softbox reflections: a nearly invisible bubble drawn only by its reflections — magenta, gold, green and blue bands, darker at the thin top, the softboxes doubled on the front and back walls — and a dark Token whose lacquer glows through gold, violet and teal with angle. An interference-colour chart as the thickness ruler, a hue-vs-angle strip, thickness and view-angle passes. Motion: the shared camera orbit sweeps the view angle across every surface, so bands of colour slide over the bevels of the Token and round the bubble as the camera moves. A wipe turns the plain paper studio into a dark set with a soap-bubble sphere and a beetle-shell Token; the film thickness then steps on the beat (420 → 250 → 560 → 780 → 430 nm), recolouring both at once, and the thickness noise grows from ±70 to ±170 nm while the bubble’s film drains and swirls faster. Signature moves: two-beam airy reflectance per λ, spectral → rgb via cie fits, lut d × θ, thickness noise, draining, swirl; transitions: wipe from the plain studio to the dark set; beat-stepped film thickness; thickness noise ramp. In the tradition of Newton’s rings (Isaac Newton, Opticks, 1704) · Favrile glass (Louis Comfort Tiffany, 1890s; iridescent art glass) · Belcour & Barla, “A Practical Extension to Microfacet Theory for the Modeling of Varying Iridescence” (SIGGRAPH 2017). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "IRIDESCENCE". Punchy sound design synced to every cut.
```
