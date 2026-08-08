(()=>{
  const aliases={
    'e-SAFE Catania':'e-SAFE',
    'Pilot Building':'Building',
    'Delivery + Works':'Works',
    'Testing + Handover':'Testing',
    'Retrofit Systems':'Systems',
    'Project Sources':'Sources'
  };
  const host=document.getElementById('worldNodeHost');
  if(!host)return;
  function compact(){
    host.querySelectorAll('.world-node').forEach(tile=>{
      const label=tile.querySelector('.wn-label');
      if(label&&aliases[label.textContent.trim()])label.textContent=aliases[label.textContent.trim()];
      const sub=tile.querySelector('.wn-sub');
      let badge='';
      if(sub){
        const text=sub.textContent.trim();
        const m=text.match(/^(\d+)/);
        if(m&&(/RECORD/i.test(text)||/ACTIVE/i.test(text)||/\/\s*95/i.test(text)))badge=m[1];
      }
      if(tile.classList.contains('building'))badge='5F';
      if(badge)tile.dataset.badge=badge;else delete tile.dataset.badge;
    });
  }
  const observer=new MutationObserver(compact);
  observer.observe(host,{childList:true,subtree:true,characterData:true});
  compact();
})();