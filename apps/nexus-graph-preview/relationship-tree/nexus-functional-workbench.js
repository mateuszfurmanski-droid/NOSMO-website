// NEXUS_FUNCTIONAL_WORKBENCH_20260819
// Text-first functional fallback. Does not replace graph/player/panels; it triggers existing controls and hides only experimental add-on dock tiles visually.
(()=>{
  if(window.__NEXUS_FUNCTIONAL_WORKBENCH__)return;
  window.__NEXUS_FUNCTIONAL_WORKBENCH__=true;

  const ACTIONS=[
    ['tree','TREE'],
    ['project','PROJECT'],
    ['time','TIME'],
    ['docs','DOCS'],
    ['cloud','CLOUD'],
    ['soft','SOFT'],
    ['int','INT.']
  ];

  const qs=(sel,root=document)=>root.querySelector(sel);
  const qsa=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const visible=el=>{
    if(!el||!el.isConnected)return false;
    const rect=el.getBoundingClientRect();
    const style=getComputedStyle(el);
    return rect.width>0&&rect.height>0&&style.visibility!=='hidden'&&style.display!=='none';
  };
  const clickNode=node=>{
    if(!node)return false;
    try{
      node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
      return true;
    }catch(error){
      try{node.click();return true;}catch(_){return false;}
    }
  };

  const closeOpenPanels=()=>{
    qsa('#nexusCloudPanel.open,#nexusSoftwarePanel.open,#nexusIntegrationsPanel.open,.nexus-shell-panel.open,.nexus-project-switcher.open,.nexus-time-panel.open').forEach(panel=>panel.classList.remove('open'));
    qsa('#nexusCloudDockTile.active,#nexusSoftwareDockTile.active,#nexusIntegrationsDockTile.active,[data-nexus-injected-time-dock="true"].active').forEach(tile=>tile.classList.remove('active'));
    qs('#nexusShellScrim')?.classList.remove('open');
    document.body.classList.add('nexus-functional-workbench-on');
  };

  const openAddon=(tileId,panelId)=>{
    const tile=document.getElementById(tileId);
    if(tile&&clickNode(tile))return true;
    closeOpenPanels();
    const panel=document.getElementById(panelId);
    if(panel){
      panel.classList.add('open');
      panel.setAttribute('aria-hidden','false');
      qs('#nexusShellScrim')?.classList.add('open');
      return true;
    }
    return false;
  };

  const findAndClick=(terms)=>{
    const patterns=[].concat(terms||[]).map(norm).filter(Boolean);
    const controls=qsa('button,a,[role="button"],[tabindex]').filter(control=>{
      if(!control||control.closest('#nexusFunctionalWorkbench'))return false;
      if(control.closest('#nexusCloudPanel,#nexusSoftwarePanel,#nexusIntegrationsPanel'))return false;
      const hay=norm([control.id,control.getAttribute('aria-label'),control.getAttribute('title'),control.dataset?.nexusAction,control.textContent].filter(Boolean).join(' '));
      return patterns.some(pattern=>hay.includes(pattern));
    });
    const ranked=controls.sort((a,b)=>{
      const av=visible(a)?1:0;
      const bv=visible(b)?1:0;
      const ar=a.getBoundingClientRect();
      const br=b.getBoundingClientRect();
      return (bv-av)||((br.bottom||0)-(ar.bottom||0));
    });
    return clickNode(ranked[0]);
  };

  const run=(action)=>{
    document.body.classList.add('nexus-functional-workbench-on');
    qsa('.nx-fw-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.fwAction===action));
    if(action==='tree'){closeOpenPanels();return;}
    if(action==='cloud'){openAddon('nexusCloudDockTile','nexusCloudPanel');return;}
    if(action==='soft'){openAddon('nexusSoftwareDockTile','nexusSoftwarePanel');return;}
    if(action==='int'){openAddon('nexusIntegrationsDockTile','nexusIntegrationsPanel');return;}
    if(action==='time'){
      if(clickNode(qs('[data-nexus-injected-time-dock="true"]')))return;
      if(findAndClick(['time','project time','timeline']))return;
      const panel=qs('#nexusProjectTimeIso,#nexusProjectTimePanel,.nexus-time-panel');
      if(panel){panel.classList.toggle('open');return;}
      return;
    }
    if(action==='project'){findAndClick(['project','projects','world']);return;}
    if(action==='docs'){findAndClick(['docs','files','file loader','documents']);return;}
  };

  const build=()=>{
    if(qs('#nexusFunctionalWorkbench'))return;
    document.body.classList.add('nexus-functional-workbench-on');
    const bar=document.createElement('nav');
    bar.id='nexusFunctionalWorkbench';
    bar.setAttribute('aria-label','Nexus functional workbench');
    const title=document.createElement('span');
    title.className='nx-fw-title';
    title.textContent='WORK';
    bar.appendChild(title);
    ACTIONS.forEach(([action,label])=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='nx-fw-btn';
      btn.dataset.fwAction=action;
      btn.textContent=label;
      btn.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
        run(action);
      },true);
      bar.appendChild(btn);
    });
    document.body.appendChild(bar);
  };

  const schedule=()=>{
    build();
    document.body.classList.add('nexus-functional-workbench-on');
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  setTimeout(schedule,250);
  setTimeout(schedule,900);
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(schedule,220),{passive:true});
})();
