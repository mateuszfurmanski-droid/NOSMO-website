// Observed Nexus connections only. Before the first real snapshot, history is unknown.
function nxGraphHistoryKey(world) {
  if(typeof world!=='string'||!world||world.length>200)throw new TypeError('A project world is required');
  return 'nosmo.graph-history:v1:'+world;
}
function nxGraphHistoryStamp(value) {
  if(typeof value!=='string')return null;
  const match=value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/i);
  if(!match||Number(match[2])>23||Number(match[3])>59||Number(match[4]||0)>59)return null;
  const day=Date.parse(match[1]+'T00:00:00Z'),time=Date.parse(value);
  if(!Number.isFinite(day)||new Date(day).toISOString().slice(0,10)!==match[1]||!Number.isFinite(time))return null;
  return new Date(time).toISOString();
}
function nxGraphHistoryGroups(groups) {
  const result=[],used=new Set(),ids=new Set();
  for(const group of Array.isArray(groups)?groups:[]) {
    if(!group||typeof group.id!=='string'||!/^nx-group-[A-Za-z0-9_-]{1,180}$/.test(group.id)||ids.has(group.id))continue;
    const members=[...new Set(Array.isArray(group.members)?group.members:[])].filter(id=>typeof id==='string'&&id.length>0&&id.length<=250&&id!=='proj'&&!id.startsWith('nx-group-')&&!used.has(id));
    if(members.length<2)continue;
    result.push({id:group.id,members});ids.add(group.id);members.forEach(id=>used.add(id));
  }
  return result;
}
function nxGraphHistorySignature(groups) {
  return JSON.stringify(nxGraphHistoryGroups(groups).map(group=>({id:group.id,members:[...group.members].sort()})).sort((a,b)=>a.id.localeCompare(b.id)));
}
function nxGraphHistoryClean(raw) {
  if(raw?.version!==1||!raw.baseline||!Array.isArray(raw.baseline.groups))return null;
  const at=nxGraphHistoryStamp(raw.baseline.at);if(!at)return null;
  const baseline={at,groups:nxGraphHistoryGroups(raw.baseline.groups)},events=[];
  const sorted=(Array.isArray(raw.events)?raw.events:[]).map((event,index)=>({event,index,at:nxGraphHistoryStamp(event?.at)})).filter(entry=>entry.at&&entry.at>=at&&Array.isArray(entry.event?.groups)).sort((a,b)=>a.at.localeCompare(b.at)||a.index-b.index);
  let signature=nxGraphHistorySignature(baseline.groups);
  for(const entry of sorted) {
    const groups=nxGraphHistoryGroups(entry.event.groups),next=nxGraphHistorySignature(groups);
    if(next!==signature){events.push({at:entry.at,groups});signature=next}
  }
  return {version:1,baseline,events};
}
function nxGraphHistoryRead(world) {
  const key=nxGraphHistoryKey(world);
  try{return nxGraphHistoryClean(JSON.parse(localStorage.getItem(key)))}catch{return null}
}
function nxGraphHistoryWrite(world,history) {
  // Commit first. Failed storage must never announce a successful recording.
  localStorage.setItem(nxGraphHistoryKey(world),JSON.stringify(history));
  if(typeof window!=='undefined'&&typeof window.dispatchEvent==='function') {
    try{window.dispatchEvent(new CustomEvent('nexus:graph-history-updated',{detail:{world}}))}catch{}
  }
  return history;
}
function nxGraphHistoryEnsure(world,groups,nowISO=new Date().toISOString()) {
  const existing=nxGraphHistoryRead(world);if(existing)return existing;
  const at=nxGraphHistoryStamp(nowISO);if(!at)throw new TypeError('A real ISO connection timestamp is required');
  return nxGraphHistoryWrite(world,{version:1,baseline:{at,groups:nxGraphHistoryGroups(groups)},events:[]});
}
function nxGraphHistoryRecord(world,groups,nowISO=new Date().toISOString()) {
  const history=nxGraphHistoryRead(world);if(!history)return nxGraphHistoryEnsure(world,groups,nowISO);
  const last=history.events[history.events.length-1]||history.baseline;
  const clean=nxGraphHistoryGroups(groups);
  if(nxGraphHistorySignature(clean)===nxGraphHistorySignature(last.groups))return history;
  const at=nxGraphHistoryStamp(nowISO);if(!at)throw new TypeError('A real ISO connection timestamp is required');
  if(at<last.at)throw new RangeError('Cannot record a connection change before the last observed state');
  return nxGraphHistoryWrite(world,{version:1,baseline:history.baseline,events:[...history.events,{at,groups:clean}]});
}
function nxGraphHistoryAt(history,atMillis) {
  const clean=nxGraphHistoryClean(history);
  if(!clean||!Number.isFinite(atMillis)||atMillis<Date.parse(clean.baseline.at))return null;
  let snapshot=clean.baseline;
  for(const event of clean.events){if(Date.parse(event.at)>atMillis)break;snapshot=event}
  return nxGraphHistoryGroups(snapshot.groups);
}
function nxGraphHistoryTimes(history) {
  const clean=nxGraphHistoryClean(history);if(!clean)return [];
  return [...new Set([clean.baseline.at,...clean.events.map(event=>event.at)])];
}
