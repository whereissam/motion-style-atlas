# Puppet Animation

*Stop-motion puppets on a miniature set · 1910s — · Analog, Physical & Stop Motion*

Reference film: `videos/puppet.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Puppet Animation** (Stop-motion puppets on a miniature set, 1910s —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Puppet animation poses jointed figures on a miniature set and shoots them one frame at a time, so a body built of wood, wire, felt and silicone appears to live. Władysław Starewicz pioneered it in the 1910s, Jiří Trnka made Czech puppet film an art form from the late 1940s with carved wooden figures whose fixed faces act through light and posture, and studios such as Laika and Wes Anderson's crews later combined steel ball-and-socket armatures, furred and knitted costumes and libraries of replacement faces.
- Study these reference works: Władysław Starewicz — The Cameraman's Revenge (1912) · Jiří Trnka — The Emperor's Nightingale (1949), A Midsummer Night's Dream (1959), The Hand (1965) · Henry Selick / Laika — Coraline (2009) · Wes Anderson — Fantastic Mr. Fox (2009) · Laika — Kubo and the Two Strings (2016)
- Motion DNA: Everything moves in held steps at 12 frames a second: a walk clicks from pose to pose, the head snaps between angles, mouths and eyelids swap whole pieces from a tray, fur and felt boil slightly where hands touched them, a hop is held up by a rig arm, and the key light flickers by a percent from frame to frame.
- Visual DNA: A planimetric, symmetrical tabletop set in autumn oranges and mustards — painted dusk backdrop, cardboard hills, pompom felt trees on dowels, a balsa house with a lit window, a sand lane on green flock — and a felt fox puppet in a knitted jumper, scarf and corduroys with glass-bead eyes, then its steel armature in an x-ray pass.
- Signature transitions: Slate clap, stepped walk-in, head turn, mouth-tray insert, x-ray wipe to the armature, rig-arm hop, pull back to the set edge and studio
- Key techniques: 12 fps stepped posing, Replacement mouths & eyelids, Ball-and-socket armature

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (12 fps stepped posing, Replacement mouths & eyelids, Ball-and-socket armature).
- 5.0–8.0 s  Climax: the most spectacular moment, built on 12 fps stepped posing and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PUPPET ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Dragonframe stop-motion capture, Ball-and-socket armatures, 3D-printed replacement faces, Nuke rig removal, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs a built puppet and set (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Puppet Animation motion-graphics film (Stop-motion puppets on a miniature set). Visual style: a planimetric, symmetrical tabletop set in autumn oranges and mustards — painted dusk backdrop, cardboard hills, pompom felt trees on dowels, a balsa house with a lit window, a sand lane on green flock — and a felt fox puppet in a knitted jumper, scarf and corduroys with glass-bead eyes, then its steel armature in an x-ray pass. Motion: everything moves in held steps at 12 frames a second: a walk clicks from pose to pose, the head snaps between angles, mouths and eyelids swap whole pieces from a tray, fur and felt boil slightly where hands touched them, a hop is held up by a rig arm, and the key light flickers by a percent from frame to frame. Signature moves: 12 fps stepped posing, replacement mouths & eyelids, ball-and-socket armature; transitions: slate clap, stepped walk-in, head turn, mouth-tray insert, x-ray wipe to the armature, rig-arm hop, pull back to the set edge and studio. In the tradition of Władysław Starewicz — The Cameraman's Revenge (1912) · Jiří Trnka — The Emperor's Nightingale (1949), A Midsummer Night's Dream (1959), The Hand (1965) · Henry Selick / Laika — Coraline (2009) · Wes Anderson — Fantastic Mr. Fox (2009) · Laika — Kubo and the Two Strings (2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PUPPET ANIMATION". Punchy sound design synced to every cut.
```
