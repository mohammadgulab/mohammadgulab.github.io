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
FL.forEach(function(f){var im=new Image();im.src="img/cone-"+f.k+".webp";});
function paint(i){var f=FL[i];flSec.style.setProperty("--bg",f.bg);flSec.style.setProperty("--fg",f.fg);flName.textContent=f.name;flNotes.textContent=f.notes;flPrice.textContent="SAR "+f.price;flIdx.textContent=String(i+1).padStart(2,"0")+" / 06";flBig.textContent=f.big;fitBig();flScoop.src="img/cone-"+f.k+".webp";flScoop.alt=f.name+" gelato in a waffle cone";[].forEach.call(dots.children,function(d,j){d.setAttribute("aria-selected",j===i?"true":"false");});}
function fitBig(){var w=Math.min(window.innerWidth,1400)*0.9;flBig.style.fontSize=Math.min(w/(flBig.textContent.length*0.72),190)+"px";}
fitBig();window.addEventListener("resize",fitBig);
function goFl(i,dir){i=(i+FL.length)%FL.length;if(i===fi||busy)return;dir=dir||(i>fi?1:-1);fi=i;
  if(!hasG){paint(i);return;}
  busy=true;
  gsap.timeline({onComplete:function(){busy=false;}})
   .to(flScoop,{x:-dir*70,rotation:-dir*7,opacity:0,duration:.32,ease:"power2.in"})
   .to([flName,flNotes,flBig],{y:-12,opacity:0,duration:.2,stagger:.03},"<")
   .add(function(){paint(i);})
   .fromTo(flScoop,{x:dir*90,y:24,rotation:dir*8,opacity:0},{x:0,y:0,rotation:0,opacity:1,duration:.75,ease:"back.out(1.5)"})
   .fromTo([flName,flNotes,flBig],{y:16,opacity:0},{y:0,opacity:function(k){return k===2?.13:1;},duration:.45,stagger:.05,ease:"power3.out"},"-=.7");
}
document.getElementById("flPrev").addEventListener("click",function(){goFl(fi-1,-1);});
document.getElementById("flNext").addEventListener("click",function(){goFl(fi+1,1);});
(function(){var v=document.getElementById("flVisual"),sx=0,sy=0,on=false;v.addEventListener("touchstart",function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;on=true;},{passive:true});v.addEventListener("touchend",function(e){if(!on)return;on=false;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){goFl(fi+(dx<0?1:-1),dx<0?1:-1);}},{passive:true});})();


/* ---------- builder ---------- */
var CONE=4,TOP={none:{n:"None",p:0},wafer:{n:"Wafer fan",p:3},sprinkles:{n:"Sprinkles",p:2}};
var pick={s1:0,s2:2,t:"none"};
var bS1=document.getElementById("bS1"),bS2=document.getElementById("bS2"),bW=document.getElementById("bWafer"),bSp=document.getElementById("bSprinkles"),totalEl=document.getElementById("total");
var spc=["#ff5d8f","#ffd23f","#3bceac","#5aa9ff","#ff8c42","#ffffff"];
for(var q=0;q<26;q++){var sp=document.createElement("i");var a=Math.random()*Math.PI,r=Math.random();sp.style.left=(50+Math.cos(a)*44*r).toFixed(1)+"%";sp.style.top=(30+Math.sin(a)*40*r).toFixed(1)+"%";sp.style.background=spc[q%spc.length];sp.style.transform="rotate("+Math.round(Math.random()*180)+"deg)";bSp.appendChild(sp);}
function chips(id,key){var box=document.getElementById(id);FL.forEach(function(f,i){var b=document.createElement("button");b.type="button";b.className="chip";b.setAttribute("aria-pressed",pick[key]===i?"true":"false");b.innerHTML='<img src="img/'+f.k+'.webp" alt="" width="36" height="36"><span>'+f.s+'</span>';b.addEventListener("click",function(){pick[key]=i;[].forEach.call(box.children,function(c,j){c.setAttribute("aria-pressed",j===i?"true":"false");});update(key);});box.appendChild(b);});}
chips("c1","s1");chips("c2","s2");
(function(){var box=document.getElementById("c3");Object.keys(TOP).forEach(function(k){var b=document.createElement("button");b.type="button";b.className="chip";b.setAttribute("aria-pressed",pick.t===k?"true":"false");b.innerHTML="<span>"+TOP[k].n+(TOP[k].p?" +"+TOP[k].p:"")+"</span>";b.addEventListener("click",function(){pick.t=k;[].forEach.call(box.children,function(c){c.setAttribute("aria-pressed",c===b?"true":"false");});update("t");});box.appendChild(b);});})();
function layout(){var f1=FL[pick.s1],f2=FL[pick.s2];var w1=150,h1=w1*f1.h/f1.w,w2=138,h2=w2*f2.h/f2.w;var base=228;bS1.style.width=w1+"px";bS1.style.bottom=base+"px";var b2=base+h1*0.62;bS2.style.width=w2+"px";bS2.style.bottom=b2+"px";var top=b2+h2;bW.style.bottom=(top-34)+"px";bSp.style.bottom=(top-58)+"px";}
function update(what){var f1=FL[pick.s1],f2=FL[pick.s2];bS1.src="img/"+f1.k+".webp";bS2.src="img/"+f2.k+".webp";document.getElementById("l1").textContent=f1.name;document.getElementById("l2").textContent=f2.name;layout();
  var tot=CONE+f1.price+f2.price+TOP[pick.t].p;totalEl.textContent="SAR "+tot;
  if(!hasG){bW.style.opacity=pick.t==="wafer"?1:0;bSp.style.opacity=pick.t==="sprinkles"?1:0;return;}
  gsap.fromTo(totalEl,{scale:1.18},{scale:1,duration:.4,ease:"back.out(3)"});
  if(what==="s1"){gsap.fromTo(bS1,{y:-220,opacity:0},{y:0,opacity:1,duration:.8,ease:"bounce.out"});gsap.fromTo(bS2,{y:0},{y:-18,yoyo:true,repeat:1,duration:.16,delay:.45});}
  if(what==="s2"){gsap.fromTo(bS2,{y:-220,opacity:0},{y:0,opacity:1,duration:.8,ease:"bounce.out"});gsap.fromTo(bS1,{scaleY:1},{scaleY:.9,yoyo:true,repeat:1,duration:.12,delay:.5,transformOrigin:"50% 100%"});}
  if(what==="t"||what==="init"){gsap.to(bW,{opacity:pick.t==="wafer"?1:0,y:pick.t==="wafer"?0:-60,duration:.5,ease:"back.out(2)"});gsap.to(bSp,{opacity:pick.t==="sprinkles"?1:0,duration:.3});if(pick.t==="sprinkles")gsap.fromTo(bSp.children,{y:-90,opacity:0},{y:0,opacity:1,duration:.6,stagger:.015,ease:"bounce.out"});}
}
if(hasG)gsap.set(bW,{rotation:14});
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
