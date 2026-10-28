# Product Visualization

*Hero Renders on a Seamless Sweep · 2000s — · 3D & CGI Motion*

Reference film: `videos/productviz.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Product Visualization** (Hero Renders on a Seamless Sweep, 2000s —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The CG product film: a manufacturer’s CAD model is lit like a studio photograph — softboxes, strip lights and a seamless sweep — and turned slowly in front of the camera, so every edge reads as a line of light. It grew out of industrial-design rendering (Alias, later KeyShot and Octane) and was set as a genre by Apple’s product films from the 2000s on, then by the launch reels every phone, watch, headphone and sneaker brand now commissions.
- Study these reference works: Mac Pro reveal film (Apple, WWDC 2013) · Introducing Apple Watch (Apple, 2014) · Introducing iPhone X (Apple, 2017) · KeyShot renderer (Luxion, 2010)
- Motion DNA: Slow, weightless turntable rotation with long eases, light sweeping across edges rather than the object moving fast; a precise exploded-view separation that decelerates into place, holds for callouts, and snaps back together with a tiny settle.
- Visual DNA: A single hero object floating over a black-to-charcoal seamless sweep with a soft mirror floor; rim strips draw the silhouette in thin lines of light, big softboxes slide across glass as clean gradients, anodised colour, minimal thin sans type and hairline callouts.
- Signature transitions: Light-sweep reveal, turntable orbit, explode and collapse, screen wake, push to hero 3/4
- Key techniques: Area-light reflections on metal, Planar softbox mirrors in glass, Turntable orbit + exploded layers

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Area-light reflections on metal, Planar softbox mirrors in glass, Turntable orbit + exploded layers).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Area-light reflections on metal and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PRODUCT VISUALIZATION", held for about 1 s.

BUILD RULES
- Suggested tools: KeyShot / Octane / Redshift turntables, Cinema 4D or Blender with HDRI softbox rigs, CAD data (STEP) retopologised for render, Canvas 2D: CPU projection, area-light hit tests per band quad, mirrored softbox quads on caps, mirrored-camera floor pass. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Product Visualization motion-graphics film (Hero Renders on a Seamless Sweep). Visual style: a single hero object floating over a black-to-charcoal seamless sweep with a soft mirror floor; rim strips draw the silhouette in thin lines of light, big softboxes slide across glass as clean gradients, anodised colour, minimal thin sans type and hairline callouts. Motion: slow, weightless turntable rotation with long eases, light sweeping across edges rather than the object moving fast; a precise exploded-view separation that decelerates into place, holds for callouts, and snaps back together with a tiny settle. Signature moves: area-light reflections on metal, planar softbox mirrors in glass, turntable orbit + exploded layers; transitions: light-sweep reveal, turntable orbit, explode and collapse, screen wake, push to hero 3/4. In the tradition of Mac Pro reveal film (Apple, WWDC 2013) · Introducing Apple Watch (Apple, 2014) · Introducing iPhone X (Apple, 2017) · KeyShot renderer (Luxion, 2010). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PRODUCT VISUALIZATION". Punchy sound design synced to every cut.
```
