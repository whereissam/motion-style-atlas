# Motion Style Atlas

**[Browse the atlas →](https://whereissam.github.io/motion-style-atlas/)** · [Download the full reels](https://github.com/whereissam/motion-style-atlas/releases/tag/v1)

A catalogue of 127 motion-design styles, from Bauhaus Geometry and Saul Bass cut-paper to Slit-scan, VHS and Korean Minhwa. Each style is a 10-second film in which every frame and every sound is generated in code: Canvas 2D for the picture, Web Audio for the score. There is no footage and there are no samples.

Every style has:

- a **film**: a procedural 10 s, 1920×1080, 30 fps video with its own synthesized score
- a **chapter card**: a 3.2 s title card with the style's history, key works and techniques
- an **atlas entry**: origin, era, motion DNA, visual DNA, transitions and implementation notes
- **prompts**: a build brief for a coding model or motion designer, plus a short text-to-video prompt

## Families

| | Family | | Family |
|---|---|---|---|
| A | Graphic Design & Historical | F | Analog, Physical & Stop Motion |
| B | Typography & Text Motion | G | Digital, Internet & Screen |
| C | 2D Animation & Illustration | H | Cinematic & Film Language |
| D | 3D & CGI Motion | I | Cultural & Regional |
| E | Experimental & Generative | J | Social & Commercial |

`todo.md` lists what's built and what's queued.

## Layout

```
index.html            GitHub Pages entry; opens atlas.html
atlas.html            browsable atlas: filter, hover previews, detail view, compare up to four in sync
media/                web copy of every film (≤ ~8 MB each); what the site plays
render.html           headless render page that loads every film
js/engine.js          shared timing, easing, drawing helpers, Web Audio instruments, player
js/films-*.js         the films, three or so per file, grouped by batch
js/cards.js           chapter cards plus the reel's opening (atlas-open) and closing (atlas-end)
js/atlas-data.js      families, running order (MG.ORDER), best-of list (MG.REEL), metadata for the original 22
atlas/atlas-data.js   generated: everything atlas.html reads
atlas/posters/        generated: 640×360 poster per style
prompts/              generated: PROMPTS.md plus one file per style
tools/render.mjs      offline renderer (Chromium + ffmpeg)
tools/build-prompts.mjs
videos/               full-quality renders (~18 GB), not in git
```

To browse locally, serve the folder (`npx serve .` or `python3 -m http.server`) and open `atlas.html`.

## Film contract

Each film is a pure function of time, so scrubbing, looping, posters and offline export all use the same call:

```js
MG.film({
  id: 'destijl', dur: 10, poster: 9.4,
  fonts: [['400 80px Jost', 'DE STIJL']],   // waited on before rendering
  meta: { family, name, sub, era, origin, works, tech, accent,
          motionDNA, visualDNA, transitions, implementation, reproducibility, loopable },
  setup() { return { /* precomputed assets */ }; },
  draw(c, t, W, H, st) { /* 1920×1080 stage */ },
  score(A) { /* A.osc / pluck / chord / kick / riser … see engine.js */ },
});
```

Films must be deterministic: use `MG.rng(seed)`, `hash` and `vnoise`, never `Math.random` or `Date`.

## Rendering

You need Node 22+, ffmpeg and a Playwright Chromium headless shell. The renderer looks for the shell in the default Playwright cache; to use a different one, set `MG_CHROME` to its path.

```sh
cd tools && npm install && cd ..

node tools/render.mjs still <id> 1,5,9.4 /tmp/stills   # preview frames
node tools/render.mjs film <id...>                     # videos/<id>.mp4
node tools/render.mjs card <id...>                     # videos/cards/card-<id>.mp4 (no ids: all, incl. atlas-open/end)
node tools/render.mjs poster <id...>                   # atlas/posters/<id>.jpg
node tools/render.mjs web <id...>                      # media/<id>.mp4, the web copy the site plays
node tools/render.mjs data                             # atlas/atlas-data.js (links media/ copies)
node tools/build-prompts.mjs                           # prompts/
node tools/render.mjs reel complete                    # full reel + -share copy
node tools/render.mjs reel best                        # best-of reel + -share copy
```

`-j N` renders N films in parallel (the default is 3). Any page errors are printed per film.

## Adding a style

1. Write the film in a `js/films-*.js` file and add a `<script>` tag for that file to `render.html`.
2. Add its id to `MG.ORDER` in `js/atlas-data.js`, in its family's group.
3. Check it with `still`, then run `film`, `web`, `poster`, `data` and `build-prompts`.
4. Render only the new cards plus the opening and closing ones: `card <new ids...> atlas-open atlas-end`. Cards are numbered within their family, so adding styles at the end of a family leaves the existing cards valid. Then rebuild the reels; the `-share` copies only encode segments that are new or changed (cached in `videos/share/`).
5. Tick the style off in `todo.md`.
