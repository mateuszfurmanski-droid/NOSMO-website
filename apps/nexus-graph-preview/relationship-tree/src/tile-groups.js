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
