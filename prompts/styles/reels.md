# Social Reels

*Vertical short-form video · 2013 — · Social & Commercial*

Reference film: `videos/reels.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Social Reels** (Vertical short-form video, 2013 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Short-form vertical video — Vine’s six-second loops, then Musical.ly, TikTok, Instagram Reels and YouTube Shorts — built a new editing grammar for the phone held upright: jump cuts every second, captions that pop word by word, stickers and text boxes, and a swipe to the next clip. Reposted onto 16:9 screens, the tall frame sits in the middle over a blurred, enlarged copy of itself.
- Study these reference works: Vine (2013–2017) · Musical.ly (2014) · Douyin (2016) and TikTok (2017 —) · Instagram Reels (2020) · YouTube Shorts (2020 —) · CapCut auto-captions (2020s)
- Motion DNA: Nothing holds longer than a second: jump cuts snap between framings of the same talking head, each caption word pops with overshoot as it is spoken, stickers bounce on, a double-tap throws a heart that springs, wobbles and floats away, and the whole clip is thrown upward by a thumb swipe so the next one can drop on the beat.
- Visual DNA: A 9:16 phone screen centred in the 16:9 frame over its own blurred enlargement; handheld, warmly lit selfie footage; heavy white caption type with black outlines and one yellow word; white text plates, a yellow starburst, red hearts, a translucent action rail, a thin progress bar and a generic app chrome.
- Signature transitions: Jump cuts and punch-ins on the talking head, hard cuts to B-roll, double-tap heart burst, swipe-up to the next clip, beat-drop zoom punch
- Key techniques: Jump cuts and punch-ins, Word-by-word auto-captions, Pillarbox blur fill

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Jump cuts and punch-ins, Word-by-word auto-captions, Pillarbox blur fill).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Jump cuts and punch-ins and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SOCIAL REELS", held for about 1 s.

BUILD RULES
- Suggested tools: CapCut / TikTok in-app editor, Premiere Pro or Final Cut (vertical timeline), Canvas 2D (low-res blur fill). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (generic app UI, fictional creators, no real logos).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Social Reels motion-graphics film (Vertical short-form video). Visual style: a 9:16 phone screen centred in the 16:9 frame over its own blurred enlargement; handheld, warmly lit selfie footage; heavy white caption type with black outlines and one yellow word; white text plates, a yellow starburst, red hearts, a translucent action rail, a thin progress bar and a generic app chrome. Motion: nothing holds longer than a second: jump cuts snap between framings of the same talking head, each caption word pops with overshoot as it is spoken, stickers bounce on, a double-tap throws a heart that springs, wobbles and floats away, and the whole clip is thrown upward by a thumb swipe so the next one can drop on the beat. Signature moves: jump cuts and punch-ins, word-by-word auto-captions, pillarbox blur fill; transitions: jump cuts and punch-ins on the talking head, hard cuts to B-roll, double-tap heart burst, swipe-up to the next clip, beat-drop zoom punch. In the tradition of Vine (2013–2017) · Musical.ly (2014) · Douyin (2016) and TikTok (2017 —) · Instagram Reels (2020) · YouTube Shorts (2020 —) · CapCut auto-captions (2020s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SOCIAL REELS". Punchy sound design synced to every cut.
```
