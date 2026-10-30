(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const DPR=()=>Math.min(window.devicePixelRatio||1,2.5);
const cap=(el,e)=>{try{cap(el,e)}catch(_){}};
const tried=el=>{const c=el.closest('.card');if(c)c.classList.add('tried')};
const rel=(e,el)=>{const r=el.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top,w:r.width,h:r.height}};
// visibility: only animate canvases on screen
const vis=new WeakMap();
const io=new IntersectionObserver(es=>es.forEach(e=>vis.set(e.target,e.isIntersecting)),{rootMargin:'100px'});
const watch=el=>{vis.set(el,false);io.observe(el)};
const onScreen=el=>vis.get(el)!==false;

// hero
requestAnimationFrame(()=>setTimeout(()=>{
  const t=$('.hero-title');t.classList.add('in');$$('.w',t).forEach((w,i)=>w.style.transitionDelay=(i*.12)+'s');
},80));
const cnt=$('[data-count]');if(cnt){const end=+cnt.dataset.count;let s=null;const step=ts=>{if(!s)s=ts;const p=Math.min((ts-s)/1400,1);cnt.textContent=Math.round(end*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(step)};setTimeout(()=>requestAnimationFrame(step),600)}

// scroll reveal
const rio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target)}}),{threshold:.12});
$$('.reveal').forEach(el=>rio.observe(el));

// generic tap marker
$$('.stage').forEach(s=>s.addEventListener('pointerdown',()=>tried(s)));

/* 01 particle dome */
(()=>{
  const st=$('[data-fx=dome]'),cv=$('canvas',st),cx=cv.getContext('2d');watch(st);
  const P=[];const R=1;
  for(let ring=0;ring<=16;ring++){const phi=(ring/16)*Math.PI/2;const rr=Math.cos(phi)*R,y=-Math.sin(phi)*R;const n=Math.max(6,Math.round(64*Math.cos(phi)));
    for(let k=0;k<n;k++){const a=k/n*Math.PI*2+(ring%2)*Math.PI/n;P.push({x:Math.cos(a)*rr,y:y,z:Math.sin(a)*rr,c:0})}}
  // door arch
  for(let k=0;k<40;k++){const a=Math.PI*(k/39);for(let d=0;d<6;d++){P.push({x:Math.cos(a)*.3,y:-Math.sin(a)*.38,z:.9+d*.07,c:1})}}
  // ground
  for(let k=0;k<420;k++){const a=Math.random()*Math.PI*2,r=1.1+Math.pow(Math.random(),.6)*1.3;P.push({x:Math.cos(a)*r,y:0.02,z:Math.sin(a)*r,c:2})}
  P.forEach(p=>{const a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1),r=1.5+Math.random()*2.2;p.sx=Math.sin(b)*Math.cos(a)*r;p.sy=Math.cos(b)*r;p.sz=Math.sin(b)*Math.sin(a)*r;p.d=Math.random()*.5});
  let W=0,H=0,yaw=.6,vy=.004,target=1,t=0.0,drag=null,moved=0;
  const size=()=>{const r=st.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*DPR();cv.height=H*DPR();cx.setTransform(DPR(),0,0,DPR(),0,0)};
  size();addEventListener('resize',size);
  // start scattered then assemble
  t=0;setTimeout(()=>target=1,300);target=0;setTimeout(()=>target=1,500);
  st.addEventListener('pointerdown',e=>{drag={x:e.clientX,yaw};moved=0;cap(st,e)});
  st.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;moved=Math.max(moved,Math.abs(dx));yaw=drag.yaw+dx*.01;vy=0});
  const up=e=>{if(!drag)return;if(moved<8){target=target>.5?0:1}drag=null;vy=.004};
  st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
  const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
  function frame(){requestAnimationFrame(frame);if(!onScreen(st))return;
    t+=(target-t)*.045;yaw+=vy;
    cx.clearRect(0,0,W,H);
    const g=cx.createRadialGradient(W/2,H*.62,10,W/2,H*.62,W*.6);g.addColorStop(0,'rgba(139,92,246,.16)');g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.fillRect(0,0,W,H);
    const s=Math.min(W,H)*.36,cy=Math.cos(yaw),sy=Math.sin(yaw),tilt=.32,ct=Math.cos(tilt),stl=Math.sin(tilt);
    for(const p of P){const k=ease(Math.min(1,Math.max(0,(t-p.d*.4)/(1-.4*.5))));
      let x=p.sx+(p.x-p.sx)*k,y=p.sy+(p.y-p.sy)*k,z=p.sz+(p.z-p.sz)*k;
      const X=x*cy-z*sy,Z=x*sy+z*cy;const Y=y*ct-Z*stl,Z2=y*stl+Z*ct;
      const f=3.2/(3.2+Z2);const px=W/2+X*s*f,py=H*.62+Y*s*f;
      const a=Math.max(.15,Math.min(1,.75-Z2*.35));
      cx.fillStyle=p.c===1?`rgba(103,232,249,${a})`:p.c===2?`rgba(161,161,190,${a*.55})`:`rgba(216,204,255,${a})`;
      const sz=(p.c===2?1.1:1.7)*f;cx.fillRect(px,py,sz,sz)}
  }
  frame();
})();

/* 02 blur reveal */
(()=>{
  const st=$('[data-fx=blur]'),p=$('.blur-text',st);
  const lines=['Build bold interfaces with precision and speed','Every word arrives out of focus','Then snaps into place','Clean motion feels premium'];let li=0;
  const fill=s=>{p.innerHTML=s.split(' ').map((w,i,a)=>`<span class="${i===a.length-1?'hl':''}">${w}</span>`).join(' ');$$('span',p).forEach((x,i)=>x.style.transitionDelay=(i*.09)+'s')};
  const play=()=>{p.classList.remove('on');void p.offsetWidth;requestAnimationFrame(()=>requestAnimationFrame(()=>p.classList.add('on')))};
  fill(lines[0]);
  new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){setTimeout(play,250);o.disconnect()}},{threshold:.4}).observe(st);
  st.addEventListener('click',()=>{li=(li+1)%lines.length;p.classList.remove('on');setTimeout(()=>{fill(lines[li]);play()},350)});
})();

/* 03 gravity pills */
(()=>{
  const st=$('[data-fx=pills]');const M=window.Matter;
  const words=["Button","Toggle","Card","Modal","Slider","Badge","Tabs","Input","Menu","Toast","Chip","Avatar","Tooltip","Switch"];
  const cols=[['#8b5cf6','#fff'],['#f4f4f6','#0a0a0f'],['#22d3ee','#04212a'],['#f472b6','#2a0616'],['#1f1f2b','#fff'],['#facc15','#1f1600'],['#34d399','#022c1c']];
  if(!M){st.addEventListener('click',()=>st.classList.toggle('broken'));return}
  const {Engine,Bodies,Composite,Body,Query,Constraint,Vector}=M;
  const eng=Engine.create();eng.gravity.y=1.1;let W=0,H=0,walls=[],items=[],grab=null,down=null,running=false;
  const build=()=>{const r=st.getBoundingClientRect();W=r.width;H=r.height;Composite.remove(eng.world,walls);
    walls=[Bodies.rectangle(W/2,H+30,W*3,60,{isStatic:true}),Bodies.rectangle(-30,H/2,60,H*4,{isStatic:true}),Bodies.rectangle(W+30,H/2,60,H*4,{isStatic:true})];Composite.add(eng.world,walls)};
  build();addEventListener('resize',build);
  const add=(x,y,i)=>{const el=document.createElement('div');el.className='pill';const w=words[i%words.length];el.textContent=w;const c=cols[i%cols.length];el.style.background=c[0];el.style.color=c[1];st.appendChild(el);
    const bw=Math.max(64,w.length*8.6+34),bh=40;el.style.width=bw+'px';
    const b=Bodies.rectangle(x,y,bw,bh,{chamfer:{radius:19},restitution:.45,friction:.15,density:.002});Body.setAngle(b,(Math.random()-.5)*1.2);Body.setAngularVelocity(b,(Math.random()-.5)*.15);
    Composite.add(eng.world,b);items.push({b,el,bw,bh})};
  const draw=()=>{for(const it of items){const {x,y}=it.b.position;it.el.style.transform=`translate(${x-it.bw/2}px,${y-it.bh/2}px) rotate(${it.b.angle}rad)`}};
  let last=0;const loop=ts=>{if(!running)return;requestAnimationFrame(loop);const dt=Math.min(32,ts-(last||ts));last=ts;if(dt>0)Engine.update(eng,dt);draw()};
  const start=()=>{if(!running){running=true;last=0;requestAnimationFrame(loop)}};
  const breakWord=()=>{st.classList.add('broken');for(let i=0;i<12;i++)setTimeout(()=>add(W*.15+Math.random()*W*.7,-40-Math.random()*60,items.length),i*70);start()};
  const reset=()=>{items.forEach(it=>{Composite.remove(eng.world,it.b);it.el.remove()});items=[];st.classList.remove('broken')};
  $('.reset',st).addEventListener('click',e=>{e.stopPropagation();reset()});
  $('.reset',st).addEventListener('pointerdown',e=>e.stopPropagation());
  st.addEventListener('pointerdown',e=>{const p=rel(e,st);down={x:p.x,y:p.y,t:Date.now()};cap(st,e);
    const hit=Query.point(items.map(i=>i.b),{x:p.x,y:p.y})[0];
    if(hit){grab=Constraint.create({pointA:{x:p.x,y:p.y},bodyB:hit,pointB:Vector.sub({x:p.x,y:p.y},hit.position),stiffness:.2,damping:.1,length:0});Composite.add(eng.world,grab)}});
  st.addEventListener('pointermove',e=>{if(grab){const p=rel(e,st);grab.pointA={x:p.x,y:p.y}}});
  const up=e=>{if(grab){Composite.remove(eng.world,grab);grab=null;down=null;return}
    if(down&&Date.now()-down.t<400){if(!st.classList.contains('broken'))breakWord();else if(items.length<34){for(let i=0;i<3;i++)add(down.x+(i-1)*30,Math.max(20,down.y-60),items.length);start()}}down=null};
  st.addEventListener('pointerup',up);st.addEventListener('pointercancel',()=>{if(grab){Composite.remove(eng.world,grab);grab=null}down=null});
})();

/* 04 component kit */
(()=>{
  const st=$('[data-fx=kit]');
  const b=$('.k-btn',st);b.addEventListener('click',e=>{const r=b.getBoundingClientRect();const d=Math.max(r.width,r.height);const s=document.createElement('i');s.className='rip';s.style.width=s.style.height=d+'px';s.style.left=((e.clientX||r.left+r.width/2)-r.left-d/2)+'px';s.style.top=((e.clientY||r.top+r.height/2)-r.top-d/2)+'px';b.appendChild(s);setTimeout(()=>s.remove(),750);b.classList.toggle('hit');$('span',b).textContent=b.classList.contains('hit')?'Started':'Get started'});
  const sw=$('.k-switch',st);sw.addEventListener('click',()=>sw.setAttribute('aria-checked',sw.getAttribute('aria-checked')!=='true'));
  const ck=$('.k-check',st);ck.addEventListener('click',()=>ck.setAttribute('aria-pressed',ck.getAttribute('aria-pressed')!=='true'));
  const ld=$('.k-load',st);let tm;ld.addEventListener('click',()=>{clearTimeout(tm);ld.classList.toggle('done');if(ld.classList.contains('done'))tm=setTimeout(()=>ld.classList.remove('done'),2600)});
})();

/* 05 magnetic */
(()=>{
  const st=$('[data-fx=magnet]'),b=$('.mag',st),sp=$('span',b);let tx=0,ty=0,x=0,y=0,vx=0,vy=0,sc=1,tsc=1,hold=null;
  const set=e=>{const r=st.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const m=Math.min(1,180/Math.hypot(dx,dy||1));tx=dx*.45*m;ty=dy*.45*m;const L=Math.min(r.width,r.height)*.32;const d=Math.hypot(tx,ty);if(d>L){tx*=L/d;ty*=L/d}};
  st.addEventListener('pointerdown',e=>{cap(st,e);set(e);tsc=1.12;clearTimeout(hold)});
  st.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)set(e)});
  const rel_=()=>{tsc=1;hold=setTimeout(()=>{tx=0;ty=0},500)};
  st.addEventListener('pointerup',rel_);st.addEventListener('pointercancel',rel_);st.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){tx=0;ty=0;tsc=1}});
  (function f(){requestAnimationFrame(f);vx+=(tx-x)*.12;vy+=(ty-y)*.12;vx*=.78;vy*=.78;x+=vx;y+=vy;sc+=(tsc-sc)*.2;b.style.transform=`translate(${x}px,${y}px) scale(${sc})`;sp.style.transform=`translate(${x*.35}px,${y*.35}px)`})();
})();

/* 06 spotlight */
(()=>{
  const st=$('[data-fx=spot]'),c=$('.spot-card',st);let o=0,to=0,fade;
  const mv=e=>{const p=rel(e,c);c.style.setProperty('--x',p.x+'px');c.style.setProperty('--y',p.y+'px');to=1;clearTimeout(fade);if(e.type!=='pointermove'||e.pointerType!=='mouse')fade=setTimeout(()=>to=0,2200)};
  st.addEventListener('pointerdown',mv);st.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)mv(e)});
  st.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')to=0});
  (function f(){requestAnimationFrame(f);o+=(to-o)*.1;c.style.setProperty('--o',o.toFixed(3))})();
})();

/* 07 tilt */
(()=>{
  const st=$('[data-fx=tilt]'),c=$('.tilt-card',st);let back;
  const tl=e=>{const p=rel(e,c);const nx=Math.max(-1,Math.min(1,(p.x/p.w)*2-1)),ny=Math.max(-1,Math.min(1,(p.y/p.h)*2-1));c.classList.add('live');c.style.transform=`rotateY(${nx*18}deg) rotateX(${-ny*18}deg) scale(1.04)`;c.style.setProperty('--gx',(p.x/p.w*100)+'%');c.style.setProperty('--gy',(p.y/p.h*100)+'%');c.style.setProperty('--go',.9);clearTimeout(back)};
  const rs=()=>{back=setTimeout(()=>{c.classList.remove('live');c.style.transform='';c.style.setProperty('--go',.25)},1300)};
  st.addEventListener('pointerdown',tl);st.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)tl(e)});
  st.addEventListener('pointerup',rs);st.addEventListener('pointercancel',rs);st.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')rs()});
})();

/* 08 scramble */
(()=>{
  const st=$('[data-fx=scramble]'),el=$('.scr',st);const list=['Design','Motion','Craft','Pixels','Interact','Delight'];let i=0,busy=0;const ch='!<>-_/[]{}=+*^?#ABCDEFX01';
  const go=to=>{const from=el.textContent;const L=Math.max(from.length,to.length);const q=[];for(let k=0;k<L;k++){const s=Math.floor(Math.random()*14),e=s+10+Math.floor(Math.random()*14);q.push({f:from[k]||'',t:to[k]||'',s,e})}
    let fr=0;const id=++busy;(function u(){if(id!==busy)return;let out='',done=0;for(const x of q){if(fr>=x.e){done++;out+=x.t}else if(fr>=x.s){out+=`<span class="x">${ch[Math.floor(Math.random()*ch.length)]}</span>`}else out+=x.f}el.innerHTML=out;if(done<q.length){fr++;requestAnimationFrame(u)}})()};
  st.addEventListener('click',()=>{i=(i+1)%list.length;go(list[i])});
  new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){setTimeout(()=>go('Design'),300);o.disconnect()}},{threshold:.5}).observe(st);
})();

/* 09 marquee */
(()=>{
  const st=$('[data-fx=marquee]');watch(st);const rows=$$('.mq-row',st);
  const A=['Smooth','Bold','Fluid','Crisp','Playful','Sharp','Calm'],B=['scroll','swipe','glide','spring','bounce','drift','flow'];
  rows.forEach((r,i)=>{const w=i?B:A;r.innerHTML=[...w,...w,...w,...w].map(x=>`<span>${x}</span>`).join('')});
  let dir=1,speed=.8,boost=0,off=[0,-200],drag=null,moved=0,lastX=0,flick=0;
  st.addEventListener('pointerdown',e=>{drag={x:e.clientX};lastX=e.clientX;moved=0;flick=0});
  st.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lastX;lastX=e.clientX;moved+=Math.abs(dx);flick=dx;off[0]+=dx;off[1]-=dx});
  const up=()=>{if(!drag)return;if(moved<8){dir*=-1;boost=10*dir}else{boost=flick*1.5}drag=null};
  st.addEventListener('pointerup',up);st.addEventListener('pointercancel',()=>{drag=null});
  (function f(){requestAnimationFrame(f);if(!onScreen(st))return;boost*=.95;const v=speed*dir+boost;
    rows.forEach((r,i)=>{if(!drag)off[i]+=i?v:-v;const half=r.scrollWidth/2;if(half>0){while(off[i]<-half)off[i]+=half;while(off[i]>0)off[i]-=half}r.style.transform=`translateX(${off[i]}px)`})})();
})();

/* 10 blob */
(()=>{
  const st=$('[data-fx=blob]');watch(st);const path=$('.blob path',st),stops=$$('.blob stop',st);
  const pals=[['#8b5cf6','#22d3ee'],['#f472b6','#facc15'],['#34d399','#3b82f6'],['#f97316','#e11d48'],['#e0e7ff','#8b5cf6']];let pi=0;
  const N=8,ph=[...Array(N)].map(()=>Math.random()*6.28),sp=[...Array(N)].map(()=>.6+Math.random()*.8);let amp=12,tamp=12,t=0;
  st.addEventListener('click',()=>{pi=(pi+1)%pals.length;stops[0].setAttribute('stop-color',pals[pi][0]);stops[1].setAttribute('stop-color',pals[pi][1]);amp=46;});
  (function f(){requestAnimationFrame(f);if(!onScreen(st))return;t+=.016;amp+=(tamp-amp)*.03;
    const pts=[];for(let i=0;i<N;i++){const a=i/N*Math.PI*2;const r=100+Math.sin(t*sp[i]*1.6+ph[i])*amp+Math.sin(t*2.3+i)*4;pts.push([150+Math.cos(a)*r,150+Math.sin(a)*r])}
    let d=`M${pts[0][0]},${pts[0][1]}`;for(let i=0;i<N;i++){const p0=pts[(i-1+N)%N],p1=pts[i],p2=pts[(i+1)%N],p3=pts[(i+2)%N];
      d+=`C${p1[0]+(p2[0]-p0[0])/6},${p1[1]+(p2[1]-p0[1])/6} ${p2[0]-(p3[0]-p1[0])/6},${p2[1]-(p3[1]-p1[1])/6} ${p2[0]},${p2[1]}`}
    path.setAttribute('d',d+'Z')})();
})();

/* 11 mesh */
(()=>{
  const st=$('[data-fx=mesh]'),bl=$$('.mesh i',st),lab=$('.mesh-label',st);
  const P=[['Aurora',['#7c3aed','#06b6d4','#db2777','#f59e0b']],['Lagoon',['#0ea5e9','#14b8a6','#1e3a8a','#a7f3d0']],['Sunset',['#f97316','#e11d48','#facc15','#7e22ce']],['Forest',['#166534','#84cc16','#064e3b','#fde047']],['Candy',['#f9a8d4','#a78bfa','#fb7185','#fef08a']]];let i=0;
  st.addEventListener('click',()=>{i=(i+1)%P.length;bl.forEach((b,k)=>b.style.background=P[i][1][k]);lab.style.opacity=0;setTimeout(()=>{lab.textContent=P[i][0];lab.style.opacity=1},300)});
})();

/* 12 accordion */
(()=>{const st=$('[data-fx=accordion]');const ps=$$('.acc-p',st);ps.forEach(p=>p.addEventListener('click',()=>{ps.forEach(x=>x.classList.toggle('on',x===p))}))})();

/* 13 counter */
(()=>{
  const st=$('[data-fx=counter]'),o=$('.odo',st);let n=0;const D=4;
  o.innerHTML=[...Array(D)].map(()=>`<div class="d"><div>${[...Array(10)].map((_,k)=>`<span>${k}</span>`).join('')}</div></div>`).join('');
  const cols=$$('.d>div',o);
  const show=()=>{const s=String(n).padStart(D,'0');cols.forEach((c,k)=>c.style.transform=`translateY(${-s[k]*76}px)`);o.setAttribute('aria-label',n+' taps')};
  $$('[data-add]',st).forEach(b=>b.addEventListener('click',()=>{const a=+b.dataset.add;n=a?Math.min(9999,n+a):0;show()}));show();
})();

/* 14 glitch */
(()=>{const st=$('[data-fx=glitch]'),g=$('.gl',st);const words=['GLITCH','SIGNAL','STATIC','REBOOT'];let i=0;
  st.addEventListener('click',()=>{g.classList.remove('go');void g.offsetWidth;g.classList.add('go');setTimeout(()=>{i=(i+1)%words.length;g.textContent=words[i];g.dataset.t=words[i]},300)});
  g.addEventListener('animationend',e=>{if(e.target===g&&e.animationName==='shake')g.classList.remove('go')});
})();

/* 15 light trail */
(()=>{
  const st=$('[data-fx=trail]'),cv=$('canvas',st),cx=cv.getContext('2d');watch(st);let W=0,H=0,pts=[],sparks=[],hue=260,down=false,auto=0;
  const size=()=>{const r=st.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*DPR();cv.height=H*DPR();cx.setTransform(DPR(),0,0,DPR(),0,0)};size();addEventListener('resize',size);
  const addP=(x,y)=>{hue=(hue+3)%360;pts.push({x,y,h:hue,l:1})};
  st.addEventListener('pointerdown',e=>{down=true;cap(st,e);const p=rel(e,st);addP(p.x,p.y);for(let i=0;i<34;i++){const a=Math.random()*6.28,s=1+Math.random()*4.5;sparks.push({x:p.x,y:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,h:(hue+Math.random()*80)%360})}});
  st.addEventListener('pointermove',e=>{if(!down&&e.pointerType!=='mouse')return;const p=rel(e,st);addP(p.x,p.y)});
  const up=()=>{down=false;pts.push(null)};st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
  (function f(){requestAnimationFrame(f);if(!onScreen(st))return;cx.clearRect(0,0,W,H);
    if(!pts.length&&!sparks.length){auto+=.03;const x=W/2+Math.cos(auto)*W*.3,y=H/2+Math.sin(auto*2)*H*.18;cx.fillStyle='rgba(196,181,253,.5)';cx.beginPath();cx.arc(x,y,4,0,7);cx.fill()}
    cx.lineCap='round';cx.lineJoin='round';cx.globalCompositeOperation='lighter';
    for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];if(!a||!b)continue;cx.strokeStyle=`hsla(${b.h},90%,65%,${b.l})`;cx.lineWidth=2+b.l*10;cx.shadowColor=`hsl(${b.h},90%,60%)`;cx.shadowBlur=18;cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke()}
    cx.shadowBlur=0;
    for(const s of sparks){s.x+=s.vx;s.y+=s.vy;s.vy+=.06;s.vx*=.98;s.l-=.018;cx.fillStyle=`hsla(${s.h},95%,65%,${Math.max(0,s.l)})`;cx.fillRect(s.x,s.y,3,3)}
    cx.globalCompositeOperation='source-over';
    pts.forEach(p=>{if(p)p.l-=.012});while(pts.length&&(!pts[0]||pts[0].l<=0))pts.shift();sparks=sparks.filter(s=>s.l>0)})();
})();
})();
