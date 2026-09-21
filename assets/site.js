document.documentElement.classList.add("js");
document.addEventListener("DOMContentLoaded",function(){
  var toggle=document.querySelector(".nav-toggle");
  var nav=document.querySelector(".site-nav");
  if(!toggle||!nav)return;
  function closeNav(){nav.setAttribute("data-open","false");toggle.setAttribute("aria-expanded","false");}
  toggle.addEventListener("click",function(){
    var open=nav.getAttribute("data-open")==="true";
    nav.setAttribute("data-open",open?"false":"true");
    toggle.setAttribute("aria-expanded",open?"false":"true");
  });
  nav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",closeNav);});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")closeNav();});
  window.addEventListener("resize",function(){if(window.innerWidth>820)closeNav();});
});