// NEXUS_FUNCTIONAL_WORKBENCH_DISABLED_20260819
// Emergency kill-switch: this add-on must not render a second top bar.
(()=>{
  const kill=()=>{
    document.getElementById('nexusFunctionalWorkbench')?.remove();
    document.body?.classList.remove('nexus-functional-workbench-on');
    document.documentElement?.classList.remove('nexus-functional-workbench-on');
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',kill,{once:true});else kill();
  setTimeout(kill,50);
  setTimeout(kill,250);
  setTimeout(kill,900);
  window.addEventListener('pageshow',kill,{passive:true});
})();
