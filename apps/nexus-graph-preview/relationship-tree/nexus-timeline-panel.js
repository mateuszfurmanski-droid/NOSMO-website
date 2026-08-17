// NEXUS_PROJECT_TIME_CLEAN_TICKER_STRIP_20260817
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

  const $=id=>document.getElementById(id);
  const clamp=v=>Math.max(0,Math.min(1,v));
  const start=new Date('2024-11-22T00:00:00Z');
  const end=new Date('2026-03-21T00:00:00Z');
  const simStart=new Date('2026-06-01T00:00:00Z');
  const simEnd=new Date('2026-08-31T00:00:00Z');
  const span=end-start;
  const simSpan=simEnd-simStart;
  const compression=span/simSpan;
  let mode='simulation', playing=false, direction=1, recording=false, screenRecording=false, last=performance.now();
  const at=(a,b,p)=>new Date(a.getTime()+b*clamp(p));
  const srcAt=p=>at(start,span,p);
  const simAt=p=>at(simStart,simSpan,p);
  const pctFor=d=>clamp((new Date(d+'T00:00:00Z')-start)/span);
  const fmt=d=>new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase();
  const phase=p=>p<.15?'SURVEY':p<.35?'DESIGN + BIM':p<.55?'PROCUREMENT':p<.85?'CONSTRUCTION':'TESTING + HANDOVER';
  const visible=p=>records.filter(r=>new Date(r.date+'T23:59:59Z')<=srcAt(p));
  const esc=v=>String(v||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function injectStyle(){
    if($('nexusPTimeCleanTickerStyle'))return;
    const style=document.createElement('style');
    style.id='nexusPTimeCleanTickerStyle';
    style.textContent=`
      .nexus-time-panel{display:none!important}
      #nexusProjectTimeOverlay{position:fixed;left:8px;width:calc(100vw - 16px);max-width:calc(100vw - 16px);bottom:calc(var(--nexus-bottom-clear,112px) + env(safe-area-inset-bottom,0px) - 4px);z-index:2147483100;border:1px solid rgba(126,181,235,.26);border-radius:18px;background:linear-gradient(180deg,rgba(9,22,38,.985),rgba(4,12,23,.985));color:#eef6ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 18px 46px rgba(0,0,0,.42);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);padding:7px 8px 6px;display:flex;flex-direction:column;gap:3px;opacity:0;transform:translateY(18px) scale(.985);pointer-events:none;transition:opacity .18s ease,transform .22s ease;max-height:min(31dvh,248px);overflow:hidden;box-sizing:border-box;contain:layout paint}
      #nexusProjectTimeOverlay *{box-sizing:border-box;min-width:0;max-width:100%}
      #nexusProjectTimeOverlay.open{opacity:1;transform:none;pointer-events:auto}
      .nexus-ptime-top{display:grid;grid-template-columns:1fr;gap:3px;width:100%}.nexus-ptime-heading{display:none!important}.nexus-ptime-source{display:none!important}
      .nexus-ptime-ticker{position:relative;height:18px;width:100%;border:1px solid rgba(151,193,232,.2);border-radius:5px;background:linear-gradient(180deg,rgba(3,10,19,.78),rgba(13,24,39,.74));overflow:hidden;display:flex;align-items:center;white-space:nowrap;box-shadow:inset 0 0 0 1px rgba(0,0,0,.28);mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%)}
      .nexus-ptime-ticker-track{display:inline-flex;align-items:center;gap:14px;min-width:max-content;padding-left:100%;font-size:6.7px;line-height:1;font-weight:900;letter-spacing:.105em;text-transform:uppercase;animation:nexusPTimeTicker 22s linear infinite;will-change:transform}
      .nexus-ptime-ticker-track b{color:#7fd0ff;font-weight:950}.nexus-ptime-ticker-track strong{color:#eef6ff;font-weight:950}.nexus-ptime-ticker-track em{color:#ffd166;font-style:normal;font-weight:950}.nexus-ptime-ticker-track span{color:#a8bbcf}.nexus-ptime-ticker-track i{width:3px;height:3px;border-radius:50%;background:#69d8ff;box-shadow:0 0 5px rgba(105,216,255,.75);display:inline-block}
      @keyframes nexusPTimeTicker{from{transform:translateX(0)}to{transform:translateX(calc(-100% - 24px))}}
      .nexus-ptime-transport{display:grid;grid-template-columns:repeat(6,1fr) 52px;gap:3px;width:100%;height:26px}.nexus-ptime-playback{display:contents!important}
      .nexus-ptime-transport button,.nexus-ptime-transport select{position:relative;min-width:0!important;height:26px!important;border:1px solid rgba(151,193,232,.22)!important;border-radius:5px!important;background:linear-gradient(180deg,rgba(20,34,52,.74),rgba(7,16,29,.84))!important;color:#dceeff!important;font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;font-size:0!important;font-weight:950!important;line-height:1!important;text-align:center!important;padding:0 2px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important;text-transform:uppercase!important;overflow:hidden!important}
      .nexus-ptime-transport button::before{content:attr(data-icon);position:absolute;inset:0 0 5px 0;display:grid;place-items:center;font-size:11px;font-weight:900;letter-spacing:0;color:#e9f6ff;text-shadow:0 0 8px rgba(127,208,255,.22)}
      .nexus-ptime-transport button::after{content:'';position:absolute;left:50%;bottom:3px;width:12px;height:3px;border-radius:4px;transform:translateX(-50%);background:#56616d;box-shadow:inset 0 0 2px rgba(0,0,0,.7)}
      .nexus-ptime-transport button.led-blue::after{background:#345f7e}.nexus-ptime-transport button.led-orange::after{background:#80652b}.nexus-ptime-transport button.led-green.active::after{background:#61f58a;box-shadow:0 0 8px rgba(97,245,138,.8),inset 0 0 2px rgba(255,255,255,.6)}.nexus-ptime-transport button.led-red.active::after,.nexus-ptime-transport button.recording::after{background:#ff5a67;box-shadow:0 0 8px rgba(255,90,103,.85),inset 0 0 2px rgba(255,255,255,.55)}.nexus-ptime-transport button.led-blue.flash::after{background:#69d8ff;box-shadow:0 0 8px rgba(105,216,255,.7),inset 0 0 2px rgba(255,255,255,.55)}.nexus-ptime-transport button.active{border-color:rgba(111,231,255,.72)!important;background:linear-gradient(180deg,rgba(22,58,88,.95),rgba(13,39,64,.96))!important;color:#fff!important}.nexus-ptime-transport select{font-size:9px!important;color:#eef6ff!important;appearance:auto!important;-webkit-appearance:auto!important}
      .nexus-ptime-mode-switch{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;height:16px!important;border:1px solid rgba(151,193,232,.22);border-radius:5px!important;padding:1px!important;background:linear-gradient(180deg,rgba(2,9,18,.72),rgba(13,25,42,.72));gap:2px!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.22)}
      .nexus-ptime-mode-switch button{position:relative!important;height:12px!important;min-height:12px!important;border:1px solid rgba(151,193,232,.16)!important;background:linear-gradient(180deg,rgba(20,34,52,.72),rgba(9,18,32,.78))!important;color:#a9bacd!important;padding:0 2px 0 11px!important;border-radius:2px!important;font-size:6px!important;font-weight:900!important;letter-spacing:.052em!important;line-height:12px!important;cursor:pointer;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
      .nexus-ptime-mode-switch button::before{content:'';position:absolute;left:3px;top:50%;width:4px;height:4px;border-radius:1px;transform:translateY(-50%);background:#56616d;border:1px solid rgba(133,166,200,.22)}.nexus-ptime-mode-switch button.active[data-ptime='real']::before{background:#61f58a;box-shadow:0 0 7px rgba(97,245,138,.7)}.nexus-ptime-mode-switch button.active[data-ptime='replay']::before{background:#69d8ff;box-shadow:0 0 7px rgba(105,216,255,.7)}.nexus-ptime-mode-switch button.active[data-ptime='simulation']::before{background:#ffd166;box-shadow:0 0 7px rgba(255,209,102,.75)}.nexus-ptime-mode-switch button.active{background:linear-gradient(180deg,rgba(22,58,88,.9),rgba(13,39,64,.94))!important;color:#e5f4ff!important;border-color:rgba(54,163,255,.44)!important;box-shadow:inset 0 0 0 1px rgba(54,163,255,.18),0 0 9px rgba(54,163,255,.1)!important}
      .nexus-ptime-phase-strip{display:grid;grid-template-columns:15fr 20fr 20fr 30fr 15fr;width:100%;height:14px!important;border-radius:5px;overflow:hidden;border:1px solid rgba(151,193,232,.2);background:rgba(255,255,255,.025)}.nexus-ptime-phase-strip span{display:grid;place-items:center;font-size:5px!important;font-weight:900;color:#7890aa;border-right:1px solid rgba(151,193,232,.2);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nexus-ptime-phase-strip span.active{background:rgba(54,163,255,.2);color:#e5f4ff}
      .nexus-ptime-rail-meta{display:grid;grid-template-columns:1fr auto 1fr;align-items:start;color:#a8bbcf;font-size:6.1px!important;line-height:1;margin:0;gap:3px;text-transform:uppercase}.nexus-ptime-rail-meta span{overflow:hidden;text-overflow:ellipsis}.nexus-ptime-rail-meta span:nth-child(2){text-align:center}.nexus-ptime-rail-meta span:nth-child(3){text-align:right}.nexus-ptime-rail{height:20px;position:relative;width:100%;overflow:hidden}.nexus-ptime-rail:before{content:'';position:absolute;left:0;right:0;top:9px;height:3px;border-radius:999px;background:rgba(255,255,255,.13)}.nexus-ptime-progress{position:absolute;left:0;top:9px;height:3px;border-radius:999px;background:linear-gradient(90deg,#168af0,#67c4ff);width:0;pointer-events:none}.nexus-ptime-markers{position:absolute;left:0;right:0;top:0;height:20px;pointer-events:none}.nexus-ptime-marker{position:absolute;top:5px;width:2px;height:10px;border-radius:3px;background:rgba(166,200,232,.34);transform:translateX(-1px)}.nexus-ptime-marker.core{top:1px;height:18px;width:4px;background:#ffd166;box-shadow:0 0 12px rgba(255,209,102,.54)}.nexus-ptime-slider{position:absolute;left:0;right:0;top:0;width:100%;height:20px;margin:0;background:transparent;appearance:none;-webkit-appearance:none;cursor:ew-resize}.nexus-ptime-slider::-webkit-slider-runnable-track{height:3px;background:transparent}.nexus-ptime-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#e9f6ff;border:4px solid #36a3ff;margin-top:-8px;box-shadow:0 4px 12px rgba(0,0,0,.42),0 0 0 3px rgba(54,163,255,.16)}
      .nexus-ptime-bottom{display:grid!important;grid-template-columns:1fr;gap:3px;min-height:0;width:100%}.nexus-ptime-status-strip{display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:2px;height:19px;align-items:center;border:1px solid rgba(151,193,232,.18);border-radius:6px;background:rgba(255,255,255,.025);overflow:hidden}.nexus-ptime-status-item{position:relative;display:flex;align-items:center;gap:4px;height:100%;padding:0 5px 0 12px;border-right:1px solid rgba(151,193,232,.13);font-size:6.5px;color:#a8bbcf;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nexus-ptime-status-item:last-child{border-right:0}.nexus-ptime-status-item::before{content:'';position:absolute;left:4px;width:4px;height:4px;border-radius:1px;background:#69d8ff;box-shadow:0 0 6px rgba(105,216,255,.68)}.nexus-ptime-status-item strong{font-size:9px;color:#eef6ff;font-weight:950;line-height:1;white-space:nowrap}.nexus-ptime-status-item span{overflow:hidden;text-overflow:ellipsis}.nexus-ptime-metric{display:none!important}
      .nexus-ptime-event{grid-column:auto;text-align:left;padding:4px 18px 4px 7px;display:grid;gap:1px;min-height:29px;background:rgba(54,163,255,.075);border:1px solid rgba(54,163,255,.24);border-radius:9px;cursor:pointer;position:relative;user-select:none}.nexus-ptime-event::after{content:'▾';position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:10px;color:#7fd0ff}.nexus-ptime-event small{font-size:6px;font-weight:900;letter-spacing:.14em;color:#7fd0ff}.nexus-ptime-event strong{font-size:8.5px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nexus-ptime-event span{font-size:6.6px;color:#a8bbcf;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#nexusProjectTimeOverlay.events-open{max-height:min(48dvh,390px)!important}.nexus-ptime-event-list{display:none;border:1px solid rgba(54,163,255,.22);border-radius:10px;background:rgba(3,12,23,.44);max-height:104px;overflow-y:auto;padding:3px;gap:2px}.events-open .nexus-ptime-event-list{display:grid}.events-open .nexus-ptime-event::after{transform:translateY(-50%) rotate(180deg)}.nexus-ptime-event-row{width:100%;border:1px solid rgba(151,193,232,.13);background:linear-gradient(180deg,rgba(20,34,52,.62),rgba(8,18,31,.68));color:#dceeff;border-radius:6px;display:grid;grid-template-columns:52px minmax(0,1fr) 30px;align-items:center;gap:5px;min-height:25px;padding:3px 5px;text-align:left;font-family:Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}.nexus-ptime-event-row span{font-size:6.5px;color:#7fd0ff;font-weight:900;text-transform:uppercase}.nexus-ptime-event-row strong{font-size:7.5px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nexus-ptime-event-row small{font-size:6px;color:#a8bbcf;text-align:right;font-weight:900}.nexus-ptime-event-row.active{border-color:rgba(111,231,255,.72);background:linear-gradient(180deg,rgba(22,58,88,.86),rgba(13,39,64,.92));box-shadow:inset 0 0 0 1px rgba(54,163,255,.18),0 0 10px rgba(54,163,255,.12)}
      @media(max-width:380px){#nexusProjectTimeOverlay{max-height:min(31dvh,242px);padding:6px 7px}.nexus-ptime-ticker{height:17px}.nexus-ptime-ticker-track{font-size:6px;gap:11px;animation-duration:20s}.nexus-ptime-transport{height:22px;gap:2px;grid-template-columns:repeat(6,1fr) 48px}.nexus-ptime-transport button,.nexus-ptime-transport select{height:22px!important}.nexus-ptime-transport button::before{font-size:10px}.nexus-ptime-mode-switch{height:15px!important}.nexus-ptime-mode-switch button{height:11px!important;line-height:11px!important;font-size:5.6px!important}.nexus-ptime-status-strip{height:17px}.nexus-ptime-status-item{font-size:5.8px}.nexus-ptime-status-item strong{font-size:8px}.nexus-ptime-event{min-height:27px}.nexus-ptime-event-list{max-height:86px}}
    `;
    document.head.appendChild(style);
  }

  function stopPlayback(){playing=false;const play=$('nexusPTimePlay');if(play){play.classList.remove('active');play.setAttribute('aria-pressed','false')}}
  function flash(button){if(!button)return;button.classList.add('flash');setTimeout(()=>button.classList.remove('flash'),180)}
  function setSliderValue(value){const slider=$('nexusPTimeSlider');if(!slider)return;slider.value=String(Math.round(clamp(value/10000)*10000));render()}
  function step(delta){const slider=$('nexusPTimeSlider');if(!slider)return;stopPlayback();setSliderValue(Number(slider.value)+delta)}

  function panel(){
    let p=$('nexusProjectTimeOverlay');if(p)return p;
    injectStyle();
    const root=document.createElement('aside');
    root.id='nexusProjectTimeOverlay';
    root.setAttribute('aria-label','Project Time Engine');root.setAttribute('aria-hidden','true');
    root.innerHTML=`
      <div class="nexus-ptime-top">
        <div class="nexus-ptime-ticker"><div class="nexus-ptime-ticker-track" id="nexusPTimeTicker"><b>PROJECT TIME</b><strong>05 AUG 2026</strong><i></i><span>SOURCE 05 NOV 2025</span><em>5.3× COMPRESSED</em><span>CONSTRUCTION</span><span>4 DOCS · 4 FILES</span></div></div>
        <div class="nexus-ptime-transport">
          <button class="led-green" id="nexusPTimePlay" type="button" data-icon="▶" aria-label="Play" aria-pressed="false"></button>
          <button class="led-blue" id="nexusPTimeRev" type="button" data-icon="◀◀" aria-label="Reverse"></button>
          <button class="led-blue" id="nexusPTimeFfd" type="button" data-icon="▶▶" aria-label="Fast forward"></button>
          <button class="led-blue" id="nexusPTimeRwd" type="button" data-icon="◀" aria-label="Rewind"></button>
          <button class="led-red" id="nexusPTimeRec" type="button" data-icon="●" aria-label="Record" aria-pressed="false"></button>
          <button class="led-red" id="nexusPTimeScreen" type="button" data-icon="▣" aria-label="Record screen" aria-pressed="false"></button>
          <select id="nexusPTimeSpeed" aria-label="Playback speed"><option value="0.25">0.25×</option><option value="1" selected>1×</option><option value="5">5×</option><option value="20">20×</option><option value="100">100×</option></select>
        </div>
      </div>
      <div class="nexus-ptime-mode-switch"><button type="button" data-ptime="real">REAL</button><button type="button" data-ptime="replay">REPLAY</button><button type="button" data-ptime="simulation" class="active">SIMULATION</button></div>
      <div class="nexus-ptime-phase-strip" id="nexusPTimePhaseStrip"><span>SURVEY</span><span>DESIGN + BIM</span><span>PROCUREMENT</span><span>CONSTRUCTION</span><span>TESTING + HANDOVER</span></div>
      <div><div class="nexus-ptime-rail-meta"><span>SOURCE 22 NOV 2024</span><span>3-MONTH DEMO WORLD · 19.0× TIME COMPRESSION</span><span>SOURCE 21 MAR 2026</span></div><div class="nexus-ptime-rail"><div class="nexus-ptime-progress" id="nexusPTimeProgress"></div><div class="nexus-ptime-markers" id="nexusPTimeMarkers"></div><input class="nexus-ptime-slider" id="nexusPTimeSlider" type="range" min="0" max="10000" value="7200" step="1" /></div></div>
      <div class="nexus-ptime-bottom"><div class="nexus-ptime-status-strip"><div class="nexus-ptime-status-item"><strong id="nexusPTimeDocs">0</strong><span>docs</span></div><div class="nexus-ptime-status-item"><strong id="nexusPTimeFiles">0</strong><span>files</span></div><div class="nexus-ptime-status-item"><strong id="nexusPTimePhase">—</strong><span>phase</span></div></div><div class="nexus-ptime-event" id="nexusPTimeEvent" role="button" tabindex="0" aria-expanded="false"><small>LATEST EVENT</small><strong id="nexusPTimeEventTitle">Move the timeline to explore the project</strong><span id="nexusPTimeEventDetail">8 source records loaded</span></div></div>
      <div class="nexus-ptime-event-list" id="nexusPTimeEventList" aria-hidden="true"></div>`;
    document.body.appendChild(root);bind();return root;
  }

  function renderMarkers(){const m=$('nexusPTimeMarkers');if(!m)return;const f=document.createDocumentFragment();records.forEach(r=>{const s=document.createElement('span');s.className='nexus-ptime-marker'+(r.core?' core':'');s.style.left=(pctFor(r.date)*100)+'%';f.appendChild(s)});m.replaceChildren(f)}
  function buildEventList(){const list=$('nexusPTimeEventList');if(!list||list.dataset.ready==='true')return;const sorted=records.slice().sort((a,b)=>new Date(b.date+'T00:00:00Z')-new Date(a.date+'T00:00:00Z'));list.innerHTML=sorted.map(r=>`<button class="nexus-ptime-event-row" type="button" data-date="${esc(r.date)}" data-id="${esc(r.id)}"><span>${fmt(new Date(r.date+'T00:00:00Z'))}</span><strong>${esc(r.title)}</strong><small>${r.core?'CORE':'SRC'}</small></button>`).join('');list.addEventListener('click',e=>{const row=e.target.closest('.nexus-ptime-event-row');if(!row)return;stopPlayback();const slider=$('nexusPTimeSlider');if(slider)slider.value=String(Math.round(pctFor(row.dataset.date)*10000));render();row.scrollIntoView({block:'nearest'})});list.dataset.ready='true'}
  function setEventListOpen(open){const root=$('nexusProjectTimeOverlay'),eventBox=$('nexusPTimeEvent'),list=$('nexusPTimeEventList');if(!root||!eventBox||!list)return;buildEventList();root.classList.toggle('events-open',open);eventBox.setAttribute('aria-expanded',open?'true':'false');list.setAttribute('aria-hidden',open?'false':'true')}
  function syncEventList(latest){const list=$('nexusPTimeEventList');if(!list||list.dataset.ready!=='true')return;list.querySelectorAll('.nexus-ptime-event-row').forEach(row=>row.classList.toggle('active',Boolean(latest&&row.dataset.id===latest.id)))}

  function render(){
    const slider=$('nexusPTimeSlider');const p=slider?Number(slider.value)/10000:.72;const v=visible(p),latest=v[v.length-1],ph=phase(p);const shownDate=mode==='simulation'?fmt(simAt(p)):fmt(srcAt(p));const src=fmt(srcAt(p));
    if($('nexusPTimeProgress'))$('nexusPTimeProgress').style.width=(p*100)+'%';
    if($('nexusPTimeTicker'))$('nexusPTimeTicker').innerHTML=`<b>PROJECT TIME</b><strong>${shownDate}</strong><i></i><span>SOURCE ${src}</span><em>${compression.toFixed(1)}× COMPRESSED</em><span>${ph}</span><span>${v.length} DOCS · ${v.reduce((n,r)=>n+r.files.length,0)} FILES</span>`;
    if($('nexusPTimeDocs'))$('nexusPTimeDocs').textContent=String(v.length);if($('nexusPTimeFiles'))$('nexusPTimeFiles').textContent=String(v.reduce((n,r)=>n+r.files.length,0));if($('nexusPTimePhase'))$('nexusPTimePhase').textContent=ph;
    const starts=[0,.15,.35,.55,.85],ends=[.15,.35,.55,.85,1];[...($('nexusPTimePhaseStrip')?.children||[])].forEach((el,i)=>el.classList.toggle('active',p>=starts[i]&&p<=ends[i]+(i===4?0.001:0)));
    if(latest){$('nexusPTimeEventTitle').textContent=latest.title;$('nexusPTimeEventDetail').textContent=fmt(new Date(latest.date+'T00:00:00Z'))+' · '+latest.files.length+' file · source record'}
    syncEventList(latest);window.__NEXUS_PROJECT_TIME__={mode,progress:p,source:'project-time-clean-ticker'};
  }

  function bind(){
    renderMarkers();buildEventList();render();
    $('nexusPTimeSlider')?.addEventListener('input',()=>{stopPlayback();render()});
    document.querySelectorAll('[data-ptime]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.ptime;document.querySelectorAll('[data-ptime]').forEach(x=>x.classList.toggle('active',x===button));render()}));
    $('nexusPTimePlay')?.addEventListener('click',()=>{playing=!playing;direction=1;$('nexusPTimePlay').classList.toggle('active',playing);$('nexusPTimePlay').setAttribute('aria-pressed',playing?'true':'false')});
    $('nexusPTimeRev')?.addEventListener('click',e=>{direction=-1;playing=true;$('nexusPTimePlay')?.classList.add('active');flash(e.currentTarget)});
    $('nexusPTimeFfd')?.addEventListener('click',e=>{direction=1;step(650);flash(e.currentTarget)});
    $('nexusPTimeRwd')?.addEventListener('click',e=>{direction=-1;step(-650);flash(e.currentTarget)});
    $('nexusPTimeRec')?.addEventListener('click',e=>{recording=!recording;e.currentTarget.classList.toggle('active',recording);e.currentTarget.setAttribute('aria-pressed',recording?'true':'false')});
    $('nexusPTimeScreen')?.addEventListener('click',e=>{screenRecording=!screenRecording;e.currentTarget.classList.toggle('active',screenRecording);e.currentTarget.setAttribute('aria-pressed',screenRecording?'true':'false')});
    $('nexusPTimeEvent')?.addEventListener('click',()=>setEventListOpen(!$('nexusProjectTimeOverlay')?.classList.contains('events-open')));
    $('nexusPTimeEvent')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setEventListOpen(!$('nexusProjectTimeOverlay')?.classList.contains('events-open'))}});
  }

  function tick(t){const slider=$('nexusPTimeSlider');if(playing&&slider){const dt=(t-last)/1000,spd=Number($('nexusPTimeSpeed')?.value||1);let next=Number(slider.value)+direction*dt*spd*34;if(next>10000)next=0;if(next<0)next=10000;slider.value=String(next);render()}last=t;requestAnimationFrame(tick)}
  function toggle(){const root=panel();const open=!root.classList.contains('open');root.classList.toggle('open',open);root.setAttribute('aria-hidden',open?'false':'true');if(open)render()}
  function hook(){const btn=$('nexusTopTime');if(btn&&btn.dataset.ptimeHook!=='clean'){btn.dataset.ptimeHook='clean';btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();toggle()},true)}}
  document.addEventListener('DOMContentLoaded',()=>{hook();setTimeout(hook,400);panel();requestAnimationFrame(tick)});
  window.addEventListener('load',hook,{once:true});
})();
