(()=>{
  const records=()=>window.ESAFE_RECORDS||[];
  const byTitle=t=>records().find(r=>r.title===t);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtBytes=n=>{n=Number(n)||0;if(n>=1073741824)return`${(n/1073741824).toFixed(1)} GB`;if(n>=1048576)return`${(n/1048576).toFixed(n>=10485760?0:1)} MB`;if(n>=1024)return`${Math.ceil(n/1024)} KB`;return`${n} B`};
  const fileName=f=>typeof f==='string'?f:(f?.name||'Source file');
  const fileSize=f=>typeof f==='string'?0:(f?.size||0);
  const fileUrl=(r,f)=>typeof f==='string'?r.url:(f?.url||r.url);

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
        recordLink.textContent='ZENODO ↗';
        arrow.replaceWith(recordLink);
      }
      const meta=box.querySelector('.source-meta');
      if(meta&&r.doi)meta.insertAdjacentHTML('beforeend',` · ${esc(r.doi)}`);
      const files=document.createElement('div');
      files.className='source-files';
      files.innerHTML=(r.files||[]).map(f=>`<a class="source-file-link" href="${esc(fileUrl(r,f))}" target="_blank" rel="noopener"><span class="source-file-name">${esc(fileName(f))}</span><span class="source-file-size">${fmtBytes(fileSize(f))} ↗</span></a>`).join('');
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
    files.innerHTML=(r.files||[]).map(f=>`<a class="drawer-file-link" href="${esc(fileUrl(r,f))}" target="_blank" rel="noopener"><span>${esc(fileName(f))}</span><span>${fmtBytes(fileSize(f))} ↗</span></a>`).join('');
    const source=document.getElementById('drawerSource');
    if(source){source.href=r.url;source.textContent=`Open Zenodo record${r.doi?` · ${r.doi}`:''} ↗`}
  }

  function wireSearch(){
    const input=document.getElementById('sourceSearch');
    if(!input||input.dataset.fileSearch==='1')return;
    input.dataset.fileSearch='1';
    input.placeholder='Search records or 106 files…';
    input.addEventListener('input',()=>window.setTimeout(wireSourceItems,0));
  }

  const root=document.getElementById('worldShell')||document.body;
  const observer=new MutationObserver(()=>{wireSourceItems();wireDrawer();wireSearch()});
  observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  wireSourceItems();wireDrawer();wireSearch();
})();