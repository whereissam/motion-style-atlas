# Ten-second Ad

*Hook, hero, brand, one benefit, CTA · 1980s — · Narrative Formats*

Reference film: `videos/formatad.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Ten-second Ad** (Hook, hero, brand, one benefit, CTA, 1980s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Short spots have been part of broadcast advertising for decades, sold as cheaper, shorter units next to the standard 30-second commercial. Pre-roll video online and skippable ads after 2010 tightened the rules into the ones creative teams now quote: hook in the first second, the brand on screen within the first few seconds, one message, and an end card with the call to action. Sonic logos — the five-note Intel bong (1994, Walter Werzowa) is the classic — let the brand be recognised by ear alone.
- Study these reference works: Intel Inside sonic logo (Walter Werzowa, 1994) · Apple “Get a Mac” (TBWA\Media Arts Lab, 2006–09) · Old Spice “The Man Your Man Could Smell Like” (Wieden+Kennedy, 2010)
- Motion DNA: A stepped, linear 5 fps move as the hook for the first second; an orange whip into a dark product shot where the Token drops, lands with a squash and catches a shine sweep; the MOTION wordmark slides in beside it at 2.4 s; five seconds of one benefit — eased hops beside the stepped grey square, then the Token alone under a single super; the music stops at 8 s and the Token bounces once to each of the five sonic-logo notes on the end card.
- Visual DNA: The warm paper stage and the orange Token, with a dark, spotlit product shot in the middle; heavy Archivo supers; a split screen of grey “others” against the Token; an end card with the lockup, a pill-shaped orange CTA button, small print and faint title-safe guides. Timing rules are marked under the structure strip with a running timecode.
- Signature transitions: Orange whip wipe into the hero shot; wordmark slide-in; split screen collapsing to full frame; hard cut to the end card on the music stop
- Key techniques: Hook in the first second, Brand on screen by 3 s, End card: CTA plus sonic logo

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hook in the first second, Brand on screen by 3 s, End card: CTA plus sonic logo).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hook in the first second and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TEN-SECOND AD", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects / Nuke compositing to a broadcast spec (title-safe, :10 exactly), Music bed edited to the cut, sonic logo on the end card, Canvas 2D: stage, clip-path split, gradient product light and shine. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Ten-second Ad motion-graphics film (Hook, hero, brand, one benefit, CTA). Visual style: the warm paper stage and the orange Token, with a dark, spotlit product shot in the middle; heavy Archivo supers; a split screen of grey “others” against the Token; an end card with the lockup, a pill-shaped orange CTA button, small print and faint title-safe guides. Timing rules are marked under the structure strip with a running timecode. Motion: a stepped, linear 5 fps move as the hook for the first second; an orange whip into a dark product shot where the Token drops, lands with a squash and catches a shine sweep; the MOTION wordmark slides in beside it at 2.4 s; five seconds of one benefit — eased hops beside the stepped grey square, then the Token alone under a single super; the music stops at 8 s and the Token bounces once to each of the five sonic-logo notes on the end card. Signature moves: hook in the first second, brand on screen by 3 s, end card: cta plus sonic logo; transitions: orange whip wipe into the hero shot; wordmark slide-in; split screen collapsing to full frame; hard cut to the end card on the music stop. In the tradition of Intel Inside sonic logo (Walter Werzowa, 1994) · Apple “Get a Mac” (TBWA\Media Arts Lab, 2006–09) · Old Spice “The Man Your Man Could Smell Like” (Wieden+Kennedy, 2010). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TEN-SECOND AD". Punchy sound design synced to every cut.
```
