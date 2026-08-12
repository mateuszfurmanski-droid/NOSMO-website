// NEXUS_PERSON_CARD_BRIDGE_V1_STABLE
(()=>{
  if(window.__NEXUS_PERSON_CARD_BRIDGE__)return;
  window.__NEXUS_PERSON_CARD_BRIDGE__=true;

  const CARD_URL='/person-card-kamil.html?v=v47top1';
  const REGISTRY_URL='/apps/nexus/person-cards/?v=v47top1';
  const TREE_URL='/apps/nexus-graph-preview/relationship-tree/?focus=p-kamil&person=kamil-karaszewski&v=v47top1';
  const DATA_URL='/apps/nexus-file-loader/?projectKey=NEXUS_DEMO_PROJECT_001_eSAFE_CATANIA&person=kamil-karaszewski&card=/person-card-kamil.html?v=v47top1';

  const css=`
    .nexus-person-bridge{position:fixed;z-index:2147483000;right:12px;bottom:calc(18px + env(safe-area-inset-bottom));width:min(344px,calc(100vw - 24px));border:1px solid rgba(58,139,255,.34);border-radius:20px;background:linear-gradient(180deg,rgba(2,9,18,.96),rgba(0,0,0,.96));box-shadow:0 22px 70px rgba(0,0,0,.72),0 0 0 1px rgba(255,255,255,.035) inset;color:#f5f8ff;font-family:Inter,Arial,sans-serif;overflow:hidden;transform:translateY(calc(100% - 58px));transition:transform .22s ease}.nexus-person-bridge.open{transform:translateY(0)}
    .nexus-person-bridge-head{height:58px;display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;border-bottom:1px solid rgba(58,139,255,.18)}
    .nexus-person-bridge-avatar{width:38px;height:38px;border-radius:50%;background:#06172a url('/assets/KamilKaraszewski.jpeg') center 18%/cover no-repeat;border:1px solid rgba(58,139,255,.72);box-shadow:0 0 14px rgba(58,139,255,.28)}
    .nexus-person-bridge-title{min-width:0;flex:1}.nexus-person-bridge-title strong{display:block;font-size:12px;letter-spacing:.12em;color:#3a8bff;text-transform:uppercase}.nexus-person-bridge-title span{display:block;font-size:13px;color:#eef5ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nexus-person-bridge-chevron{font-size:20px;color:#86bdff}
    .nexus-person-bridge-body{padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.nexus-person-bridge a{min-height:42px;border:1px solid rgba(58,139,255,.28);border-radius:13px;background:linear-gradient(180deg,rgba(9,26,45,.88),rgba(3,12,24,.98));color:#f7faff;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:7px;font-size:11px;font-weight:850;letter-spacing:.04em;text-transform:uppercase}.nexus-person-bridge a.primary{background:linear-gradient(180deg,rgba(32,117,255,.28),rgba(5,22,48,.98));border-color:rgba(78,148,255,.55)}
    @media(max-width:520px){.nexus-person-bridge{left:12px;right:12px;width:auto}.nexus-person-bridge-body{grid-template-columns:1fr 1fr}}
  `;

  function mount(){
    if(document.getElementById('nexusPersonCardBridge'))return;
    const style=document.createElement('style');
    style.id='nexusPersonCardBridgeStyle';
    style.textContent=css;
    document.head.appendChild(style);

    const bridge=document.createElement('aside');
    bridge.id='nexusPersonCardBridge';
    bridge.className='nexus-person-bridge';
    bridge.setAttribute('aria-label','Nexus Person Card bridge');
    bridge.innerHTML=`
      <div class="nexus-person-bridge-head" role="button" tabindex="0" aria-label="Open Person Card bridge">
        <div class="nexus-person-bridge-avatar" aria-hidden="true"></div>
        <div class="nexus-person-bridge-title"><strong>Person Card</strong><span>Kamil Karaszewski · Technical Advisor</span></div>
        <div class="nexus-person-bridge-chevron">⌃</div>
      </div>
      <div class="nexus-person-bridge-body">
        <a class="primary" href="${CARD_URL}">Open Card</a>
        <a href="${REGISTRY_URL}">Registry</a>
        <a href="${TREE_URL}">Tree Node</a>
        <a href="${DATA_URL}">Data/File</a>
      </div>`;
    document.body.appendChild(bridge);

    const head=bridge.querySelector('.nexus-person-bridge-head');
    const toggle=()=>bridge.classList.toggle('open');
    head.addEventListener('click',toggle);
    head.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}});
    window.__NEXUS_PERSON_CARD_LINKS__={card:CARD_URL,registry:REGISTRY_URL,tree:TREE_URL,data:DATA_URL};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
