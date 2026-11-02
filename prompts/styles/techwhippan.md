# Whip Pan

*A pan so fast it streaks, with the cut hidden inside the blur · 1930s — · Technique Atlas*

Reference film: `videos/techwhippan.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Whip Pan** (A pan so fast it streaks, with the cut hidden inside the blur, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A whip pan (also swish or flash pan) swings the camera so quickly that the frame dissolves into horizontal streaks. Because a streaked frame shows nothing recognisable, editors learned to join two whip pans at their fastest point so the cut vanishes into the blur, turning a change of place or time into one apparent move. Orson Welles used flash pans in Citizen Kane (1941); Sergio Leone and the New Hollywood leaned on them, and Damien Chazelle built the rhythm of Whiplash (2014) and the climax of La La Land (2016) around whips between players.
- Study these reference works: Citizen Kane (Orson Welles, 1941) · Whiplash (Damien Chazelle, 2014) · La La Land (Damien Chazelle, 2016)
- Motion DNA: Hold, lunge, hold. A calm shot of the Token, then a 162° swing that peaks at 900°/s for barely a quarter second, landing on the beat on a different set-up with a short operator wobble as the pan is caught. A slowed, frame-by-frame replay steps through the 30 frames of the move, then the whip runs back the other way to the opening shot.
- Visual DNA: The Technique Atlas stage in two set-ups — the Token alone; the Token on a floor with MOTION — and grey light stands in the wings that smear into bands; a heading tape across the top with shot A, shot B and the cut marked; an ω graph with the cut line; a dimension line measuring the streak; a replay strip of blur bars.
- Signature transitions: Whip out of shot A, hard cut at the fastest frame, whip into shot B; then the reverse whip back to A
- Key techniques: sech² angular-velocity pulse, tanh heading, Shutter-averaged sub-frame samples, Cut placed at peak ω

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (sech² angular-velocity pulse, tanh heading, Shutter-averaged sub-frame samples, Cut placed at peak ω).
- 5.0–8.0 s  Climax: the most spectacular moment, built on sech² angular-velocity pulse, tanh heading and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "WHIP PAN", held for about 1 s.

BUILD RULES
- Suggested tools: Fluid-head pan by hand, cut on the blur in the edit, Directional / motion blur over a position keyframe in After Effects, Canvas 2D: up to 48 shutter samples averaged per frame. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Whip Pan motion-graphics film (A pan so fast it streaks, with the cut hidden inside the blur). Visual style: the Technique Atlas stage in two set-ups — the Token alone; the Token on a floor with MOTION — and grey light stands in the wings that smear into bands; a heading tape across the top with shot A, shot B and the cut marked; an ω graph with the cut line; a dimension line measuring the streak; a replay strip of blur bars. Motion: hold, lunge, hold. A calm shot of the Token, then a 162° swing that peaks at 900°/s for barely a quarter second, landing on the beat on a different set-up with a short operator wobble as the pan is caught. A slowed, frame-by-frame replay steps through the 30 frames of the move, then the whip runs back the other way to the opening shot. Signature moves: sech² angular-velocity pulse, tanh heading, shutter-averaged sub-frame samples, cut placed at peak ω; transitions: whip out of shot A, hard cut at the fastest frame, whip into shot B; then the reverse whip back to A. In the tradition of Citizen Kane (Orson Welles, 1941) · Whiplash (Damien Chazelle, 2014) · La La Land (Damien Chazelle, 2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "WHIP PAN". Punchy sound design synced to every cut.
```
