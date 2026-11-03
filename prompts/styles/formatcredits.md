# End Credits

*The roll, the stinger, the legal line · 1970s — · Narrative Formats*

Reference film: `videos/formatcredits.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **End Credits** (The roll, the stinger, the legal line, 1970s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Classical Hollywood films opened with their credits and closed on a simple “The End”; full end-roll crawls listing the whole crew became the norm through the 1970s, as union agreements and longer crew lists pushed credits to the back of the film. Post-credit scenes go back at least to The Muppet Movie (1979) and Ferris Bueller’s Day Off (1986), and Marvel Studios turned the mid- and post-credit stinger into an expected part of the format from Iron Man (2008). The Bond films’ closing “James Bond will return” line is the best-known sign-off before the legal block.
- Study these reference works: Ferris Bueller’s Day Off (John Hughes, 1986; post-credits scene) · Iron Man (Jon Favreau, 2008; post-credits scene) · The Spy Who Loved Me (Lewis Gilbert, 1977; “James Bond will return”)
- Motion DNA: Nothing eases in a crawl: after the end title card holds for 1.2 s, the roll moves at one constant speed so every line spends the same time on screen. At 5.4 s it cuts to black and a two-second stinger plays (a second Token peeks in, a one-beat sting); at 7.4 s the crawl resumes exactly where it stopped and decelerates to nothing only on the legal line, which holds.
- Visual DNA: Black ground; white names in a heavy sans set left of a centre gutter, roles in small spaced caps right-aligned to it; orange section heads; the roll fades in and out at the top and bottom of the window. The stinger is the Token stage under a dark vignette, with the second Token in blue. Mono readouts on the right give the crawl speed and lines on screen.
- Signature transitions: End card rising into the roll; hard cut to black for the stinger and back; crawl stops on the legal line
- Key techniques: Constant-speed crawl, role / name columns, Mid-credit stinger scene, Legal / copyright line last

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Constant-speed crawl, role / name columns, Mid-credit stinger scene, Legal / copyright line last).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Constant-speed crawl, role / name columns and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "END CREDITS", held for about 1 s.

BUILD RULES
- Suggested tools: Credit roll from a credits list in a titling system (Avid, After Effects, dedicated roll software), Constant pixel-per-frame speed to avoid judder, Canvas 2D: one scroll offset from accumulated crawl time, edge fades. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second End Credits motion-graphics film (The roll, the stinger, the legal line). Visual style: black ground; white names in a heavy sans set left of a centre gutter, roles in small spaced caps right-aligned to it; orange section heads; the roll fades in and out at the top and bottom of the window. The stinger is the Token stage under a dark vignette, with the second Token in blue. Mono readouts on the right give the crawl speed and lines on screen. Motion: nothing eases in a crawl: after the end title card holds for 1.2 s, the roll moves at one constant speed so every line spends the same time on screen. At 5.4 s it cuts to black and a two-second stinger plays (a second Token peeks in, a one-beat sting); at 7.4 s the crawl resumes exactly where it stopped and decelerates to nothing only on the legal line, which holds. Signature moves: constant-speed crawl, role / name columns, mid-credit stinger scene, legal / copyright line last; transitions: end card rising into the roll; hard cut to black for the stinger and back; crawl stops on the legal line. In the tradition of Ferris Bueller’s Day Off (John Hughes, 1986; post-credits scene) · Iron Man (Jon Favreau, 2008; post-credits scene) · The Spy Who Loved Me (Lewis Gilbert, 1977; “James Bond will return”). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "END CREDITS". Punchy sound design synced to every cut.
```
