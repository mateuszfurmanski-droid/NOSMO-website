// NEXUS_PROJECT_SWITCHER_V9_PROJECT_CLEAN
(()=>{
  const bootLocal=(flag,path)=>{
    if(window[flag])return;
    try{
      const request=new XMLHttpRequest();
      request.open('GET',path,false);
      request.send(null);
      if(request.status>=200&&request.status<300){
        (0,eval)(`${request.responseText}\n//# sourceURL=${path.split('?')[0]}`);
      }else console.warn('[NOSMO] Local bootstrap failed',path,request.status);
    }catch(error){console.error('[NOSMO] Local bootstrap failed',path,error)}
  };

  const url=new URL(window.location.href);
  const world=window.__NEXUS_PROJECT_WORLD__||'dev';
  const isEsafe=world==='esafe-demo';
  const isWorkMode=world==='workmode';
  const cleanHref=nextWorld=>`/apps/nexus-graph-preview/relationship-tree/?world=${encodeURIComponent(nextWorld)}&runtime=4-project-clean&v=project-clean-20260811b`;

  // A Project World is selected by the URL only. Do not use stale localStorage to decide active data.
  try{
    localStorage.setItem('nexus.activeProjectWorld',world);
    localStorage.removeItem('nexus.activeProject');
  }catch{}

  if(isEsafe){
    window.__NEXUS_TRADE_GRAPH_RUNTIME_INSTALLED__=true;
    bootLocal('__NEXUS_ESAFE_GRAPH_RUNTIME_INSTALLED__','./nexus-esafe-graph-runtime.js?v=4-project-clean');
  }else{
    bootLocal('__NEXUS_TRADE_GRAPH_RUNTIME_INSTALLED__','./nexus-trade-graph-runtime.js?v=2');
  }
  bootLocal('__NEXUS_ONE_SHELL_FIXES_INSTALLED__','./nexus-one-shell-fixes.js?v=2');
  if(isWorkMode)bootLocal('__NEXUS_WORKMODE_WORLD_INSTALLED__','./nexus-workmode-world.js?v=1');

  if(document.documentElement.dataset.nexusEmbedded==='true'){
    if(isEsafe){
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

    const active=isWorkMode?'workmode':isEsafe?'esafe':'riverside';
    const currentLabel=isWorkMode?'WORK MODE':isEsafe?'e-SAFE':'RIVERSIDE';
    const sub=projectTile.querySelector('.nexus-top-sub');
    if(sub)sub.textContent=currentLabel;

    const projects=[
      {id:'riverside',label:'Riverside',sub:'Development project world',icon:'R',href:cleanHref('dev'),world:'dev'},
      {id:'esafe',label:'e-SAFE Catania',sub:'Real pilot Project World',icon:'E',href:cleanHref('esafe-demo'),world:'esafe-demo'}
    ];
    if(isWorkMode){
      projects.unshift({id:'workmode',label:'Android Work Mode',sub:'Local phone context',icon:'W',href:cleanHref('workmode'),world:'workmode'});
    }

    const panel=document.createElement('aside');
    panel.id='nexusProjectSwitcher';
    panel.className='nexus-project-switcher';
    panel.setAttribute('aria-label','Choose active Nexus project world');
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML=`
      <div class="nexus-project-switcher-head"><strong>PROJECT WORLD</strong><button class="nexus-project-switcher-close" type="button" aria-label="Close project switcher">×</button></div>
      <div class="nexus-project-current">ACTIVE: ${currentLabel}</div>
      <div class="nexus-project-list">${projects.map(project=>`<a class="nexus-project-option${project.id===active?' active':''}" data-project-id="${project.id}" href="${project.href}"><span class="nexus-project-option-icon">${project.icon}</span><span class="nexus-project-option-copy"><strong>${project.label}</strong><small>${project.sub}</small></span><span class="nexus-project-state">${project.id===active?'ACTIVE':'OPEN'}</span></a>`).join('')}</div>
      <div class="nexus-project-note">Only one Project World is active at a time. Switching performs a clean page load so Riverside and e-SAFE data cannot mix.</div>`;
    document.body.appendChild(panel);

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
      event.preventDefault();
      event.stopImmediatePropagation();
      if(panel.classList.contains('open'))close();else open();
    },true);
    panel.querySelector('.nexus-project-switcher-close')?.addEventListener('click',close);
    panel.querySelectorAll('[data-project-id]').forEach(link=>link.addEventListener('click',event=>{
      event.preventDefault();
      const id=link.getAttribute('data-project-id');
      const project=projects.find(item=>item.id===id);
      if(!project)return;
      try{
        localStorage.setItem('nexus.activeProjectWorld',project.world);
        localStorage.removeItem('nexus.activeProject');
      }catch{}
      window.location.assign(project.href);
    }));
    scrim?.addEventListener('click',close);
    ['nexusTopMenu','nexusTopTime','nexusTopFiles'].forEach(id=>document.getElementById(id)?.addEventListener('click',close,true));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel.classList.contains('open'))close()});
  });
})();
