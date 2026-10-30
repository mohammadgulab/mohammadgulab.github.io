(function(){
document.documentElement.classList.remove('no-js');
var LAYERS=[
 // key, name, desc, overlap fraction of own height used when assembled (how much it sinks into the layer below)
 {k:'bun-top',  n:'Brioche crown', d:'Toasted brioche, baked fresh every morning'},
 {k:'lettuce',  n:'Crisp lettuce',  d:'Cold, crunchy, hand torn'},
 {k:'tomato',   n:'Vine tomato',    d:'Thick slices with a pinch of salt'},
 {k:'cheese',   n:'Aged cheddar',   d:'Melted right on the grill'},
 {k:'patty',    n:'Smash patty',    d:'Fresh beef, smashed hard for a deep crust'},
 {k:'bun-base', n:'House sauce',    d:'Our secret sauce on a toasted base'}
];
var CFG=window.STACK_CFG||{};
var burger=document.getElementById('burger'), labels=document.getElementById('labels');
var els=[], lbls=[];
LAYERS.forEach(function(L,i){
  var d=document.createElement('div'); d.className='layer'; d.style.zIndex=20-i;
  var im=new Image(); im.src='img/'+L.k+'.webp'; im.alt=L.n; im.decoding='async';
  d.appendChild(im); burger.appendChild(d); els.push({el:d,img:im,cfg:L});
  var l=document.createElement('div'); l.className='lbl';
  l.innerHTML='<span class="dot"></span><span class="ln"></span><span class="tx"><span class="nm">'+L.n+'</span><span class="ds">'+L.d+'</span></span>';
  labels.appendChild(l); lbls.push(l);
});
var shadow=burger.querySelector('.shadow');
var DIM={"bun-top": {"w": 900, "h": 347, "ov": 0.2}, "lettuce": {"w": 900, "h": 226, "ov": 0.62}, "tomato": {"w": 900, "h": 221, "ov": 0.55}, "cheese": {"w": 900, "h": 273, "ov": 0.62}, "patty": {"w": 900, "h": 275, "ov": 0.28}, "bun-base": {"w": 900, "h": 359, "ov": 0}}; // natural sizes + assembled overlap tuned per image

function geo(){
  var vw=innerWidth, vh=document.querySelector('.stage-inner').clientHeight;
  var mobile=vw<700;
  var ratio=els.map(function(o){var dm=DIM[o.cfg.k]; return dm? dm.h/dm.w : 0.3;});
  var ov=els.map(function(o){var dm=DIM[o.cfg.k]; return dm?dm.ov:0.3;});
  var sumR=ratio.reduce(function(s,h){return s+h},0);
  var a=vh*(mobile?0.12:0.13), b=vh*(mobile?0.84:0.93);
  var minGap=mobile?10:22;
  var bw=Math.min(mobile?vw*0.62:vw*0.3, mobile?300:460, (b-a-minGap*(els.length-1))/sumR);
  burger.style.setProperty('--bw',bw+'px');
  var hs=ratio.map(function(r){return bw*r});
  var total=0; for(var i=0;i<hs.length;i++){ total+= hs[i]*(i===hs.length-1?1:(1-ov[i])); }
  var asmCenter=vh*0.5, top=asmCenter-total/2, asm=[], y=top;
  for(i=0;i<hs.length;i++){ asm.push(y); y+=hs[i]*(1-ov[i]); }
  var sumH=hs.reduce(function(s,h){return s+h},0);
  var gap=Math.max(minGap,(b-a-sumH)/(hs.length-1));
  var exp=[]; y=a+Math.max(0,((b-a)-(sumH+gap*(hs.length-1)))/2); for(i=0;i<hs.length;i++){ exp.push(y); y+=hs[i]+gap; }
  var bottom=asm[hs.length-1]+hs[hs.length-1];
  // scales for hero / grow / final, by height and width limits
  var sHero=Math.min(vh*(mobile?0.42:0.5)/total, vw*(mobile?0.78:0.4)/bw);
  var sGrow=Math.min(vh*(mobile?0.5:0.7)/total, vw*(mobile?0.86:0.36)/bw);
  var sFinal=Math.min(vh*(mobile?0.4:0.44)/total, vw*(mobile?0.75:0.4)/bw);
  var heroY=vh*(mobile?0.66:0.68)-asmCenter, finalY=vh*(mobile?0.36:0.38)-asmCenter;
  return {vw:vw,vh:vh,mobile:mobile,bw:bw,hs:hs,asm:asm,exp:exp,bottom:bottom,total:total,asmCenter:asmCenter,sHero:sHero,sGrow:sGrow,sFinal:sFinal,heroY:heroY,finalY:finalY};
}
var G=geo();
var xShift=function(){return G.mobile? -G.vw*0.16 : -G.vw*0.06;};

function placeLabels(){
  var bx=G.vw/2+xShift();
  lbls.forEach(function(l,i){
    var left=false;
    l.classList.toggle('left',left);
    var cy=G.exp[i]+G.hs[i]/2;
    var lineW=G.mobile? Math.max(16,G.bw*0.12) : G.bw*0.18+Math.min(90,G.vw*0.05);
    var startX= left ? (bx - G.bw*0.5 - 10) : (bx + G.bw*0.5 + 10);
    startX=bx+G.bw*0.36;
    var maxW = left ? startX-12 : (G.vw-startX-12);
    l.style.width=Math.min(maxW, G.mobile?999:360)+'px';
    l.querySelector('.ln').style.width=lineW+'px';
    l.style.top=cy+'px';
    if(left){ l.style.left='auto'; l.style.right=(G.vw-startX)+'px'; }
    else { l.style.right='auto'; l.style.left=startX+'px'; }
    l.style.transform='translateY(-50%)';
  });
}

function setAsm(){
  els.forEach(function(o,i){ gsap.set(o.el,{y:G.asm[i],x:0,rotation:0}); });
  gsap.set(shadow,{y:G.bottom-20,opacity:1});
  gsap.set(burger,{transformOrigin:'50% '+G.asmCenter+'px'});
}
setAsm(); placeLabels();

gsap.registerPlugin(ScrollTrigger);
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var nav=document.getElementById('nav');

var tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#stack',start:'top top',end:function(){return '+='+(innerHeight*(G.mobile?4.2:4.6))},scrub:reduce?true:0.7,pin:true,anticipatePin:1,invalidateOnRefresh:true,
  onUpdate:function(st){ if(st.isActive) nav.classList.toggle('on-light',st.progress>0.36); }, onLeave:function(){nav.classList.remove('on-light')}, onLeaveBack:function(){nav.classList.remove('on-light')}
}});
// 0 -> 1 : hero copy out, burger grows, side text in
tl.to('.hero-copy',{y:-60,opacity:0,duration:1},0)
  .to('.scroll-hint',{opacity:0,duration:.4},0)
  .fromTo(burger,{scale:function(){return G.sHero},y:function(){return G.heroY},x:0},{scale:function(){return G.sGrow},y:0,x:0,duration:1.2,immediateRender:true},0)
  .to('.glow',{opacity:1.3,duration:1},0)
  .fromTo('.side-l',{x:-40,opacity:0},{x:0,opacity:1,duration:.6},.5)
  .fromTo('.side-r',{x:40,opacity:0},{x:0,opacity:1,duration:.6},.6)
// 1.4 -> 2.2 : background to light, sides out, explode
  .to('.side',{opacity:0,y:-30,duration:.5},1.5)
  .to('.bg-light',{opacity:1,duration:.8},1.6)
  .to('.glow',{opacity:0,duration:.6},1.6)
  .to(burger,{scale:1,y:0,x:xShift,duration:1.2,ease:'power1.inOut'},1.7);
els.forEach(function(o,i){
  var mid=(els.length-1)/2, dir=i-mid;
  tl.to(o.el,{y:function(){return G.exp[i]},rotation:function(){return G.mobile?0:(i%2?-3:3)},duration:1.4,ease:'power2.inOut'},1.75+Math.abs(dir)*0.04);
});
tl.to(shadow,{opacity:0.25,y:function(){return G.exp[els.length-1]+G.hs[els.length-1]-14},duration:1.4,ease:'power2.inOut'},1.75);
lbls.forEach(function(l,i){
  tl.fromTo(l,{opacity:0,x:G.mobile?10:(l.classList.contains('left')?-20:20)},{opacity:1,x:0,duration:.45},2.75+i*0.09)
    .fromTo(l.querySelector('.ln'),{scaleX:0},{scaleX:1,duration:.4},2.75+i*0.09);
});
tl.fromTo('.stack-word',{opacity:0,y:60},{opacity:1,y:0,duration:.8},2.9)
// hold
  .to({},{duration:.9},3.6)
// 4.5 -> 5.7 : reassemble
  .to(lbls,{opacity:0,duration:.4,stagger:.04},4.5)
  .to('.stack-word',{opacity:0,y:-40,duration:.5},4.55);
els.forEach(function(o,i){
  tl.to(o.el,{y:function(){return G.asm[i]},rotation:0,duration:1.2,ease:'power3.inOut'},4.6+(els.length-1-i)*0.03);
});
tl.to(burger,{x:0,y:function(){return G.finalY},scale:function(){return G.sFinal},duration:1.2,ease:'power3.inOut'},4.6)
  .to(shadow,{opacity:1,y:function(){return G.bottom-20},duration:1.2,ease:'power3.inOut'},4.6)
  .fromTo('.final-copy',{opacity:0,y:40},{opacity:1,y:0,duration:.7},5.5)
  .to({},{duration:.5},6.2);

ScrollTrigger.addEventListener('refreshInit',function(){ G=geo(); setAsm(); placeLabels(); });

// reveals
gsap.utils.toArray('.reveal').forEach(function(el){
  gsap.to(el,{opacity:1,y:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 85%'}});
});
ScrollTrigger.create({trigger:'#process',start:'top 60',end:'max',onToggle:function(s){if(s.isActive)nav.classList.remove('on-light')},onEnter:function(){nav.classList.remove('on-light')},onEnterBack:function(){nav.classList.remove('on-light')}});
// process: parallax + counters
gsap.utils.toArray('.chap').forEach(function(ch){
  gsap.fromTo(ch.querySelector('.chap-bg'),{yPercent:-6,scale:1.12},{yPercent:6,scale:1,ease:'none',scrollTrigger:{trigger:ch,start:'top bottom',end:'bottom top',scrub:true}});
  var tl2=gsap.timeline({scrollTrigger:{trigger:ch,start:'top 65%'}});
  tl2.from(ch.querySelector('.mono'),{opacity:0,x:-20,duration:.5}).from(ch.querySelector('h3'),{opacity:0,y:60,letterSpacing:'.3em',duration:1.1,ease:'power3.out'},'-=.2').from(ch.querySelector('.chap-sub'),{opacity:0,y:20,duration:.6},'-=.6').from(ch.querySelectorAll('.specs div'),{opacity:0,y:20,stagger:.1,duration:.5},'-=.3');
  ch.querySelectorAll('.specs b').forEach(function(b){var n=+b.dataset.n,s=b.dataset.s||'',o={v:0};
    ScrollTrigger.create({trigger:ch,start:'top 60%',once:true,onEnter:function(){gsap.to(o,{v:n,duration:1.6,ease:'power2.out',onUpdate:function(){b.innerHTML=Math.round(o.v)+s}})}}); b.innerHTML='0'+s;});
});
gsap.utils.toArray('.ingr-grid figure, .timeline li').forEach(function(el,i){gsap.from(el,{opacity:0,y:40,duration:.8,delay:(i%3)*.08,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%'}})});

// nav solid after hero
var onS=function(){nav.classList.toggle('solid',scrollY>80)};addEventListener('scroll',onS,{passive:true});onS();

// MENU
var MENU=[
 {k:'classic',f:'burger',t:'Best seller',n:'Stackhouse Classic',d:'Smash patty, aged cheddar, lettuce, tomato and house sauce on brioche.',p:32},
 {k:'double',f:'burger',t:'Big appetite',n:'Double Smash',d:'Two crispy edged patties, double cheddar and house sauce.',p:42},
 {k:'triple',f:'burger',t:'Go big',n:'Triple Stack',d:'Three patties, three slices of cheddar, crisp lettuce. Bring a friend.',p:54},
 {k:'garden',f:'burger',t:'Meat free',n:'Garden Stack',d:'Double lettuce, double vine tomato and house sauce on toasted brioche.',p:26}
];
var cards=document.getElementById('cards');
cards.innerHTML=MENU.map(function(m){return '<article class="card reveal" data-f="'+m.f+'"><div class="card-img"><img src="img/m-'+m.k+'.webp" alt="'+m.n+'" loading="lazy" width="600" height="450"></div><span class="tag">'+m.t+'</span><h3>'+m.n+'</h3><p>'+m.d+'</p><div class="card-foot"><span class="price">SAR '+m.p+'</span><button class="btn add" data-name="'+m.n+'" data-price="'+m.p+'">Add</button></div></article>';}).join('');
gsap.utils.toArray('#cards .card').forEach(function(el,i){
  gsap.to(el,{opacity:1,y:0,duration:.8,delay:(i%3)*0.08,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%'}});
});
document.querySelectorAll('.tab').forEach(function(b){b.addEventListener('click',function(){
  document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('is-on',x===b)});
  var f=b.dataset.f; document.querySelectorAll('#cards .card').forEach(function(c){c.classList.toggle('hide',f!=='all'&&c.dataset.f!==f); gsap.set(c,{opacity:1,y:0});});
  ScrollTrigger.refresh();
});});
var count=0,total=0,cc=document.getElementById('cartCount'),toast=document.getElementById('toast'),tt;
document.addEventListener('click',function(e){var b=e.target.closest('.add'); if(!b)return;
  count++; total+=+b.dataset.price; cc.textContent=count; cc.classList.remove('bump'); void cc.offsetWidth; cc.classList.add('bump');
  toast.textContent=b.dataset.name+' added. Order total SAR '+total+' (demo)'; toast.classList.add('show'); clearTimeout(tt); tt=setTimeout(function(){toast.classList.remove('show')},2200);
});
window.addEventListener('load',function(){ScrollTrigger.refresh()});
})();
