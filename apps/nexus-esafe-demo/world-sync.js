(()=>{
  const records=(window.ESAFE_RECORDS||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const slider=document.getElementById('timeSlider');
  if(!records.length||!slider||!window.ESAFE_WORLD)return;

  const start=new Date(records[0].date+'T00:00:00Z');
  const end=new Date(records[records.length-1].date+'T00:00:00Z');
  const span=end-start;
  const phase=p=>p<.15?'SURVEY':p<.35?'DESIGN + BIM':p<.55?'PROCUREMENT':p<.85?'CONSTRUCTION':'TESTING + HANDOVER';
  const categories=['Survey','BIM','Design','Production','Construction','Testing','Research','Communication'];
  let last='';

  const categoryCounts=visible=>Object.fromEntries(categories.map(category=>[
    category,
    {
      visible:visible.filter(record=>record.category===category).length,
      total:records.filter(record=>record.category===category).length
    }
  ]));

  function sync(){
    const p=Number(slider.value)/Number(slider.max);
    const mode=document.querySelector('.mode-switch button.active')?.dataset.mode||'simulation';
    const key=`${slider.value}|${mode}`;
    if(key!==last){
      last=key;
      const cutoff=new Date(start.getTime()+span*p);
      const visible=records.filter(r=>new Date(r.date+'T23:59:59Z')<=cutoff);
      const currentPhase=phase(p);
      window.ESAFE_WORLD.update({progress:p,visible,phase:currentPhase,mode,sourceDate:cutoff});
      try{
        document.getElementById('nexusFrame')?.contentWindow?.postMessage({
          type:'NEXUS_PROJECT_TIME_CHANGE',
          worldId:'esafe-demo',
          mode,
          progress:p,
          sourceDate:cutoff.toISOString(),
          visibleRecordIds:visible.map(record=>record.id),
          phase:currentPhase,
          categoryCounts:categoryCounts(visible)
        },window.location.origin);
      }catch(_){ }
    }
    requestAnimationFrame(sync);
  }

  document.getElementById('timeTile')?.addEventListener('click',()=>window.ESAFE_WORLD.closePanels(),true);
  requestAnimationFrame(sync);
})();
