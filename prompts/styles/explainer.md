# Explainer

*Flat animated infographics · 2008 — · Social & Commercial*

Reference film: `videos/explainer.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Explainer** (Flat animated infographics, 2008 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The animated explainer sells or teaches one idea in about ninety seconds: a simple character with a problem, a few flat icons and charts that draw on, a three-step solution and a call to action. Start-ups adopted it as the homepage video of the late 2000s and 2010s, while Kurzgesagt (2013 —) and TED-Ed (2012 —) pushed the same flat, colour-blocked vector style into science education.
- Study these reference works: Common Craft “In Plain English” videos (Lee and Sachi LeFever, 2007 —) · TED-Ed animated lessons (2012 —) · Kurzgesagt – In a Nutshell (Philipp Dettmer, 2013 —)
- Motion DNA: Everything pops: shapes scale in on a back-ease overshoot with a little squash, lines and dashed arrows draw on along their path, the donut sweeps clockwise and labels pop as it passes, one slice pulls out for emphasis, steps arrive one per beat and tick off, and each new idea opens with a circle wipe from the element that leads to it.
- Visual DNA: Flat vector shapes without outlines, a few saturated colour fields (cream, midnight blue, teal, coral) with sunny yellow accents, 2013-style long shadows inside round badges, a simple round-headed character, rounded geometric sans type, big percentages and plenty of empty space.
- Signature transitions: Pop-in character, fly-in bill with drawing line, circle wipes between scenes, donut sweep and slice pull-out, step-by-step pops joined by draw-on arrows, bar drop, final circle wipe to the CTA
- Key techniques: Circle-wipe scene changes, Pop-on with overshoot, Charts and arrows that draw on

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Circle-wipe scene changes, Pop-on with overshoot, Charts and arrows that draw on).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Circle-wipe scene changes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "EXPLAINER", held for about 1 s.

BUILD RULES
- Suggested tools: Illustrator → After Effects (shape layers, Trim Paths), Vyond / Animaker template tools, Canvas 2D (paths, clip wipes). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (fictional brand and illustrative numbers).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Explainer motion-graphics film (Flat animated infographics). Visual style: flat vector shapes without outlines, a few saturated colour fields (cream, midnight blue, teal, coral) with sunny yellow accents, 2013-style long shadows inside round badges, a simple round-headed character, rounded geometric sans type, big percentages and plenty of empty space. Motion: everything pops: shapes scale in on a back-ease overshoot with a little squash, lines and dashed arrows draw on along their path, the donut sweeps clockwise and labels pop as it passes, one slice pulls out for emphasis, steps arrive one per beat and tick off, and each new idea opens with a circle wipe from the element that leads to it. Signature moves: circle-wipe scene changes, pop-on with overshoot, charts and arrows that draw on; transitions: pop-in character, fly-in bill with drawing line, circle wipes between scenes, donut sweep and slice pull-out, step-by-step pops joined by draw-on arrows, bar drop, final circle wipe to the CTA. In the tradition of Common Craft “In Plain English” videos (Lee and Sachi LeFever, 2007 —) · TED-Ed animated lessons (2012 —) · Kurzgesagt – In a Nutshell (Philipp Dettmer, 2013 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "EXPLAINER". Punchy sound design synced to every cut.
```
