document.documentElement.classList.add("js");
(function(){
  var nav=document.querySelector(".nav"),b=document.getElementById("burger");
  if(b){b.addEventListener("click",function(){var o=nav.classList.toggle("open");b.setAttribute("aria-expanded",o?"true":"false");});
    document.querySelectorAll("#links a").forEach(function(a){a.addEventListener("click",function(){nav.classList.remove("open");b.setAttribute("aria-expanded","false");});});}
  var tabs=document.querySelectorAll(".tab"),cards=document.querySelectorAll(".card");
  tabs.forEach(function(t){t.addEventListener("click",function(){tabs.forEach(function(x){x.classList.remove("on")});t.classList.add("on");var f=t.getAttribute("data-f");
    cards.forEach(function(c){c.classList.toggle("hide",f!=="all"&&c.getAttribute("data-c")!==f);});});});
  function group(sel){var els=document.querySelectorAll(sel);els.forEach(function(e){e.addEventListener("click",function(){els.forEach(function(x){x.classList.remove("on")});e.classList.add("on");});});}
  group(".chip");group(".list li");
  var rv=document.querySelectorAll(".reveal");
  if(!("IntersectionObserver" in window)||window.matchMedia("(prefers-reduced-motion: reduce)").matches){rv.forEach(function(e){e.classList.add("in")});return;}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});},{threshold:.12,rootMargin:"0px 0px -40px 0px"});
  rv.forEach(function(e){io.observe(e)});
  setTimeout(function(){rv.forEach(function(e){if(e.getBoundingClientRect().top<innerHeight)e.classList.add("in")});},1200);
})();
