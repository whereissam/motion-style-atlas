# SaaS Product Motion

*B2B launch film · 2010s — · Social & Commercial*

Reference film: `videos/saas.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **SaaS Product Motion** (B2B launch film, 2010s —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Software companies now launch features the way carmakers launch cars: with a short film in which the product interface itself is the hero. Through the late 2010s and 2020s teams such as Stripe, Linear and Vercel set the look — a dark stage lit by a drifting gradient mesh, app windows tilted in three-quarter perspective, a cursor demonstrating one feature, numbers counting up, and every move on a spring.
- Study these reference works: Stripe homepage animated gradient (2020) · Linear product launch and changelog films · Vercel Ship launch keynotes (2023 —) · Figma Config keynote product demos (2020 —)
- Motion DNA: Every arrival is a damped spring with a touch of overshoot; words rise in a 150 ms stagger and sharpen from blur, the window swings from three-quarter view to flat for the demo and back, satellite cards drift at their own depth for parallax, and numbers count up on an ease-out so they land, not stop.
- Visual DNA: Near-black stage under a slow violet–blue–pink gradient mesh, a faint grid, glassy dark cards with 1 px borders and a lit top edge, one violet accent, Geist type with tight tracking, crisp product UI (sidebar, issue rows, command menu, toast) and a cursor as the protagonist.
- Signature transitions: Spring-in headline, window rising in perspective, swing to flat and push in, command-menu scale-in, rows re-sorting on a spring, recede and fly-in of stat cards, fly-out to the logo lock-up
- Key techniques: 3/4 perspective UI cards, Cursor-driven feature demo, Springs and counters

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (3/4 perspective UI cards, Cursor-driven feature demo, Springs and counters).
- 5.0–8.0 s  Climax: the most spectacular moment, built on 3/4 perspective UI cards and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SAAS PRODUCT MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Figma → After Effects or Rive, React + Framer Motion / CSS springs, Canvas 2D (3D planes as affine cells). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (fictional product, no real logos).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second SaaS Product Motion motion-graphics film (B2B launch film). Visual style: near-black stage under a slow violet–blue–pink gradient mesh, a faint grid, glassy dark cards with 1 px borders and a lit top edge, one violet accent, Geist type with tight tracking, crisp product UI (sidebar, issue rows, command menu, toast) and a cursor as the protagonist. Motion: every arrival is a damped spring with a touch of overshoot; words rise in a 150 ms stagger and sharpen from blur, the window swings from three-quarter view to flat for the demo and back, satellite cards drift at their own depth for parallax, and numbers count up on an ease-out so they land, not stop. Signature moves: 3/4 perspective ui cards, cursor-driven feature demo, springs and counters; transitions: spring-in headline, window rising in perspective, swing to flat and push in, command-menu scale-in, rows re-sorting on a spring, recede and fly-in of stat cards, fly-out to the logo lock-up. In the tradition of Stripe homepage animated gradient (2020) · Linear product launch and changelog films · Vercel Ship launch keynotes (2023 —) · Figma Config keynote product demos (2020 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SAAS PRODUCT MOTION". Punchy sound design synced to every cut.
```
