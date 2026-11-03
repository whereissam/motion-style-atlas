# Neon Signage

*Bent Glass, Noble Gas, Night · 1923 — 1965 · Graphic Design & Historical*

Reference film: `videos/neon.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Neon Signage** (Bent Glass, Noble Gas, Night, 1923 — 1965; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Neon signs are hand-bent glass tubes filled with low-pressure gas and lit by a high-voltage transformer: neon glows red-orange, argon with a drop of mercury glows blue, and phosphor coatings give every other colour. Georges Claude showed the first neon tubes in Paris in 1910 and the signs reached America in 1923; by the 1950s the Young Electric Sign Company had turned Las Vegas into a street of animated cabinets, chaser bulbs and sequenced arrows, and Hong Kong’s Nathan Road hung its signs in canyons over the traffic. The Neon Museum in Las Vegas now keeps the retired ones.
- Study these reference works: Neon tube lighting (Georges Claude, Paris Motor Show, 1910) · Vegas Vic (Young Electric Sign Company, 1951) · Welcome to Fabulous Las Vegas sign (Betty Willis, 1959) · The Neon Museum, Las Vegas (opened 2012)
- Motion DNA: Nothing slides: light is the only thing that moves. Tubes strike with a stutter and argon warms up slowly, chaser bulbs step round the cabinet, the arrow builds segment by segment and blanks, a three-state figure jumps between fixed poses, a faulty tube sputters and dies, while rain falls and the reflections ripple in the puddles.
- Visual DNA: Saturated pink, argon blue, red, yellow and turquoise light with white-hot tube cores and wide soft halos, against wet red brick and dark pavement; script and block lettering in a single continuous tube, electrodes and glass standoffs, a painted Googie sheet-metal cabinet ringed with incandescent bulbs.
- Signature transitions: Element-by-element ignition, sequenced arrow chase, three-state flasher animation, failing-tube sputter
- Key techniques: Pre-blurred tube halos, Seeded ignition flicker, Sliced puddle reflection

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Pre-blurred tube halos, Seeded ignition flicker, Sliced puddle reflection).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Pre-blurred tube halos and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "NEON SIGNAGE", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-bent glass tube, GTO wire and flasher drums, After Effects glow + Saber on traced lettering, Canvas 2D (offscreen halo sprites, light spill multiplied into an albedo map). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Neon Signage motion-graphics film (Bent Glass, Noble Gas, Night). Visual style: saturated pink, argon blue, red, yellow and turquoise light with white-hot tube cores and wide soft halos, against wet red brick and dark pavement; script and block lettering in a single continuous tube, electrodes and glass standoffs, a painted Googie sheet-metal cabinet ringed with incandescent bulbs. Motion: nothing slides: light is the only thing that moves. Tubes strike with a stutter and argon warms up slowly, chaser bulbs step round the cabinet, the arrow builds segment by segment and blanks, a three-state figure jumps between fixed poses, a faulty tube sputters and dies, while rain falls and the reflections ripple in the puddles. Signature moves: pre-blurred tube halos, seeded ignition flicker, sliced puddle reflection; transitions: element-by-element ignition, sequenced arrow chase, three-state flasher animation, failing-tube sputter. In the tradition of Neon tube lighting (Georges Claude, Paris Motor Show, 1910) · Vegas Vic (Young Electric Sign Company, 1951) · Welcome to Fabulous Las Vegas sign (Betty Willis, 1959) · The Neon Museum, Las Vegas (opened 2012). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "NEON SIGNAGE". Punchy sound design synced to every cut.
```
