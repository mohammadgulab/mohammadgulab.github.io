(function(){
"use strict";
var D=[
 {n:"01",tag:"The signature",l1:"Chicken Dum",l2:"Biryani",word:"Biryani",img:"biryani",sc:1,alt:"Chicken dum biryani in a white bowl",price:58,desc:"Aged basmati and saffron layered over chicken marinated overnight, sealed in the handi and slow cooked on dum.",hue:"229,134,44"},
 {n:"02",tag:"Velvet classic",l1:"Butter Chicken",l2:"Makhani",word:"Makhani",img:"makhani",sc:1,alt:"Butter chicken makhani in a bowl",price:52,desc:"Charred tandoori chicken folded into a slow tomato, butter and cream gravy, finished with kasuri methi.",hue:"226,98,40"},
 {n:"03",tag:"From the clay oven",l1:"Tandoori",l2:"Chicken",word:"Tandoori",img:"tandoori",sc:1.12,alt:"Tandoori chicken on a sizzling plate",price:49,desc:"Half chicken in Kashmiri chilli and yogurt, roasted over charcoal and served sizzling with onion and lemon.",hue:"214,72,38"},
 {n:"04",tag:"Off the skewer",l1:"Lamb Seekh",l2:"Kebab",word:"Seekh",img:"seekh",sc:0.9,alt:"Seekh kebabs on a wooden board",price:46,desc:"Hand minced lamb with green chilli, ginger and fresh coriander, grilled on iron skewers over coals.",hue:"201,110,52"},
 {n:"05",tag:"Smoke and spice",l1:"Paneer",l2:"Tikka",word:"Tikka",img:"paneer",sc:1,alt:"Paneer tikka in a skillet",price:42,desc:"Fresh paneer, peppers and onion in a tandoori marinade, charred at the edges and served with mint chutney.",hue:"222,150,50"},
 {n:"06",tag:"Torn by hand",l1:"Butter Garlic",l2:"Naan",word:"Naan",img:"naan",sc:0.72,alt:"Naan bread on a plate",price:9,desc:"Blistered against the tandoor wall, brushed with garlic butter and fresh coriander.",hue:"214,160,80"},
 {n:"07",tag:"To cool the fire",l1:"Mango",l2:"Lassi",word:"Lassi",img:"lassi",sc:0.62,alt:"Mango lassi in a glass",price:18,desc:"Ripe mango whisked with chilled yogurt, a pinch of cardamom and a thread of saffron.",hue:"240,170,40"}
];
var BITS=[
 [["anise",-.46,-.34,64,20],["mint",.44,-.36,92,-15],["chili",-.5,.26,70,40],["redchili",.48,.3,104,-30],["anise",.18,-.5,38,80,1],["mint",-.22,.48,54,160,1]],
 [["chili",-.46,-.3,74,-20],["mint",.46,-.28,86,25],["anise",-.44,.34,52,60],["redchili",.4,.38,110,10],["mint",-.12,-.52,46,-60,1],["anise",.3,.5,40,120,1]],
 [["redchili",-.48,-.32,112,-35],["chili",.46,-.34,76,30],["mint",-.46,.32,80,-10],["anise",.46,.3,58,45],["redchili",.14,-.52,70,60,1],["mint",-.2,.5,50,90,1]],
 [["mint",-.46,-.34,92,15],["chili",.46,-.32,70,-35],["redchili",-.42,.36,100,20],["anise",.44,.36,56,-20],["chili",.2,-.52,44,70,1],["anise",-.24,.52,40,140,1]],
 [["chili",-.46,-.32,72,25],["redchili",.46,-.34,106,-25],["mint",-.44,.34,84,40],["anise",.44,.34,54,10],["mint",.16,-.52,48,-40,1],["chili",-.2,.52,46,100,1]],
 [["mint",-.44,-.34,86,-20],["anise",.44,-.34,58,30],["chili",-.46,.3,66,50],["mint",.44,.34,74,140],["anise",.14,-.52,38,-70,1],["redchili",-.22,.5,70,40,1]],
 [["mint",-.44,-.32,90,20],["anise",.46,-.3,56,-30],["mint",-.46,.34,64,-120],["anise",.42,.36,48,70],["mint",.18,-.52,44,60,1],["anise",-.2,.52,36,110,1]]
];
var N=D.length,cur=-1,busy=false,cart=0;
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var G=window.gsap,ST=window.ScrollTrigger;
var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var fine=window.matchMedia("(pointer: fine)").matches;
if(G&&ST){G.registerPlugin(ST);ST.config({ignoreMobileResize:true});}
// preload
D.forEach(function(d){var i=new Image();i.src="img/"+d.img+".webp";});
["anise","mint","chili","redchili"].forEach(function(k){var i=new Image();i.src="img/"+k+".webp";});

var dish=$("#dish"),bits=$("#bits"),giant=$("#giant"),stage=$("#stage"),glow=$(".glow"),bar=$("#bar");
var idx=$("#index");
D.forEach(function(d,i){var li=document.createElement("li");li.innerHTML='<button type="button" aria-label="'+d.l1+" "+d.l2+'"><span class="nm">'+d.word+'</span>'+d.n+'</button>';li.firstChild.addEventListener("click",function(){go(i)});idx.appendChild(li);});

function splitChars(el,t){el.innerHTML="";t.split("").forEach(function(c){var s=document.createElement("span");s.className="ch";s.textContent=c;el.appendChild(s);});return $$(".ch",el);}
function words(el,t){el.innerHTML=t.split(" ").map(function(w){return '<span class="w">'+w+'</span>'}).join(" ");return $$(".w",el);}

var bitEls=[];
function makeBits(i){
  var r=stage.getBoundingClientRect(),sw=Math.min(r.width,720),sh=Math.max(260,r.height);
  var k=Math.min(1.25,Math.max(.72,sw/430));
  var els=BITS[i].map(function(b){var im=document.createElement("img");im.src="img/"+b[0]+".webp";im.alt="";im.className="bit"+(b[5]?" back":"");im.style.setProperty("--s",Math.round(b[3]*k)+"px");im._x=b[1]*sw*.95;im._y=b[2]*sh*.9;im._r=b[4];bits.appendChild(im);return im;});
  // spice dots burst with the pieces
  var seed=i*97+13,rnd=function(){seed=(seed*16807)%2147483647;return seed/2147483647};
  var cols=["#e5862c","#7a2a10","#f3e6cf","#3a2010","#c9302c","#d9a54e","#5e7d2a"];
  for(var j=0;j<14;j++){var dt=document.createElement("span");dt.className="dot";var a=rnd()*6.283,rr=.22+rnd()*.3,sz=Math.round((4+rnd()*8)*k);
    dt.style.width=dt.style.height=sz+"px";dt.style.margin=(-sz/2)+"px 0 0 "+(-sz/2)+"px";dt.style.background=cols[j%cols.length];
    dt._x=Math.cos(a)*rr*sw;dt._y=Math.sin(a)*rr*sh*.85;dt._r=0;bits.appendChild(dt);els.push(dt);}
  return els;
}
function setText(d){
  $("#dNum").textContent=d.n;$("#dTag").textContent=d.tag;$("#dDesc").textContent=d.desc;$("#dPrice").textContent=d.price;$("#mPrice").textContent=d.price;
  var nm=$("#dName");nm.querySelector(".l1").textContent=d.l1;nm.querySelector(".l2").textContent=d.l2;
  $$("#index button").forEach(function(b,j){b.setAttribute("aria-current",j===cur?"true":"false")});
  if(bar)bar.style.transform="scaleX("+((cur+1)/N)+")";
}
function show(i,dir){
  if(i===cur||i<0||i>=N)return; var prev=cur;cur=i;var d=D[i];dir=dir||(prev<i?1:-1);
  if(!G||reduce){setText(d);dish.src="img/"+d.img+".webp";dish.alt=d.alt;dish.style.setProperty("--sc",d.sc);giant.textContent=d.word;bits.innerHTML="";bitEls=makeBits(i);bitEls.forEach(function(b){b.style.transform="translate("+b._x+"px,"+b._y+"px) rotate("+b._r+"deg)"});return;}
  var old=bitEls;bitEls=[];
  // old ingredients scatter outward
  old.forEach(function(b){G.killTweensOf(b);G.to(b,{x:b._x*2.2,y:b._y*2.2-40*dir,rotation:b._r+180*dir,opacity:0,scale:.6,duration:.6,ease:"power2.in",onComplete:function(){b.remove()}})});
  // dish out
  G.killTweensOf(dish);
  var tl=G.timeline();
  tl.to(dish,{yPercent:-38*dir,scale:.55,rotation:-28*dir,opacity:0,filter:"blur(6px) drop-shadow(0 34px 40px rgba(0,0,0,.65))",duration:prev<0?0:.45,ease:"power3.in"})
    .add(function(){dish.src="img/"+d.img+".webp";dish.alt=d.alt;dish.style.setProperty("--sc",d.sc);})
    .fromTo(dish,{yPercent:42*dir,scale:1.35,rotation:24*dir,opacity:0,filter:"blur(10px) drop-shadow(0 34px 40px rgba(0,0,0,.65))"},{yPercent:0,scale:1,rotation:0,opacity:1,filter:"blur(0px) drop-shadow(0 34px 40px rgba(0,0,0,.65))",duration:1.05,ease:"expo.out"});
  // ingredients explode out of the dish
  tl.add(function(){
    bitEls=makeBits(i);
    bitEls.forEach(function(b,j){
      G.fromTo(b,{x:0,y:0,scale:.15,rotation:b._r-160,opacity:0},{x:b._x,y:b._y,scale:1,rotation:b._r,opacity:1,duration:1.1,delay:j*.04,ease:"back.out(1.6)",onComplete:function(){
        G.to(b,{y:"+="+(10+j*3),rotation:"+="+(j%2?8:-8),duration:2.2+j*.3,repeat:-1,yoyo:true,ease:"sine.inOut"});
      }});
    });
  },"-=0.95");
  // texts
  var nameW=$$("#dName span");
  G.fromTo("#dNum",{yPercent:100*dir,opacity:0},{yPercent:0,opacity:1,duration:.6,ease:"power3.out",delay:.25});
  setText(d);
  nameW.forEach(function(s,j){G.fromTo(s.childNodes.length?s:s,{clipPath:"inset(0 0 100% 0)",y:30*dir},{clipPath:"inset(0 0 0% 0)",y:0,duration:.8,delay:.3+j*.1,ease:"power3.out"})});
  G.fromTo(["#dDesc",".dish-buy",".mobile-buy"],{opacity:0,y:14},{opacity:1,y:0,duration:.6,delay:.5,stagger:.06,ease:"power2.out"});
  var ch=splitChars(giant,d.word);
  G.fromTo(ch,{yPercent:105*dir,opacity:0},{yPercent:0,opacity:1,duration:.9,delay:.15,stagger:.04,ease:"expo.out"});
  if(glow)glow.style.background="radial-gradient(circle,rgba("+d.hue+",.34),rgba("+d.hue+",0) 58%)";
}

// scroll-driven hero
var trig=null;
function go(i){
  i=Math.max(0,Math.min(N-1,i));
  if(trig){var y=trig.start+(trig.end-trig.start)*((i+.5)/N);if(lenis)lenis.scrollTo(y,{duration:1.1});else window.scrollTo({top:y,behavior:"smooth"});}
  else show(i);
}
var lenis=null;
if(G&&ST&&!reduce&&fine&&window.Lenis){try{lenis=new window.Lenis({lerp:.1,smoothWheel:true});lenis.on("scroll",ST.update);G.ticker.add(function(t){lenis.raf(t*1000)});G.ticker.lagSmoothing(0);}catch(e){lenis=null}}
if(G&&ST){
  trig=ST.create({trigger:".serve",pin:".serve-pin",start:"top top",end:function(){return "+="+Math.round(window.innerHeight*.7*N)},anticipatePin:1,
    onUpdate:function(s){
      var p=s.progress*N,i=Math.min(N-1,Math.floor(p)),loc=Math.min(1,p-i);
      if(i!==cur)show(i);
      // within one dish: slow drift so the plate turns and the spices spread as you scroll
      G.to(bits,{scale:1+loc*.22,rotation:loc*10,duration:.4,overwrite:"auto"});
      G.to(stage,{y:-loc*14,duration:.4,overwrite:"auto"});
      if(bar)bar.style.transform="scaleX("+Math.max(.04,s.progress)+")";
    }});
}
show(0,1);

// swipe on the hero
var sx=0,sy=0,tt=0;
stage.addEventListener("touchstart",function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;tt=Date.now()},{passive:true});
stage.addEventListener("touchend",function(e){var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3&&Date.now()-tt<700){go(cur+(dx<0?1:-1))}},{passive:true});
document.addEventListener("keydown",function(e){if(!trig||window.scrollY>trig.end)return;if(e.key==="ArrowRight")go(cur+1);if(e.key==="ArrowLeft")go(cur-1)});

// desktop parallax
if(fine&&G){var pin=$(".serve-pin");pin.addEventListener("mousemove",function(e){var r=pin.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;G.to(dish,{x:x*30,duration:1,overwrite:false});G.to(".plate-ring",{x:x*-18,y:y*-18,duration:1.2});G.to(giant,{x:x*-40,duration:1.4})});}

// embers
(function(){var c=$("#embers");if(!c||reduce)return;var x=c.getContext("2d"),w,h,dpr=Math.min(2,window.devicePixelRatio||1),P=[],on=true;
function rs(){w=c.clientWidth;h=c.clientHeight;c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0)}rs();window.addEventListener("resize",rs);
var n=w<700?34:70;for(var i=0;i<n;i++)P.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.8+.4,v:Math.random()*.5+.2,a:Math.random()*6.28,o:Math.random()*.6+.2});
if("IntersectionObserver"in window)new IntersectionObserver(function(e){on=e[0].isIntersecting}).observe(c);
(function f(){requestAnimationFrame(f);if(!on)return;x.clearRect(0,0,w,h);P.forEach(function(p){p.y-=p.v;p.a+=.02;p.x+=Math.sin(p.a)*.3;if(p.y<-10){p.y=h+10;p.x=Math.random()*w}var g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);g.addColorStop(0,"rgba(255,190,110,"+p.o+")");g.addColorStop(1,"rgba(229,134,44,0)");x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,p.r*4,0,6.28);x.fill()})})();})();

// cart
function toast(t){var el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove("show")},2600)}
function add(btn){cart++;$("#cartCount").textContent=cart;var cb=$("#cartBtn");cb.setAttribute("aria-label","Your order, "+cart+" items");
  if(G&&!reduce){var r=dish.getBoundingClientRect(),t=cb.getBoundingClientRect(),f=document.createElement("img");f.src=dish.src;f.className="fly";f.alt="";f.style.left=(r.left+r.width/2-30)+"px";f.style.top=(r.top+r.height/2-30)+"px";document.body.appendChild(f);
    G.to(f,{x:t.left+t.width/2-(r.left+r.width/2),y:t.top+t.height/2-(r.top+r.height/2),scale:.3,rotation:200,duration:.8,ease:"power2.inOut",onComplete:function(){f.remove();cb.classList.remove("bump");void cb.offsetWidth;cb.classList.add("bump")}});}
  toast(D[cur].l1+" "+D[cur].l2+" added to your order");}
$("#addBtn").addEventListener("click",add);$("#mAdd").addEventListener("click",add);
$("#cartBtn").addEventListener("click",function(){toast(cart?cart+(cart>1?" items":" item")+" in your order. Checkout is off in this demo.":"Your order is empty. Add a dish from the top.")});
$("#orderBtn").addEventListener("click",function(){toast("Delivery ordering is off in this concept demo.")});

// nav
var nav=$(".nav");function ns(){nav.classList.toggle("solid",window.scrollY>40)}window.addEventListener("scroll",ns,{passive:true});ns();
var bg=$("#burger"),dr=$("#drawer");function setD(o){bg.setAttribute("aria-expanded",o);bg.setAttribute("aria-label",o?"Close menu":"Open menu");dr.classList.toggle("open",o);dr.setAttribute("aria-hidden",!o);document.body.style.overflow=o?"hidden":""}
bg.addEventListener("click",function(){setD(bg.getAttribute("aria-expanded")!=="true")});
$$('a[href^="#"]').forEach(function(a){a.addEventListener("click",function(e){var id=a.getAttribute("href");var t=$(id);if(!t)return;e.preventDefault();setD(false);var y=id==="#serve"?0:t.getBoundingClientRect().top+window.scrollY-60;if(lenis)lenis.scrollTo(y);else window.scrollTo({top:y,behavior:"smooth"})})});

// menu
var MENU={rice:[["biryani","Chicken Dum Biryani","Saffron basmati, overnight chicken, fried onion, raita",58],["","Lamb Dum Biryani","Slow cooked lamb shoulder, kewra, mint, boiled egg",69],["","Prawn Biryani","Gulf prawns, coconut, curry leaf, green chilli",72],["","Vegetable Dum Biryani","Seasonal vegetables, paneer, saffron, cashew",44]],
 tandoor:[["tandoori","Tandoori Chicken","Half chicken, Kashmiri chilli, charcoal roasted",49],["seekh","Lamb Seekh Kebab","Hand minced lamb, ginger, green chilli, coriander",46],["paneer","Paneer Tikka","Paneer, peppers, onion, mint chutney",42],["","Malai Tikka","Chicken in cream, cheese and cardamom",47]],
 curry:[["makhani","Butter Chicken Makhani","Tomato, butter, cream, kasuri methi",52],["","Lamb Rogan Josh","Kashmiri chilli, fennel, slow braised lamb",62],["","Dal Makhani","Black lentils simmered overnight, butter",34],["","Palak Paneer","Spinach, paneer, garlic, a little cream",39]],
 bread:[["naan","Butter Garlic Naan","Tandoor baked, garlic butter, coriander",9],["","Laccha Paratha","Flaky layered whole wheat bread",8],["lassi","Mango Lassi","Mango, yogurt, cardamom, saffron",18],["","Karak Chai","Strong tea, milk, cardamom, ginger",7]]};
var ml=$("#menuList");
function renderMenu(c){ml.innerHTML=MENU[c].map(function(m){return '<article class="mi"><div class="ph'+(m[0]?"":" txt")+'">'+(m[0]?'<img src="img/'+m[0]+'.webp" alt="" loading="lazy">':m[1].charAt(0))+'</div><div><h3>'+m[1]+'</h3><p>'+m[2]+'</p></div><div class="pr"><small>SAR</small>'+m[3]+'</div></article>'}).join("");
  if(G&&!reduce)G.fromTo($$(".mi",ml),{opacity:0,y:18},{opacity:1,y:0,duration:.5,stagger:.06,ease:"power2.out"});}
renderMenu("rice");
$$(".tabs button").forEach(function(b){b.addEventListener("click",function(){$$(".tabs button").forEach(function(x){x.setAttribute("aria-selected",x===b)});renderMenu(b.dataset.cat)})});

// reserve
var gs=2,go_=$("#guests");$$(".g-btn").forEach(function(b){b.addEventListener("click",function(){gs=Math.max(1,Math.min(12,gs+ +b.dataset.d));go_.textContent=gs})});
var dt=$('#reserve input[name=date]');try{var td=new Date();dt.min=td.toISOString().slice(0,10);dt.value=dt.min}catch(e){}
$("#reserve").addEventListener("submit",function(e){e.preventDefault();var nm=this.name.value.trim();if(!nm){this.name.focus();toast("Add a name for the table");return}toast("Thanks "+nm+", a table for "+gs+" is noted. Demo only, nothing was sent.");});

// section motion
if(G&&ST&&!reduce){
  $$(".split").forEach(function(el){
    var ws=[];(function walk(n){$$(":scope > *",n);Array.prototype.slice.call(n.childNodes).forEach(function(c){if(c.nodeType===3){var f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(function(t){if(!t)return;if(/^\s+$/.test(t)){f.appendChild(document.createTextNode(t));return}var w=document.createElement("span");w.className="w";var s=document.createElement("span");s.textContent=t;w.appendChild(s);f.appendChild(w);ws.push(s)});c.parentNode.replaceChild(f,c)}else if(c.nodeType===1)walk(c)})})(el);
    G.from(ws,{yPercent:110,duration:1,stagger:.05,ease:"expo.out",scrollTrigger:{trigger:el,start:"top 85%"}});
  });
  G.to(".story-fig .spin",{rotation:70,ease:"none",scrollTrigger:{trigger:".story",start:"top bottom",end:"bottom top",scrub:true}});
  G.to(".sf1",{y:-80,rotation:90,ease:"none",scrollTrigger:{trigger:".story",start:"top bottom",end:"bottom top",scrub:true}});
  G.to(".sf2",{y:-140,rotation:-40,ease:"none",scrollTrigger:{trigger:".story",start:"top bottom",end:"bottom top",scrub:true}});
  G.to(".sf3",{y:60,rotation:60,ease:"none",scrollTrigger:{trigger:".story",start:"top bottom",end:"bottom top",scrub:true}});
  $$(".step").forEach(function(s){G.from(s,{opacity:0,y:30,duration:.8,ease:"power3.out",scrollTrigger:{trigger:s,start:"top 88%"}})});
  [[".fl1",-160,120],[".fl2",-260,-60],[".fl3",-200,80],[".fl4",-90,-140]].forEach(function(a){G.to(a[0],{y:a[1],rotation:a[2],ease:"none",scrollTrigger:{trigger:".spices",start:"top bottom",end:"bottom top",scrub:true}})});
  G.from(".spice-list li",{opacity:0,y:20,duration:.6,stagger:.05,ease:"power2.out",scrollTrigger:{trigger:".spice-list",start:"top 85%"}});
  G.from(".reserve",{opacity:0,y:40,duration:.9,ease:"power3.out",scrollTrigger:{trigger:".reserve",start:"top 88%"}});
}
window.addEventListener("load",function(){if(ST)ST.refresh()});
})();
