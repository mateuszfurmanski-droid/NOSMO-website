// NEXUS_SHELL_UNIFIED_RECOVERY_DISABLED_20260813B
// Disabled after Android Chrome live regression where #root stayed on Loading and top shell blocked clicks.
// Keep this file as a forensic placeholder only. Do not boot runtime patches from here.
(()=>{
  window.__NEXUS_SHELL_UNIFIED_RECOVERY_INSTALLED__ = true;
  document.documentElement.dataset.nexusUnifiedRecovery = 'disabled-after-live-regression';
})();
