import * as THREE from 'three';

/** Sync stage-space water-droplet uniforms from sim.clickRipple. */
export function syncDropUniforms(mat, sim) {
  if (!mat?.uniforms?.uDropT) return false;
  const ripple = sim?.clickRipple;
  const now = performance.now();
  if (!ripple || now >= ripple.until) {
    mat.uniforms.uDropT.value = 0;
    mat.uniforms.uDropAmp.value = 0;
    return false;
  }
  const elapsed = now - (ripple.until - ripple.duration);
  const life = Math.max(0, Math.min(1, elapsed / ripple.duration));
  mat.uniforms.uDropT.value = life;
  mat.uniforms.uDropAmp.value = 1.05;
  if (mat.uniforms.uDropOrigin) {
    mat.uniforms.uDropOrigin.value.set(ripple.originX, ripple.originY);
  }
  if (mat.uniforms.uDropMaxR) {
    mat.uniforms.uDropMaxR.value = ripple.maxR;
  }
  return true;
}

export function dropUniformDefaults() {
  return {
    uDropT: { value: 0 },
    uDropAmp: { value: 0 },
    uDropOrigin: { value: new THREE.Vector2(0, 0) },
    uDropMaxR: { value: 1200 },
  };
}
