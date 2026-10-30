# Parallax

*Depth from differential speed · 1930s — · Technique Atlas*

Reference film: `videos/techparallax.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Parallax** (Depth from differential speed, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: When the camera moves sideways, near things cross the frame faster than far ones, and that difference in speed alone reads as depth. Disney’s multiplane camera, first used on The Old Mill (1937) and then Snow White, shot painted layers on glass at different distances; side-scrolling games such as Moon Patrol (1982) scrolled background layers at fractions of the foreground speed, and the same idea drives 2.5D photo animation and parallax web pages.
- Study these reference works: The Old Mill (Disney, 1937) · Snow White and the Seven Dwarfs (Disney, 1937) · Moon Patrol (Irem, 1982) · The Kid Stays in the Picture (Brett Morgen & Nanette Burstein, 2002)
- Motion DNA: A held frame, then a long eased truck to one side: the near Token copies race across the top, the Token keeps pace with the camera, the back row lags and the giant far MOTION barely drifts. The frame splits so a single-speed flattened version runs next to the parallax one through two more trucks, then the camera returns home and holds.
- Visual DNA: The kit stage seen as four flat cut-out planes: the faint grid and an enormous pale MOTION far back, a row of pale Token copies, the orange Token with its shadow, and big light-orange copies cropping the top edge; mono layer tags, a plan-view inset of track, view cone, layers and speed arrows, and two labelled panels for the comparison.
- Signature transitions: Truck, split into flattened vs parallax panels, truck back to the full frame and hold
- Key techniques: Layer offset = camera offset / depth, Sideways truck, eased on the beat, Flattened vs parallax split

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Layer offset = camera offset / depth, Sideways truck, eased on the beat, Flattened vs parallax split).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Layer offset = camera offset / depth and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PARALLAX", held for about 1 s.

BUILD RULES
- Suggested tools: Multiplane camera stand; layered compositing in After Effects with a 2-node camera, Canvas 2D layers offset by camera position / depth, Split-screen comparison drawing the same scene twice. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Parallax motion-graphics film (Depth from differential speed). Visual style: the kit stage seen as four flat cut-out planes: the faint grid and an enormous pale MOTION far back, a row of pale Token copies, the orange Token with its shadow, and big light-orange copies cropping the top edge; mono layer tags, a plan-view inset of track, view cone, layers and speed arrows, and two labelled panels for the comparison. Motion: a held frame, then a long eased truck to one side: the near Token copies race across the top, the Token keeps pace with the camera, the back row lags and the giant far MOTION barely drifts. The frame splits so a single-speed flattened version runs next to the parallax one through two more trucks, then the camera returns home and holds. Signature moves: layer offset = camera offset / depth, sideways truck, eased on the beat, flattened vs parallax split; transitions: truck, split into flattened vs parallax panels, truck back to the full frame and hold. In the tradition of The Old Mill (Disney, 1937) · Snow White and the Seven Dwarfs (Disney, 1937) · Moon Patrol (Irem, 1982) · The Kid Stays in the Picture (Brett Morgen & Nanette Burstein, 2002). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PARALLAX". Punchy sound design synced to every cut.
```
