// 3D world for "POV: when you prank your teacher" (waswenn.exe1) - blocky plastic look, no narration.
// Everything on screen is a pure function of the seek time t (renderAt).
import * as THREE from "./three.module.min.js";
import { RoundedBoxGeometry } from "./RoundedBoxGeometry.js";

const T = window.HF_TIMING;

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
const V = new THREE.Vector3();
function toHand(obj, P, i, dx = 0, dy = 0, dz = 0) {
  P.hands[i].getWorldPosition(V);
  obj.position.set(V.x + dx, V.y + dy, V.z + dz);
}

// ------------------------------------------------------------------ shots
const SHOTS = [];
function shot(t0, t1, from, to, e = "inOut", opts = {}) {
  SHOTS.push({ t0, t1, from, to, e, ...opts });
}
// ------------------------------------------------------------------ beats (seconds, from build.py)
const B = T.marks;

// ------------------------------------------------------------------ emoji faces for the animal avatars
const EMO = {};
function emoji(kind, glasses = false) {
  const key = kind + (glasses ? "-g" : "");
  if (EMO[key]) return EMO[key];
  EMO[key] = canvasTex(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    const ink = "#1d1a26";
    const eye = (x, y, r, pupil = true, lid = 0) => {
      g.fillStyle = "#ffffff";
      g.strokeStyle = ink;
      g.lineWidth = 6;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      if (pupil) {
        g.fillStyle = ink;
        g.beginPath();
        g.arc(x + 3, y + 4, r * 0.42, 0, Math.PI * 2);
        g.fill();
      }
      if (lid > 0) {
        g.fillStyle = "rgba(0,0,0,0)";
        g.strokeStyle = ink;
        g.lineWidth = 9;
        g.beginPath();
        g.moveTo(x - r - 2, y - r + lid * 2 * r);
        g.lineTo(x + r + 2, y - r + lid * 2 * r);
        g.stroke();
      }
    };
    g.lineCap = "round";
    g.strokeStyle = ink;
    if (kind === "laugh") {
      g.lineWidth = 10;
      for (const x of [86, 170]) {
        g.beginPath();
        g.arc(x, 110, 22, Math.PI * 1.1, Math.PI * 1.9);
        g.stroke();
      }
      g.fillStyle = "#5a1f2b";
      g.beginPath();
      g.arc(128, 160, 52, 0, Math.PI);
      g.closePath();
      g.fill();
      g.fillStyle = "#f07c8f";
      g.beginPath();
      g.ellipse(128, 196, 26, 12, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#7cc8f0";
      g.beginPath();
      g.ellipse(52, 136, 9, 16, 0, 0, Math.PI * 2);
      g.ellipse(204, 136, 9, 16, 0, 0, Math.PI * 2);
      g.fill();
    } else if (kind === "rage") {
      eye(86, 112, 24);
      eye(170, 112, 24);
      g.lineWidth = 12;
      g.beginPath();
      g.moveTo(52, 68);
      g.lineTo(112, 92);
      g.moveTo(204, 68);
      g.lineTo(144, 92);
      g.stroke();
      g.fillStyle = "#5a1f2b";
      g.beginPath();
      g.ellipse(128, 192, 46, 26, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#ffffff";
      g.fillRect(92, 172, 72, 12);
    } else if (kind === "sneaky" || kind === "smirk") {
      eye(86, 110, 22, true, 0.45);
      eye(170, 110, 22, true, 0.45);
      g.lineWidth = 11;
      g.beginPath();
      g.moveTo(84, 176);
      g.quadraticCurveTo(150, 200, 184, 156);
      g.stroke();
      if (kind === "smirk") {
        g.lineWidth = 9;
        g.beginPath();
        g.moveTo(60, 74);
        g.lineTo(108, 82);
        g.moveTo(148, 70);
        g.lineTo(196, 62);
        g.stroke();
      }
    } else if (kind === "shock") {
      eye(84, 106, 30);
      eye(172, 106, 30);
      g.fillStyle = "#5a1f2b";
      g.beginPath();
      g.ellipse(128, 190, 26, 34, 0, 0, Math.PI * 2);
      g.fill();
    } else if (kind === "stern") {
      eye(86, 114, 18);
      eye(170, 114, 18);
      g.lineWidth = 12;
      g.beginPath();
      g.moveTo(58, 80);
      g.lineTo(110, 88);
      g.moveTo(198, 80);
      g.lineTo(146, 88);
      g.moveTo(98, 182);
      g.lineTo(158, 182);
      g.stroke();
    } else if (kind === "facepalm") {
      g.lineWidth = 10;
      for (const x of [86, 170]) {
        g.beginPath();
        g.moveTo(x - 20, 112);
        g.lineTo(x + 20, 112);
        g.stroke();
      }
      g.beginPath();
      g.arc(128, 200, 30, 1.15 * Math.PI, 1.85 * Math.PI);
      g.stroke();
    } else {
      eye(86, 108, 22);
      eye(170, 108, 22);
      g.lineWidth = 10;
      g.beginPath();
      g.arc(128, 150, 40, 0.15 * Math.PI, 0.85 * Math.PI);
      g.stroke();
    }
    if (glasses) {
      g.strokeStyle = ink;
      g.lineWidth = 8;
      for (const x of [86, 170]) {
        g.beginPath();
        g.arc(x, 112, 36, 0, Math.PI * 2);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(122, 108);
      g.lineTo(134, 108);
      g.stroke();
    }
  });
  return EMO[key];
}

// ------------------------------------------------------------------ animal avatars
function ears(P, kind, color) {
  if (kind === "cat")
    for (const s of [-1, 1]) {
      const e = mesh(new THREE.ConeGeometry(0.11, 0.22, 4), color);
      e.position.set(s * 0.17, 0.3, 0);
      e.rotation.set(0, Math.PI / 4, -s * 0.25);
      P.head.add(e);
    }
  if (kind === "bear")
    for (const s of [-1, 1])
      P.head.add(at(mesh(new THREE.SphereGeometry(0.1, 16, 12), color), s * 0.2, 0.26, 0));
  if (kind === "bunny")
    for (const s of [-1, 1]) P.head.add(at(rbox(0.1, 0.42, 0.08, color, 0.04), s * 0.11, 0.42, 0));
  if (kind === "dog")
    for (const s of [-1, 1]) {
      const e = rbox(0.1, 0.3, 0.12, color, 0.04);
      e.position.set(s * 0.29, 0.02, 0);
      e.rotation.z = s * 0.2;
      P.head.add(e);
    }
}
function slimeCoat(P) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: "#7be04a",
    roughness: 0.25,
    emissive: "#1f5a10",
    emissiveIntensity: 0.4,
  });
  const top = mesh(new RoundedBoxGeometry(0.56, 0.2, 0.54, 3, 0.09), mat);
  top.position.y = 0.2;
  g.add(top);
  [-0.25, -0.2, 0.2, 0.25].forEach((x, i) => {
    const d = mesh(new THREE.CapsuleGeometry(0.03, 0.08 + (i % 2) * 0.08, 4, 8), mat);
    d.position.set(x, 0.06 - (i % 2) * 0.05, 0.26);
    g.add(d);
  });
  P.head.add(g);
  const sh = mesh(new RoundedBoxGeometry(0.66, 0.12, 0.38, 3, 0.05), mat);
  sh.position.y = 0.68;
  P.body.add(sh);
  P.slime = [g, sh];
  return P;
}
function animal({ kind, fur, torso, legs, glasses = false }) {
  const P = makeBlocky({ skin: fur, torso, legs });
  ears(P, kind, fur);
  P.glasses = glasses;
  slimeCoat(P);
  return P;
}
const cat = animal({ kind: "cat", fur: "#9aa0aa", torso: "#e8432e", legs: "#2b2f3a" });
const bear = animal({
  kind: "bear",
  fur: "#f2c230",
  torso: "#26232e",
  legs: "#26232e",
  glasses: true,
});
bear.body.add(at(box(0.2, 0.5, 0.02, "#ffffff"), 0, 0.42, 0.175));
bear.body.add(at(box(0.06, 0.3, 0.02, "#e8432e"), 0, 0.4, 0.19));
const principal = makeBlocky({
  skin: "#f2c89c",
  torso: "#26232e",
  legs: "#26232e",
  hair: "#8a8f9c",
});
const badgeTex = canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = "#2b4c9b";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#ffffff";
  g.font = "bold 40px sans-serif";
  g.textAlign = "center";
  g.fillText("PRINCIPAL", w / 2, 46);
});
const badge = new THREE.Mesh(
  new THREE.PlaneGeometry(0.4, 0.1),
  new THREE.MeshStandardMaterial({ map: badgeTex }),
);
badge.position.set(0, 0.5, 0.175);
principal.body.add(badge);
const cop = makeBlocky({ skin: "#d9a27a", torso: "#2b4c9b", legs: "#1f2f66", hat: "cop" });
const judge = makeBlocky({ skin: "#e0b48c", torso: "#151319", legs: "#151319" });
for (let i = 0; i < 10; i++) {
  const a = (i / 10) * Math.PI * 2;
  judge.head.add(
    at(
      mesh(new THREE.SphereGeometry(0.1, 12, 10), "#f4f1ea"),
      Math.cos(a) * 0.27,
      0.12 - (i % 2) * 0.12,
      Math.sin(a) * 0.2 - 0.06,
    ),
  );
}
judge.head.add(at(rbox(0.56, 0.14, 0.5, "#f4f1ea", 0.06), 0, 0.26, -0.02));
slimeCoat(judge);
const kids = [
  animal({ kind: "bunny", fur: "#f6a9c6", torso: "#9b6ade", legs: "#3d7be0" }),
  animal({ kind: "dog", fur: "#b07a4f", torso: "#22a58b", legs: "#2b2f3a" }),
  animal({ kind: "cat", fur: "#f29e38", torso: "#3d7be0", legs: "#2b2f3a" }),
  animal({ kind: "bear", fur: "#8a5a33", torso: "#f7d65a", legs: "#2b2f3a" }),
];
function setEmo(P, kind) {
  P.face.material.map = emoji(kind, P.glasses);
}

// ------------------------------------------------------------------ classroom (around the origin)
const room = new THREE.Group();
scene.add(room);
room.add(at(box(9, 0.1, 9, "#efe6da"), 0, -0.05, 0));
const wallMat = plastic("#c9a7e8");
room.add(at(mesh(new THREE.BoxGeometry(9, 3.4, 0.2), wallMat), 0, 1.7, -4.5));
room.add(at(mesh(new THREE.BoxGeometry(0.2, 3.4, 9), wallMat), -4.5, 1.7, 0));
// right wall with a door gap at z -1.5..-0.5
room.add(at(mesh(new THREE.BoxGeometry(0.2, 3.4, 3.0), wallMat), 4.5, 1.7, -3.0));
room.add(at(mesh(new THREE.BoxGeometry(0.2, 3.4, 4.5), wallMat), 4.5, 1.7, 1.75));
room.add(at(mesh(new THREE.BoxGeometry(0.2, 1.1, 1.0), wallMat), 4.5, 2.85, -1.0));
for (const [y, z, h, d] of [
  [1.15, -1.52, 2.3, 0.08],
  [1.15, -0.48, 2.3, 0.08],
  [2.3, -1.0, 0.1, 1.12],
])
  room.add(at(rbox(0.3, h, d, "#e07a2e", 0.02), 4.45, y, z));
const board = rbox(4.2, 1.6, 0.08, "#2f7a3a", 0.03);
board.position.set(0, 1.75, -4.38);
room.add(board);
room.add(at(rbox(4.4, 0.12, 0.14, "#8a5a33", 0.03), 0, 0.92, -4.34));
const smileyTex = canvasTex(256, 256, (g) => {
  g.fillStyle = "#f7d65a";
  g.beginPath();
  g.arc(128, 128, 110, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#1d1a26";
  g.beginPath();
  g.arc(92, 104, 14, 0, Math.PI * 2);
  g.arc(164, 104, 14, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#1d1a26";
  g.lineWidth = 12;
  g.beginPath();
  g.arc(128, 136, 56, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
});
const smiley = new THREE.Mesh(
  new THREE.CircleGeometry(0.28, 32),
  new THREE.MeshBasicMaterial({ map: smileyTex, transparent: true }),
);
smiley.position.set(-1.6, 1.6, -4.33);
room.add(smiley);
room.add(at(rbox(1.6, 0.8, 0.8, "#8a5a33", 0.04), 0, 0.4, -3.2));
for (let r = 0; r < 2; r++)
  for (let c = 0; c < 3; c++) {
    const x = -2.4 + c * 2.0;
    const z = 0.2 + r * 1.8;
    room.add(at(rbox(1.0, 0.06, 0.6, "#f7d65a", 0.02), x, 0.72, z));
    for (const [dx, dz] of [
      [-0.42, -0.24],
      [0.42, -0.24],
      [-0.42, 0.24],
      [0.42, 0.24],
    ])
      room.add(at(box(0.05, 0.7, 0.05, "#5a5e6b"), x + dx, 0.35, z + dz));
    room.add(at(rbox(0.5, 0.06, 0.45, "#e8432e", 0.02), x, 0.45, z + 0.62));
  }
for (const x of [-2.2, 0, 2.2]) room.add(at(rbox(1.2, 0.06, 0.3, "#ffffff", 0.02), x, 3.35, -1));
// prank props
const chair = rbox(0.5, 0.06, 0.45, "#e8432e", 0.02);
chair.position.set(3.7, 0.45, -1.9);
room.add(chair);
for (const [dx, dz] of [
  [-0.2, -0.18],
  [0.2, -0.18],
  [-0.2, 0.18],
  [0.2, 0.18],
])
  room.add(at(box(0.05, 0.45, 0.05, "#5a5e6b"), 3.7 + dx, 0.22, -1.9 + dz));
function bucket() {
  const g = new THREE.Group();
  g.add(at(cyl(0.2, 0.15, 0.32, "#8a8f9c"), 0, 0.16, 0));
  g.add(at(cyl(0.17, 0.17, 0.02, "#7be04a"), 0, 0.31, 0));
  const h = mesh(new THREE.TorusGeometry(0.18, 0.012, 6, 20, Math.PI), "#5a5e6b");
  h.position.y = 0.32;
  g.add(h);
  return g;
}
const bucket1 = bucket();
scene.add(bucket1);
const slimeMat = new THREE.MeshStandardMaterial({
  color: "#7be04a",
  roughness: 0.2,
  emissive: "#1f5a10",
  emissiveIntensity: 0.5,
});
function slimeFall() {
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const b = mesh(new THREE.SphereGeometry(0.1 + (i % 3) * 0.04, 14, 10), slimeMat);
    b.userData.o = [(rnd() - 0.5) * 0.3, rnd() * 0.6, (rnd() - 0.5) * 0.3];
    g.add(b);
  }
  g.add(at(mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.03, 24), slimeMat), 0, -10, 0));
  scene.add(g);
  return g;
}
const fall1 = slimeFall();
const fall2 = slimeFall();
function pour(g, t, t0, x, yTop, yHit, z) {
  const k = (t - t0) / 0.45;
  g.visible = k >= 0;
  if (!g.visible) return;
  g.position.set(x, 0, z);
  g.children.forEach((b, i) => {
    if (i === g.children.length - 1) {
      b.position.y = k > 1 ? 0.02 : -10;
      b.scale.setScalar(0.4 + 0.6 * clamp01((k - 1) * 2));
      return;
    }
    const [ox, oy, oz] = b.userData.o;
    const y = lerp(yTop + oy * 0.3, yHit - oy * 0.5, clamp01(k * k));
    b.position.set(ox, k > 1.3 ? -10 : y, oz);
  });
}
const steam = [];
for (let i = 0; i < 6; i++) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 8),
    new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.8 }),
  );
  m.userData.o = [i % 2 ? 1 : -1, rnd()];
  scene.add(m);
  steam.push(m);
}
const phone = rbox(0.12, 0.22, 0.03, "#1d1a26", 0.02);
scene.add(phone);
const cuffs = new THREE.Group();
for (const s of [-1, 1]) {
  const r = mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 20), "#c9ccd6");
  r.position.x = s * 0.1;
  cuffs.add(r);
}
scene.add(cuffs);

// ------------------------------------------------------------------ courtroom (x 40)
const CX = 40;
const court = new THREE.Group();
scene.add(court);
court.add(at(box(10, 0.1, 10, "#c9945c"), CX, -0.05, 0));
const cwall = plastic("#e8d8b8");
court.add(at(mesh(new THREE.BoxGeometry(10, 4, 0.2), cwall), CX, 2, -4.8));
court.add(at(mesh(new THREE.BoxGeometry(0.2, 4, 10), cwall), CX - 5, 2, 0));
court.add(at(mesh(new THREE.BoxGeometry(0.2, 4, 10), cwall), CX + 5, 2, 0));
court.add(at(rbox(3.2, 1.3, 1.0, "#8a5a33", 0.05), CX, 0.65, -3.2));
court.add(at(rbox(3.4, 0.1, 1.2, "#6b4226", 0.03), CX, 1.32, -3.2));
court.add(at(rbox(1.4, 0.5, 0.06, "#f7d65a", 0.03), CX, 3.2, -4.68));
const sealTex = canvasTex(256, 256, (g) => {
  g.fillStyle = "#f7d65a";
  g.beginPath();
  g.arc(128, 128, 120, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#8a5a33";
  g.lineWidth = 12;
  g.beginPath();
  g.arc(128, 128, 96, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#8a5a33";
  g.fillRect(118, 60, 20, 130);
  g.fillRect(70, 80, 116, 14);
});
const seal = new THREE.Mesh(
  new THREE.CircleGeometry(0.5, 32),
  new THREE.MeshStandardMaterial({ map: sealTex }),
);
seal.position.set(CX, 2.7, -4.68);
court.add(seal);
// dock (a little wooden cage)
const dock = new THREE.Group();
dock.add(at(cyl(0.65, 0.65, 0.1, "#8a5a33", 24), 0, 0.05, 0));
dock.add(at(mesh(new THREE.TorusGeometry(0.65, 0.05, 8, 32), "#8a5a33"), 0, 1.0, 0));
dock.children[1].rotation.x = Math.PI / 2;
for (let i = 0; i < 14; i++) {
  const a = (i / 14) * Math.PI * 2;
  dock.add(at(cyl(0.03, 0.03, 1.0, "#a8744a"), Math.cos(a) * 0.65, 0.5, Math.sin(a) * 0.65));
}
dock.position.set(CX - 2.2, 0, -0.6);
court.add(dock);
for (const z of [1.8, 3.0]) court.add(at(rbox(4.4, 0.45, 0.5, "#8a5a33", 0.04), CX + 1.6, 0.23, z));
const gavel = new THREE.Group();
gavel.add(at(cyl(0.06, 0.06, 0.22, "#6b4226"), 0, 0, 0));
gavel.children[0].rotation.z = Math.PI / 2;
gavel.add(at(cyl(0.015, 0.015, 0.3, "#8a5a33"), 0, -0.15, 0));
scene.add(gavel);
const rope = cyl(0.01, 0.01, 1.0, "#c9a26b");
scene.add(rope);
const bucket2 = bucket();
scene.add(bucket2);

// ------------------------------------------------------------------ more classroom detail
function poster(text, bg, fg, w, h, x, y, z, ry = 0) {
  const tx = canvasTex(256, Math.round((256 * h) / w), (g, cw, ch) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, cw, ch);
    g.fillStyle = fg;
    g.font = "bold 46px sans-serif";
    g.textAlign = "center";
    text
      .split("\n")
      .forEach((line, i, a) =>
        g.fillText(line, cw / 2, ch / 2 + (i - (a.length - 1) / 2) * 52 + 16),
      );
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tx, roughness: 0.8 }),
  );
  m.position.set(x, y, z);
  m.rotation.y = ry;
  room.add(m);
}
poster("READ!", "#3d7be0", "#ffffff", 0.9, 1.1, 2.9, 1.9, -4.38);
poster("A B C\nD E F", "#f7d65a", "#e8432e", 1.0, 0.8, -3.3, 2.1, -4.38);
poster("NO\nPRANKS", "#e8432e", "#ffffff", 0.8, 0.9, -4.38, 2.0, -2.6, Math.PI / 2);
poster("2+2=5", "#22a58b", "#ffffff", 0.9, 0.6, 4.38, 2.2, -2.8, -Math.PI / 2);
// windows on the left wall with trees outside
const outsideTex = canvasTex(256, 256, (g) => {
  g.fillStyle = "#9fdcff";
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#5fb34f";
  g.fillRect(0, 190, 256, 66);
  g.fillStyle = "#3f9a45";
  for (const [x, y, r] of [
    [60, 150, 46],
    [170, 140, 56],
    [230, 170, 34],
  ]) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(90, 50, 22, 0, Math.PI * 2);
  g.arc(116, 46, 26, 0, Math.PI * 2);
  g.fill();
});
for (const z of [-1.4, 1.4]) {
  const win = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.3),
    new THREE.MeshBasicMaterial({ map: outsideTex }),
  );
  win.position.set(-4.38, 1.9, z);
  win.rotation.y = Math.PI / 2;
  room.add(win);
  for (const [h, dy, dz] of [
    [1.4, 0, -0.8],
    [1.4, 0, 0.8],
    [0.08, 0.7, 0],
    [0.08, -0.7, 0],
  ])
    room.add(
      at(rbox(0.12, dy ? 0.1 : h, dz ? 0.1 : 1.7, "#ffffff", 0.02), -4.36, 1.9 + dy, z + dz),
    );
}
// bookshelf, lockers, clock, globe, plants, rug, bin, backpacks
const shelf = new THREE.Group();
shelf.add(at(rbox(1.4, 2.0, 0.4, "#8a5a33", 0.03), 0, 1.0, 0));
for (let r = 0; r < 3; r++)
  for (let k = 0; k < 7; k++)
    shelf.add(
      at(
        rbox(
          0.12,
          0.42,
          0.3,
          ["#e8432e", "#3d7be0", "#f7d65a", "#22a58b", "#9b6ade"][(k + r) % 5],
          0.02,
        ),
        -0.5 + k * 0.17,
        0.42 + r * 0.6,
        0.06,
      ),
    );
shelf.position.set(-3.6, 0, -4.15);
room.add(shelf);
for (let i = 0; i < 4; i++) {
  const l = rbox(0.6, 2.0, 0.5, ["#3d7be0", "#e8432e"][i % 2], 0.03);
  l.position.set(-4.15, 1.0, 2.6 + i * 0.62 - 0.6);
  room.add(l);
}
const clockTex = canvasTex(128, 128, (g) => {
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(64, 64, 60, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#1d1a26";
  g.lineWidth = 8;
  g.stroke();
  g.beginPath();
  g.moveTo(64, 64);
  g.lineTo(64, 24);
  g.moveTo(64, 64);
  g.lineTo(92, 74);
  g.stroke();
});
const clock = new THREE.Mesh(
  new THREE.CircleGeometry(0.3, 32),
  new THREE.MeshBasicMaterial({ map: clockTex }),
);
clock.position.set(1.5, 2.85, -4.38);
room.add(clock);
room.add(at(mesh(new THREE.SphereGeometry(0.2, 20, 16), "#3d7be0"), 0.5, 1.05, -3.2));
room.add(at(cyl(0.03, 0.08, 0.16, "#8a5a33"), 0.5, 0.86, -3.2));
for (const [x, z] of [
  [-4.0, -3.7],
  [3.9, 3.9],
]) {
  room.add(at(cyl(0.22, 0.17, 0.4, "#e07a5f"), x, 0.2, z));
  for (let i = 0; i < 4; i++)
    room.add(
      at(
        rbox(0.36, 0.36, 0.36, "#4fb350", 0.12),
        x + Math.cos(i * 1.6) * 0.12,
        0.6 + i * 0.16,
        z + Math.sin(i * 1.6) * 0.12,
      ),
    );
}
room.add(at(box(3.6, 0.01, 2.6, "#7b5ea7"), -0.4, 0.006, 1.1));
room.add(at(cyl(0.2, 0.16, 0.5, "#5a5e6b"), 2.6, 0.25, -3.9));
// halloween corner: pumpkins and a web
for (const [x, z, s] of [
  [-3.9, -0.4, 1],
  [-3.6, 0.1, 0.7],
]) {
  const p = new THREE.Group();
  p.add(at(mesh(new THREE.SphereGeometry(0.22, 16, 12), "#f29e38"), 0, 0.2, 0));
  p.children[0].scale.set(1.2, 0.85, 1.2);
  p.add(at(cyl(0.03, 0.03, 0.1, "#3f7a3a"), 0, 0.42, 0));
  p.scale.setScalar(s);
  p.position.set(x, 0, z);
  room.add(p);
}
const webTex = canvasTex(256, 256, (g) => {
  g.strokeStyle = "rgba(255,255,255,0.85)";
  g.lineWidth = 3;
  for (let a = 0; a < 7; a++) {
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(((a / 6) * Math.PI) / 2) * 256, Math.sin(((a / 6) * Math.PI) / 2) * 256);
    g.stroke();
  }
  for (let r = 40; r < 256; r += 40) {
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI / 2);
    g.stroke();
  }
});
const web = new THREE.Mesh(
  new THREE.PlaneGeometry(1.2, 1.2),
  new THREE.MeshBasicMaterial({ map: webTex, transparent: true }),
);
web.position.set(-3.8, 2.8, -4.38);
web.rotation.z = Math.PI;
room.add(web);
// the wall the horse crashes through (find the existing right-wall piece)
const crashWall = room.children.find(
  (m) => Math.abs(m.position.x - 4.5) < 0.01 && Math.abs(m.position.z - 1.75) < 0.01,
);
const bricks = [];
for (let i = 0; i < 26; i++) {
  const b = rbox(0.3, 0.18, 0.18, i % 3 ? "#c9a7e8" : "#b48fd6", 0.03);
  b.userData.o = [rnd(), rnd(), rnd()];
  scene.add(b);
  bricks.push(b);
}

// ---------------- the cow (the teacher after the poof)
const cowTex = canvasTex(256, 256, (g) => {
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#1d1a26";
  for (const [x, y, rx, ry] of [
    [40, 40, 50, 36],
    [200, 180, 60, 44],
    [180, 30, 30, 22],
    [60, 210, 34, 26],
  ]) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0.4, 0, Math.PI * 2);
    g.fill();
  }
});
const cowMat = new THREE.MeshStandardMaterial({ map: cowTex, roughness: 0.6 });
const cow = makeBlocky({ skin: "#ffffff", torso: "#ffffff", legs: "#ffffff" });
cow.root.traverse((o) => {
  if (o.isMesh && o !== cow.face) o.material = cowMat;
});
for (const s of [-1, 1]) {
  const horn = mesh(new THREE.ConeGeometry(0.05, 0.18, 8), "#f4e7c1");
  horn.position.set(s * 0.2, 0.32, 0);
  horn.rotation.z = -s * 0.5;
  cow.head.add(horn);
  const ear = rbox(0.16, 0.08, 0.1, "#f6a9c6", 0.03);
  ear.position.set(s * 0.32, 0.12, 0);
  cow.head.add(ear);
}
const snout = rbox(0.34, 0.16, 0.08, "#f6a9c6", 0.05);
snout.position.set(0, -0.12, 0.26);
cow.head.add(snout);
for (const s of [-1, 1])
  cow.head.add(at(mesh(new THREE.SphereGeometry(0.025, 10, 8), "#7a3a4a"), s * 0.07, -0.12, 0.3));
cow.face.position.y = 0.06;
cow.face.scale.setScalar(0.8);
const poof = [];
for (let i = 0; i < 10; i++) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 10),
    new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.9 }),
  );
  m.userData.o = [rnd() - 0.5, rnd(), rnd() - 0.5];
  scene.add(m);
  poof.push(m);
}
function puff(t, t0, x, y, z) {
  const k = (t - t0) / 0.9;
  for (const m of poof) {
    m.visible = k >= 0 && k < 1;
    if (!m.visible) continue;
    const [ox, oy, oz] = m.userData.o;
    m.position.set(x + ox * 1.2 * k, y + oy * 0.8 * k, z + oz * 1.2 * k);
    m.scale.setScalar(1 + k * 2);
    m.material.opacity = 0.9 * (1 - k);
  }
}
// banana phone
const banana = new THREE.Group();
const bTube = mesh(new THREE.TorusGeometry(0.16, 0.045, 10, 20, Math.PI * 0.8), "#f7d65a");
bTube.rotation.z = Math.PI * 0.6;
banana.add(bTube);
scene.add(banana);
// horse for the cop
const horse = new THREE.Group();
horse.add(at(rbox(1.5, 0.7, 0.55, "#8a5a33", 0.12), 0, 1.25, 0));
for (const [x, z] of [
  [-0.55, -0.18],
  [-0.55, 0.18],
  [0.55, -0.18],
  [0.55, 0.18],
])
  horse.add(at(rbox(0.16, 1.0, 0.16, "#7a4f2e", 0.04), x, 0.5, z));
const neck = rbox(0.3, 0.8, 0.3, "#8a5a33", 0.08);
neck.position.set(0.75, 1.7, 0);
neck.rotation.z = -0.5;
horse.add(neck);
const hHead = rbox(0.6, 0.3, 0.3, "#8a5a33", 0.08);
hHead.position.set(1.15, 2.0, 0);
horse.add(hHead);
horse.add(at(rbox(0.5, 0.12, 0.08, "#1d1a26", 0.03), 0.65, 2.0, 0));
horse.add(at(mesh(new THREE.SphereGeometry(0.04, 8, 8), "#1d1a26"), 1.3, 2.08, 0.15));
scene.add(horse);
// rocket
const rocket = new THREE.Group();
rocket.add(at(cyl(0.32, 0.32, 1.4, "#f4f1ea"), 0, 0.7, 0));
rocket.add(at(mesh(new THREE.ConeGeometry(0.32, 0.6, 20), "#e8432e"), 0, 1.7, 0));
rocket.add(at(cyl(0.33, 0.33, 0.12, "#e8432e"), 0, 0.3, 0));
for (let i = 0; i < 3; i++) {
  const f = rbox(0.06, 0.5, 0.4, "#e8432e", 0.02);
  const a = (i / 3) * Math.PI * 2;
  f.position.set(Math.cos(a) * 0.36, 0.2, Math.sin(a) * 0.36);
  f.rotation.y = -a;
  rocket.add(f);
}
const flame = new THREE.Mesh(
  new THREE.ConeGeometry(0.28, 1.0, 16),
  new THREE.MeshBasicMaterial({
    color: "#ffb43a",
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
flame.rotation.x = Math.PI;
flame.position.y = -0.45;
rocket.add(flame);
scene.add(rocket);
// the moon (far away)
const MX = -60;
const moonTex = canvasTex(512, 512, (g) => {
  g.fillStyle = "#b9b9c2";
  g.fillRect(0, 0, 512, 512);
  const r = mulberry32(3);
  for (let i = 0; i < 40; i++) {
    const x = r() * 512;
    const y = r() * 512;
    const s = 8 + r() * 30;
    g.fillStyle = "#9a9aa6";
    g.beginPath();
    g.arc(x, y, s, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#c9c9d2";
    g.beginPath();
    g.arc(x - s * 0.2, y - s * 0.2, s * 0.6, 0, Math.PI * 2);
    g.fill();
  }
});
moonTex.wrapS = moonTex.wrapT = THREE.RepeatWrapping;
moonTex.repeat.set(4, 4);
const moonGround = mesh(
  new THREE.CircleGeometry(30, 48),
  new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.95 }),
  false,
);
moonGround.rotation.x = -Math.PI / 2;
moonGround.position.set(MX, 0.01, 0);
scene.add(moonGround);
const earthTex = canvasTex(256, 256, (g) => {
  g.fillStyle = "#2f7ad6";
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#4fb350";
  for (const [x, y, rx, ry] of [
    [70, 90, 50, 34],
    [170, 160, 60, 40],
    [200, 60, 30, 20],
  ]) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0.5, 0, Math.PI * 2);
    g.fill();
  }
});
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 24),
  new THREE.MeshBasicMaterial({ map: earthTex }),
);
earth.position.set(MX + 6, 9, -22);
scene.add(earth);
const STARS = 400;
const starGeo = new THREE.BufferGeometry();
const sp = new Float32Array(STARS * 3);
for (let i = 0; i < STARS; i++) {
  const a = rnd() * Math.PI * 2;
  const e = rnd() * 1.2 + 0.05;
  sp[i * 3] = MX + Math.cos(a) * Math.cos(e) * 50;
  sp[i * 3 + 1] = Math.sin(e) * 50;
  sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 50;
}
starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: "#ffffff", size: 0.25 }));
scene.add(stars);
const cake = new THREE.Group();
cake.add(at(cyl(0.3, 0.3, 0.3, "#f6a9c6"), 0, 0.15, 0));
cake.add(at(cyl(0.31, 0.31, 0.06, "#ffffff"), 0, 0.3, 0));
cake.add(at(cyl(0.02, 0.02, 0.15, "#3d7be0"), 0, 0.4, 0));
cake.add(
  at(
    mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: "#ffb43a" })),
    0,
    0.5,
    0,
  ),
);
cake.position.set(MX + 0.9, 0, -0.6);
scene.add(cake);
// courtroom extras: columns, flags, chandelier
for (const x of [CX - 4.2, CX + 4.2])
  for (const z of [-3.6, 0.5]) court.add(at(cyl(0.25, 0.25, 4, "#f4f1ea"), x, 2, z));
for (const [x, c] of [
  [CX - 1.9, "#3d7be0"],
  [CX + 1.9, "#e8432e"],
]) {
  court.add(at(cyl(0.03, 0.03, 2.4, "#c9a26b"), x, 1.2, -4.4));
  court.add(at(rbox(0.6, 0.8, 0.03, c, 0.02), x + 0.32, 2.0, -4.4));
}
const chand = new THREE.Group();
chand.add(at(cyl(0.6, 0.4, 0.2, "#f7d65a"), 0, 0, 0));
for (let i = 0; i < 6; i++)
  chand.add(
    at(
      mesh(
        new THREE.SphereGeometry(0.07, 10, 8),
        new THREE.MeshBasicMaterial({ color: "#fff3b0" }),
      ),
      Math.cos(i) * 0.55,
      0.12,
      Math.sin(i) * 0.55,
    ),
  );
chand.position.set(CX + 1.6, 3.6, 0.6);
court.add(chand);
court.add(at(cyl(0.015, 0.015, 0.8, "#c9a26b"), CX + 1.6, 4.1, 0.6));

// ------------------------------------------------------------------ shots
shot(
  0,
  B.b1,
  [1.4, 1.7, 2.4, 3.7, 1.7, -1.6, 46, 0],
  [1.6, 1.65, 2.1, 3.7, 1.75, -1.5, 42, 0],
  "inOut",
);
shot(
  B.b1,
  B.splash1 + 0.2,
  [1.2, 1.5, 1.4, 4.0, 1.6, -1.0, 48, 0],
  [1.4, 1.48, 1.2, 4.0, 1.6, -1.0, 44, 0],
  "lin",
  { shake: [B.splash1, 0.4] },
);
shot(
  B.splash1 + 0.2,
  B.boom1,
  [1.9, 1.75, -0.85, 3.45, 1.72, -1.0, 46, 0],
  [2.0, 1.75, -0.86, 3.45, 1.72, -1.0, 42, 0],
  "lin",
);
shot(
  B.boom1,
  B.poof,
  [2.1, 1.75, -0.95, 3.45, 1.72, -1.0, 34, 0.12],
  [2.15, 1.75, -0.95, 3.45, 1.72, -1.0, 26, 0.12],
  "out",
  { shake: [B.boom1, 0.4] },
);
shot(
  B.poof,
  B.b3,
  [1.5, 1.6, -0.2, 3.45, 1.5, -1.0, 48, 0],
  [1.7, 1.58, -0.35, 3.45, 1.55, -1.0, 44, 0],
  "out",
  { shake: [B.poof, 0.4] },
);
shot(
  B.b3,
  B.bruh,
  [1.2, 1.55, -2.4, -1.2, 0.85, 2.0, 50, 0],
  [1.0, 1.52, -2.2, -1.2, 0.85, 2.0, 48, 0],
  "lin",
);
shot(
  B.bruh,
  B.b4,
  [-0.85, 1.5, -0.9, -0.4, 1.4, 0.82, 40, 0.1],
  [-0.82, 1.48, -0.8, -0.4, 1.4, 0.82, 30, 0.1],
  "out",
  { shake: [B.bruh + 0.1, 0.3] },
);
shot(
  B.b4,
  B.b5,
  [2.2, 1.7, -0.3, 3.45, 1.6, -1.0, 46, 0],
  [2.3, 1.68, -0.35, 3.45, 1.6, -1.0, 42, 0],
  "lin",
);
shot(
  B.b5,
  B.b6,
  [-1.5, 2.2, 3.6, 3.0, 1.2, 1.4, 52, 0],
  [-1.2, 2.1, 3.4, 2.4, 1.2, 1.4, 50, 0],
  "out",
  { shake: [B.crash, 0.6] },
);
shot(
  B.b6,
  B.b7,
  [2.2, 1.9, 5.6, 0.8, 1.1, 3.6, 46, 0],
  [2.1, 1.85, 5.4, 0.8, 1.1, 3.6, 42, 0],
  "lin",
);
shot(
  B.b7,
  B.gavel1,
  [CX + 2.0, 3.4, 5.6, CX - 0.6, 1.2, -1.5, 50, 0],
  [CX + 1.5, 3.1, 4.9, CX - 0.6, 1.2, -1.5, 48, 0],
  "inOut",
);
shot(
  B.gavel1,
  B.b8,
  [CX + 0.1, 1.5, -1.0, CX, 2.35, -3.4, 50, 0.03],
  [CX + 0.1, 1.45, -1.2, CX, 2.35, -3.4, 46, 0.03],
  "out",
  { shake: [B.gavel1, 0.35] },
);
shot(
  B.b8,
  B.b9,
  [CX - 1.1, 1.7, 0.9, CX - 2.2, 1.55, -0.6, 46, 0],
  [CX - 1.2, 1.68, 0.75, CX - 2.2, 1.55, -0.6, 42, 0],
  "lin",
);
shot(
  B.b9,
  B.b10,
  [CX + 1.2, 1.2, 3.4, CX - 2.2, 2.0, -0.6, 52, 0],
  [CX + 0.6, 1.4, 3.0, CX - 2.2, 7.0, -0.6, 54, 0],
  "in",
  { shake: [B.launch, 1.4] },
);
shot(
  B.b10,
  B.b11,
  [MX + 3.4, 1.7, 4.8, MX + 0.4, 1.3, -0.2, 52, 0],
  [MX + 2.9, 1.5, 4.2, MX + 0.4, 1.2, -0.2, 50, 0],
  "inOut",
  { shake: [B.land, 0.5] },
);
shot(
  B.b11,
  T.total + 0.1,
  [MX - 0.2, 1.7, 2.6, MX - 0.2, 1.65, 0.9, 32, 0.1],
  [MX - 0.2, 1.7, 2.55, MX - 0.2, 1.65, 0.9, 24, 0.1],
  "out",
  { shake: [B.b11, 0.4] },
);

// ------------------------------------------------------------------ direction
function renderAt(t) {
  for (const P of [cat, bear, principal, cop, judge, cow, ...kids]) {
    reset(P);
    if (P.slime) for (const s of P.slime) s.visible = false;
  }
  for (const P of [cat, bear, ...kids]) setEmo(P, "neutral");
  cow.face.material.map = emoji("shock", true);
  for (const m of steam) m.visible = false;
  for (const m of poof) m.visible = false;
  for (const b of bricks) b.visible = false;
  crashWall.visible = t < B.crash;
  phone.visible = false;
  banana.visible = false;
  cuffs.visible = false;
  fall1.visible = fall2.visible = false;
  bucket1.visible = bucket2.visible = false;
  rope.visible = false;
  gavel.visible = false;
  horse.position.set(0, -60, 0);
  rocket.position.set(0, -60, 0);
  cake.visible = false;
  const space = t >= B.b10;
  scene.background = new THREE.Color(space ? "#05060f" : t >= B.b9 ? "#7fb4ff" : "#cfe8ff");
  hemi.intensity = space ? 0.55 : 1.0;
  sun.intensity = space ? 3.2 : 2.6;
  stars.visible = earth.visible = space;
  const holds = [];

  if (t < B.b7) {
    // ---------------- classroom
    kids.forEach((k, i) => {
      const x = -2.4 + (i % 3) * 2.0;
      const z = 0.2 + Math.floor(i / 3) * 1.8 + 0.62;
      k.root.position.set(i === 3 ? -0.4 : x, -0.25, i === 3 ? 2.62 : z);
      k.legL.rotation.x = k.legR.rotation.x = -1.5;
      k.root.rotation.y = Math.PI + 0.25;
      idle(k, t, i);
    });
    bucket1.visible = t < B.splash1 + 0.2;
    bucket1.position.set(4.3, 2.36, -1.0);
    if (t < B.b1) {
      cat.root.position.set(3.7, 0.48, -1.9);
      cat.root.rotation.y = Math.PI / 2 + 0.4;
      setEmo(cat, "sneaky");
      const place = ease.inOut(seg(t, 0.3, 1.4));
      cat.armL.rotation.x = cat.armR.rotation.x = -2.8 * place;
      bucket1.position.set(lerp(3.9, 4.3, place), lerp(1.9, 2.36, place), lerp(-1.75, -1.0, place));
      if (t > 1.5) {
        cat.root.rotation.y = -0.4;
        cat.armL.rotation.x = cat.armR.rotation.x = 0;
        setEmo(cat, "smirk");
      }
    } else if (t < B.b6) {
      cat.root.position.set(1.6, -0.25, 2.62);
      cat.legL.rotation.x = cat.legR.rotation.x = -1.5;
      cat.root.rotation.y = Math.PI / 2 + 0.3;
      setEmo(cat, t > B.splash1 ? "laugh" : "sneaky");
      cat.body.rotation.z = t > B.splash1 ? Math.sin(t * 14) * 0.08 : 0;
    }
    // teacher -> cow
    const teacher = t < B.poof ? bear : cow;
    const inK = seg(t, B.b1 - 0.2, B.splash1);
    teacher.root.position.set(lerp(6.2, 3.45, ease.out(inK)), 0, -1.0);
    teacher.root.rotation.y = -Math.PI / 2;
    if (inK > 0 && inK < 1) walk(teacher, t);
    if (t > B.splash1 - 0.45) {
      bucket1.rotation.z = lerp(0, 2.2, ease.out(seg(t, B.splash1 - 0.45, B.splash1 - 0.2)));
      pour(fall1, t, B.splash1 - 0.35, 3.55, 2.3, 1.9, -1.0);
    }
    if (t > B.splash1) {
      for (const s of bear.slime) s.visible = true;
      setEmo(bear, t > B.boom1 ? "rage" : "shock");
      bear.armL.rotation.set(0, 0, 0.6);
      bear.armR.rotation.set(0, 0, -0.6);
      if (t > B.boom1) {
        steam.forEach((m) => {
          const k = (t * 1.6 + m.userData.o[1]) % 1;
          m.visible = true;
          m.position.set(3.45, 1.95 + k * 0.6, -1.0 + m.userData.o[0] * (0.3 + k * 0.1));
          m.scale.setScalar(0.6 + k * 1.4);
          m.material.opacity = 0.8 * (1 - k);
        });
      }
    }
    puff(t, B.poof - 0.1, 3.45, 1.2, -1.0);
    if (t >= B.poof) {
      cow.face.material.map = emoji(t < B.poof + 0.6 ? "shock" : "neutral", true);
      cow.head.rotation.z = Math.sin(t * 6) * 0.12;
      if (t > B.poof + 0.5) cow.neck.rotation.x = -0.3;
      if (t >= B.b3) {
        for (const k of kids) {
          setEmo(k, "laugh");
          k.body.rotation.z = Math.sin(t * 14 + k.root.position.x) * 0.08;
        }
      }
      if (t >= B.bruh) {
        setEmo(kids[1], "stern");
        kids[1].body.rotation.z = 0;
        kids[1].neck.rotation.y = 0.3;
      }
      if (t >= B.b4) {
        cow.root.position.set(3.45, 0, -1.0);
        cow.root.rotation.y = -Math.PI / 2;
        cow.armR.rotation.set(-2.6, 0, 0.5);
        banana.visible = t < B.b5;
        holds.push([banana, cow, 1, 0, 0.12, 0]);
        cow.face.material.map = emoji("stern", true);
        for (const k of kids) setEmo(k, "shock");
      }
      if (t >= B.b5) {
        cow.root.position.set(3.0, 0, -1.9);
        cow.root.rotation.y = -0.6;
        // the cop crashes through the wall on a horse
        const k = seg(t, B.b5 + 0.2, B.b6 - 0.2);
        horse.position.set(lerp(6.5, 2.2, ease.out(k)), 0, 1.6);
        horse.rotation.y = Math.PI;
        horse.position.y = Math.abs(Math.sin(t * 12)) * 0.08 * (1 - k);
        horse.children
          .slice(1, 5)
          .forEach((l, i) => (l.rotation.z = Math.sin(t * 14 + i * 1.6) * 0.4 * (1 - k)));
        cop.root.position.set(horse.position.x, horse.position.y + 0.85, 1.6);
        cop.root.rotation.y = -Math.PI / 2;
        cop.legL.rotation.set(0, 0, 0.9);
        cop.legR.rotation.set(0, 0, -0.9);
        cop.armR.rotation.set(-2.4, 0, 0);
        cop.face.material.map = faceTex("angry");
        if (t >= B.crash)
          bricks.forEach((b) => {
            const dt = Math.min(t - B.crash, 1.2);
            const [ox, oy, oz] = b.userData.o;
            b.visible = true;
            b.position.set(
              4.5 - dt * (1.5 + ox * 2),
              Math.max(0.09, 0.4 + oy * 2.5 + dt * (1 + oy * 2) - 4.9 * dt * dt),
              0.4 + oz * 2.4,
            );
            b.rotation.set(dt * ox * 8, dt * oy * 8, 0);
          });
        for (const kd of kids) setEmo(kd, "shock");
      }
    }
    if (t >= B.b6) {
      horse.position.set(2.2, 0, 1.6);
      horse.rotation.y = Math.PI;
      cop.root.position.set(2.2, 0.85, 1.6);
      cop.root.rotation.y = -Math.PI / 2;
      cop.legL.rotation.set(0, 0, 0.9);
      cop.legR.rotation.set(0, 0, -0.9);
      cop.face.material.map = faceTex("angry");
      cat.root.position.set(0.8, 0, 3.6);
      cat.root.rotation.y = 0.5;
      setEmo(cat, "neutral");
      cat.armL.rotation.set(0, 0, 1.2 + Math.sin(t * 6) * 0.1);
      cat.armR.rotation.set(0, 0, -1.2 - Math.sin(t * 6) * 0.1);
      cuffs.visible = true;
      cuffs.position.set(0.8, 0.8, 3.85);
    }
  } else {
    // ---------------- courtroom, rocket, moon
    cat.root.position.set(CX - 2.2, 0.1, -0.6);
    cat.root.rotation.y = 0.3;
    setEmo(cat, "shock");
    cuffs.visible = t < B.b9;
    cuffs.position.set(CX - 2.3, 0.62, -0.85);
    cop.root.position.set(CX - 3.3, 0, -0.4);
    cop.root.rotation.y = Math.PI / 2;
    cop.face.material.map = faceTex("flat");
    judge.root.position.set(CX, 0.75, -3.75);
    judge.face.material.map = faceTex("angry");
    gavel.visible = true;
    const g1 = Math.sin(Math.PI * seg(t, B.gavel1 - 0.3, B.gavel1 + 0.05));
    judge.armR.rotation.x = -1.1 - 1.2 * g1;
    holds.push([gavel, judge, 1, 0, -0.05, 0.1]);
    kids.forEach((k, i) => {
      k.root.position.set(CX + 0.4 + i * 1.0, -0.15, i % 2 ? 3.0 : 1.8);
      k.legL.rotation.x = k.legR.rotation.x = -1.5;
      k.root.rotation.y = Math.PI + 0.3;
      setEmo(k, t >= B.launch ? "shock" : "neutral");
      idle(k, t, i);
    });
    if (t >= B.b8) setEmo(cat, "smirk");
    if (t >= B.b9) {
      // the cat turns into a rocket
      const k = ease.in(seg(t, B.launch, B.b10));
      rocket.position.set(CX - 2.2, k * 14, -0.6);
      rocket.rotation.z = Math.sin(t * 30) * 0.03;
      flame.scale.set(1, 0.8 + Math.sin(t * 50) * 0.2 + k, 1);
      flame.visible = t >= B.launch - 0.1;
      cat.root.position.set(CX - 2.2, rocket.position.y + 1.8, -0.6);
      cat.root.rotation.y = 0;
      cat.armL.rotation.set(0, 0, 2.6);
      cat.armR.rotation.set(0, 0, -2.6);
      setEmo(cat, "laugh");
      puff(t, B.launch, CX - 2.2, 0.4, -0.6);
    }
    if (t >= B.b10) {
      // the moon: the cow is already there
      const land = ease.out(seg(t, B.b10, B.land));
      rocket.position.set(MX - 0.4, lerp(8, 0, land), 0.2);
      flame.visible = t < B.land;
      cat.root.position.set(MX - 0.4, rocket.position.y + 1.8, 0.2);
      cat.root.rotation.y = 0;
      setEmo(cat, t < B.land ? "laugh" : "shock");
      if (t >= B.land) {
        cat.root.position.set(MX - 0.2, 0, 0.9);
        cat.armL.rotation.set(0, 0, 0);
        cat.armR.rotation.set(0, 0, 0);
      }
      cow.root.position.set(MX + 1.3, 0, -0.4);
      cow.root.rotation.y = -0.8;
      cow.face.material.map = emoji("laugh", true);
      cow.armL.rotation.set(0, 0, 2.5 + Math.sin(t * 10) * 0.3);
      cow.armR.rotation.x = -1.3;
      cake.visible = true;
      for (const s of bear.slime) s.visible = false;
      judge.root.position.y = -60;
      cop.root.position.y = -60;
      for (const k of kids) k.root.position.y = -60;
      if (t >= B.b11) {
        setEmo(cat, "smirk");
        cat.root.rotation.y = 0;
      }
    }
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
