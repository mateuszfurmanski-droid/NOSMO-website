// NEXUS_ONE_SHELL_FIXES_V1
(()=>{
  if(window.__NEXUS_ONE_SHELL_FIXES_INSTALLED__)return;
  window.__NEXUS_ONE_SHELL_FIXES_INSTALLED__=true;
  if(document.documentElement.dataset.nexusEmbedded==='true')return;

  const run=()=>{
    const menuPanel=document.getElementById('nexusMenuPanel');
    const filesPanel=document.getElementById('nexusFilesPanel');
    const fileInput=document.getElementById('nexusFileInput');
    const filesTile=document.getElementById('nexusTopFiles');

    // Upload belongs to FILES, not to the global System menu.
    menuPanel?.querySelector('[data-nexus-action="file-loader"]')?.remove();

    const list=filesPanel?.querySelector('.nexus-shell-list');
    if(list&&!list.querySelector('[data-nexus-file-action="upload"]')){
      const upload=document.createElement('button');
      upload.className='nexus-shell-action';
      upload.type='button';
      upload.dataset.nexusFileAction='upload';
      upload.innerHTML='<span class="nexus-shell-action-icon">＋</span><span class="nexus-shell-action-copy"><strong>Upload files</strong><small>Upload & classify with Nexus AI</small></span>';
      list.insertBefore(upload,list.firstChild);
    }

    const upload=filesPanel?.querySelector('[data-nexus-file-action="upload"]');
    if(upload&&!upload.dataset.oneShellWired){
      upload.dataset.oneShellWired='true';
      upload.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        fileInput?.click();
      },true);
    }

    const sub=filesTile?.querySelector('.nexus-top-sub');
    if(sub&&!/^\d+\s+FILES$/i.test(sub.textContent||''))sub.textContent='PROJECT DOCS';

    if(!document.getElementById('nexus-one-shell-mobile-style')){
      const style=document.createElement('style');
      style.id='nexus-one-shell-mobile-style';
      style.textContent=`
        @media (max-width:720px){
          [aria-label="Nexus folder dock"] div[class*="max-h-"]{max-height:34dvh!important}
          [aria-label="Nexus folder dock"] button[title],
          [aria-label="Nexus folder dock"] a[title]{width:68px!important;height:54px!important;min-height:54px!important;padding:5px 6px!important;border-radius:11px!important;gap:2px!important}
          [aria-label="Nexus folder dock"] button[title] svg,
          [aria-label="Nexus folder dock"] a[title] svg{width:18px!important;height:18px!important}
          [aria-label="Nexus folder dock"] [data-nosmo-file-icon]{width:32px!important;height:32px!important}
          [aria-label="Nexus folder dock"] button[title] span,
          [aria-label="Nexus folder dock"] a[title] span{font-size:8px!important;line-height:1.05!important}
        }
      `;
      document.head.appendChild(style);
    }
  };

  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',run);
  else run();

  // The legacy shell mutates these controls during startup; keep the one-shell layout canonical.
  window.setTimeout(run,150);
  window.setTimeout(run,700);
})();
