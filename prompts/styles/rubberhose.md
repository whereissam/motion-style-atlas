# Rubber Hose

*Golden-age Cartoon · 1920s — · 2D Animation & Illustration*

Reference film: `videos/rubberhose.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Rubber Hose** (Golden-age Cartoon, 1920s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The first sound-era cartoon style: limbs drawn as boneless tubes that bend anywhere, so characters can bounce, stretch and dance on every beat of the soundtrack. It grew out of Fleischer Studios and Ub Iwerks' animation for early Disney, and was revived wholesale by Studio MDHR's Cuphead.
- Study these reference works: Steamboat Willie (Disney / Ub Iwerks, 1928) · The Skeleton Dance (Disney, 1929) · Swing You Sinners! (Fleischer, 1930) · Minnie the Moocher (Fleischer, 1932) · Cuphead (Studio MDHR, 2017)
- Motion DNA: A constant squash-and-stretch bounce locked to the music, with rubber limbs that stretch and snap back for gags.
- Visual DNA: Pie-cut eyes, white gloves and ink-black bodies on a faded sepia world, seen through grain, flicker and a weaving film gate.
- Signature transitions: Iris-in, iris-out, squash cut, title card
- Key techniques: Boneless noodle limbs, Everything pulses on the beat, Iris-out to a title card

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Boneless noodle limbs, Everything pulses on the beat, Iris-out to a title card).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Boneless noodle limbs and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RUBBER HOSE", held for about 1 s.

BUILD RULES
- Suggested tools: Toon Boom Harmony, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Needs hand animation (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Rubber Hose motion-graphics film (Golden-age Cartoon). Visual style: pie-cut eyes, white gloves and ink-black bodies on a faded sepia world, seen through grain, flicker and a weaving film gate. Motion: a constant squash-and-stretch bounce locked to the music, with rubber limbs that stretch and snap back for gags. Signature moves: boneless noodle limbs, everything pulses on the beat, iris-out to a title card; transitions: iris-in, iris-out, squash cut, title card. In the tradition of Steamboat Willie (Disney / Ub Iwerks, 1928) · The Skeleton Dance (Disney, 1929) · Swing You Sinners! (Fleischer, 1930) · Minnie the Moocher (Fleischer, 1932) · Cuphead (Studio MDHR, 2017). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RUBBER HOSE". Punchy sound design synced to every cut.
```
