# Cold Open

*Pre-title teaser, cliffhanger, smash cut · 1950s — · Narrative Formats*

Reference film: `videos/formatcoldopen.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cold Open** (Pre-title teaser, cliffhanger, smash cut, 1950s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Television drama took the teaser from radio and film serials: a scene before the opening titles that drops the viewer into the action and ends on a hook strong enough to hold them through the credits. It was standard on American network series by the 1960s — Star Trek (1966) opened most episodes this way — and from the 1990s the cold open on a cliffhanger, smash-cut to the title card and followed by a time-jump super, became a fixture of prestige drama such as Breaking Bad (2008).
- Study these reference works: Star Trek (NBC, 1966–69) · The X-Files (Fox, 1993–2002) · Breaking Bad (AMC, 2008–13; pilot cold open)
- Motion DNA: No titles, no fade in: the first frame is already mid-slide. Tension builds for three seconds of handheld push-in with jolts on the off-beats; the cliffhanger at 4.6 s, a snap zoom at 5.05 s, the ledge breaks; a smash cut at 5.6 s on the peak of the fall to a still, bright title card held 1.8 s; a straight cut back at 7.4 s to calm daylight and a typed TWELVE HOURS EARLIER super.
- Visual DNA: Night: a blue-black void with distant lights, rain, a swinging lamp, a slate ledge cracking under the orange Token, heavy vignette. The title card: the paper ground with MOTION in black at full width. Day: the Technique Atlas paper stage, the same ledge whole, the Token at rest. Mono annotations name each convention.
- Signature transitions: Smash cut (night to bright title, sound cut with it); straight cut back to the story
- Key techniques: In medias res: no titles until the hook lands, Smash cut on the peak of the action, Time-jump super back into the story

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (In medias res: no titles until the hook lands, Smash cut on the peak of the action, Time-jump super back into the story).
- 5.0–8.0 s  Climax: the most spectacular moment, built on In medias res: no titles until the hook lands and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "COLD OPEN", held for about 1 s.

BUILD RULES
- Suggested tools: Editorial: cut on action at the peak, hard sound cut, Title card and super from the show’s graphics package, Canvas 2D: one ledge rig drawn as night and day, with a procedural handheld camera. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cold Open motion-graphics film (Pre-title teaser, cliffhanger, smash cut). Visual style: night: a blue-black void with distant lights, rain, a swinging lamp, a slate ledge cracking under the orange Token, heavy vignette. The title card: the paper ground with MOTION in black at full width. Day: the Technique Atlas paper stage, the same ledge whole, the Token at rest. Mono annotations name each convention. Motion: no titles, no fade in: the first frame is already mid-slide. Tension builds for three seconds of handheld push-in with jolts on the off-beats; the cliffhanger at 4.6 s, a snap zoom at 5.05 s, the ledge breaks; a smash cut at 5.6 s on the peak of the fall to a still, bright title card held 1.8 s; a straight cut back at 7.4 s to calm daylight and a typed TWELVE HOURS EARLIER super. Signature moves: in medias res: no titles until the hook lands, smash cut on the peak of the action, time-jump super back into the story; transitions: smash cut (night to bright title, sound cut with it); straight cut back to the story. In the tradition of Star Trek (NBC, 1966–69) · The X-Files (Fox, 1993–2002) · Breaking Bad (AMC, 2008–13; pilot cold open). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "COLD OPEN". Punchy sound design synced to every cut.
```
