# Top-5 Listicle

*Countdown from five, tease the top, hold #1 · 1970 — · Narrative Formats*

Reference film: `videos/formatlisticle.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Top-5 Listicle** (Countdown from five, tease the top, hold #1, 1970 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The countdown is a radio format first: Casey Kasem’s American Top 40 (from July 1970) played the week’s chart from the bottom up so that number one closed the show, with a tease before every break. Late Night with David Letterman’s Top Ten List (from 1985) turned it into a comedy bit, Channel 4’s 100 Greatest… specials (from 1999) into a television genre, and the web listicle — BuzzFeed in the late 2000s, WatchMojo’s top-ten videos on YouTube — set the conventions as video: tease number one at the start, count in reverse so the order itself builds, give each entry a little more time as it climbs, and hold the last.
- Study these reference works: American Top 40 (Casey Kasem, 1970 —) · Late Night with David Letterman, Top Ten List (1985 —) · WatchMojo top-ten videos (YouTube)
- Motion DNA: A one-second tease with the title already up and the hook typed in; then whip-ins on the eighth notes: #5 for 1.0 s, #4 for 1.25, #3 for 1.5, #2 for 1.75 — the rank numeral rolls up and each card slides in and out; a covered card shakes under a half-second drumroll; at 7 s the cover flies off, confetti bursts and #1 spins in and is held for three seconds.
- Visual DNA: The Technique Atlas paper stage: a huge ink rank numeral with an orange hash on the left, a cream card with a Token variant (outline, blue, squashing, a stack, the original) and its title, line and an on-screen-time bar measured against 3 s; progress dots top right, a reminder chip below; for #1 an orange border, turning rays and confetti.
- Signature transitions: Card whip-ins and whip-outs on the beat, a rolling numeral, the drumroll cover pulled off to reveal #1
- Key techniques: Reverse order: count down from #5 to #1, Tease the top at the start, keep the loop open, Entries lengthen as they climb; #1 held longest

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Reverse order: count down from #5 to #1, Tease the top at the start, keep the loop open, Entries lengthen as they climb; #1 held longest).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Reverse order: count down from #5 to #1 and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TOP-5 LISTICLE", held for about 1 s.

BUILD RULES
- Suggested tools: Template edit: one card layout re-used per entry, durations set per rank, Teaser and reminder chip carry the open loop to #1, Canvas 2D: entry table drives card, numeral, dots and the duration bars. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Top-5 Listicle motion-graphics film (Countdown from five, tease the top, hold #1). Visual style: the Technique Atlas paper stage: a huge ink rank numeral with an orange hash on the left, a cream card with a Token variant (outline, blue, squashing, a stack, the original) and its title, line and an on-screen-time bar measured against 3 s; progress dots top right, a reminder chip below; for #1 an orange border, turning rays and confetti. Motion: a one-second tease with the title already up and the hook typed in; then whip-ins on the eighth notes: #5 for 1.0 s, #4 for 1.25, #3 for 1.5, #2 for 1.75 — the rank numeral rolls up and each card slides in and out; a covered card shakes under a half-second drumroll; at 7 s the cover flies off, confetti bursts and #1 spins in and is held for three seconds. Signature moves: reverse order: count down from #5 to #1, tease the top at the start, keep the loop open, entries lengthen as they climb; #1 held longest; transitions: card whip-ins and whip-outs on the beat, a rolling numeral, the drumroll cover pulled off to reveal #1. In the tradition of American Top 40 (Casey Kasem, 1970 —) · Late Night with David Letterman, Top Ten List (1985 —) · WatchMojo top-ten videos (YouTube). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TOP-5 LISTICLE". Punchy sound design synced to every cut.
```
