# Golden Hour

*Low warm sun, cool sky in the shadows · 1900s — (painting earlier) · Rendering Looks*

Reference film: `videos/lookgolden.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Golden Hour** (Low warm sun, cool sky in the shadows, 1900s — (painting earlier); family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The “magic hour” after sunrise and before sunset was prized by painters long before film — Monet’s Haystacks and Rouen Cathedral series (1890s) chase exactly this light. In cinema it became a signature when Terrence Malick and cinematographer Néstor Almendros shot much of Days of Heaven (1978) in the minutes around sunset; Almendros won the Academy Award for it. In CG the look is a sun direction and a colour temperature: a low key light, a black-body warm colour, and a blue sky dome filling the shadows.
- Study these reference works: Days of Heaven (Terrence Malick, cinematography Néstor Almendros, 1978) · Haystacks series (Claude Monet, 1890–91) · Barry Lyndon (Stanley Kubrick, cinematography John Alcott, 1975)
- Motion DNA: The camera makes the same slow 50° orbit as every look film while the sun sinks from 24° to 5° above the horizon on an ease. Shadow length follows h / tan(elevation), so the shadows stretch across the floor as it drops, and the key warms from about 4900 K to 2700 K. A wipe from the plain studio reference opens the film; readouts and the sun diagram track the change.
- Visual DNA: Warm orange key on every sun-facing face, long soft shadows filled with cool sky blue, a pale-blue-to-peach sky gradient glowing on the sun side, the floor fading into the warm horizon. A small sun/sky diagram and a colour-temperature bar sit top right.
- Signature transitions: One wipe from the plain reference to the look; afterwards a continuous change of sun elevation
- Key techniques: Low directional key, Black-body colour temperature, Blue sky-dome fill

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Low directional key, Black-body colour temperature, Blue sky-dome fill).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Low directional key and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GOLDEN HOUR", held for about 1 s.

BUILD RULES
- Suggested tools: Unreal / Unity: directional light with temperature + sky atmosphere, Blender: Sun lamp with blackbody colour, Nishita sky, Canvas 2D + SDF tracer (js/look-kit.js): a low sun with soft ray-marched shadows, Helland black-body colour, blue sky-dome fill with AO and a gradient sky. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Golden Hour motion-graphics film (Low warm sun, cool sky in the shadows). Visual style: warm orange key on every sun-facing face, long soft shadows filled with cool sky blue, a pale-blue-to-peach sky gradient glowing on the sun side, the floor fading into the warm horizon. A small sun/sky diagram and a colour-temperature bar sit top right. Motion: the camera makes the same slow 50° orbit as every look film while the sun sinks from 24° to 5° above the horizon on an ease. Shadow length follows h / tan(elevation), so the shadows stretch across the floor as it drops, and the key warms from about 4900 K to 2700 K. A wipe from the plain studio reference opens the film; readouts and the sun diagram track the change. Signature moves: low directional key, black-body colour temperature, blue sky-dome fill; transitions: one wipe from the plain reference to the look; afterwards a continuous change of sun elevation. In the tradition of Days of Heaven (Terrence Malick, cinematography Néstor Almendros, 1978) · Haystacks series (Claude Monet, 1890–91) · Barry Lyndon (Stanley Kubrick, cinematography John Alcott, 1975). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GOLDEN HOUR". Punchy sound design synced to every cut.
```
