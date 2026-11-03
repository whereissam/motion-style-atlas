# Ambient Occlusion

*How much sky each point can see · 2001 — · Rendering Looks*

Reference film: `videos/lookao.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Ambient Occlusion** (How much sky each point can see, 2001 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Ambient occlusion approximates the soft darkening of creases and contact points under even sky light by measuring how open each point is, without simulating full global illumination. Zhukov, Iones and Kronin described the related idea of obscurances in 1998; Hayden Landis and colleagues at ILM brought ambient occlusion into feature production around Pearl Harbor (2001) and documented it in the SIGGRAPH 2002 course on production global illumination. Crytek’s screen-space AO in Crysis (2007) made it a real-time staple.
- Study these reference works: Pearl Harbor (Michael Bay, 2001; ILM ambient occlusion) · Crysis (Crytek, 2007; screen-space AO) · StarCraft II (Blizzard, 2010; SSAO in its effects pipeline)
- Motion DNA: The camera makes the shared 50° orbit while the AO radius steps up once per beat, 0.05 to 0.85 world units, with the sample count rising from 3 to 8, then eases back to 0.32. A wipe then carries the pass into the colour render, and a split line slides in from the left to show the same light without AO.
- Visual DNA: A white clay world: white objects and floor with grey contact shadows under the sphere and cube, a soft pool beneath the hovering Token, dark rings in its hole. Sample dots climb the normal by the cube with circles showing the distance field. In the colour half the orange Token, white sphere and blue cube sit firmly on the floor; on the no-AO side they float.
- Signature transitions: Radius steps on the beat; a vertical wipe from pass to colour; a before / after split
- Key techniques: Occlusion sampled along the normal, Radius and sample count, AO multiplies the ambient term

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Occlusion sampled along the normal, Radius and sample count, AO multiplies the ambient term).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Occlusion sampled along the normal and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "AMBIENT OCCLUSION", held for about 1 s.

BUILD RULES
- Suggested tools: Ray-traced AO pass (RenderMan, Arnold, V-Ray), SSAO / HBAO / GTAO on the depth buffer in game engines, Canvas 2D + SDF tracer (js/look-kit.js): N distance-field lookups along the normal per pixel, multiplied into the ambient term. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Ambient Occlusion motion-graphics film (How much sky each point can see). Visual style: a white clay world: white objects and floor with grey contact shadows under the sphere and cube, a soft pool beneath the hovering Token, dark rings in its hole. Sample dots climb the normal by the cube with circles showing the distance field. In the colour half the orange Token, white sphere and blue cube sit firmly on the floor; on the no-AO side they float. Motion: the camera makes the shared 50° orbit while the AO radius steps up once per beat, 0.05 to 0.85 world units, with the sample count rising from 3 to 8, then eases back to 0.32. A wipe then carries the pass into the colour render, and a split line slides in from the left to show the same light without AO. Signature moves: occlusion sampled along the normal, radius and sample count, ao multiplies the ambient term; transitions: radius steps on the beat; a vertical wipe from pass to colour; a before / after split. In the tradition of Pearl Harbor (Michael Bay, 2001; ILM ambient occlusion) · Crysis (Crytek, 2007; screen-space AO) · StarCraft II (Blizzard, 2010; SSAO in its effects pipeline). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "AMBIENT OCCLUSION". Punchy sound design synced to every cut.
```
