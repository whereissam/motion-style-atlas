# Corporate Memphis

*Big Limbs, Tiny Heads, Flat Optimism · 2017 — · Social & Commercial*

Reference film: `videos/corpmemphis.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Corporate Memphis** (Big Limbs, Tiny Heads, Flat Optimism, 2017 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The flat vector illustration style that took over tech websites, onboarding screens and explainer ads from about 2017: faceless figures with long, bendy limbs, tiny heads and purple or blue skin, collaborating among blobs, squiggles and oversized UI. Buck’s Alegria system for Facebook (2017) set the template; the mocking nickname “Corporate Memphis” came later, nodding to the squiggles of the 1980s Memphis Group, as free kits spread it everywhere and it became shorthand for friendly, interchangeable brand optimism.
- Study these reference works: Alegria illustration system (Buck for Facebook, 2017) · Memphis Group (founded by Ettore Sottsass, Milan, 1981) — the namesake
- Motion DNA: Bouncy and buoyant: every element pops on an overshoot spring, characters walk with a big hip bob and rubber-hose arms that never show an elbow, legs dangle and swing, props grow in eased steps, toggles snap and buttons squish, and the piece ends on a hop of joy and a pull-back to the logo.
- Visual DNA: Flat fills, no outlines, no gradients: cream page, lavender, peach and mint blobs, yellow and pink squiggles, dot grids, a potted monstera; faceless characters with oversized legs and hands, minuscule heads and non-naturalistic skin (violet, blue, terracotta); giant white app cards with rounded corners, toggles, progress bars and a primary-violet call to action.
- Signature transitions: Pop-on blobs → window springs up → characters walk / drop in → card slot snap → toggle flip → button press burst → pull-back to brand lockup
- Key techniques: Two-bone IK noodle limbs, Walk cycles from hip tracks, Spring-eased UI pops

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Two-bone IK noodle limbs, Walk cycles from hip tracks, Spring-eased UI pops).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Two-bone IK noodle limbs and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CORPORATE MEMPHIS", held for about 1 s.

BUILD RULES
- Suggested tools: Illustrator + After Effects (Duik / RubberHose rigs), Lottie / Rive exports for product UI, Figma illustration kits, Canvas 2D: bezier noodle limbs with two-bone IK, keyframed hip / hand tracks, spring easing. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Corporate Memphis motion-graphics film (Big Limbs, Tiny Heads, Flat Optimism). Visual style: flat fills, no outlines, no gradients: cream page, lavender, peach and mint blobs, yellow and pink squiggles, dot grids, a potted monstera; faceless characters with oversized legs and hands, minuscule heads and non-naturalistic skin (violet, blue, terracotta); giant white app cards with rounded corners, toggles, progress bars and a primary-violet call to action. Motion: bouncy and buoyant: every element pops on an overshoot spring, characters walk with a big hip bob and rubber-hose arms that never show an elbow, legs dangle and swing, props grow in eased steps, toggles snap and buttons squish, and the piece ends on a hop of joy and a pull-back to the logo. Signature moves: two-bone ik noodle limbs, walk cycles from hip tracks, spring-eased ui pops; transitions: pop-on blobs → window springs up → characters walk / drop in → card slot snap → toggle flip → button press burst → pull-back to brand lockup. In the tradition of Alegria illustration system (Buck for Facebook, 2017) · Memphis Group (founded by Ettore Sottsass, Milan, 1981) — the namesake. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CORPORATE MEMPHIS". Punchy sound design synced to every cut.
```
