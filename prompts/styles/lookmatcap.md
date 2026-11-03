# Matcap

*Material capture: shading from a painted sphere · 2001 — · Rendering Looks*

Reference film: `videos/lookmatcap.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Matcap** (Material capture: shading from a painted sphere, 2001 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Peter-Pike Sloan, William Martin, Amy Gooch and Bruce Gooch described "The Lit Sphere" in 2001: an artist paints a sphere, and every point of a model takes the colour of the sphere point with the same view-space normal. Pixologic’s ZBrush popularised the idea as MatCap (material capture) materials for digital sculpting, and it is now standard in sculpting and modelling viewports such as Blender’s, where a matcap shows form instantly without any lights in the scene.
- Study these reference works: The Lit Sphere: A Model for Capturing NPR Shading from Art (Sloan, Martin, Gooch & Gooch, Graphics Interface 2001) · ZBrush MatCap materials (Pixologic) · Blender viewport MatCap shading (Blender 2.8+)
- Motion DNA: The shared camera orbits 50° while the Token turns and bobs. A split wipes from the plain reference to the matcap look and off again; the matcap switches on the beat from red wax to jade to pearl to chrome, crossfading in a fifth of a second, and on the last bar each object takes its own matcap. A tracked sample on the sphere slides across the matcap inset as the camera moves, its leader line linking the surface to the pixel it reads.
- Visual DNA: A dark sculpt-viewport backdrop with a soft centre glow; objects shaded entirely from the painted sphere, the floor only darkened by contact occlusion, so there are no cast shadows. Top right: the matcap sphere with a crosshair at the lookup point; under it a view-space normal pass. Mono readouts give N·right, N·up and the uv they become.
- Signature transitions: Split wipe from the plain render; short crossfades between matcaps on the beat
- Key techniques: View-space normal lookup, Painted lit sphere, Lights baked, camera-locked

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (View-space normal lookup, Painted lit sphere, Lights baked, camera-locked).
- 5.0–8.0 s  Climax: the most spectacular moment, built on View-space normal lookup and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MATCAP", held for about 1 s.

BUILD RULES
- Suggested tools: Lit-sphere / matcap texture lookup by view-space normal, ZBrush MatCap, Blender viewport MatCap, Canvas 2D + SDF tracer (js/look-kit.js): normal → (N·camRight, N·camUp) → bilinear sample of four 192² matcaps painted in setup(). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Matcap motion-graphics film (Material capture: shading from a painted sphere). Visual style: a dark sculpt-viewport backdrop with a soft centre glow; objects shaded entirely from the painted sphere, the floor only darkened by contact occlusion, so there are no cast shadows. Top right: the matcap sphere with a crosshair at the lookup point; under it a view-space normal pass. Mono readouts give N·right, N·up and the uv they become. Motion: the shared camera orbits 50° while the Token turns and bobs. A split wipes from the plain reference to the matcap look and off again; the matcap switches on the beat from red wax to jade to pearl to chrome, crossfading in a fifth of a second, and on the last bar each object takes its own matcap. A tracked sample on the sphere slides across the matcap inset as the camera moves, its leader line linking the surface to the pixel it reads. Signature moves: view-space normal lookup, painted lit sphere, lights baked, camera-locked; transitions: split wipe from the plain render; short crossfades between matcaps on the beat. In the tradition of The Lit Sphere: A Model for Capturing NPR Shading from Art (Sloan, Martin, Gooch & Gooch, Graphics Interface 2001) · ZBrush MatCap materials (Pixologic) · Blender viewport MatCap shading (Blender 2.8+). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MATCAP". Punchy sound design synced to every cut.
```
