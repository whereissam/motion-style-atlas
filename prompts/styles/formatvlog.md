# Day in the Life

*The clock as the spine, jump cuts to compress it · 2007 — · Narrative Formats*

Reference film: `videos/formatvlog.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Day in the Life** (The clock as the spine, jump cuts to compress it, 2007 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Video blogs followed soon after YouTube opened in 2005. The Vlogbrothers, John and Hank Green, made the jump-cut talking head — every pause cut out — a house style from Brotherhood 2.0 in 2007, and Casey Neistat’s daily vlog (March 2015 – November 2016) set the template for the day-in-the-life film: handheld, time-stamped, B-roll montages of small routines cut to music, one sit-down chat to camera and a sign-off. In the early 2020s “day in my life” videos became a staple of TikTok and YouTube Shorts, organised entirely by the clock — 7:00 AM, 9:00 AM, and on to bed.
- Study these reference works: Vlogbrothers — Brotherhood 2.0 (John and Hank Green, 2007) · Casey Neistat’s daily vlog (2015–16) · “day in my life” videos on TikTok and YouTube Shorts (2020 —)
- Motion DNA: Sixteen hours in ten seconds on a 120 BPM lo-fi bed. An alarm, the Token pops up in bed; six quarter-second B-roll shots of the routine on the eighth notes; a walk with a jump cut forty minutes ahead; a sit-down chat to camera chopped into four jump cuts with the framing punched in and out; golden hour jump-cutting into dusk; a timelapse of editing at night with the clock racing; a wave goodnight and the lamp clicking off. Everything drifts slightly — a handheld camera made of two layers of noise.
- Visual DNA: Flat illustrated rooms and streets with the orange Token as the vlogger; a sky gradient driven by the hour — peach dawn, clear blue noon, orange golden hour, violet dusk, navy night — seen through every window. Bold white time supers with a dark offset, burned-in lowercase subtitles in the chat, an analog clock top right and a 7 AM → 11 PM day bar bottom right where each shot is a thin sliver and every jump cut is labelled with the time it skipped.
- Signature transitions: Hard jump cuts throughout (time skips, not scene transitions); a punch-in / punch-out between talking-head takes; the lamp switching off
- Key techniques: Time supers: the clock is the spine, Jump cuts compress hours into seconds, B-roll routine montage + one sit-down

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Time supers: the clock is the spine, Jump cuts compress hours into seconds, B-roll routine montage + one sit-down).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Time supers: the clock is the spine and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DAY IN THE LIFE", held for about 1 s.

BUILD RULES
- Suggested tools: Phone or compact camera, handheld; edited in Premiere / CapCut on a music bed, Time-stamp supers as a template; B-roll cut on the beat, Canvas 2D: a shot list keyed to clock time drives the scenes, the sky gradient and the overlays; vnoise handheld camera. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Day in the Life motion-graphics film (The clock as the spine, jump cuts to compress it). Visual style: flat illustrated rooms and streets with the orange Token as the vlogger; a sky gradient driven by the hour — peach dawn, clear blue noon, orange golden hour, violet dusk, navy night — seen through every window. Bold white time supers with a dark offset, burned-in lowercase subtitles in the chat, an analog clock top right and a 7 AM → 11 PM day bar bottom right where each shot is a thin sliver and every jump cut is labelled with the time it skipped. Motion: sixteen hours in ten seconds on a 120 BPM lo-fi bed. An alarm, the Token pops up in bed; six quarter-second B-roll shots of the routine on the eighth notes; a walk with a jump cut forty minutes ahead; a sit-down chat to camera chopped into four jump cuts with the framing punched in and out; golden hour jump-cutting into dusk; a timelapse of editing at night with the clock racing; a wave goodnight and the lamp clicking off. Everything drifts slightly — a handheld camera made of two layers of noise. Signature moves: time supers: the clock is the spine, jump cuts compress hours into seconds, b-roll routine montage + one sit-down; transitions: hard jump cuts throughout (time skips, not scene transitions); a punch-in / punch-out between talking-head takes; the lamp switching off. In the tradition of Vlogbrothers — Brotherhood 2.0 (John and Hank Green, 2007) · Casey Neistat’s daily vlog (2015–16) · “day in my life” videos on TikTok and YouTube Shorts (2020 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DAY IN THE LIFE". Punchy sound design synced to every cut.
```
