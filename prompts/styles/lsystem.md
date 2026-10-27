# L-systems

*Algorithmic Botany · 1968 — · Experimental & Generative*

Reference film: `videos/lsystem.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **L-systems** (Algorithmic Botany, 1968 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The biologist Aristid Lindenmayer introduced parallel string-rewriting systems in 1968 to model the growth of algae; read by a turtle that draws, turns and branches, they became the grammar of computer-generated plants in Prusinkiewicz and Lindenmayer's "The Algorithmic Beauty of Plants" (1990).
- Study these reference works: A. Lindenmayer, Mathematical Models for Cellular Interaction in Development (J. Theor. Biology, 1968) · P. Prusinkiewicz & A. Lindenmayer, The Algorithmic Beauty of Plants (1990) · Alvy Ray Smith, Plants, Fractals and Formal Languages (SIGGRAPH 1984) · SpeedTree (IDV) · Houdini L-system SOP
- Motion DNA: Growth happens in generations: every bud rewrites at once, so new branches sprout simultaneously across the whole plant while older limbs thicken, sway and burst into leaf and blossom.
- Visual DNA: A botanical plate on warm laid paper: sepia ink branches with pipe-model taper, watercolour leaves and blossoms, a gilt dragon curve, and red-rubric figure captions with the rewriting rules set in mono.
- Signature transitions: Generation steps, camera pans across the plate, blossom pops, paper-fold unfolding, pull-back to a full garden
- Key techniques: Parallel string rewriting (OL-systems), Turtle interpretation with a branch stack, Generation-tagged growth + wind sway

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Parallel string rewriting (OL-systems), Turtle interpretation with a branch stack, Generation-tagged growth + wind sway).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Parallel string rewriting (OL-systems) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "L-SYSTEMS", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, Houdini, Processing, SpeedTree. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second L-systems motion-graphics film (Algorithmic Botany). Visual style: a botanical plate on warm laid paper: sepia ink branches with pipe-model taper, watercolour leaves and blossoms, a gilt dragon curve, and red-rubric figure captions with the rewriting rules set in mono. Motion: growth happens in generations: every bud rewrites at once, so new branches sprout simultaneously across the whole plant while older limbs thicken, sway and burst into leaf and blossom. Signature moves: parallel string rewriting (ol-systems), turtle interpretation with a branch stack, generation-tagged growth + wind sway; transitions: generation steps, camera pans across the plate, blossom pops, paper-fold unfolding, pull-back to a full garden. In the tradition of A. Lindenmayer, Mathematical Models for Cellular Interaction in Development (J. Theor. Biology, 1968) · P. Prusinkiewicz & A. Lindenmayer, The Algorithmic Beauty of Plants (1990) · Alvy Ray Smith, Plants, Fractals and Formal Languages (SIGGRAPH 1984) · SpeedTree (IDV) · Houdini L-system SOP. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "L-SYSTEMS". Punchy sound design synced to every cut.
```
