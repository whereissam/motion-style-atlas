# Music Video

*Concept videos cut on the beat · 1981 — · Cinematic & Film Language*

Reference film: `videos/musicvideo.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Music Video** (Concept videos cut on the beat, 1981 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The music video turned a single into a three-minute short film: after MTV launched in 1981, directors treated each song as a concept, building performance, choreography and in-camera tricks around its tempo. Michel Gondry made the arrangement the choreography in Daft Punk’s “Around the World” (each costumed group dances one instrument), Spike Jonze had Christopher Walken dance and fly through an empty hotel lobby in Fatboy Slim’s “Weapon of Choice”, and OK Go danced across eight treadmills in a single take for “Here It Goes Again”.
- Study these reference works: Thriller (Michael Jackson, dir. John Landis, 1983) · Take On Me (a-ha, dir. Steve Barron, 1985) · Sledgehammer (Peter Gabriel, dir. Stephen R. Johnson, 1986) · Around the World (Daft Punk, dir. Michel Gondry, 1997) · Praise You (Fatboy Slim, dir. Spike Jonze, 1999) · Weapon of Choice (Fatboy Slim, dir. Spike Jonze, 2001) · Star Guitar (The Chemical Brothers, dir. Michel Gondry, 2002) · Here It Goes Again (OK Go, 2006)
- Motion DNA: The track is the edit: every cut lands on a beat and every shot changes on the bar, bodies hit their poses a frame after the downbeat, crowds move in lockstep loops, one-take routines run without a cut, a man rises off the floor on a held chord, and mirrored dancers fold into a kaleidoscope that turns at the tempo.
- Visual DNA: A concept per shot, each with its own colour-graded set: a violet disco stage with gold-helmeted robots and skeletons on a staircase, a warm empty hotel lobby, a yellow warehouse of treadmills and bright shirts, magenta-to-cyan mirror worlds, then a teal-and-amber stage of rim-lit silhouettes under moving-head beams; the MTV credit block in plain white type.
- Signature transitions: Hard cuts on the beat (never faster than one per half second), a cut to a closer angle on the downbeat, mirror split to four-way to kaleidoscope, title words set on the last two beats
- Key techniques: Cuts locked to 120 BPM, One-take choreography sets, Mirror and kaleidoscope

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Cuts locked to 120 BPM, One-take choreography sets, Mirror and kaleidoscope).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Cuts locked to 120 BPM and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MUSIC VIDEO", held for about 1 s.

BUILD RULES
- Suggested tools: 35 mm / 16 mm music-video shoots, Motion-control and in-camera tricks, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (artist, song and label are fictional).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Music Video motion-graphics film (Concept videos cut on the beat). Visual style: a concept per shot, each with its own colour-graded set: a violet disco stage with gold-helmeted robots and skeletons on a staircase, a warm empty hotel lobby, a yellow warehouse of treadmills and bright shirts, magenta-to-cyan mirror worlds, then a teal-and-amber stage of rim-lit silhouettes under moving-head beams; the MTV credit block in plain white type. Motion: the track is the edit: every cut lands on a beat and every shot changes on the bar, bodies hit their poses a frame after the downbeat, crowds move in lockstep loops, one-take routines run without a cut, a man rises off the floor on a held chord, and mirrored dancers fold into a kaleidoscope that turns at the tempo. Signature moves: cuts locked to 120 bpm, one-take choreography sets, mirror and kaleidoscope; transitions: hard cuts on the beat (never faster than one per half second), a cut to a closer angle on the downbeat, mirror split to four-way to kaleidoscope, title words set on the last two beats. In the tradition of Thriller (Michael Jackson, dir. John Landis, 1983) · Take On Me (a-ha, dir. Steve Barron, 1985) · Sledgehammer (Peter Gabriel, dir. Stephen R. Johnson, 1986) · Around the World (Daft Punk, dir. Michel Gondry, 1997) · Praise You (Fatboy Slim, dir. Spike Jonze, 1999) · Weapon of Choice (Fatboy Slim, dir. Spike Jonze, 2001) · Star Guitar (The Chemical Brothers, dir. Michel Gondry, 2002) · Here It Goes Again (OK Go, 2006). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MUSIC VIDEO". Punchy sound design synced to every cut.
```
