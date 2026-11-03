# Three-point Studio

*Key, fill and back light · 1920s — · Rendering Looks*

Reference film: `videos/lookstudio.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Three-point Studio** (Key, fill and back light, 1920s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Three-point lighting comes from the Hollywood studio system of the 1920s and 1930s, where cinematographers lit stars with a hard key light, a softer fill to control contrast and a back light to lift the figure off the set; portrait and product photographers adopted the same plot, and the key:fill ratio became the standard way to describe contrast. In computer graphics the same three lights are the default starting rig for lighting a model or a product render.
- Study these reference works: Shanghai Express (Josef von Sternberg, cinematography Lee Garmes, 1932) · Citizen Kane (Orson Welles, cinematography Gregg Toland, 1941) · Casablanca (Michael Curtiz, 1942; Arthur Edeson’s Hollywood portrait lighting)
- Motion DNA: The shared camera orbit with the lights fixed in the world, so the angle each light makes with the lens changes as the camera moves (the plot reads it live). The set starts dark; the key snaps on with a brief strobe flicker on beat 1, the fill fades up over most of a second on beat 5 while the key:fill ratio counts down from infinity to 3:1, the back light snaps on at beat 9, and on beat 12 the backdrop is lit and a soft bounce fills in for the finished product shot.
- Visual DNA: A black studio with three pools of light on a grey floor, warm key, cool fill, white back. Each light casts its own shadow, the fill’s soft and pale. Top right: a top-view light plot with cones, the camera wedge and live angles; under it the key:fill ratio. Bottom right: one thumbnail per light, adding up to the beauty render.
- Signature transitions: Lights switched on one at a time on the beat; a final lift into the product look
- Key techniques: Key / fill / back spotlights, Per-light soft shadows, Key:fill ratio

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Key / fill / back spotlights, Per-light soft shadows, Key:fill ratio).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Key / fill / back spotlights and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "THREE-POINT STUDIO", held for about 1 s.

BUILD RULES
- Suggested tools: Three spotlights with smooth cone falloff and inverse-square attenuation, Lambert + Blinn-Phong with a Fresnel boost, ACES-style tone map, Canvas 2D + SDF tracer (js/look-kit.js): one soft-shadow ray per light per pixel, skipped outside each cone. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Three-point Studio motion-graphics film (Key, fill and back light). Visual style: a black studio with three pools of light on a grey floor, warm key, cool fill, white back. Each light casts its own shadow, the fill’s soft and pale. Top right: a top-view light plot with cones, the camera wedge and live angles; under it the key:fill ratio. Bottom right: one thumbnail per light, adding up to the beauty render. Motion: the shared camera orbit with the lights fixed in the world, so the angle each light makes with the lens changes as the camera moves (the plot reads it live). The set starts dark; the key snaps on with a brief strobe flicker on beat 1, the fill fades up over most of a second on beat 5 while the key:fill ratio counts down from infinity to 3:1, the back light snaps on at beat 9, and on beat 12 the backdrop is lit and a soft bounce fills in for the finished product shot. Signature moves: key / fill / back spotlights, per-light soft shadows, key:fill ratio; transitions: lights switched on one at a time on the beat; a final lift into the product look. In the tradition of Shanghai Express (Josef von Sternberg, cinematography Lee Garmes, 1932) · Citizen Kane (Orson Welles, cinematography Gregg Toland, 1941) · Casablanca (Michael Curtiz, 1942; Arthur Edeson’s Hollywood portrait lighting). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "THREE-POINT STUDIO". Punchy sound design synced to every cut.
```
