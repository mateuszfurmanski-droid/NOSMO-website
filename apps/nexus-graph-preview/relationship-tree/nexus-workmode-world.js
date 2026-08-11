// NEXUS_WORKMODE_WORLD_V1
(()=>{
  const params=new URL(window.location.href).searchParams;
  const world=window.__NEXUS_PROJECT_WORLD__||params.get('world')||'dev';
  if(world!=='workmode')return;

  const rawProject=(params.get('project')||'Mobile Work Context').trim();
  const project=rawProject.slice(0,80)||'Mobile Work Context';
  const parsedSignals=parseInt(params.get('signals')||'0',10);
  const signalCount=Number.isFinite(parsedSignals)?Math.max(0,Math.min(parsedSignals,999)):0;

  window.__NEXUS_WORKMODE_CONTEXT__={
    world:'workmode',
    project,
    signalCount,
    source:params.get('source')||'android',
    localOnly:true
  };

  const escapeHtml=value=>String(value).replace(/[&<>'"]/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[char]));

  window.addEventListener('DOMContentLoaded',()=>{
    document.documentElement.dataset.nexusWorld='workmode';
    document.documentElement.dataset.nexusWorkmode='true';

    const graphRoot=document.getElementById('root');
    if(graphRoot){
      graphRoot.setAttribute('aria-hidden','true');
      graphRoot.style.visibility='hidden';
      graphRoot.style.pointerEvents='none';
    }

    const style=document.createElement('style');
    style.id='nexusWorkModeWorldStyles';
    style.textContent=`
      .nexus-workmode-world{position:fixed;inset:108px 0 0;z-index:24;overflow:auto;background:radial-gradient(circle at 50% 32%,rgba(73,205,224,.22),transparent 34%),linear-gradient(180deg,#eef9fc 0%,#e7f5fa 100%);color:#102b37;font-family:Inter,system-ui,sans-serif;padding:32px 18px 120px;box-sizing:border-box}
      .nexus-workmode-shell{max-width:760px;margin:0 auto;text-align:center}
      .nexus-workmode-kicker{font-size:11px;letter-spacing:.18em;font-weight:800;color:#0a7f92;margin-bottom:8px}
      .nexus-workmode-title{font-size:28px;line-height:1.05;font-weight:800;margin:0;color:#153846}
      .nexus-workmode-sub{font-size:13px;color:#5d7680;margin:8px 0 24px}
      .nexus-workmode-canvas{position:relative;min-height:470px;border:1px solid rgba(17,123,143,.14);border-radius:28px;background:rgba(255,255,255,.56);box-shadow:0 22px 60px rgba(29,99,117,.1);overflow:hidden}
      .nexus-workmode-canvas:before,.nexus-workmode-canvas:after{content:'';position:absolute;left:50%;top:50%;height:1px;width:64%;background:rgba(18,139,158,.16);transform-origin:left center}
      .nexus-workmode-canvas:before{transform:rotate(28deg)}
      .nexus-workmode-canvas:after{transform:rotate(-28deg)}
      .nexus-workmode-node{position:absolute;display:grid;place-items:center;text-align:center;border:2px solid #118aa0;background:#f9feff;box-shadow:0 14px 34px rgba(18,114,132,.14);color:#113844;font-weight:800}
      .nexus-workmode-node small{display:block;font-size:10px;letter-spacing:.08em;color:#6b858d;font-weight:700;margin-top:5px}
      .nexus-workmode-project{width:178px;height:132px;border-radius:24px;left:50%;top:50%;transform:translate(-50%,-50%);font-size:20px;padding:10px;box-sizing:border-box}
      .nexus-workmode-signal{width:126px;height:92px;border-radius:20px;left:8%;top:16%;font-size:22px}
      .nexus-workmode-source{width:140px;height:94px;border-radius:20px;right:7%;top:18%;font-size:14px}
      .nexus-workmode-local{width:142px;height:94px;border-radius:20px;left:10%;bottom:12%;font-size:14px}
      .nexus-workmode-next{width:150px;height:96px;border-radius:20px;right:8%;bottom:12%;font-size:14px;border-color:#c59413}
      .nexus-workmode-badge{display:inline-flex;align-items:center;gap:7px;margin-top:18px;padding:8px 12px;border-radius:999px;background:#fff8dc;color:#7d5b00;font-size:12px;font-weight:800;border:1px solid #ead58a}
      .nexus-workmode-note{margin:18px auto 0;max-width:620px;font-size:12px;line-height:1.45;color:#607984}
      @media(max-width:520px){.nexus-workmode-world{inset:104px 0 0;padding:22px 10px 110px}.nexus-workmode-title{font-size:24px}.nexus-workmode-canvas{min-height:440px}.nexus-workmode-project{width:156px;height:122px}.nexus-workmode-signal{left:4%;top:13%;width:112px}.nexus-workmode-source{right:3%;top:16%;width:122px}.nexus-workmode-local{left:4%;bottom:10%;width:122px}.nexus-workmode-next{right:3%;bottom:10%;width:128px}}
    `;
    document.head.appendChild(style);

    const worldView=document.createElement('main');
    worldView.id='nexusWorkModeWorld';
    worldView.className='nexus-workmode-world';
    worldView.innerHTML=`
      <div class="nexus-workmode-shell">
        <div class="nexus-workmode-kicker">MOBILE PROJECT WORLD</div>
        <h1 class="nexus-workmode-title">${escapeHtml(project)}</h1>
        <div class="nexus-workmode-sub">Context handed off from NEXUS Work Mode on Android</div>
        <section class="nexus-workmode-canvas" aria-label="${escapeHtml(project)} mobile project graph">
          <div class="nexus-workmode-node nexus-workmode-project">${escapeHtml(project)}<small>ACTIVE WORK CONTEXT</small></div>
          <div class="nexus-workmode-node nexus-workmode-signal">${signalCount}<small>APPROVED SIGNALS</small></div>
          <div class="nexus-workmode-node nexus-workmode-source">PHONE CONTEXT<small>CONTACTS · CALENDAR · FILES</small></div>
          <div class="nexus-workmode-node nexus-workmode-local">LOCAL ON DEVICE<small>PRIVACY BOUNDARY</small></div>
          <div class="nexus-workmode-node nexus-workmode-next">PROJECT GRAPH<small>SYNC NEXT</small></div>
        </section>
        <div class="nexus-workmode-badge">● Work Mode context · not Riverside demo data</div>
        <p class="nexus-workmode-note">This view intentionally does not reuse Riverside people, documents or tasks. The Android app has identified the active context and approved-signal count, but individual phone signals remain local until Project Graph sync is enabled.</p>
      </div>`;
    document.body.appendChild(worldView);

    const projectTile=document.getElementById('nexusTopProject');
    const sub=projectTile?.querySelector('.nexus-top-sub');
    if(sub)sub.textContent=project.toUpperCase().slice(0,14);
  });
})();
