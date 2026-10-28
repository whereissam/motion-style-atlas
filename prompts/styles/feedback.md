# Feedback Loops

*Video Feedback / Howlaround · 1963 — · Experimental & Generative*

Reference film: `videos/feedback.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Feedback Loops** (Video Feedback / Howlaround, 1963 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Point a camera at the monitor showing its own picture and the image re-enters itself every frame: nested screens, spiralling trails and luminous blooms emerge from nothing but zoom, tilt and delay. Bernard Lodge built Doctor Who's 1963 title sequence from this BBC "howlaround"; 1970s video artists — Nam June Paik (with Shuya Abe's Paik–Abe Synthesizer, 1969–70) and Steina & Woody Vasulka at The Kitchen — made it a medium; digital frame feedback (MilkDrop, TouchDesigner, VJ software) adds zoom, rotation and hue shift on every pass.
- Study these reference works: Doctor Who title sequence (Bernard Lodge, BBC, 1963) · Nam June Paik & Shuya Abe, Paik–Abe Video Synthesizer (1969–70) · Steina & Woody Vasulka, video feedback works (1970s) · Queen, "Bohemian Rhapsody" video (Bruce Gowers, 1975) · MilkDrop (Ryan Geiss, 2001) · TouchDesigner feedback TOPs (Derivative, 2000s —)
- Motion DNA: Nothing is animated directly: one small moving thing is re-photographed again and again, so its past spirals inward or blooms outward. Changing the zoom, tilt or delay changes the whole organism at once; the motion is slow, breathing, self-similar.
- Visual DNA: A dark field with glowing structures: nested screens receding into a spiral tunnel, blooming petals of trailed light, colour cycling through the passes, CRT scanlines and soft bloom.
- Signature transitions: Infinite zoom through nested screens, crossfade between regimes, rotation reversal (fold), echo tunnel title
- Key techniques: Recursive zoom / rotate per pass, One-pass time delay per copy, Additive decay + hue shift per pass, Monitor-in-monitor tunnel

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Recursive zoom / rotate per pass, One-pass time delay per copy, Additive decay + hue shift per pass, Monitor-in-monitor tunnel).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Recursive zoom / rotate per pass and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FEEDBACK LOOPS", held for about 1 s.

BUILD RULES
- Suggested tools: Camera + monitor (analog howlaround), Video synthesizers & colorizers, TouchDesigner / MilkDrop frame feedback, Canvas 2D (N recursive copies as a function of t). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Feedback Loops motion-graphics film (Video Feedback / Howlaround). Visual style: a dark field with glowing structures: nested screens receding into a spiral tunnel, blooming petals of trailed light, colour cycling through the passes, CRT scanlines and soft bloom. Motion: nothing is animated directly: one small moving thing is re-photographed again and again, so its past spirals inward or blooms outward. Changing the zoom, tilt or delay changes the whole organism at once; the motion is slow, breathing, self-similar. Signature moves: recursive zoom / rotate per pass, one-pass time delay per copy, additive decay + hue shift per pass, monitor-in-monitor tunnel; transitions: infinite zoom through nested screens, crossfade between regimes, rotation reversal (fold), echo tunnel title. In the tradition of Doctor Who title sequence (Bernard Lodge, BBC, 1963) · Nam June Paik & Shuya Abe, Paik–Abe Video Synthesizer (1969–70) · Steina & Woody Vasulka, video feedback works (1970s) · Queen, "Bohemian Rhapsody" video (Bruce Gowers, 1975) · MilkDrop (Ryan Geiss, 2001) · TouchDesigner feedback TOPs (Derivative, 2000s —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FEEDBACK LOOPS". Punchy sound design synced to every cut.
```
