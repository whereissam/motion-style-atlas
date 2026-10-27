# Podcast Visualizer

*The Audiogram Clip · 2017 — · Social & Commercial*

Reference film: `videos/podcast.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Podcast Visualizer** (The Audiogram Clip, 2017 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Audio does not autoplay in a social feed, so around 2017 podcasters began posting “audiograms”: a short clip turned into video with the cover art, an animated waveform and burned-in captions. WNYC’s open-source Audiogram tool (2016) and services such as Headliner and Wavve made the format a default promo, and word-by-word captions later spread from TikTok-era video podcasts.
- Study these reference works: WNYC Audiogram generator (open source, 2016) · Headliner audiograms (2017 —) · Wavve (2017 —) · Video-podcast clips on TikTok, Instagram Reels and YouTube Shorts (2020s)
- Motion DNA: Everything is driven by the voice: bars and avatar rings pulse per syllable, captions pop in word by word with the spoken word highlighted, and the layout snaps to whoever is talking.
- Visual DNA: A square cover tile, bold sans captions in white with a coloured highlight pill, rounded bars mirrored around a centre line, speaker chips and a thin scrub bar, over a dark gradient tinted by the cover art.
- Signature transitions: Cover spin-in, speaker switch, pull-quote blow-up, end-card fold
- Key techniques: Waveform / bar visualiser from audio envelope, Word-by-word captions, Speaker cards & active-speaker highlight, Cover art + progress bar template

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Waveform / bar visualiser from audio envelope, Word-by-word captions, Speaker cards & active-speaker highlight, Cover art + progress bar template).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Waveform / bar visualiser from audio envelope and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PODCAST VISUALIZER", held for about 1 s.

BUILD RULES
- Suggested tools: Headliner / Wavve templates, After Effects + audio-to-keyframes, Canvas 2D + Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Podcast Visualizer motion-graphics film (The Audiogram Clip). Visual style: a square cover tile, bold sans captions in white with a coloured highlight pill, rounded bars mirrored around a centre line, speaker chips and a thin scrub bar, over a dark gradient tinted by the cover art. Motion: everything is driven by the voice: bars and avatar rings pulse per syllable, captions pop in word by word with the spoken word highlighted, and the layout snaps to whoever is talking. Signature moves: waveform / bar visualiser from audio envelope, word-by-word captions, speaker cards & active-speaker highlight, cover art + progress bar template; transitions: cover spin-in, speaker switch, pull-quote blow-up, end-card fold. In the tradition of WNYC Audiogram generator (open source, 2016) · Headliner audiograms (2017 —) · Wavve (2017 —) · Video-podcast clips on TikTok, Instagram Reels and YouTube Shorts (2020s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PODCAST VISUALIZER". Punchy sound design synced to every cut.
```
