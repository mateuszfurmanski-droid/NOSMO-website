// NEXUS_ESAFE_EMBEDDED_ADAPTER_V1
(()=>{
  if(document.documentElement.dataset.nexusEmbedded!=='true')return;
  if((window.__NEXUS_PROJECT_WORLD__||'')!=='esafe-demo')return;

  const CATEGORY_ORDER=['Survey','BIM','Design','Production','Construction','Testing','Research','Communication'];
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim();

  const categoryState=new Map(CATEGORY_ORDER.map(name=>[name,{visible:0,total:0}]));
  let mapped=false;
  let categoryNodes=[];

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
      setNodeText(candidates[index],category,`${state.visible} / ${state.total} records`);
      candidates[index].dataset.esafeCategory=category;
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
    if(!mapCanonicalNodes())return;
    CATEGORY_ORDER.forEach((category,index)=>{
      const state=categoryState.get(category)||{visible:0,total:0};
      const node=categoryNodes[index];
      setNodeText(node,category,`${state.visible} / ${state.total} records`);
      const future=state.total>0&&state.visible===0;
      node.classList.toggle('nexus-time-future',future);
      node.style.opacity=future?'0.34':'1';
    });
  }

  const scan=()=>{
    if(mapCanonicalNodes())renderCounts(window.__NEXUS_PROJECT_TIME__||{});
    else window.setTimeout(scan,180);
  };

  window.addEventListener('nexus:project-time-change',event=>renderCounts(event.detail||{}));
  window.addEventListener('DOMContentLoaded',()=>window.setTimeout(scan,120));
})();
