(() => {
  const state = {
    active: false,
    locked: false,
    lastDistance: 0,
  };

  const graphSurface = () =>
    document.querySelector('#root .touch-none') ||
    document.querySelector('[data-node]')?.closest('.touch-none') ||
    document.querySelector('#root > div');

  const getGesture = (touches) => {
    if (!touches || touches.length < 2) return null;
    const first = touches.item(0);
    const second = touches.item(1);
    if (!first || !second) return null;
    return {
      distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY),
      x: (first.clientX + second.clientX) / 2,
      y: (first.clientY + second.clientY) / 2,
    };
  };

  const block = (event) => {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  };

  const zoom = (direction, midpoint) => {
    const surface = graphSurface();
    if (!surface) return;
    surface.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: midpoint.x,
      clientY: midpoint.y,
      deltaY: direction > 0 ? -120 : 120,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
    }));
  };

  document.addEventListener('touchstart', (event) => {
    if (event.target instanceof Element && event.target.closest('[data-control]')) return;
    const gesture = getGesture(event.touches);
    if (!gesture) return;

    state.active = true;
    state.locked = true;
    state.lastDistance = Math.max(gesture.distance, 1);
    block(event);
  }, { capture: true, passive: false });

  document.addEventListener('touchmove', (event) => {
    const gesture = getGesture(event.touches);
    if (!gesture) {
      if (state.locked) block(event);
      return;
    }

    if (!state.active) {
      state.active = true;
      state.locked = true;
      state.lastDistance = Math.max(gesture.distance, 1);
      block(event);
      return;
    }

    const nextDistance = Math.max(gesture.distance, 1);
    const ratio = nextDistance / Math.max(state.lastDistance, 1);
    const threshold = 1.025;

    if (ratio >= threshold) {
      const steps = Math.min(4, Math.max(1, Math.floor(Math.log(ratio) / Math.log(threshold))));
      for (let index = 0; index < steps; index += 1) zoom(1, gesture);
      state.lastDistance = nextDistance;
    } else if (ratio <= 1 / threshold) {
      const steps = Math.min(4, Math.max(1, Math.floor(Math.log(1 / ratio) / Math.log(threshold))));
      for (let index = 0; index < steps; index += 1) zoom(-1, gesture);
      state.lastDistance = nextDistance;
    }

    block(event);
  }, { capture: true, passive: false });

  const finish = (event) => {
    if (state.locked) block(event);
    if (event.touches && event.touches.length >= 2) return;
    state.active = false;
    state.lastDistance = 0;
    if (!event.touches || event.touches.length === 0) state.locked = false;
  };

  document.addEventListener('touchend', finish, { capture: true, passive: false });
  document.addEventListener('touchcancel', finish, { capture: true, passive: false });

  window.__NOSMO_PINCH_ZOOM_VERSION__ = 'samsung-v3';
})();
