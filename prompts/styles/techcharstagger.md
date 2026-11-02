# Character Stagger

*One text animator, a delay per letter · 2003 — · Technique Atlas*

Reference film: `videos/techcharstagger.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Character Stagger** (One text animator, a delay per letter, 2003 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Title designers long animated lettering one character at a time by hand or on the rostrum camera; software made it a property of the text itself. Adobe After Effects 6.0 (2003) introduced text animators: property offsets (position, rotation, scale, opacity) applied through range selectors that hand each character, word or line a share of the animator, with start, end and offset, shape, ease and randomise-order controls. Cinema 4D’s MoText (MoGraph, 2006) and web libraries that split text into characters, such as GSAP’s SplitText, carried the same idea into 3D and the browser.
- Study these reference works: Adobe After Effects text animators and range selectors (2003) · Cinema 4D MoGraph MoText (Maxon, 2006) · GSAP SplitText (GreenSock)
- Motion DNA: Six letters, one move each, starting a fixed delay apart so the word reads as a single wave: a rise and fade sweeping left to right, letters spinning up from −90° right to left, a pop of overshooting scale opening from the centre out, and a random order that sparkles; each pattern clears in one beat. The last bar runs the same rise on a 39-character line at 22 ms a letter, fast enough to look like a ripple rather than a sequence.
- Visual DNA: The Technique Atlas stage with MOTION set large in Archivo Black; numbered index chips with delays above each letter; under the word, the range selector shown as an amount bar per letter joined into a ramp; a timing chart of six offset bars with a playhead; a text-animator panel top right; the delay-by-index profile as the caption graph.
- Signature transitions: Each order clears with a single simultaneous fade; the long line ripples in under the word
- Key techniques: Animator: property offsets per character, Range selector: amount by index, Orders: left · right · centre · random

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Animator: property offsets per character, Range selector: amount by index, Orders: left · right · centre · random).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Animator: property offsets per character and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CHARACTER STAGGER", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects text animators with range selectors (based on characters), Cinema 4D MoText effectors / GSAP SplitText stagger, Canvas 2D: the word split into measured glyphs, each drawn with offsets × selector amount(i, t). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Character Stagger motion-graphics film (One text animator, a delay per letter). Visual style: the Technique Atlas stage with MOTION set large in Archivo Black; numbered index chips with delays above each letter; under the word, the range selector shown as an amount bar per letter joined into a ramp; a timing chart of six offset bars with a playhead; a text-animator panel top right; the delay-by-index profile as the caption graph. Motion: six letters, one move each, starting a fixed delay apart so the word reads as a single wave: a rise and fade sweeping left to right, letters spinning up from −90° right to left, a pop of overshooting scale opening from the centre out, and a random order that sparkles; each pattern clears in one beat. The last bar runs the same rise on a 39-character line at 22 ms a letter, fast enough to look like a ripple rather than a sequence. Signature moves: animator: property offsets per character, range selector: amount by index, orders: left · right · centre · random; transitions: each order clears with a single simultaneous fade; the long line ripples in under the word. In the tradition of Adobe After Effects text animators and range selectors (2003) · Cinema 4D MoGraph MoText (Maxon, 2006) · GSAP SplitText (GreenSock). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CHARACTER STAGGER". Punchy sound design synced to every cut.
```
