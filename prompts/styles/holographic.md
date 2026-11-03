# Holographic

*Thin-film Foil and Liquid Chrome · 2016 — 2020 · 3D & CGI Motion*

Reference film: `videos/holographic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Holographic** (Thin-film Foil and Liquid Chrome, 2016 — 2020; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A late-2010s look in which every surface seems coated in oil-slick foil: thin-film interference colour that shifts with the viewing angle, liquid chrome blobs, prismatic light and inflated blobby 3D type, rendered in Cinema 4D with Octane or Redshift and spread across album art, fashion, packaging and brand identities. It borrowed holographic stickers, trading-card foil and mirror-polished sculpture and fed straight into the Y2K-revival and "acid graphics" moods of the early 2020s.
- Study these reference works: Newton’s rings (Isaac Newton, Opticks, 1704) · Balloon Dog (Jeff Koons, 1994–2000) · Cloud Gate (Anish Kapoor, Chicago, 2004–06) · Pokémon Trading Card Game holo cards (Wizards of the Coast, 1999)
- Motion DNA: Slow, sensual and liquid: the foil tilts and the colours slide across it before anything moves, chrome swells, stretches, pinches into beads and re-merges with springy overshoot, the blobs pour into type, and light sweeps travel across every surface on long eases while stickers slap down with a snap.
- Visual DNA: Pastel thin-film rainbows (pink, mint, lilac, butter yellow) on crumpled foil and soft gradients; mirror chrome with hard studio horizons and white softbox highlights tinted by iridescence; fat rounded type inflated like a balloon; die-cut holographic stickers with white borders; spectral prism fans.
- Signature transitions: Foil hero tilt → creases relax into gradient → drop rises and splits → beads morph into type → prism sweep + sticker slaps → title
- Key techniques: Thin-film colour from normal · view, Metaball liquid morphing to type, Inflated text height field

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Thin-film colour from normal · view, Metaball liquid morphing to type, Inflated text height field).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Thin-film colour from normal · view and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "HOLOGRAPHIC", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D + Octane / Redshift thin-film shaders, Blender Cycles thin-film / iridescence nodes, Photoshop gradient maps and foil textures, Canvas 2D: per-pixel metaball + inflated-text height field (768×432, upscaled), thin-film interference per channel from the normal and view vector. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Holographic motion-graphics film (Thin-film Foil and Liquid Chrome). Visual style: pastel thin-film rainbows (pink, mint, lilac, butter yellow) on crumpled foil and soft gradients; mirror chrome with hard studio horizons and white softbox highlights tinted by iridescence; fat rounded type inflated like a balloon; die-cut holographic stickers with white borders; spectral prism fans. Motion: slow, sensual and liquid: the foil tilts and the colours slide across it before anything moves, chrome swells, stretches, pinches into beads and re-merges with springy overshoot, the blobs pour into type, and light sweeps travel across every surface on long eases while stickers slap down with a snap. Signature moves: thin-film colour from normal · view, metaball liquid morphing to type, inflated text height field; transitions: foil hero tilt → creases relax into gradient → drop rises and splits → beads morph into type → prism sweep + sticker slaps → title. In the tradition of Newton’s rings (Isaac Newton, Opticks, 1704) · Balloon Dog (Jeff Koons, 1994–2000) · Cloud Gate (Anish Kapoor, Chicago, 2004–06) · Pokémon Trading Card Game holo cards (Wizards of the Coast, 1999). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "HOLOGRAPHIC". Punchy sound design synced to every cut.
```
