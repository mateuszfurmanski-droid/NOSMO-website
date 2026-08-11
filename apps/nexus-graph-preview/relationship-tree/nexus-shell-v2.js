(()=>{
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const embedded=document.documentElement.dataset.nexusEmbedded==='true';
  const themeKey='nexus.theme';

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

    const topTiles=[menuTile,projectTile,timeTile,filesTile];
    const panels=[menuPanel,filesPanel,settingsPanel];

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
    document.querySelector('[data-nexus-action="trades"]')?.addEventListener('click',()=>{closePanels();clickExistingNav('TRADES')});
    document.querySelector('[data-nexus-action="modules"]')?.addEventListener('click',()=>{closePanels();clickExistingNav('MODULES')});
    document.querySelector('[data-nexus-action="connections"]')?.addEventListener('click',()=>{closePanels();clickExistingNav('CONNECTIONS')});

    document.querySelector('[data-nexus-file-action="upload"]')?.addEventListener('click',()=>fileInput?.click());
    document.querySelector('[data-nexus-file-action="project-files"]')?.addEventListener('click',()=>{closePanels();clickExistingNav('DOCS')});
    ['recent','unmatched','pending'].forEach(filter=>{
      document.querySelector(`[data-nexus-file-action="${filter}"]`)?.addEventListener('click',()=>{
        window.dispatchEvent(new CustomEvent('nexus:file-filter-request',{detail:{filter}}));
      });
    });

    fileInput?.addEventListener('change',()=>{
      const files=Array.from(fileInput.files||[]);
      window.__NEXUS_PENDING_UPLOADS__=files;
      if(fileSelection)fileSelection.textContent=files.length?`${files.length} file${files.length===1?'':'s'} selected — ready for Nexus File Loader`:'No files selected';
      window.dispatchEvent(new CustomEvent('nexus:file-upload-request',{detail:{files}}));
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