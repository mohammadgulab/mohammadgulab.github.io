(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const root=document.documentElement;
// menu
const btn=$('#menuBtn'),mn=$('#mnav');
const setMenu=o=>{document.body.classList.toggle('menu-open',o);btn.setAttribute('aria-expanded',o);btn.setAttribute('aria-label',o?'Close menu':'Open menu');mn.setAttribute('aria-hidden',!o);document.body.style.overflow=o?'hidden':''};
btn.addEventListener('click',()=>setMenu(!document.body.classList.contains('menu-open')));
$$('#mnav a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
// header
const hdr=$('.hdr');const onS=()=>hdr.classList.toggle('solid',scrollY>30);addEventListener('scroll',onS,{passive:true});onS();
// toast
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),3200)};

// road marker
const path=$('#roadPath'),wrap=$('.road-wrap'),mk=$('#truckMk'),pl=$('#pulse');
const L=path.getTotalLength(),draw=$('#roadDraw');
draw.style.strokeDasharray=L;draw.style.strokeDashoffset=L;
function place(el,t,rot){const p=path.getPointAtLength(L*t),q=path.getPointAtLength(Math.min(L,L*t+2)),w=wrap.clientWidth/400,h=wrap.clientHeight/760;
  const x=p.x*w,y=p.y*h;let tr=`translate(${x}px,${y}px)`;if(rot){const a=Math.atan2((q.y-p.y)*h,(q.x-p.x)*w)*180/Math.PI-90;tr+=` rotate(${a+180}deg)`}el.style.transform=tr}
let roadP=0;
function roadAt(p){roadP=p;place(mk,Math.max(0,Math.min(1,p)),true);draw.style.strokeDashoffset=L*(1-p)}
roadAt(0);
let t0=performance.now();
(function loop(now){const t=((now-t0)/6000)%1;place(pl,t,false);requestAnimationFrame(loop)})(t0);
addEventListener('resize',()=>roadAt(roadP));

// tracking
const DATA={
 'QF-24816':{route:'JED → RUH',sub:'Road · full truck · 18 pallets',badge:'On the road',pct:68,steps:[['Picked up','Al Khumrah, Jeddah · Mon 08:40','done'],['Loaded & sealed','Seal QF-7731 · Mon 10:15','done'],['Departed Jeddah','Highway 40 · Mon 11:02','done'],['Near Al Quwaiyah','Live position · Tue 06:30','now'],['Delivery, Riyadh','Al Sulay warehouse · ETA Tue 14:00','']]},
 'QF-31057':{route:'JED → NSA',sub:'Ocean · LCL · 6.4 CBM',badge:'At sea',pct:45,steps:[['Cargo received','Port desk, Jeddah · 12 Oct','done'],['Export customs cleared','Jeddah Islamic Port · 14 Oct','done'],['Sailed','Red Sea · 16 Oct','now'],['Arrival, Nhava Sheva','ETA 27 Oct',''],['Delivered','Consignee warehouse','']]},
 'QF-40990':{route:'JED → DXB',sub:'Road · cross-border · 22 t',badge:'Delivered',pct:100,steps:[['Picked up','Jeddah · 3 Oct','done'],['Saudi exit customs','Al Batha · 5 Oct','done'],['UAE entry customs','Ghuwaifat · 5 Oct','done'],['Out for delivery','Jebel Ali · 6 Oct','done'],['Delivered & signed','Signed by M. Rahman · 6 Oct 15:20','done']]}
};
const out=$('#trkOut');
function track(id){id=(id||'').trim().toUpperCase().replace(/\s+/g,'');if(/^QF\d/.test(id))id='QF-'+id.slice(2);
 const d=DATA[id];if(!d){out.innerHTML=`<p class="tr-err">No shipment found for “${id.replace(/[<>&"]/g,'')||'blank'}”. This demo has three sample numbers, tap one above.</p>`;return}
 out.innerHTML=`<div class="tr-head"><div class="tr-route">${d.route}<small>${id} · ${d.sub}</small></div><span class="tr-badge">${d.badge}</span></div><div class="tr-bar"><i></i></div><ol class="tr-list">${d.steps.map(s=>`<li class="${s[2]}"><span class="k"></span><div><b>${s[0]}</b><span>${s[1]}</span></div></li>`).join('')}</ol>`;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{out.querySelector('.tr-bar i').style.width=d.pct+'%';out.querySelectorAll('li').forEach((li,i)=>setTimeout(()=>li.classList.add('in'),120*i))}));
}
$('#trackForm').addEventListener('submit',e=>{e.preventDefault();track($('#trk').value)});
$$('.samples button').forEach(b=>b.addEventListener('click',()=>{$('#trk').value=b.dataset.id;track(b.dataset.id)}));
track('QF-24816');

// quote
$('#quoteForm').addEventListener('submit',e=>{e.preventDefault();const f=e.target;const miss=[...f.querySelectorAll('[required]')].filter(i=>!i.value.trim());
 if(miss.length){miss[0].focus();$('#qfMsg').style.color='#b3261e';$('#qfMsg').textContent='Please fill in '+miss.map(i=>i.closest('label').firstChild.textContent.trim()).join(', ')+'.';return}
 $('#qfMsg').style.color='';$('#qfMsg').textContent='Thanks! This is a demo, so nothing was sent.';toast('Quote request received (demo)');});

// GSAP motion
if(!window.gsap||matchMedia('(prefers-reduced-motion: reduce)').matches){roadAt(.5);return}
gsap.registerPlugin(ScrollTrigger);
gsap.from('.h1 .line>span',{yPercent:110,duration:1.1,ease:'power4.out',stagger:.14,delay:.1});
gsap.from('.hero .eyebrow,.hero .lead,.hero .ctas',{y:24,opacity:0,duration:.9,ease:'power3.out',stagger:.1,delay:.35});
gsap.from('.hero-media',{clipPath:'inset(18% 10% 0% 10% round 22px)',duration:1.4,ease:'power3.out',delay:.3});
gsap.fromTo('.hero-media img',{scale:1.12,xPercent:-4},{scale:1.0,xPercent:3,ease:'none',scrollTrigger:{trigger:'.hero-media',start:'top bottom',end:'bottom top',scrub:true}});
gsap.from('.facts>div',{y:30,opacity:0,stagger:.12,duration:.8,ease:'power3.out',scrollTrigger:{trigger:'.facts',start:'top 92%'}});
gsap.fromTo('.ghost span',{xPercent:0},{xPercent:-45,ease:'none',scrollTrigger:{trigger:'#services',start:'top bottom',end:'bottom top',scrub:true}});
gsap.from('#services .h2',{y:50,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:'#services .h2',start:'top 88%'}});
$$('.svc').forEach(c=>{gsap.from(c,{y:60,opacity:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:c,start:'top 90%'}});
 gsap.fromTo(c.querySelector('img'),{yPercent:-8},{yPercent:4,ease:'none',scrollTrigger:{trigger:c,start:'top bottom',end:'bottom top',scrub:true}})});
ScrollTrigger.create({trigger:'.road-wrap',start:'top 70%',end:'bottom 60%',scrub:.6,onUpdate:s=>roadAt(s.progress)});
$$('.st').forEach((s,i)=>gsap.from(s,{x:i%2?-50:50,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:s,start:'top 85%'}}));
gsap.from('.track-card',{y:60,scale:.96,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:'.track-card',start:'top 90%'}});
gsap.fromTo('.ship-wrap .ship',{y:220},{y:-160,ease:'none',scrollTrigger:{trigger:'#ocean',start:'top bottom',end:'bottom top',scrub:true}});
$$('.why li').forEach((li,i)=>gsap.from(li,{x:i%2?60:-60,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:li,start:'top 88%'}}));
gsap.from('.fl',{y:50,opacity:0,stagger:.1,duration:.8,ease:'power3.out',scrollTrigger:{trigger:'.fleet',start:'top 85%'}});
gsap.from('.rt',{x:-30,opacity:0,stagger:.08,duration:.7,ease:'power3.out',scrollTrigger:{trigger:'.rates',start:'top 88%'}});
gsap.from('.qf',{y:50,opacity:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:'.qf',start:'top 90%'}});
gsap.fromTo('.cta-bg',{yPercent:-8},{yPercent:8,ease:'none',scrollTrigger:{trigger:'.cta',start:'top bottom',end:'bottom top',scrub:true}});
gsap.from('.cta-in>*',{y:40,opacity:0,stagger:.12,duration:.9,ease:'power3.out',scrollTrigger:{trigger:'.cta',start:'top 80%'}});
addEventListener('load',()=>ScrollTrigger.refresh());
})();

// crane scene
(()=>{
const sec=document.querySelector('.crane-sec');if(!sec)return;
const q=s=>sec.querySelector(s),qa=s=>[...sec.querySelectorAll(s)];
const cam=q('#cam'),hang=q('#crHang'),trol=q('#crTrolley'),spr=q('#crSpreader'),bS=q('#boxStack'),bH=q('#boxHang'),bT=q('#boxTruck'),truck=q('#crTruck'),shd=q('#crShadow'),bar=q('#crBar'),cap=q('#crCap');
const cbl=qa('.cbl'),leds=qa('.led'),locks=qa('.lock'),spins=qa('#crTruck .spin'),steps=qa('.cr-steps li');
const cl=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),seg=(p,a,b)=>cl((p-a)/(b-a)),io=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,ein=t=>t*t*t;
const X0=114,X1=402,UP=170,STK=253,TOP=137,TRK=365;
const caps=['Spreader locks onto the container','Trolley carries it across the yard','Lowered onto the trailer, twistlocks set','Sealed and on the road'];
let tgt=0,cur=-1,last=-1;const svg=q('.cr-svg');let VB=null;
function fit(){if(innerWidth>=900){VB=null;svg.setAttribute('viewBox','0 -110 640 640');return}const r=svg.getBoundingClientRect();const asp=r.height/Math.max(1,r.width);let vw=Math.min(520,640),vh=vw*asp;if(vh>560){vh=560;vw=vh/asp}VB={vw,vh,vy:Math.min(30,540-vh)}}
addEventListener('resize',()=>{fit();cur=-1});
function measure(){const r=sec.getBoundingClientRect(),span=r.height-innerHeight;tgt=cl(-r.top/(span>0?span:1))}
function render(p){
  let x=X0,sy=UP,att=false,onT=false,lk=false,dx=0;
  const a=seg(p,0,.10),c=seg(p,.15,.32),d=seg(p,.32,.52),e=seg(p,.52,.68),g=seg(p,.72,.84),h=seg(p,.78,1);
  if(p<.15){sy=UP+(STK-UP)*io(a);lk=p>=.11}
  else if(p<.32){sy=STK+(TOP-STK)*io(c);att=lk=true}
  else if(p<.52){sy=TOP;x=X0+(X1-X0)*io(d);att=lk=true}
  else if(p<.70){x=X1;sy=TOP+(TRK-TOP)*io(e);att=lk=true}
  else{x=X1;onT=true;sy=TRK+(UP-TRK)*io(g);lk=p<.72}
  dx=onT?820*ein(h):0;
  const sw=(p>=.32&&p<.6)?Math.sin(d*Math.PI*2)*1.4*(1-e):0;
  trol.setAttribute('transform',`translate(${x} 0)`);
  spr.setAttribute('transform',`translate(${x} ${sy})`);
  hang.setAttribute('transform',`rotate(${sw.toFixed(3)} ${x} 134)`);
  cbl.forEach(l=>{l.setAttribute('x1',x+ +l.dataset.x1);l.setAttribute('x2',x+ +l.dataset.x2);l.setAttribute('y2',sy-11)});
  bS.setAttribute('visibility',att||onT?'hidden':'visible');
  bH.setAttribute('visibility',att?'visible':'hidden');bH.setAttribute('x',x-90);bH.setAttribute('y',sy+13);
  bT.setAttribute('visibility',onT?'visible':'hidden');
  truck.setAttribute('transform',`translate(${dx.toFixed(2)} 0)`);
  const rot=(dx/18)*57.2958;spins.forEach(s=>s.setAttribute('transform',`rotate(${rot.toFixed(1)})`));
  const col=lk?'#d8ff3e':'#e05a3a';leds.forEach(l=>l.setAttribute('fill',col));locks.forEach(l=>l.setAttribute('fill',lk?'#b9c23a':'#5b6066'));
  const lift=att&&p<.70?cl((TRK+13-(sy+13))/ (TRK-TOP)):0;
  shd.setAttribute('cx',x);shd.setAttribute('opacity',att?(0.25+0.55*(1-lift)).toFixed(2):0);shd.setAttribute('rx',(90+40*lift).toFixed(1));
  const zb=Math.sin(seg(p,.40,.80)*Math.PI),z=1+.14*zb*zb,fx=x+160,fy=TRK-30;cam.setAttribute('transform',z>1.001?`translate(${fx} ${fy}) scale(${z.toFixed(4)}) translate(${-fx} ${-fy})`:'');
  if(VB){const pc=p<.30?0:p<.50?io(seg(p,.30,.50)):1;const vx=cl(-10+pc*(660-VB.vw),-10,660-VB.vw);svg.setAttribute('viewBox',`${vx.toFixed(2)} ${VB.vy.toFixed(2)} ${VB.vw.toFixed(2)} ${VB.vh.toFixed(2)}`)}
  bar.style.transform=`scaleX(${p.toFixed(4)})`;
  const st=p<.32?0:p<.52?1:p<.74?2:3;
  if(st!==last){last=st;steps.forEach((s,i)=>s.classList.toggle('on',i<=st));cap.textContent=caps[st]}
}
fit();
function loop(){measure();const k=cur<0?1:.14;const n=cur<0?tgt:cur+(tgt-cur)*k;if(Math.abs(n-cur)>.0002||cur<0){cur=Math.abs(tgt-n)<.0005?tgt:n;render(cur)}requestAnimationFrame(loop)}
requestAnimationFrame(loop);
})();
