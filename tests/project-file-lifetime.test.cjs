const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/project-files.js','utf8');
function fixtures(){return[
 {id:'active-a',recordId:'a',name:'Active plan.pdf',title:'Active source plan',category:'Design',kind:'PDF',size:2048,date:'2022-01-01',fileUrl:'https://zenodo.org/records/1/files/Active.pdf',sourceUrl:'https://zenodo.org/records/1',deactivateAt:null,archived:false},
 {id:'archived-b',recordId:'b',name:'Archived survey.pdf',title:'Archived source survey',category:'Survey',kind:'PDF',size:1024,date:'2021-01-01',fileUrl:'https://zenodo.org/records/2/files/Archived.pdf',sourceUrl:'https://zenodo.org/records/2',deactivateAt:'2000-02-03T04:05:06.000Z',archived:true},
 {id:'local-c',recordId:'local-c',name:'Device file.pdf',title:'Device file',category:'Testing',kind:'PDF',size:10,date:'2026-10-31',addedAt:'2026-10-31T12:13:14.000Z',fileUrl:null,sourceUrl:null,local:true,deactivateAt:null,archived:false}
]}
async function harness({files=fixtures(),initialStatus='active',initialFile=null,actualPreview=false}={}){
 const dom=new JSDOM('<button id="origin">Origin</button><div id="mount"></div>',{url:'https://example.test/?world=esafe-demo'}),w=dom.window;
 global.window=w;global.document=w.document;global.navigator=w.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),ReactDOM=require('react-dom'),{createRoot}=require('react-dom/client'),jsx=require('react/jsx-runtime');
 const fetchCalls=[],createdUrls=[];
 class PreviewURL extends URL{static createObjectURL(blob){const url='blob:https://example.test/file-'+(createdUrls.length+1);createdUrls.push({url,blob});return url}static revokeObjectURL(){}}
 const ctx={window:w,document:w.document,URL:PreviewURL,Blob,AbortController,fetch:async(url,options)=>{fetchCalls.push({url,options});return {ok:true,status:200,blob:async()=>new Blob(['%PDF-1.7 fixture'],{type:'application/octet-stream'})}},nxLocalFileBlob:async()=>new Blob(['%PDF-1.7 device fixture'],{type:'application/pdf'}),b:React,s:jsx,ko:ReactDOM};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/file-playback.js','utf8'),ctx);vm.runInContext(source,ctx);
 if(actualPreview){const player=fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/timespace-player.js','utf8');vm.runInContext(player.slice(player.indexOf('function NexusFilePreview'),player.indexOf('function NexusTimeSpace')),ctx)}else vm.runInContext("function NexusFilePreview({file,viewer,onViewerChange}){return s.jsxs('aside',{'data-preview-file':file.id,'data-preview-viewer':viewer,children:[file.name,s.jsx('button',{onClick:()=>onViewerChange(viewer==='google'?'source':'google'),children:'Switch test viewer'})]})}",ctx);
 let root=createRoot(w.document.getElementById('mount')),failure=null,revealed=null,removed=0,closed=0,saveGate=null;
 const calls=[];let props={files,initialStatus,initialFile,onClose:()=>closed++,onReveal:id=>revealed=id,onAddFiles:async()=>[],onRemoveFile:async()=>removed++,onRestoreFile:async()=>{},onSetDeactivation:async(id,iso)=>{
  calls.push({id,iso});if(saveGate)await saveGate;if(failure)throw failure;
  props={...props,files:props.files.map(file=>file.id===id?{...file,deactivateAt:iso,archived:iso!==null&&Date.parse(iso)<=Date.now()}:file)};
  root.render(jsx.jsx(ctx.NexusProjectFiles,props));
 }};
 const render=()=>React.act(async()=>{root.render(jsx.jsx(ctx.NexusProjectFiles,props));await Promise.resolve()});
 const el=selector=>w.document.querySelector(selector),rows=()=>[...w.document.querySelectorAll('article[data-file-id]')],row=id=>el('[data-file-id="'+id+'"]');
 const click=target=>React.act(async()=>{const node=typeof target==='string'?el(target):target;assert.ok(node,'Missing target '+target);node.click();await Promise.resolve();await Promise.resolve()});
 const button=(id,label)=>[...row(id).querySelectorAll('button')].find(node=>node.textContent===label);
 const setDate=(id,value)=>React.act(async()=>{const node=row(id).querySelector('input[type=datetime-local]');Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new w.Event('input',{bubbles:true}));node.dispatchEvent(new w.Event('change',{bubbles:true}));await Promise.resolve()});
 const update=async next=>{props={...props,...next};await render()};
 const dispose=async()=>{await React.act(()=>root.unmount());w.close()};
 await render();return{w,ctx,React,get props(){return props},calls,el,rows,row,click,button,setDate,update,dispose,fetchCalls,createdUrls,deferSave:()=>{let release;saveGate=new Promise(resolve=>release=resolve);return release},fail:error=>failure=error,results:()=>({revealed,removed,closed})};
}

test('catalog defaults to active files, preserves type filters and exposes Archive/All without mixing statuses',async()=>{
 const h=await harness();try{
  assert.deepEqual(h.rows().map(row=>row.dataset.fileId),['active-a','local-c']);
  assert.equal(h.el('[data-file-status-filter=active]').getAttribute('aria-pressed'),'true');
  assert.match(h.el('[aria-label="Filter project files"]').textContent,/All 2/);
  await h.click('[data-file-status-filter=archived]');assert.deepEqual(h.rows().map(row=>row.dataset.fileId),['archived-b']);
  await h.click('[data-file-status-filter=all]');assert.equal(h.rows().length,3);
  await h.click('[data-file-status-filter=active]');assert.equal(h.rows().length,2);
 }finally{await h.dispose()}
});

test('archive view retains read-only source links and deactivation time but no active-tree or binary-removal action',async()=>{
 const files=fixtures();files[2]={...files[2],archived:true,deactivateAt:'2001-01-01T00:00:00Z'};
 const h=await harness({files,initialStatus:'archived'});try{
  assert.equal(h.rows().length,2);assert.equal(h.el('[data-file-status-filter=archived]').getAttribute('aria-pressed'),'true');
  for(const id of ['archived-b','local-c']){assert.equal(h.row(id).querySelector('[aria-label^="Show in tree:"]'),null);assert.equal(h.button(id,'Remove device file'),undefined);assert.ok(h.button(id,'Reactivate'))}
  const time=h.row('archived-b').querySelector('time');assert.equal(time.getAttribute('datetime'),'2000-02-03T04:05:06.000Z');
  const links=[...h.row('archived-b').querySelectorAll('a')];assert.equal(links.length,2);assert.ok(links.every(a=>new URL(a.href).hostname==='zenodo.org'));
  await h.click(h.button('local-c','Preview file'));assert.equal(h.el('[data-preview-file]').getAttribute('data-preview-file'),'local-c');
  assert.equal(h.results().removed,0);assert.equal(h.results().revealed,null);
 }finally{await h.dispose()}
});

test('a selected archived file opens archive scope, while an explicitly selected active file remains reachable',async()=>{
 const archive=await harness({initialFile:'archived-b'});try{assert.equal(archive.rows().length,1);assert.equal(archive.rows()[0].dataset.fileId,'archived-b');assert.equal(archive.el('[data-file-status-filter=archived]').getAttribute('aria-pressed'),'true')}finally{await archive.dispose()}
 const active=await harness({initialFile:'active-a',initialStatus:'archived'});try{assert.equal(active.rows().length,1);assert.equal(active.rows()[0].dataset.fileId,'active-a');assert.equal(active.el('[data-file-status-filter=active]').getAttribute('aria-pressed'),'true')}finally{await active.dispose()}
});

test('setting a local date sends an exact ISO deadline without changing original dates or file bytes metadata',async()=>{
 const h=await harness();try{
  const chosen='2099-11-12T13:14:15',expected=new Date(chosen).toISOString();
  const input=h.row('active-a').querySelector('input[type=datetime-local]');assert.equal(input.step,'1');assert.match(input.closest('label').textContent,/local/);
  await h.setDate('active-a',chosen);await h.click(h.button('active-a','Set date'));
  assert.deepEqual(h.calls,[{id:'active-a',iso:expected}]);assert.equal(h.props.files.find(file=>file.id==='active-a').date,'2022-01-01');assert.equal(h.row('active-a').querySelector('time').getAttribute('datetime'),expected);
  assert.ok(h.row('active-a').querySelector('[aria-label^="Show in tree:"]'));assert.equal(h.results().removed,0);assert.equal(h.results().closed,0);
  await h.click(h.button('active-a','Remove deactivation date'));assert.equal(h.calls[1].iso,null);assert.equal(h.row('active-a').querySelector('time'),null);
 }finally{await h.dispose()}
});

test('Deactivate now moves metadata into Archive; Reactivate returns it to Active without deleting the file',async()=>{
 const h=await harness();try{
  const before=Date.now();await h.click(h.button('local-c','Deactivate now'));const after=Date.now();
  assert.equal(h.results().closed,1);assert.equal(h.calls[0].id,'local-c');assert.ok(Date.parse(h.calls[0].iso)>=before&&Date.parse(h.calls[0].iso)<=after);assert.equal(h.row('local-c'),null);
  await h.click('[data-file-status-filter=archived]');assert.ok(h.row('local-c'));assert.equal(h.row('local-c').querySelector('[aria-label^="Show in tree:"]'),null);
  const retained=h.props.files.find(file=>file.id==='local-c');assert.equal(retained.size,10);assert.equal(retained.addedAt,'2026-10-31T12:13:14.000Z');
  await h.click(h.button('local-c','Reactivate'));assert.equal(h.calls[1].id,'local-c');assert.equal(h.calls[1].iso,null);assert.equal(h.row('local-c'),null);
  await h.click('[data-file-status-filter=active]');assert.ok(h.row('local-c').querySelector('[aria-label^="Show in tree:"]'));assert.equal(h.results().removed,0);
 }finally{await h.dispose()}
});

test('storage errors are visible and leave archive state unchanged; invalid local dates never reach persistence',async()=>{
 const h=await harness();try{
  h.fail(Error('Device storage quota exceeded'));await h.click(h.button('active-a','Deactivate now'));
  assert.equal(h.results().closed,0);assert.match(h.el('[role=alert]').textContent,/Could not change file lifetime: Device storage quota exceeded/);assert.ok(h.row('active-a'));assert.equal(h.props.files.find(file=>file.id==='active-a').archived,false);
  const calls=h.calls.length;h.fail(null);await h.setDate('active-a','');await h.click(h.button('active-a','Set date'));
  assert.equal(h.calls.length,calls);assert.match(h.el('[role=alert]').textContent,/Choose a valid local date and time/);
  assert.equal(h.button('active-a','Set date').disabled,false);assert.equal(h.results().removed,0);
 }finally{await h.dispose()}
});


test('archived public files open inside Nexus and the real viewer footer changes Google to source and back',async()=>{
 const h=await harness({initialStatus:'archived',actualPreview:true});try{
  assert.ok(h.button('archived-b','Preview file'));
  await h.click(h.button('archived-b','Preview file'));
  let frame=h.el('#nexusFilePreview iframe');assert.ok(frame);assert.match(frame.src,/^https:\/\/docs\.google\.com\/gview\?/);assert.match(frame.title,/Archived survey/);
  const footerButton=()=>h.el('#nexusFilePreview footer button');assert.equal(footerButton().textContent,'Source preview');
  await h.click(footerButton());frame=h.el('#nexusFilePreview iframe');assert.ok(frame);assert.match(frame.src,/^blob:/);assert.match(frame.title,/^PDF preview:/);
  assert.equal(h.fetchCalls.length,1);assert.equal(h.fetchCalls[0].options.credentials,'omit');assert.equal(h.createdUrls[0].blob.type,'application/pdf');
  assert.equal(footerButton().textContent,'Try Google preview');await h.click(footerButton());assert.match(h.el('#nexusFilePreview iframe').src,/^https:\/\/docs\.google\.com\/gview\?/);
  assert.equal(h.results().revealed,null);assert.equal(h.results().removed,0);
 }finally{await h.dispose()}
});

test('actual Nexus addition time is shown with UTC seconds and source publication remains separate without invented imports',async()=>{
 const h=await harness();try{
  const added=h.row('local-c').querySelector('.nx-file-added-time');assert.match(added.textContent,/Added to Nexus · 2026-10-31 12:13:14 UTC/);
  assert.equal(added.querySelector('time').getAttribute('datetime'),'2026-10-31T12:13:14.000Z');
  assert.equal(h.row('active-a').querySelector('.nx-file-added-time').textContent,'Nexus addition time unavailable');
  assert.match(h.row('active-a').querySelector('.nx-file-source-date').textContent,/Source publication · 2022-01-01/);
  await h.click('[data-file-status-filter=archived]');assert.equal(h.row('archived-b').querySelector('.nx-file-added-time').textContent,'Nexus addition time unavailable');
  assert.match(h.row('archived-b').querySelector('.nx-file-source-date').textContent,/Source publication · 2021-01-01/);
 }finally{await h.dispose()}
});

test('immediate deactivation waits for a successful metadata commit before closing the catalog for the archive animation',async()=>{
 const h=await harness();try{
  const release=h.deferSave();await h.click(h.button('active-a','Deactivate now'));
  assert.equal(h.results().closed,0);assert.ok(h.row('active-a'));assert.equal(h.props.files.find(file=>file.id==='active-a').archived,false);
  await h.React.act(async()=>{release();await Promise.resolve();await Promise.resolve()});
  assert.equal(h.results().closed,1);assert.equal(h.props.files.find(file=>file.id==='active-a').archived,true);assert.equal(h.results().removed,0);
 }finally{await h.dispose()}
});
