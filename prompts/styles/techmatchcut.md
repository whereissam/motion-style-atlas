# Match Cut

*A hard cut that carries a shape or an action across · 1920s — · Technique Atlas*

Reference film: `videos/techmatchcut.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Match Cut** (A hard cut that carries a shape or an action across, 1920s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Soviet montage and the silent avant-garde treated the splice itself as a tool, and editors soon learned that a cut disappears, or rhymes, when something carries across it: a shape, a position, a direction, a movement. The graphic match is the showpiece — Stanley Kubrick’s bone tossed into the air that becomes an orbiting satellite in 2001: A Space Odyssey (1968) — while the humbler cut on action, which finishes a movement in the next shot, is the everyday glue of continuity editing.
- Study these reference works: 2001: A Space Odyssey (Stanley Kubrick, 1968; bone-to-satellite cut) · Lawrence of Arabia (David Lean, 1962; match-to-sunrise cut) · Psycho (Alfred Hitchcock, 1960; plughole-to-eye match dissolve)
- Motion DNA: Five hard cuts, all on the beat at 1.5, 3.5, 5, 6.5 and 8.5 s. Motion continues through each splice: the spin keeps its angle and speed and only slows in the second shot, a push-in delivers the porthole at the sun’s exact size, the horizon becomes the floor at the same height, and a toss launched in the wide shot is cut a third of the way up and lands in the close shot.
- Visual DNA: The Technique Atlas stage, the orange Token, an ink dial with a blue porthole, an orange striped sun on a horizon; dashed orange guide outlines laid over the outgoing shot and carried into the incoming one; a dotted toss path split at the cut point; a numbered shot strip with beat ticks and accent cut markers.
- Signature transitions: Graphic match cut, position match cut, horizon-to-floor match, cut on action
- Key techniques: Graphic match on silhouette and spin, Position and size match, Cut on action

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Graphic match on silhouette and spin, Position and size match, Cut on action).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Graphic match on silhouette and spin and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MATCH CUT", held for about 1 s.

BUILD RULES
- Suggested tools: Picture editing (Avid, Premiere, Resolve) with onion-skin overlays to line up the match, After Effects: guide layers and parented nulls across comps, Canvas 2D: one draw function per shot, switched on beat-aligned cut times. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Match Cut motion-graphics film (A hard cut that carries a shape or an action across). Visual style: the Technique Atlas stage, the orange Token, an ink dial with a blue porthole, an orange striped sun on a horizon; dashed orange guide outlines laid over the outgoing shot and carried into the incoming one; a dotted toss path split at the cut point; a numbered shot strip with beat ticks and accent cut markers. Motion: five hard cuts, all on the beat at 1.5, 3.5, 5, 6.5 and 8.5 s. Motion continues through each splice: the spin keeps its angle and speed and only slows in the second shot, a push-in delivers the porthole at the sun’s exact size, the horizon becomes the floor at the same height, and a toss launched in the wide shot is cut a third of the way up and lands in the close shot. Signature moves: graphic match on silhouette and spin, position and size match, cut on action; transitions: graphic match cut, position match cut, horizon-to-floor match, cut on action. In the tradition of 2001: A Space Odyssey (Stanley Kubrick, 1968; bone-to-satellite cut) · Lawrence of Arabia (David Lean, 1962; match-to-sunrise cut) · Psycho (Alfred Hitchcock, 1960; plughole-to-eye match dissolve). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MATCH CUT". Punchy sound design synced to every cut.
```
