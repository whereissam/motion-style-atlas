# L-System

*Rewrite a string, then let a turtle draw it · 1968 — · Technique Atlas*

Reference film: `videos/techlsystem.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **L-System** (Rewrite a string, then let a turtle draw it, 1968 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The biologist Aristid Lindenmayer introduced L-systems in 1968 to describe how cells of simple organisms divide: every symbol of a string is rewritten at once by its rule. Alvy Ray Smith drew plants from them in Plants, Fractals, and Formal Languages (SIGGRAPH 1984), and Przemysław Prusinkiewicz gave them the turtle interpretation — F forward, + and − turn, brackets push and pop a branch — used ever since, collected with Lindenmayer in The Algorithmic Beauty of Plants (1990). Procedural tools such as Houdini’s L-system node grow trees, ivy and growth animations the same way.
- Study these reference works: Plants, Fractals, and Formal Languages (Alvy Ray Smith, SIGGRAPH 1984) · The Algorithmic Beauty of Plants (Przemysław Prusinkiewicz & Aristid Lindenmayer, Springer, 1990) · L-System node in Houdini (SideFX)
- Motion DNA: Growth by generations on the downbeat: each new string is read left to right by a turtle whose path appears as it goes, so the stem climbs first and every branch flicks out in reading order; the previous generation stays underneath as a ghost the new one traces over. After the fifth generation the branching angle snaps on three beats — narrower, wider, back — and the whole plant re-folds at once, buds and all.
- Visual DNA: The Technique Atlas stage; ink stems thinning with branch depth, small orange Tokens as buds at every X and a few larger accent Tokens as flowers; left, the axiom, the two rules and the angle in mono type, a table of generations with string lengths, and a read-head window that highlights the symbol the turtle is on.
- Signature transitions: Each generation grows over the ghost of the last; the angle re-sets with a springy overshoot
- Key techniques: Parallel rewriting: X → F+[[X]-X]-F[-FX]+X, F → FF, Turtle: F draw, ± turn δ, [ ] push / pop, Step halves each generation so the skeleton is kept

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Parallel rewriting: X → F+[[X]-X]-F[-FX]+X, F → FF, Turtle: F draw, ± turn δ, [ ] push / pop, Step halves each generation so the skeleton is kept).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Parallel rewriting: X → F+[[X]-X]-F[-FX]+X, F → FF and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "L-SYSTEM", held for about 1 s.

BUILD RULES
- Suggested tools: String rewriting in setup (generations 0–5, up to several thousand symbols), Turtle interpretation every frame with a stack for [ and ], fitted to the stage, Canvas 2D: stems as strokes by depth, buds as rotated Tokens, mono string read-out. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second L-System motion-graphics film (Rewrite a string, then let a turtle draw it). Visual style: the Technique Atlas stage; ink stems thinning with branch depth, small orange Tokens as buds at every X and a few larger accent Tokens as flowers; left, the axiom, the two rules and the angle in mono type, a table of generations with string lengths, and a read-head window that highlights the symbol the turtle is on. Motion: growth by generations on the downbeat: each new string is read left to right by a turtle whose path appears as it goes, so the stem climbs first and every branch flicks out in reading order; the previous generation stays underneath as a ghost the new one traces over. After the fifth generation the branching angle snaps on three beats — narrower, wider, back — and the whole plant re-folds at once, buds and all. Signature moves: parallel rewriting: x → f+[[x]-x]-f[-fx]+x, f → ff, turtle: f draw, ± turn δ, [ ] push / pop, step halves each generation so the skeleton is kept; transitions: each generation grows over the ghost of the last; the angle re-sets with a springy overshoot. In the tradition of Plants, Fractals, and Formal Languages (Alvy Ray Smith, SIGGRAPH 1984) · The Algorithmic Beauty of Plants (Przemysław Prusinkiewicz & Aristid Lindenmayer, Springer, 1990) · L-System node in Houdini (SideFX). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "L-SYSTEM". Punchy sound design synced to every cut.
```
