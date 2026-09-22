import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });

// Only rigid direct children are merged: groups remain animation joints.
export function batchStaticParts(group) {
  for (const child of [...group.children]) if (child.isGroup) batchStaticParts(child);
  const meshes = group.children.filter(
    (m) =>
      m.isMesh &&
      m.visible &&
      !Array.isArray(m.material) &&
      m.material.isMeshStandardMaterial &&
      !m.material.map &&
      !m.material.transparent,
  );
  if (meshes.length < 2) return;
  const geometries = meshes.map((mesh) => {
    mesh.updateMatrix();
    const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrix);
    for (const name of Object.keys(geo.attributes))
      if (!['position', 'normal'].includes(name)) geo.deleteAttribute(name);
    const count = geo.getAttribute('position').count,
      color = mesh.material.color,
      colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.clearGroups();
    return geo;
  });
  const geometry = mergeGeometries(geometries, false);
  for (const geo of geometries) geo.dispose();
  if (!geometry) throw new Error('캐릭터 부품 병합 실패');
  const merged = new THREE.Mesh(geometry, material);
  merged.castShadow = meshes.some((m) => m.castShadow);
  merged.receiveShadow = meshes.some((m) => m.receiveShadow);
  for (const mesh of meshes) {
    mesh.geometry.dispose();
    mesh.removeFromParent();
  }
  group.add(merged);
}
