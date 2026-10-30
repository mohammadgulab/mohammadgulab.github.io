gsap.registerPlugin(ScrollTrigger);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
// 1. dirty to clean wipe
const meterBar=$('.meter span'),meterTxt=$('#meterTxt');
const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.wash .stage',start:'top top',end:()=>'+='+Math.round(innerHeight*2.2),pin:true,scrub:.5,
  onUpdate:s=>{const p=Math.min(1,Math.max(0,(s.progress-.12)/.76));meterBar.style.setProperty('--m',p);meterTxt.textContent=Math.round(p*100)+'% clean'}}});
tl.to({},{duration:.12})
  .fromTo('#clean',{clipPath:'inset(0% 100% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:.76},.12)
  .fromTo('#wipe',{left:'0%'},{left:'100%',duration:.76},.12)
  .fromTo('#mist',{'--mx':'0%',opacity:.9},{'--mx':'100%',opacity:.9,duration:.76},.12)
  .to('.t1',{opacity:0,y:-30,duration:.06},.14)
  .fromTo('.t2',{opacity:0,y:30},{opacity:1,y:0,duration:.06},.18)
  .to('.t2',{opacity:0,y:-30,duration:.06},.8)
  .fromTo('.t3',{opacity:0,y:30},{opacity:1,y:0,duration:.06},.86)
  .to('#wipe,#mist',{opacity:0,duration:.04},.88)
  .to({},{duration:.1});
gsap.from('.t1',{y:60,opacity:0,duration:1,ease:'power3.out',delay:.2});
// 2. look closer
const tl2=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.closer .stage',start:'top top',end:()=>'+='+Math.round(innerHeight*1.6),pin:true,scrub:.5}});
tl2.fromTo('#closeImg',{scale:1.6},{scale:1.05,duration:1})
  .fromTo('.c1',{opacity:0,y:40},{opacity:1,y:0,duration:.15},0)
  .fromTo('#sweep',{xPercent:-80},{xPercent:80,duration:.45},.15)
  .to('.c1',{opacity:0,y:-30,duration:.1},.5)
  .fromTo('.c2',{opacity:0,y:40},{opacity:1,y:0,duration:.12},.56)
  .fromTo('#sweep',{xPercent:-80},{xPercent:80,duration:.35,immediateRender:false},.6)
  .fromTo('#specs li',{opacity:0,y:20},{opacity:1,y:0,stagger:.06,duration:.12},.66);
// 3. keys back, jaw drops
const mm=gsap.matchMedia();
mm.add('(min-width:900px)',()=>{
  const t=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.reveal .stage',start:'top top',end:()=>'+='+Math.round(innerHeight*1.6),pin:true,scrub:.5}});
  t.fromTo('.slats',{scaleY:1},{scaleY:0,duration:.45})
   .fromTo('#light',{opacity:0},{opacity:1,duration:.45},0)
   .fromTo('#carLit',{filter:'brightness(.25) contrast(1.1)'},{filter:'brightness(1) contrast(1.05)',duration:.45},0)
   .fromTo('.k1',{opacity:0,y:50},{opacity:1,y:0,duration:.15},.3)
   .fromTo('.sub',{opacity:0},{opacity:1,duration:.1},.42)
   .fromTo('#panel',{xPercent:130,opacity:0},{xPercent:0,opacity:1,duration:.3,ease:'power2.out'},.5)
   .to({},{duration:.2});
});
mm.add('(max-width:899px)',()=>{
  const t=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.reveal .stage',start:'top 75%',end:'top 5%',scrub:.5}});
  t.fromTo('.slats',{scaleY:1},{scaleY:0})
   .fromTo('#carLit',{filter:'brightness(.25)'},{filter:'brightness(1)'},0)
   .fromTo('.k1',{opacity:0,y:40},{opacity:1,y:0},0);
  gsap.fromTo('#panel',{y:80,opacity:0},{y:0,opacity:1,duration:.7,ease:'power2.out',scrollTrigger:{trigger:'#panel',start:'top 92%'}});
});
// booking
const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];const dWrap=$('#dates');const now=new Date();
for(let i=1;i<=7;i++){const d=new Date(now);d.setDate(now.getDate()+i);const b=document.createElement('button');b.type='button';b.className='chip date'+(i===1?' on':'');b.dataset.d=days[d.getDay()]+' '+d.getDate();b.innerHTML=`<small>${days[d.getDay()].toUpperCase()}</small>${d.getDate()}`;dWrap.appendChild(b)}
function single(wrap){wrap.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...wrap.children].forEach(c=>c.classList.remove('on'));b.classList.add('on');upd()})}
single($('#pkgs'));single(dWrap);single($('#times'));
function sel(){const p=$('#pkgs .on'),d=$('#dates .on'),t=$('#times .on');return{p:p.dataset.p,v:+p.dataset.v,d:d.dataset.d,t:t.textContent}}
function upd(){$('#price').textContent='SAR '+sel().v.toLocaleString('en-US')}
const card=$('#confirmCard');
$('#confirm').addEventListener('click',()=>{const s=sel();$('#confText').textContent=`${s.p} · ${s.d} · ${s.t} · SAR ${s.v.toLocaleString('en-US')}`;$('#ref').textContent='OBS-'+(1000+Math.floor(Math.random()*8999));
  card.classList.add('on');gsap.to('#panel',{opacity:.25,duration:.3});gsap.fromTo(card,{opacity:0,scale:.85},{opacity:1,scale:1,duration:.5,ease:'back.out(1.8)'});gsap.fromTo('.tick',{scale:0,rotation:-90},{scale:1,rotation:0,duration:.6,delay:.15,ease:'back.out(2.5)'})});
$('#again').addEventListener('click',()=>{gsap.to(card,{opacity:0,scale:.9,duration:.25,onComplete:()=>card.classList.remove('on')});gsap.to('#panel',{opacity:1,duration:.3})});
window.addEventListener('load',()=>ScrollTrigger.refresh());
