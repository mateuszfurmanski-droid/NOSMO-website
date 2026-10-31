// Maintained source for the existing AU graph component in the deployed legacy bundle.
// Rebuild with scripts/build-tile-groups.py; uses the bundle's React and icon imports.
function NxArchiveTileIcon({className}={}) {
  return s.jsxs('svg',{viewBox:'0 0 24 24',width:24,height:24,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round',className,'aria-hidden':true,children:[s.jsx('rect',{x:2,y:3,width:20,height:5,rx:1.5}),s.jsx('path',{d:'M4 8v12h16V8M12 11v6m-3-3 3 3 3-3'})]});
}
function AU(){
  const world=window.__NEXUS_PROJECT_WORLD__||'dev';
  const key='nosmo-tile-groups:v2:'+world;
  const esafe={proj:['e-SAFE Catania Real Pilot','project'],'p-mateusz':['Structural / Seismic','task'],'p-sitemgr':['MEP / Energy','task'],'p-architect':['Electrical / Controls','task'],'p-client':['BIM / Digital','task'],'p-team':['Fabrication / Installation','task'],'d-groundfloor':['Survey / QA','task'],'d-doorschedule':['Project / General','task'],'d-snaglist':['D5.1 Detailed survey','document'],'d-firecerts':['D2.2 3D models','document'],'t-install':['D5.5 Monitoring','document'],'t-snag':['D5.4 Production delivery','document'],'t-fire':['D5.3 Detailed design','document'],'t-walkthrough':['Pilot Actions','task']};
  const sourceCatalog=b.useMemo(()=>world==='esafe-demo'?nxEsafeCatalog(window.ESAFE_RECORDS||[]):[],[world]);
  const [deviceFiles,setDeviceFiles]=b.useState([]),[fileError,setFileError]=b.useState('');
  const [lifeRules,setLifeRules]=b.useState(()=>{try{return nxFileLifecycleRead(world)}catch{return{}}}),[lifeNow,setLifeNow]=b.useState(()=>Date.now());
  const [graphClock,setGraphClock]=b.useState({mode:'live',at:null}),[graphHistory,setGraphHistory]=b.useState(()=>{try{return typeof nxGraphHistoryRead==='function'?nxGraphHistoryRead(world):null}catch{return null}});
  const rawCatalog=b.useMemo(()=>[...sourceCatalog,...deviceFiles],[sourceCatalog,deviceFiles]);
  const [library,setLibrary]=b.useState(()=>world==='esafe-demo'&&new URLSearchParams(window.location.search).get('files')==='all'),[libraryFile,setLibraryFile]=b.useState(null),[libraryScope,setLibraryScope]=b.useState('active'),[libraryAt,setLibraryAt]=b.useState(null),[fileFocus,setFileFocus]=b.useState(()=>new URLSearchParams(window.location.search).get('file'));
  const [timeSpace,setTimeSpace]=b.useState(()=>world==='esafe-demo'&&new URLSearchParams(window.location.search).get('view')==='timespace'),[timeFilter,setTimeFilter]=b.useState(null);
  const replay=world==='esafe-demo'&&timeSpace&&graphClock.mode==='replay'&&Number.isFinite(graphClock.at);
  const viewAt=library&&Number.isFinite(libraryAt)?libraryAt:replay?graphClock.at:lifeNow;
  const catalog=b.useMemo(()=>{let lifecycleHistory;try{if(typeof nxFileLifecycleHistory==='function')lifecycleHistory=nxFileLifecycleHistory(world)}catch{}return nxFileLifecycleApply(rawCatalog,lifeRules,viewAt,lifecycleHistory)},[rawCatalog,lifeRules,viewAt]);
  const available=file=>{const at=nxFileMoment(file).timestamp;return at===null||at<=viewAt};
  const activeCatalog=catalog.filter(file=>!file.archived&&available(file)),archivedCatalog=catalog.filter(file=>file.archived&&available(file));
  const objects=b.useMemo(()=>world==='esafe-demo'?[...ns.filter(o=>esafe[o.id]&&esafe[o.id][1]!=='document').map(o=>({...o,label:esafe[o.id][0],type:esafe[o.id][1]})),...catalog.map(file=>({...file,label:file.name,type:'document',Icon:ns.find(o=>o.type==='document')?.Icon||Dt}))]:ns,[world,catalog]);
  const ids=b.useMemo(()=>objects.map(o=>o.id),[objects]);
  const [state,setState]=b.useState(()=>{try{const raw=JSON.parse(localStorage.getItem(key));const pendingLocal=(raw?.groups||[]).flatMap(g=>Array.isArray(g.members)?g.members.filter(id=>typeof id==='string'&&id.startsWith('local-')):[]);return nxCleanWorkspace(raw,[...ids,...pendingLocal])}catch{return nxCleanWorkspace(null,ids)}});
  const [open,setOpen]=b.useState(()=>state.groups.find(group=>group.members.includes(fileFocus))?.id||null),[selected,setSelected]=b.useState(fileFocus||'proj');
  const [zoom,setZoom]=b.useState(window.innerWidth<720?.52:.72),[pan,setPan]=b.useState({x:0,y:0});
  const [size,setSize]=b.useState({w:0,h:0}),[drag,setDrag]=b.useState(null),[hover,setHover]=b.useState(null);
  const [notice,setNotice]=b.useState('Drag one tile onto another to create a node'),[undo,setUndo]=b.useState(null),[mode,setMode]=b.useState('map');
  const root=b.useRef(null),current=b.useRef(state),gesture=b.useRef(null),touches=b.useRef(new Map()),frame=b.useRef(null),pending=b.useRef(null),suppress=b.useRef(0);
  current.current=state;
  const replayRef=b.useRef(replay);replayRef.current=replay;
  const historicalGroups=replay?(typeof nxGraphHistoryAt==='function'?nxGraphHistoryAt(graphHistory,viewAt):null):state.groups;
  const historyUnknown=replay&&historicalGroups===null&&!!graphHistory?.baseline?.groups?.length;
  const displayedGroups=replay?(historicalGroups||[]):state.groups;
  const activeIds=new Set(objects.filter(o=>world!=='esafe-demo'||o.type!=='document'||activeCatalog.some(file=>file.id===o.id)).map(o=>o.id));
  const effectiveGroups=displayedGroups.map(group=>({...group,members:group.members.filter(id=>activeIds.has(id))})).filter(group=>group.members.length);
  const replayFocusOwner=effectiveGroups.find(group=>group.members.includes(fileFocus))?.id||null;
  b.useEffect(()=>{if(replay)setOpen(replayFocusOwner)},[replay,fileFocus,replayFocusOwner]);
  const groupNodes=effectiveGroups.map(group=>({id:group.id,type:'task',label:'Node '+(displayedGroups.findIndex(g=>g.id===group.id)+1),Icon:Dt,members:group.members}));
  const archiveNode=world==='esafe-demo'?{id:'nexus-archive',type:'task',label:'Archive',Icon:NxArchiveTileIcon,archive:true,count:archivedCatalog.length}:null;
  const graphObjects=[...objects.filter(o=>activeIds.has(o.id)),...(archiveNode?[archiveNode]:[])];
  const all=[...graphObjects,...groupNodes],byId=new Map([...objects,...groupNodes,...(archiveNode?[archiveNode]:[])].map(o=>[o.id,o]));
  const members=new Set(effectiveGroups.flatMap(group=>group.members));
  const opened=effectiveGroups.find(group=>group.id===open);
  const visible=all.filter(o=>!members.has(o.id)||opened?.members.includes(o.id));
  const edges=nxGroupEdges(graphObjects,effectiveGroups,open);
  const activeEdges=replay?edges.filter(edge=>edge.source===selected||edge.target===selected):[];
  const connectedActive=new Set([selected,...activeEdges.flatMap(edge=>[edge.source,edge.target])]);
  const positions=EU([...graphObjects.filter(o=>world!=='esafe-demo'||o.type!=='document'),...groupNodes].filter(o=>!members.has(o.id)),'proj',edges,state.pinned,false,drag);
  const chronologicalFiles=nxTimeSpaceSequence(activeCatalog).filter(file=>!members.has(file.id));
  chronologicalFiles.forEach((file,index)=>positions.set(file.id,{x:400,y:-240+index*165}));
  if(archiveNode){const screenX=Math.min(68,Math.max(44,size.w-44)),screenY=Math.min(170,Math.max(90,size.h-110));positions.set(archiveNode.id,{x:(screenX-size.w/2-pan.x)/zoom,y:(screenY-size.h/2-pan.y)/zoom})}
  if(opened){const center=positions.get(opened.id)||{x:0,y:0};nxPlaceMembers(center,opened.members,positions).forEach((point,id)=>positions.set(id,point))}
  if(drag&&state.pinned[drag])positions.set(drag,state.pinned[drag]);
  const catalogRef=b.useRef(catalog);catalogRef.current=catalog;
  b.useEffect(()=>{
    if(world!=='esafe-demo')return;
    const refresh=()=>{try{setLifeRules(nxFileLifecycleRead(world));if(typeof nxGraphHistoryRead==='function')setGraphHistory(nxGraphHistoryRead(world));setLifeNow(Date.now())}catch(error){setFileError('Could not read file availability: '+error.message)}};
    const changed=event=>{if(event.detail?.world===world)refresh()},storage=event=>{if(event.key===null||event.key===nxFileLifecycleKey(world)||event.key==='nosmo.graph-history:v1:'+world)refresh()},visibleAgain=()=>{if(!document.hidden)refresh()};
    window.addEventListener('nexus:file-lifecycle-updated',changed);window.addEventListener('nexus:graph-history-updated',changed);window.addEventListener('focus',refresh);window.addEventListener('storage',storage);document.addEventListener('visibilitychange',visibleAgain);
    try{if(typeof nxGraphHistoryEnsure==='function')setGraphHistory(nxGraphHistoryEnsure(world,current.current.groups,new Date().toISOString()))}catch(error){setFileError('Connections saved, but history is unavailable: '+error.message)}
    refresh();
    return()=>{window.removeEventListener('nexus:file-lifecycle-updated',changed);window.removeEventListener('nexus:graph-history-updated',changed);window.removeEventListener('focus',refresh);window.removeEventListener('storage',storage);document.removeEventListener('visibilitychange',visibleAgain)};
  },[world]);
  b.useEffect(()=>{if(world!=='esafe-demo'||replay)return;const next=nxFileLifecycleNext(catalog,lifeNow);if(next===null)return;const timer=setTimeout(()=>setLifeNow(Date.now()),Math.min(2147483647,Math.max(0,next-Date.now()+1)));return()=>clearTimeout(timer)},[world,lifeRules,rawCatalog,lifeNow,replay]);
  b.useEffect(()=>{if(!catalog.some(file=>file.id===fileFocus&&file.archived))return;setFileFocus(null);setSelected('nexus-archive');const url=new URL(window.location.href);if(url.searchParams.get('file')===fileFocus){url.searchParams.delete('file');window.history.replaceState(null,'',url)}},[catalog,fileFocus]);
  b.useLayoutEffect(()=>{const el=root.current;if(!el)return;const resize=()=>setSize({w:el.clientWidth,h:el.clientHeight});resize();const obs=new ResizeObserver(resize);obs.observe(el);return()=>obs.disconnect()},[mode]);
  b.useLayoutEffect(()=>{if(world!=='esafe-demo')return;let live=true;const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('nosmo-project-files'):null;
    const refresh=()=>{if(!window.indexedDB)return;nxLocalFilesList(world).then(list=>{if(live){setDeviceFiles(list);setLifeNow(Date.now());setFileError('')}}).catch(e=>live&&setFileError(e.message))};
    const updated=e=>{if(e.detail?.world!==world)return;refresh();channel?.postMessage({world})};if(channel)channel.onmessage=e=>{if(e.data?.world===world)refresh()};
    const legacyChange=e=>{if(e.target.id!=='nexusFileInput')return;e.stopImmediatePropagation();const list=Array.from(e.target.files||[]);e.target.value='';if(list.length)addFiles(list).then(()=>openTimeSpace()).catch(e=>setFileError(e.message))};
    const pickerClick=e=>{if(!e.target.closest('[data-nexus-action="file-loader"],[data-nexus-file-action="upload"]'))return;e.preventDefault();e.stopImmediatePropagation();document.querySelectorAll('.nexus-shell-panel.open').forEach(n=>n.classList.remove('open'));document.getElementById('nexusShellScrim')?.classList.remove('open');document.getElementById('nexusFileInput')?.click()};
    const drop=e=>{if(!e.dataTransfer?.files?.length)return;e.preventDefault();e.stopImmediatePropagation();addFiles(Array.from(e.dataTransfer.files)).then(()=>openTimeSpace()).catch(e=>setFileError(e.message))};
    const over=e=>{if(Array.from(e.dataTransfer?.types||[]).includes('Files'))e.preventDefault()};
    const currentFile=e=>{if(e.detail?.world!==world)return;setGraphClock({mode:e.detail.mode==='replay'?'replay':'live',at:Number.isFinite(e.detail.at)?e.detail.at:null,focusId:typeof e.detail.focusId==='string'?e.detail.focusId:null,kind:e.detail.kind});if(e.detail.mode!=='replay')setLifeNow(Date.now());if(typeof e.detail.fileId!=='string')return;setFileFocus(e.detail.fileId);setSelected(typeof e.detail.focusId==='string'?e.detail.focusId:e.detail.fileId);const url=new URL(window.location.href);url.searchParams.set('file',e.detail.fileId);window.history.replaceState(null,'',url);setOpen(current.current.groups.find(g=>g.members.includes(e.detail.fileId))?.id||null)};
    window.addEventListener('nexus:local-files-updated',updated);window.addEventListener('focus',refresh);window.addEventListener('nexus:timespace-current-file',currentFile);document.addEventListener('change',legacyChange,true);document.addEventListener('click',pickerClick,true);document.addEventListener('drop',drop,true);document.addEventListener('dragover',over,true);refresh();
    return()=>{live=false;channel?.close();window.removeEventListener('nexus:local-files-updated',updated);window.removeEventListener('focus',refresh);window.removeEventListener('nexus:timespace-current-file',currentFile);document.removeEventListener('change',legacyChange,true);document.removeEventListener('click',pickerClick,true);document.removeEventListener('drop',drop,true);document.removeEventListener('dragover',over,true)}
  },[world]);
  b.useEffect(()=>{if(world!=='esafe-demo')return;window.__NEXUS_NATIVE_ESAFE__=true;document.title='NOSMO Nexus — e-SAFE Catania';const openFiles=()=>openLibrary(),openTime=()=>{window.__NEXUS_TIMESPACE_PENDING__=false;openTimeSpace()},filterTime=event=>setTimeFilter(event.detail);window.addEventListener('nexus:open-project-files',openFiles);window.addEventListener('nexus:open-timespace',openTime);window.addEventListener('nexus:timespace-filter',filterTime);if(window.__NEXUS_TIMESPACE_PENDING__)openTime();return()=>{window.removeEventListener('nexus:open-project-files',openFiles);window.removeEventListener('nexus:open-timespace',openTime);window.removeEventListener('nexus:timespace-filter',filterTime)}},[world]);
  b.useEffect(()=>{if(world!=='esafe-demo')return;const sub=document.getElementById('nexusTopTimeSub');if(sub)sub.textContent=timeSpace?'ON':'OFF';window.dispatchEvent(new CustomEvent('nexus:project-time-change',{detail:{worldId:world,open:timeSpace,mode:'source',source:'publication-timespace'}}))},[timeSpace,world]);
  b.useEffect(()=>{const focus=replay&&graphClock.focusId?graphClock.focusId:fileFocus;if(!focus)return;const point=positions.get(focus);if(point)setPan({x:-point.x*zoom,y:-point.y*zoom})},[fileFocus,open,replay,graphClock.focusId]);
  b.useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current)},[]);
  b.useEffect(()=>{window.dispatchEvent(new CustomEvent('nexus:groups-change'))},[state.groups,open]);
  const persist=(next,previous=null,message='Saved on this device')=>{
    if(replayRef.current){setNotice('Choose Live to edit connections.');return false}
    try{localStorage.setItem(key,JSON.stringify(next))}catch{setNotice('Could not save. Change cancelled — device storage unavailable.');return false}
    if(previous)setUndo(previous);current.current=next;setState(next);setNotice(message);try{if(typeof nxGraphHistoryRecord==='function')setGraphHistory(nxGraphHistoryRecord(world,next.groups,new Date().toISOString()))}catch(error){setNotice(message+' · Connection history could not be saved: '+error.message)}return true;
  };
  const fit=()=>{const pts=[...positions.values()];if(!pts.length)return;const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);const left=Math.min(...xs)-100,right=Math.max(...xs)+100,top=Math.min(...ys)-130,bottom=Math.max(...ys)+130;const z=Math.min(.95,Math.max(.3,Math.min(size.w/(right-left),(size.h-100)/(bottom-top))));setZoom(z);setPan({x:-(left+right)/2*z,y:-(top+bottom)/2*z})};
  const addFiles=async list=>{const added=await nxLocalFilesAdd(world,list);setDeviceFiles(await nxLocalFilesList(world));setLifeNow(Date.now());if(added.length){setFileFocus(added[added.length-1].id);setNotice(added.length+' file(s) added and ordered automatically')}return added};
  const removeFile=async id=>{await nxLocalFilesTrash(world,[id]);setDeviceFiles(await nxLocalFilesList(world))};
  const restoreFile=async id=>{await nxLocalFilesRestore(world,[id]);setDeviceFiles(await nxLocalFilesList(world))};
  const openLibrary=(id=null,scope='active',asOf=null)=>{setLibraryAt(asOf);setGraphClock({mode:'live',at:null});setLifeNow(Date.now());setTimeSpace(false);setLibraryScope(scope);setLibraryFile(id);setLibrary(true);const url=new URL(window.location.href);url.searchParams.delete('view');url.searchParams.set('files','all');window.history.replaceState(null,'',url)};
  const closeLibrary=()=>{setLibrary(false);setLibraryAt(null);setLifeNow(Date.now());const url=new URL(window.location.href);url.searchParams.delete('files');window.history.replaceState(null,'',url)};
  const openTimeSpace=()=>{setLibrary(false);setTimeSpace(true);const url=new URL(window.location.href);url.searchParams.delete('files');url.searchParams.set('view','timespace');window.history.replaceState(null,'',url)};
  const closeTimeSpace=()=>{setGraphClock({mode:'live',at:null});setLifeNow(Date.now());setTimeSpace(false);const url=new URL(window.location.href);url.searchParams.delete('view');window.history.replaceState(null,'',url)};
  const setDeactivation=async(id,iso)=>{const next=nxFileLifecycleSet(world,id,iso);setLifeRules(next);setLifeNow(Date.now());if(iso===null){setFileFocus(id);setSelected(id)}return next};
  const revealFile=id=>{if(catalogRef.current.find(file=>file.id===id)?.archived){openLibrary(id,'archived');return}setFileFocus(id);setSelected(id);setOpen(state.groups.find(g=>g.members.includes(id))?.id||null);setTimeSpace(false);closeLibrary();const point=positions.get(id);if(point)setPan({x:-point.x*zoom,y:-point.y*zoom});const url=new URL(window.location.href);url.searchParams.set('file',id);url.searchParams.delete('view');window.history.replaceState(null,'',url);setNotice('File shown in tree · drag it onto another tile to connect')};
  const click=o=>{if(Date.now()<suppress.current)return;setSelected(o.id);if(o.archive){openLibrary(null,'archived',replay?viewAt:null);return}if(o.members){setOpen(v=>v===o.id?null:o.id);setNotice(open===o.id?'Node collapsed':'Drag another tile here to add it')}else if(o.id==='proj'){setOpen(null);if(world==='esafe-demo')openLibrary()}else if(o.fileUrl||o.local)openLibrary(o.id)};
  const startPinch=()=>{const [a,c]=[...touches.current.values()];if(!a||!c)return;const r=root.current.getBoundingClientRect(),mid={x:(a.x+c.x)/2-r.left,y:(a.y+c.y)/2-r.top};const previous=gesture.current?.before;if(previous){current.current=previous;setState(previous)}gesture.current={mode:'pinch',distance:Math.max(1,Math.hypot(a.x-c.x,a.y-c.y)),zoom,world:{x:(mid.x-size.w/2-pan.x)/zoom,y:(mid.y-size.h/2-pan.y)/zoom}};setDrag(null);setHover(null)};
  const down=e=>{
    if(e.target.closest('[data-control]')||e.button>0||e.target.closest('[data-node-id="nexus-archive"]'))return;
    if(e.pointerType==='touch')touches.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(touches.current.size>1){startPinch();try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}return}
    const id=e.target.closest('[data-node-id]')?.dataset.nodeId;
    if(id==='nexus-archive')return;
    const face=id?e.target.closest('[data-node-id]')?.querySelector('[data-tile-face]')?.getBoundingClientRect():null;
    gesture.current={offset:face?{x:e.clientX-face.left-face.width/2,y:e.clientY-face.top-face.height/2}:{x:0,y:0},mode:id&&id!=='proj'&&!replay?'node':'pan',id,pointer:e.pointerId,x:e.clientX,y:e.clientY,point:positions.get(id),zoom,pan,before:current.current,moved:false,target:null};
  };
  const targetAt=(e,id,offset)=>{
    // Hit-test the visible icon, not its transparent translated wrapper or label.
    let best=null,distance=Infinity;
    root.current.querySelectorAll('[data-node-id]').forEach(el=>{const target=el.dataset.nodeId;if(target===id||target==='proj'||target==='nexus-archive'||getComputedStyle(el).display==='none')return;
      if(state.groups.find(g=>g.id===target)?.members.includes(id))return;
      const tile=el.querySelector('[data-tile-face]'),r=tile?.getBoundingClientRect();if(!r)return;
      const dx=e.clientX-offset.x-(r.left+r.width/2),dy=e.clientY-offset.y-(r.top+r.height/2);
      if(Math.abs(dx)<=Math.max(28,r.width/2)&&Math.abs(dy)<=Math.max(28,r.height/2)&&dx*dx+dy*dy<distance){best=target;distance=dx*dx+dy*dy}});return best;
  };
  const moveNow=e=>{
    const g=gesture.current;if(!g)return;
    if(e.pointerType==='touch'&&touches.current.has(e.pointerId))touches.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(g.mode==='pinch'){const [a,c]=[...touches.current.values()];if(!a||!c)return;const r=root.current.getBoundingClientRect(),z=_w(g.zoom*Math.hypot(a.x-c.x,a.y-c.y)/g.distance);setZoom(z);setPan({x:(a.x+c.x)/2-r.left-size.w/2-g.world.x*z,y:(a.y+c.y)/2-r.top-size.h/2-g.world.y*z});return}
    if(g.pointer!==e.pointerId)return;
    const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(!g.moved&&Math.hypot(dx,dy)<(e.pointerType==='touch'?10:5))return;
    g.moved=true;try{root.current.setPointerCapture(e.pointerId)}catch{}
    if(g.mode==='pan'){setPan({x:g.pan.x+dx,y:g.pan.y+dy});return}
    setDrag(g.id);g.target=targetAt(e,g.id,g.offset);setHover(g.target);
    const next={...g.before,pinned:{...g.before.pinned,[g.id]:{x:g.point.x+dx/g.zoom,y:g.point.y+dy/g.zoom}}};current.current=next;setState(next);
  };
  const move=e=>{if(!gesture.current)return;e.preventDefault();pending.current={pointerId:e.pointerId,pointerType:e.pointerType,clientX:e.clientX,clientY:e.clientY};if(frame.current===null)frame.current=requestAnimationFrame(()=>{frame.current=null;const next=pending.current;pending.current=null;if(next)moveNow(next)})};
  const finish=(e,cancel=false)=>{
    if(frame.current!==null){cancelAnimationFrame(frame.current);frame.current=null}pending.current=null;
    const g=gesture.current;if(!g)return;
    if(g.mode!=='pinch'&&g.pointer!==e.pointerId)return;
    if(!cancel)moveNow(e);
    touches.current.delete(e.pointerId);
    if(g.mode==='pinch'){if(touches.current.size===0)gesture.current=null;suppress.current=Date.now()+350;return}
    if(g.moved){suppress.current=Date.now()+350;if(g.mode==='node'){
      if(cancel){current.current=g.before;setState(g.before);setNotice('Move cancelled')}
      else if(g.target){const point=positions.get(g.target)||g.point;const stable={...g.before,pinned:{...g.before.pinned,...Object.fromEntries(positions)}};const next=nxGroupDrop(stable,g.id,g.target,'nx-group-'+crypto.randomUUID(),point,ids);
        if(next!==g.before&&persist(next,g.before,'Node created · tap it to open')){setOpen(null);setSelected(next.groups[next.groups.length-1].id)}else{current.current=g.before;setState(g.before)}}
      else {const member=g.before.groups.some(group=>group.members.includes(g.id));let next=member?nxDetachMember(g.before,g.id,current.current.pinned[g.id],Object.fromEntries(positions),ids):current.current;if(byId.get(g.id)?.type==='document'){const pins={...next.pinned};delete pins[g.id];next={...next,pinned:pins}}if(persist(next,g.before,member?'Tile moved out of node':byId.get(g.id)?.type==='document'?'File kept in chronological order':'Position saved on this device')){if(open&&!next.groups.some(group=>group.id===open))setOpen(null)}else{current.current=g.before;setState(g.before)}}
    }}
    gesture.current=null;setDrag(null);setHover(null);try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}
  };
  const ungroup=()=>{if(replay||!opened)return;const points=Object.fromEntries(opened.members.map(id=>[id,positions.get(id)]));if(persist(nxUngroup(state,opened.id,points,ids),state,'Node separated · tiles remain in project'))setOpen(null)};
  const reset=()=>{if(replay)return;if(persist(nxCleanWorkspace(null,ids),state,'Demo reset · each tile connected only to project')){setOpen(null);setSelected('proj');setPan({x:0,y:0})}};
  if(mode==='workflow')return s.jsxs('div',{className:'relative h-[100dvh] overflow-hidden',children:[s.jsx('button',{'data-control':true,className:'nx-back-map',onClick:()=>setMode('map'),children:'Back to map'}),s.jsx(CU,{})]});
  return s.jsxs('div',{ref:root,'data-zoom':zoom.toFixed(3),'data-group-dragging':drag||undefined,'data-replay':replay?'true':undefined,'data-graph-gesture':gesture.current?.moved?'true':undefined,style:{'--nx-zoom':zoom},onDragStart:e=>e.preventDefault(),className:'dark relative h-[100dvh] w-full touch-none overflow-hidden bg-background text-foreground select-none',onPointerDownCapture:down,onPointerMoveCapture:move,onPointerUpCapture:e=>finish(e),onPointerCancelCapture:e=>finish(e,true),onWheel:e=>{e.preventDefault();if(!gesture.current)setZoom(z=>_w(z*(e.deltaY>0?.92:1.08)))},children:[
    timeSpace&&world==='esafe-demo'&&s.jsx(NexusTimeSpace,{files:catalog,onClose:closeTimeSpace,onReveal:revealFile,onOpenFiles:()=>openLibrary(),onAddFiles:addFiles,initialFile:fileFocus,world}),
    library&&world==='esafe-demo'&&s.jsx(NexusProjectFiles,{files:libraryAt!==null?catalog.filter(available):catalog,initialFile:libraryFile,onClose:closeLibrary,onReveal:revealFile,onAddFiles:libraryAt===null?addFiles:undefined,onRemoveFile:libraryAt===null?removeFile:undefined,onRestoreFile:libraryAt===null?restoreFile:undefined,initialStatus:libraryScope,asOf:libraryAt,onSetDeactivation:libraryAt===null?setDeactivation:undefined},(libraryFile||'all')+'|'+libraryScope),
    s.jsxs('div',{'data-control':true,className:'nx-project-access',children:[s.jsx('button',{'aria-label':'Switch project',onClick:()=>document.getElementById('nexusTopProject')?.click(),children:world==='esafe-demo'?'e-SAFE Catania ▾':'Riverside ▾'}),world==='esafe-demo'&&s.jsx('button',{'data-catania-file-count':catalog.length,onClick:()=>openLibrary(),children:catalog.length+' project files'}),world==='esafe-demo'&&s.jsx('button',{onClick:openTimeSpace,children:'TimeSpace'})]}),
    s.jsxs('div',{'data-control':true,className:'nx-map-toolbar',children:[s.jsx('button',{onClick:fit,children:'Fit map'}),s.jsx('button',{onClick:()=>setZoom(z=>_w(z*1.15)),children:'+'}),s.jsx('button',{onClick:()=>setZoom(z=>_w(z/1.15)),children:'−'}),s.jsx('button',{onClick:reset,disabled:replay,children:'Reset demo'}),s.jsx('button',{onClick:()=>setMode('workflow'),children:'Workflow'}),s.jsx('span',{children:objects.length+' objects · '+edges.length+' links'})]}),
    s.jsxs('div',{'data-control':true,className:'nx-group-guide',children:[s.jsx('span',{role:'status','aria-live':'polite',children:fileError|| (historyUnknown?'Connection history is unknown before this snapshot · source chronology only':replay?'TimeSpace replay · choose LIVE to edit connections':hover?'Release to create a shared node':notice)}),s.jsx('button',{onClick:fit,'aria-label':'Fit map',children:'⊡'}),s.jsx('button',{onClick:reset,disabled:replay,'aria-label':'Reset demo',title:'Reset demo (undoable)',children:'↺'}),undo&&s.jsx('button',{disabled:replay,onClick:()=>{if(persist(undo,null,'Last change undone')){setUndo(null);setOpen(null)}},children:'Undo'}),opened&&s.jsx('button',{disabled:replay,onClick:ungroup,children:'Ungroup'})]}),
    s.jsxs('div',{className:'nx-graph-world absolute left-0 top-0 h-0 w-0 origin-top-left','data-graph-camera':true,style:{transform:`translate(${size.w/2+pan.x}px,${size.h/2+pan.y}px) scale(${zoom})`,transition:gesture.current?'none':'transform 650ms cubic-bezier(.22,.72,.2,1)'},children:[
      s.jsx('svg',{className:'pointer-events-none absolute left-0 top-0 overflow-visible',children:edges.map(edge=>{const a=positions.get(edge.source),c=positions.get(edge.target);return a&&c?s.jsx('line',{'data-connection-id':edge.source+'|'+edge.target,'data-timespace-active':replay&&(edge.source===selected||edge.target===selected)?'true':undefined,x1:a.x,y1:a.y,x2:c.x,y2:c.y,stroke:'currentColor',className:'text-primary'+(replay&&(edge.source===selected||edge.target===selected)?' nx-timespace-active-edge':''),strokeWidth:edge.source==='proj'?1:2,opacity:edge.source==='proj'?.22:.65},edge.source+'|'+edge.target):null})}),
      typeof NexusGraphMotion==='function'&&s.jsx(NexusGraphMotion,{positions,visibleNodes:visible,edges,byId,replayKey:viewAt,activeId:selected,dragging:!!drag}),
      ...visible.map(o=>{const point=positions.get(o.id)||{x:0,y:0},target=hover===o.id,active=selected===o.id,theme=gc[o.type]||gc.task;return s.jsx('div',{'data-node':true,'data-node-id':o.id,'data-archive-tile':o.archive?'true':undefined,'data-timespace-active':replay&&connectedActive.has(o.id)?'true':undefined,'data-group-members':o.members?.join(','),'data-timespace-match':timeFilter?.active?String(o.type!=='document'&&!o.members||timeFilter.fileIds.includes(o.id)||o.members?.some(id=>timeFilter.fileIds.includes(id))):undefined,'data-drop-target':target?'true':undefined,className:'absolute left-0 top-0 nx-map-node',style:{transform:`translate(${point.x}px,${point.y}px)`,zIndex:drag===o.id?40:target?30:20},children:s.jsxs('button',{type:'button',onClick:()=>click(o),'aria-label':o.archive?'Archive, '+o.count+' files':o.members?o.label+', '+o.members.length+' items. '+(open===o.id?'Collapse':'Expand'):o.type+': '+o.label,'aria-expanded':o.members?open===o.id:undefined,className:'group flex w-[138px] -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center gap-2 rounded-2xl outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-primary',children:[
        s.jsxs('span',{'data-tile-face':true,className:`nx-tile-face relative flex items-center justify-center rounded-2xl border-2 bg-card ${theme.centerBorder} ${o.members?'nx-group-face':''} ${active?'nx-tile-selected':''}`,children:[o.members?s.jsx('span',{className:'nx-group-mosaic',children:o.members.slice(0,4).map(id=>{const member=byId.get(id);return s.jsx('span',{className:(gc[member?.type]||gc.task).chip,children:s.jsx(member?.Icon||Dt,{className:'h-5 w-5'})},id)})}):s.jsx('span',{className:`flex h-10 w-10 items-center justify-center rounded-xl ${theme.chip}`,children:s.jsx(o.Icon,{className:'h-5 w-5'})}),(o.members||o.archive)&&s.jsx('span',{className:'nx-group-count',children:o.archive?o.count:o.members.length})]}),
        s.jsx('span',{className:'line-clamp-2 max-w-[138px] text-center text-[11px] font-semibold leading-tight',children:o.label}),s.jsx('span',{className:'rounded-full border border-border bg-background/80 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[.12em] text-muted-foreground',children:o.archive?'ARCHIVE · '+o.count:o.members?'NODE · '+(open===o.id?'CLOSE':'OPEN'):o.type})]})},o.id)})]})]});
}
