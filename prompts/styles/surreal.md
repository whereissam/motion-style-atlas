# Surreal Cinema

*Dream logic on film · 1928 — · Cinematic & Film Language*

Reference film: `videos/surreal.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Surreal Cinema** (Dream logic on film, 1928 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Surrealist film cuts the way a dream does: rooms open onto impossible places, objects turn into other objects and the intertitles lie about time. Luis Buñuel and Salvador Dalí’s Un Chien Andalou (1929) set the grammar, Maya Deren’s Meshes of the Afternoon (1943) looped a dreamer through her own house, Jan Švankmajer animated objects into uncanny life, and David Lynch carried the mode into curtained rooms with zigzag floors.
- Study these reference works: Un Chien Andalou (Luis Buñuel & Salvador Dalí, 1929) · L’Âge d’Or (Buñuel, 1930) · Meshes of the Afternoon (Maya Deren & Alexander Hammid, 1943) · Spellbound, dream sequence designed by Dalí (Alfred Hitchcock, 1945) · Dimensions of Dialogue (Jan Švankmajer, 1982) · Alice (Švankmajer, 1988) · Twin Peaks (David Lynch & Mark Frost, 1990) · Mulholland Drive (Lynch, 2001)
- Motion DNA: A slow camera that never stops: an even dolly that is suddenly pulled through a door, a tilt from cloud down to sand, a fall into an eye. Things move with dream patience — a key floating, men rising like balloons, a clock sagging — and one object turns into another in stepped stop-motion jumps.
- Visual DNA: Red pleated curtains over a black-and-white zigzag floor, a hooded figure with a mirror for a face, Magritte’s blue sky and sculpted clouds (an eye whose iris is sky, bowler-hatted men, a bird cut from sky, a night street under a noon sky), Dalí’s ochre plain, cliffs and melting clock, soft grain and lying intertitles.
- Signature transitions: Door as portal, tilt reveal, match on object (key becomes bird), a blink, zoom into the pupil as it turns into a keyhole
- Key techniques: Door-as-portal dolly, Stop-motion object morph, Zoom through a pupil

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Door-as-portal dolly, Stop-motion object morph, Zoom through a pupil).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Door-as-portal dolly and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SURREAL CINEMA", held for about 1 s.

BUILD RULES
- Suggested tools: 35mm camera, built sets and in-camera tricks, Stop-motion animation, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural homage.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Surreal Cinema motion-graphics film (Dream logic on film). Visual style: red pleated curtains over a black-and-white zigzag floor, a hooded figure with a mirror for a face, Magritte’s blue sky and sculpted clouds (an eye whose iris is sky, bowler-hatted men, a bird cut from sky, a night street under a noon sky), Dalí’s ochre plain, cliffs and melting clock, soft grain and lying intertitles. Motion: a slow camera that never stops: an even dolly that is suddenly pulled through a door, a tilt from cloud down to sand, a fall into an eye. Things move with dream patience — a key floating, men rising like balloons, a clock sagging — and one object turns into another in stepped stop-motion jumps. Signature moves: door-as-portal dolly, stop-motion object morph, zoom through a pupil; transitions: door as portal, tilt reveal, match on object (key becomes bird), a blink, zoom into the pupil as it turns into a keyhole. In the tradition of Un Chien Andalou (Luis Buñuel & Salvador Dalí, 1929) · L’Âge d’Or (Buñuel, 1930) · Meshes of the Afternoon (Maya Deren & Alexander Hammid, 1943) · Spellbound, dream sequence designed by Dalí (Alfred Hitchcock, 1945) · Dimensions of Dialogue (Jan Švankmajer, 1982) · Alice (Švankmajer, 1988) · Twin Peaks (David Lynch & Mark Frost, 1990) · Mulholland Drive (Lynch, 2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SURREAL CINEMA". Punchy sound design synced to every cut.
```
