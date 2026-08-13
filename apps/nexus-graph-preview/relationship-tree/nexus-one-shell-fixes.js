// NEXUS_ONE_SHELL_FIXES_V3_COMPACT_TIMELINE
(()=>{
  if(window.__NEXUS_ONE_SHELL_FIXES_INSTALLED__)return;
  window.__NEXUS_ONE_SHELL_FIXES_INSTALLED__=true;
  if(document.documentElement.dataset.nexusEmbedded==='true')return;

  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const activeWorld=()=>window.__NEXUS_PROJECT_WORLD__||document.documentElement.dataset.nexusWorld||'dev';
  const worldLabel=()=>activeWorld()==='esafe-demo'?'e-SAFE':'RIVERSIDE';

  const hideClosestCard=element=>{
    if(!element)return;
    const card=element.closest('[class*="rounded"], [class*="shadow"], section, aside, div')||element;
    card.style.display='none';
    card.style.visibility='hidden';
    card.style.pointerEvents='none';
    card.setAttribute('aria-hidden','true');
    card.dataset.nexusHiddenLegacyControl='true';
  };

  const hideLegacyGraphControls=()=>{
    const root=document.getElementById('root');
    if(!root)return;
    const buttonsAndPanels=Array.from(root.querySelectorAll('button, a, [role="button"], div, section'));
    buttonsAndPanels.forEach(element=>{
      if(element.closest('.nexus-top-rail,.nexus-shell-panel,.nexus-project-switcher'))return;
      const text=norm(element.innerText||element.textContent);
      if(!text)return;
      const rect=element.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const isLegacyTimeline=text.includes('timeline off')||text.includes('timeline on')||(text.includes('workflow')&&text.includes('objects')&&text.includes('links'));
      const isBottomProject=(text==='project'||text==='projects')&&rect.top>window.innerHeight*0.58;
      if(isLegacyTimeline||isBottomProject)hideClosestCard(element);
    });
  };

  const tuneTimelinePanel=()=>{
    const panel=document.getElementById('nexusTimelinePanel');
    if(!panel)return;
    panel.dataset.nexusCompactTimeline='true';
    const label=worldLabel();
    panel.querySelectorAll('.nexus-shell-section-title').forEach(title=>{
      if(norm(title.textContent).includes('project timeline'))title.textContent=`${label} · PROJECT TIMELINE`;
    });
    const tapeTitle=panel.querySelector('.nexus-time-tape-title small');
    if(tapeTitle)tapeTitle.textContent=`${label} · replay`;
  };

  const run=()=>{
    const menuPanel=document.getElementById('nexusMenuPanel');
    const filesPanel=document.getElementById('nexusFilesPanel');
    const fileInput=document.getElementById('nexusFileInput');
    const filesTile=document.getElementById('nexusTopFiles');

    // File Loader is a real Nexus module and remains available from ☰ → SYSTEM.
    // FILES keeps its quick upload action as a separate shortcut.
    const systemTitle=Array.from(menuPanel?.querySelectorAll('.nexus-shell-section-title')||[])
      .find(el=>norm(el.textContent)==='system');
    const systemList=systemTitle?.nextElementSibling;
    let fileLoader=menuPanel?.querySelector('[data-nexus-action="file-loader"]');
    if(!fileLoader&&systemList){
      fileLoader=document.createElement('button');
      fileLoader.className='nexus-shell-action';
      fileLoader.type='button';
      fileLoader.dataset.nexusAction='file-loader';
      fileLoader.innerHTML='<span class="nexus-shell-action-icon">＋</span><span class="nexus-shell-action-copy"><strong>File Loader</strong><small>Upload & classify project files</small></span>';
      systemList.insertBefore(fileLoader,systemList.firstChild);
    }
    if(fileLoader&&!fileLoader.dataset.fileLoaderModuleWired){
      fileLoader.dataset.fileLoaderModuleWired='true';
      fileLoader.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.assign('/apps/nexus-file-loader/');
      },true);
    }

    const list=filesPanel?.querySelector('.nexus-shell-list');
    if(list&&!list.querySelector('[data-nexus-file-action="upload"]')){
      const upload=document.createElement('button');
      upload.className='nexus-shell-action';
      upload.type='button';
      upload.dataset.nexusFileAction='upload';
      upload.innerHTML='<span class="nexus-shell-action-icon">＋</span><span class="nexus-shell-action-copy"><strong>Upload files</strong><small>Upload & classify with Nexus AI</small></span>';
      list.insertBefore(upload,list.firstChild);
    }

    const upload=filesPanel?.querySelector('[data-nexus-file-action="upload"]');
    if(upload&&!upload.dataset.oneShellWired){
      upload.dataset.oneShellWired='true';
      upload.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        fileInput?.click();
      },true);
    }

    const sub=filesTile?.querySelector('.nexus-top-sub');
    if(sub&&!/^\d+\s+FILES$/i.test(sub.textContent||''))sub.textContent='PROJECT DOCS';

    tuneTimelinePanel();
    hideLegacyGraphControls();

    if(!document.getElementById('nexus-one-shell-mobile-style')){
      const style=document.createElement('style');
      style.id='nexus-one-shell-mobile-style';
      style.textContent=`
        .nexus-top-rail{z-index:2147483000!important;pointer-events:auto!important}
        .nexus-top-rail *{pointer-events:auto!important}
        .nexus-shell-scrim{z-index:2147483001!important}
        .nexus-shell-panel,.nexus-project-switcher{z-index:2147483002!important;pointer-events:auto!important}
        #nexusTimelinePanel[data-nexus-compact-timeline="true"]{top:calc(var(--nexus-top-rail-h,76px) + 8px)!important;bottom:auto!important;right:8px!important;left:auto!important;width:min(390px,calc(100vw - 16px))!important;max-width:390px!important;max-height:min(58dvh,560px)!important;border-radius:20px!important;overflow:auto!important}
        #nexusTimelinePanel[data-nexus-compact-timeline="true"] .nexus-time-stats{grid-template-columns:repeat(3,1fr)!important}
        #nexusTimelinePanel[data-nexus-compact-timeline="true"] .nexus-time-stat{padding:8px!important;min-height:72px!important}
        #nexusTimelinePanel[data-nexus-compact-timeline="true"] .nexus-time-stat strong{font-size:20px!important}
        #nexusTimelinePanel[data-nexus-compact-timeline="true"] .nexus-time-main{grid-template-columns:1fr 46px 70px!important}
        #nexusTimelinePanel[data-nexus-compact-timeline="true"] .nexus-time-date{font-size:22px!important}
        #root [data-nexus-hidden-legacy-control="true"]{display:none!important;visibility:hidden!important;pointer-events:none!important}
        @media (max-width:720px){
          [aria-label="Nexus folder dock"] div[class*="max-h-"]{max-height:34dvh!important}
          [aria-label="Nexus folder dock"] button[title],
          [aria-label="Nexus folder dock"] a[title]{width:68px!important;height:54px!important;min-height:54px!important;padding:5px 6px!important;border-radius:11px!important;gap:2px!important}
          [aria-label="Nexus folder dock"] button[title] svg,
          [aria-label="Nexus folder dock"] a[title] svg{width:18px!important;height:18px!important}
          [aria-label="Nexus folder dock"] [data-nosmo-file-icon]{width:32px!important;height:32px!important}
          [aria-label="Nexus folder dock"] button[title] span,
          [aria-label="Nexus folder dock"] a[title] span{font-size:8px!important;line-height:1.05!important}
          #nexusTimelinePanel[data-nexus-compact-timeline="true"]{max-height:52dvh!important;width:calc(100vw - 14px)!important;right:7px!important}
          #nexusTimelinePanel[data-nexus-compact-timeline="true"] .nexus-time-phases{display:none!important}
          #nexusTimelinePanel[data-nexus-compact-timeline="true"] .nexus-time-stats{display:none!important}
        }
      `;
      document.head.appendChild(style);
    }
  };

  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',run);
  else run();

  // The legacy shell mutates these controls during startup; keep the one-shell layout canonical without long observers.
  window.requestAnimationFrame(run);
  window.setTimeout(run,120);
  window.setTimeout(run,350);
  window.setTimeout(run,900);
  window.setTimeout(run,1800);
})();