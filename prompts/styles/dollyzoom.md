# Dolly Zoom

*The Vertigo effect · 1958 — · Cinematic & Film Language*

Reference film: `videos/dollyzoom.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Dolly Zoom** (The Vertigo effect, 1958 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A dolly zoom moves the camera toward or away from the subject while the zoom lens changes focal length the opposite way, so the subject holds its size while everything behind it stretches away or flattens and looms. Camera operator Irmin Roberts devised it for Alfred Hitchcock’s Vertigo (1958) to put the hero’s fear of heights on screen; Steven Spielberg turned it on Chief Brody at the beach in Jaws (1975), and Martin Scorsese used it slowly through the diner scene of Goodfellas (1990).
- Study these reference works: Vertigo (Alfred Hitchcock, 1958; effect devised by Irmin Roberts) · Jaws (Steven Spielberg, 1975) · Goodfellas (Martin Scorsese, 1990) · La Haine (Mathieu Kassovitz, 1995) · The Lord of the Rings: The Fellowship of the Ring (Peter Jackson, 2001)
- Motion DNA: Two motions that cancel on the subject and nowhere else: the camera tracks while the zoom runs the other way at a rate tied to distance, so he never changes size while the background breathes. First a slow track-out and zoom-in that compresses the corridor, a held beat, then a fast reverse that stretches it into a tunnel.
- Visual DNA: A symmetrical hotel corridor in deep green with cream mouldings, a red runner with gold diamonds, rows of doors and sconces, pools of lamplight and a window of green neon at the far end; a man in a grey suit dead centre; viewfinder corner marks, mono lens readouts and a plan view of track and lens wedge.
- Signature transitions: Hold, compress, hold, stretch; the title settles on the stretched frame
- Key techniques: Focal length ∝ distance, locked, True-perspective corridor, Lens HUD with plan view

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Focal length ∝ distance, locked, True-perspective corridor, Lens HUD with plan view).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Focal length ∝ distance, locked and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DOLLY ZOOM", held for about 1 s.

BUILD RULES
- Suggested tools: Camera dolly on track plus a zoom lens pulled in sync, Pinhole projection in Canvas 2D: focal length and distance driven together (f / d constant), Screen-space lighting gradients sampled from depth. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural homage.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Dolly Zoom motion-graphics film (The Vertigo effect). Visual style: a symmetrical hotel corridor in deep green with cream mouldings, a red runner with gold diamonds, rows of doors and sconces, pools of lamplight and a window of green neon at the far end; a man in a grey suit dead centre; viewfinder corner marks, mono lens readouts and a plan view of track and lens wedge. Motion: two motions that cancel on the subject and nowhere else: the camera tracks while the zoom runs the other way at a rate tied to distance, so he never changes size while the background breathes. First a slow track-out and zoom-in that compresses the corridor, a held beat, then a fast reverse that stretches it into a tunnel. Signature moves: focal length ∝ distance, locked, true-perspective corridor, lens hud with plan view; transitions: hold, compress, hold, stretch; the title settles on the stretched frame. In the tradition of Vertigo (Alfred Hitchcock, 1958; effect devised by Irmin Roberts) · Jaws (Steven Spielberg, 1975) · Goodfellas (Martin Scorsese, 1990) · La Haine (Mathieu Kassovitz, 1995) · The Lord of the Rings: The Fellowship of the Ring (Peter Jackson, 2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DOLLY ZOOM". Punchy sound design synced to every cut.
```
