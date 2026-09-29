const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10_000;
const ROTATION_PER_PIXEL = 0.008;
const CLICK_DRAG_THRESHOLD = 8;

export function attachGlobeControls({ THREE, canvas, camera, mars, markerField, pointButtons, updateFraming, onMarkerActivate = () => {} }) {
  const pointerStarts = new Map();
  const activeTouches = new Map();
  let previousPinchDistance = null;
  let previousPointerX = null;
  let isDragging = false;
  let targetRotation = null;
  let hoveredListIndex = -1;
  let selectedListIndexValue = -1;
  let lastInputMode = "pointer";
  let lockedMarkerIndex = -1;

  function activateMarker(index) {
    if (index < 0 || lockedMarkerIndex >= 0) return;
    lockedMarkerIndex = index;
    hoveredListIndex = -1;
    selectedListIndexValue = index;
    lastInputMode = "keyboard";
    targetRotation = markerField.targetRotationForMarker(index, mars.rotation.y);
    markerField.setHoveredMarker(index);
    onMarkerActivate(index);
  }

  function unlockPoint() {
    if (lockedMarkerIndex < 0) return;
    lockedMarkerIndex = -1;
    clearListSelection();
  }

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

  function selectedListIndex() {
    if (lastInputMode === "keyboard" && selectedListIndexValue >= 0) return selectedListIndexValue;
    return hoveredListIndex >= 0 ? hoveredListIndex : selectedListIndexValue;
  }

  function syncListSelection() {
    const index = selectedListIndex();
    targetRotation = index >= 0
      ? markerField.targetRotationForMarker(index, mars.rotation.y)
      : null;
    markerField.setHoveredMarker(index);
  }

  function onPointPointerEnter(event) {
    if (event.pointerType === "touch" || lockedMarkerIndex >= 0) return;
    lastInputMode = "pointer";
    selectedListIndexValue = -1;
    hoveredListIndex = Number(event.currentTarget.dataset.markerIndex);
    syncListSelection();
  }

  function onPointPointerLeave() {
    hoveredListIndex = -1;
    lastInputMode = "pointer";
    syncListSelection();
  }

  function onPointFocus(event) {
    if (lastInputMode !== "keyboard" || lockedMarkerIndex >= 0) return;
    selectedListIndexValue = Number(event.currentTarget.dataset.markerIndex);
    syncListSelection();
  }

  function onPointBlur(event) {
    if (lockedMarkerIndex >= 0) return;
    const index = Number(event.currentTarget.dataset.markerIndex);
    if (selectedListIndexValue === index) {
      selectedListIndexValue = -1;
      syncListSelection();
    }
  }

  function onPointClick(event) {
    activateMarker(Number(event.currentTarget.dataset.markerIndex));
  }

  function onKeyDown(event) {
    if (event.key === "Tab" || event.key.startsWith("Arrow")) lastInputMode = "keyboard";
  }

  function clearListSelection() {
    hoveredListIndex = -1;
    selectedListIndexValue = -1;
    lastInputMode = "pointer";
    targetRotation = null;
    markerField.setHoveredMarker(-1);
  }

  function onPointerDown(event) {
    if (lockedMarkerIndex >= 0) return;
    if (event.pointerType === "mouse") {
      if (event.button !== 0) return;
      clearListSelection();
      isDragging = true;
      previousPointerX = event.clientX;
      canvas.style.cursor = "grabbing";
    } else if (event.pointerType === "touch") {
      clearListSelection();
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
    if (lockedMarkerIndex >= 0) return;
    const start = pointerStarts.get(event.pointerId);
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_DRAG_THRESHOLD) {
      start.moved = true;
    }

    if (event.pointerType === "mouse") {
      if (isDragging) {
        mars.rotation.y += (event.clientX - previousPointerX) * ROTATION_PER_PIXEL;
        previousPointerX = event.clientX;
      } else {
        const markerIndex = markerField.markerAtPointer(event);
        if (markerIndex >= 0) {
          targetRotation = null;
          markerField.setHoveredMarker(markerIndex);
        } else {
          markerField.setHoveredMarker(selectedListIndex());
        }
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
      const markerIndex = markerField.markerAtPointer(event);
      markerField.setHoveredMarker(markerIndex >= 0 ? markerIndex : selectedListIndex());
    } else if (event.pointerType === "touch") {
      activeTouches.delete(event.pointerId);
      previousPinchDistance = pinchDistance();
    }

    const markerIndex = start && !start.moved ? markerField.markerAtPointer(event) : -1;
    if (markerIndex >= 0) {
      activateMarker(markerIndex);
    }
  }

  function onPointerCancel(event) {
    pointerStarts.delete(event.pointerId);
    activeTouches.delete(event.pointerId);
    previousPinchDistance = pinchDistance();
    if (event.pointerType === "mouse") {
      isDragging = false;
      previousPointerX = null;
      markerField.setHoveredMarker(selectedListIndex());
    }
  }

  function onPointerLeave(event) {
    if (event.pointerType === "mouse" && !isDragging) markerField.setHoveredMarker(selectedListIndex());
  }

  function onWheel(event) {
    if (lockedMarkerIndex >= 0) return;
    event.preventDefault();
    zoomTo(camera.zoom * Math.exp(-event.deltaY * 0.001));
  }

  function update(delta, motionAllowed) {
    if (targetRotation !== null) {
      const difference = targetRotation - mars.rotation.y;

      if (!motionAllowed || Math.abs(difference) < 0.001) {
        mars.rotation.y += difference;
        targetRotation = null;
      } else {
        mars.rotation.y += difference * (1 - Math.exp(-10 * delta));
      }
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  document.addEventListener("keydown", onKeyDown, true);
  pointButtons.forEach((button) => {
    button.addEventListener("pointerenter", onPointPointerEnter);
    button.addEventListener("pointerleave", onPointPointerLeave);
    button.addEventListener("focus", onPointFocus);
    button.addEventListener("blur", onPointBlur);
    button.addEventListener("click", onPointClick);
  });

  return {
    update,
    unlockPoint,
    get isDragging() {
      return isDragging;
    },
    get isPointLocked() {
      return lockedMarkerIndex >= 0;
    }
  };
}
