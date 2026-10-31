const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const sourceRoot='apps/nexus-graph-preview/relationship-tree/src/';

async function harness({files=null,saved=null,onAddFiles=null,initialFile=null,contextSaved=null,fetchImpl=null,localBlob=null}={}){
 const dom=new JSDOM('<button id="origin">Origin</button><div id="mount"></div>',{url:'https://example.test/?world=esafe-demo'}),w=dom.window;
 global.window=w;global.document=w.document;global.navigator=w.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),ReactDOM=require('react-dom'),{createRoot}=require('react-dom/client'),jsx=require('react/jsx-runtime');
 const timers=new Map();let timerId=0;
 const fetchCalls=[],createdUrls=[],revokedUrls=[];
 class PreviewURL extends URL {
  static createObjectURL(blob){const url='blob:https://example.test/preview-'+(createdUrls.length+1);createdUrls.push({url,blob});return url}
  static revokeObjectURL(url){revokedUrls.push(url)}
 }
 const fetchFile=async(url,options)=>{fetchCalls.push({url,options});return fetchImpl?fetchImpl(url,options):{ok:true,status:200,blob:async()=>new Blob(['%PDF-1.7\npreview fixture'],{type:'application/octet-stream'})}};
 const ctx={window:w,document:w.document,localStorage:w.localStorage,URL:PreviewURL,Blob,AbortController,fetch:fetchFile,CustomEvent:w.CustomEvent,b:React,s:jsx,ko:ReactDOM,
  setInterval:fn=>{const id=++timerId;timers.set(id,fn);return id},clearInterval:id=>timers.delete(id)};
 vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/data.js','utf8'),ctx);
 vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/files.js','utf8'),ctx);
 for(const name of ['local-files.js','project-files.js','file-playback.js','timespace-model.js','timespace-view.js','timespace-player.js'])vm.runInContext(fs.readFileSync(sourceRoot+name,'utf8'),ctx);
 if(localBlob)ctx.nxLocalFileBlob=async()=>localBlob;
 const initialFiles=files||Array.from(ctx.nxEsafeCatalog(ctx.window.ESAFE_RECORDS));
 const key='nosmo.timespace.player:v1:esafe-demo';
 if(saved)w.localStorage.setItem(key,JSON.stringify(saved));
 if(contextSaved)w.localStorage.setItem('nosmo.timespace:v1:esafe-demo',JSON.stringify(contextSaved));
 const events=[];w.addEventListener('nexus:timespace-current-file',event=>events.push(event.detail.fileId));
 let closed=0,openedFiles=0,revealed=null,props={files:initialFiles,onClose:()=>closed++,onReveal:id=>revealed=id,onOpenFiles:()=>openedFiles++,onAddFiles:onAddFiles||(async()=>[]),world:'esafe-demo',initialFile};
 let root=createRoot(w.document.getElementById('mount'));
 const render=()=>React.act(async()=>{root.render(jsx.jsx(ctx.NexusTimeSpace,props));await Promise.resolve()});
 const click=target=>React.act(async()=>{const el=typeof target==='string'?w.document.querySelector(target):target;assert.ok(el,'Missing target '+target);el.click();await Promise.resolve()});
 const range=async index=>React.act(async()=>{const el=w.document.querySelector('[aria-label="Chronological file position"]');Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(el,String(index));el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}));await Promise.resolve()});
 const update=async next=>{props={...props,...next};await render()};
 const remount=async()=>{await React.act(()=>root.unmount());root=createRoot(w.document.getElementById('mount'));await render()};
 const tick=()=>React.act(async()=>{const callback=[...timers.values()][0];if(callback)callback();await Promise.resolve()});
 const add=async selected=>React.act(async()=>{const input=w.document.querySelector('[aria-label="Add files to Nexus"]');Object.defineProperty(input,'files',{configurable:true,value:selected});input.dispatchEvent(new w.Event('change',{bubbles:true}));await Promise.resolve();await Promise.resolve()});
 const currentName=()=>w.document.querySelector('.nx-pti-event strong').textContent;
 const stored=()=>JSON.parse(w.localStorage.getItem(key));
 const dispose=async()=>{await React.act(()=>root.unmount());w.close()};
 w.document.getElementById('origin').focus();await render();
 return {w,ctx,React,files:initialFiles,render,click,range,update,remount,tick,add,currentName,stored,dispose,timers,events,fetchCalls,createdUrls,revokedUrls,results:()=>({closed,openedFiles,revealed})};
}

test('player retains the original console, right-hand file knob and transport structure without VOL, recording or screen buttons',async()=>{
 const h=await harness();try{
  const player=h.w.document.getElementById('nexusTimeSpace'),console=player.querySelector('.nx-pti-console');
  assert.ok(player.classList.contains('nx-pti-open'));assert.ok(player.classList.contains('nx-timespace-player'));
  assert.ok(console.children[0].classList.contains('nx-pti-left'));assert.ok(console.children[1].classList.contains('nx-pti-knob-zone'));
  assert.ok(console.children[1].querySelector('button.nx-pti-knob.nx-pti-file-knob'));
  for(const selector of ['.nx-pti-ticker','.nx-pti-date','.nx-pti-clock','.nx-pti-transport','.nx-pti-mode','.nx-pti-phase','.nx-pti-rail','.nx-pti-status','.nx-pti-event'])assert.ok(player.querySelector(selector),selector);
  for(const cmd of ['vol','rec','record','scrn','screen'])assert.equal(player.querySelector('[data-cmd="'+cmd+'"]'),null);
  assert.equal(player.querySelector('[aria-label="Volume"]'),null);assert.equal(h.w.document.getElementById('nexusFilePreview'),null);
  assert.equal(player.getAttribute('role'),'region');assert.equal(player.hasAttribute('aria-modal'),false);
 }finally{await h.dispose()}
});

test('range and previous/next select all 106 individual files including equal-date multi-file source records',async()=>{
 const h=await harness();try{
  const sequence=Array.from(h.ctx.nxTimeSpaceSequence(h.files)),slider=h.w.document.querySelector('[aria-label="Chronological file position"]');
  assert.equal(slider.min,'0');assert.equal(slider.max,'105');assert.equal(slider.step,'1');
  assert.equal(h.currentName(),sequence[0].name);assert.equal(h.w.document.querySelector('[aria-label="Previous file"]').disabled,true);
  await h.click('[aria-label="Next file"]');assert.equal(h.currentName(),sequence[1].name);assert.equal(slider.value,'1');
  await h.click('[aria-label="Previous file"]');assert.equal(h.currentName(),sequence[0].name);
  for(const [recordId,count] of [['6598271',6],['6505195',7]]){
   const start=sequence.findIndex(file=>file.recordId===recordId);await h.range(start);
   for(let step=0;step<count;step++){
    assert.equal(h.currentName(),sequence[start+step].name);assert.equal(h.stored().currentId,sequence[start+step].id);
    if(step<count-1)await h.click('[aria-label="Next file"]');
   }
   await h.click('[aria-label="Previous file"]');assert.equal(h.currentName(),sequence[start+count-2].name);
  }
  await h.range(105);assert.equal(h.currentName(),sequence[105].name);assert.equal(slider.value,'105');assert.equal(h.w.document.querySelector('[aria-label="Next file"]').disabled,true);
 }finally{await h.dispose()}
});

test('the file knob toggles a bounded Google preview and next updates only an already-open preview',async()=>{
 const h=await harness();try{
  const sequence=Array.from(h.ctx.nxTimeSpaceSequence(h.files));
  assert.equal(h.w.document.querySelector('#nexusFilePreview iframe'),null);
  await h.click('[aria-label="Show file preview"]');
  let frame=h.w.document.querySelector('#nexusFilePreview iframe');assert.ok(frame);assert.equal(frame.src,h.ctx.nxGooglePreviewUrl(sequence[0]));
  assert.equal(frame.getAttribute('allowfullscreen'),null);assert.equal(h.w.document.querySelector('#nexusFilePreview').getAttribute('role'),'region');
  const first=frame.src;await h.click('[aria-label="Next file"]');frame=h.w.document.querySelector('#nexusFilePreview iframe');
  assert.ok(frame);assert.notEqual(frame.src,first);assert.equal(frame.src,h.ctx.nxGooglePreviewUrl(sequence[1]));assert.equal(frame.title,'Google preview: '+sequence[1].name);
  await h.click('[aria-label="Hide file preview"]');assert.equal(h.w.document.getElementById('nexusFilePreview'),null);
  await h.click('[aria-label="Next file"]');assert.equal(h.currentName(),sequence[2].name);assert.equal(h.w.document.querySelector('iframe'),null);
  await h.click('[aria-label="Show file preview"]');await h.click('[aria-label="Close file preview"]');assert.equal(h.w.document.getElementById('nexusFilePreview'),null);
 }finally{await h.dispose()}
});

test('the player shows source date precision with unknown hours and real Nexus additions with UTC seconds',async()=>{
 const file={id:'source',recordId:'old',name:'Source.pdf',kind:'PDF',date:'2023-01-01',dateRaw:'2023',datePrecision:'year',category:'Research',fileUrl:'https://zenodo.org/records/1/files/Source.pdf'};
 const added={...file,id:'added',recordId:'new',name:'Added.pdf',date:'2026-10-31',dateRaw:'2026-10-31',datePrecision:'day',addedAt:'2026-10-31T14:12:39+01:00'};
 const h=await harness({files:[added,file]});try{
  assert.equal(h.w.document.querySelector('.nx-pti-date').textContent,'2023 (year only)');assert.equal(h.w.document.querySelector('.nx-pti-clock').textContent,'--:--');
  assert.equal(h.w.document.querySelector('.nx-pti-time-basis').textContent,'Source publication · addition time unknown');
  await h.click('[aria-label="Next file"]');assert.equal(h.currentName(),'Added.pdf');assert.equal(h.w.document.querySelector('.nx-pti-date').textContent,'2026-10-31');
  assert.equal(h.w.document.querySelector('.nx-pti-clock').textContent,'13:12:39 UTC');assert.equal(h.w.document.querySelector('.nx-pti-time-basis').textContent,'Added to Nexus');
 }finally{await h.dispose()}
});

test('playback advances once per tick, pauses immediately on the last file and cannot pass either boundary',async()=>{
 const files=[0,1,2].map(index=>({id:'f'+index,recordId:'r'+index,name:'File '+index+'.pdf',kind:'PDF',date:'2026-03-0'+(index+1),category:'Research',fileUrl:'https://zenodo.org/records/1/files/f'+index+'.pdf'}));
 const h=await harness({files});try{
  assert.equal(h.w.document.querySelector('[aria-label="Previous file"]').disabled,true);await h.click('[aria-label="Previous file"]');assert.equal(h.currentName(),files[0].name);
  await h.click('[aria-label="Play files"]');assert.equal(h.timers.size,1);await h.tick();assert.equal(h.currentName(),files[1].name);
  await h.tick();assert.equal(h.currentName(),files[2].name);assert.equal(h.timers.size,0);assert.ok(h.w.document.querySelector('[aria-label="Play files"]'));
  await h.tick();assert.equal(h.currentName(),files[2].name);assert.equal(h.w.document.querySelector('[aria-label="Next file"]').disabled,true);
  await h.click('[aria-label="First file"]');assert.equal(h.currentName(),files[0].name);await h.click('[aria-label="Last file"]');assert.equal(h.currentName(),files[2].name);
 }finally{await h.dispose()}
});

test('selected file and source stream survive remount without enabling the preview',async()=>{
 const h=await harness();try{
  await h.range(30);await h.click('[data-mode="source"]');const selected=h.stored().currentId,name=h.currentName();
  assert.equal(h.stored().stream,'source');await h.remount();assert.equal(h.currentName(),name);assert.equal(h.stored().currentId,selected);
  assert.equal(h.w.document.querySelector('[data-mode="source"]').getAttribute('aria-pressed'),'true');assert.equal(h.w.document.getElementById('nexusFilePreview'),null);
  assert.equal(h.w.localStorage.getItem('nosmo.timespace.player:v1:dev'),null);
 }finally{await h.dispose()}
});

test('adding files calls the host, resets filters and selects the imported file when updated props arrive',async()=>{
 const added={id:'local-new',recordId:'local-new',name:'New Level 1 Plan.pdf',kind:'PDF',category:'Design',date:'2026-10-31',dateRaw:'2026-10-31',datePrecision:'day',addedAt:'2026-10-31T15:16:17Z',local:true};
 let calls=0,received=null;const h=await harness({onAddFiles:async list=>{calls++;received=list;return [added]}});
 try{
  await h.click('[data-topic="design-bim"]');await h.click('[data-mode="source"]');
  const selected=[new h.w.File(['%PDF-1.7'],'New Level 1 Plan.pdf',{type:'application/pdf'})];
  await h.add(selected);assert.equal(calls,1);assert.equal(received[0],selected[0]);
  await h.update({files:[...h.files,added]});assert.equal(h.currentName(),added.name);assert.equal(h.stored().currentId,added.id);assert.equal(h.stored().stream,'all');
  assert.equal(h.w.document.querySelector('[aria-label="Chronological file position"]').max,'106');
  const context=JSON.parse(h.w.localStorage.getItem('nosmo.timespace:v1:esafe-demo'));assert.equal(context.year,'all');assert.equal(context.location,'all');assert.equal(context.topic,'all');
  assert.equal(h.w.document.getElementById('nexusFilePreview'),null);assert.equal(h.w.document.querySelector('.nx-pti-clock').textContent,'15:16:17 UTC');
 }finally{await h.dispose()}
});

test('the legacy catalog opens separately and selecting its file returns to that player position',async()=>{
 const h=await harness();try{
  await h.click('[aria-label="Catalog and locations"]');const catalog=h.w.document.getElementById('nexusTimeSpaceCatalog');assert.ok(catalog);
  assert.ok(h.w.document.getElementById('nexusTimeSpace'));assert.equal(catalog.querySelectorAll('[data-timespace-file]').length,106);
  const target=catalog.querySelector('[data-timespace-file="d-firecerts"] button');assert.ok(target);await h.click(target);
  assert.equal(h.w.document.getElementById('nexusTimeSpaceCatalog'),null);assert.equal(h.stored().currentId,'d-firecerts');assert.equal(h.w.document.getElementById('nexusFilePreview'),null);
 }finally{await h.dispose()}
});


test('Design + BIM combines both real topics and keeps the combined filter after remount',async()=>{
 const h=await harness();try{
  const expected=h.files.filter(file=>file.category==='Design'||file.category==='BIM');
  assert.ok(expected.some(file=>file.category==='Design'));assert.ok(expected.some(file=>file.category==='BIM'));
  await h.click('[data-topic="design-bim"]');
  assert.equal(h.w.document.querySelector('[aria-label="Chronological file position"]').max,String(expected.length-1));
  assert.equal(h.w.document.querySelector('[data-topic="design-bim"]').getAttribute('aria-pressed'),'true');
  assert.equal(JSON.parse(h.w.localStorage.getItem('nosmo.timespace:v1:esafe-demo')).topic,'design-bim');
  await h.remount();assert.equal(h.w.document.querySelector('[aria-label="Chronological file position"]').max,String(expected.length-1));
  assert.equal(h.w.document.querySelector('[data-topic="design-bim"]').getAttribute('aria-pressed'),'true');
 }finally{await h.dispose()}
});

test('incoming initialFile clears incompatible saved filters without emitting a wrong fallback file',async()=>{
 const target='d-firecerts';
 const h=await harness({initialFile:target,saved:{stream:'added'},contextSaved:{year:'2021',topic:'Survey',location:'building'}});try{
  assert.equal(h.stored().currentId,target);assert.equal(h.stored().stream,'all');
  assert.ok(h.events.length>0);assert.ok(h.events.every(id=>id===target));
  const context=JSON.parse(h.w.localStorage.getItem('nosmo.timespace:v1:esafe-demo'));
  assert.equal(context.year,'all');assert.equal(context.topic,'all');assert.equal(context.location,'all');
  assert.equal(h.w.document.querySelector('[aria-label="Chronological file position"]').max,'105');
  await h.click('[aria-label="Next file"]');assert.notEqual(h.stored().currentId,target);
 }finally{await h.dispose()}
});

test('a pending incoming local file stays selected when device files arrive after the player mounts',async()=>{
 const added={id:'local-incoming',recordId:'local-incoming',name:'New import.pdf',kind:'PDF',category:'Design',date:'2026-10-31',dateRaw:'2026-10-31',datePrecision:'day',addedAt:'2026-10-31T16:17:18Z',local:true};
 const h=await harness({initialFile:added.id,saved:{stream:'source'},contextSaved:{year:'2022',topic:'BIM',location:'building'}});try{
  assert.deepEqual(h.events,[]);
  await h.update({files:[...h.files,added]});assert.equal(h.stored().currentId,added.id);assert.equal(h.currentName(),added.name);
  assert.ok(h.events.length>0);assert.ok(h.events.every(id=>id===added.id));assert.equal(h.stored().stream,'all');
  assert.equal(h.w.document.querySelector('.nx-pti-clock').textContent,'16:17:18 UTC');
 }finally{await h.dispose()}
});


test('an already-visible initialFile is persisted and dispatched on mount without requiring an interaction',async()=>{
 const h=await harness({initialFile:'d-firecerts',saved:{currentId:'d-snaglist',stream:'all'}});try{
  assert.equal(h.stored().currentId,'d-firecerts');assert.ok(h.events.length>0);assert.ok(h.events.every(id=>id==='d-firecerts'));
 }finally{await h.dispose()}
});

test('manual Next or slider selection cancels a stale missing local initialFile without a later focus jump',async()=>{
 for(const action of ['next','slider']){
  const missing='local-unavailable',h=await harness({initialFile:missing});try{
   assert.deepEqual(h.events,[]);
   const sequence=Array.from(h.ctx.nxTimeSpaceSequence(h.files)),index=action==='next'?1:7;
   if(action==='next')await h.click('[aria-label="Next file"]');else await h.range(index);
   const selected=sequence[index];assert.equal(h.currentName(),selected.name);assert.equal(h.stored().currentId,selected.id);
   assert.ok(h.events.length>0);assert.ok(h.events.every(id=>id===selected.id));
   const delayed={id:missing,recordId:missing,name:'Previously unavailable.pdf',kind:'PDF',category:'Design',date:'2026-10-31',dateRaw:'2026-10-31',datePrecision:'day',addedAt:'2026-10-31T16:17:18Z',local:true};
   await h.update({files:[...h.files,delayed]});
   assert.equal(h.currentName(),selected.name);assert.equal(h.stored().currentId,selected.id);assert.ok(h.events.every(id=>id===selected.id));
  }finally{await h.dispose()}
 }
});

test('source fallback fetches a PDF without credentials, uses a typed Blob URL, keeps source mode across Next and releases URLs',async()=>{
 const h=await harness();try{
  const sequence=Array.from(h.ctx.nxTimeSpaceSequence(h.files));
  await h.click('[aria-label="Show file preview"]');
  const google=h.w.document.querySelector('#nexusFilePreview iframe');assert.equal(google.src,h.ctx.nxGooglePreviewUrl(sequence[0]));assert.equal(h.fetchCalls.length,0);
  const sourceButton=[...h.w.document.querySelectorAll('#nexusFilePreview button')].find(button=>button.textContent==='Source preview');assert.ok(sourceButton);await h.click(sourceButton);
  let frame=h.w.document.querySelector('#nexusFilePreview iframe');assert.ok(frame);assert.equal(frame.title,'PDF preview: '+sequence[0].name);assert.equal(frame.src,h.createdUrls[0].url);
  assert.equal(h.fetchCalls.length,1);assert.equal(h.fetchCalls[0].url,sequence[0].fileUrl);assert.equal(h.fetchCalls[0].options.credentials,'omit');assert.ok(h.fetchCalls[0].options.signal instanceof AbortSignal);assert.equal(h.createdUrls[0].blob.type,'application/pdf');assert.match(await h.createdUrls[0].blob.text(),/^%PDF/);
  assert.ok([...h.w.document.querySelectorAll('#nexusFilePreview button')].some(button=>button.textContent==='Try Google preview'));
  const firstBlob=frame.src;await h.click('[aria-label="Next file"]');frame=h.w.document.querySelector('#nexusFilePreview iframe');
  assert.equal(frame.title,'PDF preview: '+sequence[1].name);assert.equal(frame.src,h.createdUrls[1].url);assert.notEqual(frame.src,firstBlob);assert.equal(h.fetchCalls[1].url,sequence[1].fileUrl);assert.equal(h.fetchCalls[0].options.signal.aborted,true);assert.ok(h.revokedUrls.includes(firstBlob));
  const secondBlob=frame.src;await h.click('[aria-label="Close file preview"]');assert.equal(h.w.document.getElementById('nexusFilePreview'),null);assert.equal(h.fetchCalls[1].options.signal.aborted,true);assert.ok(h.revokedUrls.includes(secondBlob));
 }finally{await h.dispose()}
});

test('failed source fetch shows a useful error and allows the explicit Google fallback',async()=>{
 const h=await harness({fetchImpl:async()=>({ok:false,status:503,blob:async()=>{throw Error('Not reached')}})});try{
  await h.click('[aria-label="Show file preview"]');await h.click([...h.w.document.querySelectorAll('#nexusFilePreview button')].find(button=>button.textContent==='Source preview'));
  assert.equal(h.w.document.querySelector('#nexusFilePreview iframe'),null);assert.match(h.w.document.querySelector('#nexusFilePreview [role="alert"]').textContent,/HTTP 503/);assert.equal(h.createdUrls.length,0);
  await h.click([...h.w.document.querySelectorAll('#nexusFilePreview button')].find(button=>button.textContent==='Try Google preview'));
  assert.ok(h.w.document.querySelector('#nexusFilePreview iframe[title^="Google preview:"]'));assert.equal(h.w.document.querySelector('#nexusFilePreview [role="alert"]'),null);assert.equal(h.fetchCalls.length,1);
 }finally{await h.dispose()}
});

test('late source fetches cannot replace the next file preview after cancellation',async()=>{
 let resolveFirst,calls=0;
 const h=await harness({fetchImpl:()=>{if(calls++===0)return new Promise(resolve=>resolveFirst=resolve);return Promise.resolve({ok:true,status:200,blob:async()=>new Blob(['%PDF second'],{type:'application/octet-stream'})})}});try{
  await h.click('[aria-label="Show file preview"]');await h.click([...h.w.document.querySelectorAll('#nexusFilePreview button')].find(button=>button.textContent==='Source preview'));
  assert.match(h.w.document.querySelector('#nexusFilePreview [role="status"]').textContent,/Loading file/);
  await h.click('[aria-label="Next file"]');const frame=h.w.document.querySelector('#nexusFilePreview iframe'),currentSource=frame.src;
  assert.equal(h.fetchCalls[0].options.signal.aborted,true);assert.equal(h.createdUrls.length,1);
  await h.React.act(async()=>{resolveFirst({ok:true,status:200,blob:async()=>new Blob(['%PDF stale'])});await Promise.resolve();await Promise.resolve()});
  assert.equal(h.w.document.querySelector('#nexusFilePreview iframe').src,currentSource);assert.equal(h.createdUrls.length,1);
 }finally{await h.dispose()}
});

test('device files use their local Blob and never request a source fetch or offer a Google preview',async()=>{
 const local={id:'local-preview',recordId:'local-preview',name:'Device plan.pdf',kind:'PDF',category:'Design',local:true,addedAt:'2026-10-31T16:17:18Z',date:'2026-10-31',dateRaw:'2026-10-31',datePrecision:'day',fileUrl:null,sourceUrl:null};
 const h=await harness({files:[local],localBlob:new Blob(['%PDF private device'],{type:'application/pdf'})});try{
  await h.click('[aria-label="Show file preview"]');const frame=h.w.document.querySelector('#nexusFilePreview iframe');assert.equal(frame.src,h.createdUrls[0].url);assert.equal(frame.title,'PDF preview: '+local.name);assert.equal(h.fetchCalls.length,0);
  assert.equal(h.w.document.querySelector('#nexusFilePreview iframe[title^="Google preview:"]'),null);assert.ok(![...h.w.document.querySelectorAll('#nexusFilePreview button')].some(button=>/Google/.test(button.textContent)));
  const source=frame.src;await h.click('[aria-label="Close file preview"]');assert.ok(h.revokedUrls.includes(source));
 }finally{await h.dispose()}
});
