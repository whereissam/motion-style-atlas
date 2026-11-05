# Motion Style Atlas — TODO

Current build: 277 films (157 styles: original 22 + priority 30 + wave 3 15 + wave 4 15 + wave 5 15 + wave 6 15 + wave 7 15 + wave 8 15 + wave 9 15; plus 60 Technique Atlas films in waves 10–13, 30 Rendering Looks in waves 14–15 and 30 Narrative Formats in waves 16–17). Checked items below are done; Web 1.0 is covered by the Webcore film.
Everything below is queued for later waves. Each item = one 10-second procedural film + card + atlas entry.

## Visual styles still to build

### A. Graphic Design & Historical Motion
- [x] Neon Signage
- [x] Art Nouveau
- [x] Futurism
- [x] Pop Art
- [x] Psychedelic 60s
- [x] Neo-Brutalism
- [x] Memphis Design
- [x] Art Deco Motion
- [x] Op Art Kinetic
- [x] Constructivism
- [x] Dadaism
- [x] De Stijl
- [x] Mid-century Modern
- [x] Y2K Graphic Design
- [x] Grunge Typography
- [x] Risograph Animation

### B. Typography & Text Motion
- [x] Split-flap Display
- [x] Concrete Poetry
- [x] Lyric Video
- [x] Calligraphic Motion
- [x] Typewriter Animation
- [x] Text-on-Path Motion
- [x] Typographic Collage

### C. 2D Animation & Illustration
- [x] Cut-out Animation
- [x] Lo-fi Loop
- [x] Linocut Animation
- [x] Rubber Hose
- [x] Anime Sakuga
- [x] Rotoscoping
- [x] Silhouette Animation (Lotte Reiniger)
- [x] Frame-by-frame
- [x] Comic Book Motion
- [x] Limited Animation
- [x] Anime Motion Graphics
- [x] Ink Wash Animation (covered by the Ink Wash film)
- [x] Watercolour Animation 水彩动画
- [x] Chalkboard Animation
- [x] Children's Book Animation

### D. 3D & CGI Motion
- [x] Holographic
- [x] Point Cloud
- [x] Claymorphism
- [x] Photoreal CGI
- [x] Cel-shaded 3D
- [x] Product Visualization
- [x] Architectural Motion
- [x] 3D Character Animation

### E. Experimental & Generative Art
- [x] Slime Mould (Physarum)
- [x] Harmonograph
- [x] Infinite Zoom
- [x] Noise-driven Motion
- [x] Shader Art
- [x] Raymarching
- [x] Feedback Loops
- [x] Slit-scan
- [x] Data-driven Generative Art

### F. Analog, Physical & Stop Motion
- [x] Light Painting
- [x] Paper Craft
- [x] Puppet Animation
- [x] Object Stop Motion
- [x] Pixilation
- [x] Film Burn
- [x] VHS Analog Video

### G. Digital, Internet & Screen Aesthetics
- [x] Liminal Spaces
- [x] Databending
- [x] Old-school Screensaver
- [x] OS Window Animation
- [x] Web 1.0 Aesthetic

### H. Cinematic & Film Language
- [x] Bullet Time
- [x] Dolly Zoom
- [x] Film Noir
- [x] Long Exposure
- [x] Tilt-shift Miniature
- [x] Double Exposure
- [x] Surreal Cinema
- [x] High Contrast Cinema
- [x] Found Footage
- [x] Documentary Montage
- [x] Time-lapse
- [x] Hyperlapse
- [x] Match-cut Montage
- [x] Split-screen Cinema
- [x] One-shot Camera Motion

### I. Cultural & Regional Visual Styles
- [x] Byzantine Mosaic
- [x] Ukiyo-e Motion 浮世绘
- [x] Ink Wash 水墨
- [x] Sumi-e (covered by the Ink Wash film)
- [x] Indian Miniature
- [x] Islamic Geometry
- [x] Papel Picado
- [x] Dunhuang Murals 敦煌壁画
- [x] Shadow Puppetry 皮影戏
- [x] Korean Minhwa 민화
- [x] Eastern European Folk Paper-cut
- [x] African Pattern Animation

### J. Contemporary Social & Commercial Motion
- [x] Corporate Memphis
- [x] SaaS Product Motion
- [x] Sports Broadcast
- [x] Concert VJ Loops
- [x] Luxury Brand Motion
- [x] Broadcast Graphics
- [x] Data Storytelling
- [x] App UI Motion
- [x] Logo Reveal
- [x] Product Launch Film
- [x] Social Media Reels
- [x] Podcast Visualizer
- [x] Music Video Motion
- [x] Explainer Infographics

## Other atlas layers
- [x] **Technique Atlas (50+)** (60 built, 2026-11-02): one film per technique, same subject, so only the motion changes. Family K; every film uses the shared Token, stage, caption and beat bed in `js/technique-kit.js`. Waves 10–13 built 60.
  - Transitions: [x] Morph, [x] Wipe, [x] Match Cut, [x] Smear, [x] Displacement
  - Timing: [x] Elastic, [x] Overshoot, [x] Bounce, [x] Stagger, [x] Anticipation
  - Camera: [x] Dolly, [x] Orbit, [x] Parallax, [x] Crash Zoom, [x] Infinite Zoom
  - Simulation: [x] Cloth, [x] Fluid, [x] Rigid Body, [x] Soft Body, [x] Destruction
  - Procedural: [x] Noise, [x] Fields, [x] Instancing, [x] Recursion, [x] Feedback
  - Compositing: [x] Masking, [x] Keying, [x] Rotoscope, [x] Double Exposure
  - Temporal: [x] Time Remapping, [x] Freeze Frame, [x] Echo, [x] Frame Stepping
  - Typography: [x] Character Stagger, [x] Type Morph, [x] Tracking, [x] Text Reveal
  - Added in wave 12: [x] Dissolve (Transitions), [x] Squash & Stretch, [x] Follow-through (Timing), [x] Camera Shake, [x] Rack Focus (Camera), [x] Particles, [x] Rope (Simulation), [x] Motion Blur (Compositing)
  - [x] Wave 13 (2026-11-02, `feat/wave-13`): 15 more took family K from 45 to 60, closing the 50+ goal; films in `js/films-k16.js`–`k20.js`. Why: the core grid is done; these fill obvious gaps (easing basics, camera pans, rigging, classic generative systems, finishing looks).
    - Transitions: [x] Push, [x] Glitch
    - Timing: [x] Easing, [x] Arcs, [x] Motion Path
    - Camera: [x] Pan & Tilt, [x] Whip Pan
    - Simulation: [x] Flocking
    - Rigging: [x] Inverse Kinematics, [x] Puppet Pins
    - Procedural: [x] Reaction-Diffusion, [x] L-System
    - Compositing: [x] Bloom
    - Temporal: [x] Seamless Loop
    - Shape: [x] Trim Paths
- [ ] Follow-ups from the 2026-11-05 wave 17 fixes: wave 17 scores still not listened to; the Next Week fragment cut at 1.5 s opens on near-empty paper with only the question super; the Versus round-1 cut at 1.4 s shows only the pill and table row.
- [x] Follow-ups from wave 17 (fixed 2026-11-05, `feat/wave-17`: origin/works checked against sources, 16 corrections in 9 films (Interrotron dates, FTC Endorsement Guides 1975, Pepsi Challenge credit, Debunking Handbook authors, MythBusters years…); no blank frames on cuts across all 15; Myth vs Fact facts now held ~1.4 s; Unboxing keeps the Token hidden until the reveal, poster moved to 5.6; scrims behind the strip on the orange bumper and Next Week slate). Originally: every `origin` text in `js/films-m6.js`–`m10.js` was written from memory and is unchecked (e.g. TrueView 2010, GEICO "Unskippable" 2015, FTC Endorsement Guides 1980/2009/2023, YouTube chapters 2020, TikTok Stitch 2020); Myth vs Fact holds each fact only ~0.75 s; single empty frames exactly on some cuts (Myth vs Fact 8.0, Creator Intro 2.0, Day in the Life 8.0, Listicle 2.0); in Unboxing the tissue fold shows half the Token before the reveal; strip labels are low-contrast on the orange out-bumper (Ad-break Bumper) and the Next Week slate. Scores checked for peaks and timing only, not listened to.
- [ ] Follow-ups from the 2026-11-04 fixes: Cross-Hatching still ~306 ms/frame (needs a `js/look-kit.js` change to go lower); Subsurface back-lit frames ~30% slower (~800 ms); one very faint diagonal below the Subsurface hole at strong contrast boost; Inverse Kinematics FABRIK section (7–9 s) still fairly sparse; a faint vertical line near the top-left of Particles around 5 s.
- [ ] Carried over from the wave 13 item: scores of waves 11–13 checked for timing only, not listened to; reels not rebuilt since wave 10.
- [x] Follow-ups from wave 15 (fixed 2026-11-04, `fix/follow-ups`: Subsurface seams removed with a soft-exit `carry()` march; Iridescence bubble lit by a bubble-only overhead softbox; Cross-Hatching ~559 → ~306 ms/frame via sampled shadow/AO, still above 200 ms because the kit's G-buffer trace alone is ~127 ms): faint straight seams on the Token face in Subsurface (fanned thickness rays switching exit surface); the soap bubble's upper half in Iridescence reads dark; Cross-Hatching runs ~550 ms/frame, the slowest look.
- [x] Follow-ups from wave 13 (fixed 2026-11-04, `fix/follow-ups`: Reaction-Diffusion spots masked by the Token via per-cell kill rate, stripes made concentric by anisotropic V diffusion; Inverse Kinematics poster now shows ghost poses, goal path and the law-of-cosines block). Originally: the Reaction-Diffusion spots dish loses the Token outline almost at once; the 'stripes' dish reads as labyrinth bands; the Inverse Kinematics poster frame is sparse. Scores of waves 11–13 were checked for timing only, not listened to. Reels not rebuilt since wave 10.
- [ ] Demo the style-vs-technique idea: Bauhaus Geometry × Elastic vs Bauhaus Geometry × Recursive.
- [x] **Narrative Formats (20+)** (30 built, 2026-11-03): title sequence, ad, explainer, music video, lyric video, logo reveal… Family M. [x] Wave 16 (2026-11-03, `feat/wave-16`) built the first 15 in `js/films-m1.js`–`m5.js` on the new `js/format-kit.js`; 5+ more to reach 20. Why: the last big atlas layer. Rule, like K and L: the Token is the cast of every film and only the format changes; a shared structure strip (`js/format-kit.js`) shows each format's beats (acts, hook, call to action) so the films explain structure rather than repeat the style films (Logo Reveal, Explainer, Lyric Video, Music Video already exist as styles).
  - Film & TV: [x] Title Sequence, [x] Trailer, [x] Cold Open, [x] "Previously On" Recap, [x] End Credits
  - Advertising: [x] 10-second Ad, [x] Product Demo, [x] Channel Ident, [x] Teaser
  - Explainer: [x] Tutorial, [x] Problem → Solution, [x] Before / After, [x] Timeline
  - Social: [x] Vertical Story, [x] Manifesto
  - [x] Wave 17 (2026-11-03, `feat/wave-17`): 15 more on the same kit in `js/films-m6.js`–`m10.js`, taking family M to 30. Why: wave 16 left 5+ to reach the 20+ goal; like K and L, a second batch of 15 fills the obvious gaps in each group (TV breaks and promos, direct-response ads, list and comparison explainers, creator formats).
    - Film & TV: [x] Post-credits Sting, [x] "Next Week On" Promo, [x] Ad-break Bumper, [x] Talking-head Interview
    - Advertising: [x] Testimonial, [x] Unboxing, [x] Skippable Pre-roll, [x] Sale Countdown
    - Explainer: [x] Top-5 Listicle, [x] How It Works, [x] Versus, [x] Myth vs Fact
    - Social: [x] Creator Intro (id `formatyoutube`), [x] Duet / Reaction, [x] Day in the Life
- [x] **Rendering Looks (20+)** (30 built, 2026-11-03): material, light, grain, compositing looks. Family L. Wave 14 built the first 15 in `js/films-l1.js`–`l5.js` on the new `js/look-kit.js`. Why: the next layer after the Technique Atlas; chosen over Narrative Formats, which mostly overlap existing style films. Rule, like family K: one shared 3D scene and camera move (`js/look-kit.js`, a small SDF ray tracer at reduced resolution), so only the look changes.
  - Material: [x] Clay, [x] Chrome, [x] Glass, [x] Matcap
  - Light: [x] Three-point Studio, [x] Rim Light, [x] Golden Hour, [x] Volumetric Light
  - Shading: [x] Toon Ramp, [x] Ambient Occlusion, [x] Fresnel X-ray, [x] Wireframe
  - Image: [x] Depth Fog, [x] Teal & Orange Grade, [x] Film Grain & Halation
  - [x] Wave 15 (2026-11-03, `feat/wave-15`): 15 more on the same kit in `js/films-l6.js`–`l10.js`, taking family L to 30 and past the 20+ goal. Why: fills the obvious gaps in each group (layered materials, night and natural light, non-photoreal shading, lens artefacts).
    - Material: [x] Subsurface, [x] Iridescence, [x] Clear Coat, [x] Brushed Metal
    - Light: [x] Neon Night, [x] Overcast, [x] Chiaroscuro, [x] Caustics
    - Shading: [x] Cross-Hatching, [x] Normals, [x] Pixel Art
    - Image: [x] Chromatic Aberration, [x] Anamorphic Flare, [x] Halftone, [x] Infrared

## Atlas features
- [x] Curated "best of" reel (a representative style per family), not one 20-minute video.
- [x] Comparison mode beyond 2-up (a 4-up grid).
- [ ] In-film text switched to English for the CN-platform styles (optional).
- [x] Known flaws (fixed 2026-11-04, `fix/follow-ups`: particles streak came from slow particles clumping in a curl-noise swirl, burst speeds retuned; MoGraph camera ends steeper so the accent ring reads as a closed loop; whiteboard hand redrawn as a pen-grip pinch): bright streak in the particles mid-section; the MoGraph ring reads as a "V"; the whiteboard hand is cartoonish.
