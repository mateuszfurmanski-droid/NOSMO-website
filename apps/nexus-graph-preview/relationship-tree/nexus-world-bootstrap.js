// NEXUS_WORLD_BOOTSTRAP_V1_RESTORED
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
  load('__NEXUS_TRADE_GRAPH_RUNTIME_INSTALLED__','./nexus-trade-graph-runtime.js?v=2');
  if(world==='esafe-demo')load('__NEXUS_ESAFE_GRAPH_RUNTIME_INSTALLED__','./nexus-esafe-graph-runtime.js?v=2');
})();
