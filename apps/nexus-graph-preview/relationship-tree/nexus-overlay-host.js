// NEXUS_OVERLAY_HOST_V1_PERSISTENT_GRAPH_20260813
(()=>{
  if(document.documentElement.dataset.nexusEmbedded==='true')return;
  if(window.NexusOverlayHost?.openOverlay)return;

  const CACHE='overlay-20260813b';
  const PERSON_CARD='/person-card-kamil.html?v=v47top1';
  const FILE_LOADER_PROJECTS={
    'esafe-demo':'NEXUS_DEMO_PROJECT_001_eSAFE_CATANIA',
    dev:'NEXUS_DEMO_PROJECT_002_RIVERSIDE'
  };

  const currentWorld=()=>window.__NEXUS_PROJECT_WORLD__||document.documentElement.dataset.nexusWorld||'esafe-demo';
  const projectKey=()=>FILE_LOADER_PROJECTS[currentWorld()]||FILE_LOADER_PROJECTS['esafe-demo'];
  const isInsideOverlay=target=>Boolean(target?.closest?.('#nexusOverlayHost'));
  const closeNativePanels=()=>{
    document.querySelectorAll('.nexus-shell-panel.open,.nexus-project-switcher.open,.nexus-people-panel.open').forEach(panel=>{
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden','true');
    });
    document.querySelectorAll('.nexus-top-tile.active').forEach(tile=>tile.classList.remove('active'));
    document.getElementById('nexusShellScrim')?.classList.remove('open');
  };

  const isPersonCardUrl=href=>{
    const value=String(href||'');
    return /^\/?person-card-kamil(?:-v47)?\.html(?:[?#].*)?$/i.test(value)||value.includes('/person-card-kamil.html')||value.includes('/person-card-kamil-v47.html');
  };

  const isFileLoaderUrl=href=>String(href||'').includes('/apps/nexus-file-loader/');

  const ensureStyles=()=>{
    if(document.getElementById('nexusOverlayHostStyles'))return;
    const style=document.createElement('style');
    style.id='nexusOverlayHostStyles';
    style.textContent=`
      html.nexus-overlay-open #root{filter:blur(1.5px) saturate(.96);transition:filter .16s ease}
      .nexus-overlay-host{position:fixed;z-index:9040;top:var(--nexus-top-rail-h,76px);right:0;bottom:calc(var(--nexus-bottom-clear,0px) + env(safe-area-inset-bottom,0px));left:0;display:grid;place-items:start center;padding:12px;pointer-events:none;font-family:Inter,Arial,sans-serif;color:#102638}
      .nexus-overlay-host.open{pointer-events:auto}.nexus-overlay-backdrop{position:absolute;inset:0;background:rgba(8,28,39,.30);backdrop-filter:blur(2px);opacity:0;transition:opacity .16s ease}.nexus-overlay-host.open .nexus-overlay-backdrop{opacity:1}
      .nexus-overlay-shell{position:relative;width:min(980px,calc(100vw - 24px));height:min(720px,calc(100vh - var(--nexus-top-rail-h,76px) - var(--nexus-bottom-clear,0px) - 28px));min-height:360px;display:grid;grid-template-rows:42px minmax(0,1fr);border:1px solid rgba(71,105,124,.34);border-radius:12px;background:rgba(244,248,251,.94);box-shadow:0 22px 70px rgba(4,27,40,.34);overflow:hidden;opacity:0;transform:translateY(8px) scale(.988);transition:opacity .16s ease,transform .16s ease}.nexus-overlay-host.open .nexus-overlay-shell{opacity:1;transform:none}
      .nexus-overlay-head{height:42px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 8px 0 12px;background:rgba(239,245,249,.96);border-bottom:1px solid rgba(71,105,124,.22)}.nexus-overlay-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#102638}.nexus-overlay-actions{display:flex;align-items:center;gap:6px}
      .nexus-overlay-open-new,.nexus-overlay-close{height:30px;border:1px solid rgba(71,105,124,.26);border-radius:7px;background:#fff;color:#102638;text-decoration:none;display:grid;place-items:center;font-size:11px;font-weight:900;cursor:pointer}.nexus-overlay-open-new{padding:0 9px}.nexus-overlay-close{width:30px;font-size:20px;line-height:1}.nexus-overlay-body{position:relative;min-height:0;background:rgba(228,239,245,.78)}.nexus-overlay-frame{width:100%;height:100%;border:0;background:#020713;display:block}
      .nexus-overlay-placeholder{height:100%;display:grid;align-content:start;gap:10px;padding:14px;overflow:auto;color:#102638}.nexus-overlay-card{border:1px solid rgba(71,105,124,.18);border-radius:10px;background:rgba(255,255,255,.88);padding:12px;box-shadow:0 8px 24px rgba(8,31,45,.08)}.nexus-overlay-card h2{margin:0 0 6px;font-size:18px;letter-spacing:.02em}.nexus-overlay-card p{margin:0;color:#607584;font-size:12px;line-height:1.45}.nexus-overlay-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.nexus-overlay-stat{border:1px solid rgba(71,105,124,.14);border-radius:8px;background:#fff;padding:9px}.nexus-overlay-stat strong{display:block;font-size:20px}.nexus-overlay-stat small{font-size:9px;color:#607584;text-transform:uppercase;font-weight:800;letter-spacing:.08em}
      @media(max-width:760px){.nexus-overlay-host{padding:8px}.nexus-overlay-shell{width:calc(100vw - 16px);height:calc(100vh - var(--nexus-top-rail-h,76px) - var(--nexus-bottom-clear,0px) - env(safe-area-inset-bottom,0px) - 16px);min-height:320px;border-radius:10px}.nexus-overlay-grid{grid-template-columns:1fr}.nexus-overlay-open-new{display:none}}
    `;
    document.head.appendChild(style);
  };

  const ensureHost=()=>{
    ensureStyles();
    let host=document.getElementById('nexusOverlayHost');
    if(host)return host;
    host=document.createElement('section');
    host.id='nexusOverlayHost';
    host.className='nexus-overlay-host';
    host.setAttribute('aria-hidden','true');
    host.innerHTML=`
      <div class="nexus-overlay-backdrop" data-nexus-overlay-close></div>
      <div class="nexus-overlay-shell" role="dialog" aria-modal="true" aria-labelledby="nexusOverlayTitle">
        <header class="nexus-overlay-head">
          <strong class="nexus-overlay-title" id="nexusOverlayTitle">NEXUS OVERLAY</strong>
          <span class="nexus-overlay-actions">
            <a class="nexus-overlay-open-new" id="nexusOverlayOpenNew" href="#" target="_blank" rel="noopener">OPEN</a>
            <button class="nexus-overlay-close" type="button" data-nexus-overlay-close aria-label="Close overlay">×</button>
          </span>
        </header>
        <div class="nexus-overlay-body" id="nexusOverlayBody"></div>
      </div>`;
    const root=document.getElementById('root');
    if(root?.parentNode)root.insertAdjacentElement('afterend',host);else document.body.appendChild(host);
    host.querySelectorAll('[data-nexus-overlay-close]').forEach(button=>button.addEventListener('click',()=>closeOverlay()));
    return host;
  };

  const safeUrl=url=>{
    let parsed;
    try{parsed=new URL(url,window.location.origin)}catch{return null}
    if(parsed.origin!==window.location.origin)return null;
    const allowed=['/person-card-kamil.html','/person-card-kamil-v47.html','/apps/nexus-file-loader/'];
    if(!allowed.some(path=>parsed.pathname===path||parsed.pathname.startsWith(path)))return null;
    if(!parsed.searchParams.has('v'))parsed.searchParams.set('v',CACHE);
    if(parsed.pathname.startsWith('/apps/nexus-file-loader/')){
      parsed.searchParams.set('overlay','1');
      parsed.searchParams.set('world',currentWorld());
      if(!parsed.searchParams.has('projectKey'))parsed.searchParams.set('projectKey',projectKey());
    }
    return parsed.toString();
  };

  const dashboardHtml=()=>{
    const project=currentWorld()==='esafe-demo'?'e-SAFE Catania':'Riverside';
    return `<div class="nexus-overlay-placeholder">
      <section class="nexus-overlay-card"><h2>${project} · Home Dashboard</h2><p>Persistent Relationship Tree stays active under this glass overlay. This is the safe placeholder for the Halifax/Home dashboard style before moving the full dashboard UI into the one-shell workspace.</p></section>
      <section class="nexus-overlay-grid" aria-label="Workspace summary"><div class="nexus-overlay-stat"><strong>98</strong><small>Project files</small></div><div class="nexus-overlay-stat"><strong>7</strong><small>Open tasks</small></div><div class="nexus-overlay-stat"><strong>5</strong><small>Documents</small></div></section>
      <section class="nexus-overlay-card"><h2>Next shell move</h2><p>Bring the real Dashboard/Home screen into this host, then repeat the same pattern for Timeline, People, Docs and Tools without route switching away from the Project Graph.</p></section>
    </div>`;
  };

  const resolveConfig=(type,context={})=>{
    const value=String(type||'').toLowerCase();
    if(['person','person-card','card'].includes(value))return{type:'person-card',mode:'iframe',title:context.title||'Kamil Person Card',url:context.url||PERSON_CARD};
    if(['file','files','file-loader','cloud','nexus-cloud'].includes(value))return{type:'file-loader',mode:'iframe',title:context.title||'Nexus Cloud / File Loader',url:context.url||`/apps/nexus-file-loader/?projectKey=${encodeURIComponent(projectKey())}&world=${encodeURIComponent(currentWorld())}&overlay=1&v=${CACHE}`};
    if(['home','dashboard'].includes(value))return{type:'dashboard',mode:'html',title:context.title||'Home / Dashboard',html:dashboardHtml()};
    return null;
  };

  function openOverlay(type,context={}){
    const config=resolveConfig(type,context);
    if(!config)return;
    const host=ensureHost();
    const title=document.getElementById('nexusOverlayTitle');
    const body=document.getElementById('nexusOverlayBody');
    const openNew=document.getElementById('nexusOverlayOpenNew');
    if(!body)return;
    closeNativePanels();
    if(title)title.textContent=config.title;
    body.innerHTML='';
    if(config.mode==='iframe'){
      const url=safeUrl(config.url);
      if(!url)return;
      const frame=document.createElement('iframe');
      frame.className='nexus-overlay-frame';
      frame.src=url;
      frame.title=config.title;
      frame.loading='eager';
      frame.setAttribute('allow','clipboard-read; clipboard-write');
      body.appendChild(frame);
      if(openNew){openNew.href=url;openNew.hidden=false}
    }else{
      body.innerHTML=config.html;
      if(openNew)openNew.hidden=true;
    }
    host.classList.add('open');
    host.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('nexus-overlay-open');
    document.documentElement.dataset.nexusOverlay=config.type;
    window.dispatchEvent(new CustomEvent('nexus:overlay-open',{detail:{type:config.type,title:config.title}}));
  }

  function closeOverlay(){
    const host=document.getElementById('nexusOverlayHost');
    if(!host)return;
    host.classList.remove('open');
    host.setAttribute('aria-hidden','true');
    document.documentElement.classList.remove('nexus-overlay-open');
    delete document.documentElement.dataset.nexusOverlay;
    const body=document.getElementById('nexusOverlayBody');
    if(body)body.innerHTML='';
    window.dispatchEvent(new CustomEvent('nexus:overlay-close'));
  }

  const installMenuLaunchers=()=>{
    const panel=document.getElementById('nexusMenuPanel');
    if(!panel||panel.querySelector('[data-nexus-overlay="dashboard"]'))return;
    const title=document.createElement('div');
    title.className='nexus-shell-section-title';
    title.textContent='Overlay screens';
    const list=document.createElement('div');
    list.className='nexus-shell-list';
    list.innerHTML=`
      <button class="nexus-shell-action" type="button" data-nexus-overlay="dashboard" data-nexus-overlay-title="Home / Dashboard"><span class="nexus-shell-action-icon">⌂</span><span class="nexus-shell-action-copy"><strong>Home / Dashboard</strong><small>Workspace summary over graph</small></span><span class="nexus-shell-action-badge">OVERLAY</span></button>
      <button class="nexus-shell-action" type="button" data-nexus-overlay="person-card" data-nexus-overlay-url="/person-card-kamil.html?v=v47top1" data-nexus-overlay-title="Kamil Person Card"><span class="nexus-shell-action-icon">KK</span><span class="nexus-shell-action-copy"><strong>Kamil Person Card</strong><small>Stable v47 card in shell</small></span><span class="nexus-shell-action-badge">OVERLAY</span></button>
      <button class="nexus-shell-action" type="button" data-nexus-overlay="file-loader" data-nexus-overlay-title="Nexus Cloud / File Loader"><span class="nexus-shell-action-icon">☁</span><span class="nexus-shell-action-copy"><strong>Nexus Cloud</strong><small>File Loader inside workspace</small></span><span class="nexus-shell-action-badge">OVERLAY</span></button>`;
    panel.appendChild(title);
    panel.appendChild(list);
  };

  const installDelegatedTriggers=()=>{
    document.addEventListener('click',event=>{
      const target=event.target instanceof Element?event.target:null;
      if(!target||isInsideOverlay(target))return;

      const explicit=target.closest('[data-nexus-overlay]');
      if(explicit){
        event.preventDefault();
        event.stopPropagation();
        openOverlay(explicit.dataset.nexusOverlay,{url:explicit.dataset.nexusOverlayUrl||explicit.getAttribute('href'),title:explicit.dataset.nexusOverlayTitle});
        return;
      }

      const anchor=target.closest('a[href]');
      if(anchor){
        const href=anchor.getAttribute('href')||'';
        if(isPersonCardUrl(href)){
          event.preventDefault();
          event.stopPropagation();
          openOverlay('person-card',{url:href,title:'Kamil Person Card'});
          return;
        }
        if(isFileLoaderUrl(href)){
          event.preventDefault();
          event.stopPropagation();
          openOverlay('file-loader',{url:href,title:'Nexus Cloud / File Loader'});
          return;
        }
      }

      const personNode=target.closest('[data-node-id="p-kamil"]');
      if(event.isTrusted&&personNode&&!target.closest('.nexus-shell-panel,.nexus-people-panel')){
        event.preventDefault();
        event.stopPropagation();
        openOverlay('person-card',{title:'Kamil Person Card'});
      }
    },true);

    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&document.getElementById('nexusOverlayHost')?.classList.contains('open'))closeOverlay();
    });
  };

  const init=()=>{
    ensureHost();
    installMenuLaunchers();
    installDelegatedTriggers();
    document.documentElement.dataset.nexusOverlayHost='ready';
  };

  window.NexusOverlayHost={openOverlay,closeOverlay};
  window.openOverlay=openOverlay;
  window.closeOverlay=closeOverlay;

  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
