import * as THREE from 'three';

const _t = new THREE.Matrix4();
const _shear = new THREE.Matrix4();
const _lift = new THREE.Matrix4();
const _scale = new THREE.Matrix4();

/**
 * Skew a unit plane with the bottom edge fixed and the top leaning (skewX).
 * Plane local space is ±0.5 before scale; bottom sits at bottomY after transform.
 */
export function applyBottomHingeSkew(mesh, cx, bottomY, width, height, skewDeg, z = 0) {
  if (!mesh) return;
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  mesh.matrixAutoUpdate = false;
  mesh.position.set(0, 0, 0);
  mesh.rotation.set(0, 0, 0);
  mesh.scale.set(1, 1, 1);

  // M = T(cx, bottomY, z) * Shear(yx) * T(0, h/2) * S(w, h, 1)
  mesh.matrix.identity().multiply(_t.makeTranslation(cx, bottomY, z));
  if (Math.abs(skewDeg) >= 0.01) {
    // Negate so drag/scroll right→left leans content to the left.
    const k = -Math.tan(THREE.MathUtils.degToRad(skewDeg));
    mesh.matrix.multiply(_shear.makeShear(0, 0, k, 0, 0, 0));
  }
  mesh.matrix
    .multiply(_lift.makeTranslation(0, h * 0.5, 0))
    .multiply(_scale.makeScale(w, h, 1));
  mesh.matrixWorldNeedsUpdate = true;
}

/**
 * Local-space top lean for DISTORT_VERT curved bend (project cards).
 * World tip offset matches matrix shear: ≈ tan(θ) * height.
 */
export function bendFromSkewDeg(skewDeg, width, height) {
  if (Math.abs(skewDeg) < 0.01) return 0;
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  return -Math.tan(THREE.MathUtils.degToRad(skewDeg)) * (h / w);
}
