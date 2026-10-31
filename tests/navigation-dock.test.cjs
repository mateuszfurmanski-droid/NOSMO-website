const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
async function harness({world='esafe-demo',localFiles=[],failLocal=false,profile='manager'}={}){
 const dom=new JSDOM('<html data-nexus-unified-dock="true"><body><div id="mount"></div><div id="nexusShellScrim"></div><aside id="nexusMenuPanel" class="nexus-shell-panel" aria-hidden="true"><button data-nexus-close-panel>Close menu</button><div id="nexusSystemAccessProfile"></div></aside><aside id="nexusCloudPanel" aria-hidden="true"><button class="nx-cloud-close">Close cloud</button></aside><aside id="nexusSoftwarePanel"><button>Close soft</button></aside><aside id="nexusIntegrationsPanel"><button>Close integrations</button></aside><aside id="nexusProjectSwitcher"><button>Close switcher</button></aside><button id="nexusTopTime">Legacy time</button></body></html>',{url:'https://example.test/?world='+world});
 const w=dom.window;global.window=w;global.document=w.document;global.navigator=w.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),ReactDOM=require('react-dom'),{createRoot}=require('react-dom/client'),jsx=require('react/jsx-runtime');
 w.__NEXUS_PROJECT_WORLD__=world;w.localStorage.setItem('access-demo',profile);
 const calls=[];w.addEventListener('nexus:open-project-files',e=>calls.push(e.type));w.addEventListener('nexus:open-timespace',e=>calls.push(e.type));w.addEventListener('nexus:navigation-reveal-file',e=>calls.push({...e.detail}));
 const ctx={window:w,document:w.document,localStorage:w.localStorage,URL,URLSearchParams,CustomEvent:w.CustomEvent,b:React,s:jsx,ko:ReactDOM,Dw:'access-demo',Aw:p=>['manager','joiner','electrician'].includes(p),KB:{manager:{},joiner:{restricted:true},electrician:{}},oU:'demo',YB:role=>({visibleApps:role.restricted?['project','documents','tools']:['project','documents','people','tasks','tools','trades','system']}),aU:{project:'project',documents:'documents',people:'people',tasks:'tasks',system:'system',trades:'trades'},jk:[{id:'tools',items:[{label:'DoorSuite',href:'/doorsuite',accessApp:'tools'},{label:'FabStation',status:'disconnected',accessApp:'tools'},{label:'Private tool',href:'/private',accessApp:'not-visible'}]}],ns:[{id:'riverside-plan',type:'document',label:'Riverside drawing'}]};
 vm.createContext(ctx);for(const name of ['data.js','files.js'])vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/'+name,'utf8'),ctx);
 vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/local-files.js','utf8'),ctx);
 vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/project-files.js','utf8'),ctx);
 ctx.nxLocalFilesList=async()=>{if(failLocal)throw Error('unavailable');return localFiles};
 vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/navigation-dock.js','utf8'),ctx);
 let root=createRoot(w.document.getElementById('mount'));
 const act=fn=>React.act(async()=>{if(fn)await fn();await Promise.resolve();await new Promise(setImmediate)});
 const render=()=>act(()=>root.render(jsx.jsx(ctx.cU,{})));
 const click=selector=>act(()=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.click()});
 const change=(selector,value)=>act(()=>{const el=w.document.querySelector(selector),prototype=el.tagName==='SELECT'?w.HTMLSelectElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(el,value);el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));if(el.tagName!=='SELECT')el.dispatchEvent(new w.Event('change',{bubbles:true}))});
 const key=(selector,value)=>act(()=>w.document.querySelector(selector).dispatchEvent(new w.KeyboardEvent('keydown',{key:value,bubbles:true})));
 const dispose=async()=>{await act(()=>root.unmount());w.close()};
 await render();return{w,ctx,act,render,click,change,key,calls,dispose};
}
test('one native row owns Files/TimeSpace/Ask/System, Files expands upwards to project files and Cloud without a Docs or Cloud main tile',async()=>{
 const h=await harness();try{
  assert.equal(h.w.document.querySelectorAll('[aria-label="Nexus folder dock"]').length,1);
  const labels=[...h.w.document.querySelectorAll('[data-nx-nav]')].map(el=>el.getAttribute('aria-label'));assert.ok(labels.includes('Ask Nexus'));assert.ok(labels.includes('TimeSpace'));assert.ok(labels.includes('Files'));assert.ok(labels.includes('System'));assert.equal(labels.includes('Docs'),false);assert.equal(labels.includes('Cloud'),false);
  await h.click('[data-nx-nav="files"]');assert.equal(h.w.document.querySelector('[data-nx-nav="files"]').getAttribute('aria-expanded'),'true');assert.match(h.w.document.querySelector('#nexusDockFolder').textContent,/Project files.*Cloud sources/);
  const cloud=[...h.w.document.querySelectorAll('#nexusDockFolder button')].find(x=>x.textContent==='Cloud sources');await h.act(()=>cloud.click());assert.equal(h.w.document.getElementById('nexusDockFolder'),null);assert.equal(h.w.document.getElementById('nexusCloudPanel').getAttribute('aria-hidden'),'false');
  await h.click('[data-nx-nav="system"]');assert.equal(h.w.document.querySelectorAll('#nexusCloudPanel.open').length,0);assert.ok(h.w.document.getElementById('nexusMenuPanel').classList.contains('open'));
  await h.click('[data-nexus-close-panel]');assert.equal(h.w.document.querySelectorAll('#nexusMenuPanel.open').length,0);assert.equal(h.w.document.activeElement.dataset.nxNav,'system');
  await h.click('[data-nx-nav="time"]');assert.ok(h.calls.includes('nexus:open-timespace'));
  await h.click('[data-nx-nav="files"]');const project=[...h.w.document.querySelectorAll('#nexusDockFolder button')].find(x=>x.textContent==='Project files');await h.act(()=>project.click());assert.ok(h.calls.includes('nexus:open-project-files'));
 }finally{await h.dispose()}
});
test('Ask searches actual 106-source metadata plus device files, scopes reveal events to this world and never inserts canned project claims',async()=>{
 const h=await harness({localFiles:[{id:'local-plan',name:'Halifax Level 2 sketch.pdf',category:'Design'}]});try{
  await h.click('[data-nx-nav="ask"]');assert.match(h.w.document.querySelector('#nexusDockFolder').textContent,/107 project files available/);
  await h.change('[aria-label="Ask Nexus: search project files"]','survey');assert.match(h.w.document.querySelector('[role="status"]').textContent,/1 matching files/);
  const result=h.w.document.querySelector('.nx-dock-search-results button');assert.match(result.textContent,/Detailed survey of the real pilot/);await h.act(()=>result.click());assert.equal(h.calls.at(-1).world,'esafe-demo');assert.equal(h.calls.at(-1).fileId,'d-snaglist');
  await h.click('[data-nx-nav="ask"]');await h.change('[aria-label="Ask Nexus: search project files"]','Halifax sketch');assert.match(h.w.document.querySelector('[role="status"]').textContent,/1 matching/);await h.click('.nx-dock-search-results button');assert.equal(h.calls.at(-1).fileId,'local-plan');
  assert.equal(h.w.document.body.textContent.includes('72%'),false);
 }finally{await h.dispose()}
});
test('device storage failure preserves searchable source files; Riverside uses its own document context',async()=>{
 const h=await harness({failLocal:true});try{await h.click('[data-nx-nav="ask"]');assert.match(h.w.document.querySelector('[role="alert"]').textContent,/Device files could not be read/);await h.change('[type="search"]','survey');assert.equal(h.w.document.querySelectorAll('.nx-dock-search-results button').length,1)}finally{await h.dispose()}
 const other=await harness({world:'dev'});try{await other.click('[data-nx-nav="ask"]');await other.change('[type="search"]','Riverside');assert.equal(other.w.document.querySelectorAll('.nx-dock-search-results button').length,1);await other.click('.nx-dock-search-results button');assert.equal(other.calls.at(-1).world,'dev');assert.equal(other.calls.at(-1).fileId,'riverside-plan')}finally{await other.dispose()}
});
test('folder Escape restores focus and original access decisions still filter navigation and tool links',async()=>{
 const h=await harness();try{
  await h.click('[data-nx-nav="files"]');await h.key('#nexusDockFolder','Escape');assert.equal(h.w.document.getElementById('nexusDockFolder'),null);assert.equal(h.w.document.activeElement.dataset.nxNav,'files');
  await h.click('[data-nx-nav="tools"]');assert.ok(h.w.document.querySelector('a[href="/doorsuite"]'));assert.equal(h.w.document.querySelector('a[href="/private"]'),null);assert.ok([...h.w.document.querySelectorAll('#nexusDockFolder button')].find(x=>x.textContent.includes('FabStation')&&x.disabled));
  await h.change('[aria-label="Access test profile"]','joiner');assert.equal(h.w.localStorage.getItem('access-demo'),'joiner');assert.equal(h.w.document.querySelector('[data-nx-nav="people"]'),null);assert.equal(h.w.document.querySelector('[data-nx-nav="system"]'),null);assert.ok(h.w.document.querySelector('[data-nx-nav="files"]'));
 }finally{await h.dispose()}
});
test('navigation scroll controls reveal overflow, retain this project position and leave another world untouched',async()=>{
 const h=await harness();try{
  const row=h.w.document.getElementById('nexusUnifiedDockRow');Object.defineProperties(row,{clientWidth:{value:300},scrollWidth:{value:1000}});
  row.scrollBy=({left})=>{row.scrollLeft=Math.max(0,Math.min(700,row.scrollLeft+left));row.dispatchEvent(new h.w.Event('scroll',{bubbles:true}))};
  await h.act(()=>h.w.dispatchEvent(new h.w.Event('resize')));
  assert.equal(h.w.document.querySelector('[aria-label="Scroll navigation left"]').disabled,true);assert.equal(h.w.document.querySelector('[aria-label="Scroll navigation right"]').disabled,false);
  await h.click('[aria-label="Scroll navigation right"]');assert.ok(row.scrollLeft>0);assert.equal(h.w.document.querySelector('[aria-label="Scroll navigation left"]').disabled,false);
  assert.equal(JSON.parse(h.w.localStorage.getItem('nosmo.unified-dock:v1:esafe-demo')).scrollLeft,row.scrollLeft);assert.equal(h.w.localStorage.getItem('nosmo.unified-dock:v1:dev'),null);
  await h.click('[data-nx-nav="files"]');await h.click('[aria-label="Scroll navigation right"]');assert.equal(h.w.document.getElementById('nexusDockFolder'),null);
 }finally{await h.dispose()}
});

test('import arrangement is selectable, persists per project and both file/directory pickers are available',async()=>{
 const h=await harness();try{
  await h.click('[data-nx-nav="files"]');assert.equal(h.w.document.querySelector('[aria-label="Arrange imported files"]').value,'topics');
  await h.change('[aria-label="Arrange imported files"]','batch');assert.equal(h.ctx.nxImportFolderMode('esafe-demo'),'batch');assert.equal(h.ctx.nxImportFolderMode('dev'),'topics');
  assert.ok([...h.w.document.querySelectorAll('#nexusDockFolder button')].some(b=>b.textContent==='Import folder'));assert.ok([...h.w.document.querySelectorAll('#nexusDockFolder button')].some(b=>b.textContent==='Add files'));
  await h.click('[data-nx-nav="files"]');await h.click('[data-nx-nav="files"]');assert.equal(h.w.document.querySelector('[aria-label="Arrange imported files"]').value,'batch');
 }finally{await h.dispose()}
});
