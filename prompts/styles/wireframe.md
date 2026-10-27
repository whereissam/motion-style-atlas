# Wireframe 3D

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
