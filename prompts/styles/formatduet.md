# Duet / Reaction

*Call and response, a few frames late · 2010 — · Narrative Formats*

Reference film: `videos/formatduet.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Duet / Reaction** (Call and response, a few frames late, 2010 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The reaction shot is as old as film editing, and Japanese variety television made a fixed convention of the wipe: a corner inset of the studio guests reacting to a taped segment. Online, reaction videos became their own genre on YouTube around 2010 with the Fine Brothers’ Kids React. Musical.ly’s duet put the original clip and the response side by side in one vertical frame; TikTok carried it over when it absorbed Musical.ly in 2018, added Stitch (clip the original, then answer it) in 2020, and let creators answer a comment with a video that carries the comment as a sticker. The craft is timing — each reaction lands just after the beat it answers, about a human reaction time — and the reactor keeps the last word.
- Study these reference works: Kids React (the Fine Brothers, YouTube, 2010 —) · TikTok Duet (2018 —, from Musical.ly) and Stitch (2020 —) · the wipe inset in Japanese variety television
- Motion DNA: The original keeps the clock: a letter block drops onto the tower on every bar line at 0.5, 1.5 … 5.5 s, the tower wobbling more after each, then a gust and the fall at 7.0 s. The reactor answers every beat 0.2 s (six frames) late — a nod, a nod, a lean in, a gasp, a flinch, a spinning cheer, a cringe — then a deadpan beat, and finally moves on its own: a jump that taps the reply sticker at its apex, CALLED IT., a squash landing and a rimshot.
- Visual DNA: One 9:8 frame made of two 9:16 halves with a white seam: the paper-and-grid Technique Atlas stage with cream letter blocks (the N in orange) on the left; a dark navy reaction set with a ring light and the orange Token on the right; a white reply sticker with a blue avatar dot; bold orange reaction marks. Beside it, ORIGINAL and REACTION lanes with lag connectors, a ten-frame lag ruler and a floor indicator.
- Signature transitions: None inside the split — the two halves run continuously; reactions spring on; the tower collapse and the punchline jump are the only big moves
- Key techniques: Split frame: original | reactor, Each reaction lags its beat by ~6 frames, Reply sticker and the punchline with no call

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Split frame: original | reactor, Each reaction lags its beat by ~6 frames, Reply sticker and the punchline with no call).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Split frame: original | reactor and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DUET / REACTION", held for about 1 s.

BUILD RULES
- Suggested tools: In-app duet / stitch: record against the playing original, Reaction timing set by nudging the reactor clip a few frames late, Canvas 2D: two clipped half-frames from one timeline; reactions are the call times plus a fixed lag. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (generic app UI, fictional handles).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Duet / Reaction motion-graphics film (Call and response, a few frames late). Visual style: one 9:8 frame made of two 9:16 halves with a white seam: the paper-and-grid Technique Atlas stage with cream letter blocks (the N in orange) on the left; a dark navy reaction set with a ring light and the orange Token on the right; a white reply sticker with a blue avatar dot; bold orange reaction marks. Beside it, ORIGINAL and REACTION lanes with lag connectors, a ten-frame lag ruler and a floor indicator. Motion: the original keeps the clock: a letter block drops onto the tower on every bar line at 0.5, 1.5 … 5.5 s, the tower wobbling more after each, then a gust and the fall at 7.0 s. The reactor answers every beat 0.2 s (six frames) late — a nod, a nod, a lean in, a gasp, a flinch, a spinning cheer, a cringe — then a deadpan beat, and finally moves on its own: a jump that taps the reply sticker at its apex, CALLED IT., a squash landing and a rimshot. Signature moves: split frame: original | reactor, each reaction lags its beat by ~6 frames, reply sticker and the punchline with no call; transitions: none inside the split — the two halves run continuously; reactions spring on; the tower collapse and the punchline jump are the only big moves. In the tradition of Kids React (the Fine Brothers, YouTube, 2010 —) · TikTok Duet (2018 —, from Musical.ly) and Stitch (2020 —) · the wipe inset in Japanese variety television. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DUET / REACTION". Punchy sound design synced to every cut.
```
