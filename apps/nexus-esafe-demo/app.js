(()=>{
  const records=(window.ESAFE_RECORDS||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  if(!records.length)return;

  const MS_DAY=86400000;
  const sourceStart=new Date(records[0].date+'T00:00:00Z');
  const sourceEnd=new Date(records[records.length-1].date+'T00:00:00Z');
  const simStart=new Date('2026-06-01T00:00:00Z');
  const simEnd=new Date('2026-08-31T00:00:00Z');
  const sourceSpan=sourceEnd-sourceStart;
  const simSpan=simEnd-simStart;
  const compression=sourceSpan/simSpan;

  const e={
    shell:document.getElementById('worldShell'),
    slider:document.getElementById('timeSlider'),
    progress:document.getElementById('railProgress'),
    projectClock:document.getElementById('projectClock'),
    sourceClock:document.getElementById('sourceClock'),
    visibleDocs:document.getElementById('visibleDocs'),
    visibleFiles:document.getElementById('visibleFiles'),
    currentPhase:document.getElementById('currentPhase'),
    latestEventTitle:document.getElementById('latestEventTitle'),
    latestEventDetail:document.getElementById('latestEventDetail'),
    eventCard:document.getElementById('eventCard'),
    eventMarkers:document.getElementById('eventMarkers'),
    rangeStart:document.getElementById('rangeStart'),
    rangeEnd:document.getElementById('rangeEnd'),
    compressionLabel:document.getElementById('compressionLabel'),
    phaseStrip:document.getElementById('phaseStrip'),
    playBtn:document.getElementById('playBtn'),
    speed:document.getElementById('speedSelect'),
    liveBtn:document.getElementById('liveBtn'),
    timeline:document.getElementById('timelineZone'),
    timeTile:document.getElementById('timeTile'),
    timeTileValue:document.getElementById('timeTileValue'),
    sourceTileValue:document.getElementById('sourceTileValue'),
    sourcesTile:document.getElementById('sourcesTile'),
    nexusTile:document.getElementById('nexusTile'),
    closeTimeline:document.getElementById('closeTimeline'),
    frame:document.getElementById('nexusFrame'),
    drawer:document.getElementById('eventDrawer'),
    drawerTitle:document.getElementById('drawerTitle'),
    drawerMeta:document.getElementById('drawerMeta'),
    drawerFiles:document.getElementById('drawerFiles'),
    drawerSource:document.getElementById('drawerSource'),
    closeDrawer:document.getElementById('closeDrawer')
  };

  let mode='simulation';
  let playing=false;
  let lastFrame=performance.now();
  let selectedEvent=null;

  const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
  const pct=()=>Number(e.slider.value)/Number(e.slider.max);
  const dateAt=(start,span,p)=>new Date(start.getTime()+span*clamp(p));
  const sourceDateAt=p=>dateAt(sourceStart,sourceSpan,p);
  const simDateAt=p=>dateAt(simStart,simSpan,p);
  const pForSourceDate=d=>clamp((d-sourceStart)/sourceSpan);
  const fmtDate=d=>new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase();
  const fmtTileDate=d=>new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short'}).format(d).toUpperCase();
  const activePhase=p=>p<.15?'SURVEY':p<.35?'DESIGN + BIM':p<.55?'PROCUREMENT':p<.85?'CONSTRUCTION':'TESTING + HANDOVER';
  const eventsUpTo=p=>{
    const cutoff=sourceDateAt(p);
    return records.filter(r=>new Date(r.date+'T23:59:59Z')<=cutoff);
  };
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function setTimelineOpen(open){
    e.shell.classList.toggle('timeline-open',open);
    e.timeline.setAttribute('aria-hidden',String(!open));
    e.timeTile.setAttribute('aria-expanded',String(open));
    e.timeTile.classList.toggle('active',open);
  }

  function notifyNexus(p,visible){
    try{
      e.frame.contentWindow.postMessage({
        type:'NEXUS_PROJECT_TIME_CHANGE',
        worldId:'esafe-catania-demo',
        mode,
        progress:p,
        sourceDate:sourceDateAt(p).toISOString(),
        simulationDate:simDateAt(p).toISOString(),
        visibleRecordIds:visible.map(r=>r.id),
        phase:activePhase(p)
      },window.location.origin);
    }catch(_){ }
  }

  function render(){
    const p=pct();
    const visible=eventsUpTo(p);
    const latest=visible.length?visible[visible.length-1]:null;
    const phase=activePhase(p);
    const displayDate=mode==='simulation'?simDateAt(p):sourceDateAt(p);

    e.progress.style.width=`${p*100}%`;
    e.projectClock.textContent=fmtDate(displayDate);
    e.timeTileValue.textContent=fmtTileDate(displayDate);
    e.sourceTileValue.textContent=`${visible.length} DOCS`;

    e.sourceClock.textContent=mode==='simulation'
      ?`Source chronology: ${fmtDate(sourceDateAt(p))} · ${compression.toFixed(1)}× compressed`
      :mode==='replay'
        ?`Source chronology replay · ${fmtDate(sourceDateAt(p))}`
        :`Source record time · ${fmtDate(sourceDateAt(p))}`;

    e.visibleDocs.textContent=visible.length;
    e.visibleFiles.textContent=visible.reduce((n,r)=>n+r.files.length,0);
    e.currentPhase.textContent=phase;

    [...e.phaseStrip.children].forEach((el,i)=>{
      const starts=[0,.15,.35,.55,.85];
      const ends=[.15,.35,.55,.85,1];
      el.classList.toggle('active',p>=starts[i]&&p<=(ends[i]+(i===4?.001:0)));
    });

    if(latest){
      e.latestEventTitle.textContent=latest.title;
      e.latestEventDetail.textContent=`${fmtDate(new Date(latest.date+'T00:00:00Z'))} · ${latest.files.length} file${latest.files.length===1?'':'s'} · ${latest.category}${latest.core?' · CORE PILOT':''}`;
      selectedEvent=latest;
    }else{
      e.latestEventTitle.textContent='Project world not started';
      e.latestEventDetail.textContent='Move the scrubber right to reveal source records';
      selectedEvent=null;
    }

    notifyNexus(p,visible);
  }

  function renderMarkers(){
    const f=document.createDocumentFragment();
    records.forEach(r=>{
      const m=document.createElement('span');
      m.className='event-marker'+(r.core?' core':'');
      m.style.left=`${pForSourceDate(new Date(r.date+'T00:00:00Z'))*100}%`;
      m.title=`${r.date} · ${r.title}`;
      f.appendChild(m);
    });
    e.eventMarkers.replaceChildren(f);
  }

  function openDrawer(r){
    if(!r)return;
    selectedEvent=r;
    if(window.matchMedia('(max-width:760px)').matches)setTimelineOpen(false);
    const sd=simDateAt(pForSourceDate(new Date(r.date+'T00:00:00Z')));
    const meta=[
      ['Source date',fmtDate(new Date(r.date+'T00:00:00Z'))],
      ['Simulation date',fmtDate(sd)],
      ['Category',r.category],
      ['Record ID',r.id],
      ['Licence','CC BY 4.0'],
      ['Role',r.core?'CORE REAL PILOT RECORD':'SUPPORTING SOURCE RECORD']
    ];
    e.drawerMeta.innerHTML=meta.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
    e.drawerTitle.textContent=r.title;
    e.drawerFiles.innerHTML=r.files.map((_,i)=>`<div class="file-chip">Source file ${i+1}</div>`).join('');
    e.drawerSource.href=r.url;
    e.drawer.classList.add('open');
    e.drawer.setAttribute('aria-hidden','false');
  }

  function setMode(next){
    mode=next;
    document.querySelectorAll('.mode-switch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    if(mode==='real')playing=false;
    e.playBtn.textContent=playing?'Ⅱ':'▶';
    e.playBtn.classList.toggle('playing',playing);
    render();
  }

  function jumpLive(){
    const now=new Date();
    const p=clamp((now-simStart)/simSpan);
    e.slider.value=Math.round(p*Number(e.slider.max));
    mode='simulation';
    document.querySelectorAll('.mode-switch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    render();
  }

  function tick(now){
    const dt=(now-lastFrame)/1000;
    lastFrame=now;
    if(playing){
      const speed=Number(e.speed.value)||1;
      const simDays=simSpan/MS_DAY;
      const delta=(dt*speed)/simDays;
      let next=pct()+delta;
      if(next>=1){
        next=1;
        playing=false;
        e.playBtn.textContent='▶';
        e.playBtn.classList.remove('playing');
      }
      e.slider.value=Math.round(next*Number(e.slider.max));
      render();
    }
    requestAnimationFrame(tick);
  }

  e.slider.addEventListener('input',render);
  document.querySelectorAll('.mode-switch button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  e.playBtn.addEventListener('click',()=>{
    if(mode==='real')mode='replay';
    playing=!playing;
    e.playBtn.textContent=playing?'Ⅱ':'▶';
    e.playBtn.classList.toggle('playing',playing);
    document.querySelectorAll('.mode-switch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    render();
  });
  e.liveBtn.addEventListener('click',jumpLive);
  e.timeTile.addEventListener('click',()=>setTimelineOpen(!e.shell.classList.contains('timeline-open')));
  e.closeTimeline.addEventListener('click',()=>setTimelineOpen(false));
  e.nexusTile.addEventListener('click',()=>{window.location.href='/apps/nexus-graph-preview/relationship-tree/'});
  e.sourcesTile.addEventListener('click',()=>openDrawer(selectedEvent));
  e.eventCard.addEventListener('click',()=>openDrawer(selectedEvent));
  e.closeDrawer.addEventListener('click',()=>{
    e.drawer.classList.remove('open');
    e.drawer.setAttribute('aria-hidden','true');
  });

  e.rangeStart.textContent=`SOURCE ${fmtDate(sourceStart)}`;
  e.rangeEnd.textContent=`SOURCE ${fmtDate(sourceEnd)}`;
  e.compressionLabel.textContent=`3-MONTH DEMO WORLD · ${compression.toFixed(1)}× TIME COMPRESSION`;

  setTimelineOpen(false);
  renderMarkers();
  render();
  requestAnimationFrame(tick);
})();
