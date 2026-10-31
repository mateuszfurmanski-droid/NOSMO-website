// TimeSpace is a read-only view of source chronology plus explicit file locations.
// It never creates or rewrites the user's drag-created tile groups.
const nxTimeSpaceLocations = [
  {id:'unassigned',label:'Location unassigned'},
  {id:'building',label:'Catania pilot building'},
  ...Array.from({length:5},(_,level)=>({id:'level-'+level,label:'Level '+level}))
];
const nxTimeSpaceLocationIds = new Set(nxTimeSpaceLocations.map(location=>location.id));
// Building scope only, never a floor: existing real-pilot survey/model/works documents.
// https://zenodo.org/records/6260847 — D5.1 detailed survey of the real pilot.
// https://zenodo.org/records/6497142 — D2.2 models of the real pilot.
// https://zenodo.org/records/19126519 — D5.4 production of e-SAFE components.
// https://zenodo.org/records/19126674 — D5.3 renovation works of the real pilot.
// All other sources, including virtual-pilot records, require an explicit assignment.
const nxTimeSpaceBuildingRecords = new Set(['6260847','6497142','19126519','19126674']);
function nxTimeSpaceLocation(file,bindings) {
  const id=file?.id;
  if(bindings&&Object.prototype.hasOwnProperty.call(bindings,id)&&nxTimeSpaceLocationIds.has(bindings[id]))return bindings[id];
  return nxTimeSpaceBuildingRecords.has(String(file?.recordId))?'building':'unassigned';
}
function nxTimeSpaceDateLabel(file) {
  const raw=String(file?.dateRaw||file?.date||'');
  const precision=file?.datePrecision||(raw.length===4?'year':raw.length===7?'month':'day');
  if(precision==='year'&&/^\d{4}/.test(raw))return raw.slice(0,4)+' (year only)';
  if(precision==='month'&&/^\d{4}-\d{2}/.test(raw))return raw.slice(0,7)+' (month only)';
  return /^\d{4}-\d{2}-\d{2}$/.test(raw)?raw:'Date not available';
}
function nxTimeSpaceYear(file) {
  const raw=String(file?.dateRaw||file?.date||'');
  return /^\d{4}(?:$|-\d{2}(?:$|-\d{2}$))/.test(raw)?raw.slice(0,4):null;
}
function nxTimeSpaceYearStats(files) {
  const years=new Map();
  for(const file of Array.isArray(files)?files:[]) {
    const year=nxTimeSpaceYear(file);if(!year)continue;
    if(!years.has(year))years.set(year,{files:0,records:new Set()});
    const stats=years.get(year);stats.files++;if(file?.recordId!=null)stats.records.add(String(file.recordId));
  }
  return [...years].sort(([a],[b])=>a.localeCompare(b)).map(([year,stats])=>({year,files:stats.files,records:stats.records.size}));
}
function nxTimeSpaceNormalize(raw,files) {
  const all=Array.isArray(files)?files:[];
  const knownFiles=new Set(all.map(file=>file.id));
  const years=new Set(nxTimeSpaceYearStats(all).map(stats=>stats.year));
  const topics=new Set(all.map(file=>file.category).filter(category=>typeof category==='string'&&category));
  const bindings={};
  const entries=raw?.bindings&&typeof raw.bindings==='object'&&!Array.isArray(raw.bindings)?Object.entries(raw.bindings):[];
  for(const [id,location] of entries)if(knownFiles.has(id)&&nxTimeSpaceLocationIds.has(location)) {
    Object.defineProperty(bindings,id,{value:location,enumerable:true,writable:true,configurable:true});
  }
  return {version:1,year:typeof raw?.year==='string'&&years.has(raw.year)?raw.year:'all',location:nxTimeSpaceLocationIds.has(raw?.location)?raw.location:'all',topic:topics.has(raw?.topic)?raw.topic:'all',bindings};
}
function nxTimeSpaceMatch(files,state) {
  const all=Array.isArray(files)?files:[],safe=nxTimeSpaceNormalize(state,all);
  return all.filter(file=>(safe.year==='all'||nxTimeSpaceYear(file)===safe.year)&&(safe.location==='all'||nxTimeSpaceLocation(file,safe.bindings)===safe.location)&&(safe.topic==='all'||file.category===safe.topic));
}
function nxTimeSpaceGroups(files) {
  const records=new Map();
  for(const file of Array.isArray(files)?files:[]) {
    const recordId=String(file?.recordId??file?.id??'');if(!recordId)continue;
    if(!records.has(recordId))records.set(recordId,{recordId,title:file.title||file.name||recordId,sourceUrl:file.sourceUrl||'',dateLabel:nxTimeSpaceDateLabel(file),files:[],sortDate:String(file.dateRaw||file.date||'9999'),seen:new Set()});
    const record=records.get(recordId);
    if(file.id!=null&&record.seen.has(file.id))continue;
    if(file.id!=null)record.seen.add(file.id);
    record.files.push(file);
  }
  return [...records.values()].sort((a,b)=>a.sortDate.localeCompare(b.sortDate)||a.recordId.localeCompare(b.recordId)).map(({sortDate,seen,...record})=>record);
}
