(()=>{
  const IMPORT_SUMMARY={projectKey:'NEXUS_DEMO_PROJECT_001_eSAFE_CATANIA',schema:'nexus.file-registry.v1',files:106,kinds:{pdf:104,video:2},unknown:0,status:'imported'};
  const records=()=>window.ESAFE_RECORDS||[];
  const byTitle=t=>records().find(r=>r.title===t);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtBytes=n=>{n=Number(n)||0;if(n>=1073741824)return`${(n/1073741824).toFixed(1)} GB`;if(n>=1048576)return`${(n/1048576).toFixed(n>=10485760?0:1)} MB`;if(n>=1024)return`${Math.ceil(n/1024)} KB`;return`${n} B`};
  const fileName=f=>typeof f==='string'?f:(f?.name||'Project file');
  const fileSize=f=>typeof f==='string'?0:(f?.size||0);
  const fileUrl=(r,f)=>typeof f==='string'?r.url:(f?.url||r.url);
  const fileKind=f=>/\.(mp4|webm|mov|m4v|avi)$/i.test(fileName(f))?'VIDEO':'PDF';

  function syncFilesChrome(){
    const tile=document.getElementById('sourcesTile');
    if(tile){
      const label=tile.querySelector('.tile-label');
      const sub=tile.querySelector('.tile-sub');
      if(label)label.textContent='FILES';
      if(sub){
        const n=(sub.textContent.match(/\d+/)||[])[0];
        sub.textContent=`${n||IMPORT_SUMMARY.files} FILES`;
      }
      tile.setAttribute('aria-label','Open project files');
    }
    const panel=document.getElementById('sourceLibrary');
    if(panel){
      const kicker=panel.querySelector('.world-panel-kicker');
      const heading=panel.querySelector('h2');
      if(kicker)kicker.textContent='PROJECT FILES';
      if(heading)heading.textContent='e-SAFE project files';
      const body=panel.querySelector('.world-panel-body');
      if(body&&!body.querySelector('.file-loader-import-band')){
        const band=document.createElement('div');
        band.className='provenance-band file-loader-import-band';
        band.innerHTML=`<strong>Nexus File Loader</strong> · ${IMPORT_SUMMARY.files} imported · ${IMPORT_SUMMARY.kinds.pdf} PDF · ${IMPORT_SUMMARY.kinds.video} video · ${IMPORT_SUMMARY.unknown} unknown`;
        body.prepend(band);
      }
    }
    const search=document.getElementById('sourceSearch');
    if(search)search.placeholder='Search 106 project files…';
  }

  function wireSourceItems(){
    document.querySelectorAll('#sourceList .source-item:not(.files-wired)').forEach(item=>{
      const title=item.querySelector('.source-title')?.textContent?.trim();
      const r=byTitle(title);
      if(!r)return;
      let box=item;
      if(item.tagName==='A'){
        box=document.createElement('div');
        box.className=item.className;
        box.innerHTML=item.innerHTML;
        item.replaceWith(box);
      }
      box.classList.add('files-wired');
      const arrow=box.querySelector('.source-arrow');
      if(arrow){
        const recordLink=document.createElement('a');
        recordLink.className='source-record-link';
        recordLink.href=r.url;
        recordLink.target='_blank';
        recordLink.rel='noopener';
        recordLink.textContent='SOURCE ↗';
        arrow.replaceWith(recordLink);
      }
      const meta=box.querySelector('.source-meta');
      if(meta&&r.doi&&!meta.textContent.includes(r.doi))meta.insertAdjacentHTML('beforeend',` · ${esc(r.doi)}`);
      const files=document.createElement('div');
      files.className='source-files';
      files.innerHTML=(r.files||[]).map(f=>`<a class="source-file-link" href="${esc(fileUrl(r,f))}" target="_blank" rel="noopener" data-loader-status="imported"><span class="source-file-name"><strong>${fileKind(f)}</strong> · ${esc(fileName(f))}</span><span class="source-file-size">${fmtBytes(fileSize(f))} ↗</span></a>`).join('');
      box.appendChild(files);
    });
  }

  function wireDrawer(){
    const drawer=document.getElementById('eventDrawer');
    if(!drawer?.classList.contains('open'))return;
    const title=document.getElementById('drawerTitle')?.textContent?.trim();
    const r=byTitle(title);
    if(!r)return;
    const files=document.getElementById('drawerFiles');
    if(!files||files.dataset.recordId===r.id)return;
    files.dataset.recordId=r.id;
    files.innerHTML=(r.files||[]).map(f=>`<a class="drawer-file-link" href="${esc(fileUrl(r,f))}" target="_blank" rel="noopener"><span><strong>${fileKind(f)}</strong> · ${esc(fileName(f))}</span><span>${fmtBytes(fileSize(f))} ↗</span></a>`).join('');
    const source=document.getElementById('drawerSource');
    if(source){source.href=r.url;source.textContent=`Open source record${r.doi?` · ${r.doi}`:''} ↗`}
  }

  function syncDynamicText(){
    const summary=document.getElementById('sourceSummary');
    if(summary&&/record/i.test(summary.textContent))summary.textContent=summary.textContent.replace(/records?/i,'source groups');
    syncFilesChrome();
  }

  const root=document.getElementById('worldShell')||document.body;
  const observer=new MutationObserver(()=>{wireSourceItems();wireDrawer();syncDynamicText()});
  observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  syncFilesChrome();wireSourceItems();wireDrawer();syncDynamicText();
})();
