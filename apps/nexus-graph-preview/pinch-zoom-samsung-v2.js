(() => {
  const activeTouches = new Map();
  let pinchActive = false;
  let suppressUntilAllReleased = false;
  let lastDistance = 0;

  const graphRoot = () => document.querySelector('#root > div');

  const distance = () => {
    const points = [...activeTouches.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
  };

  const stopGesture = (event) => {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  };

  const zoomStep = (direction) => {
    const target = graphRoot();
    if (!target) return;
    target.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: direction > 0 ? -1 : 1,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
    }));
  };

  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    if (event.target instanceof Element && event.target.closest('[data-control]')) return;

    activeTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activeTouches.size >= 2) {
      pinchActive = true;
      suppressUntilAllReleased = true;
      lastDistance = Math.max(distance(), 1);
      stopGesture(event);
    }
  }, { capture: true, passive: false });

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'touch' || !activeTouches.has(event.pointerId)) return;
    activeTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinchActive && activeTouches.size >= 2) {
      const nextDistance = Math.max(distance(), 1);
      const ratio = nextDistance / Math.max(lastDistance, 1);
      const threshold = 1.035;

      if (ratio >= threshold) {
        const steps = Math.min(3, Math.max(1, Math.floor(Math.log(ratio) / Math.log(threshold))));
        for (let index = 0; index < steps; index += 1) zoomStep(1);
        lastDistance = nextDistance;
      } else if (ratio <= 1 / threshold) {
        const steps = Math.min(3, Math.max(1, Math.floor(Math.log(1 / ratio) / Math.log(threshold))));
        for (let index = 0; index < steps; index += 1) zoomStep(-1);
        lastDistance = nextDistance;
      }

      stopGesture(event);
      return;
    }

    if (suppressUntilAllReleased) stopGesture(event);
  }, { capture: true, passive: false });

  const releasePointer = (event) => {
    if (event.pointerType !== 'touch') return;
    activeTouches.delete(event.pointerId);

    if (activeTouches.size < 2) pinchActive = false;
    if (suppressUntilAllReleased) stopGesture(event);

    if (activeTouches.size === 0) {
      pinchActive = false;
      suppressUntilAllReleased = false;
      lastDistance = 0;
    }
  };

  document.addEventListener('pointerup', releasePointer, { capture: true, passive: false });
  document.addEventListener('pointercancel', releasePointer, { capture: true, passive: false });
})();
