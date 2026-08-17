// NEXUS_BOTTOM_DOCK_BRIDGE_ISOLATED_20260817
// Wires the existing React bottom dock tiles to the existing Nexus shell actions.
// No styling, no graph mutation, no Project Time UI changes.
(()=>{
  if(window.__NEXUS_BOTTOM_DOCK_BRIDGE__)return;
  window.__NEXUS_BOTTOM_DOCK_BRIDGE__=true;

  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const isInteractive=el=>el&&el.closest&&el.closest('button,a,[role="button"]');
  const click=documentClickTarget=>{
    if(!documentClickTarget)return false;
    try{documentClickTarget.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}))}catch{try{documentClickTarget.click()}catch{return false}}
    return true;
  };
  const clickId=id=>click(document.getElementById(id));
  const clickFirst=selector=>click(document.querySelector(selector));
  const dispatch=(type,detail={})=>window.dispatchEvent(new CustomEvent(type,{detail}));

  const closeShellScrim=()=>{
    document.querySelectorAll('.nexus-shell-panel.open,.nexus-project-switcher.open,.nexus-time-panel.open').forEach(panel=>panel.classList.remove('open'));
    document.getElementById('nexusShellScrim')?.classList.remove('open');
  };

  const findProjectNode=()=>document.querySelector('[data-node-id="proj"] button')||Array.from(document.querySelectorAll('[data-node-id] button')).find(btn=>/project/i.test(btn.textContent||''));
  const findTaskNode=()=>Array.from(document.querySelectorAll('[data-node-id] button')).find(btn=>/\btask\b/i.test(btn.textContent||''));

  const actions={
    tasks(){
      closeShellScrim();
      if(click(findTaskNode()))return;
      dispatch('nexus:dock-action',{action:'tasks'});
    },
    project(){
      if(clickId('nexusTopProject'))return;
      closeShellScrim();
      click(findProjectNode());
    },
    people(){
      if(clickFirst('[data-nexus-action="people"]'))return;
      dispatch('nexus:dock-action',{action:'people'});
    },
    docs(){
      if(clickId('nexusTopFiles'))return;
      if(clickFirst('[data-nexus-file-action="project-files"]'))return;
      dispatch('nexus:dock-action',{action:'docs'});
    },
    tools(){
      if(clickId('nexusTopTools'))return;
      dispatch('nexus:dock-action',{action:'tools'});
    },
    system(){
      if(clickId('nexusTopMenu'))return;
      dispatch('nexus:dock-action',{action:'system'});
    },
    trades(){
      if(clickFirst('[data-nexus-action="trades"]'))return;
      if(clickFirst('#nexusOpenTrades'))return;
      if(window.NexusTrades?.setActiveTrade){window.NexusTrades.setActiveTrade('all');return}
      dispatch('nexus:dock-action',{action:'trades'});
    }
  };

  const getDockLabel=control=>{
    const text=norm(control.textContent||control.getAttribute('aria-label')||'');
    if(!text)return'';
    for(const key of Object.keys(actions)){
      const pattern=new RegExp(`(^|\\b)${key}(\\b|$)`,'i');
      if(pattern.test(text))return key;
    }
    return'';
  };

  const looksLikeBottomDockControl=control=>{
    if(!control||control.closest('#nexusTopRail,#nexusProjectTimeIso,.nexus-shell-panel,.nexus-project-switcher,.nexus-people-panel'))return false;
    const rect=control.getBoundingClientRect();
    const viewportH=window.innerHeight||document.documentElement.clientHeight||0;
    const nearBottom=rect.bottom>=viewportH-170&&rect.top>=viewportH-260;
    const label=getDockLabel(control);
    if(!label)return false;
    if(control.closest('.nexus-mobile-bottom-dock'))return true;
    return nearBottom&&rect.width>=48&&rect.height>=42;
  };

  const markDock=()=>{
    const controls=Array.from(document.querySelectorAll('button,a,[role="button"]')).filter(looksLikeBottomDockControl);
    controls.forEach(control=>{
      const label=getDockLabel(control);
      if(!label)return;
      control.dataset.nexusBottomDockAction=label;
      control.setAttribute('data-nexus-dock-bridge','active');
    });
  };

  const schedule=()=>{
    markDock();
    requestAnimationFrame(markDock);
    setTimeout(markDock,160);
    setTimeout(markDock,520);
    setTimeout(markDock,1300);
  };

  document.addEventListener('click',event=>{
    const control=isInteractive(event.target);
    if(!looksLikeBottomDockControl(control))return;
    const label=getDockLabel(control);
    const action=actions[label];
    if(!action)return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
    control.classList.add('active');
    setTimeout(()=>control.classList.remove('active'),420);
    action();
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(schedule,220),{passive:true});
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>observer.disconnect(),20000);
})();
