// NEXUS_ONE_SHELL_FIXES_V5_THREE_MODE_TIME_HUB
(()=>{
  if(window.__NEXUS_ONE_SHELL_FIXES_INSTALLED__)return;
  window.__NEXUS_ONE_SHELL_FIXES_INSTALLED__=true;
  if(document.documentElement.dataset.nexusEmbedded==='true')return;

  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const formatDate=value=>{
    const date=new Date(value);
    if(!Number.isFinite(date.getTime()))return'—';
    return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'}).format(date);
  };
  const activeWorld=()=>window.__NEXUS_PROJECT_WORLD__||document.documentElement.dataset.nexusWorld||'dev';
  const worldLabel=()=>activeWorld()==='esafe-demo'?'e-SAFE':'RIVERSIDE';
  const PHASES=[
    {label:'SURVEY',end:.15},
    {label:'DESIGN',end:.35},
    {label:'PROCURE',end:.55},
    {label:'BUILD',end:.85},
    {label:'TESTING',end:1},
  ];

  let docs=[];
  let minTime=Date.now()-14*86400000;
  let maxTime=Date.now();
  let mode='simulation';
  let playing=false;
  let frameId=0;
  let lastFrame=0;

  const getPanel=()=>document.getElementById('nexusTimeHubPanel');
  const getProgress=()=>clamp(Number(document.getElementById('nexusTimeHubSlider')?.value||10000)/10000,0,1);
  const currentTime=p=>minTime+(maxTime-minTime)*p;

  const installStyle=()=>{
    if(document.getElementById('nexus-one-shell-mobile-style'))return;
    const style=document.createElement('style');
    style.id='nexus-one-shell-mobile-style';
    style.textContent=`
      .nexus-top-rail{z-index:2147483000!important;pointer-events:auto!important}
      .nexus-top-rail *{pointer-events:auto!important}
      .nexus-shell-scrim{z-index:2147483001!important}
      .nexus-shell-panel,.nexus-project-switcher{z-index:2147483002!important;pointer-events:auto!important}
      #nexusTimelinePanel{display:none!important;visibility:hidden!important;pointer-events:none!important}
      #root [data-nexus-hidden-legacy-toolbar="true"]{display:none!important;visibility:hidden!important;pointer-events:none!important}
      #nexusTimeHubPanel{position:fixed;z-index:2147482500;left:8px;right:8px;bottom:calc(var(--nexus-bottom-dock-h,92px) + env(safe-area-inset-bottom,0px) + 8px);max-height:min(54dvh,440px);overflow:auto;-webkit-overflow-scrolling:touch;border:1px solid rgba(31,112,139,.18);border-radius:18px;background:linear-gradient(180deg,rgba(248,252,255,.98),rgba(235,246,251,.98));box-shadow:0 16px 42px rgba(39,68,89,.2);color:#102638;font-family:Inter,Arial,sans-serif;opacity:0;transform:translateY(130%);pointer-events:none;transition:opacity .16s ease,transform .2s ease}
      #nexusTimeHubPanel.open{opacity:1;transform:translateY(0);pointer-events:auto}
      .nexus-timehub-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 11px 8px;border-bottom:1px solid rgba(31,112,139,.1);position:sticky;top:0;z-index:3;background:linear-gradient(180deg,rgba(248,252,255,.98),rgba(235,246,251,.94));backdrop-filter:blur(10px)}
      .nexus-timehub-title{display:grid;gap:1px;min-width:0}.nexus-timehub-title strong{font-size:12px;letter-spacing:.14em}.nexus-timehub-title small{font-size:8px;color:#667985;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
      .nexus-timehub-close{width:34px;height:34px;border-radius:13px;border:1px solid rgba(31,112,139,.14);background:#fff;color:#102638;font-size:24px;font-weight:900}
      .nexus-timehub-tabs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:8px 10px;background:rgba(233,247,252,.78)}
      .nexus-timehub-tab{min-height:36px;border:1px solid rgba(31,112,139,.12);border-radius:13px;background:#fff;color:#667985;font:900 8px/1 Inter,Arial,sans-serif;letter-spacing:.11em;text-transform:uppercase}
      .nexus-timehub-tab.active{background:linear-gradient(180deg,#e9f9ff,#cceefa);border-color:rgba(20,142,170,.52);color:#0b7890;box-shadow:0 0 0 2px rgba(20,142,170,.12)}
      .nexus-timehub-view{display:none;padding:9px 10px 10px}.nexus-timehub-view.active{display:block}
      .nexus-timehub-main{display:grid;grid-template-columns:1fr 46px 68px;gap:8px;align-items:center}.nexus-timehub-date{font-size:20px;font-weight:950;line-height:1.05;letter-spacing:-.04em}.nexus-timehub-sub{font-size:9px;color:#667985;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .nexus-timehub-play,.nexus-timehub-live,.nexus-timehub-select{height:42px;border:1px solid rgba(31,112,139,.12);border-radius:14px;background:#fff;color:#102638;font-weight:950}.nexus-timehub-play.playing{background:#d8f4ff;color:#08748a}.nexus-timehub-select{width:68px;font-size:12px;padding:0 4px}.nexus-timehub-live{font-size:9px;padding:0 10px}
      .nexus-timehub-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.nexus-timehub-mode{min-height:39px;border:1px solid rgba(31,112,139,.11);border-radius:13px;background:#fff;color:#102638;font:900 9px/1 Inter,Arial,sans-serif;letter-spacing:.08em}.nexus-timehub-mode.active{background:#d7f3ff;color:#08748a;border-color:rgba(20,142,170,.45)}
      .nexus-timehub-phases{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:8px}.nexus-timehub-phase{min-height:30px;border-radius:9px;border:1px solid rgba(31,112,139,.09);background:#fff;color:#667985;font:900 7px/1 Inter,Arial,sans-serif}.nexus-timehub-phase.active{background:#d7f3ff;color:#08748a}
      .nexus-timehub-railmeta{display:flex;justify-content:space-between;gap:8px;color:#667985;font-size:8px;font-weight:800;margin:9px 2px 3px}.nexus-timehub-rail{height:25px;position:relative}.nexus-timehub-rail:before{content:"";position:absolute;left:0;right:0;top:11px;height:3px;border-radius:999px;background:rgba(31,112,139,.14)}.nexus-timehub-progress{position:absolute;left:0;top:11px;height:3px;border-radius:999px;background:linear-gradient(90deg,#168af0,#67c4ff);width:100%;pointer-events:none}.nexus-timehub-slider{position:absolute;left:0;right:0;top:0;width:100%;height:24px;margin:0;appearance:none;-webkit-appearance:none;background:transparent}.nexus-timehub-slider::-webkit-slider-runnable-track{height:3px;background:transparent}.nexus-timehub-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#e9f6ff;border:4px solid #36a3ff;margin-top:-7px;box-shadow:0 3px 14px rgba(0,0,0,.25),0 0 0 3px rgba(54,163,255,.14)}
      .nexus-timehub-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}.nexus-timehub-stat{border:1px solid rgba(31,112,139,.1);border-radius:12px;background:#fff;padding:8px}.nexus-timehub-stat strong{display:block;font-size:18px}.nexus-timehub-stat small{font-size:8px;color:#667985}.nexus-timehub-event{margin-top:6px;border:1px solid rgba(31,112,139,.1);border-radius:12px;background:#fff;padding:8px;font-size:9px;color:#667985}.nexus-timehub-event strong{display:block;color:#102638;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .nexus-compact-row{display:grid;grid-template-columns:1fr 34px 58px;gap:6px;align-items:center}.nexus-compact-date{font-size:15px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nexus-compact-sub{font-size:8px;color:#667985;margin-top:1px}.nexus-compact-play{height:34px;border:1px solid rgba(31,112,139,.12);border-radius:12px;background:#fff;font-weight:950}.nexus-compact-speed{height:34px;border:1px solid rgba(31,112,139,.12);border-radius:12px;background:#fff;color:#102638;font-weight:900;width:58px}
      .nexus-tape-card{border:1px solid rgba(31,112,139,.12);border-radius:18px;background:linear-gradient(180deg,#fff,#e7f7fc);box-shadow:inset 0 0 0 1px rgba(255,255,255,.75),0 12px 24px rgba(8,37,51,.1);padding:12px}.nexus-tape-title{display:flex;justify-content:space-between;gap:8px;margin-bottom:9px}.nexus-tape-title strong{font-size:10px;letter-spacing:.13em}.nexus-tape-title small{font-size:8px;color:#667985;font-weight:900}.nexus-tape-deck{display:grid;grid-template-columns:1fr 1fr;gap:12px;border-radius:18px;background:linear-gradient(180deg,#dff4fa,#f7fdff);border:1px solid rgba(31,112,139,.1);padding:14px 12px;position:relative;overflow:hidden}.nexus-tape-deck:before{content:"";position:absolute;left:18%;right:18%;top:50%;height:6px;border-radius:999px;background:rgba(16,38,56,.16);transform:translateY(-50%)}.nexus-tape-reel{display:grid;place-items:center;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at center,#fff 0 15%,#93d9eb 16% 22%,#f7fdff 23% 36%,#54bad2 37% 41%,#eaf9fd 42% 58%,#1289a8 59% 62%,#f9feff 63% 100%);box-shadow:inset 0 0 18px rgba(8,37,51,.08),0 8px 18px rgba(8,37,51,.1);z-index:1}.nexus-tape-reel span{width:16px;height:16px;border-radius:50%;background:#102638;box-shadow:0 0 0 5px rgba(255,255,255,.88)}.nexus-tape-controls{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.nexus-tape-control{min-height:36px;border:1px solid rgba(31,112,139,.12);border-radius:13px;background:#fff;color:#102638;font:900 13px/1 Inter,Arial,sans-serif}.nexus-tape-control.play{background:linear-gradient(145deg,#1789ed,#5bb8ff);color:#fff;border-color:transparent}.nexus-tape-caption{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-top:8px;font-size:9px;color:#667985;font-weight:800}.nexus-tape-caption strong{font-size:10px;color:#102638}.nexus-tape-caption code{font-size:8px;background:rgba(20,142,170,.1);border-radius:999px;padding:4px 7px;color:#0b7890}
      #root [data-node-id].nexus-time-future{opacity:.17!important;filter:grayscale(.72) saturate(.35)}#root [data-node-id].nexus-time-current{filter:drop-shadow(0 0 12px rgba(54,163,255,.42))}
      @media (max-width:720px){
        #nexusTimeHubPanel{left:7px;right:7px;bottom:calc(var(--nexus-bottom-dock-h,92px) + env(safe-area-inset-bottom,0px) + 7px);max-height:52dvh;border-radius:17px}.nexus-timehub-head{padding:9px 10px 7px}.nexus-timehub-tabs{padding:7px 8px;gap:5px}.nexus-timehub-tab{min-height:34px;font-size:7px}.nexus-timehub-view{padding:8px}.nexus-timehub-date{font-size:18px}.nexus-timehub-main{grid-template-columns:1fr 42px 62px}.nexus-timehub-play,.nexus-timehub-select{height:38px}.nexus-timehub-select{width:62px}.nexus-timehub-stats{display:none}.nexus-timehub-phases{gap:3px}.nexus-timehub-phase{font-size:6.5px;min-height:27px}
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

  const scanDocs=()=>{
    const next=[];
    document.querySelectorAll('#root [data-node-id]').forEach(node=>{
      const button=node.querySelector('button');
      if(!button)return;
      const text=button.textContent||'';
      const isDoc=/\bdocument\b/i.test(text)||/\.pdf|\.xlsx|\.docx|plans|schedule|certificate/i.test(text);
      if(!isDoc)return;
      const id=node.getAttribute('data-node-id')||'';
      const label=(Array.from(button.querySelectorAll('span')).map(s=>s.textContent?.trim()).find(value=>value&&value.length>3&&!/^document$/i.test(value)&&!/^task$/i.test(value))||id||'Project record').trim();
      const match=text.match(/received\s+(\d{1,2}\s+[a-z]{3,9}\s+\d{4})/i)||text.match(/received\s+([a-z]{3,9}\s+\d{1,2},?\s+\d{4})/i);
      const parsed=match?Date.parse(match[1]):NaN;
      const time=Number.isFinite(parsed)?parsed:Date.now()-Math.floor(Math.random()*14)*86400000;
      next.push({node,label,time});
    });
    next.sort((a,b)=>a.time-b.time);
    docs=next;
    if(next.length){minTime=next[0].time;maxTime=next[next.length-1].time;if(minTime===maxTime){minTime-=604800000;maxTime+=604800000}}
  };

  const emitTime=(at,p)=>{
    const payload={type:'NEXUS_PROJECT_TIME_CHANGE',worldId:activeWorld(),mode,progress:p,at:new Date(at).toISOString(),source:'relationship-tree-three-mode-time-hub'};
    window.__NEXUS_PROJECT_TIME__=payload;
    document.documentElement.dataset.nexusTimeMode=mode;
    window.dispatchEvent(new CustomEvent('nexus:project-time-change',{detail:payload}));
  };

  const render=()=>{
    const p=getProgress();
    const at=currentTime(p);
    const visible=docs.filter(item=>item.time<=at);
    const latest=visible[visible.length-1];
    docs.forEach(item=>{item.node.classList.toggle('nexus-time-future',item.time>at);item.node.classList.toggle('nexus-time-current',Boolean(latest&&item===latest))});

    document.querySelectorAll('[data-timehub-date]').forEach(el=>el.textContent=formatDate(at));
    document.querySelectorAll('[data-timehub-range]').forEach(el=>el.textContent=`${formatDate(minTime)} → ${formatDate(maxTime)}`);
    document.querySelectorAll('[data-timehub-progress]').forEach(el=>el.style.width=`${Math.round(p*100)}%`);
    document.querySelectorAll('[data-timehub-percent]').forEach(el=>el.textContent=`${Math.round(p*100)}%`);
    document.querySelectorAll('[data-timehub-visible]').forEach(el=>el.textContent=String(visible.length));
    document.querySelectorAll('[data-timehub-total]').forEach(el=>el.textContent=String(docs.length));
    document.querySelectorAll('[data-timehub-latest]').forEach(el=>el.textContent=latest?.label||'Move the timeline to explore the project');
    const phase=PHASES.find(item=>p<=item.end)||PHASES[PHASES.length-1];
    document.querySelectorAll('[data-timehub-phase]').forEach(el=>el.textContent=phase.label);
    document.querySelectorAll('.nexus-timehub-phase').forEach((el,index)=>el.classList.toggle('active',PHASES[index]?.label===phase.label));
    const sub=document.getElementById('nexusTopTimeSub');
    if(sub)sub.textContent=document.getElementById('nexusTimeHubPanel')?.classList.contains('open')?document.documentElement.dataset.nexusTimeHubView?.toUpperCase()||'TIME':'TIME';
    emitTime(at,p);
  };

  const stop=()=>{
    playing=false;lastFrame=0;if(frameId)cancelAnimationFrame(frameId);frameId=0;
    document.querySelectorAll('.nexus-timehub-play,.nexus-compact-play,.nexus-tape-control.play').forEach(btn=>{btn.classList.remove('playing');btn.textContent='▶'});
  };
  const tick=timestamp=>{
    if(!playing)return;
    if(!lastFrame)lastFrame=timestamp;
    const elapsed=timestamp-lastFrame;lastFrame=timestamp;
    const slider=document.getElementById('nexusTimeHubSlider');
    const speed=Number(document.getElementById('nexusTimeHubSpeed')?.value||1);
    const current=Number(slider?.value||0);
    const next=Math.min(10000,current+(elapsed/120000)*10000*speed);
    if(slider)slider.value=String(next);
    render();
    if(next>=10000){stop();return}
    frameId=requestAnimationFrame(tick);
  };
  const play=()=>{
    const slider=document.getElementById('nexusTimeHubSlider');
    if(slider&&Number(slider.value)>=10000)slider.value='0';
    mode='simulation';playing=true;
    document.querySelectorAll('.nexus-timehub-play,.nexus-compact-play,.nexus-tape-control.play').forEach(btn=>{btn.classList.add('playing');btn.textContent='❚❚'});
    frameId=requestAnimationFrame(tick);
  };

  const setView=view=>{
    const safe=['classic','compact','tape'].includes(view)?view:'classic';
    document.documentElement.dataset.nexusTimeHubView=safe;
    try{localStorage.setItem('nexus.timeHubView',safe)}catch{}
    document.querySelectorAll('.nexus-timehub-tab').forEach(btn=>btn.classList.toggle('active',btn.dataset.timehubView===safe));
    document.querySelectorAll('.nexus-timehub-view').forEach(section=>section.classList.toggle('active',section.dataset.timehubView===safe));
    render();
  };

  const createHub=()=>{
    if(getPanel())return;
    let saved='classic';try{saved=localStorage.getItem('nexus.timeHubView')||'classic'}catch{}
    const panel=document.createElement('section');
    panel.id='nexusTimeHubPanel';
    panel.setAttribute('aria-label','Nexus Project Time');
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML=`
      <div class="nexus-timehub-head"><span class="nexus-timehub-title"><strong>PROJECT TIME</strong><small>${worldLabel()} · relationship tree</small></span><button class="nexus-timehub-close" type="button" aria-label="Close time panel">×</button></div>
      <div class="nexus-timehub-tabs" role="group" aria-label="Timeline display mode"><button class="nexus-timehub-tab" type="button" data-timehub-view="classic">Classic</button><button class="nexus-timehub-tab" type="button" data-timehub-view="compact">Compact V2</button><button class="nexus-timehub-tab" type="button" data-timehub-view="tape">Tape</button></div>
      <div class="nexus-timehub-view" data-timehub-view="classic">
        <div class="nexus-timehub-main"><div><div class="nexus-timehub-date" data-timehub-date>—</div><div class="nexus-timehub-sub"><span data-timehub-range>—</span> · <span data-timehub-phase>—</span></div></div><button class="nexus-timehub-play" type="button">▶</button><select class="nexus-timehub-select" id="nexusTimeHubSpeed"><option value="0.25">0.25×</option><option value="1" selected>1×</option><option value="5">5×</option><option value="20">20×</option><option value="100">100×</option></select></div>
        <div class="nexus-timehub-modes"><button class="nexus-timehub-mode" type="button" data-mode="real">REAL</button><button class="nexus-timehub-mode" type="button" data-mode="replay">REPLAY</button><button class="nexus-timehub-mode active" type="button" data-mode="simulation">SIMULATION</button></div>
        <div class="nexus-timehub-phases">${PHASES.map(phase=>`<button class="nexus-timehub-phase" type="button">${phase.label}</button>`).join('')}</div>
        <div class="nexus-timehub-railmeta"><span>${worldLabel()}</span><span>PLAYBACK</span><span data-timehub-percent>100%</span></div><div class="nexus-timehub-rail"><div class="nexus-timehub-progress" data-timehub-progress></div><input class="nexus-timehub-slider" id="nexusTimeHubSlider" type="range" min="0" max="10000" value="10000" step="1" /></div>
        <div class="nexus-timehub-stats"><span class="nexus-timehub-stat"><strong data-timehub-visible>0</strong><small>available</small></span><span class="nexus-timehub-stat"><strong data-timehub-total>0</strong><small>total records</small></span><span class="nexus-timehub-stat"><strong data-timehub-phase>—</strong><small>phase</small></span></div><div class="nexus-timehub-event"><strong data-timehub-latest>Move the timeline to explore the project</strong><span>Future records stay visible but dimmed on the graph.</span></div>
      </div>
      <div class="nexus-timehub-view" data-timehub-view="compact"><div class="nexus-compact-row"><div><div class="nexus-compact-date" data-timehub-date>—</div><div class="nexus-compact-sub"><span data-timehub-visible>0</span>/<span data-timehub-total>0</span> records · <span data-timehub-phase>—</span></div></div><button class="nexus-compact-play" type="button">▶</button><select class="nexus-compact-speed" onchange="document.getElementById('nexusTimeHubSpeed').value=this.value"><option value="1">1×</option><option value="5">5×</option><option value="20">20×</option></select></div><div class="nexus-timehub-railmeta"><span data-timehub-range>—</span><span data-timehub-percent>100%</span></div><div class="nexus-timehub-rail"><div class="nexus-timehub-progress" data-timehub-progress></div></div></div>
      <div class="nexus-timehub-view" data-timehub-view="tape"><div class="nexus-tape-card"><div class="nexus-tape-title"><strong>PROJECT TIME DECK</strong><small>${worldLabel()} · replay</small></div><div class="nexus-tape-deck"><div class="nexus-tape-reel"><span></span></div><div class="nexus-tape-reel"><span></span></div></div><div class="nexus-tape-controls"><button class="nexus-tape-control" type="button" data-mode="real">●</button><button class="nexus-tape-control play" type="button">▶</button><button class="nexus-tape-control" type="button" data-mode="replay">↺</button><button class="nexus-tape-control" type="button" data-mode="simulation">◇</button></div><div class="nexus-timehub-railmeta"><span data-timehub-range>—</span><span data-timehub-percent>100%</span></div><div class="nexus-timehub-rail"><div class="nexus-timehub-progress" data-timehub-progress></div></div><div class="nexus-tape-caption"><span><strong data-timehub-date>—</strong><br /><span data-timehub-latest>Move the timeline to explore the project</span></span><code data-timehub-percent>100%</code></div></div></div>
    `;
    document.body.appendChild(panel);
    panel.querySelector('.nexus-timehub-close')?.addEventListener('click',closeHub);
    panel.querySelectorAll('.nexus-timehub-tab').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.timehubView)));
    panel.querySelectorAll('.nexus-timehub-play,.nexus-compact-play,.nexus-tape-control.play').forEach(btn=>btn.addEventListener('click',()=>playing?stop():play()));
    panel.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{stop();mode=btn.dataset.mode||'simulation';panel.querySelectorAll('[data-mode]').forEach(item=>item.classList.toggle('active',item.dataset.mode===mode));const slider=document.getElementById('nexusTimeHubSlider');if(mode==='real'&&slider)slider.value='10000';if(mode==='replay'&&slider)slider.value='0';render()}));
    document.getElementById('nexusTimeHubSlider')?.addEventListener('input',()=>{stop();render()});
    document.getElementById('nexusTimeHubSpeed')?.addEventListener('change',render);
    setView(saved);
  };

  const openHub=()=>{
    createHub();scanDocs();
    document.querySelectorAll('.nexus-shell-panel.open,.nexus-project-switcher.open').forEach(panel=>panel.classList.remove('open'));
    document.getElementById('nexusShellScrim')?.classList.remove('open');
    const panel=getPanel();
    panel?.classList.add('open');panel?.setAttribute('aria-hidden','false');
    document.getElementById('nexusTopTime')?.classList.add('active');
    render();
    window.setTimeout(()=>{scanDocs();render()},220);
  };
  const closeHub=()=>{
    stop();
    const panel=getPanel();panel?.classList.remove('open');panel?.setAttribute('aria-hidden','true');
    document.getElementById('nexusTopTime')?.classList.remove('active');
    const sub=document.getElementById('nexusTopTimeSub');if(sub)sub.textContent='TIME';
  };

  const hideLegacyToolbar=()=>{
    const root=document.getElementById('root');
    if(!root)return;
    Array.from(root.querySelectorAll('[data-control],div,section')).forEach(element=>{
      if(element.closest('.nexus-top-rail,.nexus-shell-panel,.nexus-project-switcher,#nexusTimeHubPanel'))return;
      const text=norm(element.innerText||element.textContent);
      if(!(text.includes('workflow')&&text.includes('objects')&&text.includes('links')))return;
      const rect=element.getBoundingClientRect();
      if(!rect.width||!rect.height||rect.height>230)return;
      element.dataset.nexusHiddenLegacyToolbar='true';
      element.setAttribute('aria-hidden','true');
    });
    Array.from(root.querySelectorAll('button,a,[role="button"]')).forEach(element=>{
      if(element.closest('.nexus-top-rail,.nexus-shell-panel,.nexus-project-switcher,#nexusTimeHubPanel'))return;
      const text=norm(element.innerText||element.textContent);
      const rect=element.getBoundingClientRect();
      if((text==='project'||text==='projects')&&rect.top>window.innerHeight*.58){
        element.style.display='none';element.style.visibility='hidden';element.style.pointerEvents='none';element.setAttribute('aria-hidden','true');
      }
    });
  };

  const wire=()=>{
    const time=document.getElementById('nexusTopTime');
    if(time&&!time.dataset.nexusTimeHubWired){
      time.dataset.nexusTimeHubWired='ready';
      time.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();const panel=getPanel();if(panel?.classList.contains('open'))closeHub();else openHub()},true);
    }
    const projectSub=document.getElementById('nexusTopProjectSub');
    if(projectSub)projectSub.textContent=worldLabel();
  };

  const run=()=>{installStyle();createHub();wire();hideLegacyToolbar();};
  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.requestAnimationFrame(run);
  window.setTimeout(run,120);
  window.setTimeout(run,350);
  window.setTimeout(run,900);
  window.setTimeout(run,1800);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeHub()});
})();