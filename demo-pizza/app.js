gsap.registerPlugin(ScrollTrigger);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const nav=$('.nav');
ScrollTrigger.create({trigger:'#menu',start:'top 60px',end:'bottom 60px',onToggle:s=>nav.classList.toggle('dark',s.isActive)});
// hero intro
gsap.from('.hero .ln',{yPercent:60,opacity:0,duration:1,stagger:.12,ease:'power3.out'});
gsap.from('.vine',{y:-200,opacity:0,duration:1.4,ease:'elastic.out(1,.6)'});
gsap.to('.vine',{yPercent:-25,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
// build: pinned choreography
gsap.set('#oven',{xPercent:-49,yPercent:-78,x:()=>window.innerWidth*.5+document.getElementById('oven').offsetWidth*.6,autoAlpha:1});
const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.stage',start:'top top',end:()=>'+='+Math.round(window.innerHeight*3.4),pin:true,scrub:.6,invalidateOnRefresh:true}});
tl.fromTo('.build-title span',{y:60,opacity:0},{y:0,opacity:1,stagger:.1,duration:.4})
  .fromTo('#base',{scale:.6,rotation:-40,opacity:0},{scale:1,rotation:0,opacity:1,duration:.5,ease:'back.out(1.6)'},'<');
const drops=[['.t1',-20],['.t2',25],['.t3',-15],['.b1',18],['.b2',-150],['.m1',0],['.m2',0],['.m3',0]];
drops.forEach(([s,r],i)=>{tl.fromTo(s,{y:()=>-window.innerHeight*.9,rotation:r+90,opacity:0},{y:0,rotation:r,opacity:1,duration:.32,ease:'bounce.out'},.45+i*.19)});
tl.to('.l1',{opacity:1,duration:.12},.75).to('.l2',{opacity:1,duration:.12},1.25).to('.l3',{opacity:1,duration:.12},1.8)
  .add(()=>{},2.1)
  .to('.lab',{opacity:0,duration:.15},2.2)
  .to('#buildSub',{opacity:0,duration:.1},2.2)
  .to('#baked',{opacity:1,duration:.35},2.25)
  .to('.ing,#base',{opacity:0,duration:.3},2.3)
  .set('#buildSub',{textContent:'Into the fire. 90 seconds at 450°C.'},2.5)
  .to('#buildSub',{opacity:1,duration:.15},2.55)
  .to('.build-title',{y:()=>-window.innerHeight*.06,opacity:.0,duration:.3},2.5)
  .to('#oven',{x:0,duration:.6,ease:'power2.out'},2.5)
  .to('#baked',{scaleX:.52,scaleY:.2,y:()=>$('.table').offsetHeight*.12,duration:.5,ease:'power2.inOut'},3.0)
  .to('#baked',{filter:'brightness(.75) drop-shadow(0 0 0 rgba(0,0,0,0))',duration:.3},3.3)
  .to('.glow',{opacity:1,duration:.3},3.3)
  .to('#oven',{scale:1.05,duration:.3,yoyo:true,repeat:1},3.5)
  .to({},{duration:.2});
// wild section
gsap.fromTo('#board',{rotation:-35,scale:.7,opacity:0},{rotation:15,scale:1,opacity:1,ease:'none',scrollTrigger:{trigger:'.board-wrap',start:'top 95%',end:'bottom 45%',scrub:.5}});
gsap.from('.wild-head .big span, .wild-head .big em',{y:80,opacity:0,stagger:.12,duration:.9,ease:'power3.out',scrollTrigger:{trigger:'.wild-head',start:'top 80%'}});
gsap.from('.card',{y:40,opacity:0,stagger:.1,duration:.6,ease:'power2.out',scrollTrigger:{trigger:'.menu',start:'top 85%'}});
// cart
const cart={};const fmt=n=>'SAR '+n;
function render(){const ul=$('#cart');const ks=Object.keys(cart).filter(k=>cart[k].q>0);let t=0;
 if(!ks.length){ul.innerHTML='<li class="empty">Tap “Add” on any pizza above.</li>';}
 else ul.innerHTML=ks.map(k=>{const c=cart[k];t+=c.q*c.p;return `<li><span>${k}</span><span class="qty"><button data-k="${k}" data-d="-1" aria-label="Less">−</button>${c.q}<button data-k="${k}" data-d="1" aria-label="More">+</button><b>${fmt(c.q*c.p)}</b></span></li>`}).join('');
 $('#tot').textContent=fmt(t);}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),1800)}
$$('.add').forEach(b=>b.addEventListener('click',()=>{const n=b.dataset.n;cart[n]=cart[n]||{q:0,p:+b.dataset.p};cart[n].q++;render();toast(n+' added');gsap.fromTo(b,{scale:.9},{scale:1,duration:.4,ease:'back.out(3)'})}));
$('#cart').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const c=cart[b.dataset.k];c.q=Math.max(0,c.q+ +b.dataset.d);render()});
$('#checkout').addEventListener('click',()=>{const t=$('#tot').textContent;if(t==='SAR 0'){toast('Add a pizza first');return}$('#note').textContent='Order received (demo). Your oven slot is booked, ready in about 20 minutes.';toast('Order placed (demo)')});
$('#pickup').addEventListener('click',()=>toast('Pickup slot held for 20 min (demo)'));
window.addEventListener('load',()=>ScrollTrigger.refresh());
