# Lyric Video

*Every Word on the Beat · 1987 — · Typography & Text Motion*

Reference film: `videos/lyric.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Lyric Video** (Every Word on the Beat, 1987 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A music video whose picture is the song’s own words, each one landing on the syllable it is sung on. Prince’s "Sign o’ the Times" (1987) — animated words and pulsing shapes in place of the singer — set the template; YouTube turned it into a release ritual in the 2010s, with lyric videos posted before the official clip, and Katy Perry’s "Roar" (2013) swapped the words for emoji on a phone screen. It descends from the bouncing-ball sing-along cartoon and karaoke’s colour wipe.
- Study these reference works: Song Car-Tunes, the bouncing-ball sing-alongs (Fleischer Studios, 1924 —) · "Subterranean Homesick Blues" cue cards (Bob Dylan, in D. A. Pennebaker’s Dont Look Back, 1967) · "Sign o’ the Times" (Prince, dir. Bill Konersman, 1987) · "Roar" lyric video (Katy Perry, 2013)
- Motion DNA: Time is the lyric sheet: nothing moves until it is sung, then each syllable wipes across its letters over the length of its note; words sit higher or lower with their pitch, held notes stretch and tremble with the vibrato, short notes pop with a spring, and every line changes treatment so the next verse reads as new.
- Visual DNA: Big display type in neon outline, wet marker and heavy grotesk over soft streetlight bokeh, a new ground colour per verse, rebus glyphs (an eye for "I", "2", "U") and drawn emoji-style icons on the chorus, with a pitch trace of the voice running underneath.
- Signature transitions: Line changes on the downbeat: letters float off, fall away or scatter; one hard cut to yellow for the chorus; the chorus squashes flat into the sung title
- Key techniques: Syllable-timed karaoke wipe, Pitch-tracking baselines, Formant-synth vocal

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Syllable-timed karaoke wipe, Pitch-tracking baselines, Formant-synth vocal).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Syllable-timed karaoke wipe and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LYRIC VIDEO", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects text animators keyed to a lyric timing sheet, Timestamped lyric files (LRC) or forced alignment against the vocal stem, Canvas 2D: one syllable table drives the per-letter wipes, the pitch trace and a formant-synth voice. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Lyric Video motion-graphics film (Every Word on the Beat). Visual style: big display type in neon outline, wet marker and heavy grotesk over soft streetlight bokeh, a new ground colour per verse, rebus glyphs (an eye for "I", "2", "U") and drawn emoji-style icons on the chorus, with a pitch trace of the voice running underneath. Motion: time is the lyric sheet: nothing moves until it is sung, then each syllable wipes across its letters over the length of its note; words sit higher or lower with their pitch, held notes stretch and tremble with the vibrato, short notes pop with a spring, and every line changes treatment so the next verse reads as new. Signature moves: syllable-timed karaoke wipe, pitch-tracking baselines, formant-synth vocal; transitions: line changes on the downbeat: letters float off, fall away or scatter; one hard cut to yellow for the chorus; the chorus squashes flat into the sung title. In the tradition of Song Car-Tunes, the bouncing-ball sing-alongs (Fleischer Studios, 1924 —) · "Subterranean Homesick Blues" cue cards (Bob Dylan, in D. A. Pennebaker’s Dont Look Back, 1967) · "Sign o’ the Times" (Prince, dir. Bill Konersman, 1987) · "Roar" lyric video (Katy Perry, 2013). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LYRIC VIDEO". Punchy sound design synced to every cut.
```
