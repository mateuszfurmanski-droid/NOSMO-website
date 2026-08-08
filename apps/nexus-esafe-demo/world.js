(()=>{
  const records=(window.ESAFE_RECORDS||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  if(!records.length)return;
  const categories=['Survey','Design','BIM','Production','Construction','Testing','Research','Communication'];
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
  const layer=el('projectWorldLayer'),stage=el('worldStage'),svg=el('worldNetwork'),host=el('worldNodeHost');
  const projectPanel=el('projectPanel'),sourcePanel=el('sourceLibrary'),sourceList=el('sourceList'),sourceSearch=el('sourceSearch'),sourceScope=el('sourceScope'),sourceSummary=el('sourceSummary'),filterRow=el('sourceFilterRow');
  const projectTile=el('projectTile'),sourcesTile=el('sourcesTile'),nexusTile=el('nexusTile');
  let state={progress:.72,visible:records.filter(r=>pctFor(r)<=.72),phase:'CONSTRUCTION',mode:'simulation'};
  let categoryFilter='ALL';
  let pan={x:0,y:0,scale:1,drag:false,lastX:0,lastY:0};

  function closePanels(){projectPanel.classList.remove('open');sourcePanel.classList.remove('open');projectTile?.classList.remove('active');sourcesTile?.classList.remove('active');nexusTile?.classList.add('active')}
  function openProject(){sourcePanel.classList.remove('open');projectPanel.classList.add('open');nexusTile?.classList.remove('active');sourcesTile?.classList.remove('active');projectTile?.classList.add('active')}
  function openSources(category){projectPanel.classList.remove('open');sourcePanel.classList.add('open');nexusTile?.classList.remove('active');projectTile?.classList.remove('active');sourcesTile?.classList.add('active');if(category)categoryFilter=category;renderFilters();renderSources()}

  function renderProject(){
    el('projectFacts').innerHTML=projectFacts.map(([k,v])=>`<div class="fact-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');
    el('projectSystems').innerHTML=systems.map(([k,v])=>`<div class="project-system-card"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('');
  }

  function renderFilters(){
    filterRow.innerHTML=['ALL',...categories].map(c=>`<button class="source-filter ${c===categoryFilter?'active':''}" data-cat="${c}">${c}</button>`).join('');
    filterRow.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{categoryFilter=b.dataset.cat;renderFilters();renderSources()}));
  }

  function recordsForLibrary(){
    const scope=sourceScope.value==='all'?records:state.visible;
    const q=sourceSearch.value.trim().toLowerCase();
    return scope.filter(r=>(categoryFilter==='ALL'||r.category===categoryFilter)&&(!q||r.title.toLowerCase().includes(q)||r.id.includes(q)||r.category.toLowerCase().includes(q)));
  }
  function renderSources(){
    const list=recordsForLibrary();
    sourceSummary.textContent=`${list.length} record${list.length===1?'':'s'} · ${sourceScope.value==='all'?'all project sources':'available at current project time'}`;
    sourceList.innerHTML=list.map(r=>`<a class="source-item ${r.core?'core':''}" href="${r.url}" target="_blank" rel="noopener"><span class="source-type">${esc(r.category.toUpperCase().slice(0,5))}</span><span class="source-main"><span class="source-title">${esc(r.title)}</span><span class="source-meta">${esc(r.date)} · ${r.files.length} file${r.files.length===1?'':'s'} · ${r.core?'CORE PILOT · ':''}CC BY 4.0</span></span><span class="source-arrow">↗</span></a>`).join('')||'<div class="provenance-band">No records match this filter at the selected project time.</div>';
  }

  function node(id,x,y,label,sub,type='category',icon='•',action){return{id,x,y,label,sub,type,icon,action}}
  function buildNodes(){
    const p=state.progress, visible=state.visible;
    const nodes=[];
    nodes.push(node('project',50,52,'e-SAFE Catania','REAL PILOT','project','▣',openProject));
    nodes.push(node('building',50,35,'Via Acquicella Porto 27/H','5 STOREYS · 10 APARTMENTS','project','⌂',openProject));
    if(p>=.12){
      const xs=[18,34,50,66,82];
      xs.forEach((x,i)=>nodes.push(node(`l${i}`,x,20,`Level ${i}`,i===0?'GROUND':'RESIDENTIAL','level',String(i),()=>openSources('Survey'))));
    }
    const pos={Survey:[15,48],Design:[19,69],BIM:[34,82],Production:[66,82],Construction:[81,69],Testing:[85,48],Research:[68,34],Communication:[32,34]};
    categories.forEach(c=>{const count=visible.filter(r=>r.category===c).length;if(count){const [x,y]=pos[c];nodes.push(node(`cat-${c}`,x,y,c,`${count} RECORD${count===1?'':'S'}`,'category','●',()=>openSources(c)))}});
    const core=visible.filter(r=>r.core).slice(-5);const corePos=[[36,58],[64,58],[41,71],[59,71],[50,83]];
    core.forEach((r,i)=>{const [x,y]=corePos[i]||[50,75];nodes.push(node(`doc-${r.id}`,x,y,r.title.replace('Deliverable ','').slice(0,30),r.date,'core-doc','PDF',()=>window.open(r.url,'_blank','noopener')))});
    if(p>=.35){nodes.push(node('panel',28,57,'e-PANEL','FAÇADE SYSTEM','component','EP',openProject));nodes.push(node('clt',72,57,'e-CLT','SEISMIC + ENERGY','component','CLT',openProject))}
    if(p>=.55){nodes.push(node('therm',27,76,'e-THERM / e-TANK','THERMAL SYSTEM','component','TH',openProject));nodes.push(node('pv',73,76,'PV + 10 kWh battery','ENERGY SYSTEM','component','PV',openProject))}
    if(p>=.85){nodes.push(node('bems',50,66,'e-BEMS','MONITORING','component','BM',()=>openSources('Testing')))}
    return nodes;
  }
  function linksFor(nodes){
    const have=id=>nodes.some(n=>n.id===id);const links=[];const add=(a,b,core=false)=>{if(have(a)&&have(b))links.push([a,b,core])};
    add('project','building',true);for(let i=0;i<5;i++)add('building',`l${i}`);
    categories.forEach(c=>add('project',`cat-${c}`));
    ['panel','clt','therm','pv','bems'].forEach(id=>add('project',id));
    nodes.filter(n=>n.id.startsWith('doc-')).forEach(n=>add('project',n.id,true));
    return links;
  }
  function renderGraph(){
    const nodes=buildNodes(), by=Object.fromEntries(nodes.map(n=>[n.id,n]));
    svg.innerHTML=linksFor(nodes).map(([a,b,core])=>`<line class="${core?'core':''}" x1="${by[a].x}%" y1="${by[a].y}%" x2="${by[b].x}%" y2="${by[b].y}%"></line>`).join('');
    host.innerHTML=nodes.map(n=>`<button class="world-node ${n.type}" data-node="${n.id}" style="left:${n.x}%;top:${n.y}%"><span class="wn-icon">${esc(n.icon)}</span><span class="wn-label">${esc(n.label)}</span><span class="wn-sub">${esc(n.sub)}</span></button>`).join('');
    nodes.forEach(n=>{const btn=host.querySelector(`[data-node="${CSS.escape(n.id)}"]`);if(btn&&n.action)btn.addEventListener('click',n.action)});
    el('worldStatus').innerHTML=`<strong>${state.visible.length}</strong> / 95 sources · <strong>${esc(state.phase)}</strong> · ${Math.round(state.progress*100)}%`;
    renderSources();
  }

  function update(next){state={...state,...next};renderGraph()}
  window.ESAFE_WORLD={update,openSources,openProject,closePanels};
  renderProject();renderFilters();renderGraph();
  sourceSearch.addEventListener('input',renderSources);sourceScope.addEventListener('change',renderSources);
  el('closeProjectPanel').addEventListener('click',closePanels);el('closeSourceLibrary').addEventListener('click',closePanels);
  projectTile?.addEventListener('click',openProject);nexusTile?.addEventListener('click',closePanels);
  sourcesTile?.addEventListener('click',e=>{e.stopImmediatePropagation();openSources()});

  stage?.addEventListener('pointerdown',e=>{if(e.target.closest('.world-node'))return;pan.drag=true;pan.lastX=e.clientX;pan.lastY=e.clientY;stage.setPointerCapture?.(e.pointerId)});
  stage?.addEventListener('pointermove',e=>{if(!pan.drag)return;pan.x+=e.clientX-pan.lastX;pan.y+=e.clientY-pan.lastY;pan.lastX=e.clientX;pan.lastY=e.clientY;host.style.transform=`translate(${pan.x}px,${pan.y}px) scale(${pan.scale})`;svg.style.transform=`translate(${pan.x}px,${pan.y}px) scale(${pan.scale})`});
  stage?.addEventListener('pointerup',()=>pan.drag=false);stage?.addEventListener('pointercancel',()=>pan.drag=false);
})();