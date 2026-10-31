const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const sourceRoot='apps/nexus-graph-preview/relationship-tree/';
const catalogSource=fs.readFileSync(sourceRoot+'src/project-files.js','utf8');
const dataSource=fs.readFileSync('apps/nexus-esafe-demo/data.js','utf8');
const fileSource=fs.readFileSync('apps/nexus-esafe-demo/files.js','utf8');
function dataset(){const ctx={window:{},URL};vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/local-files.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/file-playback.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/timespace-player.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/graph-history.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/file-lifecycle.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/graph-motion.js','utf8'),ctx);vm.runInContext(dataSource,ctx);vm.runInContext(fileSource,ctx);vm.runInContext(catalogSource,ctx);return ctx}

test('existing Catania manifest exposes all 95 source records and 106 named remote files, retaining five graph aliases',()=>{
 const ctx=dataset(),files=ctx.nxEsafeCatalog(ctx.window.ESAFE_RECORDS);
 assert.equal(ctx.window.ESAFE_RECORDS.length,95);assert.equal(files.length,106);assert.equal(new Set(files.map(f=>f.id)).size,106);
 assert.equal(files.filter(f=>f.kind==='PDF').length,104);assert.equal(files.filter(f=>f.kind==='Video').length,2);
 assert.equal(new Set(files.map(f=>f.recordId)).size,95);assert.equal(files.reduce((n,f)=>n+f.size,0),685986559);
 assert.ok(files.every(f=>f.name&&!/^Source file \d+$/.test(f.name)&&f.fileUrl.startsWith('https://zenodo.org/')&&f.sourceUrl.startsWith('https://zenodo.org/records/')));
 const expected={'6260847':'d-snaglist','6497142':'d-firecerts','19114712':'t-install','19126519':'t-snag','19126674':'t-fire'};
 for(const [recordId,id] of Object.entries(expected))assert.equal(files.find(f=>f.recordId===recordId).id,id);
});

test('catalog accepts encoded source file names and rejects unsafe or off-source URLs and placeholder entries',()=>{
 const ctx=dataset();
 const entry={id:'test',title:'Source title',category:'BIM',date:'2026-10-30',url:'https://zenodo.org/records/test',files:[{name:'Plan A & B.pdf',size:100,fileUrl:'unused',url:'https://zenodo.org/api/records/test/files/Plan A & B.pdf/content'}]};
 const files=ctx.nxEsafeCatalog([entry]);assert.equal(files.length,1);assert.ok(files[0].fileUrl.includes('Plan%20A%20&%20B.pdf'));
 const bad=['javascript:alert(1)','data:text/html,hello','http://zenodo.org/file.pdf','https://zenodo.org.evil.test/file.pdf','https://evil.test/zenodo.org/file.pdf','/relative.pdf','not a URL'];
 for(const url of bad){assert.equal(ctx.nxEsafeCatalog([{...entry,files:[{...entry.files[0],url}]}]).length,0);assert.equal(ctx.nxEsafeCatalog([{...entry,url}]).length,0)}
 assert.equal(ctx.nxEsafeCatalog([{...entry,files:['Source file 1',null,{}]}]).length,0);
});

test('e-SAFE bootstrap loads data and filename manifest together, enriching actual source records',()=>{
 const requested=[];
 class XHR{open(method,path,async){assert.equal(method,'GET');assert.equal(async,false);this.path=path;requested.push(path)}send(){this.status=200;this.responseText=this.path.includes('/data.js?')?dataSource:this.path.includes('/files.js?')?fileSource:''}}
 const ctx={document:{addEventListener(){},querySelector(){return null},getElementById(){return null}},window:{__NEXUS_PROJECT_WORLD__:'esafe-demo',fetch:async()=>({}),addEventListener(){}},XMLHttpRequest:XHR,setTimeout(){},console,URL};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/local-files.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/file-playback.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/timespace-player.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/graph-history.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/file-lifecycle.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/graph-motion.js','utf8'),ctx);vm.runInContext(fs.readFileSync(sourceRoot+'nexus-esafe-graph-runtime.js','utf8'),ctx);vm.runInContext(catalogSource,ctx);
 assert.equal(requested.length,2);assert.match(requested[0],/\/data\.js\?/);assert.match(requested[1],/\/files\.js\?/);
 assert.equal(ctx.nxEsafeCatalog(ctx.window.ESAFE_RECORDS).length,106);assert.equal(typeof ctx.window.ESAFE_RECORDS[0].files[0],'object');
});

test('actual catalog UI lists, searches, filters, reveals graph files and describes remote provenance without an upload claim',async()=>{
 const dom=new JSDOM('<button id="origin">Project</button><div id="mount"></div>',{url:'https://example.test/'}),w=dom.window;
 global.window=w;global.document=w.document;global.navigator=w.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),{createRoot}=require('react-dom/client'),jsx=require('react/jsx-runtime'),ReactDOM=require('react-dom');
 const ctx=dataset();Object.assign(ctx,{b:React,s:jsx,ko:ReactDOM,document:w.document});
 const files=ctx.nxEsafeCatalog(ctx.window.ESAFE_RECORDS),root=createRoot(w.document.getElementById('mount'));
 let revealed=null,closed=0;
 const render=(initialFile=null,items=files)=>React.act(()=>root.render(jsx.jsx(ctx.NexusProjectFiles,{files:items,initialFile,onClose:()=>closed++,onReveal:id=>revealed=id})));
 const getButton=text=>[...w.document.querySelectorAll('button')].find(b=>b.textContent===text);
 const rows=()=>[...w.document.querySelectorAll('#nexusProjectFiles article')];
 const click=el=>React.act(()=>el.click());
 w.document.getElementById('origin').focus();await render();
 assert.equal(rows().length,106);assert.equal(w.document.querySelector('h2').textContent,'Project files · 106');
 const note=w.document.querySelector('.nx-source-note').textContent;assert.match(note,/95 source records · 104 PDF · 2 videos/);assert.match(note,/Source links open from Zenodo/);assert.match(note,/source publication/);assert.doesNotMatch(note,/imported|uploaded|confirmed/i);
 assert.equal(w.document.activeElement.getAttribute('aria-label'),'Close project files');
 await click(getButton('Video 2'));assert.equal(rows().length,2);assert.ok(rows().every(r=>r.querySelector('.nx-file-kind').textContent==='Video'));
 await click(getButton('Core pilot 5'));assert.equal(rows().length,5);assert.ok(rows().every(r=>r.textContent.includes('CORE PILOT')));
 await click(getButton('PDF 104'));assert.equal(rows().length,104);
 await click(getButton('All 106'));
 const input=w.document.querySelector('input[type=search]');const setValue=Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set;
 await React.act(()=>{setValue.call(input,'pre-assembly');input.dispatchEvent(new w.Event('input',{bubbles:true}))});
 assert.ok(rows().length>0&&rows().length<106);assert.ok(rows().every(r=>/pre-assembly/i.test(r.textContent)));
 const row=rows()[0],id=row.dataset.fileId;await click(row.querySelector('button'));assert.equal(revealed,id);
 for(const anchor of row.querySelectorAll('a')){assert.equal(anchor.target,'_blank');assert.equal(anchor.rel,'noopener noreferrer');assert.equal(new URL(anchor.href).hostname,'zenodo.org')}
 await React.act(()=>w.document.querySelector('#nexusProjectFiles').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.equal(closed,1);
 await React.act(()=>root.unmount());assert.equal(w.document.activeElement.id,'origin');
 const root2=createRoot(w.document.getElementById('mount'));const selected=files.find(f=>f.core);
 await React.act(()=>root2.render(jsx.jsx(ctx.NexusProjectFiles,{files,initialFile:selected.id,onClose(){},onReveal(){}})));assert.equal(rows().length,1);assert.equal(rows()[0].dataset.fileId,selected.id);
 await React.act(()=>root2.unmount());dom.window.close();
});

async function mountCataniaMap({query='?world=esafe-demo',workspace=null}={}){
 const dom=new JSDOM('<div id="mount"></div>',{url:'https://example.test/'+query}),w=dom.window;
 global.window=w;global.document=w.document;global.navigator=w.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),{createRoot}=require('react-dom/client'),jsx=require('react/jsx-runtime'),ReactDOM=require('react-dom');
 const data=dataset();w.__NEXUS_PROJECT_WORLD__='esafe-demo';w.ESAFE_RECORDS=data.window.ESAFE_RECORDS;w.ESAFE_FILES=data.window.ESAFE_FILES;
 if(workspace)w.localStorage.setItem('nosmo-tile-groups:v2:esafe-demo',JSON.stringify(workspace));
 const ids=['proj','p-mateusz','p-sitemgr','p-architect','p-client','p-team','d-groundfloor','d-doorschedule','d-siteinstructions','d-snaglist','d-firecerts','t-install','t-snag','t-fire','t-walkthrough','t-doorkits'];
 const objects=ids.map(id=>({id,label:id,type:id==='proj'?'project':id.startsWith('p-')?'person':id.startsWith('d-')?'document':'task',Icon:()=>null}));
 const ctx={window:w,document:w.document,URL,URLSearchParams,localStorage:w.localStorage,b:React,s:jsx,ko:ReactDOM,ns:objects,Dt:()=>null,CU:()=>null,gc:{project:{},person:{},task:{},document:{}},crypto:require('node:crypto').webcrypto,
  CustomEvent:w.CustomEvent,ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},getComputedStyle:w.getComputedStyle,
  _w:z=>Math.max(.3,Math.min(1.3,z)),EU:(items,root,edges,pinned)=>new Map(items.map((o,index)=>[o.id,pinned[o.id]||{x:index*150,y:index%2*200}]))};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/local-files.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/file-playback.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/timespace-player.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/graph-history.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/file-lifecycle.js','utf8')+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/graph-motion.js','utf8'),ctx);vm.runInContext(fs.readFileSync(sourceRoot+'src/tile-groups.js','utf8')+'\n'+catalogSource+'\n'+fs.readFileSync(sourceRoot+'src/timespace-model.js','utf8')+'\n'+fs.readFileSync(sourceRoot+'src/timespace-view.js','utf8')+'\n'+fs.readFileSync(sourceRoot+'src/relationship-map.js','utf8'),ctx);
 let root=createRoot(w.document.getElementById('mount'));
 const render=()=>React.act(()=>root.render(jsx.jsx(ctx.AU,{})));
 const click=el=>React.act(()=>el.click());
 const fileRows=()=>[...w.document.querySelectorAll('#nexusProjectFiles article')];
 const node=id=>w.document.querySelector(`[data-node-id="${id}"] button`);
 const close=()=>React.act(()=>w.document.querySelector('[aria-label="Close project files"]').click());
 const cleanup=async()=>{await React.act(()=>root.unmount());w.close()};
 await render();return{dom,w,ctx,React,jsx,render,click,fileRows,node,close,cleanup,remount:async()=>{await React.act(()=>root.unmount());root=createRoot(w.document.getElementById('mount'));await render()}};
}

test('full Catania map opens all files from DOCS and project, reveals a noncore file in the tree and restores its deep link',async()=>{
 const map=await mountCataniaMap(),{w,React,click,node,fileRows,close}=map;
 try{
  const files=map.ctx.nxEsafeCatalog(w.ESAFE_RECORDS),other=files.find(f=>!f.core);
  assert.equal(w.document.querySelector('[data-catania-file-count]').textContent,'106 project files');
  assert.equal(w.document.querySelectorAll('[data-node-id] button[aria-label^="document:"]').length,106);
  assert.ok([...w.document.querySelectorAll('line[data-connection-id]')].every(n=>n.dataset.connectionId.startsWith('proj|')));
  assert.ok(node(other.id));
  await React.act(()=>w.dispatchEvent(new w.CustomEvent('nexus:open-project-files')));assert.equal(fileRows().length,106);
  await click(w.document.querySelector(`[data-file-id="${other.id}"] button`));
  assert.equal(fileRows().length,0);assert.ok(node(other.id));assert.equal(new URL(w.location.href).searchParams.get('file'),other.id);assert.equal(new URL(w.location.href).searchParams.has('files'),false);
  assert.ok([...w.document.querySelectorAll('line[data-connection-id]')].every(n=>n.dataset.connectionId.startsWith('proj|')));
  await click(node(other.id));assert.equal(fileRows().length,1);assert.equal(fileRows()[0].dataset.fileId,other.id);
  await close();await click(node('proj'));assert.equal(fileRows().length,106);
  await close();await map.remount();assert.ok(node(other.id));assert.equal(fileRows().length,0);assert.equal(w.document.querySelectorAll('[data-node-id] button[aria-label^="document:"]').length,106);
 }finally{await map.cleanup()}
});

test('full Catania map preserves existing groups using legacy core IDs and reveals a grouped core file without losing membership',async()=>{
 const workspace={version:2,groups:[{id:'nx-group-existing',members:['d-firecerts','p-client']}],pinned:{'nx-group-existing':{x:200,y:50}}};
 const map=await mountCataniaMap({query:'?world=esafe-demo&files=all',workspace}),{w,React,click,node,fileRows}=map;
 try{
  assert.equal(fileRows().length,106);assert.ok(node('nx-group-existing'));assert.equal(node('d-firecerts'),null);
  await click(w.document.querySelector('[data-file-id="d-firecerts"] button'));
  assert.equal(fileRows().length,0);assert.ok(node('d-firecerts'));assert.ok(node('p-client'));assert.equal(node('nx-group-existing').getAttribute('aria-expanded'),'true');
  const persisted=JSON.parse(w.localStorage.getItem('nosmo-tile-groups:v2:esafe-demo'));assert.deepEqual(persisted.groups[0].members,['d-firecerts','p-client']);
  const groupEdges=[...w.document.querySelectorAll('line[data-connection-id]')].map(n=>n.dataset.connectionId);assert.ok(groupEdges.includes('nx-group-existing|d-firecerts'));assert.ok(groupEdges.includes('nx-group-existing|p-client'));
  await map.remount();assert.ok(node('d-firecerts'));assert.equal(node('nx-group-existing').getAttribute('aria-expanded'),'true');
 }finally{await map.cleanup()}
});
