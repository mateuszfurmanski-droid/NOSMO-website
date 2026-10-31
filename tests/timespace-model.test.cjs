const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const sourceRoot='apps/nexus-graph-preview/relationship-tree/src/';
const ctx={window:{},URL};
vm.createContext(ctx);
// Retain raw publication precision even when running before the data.js update.
vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/data.js','utf8')+'\nwindow.rawDates=Object.fromEntries(_e.map(row=>[row[0],row[1]]));',ctx);
vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/files.js','utf8'),ctx);
vm.runInContext(fs.readFileSync(sourceRoot+'project-files.js','utf8'),ctx);
vm.runInContext(fs.readFileSync(sourceRoot+'timespace-model.js','utf8'),ctx);
const files=Array.from(ctx.nxEsafeCatalog(ctx.window.ESAFE_RECORDS),file=>{
 const dateRaw=ctx.window.rawDates[file.recordId];return {...file,dateRaw,datePrecision:dateRaw.length===4?'year':dateRaw.length===7?'month':'day'};
});
const plain=value=>JSON.parse(JSON.stringify(value));

test('existing source calendar keeps all 106 files and counts records independently',()=>{
 const stats=plain(ctx.nxTimeSpaceYearStats(files));
 assert.deepEqual(stats,[{year:'2021',files:18,records:18},{year:'2022',files:33,records:22},{year:'2023',files:11,records:11},{year:'2024',files:17,records:17},{year:'2025',files:9,records:9},{year:'2026',files:18,records:18}]);
 assert.equal(stats.reduce((n,year)=>n+year.files,0),106);assert.equal(stats.reduce((n,year)=>n+year.records,0),95);
 assert.deepEqual(plain(ctx.nxTimeSpaceYearStats([])),[]);
});

test('partial publication dates retain their real precision and never display normalized days as source facts',()=>{
 const yearOnly=files.find(file=>file.recordId==='10843361'),monthOnly=files.find(file=>file.recordId==='10908487');
 assert.equal(yearOnly.date,'2023-01-01');assert.equal(ctx.nxTimeSpaceDateLabel(yearOnly),'2023 (year only)');
 assert.equal(monthOnly.date,'2023-10-01');assert.equal(ctx.nxTimeSpaceDateLabel(monthOnly),'2023-10 (month only)');
 assert.equal(ctx.nxTimeSpaceDateLabel(files.find(file=>file.recordId==='6260847')),'2022-02-24');
 assert.equal(ctx.nxTimeSpaceDateLabel({date:'2023-01-01',datePrecision:'year'}),'2023 (year only)');
 assert.equal(ctx.nxTimeSpaceDateLabel({date:'2023-10-01',datePrecision:'month'}),'2023-10 (month only)');
 assert.equal(ctx.nxTimeSpaceDateLabel({dateRaw:'2023'}),'2023 (year only)');
 assert.equal(ctx.nxTimeSpaceDateLabel({dateRaw:'2023-10'}),'2023-10 (month only)');
 assert.equal(ctx.nxTimeSpaceDateLabel({}),'Date not available');
});

test('only four documented real-pilot sources receive building scope; no source receives an automatic floor',()=>{
 const counts={};for(const file of files){const location=ctx.nxTimeSpaceLocation(file,{});counts[location]=(counts[location]||0)+1}
 assert.deepEqual(counts,{unassigned:102,building:4});
 const building=files.filter(file=>ctx.nxTimeSpaceLocation(file,{})==='building').map(file=>file.recordId).sort();
 assert.deepEqual(building,['19126519','19126674','6260847','6497142'].sort());
 for(const file of files.filter(file=>/virtual/i.test(file.name)||/virtual/i.test(file.title)))assert.equal(ctx.nxTimeSpaceLocation(file,{}),'unassigned');
 assert.equal(ctx.nxTimeSpaceLocation(files.find(file=>file.recordId==='19114712'),{}),'unassigned');
 const real=files.find(file=>file.recordId==='6260847');assert.equal(ctx.nxTimeSpaceLocation(real,{[real.id]:'unassigned'}),'unassigned');assert.equal(ctx.nxTimeSpaceLocation(real,{[real.id]:'level-2'}),'level-2');
 const inherited=Object.create({[real.id]:'level-4'});assert.equal(ctx.nxTimeSpaceLocation(real,inherited),'building');
 const other=files.find(file=>!building.includes(file.recordId));assert.equal(ctx.nxTimeSpaceLocation(other,{[other.id]:'level-0'}),'level-0');
 assert.equal(ctx.nxTimeSpaceLocation(other,{[other.id]:'roof'}),'unassigned');
});

test('normalization keeps only valid view filters and explicit known-file locations without mutating input',()=>{
 const real=files.find(file=>file.recordId==='6260847'),other=files.find(file=>file.recordId==='19114712');
 const raw={version:987,year:'2022',topic:'Survey',location:'level-1',bindings:{[real.id]:'unassigned',[other.id]:'level-1',missing:'building',invalid:'roof'}};
 const before=JSON.stringify(raw),state=ctx.nxTimeSpaceNormalize(raw,files);
 assert.deepEqual(plain(state),{version:1,year:'2022',location:'level-1',topic:'Survey',bindings:{[real.id]:'unassigned',[other.id]:'level-1'}});assert.equal(JSON.stringify(raw),before);
 assert.deepEqual(plain(ctx.nxTimeSpaceNormalize({year:'1999',topic:'Made up',location:'level-9',bindings:{[real.id]:'roof'}},files)),{version:1,year:'all',location:'all',topic:'all',bindings:{}});
 assert.equal(ctx.nxTimeSpaceNormalize({year:2022},files).year,'all');assert.equal(ctx.nxTimeSpaceNormalize(null,files).year,'all');assert.deepEqual(plain(ctx.nxTimeSpaceNormalize({bindings:['level-0']},files).bindings),{});
 assert.equal(Object.hasOwn(state,'groups'),false);
});

test('year, location and topic cross-filter deterministically, with explicit assignments overriding source defaults',()=>{
 const base=ctx.nxTimeSpaceNormalize(null,files);assert.equal(ctx.nxTimeSpaceMatch(files,base).length,106);
 assert.equal(ctx.nxTimeSpaceMatch(files,{...base,year:'2022'}).length,33);
 assert.equal(ctx.nxTimeSpaceMatch(files,{...base,location:'building'}).length,4);
 assert.equal(ctx.nxTimeSpaceMatch(files,{...base,location:'unassigned'}).length,102);
 assert.equal(ctx.nxTimeSpaceMatch(files,{...base,year:'2022',location:'building',topic:'Survey'})[0].recordId,'6260847');
 assert.equal(ctx.nxTimeSpaceMatch(files,{...base,year:'2021',location:'building'}).length,0);
 const file=files.find(f=>f.recordId==='6260847'),bindings={[file.id]:'level-0'};
 assert.equal(ctx.nxTimeSpaceMatch(files,{...base,year:'2022',location:'level-0',topic:'Survey',bindings}).length,1);
 assert.equal(ctx.nxTimeSpaceMatch(files,{...base,year:'2022',location:'building',topic:'Survey',bindings}).length,0);
 assert.equal(ctx.nxTimeSpaceMatch(files,{...base,location:'level-4'}).length,0);
});

test('chronological source groups contain all files once and retain multi-file record boundaries and precise labels',()=>{
 const before=JSON.stringify(files),groups=ctx.nxTimeSpaceGroups(files);
 assert.equal(groups.length,95);assert.equal(new Set(groups.map(group=>group.recordId)).size,95);assert.equal(groups.reduce((n,group)=>n+group.files.length,0),106);
 assert.equal(groups[0].recordId,'5607218');assert.equal(groups[0].dateLabel,'2021-06-28');assert.equal(groups[groups.length-1].dateLabel,'2026-03-21');
 assert.equal(groups.find(group=>group.recordId==='6598271').files.length,6);assert.equal(groups.find(group=>group.recordId==='6505195').files.length,7);
 assert.equal(groups.find(group=>group.recordId==='10843361').dateLabel,'2023 (year only)');assert.equal(groups.find(group=>group.recordId==='10908487').dateLabel,'2023-10 (month only)');
 assert.ok(groups.every(group=>group.title&&group.sourceUrl.startsWith('https://zenodo.org/records/')));assert.equal(JSON.stringify(files),before);
 const first=files[0],duplicated=ctx.nxTimeSpaceGroups([first,first]);assert.equal(duplicated.length,1);assert.equal(duplicated[0].files.length,1);
 const filtered=ctx.nxTimeSpaceGroups(ctx.nxTimeSpaceMatch(files,{year:'2022'}));assert.equal(filtered.length,22);assert.equal(filtered.reduce((n,group)=>n+group.files.length,0),33);
});


test('combined Design + BIM is a valid union filter and composes with source year and place',()=>{
 const expected=files.filter(file=>file.category==='Design'||file.category==='BIM');
 assert.ok(expected.some(file=>file.category==='Design'));assert.ok(expected.some(file=>file.category==='BIM'));
 assert.equal(ctx.nxTimeSpaceNormalize({topic:'design-bim'},files).topic,'design-bim');
 assert.deepEqual(Array.from(ctx.nxTimeSpaceMatch(files,{topic:'design-bim'}),file=>file.id),expected.map(file=>file.id));
 assert.deepEqual(Array.from(ctx.nxTimeSpaceMatch(files,{topic:'design-bim',year:'2022',location:'building'}),file=>file.id),expected.filter(file=>file.dateRaw.startsWith('2022')&&ctx.nxTimeSpaceLocation(file,{})==='building').map(file=>file.id));
});
