# Vertical Story

*Full-screen segments that vanish in a day · 2013 — · Narrative Formats*

Reference film: `videos/formatstory.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Vertical Story** (Full-screen segments that vanish in a day, 2013 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Snapchat introduced Stories in October 2013: a chain of full-screen vertical photos and clips, played in order and gone after 24 hours. Instagram Stories copied the format in August 2016, then WhatsApp Status, Facebook and others, which fixed its grammar — segmented progress bars across the top, tap right to skip and left to go back, a reply bar along the bottom, and stickers (text, mentions, polls) placed on top. The swipe-up link was replaced on Instagram by the link sticker in 2021. Ad guidance for Stories asks for the top and bottom of the frame (about 250 px each on a 1080 × 1920 canvas) to be kept free of text and logos, because the app’s own interface covers them.
- Study these reference works: Snapchat Stories (2013 —) · Instagram Stories (2016 —) with poll stickers (2017) and link stickers (2021) · WhatsApp Status (2017 —)
- Motion DNA: Four segments under four progress bars. Segment one hooks inside the first second — the Token slams in with WAIT. — then pays off. A tap on the right of the screen hard-cuts to segment two, where tilted text stickers spring on one after another; segment three asks a question with a poll sticker, takes one tap and fills its result bars while the Token spins; segment four ends on the wordmark and a pulsing link sticker that is tapped. Every cut lands on a bar of the 120 BPM bed.
- Visual DNA: The Technique Atlas paper stage with a 9:16 phone in the middle. Inside: bold colour-blocked segments (ink with an orange glow, paper grid, cobalt, ink), heavy Archivo stickers, a white poll card with orange result bars, a white link pill; generic story chrome (bars, avatar, name, reply field, heart, send). The top and bottom 250 px are hatched orange keep-clear zones; mono annotations, a hook timer and a segment list sit outside the phone.
- Signature transitions: Hard cuts on tap-forward between segments; stickers spring on with overshoot; the poll fills on the vote
- Key techniques: Hook inside the first second, Segments + tap-forward, Top / bottom UI safe zones

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hook inside the first second, Segments + tap-forward, Top / bottom UI safe zones).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hook inside the first second and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VERTICAL STORY", held for about 1 s.

BUILD RULES
- Suggested tools: Instagram / Snapchat in-app story editor, Figma or After Effects 1080 × 1920 story templates with safe-zone guides, Canvas 2D: the story drawn at 1080 × 1920 under a scale transform, clipped to the phone screen. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (generic app UI, fictional account, no real logos).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Vertical Story motion-graphics film (Full-screen segments that vanish in a day). Visual style: the Technique Atlas paper stage with a 9:16 phone in the middle. Inside: bold colour-blocked segments (ink with an orange glow, paper grid, cobalt, ink), heavy Archivo stickers, a white poll card with orange result bars, a white link pill; generic story chrome (bars, avatar, name, reply field, heart, send). The top and bottom 250 px are hatched orange keep-clear zones; mono annotations, a hook timer and a segment list sit outside the phone. Motion: four segments under four progress bars. Segment one hooks inside the first second — the Token slams in with WAIT. — then pays off. A tap on the right of the screen hard-cuts to segment two, where tilted text stickers spring on one after another; segment three asks a question with a poll sticker, takes one tap and fills its result bars while the Token spins; segment four ends on the wordmark and a pulsing link sticker that is tapped. Every cut lands on a bar of the 120 BPM bed. Signature moves: hook inside the first second, segments + tap-forward, top / bottom ui safe zones; transitions: hard cuts on tap-forward between segments; stickers spring on with overshoot; the poll fills on the vote. In the tradition of Snapchat Stories (2013 —) · Instagram Stories (2016 —) with poll stickers (2017) and link stickers (2021) · WhatsApp Status (2017 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VERTICAL STORY". Punchy sound design synced to every cut.
```
