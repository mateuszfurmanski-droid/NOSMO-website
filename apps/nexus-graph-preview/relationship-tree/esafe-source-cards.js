/* Source-backed document cards for the isolated e-SAFE demonstration. */
(() => {
  if (new URLSearchParams(location.search).get('world') !== 'esafe-demo') return;
  const docs = [
    { fallback: 'd-snaglist', id: '6260847', name: 'D5.1 — Detailed survey of the real pilot' },
    { fallback: 'd-firecerts', id: '6497142', name: 'D2.2 — 3D physical and digital models of the real pilot' },
    { fallback: 't-install', id: '19114712', name: 'D5.5 — Report on monitoring activities' },
    { fallback: 't-snag', id: '19126519', name: 'D5.4 — Production of e-SAFE components' },
    { fallback: 't-fire', id: '19126674', name: 'D5.3 — Detailed design for the renovation works' }
  ];
  const byNode = new Map(docs.flatMap(d => [[d.fallback, d], [`esafe-core-${d.id}`, d]]));
  const style = document.createElement('style');
  style.textContent = `
    .esafe-source-card{position:fixed;right:16px;bottom:82px;z-index:2147482000;width:min(350px,calc(100vw - 32px));box-sizing:border-box;background:#071725;color:#edf7ff;border:1px solid #2e93ba;border-radius:14px;padding:16px;box-shadow:0 12px 40px #0009;font:14px/1.45 Arial,sans-serif}
    .esafe-source-card h2{font-size:16px;margin:0 32px 8px 0}.esafe-source-card p{margin:8px 0}.esafe-source-card a{display:inline-block;color:#9ae6ff;font-weight:bold;margin:8px 12px 0 0}.esafe-source-card button{position:absolute;right:10px;top:8px;color:white;background:transparent;border:0;font-size:24px;cursor:pointer}
  `;
  document.head.appendChild(style);
  let card;
  function show(doc) {
    if (!card) {
      card = document.createElement('aside');
      card.className = 'esafe-source-card';
      card.setAttribute('aria-label', 'e-SAFE source document');
      document.body.appendChild(card);
    }
    card.replaceChildren();
    const close = document.createElement('button');
    close.type = 'button'; close.setAttribute('aria-label', 'Close source card'); close.textContent = '×';
    close.addEventListener('click', () => card.remove());
    const title = document.createElement('h2'); title.textContent = doc.name;
    const source = document.createElement('p'); source.textContent = 'Source document · PDF · e-SAFE Catania';
    const note = document.createElement('p'); note.textContent = 'Demo graph: displayed links and task assignments are illustrative and are not verified project records.';
    const link = document.createElement('a'); link.href = `https://zenodo.org/records/${doc.id}`; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Open source record ↗';
    card.append(close, title, source, note, link);
    if (!card.isConnected) document.body.appendChild(card);
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-control]')) return;
    const node = event.target.closest('[data-node-id]');
    const doc = node && byNode.get(node.dataset.nodeId);
    if (doc) show(doc);
  });
  function correctIcons() {
    for (const [id] of byNode) {
      const node = document.querySelector(`[data-node-id="${id}"]`);
      const icon = node?.querySelector('svg[data-nosmo-file-icon]');
      if (!icon || icon.dataset.nosmoFileIcon === 'pdf') continue;
      const image = icon.querySelector('image');
      if (!image) continue;
      icon.dataset.nosmoFileIcon = 'pdf'; icon.setAttribute('aria-label', 'PDF file');
      image.setAttribute('href', '/apps/nexus-graph-preview/assets/file-icons/pdf.webp');
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(correctIcons);
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    correctIcons();
  });
})();
