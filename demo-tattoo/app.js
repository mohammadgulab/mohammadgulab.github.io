import * as THREE from 'three';
import {DecalGeometry} from 'three/addons/geometries/DecalGeometry.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const isPhone=matchMedia('(max-width:700px)').matches;
const canvas=document.getElementById('body');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,isPhone?1.4:1.75));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
const scene=new THREE.Scene();
const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),0.04).texture;
const camera=new THREE.PerspectiveCamera(30,1,0.05,50);
const key=new THREE.DirectionalLight('#fff1e0',2.2);key.position.set(2,3,3);scene.add(key);
const rim=new THREE.DirectionalLight('#cfe0ff',1.6);rim.position.set(-3,2,-3);scene.add(rim);
scene.add(new THREE.AmbientLight('#ffffff',0.15));
// floor disc
const floor=new THREE.Mesh(new THREE.CircleGeometry(0.9,48),new THREE.MeshStandardMaterial({color:'#1a1d1b',roughness:.9}));floor.rotation.x=-Math.PI/2;scene.add(floor);
const ring=new THREE.Mesh(new THREE.RingGeometry(0.88,0.9,64),new THREE.MeshBasicMaterial({color:'#b9a88a',transparent:true,opacity:.5}));ring.rotation.x=-Math.PI/2;ring.position.y=0.002;scene.add(ring);

const skin=new THREE.MeshPhysicalMaterial({color:'#dcb08c',roughness:.55,metalness:0,sheen:.6,sheenRoughness:.6,sheenColor:new THREE.Color('#ffd9c2'),clearcoat:.15,clearcoatRoughness:.6});
const cloth=new THREE.MeshStandardMaterial({color:'#121212',roughness:.85});
const body=new THREE.Group();scene.add(body);
const parts={};
function capsuleBetween(a,b,r,mat,name,seg=20){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);const len=A.distanceTo(B);
 const g=new THREE.CapsuleGeometry(r,len,8,seg);const m=new THREE.Mesh(g,mat);m.position.copy(A).add(B).multiplyScalar(.5);
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());body.add(m);if(name)parts[name]=m;return m}
// torso: lathe, flattened in z
const prof=[[0.001,0.86],[0.15,0.87],[0.172,0.93],[0.168,1.0],[0.142,1.08],[0.14,1.13],[0.158,1.22],[0.178,1.3],[0.19,1.37],[0.175,1.43],[0.12,1.47],[0.062,1.5],[0.055,1.52],[0.001,1.53]].map(p=>new THREE.Vector2(p[0],p[1]));
const torsoG=new THREE.LatheGeometry(prof,48);torsoG.scale(1,1,.62);torsoG.computeVertexNormals();
const torso=new THREE.Mesh(torsoG,skin);body.add(torso);parts.torso=torso;
// chest shaping: two subtle pecs

// shoulders
for(const s of [-1,1]){const d=new THREE.Mesh(new THREE.SphereGeometry(.06,24,16),skin);d.position.set(s*.195,1.41,0);d.scale.set(1,.85,.9);body.add(d)}
// neck + head
const neck=capsuleBetween([0,1.47,0],[0,1.6,0.005],.052,skin,'neck');
const head=new THREE.Mesh(new THREE.SphereGeometry(.1,40,30),skin);head.scale.set(.92,1.18,1.02);head.position.set(0,1.71,.01);body.add(head);

// arms (slight A pose)
const L={sh:[-0.215,1.41,0],el:[-0.29,1.13,-0.01],wr:[-0.33,0.88,0.03]};
const R={sh:[0.215,1.41,0],el:[0.29,1.13,-0.01],wr:[0.33,0.88,0.03]};
capsuleBetween(R.sh,R.el,.05,skin,'arm');capsuleBetween(L.sh,L.el,.05,skin,'armL');
capsuleBetween(R.el,R.wr,.041,skin,'forearm');capsuleBetween(L.el,L.wr,.041,skin,'forearmL');
for(const W of [L.wr,R.wr]){const h=new THREE.Mesh(new THREE.SphereGeometry(.045,20,14),skin);h.scale.set(.6,1.35,1);h.position.set(W[0]*1.02,W[1]-.07,W[2]);body.add(h)}
// legs
const RL={hp:[0.09,0.9,0],kn:[0.105,0.5,0.01],an:[0.11,0.1,-0.01]},LL={hp:[-0.09,0.9,0],kn:[-0.105,0.5,0.01],an:[-0.11,0.1,-0.01]};
capsuleBetween(RL.hp,RL.kn,.078,skin,'leg');capsuleBetween(LL.hp,LL.kn,.078,skin,'legL');
capsuleBetween(RL.kn,RL.an,.056,skin,'shin');capsuleBetween(LL.kn,LL.an,.056,skin,'shinL');
for(const A of [RL.an,LL.an]){const f=new THREE.Mesh(new THREE.CapsuleGeometry(.04,.12,6,14),skin);f.rotation.x=Math.PI/2;f.position.set(A[0],.04,.05);body.add(f)}
// shorts
const sh=new THREE.Mesh(new THREE.CylinderGeometry(.178,.19,.2,40,1,true),cloth);sh.scale.z=.68;sh.position.y=.9;body.add(sh);
for(const s of [-1,1]){const t=new THREE.Mesh(new THREE.CylinderGeometry(.088,.096,.14,28),cloth);t.position.set(s*.092,.79,0);t.rotation.z=s*-.04;body.add(t)}

/* placements: mesh, local surface point direction, camera */
const P={
 chest:{mesh:'torso',from:[0.07,1.33,1],to:[0.07,1.33,0],cam:[0.35,1.38,1.25],tgt:[0.04,1.3,0],size:.15,label:'Chest'},
 back:{mesh:'torso',from:[0,1.28,-1],to:[0,1.28,0],cam:[-0.2,1.35,-1.45],tgt:[0,1.22,0],size:.2,label:'Back',flip:true},
 arm:{mesh:'arm',from:[1.2,1.27,0.05],to:[0.25,1.27,0],cam:[1.05,1.32,0.55],tgt:[0.26,1.26,0],size:.1,label:'Upper arm'},
 forearm:{mesh:'forearm',from:[0.31,1.0,1],to:[0.31,1.0,0.01],cam:[0.75,1.08,0.85],tgt:[0.31,1.0,0],size:.085,label:'Forearm'},
 leg:{mesh:'leg',from:[0.1,0.66,1],to:[0.1,0.66,0],cam:[0.5,0.72,1.2],tgt:[0.1,0.66,0],size:.13,label:'Leg'},
 neck:{mesh:'neck',from:[0.6,1.55,0.2],to:[0,1.55,0],cam:[0.75,1.6,0.6],tgt:[0.02,1.56,0],size:.07,label:'Neck'},
};
// textures for designs
const texCache={};
function designTex(name){if(texCache[name])return Promise.resolve(texCache[name]);
 return new Promise(res=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.drawImage(img,0,0,512,512);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;texCache[name]=t;res(t)};img.src='img/d-'+name+'.svg'})}
const decalMat=new THREE.MeshStandardMaterial({color:'#ffffff',transparent:true,depthTest:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,roughness:.6,opacity:.92});
let decal=null;const state={part:'forearm',design:'rose',scale:1,rot:0};
const ray=new THREE.Raycaster();
function place(){const cfg=P[state.part];const mesh=parts[cfg.mesh];body.updateMatrixWorld(true);
 const from=new THREE.Vector3(...cfg.from),to=new THREE.Vector3(...cfg.to);ray.set(from,to.clone().sub(from).normalize());
 const hit=ray.intersectObject(mesh,false)[0];if(!hit)return;
 const n=hit.face.normal.clone().transformDirection(mesh.matrixWorld).normalize();
 const o=new THREE.Object3D();o.position.copy(hit.point);o.lookAt(hit.point.clone().add(n));o.rotateZ(state.rot*Math.PI/180+(cfg.flip?0:0));
 const s=cfg.size*state.scale;const g=new DecalGeometry(mesh,hit.point,o.rotation,new THREE.Vector3(s,s,s*1.6));
 if(decal){decal.geometry.dispose();scene.remove(decal)}
 decal=new THREE.Mesh(g,decalMat);scene.add(decal);dirty=true}
async function setDesign(n){state.design=n;decalMat.map=await designTex(n);decalMat.needsUpdate=true;place()}
// camera & controls
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.45;controls.maxDistance=3.2;controls.target.set(0,.95,0);
camera.position.set(1.0,1.2,isPhone?3.6:2.9);
let anim=null;
function goPart(p){const cfg=P[p];const c0=camera.position.clone(),t0=controls.target.clone();const c1=new THREE.Vector3(...cfg.cam),t1=new THREE.Vector3(...cfg.tgt);
 if(isPhone){c1.sub(t1).multiplyScalar(1.25).add(t1)}
 const st=performance.now();anim=(now)=>{const k=Math.min(1,(now-st)/900),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;camera.position.lerpVectors(c0,c1,e);controls.target.lerpVectors(t0,t1,e);if(k>=1)anim=null}}
let dirty=true;controls.addEventListener('change',()=>dirty=true);
function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();dirty=true}
new ResizeObserver(resize).observe(canvas);resize();
let visible=true;new IntersectionObserver(e=>{visible=e[0].isIntersecting}).observe(canvas);
function loop(now){requestAnimationFrame(loop);if(!visible)return;if(anim){anim(now);dirty=true}if(controls.update())dirty=true;if(!dirty)return;dirty=false;renderer.render(scene,camera)}
requestAnimationFrame(loop);
// UI
const partName=document.getElementById('partName'),bkPart=document.getElementById('bkPart');
document.getElementById('parts').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;document.querySelectorAll('#parts button').forEach(x=>x.classList.toggle('on',x===b));state.part=b.dataset.p;partName.textContent=P[state.part].label;place();goPart(state.part);[...bkPart.options].forEach(o=>{if(o.text===P[state.part].label)bkPart.value=o.text})});
document.getElementById('designs').addEventListener('click',e=>{const b=e.target.closest('.dz');if(!b)return;document.querySelectorAll('.dz').forEach(x=>x.classList.toggle('on',x===b));setDesign(b.dataset.d)});
const sc=document.getElementById('scale'),rt=document.getElementById('rot');
sc.addEventListener('input',()=>{state.scale=sc.value/100;document.getElementById('sv').textContent=sc.value+'%';place()});
rt.addEventListener('input',()=>{state.rot=+rt.value;document.getElementById('rv').textContent=rt.value+'°';place()});
document.getElementById('skins').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;document.querySelectorAll('#skins button').forEach(x=>x.classList.toggle('on',x===b));skin.color.set(b.dataset.c);dirty=true});
document.getElementById('desc').addEventListener('submit',e=>{e.preventDefault();const v=document.getElementById('descIn').value.trim();const n=document.getElementById('descNote');n.hidden=false;n.textContent=v?`Lovely idea. Our artists will sketch "${v}" for you at your consultation, then you can preview it here.`:'Write a few words about your idea first.';if(v)document.getElementById('bkIdea').value=v});
document.getElementById('bk').addEventListener('submit',e=>{e.preventDefault();document.getElementById('bkOk').hidden=false;e.target.querySelector('button[type=submit]').textContent='Request sent'});
setDesign('rose');
// nav + motion
const nav=document.querySelector('.nav');addEventListener('scroll',()=>nav.classList.toggle('solid',scrollY>60),{passive:true});
if(window.gsap&&window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);
 gsap.to('.hero-bg img',{scale:1,yPercent:8,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
 gsap.from('.hero-in>*',{y:30,opacity:0,duration:1,stagger:.12,ease:'power3.out'});
 gsap.fromTo('.fv-img img',{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{trigger:'.forever',start:'top bottom',end:'bottom top',scrub:true}});
 gsap.utils.toArray('.fv-txt>*,.pv-head>*,.ar-grid article,.bk-txt>*').forEach(el=>gsap.from(el,{y:36,opacity:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%'}}));
}
window.__tt={state,goPart,place,parts};
