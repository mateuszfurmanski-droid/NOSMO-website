(function(){
  "use strict";

  function q(sel,root){return (root||document).querySelector(sel)}
  function qa(sel,root){return Array.from((root||document).querySelectorAll(sel))}
  function escapeHtml(value){
    return String(value??"").replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function toast(msg){
    var el=q("#workToast");
    if(!el)return;
    el.textContent=msg;
    el.classList.add("show");
    window.setTimeout(function(){el.classList.remove("show")},2400);
  }
  function sourceLabel(profile,id){
    var row=(profile.sourceConnectors||[]).find(function(x){return x.id===id});
    return row?row.label:"Source";
  }
  function renderCriteria(profile){
    var grid=q("#workCriteria");
    if(!grid)return;
    var a=profile.availability||{},p=profile.preferences||{};
    var chips=[
      ["Trade",p.primaryTrade||"—"],
      ["Base",(p.locations||[])[0]||"—"],
      ["Status",a.label||a.status||"—"],
      ["Radius",a.preferredRadiusKm?String(a.preferredRadiusKm)+" km":"—"],
      ["Shift",(a.shifts||[]).join(" / ")||"—"],
      ["Transport",a.ownTransport?"Own transport":"Not stated"]
    ];
    grid.innerHTML=chips.map(function(row){
      return '<div class="workChip"><span>'+escapeHtml(row[0])+'</span><strong>'+escapeHtml(row[1])+'</strong></div>';
    }).join("");
  }
  function renderJobs(profile){
    var list=q("#jobList");
    if(!list)return;
    list.innerHTML=(profile.jobMatches||[]).map(function(job){
      var reasons=(job.reasons||[]).map(function(x){return '<i>'+escapeHtml(x)+'</i>'}).join("");
      var gaps=(job.gaps||[]).length
        ? '<p class="reason">Check: '+escapeHtml((job.gaps||[]).join(" · "))+'</p>'
        : '<p class="reason">No missing requirement identified in the demo record.</p>';
      return '<article class="jobCard">'+
        '<div class="jobTop"><div><strong>'+escapeHtml(job.title)+'</strong><span>'+escapeHtml(sourceLabel(profile,job.sourceId))+' · '+escapeHtml(job.location)+'</span></div><div class="match">'+escapeHtml(job.matchScore)+'%</div></div>'+
        '<div class="jobMeta"><i>'+escapeHtml(job.distanceKm)+' km</i><i>'+escapeHtml(job.shift||"Shift n/a")+'</i><i>'+escapeHtml(job.rate||"Rate n/a")+'</i></div>'+
        '<p class="reason">'+reasons+'</p>'+gaps+
        '<div class="jobActions"><button type="button" data-demo-draft="'+escapeHtml(job.title)+'">Prepare message</button><button type="button" data-job-id="'+escapeHtml(job.id)+'">Details</button></div>'+
      '</article>';
    }).join("");
  }
  function renderAgencies(profile){
    var list=q("#agencyQueue");
    if(!list)return;
    list.innerHTML=(profile.agencies||[]).map(function(a){
      return '<div class="agencyRow"><strong>'+escapeHtml(a.name)+'</strong><p>'+escapeHtml(a.desk||"Agency")+' · '+escapeHtml(a.status||"")+'</p>'+
        '<div class="agencyActions"><a href="'+escapeHtml(a.whatsapp||"#")+'" target="_blank" rel="noopener">WhatsApp</a><a href="'+escapeHtml(a.email||"#")+'">Email</a></div></div>';
    }).join("");
  }
  function availabilityLabel(a){
    if(!a)return "Available";
    if(a.status==="not-looking")return "Not Looking";
    if(a.status==="from-date")return a.availableFrom ? "From "+a.availableFrom : "From Date";
    return "Available";
  }
  function readLocalAvailability(profile){
    try{
      var raw=localStorage.getItem("nexus-work-availability:"+profile.personId);
      if(!raw)return profile.availability||{};
      return Object.assign({},profile.availability||{},JSON.parse(raw));
    }catch(_){return profile.availability||{}}
  }
  function applyAvailabilityToUi(profile){
    var a=readLocalAvailability(profile);
    profile.availability=a;
    var label=q("#workAvailabilityLabel");
    if(label)label.textContent=availabilityLabel(a);
    var state=q("#availabilityState"),date=q("#availabilityDate"),radius=q("#availabilityRadius");
    var day=q("#shiftDay"),night=q("#shiftNight"),transport=q("#ownTransport"),away=q("#workAway");
    if(state)state.value=a.status||"available";
    if(date)date.value=a.availableFrom||"";
    if(radius)radius.value=String(a.preferredRadiusKm||0);
    if(day)day.checked=(a.shifts||[]).indexOf("day")>=0;
    if(night)night.checked=(a.shifts||[]).indexOf("night")>=0;
    if(transport)transport.checked=!!a.ownTransport;
    if(away)away.checked=!!a.workAway;
    renderCriteria(profile);
  }
  function bindAvailability(profile){
    var save=q("#saveAvailability");
    if(!save)return;
    save.addEventListener("click",function(){
      var state=q("#availabilityState"),date=q("#availabilityDate"),radius=q("#availabilityRadius");
      var day=q("#shiftDay"),night=q("#shiftNight"),transport=q("#ownTransport"),away=q("#workAway");
      var shifts=[];
      if(day&&day.checked)shifts.push("day");
      if(night&&night.checked)shifts.push("night");
      var next={
        status:state?state.value:"available",
        label:state&&state.value==="not-looking"?"Not Looking":state&&state.value==="from-date"?"From Date":"Available",
        availableFrom:date?date.value:"",
        preferredRadiusKm:radius?Number(radius.value||0):0,
        shifts:shifts,
        ownTransport:!!(transport&&transport.checked),
        workAway:!!(away&&away.checked)
      };
      try{localStorage.setItem("nexus-work-availability:"+profile.personId,JSON.stringify(next))}catch(_){}
      profile.availability=Object.assign({},profile.availability||{},next);
      applyAvailabilityToUi(profile);
      toast("Availability saved on this device");
    });
  }
  function renderReadiness(profile){
    var p=profile.readiness||{};
    var map=[
      ["#aiCvState",p.cv&&p.cv.state],
      ["#aiCertState",p.certificates&&p.certificates.state],
      ["#aiRefState",p.references&&p.references.state]
    ];
    map.forEach(function(row){var el=q(row[0]);if(el&&row[1])el.textContent=String(row[1]).toUpperCase()});
  }
  function bindJobDetails(profile){
    document.addEventListener("click",function(e){
      var btn=e.target.closest&&e.target.closest("[data-job-id]");
      if(!btn)return;
      var job=(profile.jobMatches||[]).find(function(j){return j.id===btn.dataset.jobId});
      if(!job)return;
      toast(job.title+" · "+job.matchScore+"% · "+(job.gaps||[]).length+" gap(s)");
    });
  }
  function isRecruiterView(){
    return new URLSearchParams(window.location.search).get("view")==="recruiter";
  }
  function enableRecruiterView(profile){
    if(!isRecruiterView())return;
    document.body.setAttribute("data-recruiter-view","true");
    var mode=q("#workDataMode");
    if(mode)mode.textContent="RECRUITER VIEW";

    var status=q("#workAvailabilityStatus");
    if(status){
      status.removeAttribute("data-work-action");
      status.removeAttribute("role");
      status.removeAttribute("tabindex");
      status.setAttribute("aria-label","Worker availability");
    }

    qa(".bridge").forEach(function(el){el.hidden=true});
    qa('a[href*="relationship-tree"],a[href*="nexus-file-loader"],a[href*="section=vault"],a[href="/apps/nexus/"],a[href*="/apps/nexus/person-cards/"],a[href*="nexus-logo-ui"]').forEach(function(el){el.hidden=true});

    var workButtons=qa(".actions").find(function(row){return q("[data-work-action]",row)});
    if(workButtons){
      workButtons.innerHTML=
        '<button class="act" type="button" data-recruiter-action="offer"><svg viewBox="0 0 24 24"><path d="M4 7h16v12H4zM8 7V5h8v2M4 11h16"/></svg><span>Offer Work</span></button>'+
        '<button class="act" type="button" data-recruiter-action="docs"><svg viewBox="0 0 24 24"><path d="M6 2h8l4 4v16H6zM14 2v5h5M9 13h6M9 17h6"/></svg><span>Request Docs</span></button>'+
        '<button class="act" type="button" data-recruiter-action="contact"><svg viewBox="0 0 24 24"><path d="M5 5h14v14H5zM8 9h8M8 13h5"/></svg><span>Contact</span></button>'+
        '<button class="act" type="button" data-recruiter-action="shortlist"><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg><span>Shortlist</span></button>'+
        '<button class="act" type="button" data-recruiter-action="share"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 11l8-5M8 13l8 5"/></svg><span>Share</span></button>';
    }

    document.addEventListener("click",function(e){
      var action=e.target.closest&&e.target.closest("[data-recruiter-action]");
      if(!action)return;
      e.preventDefault();
      var type=action.dataset.recruiterAction;
      if(type==="offer"){toast("Offer draft created locally. No message was sent.");return}
      if(type==="docs"){toast("Document request prepared. Backend request flow is not connected yet.");return}
      if(type==="contact"){var first=q(".comms a");if(first)first.click();return}
      if(type==="shortlist"){try{localStorage.setItem("nexus-recruiter-shortlist:"+profile.personId,"true")}catch(_){}
        toast("Worker shortlisted on this device");return}
      if(type==="share"){
        var url=window.location.origin+window.location.pathname+"?view=recruiter";
        if(navigator.share){navigator.share({title:"NOSMO Recruiter View",url:url}).catch(function(){})}
        else{navigator.clipboard&&navigator.clipboard.writeText(url);toast("Recruiter View link copied")}
      }
    });
  }
  async function init(){
    var host=q("[data-work-profile-src]");
    if(!host)return;
    var src=host.getAttribute("data-work-profile-src");
    try{
      var res=await fetch(src,{cache:"no-store"});
      if(!res.ok)throw new Error("HTTP "+res.status);
      var profile=await res.json();
      window.NEXUS_WORK_PROFILE=profile;
      applyAvailabilityToUi(profile);
      renderJobs(profile);
      renderAgencies(profile);
      renderReadiness(profile);
      bindAvailability(profile);
      bindJobDetails(profile);
      enableRecruiterView(profile);
      var mode=q("#workDataMode");
      if(mode)mode.textContent=profile.demoMode?"DEMO DATA":"CONNECTED";
    }catch(err){
      console.error("Nexus Work Profile data load failed",err);
      toast("Work Profile data unavailable. Static fallback remains visible.");
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
