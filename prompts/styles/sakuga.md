# Anime Sakuga

*Japanese Key Animation · 1980s — · 2D Animation & Illustration*

Reference film: `videos/sakuga.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Anime Sakuga** (Japanese Key Animation, 1980s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Sakuga (作画, "drawing pictures") is what fans call the stand-out stretches of Japanese TV and film animation where a star key animator cuts loose. Yoshinori Kanada's angular effects and contorted poses defined it in the 1980s, Akira raised the ceiling, and animators such as Yutaka Nakamura carried it into modern action anime.
- Study these reference works: Galaxy Express 999 (Kanada effects, 1979) · Harmagedon (Kanada, 1983) · Akira (Katsuhiro Otomo, 1988) · Cowboy Bebop: The Movie (Yutaka Nakamura, 2001) · Mob Psycho 100 (Bones, 2016)
- Motion DNA: Limited animation on 2s and 3s: a long hold, then an explosive smear, impact frames that flip polarity for single frames, and shake that decays on the ones.
- Visual DNA: Two-tone cel shading with hard shadow shapes, backlit rim-light silhouettes, focus lines and angular Kanada flames with geometric light shards.
- Signature transitions: Smash cut, impact frame, screen split, white flash
- Key techniques: Holds then smears, Impact frames & inversion, Kanada perspective & angular FX

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Holds then smears, Impact frames & inversion, Kanada perspective & angular FX).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Holds then smears and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ANIME SAKUGA", held for about 1 s.

BUILD RULES
- Suggested tools: Paper key animation, CLIP STUDIO / OpenToonz, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs a key animator (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Anime Sakuga motion-graphics film (Japanese Key Animation). Visual style: two-tone cel shading with hard shadow shapes, backlit rim-light silhouettes, focus lines and angular Kanada flames with geometric light shards. Motion: limited animation on 2s and 3s: a long hold, then an explosive smear, impact frames that flip polarity for single frames, and shake that decays on the ones. Signature moves: holds then smears, impact frames & inversion, kanada perspective & angular fx; transitions: smash cut, impact frame, screen split, white flash. In the tradition of Galaxy Express 999 (Kanada effects, 1979) · Harmagedon (Kanada, 1983) · Akira (Katsuhiro Otomo, 1988) · Cowboy Bebop: The Movie (Yutaka Nakamura, 2001) · Mob Psycho 100 (Bones, 2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ANIME SAKUGA". Punchy sound design synced to every cut.
```
