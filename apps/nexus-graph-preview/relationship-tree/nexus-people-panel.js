// NEXUS_PEOPLE_PANEL_V5_PERSON_NODE_AVATARS
(()=>{
  if(document.documentElement.dataset.nexusEmbedded==='true')return;
  const DATA_URL='/data/person-card-kamil.json?v=v47top1';
  const REGISTRY_URL='/apps/nexus/person-cards/?v=v47top1';
  const CARD_URL='/person-card-kamil.html?v=v47top1';
  const TREE_URL='/apps/nexus-graph-preview/relationship-tree/?focus=p-kamil&person=kamil-karaszewski&v=v47top1';
  const FETCHER_URL='/apps/nexus-file-loader/?projectKey=NEXUS_DEMO_PROJECT_001_eSAFE_CATANIA&person=kamil-karaszewski&card=/person-card-kamil.html?v=v47top1';
  const KAMIL_AVATAR='/assets/KamilKaraszewski.jpeg';
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const initials=name=>String(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toUpperCase()||'').join('')||'?';

  let kamilBridge={
    id:'p-kamil',
    label:'Kamil Karaszewski',
    sublabel:'Technical Advisor · Welding & Fabrication',
    cardUrl:CARD_URL,
    dataUrl:FETCHER_URL,
    treeUrl:TREE_URL,
    bridge:true,
    avatar:KAMIL_AVATAR
  };

  function ensureAvatarStyles(){
    if(document.getElementById('nexusPersonNodeAvatarStyles'))return;
    const style=document.createElement('style');
    style.id='nexusPersonNodeAvatarStyles';
    style.textContent=`
      [data-node-id] > button{position:relative!important;overflow:visible!important}
      .nexus-tree-person-avatar{position:absolute;z-index:8;top:-13px;right:-13px;width:34px;height:34px;border-radius:999px;border:2px solid rgba(96,165,250,.98);background:#071421;box-shadow:0 0 0 2px rgba(2,7,19,.92),0 8px 18px rgba(0,0,0,.42),0 0 16px rgba(58,139,255,.28);display:grid;place-items:center;overflow:hidden;pointer-events:none;color:#dbeafe;font:900 10px/1 Inter,Arial,sans-serif;letter-spacing:.02em}
      .nexus-tree-person-avatar img{width:100%;height:100%;display:block;object-fit:cover;object-position:center 18%;transform:scale(1.16);transform-origin:center 22%;}
      .nexus-tree-person-avatar.initials{background:radial-gradient(circle at 30% 20%,rgba(96,165,250,.32),rgba(15,23,42,.98));}
      [data-node-id="p-kamil"] .nexus-tree-person-avatar{width:38px;height:38px;top:-15px;right:-15px;border-color:#86bdff;}
      @media(max-width:760px){.nexus-tree-person-avatar{width:30px;height:30px;top:-10px;right:-10px;border-width:2px;font-size:9px}[data-node-id="p-kamil"] .nexus-tree-person-avatar{width:34px;height:34px;top:-12px;right:-12px}}
    `;
    document.head.appendChild(style);
  }

  function personInfoFromNode(node){
    const button=node?.querySelector('button');
    if(!button)return null;
    const spans=Array.from(button.children).filter(child=>child instanceof HTMLElement&&child.tagName==='SPAN');
    const typeSpan=spans.find(span=>norm(span.textContent)==='person');
    const nodeId=node.getAttribute('data-node-id')||'';
    const text=(button.textContent||'').trim();
    const isKamil=nodeId==='p-kamil'||/\bkamil\b/i.test(text);
    if(!typeSpan&&!isKamil)return null;
    const candidates=spans.map(span=>(span.textContent||'').trim()).filter(Boolean).filter(value=>norm(value)!=='person'&&!norm(value).startsWith('received '));
    const label=candidates[0]||(isKamil?'Kamil Karaszewski':'Person');
    return{node,button,nodeId,label,isKamil};
  }

  function applyPersonNodeAvatars(){
    ensureAvatarStyles();
    document.querySelectorAll('[data-node-id]').forEach(node=>{
      const info=personInfoFromNode(node);
      if(!info)return;
      let avatar=info.button.querySelector(':scope > .nexus-tree-person-avatar');
      if(!avatar){
        avatar=document.createElement('span');
        avatar.className='nexus-tree-person-avatar';
        avatar.setAttribute('aria-hidden','true');
        info.button.prepend(avatar);
      }
      if(info.isKamil){
        avatar.classList.remove('initials');
        if(!avatar.querySelector('img')){
          const img=document.createElement('img');
          img.src=KAMIL_AVATAR;
          img.alt='';
          img.loading='eager';
          img.decoding='async';
          avatar.textContent='';
          avatar.appendChild(img);
        }
      }else{
        avatar.classList.add('initials');
        avatar.textContent=initials(info.label);
      }
      info.node.dataset.nexusPersonAvatar='true';
    });
  }

  const scheduleAvatarPasses=()=>{
    applyPersonNodeAvatars();
    setTimeout(applyPersonNodeAvatars,250);
    setTimeout(applyPersonNodeAvatars,900);
    setTimeout(applyPersonNodeAvatars,1800);
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
      scheduleAvatarPasses();
    })
    .catch(()=>{});

  window.addEventListener('DOMContentLoaded',()=>{
    scheduleAvatarPasses();
    const graphObserver=new MutationObserver(()=>scheduleAvatarPasses());
    graphObserver.observe(document.body,{childList:true,subtree:true});

    const peopleAction=document.querySelector('[data-nexus-action="people"]');
    const scrim=document.getElementById('nexusShellScrim');
    if(!peopleAction)return;

    const panel=document.createElement('aside');
    panel.id='nexusPeoplePanel';
    panel.className='nexus-people-panel';
    panel.setAttribute('aria-label','People in active project');
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML='<div class="nexus-people-head"><strong>PEOPLE</strong><span class="nexus-people-head-actions"><a class="nexus-people-registry" href="/apps/nexus/person-cards/?v=v47top1">PERSON CARDS</a><button class="nexus-people-close" type="button" aria-label="Close people">×</button></span></div><div class="nexus-people-context" id="nexusPeopleContext">ACTIVE PROJECT</div><div class="nexus-people-list" id="nexusPeopleList"></div><div class="nexus-people-note">People are read from the active Relationship Tree and from linked Person Card data bridges. Person nodes now show compact photo avatars on the graph.</div>';
    document.body.appendChild(panel);

    const list=panel.querySelector('#nexusPeopleList');
    const context=panel.querySelector('#nexusPeopleContext');

    const readPeople=()=>{
      const rows=[];
      document.querySelectorAll('[data-node-id]').forEach(node=>{
        const button=node.querySelector('button');
        if(!button)return;
        const info=personInfoFromNode(node);
        if(!info)return;
        const candidates=Array.from(button.children).filter(child=>child instanceof HTMLElement&&child.tagName==='SPAN').map(span=>(span.textContent||'').trim()).filter(Boolean).filter(text=>norm(text)!=='person'&&!norm(text).startsWith('received '));
        const label=candidates[0]||info.label;
        const sublabel=candidates[1]||'Project person';
        rows.push({node,button,label,sublabel,id:info.nodeId,cardUrl:info.isKamil?kamilBridge.cardUrl:null,dataUrl:info.isKamil?kamilBridge.dataUrl:null,treeUrl:info.isKamil?kamilBridge.treeUrl:null,avatar:info.isKamil?KAMIL_AVATAR:null});
      });
      if(!rows.some(person=>/\bkamil\b/i.test(person.label))){rows.push({...kamilBridge});}
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
        const avatarHtml=person.avatar?`<span class="nexus-person-avatar photo"><img src="${person.avatar}" alt=""></span>`:`<span class="nexus-person-avatar">${initials(person.label)}</span>`;
        row.innerHTML=`${avatarHtml}<span class="nexus-person-copy"><strong>${person.label}</strong><small>${person.sublabel}</small></span><span class="nexus-person-actions"><button class="nexus-person-action" type="button" data-person-focus>${person.bridge?'TREE':'IN TREE'}</button><a class="nexus-person-action primary" href="${safeCard}">CARD</a>${/\bkamil\b/i.test(person.label)?`<a class="nexus-person-action" href="${safeData}">DATA</a>`:''}</span>`;
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
      scheduleAvatarPasses();
    };

    peopleAction.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();open()},true);
    panel.querySelector('.nexus-people-close')?.addEventListener('click',close);
    panel.querySelector('.nexus-people-registry')?.addEventListener('click',()=>close());
    scrim?.addEventListener('click',close);
    window.addEventListener('nexus:person-data-bridge-ready',()=>{if(panel.classList.contains('open'))render();scheduleAvatarPasses();});
    window.addEventListener('nexus:person-focus',scheduleAvatarPasses);
    ['nexusTopProject','nexusTopTime','nexusTopFiles'].forEach(id=>document.getElementById(id)?.addEventListener('click',close,true));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel.classList.contains('open'))close()});
  });
})();