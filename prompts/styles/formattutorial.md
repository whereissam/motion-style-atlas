# Tutorial

*Step-by-step how-to · 1960s TV — · screencast 2004 — · Narrative Formats*

Reference film: `videos/formattutorial.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Tutorial** (Step-by-step how-to, 1960s TV — · screencast 2004 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The how-to demonstration became a television genre with Julia Child’s The French Chef (WGBH, 1963) and Bob Ross’s The Joy of Painting (PBS, 1983): one task, broken into steps, shown at the speed you can follow. The software tutorial is its screen-recorded descendant — Jon Udell popularised the word “screencast” in 2004, and YouTube (2005) and Khan Academy (2008) made the narrated screen recording, with a visible cursor and highlighted clicks, the everyday way people learn a tool.
- Study these reference works: The French Chef (Julia Child, WGBH, 1963–1973) · The Joy of Painting (Bob Ross, PBS, 1983–1994) · Khan Academy video lessons (Sal Khan, 2008 —)
- Motion DNA: Intro card (1.2 s) promises the result and the step count; three numbered steps of about two seconds each, every one a tool pick plus one drag — cursor eases to the control, a click ripple and tick, the spotlight, the drag, a DONE badge; a 1.4 s recap lays the three steps out as cards; a 0.8 s next-lesson card ends on the finished Token hopping.
- Visual DNA: The Technique Atlas paper stage behind a light mock design app: traffic-light title bar, tool column, dot-grid canvas, a right panel with a step card (STEP n / 3, the instruction, its one action, step time) above real controls. Orange for the subject and highlights, blue selection handles, ink keystroke badges.
- Signature transitions: Window scales in over the intro card; step card swaps per step; spotlight dims the window around the control in use; recap cards rise over the dimmed app; cut to the next-lesson card
- Key techniques: One action per numbered step, Visible cursor, click ripples and highlights, Promise up front, recap at the end

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (One action per numbered step, Visible cursor, click ripples and highlights, Promise up front, recap at the end).
- 5.0–8.0 s  Climax: the most spectacular moment, built on One action per numbered step and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TUTORIAL", held for about 1 s.

BUILD RULES
- Suggested tools: Screen recording (Camtasia / ScreenFlow / OBS) with cursor and click highlighting, After Effects callouts, zooms and keystroke overlays, Canvas 2D: mock UI, keyframed cursor path, evenodd spotlight mask. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Tutorial motion-graphics film (Step-by-step how-to). Visual style: the Technique Atlas paper stage behind a light mock design app: traffic-light title bar, tool column, dot-grid canvas, a right panel with a step card (STEP n / 3, the instruction, its one action, step time) above real controls. Orange for the subject and highlights, blue selection handles, ink keystroke badges. Motion: intro card (1.2 s) promises the result and the step count; three numbered steps of about two seconds each, every one a tool pick plus one drag — cursor eases to the control, a click ripple and tick, the spotlight, the drag, a DONE badge; a 1.4 s recap lays the three steps out as cards; a 0.8 s next-lesson card ends on the finished Token hopping. Signature moves: one action per numbered step, visible cursor, click ripples and highlights, promise up front, recap at the end; transitions: window scales in over the intro card; step card swaps per step; spotlight dims the window around the control in use; recap cards rise over the dimmed app; cut to the next-lesson card. In the tradition of The French Chef (Julia Child, WGBH, 1963–1973) · The Joy of Painting (Bob Ross, PBS, 1983–1994) · Khan Academy video lessons (Sal Khan, 2008 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TUTORIAL". Punchy sound design synced to every cut.
```
