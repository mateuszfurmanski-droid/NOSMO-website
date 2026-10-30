"""Targeted repair of the shipped graph component. Unrelated bundle code is retained.
The archived upstream build has no TSX source here. Each anchor must match once.
"""
from pathlib import Path
p=Path('apps/nexus-graph-preview/assets/index-CWI-Glgh.js')
s=p.read_text()
if 'function NexusLinkEditor' in s:
    raise SystemExit('Repair already applied')
def replace(old,new):
    global s
    assert s.count(old)==1,(old[:80],s.count(old))
    s=s.replace(old,new)
component=r'''
function NexusLinkEditor({source,objects,edges,onSave,onClose}){
 const presentation=window.__NEXUS_GRAPH_LABELS__;if(presentation&&window.__NEXUS_PROJECT_WORLD__==='esafe-demo')objects=objects.filter(o=>presentation[o.id]).map(o=>({...o,...presentation[o.id]}));
 const [query,setQuery]=b.useState(''),[target,setTarget]=b.useState(''),[message,setMessage]=b.useState('');
 const sourceNode=objects.find(o=>o.id===source);
 const linked=edges.filter(e=>e.source===source||e.target===source);
 const existing=edges.find(e=>e.id===Nk(source,target));
 b.useEffect(()=>{const before=document.activeElement;return()=>before?.focus?.()},[]);
 const update=(next,text)=>{if(onSave(next))setMessage(text);else setMessage('Could not save. Browser storage is unavailable; connection unchanged.');};
 return ko.createPortal(s.jsxs('div',{id:'nexusLinkEditor',role:'dialog','aria-modal':true,'aria-labelledby':'nx-link-title','data-control':true,onKeyDown:e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const els=[...e.currentTarget.querySelectorAll('button,input,select')].filter(x=>!x.disabled);const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}},children:[
 s.jsxs('header',{children:[s.jsx('h2',{id:'nx-link-title',children:'Connect objects'}),s.jsx('button',{type:'button',onClick:onClose,'aria-label':'Close connections',children:'×'})]}),
 s.jsx('p',{children:'From: '+sourceNode?.label}),s.jsx('small',{children:'Connections are saved in this browser for this project world.'}),
 s.jsx('label',{htmlFor:'nx-link-search',children:'Find an object'}),s.jsx('input',{id:'nx-link-search',autoFocus:true,value:query,onChange:e=>setQuery(e.target.value),placeholder:'Name or ID'}),
 s.jsx('label',{htmlFor:'nx-link-target',children:'Connect to'}),s.jsxs('select',{id:'nx-link-target',value:target,onChange:e=>setTarget(e.target.value),children:[s.jsx('option',{value:'',children:'Choose an object…'}),objects.filter(o=>o.id!==source&&(o.id===target||(o.label+' '+o.id).toLowerCase().includes(query.toLowerCase()))).map(o=>s.jsx('option',{value:o.id,children:o.label+' · '+o.type},o.id))]}),
 s.jsx('button',{type:'button',className:'nx-link-primary',disabled:!target||!!existing,onClick:()=>update([...edges.filter(e=>e.manual),{id:Nk(source,target),source,target,manual:true}],'Connected: '+sourceNode.label+' ↔ '+objects.find(o=>o.id===target)?.label+'. Saved in this browser.'),children:existing?'Already connected':'Save connection'}),
 s.jsx('p',{role:'status','aria-live':'polite',children:message}),
 s.jsx('h3',{children:'Connections · '+linked.length}),
 s.jsx('ul',{children:linked.map(edge=>{const id=edge.source===source?edge.target:edge.source;return s.jsxs('li',{children:[s.jsx('span',{children:objects.find(o=>o.id===id)?.label||id}),edge.manual?s.jsx('button',{type:'button','aria-label':'Remove connection to '+(objects.find(o=>o.id===id)?.label||id),onClick:()=>update(edges.filter(e=>e.manual&&e.id!==edge.id),'Connection removed. Saved in this browser.'),children:'Remove'}):s.jsx('small',{children:'Demo link'})]},edge.id)})}),
 s.jsx('button',{type:'button',onClick:onClose,children:'Done — return to graph'})]}),document.body);
}
'''
replace('function AU(){',component+'function AU(){')
# Storage is scoped by project; retain the legacy dev copy for recovery.
replace('JSON.parse(localStorage.getItem("nosmo-persistent-workspace")??"null")','JSON.parse(localStorage.getItem("nosmo-persistent-workspace:"+(window.__NEXUS_PROJECT_WORLD__||"dev"))??((window.__NEXUS_PROJECT_WORLD__||"dev")==="dev"?localStorage.getItem("nosmo-persistent-workspace"):null)??"null")')
replace('localStorage.setItem("nosmo-persistent-workspace",JSON.stringify({pinned:B,manualEdges:Q}))}catch{}','localStorage.setItem("nosmo-persistent-workspace:"+(window.__NEXUS_PROJECT_WORLD__||"dev"),JSON.stringify({pinned:B,manualEdges:Q}));return true}catch{return false}')
replace('localStorage.removeItem("nosmo-persistent-workspace")','localStorage.setItem("nosmo-persistent-workspace:"+(window.__NEXUS_PROJECT_WORLD__||"dev"),JSON.stringify({pinned:{},manualEdges:[]}))')
start=s.index('g&&s.jsxs("div",{"data-control":!0,className:"absolute left-1/2 top-16')
end=s.index(',s.jsxs("div",{className:"absolute left-0 top-0 h-0 w-0 origin-top-left"',start)
s=s[:start]+'g&&s.jsx(NexusLinkEditor,{source:g,objects:ns,edges:ce,onClose:()=>y(null),onSave:edges=>{if(!xe(H.current,edges))return false;I.current=edges;f(edges);return true}},g)'+s[end:]
replace('role:"button",tabIndex:0,onClick:vn=>{vn.stopPropagation(),y(B.id)}','role:"button",tabIndex:0,"aria-label":"Connections for "+(window.__NEXUS_GRAPH_LABELS__?.[B.id]?.label||B.label),title:"Connect objects",onKeyDown:vn=>{if(vn.key==="Enter"||vn.key===" "){vn.preventDefault();vn.stopPropagation();y(B.id)}},onClick:vn=>{vn.stopPropagation(),y(B.id)}')
# Fast, frame-coalesced motion. Do not animate each SVG endpoint for a second on every move.
replace('const Pw={type:"tween",duration:1,','const Pw={type:"tween",duration:.18,')
replace('transition:Ze?{duration:0}:Pw','transition:T?{duration:0}:Pw')
replace('transition:Pw,className:B.manual?', 'transition:T?{duration:0}:Pw,className:B.manual?')
replace('const gt=Math.hypot(ve,Te)>4;', 'const gt=Math.hypot(ve,Te)>(B.pointerType==="touch"?12:5);')
replace('gt=Lw(Q.velocityX*.035),Nt=Lw(Q.velocityY*.035)','gt=0,Nt=0')
replace('ne=b.useRef(null),[K,ue]', 'ne=b.useRef(null),nxFrame=b.useRef(null),nxPending=b.useRef(null),[K,ue]')
replace('},V=B=>{if(B.pointerType', '},nxMoveNow=B=>{if(B.pointerType')
replace('},ae=B=>{B.pointerType', '''},V=B=>{if(!D.current)return;B.preventDefault();const E={pointerType:B.pointerType,pointerId:B.pointerId,clientX:B.clientX,clientY:B.clientY,timeStamp:B.timeStamp,currentTarget:B.currentTarget,preventDefault(){},stopPropagation(){}};nxPending.current=()=>nxMoveNow(E);if(nxFrame.current===null)nxFrame.current=requestAnimationFrame(()=>{nxFrame.current=null;const fn=nxPending.current;nxPending.current=null;fn?.()})},ae=B=>{if(nxFrame.current!==null){cancelAnimationFrame(nxFrame.current);nxFrame.current=null;const fn=nxPending.current;nxPending.current=null;fn?.()}B.pointerType''')
# Native controls stay usable even when tile is zoomed out.
replace('className:"absolute -bottom-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full border border-primary/35 bg-background text-primary shadow-lg md:opacity-0 md:group-hover:opacity-100"','className:"nx-connect-handle absolute -bottom-3 -right-3 flex items-center justify-center rounded-full border border-primary/35 bg-background text-primary shadow-lg"')
replace('s.jsx(pt.line,{animate:{x1:Q.x,y1:Q.y,x2:ve.x,y2:ve.y}', 's.jsx(pt.line,{"data-connection-id":B.id,"data-manual":B.manual?"true":void 0,animate:{x1:Q.x,y1:Q.y,x2:ve.x,y2:ve.y}')
replace('ref:ne,"data-zoom":v.toFixed(3),', 'ref:ne,"data-zoom":v.toFixed(3),style:{"--nx-zoom":v},')
p.write_text(s)
