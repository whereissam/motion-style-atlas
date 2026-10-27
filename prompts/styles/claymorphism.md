# Claymorphism

*Inflated Soft UI · 2021 — · 3D & CGI Motion*

Reference film: `videos/claymorphism.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Claymorphism** (Inflated Soft UI, 2021 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A UI and 3D-illustration trend that followed skeuomorphism (2000s), flat design (2013) and neumorphism (2020): puffy, matte, pastel objects that look inflated or moulded from soft clay, faked in CSS with an outer drop shadow plus two inset shadows. Michał Malewicz of Hype4 named and documented it in 2021, riding the wave of Blender-made 3D icon packs.
- Study these reference works: Michał Malewicz / Hype4 — "Claymorphism in user interfaces" (2021) · Blender 3D icon & illustration packs on Dribbble and Figma Community (2021—) · Microsoft Fluent 3D emoji (2021) · clay.css (Adrian Bece, 2022) · countless 3D onboarding illustrations in fintech and wellness apps
- Motion DNA: Everything is soft and springy: objects drop, squash on contact and overshoot on low-damped springs; buttons physically compress when pressed and icons drift and bob as if filled with air.
- Visual DNA: Puffy pastel shapes with rounded corners, a bright inner highlight top-left and a tinted inner shadow bottom-right, floating above a pale gradient on large soft coloured drop shadows.
- Signature transitions: Drop and bounce, blob-to-card inflate, spring pop-in, press squash, burst into pebbles
- Key techniques: Outer drop shadow + two inset shadows, Inflated rounded geometry, Pastel matte palette, Spring squash & stretch

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Outer drop shadow + two inset shadows, Inflated rounded geometry, Pastel matte palette, Spring squash & stretch).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Outer drop shadow + two inset shadows and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CLAYMORPHISM", held for about 1 s.

BUILD RULES
- Suggested tools: CSS box-shadow (outer + 2× inset), Figma / Spline, Blender, Canvas 2D (shadow compositing). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Claymorphism motion-graphics film (Inflated Soft UI). Visual style: puffy pastel shapes with rounded corners, a bright inner highlight top-left and a tinted inner shadow bottom-right, floating above a pale gradient on large soft coloured drop shadows. Motion: everything is soft and springy: objects drop, squash on contact and overshoot on low-damped springs; buttons physically compress when pressed and icons drift and bob as if filled with air. Signature moves: outer drop shadow + two inset shadows, inflated rounded geometry, pastel matte palette, spring squash & stretch; transitions: drop and bounce, blob-to-card inflate, spring pop-in, press squash, burst into pebbles. In the tradition of Michał Malewicz / Hype4 — "Claymorphism in user interfaces" (2021) · Blender 3D icon & illustration packs on Dribbble and Figma Community (2021—) · Microsoft Fluent 3D emoji (2021) · clay.css (Adrian Bece, 2022) · countless 3D onboarding illustrations in fintech and wellness apps. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CLAYMORPHISM". Punchy sound design synced to every cut.
```
