/* Regeneration prompts for each atlas style. Shared by atlas.html (copy buttons) and
   tools/build-prompts.mjs (writes prompts/*.md), so both always say the same thing. */
(function (root) {
  'use strict';
  const list = a => (a || []).join(', ');
  const lc = s => (s || '').replace(/\.$/, '').replace(/^./, c => c.toLowerCase());

  function buildPrompt(it, families) {
    const fam = (families && families[it.family] && families[it.family].name) || '';
    const tech = it.tech || [];
    return `You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **${it.name}** (${it.sub}, ${it.era}; family: ${fam}).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: ${it.origin}
- Study these reference works: ${it.works}
- Motion DNA: ${it.motionDNA}
- Visual DNA: ${it.visualDNA}
- Signature transitions: ${it.transitions}
- Key techniques: ${list(tech)}

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (${list(tech)}).
- 5.0–8.0 s  Climax: the most spectacular moment, built on ${tech[0] || 'the core technique'} and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "${(it.name || '').toUpperCase()}", held for about 1 s.

BUILD RULES
- Suggested tools: ${list(it.implementation)}. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- ${it.loopable ? 'Loopable: make the last frame cut cleanly back to the first.' : 'One-shot: it does not need to loop.'}
- Reproducibility note: ${it.reproducibility}.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.`;
  }

  function videoPrompt(it) {
    return `10-second ${it.name} motion-graphics film (${it.sub}). Visual style: ${lc(it.visualDNA)}. Motion: ${lc(it.motionDNA)}. Signature moves: ${list(it.tech).toLowerCase()}; transitions: ${lc(it.transitions)}. In the tradition of ${it.works}. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "${(it.name || '').toUpperCase()}". Punchy sound design synced to every cut.`;
  }

  const api = { buildPrompt, videoPrompt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AtlasPrompts = api;
})(typeof window !== 'undefined' ? window : globalThis);
