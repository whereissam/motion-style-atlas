# Rotoscope

*Traced Over Live Action · 1915 — · 2D Animation & Illustration*

Reference film: `videos/rotoscope.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Rotoscope** (Traced Over Live Action, 1915 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Max Fleischer patented the rotoscope in 1915: live-action film projected one frame at a time onto glass so an animator could trace real motion. Disney used traced footage as reference for Snow White, Ralph Bakshi built whole features on it, a-ha’s “Take On Me” turned it into a living pencil sketch, and Bob Sabiston’s Rotoshop gave Richard Linklater’s Waking Life and A Scanner Darkly their interpolated, swimming flats.
- Study these reference works: Out of the Inkwell (Max & Dave Fleischer, 1918–29) · Minnie the Moocher (Fleischer, with Cab Calloway, 1932) · Snow White and the Seven Dwarfs (Disney, 1937) · The Lord of the Rings (Ralph Bakshi, 1978) · Take On Me (a-ha, dir. Steve Barron, 1985) · Waking Life (Richard Linklater, 2001) · A Scanner Darkly (Linklater, 2006)
- Motion DNA: Real human timing that no animator would invent — the heel-strike, the decelerating last step, the weight settling, overlapping arm swing — carried straight into drawing; in pencil the line boils on twos, in Rotoshop the same contours swim smoothly between keyed traces.
- Visual DNA: A sepia live-action plate in a projector gate, translucent animation bond on pegs, blue line-of-action construction under graphite contours and diagonal hatching; then flat posterised colour fields, thin wobbling ink lines and backgrounds that breathe.
- Signature transitions: Freeze frame, sheet drop onto pegs, light-table switch-off, push-in to the hand, live-action breakthrough, colour flood from the hand, traced title
- Key techniques: Frozen plate traced on pegs, Pencil boil with offset hatching, Rotoshop-style swimming flats

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Frozen plate traced on pegs, Pencil boil with offset hatching, Rotoshop-style swimming flats).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Frozen plate traced on pegs and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ROTOSCOPE", held for about 1 s.

BUILD RULES
- Suggested tools: Rotoscope projector and glass easel, Rotoshop vector interpolation, After Effects / TVPaint rotoscoping, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (the live-action plate is synthesised from the same rig).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Rotoscope motion-graphics film (Traced Over Live Action). Visual style: a sepia live-action plate in a projector gate, translucent animation bond on pegs, blue line-of-action construction under graphite contours and diagonal hatching; then flat posterised colour fields, thin wobbling ink lines and backgrounds that breathe. Motion: real human timing that no animator would invent — the heel-strike, the decelerating last step, the weight settling, overlapping arm swing — carried straight into drawing; in pencil the line boils on twos, in Rotoshop the same contours swim smoothly between keyed traces. Signature moves: frozen plate traced on pegs, pencil boil with offset hatching, rotoshop-style swimming flats; transitions: freeze frame, sheet drop onto pegs, light-table switch-off, push-in to the hand, live-action breakthrough, colour flood from the hand, traced title. In the tradition of Out of the Inkwell (Max & Dave Fleischer, 1918–29) · Minnie the Moocher (Fleischer, with Cab Calloway, 1932) · Snow White and the Seven Dwarfs (Disney, 1937) · The Lord of the Rings (Ralph Bakshi, 1978) · Take On Me (a-ha, dir. Steve Barron, 1985) · Waking Life (Richard Linklater, 2001) · A Scanner Darkly (Linklater, 2006). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ROTOSCOPE". Punchy sound design synced to every cut.
```
