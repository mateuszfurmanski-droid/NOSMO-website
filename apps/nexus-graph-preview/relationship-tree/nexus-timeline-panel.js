// NEXUS_TIMELINE_PANEL_V1
(()=>{
  if(document.documentElement.dataset.nexusEmbedded==='true')return;
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const formatDate=value=>new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));
  const PHASES=[
    {label:'SURVEY',end:.15},
    {label:'DESIGN + BIM',end:.35},
    {label:'PROCUREMENT',end:.55},
    {label:'CONSTRUCTION',end:.85},
    {label:'TESTING + HANDOVER',end:1},
  ];

  window.addEventListener('DOMContentLoaded',()=>{
    const timeTile=document.getElementById('nexusTopTime');
    if(!timeTile)return;
    timeTile.setAttribute('aria-label','Open project timeline controls');
    timeTile.setAttribute('aria-expanded','false');

    const panel=document.createElement('section');
    panel.id='nexusTimelinePanel';
    panel.className='nexus-time-panel';
    panel.setAttribute('data-control','true');
    panel.setAttribute('aria-label','Project Timeline controls');
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML=`
      <div class="nexus-time-heading">
        <div><div class="nexus-time-eyebrow">NOSMO NEXUS · PROJECT TIME</div><div class="nexus-time-title" id="nexusTimeProjectTitle">PROJECT TIMELINE</div></div>
        <button class="nexus-time-close" id="nexusTimeClose" type="button" aria-label="Close timeline">×</button>
      </div>
      <div class="nexus-time-top">
        <div><div class="nexus-time-eyebrow">PROJECT TIME</div><div class="nexus-time-clock" id="nexusTimeClock">—</div><div class="nexus-time-clock-sub" id="nexusTimeClockSub">Reading document timeline…</div></div>
        <div class="nexus-time-playback"><button class="nexus-time-play" id="nexusTimePlay" type="button" aria-label="Play timeline">▶</button><select id="nexusTimeSpeed" aria-label="Playback speed"><option value="0.25">0.25×</option><option value="1" selected>1×</option><option value="5">5×</option><option value="20">20×</option><option value="100">100×</option></select><button class="nexus-time-live" id="nexusTimeLive" type="button">LIVE</button></div>
      </div>
      <div class="nexus-time-modes" id="nexusTimeModes" role="group" aria-label="Timeline mode"><button type="button" data-time-mode="real">REAL</button><button type="button" data-time-mode="replay">REPLAY</button><button type="button" data-time-mode="simulation" class="active">SIMULATION</button></div>
      <div class="nexus-time-phases" id="nexusTimePhases">${PHASES.map(phase=>`<span data-end="${phase.end}">${phase.label}</span>`).join('')}</div>
      <div><div class="nexus-time-rail-meta"><span id="nexusTimeStart">—</span><span id="nexusTimeCompression">1× PLAYBACK</span><span id="nexusTimeEnd">—</span></div><div class="nexus-time-rail"><div class="nexus-time-progress" id="nexusTimeProgress"></div><input id="nexusTimeSlider" type="range" min="0" max="10000" value="10000" step="1" aria-label="Project time scrubber" /></div></div>
      <div class="nexus-time-bottom"><div class="nexus-time-metric"><span class="nexus-time-metric-value" id="nexusTimeVisible">0</span><span class="nexus-time-metric-label">documents available</span></div><div class="nexus-time-metric"><span class="nexus-time-metric-value" id="nexusTimeTotal">0</span><span class="nexus-time-metric-label">documents total</span></div><div class="nexus-time-metric"><span class="nexus-time-metric-value" id="nexusTimePhase">—</span><span class="nexus-time-metric-label">project phase</span></div><div class="nexus-time-event"><span class="nexus-time-event-kicker">LATEST DOCUMENT</span><span class="nexus-time-event-title" id="nexusTimeLatest">Move the timeline to explore the project</span><span class="nexus-time-event-detail">Future documents stay visible but dimmed</span></div></div>`;
    document.body.appendChild(panel);

    const projectTitle=document.getElementById('nexusTimeProjectTitle');
    const projectSub=document.querySelector('#nexusTopProject .nexus-top-sub');
    if(projectTitle&&projectSub?.textContent)projectTitle.textContent=`${projectSub.textContent.trim()} · PROJECT TIMELINE`;

    const closeBtn=document.getElementById('nexusTimeClose');
    const playBtn=document.getElementById('nexusTimePlay');
    const speedSelect=document.getElementById('nexusTimeSpeed');
    const liveBtn=document.getElementById('nexusTimeLive');
    const modeHost=document.getElementById('nexusTimeModes');
    const slider=document.getElementById('nexusTimeSlider');
    const progress=document.getElementById('nexusTimeProgress');
    const clock=document.getElementById('nexusTimeClock');
    const clockSub=document.getElementById('nexusTimeClockSub');
    const startLabel=document.getElementById('nexusTimeStart');
    const endLabel=document.getElementById('nexusTimeEnd');
    const compression=document.getElementById('nexusTimeCompression');
    const visibleMetric=document.getElementById('nexusTimeVisible');
    const totalMetric=document.getElementById('nexusTimeTotal');
    const phaseMetric=document.getElementById('nexusTimePhase');
    const latestLabel=document.getElementById('nexusTimeLatest');
    const timeSub=document.getElementById('nexusTopTimeSub');
    const phaseEls=Array.from(document.querySelectorAll('#nexusTimePhases span'));

    let documents=[];
    let minTime=0;
    let maxTime=0;
    let mode='simulation';
    let playing=false;
    let frameId=0;
    let lastFrame=0;
    let scanTimer=0;

    const findInternalTimelineButton=()=>Array.from(document.querySelectorAll('button')).find(button=>button.hasAttribute('aria-pressed')&&norm(button.textContent).includes('timeline'));
    const ensureInternalTimeline=()=>{const button=findInternalTimelineButton();if(button&&button.getAttribute('aria-pressed')!=='true')button.click()};

    const parseDate=text=>{
      const value=String(text||'');
      const patterns=[/received\s+(\d{1,2}\s+[a-z]{3,9}\s+\d{4})/i,/received\s+([a-z]{3,9}\s+\d{1,2},?\s+\d{4})/i];
      for(const pattern of patterns){const match=value.match(pattern);if(!match)continue;const parsed=Date.parse(match[1]);if(Number.isFinite(parsed))return parsed}
      return null;
    };

    const scanDocuments=()=>{
      const next=[];
      document.querySelectorAll('[data-node-id]').forEach(node=>{
        const button=node.querySelector('button');
        if(!button)return;
        const directSpans=Array.from(button.children).filter(child=>child instanceof HTMLElement&&child.tagName==='SPAN');
        if(!directSpans.find(span=>norm(span.textContent)==='document'))return;
        const received=directSpans.find(span=>norm(span.textContent).startsWith('received '));
        const time=parseDate(received?.textContent||button.textContent);
        if(time===null)return;
        const labelSpan=directSpans.find(span=>{const value=norm(span.textContent);return value&&value!=='document'&&!value.startsWith('received ')});
        next.push({node,time,label:(labelSpan?.textContent||node.getAttribute('data-node-id')||'Document').trim()});
      });
      next.sort((a,b)=>a.time-b.time);
      documents=next;
      if(next.length){minTime=next[0].time;maxTime=next[next.length-1].time;if(minTime===maxTime){minTime-=604800000;maxTime+=604800000}if(startLabel)startLabel.textContent=formatDate(minTime);if(endLabel)endLabel.textContent=formatDate(maxTime)}
      if(totalMetric)totalMetric.textContent=String(next.length);
      renderTimeline();
      return next.length;
    };

    const scheduleScan=(attempt=0)=>{window.clearTimeout(scanTimer);scanTimer=window.setTimeout(()=>{const count=scanDocuments();if(!count&&attempt<8)scheduleScan(attempt+1)},attempt===0?80:180)};
    const getProgress=()=>clamp(Number(slider?.value||10000)/10000,0,1);
    const currentTime=p=>minTime+(maxTime-minTime)*p;

    const emitTime=(at,p)=>{
      const payload={type:'NEXUS_PROJECT_TIME_CHANGE',worldId:window.__NEXUS_PROJECT_WORLD__||'dev',mode,progress:p,at:new Date(at).toISOString(),source:'relationship-tree-timeline-panel'};
      window.__NEXUS_PROJECT_TIME__=payload;
      document.documentElement.dataset.nexusTimeMode=mode;
      window.dispatchEvent(new CustomEvent('nexus:project-time-change',{detail:payload}));
    };

    function renderTimeline(){
      const p=getProgress();
      if(progress)progress.style.width=`${p*100}%`;
      if(compression)compression.textContent=`${speedSelect?.value||'1'}× PLAYBACK`;
      if(timeSub)timeSub.textContent=`${Math.round(p*100)}%`;
      const phase=PHASES.find(item=>p<=item.end)||PHASES[PHASES.length-1];
      if(phaseMetric)phaseMetric.textContent=phase.label;
      phaseEls.forEach((el,index)=>el.classList.toggle('active',PHASES[index]?.label===phase.label));
      if(!documents.length||!minTime||!maxTime){if(clock)clock.textContent='—';if(clockSub)clockSub.textContent='Waiting for received-document dates';if(visibleMetric)visibleMetric.textContent='0';return}
      const at=currentTime(p);
      const visible=documents.filter(item=>item.time<=at);
      const latest=visible[visible.length-1];
      documents.forEach(item=>{item.node.classList.toggle('nexus-time-future',item.time>at);item.node.classList.toggle('nexus-time-current',Boolean(latest&&item===latest))});
      if(clock)clock.textContent=formatDate(at);
      if(clockSub)clockSub.textContent=latest?`Latest: ${latest.label}`:'Before first received document';
      if(visibleMetric)visibleMetric.textContent=String(visible.length);
      if(latestLabel)latestLabel.textContent=latest?.label||'No document received yet';
      emitTime(at,p);
    }

    const stopPlayback=()=>{playing=false;lastFrame=0;if(frameId)cancelAnimationFrame(frameId);frameId=0;playBtn?.classList.remove('playing');if(playBtn)playBtn.textContent='▶'};
    const tick=timestamp=>{if(!playing)return;if(!lastFrame)lastFrame=timestamp;const elapsed=timestamp-lastFrame;lastFrame=timestamp;const speed=Number(speedSelect?.value||1);const current=Number(slider?.value||0);const next=Math.min(10000,current+(elapsed/120000)*10000*speed);if(slider)slider.value=String(next);renderTimeline();if(next>=10000){stopPlayback();return}frameId=requestAnimationFrame(tick)};
    const setMode=next=>{mode=next;modeHost?.querySelectorAll('button').forEach(button=>button.classList.toggle('active',button.getAttribute('data-time-mode')===mode))};
    const startPlayback=()=>{if(!slider)return;if(Number(slider.value)>=10000)slider.value='0';setMode('simulation');playing=true;playBtn?.classList.add('playing');if(playBtn)playBtn.textContent='❚❚';frameId=requestAnimationFrame(tick)};

    const closePanel=()=>{stopPlayback();panel.classList.remove('open');panel.setAttribute('aria-hidden','true');timeTile.classList.remove('active');timeTile.setAttribute('aria-expanded','false')};
    const openPanel=()=>{
      document.querySelectorAll('.nexus-shell-panel.open').forEach(item=>item.classList.remove('open'));
      document.getElementById('nexusShellScrim')?.classList.remove('open');
      const toolbar=document.querySelector('[data-nexus-top-panel="controls"]');
      if(toolbar instanceof HTMLElement){toolbar.style.setProperty('display','none','important');toolbar.setAttribute('aria-hidden','true')}
      panel.classList.add('open');panel.setAttribute('aria-hidden','false');timeTile.classList.add('active');timeTile.setAttribute('aria-expanded','true');ensureInternalTimeline();scheduleScan();
    };

    timeTile.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();if(panel.classList.contains('open'))closePanel();else openPanel()},true);
    ['nexusTopMenu','nexusTopProject','nexusTopFiles'].forEach(id=>document.getElementById(id)?.addEventListener('click',closePanel,true));
    closeBtn?.addEventListener('click',closePanel);
    slider?.addEventListener('input',()=>{stopPlayback();renderTimeline()});
    speedSelect?.addEventListener('change',renderTimeline);
    playBtn?.addEventListener('click',()=>{if(playing)stopPlayback();else startPlayback()});
    liveBtn?.addEventListener('click',()=>{stopPlayback();setMode('real');if(slider)slider.value='10000';renderTimeline()});
    modeHost?.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{stopPlayback();const next=button.getAttribute('data-time-mode')||'simulation';setMode(next);if(next==='real'&&slider)slider.value='10000';if(next==='replay'&&slider)slider.value='0';renderTimeline()}));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel.classList.contains('open'))closePanel()});
    renderTimeline();
  });
})();