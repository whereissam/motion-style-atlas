# Ukiyo-e Motion

*Woodblock Prints · 1670s — · Cultural & Regional*

Reference film: `videos/ukiyoe.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Ukiyo-e Motion** (Woodblock Prints, 1670s —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Edo-period Japan’s “pictures of the floating world”: a keyblock of black outlines is carved, then one block per colour is inked and rubbed onto damp washi with a baren, so every print is a stack of flat, registered colour layers. Hokusai and Hiroshige made imported Prussian blue and the graded bokashi wipe the look of the 1830s landscape print.
- Study these reference works: Under the Wave off Kanagawa (Hokusai, c.1831) · Thirty-six Views of Mount Fuji (Hokusai, 1830–32) · Sudden Shower over Shin-Ōhashi Bridge and Atake (Hiroshige, 1857) · One Hundred Famous Views of Edo (Hiroshige, 1856–58)
- Motion DNA: The image is pulled block by block like a real print, then moves only in held, graphic poses: the wave curls into its claw-foam peak, boats rock, Hiroshige rain slashes across and the seal lands.
- Visual DNA: Flat registered colour inside confident black keyblock lines, Prussian blue graded into bare paper, with woodgrain and fibre showing through the ink.
- Signature transitions: Block-by-block print pull, registration settle, rain veil, seal stamp
- Key techniques: Keyblock + colour-block layers, Prussian-blue bokashi, Woodgrain & washi texture

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Keyblock + colour-block layers, Prussian-blue bokashi, Woodgrain & washi texture).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Keyblock + colour-block layers and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "UKIYO-E MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Procreate. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Ukiyo-e Motion motion-graphics film (Woodblock Prints). Visual style: flat registered colour inside confident black keyblock lines, Prussian blue graded into bare paper, with woodgrain and fibre showing through the ink. Motion: the image is pulled block by block like a real print, then moves only in held, graphic poses: the wave curls into its claw-foam peak, boats rock, Hiroshige rain slashes across and the seal lands. Signature moves: keyblock + colour-block layers, prussian-blue bokashi, woodgrain & washi texture; transitions: block-by-block print pull, registration settle, rain veil, seal stamp. In the tradition of Under the Wave off Kanagawa (Hokusai, c.1831) · Thirty-six Views of Mount Fuji (Hokusai, 1830–32) · Sudden Shower over Shin-Ōhashi Bridge and Atake (Hiroshige, 1857) · One Hundred Famous Views of Edo (Hiroshige, 1856–58). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "UKIYO-E MOTION". Punchy sound design synced to every cut.
```
