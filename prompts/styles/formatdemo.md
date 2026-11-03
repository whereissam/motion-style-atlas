# Product Demo

*Promise, one feature per beat, hero, CTA · 1949 — · Narrative Formats*

Reference film: `videos/formatdemo.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Product Demo** (Promise, one feature per beat, hero, CTA, 1949 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The demonstration is the oldest television sales format: in early American TV the product was shown working, often live — Betty Furness opening Westinghouse refrigerators on CBS from 1949 is the classic case — and the pitchman’s fair-ground demo moved to TV with Ron Popeil’s Ronco spots in the 1960s. The modern feature demo keeps the structure and drops the presenter: a promise, features shown one at a time on the product in use with a callout and a close-up, a hero shot and a call to action, the grammar of phone, appliance and app ads since Apple’s iPhone TV spots of 2007.
- Study these reference works: Westinghouse demonstrations with Betty Furness (CBS, from 1949) · Ronco Veg-O-Matic TV spots (Ron Popeil, 1960s) · Apple iPhone TV ads, e.g. “Calamari” (TBWA\Chiat\Day, 2007)
- Motion DNA: Six beats on a 120 BPM grid: a 1.5 s intro (the product drops in under the promise), three 2 s feature beats built identically — number and benefit line, the product doing the thing, callout, close-up — a 1.25 s hero shot and a 1.25 s CTA. Moves within the features, cuts into the hero and the CTA.
- Visual DNA: The Token on the paper sweep as the product. Big orange feature numbers, Archivo benefit lines, mono spec lines; ink leader-line callouts and a ringed magnifier tethered to the part being shown, with the radius dimensioned. Hero: centred, spot-lit, reflected in the floor, ink spec pills. CTA: Token + MOTION lockup over an ink button.
- Signature transitions: Text slides in per feature and clears before the next; the close-up springs open from the callout; hard cuts to the hero and to the CTA
- Key techniques: One feature per beat, Callout + close-up, Hero shot, then CTA

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (One feature per beat, Callout + close-up, Hero shot, then CTA).
- 5.0–8.0 s  Climax: the most spectacular moment, built on One feature per beat and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PRODUCT DEMO", held for about 1 s.

BUILD RULES
- Suggested tools: Template the feature beat once and reuse it: same layout, same timing, new content, Close-ups as a second render of the same scene, scaled about the feature point and clipped to a circle, Canvas 2D: one scene function drawn twice (wide + magnified), keyframed product state. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Product Demo motion-graphics film (Promise, one feature per beat, hero, CTA). Visual style: the Token on the paper sweep as the product. Big orange feature numbers, Archivo benefit lines, mono spec lines; ink leader-line callouts and a ringed magnifier tethered to the part being shown, with the radius dimensioned. Hero: centred, spot-lit, reflected in the floor, ink spec pills. CTA: Token + MOTION lockup over an ink button. Motion: six beats on a 120 BPM grid: a 1.5 s intro (the product drops in under the promise), three 2 s feature beats built identically — number and benefit line, the product doing the thing, callout, close-up — a 1.25 s hero shot and a 1.25 s CTA. Moves within the features, cuts into the hero and the CTA. Signature moves: one feature per beat, callout + close-up, hero shot, then cta; transitions: text slides in per feature and clears before the next; the close-up springs open from the callout; hard cuts to the hero and to the CTA. In the tradition of Westinghouse demonstrations with Betty Furness (CBS, from 1949) · Ronco Veg-O-Matic TV spots (Ron Popeil, 1960s) · Apple iPhone TV ads, e.g. “Calamari” (TBWA\Chiat\Day, 2007). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PRODUCT DEMO". Punchy sound design synced to every cut.
```
