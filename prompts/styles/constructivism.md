# Constructivism

*Art into Life, Type as a Weapon · 1919 — · Graphic Design & Historical*

Reference film: `videos/constructivism.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Constructivism** (Art into Life, Type as a Weapon, 1919 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Born in revolutionary Russia, Constructivism rejected easel art for agit-prop, posters and film; El Lissitzky, Alexander Rodchenko and the Stenberg brothers built images from diagonals, flat red and black, sans-serif type and photomontage.
- Study these reference works: "Beat the Whites with the Red Wedge" (El Lissitzky, 1919) · Lengiz "Books" poster (Rodchenko, 1924) · "Kino-Eye" poster (Rodchenko, 1924) · "Man with a Movie Camera" poster (Stenberg brothers, 1929) · "Iron Foundry" (Mosolov, 1926–28)
- Motion DNA: Nothing drifts: a wedge strikes, words slam on steep angles, rays burst, the loudspeaker recoils with each shout, and the camera whips and rolls between blocks before pulling back to the poster.
- Visual DNA: Red, black and raw cream; wedge, circle and bar; condensed sans set on diagonals; halftone eye and radiating lines on letterpress paper.
- Signature transitions: Whip pans with motion blur, camera rolls, red flash on impact, slam-in scale stamps, final pull-back reveal.
- Key techniques: Steep diagonal camera with whip-pan blur, Procedural halftone photomontage, Hard slams with overshoot and shake, Hand-cut edges and print mottling

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Steep diagonal camera with whip-pan blur, Procedural halftone photomontage, Hard slams with overshoot and shake, Hand-cut edges and print mottling).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Steep diagonal camera with whip-pan blur and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CONSTRUCTIVISM", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Constructivism motion-graphics film (Art into Life, Type as a Weapon). Visual style: red, black and raw cream; wedge, circle and bar; condensed sans set on diagonals; halftone eye and radiating lines on letterpress paper. Motion: nothing drifts: a wedge strikes, words slam on steep angles, rays burst, the loudspeaker recoils with each shout, and the camera whips and rolls between blocks before pulling back to the poster. Signature moves: steep diagonal camera with whip-pan blur, procedural halftone photomontage, hard slams with overshoot and shake, hand-cut edges and print mottling; transitions: whip pans with motion blur, camera rolls, red flash on impact, slam-in scale stamps, final pull-back reveal. In the tradition of "Beat the Whites with the Red Wedge" (El Lissitzky, 1919) · Lengiz "Books" poster (Rodchenko, 1924) · "Kino-Eye" poster (Rodchenko, 1924) · "Man with a Movie Camera" poster (Stenberg brothers, 1929) · "Iron Foundry" (Mosolov, 1926–28). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CONSTRUCTIVISM". Punchy sound design synced to every cut.
```
