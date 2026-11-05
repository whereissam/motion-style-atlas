# Sale Countdown

*Offer, anchor price, scarcity, deadline, CTA · 1900s — · online 2000s — · Narrative Formats*

Reference film: `videos/formatsale.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Sale Countdown** (Offer, anchor price, scarcity, deadline, CTA, 1900s — · online 2000s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Sale advertising is as old as the department store, and its devices have names. The struck-through original price is an anchor — Tversky and Kahneman described anchoring in 1974 — and limited stock and a closing deadline are the scarcity principle Robert Cialdini set out in Influence (1984). E-commerce made both live: deal-a-day sites such as Woot (2004) and Amazon’s Lightning Deals put a ticking clock and a claimed-stock bar beside the price, and shopping events such as Black Friday and Amazon Prime Day (first held on 15 July 2015) turned the countdown into the whole ad, with the conditions in the small print at the end.
- Study these reference works: Amazon Prime Day Lightning Deals (2015 —) · Woot deal-a-day (2004 —) · Black Friday doorbuster ads (US retail)
- Motion DNA: Every element lands on a bar line and stays: 40 % OFF slams in at frame one and shrinks to a spinning starburst at 2 s; the anchor price strikes through and the sale price pops at 2.8 s; three offers stack on the half beats; the stock count drops in jolts from 12 to 2 with the bar draining; from 6 s the clock’s seconds box flashes on every tick; SHOP NOW pulses and is clicked at 9 s.
- Visual DNA: Paper stage with a black scrolling FLASH SALE ticker; a big orange panel with diagonal stripes holding the Token as the product and an ink starburst badge; the right column stacks heavy Archivo prices, pill-shaped offer tags, a stock bar that turns orange when low, ink digit boxes and an orange CTA pill. Small grey T&Cs at the bottom; urgency plotted on the caption graph.
- Signature transitions: Slam-in, shrink-to-badge, strike-through draw, pop-ins on the beat; nothing ever leaves
- Key techniques: Anchor price struck through, the saving spelled out, Scarcity: a live stock count and a draining bar, Deadline clock, one-verb CTA, T&Cs in the small print

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Anchor price struck through, the saving spelled out, Scarcity: a live stock count and a draining bar, Deadline clock, one-verb CTA, T&Cs in the small print).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Anchor price struck through, the saving spelled out and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SALE COUNTDOWN", held for about 1 s.

BUILD RULES
- Suggested tools: Retail promo template in After Effects or a DCO ad tool, price and stock fields fed from a product feed, Countdown timer bound to the sale end time, Canvas 2D: one accumulating layout, keyframed reveals, stock and clock as functions of time. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Sale Countdown motion-graphics film (Offer, anchor price, scarcity, deadline, CTA). Visual style: paper stage with a black scrolling FLASH SALE ticker; a big orange panel with diagonal stripes holding the Token as the product and an ink starburst badge; the right column stacks heavy Archivo prices, pill-shaped offer tags, a stock bar that turns orange when low, ink digit boxes and an orange CTA pill. Small grey T&Cs at the bottom; urgency plotted on the caption graph. Motion: every element lands on a bar line and stays: 40 % OFF slams in at frame one and shrinks to a spinning starburst at 2 s; the anchor price strikes through and the sale price pops at 2.8 s; three offers stack on the half beats; the stock count drops in jolts from 12 to 2 with the bar draining; from 6 s the clock’s seconds box flashes on every tick; SHOP NOW pulses and is clicked at 9 s. Signature moves: anchor price struck through, the saving spelled out, scarcity: a live stock count and a draining bar, deadline clock, one-verb cta, t&cs in the small print; transitions: slam-in, shrink-to-badge, strike-through draw, pop-ins on the beat; nothing ever leaves. In the tradition of Amazon Prime Day Lightning Deals (2015 —) · Woot deal-a-day (2004 —) · Black Friday doorbuster ads (US retail). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SALE COUNTDOWN". Punchy sound design synced to every cut.
```
