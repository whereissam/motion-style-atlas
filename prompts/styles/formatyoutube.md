# Creator Intro

*Hook, chapters, sting, subscribe — then the video · 2012 — · Narrative Formats*

Reference film: `videos/formatyoutube.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Creator Intro** (Hook, chapters, sting, subscribe — then the video, 2012 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Early online videos, after YouTube opened in 2005, often began like television: a long animated channel intro. When YouTube began ranking videos by watch time in 2012 and creators started reading the audience-retention graph in their analytics, the long intro gave way to the hook: open on the most striking moment — often a flash-forward to the payoff — say what the video will deliver, keep any branded sting to a second or two, ask for the subscribe and the notification bell early, and get into it. In 2020 YouTube added chapters: timestamps in the description split the progress bar into named segments, and the spoken “in this video…” list became a visible one. YouTube Studio reports how many viewers are still watching at 0:30, which is where the hook earns its place.
- Study these reference works: MrBeast videos (2018 —), which open on the payoff · Marques Brownlee (MKBHD), a cold open then a short channel sting · Veritasium (Derek Muller, 2011 —), question-first hooks
- Motion DNA: Frame one is already mid-jump: a clip from 9:12, the payoff, lands at 1.0 s and rewinds to 0:00. The host Token talks while three chapters spring in on the beat, each dropping its marker on the progress bar. A 1.5 s sting — Token spin-in, ring burst, wordmark wipe, white-out. A subscribe lower third slides in, a cursor clicks it, then the bell, which swings and rings. The host hops and the film hard-cuts to the chapter-one card on the downbeat at 9 s.
- Visual DNA: A generic 16:9 player on the Technique Atlas paper: a creator set (warm wall, orange key-light glow, shelf props), a cobalt flash-forward stunt, an ink-black sting, an orange chapter card; generic player chrome with chapter gaps in the progress bar and tooltips. Beside it, an illustrative retention graph (hook-first vs. slow intro) and the five intro conventions with their timings.
- Signature transitions: Rewind scrub from the flash-forward; hard cuts; white-out from the sting; a lower third that slides in and drops away
- Key techniques: Flash-forward hook to the payoff, “In this video…” list = chapter markers, Sting under 2 s, subscribe + bell early

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Flash-forward hook to the payoff, “In this video…” list = chapter markers, Sting under 2 s, subscribe + bell early).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Flash-forward hook to the payoff and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CREATOR INTRO", held for about 1 s.

BUILD RULES
- Suggested tools: Premiere / Final Cut edit; sting and lower third from After Effects or a template pack, Chapters from description timestamps (first at 0:00), Canvas 2D: the video drawn in a clipped player rect under generic chrome; retention curves are analytic functions. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (generic player UI, fictional channel, illustrative retention data).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Creator Intro motion-graphics film (Hook, chapters, sting, subscribe — then the video). Visual style: a generic 16:9 player on the Technique Atlas paper: a creator set (warm wall, orange key-light glow, shelf props), a cobalt flash-forward stunt, an ink-black sting, an orange chapter card; generic player chrome with chapter gaps in the progress bar and tooltips. Beside it, an illustrative retention graph (hook-first vs. slow intro) and the five intro conventions with their timings. Motion: frame one is already mid-jump: a clip from 9:12, the payoff, lands at 1.0 s and rewinds to 0:00. The host Token talks while three chapters spring in on the beat, each dropping its marker on the progress bar. A 1.5 s sting — Token spin-in, ring burst, wordmark wipe, white-out. A subscribe lower third slides in, a cursor clicks it, then the bell, which swings and rings. The host hops and the film hard-cuts to the chapter-one card on the downbeat at 9 s. Signature moves: flash-forward hook to the payoff, “in this video…” list = chapter markers, sting under 2 s, subscribe + bell early; transitions: rewind scrub from the flash-forward; hard cuts; white-out from the sting; a lower third that slides in and drops away. In the tradition of MrBeast videos (2018 —), which open on the payoff · Marques Brownlee (MKBHD), a cold open then a short channel sting · Veritasium (Derek Muller, 2011 —), question-first hooks. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CREATOR INTRO". Punchy sound design synced to every cut.
```
