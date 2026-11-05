# Skippable Pre-roll

*Brand before the skip, a payoff for stayers · 2010 — · Narrative Formats*

Reference film: `videos/formatpreroll.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Skippable Pre-roll** (Brand before the skip, a payoff for stayers, 2010 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Pre-roll — the video ad that plays before the clip a viewer chose — spread with online video in the late 2000s. In 2010 YouTube introduced TrueView in-stream ads, which can be skipped after five seconds and which the advertiser pays for only when the viewer watches 30 seconds (or the whole of a shorter ad) or clicks. The skip line rewrote the structure of the spot: brand and hook front-loaded into the five unskippable seconds, the rest written as a reward for the people who stay. GEICO’s “Unskippable” (The Martin Agency, 2015) made the whole ad fit before the button and won the Film Grand Prix at Cannes Lions.
- Study these reference works: GEICO “Unskippable” (The Martin Agency, 2015) · YouTube TrueView in-stream ads (2010 —) · Google’s ABCD guidelines for YouTube ads (Attract, Brand, Connect, Direct)
- Motion DNA: No fade in: frame one already holds the MOTION wordmark as the Token slams down beside it; the lockup shrinks to a brand bug at 1.5 s and the Token hops the one-line pitch on the beat while the skip box counts 5-4-3-2-1; at 5 s it pops into SKIP AD, the audience grid empties, a cursor hovers… and leaves; ‘Still here?’, then a ring of Tokens orbits and collapses into one big Token for the stayers; the end card lands at 8.5 s with the offer and LEARN MORE.
- Visual DNA: A dark video-player frame on the paper stage: the ad inside on the Technique Atlas ground, with a bottom scrim, white transport icons, a yellow ad progress bar, a black ‘Ad · 0:07’ pill and the classic skip box with a thumbnail. An orange dashed skip line on the progress bar. To the right a 10 × 10 grid of viewer icons that greys out at the skip line and turns orange for the stayers.
- Signature transitions: Lockup shrinks into a brand bug; hard cuts inside the ad on the skip line and into the payoff; skip box pops from countdown to button; the end card scales in
- Key techniques: Brand and the whole pitch inside the unskippable 5 s, The player is the frame: Ad badge, yellow bar, skip box, Second half written as a payoff for stayers

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Brand and the whole pitch inside the unskippable 5 s, The player is the frame: Ad badge, yellow bar, skip box, Second half written as a payoff for stayers).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Brand and the whole pitch inside the unskippable 5 s and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SKIPPABLE PRE-ROLL", held for about 1 s.

BUILD RULES
- Suggested tools: Edit to the platform’s skip point: brand in shot 1, message complete by 0:05, Second half cut as a reward cut-down; CTA overlay and end screen in the ad platform, Canvas 2D: the ad drawn on a virtual 1920 × 1080 frame scaled into a player mock. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Skippable Pre-roll motion-graphics film (Brand before the skip, a payoff for stayers). Visual style: a dark video-player frame on the paper stage: the ad inside on the Technique Atlas ground, with a bottom scrim, white transport icons, a yellow ad progress bar, a black ‘Ad · 0:07’ pill and the classic skip box with a thumbnail. An orange dashed skip line on the progress bar. To the right a 10 × 10 grid of viewer icons that greys out at the skip line and turns orange for the stayers. Motion: no fade in: frame one already holds the MOTION wordmark as the Token slams down beside it; the lockup shrinks to a brand bug at 1.5 s and the Token hops the one-line pitch on the beat while the skip box counts 5-4-3-2-1; at 5 s it pops into SKIP AD, the audience grid empties, a cursor hovers… and leaves; ‘Still here?’, then a ring of Tokens orbits and collapses into one big Token for the stayers; the end card lands at 8.5 s with the offer and LEARN MORE. Signature moves: brand and the whole pitch inside the unskippable 5 s, the player is the frame: ad badge, yellow bar, skip box, second half written as a payoff for stayers; transitions: lockup shrinks into a brand bug; hard cuts inside the ad on the skip line and into the payoff; skip box pops from countdown to button; the end card scales in. In the tradition of GEICO “Unskippable” (The Martin Agency, 2015) · YouTube TrueView in-stream ads (2010 —) · Google’s ABCD guidelines for YouTube ads (Attract, Brand, Connect, Direct). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SKIPPABLE PRE-ROLL". Punchy sound design synced to every cut.
```
