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
function faceTo(x, z, tx, tz) {
  return Math.atan2(tx - x, tz - z);
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

// ------------------------------------------------------------------ shots
shot(
  0,
  B.b1,
  [1.0, 1.7, 2.6, 3.7, 1.6, -1.6, 44, 0],
  [1.4, 1.65, 2.2, 3.7, 1.7, -1.5, 40, 0],
  "inOut",
);
shot(
  B.b1,
  B.b1 + 1.0,
  [1.2, 1.4, 1.8, 4.3, 1.6, -1.0, 46, 0],
  [1.4, 1.4, 1.6, 4.3, 1.6, -1.0, 44, 0],
  "lin",
);
shot(
  B.b1 + 1.0,
  B.b2,
  [2.0, 1.55, 0.6, 3.5, 1.7, -1.0, 40, 0],
  [2.1, 1.55, 0.5, 3.5, 1.7, -1.0, 36, 0],
  "lin",
  { shake: [B.splash1, 0.5] },
);
shot(
  B.b2,
  B.b2 + 1.3,
  [1.6, 1.8, -0.8, 3.45, 1.75, -1.0, 46, 0.04],
  [1.75, 1.78, -0.82, 3.45, 1.75, -1.0, 40, -0.04],
  "lin",
  { shake: [B.b2, 1.3] },
);
shot(
  B.b2 + 1.3,
  B.b3,
  [1.2, 1.55, -2.4, -1.2, 0.85, 2.0, 50, 0],
  [1.0, 1.52, -2.2, -1.2, 0.85, 2.0, 48, 0],
  "lin",
);
shot(
  B.b3,
  B.b4,
  [1.5, 1.8, -0.3, 3.4, 1.55, -1.0, 46, 0],
  [1.6, 1.78, -0.35, 3.4, 1.55, -1.0, 42, 0],
  "lin",
);
shot(
  B.b4,
  B.b5,
  [0.9, 2.7, 0.3, 3.4, 1.25, -1.3, 46, 0],
  [1.05, 2.65, 0.2, 3.4, 1.25, -1.3, 44, 0],
  "inOut",
);
shot(
  B.b5,
  B.b6,
  [CX + 2.0, 3.4, 5.6, CX - 0.6, 1.2, -1.5, 50, 0],
  [CX + 1.5, 3.1, 4.9, CX - 0.6, 1.2, -1.5, 48, 0],
  "inOut",
);
shot(
  B.b6,
  B.b7,
  [CX + 0.1, 1.5, -1.0, CX, 2.35, -3.4, 50, 0.03],
  [CX + 0.1, 1.45, -1.2, CX, 2.35, -3.4, 46, 0.03],
  "out",
  { shake: [B.gavel1, 0.35] },
);
shot(
  B.b7,
  B.b8,
  [CX - 1.3, 1.65, 0.6, CX - 2.2, 1.65, -0.6, 44, 0],
  [CX - 1.45, 1.65, 0.4, CX - 2.2, 1.65, -0.6, 40, 0],
  "lin",
);
shot(
  B.b8,
  B.b9,
  [CX + 1.4, 1.8, 0.4, CX, 2.4, -3.3, 52, 0],
  [CX + 1.2, 1.75, 0.1, CX, 2.4, -3.3, 50, 0],
  "lin",
  { shake: [B.splash2, 0.6] },
);
shot(
  B.b9,
  B.b9 + 1.6,
  [CX - 1.1, 1.7, 0.9, CX - 2.2, 1.55, -0.6, 46, 0],
  [CX - 1.2, 1.68, 0.75, CX - 2.2, 1.55, -0.6, 42, 0],
  "out",
);
shot(
  B.b9 + 1.6,
  T.total + 0.1,
  [CX + 3.5, 2.6, 5.5, CX, 1.3, -1.0, 50, 0],
  [CX + 4.5, 4.5, 7.5, CX, 1.2, -1.0, 50, 0],
  "inOut",
);

// ------------------------------------------------------------------ direction
scene.background = new THREE.Color("#cfe8ff");
function renderAt(t) {
  for (const P of [cat, bear, principal, cop, judge, ...kids]) {
    reset(P);
    if (P.slime) for (const s of P.slime) s.visible = false;
  }
  for (const P of [cat, bear, ...kids]) setEmo(P, "neutral");
  for (const m of steam) m.visible = false;
  phone.visible = false;
  cuffs.visible = false;
  fall1.visible = fall2.visible = false;
  bucket1.visible = bucket2.visible = false;
  rope.visible = false;
  gavel.visible = false;
  const holds = [];

  if (t < B.b5) {
    // ---------------- classroom
    kids.forEach((k, i) => {
      const x = -2.4 + (i % 3) * 2.0;
      const z = 0.2 + Math.floor(i / 3) * 1.8 + 0.62;
      k.root.position.set(i === 3 ? -0.4 : x, -0.25, i === 3 ? 2.62 : z);
      k.legL.rotation.x = k.legR.rotation.x = -1.5;
      k.root.rotation.y = Math.PI + 0.25;
      idle(k, t, i);
    });
    // the prank: cat on the chair puts the bucket on the door
    bucket1.visible = t < B.splash1 + 0.2;
    bucket1.position.set(4.3, 2.36, -1.0);
    if (t < B.b1) {
      cat.root.position.set(3.7, 0.48, -1.9);
      cat.root.rotation.y = Math.PI / 2 + 0.4;
      setEmo(cat, "sneaky");
      const place = ease.inOut(seg(t, 0.4, 1.8));
      cat.armL.rotation.x = cat.armR.rotation.x = -2.8 * place;
      bucket1.position.set(lerp(3.9, 4.3, place), lerp(1.9, 2.36, place), lerp(-1.75, -1.0, place));
      if (t > 2.0) {
        cat.root.rotation.y = -0.4;
        cat.armL.rotation.x = cat.armR.rotation.x = 0;
        setEmo(cat, "smirk");
      }
    } else {
      cat.root.position.set(-2.4 + 2.0, -0.25, 2.62);
      cat.legL.rotation.x = cat.legR.rotation.x = -1.5;
      cat.root.rotation.y = Math.PI / 2 + 0.3;
      setEmo(cat, t > B.splash1 ? "laugh" : "sneaky");
    }
    // teacher walks in, slime falls
    const inK = seg(t, B.b1 - 0.2, B.splash1);
    bear.root.position.set(lerp(6.2, 3.45, ease.out(inK)), 0, -1.0);
    bear.root.rotation.y = -Math.PI / 2;
    if (inK > 0 && inK < 1) walk(bear, t);
    setEmo(bear, "neutral");
    if (t > B.splash1 - 0.45) {
      bucket1.rotation.z = lerp(0, 2.2, ease.out(seg(t, B.splash1 - 0.45, B.splash1 - 0.2)));
      pour(fall1, t, B.splash1 - 0.35, 3.55, 2.3, 1.9, -1.0);
    }
    if (t > B.splash1) {
      for (const s of bear.slime) s.visible = true;
      setEmo(bear, "shock");
      bear.armL.rotation.set(0, 0, 0.6);
      bear.armR.rotation.set(0, 0, -0.6);
    }
    if (t > B.b2 && t < B.b3) {
      setEmo(bear, "rage");
      bear.root.position.x += Math.sin(t * 60) * 0.015;
      bear.armL.rotation.set(-0.3, 0, 0.9);
      bear.armR.rotation.set(-0.3, 0, -0.9);
      steam.forEach((m) => {
        const k = (t * 1.6 + m.userData.o[1]) % 1;
        m.visible = true;
        m.position.set(3.45, 1.95 + k * 0.6, -1.0 + m.userData.o[0] * (0.3 + k * 0.1));
        m.scale.setScalar(0.6 + k * 1.4);
        m.material.opacity = 0.8 * (1 - k);
      });
      for (const k of kids) {
        setEmo(k, "laugh");
        k.body.rotation.z = Math.sin(t * 14 + k.root.position.x) * 0.08;
      }
    }
    if (t >= B.b3) {
      setEmo(bear, "stern");
      bear.armR.rotation.set(-2.6, 0, 0.5);
      phone.visible = t < B.b4;
      holds.push([phone, bear, 1, 0, 0.12, 0]);
      for (const k of kids) setEmo(k, "shock");
      setEmo(cat, "shock");
    }
    if (t >= B.b4) {
      bear.root.position.set(3.0, 0, -1.9);
      bear.root.rotation.y = -0.6;
      principal.root.position.set(3.6, 0, -1.0);
      principal.root.rotation.y = -Math.PI / 2 - 0.3;
      setEmo(principal, "stern");
      principal.face.material.map = faceTex("angry");
      principal.armL.rotation.set(-1.4, 0, -0.6);
      principal.armR.rotation.set(-1.4, 0, 0.6);
      const k = seg(t, B.b4 + 0.2, B.b5 - 0.3);
      cop.root.position.set(lerp(4.0, 1.0, k), 0, lerp(-0.6, 2.0, k));
      cop.root.rotation.y = faceTo(4.0, -0.6, 0.4, 2.6);
      cop.face.material.map = faceTex("angry");
      if (k > 0 && k < 1) walk(cop, t);
    }
  } else {
    // ---------------- courtroom
    cat.root.position.set(CX - 2.2, 0.1, -0.6);
    cat.root.rotation.y = 0.3;
    setEmo(cat, "shock");
    cat.armL.rotation.set(0.4, 0, -0.3);
    cat.armR.rotation.set(0.4, 0, 0.3);
    cuffs.visible = true;
    cuffs.position.set(CX - 2.2 - 0.1, 0.62, -0.6 - 0.25);
    cop.root.position.set(CX - 3.3, 0, -0.4);
    cop.root.rotation.y = Math.PI / 2;
    cop.face.material.map = faceTex("flat");
    judge.root.position.set(CX, 0.75, -3.75);
    judge.face.material.map = faceTex("angry");
    gavel.visible = true;
    const hit = (t0) => Math.sin(Math.PI * seg(t, t0 - 0.3, t0 + 0.05));
    const g1 = hit(B.gavel1);
    judge.armR.rotation.x = -1.1 - 1.2 * g1;
    holds.push([gavel, judge, 1, 0, -0.05, 0.1]);
    kids.forEach((k, i) => {
      k.root.position.set(CX + 0.4 + i * 1.0, -0.15, i % 2 ? 3.0 : 1.8);
      k.legL.rotation.x = k.legR.rotation.x = -1.5;
      k.root.rotation.y = Math.PI + 0.3;
      setEmo(k, "shock");
      idle(k, t, i);
    });
    bear.root.position.set(CX + 0.6, -0.15, 1.8);
    bear.legL.rotation.x = bear.legR.rotation.x = -1.5;
    bear.root.rotation.y = Math.PI;
    for (const s of bear.slime) s.visible = true;
    setEmo(bear, "smirk");
    // the next bucket hangs above the judge
    bucket2.visible = true;
    rope.visible = true;
    bucket2.position.set(CX, 3.35, -3.65);
    rope.position.set(CX, 4.0, -3.65);
    if (t >= B.b7) setEmo(cat, "smirk");
    if (t >= B.b8) {
      const g2 = hit(B.splash2 - 0.15);
      judge.armR.rotation.x = -1.1 - 1.2 * g2;
      bucket2.rotation.z = lerp(0, 2.3, ease.out(seg(t, B.splash2 - 0.4, B.splash2 - 0.15)));
      pour(fall2, t, B.splash2 - 0.3, CX + 0.1, 3.3, 2.4, -3.75);
    }
    if (t >= B.splash2) {
      for (const s of judge.slime) s.visible = true;
      judge.face.material.map = faceTex("shock");
      judge.armL.rotation.set(0, 0, 0.8);
      judge.armR.rotation.set(0, 0, -0.8);
      for (const k of kids) {
        setEmo(k, "laugh");
        k.body.rotation.z = Math.sin(t * 14 + k.root.position.x) * 0.08;
        k.armL.rotation.z = 2.4 + Math.sin(t * 12) * 0.3;
      }
      setEmo(bear, "laugh");
      cop.face.material.map = faceTex("shock");
    }
    if (t >= B.b9) {
      setEmo(cat, "smirk");
      cat.neck.rotation.y = -0.3;
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
