# Loss Landscape Lab

An interactive web app for a 60-minute **Math & AI workshop** (11th grade). It goes from a single neuron, through loss and gradient descent, to real neural networks and their loss landscapes.

- 📋 Didactic concept, schedule and full feature spec: **[WORKSHOP.md](WORKSHOP.md)**
- 🌐 Bilingual (DE/EN), presenter mode, works on laptops and tablets
- 🔒 100 % client-side: no backend, no tracking, works offline once loaded

| # | Station | What students do |
|---|---|---|
| 1 | Neuron | Tune w₁, w₂, b by hand and hit the XOR wall |
| 2 | Loss | Drag a line, see errors as squares, take gradient steps by hand in the (w, b) landscape |
| 3 | Descent | Roll balls on 3D landscapes: learning rate, local minima, saddle, momentum/Adam race, rain (basins of attraction) |
| 4 | Fog game | Find the deepest valley blindfolded in 12 steps, then compare with gradient descent. High-score table |
| 5 | Network | Train an MLP live (circle, XOR, moons, spiral) with neuron thumbnails |
| 6 | Research | Random 2D slices (filter-normalized), training trajectory in PCA plane, interpolation & permutation symmetry |

## Run locally

Requires Node.js ≥ 20.

```bash
npm install
npm run dev        # http://localhost:5173 with hot reload
npm run build      # production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
```

## Deploy on Netlify

The repo already contains `netlify.toml` (build command `npm run build`, publish directory `dist`, Node 22), so there is nothing to configure.

### Option A: Git-connected (recommended, auto-deploys on every push)
1. Put the project into a Git repository and push it to GitHub/GitLab/Bitbucket:
   ```bash
   git init && git add . && git commit -m "Loss Landscape Lab"
   git remote add origin <your-repo-url> && git push -u origin main
   ```
2. On [app.netlify.com](https://app.netlify.com): **Add new site → Import an existing project**, then pick the repository.
3. Netlify reads `netlify.toml` automatically. Click **Deploy**.
4. Optional: **Site configuration → Change site name** (e.g. `mpi-loss-landscape.netlify.app`) or add a custom domain.

### Option B: Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init          # first time: create/link a site
netlify deploy --build          # draft URL to check
netlify deploy --build --prod   # live
```

### Option C: Drag & drop (no account linking needed)
Run `npm run build`, then drag the `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

The build uses relative paths (`base: './'`) and hash routing (`#neuron`, `#research`, …), so `dist/` also works from any static host or a USB stick (open it with `npx vite preview` or any local web server).

## Workshop-day tips
- Give students a QR code to the URL, or deep links like `…/#hiker` for a specific station.
- **A⁺** in the top bar makes text bigger for the projector, and **⛶** switches to fullscreen.
- Mission progress is stored per browser tab (sessionStorage). Fog-game high scores are stored per device (localStorage) and can be cleared in the app.
- Station 6 uses the network trained in Station 5. If nobody trained one, the "Quick-train" button does it in a few seconds.

## Code structure
```
src/
  main.js            navigation, routing, language & presenter toggles
  strings.js         all UI text (EN + DE), so edit wording here
  i18n.js            tiny translation helper
  lib/
    nn.js            MLP with manual backprop (flat parameter vector)
    optim.js         GD / Momentum / Adam
    landscapes.js    synthetic 2D landscapes with analytic gradients
    datasets.js      toy classification data
    lab.js           shared network/trainer between stations 5 and 6
    surface3d.js     Three.js surface, balls, trails, markers
    plot2d.js        canvas heat maps + marching-squares contours
    linechart.js     loss curves
    ui.js            sliders, toggles, missions, confetti
  stations/          one file per station (+ home/guide)
```

To add your institute's own content, put research text in `research.notes.*` in `src/strings.js` and talking points in `guide.body`.
