(()=>{
const cv=document.getElementById('foam'),g=cv.getContext('2d');
const photo=document.querySelector('.photo'),heroTxt=document.getElementById('heroTxt'),reveal=document.getElementById('reveal'),cue=document.getElementById('cue');
const sec=document.querySelector('.spray');
let W=0,H=0,DPR=Math.min(devicePixelRatio,1.5);
function size(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;g.setTransform(DPR,0,0,DPR,0,0);draw(cur)}
// deterministic bubbles
let s=11;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};
const B=[];for(let i=0;i<260;i++)B.push({x:r(),y:r(),r:r(),d:r(),t:r()});
const mist=[];for(let i=0;i<120;i++)mist.push({a:r()*1.1-.55,v:r(),s:r()});
const sm=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t)},seg=(v,a,b)=>sm((v-a)/(b-a));
function nozzle(){return W<700?{x:W*.62,y:H*.58}:{x:W*.64,y:H*.42}}
function bubble(x,y,rad,al){if(rad<1)return;const gr=g.createRadialGradient(x-rad*.35,y-rad*.35,rad*.1,x,y,rad);gr.addColorStop(0,`rgba(255,255,255,${.95*al})`);gr.addColorStop(.6,`rgba(240,246,255,${.85*al})`);gr.addColorStop(.92,`rgba(205,220,240,${.9*al})`);gr.addColorStop(1,`rgba(170,195,230,${.55*al})`);g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();g.fillStyle=`rgba(255,255,255,${.9*al})`;g.beginPath();g.ellipse(x-rad*.38,y-rad*.42,rad*.18,rad*.1,-.6,0,7);g.fill()}
let cur=0;
function draw(p){g.clearRect(0,0,W,H);const N=nozzle();
 // spray mist: 0.08-0.4
 const ms=seg(p,.06,.22)*(1-seg(p,.42,.55));
 if(ms>0){for(const m of mist){const k=(m.v+p*3)%1;const dist=k*Math.max(W,H)*.45;const ang=Math.PI+m.a*.8;const x=N.x+Math.cos(ang)*dist,y=N.y+Math.sin(ang)*dist*.6;g.fillStyle=`rgba(255,255,255,${ms*(1-k)*.8})`;g.beginPath();g.arc(x,y,1+m.s*3+k*6,0,7);g.fill()}}
 // foam growth 0.15-0.62, clear 0.72-0.92
 const grow=seg(p,.14,.62),clear=seg(p,.72,.92);
 if(grow>0&&clear<1){const maxR=Math.max(W,H)*1.25;
  // white base fill once mostly covered
  const base=seg(p,.5,.64)*(1-clear);if(base>0){g.fillStyle=`rgba(247,250,255,${base})`;g.fillRect(0,0,W,H)}
  for(const b of B){const startT=b.d*.75;const k=sm((grow-startT)/(1-startT+.0001));if(k<=0)continue;
   const spread=maxR*Math.sqrt(b.r)*k;const ang=b.t*Math.PI*2;
   let x=N.x+Math.cos(ang)*spread,y=N.y+Math.sin(ang)*spread*.85;
   const pop=sm((clear-b.y*.6)/.4);const rad=(10+b.r*48+k*Math.min(W,H)*.085)*(1-pop)*(W<700?.8:1);
   y-=clear*H*.15*b.y;
   bubble(x,y,rad,1-pop)}
 }}
function apply(p){cur=p;
 const z=seg(p,.05,.6);const N=nozzle();photo.style.transformOrigin=`${N.x}px ${N.y}px`;photo.style.transform=`scale(${1+z*1.6})`;photo.style.opacity=String(1-seg(p,.62,.7));
 heroTxt.style.opacity=String(1-seg(p,.03,.14));heroTxt.style.transform=(innerWidth<600?'':'translateY(-44%) ')+`translateY(${-40*seg(p,.03,.14)}px)`;
 cue.style.opacity=String(1-seg(p,0,.05));
 reveal.style.opacity=String(seg(p,.74,.9));reveal.style.transform=`scale(${1.08-.08*seg(p,.74,.92)})`;
 draw(p)}
function prog(){const r=sec.getBoundingClientRect();return Math.min(1,Math.max(0,-r.top/(r.height-innerHeight)))}
let target=0,raf=0;
function tick(){raf=0;const d=target-cur;if(Math.abs(d)<.0005){apply(target);return}apply(cur+d*.18);raf=requestAnimationFrame(tick)}
addEventListener('scroll',()=>{target=prog();if(!raf)raf=requestAnimationFrame(tick)},{passive:true});
addEventListener('resize',()=>{size();apply(cur)});
size();target=prog();apply(target);
// nav
// reveal animations
if(window.gsap&&window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);
 gsap.utils.toArray('.cards article,.steps li,.pts li,.acc details,.sh,.dimg,.bl,.bf').forEach(el=>gsap.from(el,{y:40,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%'}}));
 gsap.fromTo('.feel img',{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{trigger:'.feel',start:'top bottom',end:'bottom top',scrub:true}});
 gsap.from('.feel-in>*',{y:40,opacity:0,stagger:.12,duration:.9,scrollTrigger:{trigger:'.feel',start:'top 60%'}});
}
// booking
const d=document.getElementById('date');const t=new Date(Date.now()+86400000);d.value=t.toISOString().slice(0,10);d.min=new Date().toISOString().slice(0,10);
const svc=document.getElementById('svc'),seg_=document.getElementById('size'),tot=document.getElementById('tot');let mult=1;
const upd=()=>{tot.textContent='SAR '+Math.round(+svc.value*mult/5)*5};
svc.addEventListener('change',upd);
seg_.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;seg_.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));mult={'Studio':.8,'2 bed':1,'3 bed':1.35,'Villa':1.9}[b.textContent];upd()});
document.getElementById('bf').addEventListener('submit',e=>{e.preventDefault();const f=e.target;const bad=[...f.querySelectorAll('input[required]')].find(i=>!i.value.trim());if(bad){bad.focus();return}document.getElementById('ok').hidden=false;f.querySelector('button[type=submit]').textContent='Booked'});
// accordion: one open at a time
document.querySelectorAll('#acc details').forEach(dt=>dt.addEventListener('toggle',()=>{if(dt.open)document.querySelectorAll('#acc details').forEach(o=>{if(o!==dt)o.open=false})}));
})();
