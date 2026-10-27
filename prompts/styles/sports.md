# Sports Broadcast

*Glass, Chrome and Score Bugs · 1994 — · Social & Commercial*

Reference film: `videos/sports.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Sports Broadcast** (Glass, Chrome and Score Bugs, 1994 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Network sports packages turned into motion-design showpieces after FOX launched its NFL coverage in 1994 with the persistent score box; ESPN, Sky Sports and Olympic broadcasters then built whole branded systems of chrome type, glass panels, stingers and lower thirds, now usually run live from real-time graphics engines.
- Study these reference works: NFL on FOX graphics package (1994 –, FoxBox score bug) · ESPN Monday Night Football open · Sky Sports Premier League graphics · NBC Sunday Night Football · Olympic Broadcasting Services graphics (OBS) · Hockey Night in Canada
- Motion DNA: Everything arrives with violence: panels slam in on the beat with overshoot and motion smears, numbers count up and lock, a spinning logo stinger swallows the frame, and a flare sweeps on the final lockup.
- Visual DNA: Deep arena navy with volumetric beams, team-colour glass panels with metal edges, chrome condensed italic type, gold accents, crests, a score bug, lower third and ticker.
- Signature transitions: Slam-ins, diagonal split, whip-outs, logo stinger with flash, wipe bars, lens-flare reveal.
- Key techniques: Extruded slab panels: metal side face, glass front, bevel light, Chrome type: banded gradient fill, extrusion, gleam sweep, Slam-in with overshoot, motion smear and camera shake on every hit, Anamorphic lens flare and light streaks in additive blend

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Extruded slab panels: metal side face, glass front, bevel light, Chrome type: banded gradient fill, extrusion, gleam sweep, Slam-in with overshoot, motion smear and camera shake on every hit, Anamorphic lens flare and light streaks in additive blend).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Extruded slab panels: metal side face, glass front, bevel light and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SPORTS BROADCAST", held for about 1 s.

BUILD RULES
- Suggested tools: Vizrt, Chyron / Ross XPression, Cinema 4D + After Effects, Unreal Engine, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Sports Broadcast motion-graphics film (Glass, Chrome and Score Bugs). Visual style: deep arena navy with volumetric beams, team-colour glass panels with metal edges, chrome condensed italic type, gold accents, crests, a score bug, lower third and ticker. Motion: everything arrives with violence: panels slam in on the beat with overshoot and motion smears, numbers count up and lock, a spinning logo stinger swallows the frame, and a flare sweeps on the final lockup. Signature moves: extruded slab panels: metal side face, glass front, bevel light, chrome type: banded gradient fill, extrusion, gleam sweep, slam-in with overshoot, motion smear and camera shake on every hit, anamorphic lens flare and light streaks in additive blend; transitions: slam-ins, diagonal split, whip-outs, logo stinger with flash, wipe bars, lens-flare reveal. In the tradition of NFL on FOX graphics package (1994 –, FoxBox score bug) · ESPN Monday Night Football open · Sky Sports Premier League graphics · NBC Sunday Night Football · Olympic Broadcasting Services graphics (OBS) · Hockey Night in Canada. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SPORTS BROADCAST". Punchy sound design synced to every cut.
```
