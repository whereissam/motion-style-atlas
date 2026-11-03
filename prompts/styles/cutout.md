# Cut-out

*Jointed Paper Under the Camera · 1917 — · 2D Animation & Illustration*

Reference film: `videos/cutout.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cut-out** (Jointed Paper Under the Camera, 1917 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Cut-out animation moves flat pieces of paper or card, pinned or hinged at the joints, a frame at a time beneath a downward-looking rostrum camera. Quirino Cristiani made the first animated feature, El Apóstol (1917), this way; Terry Gilliam glued Victorian engravings into hinged absurdities for Monty Python; Yuri Norstein spread his cut-outs over tiers of glass with tracing-paper fog between them; and South Park’s first episode (1997) was shot in real construction paper before the look moved into software.
- Study these reference works: Monty Python’s Flying Circus animations (Terry Gilliam, BBC, 1969–74) · Fantastic Planet (René Laloux & Roland Topor, 1973) · Hedgehog in the Fog (Yuri Norstein, Soyuzmultfilm, 1975) · Tale of Tales (Yuri Norstein, 1979) · South Park, first episode (Trey Parker & Matt Stone, Comedy Central, 1997)
- Motion DNA: Every move is a piece pushed a few millimetres and shot again: limbs swing on their pins instead of bending, the walk is a crude pendulum cycle on twos, the head tilts as a rigid disc and expressions change by swapping in a replacement face; the planes slide past at their own speeds, and each piece settles a hair off where it lay the frame before.
- Visual DNA: Matte construction paper with fibre and slightly ragged scissor-cut edges, soft shadows between pieces and between glass plates, brass split pins at the joints, a dusk palette of slate blue, pine green and earth with a red coat, mustard cap and teal scarf, and tracing-paper fog drifting between the layers.
- Signature transitions: Empty sky → plates slid in one by one → puppet assembled and pinned → walk on twos with a multiplane truck → owl flaps in → replacement face → title tiles set down letter by letter
- Key techniques: Brass-pinned paper joints, Multiplane glass, tracing-paper fog, Stepped on twos (12 fps)

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Brass-pinned paper joints, Multiplane glass, tracing-paper fog, Stepped on twos (12 fps)).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Brass-pinned paper joints and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CUT-OUT", held for about 1 s.

BUILD RULES
- Suggested tools: Rostrum camera & multiplane glass, Toon Boom Harmony / Moho cut-out rigs, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (paper texture, puppets and plates are all generated in code).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cut-out motion-graphics film (Jointed Paper Under the Camera). Visual style: matte construction paper with fibre and slightly ragged scissor-cut edges, soft shadows between pieces and between glass plates, brass split pins at the joints, a dusk palette of slate blue, pine green and earth with a red coat, mustard cap and teal scarf, and tracing-paper fog drifting between the layers. Motion: every move is a piece pushed a few millimetres and shot again: limbs swing on their pins instead of bending, the walk is a crude pendulum cycle on twos, the head tilts as a rigid disc and expressions change by swapping in a replacement face; the planes slide past at their own speeds, and each piece settles a hair off where it lay the frame before. Signature moves: brass-pinned paper joints, multiplane glass, tracing-paper fog, stepped on twos (12 fps); transitions: empty sky → plates slid in one by one → puppet assembled and pinned → walk on twos with a multiplane truck → owl flaps in → replacement face → title tiles set down letter by letter. In the tradition of Monty Python’s Flying Circus animations (Terry Gilliam, BBC, 1969–74) · Fantastic Planet (René Laloux & Roland Topor, 1973) · Hedgehog in the Fog (Yuri Norstein, Soyuzmultfilm, 1975) · Tale of Tales (Yuri Norstein, 1979) · South Park, first episode (Trey Parker & Matt Stone, Comedy Central, 1997). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CUT-OUT". Punchy sound design synced to every cut.
```
