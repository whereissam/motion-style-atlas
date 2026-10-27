# Webcore / Web 1.0

*Early-internet Maximalism · 1994 — 2009 · Digital, Internet & Screen*

Reference film: `videos/webcore.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Webcore / Web 1.0** (Early-internet Maximalism, 1994 — 2009; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The hand-coded personal homepage of the early web: GeoCities (1994–2009), Angelfire and Tripod gave anyone free space, and amateurs filled it with tiled backgrounds, animated GIFs, MIDI files and blink/marquee tags; Olia Lialina and Dragan Espenschied later archived it as folk art.
- Study these reference works: GeoCities neighbourhoods (1994–2009) · Space Jam official site (1996) · Olia Lialina & Dragan Espenschied — One Terabyte of Kilobyte Age (2013–) · Internet Archive GifCities (2016) · Netscape Navigator 3 blink & marquee tags
- Motion DNA: Everything loops at once at GIF frame-rates: blinking, spinning, scrolling, counting, until pop-ups multiply into overload and collapse into one shouting lockup.
- Visual DNA: Black starfields and tiled textures, saturated rainbow WordArt with 3D extrusion, Times and Comic Sans, bevelled grey browser chrome and dial-up era status bars.
- Signature transitions: Dial-up connect, interlaced GIF load, stepped wheel scroll, pop-up multiplication, window implosion, white flash, starfield warp
- Key techniques: Tiled starfield & swirl backgrounds, Animated GIFs: NEW!, @, construction, Marquee, hit counter, pop-up cascade

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Tiled starfield & swirl backgrounds, Animated GIFs: NEW!, @, construction, Marquee, hit counter, pop-up cascade).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Tiled starfield & swirl backgrounds and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "WEBCORE / WEB 1.0", held for about 1 s.

BUILD RULES
- Suggested tools: HTML 3.2, Animated GIF, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Webcore / Web 1.0 motion-graphics film (Early-internet Maximalism). Visual style: black starfields and tiled textures, saturated rainbow WordArt with 3D extrusion, Times and Comic Sans, bevelled grey browser chrome and dial-up era status bars. Motion: everything loops at once at GIF frame-rates: blinking, spinning, scrolling, counting, until pop-ups multiply into overload and collapse into one shouting lockup. Signature moves: tiled starfield & swirl backgrounds, animated gifs: new!, @, construction, marquee, hit counter, pop-up cascade; transitions: dial-up connect, interlaced GIF load, stepped wheel scroll, pop-up multiplication, window implosion, white flash, starfield warp. In the tradition of GeoCities neighbourhoods (1994–2009) · Space Jam official site (1996) · Olia Lialina & Dragan Espenschied — One Terabyte of Kilobyte Age (2013–) · Internet Archive GifCities (2016) · Netscape Navigator 3 blink & marquee tags. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "WEBCORE / WEB 1.0". Punchy sound design synced to every cut.
```
