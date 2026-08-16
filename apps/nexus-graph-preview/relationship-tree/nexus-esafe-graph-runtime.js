// NEXUS_ESAFE_GRAPH_RUNTIME_V4_PROJECT_CLEAN
(()=>{
  if(window.__NEXUS_ESAFE_GRAPH_RUNTIME_INSTALLED__)return;
  if((window.__NEXUS_PROJECT_WORLD__||'')!=='esafe-demo')return;
  window.__NEXUS_ESAFE_GRAPH_RUNTIME_INSTALLED__=true;
  window.__NEXUS_TRADE_GRAPH_RUNTIME_INSTALLED__=true;

  const bundlePath='/apps/nexus-graph-preview/assets/index-CWI-Glgh.js';
  const tradeGroups=[
    ['Structural / Seismic','esafe-trade-structural'],
    ['MEP / Energy','esafe-trade-mep'],
    ['Electrical / Controls','esafe-trade-electrical'],
    ['BIM / Digital','esafe-trade-bim'],
    ['Fabrication / Installation','esafe-trade-fabrication'],
    ['Survey / QA','esafe-trade-survey'],
    ['Project / General','esafe-trade-general']
  ];
  const fallbackIds={
    'Structural / Seismic':'p-mateusz',
    'MEP / Energy':'p-sitemgr',
    'Electrical / Controls':'p-architect',
    'BIM / Digital':'p-client',
    'Fabrication / Installation':'p-team',
    'Survey / QA':'d-groundfloor',
    'Project / General':'d-doorschedule'
  };
  const coreDocs=[
    {id:'esafe-core-6260847',label:'D5.1 · Detailed survey of the real pilot',date:'2022-02-24',trade:'Survey / QA'},
    {id:'esafe-core-6497142',label:'D2.2 · 3D physical and digital models',date:'2022-04-27',trade:'BIM / Digital'},
    {id:'esafe-core-19114712',label:'D5.5 · Monitoring activities',date:'2026-03-19',trade:'Survey / QA'},
    {id:'esafe-core-19126519',label:'D5.4 · Production and delivery',date:'2026-03-20',trade:'Fabrication / Installation'},
    {id:'esafe-core-19126674',label:'D5.3 · Detailed design for renovation',date:'2026-03-20',trade:'Structural / Seismic'}
  ];
  const fallbackDocs=[
    ['d-snaglist','D5.1 · Detailed survey of the real pilot','document','Survey / QA'],
    ['d-firecerts','D2.2 · 3D physical and digital models','document','BIM / Digital'],
    ['t-install','D5.5 · Monitoring activities','document','Survey / QA'],
    ['t-snag','D5.4 · Production and delivery','document','Fabrication / Installation'],
    ['t-fire','D5.3 · Detailed design for renovation','document','Structural / Seismic'],
    ['t-walkthrough','Pilot Actions','task','Project / General']
  ];

  const js=value=>JSON.stringify(String(value??''));
  const safeRecords=()=>Array.isArray(window.ESAFE_RECORDS)?window.ESAFE_RECORDS.slice():[];
  const tradeId=trade=>(tradeGroups.find(([label])=>label===trade)||tradeGroups[tradeGroups.length-1])[1];

  function loadData(){
    if(Array.isArray(window.ESAFE_RECORDS)&&window.ESAFE_RECORDS.length)return;
    try{
      const request=new XMLHttpRequest();
      request.open('GET','/apps/nexus-esafe-demo/data.js?v=2',false);
      request.send(null);
      if(request.status>=200&&request.status<300)(0,eval)(`${request.responseText}\n//# sourceURL=esafe-data.js`);
    }catch(error){console.warn('[NOSMO] e-SAFE data bootstrap failed',error)}
  }
  loadData();

  function patchBundle(source){
    const graphNodes=[
      '{id:"proj",label:"e-SAFE Catania Real Pilot",sublabel:"Project World · real pilot dataset",type:"project",Icon:Dt}',
      '{id:"p-sitemgr",label:"e-SAFE Pilot Coordinator",sublabel:"Project coordination",type:"person",Icon:jc}'
    ];
    for(const [label,id] of tradeGroups){
      graphNodes.push(`{id:${js(id)},label:${js(label)},sublabel:"Trade branch · e-SAFE",type:"task",Icon:jc}`);
    }
    for(const doc of coreDocs){
      graphNodes.push(`{id:${js(doc.id)},label:${js(doc.label)},sublabel:"CORE PILOT RECORD",type:"document",Icon:Rh,receivedAt:${js(`${doc.date}T00:00:00Z`)}}`);
    }

    const nodePattern=/const ts="proj",Zr="p-sitemgr",ns=\[[\s\S]*?\],rc=/;
    if(!nodePattern.test(source)){
      console.warn('[NOSMO] e-SAFE node list marker not found');
      return source;
    }
    source=source.replace(nodePattern,`const ts="proj",Zr="p-sitemgr",ns=[${graphNodes.join(',')}],rc=`);
    source=source.replace(/rc=\{[\s\S]*?\},dU=/,'rc={},dU=');

    const edgePairs=[['proj','p-sitemgr']];
    for(const [,id] of tradeGroups)edgePairs.push(['proj',id]);
    for(const doc of coreDocs)edgePairs.push([tradeId(doc.trade),doc.id]);
    const edgeCode=edgePairs.map(([from,to])=>`[${js(from)},${js(to)}]`).join(',');
    source=source.replace(/dU=\[[\s\S]*?\],gc=/,`dU=[${edgeCode}],gc=`);
    window.__NEXUS_ESAFE_GRAPH__={project:'e-SAFE Catania Real Pilot',tradeGroups,coreDocs};
    return source;
  }

  const originalFetch=window.fetch.bind(window);
  window.fetch=async(...args)=>{
    const response=await originalFetch(...args);
    const input=args[0];
    const url=typeof input==='string'?input:(input?.url||'');
    if(!String(url).includes(bundlePath))return response;
    try{
      const text=await response.clone().text();
      return new Response(patchBundle(text),{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch(error){console.error('[NOSMO] e-SAFE graph patch failed',error);return response}
  };

  const nodeParts=node=>{
    const button=node?.querySelector(':scope > button')||node?.querySelector('button');
    if(!button)return{};
    const spans=Array.from(button.children).filter(el=>el instanceof HTMLElement&&el.tagName==='SPAN');
    const typeSpan=spans.find(span=>['project','person','task','document','issue','module'].includes((span.textContent||'').trim().toLowerCase()));
    const content=spans.filter(span=>span!==typeSpan&&!span.querySelector('svg')&&!span.classList.contains('esafe-world-count'));
    return{button,typeSpan,labelSpan:content.find(span=>(span.textContent||'').trim()),subSpan:content.slice(1).find(span=>(span.textContent||'').trim())};
  };
  const setNodePresentation=(id,label,type,sublabel='')=>{
    const node=document.querySelector(`[data-node-id="${id}"]`);
    const {button,typeSpan,labelSpan,subSpan}=nodeParts(node);
    if(!button)return false;
    if(labelSpan)labelSpan.textContent=label;
    if(typeSpan&&type)typeSpan.textContent=String(type).toUpperCase();
    if(subSpan&&sublabel)subSpan.textContent=sublabel;
    button.setAttribute('aria-label',`${type||'node'}: ${label}`);
    node.dataset.esafeMapped='true';
    node.style.display='';
    return true;
  };
  const setCountBadge=(id,text)=>{
    const node=document.querySelector(`[data-node-id="${id}"]`);
    const {button}=nodeParts(node);
    if(!button)return;
    let badge=button.querySelector(':scope > .esafe-world-count');
    if(!badge){
      badge=document.createElement('span');
      badge.className='esafe-world-count';
      badge.style.cssText='border:1px solid rgba(34,211,238,.24);border-radius:999px;background:rgba(8,47,73,.78);padding:2px 6px;font-size:7px;font-weight:800;letter-spacing:.06em;color:#67e8f9;white-space:nowrap';
      button.appendChild(badge);
    }
    badge.textContent=text;
  };

  function applyIdentity(){
    setNodePresentation('proj','e-SAFE Catania Real Pilot','project','Project World · real pilot dataset');
    setNodePresentation('p-sitemgr','e-SAFE Pilot Coordinator','person','Project coordination');
    const projectSub=document.querySelector('#nexusTopProject .nexus-top-sub');
    if(projectSub)projectSub.textContent='e-SAFE';
    const timelineTitle=document.getElementById('nexusTimeProjectTitle');
    if(timelineTitle)timelineTitle.textContent='e-SAFE · PROJECT TIMELINE';
    document.documentElement.dataset.nexusWorld='esafe-demo';
    document.documentElement.dataset.esafeWorld='true';
    document.title='NOSMO Nexus™ — e-SAFE Catania';
    try{localStorage.setItem('nexus.activeProjectWorld','esafe-demo');localStorage.removeItem('nexus.activeProject')}catch{}
  }

  function fallbackClean(){
    let changed=false;
    if(!document.querySelector('[data-node-id="esafe-trade-structural"]')){
      for(const [label] of tradeGroups){
        changed=setNodePresentation(fallbackIds[label],label,'task','Trade branch · e-SAFE')||changed;
      }
      for(const [id,label,type] of fallbackDocs){
        changed=setNodePresentation(id,label,type,'e-SAFE project record')||changed;
      }
    }
    const allowed=new Set(['proj','p-sitemgr',...tradeGroups.map(([,id])=>id),...coreDocs.map(doc=>doc.id),...Object.values(fallbackIds),...fallbackDocs.map(([id])=>id)]);
    document.querySelectorAll('[data-node-id]').forEach(node=>{
      const id=node.getAttribute('data-node-id');
      if(!id||allowed.has(id))return;
      node.style.display='none';
      node.dataset.esafeHiddenRiverside='true';
    });
    if(changed)document.documentElement.dataset.esafeFallbackHydrated='true';
  }

  function render(progress=1){
    applyIdentity();
    fallbackClean();
    const all=safeRecords().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const filesSub=document.querySelector('#nexusTopFiles .nexus-top-sub');
    if(!all.length){if(filesSub)filesSub.textContent='e-SAFE FILES';return}
    const p=Math.max(0,Math.min(1,Number(progress)||0));
    const first=Date.parse(`${all[0].date}T00:00:00Z`);
    const last=Date.parse(`${all[all.length-1].date}T00:00:00Z`);
    const cutoff=first+(last-first)*p;
    const visible=all.filter(record=>Date.parse(`${record.date}T23:59:59Z`)<=cutoff);
    const totalFiles=visible.reduce((sum,record)=>sum+(record.files?.length||0),0);
    if(filesSub)filesSub.textContent=`${totalFiles} FILES`;
    const totals={};
    for(const [label] of tradeGroups)totals[label]=0;
    for(const doc of coreDocs)totals[doc.trade]=(totals[doc.trade]||0)+1;
    for(const [label,id] of tradeGroups){
      const target=document.querySelector(`[data-node-id="${id}"]`)?id:fallbackIds[label];
      setCountBadge(target,`${totals[label]||0} core records`);
    }
    const selection=document.getElementById('nexusFileSelection');
    if(selection&&selection.textContent==='No files selected')selection.textContent=`e-SAFE source library · ${totalFiles} visible files`;
  }

  const scan=(attempt=0)=>{
    if(document.querySelector('[data-node-id="proj"]')){render(1);return}
    if(attempt<80)setTimeout(()=>scan(attempt+1),100);
  };
  window.addEventListener('nexus:project-time-change',event=>render(event.detail?.progress??1));
  window.addEventListener('DOMContentLoaded',()=>scan());
  setTimeout(()=>scan(),500);
  setTimeout(()=>scan(),1400);
})();
