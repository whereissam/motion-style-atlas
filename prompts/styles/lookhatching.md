# Cross-Hatching

*Tone built from layers of pen strokes · 1500s — · Rendering Looks*

Reference film: `videos/lookhatching.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cross-Hatching** (Tone built from layers of pen strokes, 1500s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Hatching and cross-hatching — building tone from layers of parallel lines — come from engraving and pen drawing: Albrecht Dürer’s woodcuts and engravings of the 1490s–1510s set the standard, and the same vocabulary runs through etching and nineteenth-century wood engraving. In computer graphics, Winkenbach and Salesin’s “Computer-Generated Pen-and-Ink Illustration” (SIGGRAPH 1994) rendered tone with stroke textures, and Praun, Hoppe, Webb and Finkelstein’s “Real-Time Hatching” (SIGGRAPH 2001) introduced tonal art maps, layered hatch textures that blend by tone on the surface.
- Study these reference works: Melencolia I (Albrecht Dürer, engraving, 1514) · Winkenbach & Salesin, “Computer-Generated Pen-and-Ink Illustration” (SIGGRAPH 1994) · Melencolia I (Albrecht Dürer, 1514; engraved cross-hatching)
- Motion DNA: The shared 50° orbit with the Token turning through the light, so strokes appear and disappear as its faces darken past each threshold. A wipe turns the plain render into ink; the hatch first holds still on the screen while the objects slide under it, then a second wipe pins the strokes to each object so they ride along with the turn; a last wipe lays a pale watercolour wash under the ink.
- Visual DNA: Warm cream paper with faint fibres; near-black violet ink in wobbly, broken strokes at three angles, sparse single hatching on the half-tones, cross-hatching in the core shadows, triple hatching in the cast shadows; firm outlines around every silhouette and crease; at the end a light orange, grey and blue wash. Insets: the tone pass and the tone → layers ramp with its three thresholds.
- Signature transitions: Wipe from the plain render to ink; wipe from screen-space to object-space strokes; wipe to ink + wash
- Key techniques: Tone → hatch layers (1, 2, 3 directions), Screen-space vs object-space strokes, G-buffer ink outlines on paper

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Tone → hatch layers (1, 2, 3 directions), Screen-space vs object-space strokes, G-buffer ink outlines on paper).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Tone → hatch layers (1, 2, 3 directions) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CROSS-HATCHING", held for about 1 s.

BUILD RULES
- Suggested tools: Tonal art maps (Praun et al. 2001): hatch textures layered by tone, Blender: Freestyle / Line Art outlines + hatch textures in a ramp; pen-and-ink shaders in Unity / Unreal, Canvas 2D + SDF tracer (js/look-kit.js): tone from N·L × shadow + AO sky, three thresholded line layers with width ∝ darkness, wobble and breaks from seeded noise, dominant-axis planar projection for object space, id / depth-plane / normal edges, seeded paper. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cross-Hatching motion-graphics film (Tone built from layers of pen strokes). Visual style: warm cream paper with faint fibres; near-black violet ink in wobbly, broken strokes at three angles, sparse single hatching on the half-tones, cross-hatching in the core shadows, triple hatching in the cast shadows; firm outlines around every silhouette and crease; at the end a light orange, grey and blue wash. Insets: the tone pass and the tone → layers ramp with its three thresholds. Motion: the shared 50° orbit with the Token turning through the light, so strokes appear and disappear as its faces darken past each threshold. A wipe turns the plain render into ink; the hatch first holds still on the screen while the objects slide under it, then a second wipe pins the strokes to each object so they ride along with the turn; a last wipe lays a pale watercolour wash under the ink. Signature moves: tone → hatch layers (1, 2, 3 directions), screen-space vs object-space strokes, g-buffer ink outlines on paper; transitions: wipe from the plain render to ink; wipe from screen-space to object-space strokes; wipe to ink + wash. In the tradition of Melencolia I (Albrecht Dürer, engraving, 1514) · Winkenbach & Salesin, “Computer-Generated Pen-and-Ink Illustration” (SIGGRAPH 1994) · Melencolia I (Albrecht Dürer, 1514; engraved cross-hatching). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CROSS-HATCHING". Punchy sound design synced to every cut.
```
