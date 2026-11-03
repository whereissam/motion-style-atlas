# Documentary Montage

*Photographs, maps and letters in motion · 1957 — · Cinematic & Film Language*

Reference film: `videos/documentary.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Documentary Montage** (Photographs, maps and letters in motion, 1957 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Documentary montage tells history with still images: a rostrum camera pans and zooms across archival photographs, maps and letters while narration and readings carry the story. The National Film Board of Canada’s City of Gold (Colin Low and Wolf Koenig, 1957) pioneered the moving camera over stills; Ken Burns made it a national idiom with The Civil War (1990), and Apple later named the slow pan-and-zoom the “Ken Burns effect”. Errol Morris supplied the opposite pole: witnesses who look straight down the lens through his Interrotron, a teleprompter rig that puts the interviewer’s face over the camera.
- Study these reference works: City of Gold (Colin Low & Wolf Koenig, NFB, 1957) · Brooklyn Bridge (Ken Burns, 1981) · The Thin Blue Line (Errol Morris, 1988) · The Civil War (Ken Burns, PBS, 1990) · Baseball (Ken Burns, PBS, 1994) · The Fog of War (Errol Morris, 2003)
- Motion DNA: The camera, not the subject, moves: unhurried push-ins on a face until the eyes hold the frame, pans across group photographs that discover people one by one, a route that draws itself across a map, a tilt down a handwritten page; long cross-dissolves between stills and the one hard, modern cut into an interview with a single jump cut.
- Visual DNA: Sepia tintypes in brass mats, albumen prints on card with pencil captions, parchment maps with hachured hills and a red dashed march, ruled letter paper in iron-gall ink; supers in plain white serif lower left; the interview lit low and warm, subject dead centre, eyes on the lens.
- Signature transitions: Fade up from black, slow cross-dissolves between stills, hard cut to and from the interview, jump cut, pull back to reveal the print under the title
- Key techniques: Slow pan-and-zoom over stills, Name supers and a dated route map, Letter revealed in handwriting

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Slow pan-and-zoom over stills, Name supers and a dated route map, Letter revealed in handwriting).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Slow pan-and-zoom over stills and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DOCUMENTARY MONTAGE", held for about 1 s.

BUILD RULES
- Suggested tools: Rostrum / animation-stand camera, Avid or Final Cut pan-and-zoom on scans, Canvas 2D (every photograph procedurally drawn). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (no archival material used; people and places are fictional).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Documentary Montage motion-graphics film (Photographs, maps and letters in motion). Visual style: sepia tintypes in brass mats, albumen prints on card with pencil captions, parchment maps with hachured hills and a red dashed march, ruled letter paper in iron-gall ink; supers in plain white serif lower left; the interview lit low and warm, subject dead centre, eyes on the lens. Motion: the camera, not the subject, moves: unhurried push-ins on a face until the eyes hold the frame, pans across group photographs that discover people one by one, a route that draws itself across a map, a tilt down a handwritten page; long cross-dissolves between stills and the one hard, modern cut into an interview with a single jump cut. Signature moves: slow pan-and-zoom over stills, name supers and a dated route map, letter revealed in handwriting; transitions: fade up from black, slow cross-dissolves between stills, hard cut to and from the interview, jump cut, pull back to reveal the print under the title. In the tradition of City of Gold (Colin Low & Wolf Koenig, NFB, 1957) · Brooklyn Bridge (Ken Burns, 1981) · The Thin Blue Line (Errol Morris, 1988) · The Civil War (Ken Burns, PBS, 1990) · Baseball (Ken Burns, PBS, 1994) · The Fog of War (Errol Morris, 2003). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DOCUMENTARY MONTAGE". Punchy sound design synced to every cut.
```
