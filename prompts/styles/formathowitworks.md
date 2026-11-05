# How It Works

*System explainer: whole, part, whole · 1930s — · web explainers 2000s — · Narrative Formats*

Reference film: `videos/formathowitworks.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **How It Works** (System explainer: whole, part, whole, 1930s — · web explainers 2000s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The explanatory cutaway is older than film: technical illustrators drew engines with their casings removed, and between the wars motoring magazines such as The Autocar made the cutaway drawing a speciality. Sponsored and classroom films animated the same idea — the Jam Handy Organization’s Around the Corner (1937) explained Chevrolet’s differential gear by building it up from a single axle, part by part — and the web explainer revived it, from HowStuffWorks (1998) to animated channels such as Kurzgesagt (2013) and Animagraffs, in the same order: the whole system, a zoom into the mechanism one step at a time, and back to the whole.
- Study these reference works: Around the Corner (Jam Handy for Chevrolet, 1937; the differential explained) · David Macaulay, The Way Things Work (book, 1988) · Animagraffs, How a Car Engine Works (web animation, 2010s)
- Motion DNA: A held wide shot of the whole machine for 2.6 s with the belt running at a steady pace and the brackets drawing on the beat; an accelerating zoom into the box (2.6–3.2 s); three steps of 1.4 s each, a numbered badge popping on each and a packet hopping along the flow arrow at every hand-off; a decelerating pull back (7.4–8.0 s) to the same wide, and a two-second hold on the takeaway.
- Visual DNA: The Technique Atlas paper stage: an ink conveyor and an ink box with MOTION reversed out of it, grey still Tokens in, orange hopping Tokens out. Inside, the casing is cut away to a hatched charcoal border with an orange dashed cut line; three white chambers with ink keylines, the current one outlined in orange, the others dimmed; a keyframe timeline, an easing graph with its spacing ticks, onion-skinned in-betweens and a film strip; a small map of the whole in the corner.
- Signature transitions: Push-in zoom through the box into the cutaway; pull back out to the same wide; steps lit in sequence rather than cut
- Key techniques: Whole → part → whole, with a you-are-here map, Input → mechanism → output, then a cutaway, One idea per numbered step, joined by flow arrows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Whole → part → whole, with a you-are-here map, Input → mechanism → output, then a cutaway, One idea per numbered step, joined by flow arrows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Whole → part → whole, with a you-are-here map and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "HOW IT WORKS", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects: one master comp of the machine, a camera zoom into a precomp of the cutaway, Script per step: one noun, one verb, one visual, Canvas 2D: the wide drawn under a zoom transform, the cutaway cross-faded in screen space at full zoom. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second How It Works motion-graphics film (System explainer: whole, part, whole). Visual style: the Technique Atlas paper stage: an ink conveyor and an ink box with MOTION reversed out of it, grey still Tokens in, orange hopping Tokens out. Inside, the casing is cut away to a hatched charcoal border with an orange dashed cut line; three white chambers with ink keylines, the current one outlined in orange, the others dimmed; a keyframe timeline, an easing graph with its spacing ticks, onion-skinned in-betweens and a film strip; a small map of the whole in the corner. Motion: a held wide shot of the whole machine for 2.6 s with the belt running at a steady pace and the brackets drawing on the beat; an accelerating zoom into the box (2.6–3.2 s); three steps of 1.4 s each, a numbered badge popping on each and a packet hopping along the flow arrow at every hand-off; a decelerating pull back (7.4–8.0 s) to the same wide, and a two-second hold on the takeaway. Signature moves: whole → part → whole, with a you-are-here map, input → mechanism → output, then a cutaway, one idea per numbered step, joined by flow arrows; transitions: push-in zoom through the box into the cutaway; pull back out to the same wide; steps lit in sequence rather than cut. In the tradition of Around the Corner (Jam Handy for Chevrolet, 1937; the differential explained) · David Macaulay, The Way Things Work (book, 1988) · Animagraffs, How a Car Engine Works (web animation, 2010s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "HOW IT WORKS". Punchy sound design synced to every cut.
```
