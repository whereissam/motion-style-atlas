# Bounce

*Gravity, restitution, squash on contact · 1930s — · Technique Atlas*

Reference film: `videos/techbounce.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Bounce** (Gravity, restitution, squash on contact, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The bouncing ball is the first exercise in classical animation training: it teaches timing (hops shorten as they lose height), spacing (frames bunch at the top of the arc and spread near the floor) and squash and stretch, which Disney’s animators formalised in the 1930s and Thomas and Johnston listed among the twelve principles in The Illusion of Life (1981). Motion designers later reproduced it with bounce easing curves such as Robert Penner’s easeOutBounce (2001) or with physics: gravity plus a coefficient of restitution.
- Study these reference works: The bouncing-ball exercise in Richard Williams’s The Animator’s Survival Kit (2001) · Fleischer Studios’ Screen Songs “follow the bouncing ball” sing-alongs (1920s–30s) · Pixar’s Luxo Jr. (1986)
- Motion DNA: Constant gravity: the Token accelerates into the floor and decelerates to each apex, so spacing is tight at the top and wide at the bottom. Every contact keeps a fixed fraction of the speed, giving a geometric decay of hop height and duration that ends in a quick patter and rest. Squash grows with impact speed; the body stretches along the fall.
- Visual DNA: The Technique Atlas stage with its floor band, the orange Token and a darker heavy twin, soft contact shadows that tighten as they land, a dotted trail tracing the last second of arcs, dust puffs on hard contacts, mono restitution labels and a height/time plot in the caption.
- Signature transitions: The rubber Token settles, is lifted back to its drop height beside a heavy twin, and both fall on the same beat
- Key techniques: Analytic gravity and restitution, Squash on contact, stretch in flight, Contact shadow and arc trail

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Analytic gravity and restitution, Squash on contact, stretch in flight, Contact shadow and arc trail).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Analytic gravity and restitution and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "BOUNCE", held for about 1 s.

BUILD RULES
- Suggested tools: Closed-form projectile segments with a restitution coefficient per contact, Canvas 2D squash and stretch anchored to the floor, Shared Technique Atlas kit and 120 BPM bed. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Bounce motion-graphics film (Gravity, restitution, squash on contact). Visual style: the Technique Atlas stage with its floor band, the orange Token and a darker heavy twin, soft contact shadows that tighten as they land, a dotted trail tracing the last second of arcs, dust puffs on hard contacts, mono restitution labels and a height/time plot in the caption. Motion: constant gravity: the Token accelerates into the floor and decelerates to each apex, so spacing is tight at the top and wide at the bottom. Every contact keeps a fixed fraction of the speed, giving a geometric decay of hop height and duration that ends in a quick patter and rest. Squash grows with impact speed; the body stretches along the fall. Signature moves: analytic gravity and restitution, squash on contact, stretch in flight, contact shadow and arc trail; transitions: the rubber Token settles, is lifted back to its drop height beside a heavy twin, and both fall on the same beat. In the tradition of The bouncing-ball exercise in Richard Williams’s The Animator’s Survival Kit (2001) · Fleischer Studios’ Screen Songs “follow the bouncing ball” sing-alongs (1920s–30s) · Pixar’s Luxo Jr. (1986). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "BOUNCE". Punchy sound design synced to every cut.
```
