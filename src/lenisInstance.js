/** @type {import("lenis").default | null} */
let instance = null;

export function setLenisInstance(l) {
  instance = l;
}

export function getLenisInstance() {
  return instance;
}
