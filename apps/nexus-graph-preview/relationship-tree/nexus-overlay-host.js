// NEXUS_OVERLAY_HOST_ADDON_059_V1
// Opens existing same-origin Nexus modules as movable windows over the canonical Relationship Tree.
(()=>{
  if(window.__NEXUS_OVERLAY_HOST_ADDON_059__)return;
  window.__NEXUS_OVERLAY_HOST_ADDON_059__=true;
  if(document.documentElement.dataset.nexusEmbedded==='true')return;

  const PERSON_CARD='/person-card-kamil.html?v=v47top1';
  const FILE_LOADER='/apps/nexus-file-loader/?projectKey=NEXUS_DEMO_PROJECT_001_eSAFE_CATANIA';
  const windows=new Map();

  const sameOrigin=url=>{
    try{return new URL(url,window.location.href).origin===window.location.origin}catch{return false}
  };

  const normalizeUrl=url=>{
    const parsed=new URL(url,window.location.href);
    return parsed.pathname+parsed.search+parsed.hash;
  };

  const kindFor=url=>{
    const parsed=new URL(url,window.location.href);
    if(parsed.pathname==='/person-card-kamil.html'||/^\/person-card-kamil-v\d+\.html$/.test(parsed.pathname))return 'person';
    if(parsed.pathname.startsWith('/apps/nexus-file-loader/'))return 'files';
    return '';
  };

  const titleFor=kind=>kind==='person'?'Person Card · Kamil':kind==='files'?'File Loader':'Nexus';

  function closeWindow(host){
    if(!host)return;
    host.classList.remove('open','loaded');
    host.setAttribute('aria-hidden','true');
    const frame=host.querySelector('.nexus-overlay-frame');
    if(frame)frame.src='about:blank';
  }

  function build(kind){
    const id='nexusOverlayWindow-'+kind;
    let host=document.getElementById(id);
    if(host)return host;

    host=document.createElement('aside');
    host.id=id;
    host.className='nexus-overlay-window';
    host.dataset.nexusOverlayKind=kind;
    host.dataset.nexusWindowTitle=titleFor(kind);
    host.setAttribute('aria-hidden','true');
    host.setAttribute('aria-label',titleFor(kind));

    const close=document.createElement('button');
    close.type='button';
    close.className='nexus-overlay-close';
    close.setAttribute('aria-label','Close '+titleFor(kind));
    close.textContent='×';

    const loading=document.createElement('div');
    loading.className='nexus-overlay-loading';
    loading.textContent='Opening '+titleFor(kind);

    const frame=document.createElement('iframe');
    frame.className='nexus-overlay-frame';
    frame.setAttribute('title',titleFor(kind));
    frame.setAttribute('loading','eager');
    frame.setAttribute('referrerpolicy','same-origin');
    frame.addEventListener('load',()=>host.classList.add('loaded'));

    close.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      closeWindow(host);
    });

    host.append(frame,loading,close);
    document.body.appendChild(host);
    windows.set(kind,host);
    window.NexusWindowManager?.scan?.();
    return host;
  }

  function openWindow(kind,url){
    if(!kind||!sameOrigin(url))return false;
    const host=build(kind);
    const frame=host.querySelector('.nexus-overlay-frame');
    if(!frame)return false;

    host.classList.remove('loaded','nx-window-minimized');
    host.classList.add('open');
    host.setAttribute('aria-hidden','false');

    if(!host.classList.contains('nx-window-free')){
      const offset=windows.size*22;
      const width=kind==='person'?430:620;
      const x=Math.max(8,Math.round(((window.innerWidth||width)-Math.min(width,window.innerWidth-16))/2)+offset%70-35);
      const y=Math.max(56,Math.min(96+offset%90,(window.innerHeight||760)-250));
      host.style.setProperty('--nx-window-left',x+'px');
      host.style.setProperty('--nx-window-top',y+'px');
      host.classList.add('nx-window-free');
    }

    frame.src=normalizeUrl(url);
    window.NexusWindowManager?.scan?.();
    window.NexusWindowManager?.bringToFront?.(host);
    window.dispatchEvent(new CustomEvent('nexus:overlay-open',{detail:{kind,url:normalizeUrl(url)}}));
    return true;
  }

  window.NexusOverlayHost={
    openPersonCard:(url=PERSON_CARD)=>openWindow('person',url),
    openFileLoader:(url=FILE_LOADER)=>openWindow('files',url),
    close:kind=>closeWindow(document.getElementById('nexusOverlayWindow-'+kind))
  };

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;

    const link=target.closest('a[href]');
    if(link){
      const href=link.getAttribute('href')||'';
      const kind=kindFor(href);
      if(kind&&sameOrigin(href)){
        event.preventDefault();
        event.stopPropagation();
        if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
        openWindow(kind,href);
        return;
      }
    }

    const fileLoaderAction=target.closest('[data-nexus-action="file-loader"]');
    if(fileLoaderAction){
      event.preventDefault();
      event.stopPropagation();
      if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
      openWindow('files',FILE_LOADER);
    }
  },true);

  // Preserve native single-click graph focus. Double-click on the known stable Person node opens its v47 card.
  document.addEventListener('dblclick',event=>{
    const target=event.target instanceof Element?event.target:null;
    const kamilNode=target?.closest('[data-node-id="p-kamil"]');
    if(!kamilNode)return;
    event.preventDefault();
    event.stopPropagation();
    openWindow('person',PERSON_CARD);
  },true);

  window.addEventListener('nexus:open-person-card',event=>{
    const url=event.detail?.url||PERSON_CARD;
    if(sameOrigin(url))openWindow('person',url);
  });

  window.addEventListener('nexus:open-file-loader',event=>{
    const url=event.detail?.url||FILE_LOADER;
    if(sameOrigin(url))openWindow('files',url);
  });
})();
