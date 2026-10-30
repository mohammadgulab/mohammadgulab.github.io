import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as M from './models.js?v=3';

const canvas=document.getElementById('stage');
const loader=document.getElementById('loader');
const done=()=>loader.classList.add('done');
let mobile=innerWidth<760;

// bag
let bag=0; const toast=document.getElementById('toast');
document.querySelectorAll('.add').forEach(b=>b.addEventListener('click',()=>{bag++;document.getElementById('bagCount').textContent=bag;
  const n=b.closest('.card').querySelector('h3').textContent; toast.textContent=n+' added to bag'; toast.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>toast.classList.remove('show'),1800);}));

gsap.registerPlugin(ScrollTrigger);
function reveals(){
  gsap.utils.toArray('.hero .reveal').forEach((el,i)=>gsap.from(el,{y:50,opacity:0,duration:1.3,delay:.35+i*.12,ease:'power3.out'}));
  gsap.utils.toArray('.reveal').filter(el=>!el.closest('.hero')).forEach(el=>gsap.from(el,{y:46,opacity:0,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 97%',toggleActions:'play none none reverse'}}));
}

let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'}); }
catch(e){ canvas.style.display='none'; document.getElementById('fallback').hidden=false; done(); reveals(); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile?1.6:1.75));
const scene=new THREE.Scene();
const bgCols=['#f3edf2','#f1e9f0','#efe6ee','#f3edf2'].map(c=>new THREE.Color(c));
scene.background=bgCols[0].clone();
await M.stage(THREE,renderer,scene,RoomEnvironment);
const camera=new THREE.PerspectiveCamera(30,1,0.1,100); camera.position.set(0,0.6,10); camera.lookAt(0,0,0);

const L=await M.labels(THREE);
const jar=M.buildJar(THREE,{labelTex:L.jar,lidTex:L.lid,lidMat:M.lacquerMat(THREE)});
const rig=new THREE.Group(); scene.add(rig);
const pivot=new THREE.Group(); rig.add(pivot); pivot.add(jar.group); jar.group.position.y=-jar.H*0.55;
const lidBase=jar.lid.position.clone();

// soft contact shadow
const sc=document.createElement('canvas'); sc.width=sc.height=256; const sg=sc.getContext('2d'); const grd=sg.createRadialGradient(128,128,10,128,128,128);
grd.addColorStop(0,'rgba(120,70,60,.38)'); grd.addColorStop(1,'rgba(120,70,60,0)'); sg.fillStyle=grd; sg.fillRect(0,0,256,256);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.6,3.6), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false}));
shadow.rotation.x=-Math.PI/2; shadow.position.y=-jar.H*0.55-0.01; pivot.add(shadow);

// blooms + loose petals
const blooms=new THREE.Group(); scene.add(blooms);
const b1=M.buildPeony(THREE,{seed:11}); const b2=M.buildPeony(THREE,{seed:29,color:0xe98f9c,deep:0xb04059,tip:0xf8c9cd}); const b3=M.buildPeony(THREE,{seed:5,color:0xf0a7ae,deep:0xc45d70,tip:0xfbd6d6});
blooms.add(b1,b2,b3);
const petals=[]; const pcols=[0xf0a9b0,0xf4bdbd,0xeb9aa5,0xf7cfcb];
for(let i=0;i<14;i++){ const p=M.buildPetal(THREE,pcols[i%4]); p.userData={x:(Math.random()-.5)*9, y:(Math.random()-.5)*7, z:-1.5-Math.random()*3, r:Math.random()*6, s:.6+Math.random()*.9, sp:.2+Math.random()*.5}; p.scale.setScalar(p.userData.s); scene.add(p); petals.push(p); }

// scroll states
const D=[
 {x:1.45,y:-0.05,s:0.95,rx:0.32,ry:-0.45,ly:0,lx:0,lz:0,bloom:1,sh:0},
 {x:1.6,y:-0.15,s:1.25,rx:0.12,ry:1.85,ly:0,lx:0,lz:0,bloom:0,sh:0},
 {x:1.5,y:-0.55,s:1.15,rx:0.55,ry:2.75,ly:1.3,lx:-0.45,lz:0.4,bloom:0,sh:0},
 {x:0.75,y:-0.2,s:0.95,rx:1.2,ry:6.28,ly:0.2,lx:1.75,lz:-0.1,bloom:0,sh:0}];
const MB=[
 {x:0,y:0.75,s:0.62,rx:0.32,ry:-0.45,ly:0,lx:0,lz:0,bloom:1,sh:0},
 {x:0,y:1.2,s:0.66,rx:0.12,ry:1.85,ly:0,lx:0,lz:0,bloom:0,sh:0},
 {x:0,y:1.12,s:0.6,rx:0.55,ry:2.75,ly:1.25,lx:0.3,lz:-0.4,bloom:0,sh:0},
 {x:-0.5,y:0.0,s:0.58,rx:1.2,ry:6.28,ly:0.2,lx:1.6,lz:-0.1,bloom:0,sh:0}];
const st={...(mobile?MB:D)[0], bg:0};
const intro={k:0};

let tl;
function buildTimeline(){
  if(tl){ tl.scrollTrigger.kill(); tl.kill(); }
  const asp=innerWidth/innerHeight, f=Math.min(1,Math.max(0.55,asp/1.45));
  const A=(mobile?MB:D).map((s,i)=>mobile?s:{...s,x:s.x*f,s:s.s*(i===0?Math.max(f,0.85):f)});
  Object.assign(st,A[0],{bg:0});
  tl=gsap.timeline({defaults:{ease:'power1.inOut',duration:1},scrollTrigger:{trigger:'main',start:'top top',endTrigger:'#collection',end:'top 60%',scrub:1.1}});
  for(let i=1;i<A.length;i++) tl.to(st,{...A[i],bg:i},i-1);
  tl.to({},{duration:0.6});
}

function resize(){
  const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h;
  camera.fov = w/h<0.75 ? 34 : 30; camera.updateProjectionMatrix();
  mobile=w<760; if(tl){ buildTimeline(); ScrollTrigger.refresh(); }
  const sx=mobile?0.6:1; const fx=mobile?1:Math.min(1,Math.max(0.6,(w/h)/1.45));
  const cx=mobile?0:1.45*fx, cy=mobile?0.75:-0.05;
  b1.position.set(cx-0.05, cy-(mobile?0.6:0.85), -0.3); b1.scale.setScalar((mobile?0.8:1.05)*Math.max(fx,0.75)); b1.rotation.set(0.35,0.4,0.05);
  b2.position.set(cx-(mobile?0.95:1.55), cy-(mobile?0.75:1.15), -0.4); b2.scale.setScalar((mobile?0.6:0.95)*Math.max(fx,0.75)); b2.rotation.set(0.45,1.3,-0.25);
  b3.position.set(cx+(mobile?0.95:1.5), cy-(mobile?0.7:1.05), -0.6); b3.scale.setScalar((mobile?0.55:0.9)*Math.max(fx,0.75)); b3.rotation.set(0.5,2.1,0.3);
}
let lastW=0,lastH=0;
addEventListener('resize',()=>{ if(innerWidth!==lastW||Math.abs(innerHeight-lastH)>140){ lastW=innerWidth; lastH=innerHeight; resize(); } });
lastW=innerWidth; lastH=innerHeight; resize(); buildTimeline();

const pointer={x:0,y:0,tx:0,ty:0};
addEventListener('pointermove',e=>{ if(e.pointerType==='mouse'){ pointer.tx=(e.clientX/innerWidth-.5); pointer.ty=(e.clientY/innerHeight-.5);} });

let visible=true; const coll=document.getElementById('collection');
const clock=new THREE.Clock(); const tmp=new THREE.Color();
function frame(){
  requestAnimationFrame(frame);
  visible = coll.getBoundingClientRect().top > 0;
  if(!visible) return;
  const t=clock.getElapsedTime();
  pointer.x+=(pointer.tx-pointer.x)*0.05; pointer.y+=(pointer.ty-pointer.y)*0.05;
  const k=intro.k;
  rig.position.set(st.x, st.y + Math.sin(t*1.1)*0.04 - (1-k)*0.8, 0);
  rig.scale.setScalar(st.s*(0.82+0.18*k));
  pivot.rotation.set(st.rx + pointer.y*0.12, st.ry + Math.sin(t*0.45)*0.12 + pointer.x*0.35 - (1-k)*0.9, 0);
  jar.lid.position.set(lidBase.x+st.lx, lidBase.y+st.ly, lidBase.z); jar.lid.rotation.z=st.lz + (st.ly>0.05? Math.sin(t*0.9)*0.05:0);
  shadow.material.opacity=st.sh;
  // blooms
  const bl=st.bloom; blooms.position.y=-(1-bl)*3.2 - (1-k)*1.5; blooms.position.x=0; blooms.visible=bl>0.01;
  blooms.children.forEach((b,i)=>{ b.rotation.y+=0.0012*(i%2?1:-1); });
  // petals parallax with scroll
  const sp=scrollY/innerHeight;
  petals.forEach((p,i)=>{ const u=p.userData; p.position.set(u.x+Math.sin(t*u.sp+i)*0.25, ((u.y+sp*1.6*u.sp+ t*0.05*u.sp)%7+7)%7-3.5, u.z); p.rotation.set(u.r+t*u.sp*0.6, u.r*0.5+t*u.sp*0.4, u.r); });
  // bg colour
  const bi=Math.min(bgCols.length-1.001,Math.max(0,st.bg)); const i0=Math.floor(bi); tmp.copy(bgCols[i0]).lerp(bgCols[i0+1],bi-i0); scene.background.copy(tmp);
  renderer.render(scene,camera);
}
renderer.compile(scene,camera);
frame();
requestAnimationFrame(()=>{ done(); gsap.to(intro,{k:1,duration:1.8,ease:'power3.out'}); reveals(); window.SITE_READY=true; });
