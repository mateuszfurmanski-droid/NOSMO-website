(()=>{
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const embedded=document.documentElement.dataset.nexusEmbedded==='true';
  const themeKey='nexus.theme';
  const tradeKey='nexus.activeTrade';
  const tradeIndexKey='nexus.tradeFileIndex.v1';

  const trades=[
    {id:'all',label:'All trades',icon:'◎',keywords:[]},
    {id:'joinery',label:'Joinery',icon:'J',keywords:['joinery','joiner','carpentry','carpenter','timber','wood','door frame','doorset','ironmongery','skirting','architrave','cabinet','kitchen','second fix']},
    {id:'fire-doors',label:'Fire doors',icon:'FD',keywords:['fire door','fire doors','fds','fd30','fd60','fire rating','intumescent','smoke seal','doorset','fire certificate','fire inspection']},
    {id:'electrical',label:'Electrical',icon:'⚡',keywords:['electrical','electric','cable','cables','lv','db','distribution board','consumer unit','rcd','mcb','eicr','test certificate','schematic','containment','tray','trunking','lighting','socket']},
    {id:'plumbing',label:'Plumbing',icon:'P',keywords:['plumbing','plumber','pipe','pipes','pipework','water','waste','drainage','sanitary','toilet','basin','tap','valve','soil stack']},
    {id:'hvac',label:'HVAC',icon:'H',keywords:['hvac','ventilation','duct','ductwork','ahu','fan coil','fcu','heating','cooling','air conditioning','mechanical ventilation','extract']},
    {id:'drylining',label:'Drylining',icon:'D',keywords:['drylining','dry lining','plasterboard','gypsum','partition','stud wall','ceiling','mf ceiling','taping','jointing','board finish']},
    {id:'site-management',label:'Site management',icon:'SM',keywords:['site management','site manager','construction manager','rams','risk assessment','method statement','programme','schedule','logistics','permit','induction','toolbox talk','inspection plan','qa','quality plan']}
  ];

  function applyTheme(theme){
    const next=theme==='light'?'light':'dark';
    document.documentElement.dataset.nexusTheme=next;
    try{localStorage.setItem(themeKey,next)}catch{}
    const toggle=document.getElementById('nexusThemeToggle');
    if(toggle)toggle.checked=next==='light';
    const themeSub=document.getElementById('nexusMenuThemeSub');
    if(themeSub)themeSub.textContent=next.toUpperCase();
    window.dispatchEvent(new CustomEvent('nexus:theme-change',{detail:{theme:next}}));
  }

  let storedTheme='dark';
  try{storedTheme=localStorage.getItem(themeKey)||'dark'}catch{}
  applyTheme(storedTheme);

  if(embedded){
    window.addEventListener('DOMContentLoaded',()=>{
      const hideEmbeddedChrome=()=>{
        document.querySelectorAll('button,a').forEach(el=>{
          const label=norm(el.textContent);
          if(label.includes('nexus menu')){
            el.style.display='none';
            el.setAttribute('aria-hidden','true');
            el.dataset.nexusEmbeddedHidden='nexus-menu';
          }
        });
        const workflowControls=Array.from(document.querySelectorAll('button,[role="button"],div')).filter(el=>norm(el.textContent).includes('workflow'));
        workflowControls.forEach(workflowControl=>{
          let node=workflowControl;
          let toolbar=null;
          for(let depth=0;node&&depth<8;depth+=1,node=node.parentElement){
            const text=norm(node.innerText||node.textContent);
            const rect=node.getBoundingClientRect();
            const looksLikeToolbar=text.includes('workflow')&&text.includes('objects')&&text.includes('links')&&rect.width>=240&&rect.height>=50&&rect.height<=220;
            if(looksLikeToolbar){toolbar=node;break}
          }
          if(toolbar){
            toolbar.style.display='none';
            toolbar.setAttribute('aria-hidden','true');
            toolbar.dataset.nexusEmbeddedHidden='tree-toolbar';
          }
        });
      };
      hideEmbeddedChrome();
      requestAnimationFrame(hideEmbeddedChrome);
      setTimeout(hideEmbeddedChrome,250);
      setTimeout(hideEmbeddedChrome,1000);
      const observer=new MutationObserver(hideEmbeddedChrome);
      observer.observe(document.body,{childList:true,subtree:true,characterData:true});
      setTimeout(()=>observer.disconnect(),30000);
    });
    return;
  }

  window.addEventListener('DOMContentLoaded',()=>{
    const rail=document.getElementById('nexusTopRail');
    const menuTile=document.getElementById('nexusTopMenu');
    const projectTile=document.getElementById('nexusTopProject');
    const timeTile=document.getElementById('nexusTopTime');
    const filesTile=document.getElementById('nexusTopFiles');
    const timeSub=document.getElementById('nexusTopTimeSub');
    const menuPanel=document.getElementById('nexusMenuPanel');
    const filesPanel=document.getElementById('nexusFilesPanel');
    const settingsPanel=document.getElementById('nexusSettingsPanel');
    const scrim=document.getElementById('nexusShellScrim');
    const fileInput=document.getElementById('nexusFileInput');
    const fileSelection=document.getElementById('nexusFileSelection');
    const themeToggle=document.getElementById('nexusThemeToggle');
    let toolbar=null;
    let controlsOpen=false;
    let tradePanel=null;
    let activeTrade='all';
    let tradeFileIndex=[];

    try{
      const saved=localStorage.getItem(tradeKey);
      if(trades.some(trade=>trade.id===saved))activeTrade=saved;
      const stored=JSON.parse(localStorage.getItem(tradeIndexKey)||'[]');
      if(Array.isArray(stored))tradeFileIndex=stored;
    }catch{}

    const installTradeStyles=()=>{
      if(document.getElementById('nexus-trade-switcher-style'))return;
      const style=document.createElement('style');
      style.id='nexus-trade-switcher-style';
      style.textContent=`
        .nexus-trade-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px 4px}
        .nexus-trade-button{display:flex;align-items:center;gap:9px;min-height:52px;border:1px solid hsl(var(--border));border-radius:14px;background:hsl(var(--card)/.72);padding:8px 10px;color:hsl(var(--foreground));text-align:left}
        .nexus-trade-button.active{border-color:rgba(34,211,238,.75);background:rgba(8,72,96,.42);box-shadow:0 0 0 1px rgba(34,211,238,.15) inset}
        .nexus-trade-icon{display:grid;place-items:center;width:30px;height:30px;flex:none;border-radius:9px;background:rgba(34,211,238,.12);color:rgb(103,232,249);font-size:10px;font-weight:900}
        .nexus-trade-copy{min-width:0;display:flex;flex-direction:column;gap:2px}.nexus-trade-copy strong{font-size:11px}.nexus-trade-copy small{font-size:9px;color:hsl(var(--muted-foreground))}
        .nexus-trade-ai{margin:10px 12px 4px;border:1px solid rgba(34,211,238,.26);border-radius:14px;background:rgba(8,20,34,.64);padding:10px}
        .nexus-trade-ai-head{display:flex;justify-content:space-between;gap:8px;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgb(103,232,249)}
        .nexus-trade-file-list{display:flex;flex-direction:column;gap:5px;margin-top:8px;max-height:31vh;overflow:auto}
        .nexus-trade-file{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:7px 8px;border-radius:9px;background:rgba(15,23,42,.66);font-size:9px;color:#dbeafe}
        .nexus-trade-file span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nexus-trade-file b{flex:none;font-size:8px;color:#67e8f9}
        .nexus-trade-empty{padding:8px 0;color:hsl(var(--muted-foreground));font-size:9px;line-height:1.4}
      `;
      document.head.appendChild(style);
    };

    const installTradePanel=()=>{
      if(document.getElementById('nexusTradesPanel'))return document.getElementById('nexusTradesPanel');
      installTradeStyles();
      const panel=document.createElement('aside');
      panel.className='nexus-shell-panel left';
      panel.id='nexusTradesPanel';
      panel.setAttribute('aria-label','Trades');
      panel.innerHTML=`
        <div class="nexus-shell-panel-head">
          <strong>TRADES</strong>
          <button class="nexus-shell-close" type="button" data-nexus-close-panel aria-label="Close trades">×</button>
        </div>
        <div class="nexus-shell-section-title">PROJECT VIEW</div>
        <div class="nexus-trade-grid" id="nexusTradeGrid"></div>
        <div class="nexus-trade-ai">
          <div class="nexus-trade-ai-head"><span>NEXUS AI · FILE SORT</span><span id="nexusTradeAiStatus">READY</span></div>
          <div class="nexus-trade-file-list" id="nexusTradeFileList"></div>
        </div>`;
      document.body.appendChild(panel);
      tradePanel=panel;
      return panel;
    };

    installTradePanel();

    const topTiles=[menuTile,projectTile,timeTile,filesTile];
    const panels=[menuPanel,filesPanel,settingsPanel,tradePanel];

    const installFileLoaderMenuEntry=()=>{
      if(!menuPanel||menuPanel.querySelector('[data-nexus-action="file-loader"]'))return;
      const systemTitle=Array.from(menuPanel.querySelectorAll('.nexus-shell-section-title')).find(el=>norm(el.textContent)==='system');
      const systemList=systemTitle?.nextElementSibling;
      if(!systemList)return;
      const button=document.createElement('button');
      button.className='nexus-shell-action';
      button.type='button';
      button.dataset.nexusAction='file-loader';
      button.innerHTML='<span class="nexus-shell-action-icon">＋</span><span class="nexus-shell-action-copy"><strong>File Loader</strong><small>Upload & classify project files</small></span>';
      systemList.insertBefore(button,systemList.firstChild);
    };

    installFileLoaderMenuEntry();
    document.querySelector('[data-nexus-file-action="upload"]')?.remove();
    const filesSub=filesTile?.querySelector('.nexus-top-sub');
    if(filesSub)filesSub.textContent='PROJECT DOCS';

    const saveTradeIndex=()=>{
      try{localStorage.setItem(tradeIndexKey,JSON.stringify(tradeFileIndex.slice(-250)))}catch{}
      window.__NEXUS_TRADE_FILE_INDEX__=tradeFileIndex;
    };

    const tradeLabel=id=>trades.find(trade=>trade.id===id)?.label||id;

    const renderTradeFiles=()=>{
      const grid=document.getElementById('nexusTradeGrid');
      const list=document.getElementById('nexusTradeFileList');
      if(grid){
        grid.innerHTML='';
        trades.forEach(trade=>{
          const count=trade.id==='all'?tradeFileIndex.length:tradeFileIndex.filter(file=>file.trades?.includes(trade.id)).length;
          const button=document.createElement('button');
          button.type='button';
          button.className=`nexus-trade-button${trade.id===activeTrade?' active':''}`;
          button.dataset.trade=trade.id;
          button.innerHTML=`<span class="nexus-trade-icon">${trade.icon}</span><span class="nexus-trade-copy"><strong>${trade.label}</strong><small>${count} classified file${count===1?'':'s'}</small></span>`;
          button.addEventListener('click',()=>setActiveTrade(trade.id,{focus:true}));
          grid.appendChild(button);
        });
      }
      if(list){
        const files=(activeTrade==='all'?tradeFileIndex:tradeFileIndex.filter(file=>file.trades?.includes(activeTrade))).slice().reverse().slice(0,30);
        list.innerHTML='';
        if(!files.length){
          const empty=document.createElement('div');
          empty.className='nexus-trade-empty';
          empty.textContent='No classified files in this trade yet. Upload project files through File Loader and Nexus will sort them in the background.';
          list.appendChild(empty);
        }else{
          files.forEach(file=>{
            const row=document.createElement('div');
            row.className='nexus-trade-file';
            row.title=file.name;
            row.innerHTML=`<span>${file.name}</span><b>${tradeLabel(file.primaryTrade)} · ${Math.round((file.confidence||0)*100)}%</b>`;
            list.appendChild(row);
          });
        }
      }
    };

    const setActiveTrade=(id,{focus=false}={})=>{
      if(!trades.some(trade=>trade.id===id))id='all';
      activeTrade=id;
      document.documentElement.dataset.nexusTrade=id;
      try{localStorage.setItem(tradeKey,id)}catch{}
      renderTradeFiles();
      window.dispatchEvent(new CustomEvent('nexus:trade-change',{detail:{tradeId:id,label:tradeLabel(id)}}));
      if(focus){
        if(id==='electrical')setTimeout(()=>document.querySelector('[data-node-id="m-electrical"] button')?.click(),40);
        if(id==='all')setTimeout(()=>document.querySelector('[data-node-id="proj"] button')?.click(),40);
      }
    };

    const readableTextFile=file=>{
      const ext=(file.name.split('.').pop()||'').toLowerCase();
      return file.size<=2_500_000&&(String(file.type||'').startsWith('text/')||['txt','csv','json','xml','html','htm','md','log'].includes(ext));
    };

    const readTextSample=async file=>{
      if(!readableTextFile(file))return'';
      try{return norm((await file.text()).slice(0,70000))}catch{return''}
    };

    const countHits=(haystack,keyword)=>{
      if(!keyword||!haystack)return 0;
      let count=0,start=0;
      while(count<8){
        const next=haystack.indexOf(keyword,start);
        if(next<0)break;
        count+=1;start=next+keyword.length;
      }
      return count;
    };

    const localAiClassify=async file=>{
      const name=norm(file.name.replace(/[_.\-]+/g,' '));
      const text=await readTextSample(file);
      const combined=`${name} ${text}`;
      const scored=trades.filter(trade=>trade.id!=='all').map(trade=>{
        let score=0;
        for(const keyword of trade.keywords){
          const key=norm(keyword);
          score+=countHits(name,key)*5;
          score+=countHits(text,key)*1.2;
        }
        if(trade.id==='electrical'&&/\b(eicr|db|lv|mcb|rcd|cable|schematic)\b/.test(combined))score+=8;
        if(trade.id==='fire-doors'&&/\b(fd30|fd60|fire door|intumescent)\b/.test(combined))score+=10;
        if(trade.id==='joinery'&&/\b(joinery|carpentry|doorset|ironmongery)\b/.test(combined))score+=8;
        return{id:trade.id,score};
      }).sort((a,b)=>b.score-a.score);
      const best=scored[0]||{id:'all',score:0};
      const second=scored[1]?.score||0;
      const total=scored.reduce((sum,item)=>sum+item.score,0);
      const confidence=best.score<=0?0:Math.max(.42,Math.min(.98,(best.score+Math.max(0,best.score-second))/(Math.max(1,total)+best.score)));
      const threshold=Math.max(3,best.score*.55);
      let matches=scored.filter(item=>item.score>=threshold&&item.score>0).slice(0,3).map(item=>item.id);
      if(!matches.length)matches=['site-management'];
      return{
        name:file.name,
        size:file.size,
        type:file.type||'',
        lastModified:file.lastModified||0,
        primaryTrade:matches[0],
        trades:matches,
        confidence:matches[0]==='site-management'&&best.score===0?.35:confidence,
        method:'nexus-background-trade-classifier-v1',
        classifiedAt:new Date().toISOString()
      };
    };

    const classifyFilesInBackground=async files=>{
      const status=document.getElementById('nexusTradeAiStatus');
      if(status)status.textContent='SORTING';
      if(fileSelection)fileSelection.textContent=`${files.length} file${files.length===1?'':'s'} selected — Nexus AI sorting by trade…`;
      const results=[];
      for(const file of files){
        const result=await localAiClassify(file);
        const key=`${result.name}|${result.size}|${result.lastModified}`;
        tradeFileIndex=tradeFileIndex.filter(item=>`${item.name}|${item.size}|${item.lastModified}`!==key);
        tradeFileIndex.push(result);
        results.push(result);
        saveTradeIndex();
        renderTradeFiles();
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      if(status)status.textContent='READY';
      const counts={};
      results.forEach(result=>result.trades.forEach(trade=>counts[trade]=(counts[trade]||0)+1));
      const summary=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([trade,count])=>`${tradeLabel(trade)} ${count}`).join(' · ');
      if(fileSelection)fileSelection.textContent=results.length?`${results.length} file${results.length===1?'':'s'} classified — ${summary}`:'No files selected';
      window.dispatchEvent(new CustomEvent('nexus:files-trade-classified',{detail:{files:results,counts}}));
      window.dispatchEvent(new CustomEvent('nexus:ai-trade-sort-request',{detail:{files:results,source:'background-local-v1'}}));
      return results;
    };

    window.NexusTrades={
      trades:trades.map(({id,label})=>({id,label})),
      setActiveTrade:id=>setActiveTrade(id,{focus:true}),
      getActiveTrade:()=>activeTrade,
      classifyFiles:classifyFilesInBackground,
      getFileIndex:()=>tradeFileIndex.slice()
    };

    setActiveTrade(activeTrade);
    saveTradeIndex();

    const findToolbar=()=>Array.from(document.querySelectorAll('[data-control]')).find(el=>{
      const text=norm(el.textContent);
      return text.includes('workflow')&&text.includes('objects')&&text.includes('links');
    });

    const placeToolbar=()=>{
      const candidate=findToolbar();
      if(!candidate)return;
      toolbar=candidate;
      toolbar.dataset.nexusTopPanel='controls';
      toolbar.style.setProperty('position','fixed','important');
      toolbar.style.setProperty('left','8px','important');
      toolbar.style.setProperty('right','8px','important');
      toolbar.style.setProperty('top','calc(var(--nexus-top-rail-h) + 8px)','important');
      toolbar.style.setProperty('width','auto','important');
      toolbar.style.setProperty('max-width','none','important');
      toolbar.style.setProperty('z-index','2035','important');
      toolbar.style.setProperty('border-radius','18px','important');
      toolbar.style.setProperty('box-shadow','0 18px 48px rgba(0,0,0,.38)','important');
      toolbar.style.setProperty('display',controlsOpen?'flex':'none','important');
      toolbar.setAttribute('aria-hidden',String(!controlsOpen));
    };

    const clearTopActive=()=>topTiles.forEach(tile=>tile?.classList.remove('active'));

    const closePanels=()=>{
      panels.forEach(panel=>panel?.classList.remove('open'));
      scrim?.classList.remove('open');
      menuTile?.classList.remove('active');
      filesTile?.classList.remove('active');
    };

    const closeControls=()=>{
      controlsOpen=false;
      placeToolbar();
    };

    const openPanel=(panel,tile)=>{
      closeControls();
      closePanels();
      clearTopActive();
      panel?.classList.add('open');
      scrim?.classList.add('open');
      tile?.classList.add('active');
    };

    const clickToolbarButton=needle=>{
      placeToolbar();
      const button=toolbar&&Array.from(toolbar.querySelectorAll('button')).find(el=>norm(el.textContent).includes(needle));
      if(button)button.click();
      return button;
    };

    const clickExistingNav=label=>{
      const target=Array.from(document.querySelectorAll('button,a')).find(el=>norm(el.textContent)===norm(label));
      if(target){target.click();return true}
      window.dispatchEvent(new CustomEvent('nexus:menu-request',{detail:{target:label}}));
      return false;
    };

    const openProject=()=>{
      closePanels();
      closeControls();
      clearTopActive();
      projectTile?.classList.add('active');
      document.querySelector('[data-node-id="proj"] button')?.click();
      setTimeout(()=>projectTile?.classList.remove('active'),450);
    };

    menuTile?.addEventListener('click',()=>{
      if(menuPanel?.classList.contains('open'))closePanels();
      else openPanel(menuPanel,menuTile);
    });

    projectTile?.addEventListener('click',openProject);

    timeTile?.addEventListener('click',()=>{
      closePanels();
      closeControls();
      clearTopActive();
      timeTile?.classList.add('active');
      const button=clickToolbarButton('timeline');
      setTimeout(()=>{
        const pressed=button?.getAttribute('aria-pressed')==='true';
        if(timeSub)timeSub.textContent=pressed?'ON':'OFF';
        if(!pressed)timeTile?.classList.remove('active');
      },50);
    });

    filesTile?.addEventListener('click',()=>{
      if(filesPanel?.classList.contains('open'))closePanels();
      else openPanel(filesPanel,filesTile);
    });

    document.querySelectorAll('[data-nexus-close-panel]').forEach(btn=>btn.addEventListener('click',closePanels));
    scrim?.addEventListener('click',()=>{closePanels();closeControls()});

    document.querySelector('[data-nexus-action="file-loader"]')?.addEventListener('click',()=>{
      closePanels();
      fileInput?.click();
    });

    document.querySelector('[data-nexus-action="controls"]')?.addEventListener('click',()=>{
      closePanels();
      clearTopActive();
      controlsOpen=true;
      placeToolbar();
    });

    document.querySelector('[data-nexus-action="settings"]')?.addEventListener('click',()=>openPanel(settingsPanel,null));
    document.querySelector('[data-nexus-action="home"]')?.addEventListener('click',()=>{closePanels();clearTopActive()});
    document.querySelector('[data-nexus-action="projects"]')?.addEventListener('click',openProject);
    document.querySelector('[data-nexus-action="people"]')?.addEventListener('click',()=>{closePanels();clickExistingNav('PEOPLE')});
    document.querySelector('[data-nexus-action="trades"]')?.addEventListener('click',()=>{openPanel(tradePanel,null);renderTradeFiles()});
    document.querySelector('[data-nexus-action="modules"]')?.addEventListener('click',()=>{closePanels();clickExistingNav('MODULES')});
    document.querySelector('[data-nexus-action="connections"]')?.addEventListener('click',()=>{closePanels();clickExistingNav('CONNECTIONS')});

    document.querySelector('[data-nexus-file-action="project-files"]')?.addEventListener('click',()=>{closePanels();clickExistingNav('DOCS')});
    ['recent','unmatched','pending'].forEach(filter=>{
      document.querySelector(`[data-nexus-file-action="${filter}"]`)?.addEventListener('click',()=>{
        window.dispatchEvent(new CustomEvent('nexus:file-filter-request',{detail:{filter,tradeId:activeTrade}}));
      });
    });

    fileInput?.addEventListener('change',()=>{
      const files=Array.from(fileInput.files||[]);
      window.__NEXUS_PENDING_UPLOADS__=files;
      if(fileSelection)fileSelection.textContent=files.length?`${files.length} file${files.length===1?'':'s'} selected — starting trade classification…`:'No files selected';
      window.dispatchEvent(new CustomEvent('nexus:file-upload-request',{detail:{files,tradeId:activeTrade}}));
      if(files.length)classifyFilesInBackground(files);
    });

    themeToggle?.addEventListener('change',()=>applyTheme(themeToggle.checked?'light':'dark'));
    applyTheme(document.documentElement.dataset.nexusTheme||storedTheme);

    placeToolbar();
    requestAnimationFrame(placeToolbar);
    setTimeout(placeToolbar,250);
    setTimeout(placeToolbar,1000);
    const root=document.getElementById('root');
    if(root){
      const observer=new MutationObserver(placeToolbar);
      observer.observe(root,{childList:true,subtree:true,characterData:true});
    }

    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){closePanels();closeControls()}
    });

    document.addEventListener('pointerdown',event=>{
      if(!controlsOpen||!toolbar)return;
      const target=event.target;
      if(!(target instanceof Node))return;
      if(toolbar.contains(target)||rail?.contains(target))return;
      closeControls();
    },true);
  });
})();