# Loss Landscape Lab: Workshop Concept

**Audience:** 11th grade (about 16–17 years old), with school maths: functions, derivatives, maybe vectors
**Duration:** 60 minutes, with about 30 minutes of hands-on work
**Setting:** students work in pairs on laptops or tablets with the web app; one presenter screen uses the same app in *presenter mode*.

The story arc is simple and stays the same the whole time:

> **A neural network is a function with knobs (parameters).
> Learning = turning the knobs so that the error (loss) gets small.
> The loss is a landscape over the knobs, and training is a hike downhill in the fog.**

---

## 1. Timeline (60 min)

| Time | Phase | What happens | App station |
|---|---|---|---|
| 0–8 | **Hook & intro** (presenter) | "Where is AI in your life?" Show a surprising example. Ask: "How does a computer *learn*?" Introduce the neuron as "weighted vote + threshold". | Home / slides |
| 8–15 | **Be the neuron** (pairs) | Tune w₁, w₂, b by hand to separate two classes. Then XOR, which is impossible! *Aha: one neuron = one straight line.* | 1 · Neuron |
| 15–22 | **What is "wrong"?** (pairs) | Fit a line by hand and watch the error squares. Discover that every (w, b) has a loss, which gives the **loss landscape**. Take gradient steps *yourself*. | 2 · Loss |
| 22–32 | **Downhill in the fog** (pairs, game) | The blindfolded-hiker game: find the deepest valley with only local information. Teams compete. Reveal → "did you get stuck?" | 4 · Hiker |
| 32–40 | **Rolling balls** (pairs) | Learning rate too small, too big 💥, or just right. Local minima, saddle points, momentum, "rain" to see basins of attraction. | 3 · Descent |
| 40–47 | **Real networks** (pairs) | Build an MLP and train it live on circle/XOR/spiral. Watch hidden neurons learn features. "Your network has 57 parameters, so its landscape has 57 dimensions." | 5 · Network |
| 47–57 | **Our research** (presenter + students) | How do you *see* a 57-dimensional landscape? Random 2D slices, training trajectories (PCA), interpolation between solutions, symmetry. Link to current research questions at the institute. | 6 · Research |
| 57–60 | **Wrap-up** | Three take-aways, exit question ("What is the gradient for?"), and the URL so they can keep playing at home. | Home |

Stations 3 and 4 can be swapped. If time is short, drop station 3 (its ideas also appear in 2 and 4) or make station 5 a presenter demo.

---

## 2. Ideas for the interactive part

### In the app (all implemented)
1. **Be the neuron.** Hand-tune a single neuron to separate 🍎 from 🍐. The "decision line" moves while you drag. Hover a point to see the full computation `z = w₁x₁ + w₂x₂ + b → σ(z)` with real numbers.
2. **The XOR wall.** Same task with XOR data. 75 % is the maximum, which motivates hidden layers.
3. **Loss made visible.** When fitting a line, each error is drawn as a *real square* (squared error!). The total area is the loss. The line and its point in the landscape are linked, so dragging one moves the other.
4. **You are the optimizer.** The app shows ∂L/∂w and ∂L/∂b with numbers and the update rule `w ← w − η·∂L/∂w` filled in. Students press the button for each step and see the step preview as an arrow in the landscape.
5. **Goldilocks learning rate.** Too small means it takes forever, too large means zig-zag and then 💥 explosion.
6. **Blindfolded hiker** (game). The landscape is hidden in fog. You only feel your altitude and the slope. You have 12 steps to get as low as possible. Then the fog lifts in 3D and gradient descent tries the same start for comparison. High-score table for teams.
7. **Ball race.** Plain GD, momentum and Adam start from the same point. Who wins? Who gets stuck?
8. **Rain.** Drop 80 balls at random. Each ends in a valley, and colouring their start points by that valley reveals the **basins of attraction**.
9. **Trap & escape.** Get stuck in a local minimum, then escape with momentum or noise (simulated mini-batch SGD).
10. **Live MLP training.** A TensorFlow-Playground-style network with hidden-neuron thumbnails and a decision map. Students can click to add their own data points.
11. **Research views.** Random 2D slice through a real network's loss landscape, the training trajectory in PCA coordinates, linear interpolation between two trained networks (barriers / mode connectivity), and the *same* network with shuffled neurons (symmetry, so minima come in many identical copies).

### Offline add-ons (if you want variety)
- **Human neural network:** 3 students are "input neurons" and hold numbers. 2 "hidden neurons" compute a weighted sum on paper (weights on cards) and apply "if > 0 raise hand". 1 output neuron decides. It takes 5 minutes and makes "forward pass" tangible.
- **Marble in a bowl:** a salad bowl and a crumpled sheet of paper with a marble show convex vs. bumpy landscapes physically.
- **Blindfold walk:** one student, blindfolded, has to find the lowest point of a sloped floor or ramp guided only by feeling the slope with their feet. (Only if your room allows it!)
- **Exit ticket:** "Draw a landscape where gradient descent fails" on a post-it.

### Talking points for the research part
- **Why landscapes?** Training is optimization in millions of dimensions. Understanding the shape of the loss function explains *why* training works at all, when it fails, and why some solutions generalize better.
- **Visualizing the impossible:** a 2D *slice* through a random plane (Li et al., 2018, "Visualizing the Loss Landscape of Neural Nets", using filter normalization) or a plane through the training trajectory (PCA).
- **Surprises from research:**
  - Local minima are *less* of a problem in high dimensions than people feared. Saddle points are everywhere.
  - Wider networks tend to have *smoother* landscapes (try a narrow vs. a wide network in station 6!).
  - Different solutions are often connected by low-loss paths (*mode connectivity*), but *not* by straight lines. Station 6 shows the barrier.
  - **Symmetry:** swapping two hidden neurons gives the *same function* with *different parameters*. So every minimum has many identical copies, and the straight path between two copies passes over a hill.
  - Flat vs. sharp minima and generalization.
- Leave space here for *your institute's* specific results (one slide or one live demo).

---

## 3. Feature specification of the web app

### General
- Static single-page app (Vite + vanilla JS + Three.js) that runs fully client-side, so there's **no server and no tracking**. After loading it also works offline.
- Six numbered **stations** plus a **Home** page and a **Guide** page (for teachers) in the top navigation. The URL hash (`#neuron`, …) means a station can be linked or bookmarked directly.
- **DE / EN** language toggle (defaults to the browser language).
- **Presenter mode** (bigger fonts for projector) and a **fullscreen** button.
- Each station has: a title with a one-line mission, a large visualization, a control panel, **missions** (checklist that completes automatically, with confetti 🎉), and a collapsible **"The math behind it"** box.
- Responsive: works on laptops and tablets (touch supported).
- Colours: blue = low loss / class 0, orange = class 1, a terrain colormap for landscapes (deep blue valleys to red peaks).

### Station 1 · The Neuron
| Ability | Interaction | Visualization |
|---|---|---|
| Set weights w₁, w₂ and bias b | sliders (−5…5), 🎲 random | neuron diagram: edge thickness/colour = weight |
| Choose activation | step / sigmoid / tanh / ReLU | mini-plot of the activation function with the current z marked |
| Data sets | 🍎/🍐 separable, XOR, new random data | points on a 2D input map |
| Live classification | — | background coloured by neuron output, decision line w₁x₁ + w₂x₂ + b = 0, accuracy % |
| Inspect a point | hover / tap on the map | full computation with numbers in the diagram |
| Computer learns | "Let the computer learn" button | sliders move by themselves (gradient descent) |
| Missions | 100 % on 🍎/🍐 · try XOR · let the computer learn | |

### Station 2 · Loss: fitting a line
| Ability | Interaction | Visualization |
|---|---|---|
| Model y = w·x + b | drag the two handles on the line, or sliders | data space with residuals drawn as **squares** |
| Loss | — | big MSE number + bar; minimum loss shown for reference |
| Loss landscape | click/drag in the (w, b) map | heat map + contour lines, current point, trail |
| Gradient | toggle | arrow of −∇L at the current point |
| Manual gradient step | learning rate slider, "Take one step" | formula with live numbers, ghost point = preview of next step |
| Auto descent | ▶ / ⏸, reset | zig-zag in elongated valley, 💥 if η too big |
| Missions | loss below threshold by hand · minimum in ≤ 10 steps · make it explode | |

### Station 3 · Gradient descent explorer
| Ability | Interaction | Visualization |
|---|---|---|
| Landscapes | bowl, narrow valley, two valleys, bumpy, saddle, banana (Rosenbrock), 🎲 mystery | **3D surface** (rotate/zoom) + 2D contour map |
| Drop balls | click on 3D or 2D map | balls roll with trails, colours per ball |
| Optimizer | GD / Momentum / Adam, race mode (all three from one point) | colour-coded legend |
| Hyper-parameters | learning rate (log), momentum β, noise (≈ mini-batch SGD), speed | |
| Run control | ▶ / ⏸ / single step / clear | |
| Rain | 🌧 drop 80 random balls | balls & start points coloured by final valley = basins of attraction |
| Extras | gradient arrows, vector field | |
| Info | loss-vs-step chart, ball status (rolling / arrived / 💥) | |
| Missions | explode · get stuck in local minimum · escape with momentum/noise · rain | |

### Station 4 · Blindfolded hiker (game)
| Ability | Interaction | Visualization |
|---|---|---|
| Hidden random landscape | "New game" | fog; only visited spots become visible |
| Move | click inside the step circle (max step length) | path, current altitude, slope arrow |
| Difficulty | easy (slope + large sight) / hard (altitude only) | |
| Budget | 12 steps, "I'm done" | step counter, altitude chart |
| Reveal | automatic at end | fog lifts, 3D landscape with your path and 🏁 global minimum |
| Compare | "Let gradient descent try" | GD path from the same start |
| Score | 0–1000, team name, local high-score table | verdict: global minimum / stuck in a local valley / still on the slope |

### Station 5 · Neural network (MLP)
| Ability | Interaction | Visualization |
|---|---|---|
| Data sets | circle, XOR, two moons, spiral, two clouds; noise; new data | points on decision map |
| Own data | click on the map to add 🟠 / 🔵 points | |
| Architecture | 0–4 hidden layers, 1–8 neurons each; activation tanh/ReLU/sigmoid | network diagram, **each neuron shows a mini heat map of what it computes**, edges coloured by weight; parameter count |
| Training | optimizer (SGD / Momentum / Adam), learning rate, batch size, speed, ▶ / ⏸ / step / re-initialize | live decision map, loss curve, accuracy, step counter |
| Missions | circle with 1 hidden layer · XOR · spiral ≥ 95 % · own data | |

### Station 6 · Research: real loss landscapes
| Ability | Interaction | Visualization |
|---|---|---|
| Uses the network trained in station 5 | "quick-train" button if none is trained | |
| Random 2D slice | range, resolution, new random directions, filter normalization, log scale | 3D surface + contour map, ★ = trained network |
| Training trajectory | — | loss surface in the PCA plane of the trajectory, with path and explained variance |
| Interpolation | A→B (two trainings), init→trained, A→A with shuffled neurons | loss-along-the-line chart; slider t scrubs through, live decision map of the interpolated network |
| Presenter notes | collapsible | key research messages for each view |

### Guide (for teachers)
Schedule, the purpose of each station and suggested questions to ask the class. It's a short version of this document inside the app.

---

## 4. Intro slide deck (`slides.html`)

If you'd rather start with a ~30-minute math block (and shorten the station time), use the reveal.js deck. It follows this order:

1. **The neuron**: weighted sum, the decision line ($\vec w$ as normal vector), live weight tuning.
2. **Sigmoid**: confidence, smoothness, and above all differentiability (needed for gradient descent).
3. **XOR**: one neuron reaches at most 75 %, with a 3-line proof as a deep dive.
4. **Hidden layer, no activation**: still a straight line. $W_2(W_1x+b_1)+b_2$ is linear, so we need non-linearity.
5. **ReLU**: the *same* weights now solve XOR. The input → hidden-space morph shows the change of representation.
6. *(added)* **More neurons → any shape**: sums of ReLUs and the universal approximation theorem. This tells students *why* networks are powerful, and that the hard part is *finding* the weights.
7. **Who sets the knobs?** 9 vs. 100 000 vs. 175 billion parameters.
8. **Loss function and loss landscape**: the data is fixed and θ is the variable. Every point of the landscape is one classifier (linked 2D/3D figure).
9. *(added)* **Why not try everything?** $10^P$ grid points vs. $10^{80}$ atoms. This motivates *local* methods (the fog).
10. **Gradient descent**: the 1D rule $w \leftarrow w - \eta f'(w)$ with learning rate and local-minimum demos, then partial derivatives as "freeze the other variables" slices, then the gradient.
11. **Backpropagation**: chain rule as multiplying rates of change (gears), a fully worked numeric example ($x=2$, $w_1=0.5$, $w_2=1.5$ → $\partial L/\partial w_1=-9$), a "wiggle test" that checks it numerically, and one update step that lowers the loss from 2.25 to 0.018.
12. *(added)* **Training loop & optimizers**: mini-batch SGD, Momentum, Adam. These are the terms students will meet in Stations 3 and 5.
13. *(added)* **What can go wrong**: learning rate, local minima, saddles, sharp vs. flat. This is the hook for the research talk.

Suggested 60-min variant with the deck: slides 0–28 min, then Fog game + Network + Descent (25 min), then Research (7 min).
