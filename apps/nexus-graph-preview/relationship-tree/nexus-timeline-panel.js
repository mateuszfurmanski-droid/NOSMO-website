// NEXUS_PROJECT_TIME_RECORDER_TRANSPORT_20260817
(()=>{
  if(window.__NEXUS_PROJECT_TIME_OVERLAY_EXACT__)return;
  window.__NEXUS_PROJECT_TIME_OVERLAY_EXACT__=true;

  const records=[
    ['2024-11-22','Energy Retrofit Potential in the Public Housing Stock',1,true],
    ['2025-03-24','e-SAFE 7th Newsletter',1,false],
    ['2025-06-25','Seismic and Energy Renovation of RC-Framed Buildings',1,false],
    ['2025-09-15','e-SAFE Newsletter #8',1,false],
    ['2026-03-19','Report on monitoring activities',1,true],
    ['2026-03-20','Production and delivery of the real pilot',1,true],
    ['2026-03-20','Detailed design for the renovation',1,true],
    ['2026-03-21','Final e-SAFE engagement protocol',1,false]
  ].map((r,i)=>({id:'pt-'+i,date:r[0],title:r[1],files:Array.from({length:r[2]},(_,n)=>'Source file '+(n+1)),core:r[3]}));

  const start=new Date('2024-11-22T00:00:00Z');
  const end=new Date('2026-03-21T00:00:00Z');
  const simStart=new Date('2026-06-01T00:00:00Z');
  const simEnd=new Date('2026-08-31T00:00:00Z');
  const span=end-start;
  const simSpan=simEnd-simStart;
  const compression=span/simSpan;
  let mode='simulation';
  let playing=false;
  let direction=1;
  let recording=false;
  let last=performance.now();

  const $=id=>document.getElementById(id);
  const clamp=v=>Math.max(0,Math.min(1,v));
  const at=(a,b,p)=>new Date(a.getTime()+b*clamp(p));
  const srcAt=p=>at(start,span,p);
  const simAt=p=>at(simStart,simSpan,p);
  const pctFor=d=>clamp((new Date(d+'T00:00:00Z')-start)/span);
  const fmt=d=>new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase();
  const phase=p=>p<.15?'SURVEY':p<.35?'DESIGN + BIM':p<.55?'PROCUREMENT':p<.85?'CONSTRUCTION':'TESTING + HANDOVER';
  const visible=p=>records.filter(r=>new Date(r.date+'T23:59:59Z')<=srcAt(p));
  const esc=value=>String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function injectHardStyle(){
    if($('nexusPTimeRecorderHardStyle'))return;
    const style=document.createElement('style');
    style.id='nexusPTimeRecorderHardStyle';
    style.textContent=`
      #nexusProjectTimeOverlay{max-height:min(31dvh,248px)!important;gap:3px!important;padding:7px 8px 6px!important;overflow:hidden!important}
      #nexusProjectTimeOverlay .nexus-ptime-top{display:grid!important;grid-template-columns:1fr!important;gap:3px!important;width:100%!important}
      #nexusProjectTimeOverlay .nexus-ptime-heading{min-width:0;display:grid;gap:2px!important}
      #nexusProjectTimeOverlay .nexus-ptime-heading-row{display:flex!important;align-items:baseline!important;gap:8px!important;min-width:0!important;white-space:nowrap!important;overflow:hidden!important}
      #nexusProjectTimeOverlay .nexus-ptime-eyebrow{font-size:7px!important;letter-spacing:.16em!important;color:#7fd0ff!important;font-weight:900!important;text-transform:uppercase!important;line-height:1!important;white-space:nowrap!important;flex:0 0 auto!important}
      #nexusProjectTimeOverlay .nexus-ptime-clock{font-size:7px!important;letter-spacing:.16em!important;color:#eef6ff!important;font-weight:900!important;text-transform:uppercase!important;line-height:1!important;margin:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;flex:0 1 auto!important}
      #nexusProjectTimeOverlay .nexus-ptime-source{display:none!important}
      .nexus-ptime-ticker{height:17px;border:1px solid rgba(151,193,232,.2);border-radius:5px;background:linear-gradient(180deg,rgba(3,10,19,.74),rgba(13,24,39,.72));overflow:hidden;display:flex;align-items:center;white-space:nowrap;box-shadow:inset 0 0 0 1px rgba(0,0,0,.28)}
      .nexus-ptime-ticker-text{display:inline-flex;gap:13px;align-items:center;min-width:max-content;padding-left:100%;font-size:6.6px;line-height:1;font-weight:900;letter-spacing:.11em;text-transform:uppercase;animation:nexusPTimeTicker 18s linear infinite}
      .nexus-ptime-ticker b{color:#7fd0ff;font-weight:950}.nexus-ptime-ticker strong{color:#eef6ff;font-weight:950}.nexus-ptime-ticker em{color:#ffd166;font-style:normal}.nexus-ptime-ticker span{color:#a8bbcf}
      @keyframes nexusPTimeTicker{from{transform:translateX(0)}to{transform:translateX(-100%)}}
      .nexus-ptime-transport{display:grid;grid-template-columns:1.12fr .85fr .85fr .85fr .82fr 1fr .92fr;gap:3px;width:100%;height:24px}
      .nexus-ptime-transport button,.nexus-ptime-transport select{min-width:0!important;height:24px!important;border:1px solid rgba(151,193,232,.22)!important;border-radius:5px!important;background:linear-gradient(180deg,rgba(20,34,52,.74),rgba(7,16,29,.84))!important;color:#dceeff!important;font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;font-size:6.5px!important;font-weight:950!important;letter-spacing:.075em!important;line-height:1!important;text-align:center!important;padding:0 2px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important;text-transform:uppercase!important}
      .nexus-ptime-transport button.active,.nexus-ptime-transport button.recording{border-color:rgba(111,231,255,.72)!important;background:linear-gradient(180deg,rgba(22,58,88,.95),rgba(13,39,64,.96))!important;box-shadow:inset 0 0 0 1px rgba(54,163,255,.2),0 0 9px rgba(54,163,255,.14)!important;color:#fff!important}
      .nexus-ptime-transport button.recording::before{content:'';display:inline-block;width:4px;height:4px;border-radius:50%;background:#ff5a67;margin-right:3px;vertical-align:1px;box-shadow:0 0 6px rgba(255,90,103,.8)}
      .nexus-ptime-mode-switch{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;height:16px!important;border:1px solid rgba(151,193,232,.22);border-radius:5px!important;padding:1px!important;background:linear-gradient(180deg,rgba(2,9,18,.72),rgba(13,25,42,.72));gap:2px!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.22)}
      .nexus-ptime-mode-switch button{position:relative!important;height:12px!important;min-height:12px!important;border:1px solid rgba(151,193,232,.16)!important;background:linear-gradient(180deg,rgba(20,34,52,.72),rgba(9,18,32,.78))!important;color:#a9bacd!important;padding:0 2px 0 11px!important;border-radius:2px!important;font-size:6px!important;font-weight:900!important;letter-spacing:.052em!important;line-height:12px!important;cursor:pointer;display:block!important;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
      .nexus-ptime-mode-switch button::before{content:'';position:absolute;left:3px;top:50%;width:4px;height:4px;border-radius:1px;transform:translateY(-50%);background:#243344;border:1px solid rgba(133,166,200,.24);box-shadow:inset 0 0 3px rgba(0,0,0,.45)}
      .nexus-ptime-mode-switch button.active{background:linear-gradient(180deg,rgba(22,58,88,.9),rgba(13,39,64,.94))!important;color:#e5f4ff!important;border-color:rgba(54,163,255,.44)!important;box-shadow:inset 0 0 0 1px rgba(54,163,255,.18),0 0 9px rgba(54,163,255,.1)!important}
      .nexus-ptime-mode-switch button.active::before{background:#6fe7ff;border-color:rgba(164,238,255,.95);box-shadow:0 0 7px rgba(111,231,255,.72),inset 0 0 2px rgba(255,255,255,.55)}
      .nexus-ptime-phase-strip{height:14px!important;border-radius:5px!important}.nexus-ptime-phase-strip span{font-size:5px!important}
      .nexus-ptime-rail-meta{font-size:6.1px!important;line-height:1!important;margin:0!important;gap:3px!important}
      .nexus-ptime-rail{height:20px!important}.nexus-ptime-rail:before,.nexus-ptime-progress{top:9px!important}.nexus-ptime-markers{height:20px!important}.nexus-ptime-marker{top:5px!important;height:10px!important}.nexus-ptime-marker.core{top:1px!important;height:18px!important}.nexus-ptime-slider{top:0!important;height:20px!important}.nexus-ptime-slider::-webkit-slider-thumb{width:18px!important;height:18px!important;border-width:4px!important;margin-top:-8px!important}
      .nexus-ptime-bottom{display:grid!important;grid-template-columns:1fr!important;gap:3px!important;min-height:0!important;width:100%!important}
      .nexus-ptime-status-strip{display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:2px;height:19px;align-items:center;border:1px solid rgba(151,193,232,.18);border-radius:6px;background:rgba(255,255,255,.025);overflow:hidden}
      .nexus-ptime-status-item{position:relative;display:flex;align-items:center;gap:4px;min-width:0;height:100%;padding:0 5px 0 12px;border-right:1px solid rgba(151,193,232,.13);font-size:6.5px;color:#a8bbcf;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .nexus-ptime-status-item:last-child{border-right:0}.nexus-ptime-status-item::before{content:'';position:absolute;left:4px;width:4px;height:4px;border-radius:1px;background:#6fe7ff;box-shadow:0 0 6px rgba(111,231,255,.68)}
      .nexus-ptime-status-item strong{font-size:9px;color:#eef6ff;font-weight:950;line-height:1;white-space:nowrap}.nexus-ptime-status-item span{overflow:hidden;text-overflow:ellipsis}
      .nexus-ptime-metric{display:none!important}
      .nexus-ptime-event{grid-column:auto!important;text-align:left;padding:4px 18px 4px 7px!important;display:grid;gap:1px;min-width:0;min-height:29px;background:rgba(54,163,255,.075);border:1px solid rgba(54,163,255,.24);border-radius:9px;cursor:pointer;position:relative;user-select:none;-webkit-tap-highlight-color:transparent}
      .nexus-ptime-event::after{content:'▾';position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:10px;color:#7fd0ff;opacity:.85;transition:transform .15s ease}
      .nexus-ptime-event small{font-size:6px;font-weight:900;letter-spacing:.14em;color:#7fd0ff}.nexus-ptime-event strong{font-size:8.5px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nexus-ptime-event span{font-size:6.6px;color:#a8bbcf;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #nexusProjectTimeOverlay.events-open{max-height:min(48dvh,390px)!important}#nexusProjectTimeOverlay.events-open .nexus-ptime-event::after{transform:translateY(-50%) rotate(180deg)}
      .nexus-ptime-event-list{display:none;border:1px solid rgba(54,163,255,.22);border-radius:10px;background:rgba(3,12,23,.44);max-height:104px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:3px;gap:2px;scrollbar-width:thin;scrollbar-color:rgba(127,208,255,.6) rgba(255,255,255,.06)}
      #nexusProjectTimeOverlay.events-open .nexus-ptime-event-list{display:grid}.nexus-ptime-event-row{width:100%;border:1px solid rgba(151,193,232,.13);background:linear-gradient(180deg,rgba(20,34,52,.62),rgba(8,18,31,.68));color:#dceeff;border-radius:6px;display:grid;grid-template-columns:52px minmax(0,1fr) 30px;align-items:center;gap:5px;min-height:25px;padding:3px 5px;text-align:left;font-family:Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}.nexus-ptime-event-row span{font-size:6.5px;line-height:1.05;color:#7fd0ff;font-weight:900;text-transform:uppercase}.nexus-ptime-event-row strong{font-size:7.5px;line-height:1.1;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nexus-ptime-event-row small{font-size:6px;color:#a8bbcf;text-align:right;font-weight:900;letter-spacing:.08em}.nexus-ptime-event-row.active{border-color:rgba(111,231,255,.72);background:linear-gradient(180deg,rgba(22,58,88,.86),rgba(13,39,64,.92));box-shadow:inset 0 0 0 1px rgba(54,163,255,.18),0 0 10px rgba(54,163,255,.12)}
      @media(max-width:380px){#nexusProjectTimeOverlay{max-height:min(31dvh,242px)!important;padding:6px 7px!important}.nexus-ptime-ticker{height:16px}.nexus-ptime-ticker-text{font-size:6px;gap:10px;animation-duration:16s}.nexus-ptime-transport{height:22px;gap:2px}.nexus-ptime-transport button,.nexus-ptime-transport select{height:22px!important;font-size:5.8px!important;border-radius:4px!important}.nexus-ptime-mode-switch{height:15px!important}.nexus-ptime-mode-switch button{height:11px!important;line-height:11px!important;font-size:5.6px!important;padding-left:10px!important}.nexus-ptime-phase-strip span{font-size:4.7px!important}.nexus-ptime-rail-meta{font-size:5.8px!important}.nexus-ptime-status-strip{height:17px}.nexus-ptime-status-item{font-size:5.8px;padding-left:10px}.nexus-ptime-status-item strong{font-size:8px}.nexus-ptime-event{min-height:27px!important}.nexus-ptime-event-list{max-height:86px}.nexus-ptime-event-row{grid-template-columns:48px minmax(0,1fr) 28px;gap:4px;min-height:22px;padding:3px 4px}.nexus-ptime-event-row span{font-size:6px}.nexus-ptime-event-row strong{font-size:7px}.nexus-ptime-event-row small{font-size:5.6px}}
    `;
    document.head.appendChild(style);
  }

  function stopPlayback(){
    playing=false;
    const play=$('nexusPTimePlay');
    if(play){play.classList.remove('active');play.textContent='PLAY'}
  }

  function bump(delta){
    const slider=$('nexusPTimeSlider');
    if(!slider)return;
    stopPlayback();
    const value=clamp((Number(slider.value)+delta)/10000);
    slider.value=String(Math.round(value*10000));
    render();
  }

  function panel(){
    let p=$('nexusProjectTimeOverlay');
    if(p)return p;
    injectHardStyle();
    const root=document.createElement('aside');
    root.id='nexusProjectTimeOverlay';
    root.setAttribute('aria-label','Project Time Engine');
    root.setAttribute('aria-hidden','true');
    root.innerHTML=`
      <div class="nexus-ptime-top">
        <div class="nexus-ptime-heading">
          <div class="nexus-ptime-heading-row"><span class="nexus-ptime-eyebrow">PROJECT TIME</span><span class="nexus-ptime-clock" id="nexusPTimeClock">05 AUG 2026</span></div>
        </div>
        <div class="nexus-ptime-ticker" aria-live="polite"><div class="nexus-ptime-ticker-text" id="nexusPTimeTicker"><b>PROJECT TIME</b><strong>05 AUG 2026</strong><span>LOADING CHRONOLOGY</span></div></div>
        <div class="nexus-ptime-transport" aria-label="Project Time recorder controls">
          <button class="nexus-ptime-transport-button" id="nexusPTimePlay" type="button">PLAY</button>
          <button class="nexus-ptime-transport-button" id="nexusPTimeRev" type="button">REV</button>
          <button class="nexus-ptime-transport-button" id="nexusPTimeFfd" type="button">FFD</button>
          <button class="nexus-ptime-transport-button" id="nexusPTimeRwd" type="button">RWD</button>
          <button class="nexus-ptime-transport-button" id="nexusPTimeRec" type="button">REC</button>
          <button class="nexus-ptime-transport-button" id="nexusPTimeScrn" type="button">SCRN</button>
          <select class="nexus-ptime-select" id="nexusPTimeSpeed" aria-label="Playback speed"><option value="0.25">0.25×</option><option value="1" selected>1×</option><option value="5">5×</option><option value="20">20×</option><option value="100">100×</option></select>
        </div>
      </div>
      <div class="nexus-ptime-mode-switch"><button type="button" data-ptime="real">REAL</button><button type="button" data-ptime="replay">REPLAY</button><button type="button" data-ptime="simulation" class="active">SIMULATION</button></div>
      <div class="nexus-ptime-phase-strip" id="nexusPTimePhaseStrip"><span>SURVEY</span><span>DESIGN + BIM</span><span>PROCUREMENT</span><span>CONSTRUCTION</span><span>TESTING + HANDOVER</span></div>
      <div><div class="nexus-ptime-rail-meta"><span>SOURCE 22 NOV 2024</span><span>3-MONTH DEMO WORLD · 19.0× TIME COMPRESSION</span><span>SOURCE 21 MAR 2026</span></div><div class="nexus-ptime-rail"><div class="nexus-ptime-progress" id="nexusPTimeProgress"></div><div class="nexus-ptime-markers" id="nexusPTimeMarkers"></div><input class="nexus-ptime-slider" id="nexusPTimeSlider" type="range" min="0" max="10000" value="7200" step="1" /></div></div>
      <div class="nexus-ptime-bottom">
        <div class="nexus-ptime-status-strip"><div class="nexus-ptime-status-item"><strong id="nexusPTimeDocs">0</strong><span>DOCS</span></div><div class="nexus-ptime-status-item"><strong id="nexusPTimeFiles">0</strong><span>FILES</span></div><div class="nexus-ptime-status-item"><strong id="nexusPTimePhase">—</strong><span>PHASE</span></div></div>
        <div class="nexus-ptime-event" id="nexusPTimeEvent" role="button" tabindex="0" aria-expanded="false"><small>LATEST EVENT</small><strong id="nexusPTimeEventTitle">Move the timeline to explore the project</strong><span id="nexusPTimeEventDetail">8 source records loaded</span></div>
      </div>
      <div class="nexus-ptime-event-list" id="nexusPTimeEventList" aria-hidden="true"></div>`;
    document.body.appendChild(root);
    bind();
    return root;
  }

  function renderMarkers(){
    const markers=$('nexusPTimeMarkers');
    if(!markers)return;
    const frag=document.createDocumentFragment();
    records.forEach(record=>{
      const marker=document.createElement('span');
      marker.className='nexus-ptime-marker'+(record.core?' core':'');
      marker.style.left=(pctFor(record.date)*100)+'%';
      frag.appendChild(marker);
    });
    markers.replaceChildren(frag);
  }

  function buildEventList(){
    const list=$('nexusPTimeEventList');
    if(!list||list.dataset.ready==='true')return;
    const sorted=records.slice().sort((a,b)=>new Date(b.date+'T00:00:00Z')-new Date(a.date+'T00:00:00Z'));
    list.innerHTML=sorted.map(record=>`<button class="nexus-ptime-event-row" type="button" data-date="${esc(record.date)}" data-id="${esc(record.id)}"><span>${fmt(new Date(record.date+'T00:00:00Z'))}</span><strong>${esc(record.title)}</strong><small>${record.core?'CORE':'SRC'}</small></button>`).join('');
    list.addEventListener('click',event=>{
      const row=event.target.closest('.nexus-ptime-event-row');
      if(!row)return;
      stopPlayback();
      const slider=$('nexusPTimeSlider');
      if(slider)slider.value=String(Math.round(pctFor(row.dataset.date)*10000));
      render();
      row.scrollIntoView({block:'nearest'});
    });
    list.dataset.ready='true';
  }

  function setEventListOpen(open){
    const root=$('nexusProjectTimeOverlay'),eventBox=$('nexusPTimeEvent'),list=$('nexusPTimeEventList');
    if(!root||!eventBox||!list)return;
    buildEventList();
    root.classList.toggle('events-open',open);
    eventBox.setAttribute('aria-expanded',open?'true':'false');
    list.setAttribute('aria-hidden',open?'false':'true');
  }

  function syncEventList(latest){
    const list=$('nexusPTimeEventList');
    if(!list||list.dataset.ready!=='true')return;
    list.querySelectorAll('.nexus-ptime-event-row').forEach(row=>row.classList.toggle('active',Boolean(latest&&row.dataset.id===latest.id)));
  }

  function render(){
    const slider=$('nexusPTimeSlider');
    const p=slider?Number(slider.value)/10000:.72;
    const v=visible(p);
    const latest=v[v.length-1];
    const ph=phase(p);
    const shownDate=mode==='simulation'?fmt(simAt(p)):fmt(srcAt(p));
    const sourceDate=fmt(srcAt(p));
    if($('nexusPTimeProgress'))$('nexusPTimeProgress').style.width=(p*100)+'%';
    if($('nexusPTimeClock'))$('nexusPTimeClock').textContent=shownDate;
    if($('nexusPTimeTicker'))$('nexusPTimeTicker').innerHTML=`<b>PROJECT TIME</b><strong>${esc(shownDate)}</strong><span>SOURCE ${esc(sourceDate)}</span><em>${compression.toFixed(1)}× COMPRESSED</em><span>${esc(ph)}</span><span>${v.length} DOCS · ${v.reduce((n,r)=>n+r.files.length,0)} FILES</span>`;
    if($('nexusPTimeDocs'))$('nexusPTimeDocs').textContent=String(v.length);
    if($('nexusPTimeFiles'))$('nexusPTimeFiles').textContent=String(v.reduce((n,r)=>n+r.files.length,0));
    if($('nexusPTimePhase'))$('nexusPTimePhase').textContent=ph;
    const starts=[0,.15,.35,.55,.85],ends=[.15,.35,.55,.85,1];
    [...($('nexusPTimePhaseStrip')?.children||[])].forEach((el,i)=>el.classList.toggle('active',p>=starts[i]&&p<=ends[i]+(i===4?0.001:0)));
    if(latest){
      $('nexusPTimeEventTitle').textContent=latest.title;
      $('nexusPTimeEventDetail').textContent=fmt(new Date(latest.date+'T00:00:00Z'))+' · '+latest.files.length+' file · source record';
    }
    syncEventList(latest);
    window.__NEXUS_PROJECT_TIME__={mode,progress:p,source:'project-time-recorder-transport'};
  }

  function bind(){
    renderMarkers();
    buildEventList();
    render();
    $('nexusPTimeSlider')?.addEventListener('input',()=>{stopPlayback();render()});
    document.querySelectorAll('[data-ptime]').forEach(button=>button.addEventListener('click',()=>{
      mode=button.dataset.ptime;
      document.querySelectorAll('[data-ptime]').forEach(node=>node.classList.toggle('active',node===button));
      render();
    }));
    $('nexusPTimePlay')?.addEventListener('click',()=>{
      direction=1;
      playing=!playing;
      $('nexusPTimePlay').classList.toggle('active',playing);
      $('nexusPTimePlay').textContent=playing?'STOP':'PLAY';
    });
    $('nexusPTimeRev')?.addEventListener('click',()=>{direction=-1;playing=true;$('nexusPTimePlay')?.classList.add('active');$('nexusPTimePlay').textContent='STOP'});
    $('nexusPTimeFfd')?.addEventListener('click',()=>bump(900));
    $('nexusPTimeRwd')?.addEventListener('click',()=>bump(-900));
    $('nexusPTimeRec')?.addEventListener('click',()=>{recording=!recording;$('nexusPTimeRec').classList.toggle('recording',recording)});
    $('nexusPTimeScrn')?.addEventListener('click',()=>{$('nexusPTimeScrn').classList.add('active');setTimeout(()=>$('nexusPTimeScrn')?.classList.remove('active'),450)});
    $('nexusPTimeEvent')?.addEventListener('click',()=>setEventListOpen(!$('nexusProjectTimeOverlay')?.classList.contains('events-open')));
    $('nexusPTimeEvent')?.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setEventListOpen(!$('nexusProjectTimeOverlay')?.classList.contains('events-open'))}});
  }

  function tick(t){
    const slider=$('nexusPTimeSlider');
    if(playing&&slider){
      const dt=(t-last)/1000;
      const speed=Number($('nexusPTimeSpeed')?.value||1);
      let next=Number(slider.value)+(dt*speed*110*direction);
      if(next>=10000){next=10000;stopPlayback()}
      if(next<=0){next=0;stopPlayback()}
      slider.value=String(Math.round(next));
      render();
    }
    last=t;
    requestAnimationFrame(tick);
  }

  function wire(){
    const time=$('nexusTopTime');
    if(!time)return setTimeout(wire,100);
    time.addEventListener('click',event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      document.getElementById('nexusTimelinePanel')?.remove();
      const instance=panel();
      instance.classList.toggle('open');
      instance.setAttribute('aria-hidden',instance.classList.contains('open')?'false':'true');
      if(!instance.classList.contains('open'))setEventListOpen(false);
      const sub=$('nexusTopTimeSub');
      if(sub)sub.textContent=instance.classList.contains('open')?'100%':'OFF';
      render();
    },true);
    requestAnimationFrame(tick);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
})();