# Channel Ident

*Sting, logo, bug: the junction between programmes · 1950s — · Narrative Formats*

Reference film: `videos/formatident.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Channel Ident** (Sting, logo, bug: the junction between programmes, 1950s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Broadcasters have identified themselves between programmes since the earliest television — the BBC’s mechanical rotating-globe idents ran for decades from the 1960s. The modern ident, a few seconds of branded film built around a moving logo, was defined by Martin Lambie-Nairn’s Channel 4 launch ident (1982), whose coloured blocks fly together into the 4, and his BBC Two “2s” (1991), a family of short films around one logo. Continuity rules surround it: the on-screen bug, or DOG, sits in a corner inside title safe during programmes and comes off for the junction.
- Study these reference works: Channel 4 launch ident (Martin Lambie-Nairn, CGI by Robert Abel and Associates, 1982) · BBC Two “2s” idents (Lambie-Nairn, 1991) · MTV launch ID, the moon-landing flag (1981)
- Motion DNA: A six-second ident inside a ten-second junction: 1 s of programme out to black, 1.4 s setup, 2 s build as the cast converges on the logo, a hard sting at 4.4 s, a 1.6 s logo hold with the wordmark wipe, 1 s handoff into the corner bug, then the next programme fades up under it.
- Visual DNA: A dark junction: orange, ink and paper Tokens drifting on near-black, assembling cell by cell into one large Token; a white flash ring at the sting; the Token + MOTION lockup; the DOG as a white 60 % mark top right. Dashed title-safe and action-safe guides throughout, and a duration ruler bottom right.
- Signature transitions: Fade to black out of the programme; curved fly-ins to the logo cells; a flash-cut sting; a wordmark wipe; a scale-and-move into the bug while the next programme fades up
- Key techniques: Ident length 3–10 s, The sting: logo + audio logo, DOG / bug inside title safe

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ident length 3–10 s, The sting: logo + audio logo, DOG / bug inside title safe).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ident length 3–10 s and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CHANNEL IDENT", held for about 1 s.

BUILD RULES
- Suggested tools: Broadcast design: logo animation in After Effects or Cinema 4D, sting scored to picture, Continuity: DOG keyed by the playout system inside title safe, off for idents and promos, Canvas 2D: grid-sampled target cells inside the Token path, eased curved fly-ins, one lockup drawn at any scale. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Channel Ident motion-graphics film (Sting, logo, bug: the junction between programmes). Visual style: a dark junction: orange, ink and paper Tokens drifting on near-black, assembling cell by cell into one large Token; a white flash ring at the sting; the Token + MOTION lockup; the DOG as a white 60 % mark top right. Dashed title-safe and action-safe guides throughout, and a duration ruler bottom right. Motion: a six-second ident inside a ten-second junction: 1 s of programme out to black, 1.4 s setup, 2 s build as the cast converges on the logo, a hard sting at 4.4 s, a 1.6 s logo hold with the wordmark wipe, 1 s handoff into the corner bug, then the next programme fades up under it. Signature moves: ident length 3–10 s, the sting: logo + audio logo, dog / bug inside title safe; transitions: fade to black out of the programme; curved fly-ins to the logo cells; a flash-cut sting; a wordmark wipe; a scale-and-move into the bug while the next programme fades up. In the tradition of Channel 4 launch ident (Martin Lambie-Nairn, CGI by Robert Abel and Associates, 1982) · BBC Two “2s” idents (Lambie-Nairn, 1991) · MTV launch ID, the moon-landing flag (1981). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CHANNEL IDENT". Punchy sound design synced to every cut.
```
