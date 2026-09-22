import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { batchStaticParts } from './render-batching.js';
const mats = new Map();
export function mat(color, roughness = 0.8) {
  if (!mats.has(color)) mats.set(color, new THREE.MeshStandardMaterial({ color, roughness }));
  return mats.get(color);
}
let shadowTexture;
export function contactShadow(parent, width, depth, x = 0, z = 0, opacity = 0.2) {
  if (!shadowTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(53,69,42,0.7)');
    gradient.addColorStop(0.55, 'rgba(53,69,42,0.3)');
    gradient.addColorStop(1, 'rgba(53,69,42,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    shadowTexture = new THREE.CanvasTexture(canvas);
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.046, z);
  parent.add(mesh);
  return mesh;
}
export function disposeModel(group) {
  group.traverse((object) => {
    object.geometry?.dispose();
    if (object.material?.map && object.material.map !== shadowTexture) {
      object.material.map.dispose();
      object.material.dispose();
    }
  });
  group.removeFromParent();
}
export function box(parent, w, h, d, color, x = 0, y = 0, z = 0, r = 0.04) {
  const mesh = new THREE.Mesh(
    r
      ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3))
      : new THREE.BoxGeometry(w, h, d),
    mat(color),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function cyl(parent, rt, rb, h, color, x = 0, y = 0, z = 0, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), mat(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function sphere(parent, r, color, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(color));
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
export function label(
  parent,
  text,
  w,
  h,
  x,
  y,
  z,
  { bg = '#fffdf2', fg = '#315c50', size = 46 } = {},
) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = Math.round((768 * h) / w);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fg;
  ctx.font = `700 ${size}px "Malgun Gothic", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 384, canvas.height / 2, 740);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
  );
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
export function cross(parent, size, x, y, z, color = '#4a9079') {
  box(parent, size * 0.29, size, 0.055, color, x, y, z, 0.015);
  box(parent, size, size * 0.29, 0.06, color, x, y, z, 0.015);
}
export function plant(parent, x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  parent.add(g);
  cyl(g, 0.24, 0.17, 0.38, '#c8a47d', 0, 0.19);
  cyl(g, 0.22, 0.22, 0.035, '#5b5840', 0, 0.39);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4;
    const leaf = sphere(
      g,
      0.22,
      i % 2 ? '#739677' : '#8cab83',
      Math.cos(a) * 0.17,
      0.58 + (i % 3) * 0.16,
      Math.sin(a) * 0.17,
      0.55,
      1.8,
      0.5,
    );
    leaf.rotation.z = Math.cos(a) * 0.6;
  }
  return g;
}
export function productModel(p, scale = 1) {
  const g = new THREE.Group();
  g.scale.setScalar(scale);
  if (p.shape === 'bottle') {
    cyl(g, 0.085, 0.085, 0.26, p.color, 0, 0.14);
    cyl(g, 0.066, 0.066, 0.065, '#faf7e9', 0, 0.3);
    box(g, 0.15, 0.11, 0.015, '#f8f3e4', 0, 0.15, 0.084, 0.003);
    cross(g, 0.065, 0, 0.16, 0.098, p.color);
  } else if (p.shape === 'tube') {
    const a = box(g, 0.13, 0.27, 0.08, p.color, 0, 0.15, 0, 0.025);
    a.rotation.z = -0.12;
    box(g, 0.12, 0.04, 0.075, '#f9f5e9', 0, 0.02, 0, 0.008);
  } else {
    box(g, 0.18, 0.28, 0.095, p.color, 0, 0.14, 0, 0.009);
    box(g, 0.182, 0.085, 0.098, '#fff9ec', 0, 0.17, 0, 0.003);
    cross(g, 0.064, 0, 0.17, 0.055, p.color);
    box(g, 0.1, 0.013, 0.005, '#fdf9ee', 0, 0.06, 0.05, 0.001);
  }
  return g;
}
export function parcel(parent, x, y, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  parent.add(g);
  box(g, 0.55, 0.4, 0.45, '#c39764', 0, 0.2, 0, 0.025);
  box(g, 0.13, 0.008, 0.452, '#ead3a8', 0, 0.404, 0, 0.001);
  box(g, 0.13, 0.405, 0.012, '#ddbc87', 0, 0.2, 0.23, 0.001);
  box(g, 0.2, 0.13, 0.008, '#f6eddb', 0.12, 0.23, 0.237, 0.001);
  return g;
}
export function character(appearance = 0, staff = false, role = 'pharmacist') {
  const g = new THREE.Group();
  contactShadow(g, 0.95, 0.7, 0, 0, 0.4);
  const skin = ['#efc8a0', '#d7ab87', '#c58e69', '#f2d2b6'][appearance % 4],
    hair = ['#47382f', '#6d4f38', '#292e2e', '#b09575'][Math.floor(appearance / 4) % 4],
    coat = staff
      ? role === 'pharmacist'
        ? '#fffdf0'
        : '#82ab96'
      : ['#db946d', '#96aaa0', '#d8b15f', '#a7a0ba', '#718fac', '#c7838a'][appearance % 6];
  const legs = [],
    arms = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.105, 0.4, 0);
    g.add(leg);
    box(leg, 0.145, 0.34, 0.16, staff ? '#547b70' : '#66675f', 0, -0.14, 0, 0.04);
    box(leg, 0.16, 0.1, 0.25, '#494b46', 0, -0.32, 0.045, 0.03);
    legs.push(leg);
    const arm = new THREE.Group();
    arm.position.set(side * 0.255, 0.94, 0);
    g.add(arm);
    box(arm, 0.13, 0.33, 0.15, coat, 0, -0.12, 0, 0.04);
    sphere(arm, 0.075, skin, 0, -0.3, 0);
    arms.push(arm);
  }
  box(g, 0.45, 0.57, 0.29, coat, 0, 0.74, 0, 0.09);
  if (staff) {
    box(g, 0.085, 0.35, 0.015, '#7bb7aa', 0, 0.9, 0.15, 0.01);
    box(g, 0.1, 0.065, 0.02, '#d4ae70', 0.12, 0.83, 0.161, 0.007);
    box(g, 0.14, 0.12, 0.02, '#edf0e4', 0.12, 0.64, 0.155, 0.01);
  } else {
    box(g, 0.16, 0.025, 0.02, '#e4d6c3', 0, 0.89, 0.15, 0.005);
  }
  cyl(g, 0.075, 0.08, 0.11, skin, 0, 1.06, 0);
  sphere(g, 0.25, skin, 0, 1.3, 0, 1, 1.05, 0.88);
  sphere(g, 0.254, hair, 0, 1.42, -0.025, 1, 0.69, 0.9);
  box(g, 0.46, 0.12, 0.19, hair, 0, 1.48, 0.015, 0.055);
  if (appearance % 3 === 0) box(g, 0.12, 0.18, 0.12, hair, -0.2, 1.34, -0.01, 0.05);
  for (const side of [-1, 1]) {
    sphere(g, 0.024, '#343b34', side * 0.083, 1.31, 0.202, 1, 1.2, 0.5);
    sphere(g, 0.008, '#fff8e9', side * 0.083 + 0.006, 1.319, 0.214);
    sphere(g, 0.033, '#db9c80', side * 0.145, 1.25, 0.168, 1, 0.55, 0.4);
    sphere(g, 0.054, skin, side * 0.235, 1.3, 0, 0.5, 1, 0.6);
  }
  box(g, 0.06, 0.013, 0.01, '#aa775e', 0, 1.225, 0.208, 0.004);
  if (appearance % 5 === 0 && !staff) {
    for (const side of [-1, 1]) {
      const geo = new THREE.TorusGeometry(0.058, 0.008, 5, 14);
      const m = new THREE.Mesh(geo, mat('#6a6453'));
      m.position.set(side * 0.083, 1.31, 0.221);
      g.add(m);
    }
    box(g, 0.05, 0.009, 0.01, '#6a6453', 0, 1.31, 0.22, 0.001);
  }
  if (!staff && appearance % 4 === 0) {
    box(g, 0.18, 0.25, 0.16, '#bd956b', 0.33, 0.67, 0.04, 0.035);
    box(g, 0.018, 0.48, 0.02, '#b39671', 0.205, 0.87, 0.152, 0.005);
  }
  const held = new THREE.Group();
  g.add(held);
  held.position.set(0, 0.65, 0.33);
  parcel(held, 0, 0, 0, 0.62);
  held.visible = false;
  const item = box(g, 0.2, 0.26, 0.1, '#f0bd72', 0.24, 0.63, 0.28, 0.015);
  item.visible = false;
  g.userData = { legs, arms, held, item };
  batchStaticParts(g);
  return g;
}
export function animateCharacter(g, entity, time) {
  const walking = entity.path?.length > 0;
  const swing = walking ? Math.sin(time * 10 + entity.x) * 0.48 : Math.sin(time * 2) * 0.025;
  g.userData.legs[0].rotation.x = swing;
  g.userData.legs[1].rotation.x = -swing;
  const working =
    !walking && ((entity.action && entity.action !== '대기') || entity.state === 'pick');
  g.userData.arms.forEach(
    (a, i) => (a.rotation.x = working ? -0.8 + Math.sin(time * 7 + i) * 0.2 : swing * (i ? 1 : -1)),
  );
  const carry =
    entity.action === '진열' || entity.action === '입고 정리' || (walking && entity.carry);
  g.userData.held.visible = carry;
  g.userData.item.visible = !!entity.held;
  g.position.set(entity.x, walking ? Math.abs(Math.sin(time * 10)) * 0.025 : 0, entity.z);
  g.rotation.y = entity.angle || 0;
}
export function furnitureModel(kind) {
  const g = new THREE.Group();
  if (kind === 'plant') plant(g, 0, 0);
  else if (kind === 'bench') {
    box(g, 1.5, 0.15, 0.61, '#c9a77a', 0, 0.47, 0, 0.055);
    box(g, 1.5, 0.49, 0.1, '#97af96', 0, 0.8, -0.29, 0.055);
    for (const x of [-0.57, 0.57])
      for (const z of [-0.21, 0.21]) cyl(g, 0.03, 0.03, 0.44, '#738472', x, 0.23, z);
    box(g, 0.59, 0.035, 0.49, '#d7bc8e', -0.37, 0.567, 0, 0.025);
    box(g, 0.59, 0.035, 0.49, '#d7bc8e', 0.37, 0.567, 0, 0.025);
  } else if (kind === 'storage') {
    box(g, 1.8, 1.8, 0.09, '#d4c6a7', 0, 0.92, -0.29);
    for (const x of [-0.86, 0.86]) box(g, 0.08, 1.85, 0.7, '#e9d9b7', x, 0.945, 0);
    for (const y of [0.15, 0.65, 1.15, 1.65]) {
      box(g, 1.8, 0.07, 0.7, '#eee4cc', 0, y, 0);
      for (const x of [-0.58, 0, 0.58]) parcel(g, x, y + 0.04, 0, 0.75);
    }
    label(g, 'STOCK +120', 1.45, 0.15, 0, 1.81, 0.365, { bg: '#9bae8c', fg: '#fff8df', size: 62 });
  }
  contactShadow(g, kind === 'plant' ? 1.1 : 2.1, 1.2, 0, 0, 0.3);
  return g;
}
export function shelf(parent, x, z, title, color) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  box(g, 2.1, 1.65, 0.12, '#e7e4d6', 0, 0.84, -0.3);
  box(g, 0.11, 1.7, 0.68, '#fbf7e9', -1.03, 0.85);
  box(g, 0.11, 1.7, 0.68, '#fbf7e9', 1.03, 0.85);
  for (const y of [0.16, 0.63, 1.1, 1.57]) {
    box(g, 2.08, 0.075, 0.72, '#fbf7e9', 0, y, 0);
    box(g, 2.1, 0.055, 0.025, color, 0, y - 0.02, 0.37, 0.005);
  }
  box(g, 2.1, 0.27, 0.12, color, 0, 1.85, -0.21);
  label(g, title, 1.9, 0.21, 0, 1.85, -0.143, { bg: color, fg: '#ffffff', size: 58 });
  return g;
}
