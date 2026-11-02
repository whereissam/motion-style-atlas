# Tracking

*Uniform letter-spacing, in thousandths of an em · 1960s — · Technique Atlas*

Reference film: `videos/techtracking.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Tracking** (Uniform letter-spacing, in thousandths of an em, 1960s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: In metal type, spacing a word out meant inserting thin spaces between the sorts by hand. Phototypesetting in the 1960s and 70s turned spacing into a dial, and tight, near-touching settings became a period look; desktop publishing then made tracking a number, which Adobe applications measure in thousandths of an em, and CSS1 (1996) added letter-spacing to the web. On screen, the slow tracking-out became a stock film-title and trailer move: the word keeps its centre while its letters drift apart.
- Study these reference works: Alien (Ridley Scott, 1979; title by R/Greenberg Associates, widely spaced letters assembling) · Adobe InDesign (1999; tracking and kerning in 1/1000 em) · CSS1 letter-spacing (W3C Recommendation, 1996)
- Motion DNA: A single scalar drives everything. MOTION pinches from 0 to −50 in a bar, holds, then tracks out to +800 over five and a half seconds on a smoothstep so slow it reads as a drift, holds for a beat and snaps back to 0 with a small overshoot. Every gap grows by the same amount, so the outer letters travel five times as far as the inner gap opens.
- Visual DNA: The Technique Atlas stage with MOTION in Archivo 900 at 150 px, each glyph in a dashed advance box with its width in 1/1000 em, the tracking gaps tinted orange (and hatched where negative tracking makes boxes overlap), a fixed orange centre line; a big mono readout of T and pixels, a tracking slider with the Token as knob, and a naive centred line that drifts off the centre line.
- Signature transitions: One continuous value change; a snap back with overshoot
- Key techniques: Tracking in 1/1000 em, Advance widths + i·T, Centre without the trailing space

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Tracking in 1/1000 em, Advance widths + i·T, Centre without the trailing space).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Tracking in 1/1000 em and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TRACKING", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects: Text Animator → Tracking Amount, CSS letter-spacing in em, or Figma / InDesign tracking, Canvas 2D: per-glyph advances + i·T, centred on the width without the trailing gap. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Tracking motion-graphics film (Uniform letter-spacing, in thousandths of an em). Visual style: the Technique Atlas stage with MOTION in Archivo 900 at 150 px, each glyph in a dashed advance box with its width in 1/1000 em, the tracking gaps tinted orange (and hatched where negative tracking makes boxes overlap), a fixed orange centre line; a big mono readout of T and pixels, a tracking slider with the Token as knob, and a naive centred line that drifts off the centre line. Motion: a single scalar drives everything. MOTION pinches from 0 to −50 in a bar, holds, then tracks out to +800 over five and a half seconds on a smoothstep so slow it reads as a drift, holds for a beat and snaps back to 0 with a small overshoot. Every gap grows by the same amount, so the outer letters travel five times as far as the inner gap opens. Signature moves: tracking in 1/1000 em, advance widths + i·t, centre without the trailing space; transitions: one continuous value change; a snap back with overshoot. In the tradition of Alien (Ridley Scott, 1979; title by R/Greenberg Associates, widely spaced letters assembling) · Adobe InDesign (1999; tracking and kerning in 1/1000 em) · CSS1 letter-spacing (W3C Recommendation, 1996). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TRACKING". Punchy sound design synced to every cut.
```
