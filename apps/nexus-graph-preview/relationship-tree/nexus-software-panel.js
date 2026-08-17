// NEXUS_SOFTWARE_CONNECTORS_PANEL_20260817
// Add-on only: adds a SOFT tile and software connector registry panel. Does not alter graph, Project Time, CLOUD, INT. or existing shell logic.
(()=>{
  if(window.__NEXUS_SOFTWARE_CONNECTORS_PANEL__)return;
  window.__NEXUS_SOFTWARE_CONNECTORS_PANEL__=true;

  const systems=[
    {id:'work-wallet',icon:'▣',name:'Work Wallet',type:'Safety / Compliance',level:'REFERENCE',state:'ref',copy:'Inductions, RAMS, permits, competence and safety status referenced against Person Cards, Tasks and Projects.'},
    {id:'google-drive',icon:'☁',name:'Google Drive',type:'Nexus Cloud',level:'LINKED LAYER',state:'live',copy:'Project folders, evidence files and document locations mapped into the Nexus Cloud panel and Project Graph.'},
    {id:'microsoft-365',icon:'▤',name:'Microsoft 365',type:'Files / Teams / Outlook',level:'PLANNED',state:'plan',copy:'SharePoint, OneDrive, Teams and Outlook records to be linked through connector actions, not copied blindly.'},
    {id:'bim-fabstation',icon:'▦',name:'BIM / FabStation',type:'Spatial / Objects',level:'REFERENCE',state:'ref',copy:'BIM objects, floors, rooms and install status linked to trades, tasks, evidence and timeline events.'},
    {id:'companycam',icon:'◉',name:'CompanyCam',type:'Photos / Video',level:'PLANNED',state:'plan',copy:'Site photos, progress evidence, inspection images and comments as external evidence sources.'},
    {id:'hilti',icon:'⌁',name:'Hilti / Assets',type:'Tools / Equipment',level:'PLANNED',state:'plan',copy:'Tools, plant, consumables and asset readiness connected to people, tasks and project requirements.'},
    {id:'procore-dalux',icon:'◇',name:'Procore / Dalux',type:'Project Platforms',level:'FUTURE',state:'plan',copy:'Keep specialist platforms as source systems; Nexus stores relationship, context, handoff and decision memory.'},
    {id:'autodesk-bluebeam',icon:'⌗',name:'Autodesk / Bluebeam',type:'Drawings / Markups',level:'FUTURE',state:'plan',copy:'Drawings, markups and model references linked into floors, rooms, assets, tasks and evidence trails.'},
    {id:'suppliers',icon:'£',name:'Suppliers',type:'Screwfix / B&Q / Howdens / TP',level:'DESIGN',state:'design',copy:'Purchase, material, quote and order references for job packs and project cost context.'},
    {id:'comms',icon:'✉',name:'Gmail / WhatsApp',type:'Comms Handoff',level:'ACTION LINK',state:'ref',copy:'Work-context communication links only. Private messages stay outside Nexus unless explicitly attached.'}
  ];

  const el=(tag,attrs={},children=[])=>{
    const node=document.createElement(tag);
    Object.entries(attrs||{}).forEach(([key,value])=>{
      if(value==null)return;
      if(key==='class')node.className=value;
      else if(key==='text')node.textContent=value;
      else node.setAttribute(key,String(value));
    });
    [].concat(children||[]).forEach(child=>{
      if(child==null)return;
      node.appendChild(typeof child==='string'?document.createTextNode(child):child);
    });
    return node;
  };

  const scrim=()=>document.getElementById('nexusShellScrim');
  const closePanel=()=>{
    document.getElementById('nexusSoftwarePanel')?.classList.remove('open');
    document.getElementById('nexusSoftwareDockTile')?.classList.remove('active');
    scrim()?.classList.remove('open');
  };
  const openPanel=()=>{
    document.querySelectorAll('#nexusCloudPanel.open,#nexusIntegrationsPanel.open,.nexus-shell-panel.open,.nexus-project-switcher.open,.nexus-time-panel.open').forEach(panel=>panel.classList.remove('open'));
    const panel=document.getElementById('nexusSoftwarePanel');
    if(!panel)return;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    document.getElementById('nexusSoftwareDockTile')?.classList.add('active');
    scrim()?.classList.add('open');
  };
  const togglePanel=()=>document.getElementById('nexusSoftwarePanel')?.classList.contains('open')?closePanel():openPanel();

  const buildPanel=()=>{
    if(document.getElementById('nexusSoftwarePanel'))return;
    const rows=systems.map(item=>el('article',{class:'nx-soft-card','data-soft-id':item.id},[
      el('div',{class:'nx-soft-icon',text:item.icon}),
      el('div',{class:'nx-soft-main'},[
        el('strong',{text:item.name}),
        el('small',{text:item.type}),
        el('p',{text:item.copy})
      ]),
      el('div',{class:'nx-soft-state'},[
        el('span',{class:`nx-soft-led ${item.state}`}),
        el('b',{text:item.level})
      ])
    ]));
    const panel=el('aside',{id:'nexusSoftwarePanel','aria-label':'Nexus software connectors','aria-hidden':'true'},[
      el('header',{class:'nx-soft-head'},[
        el('div',{class:'nx-soft-title'},[
          el('span',{class:'nx-soft-kicker',text:'NEXUS SOFTWARE CONNECTORS'}),
          el('strong',{text:'SOFT'}),
          el('small',{text:'External systems stay as source tools. Nexus links work context, status and memory.'})
        ]),
        el('button',{class:'nx-soft-close',type:'button','aria-label':'Close software connectors',text:'×'})
      ]),
      el('section',{class:'nx-soft-strip'},[
        el('span',{text:'Connector Registry'}),
        el('span',{text:'Object Map'}),
        el('span',{text:'Permission Check'}),
        el('span',{text:'Project Graph'})
      ]),
      el('div',{class:'nx-soft-body'},rows)
    ]);
    document.body.appendChild(panel);
    panel.querySelector('.nx-soft-close')?.addEventListener('click',closePanel);
    scrim()?.addEventListener('click',closePanel);
  };

  const findDockParent=()=>{
    const known=document.getElementById('nexusCloudDockTile')||document.getElementById('nexusIntegrationsDockTile')||document.querySelector('[data-nexus-injected-time-dock="true"]');
    if(known?.parentElement)return known.parentElement;
    const labels=['tasks','time','project','people','docs','tools','system','cloud','int'];
    const controls=Array.from(document.querySelectorAll('button,a,[role="button"]')).filter(control=>{
      if(!control||control.id==='nexusSoftwareDockTile')return false;
      if(control.closest('#nexusTopRail,#nexusProjectTimeIso,#nexusSoftwarePanel,.nexus-shell-panel,.nexus-project-switcher'))return false;
      const text=String(control.textContent||control.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(!labels.some(label=>new RegExp(`(^|\\b)${label}(\\b|$)`,'i').test(text)))return false;
      const rect=control.getBoundingClientRect();
      const vh=window.innerHeight||document.documentElement.clientHeight||0;
      return rect.bottom>=vh-190&&rect.top>=vh-300&&rect.width>=38&&rect.height>=34;
    });
    if(controls.length<2)return null;
    const groups=new Map();
    controls.forEach(control=>groups.set(control.parentElement,(groups.get(control.parentElement)||0)+1));
    return Array.from(groups.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
  };

  const buildTile=()=>{
    if(document.getElementById('nexusSoftwareDockTile'))return;
    const parent=findDockParent();
    if(!parent)return;
    const tile=el('button',{id:'nexusSoftwareDockTile',type:'button','aria-label':'Open software connectors'},[
      el('span',{class:'nx-soft-tile-icon',text:'⚙'}),
      el('span',{class:'nx-soft-tile-label',text:'SOFT'})
    ]);
    tile.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
      togglePanel();
    },true);
    const cloud=document.getElementById('nexusCloudDockTile');
    if(cloud?.parentElement===parent)cloud.insertAdjacentElement('afterend',tile);else parent.appendChild(tile);
  };

  const schedule=()=>{
    buildPanel();
    buildTile();
    requestAnimationFrame(buildTile);
    setTimeout(buildTile,220);
    setTimeout(buildTile,900);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(schedule,220),{passive:true});
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),12000);
})();
