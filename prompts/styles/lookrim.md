# Rim Light

*Silhouettes edged by light from behind · 1920s — · Rendering Looks*

Reference film: `videos/lookrim.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Rim Light** (Silhouettes edged by light from behind, 1920s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The back or rim light is one of the three lights of classic Hollywood studio lighting, placed behind and above the subject so a thin edge of light separates it from a dark background; film noir and high-contrast advertising pushed it to the point where the edge is nearly all that is lit. In real-time graphics the effect is often faked with a Fresnel-style term on 1 − N·V, a staple of game and stylised shaders, while offline renderers get it from lights placed behind the subject.
- Study these reference works: The Third Man (Carol Reed, cinematography Robert Krasker, 1949) · Blade Runner (Ridley Scott, cinematography Jordan Cronenweth, 1982) · Apocalypse Now (Francis Ford Coppola, 1979; Vittorio Storaro’s edge-lit Kurtz in darkness)
- Motion DNA: The shared camera orbit over a set lit only from behind. A split wipes the plain render away into black; a white back light swells up and draws thin edges; on the beat the rim width widens to a soft glow, then narrows to a hairline with a sharp falloff; on beat 8 the single white light gives way to a warm rim back-left and a cool rim back-right, and the width settles to a medium band for the end.
- Visual DNA: Near-black set, objects in silhouette, lines of light along every edge that faces a light, long shadows running toward the lens across a dark glossy floor, soft haze glowing round the light sources. Top right: three passes — the edge band, the back-light facing term and their product. Top left: live width, falloff and intensity readouts with bars.
- Signature transitions: Split wipe from the plain render; parameter changes on the beat; white rim crossfades to a warm and cool pair
- Key techniques: Edge band from 1 − N·V, Back-light facing gate, Warm / cool two-rim

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Edge band from 1 − N·V, Back-light facing gate, Warm / cool two-rim).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Edge band from 1 − N·V and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RIM LIGHT", held for about 1 s.

BUILD RULES
- Suggested tools: Rim term: remap(1 − N·V, width)^falloff × N·L of the back light, shadowed, Grazing Blinn-Phong with Schlick Fresnel; analytic point-light in-scattering haze, Canvas 2D + SDF tracer (js/look-kit.js): shadow rays only where a rim or floor pool can appear. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Rim Light motion-graphics film (Silhouettes edged by light from behind). Visual style: near-black set, objects in silhouette, lines of light along every edge that faces a light, long shadows running toward the lens across a dark glossy floor, soft haze glowing round the light sources. Top right: three passes — the edge band, the back-light facing term and their product. Top left: live width, falloff and intensity readouts with bars. Motion: the shared camera orbit over a set lit only from behind. A split wipes the plain render away into black; a white back light swells up and draws thin edges; on the beat the rim width widens to a soft glow, then narrows to a hairline with a sharp falloff; on beat 8 the single white light gives way to a warm rim back-left and a cool rim back-right, and the width settles to a medium band for the end. Signature moves: edge band from 1 − n·v, back-light facing gate, warm / cool two-rim; transitions: split wipe from the plain render; parameter changes on the beat; white rim crossfades to a warm and cool pair. In the tradition of The Third Man (Carol Reed, cinematography Robert Krasker, 1949) · Blade Runner (Ridley Scott, cinematography Jordan Cronenweth, 1982) · Apocalypse Now (Francis Ford Coppola, 1979; Vittorio Storaro’s edge-lit Kurtz in darkness). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RIM LIGHT". Punchy sound design synced to every cut.
```
