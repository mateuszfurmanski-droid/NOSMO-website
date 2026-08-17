// NEXUS_PROJECT_TIME_ISOLATED_LOADER_20260817
(()=>{
  if(window.__NEXUS_PROJECT_TIME_ISOLATED_LOADER__)return;
  window.__NEXUS_PROJECT_TIME_ISOLATED_LOADER__=true;
  const version='isolated-time-20260817a';
  const loadCss=()=>{
    if(document.getElementById('nexusProjectTimeIsoCss'))return;
    const link=document.createElement('link');
    link.id='nexusProjectTimeIsoCss';
    link.rel='stylesheet';
    link.href=`./nexus-project-time-instrument.css?v=${version}`;
    document.head.appendChild(link);
  };
  const loadJs=()=>{
    if(document.getElementById('nexusProjectTimeIsoScript'))return;
    const script=document.createElement('script');
    script.id='nexusProjectTimeIsoScript';
    script.defer=true;
    script.src=`./nexus-project-time-instrument.js?v=${version}`;
    document.head.appendChild(script);
  };
  const start=()=>{loadCss();loadJs();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
