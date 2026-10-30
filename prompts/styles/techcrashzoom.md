# Crash Zoom

*A sudden snap of the zoom lens · 1960s — · Technique Atlas*

Reference film: `videos/techcrashzoom.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Crash Zoom** (A sudden snap of the zoom lens, 1960s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A crash zoom (or snap zoom) racks a zoom lens from wide to tight, or back, in a fraction of a second, so the frame lunges at a detail for shock or comedy. Once zoom lenses became practical it became a staple of 1960s–70s Italian westerns and Hong Kong kung-fu cinema, was revived in homage by Quentin Tarantino, and Edgar Wright made the whip-fast, sound-effected crash zoom a comic signature.
- Study these reference works: Shaw Brothers kung-fu films (1970s) · Kill Bill: Volume 1 (Quentin Tarantino, 2003) · Shaun of the Dead (Edgar Wright, 2004) · Hot Fuzz (Edgar Wright, 2007)
- Motion DNA: Stillness, then violence, then stillness: a calm wide, a snap in that lands exactly on the beat with a jolt of shake, a held close-up, a snap back out. A target bracket blinks a beat before the next crash, telegraphing the joke; the hole fills the frame; a double-take crashes onto a letter twice; the last crash out settles on a held wide.
- Visual DNA: The kit stage — warm paper, faint grid, orange Token, ink MOTION — seen through viewfinder corners with a mono zoom readout; zoom-blurred smears and radial manga speed lines during each snap, an orange anticipation bracket on the next target.
- Signature transitions: Hard snap zooms in and out on the beat, each landing with a short shake and settling into a hold
- Key techniques: Log-space zoom snapped in ~0.14 s, Zoom blur along the zoom path, Hit, hold and shake on the beat

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Log-space zoom snapped in ~0.14 s, Zoom blur along the zoom path, Hit, hold and shake on the beat).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Log-space zoom snapped in ~0.14 s and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CRASH ZOOM", held for about 1 s.

BUILD RULES
- Suggested tools: Zoom lens racked by hand or motor; a scale keyframe with motion blur in After Effects, Canvas transform about the focus point; zoom interpolated in log space, Offscreen frame re-composited along the zoom path for blur. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Crash Zoom motion-graphics film (A sudden snap of the zoom lens). Visual style: the kit stage — warm paper, faint grid, orange Token, ink MOTION — seen through viewfinder corners with a mono zoom readout; zoom-blurred smears and radial manga speed lines during each snap, an orange anticipation bracket on the next target. Motion: stillness, then violence, then stillness: a calm wide, a snap in that lands exactly on the beat with a jolt of shake, a held close-up, a snap back out. A target bracket blinks a beat before the next crash, telegraphing the joke; the hole fills the frame; a double-take crashes onto a letter twice; the last crash out settles on a held wide. Signature moves: log-space zoom snapped in ~0.14 s, zoom blur along the zoom path, hit, hold and shake on the beat; transitions: hard snap zooms in and out on the beat, each landing with a short shake and settling into a hold. In the tradition of Shaw Brothers kung-fu films (1970s) · Kill Bill: Volume 1 (Quentin Tarantino, 2003) · Shaun of the Dead (Edgar Wright, 2004) · Hot Fuzz (Edgar Wright, 2007). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CRASH ZOOM". Punchy sound design synced to every cut.
```
