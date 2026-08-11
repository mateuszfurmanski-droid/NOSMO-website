// NEXUS_WORLD_BOOTSTRAP_V4_PROJECT_CLEAN
(()=>{
  if(window.__NEXUS_WORLD_BOOTSTRAPPED__)return;
  window.__NEXUS_WORLD_BOOTSTRAPPED__=true;
  const world=window.__NEXUS_PROJECT_WORLD__||'dev';
  const load=(flag,path)=>{
    if(window[flag])return;
    try{
      const request=new XMLHttpRequest();
      request.open('GET',path,false);
      request.send(null);
      if(request.status>=200&&request.status<300){
        (0,eval)(`${request.responseText}\n//# sourceURL=${path.split('?')[0]}`);
      }else console.warn('[NOSMO] World bootstrap failed',path,request.status);
    }catch(error){console.error('[NOSMO] World bootstrap failed',path,error)}
  };

  if(world==='esafe-demo'){
    // e-SAFE is its own Project World. Do not let the dev/file-sorting runtime mutate the bundle first.
    window.__NEXUS_TRADE_GRAPH_RUNTIME_INSTALLED__=true;
    load('__NEXUS_ESAFE_GRAPH_RUNTIME_INSTALLED__','./nexus-esafe-graph-runtime.js?v=4-project-clean');
    return;
  }

  load('__NEXUS_TRADE_GRAPH_RUNTIME_INSTALLED__','./nexus-trade-graph-runtime.js?v=2');
})();
