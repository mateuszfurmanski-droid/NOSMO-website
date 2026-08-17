// NEXUS_INTEGRATIONS_PANEL_ADDON_20260817
// Add-on only: adds an Integrations tile and panel. Does not alter Project Time, graph runtime or existing panels.
(()=>{
  if(window.__NEXUS_INTEGRATIONS_PANEL__)return;
  window.__NEXUS_INTEGRATIONS_PANEL__=true;

  const integrations=[
    {id:'google-drive',icon:'☁',name:'Google Drive',level:'Level 2',state:'ref',label:'NEXUS CLOUD',copy:'Project folders, file metadata, evidence uploads and Drive links mapped into Nexus project objects.'},
    {id:'work-wallet',icon:'▣',name:'Work Wallet',level:'Level 1',state:'ref',label:'SAFETY REF',copy:'Safety, induction, RAMS, permit and competence records referenced against Person Cards and Tasks.'},
    {id:'bim-fabstation',icon:'▦',name:'BIM / FabStation',level:'Level 1',state:'ref',label:'OBJECT MAP',copy:'IFC/BIM/spatial objects linked to tasks, trades, evidence, installation status and timeline events.'},
    {id:'companycam',icon:'◉',name:'CompanyCam',level:'Planned',state:'plan',label:'EVIDENCE',copy:'Photo/video evidence source for site progress, inspections, geotagged records and comments.'},
    {id:'hilti',icon:'⌁',name:'Hilti / Tools',level:'Planned',state:'plan',label:'ASSETS',copy:'Tool, plant and equipment readiness connector for tasks, people and project asset cards.'},
    {id:'microsoft',icon:'▤',name:'Microsoft 365',level:'Planned',state:'plan',label:'FILES + COMMS',copy:'OneDrive, SharePoint, Teams, Outlook and documents routed into project graph and work context.'},
    {id:'gmail-teams',icon:'✉',name:'Gmail / Teams',level:'Action link',state:'ref',label:'COMMS',copy:'Communication handoff and work-context links. No private inbox scraping; only authorised actions.'},
    {id:'nexus-identity',icon:'N',name:'nexus.nosmo.tech',level:'Design',state:'plan',label:'IDENTITY',copy:'Work identity, Person Card permissions, worker data folders and agency/work mode account layer.'}
  ];

  const el=(tag,attrs={},children=[])=>{
    const node=document.createElement(tag);
    Object.entries(attrs||{}).forEach(([key,value])=>{
      if(value==null)return;
      if(key==='class')node.className=value;
      else if(key==='text')node.textContent=value;
      else if(key==='html')node.innerHTML=value;
      else node.setAttribute(key,String(value));
    });
    [].concat(children||[]).forEach(child=>{
      if(child==null)return;
      node.appendChild(typeof child==='string'?document.createTextNode(child):child);
    });
    return node;
  };

  const findShellScrim=()=>document.getElementById('nexusShellScrim');
  const closePanel=()=>{
    document.getElementById('nexusIntegrationsPanel')?.classList.remove('open');
    findShellScrim()?.classList.remove('open');
    document.getElementById('nexusIntegrationsDockTile')?.classList.remove('active');
  };
  const openPanel=()=>{
    document.querySelectorAll('.nexus-shell-panel.open,.nexus-project-switcher.open,.nexus-time-panel.open').forEach(panel=>panel.classList.remove('open'));
    const panel=document.getElementById('nexusIntegrationsPanel');
    if(!panel)return;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    findShellScrim()?.classList.add('open');
    document.getElementById('nexusIntegrationsDockTile')?.classList.add('active');
  };
  const togglePanel=()=>document.getElementById('nexusIntegrationsPanel')?.classList.contains('open')?closePanel():openPanel();

  const buildPanel=()=>{
    if(document.getElementById('nexusIntegrationsPanel'))return;
    const cards=integrations.map(item=>el('article',{class:'nx-int-card','data-integration-id':item.id},[
      el('div',{class:'nx-int-top'},[
        el('div',{class:'nx-int-icon',text:item.icon}),
        el('div',{class:'nx-int-name'},[
          el('strong',{text:item.name}),
          el('small',{text:item.level})
        ])
      ]),
      el('div',{class:'nx-int-copy',text:item.copy}),
      el('div',{class:'nx-int-meta'},[
        el('span',{class:'nx-int-badge'},[el('span',{class:`nx-int-led ${item.state}`}),item.label]),
        el('span',{text:item.id})
      ])
    ]));
    const panel=el('aside',{id:'nexusIntegrationsPanel','aria-label':'Nexus integrations','aria-hidden':'true'},[
      el('header',{class:'nx-int-head'},[
        el('div',{class:'nx-int-title'},[
          el('span',{class:'nx-int-kicker',text:'NEXUS CONNECTOR LAYER'}),
          el('strong',{text:'INTEGRATIONS'}),
          el('small',{text:'Connectors are referenced into Project Graph. No direct system replacement.'})
        ]),
        el('button',{class:'nx-int-close',type:'button','aria-label':'Close integrations',text:'×'})
      ]),
      el('div',{class:'nx-int-body'},[el('div',{class:'nx-int-grid'},cards)])
    ]);
    document.body.appendChild(panel);
    panel.querySelector('.nx-int-close')?.addEventListener('click',closePanel);
    findShellScrim()?.addEventListener('click',closePanel);
  };

  const labels=['tasks','time','project','people','docs','tools','system','trades'];
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const isDockControl=control=>{
    if(!control||control.id==='nexusIntegrationsDockTile')return false;
    if(control.closest('#nexusTopRail,#nexusProjectTimeIso,#nexusIntegrationsPanel,.nexus-shell-panel,.nexus-project-switcher,.nexus-people-panel'))return false;
    const text=norm(control.textContent||control.getAttribute('aria-label')||'');
    if(!labels.some(label=>new RegExp(`(^|\\b)${label}(\\b|$)`,'i').test(text)))return false;
    const rect=control.getBoundingClientRect();
    const viewportH=window.innerHeight||document.documentElement.clientHeight||0;
    return rect.bottom>=viewportH-185&&rect.top>=viewportH-285&&rect.width>=46&&rect.height>=38;
  };
  const findDockParent=()=>{
    const controls=Array.from(document.querySelectorAll('button,a,[role="button"]')).filter(isDockControl);
    if(controls.length<2)return null;
    const groups=new Map();
    controls.forEach(control=>{
      const parent=control.parentElement;
      if(!parent)return;
      groups.set(parent,(groups.get(parent)||0)+1);
    });
    return Array.from(groups.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0]||controls[0].parentElement;
  };

  const buildTile=()=>{
    if(document.getElementById('nexusIntegrationsDockTile'))return;
    const parent=findDockParent();
    if(!parent)return;
    const tile=el('button',{id:'nexusIntegrationsDockTile',type:'button','aria-label':'Open integrations'},[
      el('span',{class:'nx-int-tile-icon',text:'⌬'}),
      el('span',{class:'nx-int-tile-label',text:'INTEGRATIONS'})
    ]);
    tile.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
      togglePanel();
    },true);
    parent.appendChild(tile);
  };

  const schedule=()=>{
    buildPanel();
    buildTile();
    requestAnimationFrame(buildTile);
    setTimeout(buildTile,180);
    setTimeout(buildTile,700);
    setTimeout(buildTile,1600);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(schedule,220),{passive:true});
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),16000);
})();
