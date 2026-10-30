# Cloth

*Mass-spring sheet in the wind · 1986 — · Technique Atlas*

Reference film: `videos/techcloth.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cloth** (Mass-spring sheet in the wind, 1986 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Cloth simulation treats fabric as a grid of point masses joined by springs or distance constraints for stretch, shear and bending. Jerry Weil hung cloth from fixed points in 1986, Terzopoulos, Platt, Barr and Fleischer’s Elastically Deformable Models (1987) put physically based deformation into graphics, Baraff and Witkin’s Large Steps in Cloth Simulation (1998) made stiff cloth stable with implicit integration, and Thomas Jakobsen’s Verlet-and-constraints scheme (GDC 2001, from IO Interactive’s Hitman) made it cheap enough for real time.
- Study these reference works: Geri’s Game (Pixar, 1997) · Monsters, Inc. (Pixar, 2001) · Hitman: Codename 47 (IO Interactive, 2000)
- Motion DNA: A sheet hangs slack from two pins and breathes; wind gusts land on the beat and roll through it as travelling billows, the print stretching and folding with the fabric. The right pin lets go and the cloth swings down hanging from one corner, flapping; the left pin lets go and it slumps to the floor in folds, settling with friction.
- Visual DNA: Warm paper studio with a grid and floor line; an off-white sheet with a stitched hem printed with the orange Token and MOTION, shaded per quad from a single soft key light, its darker reverse side showing where it folds; two thin cords to the ceiling; the solid orange Token standing behind it.
- Signature transitions: Hidden behind the sheet, glimpsed through gusts, revealed when the pins release; the word rises over the uncovered Token
- Key techniques: Verlet particles + distance constraints, Wind force along each quad normal, Pin release, floor and body collision

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Verlet particles + distance constraints, Wind force along each quad normal, Pin release, floor and body collision).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Verlet particles + distance constraints and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CLOTH", held for about 1 s.

BUILD RULES
- Suggested tools: Position-based Verlet cloth precomputed in setup (6 substeps, 3 constraint passes), Affine texture-mapped triangles in Canvas 2D, depth-sorted, Wind as normal-projected drag with value-noise turbulence. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cloth motion-graphics film (Mass-spring sheet in the wind). Visual style: warm paper studio with a grid and floor line; an off-white sheet with a stitched hem printed with the orange Token and MOTION, shaded per quad from a single soft key light, its darker reverse side showing where it folds; two thin cords to the ceiling; the solid orange Token standing behind it. Motion: a sheet hangs slack from two pins and breathes; wind gusts land on the beat and roll through it as travelling billows, the print stretching and folding with the fabric. The right pin lets go and the cloth swings down hanging from one corner, flapping; the left pin lets go and it slumps to the floor in folds, settling with friction. Signature moves: verlet particles + distance constraints, wind force along each quad normal, pin release, floor and body collision; transitions: hidden behind the sheet, glimpsed through gusts, revealed when the pins release; the word rises over the uncovered Token. In the tradition of Geri’s Game (Pixar, 1997) · Monsters, Inc. (Pixar, 2001) · Hitman: Codename 47 (IO Interactive, 2000). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CLOTH". Punchy sound design synced to every cut.
```
