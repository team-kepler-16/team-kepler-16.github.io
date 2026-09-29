import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";

const canvas = document.querySelector("#mars-canvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.z = 3.25;
camera.zoom = 0.9;
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.AmbientLight(0x9b8172, 0.65));

const sunlight = new THREE.DirectionalLight(0xffe7d0, 2.2);
sunlight.position.set(-4, 2, 5);
scene.add(sunlight);

const texture = await new THREE.TextureLoader().loadAsync("assets/mars-texture-cartoon.png");
texture.colorSpace = THREE.SRGBColorSpace;

const mars = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({ map: texture, roughness: 1 })
);
scene.add(mars);

const minCameraZoom = 0.1;
const maxCameraZoom = 10000;
const dragRotationSpeed = 0.008;

function updateCameraFraming() {
  const height = canvas.clientHeight;
  const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
  const targetY = height
    ? camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * headerHeight / (height * camera.zoom)
    : 0;

  camera.position.set(0, targetY, camera.position.z);
  camera.lookAt(0, targetY, 0);
}

function zoomTo(zoom) {
  camera.zoom = THREE.MathUtils.clamp(zoom, minCameraZoom, maxCameraZoom);
  camera.updateProjectionMatrix();
  updateCameraFraming();
}

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  zoomTo(camera.zoom * Math.exp(-event.deltaY * 0.001));
}, { passive: false });

const activeTouches = new Map();
let previousPinchDistance = null;
let isDragging = false;
let previousPointerX = null;

function getPinchDistance() {
  const points = [...activeTouches.values()];
  if (points.length !== 2) return null;

  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

canvas.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse") {
    if (event.button !== 0) return;
    isDragging = true;
    previousPointerX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
    return;
  }

  if (event.pointerType !== "touch") return;

  activeTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
  canvas.setPointerCapture(event.pointerId);
  previousPinchDistance = getPinchDistance();
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerType === "mouse" && isDragging) {
    mars.rotation.y += (event.clientX - previousPointerX) * dragRotationSpeed;
    previousPointerX = event.clientX;
    return;
  }

  if (!activeTouches.has(event.pointerId)) return;

  const previousTouch = activeTouches.get(event.pointerId);
  activeTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (activeTouches.size === 1) {
    mars.rotation.y += (event.clientX - previousTouch.x) * dragRotationSpeed;
    previousPinchDistance = null;
    return;
  }

  const pinchDistance = getPinchDistance();

  if (pinchDistance !== null && previousPinchDistance !== null) {
    zoomTo(camera.zoom * pinchDistance / previousPinchDistance);
  }

  previousPinchDistance = pinchDistance;
});

function endTouch(event) {
  if (event.pointerType === "mouse") {
    isDragging = false;
    previousPointerX = null;
    return;
  }

  if (!activeTouches.delete(event.pointerId)) return;
  previousPinchDistance = getPinchDistance();
}

canvas.addEventListener("pointerup", endTouch);
canvas.addEventListener("pointercancel", endTouch);

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  updateCameraFraming();
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvas);
const header = document.querySelector(".site-header");
if (header) resizeObserver.observe(header);
resize();

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  mars.rotation.y += Math.min(clock.getDelta(), 0.05) * 0.08;
  renderer.render(scene, camera);
}

animate();
