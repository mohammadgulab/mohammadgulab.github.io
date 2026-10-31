(function(){
"use strict";
var FL=[
 {k:"pistachio",s:"Pistachio",name:"Pistachio Crunch",big:"PISTACHIO",notes:"Roasted pistachio paste, a pinch of sea salt, crushed nuts folded in at the end.",price:12,bg:"#c9d39a",fg:"#26301a",w:505,h:260},
 {k:"strawberry",s:"Strawberry",name:"Strawberry Fields",big:"STRAWBERRY",notes:"Ripe strawberries blended into fresh cream, bright and a little tangy.",price:11,bg:"#f2b7b0",fg:"#4a1c1a",w:481,h:230},
 {k:"mango",s:"Mango",name:"Alphonso Mango",big:"MANGO",notes:"Sweet mango pulp churned into a smooth, sunny sorbetto. Dairy free.",price:11,bg:"#f6cf6e",fg:"#3d2a06",w:516,h:325},
 {k:"vanilla",s:"Vanilla",name:"Vanilla Bean Cloud",big:"VANILLA",notes:"Whole vanilla pods steeped overnight in milk. Soft, light and clean.",price:10,bg:"#efe3c4",fg:"#3a3020",w:459,h:260},
 {k:"cocoa",s:"Cocoa",name:"Dark Cocoa 70",big:"COCOA",notes:"Deep cocoa with dark chocolate, rich and not too sweet.",price:12,bg:"#b98b6c",fg:"#2a170c",w:253,h:160},
 {k:"cherry",s:"Cherry",name:"Cherry Ripple",big:"CHERRY",notes:"Sour cherries churned into a fior di latte base, bright and a little tart.",price:12,bg:"#e8a7b6",fg:"#45121f",w:520,h:349}
];
var hasG=typeof window.gsap!=="undefined";
if(hasG&&window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);}

/* ---------- hero scroll scrub ---------- */
var canvas=document.getElementById("scrub"),ctx=canvas.getContext("2d");
var N=115,mobile=window.matchMedia("(max-width: 759px)").matches,set=mobile?"m":"d";
var frames=new Array(N),loaded=new Array(N).fill(false),cur=0,drawn=-1;
var FOCAL=mobile?0.5:0.62;
function src(i){return "frames/"+set+"/"+String(i+1).padStart(3,"0")+".webp";}
function sizeCanvas(){var r=canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));drawn=-1;draw(cur);}
function nearest(i){if(loaded[i])return i;for(var o=1;o<N;o++){if(i-o>=0&&loaded[i-o])return i-o;if(i+o<N&&loaded[i+o])return i+o;}return -1;}
function draw(i){var j=nearest(i);if(j<0||j===drawn)return;var im=frames[j],cw=canvas.width,ch=canvas.height,iw=im.naturalWidth,ih=im.naturalHeight;var s=Math.max(cw/iw,ch/ih),w=iw*s,h=ih*s;var x=(cw-w)*FOCAL,y=(ch-h)/2;ctx.drawImage(im,x,y,w,h);drawn=j;}
function load(i){var im=new Image();im.decoding="async";im.onload=function(){loaded[i]=true;if(Math.abs(i-cur)<4||drawn<0)draw(cur);};im.src=src(i);frames[i]=im;}
load(0);
var order=[];for(var s=8;s>=1;s=Math.floor(s/2)){for(var i=0;i<N;i+=s){if(order.indexOf(i)<0)order.push(i);}if(s===1)break;}
var qi=0;function pump(){var c=0;while(qi<order.length&&c<6){load(order[qi++]);c++;}if(qi<order.length)setTimeout(pump,60);}
setTimeout(pump,50);
window.addEventListener("resize",function(){sizeCanvas();});
sizeCanvas();

var steps=[[0,"01","Dip the spade","Red Berry Sorbetto"],[0.11,"02","Lift a scoop","Red Berry Sorbetto"],[0.23,"03","Onto the cone","Alphonso Mango"],[0.55,"04","Pile it high","Alphonso Mango"]];
var stepNum=document.getElementById("stepNum"),stepTxt=document.getElementById("stepTxt"),heroFl=document.getElementById("heroFlavour"),fill=document.getElementById("scrubFill"),lastStep=-1;
function setProgress(p){p=Math.max(0,Math.min(1,p));cur=Math.round(p*(N-1));draw(cur);fill.style.width=(p*100).toFixed(1)+"%";var k=0;for(var i=0;i<steps.length;i++){if(p>=steps[i][0])k=i;}if(k!==lastStep){lastStep=k;stepNum.textContent=steps[k][1];stepTxt.textContent=steps[k][2];if(heroFl.textContent!==steps[k][3]){heroFl.textContent=steps[k][3];if(hasG)gsap.fromTo(heroFl,{y:14,opacity:0},{y:0,opacity:1,duration:.45,ease:"power3.out"});}if(hasG)gsap.fromTo(".step-tag",{scale:.9},{scale:1,duration:.35,ease:"back.out(3)"});}}
var hero=document.getElementById("hero");
if(hasG&&window.ScrollTrigger){
  var st={p:0};
  gsap.to(st,{p:1,ease:"none",scrollTrigger:{trigger:hero,start:"top top",end:"bottom bottom",scrub:0.35},onUpdate:function(){setProgress(st.p);}});
  gsap.from(".hero-title span, .hero-title em",{y:40,opacity:0,duration:.9,stagger:.12,ease:"power3.out"});
}else{
  window.addEventListener("scroll",function(){var r=hero.getBoundingClientRect();setProgress(-r.top/(r.height-window.innerHeight));},{passive:true});
}
setProgress(0);

/* ---------- flavour carousel ---------- */
var flSec=document.getElementById("flavours"),flScoop=document.getElementById("flScoop"),flBig=document.getElementById("flBig"),flName=document.getElementById("flName"),flNotes=document.getElementById("flNotes"),flPrice=document.getElementById("flPrice"),flIdx=document.getElementById("flIdx"),dots=document.getElementById("flDots"),fi=0,busy=false;
FL.forEach(function(f,i){var b=document.createElement("button");b.type="button";b.setAttribute("role","tab");b.setAttribute("aria-label",f.name);b.setAttribute("aria-selected",i===0?"true":"false");b.addEventListener("click",function(){goFl(i);});dots.appendChild(b);});
FL.forEach(function(f){["card-","b-","t-","icon-"].forEach(function(p){var im=new Image();im.src="img/"+p+f.k+".webp";});});
function paint(i){var f=FL[i];flSec.style.setProperty("--bg",f.bg);flSec.style.setProperty("--fg",f.fg);flName.textContent=f.name;flNotes.textContent=f.notes;flPrice.textContent="SAR "+f.price;flIdx.textContent=String(i+1).padStart(2,"0")+" / 06";flBig.textContent=f.big;fitBig();flScoop.src="img/card-"+f.k+".webp";flScoop.alt=f.name+" gelato in a waffle cone";[].forEach.call(dots.children,function(d,j){d.setAttribute("aria-selected",j===i?"true":"false");});}
function fitBig(){var w=Math.min(window.innerWidth,1400)*0.9;flBig.style.fontSize=Math.min(w/(flBig.textContent.length*0.72),190)+"px";}
fitBig();window.addEventListener("resize",fitBig);
function goFl(i,dir){i=(i+FL.length)%FL.length;if(i===fi||busy)return;dir=dir||(i>fi?1:-1);fi=i;
  if(!hasG){paint(i);return;}
  busy=true;
  gsap.timeline({onComplete:function(){busy=false;}})
   .to(flScoop,{x:-dir*40,scale:1.04,opacity:0,duration:.3,ease:"power2.in"})
   .to([flName,flNotes,flBig],{y:-12,opacity:0,duration:.2,stagger:.03},"<")
   .add(function(){paint(i);})
   .fromTo(flScoop,{x:dir*50,y:10,scale:1.08,opacity:0},{x:0,y:0,scale:1,opacity:1,duration:.8,ease:"power3.out"})
   .fromTo([flName,flNotes,flBig],{y:16,opacity:0},{y:0,opacity:function(k){return k===2?.13:1;},duration:.45,stagger:.05,ease:"power3.out"},"-=.7");
}
document.getElementById("flPrev").addEventListener("click",function(){goFl(fi-1,-1);});
document.getElementById("flNext").addEventListener("click",function(){goFl(fi+1,1);});
(function(){var v=document.getElementById("flVisual"),sx=0,sy=0,on=false;v.addEventListener("touchstart",function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;on=true;},{passive:true});v.addEventListener("touchend",function(e){if(!on)return;on=false;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){goFl(fi+(dx<0?1:-1),dx<0?1:-1);}},{passive:true});})();


/* ---------- builder ---------- */
var CONE=4,TOP={none:{n:"None",p:0},sprinkles:{n:"Sprinkles",p:2},pistachio:{n:"Crushed pistachio",p:3}};
var pick={s1:0,s2:2,t:"none"};
var bS1=document.getElementById("bS1"),bS2=document.getElementById("bS2"),bSpr=document.getElementById("bSpr"),bNut=document.getElementById("bNut"),totalEl=document.getElementById("total");
var TOPEL={sprinkles:bSpr,pistachio:bNut};
function chips(id,key){var box=document.getElementById(id);FL.forEach(function(f,i){var b=document.createElement("button");b.type="button";b.className="chip";b.setAttribute("aria-pressed",pick[key]===i?"true":"false");b.innerHTML='<img src="img/icon-'+f.k+'.webp" alt="" width="72" height="44"><span>'+f.s+'</span>';b.addEventListener("click",function(){if(pick[key]===i)return;pick[key]=i;[].forEach.call(box.children,function(c,j){c.setAttribute("aria-pressed",j===i?"true":"false");});update(key);});box.appendChild(b);});}
chips("c1","s1");chips("c2","s2");
(function(){var box=document.getElementById("c3");Object.keys(TOP).forEach(function(k){var b=document.createElement("button");b.type="button";b.className="chip";b.setAttribute("aria-pressed",pick.t===k?"true":"false");b.innerHTML="<span>"+TOP[k].n+(TOP[k].p?" +"+TOP[k].p:"")+"</span>";b.addEventListener("click",function(){if(pick.t===k)return;pick.t=k;[].forEach.call(box.children,function(c){c.setAttribute("aria-pressed",c===b?"true":"false");});update("t");});box.appendChild(b);});})();
/* swap a photo layer: the new layer is a clone on top of the old one, so nothing ever flashes */
function swap(el,src,anim){if(el.getAttribute("src")===src)return el;var n=el.cloneNode(false);n.src=src;n.removeAttribute("id");el.parentNode.insertBefore(n,el.nextSibling);
  var done=function(){if(el.parentNode)el.parentNode.removeChild(el);};
  if(!hasG){done();return n;}
  if(anim==="drop"){gsap.fromTo(n,{yPercent:-70,opacity:0},{yPercent:0,opacity:1,duration:.75,ease:"bounce.out"});gsap.to(el,{opacity:0,duration:.25,delay:.15,onComplete:done});}
  else{gsap.fromTo(n,{opacity:0,scaleY:.94,transformOrigin:"50% 100%"},{opacity:1,scaleY:1,duration:.45,ease:"power2.out",onComplete:done});}
  return n;}
function showTops(drop){Object.keys(TOPEL).forEach(function(k){var on=pick.t===k,el=TOPEL[k];
  if(!hasG){el.style.opacity=on?1:0;return;}
  gsap.killTweensOf(el);
  if(on){gsap.fromTo(el,{opacity:0,yPercent:drop?-70:-8},{opacity:1,yPercent:0,duration:drop?.75:.5,ease:drop?"bounce.out":"power2.out"});}
  else{gsap.to(el,{opacity:0,duration:.25});}
});}
function update(what){var f1=FL[pick.s1],f2=FL[pick.s2];
  document.getElementById("l1").textContent=f1.name;document.getElementById("l2").textContent=f2.name;
  if(what==="s1"||what==="init"){var n1=swap(bS1,"img/b-"+f1.k+".webp","fade");if(n1!==bS1){n1.id="bS1";bS1=n1;}}
  if(what==="s2"||what==="init"){var n2=swap(bS2,"img/t-"+f2.k+".webp","drop");if(n2!==bS2){n2.id="bS2";bS2=n2;}}
  var tot=CONE+f1.price+f2.price+TOP[pick.t].p;totalEl.textContent="SAR "+tot;
  if(hasG&&what!=="init")gsap.fromTo(totalEl,{scale:1.18},{scale:1,duration:.4,ease:"back.out(3)"});
  if(what==="s2"&&hasG&&pick.t!=="none"){showTops(true);}
  if(what==="s2"&&hasG){gsap.fromTo(bS1,{scaleY:1},{scaleY:.96,yoyo:true,repeat:1,duration:.12,delay:.45,transformOrigin:"50% 100%"});}
  if(what==="t"||what==="init"){showTops(false);}
}
update("init");
var toast=document.getElementById("toast"),tt;
function say(m){toast.textContent=m;toast.classList.add("show");clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove("show");},2200);}
document.getElementById("orderBtn").addEventListener("click",function(){say("Added: "+FL[pick.s1].name+" + "+FL[pick.s2].name+" ("+totalEl.textContent+"). Demo only.");});
document.getElementById("flAdd").addEventListener("click",function(){pick.s1=fi;[].forEach.call(document.getElementById("c1").children,function(c,j){c.setAttribute("aria-pressed",j===fi?"true":"false");});update("s1");say(FL[fi].name+" set as scoop 1");document.getElementById("build").scrollIntoView({behavior:"smooth"});});

/* reveals */
if(hasG&&window.ScrollTrigger){
  gsap.utils.toArray(".fl-head, .build-head, .story-copy, .story-img, .menu-col, .visit-card").forEach(function(el){gsap.from(el,{y:40,opacity:0,duration:.8,ease:"power3.out",scrollTrigger:{trigger:el,start:"top 88%"}});});
}
})();
