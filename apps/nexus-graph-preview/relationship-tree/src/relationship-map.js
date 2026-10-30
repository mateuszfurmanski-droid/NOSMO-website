// Maintained source for the existing AU graph component in the deployed legacy bundle.
// Rebuild with scripts/build-tile-groups.py; uses the bundle's React and icon imports.
function AU(){
  const world=window.__NEXUS_PROJECT_WORLD__||'dev';
  const key='nosmo-tile-groups:v2:'+world;
  const esafe={proj:['e-SAFE Catania Real Pilot','project'],'p-mateusz':['Structural / Seismic','task'],'p-sitemgr':['MEP / Energy','task'],'p-architect':['Electrical / Controls','task'],'p-client':['BIM / Digital','task'],'p-team':['Fabrication / Installation','task'],'d-groundfloor':['Survey / QA','task'],'d-doorschedule':['Project / General','task'],'d-snaglist':['D5.1 Detailed survey','document'],'d-firecerts':['D2.2 3D models','document'],'t-install':['D5.5 Monitoring','document'],'t-snag':['D5.4 Production delivery','document'],'t-fire':['D5.3 Detailed design','document'],'t-walkthrough':['Pilot Actions','task']};
  const objects=b.useMemo(()=>world==='esafe-demo'?ns.filter(o=>esafe[o.id]).map(o=>({...o,label:esafe[o.id][0],type:esafe[o.id][1]})):ns,[world]);
  const ids=b.useMemo(()=>objects.map(o=>o.id),[objects]);
  const [state,setState]=b.useState(()=>{try{return nxCleanWorkspace(JSON.parse(localStorage.getItem(key)),ids)}catch{return nxCleanWorkspace(null,ids)}});
  const [open,setOpen]=b.useState(null),[selected,setSelected]=b.useState('proj');
  const [zoom,setZoom]=b.useState(window.innerWidth<720?.52:.72),[pan,setPan]=b.useState({x:0,y:0});
  const [size,setSize]=b.useState({w:0,h:0}),[drag,setDrag]=b.useState(null),[hover,setHover]=b.useState(null);
  const [notice,setNotice]=b.useState('Drag one tile onto another to create a node'),[undo,setUndo]=b.useState(null),[mode,setMode]=b.useState('map');
  const root=b.useRef(null),current=b.useRef(state),gesture=b.useRef(null),touches=b.useRef(new Map()),frame=b.useRef(null),pending=b.useRef(null),suppress=b.useRef(0);
  current.current=state;
  const groupNodes=state.groups.map((g,index)=>({id:g.id,type:'task',label:'Node '+(index+1),Icon:Dt,members:g.members}));
  const all=[...objects,...groupNodes],byId=new Map(all.map(o=>[o.id,o]));
  const members=new Set(state.groups.flatMap(g=>g.members));
  const opened=state.groups.find(g=>g.id===open);
  const visible=all.filter(o=>!members.has(o.id)||opened?.members.includes(o.id));
  const edges=nxGroupEdges(objects,state.groups,open);
  const positions=EU(all.filter(o=>!members.has(o.id)),'proj',edges,state.pinned,false,drag);
  if(opened){const center=positions.get(opened.id)||{x:0,y:0};opened.members.forEach((id,index)=>{const angle=-Math.PI/2+index*2*Math.PI/opened.members.length;positions.set(id,{x:center.x+Math.cos(angle)*205,y:center.y+Math.sin(angle)*205})})}
  if(drag&&state.pinned[drag])positions.set(drag,state.pinned[drag]);
  b.useLayoutEffect(()=>{const el=root.current;if(!el)return;const resize=()=>setSize({w:el.clientWidth,h:el.clientHeight});resize();const obs=new ResizeObserver(resize);obs.observe(el);return()=>obs.disconnect()},[mode]);
  b.useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current)},[]);
  b.useEffect(()=>{window.dispatchEvent(new CustomEvent('nexus:groups-change'))},[state.groups,open]);
  const persist=(next,previous=null,message='Saved on this device')=>{
    try{localStorage.setItem(key,JSON.stringify(next))}catch{setNotice('Could not save. Change cancelled — device storage unavailable.');return false}
    if(previous)setUndo(previous);current.current=next;setState(next);setNotice(message);return true;
  };
  const fit=()=>{const pts=[...positions.values()];if(!pts.length)return;const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);const left=Math.min(...xs)-100,right=Math.max(...xs)+100,top=Math.min(...ys)-130,bottom=Math.max(...ys)+130;const z=Math.min(.95,Math.max(.3,Math.min(size.w/(right-left),(size.h-100)/(bottom-top))));setZoom(z);setPan({x:-(left+right)/2*z,y:-(top+bottom)/2*z})};
  const click=o=>{if(Date.now()<suppress.current)return;setSelected(o.id);if(o.members){setOpen(v=>v===o.id?null:o.id);setNotice(open===o.id?'Node collapsed':'Drag another tile here to add it')}else if(o.id==='proj')setOpen(null)};
  const startPinch=()=>{const [a,c]=[...touches.current.values()];if(!a||!c)return;const r=root.current.getBoundingClientRect(),mid={x:(a.x+c.x)/2-r.left,y:(a.y+c.y)/2-r.top};const previous=gesture.current?.before;if(previous){current.current=previous;setState(previous)}gesture.current={mode:'pinch',distance:Math.max(1,Math.hypot(a.x-c.x,a.y-c.y)),zoom,world:{x:(mid.x-size.w/2-pan.x)/zoom,y:(mid.y-size.h/2-pan.y)/zoom}};setDrag(null);setHover(null)};
  const down=e=>{
    if(e.target.closest('[data-control]')||e.button>0)return;
    if(e.pointerType==='touch')touches.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(touches.current.size>1){startPinch();try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}return}
    const id=e.target.closest('[data-node-id]')?.dataset.nodeId;
    gesture.current={mode:id&&id!=='proj'?'node':'pan',id,pointer:e.pointerId,x:e.clientX,y:e.clientY,point:positions.get(id),zoom,pan,before:current.current,moved:false,target:null};
  };
  const targetAt=(e,id)=>{
    // Hit-test the visible icon, not its transparent translated wrapper or label.
    let best=null,distance=Infinity;
    root.current.querySelectorAll('[data-node-id]').forEach(el=>{const target=el.dataset.nodeId;if(target===id||target==='proj'||getComputedStyle(el).display==='none')return;
      if(state.groups.find(g=>g.id===target)?.members.includes(id))return;
      const tile=el.querySelector('[data-tile-face]'),r=tile?.getBoundingClientRect();if(!r)return;
      const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
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
    setDrag(g.id);g.target=targetAt(e,g.id);setHover(g.target);
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
      else if(!persist(current.current,g.before,'Position saved on this device')){current.current=g.before;setState(g.before)}
    }}
    gesture.current=null;setDrag(null);setHover(null);try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}
  };
  const ungroup=()=>{if(!opened)return;const points=Object.fromEntries(opened.members.map(id=>[id,positions.get(id)]));if(persist(nxUngroup(state,opened.id,points,ids),state,'Node separated · tiles remain in project'))setOpen(null)};
  const reset=()=>{if(persist(nxCleanWorkspace(null,ids),state,'Demo reset · each tile connected only to project')){setOpen(null);setSelected('proj');setPan({x:0,y:0})}};
  if(mode==='workflow')return s.jsxs('div',{className:'relative h-[100dvh] overflow-hidden',children:[s.jsx('button',{'data-control':true,className:'nx-back-map',onClick:()=>setMode('map'),children:'Back to map'}),s.jsx(CU,{})]});
  return s.jsxs('div',{ref:root,'data-zoom':zoom.toFixed(3),'data-group-dragging':drag||undefined,style:{'--nx-zoom':zoom},onDragStart:e=>e.preventDefault(),className:'dark relative h-[100dvh] w-full touch-none overflow-hidden bg-background text-foreground select-none',onPointerDownCapture:down,onPointerMoveCapture:move,onPointerUpCapture:e=>finish(e),onPointerCancelCapture:e=>finish(e,true),onWheel:e=>{e.preventDefault();if(!gesture.current)setZoom(z=>_w(z*(e.deltaY>0?.92:1.08)))},children:[
    s.jsxs('div',{'data-control':true,className:'nx-map-toolbar',children:[s.jsx('button',{onClick:fit,children:'Fit map'}),s.jsx('button',{onClick:()=>setZoom(z=>_w(z*1.15)),children:'+'}),s.jsx('button',{onClick:()=>setZoom(z=>_w(z/1.15)),children:'−'}),s.jsx('button',{onClick:reset,children:'Reset demo'}),s.jsx('button',{onClick:()=>setMode('workflow'),children:'Workflow'}),s.jsx('span',{children:objects.length+' objects · '+edges.length+' links'})]}),
    s.jsxs('div',{'data-control':true,className:'nx-group-guide',children:[s.jsx('span',{role:'status','aria-live':'polite',children:hover?'Release to create a shared node':notice}),s.jsx('button',{onClick:fit,'aria-label':'Fit map',children:'⊡'}),undo&&s.jsx('button',{onClick:()=>{if(persist(undo,null,'Last change undone')){setUndo(null);setOpen(null)}},children:'Undo'}),opened&&s.jsx('button',{onClick:ungroup,children:'Ungroup'})]}),
    s.jsxs('div',{className:'absolute left-0 top-0 h-0 w-0 origin-top-left',style:{transform:`translate(${size.w/2+pan.x}px,${size.h/2+pan.y}px) scale(${zoom})`},children:[
      s.jsx('svg',{className:'pointer-events-none absolute left-0 top-0 overflow-visible',children:edges.map(edge=>{const a=positions.get(edge.source),c=positions.get(edge.target);return a&&c?s.jsx('line',{'data-connection-id':edge.source+'|'+edge.target,x1:a.x,y1:a.y,x2:c.x,y2:c.y,stroke:'currentColor',className:'text-primary',strokeWidth:edge.source==='proj'?1:2,opacity:edge.source==='proj'?.22:.65},edge.source+'|'+edge.target):null})}),
      ...visible.map(o=>{const point=positions.get(o.id)||{x:0,y:0},target=hover===o.id,active=selected===o.id,theme=gc[o.type]||gc.task;return s.jsx('div',{'data-node':true,'data-node-id':o.id,'data-group-members':o.members?.join(','),'data-drop-target':target?'true':undefined,className:'absolute left-0 top-0 nx-map-node',style:{transform:`translate(${point.x}px,${point.y}px)`,zIndex:drag===o.id?40:target?30:20},children:s.jsxs('button',{type:'button',onClick:()=>click(o),'aria-label':o.members?o.label+', '+o.members.length+' items. '+(open===o.id?'Collapse':'Expand'):o.type+': '+o.label,'aria-expanded':o.members?open===o.id:undefined,className:'group flex w-[138px] -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center gap-2 rounded-2xl outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-primary',children:[
        s.jsxs('span',{'data-tile-face':true,className:`nx-tile-face relative flex items-center justify-center rounded-2xl border-2 bg-card ${theme.centerBorder} ${o.members?'nx-group-face':''} ${active?'nx-tile-selected':''}`,children:[o.members?s.jsx('span',{className:'nx-group-mosaic',children:o.members.slice(0,4).map(id=>{const member=byId.get(id);return s.jsx('span',{className:(gc[member?.type]||gc.task).chip,children:s.jsx(member?.Icon||Dt,{className:'h-5 w-5'})},id)})}):s.jsx('span',{className:`flex h-10 w-10 items-center justify-center rounded-xl ${theme.chip}`,children:s.jsx(o.Icon,{className:'h-5 w-5'})}),o.members&&s.jsx('span',{className:'nx-group-count',children:o.members.length})]}),
        s.jsx('span',{className:'line-clamp-2 max-w-[138px] text-center text-[11px] font-semibold leading-tight',children:o.label}),s.jsx('span',{className:'rounded-full border border-border bg-background/80 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[.12em] text-muted-foreground',children:o.members?'NODE · '+(open===o.id?'CLOSE':'OPEN'):o.type})]})},o.id)})]})]});
}
