import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";

const canvas = document.querySelector("#mars-canvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.z = 3.25;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.AmbientLight(0x9b8172, 0.65));

const sunlight = new THREE.DirectionalLight(0xffe7d0, 2.2);
sunlight.position.set(-4, 2, 5);
scene.add(sunlight);

const texture = await new THREE.TextureLoader().loadAsync("assets/mars-texture.webp");
texture.colorSpace = THREE.SRGBColorSpace;

const mars = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({ map: texture, roughness: 1 })
);
scene.add(mars);

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resize).observe(canvas);
resize();

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  mars.rotation.y += Math.min(clock.getDelta(), 0.05) * 0.08;
  renderer.render(scene, camera);
}

animate();
