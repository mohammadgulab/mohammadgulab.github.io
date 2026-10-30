gsap.registerPlugin(ScrollTrigger);
const cv=document.getElementById('embers'),cx=cv.getContext('2d');let P=[],Wd,Ht,dpr=Math.min(2,window.devicePixelRatio||1);
function rs(){Wd=innerWidth;Ht=innerHeight;cv.width=Wd*dpr;cv.height=Ht*dpr;cx.setTransform(dpr,0,0,dpr,0,0)}rs();addEventListener('resize',rs);
const N=innerWidth<700?34:60;function mk(){return{x:Math.random()*Wd,y:Ht+Math.random()*Ht*.5,r:Math.random()*2.2+.6,v:Math.random()*.9+.4,s:Math.random()*Math.PI*2,a:Math.random()*.6+.3}}
for(let i=0;i<N;i++){const p=mk();p.y=Math.random()*Ht;P.push(p)}
(function tick(){cx.clearRect(0,0,Wd,Ht);for(const p of P){p.y-=p.v;p.s+=.02;p.x+=Math.sin(p.s)*.4;if(p.y<-10)Object.assign(p,mk());const g=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);g.addColorStop(0,`rgba(255,170,80,${p.a})`);g.addColorStop(1,'rgba(239,90,20,0)');cx.fillStyle=g;cx.beginPath();cx.arc(p.x,p.y,p.r*3,0,7);cx.fill()}requestAnimationFrame(tick)})();
document.getElementById('ob').addEventListener('click',()=>{document.getElementById('note').hidden=false});
gsap.fromTo('.hero .big span',{yPercent:60,opacity:0},{yPercent:0,opacity:1,stagger:.12,duration:.9,ease:'power3.out'});
gsap.to('.glow',{opacity:.5,scale:1.15,duration:1.6,repeat:-1,yoyo:true,ease:'sine.inOut'});
gsap.fromTo('.hero-img img',{scale:1},{scale:1.18,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
gsap.fromTo('.hero-txt',{y:0,opacity:1},{y:-80,opacity:0,ease:'none',scrollTrigger:{trigger:'.hero',start:'20% top',end:'bottom top',scrub:true}});
const C={xPercent:-50,yPercent:-50};
gsap.set('.ly',C);
const lt=gsap.timeline({scrollTrigger:{trigger:'.lstage',start:'top top',end:()=>'+='+innerHeight*2.6,pin:true,scrub:.6,invalidateOnRefresh:true}});
lt.fromTo('.meat',{scale:.5,rotation:-200,opacity:.4},{scale:1,rotation:0,opacity:1,duration:1.1,ease:'power2.out'},0)
 .fromTo(['.let','.tom','.oni'],{scale:.2,opacity:0,rotation:-90,top:'50%',left:'50%'},{scale:.55,opacity:1,rotation:0,duration:.4,stagger:.08},.9)
 .to('.let',{top:'10%',left:'38%',scale:1,duration:.7,ease:'power2.out'},1.3)
 .to('.tom',{top:'31%',left:'62%',scale:1,rotation:8,duration:.7,ease:'power2.out'},1.42)
 .to('.oni',{top:'50%',left:'36%',scale:1,rotation:-6,duration:.7,ease:'power2.out'},1.54)
 .to('.meat',{top:'78%',scale:.9,duration:.7,ease:'power2.out'},1.3)
 .fromTo('.t-let',{opacity:0,x:-10},{opacity:1,x:0,duration:.2},1.9).fromTo('.t-tom',{opacity:0,x:-10},{opacity:1,x:0,duration:.2},2).fromTo('.t-oni',{opacity:0,x:-10},{opacity:1,x:0,duration:.2},2.1).fromTo('.t-meat',{opacity:0,x:-10},{opacity:1,x:0,duration:.2},2.2)
 .to({},{duration:.5});
gsap.set('.t-let',{left:'62%',top:'8%'});gsap.set('.t-tom',{left:'2%',top:'30%'});gsap.set('.t-oni',{left:'56%',top:'49%'});gsap.set('.t-meat',{left:'50%',top:'97%',xPercent:-50});
gsap.set('.wrap',C);
const ct=gsap.timeline({scrollTrigger:{trigger:'.cstage',start:'top top',end:()=>'+='+innerHeight*1.6,pin:true,scrub:.6,invalidateOnRefresh:true}});
ct.fromTo('.wrap',{scale:.55,rotation:-25,y:140,opacity:.5},{scale:1,rotation:0,y:0,opacity:1,duration:1,ease:'power3.out'},0)
 .to('.ch',{yPercent:-60,duration:.8},.2).to({},{duration:.4});
gsap.fromTo('.lh span',{yPercent:40,opacity:0},{yPercent:0,opacity:1,stagger:.12,duration:.7,ease:'power3.out',scrollTrigger:{trigger:'.layers',start:'top 85%'}});
gsap.fromTo('.ch span',{yPercent:40,opacity:0},{yPercent:0,opacity:1,stagger:.12,duration:.7,ease:'power3.out',scrollTrigger:{trigger:'.crave',start:'top 80%'}});
gsap.utils.toArray('.items li,.info>div').forEach(el=>gsap.fromTo(el,{y:30,opacity:0},{y:0,opacity:1,duration:.6,scrollTrigger:{trigger:el,start:'top 90%'}}));
addEventListener('load',()=>ScrollTrigger.refresh());
