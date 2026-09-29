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

const markerTargets = [];
const markerOutlines = [];
const markerDiscs = [];
const markerHalos = [];
let hoveredMarkerIndex = -1;
const markerTargetGeometry = new THREE.SphereGeometry(0.055, 8, 8);
const markerTargetMaterial = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  colorWrite: false,
  depthWrite: false
});
const pulses = [];
const pulseDuration = 2.8;
const pulsePairOffset = 0.58;
const pulseSegments = 40;
const pulseSurfaceRadius = 1.002;
const markerSurfaceRadius = 1.0025;
const markerMaterial = new THREE.MeshBasicMaterial({
  color: 0x7dd3fc,
  transparent: true,
  opacity: 0.92,
  side: THREE.DoubleSide,
  depthWrite: false
});
const haloCanvas = document.createElement("canvas");
haloCanvas.width = 64;
haloCanvas.height = 64;
const haloContext = haloCanvas.getContext("2d");
const haloGradient = haloContext.createRadialGradient(32, 32, 0, 32, 32, 32);
haloGradient.addColorStop(0, "rgba(125, 211, 252, 0.3)");
haloGradient.addColorStop(0.28, "rgba(125, 211, 252, 0.2)");
haloGradient.addColorStop(0.64, "rgba(125, 211, 252, 0.07)");
haloGradient.addColorStop(1, "rgba(125, 211, 252, 0)");
haloContext.fillStyle = haloGradient;
haloContext.fillRect(0, 0, haloCanvas.width, haloCanvas.height);
const haloTexture = new THREE.CanvasTexture(haloCanvas);
haloTexture.colorSpace = THREE.SRGBColorSpace;
const haloMaterial = new THREE.MeshBasicMaterial({
  map: haloTexture,
  transparent: true,
  opacity: 0.82,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

function createSurfaceDisc(normal, radius, material) {
  const referenceAxis = Math.abs(normal.y) < 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(referenceAxis, normal).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  const positions = new Float32Array((pulseSegments + 1) * 3);
  const uvs = new Float32Array((pulseSegments + 1) * 2);
  const indices = [];
  positions[0] = normal.x * markerSurfaceRadius;
  positions[1] = normal.y * markerSurfaceRadius;
  positions[2] = normal.z * markerSurfaceRadius;
  uvs[0] = 0.5;
  uvs[1] = 0.5;

  for (let segment = 0; segment < pulseSegments; segment += 1) {
    const theta = (segment / pulseSegments) * Math.PI * 2;
    const tangentX = tangent.x * Math.cos(theta) + bitangent.x * Math.sin(theta);
    const tangentY = tangent.y * Math.cos(theta) + bitangent.y * Math.sin(theta);
    const tangentZ = tangent.z * Math.cos(theta) + bitangent.z * Math.sin(theta);
    const offset = (segment + 1) * 3;
    const normalScale = markerSurfaceRadius * Math.cos(radius);
    const tangentScale = markerSurfaceRadius * Math.sin(radius);
    positions[offset] = normal.x * normalScale + tangentX * tangentScale;
    positions[offset + 1] = normal.y * normalScale + tangentY * tangentScale;
    positions[offset + 2] = normal.z * normalScale + tangentZ * tangentScale;
    uvs[(segment + 1) * 2] = 0.5 + Math.cos(theta) * 0.5;
    uvs[(segment + 1) * 2 + 1] = 0.5 + Math.sin(theta) * 0.5;

    const nextVertex = ((segment + 1) % pulseSegments) + 1;
    indices.push(0, segment + 1, nextVertex);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const disc = new THREE.Mesh(geometry, material);
  disc.frustumCulled = false;
  mars.add(disc);
  return disc;
}

function createPulse(normal, phase) {
  const positions = new Float32Array(pulseSegments * 2 * 3);
  const indices = [];

  for (let segment = 0; segment < pulseSegments; segment += 1) {
    const nextSegment = (segment + 1) % pulseSegments;
    const inner = segment * 2;
    const outer = inner + 1;
    const nextInner = nextSegment * 2;
    const nextOuter = nextInner + 1;
    indices.push(inner, outer, nextInner, outer, nextOuter, nextInner);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);

  const material = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mars.add(mesh);

  const referenceAxis = Math.abs(normal.y) < 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(referenceAxis, normal).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

  return { mesh, geometry, material, normal, tangent, bitangent, phase };
}

function updatePulseGeometry(pulse, radius, innerRadiusRatio = 0.9) {
  const positions = pulse.geometry.attributes.position.array;
  const { normal, tangent, bitangent } = pulse;

  for (let segment = 0; segment < pulseSegments; segment += 1) {
    const theta = (segment / pulseSegments) * Math.PI * 2;
    const tangentX = tangent.x * Math.cos(theta) + bitangent.x * Math.sin(theta);
    const tangentY = tangent.y * Math.cos(theta) + bitangent.y * Math.sin(theta);
    const tangentZ = tangent.z * Math.cos(theta) + bitangent.z * Math.sin(theta);

    for (let edge = 0; edge < 2; edge += 1) {
      const angle = radius * (edge === 0 ? innerRadiusRatio : 1);
      const offset = (segment * 2 + edge) * 3;
      const normalScale = pulseSurfaceRadius * Math.cos(angle);
      const tangentScale = pulseSurfaceRadius * Math.sin(angle);
      positions[offset] = normal.x * normalScale + tangentX * tangentScale;
      positions[offset + 1] = normal.y * normalScale + tangentY * tangentScale;
      positions[offset + 2] = normal.z * normalScale + tangentZ * tangentScale;
    }
  }

  pulse.geometry.attributes.position.needsUpdate = true;
}

for (let index = 0; index < 18; index += 1) {
  const vertical = Math.random() * 2 - 1;
  const angle = Math.random() * Math.PI * 2;
  const horizontal = Math.sqrt(1 - vertical * vertical);
  const markerPosition = new THREE.Vector3(
    horizontal * Math.cos(angle),
    vertical,
    horizontal * Math.sin(angle)
  ).multiplyScalar(1.001);
  const normal = markerPosition.clone().normalize();
  const halo = createSurfaceDisc(normal, 0.055, haloMaterial.clone());
  halo.renderOrder = 1;
  markerHalos.push(halo);
  const disc = createSurfaceDisc(normal, 0.025, markerMaterial.clone());
  disc.renderOrder = 2;
  markerDiscs.push(disc);

  const target = new THREE.Mesh(markerTargetGeometry, markerTargetMaterial);
  target.position.copy(markerPosition);
  target.userData.markerIndex = index;
  mars.add(target);
  markerTargets.push(target);

  const outline = createPulse(normal, 0);
  outline.material.color.setHex(0xff334f);
  outline.material.blending = THREE.NormalBlending;
  outline.material.needsUpdate = true;
  outline.material.opacity = 0;
  outline.mesh.renderOrder = 4;
  updatePulseGeometry(outline, 0.034, 0.76);
  markerOutlines.push(outline);

  const basePhase = Math.random() * pulseDuration;

  for (let waveIndex = 0; waveIndex < 2; waveIndex += 1) {
    const phase = (basePhase + waveIndex * pulsePairOffset) % pulseDuration;
    pulses.push(createPulse(normal, phase));
  }
}

const raycaster = new THREE.Raycaster();
const pointerPosition = new THREE.Vector2();
const pointerStarts = new Map();

function markerAtPointer(event) {
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return -1;

  pointerPosition.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointerPosition.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  camera.updateMatrixWorld();
  scene.updateMatrixWorld(true);
  raycaster.setFromCamera(pointerPosition, camera);

  const markerHit = raycaster.intersectObjects(markerTargets, false)[0];
  if (!markerHit) return -1;

  const globeHit = raycaster.intersectObject(mars, false)[0];
  if (globeHit && markerHit.distance >= globeHit.distance) return -1;

  return markerHit.object.userData.markerIndex ?? -1;
}

function setHoveredMarker(index) {
  if (hoveredMarkerIndex === index) return;
  if (hoveredMarkerIndex >= 0) {
    markerOutlines[hoveredMarkerIndex].material.opacity = 0;
    markerDiscs[hoveredMarkerIndex].material.color.setHex(0x7dd3fc);
    markerDiscs[hoveredMarkerIndex].material.opacity = 0.92;
    markerHalos[hoveredMarkerIndex].material.color.setHex(0xffffff);
    markerHalos[hoveredMarkerIndex].material.opacity = 0.82;
  }

  hoveredMarkerIndex = index;
  if (hoveredMarkerIndex >= 0) {
    markerOutlines[hoveredMarkerIndex].material.opacity = 1;
    markerDiscs[hoveredMarkerIndex].material.color.setHex(0xffa0aa);
    markerDiscs[hoveredMarkerIndex].material.opacity = 1;
    markerHalos[hoveredMarkerIndex].material.color.setHex(0xff334f);
    markerHalos[hoveredMarkerIndex].material.opacity = 0.96;
  }
  canvas.style.cursor = hoveredMarkerIndex >= 0 ? "pointer" : "grab";
}

canvas.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  pointerStarts.set(event.pointerId, { x: event.clientX, y: event.clientY, moved: false });
});

canvas.addEventListener("pointermove", (event) => {
  const start = pointerStarts.get(event.pointerId);
  if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) {
    start.moved = true;
  }
});

canvas.addEventListener("pointerup", (event) => {
  const start = pointerStarts.get(event.pointerId);
  pointerStarts.delete(event.pointerId);

  if (start && !start.moved && markerAtPointer(event) >= 0) {
    window.location.assign("https://www.google.com/");
  }
});

canvas.addEventListener("pointercancel", (event) => {
  pointerStarts.delete(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerType === "mouse" && !isDragging) setHoveredMarker(markerAtPointer(event));
});

canvas.addEventListener("pointerleave", (event) => {
  if (event.pointerType === "mouse" && !isDragging) setHoveredMarker(-1);
});

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
    canvas.style.cursor = "grabbing";
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
    setHoveredMarker(markerAtPointer(event));
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
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

function updatePulses(elapsedTime, isMotionAllowed) {
  for (const pulse of pulses) {
    if (!isMotionAllowed) {
      pulse.material.opacity = 0;
      continue;
    }

    const progress = ((elapsedTime + pulse.phase) % pulseDuration) / pulseDuration;
    const radius = 0.025 + progress * 0.12;
    pulse.material.opacity = (1 - progress) * 0.52;
    updatePulseGeometry(pulse, radius);
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const isMotionAllowed = !motionPreference.matches;

  if (isMotionAllowed && !isDragging && hoveredMarkerIndex < 0) {
    mars.rotation.y += delta * 0.08;
  }

  updatePulses(clock.elapsedTime, isMotionAllowed);
  renderer.render(scene, camera);
}

animate();
