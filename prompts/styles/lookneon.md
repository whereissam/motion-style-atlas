# Neon Night

*Coloured practical lights, a wet floor, inverse-square spill · 1910s — (on screen from the 1980s) · Rendering Looks*

Reference film: `videos/lookneon.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Neon Night** (Coloured practical lights, a wet floor, inverse-square spill, 1910s — (on screen from the 1980s); family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Georges Claude showed the first neon tube lights in Paris in 1910, and neon signs spread through American cities in the 1920s and 1930s. The night street lit only by coloured practicals, with the light pooling and smearing on wet tarmac, became a cinematic look through films such as Blade Runner (Ridley Scott, cinematography Jordan Cronenweth, 1982), and later the neon-noir of Wong Kar-wai with Christopher Doyle and Nicolas Winding Refn’s Drive (2011). In rendering, a neon tube is a line or tube area light: shading from linear light sources was treated by Tomoyuki Nishita, Isao Okamura and Eihachiro Nakamae in 1985, and real-time engines adopted the “representative point” trick for their specular, described by Brian Karis for Unreal Engine 4 in 2013.
- Study these reference works: Blade Runner (Ridley Scott, cinematography Jordan Cronenweth, 1982) · Fallen Angels (Wong Kar-wai, cinematography Christopher Doyle, 1995) · Drive (Nicolas Winding Refn, cinematography Newton Thomas Sigel, 2011)
- Motion DNA: The shared camera orbit carries the tubes’ reflections across the wet floor and the highlights round the sphere. A wipe opens the night against the plain day reference while the tubes stutter on one by one; callouts name the spill, the line light and the wet reflection; from beat 7 each tube plays solo for a beat (pink, cyan, amber), so its own colour spill and falloff read alone, then all three return.
- Visual DNA: Near-black night, three glowing tubes — hot pink, cyan, amber — with soft halos; the white sphere goes magenta with a cyan rim, the orange Token turns hot red under the pink underlight, the blue cube’s front glows gold from the amber tube; dark asphalt with mirror puddles and long vertical streaks of reflected neon. Paper-coloured mono labels on dark halos, a light-only pass inset, a falloff plot with each object’s distance to its tube, and a three-channel tube mixer.
- Signature transitions: Wipe from plain day to the neon night; tubes stutter on; tube solos on the beat
- Key techniques: Analytic line lights, 1/d² per element, Wet floor: traced, stretched reflection, Coloured spill, per-tube soft shadows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Analytic line lights, 1/d² per element, Wet floor: traced, stretched reflection, Coloured spill, per-tube soft shadows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Analytic line lights, 1/d² per element and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "NEON NIGHT", held for about 1 s.

BUILD RULES
- Suggested tools: Line / tube area lights with representative-point specular (Karis, 2013), Screen-space or traced wet-surface reflections stretched along the view-vertical, Canvas 2D + SDF tracer (js/look-kit.js): closed-form line-light irradiance clipped to the hemisphere, one LK.shadow per tube, one LK.trace floor reflection, analytic ray–capsule tubes with halo. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Neon Night motion-graphics film (Coloured practical lights, a wet floor, inverse-square spill). Visual style: near-black night, three glowing tubes — hot pink, cyan, amber — with soft halos; the white sphere goes magenta with a cyan rim, the orange Token turns hot red under the pink underlight, the blue cube’s front glows gold from the amber tube; dark asphalt with mirror puddles and long vertical streaks of reflected neon. Paper-coloured mono labels on dark halos, a light-only pass inset, a falloff plot with each object’s distance to its tube, and a three-channel tube mixer. Motion: the shared camera orbit carries the tubes’ reflections across the wet floor and the highlights round the sphere. A wipe opens the night against the plain day reference while the tubes stutter on one by one; callouts name the spill, the line light and the wet reflection; from beat 7 each tube plays solo for a beat (pink, cyan, amber), so its own colour spill and falloff read alone, then all three return. Signature moves: analytic line lights, 1/d² per element, wet floor: traced, stretched reflection, coloured spill, per-tube soft shadows; transitions: wipe from plain day to the neon night; tubes stutter on; tube solos on the beat. In the tradition of Blade Runner (Ridley Scott, cinematography Jordan Cronenweth, 1982) · Fallen Angels (Wong Kar-wai, cinematography Christopher Doyle, 1995) · Drive (Nicolas Winding Refn, cinematography Newton Thomas Sigel, 2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "NEON NIGHT". Punchy sound design synced to every cut.
```
