# Overcast

*The whole cloudy sky as one soft light · 1942 — (sky model) · Rendering Looks*

Reference film: `videos/lookovercast.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Overcast** (The whole cloudy sky as one soft light, 1942 — (sky model); family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Under a full cloud deck the sun disappears and the whole sky becomes one huge, dim, even source: there is no key, shadows shrink to soft darkening where surfaces meet, and contrast drops. Parry Moon and Domina Spencer measured overcast skies in 1942 and found them about three times brighter at the zenith than at the horizon, L(θ) = Lz(1 + 2 cos θ)/3, which the CIE adopted as its standard overcast sky (1955). Photographers prize the light for portraits and product work, and its film equivalent is the large overhead diffusion frame. In rendering it is sky-dome lighting: integrate the sky over the visible hemisphere, by cosine-weighted visibility rays or by ambient occlusion as the cheap stand-in (Zhukov, Iones and Kronin, 1998; Landis at ILM, 2002).
- Study these reference works: CIE standard overcast sky (after Moon & Spencer, 1942) · Bernd and Hilla Becher’s typologies of industrial structures (from 1959; photographed under overcast skies for shadowless, even light) · Fargo (Joel and Ethan Coen, cinematography Roger Deakins, 1996; flat white winter overcast)
- Motion DNA: The shared camera orbit. The film opens on the scene in hard clear-sky sun; a wipe from left to right covers it with the overcast dome, the cast shadows dissolving into soft contact darkening. Callouts and a fisheye probe step across four points on the beat while a visibility pass sits beside it; the sky-ray count then builds 1 → 3 → 6 → 12 on the beat, single soft shadows multiplying into one soft occlusion; finally a split slides in to compare overcast and sun side by side with their measured contrast ratios.
- Visual DNA: Pale cool grey-white sky with no visible sun; the paper floor and the orange, white and blue objects in soft, even, slightly blue light, tops brighter than sides, dark only where they meet the floor. Against it the hard-sun half: blue sky, crisp black shadows, bright highlights. Ink mono labels, a circular sky fisheye with ray dots, a visibility pass, a ray-count readout and two contrast-ratio readouts.
- Signature transitions: Wipe from hard sun to overcast; stepped ray count; split to the sunny version
- Key techniques: CIE overcast sky dome, Cosine-weighted soft shadow rays, Measured contrast ratio

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (CIE overcast sky dome, Cosine-weighted soft shadow rays, Measured contrast ratio).
- 5.0–8.0 s  Climax: the most spectacular moment, built on CIE overcast sky dome and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "OVERCAST", held for about 1 s.

BUILD RULES
- Suggested tools: Sky-dome / environment lighting with the CIE overcast luminance distribution, Cosine-weighted hemisphere visibility (the full-strength version of ambient occlusion), Canvas 2D + SDF tracer (js/look-kit.js): 12 fixed spiral directions per pixel, each a soft LK.shadow, times LK.ao for small-scale contact; contrast measured from a luminance histogram of the frame. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Overcast motion-graphics film (The whole cloudy sky as one soft light). Visual style: pale cool grey-white sky with no visible sun; the paper floor and the orange, white and blue objects in soft, even, slightly blue light, tops brighter than sides, dark only where they meet the floor. Against it the hard-sun half: blue sky, crisp black shadows, bright highlights. Ink mono labels, a circular sky fisheye with ray dots, a visibility pass, a ray-count readout and two contrast-ratio readouts. Motion: the shared camera orbit. The film opens on the scene in hard clear-sky sun; a wipe from left to right covers it with the overcast dome, the cast shadows dissolving into soft contact darkening. Callouts and a fisheye probe step across four points on the beat while a visibility pass sits beside it; the sky-ray count then builds 1 → 3 → 6 → 12 on the beat, single soft shadows multiplying into one soft occlusion; finally a split slides in to compare overcast and sun side by side with their measured contrast ratios. Signature moves: cie overcast sky dome, cosine-weighted soft shadow rays, measured contrast ratio; transitions: wipe from hard sun to overcast; stepped ray count; split to the sunny version. In the tradition of CIE standard overcast sky (after Moon & Spencer, 1942) · Bernd and Hilla Becher’s typologies of industrial structures (from 1959; photographed under overcast skies for shadowless, even light) · Fargo (Joel and Ethan Coen, cinematography Roger Deakins, 1996; flat white winter overcast). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "OVERCAST". Punchy sound design synced to every cut.
```
