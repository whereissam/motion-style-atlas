# Mid-century Modern

*Atomic-Age Flat Colour · 1945 — 1969 · Graphic Design & Historical*

Reference film: `videos/midcentury.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Mid-century Modern** (Atomic-Age Flat Colour, 1945 — 1969; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The post-war look of the American 1950s and early ’60s: UPA’s limited animation (Gerald McBoing-Boing, 1950) and the TV backgrounds of Hanna-Barbera artists such as Ed Benedict and Art Lozzi, Mary Blair’s colour styling for Disney, Charley Harper’s geometric birds, Alexander Girard’s textiles for Herman Miller, and the furniture of Charles and Ray Eames. Atomic-age optimism turned into boomerangs, starbursts, kidney shapes and flat, textured colour printed slightly off its ink line.
- Study these reference works: Gerald McBoing-Boing (UPA, 1950) · The Flintstones / The Jetsons backgrounds (Hanna-Barbera, 1960–63) · It’s a Small World (Mary Blair, 1964) · Charley Harper’s Ford Times bird prints (1950s) · Girard textiles for Herman Miller (1952—) · Eames Lounge Chair (1956) · Sleeping Beauty backgrounds (Eyvind Earle, 1959)
- Motion DNA: Bouncy and optimistic: shapes pop on with a little overshoot, boomerangs whirl, the backdrop slides past in a smooth TV-cartoon pan while the characters move on twos, and sparkles twinkle on the off-beats of a cool-jazz combo.
- Visual DNA: Mustard, teal, burnt orange, olive and pink on cream; flat fills with a dry-brush texture, brown ink lines printed a few pixels off the colour, lollipop and triangle trees, butterfly roofs, kidney shapes, boomerangs and four-point starbursts.
- Signature transitions: Starburst pop and boomerang wipe, stage-set assembly, parallax pan, tilt-up to sky, tile wave flip, tile drop to title card
- Key techniques: Parallax backdrop pan, Off-register ink lines over flat fills, Geometric character on twos, Wave-flipped pattern tiles

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Parallax backdrop pan, Off-register ink lines over flat fills, Geometric character on twos, Wave-flipped pattern tiles).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Parallax backdrop pan and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MID-CENTURY MODERN", held for about 1 s.

BUILD RULES
- Suggested tools: Gouache backgrounds and cel overlay, Illustrator + After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Mid-century Modern motion-graphics film (Atomic-Age Flat Colour). Visual style: mustard, teal, burnt orange, olive and pink on cream; flat fills with a dry-brush texture, brown ink lines printed a few pixels off the colour, lollipop and triangle trees, butterfly roofs, kidney shapes, boomerangs and four-point starbursts. Motion: bouncy and optimistic: shapes pop on with a little overshoot, boomerangs whirl, the backdrop slides past in a smooth TV-cartoon pan while the characters move on twos, and sparkles twinkle on the off-beats of a cool-jazz combo. Signature moves: parallax backdrop pan, off-register ink lines over flat fills, geometric character on twos, wave-flipped pattern tiles; transitions: starburst pop and boomerang wipe, stage-set assembly, parallax pan, tilt-up to sky, tile wave flip, tile drop to title card. In the tradition of Gerald McBoing-Boing (UPA, 1950) · The Flintstones / The Jetsons backgrounds (Hanna-Barbera, 1960–63) · It’s a Small World (Mary Blair, 1964) · Charley Harper’s Ford Times bird prints (1950s) · Girard textiles for Herman Miller (1952—) · Eames Lounge Chair (1956) · Sleeping Beauty backgrounds (Eyvind Earle, 1959). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MID-CENTURY MODERN". Punchy sound design synced to every cut.
```
