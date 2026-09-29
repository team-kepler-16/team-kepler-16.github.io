import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";
import { attachGlobeControls } from "./mars/globe-controls.js";
import { createMarkerField } from "./mars/marker-field.js";

const canvas = document.querySelector("#mars-canvas");
if (!canvas) throw new Error("The Mars canvas could not be found.");

const header = document.querySelector(".site-header");
const scene = new THREE.Scene();
const camera = createCamera(THREE);
const renderer = createRenderer(THREE, canvas);

addLighting(THREE, scene);
const mars = await createMars(THREE);
scene.add(mars);

const pointButtons = [...document.querySelectorAll(".point-button[data-marker-index]")];
const pointWindow = document.querySelector("#point-window");
const pointWindowCard = pointWindow.querySelector(".point-window-card");
const pointWindowNumber = document.querySelector("#point-window-number");
const pointWindowClose = document.querySelector("#point-window-close");
let controls;

function openPointWindow(index) {
  pointWindow.classList.remove("is-closing");
  pointWindowClose.disabled = false;
  pointWindowNumber.textContent = String(index + 1);
  pointWindow.hidden = false;
  pointWindow.setAttribute("aria-hidden", "false");
  pointWindowClose.focus({ preventScroll: true });
}

function closePointWindow() {
  if (pointWindow.hidden || pointWindow.classList.contains("is-closing")) return;
  pointWindow.classList.add("is-closing");
  pointWindowClose.disabled = true;
}

function finishClosingPointWindow(event) {
  if (event.target !== pointWindowCard || event.animationName !== "point-window-split-out") return;
  pointWindow.hidden = true;
  pointWindow.classList.remove("is-closing");
  pointWindow.setAttribute("aria-hidden", "true");
  pointWindowClose.disabled = false;
  controls.unlockPoint();
}

const markerField = createMarkerField({
  THREE,
  mars,
  scene,
  camera,
  canvas,
  onHoveredMarkerChange(index) {
    pointButtons.forEach((button) => {
      const isHovered = Number(button.dataset.markerIndex) === index;
      button.setAttribute("aria-pressed", String(isHovered));
    });
  }
});
controls = attachGlobeControls({
  THREE,
  canvas,
  camera,
  mars,
  markerField,
  pointButtons,
  onMarkerActivate: openPointWindow,
  updateFraming: () => updateCameraFraming(THREE, camera, canvas, header)
});

pointWindowClose.addEventListener("click", closePointWindow);
pointWindow.addEventListener("animationend", finishClosingPointWindow);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !pointWindow.hidden) closePointWindow();
});

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const clock = new THREE.Clock();

function resize() {
  const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
  document.documentElement.style.setProperty("--point-window-top", `${Math.ceil(headerBottom + 12)}px`);

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  updateCameraFraming(THREE, camera, canvas, header);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const motionAllowed = !motionPreference.matches;
  controls.update(delta, motionAllowed);

  if (motionAllowed && !controls.isPointLocked && !controls.isDragging && markerField.hoveredMarkerIndex < 0) {
    mars.rotation.y += delta * 0.08;
  }

  markerField.updatePulses(clock.elapsedTime, motionAllowed);
  renderer.render(scene, camera);
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvas);
if (header) resizeObserver.observe(header);
resize();
animate();

function createCamera(THREE) {
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 3.25;
  camera.zoom = 0.9;
  camera.updateProjectionMatrix();
  return camera;
}

function createRenderer(THREE, canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

function addLighting(THREE, scene) {
  scene.add(new THREE.AmbientLight(0x9b8172, 0.65));

  const sunlight = new THREE.DirectionalLight(0xffe7d0, 2.2);
  sunlight.position.set(-4, 2, 5);
  scene.add(sunlight);
}

async function createMars(THREE) {
  const texture = await new THREE.TextureLoader().loadAsync("assets/mars-texture-cartoon.png");
  texture.colorSpace = THREE.SRGBColorSpace;

  return new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 1 })
  );
}

function updateCameraFraming(THREE, camera, canvas, header) {
  const height = canvas.clientHeight;
  const headerHeight = header?.getBoundingClientRect().height ?? 0;
  const targetY = height
    ? camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      * headerHeight / (height * camera.zoom)
    : 0;

  camera.position.set(0, targetY, camera.position.z);
  camera.lookAt(0, targetY, 0);
}
