// NEXUS_SEMANTIC_DRAG_ADDON_059_V1
// Manager-side direct manipulation using the existing Relationship Tree DOM.
// Composition is ephemeral UI state. Authority/persistence remains outside this add-on.
(()=>{
  if(window.__NEXUS_SEMANTIC_DRAG_ADDON_059__)return;
  window.__NEXUS_SEMANTIC_DRAG_ADDON_059__=true;
  if(document.documentElement.dataset.nexusEmbedded==='true')return;

  const params=new URLSearchParams(window.location.search);
  const accessProfile=(params.get('accessProfile')||'manager').toLowerCase();
  if(accessProfile!=='manager')return;

  const sourceTypes=new Set(['task','document','module','app','evidence']);
  const targetTypes=new Set(['person','project','task','module']);
  const draft={id:'draft-'+Date.now().toString(36),items:[]};
  let activeDrag=null;
  let currentTarget=null;
  let toastTimer=null;

  const norm=value=>String(value||'').replace(/\s+/g,' ').trim();
  const lower=value=>norm(value).toLowerCase();
  const iconFor=type=>type==='task'?'✓':type==='document'?'▤':type==='module'?'◇':type==='app'?'▦':type==='evidence'?'◉':type==='work-package'?'▣':'•';

  function nodeInfo(node){
    if(!node)return null;
    const id=node.getAttribute('data-node-id')||'';
    const button=node.querySelector('button');
    if(!id||!button)return null;
    const spans=Array.from(button.children).filter(el=>el instanceof HTMLElement&&el.tagName==='SPAN');
    const typeSpan=spans.find(span=>['project','person','task','document','issue','module'].includes(lower(span.textContent)));
    const type=lower(typeSpan?.textContent);
    const copy=spans
      .filter(span=>span!==typeSpan&&!span.querySelector('svg'))
      .map(span=>norm(span.textContent))
      .filter(Boolean)
      .filter(text=>!lower(text).startsWith('received '));
    return{
      id,
      canonicalPersonId:type==='person'?(node.dataset.canonicalPersonId||null):null,
      label:copy[0]||id,
      sublabel:copy[1]||'',
      type,
      node
    };
  }

  function liveSources(){
    const seen=new Set();
    const result=[];
    document.querySelectorAll('[data-node-id]').forEach(node=>{
      const info=nodeInfo(node);
      if(!info||!sourceTypes.has(info.type)||seen.has(info.id))return;
      seen.add(info.id);
      result.push(info);
    });
    const capabilities=[
      {id:'app-worksuite',label:'WorkSuite',sublabel:'Project-scoped application capability',type:'app',paletteCapability:true},
      {id:'evidence-requirement',label:'Evidence requirement',sublabel:'Before / after photo or evidence obligation',type:'evidence',paletteCapability:true}
    ];
    const order={task:0,document:1,module:2,app:3,evidence:4};
    return [...result,...capabilities]
      .sort((a,b)=>(order[a.type]??9)-(order[b.type]??9)||a.label.localeCompare(b.label))
      .slice(0,20);
  }

  function projectContext(){
    return{
      worldId:window.__NEXUS_PROJECT_WORLD__||params.get('world')||'dev',
      projectLabel:norm(document.querySelector('#nexusTopProject .nexus-top-sub')?.textContent)||'PROJECT WORLD',
      route:window.location.pathname+window.location.search
    };
  }

  function compatible(sourceType,targetType){
    if(sourceType==='work-package')return ['person','project','task','module'].includes(targetType);
    if(sourceType==='task')return ['person','project','module'].includes(targetType);
    if(sourceType==='document')return ['person','task','project','module'].includes(targetType);
    if(sourceType==='module'||sourceType==='app')return ['person','project'].includes(targetType);
    if(sourceType==='evidence')return ['task','person','project','module'].includes(targetType);
    return false;
  }

  function ensureUi(){
    let workTile=document.getElementById('nexusSemanticWorkTile');
    const dock=findDock();
    if(dock&&!workTile){
      workTile=document.createElement('button');
      workTile.id='nexusSemanticWorkTile';
      workTile.type='button';
      workTile.setAttribute('aria-label','Open semantic work palette');
      workTile.innerHTML='<span class="nx-sem-work-icon">▣</span><span>WORK</span>';
      workTile.addEventListener('click',togglePalette);
      dock.appendChild(workTile);
    }

    if(!document.getElementById('nexusSemanticPalette')){
      const palette=document.createElement('section');
      palette.id='nexusSemanticPalette';
      palette.setAttribute('aria-label','Manager semantic source palette');
      palette.innerHTML='<div class="nx-sem-palette-head"><strong>COMPOSE THE WORK</strong><small>Drag real graph objects · drop on target</small></div><div class="nx-sem-source-strip"></div>';
      document.body.appendChild(palette);
    }

    if(!document.getElementById('nexusWorkPackageComposer')){
      const composer=document.createElement('aside');
      composer.id='nexusWorkPackageComposer';
      composer.dataset.nexusWindowTitle='Work Package';
      composer.setAttribute('aria-label','Work Package draft');
      composer.innerHTML='<div class="nx-wp-status"><strong>DRAFT WORK PACKAGE</strong><span>NOT ASSIGNED</span></div><div class="nx-wp-dropzone">DROP TASK / DOCUMENT / MODULE HERE<br>Composition ≠ assignment</div><div class="nx-wp-list"></div><button class="nx-wp-assign" type="button" disabled>DRAG PACKAGE TO PERSON / OBJECT</button>';
      document.body.appendChild(composer);
      window.NexusWindowManager?.scan?.();
      const assign=composer.querySelector('.nx-wp-assign');
      assign?.addEventListener('pointerdown',event=>{
        if(assign.disabled)return;
        beginDrag(event,{id:draft.id,label:'Work Package',type:'work-package',items:draft.items.slice()},'package');
      });
    }

    if(!document.getElementById('nexusSemanticGhost')){
      const ghost=document.createElement('div');
      ghost.id='nexusSemanticGhost';
      ghost.innerHTML='<b>•</b><span>Dragging</span>';
      document.body.appendChild(ghost);
    }

    if(!document.getElementById('nexusSemanticToast')){
      const toast=document.createElement('div');
      toast.id='nexusSemanticToast';
      document.body.appendChild(toast);
    }
  }

  function findDock(){
    const known=document.getElementById('nexusCloudDockTile')||document.getElementById('nexusIntegrationsDockTile')||document.querySelector('[data-nexus-injected-time-dock="true"]');
    if(known?.parentElement)return known.parentElement;

    const controls=Array.from(document.querySelectorAll('button,a,[role="button"]')).filter(control=>{
      if(control.id==='nexusSemanticWorkTile')return false;
      if(control.closest('#nexusTopRail,#nexusSemanticPalette,#nexusWorkPackageComposer,.nexus-shell-panel,.nexus-project-switcher'))return false;
      const label=lower(control.textContent||control.getAttribute('aria-label'));
      if(!['tasks','project','people','docs','tools','time'].some(value=>label===value||label.includes(value)))return false;
      const rect=control.getBoundingClientRect();
      const vh=window.innerHeight||document.documentElement.clientHeight||0;
      return rect.bottom>=vh-210&&rect.top>=vh-310&&rect.width>=38&&rect.height>=34;
    });
    const groups=new Map();
    controls.forEach(control=>{
      const parent=control.parentElement;
      if(parent)groups.set(parent,(groups.get(parent)||0)+1);
    });
    return Array.from(groups.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
  }

  function togglePalette(){
    ensureUi();
    const palette=document.getElementById('nexusSemanticPalette');
    const tile=document.getElementById('nexusSemanticWorkTile');
    const next=!palette.classList.contains('open');
    palette.classList.toggle('open',next);
    tile?.classList.toggle('active',next);
    if(next)renderPalette();
  }

  function renderPalette(){
    const strip=document.querySelector('#nexusSemanticPalette .nx-sem-source-strip');
    if(!strip)return;
    const sources=liveSources();
    strip.innerHTML='';
    if(!sources.length){
      const empty=document.createElement('div');
      empty.className='nx-sem-source';
      empty.textContent='No draggable task/document/module nodes are mounted in this view.';
      strip.appendChild(empty);
      return;
    }
    sources.forEach(source=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='nx-sem-source';
      button.dataset.sourceId=source.id;
      button.dataset.sourceType=source.type;
      button.innerHTML='<span class="nx-sem-source-icon">'+iconFor(source.type)+'</span><strong></strong><small></small>';
      button.querySelector('strong').textContent=source.label;
      button.querySelector('small').textContent=(source.paletteCapability?'PALETTE CAPABILITY · ':'')+source.type+' · '+source.id;
      button.addEventListener('pointerdown',event=>beginDrag(event,source,'source'));
      strip.appendChild(button);
    });
  }

  function showComposer(){
    ensureUi();
    const composer=document.getElementById('nexusWorkPackageComposer');
    composer.classList.add('open');
    composer.setAttribute('aria-hidden','false');
    if(!composer.classList.contains('nx-window-free')){
      composer.style.setProperty('--nx-window-left',Math.max(8,(window.innerWidth||430)-450)+'px');
      composer.style.setProperty('--nx-window-top','84px');
      composer.classList.add('nx-window-free');
    }
    window.NexusWindowManager?.scan?.();
    window.NexusWindowManager?.bringToFront?.(composer);
    renderPackage();
  }

  function renderPackage(){
    const composer=document.getElementById('nexusWorkPackageComposer');
    if(!composer)return;
    const list=composer.querySelector('.nx-wp-list');
    const assign=composer.querySelector('.nx-wp-assign');
    const status=composer.querySelector('.nx-wp-status span');
    if(status)status.textContent=draft.items.length?draft.items.length+' ITEMS · NOT ASSIGNED':'NOT ASSIGNED';
    if(assign)assign.disabled=!draft.items.length;
    list.innerHTML='';
    draft.items.forEach(item=>{
      const row=document.createElement('div');
      row.className='nx-wp-item';
      row.innerHTML='<span><strong></strong><small></small></span><button class="nx-wp-remove" type="button" aria-label="Remove item">×</button>';
      row.querySelector('strong').textContent=item.label;
      row.querySelector('small').textContent=item.type+' · '+item.id;
      row.querySelector('.nx-wp-remove').addEventListener('click',()=>{
        draft.items=draft.items.filter(entry=>entry.id!==item.id);
        renderPackage();
      });
      list.appendChild(row);
    });
  }

  function addToPackage(source){
    if(!source||source.type==='work-package')return;
    if(!draft.items.some(item=>item.id===source.id)){
      draft.items.push({id:source.id,label:source.label,type:source.type});
    }
    showComposer();
    showToast('ADDED TO DRAFT · '+source.label+' · '+draft.items.length+' item'+(draft.items.length===1?'':'s'),'ok');
  }

  function beginDrag(event,source,mode){
    if(event.button!=null&&event.button!==0)return;
    ensureUi();
    activeDrag={
      pointerId:event.pointerId,
      source,
      mode,
      origin:event.currentTarget
    };
    try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}
    updateGhost(event.clientX,event.clientY,source,false,null);
    document.addEventListener('pointermove',moveDrag,true);
    document.addEventListener('pointerup',endDrag,true);
    document.addEventListener('pointercancel',cancelDrag,true);
    event.preventDefault();
    event.stopPropagation();
  }

  function moveDrag(event){
    if(!activeDrag||event.pointerId!==activeDrag.pointerId)return;
    const hit=document.elementFromPoint(event.clientX,event.clientY);
    const dropzone=hit?.closest?.('.nx-wp-dropzone');
    const node=hit?.closest?.('[data-node-id]');

    clearTarget();

    if(dropzone&&activeDrag.mode==='source'){
      dropzone.classList.add('nx-sem-compatible');
      currentTarget={kind:'package',node:dropzone,compatible:true};
      updateGhost(event.clientX,event.clientY,activeDrag.source,true,'ADD TO PACKAGE');
      event.preventDefault();
      return;
    }

    const info=nodeInfo(node);
    if(info&&targetTypes.has(info.type)){
      const ok=compatible(activeDrag.source.type,info.type);
      node.classList.add('nexus-semantic-drop-target');
      if(!ok)node.classList.add('nx-sem-incompatible');
      currentTarget={kind:'graph',node,info,compatible:ok};
      updateGhost(event.clientX,event.clientY,activeDrag.source,ok,ok?'DROP → '+info.label:'INCOMPATIBLE');
    }else{
      currentTarget=null;
      updateGhost(event.clientX,event.clientY,activeDrag.source,false,null);
    }
    event.preventDefault();
  }

  function endDrag(event){
    if(!activeDrag||event.pointerId!==activeDrag.pointerId)return;
    const drag=activeDrag;
    const target=currentTarget;
    cleanupDrag();

    if(target?.kind==='package'&&target.compatible){
      addToPackage(drag.source);
      return;
    }

    if(target?.kind==='graph'&&target.compatible){
      emitSemanticIntent(drag.source,target.info);
      return;
    }

    showToast('DROP CANCELLED · no compatible target','blocked');
  }

  function cancelDrag(event){
    if(activeDrag&&event.pointerId===activeDrag.pointerId)cleanupDrag();
  }

  function cleanupDrag(){
    const drag=activeDrag;
    activeDrag=null;
    clearTarget();
    const ghost=document.getElementById('nexusSemanticGhost');
    ghost?.classList.remove('open','compatible','incompatible');
    document.removeEventListener('pointermove',moveDrag,true);
    document.removeEventListener('pointerup',endDrag,true);
    document.removeEventListener('pointercancel',cancelDrag,true);
    try{drag?.origin?.releasePointerCapture?.(drag.pointerId)}catch{}
  }

  function clearTarget(){
    document.querySelectorAll('.nexus-semantic-drop-target').forEach(node=>node.classList.remove('nexus-semantic-drop-target','nx-sem-incompatible'));
    document.querySelectorAll('.nx-wp-dropzone.nx-sem-compatible').forEach(node=>node.classList.remove('nx-sem-compatible'));
    currentTarget=null;
  }

  function updateGhost(x,y,source,isCompatible,caption){
    const ghost=document.getElementById('nexusSemanticGhost');
    if(!ghost)return;
    ghost.classList.add('open');
    ghost.classList.toggle('compatible',!!isCompatible);
    ghost.classList.toggle('incompatible',caption==='INCOMPATIBLE');
    ghost.style.left=Math.round(x)+'px';
    ghost.style.top=Math.round(y)+'px';
    ghost.querySelector('b').textContent=iconFor(source.type);
    ghost.querySelector('span').textContent=caption?source.label+' · '+caption:source.label;
  }

  function emitSemanticIntent(source,target){
    const isPackage=source.type==='work-package';
    const sources=isPackage?draft.items.slice():[{id:source.id,label:source.label,type:source.type}];
    const detail={
      schema:'nexus-semantic-drop-request/v1',
      actor:{accessProfile:'manager'},
      projectContext:projectContext(),
      sources,
      target:{
        id:target.id,
        canonicalPersonId:target.canonicalPersonId||null,
        label:target.label,
        type:target.type
      },
      workPackage:isPackage?{draftId:draft.id,items:draft.items.slice()}:null,
      requestedAt:new Date().toISOString(),
      uiOrigin:'canonical-relationship-tree'
    };

    window.dispatchEvent(new CustomEvent('nexus:semantic-drop-request',{detail}));
    showToast(
      (isPackage?'WORK PACKAGE':'DROP')+' INTENT · '+sources.length+' source'+(sources.length===1?'':'s')+' → '+target.label+' · awaiting Core authority',
      'ok'
    );
  }

  function showToast(message,tone=''){
    const toast=document.getElementById('nexusSemanticToast');
    if(!toast)return;
    clearTimeout(toastTimer);
    toast.textContent=message;
    toast.className='open '+tone;
    toastTimer=setTimeout(()=>toast.className='',4200);
  }

  function schedule(){
    ensureUi();
    renderPalette();
    requestAnimationFrame(ensureUi);
    setTimeout(ensureUi,220);
    setTimeout(ensureUi,900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();

  window.addEventListener('nexus:project-world-change',()=>setTimeout(renderPalette,220));
  window.addEventListener('nexus:trade-change',()=>setTimeout(renderPalette,220));
  const observer=new MutationObserver(()=>{ensureUi();if(document.getElementById('nexusSemanticPalette')?.classList.contains('open'))renderPalette()});
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),18000);
})();
