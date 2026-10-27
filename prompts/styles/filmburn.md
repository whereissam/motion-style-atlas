# Film Burn

*Light Leaks & Burn-through · 1966 — · Analog, Physical & Stop Motion*

Reference film: `videos/filmburn.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Film Burn** (Light Leaks & Burn-through, 1966 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Celluloid is fragile: light leaking into a camera or a can fogs the raw stock orange and red at the ends of each roll, and a print that jams in front of a projector lamp blisters and melts in seconds. Ingmar Bergman staged that burn-through on purpose in Persona (1966), Monte Hellman ended Two-Lane Blacktop (1971) with its last frame burning in the gate, and editors have used scanned light leaks and burn transitions ever since.
- Study these reference works: Persona (Ingmar Bergman, 1966) · Two-Lane Blacktop (Monte Hellman, 1971) · Fight Club (David Fincher, 1999; changeover "cigarette burns") · Decasia (Bill Morrison, 2002) · Grindhouse: Planet Terror (Robert Rodriguez, 2007)
- Motion DNA: A steady 24 fps print breathing with weave and flicker, interrupted by the projector: the framing slips to show the frame line, the strip stops dead, a hole bubbles and melts outward, and the reel flaps through flash frames.
- Visual DNA: Warm Kodachrome dusk, orange and red fogging blooming from the gate edges, brown scorched emulsion with blisters around a white-hot hole, black frame lines and perforations, dust, hairs and green-white scratches.
- Signature transitions: Light-leak flare, frame-line slip, burn-through to white, flash frames, run-out
- Key techniques: Light-leak fogging (screen blend), Projector burn-through & blistering, Gate weave, frame-line slip, flicker, Dust, hair, scratches, cue dots

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Light-leak fogging (screen blend), Projector burn-through & blistering, Gate weave, frame-line slip, flicker, Dust, hair, scratches, cue dots).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Light-leak fogging (screen blend) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FILM BURN", held for about 1 s.

BUILD RULES
- Suggested tools: 35mm projector + leader, Scanned light-leak / burn overlays (screen blend), Canvas 2D (procedural burn). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural homage (the real effect destroys the print).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Film Burn motion-graphics film (Light Leaks & Burn-through). Visual style: warm Kodachrome dusk, orange and red fogging blooming from the gate edges, brown scorched emulsion with blisters around a white-hot hole, black frame lines and perforations, dust, hairs and green-white scratches. Motion: a steady 24 fps print breathing with weave and flicker, interrupted by the projector: the framing slips to show the frame line, the strip stops dead, a hole bubbles and melts outward, and the reel flaps through flash frames. Signature moves: light-leak fogging (screen blend), projector burn-through & blistering, gate weave, frame-line slip, flicker, dust, hair, scratches, cue dots; transitions: light-leak flare, frame-line slip, burn-through to white, flash frames, run-out. In the tradition of Persona (Ingmar Bergman, 1966) · Two-Lane Blacktop (Monte Hellman, 1971) · Fight Club (David Fincher, 1999; changeover "cigarette burns") · Decasia (Bill Morrison, 2002) · Grindhouse: Planet Terror (Robert Rodriguez, 2007). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FILM BURN". Punchy sound design synced to every cut.
```
