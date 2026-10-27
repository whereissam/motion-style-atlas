# Luxury Brand Motion

*Maison Films · 1970s — · Social & Commercial*

Reference film: `videos/luxury.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Luxury Brand Motion** (Maison Films, 1970s —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Perfume, watch and fashion houses turned the television spot into a short film: Chanel N°5 commercials by Ridley Scott and later Luc Besson, Cartier’s "L’Odyssée" and the Hermès and Rolex idents set the grammar of slow macro product light, precious materials, silence and a single high-contrast serif wordmark.
- Study these reference works: Chanel N°5 “Share the Fantasy” (Ridley Scott, 1979) · Chanel N°5 “Le Loup” (Luc Besson, 1998) · Cartier “L’Odyssée de Cartier” (Bruno Aveillan, 2012) · Dior J’adore films · Rolex “Perpetual” brand films · Hermès brand films and idents
- Motion DNA: Everything is slow and precise: a pour in slow motion, light gliding across facets, a raking light turning over an embossed monogram, letters resolving out of blur while their tracking tightens; every move eases in and out.
- Visual DNA: Warm black, champagne gold and ivory; macro surfaces of liquid metal, silk and cut crystal; generous negative space; a thin, wide-tracked Didone wordmark with an italic tagline.
- Signature transitions: Slow dissolves, dip to black, light leaving the frame, letters resolving from blur.
- Key techniques: Per-pixel liquid-gold surface: radial ripples reflecting a softbox, Procedural silk height field with anisotropic sheen, Faceted crystal: per-facet normals lit by a gliding light, Blind emboss from offset blurred masks under raking light

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Per-pixel liquid-gold surface: radial ripples reflecting a softbox, Procedural silk height field with anisotropic sheen, Faceted crystal: per-facet normals lit by a gliding light, Blind emboss from offset blurred masks under raking light).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Per-pixel liquid-gold surface: radial ripples reflecting a softbox and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LUXURY BRAND MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Live action macro, Houdini FLIP, Cinema 4D + Redshift, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs 3D or live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Luxury Brand Motion motion-graphics film (Maison Films). Visual style: warm black, champagne gold and ivory; macro surfaces of liquid metal, silk and cut crystal; generous negative space; a thin, wide-tracked Didone wordmark with an italic tagline. Motion: everything is slow and precise: a pour in slow motion, light gliding across facets, a raking light turning over an embossed monogram, letters resolving out of blur while their tracking tightens; every move eases in and out. Signature moves: per-pixel liquid-gold surface: radial ripples reflecting a softbox, procedural silk height field with anisotropic sheen, faceted crystal: per-facet normals lit by a gliding light, blind emboss from offset blurred masks under raking light; transitions: slow dissolves, dip to black, light leaving the frame, letters resolving from blur. In the tradition of Chanel N°5 “Share the Fantasy” (Ridley Scott, 1979) · Chanel N°5 “Le Loup” (Luc Besson, 1998) · Cartier “L’Odyssée de Cartier” (Bruno Aveillan, 2012) · Dior J’adore films · Rolex “Perpetual” brand films · Hermès brand films and idents. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LUXURY BRAND MOTION". Punchy sound design synced to every cut.
```
