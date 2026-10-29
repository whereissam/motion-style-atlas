# Broadcast Graphics

*News opens, straps and crawls · 1970s — · Social & Commercial*

Reference film: `videos/broadcast.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Broadcast Graphics** (News opens, straps and crawls, 1970s —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Broadcast graphics are the house style of television news: a branded open, then lower thirds, bugs, crawls and full-screen maps laid over live pictures, each built to be read in a second. Electronic character generators such as the Chyron and Quantel’s Paintbox (1981) put them on air, 24-hour news made them permanent, the continuous crawl became standard on US cable news after 11 September 2001, and election nights turned virtual studios and touchscreen maps into spectacle.
- Study these reference works: Chyron character generator (Chyron Corp., 1970s) · Quantel Paintbox (1981) · CNN Headline News (launched as CNN2, 1982) · Cable-news crawls after 11 September 2001 · CNN “Magic Wall” election map (2008)
- Motion DNA: Urgent but orderly: a globe rushes in and decelerates under orbiting rings, a wordmark slams with overshoot and a glint, branded diagonal wipes carry us between open and studio, straps wipe out of a coloured tab in quick ease-outs and stack in a fixed order, the crawl never stops, and the camera pushes into the video wall until the graphic is the picture; numbers count, bars race, a verdict box pops and locks.
- Visual DNA: Deep navy and royal blue with cyan highlights, a single alarm red for LIVE and BREAKING, white bars with heavy condensed caps, glossy desk and floor reflections, LED columns, a dot-matrix globe with graticule, and an election map in two party colours with seat counts, a majority line and a decision-desk box.
- Signature transitions: Diagonal branded wipes, logo slam with glint, strap wipe-ons from a tab, banner expanding from centre, push into the video wall, wipe to the end board
- Key techniques: Dot-matrix spinning globe open, Name strap, BREAKING banner, crawl, Live election map and tally

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Dot-matrix spinning globe open, Name strap, BREAKING banner, crawl, Live election map and tally).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Dot-matrix spinning globe open and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "BROADCAST GRAPHICS", held for about 1 s.

BUILD RULES
- Suggested tools: Chyron / Vizrt / ChyronHego real-time engines, After Effects + Cinema 4D packages, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (channel, people, places and results are fictional).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Broadcast Graphics motion-graphics film (News opens, straps and crawls). Visual style: deep navy and royal blue with cyan highlights, a single alarm red for LIVE and BREAKING, white bars with heavy condensed caps, glossy desk and floor reflections, LED columns, a dot-matrix globe with graticule, and an election map in two party colours with seat counts, a majority line and a decision-desk box. Motion: urgent but orderly: a globe rushes in and decelerates under orbiting rings, a wordmark slams with overshoot and a glint, branded diagonal wipes carry us between open and studio, straps wipe out of a coloured tab in quick ease-outs and stack in a fixed order, the crawl never stops, and the camera pushes into the video wall until the graphic is the picture; numbers count, bars race, a verdict box pops and locks. Signature moves: dot-matrix spinning globe open, name strap, breaking banner, crawl, live election map and tally; transitions: diagonal branded wipes, logo slam with glint, strap wipe-ons from a tab, banner expanding from centre, push into the video wall, wipe to the end board. In the tradition of Chyron character generator (Chyron Corp., 1970s) · Quantel Paintbox (1981) · CNN Headline News (launched as CNN2, 1982) · Cable-news crawls after 11 September 2001 · CNN “Magic Wall” election map (2008). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "BROADCAST GRAPHICS". Punchy sound design synced to every cut.
```
