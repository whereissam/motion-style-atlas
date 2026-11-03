# Product Launch

*The keynote reveal film · 2007 — · Social & Commercial*

Reference film: `videos/launch.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Product Launch** (The keynote reveal film, 2007 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The launch film is the short that plays when a company unveils new hardware on stage: darkness, a teaser line, slow macro shots over materials, then the product and its one-word name, a few specs and "available now". Apple’s Macworld and WWDC keynotes set the grammar in the late 2000s and every phone, laptop and headphone maker followed.
- Study these reference works: Apple Macworld keynotes: iPhone introduction (2007) and MacBook Air out of an envelope (2008) · Apple product films narrated by Jony Ive (2000s–2010s) · Apple “Think different” (TBWA\Chiat\Day, 1997) as the tone of the sign-off
- Motion DNA: Editorial pacing is the motion: slow fades on the teaser, macro glides that never stop moving and cut through black, a single long swing from edge-on to three-quarter view as the lid opens, then a sudden switch to hard cuts where each spec slams in from scale with a small camera shake, before a calm sign-off.
- Visual DNA: A black stage and one cool blue–violet light; brushed aluminium, diamond-cut chamfers, speaker perforations and backlit keys shot macro with shallow focus; a waking screen as the only colour; huge tight-tracked grotesque numbers with small mono kickers.
- Signature transitions: Line of light into the teaser, dip-to-black between macro shots, sliver to hero swing, name rising from blur, hard cuts between spec beats, cut to the sign-off
- Key techniques: Teaser → macro → reveal, Edge-on to 3/4 hero swing, Spec slams on hard cuts

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Teaser → macro → reveal, Edge-on to 3/4 hero swing, Spec slams on hard cuts).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Teaser → macro → reveal and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PRODUCT LAUNCH", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D / Redshift product renders, After Effects editorial and type, Canvas 2D (projected box model). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (fictional product, no real logos).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Product Launch motion-graphics film (The keynote reveal film). Visual style: a black stage and one cool blue–violet light; brushed aluminium, diamond-cut chamfers, speaker perforations and backlit keys shot macro with shallow focus; a waking screen as the only colour; huge tight-tracked grotesque numbers with small mono kickers. Motion: editorial pacing is the motion: slow fades on the teaser, macro glides that never stop moving and cut through black, a single long swing from edge-on to three-quarter view as the lid opens, then a sudden switch to hard cuts where each spec slams in from scale with a small camera shake, before a calm sign-off. Signature moves: teaser → macro → reveal, edge-on to 3/4 hero swing, spec slams on hard cuts; transitions: line of light into the teaser, dip-to-black between macro shots, sliver to hero swing, name rising from blur, hard cuts between spec beats, cut to the sign-off. In the tradition of Apple Macworld keynotes: iPhone introduction (2007) and MacBook Air out of an envelope (2008) · Apple product films narrated by Jony Ive (2000s–2010s) · Apple “Think different” (TBWA\Chiat\Day, 1997) as the tone of the sign-off. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PRODUCT LAUNCH". Punchy sound design synced to every cut.
```
