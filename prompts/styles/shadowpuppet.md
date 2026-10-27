# Shadow Puppetry

*Piying 皮影戏 · Han dynasty — · Cultural & Regional*

Reference film: `videos/shadowpuppet.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Shadow Puppetry** (Piying 皮影戏, Han dynasty —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Chinese shadow play presses jointed puppets of scraped, dyed and hollow-carved donkey or cow hide against a backlit cloth screen, worked on rods while a band of suona, banhu, gongs and cymbals plays. Shaanxi and Tangshan are its best-known schools, and it was inscribed on UNESCO’s Intangible Cultural Heritage list in 2011.
- Study these reference works: To Live (Zhang Yimou, 1994) · The Pig Eats Watermelon (Wan Guchan, 1958) · Huaxian Shadow Play troupes, Shaanxi · Tangshan shadow play · UNESCO Intangible Cultural Heritage (2011)
- Motion DNA: Stiff jointed limbs that swing like pendulums from three rods, a body that glides on the main rod, and sudden flourishes such as the somersault and the frozen pose on a gong crash.
- Visual DNA: Profile figures in translucent red, green and yellow hide carved into lace, glowing through a warm lamp-lit cloth with a soft halo where they touch it and blurred rods below.
- Signature transitions: Blur-to-sharp press onto the screen, lift-off into soft shadow, lamp flare, gong-crash freeze
- Key techniques: Translucent dyed hide, Hollow-carved patterns, Rod-driven joints on a lamp-lit screen

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Translucent dyed hide, Hollow-carved patterns, Rod-driven joints on a lamp-lit screen).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Translucent dyed hide and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SHADOW PUPPETRY", held for about 1 s.

BUILD RULES
- Suggested tools: Physical puppets + lamp, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Shadow Puppetry motion-graphics film (Piying 皮影戏). Visual style: profile figures in translucent red, green and yellow hide carved into lace, glowing through a warm lamp-lit cloth with a soft halo where they touch it and blurred rods below. Motion: stiff jointed limbs that swing like pendulums from three rods, a body that glides on the main rod, and sudden flourishes such as the somersault and the frozen pose on a gong crash. Signature moves: translucent dyed hide, hollow-carved patterns, rod-driven joints on a lamp-lit screen; transitions: blur-to-sharp press onto the screen, lift-off into soft shadow, lamp flare, gong-crash freeze. In the tradition of To Live (Zhang Yimou, 1994) · The Pig Eats Watermelon (Wan Guchan, 1958) · Huaxian Shadow Play troupes, Shaanxi · Tangshan shadow play · UNESCO Intangible Cultural Heritage (2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SHADOW PUPPETRY". Punchy sound design synced to every cut.
```
