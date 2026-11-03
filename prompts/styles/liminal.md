# Liminal Spaces

*The Backrooms on VHS · 2019 — · Digital, Internet & Screen*

Reference film: `videos/liminal.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Liminal Spaces** (The Backrooms on VHS, 2019 —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Liminal-space imagery finds unease in transitional places emptied of people — corridors, waiting rooms, closed malls, drained pools — lit as if everyone has just left. In 2019 an anonymous 4chan post paired a photo of a yellow, carpeted, fluorescent-lit room with a story about “noclipping” out of reality into the Backrooms; dreamcore image boards and Kane Pixels’ found-footage series made the slow VHS walk through it a genre, and Marc Augé’s “non-places” (1992) supplies the theory.
- Study these reference works: The Backrooms (anonymous 4chan /x/ post, 2019) · The Backrooms (Found Footage) (Kane Pixels, YouTube, 2022) · Non-Places (Marc Augé, 1992)
- Motion DNA: A slow, aimless handheld walk: low-frequency drift in yaw, pitch and roll over a faint step bob, then a lazy turn toward an opening; nothing approaches and nothing moves except one tube that dims twice, and the camera simply keeps going.
- Visual DNA: Mono-yellow wallpaper with thin stripes and water stains, damp beige carpet, a drop ceiling of buzzing fluorescent panels, flat over-bright light falling off into murky yellow haze, endless pillars — under VHS softness, ghosting, scanlines and a date-stamped OSD.
- Signature transitions: One continuous take: corridor drift → a dark side passage → a slow turn → the pillar hall opens up → camcorder titler
- Key techniques: Pseudo-3D grid map, painter-sorted, Fluorescent falloff into yellow haze, Camcorder drift, VHS OSD & grade

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Pseudo-3D grid map, painter-sorted, Fluorescent falloff into yellow haze, Camcorder drift, VHS OSD & grade).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Pseudo-3D grid map, painter-sorted and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LIMINAL SPACES", held for about 1 s.

BUILD RULES
- Suggested tools: Blender / Unity found-footage scenes, Camcorder VHS capture & emulation, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (grid map, lighting, camera and VHS grade generated in code).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Liminal Spaces motion-graphics film (The Backrooms on VHS). Visual style: mono-yellow wallpaper with thin stripes and water stains, damp beige carpet, a drop ceiling of buzzing fluorescent panels, flat over-bright light falling off into murky yellow haze, endless pillars — under VHS softness, ghosting, scanlines and a date-stamped OSD. Motion: a slow, aimless handheld walk: low-frequency drift in yaw, pitch and roll over a faint step bob, then a lazy turn toward an opening; nothing approaches and nothing moves except one tube that dims twice, and the camera simply keeps going. Signature moves: pseudo-3d grid map, painter-sorted, fluorescent falloff into yellow haze, camcorder drift, vhs osd & grade; transitions: one continuous take: corridor drift → a dark side passage → a slow turn → the pillar hall opens up → camcorder titler. In the tradition of The Backrooms (anonymous 4chan /x/ post, 2019) · The Backrooms (Found Footage) (Kane Pixels, YouTube, 2022) · Non-Places (Marc Augé, 1992). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LIMINAL SPACES". Punchy sound design synced to every cut.
```
