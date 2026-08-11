// NEXUS_PEOPLE_PANEL_V2_KAMIL_BRIDGE
(()=>{
  if(document.documentElement.dataset.nexusEmbedded==='true')return;
  const DATA_URL='/data/person-card-kamil.json?v=v41graph1';
  const CARD_URL='/person-card-kamil.html?v=v41graph1';
  const TREE_URL='/apps/nexus-graph-preview/relationship-tree/?focus=p-kamil&person=kamil-karaszewski&v=v41graph1';
  const FETCHER_URL='/apps/nexus-file-loader/?projectKey=NEXUS_DEMO_PROJECT_001_eSAFE_CATANIA&person=kamil-karaszewski&card=/person-card-kamil.html?v=v41graph1';
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const initials=name=>String(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toUpperCase()||'').join('')||'?';

  let kamilBridge={
    id:'p-kamil',
    label:'Kamil Karaszewski',
    sublabel:'Technical Advisor · Welding & Fabrication',
    cardUrl:CARD_URL,
    dataUrl:FETCHER_URL,
    treeUrl:TREE_URL,
    bridge:true
  };

  fetch(DATA_URL,{cache:'no-store'})
    .then(response=>response.ok?response.json():null)
    .then(data=>{
      if(!data)return;
      kamilBridge={
        ...kamilBridge,
        id:data.graph?.nodeId||kamilBridge.id,
        label:data.person?.displayName||data.graph?.label||kamilBridge.label,
        sublabel:data.graph?.sublabel||[data.person?.role,data.person?.trade].filter(Boolean).join(' · ')||kamilBridge.sublabel,
        cardUrl:data.links?.personCard||kamilBridge.cardUrl,
        dataUrl:data.links?.dataFetcher||kamilBridge.dataUrl,
        treeUrl:data.links?.relationshipTree||kamilBridge.treeUrl
      };
      window.dispatchEvent(new CustomEvent('nexus:person-data-bridge-ready',{detail:kamilBridge}));
    })
    .catch(()=>{});

  window.addEventListener('DOMContentLoaded',()=>{
    const peopleAction=document.querySelector('[data-nexus-action="people"]');
    const scrim=document.getElementById('nexusShellScrim');
    if(!peopleAction)return;

    const panel=document.createElement('aside');
    panel.id='nexusPeoplePanel';
    panel.className='nexus-people-panel';
    panel.setAttribute('aria-label','People in active project');
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML='<div class="nexus-people-head"><strong>PEOPLE</strong><button class="nexus-people-close" type="button" aria-label="Close people">×</button></div><div class="nexus-people-context" id="nexusPeopleContext">ACTIVE PROJECT</div><div class="nexus-people-list" id="nexusPeopleList"></div><div class="nexus-people-note">People are read from the active Relationship Tree and from linked Person Card data bridges. Kamil is connected to the shared Person Card data file, Data Fetcher context and Relationship Tree route.</div>';
    document.body.appendChild(panel);

    const list=panel.querySelector('#nexusPeopleList');
    const context=panel.querySelector('#nexusPeopleContext');

    const readPeople=()=>{
      const rows=[];
      document.querySelectorAll('[data-node-id]').forEach(node=>{
        const button=node.querySelector('button');
        if(!button)return;
        const spans=Array.from(button.children).filter(child=>child instanceof HTMLElement&&child.tagName==='SPAN');
        const typeSpan=spans.find(span=>norm(span.textContent)==='person');
        if(!typeSpan)return;
        const candidates=spans.map(span=>(span.textContent||'').trim()).filter(Boolean).filter(text=>norm(text)!=='person'&&!norm(text).startsWith('received '));
        if(!candidates.length)return;
        const label=candidates[0];
        const sublabel=candidates[1]||'Project person';
        const isKamil=/\bkamil\b/i.test(label);
        rows.push({node,button,label,sublabel,id:node.getAttribute('data-node-id')||'',cardUrl:isKamil?kamilBridge.cardUrl:null,dataUrl:isKamil?kamilBridge.dataUrl:null,treeUrl:isKamil?kamilBridge.treeUrl:null});
      });
      if(!rows.some(person=>/\bkamil\b/i.test(person.label))){
        rows.push({...kamilBridge});
      }
      return rows;
    };

    const focusNode=person=>{
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden','true');
      scrim?.classList.remove('open');
      if(person.button){
        person.button.click();
        person.node.scrollIntoView?.({behavior:'smooth',block:'center',inline:'center'});
        window.dispatchEvent(new CustomEvent('nexus:person-focus',{detail:{nodeId:person.id,label:person.label}}));
        return;
      }
      window.location.href=person.treeUrl||TREE_URL;
    };

    const render=()=>{
      const projectLabel=document.querySelector('#nexusTopProject .nexus-top-sub')?.textContent?.trim()||'ACTIVE PROJECT';
      if(context)context.textContent=`${projectLabel} · PROJECT PEOPLE`;
      const people=readPeople();
      if(!list)return;
      if(!people.length){list.innerHTML='<div class="nexus-people-empty">No person nodes are currently mounted in this Project World.</div>';return}
      list.innerHTML='';
      people.forEach(person=>{
        const row=document.createElement('div');
        row.className=`nexus-person-row${person.bridge?' bridge':''}`;
        const safeCard=person.cardUrl||CARD_URL;
        const safeData=person.dataUrl||FETCHER_URL;
        row.innerHTML=`<span class="nexus-person-avatar">${initials(person.label)}</span><span class="nexus-person-copy"><strong>${person.label}</strong><small>${person.sublabel}</small></span><span class="nexus-person-actions"><button class="nexus-person-action" type="button" data-person-focus>${person.bridge?'TREE':'IN TREE'}</button><a class="nexus-person-action primary" href="${safeCard}">CARD</a>${/\bkamil\b/i.test(person.label)?`<a class="nexus-person-action" href="${safeData}">DATA</a>`:''}</span>`;
        row.querySelector('[data-person-focus]')?.addEventListener('click',()=>focusNode(person));
        list.appendChild(row);
      });
    };

    const close=()=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true');if(scrim&&!document.querySelector('.nexus-shell-panel.open')&&!document.getElementById('nexusProjectSwitcher')?.classList.contains('open'))scrim.classList.remove('open')};
    const open=()=>{
      document.querySelectorAll('.nexus-shell-panel.open').forEach(item=>item.classList.remove('open'));
      document.getElementById('nexusProjectSwitcher')?.classList.remove('open');
      document.getElementById('nexusTimelinePanel')?.classList.remove('open');
      render();
      panel.classList.add('open');panel.setAttribute('aria-hidden','false');scrim?.classList.add('open');
    };

    peopleAction.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();open()},true);
    panel.querySelector('.nexus-people-close')?.addEventListener('click',close);
    scrim?.addEventListener('click',close);
    window.addEventListener('nexus:person-data-bridge-ready',()=>{if(panel.classList.contains('open'))render()});
    ['nexusTopProject','nexusTopTime','nexusTopFiles'].forEach(id=>document.getElementById(id)?.addEventListener('click',close,true));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel.classList.contains('open'))close()});
  });
})();
