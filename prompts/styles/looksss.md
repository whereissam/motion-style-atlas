# Subsurface

*Light that goes in, scatters and comes out somewhere else · 2001 — · Rendering Looks*

Reference film: `videos/looksss.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Subsurface** (Light that goes in, scatters and comes out somewhere else, 2001 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Henrik Wann Jensen, Steve Marschner, Marc Levoy and Pat Hanrahan’s “A Practical Model for Subsurface Light Transport” (SIGGRAPH 2001) made translucent materials — marble, milk, skin — practical to render with a dipole diffusion approximation, work later recognised with a Scientific and Technical Academy Award; translucent skin of this kind went into Gollum in The Lord of the Rings. Real-time engines then approximated it cheaply: texture-space diffusion for skin (NVIDIA’s Human Head demo, 2007), screen-space subsurface scattering (Jorge Jimenez and colleagues, 2009), and the thickness-based translucency Colin Barré-Brisebois and Marc Bouchard presented at GDC 2011 for back-lit thin parts. This look uses wrap lighting plus a traced thickness in that real-time spirit.
- Study these reference works: The Lord of the Rings: The Two Towers (Weta Digital, 2002; Gollum’s translucent skin) · NVIDIA Human Head demo (2007; texture-space diffusion) · “Approximating Translucency for a Fast, Cheap and Convincing Subsurface Scattering Look” (Barré-Brisebois & Bouchard, GDC 2011)
- Motion DNA: The shared 10 s camera orbit with the Token bobbing and turning, which keeps changing how much wax lies between the light and each edge. A wipe turns plain Lambert diffuse into wax and jade under the front key; the light then swings round behind the still life over about two seconds while the studio dims, and the thin parts begin to glow. The scatter radius steps on the beat (0.34 → 0.16 → 0.62 → 0.40), the glow tightening and flooding with it, and a last split brings the plain diffuse back over the right half under the same back light.
- Visual DNA: Honey-orange wax and pale jade on the paper studio: soft terminators that bleed red, warm-edged shadows on the forms, a waxy highlight; then a dim, back-lit studio where the Token’s rim and the ring round its hole burn orange and the jade sphere glows green at its edge, while the opaque blue cube stays dark. A scatter-radius ruler, RGB diffusion profiles, a top-down light plot and thickness and transmission passes.
- Signature transitions: Wipe from diffuse to subsurface; the light swings behind; stepped scatter radius; split back to diffuse
- Key techniques: Per-channel wrap lighting, Traced thickness toward the light, exp(−d / mfp) transmission, red-shifted

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Per-channel wrap lighting, Traced thickness toward the light, exp(−d / mfp) transmission, red-shifted).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Per-channel wrap lighting and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SUBSURFACE", held for about 1 s.

BUILD RULES
- Suggested tools: Dipole diffusion BSSRDF (Jensen et al., 2001) and its descendants in offline renderers (random-walk SSS in Arnold, RenderMan, Cycles), Real-time approximations: wrap lighting, screen-space diffusion, thickness-map translucency, Canvas 2D + SDF tracer (js/look-kit.js): per-channel wrap and shadow exponents, LK.traceInside toward the light for thickness, exp(−d / mfp) per channel with a forward-scatter lobe. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Subsurface motion-graphics film (Light that goes in, scatters and comes out somewhere else). Visual style: honey-orange wax and pale jade on the paper studio: soft terminators that bleed red, warm-edged shadows on the forms, a waxy highlight; then a dim, back-lit studio where the Token’s rim and the ring round its hole burn orange and the jade sphere glows green at its edge, while the opaque blue cube stays dark. A scatter-radius ruler, RGB diffusion profiles, a top-down light plot and thickness and transmission passes. Motion: the shared 10 s camera orbit with the Token bobbing and turning, which keeps changing how much wax lies between the light and each edge. A wipe turns plain Lambert diffuse into wax and jade under the front key; the light then swings round behind the still life over about two seconds while the studio dims, and the thin parts begin to glow. The scatter radius steps on the beat (0.34 → 0.16 → 0.62 → 0.40), the glow tightening and flooding with it, and a last split brings the plain diffuse back over the right half under the same back light. Signature moves: per-channel wrap lighting, traced thickness toward the light, exp(−d / mfp) transmission, red-shifted; transitions: wipe from diffuse to subsurface; the light swings behind; stepped scatter radius; split back to diffuse. In the tradition of The Lord of the Rings: The Two Towers (Weta Digital, 2002; Gollum’s translucent skin) · NVIDIA Human Head demo (2007; texture-space diffusion) · “Approximating Translucency for a Fast, Cheap and Convincing Subsurface Scattering Look” (Barré-Brisebois & Bouchard, GDC 2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SUBSURFACE". Punchy sound design synced to every cut.
```
