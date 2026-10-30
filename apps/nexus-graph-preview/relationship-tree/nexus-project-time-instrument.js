// Working, explicitly synthetic phase navigator for the existing graph.
(()=>{
  if(window.__NEXUS_PROJECT_TIME_INSTRUMENT_ISO__)return;
  window.__NEXUS_PROJECT_TIME_INSTRUMENT_ISO__=true;
  const world=window.__NEXUS_PROJECT_WORLD__==='esafe-demo'?'esafe-demo':'dev';
  const phases=[
    {name:'Survey',dev:['d-groundfloor','t-walkthrough'],esafe:['esafe-core-6260847','esafe-trade-survey']},
    {name:'Design + BIM',dev:['d-groundfloor','d-doorschedule'],esafe:['esafe-core-6497142','esafe-core-19126674','esafe-trade-bim']},
    {name:'Procurement',dev:['d-doorschedule','t-doorkits'],esafe:['esafe-core-19126519','esafe-trade-fabrication']},
    {name:'Construction',dev:['t-install','t-fire','d-siteinstructions'],esafe:['esafe-core-19126519','esafe-trade-fabrication','esafe-trade-mep']},
    {name:'Testing + handover',dev:['t-snag','d-snaglist','d-firecerts'],esafe:['esafe-core-19114712','esafe-trade-survey']}
  ];
  const key='nexus.demoPhase:'+world;
  let phase=0,open=false,timer=null,highlight=false;
  try{const n=Number(localStorage.getItem(key));if(Number.isInteger(n)&&n>=0&&n<phases.length)phase=n}catch{}
  let root;
  function applyGraph(){
    const fallback={'esafe-core-6260847':'d-snaglist','esafe-core-6497142':'d-firecerts','esafe-core-19126674':'t-fire','esafe-core-19126519':'t-snag','esafe-core-19114712':'t-install','esafe-trade-survey':'d-groundfloor','esafe-trade-bim':'p-client','esafe-trade-fabrication':'p-team','esafe-trade-mep':'p-sitemgr'};
    const selected=new Set(phases[phase][world==='dev'?'dev':'esafe'].map(id=>document.querySelector(`[data-node-id="${id}"]`)?id:fallback[id]||id));
    document.documentElement.toggleAttribute('data-nx-phase-highlight',highlight);
    const nodes=[...document.querySelectorAll('#root [data-node-id]')];
    let count=0;
    for(const node of nodes){const match=selected.has(node.dataset.nodeId);if(match)count++;node.dataset.nxPhaseMatch=String(match||node.dataset.nodeId==='proj');}
    root.querySelector('[data-phase-count]').textContent=highlight?count+' related objects highlighted · other objects remain visible':'All objects visible';
  }
  function update(){
    root.classList.toggle('nx-pti-open',open);
    root.querySelector('[data-phase-name]').textContent=phases[phase].name;
    root.querySelectorAll('[data-phase]').forEach(b=>{const active=Number(b.dataset.phase)===phase;b.setAttribute('aria-pressed',String(active));b.classList.toggle('nx-active',active)});
    root.querySelector('input').value=phase;
    root.querySelector('input').setAttribute('aria-valuetext',phases[phase].name);
    root.querySelector('[data-cmd="previous"]').disabled=phase===0;
    root.querySelector('[data-cmd="next"]').disabled=phase===4;
    root.querySelector('[data-cmd="play"]').textContent=timer?'Pause':'Play phases';
    root.querySelector('[data-cmd="play"]').setAttribute('aria-pressed',String(!!timer));
    const sub=document.getElementById('nexusTopTimeSub');if(sub)sub.textContent=open?'ON':'OFF';
    applyGraph();
    window.__NEXUS_PROJECT_TIME__={open,mode:'simulation',worldId:world,phase:phases[phase].name,phaseIndex:phase,highlight,source:'demo-phase-map'};
    window.dispatchEvent(new CustomEvent('nexus:project-time-change',{detail:window.__NEXUS_PROJECT_TIME__}));
  }
  function stop(){if(timer)clearInterval(timer);timer=null;}
  function select(index){phase=Math.max(0,Math.min(4,index));highlight=true;try{localStorage.setItem(key,String(phase))}catch{}update()}
  function boot(){
    root=document.createElement('section');root.id='nexusProjectTimeIso';root.setAttribute('aria-label','Project phases');
    root.innerHTML=`<header><div><small>${world==='dev'?'RIVERSIDE':'e-SAFE'} · DEMO TIMELINE</small><h2>Project phases</h2></div><button type="button" data-cmd="close" aria-label="Close project phases">×</button></header>
      <p>Choose a phase to highlight related objects. This is a demo mapping, not a verified project schedule.</p>
      <div class="nx-pti-phase" role="group" aria-label="Project phase">${phases.map((p,i)=>`<button type="button" data-phase="${i}" aria-pressed="false">${p.name}</button>`).join('')}</div>
      <label for="nx-phase-slider">Selected phase: <strong data-phase-name></strong></label><input id="nx-phase-slider" type="range" min="0" max="4" step="1" aria-label="Project phase position">
      <div class="nx-pti-transport"><button type="button" data-cmd="previous">Previous</button><button type="button" data-cmd="play">Play phases</button><button type="button" data-cmd="next">Next</button><button type="button" data-cmd="clear">Show all objects</button></div>
      <p role="status" data-phase-count></p>`;
    document.body.appendChild(root);
    root.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>{stop();select(Number(b.dataset.phase))});
    root.querySelector('input').oninput=e=>{stop();select(Number(e.target.value))};
    root.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>{switch(b.dataset.cmd){
      case 'close':open=false;stop();update();break;
      case 'clear':stop();highlight=false;update();break;
      case 'previous':stop();select(phase-1);break;
      case 'next':stop();select(phase+1);break;
      case 'play':if(timer){stop();update()}else{if(phase===4)phase=0;highlight=true;timer=setInterval(()=>{if(phase>=3){stop();select(4)}else select(phase+1)},2000);update()}break;
    }});
    const time=document.getElementById('nexusTopTime');
    time?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open=!open;if(!open)stop();update()},true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){open=false;stop();update()}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();update()}});
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
