# Time-lapse

*Hours in Seconds · 1982 — · Cinematic & Film Language*

Reference film: `videos/timelapse.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Time-lapse** (Hours in Seconds, 1982 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Time-lapse began as a science tool, but Ron Fricke's cinematography for Godfrey Reggio's Koyaanisqatsi (1982) made it a film language of its own: an intervalometer exposes one frame every few seconds or minutes, often on a motion-control dolly, so clouds race, shadows sweep and a city's day plays out in seconds over a Philip Glass score. Fricke's Baraka (1992) and the BBC's Planet Earth (2006) carried the grammar to a global audience.
- Study these reference works: Koyaanisqatsi (Godfrey Reggio, cinematography Ron Fricke, 1982) · Powaqqatsi (Godfrey Reggio, 1988) · Chronos (Ron Fricke, 1985) · Baraka (Ron Fricke, 1992) · Samsara (Ron Fricke, 2011) · Planet Earth (BBC, 2006)
- Motion DNA: A locked-off frame on a slow motion-control slide while time itself accelerates: clouds stream and boil, shadows wheel across the desert floor, lights blink on window by window and the sky rotates.
- Visual DNA: Monument Valley buttes and a desert town under a sky that cycles from hard noon blue through golden hour, magenta afterglow and blue hour to a black field of star trails and a rose dawn.
- Signature transitions: None inside the shot: time is the transition; day-to-night "holy grail" exposure ramp, dawn swell into the title.
- Key techniques: Monotone-cubic hour curve: real-time open that ramps into 17 hours without stalls, Sky gradient model driven by solar elevation, with afterglow, Butte shadows projected along the sun vector; racing cloud shadows, Star trails as accumulated arcs around the pole; window-by-window town lights, Quarter-res blurred cloud layer, long-exposure headlight trails

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Monotone-cubic hour curve: real-time open that ramps into 17 hours without stalls, Sky gradient model driven by solar elevation, with afterglow, Butte shadows projected along the sun vector; racing cloud shadows, Star trails as accumulated arcs around the pole; window-by-window town lights, Quarter-res blurred cloud layer, long-exposure headlight trails).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Monotone-cubic hour curve: real-time open that ramps into 17 hours without stalls and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TIME-LAPSE", held for about 1 s.

BUILD RULES
- Suggested tools: Camera + intervalometer, Motion-control slider, LRTimelapse / After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Time-lapse motion-graphics film (Hours in Seconds). Visual style: monument Valley buttes and a desert town under a sky that cycles from hard noon blue through golden hour, magenta afterglow and blue hour to a black field of star trails and a rose dawn. Motion: a locked-off frame on a slow motion-control slide while time itself accelerates: clouds stream and boil, shadows wheel across the desert floor, lights blink on window by window and the sky rotates. Signature moves: monotone-cubic hour curve: real-time open that ramps into 17 hours without stalls, sky gradient model driven by solar elevation, with afterglow, butte shadows projected along the sun vector; racing cloud shadows, star trails as accumulated arcs around the pole; window-by-window town lights, quarter-res blurred cloud layer, long-exposure headlight trails; transitions: none inside the shot: time is the transition; day-to-night "holy grail" exposure ramp, dawn swell into the title. In the tradition of Koyaanisqatsi (Godfrey Reggio, cinematography Ron Fricke, 1982) · Powaqqatsi (Godfrey Reggio, 1988) · Chronos (Ron Fricke, 1985) · Baraka (Ron Fricke, 1992) · Samsara (Ron Fricke, 2011) · Planet Earth (BBC, 2006). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TIME-LAPSE". Punchy sound design synced to every cut.
```
