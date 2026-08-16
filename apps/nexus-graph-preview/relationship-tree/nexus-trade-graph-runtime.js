// NEXUS_TRADE_GRAPH_RUNTIME_V1
(()=>{
  if(window.__NEXUS_TRADE_GRAPH_RUNTIME_INSTALLED__)return;
  window.__NEXUS_TRADE_GRAPH_RUNTIME_INSTALLED__=true;

  const bundlePath='/apps/nexus-graph-preview/assets/index-CWI-Glgh.js';
  const indexKey='nexus.tradeFileIndex.v1';
  const richExtensions=new Set(['pdf','docx','xlsx','xlsm']);
  const tradeRoots={
    'joinery':{id:'m-joinery',label:'Joinery'},
    'fire-doors':{id:'m-fire-doors',label:'Fire Doors'},
    'electrical':{id:'m-electrical',label:'Electrical'},
    'plumbing':{id:'m-plumbing',label:'Plumbing'},
    'hvac':{id:'m-hvac',label:'HVAC'},
    'drylining':{id:'m-drylining',label:'Drylining'},
    'site-management':{id:'m-site-management',label:'Site Management'}
  };

  const readIndex=()=>{
    try{
      const parsed=JSON.parse(localStorage.getItem(indexKey)||'[]');
      return Array.isArray(parsed)?parsed.slice(-60):[];
    }catch{return[]}
  };

  const extOf=name=>String(name||'').split('.').pop()?.toLowerCase()||'';
  const hash=value=>{
    let h=2166136261;
    const text=String(value||'');
    for(let i=0;i<text.length;i+=1){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
    return(h>>>0).toString(36);
  };
  const js=value=>JSON.stringify(String(value??''));

  const graphDocuments=()=>readIndex().map((file,index)=>{
    const primary=tradeRoots[file.primaryTrade]?file.primaryTrade:'site-management';
    const confidence=Math.round(Math.max(0,Math.min(1,Number(file.confidence)||0))*100);
    const format=(file.contentFormat||extOf(file.name)||'file').toUpperCase();
    const id=`u-doc-${hash(`${file.name}|${file.size}|${file.lastModified}|${index}`)}`;
    return{
      id,
      label:String(file.name||'Project document').slice(0,92),
      sublabel:`${format} · ${tradeRoots[primary].label} · ${confidence}%`,
      primary,
      receivedAt:file.classifiedAt||new Date().toISOString(),
      ext:extOf(file.name)
    };
  });

  function patchBundle(source){
    const docs=graphDocuments();
    const additionalRoots=Object.entries(tradeRoots)
      .filter(([trade])=>trade!=='electrical')
      .map(([,root])=>`{id:${js(root.id)},label:${js(root.label)},sublabel:"Trade system",type:"module",Icon:jc}`);
    const docNodes=docs.map(doc=>{
      const icon=doc.ext==='pdf'?'Rh':(['xlsx','xlsm'].includes(doc.ext)?'Mw':'hn');
      return `{id:${js(doc.id)},label:${js(doc.label)},sublabel:${js(doc.sublabel)},type:"document",Icon:${icon},receivedAt:${js(doc.receivedAt)}}`;
    });

    const nodeMarker='{id:"t-doorkits",label:"Prepare Level 1 Door Kits",sublabel:"Awaiting assignment",type:"task",Icon:mn}],rc={';
    if(!source.includes(nodeMarker)){
      console.warn('[NOSMO] Trade graph node marker not found');
      return source;
    }
    const injected=[...additionalRoots,...docNodes];
    if(injected.length){
      source=source.replace(nodeMarker,`{id:"t-doorkits",label:"Prepare Level 1 Door Kits",sublabel:"Awaiting assignment",type:"task",Icon:mn},${injected.join(',')}],rc={`);
    }

    const edgeMarker='dU=[["p-team","p-mateusz"],["p-team","p-sitemgr"],["p-team","p-architect"],["p-sitemgr","p-client"]]';
    const edges=[];
    for(const doc of docs){
      const root=tradeRoots[doc.primary]?.id||tradeRoots['site-management'].id;
      edges.push(`[${js(root)},${js(doc.id)}]`);
    }
    if(edges.length&&source.includes(edgeMarker)){
      source=source.replace(edgeMarker,`dU=[["p-team","p-mateusz"],["p-team","p-sitemgr"],["p-team","p-architect"],["p-sitemgr","p-client"],${edges.join(',')}]`);
    }

    window.__NEXUS_TRADE_GRAPH_RUNTIME__={documents:docs,tradeRoots};
    return source;
  }

  const originalFetch=window.fetch.bind(window);
  window.fetch=async(...args)=>{
    const response=await originalFetch(...args);
    try{
      const input=args[0];
      const url=typeof input==='string'?input:(input?.url||'');
      if(!String(url).includes(bundlePath))return response;
      const text=await response.text();
      const patched=patchBundle(text);
      return new Response(patched,{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch(error){
      console.error('[NOSMO] Trade graph bundle patch failed',error);
      return response;
    }
  };

  const focusTrade=tradeId=>{
    if(tradeId==='all'){
      setTimeout(()=>document.querySelector('[data-node-id="proj"] button')?.click(),70);
      return;
    }
    const nodeId=tradeRoots[tradeId]?.id;
    if(nodeId)setTimeout(()=>document.querySelector(`[data-node-id="${nodeId}"] button`)?.click(),70);
  };
  window.addEventListener('nexus:trade-change',event=>focusTrade(event.detail?.tradeId||'all'));

  let reloadTimer=null;
  const scheduleGraphReload=delay=>{
    clearTimeout(reloadTimer);
    reloadTimer=setTimeout(()=>{
      try{sessionStorage.setItem('nexus.tradeGraphReloadedAt',String(Date.now()))}catch{}
      window.location.reload();
    },delay);
  };
  window.addEventListener('nexus:files-trade-enriched',()=>scheduleGraphReload(450));
  window.addEventListener('nexus:files-trade-classified',event=>{
    const files=Array.from(event.detail?.files||[]);
    const onlySimple=files.length&&files.every(file=>!richExtensions.has(extOf(file.name)));
    if(onlySimple)scheduleGraphReload(450);
  });
})();
