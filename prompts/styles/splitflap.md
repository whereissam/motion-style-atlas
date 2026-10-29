# Split-flap

*The Departure Board Clatter · 1956 — 1990 · Typography & Text Motion*

Reference film: `videos/splitflap.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Split-flap** (The Departure Board Clatter, 1956 — 1990; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A split-flap display shows each character on a drum of hinged half-cards: a motor turns the drum, and each upper flap falls over the hinge to reveal the next letter, so a whole board cascades through the alphabet with a clatter. Solari di Udine made the form famous, from the Cifra 3 flap clock designed by Gino Valle (1956) to the Dators departure boards that hung in railway stations and airports around the world until LCD screens replaced most of them.
- Study these reference works: Cifra 3 clock (Gino Valle for Solari di Udine, 1956) · Solari Dators railway and airport boards
- Motion DNA: Everything changes by falling: each unit steps forward through a fixed drum, the top half dropping over the hinge with gravity and a small slap, so new text never appears directly but arrives through every letter in between, rows cascading in staggered waves at different speeds.
- Visual DNA: White condensed capitals on matte black flaps split by a dark hinge line, grouped in columns for time, destination, platform and remarks inside a dark grey housing, with an amber header and a small flap clock; dim station light and a soft sheen across the board.
- Signature transitions: Macro pull-back, per-row flap cascades, a row roll-up, a full-board resolve into words
- Key techniques: Hinged half-tile flaps, Sliced perspective foreshortening, Per-unit drum scheduling

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hinged half-tile flaps, Sliced perspective foreshortening, Per-unit drum scheduling).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hinged half-tile flaps and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SPLIT-FLAP", held for about 1 s.

BUILD RULES
- Suggested tools: Electromechanical flap units on a stepper-driven drum, After Effects card-flip rigs per character, Canvas 2D (glyph atlas, strip-sliced flaps, deterministic drum state). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Split-flap motion-graphics film (The Departure Board Clatter). Visual style: white condensed capitals on matte black flaps split by a dark hinge line, grouped in columns for time, destination, platform and remarks inside a dark grey housing, with an amber header and a small flap clock; dim station light and a soft sheen across the board. Motion: everything changes by falling: each unit steps forward through a fixed drum, the top half dropping over the hinge with gravity and a small slap, so new text never appears directly but arrives through every letter in between, rows cascading in staggered waves at different speeds. Signature moves: hinged half-tile flaps, sliced perspective foreshortening, per-unit drum scheduling; transitions: macro pull-back, per-row flap cascades, a row roll-up, a full-board resolve into words. In the tradition of Cifra 3 clock (Gino Valle for Solari di Udine, 1956) · Solari Dators railway and airport boards. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SPLIT-FLAP". Punchy sound design synced to every cut.
```
