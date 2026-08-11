const el = id => document.getElementById(id);
const projectKey = el('projectKey');
const fileInput = el('fileInput');
const dropzone = el('dropzone');
const queue = el('queue');
const queueTitle = el('queueTitle');
const uploadBtn = el('uploadBtn');
const clearBtn = el('clearBtn');
const refreshBtn = el('refreshBtn');
const confirmBtn = el('confirmBtn');
const manifestBtn = el('manifestBtn');
const registry = el('registry');
const summary = el('summary');
const message = el('message');
const progress = el('progress');
const progressBar = el('progressBar');
const serviceStatus = el('serviceStatus');

let selected = [];
let currentRegistry = null;

const fmtBytes = bytes => {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[c]));

function setMessage(text = '', error = false) {
  message.textContent = text;
  message.classList.toggle('error', error);
}

function setSelected(files) {
  selected = Array.from(files || []);
  queueTitle.textContent = selected.length ? `${selected.length} file${selected.length === 1 ? '' : 's'} selected` : 'No files selected';
  uploadBtn.disabled = !selected.length;
  queue.innerHTML = selected.map((file, i) => `
    <div class="queue-row">
      <span class="file-badge">${esc((file.name.split('.').pop() || 'FILE').toUpperCase().slice(0, 5))}</span>
      <span class="file-main"><strong>${esc(file.name)}</strong><small>${fmtBytes(file.size)} · ${esc(file.type || 'unknown type')}</small></span>
      <button type="button" class="remove" data-remove="${i}" aria-label="Remove file">×</button>
    </div>
  `).join('');
  queue.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
    selected.splice(Number(btn.dataset.remove), 1);
    setSelected(selected);
  }));
}

async function checkHealth() {
  try {
    const r = await fetch('/api/health');
    if (!r.ok) throw new Error('offline');
    const data = await r.json();
    serviceStatus.textContent = data.ok ? 'READY' : 'ERROR';
    serviceStatus.classList.toggle('ok', Boolean(data.ok));
  } catch {
    serviceStatus.textContent = 'OFFLINE';
  }
}

async function uploadFiles() {
  const key = projectKey.value.trim();
  if (!key || !selected.length) return;
  setMessage('Uploading…');
  uploadBtn.disabled = true;
  progress.hidden = false;
  progressBar.style.width = '10%';

  const body = new FormData();
  body.append('projectKey', key);
  selected.forEach(file => body.append('files', file, file.name));

  try {
    progressBar.style.width = '45%';
    const r = await fetch('/api/files', { method: 'POST', body });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Upload failed');
    progressBar.style.width = '100%';
    setMessage(`${data.imported} file${data.imported === 1 ? '' : 's'} inserted into project data. Application code unchanged.`);
    setSelected([]);
    fileInput.value = '';
    await loadRegistry();
  } catch (err) {
    setMessage(err.message, true);
  } finally {
    uploadBtn.disabled = !selected.length;
    setTimeout(() => { progress.hidden = true; progressBar.style.width = '0%'; }, 700);
  }
}

function fileRow(record) {
  const meta = record.metadata || {};
  const metaBits = [meta.level && `Level ${meta.level}`, meta.revision && `Rev ${meta.revision}`, meta.documentDate, meta.trade].filter(Boolean);
  return `
    <div class="registry-row ${esc(record.status)}">
      <span class="file-badge kind-${esc(record.kind)}">${esc(record.kind.toUpperCase().slice(0, 5))}</span>
      <span class="file-main">
        <strong>${esc(record.originalName)}</strong>
        <small>${fmtBytes(record.size)} · ${esc(record.status)}${metaBits.length ? ` · ${esc(metaBits.join(' · '))}` : ''}</small>
        <small class="hash">SHA-256 ${esc(record.sha256.slice(0, 16))}…</small>
      </span>
      <a class="download" href="/api/projects/${encodeURIComponent(record.projectKey)}/files/${encodeURIComponent(record.id)}/download">↓</a>
    </div>
  `;
}

async function loadRegistry() {
  const key = projectKey.value.trim();
  if (!key) return;
  summary.textContent = 'Loading…';
  try {
    const r = await fetch(`/api/projects/${encodeURIComponent(key)}/files`);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Could not load registry');
    currentRegistry = data;
    const files = data.files || [];
    const pending = files.filter(f => f.status === 'pending_review').length;
    const imported = files.filter(f => f.status === 'imported').length;
    const bytes = files.reduce((sum, f) => sum + Number(f.size || 0), 0);
    summary.textContent = `${files.length} files · ${fmtBytes(bytes)} · ${pending} pending review · ${imported} confirmed`;
    registry.innerHTML = files.length ? files.slice().reverse().map(fileRow).join('') : '<div class="empty">No project files yet.</div>';
  } catch (err) {
    currentRegistry = null;
    summary.textContent = err.message;
    registry.innerHTML = '';
  }
}

async function confirmPending() {
  const key = projectKey.value.trim();
  if (!key) return;
  try {
    const r = await fetch(`/api/projects/${encodeURIComponent(key)}/confirm`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Confirmation failed');
    setMessage(`${data.confirmed} file${data.confirmed === 1 ? '' : 's'} confirmed.`);
    await loadRegistry();
  } catch (err) { setMessage(err.message, true); }
}

fileInput.addEventListener('change', () => setSelected(fileInput.files));
clearBtn.addEventListener('click', () => { setSelected([]); fileInput.value = ''; });
uploadBtn.addEventListener('click', uploadFiles);
refreshBtn.addEventListener('click', loadRegistry);
confirmBtn.addEventListener('click', confirmPending);
manifestBtn.addEventListener('click', () => {
  const key = projectKey.value.trim();
  if (key) window.location.href = `/api/projects/${encodeURIComponent(key)}/manifest`;
});
projectKey.addEventListener('change', loadRegistry);

for (const event of ['dragenter', 'dragover']) {
  dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.add('dragging'); });
}
for (const event of ['dragleave', 'drop']) {
  dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.remove('dragging'); });
}
dropzone.addEventListener('drop', e => setSelected(e.dataTransfer.files));

checkHealth();
loadRegistry();
