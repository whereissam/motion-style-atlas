# Push

*The new shot shoves the old one out of frame · 1930s — · Technique Atlas*

Reference film: `videos/techpush.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Push** (The new shot shoves the old one out of frame, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A push (or push-off) moves both pictures at once: the incoming shot enters butted against the outgoing one and drives it out of frame, so one edge separates them for the whole move. Optical printers could produce pushes alongside wipes and flips, and they became a stock pattern of television switchers and digital video effects units in the 1970s and 80s; today Push and Slide sit side by side in every editor’s transition bin, and the same motion is the standard screen-to-screen navigation of mobile interfaces.
- Study these reference works: Final Cut Pro Push and Slide transitions (Apple) · Adobe Premiere Pro Push and Split transitions · iOS navigation push between screens (Apple, 2007 —)
- Motion DNA: Two pictures locked together at one edge travel as a single strip, so nothing in either shot moves except the strip. Four pushes on four eases — a smooth in-out cubic to the left, a fast-start out-quart upward, a mechanical linear push to the right and a snapping in-out expo downward — then a slide where the old shot holds still under the new one, and a split push whose two bands run in opposite directions.
- Visual DNA: The Technique Atlas stage with a 16:9 viewer framed in ink; seven shots of the Token in orange, ink, blue, accent and paper colourways; the off-frame part of each shot kept as a faded ghost outside the viewer with dashed frame lines; an orange bar on the shared edge; ink and orange offset chips per shot and a sum readout under the viewer; a row of transition chips along the top.
- Signature transitions: Push left, up, right and down; slide (cover); split push in two opposed bands
- Key techniques: Both shots move, edge to edge, Offsets always sum to one frame, Slide and split-push variants

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Both shots move, edge to edge, Offsets always sum to one frame, Slide and split-push variants).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Both shots move, edge to edge and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PUSH", held for about 1 s.

BUILD RULES
- Suggested tools: Optical printer / video switcher push patterns, Premiere Pro Push · Final Cut Slide · After Effects position keys on two layers, Canvas 2D: both shots translated by u·W and u·W − W, clipped to the viewer. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Push motion-graphics film (The new shot shoves the old one out of frame). Visual style: the Technique Atlas stage with a 16:9 viewer framed in ink; seven shots of the Token in orange, ink, blue, accent and paper colourways; the off-frame part of each shot kept as a faded ghost outside the viewer with dashed frame lines; an orange bar on the shared edge; ink and orange offset chips per shot and a sum readout under the viewer; a row of transition chips along the top. Motion: two pictures locked together at one edge travel as a single strip, so nothing in either shot moves except the strip. Four pushes on four eases — a smooth in-out cubic to the left, a fast-start out-quart upward, a mechanical linear push to the right and a snapping in-out expo downward — then a slide where the old shot holds still under the new one, and a split push whose two bands run in opposite directions. Signature moves: both shots move, edge to edge, offsets always sum to one frame, slide and split-push variants; transitions: push left, up, right and down; slide (cover); split push in two opposed bands. In the tradition of Final Cut Pro Push and Slide transitions (Apple) · Adobe Premiere Pro Push and Split transitions · iOS navigation push between screens (Apple, 2007 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PUSH". Punchy sound design synced to every cut.
```
