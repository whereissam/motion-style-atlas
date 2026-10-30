# Smear

*Two drawings that fill the gap · 1930s — · Technique Atlas*

Reference film: `videos/techsmear.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Smear** (Two drawings that fill the gap, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Hand-drawn animation samples motion at 12 or 24 drawings a second, so a fast move can jump too far between frames and strobe. Animators bridge the gap with one or two smear drawings — the character stretched, multiplied or streaked along its path — that the eye reads as speed; Chuck Jones’s The Dover Boys (1942) made them famous, and Spider-Man: Into the Spider-Verse (2018) brought drawn smears and multiples into CG.
- Study these reference works: The Dover Boys at Pimento University (Chuck Jones, Warner Bros., 1942) · Looney Tunes and Merrie Melodies shorts (Warner Bros., 1940s–50s) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018)
- Motion DNA: Long clean holds broken by moves that take four drawings on twos: two smears that span the gap, a squashed landing, the clean pose. Three moves on the downbeats, each with a different smear; then a replay at one drawing per beat (1/7.5 speed) steps through all nine smear and landing drawings over onion-skin ghosts, and time snaps back for the word to smear in.
- Visual DNA: The Technique Atlas stage with its floor line; the orange Token sliding along it, a stretched contact shadow under each smear; a tapering orange wedge with ink speed lines, overlapping copies fading from light to full orange, and dry-brush streaks; dashed ghost outlines, a dotted path and a drawing strip with frame numbers during the replay.
- Signature transitions: Smear drawings across fast moves; a rewind cut into a stepped replay and back
- Key techniques: Smears on twos, Stretch · multiples · dry brush, Frame-by-frame replay

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Smears on twos, Stretch · multiples · dry brush, Frame-by-frame replay).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Smears on twos and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SMEAR", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-drawn smear frames (2D animation), Blender / Maya smear rigs and Grease Pencil, Canvas 2D: motion quantised to 15 drawings per second. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Smear motion-graphics film (Two drawings that fill the gap). Visual style: the Technique Atlas stage with its floor line; the orange Token sliding along it, a stretched contact shadow under each smear; a tapering orange wedge with ink speed lines, overlapping copies fading from light to full orange, and dry-brush streaks; dashed ghost outlines, a dotted path and a drawing strip with frame numbers during the replay. Motion: long clean holds broken by moves that take four drawings on twos: two smears that span the gap, a squashed landing, the clean pose. Three moves on the downbeats, each with a different smear; then a replay at one drawing per beat (1/7.5 speed) steps through all nine smear and landing drawings over onion-skin ghosts, and time snaps back for the word to smear in. Signature moves: smears on twos, stretch · multiples · dry brush, frame-by-frame replay; transitions: smear drawings across fast moves; a rewind cut into a stepped replay and back. In the tradition of The Dover Boys at Pimento University (Chuck Jones, Warner Bros., 1942) · Looney Tunes and Merrie Melodies shorts (Warner Bros., 1940s–50s) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SMEAR". Punchy sound design synced to every cut.
```
