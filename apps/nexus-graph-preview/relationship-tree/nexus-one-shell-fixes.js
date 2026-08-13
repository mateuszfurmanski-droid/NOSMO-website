// NEXUS_ONE_SHELL_FIXES_V6_SAFE_EXTERNAL_TIME
(()=>{
  if(window.__NEXUS_ONE_SHELL_FIXES_INSTALLED__)return;
  window.__NEXUS_ONE_SHELL_FIXES_INSTALLED__=true;
  if(document.documentElement.dataset.nexusEmbedded==='true')return;

  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const activeWorld=()=>window.__NEXUS_PROJECT_WORLD__||document.documentElement.dataset.nexusWorld||'dev';
  const worldLabel=()=>activeWorld()==='esafe-demo'?'e-SAFE':'RIVERSIDE';

  const installStyle=()=>{
    if(document.getElementById('nexus-one-shell-mobile-style'))return;
    const style=document.createElement('style');
    style.id='nexus-one-shell-mobile-style';
    style.textContent=`
      .nexus-top-rail{z-index:2147483000!important;pointer-events:auto!important}
      .nexus-top-rail *{pointer-events:auto!important}
      .nexus-shell-scrim{z-index:2147483001!important}
      .nexus-shell-panel,.nexus-project-switcher{z-index:2147483002!important;pointer-events:auto!important}

      /* Critical: do not let the old/static or graph-native timeline take over the React root. */
      #nexusTimelinePanel{display:none!important;visibility:hidden!important;pointer-events:none!important}
      #root [data-nexus-hidden-legacy-toolbar="true"]{display:none!important;visibility:hidden!important;pointer-events:none!important}

      #nexusSafeTimePanel{position:fixed;z-index:2147482500;left:8px;right:8px;bottom:calc(var(--nexus-bottom-dock-h,92px) + env(safe-area-inset-bottom,0px) + 8px);max-height:min(42dvh,330px);overflow:auto;-webkit-overflow-scrolling:touch;border:1px solid rgba(31,112,139,.18);border-radius:18px;background:linear-gradient(180deg,rgba(248,252,255,.98),rgba(235,246,251,.98));box-shadow:0 16px 42px rgba(39,68,89,.2);color:#102638;font-family:Inter,Arial,sans-serif;opacity:0;transform:translateY(130%);pointer-events:none;transition:opacity .16s ease,transform .2s ease}
      #nexusSafeTimePanel.open{opacity:1;transform:translateY(0);pointer-events:auto}
      .nexus-safe-time-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 11px 8px;border-bottom:1px solid rgba(31,112,139,.1);position:sticky;top:0;z-index:3;background:linear-gradient(180deg,rgba(248,252,255,.98),rgba(235,246,251,.94));backdrop-filter:blur(10px)}
      .nexus-safe-time-title{display:grid;gap:1px;min-width:0}.nexus-safe-time-title strong{font-size:12px;letter-spacing:.14em}.nexus-safe-time-title small{font-size:8px;color:#667985;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.nexus-safe-time-close{width:34px;height:34px;border-radius:13px;border:1px solid rgba(31,112,139,.14);background:#fff;color:#102638;font-size:24px;font-weight:900}
      .nexus-safe-time-body{padding:9px 10px 10px}.nexus-safe-time-main{display:grid;grid-template-columns:1fr 42px 64px;gap:8px;align-items:center}.nexus-safe-time-date{font-size:19px;font-weight:950;line-height:1.05;letter-spacing:-.04em}.nexus-safe-time-sub{font-size:9px;color:#667985;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nexus-safe-time-play,.nexus-safe-time-select{height:38px;border:1px solid rgba(31,112,139,.12);border-radius:14px;background:#fff;color:#102638;font-weight:950}.nexus-safe-time-select{width:64px;font-size:12px;padding:0 4px}.nexus-safe-time-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.nexus-safe-time-mode{min-height:36px;border:1px solid rgba(31,112,139,.11);border-radius:13px;background:#fff;color:#102638;font:900 8px/1 Inter,Arial,sans-serif;letter-spacing:.08em}.nexus-safe-time-mode.active{background:#d7f3ff;color:#08748a;border-color:rgba(20,142,170,.45)}.nexus-safe-time-railmeta{display:flex;justify-content:space-between;gap:8px;color:#667985;font-size:8px;font-weight:800;margin:9px 2px 3px}.nexus-safe-time-rail{height:25px;position:relative}.nexus-safe-time-rail:before{content:"";position:absolute;left:0;right:0;top:11px;height:3px;border-radius:999px;background:rgba(31,112,139,.14)}.nexus-safe-time-progress{position:absolute;left:0;top:11px;height:3px;border-radius:999px;background:linear-gradient(90deg,#168af0,#67c4ff);width:100%;pointer-events:none}.nexus-safe-time-slider{position:absolute;left:0;right:0;top:0;width:100%;height:24px;margin:0;appearance:none;-webkit-appearance:none;background:transparent}.nexus-safe-time-slider::-webkit-slider-runnable-track{height:3px;background:transparent}.nexus-safe-time-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#e9f6ff;border:4px solid #36a3ff;margin-top:-7px;box-shadow:0 3px 14px rgba(0,0,0,.25),0 0 0 3px rgba(54,163,255,.14)}.nexus-safe-time-note{margin-top:7px;border:1px solid rgba(31,112,139,.1);border-radius:12px;background:#fff;padding:8px;font-size:9px;line-height:1.35;color:#667985}.nexus-safe-time-note strong{display:block;color:#102638;font-size:10px;margin-bottom:2px}

      @media (max-width:720px){
        #nexusSafeTimePanel{left:7px;right:7px;bottom:calc(var(--nexus-bottom-dock-h,92px) + env(safe-area-inset-bottom,0px) + 7px);max-height:40dvh;border-radius:17px}
        [aria-label="Nexus folder dock"] div[class*="max-h-"]{max-height:34dvh!important}
        [aria-label="Nexus folder dock"] button[title],
        [aria-label="Nexus folder dock"] a[title]{width:68px!important;height:54px!important;min-height:54px!important;padding:5px 6px!important;border-radius:11px!important;gap:2px!important}
        [aria-label="Nexus folder dock"] button[title] svg,
        [aria-label="Nexus folder dock"] a[title] svg{width:18px!important;height:18px!important}
        [aria-label="Nexus folder dock"] [data-nosmo-file-icon]{width:32px!important;height:32px!important}
        [aria-label="Nexus folder dock"] button[title] span,
        [aria-label="Nexus folder dock"] a[title] span{font-size:8px!important;line-height:1.05!important}
      }
    `;
    document.head.appendChild(style);
  };

  const hideLegacyToolbar=()=>{
    const root=document.getElementById('root');
    if(!root)return;
    Array.from(root.querySelectorAll('[data-control],div,section')).forEach(element=>{
      if(element.closest('.nexus-top-rail,.nexus-shell-panel,.nexus-project-switcher,#nexusSafeTimePanel'))return;
      const text=norm(element.innerText||element.textContent);
      if(!(text.includes('workflow')&&text.includes('objects')&&text.includes('links')))return;
      const rect=element.getBoundingClientRect();
      if(!rect.width||!rect.height||rect.height>230)return;
      element.dataset.nexusHiddenLegacyToolbar='true';
      element.setAttribute('aria-hidden','true');
    });

    Array.from(root.querySelectorAll('button,a,[role="button"]')).forEach(element=>{
      if(element.closest('.nexus-top-rail,.nexus-shell-panel,.nexus-project-switcher,#nexusSafeTimePanel'))return;
      const text=norm(element.innerText||element.textContent);
      const rect=element.getBoundingClientRect();
      if((text==='project'||text==='projects')&&rect.top>window.innerHeight*.58){
        element.style.display='none';
        element.style.visibility='hidden';
        element.style.pointerEvents='none';
        element.setAttribute('aria-hidden','true');
      }
    });
  };

  const ensureSafeTimePanel=()=>{
    let panel=document.getElementById('nexusSafeTimePanel');
    if(panel)return panel;
    panel=document.createElement('aside');
    panel.id='nexusSafeTimePanel';
    panel.setAttribute('aria-label','Safe project time panel');
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML=`
      <div class="nexus-safe-time-head">
        <span class="nexus-safe-time-title"><strong>PROJECT TIME</strong><small id="nexusSafeTimeWorld">${worldLabel()} · SAFE OVERLAY</small></span>
        <button class="nexus-safe-time-close" type="button" aria-label="Close time panel">×</button>
      </div>
      <div class="nexus-safe-time-body">
        <div class="nexus-safe-time-main">
          <div><div class="nexus-safe-time-date" id="nexusSafeTimeDate">8 Aug 2026</div><div class="nexus-safe-time-sub" id="nexusSafeTimeSub">Graph-safe external timeline. Runtime untouched.</div></div>
          <button class="nexus-safe-time-play" type="button" aria-label="Play project time">▶</button>
          <select class="nexus-safe-time-select" aria-label="Playback speed"><option>1×</option><option>5×</option><option>20×</option><option>100×</option></select>
        </div>
        <div class="nexus-safe-time-modes"><button class="nexus-safe-time-mode active" type="button">REAL</button><button class="nexus-safe-time-mode" type="button">REPLAY</button><button class="nexus-safe-time-mode" type="button">SIM</button></div>
        <div class="nexus-safe-time-railmeta"><span>25 Jul 2026</span><span>SAFE</span><span>8 Aug 2026</span></div>
        <div class="nexus-safe-time-rail"><div class="nexus-safe-time-progress"></div><input class="nexus-safe-time-slider" type="range" min="0" max="100" value="100" /></div>
        <div class="nexus-safe-time-note"><strong>Recorder preserved as safe overlay</strong>Ten panel nie klika ukrytego timeline w grafie, więc nie powinien już wywalać drzewka do Loading. Pełny recorder / V2 / Tape zostają w historii do recovery lab.</div>
      </div>`;
    document.body.appendChild(panel);
    panel.querySelector('.nexus-safe-time-close')?.addEventListener('click',closeSafeTimePanel);
    panel.querySelectorAll('.nexus-safe-time-mode').forEach(button=>button.addEventListener('click',()=>{
      panel.querySelectorAll('.nexus-safe-time-mode').forEach(item=>item.classList.toggle('active',item===button));
    }));
    return panel;
  };

  const openSafeTimePanel=()=>{
    installStyle();
    const panel=ensureSafeTimePanel();
    document.querySelectorAll('.nexus-shell-panel.open,.nexus-project-switcher.open').forEach(item=>item.classList.remove('open'));
    document.getElementById('nexusShellScrim')?.classList.remove('open');
    document.getElementById('nexusSafeTimeWorld').textContent=`${worldLabel()} · SAFE OVERLAY`;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    const top=document.getElementById('nexusTopTime');
    const topSub=document.getElementById('nexusTopTimeSub');
    top?.classList.add('active');
    if(topSub)topSub.textContent='SAFE';
  };

  function closeSafeTimePanel(){
    const panel=document.getElementById('nexusSafeTimePanel');
    panel?.classList.remove('open');
    panel?.setAttribute('aria-hidden','true');
    document.getElementById('nexusTopTime')?.classList.remove('active');
    const topSub=document.getElementById('nexusTopTimeSub');
    if(topSub)topSub.textContent='OFF';
  }

  const wireTimeTile=()=>{
    const top=document.getElementById('nexusTopTime');
    if(!top||top.dataset.nexusSafeExternalTime==='ready')return;
    top.dataset.nexusSafeExternalTime='ready';
    top.addEventListener('click',event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      const panel=document.getElementById('nexusSafeTimePanel');
      if(panel?.classList.contains('open'))closeSafeTimePanel();
      else openSafeTimePanel();
      hideLegacyToolbar();
    },true);
  };

  const tuneLabels=()=>{
    const projectSub=document.getElementById('nexusTopProjectSub');
    if(projectSub)projectSub.textContent=worldLabel();
  };

  const run=()=>{
    installStyle();
    tuneLabels();
    wireTimeTile();
    hideLegacyToolbar();
  };

  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  window.requestAnimationFrame(run);
  window.setTimeout(run,120);
  window.setTimeout(run,350);
  window.setTimeout(run,900);
  window.setTimeout(run,1800);
})();