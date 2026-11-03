# Toon Ramp

*Quantised N·L, hard specular, G-buffer ink · 2000 — · Rendering Looks*

Reference film: `videos/looktoon.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Toon Ramp** (Quantised N·L, hard specular, G-buffer ink, 2000 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Rendering 3D models to look hand-inked grew out of non-photorealistic rendering research in the 1990s; Lake, Marshall, Harris and Blackstein’s “Stylized Rendering Techniques for Scalable Real-Time 3D Animation” (NPAR 2000) described the now-standard trick of looking N·L up in a small stepped texture. Jet Set Radio (Sega, 2000) brought cel shading with ink outlines to a mass audience, and The Legend of Zelda: The Wind Waker (Nintendo, 2002) made it a house style. Modern anime-style renderers add hand-tuned ramps per material and outlines found from depth, normal and id buffers in post.
- Study these reference works: Jet Set Radio (Smilebit / Sega, 2000) · The Legend of Zelda: The Wind Waker (Nintendo, 2002) · Guilty Gear Xrd (Arc System Works, 2014)
- Motion DNA: The camera makes the same slow 50° orbit. A wipe turns the plain render into flat two-band shading; ink outlines sweep in across the frame; the ramp then steps up to three bands and to four on the beat, each step visible on every surface at once as the Token turns through the light.
- Visual DNA: Flat fills between a cool shade tone and the full albedo, a crisp terminator and hard-edged cast shadows, white specular blobs, a dark ink line around every silhouette, overlap and crease. Insets: the ramp strip (smooth N·L above, the stepped lookup below) and the edge pass coloured by the test that found each line.
- Signature transitions: One wipe from the plain reference; outlines reveal left to right; band count steps 2 → 3 → 4
- Key techniques: N·L ramp lookup, Thresholded specular, Edge detection on G-buffers

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (N·L ramp lookup, Thresholded specular, Edge detection on G-buffers).
- 5.0–8.0 s  Climax: the most spectacular moment, built on N·L ramp lookup and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TOON RAMP", held for about 1 s.

BUILD RULES
- Suggested tools: Blender: Shader to RGB + Color Ramp (constant), Line Art / Freestyle, Unity / Unreal: ramp-texture lookup in a custom lit shader, Sobel outline post-process, Canvas 2D + SDF tracer (js/look-kit.js): half-Lambert N·L quantised to B bands with shadows forced below the terminator, thresholded Blinn, id / depth-plane / normal edge tests on the G-buffer. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Toon Ramp motion-graphics film (Quantised N·L, hard specular, G-buffer ink). Visual style: flat fills between a cool shade tone and the full albedo, a crisp terminator and hard-edged cast shadows, white specular blobs, a dark ink line around every silhouette, overlap and crease. Insets: the ramp strip (smooth N·L above, the stepped lookup below) and the edge pass coloured by the test that found each line. Motion: the camera makes the same slow 50° orbit. A wipe turns the plain render into flat two-band shading; ink outlines sweep in across the frame; the ramp then steps up to three bands and to four on the beat, each step visible on every surface at once as the Token turns through the light. Signature moves: n·l ramp lookup, thresholded specular, edge detection on g-buffers; transitions: one wipe from the plain reference; outlines reveal left to right; band count steps 2 → 3 → 4. In the tradition of Jet Set Radio (Smilebit / Sega, 2000) · The Legend of Zelda: The Wind Waker (Nintendo, 2002) · Guilty Gear Xrd (Arc System Works, 2014). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TOON RAMP". Punchy sound design synced to every cut.
```
