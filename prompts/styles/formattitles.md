# Title Sequence

*Opening credits in order, held to be read · 1950s — · Narrative Formats*

Reference film: `videos/formattitles.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Title Sequence** (Opening credits in order, held to be read, 1950s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Early sound films opened on static title cards. In the mid-1950s Saul Bass turned the opening credits into a designed sequence, starting with Carmen Jones (1954) and The Man with the Golden Arm (1955), and the title sequence became its own craft — Maurice Binder’s Bond openings from Dr. No (1962), Pablo Ferro, and later Kyle Cooper’s Se7en (1995). The order of the credits themselves is set largely by guild agreements and contracts: distributor and production company first, the possessory credit, the stars, the main title, the key crew, and the director last.
- Study these reference works: The Man with the Golden Arm (Saul Bass, 1955) · Dr. No (Maurice Binder, 1962) · Se7en (Kyle Cooper, 1995)
- Motion DNA: Four credit cards on the bar lines at 120 BPM — distributor, possessory credit, lead cast, music — each fading in, holding about two seconds and fading out while the graphic action keeps evolving underneath; a half-second black beat; then the main title lands on the downbeat at 8 s and holds to the end.
- Visual DNA: A 2.39 : 1 scope frame on near-black: one orange line, the Token rolling along it, growing into the star and splitting into a bar graph of Tokens; credits in wide-tracked cream Archivo, a small line over a big name; MOTION as the main title over an orange rule. Mono hold bars and the credit order in the bars.
- Signature transitions: Credits cross-fade over continuous graphic action; a black beat before the main title
- Key techniques: Credit order: distributor → possessory → cast → crew → title, Hold each card long enough to read (≈ 2–3 s), Credits placed in open space around the action

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Credit order: distributor → possessory → cast → crew → title, Hold each card long enough to read (≈ 2–3 s), Credits placed in open space around the action).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Credit order: distributor → possessory → cast → crew → title and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TITLE SEQUENCE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects / Nuke title design with an edit-locked credit list, Credits timed to the score’s bar lines, Canvas 2D: credit table with hold windows over a procedural action layer. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Title Sequence motion-graphics film (Opening credits in order, held to be read). Visual style: a 2.39 : 1 scope frame on near-black: one orange line, the Token rolling along it, growing into the star and splitting into a bar graph of Tokens; credits in wide-tracked cream Archivo, a small line over a big name; MOTION as the main title over an orange rule. Mono hold bars and the credit order in the bars. Motion: four credit cards on the bar lines at 120 BPM — distributor, possessory credit, lead cast, music — each fading in, holding about two seconds and fading out while the graphic action keeps evolving underneath; a half-second black beat; then the main title lands on the downbeat at 8 s and holds to the end. Signature moves: credit order: distributor → possessory → cast → crew → title, hold each card long enough to read (≈ 2–3 s), credits placed in open space around the action; transitions: credits cross-fade over continuous graphic action; a black beat before the main title. In the tradition of The Man with the Golden Arm (Saul Bass, 1955) · Dr. No (Maurice Binder, 1962) · Se7en (Kyle Cooper, 1995). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TITLE SEQUENCE". Punchy sound design synced to every cut.
```
