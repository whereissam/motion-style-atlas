# Expressive Kinetic Type

*Type with a Voice · 1959 — · Typography & Text Motion*

Reference film: `videos/kinetic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Expressive Kinetic Type** (Type with a Voice, 1959 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Saul Bass and Pablo Ferro made words perform in film titles; in the 2000s After Effects lyric and dialogue pieces turned "kinetic typography" into a genre, where size, weight and placement follow the rhythm of a voice.
- Study these reference works: North by Northwest titles (Saul Bass, 1959) · Dr. Strangelove titles (Pablo Ferro, 1964) · Jamie xx, "Let's Do It Again" (2016) · Pulp Fiction kinetic type tributes (2000s)
- Motion DNA: Every word moves the way it is sung: whispers blur in, shouts slam with overshoot, stretched words track out and shaken words tremble, while the camera whips and rotates between phrases.
- Visual DNA: Black-weight grotesk against a hairline italic serif, bone on soot with one vermilion, all words locking into a single justified poster.
- Signature transitions: Whip pans with motion blur, 90° camera rolls, full-frame colour inversions on the downbeat, final pull-out reveal.
- Key techniques: Camera flies through a typographic poster, Spring slams, stretch & shake per glyph, Serif whisper vs. black sans shout

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Camera flies through a typographic poster, Spring slams, stretch & shake per glyph, Serif whisper vs. black sans shout).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Camera flies through a typographic poster and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "EXPRESSIVE KINETIC TYPE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Expressive Kinetic Type motion-graphics film (Type with a Voice). Visual style: black-weight grotesk against a hairline italic serif, bone on soot with one vermilion, all words locking into a single justified poster. Motion: every word moves the way it is sung: whispers blur in, shouts slam with overshoot, stretched words track out and shaken words tremble, while the camera whips and rotates between phrases. Signature moves: camera flies through a typographic poster, spring slams, stretch & shake per glyph, serif whisper vs. black sans shout; transitions: whip pans with motion blur, 90° camera rolls, full-frame colour inversions on the downbeat, final pull-out reveal. In the tradition of North by Northwest titles (Saul Bass, 1959) · Dr. Strangelove titles (Pablo Ferro, 1964) · Jamie xx, "Let's Do It Again" (2016) · Pulp Fiction kinetic type tributes (2000s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "EXPRESSIVE KINETIC TYPE". Punchy sound design synced to every cut.
```
