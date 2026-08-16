// NEXUS_PROJECT_TIME_OVERLAY_RECOVERY_20260813
// Lightweight Project Time overlay. Does not click graph-native TIMELINE OFF and does not mutate React #root.
(()=>{
  if(window.__NEXUS_PROJECT_TIME_OVERLAY_RECOVERY__)return;
  window.__NEXUS_PROJECT_TIME_OVERLAY_RECOVERY__=true;

  const records=(window.ESAFE_RECORDS||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const MS_DAY=86400000;
  const sourceStart=records.length?new Date(records[0].date+'T00:00:00Z'):new Date('2021-06-28T00:00:00Z');
  const sourceEnd=records.length?new Date(records[records.length-1].date+'T00:00:00Z'):new Date('2026-03-21T00:00:00Z');
  const simStart=new Date('2026-06-01T00:00:00Z');
  const simEnd=new Date('2026-08-31T00:00:00Z');
  const sourceSpan=Math.max(1,sourceEnd-sourceStart);
  const simSpan=simEnd-simStart;
  const compression=sourceSpan/simSpan;
  let mode='simulation';
  let playing=false;
  let lastFrame=performance.now();

  const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
  const fmtDate=d=>new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase();
  const dateAt=(start,span,p)=>new Date(start.getTime()+span*clamp(p));
  const sourceDateAt=p=>dateAt(sourceStart,sourceSpan,p);
  const simDateAt=p=>dateAt(simStart,simSpan,p);
  const pForSourceDate=d=>clamp((d-sourceStart)/sourceSpan);
  const activePhase=p=>p<.15?'SURVEY':p<.35?'DESIGN + BIM':p<.55?'PROCUREMENT':p<.85?'CONSTRUCTION':'TESTING + HANDOVER';
  const eventsUpTo=p=>{
    const cutoff=sourceDateAt(p);
    return records.filter(r=>new Date(r.date+'T23:59:59Z')<=cutoff);
  };

  function ensurePanel(){
    let panel=document.getElementById('nexusProjectTimeOverlay');
    if(panel)return panel;
    panel=document.createElement('aside');
    panel.id='nexusProjectTimeOverlay';
    panel.setAttribute('aria-label','Project Time Engine');
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML=`
      <div class="nexus-ptime-top">
        <div>
          <div class="nexus-ptime-eyebrow">PROJECT TIME</div>
          <div class="nexus-ptime-clock" id="nexusPTimeClock">—</div>
          <div class="nexus-ptime-source" id="nexusPTimeSource">Source: —</div>
        </div>
        <div class="nexus-ptime-mode-switch" role="group" aria-label="Timeline mode">
          <button type="button" data-nexus-ptime-mode="real">REAL</button>
          <button type="button" data-nexus-ptime-mode="replay">REPLAY</button>
          <button type="button" data-nexus-ptime-mode="simulation" class="active">SIMULATION</button>
        </div>
        <div class="nexus-ptime-playback">
          <button class="nexus-ptime-play" id="nexusPTimePlay" type="button" aria-label="Play project time">▶</button>
          <select class="nexus-ptime-select" id="nexusPTimeSpeed" aria-label="Playback speed"><option value="0.25">0.25×</option><option value="1" selected>1×</option><option value="5">5×</option><option value="20">20×</option><option value="100">100×</option></select>
          <button class="nexus-ptime-close" id="nexusPTimeClose" type="button" aria-label="Close Project Time">×</button>
        </div>
      </div>
      <div class="nexus-ptime-phase-strip" id="nexusPTimePhaseStrip"><span>SURVEY</span><span>DESIGN + BIM</span><span>PROCUREMENT</span><span>CONSTRUCTION</span><span>TESTING + HANDOVER</span></div>
      <div>
        <div class="nexus-ptime-rail-meta"><span id="nexusPTimeStart">—</span><span id="nexusPTimeCompression">—</span><span id="nexusPTimeEnd">—</span></div>
        <div class="nexus-ptime-rail"><div class="nexus-ptime-progress" id="nexusPTimeProgress"></div><div class="nexus-ptime-markers" id="nexusPTimeMarkers"></div><input class="nexus-ptime-slider" id="nexusPTimeSlider" type="range" min="0" max="10000" value="7200" step="1" aria-label="Project time scrubber" /></div>
      </div>
      <div class="nexus-ptime-bottom">
        <div class="nexus-ptime-metric"><strong id="nexusPTimeDocs">0</strong><span>documents available</span></div>
        <div class="nexus-ptime-metric"><strong id="nexusPTimeFiles">0</strong><span>files available</span></div>
        <div class="nexus-ptime-metric"><strong id="nexusPTimePhase">—</strong><span>demo phase</span></div>
        <div class="nexus-ptime-event"><small>LATEST EVENT</small><strong id="nexusPTimeEventTitle">Move the timeline to explore the project</strong><span id="nexusPTimeEventDetail">${records.length||0} source records loaded</span></div>
      </div>`;
    document.body.appendChild(panel);
    bind(panel);
    return panel;
  }

  function elements(){
    return {
      panel:document.getElementById('nexusProjectTimeOverlay'),
      slider:document.getElementById('nexusPTimeSlider'),
      progress:document.getElementById('nexusPTimeProgress'),
      clock:document.getElementById('nexusPTimeClock'),
      source:document.getElementById('nexusPTimeSource'),
      docs:document.getElementById('nexusPTimeDocs'),
      files:document.getElementById('nexusPTimeFiles'),
      phase:document.getElementById('nexusPTimePhase'),
      eventTitle:document.getElementById('nexusPTimeEventTitle'),
      eventDetail:document.getElementById('nexusPTimeEventDetail'),
      markers:document.getElementById('nexusPTimeMarkers'),
      start:document.getElementById('nexusPTimeStart'),
      end:document.getElementById('nexusPTimeEnd'),
      compression:document.getElementById('nexusPTimeCompression'),
      phaseStrip:document.getElementById('nexusPTimePhaseStrip'),
      play:document.getElementById('nexusPTimePlay'),
      speed:document.getElementById('nexusPTimeSpeed'),
      close:document.getElementById('nexusPTimeClose')
    };
  }

  function pct(){const e=elements();return Number(e.slider.value)/Number(e.slider.max);}

  function render(){
    const e=elements();
    if(!e.panel)return;
    const p=pct();
    const visible=eventsUpTo(p);
    const latest=visible.length?visible[visible.length-1]:null;
    const phase=activePhase(p);
    e.progress.style.width=`${p*100}%`;
    e.clock.textContent=mode==='simulation'?fmtDate(simDateAt(p)):fmtDate(sourceDateAt(p));
    e.source.textContent=mode==='simulation'?`Source chronology: ${fmtDate(sourceDateAt(p))} · ${compression.toFixed(1)}× compressed`:mode==='replay'?`Source chronology replay · ${fmtDate(sourceDateAt(p))}`:`Source record time · ${fmtDate(sourceDateAt(p))}`;
    e.docs.textContent=String(visible.length);
    e.files.textContent=String(visible.reduce((n,r)=>n+(r.files?.length||0),0));
    e.phase.textContent=phase;
    [...e.phaseStrip.children].forEach((el,i)=>{
      const starts=[0,.15,.35,.55,.85],ends=[.15,.35,.55,.85,1];
      el.classList.toggle('active',p>=starts[i]&&p<=(ends[i]+(i===4?.001:0)));
    });
    if(latest){
      e.eventTitle.textContent=latest.title;
      e.eventDetail.textContent=`${fmtDate(new Date(latest.date+'T00:00:00Z'))} · ${(latest.files||[]).length} file${(latest.files||[]).length===1?'':'s'} · ${latest.category}${latest.core?' · CORE PILOT':''}`;
    }else{
      e.eventTitle.textContent='Project world not started';
      e.eventDetail.textContent='Move the scrubber right to reveal source records';
    }
    try{
      window.dispatchEvent(new CustomEvent('NEXUS_PROJECT_TIME_CHANGE',{detail:{mode,progress:p,sourceDate:sourceDateAt(p).toISOString(),simulationDate:simDateAt(p).toISOString(),phase,visibleRecordIds:visible.map(r=>r.id)}}));
    }catch(_){ }
  }

  function renderMarkers(){
    const e=elements();
    if(!e.markers)return;
    const f=document.createDocumentFragment();
    records.forEach(r=>{
      const m=document.createElement('span');
      m.className='nexus-ptime-marker'+(r.core?' core':'');
      m.style.left=`${pForSourceDate(new Date(r.date+'T00:00:00Z'))*100}%`;
      m.title=`${r.date} · ${r.title}`;
      f.appendChild(m);
    });
    e.markers.replaceChildren(f);
  }

  function setMode(next){
    mode=next;
    document.querySelectorAll('[data-nexus-ptime-mode]').forEach(b=>b.classList.toggle('active',b.dataset.nexusPtimeMode===mode));
    if(mode==='real')playing=false;
    const e=elements();
    e.play.textContent=playing?'Ⅱ':'▶';
    e.play.classList.toggle('playing',playing);
    render();
  }

  function bind(panel){
    const e=elements();
    e.start.textContent=`SOURCE ${fmtDate(sourceStart)}`;
    e.end.textContent=`SOURCE ${fmtDate(sourceEnd)}`;
    e.compression.textContent=`3-MONTH DEMO WORLD · ${compression.toFixed(1)}× TIME COMPRESSION`;
    e.slider.addEventListener('input',render);
    document.querySelectorAll('[data-nexus-ptime-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.nexusPtimeMode)));
    e.play.addEventListener('click',()=>{
      if(mode==='real')mode='replay';
      playing=!playing;
      e.play.textContent=playing?'Ⅱ':'▶';
      e.play.classList.toggle('playing',playing);
      document.querySelectorAll('[data-nexus-ptime-mode]').forEach(b=>b.classList.toggle('active',b.dataset.nexusPtimeMode===mode));
      render();
    });
    e.close.addEventListener('click',()=>{
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden','true');
      const sub=document.getElementById('nexusTopTimeSub');
      if(sub)sub.textContent='OFF';
    });
    renderMarkers();
    render();
  }

  function tick(now){
    const e=elements();
    const dt=(now-lastFrame)/1000;
    lastFrame=now;
    if(playing&&e.slider){
      const speed=Number(e.speed.value)||1;
      const simDays=simSpan/MS_DAY;
      const delta=(dt*speed)/simDays;
      let next=pct()+delta;
      if(next>=1){next=1;playing=false;e.play.textContent='▶';e.play.classList.remove('playing');}
      e.slider.value=Math.round(next*Number(e.slider.max));
      render();
    }
    requestAnimationFrame(tick);
  }

  function wireTopTime(){
    const time=document.getElementById('nexusTopTimeLite')||document.getElementById('nexusTopTime');
    if(!time)return false;
    time.classList.remove('disabled');
    time.removeAttribute('aria-disabled');
    if(time.tagName==='A')time.setAttribute('href','#project-time');
    time.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      const panel=ensurePanel();
      panel.classList.toggle('open');
      panel.setAttribute('aria-hidden',panel.classList.contains('open')?'false':'true');
      const sub=document.getElementById('nexusTopTimeSub');
      if(sub)sub.textContent=panel.classList.contains('open')?'ON':'OFF';
      render();
    },{capture:true});
    return true;
  }

  const start=()=>{
    if(!wireTopTime())setTimeout(start,120);
    requestAnimationFrame(tick);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
