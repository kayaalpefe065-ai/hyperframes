// 3D world for "Kai vs. Scrubby" (waswenn.exe1, English)
// Everything on screen is a pure function of the seek time t (renderAt).
import * as THREE from "./three.module.min.js";

const T = window.HF_TIMING;
const S = (id) => T.lines[id].s;
const E = (id) => T.lines[id].e;

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
    (P.shoes = P.shoes || []).push(shoe);
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
    const hnd = at(sph(0.075, SKIN, { outline: 0.014 }), 0, -0.62, 0);
    A.add(hnd);
    (P.hands = P.hands || []).push(hnd);
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
  } else if (hair === "long") {
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
    g.fillText("ORDERED", w / 2, 60);
    g.fillStyle = "#1d1a26";
    g.font = "bold 40px sans-serif";
    g.fillText("30 kg", w / 2, 220);
    g.fillText("tuna", w / 2, 270);
    g.fillStyle = "#e8505b";
    g.font = "bold 46px sans-serif";
    g.fillText("$1,237", w / 2, 380);
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

// ------------------------------------------------------------------ shots
// cam: [px, py, pz, tx, ty, tz, fov, roll]
const SHOTS = [];
function shot(t0, t1, from, to, e = "inOut", opts = {}) {
  SHOTS.push({ t0, t1, from, to, e, ...opts });
}
const N = (id) => T.marks[id];

// ------------------------------------------------------------------ Kai vs. Scrubby props
const V = new THREE.Vector3();
const rnd = mulberry32(11);
const additive = (color, opacity) =>
  new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

// sink (x -2.3), faucet, water
const SINK = { x: -2.3, z: -3.6, y: 0.952 };
world.add(at(box(0.95, 0.012, 0.56, "#c9ccd6", { outline: 0.008 }), SINK.x, SINK.y, SINK.z));
const basin = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.42), toon("#6f7787"));
basin.rotation.x = -Math.PI / 2;
basin.position.set(SINK.x, SINK.y + 0.008, SINK.z);
world.add(basin);
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(0.78, 0.4),
  new THREE.MeshToonMaterial({
    color: "#7cc8f0",
    gradientMap: grad,
    transparent: true,
    opacity: 0.85,
  }),
);
water.rotation.x = -Math.PI / 2;
water.position.set(SINK.x, SINK.y + 0.012, SINK.z);
world.add(water);
const bubbles = new THREE.Group();
for (let i = 0; i < 14; i++) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.025 + rnd() * 0.03, 12, 8), toon("#ffffff"));
  b.position.set(SINK.x - 0.35 + rnd() * 0.7, SINK.y + 0.02, SINK.z - 0.17 + rnd() * 0.34);
  bubbles.add(b);
}
world.add(bubbles);
const faucet = new THREE.Group();
faucet.add(at(cyl(0.03, 0.04, 0.3, "#c9ccd6", { outline: 0.008 }), 0, 0.15, 0));
const spout = part(new THREE.TorusGeometry(0.12, 0.025, 8, 20, Math.PI), "#c9ccd6", {
  outline: 0.008,
});
spout.position.set(0, 0.3, 0.12);
spout.rotation.y = Math.PI / 2;
faucet.add(spout);
faucet.position.set(SINK.x, SINK.y, SINK.z - 0.34);
world.add(faucet);

// dishes: plates in a rack, a stack of bowls, cups
function plate(r = 0.13, c = "#ffffff") {
  const g = new THREE.Group();
  g.add(cyl(r, r * 0.8, 0.025, c, { outline: 0.008 }));
  g.add(at(cyl(r * 0.6, r * 0.6, 0.027, "#9fdcff", { outline: 0 }), 0, 0.002, 0));
  return g;
}
function cup(c = "#e8505b") {
  const g = new THREE.Group();
  g.add(at(cyl(0.05, 0.045, 0.11, c, { outline: 0.008 }), 0, 0.055, 0));
  const h = part(new THREE.TorusGeometry(0.03, 0.01, 6, 12), c, { outline: 0.006 });
  h.position.set(0.055, 0.06, 0);
  g.add(h);
  return g;
}
const rack = new THREE.Group();
rack.add(at(box(0.5, 0.04, 0.3, "#c9ccd6", { outline: 0.008 }), 0, 0.02, 0));
for (let i = 0; i < 4; i++) {
  const p = plate(0.12, ["#ffffff", "#f7d65a", "#9fdcff", "#ffffff"][i]);
  p.rotation.x = Math.PI / 2;
  p.position.set(-0.15 + i * 0.1, 0.14, 0);
  p.rotation.z = Math.PI / 2;
  rack.add(p);
}
rack.position.set(-3.55, SINK.y, -3.62);
world.add(rack);
const bowls = new THREE.Group();
for (let i = 0; i < 7; i++) {
  const b = part(
    new THREE.SphereGeometry(0.11, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    ["#3d7be0", "#f29e38", "#22a58b"][i % 3],
    { outline: 0.006 },
  );
  b.rotation.x = Math.PI;
  b.position.y = 0.11 + i * 0.035;
  bowls.add(b);
}
bowls.position.set(-3.0, SINK.y, -3.55);
world.add(bowls);
const handPlate = plate(0.14);
world.add(handPlate);
const handCup = cup("#3d7be0");
world.add(handCup);
// upper cabinet with the cups locked away
const cabinet = new THREE.Group();
cabinet.add(box(0.9, 0.6, 0.35, "#39b8a8"));
cabinet.add(at(box(0.04, 0.5, 0.02, "#1d1a26", { outline: 0 }), 0, 0, 0.18));
for (let k = 0; k < 12; k++) {
  const link = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 12), toon("#8a8f9c"));
  link.position.set(-0.4 + k * 0.072, 0.05 * Math.sin(k), 0.2);
  link.rotation.set(0, k % 2 ? Math.PI / 2 : 0, 0);
  cabinet.add(link);
}
cabinet.add(at(box(0.1, 0.09, 0.05, "#f7d65a", { outline: 0.006 }), 0.05, -0.05, 0.22));
const noTex = canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "#e8505b";
  g.lineWidth = 12;
  g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = "#e8505b";
  g.font = "bold 46px sans-serif";
  g.textAlign = "center";
  g.fillText("NO CUPS", w / 2, 60);
  g.fillText("FOR KAI", w / 2, 108);
});
const noSign = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), toon("#ffffff", { map: noTex }));
noSign.position.set(0, 0.42, 0.18);
cabinet.add(noSign);
cabinet.position.set(-3.75, 2.05, -3.75);
world.add(cabinet);
// window glass (breaks)
const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.05), additive("#ffffff", 0.25));
glass.position.set(-3.1, 1.75, -3.86);
world.add(glass);

// explosions: flash, shards, smoke
function makeBoom(n, colors, seed) {
  const r = mulberry32(seed);
  const g = new THREE.Group();
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), additive("#fff2a8", 0.9));
  g.add(flash);
  const shards = [];
  for (let i = 0; i < n; i++) {
    const s = part(new THREE.TetrahedronGeometry(0.03 + r() * 0.04), colors[i % colors.length], {
      outline: 0.006,
    });
    const a = r() * Math.PI * 2;
    const el = r() * 1.2 - 0.2;
    const sp = 1.4 + r() * 2.2;
    s.userData.v = [
      Math.cos(a) * Math.cos(el) * sp,
      Math.sin(el) * sp + 1.2,
      Math.sin(a) * Math.cos(el) * sp,
    ];
    s.userData.spin = [r() * 14, r() * 14, r() * 14];
    g.add(s);
    shards.push(s);
  }
  const smoke = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 14, 10),
      new THREE.MeshToonMaterial({
        color: "#6b6f7b",
        gradientMap: grad,
        transparent: true,
        opacity: 0.8,
      }),
    );
    m.userData.d = [r() - 0.5, 0.4 + r() * 0.5, r() - 0.5];
    g.add(m);
    smoke.push(m);
  }
  g.visible = false;
  world.add(g);
  return { g, flash, shards, smoke, floorY: 0.03 };
}
function boomAt(B, t, t0, x, y, z, floorY = 0.03) {
  const dt = t - t0;
  if (dt < 0 || dt > 2.6) {
    B.g.visible = false;
    return;
  }
  B.g.visible = true;
  B.g.position.set(x, y, z);
  const f = clamp01(dt / 0.25);
  B.flash.visible = dt < 0.25;
  B.flash.scale.setScalar(0.3 + f * 2.2);
  B.flash.material.opacity = 0.9 * (1 - f);
  for (const s of B.shards) {
    const [vx, vy, vz] = s.userData.v;
    const tt = Math.min(dt, 1.4);
    s.position.set(vx * tt * 0.6, Math.max(floorY - y, vy * tt - 4.9 * tt * tt), vz * tt * 0.6);
    s.rotation.set(s.userData.spin[0] * tt, s.userData.spin[1] * tt, s.userData.spin[2] * tt);
  }
  for (const m of B.smoke) {
    const k = clamp01(dt / 2.4);
    m.position.set(m.userData.d[0] * k * 0.8, m.userData.d[1] * k * 1.2, m.userData.d[2] * k * 0.8);
    m.scale.setScalar(0.5 + k * 2.2);
    m.material.opacity = 0.75 * (1 - k);
  }
}
const boomPlate = makeBoom(14, ["#ffffff", "#9fdcff"], 3);
const boomCup = makeBoom(10, ["#3d7be0", "#ffffff"], 4);
const boomBowls = makeBoom(22, ["#3d7be0", "#f29e38", "#22a58b"], 5);
const boomWindow = makeBoom(18, ["#d9f2ff", "#ffffff"], 6);

// water squeezed onto Kai, steam
const pour = new THREE.Group();
for (let i = 0; i < 5; i++) {
  const c = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05 + i * 0.012, 0.05 + i * 0.012, 2.4, 14),
    additive("#7cc8f0", 0.35),
  );
  c.position.set((i - 2) * 0.09, 0, (i % 2) * 0.06);
  pour.add(c);
}
pour.visible = false;
world.add(pour);
const steam = [];
for (let i = 0; i < 10; i++) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 14, 10),
    new THREE.MeshToonMaterial({
      color: "#ffffff",
      gradientMap: grad,
      transparent: true,
      opacity: 0.8,
    }),
  );
  m.userData.o = [rnd() - 0.5, rnd(), rnd() - 0.5, rnd()];
  world.add(m);
  steam.push(m);
}
const drips = [];
for (let i = 0; i < 8; i++) {
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), toon("#7cc8f0"));
  d.scale.set(0.7, 1.4, 0.7);
  d.userData.o = [rnd() - 0.5, rnd(), rnd() - 0.5];
  world.add(d);
  drips.push(d);
}

// ---------------- Kai: an over-motivated fighter (own design)
const kai = makePerson({ shirt: "#1d1a26", hair: "none", glasses: false });
const kaiHair = new THREE.Group();
{
  const up = new THREE.Vector3(0, 1, 0);
  const spikes = [];
  for (let k = 0; k < 13; k++) {
    const az = Math.PI * 0.55 + (k / 12) * Math.PI * 0.9 * 2 - Math.PI * 0.9;
    for (const el of [0.35, 0.9]) spikes.push([az + (el > 0.5 ? 0.25 : 0), el]);
  }
  for (const [az, el] of spikes) {
    const dir = new THREE.Vector3(
      Math.sin(az) * Math.cos(el),
      Math.sin(el),
      Math.cos(az) * Math.cos(el),
    );
    if (dir.z > 0.35) continue;
    const c = part(new THREE.ConeGeometry(0.13, 0.55, 8), "#e8432e", { outline: 0.014 });
    c.position.copy(dir.clone().multiplyScalar(0.42));
    c.quaternion.setFromUnitVectors(
      up,
      dir
        .clone()
        .add(new THREE.Vector3(0, 0.6, 0))
        .normalize(),
    );
    kaiHair.add(c);
  }
  for (let k = 0; k < 4; k++) {
    const c = part(new THREE.ConeGeometry(0.1, 0.34, 8), "#e8432e", { outline: 0.012 });
    c.position.set(-0.24 + k * 0.16, 0.3, 0.2);
    c.rotation.set(1.0, 0, (k - 1.5) * 0.3);
    kaiHair.add(c);
  }
}
kai.head.add(kaiHair);
const band = part(new THREE.TorusGeometry(0.425, 0.04, 8, 32), "#f4f1ea", { outline: 0.01 });
band.rotation.x = Math.PI / 2 - 0.12;
band.position.y = 0.16;
kai.head.add(band);
for (const s of [-1, 1]) {
  const brow = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.03, 0.02),
    new THREE.MeshBasicMaterial({ color: INK }),
  );
  brow.position.set(s * 0.15, 0.13, 0.4);
  brow.rotation.z = s * -0.35;
  kai.head.add(brow);
}
kai.body.add(at(box(0.6, 0.08, 0.6, "#e8432e", { outline: 0.01 }), 0, 0.12, 0));
const emblemTex = canvasTex(128, 128, (g) => {
  g.fillStyle = "#f4f1ea";
  g.beginPath();
  g.arc(64, 64, 60, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#e8432e";
  g.font = "bold 84px sans-serif";
  g.textAlign = "center";
  g.fillText("K", 64, 94);
});
const emblem = new THREE.Mesh(
  new THREE.CircleGeometry(0.11, 24),
  new THREE.MeshBasicMaterial({ map: emblemTex }),
);
emblem.position.set(0.12, 0.5, 0.285);
kai.body.add(emblem);
const apron = box(0.5, 0.6, 0.04, "#f6a9c6", { outline: 0.01 });
apron.position.set(0, 0.24, 0.29);
kai.body.add(apron);
// aura + sparks
const aura = new THREE.Group();
[
  ["#ff7a2e", 0.12, 1.0],
  ["#ffc23d", 0.08, 1.18],
  ["#ff4a1e", 0.06, 1.36],
].forEach(([c, o, s]) => {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.7, 8, 20), additive(c, o));
  m.scale.setScalar(s);
  m.position.y = 1.3;
  aura.add(m);
});
const sparkGeo = new THREE.BufferGeometry();
const SPARKS = 90;
sparkGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
const sparkSeed = Array.from({ length: SPARKS }, () => [
  rnd() * Math.PI * 2,
  0.35 + rnd() * 0.5,
  rnd(),
  0.8 + rnd() * 1.4,
]);
const sparks = new THREE.Points(
  sparkGeo,
  new THREE.PointsMaterial({
    color: "#ffe9a0",
    size: 0.06,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }),
);
aura.add(sparks);
world.add(aura);
function auraAt(t, x, z, power) {
  aura.visible = power > 0.01;
  if (!aura.visible) return;
  aura.position.set(x, 0, z);
  aura.children.slice(0, 3).forEach((m, i) => {
    const f = 1 + Math.sin(t * 31 + i * 2) * 0.05 + Math.sin(t * 17 + i) * 0.04;
    m.scale.set(
      (1 + i * 0.18) * f * power,
      (1 + i * 0.18) * f * (0.8 + 0.2 * power),
      (1 + i * 0.18) * f * power,
    );
  });
  const pos = sparkGeo.attributes.position.array;
  sparkSeed.forEach(([a, r, ph, sp], i) => {
    const y = ((ph + t * sp * 0.6) % 1) * 2.8;
    pos[i * 3] = Math.cos(a + t) * r * power;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(a + t) * r * power;
  });
  sparkGeo.attributes.position.needsUpdate = true;
}
scene.add(kai.root);

// ---------------- Scrubby: a cheerful kitchen sponge (own design)
const scrub = { root: new THREE.Group() };
scrub.body = new THREE.Group();
scrub.root.add(scrub.body);
const holeTex = canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = "#f2e35c";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#d8c33e";
  const r = mulberry32(21);
  for (let i = 0; i < 40; i++) {
    g.beginPath();
    g.arc(r() * w, r() * h, 3 + r() * 6, 0, Math.PI * 2);
    g.fill();
  }
});
const spongeTop = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.18, 0.17),
  toon("#ffffff", { map: holeTex }),
);
spongeTop.position.y = 0.17;
spongeTop.castShadow = true;
const spOut = new THREE.Mesh(spongeTop.geometry, inkMat);
spOut.scale.setScalar(1.06);
spongeTop.add(spOut);
scrub.body.add(spongeTop);
const scour = box(0.3, 0.05, 0.17, "#3fa34d", { outline: 0.008 });
scour.position.y = 0.055;
scrub.body.add(scour);
scrub.eyes = [];
for (const s of [-1, 1]) {
  const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), toon("#ffffff"));
  e.position.set(s * 0.055, 0.2, 0.085);
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 10, 8),
    new THREE.MeshBasicMaterial({ color: INK }),
  );
  p.position.z = 0.032;
  e.add(p);
  scrub.body.add(e);
  scrub.eyes.push(e);
}
scrub.mouth = new THREE.Mesh(
  new THREE.SphereGeometry(0.035, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: "#5a1f2b" }),
);
scrub.mouth.position.set(0, 0.135, 0.087);
scrub.body.add(scrub.mouth);
for (const s of [-1, 1]) {
  const ch = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), toon("#f6a9a6"));
  ch.scale.set(1.3, 0.7, 0.4);
  ch.position.set(s * 0.1, 0.15, 0.086);
  scrub.body.add(ch);
}
scrub.arms = [];
for (const s of [-1, 1]) {
  const pv = new THREE.Group();
  pv.position.set(s * 0.15, 0.16, 0);
  pv.add(at(cyl(0.008, 0.008, 0.12, "#1d1a26", { outline: 0 }), 0, -0.06, 0));
  pv.add(at(sph(0.022, "#ffffff", { outline: 0.005 }), 0, -0.125, 0));
  pv.rotation.z = s * 0.5;
  scrub.body.add(pv);
  scrub.arms.push(pv);
}
for (const s of [-1, 1]) {
  scrub.root.add(at(cyl(0.008, 0.008, 0.06, "#1d1a26", { outline: 0 }), s * 0.06, 0.03, 0));
  const shoe = sph(0.025, "#1d1a26", { outline: 0 });
  shoe.scale.set(1, 0.6, 1.5);
  shoe.position.set(s * 0.06, 0.005, 0.01);
  scrub.root.add(shoe);
}
scene.add(scrub.root);
function scrubReset() {
  scrub.root.position.set(0, -50, 0);
  scrub.root.rotation.set(0, 0, 0);
  scrub.root.scale.setScalar(1.3);
  scrub.body.scale.set(1, 1, 1);
  scrub.body.rotation.set(0, 0, 0);
  scrub.arms[0].rotation.set(0, 0, -0.5);
  scrub.arms[1].rotation.set(0, 0, 0.5);
  scrub.mouth.scale.set(1, 0.35, 1);
  for (const e of scrub.eyes) e.scale.set(1, 1, 1);
}
function talk(id, t, apply) {
  const env = T.mouth[id];
  if (!env) return;
  const i = Math.floor((t - S(id)) * 30);
  apply(i >= 0 && i < env.length ? env[i] : 0);
}
function toHand(obj, P, i, dx = 0, dy = 0, dz = 0) {
  P.hands[i].getWorldPosition(V);
  obj.position.set(V.x + dx, V.y + dy, V.z + dz);
}

// ------------------------------------------------------------------ shots
const BOOM1 = N("boom1"),
  BOOM2 = S("L12") + 0.15,
  BOOM3 = S("L12") + 1.05,
  BOOM4 = S("L12") + 2.05;
const later = N("later");
shot(
  0,
  S("L2"),
  [3.7, 0.35, 7.6, 3.0, 2.0, 4.5, 50, 0.04],
  [3.5, 0.4, 6.9, 3.0, 2.1, 4.5, 48, 0.02],
  "out",
);
shot(
  S("L2"),
  E("L2") + 0.2,
  [3.6, 1.3, 7.4, 3.0, 2.0, 4.5, 54, -0.05],
  [3.5, 1.35, 7.0, 3.0, 2.0, 4.5, 50, -0.05],
  "out",
  { shake: [S("L2"), 1.6] },
);
shot(
  E("L2") + 0.2,
  S("L4"),
  [0.9, 1.8, 0.9, -1.4, 1.1, -3.2, 46, 0],
  [0.7, 1.75, 0.6, -1.4, 1.1, -3.2, 44, 0],
  "out",
);
shot(
  S("L4"),
  S("L5"),
  [-0.95, 1.28, -2.45, -1.55, 1.12, -3.42, 52, 0],
  [-1.0, 1.26, -2.6, -1.55, 1.12, -3.42, 48, 0],
  "out",
);
shot(
  S("L5"),
  S("L6"),
  [-2.3, 0.9, -2.6, -0.55, 1.75, -3.25, 56, 0.06],
  [-2.2, 0.92, -2.65, -0.55, 1.8, -3.25, 52, 0.04],
  "out",
  { shake: [S("L5") + 1.2, 0.5] },
);
shot(
  S("L6"),
  S("L7"),
  [-1.0, 1.22, -2.85, -1.55, 1.12, -3.42, 52, -0.04],
  [-1.05, 1.2, -2.95, -1.55, 1.12, -3.42, 48, -0.04],
  "out",
);
shot(
  S("L7"),
  S("L8"),
  [-0.9, 1.6, 0.9, -1.05, 1.15, -3.35, 50, 0],
  [-0.95, 1.55, 0.5, -1.05, 1.15, -3.35, 48, 0],
  "lin",
);
shot(
  S("L8"),
  S("L9"),
  [-0.6, 1.7, -1.4, -2.1, 1.05, -3.4, 50, 0],
  [-0.75, 1.65, -1.6, -2.1, 1.05, -3.4, 48, 0],
  "inOut",
);
shot(
  S("L9"),
  E("L9") + 0.25,
  [-2.3, 0.9, -0.2, -2.3, 1.75, -2.6, 58, 0.05],
  [-2.3, 0.95, -0.7, -2.3, 1.8, -2.6, 50, 0.08],
  "in",
  { shake: [S("L9") + 0.6, 1.8] },
);
shot(
  E("L9") + 0.25,
  S("L11"),
  [-1.1, 1.55, -0.7, -2.3, 1.35, -2.4, 50, 0],
  [-1.2, 1.52, -0.9, -2.3, 1.35, -2.4, 46, 0],
  "out",
  { shake: [BOOM1, 0.4] },
);
shot(
  S("L11"),
  S("L12"),
  [-1.15, 1.28, -2.5, -1.75, 1.12, -3.4, 52, 0],
  [-1.2, 1.26, -2.62, -1.75, 1.12, -3.4, 48, 0],
  "out",
);
shot(
  S("L12"),
  S("L12") + 1.0,
  [-1.55, 1.55, 0.3, -2.3, 1.4, -2.4, 48, 0],
  [-1.6, 1.52, 0.1, -2.3, 1.4, -2.4, 44, 0],
  "out",
  { shake: [BOOM2, 0.35] },
);
shot(
  S("L12") + 1.0,
  S("L12") + 2.0,
  [-3.75, 1.5, -2.05, -3.0, 1.1, -3.55, 52, 0.05],
  [-3.7, 1.48, -2.2, -3.0, 1.1, -3.55, 48, 0.05],
  "out",
  { shake: [BOOM3, 0.4] },
);
shot(
  S("L12") + 2.0,
  S("L13"),
  [-3.7, 1.3, -1.9, -3.1, 1.75, -3.9, 54, -0.05],
  [-3.65, 1.3, -2.05, -3.1, 1.75, -3.9, 50, -0.05],
  "out",
  { shake: [BOOM4, 0.45] },
);
shot(
  S("L13"),
  S("L14"),
  [-2.3, 1.5, -0.6, -2.3, 1.45, -2.6, 50, 0],
  [-2.3, 1.48, -0.85, -2.3, 1.45, -2.6, 46, 0],
  "lin",
);
shot(
  S("L14"),
  S("L15"),
  [-1.2, 1.08, -2.6, -1.75, 1.15, -3.4, 54, 0.08],
  [-1.25, 1.08, -2.72, -1.75, 1.15, -3.4, 48, 0.08],
  "out",
);
shot(
  S("L15"),
  S("L16"),
  [-1.2, 2.3, -2.4, -2.3, 0.95, -3.6, 52, 0],
  [-1.3, 2.2, -2.55, -2.3, 0.95, -3.6, 50, 0],
  "inOut",
);
shot(
  S("L16"),
  S("L17"),
  [-1.0, 1.7, 0.6, -2.3, 2.0, -2.6, 50, 0],
  [-1.1, 1.68, 0.3, -2.3, 2.0, -2.6, 48, 0],
  "lin",
  { shake: [S("L16") + 0.3, 0.6] },
);
shot(
  S("L17"),
  S("L18"),
  [-2.3, 1.95, -0.7, -2.3, 1.85, -2.6, 50, 0],
  [-2.3, 1.94, -0.95, -2.3, 1.85, -2.6, 44, 0],
  "lin",
);
shot(
  S("L18"),
  later,
  [-1.15, 1.28, -2.5, -1.75, 1.12, -3.4, 52, 0],
  [-1.2, 1.26, -2.62, -1.75, 1.12, -3.4, 46, 0],
  "out",
);
shot(
  later,
  S("L19") + 2.4,
  [0.3, 1.75, -1.5, -2.3, 1.45, -3.0, 46, 0],
  [0.15, 1.72, -1.65, -2.3, 1.45, -3.0, 44, 0],
  "inOut",
);
shot(
  S("L19") + 2.4,
  E("L19") + 0.8,
  [-3.05, 1.85, -2.55, -3.75, 2.05, -3.75, 46, 0],
  [-3.15, 1.88, -2.75, -3.75, 2.05, -3.75, 42, 0],
  "out",
);
shot(
  E("L19") + 0.8,
  T.total + 0.1,
  [-3.15, 1.88, -2.75, -3.75, 2.05, -3.75, 42, 0],
  [1.5, 9.5, 10.0, -1.5, 0.5, -2.0, 46, 0],
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

const KAI_LINES = Object.keys(T.lines).filter((id) => T.lines[id].who === "k");
const SCRUB_LINES = Object.keys(T.lines).filter((id) => T.lines[id].who === "s");
const tape = new THREE.Group();
for (const s of [-1, 1]) {
  const b = box(1.7, 0.08, 0.01, "#e6d7a8", { outline: 0.004 });
  b.rotation.z = s * 0.6;
  tape.add(b);
}
tape.position.set(-3.1, 1.75, -3.84);
world.add(tape);

function kaiTalk(t) {
  for (const id of KAI_LINES)
    if (t >= S(id) && t < E(id) + 0.05)
      talk(id, t, (v) => {
        face(kai, "o");
        kai.oMouth.scale.set(0.9, 0.3 + v * 1.4, 0.35);
      });
}
function scrubTalk(t) {
  for (const id of SCRUB_LINES)
    if (t >= S(id) && t < E(id) + 0.05)
      talk(id, t, (v) => scrub.mouth.scale.set(1, 0.35 + v * 1.3, 1));
}
function scrubBlink(t) {
  if ((t + 0.7) % 3.1 < 0.12) for (const e of scrub.eyes) e.scale.y = 0.15;
}

function renderAt(t) {
  poseReset(kevin);
  poseReset(lisa);
  poseReset(kai);
  catReset(cat);
  scrubReset();
  setNight(0);
  face(kai, "flat");
  apron.visible = false;
  kaiHair.rotation.set(0, 0, 0);
  kaiHair.scale.set(1, 1, 1);
  kaiHair.position.y = 0;
  auraAt(t, 0, 0, 0);
  handPlate.visible = false;
  handCup.visible = false;
  bowls.visible = t < BOOM3 || t >= later;
  glass.visible = t < BOOM4 || t >= later;
  tape.visible = t >= later;
  water.visible = true;
  water.scale.set(1, 1, 1);
  water.material.opacity = 0.85;
  bubbles.visible = true;
  spongeTop.material.color.set("#ffffff");
  pour.visible = false;
  for (const m of steam) m.visible = false;
  for (const d of drips) d.visible = false;
  for (const B of [boomPlate, boomCup, boomBowls, boomWindow]) B.g.visible = false;
  const holds = [];

  if (t < E("L2") + 0.2) {
    // ---------------- the strongest fighter in the universe
    kai.root.position.set(3.0, 0, 4.5);
    breathe(kai, t);
    blink(kai, t, 0.5);
    kai.armL.rotation.z = 0.5;
    kai.armR.rotation.z = -0.5;
    auraAt(t, 3.0, 4.5, 1);
    if (t > S("L2")) {
      const up = ease.back(seg(t, S("L2") + 0.9, S("L2") + 1.2));
      kai.armR.rotation.set(0, 0, -0.5 - 2.4 * up);
      kai.neck.rotation.x = -0.15;
      auraAt(t, 3.0, 4.5, 1.25);
    }
    kaiTalk(t);
  } else if (t < S("L8")) {
    // ---------------- somehow, a kitchen
    kai.root.position.set(-0.55, 0, -3.25);
    kai.root.rotation.y = -Math.PI / 2;
    breathe(kai, t);
    blink(kai, t, 0.2);
    scrub.root.position.set(-1.55, 0.95, -3.42);
    scrub.root.rotation.y = Math.PI / 2 - 0.15;
    scrubBlink(t);
    if (t < S("L4")) {
      kai.neck.rotation.y = Math.sin((t - E("L2")) * 4) * 0.6;
      tinyEyes(kai);
      face(kai, "o");
    }
    if (t >= S("L4") && t < S("L5")) {
      scrub.arms[1].rotation.z = 2.4 + Math.sin(t * 14) * 0.4;
      scrub.root.position.y += Math.abs(Math.sin(t * 7)) * 0.02;
      face(kai, "flat");
    }
    if (t >= S("L5") && t < S("L6")) {
      const flex = ease.back(seg(t, S("L5") + 0.9, S("L5") + 1.2));
      kai.armL.rotation.set(-0.3 * flex, 0, 1.8 * flex);
      kai.armR.rotation.set(-0.3 * flex, 0, -1.8 * flex);
      auraAt(t, -0.55, -3.25, 0.8 * flex);
    }
    if (t >= S("L6") && t < S("L7")) {
      scrub.arms[0].rotation.z = -2.2;
      scrub.arms[1].rotation.z = 2.2;
      scrub.body.rotation.z = Math.sin(t * 6) * 0.06;
      face(kai, "flat");
      for (const e of kai.eyes) e.scale.set(0.6, 0.6, 0.6);
    }
    if (t >= S("L7")) {
      kai.body.rotation.x = 0.45 * ease.inOut(seg(t, S("L7") + 0.2, S("L7") + 0.7));
    }
    kaiTalk(t);
    scrubTalk(t);
  } else if (t < S("L15")) {
    // ---------------- training at the sink
    kai.root.position.set(-2.3, 0, -2.6);
    kai.root.rotation.y = Math.PI * (1 - ease.inOut(seg(t, S("L9") - 0.1, S("L9") + 0.25)));
    breathe(kai, t);
    blink(kai, t, 0.9);
    scrub.root.position.set(-1.75, 0.95, -3.4);
    scrub.root.rotation.y = -0.7;
    scrubBlink(t);
    kai.armL.rotation.x = -1.15;
    kai.armR.rotation.x = -1.15;
    kai.armL.rotation.z = -0.35;
    kai.armR.rotation.z = 0.35;
    if (t < BOOM1) {
      handPlate.visible = true;
      holds.push([handPlate, kai, 0, -0.32 * Math.cos(kai.root.rotation.y), 0.02, 0]);
      handPlate.rotation.set(Math.PI / 2 - 0.3, 0, 0);
    }
    if (t >= S("L8") && t < S("L9")) {
      const a = (t - S("L8")) * 6;
      scrub.root.position.x += Math.cos(a) * 0.05;
      scrub.root.position.z += Math.sin(a) * 0.05;
      scrub.root.rotation.y = a;
    }
    if (t >= S("L9") && t < BOOM1 + 0.1) {
      const p = ease.in(seg(t, S("L9") + 0.5, BOOM1));
      auraAt(t, -2.3, -2.6, 0.3 + p * 1.2);
      kai.neck.rotation.x = -0.25 * p;
      kai.root.position.y += Math.sin(t * 60) * 0.01 * p;
    }
    boomAt(boomPlate, t, BOOM1, -2.3, 1.25, -2.15);
    if (t >= BOOM1 && t < S("L11")) {
      tinyEyes(kai);
      face(kai, "o");
      kai.neck.rotation.x = 0.1;
    }
    if (t >= S("L11") && t < BOOM2) {
      handCup.visible = t > S("L11") + 0.4;
      holds.push([handCup, kai, 0, -0.32, -0.05, 0]);
      scrub.arms[1].rotation.z = 2.4;
    }
    if (t >= S("L12") && t < S("L13")) auraAt(t, -2.3, -2.6, 1.1);
    boomAt(boomCup, t, BOOM2, -2.3, 1.22, -2.15);
    boomAt(boomBowls, t, BOOM3, -3.0, 1.1, -3.55);
    boomAt(boomWindow, t, BOOM4, -3.1, 1.75, -3.8);
    if (t >= S("L13")) {
      kai.body.rotation.x = 0.35;
      kai.armL.rotation.set(-0.5, 0, -0.2);
      kai.armR.rotation.set(-0.5, 0, 0.2);
      kai.root.position.y -= 0.05 + Math.sin(t * 9) * 0.02;
      tinyEyes(kai);
      kai.sweat.visible = true;
    }
    if (t >= S("L14")) {
      scrub.arms[0].rotation.z = -2.6;
      scrub.arms[1].rotation.z = 2.6;
      scrub.root.rotation.y = -0.3;
      for (const e of scrub.eyes) e.scale.y = 0.6;
    }
    kaiTalk(t);
    scrubTalk(t);
  } else if (t < later) {
    // ---------------- the final technique
    kai.root.position.set(-2.3, 0, -2.6);
    kai.root.rotation.y = 0;
    blink(kai, t, 0.4);
    const jump = seg(t, S("L15") + 0.1, S("L15") + 0.7);
    const soak = ease.inOut(seg(t, S("L15") + 0.8, E("L15") + 0.2));
    if (t < S("L16")) {
      auraAt(t, -2.3, -2.6, 1);
      face(kai, "o");
      tinyEyes(kai);
      scrub.root.position.set(
        lerp(-1.75, SINK.x, jump),
        0.95 + Math.sin(jump * Math.PI) * 0.45 - 0.05 * jump,
        lerp(-3.4, SINK.z, jump),
      );
      scrub.root.rotation.y = -0.5 + jump * 0.5;
      scrub.root.scale.setScalar(1.3 + soak * 2.3);
      spongeTop.material.color.set("#ffffff").lerp(new THREE.Color("#b8a640"), soak);
      water.scale.set(1 - soak * 0.2, 1 - soak * 0.2, 1);
      water.material.opacity = 0.85 * (1 - soak);
      bubbles.visible = soak < 0.5;
      scrub.mouth.scale.set(1, 0.9, 1);
    } else {
      water.visible = false;
      bubbles.visible = false;
      spongeTop.material.color.set("#b8a640");
      const rise = ease.out(seg(t, S("L16") - 0.2, S("L16") + 0.3));
      const sq = ease.inOut(seg(t, S("L16") + 0.3, S("L16") + 0.8));
      scrub.root.position.set(SINK.x, lerp(0.95, 2.65, rise), lerp(SINK.z, -2.6, rise));
      scrub.root.rotation.y = 0;
      scrub.root.scale.setScalar(3.6);
      scrub.body.scale.set(1 + sq * 0.25, 1 - sq * 0.6, 1 + sq * 0.25);
      spongeTop.material.color.set("#b8a640").lerp(new THREE.Color("#ffffff"), sq);
      scrub.arms[0].rotation.z = -2.2;
      scrub.arms[1].rotation.z = 2.2;
      const wet = seg(t, S("L16") + 0.35, S("L16") + 1.8);
      if (wet > 0 && wet < 1) {
        pour.visible = true;
        pour.position.set(SINK.x, 1.4, -2.6);
        pour.scale.set(1, 1, 1);
      }
      auraAt(t, -2.3, -2.6, 1 - seg(t, S("L16") + 0.35, S("L16") + 0.7));
      const st = seg(t, S("L16") + 0.4, S("L18"));
      if (st > 0 && st < 1)
        steam.forEach((m) => {
          const [ox, oy, oz, ph] = m.userData.o;
          const k = (st * 2 + ph) % 1;
          m.visible = true;
          m.position.set(-2.3 + ox * 0.8, 0.6 + oy * 1.4 + k * 1.3, -2.6 + oz * 0.8);
          m.scale.setScalar(0.6 + k * 1.2);
          m.material.opacity = 0.7 * (1 - k);
        });
      if (t > S("L16") + 0.7) {
        kaiHair.scale.set(1.1, 0.55, 1.1);
        kaiHair.position.y = -0.05;
        tinyEyes(kai);
        face(kai, "flat");
        drips.forEach((d) => {
          const [ox, ph, oz] = d.userData.o;
          const k = (t * 1.3 + ph) % 1;
          d.visible = true;
          d.position.set(-2.3 + ox * 0.7, 2.3 - k * 2.2, -2.6 + oz * 0.5);
        });
      }
      if (t >= S("L18")) {
        scrub.root.position.set(-1.75, 0.95, -3.4);
        scrub.root.scale.setScalar(1.3);
        scrub.body.scale.set(1, 1, 1);
        scrub.root.rotation.y = -0.6;
        scrub.arms[1].rotation.z = 2.8;
        scrub.eyes[0].scale.y = 0.15;
      }
    }
    kaiTalk(t);
    scrubTalk(t);
  } else {
    // ---------------- three months later: gentle little circles
    kai.root.position.set(-2.3, 0, -2.75);
    kai.root.rotation.y = Math.PI;
    breathe(kai, t);
    blink(kai, t, 0.3);
    face(kai, "smile");
    apron.visible = true;
    kai.armL.rotation.set(-1.15, 0, -0.35);
    kai.armR.rotation.set(-1.15 + Math.sin(t * 5) * 0.12, 0, 0.35 + Math.cos(t * 5) * 0.12);
    handPlate.visible = true;
    holds.push([handPlate, kai, 0, 0.32, 0.02, -0.02]);
    handPlate.rotation.set(Math.PI / 2 - 0.3, 0, 0);
    scrub.root.scale.setScalar(1.0);
    scrub.root.rotation.y = Math.PI;
    scrubBlink(t);
    holds.push([scrub.root, kai, 0, 0.0, 0.62, 0.0]);
    kai.neck.rotation.z = Math.sin(t * 2) * 0.05;
  }

  if (holds.length) {
    scene.updateMatrixWorld(true);
    for (const [obj, P, i, dx, dy, dz] of holds) toHand(obj, P, i, dx, dy, dz);
    if (t >= later) {
      // Scrubby rides on Kai's shoulder, not in his hand
      kai.body.getWorldPosition(V);
      scrub.root.position.set(V.x + 0.36, V.y + 0.78, V.z);
    }
  }

  cameraAt(t);
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
