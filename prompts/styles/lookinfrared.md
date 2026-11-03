# Infrared

*False colour: a thermal map and IR colour film · 1940s — · Rendering Looks*

Reference film: `videos/lookinfrared.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Infrared** (False colour: a thermal map and IR colour film, 1940s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: False-colour imaging shows data the eye cannot see by assigning it colours. Thermal cameras record long-wave infrared, roughly 8–14 µm, which every surface emits according to its temperature and emissivity; early military and medical thermographs of the mid-20th century gave way to uncooled microbolometer cameras from the 1990s, whose palettes — ironbow, rainbow, white-hot — are now a familiar look. Infrared colour film works differently: Kodak’s Ektachrome Infrared, later sold as Aerochrome, was developed during the Second World War to detect camouflage, recording near-infrared reflectance as red, red as green and green as blue behind a yellow filter, so living foliage turned red and pink. Both are mappings, which is what this film does with render data.
- Study these reference works: Predator (John McTiernan, 1987; the creature’s thermal vision) · Richard Mosse, The Enclave (2013; Aerochrome infrared film in the eastern Congo) · Richard Mosse, Incoming (2017; military thermal camera footage)
- Motion DNA: The camera makes the shared 50° orbit. A wipe turns the visible render into a thermal image; the scale bar and four spot meters come up one per half beat while the Token warms from 30 to nearly 40 °C; the palette steps from ironbow to rainbow to white-hot and back on the beat, an isotherm above 35 °C lights up, then a second wipe switches to infrared colour film and the film ends on three bands: visible, thermal, infrared.
- Visual DNA: A thermal still life in ironbow: the Token glowing yellow-white with cooler purple edges, warm lit faces against cold shadowed floor, hot contact rings under the sphere and cube, a black cold backdrop; camera-style brackets, crosshair spot meters with °C readouts, a vertical scale bar and input-pass insets. Then a pink-white world with a crimson cube and a green Token, labelled channel by channel.
- Signature transitions: Wipe from visible to thermal, hard palette swaps on the beat, wipe to IR film, three comparison bands
- Key techniques: Temperature assigned from render data, Ironbow / rainbow / white-hot palettes, isotherm, IR → R, R → G, G → B channel shift

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Temperature assigned from render data, Ironbow / rainbow / white-hot palettes, isotherm, IR → R, R → G, G → B channel shift).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Temperature assigned from render data and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "INFRARED", held for about 1 s.

BUILD RULES
- Suggested tools: Thermal camera palettes and isotherms (FLIR-style ironbow LUTs), False-colour channel remapping (Aerochrome emulation in Photoshop or Resolve), Canvas 2D + SDF tracer (js/look-kit.js): per-pixel temperature from id, N·L × shadow, contact and heat-source falloffs, 256-entry palette LUT, seeded sensor noise; IR film as a channel swap of the plain lighting. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (sensor noise seeded by pixel and frame).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Infrared motion-graphics film (False colour: a thermal map and IR colour film). Visual style: a thermal still life in ironbow: the Token glowing yellow-white with cooler purple edges, warm lit faces against cold shadowed floor, hot contact rings under the sphere and cube, a black cold backdrop; camera-style brackets, crosshair spot meters with °C readouts, a vertical scale bar and input-pass insets. Then a pink-white world with a crimson cube and a green Token, labelled channel by channel. Motion: the camera makes the shared 50° orbit. A wipe turns the visible render into a thermal image; the scale bar and four spot meters come up one per half beat while the Token warms from 30 to nearly 40 °C; the palette steps from ironbow to rainbow to white-hot and back on the beat, an isotherm above 35 °C lights up, then a second wipe switches to infrared colour film and the film ends on three bands: visible, thermal, infrared. Signature moves: temperature assigned from render data, ironbow / rainbow / white-hot palettes, isotherm, ir → r, r → g, g → b channel shift; transitions: wipe from visible to thermal, hard palette swaps on the beat, wipe to IR film, three comparison bands. In the tradition of Predator (John McTiernan, 1987; the creature’s thermal vision) · Richard Mosse, The Enclave (2013; Aerochrome infrared film in the eastern Congo) · Richard Mosse, Incoming (2017; military thermal camera footage). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "INFRARED". Punchy sound design synced to every cut.
```
