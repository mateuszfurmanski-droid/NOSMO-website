const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const dir='apps/nexus-graph-preview/relationship-tree/src/',sources=['file-playback.js','project-files.js','explorer-views.js','file-explorer.js'].map(n=>fs.readFileSync(dir+n,'utf8')).join('\n');
const plain=x=>JSON.parse(JSON.stringify(x));
const file=(id,name,extra={})=>({id,name,title:name,category:'Design',kind:'PDF',date:'2026-01-01',dateRaw:'2026-01-01',datePrecision:'day',size:1234,recordId:id,fileUrl:'https://zenodo.org/records/1/files/example.pdf',...extra});
const fixtures=()=>[file('a','Electrical wiring plan.pdf'),file('b','Ventilation layout.pdf'),file('c','Door schedule.pdf'),file('d','Unlabelled.pdf',{category:'Research'}),file('e','Thermal seismic assessment.pdf')];
function model(){const ctx={URL};vm.createContext(ctx);vm.runInContext(sources,ctx);return ctx}
test('trade assignment uses metadata first, labels filename suggestions and leaves unknowns visible',()=>{
 const ctx=model(),files=fixtures();assert.deepEqual(files.map(f=>ctx.nxExplorerTrade(f).id),['electrical','mep','joinery','unassigned','coordination']);
 assert.equal(ctx.nxExplorerTrade({...files[0],trade:'bim'}).id,'bim');assert.equal(ctx.nxExplorerTrade({...files[0],tradeOverride:'survey'}).basis,'Assigned by you');assert.equal(ctx.nxExplorerTrade({...files[0],trades:['bim','mep']}).id,'coordination');assert.match(ctx.nxExplorerTrade(files[0]).basis,/Suggested/);assert.match(ctx.nxExplorerTrade(files[3]).basis,/No clear/);
});
test('every source file is reachable exactly once through trades/topics/imports without mutating catalog or chronological history',()=>{
 const ctx=model();ctx.window={};vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/data.js','utf8'),ctx);vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/files.js','utf8'),ctx);const files=ctx.nxEsafeCatalog(ctx.window.ESAFE_RECORDS),before=JSON.stringify(files);
 function walk(view,path=[]){const items=ctx.nxExplorerItems(files,view,path);assert.ok(items.folders.length<30);return [...items.files.map(f=>f.id),...items.folders.flatMap(f=>walk(view,[...path,f.id]))]}
 for(const view of ['trades','topics','imports']){const ids=walk(view);assert.equal(ids.length,106);assert.equal(new Set(ids).size,106);assert.deepEqual([...ids].sort(),Array.from(files,f=>f.id).sort())}assert.equal(JSON.stringify(files),before);
});
test('imports retain directory hierarchy and keep separate batches separate; virtual paths never escape the import',()=>{
 const ctx=model(),files=[file('a','wiring.pdf',{local:true,importBatchId:'one',importLabel:'Tender',relativePath:'Tender/Electrical/Level 1/wiring.pdf'}),file('b','notes.pdf',{local:true,importBatchId:'one',importLabel:'Tender',relativePath:'Tender/notes.pdf'}),file('c','plan.pdf',{local:true,importBatchId:'two',importLabel:'Another tender',relativePath:'Tender/../../plan.pdf'})];
 assert.deepEqual(plain(ctx.nxExplorerItems(files,'imports').folders.map(f=>f.id)),['two','one']);
 const one=ctx.nxExplorerItems(files,'imports',['one']);assert.deepEqual(plain(one.folders.map(f=>f.id)),['Electrical']);assert.deepEqual(plain(one.files.map(f=>f.id)),['b']);assert.deepEqual(plain(ctx.nxExplorerItems(files,'imports',['one','Electrical','Level 1']).files.map(f=>f.id)),['a']);assert.deepEqual(plain(ctx.nxExplorerDirectory(files[2])),[]);
});
async function harness({files=fixtures(),initialFile=null,asOf=null,before=null,addFiles=null,folderMode="topics"}={}){
 const dom=new JSDOM('<html data-nexus-file-layout="explorer"><body><button id="origin">Open files</button><div id="mount"></div></body></html>',{url:'https://example.test/?world=esafe-demo'}),w=dom.window;
 global.window=w;global.document=w.document;global.navigator=w.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),{createRoot}=require('react-dom/client'),ReactDOM=require('react-dom'),jsx=require('react/jsx-runtime');const calls=[];
 const ctx={window:w,document:w.document,localStorage:w.localStorage,URL,CustomEvent:w.CustomEvent,b:React,s:jsx,ko:ReactDOM,nxImportFolderMode:()=>folderMode};vm.createContext(ctx);vm.runInContext(sources,ctx);ctx.NexusFilePreview=props=>jsx.jsx('section',{id:'nexusFilePreview','data-preview-id':props.file.id,children:jsx.jsx('button',{'aria-label':'Close embedded preview',onClick:props.onClose,children:props.file.name})});
 if(before)before(w);w.document.getElementById('origin').focus();let root=createRoot(w.document.getElementById('mount'));
 const act=fn=>React.act(async()=>{if(fn)await fn();await new Promise(setImmediate)});
 const render=()=>root.render(jsx.jsx(ctx.NexusProjectFiles,{files,initialFile,asOf,onAddFiles:addFiles?async selected=>{const added=await addFiles(selected);files=[...files,...added];render();return added}:undefined,onClose:()=>calls.push('close'),onReveal:id=>calls.push(['reveal',id]),onSetDeactivation:async(id,iso)=>{files=files.map(f=>f.id===id?{...f,archived:iso!==null&&Date.parse(iso)<=Date.now(),deactivateAt:iso}:f);calls.push(['lifetime',id,iso]);render()}}));
 const click=sel=>act(()=>{const el=w.document.querySelector(sel);assert.ok(el,sel);el.click()});
 const change=(sel,value)=>act(()=>{const el=w.document.querySelector(sel),proto=el.tagName==='SELECT'?w.HTMLSelectElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}))});
 const remount=async()=>{await act(()=>root.unmount());w.document.getElementById('origin').focus();root=createRoot(w.document.getElementById('mount'));await act(render)};
 const dispose=async()=>{await act(()=>root.unmount());assert.equal(w.document.activeElement.id,'origin');w.close()};await act(render);return{w,ctx,act,click,change,calls,dispose,remount};
}
test('Explorer starts with folders, navigates by trade then topic, and Back/Up/breadcrumbs never render map tiles',async()=>{
 const h=await harness();try{
  assert.ok(h.w.document.querySelector('#nexusFileExplorer'));assert.equal(h.w.document.querySelectorAll('[data-explorer-file]').length,0);assert.equal(h.w.document.querySelectorAll('[data-explorer-folder]').length,5);
  await h.click('[data-explorer-folder="electrical"]');assert.equal(h.w.document.querySelectorAll('[data-explorer-file]').length,0);await h.click('[data-explorer-folder="Design"]');assert.equal(h.w.document.querySelectorAll('[data-explorer-file]').length,1);
  assert.match(h.w.document.querySelector('[aria-label="Folder path"]').textContent,/Trades.*Electrical.*Design/);
  await h.click('[aria-label="Up one folder"]');assert.equal(h.w.document.querySelectorAll('[data-explorer-file]').length,0);await h.click('[aria-label="Back to previous folder"]');assert.equal(h.w.document.querySelectorAll('[data-explorer-file]').length,1);
  assert.equal(h.w.document.querySelectorAll('[data-node-id]').length,0);
 }finally{await h.dispose()}
});
test('global search covers every folder, paginates large results and previews only the selected file inside Nexus',async()=>{
 const files=Array.from({length:61},(_,i)=>file('f'+i,`Electrical plan ${String(i).padStart(2,'0')}.pdf`)),h=await harness({files});try{
  await h.change('[aria-label="Search files in all folders"]','electrical plan');assert.equal(h.w.document.querySelectorAll('[data-explorer-file]').length,25);
  await h.click('[aria-label="Next page of files"]');await h.click('[aria-label="Next page of files"]');assert.equal(h.w.document.querySelectorAll('[data-explorer-file]').length,11);assert.match(h.w.document.querySelector('.nx-explorer-pagination').textContent,/Page 3 of 3/);
  const btn=h.w.document.querySelector('[data-explorer-file] button');await h.act(()=>btn.click());await h.click('.nx-explorer-inspector button');assert.ok(h.w.document.querySelector('#nexusFilePreview'));assert.equal(h.w.document.querySelectorAll('#nexusFilePreview').length,1);
  const other=h.w.document.querySelectorAll('[data-explorer-file] button')[1];await h.act(()=>other.click());assert.equal(h.w.document.querySelector('#nexusFilePreview').dataset.previewId,other.closest('tr').dataset.explorerFile);
  await h.change('[aria-label="Search files in all folders"]','no matches whatever');assert.match(h.w.document.querySelector('.nx-explorer-content').textContent,/No matching files/);
 }finally{await h.dispose()}
});
test('manual correction moves a file to its trade folder, persists by world and storage failure retains the prior assignment',async()=>{
 const h=await harness();try{
  await h.change('[aria-label="Search files in all folders"]','Unlabelled');await h.click('[data-explorer-file="d"] button');await h.change('[aria-label="Assign trade for selected file"]','structural');
  assert.equal(JSON.parse(h.w.localStorage.getItem('nosmo.file-trades:v1:esafe-demo')).d,'structural');assert.match(h.w.document.querySelector('.nx-explorer-inspector').textContent,/Assigned by you/);assert.equal(h.w.localStorage.getItem('nosmo.file-trades:v1:dev'),null);
  const proto=Object.getPrototypeOf(h.w.localStorage),save=proto.setItem;proto.setItem=()=>{throw Error('full')};await h.change('[aria-label="Assign trade for selected file"]','mep');proto.setItem=save;assert.match(h.w.document.querySelector('[role="alert"]').textContent,/Previous assignment kept/);assert.equal(h.w.document.querySelector('[aria-label="Assign trade for selected file"]').value,'structural');
  assert.equal(h.ctx.nxExplorerTradeAssignments('esafe-demo').d,'structural');
 }finally{await h.dispose()}
});
test('file details retain the parent folder; deactivation returns to Explorer and Archive contains the same file',async()=>{
 const h=await harness({initialFile:'a'});try{
  assert.match(h.w.document.querySelector('[aria-label="Folder path"]').textContent,/Electrical.*Design/);await h.click('.nx-explorer-inspector button:nth-child(2)');assert.equal(h.w.document.querySelectorAll('[data-file-id]').length,1);assert.equal(h.w.document.querySelectorAll('#nexusFileExplorer').length,0);
  await h.click('[aria-label="Back to file explorer"]');assert.match(h.w.document.querySelector('[aria-label="Folder path"]').textContent,/Electrical.*Design/);await h.click('.nx-explorer-inspector button:nth-child(2)');await h.click('.nx-file-lifetime summary');
  await h.act(()=>[...h.w.document.querySelectorAll('button')].find(b=>b.textContent==='Deactivate now').click());assert.ok(h.w.document.querySelector('#nexusFileExplorer'));assert.equal(h.w.document.querySelectorAll('[data-explorer-file]').length,0);
  await h.change('[aria-label="Explorer file status"]','archived');assert.equal(h.w.document.querySelectorAll('[data-explorer-file]').length,1);assert.equal(h.w.document.querySelector('[data-explorer-file]').dataset.explorerFile,'a');
 }finally{await h.dispose()}
});
test('historical snapshots cannot reassign trades or change file lifetime',async()=>{
 const h=await harness({initialFile:'a',asOf:Date.now()});try{assert.equal(h.w.document.querySelector('[aria-label="Assign trade for selected file"]').disabled,true);assert.match(h.w.document.querySelector('.nx-explorer-note').textContent,/read-only/)}finally{await h.dispose()}
});

test('Explorer import commits through the supplied ingestion callback, refreshes folders and reports failure without hiding existing files',async()=>{
 const received=[],h=await harness({addFiles:async selected=>{received.push(...selected);return selected.map((f,i)=>file('added-'+i,f.name,{local:true}))}});try{
  const input=h.w.document.querySelector('[aria-label="Explorer add files"]'),selected=new File(['bytes'],'Electrical commissioning.pdf',{type:'application/pdf'});Object.defineProperty(input,'files',{value:[selected]});await h.act(()=>input.dispatchEvent(new h.w.Event('change',{bubbles:true})));
  assert.equal(received[0],selected);assert.equal(input.value,'');assert.match(h.w.document.querySelector('[data-explorer-folder="electrical"]').textContent,/2 files/);
 }finally{await h.dispose()}
 const failed=await harness({addFiles:async()=>{throw Error('Device storage unavailable')}});try{
  const input=failed.w.document.querySelector('[aria-label="Explorer import folder"]');assert.ok(input.hasAttribute('webkitdirectory'));Object.defineProperty(input,'files',{value:[new File(['x'],'file.pdf')]});await failed.act(()=>input.dispatchEvent(new failed.w.Event('change',{bubbles:true})));
  assert.match(failed.w.document.querySelector('[role="alert"]').textContent,/Device storage unavailable/);assert.equal(failed.w.document.querySelectorAll('[data-explorer-folder]').length,5);assert.ok([...failed.w.document.querySelectorAll('.nx-explorer-import button')].every(b=>!b.disabled));
 }finally{await failed.dispose()}
});

test('keep-import-together preference opens Imports by default and a file deep link retains its directory path',async()=>{
 const files=[file('one','wiring.pdf',{local:true,importBatchId:'package',importLabel:'Tender',relativePath:'Tender/Electrical/wiring.pdf'})],h=await harness({files,folderMode:'batch',initialFile:'one'});try{
  assert.match(h.w.document.querySelector('[aria-label="Folder path"]').textContent,/Imports.*Tender.*Electrical/);assert.equal(h.w.document.querySelector('[data-explorer-file]').dataset.explorerFile,'one');
 }finally{await h.dispose()}
});

test('all eight layouts retain the same 25 visible files, selection, preview and chronological page order',async()=>{
 const files=Array.from({length:31},(_,i)=>file('f'+i,`Electrical plan ${String(i).padStart(2,'0')}.pdf`)),h=await harness({files});try{
  await h.change('[aria-label="Search files in all folders"]','electrical');const expected=[...h.w.document.querySelectorAll('[data-explorer-file]')].map(n=>n.dataset.explorerFile);
  for(const [layout,label] of vm.runInContext("nxExplorerLayouts",h.ctx)){const item=[...h.w.document.querySelectorAll('[role="menuitemradio"]')].find(n=>n.textContent.includes(label));await h.act(()=>item.click());assert.equal(h.w.document.querySelector('#nexusFileExplorer').dataset.explorerLayout,layout);assert.deepEqual([...h.w.document.querySelectorAll('[data-explorer-file]')].map(n=>n.dataset.explorerFile),expected);assert.equal(h.w.document.querySelectorAll('[role="menuitemradio"][aria-checked="true"]').length,1)}
  await h.click('[data-explorer-file="f0"]');assert.equal(h.w.document.querySelector('[data-explorer-file="f0"]').dataset.selected,'true');await h.click('.nx-explorer-inspector button');assert.equal(h.w.document.querySelector('#nexusFilePreview').dataset.previewId,'f0');assert.equal(h.w.document.querySelectorAll('[data-explorer-file]').length,25);
 }finally{await h.dispose()}
});
test('per-folder views survive reopening, new folders inherit the last view, and applying to all clears folder overrides',async()=>{
 const h=await harness();try{
  const layout=async name=>h.act(()=>[...h.w.document.querySelectorAll('[role="menuitemradio"]')].find(n=>n.textContent.includes(name)).click());
  await layout('Large icons');await h.click('[data-explorer-folder="electrical"]');assert.equal(h.w.document.querySelector('#nexusFileExplorer').dataset.explorerLayout,'large');await layout('List');await h.click('[aria-label="Back to previous folder"]');assert.equal(h.w.document.querySelector('#nexusFileExplorer').dataset.explorerLayout,'large');
  await h.remount();assert.equal(h.w.document.querySelector('#nexusFileExplorer').dataset.explorerLayout,'large');await h.click('[data-explorer-folder="electrical"]');assert.equal(h.w.document.querySelector('#nexusFileExplorer').dataset.explorerLayout,'list');
  await h.click('[aria-label="Open folder options"]');await h.act(()=>[...h.w.document.querySelectorAll('.nx-explorer-options button')].find(n=>n.textContent==='Apply this view to all folders').click());assert.deepEqual(Object.keys(JSON.parse(h.w.localStorage.getItem('nosmo.explorer-views:v1:esafe-demo')).folders),[]);await h.click('[aria-label="Close folder options"]');await h.click('[aria-label="Back to previous folder"]');assert.equal(h.w.document.querySelector('#nexusFileExplorer').dataset.explorerLayout,'list');assert.equal(h.w.localStorage.getItem('nosmo.explorer-views:v1:dev'),null);
 }finally{await h.dispose()}
});
test('folder options hide extensions and details pane without losing file actions; restore defaults and Escape work',async()=>{
 const h=await harness({initialFile:'a'});try{
  await h.click('[aria-label="Open folder options"]');await h.click('[data-explorer-option="showExtensions"]');await h.click('[data-explorer-option="showPane"]');await h.act(()=>h.w.document.querySelector('#nexusFileExplorer').dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  assert.equal(h.w.document.querySelector('.nx-explorer-options'),null);assert.equal(h.w.document.querySelector('.nx-explorer-inspector'),null);assert.equal(h.w.document.querySelector('[aria-label="Select file: Electrical wiring plan.pdf"]').textContent.includes('.pdf'),false);await h.click('.nx-explorer-selection-actions button');assert.equal(h.w.document.querySelector('#nexusFilePreview').dataset.previewId,'a');
  await h.click('[aria-label="Open folder options"]');await h.act(()=>[...h.w.document.querySelectorAll('.nx-explorer-options button')].find(n=>n.textContent==='Restore defaults').click());await h.click('[aria-label="Close folder options"]');assert.ok(h.w.document.querySelector('.nx-explorer-inspector'));assert.equal(h.w.document.querySelector('#nexusFileExplorer').dataset.explorerLayout,'details');assert.equal(h.w.document.activeElement.getAttribute('aria-label'),'Open folder options');
 }finally{await h.dispose()}
});
test('double-click folder option selects on one pointer click and opens on double click or Enter',async()=>{
 const h=await harness();try{
  await h.click('[aria-label="Open folder options"]');await h.change('[aria-label="Open folders with"]','double');await h.click('[aria-label="Close folder options"]');
  const folder=h.w.document.querySelector('[data-explorer-folder="electrical"]'),button=folder.querySelector('button');await h.act(()=>button.dispatchEvent(new h.w.MouseEvent('click',{detail:1,bubbles:true})));assert.equal(folder.dataset.selected,'true');assert.equal(h.w.document.querySelector('[aria-label="Folder path"]').textContent,'Trades');
  await h.act(()=>button.dispatchEvent(new h.w.MouseEvent('dblclick',{detail:2,bubbles:true})));assert.match(h.w.document.querySelector('[aria-label="Folder path"]').textContent,/Electrical/);await h.click('[aria-label="Up one folder"]');await h.act(()=>h.w.document.querySelector('[data-explorer-folder="electrical"] button').dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true})));assert.match(h.w.document.querySelector('[aria-label="Folder path"]').textContent,/Electrical/);
 }finally{await h.dispose()}
});
test('name/type/size and descending order plus grouping preserve every result across pages; detail headers sort visibly',async()=>{
 const files=[file('a','Electrical plan 10.pdf',{kind:'PDF',size:500}),file('b','Electrical plan 2.pdf',{kind:'Image',size:100}),file('c','Electrical plan 1.pdf',{kind:'PDF',size:300})],h=await harness({files});try{
  await h.change('[aria-label="Search files in all folders"]','electrical');await h.change('[aria-label="Sort explorer files"]','name');const ids=()=>[...h.w.document.querySelectorAll('[data-explorer-file]')].map(n=>n.dataset.explorerFile);assert.deepEqual(ids(),['c','b','a']);await h.click('[aria-label="Sort descending"]');assert.deepEqual(ids(),['a','b','c']);
  await h.click('[aria-label="Sort by size"]');assert.deepEqual(ids(),['b','c','a']);assert.equal(h.w.document.querySelector('th[aria-sort="ascending"] button').textContent,'Size ↑');await h.change('[aria-label="Group explorer files"]','type');assert.equal(h.w.document.querySelectorAll('.nx-explorer-group-label').length,2);assert.equal(new Set(ids()).size,3);assert.match(h.w.document.querySelector('.nx-explorer-group-label').textContent,/Image/);
 }finally{await h.dispose()}
});
test('corrupt preferences fall back safely and failed writes do not change the active view or claim persistence',async()=>{
 const h=await harness({before:w=>w.localStorage.setItem('nosmo.explorer-views:v1:esafe-demo','{"version":1,"defaults":{"layout":"bad","sort":"bad"},"options":{"openMode":"bad"}}')});try{
  assert.equal(h.w.document.querySelector('#nexusFileExplorer').dataset.explorerLayout,'details');const proto=Object.getPrototypeOf(h.w.localStorage),save=proto.setItem;proto.setItem=()=>{throw Error('full')};await h.act(()=>[...h.w.document.querySelectorAll('[role="menuitemradio"]')].find(n=>n.textContent.includes('Large icons')).click());proto.setItem=save;
  assert.equal(h.w.document.querySelector('#nexusFileExplorer').dataset.explorerLayout,'details');assert.match(h.w.document.querySelector('[role="alert"]').textContent,/Previous settings kept/);
 }finally{await h.dispose()}
});
