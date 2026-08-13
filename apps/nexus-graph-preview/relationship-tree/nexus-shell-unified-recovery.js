// NEXUS_SHELL_UNIFIED_RECOVERY_20260813A
(()=>{
  if(document.documentElement.dataset.nexusEmbedded==='true')return;
  if(window.__NEXUS_SHELL_UNIFIED_RECOVERY_INSTALLED__)return;
  window.__NEXUS_SHELL_UNIFIED_RECOVERY_INSTALLED__=true;

  const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  const world=()=>window.__NEXUS_PROJECT_WORLD__||document.documentElement.dataset.nexusWorld||'esafe-demo';
  const projectKey=()=>world()==='esafe-demo'?'NEXUS_DEMO_PROJECT_001_eSAFE_CATANIA':'NEXUS_DEMO_PROJECT_002_RIVERSIDE';

  function css(){
    if(document.getElementById('nexusUnifiedRecoveryCss'))return;
    const style=document.createElement('style');
    style.id='nexusUnifiedRecoveryCss';
    style.textContent=`
      html.nexus-unified-recovery,html.nexus-unified-recovery body{width:100%!important;height:100%!important;min-height:100%!important;margin:0!important;background:#eaf3f6!important;overflow:hidden!important;overscroll-behavior:none!important}html.nexus-unified-recovery body{position:fixed!important;inset:0!important}html.nexus-unified-recovery #root{position:fixed!important;left:0!important;right:0!important;top:var(--top,76px)!important;bottom:0!important;margin:0!important;min-height:0!important;background:#eaf3f6!important;overflow:hidden!important;isolation:isolate!important}.nexus-shell-panel,.nexus-project-switcher,.nexus-people-panel,.nexus-top-rail{-webkit-transform:translateZ(0);transform:translateZ(0);backface-visibility:hidden}.nexus-project-switcher{z-index:9025!important}.nexus-shell-panel{max-height:calc(100vh - var(--top,76px) - env(safe-area-inset-bottom,0px) - 20px)!important}
      .nexus-time-view-switch{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px;background:rgba(238,247,251,.88);position:sticky;top:49px;z-index:3;backdrop-filter:blur(10px)}.nexus-time-view-toggle{min-height:36px;border:1px solid rgba(31,112,139,.13);border-radius:13px;background:#fff;color:#667985;font:900 9px/1 Inter,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}.nexus-time-view-toggle.active{border-color:rgba(20,142,170,.55);background:linear-gradient(180deg,#e8f9ff,#cceefa);color:#0b7890;box-shadow:0 0 0 2px rgba(20,142,170,.12)}.nexus-timeline-view{display:none}.nexus-timeline-view.active{display:block}.nexus-time-tape-shell{padding:2px 10px 14px}.nexus-time-tape-card{border:1px solid rgba(31,112,139,.12);border-radius:20px;background:linear-gradient(180deg,#fff,#e7f7fc);box-shadow:inset 0 0 0 1px rgba(255,255,255,.75),0 14px 28px rgba(8,37,51,.12);padding:12px;color:#102638}.nexus-time-tape-title{display:flex;justify-content:space-between;gap:10px;margin-bottom:10px}.nexus-time-tape-title strong{font-size:11px;letter-spacing:.12em}.nexus-time-tape-title small{font-size:8px;color:#667985;font-weight:900}.nexus-time-tape-deck{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center;border-radius:18px;background:linear-gradient(180deg,#dff4fa,#f7fdff);border:1px solid rgba(31,112,139,.1);padding:14px 12px;position:relative;overflow:hidden}.nexus-time-tape-deck:before{content:'';position:absolute;left:18%;right:18%;top:50%;height:6px;border-radius:999px;background:rgba(16,38,56,.16);transform:translateY(-50%)}.nexus-tape-reel{display:grid;place-items:center;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at center,#fff 0 15%,#93d9eb 16% 22%,#f7fdff 23% 36%,#54bad2 37% 41%,#eaf9fd 42% 58%,#1289a8 59% 62%,#f9feff 63% 100%);box-shadow:inset 0 0 18px rgba(8,37,51,.08),0 8px 18px rgba(8,37,51,.12);position:relative;z-index:1}.nexus-tape-reel span{width:18%;aspect-ratio:1;border-radius:50%;background:#102638;opacity:.75}.nexus-time-tape-progress{margin:12px 2px 0;height:10px;border-radius:999px;background:rgba(31,112,139,.12);overflow:hidden}.nexus-time-tape-progress span{display:block;height:100%;width:56%;border-radius:999px;background:linear-gradient(90deg,#1188a4,#65cae2)}.nexus-time-tape-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.nexus-time-tape-actions button{min-height:34px;border-radius:12px;border:1px solid rgba(31,112,139,.14);background:#fff;color:#102638;font:900 10px/1 Inter,Arial,sans-serif}.nexus-time-tape-note{font-size:10px;color:#667985;line-height:1.35;margin-top:10px}
      .nexus-unified-overlay{position:fixed;z-index:9040;inset:var(--top,76px) 0 env(safe-area-inset-bottom,0px) 0;display:none;padding:10px;background:rgba(8,28,39,.28);backdrop-filter:blur(2px)}.nexus-unified-overlay.open{display:grid;place-items:start center}.nexus-unified-frame-shell{width:min(980px,calc(100vw - 20px));height:min(720px,calc(100vh - var(--top,76px) - 24px));display:grid;grid-template-rows:42px 1fr;border:1px solid rgba(71,105,124,.34);border-radius:12px;background:#eef6fa;overflow:hidden;box-shadow:0 22px 70px rgba(4,27,40,.34)}.nexus-unified-frame-head{display:flex;align-items:center;justify-content:space-between;padding:0 8px 0 12px;border-bottom:1px solid rgba(71,105,124,.22);font:900 12px/1 Inter,Arial,sans-serif;letter-spacing:.08em}.nexus-unified-frame-head button{width:30px;height:30px;border-radius:7px;border:1px solid rgba(71,105,124,.26);background:#fff;font-size:20px}.nexus-unified-frame{width:100%;height:100%;border:0;background:#020713}@supports(height:100dvh){html.nexus-unified-recovery,html.nexus-unified-recovery body{height:100dvh!important;min-height:100dvh!important}.nexus-unified-frame-shell{height:min(720px,calc(100dvh - var(--top,76px) - 24px))}}
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add('nexus-unified-recovery');
  }

  function installTimeline(){
    const panel=document.getElementById('nexusTimelinePanel');
    if(!panel||panel.dataset.unifiedTimeline==='ready')return;
    panel.dataset.unifiedTimeline='ready';
    const head=panel.querySelector('.nexus-shell-panel-head');
    const rest=Array.from(panel.children).filter(el=>el!==head);
    const switcher=document.createElement('div');
    switcher.className='nexus-time-view-switch';
    switcher.innerHTML='<button class="nexus-time-view-toggle active" type="button" data-view="classic">Classic</button><button class="nexus-time-view-toggle" type="button" data-view="tape">Tape</button>';
    const classic=document.createElement('div');
    classic.className='nexus-timeline-view active';
    classic.dataset.timelineView='classic';
    rest.forEach(el=>classic.appendChild(el));
    const tape=document.createElement('div');
    tape.className='nexus-timeline-view';
    tape.dataset.timelineView='tape';
    tape.innerHTML=`<div class="nexus-time-tape-shell"><div class="nexus-time-tape-card"><div class="nexus-time-tape-title"><strong>PROJECT TAPE</strong><small>${world()==='esafe-demo'?'e-SAFE CATANIA':'RIVERSIDE'} · RECORDER VIEW</small></div><div class="nexus-time-tape-deck"><div class="nexus-tape-reel"><span></span></div><div class="nexus-tape-reel"><span></span></div></div><div class="nexus-time-tape-progress"><span></span></div><div class="nexus-time-tape-actions"><button type="button" data-act="rewind">REW</button><button type="button" data-act="pause">PAUSE</button><button type="button" data-act="play">PLAY</button><button type="button" data-act="forward">FWD</button></div><div class="nexus-time-tape-note">Tape mode is only a presentation switch over the same Project Graph. Classic controls remain preserved.</div></div></div>`;
    if(head){head.after(switcher);switcher.after(classic);classic.after(tape)}else{panel.prepend(tape);panel.prepend(classic);panel.prepend(switcher)}
    const setView=view=>{
      const next=view==='tape'?'tape':'classic';
      panel.querySelectorAll('[data-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===next));
      panel.querySelectorAll('[data-timeline-view]').forEach(el=>el.classList.toggle('active',el.dataset.timelineView===next));
      const sub=document.getElementById('nexusTopTimeSub');
      if(sub)sub.textContent=next.toUpperCase();
      try{localStorage.setItem('nexus.timeline.view',next)}catch{}
    };
    panel.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.view)));
    panel.querySelectorAll('[data-act]').forEach(btn=>btn.addEventListener('click',()=>{
      const act=btn.dataset.act;
      if(act==='play'||act==='pause')document.getElementById('nexusPlayTimeline')?.click();
      if(act==='rewind')document.querySelector('[data-nexus-time-mode="survey"]')?.click();
      if(act==='forward')document.querySelector('[data-nexus-time-mode="handover"]')?.click();
    }));
    setView(localStorage.getItem('nexus.timeline.view')||'classic');
  }

  function closePanels(){
    document.querySelectorAll('.nexus-shell-panel.open,.nexus-project-switcher.open,.nexus-people-panel.open').forEach(el=>{el.classList.remove('open');el.setAttribute('aria-hidden','true')});
    document.getElementById('nexusShellScrim')?.classList.remove('open');
  }

  function overlay(){
    let host=document.getElementById('nexusUnifiedOverlay');
    if(host)return host;
    host=document.createElement('section');
    host.id='nexusUnifiedOverlay';
    host.className='nexus-unified-overlay';
    host.innerHTML='<div class="nexus-unified-frame-shell"><div class="nexus-unified-frame-head"><strong id="nexusUnifiedOverlayTitle">NEXUS OVERLAY</strong><button type="button" aria-label="Close">×</button></div><iframe class="nexus-unified-frame" id="nexusUnifiedOverlayFrame"></iframe></div>';
    document.body.appendChild(host);
    host.addEventListener('click',e=>{if(e.target===host)host.classList.remove('open')});
    host.querySelector('button')?.addEventListener('click',()=>host.classList.remove('open'));
    return host;
  }

  function openOverlay(kind,url,title){
    const host=overlay();
    const frame=document.getElementById('nexusUnifiedOverlayFrame');
    const label=document.getElementById('nexusUnifiedOverlayTitle');
    const safe=new URL(url,location.origin);
    if(safe.origin!==location.origin)return;
    closePanels();
    if(kind==='file'){
      safe.searchParams.set('overlay','1');
      safe.searchParams.set('world',world());
      if(!safe.searchParams.has('projectKey'))safe.searchParams.set('projectKey',projectKey());
    }
    if(label)label.textContent=title||'NEXUS OVERLAY';
    if(frame)frame.src=safe.toString();
    host.classList.add('open');
  }

  function installOverlayTriggers(){
    document.addEventListener('click',e=>{
      const target=e.target instanceof Element?e.target:null;
      if(!target||target.closest('#nexusUnifiedOverlay'))return;
      const anchor=target.closest('a[href]');
      if(anchor){
        const href=anchor.getAttribute('href')||'';
        if(/person-card-kamil/i.test(href)){e.preventDefault();e.stopPropagation();openOverlay('person',href,'WORKER / PERSON CARD');return}
        if(href.includes('/apps/nexus-file-loader/')){e.preventDefault();e.stopPropagation();openOverlay('file',href,'NEXUS CLOUD / FILE LOADER');return}
      }
      if(target.closest('[data-node-id="p-kamil"]')&&!target.closest('.nexus-shell-panel,.nexus-people-panel')){e.preventDefault();e.stopPropagation();openOverlay('person','/person-card-kamil.html?v=v47top1','WORKER / PERSON CARD')}
    },true);
  }

  ready(()=>{
    css();
    installTimeline();
    installOverlayTriggers();
    requestAnimationFrame(installTimeline);
    setTimeout(installTimeline,300);
    setTimeout(installTimeline,1200);
    new MutationObserver(installTimeline).observe(document.body,{childList:true,subtree:true});
  });
})();