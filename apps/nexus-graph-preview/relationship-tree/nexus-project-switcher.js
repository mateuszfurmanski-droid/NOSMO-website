// NEXUS_PROJECT_SWITCHER_V2
(()=>{
  if(document.documentElement.dataset.nexusEmbedded==='true'){
    if((window.__NEXUS_PROJECT_WORLD__||'')==='esafe-demo'){
      const script=document.createElement('script');
      script.src='./esafe-embedded-adapter.js?v=1';
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
      {id:'esafe',label:'e-SAFE Catania',sub:'Project World · real pilot dataset',icon:'E',href:'/apps/nexus-esafe-demo/',world:'esafe-demo'}
    ];

    let active='riverside';
    const world=window.__NEXUS_PROJECT_WORLD__||'dev';
    if(world==='esafe-demo')active='esafe';
    try{active=localStorage.getItem('nexus.activeProject')||active}catch{}
    if(!projects.some(project=>project.id===active))active='riverside';

    const panel=document.createElement('aside');
    panel.id='nexusProjectSwitcher';
    panel.className='nexus-project-switcher';
    panel.setAttribute('aria-label','Choose active Nexus project');
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML=`
      <div class="nexus-project-switcher-head"><strong>ACTIVE PROJECT</strong><button class="nexus-project-switcher-close" type="button" aria-label="Close project switcher">×</button></div>
      <div class="nexus-project-current">PROJECT WORLDS</div>
      <div class="nexus-project-list">${projects.map(project=>`<a class="nexus-project-option${project.id===active?' active':''}" data-project-id="${project.id}" href="${project.href}"><span class="nexus-project-option-icon">${project.icon}</span><span class="nexus-project-option-copy"><strong>${project.label}</strong><small>${project.sub}</small></span><span class="nexus-project-state">${project.id===active?'ACTIVE':'OPEN'}</span></a>`).join('')}</div>
      <div class="nexus-project-note">Changing project changes the active Project World. Graph controls, files, timeline and modules remain part of the same Nexus shell.</div>`;
    document.body.appendChild(panel);

    const sub=projectTile.querySelector('.nexus-top-sub');
    const activeProject=projects.find(project=>project.id===active)||projects[0];
    if(sub)sub.textContent=activeProject.label.toUpperCase().replace(' CATANIA','');

    const close=()=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true');projectTile.classList.remove('active');projectTile.setAttribute('aria-expanded','false');if(scrim&&!document.querySelector('.nexus-shell-panel.open'))scrim.classList.remove('open')};
    const open=()=>{
      document.querySelectorAll('.nexus-shell-panel.open').forEach(item=>item.classList.remove('open'));
      document.getElementById('nexusTimelinePanel')?.classList.remove('open');
      panel.classList.add('open');panel.setAttribute('aria-hidden','false');projectTile.classList.add('active');projectTile.setAttribute('aria-expanded','true');scrim?.classList.add('open');
    };

    projectTile.setAttribute('aria-expanded','false');
    projectTile.setAttribute('aria-controls','nexusProjectSwitcher');
    projectTile.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();if(panel.classList.contains('open'))close();else open()},true);
    panel.querySelector('.nexus-project-switcher-close')?.addEventListener('click',close);
    panel.querySelectorAll('[data-project-id]').forEach(link=>link.addEventListener('click',()=>{
      const id=link.getAttribute('data-project-id');
      if(!id)return;
      try{localStorage.setItem('nexus.activeProject',id)}catch{}
      const project=projects.find(item=>item.id===id);
      window.dispatchEvent(new CustomEvent('nexus:project-change',{detail:{projectId:id,worldId:project?.world||'dev',href:project?.href||''}}));
    }));
    scrim?.addEventListener('click',close);
    ['nexusTopMenu','nexusTopTime','nexusTopFiles'].forEach(id=>document.getElementById(id)?.addEventListener('click',close,true));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel.classList.contains('open'))close()});
  });
})();
