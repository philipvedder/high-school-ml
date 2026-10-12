// Three.js loss-surface renderer with rolling balls, trails, paths and markers.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { terrain } from './colormap.js';
import { marchingSquares } from './plot2d.js';

const SIZE = 10;
const HEIGHT = 4;
const TRAIL_MAX = 3000;

export class Surface3D {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.className = 'surface3d';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    this.camera.position.set(9.5, 9, 11);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1.2, 0);
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 40;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dl = new THREE.DirectionalLight(0xffffff, 1.4);
    dl.position.set(6, 12, 8);
    this.scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0x94d2bd, 0.4);
    dl2.position.set(-8, 5, -6);
    this.scene.add(dl2);

    this.surfaceGroup = new THREE.Group();
    this.scene.add(this.surfaceGroup);
    this.objGroup = new THREE.Group();
    this.scene.add(this.objGroup);

    this.balls = new Set();
    this.onPick = null;
    this.active = false;
    this.raf = null;
    this.ballGeo = new THREE.SphereGeometry(1, 24, 16);

    // floor grid for orientation
    const grid = new THREE.GridHelper(SIZE * 1.2, 12, 0x16404b, 0x0a2c37);
    grid.position.y = -0.02;
    this.scene.add(grid);

    this.raycaster = new THREE.Raycaster();
    let down = null;
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', (e) => {
      if (!down || !this.onPick || !this.mesh) return;
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      const r = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.raycaster.setFromCamera(ndc, this.camera);
      const hit = this.raycaster.intersectObject(this.mesh)[0];
      if (hit) this.onPick(...this.toDomain(hit.point));
    });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setActive(a) {
    this.active = a;
    if (a && !this.raf) {
      this.resize();
      const loop = () => {
        if (!this.active) { this.raf = null; return; }
        this.raf = requestAnimationFrame(loop);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      };
      loop();
    }
  }

  // ---- coordinates ----
  toWorld(x, y, v) {
    const [x0, x1, y0, y1] = this.domain;
    return new THREE.Vector3(
      ((x - x0) / (x1 - x0) - 0.5) * SIZE,
      this.heightOf(v),
      (0.5 - (y - y0) / (y1 - y0)) * SIZE,
    );
  }
  toDomain(p) {
    const [x0, x1, y0, y1] = this.domain;
    return [x0 + (p.x / SIZE + 0.5) * (x1 - x0), y0 + (0.5 - p.z / SIZE) * (y1 - y0)];
  }
  heightOf(v) {
    const d = this.transform(v);
    const t = (d - this.dmin) / (this.dmax - this.dmin || 1);
    return Math.max(-0.3, Math.min(HEIGHT * 1.35, t * HEIGHT));
  }
  /** Bilinear interpolation of raw grid values (for paths that hug the surface). */
  valueAt(x, y) {
    const [x0, x1, y0, y1] = this.domain;
    const nx = this.nx, ny = this.ny;
    const fx = Math.max(0, Math.min(nx - 1.001, ((x - x0) / (x1 - x0)) * (nx - 1)));
    const fy = Math.max(0, Math.min(ny - 1.001, ((y - y0) / (y1 - y0)) * (ny - 1)));
    const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, w = fy - j;
    const V = this.values;
    return (V[j * nx + i] * (1 - u) + V[j * nx + i + 1] * u) * (1 - w) + (V[(j + 1) * nx + i] * (1 - u) + V[(j + 1) * nx + i + 1] * u) * w;
  }

  /**
   * Build the surface from grid values. values[j*nx+i] is the loss at (x_i, y_j).
   * opts.transform maps loss -> displayed height (e.g. log). opts.clipQuantile clips extreme heights.
   */
  setGrid(values, nx, ny, domain, { transform = (v) => v, clipQuantile = 1, contours = 16, wire = true } = {}) {
    this.values = values; this.nx = nx; this.ny = ny; this.domain = domain; this.transform = transform;
    const disp = new Float64Array(values.length);
    for (let k = 0; k < values.length; k++) disp[k] = transform(values[k]);
    const sorted = Array.from(disp).filter(isFinite).sort((a, b) => a - b);
    this.dmin = sorted[0];
    this.dmax = sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * clipQuantile))];

    this.surfaceGroup.clear();
    const pos = new Float32Array(nx * ny * 3);
    const col = new Float32Array(nx * ny * 3);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        const t = Math.max(0, Math.min(1, (disp[k] - this.dmin) / (this.dmax - this.dmin || 1)));
        pos[k * 3] = (i / (nx - 1) - 0.5) * SIZE;
        pos[k * 3 + 1] = Math.min(t, 1) * HEIGHT;
        pos[k * 3 + 2] = (0.5 - j / (ny - 1)) * SIZE;
        const c = terrain(t);
        col[k * 3] = c[0] / 255; col[k * 3 + 1] = c[1] / 255; col[k * 3 + 2] = c[2] / 255;
      }
    }
    const idx = [];
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    this.baseColors = col.slice();
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    }));
    this.surfaceGroup.add(this.mesh);

    if (wire) {
      const step = Math.max(1, Math.round((nx - 1) / 24));
      const lp = [];
      for (let j = 0; j < ny; j += step)
        for (let i = 0; i < nx - 1; i++) {
          const a = j * nx + i, b = a + 1;
          lp.push(pos[a * 3], pos[a * 3 + 1] + 0.005, pos[a * 3 + 2], pos[b * 3], pos[b * 3 + 1] + 0.005, pos[b * 3 + 2]);
        }
      for (let i = 0; i < nx; i += step)
        for (let j = 0; j < ny - 1; j++) {
          const a = j * nx + i, b = a + nx;
          lp.push(pos[a * 3], pos[a * 3 + 1] + 0.005, pos[a * 3 + 2], pos[b * 3], pos[b * 3 + 1] + 0.005, pos[b * 3 + 2]);
        }
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      this.surfaceGroup.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xe9d8a6, transparent: true, opacity: 0.08 })));
    }

    if (contours) {
      const clipped = disp.map((v) => Math.min(v, this.dmax));
      const segs = [];
      const levels = [];
      for (let k = 1; k <= contours; k++) levels.push(this.dmin + ((this.dmax - this.dmin) * k) / (contours + 1));
      const cp = [];
      for (const lv of levels) {
        segs.length = 0;
        marchingSquares(clipped, nx, ny, lv, segs);
        const yH = ((lv - this.dmin) / (this.dmax - this.dmin)) * HEIGHT + 0.015;
        for (let k = 0; k < segs.length; k += 2) {
          cp.push((segs[k] / (nx - 1) - 0.5) * SIZE, yH, (0.5 - segs[k + 1] / (ny - 1)) * SIZE);
        }
      }
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
      this.surfaceGroup.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0x001219, transparent: true, opacity: 0.4 })));
    }
  }

  /** Convenience: build from a function f(x,y). */
  setFunction(f, domain, opts = {}) {
    const n = opts.res || 110;
    const [x0, x1, y0, y1] = domain;
    const v = new Float64Array(n * n);
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) v[j * n + i] = f(x0 + ((x1 - x0) * i) / (n - 1), y0 + ((y1 - y0) * j) / (n - 1));
    this.setGrid(v, n, n, domain, opts);
  }

  // ---- balls ----
  addBall(color, { radius = 0.16, trail = true } = {}) {
    const mesh = new THREE.Mesh(this.ballGeo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, roughness: 0.3 }));
    mesh.scale.setScalar(radius);
    this.objGroup.add(mesh);
    const ball = { mesh, radius, trail: null, n: 0 };
    if (trail) {
      const g = new THREE.BufferGeometry();
      ball.trailPos = new Float32Array(TRAIL_MAX * 3);
      g.setAttribute('position', new THREE.BufferAttribute(ball.trailPos, 3));
      g.setDrawRange(0, 0);
      ball.trail = new THREE.Line(g, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
      this.objGroup.add(ball.trail);
    }
    this.balls.add(ball);
    return ball;
  }
  moveBall(ball, x, y, v, pushTrail = true) {
    const [x0, x1, y0, y1] = this.domain;
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && isFinite(v);
    ball.mesh.visible = inside;
    if (!inside) return;
    const p = this.toWorld(x, y, v);
    ball.mesh.position.set(p.x, p.y + ball.radius * 0.9, p.z);
    if (ball.trail && pushTrail && ball.n < TRAIL_MAX) {
      ball.trailPos.set([p.x, p.y + 0.04, p.z], ball.n * 3);
      ball.n++;
      ball.trail.geometry.setDrawRange(0, ball.n);
      ball.trail.geometry.attributes.position.needsUpdate = true;
      ball.trail.geometry.computeBoundingSphere();
    }
  }
  setBallColor(ball, color) {
    ball.mesh.material.color.set(color);
    ball.mesh.material.emissive.set(color);
  }
  removeBall(ball) {
    this.objGroup.remove(ball.mesh);
    ball.mesh.material.dispose();
    if (ball.trail) { this.objGroup.remove(ball.trail); ball.trail.geometry.dispose(); ball.trail.material.dispose(); }
    this.balls.delete(ball);
  }
  clearObjects() {
    for (const b of [...this.balls]) this.removeBall(b);
    for (const o of [...this.objGroup.children]) {
      this.objGroup.remove(o);
      if (o.geometry && o.geometry !== this.ballGeo) o.geometry.dispose();
      o.material?.dispose?.();
    }
  }

  /** A path that hugs the surface. pts: [[x,y], ...]; value from valueFn or the grid. */
  addPath(pts, color, valueFn = (x, y) => this.valueAt(x, y), lift = 0.05) {
    const arr = [];
    for (const [x, y] of pts) {
      const p = this.toWorld(x, y, valueFn(x, y));
      arr.push(p.x, p.y + lift, p.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color }));
    this.objGroup.add(line);
    // small dots at each point
    for (let k = 0; k < arr.length; k += 3) {
      const d = new THREE.Mesh(this.ballGeo, new THREE.MeshBasicMaterial({ color }));
      d.scale.setScalar(0.06);
      d.position.set(arr[k], arr[k + 1], arr[k + 2]);
      this.objGroup.add(d);
    }
    return line;
  }

  /** A vertical flag/pin marker. */
  addMarker(x, y, v, color = 0xe9d8a6, label = null) {
    const p = this.toWorld(x, y, v);
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 8), new THREE.MeshBasicMaterial({ color }));
    pole.position.y = 0.55;
    g.add(pole);
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 16), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 }));
    flag.rotation.x = Math.PI;
    flag.position.y = 1.25;
    g.add(flag);
    if (label) {
      const sprite = makeTextSprite(label);
      sprite.position.y = 1.65;
      g.add(sprite);
    }
    g.position.copy(p);
    this.objGroup.add(g);
    return g;
  }
}

function makeTextSprite(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 34px "Spline Sans Mono Variable", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,18,25,0.75)';
  const w = ctx.measureText(text).width + 24;
  ctx.fillRect(128 - w / 2, 8, w, 48);
  ctx.fillStyle = '#E9D8A6';
  ctx.fillText(text, 128, 33);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  s.scale.set(2, 0.5, 1);
  return s;
}
