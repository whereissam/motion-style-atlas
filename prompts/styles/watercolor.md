# Watercolour Animation 水彩动画

*Painted Washes in Motion · 1940s — · 2D Animation & Illustration*

Reference film: `videos/watercolor.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Watercolour Animation 水彩动画** (Painted Washes in Motion, 1940s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Transparent washes on textured paper, where pigment blooms, granulates and dries with dark edges, were first carried into animation as painted backgrounds — Disney’s Snow White (1937) and Bambi (1942), then Kazuo Oga’s Ghibli landscapes. Isao Takahata’s The Tale of the Princess Kaguya (2013) went further and animated the wash itself.
- Study these reference works: Bambi (Disney, 1942; backgrounds by Tyrus Wong) · My Neighbor Totoro (Studio Ghibli, 1988; art director Kazuo Oga) · The Snowman (Dianne Jackson, 1982) · The Tale of the Princess Kaguya (Isao Takahata, 2013) · Ernest & Celestine (2012)
- Motion DNA: Nothing cuts: washes spread at the wet front and dry in place, glazes change the light, and only small things — rain, a kite, birds — move across a scene that is still being painted.
- Visual DNA: Transparent glazes on rough cold-press paper: soft wet-in-wet skies, darker dried edges, granulating blues, cauliflower backruns and white paper left for clouds and light.
- Signature transitions: Wet bloom, glaze over, lift-out, wash write-on
- Key techniques: Wet-on-wet blooms, Edge darkening & backruns, Pigment granulation, Glazing & lifting

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Wet-on-wet blooms, Edge darkening & backruns, Pigment granulation, Glazing & lifting).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Wet-on-wet blooms and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "WATERCOLOUR ANIMATION 水彩动画", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-painted cels + TVPaint, Photoshop / After Effects, Canvas 2D (per-pixel washes). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Watercolour Animation 水彩动画 motion-graphics film (Painted Washes in Motion). Visual style: transparent glazes on rough cold-press paper: soft wet-in-wet skies, darker dried edges, granulating blues, cauliflower backruns and white paper left for clouds and light. Motion: nothing cuts: washes spread at the wet front and dry in place, glazes change the light, and only small things — rain, a kite, birds — move across a scene that is still being painted. Signature moves: wet-on-wet blooms, edge darkening & backruns, pigment granulation, glazing & lifting; transitions: wet bloom, glaze over, lift-out, wash write-on. In the tradition of Bambi (Disney, 1942; backgrounds by Tyrus Wong) · My Neighbor Totoro (Studio Ghibli, 1988; art director Kazuo Oga) · The Snowman (Dianne Jackson, 1982) · The Tale of the Princess Kaguya (Isao Takahata, 2013) · Ernest & Celestine (2012). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "WATERCOLOUR ANIMATION 水彩动画". Punchy sound design synced to every cut.
```
