# Anime MG

*OP & Title-card Motion Graphics · 1995 — · 2D Animation & Illustration*

Reference film: `videos/animemg.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Anime MG** (OP & Title-card Motion Graphics, 1995 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Japanese TV anime compresses a whole show into a 90-second opening cut hard to its theme song: speed lines, smear frames, cel-flat colour, lens flares and huge type. Evangelion’s stark kanji title cards, Production I.G’s layered digital compositing, Shaft’s typographic interruptions and TRIGGER’s slammed katakana logos made the title card itself a motion-graphics form.
- Study these reference works: Neon Genesis Evangelion (Gainax, 1995) · Ghost in the Shell: Stand Alone Complex (Production I.G, 2002) · The Melancholy of Haruhi Suzumiya (Kyoto Animation, 2006) · Bakemonogatari (Shaft, 2009) · Kill la Kill (Trigger, 2013) · Promare (Trigger, 2019)
- Motion DNA: Cut to the beat: holds and slams on the downbeat, characters on twos against backgrounds panning on ones, smear multiples on fast limbs, slow-motion leaps across the sun, a single impact frame with decaying shake, springy logo slams and a closing shine.
- Visual DNA: Flat cel colour with one hard shadow tone, ink outlines, saturated red/yellow/cyan cards, heavy condensed English type paired with katakana, cel-shaded cumulus on gradient skies, hexagonal lens ghosts, warm light leaks, sparkles and halftone starbursts.
- Signature transitions: Anamorphic slit open, smash cut, panel slams and slides, tilt-up reveal, impact inversion, letterbox snap, white slash wipe, logo slam
- Key techniques: Speed lines and smear multiples, Beat-synced type-card slams, Cel shadow bands, flares, leaks

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Speed lines and smear multiples, Beat-synced type-card slams, Cel shadow bands, flares, leaks).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Speed lines and smear multiples and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ANIME MG", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-drawn cels and digital ink & paint, After Effects compositing (flares, leaks, type), Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Anime MG motion-graphics film (OP & Title-card Motion Graphics). Visual style: flat cel colour with one hard shadow tone, ink outlines, saturated red/yellow/cyan cards, heavy condensed English type paired with katakana, cel-shaded cumulus on gradient skies, hexagonal lens ghosts, warm light leaks, sparkles and halftone starbursts. Motion: cut to the beat: holds and slams on the downbeat, characters on twos against backgrounds panning on ones, smear multiples on fast limbs, slow-motion leaps across the sun, a single impact frame with decaying shake, springy logo slams and a closing shine. Signature moves: speed lines and smear multiples, beat-synced type-card slams, cel shadow bands, flares, leaks; transitions: anamorphic slit open, smash cut, panel slams and slides, tilt-up reveal, impact inversion, letterbox snap, white slash wipe, logo slam. In the tradition of Neon Genesis Evangelion (Gainax, 1995) · Ghost in the Shell: Stand Alone Complex (Production I.G, 2002) · The Melancholy of Haruhi Suzumiya (Kyoto Animation, 2006) · Bakemonogatari (Shaft, 2009) · Kill la Kill (Trigger, 2013) · Promare (Trigger, 2019). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ANIME MG". Punchy sound design synced to every cut.
```
