// NEXUS_PEOPLE_PANEL_V1
(()=>{
  if(document.documentElement.dataset.nexusEmbedded==='true')return;
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const initials=name=>String(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toUpperCase()||'').join('')||'?';

  window.addEventListener('DOMContentLoaded',()=>{
    const peopleAction=document.querySelector('[data-nexus-action="people"]');
    const scrim=document.getElementById('nexusShellScrim');
    if(!peopleAction)return;

    const panel=document.createElement('aside');
    panel.id='nexusPeoplePanel';
    panel.className='nexus-people-panel';
    panel.setAttribute('aria-label','People in active project');
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML='<div class="nexus-people-head"><strong>PEOPLE</strong><button class="nexus-people-close" type="button" aria-label="Close people">×</button></div><div class="nexus-people-context" id="nexusPeopleContext">ACTIVE PROJECT</div><div class="nexus-people-list" id="nexusPeopleList"></div><div class="nexus-people-note">People are read from the active Relationship Tree. Opening a person focuses the existing graph node; full Person Cards remain separate identity records.</div>';
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
        rows.push({node,button,label,sublabel,id:node.getAttribute('data-node-id')||''});
      });
      return rows;
    };

    const focusNode=person=>{
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden','true');
      scrim?.classList.remove('open');
      person.button.click();
      person.node.scrollIntoView?.({behavior:'smooth',block:'center',inline:'center'});
      window.dispatchEvent(new CustomEvent('nexus:person-focus',{detail:{nodeId:person.id,label:person.label}}));
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
        row.className='nexus-person-row';
        const isKamil=/\bkamil\b/i.test(person.label);
        row.innerHTML=`<span class="nexus-person-avatar">${initials(person.label)}</span><span class="nexus-person-copy"><strong>${person.label}</strong><small>${person.sublabel}</small></span><span class="nexus-person-actions"><button class="nexus-person-action" type="button" data-person-focus>IN TREE</button>${isKamil?'<a class="nexus-person-action primary" href="/person-card-kamil.html">PERSON CARD</a>':''}</span>`;
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
    ['nexusTopProject','nexusTopTime','nexusTopFiles'].forEach(id=>document.getElementById(id)?.addEventListener('click',close,true));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel.classList.contains('open'))close()});
  });
})();