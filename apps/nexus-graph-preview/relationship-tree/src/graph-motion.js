// Visual transitions only. The projection/history layer owns file and group state.
function nxGraphMotionSnapshot(positions,visibleNodes,edges,byId) {
  const point=value=>value&&Number.isFinite(value.x)&&Number.isFinite(value.y)?{x:value.x,y:value.y}:null;
  const points=new Map(),nodes=new Map(),known=new Map(),links=new Map();
  positions?.forEach?.((value,id)=>{const p=point(value);if(p)points.set(id,p)});
  byId?.forEach?.((value,id)=>known.set(id,{...value,members:value.members?[...value.members]:undefined}));
  for(const node of visibleNodes||[]){const p=points.get(node.id);if(p)nodes.set(node.id,{...node,...p,members:node.members?[...node.members]:undefined})}
  for(const edge of edges||[]){const from=points.get(edge.source),to=points.get(edge.target);if(from&&to)links.set(edge.source+'|'+edge.target,{source:edge.source,target:edge.target,from,to})}
  return {points,nodes,known,links};
}
function nxGraphMotionPlan(previous,next) {
  if(!previous)return {moves:[],links:[]};
  const moves=[],links=[];
  const owner=(snapshot,id)=>[...snapshot.nodes.values()].find(node=>node.members?.includes(id));
  const anchor=(snapshot,id,fallback)=>snapshot.points.get(id)||fallback||{x:0,y:0};
  for(const [id,node] of previous.nodes){
    if(id==='proj'||id==='nexus-archive')continue;
    const current=next.nodes.get(id),from={x:node.x,y:node.y};
    if(current){
      const to={x:current.x,y:current.y};
      if(Math.hypot(to.x-from.x,to.y-from.y)>.5)moves.push({id,node:current,from,to,kind:'move'});
    }else{
      const group=owner(next,id),archived=next.known.get(id)?.archived===true||!!node.members?.length&&node.members.every(member=>next.known.get(member)?.archived===true);
      const target=archived?'nexus-archive':group?.id||'proj';
      moves.push({id,node,from,to:anchor(next,target,anchor(previous,target)),toId:target,kind:'depart',reason:archived?'archive':group?'group':'time'});
    }
  }
  for(const [id,node] of next.nodes){
    if(previous.nodes.has(id)||id==='proj'||id==='nexus-archive')continue;
    const group=owner(previous,id),archived=previous.known.get(id)?.archived===true;
    const origin=archived?'nexus-archive':group?.id||'proj';
    moves.push({id,node,from:anchor(previous,origin,anchor(next,origin)),fromId:origin,to:{x:node.x,y:node.y},kind:'arrive',reason:archived?'archive':group?'group':'time'});
  }
  // A closed group still visibly releases/reclaims the individual archived file.
  for(const [id,node] of next.known){
    const old=previous.known.get(id);if(!old||old.archived===node.archived)continue;
    if(node.archived===true&&!previous.nodes.has(id)){
      const group=owner(previous,id);if(group)moves.push({id,node,from:anchor(previous,group.id),to:anchor(next,'nexus-archive'),toId:'nexus-archive',kind:'depart',reason:'archive'});
    }else if(old.archived===true&&!next.nodes.has(id)){
      const group=owner(next,id);if(group)moves.push({id,node,from:anchor(previous,'nexus-archive'),fromId:'nexus-archive',to:anchor(next,group.id),kind:'arrive',reason:'archive'});
    }
  }
  for(const [id,edge] of previous.links)if(!next.links.has(id))links.push({...edge,id,kind:'disconnect'});
  for(const [id,edge] of next.links)if(!previous.links.has(id))links.push({...edge,id,kind:'connect'});
  return {moves,links};
}
function nxGraphMotionSignature(snapshot) {
  // Archive compensates for camera movement; it is an anchor, not a migration.
  return [...snapshot.nodes.values()].map(n=>n.id+(n.id==='nexus-archive'?':anchor':':'+n.x+','+n.y)+':'+(n.members||[]).join(',')).join(';')+'|'+[...snapshot.links.keys()].join(';');
}
function nxGraphMotionResolve(batch,snapshot) {
  const archive=snapshot.points.get('nexus-archive');if(!archive)return batch;
  const link=edge=>({...edge,from:edge.source==='nexus-archive'?archive:edge.from,to:edge.target==='nexus-archive'?archive:edge.to});
  return {...batch,moves:batch.moves.map(move=>({...move,from:move.fromId==='nexus-archive'?archive:move.from,to:move.toId==='nexus-archive'?archive:move.to})),links:batch.links.map(link),focus:batch.focus.map(link)};
}
function NexusGraphMotion({positions,visibleNodes,edges,byId,replayKey,dragging=false,activeId=null}) {
  const snapshot=nxGraphMotionSnapshot(positions,visibleNodes,edges,byId);
  const signature=nxGraphMotionSignature(snapshot);
  const previous=b.useRef(null),serial=b.useRef(0),currentBatch=b.useRef(null),timer=b.useRef(null),[storedBatch,setBatch]=b.useState(null);
  const publish=value=>{currentBatch.current=value;setBatch(value)};
  const stop=()=>{if(timer.current!==null)window.clearTimeout(timer.current);timer.current=null;publish(null)};
  const finish=()=>{if(timer.current===null)timer.current=window.setTimeout(()=>{timer.current=null;publish(null)},820)};
  b.useLayoutEffect(()=>{
    const before=previous.current;
    const reduced=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!before)return;
    if(dragging||reduced){stop();return}
    const plan=nxGraphMotionPlan(before,snapshot);
    const focus=[...snapshot.links.values()].filter(edge=>edge.target===activeId||edge.source===activeId).map(edge=>({...edge,id:edge.source+'|'+edge.target,kind:'focus'}));
    if(plan.moves.length||plan.links.length){
      if(timer.current!==null)window.clearTimeout(timer.current);timer.current=null;
      publish({...plan,focus,id:++serial.current});finish();
    }else if(currentBatch.current){
      // Selection cleanup and camera focus must not erase an in-flight migration.
      publish({...currentBatch.current,focus});
    }else if(focus.length){publish({...plan,focus,id:++serial.current});finish()}
  },[signature,replayKey,dragging,activeId]);
  // Refresh anchor positions even when only the camera changed, without a new batch.
  b.useLayoutEffect(()=>{previous.current=snapshot});
  b.useEffect(()=>()=>{if(timer.current!==null)window.clearTimeout(timer.current)},[]);
  const batch=storedBatch?nxGraphMotionResolve(storedBatch,snapshot):null;
  if(!batch)return null;
  const route=(from,to)=>'M '+from.x+' '+from.y+' L '+to.x+' '+to.y;
  const cssId=id=>String(id).replace(/[^a-zA-Z0-9_-]/g,char=>'\\'+char.codePointAt(0).toString(16)+' ');
  const arriving=batch.moves.filter(move=>move.kind==='arrive').map(move=>'#root .nx-map-node[data-node-id="'+cssId(move.id)+'"]');
  const routes=[...batch.moves.filter(move=>move.kind!=='move'||Math.hypot(move.to.x-move.from.x,move.to.y-move.from.y)>220).map(move=>({id:'move:'+move.id,from:move.from,to:move.to,kind:move.reason==='archive'?'archive':'migration'})),...batch.links,...batch.focus];
  return s.jsxs('div',{className:'nx-graph-motion','aria-hidden':true,'data-motion-batch':batch.id,children:[
    arriving.length?s.jsx('style',{children:arriving.join(',')+'{animation:nx-node-arrival 760ms linear both;pointer-events:none!important}'}):null,
    s.jsx('svg',{className:'nx-motion-routes',width:1,height:1,children:routes.map((item,index)=>s.jsx('path',{d:route(item.from,item.to),pathLength:1,className:'nx-motion-route nx-motion-'+item.kind,'data-motion-route':item.id},batch.id+':'+item.id+':'+index))}),
    ...batch.moves.filter(move=>move.kind!=='move').map(move=>s.jsx('div',{className:'nx-motion-ghost nx-motion-'+move.kind,'data-motion-node':move.id,'data-motion-destination':move.reason||'time',style:{'--nx-from-x':move.from.x+'px','--nx-from-y':move.from.y+'px','--nx-to-x':move.to.x+'px','--nx-to-y':move.to.y+'px'},children:s.jsxs('div',{className:'nx-motion-tile',children:[s.jsx('span',{className:'nx-motion-icon',children:move.node.kind==='PDF'||/\.pdf$/i.test(move.node.name||move.node.label||'')?s.jsx('img',{src:'/apps/nexus-graph-preview/assets/file-icons/pdf.webp',alt:''}):move.node.kind==='Spreadsheet'?s.jsx('img',{src:'/apps/nexus-graph-preview/assets/file-icons/xlsx.webp',alt:''}):move.node.Icon?s.jsx(move.node.Icon,{className:'h-8 w-8'}):s.jsx('span',{children:move.node.kind==='Video'?'▶':'▤'})}),s.jsx('strong',{children:move.node.label||move.node.name||'File'})]})},batch.id+':'+move.id))
  ]});
}
