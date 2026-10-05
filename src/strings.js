// All UI strings (English / German). Values may contain HTML.
export const STRINGS = {};
const S = (key, en, de) => { STRINGS[key] = { en, de }; };

// ---------- common ----------
S('common.math', '🧮 The math behind it', '🧮 Die Mathematik dahinter');
S('common.missions', '🎯 Missions', '🎯 Missionen');
S('common.missionDone', 'Mission complete:', 'Mission geschafft:');
S('common.dataset', 'Data set', 'Datensatz');
S('common.newData', '🎲 New data', '🎲 Neue Daten');
S('common.accuracy', 'Accuracy', 'Genauigkeit');
S('common.lr', 'Learning rate η', 'Lernrate η');
S('common.play', '▶ Run', '▶ Start');
S('common.pause', '⏸ Pause', '⏸ Pause');
S('common.train', '▶ Train', '▶ Trainieren');
S('common.step', '⏭ One step', '⏭ Ein Schritt');
S('common.steps', 'Steps', 'Schritte');
S('common.speed', 'Speed', 'Tempo');
S('common.optimizer', 'Optimizer', 'Optimierer');
S('common.clear', '🧹 Clear', '🧹 Leeren');

// ---------- nav ----------
S('nav.neuron', 'Neuron', 'Neuron');
S('nav.loss', 'Loss', 'Fehler');
S('nav.descent', 'Descent', 'Abstieg');
S('nav.hiker', 'Fog game', 'Nebelspiel');
S('nav.network', 'Network', 'Netzwerk');
S('nav.research', 'Research', 'Forschung');
S('nav.slides', 'Intro slides (math background)', 'Einführungsfolien (Mathe-Hintergrund)');
S('nav.guide', 'Guide for teachers', 'Leitfaden für Lehrkräfte');
S('nav.presenter', 'Presenter mode (larger text)', 'Präsentationsmodus (größere Schrift)');
S('nav.fullscreen', 'Fullscreen', 'Vollbild');

// ---------- home ----------
S('home.kicker', 'Math & AI workshop', 'Workshop Mathe & KI');
S('home.lead',
  'How does a computer <em>learn</em>? We go from a single artificial neuron to real neural networks, and hike through the mysterious <b>loss landscapes</b> that mathematicians are still studying today.',
  'Wie <em>lernt</em> ein Computer? Wir gehen vom einzelnen künstlichen Neuron bis zu echten neuronalen Netzen und wandern durch die geheimnisvollen <b>Verlustlandschaften</b>, die Mathematikerinnen und Mathematiker bis heute erforschen.');
S('home.start', 'Let’s go →', 'Los geht’s →');
S('home.slides', '🎞️ Intro slides', '🎞️ Einführungsfolien');
S('home.guide', '📋 Guide for teachers', '📋 Leitfaden für Lehrkräfte');
S('home.story',
  '<b>The big idea in three sentences:</b> A neural network is a function with many adjustable knobs (<em>parameters</em>). Learning means turning the knobs so that the error (<em>loss</em>) becomes small. The loss forms a landscape over all the knob positions, and training is a hike downhill in the fog.',
  '<b>Die große Idee in drei Sätzen:</b> Ein neuronales Netz ist eine Funktion mit vielen Drehknöpfen (<em>Parametern</em>). Lernen heißt, die Knöpfe so zu drehen, dass der Fehler (<em>Loss</em>) klein wird. Der Fehler bildet eine Landschaft über allen Knopfstellungen, und Training ist eine Wanderung bergab im Nebel.');
S('home.card.neuron', 'Be the neuron: tune weights by hand and separate two classes. Why does XOR fail?', 'Sei das Neuron: Stelle Gewichte von Hand ein und trenne zwei Klassen. Warum scheitert XOR?');
S('home.card.loss', 'What does “wrong” mean? Errors become squares, and every line gets a point in the loss landscape. Take gradient steps yourself.', 'Was heißt „falsch“? Fehler werden zu Quadraten, und jede Gerade wird ein Punkt in der Verlustlandschaft. Mach selbst Gradientenschritte.');
S('home.card.descent', 'Roll balls down 3D landscapes. Learning rates, local minima, momentum and Adam.', 'Lass Kugeln durch 3D-Landschaften rollen. Lernrate, lokale Minima, Momentum und Adam.');
S('home.card.hiker', 'Game: find the deepest valley in the fog with only 12 steps. Can you beat the algorithm?', 'Spiel: Finde mit nur 12 Schritten das tiefste Tal im Nebel. Schlägst du den Algorithmus?');
S('home.card.network', 'Build your own neural network and watch it learn circles, XOR and spirals live.', 'Baue dein eigenes neuronales Netz und sieh live zu, wie es Kreise, XOR und Spiralen lernt.');
S('home.card.research', 'How do researchers look at a landscape with hundreds of dimensions? Slices, trajectories, symmetries.', 'Wie betrachten Forschende eine Landschaft mit Hunderten Dimensionen? Schnitte, Trajektorien, Symmetrien.');
S('home.footer', 'Runs entirely in your browser: no data is sent anywhere.', 'Läuft komplett in deinem Browser: Es werden keine Daten verschickt.');

// ---------- guide ----------
S('guide.body', `
<h1>📋 Guide for teachers & presenters</h1>
<p>Format: 60 minutes, students in pairs on laptops or tablets. The presenter uses the same app on the projector (<b>A⁺</b> button = larger text).</p>
<h2>Schedule</h2>
<table>
<tr><th>Time</th><th>Phase</th><th>Station</th></tr>
<tr><td>0–8</td><td>Intro: Where do we meet AI? A neuron is a “weighted vote + threshold”.</td><td>Home</td></tr>
<tr><td>8–15</td><td>Be the neuron, and the XOR wall</td><td>1</td></tr>
<tr><td>15–22</td><td>Loss as squares, the loss landscape, a gradient step by hand</td><td>2</td></tr>
<tr><td>22–32</td><td>Fog game: teams compete (enter a team name!)</td><td>4</td></tr>
<tr><td>32–40</td><td>Rolling balls: learning rate, local minima, momentum, rain</td><td>3</td></tr>
<tr><td>40–47</td><td>Train a real network</td><td>5</td></tr>
<tr><td>47–57</td><td>Our research: looking at real loss landscapes</td><td>6</td></tr>
<tr><td>57–60</td><td>Wrap-up, exit question</td><td>–</td></tr>
</table>
<h2>Questions to ask the class</h2>
<ul>
<li><b>Station 1:</b> “What happens to the line when you make b larger?” · “Why can no straight line solve XOR?”</li>
<li><b>Station 2:</b> “Why do we square the errors instead of just adding them?” · “What does the arrow point to?” · “What happens with a big learning rate?”</li>
<li><b>Station 4:</b> “What strategy did you use?” · “Why didn’t the algorithm find the best valley?”</li>
<li><b>Station 3:</b> “Which optimizer wins the race, and why?” · “What do the colours in the rain picture mean?”</li>
<li><b>Station 5:</b> “What does each hidden neuron draw?” · “How many parameters does your network have?”</li>
<li><b>Station 6:</b> “How can we draw a landscape with 50 dimensions?” · “Why is there a hill between A and π(A), even though they are the same function?”</li>
</ul>
<h2>Take-aways</h2>
<ol>
<li>A neural network is a function with many parameters.</li>
<li>Learning = minimizing the loss using its gradient (steepest descent).</li>
<li>The shape of the loss landscape decides whether learning works, and that is an active research area in mathematics.</li>
</ol>
<p class="muted">Tip: mission progress is stored per browser tab. Opening a new tab resets it for the next group.</p>`,
`
<h1>📋 Leitfaden für Lehrkräfte & Vortragende</h1>
<p>Format: 60 Minuten, Schülerinnen und Schüler zu zweit an Laptops oder Tablets. Die vortragende Person nutzt dieselbe App am Beamer (Knopf <b>A⁺</b> = größere Schrift).</p>
<h2>Ablauf</h2>
<table>
<tr><th>Zeit</th><th>Phase</th><th>Station</th></tr>
<tr><td>0–8</td><td>Einstieg: Wo begegnet uns KI? Ein Neuron ist eine „gewichtete Abstimmung + Schwelle“.</td><td>Start</td></tr>
<tr><td>8–15</td><td>Sei das Neuron, und die XOR-Mauer</td><td>1</td></tr>
<tr><td>15–22</td><td>Fehler als Quadrate, Verlustlandschaft, Gradientenschritt von Hand</td><td>2</td></tr>
<tr><td>22–32</td><td>Nebelspiel: Teams treten gegeneinander an (Teamnamen eingeben!)</td><td>4</td></tr>
<tr><td>32–40</td><td>Rollende Kugeln: Lernrate, lokale Minima, Momentum, Regen</td><td>3</td></tr>
<tr><td>40–47</td><td>Ein echtes Netz trainieren</td><td>5</td></tr>
<tr><td>47–57</td><td>Unsere Forschung: echte Verlustlandschaften ansehen</td><td>6</td></tr>
<tr><td>57–60</td><td>Zusammenfassung, Abschlussfrage</td><td>–</td></tr>
</table>
<h2>Fragen an die Klasse</h2>
<ul>
<li><b>Station 1:</b> „Was passiert mit der Linie, wenn b größer wird?“ · „Warum kann keine Gerade XOR lösen?“</li>
<li><b>Station 2:</b> „Warum quadrieren wir die Fehler, statt sie einfach zu addieren?“ · „Wohin zeigt der Pfeil?“ · „Was passiert bei großer Lernrate?“</li>
<li><b>Station 4:</b> „Welche Strategie hattet ihr?“ · „Warum hat der Algorithmus nicht das beste Tal gefunden?“</li>
<li><b>Station 3:</b> „Welcher Optimierer gewinnt das Rennen, und warum?“ · „Was bedeuten die Farben im Regenbild?“</li>
<li><b>Station 5:</b> „Was zeichnet jedes versteckte Neuron?“ · „Wie viele Parameter hat euer Netz?“</li>
<li><b>Station 6:</b> „Wie zeichnet man eine Landschaft mit 50 Dimensionen?“ · „Warum gibt es einen Berg zwischen A und π(A), obwohl beide dieselbe Funktion sind?“</li>
</ul>
<h2>Kernaussagen</h2>
<ol>
<li>Ein neuronales Netz ist eine Funktion mit vielen Parametern.</li>
<li>Lernen = den Fehler mithilfe seines Gradienten minimieren (steilster Abstieg).</li>
<li>Die Form der Verlustlandschaft entscheidet, ob Lernen funktioniert, und ist ein aktives Forschungsgebiet der Mathematik.</li>
</ol>
<p class="muted">Tipp: Der Missionsfortschritt wird pro Browser-Tab gespeichert. Ein neuer Tab setzt ihn für die nächste Gruppe zurück.</p>`);

// ---------- station 1: neuron ----------
S('neuron.title', 'The Neuron', 'Das Neuron');
S('neuron.lead', 'An artificial neuron multiplies inputs by weights, adds them up and decides. Can you separate the two classes?', 'Ein künstliches Neuron multipliziert Eingaben mit Gewichten, addiert sie und entscheidet. Kannst du die beiden Klassen trennen?');
S('neuron.classA', 'Class A', 'Klasse A');
S('neuron.classB', 'Class B', 'Klasse B');
S('neuron.activation', 'Activation function', 'Aktivierungsfunktion');
S('neuron.act.step', 'Step (0 or 1)', 'Stufe (0 oder 1)');
S('neuron.ds.separable', 'Two groups', 'Zwei Gruppen');
S('neuron.random', '🎲 Random weights', '🎲 Zufällige Gewichte');
S('neuron.learn', '🤖 Let the computer learn', '🤖 Computer lernen lassen');
S('neuron.weights', 'Weights & bias', 'Gewichte & Bias');
S('neuron.m1', 'Get <b>100 %</b> on “Two groups” by hand.', 'Erreiche <b>100 %</b> bei „Zwei Gruppen“ von Hand.');
S('neuron.m2', 'Switch to <b>XOR</b> and reach 75 %. Can you get more?', 'Wechsle zu <b>XOR</b> und erreiche 75 %. Schaffst du mehr?');
S('neuron.m3', 'Let the computer find the weights.', 'Lass den Computer die Gewichte finden.');
S('neuron.explain', `
<p>The neuron computes a <b>weighted sum</b> <span class="mono">z = w₁·x₁ + w₂·x₂ + b</span> and passes it through an <b>activation function</b>, e.g. the sigmoid <span class="mono">σ(z) = 1/(1+e<sup>−z</sup>)</span>.</p>
<p>It decides “A” if z &gt; 0. The border <span class="mono">w₁x₁ + w₂x₂ + b = 0</span> is a <b>straight line</b>: (w₁, w₂) sets its direction and b shifts it.</p>
<p>That’s why one neuron can never solve XOR: no single straight line separates the diagonals. We need several neurons in layers, which is the topic of Station 5.</p>
<p>“Let the computer learn” uses <b>gradient descent</b>, which you will meet in Station 2.</p>`,
`
<p>Das Neuron berechnet eine <b>gewichtete Summe</b> <span class="mono">z = w₁·x₁ + w₂·x₂ + b</span> und gibt sie in eine <b>Aktivierungsfunktion</b>, z. B. die Sigmoidfunktion <span class="mono">σ(z) = 1/(1+e<sup>−z</sup>)</span>.</p>
<p>Es entscheidet „A“, wenn z &gt; 0. Die Grenze <span class="mono">w₁x₁ + w₂x₂ + b = 0</span> ist eine <b>Gerade</b>: (w₁, w₂) legt ihre Richtung fest, b verschiebt sie.</p>
<p>Darum kann ein einzelnes Neuron XOR nie lösen: Keine einzelne Gerade trennt die Diagonalen. Wir brauchen mehrere Neuronen in Schichten, das ist das Thema von Station 5.</p>
<p>„Computer lernen lassen“ nutzt das <b>Gradientenverfahren</b>, das du in Station 2 kennenlernst.</p>`);

// ---------- station 2: loss ----------
S('loss.title', 'What does “wrong” mean? The loss', 'Was heißt „falsch“? Der Fehler (Loss)');
S('loss.lead', 'Fit a line to the points. Every error becomes a square, and the average area is the loss. Each line is a point in the loss landscape.', 'Lege eine Gerade durch die Punkte. Jeder Fehler wird zu einem Quadrat, die mittlere Fläche ist der Loss. Jede Gerade ist ein Punkt in der Verlustlandschaft.');
S('loss.dataTitle', 'Data & model: drag the line or its handles', 'Daten & Modell: Ziehe die Gerade oder ihre Griffe');
S('loss.lsTitle', 'Loss landscape over (w, b): click or drag', 'Verlustlandschaft über (w, b): klicken oder ziehen');
S('loss.lossLabel', 'Loss (mean squared error):', 'Loss (mittlerer quadratischer Fehler):');
S('loss.best', 'best possible', 'bestmöglich');
S('loss.showSquares', 'Show error squares', 'Fehlerquadrate zeigen');
S('loss.showGrad', 'Show gradient & next step', 'Gradient & nächsten Schritt zeigen');
S('loss.model', 'Model ŷ = w·x + b', 'Modell ŷ = w·x + b');
S('loss.step', '👣 Take one step', '👣 Einen Schritt machen');
S('loss.resetStart', '↺ Start', '↺ Start');
S('loss.optimizer', '🧭 You are the optimizer', '🧭 Du bist der Optimierer');
S('loss.stepInfo', 'Gradient steps so far: <b>{n}</b>', 'Bisherige Gradientenschritte: <b>{n}</b>');
S('loss.exploded', 'Exploded!', 'Explodiert!');
S('loss.explodedHint', 'The steps got bigger and bigger: the learning rate is too large. Lower η and press ↺ Start.', 'Die Schritte wurden immer größer: Die Lernrate ist zu groß. Verkleinere η und drücke ↺ Start.');
S('loss.m1', 'Fit the line <b>by hand</b> until the loss bar turns green.', 'Passe die Gerade <b>von Hand</b> an, bis der Balken grün wird.');
S('loss.m2', 'From <b>↺ Start</b>, reach the ★ with at most <b>80 gradient steps</b>. Choose η wisely!', 'Erreiche von <b>↺ Start</b> aus den ★ mit höchstens <b>80 Gradientenschritten</b>. Wähle η klug!');
S('loss.m3', 'Find a learning rate that makes gradient descent <b>explode</b> 💥.', 'Finde eine Lernrate, bei der das Verfahren <b>explodiert</b> 💥.');
S('loss.explain', `
<p>For each point the error is <span class="mono">rᵢ = (w·xᵢ + b) − yᵢ</span>. The loss is the <b>mean of the squares</b>:</p>
<p class="mono">L(w, b) = (1/n) · Σ rᵢ²</p>
<p>L depends on the two parameters w and b. That makes it a surface over the (w, b) plane: the <b>loss landscape</b>. Training = finding its lowest point ★.</p>
<p>The <b>gradient</b> <span class="mono">∇L = (∂L/∂w, ∂L/∂b)</span> points uphill, in the direction of steepest ascent. So we step in the opposite direction:</p>
<p class="mono">w ← w − η · ∂L/∂w,&nbsp;&nbsp; b ← b − η · ∂L/∂b</p>
<p>Here <span class="mono">∂L/∂w = (2/n)·Σ rᵢ·xᵢ</span> and <span class="mono">∂L/∂b = (2/n)·Σ rᵢ</span>. The <b>learning rate η</b> sets the step size. If it’s too small you crawl, and if it’s too big you jump over the valley and blow up.</p>
<p>The valley here is long and narrow. That’s why gradient descent zig-zags, and it’s a very typical effect in real networks too.</p>`,
`
<p>Für jeden Punkt ist der Fehler <span class="mono">rᵢ = (w·xᵢ + b) − yᵢ</span>. Der Loss ist der <b>Mittelwert der Quadrate</b>:</p>
<p class="mono">L(w, b) = (1/n) · Σ rᵢ²</p>
<p>L hängt von den beiden Parametern w und b ab. Damit ist er eine Fläche über der (w, b)-Ebene: die <b>Verlustlandschaft</b>. Training = ihren tiefsten Punkt ★ finden.</p>
<p>Der <b>Gradient</b> <span class="mono">∇L = (∂L/∂w, ∂L/∂b)</span> zeigt bergauf, in Richtung des steilsten Anstiegs. Also gehen wir in die Gegenrichtung:</p>
<p class="mono">w ← w − η · ∂L/∂w,&nbsp;&nbsp; b ← b − η · ∂L/∂b</p>
<p>Dabei ist <span class="mono">∂L/∂w = (2/n)·Σ rᵢ·xᵢ</span> und <span class="mono">∂L/∂b = (2/n)·Σ rᵢ</span>. Die <b>Lernrate η</b> bestimmt die Schrittweite. Ist sie zu klein, kriechst du, ist sie zu groß, springst du über das Tal und explodierst.</p>
<p>Das Tal ist hier lang und schmal. Deshalb läuft das Verfahren im Zickzack, und das ist auch bei echten Netzen ein sehr typischer Effekt.</p>`);

// ---------- station 3: descent ----------
S('descent.title', 'Gradient descent explorer', 'Gradientenabstieg erkunden');
S('descent.lead', 'Click on a landscape to drop a ball. It always rolls in the direction of steepest descent. Where does it end up?', 'Klicke auf eine Landschaft, um eine Kugel abzusetzen. Sie rollt immer in Richtung des steilsten Abstiegs. Wo landet sie?');
S('descent.hint', '🖱️ drag = rotate · scroll = zoom · click = drop a ball', '🖱️ ziehen = drehen · scrollen = zoomen · klicken = Kugel absetzen');
S('descent.landscape', 'Landscape', 'Landschaft');
S('descent.newMystery', '🎲 New mystery landscape', '🎲 Neue Mystery-Landschaft');
S('descent.race', '🏁 Race mode: GD vs Momentum vs Adam', '🏁 Rennmodus: GD vs. Momentum vs. Adam');
S('descent.beta', 'Momentum β (inertia)', 'Momentum β (Trägheit)');
S('descent.noise', 'Noise (like mini-batch SGD)', 'Rauschen (wie Mini-Batch-SGD)');
S('descent.rain', '🌧️ Rain: 80 balls', '🌧️ Regen: 80 Kugeln');
S('descent.showGrad', 'Show gradient arrows', 'Gradientenpfeile zeigen');
S('descent.showField', 'Show vector field (−∇L)', 'Vektorfeld (−∇L) zeigen');
S('descent.optTitle', 'Optimizer settings', 'Einstellungen des Optimierers');
S('descent.balls', 'Balls', 'Kugeln');
S('descent.noBalls', 'Click on the 3D landscape or the map to drop a ball.', 'Klicke auf die 3D-Landschaft oder die Karte, um eine Kugel abzusetzen.');
S('descent.m1', 'Make a ball <b>explode</b> 💥 (learning rate too large).', 'Lass eine Kugel <b>explodieren</b> 💥 (Lernrate zu groß).');
S('descent.m2', 'Get a ball <b>stuck in a local minimum</b>.', 'Lass eine Kugel in einem <b>lokalen Minimum steckenbleiben</b>.');
S('descent.m3', '<b>Escape</b> a local minimum with Momentum, Adam or noise (try “Two valleys” or “Bumpy”).', '<b>Entkomme</b> einem lokalen Minimum mit Momentum, Adam oder Rauschen (probiere „Zwei Täler“ oder „Hügelig“).');
S('descent.m4', 'Let it <b>rain</b> and discover the basins of attraction.', 'Lass es <b>regnen</b> und entdecke die Einzugsgebiete.');
S('descent.explain', `
<p><b>Gradient descent (GD):</b> <span class="mono">θ ← θ − η·∇L(θ)</span>, a step against the gradient.</p>
<p><b>Momentum:</b> the ball has inertia: <span class="mono">v ← β·v + ∇L,&nbsp; θ ← θ − η·v</span>. It can roll through small dips and is faster in narrow valleys.</p>
<p><b>Adam:</b> adapts the step size separately for every direction (using running averages of the gradient and of its square). It is the most common optimizer for neural networks.</p>
<p><b>Noise:</b> real networks compute the gradient on a small random <em>mini-batch</em> of the data, so it is “noisy”. That noise can help to escape bad valleys!</p>
<p><b>Rain:</b> every point of the map belongs to the valley that GD reaches from there. These regions are called <b>basins of attraction</b>.</p>
<p><b>Saddle point:</b> a point that goes downhill in one direction and uphill in another. The gradient there is (almost) zero, so GD becomes very slow. In high dimensions saddle points are much more common than local minima.</p>`,
`
<p><b>Gradientenabstieg (GD):</b> <span class="mono">θ ← θ − η·∇L(θ)</span>, ein Schritt gegen den Gradienten.</p>
<p><b>Momentum:</b> Die Kugel hat Trägheit: <span class="mono">v ← β·v + ∇L,&nbsp; θ ← θ − η·v</span>. Sie kann durch kleine Mulden rollen und ist in schmalen Tälern schneller.</p>
<p><b>Adam:</b> passt die Schrittweite für jede Richtung einzeln an (mit gleitenden Mittelwerten des Gradienten und seines Quadrats). Adam ist der meistgenutzte Optimierer für neuronale Netze.</p>
<p><b>Rauschen:</b> Echte Netze berechnen den Gradienten auf einem kleinen zufälligen <em>Mini-Batch</em> der Daten, er ist also „verrauscht“. Dieses Rauschen kann helfen, schlechten Tälern zu entkommen!</p>
<p><b>Regen:</b> Jeder Punkt der Karte gehört zu dem Tal, das GD von dort erreicht. Diese Gebiete heißen <b>Einzugsgebiete</b> (basins of attraction).</p>
<p><b>Sattelpunkt:</b> ein Punkt, an dem es in eine Richtung bergab und in eine andere bergauf geht. Der Gradient ist dort (fast) null, deshalb wird GD sehr langsam. In hohen Dimensionen sind Sattelpunkte viel häufiger als lokale Minima.</p>`);
S('ls.bowl', 'Bowl (convex)', 'Schüssel (konvex)');
S('ls.valley', 'Narrow valley', 'Schmales Tal');
S('ls.twovalleys', 'Two valleys', 'Zwei Täler');
S('ls.bumpy', 'Bumpy (many minima)', 'Hügelig (viele Minima)');
S('ls.saddle', 'Saddle point', 'Sattelpunkt');
S('ls.banana', 'Banana valley (Rosenbrock)', 'Bananental (Rosenbrock)');
S('ls.mystery', '🎲 Mystery landscape', '🎲 Mystery-Landschaft');

// ---------- station 4: hiker ----------
S('hiker.title', 'The blindfolded hiker', 'Wandern mit verbundenen Augen');
S('hiker.lead', 'You are standing on a mountain in thick fog. You only feel the slope under your feet. Find the deepest valley in 12 steps!', 'Du stehst im dichten Nebel auf einem Berg. Du spürst nur die Neigung unter deinen Füßen. Finde in 12 Schritten das tiefste Tal!');
S('hiker.locked', 'The landscape is revealed at the end of the game', 'Die Landschaft wird am Ende des Spiels enthüllt');
S('hiker.altitude', 'Altitude', 'Höhe');
S('hiker.difficulty', 'Difficulty', 'Schwierigkeit');
S('hiker.easy', '🙂 Easy: slope arrow', '🙂 Leicht: Neigungspfeil');
S('hiker.hard', '🔥 Hard: altitude only', '🔥 Schwer: nur Höhe');
S('hiker.team', 'Team name', 'Teamname');
S('hiker.newGame', '🎲 New game', '🎲 Neues Spiel');
S('hiker.done', '🏁 I’m done', '🏁 Fertig');
S('hiker.gd', '🤖 Let gradient descent try', '🤖 Gradientenverfahren probieren lassen');
S('hiker.rulesTitle', 'Rules', 'Regeln');
S('hiker.rules', 'Click inside the dashed circle to take a step. The orange arrow shows the direction of steepest descent. You can only see where you have been. Your score depends on how low you end up.', 'Klicke in den gestrichelten Kreis, um einen Schritt zu machen. Der orange Pfeil zeigt die Richtung des steilsten Abstiegs. Du siehst nur, wo du schon warst. Deine Punktzahl hängt davon ab, wie tief du am Ende stehst.');
S('hiker.highscores', '🏆 High scores (this device)', '🏆 Bestenliste (dieses Gerät)');
S('hiker.clearScores', 'Clear list', 'Liste leeren');
S('hiker.clearConfirm', 'Click again to confirm', 'Zum Bestätigen erneut klicken');
S('hiker.noScores', 'No scores yet. Be the first!', 'Noch keine Einträge. Sei die oder der Erste!');
S('hiker.anon', 'Anonymous', 'Anonym');
S('hiker.start', 'Start', 'Start');
S('hiker.globalMin', 'Lowest point', 'Tiefster Punkt');
S('hiker.playing', 'Feel your way downhill… The landscape is hidden in fog.', 'Taste dich bergab… Die Landschaft liegt im Nebel.');
S('hiker.gdResult', 'Gradient descent from the same start reached {alt} m.', 'Das Gradientenverfahren erreichte vom selben Start aus {alt} m.');
S('hiker.youWin', '<b>You beat the algorithm! 🎉</b>', '<b>Du hast den Algorithmus geschlagen! 🎉</b>');
S('hiker.tie', '<b>A tie!</b>', '<b>Unentschieden!</b>');
S('hiker.gdWins', '<b>The algorithm wins this time.</b>', '<b>Diesmal gewinnt der Algorithmus.</b>');
S('hiker.verdict.global', '<b>Fantastic: you found the global minimum!</b>', '<b>Fantastisch: Du hast das globale Minimum gefunden!</b>');
S('hiker.verdict.local', '<b>You’re stuck in a local valley.</b> Downhill in every direction, but there was a deeper valley elsewhere.', '<b>Du steckst in einem lokalen Tal fest.</b> Ringsum geht es bergauf, aber woanders gab es ein tieferes Tal.');
S('hiker.verdict.slope', '<b>You’re still on a slope.</b> A few more steps would have taken you further down.', '<b>Du stehst noch am Hang.</b> Ein paar Schritte mehr hätten dich weiter nach unten gebracht.');
S('hiker.m1', 'Finish a game.', 'Beende ein Spiel.');
S('hiker.m2', 'Score more than <b>900</b> points.', 'Erreiche mehr als <b>900</b> Punkte.');
S('hiker.m3', '<b>Beat gradient descent</b> from the same start.', '<b>Schlage das Gradientenverfahren</b> vom selben Start aus.');
S('hiker.explain', `
<p>This is exactly the situation of a training algorithm. It can’t see the whole landscape: computing the loss everywhere would take far too long, because real networks have <b>millions of dimensions</b>.</p>
<p>It only knows the loss and the <b>gradient</b> (the slope) at the current point. That’s <em>local</em> information.</p>
<p>Gradient descent always goes straight downhill, so it ends in the valley whose <b>basin</b> it started in. That’s not necessarily the deepest one!</p>
<p>Humans sometimes use clever strategies such as exploring first or taking big jumps. Optimizers do similar things: momentum, noise, restarts, adaptive learning rates…</p>`,
`
<p>Genau in dieser Lage ist ein Trainingsalgorithmus. Er sieht nicht die ganze Landschaft: Den Loss überall auszurechnen würde viel zu lange dauern, denn echte Netze haben <b>Millionen von Dimensionen</b>.</p>
<p>Er kennt nur den Loss und den <b>Gradienten</b> (die Neigung) am aktuellen Punkt. Das ist <em>lokale</em> Information.</p>
<p>Das Gradientenverfahren geht immer direkt bergab und landet deshalb in dem Tal, in dessen <b>Einzugsgebiet</b> es gestartet ist. Das ist nicht unbedingt das tiefste!</p>
<p>Menschen nutzen manchmal clevere Strategien, etwa erst erkunden oder große Sprünge machen. Optimierer tun Ähnliches: Momentum, Rauschen, Neustarts, adaptive Lernraten…</p>`);

// ---------- station 5: network ----------
S('network.title', 'Neural network', 'Neuronales Netz');
S('network.lead', 'Several neurons in layers can draw curved borders. Build a network and watch it learn!', 'Mehrere Neuronen in Schichten können gekrümmte Grenzen zeichnen. Baue ein Netz und sieh ihm beim Lernen zu!');
S('network.noise', 'Noise', 'Rauschen');
S('network.clearData', '🧽 Empty', '🧽 Leeren');
S('network.clickAdds', 'Click on the map adds:', 'Klick auf die Karte fügt hinzu:');
S('network.data', 'Data', 'Daten');
S('network.layers', 'Hidden layers', 'Versteckte Schichten');
S('network.neurons', 'Neurons per layer', 'Neuronen pro Schicht');
S('network.arch', 'Architecture', 'Architektur');
S('network.batch', 'Batch size', 'Batchgröße');
S('network.fullBatch', 'All data (full batch)', 'Alle Daten (Full Batch)');
S('network.perFrame', 'steps/frame', 'Schritte/Frame');
S('network.reinit', '↺ New start', '↺ Neustart');
S('network.training', 'Training', 'Training');
S('network.input', 'Input', 'Eingabe');
S('network.output', 'Output', 'Ausgabe');
S('network.hidden', 'Hidden layers', 'Versteckte Schichten');
S('network.paramCount', '<b>{n}</b> parameters', '<b>{n}</b> Parameter');
S('network.dims', 'The loss landscape of this network lives in <b>{n} dimensions</b>!', 'Die Verlustlandschaft dieses Netzes lebt in <b>{n} Dimensionen</b>!');
S('network.toResearch', '🔬 Look at this network’s landscape →', '🔬 Landschaft dieses Netzes ansehen →');
S('network.m1', 'Solve the <b>circle</b> (≥ 97 %) with only <b>one</b> hidden layer.', 'Löse den <b>Kreis</b> (≥ 97 %) mit nur <b>einer</b> versteckten Schicht.');
S('network.m2', 'Solve <b>XOR</b> (≥ 97 %). What is the smallest network that works?', 'Löse <b>XOR</b> (≥ 97 %). Was ist das kleinste Netz, das funktioniert?');
S('network.m3', 'Tame the <b>spiral</b> (≥ 95 %).', 'Bezwinge die <b>Spirale</b> (≥ 95 %).');
S('network.m4', 'Add your own data points by clicking on the map.', 'Füge eigene Datenpunkte per Klick auf die Karte hinzu.');
S('network.explain', `
<p>Each hidden neuron works like the neuron in Station 1: weighted sum + activation. The next layer combines their outputs. Straight lines become curves, curves become islands…</p>
<p>The small pictures show what each neuron “sees”: its output for every point of the plane.</p>
<p>The output neuron gives a probability <span class="mono">p</span> for “orange”. The loss is the <b>cross-entropy</b> <span class="mono">L = −[y·log p + (1−y)·log(1−p)]</span>, averaged over all points. It is large when the network is confidently wrong.</p>
<p>The gradient with respect to <em>all</em> weights is computed by <b>backpropagation</b>: the chain rule from calculus, applied layer by layer from back to front.</p>
<p>Every weight and bias is a parameter. All of them together form one point in a high-dimensional space, and the loss is a landscape over that space.</p>`,
`
<p>Jedes versteckte Neuron funktioniert wie das Neuron aus Station 1: gewichtete Summe + Aktivierung. Die nächste Schicht kombiniert ihre Ausgaben. Aus Geraden werden Kurven, aus Kurven werden Inseln…</p>
<p>Die kleinen Bilder zeigen, was jedes Neuron „sieht“: seine Ausgabe für jeden Punkt der Ebene.</p>
<p>Das Ausgabeneuron liefert eine Wahrscheinlichkeit <span class="mono">p</span> für „orange“. Der Loss ist die <b>Kreuzentropie</b> <span class="mono">L = −[y·log p + (1−y)·log(1−p)]</span>, gemittelt über alle Punkte. Sie ist groß, wenn das Netz sich sicher irrt.</p>
<p>Den Gradienten bezüglich <em>aller</em> Gewichte berechnet die <b>Backpropagation</b>: die Kettenregel aus der Analysis, Schicht für Schicht von hinten nach vorne angewendet.</p>
<p>Jedes Gewicht und jeder Bias ist ein Parameter. Alle zusammen bilden einen Punkt in einem hochdimensionalen Raum, und der Loss ist eine Landschaft über diesem Raum.</p>`);
S('ds.circle', 'Circle', 'Kreis');
S('ds.xor', 'XOR', 'XOR');
S('ds.moons', 'Two moons', 'Zwei Monde');
S('ds.spiral', 'Spiral', 'Spirale');
S('ds.blobs', 'Two clouds', 'Zwei Wolken');

// ---------- station 6: research ----------
S('research.title', 'Research: real loss landscapes', 'Forschung: echte Verlustlandschaften');
S('research.lead', 'Your network from Station 5 has dozens of parameters. How can we look at a landscape with so many dimensions? We cut 2D slices through it!', 'Dein Netz aus Station 5 hat Dutzende Parameter. Wie betrachtet man eine Landschaft mit so vielen Dimensionen? Wir schneiden 2D-Scheiben heraus!');
S('research.untrained', 'The network from Station 5 has not been trained yet.', 'Das Netz aus Station 5 ist noch nicht trainiert.');
S('research.untrainedHint', 'Train it there first, or let the computer do it quickly.', 'Trainiere es zuerst dort, oder lass den Computer das schnell erledigen.');
S('research.goTrain', '← Go to Station 5', '← Zu Station 5');
S('research.quickTrain', '⚡ Quick-train now', '⚡ Jetzt schnell trainieren');
S('research.tab.slice', 'Random slice', 'Zufälliger Schnitt');
S('research.tab.traj', 'Training path', 'Trainingspfad');
S('research.tab.interp', 'Between solutions', 'Zwischen Lösungen');
S('research.view', 'View', 'Ansicht');
S('research.range', 'Range (distance from ★)', 'Bereich (Abstand vom ★)');
S('research.resolution', 'Resolution', 'Auflösung');
S('research.filterNorm', 'Filter normalization (Li et al. 2018)', 'Filter-Normalisierung (Li et al. 2018)');
S('research.log', 'Logarithmic height', 'Logarithmische Höhe');
S('research.compute', '⚙️ Compute', '⚙️ Berechnen');
S('research.newDirs', '🎲 New random directions', '🎲 Neue Zufallsrichtungen');
S('research.sliceSettings', 'Slice settings', 'Einstellungen des Schnitts');
S('research.interpMode', 'Which straight line?', 'Welche Gerade?');
S('research.mode.twoRuns', 'A → B: two separate trainings', 'A → B: zwei getrennte Trainings');
S('research.mode.init', 'Start → trained network', 'Start → trainiertes Netz');
S('research.mode.perm', 'A → A with shuffled neurons', 'A → A mit vertauschten Neuronen');
S('research.interpSettings', 'Interpolation θ(t) = (1−t)·θ₀ + t·θ₁', 'Interpolation θ(t) = (1−t)·θ₀ + t·θ₁');
S('research.notesTitle', '🎓 Research notes', '🎓 Forschungsnotizen');
S('research.training', 'Training…', 'Training…');
S('research.trainingB', 'Training a second network B from a different random start…', 'Trainiere ein zweites Netz B mit anderem zufälligem Start…');
S('research.computing', 'Computing the loss for every grid point…', 'Berechne den Loss für jeden Gitterpunkt…');
S('research.noTraj', 'No training path recorded yet. Train the network in Station 5 first.', 'Noch kein Trainingspfad aufgezeichnet. Trainiere zuerst das Netz in Station 5.');
S('research.init', 'Start', 'Start');
S('research.trained', 'trained', 'trainiert');
S('research.permNeedsHidden', 'This needs a hidden layer with at least 2 neurons.', 'Dafür braucht man eine versteckte Schicht mit mindestens 2 Neuronen.');
S('research.interpIntro', 'Choose a straight line through parameter space and press <b>Compute</b>.', 'Wähle eine Gerade durch den Parameterraum und drücke <b>Berechnen</b>.');
S('research.sliceInfo',
  'Network <b>{arch}</b> with <b>{n}</b> parameters. The ★ is your trained network θ*. Every other point is a different network <span class="mono">θ* + α·δ + β·η</span>, where δ and η are two random directions in the {n}-dimensional parameter space.',
  'Netz <b>{arch}</b> mit <b>{n}</b> Parametern. Der ★ ist dein trainiertes Netz θ*. Jeder andere Punkt ist ein anderes Netz <span class="mono">θ* + α·δ + β·η</span>, wobei δ und η zwei Zufallsrichtungen im {n}-dimensionalen Parameterraum sind.');
S('research.trajInfo',
  'The white path is the route training took through the {n}-dimensional space, projected onto the plane that captures it best (principal component analysis). PC 1 explains <b>{e1} %</b> and PC 2 <b>{e2} %</b> of the movement. The training path is almost two-dimensional!',
  'Der weiße Pfad ist der Weg, den das Training durch den {n}-dimensionalen Raum genommen hat, projiziert auf die Ebene, die ihn am besten einfängt (Hauptkomponentenanalyse). PC 1 erklärt <b>{e1} %</b> und PC 2 <b>{e2} %</b> der Bewegung. Der Trainingspfad ist fast zweidimensional!');
S('research.interpInfo.twoRuns',
  'A and B are two trained networks that started from different random values. Along the straight line between them the loss rises by up to <b>{barrier}</b>: there is a <b>barrier</b>. Move the slider t and watch the decision map in the middle of the line. Research shows that A and B are often connected by a <em>curved</em> low-loss path (“mode connectivity”).',
  'A und B sind zwei trainierte Netze, die mit verschiedenen Zufallswerten gestartet sind. Entlang der Geraden zwischen ihnen steigt der Loss um bis zu <b>{barrier}</b>: Es gibt eine <b>Barriere</b>. Bewege den Regler t und beobachte die Entscheidungskarte in der Mitte der Geraden. Die Forschung zeigt, dass A und B oft durch einen <em>gekrümmten</em> Weg mit kleinem Loss verbunden sind („Mode Connectivity“).');
S('research.interpInfo.init',
  'From the random start (t = 0) to the trained network (t = 1). Surprisingly, the loss often decreases quite smoothly along this straight line (Goodfellow et al. 2015), even though training took a winding path. Here the maximum rise above the endpoints is <b>{barrier}</b>.',
  'Vom zufälligen Start (t = 0) zum trainierten Netz (t = 1). Überraschenderweise fällt der Loss entlang dieser Geraden oft recht gleichmäßig (Goodfellow et al. 2015), obwohl das Training einen kurvigen Weg genommen hat. Hier beträgt der größte Anstieg über die Endpunkte <b>{barrier}</b>.');
S('research.interpInfo.perm',
  'π(A) is <b>exactly the same function</b> as A: we only swapped the order of the hidden neurons (look at t = 0 and t = 1). Yet in between the loss rises by <b>{barrier}</b>! Because of this <b>symmetry</b>, every minimum exists in many identical copies, and that is one reason why loss landscapes are so complex.',
  'π(A) ist <b>exakt dieselbe Funktion</b> wie A: Wir haben nur die Reihenfolge der versteckten Neuronen vertauscht (vergleiche t = 0 und t = 1). Trotzdem steigt der Loss dazwischen um <b>{barrier}</b>! Wegen dieser <b>Symmetrie</b> existiert jedes Minimum in vielen identischen Kopien, und das ist ein Grund, warum Verlustlandschaften so komplex sind.');
S('research.notes.slice', `
<ul>
<li>We can’t draw dozens of dimensions. But we <b>can</b> cut a 2D plane through the landscape and draw the loss on it.</li>
<li><b>Filter normalization</b> (Li, Xu, Taylor, Studer, Goldstein, 2018) scales the random directions to the size of each neuron’s weights. Only then can landscapes of different networks be compared fairly.</li>
<li><b>Try it:</b> train a narrow network (e.g. 1 layer, 2 neurons) and a wide one (2 layers, 8 neurons) in Station 5 and compare the slices. Wider networks usually have <b>smoother, wider valleys</b>.</li>
<li><b>Flat vs. sharp minima:</b> networks in wide, flat valleys tend to generalize better to new data. This is an active research question!</li>
<li>Click “New random directions”: each slice looks a bit different, but the overall character stays.</li>
</ul>`,
`
<ul>
<li>Dutzende Dimensionen können wir nicht zeichnen. Aber wir <b>können</b> eine 2D-Ebene durch die Landschaft legen und den Loss darauf zeichnen.</li>
<li><b>Filter-Normalisierung</b> (Li, Xu, Taylor, Studer, Goldstein, 2018) skaliert die Zufallsrichtungen auf die Größe der Gewichte jedes Neurons. Erst dann kann man Landschaften verschiedener Netze fair vergleichen.</li>
<li><b>Probiere:</b> Trainiere in Station 5 ein schmales Netz (z. B. 1 Schicht, 2 Neuronen) und ein breites (2 Schichten, 8 Neuronen) und vergleiche die Schnitte. Breitere Netze haben meist <b>glattere, breitere Täler</b>.</li>
<li><b>Flache vs. spitze Minima:</b> Netze in breiten, flachen Tälern verallgemeinern oft besser auf neue Daten. Das ist eine aktive Forschungsfrage!</li>
<li>Klicke „Neue Zufallsrichtungen“: Jeder Schnitt sieht etwas anders aus, aber der Gesamtcharakter bleibt.</li>
</ul>`);
S('research.notes.traj', `
<ul>
<li>During training we saved snapshots of all parameters. <b>Principal component analysis (PCA)</b> finds the two directions in which the parameters moved the most.</li>
<li>Surprise: although the space has many dimensions, the training path lies almost entirely in a <b>low-dimensional</b> subspace.</li>
<li>Compare optimizers: train with SGD, Momentum and Adam in Station 5 and look at the paths here.</li>
<li>With large learning rates you often see the path oscillate across a valley. That’s the same zig-zag as in Station 2!</li>
</ul>`,
`
<ul>
<li>Während des Trainings haben wir Schnappschüsse aller Parameter gespeichert. Die <b>Hauptkomponentenanalyse (PCA)</b> findet die zwei Richtungen, in denen sich die Parameter am meisten bewegt haben.</li>
<li>Überraschung: Obwohl der Raum viele Dimensionen hat, liegt der Trainingspfad fast vollständig in einem <b>niedrigdimensionalen</b> Unterraum.</li>
<li>Vergleiche Optimierer: Trainiere in Station 5 mit SGD, Momentum und Adam und sieh dir die Pfade hier an.</li>
<li>Bei großen Lernraten sieht man oft, wie der Pfad quer durch ein Tal pendelt. Das ist derselbe Zickzack wie in Station 2!</li>
</ul>`);
S('research.notes.interp', `
<ul>
<li>The simplest 1D slice: a <b>straight line</b> between two parameter vectors, <span class="mono">θ(t) = (1−t)θ₀ + tθ₁</span>.</li>
<li><b>Two trainings A → B:</b> different random starts lead to different minima, usually with a barrier in between. But they are often connected by <em>curved</em> valleys (Garipov et al. 2018, Draxler et al. 2018: “mode connectivity”).</li>
<li><b>Permutation symmetry:</b> swapping two hidden neurons (together with their weights) doesn’t change the function. A layer with k neurons has k! = 1·2·…·k equivalent copies of every solution. With 8 neurons that’s 40 320 copies!</li>
<li>Current research asks whether, <em>after</em> undoing this symmetry, all good solutions lie in one connected valley (Entezari et al. 2022, “Git Re-Basin” 2023).</li>
<li>Room for <b>your institute’s</b> research here!</li>
</ul>`,
`
<ul>
<li>Der einfachste 1D-Schnitt: eine <b>Gerade</b> zwischen zwei Parametervektoren, <span class="mono">θ(t) = (1−t)θ₀ + tθ₁</span>.</li>
<li><b>Zwei Trainings A → B:</b> Verschiedene Zufallsstarts führen zu verschiedenen Minima, meist mit einer Barriere dazwischen. Sie sind aber oft durch <em>gekrümmte</em> Täler verbunden (Garipov et al. 2018, Draxler et al. 2018: „Mode Connectivity“).</li>
<li><b>Permutationssymmetrie:</b> Vertauscht man zwei versteckte Neuronen (samt ihren Gewichten), ändert sich die Funktion nicht. Eine Schicht mit k Neuronen hat k! = 1·2·…·k gleichwertige Kopien jeder Lösung. Bei 8 Neuronen sind das 40 320 Kopien!</li>
<li>Aktuelle Forschung fragt, ob <em>nach</em> Herausrechnen dieser Symmetrie alle guten Lösungen in einem einzigen zusammenhängenden Tal liegen (Entezari et al. 2022, „Git Re-Basin“ 2023).</li>
<li>Hier ist Platz für die Forschung <b>eures Instituts</b>!</li>
</ul>`);
