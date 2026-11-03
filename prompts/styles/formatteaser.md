# Teaser

*Reveal nothing: glimpses, a date, coming soon · 1970s — · Narrative Formats*

Reference film: `videos/formatteaser.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Teaser** (Reveal nothing: glimpses, a date, coming soon, 1970s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The teaser trailer — a short spot released months before a film, built from almost nothing — took its modern form in the 1970s; the teaser for Ridley Scott’s Alien (1979), an egg cracking over “In space no one can hear you scream”, is still the model. Advertising adopted the same withholding for product launches: Apple’s “1984”, aired during Super Bowl XVIII, announced the Macintosh without ever showing it, and car makers tease new models as cropped details and silhouettes under cloth. The rules are constant: glimpses, not views; a date; coming soon.
- Study these reference works: Alien teaser trailer (20th Century Fox, 1979) · “1984”, Apple Macintosh (Ridley Scott for Chiat\Day, 1984) · Cloverfield teaser (Paramount, 2007; released without a title)
- Motion DNA: Black and sound for 1.2 s, then three glimpses of about 1.8 s, each faded up out of black and cut hard back to it; a 1.2 s date card that flickers on; a 1.6 s COMING SOON end card. Moves are slow pushes and drifts — the light moves more than the product.
- Visual DNA: Near-black frames; the Token only as a dark mass picked out by orange rim light: a macro corner, a silhouette in backlit haze, light through the hole. Wide-tracked Archivo for the date and the end card. A small area readout of product visible over time against a dashed 100 % launch line.
- Signature transitions: Fades up from black and hard cuts to black between every glimpse; the date and end card flicker on like a failing lamp
- Key techniques: Reveal nothing, Glimpses cut to black, Date + COMING SOON

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Reveal nothing, Glimpses cut to black, Date + COMING SOON).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Reveal nothing and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TEASER", held for about 1 s.

BUILD RULES
- Suggested tools: Shoot or render details, not views: macro crops, backlight, silhouette, negative fill, Edit to sound: hits on the cuts, a drone and a heartbeat under the black, Canvas 2D: the Token path filled near-black and stroked with a moving radial-gradient rim light. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Teaser motion-graphics film (Reveal nothing: glimpses, a date, coming soon). Visual style: near-black frames; the Token only as a dark mass picked out by orange rim light: a macro corner, a silhouette in backlit haze, light through the hole. Wide-tracked Archivo for the date and the end card. A small area readout of product visible over time against a dashed 100 % launch line. Motion: black and sound for 1.2 s, then three glimpses of about 1.8 s, each faded up out of black and cut hard back to it; a 1.2 s date card that flickers on; a 1.6 s COMING SOON end card. Moves are slow pushes and drifts — the light moves more than the product. Signature moves: reveal nothing, glimpses cut to black, date + coming soon; transitions: fades up from black and hard cuts to black between every glimpse; the date and end card flicker on like a failing lamp. In the tradition of Alien teaser trailer (20th Century Fox, 1979) · “1984”, Apple Macintosh (Ridley Scott for Chiat\Day, 1984) · Cloverfield teaser (Paramount, 2007; released without a title). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TEASER". Punchy sound design synced to every cut.
```
