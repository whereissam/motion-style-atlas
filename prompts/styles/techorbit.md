# Orbit

*The camera circles the subject · 1950s — · Technique Atlas*

Reference film: `videos/techorbit.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Orbit** (The camera circles the subject, 1950s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: An orbit moves the camera around a subject on a circular dolly track, a crane or, later, a virtual path, keeping it centred while the background wheels past behind it. Hitchcock’s 360° kiss in Vertigo (1958) and Brian De Palma’s circling shots made it a signature move, Michael Bay turned the low-angle spin into a blockbuster cliché, and in 3D software the turntable orbit is the default way to show an object.
- Study these reference works: Vertigo (Alfred Hitchcock, 1958) · Obsession (Brian De Palma, 1976) · Bad Boys II (Michael Bay, 2003) · The Avengers (Joss Whedon, 2012)
- Motion DNA: The subject never leaves frame centre; everything else turns. A held front view, one smooth eased 360° at eye height, a crane down to the floor, a quicker low orbit looking up so the Token looms, then a rise into a still three-quarter view. The floor grid and lettering wheel past and the parallax of near and far floor gives the rotation its weight.
- Visual DNA: The kit stage as a perspective floor: warm paper with the faint grid fading into the horizon, an extruded orange Token with darker side walls and a punched hole, MOTION lettered on the floor in ink, a dashed orange orbit path, soft contact shadows, and a top-view map with the camera, its view cone and trail.
- Signature transitions: One continuous camera move: hold, orbit, crane down, low orbit, rise to a held three-quarter view
- Key techniques: Look-at camera on a circular path, Radius and height varied per orbit, Top-view map of the camera path

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Look-at camera on a circular path, Radius and height varied per orbit, Top-view map of the camera path).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Look-at camera on a circular path and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ORBIT", held for about 1 s.

BUILD RULES
- Suggested tools: Circular dolly track, crane or motion-control rig; a turntable path in 3D software, Look-at pinhole projection in Canvas 2D with back-face culling and flat shading, Camera angle, radius and height keyframed on the beat grid. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Orbit motion-graphics film (The camera circles the subject). Visual style: the kit stage as a perspective floor: warm paper with the faint grid fading into the horizon, an extruded orange Token with darker side walls and a punched hole, MOTION lettered on the floor in ink, a dashed orange orbit path, soft contact shadows, and a top-view map with the camera, its view cone and trail. Motion: the subject never leaves frame centre; everything else turns. A held front view, one smooth eased 360° at eye height, a crane down to the floor, a quicker low orbit looking up so the Token looms, then a rise into a still three-quarter view. The floor grid and lettering wheel past and the parallax of near and far floor gives the rotation its weight. Signature moves: look-at camera on a circular path, radius and height varied per orbit, top-view map of the camera path; transitions: one continuous camera move: hold, orbit, crane down, low orbit, rise to a held three-quarter view. In the tradition of Vertigo (Alfred Hitchcock, 1958) · Obsession (Brian De Palma, 1976) · Bad Boys II (Michael Bay, 2003) · The Avengers (Joss Whedon, 2012). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ORBIT". Punchy sound design synced to every cut.
```
