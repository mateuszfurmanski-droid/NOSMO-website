// NEXUS_PROJECT_TIME_OVERLAY_INLINE_HEADING_20260817
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
    if($('nexusPTimeInlineHardStyle'))return;
    const style=document.createElement('style');
    style.id='nexusPTimeInlineHardStyle';
    style.textContent=`
      #nexusProjectTimeOverlay .nexus-ptime-heading{min-width:0;display:grid;gap:2px!important}
      #nexusProjectTimeOverlay .nexus-ptime-heading-row{display:flex!important;align-items:baseline!important;gap:8px!important;min-width:0!important;white-space:nowrap!important;overflow:hidden!important}
      #nexusProjectTimeOverlay .nexus-ptime-eyebrow{font-size:7px!important;letter-spacing:.16em!important;color:#7fd0ff!important;font-weight:900!important;text-transform:uppercase!important;line-height:1!important;white-space:nowrap!important;flex:0 0 auto!important}
      #nexusProjectTimeOverlay .nexus-ptime-clock{font-size:7px!important;letter-spacing:.16em!important;color:#eef6ff!important;font-weight:900!important;text-transform:uppercase!important;line-height:1!important;margin:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;flex:0 1 auto!important}
      #nexusProjectTimeOverlay .nexus-ptime-source{font-size:8px!important;line-height:1.1!important;margin-top:2px!important;-webkit-line-clamp:1!important}
      .nexus-ptime-event{cursor:pointer;position:relative;padding-right:18px!important;user-select:none;-webkit-tap-highlight-color:transparent}
      .nexus-ptime-event::after{content:'▾';position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:10px;color:#7fd0ff;opacity:.85;transition:transform .15s ease}
      #nexusProjectTimeOverlay.events-open{max-height:min(48dvh,390px)!important}
      #nexusProjectTimeOverlay.events-open .nexus-ptime-event::after{transform:translateY(-50%) rotate(180deg)}
      .nexus-ptime-event-list{display:none;border:1px solid rgba(54,163,255,.22);border-radius:10px;background:rgba(3,12,23,.44);max-height:104px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:3px;gap:2px;scrollbar-width:thin;scrollbar-color:rgba(127,208,255,.6) rgba(255,255,255,.06)}
      #nexusProjectTimeOverlay.events-open .nexus-ptime-event-list{display:grid}
      .nexus-ptime-event-row{width:100%;border:1px solid rgba(151,193,232,.13);background:linear-gradient(180deg,rgba(20,34,52,.62),rgba(8,18,31,.68));color:#dceeff;border-radius:6px;display:grid;grid-template-columns:52px minmax(0,1fr) 30px;align-items:center;gap:5px;min-height:25px;padding:3px 5px;text-align:left;font-family:Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
      .nexus-ptime-event-row span{font-size:6.5px;line-height:1.05;color:#7fd0ff;font-weight:900;text-transform:uppercase}
      .nexus-ptime-event-row strong{font-size:7.5px;line-height:1.1;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .nexus-ptime-event-row small{font-size:6px;color:#a8bbcf;text-align:right;font-weight:900;letter-spacing:.08em}
      .nexus-ptime-event-row.active{border-color:rgba(111,231,255,.72);background:linear-gradient(180deg,rgba(22,58,88,.86),rgba(13,39,64,.92));box-shadow:inset 0 0 0 1px rgba(54,163,255,.18),0 0 10px rgba(54,163,255,.12)}
      @media(max-width:380px){#nexusProjectTimeOverlay .nexus-ptime-heading-row{gap:6px!important}#nexusProjectTimeOverlay .nexus-ptime-eyebrow,#nexusProjectTimeOverlay .nexus-ptime-clock{font-size:6.3px!important}.nexus-ptime-event-list{max-height:86px}.nexus-ptime-event-row{grid-template-columns:48px minmax(0,1fr) 28px;gap:4px;min-height:22px;padding:3px 4px}.nexus-ptime-event-row span{font-size:6px}.nexus-ptime-event-row strong{font-size:7px}.nexus-ptime-event-row small{font-size:5.6px}}
    `;
    document.head.appendChild(style);
  }

  function stopPlayback(){
    playing=false;
    const play=$('nexusPTimePlay');
    if(play){play.textContent='▶';play.classList.remove('playing')}
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
          <div class="nexus-ptime-source" id="nexusPTimeSource">Source chronology: 22 NOV 2024 · 19.0× compressed</div>
        </div>
        <div class="nexus-ptime-playback"><button class="nexus-ptime-play" id="nexusPTimePlay" type="button">▶</button><select class="nexus-ptime-select" id="nexusPTimeSpeed"><option value="0.25">0.25×</option><option value="1" selected>1×</option><option value="5">5×</option><option value="20">20×</option><option value="100">100×</option></select></div>
      </div>
      <div class="nexus-ptime-mode-switch"><button type="button" data-ptime="real">REAL</button><button type="button" data-ptime="replay">REPLAY</button><button type="button" data-ptime="simulation" class="active">SIMULATION</button></div>
      <div class="nexus-ptime-phase-strip" id="nexusPTimePhaseStrip"><span>SURVEY</span><span>DESIGN + BIM</span><span>PROCUREMENT</span><span>CONSTRUCTION</span><span>TESTING + HANDOVER</span></div>
      <div><div class="nexus-ptime-rail-meta"><span>SOURCE 22 NOV 2024</span><span>3-MONTH DEMO WORLD · 19.0× TIME COMPRESSION</span><span>SOURCE 21 MAR 2026</span></div><div class="nexus-ptime-rail"><div class="nexus-ptime-progress" id="nexusPTimeProgress"></div><div class="nexus-ptime-markers" id="nexusPTimeMarkers"></div><input class="nexus-ptime-slider" id="nexusPTimeSlider" type="range" min="0" max="10000" value="7200" step="1" /></div></div>
      <div class="nexus-ptime-bottom"><div class="nexus-ptime-metric"><strong id="nexusPTimeDocs">0</strong><span>documents available</span></div><div class="nexus-ptime-metric"><strong id="nexusPTimeFiles">0</strong><span>files available</span></div><div class="nexus-ptime-metric"><strong id="nexusPTimePhase">—</strong><span>project phase</span></div><div class="nexus-ptime-event" id="nexusPTimeEvent" role="button" tabindex="0" aria-expanded="false"><small>LATEST EVENT</small><strong id="nexusPTimeEventTitle">Move the timeline to explore the project</strong><span id="nexusPTimeEventDetail">8 source records loaded</span></div></div>
      <div class="nexus-ptime-event-list" id="nexusPTimeEventList" aria-hidden="true"></div>`;
    document.body.appendChild(root);
    bind();
    return root;
  }

  function renderMarkers(){
    const m=$('nexusPTimeMarkers');
    if(!m)return;
    const f=document.createDocumentFragment();
    records.forEach(r=>{const s=document.createElement('span');s.className='nexus-ptime-marker'+(r.core?' core':'');s.style.left=(pctFor(r.date)*100)+'%';f.appendChild(s)});
    m.replaceChildren(f);
  }

  function buildEventList(){
    const list=$('nexusPTimeEventList');
    if(!list||list.dataset.ready==='true')return;
    const sorted=records.slice().sort((a,b)=>new Date(b.date+'T00:00:00Z')-new Date(a.date+'T00:00:00Z'));
    list.innerHTML=sorted.map(r=>`<button class="nexus-ptime-event-row" type="button" data-date="${esc(r.date)}" data-id="${esc(r.id)}"><span>${fmt(new Date(r.date+'T00:00:00Z'))}</span><strong>${esc(r.title)}</strong><small>${r.core?'CORE':'SRC'}</small></button>`).join('');
    list.addEventListener('click',event=>{const row=event.target.closest('.nexus-ptime-event-row');if(!row)return;stopPlayback();const slider=$('nexusPTimeSlider');if(slider)slider.value=String(Math.round(pctFor(row.dataset.date)*10000));render();row.scrollIntoView({block:'nearest'})});
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
    const v=visible(p),latest=v[v.length-1],ph=phase(p);
    const shownDate=mode==='simulation'?fmt(simAt(p)):fmt(srcAt(p));
    if($('nexusPTimeProgress'))$('nexusPTimeProgress').style.width=(p*100)+'%';
    if($('nexusPTimeClock'))$('nexusPTimeClock').textContent=shownDate;
    if($('nexusPTimeSource'))$('nexusPTimeSource').textContent=mode==='simulation'?`Source chronology: ${fmt(srcAt(p))} · ${compression.toFixed(1)}× compressed`:`Source chronology replay · ${fmt(srcAt(p))}`;
    if($('nexusPTimeDocs'))$('nexusPTimeDocs').textContent=String(v.length);
    if($('nexusPTimeFiles'))$('nexusPTimeFiles').textContent=String(v.reduce((n,r)=>n+r.files.length,0));
    if($('nexusPTimePhase'))$('nexusPTimePhase').textContent=ph;
    const starts=[0,.15,.35,.55,.85],ends=[.15,.35,.55,.85,1];
    [...($('nexusPTimePhaseStrip')?.children||[])].forEach((el,i)=>el.classList.toggle('active',p>=starts[i]&&p<=ends[i]+(i===4?0.001:0)));
    if(latest){$('nexusPTimeEventTitle').textContent=latest.title;$('nexusPTimeEventDetail').textContent=fmt(new Date(latest.date+'T00:00:00Z'))+' · '+latest.files.length+' file · source record'}
    syncEventList(latest);
    window.__NEXUS_PROJECT_TIME__={mode,progress:p,source:'project-time-overlay-exact'};
  }

  function bind(){
    renderMarkers();
    buildEventList();
    render();
    $('nexusPTimeSlider')?.addEventListener('input',()=>{stopPlayback();render()});
    document.querySelectorAll('[data-ptime]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.ptime;document.querySelectorAll('[data-ptime]').forEach(x=>x.classList.toggle('active',x===button));render()}));
    $('nexusPTimePlay')?.addEventListener('click',()=>{playing=!playing;$('nexusPTimePlay').textContent=playing?'Ⅱ':'▶';$('nexusPTimePlay').classList.toggle('playing',playing)});
    $('nexusPTimeEvent')?.addEventListener('click',()=>setEventListOpen(!$('nexusProjectTimeOverlay')?.classList.contains('events-open')));
    $('nexusPTimeEvent')?.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setEventListOpen(!$('nexusProjectTimeOverlay')?.classList.contains('events-open'))}});
  }

  function tick(t){
    const slider=$('nexusPTimeSlider');
    if(playing&&slider){
      const dt=(t-last)/1000,spd=Number($('nexusPTimeSpeed')?.value||1);
      let next=Number(slider.value)+(dt*spd*110);
      if(next>=10000){next=10000;stopPlayback()}
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
      const p=panel();
      p.classList.toggle('open');
      p.setAttribute('aria-hidden',p.classList.contains('open')?'false':'true');
      if(!p.classList.contains('open'))setEventListOpen(false);
      const sub=$('nexusTopTimeSub');
      if(sub)sub.textContent=p.classList.contains('open')?'100%':'OFF';
      render();
    },true);
    requestAnimationFrame(tick);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
})();