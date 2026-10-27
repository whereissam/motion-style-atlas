# Cyberpunk Neon

*Rain, Neon, Kanji · 1982 — · Cinematic & Film Language*

Reference film: `videos/cyberpunk.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cyberpunk Neon** (Rain, Neon, Kanji, 1982 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: From Blade Runner to Cyberpunk 2077, rain-soaked neon cities. Hugely popular in Chinese "cyber-Chongqing" edits.
- Study these reference works: Blade Runner (1982) · Ghost in the Shell (1995) · Cyberpunk 2077 (2020)
- Motion DNA: Slow push through layered parallax while signs stutter on and rain falls.
- Visual DNA: Magenta and cyan neon, Chinese signage, puddle reflections, haze.
- Signature transitions: Blackout then neon ignition
- Key techniques: Neon flicker, Wet reflections, Parallax city

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Neon flicker, Wet reflections, Parallax city).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Neon flicker and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CYBERPUNK NEON", held for about 1 s.

BUILD RULES
- Suggested tools: Unreal, Blender, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cyberpunk Neon motion-graphics film (Rain, Neon, Kanji). Visual style: magenta and cyan neon, Chinese signage, puddle reflections, haze. Motion: slow push through layered parallax while signs stutter on and rain falls. Signature moves: neon flicker, wet reflections, parallax city; transitions: blackout then neon ignition. In the tradition of Blade Runner (1982) · Ghost in the Shell (1995) · Cyberpunk 2077 (2020). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CYBERPUNK NEON". Punchy sound design synced to every cut.
```
