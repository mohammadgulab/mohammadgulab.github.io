import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

gsap.registerPlugin(ScrollTrigger);

/* ---------- listings ---------- */
const CARS=[
 {id:"blue",stock:"MX-0214",name:"2022 V8 Roadster",sub:"Gulf blue metallic · Rear-wheel drive",price:829000,
  specs:[["Mileage","14,200 km"],["Engine","4.5L V8"],["Power","562 hp"],["0 to 100","3.4 s"],["Drive","RWD"],["Seats","2"]],
  label:"Blue V8 Roadster", paint:0x1f57d8, rim:0x2a2c30, x:-14},
 {id:"red",stock:"MX-0187",name:"2021 Hybrid V8 Supercar",sub:"Rosso red · Plug-in hybrid",price:1690000,
  specs:[["Mileage","9,800 km"],["Engine","4.0L V8 + 3 e-motors"],["Power","986 hp"],["0 to 100","2.5 s"],["Drive","AWD"],["Seats","2"]],
  label:"Red Hybrid Supercar", paint:0xa90f17, rim:0xb9bcc0, x:0},
 {id:"yel",stock:"MX-0231",name:"2020 V8 Grand Tourer",sub:"Giallo yellow · Rear-wheel drive",price:689000,
  specs:[["Mileage","22,600 km"],["Engine","4.0L twin-turbo V8"],["Power","612 hp"],["0 to 100","3.2 s"],["Drive","RWD"],["Seats","2"]],
  label:"Yellow Grand Tourer", paint:0xf0ae0a, rim:0x141518, x:14}
];
const RATE=0.055;
const fmt=n=>"SAR "+Math.round(n).toLocaleString("en-US");
const $=(s,r)=>(r||document).querySelector(s);
const vp=$("#vp"), canvas=$("#gl"), panel=$("#panel"), heroCopy=$("#heroCopy"), track=$("#track"), markers=$("#markers"), carTag=$("#carTag");
const phone=()=>window.innerWidth<900;
const QA=/[?&]qa/.test(location.search);

/* ---------- renderer ---------- */
let renderer;
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
}catch(e){
  $("#lTxt").textContent="This 3D showroom needs WebGL, which this browser has turned off.";
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate=false;

const scene=new THREE.Scene();
const SKY=0x06080d;
scene.background=new THREE.Color(SKY);
scene.fog=new THREE.Fog(SKY,60,125);
const camera=new THREE.PerspectiveCamera(45,1,0.3,260);

/* ---------- night environment for reflections ---------- */
function buildEnv(){
  const es=new THREE.Scene();
  const sky=new THREE.Mesh(new THREE.SphereGeometry(50,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
    vertexShader:"varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:"varying vec3 vP;void main(){float h=vP.y;vec3 top=vec3(.012,.016,.03);vec3 hor=vec3(.07,.075,.10);vec3 gr=vec3(.035,.03,.028);vec3 c=h>0.?mix(hor,top,pow(h,.55)):mix(hor,gr,pow(-h,.4));gl_FragColor=vec4(c,1.);}"}));
  es.add(sky);
  const warm=new THREE.MeshBasicMaterial({color:new THREE.Color(1,.72,.42).multiplyScalar(9)});
  const soft=new THREE.MeshBasicMaterial({color:new THREE.Color(1,.9,.78).multiplyScalar(1.6)});
  const cool=new THREE.MeshBasicMaterial({color:new THREE.Color(.45,.6,1).multiplyScalar(1.2)});
  const box=new THREE.BoxGeometry(1,1,1);
  // overhead softbox (long clearcoat highlight)
  const sb=new THREE.Mesh(box,soft); sb.scale.set(26,.2,7); sb.position.set(0,22,0); es.add(sb);
  // ring of lamp heads
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2, m=new THREE.Mesh(box,warm); m.scale.set(1.6,.5,1.6); m.position.set(Math.cos(a)*30,10+(i%3)*3,Math.sin(a)*30); es.add(m);}
  // showroom glass band on one side, cool sky glow on the other
  const band=new THREE.Mesh(box,new THREE.MeshBasicMaterial({color:new THREE.Color(1,.8,.55).multiplyScalar(2.2)})); band.scale.set(60,4,1); band.position.set(0,5,-40); es.add(band);
  const cg=new THREE.Mesh(box,cool); cg.scale.set(70,8,1); cg.position.set(0,6,44); es.add(cg);
  const pm=new THREE.PMREMGenerator(renderer);
  const rt=pm.fromScene(es,0.035);
  pm.dispose();
  return rt.texture;
}
scene.environment=buildEnv();
scene.environmentIntensity=1.0;

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0x22304e,0x0b0a09,0.9));
const moon=new THREE.DirectionalLight(0x8fa6d8,0.55); moon.position.set(-20,40,25); scene.add(moon);

/* ---------- lot layout ---------- */
const BAY=3, ROW_BACK=-12.2, ROW_FRONT=12.6, BAYD=5.4;
const LOT={x0:-34,x1:34,z0:-26,z1:24};

function noiseCanvas(n,base,amp){
  const c=document.createElement("canvas"); c.width=c.height=n; const g=c.getContext("2d");
  const id=g.createImageData(n,n);
  for(let i=0;i<n*n;i++){const v=base+(Math.random()-.5)*amp+(Math.random()<.02?amp*.8:0); id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=v; id.data[i*4+3]=255;}
  g.putImageData(id,0,0); return c;
}
function groundTextures(){
  const W=2048,H=Math.round(2048*(LOT.z1-LOT.z0)/(LOT.x1-LOT.x0));
  const sx=W/(LOT.x1-LOT.x0), sz=H/(LOT.z1-LOT.z0);
  const X=x=>(x-LOT.x0)*sx, Z=z=>(z-LOT.z0)*sz;
  const c=document.createElement("canvas"); c.width=W; c.height=H; const g=c.getContext("2d");
  g.fillStyle="#2a2b2d"; g.fillRect(0,0,W,H);
  // patchy asphalt
  for(let i=0;i<260;i++){const x=Math.random()*W,y=Math.random()*H,r=20+Math.random()*120; const gr=g.createRadialGradient(x,y,0,x,y,r); const d=Math.random()<.5; gr.addColorStop(0,d?"rgba(18,18,20,.35)":"rgba(70,70,72,.18)"); gr.addColorStop(1,"rgba(0,0,0,0)"); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2);}
  g.globalAlpha=.22; g.fillStyle=g.createPattern(noiseCanvas(256,128,70),"repeat"); g.fillRect(0,0,W,H); g.globalAlpha=1;
  // tyre-darkened strips in the aisle
  g.fillStyle="rgba(10,10,12,.22)"; [-1.4,1.4].forEach(o=>{g.fillRect(0,Z(o-0.5),W,0.9*sz);});
  // paint
  g.strokeStyle="rgba(232,232,226,.88)"; g.lineCap="butt";
  const line=(x1,z1,x2,z2,w)=>{g.lineWidth=(w||0.12)*sx; g.beginPath(); g.moveTo(X(x1),Z(z1)); g.lineTo(X(x2),Z(z2)); g.stroke();};
  for(let x=-28.5;x<=28.6;x+=BAY){ line(x,ROW_BACK-BAYD/2,x,ROW_BACK+BAYD/2); line(x,ROW_FRONT-BAYD/2,x,ROW_FRONT+BAYD/2); }
  line(-28.5,ROW_BACK-BAYD/2,28.5,ROW_BACK-BAYD/2); line(-28.5,ROW_FRONT+BAYD/2,28.5,ROW_FRONT+BAYD/2);
  // display bays: gold boxes + hatched corners
  g.strokeStyle="rgba(217,178,111,.85)";
  CARS.forEach(cr=>{const x=cr.x; line(x-4.2,-4.6,x+4.2,-4.6,.14); line(x-4.2,4.6,x+4.2,4.6,.14); line(x-4.2,-4.6,x-4.2,4.6,.14); line(x+4.2,-4.6,x+4.2,4.6,.14);});
  // aisle arrows + edge line
  g.strokeStyle="rgba(232,232,226,.55)";
  [-26,26].forEach(x=>{line(x-1.2,7.4,x+1.2,7.4,.25); line(x+.4,6.8,x+1.2,7.4,.25); line(x+.4,8,x+1.2,7.4,.25);});
  line(-31,-19.5,31,-19.5,.15); line(-31,19.8,31,19.8,.15);
  const col=new THREE.CanvasTexture(c); col.colorSpace=THREE.SRGBColorSpace; col.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  // light pools (emissive)
  const e=document.createElement("canvas"); e.width=1024; e.height=Math.round(1024*H/W); const eg=e.getContext("2d");
  const es=e.width/(LOT.x1-LOT.x0);
  eg.fillStyle="#000"; eg.fillRect(0,0,e.width,e.height); eg.globalCompositeOperation="lighter";
  const pool=(x,z,r,a,colr)=>{const px=(x-LOT.x0)*es,pz=(z-LOT.z0)*es,R=r*es; const gr=eg.createRadialGradient(px,pz,0,px,pz,R); gr.addColorStop(0,"rgba("+colr+","+a+")"); gr.addColorStop(.45,"rgba("+colr+","+(a*.45)+")"); gr.addColorStop(1,"rgba("+colr+",0)"); eg.fillStyle=gr; eg.fillRect(px-R,pz-R,R*2,R*2);};
  POLES.forEach(p=>pool(p[0],p[1]+(p[1]<0?2:-2),11,.34,"255,170,95"));
  CARS.forEach(cr=>pool(cr.x,0.6,6.5,.16,"255,214,160"));
  const em=new THREE.CanvasTexture(e); em.colorSpace=THREE.SRGBColorSpace;
  const rough=new THREE.CanvasTexture(noiseCanvas(256,150,110)); rough.wrapS=rough.wrapT=THREE.RepeatWrapping; rough.repeat.set(60,44);
  return {col,em,rough};
}
const POLES=[];
for(let x=-24;x<=24;x+=12){POLES.push([x,-16.8]); POLES.push([x,17.4]);}

let ground;
function buildLot(){
  const t=groundTextures();
  ground=new THREE.Mesh(new THREE.PlaneGeometry(LOT.x1-LOT.x0,LOT.z1-LOT.z0),new THREE.MeshStandardMaterial({map:t.col,roughness:.78,roughnessMap:t.rough,metalness:0,emissive:0xffffff,emissiveMap:t.em,emissiveIntensity:1,envMapIntensity:.55}));
  ground.rotation.x=-Math.PI/2; ground.position.set((LOT.x0+LOT.x1)/2,0,(LOT.z0+LOT.z1)/2); ground.receiveShadow=true; scene.add(ground);
  // outer ground, sand/dark
  const outer=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshStandardMaterial({color:0x14130f,roughness:1}));
  outer.rotation.x=-Math.PI/2; outer.position.y=-0.02; scene.add(outer);
  // kerbs
  const kerbM=new THREE.MeshStandardMaterial({color:0x8a8a86,roughness:.9});
  const kerbG=new THREE.BoxGeometry(1,1,1);
  [[0,LOT.z0+.2,LOT.x1-LOT.x0,.4],[0,LOT.z1-.2,LOT.x1-LOT.x0,.4],[LOT.x0+.2,(LOT.z0+LOT.z1)/2,.4,LOT.z1-LOT.z0],[LOT.x1-.2,(LOT.z0+LOT.z1)/2,.4,LOT.z1-LOT.z0]].forEach(k=>{const m=new THREE.Mesh(kerbG,kerbM); m.scale.set(k[2],.18,k[3]); m.position.set(k[0],.09,k[1]); scene.add(m);});
  // planted strips with low hedges and palms behind the rows
  const hedgeM=new THREE.MeshStandardMaterial({color:0x17261a,roughness:.95});
  [-21.5,21].forEach(z=>{const m=new THREE.Mesh(kerbG,hedgeM); m.scale.set(60,.7,1.4); m.position.set(0,.35,z); scene.add(m);
    const st=new THREE.Mesh(kerbG,kerbM); st.scale.set(61,.2,2.2); st.position.set(0,.1,z); scene.add(st);});
  buildPalms();
  // showroom building behind the lot
  const bM=new THREE.MeshStandardMaterial({color:0x1a1c20,roughness:.6,metalness:.2});
  const b=new THREE.Mesh(kerbG,bM); b.scale.set(56,9,12); b.position.set(0,4.5,-32); scene.add(b);
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(50,4.6),new THREE.MeshStandardMaterial({color:0x111111,emissive:0xffcf96,emissiveIntensity:.3,roughness:.15,metalness:.6}));
  glass.position.set(0,3,-25.98); scene.add(glass);
  const mull=new THREE.MeshStandardMaterial({color:0x0b0c0e,roughness:.5});
  for(let x=-24;x<=24;x+=4){const m=new THREE.Mesh(kerbG,mull); m.scale.set(.18,4.8,.15); m.position.set(x,3,-25.9); scene.add(m);}
  const roof=new THREE.Mesh(kerbG,bM); roof.scale.set(58,.5,14); roof.position.set(0,9.1,-31.5); scene.add(roof);
  scene.add(sign());
  buildPoles();
  // display pads
  const padM=new THREE.MeshStandardMaterial({color:0x3a3b3f,roughness:.28,metalness:.3,envMapIntensity:1});
  const ringM=new THREE.MeshStandardMaterial({color:0x000000,emissive:0xd9b26f,emissiveIntensity:1.6});
  CARS.forEach(cr=>{
    const pad=new THREE.Mesh(new THREE.CylinderGeometry(3.3,3.4,.06,72),padM); pad.position.set(cr.x,.03,0); pad.receiveShadow=true; scene.add(pad);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(3.32,.04,8,96),ringM); ring.rotation.x=Math.PI/2; ring.position.set(cr.x,.065,0); scene.add(ring);
  });
}
function sign(){
  const c=document.createElement("canvas"); c.width=1024; c.height=160; const g=c.getContext("2d");
  g.fillStyle="#000"; g.fillRect(0,0,1024,160);
  g.font="700 96px Archivo, Arial, sans-serif"; g.textAlign="center"; g.textBaseline="middle";
  g.fillStyle="#f3efe6"; g.fillText("MARSA  EXOTICS",512,84);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(16,2.5),new THREE.MeshBasicMaterial({map:t,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:true}));
  m.position.set(0,7.2,-25.9); return m;
}
let glowTex;
function glow(){
  if(glowTex) return glowTex;
  const c=document.createElement("canvas"); c.width=c.height=128; const g=c.getContext("2d");
  const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,"rgba(255,220,170,1)"); gr.addColorStop(.18,"rgba(255,180,110,.55)"); gr.addColorStop(1,"rgba(255,150,80,0)");
  g.fillStyle=gr; g.fillRect(0,0,128,128); glowTex=new THREE.CanvasTexture(c); glowTex.colorSpace=THREE.SRGBColorSpace; return glowTex;
}
function buildPoles(){
  const n=POLES.length;
  const poleM=new THREE.MeshStandardMaterial({color:0x2b2d31,roughness:.5,metalness:.7});
  const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.09,.13,8,10),poleM,n);
  const arm=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.12,2.2),poleM,n);
  const head=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.14,.9),new THREE.MeshStandardMaterial({color:0x111111,emissive:0xffc488,emissiveIntensity:4}),n);
  const base=new THREE.InstancedMesh(new THREE.CylinderGeometry(.3,.34,.5,12),new THREE.MeshStandardMaterial({color:0x77766f,roughness:.9}),n);
  const m=new THREE.Matrix4(), q=new THREE.Quaternion(), s=new THREE.Vector3(1,1,1), p=new THREE.Vector3();
  POLES.forEach((pp,i)=>{
    const dir=pp[1]<0?1:-1;
    m.compose(p.set(pp[0],4,pp[1]),q.identity(),s); pole.setMatrixAt(i,m);
    m.compose(p.set(pp[0],7.95,pp[1]+dir*1.05),q,s); arm.setMatrixAt(i,m);
    m.compose(p.set(pp[0],7.85,pp[1]+dir*2.0),q,s); head.setMatrixAt(i,m);
    m.compose(p.set(pp[0],.25,pp[1]),q,s); base.setMatrixAt(i,m);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow(),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.85}));
    sp.scale.set(3.4,3.4,1); sp.position.set(pp[0],7.6,pp[1]+dir*2.0); scene.add(sp);
  });
  [pole,arm,head,base].forEach(o=>scene.add(o));
}
function buildPalms(){
  const trunkM=new THREE.MeshStandardMaterial({color:0x3a2e22,roughness:.95});
  const leafM=new THREE.MeshStandardMaterial({color:0x1d3320,roughness:.8,side:THREE.DoubleSide});
  const leafG=new THREE.PlaneGeometry(.7,3.4,1,4);
  const pos=leafG.attributes.position; for(let i=0;i<pos.count;i++){const y=pos.getY(i)+1.7; pos.setZ(i,-0.09*y*y); pos.setX(i,pos.getX(i)*(1-Math.abs(y-1.4)/2.2));}
  leafG.translate(0,0,0); leafG.computeVertexNormals();
  const spots=[]; for(let x=-30;x<=30;x+=7.5){spots.push([x+1.2,-21.5]); spots.push([x-1.5,21]);}
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.24,6,8),trunkM,spots.length);
  const leaves=new THREE.InstancedMesh(leafG,leafM,spots.length*9);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),s=new THREE.Vector3(1,1,1),p=new THREE.Vector3();
  let k=0;
  spots.forEach((sp,i)=>{
    m.compose(p.set(sp[0],3,sp[1]),q.identity(),s); trunks.setMatrixAt(i,m);
    for(let j=0;j<9;j++){ e.set(-1.05+Math.random()*.25,j/9*Math.PI*2+i,0,"YXZ"); q.setFromEuler(e);
      // leaf plane rises along +y; tilt it outward
      const lm=new THREE.Matrix4().makeTranslation(0,1.7,0);
      m.compose(p.set(sp[0],6,sp[1]),q,s); m.multiply(lm); leaves.setMatrixAt(k++,m);}
  });
  scene.add(trunks); scene.add(leaves);
}

/* ---------- cars ---------- */
const showcase=[];
const spots=[];
let shadowTex;
function aoMesh(){
  return new THREE.Mesh(new THREE.PlaneGeometry(0.655*4,1.3*4),new THREE.MeshBasicMaterial({map:shadowTex,blending:THREE.MultiplyBlending,toneMapped:false,transparent:true,premultipliedAlpha:true,depthWrite:false}));
}
const SKIP=/interior|leather|steering|carpet|wipers/;
function pathName(o){const a=[];while(o){a.push(o.name||"");o=o.parent;}return a.join("/");}

function debadge(model){
  // remove the maker's emblems: rear horse, nose badge, fender shields (model space: front is -z)
  model.updateMatrixWorld(true);
  const boxes=[new THREE.Box3(new THREE.Vector3(-.26,.66,1.9),new THREE.Vector3(.26,1.05,2.6)),
               new THREE.Box3(new THREE.Vector3(-.16,.15,-2.7),new THREE.Vector3(.16,.95,-1.6)),
               new THREE.Box3(new THREE.Vector3(.8,.6,-1.0),new THREE.Vector3(1.3,.93,0)),new THREE.Box3(new THREE.Vector3(-1.3,.6,-1.0),new THREE.Vector3(-.8,.93,0))];
  const v=new THREE.Vector3();
  model.traverse(o=>{
    if(!o.isMesh) return;
    if(o.name==="yellow_trim"||o.name==="blue"){ o.visible=false; return; }
    const mn=o.material.name||"";
    if(!/chrome|plastic_gray|metal_gray|Carbon|Tires/.test(mn) && o.name!=="body") return;
    const g=o.geometry, pos=g.attributes.position, idx=g.index; if(!idx) return;
    const inside=new Uint8Array(pos.count);
    for(let i=0;i<pos.count;i++){ v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld); inside[i]=boxes.some(b=>b.containsPoint(v))?1:0; }
    if(o.name==="body") return; // keep paint
    let n=0; const a=idx.array;
    for(let t=0;t<a.length;t+=3){ if(inside[a[t]]&&inside[a[t+1]]&&inside[a[t+2]]){ a[t+1]=a[t]; a[t+2]=a[t]; n++; } }
    if(n) idx.needsUpdate=true;
  });
}
function setupShowcase(model){
  debadge(model);
  CARS.forEach((cr,i)=>{
    const car=model.clone(true);
    const body=new THREE.MeshPhysicalMaterial({color:cr.paint,metalness:.55,roughness:.32,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:1.25});
    const rim=new THREE.MeshStandardMaterial({color:cr.rim,metalness:1,roughness:.32});
    const glass=new THREE.MeshPhysicalMaterial({color:0x0a0c10,metalness:.2,roughness:.03,transparent:true,opacity:.62,envMapIntensity:1.4,clearcoat:1});
    const dark=new THREE.MeshStandardMaterial({color:0x101113,metalness:.5,roughness:.45});
    car.traverse(o=>{
      if(!o.isMesh) return;
      const pn=pathName(o), mn=o.material.name||"";
      if(mn==="Body_Color") o.material=body;
      else if(mn==="metal_gray"&&/(^|\/)(rim_..|wheel)(\/|$)/.test(pn)&&!/brake|nuts/.test(pn)) o.material=rim;
      else if(mn==="Glass_Gray") o.material=glass;
      else if(/DodgerBlue|Ferrari_Yellow/.test(mn)) o.material=body;
      else if(/centre/.test(pn)||/^yellow_trim$|^blue$/.test(o.name)) o.material=dark;
      o.castShadow=!SKIP.test(pn);
    });
    car.position.set(cr.x,0,0);
    if(FRONT_FLIP) car.rotation.y=Math.PI;
    scene.add(car);
    const ao=aoMesh(); ao.rotation.x=-Math.PI/2; ao.position.set(cr.x,0.07,0); ao.renderOrder=2; if(FRONT_FLIP) ao.rotation.z=Math.PI; scene.add(ao);
    const sp=new THREE.SpotLight(0xffe2bd,260,34,0.62,0.75,1.6);
    sp.position.set(cr.x+3.5,10.5,5.5); sp.target.position.set(cr.x,0.3,0);
    sp.castShadow=true; sp.shadow.mapSize.set(1024,1024); sp.shadow.bias=-0.0004; sp.shadow.normalBias=0.02; sp.shadow.camera.near=4; sp.shadow.camera.far=22;
    scene.add(sp); scene.add(sp.target); spots.push(sp);
    showcase.push(car);
  });
}
let FRONT_FLIP=true;

const PARKED_COLORS=[0x0b0b0d,0xdedcd6,0x8d9196,0x3a3d43,0x161d30,0x0b0b0d,0xcfcfcb,0x23331f,0x3a1015,0x5d6168,0x0b0b0d,0xe9e6df];
function setupParked(model){
  model.updateMatrixWorld(true);
  const groups={body:[],glass:[],tire:[],metal:[],light:[],dark:[]};
  model.traverse(o=>{
    if(!o.isMesh) return;
    const pn=pathName(o); if(SKIP.test(pn)) return;
    const mn=o.material.name||"";
    let g="dark";
    if(mn==="Body_Color"||/DodgerBlue|Ferrari_Yellow/.test(mn)) g="body";
    else if(mn==="Glass_Gray") g="glass";
    else if(mn==="Tires") g="tire";
    else if(/metal|chrome/i.test(mn)) g="metal";
    else if(/Taillight|Projector|LED/i.test(mn)) g="light";
    const geo=o.geometry.clone(); geo.applyMatrix4(o.matrixWorld);
    Object.keys(geo.attributes).forEach(k=>{if(k!=="position"&&k!=="normal") geo.deleteAttribute(k);});
    if(!geo.index){const a=new Uint32Array(geo.attributes.position.count); for(let i=0;i<a.length;i++)a[i]=i; geo.setIndex(new THREE.BufferAttribute(a,1));}
    geo.computeVertexNormals();
    groups[g].push(geo);
  });
  // bays
  const slots=[];
  for(let x=-27;x<=27;x+=BAY){
    if(Math.abs(x)>24&&Math.random()<.5) continue;
    if(Math.random()<.74) slots.push([x+(Math.random()-.5)*.25,ROW_BACK+(Math.random()-.5)*.3,Math.random()<.75?0:Math.PI]);
    if(Math.random()<.74) slots.push([x+(Math.random()-.5)*.25,ROW_FRONT+(Math.random()-.5)*.3,Math.random()<.75?Math.PI:0]);
  }
  const n=slots.length;
  const mats={
    body:new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:.5,roughness:.35,clearcoat:1,clearcoatRoughness:.08}),
    glass:new THREE.MeshStandardMaterial({color:0x07080a,metalness:.6,roughness:.06}),
    tire:new THREE.MeshStandardMaterial({color:0x0c0c0c,roughness:.9}),
    metal:new THREE.MeshStandardMaterial({color:0x8a8d92,metalness:1,roughness:.35}),
    light:new THREE.MeshStandardMaterial({color:0x330507,emissive:0x220000,roughness:.2}),
    dark:new THREE.MeshStandardMaterial({color:0x111214,metalness:.4,roughness:.5})
  };
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),p=new THREE.Vector3(),c=new THREE.Color();
  Object.keys(groups).forEach(k=>{
    if(!groups[k].length) return;
    const merged=mergeGeometries(groups[k],false); if(!merged) return;
    const im=new THREE.InstancedMesh(merged,mats[k],n);
    slots.forEach((sl,i)=>{q.setFromAxisAngle(new THREE.Vector3(0,1,0),sl[2]+(FRONT_FLIP?Math.PI:0)); m.compose(p.set(sl[0],0,sl[1]),q,s); im.setMatrixAt(i,m);
      if(k==="body") im.setColorAt(i,c.setHex(PARKED_COLORS[i%PARKED_COLORS.length]));});
    im.frustumCulled=false; scene.add(im);
  });
  const ao=new THREE.InstancedMesh(new THREE.PlaneGeometry(0.655*4,1.3*4),aoMesh().material,n);
  slots.forEach((sl,i)=>{q.setFromEuler(new THREE.Euler(-Math.PI/2,0,sl[2],"YXZ")); m.compose(p.set(sl[0],.06,sl[1]),q,s); ao.setMatrixAt(i,m);});
  ao.renderOrder=2; scene.add(ao);
}

/* ---------- camera rig ---------- */
const V=new THREE.Vector3;
const view={w:1,h:1,fov:45,R:9,aerial:null,sheetShift:0,panelShift:0};
const ANG=[-40,0,90,140], ANG_NAMES=["Front 3/4","Front","Side","Rear 3/4"];
function layout(){
  forceFrames=3;
  const w=vp.clientWidth, h=vp.clientHeight; view.w=w; view.h=h;
  const asp=w/h;
  view.fov=asp<1?THREE.MathUtils.lerp(58,48,THREE.MathUtils.clamp((asp-.45)/.4,0,1)):38;
  const t=Math.tan(THREE.MathUtils.degToRad(view.fov/2));
  let frac;
  if(phone()){ frac=w<600?.86:.66; }
  else { const pw=panel.offsetWidth||430; frac=.7*(w-pw)/w; view.panelShift=pw/2; }
  view.R=THREE.MathUtils.clamp(4.8/frac/(2*t*asp),6.2,11);
  if(phone()){
    const hdr=56, top=panel.offsetTop||h*.45; // sheet top inside the viewport
    view.sheetShift=Math.max(0,h/2-(hdr+top)/2);
    view.panelShift=0;
  } else view.sheetShift=0;
  // aerial
  if(asp<1){ const H=27/Math.tan(THREE.MathUtils.degToRad(view.fov/2));
    view.aerial={pos:new THREE.Vector3(H*.16,H,0.01),tgt:new THREE.Vector3(0,0,0),up:new THREE.Vector3(-1,0,0)}; }
  else { const halfW=27, H=Math.max(halfW/(t*asp), 15/t);
    view.aerial={pos:new THREE.Vector3(0,H,H*.2),tgt:new THREE.Vector3(0,0,1.2),up:new THREE.Vector3(0,0,-1)}; }
  camera.fov=view.fov; camera.aspect=asp; camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
}
function orbitPose(i,deg){
  const a=THREE.MathUtils.degToRad(deg), R=view.R*(.74+.26*Math.abs(Math.sin(a))), x=CARS[i].x;
  return {pos:new THREE.Vector3(x+Math.sin(a)*R,1.15+.09*R,Math.cos(a)*R),tgt:new THREE.Vector3(x,.55,0),up:new THREE.Vector3(0,1,0)};
}
const U={hero:.7,fly:1.1,orbit:3.2,back:1.1,tail:.35};
const SEG=[]; let TOTAL=0;
(function(){
  let t=0; const add=(o)=>{o.s=t; t+=o.d; o.e=t; SEG.push(o);};
  add({type:"hero",d:U.hero});
  CARS.forEach((c,i)=>{ add({type:"fly",d:U.fly,from:i-1,to:i}); add({type:"orbit",d:U.orbit,car:i}); });
  add({type:"fly",d:U.back,from:CARS.length-1,to:-1}); add({type:"tail",d:U.tail});
  TOTAL=t;
})();
const smooth=t=>t*t*(3-2*t);
const eio=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function orbitAngle(f){ // eased between key angles so it settles on each view
  const K=[0,.3,.64,1]; for(let k=0;k<3;k++){ if(f<=K[k+1]){const u=(f-K[k])/(K[k+1]-K[k]); return {deg:ANG[k]+(ANG[k+1]-ANG[k])*THREE.MathUtils.lerp(u,smooth(u),.7), idx:u<.5?k:k+1};}}
  return {deg:ANG[3],idx:3};
}
function lerpPose(A,B,e,arc){
  const pos=A.pos.clone().lerp(B.pos,e); pos.y+=arc*Math.sin(Math.PI*e);
  return {pos,tgt:A.tgt.clone().lerp(B.tgt,e),up:A.up.clone().lerp(B.up,e).normalize()};
}
const state={p:0};
let clock=0;
function evaluate(p){
  let sg=SEG[SEG.length-1]; for(const s of SEG){ if(p<s.e){sg=s;break;} }
  const f=THREE.MathUtils.clamp((p-sg.s)/sg.d,0,1);
  let pose, car=-1, vis=0, ang=0, aerialAmt=0;
  if(sg.type==="hero"||sg.type==="tail"){ pose=aerialPose(); aerialAmt=1; }
  else if(sg.type==="orbit"){ const o=orbitAngle(f); pose=orbitPose(sg.car,o.deg); car=sg.car; vis=1; ang=o.idx; }
  else {
    const A=sg.from<0?aerialPose():orbitPose(sg.from,ANG[3]);
    const B=sg.to<0?aerialPose():orbitPose(sg.to,ANG[0]);
    const e=eio(f);
    const arc=(sg.from>=0&&sg.to>=0)?3.2:0;
    pose=lerpPose(A,B,e,arc);
    if(sg.from<0) aerialAmt=1-e; if(sg.to<0) aerialAmt=e;
    if(sg.from>=0 && f<.3){ car=sg.from; vis=1-smooth(f/.3); ang=3; }
    else if(sg.to>=0 && f>.62){ car=sg.to; vis=smooth(Math.min(1,(f-.62)/.3)); ang=0; }
  }
  return {pose,car,vis,ang,aerialAmt};
}
function aerialPose(){
  const a=view.aerial, d=QA?0:Math.sin(clock*.25)*.6, d2=QA?0:Math.cos(clock*.19)*.6;
  return {pos:a.pos.clone().add(V.set(d,0,d2)),tgt:a.tgt.clone().add(V.set(d*.6,0,d2*.6)),up:a.up.clone()};
}

/* ---------- markers ---------- */
const mkEls=CARS.map((c,i)=>{
  const b=document.createElement("button");
  b.className="mk"; b.type="button"; b.setAttribute("aria-label","View "+c.name+", "+fmt(c.price));
  b.innerHTML='<span class="dot"></span><span class="lab"><b>'+c.label+'</b><span>'+fmt(c.price)+'</span></span>';
  b.addEventListener("click",()=>goCar(i));
  markers.appendChild(b); return b;
});
const V2=new THREE.Vector3();
function placeMarkers(alpha){
  markers.style.opacity=alpha; const on=alpha>.6;
  markers.style.pointerEvents=on?"auto":"none";
  if(alpha<=0) return;
  CARS.forEach((c,i)=>{
    V.set(c.x,0,0).project(camera); V2.set(c.x,0,3.4).project(camera);
    const cx=(V.x*.5+.5)*view.w, cy=(-V.y*.5+.5)*view.h;
    const ex=(V2.x*.5+.5)*view.w, ey=(-V2.y*.5+.5)*view.h;
    const r=Math.hypot(ex-cx,ey-cy);
    const lab=mkEls[i].lastChild, lw=(lab._w=lab._w||lab.offsetWidth||150)+30;
    let x=cx+r+4, side="side";
    if(x+lw>view.w-6 && cx-r-4-lw>6){ x=cx-r-4; side="sideL"; }
    const el=mkEls[i];
    el.style.transform="translate3d("+x.toFixed(1)+"px,"+cy.toFixed(1)+"px,0)";
    el.tabIndex=on?0:-1;
    if(el._s!==side){el._s=side; el.classList.toggle("side",side==="side"); el.classList.toggle("sideL",side==="sideL");}
  });
}

/* ---------- panel + estimator ---------- */
let cur=-1, months=48;
const down=$("#down"), ctrEl=$("#ctrNum");
function setPanel(i){
  if(i===cur||i<0) return; cur=i;
  const c=CARS[i];
  $("#pStock").textContent="Stock "+c.stock+" · Jeddah showroom";
  $("#pName").textContent=c.name; $("#pSub").textContent=c.sub; $("#pPrice").textContent=fmt(c.price);
  $("#pSpecs").innerHTML=c.specs.map(s=>"<div><dt>"+s[0]+"</dt><dd>"+s[1]+"</dd></div>").join("");
  $("#ctName").textContent=c.name;
  calc();
}
function calc(){
  if(cur<0) return;
  const P=CARS[cur].price, pct=+down.value, d=P*pct/100, L=P-d, r=RATE/12, n=months;
  const m=L*r/(1-Math.pow(1+r,-n));
  $("#downPct").textContent=pct+"%"; $("#downAmt").textContent=fmt(d); $("#monthly").textContent=fmt(m);
  down.style.setProperty("--fill",((pct-10)/40*100)+"%");
}
down.addEventListener("input",calc);
document.querySelectorAll(".terms button").forEach(b=>{
  b.addEventListener("click",()=>{
    months=+b.dataset.m;
    document.querySelectorAll(".terms button").forEach(x=>{const on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-checked",on?"true":"false");});
    calc();
  });
});

/* ---------- scroll ---------- */
let st, tween;
function sizeTrack(){ track.style.height=(TOTAL*vp.clientHeight*.85+vp.clientHeight)+"px"; }
function build(){
  sizeTrack(); layout();
  if(tween){tween.scrollTrigger.kill(); tween.kill();}
  const p=state.p;
  tween=gsap.fromTo(state,{p:0},{p:TOTAL,ease:"none",scrollTrigger:{trigger:track,start:"top top",end:"bottom bottom",scrub:QA?true:.9}});
  state.p=p;
  st=tween.scrollTrigger;
  ScrollTrigger.refresh();
}
function pToScroll(p){ return st.start+(p/TOTAL)*(st.end-st.start); }
function goCar(i){
  i=(i+CARS.length)%CARS.length;
  const sg=SEG.find(s=>s.type==="orbit"&&s.car===i);
  window.scrollTo({top:pToScroll(sg.s+.04),behavior:"smooth"});
}
$("#nextBtn").addEventListener("click",()=>goCar(cur+1));
$("#prevBtn").addEventListener("click",()=>{ if(cur<=0) window.scrollTo({top:0,behavior:"smooth"}); else goCar(cur-1); });
$("#backLot").addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
$("#brandLink").addEventListener("click",e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});});

/* ---------- inquire (nothing is sent) ---------- */
const dlg=$("#inq");
function openInq(){
  $("#fCar").value=cur>=0?(CARS[cur].name+" ("+CARS[cur].stock+")"):"General viewing";
  $("#fSent").hidden=true; $("#fSend").hidden=false;
  if(dlg.showModal) dlg.showModal(); else dlg.setAttribute("open","");
}
["#inqBtn","#topInquire","#visitInq"].forEach(s=>$(s).addEventListener("click",openInq));
$("#fSend").addEventListener("click",()=>{ $("#fSent").hidden=false; $("#fSend").hidden=true; });

/* ---------- frame loop ---------- */
let forceFrames=3, ready=false, lastKey="", lastAng=-1, lastT=performance.now();
const dots=[...document.querySelectorAll("#dots i")], chip=$("#chip");
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-lastT)/1000); lastT=now; clock+=dt;
  if(!ready) return;
  const S=evaluate(state.p);
  // panel
  if(S.car>=0) setPanel(S.car);
  const vis=S.vis;
  panel.style.transform=phone()?"translate3d(0,"+((1-vis)*105).toFixed(2)+"%,0)":"translate3d("+((1-vis)*105).toFixed(2)+"%,0,0)";
  const live=vis>.5; panel.style.pointerEvents=live?"auto":"none"; panel.setAttribute("aria-hidden",live?"false":"true");
  carTag.style.opacity=vis; carTag.style.transform="translateY("+((1-vis)*10).toFixed(1)+"px)";
  if(S.car>=0 && S.ang!==lastAng){ lastAng=S.ang; chip.textContent=ANG_NAMES[S.ang]; dots.forEach((d,j)=>d.classList.toggle("on",j===S.ang)); }
  const ctr=S.car>=0&&vis>.3?("0"+(S.car+1)+" / 0"+CARS.length+" · "+CARS[S.car].label):"Lot view";
  if(ctrEl.textContent!==ctr) ctrEl.textContent=ctr;
  // hero copy
  const hp=THREE.MathUtils.clamp((state.p-U.hero*.35)/(U.hero*.9),0,1);
  heroCopy.style.opacity=(1-hp).toFixed(3); heroCopy.style.transform="translateY("+(-30*hp).toFixed(1)+"px)";
  // camera
  const OV=window.__ov; if(OV){S.pose.pos.set(...OV.pos);S.pose.tgt.set(...OV.tgt);S.pose.up.set(0,1,0);}
  camera.position.copy(S.pose.pos); camera.up.copy(S.pose.up); camera.lookAt(S.pose.tgt);
  const heroLift=phone()?view.h*.09*S.aerialAmt:0;
  const ox=view.panelShift*vis+(phone()&&view.w<600?view.w*.13*S.aerialAmt:0), oy=view.sheetShift*vis+heroLift;
  if(ox||oy){ camera.setViewOffset(view.w,view.h,ox,oy,view.w,view.h); } else if(camera.view&&camera.view.enabled){ camera.clearViewOffset(); }
  camera.updateMatrixWorld();
  placeMarkers(Math.max(0,(S.aerialAmt-.55)/.45));
  const p=camera.position, key=p.x.toFixed(3)+","+p.y.toFixed(3)+","+p.z.toFixed(3)+","+camera.quaternion.x.toFixed(4)+","+camera.quaternion.y.toFixed(4)+","+ox.toFixed(1)+","+oy.toFixed(1)+","+view.w+"x"+view.h;
  if(key!==lastKey||forceFrames>0){ lastKey=key; forceFrames--; renderer.render(scene,camera); }
}
requestAnimationFrame(frame);

/* ---------- load ---------- */
const barFill=$("#barFill"), lTxt=$("#lTxt");
function prog(f){ const pc=Math.round(f*100); barFill.style.width=pc+"%"; lTxt.textContent="Opening the lot "+pc+"%"; }
const draco=new DRACOLoader(); draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
const loader=new GLTFLoader(); loader.setDRACOLoader(draco);
const tl=new THREE.TextureLoader();
const P={a:0,b:0};
const upd=()=>prog(Math.min(.97,P.a*.9+P.b*.1));
const loadGLB=(u,k)=>new Promise((res,rej)=>loader.load(u,res,x=>{ if(x.total){P[k]=x.loaded/x.total; upd();} },rej));
Promise.all([
  new Promise((res,rej)=>tl.load("models/car_ao.png",res,undefined,rej)),
  loadGLB("models/car.glb?v=2","a"),
  loadGLB("models/car_lod.glb?v=2","b")
]).then(([ao,g,lod])=>{
  shadowTex=ao; prog(1);
  buildLot();
  setupShowcase(g.scene);
  setupParked(lod.scene);
  renderer.shadowMap.needsUpdate=true;
  build();
  setPanel(0);
  ready=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ $("#loader").classList.add("done"); window.__ready=true; }));
}).catch(err=>{ lTxt.textContent="The 3D lot could not load. Please refresh."; console.warn(err); });

/* ---------- resize ---------- */
let rw=window.innerWidth, rh=window.innerHeight;
window.addEventListener("resize",()=>{
  const w=window.innerWidth, h=window.innerHeight;
  if(w===rw && Math.abs(h-rh)<120){ layout(); return; }
  rw=w; rh=h; if(ready) build(); else layout();
});
layout();
window.__demo={showcase,state,SEG,TOTAL,pToScroll,CARS,camera,scene,goCar,get R(){return view.R;}};
