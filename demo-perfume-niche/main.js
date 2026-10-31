(function(){
"use strict";
var P=[
 {slug:"qamar",name:"Qa<em>mar</em>",plain:"Qamar",kind:"Concentrated attar",tag:"attar",img:"img/b-qamar.webp",acc:"176 194 214",bh:50,bf:"brightness(.84) contrast(1.08)",
  desc:"Moonlight in oil. Clean neroli and orris over soft sandalwood, made to be dabbed on the wrist, not sprayed.",
  notes:[["Top","Neroli, aldehydes"],["Heart","Orris, jasmine sambac"],["Base","Sandalwood, white musk"]],sizes:[["6 ml",210],["12 ml",380]]},
 {slug:"ward",name:"Wa<em>rd</em>",plain:"Ward",kind:"Eau de parfum",tag:"rose",img:"img/b-ward.webp",acc:"206 112 132",bh:63,bf:"brightness(.92) contrast(1.05)",
  desc:"A Taif rose kept fresh: dewy petals, a little lychee, and a clean musky trail that stays close to the skin.",
  notes:[["Top","Bergamot, lychee"],["Heart","Taif rose, peony"],["Base","White musk, cedar"]],sizes:[["50 ml",395],["75 ml",520]]},
 {slug:"zari",name:"Za<em>ri</em>",plain:"Zari",kind:"Extrait de parfum",tag:"oud",img:"img/b-zari.webp",acc:"214 166 74",bh:67,bf:"brightness(.95)",
  desc:"Named for gold thread. Saffron and rose woven over warm amber and a dark, smooth oud.",
  notes:[["Top","Saffron, pink pepper"],["Heart","Rose, davana"],["Base","Oud, amber, leather"]],sizes:[["50 ml",460],["100 ml",640]]},
 {slug:"kahraman",name:"Kahra<em>man</em>",plain:"Kahraman",kind:"Eau de parfum",tag:"amber",img:"img/b-kahraman.webp",acc:"206 122 52",bh:36,bf:"brightness(1.02)",
  desc:"Amber, the old way: warm resin, plum and cinnamon, settling slowly into tonka and cedar.",
  notes:[["Top","Plum, cinnamon"],["Heart","Labdanum, rose"],["Base","Amber, tonka, cedar"]],sizes:[["50 ml",420],["100 ml",590]]},
 {slug:"shams",name:"Sha<em>ms</em>",plain:"Shams",kind:"Eau de parfum",tag:"citrus",img:"img/b-shams.webp",acc:"230 158 80",bh:50,bf:"brightness(.9) saturate(1.05)",
  desc:"Morning sun on the Corniche. Mandarin and cardamom, orange blossom, then a soft vanilla glow.",
  notes:[["Top","Mandarin, cardamom"],["Heart","Orange blossom"],["Base","Vanilla, benzoin"]],sizes:[["50 ml",340],["100 ml",450]]}
];
var $=function(s,c){return (c||document).querySelector(s)};
var root=document.documentElement;
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
var touchUI=matchMedia("(hover: none)").matches;
var hasG=typeof window.gsap!=="undefined";
var niches=$("#niches"),pdp=$("#pdp"),inner=$("#pdpInner"),panel=$("#panel"),slot=$("#pdpSlot");
var pBtl=$("#panelBtl"),pRef=$("#panelRef"),pWrap=$("#panelWrap");
var cur=0,open=false,busy=false,pushed=false,bag=0,sizeSel=1;
var pad=function(n){return (n<10?"0":"")+n};

/* preload */
P.forEach(function(p){var i=new Image();i.src=p.img});

/* build niches */
P.forEach(function(p,i){
  var b=document.createElement("button");
  b.className="niche";b.type="button";b.dataset.i=i;
  b.setAttribute("aria-label","Open "+p.plain+", "+p.kind);
  b.style.cssText="--acc:"+p.acc+";--bh:"+p.bh+"%;--bf:"+p.bf;
  b.innerHTML='<span class="arch"><span class="arch-in"><span class="beam"></span><span class="lamp"></span>'+
   '<span class="stage"><span class="pool"></span><img class="btl" src="'+p.img+'" alt="" draggable="false"><img class="btl-ref" src="'+p.img+'" alt="" draggable="false"></span>'+
   '<span class="vign"></span></span></span>'+
   '<span class="cap"><b>'+pad(i+1)+'</b><span>'+p.plain+'</span><i>'+p.tag+'</i></span>';
  niches.appendChild(b);
});
var nodes=[].slice.call(niches.children);

/* hover / focus spotlight */
function light(n){nodes.forEach(function(x){x.classList.toggle("on",x===n)});niches.classList.add("hov")}
function unlight(){nodes.forEach(function(x){x.classList.remove("on")});niches.classList.remove("hov")}
nodes.forEach(function(n){
  n.addEventListener("mouseenter",function(){if(!touchUI){stopAuto();light(n)}});
  n.addEventListener("focus",function(){stopAuto();light(n)});
  n.addEventListener("blur",function(){if(!niches.matches(":hover"))unlight()});
  n.addEventListener("click",function(){stopAuto();light(n);openP(+n.dataset.i,n)});
});
niches.addEventListener("mouseleave",function(){if(!touchUI)unlight()});

/* on phones: a slow spotlight walks along the wall until you touch it */
var autoT=null,autoI=0,wallSeen=true;
function startAuto(){
  if(!touchUI||reduce||autoT)return;
  niches.classList.add("auto");
  autoT=setInterval(function(){if(open||!wallSeen||document.hidden)return;light(nodes[autoI%nodes.length]);autoI++},1700);
}
function stopAuto(){if(autoT){clearInterval(autoT);autoT=null}niches.classList.remove("auto")}
if("IntersectionObserver" in window){
  new IntersectionObserver(function(e){wallSeen=e[0].isIntersecting},{threshold:.25}).observe(niches);
}
startAuto();
document.addEventListener("touchstart",function(e){if(!e.target.closest||!e.target.closest(".niche"))return;stopAuto()},{passive:true});

/* intro: lights come on one by one */
if(hasG&&!reduce){
  gsap.from(nodes,{y:28,opacity:0,duration:1,ease:"power3.out",stagger:.09,clearProps:"opacity,transform"});
  gsap.from(niches.querySelectorAll(".lamp,.beam"),{opacity:0,duration:.5,ease:"power1.in",stagger:{each:.12,from:"center"},delay:.5,clearProps:"opacity"});
}

/* detail content */
function fillSizes(p){
  var box=$("#pSizes");box.innerHTML="";
  p.sizes.forEach(function(s,k){
    var b=document.createElement("button");b.type="button";b.className="p-size";b.setAttribute("role","radio");
    b.setAttribute("aria-checked",k===sizeSel?"true":"false");b.textContent=s[0];
    b.addEventListener("click",function(){sizeSel=k;fillSizes(p);price(p)});
    box.appendChild(b);
  });
}
function price(p){$("#pPrice").innerHTML="<small>SAR</small>"+p.sizes[sizeSel][1].toLocaleString("en-US")}
function fill(i){
  var p=P[i];sizeSel=p.sizes.length-1;
  pdp.style.setProperty("--acc",p.acc);
  $("#pKind").textContent=p.kind;
  $("#pName").innerHTML=p.name;
  $("#pDesc").textContent=p.desc;
  $("#pIdx").textContent=pad(i+1);$("#pTot").textContent=pad(P.length);$("#pBig").textContent=pad(i+1);
  $("#pNotes").innerHTML=p.notes.map(function(n){return "<dt>"+n[0]+"</dt><dd>"+n[1]+"</dd>"}).join("");
  fillSizes(p);price(p);
}
function dressPanel(i){
  var p=P[i];
  panel.style.setProperty("--acc",p.acc);panel.style.setProperty("--bh",p.bh+"%");panel.style.setProperty("--bf",p.bf);
  pBtl.src=p.img;pRef.src=p.img;
}

/* geometry */
function archBox(n){var a=n.querySelector(".arch").getBoundingClientRect();return {x:a.left,y:a.top,w:a.width,h:a.height}}
function slotBox(){var s=slot.getBoundingClientRect();return {x:s.left,y:s.top+inner.scrollTop,w:s.width,h:s.height}}
function setPanel(b,t){ // t: 0 = niche shape, 1 = full panel
  var rx=(1-t)*b.w/2, ry=(1-t)*b.h*.16, r2=(1-t)*6;
  panel.style.left=b.x+"px";panel.style.top=b.y+"px";panel.style.width=b.w+"px";panel.style.height=b.h+"px";
  panel.style.setProperty("--k",(1-t*(innerWidth<900?.2:.12)).toFixed(4));
  panel.style.borderRadius=rx+"px "+rx+"px "+r2+"px "+r2+"px / "+ry+"px "+ry+"px "+r2+"px "+r2+"px";
}
function lerp(a,b,t){return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,w:a.w+(b.w-a.w)*t,h:a.h+(b.h-a.h)*t}}
var uiSel=".pdp-bar,.pdp-info>*,.pdp-side>*";
function syncScroll(){if(open&&!busy)panel.style.transform="translateY("+(-inner.scrollTop)+"px)"}
inner.addEventListener("scroll",syncScroll,{passive:true});

function openP(i,n){
  if(open||busy)return;
  busy=true;cur=i;fill(i);dressPanel(i);
  pdp.hidden=false;root.classList.add("lock");inner.scrollTop=0;panel.style.transform="none";
  var from=archBox(n),to=slotBox();
  setPanel(from,0);n.classList.add("ghost");
  var ui=pdp.querySelectorAll(uiSel),bg=$(".pdp-bg");
  if(!hasG||reduce){setPanel(to,1);finishOpen();return}
  gsap.set(ui,{opacity:0,y:18});gsap.set(bg,{opacity:0});
  var o={t:0};
  gsap.timeline({onComplete:finishOpen})
   .to(bg,{opacity:1,duration:.55,ease:"power2.out"},0)
   .to(o,{t:1,duration:.95,ease:"power3.inOut",onUpdate:function(){setPanel(lerp(from,to,o.t),o.t)}},0)
   .to(ui,{opacity:1,y:0,duration:.6,ease:"power3.out",stagger:.045},.55);
}
function finishOpen(){
  busy=false;open=true;panel.classList.add("lit");
  if(hasG)gsap.set(pdp.querySelectorAll(uiSel),{clearProps:"opacity,transform"});
  if(!pushed){try{history.pushState({pdp:1},"","#"+P[cur].slug);pushed=true}catch(e){}}
  $("#pdpClose").focus({preventScroll:true});
}
function closeP(fromPop){
  if(!open||busy)return;
  if(pushed&&!fromPop){pushed=false;history.back();return} // popstate will call us again
  pushed=false;busy=true;
  var n=nodes[cur];
  // bring the niche into view behind the overlay
  var r=n.getBoundingClientRect();
  if(r.top<70||r.bottom>innerHeight-20){window.scrollTo({top:window.scrollY+r.top-Math.max(80,(innerHeight-r.height)/2),behavior:"instant"})}
  var s=slot.getBoundingClientRect();
  var from={x:s.left,y:s.top,w:s.width,h:s.height};
  panel.style.transform="none";
  var to=archBox(n);
  panel.classList.remove("lit");
  var ui=pdp.querySelectorAll(uiSel),bg=$(".pdp-bg");
  if(!hasG||reduce){done();return}
  var o={t:1};
  gsap.timeline({onComplete:done})
   .to(ui,{opacity:0,y:12,duration:.28,ease:"power2.in",stagger:.015},0)
   .to(o,{t:0,duration:.85,ease:"power3.inOut",onUpdate:function(){setPanel(lerp(to,from,o.t),o.t)}},.12)
   .to(bg,{opacity:0,duration:.6,ease:"power2.inOut"},.35);
  function done(){
    n.classList.remove("ghost");pdp.hidden=true;root.classList.remove("lock");busy=false;open=false;
    if(hasG)gsap.set(ui,{clearProps:"opacity,transform"});
    if(touchUI){unlight();startAuto()}
    n.focus({preventScroll:true});
  }
}
addEventListener("popstate",function(){if(open)closeP(true)});

/* switching products inside the detail */
function go(d){
  if(!open||busy)return;
  var j=(cur+d+P.length)%P.length;busy=true;
  var info=pdp.querySelectorAll(".pdp-info>*,.p-notes,.p-big");
  nodes[cur].classList.remove("ghost");nodes[j].classList.add("ghost");
  var swap=function(){cur=j;fill(j);dressPanel(j);try{history.replaceState({pdp:1},"","#"+P[j].slug)}catch(e){}};
  if(!hasG||reduce){swap();busy=false;return}
  gsap.timeline({onComplete:function(){busy=false;gsap.set(info,{clearProps:"opacity,transform"})}})
   .to(pWrap,{x:-d*90,opacity:0,duration:.32,ease:"power2.in"},0)
   .to(info,{opacity:0,x:-d*24,duration:.26,ease:"power2.in",stagger:.02},0)
   .add(swap)
   .fromTo(pWrap,{x:d*90,opacity:0},{x:0,opacity:1,duration:.55,ease:"power3.out"})
   .fromTo(info,{opacity:0,x:d*24},{opacity:1,x:0,duration:.5,ease:"power3.out",stagger:.035},"<");
}
$("#pPrev").addEventListener("click",function(){go(-1)});
$("#pNext").addEventListener("click",function(){go(1)});
$("#pdpClose").addEventListener("click",function(){closeP(false)});
addEventListener("keydown",function(e){
  if(!open)return;
  if(e.key==="Escape")closeP(false);
  else if(e.key==="ArrowRight")go(1);
  else if(e.key==="ArrowLeft")go(-1);
});
/* swipe on the bottle */
var sx=0,sy=0,st=0,down=false;
slot.addEventListener("pointerdown",function(e){down=true;sx=e.clientX;sy=e.clientY;st=Date.now()});
slot.addEventListener("pointerup",function(e){
  if(!down)return;down=false;
  var dx=e.clientX-sx,dy=e.clientY-sy;
  if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3&&Date.now()-st<900)go(dx<0?1:-1);
});
slot.addEventListener("pointercancel",function(){down=false});
var tx=0,ty=0;
slot.addEventListener("touchstart",function(e){tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
slot.addEventListener("touchend",function(e){
  if(down)return; // pointer events already handled it
  var t=e.changedTouches[0],dx=t.clientX-tx,dy=t.clientY-ty;
  if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)go(dx<0?1:-1);
},{passive:true});

/* keep the panel on its slot when the window changes size */
addEventListener("resize",function(){if(open&&!busy){panel.style.transform="none";setPanel(slotBox(),1);syncScroll()}});

/* bag */
var toastT;
function toast(m){var t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove("show")},2200)}
$("#pAdd").addEventListener("click",function(){
  bag++;var p=P[cur];
  ["#bagN","#bagN2"].forEach(function(s){$(s).textContent=bag});
  ["#bagBtn","#bagBtn2"].forEach(function(s){var b=$(s);b.setAttribute("aria-label","Bag, "+bag+" item"+(bag>1?"s":""));b.classList.remove("pop");void b.offsetWidth;b.classList.add("pop")});
  toast(p.plain+", "+p.sizes[sizeSel][0]+" added to your bag");
});
["#bagBtn","#bagBtn2"].forEach(function(s){$(s).addEventListener("click",function(){toast(bag?("Your bag has "+bag+" item"+(bag>1?"s":"")+". Checkout is off in this demo."):"Your bag is empty. Open a niche to add a perfume.")})});

/* mobile menu */
var burger=$("#burger"),menu=$("#menu");
function setMenu(on){burger.setAttribute("aria-expanded",on?"true":"false");burger.setAttribute("aria-label",on?"Close menu":"Open menu");menu.classList.toggle("open",on);menu.setAttribute("aria-hidden",on?"false":"true");root.classList.toggle("lock",on)}
burger.addEventListener("click",function(){setMenu(burger.getAttribute("aria-expanded")!=="true")});
menu.querySelectorAll("[data-close]").forEach(function(a){a.addEventListener("click",function(){setMenu(false)})});

/* deep link: #zari opens Zari */
var h=location.hash.slice(1),k=P.findIndex(function(p){return p.slug===h});
if(k>-1){try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}
  setTimeout(function(){nodes[k].scrollIntoView({block:"center",behavior:"instant"});setTimeout(function(){openP(k,nodes[k])},350)},400)}

window.__niche={open:function(i){openP(i,nodes[i])},close:function(){closeP(false)},go:go,state:function(){return {open:open,busy:busy,cur:cur}}};
})();
