# Chromatic Aberration

*Colours that refuse to meet: lens fringing in post · 1700s optics · 2000s — as a look · Rendering Looks*

Reference film: `videos/lookchromatic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Chromatic Aberration** (Colours that refuse to meet: lens fringing in post, 1700s optics · 2000s — as a look; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Glass bends short wavelengths more than long ones (dispersion), so a simple lens brings blue to a focus closer than red. Isaac Newton concluded in Opticks (1704) that this colour error could not be removed from lenses, one reason he built a reflecting telescope. It was corrected in the 18th century by the achromatic doublet, a converging crown-glass lens paired with a diverging flint-glass one: Chester Moor Hall made the first ones in the 1730s and John Dollond patented and sold them from 1758. Real-time renderers later added the fringe back on purpose as a post effect that imitates imperfect camera lenses, often next to grain and vignetting.
- Study these reference works: Isaac Newton, Opticks (1704) · John Dollond’s achromatic doublet (patented 1758) · Alien: Isolation (Creative Assembly, 2014; lens fringing with grain for a 1970s-film look)
- Motion DNA: The shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. A wipe brings in the uncorrected lens; on each beat the lateral scale steps up (R ×1.006 → ×1.0185 with B scaled down the same) so the fringes widen toward the frame edges; then longitudinal blur grows on R and B; finally a wipe from the right corrects the lens with a doublet and holds as a split, uncorrected on the left.
- Visual DNA: The plain still life with red and cyan-blue fringes along every silhouette, near zero at the centre and widest at the cube and sphere, then soft purple-green halos on all edges; on the corrected side, clean edges. A loupe with the edge’s pixels and its R, G, B profile, concentric rings giving the fringe width at each radius, and a ray diagram of three wavelengths focusing apart.
- Signature transitions: Wipe from the ideal lens to the aberrated one; stepped strength on the beat; a wipe to the corrected lens holding as a split
- Key techniques: Lateral CA: per-channel radial scale, Longitudinal CA: R and B defocused, Achromatic doublet as the correction

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Lateral CA: per-channel radial scale, Longitudinal CA: R and B defocused, Achromatic doublet as the correction).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Lateral CA: per-channel radial scale and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CHROMATIC ABERRATION", held for about 1 s.

BUILD RULES
- Suggested tools: Lens-distortion / chromatic-aberration post nodes (Nuke, After Effects, game post stacks), Per-channel radial scale about the optical centre plus per-channel defocus, Canvas 2D + SDF tracer (js/look-kit.js): LK.plain shaded, then opts-style post on the float buffer: R and B resampled bilinearly at 1 ± k scale, mixed with box-blurred copies for axial CA. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Chromatic Aberration motion-graphics film (Colours that refuse to meet: lens fringing in post). Visual style: the plain still life with red and cyan-blue fringes along every silhouette, near zero at the centre and widest at the cube and sphere, then soft purple-green halos on all edges; on the corrected side, clean edges. A loupe with the edge’s pixels and its R, G, B profile, concentric rings giving the fringe width at each radius, and a ray diagram of three wavelengths focusing apart. Motion: the shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. A wipe brings in the uncorrected lens; on each beat the lateral scale steps up (R ×1.006 → ×1.0185 with B scaled down the same) so the fringes widen toward the frame edges; then longitudinal blur grows on R and B; finally a wipe from the right corrects the lens with a doublet and holds as a split, uncorrected on the left. Signature moves: lateral ca: per-channel radial scale, longitudinal ca: r and b defocused, achromatic doublet as the correction; transitions: wipe from the ideal lens to the aberrated one; stepped strength on the beat; a wipe to the corrected lens holding as a split. In the tradition of Isaac Newton, Opticks (1704) · John Dollond’s achromatic doublet (patented 1758) · Alien: Isolation (Creative Assembly, 2014; lens fringing with grain for a 1970s-film look). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CHROMATIC ABERRATION". Punchy sound design synced to every cut.
```
