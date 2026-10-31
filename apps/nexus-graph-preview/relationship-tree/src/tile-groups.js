// Pure, flat group model. Existing legacy edges remain untouched in their old key.
function nxCleanWorkspace(raw, ids) {
  const valid = new Set(ids), used = new Set(), groupIds = new Set();
  const groups = [];
  for (const g of Array.isArray(raw?.groups) ? raw.groups : []) {
    if (!g || typeof g.id !== 'string' || !g.id.startsWith('nx-group-') || groupIds.has(g.id)) continue;
    const members = [...new Set(Array.isArray(g.members) ? g.members : [])].filter(id => valid.has(id) && id !== 'proj' && !used.has(id));
    if (members.length < 2) continue;
    groups.push({id:g.id,members}); groupIds.add(g.id); members.forEach(id=>used.add(id));
  }
  const pinned = {};
  for (const [id,p] of Object.entries(raw?.pinned || {})) {
    if ((valid.has(id) || groupIds.has(id)) && id !== 'proj' && Number.isFinite(p?.x) && Number.isFinite(p?.y)) pinned[id]={x:p.x,y:p.y};
  }
  return {version:2, groups, pinned};
}
function nxGroupDrop(workspace, source, target, groupId, point, ids) {
  if (source === target || source === 'proj' || target === 'proj') return workspace;
  const valid=new Set(ids), groups=workspace.groups;
  const sourceGroup=groups.find(g=>g.id===source), targetGroup=groups.find(g=>g.id===target);
  if ((!sourceGroup&&!valid.has(source))||(!targetGroup&&!valid.has(target))) return workspace;
  if (targetGroup?.members.includes(source)) return workspace;
  const members=[...new Set([...(targetGroup?.members||[target]),...(sourceGroup?.members||[source])])];
  const moved=new Set(members);
  const remaining=groups.filter(g=>g!==sourceGroup&&g!==targetGroup).map(g=>({...g,members:g.members.filter(id=>!moved.has(id))})).filter(g=>g.members.length>1);
  const id=targetGroup?.id||groupId;
  return nxCleanWorkspace({groups:[...remaining,{id,members}],pinned:{...workspace.pinned,[id]:point}},ids);
}
function nxUngroup(workspace, id, positions, ids) {
  return nxCleanWorkspace({groups:workspace.groups.filter(g=>g.id!==id),pinned:{...workspace.pinned,...positions}},ids);
}
// Dragging a member into empty space returns it to the project at the release point.
function nxDetachMember(workspace, id, point, positions, ids) {
  if (id === 'proj' || !ids.includes(id) || !Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return workspace;
  const owner=workspace.groups.find(group=>group.members.includes(id));
  if (!owner) return workspace;
  const groups=workspace.groups.map(group=>group===owner?{...group,members:group.members.filter(member=>member!==id)}:group).filter(group=>group.members.length>=2);
  return nxCleanWorkspace({groups,pinned:{...workspace.pinned,...positions,[id]:point}},ids);
}
function nxGroupEdges(objects, groups, open) {
  const membership=new Set(groups.flatMap(g=>g.members));
  return [...objects.filter(o=>o.id!=='proj'&&!membership.has(o.id)).map(o=>({source:'proj',target:o.id})),
    ...groups.map(g=>({source:'proj',target:g.id})),
    ...groups.filter(g=>g.id===open).flatMap(g=>g.members.map(id=>({source:g.id,target:id})))];
}

// Find free slots outside a group, keeping all existing tiles stationary.
function nxPlaceMembers(center, members, occupied) {
  const placed=new Map(), points=[...occupied.values()];
  const outward=Math.atan2(center.y,center.x);
  for(const id of members){
    let point;
    search: for(let ring=0;ring<20;ring++)for(let step=0;step<24;step++){
      const angle=outward+(step%2?1:-1)*Math.ceil(step/2)*Math.PI/12;
      const radius=210+ring*100;
      const candidate={x:center.x+Math.cos(angle)*radius,y:center.y+Math.sin(angle)*radius};
      if(points.every(p=>Math.abs(p.x-candidate.x)>155||Math.abs(p.y-candidate.y)>185)){point=candidate;break search}
    }
    point=point||{x:center.x-2300,y:center.y+placed.size*200};placed.set(id,point);points.push(point);
  }
  return placed;
}
// Keep the project circle intact and fold chronological files into the free
// cells around it. The screen aspect ratio chooses rows/columns, not a fixed
// single-column document strip. Coordinates remain in graph world space.
function nxViewportGraphLayout(base,files,visibleIds,{width=800,height=600}={}){
  const cellW=170,cellH=174,halfW=76,halfH=82;
  const fileIds=new Set(files.map(file=>file.id)),ids=new Set(visibleIds),core=[...base].filter(([id,point])=>id!=='nexus-archive'&&!fileIds.has(id)&&ids.has(id)&&Number.isFinite(point?.x)&&Number.isFinite(point?.y));
  const result=new Map(base),occupied=[];
  // Preserve the circle where possible; displaced/imported groups cannot leave
  // overlapping tiles behind after a gesture or a group expansion.
  for(const [id,point] of core){let placed={...point};if(occupied.some(p=>Math.abs(p.x-placed.x)<160&&Math.abs(p.y-placed.y)<170)){
    search:for(let ring=1;ring<=core.length+1;ring++)for(let step=0;step<ring*8;step++){const angle=step/(ring*8)*Math.PI*2,candidate={x:point.x+Math.cos(angle)*ring*cellW,y:point.y+Math.sin(angle)*ring*cellH};if(occupied.every(p=>Math.abs(p.x-candidate.x)>=160||Math.abs(p.y-candidate.y)>=170)){placed=candidate;break search}}
  }result.set(id,placed);occupied.push(placed)}
  if(!files.length)return result;
  core.forEach(entry=>{entry[1]=result.get(entry[0])});
  const xs=core.map(([,p])=>p.x),ys=core.map(([,p])=>p.y);
  const left=xs.length?Math.min(...xs)-halfW:-halfW,right=xs.length?Math.max(...xs)+halfW:halfW,top=ys.length?Math.min(...ys)-halfH:-halfH,bottom=ys.length?Math.max(...ys)+halfH:halfH;
  const coreCols=Math.max(1,Math.ceil((right-left)/cellW)),coreRows=Math.max(1,Math.ceil((bottom-top)/cellH)),total=files.length+coreCols*coreRows;
  let best=null;
  for(let rows=coreRows;rows<=coreRows+files.length;rows++){
    const cols=Math.max(coreCols,Math.ceil(total/rows));if(rows*cols-coreRows*coreCols<files.length)continue;
    const scale=Math.min(Math.max(1,width)/(cols*cellW),Math.max(1,height)/(rows*cellH));
    if(!best||scale>best.scale)best={rows,cols,scale};
  }
  const {rows,cols}=best,startCol=Math.floor((cols-coreCols)/2),startRow=Math.floor((rows-coreRows)/2);
  const targetX=(startCol+(coreCols-1)/2-(cols-1)/2)*cellW,targetY=(startRow+(coreRows-1)/2-(rows-1)/2)*cellH,dx=targetX-(left+right)/2,dy=targetY-(top+bottom)/2;
  core.forEach(([id,p])=>result.set(id,{x:p.x+dx,y:p.y+dy}));
  let index=0;
  for(let row=0;row<rows&&index<files.length;row++)for(let col=0;col<cols&&index<files.length;col++){
    if(row>=startRow&&row<startRow+coreRows&&col>=startCol&&col<startCol+coreCols)continue;
    result.set(files[index++].id,{x:(col-(cols-1)/2)*cellW,y:(row-(rows-1)/2)*cellH});
  }
  return result;
}
// Derived folders never rewrite manual drag groups or observed connection history.
function nxAutomaticFileFolders(files,manualGroups=[]){
  const manual=new Set(manualGroups.flatMap(group=>group.members)),folders=new Map();
  for(const file of files){if(manual.has(file.id))continue;const batch=file.folderMode==='batch'&&file.importBatchId,topic=String(file.category||'Unclassified');
    const id=batch?'nx-auto-import-'+encodeURIComponent(file.importBatchId):'nx-auto-topic-'+encodeURIComponent(topic);
    if(!folders.has(id))folders.set(id,{id,label:batch?(file.importLabel||'Imported files'):topic,automatic:true,folderMode:batch?'batch':'topics',members:[]});folders.get(id).members.push(file.id);
  }
  return [...folders.values()];
}
function nxFitViewportGraph(positions,visibleIds,area,canvas,maxScale=.95){
  const points=visibleIds.map(id=>positions.get(id)).filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y));
  if(!points.length||!(area.width>0&&area.height>0&&canvas.w>0&&canvas.h>0))return null;
  const left=Math.min(...points.map(p=>p.x))-76,right=Math.max(...points.map(p=>p.x))+76,top=Math.min(...points.map(p=>p.y))-82,bottom=Math.max(...points.map(p=>p.y))+82;
  // No minimum zoom: a lower bound would clip large sets on narrow/short screens.
  const zoom=Math.min(maxScale,area.width/(right-left),area.height/(bottom-top));
  return {zoom,pan:{x:area.left+area.width/2-canvas.w/2-(left+right)/2*zoom,y:area.top+area.height/2-canvas.h/2-(top+bottom)/2*zoom}};
}
// Panning/zooming may use spare space but cannot hide a tile beyond the screen.
function nxConstrainViewportCamera(positions,visibleIds,area,canvas,candidate){
  const fit=nxFitViewportGraph(positions,visibleIds,area,canvas);if(!fit)return candidate;
  const zoom=Math.max(.00001,Math.min(fit.zoom,candidate.zoom)),points=visibleIds.map(id=>positions.get(id)).filter(Boolean);
  const left=Math.min(...points.map(p=>p.x))-76,right=Math.max(...points.map(p=>p.x))+76,top=Math.min(...points.map(p=>p.y))-82,bottom=Math.max(...points.map(p=>p.y))+82;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  return{zoom,pan:{x:clamp(candidate.pan.x,area.left-canvas.w/2-left*zoom,area.left+area.width-canvas.w/2-right*zoom),y:clamp(candidate.pan.y,area.top-canvas.h/2-top*zoom,area.top+area.height-canvas.h/2-bottom*zoom)}};
}
