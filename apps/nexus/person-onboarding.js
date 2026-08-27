(function(){
  "use strict";

  const DRAFT_PREFIX="nexus-person-card-draft:";
  const INVITE_PREFIX="nexus-person-card-invite:";
  const params=new URLSearchParams(window.location.search);
  const inviteId=(params.get("inviteId")||params.get("invite")||"invite-"+Date.now().toString(36)).slice(0,80);
  const agency=(params.get("agency")||"NOSMO Work Profile").slice(0,120);
  const suggestedTrade=(params.get("trade")||"").slice(0,120);
  const suggestedLocation=(params.get("location")||"").slice(0,120);
  const inviteToken=(params.get("inviteToken")||"").slice(0,8000);

  function q(sel){return document.querySelector(sel)}
  function qa(sel){return Array.from(document.querySelectorAll(sel))}
  function text(value){return String(value||"").replace(/\s+/g," ").trim()}
  function toast(message){
    const el=q("#onboardToast");if(!el)return;
    el.textContent=message;el.classList.add("show");
    setTimeout(()=>el.classList.remove("show"),2200);
  }
  function randomId(){
    if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
    return "p-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
  }
  function currentDraftId(){
    let id=localStorage.getItem(INVITE_PREFIX+inviteId);
    if(!id){id=randomId();try{localStorage.setItem(INVITE_PREFIX+inviteId,id)}catch(_){}}
    return id;
  }
  const personId=currentDraftId();

  const fields=["firstName","lastName","trade","location","experienceYears","phone","email","radius","availability","availableFrom","cvText","ownTransport","dayShift","nightShift","workAway"];

  function fieldValue(id){
    const el=q("#"+id);
    if(!el)return "";
    if(el.type==="checkbox")return !!el.checked;
    return el.value;
  }

  function collect(){
    return {
      schema:"nexus-person-onboarding-draft/v1",
      personId,
      inviteId,
      agency,
      updatedAt:new Date().toISOString(),
      firstName:text(fieldValue("firstName")).slice(0,80),
      lastName:text(fieldValue("lastName")).slice(0,80),
      trade:text(fieldValue("trade")).slice(0,140),
      location:text(fieldValue("location")).slice(0,140),
      experienceYears:Number(fieldValue("experienceYears")||0)||0,
      phone:text(fieldValue("phone")).slice(0,80),
      email:text(fieldValue("email")).slice(0,160),
      radius:Number(fieldValue("radius")||0)||0,
      availability:String(fieldValue("availability")||"available"),
      availableFrom:String(fieldValue("availableFrom")||""),
      cvText:String(fieldValue("cvText")||"").slice(0,20000),
      ownTransport:!!fieldValue("ownTransport"),
      dayShift:!!fieldValue("dayShift"),
      nightShift:!!fieldValue("nightShift"),
      workAway:!!fieldValue("workAway"),
      photoDataUrl:window.__NEXUS_ONBOARDING_PHOTO||null
    };
  }

  function save(showToast){
    const draft=collect();
    try{localStorage.setItem(DRAFT_PREFIX+personId,JSON.stringify(draft))}catch(_){}
    if(showToast)toast("Draft saved on this device");
    return draft;
  }

  function load(){
    let draft=null;
    try{draft=JSON.parse(localStorage.getItem(DRAFT_PREFIX+personId)||"null")}catch(_){}
    if(!draft){
      draft={trade:suggestedTrade,location:suggestedLocation,radius:40,availability:"available",dayShift:true};
    }
    fields.forEach(id=>{
      const el=q("#"+id);if(!el)return;
      const value=draft[id];
      if(el.type==="checkbox")el.checked=Boolean(value);
      else if(value!==undefined&&value!==null&&value!=="")el.value=String(value);
    });
    if(draft.photoDataUrl){
      window.__NEXUS_ONBOARDING_PHOTO=draft.photoDataUrl;
      setPhotoPreview(draft.photoDataUrl);
    }
    updatePreview();
  }

  function initials(first,last){
    const chars=[text(first)[0],text(last)[0]].filter(Boolean).join("").toUpperCase();
    return chars||"PC";
  }

  function availabilityLabel(value){
    if(value==="not-looking")return "Not Looking";
    if(value==="from-date")return fieldValue("availableFrom")?("From "+fieldValue("availableFrom")):"From Date";
    return "Available";
  }

  function readiness(draft){
    let score=0;
    if(draft.firstName&&draft.lastName)score+=20;
    if(draft.trade)score+=20;
    if(draft.location)score+=15;
    if(draft.experienceYears||draft.cvText)score+=15;
    if(draft.phone||draft.email)score+=10;
    if(draft.radius>=0)score+=5;
    if(draft.availability)score+=5;
    if(draft.cvText.length>80)score+=10;
    return Math.min(100,score);
  }

  function updatePreview(){
    const d=collect();
    q("#previewFirst").textContent=d.firstName||"YOUR";
    q("#previewLast").textContent=d.lastName||"PERSON CARD";
    q("#previewRole").textContent=d.trade?"WORK PROFILE":"WORK PROFILE";
    q("#previewTrade").textContent=d.trade||"ADD YOUR TRADE";
    q("#previewLocation").textContent=d.location||"Add location";
    q("#previewExperience").textContent=d.experienceYears?d.experienceYears+" yrs experience":(d.cvText?"Work history added":"Add experience");
    q("#previewAvailability").textContent=availabilityLabel(d.availability);
    q("#previewPhoto").textContent=initials(d.firstName,d.lastName);

    const score=readiness(d);
    q("#readinessPercent").textContent=score+"%";
    q("#previewReadiness").textContent=score>=70?"Ready":"Draft";
    q("#barIdentity").style.width=((d.firstName&&d.lastName?100:d.firstName||d.lastName?55:15))+"%";
    q("#barWork").style.width=((d.trade&&d.location?100:d.trade||d.location?55:10))+"%";
    q("#barCv").style.width=(d.cvText.length>80?100:d.experienceYears?55:5)+"%";
  }

  function setPhotoPreview(dataUrl){
    const photo=q("#previewPhoto");if(!photo)return;
    if(dataUrl){
      photo.classList.add("hasPreview");
      photo.style.backgroundImage='url("'+dataUrl.replace(/"/g,"")+'")';
    }else{
      photo.classList.remove("hasPreview");
      photo.style.backgroundImage="";
    }
  }

  function openEditor(section){
    q("#onboardOverlay")?.classList.add("open");
    q("#onboardOverlay")?.setAttribute("aria-hidden","false");
    const targets={profile:"#firstName",work:"#trade",availability:"#availability",cv:"#cvText"};
    const label={profile:"Profile",work:"Work Preferences",availability:"Availability",cv:"CV / Smart Prefill"}[section]||"Build your Work Profile";
    q("#onboardTitle").textContent=label;
    setTimeout(()=>q(targets[section]||"#firstName")?.focus(),120);
  }

  function closeEditor(){
    q("#onboardOverlay")?.classList.remove("open");
    q("#onboardOverlay")?.setAttribute("aria-hidden","true");
  }

  function smartPrefill(){
    const cv=text(fieldValue("cvText"));
    if(!cv){toast("Paste CV or work history first");return}
    const lower=cv.toLowerCase();

    if(!text(fieldValue("trade"))){
      const trades=[
        ["carpenter / joiner",["joiner","carpenter","carpentry","second fix"]],
        ["welder / fabricator",["welder","welding","fabricator","fabrication"]],
        ["electrician",["electrician","electrical","electrical installer"]],
        ["plumber",["plumber","plumbing","pipefitter","pipe fitter"]],
        ["dryliner",["dryliner","dry lining","drylining"]],
        ["site manager",["site manager","construction manager","site supervisor"]]
      ];
      const hit=trades.find(row=>row[1].some(term=>lower.includes(term)));
      if(hit)q("#trade").value=hit[0];
    }

    if(!Number(fieldValue("experienceYears"))){
      const yearMatches=[...cv.matchAll(/(?:19|20)\d{2}/g)].map(m=>Number(m[0])).filter(y=>y>=1980&&y<=new Date().getFullYear());
      if(yearMatches.length){
        const earliest=Math.min(...yearMatches);
        const approx=Math.max(1,Math.min(60,new Date().getFullYear()-earliest));
        q("#experienceYears").value=String(approx);
      }
      const explicit=cv.match(/(\d{1,2})\+?\s*(?:years|yrs)\s+(?:of\s+)?experience/i);
      if(explicit)q("#experienceYears").value=explicit[1];
    }

    if(!text(fieldValue("location"))){
      const locationMatch=cv.match(/(?:based in|location[:\s]+)([A-Z][A-Za-z .'-]{2,40})/);
      if(locationMatch)q("#location").value=text(locationMatch[1]);
    }

    updatePreview();save(false);
    q("#aiStatus").textContent="Smart Prefill used local text rules only. Review every field before Finish.";
    toast("Smart Prefill complete — review the fields");
  }

  async function aiAssist(){
    const status=q("#aiStatus");
    const endpoint=document.querySelector('meta[name="nexus-onboarding-ai-endpoint"]')?.content||"";
    if(!inviteToken){
      status.textContent="AI Assist requires a secure signed Agency Invite. This demo/unsigned invite can still use Smart Prefill.";
      toast("Signed invite required for AI Assist");
      return;
    }
    if(!endpoint){
      status.textContent="Signed invite detected, but no authorised onboarding AI endpoint is configured on this preview. Smart Prefill remains local.";
      toast("AI endpoint not connected yet");
      return;
    }
    const d=collect();
    if(!d.cvText){toast("Paste CV or work history first");return}
    status.textContent="AI Assist is analysing the supplied work history…";
    try{
      const res=await fetch(endpoint,{
        method:"POST",
        headers:{"content-type":"application/json"},
        credentials:"omit",
        body:JSON.stringify({inviteId,inviteToken,personId,cvText:d.cvText,current:{firstName:d.firstName,lastName:d.lastName,trade:d.trade,location:d.location,experienceYears:d.experienceYears}})
      });
      const payload=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(payload.error||("HTTP "+res.status));
      const p=payload.prefill||{};
      ["firstName","lastName","trade","location","experienceYears"].forEach(id=>{
        const el=q("#"+id);if(el&&p[id]!==undefined&&p[id]!==null&&String(p[id]).trim())el.value=String(p[id]);
      });
      updatePreview();save(false);
      status.textContent="AI Assist completed. All extracted fields remain drafts until you review and Finish.";
      toast("AI draft ready — review before Finish");
    }catch(error){
      status.textContent="AI Assist unavailable: "+(error&&error.message?error.message:"request failed")+". No fields were changed.";
      toast("AI Assist unavailable");
    }
  }

  function buildCanonicalDraft(d){
    const displayName=text(d.firstName+" "+d.lastName);
    const person={
      schema:"nexus-person-draft/v1",
      id:d.personId,
      source:"agency-invite",
      inviteId:d.inviteId,
      displayName,
      firstName:d.firstName,
      lastName:d.lastName,
      primaryRole:d.trade,
      location:d.location,
      experienceYears:d.experienceYears,
      contact:{phone:d.phone||null,email:d.email||null},
      photoDataUrl:d.photoDataUrl||null,
      verification:"unverified-draft",
      createdAt:new Date().toISOString()
    };
    const workProfile={
      schema:"nexus-person-work-profile/v1",
      id:"work-profile:"+d.personId,
      personId:d.personId,
      version:"draft-v1",
      demoMode:false,
      source:"agency-invite-draft",
      agency:d.agency,
      updatedAt:new Date().toISOString(),
      availability:{
        status:d.availability,
        label:availabilityLabel(d.availability),
        availableFrom:d.availableFrom||null,
        preferredRadiusKm:d.radius,
        workAway:d.workAway,
        ownTransport:d.ownTransport,
        shifts:[d.dayShift?"day":null,d.nightShift?"night":null].filter(Boolean)
      },
      preferences:{
        primaryTrade:d.trade,
        targetRoles:[d.trade].filter(Boolean),
        locations:[d.location].filter(Boolean),
        employmentTypes:["contract","temporary","permanent"],
        paymentPreferences:[],
        rate:{amount:null,currency:"GBP",unit:"hour",display:"Open to offers"}
      },
      readiness:{
        cv:{state:d.cvText.length>80?"draft":"missing",source:"onboarding"},
        certificates:{state:"missing",source:"onboarding"},
        references:{state:"missing",source:"onboarding"},
        vault:{state:"not-connected",source:"onboarding"}
      },
      cvText:d.cvText,
      sourceConnectors:[
        {id:"indeed-external",label:"Indeed",mode:"external-link",status:"available",canRead:false,canApply:false},
        {id:"adzuna-jobs",label:"Adzuna",mode:"server-api",status:"ready-not-connected",canRead:true,canApply:false}
      ],
      jobGateway:{
        schema:"nexus-job-gateway-client/v1",
        status:"ready-not-connected",
        endpoint:null,
        provider:"Adzuna",
        connectorId:"adzuna-jobs",
        queryDefaults:{country:"gb",results:10},
        productionTarget:"https://nexus.nosmo.tech/api/nexus/jobs/search"
      },
      jobMatches:[],
      agencies:[]
    };
    return {person,workProfile};
  }

  function finish(){
    const d=save(false);
    const missing=[];
    if(!d.firstName)missing.push("first name");
    if(!d.lastName)missing.push("last name");
    if(!d.trade)missing.push("trade");
    if(!d.location)missing.push("location");
    if(missing.length){
      toast("Complete: "+missing.join(", "));
      openEditor(missing.includes("first name")||missing.includes("last name")?"profile":"work");
      return;
    }
    const canonical=buildCanonicalDraft(d);
    try{
      localStorage.setItem("nexus-person-draft:"+d.personId,JSON.stringify(canonical.person));
      localStorage.setItem("nexus-work-profile-draft:"+d.personId,JSON.stringify(canonical.workProfile));
    }catch(_){}
    const target="person-card-kamil-work-v1.html?draft="+encodeURIComponent(d.personId)+"&from=onboarding";
    window.location.href=target;
  }

  q("#inviteAgency").textContent=agency;
  q("#inviteMessage").textContent=params.get("message")||"Create your Person Card once and reuse it with agencies and jobs.";
  q("#previewSource").textContent=agency==="NOSMO Work Profile"?"Invite":"Agency";

  qa("[data-open-section]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();openEditor(el.dataset.openSection)}));
  q("#menuBtn")?.addEventListener("click",()=>{const menu=q("#menu");const open=menu.classList.toggle("open");q("#menuBtn").setAttribute("aria-expanded",String(open))});
  document.addEventListener("click",e=>{const menu=q("#menu"),btn=q("#menuBtn");if(menu&&!menu.contains(e.target)&&btn&&!btn.contains(e.target)){menu.classList.remove("open");btn.setAttribute("aria-expanded","false")}});
  q("#onboardClose")?.addEventListener("click",closeEditor);
  q("#onboardOverlay")?.addEventListener("click",e=>{if(e.target===q("#onboardOverlay"))closeEditor()});
  q("#doneEditing")?.addEventListener("click",()=>{updatePreview();save(false);closeEditor();toast("Card preview updated")});
  q("#saveDraft")?.addEventListener("click",()=>save(true));
  q("#smartPrefill")?.addEventListener("click",smartPrefill);
  q("#aiPrefill")?.addEventListener("click",aiAssist);
  q("#finishProfile")?.addEventListener("click",finish);
  fields.forEach(id=>{
    q("#"+id)?.addEventListener("input",()=>{updatePreview();save(false)});
    q("#"+id)?.addEventListener("change",()=>{updatePreview();save(false)});
  });
  q("#photoInput")?.addEventListener("change",e=>{
    const file=e.target.files&&e.target.files[0];if(!file)return;
    if(file.size>2*1024*1024){toast("Photo too large for local prototype (max 2 MB)");e.target.value="";return}
    const reader=new FileReader();
    reader.onload=()=>{window.__NEXUS_ONBOARDING_PHOTO=String(reader.result||"");setPhotoPreview(window.__NEXUS_ONBOARDING_PHOTO);save(false)};
    reader.readAsDataURL(file);
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeEditor()});

  load();
  if(!localStorage.getItem(DRAFT_PREFIX+personId))openEditor("profile");
})();
