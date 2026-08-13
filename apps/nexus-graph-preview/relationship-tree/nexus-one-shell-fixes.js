// NEXUS_ONE_SHELL_FIXES_V4_NATIVE_COMPACT_TIMELINE
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

      /* Disable the later static PROJECT TIME drawer. TIME should use the compact native recorder timeline. */
      #nexusTimelinePanel{display:none!important;visibility:hidden!important;pointer-events:none!important}

      /* Compact recorder timeline recovered from cf5df4a9 / NEXUS_TIMELINE_PANEL_V2_COMPACT_RECORDER. */
      .nexus-time-panel{position:fixed!important;z-index:2147482500!important;left:8px!important;right:8px!important;bottom:calc(var(--nexus-bottom-dock-h,92px) + env(safe-area-inset-bottom,0px) + 8px)!important;top:auto!important;height:auto!important;max-height:none!important;padding:7px 8px 8px!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:6px!important;background:linear-gradient(180deg,rgba(248,252,255,.96),rgba(238,246,251,.98))!important;border:1px solid rgba(31,112,139,.18)!important;border-radius:17px!important;box-shadow:0 12px 30px rgba(39,68,89,.16)!important;-webkit-backdrop-filter:blur(18px)!important;backdrop-filter:blur(18px)!important;color:#102638!important;font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;transform:translateY(140%)!important;opacity:0!important;pointer-events:none!important;transition:transform .2s ease,opacity .16s ease!important}
      .nexus-time-panel.open{transform:translateY(0)!important;opacity:1!important;pointer-events:auto!important}
      .nexus-time-panel .nexus-time-heading{display:none!important}
      .nexus-time-panel .nexus-time-top{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:8px!important}
      .nexus-time-panel .nexus-time-clock{font-size:14px!important;font-weight:900!important;line-height:1.05!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#102638!important}
      .nexus-time-panel .nexus-time-clock-sub,.nexus-time-panel .nexus-time-live,.nexus-time-panel .nexus-time-modes,.nexus-time-panel .nexus-time-phases,.nexus-time-panel .nexus-time-bottom,.nexus-time-panel .nexus-time-metric,.nexus-time-panel .nexus-time-event{display:none!important}
      .nexus-time-panel .nexus-time-playback{display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:6px!important}
      .nexus-time-panel .nexus-time-play{width:32px!important;height:32px!important;border-radius:12px!important;border:1px solid rgba(31,112,139,.14)!important;background:#fff!important;color:#102638!important;font-size:14px!important;display:grid!important;place-items:center!important}
      .nexus-time-panel .nexus-time-play.playing{background:rgba(54,163,255,.2)!important;border-color:rgba(54,163,255,.45)!important}
      .nexus-time-panel .nexus-time-playback select{height:32px!important;min-width:54px!important;border-radius:12px!important;border:1px solid rgba(31,112,139,.14)!important;background:#fff!important;color:#102638!important;padding:0 6px!important;font-weight:800!important}
      .nexus-time-panel .nexus-time-rail-meta{display:flex!important;justify-content:space-between!important;color:#667985!important;font-size:7px!important;margin:0 2px!important;gap:10px!important}
      .nexus-time-panel .nexus-time-rail{height:22px!important;position:relative!important}
      .nexus-time-panel .nexus-time-rail:before{content:""!important;position:absolute!important;left:0!important;right:0!important;top:10px!important;height:3px!important;border-radius:99px!important;background:rgba(31,112,139,.13)!important}
      .nexus-time-panel .nexus-time-progress{position:absolute!important;left:0!important;top:10px!important;height:3px!important;border-radius:99px!important;background:linear-gradient(90deg,#168af0,#67c4ff)!important;width:0;pointer-events:none!important}
      .nexus-time-panel .nexus-time-rail input{position:absolute!important;left:0!important;right:0!important;top:0!important;width:100%!important;height:22px!important;margin:0!important;background:transparent!important;appearance:none!important;-webkit-appearance:none!important;cursor:ew-resize!important}
      .nexus-time-panel .nexus-time-rail input::-webkit-slider-runnable-track{height:3px!important;background:transparent!important}
      .nexus-time-panel .nexus-time-rail input::-webkit-slider-thumb{-webkit-appearance:none!important;width:18px!important;height:18px!important;border-radius:50%!important;background:#e9f6ff!important;border:4px solid #36a3ff!important;margin-top:-7px!important;box-shadow:0 3px 14px rgba(0,0,0,.35),0 0 0 3px rgba(54,163,255,.14)!important}

      /* Keep the React toolbar available for programmatic clicks, but not visible as a second menu. */
      #root [data-nexus-hidden-legacy-toolbar="true"]{display:none!important;visibility:hidden!important;pointer-events:none!important}

      @media (max-width:720px){
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

  const findTimelineButton=()=>{
    const root=document.getElementById('root');
    if(!root)return null;
    return Array.from(root.querySelectorAll('button,[role="button"]')).find(button=>{
      if(button.closest('.nexus-top-rail,.nexus-shell-panel,.nexus-project-switcher'))return false;
      const text=norm(button.innerText||button.textContent);
      return text.includes('timeline');
    })||null;
  };

  const hideLegacyToolbar=()=>{
    const root=document.getElementById('root');
    if(!root)return;
    Array.from(root.querySelectorAll('[data-control],div,section')).forEach(element=>{
      if(element.closest('.nexus-top-rail,.nexus-shell-panel,.nexus-project-switcher'))return;
      const text=norm(element.innerText||element.textContent);
      if(!(text.includes('workflow')&&text.includes('objects')&&text.includes('links')))return;
      const rect=element.getBoundingClientRect();
      if(!rect.width||!rect.height||rect.height>230)return;
      element.dataset.nexusHiddenLegacyToolbar='true';
      element.setAttribute('aria-hidden','true');
    });

    Array.from(root.querySelectorAll('button,a,[role="button"]')).forEach(element=>{
      if(element.closest('.nexus-top-rail,.nexus-shell-panel,.nexus-project-switcher'))return;
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

  const syncTimeLabel=()=>{
    const topSub=document.getElementById('nexusTopTimeSub');
    const button=findTimelineButton();
    const text=norm(button?.innerText||button?.textContent);
    if(topSub)topSub.textContent=text.includes('on')?'ON':'OFF';
    const top=document.getElementById('nexusTopTime');
    top?.classList.toggle('active',text.includes('on'));
  };

  const wireTimeTile=()=>{
    const top=document.getElementById('nexusTopTime');
    if(!top||top.dataset.nexusNativeTimelineBridge==='ready')return;
    top.dataset.nexusNativeTimelineBridge='ready';
    top.addEventListener('click',event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelectorAll('.nexus-shell-panel.open,.nexus-project-switcher.open').forEach(panel=>panel.classList.remove('open'));
      document.getElementById('nexusShellScrim')?.classList.remove('open');
      const button=findTimelineButton();
      if(button)button.click();
      setTimeout(()=>{syncTimeLabel();hideLegacyToolbar();},60);
      setTimeout(()=>{syncTimeLabel();hideLegacyToolbar();},220);
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
    syncTimeLabel();
  };

  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  window.requestAnimationFrame(run);
  window.setTimeout(run,120);
  window.setTimeout(run,350);
  window.setTimeout(run,900);
  window.setTimeout(run,1800);
})();