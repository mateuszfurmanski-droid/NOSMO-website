// NEXUS_PROJECT_CONTEXT_V1
(()=>{
  const PROJECTS={
    riverside:{id:'riverside',label:'Riverside',world:'dev',href:'/apps/nexus-graph-preview/relationship-tree/?world=dev'},
    esafe:{id:'esafe',label:'e-SAFE Catania',world:'esafe-demo',href:'/apps/nexus-esafe-demo/'}
  };
  const readActive=()=>{
    let id='riverside';
    try{id=localStorage.getItem('nexus.activeProject')||id}catch{}
    return PROJECTS[id]||PROJECTS.riverside;
  };
  const setActive=id=>{if(!PROJECTS[id])return;try{localStorage.setItem('nexus.activeProject',id)}catch{}};
  window.NexusProjectContext={projects:PROJECTS,readActive,setActive};

  window.addEventListener('DOMContentLoaded',()=>{
    const project=readActive();
    document.documentElement.dataset.nexusActiveProject=project.id;
    document.querySelectorAll('a').forEach(link=>{
      const label=(link.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const href=link.getAttribute('href')||'';
      const oldNexusHref=href.includes('nexus-preview.html')||href==='../'||href==='../../nexus-preview.html';
      const nexusLabel=label==='nexus'||label.includes('return to nexus')||label.endsWith('nexus ←')||label.includes('← nexus');
      if(!oldNexusHref&&!nexusLabel)return;
      link.href=project.href;
      link.dataset.nexusProjectReturn='true';
      link.title=`Return to ${project.label} Project World`;
      const span=link.querySelector('span');
      if(span&&/nexus/i.test(span.textContent||''))span.textContent='Project World';
      else if(/return to nexus/i.test(link.textContent||''))link.textContent='Return to Project World';
    });
    window.dispatchEvent(new CustomEvent('nexus:project-context-ready',{detail:project}));
  });
})();