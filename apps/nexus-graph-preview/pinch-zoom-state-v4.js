(() => {
  let touchModeSeen = false;
  let pinchActive = false;
  let suppressUntilRelease = false;
  let lastDistance = 0;
  const pointers = new Map();

  const graphSurface = () =>
    document.querySelector('#root .touch-none') ||
    document.querySelector('[data-node]')?.closest('.touch-none');

  const zoomButtons = () => {
    const surface = graphSurface();
    if (!surface) return null;
    const panels = [...surface.querySelectorAll('[data-control]')];
    const panel = panels.find((candidate) => candidate.querySelectorAll('button').length >= 4);
    if (!panel) return null;
    const buttons = panel.querySelectorAll('button');
    return buttons.length >= 2 ? { plus: buttons[0], minus: buttons[1] } : null;
  };

  const stop = (event) => {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  };

  const runZoomStep = (direction) => {
    const buttons = zoomButtons();
    if (!buttons) return false;
    (direction > 0 ? buttons.plus : buttons.minus).click();
    return true;
  };

  const distanceFromTouches = (touches) => {
    if (!touches || touches.length < 2) return 0;
    const first = touches.item(0);
    const second = touches.item(1);
    if (!first || !second) return 0;
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  };

  const applyDistance = (nextDistance, event) => {
    if (!pinchActive || !lastDistance || !nextDistance) return;
    const ratio = nextDistance / lastDistance;
    const threshold = 1.035;

    if (ratio >= threshold) {
      const steps = Math.min(4, Math.max(1, Math.floor(Math.log(ratio) / Math.log(threshold))));
      let changed = false;
      for (let index = 0; index < steps; index += 1) changed = runZoomStep(1) || changed;
      if (changed) lastDistance = nextDistance;
    } else if (ratio <= 1 / threshold) {
      const steps = Math.min(4, Math.max(1, Math.floor(Math.log(1 / ratio) / Math.log(threshold))));
      let changed = false;
      for (let index = 0; index < steps; index += 1) changed = runZoomStep(-1) || changed;
      if (changed) lastDistance = nextDistance;
    }

    stop(event);
  };

  document.addEventListener('touchstart', (event) => {
    touchModeSeen = true;
    if (event.target instanceof Element && event.target.closest('[data-control]')) return;
    const distance = distanceFromTouches(event.touches);
    if (!distance) return;
    pinchActive = true;
    suppressUntilRelease = true;
    lastDistance = Math.max(distance, 1);
    stop(event);
  }, { capture: true, passive: false });

  document.addEventListener('touchmove', (event) => {
    const distance = distanceFromTouches(event.touches);
    if (distance) {
      if (!pinchActive) {
        pinchActive = true;
        suppressUntilRelease = true;
        lastDistance = Math.max(distance, 1);
        stop(event);
        return;
      }
      applyDistance(Math.max(distance, 1), event);
      return;
    }
    if (suppressUntilRelease) stop(event);
  }, { capture: true, passive: false });

  const endTouch = (event) => {
    if (suppressUntilRelease) stop(event);
    if (!event.touches || event.touches.length < 2) pinchActive = false;
    if (!event.touches || event.touches.length === 0) {
      suppressUntilRelease = false;
      lastDistance = 0;
    }
  };

  document.addEventListener('touchend', endTouch, { capture: true, passive: false });
  document.addEventListener('touchcancel', endTouch, { capture: true, passive: false });

  document.addEventListener('pointerdown', (event) => {
    if (touchModeSeen || event.pointerType !== 'touch') return;
    if (event.target instanceof Element && event.target.closest('[data-control]')) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      const values = [...pointers.values()];
      pinchActive = true;
      suppressUntilRelease = true;
      lastDistance = Math.max(Math.hypot(values[1].x - values[0].x, values[1].y - values[0].y), 1);
      stop(event);
    }
  }, { capture: true, passive: false });

  document.addEventListener('pointermove', (event) => {
    if (touchModeSeen || event.pointerType !== 'touch' || !pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      const values = [...pointers.values()];
      const distance = Math.max(Math.hypot(values[1].x - values[0].x, values[1].y - values[0].y), 1);
      applyDistance(distance, event);
    } else if (suppressUntilRelease) {
      stop(event);
    }
  }, { capture: true, passive: false });

  const endPointer = (event) => {
    if (touchModeSeen || event.pointerType !== 'touch') return;
    pointers.delete(event.pointerId);
    if (suppressUntilRelease) stop(event);
    if (pointers.size < 2) pinchActive = false;
    if (pointers.size === 0) {
      suppressUntilRelease = false;
      lastDistance = 0;
    }
  };

  document.addEventListener('pointerup', endPointer, { capture: true, passive: false });
  document.addEventListener('pointercancel', endPointer, { capture: true, passive: false });

  window.__NOSMO_PINCH_ZOOM_VERSION__ = 'state-v4';
})();
