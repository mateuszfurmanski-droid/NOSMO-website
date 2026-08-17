// NEXUS_PROJECT_TIME_ISOLATED_LOADER_20260817
(()=>{
  if(window.__NEXUS_PROJECT_TIME_ISOLATED_LOADER__)return;
  window.__NEXUS_PROJECT_TIME_ISOLATED_LOADER__=true;
  const version='ticker-single-safe-20260817a';
  const tuneVersion='project-time-thin-status-knob-20260817a';
  const dockVersion='bottom-dock-bridge-20260817a';
  const timeChipVersion='top-time-chip-20260817a';
  const loadCss=()=>{
    if(!document.getElementById('nexusProjectTimeIsoCss')){
      const link=document.createElement('link');
      link.id='nexusProjectTimeIsoCss';
      link.rel='stylesheet';
      link.href=`./nexus-project-time-instrument.css?v=${version}`;
      document.head.appendChild(link);
    }
    if(!document.getElementById('nexusProjectTimeIsoTuneCss')){
      const tune=document.createElement('link');
      tune.id='nexusProjectTimeIsoTuneCss';
      tune.rel='stylesheet';
      tune.href=`./nexus-project-time-instrument-tune.css?v=${tuneVersion}`;
      document.head.appendChild(tune);
    }
  };
  const loadJs=()=>{
    if(document.getElementById('nexusProjectTimeIsoScript'))return;
    const script=document.createElement('script');
    script.id='nexusProjectTimeIsoScript';
    script.defer=true;
    script.src=`./nexus-project-time-instrument.js?v=${version}`;
    document.head.appendChild(script);
  };
  const loadDockBridge=()=>{
    if(document.getElementById('nexusBottomDockBridgeScript'))return;
    const script=document.createElement('script');
    script.id='nexusBottomDockBridgeScript';
    script.defer=true;
    script.src=`./nexus-bottom-dock-bridge.js?v=${dockVersion}`;
    document.head.appendChild(script);
  };
  const loadTopTimeChip=()=>{
    if(document.getElementById('nexusTopTimeChipScript'))return;
    const script=document.createElement('script');
    script.id='nexusTopTimeChipScript';
    script.defer=true;
    script.src=`./nexus-top-time-chip.js?v=${timeChipVersion}`;
    document.head.appendChild(script);
  };
  const start=()=>{loadCss();loadJs();loadDockBridge();loadTopTimeChip();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
