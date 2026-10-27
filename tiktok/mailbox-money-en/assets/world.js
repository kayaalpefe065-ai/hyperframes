// 3D world for "Money in the Mailbox" (waswenn.exe1, English) - blocky plastic look.
// Everything on screen is a pure function of the seek time t (renderAt).
import * as THREE from "./three.module.min.js";
import { RoundedBoxGeometry } from "./RoundedBoxGeometry.js";

const T = window.HF_TIMING;
const S = (id) => T.lines[id].s;
const E = (id) => T.lines[id].e;
const N = (id) => T.marks[id];

// ------------------------------------------------------------------ helpers
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = {
  lin: (u) => u,
  inOut: (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
  out: (u) => 1 - Math.pow(1 - u, 3),
  in: (u) => u * u * u,
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
const rnd = mulberry32(5);

// ------------------------------------------------------------------ renderer
const canvas = document.getElementById("world-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1080, 1920, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.05, 260);

const matCache = new Map();
function plastic(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!matCache.has(key))
    matCache.set(
      key,
      new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...extra }),
    );
  return matCache.get(key);
}
function mesh(geom, mat, shadow = true) {
  const m = new THREE.Mesh(geom, typeof mat === "string" ? plastic(mat) : mat);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}
const rbox = (w, h, d, c, r = 0.04) =>
  mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), c);
const box = (w, h, d, c) => mesh(new THREE.BoxGeometry(w, h, d), c);
const cyl = (r1, r2, h, c, seg = 20) => mesh(new THREE.CylinderGeometry(r1, r2, h, seg), c);
const at = (o, x, y, z) => (o.position.set(x, y, z), o);
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
const hemi = new THREE.HemisphereLight("#d6ecff", "#6f8a5a", 1.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight("#fff3dc", 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 60 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const streetLight = new THREE.PointLight("#ffd28a", 0, 9, 1.4);
streetLight.position.set(3.6, 3.2, 5.6);
scene.add(streetLight);
const roomLight = new THREE.PointLight("#9fb4ff", 0, 6, 1.5);
roomLight.position.set(1.4, 2.4, 0.2);
scene.add(roomLight);
const copLightR = new THREE.PointLight("#ff3030", 0, 8, 1.5);
const copLightB = new THREE.PointLight("#3060ff", 0, 8, 1.5);
scene.add(copLightR, copLightB);

// ------------------------------------------------------------------ ground, street, houses
const studTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = "#5fb34f";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#6cc05b";
  for (const [x, y] of [
    [32, 32],
    [96, 32],
    [32, 96],
    [96, 96],
  ]) {
    g.beginPath();
    g.arc(x, y, 16, 0, Math.PI * 2);
    g.fill();
  }
});
studTex.wrapS = studTex.wrapT = THREE.RepeatWrapping;
studTex.repeat.set(70, 70);
const groundMat = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  map: studTex,
  roughness: 0.8,
});
const ground = mesh(new THREE.PlaneGeometry(140, 140), groundMat, false);
ground.rotation.x = -Math.PI / 2;
ground.position.set(4, 0, 0);
scene.add(ground);
const snowCover = mesh(
  new THREE.PlaneGeometry(140, 140),
  new THREE.MeshStandardMaterial({ color: "#f4f8ff", roughness: 0.9 }),
  false,
);
snowCover.rotation.x = -Math.PI / 2;
snowCover.position.set(4, 0.03, 0);
scene.add(snowCover);
const road = mesh(new THREE.PlaneGeometry(120, 4), "#4a4f5c", false);
road.rotation.x = -Math.PI / 2;
road.position.set(4, 0.01, 8);
scene.add(road);
for (let x = -40; x < 50; x += 3) scene.add(at(box(1.4, 0.02, 0.18, "#f4f1ea"), x, 0.02, 8));
scene.add(at(box(120, 0.12, 1.2, "#c9ccd6"), 4, 0.06, 5.6));

function house({ x, wall, roof, door, trim }) {
  const g = new THREE.Group();
  const H = 3.0;
  const W = 6;
  const D = 5;
  const zf = 1.5;
  const zb = zf - D;
  const t = 0.18;
  g.add(at(box(W, 0.12, D, "#c8a27a"), 0, 0.06, (zf + zb) / 2));
  g.add(at(box(W, H, t, wall), 0, H / 2, zb));
  g.add(at(box(t, H, D, wall), -W / 2, H / 2, (zf + zb) / 2));
  g.add(at(box(t, H, D, wall), W / 2, H / 2, (zf + zb) / 2));
  // front wall: door gap x -1.5..-0.5, window gap x 0.6..2.2 (y 1.0..2.2)
  g.add(at(box(1.5, H, t, wall), -2.25, H / 2, zf));
  g.add(at(box(1.1, H, t, wall), 0.05, H / 2, zf));
  g.add(at(box(0.8, H, t, wall), 2.6, H / 2, zf));
  g.add(at(box(1.0, H - 2.2, t, wall), -1.0, 2.2 + (H - 2.2) / 2, zf));
  g.add(at(box(1.6, 1.0, t, wall), 1.4, 0.5, zf));
  g.add(at(box(1.6, H - 2.2, t, wall), 1.4, 2.2 + (H - 2.2) / 2, zf));
  for (const [w, h, px, py] of [
    [1.7, 0.1, 1.4, 1.0],
    [1.7, 0.1, 1.4, 2.2],
    [0.1, 1.3, 0.6, 1.6],
    [0.1, 1.3, 2.2, 1.6],
  ])
    g.add(at(rbox(w, h, 0.26, trim, 0.03), px, py, zf));
  // roof
  const roofGeo = new THREE.CylinderGeometry(0.01, 4.4, 1.8, 4, 1);
  const r = mesh(roofGeo, roof);
  r.rotation.y = Math.PI / 4;
  r.scale.set(1, 1, 0.82);
  r.position.set(0, H + 0.9, (zf + zb) / 2);
  g.add(r);
  // door
  const pivot = new THREE.Group();
  pivot.position.set(-1.5, 0, zf);
  const d = rbox(1.0, 2.2, 0.1, door, 0.03);
  d.position.set(0.5, 1.1, 0);
  pivot.add(d);
  d.add(at(mesh(new THREE.SphereGeometry(0.05, 12, 8), "#f7d65a"), 0.35, 0, 0.07));
  g.add(pivot);
  // path to the street
  g.add(at(box(1.1, 0.04, 3.4, "#c9ccd6"), -1.0, 0.03, zf + 1.8));
  g.position.x = x;
  scene.add(g);
  return { g, door: pivot };
}
const mason = house({ x: 0, wall: "#e9e3d6", roof: "#c0392b", door: "#3d7be0", trim: "#ffffff" });
house({ x: 9, wall: "#9fd3e6", roof: "#4a5a7a", door: "#f29e38", trim: "#ffffff" });
house({ x: -9, wall: "#f6c9a0", roof: "#6b4f3a", door: "#22a58b", trim: "#ffffff" });
house({ x: 18, wall: "#d7c8f0", roof: "#8a3b5a", door: "#e8505b", trim: "#ffffff" });
// Mason's room: bed, lamp, curtains
scene.add(at(rbox(1.2, 0.45, 2.0, "#4f6edb", 0.06), -0.4, 0.3, -2.0));
scene.add(at(rbox(1.2, 0.2, 0.5, "#ffffff", 0.06), -0.4, 0.6, -2.8));
const curtainL = rbox(0.45, 1.4, 0.06, "#7b5ea7", 0.02);
const curtainR = rbox(0.45, 1.4, 0.06, "#7b5ea7", 0.02);
scene.add(curtainL, curtainR);
const windowGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(1.5, 1.15),
  new THREE.MeshBasicMaterial({
    color: "#9fc4ff",
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  }),
);
windowGlow.position.set(1.4, 1.6, 1.42);
scene.add(windowGlow);
// trees and fences
function tree(x, z, s = 1) {
  const g = new THREE.Group();
  g.add(at(rbox(0.35, 1.4, 0.35, "#7a4f2e", 0.05), 0, 0.7, 0));
  g.add(at(rbox(1.5, 1.1, 1.5, "#3f9a45", 0.15), 0, 1.8, 0));
  g.add(at(rbox(1.0, 0.8, 1.0, "#4fb350", 0.15), 0, 2.6, 0));
  g.scale.setScalar(s);
  g.position.set(x, 0, z);
  scene.add(g);
}
[
  [-4.4, 3.6],
  [5.0, 3.2],
  [13.6, 3.6],
  [-13, 3.0],
  [22, 3.2],
  [-5, -6],
  [7, -6],
  [14, -6],
].forEach(([x, z], i) => tree(x, z, 0.9 + (i % 3) * 0.15));
for (let x = -3; x <= 3.6; x += 0.6)
  if (x < -1.7 || x > -0.3) scene.add(at(rbox(0.12, 0.6, 0.12, "#ffffff", 0.02), x, 0.3, 4.9));
scene.add(at(box(2.0, 0.08, 0.06, "#ffffff"), -2.6, 0.45, 4.9));
scene.add(at(box(3.3, 0.08, 0.06, "#ffffff"), 1.95, 0.45, 4.9));
// street lamp
scene.add(at(cyl(0.07, 0.09, 3.2, "#2b2f3a"), 3.6, 1.6, 5.4));
const bulb = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 16, 12),
  new THREE.MeshBasicMaterial({ color: "#fff3c4" }),
);
bulb.position.set(3.6, 3.25, 5.4);
scene.add(bulb);
// neighbour's lawnmower
const mower = new THREE.Group();
mower.add(at(rbox(0.6, 0.3, 0.8, "#e8432e", 0.06), 0, 0.3, 0));
for (const [x, z] of [
  [-0.32, 0.3],
  [0.32, 0.3],
  [-0.32, -0.3],
  [0.32, -0.3],
]) {
  const w = cyl(0.12, 0.12, 0.08, "#1d1a26");
  w.rotation.z = Math.PI / 2;
  w.position.set(x, 0.12, z);
  mower.add(w);
}
const handle = box(0.05, 0.9, 0.05, "#1d1a26");
handle.position.set(0, 0.7, 0.55);
handle.rotation.x = -0.6;
mower.add(handle);
scene.add(mower);

// ------------------------------------------------------------------ mailbox and money
const mbox = new THREE.Group();
mbox.position.set(2.2, 0, 4.6);
mbox.add(at(box(0.12, 0.95, 0.12, "#6b4f3a"), 0, 0.47, 0));
const mbBody = new THREE.Group();
mbBody.position.y = 1.05;
mbBody.add(at(box(0.36, 0.03, 0.56, "#2f4f8f"), 0, -0.135, 0));
mbBody.add(at(box(0.03, 0.27, 0.56, "#2f4f8f"), -0.165, 0, 0));
mbBody.add(at(box(0.03, 0.27, 0.56, "#2f4f8f"), 0.165, 0, 0));
mbBody.add(at(box(0.36, 0.27, 0.03, "#2f4f8f"), 0, 0, -0.265));
const roofArc = mesh(
  new THREE.CylinderGeometry(0.18, 0.18, 0.56, 20, 1, false, -Math.PI / 2, Math.PI),
  "#2f4f8f",
);
roofArc.rotation.x = Math.PI / 2;
roofArc.position.y = 0.135;
mbBody.add(roofArc);
const mbDoor = new THREE.Group();
mbDoor.position.set(0, -0.135, 0.28);
mbDoor.add(at(box(0.36, 0.3, 0.025, "#3a62aa"), 0, 0.15, 0));
mbBody.add(mbDoor);
const flag = new THREE.Group();
flag.position.set(0.2, 0.0, -0.1);
flag.add(at(box(0.03, 0.3, 0.03, "#e8432e"), 0, 0.15, 0));
flag.add(at(box(0.03, 0.1, 0.14, "#e8432e"), 0, 0.27, 0.07));
mbBody.add(flag);
mbox.add(mbBody);
scene.add(mbox);

const billTex = canvasTex(128, 64, (g, w, h) => {
  g.fillStyle = "#86c97a";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "#3f7a3a";
  g.lineWidth = 5;
  g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = "#3f7a3a";
  g.font = "bold 40px sans-serif";
  g.textAlign = "center";
  g.fillText("$", w / 2, 46);
});
const billMat = new THREE.MeshStandardMaterial({ color: "#ffffff", map: billTex, roughness: 0.7 });
const billGeo = new THREE.BoxGeometry(0.17, 0.006, 0.08);
function bill() {
  return mesh(billGeo, billMat);
}
// pile inside the mailbox (grows), bills spilling out, money bags
const pile = new THREE.Group();
const pileBills = [];
for (let i = 0; i < 46; i++) {
  const b = bill();
  b.position.set(
    (rnd() - 0.5) * 0.24,
    -0.12 + Math.floor(i / 6) * 0.012 + rnd() * 0.01,
    (rnd() - 0.5) * 0.44,
  );
  b.rotation.set((rnd() - 0.5) * 0.4, rnd() * 3, (rnd() - 0.5) * 0.4);
  pile.add(b);
  pileBills.push(b);
}
mbBody.add(pile);
const spill = new THREE.Group();
for (let i = 0; i < 40; i++) {
  const b = bill();
  const a = rnd() * Math.PI * 2;
  const r = 0.2 + rnd() * 1.1;
  b.position.set(2.2 + Math.cos(a) * r, 0.02 + rnd() * 0.02, 4.6 + Math.sin(a) * r);
  b.rotation.set(0, rnd() * 6, 0);
  spill.add(b);
}
const sticking = [];
for (let i = 0; i < 6; i++) {
  const b = bill();
  b.position.set(2.2 + (rnd() - 0.5) * 0.25, 1.06 + rnd() * 0.08, 4.9 + rnd() * 0.05);
  b.rotation.set(-0.9 - rnd() * 0.5, rnd() - 0.5, (rnd() - 0.5) * 0.6);
  spill.add(b);
  sticking.push(b);
}
scene.add(spill);
const bagTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = "#c9a26b";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#3f7a3a";
  g.font = "bold 92px sans-serif";
  g.textAlign = "center";
  g.fillText("$", w / 2, 98);
});
function moneyBag() {
  const g = new THREE.Group();
  const body = mesh(
    new RoundedBoxGeometry(0.42, 0.44, 0.36, 3, 0.12),
    new THREE.MeshStandardMaterial({ color: "#ffffff", map: bagTex, roughness: 0.8 }),
  );
  body.position.y = 0.22;
  g.add(body);
  g.add(at(rbox(0.18, 0.12, 0.16, "#b08a55", 0.04), 0, 0.5, 0));
  return g;
}
const bags = new THREE.Group();
[
  [1.6, 4.9, 0.4],
  [2.75, 4.95, -0.3],
  [2.4, 4.15, 0.9],
  [1.85, 4.2, -0.6],
  [2.2, 5.3, 0.2],
].forEach(([x, z, r]) => {
  const b = moneyBag();
  b.position.set(x, 0, z);
  b.rotation.y = r;
  bags.add(b);
});
scene.add(bags);
const carryBag = moneyBag();
scene.add(carryBag);
const handBills = new THREE.Group();
for (let i = 0; i < 7; i++) {
  const b = bill();
  b.rotation.set(Math.PI / 2, 0, -0.5 + i * 0.16);
  b.position.set(-0.06 + i * 0.02, 0, 0);
  handBills.add(b);
}
scene.add(handBills);
const oneBill = bill();
oneBill.rotation.x = Math.PI / 2;
scene.add(oneBill);
const noteTex = canvasTex(512, 384, (g, w, h) => {
  g.fillStyle = "#fffbe8";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "#d6e4ff";
  g.lineWidth = 3;
  for (let y = 70; y < h; y += 48) {
    g.beginPath();
    g.moveTo(20, y);
    g.lineTo(w - 20, y);
    g.stroke();
  }
  g.fillStyle = "#1d2a55";
  g.font = "italic bold 46px sans-serif";
  g.fillText("Thanks for keeping", 34, 110);
  g.fillText("it safe :)", 34, 166);
  g.font = "italic 34px sans-serif";
  g.fillText("The bank looked", 34, 250);
  g.fillText("everywhere. Except here.", 34, 296);
});
const note = mesh(
  new THREE.PlaneGeometry(0.32, 0.24),
  new THREE.MeshStandardMaterial({ map: noteTex, roughness: 0.9, side: THREE.DoubleSide }),
  false,
);
scene.add(note);
const postTex = canvasTex(512, 320, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "#5fc8ff");
  gr.addColorStop(0.6, "#9fe6ff");
  gr.addColorStop(0.6, "#f4d58d");
  gr.addColorStop(1, "#f4d58d");
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#ffffff";
  g.font = "bold 52px sans-serif";
  g.textAlign = "center";
  g.fillText("GREETINGS", w / 2, 90);
  g.fillText("FROM PARADISE", w / 2, 150);
  g.fillStyle = "#e8432e";
  g.font = "bold 40px sans-serif";
  g.fillText("Merry Christmas, Mason!", w / 2, 270);
});
const postcard = mesh(
  new THREE.PlaneGeometry(0.34, 0.21),
  new THREE.MeshStandardMaterial({ map: postTex, roughness: 0.8, side: THREE.DoubleSide }),
  false,
);
scene.add(postcard);

// police car
const car = new THREE.Group();
car.add(at(rbox(2.4, 0.6, 1.2, "#f4f1ea", 0.12), 0, 0.5, 0));
car.add(at(rbox(2.42, 0.2, 1.22, "#1d1a26", 0.06), 0, 0.42, 0));
car.add(at(rbox(1.3, 0.5, 1.1, "#f4f1ea", 0.12), -0.15, 1.0, 0));
car.add(at(rbox(1.25, 0.32, 1.12, "#9fdcff", 0.06), -0.15, 1.02, 0));
const sirenR = new THREE.Mesh(
  new THREE.BoxGeometry(0.28, 0.12, 0.3),
  new THREE.MeshBasicMaterial({ color: "#ff3030" }),
);
const sirenB = new THREE.Mesh(
  new THREE.BoxGeometry(0.28, 0.12, 0.3),
  new THREE.MeshBasicMaterial({ color: "#3060ff" }),
);
sirenR.position.set(-0.3, 1.31, 0);
sirenB.position.set(0.0, 1.31, 0);
car.add(sirenR, sirenB);
for (const [x, z] of [
  [-0.8, 0.6],
  [0.8, 0.6],
  [-0.8, -0.6],
  [0.8, -0.6],
]) {
  const w = cyl(0.25, 0.25, 0.18, "#1d1a26");
  w.rotation.x = Math.PI / 2;
  w.position.set(x, 0.25, z);
  car.add(w);
}
scene.add(car);

// ---------------- the island (far away)
const ISL = { x: 60, z: 0 };
const sea = mesh(
  new THREE.CircleGeometry(30, 48),
  new THREE.MeshStandardMaterial({ color: "#2fa3d6", roughness: 0.3 }),
  false,
);
sea.rotation.x = -Math.PI / 2;
sea.position.set(ISL.x, 0.05, ISL.z);
scene.add(sea);
scene.add(at(cyl(4.2, 4.6, 0.4, "#f4d58d", 40), ISL.x, 0.1, ISL.z));
const palm = new THREE.Group();
for (let i = 0; i < 6; i++)
  palm.add(at(rbox(0.32, 0.55, 0.32, "#a8744a", 0.06), i * 0.08, 0.5 + i * 0.52, 0));
for (let k = 0; k < 5; k++) {
  const leaf = rbox(1.6, 0.06, 0.45, "#3f9a45", 0.03);
  leaf.position.set(0.4 + Math.cos(k * 1.26) * 0.7, 3.5, Math.sin(k * 1.26) * 0.7);
  leaf.rotation.set(0, -k * 1.26, -0.35);
  palm.add(leaf);
}
palm.position.set(ISL.x - 1.4, 0.3, ISL.z - 1.0);
scene.add(palm);
const chair = new THREE.Group();
chair.add(at(rbox(0.7, 0.1, 1.6, "#e8505b", 0.03), 0, 0.45, 0));
const back = rbox(0.7, 0.9, 0.1, "#e8505b", 0.03);
back.position.set(0, 0.8, -0.8);
back.rotation.x = -0.5;
chair.add(back);
chair.position.set(ISL.x + 0.6, 0.3, ISL.z);
scene.add(chair);
const islandBags = new THREE.Group();
[
  [1.6, 0.6],
  [1.9, -0.2],
  [-0.3, 1.3],
  [0.2, 1.6],
].forEach(([dx, dz]) => islandBags.add(at(moneyBag(), ISL.x + dx, 0.3, ISL.z + dz)));
scene.add(islandBags);
const cocktail = new THREE.Group();
cocktail.add(at(cyl(0.05, 0.03, 0.14, "#ff9ec4"), 0, 0.07, 0));
cocktail.add(at(mesh(new THREE.SphereGeometry(0.03, 10, 8), "#ffd23d"), 0.04, 0.16, 0));
scene.add(cocktail);

// snow
const SNOW = 700;
const snowGeo = new THREE.BufferGeometry();
snowGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SNOW * 3), 3));
const snowSeed = Array.from({ length: SNOW }, () => [
  rnd() * 16 - 6,
  rnd() * 9,
  rnd() * 14 - 2,
  0.6 + rnd() * 0.8,
]);
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: "#ffffff", size: 0.07 }));
scene.add(snow);

// ------------------------------------------------------------------ blocky characters
const FACES = {};
function faceTex(kind) {
  if (FACES[kind]) return FACES[kind];
  FACES[kind] = canvasTex(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    const ink = "#1d1a26";
    g.fillStyle = ink;
    g.strokeStyle = ink;
    g.lineCap = "round";
    const eyes = (ry = 16, y = 104) => {
      for (const x of [84, 172]) {
        g.beginPath();
        g.ellipse(x, y, 13, ry, 0, 0, Math.PI * 2);
        g.fill();
      }
    };
    if (kind === "mask") {
      g.fillStyle = "#151319";
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = "#fbfbf7";
      for (const x of [84, 172]) {
        g.beginPath();
        g.ellipse(x, 110, 30, 18, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = ink;
      for (const x of [86, 170]) {
        g.beginPath();
        g.arc(x, 110, 10, 0, Math.PI * 2);
        g.fill();
      }
      return;
    }
    if (kind === "cool") {
      g.fillRect(48, 82, 160, 44);
      g.fillRect(118, 90, 20, 10);
      g.lineWidth = 10;
      g.beginPath();
      g.arc(128, 150, 46, 0.15 * Math.PI, 0.85 * Math.PI);
      g.stroke();
      return;
    }
    if (kind === "shock") {
      eyes(22, 100);
      g.beginPath();
      g.ellipse(128, 178, 26, 32, 0, 0, Math.PI * 2);
      g.fill();
    } else if (kind === "worried") {
      eyes(16, 108);
      g.lineWidth = 9;
      g.beginPath();
      g.moveTo(62, 72);
      g.lineTo(104, 84);
      g.moveTo(194, 72);
      g.lineTo(152, 84);
      g.stroke();
      g.beginPath();
      g.arc(128, 196, 34, 1.15 * Math.PI, 1.85 * Math.PI);
      g.stroke();
    } else if (kind === "smirk") {
      eyes(12, 104);
      g.lineWidth = 10;
      g.beginPath();
      g.moveTo(92, 168);
      g.quadraticCurveTo(150, 186, 176, 150);
      g.stroke();
    } else if (kind === "flat") {
      eyes(14, 106);
      g.lineWidth = 10;
      g.beginPath();
      g.moveTo(94, 170);
      g.lineTo(162, 170);
      g.stroke();
    } else if (kind === "angry") {
      eyes(13, 110);
      g.lineWidth = 10;
      g.beginPath();
      g.moveTo(58, 70);
      g.lineTo(108, 92);
      g.moveTo(198, 70);
      g.lineTo(148, 92);
      g.stroke();
      g.beginPath();
      g.arc(128, 200, 32, 1.2 * Math.PI, 1.8 * Math.PI);
      g.stroke();
    } else if (kind === "laugh") {
      g.lineWidth = 9;
      for (const x of [84, 172]) {
        g.beginPath();
        g.arc(x, 112, 16, Math.PI * 1.1, Math.PI * 1.9);
        g.stroke();
      }
      g.beginPath();
      g.arc(128, 150, 44, 0, Math.PI);
      g.closePath();
      g.fill();
    } else if (kind === "mustache") {
      eyes(14, 100);
      g.fillStyle = "#4a2c1d";
      g.beginPath();
      g.ellipse(102, 156, 30, 13, 0.2, 0, Math.PI * 2);
      g.ellipse(154, 156, 30, 13, -0.2, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = ink;
      g.lineWidth = 9;
      g.beginPath();
      g.arc(128, 168, 30, 0.2 * Math.PI, 0.8 * Math.PI);
      g.stroke();
    } else {
      eyes(16, 104);
      g.lineWidth = 10;
      g.beginPath();
      g.arc(128, 150, 46, 0.15 * Math.PI, 0.85 * Math.PI);
      g.stroke();
    }
  });
  return FACES[kind];
}
function makeBlocky({ skin, torso, legs, hair = null, hat = null }) {
  const P = { root: new THREE.Group() };
  P.legL = new THREE.Group();
  P.legR = new THREE.Group();
  P.legL.position.set(0.155, 0.7, 0);
  P.legR.position.set(-0.155, 0.7, 0);
  for (const L of [P.legL, P.legR]) {
    L.add(at(rbox(0.3, 0.7, 0.32, legs, 0.04), 0, -0.35, 0));
    P.root.add(L);
  }
  P.body = new THREE.Group();
  P.body.position.y = 0.7;
  P.root.add(P.body);
  P.body.add(at(rbox(0.62, 0.7, 0.34, torso, 0.05), 0, 0.35, 0));
  P.armL = new THREE.Group();
  P.armR = new THREE.Group();
  P.armL.position.set(0.47, 0.64, 0);
  P.armR.position.set(-0.47, 0.64, 0);
  P.hands = [];
  for (const A of [P.armL, P.armR]) {
    A.add(at(rbox(0.3, 0.56, 0.32, torso, 0.04), 0, -0.22, 0));
    const hand = rbox(0.3, 0.18, 0.32, skin, 0.05);
    hand.position.set(0, -0.58, 0);
    A.add(hand);
    P.hands.push(hand);
    P.body.add(A);
  }
  P.neck = new THREE.Group();
  P.neck.position.y = 0.7;
  P.body.add(P.neck);
  P.head = new THREE.Group();
  P.head.position.y = 0.25;
  P.neck.add(P.head);
  P.head.add(rbox(0.5, 0.48, 0.48, skin, 0.1));
  P.face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.42),
    new THREE.MeshStandardMaterial({ map: faceTex("smile"), transparent: true, roughness: 0.6 }),
  );
  P.face.position.z = 0.243;
  P.head.add(P.face);
  if (hair) {
    P.head.add(at(rbox(0.54, 0.16, 0.52, hair, 0.05), 0, 0.22, -0.01));
    P.head.add(at(rbox(0.54, 0.34, 0.12, hair, 0.04), 0, 0.08, -0.22));
  }
  if (hat === "cop") {
    P.head.add(at(rbox(0.56, 0.2, 0.54, "#1f2f66", 0.05), 0, 0.3, 0));
    P.head.add(at(rbox(0.56, 0.04, 0.2, "#1d1a26", 0.02), 0, 0.2, 0.3));
    P.head.add(at(rbox(0.1, 0.1, 0.03, "#f7d65a", 0.02), 0, 0.32, 0.28));
  }
  if (hat === "santa") {
    P.santa = new THREE.Group();
    P.santa.add(at(rbox(0.56, 0.12, 0.54, "#ffffff", 0.05), 0, 0.28, 0));
    const cone = mesh(new THREE.ConeGeometry(0.26, 0.45, 4), "#e8432e");
    cone.rotation.set(0.35, Math.PI / 4, 0);
    cone.position.set(0, 0.52, -0.06);
    P.santa.add(cone);
    P.santa.add(at(mesh(new THREE.SphereGeometry(0.07, 12, 8), "#ffffff"), 0, 0.7, -0.18));
    P.head.add(P.santa);
  }
  scene.add(P.root);
  return P;
}
function reset(P) {
  P.root.position.set(0, -60, 0);
  P.root.rotation.set(0, 0, 0);
  for (const k of ["legL", "legR", "armL", "armR", "neck", "head", "body"])
    P[k].rotation.set(0, 0, 0);
  P.body.position.y = 0.7;
  P.face.material.map = faceTex("smile");
  if (P.santa) P.santa.visible = false;
}
function setFace(P, kind) {
  P.face.material.map = faceTex(kind);
}
function walk(P, t, speed = 8) {
  const s = Math.sin(t * speed);
  P.legL.rotation.x = s * 0.6;
  P.legR.rotation.x = -s * 0.6;
  P.armL.rotation.x = -s * 0.5;
  P.armR.rotation.x = s * 0.5;
}
function idle(P, t, off = 0) {
  P.body.position.y = 0.7 + Math.sin((t + off) * 2.2) * 0.008;
  P.neck.rotation.y = Math.sin((t + off) * 0.7) * 0.05;
}
const masonP = makeBlocky({
  skin: "#f2c89c",
  torso: "#f29e38",
  legs: "#2f4f8f",
  hair: "#5b3a29",
  hat: "santa",
});
const copP = makeBlocky({ skin: "#d9a27a", torso: "#2b4c9b", legs: "#1f2f66", hat: "cop" });
const robber = makeBlocky({ skin: "#151319", torso: "#26232e", legs: "#151319" });
const neighbor = makeBlocky({
  skin: "#f2c89c",
  torso: "#26232e",
  legs: "#5a5e6b",
  hair: "#4a2c1d",
});
const V = new THREE.Vector3();
function toHand(obj, P, i, dx = 0, dy = 0, dz = 0) {
  P.hands[i].getWorldPosition(V);
  obj.position.set(V.x + dx, V.y + dy, V.z + dz);
}
function faceTo(x, z, tx, tz) {
  return Math.atan2(tx - x, tz - z);
}

// ------------------------------------------------------------------ shots
const SHOTS = [];
function shot(t0, t1, from, to, e = "inOut", opts = {}) {
  SHOTS.push({ t0, t1, from, to, e, ...opts });
}
function orbit(cx, cy, cz, r, h0, h1, a0, a1, fov) {
  return (u) => {
    const a = lerp(a0, a1, u);
    return [cx + Math.sin(a) * r, lerp(h0, h1, u), cz + Math.cos(a) * r, cx, cy, cz, fov, 0];
  };
}
const d10 = N("d10"),
  d20 = N("d20"),
  night = N("night"),
  morning = N("morning"),
  xmas = N("xmas");
shot(
  0,
  S("L1") + 1.6,
  [9, 13, 22, 1.5, 0.8, 3.5, 46, 0],
  [4.8, 2.0, 8.6, 2.2, 1.1, 4.7, 46, 0],
  "inOut",
);
shot(
  S("L1") + 1.6,
  S("L2"),
  [2.2, 1.0, 4.36, 2.2, 1.6, 5.6, 82, 0],
  [2.2, 1.0, 4.36, 2.2, 1.65, 5.6, 76, 0],
  "out",
);
shot(
  S("L2"),
  S("L3"),
  [-0.7, 1.6, 7.2, 2.3, 1.2, 4.9, 46, 0],
  [-0.4, 1.55, 6.9, 2.3, 1.2, 4.9, 44, 0],
  "lin",
);
shot(
  S("L3"),
  d10,
  [2.15, 1.55, 5.5, 2.2, 1.0, 4.6, 44, 0],
  [2.15, 1.45, 5.35, 2.2, 1.0, 4.6, 40, 0.1],
  "inOut",
);
shot(
  d10,
  S("L5"),
  [2.3, 1.7, 8.0, 2.2, 1.55, 5.4, 44, 0],
  [2.3, 1.65, 7.5, 2.2, 1.55, 5.4, 40, 0],
  "out",
);
shot(
  S("L5"),
  S("L6"),
  [7.5, 0.7, 11.5, 3.2, 0.9, 7.2, 50, 0],
  [7.0, 0.8, 11.0, 3.2, 0.9, 7.2, 48, 0],
  "lin",
);
shot(
  S("L6"),
  S("L6") + 1.8,
  [2.45, 2.5, 10.6, 2.45, 1.3, 6.2, 40, 0],
  [2.45, 2.45, 10.3, 2.45, 1.3, 6.2, 38, 0],
  "out",
);
shot(
  S("L6") + 1.8,
  E("L6") + 0.3,
  [1.1, 1.8, 8.4, 2.9, 1.7, 6.4, 42, 0.03],
  [1.25, 1.78, 8.2, 2.9, 1.7, 6.4, 38, 0.03],
  "lin",
);
shot(
  E("L6") + 0.3,
  d20,
  [5.8, 1.5, 3.6, 3.5, 1.0, 8.0, 52, 0],
  [5.6, 1.45, 3.8, 3.5, 1.0, 8.0, 50, 0],
  "lin",
);
shot(d20, night, null, null, "inOut", { fn: orbit(2.2, 0.9, 4.6, 3.4, 1.4, 3.0, 0.6, -0.5, 46) });
shot(
  night,
  S("L9") + 2.4,
  [1.6, 1.5, 4.3, 1.4, 1.55, 1.2, 46, 0],
  [1.6, 1.52, 4.0, 1.4, 1.55, 1.2, 44, 0],
  "lin",
);
shot(
  S("L9") + 2.4,
  S("L10"),
  [1.4, 1.7, 3.1, 1.4, 1.6, 0.9, 42, 0],
  [1.4, 1.68, 2.8, 1.4, 1.6, 0.9, 38, 0],
  "lin",
);
shot(
  S("L10"),
  S("L10") + 2.4,
  [1.5, 1.2, 9.3, 4.6, 1.1, 6.0, 50, 0],
  [1.6, 1.2, 9.1, 4.6, 1.1, 6.0, 48, 0],
  "lin",
);
shot(
  S("L10") + 2.4,
  S("L11"),
  [3.5, 1.6, 4.1, 2.2, 1.35, 5.35, 52, 0],
  [3.45, 1.58, 4.2, 2.2, 1.35, 5.35, 48, 0],
  "out",
);
shot(
  S("L11"),
  S("L11") + 1.5,
  [1.45, 1.6, 1.0, 2.25, 1.45, 5.3, 34, 0],
  [1.45, 1.6, 1.0, 2.25, 1.55, 5.3, 24, 0],
  "in",
);
shot(
  S("L11") + 1.5,
  morning,
  [1.4, 1.7, 3.1, 1.4, 1.5, 0.9, 42, 0],
  [1.4, 1.68, 2.9, 1.4, 1.4, 0.9, 40, 0],
  "out",
  { shake: [S("L11") + 1.6, 0.4] },
);
shot(
  morning,
  S("L12") + 1.8,
  [2.2, 1.0, 4.36, 2.2, 1.6, 5.6, 82, 0],
  [2.2, 1.0, 4.36, 2.2, 1.65, 5.6, 76, 0],
  "out",
);
shot(
  S("L12") + 1.8,
  N("knock"),
  [2.62, 1.47, 4.12, 2.62, 1.44, 4.75, 52, 0],
  [2.62, 1.46, 4.2, 2.62, 1.44, 4.75, 46, 0],
  "lin",
);
shot(
  N("knock"),
  S("L14") + 1.9,
  [-0.1, 2.1, -1.7, -1.1, 1.4, 2.6, 50, 0],
  [-0.15, 2.05, -1.45, -1.1, 1.4, 2.6, 48, 0],
  "lin",
);
shot(
  S("L14") + 1.9,
  N("reveal"),
  [-1.0, 1.7, 0.6, -1.0, 1.65, 2.5, 46, 0],
  [-1.0, 1.7, 0.85, -1.0, 1.65, 2.5, 40, 0],
  "lin",
);
shot(
  N("reveal"),
  S("L16") + 2.6,
  [14.6, 1.8, 9.4, 10.2, 1.0, 3.4, 46, 0],
  [14.2, 1.75, 9.0, 10.2, 1.0, 3.4, 44, 0],
  "lin",
);
shot(
  S("L16") + 2.6,
  xmas,
  [ISL.x + 4.5, 3.0, ISL.z + 6.5, ISL.x, 0.9, ISL.z, 46, 0],
  [ISL.x + 2.4, 1.5, ISL.z + 3.8, ISL.x + 0.5, 1.0, ISL.z, 44, 0],
  "inOut",
);
shot(
  xmas,
  E("L17") + 0.8,
  [2.3, 1.65, 8.0, 2.2, 1.5, 5.3, 44, 0],
  [2.3, 1.62, 7.5, 2.2, 1.5, 5.3, 40, 0],
  "out",
);
shot(
  E("L17") + 0.8,
  T.total + 0.1,
  [2.3, 1.62, 7.5, 2.2, 1.5, 5.3, 40, 0],
  [6.0, 11, 18, 2.0, 0.6, 3.0, 46, 0],
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
  let jx = Math.sin(t * 1.7) * 0.01 + Math.sin(t * 3.1) * 0.005;
  let jy = Math.cos(t * 1.3) * 0.008;
  if (sh.shake) {
    const k = seg(t, sh.shake[0], sh.shake[0] + sh.shake[1]);
    if (k > 0 && k < 1) {
      jx += Math.sin(t * 90) * (1 - k) * 0.05;
      jy += Math.cos(t * 77) * (1 - k) * 0.05;
    }
  }
  camera.position.set(v[0] + jx, v[1] + jy, v[2]);
  camera.fov = v[6];
  camera.updateProjectionMatrix();
  camera.lookAt(v[3] + jx * 0.5, v[4] + jy * 0.5, v[5]);
  camera.rotateZ(v[7] || 0);
  // keep the shadow map around what the camera is looking at
  sun.target.position.set(v[3], 0, v[5]);
  sun.position.set(v[3] + 8, 16, v[5] + 10);
}

// ------------------------------------------------------------------ direction
function setLook(kind) {
  const day = kind === "day" || kind === "island";
  scene.background = new THREE.Color(
    kind === "night" ? "#0d1433" : kind === "xmas" ? "#b9c9de" : "#8fd0ff",
  );
  scene.fog =
    kind === "night" ? new THREE.Fog("#0d1433", 18, 60) : new THREE.Fog(scene.background, 40, 120);
  hemi.intensity = kind === "night" ? 0.35 : kind === "xmas" ? 0.9 : 1.0;
  hemi.color.set(kind === "night" ? "#5a6ac8" : "#d6ecff");
  hemi.groundColor.set(kind === "night" ? "#101530" : "#6f8a5a");
  sun.intensity = kind === "night" ? 0.35 : kind === "xmas" ? 1.4 : 2.6;
  sun.color.set(kind === "night" ? "#7f95ff" : "#fff3dc");
  streetLight.intensity = kind === "night" ? 6 : 0;
  bulb.material.color.set(kind === "night" ? "#fff3c4" : "#f4f1ea");
  roomLight.intensity = kind === "night" ? 1.5 : 0;
  windowGlow.visible = kind === "night";
  snowCover.visible = kind === "xmas";
  snow.visible = kind === "xmas";
  return day;
}
function money(t) {
  // dollars in the mailbox, doubling once per day
  if (t < S("L2")) return 1;
  if (t < S("L3")) return t < S("L2") + 1.3 ? 2 : t < S("L2") + 2.1 ? 4 : 8;
  if (t < d10) return Math.pow(2, 3 + Math.min(5, Math.floor(seg(t, S("L3"), E("L3")) * 6)));
  if (t < d20) return 512;
  return 524288;
}

function renderAt(t) {
  for (const P of [masonP, copP, robber, neighbor]) reset(P);
  let look = "day";
  if (t >= night && t < morning) look = "night";
  if (t >= S("L16") + 2.6 && t < xmas) look = "island";
  if (t >= xmas) look = "xmas";
  setLook(look);
  mbDoor.rotation.x = 0;
  flag.rotation.z = 0;
  pile.visible = false;
  spill.visible = false;
  bags.visible = false;
  carryBag.visible = false;
  handBills.visible = false;
  oneBill.visible = false;
  note.visible = false;
  postcard.visible = false;
  cocktail.visible = false;
  car.position.set(-60, 0, 8);
  sirenR.visible = sirenB.visible = true;
  copLightR.intensity = copLightB.intensity = 0;
  mason.door.rotation.y = 0;
  curtainL.position.set(0.85, 1.6, 1.35);
  curtainR.position.set(1.95, 1.6, 1.35);
  mower.position.set(10.6, 0, 3.0);
  mower.rotation.y = 0;
  const holds = [];

  // the pile in the mailbox follows the money
  const m = money(t);
  const frac = clamp01(Math.log2(Math.max(1, m)) / 19);
  pileBills.forEach(
    (b, i) => (b.visible = i < Math.max(1, Math.round(frac * pileBills.length)) && t < night),
  );

  if (t < S("L5")) {
    // ---------------- days 1-10 at the mailbox
    pile.visible = true;
    mbDoor.rotation.x = 1.4;
    flag.rotation.z = -1.2;
    const walkK = seg(t, 0.2, S("L1") + 1.2);
    if (t < S("L1") + 1.2) {
      masonP.root.position.set(
        lerp(-1.0, 2.2, ease.inOut(walkK)),
        0,
        lerp(2.0, 5.3, ease.inOut(walkK)),
      );
      masonP.root.rotation.y = faceTo(-1.0, 2.0, 2.2, 5.3);
      walk(masonP, t);
      mbDoor.rotation.x = 0;
    } else {
      masonP.root.position.set(2.2, 0, 5.3);
      masonP.root.rotation.y = Math.PI;
      idle(masonP, t);
      setFace(masonP, "shock");
      masonP.armR.rotation.x = -1.4;
      oneBill.visible = t < S("L2");
      holds.push([oneBill, masonP, 1, 0, 0.05, -0.15]);
    }
    if (t >= S("L2") && t < d10) {
      // time-lapse: Mason pops back every morning
      masonP.root.position.set(2.75, 0, 5.2);
      masonP.root.rotation.y = faceTo(2.75, 5.2, 2.2, 4.7);
      const phase = ((t - S("L2")) * 1.6) % 1;
      masonP.root.position.y = phase < 0.12 ? -60 : 0;
      setFace(masonP, t < S("L3") ? "smile" : "shock");
      masonP.armR.rotation.x = -1.4;
      handBills.visible = true;
      holds.push([handBills, masonP, 1, 0, 0.05, -0.15]);
      const k = Math.sin((t - S("L2")) * 10);
      hemi.intensity = 0.8 + 0.25 * k;
      sun.intensity = 2.2 + 0.6 * k;
    }
    if (t >= d10) {
      masonP.root.rotation.y = 0;
      setFace(masonP, "shock");
      masonP.armL.rotation.set(-2.0, 0, 0);
      masonP.armR.rotation.set(-2.0, 0, 0);
      handBills.visible = true;
      handBills.scale.setScalar(1.6);
      holds.push([handBills, masonP, 1, 0.15, 0.12, 0.05]);
    } else handBills.scale.setScalar(1);
  } else if (t < d20) {
    // ---------------- the police come, look, laugh
    pile.visible = true;
    const arrive = ease.out(seg(t, S("L5") - 0.2, S("L5") + 1.2));
    const leave = ease.in(seg(t, E("L7") - 0.6, d20));
    car.position.set(lerp(20, 3.4, arrive) - leave * 30, 0, 8.0);
    copLightR.position.set(car.position.x - 0.3, 1.6, 8);
    copLightB.position.set(car.position.x, 1.6, 8);
    const blinkOn = Math.sin(t * 16) > 0;
    sirenR.visible = blinkOn;
    sirenB.visible = !blinkOn;
    copLightR.intensity = blinkOn ? 3 : 0;
    copLightB.intensity = blinkOn ? 0 : 3;
    masonP.root.position.set(2.0, 0, 6.0);
    masonP.root.rotation.y = t < S("L6") ? faceTo(2.0, 6.0, 3.4, 8.0) : faceTo(2.0, 6.0, 2.9, 6.4);
    idle(masonP, t);
    masonP.armR.rotation.x = -1.3;
    handBills.visible = true;
    handBills.scale.setScalar(1.3);
    holds.push([handBills, masonP, 1, 0, 0.08, 0]);
    setFace(masonP, t < S("L6") ? "worried" : "flat");
    if (t >= S("L5") + 0.8 && t < S("L6")) masonP.armL.rotation.z = -2.5 + Math.sin(t * 12) * 0.3;
    if (t >= S("L6")) {
      copP.root.position.set(2.9, 0, 6.4);
      copP.root.rotation.y = faceTo(2.9, 6.4, 2.0, 6.0);
      idle(copP, t, 1);
      setFace(copP, "flat");
      copP.neck.rotation.x = t < S("L6") + 1.8 ? 0.45 : 0;
      if (t > S("L6") + 1.8) setFace(copP, "smirk");
    }
    if (t >= E("L6") + 0.3) {
      const k = seg(t, E("L6") + 0.3, E("L7") - 0.4);
      copP.root.position.set(lerp(2.9, 3.6, k), 0, lerp(6.4, 7.6, k));
      copP.root.rotation.y = faceTo(2.9, 6.4, 3.6, 7.6);
      walk(copP, t);
      setFace(copP, "laugh");
      copP.neck.rotation.x = -0.3 + Math.sin(t * 20) * 0.08;
      copP.body.rotation.z = Math.sin(t * 11) * 0.06;
      if (k >= 1) copP.root.position.y = -60;
    }
  } else if (t < night) {
    // ---------------- day 20: the mailbox can't close
    pile.visible = true;
    spill.visible = true;
    bags.visible = true;
    mbDoor.rotation.x = 0.7;
    flag.rotation.z = -1.2;
    masonP.root.position.set(1.1, 0, 5.4);
    masonP.root.rotation.y = faceTo(1.1, 5.4, 2.2, 4.6);
    idle(masonP, t);
    setFace(masonP, "shock");
    masonP.armL.rotation.set(-2.9, 0, 0.3);
    masonP.armR.rotation.set(-2.9, 0, -0.3);
  } else if (t < morning) {
    // ---------------- 3 a.m.
    spill.visible = true;
    bags.visible = true;
    mbDoor.rotation.x = 0.7;
    masonP.root.position.set(1.4, 0, 0.85);
    masonP.root.rotation.y = 0;
    idle(masonP, t);
    setFace(masonP, "worried");
    masonP.armL.rotation.x = -1.6;
    masonP.armR.rotation.x = -1.6;
    curtainL.position.x = 0.95;
    curtainR.position.x = 1.85;
    const k = seg(t, S("L10") - 0.2, S("L10") + 2.6);
    robber.root.position.set(lerp(6.5, 2.2, ease.inOut(k)), 0, lerp(5.9, 5.35, ease.inOut(k)));
    robber.root.rotation.y = k < 1 ? faceTo(6.5, 5.9, 2.2, 5.35) : Math.PI;
    if (k > 0 && k < 1) walk(robber, t, 9);
    setFace(robber, "mask");
    robber.armR.rotation.x = -0.4;
    carryBag.visible = t < S("L10") + 3.0;
    holds.push([carryBag, robber, 1, 0, -0.3, 0]);
    if (t > S("L10") + 2.6) {
      robber.armR.rotation.x = -1.5;
      robber.armL.rotation.x = -1.5;
      holds.pop();
      holds.push([carryBag, robber, 1, 0.15, -0.1, 0]);
    }
    if (t > S("L11")) {
      robber.root.rotation.y = lerp(
        Math.PI,
        faceTo(2.2, 5.35, 1.4, 1.5),
        ease.out(seg(t, S("L11"), S("L11") + 0.4)),
      );
      robber.neck.rotation.x = -0.2;
      robber.armL.rotation.set(0, 0, 2.6 + Math.sin(t * 12) * 0.3);
      robber.armR.rotation.x = 0;
      if (t > S("L11") + 1.5) {
        setFace(masonP, "shock");
        masonP.root.position.y = -0.6 * ease.out(seg(t, S("L11") + 1.6, S("L11") + 1.9));
        curtainL.position.x = 1.15;
        curtainR.position.x = 1.65;
      }
    }
  } else if (t < N("knock")) {
    // ---------------- the next morning: only a note
    mbDoor.rotation.x = 1.4;
    flag.rotation.z = 0;
    masonP.root.position.set(2.2, 0, 5.3);
    masonP.root.rotation.y = Math.PI;
    idle(masonP, t);
    setFace(masonP, "worried");
    masonP.armR.rotation.x = -1.35;
    masonP.armL.rotation.x = -1.35;
    note.visible = true;
    note.position.set(2.62, 1.44, 4.78);
    note.rotation.set(0.15, Math.PI, 0);
  } else if (t < N("reveal")) {
    // ---------------- the police knock
    car.position.set(-1.0, 0, 8.0);
    const blinkOn = Math.sin(t * 16) > 0;
    sirenR.visible = blinkOn;
    sirenB.visible = !blinkOn;
    copLightR.position.set(-1.3, 1.6, 8);
    copLightB.position.set(-1.0, 1.6, 8);
    copLightR.intensity = blinkOn ? 4 : 0;
    copLightB.intensity = blinkOn ? 0 : 4;
    mason.door.rotation.y = -1.4 * ease.out(seg(t, S("L14") + 0.6, S("L14") + 1.2));
    masonP.root.position.set(-1.0, 0, 0.3);
    masonP.root.rotation.y = 0;
    setFace(masonP, t > S("L14") + 1.2 ? "shock" : "worried");
    copP.root.position.set(-1.0, 0, 2.5);
    copP.root.rotation.y = Math.PI;
    idle(copP, t);
    setFace(copP, "angry");
    if (t < S("L14") + 0.6) copP.armR.rotation.x = -1.6 - Math.max(0, Math.sin(t * 18)) * 0.3;
  } else if (t < S("L16") + 2.6) {
    // ---------------- the neighbour with the borrowed lawnmower
    neighbor.root.position.set(10.6, 0, 3.75);
    neighbor.root.rotation.y = Math.PI;
    setFace(neighbor, "mustache");
    neighbor.armL.rotation.x = -1.0;
    neighbor.armR.rotation.x = -1.0;
    const k = seg(t, N("reveal"), S("L16") + 2.6);
    neighbor.root.position.x = lerp(11.4, 9.8, k);
    mower.position.set(neighbor.root.position.x, 0, 3.0);
    walk(neighbor, t, 6);
    if (t > S("L16") + 1.4) {
      neighbor.root.rotation.y = 0.3;
      neighbor.armL.rotation.set(0, 0, 2.6 + Math.sin(t * 10) * 0.3);
    }
  } else if (t < xmas) {
    // ---------------- he lives on an island now
    neighbor.root.position.set(ISL.x + 0.6, 0.62, ISL.z - 0.2);
    neighbor.root.rotation.set(-0.5, 0, 0);
    neighbor.legL.rotation.x = -1.1;
    neighbor.legR.rotation.x = -1.1;
    setFace(neighbor, "cool");
    neighbor.armR.rotation.x = -1.3;
    neighbor.armL.rotation.set(0, 0, 2.5 + Math.sin(t * 8) * 0.3);
    cocktail.visible = true;
    holds.push([cocktail, neighbor, 1, 0, 0.08, 0]);
  } else {
    // ---------------- every Christmas: one dollar
    pile.visible = false;
    mbDoor.rotation.x = 1.4;
    masonP.root.position.set(2.2, 0, 5.3);
    masonP.root.rotation.y = 0;
    masonP.santa.visible = true;
    idle(masonP, t);
    setFace(masonP, "flat");
    masonP.armR.rotation.x = -1.5;
    masonP.armL.rotation.x = -1.5;
    oneBill.visible = true;
    postcard.visible = true;
    holds.push([oneBill, masonP, 0, 0, 0.12, 0.12]);
    holds.push([postcard, masonP, 1, 0, 0.18, 0.12]);
    postcard.rotation.set(-0.3, 0, 0.1);
    const pos = snowGeo.attributes.position.array;
    snowSeed.forEach(([x, y, z, sp], i) => {
      pos[i * 3] = x + Math.sin(t * 0.8 + i) * 0.2;
      pos[i * 3 + 1] = 9 - ((9 - y + t * sp) % 9);
      pos[i * 3 + 2] = z;
    });
    snowGeo.attributes.position.needsUpdate = true;
  }

  if (holds.length) {
    scene.updateMatrixWorld(true);
    for (const [obj, P, i, dx, dy, dz] of holds) toHand(obj, P, i, dx, dy, dz);
  }
  cameraAt(t);
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
