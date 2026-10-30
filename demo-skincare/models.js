
// Aurelle Botanica: procedural product models (Three.js)
export function makeLabel(THREE, {w=1024,h=384,bg='rgba(0,0,0,0)',lines=[]}){
  const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d');
  g.fillStyle=bg; g.fillRect(0,0,w,h); g.textAlign='center'; g.textBaseline='middle';
  for(const l of lines){ g.fillStyle=l.color||'#5a3d36'; g.font=l.font; if(l.spacing){ g.letterSpacing=l.spacing; } g.fillText(l.text,w/2,l.y*h); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
function lathe(THREE, pts, seg=96){ return new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])), seg); }
function roundProfile(r,h,rb,rt,steps=10,inner=null){
  // closed outer profile: bottom centre -> bottom edge (rounded) -> up -> top edge (rounded) -> top centre
  const p=[[0,0]];
  for(let i=0;i<=steps;i++){const a=-Math.PI/2+i/steps*Math.PI/2; p.push([r-rb+Math.cos(a)*rb, rb+Math.sin(a)*rb]);}
  for(let i=0;i<=steps;i++){const a=i/steps*Math.PI/2; p.push([r-rt+Math.cos(a)*rt, h-rt+Math.sin(a)*rt]);}
  p.push([0,h]); return p;
}
export function glassMat(THREE, tint=0xfff4f1){
  return new THREE.MeshPhysicalMaterial({color:tint, metalness:0, roughness:0.06, transmission:1, thickness:0.6, ior:1.45,
    clearcoat:1, clearcoatRoughness:0.04, envMapIntensity:1.2, attenuationColor:new THREE.Color(0xf6d6cf), attenuationDistance:2.5});
}
export function goldMat(THREE, color=0xe3c79d){ return new THREE.MeshPhysicalMaterial({color, metalness:0.55, roughness:0.28, clearcoat:0.6, clearcoatRoughness:0.15, envMapIntensity:1.3}); }
export function creamMat(THREE, color=0xd99a95){ return new THREE.MeshPhysicalMaterial({color, roughness:0.42, sheen:0.3, sheenColor:new THREE.Color(0xffe9e4), sheenRoughness:0.6, clearcoat:0.25, clearcoatRoughness:0.5}); }

// Jar: returns {group, lid, body}
export function buildJar(THREE, o={}){
  const R=o.r||1, H=o.h||1.05;
  const group=new THREE.Group(), body=new THREE.Group(); group.add(body);
  // outer glass with thick walls: outer shell + inner shell (double sided not needed: lathe closed path outer->inner)
  const wall=0.13, base=0.2;
  const outer=[]; const st=12;
  outer.push([0.001,0]);
  for(let i=0;i<=st;i++){const a=-Math.PI/2+i/st*Math.PI/2; outer.push([R-0.18+Math.cos(a)*0.18, 0.18+Math.sin(a)*0.18]);}
  outer.push([R,H-0.12]);
  outer.push([R-0.08,H-0.06]); outer.push([R-0.08,H]); // neck step
  outer.push([R-wall-0.02,H]);
  outer.push([R-wall-0.02,H-0.05]);
  for(let i=0;i<=st;i++){const a=i/st*Math.PI/2; outer.push([R-wall-0.12+Math.cos(a)*0.12, base+0.12-Math.sin(a)*0.12]);} // inner down to base (reversed)
  // fix order of inner arc: goes from top of arc down
  outer.push([0.001,base]);
  const glass=new THREE.Mesh(lathe(THREE,outer,128), glassMat(THREE,o.tint));
  body.add(glass);
  // cream inside
  const cr=R-wall-0.03, ch=H-0.08;
  const creamBody=new THREE.Mesh(new THREE.CylinderGeometry(cr,cr-0.02,ch-base-0.02,96,1,false), creamMat(THREE,o.cream));
  creamBody.position.y=base+0.01+(ch-base-0.02)/2; body.add(creamBody);
  // swirl top
  const sg=new THREE.RingGeometry(0.0001,cr,160,40); const pos=sg.attributes.position; const scol=[];
  sg.rotateX(-Math.PI/2);
  for(let i=0;i<pos.count;i++){ const x=pos.getX(i), z=pos.getZ(i); const r=Math.hypot(x,z)/cr; const th=Math.atan2(z,x);
    const sv=Math.pow(Math.sin(th+r*13),2); const peak=0.3*Math.exp(-r*r*4.5); const swirl=0.075*sv*(1-r*0.7)*Math.min(1,r*5); pos.setY(i, peak+swirl);
    const sh=0.72+0.28*sv*Math.min(1,r*5)+ (1-Math.min(1,r*5))*0.28; scol.push(sh,sh*0.97,sh*0.97); }
  sg.setAttribute('color',new THREE.Float32BufferAttribute(scol,3)); sg.computeVertexNormals();
  const sm=creamMat(THREE,o.cream); sm.vertexColors=true; sm.clearcoat=0.7; sm.clearcoatRoughness=0.25;
  const swirl=new THREE.Mesh(sg, sm); swirl.position.y=ch-0.01; body.add(swirl);
  // label band
  if(o.label!==false){
    const lt=o.labelTex; const band=new THREE.Mesh(new THREE.CylinderGeometry(R+0.004,R+0.004,0.46,128,1,true,-Math.PI*0.42,Math.PI*0.84),
      new THREE.MeshPhysicalMaterial({map:lt, transparent:true, roughness:0.4, metalness:0.0, clearcoat:0.5}));
    band.position.y=H*0.47; band.rotation.y=Math.PI*0.5+Math.PI; body.add(band); band.rotation.y=-Math.PI/2+Math.PI/2; 
  }
  // lid
  const lid=new THREE.Group();
  const lr=R+0.03, lh=o.lidH||0.42;
  const lidMesh=new THREE.Mesh(lathe(THREE, roundProfile(lr,lh,0.04,0.09,10),128), o.lidMat||goldMat(THREE,o.lidColor));
  lid.add(lidMesh);
  // ridges ring
  const ring=new THREE.Mesh(new THREE.TorusGeometry(lr-0.005,0.012,12,128), o.lidMat||goldMat(THREE,o.lidColor)); ring.rotation.x=Math.PI/2; ring.position.y=lh*0.18; lid.add(ring);
  if(o.lidTex){ const top=new THREE.Mesh(new THREE.CircleGeometry(lr-0.14,96), new THREE.MeshPhysicalMaterial({map:o.lidTex, transparent:true, metalness:0.9, roughness:0.35, color:0xffffff}));
    top.rotation.x=-Math.PI/2; top.position.y=lh+0.002; lid.add(top); }
  lid.position.y=H-0.06; group.add(lid);
  group.userData={H,R};
  return {group, lid, body, H};
}

// Dropper serum bottle
export function buildDropper(THREE,o={}){
  const g=new THREE.Group();
  const p=[[0.001,0]]; for(let i=0;i<=10;i++){const a=-Math.PI/2+i/10*Math.PI/2; p.push([0.62+Math.cos(a)*0.12,0.12+Math.sin(a)*0.12]);}
  p.push([0.74,1.45]); for(let i=0;i<=10;i++){const a=i/10*Math.PI/2; p.push([0.36+0.38*Math.cos(a),1.45+0.32*Math.sin(a)]);} p.push([0.3,1.82]);p.push([0.3,1.9]);p.push([0.001,1.9]);
  const glass=new THREE.Mesh(lathe(THREE,p,96), glassMat(THREE,o.tint||0xffe7d6)); g.add(glass);
  const liq=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,1.15,64), new THREE.MeshPhysicalMaterial({color:o.liquid||0xe8894a, roughness:0.15, transmission:0.5, thickness:1, clearcoat:1}));
  liq.position.y=0.72; g.add(liq);
  const collar=new THREE.Mesh(lathe(THREE,roundProfile(0.36,0.42,0.03,0.05),96), goldMat(THREE)); collar.position.y=1.82; g.add(collar);
  const bp=[[0.001,0]]; for(let i=0;i<=16;i++){const a=i/16*Math.PI; bp.push([0.24*Math.sin(a)+0.001+ (i<8?0.02:0), 0.75*(1-Math.cos(a))/2]);} 
  const bulb=new THREE.Mesh(new THREE.CapsuleGeometry(0.22,0.38,12,32), new THREE.MeshPhysicalMaterial({color:o.bulb||0x3a2a26, roughness:0.35, clearcoat:0.8}));
  bulb.position.y=2.24+0.25; g.add(bulb);
  if(o.labelTex){ const band=new THREE.Mesh(new THREE.CylinderGeometry(0.745,0.745,0.6,96,1,true,-Math.PI*0.4,Math.PI*0.8), new THREE.MeshPhysicalMaterial({map:o.labelTex,transparent:true,roughness:0.4})); band.position.y=0.78; g.add(band); }
  return g;
}
// Pump bottle
export function buildPump(THREE,o={}){
  const g=new THREE.Group();
  const body=new THREE.Mesh(lathe(THREE, roundProfile(0.62,2.1,0.16,0.22),96), new THREE.MeshPhysicalMaterial({color:o.color||0xf1dfe6, roughness:0.32, clearcoat:1, clearcoatRoughness:0.1}));
  g.add(body);
  const neck=new THREE.Mesh(lathe(THREE,roundProfile(0.3,0.36,0.02,0.05),64), goldMat(THREE)); neck.position.y=2.06; g.add(neck);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.3,32), goldMat(THREE)); stem.position.y=2.55; g.add(stem);
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.2,0.34), lacquerMat(THREE)); head.position.y=2.75; g.add(head);
  const spout=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.5,24), goldMat(THREE)); spout.rotation.z=Math.PI/2; spout.position.set(0.38,2.78,0); g.add(spout);
  if(o.labelTex){ const band=new THREE.Mesh(new THREE.CylinderGeometry(0.625,0.625,0.9,96,1,true,-Math.PI*0.4,Math.PI*0.8), new THREE.MeshPhysicalMaterial({map:o.labelTex,transparent:true,roughness:0.4})); band.position.y=1.0; g.add(band); }
  return g;
}

// Peony bloom from shaped petals
export function buildPeony(THREE, o={}){
  const g=new THREE.Group();
  const base=new THREE.Color(o.color||0xeb9ca6), tip=new THREE.Color(o.tip||0xfad3d4), deep=new THREE.Color(o.deep||0xb84d61);
  const mat=new THREE.MeshPhysicalMaterial({vertexColors:true, roughness:0.55, sheen:0.35, sheenColor:new THREE.Color(0xffe0e6), sheenRoughness:0.5, side:THREE.DoubleSide});
  let seed=o.seed||7; const rnd=()=>{seed=(seed*16807)%2147483647; return seed/2147483647;};
  const petalGeo=(w,len,cup,bend,ph)=>{
    const geo=new THREE.PlaneGeometry(1,1,14,16); const pos=geo.attributes.position; const col=[];
    for(let i=0;i<pos.count;i++){ const u=pos.getX(i)*2, v=pos.getY(i)+0.5;
      const vv=Math.pow(Math.min(v,0.999),1.6); const wid=w*Math.sqrt(Math.max(0,1-(2*vv-1)*(2*vv-1)))*0.92+0.04*w;
      const x=u*wid/2, y=v*len;
      const z=-cup*u*u*wid*0.55 + bend*v*v*len + 0.015*len*Math.sin(u*5+ph)*v*v;
      pos.setXYZ(i,x,y,z);
      const c=deep.clone().lerp(base,Math.min(1,v*2)).lerp(tip,Math.max(0,v-0.5)*1.6); col.push(c.r,c.g,c.b); }
    geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); geo.computeVertexNormals(); return geo; };
  // [count, length, width, open(rad), cup, bend, radius]
  const layers=o.layers||[[6,0.42,0.42,0.12,0.9,-0.05,0.03],[8,0.6,0.6,0.38,0.8,0.0,0.07],[10,0.82,0.8,0.7,0.65,0.08,0.12],[12,1.0,0.95,1.05,0.5,0.18,0.16],[10,1.08,1.0,1.35,0.4,0.25,0.2]];
  layers.forEach(([n,len,w,open,cup,bend,rad],li)=>{
    for(let k=0;k<n;k++){
      const piv=new THREE.Group(); piv.rotation.y=k/n*Math.PI*2+li*0.55+rnd()*0.25; g.add(piv);
      const m=new THREE.Mesh(petalGeo(w*(0.9+rnd()*0.2),len*(0.9+rnd()*0.18),cup,bend,rnd()*6), mat);
      m.position.set(0,0,rad); m.rotation.x=open+(rnd()-0.5)*0.15; m.rotation.z=(rnd()-0.5)*0.2; piv.add(m);
    }
  });
  const ctr=new THREE.Mesh(new THREE.SphereGeometry(0.1,16,12), new THREE.MeshStandardMaterial({color:0xf2c27e, roughness:0.85})); ctr.position.y=0.12; g.add(ctr);
  return g;
}

export function buildPetal(THREE, color=0xf3b8b9){
  const geo=new THREE.SphereGeometry(1,16,10,0,Math.PI*0.6,0,Math.PI*0.4); geo.scale(0.22,0.32,0.22);
  return new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({color, roughness:0.6, sheen:1, sheenColor:new THREE.Color(0xffeef0), side:THREE.DoubleSide}));
}

export async function stage(THREE, renderer, scene, RoomEnvironment){
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05; renderer.outputColorSpace=THREE.SRGBColorSpace;
  const pm=new THREE.PMREMGenerator(renderer); scene.environment=pm.fromScene(new RoomEnvironment(),0.04).texture;
  const key=new THREE.DirectionalLight(0xfff1e6,2.2); key.position.set(3,5,4); scene.add(key);
  const rim=new THREE.DirectionalLight(0xffd9d2,1.4); rim.position.set(-4,2,-3); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xfff6f0,0xe9c9c0,0.6));
}
export async function labels(THREE){
  await document.fonts.load('400 80px "Playfair Display"'); await document.fonts.load('500 30px "Inter"'); await document.fonts.load('400 80px "Playfair Display"'); await document.fonts.load('italic 400 60px "Playfair Display"');
  const ink='#2b2130';
  const jar=makeLabel(THREE,{w:1400,h:330,lines:[
    {text:'AURELLE',font:'400 120px "Playfair Display"',y:0.33,color:ink,spacing:'26px'},
    {text:'PEONY CLOUD CREAM',font:'500 34px "Inter"',y:0.66,color:ink,spacing:'12px'},
    {text:'Whipped moisture  ·  50 ml',font:'italic 400 44px "Playfair Display"',y:0.87,color:'#6a5a6e'}]});
  const lid=makeLabel(THREE,{w:512,h:512,lines:[{text:'A',font:'italic 400 230px "Playfair Display"',y:0.5,color:'rgba(214,190,150,0.75)'}]});
  const serum=makeLabel(THREE,{w:900,h:420,lines:[
    {text:'AURELLE',font:'400 110px "Playfair Display"',y:0.3,color:ink,spacing:'20px'},
    {text:'PETAL DEW SERUM',font:'500 38px "Inter"',y:0.62,color:ink,spacing:'9px'},
    {text:'30 ml',font:'italic 400 46px "Playfair Display"',y:0.84,color:'#6a5a6e'}]});
  const pump=makeLabel(THREE,{w:900,h:620,lines:[
    {text:'AURELLE',font:'400 120px "Playfair Display"',y:0.28,color:ink,spacing:'22px'},
    {text:'ROSE MILK',font:'500 44px "Inter"',y:0.56,color:ink,spacing:'12px'},
    {text:'CLEANSER',font:'500 44px "Inter"',y:0.68,color:ink,spacing:'12px'},
    {text:'150 ml',font:'italic 400 50px "Playfair Display"',y:0.86,color:'#6a5a6e'}]});
  const eye=makeLabel(THREE,{w:1400,h:330,lines:[
    {text:'AURELLE',font:'400 120px "Playfair Display"',y:0.33,color:ink,spacing:'26px'},
    {text:'SILK EYE BALM',font:'500 34px "Inter"',y:0.66,color:ink,spacing:'12px'},
    {text:'15 ml',font:'italic 400 44px "Playfair Display"',y:0.87,color:'#6a5a6e'}]});
  return {jar,lid,serum,pump,eye};
}

export function lacquerMat(THREE, color=0x1d1420){ return new THREE.MeshPhysicalMaterial({color, metalness:0.1, roughness:0.18, clearcoat:1, clearcoatRoughness:0.06, envMapIntensity:0.55}); }
