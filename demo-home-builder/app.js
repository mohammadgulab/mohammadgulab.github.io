import * as THREE from 'three';
const Q=new URLSearchParams(location.search);
const RENDER=Q.get('render'); // project thumbnail mode
const canvas=document.getElementById('scene');
const isPhone=matchMedia('(max-width:700px)').matches;
const renderer=new THREE.WebGLRenderer({canvas,antialias:!isPhone,preserveDrawingBuffer:!!RENDER,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,isPhone?1.3:1.6));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.localClippingEnabled=true;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(36,1,0.1,400);
const lerp=(a,b,t)=>a+(b-a)*t, clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const sm=t=>{t=clamp(t);return t*t*(3-2*t)};
const seg=(v,a,b)=>sm((v-a)/(b-a));

/* ---------- textures ---------- */
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;if(rep)t.repeat.set(rep[0],rep[1]);t.anisotropy=4;return t}
const rnd=(()=>{let s=7;return()=>{s=(s*16807)%2147483647;return s/2147483647}})();
const sidingTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=32){const gr=g.createLinearGradient(0,y,0,y+32);gr.addColorStop(0,'#d9dbdc');gr.addColorStop(.18,'#fdfdfd');gr.addColorStop(1,'#eceeee');g.fillStyle=gr;g.fillRect(0,y,w,32);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,y,w,2)}},[1.6,1.6]);
const osbTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#c9a46b';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){g.fillStyle=`hsla(${30+rnd()*12},${40+rnd()*25}%,${45+rnd()*28}%,.55)`;g.save();g.translate(rnd()*w,rnd()*h);g.rotate(rnd()*3);g.fillRect(-9,-2.5,18,5);g.restore()}g.strokeStyle='rgba(80,50,20,.5)';g.lineWidth=2;g.strokeRect(0,0,w,h)},[0.45,0.45]);
const shingleTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#2b2f35';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=21){const off=(y/21%2)*20;for(let x=-40;x<w;x+=40){const l=22+rnd()*12;g.fillStyle=`rgb(${l+6},${l+9},${l+14})`;g.fillRect(x+off+1,y+1,38,19)}g.fillStyle='rgba(0,0,0,.45)';g.fillRect(0,y+19,w,2)}},[3,3]);
const feltTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#3a3d42';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=32){g.fillStyle='rgba(255,255,255,.08)';g.fillRect(0,y,w,2)}for(let i=0;i<400;i++){g.fillStyle=`rgba(0,0,0,${rnd()*.25})`;g.fillRect(rnd()*w,rnd()*h,2,2)}},[3,3]);
const groundTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#808080';g.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const l=100+rnd()*80;g.fillStyle=`rgba(${l},${l},${l},.5)`;g.fillRect(rnd()*w,rnd()*h,2+rnd()*3,2+rnd()*3)}},[18,18]);
const concreteTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#a7a8a6';g.fillRect(0,0,w,h);for(let i=0;i<3000;i++){const l=140+rnd()*60;g.fillStyle=`rgba(${l},${l},${l-4},.35)`;g.fillRect(rnd()*w,rnd()*h,2,2)}},[2,2]);

/* ---------- sky ---------- */
const skyU={top:{value:new THREE.Color('#0a1830')},mid:{value:new THREE.Color('#123058')},bot:{value:new THREE.Color('#1b3d6b')}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(200,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:skyU,vertexShader:'varying vec3 vp;void main(){vp=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top,mid,bot;varying vec3 vp;void main(){float h=vp.y;vec3 c=h>0.08?mix(mid,top,smoothstep(.08,.6,h)):mix(bot,mid,smoothstep(-.05,.08,h));gl_FragColor=vec4(c,1.);}'}));
scene.add(sky);
scene.fog=new THREE.Fog('#1b3d6b',45,150);

/* ---------- lights ---------- */
const hemi=new THREE.HemisphereLight('#bcd6ff','#4a3b2a',0.5);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff2dc',2.2);sun.position.set(-18,26,22);sun.castShadow=true;
sun.shadow.mapSize.set(isPhone?1024:2048,isPhone?1024:2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:90});sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.03;scene.add(sun);
const porchLight=new THREE.PointLight('#ffb15c',0,14,1.6);porchLight.position.set(0.2,2.65,5.2);scene.add(porchLight);
const inLight=new THREE.PointLight('#ffc27a',0,18,1.5);inLight.position.set(1,2.2,1);scene.add(inLight);

/* ---------- ground & lot ---------- */
const groundMat=new THREE.MeshStandardMaterial({color:'#9c7d5b',map:groundTex,roughness:1});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(260,260),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(40,40,'#bfe6ff','#8fd0ff');grid.position.y=0.02;grid.material.transparent=true;grid.material.opacity=.35;scene.add(grid);
// survey stakes / plot outline in blueprint
const plotPts=[[-9,-8],[13,-8],[13,13],[-9,13],[-9,-8]].map(p=>new THREE.Vector3(p[0],0.04,p[1]));
const plotLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(plotPts),new THREE.LineDashedMaterial({color:'#9fdcff',dashSize:.6,gapSize:.35,transparent:true}));plotLine.computeLineDistances();scene.add(plotLine);
// driveway + path (appear at exterior/home)
const pave=new THREE.MeshStandardMaterial({color:'#cfc8bb',roughness:.9,map:concreteTex,transparent:true,opacity:0});
const drive=new THREE.Mesh(new THREE.PlaneGeometry(4.2,10),pave);drive.rotation.x=-Math.PI/2;drive.position.set(7.5,0.03,8);drive.receiveShadow=true;scene.add(drive);
const path=new THREE.Mesh(new THREE.PlaneGeometry(1.6,6.5),pave);path.rotation.x=-Math.PI/2;path.position.set(0.2,0.03,9.4);path.receiveShadow=true;scene.add(path);
// outer grass (beyond the plot) always there
{const sh=new THREE.Shape();sh.moveTo(-130,-130);sh.lineTo(130,-130);sh.lineTo(130,130);sh.lineTo(-130,130);sh.lineTo(-130,-130);const hl=new THREE.Path();hl.moveTo(-10,-9);hl.lineTo(-10,15);hl.lineTo(14,15);hl.lineTo(14,-9);hl.lineTo(-10,-9);sh.holes.push(hl);
 const og=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshStandardMaterial({color:'#5d8a3c',map:groundTex,roughness:1}));og.rotation.x=-Math.PI/2;og.position.y=0.012;og.receiveShadow=true;scene.add(og)}
// lawn
const lawnMat=new THREE.MeshStandardMaterial({color:'#5f8a3a',map:groundTex,roughness:1,transparent:true,opacity:0});
const lawn=new THREE.Mesh(new THREE.CircleGeometry(30,48),lawnMat);lawn.rotation.x=-Math.PI/2;lawn.position.set(2,0.016,4);lawn.receiveShadow=true;scene.add(lawn);

// trees ring
const treeG=new THREE.Group();scene.add(treeG);
const leafM=new THREE.MeshStandardMaterial({color:'#4a7434',roughness:.95,flatShading:true});
const trunkM=new THREE.MeshStandardMaterial({color:'#4a3626',roughness:1});
function tree(x,z,s){const g=new THREE.Group();const tr=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.28*s,3*s,6),trunkM);tr.position.y=1.5*s;g.add(tr);
 for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry((1.7-i*.35)*s,0),leafM);b.position.set((rnd()-.5)*.9*s,(3+i*1.25)*s,(rnd()-.5)*.9*s);b.castShadow=true;g.add(b)}
 tr.castShadow=true;g.position.set(x,0,z);treeG.add(g)}
for(let i=0;i<34;i++){const a=-Math.PI*.05+ (i/34)*Math.PI*1.25+Math.PI*.95;const r=19+rnd()*16;const x=4+Math.cos(a)*r,z=-2+Math.sin(a)*r*0.8;if(z>10&&x>-4)continue;tree(x,z,1+rnd()*.7)}
for(let i=0;i<10;i++){tree(-14-rnd()*10,-2+rnd()*20,1+rnd()*.5)}

/* ---------- house definition ---------- */
// main block x -5..5, z -4..4, walls 0.2..6.2 ; wing x 5..10.5, z -3..3, 0.2..3.4 ; porch slab x -2..2.4 z 4..6.4
const SLAB=0.25;
const H1=3.1, H=SLAB+H1*2; // main eave
const RISE=2.9, WRISE=1.9;
const walls=[
 // [x0,z0,x1,z1, y0, height, openings[[u0,u1,v0,v1,type]]]
 {p:[-5,4,5,4],y0:SLAB,h:H1*2,o:[[1.0,2.6,.95,2.45,'w'],[4.7,5.9,0,2.35,'d'],[6.9,8.9,.95,2.45,'w'],[1.0,2.6,H1+.8,H1+2.3,'w'],[4.4,6.1,H1+.8,H1+2.3,'w'],[7.4,8.9,H1+.8,H1+2.3,'w']]},
 {p:[5,-4,-5,-4],y0:SLAB,h:H1*2,o:[[2,4,1,2.4,'w'],[6,8,1,2.4,'w'],[2,4,H1+.8,H1+2.2,'w'],[6,8,H1+.8,H1+2.2,'w']]},
 {p:[-5,-4,-5,4],y0:SLAB,h:H1*2,o:[[3,5,1,2.4,'w'],[3,5,H1+.8,H1+2.2,'w']]},
 {p:[5,4,5,-4],y0:SLAB,h:H1*2,o:[[0.4,1.0,H1+.8,H1+2.2,'w']]},
 {p:[5,3,10.5,3],y0:SLAB,h:H1,o:[[1,4.4,0,2.5,'g']]},
 {p:[10.5,3,10.5,-3],y0:SLAB,h:H1,o:[[2,4,1,2.3,'w']]},
 {p:[10.5,-3,5,-3],y0:SLAB,h:H1,o:[]},
];
// gables: triangles [cx,cz, axis('x' normal direction), width, base y, rise]
const gables=[
 {pos:[-5,0],nrm:'x',w:8,y:SLAB+H1*2,r:RISE},{pos:[5,0],nrm:'x',w:8,y:SLAB+H1*2,r:RISE},
 {pos:[7.75,3],nrm:'z',w:6.0,y:SLAB+H1,r:WRISE},{pos:[7.75,-3],nrm:'z',w:6.0,y:SLAB+H1,r:WRISE},
];
const T=0.22;// wall thickness
const house=new THREE.Group();scene.add(house);
const clipSheath=new THREE.Plane(new THREE.Vector3(0,-1,0),0);
const clipSide=new THREE.Plane(new THREE.Vector3(0,-1,0),0);
const clipRoofF=new THREE.Plane(new THREE.Vector3(0,-1,0),0);
const clipRoofS=new THREE.Plane(new THREE.Vector3(0,-1,0),0);
const matOSB=new THREE.MeshStandardMaterial({color:'#fff',map:osbTex,roughness:.85,clippingPlanes:[clipSheath],side:THREE.DoubleSide});
const matSide=new THREE.MeshStandardMaterial({color:'#ffffff',map:sidingTex,roughness:.6,clippingPlanes:[clipSide]});
const matFelt=new THREE.MeshStandardMaterial({color:'#fff',map:feltTex,roughness:.9,clippingPlanes:[clipRoofF]});
const matShingle=new THREE.MeshStandardMaterial({color:'#fff',map:shingleTex,roughness:.7,clippingPlanes:[clipRoofS]});
const matTrim=new THREE.MeshStandardMaterial({color:'#f4f4f2',roughness:.5,clippingPlanes:[clipSide]});
const matDark=new THREE.MeshStandardMaterial({color:'#1d2127',roughness:.5,metalness:.3,clippingPlanes:[clipSide]});
const glassMat=new THREE.MeshStandardMaterial({color:'#1b2a38',roughness:.08,metalness:.6,emissive:'#ffb766',emissiveIntensity:0,clippingPlanes:[clipSide]});
const doorMat=new THREE.MeshStandardMaterial({color:'#6b4a2f',roughness:.55,clippingPlanes:[clipSide]});
const garageMat=new THREE.MeshStandardMaterial({color:'#e9e9e6',roughness:.5,clippingPlanes:[clipSide]});
const bpMat=new THREE.LineBasicMaterial({color:'#e8f7ff',transparent:true,opacity:1,depthWrite:false});
const bpFace=new THREE.MeshBasicMaterial({color:'#5cb8ff',transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
const bpGroup=new THREE.Group();scene.add(bpGroup);
const siding=new THREE.Group(),sheath=new THREE.Group(),roofF=new THREE.Group(),roofS=new THREE.Group(),details=new THREE.Group();
house.add(siding,sheath,roofF,roofS,details);
const addBP=(geo,obj,face=true)=>{const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo,20),bpMat);e.position.copy(obj.position);e.rotation.copy(obj.rotation);e.scale.copy(obj.scale);bpGroup.add(e);if(face){const f=new THREE.Mesh(geo,bpFace);f.position.copy(obj.position);f.rotation.copy(obj.rotation);f.renderOrder=2;bpGroup.add(f)}};

function wallMesh(wl,thick,mat,offset){
 const [x0,z0,x1,z1]=wl.p;const L=Math.hypot(x1-x0,z1-z0);
 const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(L,0);s.lineTo(L,wl.h);s.lineTo(0,wl.h);s.lineTo(0,0);
 for(const o of wl.o){const hh=new THREE.Path();const v0=Math.max(o[2],0.001);hh.moveTo(o[0],v0);hh.lineTo(o[1],v0);hh.lineTo(o[1],o[3]);hh.lineTo(o[0],o[3]);hh.lineTo(o[0],v0);s.holes.push(hh)}
 const g=new THREE.ExtrudeGeometry(s,{depth:thick,bevelEnabled:false});
 const m=new THREE.Mesh(g,mat);
 const ang=Math.atan2(z1-z0,x1-x0);
 // local x along wall, extrude along +z local => outward normal: rotate so that local +z points outward (right-hand of direction for CCW? walls listed clockwise seen from top with outward = left)
 m.rotation.y=-ang;m.position.set(x0,wl.y0,z0);
 // outward normal = (dz,-dx)/L rotated... compute: local z after rotation.y=-ang -> (sin(-ang)... ) we offset along it
 const nx=Math.sin(-ang),nz=Math.cos(-ang);m.position.x+=nx*offset;m.position.z+=nz*offset;
 m.castShadow=true;m.receiveShadow=true;return m}
function gableMesh(gb,thick,mat,offset){
 const s=new THREE.Shape();s.moveTo(-gb.w/2,0);s.lineTo(gb.w/2,0);s.lineTo(0,gb.r);s.lineTo(-gb.w/2,0);
 const g=new THREE.ExtrudeGeometry(s,{depth:thick,bevelEnabled:false});const m=new THREE.Mesh(g,mat);
 if(gb.nrm==='x'){m.rotation.y=Math.sign(gb.pos[0])*Math.PI/2;m.position.set(gb.pos[0]+Math.sign(gb.pos[0])*offset-Math.sign(gb.pos[0])*thick*0+ (gb.pos[0]<0?0:0),gb.y,gb.pos[1]);}
 else{const sg=Math.sign(gb.pos[1]);m.rotation.y=sg>0?0:Math.PI;m.position.set(gb.pos[0],gb.y,gb.pos[1]+sg*offset);}
 m.castShadow=true;m.receiveShadow=true;return m}
// sheathing (outer face), siding slightly outside
for(const w of walls){sheath.add(wallMesh(w,0.06,matOSB,0.0));const sm_=wallMesh(w,0.05,matSide,0.06);siding.add(sm_);addBP(sm_.geometry,sm_)}
for(const gb of gables){sheath.add(gableMesh(gb,0.06,matOSB,0));const g2=gableMesh(gb,0.05,matSide,0.06);siding.add(g2);addBP(g2.geometry,g2)}
// fix gable on x: ExtrudeGeometry depth goes local +z; for rotation y=+-90 local z maps to +-x outward: ok
// roofs
function roof(cx,cz,len,half,baseY,rise,axis,over=0.5,parent,mat,th=0.14){
 const run=half+over, slope=Math.atan2(rise,half), L=Math.hypot(run,run*Math.tan(slope));
 for(const side of [-1,1]){
  const g=new THREE.BoxGeometry(axis==='x'?len+over*2:L,th,axis==='x'?L:len+over*2);
  const m=new THREE.Mesh(g,mat);
  const midRun=(half-over)/2; // center horizontal distance from ridge... compute center
  const cxr=side*(run/2- (over)) ; // horizontal offset from ridge line of slab center
  const cy=baseY+rise - (run/2)*Math.tan(slope) + th/2 + (over*Math.tan(slope))*0;
  const hoff=side*(run/2);
  const yC=baseY+rise-(run/2)*Math.tan(slope)+0.08;
  if(axis==='x'){m.position.set(cx,yC,cz+hoff);m.rotation.x=side*slope}else{m.position.set(cx+hoff,yC,cz);m.rotation.z=-side*slope}
  m.castShadow=true;m.receiveShadow=true;parent.add(m);if(parent===roofS)addBP(g,m)}
}
const mainRoofY=SLAB+H1*2, wingRoofY=SLAB+H1;
for(const [par,mat,th] of [[roofF,matFelt,.13],[roofS,matShingle,.17]]){
 roof(0,0,10,4,mainRoofY,RISE,'x',0.55,par,mat,th);
 roof(7.9,0,5.5,3,wingRoofY,WRISE,'z',0.5,par,mat,th);
 roof(0.2,5.3,2.6,2.3,SLAB+2.9,1.0,'z',0.35,par,mat,th);
}
// porch slab, steps, posts (posts are framing-ish then trimmed)
const concMat=new THREE.MeshStandardMaterial({color:'#b9b8b3',map:concreteTex,roughness:.9});
const slabGroup=new THREE.Group();scene.add(slabGroup);
function slab(x0,x1,z0,z1,h=SLAB){const g=new THREE.BoxGeometry(x1-x0,h,z1-z0);const m=new THREE.Mesh(g,concMat);m.position.set((x0+x1)/2,h/2,(z0+z1)/2);m.receiveShadow=true;m.castShadow=true;slabGroup.add(m);addBP(g,m,false);return m}
slab(-5.15,5.15,-4.15,4.15);slab(5,10.65,-3.15,3.15);slab(-2.2,2.6,4.1,6.5,0.22);
const step=new THREE.Mesh(new THREE.BoxGeometry(2,0.11,0.5),concMat);step.position.set(0.2,0.055,6.75);step.castShadow=step.receiveShadow=true;slabGroup.add(step);
// window & door details in exterior
function along(wl,u,v,out){const [x0,z0,x1,z1]=wl.p;const L=Math.hypot(x1-x0,z1-z0);const dx=(x1-x0)/L,dz=(z1-z0)/L;const ang=Math.atan2(z1-z0,x1-x0);const nx=Math.sin(-ang),nz=Math.cos(-ang);return {x:x0+dx*u+nx*out,y:wl.y0+v,z:z0+dz*u+nz*out,ry:-ang}}
const glassList=[];
for(const w of walls){for(const o of w.o){const cu=(o[0]+o[1])/2,cv=(o[2]+o[3])/2,ow=o[1]-o[0],oh=o[3]-o[2];const P=along(w,cu,cv,0.04);
 if(o[4]==='w'){const fr=new THREE.Group();fr.position.set(P.x,P.y,P.z);fr.rotation.y=P.ry;
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(ow,oh),glassMat);gl.position.z=0.02;fr.add(gl);glassList.push(gl);
  const bars=[[ow+.16,.12,0,oh/2+.02],[ow+.16,.16,0,-oh/2-.04],[.1,oh,-ow/2-.03,0],[.1,oh,ow/2+.03,0],[.06,oh,0,0],[ow,.05,0,0]];
  for(const b of bars){const m=new THREE.Mesh(new THREE.BoxGeometry(b[0],b[1],.14),b===bars[4]||b===bars[5]?matDark:matTrim);m.position.set(b[2],b[3],.06);m.castShadow=true;fr.add(m)}
  details.add(fr)}
 else if(o[4]==='d'){const fr=new THREE.Group();fr.position.set(P.x,P.y,P.z-0.02);fr.rotation.y=P.ry;const d=new THREE.Mesh(new THREE.BoxGeometry(ow-.1,oh,.08),doorMat);fr.add(d);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(.3,oh-.6),glassMat);gl.position.set(-ow/2+.35,0,.05);fr.add(gl);glassList.push(gl);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),new THREE.MeshStandardMaterial({color:'#c9a45a',metalness:1,roughness:.3,clippingPlanes:[clipSide]}));knob.position.set(ow/2-.25,0,.08);fr.add(knob);
  for(const b of [[ow+.2,.14,0,oh/2+.07],[.12,oh,-ow/2,0],[.12,oh,ow/2,0]]){const m=new THREE.Mesh(new THREE.BoxGeometry(b[0],b[1],.16),matTrim);m.position.set(b[2],b[3],.05);fr.add(m)}
  details.add(fr)}
 else if(o[4]==='g'){const m=new THREE.Mesh(new THREE.BoxGeometry(ow,oh,.08),garageMat);m.position.set(P.x,P.y,P.z-.06);m.rotation.y=P.ry;m.castShadow=true;details.add(m);
  for(let i=1;i<4;i++){const l=new THREE.Mesh(new THREE.BoxGeometry(ow-.1,.03,.1),matTrim);l.position.set(P.x,P.y-oh/2+i*oh/4,P.z-.02);details.add(l)}}
}}
// corner trims + fascia
for(const c of [[-5,4],[5,4],[-5,-4],[10.5,3]]){const h=c[0]===10.5?H1:H1*2;const m=new THREE.Mesh(new THREE.BoxGeometry(.24,h,.24),matTrim);m.position.set(c[0]+(c[0]<0?-.05:.05),SLAB+h/2,c[1]+(c[1]>0?.05:-.05));m.castShadow=true;details.add(m)}
const band=new THREE.Mesh(new THREE.BoxGeometry(10.3,.22,.1),matTrim);band.position.set(0,SLAB+H1,4.16);details.add(band);
// porch posts + lantern
const postMat=new THREE.MeshStandardMaterial({color:'#f2f2ef',roughness:.5});
const posts=[];for(const x of [-1.8,2.2]){const p=new THREE.Mesh(new THREE.BoxGeometry(.24,2.7,.24),postMat);p.position.set(x,SLAB+1.35,6.25);p.castShadow=true;scene.add(p);posts.push(p)}
const lantern=new THREE.Mesh(new THREE.BoxGeometry(.18,.32,.14),new THREE.MeshStandardMaterial({color:'#222',emissive:'#ffb15c',emissiveIntensity:0,clippingPlanes:[clipSide]}));lantern.position.set(-0.75,SLAB+1.9,4.32);details.add(lantern);
const lantern2=lantern.clone();lantern2.position.x=1.75;details.add(lantern2);

/* ---------- framing (instanced) ---------- */
const studs=[];// {x,y,z,sx,sy,sz,ry,rx,rz}
const ST=0.09;
function frameWall(wl,y0,h,offsetIn=-0.11){const [x0,z0,x1,z1]=wl.p;const L=Math.hypot(x1-x0,z1-z0);
 const op=wl.o.filter(o=>!(o[2]>=h+ (y0-wl.y0)) && !(o[3]<=y0-wl.y0));
 const pos=[];for(let u=0.05;u<=L-0.04;u+=0.6)pos.push(u);pos.push(L-0.05);
 for(const u of pos){let segs=[[0,h]];for(const o of wl.o){const a=o[2]-(y0-wl.y0),b=o[3]-(y0-wl.y0);if(u>o[0]-.02&&u<o[1]+.02&&b>0&&a<h){segs=segs.flatMap(([s0,s1])=>{const r=[];if(a>s0)r.push([s0,Math.min(a,s1)]);if(b<s1)r.push([Math.max(b,s0),s1]);return r})}}
  for(const [s0,s1] of segs){if(s1-s0<0.05)continue;const P=along(wl,u,(y0-wl.y0)+(s0+s1)/2,offsetIn);studs.push({x:P.x,y:P.y,z:P.z,sx:ST,sy:s1-s0,sz:0.16,ry:P.ry})}}
 // plates
 for(const v of [0.04,h-0.04,h-0.12]){const P=along(wl,L/2,(y0-wl.y0)+v,offsetIn);studs.push({x:P.x,y:P.y,z:P.z,sx:L,sy:0.07,sz:0.16,ry:P.ry})}
 // headers/sills
 for(const o of wl.o){const a=o[2]-(y0-wl.y0),b=o[3]-(y0-wl.y0);if(b<=0||a>=h)continue;const cu=(o[0]+o[1])/2;
  if(b<h){const P=along(wl,cu,(y0-wl.y0)+b+0.1,offsetIn);studs.push({x:P.x,y:P.y,z:P.z,sx:o[1]-o[0]+.2,sy:.2,sz:.16,ry:P.ry})}
  if(a>0.05){const P=along(wl,cu,(y0-wl.y0)+a-0.04,offsetIn);studs.push({x:P.x,y:P.y,z:P.z,sx:o[1]-o[0],sy:.07,sz:.16,ry:P.ry})}}
}
for(const w of walls){if(w.h>H1+0.1){frameWall(w,SLAB,H1);frameWall({...w},SLAB+H1,H1)}else frameWall(w,SLAB,H1)}
// floor joists second floor (along z)
for(let x=-4.85;x<=4.9;x+=0.6)studs.push({x,y:SLAB+H1-0.14,z:0,sx:.07,sy:.24,sz:7.8,ry:0});
// rafters main (span z) + gable studs
function rafters(cx,cz,len,half,baseY,rise,axis,over){const slope=Math.atan2(rise,half),run=half+over,Lr=run/Math.cos(slope);
 for(let t=-len/2-over+0.05;t<=len/2+over;t+=0.6){for(const side of [-1,1]){const yC=baseY+rise-(run/2)*Math.tan(slope)-0.02,hoff=side*run/2;
  if(axis==='x')studs.push({x:cx+t,y:yC,z:cz+hoff,sx:.07,sy:.2,sz:Lr,rx:side*slope});else studs.push({x:cx+hoff,y:yC,z:cz+t,sx:Lr,sy:.2,sz:.07,rz:-side*slope})}}
 // ridge
 if(axis==='x')studs.push({x:cx,y:baseY+rise-0.05,z:cz,sx:len+over*2,sy:.25,sz:.06});else studs.push({x:cx,y:baseY+rise-0.05,z:cz,sx:.06,sy:.25,sz:len+over*2});}
rafters(0,0,10,4,mainRoofY,RISE,'x',.45);rafters(7.9,0,5.5,3,wingRoofY,WRISE,'z',.4);rafters(0.2,5.3,2.6,2.3,SLAB+2.9,1.0,'z',.3);
// gable verticals
for(const gb of gables){for(let t=-gb.w/2+0.3;t<gb.w/2;t+=0.6){const hgt=gb.r*(1-Math.abs(t)/(gb.w/2));if(hgt<0.15)continue;
 if(gb.nrm==='x')studs.push({x:gb.pos[0]-Math.sign(gb.pos[0])*.11,y:gb.y+hgt/2,z:gb.pos[1]+t,sx:.16,sy:hgt,sz:ST});else studs.push({x:gb.pos[0]+t,y:gb.y+hgt/2,z:gb.pos[1]-Math.sign(gb.pos[1])*.11,sx:ST,sy:hgt,sz:.16})}}
// porch beam
studs.push({x:0.2,y:SLAB+2.8,z:6.25,sx:4.4,sy:.25,sz:.2});
studs.sort((a,b)=>(a.y-a.sy/2)-(b.y-b.sy/2)||a.x-b.x);
const woodTex=canvasTex(64,256,(g,w,h)=>{g.fillStyle='#d8b07a';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.strokeStyle=`rgba(150,100,50,${.15+rnd()*.2})`;g.beginPath();g.moveTo(rnd()*w,0);g.lineTo(rnd()*w,h);g.stroke()}});
const studMat=new THREE.MeshStandardMaterial({color:'#fff',map:woodTex,roughness:.8});
const studMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),studMat,studs.length);studMesh.castShadow=true;studMesh.receiveShadow=true;scene.add(studMesh);
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_s=new THREE.Vector3();
let lastFrameK=-1;
function setFraming(k){ // k 0..1 fraction built
 const n=studs.length;const kk=Math.round(k*n*4)/4;if(kk===lastFrameK)return;lastFrameK=kk;
 for(let i=0;i<n;i++){const s=studs[i];const f=clamp(k*n*1.0-i*0.985,0,1)*(1);const e=f<1?sm(f):1;
  _p.set(s.x,s.y-(1-e)*s.sy/2,s.z);_e.set(s.rx||0,s.ry||0,s.rz||0);_q.setFromEuler(_e);_s.set(s.sx,Math.max(1e-4,s.sy*e),s.sz);
  if(f<=0)_s.set(1e-4,1e-4,1e-4);_m.compose(_p,_q,_s);studMesh.setMatrixAt(i,_m)}
 studMesh.instanceMatrix.needsUpdate=true}

/* ---------- landscaping ---------- */
const shrubM=new THREE.MeshStandardMaterial({color:'#3f6b33',roughness:.9,flatShading:true});
const flowerM=new THREE.MeshStandardMaterial({color:'#e8a2b5',roughness:.8});
const shrubs=[];
function shrub(x,z,s,fl){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,1),shrubM);m.position.set(x,s*.6,z);m.castShadow=true;m.userData.s=1;scene.add(m);shrubs.push(m);
 if(fl){for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),flowerM);f.position.set((rnd()-.5)*s*1.2,s*.55,(rnd()*.5+.5)*s*.8);m.add(f)}}}
for(let x=-4.6;x<-2.2;x+=0.8)shrub(x,4.75,.45,true);for(let x=2.9;x<4.9;x+=0.8)shrub(x,4.75,.45,true);
shrub(-5.6,4.4,.8);shrub(5.6,4.0,.6);shrub(11.2,2.6,.75);shrub(-1.4,7.1,.35,true);shrub(1.8,7.1,.35,true);
const pots=[];for(const x of [-1.5,1.9]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.22,.17,.45,14),new THREE.MeshStandardMaterial({color:'#2c2c2c',roughness:.6}));p.position.set(x,SLAB+.45/2+.22,5.9);const pl=new THREE.Mesh(new THREE.IcosahedronGeometry(.32,1),shrubM);pl.position.y=.42;p.add(pl);p.castShadow=true;scene.add(p);pots.push(p)}
const mat_=new THREE.Mesh(new THREE.BoxGeometry(1.1,.02,.6),new THREE.MeshStandardMaterial({color:'#5a4634',roughness:1}));mat_.position.set(0.1,SLAB+.24,4.75);scene.add(mat_);
// trees in front yard (appear in Home)
const yardTrees=new THREE.Group();scene.add(yardTrees);
{const g=new THREE.Group();const tr=new THREE.Mesh(new THREE.CylinderGeometry(.14,.22,2.6,6),trunkM);tr.position.y=1.3;g.add(tr);for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3-i*.25,1),new THREE.MeshStandardMaterial({color:'#4c7a3a',roughness:.9,flatShading:true}));b.position.set((rnd()-.5)*.6,2.7+i*.8,(rnd()-.5)*.6);b.castShadow=true;g.add(b)}g.position.set(-7.5,0,8);yardTrees.add(g)}

/* ---------- stages ---------- */
const STAGES=[
 ['00','Blueprint','Every line drawn, checked and approved before we break ground.'],
 ['01','Foundation','Engineered reinforced slab, poured and cured on a fully surveyed plot.'],
 ['02','Framing','The structure goes up floor by floor, inspected at every level.'],
 ['03','Dried in','Sheathing on, roof underlay sealed. The house is weather tight.'],
 ['04','Exterior','Siding, trim, windows and a charcoal roof. The house you drew, standing.'],
 ['05','Home','Landscaped, lit and ready. Your keys, on schedule.'],
];
const C=(h)=>new THREE.Color(h);
const SKY=[ // top, mid, bot, fog, hemi sky, hemi ground, hemiI, sunColor, sunI
 [C('#5f86b4'),C('#b9cfe2'),C('#dfe3e2'),1.05,1.6],
 [C('#4d86c6'),C('#b4d3ee'),C('#eef0ea'),1.45,3.1],
 [C('#2a2f5a'),C('#c7756a'),C('#f2b27a'),0.55,1.1],
];
const tmpC=new THREE.Color();
let cur=0, target=0, curZoom=0;
const phExt=document.getElementById('phExt'),phHome=document.getElementById('phHome'),phPorch=document.getElementById('phPorch'),phHomeImg=phHome.querySelector('img'),phPorchImg=phPorch.querySelector('img');
const bar=document.getElementById('bar'),card=document.getElementById('stageCard'),stNum=document.getElementById('stNum'),stTitle=document.getElementById('stTitle'),stText=document.getElementById('stText');
const heroCopy=document.getElementById('heroCopy'),rail=[...document.querySelectorAll('#rail li')],welcome=document.getElementById('welcome');
let shownStage=-1;
function apply(p){
 // p: 0..1 over the pinned section
 const u=clamp((p-0.06)/0.66)*5.0; const uk=Math.min(4,Math.floor(u)); const s=u>=5?5:uk+sm(Math.min(1,(u-uk)/0.7));
 const z=seg(p,0.76,0.93);
 // blueprint
 bpMat.opacity=lerp(1,0,seg(s,0.9,2.2))*0.95;bpFace.opacity=.22*(1-seg(s,0.3,1.2));grid.material.opacity=.38*(1-seg(s,.5,1.4));plotLine.material.opacity=1-seg(s,.6,1.3);
 // foundation 0.15..1
 const f=seg(s,0.15,1.0);slabGroup.scale.y=Math.max(0.001,f);slabGroup.visible=f>0.001;
 // framing 1..2
 setFraming(seg(s,1.0,2.0));studMesh.visible=s>1.0&&s<3.6;
 // dried in 2..3 : sheathing rises, then felt
 const yTop=mainRoofY+RISE+0.4;
 clipSheath.constant=lerp(0,yTop,seg(s,2.0,2.7));sheath.visible=s>2.0&&s<4.2;
 clipRoofF.constant=lerp(mainRoofY-1.2,yTop,seg(s,2.55,3.0));roofF.visible=s>2.55&&s<4.6;
 // exterior 3..4
 clipSide.constant=lerp(0,yTop,seg(s,3.0,3.7));siding.visible=details.visible=s>3.0;
 clipRoofS.constant=lerp(mainRoofY-1.2,yTop,seg(s,3.5,4.0));roofS.visible=s>3.5;
 const post=seg(s,1.6,1.9);posts.forEach(pp=>{pp.scale.y=Math.max(.001,post);pp.position.y=SLAB+1.35*post;pp.visible=post>0});
 // home 4..5
 const hm=seg(s,4.0,4.9);
 pave.opacity=seg(s,3.6,4.3);drive.visible=path.visible=pave.opacity>0.01;
 lawnMat.opacity=hm;lawn.visible=hm>0.01;
 
 shrubs.forEach((m,i)=>{const k=sm(clamp(hm*1.6-i*0.04));m.scale.setScalar(Math.max(.001,k));m.visible=k>0.01});
 pots.forEach(pp=>{pp.visible=hm>0.3;pp.scale.setScalar(Math.max(.001,seg(hm,.3,.8)))});mat_.visible=hm>.4;
 yardTrees.scale.setScalar(Math.max(.001,seg(hm,.1,.8)));
 const lights=seg(s,4.3,5.0);glassMat.emissiveIntensity=lights*1.6;glassMat.color.copy(C('#1b2a38')).lerp(C('#3a2a18'),lights);
 lantern.material.emissiveIntensity=lights*3;porchLight.intensity=lights*9;inLight.intensity=lights*6;
 // sky: night -> day (0..1.2) -> dusk (4..5)
 const d1=seg(s,0.1,1.2),d2=seg(s,4.1,5.0);
 const top=tmpC.copy(SKY[0][0]).lerp(SKY[1][0],d1).lerp(SKY[2][0],d2);skyU.top.value.copy(top);
 skyU.mid.value.copy(SKY[0][1]).lerp(SKY[1][1],d1).lerp(SKY[2][1],d2);
 skyU.bot.value.copy(SKY[0][2]).lerp(SKY[1][2],d1).lerp(SKY[2][2],d2);
 scene.fog.color.copy(skyU.bot.value);
 hemi.intensity=lerp(lerp(SKY[0][3],SKY[1][3],d1),SKY[2][3],d2);
 sun.intensity=lerp(lerp(SKY[0][4],SKY[1][4],d1),SKY[2][4],d2);
 sun.color.copy(C('#ffe9cc')).lerp(C('#fff1d8'),d1).lerp(C('#ffb27a'),d2);
 sun.position.set(lerp(-18,-22,d2),lerp(26,14,d2),lerp(22,18,d2));
 renderer.toneMappingExposure=lerp(1.12,0.95,d2);
 // camera
 frameCam(z);
 // photo stages
 const pe=seg(u,3.4,3.8), ph=seg(u,4.05,4.55), pz=seg(p,0.8,0.9);
 phExt.style.opacity=String(pe*(1-ph));phHome.style.opacity=String(ph*(1-pz));phPorch.style.opacity=String(pz);
 phHomeImg.style.transform=`scale(${1+seg(p,0.74,0.9)*0.9})`;phPorchImg.style.transform=`scale(${1.12-pz*0.12})`;
 // UI
 heroCopy.style.opacity=String(1-seg(p,0.03,0.09));heroCopy.style.transform=`translateY(${-30*seg(p,0.03,0.09)}px)`;
 const idx=u<0.04?0:Math.min(5,Math.floor(u)+1);
 bar.style.transform=`scaleX(${clamp(u/5)})`;
 const showCard=p>0.08&&z<0.25;card.classList.toggle('on',showCard);
 if(idx!==shownStage){shownStage=idx;const st=STAGES[idx];stNum.textContent=st[0];stTitle.textContent=st[1];stText.textContent=st[2]}
 rail.forEach((li,i)=>{li.classList.toggle('on',i===idx);li.classList.toggle('done',i<idx)});
 document.getElementById('rail').style.opacity=String(1-z);
 welcome.style.opacity=String(seg(p,0.88,0.95));welcome.style.transform=`translateY(${(1-seg(p,0.88,0.95))*30}px)`;
}
const camA=new THREE.Vector3(),tgtA=new THREE.Vector3(),camB=new THREE.Vector3(),tgtB=new THREE.Vector3();
function frameCam(z){
 const asp=camera.aspect;const vf=THREE.MathUtils.degToRad(camera.fov);const hf=2*Math.atan(Math.tan(vf/2)*asp);
 const needW=asp<0.8?11.8:14.5, needH=asp<0.8?8:8.2;
 const dist=Math.max(needW/Math.tan(hf/2),needH/Math.tan(vf/2));
 const dir=new THREE.Vector3(0.48,0.36,1).normalize();
 tgtA.set(asp<0.8?3.0:(asp>1.5?1.4:2.6),asp<0.8?6.6:3.2,0.8);
 if(asp>1.5)tgtA.x-=dist*0.17; // shift house right on wide screens (text on left)
 camA.copy(tgtA).addScaledVector(dir,dist);
 tgtB.set(0.2,1.9,4.2);camB.set(asp<0.8?1.6:2.6,2.0,asp<0.8?13.8:11.5);
 const e=z*z*(3-2*z);
 camera.position.lerpVectors(camA,camB,e);const t=new THREE.Vector3().lerpVectors(tgtA,tgtB,e);camera.lookAt(t);
}
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<0.8?42:34;camera.updateProjectionMatrix();dirty=true}
let dirty=true;addEventListener('resize',resize);

const buildEl=document.querySelector('.build');
let prog=0;
function readProg(){const r=buildEl.getBoundingClientRect();const total=r.height-innerHeight;return clamp(-r.top/total)}
if(window.gsap&&window.ScrollTrigger&&!RENDER){gsap.registerPlugin(ScrollTrigger);
 const o={p:0};ScrollTrigger.create({trigger:buildEl,start:'top top',end:'bottom bottom',scrub:0.8,onUpdate:st=>{gsap.to(o,{p:st.progress,duration:0.5,ease:'power2.out',overwrite:true,onUpdate:()=>{target=o.p;dirty=true}})}});
 target=readProg();
 // reveal sections
 gsap.utils.toArray('.card,.steps li,.proj,.quote,.stats div,.big').forEach(el=>gsap.from(el,{y:40,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%'}}));
}else{addEventListener('scroll',()=>{target=readProg();dirty=true},{passive:true});target=readProg()}
const nav=document.querySelector('.nav');
addEventListener('scroll',()=>nav.classList.toggle('solid',buildEl.getBoundingClientRect().bottom<70),{passive:true});
let t0=performance.now();let intro=0;
function loop(now){requestAnimationFrame(loop);
 if(Q.has('p')){target=+Q.get('p')}
 if(intro<1){intro=Math.min(1,(now-t0)/1600);dirty=true}
 if(!dirty&&Math.abs(target-cur)<1e-4)return;
 cur=target;dirty=false;
 apply(cur);
 if(cur<0.06){bpMat.opacity*=sm(intro);bpFace.opacity*=sm(intro)}
 renderer.render(scene,camera)}
resize();
/* project thumbnails mode */
if(RENDER){document.body.classList.add('render');const v=+RENDER;
 const cols={1:'#ffffff',2:'#e6d6bd',3:'#596068'};matSide.color.set(cols[v]||'#fff');if(v===3){matTrim.color.set('#2b2e33')}
 apply(v===2?0.69:0.74);
 const ang={1:[0.48,0.33,1],2:[-0.7,0.3,1],3:[1,0.28,0.5]}[v];const dir=new THREE.Vector3(...ang).normalize();
 const tg=new THREE.Vector3(2.6,2.6,0.5);camera.position.copy(tg).addScaledVector(dir,v===3?26:28);camera.lookAt(tg);
 if(v===3){skyU.top.value.set('#4a7fbf');skyU.mid.value.set('#f0c9a0');skyU.bot.value.set('#f6dcc0');sun.intensity=2.8;sun.color.set('#ffd9a8');hemi.intensity=1.1;sun.position.set(22,16,20);renderer.toneMappingExposure=1.08;glassMat.emissiveIntensity=.9}
 if(v===2){skyU.top.value.set('#3d78bf');skyU.mid.value.set('#a9cdee');skyU.bot.value.set('#efe4d2');sun.intensity=2.6;sun.color.set('#fff1d8');hemi.intensity=1;glassMat.emissiveIntensity=0.15;porchLight.intensity=0;sun.position.set(-20,26,18);renderer.toneMappingExposure=1.05}
 renderer.render(scene,camera);window.__ready=true}
else requestAnimationFrame(loop);
// form
const chips=document.getElementById('chips');chips.addEventListener('click',e=>{if(e.target.tagName!=='BUTTON')return;chips.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===e.target))});
document.getElementById('form').addEventListener('submit',e=>{e.preventDefault();const f=e.target;if(!f.name.value.trim()||!f.phone.value.trim()){(f.name.value.trim()?f.phone:f.name).focus();return}document.getElementById('ok').hidden=false;f.querySelector('button[type=submit]').textContent='Request sent'});
window.__ready=true;
