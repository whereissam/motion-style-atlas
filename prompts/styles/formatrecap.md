# "Previously On" Recap

*Only what pays off tonight · 1960s — · Narrative Formats*

Reference film: `videos/formatrecap.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **"Previously On" Recap** (Only what pays off tonight, 1960s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Serial storytelling has always had to remind its audience: film serials of the 1910s–40s and radio serials opened with a spoken summary of the last chapter. On television, the “previously on” montage of cut-down scenes became a standard cold-open device as serialised drama spread in the 1980s and 1990s, with Hill Street Blues among the early series to lean on it. The craft rule editors repeat is that a recap is chosen backwards from tonight’s episode: each clip sets up something this episode pays off.
- Study these reference works: Hill Street Blues (NBC, 1981–87) · 24 (Fox, 2001–10; “Previously on 24…”) · Battlestar Galactica (Sci Fi, 2004–09)
- Motion DNA: A 1.2 s black title card; four clips of about one second each, every cut on a hit, the last one ending on a freeze-frame cliffhanger; one second of black while tonight’s sound already plays; then tonight runs at a calmer pace and settles four payoffs one after another (6.5, 6.9, 7.3, 7.9 s) before the main title lands at 8.6 s.
- Visual DNA: Recap clips are the Token stage drained of colour: desaturated, darkened, grained and scan-lined, each tagged S1 · En in the corner. Tonight is the same stage in full colour. Black cards in condensed white type; an episode rail shows which episodes were left out; payoff callouts link each recapped clip to the moment it pays off.
- Signature transitions: Hard cuts on hits; white flash on the freeze frame; cut to black under a J-cut sound bridge; picture fades up into tonight; darken under the main title
- Key techniques: Recap clips chosen by tonight’s payoffs, Episode tag on every clip, J-cut sound bridge into the episode

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Recap clips chosen by tonight’s payoffs, Episode tag on every clip, J-cut sound bridge into the episode).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Recap clips chosen by tonight’s payoffs and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title ""PREVIOUSLY ON" RECAP", held for about 1 s.

BUILD RULES
- Suggested tools: Avid / Premiere recap assembled from earlier episodes’ masters, Grade pass to set past clips apart; J-cut in the audio timeline, Canvas 2D: one stage drawn per clip, saturation/multiply composite, grain and scanlines. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second "Previously On" Recap motion-graphics film (Only what pays off tonight). Visual style: recap clips are the Token stage drained of colour: desaturated, darkened, grained and scan-lined, each tagged S1 · En in the corner. Tonight is the same stage in full colour. Black cards in condensed white type; an episode rail shows which episodes were left out; payoff callouts link each recapped clip to the moment it pays off. Motion: a 1.2 s black title card; four clips of about one second each, every cut on a hit, the last one ending on a freeze-frame cliffhanger; one second of black while tonight’s sound already plays; then tonight runs at a calmer pace and settles four payoffs one after another (6.5, 6.9, 7.3, 7.9 s) before the main title lands at 8.6 s. Signature moves: recap clips chosen by tonight’s payoffs, episode tag on every clip, j-cut sound bridge into the episode; transitions: hard cuts on hits; white flash on the freeze frame; cut to black under a J-cut sound bridge; picture fades up into tonight; darken under the main title. In the tradition of Hill Street Blues (NBC, 1981–87) · 24 (Fox, 2001–10; “Previously on 24…”) · Battlestar Galactica (Sci Fi, 2004–09). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading ""PREVIOUSLY ON" RECAP". Punchy sound design synced to every cut.
```
