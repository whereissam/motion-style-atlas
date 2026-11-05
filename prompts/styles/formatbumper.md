# Ad-break Bumper

*We’ll be right back · now back to · 1950s — · Narrative Formats*

Reference film: `videos/formatbumper.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Ad-break Bumper** (We’ll be right back · now back to, 1950s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Commercial television split its programmes into acts around advertising from the start, and short station or programme idents either side of the break — bumpers — marked where the show stopped and resumed. In the US the FCC’s 1974 policy on children’s television required a separation device around the ads in children’s programmes, which made bumpers a fixture of Saturday-morning cartoons; Japanese anime has its own version in the mid-episode eyecatch. Cartoon Network’s and Adult Swim’s bumps from the late 1990s and 2000s turned the form into a showcase. Writers end each act on a hook — the act out — and the act in often repeats its last beat.
- Study these reference works: Saturday-morning cartoon bumpers (US, 1970s–90s) · Cowboy Bebop (1998; eyecatches) · Adult Swim bumps (2001 —)
- Motion DNA: The act runs to a freeze at 1.25 s and dips to black; the out-bumper wipes in at 1.6 s, its logo loop on half-second beats, ending on an unresolved chord; the break runs compressed ×35, five spots in 3.4 s, each with its own jingle and a black frame between; the in-bumper at 6.4 s plays the same loop and resolves; the act in at 7.8 s replays the teeter and goes on — the catch lands at about 9.15 s.
- Visual DNA: The show on the paper stage: an ink table, a blue cube tipping off its edge, the orange Token. Bumpers as full-bleed orange (out) and blue (in) cards with MOTION and the hopping Token. The break in master-control grey: a monitor with generic spots, the pod as a slot timeline with :15 / :30 labels, a big mono break clock. A rundown of the half hour top right, a translucent logo bug bottom right.
- Signature transitions: Freeze and dip to black out of the act; hard wipes in and out of the bumpers; a black frame between spots; a straight cut back into the act
- Key techniques: Act out on a hook, dip to black, Out- and in-bumper: logo, one line, a short loop, Act in repeats the last beat; logo bug on

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Act out on a hook, dip to black, Out- and in-bumper: logo, one line, a short loop, Act in repeats the last beat; logo bug on).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Act out on a hook, dip to black and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "AD-BREAK BUMPER", held for about 1 s.

BUILD RULES
- Suggested tools: Network presentation package: bumpers, logo bug, break format, Playout automation inserts the pod between the bumpers, Canvas 2D: one show rig driven by story time, a pod table driving monitor, timeline and clock. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Ad-break Bumper motion-graphics film (We’ll be right back · now back to). Visual style: the show on the paper stage: an ink table, a blue cube tipping off its edge, the orange Token. Bumpers as full-bleed orange (out) and blue (in) cards with MOTION and the hopping Token. The break in master-control grey: a monitor with generic spots, the pod as a slot timeline with :15 / :30 labels, a big mono break clock. A rundown of the half hour top right, a translucent logo bug bottom right. Motion: the act runs to a freeze at 1.25 s and dips to black; the out-bumper wipes in at 1.6 s, its logo loop on half-second beats, ending on an unresolved chord; the break runs compressed ×35, five spots in 3.4 s, each with its own jingle and a black frame between; the in-bumper at 6.4 s plays the same loop and resolves; the act in at 7.8 s replays the teeter and goes on — the catch lands at about 9.15 s. Signature moves: act out on a hook, dip to black, out- and in-bumper: logo, one line, a short loop, act in repeats the last beat; logo bug on; transitions: freeze and dip to black out of the act; hard wipes in and out of the bumpers; a black frame between spots; a straight cut back into the act. In the tradition of Saturday-morning cartoon bumpers (US, 1970s–90s) · Cowboy Bebop (1998; eyecatches) · Adult Swim bumps (2001 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "AD-BREAK BUMPER". Punchy sound design synced to every cut.
```
