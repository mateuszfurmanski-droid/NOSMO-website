// NEXUS_WINDOW_MANAGER_ADDON_059_V1
// Upgrades existing Relationship Tree add-ons into movable desktop-like windows.
// Does not create a second graph renderer or a second data model.
(()=>{
  if(window.__NEXUS_WINDOW_MANAGER_ADDON_059__)return;
  window.__NEXUS_WINDOW_MANAGER_ADDON_059__=true;

  const TARGETS=[
    {selector:'#nexusProjectTimeIso',title:'Project Time'},
    {selector:'#nexusCloudPanel',title:'Cloud'},
    {selector:'#nexusIntegrationsPanel',title:'Integrations'},
    {selector:'#nexusSoftwarePanel',title:'Software'}
  ];
  const STORAGE_PREFIX='nexus.window.v1.';
  let topZ=2147483300;

  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const key=id=>STORAGE_PREFIX+id;
  const read=id=>{
    try{
      const parsed=JSON.parse(localStorage.getItem(key(id))||'null');
      if(!parsed||!Number.isFinite(parsed.x)||!Number.isFinite(parsed.y))return null;
      return parsed;
    }catch{return null}
  };
  const save=(id,state)=>{
    try{localStorage.setItem(key(id),JSON.stringify(state))}catch{}
  };
  const clear=id=>{try{localStorage.removeItem(key(id))}catch{}};

  function bringFront(node){
    document.querySelectorAll('[data-nexus-windowable="true"].nx-window-front').forEach(el=>el.classList.remove('nx-window-front'));
    node.classList.add('nx-window-front');
    topZ+=1;
    node.style.setProperty('--nx-window-z',String(topZ));
  }

  function applyPosition(node,x,y){
    const rect=node.getBoundingClientRect();
    const maxX=Math.max(6,(window.innerWidth||document.documentElement.clientWidth)-Math.min(rect.width,window.innerWidth-12)-6);
    const maxY=Math.max(54,(window.innerHeight||document.documentElement.clientHeight)-34-6);
    node.style.setProperty('--nx-window-left',clamp(x,6,maxX)+'px');
    node.style.setProperty('--nx-window-top',clamp(y,54,maxY)+'px');
    node.classList.add('nx-window-free');
  }

  function restoreSaved(node){
    const saved=read(node.id);
    if(!saved)return;
    applyPosition(node,saved.x,saved.y);
    if(saved.minimized)node.classList.add('nx-window-minimized');
  }

  function attach(node,title){
    if(!node||node.dataset.nexusWindowable==='true')return;
    if(!node.id)return;

    node.dataset.nexusWindowable='true';

    const handle=document.createElement('div');
    handle.className='nexus-window-handle';
    handle.dataset.nexusWindowHandle='true';
    handle.setAttribute('role','toolbar');
    handle.setAttribute('aria-label',title+' window controls');

    const grip=document.createElement('span');
    grip.className='nexus-window-grip';
    grip.textContent='•••';

    const label=document.createElement('span');
    label.className='nexus-window-title';
    label.textContent=title;

    const minimize=document.createElement('button');
    minimize.className='nexus-window-btn';
    minimize.type='button';
    minimize.textContent='−';
    minimize.setAttribute('aria-label','Minimize '+title);

    const reset=document.createElement('button');
    reset.className='nexus-window-btn';
    reset.type='button';
    reset.textContent='↺';
    reset.setAttribute('aria-label','Reset '+title+' position');

    handle.append(grip,label,minimize,reset);
    node.appendChild(handle);

    let drag=null;

    handle.addEventListener('pointerdown',event=>{
      if(event.target.closest('button'))return;
      const rect=node.getBoundingClientRect();
      bringFront(node);
      node.classList.add('nx-window-dragging');
      drag={
        pointerId:event.pointerId,
        startX:event.clientX,
        startY:event.clientY,
        left:rect.left,
        top:rect.top
      };
      try{handle.setPointerCapture(event.pointerId)}catch{}
      event.preventDefault();
      event.stopPropagation();
    });

    handle.addEventListener('pointermove',event=>{
      if(!drag||drag.pointerId!==event.pointerId)return;
      applyPosition(node,drag.left+(event.clientX-drag.startX),drag.top+(event.clientY-drag.startY));
      event.preventDefault();
    });

    const finish=event=>{
      if(!drag||drag.pointerId!==event.pointerId)return;
      drag=null;
      node.classList.remove('nx-window-dragging');
      const rect=node.getBoundingClientRect();
      save(node.id,{x:Math.round(rect.left),y:Math.round(rect.top),minimized:node.classList.contains('nx-window-minimized')});
      try{handle.releasePointerCapture(event.pointerId)}catch{}
    };
    handle.addEventListener('pointerup',finish);
    handle.addEventListener('pointercancel',finish);

    minimize.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      const rect=node.getBoundingClientRect();
      if(!node.classList.contains('nx-window-free'))applyPosition(node,rect.left,rect.top);
      node.classList.toggle('nx-window-minimized');
      minimize.textContent=node.classList.contains('nx-window-minimized')?'□':'−';
      minimize.setAttribute('aria-label',(node.classList.contains('nx-window-minimized')?'Restore ':'Minimize ')+title);
      const next=node.getBoundingClientRect();
      save(node.id,{x:Math.round(next.left),y:Math.round(next.top),minimized:node.classList.contains('nx-window-minimized')});
      bringFront(node);
    });

    reset.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      clear(node.id);
      node.classList.remove('nx-window-free','nx-window-minimized');
      node.style.removeProperty('--nx-window-left');
      node.style.removeProperty('--nx-window-top');
      minimize.textContent='−';
      minimize.setAttribute('aria-label','Minimize '+title);
      bringFront(node);
    });

    node.addEventListener('pointerdown',()=>bringFront(node),{passive:true});
    restoreSaved(node);
  }

  function scan(){
    for(const target of TARGETS){
      const node=document.querySelector(target.selector);
      if(node)attach(node,target.title);
    }
    document.querySelectorAll('[data-nexus-window-title]').forEach(node=>attach(node,node.getAttribute('data-nexus-window-title')||'Nexus'));
  }

  const schedule=()=>{
    scan();
    requestAnimationFrame(scan);
    setTimeout(scan,180);
    setTimeout(scan,700);
    setTimeout(scan,1600);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();

  const observer=new MutationObserver(scan);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),20000);

  window.addEventListener('resize',()=>{
    document.querySelectorAll('[data-nexus-windowable="true"].nx-window-free').forEach(node=>{
      const rect=node.getBoundingClientRect();
      applyPosition(node,rect.left,rect.top);
    });
  },{passive:true});
})();
