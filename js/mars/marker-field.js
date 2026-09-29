const MARKER_COUNT = 18;
const MARKER_POSITION_RADIUS = 1.001;
const MARKER_SURFACE_RADIUS = 1.0025;
const PULSE_SURFACE_RADIUS = 1.002;
const PULSE_DURATION = 2.8;
const PULSE_PAIR_OFFSET = 0.58;
const CIRCLE_SEGMENTS = 40;
const CYAN = 0x7dd3fc;
const HOVER_RED = 0xff334f;

export function createMarkerField({ THREE, mars, scene, camera, canvas, onHoveredMarkerChange = () => {} }) {
  const markers = [];
  const pulses = [];
  let hoveredMarkerIndex = -1;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const targetGeometry = new THREE.SphereGeometry(0.055, 8, 8);
  const targetMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    colorWrite: false,
    depthWrite: false
  });

  const discMaterial = new THREE.MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const haloMaterial = createHaloMaterial(THREE);

  for (let index = 0; index < MARKER_COUNT; index += 1) {
    const normal = randomUnitVector(THREE);
    const position = normal.clone().multiplyScalar(MARKER_POSITION_RADIUS);

    const halo = createSurfaceDisc(THREE, mars, normal, 0.055, haloMaterial.clone());
    halo.renderOrder = 1;

    const disc = createSurfaceDisc(THREE, mars, normal, 0.025, discMaterial.clone());
    disc.renderOrder = 2;

    const target = new THREE.Mesh(targetGeometry, targetMaterial);
    target.position.copy(position);
    target.userData.markerIndex = index;
    mars.add(target);

    const outline = createSurfaceRing(THREE, mars, normal, 0, {
      color: HOVER_RED,
      blending: THREE.NormalBlending
    });
    outline.material.opacity = 0;
    outline.mesh.renderOrder = 4;
    updateRingGeometry(outline, 0.034, 0.76);
    markers.push({ normal, halo, disc, target, outline });

    const phase = Math.random() * PULSE_DURATION;
    for (let wave = 0; wave < 2; wave += 1) {
      pulses.push(createSurfaceRing(THREE, mars, normal, (phase + wave * PULSE_PAIR_OFFSET) % PULSE_DURATION));
    }
  }

  const targets = markers.map(({ target }) => target);

  function markerAtPointer(event) {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return -1;

    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    );

    camera.updateMatrixWorld();
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);

    const targetHit = raycaster.intersectObjects(targets, false)[0];
    if (!targetHit) return -1;

    const surfaceHit = raycaster.intersectObject(mars, false)[0];
    if (surfaceHit && targetHit.distance >= surfaceHit.distance) return -1;

    return targetHit.object.userData.markerIndex ?? -1;
  }

  function setHoveredMarker(index) {
    if (hoveredMarkerIndex === index) return;

    if (hoveredMarkerIndex >= 0) {
      setMarkerAppearance(markers[hoveredMarkerIndex], false);
    }

    hoveredMarkerIndex = index;
    if (hoveredMarkerIndex >= 0) {
      setMarkerAppearance(markers[hoveredMarkerIndex], true);
    }

    onHoveredMarkerChange(hoveredMarkerIndex);
    canvas.style.cursor = hoveredMarkerIndex >= 0 ? "pointer" : "grab";
  }

  function targetRotationForMarker(index, currentRotation) {
    const marker = markers[index];
    if (!marker) return currentRotation;

    const facingRotation = -Math.atan2(marker.normal.x, marker.normal.z);
    const fullTurn = Math.PI * 2;
    const reverseDistance = ((currentRotation - facingRotation) % fullTurn + fullTurn) % fullTurn;
    return currentRotation - reverseDistance;
  }

  function updatePulses(elapsedTime, motionAllowed) {
    for (const pulse of pulses) {
      if (!motionAllowed) {
        pulse.material.opacity = 0;
        continue;
      }

      const progress = ((elapsedTime + pulse.phase) % PULSE_DURATION) / PULSE_DURATION;
      pulse.material.opacity = (1 - progress) * 0.52;
      updateRingGeometry(pulse, 0.025 + progress * 0.12);
    }
  }

  return {
    markerAtPointer,
    setHoveredMarker,
    updatePulses,
    targetRotationForMarker,
    get hoveredMarkerIndex() {
      return hoveredMarkerIndex;
    }
  };
}

function setMarkerAppearance({ outline, disc, halo }, highlighted) {
  outline.material.opacity = highlighted ? 1 : 0;
  disc.material.color.setHex(highlighted ? 0xffa0aa : CYAN);
  disc.material.opacity = highlighted ? 1 : 0.92;
  halo.material.color.setHex(highlighted ? HOVER_RED : 0xffffff);
  halo.material.opacity = highlighted ? 0.96 : 0.82;
}

function randomUnitVector(THREE) {
  const vertical = Math.random() * 2 - 1;
  const angle = Math.random() * Math.PI * 2;
  const horizontal = Math.sqrt(1 - vertical * vertical);

  return new THREE.Vector3(
    horizontal * Math.cos(angle),
    vertical,
    horizontal * Math.sin(angle)
  );
}

function createHaloMaterial(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(125, 211, 252, 0.3)");
  gradient.addColorStop(0.28, "rgba(125, 211, 252, 0.2)");
  gradient.addColorStop(0.64, "rgba(125, 211, 252, 0.07)");
  gradient.addColorStop(1, "rgba(125, 211, 252, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

function createSurfaceDisc(THREE, mars, normal, radius, material) {
  const { tangent, bitangent } = getTangentBasis(THREE, normal);
  const positions = new Float32Array((CIRCLE_SEGMENTS + 1) * 3);
  const uvs = new Float32Array((CIRCLE_SEGMENTS + 1) * 2);
  const indices = [];

  writeSurfacePosition(positions, 0, normal, normal, 0, MARKER_SURFACE_RADIUS);
  uvs[0] = 0.5;
  uvs[1] = 0.5;

  for (let segment = 0; segment < CIRCLE_SEGMENTS; segment += 1) {
    const angle = (segment / CIRCLE_SEGMENTS) * Math.PI * 2;
    const direction = tangent.clone().multiplyScalar(Math.cos(angle))
      .addScaledVector(bitangent, Math.sin(angle));
    const vertex = segment + 1;
    writeSurfacePosition(positions, vertex * 3, normal, direction, radius, MARKER_SURFACE_RADIUS);
    uvs[vertex * 2] = 0.5 + Math.cos(angle) * 0.5;
    uvs[vertex * 2 + 1] = 0.5 + Math.sin(angle) * 0.5;
    indices.push(0, vertex, ((segment + 1) % CIRCLE_SEGMENTS) + 1);
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

function createSurfaceRing(THREE, mars, normal, phase, { color = CYAN, blending = THREE.AdditiveBlending } = {}) {
  const positions = new Float32Array(CIRCLE_SEGMENTS * 2 * 3);
  const indices = [];

  for (let segment = 0; segment < CIRCLE_SEGMENTS; segment += 1) {
    const nextSegment = (segment + 1) % CIRCLE_SEGMENTS;
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
    color,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mars.add(mesh);

  const { tangent, bitangent } = getTangentBasis(THREE, normal);
  return { geometry, material, normal, tangent, bitangent, phase, mesh };
}

function getTangentBasis(THREE, normal) {
  const reference = Math.abs(normal.y) < 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(reference, normal).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  return { tangent, bitangent };
}

function updateRingGeometry(ring, radius, innerRadiusRatio = 0.9) {
  const positions = ring.geometry.attributes.position.array;
  const { normal, tangent, bitangent } = ring;

  for (let segment = 0; segment < CIRCLE_SEGMENTS; segment += 1) {
    const angle = (segment / CIRCLE_SEGMENTS) * Math.PI * 2;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const directionX = tangent.x * cosine + bitangent.x * sine;
    const directionY = tangent.y * cosine + bitangent.y * sine;
    const directionZ = tangent.z * cosine + bitangent.z * sine;

    for (let edge = 0; edge < 2; edge += 1) {
      const angleRadius = radius * (edge === 0 ? innerRadiusRatio : 1);
      const offset = (segment * 2 + edge) * 3;
      const normalScale = PULSE_SURFACE_RADIUS * Math.cos(angleRadius);
      const tangentScale = PULSE_SURFACE_RADIUS * Math.sin(angleRadius);
      positions[offset] = normal.x * normalScale + directionX * tangentScale;
      positions[offset + 1] = normal.y * normalScale + directionY * tangentScale;
      positions[offset + 2] = normal.z * normalScale + directionZ * tangentScale;
    }
  }

  ring.geometry.attributes.position.needsUpdate = true;
}

function writeSurfacePosition(positions, offset, normal, direction, angle, surfaceRadius) {
  const normalScale = surfaceRadius * Math.cos(angle);
  const tangentScale = surfaceRadius * Math.sin(angle);
  positions[offset] = normal.x * normalScale + direction.x * tangentScale;
  positions[offset + 1] = normal.y * normalScale + direction.y * tangentScale;
  positions[offset + 2] = normal.z * normalScale + direction.z * tangentScale;
}
