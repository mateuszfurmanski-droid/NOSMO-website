class NexusRelationshipTreeShellController {
  constructor() {
    this.openClass = 'open';
    this.world = window.__NEXUS_PROJECT_WORLD__ || 'dev';
    this.roleKey = 'nexus.relationshipTree.role';
    this.themeKey = 'nexus.theme';
    this.role = this.loadRole();
    this.elements = {};
  }

  init() {
    this.installMobileViewportFix();
    this.cacheElements();
    this.applyWorldLabel();
    this.installRoleSwitcherInTools();
    this.applyRole(this.role, { syncNative: true });
    this.bindTopRail();
    this.bindPanelActions();
    this.bindProjectSwitcher();
    this.bindFiles();
    this.bindTheme();
    this.bindKeyboard();
    this.installProjectDedupe();
    this.installTimelineClassicTapeSwitch();
    this.markReady();
  }

  installMobileViewportFix() {
    if (document.getElementById('nexusMobileViewportFix')) return;
    document.documentElement.classList.add('nexus-mobile-viewport-fixed');
    const style = document.createElement('style');
    style.id = 'nexusMobileViewportFix';
    style.textContent = `
      html.nexus-mobile-viewport-fixed,html.nexus-mobile-viewport-fixed body{width:100%!important;height:100%!important;min-height:100%!important;margin:0!important;background:#eaf3f6!important;overflow:hidden!important;overscroll-behavior:none!important}
      html.nexus-mobile-viewport-fixed body{position:fixed!important;inset:0!important}
      html.nexus-mobile-viewport-fixed #root{position:fixed!important;left:0!important;right:0!important;top:var(--nexus-top-rail-h,76px)!important;bottom:0!important;height:auto!important;min-height:0!important;margin:0!important;background:#eaf3f6!important;overflow:hidden!important;isolation:isolate!important}
      html.nexus-mobile-viewport-fixed #root>div:first-child,html.nexus-mobile-viewport-fixed #root>main:first-child{min-height:100%!important}
      html.nexus-mobile-viewport-fixed .nexus-top-rail,html.nexus-mobile-viewport-fixed .nexus-shell-panel,html.nexus-mobile-viewport-fixed [data-control][class*="bottom-"],html.nexus-mobile-viewport-fixed [class*="bottom-"]{-webkit-transform:translateZ(0);transform:translateZ(0);backface-visibility:hidden}
      @supports (height:100dvh){html.nexus-mobile-viewport-fixed,html.nexus-mobile-viewport-fixed body{height:100dvh!important;min-height:100dvh!important}}
    `;
    document.head.appendChild(style);
    const syncViewportHeight = () => document.documentElement.style.setProperty('--nexus-visual-vh', `${window.innerHeight}px`);
    syncViewportHeight();
    window.addEventListener('resize', syncViewportHeight, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(syncViewportHeight, 120), { passive: true });
  }

  cacheElements() {
    const byId = (id) => document.getElementById(id);
    this.elements = {
      rail: byId('nexusTopRail'),
      menuTile: byId('nexusTopMenu'),
      projectTile: byId('nexusTopProject'),
      timeTile: byId('nexusTopTime'),
      filesTile: byId('nexusTopFiles'),
      toolsTile: byId('nexusTopTools'),
      projectSub: byId('nexusTopProjectSub'),
      timeSub: byId('nexusTopTimeSub'),
      toolsSub: byId('nexusTopToolsSub'),
      scrim: byId('nexusShellScrim'),
      menuPanel: byId('nexusMenuPanel'),
      projectPanel: byId('nexusProjectPanel'),
      timePanel: byId('nexusTimelinePanel'),
      filesPanel: byId('nexusFilesPanel'),
      toolsPanel: byId('nexusToolsPanel'),
      fileInput: byId('nexusFileInput'),
      fileSelection: byId('nexusFileSelection'),
      themeToggle: byId('nexusThemeToggle'),
    };
    this.panels = [this.elements.menuPanel, this.elements.projectPanel, this.elements.timePanel, this.elements.filesPanel, this.elements.toolsPanel].filter(Boolean);
    this.tiles = [this.elements.menuTile, this.elements.projectTile, this.elements.timeTile, this.elements.filesTile, this.elements.toolsTile].filter(Boolean);
  }

  loadRole() {
    try {
      const saved = localStorage.getItem(this.roleKey);
      if (['Manager', 'Joiner', 'Electrician'].includes(saved)) return saved;
    } catch {}
    return 'Manager';
  }

  installRoleSwitcherInTools() {
    const panel = this.elements.toolsPanel;
    if (!panel || panel.querySelector('[data-nexus-role]')) return;
    const title = document.createElement('div');
    title.className = 'nexus-shell-section-title';
    title.textContent = 'Role / trade view';
    const grid = document.createElement('div');
    grid.className = 'nexus-role-grid nexus-tools-role-grid';
    grid.setAttribute('aria-label', 'Role / trade view');
    grid.innerHTML = '<button class="nexus-role-chip" type="button" data-nexus-role="Manager">Manager</button><button class="nexus-role-chip" type="button" data-nexus-role="Joiner">Joiner</button><button class="nexus-role-chip" type="button" data-nexus-role="Electrician">Electrician</button>';
    const head = panel.querySelector('.nexus-shell-panel-head');
    if (head) {
      head.insertAdjacentElement('afterend', title);
      title.insertAdjacentElement('afterend', grid);
    } else {
      panel.prepend(grid);
      panel.prepend(title);
    }
  }

  applyWorldLabel() {
    if (this.elements.projectSub) this.elements.projectSub.textContent = this.world === 'esafe-demo' ? 'e-SAFE' : 'RIVERSIDE';
    document.documentElement.dataset.nexusWorld = this.world;
  }

  bindTopRail() {
    this.elements.menuTile?.addEventListener('click', (event) => this.handleTile(event, this.elements.menuPanel));
    this.elements.projectTile?.addEventListener('click', (event) => this.handleTile(event, this.elements.projectPanel));
    this.elements.timeTile?.addEventListener('click', (event) => this.handleTile(event, this.elements.timePanel));
    this.elements.filesTile?.addEventListener('click', (event) => this.handleTile(event, this.elements.filesPanel));
    this.elements.toolsTile?.addEventListener('click', (event) => this.handleTile(event, this.elements.toolsPanel));
    this.elements.scrim?.addEventListener('click', () => this.closePanels());
  }

  handleTile(event, panel) {
    event.preventDefault();
    event.stopPropagation();
    this.openPanel(panel, event.currentTarget);
  }

  openPanel(panel, tile) {
    if (!panel) return;
    const wasOpen = panel.classList.contains(this.openClass);
    this.closePanels();
    if (wasOpen) return;
    panel.classList.add(this.openClass);
    panel.setAttribute('aria-hidden', 'false');
    this.elements.scrim?.classList.add(this.openClass);
    tile?.classList.add('active');
  }

  closePanels() {
    this.panels.forEach((panel) => {
      panel.classList.remove(this.openClass);
      panel.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('.nexus-shell-panel.open,.nexus-project-switcher.open').forEach((panel) => {
      panel.classList.remove(this.openClass);
      panel.setAttribute('aria-hidden', 'true');
    });
    this.elements.scrim?.classList.remove(this.openClass);
    this.tiles.forEach((tile) => tile.classList.remove('active'));
  }

  bindPanelActions() {
    document.querySelectorAll('[data-nexus-close-panel]').forEach((button) => button.addEventListener('click', () => this.closePanels()));
    document.querySelectorAll('[data-nexus-role]').forEach((button) => button.addEventListener('click', () => this.applyRole(button.dataset.nexusRole, { syncNative: true })));
    document.querySelectorAll('[data-nexus-focus]').forEach((button) => button.addEventListener('click', () => this.focusNode(button.dataset.nexusFocus)));
    document.querySelectorAll('[data-nexus-click-top]').forEach((button) => button.addEventListener('click', () => document.getElementById(button.dataset.nexusClickTop)?.click()));
    document.getElementById('nexusReloadView')?.addEventListener('click', () => this.reloadClean());
    document.getElementById('nexusPlayTimeline')?.addEventListener('click', () => this.toggleTimelinePlay());
    document.querySelectorAll('[data-nexus-time-mode]').forEach((button) => button.addEventListener('click', () => this.setTimelineMode(button.dataset.nexusTimeMode)));
  }

  bindProjectSwitcher() {
    document.querySelectorAll('[data-nexus-world-link]').forEach((button) => button.addEventListener('click', () => this.switchWorld(button.dataset.nexusWorldLink)));
  }

  bindFiles() {
    this.elements.fileInput?.addEventListener('change', () => {
      const count = this.elements.fileInput.files?.length || 0;
      if (this.elements.fileSelection) this.elements.fileSelection.textContent = count ? `${count} file${count === 1 ? '' : 's'} selected` : 'No files selected';
    });
  }

  bindTheme() {
    if (!this.elements.themeToggle) return;
    let saved = 'light';
    try { saved = localStorage.getItem(this.themeKey) || 'light'; } catch {}
    this.applyTheme(saved);
    this.elements.themeToggle.addEventListener('change', () => this.applyTheme(this.elements.themeToggle.checked ? 'light' : 'dark'));
  }

  bindKeyboard() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closePanels();
    });
  }

  applyTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.nexusTheme = next;
    if (this.elements.themeToggle) this.elements.themeToggle.checked = next === 'light';
    const label = document.getElementById('nexusMenuThemeSub');
    if (label) label.textContent = next.toUpperCase();
    try { localStorage.setItem(this.themeKey, next); } catch {}
  }

  applyRole(role, options = {}) {
    const next = ['Manager', 'Joiner', 'Electrician'].includes(role) ? role : 'Manager';
    this.role = next;
    document.documentElement.dataset.nexusRole = next.toLowerCase();
    if (this.elements.toolsSub) this.elements.toolsSub.textContent = next.toUpperCase();
    document.querySelectorAll('[data-nexus-role]').forEach((button) => {
      button.classList.toggle('active', button.dataset.nexusRole === next);
      button.setAttribute('aria-pressed', button.dataset.nexusRole === next ? 'true' : 'false');
    });
    try { localStorage.setItem(this.roleKey, next); } catch {}
    if (options.syncNative) this.syncNativeRole(next);
  }

  syncNativeRole(role) {
    const sync = () => {
      const native = Array.from(document.querySelectorAll('select')).find((select) => {
        if (select.closest('#nexusToolsPanel')) return false;
        const values = Array.from(select.options || []).map((option) => option.textContent?.trim());
        return values.includes('Manager') && values.includes('Joiner') && values.includes('Electrician');
      });
      if (!native) return;
      native.value = role;
      native.dispatchEvent(new Event('change', { bubbles: true }));
      native.classList.add('nexus-native-role-hidden');
      native.setAttribute('aria-hidden', 'true');
      native.tabIndex = -1;
      native.style.display = 'none';
      native.style.visibility = 'hidden';
      native.style.pointerEvents = 'none';
      const wrapper = native.closest('.nexus-top-role-slot,label,section,aside') || native.parentElement;
      if (wrapper && !wrapper.closest('#nexusToolsPanel')) {
        wrapper.classList.add('nexus-native-role-hidden');
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.style.display = 'none';
        wrapper.style.visibility = 'hidden';
        wrapper.style.pointerEvents = 'none';
      }
    };
    sync();
    requestAnimationFrame(sync);
    [250, 750, 1500].forEach((delay) => setTimeout(sync, delay));
  }

  switchWorld(world) {
    if (!world) return;
    const url = new URL(window.location.href);
    url.searchParams.set('world', world);
    url.searchParams.set('runtime', '4-project-clean');
    url.searchParams.set('v', `controller-${Date.now()}`);
    window.location.href = url.toString();
  }

  focusNode(nodeId) {
    this.closePanels();
    setTimeout(() => {
      const selector = `[data-node-id="${CSS.escape(nodeId)}"] button,[data-node-id="${CSS.escape(nodeId)}"]`;
      document.querySelector(selector)?.click?.();
    }, 60);
  }

  reloadClean() {
    const url = new URL(window.location.href);
    url.searchParams.set('runtime', '4-project-clean');
    url.searchParams.set('v', `controller-reload-${Date.now()}`);
    window.location.href = url.toString();
  }

  setTimelineMode(mode) {
    document.querySelectorAll('[data-nexus-time-mode]').forEach((button) => button.classList.toggle('active', button.dataset.nexusTimeMode === mode));
    document.documentElement.dataset.nexusTimeMode = mode || 'real';
  }

  toggleTimelinePlay() {
    const button = document.getElementById('nexusPlayTimeline');
    if (!button) return;
    const playing = button.dataset.playing === 'true';
    button.dataset.playing = playing ? 'false' : 'true';
    button.textContent = playing ? '▶' : 'Ⅱ';
  }

  installProjectDedupe() {
    if (!document.getElementById('nexusStaticProjectDedupeStyle')) {
      const style = document.createElement('style');
      style.id = 'nexusStaticProjectDedupeStyle';
      style.textContent = `
        #nexusMenuPanel>.nexus-shell-section-title:first-of-type,
        #nexusMenuPanel>.nexus-shell-section-title:first-of-type+.nexus-shell-list,
        #nexusMenuPanel [data-nexus-click-top="nexusTopProject"]{display:none!important;visibility:hidden!important;pointer-events:none!important}
      `;
      document.head.appendChild(style);
    }
    const rename = () => {
      const panelTitle = document.querySelector('#nexusProjectPanel .nexus-shell-panel-head strong');
      if (panelTitle) panelTitle.textContent = 'PROJECT SWITCHER';
      document.getElementById('nexusTopProject')?.setAttribute('aria-label', 'Open project switcher');
    };
    const hideBottomProjectDockTile = () => {
      const root = document.getElementById('root');
      if (!root) return;
      const bottomZoneTop = window.innerHeight * 0.62;
      root.querySelectorAll('button,a,[role="button"]').forEach((candidate) => {
        if (candidate.closest('.nexus-top-rail,.nexus-shell-panel,.nexus-project-switcher')) return;
        const label = String(candidate.innerText || candidate.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (label !== 'project' && label !== 'projects') return;
        const rect = candidate.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.top < bottomZoneTop) return;
        candidate.dataset.nexusHiddenDuplicateProject = 'true';
        candidate.style.display = 'none';
        candidate.style.visibility = 'hidden';
        candidate.style.pointerEvents = 'none';
        candidate.setAttribute('aria-hidden', 'true');
      });
    };
    const apply = () => { rename(); hideBottomProjectDockTile(); };
    apply();
    requestAnimationFrame(apply);
    [250, 750, 1500, 3000, 5000].forEach((delay) => setTimeout(apply, delay));
  }

  installTimelineClassicTapeSwitch() {
    const panel = this.elements.timePanel;
    if (!panel || panel.dataset.nexusTimelineViews === 'ready') return;
    panel.dataset.nexusTimelineViews = 'ready';

    if (!document.getElementById('nexusTimelineTapeSwitchStyle')) {
      const style = document.createElement('style');
      style.id = 'nexusTimelineTapeSwitchStyle';
      style.textContent = `
        .nexus-project-switcher{z-index:9025!important}.nexus-project-switcher.open{z-index:9025!important}
        .nexus-time-view-switch{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px 10px 8px;background:rgba(238,247,251,.78);position:sticky;top:49px;z-index:1;backdrop-filter:blur(10px)}
        .nexus-time-view-toggle{min-height:36px;border:1px solid rgba(31,112,139,.13);border-radius:13px;background:#fff;color:#667985;font:900 9px/1 Inter,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;box-shadow:inset 0 0 0 1px rgba(255,255,255,.5)}
        .nexus-time-view-toggle.active{border-color:rgba(20,142,170,.55);background:linear-gradient(180deg,#e8f9ff,#cceefa);color:#0b7890;box-shadow:0 0 0 2px rgba(20,142,170,.12)}
        .nexus-timeline-view{display:none}.nexus-timeline-view.active{display:block}
        .nexus-time-tape-shell{padding:2px 10px 14px}.nexus-time-tape-card{border:1px solid rgba(31,112,139,.12);border-radius:20px;background:linear-gradient(180deg,#fff,#e7f7fc);box-shadow:inset 0 0 0 1px rgba(255,255,255,.75),0 14px 28px rgba(8,37,51,.12);padding:12px;color:#102638}
        .nexus-time-tape-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.nexus-time-tape-title strong{font-size:11px;letter-spacing:.12em}.nexus-time-tape-title small{font-size:8px;color:#667985;font-weight:900;letter-spacing:.1em}
        .nexus-time-tape-deck{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center;border-radius:18px;background:linear-gradient(180deg,#dff4fa,#f7fdff);border:1px solid rgba(31,112,139,.1);padding:14px 12px;position:relative;overflow:hidden}.nexus-time-tape-deck:before{content:'';position:absolute;left:18%;right:18%;top:50%;height:6px;border-radius:999px;background:rgba(16,38,56,.16);transform:translateY(-50%)}
        .nexus-tape-reel{display:grid;place-items:center;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at center,#fff 0 15%,#93d9eb 16% 22%,#f7fdff 23% 36%,#54bad2 37% 41%,#eaf9fd 42% 58%,#1289a8 59% 62%,#f9feff 63% 100%);box-shadow:inset 0 0 18px rgba(8,37,51,.08),0 8px 18px rgba(8,37,51,.1);z-index:1}.nexus-tape-reel span{width:16px;height:16px;border-radius:50%;background:#102638;box-shadow:0 0 0 5px rgba(255,255,255,.88)}
        .nexus-time-tape-controls{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.nexus-tape-control{min-height:38px;border:1px solid rgba(31,112,139,.12);border-radius:13px;background:#fff;color:#102638;font:900 14px/1 Inter,Arial,sans-serif}.nexus-tape-control.play{background:linear-gradient(145deg,#1789ed,#5bb8ff);color:#fff;border-color:transparent}
        .nexus-time-tape-track{margin-top:10px;height:8px;border-radius:999px;background:linear-gradient(90deg,#1598c4 0 72%,rgba(31,112,139,.16) 72% 100%);box-shadow:inset 0 0 0 1px rgba(31,112,139,.1)}.nexus-time-tape-caption{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-top:8px;font-size:9px;color:#667985;font-weight:800}.nexus-time-tape-caption strong{font-size:10px;color:#102638}.nexus-time-tape-caption code{font-size:8px;background:rgba(20,142,170,.1);border-radius:999px;padding:4px 7px;color:#0b7890}
      `;
      document.head.appendChild(style);
    }

    const head = panel.querySelector('.nexus-shell-panel-head');
    const classic = document.createElement('div');
    classic.className = 'nexus-timeline-view nexus-timeline-view-classic active';
    classic.dataset.nexusTimelineViewContent = 'classic';
    Array.from(panel.children).forEach((child) => {
      if (child !== head) classic.appendChild(child);
    });

    const switcher = document.createElement('div');
    switcher.className = 'nexus-time-view-switch';
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', 'Timeline view');
    switcher.innerHTML = '<button class="nexus-time-view-toggle active" type="button" data-nexus-timeline-view="classic" aria-pressed="true">Classic</button><button class="nexus-time-view-toggle" type="button" data-nexus-timeline-view="tape" aria-pressed="false">Tape</button>';

    const tape = document.createElement('div');
    tape.className = 'nexus-timeline-view nexus-timeline-view-tape';
    tape.dataset.nexusTimelineViewContent = 'tape';
    tape.setAttribute('aria-hidden', 'true');
    tape.innerHTML = `
      <div class="nexus-time-tape-shell"><div class="nexus-time-tape-card">
        <div class="nexus-time-tape-title"><strong>PROJECT TIME DECK</strong><small>e-SAFE · replay</small></div>
        <div class="nexus-time-tape-deck" aria-label="Record tape player timeline view"><div class="nexus-tape-reel"><span></span></div><div class="nexus-tape-reel"><span></span></div></div>
        <div class="nexus-time-tape-controls"><button class="nexus-tape-control" type="button" data-nexus-time-mode="real">●</button><button class="nexus-tape-control play" type="button" id="nexusTapePlayTimeline">▶</button><button class="nexus-tape-control" type="button" data-nexus-time-mode="replay">↺</button><button class="nexus-tape-control" type="button" data-nexus-time-mode="simulation">◇</button></div>
        <div class="nexus-time-tape-track"></div><div class="nexus-time-tape-caption"><span><strong>8 Aug 2026</strong><br>25 Jul 2026 → 8 Aug 2026 · Testing</span><code>72%</code></div>
      </div></div>`;

    if (head) head.insertAdjacentElement('afterend', switcher);
    else panel.prepend(switcher);
    switcher.insertAdjacentElement('afterend', classic);
    classic.insertAdjacentElement('afterend', tape);

    const setView = (view) => {
      const next = view === 'tape' ? 'tape' : 'classic';
      panel.querySelectorAll('[data-nexus-timeline-view]').forEach((button) => {
        const active = button.dataset.nexusTimelineView === next;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      panel.querySelectorAll('[data-nexus-timeline-view-content]').forEach((section) => {
        const active = section.dataset.nexusTimelineViewContent === next;
        section.classList.toggle('active', active);
        section.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      if (this.elements.timeSub) this.elements.timeSub.textContent = next === 'tape' ? 'TAPE' : 'CLASSIC';
      document.documentElement.dataset.nexusTimelineView = next;
    };

    switcher.querySelectorAll('[data-nexus-timeline-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.nexusTimelineView)));
    panel.querySelectorAll('[data-nexus-time-mode]').forEach((button) => button.addEventListener('click', () => this.setTimelineMode(button.dataset.nexusTimeMode)));
    document.getElementById('nexusTapePlayTimeline')?.addEventListener('click', () => document.getElementById('nexusPlayTimeline')?.click());
    setView('classic');
  }

  markReady() {
    document.documentElement.dataset.nexusShellController = 'ready';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new NexusRelationshipTreeShellController().init();
});
