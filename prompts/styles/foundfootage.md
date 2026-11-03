# Found Footage

*Archival collage cinema · 1958 — · Cinematic & Film Language*

Reference film: `videos/foundfootage.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Found Footage** (Archival collage cinema, 1958 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Found-footage film makes new cinema out of other people’s film: newsreels, home movies, educational reels and leader are cut together until their juxtaposition says something none of them meant. Bruce Conner’s A Movie (1958) set the form with mismatched stock shots and a premature THE END; Craig Baldwin’s Tribulation 99 (1991) built a mock conspiracy history from stock footage, and Christian Marclay’s The Clock (2010) assembled a 24-hour film from clock shots synchronised to real time.
- Study these reference works: Rose Hobart (Joseph Cornell, 1936) · A Movie (Bruce Conner, 1958) · Report (Bruce Conner, 1967) · Tribulation 99: Alien Anomalies Under America (Craig Baldwin, 1991) · Decasia (Bill Morrison, 2002) · The Clock (Christian Marclay, 2010)
- Motion DNA: Rhythm comes from the cut, not the camera: shots of 0.2–0.9 s from unrelated sources, eyeline and graphic matches that invent cause and effect, a cutting rate that accelerates toward noon, and the strip itself moving — gate weave, 18 fps home-movie judder against 24 fps newsreel, splice frames rolling the frame line through the gate.
- Visual DNA: An overscanned 16mm strip with perforations, frame lines, edge print and optical soundtrack in view; every shot a different stock — high-contrast newsreel, amber and blue tints, saturated home-movie colour, a soft dupe, grey academy leader; scratches, dust and hairs; typewritten captions that re-narrate the footage; trims hanging at the sides.
- Signature transitions: Hard cuts on tape splices with a frame-line roll, leader countdown, a false THE END, eyeline matches, clocks agreeing across cuts, title printed over the last shot
- Key techniques: Collage cutting across stocks, Overscan: perfs, edges, splices, Clocks synced to film time

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Collage cutting across stocks, Overscan: perfs, edges, splices, Clocks synced to film time).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Collage cutting across stocks and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FOUND FOOTAGE", held for about 1 s.

BUILD RULES
- Suggested tools: 16mm flatbed / optical printer, Archive scans with overscan, Canvas 2D (every “archival” shot procedurally drawn). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (no archival material used).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Found Footage motion-graphics film (Archival collage cinema). Visual style: an overscanned 16mm strip with perforations, frame lines, edge print and optical soundtrack in view; every shot a different stock — high-contrast newsreel, amber and blue tints, saturated home-movie colour, a soft dupe, grey academy leader; scratches, dust and hairs; typewritten captions that re-narrate the footage; trims hanging at the sides. Motion: rhythm comes from the cut, not the camera: shots of 0.2–0.9 s from unrelated sources, eyeline and graphic matches that invent cause and effect, a cutting rate that accelerates toward noon, and the strip itself moving — gate weave, 18 fps home-movie judder against 24 fps newsreel, splice frames rolling the frame line through the gate. Signature moves: collage cutting across stocks, overscan: perfs, edges, splices, clocks synced to film time; transitions: hard cuts on tape splices with a frame-line roll, leader countdown, a false THE END, eyeline matches, clocks agreeing across cuts, title printed over the last shot. In the tradition of Rose Hobart (Joseph Cornell, 1936) · A Movie (Bruce Conner, 1958) · Report (Bruce Conner, 1967) · Tribulation 99: Alien Anomalies Under America (Craig Baldwin, 1991) · Decasia (Bill Morrison, 2002) · The Clock (Christian Marclay, 2010). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FOUND FOOTAGE". Punchy sound design synced to every cut.
```
