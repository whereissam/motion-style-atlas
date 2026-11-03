# Instancing

*One definition, drawn hundreds of times · 2006 — · Technique Atlas*

Reference film: `videos/techinstancing.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Instancing** (One definition, drawn hundreds of times, 2006 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Instancing draws a single stored object many times, each copy differing only by a few per-instance attributes such as position, scale, rotation and colour. GPUs gained hardware instancing in the mid-2000s, and motion designers met the idea through MoGraph’s Cloner in Cinema 4D (2006), which places clones on grids, radial and linear layouts and lets effectors drive their attributes by index.
- Study these reference works: MoGraph Cloner (Cinema 4D, Maxon, 2006) · Houdini copy-to-points and packed primitives (SideFX) · Geometry Nodes Instance on Points (Blender, 2021)
- Motion DNA: A count that explodes: one Token, then instances streaming out of it in index order until the grid is full. After that only one parameter moves, on the beat, and every copy follows it — each starting a little later than the one before, so every change rolls across the set as a wave.
- Visual DNA: Hundreds of identical orange rounded squares with an off-centre hole on a warm paper grid; grids, concentric rings and a golden-angle sunflower spiral; a SOURCE panel holding the single master Token; a mono HUD counting instances and marking the active layout.
- Signature transitions: Clone burst from the master, then index-staggered layout morphs on the bar lines; resolves to a static offset grid
- Key techniques: One sprite, 400 transforms, Layout parameter morph, Index-staggered attributes

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (One sprite, 400 transforms, Layout parameter morph, Index-staggered attributes).
- 5.0–8.0 s  Climax: the most spectacular moment, built on One sprite, 400 transforms and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "INSTANCING", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D MoGraph Cloner + effectors, Houdini copy-to-points / GPU instancing, Canvas 2D: one pre-rendered sprite per colour, stamped with drawImage under per-instance transforms. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Instancing motion-graphics film (One definition, drawn hundreds of times). Visual style: hundreds of identical orange rounded squares with an off-centre hole on a warm paper grid; grids, concentric rings and a golden-angle sunflower spiral; a SOURCE panel holding the single master Token; a mono HUD counting instances and marking the active layout. Motion: a count that explodes: one Token, then instances streaming out of it in index order until the grid is full. After that only one parameter moves, on the beat, and every copy follows it — each starting a little later than the one before, so every change rolls across the set as a wave. Signature moves: one sprite, 400 transforms, layout parameter morph, index-staggered attributes; transitions: clone burst from the master, then index-staggered layout morphs on the bar lines; resolves to a static offset grid. In the tradition of MoGraph Cloner (Cinema 4D, Maxon, 2006) · Houdini copy-to-points and packed primitives (SideFX) · Geometry Nodes Instance on Points (Blender, 2021). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "INSTANCING". Punchy sound design synced to every cut.
```
