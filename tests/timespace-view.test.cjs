const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const sourceRoot='apps/nexus-graph-preview/relationship-tree/src/';
const sources={catalog:fs.readFileSync(sourceRoot+'project-files.js','utf8'),model:fs.readFileSync(sourceRoot+'timespace-model.js','utf8'),view:fs.readFileSync(sourceRoot+'timespace-view.js','utf8')};
function dataset(){const ctx={window:{},URL};vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/local-files.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/file-playback.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/timespace-player.js','utf8'),ctx);vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/data.js','utf8'),ctx);vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/files.js','utf8'),ctx);vm.runInContext(sources.catalog,ctx);return {records:ctx.window.ESAFE_RECORDS,files:ctx.nxEsafeCatalog(ctx.window.ESAFE_RECORDS)}}
async function harness({map=false,query='?world=esafe-demo',saved=null,groups=null}={}){
 const dom=new JSDOM('<button id="origin">Origin</button><div id="mount"></div>',{url:'https://example.test/'+query}),w=dom.window;
 global.window=w;global.document=w.document;global.navigator=w.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),ReactDOM=require('react-dom'),{createRoot}=require('react-dom/client'),jsx=require('react/jsx-runtime');
 const data=dataset(),storageKey='nosmo.timespace:v1:esafe-demo';w.__NEXUS_PROJECT_WORLD__='esafe-demo';w.ESAFE_RECORDS=data.records;
 if(saved)w.localStorage.setItem(storageKey,JSON.stringify(saved));if(groups)w.localStorage.setItem('nosmo-tile-groups:v2:esafe-demo',JSON.stringify(groups));
 const ids=['proj','p-mateusz','p-sitemgr','p-architect','p-client','p-team','d-groundfloor','d-doorschedule','d-siteinstructions','d-snaglist','d-firecerts','t-install','t-snag','t-fire','t-walkthrough','t-doorkits'];
 const objects=ids.map(id=>({id,label:id,type:id==='proj'?'project':id.startsWith('p-')?'person':id.startsWith('d-')?'document':'task',Icon:()=>null}));
 const ctx={window:w,document:w.document,localStorage:w.localStorage,URL,URLSearchParams,CustomEvent:w.CustomEvent,b:React,s:jsx,ko:ReactDOM,ns:objects,Dt:()=>null,CU:()=>null,gc:{project:{},person:{},task:{},document:{}},crypto:require('node:crypto').webcrypto,
  ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},getComputedStyle:w.getComputedStyle,_w:z=>Math.max(.3,Math.min(1.3,z)),EU:(items,root,edges,pinned)=>new Map(items.map((o,index)=>[o.id,pinned[o.id]||{x:index*150,y:index%2*200}]))};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/local-files.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/file-playback.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/timespace-player.js','utf8'),ctx);vm.runInContext(fs.readFileSync(sourceRoot+'tile-groups.js','utf8')+'\n'+sources.catalog+'\n'+sources.model+'\n'+sources.view+(map?'\n'+fs.readFileSync(sourceRoot+'relationship-map.js','utf8'):''),ctx);
 let root=createRoot(w.document.getElementById('mount')),closed=0,revealed=null,filesOpened=0,restoredFocus=null;
 const props={files:data.files,onClose:()=>closed++,onReveal:id=>revealed=id,onOpenFiles:()=>filesOpened++};
 const render=()=>React.act(()=>root.render(jsx.jsx(map?ctx.AU:ctx.NexusTimeSpaceCatalog,map?{}:props)));
 const click=selector=>React.act(()=>{const el=typeof selector==='string'?w.document.querySelector(selector):selector;assert.ok(el,'Missing click target '+selector);el.click()});
 const button=text=>[...w.document.querySelectorAll('button')].find(el=>el.textContent===text);
 const select=(selector,value)=>React.act(()=>{const el=w.document.querySelector(selector);assert.ok(el,'Missing select '+selector);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}))});
 const rows=()=>[...w.document.querySelectorAll('#nexusTimeSpaceCatalog article[data-record-id]')];
 const summary=()=>w.document.querySelector('.nx-ts-summary')?.textContent;
 const state=()=>JSON.parse(w.localStorage.getItem(storageKey));
 const remount=async()=>{await React.act(()=>root.unmount());root=createRoot(w.document.getElementById('mount'));await render()};
 const cleanup=async()=>{await React.act(()=>root.unmount());restoredFocus=w.document.activeElement?.id;w.close()};
 w.document.getElementById('origin').focus();await render();return{dom,w,ctx,React,data,click,button,select,rows,summary,state,remount,cleanup,results:()=>({closed,revealed,filesOpened,restoredFocus})};
}

test('TimeSpace renders all source groups and six publication years; year/place intersection and Clear filters work',async()=>{
 const h=await harness();try{
  assert.equal(h.rows().length,95);assert.equal(h.w.document.querySelectorAll('[data-timespace-file]').length,106);assert.match(h.summary(),/^95 records · 106 files/);
  const years=[...h.w.document.querySelectorAll('[data-year]')].filter(el=>el.dataset.year!=='all').map(el=>[el.dataset.year,el.querySelector('small').textContent]);
  assert.deepEqual(years,[['2021','18 files'],['2022','33 files'],['2023','11 files'],['2024','17 files'],['2025','9 files'],['2026','18 files']]);
  assert.equal(h.w.document.querySelector('[data-record-id="10843361"] time').textContent,'2023 (year only)');assert.equal(h.w.document.querySelector('[data-record-id="10908487"] time').textContent,'2023-10 (month only)');
  await h.click('[data-year="2022"]');assert.equal(h.rows().length,22);assert.match(h.summary(),/^22 records · 33 files/);
  await h.click('[data-year="all"]');await h.click('[data-location="building"]');assert.equal(h.rows().length,4);assert.match(h.summary(),/^4 records · 4 files/);
  await h.click('[data-year="2022"]');assert.equal(h.rows().length,2);assert.match(h.summary(),/^2 records · 2 files/);
  await h.click('[data-year="2021"]');assert.equal(h.rows().length,0);assert.match(h.w.document.querySelector('.nx-ts-empty').textContent,/Clear filters/);
  await h.click(h.button('Clear filters'));assert.equal(h.rows().length,95);assert.equal(h.state().year,'all');assert.equal(h.state().location,'all');
  await h.select('[aria-label="TimeSpace topic"]','BIM');assert.equal(h.w.document.querySelectorAll('[data-timespace-file]').length,4);assert.ok(h.rows().every(row=>/BIM/.test(row.querySelector('.nx-ts-event-head small').textContent)));
 }finally{await h.cleanup()}
});

test('record location assignments, view filters and source defaults survive reload and support Undo location',async()=>{
 const h=await harness();try{
  const selector='[aria-label="Location for source 6260847"]';
  await h.select(selector,'level-1');assert.equal(h.state().bindings['d-snaglist'],'level-1');assert.match(h.w.document.querySelector('[data-record-id="6260847"] .nx-ts-location-row').textContent,/Manual location · Level 1/);
  await h.click(h.button('Undo location'));assert.equal(Object.hasOwn(h.state().bindings,'d-snaglist'),false);assert.match(h.w.document.querySelector('[data-record-id="6260847"] .nx-ts-location-row').textContent,/Source location · Catania pilot building/);
  await h.select(selector,'level-1');await h.click('[data-year="2022"]');await h.click('[data-location="level-1"]');assert.equal(h.rows().length,1);
  await h.remount();assert.equal(h.rows().length,1);assert.equal(h.state().bindings['d-snaglist'],'level-1');assert.equal(h.w.document.querySelector('[data-year="2022"]').getAttribute('aria-pressed'),'true');assert.equal(h.w.document.querySelector('[data-location="level-1"]').getAttribute('aria-pressed'),'true');
  await h.select(selector,'auto');assert.equal(Object.hasOwn(h.state().bindings,'d-snaglist'),false);assert.equal(h.rows().length,0);
  await h.click(h.button('Clear filters'));assert.equal(h.rows().length,95);assert.match(h.w.document.querySelector('[data-record-id="6260847"] .nx-ts-location-row').textContent,/Source location · Catania pilot building/);
  assert.equal(h.w.localStorage.getItem('nosmo.timespace:v1:dev'),null);
 }finally{await h.cleanup()}
});

test('failed storage cancels location changes; Show in tree, Files, Escape and focus restoration are functional',async()=>{
 const h=await harness();try{
  assert.equal(h.w.document.activeElement.getAttribute('aria-label'),'Close catalog');
  const stored=h.w.localStorage.getItem('nosmo.timespace:v1:esafe-demo'),original=h.w.Storage.prototype.setItem;
  h.w.Storage.prototype.setItem=()=>{throw Error('Quota exceeded')};
  try{await h.select('[aria-label="Location for source 6260847"]','level-1')}finally{h.w.Storage.prototype.setItem=original}
  assert.match(h.w.document.querySelector('[role="alert"]').textContent,/Could not save/);assert.equal(h.w.localStorage.getItem('nosmo.timespace:v1:esafe-demo'),stored);assert.equal(h.w.document.querySelector('[aria-label="Location for source 6260847"]').value,'auto');
  const first=h.w.document.querySelector('[data-timespace-file]');await h.click(first.querySelector('button'));assert.equal(h.results().revealed,first.dataset.timespaceFile);
  await h.click(h.button('Files · 106'));assert.equal(h.results().filesOpened,1);
  await h.React.act(()=>h.w.document.querySelector('#nexusTimeSpaceCatalog').dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.equal(h.results().closed,1);
 }finally{await h.cleanup()}
 assert.equal(h.results().restoredFocus,'origin');
});

test('TIME opens TimeSpace in the existing map; deep links retain filters, spatial assignments leave manual graph groups intact',async()=>{
 const workspace={version:2,groups:[{id:'nx-group-existing',members:['d-firecerts','p-client']}],pinned:{'nx-group-existing':{x:200,y:50}}};
 const h=await harness({map:true,groups:workspace});try{
  assert.equal(h.w.document.querySelector('#nexusTimeSpaceCatalog'),null);assert.equal(h.w.document.querySelector('#nexusProjectFiles'),null);
  await h.React.act(()=>h.w.dispatchEvent(new h.w.CustomEvent('nexus:open-timespace')));
  assert.ok(h.w.document.querySelector('#nexusTimeSpace'));await h.click(h.w.document.querySelector('[data-cmd="catalog"]'));assert.ok(h.w.document.querySelector('#nexusTimeSpaceCatalog'));assert.equal(h.w.document.querySelector('#nexusProjectFiles'),null);assert.equal(h.rows().length,95);assert.equal(new URL(h.w.location.href).searchParams.get('view'),'timespace');
  const groupKey='nosmo-tile-groups:v2:esafe-demo',before=h.w.localStorage.getItem(groupKey);
  await h.select('[aria-label="Location for source 6260847"]','level-1');await h.click('[data-year="2022"]');await h.click('[data-location="level-1"]');assert.equal(h.rows().length,1);assert.equal(h.w.localStorage.getItem(groupKey),before);
  await h.remount();assert.ok(h.w.document.querySelector('#nexusTimeSpace'));await h.click(h.w.document.querySelector('[data-cmd="catalog"]'));assert.ok(h.w.document.querySelector('#nexusTimeSpaceCatalog'));assert.equal(h.w.document.querySelector('#nexusProjectFiles'),null);assert.equal(h.rows().length,1);assert.equal(h.state().year,'2022');assert.equal(h.state().location,'level-1');assert.equal(h.w.localStorage.getItem(groupKey),before);
  await h.click(h.w.document.querySelector('[data-timespace-file="d-snaglist"] button'));assert.equal(h.w.document.querySelector('#nexusTimeSpaceCatalog'),null);assert.equal(h.w.document.querySelector('#nexusProjectFiles'),null);assert.ok(h.w.document.querySelector('[data-node-id="d-snaglist"]'));assert.equal(new URL(h.w.location.href).searchParams.has('view'),true);assert.equal(new URL(h.w.location.href).searchParams.get('file'),'d-snaglist');
  assert.equal(h.w.localStorage.getItem(groupKey),before);
 }finally{await h.cleanup()}
});
