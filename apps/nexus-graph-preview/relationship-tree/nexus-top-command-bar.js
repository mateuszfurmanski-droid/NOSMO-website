// NEXUS_TOP_COMMAND_BAR_ADDON_20260817
// Add-on only. A thin top command bar that calls existing Nexus actions; it does not replace panels or graph runtime.
(()=>{
  if(window.__NEXUS_TOP_COMMAND_BAR__)return;
  window.__NEXUS_TOP_COMMAND_BAR__=true;

  const state={open:false};
  const $=selector=>document.querySelector(selector);
  const $$=selector=>Array.from(document.querySelectorAll(selector));
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const click=target=>{
    if(!target)return false;
    try{target.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}))}catch{try{target.click()}catch{return false}}
    return true;
  };
  const clickId=id=>click(document.getElementById(id));
  const pulse=btn=>{btn?.classList.add('active');setTimeout(()=>btn?.classList.remove('active'),280)};

  const dockActionButton=action=>{
    const exact=$(`[data-nexus-bottom-dock-action="${action}"]`);
    if(exact)return exact;
    const candidates=$$('button,a,[role="button"]').filter(control=>{
      if(control.closest('#nexusTopCommandBar,#nexusTopCommandLauncher,#nexusProjectTimeIso,.nexus-shell-panel,#nexusIntegrationsPanel'))return false;
      const text=norm(control.textContent||control.getAttribute('aria-label')||'');
      if(!new RegExp(`(^|\\b)${action}(\\b|$)`,'i').test(text))return false;
      const rect=control.getBoundingClientRect();
      const vh=window.innerHeight||document.documentElement.clientHeight||0;
      return rect.bottom>=vh-190&&rect.top>=vh-310;
    });
    return candidates[0]||null;
  };

  const closeLauncher=()=>{
    state.open=false;
    document.documentElement.classList.remove('nx-tcb-launcher-open');
    document.getElementById('nexusTopCommandMenu')?.classList.remove('active');
  };
  const toggleLauncher=()=>{
    state.open=!state.open;
    document.documentElement.classList.toggle('nx-tcb-launcher-open',state.open);
    document.getElementById('nexusTopCommandMenu')?.classList.toggle('active',state.open);
  };

  const trigger=action=>{
    if(action!=='menu')closeLauncher();
    switch(action){
      case 'menu':
        toggleLauncher();
        return true;
      case 'system':
        return clickId('nexusTopMenu')||click(dockActionButton('system'));
      case 'project':
        return click(dockActionButton('project'))||clickId('nexusTopProject');
      case 'time':
        return clickId('nexusTopTimeChip')||click(dockActionButton('time'))||clickId('nexusTopTime');
      case 'people':
        return click(dockActionButton('people'))||click($('[data-nexus-action="people"]'))||false;
      case 'docs':
        return click(dockActionButton('docs'))||clickId('nexusTopFiles')||click($('[data-nexus-file-action="project-files"]'));
      case 'tools':
        return click(dockActionButton('tools'))||clickId('nexusTopTools');
      case 'tasks':
        return click(dockActionButton('tasks'))||false;
      case 'trades':
        return click(dockActionButton('trades'))||click($('[data-nexus-action="trades"]'))||click($('#nexusOpenTrades'));
      case 'integrations':
        return click(document.getElementById('nexusIntegrationsDockTile'))||false;
      case 'cloud':
        return clickId('nexusTopFiles')||click(dockActionButton('docs'));
      case 'safety':
        return click(document.getElementById('nexusIntegrationsDockTile'))||false;
      default:
        window.dispatchEvent(new CustomEvent('nexus:top-command',{detail:{action}}));
        return false;
    }
  };

  const timeCommand=cmd=>{
    window.dispatchEvent(new CustomEvent('nexus:project-time-control',{detail:{cmd,source:'top-command-bar'}}));
    trigger('time');
  };

  const el=(tag,attrs={},children=[])=>{
    const node=document.createElement(tag);
    Object.entries(attrs||{}).forEach(([key,value])=>{
      if(value==null)return;
      if(key==='class')node.className=value;
      else if(key==='text')node.textContent=value;
      else if(key==='html')node.innerHTML=value;
      else node.setAttribute(key,String(value));
    });
    [].concat(children||[]).forEach(child=>{
      if(child==null)return;
      node.appendChild(typeof child==='string'?document.createTextNode(child):child);
    });
    return node;
  };

  const iconButton=(action,icon,label,extraClass='')=>{
    const btn=el('button',{type:'button',class:`nx-tcb-chip ${extraClass}`.trim(),'data-nx-tcb-action':action,'aria-label':label},[
      el('span',{class:'nx-tcb-icon',text:icon}),
      el('span',{class:'nx-tcb-label',text:label})
    ]);
    btn.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();pulse(btn);trigger(action)},true);
    return btn;
  };

  const transport=(cmd,icon,led='off')=>{
    const btn=el('button',{type:'button',class:'nx-tcb-transport',text:icon,'data-command':cmd,'data-led':led,'aria-label':cmd.toUpperCase()});
    btn.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();pulse(btn);timeCommand(cmd)},true);
    return btn;
  };

  const buildBar=()=>{
    if(document.getElementById('nexusTopCommandBar'))return;
    document.documentElement.classList.add('nx-tcb-active');

    const menu=el('button',{id:'nexusTopCommandMenu',type:'button',class:'nx-tcb-btn nx-tcb-menu-btn','aria-label':'Open top command menu',text:'☰'});
    menu.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();trigger('menu')},true);

    const mini=el('section',{class:'nx-tcb-mini-player','aria-label':'Project Time mini player'},[
      el('div',{class:'nx-tcb-mini-strip'},[
        el('span',{text:'PROJECT TIME'}),
        el('strong',{text:'05 AUG 2026'}),
        el('span',{text:'SOURCE 05 NOV 2025'}),
        el('span',{text:'5.3×'})
      ]),
      el('div',{class:'nx-tcb-controls'},[
        transport('play','▶','green'),
        transport('rew','◀◀'),
        transport('ffd','▶▶'),
        transport('rwd','◀'),
        transport('rec','●','red'),
        transport('screen','▣')
      ]),
      el('div',{class:'nx-tcb-mini-actions'},[
        el('button',{type:'button',class:'nx-tcb-speed',text:'1×','aria-label':'Playback speed'})
      ])
    ]);
    mini.addEventListener('click',event=>{
      const transportBtn=event.target.closest('.nx-tcb-transport,.nx-tcb-speed');
      if(transportBtn)return;
      event.preventDefault();event.stopPropagation();trigger('time');
    },true);

    const bar=el('nav',{id:'nexusTopCommandBar','aria-label':'Nexus top command bar'},[
      menu,
      mini,
      iconButton('project','▦','PROJECT'),
      iconButton('people','☷','PEOPLE'),
      iconButton('docs','▤','DOCS'),
      iconButton('tools','⌁','TOOLS'),
      iconButton('integrations','⌬','INTEGR'),
      iconButton('system','N','SYSTEM')
    ]);
    document.body.appendChild(bar);
  };

  const buildLauncher=()=>{
    if(document.getElementById('nexusTopCommandLauncher'))return;
    const items=[
      ['project','▦','Project'],
      ['time','◷','Time'],
      ['people','☷','People'],
      ['docs','▤','Docs'],
      ['tools','⌁','Tools'],
      ['integrations','⌬','Integrations'],
      ['tasks','✓','Tasks'],
      ['trades','▱','Trades'],
      ['cloud','☁','Cloud'],
      ['safety','▣','Safety'],
      ['system','N','System']
    ].map(([action,icon,label])=>{
      const btn=el('button',{type:'button',class:'nx-tcb-launcher-item','data-nx-tcb-action':action,'aria-label':label},[
        el('span',{class:'nx-tcb-icon',text:icon}),
        el('span',{class:'nx-tcb-label',text:label})
      ]);
      btn.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();pulse(btn);trigger(action)},true);
      return btn;
    });
    const launcher=el('aside',{id:'nexusTopCommandLauncher','aria-label':'Nexus top command launcher'},[
      el('div',{class:'nx-tcb-launcher-head'},[
        el('div',{},[
          el('strong',{text:'NEXUS COMMAND'}),
          el('small',{text:'Existing functions, top launcher'})
        ]),
        el('button',{type:'button',class:'nx-tcb-close','aria-label':'Close top command launcher',text:'×'})
      ]),
      el('div',{class:'nx-tcb-launcher-grid'},items)
    ]);
    launcher.querySelector('.nx-tcb-close')?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();closeLauncher()},true);
    document.body.appendChild(launcher);
  };

  const install=()=>{buildBar();buildLauncher();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  window.addEventListener('resize',()=>requestAnimationFrame(install),{passive:true});
  window.NexusTopCommandBar={trigger,close:closeLauncher};
})();
