# Testimonial Ad

*A real customer’s story, then the proof · 1890s — · on TV 1950s — · Narrative Formats*

Reference film: `videos/formattestimonial.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Testimonial Ad** (A real customer’s story, then the proof, 1890s — · on TV 1950s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Testimonials are as old as advertising — Victorian patent-medicine ads ran letters from grateful users, and in the 1920s J. Walter Thompson’s Pond’s campaign paid society women to endorse cold cream. Television made the ‘real people, not actors’ spot a genre: hidden-camera taste tests such as Folgers’ ‘we secretly replaced…’ (from the late 1970s) let ordinary customers tell it in their own words. The rules came with it: the US FTC’s Endorsement Guides (1975; revised 1980, 2009, 2023) require, since 2009, that a customer’s results be typical or that what is typical be disclosed, and that paid endorsements be labelled — hence the small print.
- Study these reference works: Pond’s cold cream endorsements (J. Walter Thompson, 1920s) · Folgers ‘secretly replaced’ campaign (from 1970s) · Dove ‘Real Beauty’ (Ogilvy & Mather, 2004 —)
- Motion DNA: Opens cold on the strongest line held 1.2 s; then three captioned answers of about two seconds each — problem, the moment, the result with a count-up to 3× — while the customer sits still and only pulses as they speak; at 7.2 s a hard cut to a review wall where six cards pop in 0.12 s apart and five stars fill; at 8.6 s the voice switches to the brand: lockup, a pulsing CTA pill and the fine print.
- Visual DNA: The paper stage dressed as a living room — window light, a sofa, a blue cushion — with the orange Token as the customer on the right; ink-plated, centred burned-in captions; an ink REAL CUSTOMER pill; left-hand cards for the before work (a grey, stepped square), a phone with the app and a friend’s blue message, and a huge orange 3.0×. White review cards with coloured Tokens and orange stars; a VOICE switch, mono annotations and grey small print.
- Signature transitions: Hard cuts between the hook card, the interview, the review wall and the end card; cross-fades between the left-hand cards
- Key techniques: The customer’s voice: problem → moment → result, REAL CUSTOMER super, burned-in captions, Social proof, then CTA and the disclaimer

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (The customer’s voice: problem → moment → result, REAL CUSTOMER super, burned-in captions, Social proof, then CTA and the disclaimer).
- 5.0–8.0 s  Climax: the most spectacular moment, built on The customer’s voice: problem → moment → result and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TESTIMONIAL AD", held for about 1 s.

BUILD RULES
- Suggested tools: Customer interview filmed unscripted, cut down to problem / moment / result, Burned-in captions for sound-off feeds; claims checked against the FTC guides, Canvas 2D: one room set, caption plates measured per line, staggered card pops. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Testimonial Ad motion-graphics film (A real customer’s story, then the proof). Visual style: the paper stage dressed as a living room — window light, a sofa, a blue cushion — with the orange Token as the customer on the right; ink-plated, centred burned-in captions; an ink REAL CUSTOMER pill; left-hand cards for the before work (a grey, stepped square), a phone with the app and a friend’s blue message, and a huge orange 3.0×. White review cards with coloured Tokens and orange stars; a VOICE switch, mono annotations and grey small print. Motion: opens cold on the strongest line held 1.2 s; then three captioned answers of about two seconds each — problem, the moment, the result with a count-up to 3× — while the customer sits still and only pulses as they speak; at 7.2 s a hard cut to a review wall where six cards pop in 0.12 s apart and five stars fill; at 8.6 s the voice switches to the brand: lockup, a pulsing CTA pill and the fine print. Signature moves: the customer’s voice: problem → moment → result, real customer super, burned-in captions, social proof, then cta and the disclaimer; transitions: hard cuts between the hook card, the interview, the review wall and the end card; cross-fades between the left-hand cards. In the tradition of Pond’s cold cream endorsements (J. Walter Thompson, 1920s) · Folgers ‘secretly replaced’ campaign (from 1970s) · Dove ‘Real Beauty’ (Ogilvy & Mather, 2004 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TESTIMONIAL AD". Punchy sound design synced to every cut.
```
