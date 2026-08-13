// NEXUS_PEOPLE_PANEL_V6_PERSON_CARD_V47_AND_MOBILE_DOCK_FIT
(()=>{
  if(document.documentElement.dataset.nexusEmbedded==='true')return;
  const DATA_URL='/data/person-card-kamil.json?v=v47top1';
  const REGISTRY_URL='/apps/nexus/person-cards/?v=v47top1';
  const CARD_URL='/person-card-kamil.html?v=v47top1';
  const TREE_URL='/apps/nexus-graph-preview/relationship-tree/?focus=p-kamil&person=kamil-karaszewski&v=v47top1';
  const FETCHER_URL='/apps/nexus-file-loader/?projectKey=NEXUS_DEMO_PROJECT_001_eSAFE_CATANIA&person=kamil-karaszewski&card=/person-card-kamil.html?v=v47top1';
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const initials=name=>String(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toUpperCase()||'').join('')||'?';

  const installDockFit=()=>{
    if(document.getElementById('nexusMobileDockFitStyle'))return;
    const style=document.createElement('style');
    style.id='nexusMobileDockFitStyle';
    style.textContent=`
      :root{--nexus-bottom-dock-h:92px;--nexus-bottom-tile-w:calc((100vw - 54px)/5.5)}
      @supports(height:100dvh){body{min-height:100dvh}}
      @media(max-width:760px){
        html,body{width:100vw!important;max-width:100vw!important;overflow:hidden!important;background:#020713!important;overscroll-behavior:none!important}
        #root{position:fixed!important;top:var(--nexus-top-rail-h,76px)!important;left:0!important;right:0!important;bottom:0!important;width:100vw!important;max-width:100vw!important;min-width:100vw!important;height:auto!important;min-height:0!important;overflow:hidden!important;background:#eaf3f6!important;transform:none!important;scale:1!important;}
        #root>*{max-width:none!important;transform-origin:center center!important;}
        .nexus-mobile-bottom-dock{position:fixed!important;z-index:9060!important;left:0!important;right:0!important;bottom:0!important;width:100vw!important;max-width:100vw!important;min-width:100vw!important;height:calc(var(--nexus-bottom-dock-h) + env(safe-area-inset-bottom,0px))!important;display:flex!important;flex-wrap:nowrap!important;align-items:stretch!important;justify-content:flex-start!important;gap:8px!important;box-sizing:border-box!important;padding:7px 8px calc(8px + env(safe-area-inset-bottom,0px)) 8px!important;margin:0!important;overflow-x:auto!important;overflow-y:hidden!important;background:linear-gradient(180deg,rgba(238,248,252,.88),rgba(226,239,245,.98))!important;border-top:1px solid rgba(51,116,151,.22)!important;box-shadow:0 -12px 28px rgba(6,22,35,.18)!important;transform:none!important;translate:none!important;scale:1!important;contain:layout paint!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;}
        .nexus-mobile-bottom-dock::-webkit-scrollbar{display:none!important}
        .nexus-mobile-bottom-dock>*{flex:0 0 var(--nexus-bottom-tile-w)!important;width:var(--nexus-bottom-tile-w)!important;min-width:var(--nexus-bottom-tile-w)!important;max-width:var(--nexus-bottom-tile-w)!important;height:76px!important;min-height:76px!important;max-height:76px!important;margin:0!important;box-sizing:border-box!important;transform:none!important;translate:none!important;scale:1!important;border-radius:16px!important;}
        .nexus-mobile-bottom-dock button,.nexus-mobile-bottom-dock a{touch-action:manipulation!important;}
        .nexus-shell-panel,.nexus-project-switcher,.nexus-time-panel{bottom:calc(var(--nexus-bottom-dock-h) + env(safe-area-inset-bottom,0px) + 10px)!important;max-height:calc(100dvh - var(--nexus-top-rail-h,76px) - var(--nexus-bottom-dock-h) - env(safe-area-inset-bottom,0px) - 18px)!important;}
        .nexus-shell-scrim{bottom:calc(var(--nexus-bottom-dock-h) + env(safe-area-inset-bottom,0px))!important;}
      }
      @media(max-width:390px){:root{--nexus-bottom-dock-h:88px;--nexus-bottom-tile-w:calc((100vw - 48px)/5.5)}.nexus-mobile-bottom-dock{gap:7px!important;padding-left:7px!important;padding-right:7px!important}.nexus-mobile-bottom-dock>*{height:72px!important;min-height:72px!important;max-height:72px!important;border-radius:15px!important}}
      @media(max-width:340px){:root{--nexus-bottom-dock-h:84px;--nexus-bottom-tile-w:calc((100vw - 42px)/5.5)}.nexus-mobile-bottom-dock{gap:6px!important}.nexus-mobile-bottom-dock>*{height:69px!important;min-height:69px!important;max-height:69px!important}}
    `;
    document.head.appendChild(style);
  };

  const findBottomDock=()=>{
    const root=document.getElementById('root');
    if(!root)return null;
    const controls=Array.from(root.querySelectorAll('button,a,[role="button"]')).filter(el=>{
      const label=norm(el.textContent||el.getAttribute('aria-label')||'');
      return ['tasks','project','people','docs','tools'].includes(label);
    });
    if(controls.length<4)return null;
    const viewportH=window.innerHeight||document.documentElement.clientHeight||0;
    const candidates=[];
    for(const control of controls){
      let node=control.parentElement;
      for(let depth=0;node&&depth<8;depth+=1,node=node.parentElement){
        if(node===root)break;
        const text=norm(node.textContent||'');
        const hitCount=['tasks','project','people','docs','tools'].filter(label=>text.includes(label)).length;
        const rect=node.getBoundingClientRect();
        const nearBottom=rect.bottom>viewportH-220;
        const looksDock=hitCount>=4&&rect.width>240&&rect.height>=54&&rect.height<=190&&nearBottom;
        if(looksDock)candidates.push({node,score:hitCount*100+rect.width-Math.abs(viewportH-rect.bottom)});
      }
    }
    candidates.sort((a,b)=>b.score-a.score);
    return candidates[0]?.node||null;
  };

  const fitBottomDock=()=>{
    if(window.innerWidth>760)return;
    installDockFit();
    const dock=findBottomDock();
    if(!dock)return;
    dock.classList.add('nexus-mobile-bottom-dock');
    dock.dataset.nexusDockFit='5.5';
    if(dock.parentElement!==document.body){
      document.body.appendChild(dock);
    }
    const labels=['tasks','project','people','docs','tools'];
    Array.from(dock.children).forEach(child=>{
      child.style.flex='0 0 var(--nexus-bottom-tile-w)';
      child.style.width='var(--nexus-bottom-tile-w)';
    });
    const root=document.getElementById('root');
    if(root){
      root.style.paddingBottom='calc(var(--nexus-bottom-dock-h) + env(safe-area-inset-bottom,0px))';
    }
  };

  const scheduleDockFit=()=>{
    fitBottomDock();
    requestAnimationFrame(fitBottomDock);
    setTimeout(fitBottomDock,120);
    setTimeout(fitBottomDock,450);
    setTimeout(fitBottomDock,1100);
  };

  window.addEventListener('DOMContentLoaded',()=>{
    installDockFit();
    scheduleDockFit();
    window.addEventListener('resize',scheduleDockFit,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(scheduleDockFit,250),{passive:true});
    const observer=new MutationObserver(scheduleDockFit);
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),12000);
  });

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
    panel.innerHTML='<div class="nexus-people-head"><strong>PEOPLE</strong><span class="nexus-people-head-actions"><a class="nexus-people-registry" href="/apps/nexus/person-cards/?v=v47top1">PERSON CARDS</a><button class="nexus-people-close" type="button" aria-label="Close people">×</button></span></div><div class="nexus-people-context" id="nexusPeopleContext">ACTIVE PROJECT</div><div class="nexus-people-list" id="nexusPeopleList"></div><div class="nexus-people-note">People are read from the active Relationship Tree and from linked Person Card data bridges. The Person Cards registry is the system-level entry point for shared identity records.</div>';
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
      scheduleDockFit();
    };

    peopleAction.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();open()},true);
    panel.querySelector('.nexus-people-close')?.addEventListener('click',close);
    panel.querySelector('.nexus-people-registry')?.addEventListener('click',()=>close());
    scrim?.addEventListener('click',close);
    window.addEventListener('nexus:person-data-bridge-ready',()=>{if(panel.classList.contains('open'))render()});
    ['nexusTopProject','nexusTopTime','nexusTopFiles'].forEach(id=>document.getElementById(id)?.addEventListener('click',close,true));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel.classList.contains('open'))close()});
  });
})();