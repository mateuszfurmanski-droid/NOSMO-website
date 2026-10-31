const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const {IDBFactory}=require('fake-indexeddb');
const sourceRoot='apps/nexus-graph-preview/relationship-tree/src/';
const sourceNames=['tile-groups.js','local-files.js','file-playback.js','project-files.js','timespace-model.js','timespace-view.js','timespace-player.js','relationship-map.js'];
const appSource=sourceNames.map(name=>fs.readFileSync(sourceRoot+name,'utf8')).join('\n');
const makeFile=(name,content='saved bytes',type='application/pdf')=>new File([content],name,{type,lastModified:Date.UTC(2020,4,20)});
async function mapHarness({beforeMount=null,uuid=null}={}) {
 const dom=new JSDOM('<button id="origin">Origin</button><input id="nexusFileInput" type="file" multiple><div id="mount"></div>',{url:'https://example.test/?world=esafe-demo'}),w=dom.window;
 global.window=w;global.document=w.document;global.navigator=w.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),ReactDOM=require('react-dom'),{createRoot}=require('react-dom/client'),jsx=require('react/jsx-runtime');
 const factory=new IDBFactory();Object.defineProperty(w,'indexedDB',{value:factory});w.__NEXUS_PROJECT_WORLD__='esafe-demo';
 const ids=['proj','p-mateusz','p-sitemgr','p-architect','p-client','p-team','d-groundfloor','d-doorschedule','d-siteinstructions','d-snaglist','d-firecerts','t-install','t-snag','t-fire','t-walkthrough','t-doorkits'];
 const ns=ids.map(id=>({id,label:id,type:id==='proj'?'project':id.startsWith('p-')?'person':id.startsWith('d-')?'document':'task',Icon:()=>null}));
 const ctx={window:w,document:w.document,localStorage:w.localStorage,indexedDB:factory,URL,URLSearchParams,CustomEvent:w.CustomEvent,b:React,s:jsx,ko:ReactDOM,ns,Dt:()=>null,CU:()=>null,gc:{project:{},person:{},task:{},document:{}},crypto:uuid?{randomUUID:uuid}:require('node:crypto').webcrypto,
  ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},getComputedStyle:w.getComputedStyle,setInterval,clearInterval,_w:z=>Math.max(.3,Math.min(1.3,z)),EU:(items,root,edges,pinned)=>new Map(items.map((o,index)=>[o.id,pinned[o.id]||{x:index*150,y:index%2*200}]))};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/data.js','utf8'),ctx);vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/files.js','utf8'),ctx);vm.runInContext(appSource,ctx);
 const seed=beforeMount?await beforeMount({ctx,w}):null;
 let root=createRoot(w.document.getElementById('mount'));
 const flush=async()=>{for(let i=0;i<3;i++){await ctx.nxLocalFilesList('esafe-demo');await new Promise(setImmediate)}};
 const act=async action=>React.act(async()=>{if(action)await action();await flush()});
 const render=async()=>{await act(()=>root.render(jsx.jsx(ctx.AU,{})));await act()};
 const click=selector=>act(()=>{const el=typeof selector==='string'?w.document.querySelector(selector):selector;assert.ok(el,'Missing click target '+selector);el.click()});
 const count=()=>Number(w.document.querySelector('[data-catania-file-count]').dataset.cataniaFileCount);
 const node=id=>w.document.querySelector(`[data-node-id="${id}"]`);
 const docs=()=>[...w.document.querySelectorAll('[data-node-id]')].filter(el=>el.querySelector('button')?.getAttribute('aria-label')?.startsWith('document:'));
 const close=async()=>{await act(()=>root.unmount());w.close()};
 const remount=async()=>{await act(()=>root.unmount());root=createRoot(w.document.getElementById('mount'));await render()};
 await render();return{w,ctx,React,act,click,count,node,docs,close,remount,seed};
}
function yOf(node){const match=node.style.transform.match(/translate\([^,]+,\s*(-?[\d.]+)px\)/);assert.ok(match,'Node has an explicit y position');return Number(match[1])}

test('actual local add updates catalog and complete graph automatically in chronological order; trash and restore update both',async()=>{
 const h=await mapHarness();try{
  assert.equal(h.count(),106);assert.equal(h.docs().length,106);
  const sources=h.ctx.nxEsafeCatalog(h.w.ESAFE_RECORDS),sequence=Array.from(h.ctx.nxTimeSpaceSequence(sources));
  const initial=h.docs().slice().sort((a,b)=>yOf(a)-yOf(b));assert.deepEqual(initial.map(el=>el.dataset.nodeId),sequence.map(file=>file.id));assert.equal(new Set(initial.map(yOf)).size,106);
  let added;await h.act(async()=>{added=await h.ctx.nxLocalFilesAdd('esafe-demo',[makeFile('Level_2_ventilation_inspection.pdf')])});
  const file=added[0];assert.equal(h.count(),107);assert.equal(h.docs().length,107);assert.ok(h.node(file.id));assert.equal(file.dateRaw,file.addedAt.slice(0,10));assert.equal(file.modifiedAt,'2020-05-20T00:00:00.000Z');assert.equal(file.kind,'PDF');assert.equal(file.suggestedLocation,'level-2');assert.equal(file.category,'Testing');
  const ordered=Array.from(h.ctx.nxTimeSpaceSequence([...sources,file]));const positions=h.docs().slice().sort((a,b)=>yOf(a)-yOf(b));assert.deepEqual(positions.map(el=>el.dataset.nodeId),ordered.map(file=>file.id));assert.equal(new Set(positions.map(yOf)).size,107);
  await h.remount();assert.equal(h.count(),107);assert.equal(h.docs().length,107);assert.ok(h.node(file.id));
  const reread=(await h.ctx.nxLocalFilesList('esafe-demo'))[0];assert.equal(reread.addedAt,file.addedAt);assert.equal(reread.suggestedLocation,'level-2');assert.equal(reread.kind,'PDF');assert.equal(await(await h.ctx.nxLocalFileBlob('esafe-demo',file.id)).text(),'saved bytes');
  await h.act(()=>h.ctx.nxLocalFilesTrash('esafe-demo',[file.id]));assert.equal(h.count(),106);assert.equal(h.docs().length,106);assert.equal(h.node(file.id),null);
  await h.act(()=>h.ctx.nxLocalFilesRestore('esafe-demo',[file.id]));assert.equal(h.count(),107);assert.equal(h.docs().length,107);assert.ok(h.node(file.id));
 }finally{await h.close()}
});

test('legacy file input uses the ingestion pipeline once, opens the player and preserves device metadata after reload',async()=>{
 const h=await mapHarness();try{
  const input=h.w.document.getElementById('nexusFileInput');let legacyCalls=0;input.addEventListener('change',()=>legacyCalls++);
  const local=makeFile('Level_1_walkthrough.mp4','video bytes','video/mp4');Object.defineProperty(input,'files',{value:[local],configurable:true});
  await h.act(()=>input.dispatchEvent(new h.w.Event('change',{bubbles:true})));
  assert.equal(legacyCalls,0);const files=await h.ctx.nxLocalFilesList('esafe-demo');assert.equal(files.length,1);assert.equal(h.count(),107);assert.equal(h.docs().length,107);assert.equal(files[0].kind,'Video');assert.equal(files[0].suggestedLocation,'level-1');assert.equal(input.value,'');assert.ok(h.w.document.querySelector('#nexusTimeSpace'));assert.equal(h.w.document.querySelector('#nexusProjectFiles'),null);
  const addedAt=files[0].addedAt;await h.remount();assert.equal(h.count(),107);assert.equal((await h.ctx.nxLocalFilesList('esafe-demo'))[0].addedAt,addedAt);
 }finally{await h.close()}
});

test('local group memberships survive asynchronous hydration and remount; player current-file events focus the existing graph without closing playback',async()=>{
 const groupKey='nosmo-tile-groups:v2:esafe-demo';
 const h=await mapHarness({beforeMount:async({ctx,w})=>{const [file]=await ctx.nxLocalFilesAdd('esafe-demo',[makeFile('L03_local_plan.pdf')]);const workspace={version:2,groups:[{id:'nx-group-device',members:[file.id,'d-firecerts']}],pinned:{'nx-group-device':{x:200,y:50}}};w.localStorage.setItem(groupKey,JSON.stringify(workspace));return{file,workspace}}});
 try{
  const {file,workspace}=h.seed,before=h.w.localStorage.getItem(groupKey);
  assert.equal(h.count(),107);assert.ok(h.node('nx-group-device'));assert.equal(h.node(file.id),null);assert.equal(h.w.localStorage.getItem(groupKey),JSON.stringify(workspace));
  await h.click(h.node('nx-group-device').querySelector('button'));assert.ok(h.node(file.id));assert.ok(h.node('d-firecerts'));assert.equal(h.w.localStorage.getItem(groupKey),before);
  await h.remount();assert.equal(h.count(),107);assert.ok(h.node('nx-group-device'));assert.equal(h.node(file.id),null);assert.equal(h.w.localStorage.getItem(groupKey),before);
  await h.act(()=>h.w.dispatchEvent(new h.w.CustomEvent('nexus:open-timespace')));assert.ok(h.w.document.querySelector('#nexusTimeSpace'));
  await h.act(()=>h.w.dispatchEvent(new h.w.CustomEvent('nexus:timespace-current-file',{detail:{world:'esafe-demo',fileId:file.id}})));
  assert.ok(h.w.document.querySelector('#nexusTimeSpace'));assert.equal(h.w.document.querySelector('#nexusProjectFiles'),null);assert.ok(h.node(file.id));assert.ok(h.node(file.id).querySelector('.nx-tile-selected'));assert.equal(h.node('nx-group-device').querySelector('button').getAttribute('aria-expanded'),'true');assert.equal(h.w.localStorage.getItem(groupKey),before);
 }finally{await h.close()}
});


test('files added in one batch keep their saved addition order when timestamps are identical',async()=>{
 const ids=['00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001'];
 const h=await mapHarness({uuid:()=>ids.shift()});try{
  let added;await h.act(async()=>{added=await h.ctx.nxLocalFilesAdd('esafe-demo',[makeFile('First in batch.pdf'),makeFile('Second in batch.pdf')])});
  assert.equal(added[0].addedAt,added[1].addedAt);assert.ok(added[0].additionOrder<added[1].additionOrder);
  const localIds=new Set(added.map(file=>file.id));const lane=h.docs().filter(node=>localIds.has(node.dataset.nodeId)).sort((a,b)=>yOf(a)-yOf(b));
  assert.deepEqual(lane.map(node=>node.dataset.nodeId),Array.from(added,file=>file.id));
 }finally{await h.close()}
});
