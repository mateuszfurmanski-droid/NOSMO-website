// NEXUS_ADDON_DOCK_ICONS_POLISH_20260817
// Add-on only: replaces emoji/unicode addon dock icons with inline SVG line icons.
(()=>{
  if(window.__NEXUS_ADDON_DOCK_ICONS_POLISH__)return;
  window.__NEXUS_ADDON_DOCK_ICONS_POLISH__=true;

  const icons={
    soft:`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16"/><path d="M4 17h16"/><circle cx="9" cy="7" r="2.4"/><circle cx="15" cy="17" r="2.4"/></svg>`,
    integrations:`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="4" width="6" height="6" rx="1.6"/><rect x="14" y="4" width="6" height="6" rx="1.6"/><rect x="9" y="14" width="6" height="6" rx="1.6"/><path d="M10 7h4"/><path d="M8.4 9.4 10.8 14"/><path d="M15.6 9.4 13.2 14"/></svg>`,
    cloud:`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.2 18.5h10.2a4.1 4.1 0 0 0 .4-8.18 6.15 6.15 0 0 0-11.83 1.55A3.35 3.35 0 0 0 7.2 18.5Z"/><path d="M8.5 18.5h7"/></svg>`
  };

  const setIcon=(selector,html)=>{
    const node=document.querySelector(selector);
    if(!node||node.dataset.nexusSvgIcon==='1')return;
    node.innerHTML=html;
    node.dataset.nexusSvgIcon='1';
  };

  const apply=()=>{
    setIcon('#nexusSoftwareDockTile .nx-soft-tile-icon',icons.soft);
    setIcon('#nexusIntegrationsDockTile .nx-int-tile-icon',icons.integrations);
    setIcon('#nexusCloudDockTile .nx-cloud-tile-icon',icons.cloud);
  };

  const schedule=()=>{
    apply();
    requestAnimationFrame(apply);
    setTimeout(apply,160);
    setTimeout(apply,650);
    setTimeout(apply,1500);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(schedule,220),{passive:true});
  const observer=new MutationObserver(apply);
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),18000);
})();
