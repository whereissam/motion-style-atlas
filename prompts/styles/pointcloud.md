# Point Cloud

*LiDAR Scans, Millions of Points · 2008 — · 3D & CGI Motion*

Reference film: `videos/pointcloud.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Point Cloud** (LiDAR Scans, Millions of Points, 2008 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The world shown as it is measured: millions of laser returns from LiDAR scanners or photogrammetry drawn as bare points, with no surfaces between them, coloured by intensity, height or range. Radiohead’s “House of Cards” video (James Frost, 2008), shot with a Velodyne scanner and structured light instead of cameras, made the look famous; survey-grade scans of cities and ruins by studios such as ScanLAB Projects, the self-driving-car sensor view and, since 2023, Gaussian-splat captures have kept it the visual shorthand for machine vision.
- Study these reference works: House of Cards (Radiohead, dir. James Frost, 2008) · Rome’s Invisible City (ScanLAB Projects for BBC One, 2015) · 3D Gaussian Splatting for Real-Time Radiance Field Rendering (Kerbl, Kopanas, Leimkühler & Drettakis, SIGGRAPH 2023)
- Motion DNA: The image accumulates rather than moves: rings of returns sweep out ten times a second from a travelling sensor, each point flashing white as it lands and cooling into its colour, while a slow camera crane and orbit lets the parallax prove the space is real; a scan plane re-colours the city as it rises, and the whole cloud can drift apart like sand and snap back.
- Visual DNA: Black void, no surfaces, only points: concentric laser rings on the road, striped facades with holes where glass ate the beam, fuzzy trees and shadowed voids behind every object; cold intensity greys and cyans switch to a rainbow range ramp; thin monospaced HUD readouts, point counts and a laser fan from the sensor.
- Signature transitions: Black → sensor sweep reveal → crane up into orbit → rising scan plane recolours by range → House-of-Cards dissolve → cloud reassembles under the title
- Key techniques: Ray-cast spinning 22-beam LiDAR, Arrival-time reveal of 200k points, z-buffered point splats, range colour

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ray-cast spinning 22-beam LiDAR, Arrival-time reveal of 200k points, z-buffered point splats, range colour).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ray-cast spinning 22-beam LiDAR and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "POINT CLOUD", held for about 1 s.

BUILD RULES
- Suggested tools: Velodyne / Ouster LiDAR + CloudCompare / Potree, Houdini or TouchDesigner point instancing, Gaussian-splat viewers (3DGS, Luma, Polycam), Canvas 2D: ray-cast scan in setup, per-frame z-buffered point splats into ImageData. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Point Cloud motion-graphics film (LiDAR Scans, Millions of Points). Visual style: black void, no surfaces, only points: concentric laser rings on the road, striped facades with holes where glass ate the beam, fuzzy trees and shadowed voids behind every object; cold intensity greys and cyans switch to a rainbow range ramp; thin monospaced HUD readouts, point counts and a laser fan from the sensor. Motion: the image accumulates rather than moves: rings of returns sweep out ten times a second from a travelling sensor, each point flashing white as it lands and cooling into its colour, while a slow camera crane and orbit lets the parallax prove the space is real; a scan plane re-colours the city as it rises, and the whole cloud can drift apart like sand and snap back. Signature moves: ray-cast spinning 22-beam lidar, arrival-time reveal of 200k points, z-buffered point splats, range colour; transitions: black → sensor sweep reveal → crane up into orbit → rising scan plane recolours by range → House-of-Cards dissolve → cloud reassembles under the title. In the tradition of House of Cards (Radiohead, dir. James Frost, 2008) · Rome’s Invisible City (ScanLAB Projects for BBC One, 2015) · 3D Gaussian Splatting for Real-Time Radiance Field Rendering (Kerbl, Kopanas, Leimkühler & Drettakis, SIGGRAPH 2023). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "POINT CLOUD". Punchy sound design synced to every cut.
```
