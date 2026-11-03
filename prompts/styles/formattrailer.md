# Trailer

*Three acts, accelerating cuts, title, date · 1910s — · Narrative Formats*

Reference film: `videos/formattrailer.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Trailer** (Three acts, accelerating cuts, title, date, 1910s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The first film trailers were shown after the feature — hence the name — in American cinemas in the 1910s; for decades the National Screen Service produced most of them for the studios. The modern grammar arrived from the 1980s: Don LaFontaine’s ‘In a world…’ voice-over, montage cut to the music, and in the 2010s the Inception-style braam and the drop to silence before the title, followed by the release date and often a last gag shot, the button.
- Study these reference works: Alien (teaser, 1979) · Inception (trailer, 2010) · The Social Network (trailer, 2010)
- Motion DNA: A one-second studio ident; Act I in long shots under quiet piano with white-on-black setup cards; the braam on ONE SHAPE at 3.5 s; Act II and III cut shorter and shorter — from one cut a second to about twelve — over a riser and hits on every cut; a 0.4 s drop to silence; the title slam at 7.2 s; COMING SOON with the date at 8.6 s and a final button gag.
- Visual DNA: Scope letterbox, teal-and-orange grade: the orange Token alone under a warm spot on a dark teal floor, rolling, spinning, falling, facing a blue cube; anamorphic streaks and white flashes in the montage; wide-tracked cream cards on black; MOTION as a cream title. Cut ticks above the strip, a cuts-per-second readout.
- Signature transitions: Hard cuts throughout, white flash frames, cut to black for the drop
- Key techniques: Three-act structure: setup, stakes, montage, Cutting rate rising to the music, Braam, drop to silence, title, date button

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Three-act structure: setup, stakes, montage, Cutting rate rising to the music, Braam, drop to silence, title, date button).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Three-act structure: setup, stakes, montage and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TRAILER", held for about 1 s.

BUILD RULES
- Suggested tools: Avid / Premiere edit cut to a trailer cue (risers, braams, hits), Cards and title from After Effects, Canvas 2D: a shot list of procedural shots, cut rate computed from it. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Trailer motion-graphics film (Three acts, accelerating cuts, title, date). Visual style: scope letterbox, teal-and-orange grade: the orange Token alone under a warm spot on a dark teal floor, rolling, spinning, falling, facing a blue cube; anamorphic streaks and white flashes in the montage; wide-tracked cream cards on black; MOTION as a cream title. Cut ticks above the strip, a cuts-per-second readout. Motion: a one-second studio ident; Act I in long shots under quiet piano with white-on-black setup cards; the braam on ONE SHAPE at 3.5 s; Act II and III cut shorter and shorter — from one cut a second to about twelve — over a riser and hits on every cut; a 0.4 s drop to silence; the title slam at 7.2 s; COMING SOON with the date at 8.6 s and a final button gag. Signature moves: three-act structure: setup, stakes, montage, cutting rate rising to the music, braam, drop to silence, title, date button; transitions: hard cuts throughout, white flash frames, cut to black for the drop. In the tradition of Alien (teaser, 1979) · Inception (trailer, 2010) · The Social Network (trailer, 2010). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TRAILER". Punchy sound design synced to every cut.
```
