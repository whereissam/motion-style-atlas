# Limited Animation

*Held Cels, Moving Mouths · 1950 — · 2D Animation & Illustration*

Reference film: `videos/limited.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Limited Animation** (Held Cels, Moving Mouths, 1950 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: UPA (United Productions of America) broke with Disney’s full animation in Gerald McBoing-Boing (1950, Oscar 1951): flat modernist backgrounds, colour laid off-register from the line, stylised characters and only the drawings a gag needed. Hanna-Barbera turned that economy into a television system from The Ruff and Reddy Show (1957) onward — held bodies with separate mouth cels, swapped heads, walk cycles over repeating pans, timing on twos and threes.
- Study these reference works: Gerald McBoing-Boing (UPA, Robert Cannon, 1950) · Rooty Toot Toot (UPA, John Hubley, 1951) · The Ruff and Reddy Show (Hanna-Barbera, 1957) · The Huckleberry Hound Show (Hanna-Barbera, 1958) · The Flintstones (Hanna-Barbera, 1960)
- Motion DNA: Eight drawings a second, many of them held: a body freezes while only a mouth cel changes, a head is swapped for another view in one frame, a walk cycle repeats over a background that steps past and visibly repeats, and a zip-out replaces motion with a puff and speed lines.
- Visual DNA: Flat mid-century colour fields in mustard, teal and coral printed slightly off-register from thin black line, geometric characters with triangle noses and pork-pie hats, asterisk stars and lollipop trees, and gouache dry-brush on the backgrounds.
- Signature transitions: Hard cut, held pose, head swap, zip-out with dust puff, pop-on title card
- Key techniques: Held cels with separate mouth drawings, Swap heads, no in-betweens, Walk cycle over a repeating pan, Timing on threes (8 drawings/s)

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Held cels with separate mouth drawings, Swap heads, no in-betweens, Walk cycle over a repeating pan, Timing on threes (8 drawings/s)).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Held cels with separate mouth drawings and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LIMITED ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Cel animation (exposure sheet on threes), Toon Boom Harmony (cut-out rigs), Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Limited Animation motion-graphics film (Held Cels, Moving Mouths). Visual style: flat mid-century colour fields in mustard, teal and coral printed slightly off-register from thin black line, geometric characters with triangle noses and pork-pie hats, asterisk stars and lollipop trees, and gouache dry-brush on the backgrounds. Motion: eight drawings a second, many of them held: a body freezes while only a mouth cel changes, a head is swapped for another view in one frame, a walk cycle repeats over a background that steps past and visibly repeats, and a zip-out replaces motion with a puff and speed lines. Signature moves: held cels with separate mouth drawings, swap heads, no in-betweens, walk cycle over a repeating pan, timing on threes (8 drawings/s); transitions: hard cut, held pose, head swap, zip-out with dust puff, pop-on title card. In the tradition of Gerald McBoing-Boing (UPA, Robert Cannon, 1950) · Rooty Toot Toot (UPA, John Hubley, 1951) · The Ruff and Reddy Show (Hanna-Barbera, 1957) · The Huckleberry Hound Show (Hanna-Barbera, 1958) · The Flintstones (Hanna-Barbera, 1960). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LIMITED ANIMATION". Punchy sound design synced to every cut.
```
