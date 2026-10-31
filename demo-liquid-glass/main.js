(function(){
'use strict';
var DPR=Math.min(window.devicePixelRatio||1,1.5);
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s){return document.querySelector(s)};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var root=document.documentElement;
var VW=innerWidth,VH=innerHeight;
var T0=performance.now();
var virt=/[?&]frames/.test(location.search),vt=0;
var tnow=function(){return virt?vt:(performance.now()-T0)/1000};

/* ---------- WebGL helpers ---------- */
var VS='attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
function ctx(c){var gl=null;try{gl=c.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:false})}catch(e){}return gl}
function sh(gl,type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){throw new Error(gl.getShaderInfoLog(s))}return s}
function program(gl,fs){var p=gl.createProgram();gl.attachShader(p,sh(gl,gl.VERTEX_SHADER,VS));gl.attachShader(p,sh(gl,gl.FRAGMENT_SHADER,fs));gl.bindAttribLocation(p,0,'p');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));var u={};var n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(var i=0;i<n;i++){var info=gl.getActiveUniform(p,i);var nm=info.name.replace('[0]','');u[nm]=gl.getUniformLocation(p,info.name)}return {p:p,u:u}}
function quad(gl){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0)}
var PREC='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';

var glOK=true;
function fail(e){glOK=false;root.classList.add('no-gl');root.classList.remove('has-gl');if(window.console&&e)console.warn('WebGL fallback:',e.message||e)}
(function(){var c=document.createElement('canvas');if(!ctx(c))fail(new Error('no webgl'));else root.classList.add('has-gl')})();

/* ---------- Jellyfish ---------- */
var JFS=PREC+'varying vec2 v;uniform sampler2D tex;uniform float t,hue,sat;uniform vec2 pad;\n'+
'vec3 hr(vec3 c,float a){const vec3 k=vec3(.57735);float ca=cos(a);return c*ca+cross(k,c)*sin(a)+k*dot(k,c)*(1.-ca);}\n'+
'vec4 S(vec2 q){if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return vec4(0.);return texture2D(tex,q);}\n'+
'void main(){vec2 uv=vec2(v.x,1.-v.y);vec2 q=(uv-pad)/(1.-2.*pad);float y=q.y;\n'+
' float sw=smoothstep(.3,1.,y);q.x+=sw*(sin(y*7.-t*1.6)*.02+sin(y*3.3-t*.8)*.016);q.y+=sw*sin(y*5.-t*1.2)*.006;\n'+
' vec2 bc=vec2(.55,.16);float bell=1.-smoothstep(.12,.42,y);float pu=sin(t*2.1)*.035*bell;q=bc+(q-bc)*vec2(1.-pu,1.+pu*.7);\n'+
' vec4 c=S(q);vec3 col=hr(c.rgb,hue);float l=dot(col,vec3(.299,.587,.114));col=clamp(mix(vec3(l),col,sat),0.,1.);\n'+
' float g=0.;g+=S(q+vec2(.02,0.)).a;g+=S(q-vec2(.02,0.)).a;g+=S(q+vec2(0.,.014)).a;g+=S(q-vec2(0.,.014)).a;g*=.25;\n'+
' col+=vec3(.06)*sin(t*1.4+y*9.)*bell*c.a;\n'+
' float a=c.a;vec3 glow=hr(vec3(.75,.45,1.),hue)*g*.28*(1.-a);\n'+
' gl_FragColor=vec4(col*a+glow,a+g*.12*(1.-a));}';

var jelly={el:$('#jelly'),cv:$('#jellyCanvas'),img:$('#jellyImg'),gl:null,ready:false,w:0,h:0,pad:[.1,.04]};
function jellyLayout(){
  var H=VH,W=VW,ar=689/1150;
  var jh=Math.min(H*0.72,(W*0.98)/ar,1000), jw=jh*ar;
  var bw=jw*1.2, bh=jh*1.08; jelly.pad=[(bw-jw)/2/bw,(bh-jh)/2/bh];
  var top=Math.max(88,(H-jh)/2-H*0.02);
  var s=jelly.el.style;s.width=bw+'px';s.height=bh+'px';s.marginLeft=(-bw/2+jw*.06)+'px';s.top=(top-(bh-jh)/2)+'px';
  var is=jelly.img.style;is.width=jw+'px';is.height=jh+'px';is.left=((bw-jw)/2)+'px';is.top=((bh-jh)/2)+'px';
  jelly.w=Math.round(bw*DPR);jelly.h=Math.round(bh*DPR);
  if(jelly.cv.width!==jelly.w){jelly.cv.width=jelly.w;jelly.cv.height=jelly.h}
}
function jellyInit(){
  if(!glOK)return;
  try{
    var gl=jelly.gl=ctx(jelly.cv);if(!gl)throw new Error('ctx');
    quad(gl);jelly.pr=program(gl,JFS);gl.useProgram(jelly.pr.p);
    var tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    var go=function(){try{gl.bindTexture(gl.TEXTURE_2D,tx);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,jelly.img);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);jelly.ready=true}catch(e){jellyFail(e)}};
    if(jelly.img.complete&&jelly.img.naturalWidth)go();else{jelly.img.addEventListener('load',go);jelly.img.addEventListener('error',function(){jellyFail(new Error('img'))})}
    jelly.cv.addEventListener('webglcontextlost',function(e){e.preventDefault();jellyFail(new Error('lost'))});
  }catch(e){jellyFail(e)}
}
function jellyFail(e){jelly.ready=false;jelly.el.classList.add('fb');jelly.cv.style.display='none';jelly.img.style.display='block';jelly.img.style.animation='jbob 6s ease-in-out infinite';if(e&&window.console)console.warn('jelly fallback',e.message||e)}
var heroState={hue:0,sat:1.25};
function jellyDraw(t){
  if(!jelly.ready)return;var gl=jelly.gl,u=jelly.pr.u;
  gl.viewport(0,0,jelly.w,jelly.h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(u.t,t);gl.uniform1f(u.hue,heroState.hue);gl.uniform1f(u.sat,heroState.sat);gl.uniform2f(u.pad,jelly.pad[0],jelly.pad[1]);gl.uniform1i(u.tex,0);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
}

/* ---------- Glass renderer (fluid background + refracting glass) ---------- */
var BGFS=PREC+'varying vec2 v;uniform float t,seed;uniform vec2 asp;uniform vec3 c0,c1,c2,c3;\n'+
'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}\n'+
'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}\n'+
'void main(){vec2 p=(v-.5)*asp*1.6+seed;\n'+
' vec2 q=vec2(fbm(p+t*.05),fbm(p+vec2(5.2,1.3)-t*.045));\n'+
' vec2 r=vec2(fbm(p+3.2*q+vec2(1.7,9.2)+t*.08),fbm(p+3.2*q+vec2(8.3,2.8)-t*.065));\n'+
' float f=fbm(p+3.*r);\n'+
' vec3 col=mix(c0,c1,smoothstep(.25,.75,f));\n'+
' col=mix(col,c2,smoothstep(.45,.95,length(q)*.85)*.85);\n'+
' float silk=pow(.5+.5*sin(f*11.+r.x*7.+t*.3),7.);\n'+
' col=mix(col,c3,silk*.8*smoothstep(.25,.7,r.y));\n'+
' col+=c3*pow(f,5.)*.6;\n'+
' gl_FragColor=vec4(col,1.);}';
var CFS=PREC+'varying vec2 v;uniform sampler2D bg;uniform vec2 res,org,bgs;uniform float clipR;uniform vec4 S[3];uniform vec2 R[3];uniform float N;uniform float frost;\n'+
'float sd(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}\n'+
'vec3 tp(vec2 px){return texture2D(bg,clamp(px/res,.002,.998)*bgs).rgb;}\n'+
'void main(){vec2 p=gl_FragCoord.xy-org;vec3 col=tp(p);\n'+
' for(int i=0;i<3;i++){if(float(i)>=N)break;vec2 c=S[i].xy;vec2 b=S[i].zw;float r=R[i].x;float k=R[i].y;vec2 lp=p-c;float d=sd(lp,b,r);\n'+
'  if(d>0.){float ds=sd(lp+vec2(0.,b.y*.08+6.),b,r);col*=1.-.28*exp(-max(ds,0.)/(10.+b.y*.12));continue;}\n'+
'  float bev=min(min(b.x,b.y)*.9,r*1.2+12.);float e=clamp(-d/bev,0.,1.);\n'+
'  vec2 g=vec2(sd(lp+vec2(1.,0.),b,r)-sd(lp-vec2(1.,0.),b,r),sd(lp+vec2(0.,1.),b,r)-sd(lp-vec2(0.,1.),b,r));vec2 nn=normalize(g+vec2(1e-5));\n'+
'  float bend=pow(1.-e,2.2)*k;vec2 base=c+lp*.93-nn*bend;float ca=1.+bend*.16;\n'+
'  vec3 gc=vec3(tp(base-nn*ca).r,tp(base).g,tp(base+nn*ca).b);\n'+
'  vec2 o=vec2(frost,0.);vec3 bl=(tp(base+o.xy)+tp(base-o.xy)+tp(base+o.yx)+tp(base-o.yx))*.25;gc=mix(gc,bl,.45);\n'+
'  gc=gc*1.06+.035;\n'+
'  vec2 L=normalize(vec2(-.55,.84));float rim=pow(1.-e,6.);\n'+
'  gc+=rim*(.75*max(dot(nn,L),0.)+.16);gc+=pow(1.-e,10.)*.35*max(dot(nn,-L),0.);\n'+
'  gc+=smoothstep(-1.6,0.,d)*.22;\n'+
'  col=mix(col,gc,smoothstep(.6,-.6,d));}\n'+
' float a=smoothstep(.6,-.6,sd(p-res*.5,res*.5,clipR));gl_FragColor=vec4(col*a,a);}';

function Glass(canvas){
  var gl=ctx(canvas);if(!gl)throw new Error('ctx');
  this.gl=gl;this.cv=canvas;quad(gl);
  this.bgp=program(gl,BGFS);this.cp=program(gl,CFS);
  this.tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  this.fb=gl.createFramebuffer();this.fw=0;this.fh=0;
  var self=this;canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();self.lost=true});
}
Glass.prototype.size=function(w,h){if(this.cv.width!==w||this.cv.height!==h){this.cv.width=w;this.cv.height=h}};
Glass.prototype.ensureFB=function(w,h){var gl=this.gl;if(w<=this.fw&&h<=this.fh)return;this.fw=Math.max(w,this.fw);this.fh=Math.max(h,this.fh);
  gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,this.fw,this.fh,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.tex,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null)};
Glass.prototype.clear=function(){var gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.cv.width,this.cv.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT)};
// vp: x,y,w,h in canvas px (y from bottom); pal: [c0,c1,c2,c3]; shapes: [{x,y,hw,hh,r,k}] in vp px (y up)
Glass.prototype.draw=function(vp,pal,seed,t,shapes,clipR,frost){
  var gl=this.gl;if(this.lost)return;var bw=Math.max(2,Math.ceil(vp[2]*.5)),bh=Math.max(2,Math.ceil(vp[3]*.5));this.ensureFB(bw,bh);
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.fb);gl.viewport(0,0,bw,bh);gl.disable(gl.SCISSOR_TEST);
  var u=this.bgp.u;gl.useProgram(this.bgp.p);gl.uniform1f(u.t,t);gl.uniform1f(u.seed,seed);
  var m=Math.max(vp[2],vp[3]);gl.uniform2f(u.asp,vp[2]/m*1.0,vp[3]/m*1.0);
  gl.uniform3fv(u.c0,pal[0]);gl.uniform3fv(u.c1,pal[1]);gl.uniform3fv(u.c2,pal[2]);gl.uniform3fv(u.c3,pal[3]);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(vp[0],vp[1],vp[2],vp[3]);
  u=this.cp.u;gl.useProgram(this.cp.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.uniform1i(u.bg,0);
  gl.uniform2f(u.res,vp[2],vp[3]);gl.uniform2f(u.org,vp[0],vp[1]);gl.uniform2f(u.bgs,bw/this.fw,bh/this.fh);gl.uniform1f(u.clipR,clipR);gl.uniform1f(u.frost,frost||3);
  var S=new Float32Array(12),R=new Float32Array(6);for(var i=0;i<shapes.length&&i<3;i++){var s=shapes[i];S[i*4]=s.x;S[i*4+1]=s.y;S[i*4+2]=s.hw;S[i*4+3]=s.hh;R[i*2]=s.r;R[i*2+1]=s.k}
  gl.uniform4fv(u.S,S);gl.uniform2fv(u.R,R);gl.uniform1f(u.N,Math.min(3,shapes.length));
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
};
function hex(h){return [parseInt(h.substr(1,2),16)/255,parseInt(h.substr(3,2),16)/255,parseInt(h.substr(5,2),16)/255]}
var PAL={
  navy:[hex('#040b2e'),hex('#0f2a8a'),hex('#2f62e6'),hex('#cfe0ff')],
  p0:[hex('#4a0508'),hex('#d1261a'),hex('#ff8a1f'),hex('#ffe2b0')],
  p1:[hex('#03123f'),hex('#0b55d6'),hex('#22d3ff'),hex('#d8fbff')],
  p2:[hex('#22073f'),hex('#7b2bd9'),hex('#ff5fc4'),hex('#ffe0f6')],
  p3:[hex('#3a0f4f'),hex('#ff5f7e'),hex('#ffc24a'),hex('#fff2c9')]
};

/* navy card */
var navy={el:$('#navy'),cv:$('#navyCanvas'),player:$('#player'),g:null,vis:false,drag:null,off:{x:0,y:0},idle:0};
function navyInit(){if(!glOK)return;try{navy.g=new Glass(navy.cv)}catch(e){navy.g=null;navyFallback(e)}}
function navyFallback(e){navy.el.querySelector('.navy-fb').style.display='block';navy.cv.style.display='none';navy.player.style.cssText+=';background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,.08));border:1px solid rgba(255,255,255,.4);-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%)';if(e&&window.console)console.warn('glass fallback',e.message||e)}
function navyDraw(t){
  var g=navy.g;if(!g||!navy.vis)return;
  var r=navy.el.getBoundingClientRect();var W=Math.round(r.width*DPR),H=Math.round(r.height*DPR);g.size(W,H);
  var pr=navy.player.getBoundingClientRect();
  var sh=[{x:(pr.left-r.left+pr.width/2)*DPR,y:H-(pr.top-r.top+pr.height/2)*DPR,hw:pr.width/2*DPR,hh:pr.height/2*DPR,r:26*DPR,k:30*DPR}];
  var lr=Math.min(r.width,r.height)*.13*DPR;
  sh.push({x:W*(.5+.3*Math.sin(t*.45)),y:H*(.86+.04*Math.sin(t*.8)),hw:lr,hh:lr,r:lr,k:lr*.55});
  sh.push({x:W*(.22+.08*Math.cos(t*.37)),y:H*(.14+.03*Math.cos(t*.6)),hw:lr*1.5,hh:lr*.55,r:lr*.55,k:lr*.45});
  g.clear();g.draw([0,0,W,H],PAL.navy,3.1,t*.9,sh,30*DPR,3.5*DPR);
}
// drag + float for the player
(function(){
  var p=navy.player;if(!p)return;
  p.addEventListener('pointerdown',function(e){if(e.target.closest('button'))return;navy.drag={x:e.clientX,y:e.clientY,ox:navy.off.x,oy:navy.off.y};p.classList.add('dragging');try{p.setPointerCapture(e.pointerId)}catch(_){}});
  p.addEventListener('pointermove',function(e){if(!navy.drag)return;var r=navy.el.getBoundingClientRect(),pr=p.getBoundingClientRect();
    var mx=(r.width-pr.width)/2-8,my=(r.height-pr.height)/2-8;navy.off.x=Math.max(-mx,Math.min(mx,navy.drag.ox+e.clientX-navy.drag.x));navy.off.y=Math.max(-my,Math.min(my,navy.drag.oy+e.clientY-navy.drag.y));navy.idle=tnow()+4});
  var up=function(){navy.drag=null;p.classList.remove('dragging');navy.idle=tnow()+3};
  p.addEventListener('pointerup',up);p.addEventListener('pointercancel',up);
})();
function playerFloat(t){
  if(!navy.player)return;var fx=0,fy=0;
  if(!navy.drag&&t>navy.idle&&!reduce){var k=Math.min(1,(t-navy.idle)/2);navy.off.x*=1-.02*k;navy.off.y*=1-.02*k;fx=Math.sin(t*.7)*14;fy=Math.sin(t*.9+1)*18}
  navy.player.style.transform='translate(calc(-50% + '+(navy.off.x+fx).toFixed(1)+'px), calc(-50% + '+(navy.off.y+fy).toFixed(1)+'px))';
}

/* services grid */
var grid={el:$('#grid'),cv:$('#gridCanvas'),g:null,vis:false,tiles:$$('.tile-art')};
function gridInit(){if(!glOK)return;try{grid.g=new Glass(grid.cv)}catch(e){grid.g=null;root.classList.add('no-gl')}}
var SHP=[
  function(w,h,t){var r=w*.27;return {x:w*(.5+.17*Math.sin(t*.6)),y:h*(.5+.15*Math.cos(t*.5)),hw:r,hh:r,r:r,k:r*.6}},
  function(w,h,t){return {x:w*(.5+.1*Math.sin(t*.5)),y:h*(.5+.22*Math.sin(t*.7)),hw:w*.36,hh:w*.13,r:w*.13,k:w*.12}},
  function(w,h,t){var r=w*.24;return {x:w*(.5+.15*Math.cos(t*.55)),y:h*(.5+.15*Math.sin(t*.65)),hw:r,hh:r,r:w*.09,k:r*.55}},
  function(w,h,t){return {x:w*(.5+.14*Math.sin(t*.45+1)),y:h*(.5+.16*Math.cos(t*.6)),hw:w*.31,hh:w*.21,r:w*.21,k:w*.14}}
];
var GP=[PAL.p0,PAL.p1,PAL.p2,PAL.p3];
function gridDraw(t){
  var g=grid.g;if(!g||!grid.vis)return;
  var r=grid.el.getBoundingClientRect();var W=Math.round(r.width*DPR),H=Math.round(r.height*DPR);g.size(W,H);g.clear();
  for(var i=0;i<grid.tiles.length;i++){var tr=grid.tiles[i].getBoundingClientRect();
    if(tr.bottom<0||tr.top>VH)continue;
    var x=Math.round((tr.left-r.left)*DPR),w=Math.round(tr.width*DPR),h=Math.round(tr.height*DPR),y=H-Math.round((tr.top-r.top)*DPR)-h;
    g.draw([x,y,w,h],GP[i],i*7.3+1.2,t*.8+i,[SHP[i](w,h,t+i*2)],24*DPR,2.5*DPR);
  }
}

/* ---------- hero scroll ---------- */
var hero=$('.hero'),track=$('#track'),words=$$('.word'),side=$('#heroSide');
var HUES=[0,-.5,.22,-.85];
function fitWords(){
  words.forEach(function(w){w.style.fontSize='100px'});
  var maxw=0;words.forEach(function(w){maxw=Math.max(maxw,w.getBoundingClientRect().width)});
  var fs=Math.min(100*VW*.95/maxw, VH*0.42/0.86);
  words.forEach(function(w){w.style.fontSize=fs.toFixed(1)+'px'});
  $$('.slot').forEach(function(s){s.style.flexBasis=VW+'px'});
}
var cur={x:0,hue:0,js:1,jy:0,side:0},tgt={x:0,hue:0,js:1,jy:0,side:0};
function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
function heroTarget(){
  var r=hero.getBoundingClientRect();var span=r.height-VH;var p=Math.max(0,Math.min(1,-r.top/Math.max(1,span)));
  var n=words.length-1;var main=Math.min(1,p/0.86)*n;var i=Math.floor(main),f=main-i;if(i>=n){i=n;f=0}
  var e=i+ease(Math.max(0,Math.min(1,(f-.18)/.64)));
  tgt.x=-(e*VW)-(f-.5)*VW*.08*(i<n?1:0);
  var hi=Math.min(n,Math.floor(e)),hf=e-hi;tgt.hue=HUES[hi]+(HUES[Math.min(n,hi+1)]-HUES[hi])*hf;
  tgt.js=1-p*.08;tgt.jy=-p*VH*.04;tgt.side=Math.max(0,Math.min(1,(p-.88)/.08));
  return p;
}
function heroApply(dt){
  var k=reduce?1:1-Math.pow(.0009,dt);
  for(var key in tgt){cur[key]+=(tgt[key]-cur[key])*k}
  track.style.transform='translate3d('+cur.x.toFixed(1)+'px,0,0)';
  heroState.hue=cur.hue;
}

/* ---------- ring text ---------- */
function buildRings(){
  var fs=Math.round(Math.min(VW*.15,92));
  var mc=document.createElement('canvas').getContext('2d');mc.font=fs+'px Anton, Impact, sans-serif';
  var Rt=Math.min(VW*.44,360);
  $$('.ring').forEach(function(ring,ri){
    var chars=Array.from(ring.getAttribute('data-text'));
    var ws=chars.map(function(ch){return ch===' '?fs*.28:(ch==='✦'?fs*.8:mc.measureText(ch).width+fs*.03)});
    var one=ws.reduce(function(a,b){return a+b},0);var circ=2*Math.PI*Rt;var reps=Math.max(1,Math.round(circ/one));
    var all=[],aw=[];for(var k=0;k<reps;k++){all=all.concat(chars);aw=aw.concat(ws)}
    var tot=aw.reduce(function(a,b){return a+b},0);var R=tot/(2*Math.PI);
    ring.innerHTML='';ring.style.setProperty('--fs',fs+'px');ring.style.top=((ri-.5)*fs*1.18-fs/2)+'px';
    var acc=0;
    all.forEach(function(ch,i){var w=aw[i];var a=(acc+w/2)/tot*360;acc+=w;if(ch===' ')return;
      var b=document.createElement('b');b.style.width=w+'px';b.style.left=(-w/2)+'px';b.style.transform='rotateY('+a.toFixed(3)+'deg) translateZ('+R.toFixed(1)+'px)';
      var fr=document.createElement('i');fr.className='fr';fr.textContent=ch;var bk=document.createElement('i');bk.className='bk';bk.textContent=ch;b.appendChild(fr);b.appendChild(bk);ring.appendChild(b)});
  });
}
var ringTilt=$('#ringTilt'),ringSec=$('.ring-sec');
function ringScroll(){var r=ringSec.getBoundingClientRect();if(r.bottom<0||r.top>VH)return;var p=(VH-r.top)/(VH+r.height);ringTilt.style.transform='rotateX('+(-18+p*14).toFixed(2)+'deg) rotateZ('+(-7+p*6).toFixed(2)+'deg)'}

/* ---------- typing ---------- */
var typed=$('#typed'),PH=['Welcome to MAWJ','Ideas that move like water','Made in Jeddah','Let\'s make waves'],ty={i:0,c:PH[0].length,del:false,next:0,on:false};
function typeTick(t){
  if(!ty.on||reduce)return;if(t<ty.next)return;var s=PH[ty.i];
  if(!ty.del){if(ty.c<s.length){ty.c++;ty.next=t+.07}else{ty.del=true;ty.next=t+1.8}}
  else{if(ty.c>0){ty.c--;ty.next=t+.035}else{ty.del=false;ty.i=(ty.i+1)%PH.length;ty.next=t+.35}}
  typed.textContent=PH[ty.i].slice(0,ty.c);
}

/* ---------- nav theme ---------- */
var darkEls=$$('[data-nav=dark]');
function navTheme(){var y=34,dark=false;for(var i=0;i<darkEls.length;i++){var r=darkEls[i].getBoundingClientRect();var trim=+(darkEls[i].getAttribute('data-trim')||0);if(r.top<=y&&r.bottom-trim>=y){dark=true;break}}document.body.classList.toggle('nav-dark',dark)}

/* ---------- player ---------- */
(function(){
  var tracks=[['Red Sea Drift','MAWJ Sound Lab',198],['Corniche Lights','Studio Tide',224],['Glass Hour','Noor & The Waves',187]];
  var ti=0,pos=42,playing=true,last=performance.now();
  var bar=$('#pbar'),tm=$('#ptime'),len=$('#plen'),pl=$('#play');
  function fmt(s){s=Math.floor(s);return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2)}
  function set(i){ti=(i+tracks.length)%tracks.length;pos=0;$('#ptitle').textContent=tracks[ti][0];$('#partist').textContent=tracks[ti][1];len.textContent=fmt(tracks[ti][2])}
  $('#prev').addEventListener('click',function(){set(ti-1)});$('#next').addEventListener('click',function(){set(ti+1)});
  pl.addEventListener('click',function(){playing=!playing;pl.setAttribute('aria-pressed',playing);pl.setAttribute('aria-label',playing?'Pause':'Play')});
  setInterval(function(){var now=performance.now();if(playing){pos+=(now-last)/1000;if(pos>tracks[ti][2])set(ti+1)}last=now;bar.style.width=(pos/tracks[ti][2]*100).toFixed(2)+'%';tm.textContent=fmt(pos)},250);
})();

/* form */
$('#form').addEventListener('submit',function(e){e.preventDefault();$('#formNote').textContent='Thanks! This is a concept demo, so nothing was sent.'});

/* ---------- visibility ---------- */
var heroVis=true;
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(en){var t=en.target;
    if(t===hero)heroVis=en.isIntersecting;else if(t===navy.el)navy.vis=en.isIntersecting;else if(t===grid.el)grid.vis=en.isIntersecting;else if(t.classList.contains('night'))ty.on=en.isIntersecting})},{rootMargin:'120px 0px'});
  [hero,navy.el,grid.el,$('.night')].forEach(function(e){io.observe(e)});
}else{navy.vis=grid.vis=ty.on=true}

/* ---------- layout + loop ---------- */
function layout(){VW=document.documentElement.clientWidth;VH=window.innerHeight;fitWords();jellyLayout();buildRings()}
var lastW=0;
function onResize(){var w=document.documentElement.clientWidth;if(w===lastW&&Math.abs(innerHeight-VH)<120)return;lastW=w;layout()}
window.addEventListener('resize',onResize);
layout();lastW=VW;
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){layout()});
window.addEventListener('load',function(){layout()});
jellyInit();navyInit();gridInit();
if(!glOK){jellyFail()}
var prevT=tnow();
window.__mawj={frame:function(dt){dt=dt||1/24;vt+=dt;if(document.getAnimations)document.getAnimations().forEach(function(a){try{a.pause();a.currentTime=vt*1000}catch(e){}});step(dt)},ready:function(){return !glOK||jelly.ready},drag:function(x,y){navy.off.x=x;navy.off.y=y;navy.idle=vt+3}};
function step(dt){
  var t=tnow();heroTarget();heroApply(Math.min(dt,.1));
  var bob=reduce?0:Math.sin(t*.9)*VH*.012;
  jelly.el.style.transform='translate3d(0,'+(cur.jy+bob).toFixed(1)+'px,0) rotate('+(5+Math.sin(t*.5)*1.5).toFixed(2)+'deg) scale('+cur.js.toFixed(4)+')';
  side.style.opacity=cur.side.toFixed(3);side.style.transform='translateY('+((1-cur.side)*20).toFixed(1)+'px)';
  if(heroVis)jellyDraw(t);
  navyDraw(t);playerFloat(t);gridDraw(t);typeTick(t);ringScroll();navTheme();
}
function loop(){var t=tnow();var dt=t-prevT;prevT=t;try{step(dt)}catch(e){if(window.console)console.warn(e)}requestAnimationFrame(loop)}
if(!virt)requestAnimationFrame(loop);
})();
