// Deactivation is a reversible visibility rule. It never deletes file metadata or bytes.
function nxFileLifecycleKey(world) {
  if(typeof world!=='string'||!world.trim())throw new Error('Choose a project before changing file availability.');
  return 'nosmo.file-lifecycle:v1:'+world.trim();
}
function nxFileLifecycleTimestamp(value) {
  if(typeof value!=='string')return null;
  const match=value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/i);
  if(!match||Number(match[2])>23||Number(match[3])>59||Number(match[4]||0)>59)return null;
  const day=Date.parse(match[1]+'T00:00:00Z'),timestamp=Date.parse(value);
  return Number.isFinite(day)&&new Date(day).toISOString().slice(0,10)===match[1]&&Number.isFinite(timestamp)?timestamp:null;
}
function nxFileLifecycleRules(raw) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return{};
  const valid={};
  for(const [id,rule] of Object.entries(raw))if(id&&nxFileLifecycleTimestamp(rule?.deactivateAt)!==null)Object.defineProperty(valid,id,{value:{deactivateAt:new Date(nxFileLifecycleTimestamp(rule.deactivateAt)).toISOString()},enumerable:true,writable:true,configurable:true});
  return valid;
}
function nxFileLifecycleEvents(raw) {
  return (Array.isArray(raw)?raw:[]).flatMap((event,index)=>{
    const at=nxFileLifecycleTimestamp(event?.at),deadline=event?.deactivateAt===null?null:nxFileLifecycleTimestamp(event?.deactivateAt);
    if(typeof event?.id!=='string'||!event.id||at===null||event.deactivateAt!==null&&deadline===null)return[];
    return[{id:event.id,at:new Date(at).toISOString(),deactivateAt:deadline===null?null:new Date(deadline).toISOString(),index}];
  }).sort((a,b)=>a.at.localeCompare(b.at)||a.index-b.index).map(({index,...event})=>event);
}
function nxFileLifecycleStored(world) {
  const text=localStorage.getItem(nxFileLifecycleKey(world));let raw;
  try{raw=JSON.parse(text||'{}')}catch{raw={}}
  if(raw?.version===2)return {version:2,rules:nxFileLifecycleRules(raw.rules),events:nxFileLifecycleEvents(raw.events),legacyRules:nxFileLifecycleRules(raw.legacyRules)};
  const rules=nxFileLifecycleRules(raw);
  // Old rules have no observed edit time. Preserve that unknown baseline, never invent one.
  return {version:2,rules,events:[],legacyRules:nxFileLifecycleRules(rules)};
}
function nxFileLifecycleRead(world) {return nxFileLifecycleStored(world).rules}
function nxFileLifecycleHistory(world) {
  const stored=nxFileLifecycleStored(world),events=stored.events;
  // The array remains the documented events API; migration metadata is not a fabricated event.
  Object.defineProperty(events,'legacyRules',{value:stored.legacyRules,enumerable:false});
  return events;
}
function nxFileLifecycleSet(world,id,deactivateAt) {
  const key=nxFileLifecycleKey(world);
  if(typeof id!=='string'||!id||id.length>500)throw new Error('Choose a valid project file.');
  const timestamp=deactivateAt===null?null:nxFileLifecycleTimestamp(deactivateAt);
  if(deactivateAt!==null&&timestamp===null)throw new Error('Choose a valid date and time with a time zone.');
  const stored=nxFileLifecycleStored(world),next=stored.rules,deadline=timestamp===null?null:new Date(timestamp).toISOString();
  const previous=Object.prototype.hasOwnProperty.call(next,id)?next[id].deactivateAt:null;
  if(previous===deadline)return next;
  if(deadline===null)delete next[id];
  else Object.defineProperty(next,id,{value:{deactivateAt:deadline},enumerable:true,writable:true,configurable:true});
  const at=new Date().toISOString(),events=[...stored.events,{id,at,deactivateAt:deadline}];
  localStorage.setItem(key,JSON.stringify({version:2,rules:next,events,...(Object.keys(stored.legacyRules).length?{legacyRules:stored.legacyRules}:{})}));
  try{window.dispatchEvent(new CustomEvent('nexus:file-lifecycle-updated',{detail:{world,id,at,deactivateAt:deadline}}))}catch{}
  return next;
}
function nxFileLifecycleApply(files,rules,now=Date.now(),history) {
  const instant=Number(now),events=nxFileLifecycleEvents(Array.isArray(history)?history:history?.events),legacyRules=nxFileLifecycleRules(history?.legacyRules);
  const byFile=new Map();
  for(const event of events){if(!byFile.has(event.id))byFile.set(event.id,[]);byFile.get(event.id).push(event)}
  return (Array.isArray(files)?files:[]).map(file=>{
    const currentRule=rules&&Object.prototype.hasOwnProperty.call(rules,file.id)?rules[file.id]:null,current=nxFileLifecycleTimestamp(currentRule?.deactivateAt),fileEvents=byFile.get(file.id)||[];
    let timestamp=current;
    if(history!==undefined&&fileEvents.length){
      const previous=fileEvents.filter(event=>nxFileLifecycleTimestamp(event.at)<=instant).at(-1);
      timestamp=previous?nxFileLifecycleTimestamp(previous.deactivateAt):nxFileLifecycleTimestamp(legacyRules[file.id]?.deactivateAt);
    }
    return {...file,deactivateAt:timestamp===null?null:new Date(timestamp).toISOString(),currentDeactivateAt:current===null?null:new Date(current).toISOString(),archived:timestamp!==null&&Number.isFinite(instant)&&timestamp<=instant,lifecycleEvents:fileEvents.map(event=>({...event}))};
  });
}
// Epoch milliseconds of the next future deadline, or null when there is none.
function nxFileLifecycleNext(files,now=Date.now()) {
  const instant=Number(now);let next=null;
  for(const file of Array.isArray(files)?files:[]){const at=nxFileLifecycleTimestamp(file.deactivateAt);if(at!==null&&at>instant&&(next===null||at<next))next=at}
  return next;
}
