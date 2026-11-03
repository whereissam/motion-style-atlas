# "Next Week On" Promo

*Fragments, questions, no answers · 1960s — · Narrative Formats*

Reference film: `videos/formatnextweek.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **"Next Week On" Promo** (Fragments, questions, no answers, 1960s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Episodic television has always sold the next episode at the end of this one. US network series closed on scenes from next week’s episode for decades, and serialised drama sharpened the form into a montage of very short fragments cut out of order, questions supered or voiced over them, a cut to black before anything lands, and the airdate and time slot — “9/8c”, nine Eastern, eight Central. Anime made it a ritual: the narrated next-episode previews of Dragon Ball Z (1989–96) and Neon Genesis Evangelion (1995–96), whose previews often misled on purpose; Lost (ABC, 2004–10) leaned on its promos to keep its mysteries open.
- Study these reference works: Dragon Ball Z (1989–96; “Next time on…”) · Neon Genesis Evangelion (1995–96; next-episode previews) · Lost (ABC, 2004–10)
- Motion DNA: A 0.9 s orange slate; ten fragments from 0.3 to 0.85 s, every cut on a hit with a white frame; four questions supered over them; the last shot runs longest — a run-up and a leap — and cuts to black at the top of the arc at 7.3 s with the sound; half a second of black; the airdate card lands at 7.8 s with a three-note network sting.
- Visual DNA: Next week in full colour, unlike the recap’s drained past: the paper stage lit blue, red, amber; a second Token in ink-blue; a box with a question mark whose contents we never see. Bold cream questions on black bands. HUD panels: each fragment’s length against a one-second bar, a questions-raised / answered tally, a scene map plotting the fragments out of order. Airdate card in ink and orange on paper.
- Signature transitions: Hard cuts with one white frame; a cut to black mid-action; a chevron wipe onto the airdate card
- Key techniques: Fragments under a second, cut out of story order, Questions raised, never answered, Cut to black mid-action, then airdate + time slot

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Fragments under a second, cut out of story order, Questions raised, never answered, Cut to black mid-action, then airdate + time slot).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Fragments under a second, cut out of story order and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title ""NEXT WEEK ON" PROMO", held for about 1 s.

BUILD RULES
- Suggested tools: Editorial: a promo cut from next week’s dailies or locked cut, Questions as supers or VO; the airdate from the network’s promo package, Canvas 2D: a fragment list with scene numbers; HUD computed from the list. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second "Next Week On" Promo motion-graphics film (Fragments, questions, no answers). Visual style: next week in full colour, unlike the recap’s drained past: the paper stage lit blue, red, amber; a second Token in ink-blue; a box with a question mark whose contents we never see. Bold cream questions on black bands. HUD panels: each fragment’s length against a one-second bar, a questions-raised / answered tally, a scene map plotting the fragments out of order. Airdate card in ink and orange on paper. Motion: a 0.9 s orange slate; ten fragments from 0.3 to 0.85 s, every cut on a hit with a white frame; four questions supered over them; the last shot runs longest — a run-up and a leap — and cuts to black at the top of the arc at 7.3 s with the sound; half a second of black; the airdate card lands at 7.8 s with a three-note network sting. Signature moves: fragments under a second, cut out of story order, questions raised, never answered, cut to black mid-action, then airdate + time slot; transitions: hard cuts with one white frame; a cut to black mid-action; a chevron wipe onto the airdate card. In the tradition of Dragon Ball Z (1989–96; “Next time on…”) · Neon Genesis Evangelion (1995–96; next-episode previews) · Lost (ABC, 2004–10). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading ""NEXT WEEK ON" PROMO". Punchy sound design synced to every cut.
```
