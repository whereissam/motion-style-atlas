# Data Storytelling

*Animated Data Journalism · 2006 — · Social & Commercial*

Reference film: `videos/datastory.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Data Storytelling** (Animated Data Journalism, 2006 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Hans Rosling’s animated Gapminder bubbles (TED 2006; BBC “200 Countries, 200 Years, 4 Minutes”, 2010) showed that a moving chart could carry a story. Newsrooms such as The New York Times graphics desk, The Guardian and The Pudding built scroll-driven, annotated charts that reveal data step by step, while bar-chart races spread across social video.
- Study these reference works: Hans Rosling, “The best stats you’ve ever seen” (TED, 2006) · BBC “The Joy of Stats”: 200 Countries, 200 Years, 4 Minutes (2010) · The New York Times “How the Virus Got Out” (2020) · The Pudding “The Largest Vocabulary in Hip Hop” (2017) · John Burn-Murdoch’s FT Covid trajectory charts (2020)
- Motion DNA: Motion serves the reading order: axes first, then data draws through time with a live cursor, notes pop in when the line reaches them, and each chart holds still long enough to be read before the next one.
- Visual DNA: Warm newsprint white, black serif headlines, a single editorial red for the story line, muted categorical colours, hairline gridlines, precise labels and an "Illustrative data" source line.
- Signature transitions: Header swaps with slide-up fades, axes growing from the origin, bars and bubbles popping in, number count-up.
- Key techniques: Every mark drawn to scale from the data functions: zero baselines, log-x where labelled, Annotations triggered as the line cursor passes each event, Soft-rank interpolation for a continuous bar-chart race, Gapminder bubbles: log income × lifespan, area ∝ population, year watermark

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Every mark drawn to scale from the data functions: zero baselines, log-x where labelled, Annotations triggered as the line cursor passes each event, Soft-rank interpolation for a continuous bar-chart race, Gapminder bubbles: log income × lifespan, area ∝ population, year watermark).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Every mark drawn to scale from the data functions: zero baselines, log-x where labelled and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DATA STORYTELLING", held for about 1 s.

BUILD RULES
- Suggested tools: D3.js, Flourish, Datawrapper, Scrollama / scrollytelling. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Data Storytelling motion-graphics film (Animated Data Journalism). Visual style: warm newsprint white, black serif headlines, a single editorial red for the story line, muted categorical colours, hairline gridlines, precise labels and an "Illustrative data" source line. Motion: motion serves the reading order: axes first, then data draws through time with a live cursor, notes pop in when the line reaches them, and each chart holds still long enough to be read before the next one. Signature moves: every mark drawn to scale from the data functions: zero baselines, log-x where labelled, annotations triggered as the line cursor passes each event, soft-rank interpolation for a continuous bar-chart race, gapminder bubbles: log income × lifespan, area ∝ population, year watermark; transitions: header swaps with slide-up fades, axes growing from the origin, bars and bubbles popping in, number count-up. In the tradition of Hans Rosling, “The best stats you’ve ever seen” (TED, 2006) · BBC “The Joy of Stats”: 200 Countries, 200 Years, 4 Minutes (2010) · The New York Times “How the Virus Got Out” (2020) · The Pudding “The Largest Vocabulary in Hip Hop” (2017) · John Burn-Murdoch’s FT Covid trajectory charts (2020). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DATA STORYTELLING". Punchy sound design synced to every cut.
```
