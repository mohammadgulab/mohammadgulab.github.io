(()=>{
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), lerp=(a,b,t)=>a+(b-a)*t;
const seg=(p,a,b)=>clamp((p-a)/(b-a),0,1);
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, eo=t=>1-Math.pow(1-t,3), ei=t=>t*t*t;
let VW=innerWidth, VH=innerHeight;

/* reveal + counters */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.15});
$$('.reveal').forEach(el=>io.observe(el));
const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;cio.unobserve(e.target);const el=e.target,end=+el.dataset.count,dec=+(el.dataset.dec||0),suf=el.dataset.suffix||'';const t0=performance.now();const step=t=>{const k=eo(Math.min(1,(t-t0)/1400));el.textContent=(end*k).toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf;if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)}),{threshold:.4});
$$('[data-count]').forEach(el=>cio.observe(el));

/* nav theme */
const nav=$('#nav');
const themes=[['#hero','clear'],['#intro','solid'],['#yard','solid'],['#services','dark'],['#milestones','stage'],['#trust','solid'],['#coverage','solid'],['#quote','dark']];
let stageP=0;
function navTheme(){let t='dark';for(const [s,th] of themes){const r=$(s).getBoundingClientRect();if(r.top<=40&&r.bottom>40){t=th;break;}}
 if(t==='stage')t=(stageP<.4||stageP>.86)?'solid':'dark';
 nav.classList.toggle('solid',t==='solid');nav.classList.toggle('dark',t==='dark');}

/* yard lane marks */
const marks=$('#marks');let mk='';for(let x=-400;x<2000;x+=140)mk+=`<rect x="${x}" y="736" width="70" height="6"/>`;marks.innerHTML=mk;

/* ship bays */
(()=>{const g=$('#bays');const pal=['#ff6a1a','#2a9d8f','#e63946','#1d4f7c','#f4a261','#e9c46a','#7d8a99','#8ecae6','#264653','#ffffff','#b5179e'];let s='',seed=7;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
 for(let x=212;x<1060;x+=40){const taper=x>930?Math.floor((x-930)/45):0;for(let r=taper;r<7-taper;r++){if(rnd()<.06)continue;const y=64+r*19;const c=pal[Math.floor(rnd()*pal.length)];s+=`<rect x="${x}" y="${y}" width="36" height="17" rx="1.5" fill="${c}"/><rect x="${x}" y="${y}" width="36" height="3" fill="#000" opacity=".12"/>`;}
 if((x-212)%160===120)s+=`<rect x="${x+37}" y="58" width="2" height="144" fill="#1c2430"/>`;}
 g.innerHTML=s;})();

/* HERO */
const earth=$('#earth'),heroWhite=$('#heroWhite'),heroCopy=$('#heroCopy'),hint=$('#scrollHint');
function hero(p){earth.style.transform=`scale(${1+.55*ease(p)}) translateY(${-6*p}%)`;
 heroCopy.style.opacity=1-seg(p,.12,.45);heroCopy.style.transform=`translateY(${-80*seg(p,.05,.5)}px)`;
 heroWhite.style.opacity=ease(seg(p,.5,.95));hint.style.opacity=.8*(1-seg(p,0,.1));}

/* YARD */
const st={view:$('#yardView'),world:$('#yardWorld'),stacker:$('#stacker'),body:$('#body'),boomG:$('#boomG'),bo:$('#boomOuter'),bi:$('#boomInner'),spr:$('#spreader'),box:$('#box'),truck:$('#truck'),tw:$$('#truck .tw'),sw:$$('#body use'),bar:$('#ybar'),num:$('#stepNum'),title:$('#stepTitle'),text:$('#stepText')};
const steps=[['Picked at the port.','Our yard team lifts your box straight off the stack at Jeddah Islamic Port.'],['Lifted with care.','Every move is planned, logged and photographed before it leaves the yard.'],['Loaded on time.','The truck is booked to the minute, so your box never waits at the gate.'],['On the road to you.','Door to door across the Kingdom and the GCC, tracked the whole way.']];
let curStep=-1;const ghost=$('#yardGhost');
function yard(p){
 // stacker x0, spreader anchor A (bar centre), truck tx
 let x0,A,tx,boxAt;
 const STACK={x:210,y:348};
 const rest=(x)=>({x:x+340-430,y:250});
 if(p<.16){const k=ease(seg(p,0,.16));x0=lerp(760,400,k);const r=rest(760);A={x:lerp(r.x,STACK.x,k),y:lerp(r.y,290,k)};}
 else if(p<.24){const k=ease(seg(p,.16,.24));x0=400;A={x:STACK.x,y:lerp(290,STACK.y,k)};}
 else if(p<.31){const k=ease(seg(p,.24,.31));x0=400;A={x:lerp(STACK.x,230,k),y:lerp(STACK.y,230,k)};}
 else if(p<.5){const k=ease(seg(p,.31,.5));x0=lerp(400,760,k);A={x:lerp(230,612,k),y:lerp(230,250,k)};}
 else if(p<.6){const k=ease(seg(p,.5,.6));x0=760;A={x:612,y:lerp(250,488,k)};}
 else if(p<.68){const k=ease(seg(p,.6,.68));x0=760;A={x:612,y:lerp(488,380,k)};}
 else {const k=ease(seg(p,.68,.8));x0=lerp(760,840,k);A={x:lerp(612,700,k),y:lerp(380,300,k)};}
 const kt=seg(p,.3,.5);tx=p<.7?lerp(-760,440,eo(kt)):lerp(440,2150,ei(seg(p,.7,1)));
 const locked=p>=.235&&p<.6;
 boxAt=p<.235?STACK:(locked?A:{x:tx+172,y:488});
 // stacker
 const G=690;st.stacker.setAttribute('transform','');
 st.body.setAttribute('transform',`translate(${x0},${G})`);
 const P={x:x0+340,y:G-150};const B={x:A.x,y:A.y-40};
 const dx=B.x-P.x,dy=B.y-P.y,L=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)*180/Math.PI;
 st.boomG.setAttribute('transform',`translate(${P.x},${P.y}) rotate(${ang})`);
 st.bo.setAttribute('width',Math.min(L,360));st.bi.setAttribute('x',Math.min(L,360)-60);st.bi.setAttribute('width',Math.max(60,L-Math.min(L,360)+60));
 st.spr.setAttribute('transform',`translate(${A.x},${A.y})`);
 st.spr.querySelectorAll('rect')[1].setAttribute('fill',locked?'#22c55e':'#ff6a1a');st.spr.querySelectorAll('rect')[2].setAttribute('fill',locked?'#22c55e':'#ff6a1a');
 st.box.setAttribute('transform',`translate(${boxAt.x-150},${boxAt.y+12})`);
 st.truck.setAttribute('transform',`translate(${tx},730)`);
 const rot=tx*1.9;st.tw.forEach(w=>{w.setAttribute('transform',`rotate(${rot} ${w.getAttribute('x')} ${w.getAttribute('y')})`)});
 const srot=-x0*1.5;st.sw.forEach(w=>{w.setAttribute('transform',`rotate(${srot} ${w.getAttribute('x')} ${w.getAttribute('y')})`)});
 // camera
 const vh=st.view.clientHeight, portrait=VW<VH*0.9;
 let scale=Math.min(vh/650, portrait?VW/690:VW/1500);
 const worldW=2400*scale;let focus;
 if(p<.31)focus=lerp(470,330,seg(p,0,.31));else if(p<.7)focus=lerp(330,boxAt.x+40,seg(p,.31,.45));else focus=Math.max(boxAt.x+60, lerp(612,boxAt.x+60,seg(p,.7,.78)));
 if(!portrait)focus=lerp(800,Math.max(800,focus),seg(p,.72,1));
 let wx=VW/2-(focus+400)*scale;wx=clamp(wx,VW-worldW+0,0);
 const minX=VW-(2000+400)*scale, maxX=-(0+400)*scale+ (VW>1600*scale? (VW-1600*scale)/2:0);
 wx=clamp(wx,Math.min(minX,maxX),Math.max(minX,maxX));
 st.world.style.transform=`translate(${wx}px,0) scale(${scale})`;
 // captions
 const s=p<.24?0:p<.5?1:p<.68?2:3;
 if(s!==curStep){curStep=s;st.num.textContent=`0${s+1} / 04`;st.title.textContent=steps[s][0];st.text.textContent=steps[s][1];
  if(window.gsap)gsap.fromTo([st.title,st.text],{y:16,opacity:0},{y:0,opacity:1,duration:.45,stagger:.06,overwrite:true});}
 st.bar.style.width=(p*100)+'%';
 ghost.style.opacity=seg(p,.66,.82);
}

/* STAGE */
const sg={sea:$('#sea'),ship:$('#shipWrap'),a:$('#halfA'),b:$('#halfB'),box:$('#seamBox'),seam:$('#seam'),feats:$$('.feat'),clouds:$('#clouds'),puffs:$$('.puff'),ms:$$('#msList li'),chip:$('#chip')};
const chipTxt=['Booked','Picked up','Customs cleared','At sea','Delivered'];
function stage(p){stageP=p;
 const mob=VW<=760;
 const n=Math.min(5,Math.floor(seg(p,.05,.34)*5.0001));
 sg.ms.forEach((li,i)=>li.classList.toggle('on',i<Math.max(1,n)));
 const ci=Math.max(0,Math.min(4,n-1));sg.chip.textContent=chipTxt[ci];sg.chip.classList.toggle('done',ci===4);
 const kb=ease(seg(p,.02,.3)), kpart=ease(seg(p,.36,.5));
 if(mob){const x=lerp(-160,VW/2,kb);sg.box.style.transform=`translate(calc(${x}px - 50%),-50%) scale(${lerp(1,.4,kpart)})`;}
 else{const y=lerp(-VH*.3,VH/2,kb);sg.box.style.transform=`translate(-50%,calc(${y}px - 50%)) rotate(90deg) scale(${lerp(1,.4,kpart)})`;}
 sg.box.style.opacity=1-seg(p,.42,.48);
 sg.seam.style.opacity=1-seg(p,.36,.44);
 if(mob){sg.a.style.transform=`translateY(${-102*kpart}%)`;sg.b.style.transform=`translateY(${102*kpart}%)`;}
 else{sg.a.style.transform=`translateX(${-102*kpart}%)`;sg.b.style.transform=`translateX(${102*kpart}%)`;}
 let sc=lerp(1.8,1.15,kpart);sc=lerp(sc,mob?.62:.74,ease(seg(p,.5,.66)));sc=lerp(sc,.3,ease(seg(p,.72,.95)));
 const drift=lerp(3,-3,p);
 sg.ship.style.width=(VH*1.1)+'px';
 sg.ship.style.transform=`translate(-50%,-50%) translateY(${drift}vh) rotate(-90deg) scale(${sc})`;
 sg.sea.style.transform=`scale(${lerp(1.25,1,kpart)*lerp(1,.75,seg(p,.72,.95))})`;
 sg.feats.forEach((f,i)=>{const kin=eo(seg(p,.52+i*.03,.6+i*.03)),kout=seg(p,.7,.76);f.style.opacity=kin*(1-kout);f.style.transform=`translateY(${(1-kin)*30-kout*30}px)`;});
 const kc=seg(p,.7,.96);sg.clouds.style.opacity=ease(seg(p,.7,.84));
 sg.puffs.forEach((pf,i)=>{pf.style.transform=`translateY(${lerp(70+i*12,-30-i*6,ease(kc))}vh) scale(${lerp(.7,1.5,kc)})`;pf.style.opacity=lerp(.6,1,kc);});
}

/* plane */
const plane=$('#plane');function planeU(p){plane.style.transform=`translate(${lerp(-10,135,p)}vw,${lerp(0,22,p)}vh) rotate(${lerp(98,84,p)}deg)`;}

/* scroll driver (works with or without ScrollTrigger) */
const secs=[['#hero',hero],['#yard',yard],['#milestones',stage]];
function prog(el){const r=el.getBoundingClientRect();const total=r.height-VH;return clamp(-r.top/total,0,1);}
function trustP(){const r=$('#trust').getBoundingClientRect();return clamp((VH-r.top)/(VH+r.height),0,1);}
let ticking=false;
function update(){ticking=false;for(const [s,f] of secs)f(prog($(s)));planeU(trustP());navTheme();}
function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',()=>{VW=innerWidth;VH=innerHeight;curStep=-1;update();});
if(window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);ScrollTrigger.config({ignoreMobileResize:true});}
update();
window.__halqa={update};

/* quote form */
const form=$('#qform'),est=$('#estimate');
const d=new Date();d.setDate(d.getDate()+5);form.date.value=d.toISOString().slice(0,10);
form.addEventListener('submit',e=>{e.preventDefault();let ok=true;['name','contact'].forEach(n=>{const f=form[n];const bad=!f.value.trim();f.classList.toggle('bad',bad);if(bad)ok=false;});
 if(!ok){form.querySelector('.bad').focus();return;}
 const mode=form.mode.value,dest=+form.to.value,load=+form.load.value,cust=form.customs.checked;
 const base={sea:2850,air:6400,land:1450}[mode]*(mode==='land'?Math.max(.7,dest*.8):dest)*load+(cust?650:0);
 const lo=Math.round(base*.9/10)*10,hi=Math.round(base*1.12/10)*10;
 const days={sea:'4 to 19 days',air:'1 to 3 days',land:'1 to 4 days'}[mode];
 const nm=form.name.value.trim().split(' ')[0].replace(/[<>&]/g,'');
 est.hidden=false;est.innerHTML=`<small>Indicative estimate, ${form.to.options[form.to.selectedIndex].text}</small><b>SAR ${lo.toLocaleString('en-US')} to ${hi.toLocaleString('en-US')}</b><small>Transit ${days}. Thanks ${nm}, in the real site a coordinator would confirm within the working day.</small>`;
 est.scrollIntoView({behavior:'smooth',block:'nearest'});});
})();
