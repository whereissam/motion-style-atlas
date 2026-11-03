# Timeline

*History told as a camera move along one axis · 1765 — · Narrative Formats*

Reference film: `videos/formattimeline.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Timeline** (History told as a camera move along one axis, 1765 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The timeline as a picture of history goes back to Joseph Priestley’s A Chart of Biography (1765), which drew lives as bars on a single scaled time axis, and his New Chart of History (1769). Television documentaries and museum films turned it into a camera move: a line travelling across the frame, dates rolling past, an event card at each stop. Web and motion explainers made it a template — the horizontal scroll, the milestone card on a stem, the jump to “today” — and with it a choice every timeline makes: even steps, one per event, or scaled time, where gaps are as long as the years they hold.
- Study these reference works: Joseph Priestley, A Chart of Biography (1765) · Charles Joseph Minard and later infographic history charts in print · Knight Lab TimelineJS (Northwestern University, 2012 —) used across web journalism
- Motion DNA: A short title, then the camera dollies along the axis in hold-and-move steps, arriving on every second beat so each milestone card can spring out on its stem while the next marker waits off to the right. At the turn the camera pulls back to show the whole line, the gaps between events are labelled in years, and the evenly spaced markers slide to their true positions in scaled time. Then a push in on the present, where the Token and MOTION land.
- Visual DNA: The Technique Atlas paper stage; one ink axis with round markers; cream cards with an ink keyline, an orange edge bar, a heavy year and a mono line, each with a small drawing of the Token at that stage (sharp square, rounded square, punched hole, orange, turning). Decade ticks appear only in scaled time; a small EVEN | SCALED switch and a FICTIONAL CHRONOLOGY note sit under the structure strip.
- Signature transitions: Camera dolly between stops; pull-back and re-spacing of the axis; push-in to the present
- Key techniques: Milestone cards on stems, Even steps vs. scaled time, Zoom to the present

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Milestone cards on stems, Even steps vs. scaled time, Zoom to the present).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Milestone cards on stems and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TIMELINE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects null-driven camera on a long precomp, Web scroll timelines (TimelineJS, scrollytelling), Canvas 2D: one world transform per frame (camera x, zoom), markers lerped between even and scaled x. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (the chronology is invented).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Timeline motion-graphics film (History told as a camera move along one axis). Visual style: the Technique Atlas paper stage; one ink axis with round markers; cream cards with an ink keyline, an orange edge bar, a heavy year and a mono line, each with a small drawing of the Token at that stage (sharp square, rounded square, punched hole, orange, turning). Decade ticks appear only in scaled time; a small EVEN | SCALED switch and a FICTIONAL CHRONOLOGY note sit under the structure strip. Motion: a short title, then the camera dollies along the axis in hold-and-move steps, arriving on every second beat so each milestone card can spring out on its stem while the next marker waits off to the right. At the turn the camera pulls back to show the whole line, the gaps between events are labelled in years, and the evenly spaced markers slide to their true positions in scaled time. Then a push in on the present, where the Token and MOTION land. Signature moves: milestone cards on stems, even steps vs. scaled time, zoom to the present; transitions: camera dolly between stops; pull-back and re-spacing of the axis; push-in to the present. In the tradition of Joseph Priestley, A Chart of Biography (1765) · Charles Joseph Minard and later infographic history charts in print · Knight Lab TimelineJS (Northwestern University, 2012 —) used across web journalism. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TIMELINE". Punchy sound design synced to every cut.
```
