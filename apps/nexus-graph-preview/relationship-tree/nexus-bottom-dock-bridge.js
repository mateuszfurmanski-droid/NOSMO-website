// NEXUS_BOTTOM_DOCK_BRIDGE_ISOLATED_20260817
// Wires the existing React bottom dock tiles to Nexus shell actions.
// Add-on only: adds a TIME tile after TASKS and compacts the top shell to menu + clock chip.
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

  const installStyle=()=>{
    if(document.getElementById('nexusBottomDockBridgeStyle'))return;
    const style=document.createElement('style');
    style.id='nexusBottomDockBridgeStyle';
    style.textContent=`
      :root{--nexus-top-h:50px!important}
      #root{top:var(--nexus-top-h)!important}
      #nexusTopRail{display:flex!important;grid-template-columns:none!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;height:var(--nexus-top-h)!important;min-height:var(--nexus-top-h)!important;padding:5px 8px!important;background:rgba(248,252,255,.94)!important;border-bottom:1px solid rgba(31,112,139,.14)!important;box-shadow:0 6px 16px rgba(5,31,45,.06)!important;overflow:visible!important}
      #nexusTopProject,#nexusTopTime,#nexusTopFiles,#nexusTopTools{display:none!important;visibility:hidden!important;pointer-events:none!important}
      #nexusTopMenu{position:relative!important;display:grid!important;place-items:center!important;align-content:center!important;width:42px!important;min-width:42px!important;max-width:42px!important;height:40px!important;min-height:40px!important;border:1px solid rgba(31,143,174,.22)!important;border-radius:14px!important;background:linear-gradient(180deg,rgba(245,252,255,.98),rgba(220,241,248,.94))!important;box-shadow:0 5px 14px rgba(6,40,52,.10),inset 0 0 0 1px rgba(255,255,255,.72)!important;overflow:visible!important;padding:0!important}
      #nexusTopMenu .nexus-top-icon{width:32px!important;height:32px!important;border-radius:12px!important;font-size:20px!important;margin:0!important;background:linear-gradient(145deg,#1789ed,#5bb8ff)!important;color:#fff!important;box-shadow:0 4px 12px rgba(23,137,237,.25),inset 0 0 0 1px rgba(255,255,255,.25)!important}
      #nexusTopMenu .nexus-top-label,#nexusTopMenu .nexus-top-sub{display:none!important}
      #nexusTopTimeChip{position:absolute!important;left:48px!important;right:auto!important;top:2px!important;width:76px!important;min-width:76px!important;height:36px!important;border-radius:14px!important;font-size:10px!important;letter-spacing:.05em!important;background:linear-gradient(180deg,rgba(245,252,255,.98),rgba(217,241,249,.94))!important;border:1px solid rgba(31,143,174,.24)!important;box-shadow:0 5px 14px rgba(6,40,52,.10),inset 0 0 0 1px rgba(255,255,255,.72)!important;color:#0d7894!important}
      #nexusTopTimeChip::before{font-size:11px!important;color:#1597b8!important}
      #nexusTopTimeChip[data-state='on']{border-color:rgba(21,151,184,.72)!important;background:linear-gradient(180deg,rgba(232,249,254,.98),rgba(193,234,248,.96))!important;color:#075d74!important;box-shadow:0 0 0 1px rgba(21,151,184,.16),0 5px 14px rgba(6,40,52,.12),inset 0 0 0 1px rgba(255,255,255,.82)!important}
      #nexusTopTimeChip[data-state='on']::after{right:6px!important;bottom:6px!important;width:4px!important;height:4px!important;background:#61f58a!important;box-shadow:0 0 9px rgba(97,245,138,.95)!important}
      [data-nexus-injected-time-dock='true']{position:relative!important;display:flex!important;flex:0 0 auto!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:7px!important;box-sizing:border-box!important;min-width:106px!important;max-width:116px!important;width:106px!important;min-height:94px!important;height:94px!important;padding:10px 8px 16px!important;overflow:hidden!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
      [data-nexus-injected-time-dock='true'] .nexus-injected-dock-icon{display:grid!important;place-items:center!important;width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;margin:0!important;border-radius:12px!important;background:rgba(14,226,255,.10)!important;color:#18d7ff!important;font-size:22px!important;font-weight:900!important;line-height:1!important;text-shadow:0 0 10px rgba(24,215,255,.44)!important;box-sizing:border-box!important;flex:0 0 auto!important}
      [data-nexus-injected-time-dock='true'] .nexus-injected-dock-label{display:block!important;position:static!important;margin:0!important;padding:0!important;color:#dff9ff!important;font-family:Inter,Arial,sans-serif!important;font-size:12px!important;font-weight:950!important;line-height:1!important;letter-spacing:.08em!important;text-align:center!important;text-transform:uppercase!important;text-shadow:0 0 9px rgba(14,226,255,.32)!important;white-space:nowrap!important;overflow:visible!important;flex:0 0 auto!important}
      [data-nexus-injected-time-dock='true']::after{content:'';position:absolute;left:50%;bottom:8px;width:5px;height:5px;border-radius:50%;transform:translateX(-50%);background:#61f58a;box-shadow:0 0 10px rgba(97,245,138,.85)}
      .nexus-shell-panel{top:calc(var(--nexus-top-h) + 8px)!important;max-height:calc(100vh - var(--nexus-top-h) - 16px)!important}
      @media(max-width:390px){#nexusTopRail{padding-left:7px!important}#nexusTopMenu{width:40px!important;min-width:40px!important;height:38px!important}#nexusTopMenu .nexus-top-icon{width:30px!important;height:30px!important;font-size:19px!important}#nexusTopTimeChip{left:46px!important;width:72px!important;min-width:72px!important;height:34px!important;font-size:9px!important}[data-nexus-injected-time-dock='true']{min-width:102px!important;max-width:112px!important;width:102px!important}}
    `;
    document.head.appendChild(style);
  };

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
    time(){
      closeShellScrim();
      if(clickId('nexusTopTimeChip'))return;
      if(clickId('nexusTopTime'))return;
      dispatch('nexus:dock-action',{action:'time'});
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
    const explicit=control?.dataset?.nexusBottomDockAction;
    if(explicit&&actions[explicit])return explicit;
    const text=norm(control?.textContent||control?.getAttribute('aria-label')||'');
    if(!text)return'';
    for(const key of Object.keys(actions)){
      const pattern=new RegExp(`(^|\\b)${key}(\\b|$)`,'i');
      if(pattern.test(text))return key;
    }
    return'';
  };

  const looksLikeBottomDockControl=control=>{
    if(!control||control.closest('#nexusTopRail,#nexusProjectTimeIso,.nexus-shell-panel,.nexus-project-switcher,.nexus-people-panel'))return false;
    if(control.dataset?.nexusInjectedTimeDock==='true')return true;
    const rect=control.getBoundingClientRect();
    const viewportH=window.innerHeight||document.documentElement.clientHeight||0;
    const nearBottom=rect.bottom>=viewportH-170&&rect.top>=viewportH-285;
    const label=getDockLabel(control);
    if(!label)return false;
    if(control.closest('.nexus-mobile-bottom-dock'))return true;
    return nearBottom&&rect.width>=48&&rect.height>=42;
  };

  const getDockControls=()=>Array.from(document.querySelectorAll('button,a,[role="button"]')).filter(looksLikeBottomDockControl);

  const resetDockScroll=container=>{
    if(!container)return;
    const reset=()=>{try{container.scrollLeft=0}catch{}};
    reset();
    requestAnimationFrame(reset);
    setTimeout(reset,120);
  };

  const installTimeTile=()=>{
    if(document.querySelector('[data-nexus-injected-time-dock="true"]'))return;
    const controls=getDockControls().filter(control=>control.dataset?.nexusInjectedTimeDock!=='true');
    const task=controls.find(control=>getDockLabel(control)==='tasks');
    const existingTime=controls.find(control=>getDockLabel(control)==='time');
    if(existingTime||!task||!task.parentElement)return;
    const tile=task.cloneNode(true);
    tile.dataset.nexusInjectedTimeDock='true';
    tile.dataset.nexusBottomDockAction='time';
    tile.setAttribute('data-nexus-dock-bridge','active');
    tile.setAttribute('aria-label','TIME');
    tile.removeAttribute('id');
    tile.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    tile.innerHTML='<span class="nexus-injected-dock-icon" aria-hidden="true">◷</span><span class="nexus-injected-dock-label">TIME</span>';
    task.parentElement.insertBefore(tile,task.nextSibling);
    resetDockScroll(task.parentElement);
  };

  const markDock=()=>{
    installStyle();
    installTimeTile();
    getDockControls().forEach(control=>{
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
  setTimeout(()=>observer.disconnect(),24000);
})();
