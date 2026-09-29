const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10_000;
const ROTATION_PER_PIXEL = 0.008;
const CLICK_DRAG_THRESHOLD = 8;

export function attachGlobeControls({ THREE, canvas, camera, mars, markerField, updateFraming }) {
  const pointerStarts = new Map();
  const activeTouches = new Map();
  let previousPinchDistance = null;
  let previousPointerX = null;
  let isDragging = false;

  function zoomTo(zoom) {
    camera.zoom = THREE.MathUtils.clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    camera.updateProjectionMatrix();
    updateFraming();
  }

  function pinchDistance() {
    if (activeTouches.size !== 2) return null;
    const [first, second] = activeTouches.values();
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse") {
      if (event.button !== 0) return;
      isDragging = true;
      previousPointerX = event.clientX;
      canvas.style.cursor = "grabbing";
    } else if (event.pointerType === "touch") {
      activeTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      previousPinchDistance = pinchDistance();
    } else {
      return;
    }

    pointerStarts.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      moved: false
    });
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    const start = pointerStarts.get(event.pointerId);
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_DRAG_THRESHOLD) {
      start.moved = true;
    }

    if (event.pointerType === "mouse") {
      if (isDragging) {
        mars.rotation.y += (event.clientX - previousPointerX) * ROTATION_PER_PIXEL;
        previousPointerX = event.clientX;
      } else {
        markerField.setHoveredMarker(markerField.markerAtPointer(event));
      }
      return;
    }

    if (event.pointerType !== "touch" || !activeTouches.has(event.pointerId)) return;

    const previousTouch = activeTouches.get(event.pointerId);
    activeTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activeTouches.size === 1) {
      mars.rotation.y += (event.clientX - previousTouch.x) * ROTATION_PER_PIXEL;
      previousPinchDistance = null;
      return;
    }

    const distance = pinchDistance();
    if (distance !== null && previousPinchDistance !== null && previousPinchDistance > 0) {
      zoomTo(camera.zoom * distance / previousPinchDistance);
    }
    previousPinchDistance = distance;
  }

  function onPointerUp(event) {
    const start = pointerStarts.get(event.pointerId);
    pointerStarts.delete(event.pointerId);

    if (event.pointerType === "mouse") {
      isDragging = false;
      previousPointerX = null;
      markerField.setHoveredMarker(markerField.markerAtPointer(event));
    } else if (event.pointerType === "touch") {
      activeTouches.delete(event.pointerId);
      previousPinchDistance = pinchDistance();
    }

    if (start && !start.moved && markerField.markerAtPointer(event) >= 0) {
      window.location.assign("https://www.google.com/");
    }
  }

  function onPointerCancel(event) {
    pointerStarts.delete(event.pointerId);
    activeTouches.delete(event.pointerId);
    previousPinchDistance = pinchDistance();
    if (event.pointerType === "mouse") {
      isDragging = false;
      previousPointerX = null;
      markerField.setHoveredMarker(-1);
    }
  }

  function onPointerLeave(event) {
    if (event.pointerType === "mouse" && !isDragging) markerField.setHoveredMarker(-1);
  }

  function onWheel(event) {
    event.preventDefault();
    zoomTo(camera.zoom * Math.exp(-event.deltaY * 0.001));
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  return {
    get isDragging() {
      return isDragging;
    }
  };
}
