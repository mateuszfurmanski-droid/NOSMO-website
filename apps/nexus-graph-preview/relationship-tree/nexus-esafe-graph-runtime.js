// NEXUS_ESAFE_GRAPH_RUNTIME_V3_ISOLATED_TRADES
(()=>{
  if(window.__NEXUS_ESAFE_GRAPH_RUNTIME_INSTALLED__)return;
  if((window.__NEXUS_PROJECT_WORLD__||'')!=='esafe-demo')return;
  window.__NEXUS_ESAFE_GRAPH_RUNTIME_INSTALLED__=true;

  const bundlePath='/apps/nexus-graph-preview/assets/index-CWI-Glgh.js';
  const indexKey='nexus.tradeFileIndex.v1';
  const tradeGroups=[
    ['Structural / Seismic','esafe-trade-structural'],
    ['MEP / Energy','esafe-trade-mep'],
    ['Electrical / Controls','esafe-trade-electrical'],
    ['BIM / Digital','esafe-trade-bim'],
    ['Fabrication / Installation','esafe-trade-fabrication'],
    ['Survey / QA','esafe-trade-survey'],
    ['Project / General','esafe-trade-general']
  ];
  const fallbackCategoryIds={
    'Structural / Seismic':'p-mateusz',
    'MEP / Energy':'p-sitemgr',
    'Electrical / Controls':'p-architect',
    'BIM / Digital':'p-client',
    'Fabrication / Installation':'p-team',
    'Survey / QA':'d-groundfloor',
    'Project / General':'d-doorschedule'
  };
  const coreDocs=[
    {id:'esafe-core-6260847',label:'D5.1 · Detailed survey of the real pilot',date:'2022-02-24',category:'Survey',trade:'Survey / QA'},
    {id:'esafe-core-6497142',label:'D2.2 · 3D physical and digital models',date:'2022-04-27',category:'BIM',trade:'BIM / Digital'},
    {id:'esafe-core-19114712',label:'D5.5 · Monitoring activities',date:'2026-03-19',category:'Testing',trade:'Survey / QA'},
    {id:'esafe-core-19126519',label:'D5.4 · Production and delivery',date:'2026-03-20',category:'Production',trade:'Fabrication / Installation'},
    {id:'esafe-core-19126674',label:'D5.3 · Detailed design for renovation',date:'2026-03-20',category:'Design',trade:'Structural / Seismic'}
  ];
  const fallbackDocs=[
    ['d-snaglist','D5.1 · Detailed survey of the real pilot','document'],
    ['d-firecerts','D2.2 · 3D physical and digital models','document'],
    ['t-install','D5.5 · Monitoring activities','document'],
    ['t-snag','D5.4 · Production and delivery','document'],
    ['t-fire','D5.3 · Detailed design for renovation','document'],
    ['t-walkthrough','Pilot Actions','task']
  ];

  const hash=value=>{
    let h=2166136261;
    const text=String(value||'');
    for(let i=0;i<text.length;i+=1){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
    return(h>>>0).toString(36);
  };
  const js=value=>JSON.stringify(String(value??''));
  const readIndex=()=>{
    try{const parsed=JSON.parse(localStorage.getItem(indexKey)||'[]');return Array.isArray(parsed)?parsed.slice(-60):[]}catch{return[]}
  };

  function inferTrade(record){
    const text=`${record?.title||''} ${record?.category||''}`.toLowerCase();
    if(/electrical|control|sensor|monitoring system|wiring|cable/.test(text))return 'Electrical / Controls';
    if(/bim|digital|model|3d|scan|laser|point cloud|ifc/.test(text))return 'BIM / Digital';
    if(/mep|energy|hvac|mechanical|plant|duct|thermal|heat/.test(text))return 'MEP / Energy';
    if(/fabrication|production|delivery|installation|construction|site works|assembly/.test(text))return 'Fabrication / Installation';
    if(/survey|testing|test|monitoring|qa|quality|inspection|assessment/.test(text))return 'Survey / QA';
    if(/structural|seismic|masonry|wall|reinforcement|design/.test(text))return 'Structural / Seismic';
    return 'Project / General';
  }

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

  function uploadedDocEdges(){
    const generalId='esafe-trade-general';
    return readIndex().map((file,index)=>{
      const id=`u-doc-${hash(`${file.name}|${file.size}|${file.lastModified}|${index}`)}`;
      return `[${js(generalId)},${js(id)}]`;
    });
  }

  function patchVisualTypes(source){
    const from='gc={project:{chip:"bg-primary/15 text-primary",centerBorder:"border-primary"},person:{chip:"bg-blue-500/15 text-blue-400",centerBorder:"border-blue-500"},task:{chip:"bg-emerald-500/15 text-emerald-400",centerBorder:"border-emerald-500"},document:{chip:"bg-amber-500/15 text-amber-400",centerBorder:"border-amber-500"},issue:{chip:"bg-red-500/15 text-red-400",centerBorder:"border-red-500"}},Ow={issue:-1,person:0,task:1,document:2,project:3}';
    const to='gc={project:{chip:"bg-primary/15 text-primary",centerBorder:"border-primary"},person:{chip:"bg-blue-500/15 text-blue-400",centerBorder:"border-blue-500"},task:{chip:"bg-emerald-500/15 text-emerald-400",centerBorder:"border-emerald-500"},document:{chip:"bg-amber-500/15 text-amber-400",centerBorder:"border-amber-500"},issue:{chip:"bg-red-500/15 text-red-400",centerBorder:"border-red-500"},module:{chip:"bg-cyan-500/15 text-cyan-300",centerBorder:"border-cyan-400"}},Ow={issue:-1,person:0,module:1,task:2,document:3,project:4}';
    return source.includes(from)?source.replace(from,to):source;
  }

  function patchBundle(source){
    source=patchVisualTypes(source);
    const listMarker='const ts="proj",Zr="p-sitemgr",ns=[';
    const start=source.indexOf(listMarker);
    const rcStart=start>=0?source.indexOf('],rc={',start):-1;
    const dUStart=rcStart>=0?source.indexOf('},dU=',rcStart):-1;
    if(start<0||rcStart<0||dUStart<0){
      console.warn('[NOSMO] e-SAFE graph list marker not found; DOM fallback will isolate the world');
      return source;
    }

    const tradeNodes=tradeGroups.map(([label,id])=>`{id:${js(id)},label:${js(label)},sublabel:"e-SAFE trade group",type:"module",Icon:jc}`);
    const coordinator='{id:"p-sitemgr",label:"e-SAFE Pilot Coordinator",sublabel:"Project coordination",type:"person",Icon:ws,company:"e-SAFE H2020"}';
    const docNodes=coreDocs.map(doc=>`{id:${js(doc.id)},label:${js(doc.label)},sublabel:${js(`${doc.trade} · ${doc.category}`)},type:"document",Icon:Rh,receivedAt:${js(`${doc.date}T00:00:00Z`)}}`);
    const actionNode='{id:"esafe-pilot-actions",label:"Pilot Actions",sublabel:"Timeline-controlled project actions",type:"task",Icon:mn}';
    const nodes=[
      '{id:"proj",label:"e-SAFE Catania Real Pilot",sublabel:"Active Project World",type:"project",Icon:Dt}',
      coordinator,
      ...tradeNodes,
      ...docNodes,
      actionNode
    ];
    source=source.slice(0,start)+listMarker+nodes.join(',')+'],rc={}'+source.slice(dUStart+1);

    const tradeIdByLabel=Object.fromEntries(tradeGroups);
    const coreEdges=coreDocs.map(doc=>`[${js(tradeIdByLabel[doc.trade]||tradeIdByLabel['Project / General'])},${js(doc.id)}]`);
    const tradeEdges=tradeGroups.map(([,id])=>`["proj",${js(id)}]`);
    const personEdges=['["proj","p-sitemgr"]','["proj","esafe-pilot-actions"]'];
    source=source.replace(/dU=\[[\s\S]*?\],gc=/,`dU=[${[...tradeEdges,...personEdges,...coreEdges,...uploadedDocEdges()].join(',')}],gc=`);
    window.__NEXUS_ESAFE_GRAPH__={trades:tradeGroups.map(([label,id])=>({label,id})),coreDocs};
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
      const patched=patchBundle(text);
      return new Response(patched,{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch(error){console.error('[NOSMO] e-SAFE graph patch failed',error);return response}
  };

  const records=()=>Array.isArray(window.ESAFE_RECORDS)?window.ESAFE_RECORDS.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))):[];

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
    if(typeSpan&&type)typeSpan.textContent=type.toUpperCase();
    if(subSpan&&sublabel)subSpan.textContent=sublabel;
    button.setAttribute('aria-label',`${type||'module'}: ${label}`);
    node.dataset.esafeMapped='true';
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
      badge.style.cssText='border:1px solid rgba(34,211,238,.24);border-radius:999px;background:rgba(8,47,73,.78);padding:2px 6px;font-size:7px;font-weight:800;letter-spacing:.06em;color:#0891b2;white-space:nowrap';
      button.appendChild(badge);
    }
    badge.textContent=text;
  };

  function applyWorldIdentity(){
    setNodePresentation('proj','e-SAFE Catania Real Pilot','project','Active Project World');
    const projectSub=document.querySelector('#nexusTopProject .nexus-top-sub');
    if(projectSub)projectSub.textContent='e-SAFE';
    const timelineTitle=document.getElementById('nexusTimeProjectTitle');
    if(timelineTitle)timelineTitle.textContent='e-SAFE · PROJECT TIMELINE';
    document.documentElement.dataset.esafeWorld='true';
    document.title='NOSMO Nexus™ — e-SAFE Catania';
    try{localStorage.setItem('nexus.activeProject','esafe')}catch{}
  }

  function hydrateFallback(){
    if(document.querySelector('[data-node-id="esafe-trade-structural"]'))return false;
    let changed=false;
    tradeGroups.forEach(([label])=>{
      const id=fallbackCategoryIds[label];
      changed=setNodePresentation(id,label,'module','e-SAFE trade group')||changed;
    });
    fallbackDocs.forEach(([id,label,type])=>{changed=setNodePresentation(id,label,type,'e-SAFE project record')||changed});
    const oldRiversideLabels=['Riverside Heights Demo','Prepare Level 1 Door Kits','Ground Floor Plan','Door Schedule','Site Instructions'];
    document.querySelectorAll('[data-node-id]').forEach(node=>{
      const text=node.textContent||'';
      if(oldRiversideLabels.some(label=>text.includes(label)))node.dataset.esafeHidden='true';
    });
    if(changed)document.documentElement.dataset.esafeFallbackHydrated='true';
    return changed;
  }

  const ensureFilePanel=visible=>{
    const panel=document.getElementById('nexusFilesPanel');
    if(!panel)return;
    let host=document.getElementById('nexusEsafeFiles');
    if(!host){
      host=document.createElement('div');
      host.id='nexusEsafeFiles';
      host.style.cssText='margin:12px 20px 20px;border:1px solid rgba(34,211,238,.18);border-radius:14px;background:rgba(8,25,40,.54);padding:10px;color:#dbeafe;font:11px Inter,system-ui,sans-serif';
      panel.appendChild(host);
    }
    const latest=visible.slice().reverse().slice(0,8);
    const files=visible.reduce((sum,record)=>sum+(record.files?.length||0),0);
    host.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:8px"><strong style="color:#67e8f9">e-SAFE PROJECT FILES</strong><span>${files} files · ${visible.length} source groups</span></div>${latest.map(record=>`<a href="${record.url}" target="_blank" rel="noopener" style="display:grid;grid-template-columns:70px 1fr;gap:8px;padding:7px 0;border-top:1px solid rgba(148,163,184,.12);color:inherit;text-decoration:none"><span style="color:#94a3b8">${record.date}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${String(record.title||record.id)}</span></a>`).join('')}`;
  };

  function renderWorld(progress=1){
    applyWorldIdentity();
    hydrateFallback();
    const all=records().map(record=>({...record,trade:inferTrade(record)}));
    if(!all.length){
      const filesSub=document.querySelector('#nexusTopFiles .nexus-top-sub');
      if(filesSub)filesSub.textContent='e-SAFE FILES';
      return;
    }
    const p=Math.max(0,Math.min(1,Number(progress)||0));
    const first=Date.parse(`${all[0].date}T00:00:00Z`);
    const last=Date.parse(`${all[all.length-1].date}T00:00:00Z`);
    const cutoff=first+(last-first)*p;
    const visible=all.filter(record=>Date.parse(`${record.date}T23:59:59Z`)<=cutoff);
    const counts={},totals={};
    tradeGroups.forEach(([label])=>{counts[label]=0;totals[label]=0});
    all.forEach(record=>{totals[record.trade]=(totals[record.trade]||0)+1});
    visible.forEach(record=>{counts[record.trade]=(counts[record.trade]||0)+1});
    tradeGroups.forEach(([label,id])=>{
      const targetId=document.querySelector(`[data-node-id="${id}"]`)?id:fallbackCategoryIds[label];
      setCountBadge(targetId,`${counts[label]||0} / ${totals[label]||0} records`);
    });
    const filesSub=document.querySelector('#nexusTopFiles .nexus-top-sub');
    const visibleFiles=visible.reduce((sum,record)=>sum+(record.files?.length||0),0);
    if(filesSub)filesSub.textContent=`${visibleFiles} FILES`;
    const selection=document.getElementById('nexusFileSelection');
    if(selection&&selection.textContent==='No files selected')selection.textContent=`e-SAFE source library · ${all.reduce((sum,record)=>sum+(record.files?.length||0),0)} files`;
    ensureFilePanel(visible);
  }

  const scan=(attempt=0)=>{
    if(document.querySelector('[data-node-id="proj"]')){renderWorld(1);return}
    if(attempt<80)setTimeout(()=>scan(attempt+1),120);
  };
  window.addEventListener('nexus:project-time-change',event=>renderWorld(event.detail?.progress??1));
  window.addEventListener('DOMContentLoaded',()=>scan());
  setTimeout(()=>scan(),700);
})();
