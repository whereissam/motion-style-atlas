# Hyperlapse

*Moving Time-lapse · 2011 — · Cinematic & Film Language*

Reference film: `videos/hyperlapse.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Hyperlapse** (Moving Time-lapse, 2011 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A time-lapse in which the camera itself travels: one still is shot every few steps or metres, each aligned to a fixed point, then stabilised and played at video speed so the camera glides over distances while hours pass. Ron Fricke's motion-controlled driving shots for Koyaanisqatsi (1982) were early ancestors; Geoff Tompkinson, Shahab Gabriel and Rob Whitworth popularised hand-moved city hyperlapses with whip-pan "flow" transitions in the early 2010s, and Instagram's Hyperlapse app and Microsoft Research's Hyperlapse (both 2014) turned it into a phone feature.
- Study these reference works: Koyaanisqatsi (Godfrey Reggio, cinematography Ron Fricke, 1982) · Geoff Tompkinson's city hyperlapses (2012 —) · Barcelona GO! (Rob Whitworth, 2013) · Instagram Hyperlapse app (2014) · Microsoft Research Hyperlapse (Kopf, Cohen & Szeliski, SIGGRAPH 2014)
- Motion DNA: A steady, gliding forward push that never bobs, while everything else is fast-forwarded: clouds race out of the vanishing point, shadows sweep the street, traffic becomes streaks; whip pans snap between locations and the final push eases to a stop as the city keeps rushing.
- Visual DNA: Strict one-point perspective down an avenue and across a suspension bridge, the sky sliding from afternoon blue through a sunset into blue hour and night, windows switching on, ghosted pedestrians, red and white light ribbons, neon on wet asphalt and a faint frame-to-frame exposure shimmer.
- Signature transitions: Whip pans (motion-blurred swish) between locations, time jumping with each one
- Key techniques: One still every few metres, aligned to a fixed point, Warp stabilisation & deflicker, Whip-pan transitions between locations, Light trails from long-interval traffic

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (One still every few metres, aligned to a fixed point, Warp stabilisation & deflicker, Whip-pan transitions between locations, Light trails from long-interval traffic).
- 5.0–8.0 s  Climax: the most spectacular moment, built on One still every few metres, aligned to a fixed point and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "HYPERLAPSE", held for about 1 s.

BUILD RULES
- Suggested tools: DSLR on a tripod moved by hand, every few metres, After Effects Warp Stabilizer / LRTimelapse deflicker, Canvas 2D (one-point projection, procedural city). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Hyperlapse motion-graphics film (Moving Time-lapse). Visual style: strict one-point perspective down an avenue and across a suspension bridge, the sky sliding from afternoon blue through a sunset into blue hour and night, windows switching on, ghosted pedestrians, red and white light ribbons, neon on wet asphalt and a faint frame-to-frame exposure shimmer. Motion: a steady, gliding forward push that never bobs, while everything else is fast-forwarded: clouds race out of the vanishing point, shadows sweep the street, traffic becomes streaks; whip pans snap between locations and the final push eases to a stop as the city keeps rushing. Signature moves: one still every few metres, aligned to a fixed point, warp stabilisation & deflicker, whip-pan transitions between locations, light trails from long-interval traffic; transitions: whip pans (motion-blurred swish) between locations, time jumping with each one. In the tradition of Koyaanisqatsi (Godfrey Reggio, cinematography Ron Fricke, 1982) · Geoff Tompkinson's city hyperlapses (2012 —) · Barcelona GO! (Rob Whitworth, 2013) · Instagram Hyperlapse app (2014) · Microsoft Research Hyperlapse (Kopf, Cohen & Szeliski, SIGGRAPH 2014). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "HYPERLAPSE". Punchy sound design synced to every cut.
```
