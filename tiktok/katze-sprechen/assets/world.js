// 3D world for "Was wäre, wenn deine Katze sprechen könnte?"
// Everything on screen is a pure function of the seek time t (renderAt).
import * as THREE from "./three.module.min.js";

const T = window.HF_TIMING;
const S = (id) => T.lines[id].s;
const E = (id) => T.lines[id].e;
const CRASH = T.marks.crash;

// ------------------------------------------------------------------ helpers
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = {
  lin: (u) => u,
  inOut: (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
  out: (u) => 1 - Math.pow(1 - u, 3),
  in: (u) => u * u * u,
  back: (u) => {
    const c = 1.9;
    return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
  },
};
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

// ------------------------------------------------------------------ renderer
const canvas = document.getElementById("world-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1080, 1920, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.05, 120);

const INK = new THREE.Color("#1d1a26");
const grad = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter;
grad.needsUpdate = true;

const matCache = new Map();
function toon(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!matCache.has(key))
    matCache.set(key, new THREE.MeshToonMaterial({ color, gradientMap: grad, ...extra }));
  return matCache.get(key);
}
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

// mesh with an inverted-hull outline (thickness in world units, before parent scale)
function part(geom, color, { outline = 0.022, shadow = true, mat = null } = {}) {
  const m = new THREE.Mesh(geom, mat || toon(color));
  m.castShadow = shadow;
  m.receiveShadow = true;
  if (outline > 0) {
    geom.computeBoundingSphere();
    const r = Math.max(geom.boundingSphere.radius, 0.01);
    const o = new THREE.Mesh(geom, inkMat);
    o.scale.setScalar(1 + outline / r);
    m.add(o);
  }
  return m;
}
const box = (w, h, d, color, o) => part(new THREE.BoxGeometry(w, h, d), color, o);
const sph = (r, color, o) => part(new THREE.SphereGeometry(r, 28, 20), color, o);
const cyl = (r1, r2, h, color, o) => part(new THREE.CylinderGeometry(r1, r2, h, 24), color, o);
const at = (obj, x, y, z) => (obj.position.set(x, y, z), obj);

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 4;
  return tx;
}

// ------------------------------------------------------------------ lights
const hemi = new THREE.HemisphereLight("#ffffff", "#8a7a6a", 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight("#fff1d6", 2.2);
sun.position.set(9, 14, 10);
sun.target.position.set(3, 0, -1);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 50 });
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const lampLight = new THREE.PointLight("#ffb35c", 0, 6, 1.6);
lampLight.position.set(10.85, 1.1, -3.55);
scene.add(lampLight);
const moonLight = new THREE.DirectionalLight("#8ea6ff", 0);
moonLight.position.set(12, 7, 4);
moonLight.target.position.set(9.6, 0, -2.8);
scene.add(moonLight, moonLight.target);

// ------------------------------------------------------------------ world
const world = new THREE.Group();
scene.add(world);

// ground + house base
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), toon("#7cc576"));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
ground.receiveShadow = true;
world.add(ground);
world.add(at(box(18.6, 0.3, 6.6, "#e8e0d0", { outline: 0.03 }), 3, -0.16, -1));

function floorTex(kind) {
  return canvasTex(512, 512, (g, w, h) => {
    if (kind === "checker") {
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          g.fillStyle = (x + y) % 2 ? "#f3efe2" : "#2fa79a";
          g.fillRect(x * 64, y * 64, 64, 64);
        }
    } else if (kind === "wood") {
      g.fillStyle = "#c98f5a";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? "#bf8350" : "#d39b66";
        g.fillRect(0, i * 64 + 4, w, 56);
        g.fillStyle = "#8a5a33";
        g.fillRect((i * 173) % w, i * 64, 4, 64);
      }
    } else {
      g.fillStyle = "#b9b3e3";
      g.fillRect(0, 0, w, h);
    }
  });
}
function floor(x0, x1, z0, z1, kind, rep) {
  const tx = floorTex(kind);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(rep[0], rep[1]);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), toon("#ffffff", { map: tx }));
  m.rotation.x = -Math.PI / 2;
  m.position.set((x0 + x1) / 2, 0.001, (z0 + z1) / 2);
  m.receiveShadow = true;
  world.add(m);
}
floor(-6, 0, -4, 2, "checker", [4, 4]);
floor(0, 7.2, -4, 2, "wood", [3, 3]);
floor(7.2, 12, -4, 2, "carpet", [1, 1]);

const WALL_H = 2.8;
function wall(x0, x1, z0, z1, color, y0 = 0, y1 = WALL_H) {
  const w = Math.max(Math.abs(x1 - x0), 0.15);
  const d = Math.max(Math.abs(z1 - z0), 0.15);
  world.add(
    at(box(w, y1 - y0, d, color, { outline: 0.02 }), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2),
  );
}
// back wall with a door gap at x 5.1..6.1
wall(-6, 0, -4.07, -3.93, "#f7d65a");
wall(0, 5.1, -4.07, -3.93, "#f6c9a0");
wall(6.1, 7.2, -4.07, -3.93, "#f6c9a0");
wall(5.1, 6.1, -4.07, -3.93, "#f6c9a0", 2.15, WALL_H);
wall(7.2, 12, -4.07, -3.93, "#6f7fd6");
wall(-6.07, -5.93, -4, 2, "#f7d65a");
wall(7.13, 7.27, -4, 2, "#6f7fd6");
wall(11.93, 12.07, -4, 2, "#6f7fd6");

// windows (sky panels on the wall face)
const skyMat = new THREE.MeshBasicMaterial({ color: "#9fdcff" });
function windowOn(x, y, w, h, z = -3.92) {
  const g = new THREE.Group();
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(w, h), skyMat);
  g.add(sky);
  const fr = "#ffffff";
  g.add(at(box(w + 0.12, 0.08, 0.06, fr), 0, h / 2, 0.02));
  g.add(at(box(w + 0.12, 0.08, 0.06, fr), 0, -h / 2, 0.02));
  g.add(at(box(0.08, h, 0.06, fr), -w / 2, 0, 0.02));
  g.add(at(box(0.08, h, 0.06, fr), w / 2, 0, 0.02));
  g.add(at(box(0.05, h, 0.04, fr), 0, 0, 0.02));
  g.add(at(box(w, 0.05, 0.04, fr), 0, 0, 0.02));
  g.position.set(x, y, z);
  world.add(g);
  return g;
}
windowOn(-3.1, 1.75, 1.5, 1.05);
world.add(at(box(0.45, 1.3, 0.08, "#f29e38"), -4.05, 1.75, -3.86));
world.add(at(box(0.45, 1.3, 0.08, "#f29e38"), -2.15, 1.75, -3.86));
windowOn(2.0, 1.75, 1.1, 0.9);
const bedWin = windowOn(11.0, 1.65, 1.1, 1.2);
const moon = new THREE.Mesh(
  new THREE.CircleGeometry(0.17, 32),
  new THREE.MeshBasicMaterial({ color: "#fff6c8" }),
);
moon.position.set(0.25, 0.25, 0.01);
moon.visible = false;
bedWin.add(moon);

// ---------------- kitchen
world.add(at(box(3.9, 0.88, 0.65, "#39b8a8"), -3.1, 0.44, -3.62));
world.add(at(box(4.0, 0.07, 0.74, "#f4f1ea"), -3.1, 0.915, -3.62));
for (const x of [-4.5, -3.55, -2.6, -1.65])
  world.add(at(box(0.8, 0.62, 0.02, "#2f9f92", { outline: 0.012 }), x, 0.45, -3.285));
world.add(at(box(0.85, 2.0, 0.7, "#a8dde9"), -5.45, 1.0, -3.6));
world.add(at(box(0.05, 0.5, 0.06, "#1d1a26", { outline: 0 }), -5.15, 1.25, -3.22));
world.add(at(box(0.3, 0.22, 0.02, "#ffffff", { outline: 0.01 }), -5.5, 1.5, -3.24));
world.add(at(cyl(0.012, 0.012, 0.5, "#1d1a26", { outline: 0 }), -4.6, 2.55, -2.6));
world.add(at(part(new THREE.ConeGeometry(0.3, 0.25, 24, 1, true), "#2fb3a6"), -4.6, 2.2, -2.6));

// mug, pot, coffee stream, shards, puddle
function makeMug() {
  const g = new THREE.Group();
  g.add(at(cyl(0.075, 0.07, 0.15, "#ffffff"), 0, 0.075, 0));
  g.add(at(cyl(0.077, 0.077, 0.035, "#e8505b", { outline: 0 }), 0, 0.085, 0));
  const h = part(new THREE.TorusGeometry(0.045, 0.014, 8, 16), "#ffffff", { outline: 0.008 });
  h.position.set(0.085, 0.08, 0);
  g.add(h);
  const coffee = at(cyl(0.065, 0.065, 0.01, "#6b3b22", { outline: 0 }), 0, 0.14, 0);
  g.add(coffee);
  g.userData.coffee = coffee;
  return g;
}
const mug = makeMug();
world.add(mug);
const pot = new THREE.Group();
pot.add(
  at(
    part(new THREE.CylinderGeometry(0.12, 0.13, 0.26, 24), "#cdeef7", {
      mat: new THREE.MeshToonMaterial({
        color: "#cdeef7",
        gradientMap: grad,
        transparent: true,
        opacity: 0.6,
      }),
    }),
    0,
    0.13,
    0,
  ),
);
pot.add(at(cyl(0.11, 0.12, 0.16, "#6b3b22", { outline: 0 }), 0, 0.08, 0));
pot.add(at(cyl(0.13, 0.13, 0.05, "#1d1a26", { outline: 0 }), 0, 0.27, 0));
pot.add(at(box(0.04, 0.18, 0.04, "#1d1a26", { outline: 0 }), 0.16, 0.15, 0));
world.add(pot);
const stream = cyl(0.016, 0.016, 1, "#6b3b22", { outline: 0, shadow: false });
world.add(stream);
const shards = [];
for (let i = 0; i < 9; i++) {
  const s = part(
    new THREE.TetrahedronGeometry(0.035 + rand() * 0.03),
    i % 3 === 0 ? "#e8505b" : "#ffffff",
    { outline: 0.008 },
  );
  const a = rand() * Math.PI * 2;
  const sp = 0.6 + rand() * 0.9;
  s.userData.v = [Math.cos(a) * sp, 1.1 + rand() * 1.4, Math.sin(a) * sp];
  s.userData.spin = [rand() * 9, rand() * 9, rand() * 9];
  world.add(s);
  shards.push(s);
}
const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), toon("#6b3b22"));
puddle.rotation.x = -Math.PI / 2;
world.add(puddle);

// ---------------- living room
world.add(at(box(3.0, 0.012, 2.0, "#e9c46a", { outline: 0 }), 3.4, 0.006, -2.4));
world.add(at(box(2.2, 0.45, 0.85, "#d8473f"), 3.4, 0.225, -3.45));
world.add(at(box(2.2, 0.62, 0.25, "#d8473f"), 3.4, 0.71, -3.8));
world.add(at(box(0.25, 0.65, 0.85, "#c23b34"), 2.18, 0.325, -3.45));
world.add(at(box(0.25, 0.65, 0.85, "#c23b34"), 4.62, 0.325, -3.45));
world.add(at(box(0.95, 0.1, 0.62, "#e45b52", { outline: 0.012 }), 2.9, 0.5, -3.38));
world.add(at(box(0.95, 0.1, 0.62, "#e45b52", { outline: 0.012 }), 3.9, 0.5, -3.38));
world.add(at(box(1.2, 0.07, 0.62, "#8a5a33"), 3.3, 0.4, -1.9));
for (const [dx, dz] of [
  [-0.5, -0.24],
  [0.5, -0.24],
  [-0.5, 0.24],
  [0.5, 0.24],
])
  world.add(at(cyl(0.03, 0.03, 0.38, "#6b4226", { outline: 0.01 }), 3.3 + dx, 0.19, -1.9 + dz));
world.add(at(box(0.9, 0.65, 0.04, "#ffffff"), 3.4, 1.85, -3.9));
world.add(at(box(0.7, 0.45, 0.02, "#f29e38", { outline: 0 }), 3.4, 1.85, -3.87));
world.add(at(cyl(0.22, 0.17, 0.4, "#e07a5f"), 6.7, 0.2, -3.5));
for (let i = 0; i < 5; i++)
  world.add(
    at(
      sph(0.2, "#5fb35a"),
      6.7 + Math.cos(i * 1.3) * 0.15,
      0.6 + i * 0.13,
      -3.5 + Math.sin(i * 1.3) * 0.15,
    ),
  );
world.add(at(cyl(0.02, 0.02, 1.5, "#1d1a26", { outline: 0 }), 1.3, 0.75, -3.6));
world.add(
  at(part(new THREE.CylinderGeometry(0.16, 0.26, 0.32, 24, 1, true), "#f7d65a"), 1.3, 1.6, -3.6),
);
// door
world.add(at(box(0.1, 2.2, 0.2, "#ffffff"), 5.05, 1.1, -4.0));
world.add(at(box(0.1, 2.2, 0.2, "#ffffff"), 6.15, 1.1, -4.0));
const doorPivot = new THREE.Group();
doorPivot.position.set(5.12, 0, -3.97);
const doorPanel = box(0.96, 2.1, 0.07, "#3d7be0");
doorPanel.position.set(0.48, 1.05, 0);
doorPivot.add(doorPanel);
doorPanel.add(at(sph(0.045, "#f7d65a", { outline: 0.01 }), 0.36, -0.05, 0.06));
world.add(doorPivot);
world.add(at(box(0.9, 0.012, 0.5, "#8a5a33", { outline: 0 }), 5.6, 0.006, -3.5));

// tuna boxes
const labelTex = canvasTex(256, 160, (g, w, h) => {
  g.fillStyle = "#c9945c";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#e6c08a";
  g.fillRect(0, 62, w, 36);
  g.fillStyle = "#1d1a26";
  g.font = "bold 38px sans-serif";
  g.textAlign = "center";
  g.fillText("THUNFISCH", w / 2, 92);
});
const boxMats = [
  toon("#c9945c"),
  toon("#c9945c"),
  toon("#c9945c"),
  toon("#c9945c"),
  toon("#ffffff", { map: labelTex }),
  toon("#c9945c"),
];
function tunaBox(w = 0.8, h = 0.5, d = 0.6) {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, boxMats);
  m.castShadow = m.receiveShadow = true;
  const o = new THREE.Mesh(g, inkMat);
  o.scale.setScalar(1 + 0.02 / 0.5);
  m.add(o);
  return m;
}
const tower = new THREE.Group();
for (let i = 0; i < 10; i++) {
  const b = tunaBox();
  b.position.set((rand() - 0.5) * 0.12, 0.95 + i * 0.5, 0);
  b.rotation.y = (rand() - 0.5) * 0.3;
  tower.add(b);
}
tower.add(at(cyl(0.06, 0.06, 0.9, "#2b4c9b"), -0.16, 0.45, 0));
tower.add(at(cyl(0.06, 0.06, 0.9, "#2b4c9b"), 0.16, 0.45, 0));
tower.add(at(sph(0.08, "#fbfbf7"), -0.44, 1.15, 0.12));
tower.add(at(sph(0.08, "#fbfbf7"), 0.44, 1.15, 0.12));
tower.position.set(5.6, 0, -4.9);
world.add(tower);
const pile = new THREE.Group();
for (let i = 0; i < 4; i++) {
  const b = tunaBox();
  b.position.set(i < 2 ? 0 : 0.85 * (i - 2.5), 0.25 + (i < 2 ? i * 0.5 : 0), i < 2 ? 0 : 0.55);
  b.rotation.y = -Math.PI / 2 + (rand() - 0.5) * 0.25;
  pile.add(b);
}
pile.position.set(6.55, 0, -2.4);
world.add(pile);
const heldBox = tunaBox(0.6, 0.4, 0.45);
world.add(heldBox);

// ---------------- bedroom
world.add(at(box(1.55, 0.4, 2.35, "#a8744a"), 9.6, 0.2, -2.85));
world.add(at(box(1.55, 1.0, 0.12, "#a8744a"), 9.6, 0.5, -4.0));
world.add(at(box(1.45, 0.2, 2.25, "#ffffff"), 9.6, 0.5, -2.85));
world.add(at(box(0.8, 0.14, 0.42, "#f4f1ea"), 9.6, 0.67, -3.62));
const blanket = box(1.52, 0.12, 1.55, "#4f6edb");
blanket.position.set(9.6, 0.86, -2.3);
world.add(blanket);
world.add(at(box(0.5, 0.55, 0.45, "#a8744a"), 10.85, 0.275, -3.6));
world.add(at(cyl(0.05, 0.08, 0.25, "#f4f1ea", { outline: 0.01 }), 10.85, 0.68, -3.6));
const lampShade = new THREE.Mesh(
  new THREE.CylinderGeometry(0.12, 0.18, 0.2, 24),
  new THREE.MeshBasicMaterial({ color: "#ffd38a" }),
);
lampShade.position.set(10.85, 0.9, -3.6);
world.add(lampShade);

// ------------------------------------------------------------------ characters
const SKIN = "#fbfbf7";
function limb(len, r, color) {
  const pivot = new THREE.Group();
  const c = cyl(r, r, len, color, { outline: 0.014 });
  c.position.y = -len / 2;
  pivot.add(c);
  return pivot;
}
function makePerson({ shirt, hair, glasses }) {
  const root = new THREE.Group();
  const P = { root };
  P.legL = limb(0.82, 0.05, "#1d1a26");
  P.legR = limb(0.82, 0.05, "#1d1a26");
  P.legL.position.set(0.13, 0.85, 0);
  P.legR.position.set(-0.13, 0.85, 0);
  for (const L of [P.legL, P.legR]) {
    const shoe = sph(0.1, "#3d7be0", { outline: 0.014 });
    shoe.scale.set(1.1, 0.65, 1.6);
    shoe.position.set(0, -0.84, 0.06);
    L.add(shoe);
    root.add(L);
  }
  P.body = new THREE.Group();
  P.body.position.y = 0.85;
  root.add(P.body);
  P.body.add(at(part(new THREE.CapsuleGeometry(0.28, 0.32, 8, 20), shirt), 0, 0.33, 0));
  P.armL = limb(0.6, 0.042, "#1d1a26");
  P.armR = limb(0.6, 0.042, "#1d1a26");
  P.armL.position.set(0.31, 0.62, 0);
  P.armR.position.set(-0.31, 0.62, 0);
  for (const A of [P.armL, P.armR]) {
    A.add(at(sph(0.075, SKIN, { outline: 0.014 }), 0, -0.62, 0));
    P.body.add(A);
  }
  P.neck = new THREE.Group();
  P.neck.position.y = 0.72;
  P.body.add(P.neck);
  P.head = new THREE.Group();
  P.head.position.y = 0.4;
  P.neck.add(P.head);
  P.head.add(sph(0.42, SKIN, { outline: 0.024 }));
  const cheekMat = toon("#f6a9a6");
  for (const s of [-1, 1]) {
    const ch = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), cheekMat);
    ch.scale.set(1.3, 0.7, 0.4);
    ch.position.set(s * 0.25, -0.1, 0.33);
    P.head.add(ch);
  }
  P.eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 16, 12),
      new THREE.MeshBasicMaterial({ color: INK }),
    );
    e.position.set(s * 0.15, 0.04, 0.39);
    P.head.add(e);
    P.eyes.push(e);
  }
  P.bags = [];
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI),
      new THREE.MeshBasicMaterial({ color: "#7b5ea7" }),
    );
    b.rotation.z = Math.PI;
    b.position.set(s * 0.15, -0.03, 0.4);
    b.visible = false;
    P.head.add(b);
    P.bags.push(b);
  }
  if (glasses) {
    const gm = new THREE.MeshBasicMaterial({ color: INK });
    P.glasses = new THREE.Group();
    for (const s of [-1, 1]) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.016, 8, 28), gm);
      t.position.set(s * 0.15, 0.04, 0.4);
      P.glasses.add(t);
    }
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8), gm);
    br.rotation.z = Math.PI / 2;
    br.position.set(0, 0.06, 0.41);
    P.glasses.add(br);
    P.head.add(P.glasses);
  }
  const mm = new THREE.MeshBasicMaterial({ color: INK });
  P.smile = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 8, 20, Math.PI), mm);
  P.smile.rotation.z = Math.PI;
  P.smile.position.set(0, -0.12, 0.385);
  P.head.add(P.smile);
  P.flat = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 8), mm);
  P.flat.rotation.z = Math.PI / 2;
  P.flat.position.set(0, -0.18, 0.38);
  P.head.add(P.flat);
  P.oMouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 12),
    new THREE.MeshBasicMaterial({ color: "#5a1f2b" }),
  );
  P.oMouth.scale.set(0.9, 1.25, 0.35);
  P.oMouth.position.set(0, -0.2, 0.37);
  P.head.add(P.oMouth);
  P.sweat = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 12),
    new THREE.MeshBasicMaterial({ color: "#8fd3f5" }),
  );
  P.sweat.scale.set(0.8, 1.3, 0.6);
  P.sweat.position.set(0.33, 0.12, 0.25);
  P.head.add(P.sweat);
  if (hair === "spiky") {
    for (let i = 0; i < 6; i++) {
      const c = part(new THREE.ConeGeometry(0.07, 0.2, 10), "#7a4a2a", { outline: 0.012 });
      const a = -0.6 + i * 0.24;
      c.position.set(Math.sin(a) * 0.3, 0.38, -0.05 + Math.cos(a * 2) * 0.05);
      c.rotation.z = -a * 0.8;
      P.head.add(c);
    }
  } else {
    const h = sph(0.45, "#5b3a29", { outline: 0.02 });
    h.scale.set(1.02, 1.0, 0.95);
    h.position.set(0, 0.06, -0.08);
    P.head.add(h);
    const tail = sph(0.2, "#5b3a29", { outline: 0.015 });
    tail.position.set(0, -0.15, -0.38);
    tail.scale.set(1, 1.6, 1);
    P.head.add(tail);
    const bow = sph(0.07, "#f7d65a", { outline: 0.012 });
    bow.position.set(0.25, 0.34, -0.1);
    P.head.add(bow);
  }
  return P;
}
function poseReset(P) {
  P.root.position.set(0, -50, 0);
  P.root.rotation.set(0, 0, 0);
  P.root.scale.set(1, 1, 1);
  for (const k of ["legL", "legR", "armL", "armR", "neck", "head", "body"])
    P[k].rotation.set(0, 0, 0);
  P.armL.rotation.z = 0.12;
  P.armR.rotation.z = -0.12;
  P.head.scale.set(1, 1, 1);
  P.head.position.y = 0.4;
  for (const e of P.eyes) e.scale.set(1, 1, 1);
  for (const b of P.bags) b.visible = false;
  if (P.glasses) P.glasses.position.y = 0;
  P.smile.visible = true;
  P.flat.visible = false;
  P.oMouth.visible = false;
  P.sweat.visible = false;
}
function blink(P, t, off) {
  const ph = (t + off) % 3.4;
  if (ph < 0.12) for (const e of P.eyes) e.scale.y = 0.15;
}
function face(P, kind) {
  P.smile.visible = kind === "smile";
  P.flat.visible = kind === "flat";
  P.oMouth.visible = kind === "o";
}
function tinyEyes(P) {
  for (const e of P.eyes) e.scale.set(0.45, 0.45, 0.45);
}
function sitPose(P, x, z, ry = 0) {
  P.root.position.set(x, 0.55 - 0.85, z);
  P.root.rotation.y = ry;
  P.legL.rotation.x = -1.45;
  P.legR.rotation.x = -1.45;
}
function walk(P, t, speed = 7) {
  const s = Math.sin(t * speed);
  P.legL.rotation.x = s * 0.55;
  P.legR.rotation.x = -s * 0.55;
  P.armL.rotation.x = -s * 0.45;
  P.armR.rotation.x = s * 0.45;
  P.root.position.y += Math.abs(Math.cos(t * speed)) * 0.04;
}
function breathe(P, t) {
  P.body.scale.y = 1 + Math.sin(t * 2.4) * 0.012;
}

const kevin = makePerson({ shirt: "#22a58b", hair: "spiky", glasses: true });
const lisa = makePerson({ shirt: "#e86fa5", hair: "long", glasses: false });
scene.add(kevin.root, lisa.root);

const FUR = "#f39a3c";
function makeCat() {
  const root = new THREE.Group();
  const C = { root };
  const body = sph(0.25, FUR, { outline: 0.02 });
  body.scale.set(1, 1.15, 0.95);
  body.position.y = 0.27;
  root.add(body);
  const belly = sph(0.17, "#fbe9cf", { outline: 0 });
  belly.scale.set(0.85, 1.1, 0.5);
  belly.position.set(0, 0.27, 0.17);
  root.add(belly);
  for (const s of [-1, 1]) {
    const h = sph(0.14, FUR, { outline: 0.015 });
    h.position.set(s * 0.17, 0.12, -0.02);
    root.add(h);
  }
  C.paws = [];
  for (const s of [-1, 1]) {
    const pv = new THREE.Group();
    pv.position.set(s * 0.09, 0.05, 0.17);
    const p = sph(0.07, FUR, { outline: 0.012 });
    p.scale.set(1, 0.6, 1.3);
    pv.add(p);
    root.add(pv);
    C.paws.push(pv);
  }
  C.tail = new THREE.Group();
  C.tail.position.set(0, 0.08, -0.2);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.02, 0.15, -0.2),
    new THREE.Vector3(0.08, 0.42, -0.24),
    new THREE.Vector3(0.16, 0.56, -0.12),
  ]);
  const tm = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.045, 10), toon(FUR));
  tm.castShadow = true;
  C.tail.add(tm);
  C.tail.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.062, 10), inkMat));
  root.add(C.tail);
  C.head = new THREE.Group();
  C.head.position.set(0, 0.56, 0.04);
  root.add(C.head);
  const hd = sph(0.22, FUR, { outline: 0.02 });
  hd.scale.set(1.12, 0.95, 1);
  C.head.add(hd);
  for (const s of [-1, 1]) {
    const ear = part(new THREE.ConeGeometry(0.08, 0.17, 4), FUR, { outline: 0.014 });
    ear.position.set(s * 0.14, 0.2, -0.01);
    ear.rotation.set(0, Math.PI / 4, -s * 0.35);
    C.head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 4), toon("#f4a7a3"));
    inner.position.set(s * 0.14, 0.19, 0.035);
    inner.rotation.set(0, Math.PI / 4, -s * 0.35);
    C.head.add(inner);
  }
  for (const x of [-0.04, 0, 0.04]) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.07, 0.01), toon("#c9671f"));
    st.position.set(x, 0.15, 0.17);
    st.rotation.x = -0.6;
    C.head.add(st);
  }
  const muzzle = sph(0.1, "#fbe9cf", { outline: 0 });
  muzzle.scale.set(1.3, 0.8, 0.8);
  muzzle.position.set(0, -0.08, 0.16);
  C.head.add(muzzle);
  C.head.add(at(sph(0.025, "#f07c8f", { outline: 0 }), 0, -0.035, 0.235));
  C.eyeMat = new THREE.MeshToonMaterial({
    color: "#d6e04a",
    gradientMap: grad,
    emissive: "#000000",
  });
  C.lids = [];
  C.eyes = [];
  for (const s of [-1, 1]) {
    const eg = new THREE.Group();
    eg.position.set(s * 0.085, 0.03, 0.17);
    const ey = new THREE.Mesh(new THREE.SphereGeometry(0.058, 20, 14), C.eyeMat);
    eg.add(ey);
    const pu = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 12, 10),
      new THREE.MeshBasicMaterial({ color: INK }),
    );
    pu.scale.set(0.6, 2.0, 0.6);
    pu.position.z = 0.05;
    eg.add(pu);
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.064, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      toon(FUR),
    );
    eg.add(lid);
    const lidLine = new THREE.Mesh(
      new THREE.TorusGeometry(0.064, 0.008, 6, 24, Math.PI),
      new THREE.MeshBasicMaterial({ color: INK }),
    );
    lidLine.rotation.x = Math.PI / 2;
    lid.add(lidLine);
    C.head.add(eg);
    C.lids.push(lid);
    C.eyes.push(eg);
  }
  C.mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 16, 12),
    new THREE.MeshBasicMaterial({ color: "#5a1f2b" }),
  );
  C.mouth.position.set(0, -0.115, 0.205);
  C.head.add(C.mouth);
  const wm = new THREE.MeshBasicMaterial({ color: INK });
  for (const s of [-1, 1])
    for (const k of [0, 1]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 4), wm);
      w.rotation.z = Math.PI / 2 + s * (k ? -0.15 : 0.12);
      w.position.set(s * 0.2, -0.07 - k * 0.03, 0.17);
      C.head.add(w);
    }
  C.phone = new THREE.Group();
  const scr = canvasTex(256, 480, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#22a58b";
    g.fillRect(0, 0, w, 90);
    g.fillStyle = "#ffffff";
    g.font = "bold 34px sans-serif";
    g.textAlign = "center";
    g.fillText("BESTELLT", w / 2, 60);
    g.fillStyle = "#1d1a26";
    g.font = "bold 40px sans-serif";
    g.fillText("30 kg", w / 2, 220);
    g.fillText("Thunfisch", w / 2, 270);
    g.fillStyle = "#e8505b";
    g.font = "bold 46px sans-serif";
    g.fillText("1.237 €", w / 2, 380);
  });
  C.phone.add(box(0.16, 0.3, 0.025, "#1d1a26", { outline: 0.008 }));
  const sm = new THREE.Mesh(
    new THREE.PlaneGeometry(0.14, 0.26),
    new THREE.MeshBasicMaterial({ map: scr }),
  );
  sm.position.z = 0.014;
  C.phone.add(sm);
  C.phone.position.set(0, 0.36, 0.3);
  C.phone.rotation.x = -0.5;
  root.add(C.phone);
  return C;
}
const cat = makeCat();
scene.add(cat.root);
function catReset(C) {
  C.root.position.set(0, -50, 0);
  C.root.rotation.set(0, 0, 0);
  C.head.rotation.set(0, 0, 0);
  C.tail.rotation.set(0, 0, 0);
  for (const l of C.lids) l.rotation.x = 0.3;
  for (const p of C.paws) p.position.y = 0.05;
  C.mouth.scale.set(1, 0.05, 0.5);
  C.eyeMat.emissive.set("#000000");
  C.phone.visible = false;
}
function catTalk(C, t, id) {
  const env = T.mouth[id];
  if (!env) return;
  const i = Math.floor((t - S(id)) * 30);
  const v = i >= 0 && i < env.length ? env[i] : 0;
  C.mouth.scale.set(1, 0.05 + v * 1.1, 0.5);
  C.head.rotation.x = -v * 0.08;
}
function catIdle(C, t) {
  C.tail.rotation.z = Math.sin(t * 2.2) * 0.35;
  C.tail.rotation.x = Math.sin(t * 1.3) * 0.15;
  const ph = (t + 1.1) % 4.1;
  if (ph < 0.14) for (const l of C.lids) l.rotation.x = 1.5;
}
const catLookAt = (fromX, fromZ, toX, toZ) => Math.atan2(toX - fromX, toZ - fromZ);

// ------------------------------------------------------------------ shots
// cam: [px, py, pz, tx, ty, tz, fov, roll]
const SHOTS = [];
function shot(t0, t1, from, to, e = "inOut", opts = {}) {
  SHOTS.push({ t0, t1, from, to, e, ...opts });
}
function orbit(cx, cy, cz, r, h, a0, a1, fov) {
  return (u) => {
    const a = lerp(a0, a1, u);
    return [cx + Math.sin(a) * r, h, cz + Math.cos(a) * r, cx, cy, cz, fov, 0];
  };
}
const k1 = S("L1") + 1.25;
const N = (id) => T.marks[id];
// Day 1 - kitchen
shot(
  0,
  k1,
  [-0.6, 5.2, 4.2, -2.6, 0.9, -3.0, 44, 0],
  [-1.7, 2.9, 1.4, -2.6, 1.0, -3.1, 44, 0],
  "inOut",
);
shot(
  k1,
  N("d1"),
  [-1.4, 1.1, -2.0, -2.0, 1.4, -3.7, 40, 0.04],
  [-1.55, 1.15, -2.3, -2.0, 1.4, -3.7, 38, 0.02],
  "out",
);
shot(
  N("d1"),
  S("L2") + 2.0,
  [-0.8, 1.55, -3.0, -3.4, 1.15, -3.35, 44, 0],
  [-1.25, 1.5, -3.1, -3.4, 1.15, -3.35, 40, 0],
  "inOut",
);
shot(
  S("L2") + 2.0,
  S("L3"),
  [-4.3, 2.75, -0.9, -2.0, 1.35, -3.7, 42, 0],
  [-4.2, 2.7, -1.1, -2.0, 1.4, -3.7, 38, 0],
  "out",
);
shot(
  S("L3"),
  E("L3") + 0.45,
  [-2.35, 1.62, -2.0, -2.0, 1.45, -3.7, 32, 0],
  [-2.3, 1.6, -2.25, -2.0, 1.45, -3.7, 30, 0],
  "lin",
);
shot(
  E("L3") + 0.45,
  S("L4") + 0.7,
  [-3.0, 2.05, -3.86, -3.0, 1.9, -2.55, 66, 0],
  [-3.0, 2.05, -3.84, -3.0, 1.92, -2.55, 58, 0],
  "out",
  { shake: [E("L3") + 0.55, 0.35] },
);
shot(
  S("L4") + 0.7,
  N("d2"),
  [-2.2, 0.26, -2.3, -3.05, 0.45, -3.05, 58, 0.08],
  [-2.35, 0.22, -2.45, -3.05, 0.4, -3.05, 54, 0.1],
  "out",
  { shake: [CRASH, 0.3] },
);
// Day 2 - couch
shot(
  N("d2"),
  S("L5") + 1.35,
  [3.6, 1.35, 1.0, 3.6, 0.95, -3.3, 50, 0],
  [3.6, 1.3, 0.3, 3.6, 0.95, -3.3, 46, 0],
  "inOut",
);
shot(
  S("L5") + 1.35,
  S("L6"),
  [2.75, 1.9, -0.9, 3.3, 1.6, -3.3, 38, -0.1],
  [2.8, 1.88, -1.15, 3.3, 1.6, -3.3, 34, -0.14],
  "out",
);
shot(S("L6"), N("d5"), null, null, "inOut", {
  fn: orbit(3.5, 1.4, -3.4, 3.0, 1.85, 0.75, -0.55, 44),
});
// Day 5 - parcel
shot(
  N("d5"),
  S("L7") + 1.35,
  [3.0, 0.4, -1.9, 5.6, 1.2, -3.9, 52, 0],
  [3.2, 0.45, -2.1, 5.6, 1.25, -3.9, 50, 0],
  "out",
);
shot(
  S("L7") + 1.35,
  S("L8"),
  [5.0, 0.35, -8.6, 5.6, 1.0, -4.5, 52, 0],
  [5.15, 0.6, -9.6, 5.6, 4.6, -4.9, 54, 0],
  "inOut",
);
shot(
  S("L8"),
  S("L8") + 1.9,
  [3.9, 0.8, -1.4, 3.9, 0.95, -3.35, 42, 0],
  [3.9, 0.85, -1.75, 3.9, 0.95, -3.35, 40, 0],
  "out",
);
shot(
  S("L8") + 1.9,
  N("d9"),
  [5.5, 1.9, -1.5, 5.6, 1.75, -3.2, 42, 0],
  [5.5, 1.9, -1.7, 5.6, 1.8, -3.2, 34, 0],
  "in",
  { shake: [E("L8") - 0.1, 0.3] },
);
// Day 9 - Lisa
shot(
  N("d9"),
  S("L10"),
  [3.4, 4.4, 2.6, 3.3, 0.8, -3.0, 50, 0],
  [3.4, 1.6, 0.6, 3.3, 0.9, -3.0, 50, 0],
  "inOut",
);
shot(
  S("L10"),
  S("L10") + 1.55,
  [2.95, 1.15, -0.25, 3.3, 1.1, -3.3, 44, 0],
  [3.0, 1.15, -0.5, 3.3, 1.1, -3.3, 42, 0],
  "lin",
);
shot(
  S("L10") + 1.55,
  E("L10") + 0.35,
  [3.3, 1.72, -0.95, 3.3, 1.55, -3.3, 40, 0],
  [3.3, 1.7, -1.25, 3.3, 1.55, -3.3, 36, 0],
  "out",
);
shot(
  E("L10") + 0.35,
  N("d14"),
  [1.3, 2.3, 1.3, 4.4, 1.0, -3.4, 50, 0],
  [1.5, 2.2, 1.0, 4.4, 1.0, -3.4, 48, 0],
  "lin",
);
// Day 14 - 3 a.m.
shot(
  N("d14"),
  S("L13"),
  [9.6, 4.3, -2.75, 9.6, 0, -2.75, 52, 0],
  [9.6, 3.6, -2.75, 9.6, 0, -2.75, 50, 0.35],
  "inOut",
  { up: [0, 0, -1] },
);
shot(
  S("L13"),
  S("L13") + 1.45,
  [9.6, 1.42, -3.55, 9.6, 1.6, -2.8, 62, 0.06],
  [9.6, 1.4, -3.5, 9.6, 1.55, -2.8, 56, 0.04],
  "out",
);
shot(
  S("L13") + 1.45,
  S("L13") + 2.2,
  [11.6, 1.75, -3.0, 9.6, 0.95, -3.4, 44, 0],
  [11.45, 1.72, -3.0, 9.6, 0.95, -3.4, 40, 0],
  "out",
  { shake: [S("L13") + 1.5, 0.3] },
);
shot(
  S("L13") + 2.2,
  N("m1"),
  [8.3, 2.2, -0.3, 9.6, 0.9, -3.0, 46, 0],
  [8.4, 2.15, -0.55, 9.6, 0.9, -3.0, 44, 0],
  "lin",
);
// one month later
shot(N("m1"), S("L15"), null, null, "inOut", {
  fn: orbit(-2.8, 0.9, -3.2, 4.0, 1.6, 0.7, -0.3, 46),
});
shot(
  S("L15"),
  E("L15") + 0.45,
  [-1.95, 1.5, -2.1, -2.55, 1.45, -3.7, 34, 0],
  [-2.0, 1.5, -2.3, -2.55, 1.45, -3.7, 32, 0],
  "lin",
);
shot(
  E("L15") + 0.45,
  T.total + 0.1,
  [-2.55, 1.7, -1.5, -2.55, 1.35, -3.7, 40, 0],
  [1.0, 10.5, 11.5, 2.5, 0.5, -1.5, 42, 0],
  "inOut",
);

function cameraAt(t) {
  let sh = SHOTS[SHOTS.length - 1];
  for (const s of SHOTS)
    if (t >= s.t0 && t < s.t1) {
      sh = s;
      break;
    }
  const u = ease[sh.e](seg(t, sh.t0, sh.t1));
  const v = sh.fn ? sh.fn(u) : sh.from.map((a, i) => lerp(a, sh.to[i], u));
  // gentle handheld drift
  let jx = Math.sin(t * 1.7) * 0.012 + Math.sin(t * 3.1) * 0.006;
  let jy = Math.cos(t * 1.3) * 0.01;
  if (sh.shake) {
    const k = seg(t, sh.shake[0], sh.shake[0] + sh.shake[1]);
    if (k > 0 && k < 1) {
      const a = (1 - k) * 0.06;
      jx += Math.sin(t * 90) * a;
      jy += Math.cos(t * 77) * a;
    }
  }
  camera.up.set(...(sh.up || [0, 1, 0]));
  camera.position.set(v[0] + jx, v[1] + jy, v[2]);
  camera.fov = v[6];
  camera.updateProjectionMatrix();
  camera.lookAt(v[3] + jx * 0.5, v[4] + jy * 0.5, v[5]);
  camera.rotateZ(v[7] || 0);
}

// ------------------------------------------------------------------ direction
function setNight(n) {
  scene.background = new THREE.Color("#a6dcf7").lerp(new THREE.Color("#141a3d"), n);
  hemi.intensity = lerp(1.1, 0.45, n);
  hemi.color.set("#ffffff").lerp(new THREE.Color("#5a6ac8"), n);
  hemi.groundColor.set("#8a7a6a").lerp(new THREE.Color("#141a3d"), n);
  sun.intensity = lerp(2.2, 0, n);
  moonLight.intensity = lerp(0, 1.1, n);
  lampLight.intensity = lerp(0, 2.2, n);
  skyMat.color.set("#9fdcff").lerp(new THREE.Color("#1b2459"), n);
  ground.material.color.set("#7cc576").lerp(new THREE.Color("#1e3a3a"), n);
  moon.visible = n > 0.5;
  lampShade.material.color.set(n > 0.5 ? "#ffd38a" : "#f4f1ea");
}

function renderAt(t) {
  poseReset(kevin);
  poseReset(lisa);
  catReset(cat);
  setNight(0);
  doorPivot.rotation.y = 0;
  tower.visible = false;
  pile.visible = false;
  heldBox.visible = false;
  stream.visible = false;
  for (const s of shards) s.visible = false;
  puddle.visible = false;
  mug.visible = true;
  mug.position.set(-3.3, 0.95, -3.5);
  mug.rotation.set(0, 0, 0);
  mug.userData.coffee.visible = t > S("L2") + 0.9;
  pot.position.set(-4.1, 0.95, -3.62);
  pot.rotation.set(0, 0, 0);

  const day2 = N("d2");
  const day5 = N("d5");
  const day9 = N("d9");
  const night = N("d14");
  const month = N("m1");

  if (t < day2) {
    // ---------------- Day 1: kitchen
    kevin.root.position.set(-3.0, 0, -2.55);
    kevin.root.rotation.y = Math.PI;
    breathe(kevin, t);
    blink(kevin, t, 0.4);
    cat.root.position.set(-2.0, 0.95, -3.72);
    cat.root.rotation.y = catLookAt(-2.0, -3.72, -1.2, -1.4);
    catIdle(cat, t);
    // cat looks to camera on "Katze", then to Kevin while she speaks
    const look = ease.out(seg(t, k1 - 0.1, k1 + 0.35));
    cat.head.rotation.y = lerp(0, -0.3, look);
    if (t > S("L2") + 2.0) cat.root.rotation.y = catLookAt(-2.0, -3.72, -3.0, -2.55);
    // pour coffee
    const pourIn = ease.out(seg(t, S("L2") - 0.3, S("L2") + 0.2));
    const pourOut = ease.inOut(seg(t, S("L2") + 1.5, S("L2") + 1.9));
    const pour = pourIn * (1 - pourOut);
    if (t > S("L2") - 0.3 && t < S("L2") + 2.0) {
      pot.position.set(lerp(-4.1, -3.45, pourIn), lerp(0.95, 1.32, pourIn), -3.48);
      pot.rotation.z = -1.0 * pour;
      kevin.armL.rotation.x = -1.3 * pourIn;
      kevin.armL.rotation.z = -0.35 * pourIn;
      face(kevin, "smile");
      kevin.head.rotation.z = Math.sin(t * 5) * 0.06;
      if (pour > 0.85) {
        stream.visible = true;
        stream.scale.y = 0.2;
        stream.position.set(-3.3, 1.15, -3.48);
      }
    } else if (t >= S("L2") + 2.0) {
      pot.position.set(-4.1, 0.95, -3.62);
    }
    // pick up mug and hold it
    const pick = ease.inOut(seg(t, S("L2") + 1.9, S("L2") + 2.4));
    if (pick > 0) {
      mug.position.set(lerp(-3.3, -3.12, pick), lerp(0.95, 1.18, pick), lerp(-3.5, -3.08, pick));
      kevin.armR.rotation.x = -1.0 * pick;
      kevin.armR.rotation.z = 0.25 * pick;
    }
    // head turns to the cat
    kevin.neck.rotation.y = -0.55 * ease.out(seg(t, S("L2") + 2.3, S("L2") + 2.8));
    if (t > S("L3")) {
      catTalk(cat, t, "L3");
      kevin.neck.rotation.y = lerp(-0.55, 0, ease.inOut(seg(t, E("L3"), E("L3") + 0.4)));
    }
    // shock: anticipation, squash, new face
    const shock = E("L3") + 0.55;
    if (t > shock - 0.08) kevin.head.scale.set(1.06, 0.92, 1.06);
    if (t > shock) {
      const k = seg(t, shock, shock + 0.45);
      const s = 1 + Math.sin(k * Math.PI * 3) * 0.1 * (1 - k);
      kevin.head.scale.set(1 / s, s, 1 / s);
      tinyEyes(kevin);
      face(kevin, "o");
      if (kevin.glasses) kevin.glasses.position.y = 0.09 * Math.sin(Math.min(1, k * 2.5) * Math.PI);
      kevin.armL.rotation.z = 0.5 * ease.out(seg(t, shock, shock + 0.2));
    }
    // mug falls (slow motion) and breaks
    const fall0 = S("L4") + 0.35;
    if (t > fall0) {
      kevin.armR.rotation.x = lerp(-1.0, -0.6, seg(t, fall0, fall0 + 0.3));
      const k = seg(t, fall0, CRASH);
      mug.position.set(-3.12 + k * 0.05, lerp(1.18, 0.0, ease.in(k)), -3.08 + k * 0.08);
      mug.rotation.set(k * 2.4, 0, k * 1.6);
    }
    if (t >= CRASH) {
      mug.visible = false;
      const dt = Math.min(t - CRASH, 0.7);
      for (const s of shards) {
        const [vx, vy, vz] = s.userData.v;
        s.visible = true;
        const y = Math.max(0.03, 0.05 + vy * dt - 4.9 * dt * dt);
        s.position.set(-3.07 + vx * dt * 0.7, y, -3.0 + vz * dt * 0.7);
        s.rotation.set(s.userData.spin[0] * dt, s.userData.spin[1] * dt, s.userData.spin[2] * dt);
      }
      puddle.visible = true;
      puddle.position.set(-3.07, 0.006, -3.0);
      puddle.scale.setScalar(0.2 + 0.8 * ease.out(seg(t, CRASH, CRASH + 0.6)));
      cat.head.rotation.x = 0.25;
    }
  } else if (t < day5) {
    // ---------------- Day 2: couch, questions
    sitPose(kevin, 3.3, -3.3, 0);
    breathe(kevin, t);
    blink(kevin, t, 1.0);
    face(kevin, "flat");
    cat.root.position.set(4.15, 0.55, -3.35);
    cat.root.rotation.y = catLookAt(4.15, -3.35, 3.3, -3.2);
    catIdle(cat, t);
    cat.head.rotation.z = Math.sin(t * 3) * 0.08;
    if (t > S("L6")) {
      // climb onto the backrest and sniff his head
      const k = ease.inOut(seg(t, S("L6") - 0.1, S("L6") + 0.5));
      const hop = Math.sin(k * Math.PI) * 0.35;
      cat.root.position.set(lerp(4.15, 3.72, k), lerp(0.55, 1.02, k) + hop, lerp(-3.35, -3.8, k));
      cat.root.rotation.y = lerp(cat.root.rotation.y, catLookAt(3.72, -3.8, 3.3, -3.2), k);
      catTalk(cat, t, "L6");
      cat.head.position.z = 0.04 + Math.max(0, Math.sin(t * 9)) * 0.05;
      kevin.neck.rotation.y = 0.25 * k;
      for (const e of kevin.eyes) e.position.x = Math.sign(e.position.x) * 0.15 + 0.03 * k;
    }
    if (t > E("L6")) kevin.sweat.visible = true;
  } else if (t < day9) {
    // ---------------- Day 5: the parcel
    const t7 = S("L7");
    const walkK = seg(t, day5 + 0.2, t7 + 1.4);
    kevin.root.position.set(lerp(4.3, 5.6, walkK), 0, lerp(-1.9, -3.25, walkK));
    kevin.root.rotation.y = Math.PI - 0.3;
    if (walkK > 0 && walkK < 1) walk(kevin, t);
    blink(kevin, t, 0.2);
    if (t > t7 + 1.3) kevin.root.rotation.y = Math.PI;
    doorPivot.rotation.y = -1.45 * ease.out(seg(t, t7 + 1.3, t7 + 1.9));
    tower.visible = true;
    tower.rotation.z = Math.sin(t * 1.6) * 0.02;
    if (t > t7 + 1.6) face(kevin, "o");
    // cat on the couch with the phone
    cat.root.position.set(3.9, 0.55, -3.35);
    cat.root.rotation.y = 0;
    catIdle(cat, t);
    cat.phone.visible = true;
    for (const p of cat.paws) p.position.y = 0.3;
    if (t > S("L8")) catTalk(cat, t, "L8");
    // Kevin comes back holding a box, turns slowly
    if (t > S("L8") + 1.8) {
      kevin.root.position.set(5.6, 0, -3.2);
      kevin.root.rotation.y = lerp(Math.PI, 0, ease.inOut(seg(t, S("L8") + 1.8, S("L8") + 2.4)));
      kevin.armL.rotation.x = -1.2;
      kevin.armR.rotation.x = -1.2;
      heldBox.visible = true;
      const r = kevin.root.rotation.y;
      heldBox.position.set(5.6 + Math.sin(r) * 0.42, 1.3, -3.2 + Math.cos(r) * 0.42);
      heldBox.rotation.y = r;
      tinyEyes(kevin);
      face(kevin, "o");
      if (t > E("L8") - 0.1) kevin.head.scale.set(0.94, 1.08, 0.94);
    }
  } else if (t < night) {
    // ---------------- Day 9: Lisa
    pile.visible = true;
    sitPose(kevin, 3.75, -3.3, -0.1);
    sitPose(lisa, 2.85, -3.3, 0.1);
    breathe(kevin, t);
    breathe(lisa, t + 1);
    blink(kevin, t, 0.6);
    blink(lisa, t, 2.0);
    lisa.head.rotation.z = Math.sin(t * 6) * 0.05 * (t < S("L10") ? 1 : 0);
    kevin.neck.rotation.y = 0.3;
    lisa.neck.rotation.y = -0.3;
    catIdle(cat, t);
    // cat jumps onto the table
    const j = seg(t, S("L10") - 0.55, S("L10") - 0.05);
    cat.root.position.set(
      lerp(4.9, 3.3, j),
      j > 0 ? 0.43 * ease.out(j) + Math.sin(j * Math.PI) * 0.5 : 0,
      lerp(-1.3, -1.85, j),
    );
    cat.root.rotation.y = j > 0 ? Math.PI : -1.2;
    if (t > S("L10")) {
      catTalk(cat, t, "L10");
      kevin.neck.rotation.y = 0;
      lisa.neck.rotation.y = 0;
    }
    if (t > S("L10") + 1.55) {
      lisa.neck.rotation.y = 0.6 * ease.out(seg(t, S("L10") + 1.6, S("L10") + 2.0));
      tinyEyes(kevin);
      face(kevin, "flat");
      kevin.sweat.visible = true;
      kevin.sweat.position.y = 0.12 - seg(t, S("L10") + 1.8, E("L10") + 0.3) * 0.2;
      face(lisa, "flat");
    }
    if (t > E("L10") + 0.35) {
      // Lisa leaves through the front door
      const w = seg(t, E("L10") + 0.5, S("L11") + 1.0);
      lisa.root.position.set(lerp(3.0, 5.6, w), 0, lerp(-2.6, -4.6, w * w));
      lisa.root.rotation.y = Math.PI - 0.8 * (1 - w);
      walk(lisa, t);
      lisa.legL.rotation.x = Math.sin(t * 7) * 0.55;
      if (w >= 1) lisa.root.position.y = -50;
      doorPivot.rotation.y = -1.4 * Math.sin(Math.PI * seg(t, E("L10") + 1.0, S("L11") + 1.35));
      kevin.neck.rotation.y = 0.4;
      cat.root.rotation.y = lerp(Math.PI, 0.4, seg(t, S("L11") + 0.8, S("L11") + 1.2));
      if (t > S("L11") + 1.2) for (const l of cat.lids) l.rotation.x = 0.9;
    }
  } else if (t < month) {
    // ---------------- Day 14, 3 a.m.
    setNight(1);
    kevin.root.rotation.x = -Math.PI / 2;
    kevin.root.position.set(9.6, 0.85, -1.5);
    for (const e of kevin.eyes) e.scale.y = 0.12;
    face(kevin, "flat");
    kevin.armL.rotation.z = 0.05;
    cat.eyeMat.emissive.set("#b8c21e");
    for (const l of cat.lids) l.rotation.x = 0.2;
    catIdle(cat, t);
    const arrive = ease.out(seg(t, S("L12") - 0.2, S("L12") + 0.6));
    cat.root.position.set(
      lerp(10.6, 9.6, arrive),
      lerp(0, 0.92, arrive) + Math.sin(arrive * Math.PI) * 0.5,
      lerp(-2.0, -2.85, arrive),
    );
    cat.root.rotation.y = Math.PI;
    if (t > S("L13")) {
      catTalk(cat, t, "L13");
      cat.head.position.z = 0.04 + 0.08 * ease.out(seg(t, S("L13"), S("L13") + 1.2));
    }
    if (t > S("L13") + 1.45) {
      for (const e of kevin.eyes) e.scale.set(0.5, 0.5, 0.5);
      face(kevin, "o");
    }
    if (t > S("L13") + 2.2) {
      for (const e of kevin.eyes) e.scale.set(0.45, 0.45, 0.45);
      face(kevin, "flat");
    }
    const leave = seg(t, E("L13") - 0.15, E("L13") + 0.6);
    if (leave > 0) {
      cat.root.position.set(
        lerp(9.6, 10.9, leave),
        0.92 * (1 - leave) + Math.sin(leave * Math.PI) * 0.5,
        lerp(-2.85, -1.2, leave),
      );
      cat.root.rotation.y = 0.8;
    }
  } else {
    // ---------------- one month later
    pile.visible = true;
    kevin.root.position.set(-3.5, 0, -2.95);
    kevin.legL.rotation.x = -1.5;
    kevin.legR.rotation.x = -1.5;
    kevin.root.position.y = -0.6;
    kevin.body.rotation.x = -0.15;
    kevin.neck.rotation.x = 0.25;
    face(kevin, "flat");
    for (const e of kevin.eyes) e.scale.set(0.8, 0.5, 0.8);
    for (const b of kevin.bags) b.visible = true;
    kevin.armL.rotation.z = 0.5;
    kevin.armR.rotation.z = -0.5;
    breathe(kevin, t);
    for (const s of shards) {
      s.visible = false;
    }
    cat.root.position.set(-2.55, 0.95, -3.72);
    cat.root.rotation.y = 0;
    catIdle(cat, t);
    if (t > S("L15")) catTalk(cat, t, "L15");
    if (t > E("L15") - 0.4) for (const l of cat.lids) l.rotation.x = 1.45;
  }

  cameraAt(t);
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
