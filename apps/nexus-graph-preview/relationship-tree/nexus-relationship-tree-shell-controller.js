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
    this.watchNativeControls();
    this.markReady();
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
    this.panels = [
      this.elements.menuPanel,
      this.elements.projectPanel,
      this.elements.timePanel,
      this.elements.filesPanel,
      this.elements.toolsPanel,
    ].filter(Boolean);
    this.tiles = [
      this.elements.menuTile,
      this.elements.projectTile,
      this.elements.timeTile,
      this.elements.filesTile,
      this.elements.toolsTile,
    ].filter(Boolean);
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
    grid.innerHTML = `
      <button class="nexus-role-chip" type="button" data-nexus-role="Manager">Manager</button>
      <button class="nexus-role-chip" type="button" data-nexus-role="Joiner">Joiner</button>
      <button class="nexus-role-chip" type="button" data-nexus-role="Electrician">Electrician</button>
    `;

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
    if (this.elements.projectSub) {
      this.elements.projectSub.textContent = this.world === 'esafe-demo' ? 'e-SAFE' : 'RIVERSIDE';
    }
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
    document.querySelectorAll('.nexus-shell-panel.open, .nexus-project-switcher.open').forEach((panel) => {
      panel.classList.remove(this.openClass);
      panel.setAttribute('aria-hidden', 'true');
    });
    this.elements.scrim?.classList.remove(this.openClass);
    this.tiles.forEach((tile) => tile.classList.remove('active'));
  }

  bindPanelActions() {
    document.querySelectorAll('[data-nexus-close-panel]').forEach((button) => {
      button.addEventListener('click', () => this.closePanels());
    });
    document.querySelectorAll('[data-nexus-role]').forEach((button) => {
      button.addEventListener('click', () => this.applyRole(button.dataset.nexusRole, { syncNative: true }));
    });
    document.querySelectorAll('[data-nexus-focus]').forEach((button) => {
      button.addEventListener('click', () => this.focusNode(button.dataset.nexusFocus));
    });
    document.querySelectorAll('[data-nexus-click-top]').forEach((button) => {
      button.addEventListener('click', () => document.getElementById(button.dataset.nexusClickTop)?.click());
    });
    document.getElementById('nexusReloadView')?.addEventListener('click', () => this.reloadClean());
    document.getElementById('nexusPlayTimeline')?.addEventListener('click', () => this.toggleTimelinePlay());
    document.querySelectorAll('[data-nexus-time-mode]').forEach((button) => {
      button.addEventListener('click', () => this.setTimelineMode(button.dataset.nexusTimeMode));
    });
  }

  bindProjectSwitcher() {
    document.querySelectorAll('[data-nexus-world-link]').forEach((button) => {
      button.addEventListener('click', () => this.switchWorld(button.dataset.nexusWorldLink));
    });
  }

  bindFiles() {
    this.elements.fileInput?.addEventListener('change', () => {
      const count = this.elements.fileInput.files?.length || 0;
      if (this.elements.fileSelection) {
        this.elements.fileSelection.textContent = count ? `${count} file${count === 1 ? '' : 's'} selected` : 'No files selected';
      }
    });
  }

  bindTheme() {
    if (!this.elements.themeToggle) return;
    let saved = 'light';
    try { saved = localStorage.getItem(this.themeKey) || 'light'; } catch {}
    this.applyTheme(saved);
    this.elements.themeToggle.addEventListener('change', () => {
      this.applyTheme(this.elements.themeToggle.checked ? 'light' : 'dark');
    });
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
    const native = this.findNativeRoleSelect();
    if (!native) return;
    native.value = role;
    native.dispatchEvent(new Event('change', { bubbles: true }));
    this.hideNativeRoleSelect(native);
  }

  findNativeRoleSelect() {
    return Array.from(document.querySelectorAll('select')).find((select) => {
      if (select.closest('#nexusToolsPanel')) return false;
      const values = Array.from(select.options || []).map((option) => option.textContent?.trim());
      return values.includes('Manager') && values.includes('Joiner') && values.includes('Electrician');
    });
  }

  hideNativeRoleSelect(native) {
    if (!native) return;
    native.classList.add('nexus-native-role-hidden');
    native.setAttribute('aria-hidden', 'true');
    native.tabIndex = -1;
    native.style.display = 'none';
    native.style.visibility = 'hidden';
    native.style.pointerEvents = 'none';

    const wrapper = native.closest('.nexus-top-role-slot, label, section, aside') || native.parentElement;
    if (wrapper && !wrapper.closest('#nexusToolsPanel')) {
      wrapper.classList.add('nexus-native-role-hidden');
      wrapper.setAttribute('aria-hidden', 'true');
      wrapper.style.display = 'none';
      wrapper.style.visibility = 'hidden';
      wrapper.style.pointerEvents = 'none';
    }
  }

  watchNativeControls() {
    const hideNative = () => {
      const native = this.findNativeRoleSelect();
      if (native) {
        native.value = this.role;
        this.hideNativeRoleSelect(native);
      }
    };
    hideNative();
    const observer = new MutationObserver(hideNative);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 20000);
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
      const selector = `[data-node-id="${CSS.escape(nodeId)}"] button, [data-node-id="${CSS.escape(nodeId)}"]`;
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
    document.querySelectorAll('[data-nexus-time-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.nexusTimeMode === mode);
    });
    document.documentElement.dataset.nexusTimeMode = mode || 'real';
  }

  toggleTimelinePlay() {
    const button = document.getElementById('nexusPlayTimeline');
    if (!button) return;
    const playing = button.dataset.playing === 'true';
    button.dataset.playing = playing ? 'false' : 'true';
    button.textContent = playing ? '▶' : 'Ⅱ';
  }

  markReady() {
    document.documentElement.dataset.nexusShellController = 'ready';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new NexusRelationshipTreeShellController().init();
});
