# Before / After

*Comparison with slider reveal · 1890s print — · web sliders 2010s — · Narrative Formats*

Reference film: `videos/formatbeforeafter.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Before / After** (Comparison with slider reveal, 1890s print — · web sliders 2010s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Paired “before” and “after” pictures were a fixture of patent-medicine and beauty advertising by the late nineteenth century; makeover television turned the comparison into a ritual reveal, from This Old House (PBS, 1979) to Extreme Makeover: Home Edition and Queer Eye for the Straight Guy (both 2003). The draggable comparison slider is a web-era form — newsrooms used it for satellite imagery of disasters, as The New York Times did after the 2011 Tōhoku earthquake and tsunami, and open-source plugins such as ZURB’s TwentyTwenty made it a stock component.
- Study these reference works: This Old House (PBS, 1979 —) · Extreme Makeover: Home Edition (ABC, 2003–2012) · Satellite Photos of Japan, Before and After the Quake and Tsunami (The New York Times, 2011)
- Motion DNA: Two seconds of BEFORE to establish the problem; the slider enters and drags to the middle (2–3 s), teases back, pushes further, then snaps off-frame for the reveal at 5 s; one second of full AFTER; a 2.6 s side-by-side hold with framing guides; a 1.4 s brand end.
- Visual DNA: One locked-off frontal frame — wall, desk line, poster, notes, books, three balls and the Token — rendered twice: BEFORE desaturated grey, stained, crooked and scattered; AFTER on the Technique Atlas palette, gridded, aligned, lit warm with soft shadows. White slider bar with a round arrow handle; ink BEFORE and orange AFTER pills; dashed orange alignment guides.
- Signature transitions: Vertical slider wipe (drag, tease, push, snap), scale-down into two panels, guides drawing across both, brand line fading up
- Key techniques: Identical framing on both sides, Slider reveal with a tease, Side-by-side hold

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Identical framing on both sides, Slider reveal with a tease, Side-by-side hold).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Identical framing on both sides and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "BEFORE / AFTER", held for about 1 s.

BUILD RULES
- Suggested tools: Two renders or plates locked to the same camera, composited with a moving matte, Web: two stacked images, clip-path or width driven by a draggable handle (e.g. TwentyTwenty), Canvas 2D: one scene function drawn in two states through a rectangular clip. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Before / After motion-graphics film (Comparison with slider reveal). Visual style: one locked-off frontal frame — wall, desk line, poster, notes, books, three balls and the Token — rendered twice: BEFORE desaturated grey, stained, crooked and scattered; AFTER on the Technique Atlas palette, gridded, aligned, lit warm with soft shadows. White slider bar with a round arrow handle; ink BEFORE and orange AFTER pills; dashed orange alignment guides. Motion: two seconds of BEFORE to establish the problem; the slider enters and drags to the middle (2–3 s), teases back, pushes further, then snaps off-frame for the reveal at 5 s; one second of full AFTER; a 2.6 s side-by-side hold with framing guides; a 1.4 s brand end. Signature moves: identical framing on both sides, slider reveal with a tease, side-by-side hold; transitions: vertical slider wipe (drag, tease, push, snap), scale-down into two panels, guides drawing across both, brand line fading up. In the tradition of This Old House (PBS, 1979 —) · Extreme Makeover: Home Edition (ABC, 2003–2012) · Satellite Photos of Japan, Before and After the Quake and Tsunami (The New York Times, 2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "BEFORE / AFTER". Punchy sound design synced to every cut.
```
