# OS Window Animation

*Genie, Exposé, Snap & Flip · 2001 — 2012 · Digital, Internet & Screen*

Reference film: `videos/oswindow.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **OS Window Animation** (Genie, Exposé, Snap & Flip, 2001 — 2012; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: When GPUs began compositing the desktop, window managers turned every state change into motion: Mac OS X 10.0 (2001) shipped the genie minimise and the magnifying Dock, Exposé tiled every open window in 10.3 Panther (2003) and became Mission Control in 2011, and Windows Vista’s Aero glass (2007) brought Flip 3D, followed by drag-to-edge Aero Snap in Windows 7 (2009). The animations explain where a window went and where it came from, and their curves and timings became the reference vocabulary for UI motion design.
- Study these reference works: Mac OS X 10.0 Aqua, genie effect and Dock magnification (Apple, 2001) · Exposé in Mac OS X 10.3 Panther (2003) · Windows Vista Aero and Flip 3D (Microsoft, 2007) · Windows 7 Aero Snap (2009) · Compiz wobbly windows and desktop cube (2006)
- Motion DNA: Every transition is spatial and causal: windows zoom out of the icon that launched them and pour back into the dock that keeps them, tiles fly apart on a shared ease and return to their stacking order, a window dragged to the edge is offered a translucent half-screen and snaps into it, and a perspective stack rotates its cards one at a time.
- Visual DNA: A polished desktop of the 2000s: gradient wallpaper, translucent menu bar and glass dock with reflective rounded icons, white title bars with three coloured buttons and soft drop shadows, then a blue glass theme with tinted frames, sheen streaks, a glowing taskbar and a red close button.
- Signature transitions: Icon zoom-open, dock bounce, genie minimise, Exposé tile-out and pick, theme cross-fade, drag-to-edge snap with preview, Flip 3D cycle, settle to the front
- Key techniques: Strip-sliced genie warp, Fisheye dock magnification, Sliced perspective Flip 3D

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Strip-sliced genie warp, Fisheye dock magnification, Sliced perspective Flip 3D).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Strip-sliced genie warp and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "OS WINDOW ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Quartz Compositor / Desktop Window Manager on the GPU, Core Animation, Compiz, KWin effects, After Effects UI mock-ups, Canvas 2D (sliced warps of pre-rendered windows). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Homage — generic UI, no logos.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second OS Window Animation motion-graphics film (Genie, Exposé, Snap & Flip). Visual style: a polished desktop of the 2000s: gradient wallpaper, translucent menu bar and glass dock with reflective rounded icons, white title bars with three coloured buttons and soft drop shadows, then a blue glass theme with tinted frames, sheen streaks, a glowing taskbar and a red close button. Motion: every transition is spatial and causal: windows zoom out of the icon that launched them and pour back into the dock that keeps them, tiles fly apart on a shared ease and return to their stacking order, a window dragged to the edge is offered a translucent half-screen and snaps into it, and a perspective stack rotates its cards one at a time. Signature moves: strip-sliced genie warp, fisheye dock magnification, sliced perspective flip 3d; transitions: icon zoom-open, dock bounce, genie minimise, Exposé tile-out and pick, theme cross-fade, drag-to-edge snap with preview, Flip 3D cycle, settle to the front. In the tradition of Mac OS X 10.0 Aqua, genie effect and Dock magnification (Apple, 2001) · Exposé in Mac OS X 10.3 Panther (2003) · Windows Vista Aero and Flip 3D (Microsoft, 2007) · Windows 7 Aero Snap (2009) · Compiz wobbly windows and desktop cube (2006). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "OS WINDOW ANIMATION". Punchy sound design synced to every cut.
```
