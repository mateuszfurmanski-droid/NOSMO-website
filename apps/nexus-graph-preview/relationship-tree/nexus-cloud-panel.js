// NEXUS_CLOUD_PANEL_ADDON_20260817
// Add-on only: adds a CLOUD tile and panel. It does not alter Project Time, graph runtime, existing panels or dock actions.
(()=>{
  if(window.__NEXUS_CLOUD_PANEL__)return;
  window.__NEXUS_CLOUD_PANEL__=true;

  const folders=[
    {id:'nexus-root',name:'Nexus Cloud Root',state:'linked',type:'root',copy:'Main shared cloud entry for Nexus project data, media and documents.',url:'https://drive.google.com/drive/folders/1n2E0dlb0W-5Qt2V7q5hjIGdX9T9c8Cs0'},
    {id:'project-worlds',name:'Project Worlds',state:'linked',type:'projects',copy:'Shared project-world folders used by Relationship Tree and project overlays.',url:'https://drive.google.com/drive/folders/1gCa35DoMCOioIdZbpYETvseEhA_D3n_Q'},
    {id:'esafe-catania',name:'e-SAFE Catania',state:'linked',type:'project',copy:'Project world folder for e-SAFE Catania files, drawings and evidence.',url:'https://drive.google.com/drive/folders/1Zu80-Yj9RocZJlBDXKXxId9ZRnn9EcOE'},
    {id:'riverside',name:'Riverside Heights Demo',state:'manual',type:'project',copy:'Current Relationship Tree demo world. Drive folder reference is pending confirmation.',url:''},
    {id:'user-data',name:'User Data',state:'design',type:'identity',copy:'Future nexus.nosmo.tech worker data folders linked to Person Cards and permissions.',url:''},
    {id:'evidence',name:'Evidence Uploads',state:'design',type:'workflow',copy:'Photos, PDFs, inspections and handover evidence routed to project graph objects.',url:''}
  ];

  const make=(tag,attrs={},children=[])=>{
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
  const close=()=>{
    document.getElementById('nexusCloudPanel')?.classList.remove('open');
    scrim()?.classList.remove('open');
    document.getElementById('nexusCloudDockTile')?.classList.remove('active');
  };
  const open=()=>{
    document.querySelectorAll('.nexus-shell-panel.open,.nexus-project-switcher.open,.nexus-time-panel.open,#nexusIntegrationsPanel.open').forEach(panel=>panel.classList.remove('open'));
    const panel=document.getElementById('nexusCloudPanel');
    if(!panel)return;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    scrim()?.classList.add('open');
    document.getElementById('nexusCloudDockTile')?.classList.add('active');
  };
  const toggle=()=>document.getElementById('nexusCloudPanel')?.classList.contains('open')?close():open();

  const buildPanel=()=>{
    if(document.getElementById('nexusCloudPanel'))return;
    const cards=folders.map(item=>{
      const action=item.url?make('button',{class:'nx-cloud-open',type:'button',text:'OPEN'}):make('span',{class:'nx-cloud-open disabled',text:'PENDING'});
      if(item.url)action.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();window.open(item.url,'_blank','noopener,noreferrer');});
      return make('article',{class:'nx-cloud-card','data-cloud-id':item.id},[
        make('div',{class:'nx-cloud-card-head'},[
          make('div',{class:'nx-cloud-folder',text:'▣'}),
          make('div',{class:'nx-cloud-name'},[
            make('strong',{text:item.name}),
            make('small',{text:item.type})
          ]),
          action
        ]),
        make('p',{class:'nx-cloud-copy',text:item.copy}),
        make('div',{class:'nx-cloud-meta'},[
          make('span',{class:'nx-cloud-status'},[make('span',{class:'nx-cloud-led '+item.state}),item.state]),
          make('span',{text:item.id})
        ])
      ]);
    });
    const panel=make('aside',{id:'nexusCloudPanel','aria-label':'Nexus Cloud','aria-hidden':'true'},[
      make('header',{class:'nx-cloud-head'},[
        make('div',{class:'nx-cloud-title'},[
          make('span',{class:'nx-cloud-kicker',text:'NEXUS CLOUD DATA LAYER'}),
          make('strong',{text:'CLOUD'}),
          make('small',{text:'Google Drive folders are linked as project data sources. No file sync is claimed yet.'})
        ]),
        make('button',{class:'nx-cloud-close',type:'button','aria-label':'Close cloud',text:'x'})
      ]),
      make('div',{class:'nx-cloud-body'},cards)
    ]);
    document.body.appendChild(panel);
    panel.querySelector('.nx-cloud-close')?.addEventListener('click',close);
    scrim()?.addEventListener('click',close);
  };

  const dockLabels=['tasks','time','project','people','docs','tools','system','trades','int','integrations'];
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const isDockControl=control=>{
    if(!control||control.id==='nexusCloudDockTile')return false;
    if(control.closest('#nexusTopRail,#nexusProjectTimeIso,#nexusCloudPanel,.nexus-shell-panel,.nexus-project-switcher,.nexus-people-panel'))return false;
    const text=norm(control.textContent||control.getAttribute('aria-label')||'');
    if(!dockLabels.some(label=>new RegExp('(^|\\b)'+label+'(\\b|$)','i').test(text)))return false;
    const rect=control.getBoundingClientRect();
    const vh=window.innerHeight||document.documentElement.clientHeight||0;
    return rect.bottom>=vh-190&&rect.top>=vh-300&&rect.width>=38&&rect.height>=36;
  };
  const findDockParent=()=>{
    const controls=Array.from(document.querySelectorAll('button,a,[role="button"]')).filter(isDockControl);
    if(controls.length<2)return null;
    const groups=new Map();
    controls.forEach(control=>{const parent=control.parentElement;if(parent)groups.set(parent,(groups.get(parent)||0)+1);});
    return Array.from(groups.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0]||controls[0].parentElement;
  };
  const buildTile=()=>{
    if(document.getElementById('nexusCloudDockTile'))return;
    const parent=findDockParent();
    if(!parent)return;
    const tile=make('button',{id:'nexusCloudDockTile',type:'button','aria-label':'Open cloud'},[
      make('span',{class:'nx-cloud-tile-icon',text:'☁'}),
      make('span',{class:'nx-cloud-tile-label',text:'CLOUD'})
    ]);
    tile.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
      toggle();
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
