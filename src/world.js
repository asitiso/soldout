import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  box,
  cyl,
  sphere,
  label,
  cross,
  plant,
  productModel,
  parcel,
  character,
  animateCharacter,
  shelf,
  mat,
  contactShadow,
  disposeModel,
  furnitureModel,
} from './models.js';
import { PRODUCTS, ZONES, POPS, NEWS, SPOTS } from './content.js';
import { EXPANSIONS, FURNITURE, dimensions } from './building.js';
export class World {
  constructor(container, game, onSelect) {
    this.game = game;
    this.container = container;
    this.onSelect = onSelect;
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.Fog('#e5e9e1', 30, 65);
    this.camera = new THREE.OrthographicCamera(-10, 10, 8, -8, 0.1, 100);
    this.camera.position.set(13, 14, 18);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.2, 0.9);
    this.controls.enableRotate = false;
    this.controls.enableDamping = true;
    this.controls.minZoom = 0.35;
    this.controls.maxZoom = 1.9;
    this.controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
    this.controls.update();
    this.scene.add(new THREE.HemisphereLight('#fffaf0', '#a4b9a5', 1.9));
    this.sun = new THREE.DirectionalLight('#fff2d3', 2.5);
    this.sun.position.set(-7, 14, 9);
    this.sun.castShadow = true;
    Object.assign(this.sun.shadow.camera, {
      left: -13,
      right: 13,
      top: 12,
      bottom: -12,
      near: 0.5,
      far: 40,
    });
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.bias = -0.00015;
    this.scene.add(this.sun);
    this.people = new Map();
    this.stockGroups = new Map();
    this.priceLabels = new Map();
    this.shelfRoots = new Map();
    this.picks = [];
    this.labels = [];
    this.boxes = new Map();
    this.popObjects = new Map();
    this.decorations = new Map();
    this.ray = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.rotation = 0;
    this.build();
    this.expansionLevel = 0;
    this.extension = new THREE.Group();
    this.scene.add(this.extension);
    this.grid = new THREE.GridHelper(36, 72, '#73977c', '#b4c5a7');
    this.grid.position.set(12, 0.052, 0);
    this.grid.visible = false;
    this.scene.add(this.grid);
    this.selection = new THREE.Mesh(
      new THREE.RingGeometry(0.39, 0.46, 48),
      new THREE.MeshBasicMaterial({
        color: '#e6b863',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      }),
    );
    this.selection.rotation.x = -Math.PI / 2;
    this.selection.position.y = 0.04;
    this.selection.visible = false;
    this.scene.add(this.selection);
    this.ghost = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.8),
      new THREE.MeshBasicMaterial({ color: '#78ab91', transparent: true, opacity: 0.45 }),
    );
    this.ghost.visible = false;
    this.scene.add(this.ghost);
    this.bind();
    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
  }
  build() {
    const s = this.scene;
    box(s, 13.1, 0.48, 9.8, '#d0bfa3', 0, -0.35, 0.15, 0.13);
    box(s, 12.2, 0.16, 8.2, '#eae5d6', 0, -0.06, 0, 0.04);
    for (let x = -5.5; x <= 5.5; x++)
      for (let z = -3.5; z <= 3.5; z++)
        box(
          s,
          0.985,
          0.015,
          0.985,
          Math.floor(x + z) % 2 === 0 ? '#eae9dd' : '#e2e4d8',
          x,
          0.027,
          z,
          0.005,
        );
    box(s, 12.7, 0.12, 2, '#b6bcae', 0, -0.16, 5.1, 0.04);
    for (let x = -6; x < 7; x += 1) box(s, 0.015, 0.012, 1.65, '#a2ac9e', x, -0.092, 5.15, 0.001);
    box(s, 15, 0.06, 1.3, '#d3d6cc', 0, -0.29, 6.7, 0.01);
    this.backWall = new THREE.Group();
    s.add(this.backWall);
    box(this.backWall, 12.2, 3.1, 0.16, '#f4f0e1', 0, 1.53, -4);
    box(this.backWall, 12.2, 0.19, 0.21, '#81a491', 0, 0.14, -3.97);
    box(this.backWall, 12.2, 0.075, 0.21, '#e0cda9', 0, 2.95, -3.97);
    this.leftWall = new THREE.Group();
    s.add(this.leftWall);
    box(this.leftWall, 0.16, 3.1, 8, '#e8eadc', -6.02, 1.53, 0);
    box(this.leftWall, 0.21, 0.18, 8, '#81a491', -5.99, 0.14, 0);
    // The front facade is intentionally cut away, leaving a readable miniature storefront.
    for (const x of [-5.9, 5.9]) {
      const wall = box(s, 0.18, 0.85, 8, '#abc2ae', x, 0.42, 0, 0.02);
      if (x > 0) this.rightWall = wall;
    }
    box(s, 3.9, 0.5, 0.2, '#91ac98', -3.95, 0.26, 4);
    box(s, 2.9, 0.5, 0.2, '#91ac98', 4.45, 0.26, 4);
    for (const x of [0.38, 2.62]) box(s, 0.12, 2.45, 0.14, '#5e8f7b', x, 1.23, 4, 0.015);
    box(s, 2.36, 0.28, 0.2, '#49755f', 1.5, 2.55, 4);
    label(s, '생존약국', 2.12, 0.22, 1.5, 2.55, 4.108, { bg: '#49755f', fg: '#fff9e7', size: 68 });
    this.doors = [];
    const glass = new THREE.MeshPhysicalMaterial({
      color: '#cbe5dc',
      transparent: true,
      opacity: 0.23,
      roughness: 0.1,
      metalness: 0.05,
      depthWrite: false,
    });
    for (const side of [-1, 1]) {
      const g = new THREE.Group();
      s.add(g);
      g.position.set(1.5 + side * 0.54, 1.1, 4);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(1.04, 2.05, 0.04), glass);
      g.add(pane);
      box(g, 1.04, 0.035, 0.06, '#7ba18b', 0, 1.02, 0, 0.005);
      box(g, 1.04, 0.035, 0.06, '#7ba18b', 0, -1.02, 0, 0.005);
      box(g, 0.035, 2.05, 0.06, '#7ba18b', side * 0.51, 0, 0, 0.005);
      box(g, 0.025, 0.28, 0.07, '#f9f6df', -side * 0.38, -0.02, 0.02, 0.004);
      g.userData.side = side;
      this.doors.push(g);
    }
    box(s, 4.8, 0.98, 0.9, '#adbea8', -2.4, 0.51, -0.85, 0.075);
    for (let x = -4.6; x < -0.2; x += 0.28)
      box(s, 0.035, 0.77, 0.02, '#99ae95', x, 0.5, -0.387, 0.006);
    box(s, 5.02, 0.13, 1.1, '#e2bf89', -2.4, 1.04, -0.85, 0.045);
    box(s, 4.93, 0.035, 1.03, '#f4ddb7', -2.4, 1.122, -0.85, 0.01);
    label(s, 'PRESCRIPTION  /  처방 접수', 1.8, 0.19, -3.65, 0.71, -0.385, {
      bg: '#adbea8',
      fg: '#fffdf0',
      size: 43,
    });
    cross(s, 0.37, -1.85, 0.64, -0.375, '#f9f6e7');
    label(s, 'PAY HERE', 0.7, 0.14, -0.62, 0.79, -0.382, {
      bg: '#adbea8',
      fg: '#fffdf0',
      size: 64,
    });
    // POS and dispensing computers, keyboard, receipt printer and countertop details.
    for (const x of [-0.7, -3.65]) {
      box(s, 0.46, 0.035, 0.34, '#415e50', x, 1.15, -0.78);
      box(s, 0.065, 0.27, 0.065, '#607b69', x, 1.29, -0.98);
      const monitor = box(s, 0.52, 0.35, 0.055, '#455e51', x, 1.51, -0.98, 0.025);
      label(s, x === -0.7 ? '₩ 3,500' : 'Rx · 생존', 0.44, 0.26, x, 1.51, -0.946, {
        bg: '#d4e2cd',
        fg: '#446c56',
        size: 66,
      });
      box(s, 0.32, 0.025, 0.12, '#efece0', x, 1.15, -0.54, 0.01);
      for (let i = 0; i < 6; i++)
        box(s, 0.027, 0.009, 0.07, '#c0c9b9', x - 0.12 + i * 0.045, 1.167, -0.54, 0.003);
    }
    box(s, 0.32, 0.23, 0.3, '#f5f2e7', -2.8, 1.23, -0.84);
    box(s, 0.24, 0.024, 0.12, '#666f60', -2.8, 1.32, -0.68);
    box(s, 0.2, 0.015, 0.22, '#fffdf0', -2.8, 1.3, -0.58);
    cyl(s, 0.065, 0.06, 0.17, '#e3bd83', -4.5, 1.23, -0.8);
    for (let i = 0; i < 3; i++) cyl(s, 0.009, 0.009, 0.23, '#567b6b', -4.54 + i * 0.03, 1.38, -0.8);
    box(s, 4.4, 0.9, 0.7, '#d4dccb', -3.4, 0.48, -3.6);
    box(s, 4.55, 0.1, 0.84, '#f6ead4', -3.4, 0.98, -3.6);
    for (let x = -5.3; x < -1.4; x += 0.55) {
      box(s, 0.51, 0.7, 0.02, '#e6eadd', x, 0.49, -3.235, 0.012);
      box(s, 0.16, 0.025, 0.03, '#9eaf99', x, 0.7, -3.21, 0.005);
    }
    box(s, 4.4, 1.25, 0.24, '#cad6c0', -3.4, 1.95, -3.76);
    for (let x = -5.3; x < -1.4; x += 0.46)
      for (let y = 1.5; y < 2.6; y += 0.35) {
        box(s, 0.41, 0.29, 0.18, '#f4f0df', x, y, -3.62, 0.015);
        box(s, 0.11, 0.017, 0.012, '#b4bfa8', x, y - 0.07, -3.52, 0.003);
      }
    label(s, '조 제 실', 1.1, 0.24, -2.9, 2.81, -3.9, { bg: '#f4f0e1', fg: '#66866c', size: 95 });
    box(s, 0.55, 0.06, 0.4, '#a6bbad', -2.3, 1.06, -3.55);
    for (let i = 0; i < 7; i++) sphere(s, 0.028, '#fdf9ed', -2.5 + i * 0.055, 1.11, -3.5);
    cyl(s, 0.12, 0.085, 0.12, '#ece9da', -1.7, 1.09, -3.58);
    const pestle = cyl(s, 0.025, 0.04, 0.25, '#d6d2c0', -1.7, 1.24, -3.58);
    pestle.rotation.z = 0.6;
    for (let i = 0; i < 3; i++) {
      box(s, 1.14, 1.8, 0.55, '#dfcfb2', 2.1 + i * 1.2, 0.93, -3.67);
      for (let y = 0.25; y < 1.9; y += 0.52) {
        box(s, 1.08, 0.055, 0.64, '#f5edd8', 2.1 + i * 1.2, y, -3.65);
        for (let j = 0; j < 3; j++) parcel(s, 1.78 + i * 1.2 + j * 0.32, y + 0.03, -3.56, 0.47);
      }
    }
    label(s, 'STOCK ROOM', 2, 0.24, 3.3, 2.19, -3.9, { bg: '#f4f0e1', fg: '#84957c', size: 80 });
    for (let i = 0; i < ZONES.length; i++) {
      const z = ZONES[i],
        root = new THREE.Group();
      s.add(root);
      this.shelfRoots.set(i, root);
      const g = shelf(root, 0, 0, z.label, z.color);
      const pick = box(g, 2.15, 1.8, 0.75, z.color, 0, 0.9, 0);
      pick.visible = false;
      pick.userData.select = { type: 'shelf', zone: i };
      this.picks.push(pick);
    }
    for (const p of PRODUCTS) {
      const z = { x: 0, z: 0 };
      const g = new THREE.Group();
      g.position.set(z.x - 0.79 + p.slot * 0.39, 0, z.z + 0.09);
      this.shelfRoots.get(p.zone).add(g);
      // Slot models are allocated once, then shown/hidden with physical inventory.
      for (let i = 0; i < p.capacity; i++) {
        const model = productModel(p, 0.88);
        model.position.set(
          (i % 2) * 0.18 - 0.09,
          0.205 + Math.floor(i / 4) * 0.47,
          (Math.floor(i / 2) % 2) * -0.22 + 0.12,
        );
        g.add(model);
      }
      this.stockGroups.set(p.id, { group: g, count: -1 });
      const priceLabel = label(
        this.shelfRoots.get(p.zone),
        `₩${p.price.toLocaleString()}`,
        0.33,
        0.08,
        z.x - 0.79 + p.slot * 0.39,
        0.565,
        z.z + 0.377,
        { bg: '#faf5e8', fg: '#73816c', size: 90 },
      );
      this.priceLabels.set(p.id, { mesh: priceLabel, price: p.price });
    }
    // Waiting seats and the tiny everyday objects that make a pharmacy feel lived in.
    for (let i = 0; i < 3; i++) {
      const x = -5.35 + i * 0.73;
      box(s, 0.61, 0.13, 0.55, '#c9a77a', x, 0.48, 3.18, 0.055);
      box(s, 0.61, 0.48, 0.1, '#97af96', x, 0.81, 3.44, 0.05);
      for (const dx of [-0.22, 0.22])
        for (const dz of [-0.18, 0.18])
          cyl(s, 0.025, 0.025, 0.44, '#737f6b', x + dx, 0.23, 3.18 + dz);
    }
    plant(s, -5.4, -2.3, 1.3);
    plant(s, 5.1, 3.1, 1.4);
    plant(s, -5.1, 4.85, 1.1);
    plant(s, 4.6, 5, 1.2);
    box(s, 1.3, 0.04, 0.75, '#d3b995', 1.5, 0.06, 3.2, 0.035);
    label(s, 'WELCOME', 0.9, 0.23, 1.5, 0.086, 3.16, {
      bg: '#d3b995',
      fg: '#8c775b',
      size: 86,
    }).rotation.x = -Math.PI / 2;
    box(s, 1.55, 0.88, 0.1, '#465e50', 0.5, 2.2, -3.88, 0.045);
    label(s, 'LOCAL NEWS', 1.36, 0.63, 0.5, 2.2, -3.817, {
      bg: '#a4c0b3',
      fg: '#f7f4df',
      size: 60,
    });
    label(s, '우리 동네 소식', 1.2, 0.15, 0.5, 2, -3.8, { bg: '#a4c0b3', fg: '#315c50', size: 66 });
    this.newsDay = -1;
    for (const root of this.shelfRoots.values()) contactShadow(root, 2.8, 1.4, 0, 0, 0.3);
    contactShadow(s, 5.5, 1.8, -2.4, -0.85, 0.28);
    const clock = new THREE.Group();
    clock.position.set(-5.1, 2.73, -3.86);
    s.add(clock);
    const face = cyl(clock, 0.22, 0.22, 0.045, '#d0b68b');
    face.rotation.x = Math.PI / 2;
    const disc = cyl(clock, 0.192, 0.192, 0.048, '#fffbed');
    disc.rotation.x = Math.PI / 2;
    this.hourHand = box(clock, 0.018, 0.1, 0.018, '#60755e', 0, 0.04, 0.035, 0.004);
    this.minuteHand = box(clock, 0.012, 0.15, 0.018, '#60755e', 0, 0.065, 0.04, 0.003);
    // Exterior street placard.
    const sign = new THREE.Group();
    s.add(sign);
    sign.position.set(-0.3, 0, 4.9);
    box(sign, 0.68, 0.78, 0.075, '#4e7a63', 0, 0.66, 0, 0.025);
    label(sign, 'OPEN', 0.58, 0.22, 0, 0.78, 0.042, { bg: '#4e7a63', fg: '#faf4df', size: 100 });
    label(sign, '생존약국', 0.58, 0.16, 0, 0.51, 0.042, { bg: '#4e7a63', fg: '#faf4df', size: 90 });
    for (const x of [-0.27, 0.27]) box(sign, 0.055, 0.45, 0.07, '#b6976e', x, 0.22, 0, 0.012);
    // Ground contact shadow below the diorama.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ color: '#64735b', opacity: 0.17 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.63;
    ground.receiveShadow = true;
    s.add(ground);
  }
  bind() {
    let start;
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', (e) => (start = { x: e.clientX, y: e.clientY }));
    el.addEventListener('pointermove', (e) => {
      if (!this.placing) return;
      const p = this.groundPoint(e);
      if (p) {
        this.previewPoint = p;
        if (!this.lastPreviewTime || performance.now() - this.lastPreviewTime > 55) {
          this.updatePreview();
          this.lastPreviewTime = performance.now();
        }
      }
    });
    el.addEventListener('click', (e) => {
      if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) return;
      if (this.placing) {
        const p = this.groundPoint(e);
        if (p) this.onSelect({ type: 'place', x: p.x, z: p.z });
        return;
      }
      this.pointerFromEvent(e);
      const hits = this.ray.intersectObjects(
        [...this.picks, ...this.people.values(), ...this.decorations.values()],
        true,
      );
      for (const hit of hits) {
        let o = hit.object;
        while (o && !o.userData.select) o = o.parent;
        if (o?.userData.select) {
          this.selected = o.userData.select;
          this.onSelect(this.selected);
          return;
        }
      }
      this.selected = null;
      this.onSelect(null);
    });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  setPlacement(placement) {
    this.placing = placement;
    this.previewPoint = null;
    this.ghost.visible = false;
  }
  updatePreview() {
    if (!this.placing || !this.previewPoint) return;
    const p = this.placing,
      d = dimensions(p.kind, p.rotation),
      point = this.previewPoint;
    const x = Math.round(point.x * 2) / 2,
      z = Math.round(point.z * 2) / 2;
    const verdict = this.game.previewPlacement({ ...p, x, z });
    this.ghost.visible = true;
    this.ghost.scale.set(d.w / 0.8, 1, d.d / 0.8);
    this.ghost.position.set(x, 0.3, z);
    this.ghost.material.color.set(verdict.ok ? '#70ba8b' : '#d97767');
    const status = document.querySelector('#placement-status');
    if (status) {
      status.textContent = verdict.message;
      status.dataset.valid = verdict.ok;
    }
  }
  rotatePlacement() {
    if (!this.placing) return;
    this.placing.rotation = (this.placing.rotation + 1) % 4;
    this.updatePreview();
  }
  rebuildExpansion() {
    const level = this.game.s.level,
      right = this.game.building.right;
    for (const child of [...this.extension.children]) disposeModel(child);
    this.rightWall.position.x = right - 0.1;
    this.extensionBack = new THREE.Group();
    this.extension.add(this.extensionBack);
    if (level > 1) {
      const width = right - 6,
        center = 6 + width / 2;
      box(this.extension, width, 0.48, 9.8, '#d0bfa3', center, -0.35, 0.15, 0.08);
      box(this.extension, width, 0.16, 8.2, '#eae5d6', center, -0.06, 0, 0.025);
      for (let x = 6.5; x < right; x++)
        for (let z = -3.5; z <= 3.5; z++)
          box(
            this.extension,
            0.985,
            0.015,
            0.985,
            Math.floor(x + z) % 2 === 0 ? '#eae9dd' : '#e2e4d8',
            x,
            0.027,
            z,
            0.005,
          );
      box(this.extensionBack, width, 3.1, 0.16, '#f4f0e1', center, 1.53, -4);
      box(this.extensionBack, width, 0.19, 0.21, '#81a491', center, 0.14, -3.97);
      box(this.extensionBack, width, 0.075, 0.21, '#e0cda9', center, 2.95, -3.97);
      box(this.extension, width, 0.5, 0.2, '#91ac98', center, 0.26, 4);
      box(this.extension, width, 0.12, 2, '#b6bcae', center, -0.16, 5.1, 0.04);
      for (let x = 6; x < right; x++)
        box(this.extension, 0.015, 0.012, 1.65, '#a2ac9e', x, -0.092, 5.15, 0.001);
      for (let x = 8.8; x < right - 1; x += 6) {
        box(this.extensionBack, 3.2, 1.3, 0.065, '#d4c8a9', x, 1.85, -3.87, 0.025);
        box(this.extensionBack, 3.01, 1.13, 0.03, '#c6ddd2', x, 1.85, -3.825, 0.02);
        box(this.extensionBack, 0.055, 1.15, 0.035, '#fcf7e8', x, 1.85, -3.798, 0.005);
        label(this.extensionBack, 'GROWING TOGETHER', 2, 0.16, x, 2.73, -3.86, {
          bg: '#f4f0e1',
          fg: '#8d9d80',
          size: 46,
        });
      }
    }
    const vertices = [];
    for (let x = -6; x <= right; x += 0.5) vertices.push(x, 0, -4, x, 0, 4);
    for (let z = -4; z <= 4; z += 0.5) vertices.push(-6, 0, z, right, 0, z);
    this.grid.geometry.dispose();
    this.grid.geometry = new THREE.BufferGeometry();
    this.grid.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.grid.position.set(0, 0.052, 0);
    this.grid.material.dispose();
    this.grid.material = new THREE.LineBasicMaterial({
      color: '#86a787',
      transparent: true,
      opacity: 0.45,
    });
    this.expansionLevel = level;
    this.home();
  }
  pointerFromEvent(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
  }
  groundPoint(e) {
    this.pointerFromEvent(e);
    return this.ray.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Vector3(),
    );
  }
  resize() {
    const w = this.container.clientWidth,
      h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    const span = 8.3;
    this.camera.left = (-span * w) / h;
    this.camera.right = (span * w) / h;
    this.camera.top = span;
    this.camera.bottom = -span;
    this.camera.updateProjectionMatrix();
  }
  rotate(dir) {
    this.rotation += (dir * Math.PI) / 2;
    const radius = 22;
    this.camera.position.set(
      this.controls.target.x + Math.sin(0.63 + this.rotation) * radius,
      14,
      this.controls.target.z + Math.cos(0.63 + this.rotation) * radius,
    );
    this.controls.update();
  }
  zoom(delta) {
    this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom + delta, 0.35, 1.9);
    this.camera.updateProjectionMatrix();
  }
  home() {
    this.rotation = 0;
    const center = (this.game.building.right - 6) / 2;
    this.camera.position.set(center + 13, 14, 18);
    this.controls.target.set(center, 0.2, 0.9);
    this.camera.zoom = Math.min(1, 14 / (this.game.building.right + 6));
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }
  update(time) {
    const s = this.game.s;
    if (this.expansionLevel !== s.level) this.rebuildExpansion();
    this.grid.visible = !!this.editing;
    for (const shelf of s.layout.shelves) {
      const root = this.shelfRoots.get(shelf.zone);
      root.position.set(shelf.x, 0, shelf.z);
      root.rotation.y = (shelf.rotation * Math.PI) / 2;
    }
    const all = [...s.staff, ...s.customers],
      ids = new Set(all.map((c) => c.id));
    for (const [id, g] of this.people) {
      if (!ids.has(id)) {
        disposeModel(g);
        this.people.delete(id);
      }
    }
    for (const e of all) {
      let g = this.people.get(e.id);
      if (!g) {
        g = character(e.appearance ?? (e.id === 'player' ? 7 : 25), !!e.role, e.role);
        g.scale.setScalar(1.08);
        g.userData.select = { type: e.role ? 'staff' : 'customer', id: e.id };
        this.scene.add(g);
        this.people.set(e.id, g);
      }
      const t = s.tasks.find((t) => t.id === e.task);
      const carry = !!(t && ['delivery', 'restock'].includes(t.type) && t.step > 0);
      animateCharacter(g, { ...e, carry }, s.elapsed);
    }
    for (const p of PRODUCTS) {
      const entry = this.stockGroups.get(p.id),
        count = s.inventory[p.id].shelf;
      const price = this.priceLabels.get(p.id);
      if (price.price !== s.prices[p.id]) {
        const z = { x: 0, z: 0 };
        disposeModel(price.mesh);
        price.mesh = label(
          this.shelfRoots.get(p.zone),
          `₩${s.prices[p.id].toLocaleString()}`,
          0.33,
          0.08,
          z.x - 0.79 + p.slot * 0.39,
          0.565,
          z.z + 0.377,
          { bg: '#faf5e8', fg: '#73816c', size: 90 },
        );
        price.price = s.prices[p.id];
      }
      if (entry.count !== count) {
        entry.group.children.forEach((model, index) => (model.visible = index < count));
        entry.count = count;
      }
    }
    for (const o of s.orders) {
      if (o.status === 'arrived' && !this.boxes.has(o.id)) {
        const g = parcel(this.scene, 4.8, 0, 2.4 - this.boxes.size * 0.52);
        this.boxes.set(o.id, g);
      }
      if (o.status !== 'arrived' && this.boxes.has(o.id)) {
        disposeModel(this.boxes.get(o.id));
        this.boxes.delete(o.id);
      }
    }
    for (const [id, g] of this.boxes)
      if (!s.orders.some((o) => o.id === id && o.status === 'arrived')) {
        this.scene.remove(g);
        this.boxes.delete(id);
      }
    for (const id of s.pop)
      if (!this.popObjects.has(id)) {
        const def = POPS.find((p) => p.id === id),
          g = new THREE.Group(),
          i = this.popObjects.size;
        g.position.set(-3.8 + i * 0.49, 1.18, -0.52);
        this.scene.add(g);
        box(g, 0.44, 0.3, 0.04, '#ebbc73', 0, 0.2, 0, 0.018);
        label(g, def.text, 0.41, 0.23, 0, 0.2, 0.025, { bg: '#f7d99b', fg: '#715c38', size: 96 });
        cyl(g, 0.015, 0.015, 0.12, '#887759', 0, 0.025, 0);
        this.popObjects.set(id, g);
      }
    for (const [id, g] of this.popObjects)
      if (!s.pop.includes(id)) {
        this.scene.remove(g);
        this.popObjects.delete(id);
      }
    for (const p of s.placements) {
      if (!this.decorations.has(p.id)) {
        const g = furnitureModel(p.kind);
        g.userData.select = { type: 'furniture', id: p.id };
        this.scene.add(g);
        this.decorations.set(p.id, g);
      }
      const g = this.decorations.get(p.id);
      g.position.set(p.x, 0, p.z);
      g.rotation.y = (p.rotation * Math.PI) / 2;
    }
    for (const [id, g] of this.decorations)
      if (!s.placements.some((p) => p.id === id)) {
        disposeModel(g);
        this.decorations.delete(id);
      }
    const doorOpen = s.customers.some((c) => Math.abs(c.z - 4) < 1.3 && Math.abs(c.x - 1.5) < 1.2);
    if (this.newsDay !== s.newsIndex) {
      if (this.tvHeadline) disposeModel(this.tvHeadline);
      this.tvHeadline = label(this.scene, NEWS[s.newsIndex], 1.29, 0.13, 0.5, 2.12, -3.799, {
        bg: '#a4c0b3',
        fg: '#355e50',
        size: 25,
      });
      this.newsDay = s.newsIndex;
    }
    for (const d of this.doors) {
      const target = 1.5 + d.userData.side * (doorOpen ? 1.45 : 0.54);
      d.position.x = THREE.MathUtils.lerp(d.position.x, target, 0.12);
    }
    const evening = THREE.MathUtils.clamp((s.time - 900) / 180, 0, 1);
    this.sun.color.set(evening ? '#ffd1a1' : '#fff2d3');
    this.sun.intensity = 2.5 - evening * 1.1;
    this.backWall.visible = this.camera.position.z > 0;
    this.extensionBack.visible = this.backWall.visible;
    this.leftWall.visible = this.camera.position.x > 0;
    this.hourHand.rotation.z = (-s.time / 720) * Math.PI * 2;
    this.minuteHand.rotation.z = (-s.time / 60) * Math.PI * 2;
    this.selection.visible = false;
    if (this.selected) {
      const e = all.find((e) => e.id === this.selected.id);
      const z =
        this.selected.type === 'furniture'
          ? s.placements.find((p) => p.id === this.selected.id)
          : s.layout.shelves.find((p) => p.zone === this.selected.zone);
      if (e || z) {
        this.selection.visible = true;
        this.selection.position.set((e || z).x, 0.045, (e || z).z);
        this.selection.scale.setScalar(e ? 1 : 2.4);
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  project(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(this.camera),
      r = this.container.getBoundingClientRect();
    return {
      x: r.left + ((v.x + 1) / 2) * r.width,
      y: r.top + ((1 - v.y) / 2) * r.height,
      visible: v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1,
    };
  }
}
