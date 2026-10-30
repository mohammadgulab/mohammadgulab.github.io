import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const hero=document.querySelector('.hero3d'), canvas=document.getElementById('gl'), slot=document.getElementById('glSlot');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
}catch(e){hero.classList.add('no-gl');hero.classList.remove('gl-pending');}
if(renderer)init();
function init(){
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(35,1,0.1,100);camera.position.set(0,0,12);
// lights
scene.add(new THREE.HemisphereLight(0xffffff,0xb9a887,1.25));
const key=new THREE.DirectionalLight(0xfff3dc,2.6);key.position.set(4,6,6);scene.add(key);
const rim=new THREE.PointLight(0xff3b30,40,30);rim.position.set(-5,-2,3);scene.add(rim);
const fill=new THREE.PointLight(0xffd60a,18,30);fill.position.set(5,-4,4);scene.add(fill);

const root=new THREE.Group();scene.add(root);      // positioned on the slot
const spin=new THREE.Group();root.add(spin);        // drag / tilt / scroll rotation
// main object: yellow torus knot
const knotMat=new THREE.MeshStandardMaterial({color:0xffd60a,roughness:.28,metalness:.18,flatShading:false});
const knot=new THREE.Mesh(new THREE.TorusKnotGeometry(1.05,.36,220,32,2,3),knotMat);spin.add(knot);
// ink cage
const cageGeo=new THREE.IcosahedronGeometry(2.25,1);
const cage=new THREE.LineSegments(new THREE.EdgesGeometry(cageGeo),new THREE.LineBasicMaterial({color:0x141414,transparent:true,opacity:.55}));
spin.add(cage);
const nodes=new THREE.Points(cageGeo,new THREE.PointsMaterial({color:0xff3b30,size:.09,sizeAttenuation:true}));
cage.add(nodes);
// orbit ring
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.9,.025,8,160),new THREE.MeshBasicMaterial({color:0x141414}));
ring.rotation.x=Math.PI*.42;spin.add(ring);
// satellites
const sats=[];
const satDefs=[
 [new THREE.SphereGeometry(.28,32,24),new THREE.MeshStandardMaterial({color:0xff3b30,roughness:.3}),2.9,0],
 [new THREE.BoxGeometry(.42,.42,.42),new THREE.MeshStandardMaterial({color:0x161616,roughness:.4,metalness:.3}),2.9,2.1],
 [new THREE.OctahedronGeometry(.32),new THREE.MeshStandardMaterial({color:0xfbf6ea,roughness:.35,flatShading:true}),2.9,4.2]];
satDefs.forEach(([g,m,r,a])=>{const s=new THREE.Mesh(g,m);s.userData={r,a};ring.add(s);sats.push(s);});
// dust field
const N=380, pos=new Float32Array(N*3);
for(let i=0;i<N;i++){const r=3.4+Math.random()*3.2,t=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1);pos[i*3]=r*Math.sin(p)*Math.cos(t);pos[i*3+1]=r*Math.sin(p)*Math.sin(t)*.7;pos[i*3+2]=r*Math.cos(p)*.6;}
const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(pos,3));
const dust=new THREE.Points(dg,new THREE.PointsMaterial({color:0x141414,size:.035,transparent:true,opacity:.6}));root.add(dust);
// soft contact shadow
const sc=document.createElement('canvas');sc.width=sc.height=128;const sx=sc.getContext('2d');
const gr=sx.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(20,18,14,.45)');gr.addColorStop(1,'rgba(20,18,14,0)');sx.fillStyle=gr;sx.fillRect(0,0,128,128);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(5,1.4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false}));
shadow.position.y=-3.3;root.add(shadow);

// layout: put the object on the slot element
let W=1,H=1,baseScale=1;
function layout(){
  const r=hero.getBoundingClientRect();W=r.width;H=r.height;
  renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();
  const s=slot.getBoundingClientRect();
  const cx=(s.left+s.width/2-r.left)/W*2-1, cy=-((s.top+s.height/2-r.top)/H*2-1);
  const vh=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.z, vw=vh*camera.aspect;
  root.position.set(cx*vw/2,cy*vh/2,0);
  const fitPx=Math.max(Math.min(s.width,s.height*1.15),180);   // px the object may use
  baseScale=(fitPx/W*vw)/7.0;
  if(W>=900) baseScale*=1.08;
}
addEventListener('resize',layout);layout();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(layout);
setTimeout(layout,600);

// interaction state
let rotX=0,rotY=0,velX=0,velY=0,drag=null,tiltX=0,tiltY=0,ptrX=0,ptrY=0,pulse=0,scrollP=0;
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,t:performance.now(),moved:0};velX=velY=0;askTilt();});
addEventListener('pointermove',e=>{
  if(e.pointerType==='mouse'){ptrX=e.clientX/innerWidth*2-1;ptrY=e.clientY/innerHeight*2-1;}
  if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);
  velY=dx*.006;velX=dy*.004;rotY+=velY;rotX+=velX;drag.x=e.clientX;drag.y=e.clientY;
},{passive:true});
const up=()=>{if(drag&&drag.moved<8)pulse=1;drag=null;};
addEventListener('pointerup',up);addEventListener('pointercancel',()=>{drag=null;});
// touch drag also works while the page scrolls vertically (pan-y)
let tp=null;
canvas.addEventListener('touchstart',e=>{const t=e.touches[0];tp={x:t.clientX,y:t.clientY};},{passive:true});
canvas.addEventListener('touchmove',e=>{if(!tp)return;const t=e.touches[0];const dx=t.clientX-tp.x,dy=t.clientY-tp.y;velY=dx*.007;velX=dy*.003;rotY+=velY;rotX+=velX;tp={x:t.clientX,y:t.clientY};},{passive:true});
canvas.addEventListener('touchend',()=>{tp=null;},{passive:true});
function onOri(e){if(e.gamma==null)return;tiltY=THREE.MathUtils.clamp(e.gamma/30,-1,1);tiltX=THREE.MathUtils.clamp((e.beta-45)/35,-1,1);}
let asked=false;
function askTilt(){if(asked)return;asked=true;const D=window.DeviceOrientationEvent;if(D&&typeof D.requestPermission==='function'){D.requestPermission().then(s=>{if(s==='granted')addEventListener('deviceorientation',onOri);}).catch(()=>{});}}
if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission!=='function')addEventListener('deviceorientation',onOri);
addEventListener('scroll',()=>{scrollP=Math.min(Math.max(scrollY/(H||1),0),1.4);},{passive:true});

// visibility: only render while hero is on screen
let visible=true;
new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)req();},{threshold:0}).observe(hero);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)req();});
let raf=0;const req=()=>{if(!raf)raf=requestAnimationFrame(tick);};
const clock=new THREE.Clock();let t=0,intro=0;
const ease=x=>1-Math.pow(1-x,4);
const back=x=>{const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);};
function tick(){
  raf=0;const dt=Math.min(clock.getDelta(),.05);
  const speed=reduce?0:1;
  t+=dt*speed;intro=Math.min(intro+dt/1.6,1);
  if(!drag&&!tp){velX*=.94;velY*=.94;rotX+=velX;rotY+=velY;rotX*=.985;}
  pulse*=.92;
  const sp=scrollP;
  spin.rotation.y=rotY+t*.35+sp*2.2+tiltY*.5+ptrX*.35;
  spin.rotation.x=rotX+Math.sin(t*.6)*.18+tiltX*.35+ptrY*.25+sp*.6;
  knot.rotation.x=t*.55;knot.rotation.y=t*.8;
  cage.rotation.y=-t*.25;cage.rotation.z=t*.12;
  const k=back(Math.max(0,Math.min(1,(intro-.05)/.95)));
  const s=baseScale*(reduce?1:k)*(1+pulse*.18)*(1-sp*.25);
  root.scale.setScalar(Math.max(s,0.0001));
  cage.scale.setScalar(1+sp*.35+pulse*.25);
  cage.material.opacity=.55*ease(intro);
  ring.rotation.z=t*.5;
  sats.forEach((m,i)=>{const r=m.userData.r*(1+sp*.5+pulse*.4),a=m.userData.a+t*(.9+i*.15);m.position.set(Math.cos(a)*r,Math.sin(a)*r,0);m.rotation.x=t*1.3;m.rotation.y=t*1.1;});
  dust.rotation.y=t*.05+sp*.8;dust.rotation.x=sp*.3;
  root.position.y+=0;
  shadow.material.opacity=.9*(1-sp*.6);
  knot.position.y=Math.sin(t*1.2)*.12;
  renderer.render(scene,camera);
  if(visible&&!document.hidden)req();
}
req();
hero.classList.add('gl-ready');hero.classList.remove('gl-pending');
window.__gl={get t(){return t;},pulse:()=>{pulse=1;}};
}
