# Silhouette Animation

*Paper-cut Shadow Puppetry · 1919 — · 2D Animation & Illustration*

Reference film: `videos/silhouette.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Silhouette Animation** (Paper-cut Shadow Puppetry, 1919 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Jointed figures cut from black card and lead are laid on a lit glass table and moved a fraction per frame, so the picture is pure silhouette against tinted light. Lotte Reiniger perfected it in The Adventures of Prince Achmed, the oldest surviving animated feature.
- Study these reference works: The Adventures of Prince Achmed (Lotte Reiniger, 1926) · Papageno (Reiniger, 1935) · Hansel and Gretel (Reiniger, 1955) · Princes et Princesses (Michel Ocelot, 2000) · Tales of the Night (Ocelot, 2011)
- Motion DNA: Stepped stop-motion of jointed card puppets: limbs pivot on hidden hinges, walk cycles click from pose to pose, wings flap in rigid sections.
- Visual DNA: Pure black filigree silhouettes, intricate as lace, against luminous gradients tinted amber, teal and rose like nitrate-era prints.
- Signature transitions: Tint change, vertical pan, dip to black, intertitle
- Key techniques: Hinged card puppets on twos, Tinted backlit glass, Lace cut-outs & filigree

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hinged card puppets on twos, Tinted backlit glass, Lace cut-outs & filigree).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hinged card puppets on twos and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SILHOUETTE ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Multiplane light table, Dragonframe, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs hand-cut puppets (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Silhouette Animation motion-graphics film (Paper-cut Shadow Puppetry). Visual style: pure black filigree silhouettes, intricate as lace, against luminous gradients tinted amber, teal and rose like nitrate-era prints. Motion: stepped stop-motion of jointed card puppets: limbs pivot on hidden hinges, walk cycles click from pose to pose, wings flap in rigid sections. Signature moves: hinged card puppets on twos, tinted backlit glass, lace cut-outs & filigree; transitions: tint change, vertical pan, dip to black, intertitle. In the tradition of The Adventures of Prince Achmed (Lotte Reiniger, 1926) · Papageno (Reiniger, 1935) · Hansel and Gretel (Reiniger, 1955) · Princes et Princesses (Michel Ocelot, 2000) · Tales of the Night (Ocelot, 2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SILHOUETTE ANIMATION". Punchy sound design synced to every cut.
```
