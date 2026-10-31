const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const {IDBFactory}=require('fake-indexeddb');
const sourceRoot='apps/nexus-graph-preview/relationship-tree/src/';
const modules=['tile-groups.js','local-files.js','file-playback.js','project-files.js','timespace-model.js','file-lifecycle.js','graph-history.js','relationship-map.js'];
async function harness({seed=null,at=Date.UTC(2026,10,1,12),realPlayer=false,query='?world=esafe-demo'}={}){
 const dom=new JSDOM('<div id="mount"></div>',{url:'https://example.test/'+query}),w=dom.window;
 global.window=w;global.document=w.document;global.navigator=w.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),{createRoot}=require('react-dom/client'),jsx=require('react/jsx-runtime'),ReactDOM=require('react-dom');
 const clock={now:at},timers=new Map(),intervals=new Map();let timerId=0,playerFiles=[];
 class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock.now]))}static now(){return clock.now}}
 const factory=new IDBFactory();Object.defineProperty(w,'indexedDB',{value:factory});w.__NEXUS_PROJECT_WORLD__='esafe-demo';
 const ids=['proj','p-mateusz','p-sitemgr','p-architect','p-client','p-team','d-groundfloor','d-doorschedule','d-snaglist','d-firecerts','t-install','t-snag','t-fire','t-walkthrough'];
 const ns=ids.map(id=>({id,label:id,type:id==='proj'?'project':id.startsWith('p-')?'person':id.startsWith('d-')?'document':'task',Icon:()=>null}));
 const ctx={window:w,document:w.document,localStorage:w.localStorage,indexedDB:factory,URL,URLSearchParams,Date:ClockDate,CustomEvent:w.CustomEvent,b:React,s:jsx,ko:ReactDOM,ns,Dt:()=>null,CU:()=>null,gc:{project:{},person:{},task:{},document:{}},crypto:require('node:crypto').webcrypto,
  ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},getComputedStyle:w.getComputedStyle,setInterval:fn=>{const id=++timerId;intervals.set(id,fn);return id},clearInterval:id=>intervals.delete(id),setTimeout:(fn,delay)=>{const id=++timerId;timers.set(id,{fn,at:clock.now+delay});return id},clearTimeout:id=>timers.delete(id),_w:z=>Math.max(.3,Math.min(1.3,z)),EU:(items,root,edges,pinned)=>new Map(items.map((o,index)=>[o.id,pinned[o.id]||{x:index*150,y:index%2*200}]))};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/data.js','utf8'),ctx);vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/files.js','utf8'),ctx);const loaded=realPlayer?[...modules.slice(0,-1),'timespace-view.js','timespace-player.js',modules[modules.length-1]]:modules;vm.runInContext(loaded.map(name=>fs.readFileSync(sourceRoot+name,'utf8')).join('\n'),ctx);
 if(!realPlayer)ctx.NexusTimeSpace=props=>{playerFiles=props.files;return jsx.jsx('section',{id:'nexusTimeSpace',children:jsx.jsx('button',{'aria-label':'Close TimeSpace',onClick:props.onClose,children:'Close'})})};
 const seeded=seed?await seed({ctx,w,clock}):null;
 let root=createRoot(w.document.getElementById('mount'));
 const flush=async()=>{for(let i=0;i<2;i++){await ctx.nxLocalFilesList('esafe-demo');await new Promise(setImmediate)}};
 const act=async fn=>React.act(async()=>{if(fn)await fn();await flush()});
 const render=async()=>{await act(()=>root.render(jsx.jsx(ctx.AU,{})));await act()};
 const click=selector=>act(()=>{const el=typeof selector==='string'?w.document.querySelector(selector):selector;assert.ok(el,'Missing click target '+selector);el.click()});
 const node=id=>w.document.querySelector(`[data-node-id="${id}"]`),docs=()=>[...w.document.querySelectorAll('[data-node-id] button[aria-label^="document:"]')];
 const archive=()=>node('nexus-archive'),count=()=>Number(archive().querySelector('.nx-group-count').textContent);
 const tick=async target=>act(()=>{clock.now=target;for(const [id,timer] of [...timers])if(timer.at<=target){timers.delete(id);timer.fn()}});
 const replay=async(at,fileId='d-firecerts')=>{await act(()=>w.dispatchEvent(new w.CustomEvent('nexus:open-timespace')));await act(()=>w.dispatchEvent(new w.CustomEvent('nexus:timespace-current-file',{detail:{world:'esafe-demo',mode:'replay',at,fileId}})))};
 const remount=async()=>{await act(()=>root.unmount());root=createRoot(w.document.getElementById('mount'));await render()};
 const cleanup=async()=>{await act(()=>root.unmount());w.close()};
 await render();return{w,ctx,clock,timers,act,click,node,docs,archive,count,tick,replay,remount,cleanup,seeded,playerFiles:()=>playerFiles};
}
const file=()=>new File(['kept device bytes'],'Level_1_device_plan.pdf',{type:'application/pdf',lastModified:Date.UTC(2020,4,20)});

test('one nearest deadline archives a local file automatically without deleting bytes, retains one fixed Archive and reactivates',async()=>{
 const h=await harness({seed:async({ctx})=>(await ctx.nxLocalFilesAdd('esafe-demo',[file()]))[0]});try{
  const local=h.seeded;assert.equal(h.docs().length,107);assert.equal(h.count(),0);assert.equal(h.w.document.querySelectorAll('[data-archive-tile]').length,1);
  await h.act(()=>h.ctx.nxFileLifecycleSet('esafe-demo',local.id,new Date(h.clock.now+1000).toISOString()));assert.equal(h.timers.size,1);
  await h.tick(h.clock.now+1001);assert.equal(h.docs().length,106);assert.equal(h.node(local.id),null);assert.equal(h.count(),1);assert.equal(h.timers.size,0);assert.equal(h.w.document.querySelectorAll('[data-archive-tile]').length,1);
  assert.equal((await h.ctx.nxLocalFilesList('esafe-demo')).length,1);assert.equal(await(await h.ctx.nxLocalFileBlob('esafe-demo',local.id)).text(),'kept device bytes');
  await h.click(h.archive().querySelector('button'));assert.equal(h.w.document.querySelector('[data-file-status-filter="archived"]')?.getAttribute('aria-pressed'),'true');assert.ok(h.w.document.querySelector(`[data-file-id="${local.id}"]`));
  await h.click('[aria-label="Close project files"]');await h.act(()=>h.ctx.nxFileLifecycleSet('esafe-demo',local.id,null));assert.ok(h.node(local.id));assert.equal(h.docs().length,107);assert.equal(h.count(),0);
 }finally{await h.cleanup()}
});

test('expiry hides only the archived group member while preserving full manual membership, even after reopening',async()=>{
 const key='nosmo-tile-groups:v2:esafe-demo';
 const h=await harness({seed:async({ctx,w,clock})=>{const workspace={version:2,groups:[{id:'nx-group-preserved',members:['d-firecerts','p-client']}],pinned:{}};w.localStorage.setItem(key,JSON.stringify(workspace));ctx.nxFileLifecycleSet('esafe-demo','d-firecerts',new Date(clock.now-1).toISOString());return workspace}});try{
  const before=h.w.localStorage.getItem(key);assert.equal(h.count(),1);assert.ok(h.node('nx-group-preserved'));assert.equal(h.node('nx-group-preserved').dataset.groupMembers,'p-client');
  await h.click(h.node('nx-group-preserved').querySelector('button'));assert.ok(h.node('p-client'));assert.equal(h.node('d-firecerts'),null);assert.equal(h.w.localStorage.getItem(key),before);
  await h.remount();assert.equal(h.node('d-firecerts'),null);assert.equal(h.count(),1);assert.equal(h.w.localStorage.getItem(key),before);
  await h.act(()=>h.ctx.nxFileLifecycleSet('esafe-demo','d-firecerts',null));await h.click(h.node('nx-group-preserved').querySelector('button'));assert.ok(h.node('d-firecerts'));assert.equal(h.node('nx-group-preserved').dataset.groupMembers,'d-firecerts,p-client');assert.equal(h.w.localStorage.getItem(key),before);
 }finally{await h.cleanup()}
});

test('source births and deactivation are projected at the selected replay instant; player retains the complete archive and close restores live',async()=>{
 const h=await harness();try{
  const now=h.clock.now,deadline=now+5000;await h.act(()=>h.ctx.nxFileLifecycleSet('esafe-demo','d-firecerts',new Date(deadline).toISOString()));
  assert.equal(h.docs().length,106);await h.replay(Date.parse('2020-01-01T00:00:00Z'));assert.equal(h.docs().length,0);assert.equal(h.count(),0);assert.equal(h.playerFiles().length,106);
  await h.replay(Date.parse('2021-06-28T00:00:00Z'),'esafe-file-5607218-0');assert.equal(h.docs().length,1);assert.ok(h.node('esafe-file-5607218-0'));assert.ok(h.node('esafe-file-5607218-0').hasAttribute('data-timespace-active'));assert.ok(h.node('proj').hasAttribute('data-timespace-active'));
  await h.replay(deadline-1);assert.ok(h.node('d-firecerts'));assert.equal(h.count(),0);
  await h.replay(deadline);assert.equal(h.node('d-firecerts'),null);assert.equal(h.count(),1);assert.equal(h.playerFiles().length,106);assert.ok(h.archive().hasAttribute('data-timespace-active'));
  await h.click('[aria-label="Close TimeSpace"]');assert.ok(h.node('d-firecerts'));assert.equal(h.count(),0);assert.equal(h.w.document.querySelector('[data-zoom]').hasAttribute('data-replay'),false);
 }finally{await h.cleanup()}
});

test('observed connection snapshots appear and disappear in replay, unknown earlier groups are never invented, and replay edits are blocked',async()=>{
 const key='nosmo-tile-groups:v2:esafe-demo';
 const h=await harness({seed:async({ctx,w,clock})=>{const groups=[{id:'nx-group-known',members:['d-firecerts','p-client']}];w.localStorage.setItem(key,JSON.stringify({version:2,groups:[],pinned:{}}));ctx.nxGraphHistoryEnsure('esafe-demo',groups,new Date(clock.now-2000).toISOString());ctx.nxGraphHistoryRecord('esafe-demo',[],new Date(clock.now-500).toISOString())}});try{
  const before=h.w.localStorage.getItem(key),now=h.clock.now;await h.replay(now-3000);assert.equal(h.node('nx-group-known'),null);assert.match(h.w.document.querySelector('.nx-group-guide [role="status"]').textContent,/history is unknown/);assert.ok([...h.w.document.querySelectorAll('line[data-connection-id]')].every(line=>line.dataset.connectionId.startsWith('proj|')));
  assert.equal(h.w.document.querySelector('[aria-label="Reset demo"]').disabled,true);
  const source=h.node('d-firecerts').querySelector('button'),graph=h.w.document.querySelector('[data-zoom]');
  const send=(el,type,x,y)=>{const event=new h.w.MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0});Object.defineProperties(event,{pointerId:{value:1},pointerType:{value:'mouse'}});el.dispatchEvent(event)};
  await h.act(()=>{send(source,'pointerdown',10,10);send(graph,'pointerup',100,100)});assert.equal(h.w.localStorage.getItem(key),before);
  await h.replay(now-1000);assert.ok(h.node('nx-group-known'));assert.ok(h.node('d-firecerts'));assert.equal(h.node('nx-group-known').querySelector('button').getAttribute('aria-expanded'),'true');await h.replay(now);assert.equal(h.node('nx-group-known'),null);await h.replay(now-1000);assert.ok(h.node('nx-group-known'));assert.equal(h.w.localStorage.getItem(key),before);
 }finally{await h.cleanup()}
});

test('background expiry and externally changed schedules refresh on focus, visibility and storage without waiting for throttled timers',async()=>{
 const h=await harness();try{
  const at=h.clock.now+1000;await h.act(()=>h.ctx.nxFileLifecycleSet('esafe-demo','d-firecerts',new Date(at).toISOString()));assert.ok(h.node('d-firecerts'));
  h.clock.now=at+10;await h.act(()=>h.w.dispatchEvent(new h.w.Event('focus')));assert.equal(h.node('d-firecerts'),null);assert.equal(h.count(),1);
  h.w.localStorage.setItem(h.ctx.nxFileLifecycleKey('esafe-demo'),'{}');await h.act(()=>h.w.dispatchEvent(new h.w.StorageEvent('storage',{key:h.ctx.nxFileLifecycleKey('esafe-demo')})));assert.ok(h.node('d-firecerts'));assert.equal(h.count(),0);
  await h.act(()=>h.ctx.nxFileLifecycleSet('esafe-demo','d-firecerts',new Date(h.clock.now+1000).toISOString()));h.clock.now+=1010;Object.defineProperty(h.w.document,'hidden',{value:false,configurable:true});await h.act(()=>h.w.document.dispatchEvent(new h.w.Event('visibilitychange')));assert.equal(h.node('d-firecerts'),null);assert.equal(h.count(),1);
 }finally{await h.cleanup()}
});


test('fresh TimeSpace URL catches the real player initial publication event before passive effects and Live restores the full graph',async()=>{
 const h=await harness({realPlayer:true,query:'?world=esafe-demo&view=timespace'});try{
  assert.ok(h.w.document.querySelector('#nexusTimeSpace'));assert.equal(h.docs().length,1);
  const first=h.ctx.nxTimeSpaceSequence(h.ctx.nxEsafeCatalog(h.w.ESAFE_RECORDS))[0];
  assert.ok(h.node(first.id));assert.ok(h.node(first.id).querySelector('.nx-tile-selected'));assert.equal(h.w.document.querySelector('[data-zoom]').dataset.replay,'true');
  assert.equal(new URL(h.w.location.href).searchParams.get('file'),first.id);
  const camera=h.w.document.querySelector('[data-graph-camera]').style.transform;assert.notEqual(camera,'translate(0px,0px) scale(0.72)');
  assert.equal(h.w.document.querySelector('.nx-pti-event strong').textContent,first.name);
  await h.click('[aria-label="Return to live tree"]');assert.equal(h.docs().length,106);assert.equal(h.w.document.querySelector('[data-zoom]').hasAttribute('data-replay'),false);assert.ok(h.w.document.querySelector('#nexusTimeSpace'));
 }finally{await h.cleanup()}
});
