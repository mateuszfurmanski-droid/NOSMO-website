(()=>{
  const records=(window.ESAFE_RECORDS||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  if(!records.length)return;

  const categories=['Survey','Design','BIM','Production','Construction','Testing','Research','Communication'];
  const zones=[
    {id:'survey',label:'Survey',categories:['Survey'],pos:[18,47],phases:['SURVEY'],semantic:'document',icon:'document'},
    {id:'design',label:'Design + BIM',categories:['Design','BIM'],pos:[28,72],phases:['DESIGN + BIM'],semantic:'document',icon:'document'},
    {id:'works',label:'Delivery + Works',categories:['Production','Construction'],pos:[72,72],phases:['PROCUREMENT','CONSTRUCTION'],semantic:'task',icon:'task'},
    {id:'testing',label:'Testing + Handover',categories:['Testing'],pos:[82,47],phases:['TESTING + HANDOVER'],semantic:'task',icon:'task'},
    {id:'knowledge',label:'Knowledge',categories:['Research','Communication'],pos:[50,84],phases:[],semantic:'document',icon:'document'}
  ];
  const sourceStart=new Date(records[0].date+'T00:00:00Z');
  const sourceEnd=new Date(records[records.length-1].date+'T00:00:00Z');
  const sourceSpan=sourceEnd-sourceStart;

  const projectFacts=[
    ['Project','e-SAFE — Energy and Seismic Affordable Renovation Solutions'],
    ['Pilot','Catania Real Pilot'],
    ['Address','Via Acquicella Porto 27/H, Catania, Italy'],
    ['Building','5-storey reinforced-concrete residential block'],
    ['Homes','10 apartments'],
    ['Programme','EU Horizon 2020 · Grant 893135'],
    ['Works','Renovation works Sep 2024 → Sep 2025'],
    ['Source set','95 Zenodo records · 106 files · CC BY 4.0 metadata']
  ];
  const systems=[
    ['e-PANEL','Prefabricated energy retrofit façade system'],
    ['e-CLT','CLT-based seismic/energy retrofit solution'],
    ['e-THERM','Central domestic hot-water / thermal system'],
    ['e-TANK','10 × 140 L balcony storage modules'],
    ['Heat pump','26 kW air-to-water system + 1000 L central tank'],
    ['PV + battery','Rooftop photovoltaic system + 10 kWh battery'],
    ['e-BEMS','Building Energy Management System'],
    ['Monitoring','Post-renovation monitoring and evaluation']
  ];

  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const pctFor=r=>Math.max(0,Math.min(1,(new Date(r.date+'T00:00:00Z')-sourceStart)/sourceSpan));
  const el=id=>document.getElementById(id);
  const stage=el('worldStage'),svg=el('worldNetwork'),host=el('worldNodeHost');
  const projectPanel=el('projectPanel'),sourcePanel=el('sourceLibrary'),sourceList=el('sourceList'),sourceSearch=el('sourceSearch'),sourceScope=el('sourceScope'),sourceSummary=el('sourceSummary'),filterRow=el('sourceFilterRow');
  const projectTile=el('projectTile'),sourcesTile=el('sourcesTile'),nexusTile=el('nexusTile');
  const defaultScale=window.matchMedia?.('(max-width:760px)').matches?.74:.9;

  let state={progress:.72,visible:records.filter(r=>pctFor(r)<=.72),phase:'CONSTRUCTION',mode:'simulation'};
  let viewMode='overview';
  let categoryFilter='ALL';
  let zoneFilter=null;
  let pan={x:0,y:0,scale:defaultScale,drag:false,lastX:0,lastY:0};

  const path=document.createElement('div');
  path.className='world-path';
  stage.prepend(path);

  function applyPan(){
    const transform=`translate(${pan.x}px,${pan.y}px) scale(${pan.scale})`;
    host.style.transform=transform;
    svg.style.transform=transform;
  }
  function resetPan(){
    pan={x:0,y:0,scale:defaultScale,drag:false,lastX:0,lastY:0};
    applyPan();
  }
  function closePanels(){
    projectPanel.classList.remove('open');
    sourcePanel.classList.remove('open');
    projectTile?.classList.remove('active');
    sourcesTile?.classList.remove('active');
    nexusTile?.classList.add('active');
  }
  function openProject(){
    sourcePanel.classList.remove('open');
    projectPanel.classList.add('open');
    nexusTile?.classList.remove('active');
    sourcesTile?.classList.remove('active');
    projectTile?.classList.add('active');
  }
  function openSources(filter){
    projectPanel.classList.remove('open');
    sourcePanel.classList.add('open');
    nexusTile?.classList.remove('active');
    projectTile?.classList.remove('active');
    sourcesTile?.classList.add('active');
    if(Array.isArray(filter)){
      zoneFilter=filter.slice();
      categoryFilter='ALL';
    }else if(filter){
      zoneFilter=null;
      categoryFilter=filter;
    }
    renderFilters();
    renderSources();
  }
  function showOverview(){
    closePanels();
    viewMode='overview';
    resetPan();
    renderGraph();
  }
  function showBuilding(){
    closePanels();
    viewMode='building';
    resetPan();
    renderGraph();
  }

  function availableSystems(){
    const p=state.progress;
    const list=[];
    if(p>=.35)list.push('e-PANEL','e-CLT');
    if(p>=.55)list.push('e-THERM / e-TANK','PV + battery');
    if(p>=.85)list.push('e-BEMS');
    return list;
  }
  function renderProject(){
    el('projectFacts').innerHTML=projectFacts.map(([k,v])=>`<div class="fact-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');
    const available=new Set(availableSystems());
    el('projectSystems').innerHTML=systems.map(([k,v])=>`<div class="project-system-card ${available.has(k)||k==='Heat pump'||k==='Monitoring'?'available':'future'}"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');
  }

  function renderFilters(){
    const zoneLabel=zoneFilter?zones.find(z=>z.categories.length===zoneFilter.length&&z.categories.every(c=>zoneFilter.includes(c)))?.label:null;
    const buttons=[];
    if(zoneLabel)buttons.push(`<button class="source-filter active" data-zone="keep">${esc(zoneLabel)}</button>`);
    buttons.push(`<button class="source-filter ${!zoneFilter&&categoryFilter==='ALL'?'active':''}" data-cat="ALL">ALL PROJECT</button>`);
    categories.forEach(c=>buttons.push(`<button class="source-filter ${!zoneFilter&&c===categoryFilter?'active':''}" data-cat="${c}">${c}</button>`));
    filterRow.innerHTML=buttons.join('');
    filterRow.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{zoneFilter=null;categoryFilter=b.dataset.cat;renderFilters();renderSources()}));
  }
  function recordsForLibrary(){
    const scope=sourceScope.value==='all'?records:state.visible;
    const q=sourceSearch.value.trim().toLowerCase();
    return scope.filter(r=>{
      const categoryOk=zoneFilter?zoneFilter.includes(r.category):(categoryFilter==='ALL'||r.category===categoryFilter);
      const searchOk=!q||r.title.toLowerCase().includes(q)||r.id.includes(q)||r.category.toLowerCase().includes(q)||(r.files||[]).some(f=>String(f.name||f).toLowerCase().includes(q));
      return categoryOk&&searchOk;
    });
  }
  function renderSources(){
    const list=recordsForLibrary();
    sourceSummary.textContent=`${list.length} record${list.length===1?'':'s'} · ${sourceScope.value==='all'?'all project sources':'available at current project time'}`;
    sourceList.innerHTML=list.map(r=>`<a class="source-item ${r.core?'core':''}" href="${r.url}" target="_blank" rel="noopener"><span class="source-type">${esc(r.category.toUpperCase().slice(0,5))}</span><span class="source-main"><span class="source-title">${esc(r.title)}</span><span class="source-meta">${esc(r.date)} · ${r.files.length} file${r.files.length===1?'':'s'} · ${r.core?'CORE PILOT · ':''}CC BY 4.0</span></span><span class="source-arrow">↗</span></a>`).join('')||'<div class="provenance-band">No records match this filter at the selected project time.</div>';
  }

  function iconSvg(kind){
    if(kind==='task')return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="m8 12 2.5 2.5L16 9"></path></svg>';
    if(kind==='document')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"></path><path d="M14 3v5h5"></path><path d="M10 12h5M10 16h5"></path></svg>';
    if(kind==='levels')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 8 8-4 8 4-8 4z"></path><path d="m4 12 8 4 8-4M4 16l8 4 8-4"></path></svg>';
    if(kind==='building')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V7l7-4 7 4v14"></path><path d="M9 9h2M13 9h2M9 13h2M13 13h2M9 17h6"></path></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V8l8-5 8 5v13"></path><path d="M9 21v-6h6v6"></path></svg>';
  }

  function node(id,x,y,label,type,semantic,icon,action,{center=false,pinned=false}={}){
    return{id,x,y,label,type,semantic,icon,action,center,pinned};
  }
  function countFor(cats){return state.visible.filter(r=>cats.includes(r.category)).length}

  function buildOverview(){
    const nodes=[];
    nodes.push(node('project',50,53,'e-SAFE Catania','PROJECT','project','project',openProject,{center:true}));
    nodes.push(node('building',50,28,'Pilot Building','PROJECT','project','building',showBuilding));
    zones.forEach(z=>{
      const count=countFor(z.categories);
      if(count===0&&z.id!=='knowledge')return;
      const active=z.phases.includes(state.phase);
      nodes.push(node(`zone-${z.id}`,z.pos[0],z.pos[1],z.label,z.semantic.toUpperCase(),z.semantic,z.icon,()=>openSources(z.categories),{pinned:active}));
    });
    return nodes;
  }

  function buildBuilding(){
    const nodes=[];
    nodes.push(node('building',50,49,'Pilot Building','PROJECT','project','building',openProject,{center:true}));
    const xs=[12,31,50,69,88];
    xs.forEach((x,i)=>nodes.push(node(`l${i}`,x,23,`Level ${i}`,'PROJECT','project','levels',openProject)));
    const sys=availableSystems();
    nodes.push(node('systems',30,72,'Retrofit Systems','TASK','task','task',openProject,{pinned:sys.length>0}));
    nodes.push(node('library',70,72,'Project Sources','DOCUMENT','document','document',()=>openSources()));
    return nodes;
  }

  function buildNodes(){return viewMode==='building'?buildBuilding():buildOverview()}
  function linksFor(nodes){
    const have=id=>nodes.some(n=>n.id===id),links=[];
    const add=(a,b,core=false)=>{if(have(a)&&have(b))links.push([a,b,core])};
    if(viewMode==='overview'){
      add('project','building',true);
      zones.forEach(z=>add('project',`zone-${z.id}`));
    }else{
      for(let i=0;i<5;i++)add('building',`l${i}`);
      add('building','systems',true);
      add('building','library');
    }
    return links;
  }

  function renderPath(){
    path.innerHTML=viewMode==='overview'
      ?'<span>NEXUS</span><strong>PROJECT OVERVIEW</strong>'
      :'<button type="button" id="worldBack">‹ OVERVIEW</button><span>e-SAFE</span><strong>PILOT BUILDING</strong>';
    path.querySelector('#worldBack')?.addEventListener('click',showOverview);
  }

  function renderNode(n){
    return `<button class="nexus-map-node semantic-${esc(n.semantic)}${n.center?' is-center':''}" data-node="${esc(n.id)}" style="left:${n.x}%;top:${n.y}%" type="button" aria-label="${esc(n.type.toLowerCase())}: ${esc(n.label)}">
      <span class="nexus-map-node-frame">
        <span class="nexus-map-node-chip">${iconSvg(n.icon)}</span>
        ${n.pinned&&!n.center?'<span class="nexus-map-pin" aria-hidden="true"></span>':''}
        ${!n.center?'<span class="nexus-map-connect" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7.5l-1.1 1.1"></path><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7.5l1.1-1.1"></path></svg></span>':''}
      </span>
      <span class="nexus-map-node-label">${esc(n.label)}</span>
      <span class="nexus-map-node-type">${esc(n.type)}</span>
    </button>`;
  }

  function renderGraph(){
    renderPath();
    renderProject();
    const nodes=buildNodes(),by=Object.fromEntries(nodes.map(n=>[n.id,n]));
    svg.innerHTML=linksFor(nodes).map(([a,b,core])=>`<line class="${core?'core':''}" x1="${by[a].x}%" y1="${by[a].y}%" x2="${by[b].x}%" y2="${by[b].y}%"></line>`).join('');
    host.innerHTML=nodes.map(renderNode).join('');
    nodes.forEach(n=>{
      const btn=host.querySelector(`[data-node="${CSS.escape(n.id)}"]`);
      if(btn&&n.action)btn.addEventListener('click',n.action);
    });
    el('worldStatus').innerHTML=`<strong>${state.visible.length}</strong> / 95 · <strong>${esc(state.phase)}</strong> · ${Math.round(state.progress*100)}%`;
    renderSources();
    applyPan();
  }

  function update(next){state={...state,...next};renderGraph()}
  window.ESAFE_WORLD={update,openSources,openProject,closePanels,showOverview,showBuilding};

  renderFilters();
  renderGraph();
  sourceSearch.addEventListener('input',renderSources);
  sourceScope.addEventListener('change',renderSources);
  el('closeProjectPanel').addEventListener('click',closePanels);
  el('closeSourceLibrary').addEventListener('click',closePanels);
  projectTile?.addEventListener('click',openProject);
  nexusTile?.addEventListener('click',showOverview);
  sourcesTile?.addEventListener('click',e=>{e.stopImmediatePropagation();zoneFilter=null;categoryFilter='ALL';openSources()});

  stage?.addEventListener('pointerdown',e=>{
    if(e.target.closest('.nexus-map-node,.world-path'))return;
    pan.drag=true;pan.lastX=e.clientX;pan.lastY=e.clientY;
    stage.setPointerCapture?.(e.pointerId);
  });
  stage?.addEventListener('pointermove',e=>{
    if(!pan.drag)return;
    pan.x+=e.clientX-pan.lastX;pan.y+=e.clientY-pan.lastY;pan.lastX=e.clientX;pan.lastY=e.clientY;
    applyPan();
  });
  stage?.addEventListener('pointerup',()=>pan.drag=false);
  stage?.addEventListener('pointercancel',()=>pan.drag=false);
  stage?.addEventListener('wheel',e=>{
    e.preventDefault();
    pan.scale=Math.max(.35,Math.min(1.15,pan.scale*(e.deltaY>0?.92:1.08)));
    applyPan();
  },{passive:false});
})();