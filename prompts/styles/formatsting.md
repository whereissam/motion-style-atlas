# Post-credits Sting

*Wait, then tease the sequel · 1979 — · Narrative Formats*

Reference film: `videos/formatsting.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Post-credits Sting** (Wait, then tease the sequel, 1979 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A scene after the end credits began as a joke for whoever stayed: The Muppet Movie (1979) ends with Animal shouting “Go home!”, Airplane! (1980) returns to the passenger abandoned in the taxi, and Ferris Bueller’s Day Off (1986) sends its audience home in person. Iron Man (2008) turned it into marketing: Nick Fury after the crawl, announcing a shared universe, and Marvel Studios made the mid-credits scene (cut into the crawl) and the post-credits scene (after its last line) routine — The Avengers (2012) has both. The promise card is older: the Bond films have closed since the 1960s on “James Bond will return”.
- Study these reference works: The Muppet Movie (1979) · Iron Man (2008; Nick Fury) · The Avengers (2012; mid- and post-credits)
- Motion DNA: The crawl at a constant 260 px/s until the legal line stops and holds; a hard cut to black at 2.2 s; 2.8 s of silence in which the house empties seat by seat; at 5.0 s a low rumble and three cracks of light on accelerating hits, a slow push-in while something rises; the reveal hit at 7.4 s, a single held silhouette, a hard cut at 8.2 s; the promise card fades up in two lines.
- Visual DNA: Black throughout. Cream credits in Archivo with a mono legal line; a diagram of the house as rows of seats, the stayers lit orange; a dark floor with a glowing orange crack, dust in the beam, a second Token mirrored in ink-black with a glowing hole and an orange rim; THE TOKEN / WILL RETURN in wide-tracked cream and orange. A mid- vs post-credits map top right.
- Signature transitions: Hard cut from the held legal line to black; hard cut out of the reveal; the promise card fades up
- Key techniques: Post-credits: only after the last line of the crawl, A held beat of black and silence first, The tease withholds: one image, no answer, a promise card

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Post-credits: only after the last line of the crawl, A held beat of black and silence first, The tease withholds: one image, no answer, a promise card).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Post-credits: only after the last line of the crawl and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "POST-CREDITS STING", held for about 1 s.

BUILD RULES
- Suggested tools: Editorial: the scene appended after the crawl, after a black hold, Sound: true silence for the wait, a hard sound cut with the picture, Canvas 2D: crawl table, seat diagram with seeded leave times, clipped silhouette over a procedural light crack. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Post-credits Sting motion-graphics film (Wait, then tease the sequel). Visual style: black throughout. Cream credits in Archivo with a mono legal line; a diagram of the house as rows of seats, the stayers lit orange; a dark floor with a glowing orange crack, dust in the beam, a second Token mirrored in ink-black with a glowing hole and an orange rim; THE TOKEN / WILL RETURN in wide-tracked cream and orange. A mid- vs post-credits map top right. Motion: the crawl at a constant 260 px/s until the legal line stops and holds; a hard cut to black at 2.2 s; 2.8 s of silence in which the house empties seat by seat; at 5.0 s a low rumble and three cracks of light on accelerating hits, a slow push-in while something rises; the reveal hit at 7.4 s, a single held silhouette, a hard cut at 8.2 s; the promise card fades up in two lines. Signature moves: post-credits: only after the last line of the crawl, a held beat of black and silence first, the tease withholds: one image, no answer, a promise card; transitions: hard cut from the held legal line to black; hard cut out of the reveal; the promise card fades up. In the tradition of The Muppet Movie (1979) · Iron Man (2008; Nick Fury) · The Avengers (2012; mid- and post-credits). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "POST-CREDITS STING". Punchy sound design synced to every cut.
```
