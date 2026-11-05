# Myth vs Fact

*Debunking: myth, evidence, the fact · 1990s — · video 2003 — · Narrative Formats*

Reference film: `videos/formatmyth.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Myth vs Fact** (Debunking: myth, evidence, the fact, 1990s — · video 2003 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Debunking as a format took shape in the 1990s and 2000s: the urban-legend site Snopes (from 1994), Discovery’s MythBusters (2003–2016; revived 2017–18), which tested one myth per segment and stamped it BUSTED, CONFIRMED or PLAUSIBLE, and the “myth vs fact” sheets of public-health agencies, from vaccine leaflets to the WHO’s COVID-19 Mythbusters pages (2020). Research on correcting misinformation shaped its order: The Debunking Handbook (Cook & Lewandowsky, 2011; Lewandowsky, Cook, Ecker et al., 2020) advises repeating the myth only once, explaining why it is wrong, and leading and ending with the fact — the order George Lakoff calls a “truth sandwich” — so the myth is not what sticks.
- Study these reference works: MythBusters (Beyond Productions for Discovery, 2003–2016; Science Channel, 2017–18) · The Debunking Handbook (John Cook & Stephan Lewandowsky, 2011; Lewandowsky, Cook, Ecker et al., 2020) · WHO, Coronavirus disease (COVID-19) advice for the public: Mythbusters (2020)
- Motion DNA: A 0.8 s hook, then three blocks of 2.6 s in identical order: the myth eases up (0.2 s), the red stamp slams down at 0.3 s, the evidence panel fades in at 0.4 s and plays its test, at 0.95 s a red strike draws through the myth, which drops away while the fact rises in green in the same place and the green stamp lands; the fact then holds for about 1.4 s. The recap at 8.6 s ticks the three facts on, a fifth of a second apart, and holds.
- Visual DNA: The Technique Atlas paper stage; heavy Archivo statements set flush left; double-ruled rubber stamps, MYTH in red tilted left, FACT in green tilted right; a white evidence panel with mono labels and a cited source line; two frame-rate lanes with frame ticks, a strobed drop with gap counts, a squash with its width × height read out against a dashed rest pose; a three-dot debunked tally top-right.
- Signature transitions: Strike-through and in-place replacement of the myth by the fact; stamps scale down onto the page; blocks fade through the paper
- Key techniques: State the myth once, plainly, and flag it, Correct it with evidence, not assertion, End on the fact; the recap never repeats the myth

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (State the myth once, plainly, and flag it, Correct it with evidence, not assertion, End on the fact; the recap never repeats the myth).
- 5.0–8.0 s  Climax: the most spectacular moment, built on State the myth once, plainly, and flag it and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MYTH VS FACT", held for about 1 s.

BUILD RULES
- Suggested tools: Script per myth: claim (once), evidence, fact; recap of facts only, After Effects: stamp precomps with scale-down and a camera nudge on impact, Canvas 2D: a myth table driving one block layout; evidence as one small simulation per myth. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Myth vs Fact motion-graphics film (Debunking: myth, evidence, the fact). Visual style: the Technique Atlas paper stage; heavy Archivo statements set flush left; double-ruled rubber stamps, MYTH in red tilted left, FACT in green tilted right; a white evidence panel with mono labels and a cited source line; two frame-rate lanes with frame ticks, a strobed drop with gap counts, a squash with its width × height read out against a dashed rest pose; a three-dot debunked tally top-right. Motion: a 0.8 s hook, then three blocks of 2.6 s in identical order: the myth eases up (0.2 s), the red stamp slams down at 0.3 s, the evidence panel fades in at 0.4 s and plays its test, at 0.95 s a red strike draws through the myth, which drops away while the fact rises in green in the same place and the green stamp lands; the fact then holds for about 1.4 s. The recap at 8.6 s ticks the three facts on, a fifth of a second apart, and holds. Signature moves: state the myth once, plainly, and flag it, correct it with evidence, not assertion, end on the fact; the recap never repeats the myth; transitions: strike-through and in-place replacement of the myth by the fact; stamps scale down onto the page; blocks fade through the paper. In the tradition of MythBusters (Beyond Productions for Discovery, 2003–2016; Science Channel, 2017–18) · The Debunking Handbook (John Cook & Stephan Lewandowsky, 2011; Lewandowsky, Cook, Ecker et al., 2020) · WHO, Coronavirus disease (COVID-19) advice for the public: Mythbusters (2020). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MYTH VS FACT". Punchy sound design synced to every cut.
```
