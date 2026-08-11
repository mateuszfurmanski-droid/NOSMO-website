// NEXUS_ESAFE_EMBEDDED_ADAPTER_V2
(()=>{
  if(document.documentElement.dataset.nexusEmbedded!=='true')return;
  if((window.__NEXUS_PROJECT_WORLD__||'')!=='esafe-demo')return;

  const CATEGORY_ORDER=['Survey','BIM','Design','Production','Construction','Testing','Research','Communication'];
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim();

  const categoryState=new Map(CATEGORY_ORDER.map(name=>[name,{visible:0,total:0}]));
  const categoryPreviews=new Map(CATEGORY_ORDER.map(name=>[name,[]]));
  let mapped=false;
  let categoryNodes=[];
  let selectedCategory='';
  let panel=null;

  function setNodeText(node,label,sublabel){
    const button=node?.querySelector('button');
    if(!button)return;
    const spans=Array.from(button.children).filter(el=>el instanceof HTMLElement&&el.tagName==='SPAN');
    const typeSpan=spans.find(span=>['project','person','task','document','issue','module'].includes(norm(span.textContent).toLowerCase()));
    const contentSpans=spans.filter(span=>span!==typeSpan);
    if(contentSpans[0])contentSpans[0].textContent=label;
    if(contentSpans[1])contentSpans[1].textContent=sublabel;
    node.dataset.esafeCategory=label;
  }

  function ensurePanel(){
    if(panel)return panel;
    panel=document.createElement('aside');
    panel.id='esafeRecordPreview';
    panel.setAttribute('aria-hidden','true');
    panel.style.cssText='position:fixed;z-index:120;left:50%;bottom:86px;transform:translate(-50%,18px);width:min(92vw,460px);max-height:46vh;overflow:auto;border:1px solid rgba(122,198,255,.25);border-radius:16px;background:rgba(8,18,32,.96);color:#eef6ff;padding:12px;box-shadow:0 18px 46px rgba(0,0,0,.42);opacity:0;pointer-events:none;transition:.18s;font:12px Inter,system-ui,sans-serif';
    panel.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px"><div><div style="font-size:9px;letter-spacing:.14em;color:#7ac6ff;font-weight:800">e-SAFE · PROJECT RECORDS</div><strong id="esafePreviewTitle" style="font-size:14px">CATEGORY</strong></div><button id="esafePreviewClose" type="button" aria-label="Close records" style="width:32px;height:32px;border-radius:10px;border:1px solid rgba(164,193,227,.2);background:rgba(255,255,255,.05);color:#eef6ff">×</button></div><div id="esafePreviewMeta" style="color:#9bb0c8;margin-bottom:8px"></div><div id="esafePreviewList" style="display:grid;gap:7px"></div>';
    document.body.appendChild(panel);
    panel.querySelector('#esafePreviewClose')?.addEventListener('click',closePanel);
    return panel;
  }

  function closePanel(){
    if(!panel)return;
    selectedCategory='';
    panel.setAttribute('aria-hidden','true');
    panel.style.opacity='0';
    panel.style.pointerEvents='none';
    panel.style.transform='translate(-50%,18px)';
  }

  function openCategory(category){
    selectedCategory=category;
    const host=ensurePanel();
    const state=categoryState.get(category)||{visible:0,total:0};
    const preview=categoryPreviews.get(category)||[];
    const title=host.querySelector('#esafePreviewTitle');
    const meta=host.querySelector('#esafePreviewMeta');
    const list=host.querySelector('#esafePreviewList');
    if(title)title.textContent=category;
    if(meta)meta.textContent=`${state.visible} visible now · ${state.total} total records · latest 3 shown`;
    if(list){
      list.innerHTML=preview.length?preview.map(record=>`<a href="${record.url||'#'}" target="_blank" rel="noopener" style="display:grid;grid-template-columns:72px 1fr auto;gap:8px;align-items:center;text-decoration:none;color:inherit;border:1px solid rgba(164,193,227,.16);border-radius:11px;padding:8px;background:rgba(255,255,255,.025)"><span style="font-size:9px;color:#9bb0c8">${record.date||'—'}</span><span style="min-width:0"><strong style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${String(record.title||record.id)}</strong><small style="color:#9bb0c8">${record.core?'CORE PILOT · ':''}${record.fileCount||0} file${record.fileCount===1?'':'s'}</small></span><span style="font-size:16px">›</span></a>`).join(''):'<div style="padding:12px;border:1px dashed rgba(164,193,227,.18);border-radius:11px;color:#9bb0c8">No records are available in this category at the current timeline position.</div>';
    }
    host.setAttribute('aria-hidden','false');
    host.style.opacity='1';
    host.style.pointerEvents='auto';
    host.style.transform='translate(-50%,0)';
  }

  function mapCanonicalNodes(){
    if(mapped)return true;
    const all=Array.from(document.querySelectorAll('[data-node-id]'));
    if(!all.length)return false;
    const project=all.find(node=>node.getAttribute('data-node-id')==='proj')||all[0];
    if(project){
      setNodeText(project,'e-SAFE Catania Real Pilot','Active Project World');
      project.dataset.esafeProject='true';
    }

    const candidates=all.filter(node=>node!==project).slice(0,CATEGORY_ORDER.length);
    if(candidates.length<CATEGORY_ORDER.length)return false;
    categoryNodes=candidates;
    CATEGORY_ORDER.forEach((category,index)=>{
      const state=categoryState.get(category);
      const node=candidates[index];
      setNodeText(node,category,`${state.visible} / ${state.total} records`);
      node.dataset.esafeCategory=category;
      const button=node.querySelector('button');
      button?.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        openCategory(category);
      },true);
    });
    mapped=true;
    document.documentElement.dataset.esafeGraphHydrated='true';
    return true;
  }

  function renderCounts(detail){
    if(detail?.categoryCounts){
      CATEGORY_ORDER.forEach(category=>{
        const next=detail.categoryCounts[category]||{};
        categoryState.set(category,{visible:Number(next.visible||0),total:Number(next.total||0)});
      });
    }
    if(detail?.categoryPreviews){
      CATEGORY_ORDER.forEach(category=>categoryPreviews.set(category,Array.isArray(detail.categoryPreviews[category])?detail.categoryPreviews[category]:[]));
    }
    if(!mapCanonicalNodes())return;
    CATEGORY_ORDER.forEach((category,index)=>{
      const state=categoryState.get(category)||{visible:0,total:0};
      const node=categoryNodes[index];
      setNodeText(node,category,`${state.visible} / ${state.total} records`);
      const future=state.total>0&&state.visible===0;
      node.classList.toggle('nexus-time-future',future);
      node.style.opacity=future?'0.34':'1';
    });
    if(selectedCategory)openCategory(selectedCategory);
  }

  const scan=()=>{
    if(mapCanonicalNodes())renderCounts(window.__NEXUS_PROJECT_TIME__||{});
    else window.setTimeout(scan,180);
  };

  window.addEventListener('nexus:project-time-change',event=>renderCounts(event.detail||{}));
  window.addEventListener('DOMContentLoaded',()=>window.setTimeout(scan,120));
})();
