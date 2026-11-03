# Destruction

*Voronoi fracture and rewind · 1999 — · Technique Atlas*

Reference film: `videos/techdestruction.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Destruction** (Voronoi fracture and rewind, 1999 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Destruction effects break a solid into pieces and hand them to a rigid-body solver. James O’Brien and Jessica Hodgins simulated brittle fracture from stress in 1999 (ductile fracture followed in 2002); production and games mostly pre-fracture instead, cutting the model into Voronoi cells around scattered points, as in Houdini’s Voronoi Fracture, 3ds Max RayFire and Blender’s Cell Fracture, while Pixelux’s Digital Molecular Matter and Volition’s GeoMod brought dynamic breakage to consoles.
- Study these reference works: Star Wars: The Force Unleashed (LucasArts, 2008; Pixelux DMM) · Red Faction: Guerrilla (Volition, 2009; GeoMod 2.0) · Teardown (Tuxedo Labs, 2020)
- Motion DNA: A beat of stillness, a heavy ball arcs in and connects on the downbeat; time drops to a quarter speed as the cracks open, then catches up while shards spray, spin and rain down, bouncing and skidding to rest. After a held beat the clock runs backwards, slow, then fast, then easing, until every shard drops back into its cell and the Token clicks whole.
- Visual DNA: Warm paper studio with a grid and floor line; the orange Token cut into angular Voronoi shards with darker fracture faces, small dust specks, a matte black ball, soft contact shadows; a mono simulation clock top right that reads SLOW and REWIND; a sim-time graph in the corner showing the remap.
- Signature transitions: Strike, scatter, settle; a rewind reassembles the subject and the word appears over it
- Key techniques: Seeded Voronoi pre-fracture, Shard impulses, spin, floor bounce, Time remap: slow-mo and rewind

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Seeded Voronoi pre-fracture, Shard impulses, spin, floor bounce, Time remap: slow-mo and rewind).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Seeded Voronoi pre-fracture and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DESTRUCTION", held for about 1 s.

BUILD RULES
- Suggested tools: Voronoi cells by half-plane clipping, drawn as clipped windows onto the Token path, Per-shard rigid integration with vertex–floor impulses, precomputed in setup, Eased playback remap of the cached simulation. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Destruction motion-graphics film (Voronoi fracture and rewind). Visual style: warm paper studio with a grid and floor line; the orange Token cut into angular Voronoi shards with darker fracture faces, small dust specks, a matte black ball, soft contact shadows; a mono simulation clock top right that reads SLOW and REWIND; a sim-time graph in the corner showing the remap. Motion: a beat of stillness, a heavy ball arcs in and connects on the downbeat; time drops to a quarter speed as the cracks open, then catches up while shards spray, spin and rain down, bouncing and skidding to rest. After a held beat the clock runs backwards, slow, then fast, then easing, until every shard drops back into its cell and the Token clicks whole. Signature moves: seeded voronoi pre-fracture, shard impulses, spin, floor bounce, time remap: slow-mo and rewind; transitions: strike, scatter, settle; a rewind reassembles the subject and the word appears over it. In the tradition of Star Wars: The Force Unleashed (LucasArts, 2008; Pixelux DMM) · Red Faction: Guerrilla (Volition, 2009; GeoMod 2.0) · Teardown (Tuxedo Labs, 2020). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DESTRUCTION". Punchy sound design synced to every cut.
```
