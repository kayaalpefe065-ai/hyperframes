// 3D world for "Der Socken-Dieb" (waswenn.exe1)
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
function catIdle(C, t) {
  C.tail.rotation.z = Math.sin(t * 2.2) * 0.35;
  C.tail.rotation.x = Math.sin(t * 1.3) * 0.15;
  const ph = (t + 1.1) % 4.1;
  if (ph < 0.14) for (const l of C.lids) l.rotation.x = 1.5;
}

// ------------------------------------------------------------------ shots
// cam: [px, py, pz, tx, ty, tz, fov, roll]
const SHOTS = [];
function shot(t0, t1, from, to, e = "inOut", opts = {}) {
  SHOTS.push({ t0, t1, from, to, e, ...opts });
}
const N = (id) => T.marks[id];

// ------------------------------------------------------------------ sock story props
const V = new THREE.Vector3();
const SOCK_COLORS = [
  "#e8505b",
  "#3d7be0",
  "#f7d65a",
  "#22a58b",
  "#9b6ade",
  "#f29e38",
  "#ffffff",
  "#1d1a26",
];

// a sock hanging from its cuff: leg goes down -y, foot points +z
function makeSock(color, outline = 0.012) {
  const g = new THREE.Group();
  const leg = part(new THREE.CapsuleGeometry(0.045, 0.2, 6, 12), color, { outline });
  leg.position.y = -0.12;
  g.add(leg);
  const foot = part(new THREE.CapsuleGeometry(0.045, 0.12, 6, 12), color, { outline });
  foot.rotation.x = Math.PI / 2;
  foot.position.set(0, -0.25, 0.06);
  g.add(foot);
  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.047, 12, 8), toon("#ffffff"));
  toe.position.set(0, -0.25, 0.15);
  g.add(toe);
  const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 16), toon("#ffffff"));
  cuff.rotation.x = Math.PI / 2;
  g.add(cuff);
  return g;
}

// drying rack in the living room, bars along x
const rack = new THREE.Group();
rack.position.set(1.7, 0, -2.4);
for (const sx of [-0.72, 0.72])
  for (const sz of [-1, 1]) {
    const l = cyl(0.014, 0.014, 1.15, "#c9ccd6", { outline: 0.006 });
    l.position.set(sx, 0.5, sz * 0.14);
    l.rotation.x = sz * 0.32;
    rack.add(l);
  }
for (const z of [-0.2, 0, 0.2]) {
  const b = cyl(0.012, 0.012, 1.5, "#c9ccd6", { outline: 0.006 });
  b.rotation.z = Math.PI / 2;
  b.position.set(0, 0.98, z);
  rack.add(b);
}
const rackRight = [];
const rackLeft = [];
[-0.5, 0.0, 0.5].forEach((x, i) => {
  const c = SOCK_COLORS[i];
  const r = makeSock(c);
  r.position.set(x - 0.09, 0.98, 0);
  rack.add(r);
  rackRight.push(r);
  const l = makeSock(c);
  l.position.set(x + 0.09, 0.98, 0);
  rack.add(l);
  rackLeft.push(l);
  for (const s of [r, l])
    s.add(at(box(0.03, 0.06, 0.025, "#f4f1ea", { outline: 0.005 }), 0, 0.02, 0.02));
});
world.add(rack);

// 30 lonely right socks on the bedroom floor
const sockGrid = new THREE.Group();
for (let i = 0; i < 30; i++) {
  const s = makeSock(SOCK_COLORS[i % SOCK_COLORS.length], 0.01);
  s.rotation.set(-Math.PI / 2, 0, 0.15 * Math.sin(i * 7.1));
  s.position.set(8.5 + (i % 6) * 0.42, 0.05, -1.45 + Math.floor(i / 6) * 0.48);
  sockGrid.add(s);
}
world.add(sockGrid);

// washing machine with chain
const washer = new THREE.Group();
washer.position.set(-0.55, 0, -3.55);
washer.add(at(box(0.7, 0.88, 0.66, "#f4f1ea"), 0, 0.44, 0));
washer.add(at(box(0.66, 0.12, 0.02, "#c9ccd6", { outline: 0 }), 0, 0.8, 0.33));
const porthole = part(new THREE.TorusGeometry(0.2, 0.035, 10, 28), "#c9ccd6", { outline: 0.008 });
porthole.position.set(0, 0.42, 0.34);
washer.add(porthole);
const glass = new THREE.Mesh(
  new THREE.CircleGeometry(0.19, 28),
  new THREE.MeshBasicMaterial({ color: "#5aa9d6" }),
);
glass.position.set(0, 0.42, 0.335);
washer.add(glass);
const chain = new THREE.Group();
for (const sgn of [-1, 1]) {
  for (let k = 0; k < 15; k++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 12), toon("#8a8f9c"));
    link.position.set(-0.36 + k * 0.052, 0.42 + sgn * (-0.3 + k * 0.043), 0.36);
    link.rotation.set(0, k % 2 ? Math.PI / 2 : 0, sgn * 0.7);
    chain.add(link);
  }
}
const padlock = new THREE.Group();
padlock.add(box(0.12, 0.1, 0.05, "#f7d65a", { outline: 0.008 }));
const shackle = new THREE.Mesh(
  new THREE.TorusGeometry(0.04, 0.012, 6, 12, Math.PI),
  toon("#8a8f9c"),
);
shackle.position.y = 0.05;
padlock.add(shackle);
padlock.position.set(0, 0.42, 0.4);
chain.add(padlock);
washer.add(chain);
world.add(washer);

// small props
const phone = box(0.07, 0.14, 0.02, "#1d1a26", { outline: 0.006 });
world.add(phone);
const handSock = makeSock("#e8505b");
world.add(handSock);
const flashlight = new THREE.Group();
flashlight.add(at(cyl(0.03, 0.04, 0.2, "#3d7be0", { outline: 0.006 }), 0, 0, 0));
flashlight.children[0].rotation.x = Math.PI / 2;
const beamGeo = new THREE.ConeGeometry(0.45, 2.4, 24, 1, true);
beamGeo.rotateX(-Math.PI / 2);
beamGeo.translate(0, 0, 1.2);
const beam = new THREE.Mesh(
  beamGeo,
  new THREE.MeshBasicMaterial({
    color: "#fff2b0",
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }),
);
flashlight.add(beam);
world.add(flashlight);
const torch = new THREE.SpotLight("#fff2c4", 0, 7, 0.4, 0.5, 1.4);
world.add(torch, torch.target);
const sack = sph(0.42, "#a8744a", { outline: 0.02 });
sack.scale.set(1, 1.15, 0.9);
world.add(sack);
const cash = box(0.16, 0.08, 0.02, "#7cc576", { outline: 0.006 });
world.add(cash);

// police car behind the house
const roadBack = new THREE.Mesh(new THREE.PlaneGeometry(16, 1.6), toon("#5a5e6b"));
roadBack.rotation.x = -Math.PI / 2;
roadBack.position.set(5, 0.004, -6.9);
roadBack.receiveShadow = true;
world.add(roadBack);
const policeCar = new THREE.Group();
policeCar.add(at(box(2.1, 0.55, 1.0, "#f4f1ea"), 0, 0.45, 0));
policeCar.add(at(box(2.12, 0.16, 1.02, "#2b4c9b", { outline: 0 }), 0, 0.42, 0));
policeCar.add(at(box(1.1, 0.42, 0.9, "#f4f1ea"), -0.1, 0.92, 0));
policeCar.add(at(box(1.0, 0.3, 0.92, "#9fdcff", { outline: 0 }), -0.1, 0.93, 0));
const sirenR = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.1, 0.25),
  new THREE.MeshBasicMaterial({ color: "#ff3b3b" }),
);
const sirenB = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.1, 0.25),
  new THREE.MeshBasicMaterial({ color: "#3b7bff" }),
);
sirenR.position.set(-0.22, 1.18, 0);
sirenB.position.set(0.02, 1.18, 0);
policeCar.add(sirenR, sirenB);
for (const [x, z] of [
  [-0.7, 0.5],
  [0.7, 0.5],
  [-0.7, -0.5],
  [0.7, -0.5],
]) {
  const w = cyl(0.2, 0.2, 0.14, "#1d1a26", { outline: 0.008 });
  w.rotation.x = Math.PI / 2;
  w.position.set(x, 0.2, z);
  policeCar.add(w);
}
policeCar.position.set(7.6, 0, -6.9);
world.add(policeCar);

// ---------------- the sock shop "Socken-Paul" (x 20..26) and its storage room
const SX = 23;
floor(20, 26, -4, 2, "wood", [2, 2]);
world.add(at(box(6.6, 0.3, 12.6, "#e8e0d0", { outline: 0.03 }), SX, -0.16, -4));
wall(20, 22.6, -4.07, -3.93, "#bfe3d0");
wall(23.4, 26, -4.07, -3.93, "#bfe3d0");
wall(22.6, 23.4, -4.07, -3.93, "#bfe3d0", 2.15, WALL_H);
wall(19.93, 20.07, -10, 2, "#bfe3d0");
wall(25.93, 26.07, -10, 2, "#bfe3d0");
wall(20, 26, -10.07, -9.93, "#d8d2c4");
const storeFloor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), toon("#b9b4aa"));
storeFloor.rotation.x = -Math.PI / 2;
storeFloor.position.set(SX, 0.002, -7);
storeFloor.receiveShadow = true;
world.add(storeFloor);
const stripeTex = canvasTex(256, 32, (g, w, h) => {
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? "#ffffff" : "#e8505b";
    g.fillRect(i * 32, 0, 32, h);
  }
});
const awning = new THREE.Mesh(
  new THREE.BoxGeometry(6.3, 0.1, 1.0),
  toon("#ffffff", { map: stripeTex }),
);
awning.position.set(SX, 2.75, 2.35);
awning.rotation.x = 0.28;
awning.castShadow = true;
world.add(awning);
const signTex = canvasTex(512, 128, (g, w, h) => {
  g.fillStyle = "#1d1a26";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#f7d65a";
  g.font = "bold 78px sans-serif";
  g.textAlign = "center";
  g.fillText("SOCKEN-PAUL", w / 2, 92);
});
const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.12), [
  toon("#1d1a26"),
  toon("#1d1a26"),
  toon("#1d1a26"),
  toon("#1d1a26"),
  toon("#ffffff", { map: signTex }),
  toon("#1d1a26"),
]);
sign.position.set(SX, 3.35, 2.0);
world.add(sign);
world.add(at(box(2.4, 0.95, 0.7, "#a8744a"), SX, 0.475, -1.9));
world.add(at(box(2.5, 0.06, 0.78, "#f4f1ea"), SX, 0.98, -1.9));
// shelves full of sock packs
for (const sx of [21.2, 24.8])
  for (let r = 0; r < 4; r++) {
    world.add(at(box(2.2, 0.05, 0.35, "#a8744a", { outline: 0.008 }), sx, 0.5 + r * 0.5, -3.75));
    for (let k = 0; k < 9; k++) {
      const pk = new THREE.Mesh(
        new THREE.BoxGeometry(0.17, 0.32, 0.05),
        toon(SOCK_COLORS[(k + r * 3) % SOCK_COLORS.length]),
      );
      pk.position.set(sx - 0.95 + k * 0.24, 0.69 + r * 0.5, -3.7);
      world.add(pk);
    }
  }
// packs Kevin buys
const buyPile = new THREE.Group();
for (let k = 0; k < 12; k++) {
  const pk = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.06, 0.2),
    toon(SOCK_COLORS[k % SOCK_COLORS.length]),
  );
  pk.position.set(0, 0.04 + k * 0.065, 0);
  pk.rotation.y = 0.3 * Math.sin(k * 3.3);
  pk.castShadow = true;
  buyPile.add(pk);
}
buyPile.position.set(SX - 0.5, 1.0, -1.75);
world.add(buyPile);
// "Kunde des Monats" frame with Kevin's portrait
const portraitTex = canvasTex(320, 420, (g, w, h) => {
  g.fillStyle = "#d9a441";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#9fdcff";
  g.fillRect(18, 18, w - 36, 300);
  g.strokeStyle = "#7a4a2a";
  g.lineWidth = 9;
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.moveTo(110 + i * 20, 70);
    g.lineTo(120 + i * 20, 40);
    g.stroke();
  }
  g.fillStyle = "#fbfbf7";
  g.strokeStyle = "#1d1a26";
  g.lineWidth = 7;
  g.beginPath();
  g.arc(w / 2, 165, 100, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.lineWidth = 6;
  for (const x of [w / 2 - 36, w / 2 + 36]) {
    g.beginPath();
    g.arc(x, 150, 24, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#1d1a26";
    g.beginPath();
    g.arc(x, 150, 7, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.arc(w / 2, 200, 28, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  g.fillStyle = "#1d1a26";
  g.font = "bold 34px sans-serif";
  g.textAlign = "center";
  g.fillText("KUNDE", w / 2, 360);
  g.fillText("DES MONATS", w / 2, 398);
});
const portrait = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.05, 0.8), [
  toon("#ffffff", { map: portraitTex }),
  toon("#d9a441"),
  toon("#d9a441"),
  toon("#d9a441"),
  toon("#d9a441"),
  toon("#d9a441"),
]);
portrait.position.set(20.1, 1.7, -1.4);
world.add(portrait);
// street, sidewalk and neighbours
const street = new THREE.Mesh(new THREE.PlaneGeometry(26, 6), toon("#5a5e6b"));
street.rotation.x = -Math.PI / 2;
street.position.set(SX, 0.004, 5.6);
street.receiveShadow = true;
world.add(street);
world.add(at(box(26, 0.12, 0.9, "#d8d2c4", { outline: 0.01 }), SX, 0.06, 2.6));
for (const [x, w, h, c] of [
  [17.6, 4.4, 3.8, "#f29e38"],
  [28.4, 4.4, 4.4, "#9b6ade"],
  [13.2, 4.0, 3.2, "#3d7be0"],
  [32.6, 3.6, 3.6, "#22a58b"],
]) {
  world.add(at(box(w, h, 5.6, c), x, h / 2, -1.0));
  for (let r = 0; r < 2; r++)
    for (let k = 0; k < 2; k++)
      world.add(
        at(
          box(0.8, 0.8, 0.05, "#fff3b0", { outline: 0.01 }),
          x - 0.9 + k * 1.8,
          1.2 + r * 1.4,
          1.83,
        ),
      );
}
const lampPost = new THREE.Group();
lampPost.add(at(cyl(0.05, 0.06, 3.2, "#1d1a26", { outline: 0 }), 0, 1.6, 0));
const lampBulb = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 16, 12),
  new THREE.MeshBasicMaterial({ color: "#fff3b0" }),
);
lampBulb.position.y = 3.25;
lampPost.add(lampBulb);
lampPost.position.set(19.6, 0, 2.9);
world.add(lampPost);
// storage: mountain of left socks
const MOUNT = { x: SX, z: -7.1, R: 2.5, H: 2.3 };
const legGeo = new THREE.CapsuleGeometry(0.045, 0.2, 4, 8);
const footGeo = new THREE.CapsuleGeometry(0.045, 0.12, 4, 8);
const NS = 1400;
const legs = new THREE.InstancedMesh(legGeo, toon("#ffffff"), NS);
const feet = new THREE.InstancedMesh(footGeo, toon("#ffffff"), NS);
{
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3(1, 1, 1);
  const off = new THREE.Vector3();
  const col = new THREE.Color();
  const r2 = mulberry32(7);
  for (let i = 0; i < NS; i++) {
    const rr = MOUNT.R * Math.sqrt(r2());
    const a = r2() * Math.PI * 2;
    const top = MOUNT.H * Math.pow(1 - rr / MOUNT.R, 1.2);
    p.set(
      MOUNT.x + Math.cos(a) * rr,
      Math.max(0.05, top * (0.75 + 0.25 * r2())),
      MOUNT.z + Math.sin(a) * rr,
    );
    e.set(r2() * 6.3, r2() * 6.3, r2() * 6.3);
    q.setFromEuler(e);
    m.compose(p, q, s);
    legs.setMatrixAt(i, m);
    off.set(0, -0.13, 0.06).applyQuaternion(q);
    const q2 = q
      .clone()
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
    m.compose(p.clone().add(off), q2, s);
    feet.setMatrixAt(i, m);
    col.set(SOCK_COLORS[Math.floor(r2() * SOCK_COLORS.length)]);
    legs.setColorAt(i, col);
    feet.setColorAt(i, col);
  }
}
legs.castShadow = feet.castShadow = true;
world.add(legs, feet);
const mountCore = new THREE.Mesh(
  new THREE.ConeGeometry(MOUNT.R * 0.9, MOUNT.H * 0.85, 32),
  toon("#c86b8a"),
);
mountCore.position.set(MOUNT.x, MOUNT.H * 0.42, MOUNT.z);
world.add(mountCore);

// ---------------- characters for this story
const footMats = {
  shoe: toon("#3d7be0"),
  sock: toon("#e8505b"),
  bare: toon("#f6d7c3"),
  black: toon("#2a2733"),
};
function setFeet(P, kind) {
  for (const s of P.shoes) s.material = footMats[kind];
}
const paul = makePerson({ shirt: "#2a2733", hair: "none", glasses: false });
const beanie = new THREE.Group();
const bTop = new THREE.Mesh(
  new THREE.SphereGeometry(0.445, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
  toon("#2a2733"),
);
bTop.position.y = 0.04;
beanie.add(bTop);
const bRim = part(new THREE.TorusGeometry(0.43, 0.06, 10, 32), "#3a3644", { outline: 0.01 });
bRim.rotation.x = Math.PI / 2;
bRim.position.y = 0.06;
beanie.add(bRim);
paul.head.add(beanie);
for (const sgn of [-1, 1]) {
  const m = part(new THREE.CapsuleGeometry(0.03, 0.09, 6, 10), "#4a2c1d", { outline: 0.008 });
  m.rotation.z = Math.PI / 2 + sgn * 0.35;
  m.position.set(sgn * 0.07, -0.07, 0.39);
  paul.head.add(m);
}
const apron = box(0.5, 0.6, 0.04, "#f4f1ea", { outline: 0.01 });
apron.position.set(0, 0.24, 0.28);
paul.body.add(apron);
const cop = makePerson({ shirt: "#2b4c9b", hair: "none", glasses: false });
const hat = new THREE.Group();
hat.add(at(cyl(0.34, 0.3, 0.2, "#1f2f66", { outline: 0.012 }), 0, 0.36, -0.02));
hat.add(at(box(0.5, 0.03, 0.28, "#1d1a26", { outline: 0 }), 0, 0.28, 0.24));
hat.add(at(sph(0.05, "#f7d65a", { outline: 0.006 }), 0, 0.38, 0.32));
cop.head.add(hat);
scene.add(paul.root, cop.root);

function crouch(P, k) {
  P.body.rotation.x = 0.45 * k;
  P.root.position.y -= 0.12 * k;
  P.legL.rotation.x = -0.35 * k;
  P.legR.rotation.x = -0.35 * k;
}
function lieDown(P, x, z) {
  P.root.rotation.x = -Math.PI / 2;
  P.root.position.set(x, 0.3, z);
  P.armL.rotation.z = 0.05;
  P.armR.rotation.z = -0.05;
}
function sitFloor(P, x, z, ry = 0) {
  P.root.position.set(x, -0.6, z);
  P.root.rotation.y = ry;
  P.legL.rotation.x = -1.5;
  P.legR.rotation.x = -1.5;
  P.body.rotation.x = -0.12;
}
function toHand(obj, P, i, dx = 0, dy = 0, dz = 0) {
  P.hands[i].getWorldPosition(V);
  obj.position.set(V.x + dx, V.y + dy, V.z + dz);
}
function laugh(P, t) {
  P.neck.rotation.x = -0.35 + Math.sin(t * 22) * 0.06;
  P.body.rotation.z = Math.sin(t * 11) * 0.06;
  face(P, "o");
  for (const e of P.eyes) e.scale.y = 0.15;
}

// ------------------------------------------------------------------ shots
const w1 = N("w1"),
  m1 = N("m1"),
  pol = N("pol"),
  d40 = N("d40"),
  n3 = N("n3"),
  morn = N("morn"),
  shop = N("shop");
// cold open: night, the thief
shot(
  0,
  2.4,
  [4.1, 0.45, -0.9, 5.6, 1.25, -4.0, 50, 0],
  [3.9, 0.5, -1.2, 5.3, 1.25, -4.0, 48, 0],
  "out",
);
shot(
  2.4,
  4.4,
  [3.2, 2.4, 0.6, 1.6, 1.0, -2.4, 46, 0],
  [3.0, 2.3, 0.3, 1.6, 1.0, -2.4, 44, 0],
  "inOut",
);
shot(
  4.4,
  w1,
  [2.0, 1.7, -3.7, 1.7, 1.7, -1.7, 52, 0],
  [1.95, 1.7, -3.65, 1.7, 1.75, -1.7, 46, 0.04],
  "out",
);
// week 1: Kevin hangs his laundry
shot(
  w1,
  S("L2") + 1.6,
  [4.7, 1.7, 0.7, 1.8, 1.0, -2.3, 46, 0],
  [4.3, 1.65, 0.4, 1.8, 1.0, -2.3, 44, 0],
  "inOut",
);
shot(
  S("L2") + 1.6,
  m1,
  [1.75, 1.6, -3.35, 1.7, 1.75, -1.75, 48, 0],
  [1.75, 1.62, -3.3, 1.7, 1.8, -1.75, 42, 0],
  "out",
);
// one month later: 30 right socks
shot(
  m1,
  S("L3") + 2.1,
  [9.6, 5.2, -0.3, 9.6, 0, -0.3, 52, 0],
  [9.6, 4.3, -0.3, 9.6, 0, -0.3, 50, 0.3],
  "inOut",
  { up: [0, 0, -1] },
);
shot(
  S("L3") + 2.1,
  S("L4"),
  [9.6, 1.95, 2.5, 9.6, 1.8, 0.0, 40, 0],
  [9.6, 1.92, 2.2, 9.6, 1.8, 0.0, 36, 0],
  "out",
);
shot(
  S("L4"),
  pol,
  [10.8, 1.95, 1.9, 9.6, 1.8, 0.0, 42, 0.1],
  [10.65, 1.92, 1.7, 9.6, 1.8, 0.0, 38, 0.12],
  "out",
);
// the police
shot(
  pol,
  S("L5") + 1.3,
  [1.5, 1.75, -3.35, 3.05, 1.4, -1.6, 54, 0],
  [1.6, 1.72, -3.2, 3.05, 1.4, -1.6, 50, 0],
  "out",
);
shot(
  S("L5") + 1.3,
  S("L6"),
  [3.5, 1.95, -0.85, 2.0, 1.9, -1.45, 40, 0],
  [3.4, 1.93, -0.95, 2.0, 1.9, -1.45, 36, 0],
  "out",
);
shot(
  S("L6"),
  E("L6") + 0.3,
  [1.7, 1.9, -3.1, 3.2, 1.85, -1.6, 56, -0.04],
  [1.8, 1.9, -2.95, 3.2, 1.85, -1.6, 50, -0.06],
  "lin",
);
shot(
  E("L6") + 0.3,
  d40,
  [3.6, 1.2, -9.8, 6.4, 1.0, -5.6, 50, 0],
  [4.1, 1.3, -10.2, 7.0, 1.0, -5.8, 50, 0],
  "inOut",
);
// day 40: chain + still a sock missing
shot(
  d40,
  S("L8") + 2.1,
  [1.0, 1.1, -2.1, -0.5, 0.55, -3.4, 46, 0],
  [0.8, 1.05, -2.3, -0.5, 0.55, -3.4, 42, 0],
  "out",
);
shot(
  S("L8") + 2.1,
  S("L9") - 0.3,
  [1.95, 1.2, -0.75, 1.7, 0.85, -2.4, 42, 0],
  [1.9, 1.15, -1.2, 1.7, 0.85, -2.4, 36, 0],
  "inOut",
);
// night watch with the flashlight
shot(
  S("L9") - 0.3,
  S("L9") + 1.8,
  [3.0, 0.42, 1.2, 2.4, 0.4, -2.4, 48, 0],
  [2.95, 0.42, 0.85, 2.4, 0.4, -2.4, 46, 0],
  "lin",
);
shot(
  S("L9") + 1.8,
  n3,
  [2.8, 2.0, -2.15, 2.7, 0.7, -2.95, 48, 0],
  [2.8, 1.9, -2.25, 2.7, 0.7, -2.95, 44, 0],
  "out",
);
// 3 a.m.
shot(
  n3,
  S("L10") + 1.0,
  [5.3, 1.35, 0.1, 2.6, 0.75, -2.0, 48, 0],
  [5.1, 1.3, -0.1, 2.6, 0.75, -2.0, 46, 0],
  "lin",
);
shot(
  S("L10") + 1.0,
  morn,
  [4.6, 1.05, 0.9, 3.2, 0.85, -1.9, 50, 0],
  [4.45, 1.05, 0.65, 3.2, 0.85, -1.9, 46, 0],
  "out",
);
// the morning after
shot(
  morn,
  S("L11") + 1.4,
  [2.8, 2.0, -2.15, 2.7, 0.7, -2.95, 46, 0],
  [2.8, 1.9, -2.25, 2.7, 0.7, -2.95, 44, 0],
  "out",
);
shot(
  S("L11") + 1.4,
  S("L11") + 2.6,
  [2.7, 0.6, 0.15, 2.7, 0.33, -0.95, 40, 0],
  [2.7, 0.55, -0.05, 2.7, 0.33, -0.95, 36, 0],
  "lin",
);
shot(
  S("L11") + 2.6,
  shop,
  [2.7, 1.35, 0.9, 2.7, 0.95, -1.6, 46, 0],
  [2.7, 1.3, 0.5, 2.7, 0.95, -1.6, 38, 0],
  "out",
  { shake: [S("L11") + 2.65, 0.3] },
);
// the sock shop
shot(
  shop,
  S("L12") + 2.2,
  [18.6, 1.7, 7.2, 22.6, 1.4, 0.0, 50, 0],
  [20.2, 1.6, 6.2, 23.0, 1.3, -0.6, 48, 0],
  "inOut",
);
shot(
  S("L12") + 2.2,
  S("L13"),
  [24.4, 2.5, -3.6, 22.9, 1.3, -1.0, 46, 0],
  [24.3, 2.45, -3.5, 22.9, 1.3, -1.0, 42, 0],
  "lin",
);
shot(
  S("L13"),
  S("L14"),
  [24.0, 1.95, -1.0, 23.0, 1.85, -2.75, 58, 0],
  [23.9, 1.94, -1.25, 23.0, 1.85, -2.75, 52, 0],
  "lin",
);
shot(
  S("L14"),
  S("L14") + 1.4,
  [23.6, 1.95, -0.9, 23.0, 1.9, -2.75, 56, 0],
  [23.5, 1.95, -1.15, 23.0, 1.9, -2.75, 46, 0],
  "out",
);
shot(
  S("L14") + 1.4,
  S("L15"),
  [17.0, 6.5, 9.5, 21.0, 0.6, 2.4, 46, 0],
  [27.0, 6.0, 9.0, 25.0, 0.6, 2.4, 46, 0],
  "inOut",
);
// storage
shot(
  S("L15"),
  S("L16"),
  [23.0, 1.4, -3.4, 23.0, 1.2, -7.0, 50, 0],
  [23.0, 6.2, -2.2, 23.0, 0.6, -7.2, 50, 0],
  "inOut",
);
// customer of the month
shot(
  S("L16"),
  E("L16") + 0.6,
  [22.0, 1.75, -0.9, 20.1, 1.7, -1.4, 46, 0],
  [21.7, 1.72, -1.05, 20.1, 1.7, -1.4, 40, 0],
  "out",
);
shot(
  E("L16") + 0.6,
  T.total + 0.1,
  [21.7, 1.72, -1.05, 20.1, 1.7, -1.4, 40, 0],
  [23.0, 7.5, 10.0, 23.0, 0.5, -2.0, 46, 0],
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
  for (const P of [kevin, lisa, paul, cop]) poseReset(P);
  catReset(cat);
  setNight(0);
  setFeet(kevin, "sock");
  setFeet(paul, "black");
  setFeet(cop, "black");
  beanie.visible = true;
  apron.visible = false;
  doorPivot.rotation.y = 0;
  for (const s of rackLeft) s.visible = true;
  sockGrid.visible = false;
  chain.visible = false;
  phone.visible = false;
  handSock.visible = false;
  flashlight.visible = false;
  torch.intensity = 0;
  sack.visible = false;
  cash.visible = false;
  buyPile.visible = false;
  sirenR.material.color.set("#ff3b3b");
  sirenB.material.color.set("#3b7bff");
  const holds = [];

  if (t < w1) {
    // ---------------- cold open: night, the thief takes one left sock
    setNight(1);
    doorPivot.rotation.y = -1.35 * ease.out(seg(t, 0.1, 0.8)) * (1 - seg(t, 4.6, 5.2));
    const k = seg(t, 0.4, 2.9);
    paul.root.position.set(lerp(5.6, 1.72, ease.inOut(k)), 0, lerp(-4.4, -1.72, ease.inOut(k)));
    paul.root.rotation.y = k < 1 ? Math.atan2(1.72 - 5.6, -1.72 + 4.4) : Math.PI;
    if (k > 0 && k < 1) walk(paul, t, 9);
    crouch(paul, 0.6 * (1 - seg(t, 2.6, 3.2)));
    // reach for the left sock, then lift it to look at it
    const reach = ease.out(seg(t, 3.0, 3.5));
    paul.armR.rotation.x = -1.4 * reach;
    if (t > 3.5) {
      rackLeft[1].visible = false;
      handSock.visible = true;
      holds.push([handSock, paul, 1, 0, 0.1, 0]);
      const lift = ease.out(seg(t, 4.4, 5.0));
      paul.armR.rotation.x = lerp(-1.4, -2.3, lift);
      paul.neck.rotation.x = -0.2 * lift;
      face(paul, t > 4.9 ? "smile" : "flat");
    }
    cat.root.position.set(3.9, 0.55, -3.35);
    cat.root.rotation.y = -0.6;
    cat.eyeMat.emissive.set("#b8c21e");
    catIdle(cat, t);
  } else if (t < m1) {
    // ---------------- week 1: Kevin happily hangs laundry
    kevin.root.position.set(1.72, 0, -1.72);
    kevin.root.rotation.y = Math.PI;
    breathe(kevin, t);
    blink(kevin, t, 0.3);
    face(kevin, "smile");
    kevin.head.rotation.z = Math.sin(t * 4.5) * 0.08;
    kevin.armR.rotation.x = -1.3 - Math.max(0, Math.sin(t * 3)) * 0.4;
    handSock.visible = true;
    holds.push([handSock, kevin, 1, 0, 0.1, 0]);
    rackLeft[0].visible = false;
    if (t > S("L2") + 1.6) {
      kevin.root.rotation.y = Math.PI;
      kevin.neck.rotation.y = 0.15 * Math.sin(t * 2);
    }
    cat.root.position.set(3.9, 0.55, -3.35);
    catIdle(cat, t);
  } else if (t < S("L4")) {
    // ---------------- one month later: 30 right socks, no left one
    sockGrid.visible = true;
    kevin.root.position.set(9.6, 0, 0.0);
    kevin.root.rotation.y = 0;
    breathe(kevin, t);
    blink(kevin, t, 0.8);
    face(kevin, "flat");
    kevin.neck.rotation.y = Math.sin(t * 1.6) * 0.5 * (1 - seg(t, S("L3") + 2.0, S("L3") + 2.3));
    kevin.armL.rotation.z = -0.5;
    kevin.armR.rotation.z = 0.5;
    if (t > S("L3") + 2.1) tinyEyes(kevin);
  } else if (t < pol) {
    // ---------------- calls the police
    sockGrid.visible = true;
    kevin.root.position.set(9.6, 0, 0.0);
    blink(kevin, t, 0.2);
    face(kevin, "o");
    kevin.armR.rotation.x = -2.55;
    kevin.armR.rotation.z = 0.55;
    phone.visible = true;
    holds.push([phone, kevin, 1, 0, 0.05, 0]);
  } else if (t < E("L6") + 0.3) {
    // ---------------- the officer, a sock, and Kevin
    kevin.root.position.set(2.0, 0, -1.45);
    kevin.root.rotation.y = Math.PI / 2;
    breathe(kevin, t);
    blink(kevin, t, 1.2);
    face(kevin, "smile");
    cop.root.position.set(3.2, 0, -1.6);
    cop.root.rotation.y = -Math.PI / 2;
    breathe(cop, t + 0.5);
    blink(cop, t, 0.1);
    face(cop, "flat");
    cop.armR.rotation.x = -1.25;
    handSock.visible = true;
    holds.push([handSock, cop, 1, 0, 0.12, 0]);
    cop.neck.rotation.x = 0.35 * (1 - ease.inOut(seg(t, S("L5") + 1.2, S("L5") + 1.5)));
    if (t > S("L6")) {
      face(cop, "smile");
      cop.head.rotation.z = 0.12 * ease.out(seg(t, S("L6"), S("L6") + 0.4));
      for (const e of cop.eyes) e.scale.y = 0.6;
    }
    rackLeft[0].visible = rackLeft[1].visible = rackLeft[2].visible = false;
  } else if (t < d40) {
    // ---------------- he laughs all the way back to his car
    doorPivot.rotation.y = -1.4;
    kevin.root.position.set(5.6, 0, -3.75);
    kevin.root.rotation.y = Math.PI;
    face(kevin, "flat");
    tinyEyes(kevin);
    const k = seg(t, E("L6") + 0.3, d40 - 0.2);
    cop.root.position.set(lerp(5.6, 7.3, k), 0, lerp(-4.5, -6.1, k));
    cop.root.rotation.y = Math.PI - 0.6;
    walk(cop, t, 7);
    laugh(cop, t);
    sirenR.material.color.set(Math.sin(t * 14) > 0 ? "#ff3b3b" : "#5a1f2b");
    sirenB.material.color.set(Math.sin(t * 14) > 0 ? "#1d2a55" : "#3b7bff");
  } else if (t < S("L9") - 0.3) {
    // ---------------- day 40: chain on the washer, still a sock missing
    chain.visible = true;
    chain.scale.setScalar(lerp(0.6, 1, ease.back(seg(t, S("L8"), S("L8") + 1.8))));
    padlock.visible = t > S("L8") + 1.8;
    kevin.root.position.set(-0.55, 0, -2.6);
    kevin.root.rotation.y = Math.PI;
    breathe(kevin, t);
    blink(kevin, t, 0.6);
    face(kevin, "flat");
    kevin.armL.rotation.x =
      -1.0 - Math.sin(t * 6) * 0.25 * (1 - seg(t, S("L8") + 1.6, S("L8") + 1.9));
    kevin.armR.rotation.x =
      -1.0 + Math.sin(t * 6) * 0.25 * (1 - seg(t, S("L8") + 1.6, S("L8") + 1.9));
    rackLeft[2].visible = false;
  } else if (t < n3) {
    // ---------------- night watch with a flashlight
    setNight(1);
    lieDown(kevin, 2.7, -0.94);
    face(kevin, "flat");
    blink(kevin, t, 0.4);
    kevin.armR.rotation.x = -0.6;
    kevin.armR.rotation.z = 0.9;
    flashlight.visible = true;
    holds.push([flashlight, kevin, 1, 0, 0, 0]);
    torch.intensity = 5;
    cat.root.position.set(3.9, 0.55, -3.35);
    cat.root.rotation.y = -0.9;
    cat.eyeMat.emissive.set("#b8c21e");
    catIdle(cat, t);
  } else if (t < morn) {
    // ---------------- 3 a.m.: Kevin fell asleep
    setNight(1);
    lieDown(kevin, 2.7, -0.94);
    face(kevin, "flat");
    for (const e of kevin.eyes) e.scale.y = 0.12;
    kevin.armR.rotation.z = 0.9;
    flashlight.visible = true;
    flashlight.position.set(3.15, 0.08, -1.7);
    flashlight.lookAt(3.6, 0.2, -3.5);
    cat.root.position.set(3.9, 0.55, -3.35);
    cat.root.rotation.y = -0.9;
    cat.eyeMat.emissive.set("#b8c21e");
    catIdle(cat, t);
    const k = seg(t, n3 + 0.1, S("L10") + 0.9);
    paul.root.position.set(lerp(5.4, 2.7, ease.inOut(k)), 0, lerp(-3.4, -0.25, ease.inOut(k)));
    paul.root.rotation.y = k < 1 ? Math.atan2(2.7 - 5.4, -0.25 + 3.4) : Math.PI;
    if (k > 0 && k < 1) walk(paul, t, 9);
    crouch(paul, 0.7);
    if (t > S("L10") + 1.0) {
      // turns to the cat: psst
      const turn = ease.out(seg(t, S("L10") + 1.0, S("L10") + 1.4));
      paul.root.rotation.y = lerp(Math.PI, Math.PI + 2.4, turn);
      paul.armR.rotation.x = -2.6 * turn;
      paul.armR.rotation.z = 0.5 * turn;
      face(paul, "flat");
      if (t > S("L10") + 1.9) {
        for (const l of cat.lids) l.rotation.x = 1.2;
        paul.root.rotation.y = Math.PI;
        paul.armR.rotation.set(-1.0, 0, 0);
        paul.armL.rotation.x = -1.0;
      }
    }
    if (t > morn - 0.25) setFeet(kevin, "bare");
  } else if (t < shop) {
    // ---------------- the morning after: socks gone - the ones he wore
    setFeet(kevin, "bare");
    flashlight.visible = true;
    flashlight.position.set(3.15, 0.08, -1.7);
    flashlight.lookAt(3.6, 0.2, -3.5);
    if (t < S("L11") + 2.6) {
      lieDown(kevin, 2.7, -0.94);
      for (const e of kevin.eyes) e.scale.y = t > S("L11") + 0.35 ? 1 : 0.12;
      face(kevin, "flat");
      for (const s of kevin.shoes)
        s.scale.set(1.1, 0.65 + Math.max(0, Math.sin(t * 12)) * 0.12, 1.6);
    } else {
      sitFloor(kevin, 2.7, -1.6, 0);
      tinyEyes(kevin);
      face(kevin, "o");
      kevin.armL.rotation.z = 0.9;
      kevin.armR.rotation.z = -0.9;
      kevin.sweat.visible = true;
    }
  } else if (t < S("L14") + 1.4) {
    // ---------------- the sock shop
    beanie.visible = false;
    apron.visible = true;
    paul.root.position.set(SX, 0, -2.75);
    paul.root.rotation.y = 0;
    breathe(paul, t);
    blink(paul, t, 0.9);
    face(paul, "smile");
    const walkIn = seg(t, shop + 0.1, S("L12") + 2.0);
    if (t < S("L14")) {
      kevin.root.position.set(
        lerp(18.2, SX - 0.1, ease.inOut(walkIn)),
        0,
        lerp(3.4, -1.05, ease.inOut(walkIn)),
      );
      kevin.root.rotation.y = walkIn < 1 ? Math.atan2(SX - 18.2, -1.05 - 3.4) : Math.PI;
      if (walkIn > 0 && walkIn < 1) walk(kevin, t, 8);
      blink(kevin, t, 0.5);
      face(kevin, "smile");
      setFeet(kevin, "shoe");
      if (t > S("L12") + 2.2) {
        buyPile.visible = true;
        buyPile.scale.y = ease.out(seg(t, S("L12") + 2.2, S("L12") + 3.4));
        kevin.armR.rotation.x = -1.3 * ease.out(seg(t, S("L12") + 3.3, S("L12") + 3.6));
        if (t > S("L12") + 3.3) {
          cash.visible = true;
          holds.push([cash, kevin, 1, 0, 0.05, 0]);
        }
      }
    }
    if (t > S("L13") + 1.6) for (const e of paul.eyes) e.position.y = 0.0;
    if (t > S("L14")) {
      // the beanie goes on - he is the man
      const on = ease.out(seg(t, S("L14") + 0.1, S("L14") + 0.6));
      beanie.visible = true;
      beanie.position.y = lerp(0.6, 0, on);
      paul.armL.rotation.x = -2.6 * (1 - seg(t, S("L14") + 0.6, S("L14") + 0.9));
      paul.armR.rotation.x = -2.6 * (1 - seg(t, S("L14") + 0.6, S("L14") + 0.9));
      apron.visible = t < S("L14") + 0.6;
      face(paul, "smile");
      for (const e of paul.eyes) e.scale.set(1, 0.55, 1);
    }
  } else if (t < S("L15")) {
    // ---------------- every night, all over town
    setNight(1);
    const k = seg(t, S("L14") + 1.4, S("L15"));
    paul.root.position.set(lerp(17.5, 28.5, k), 0, 3.2);
    paul.root.rotation.y = Math.PI / 2;
    walk(paul, t, 9);
    crouch(paul, 0.4);
    sack.visible = true;
    sack.position.set(paul.root.position.x - 0.15, 1.75, 2.85);
  } else {
    // ---------------- the storage room and the customer of the month
    paul.root.position.set(SX + 1.6, 0, -5.0);
    paul.root.rotation.y = -0.4;
    breathe(paul, t);
    face(paul, "smile");
    paul.armR.rotation.x = -1.2;
    paul.armR.rotation.z = 0.6;
    blink(paul, t, 0.2);
  }

  if (holds.length) {
    scene.updateMatrixWorld(true);
    for (const [obj, P, i, dx, dy, dz] of holds) toHand(obj, P, i, dx, dy, dz);
  }
  if (flashlight.visible && torch.intensity > 0) {
    flashlight.lookAt(1.6, 0.9, -2.5);
    torch.position.copy(flashlight.position);
    torch.target.position.set(1.6, 0.9, -2.5);
  }
  beam.visible = torch.intensity > 0;

  cameraAt(t);
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
