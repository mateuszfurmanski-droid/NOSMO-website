// NEXUS_PROJECT_TIME_ISOLATED_LOADER_20260817
(()=>{
  if(window.__NEXUS_PROJECT_TIME_ISOLATED_LOADER__)return;
  window.__NEXUS_PROJECT_TIME_ISOLATED_LOADER__=true;
  const version='ticker-single-safe-20260817a';
  const tuneVersion='project-time-thin-status-knob-20260817a';
  const dockVersion='bottom-dock-time-tile-20260817a';
  const timeChipVersion='top-time-chip-20260817a';
  const compactTopVersion='compact-top-shell-20260817a';
  const appendCss=(id,href)=>{
    if(document.getElementById(id))return;
    const link=document.createElement('link');
    link.id=id;
    link.rel='stylesheet';
    link.href=href;
    document.head.appendChild(link);
  };
  const appendJs=(id,src)=>{
    if(document.getElementById(id))return;
    const script=document.createElement('script');
    script.id=id;
    script.defer=true;
    script.src=src;
    document.head.appendChild(script);
  };
  const loadCss=()=>{
    appendCss('nexusProjectTimeIsoCss',`./nexus-project-time-instrument.css?v=${version}`);
    appendCss('nexusProjectTimeIsoTuneCss',`./nexus-project-time-instrument-tune.css?v=${tuneVersion}`);
    appendCss('nexusCompactTopShellCss',`./nexus-compact-top-shell.css?v=${compactTopVersion}`);
  };
  const loadJs=()=>appendJs('nexusProjectTimeIsoScript',`./nexus-project-time-instrument.js?v=${version}`);
  const loadDockBridge=()=>appendJs('nexusBottomDockBridgeScript',`./nexus-bottom-dock-bridge.js?v=${dockVersion}`);
  const loadTopTimeChip=()=>appendJs('nexusTopTimeChipScript',`./nexus-top-time-chip.js?v=${timeChipVersion}`);
  const start=()=>{loadCss();loadJs();loadDockBridge();loadTopTimeChip();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
