import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { batchStaticParts } from '../src/render-batching.js';
test('batching preserves transformed bounds, colors, joints and hidden items', () => {
  const root = new THREE.Group(),
    joint = new THREE.Group();
  root.add(joint);
  const red = new THREE.MeshStandardMaterial({ color: '#ff0000' }),
    blue = new THREE.MeshStandardMaterial({ color: '#0000ff' });
  const a = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), red);
  a.position.x = 2;
  a.rotation.z = 0.3;
  root.add(a);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), blue);
  b.position.x = -1;
  b.scale.y = 2;
  root.add(b);
  const hidden = new THREE.Mesh(new THREE.BoxGeometry(), red);
  hidden.visible = false;
  root.add(hidden);
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), red);
    m.position.x = i * 0.2;
    joint.add(m);
  }
  root.updateMatrixWorld(true);
  const original = new THREE.Box3().setFromObject(root);
  batchStaticParts(root);
  root.updateMatrixWorld(true);
  const after = new THREE.Box3().setFromObject(root);
  assert.ok(original.min.distanceTo(after.min) < 1e-6);
  assert.ok(original.max.distanceTo(after.max) < 1e-6);
  assert.equal(root.children.includes(hidden), true);
  assert.equal(hidden.visible, false);
  assert.equal(root.children.includes(joint), true);
  assert.equal(root.children.filter((x) => x.isMesh && x.visible).length, 1);
  assert.equal(joint.children.length, 1);
  const merged = root.children.find((x) => x.isMesh && x.visible);
  assert.equal(merged.material.vertexColors, true);
  const colors = merged.geometry.getAttribute('color');
  let reds = 0,
    blues = 0;
  for (let i = 0; i < colors.count; i++) {
    reds += colors.getX(i) > 0.9;
    blues += colors.getZ(i) > 0.9;
  }
  assert.ok(reds > 0 && blues > 0);
});
