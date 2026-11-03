# Problem → Solution

*The explainer’s narrative arc · 1950s — · web explainers 2007 — · Narrative Formats*

Reference film: `videos/formatproblem.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Problem → Solution** (The explainer’s narrative arc, 1950s — · web explainers 2007 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Showing the problem before the product is one of television advertising’s oldest moves: Rosser Reeves’ 1950s Anacin commercials for Ted Bates dramatised the headache with hammers before the relief. Copywriters later formalised the arc as problem – agitate – solve, and the web explainer of the late 2000s compressed it into a minute: Common Craft’s “In Plain English” videos (from 2007) and the start-up homepage videos that followed open on a relatable pain, raise the stakes, introduce the product as the turn, explain it in three points and end on a call to action.
- Study these reference works: Anacin TV commercials (Rosser Reeves / Ted Bates & Co., 1950s) · Dollar Shave Club launch video (2012; problem, product, punchline) · Dropbox homepage explainer video (c. 2009)
- Motion DNA: Tension rises for 3.5 s and is released in one cut: two failed hops (0–2 s), a slump while the feed accelerates and the frame shakes (2–3.6 s), a beat of silence, then the circle wipe and MOTION slam (3.6 s); three points arrive one every 0.7 s (5–7.6 s); the proof hop uses all three (7.6–8.8 s); the CTA holds 1.2 s.
- Visual DNA: The problem half is graded grey — Token, stage and type desaturated under a cool wash with a growing vignette; the solution half is the full Technique Atlas palette: warm paper, orange Token, ink type. Big left-aligned headline supers, a ledge as the obstacle, numbered ink badges, a pill CTA button.
- Signature transitions: Hard cut to silence at the tension peak, circle wipe from the Token into colour, horizontal push to the three points and back, wipe up to the end card
- Key techniques: Pain point before product, Turn at the tension peak, Three points, then proof and CTA

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Pain point before product, Turn at the tension peak, Three points, then proof and CTA).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Pain point before product and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PROBLEM → SOLUTION", held for about 1 s.

BUILD RULES
- Suggested tools: Script on the PAS arc (problem, agitate, solve) with a storyboard per beat, After Effects character rig, shape layers and type supers, Canvas 2D: grey / colour scenes composited through a circular clip. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Problem → Solution motion-graphics film (The explainer’s narrative arc). Visual style: the problem half is graded grey — Token, stage and type desaturated under a cool wash with a growing vignette; the solution half is the full Technique Atlas palette: warm paper, orange Token, ink type. Big left-aligned headline supers, a ledge as the obstacle, numbered ink badges, a pill CTA button. Motion: tension rises for 3.5 s and is released in one cut: two failed hops (0–2 s), a slump while the feed accelerates and the frame shakes (2–3.6 s), a beat of silence, then the circle wipe and MOTION slam (3.6 s); three points arrive one every 0.7 s (5–7.6 s); the proof hop uses all three (7.6–8.8 s); the CTA holds 1.2 s. Signature moves: pain point before product, turn at the tension peak, three points, then proof and cta; transitions: hard cut to silence at the tension peak, circle wipe from the Token into colour, horizontal push to the three points and back, wipe up to the end card. In the tradition of Anacin TV commercials (Rosser Reeves / Ted Bates & Co., 1950s) · Dollar Shave Club launch video (2012; problem, product, punchline) · Dropbox homepage explainer video (c. 2009). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PROBLEM → SOLUTION". Punchy sound design synced to every cut.
```
