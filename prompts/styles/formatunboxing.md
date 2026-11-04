# Unboxing

*Overhead, slow before the reveal, knolled contents · 2006 — · Narrative Formats*

Reference film: `videos/formatunboxing.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Unboxing** (Overhead, slow before the reveal, knolled contents, 2006 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Unboxing videos grew up on YouTube in the mid-2000s with gadget launches — fans filmed themselves opening the first iPhone in June 2007 — and by 2010 ‘unboxing’ was a genre of its own. The grammar is consistent: an overhead or over-the-shoulder camera, the sealed box shown first, the tape cut and the layers removed one by one, a deliberately slow last layer before the product, then the contents laid out and a first-impression verdict. Brands answered with packaging designed to be filmed — Apple’s nested boxes and pull tabs — and the laid-out contents borrow knolling, Andrew Kromelow’s 1987 habit at Frank Gehry’s furniture shop of arranging tools at right angles, popularised by Tom Sachs.
- Study these reference works: iPhone launch unboxings (YouTube, June 2007) · Unbox Therapy (Lewis Hilsenteger, 2010 —) · Tom Sachs, ‘Ten Bullets’ (2010; ‘Always be knolling’)
- Motion DNA: Action gets shorter then stops: the box drops with a thud, the tape cut runs 0.8 s, the flaps 0.75 s, the lid lifts off in 0.5 s — then the sticker and two tissue sheets take 1.55 s on a slow ease with the music pulled out. The reveal at 5.45 s is a hit, a shine sweep and a 10 % push-in; the box slides aside and five items fly to their knolled spots, alternate hands, one every 0.38 s; the verdict card stamps down at 8.9 s and the Token hops.
- Visual DNA: Top-down light-oak desk; a kraft shipping box with a white label, barcode, red FRAGILE and this-side-up arrows; an off-white inner box with MOTION on the lid, white tissue sealed with an orange sticker, black foam cradling the orange Token. Simple-shape hands with navy sleeves and soft drop shadows. Knolled contents — wordmark card, orange quick-start booklet, sticker sheet, easing card — with dashed alignment guides and gap dimensions.
- Signature transitions: One continuous overhead take; a push-in on the reveal and back out for the layout
- Key techniques: Overhead locked-off camera, hands in frame, Each layer slower; the last layer before the reveal slowest, Knolled contents and a first-impression verdict

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Overhead locked-off camera, hands in frame, Each layer slower; the last layer before the reveal slowest, Knolled contents and a first-impression verdict).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Overhead locked-off camera, hands in frame and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "UNBOXING", held for about 1 s.

BUILD RULES
- Suggested tools: Overhead rig (camera on a C-stand arm or copy stand) and diffused top light, Real-time capture with a slowed reveal; knolling laid out by hand on a grid, Canvas 2D: fold transforms for flaps and tissue, keyed hand tracks, a pace curve in the caption. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Unboxing motion-graphics film (Overhead, slow before the reveal, knolled contents). Visual style: top-down light-oak desk; a kraft shipping box with a white label, barcode, red FRAGILE and this-side-up arrows; an off-white inner box with MOTION on the lid, white tissue sealed with an orange sticker, black foam cradling the orange Token. Simple-shape hands with navy sleeves and soft drop shadows. Knolled contents — wordmark card, orange quick-start booklet, sticker sheet, easing card — with dashed alignment guides and gap dimensions. Motion: action gets shorter then stops: the box drops with a thud, the tape cut runs 0.8 s, the flaps 0.75 s, the lid lifts off in 0.5 s — then the sticker and two tissue sheets take 1.55 s on a slow ease with the music pulled out. The reveal at 5.45 s is a hit, a shine sweep and a 10 % push-in; the box slides aside and five items fly to their knolled spots, alternate hands, one every 0.38 s; the verdict card stamps down at 8.9 s and the Token hops. Signature moves: overhead locked-off camera, hands in frame, each layer slower; the last layer before the reveal slowest, knolled contents and a first-impression verdict; transitions: one continuous overhead take; a push-in on the reveal and back out for the layout. In the tradition of iPhone launch unboxings (YouTube, June 2007) · Unbox Therapy (Lewis Hilsenteger, 2010 —) · Tom Sachs, ‘Ten Bullets’ (2010; ‘Always be knolling’). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "UNBOXING". Punchy sound design synced to every cut.
```
