# Ink Wash 水墨

*Shan Shui Animation · 1960 — · Cultural & Regional*

Reference film: `videos/inkwash.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Ink Wash 水墨** (Shan Shui Animation, 1960 —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Chinese shan shui (“mountain-water”) painting builds a landscape from graded ink on absorbent xuan paper, leaving empty paper as mist and water. In 1960 the Shanghai Animation Film Studio found a way to animate it, layering ink-wash cels so tadpoles, fish and mountains bleed and breathe on screen.
- Study these reference works: Travellers among Mountains and Streams (Fan Kuan, c.1000) · Where Is Mama (Shanghai Animation Film Studio, 1960) · The Cowherd’s Flute (Te Wei, 1963) · Feelings of Mountains and Waters (Te Wei, 1988)
- Motion DNA: Slow and breathing: ink blooms and settles, tadpoles flick, and the landscape condenses out of mist as the camera drifts back; nothing cuts.
- Visual DNA: Monochrome ink from charcoal to the palest grey, soft bleeding edges on fibrous paper, half the frame left empty, with one red seal.
- Signature transitions: Ink bloom, mist dissolve, pull-back reveal, brush-written inscription
- Key techniques: Wet-paper ink bleed, Graded ink & dry-brush cun, Negative space as mist

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Wet-paper ink bleed, Graded ink & dry-brush cun, Negative space as mist).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Wet-paper ink bleed and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "INK WASH 水墨", held for about 1 s.

BUILD RULES
- Suggested tools: Layered ink-wash cels, Canvas 2D, TVPaint / After Effects. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Ink Wash 水墨 motion-graphics film (Shan Shui Animation). Visual style: monochrome ink from charcoal to the palest grey, soft bleeding edges on fibrous paper, half the frame left empty, with one red seal. Motion: slow and breathing: ink blooms and settles, tadpoles flick, and the landscape condenses out of mist as the camera drifts back; nothing cuts. Signature moves: wet-paper ink bleed, graded ink & dry-brush cun, negative space as mist; transitions: ink bloom, mist dissolve, pull-back reveal, brush-written inscription. In the tradition of Travellers among Mountains and Streams (Fan Kuan, c.1000) · Where Is Mama (Shanghai Animation Film Studio, 1960) · The Cowherd’s Flute (Te Wei, 1963) · Feelings of Mountains and Waters (Te Wei, 1988). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "INK WASH 水墨". Punchy sound design synced to every cut.
```
