# Stagger

*One animation, offset start times · 1930s — · Technique Atlas*

Reference film: `videos/techstagger.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Stagger** (One animation, offset start times, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Staggering — running the same move on many elements with each start delayed a little more than the last — is how a crowd of parts reads as one gesture. Cel animators and title designers did it by hand with offset exposure-sheet timings; in motion graphics it became a standard control through After Effects text animators and expression offsets, and web motion libraries such as GSAP made a stagger value, with orders from the start, centre, edges or random, a single parameter.
- Study these reference works: Saul Bass, The Man with the Golden Arm titles (1955) · After Effects text animator range selectors (Adobe) · GSAP stagger option (GreenSock)
- Motion DNA: Every item runs the identical 500 ms pop-in on an overshooting ease; only the start time changes. Four orders, one per bar, each finishing within 1.4 s — a reading-order sweep, a ripple out from the centre, a diagonal wave from the top-left, a sparkling shuffle — each cleared at once before the next, then the six letters of MOTION drop in 100 ms apart.
- Visual DNA: The Technique Atlas stage with a 9 × 5 grid of small orange Tokens over delay heat tiles (pale to orange, labelled in ms); a timing chart of 45 offset bars, dotted lead-ins for each delay and a black playhead; mono tags naming the order and its formula.
- Signature transitions: Staggered pop-ins; each pattern cleared with a single simultaneous scale-down
- Key techniques: Delay = f(index), Linear · centre · diagonal · random orders, Same duration and ease for every item

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Delay = f(index), Linear · centre · diagonal · random orders, Same duration and ease for every item).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Delay = f(index) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "STAGGER", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects text animators / layer offset sequencing, GSAP stagger, Framer Motion staggerChildren, CSS animation-delay, Canvas 2D: per-item delay = f(index, position), one shared easing. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Stagger motion-graphics film (One animation, offset start times). Visual style: the Technique Atlas stage with a 9 × 5 grid of small orange Tokens over delay heat tiles (pale to orange, labelled in ms); a timing chart of 45 offset bars, dotted lead-ins for each delay and a black playhead; mono tags naming the order and its formula. Motion: every item runs the identical 500 ms pop-in on an overshooting ease; only the start time changes. Four orders, one per bar, each finishing within 1.4 s — a reading-order sweep, a ripple out from the centre, a diagonal wave from the top-left, a sparkling shuffle — each cleared at once before the next, then the six letters of MOTION drop in 100 ms apart. Signature moves: delay = f(index), linear · centre · diagonal · random orders, same duration and ease for every item; transitions: staggered pop-ins; each pattern cleared with a single simultaneous scale-down. In the tradition of Saul Bass, The Man with the Golden Arm titles (1955) · After Effects text animator range selectors (Adobe) · GSAP stagger option (GreenSock). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "STAGGER". Punchy sound design synced to every cut.
```
