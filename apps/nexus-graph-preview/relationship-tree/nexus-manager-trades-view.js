// NEXUS_MANAGER_TRADES_VIEW_V1
(()=>{
  if(window.__NEXUS_MANAGER_TRADES_VIEW_INSTALLED__)return;
  window.__NEXUS_MANAGER_TRADES_VIEW_INSTALLED__=true;

  const params=new URLSearchParams(window.location.search);
  const profile=params.get('accessProfile')||'manager';
  if(profile!=='manager')return;

  const tradeKey='nexus.activeTrade';
  const indexKey='nexus.tradeFileIndex.v1';
  const tradeDefs=[
    {id:'joinery',label:'Joinery',icon:'J',keywords:['joinery','joiner','carpentry','carpenter','timber','clt','wood','doorset','door frame','ironmongery']},
    {id:'fire-doors',label:'Fire Doors',icon:'FD',keywords:['fire door','fd30','fd60','intumescent','smoke seal','fire certificate']},
    {id:'electrical',label:'Electrical',icon:'⚡',keywords:['electrical','electric','cable','lv','distribution board','eicr','mcb','rcd','lighting','socket']},
    {id:'plumbing',label:'Plumbing',icon:'P',keywords:['plumbing','pipework','drainage','sanitary','water supply','soil stack','valve']},
    {id:'hvac',label:'HVAC',icon:'H',keywords:['hvac','ventilation','duct','ahu','fcu','heating','cooling','air conditioning','bems','thermal','energy performance']},
    {id:'drylining',label:'Drylining',icon:'D',keywords:['drylining','dry lining','plasterboard','gypsum','partition','stud wall','ceiling']},
    {id:'site-management',label:'Site Management',icon:'SM',keywords:['site management','survey','bim','design','programme','logistics','permit','inspection','quality','research','communication','monitoring','pilot','seismic','retrofit']}
  ];
  const tradeRoots={
    'joinery':'m-joinery','fire-doors':'m-fire-doors','electrical':'m-electrical','plumbing':'m-plumbing',
    'hvac':'m-hvac','drylining':'m-drylining','site-management':'m-site-management'
  };
  const electricalChildren=['m-electrical-commissioning','e-cables','e-certificates','e-communal','e-snags'];

  let activeTrade='all';
  try{activeTrade=localStorage.getItem(tradeKey)||'all'}catch{}
  if(activeTrade!=='all'&&!tradeRoots[activeTrade])activeTrade='all';

  const readIndex=()=>{
    try{const value=JSON.parse(localStorage.getItem(indexKey)||'[]');return Array.isArray(value)?value.slice(-60):[]}catch{return[]}
  };
  const hash=value=>{
    let h=2166136261;
    const text=String(value||'');
    for(let i=0;i<text.length;i+=1){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
    return(h>>>0).toString(36);
  };

  const indexed=readIndex();
  const hidden=new Set();
  Object.entries(tradeRoots).forEach(([trade,id])=>{if(activeTrade==='all'||trade!==activeTrade)hidden.add(id)});
  electricalChildren.forEach(id=>{if(activeTrade!=='electrical')hidden.add(id)});
  indexed.forEach((file,index)=>{
    const id=`u-doc-${hash(`${file.name}|${file.size}|${file.lastModified}|${index}`)}`;
    if(activeTrade==='all'||file.primaryTrade!==activeTrade)hidden.add(id);
  });
  window.__NEXUS_MANAGER_HIDDEN_IDS__=hidden;
  window.__NEXUS_MANAGER_ACTIVE_TRADE__=activeTrade;

  // Last fetch wrapper: receives the already-patched Project World bundle and only controls manager visibility.
  const bundlePath='/apps/nexus-graph-preview/assets/index-CWI-Glgh.js';
  const previousFetch=window.fetch.bind(window);
  window.fetch=async(...args)=>{
    const response=await previousFetch(...args);
    try{
      const input=args[0];
      const url=typeof input==='string'?input:(input?.url||'');
      if(!String(url).includes(bundlePath))return response;
      let source=await response.text();
      const patches=[
        [
          'L=b.useMemo(()=>EU(ns,ye,ce,p,k,T),[ye,ce,p,k,T])',
          'L=b.useMemo(()=>EU(ns.filter(B=>!window.__NEXUS_MANAGER_HIDDEN_IDS__?.has(B.id)),ye,ce,p,k,T),[ye,ce,p,k,T])'
        ],
        [
          'ce.map(B=>{const Q=L.get(B.source),ve=L.get(B.target);',
          'ce.filter(B=>!window.__NEXUS_MANAGER_HIDDEN_IDS__?.has(B.source)&&!window.__NEXUS_MANAGER_HIDDEN_IDS__?.has(B.target)).map(B=>{const Q=L.get(B.source),ve=L.get(B.target);'
        ],
        [
          'ns.map(B=>{const Q=L.get(B.id)??{x:0,y:0},',
          'ns.filter(B=>!window.__NEXUS_MANAGER_HIDDEN_IDS__?.has(B.id)).map(B=>{const Q=L.get(B.id)??{x:0,y:0},'
        ],
        [
          'Ae=ns.reduce((B,Q)=>(B[Q.type]=(B[Q.type]??0)+1,B),{});',
          'Ae=ns.filter(B=>!window.__NEXUS_MANAGER_HIDDEN_IDS__?.has(B.id)).reduce((B,Q)=>(B[Q.type]=(B[Q.type]??0)+1,B),{});'
        ]
      ];
      patches.forEach(([from,to])=>{if(source.includes(from))source=source.replace(from,to)});
      return new Response(source,{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch(error){console.error('[NOSMO] Manager trade visibility patch failed',error);return response}
  };

  const tradeLabel=id=>tradeDefs.find(item=>item.id===id)?.label||id;
  const classifyRecord=record=>{
    const text=`${record?.title||''} ${record?.category||''}`.toLowerCase();
    let best={id:'site-management',score:0};
    tradeDefs.forEach(trade=>{
      let score=0;
      trade.keywords.forEach(keyword=>{if(text.includes(keyword))score+=keyword.length>7?3:2});
      if(score>best.score)best={id:trade.id,score};
    });
    return best.id;
  };

  function installStyles(){
    if(document.getElementById('nexus-manager-files-style'))return;
    const style=document.createElement('style');
    style.id='nexus-manager-files-style';
    style.textContent=`
      .nexus-files-by-trade{margin:12px 20px 18px;border:1px solid rgba(34,211,238,.2);border-radius:15px;background:rgba(8,25,40,.54);padding:10px;color:#dbeafe;font:11px Inter,system-ui,sans-serif}
      .nexus-files-by-trade-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;color:#67e8f9;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
      .nexus-files-trade-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .nexus-files-trade-btn{display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:42px;border:1px solid rgba(148,163,184,.18);border-radius:11px;background:rgba(15,23,42,.56);padding:7px 8px;color:#dbeafe;text-align:left}
      .nexus-files-trade-btn.active{border-color:rgba(34,211,238,.68);background:rgba(8,72,96,.38)}
      .nexus-files-trade-btn strong{font-size:10px}.nexus-files-trade-btn span{font-size:9px;color:#67e8f9;font-weight:800}
      .nexus-files-trade-list{display:grid;gap:5px;margin-top:9px;max-height:28vh;overflow:auto}
      .nexus-files-trade-row{display:grid;grid-template-columns:1fr auto;gap:8px;padding:6px 7px;border-radius:9px;background:rgba(15,23,42,.48);font-size:9px;color:#dbeafe;text-decoration:none}
      .nexus-files-trade-row small{color:#94a3b8;white-space:nowrap}
      @media(max-width:720px){.nexus-files-by-trade{margin:10px 12px 14px}.nexus-files-trade-grid{grid-template-columns:1fr 1fr}.nexus-files-trade-list{max-height:24vh}}
    `;
    document.head.appendChild(style);
  }

  function buildFileGroups(){
    const groups=Object.fromEntries(tradeDefs.map(trade=>[trade.id,[]]));
    indexed.forEach(file=>{
      const trade=groups[file.primaryTrade]?file.primaryTrade:'site-management';
      groups[trade].push({kind:'upload',name:file.name||'Project file',confidence:file.confidence||0});
    });
    const records=Array.isArray(window.ESAFE_RECORDS)?window.ESAFE_RECORDS:[];
    records.forEach(record=>{
      const trade=classifyRecord(record);
      groups[trade].push({kind:'source',name:record.title||record.id,date:record.date||'',url:record.url||'#'});
    });
    return groups;
  }

  function renderFilesByTrade(){
    const panel=document.getElementById('nexusFilesPanel');
    if(!panel)return;
    installStyles();
    let host=document.getElementById('nexusFilesByTrade');
    if(!host){
      host=document.createElement('section');
      host.id='nexusFilesByTrade';
      host.className='nexus-files-by-trade';
      panel.appendChild(host);
    }
    const groups=buildFileGroups();
    const selected=activeTrade==='all'?'all':activeTrade;
    const allCount=Object.values(groups).reduce((sum,items)=>sum+items.length,0);
    const list=selected==='all'?Object.entries(groups).flatMap(([trade,items])=>items.map(item=>({...item,trade}))):groups[selected].map(item=>({...item,trade:selected}));
    host.innerHTML=`
      <div class="nexus-files-by-trade-head"><span>Manager · Files by trade</span><span>${allCount} indexed</span></div>
      <div class="nexus-files-trade-grid">
        <button type="button" class="nexus-files-trade-btn${selected==='all'?' active':''}" data-manager-trade="all"><strong>All trades</strong><span>${allCount}</span></button>
        ${tradeDefs.map(trade=>`<button type="button" class="nexus-files-trade-btn${selected===trade.id?' active':''}" data-manager-trade="${trade.id}"><strong>${trade.label}</strong><span>${groups[trade.id].length}</span></button>`).join('')}
      </div>
      <div class="nexus-files-trade-list">${list.slice(0,14).map(item=>item.kind==='source'
        ?`<a class="nexus-files-trade-row" href="${item.url}" target="_blank" rel="noopener"><span>${item.name}</span><small>${tradeLabel(item.trade)}${item.date?` · ${item.date}`:''}</small></a>`
        :`<div class="nexus-files-trade-row"><span>${item.name}</span><small>${tradeLabel(item.trade)} · ${Math.round((item.confidence||0)*100)}%</small></div>`).join('')||'<div class="nexus-files-trade-row"><span>No files in this trade yet</span><small>—</small></div>'}</div>`;
    host.querySelectorAll('[data-manager-trade]').forEach(button=>button.addEventListener('click',()=>{
      const trade=button.getAttribute('data-manager-trade')||'all';
      try{localStorage.setItem(tradeKey,trade)}catch{}
      window.dispatchEvent(new CustomEvent('nexus:trade-change',{detail:{tradeId:trade,label:trade==='all'?'All trades':tradeLabel(trade)}}));
    }));
  }

  let reloading=false;
  window.addEventListener('nexus:trade-change',event=>{
    const next=event.detail?.tradeId||'all';
    if(next===activeTrade||reloading)return;
    reloading=true;
    try{localStorage.setItem(tradeKey,next)}catch{}
    window.setTimeout(()=>window.location.reload(),120);
  });

  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',()=>window.setTimeout(renderFilesByTrade,220));
  else window.setTimeout(renderFilesByTrade,220);
  window.addEventListener('nexus:files-trade-classified',()=>window.setTimeout(renderFilesByTrade,120));
  window.addEventListener('nexus:files-trade-enriched',()=>window.setTimeout(renderFilesByTrade,120));
})();
