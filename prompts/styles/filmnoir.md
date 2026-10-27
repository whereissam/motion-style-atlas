# Film Noir

*Light and Shadow · 1941 — · Cinematic & Film Language*

Reference film: `videos/filmnoir.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Film Noir** (Light and Shadow, 1941 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Hollywood crime pictures of the 1940s and 50s, shot by cinematographers such as John Alton and Robert Krasker, borrowed German Expressionist chiaroscuro: hard single-source light, deep shadow and oblique angles. French critic Nino Frank named the cycle "film noir" in 1946, and neo-noir and title designers have quoted its look ever since.
- Study these reference works: The Maltese Falcon (John Huston, 1941) · Double Indemnity (Billy Wilder, 1944) · Murder, My Sweet (Edward Dmytryk, 1944) · The Big Combo (Joseph H. Lewis, 1955) · The Third Man (Carol Reed, 1949) · Touch of Evil (Orson Welles, 1958) · Sin City (Robert Rodriguez, 2005)
- Motion DNA: Slow push-ins on Dutch angles while the light itself moves: a passing car sweeps blind shadows across the room, a door swings open to throw a wedge of light, and a lamp flickers out.
- Visual DNA: Hard chiaroscuro in black and white: venetian-blind slats, silhouettes in doorways, rain lit only inside a lamp cone, wet cobbles, curling smoke, heavy grain and a deco serif title.
- Signature transitions: Hard cut, silhouette wipe (a figure walks into the lens), lamp-out to black, blind-shadow wipe onto the title.
- Key techniques: Light-map compositing: blind patterns multiplied over albedo, Procedural turbulent smoke lit by the slats it crosses, Silhouette shadows cast by affine projection, Film grain, gate flicker, dust and vignette

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Light-map compositing: blind patterns multiplied over albedo, Procedural turbulent smoke lit by the slats it crosses, Silhouette shadows cast by affine projection, Film grain, gate flicker, dust and vignette).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Light-map compositing: blind patterns multiplied over albedo and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FILM NOIR", held for about 1 s.

BUILD RULES
- Suggested tools: Live action, Blender, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Film Noir motion-graphics film (Light and Shadow). Visual style: hard chiaroscuro in black and white: venetian-blind slats, silhouettes in doorways, rain lit only inside a lamp cone, wet cobbles, curling smoke, heavy grain and a deco serif title. Motion: slow push-ins on Dutch angles while the light itself moves: a passing car sweeps blind shadows across the room, a door swings open to throw a wedge of light, and a lamp flickers out. Signature moves: light-map compositing: blind patterns multiplied over albedo, procedural turbulent smoke lit by the slats it crosses, silhouette shadows cast by affine projection, film grain, gate flicker, dust and vignette; transitions: hard cut, silhouette wipe (a figure walks into the lens), lamp-out to black, blind-shadow wipe onto the title. In the tradition of The Maltese Falcon (John Huston, 1941) · Double Indemnity (Billy Wilder, 1944) · Murder, My Sweet (Edward Dmytryk, 1944) · The Big Combo (Joseph H. Lewis, 1955) · The Third Man (Carol Reed, 1949) · Touch of Evil (Orson Welles, 1958) · Sin City (Robert Rodriguez, 2005). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FILM NOIR". Punchy sound design synced to every cut.
```
