// NEXUS_PROJECT_SWITCHER_V5_WORLD_CANONICAL
(()=>{
  const bootLocal=(flag,path)=>{
    if(window[flag])return;
    try{
      const request=new XMLHttpRequest();
      request.open('GET',path,false);
      request.send(null);
      if(request.status>=200&&request.status<300){
        (0,eval)(`${request.responseText}\n//# sourceURL=${path.split('?')[0]}`);
      }else{
        console.warn('[NOSMO] Local bootstrap failed',path,request.status);
      }
    }catch(error){console.error('[NOSMO] Local bootstrap failed',path,error)}
  };

  // Shared runtime first: uploads/trades remain available in every Project World.
  bootLocal('__NEXUS_TRADE_GRAPH_RUNTIME_INSTALLED__','./nexus-trade-graph-runtime.js?v=1');
  bootLocal('__NEXUS_ONE_SHELL_FIXES_INSTALLED__','./nexus-one-shell-fixes.js?v=2');

  const world=window.__NEXUS_PROJECT_WORLD__||'dev';
  if(world==='esafe-demo')bootLocal('__NEXUS_ESAFE_GRAPH_RUNTIME_INSTALLED__','./nexus-esafe-graph-runtime.js?v=1');

  // Legacy embedded e-SAFE page remains supported as a backup only.
  if(document.documentElement.dataset.nexusEmbedded==='true'){
    if(world==='esafe-demo'){
      const script=document.createElement('script');
      script.src='./esafe-embedded-adapter.js?v=3';
      script.defer=true;
      document.head.appendChild(script);
    }
    return;
  }

  window.addEventListener('DOMContentLoaded',()=>{
    const projectTile=document.getElementById('nexusTopProject');
    const scrim=document.getElementById('nexusShellScrim');
    if(!projectTile)return;

    const projects=[
      {id:'riverside',label:'Riverside',sub:'Canonical Relationship Tree · development project',icon:'▣',href:'/apps/nexus-graph-preview/relationship-tree/?world=dev',world:'dev'},
      {id:'esafe',label:'e-SAFE Catania',sub:'Project World · real pilot dataset',icon:'E',href:'/apps/nexus-graph-preview/relationship-tree/?world=esafe-demo',world:'esafe-demo'}
    ];

    // Loaded Project World is the single source of truth. Never use stale localStorage to label the UI.
    const active=world==='esafe-demo'?'esafe':'riverside';
    try{localStorage.setItem('nexus.activeProject',active)}catch{}

    const panel=document.createElement('aside');
    panel.id='nexusProjectSwitcher';
    panel.className='nexus-project-switcher';
    panel.setAttribute('aria-label','Choose active Nexus project');
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML=`
      <div class="nexus-project-switcher-head"><strong>ACTIVE PROJECT</strong><button class="nexus-project-switcher-close" type="button" aria-label="Close project switcher">×</button></div>
      <div class="nexus-project-current">PROJECT WORLDS</div>
      <div class="nexus-project-list">${projects.map(project=>`<a class="nexus-project-option${project.id===active?' active':''}" data-project-id="${project.id}" href="${project.href}"><span class="nexus-project-option-icon">${project.icon}</span><span class="nexus-project-option-copy"><strong>${project.label}</strong><small>${project.sub}</small></span><span class="nexus-project-state">${project.id===active?'ACTIVE':'OPEN'}</span></a>`).join('')}</div>
      <div class="nexus-project-note">Project changes the data world only. Menu, Files, Trades, AI sorting, Timeline and Nexus navigation stay the same.</div>`;
    document.body.appendChild(panel);

    const sub=projectTile.querySelector('.nexus-top-sub');
    if(sub)sub.textContent=active==='esafe'?'e-SAFE':'RIVERSIDE';

    const close=()=>{
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden','true');
      projectTile.classList.remove('active');
      projectTile.setAttribute('aria-expanded','false');
      if(scrim&&!document.querySelector('.nexus-shell-panel.open'))scrim.classList.remove('open');
    };
    const open=()=>{
      document.querySelectorAll('.nexus-shell-panel.open').forEach(item=>item.classList.remove('open'));
      document.getElementById('nexusTimelinePanel')?.classList.remove('open');
      panel.classList.add('open');
      panel.setAttribute('aria-hidden','false');
      projectTile.classList.add('active');
      projectTile.setAttribute('aria-expanded','true');
      scrim?.classList.add('open');
    };

    projectTile.setAttribute('aria-expanded','false');
    projectTile.setAttribute('aria-controls','nexusProjectSwitcher');
    projectTile.addEventListener('click',event=>{
      event.preventDefault();event.stopImmediatePropagation();
      if(panel.classList.contains('open'))close();else open();
    },true);
    panel.querySelector('.nexus-project-switcher-close')?.addEventListener('click',close);
    panel.querySelectorAll('[data-project-id]').forEach(link=>link.addEventListener('click',event=>{
      event.preventDefault();
      const id=link.getAttribute('data-project-id');
      if(!id)return;
      const project=projects.find(item=>item.id===id);
      if(!project)return;
      try{localStorage.setItem('nexus.activeProject',id)}catch{}
      window.dispatchEvent(new CustomEvent('nexus:project-change',{detail:{projectId:id,worldId:project.world,href:project.href}}));
      // Full navigation guarantees the graph runtime is rebuilt for the selected Project World.
      window.location.assign(project.href);
    }));
    scrim?.addEventListener('click',close);
    ['nexusTopMenu','nexusTopTime','nexusTopFiles'].forEach(id=>document.getElementById(id)?.addEventListener('click',close,true));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel.classList.contains('open'))close()});
  });
})();
