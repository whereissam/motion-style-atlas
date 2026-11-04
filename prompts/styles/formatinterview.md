# Talking-head Interview

*Thirds, eyeline, two cameras, super, B-roll · 1960s — · Narrative Formats*

Reference film: `videos/formatinterview.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Talking-head Interview** (Thirds, eyeline, two cameras, super, B-roll, 1960s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Documentary interviews on camera became common once sync-sound 16 mm rigs arrived around 1960, and their grammar settled over the next decades: the subject off-centre on the thirds with lead room, looking at an interviewer sitting just beside the lens rather than into it, a name super on first appearance, and B-roll laid over the edits in the answer. Errol Morris inverted the eyeline in the 1990s with the Interrotron, first seen in Fast, Cheap & Out of Control (1997) and later The Fog of War (2003), so his subjects look straight down the lens; a second camera for a wide and a close on the same answer became common practice, and Ken Burns’ The Civil War (1990) made the slow push into archive stills a byword.
- Study these reference works: The Civil War (Ken Burns, PBS, 1990) · Fast, Cheap & Out of Control (Errol Morris, 1997; the Interrotron) · The Last Dance (ESPN / Netflix, 2020)
- Motion DNA: Locked-off shots that cut only on pauses in the voice: A-cam wide for 1.8 s, B-cam close with the lower third wiping on at 2.1 s and holding 1.9 s, a B-roll cutaway at 4.2 s with a slow Ken Burns push while the answer continues — a jump cut at 5.0 s hidden underneath — back to the wide at 5.8 s, then a pull quote whose words light up as they are spoken from 7.8 s. The Token barely moves: small pulses on the syllables.
- Visual DNA: A dim, warm interview set — bookshelf, practical lamp, string lights as bokeh, a stool — with the orange Token on the left third. Dashed thirds, an orange eyeline running out of frame right, a lead-room bracket; a dark plan view of subject, interviewer and the two camera cones with a red tally; an NLE-style edit with V2, V1 and an unbroken A1 waveform. Sepia archive photo for the B-roll; cream Archivo pull quote with an orange opening quote mark.
- Signature transitions: Straight cuts on pauses between camera angles; cut to B-roll and back; cut to the pull-quote card
- Key techniques: Subject on the third, lead room, eyeline just off-lens, Two cameras: wide ↔ close on the same answer, Lower-third super; B-roll laid over the edits

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Subject on the third, lead room, eyeline just off-lens, Two cameras: wide ↔ close on the same answer, Lower-third super; B-roll laid over the edits).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Subject on the third, lead room, eyeline just off-lens and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TALKING-HEAD INTERVIEW", held for about 1 s.

BUILD RULES
- Suggested tools: Two cameras rolling on the same take, synced by timecode, Edit in an NLE: B-roll on V2 over cuts in the A1 dialogue, Canvas 2D: one set drawn through two virtual cameras with parallax. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Talking-head Interview motion-graphics film (Thirds, eyeline, two cameras, super, B-roll). Visual style: a dim, warm interview set — bookshelf, practical lamp, string lights as bokeh, a stool — with the orange Token on the left third. Dashed thirds, an orange eyeline running out of frame right, a lead-room bracket; a dark plan view of subject, interviewer and the two camera cones with a red tally; an NLE-style edit with V2, V1 and an unbroken A1 waveform. Sepia archive photo for the B-roll; cream Archivo pull quote with an orange opening quote mark. Motion: locked-off shots that cut only on pauses in the voice: A-cam wide for 1.8 s, B-cam close with the lower third wiping on at 2.1 s and holding 1.9 s, a B-roll cutaway at 4.2 s with a slow Ken Burns push while the answer continues — a jump cut at 5.0 s hidden underneath — back to the wide at 5.8 s, then a pull quote whose words light up as they are spoken from 7.8 s. The Token barely moves: small pulses on the syllables. Signature moves: subject on the third, lead room, eyeline just off-lens, two cameras: wide ↔ close on the same answer, lower-third super; b-roll laid over the edits; transitions: straight cuts on pauses between camera angles; cut to B-roll and back; cut to the pull-quote card. In the tradition of The Civil War (Ken Burns, PBS, 1990) · Fast, Cheap & Out of Control (Errol Morris, 1997; the Interrotron) · The Last Dance (ESPN / Netflix, 2020). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TALKING-HEAD INTERVIEW". Punchy sound design synced to every cut.
```
