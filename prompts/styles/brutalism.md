# Neo-Brutalism

*Deliberately Unstyled · 2014 — · Graphic Design & Historical*

Reference film: `videos/brutalism.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Neo-Brutalism** (Deliberately Unstyled, 2014 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Named after Brutalist architecture’s béton brut, web brutalism began as a reaction to polished template sites: Pascal Deville’s brutalistwebsites.com (2014) collected pages that exposed raw HTML, default fonts and visible structure. Around 2020–21 product design softened it into neo-brutalism — thick black borders, hard offset shadows, flat loud colours and chunky grotesk type — popularised by Gumroad’s redesign and a wave of SaaS and portfolio UIs.
- Study these reference works: brutalistwebsites.com (Pascal Deville, 2014) · Craigslist (1995 —) and the Drudge Report as raw ancestors · Balenciaga.com redesign (2017) · Bloomberg Businessweek covers (Richard Turley, 2010–14) · Gumroad redesign (2021)
- Motion DNA: No easing and no apology: elements slam in at constant speed and stop dead with a one-frame jolt, buttons sink exactly into their shadows, layouts jump between grid states on the beat and windows pile up instead of fading.
- Visual DNA: Thick black borders, solid black offset shadows, flat loud fills (yellow, pink, lime, lilac), default or grotesk/monospace type at huge sizes, visible grid and HTML tags, zero gradients, zero blur.
- Signature transitions: Stylesheet-load hard cut, linear slam, press-in, grid reflow jump, window cascade, hard cut to title
- Key techniques: Hard-shadow boxes with press-in states, Exposed 12-column grid overlay, Linear, un-eased slams and jump cuts, Marquee tickers and stacked alert windows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hard-shadow boxes with press-in states, Exposed 12-column grid overlay, Linear, un-eased slams and jump cuts, Marquee tickers and stacked alert windows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hard-shadow boxes with press-in states and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "NEO-BRUTALISM", held for about 1 s.

BUILD RULES
- Suggested tools: HTML / CSS (border + box-shadow), Figma, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Neo-Brutalism motion-graphics film (Deliberately Unstyled). Visual style: thick black borders, solid black offset shadows, flat loud fills (yellow, pink, lime, lilac), default or grotesk/monospace type at huge sizes, visible grid and HTML tags, zero gradients, zero blur. Motion: no easing and no apology: elements slam in at constant speed and stop dead with a one-frame jolt, buttons sink exactly into their shadows, layouts jump between grid states on the beat and windows pile up instead of fading. Signature moves: hard-shadow boxes with press-in states, exposed 12-column grid overlay, linear, un-eased slams and jump cuts, marquee tickers and stacked alert windows; transitions: stylesheet-load hard cut, linear slam, press-in, grid reflow jump, window cascade, hard cut to title. In the tradition of brutalistwebsites.com (Pascal Deville, 2014) · Craigslist (1995 —) and the Drudge Report as raw ancestors · Balenciaga.com redesign (2017) · Bloomberg Businessweek covers (Richard Turley, 2010–14) · Gumroad redesign (2021). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "NEO-BRUTALISM". Punchy sound design synced to every cut.
```
