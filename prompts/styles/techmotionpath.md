# Motion Path

*Where on a bezier, when on a speed graph · 1970s — · Technique Atlas*

Reference film: `videos/techmotionpath.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Motion Path** (Where on a bezier, when on a speed graph, 1970s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Keyframe interpolation along curved paths was worked out in early computer animation research; Kochanek and Bartels’ tension-continuity-bias splines (SIGGRAPH 1984) gave animators control over the shape of the path through each key. After Effects (1993) made the split explicit for motion designers: a layer’s position keys carry spatial bezier handles that shape the motion path in the comp, and separate temporal ease, edited in the speed graph, that decides how fast the layer travels along it; Auto-Orient turns the layer to the path tangent.
- Study these reference works: Kochanek & Bartels, “Interpolating Splines with Local Tension, Continuity, and Bias Control” (SIGGRAPH, 1984) · Adobe After Effects motion paths, speed graph and Auto-Orient (1993 —) · Adobe Flash motion guides (1997 —)
- Motion DNA: Keys pop on one per beat, the polyline relaxes into a curve as the handles pull out, then the Token runs the path three times: upright at constant speed, turned to the tangent at constant speed, and finally eased, starting slow, rushing through the middle and settling, beside a linear ghost on the same path.
- Visual DNA: The Technique Atlas stage with an ink bezier path, orange key points, handle bars with round ends, spacing dots that reveal speed, a tangent arrow; a boxed speed graph top right with keyframe diamonds and easy-ease hourglasses on a mini timeline.
- Signature transitions: Build the path, then three passes separated by a fade back to the first key
- Key techniques: Spatial bezier handles, Arc-length parameterisation, Auto-orient to tangent

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Spatial bezier handles, Arc-length parameterisation, Auto-orient to tangent).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Spatial bezier handles and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MOTION PATH", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects position keyframes with spatial bezier handles, Auto-Orient and the speed graph, Arc-length lookup table so equal time steps give equal distance, Canvas 2D: cubic bezier segments, binary-searched distance table, tangent from neighbouring samples. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Motion Path motion-graphics film (Where on a bezier, when on a speed graph). Visual style: the Technique Atlas stage with an ink bezier path, orange key points, handle bars with round ends, spacing dots that reveal speed, a tangent arrow; a boxed speed graph top right with keyframe diamonds and easy-ease hourglasses on a mini timeline. Motion: keys pop on one per beat, the polyline relaxes into a curve as the handles pull out, then the Token runs the path three times: upright at constant speed, turned to the tangent at constant speed, and finally eased, starting slow, rushing through the middle and settling, beside a linear ghost on the same path. Signature moves: spatial bezier handles, arc-length parameterisation, auto-orient to tangent; transitions: build the path, then three passes separated by a fade back to the first key. In the tradition of Kochanek & Bartels, “Interpolating Splines with Local Tension, Continuity, and Bias Control” (SIGGRAPH, 1984) · Adobe After Effects motion paths, speed graph and Auto-Orient (1993 —) · Adobe Flash motion guides (1997 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MOTION PATH". Punchy sound design synced to every cut.
```
