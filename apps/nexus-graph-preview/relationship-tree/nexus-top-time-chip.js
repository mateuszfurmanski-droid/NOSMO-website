// NEXUS_TOP_TIME_CHIP_ADDON_20260817
// Add-only top time chip. Does not remove or restyle existing top tiles, bottom dock, graph, or Project Time instrument.
(()=>{
  if(window.__NEXUS_TOP_TIME_CHIP_ADDON__)return;
  window.__NEXUS_TOP_TIME_CHIP_ADDON__=true;

  const pad=n=>String(n).padStart(2,'0');
  const clockText=()=>{
    const now=new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  function installStyle(){
    if(document.getElementById('nexusTopTimeChipStyle'))return;
    const style=document.createElement('style');
    style.id='nexusTopTimeChipStyle';
    style.textContent=`
      #nexusTopMenu{position:relative!important;overflow:visible!important}
      .nexus-top-time-chip{position:absolute;right:5px;top:8px;z-index:3;display:flex;align-items:center;justify-content:center;gap:3px;height:21px;min-width:42px;padding:0 5px;border:1px solid rgba(31,143,174,.32);border-radius:10px;background:linear-gradient(180deg,rgba(244,251,254,.96),rgba(215,238,247,.9));color:#117f9d;font-family:Inter,Arial,sans-serif;font-size:7px;font-weight:950;letter-spacing:.035em;line-height:1;box-shadow:0 4px 10px rgba(6,40,52,.12),inset 0 0 0 1px rgba(255,255,255,.7);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      .nexus-top-time-chip::before{content:'◷';font-size:8px;line-height:1;color:#1597b8;text-shadow:0 0 5px rgba(21,151,184,.22)}
      .nexus-top-time-chip[data-state='on']{border-color:rgba(21,151,184,.7);background:linear-gradient(180deg,rgba(229,248,254,.98),rgba(194,233,247,.94));color:#0b6f8a;box-shadow:0 0 0 1px rgba(21,151,184,.16),0 4px 12px rgba(6,40,52,.14),inset 0 0 0 1px rgba(255,255,255,.82)}
      .nexus-top-time-chip[data-state='on']::after{content:'';position:absolute;right:4px;bottom:3px;width:3px;height:3px;border-radius:50%;background:#61f58a;box-shadow:0 0 7px rgba(97,245,138,.85)}
      @media(max-width:390px){.nexus-top-time-chip{right:3px;top:7px;min-width:34px;height:18px;padding:0 4px;font-size:6px;border-radius:9px}.nexus-top-time-chip::before{font-size:7px}}
    `;
    document.head.appendChild(style);
  }

  function syncState(chip){
    const sub=document.getElementById('nexusTopTimeSub');
    const state=(sub&&/on/i.test(sub.textContent||''))?'on':'live';
    chip.dataset.state=state;
    chip.textContent=clockText();
  }

  function install(){
    installStyle();
    const menu=document.getElementById('nexusTopMenu');
    const time=document.getElementById('nexusTopTime');
    if(!menu||!time)return;
    if(document.getElementById('nexusTopTimeChip'))return;
    const chip=document.createElement('button');
    chip.id='nexusTopTimeChip';
    chip.className='nexus-top-time-chip';
    chip.type='button';
    chip.setAttribute('aria-label','Open Project Time');
    chip.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      time.click();
      requestAnimationFrame(()=>syncState(chip));
      setTimeout(()=>syncState(chip),80);
    });
    menu.appendChild(chip);
    syncState(chip);
    setInterval(()=>syncState(chip),15000);
    window.addEventListener('nexus:project-time-change',()=>syncState(chip));
  }

  const boot=()=>{
    install();
    requestAnimationFrame(install);
    setTimeout(install,250);
    setTimeout(install,1000);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
