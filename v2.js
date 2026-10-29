(function(){
"use strict";
var d=document,w=window,root=d.documentElement;
var rm=w.matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine=w.matchMedia('(pointer: fine)').matches&&w.matchMedia('(hover: hover)').matches;
var low=w.innerWidth<820||(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4;
if(low)root.classList.add('lowfx');if(rm)root.classList.add('nofx');
var $=function(s,c){return (c||d).querySelector(s)},$$=function(s,c){return [].slice.call((c||d).querySelectorAll(s))};
function onScroll(f){w.addEventListener('scroll',f,{passive:true})}

/* boot */
(function(){var b=$('#boot');if(!b)return;
  if(!root.classList.contains('booting')){b.remove();return}
  var log=$('#boot-log'),bar=$('#boot-bar');
  var lines=['> init portfolio.v2','> loading profile: MOHAMMAD GULAB','> modules: services, websites, node.js','> mounting 34 projects','> status: available for freelance','> ready'];
  var i=0;function step(){if(i<lines.length){log.textContent+=lines[i]+'\n';i++;bar.style.width=(i/lines.length*100)+'%';setTimeout(step,170)}else{setTimeout(done,220)}}
  function done(){b.classList.add('done');root.classList.remove('booting');try{sessionStorage.setItem('mgboot','1')}catch(e){}setTimeout(function(){b.remove()},600);heroIn()}
  step();
})();
var heroed=false;function heroIn(){if(heroed)return;heroed=true;$$('.glitch').forEach(function(g,k){setTimeout(function(){scramble(g,900)},k*180)})}
if(!root.classList.contains('booting'))setTimeout(heroIn,150);

/* header + progress + nav active */
var hdr=$('.hdr'),bar=$('.progress i');
function sc(){var y=w.scrollY;hdr.classList.toggle('scrolled',y>10);var h=root.scrollHeight-w.innerHeight;bar.style.transform='scaleX('+(h>0?Math.min(1,y/h):0)+')'}
sc();onScroll(sc);w.addEventListener('resize',sc);
var navs=$$('.nav a');
if('IntersectionObserver' in w){var nio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){navs.forEach(function(a){a.classList.toggle('act',a.getAttribute('href')==='#'+e.target.id)})}})},{rootMargin:'-45% 0px -50% 0px'});$$('main section[id]').forEach(function(s){nio.observe(s)})}

/* menu */
var mb=$('.menu-btn'),menu=$('#menu'),mx=$('.menu-x');
function setMenu(o){menu.classList.toggle('open',o);menu.setAttribute('aria-hidden',o?'false':'true');mb.setAttribute('aria-expanded',o?'true':'false');d.body.classList.toggle('menu-open',o);if(o){setTimeout(function(){mx.focus()},50)}else mb.focus({preventScroll:true})}
mb.addEventListener('click',function(){setMenu(true)});mx.addEventListener('click',function(){setMenu(false)});
menu.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false)});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&menu.classList.contains('open'))setMenu(false)});

/* scramble */
var CH='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>*';
function scramble(el,dur){if(rm)return;var fin=el.getAttribute('data-text')||el.textContent;el.setAttribute('data-text',fin);var t0=performance.now();dur=dur||700;
  function f(now){var p=Math.min(1,(now-t0)/dur),n=Math.floor(p*fin.length),s='';for(var i=0;i<fin.length;i++){s+=i<n||fin[i]===' '?fin[i]:CH[(Math.random()*CH.length)|0]}el.textContent=s;if(p<1)requestAnimationFrame(f);else{el.textContent=fin;el.classList.add('glitching');setTimeout(function(){el.classList.remove('glitching')},600)}}
  requestAnimationFrame(f)}
if(!rm){setInterval(function(){var g=$$('.glitch');var el=g[(Math.random()*g.length)|0];if(el&&el.getBoundingClientRect().bottom>0){el.classList.add('glitching');setTimeout(function(){el.classList.remove('glitching')},600)}},3800)}

/* reveal */
var rv=$$('.rv');
if('IntersectionObserver' in w){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var t=e.target;t.classList.add('in');io.unobserve(t);var s=t.querySelector('[data-scramble]');if(s&&!s.classList.contains('glitch'))scramble(s,650);if(t.id==='term')term();$$('[data-count]',t).forEach(count)}})},{rootMargin:'0px 0px -8% 0px',threshold:.06});rv.forEach(function(el){io.observe(el)})}else rv.forEach(function(el){el.classList.add('in')});

/* typer */
(function(){var el=$('#typer');if(!el||rm)return;var roles=['Document Controller','Graphic Designer','Web Designer','Excel Specialist'],ri=0,ci=roles[0].length,del=true;
  function tick(){var r=roles[ri];if(del){ci--;el.textContent=r.slice(0,ci);if(ci<=0){del=false;ri=(ri+1)%roles.length}setTimeout(tick,ci<=0?260:38)}else{var r2=roles[ri];ci++;el.textContent=r2.slice(0,ci);if(ci>=r2.length){del=true;setTimeout(tick,1900)}else setTimeout(tick,70)}}
  setTimeout(tick,2600)})();

/* clock */
(function(){var el=$('#clock');if(!el)return;var f;try{f=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}catch(e){return}
  function t(){el.textContent=f.format(new Date())}t();setInterval(t,1000)})();

/* terminal */
var termDone=false;
function term(){if(termDone)return;termDone=true;var body=$('#tm-body');if(!body)return;
  var L=[['c','$ whoami'],['','Mohammad Gulab Kauser (KAISH)'],['c','$ cat role.txt'],['','Document Controller, graphic designer, web designer and Excel specialist, with hands-on experience in construction project documentation.'],['c','$ cat ./now'],['k','Qanbar Dywidag Precast Concrete Co. Ltd · Jeddah, Saudi Arabia'],['m','Projects: ROSHN Al Arous · NHC Maylaa'],['c','$ ls ./tools'],['','Excel  Aconex  SharePoint  Photoshop  Illustrator  HTML  CSS  JS  Node.js'],['c','$ status --freelance'],['g','OPEN · Fiverr · Freelancer · WhatsApp'],['c','$ _']];
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  if(rm){body.innerHTML=L.map(function(l){return '<span class="'+l[0]+'">'+esc(l[1])+'</span>'}).join('\n');return}
  var li=0,ci=0,html='';
  function step(){if(li>=L.length)return;var l=L[li],cmd=l[0]==='c';
    if(cmd){ci+=1;body.innerHTML=html+'<span class="c">'+esc(l[1].slice(0,ci))+'</span>';if(ci<l[1].length){setTimeout(step,28);return}}
    else{body.innerHTML=html+'<span class="'+l[0]+'">'+esc(l[1])+'</span>'}
    html=body.innerHTML+'\n';li++;ci=0;setTimeout(step,cmd?160:120)}
  step()}

/* counters */
function count(el){if(el._c)return;el._c=1;var n=+el.getAttribute('data-count');if(rm){el.textContent=n;return}var t0=performance.now();function f(now){var p=Math.min(1,(now-t0)/1200);el.textContent=Math.round(n*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)}requestAnimationFrame(f)}

/* filters */
var cards=$$('.card'),fb=$$('.fbtn'),moreW=$('.more'),moreB=$('#show-all'),LIMIT=9,expanded=false,cur='all';
function has(x,c){return (' '+x.getAttribute('data-cat')+' ').indexOf(' '+c+' ')>-1}
fb.forEach(function(b){var c=b.getAttribute('data-f'),n=c==='all'?cards.length:cards.filter(function(x){return has(x,c)}).length;var s=b.querySelector('sup');if(s)s.textContent=n;if(!n)b.hidden=true});
function apply(){var shown=0,total=0;cards.forEach(function(x){var ok=cur==='all'||has(x,cur);if(ok)total++;var vis=ok&&(expanded||cur!=='all'||shown<LIMIT);if(vis){shown++;x.classList.remove('hide');x.classList.add('in')}else x.classList.add('hide')});if(moreW)moreW.style.display=(cur==='all'&&!expanded&&total>LIMIT)?'flex':'none'}
fb.forEach(function(b){b.addEventListener('click',function(){cur=b.getAttribute('data-f');fb.forEach(function(o){o.setAttribute('aria-pressed',o===b?'true':'false')});apply()})});
if(moreB)moreB.addEventListener('click',function(){expanded=true;apply()});apply();

/* lightbox */
(function(){var lb=$('#lb'),img=$('#lb-img'),vid=$('#lb-vid'),cap=$('#lb-cap'),scr=$('#lb-scroll'),prev=$('.lb-prev'),next=$('.lb-next'),list=[],i=0,last=null;
  function show(){var it=list[i];if(/\.mp4$/.test(it.src)){img.hidden=true;img.removeAttribute('src');vid.hidden=false;vid.src=it.src;var p=vid.play();if(p&&p.catch)p.catch(function(){})}else{vid.hidden=true;vid.pause();vid.removeAttribute('src');img.hidden=false;img.src=it.src}img.alt=it.t;cap.innerHTML='<b></b><span></span>';cap.querySelector('b').textContent=it.t;cap.querySelector('span').textContent=(list.length>1?(i+1)+' / '+list.length+' · ':'')+it.n;prev.hidden=next.hidden=list.length<2;scr.scrollTop=0}
  function open(card,s){var t=card.querySelector('h3').textContent,n=card.getAttribute('data-note')||'';list=card.getAttribute('data-images').split('|').map(function(x){return{src:x,t:t,n:n}});i=s||0;show();lb.classList.add('open');lb.setAttribute('aria-hidden','false');d.body.style.overflow='hidden';$('.lb-x').focus()}
  function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');d.body.style.overflow='';img.removeAttribute('src');vid.pause();vid.removeAttribute('src');if(last)last.focus({preventScroll:true})}
  $$('[data-open]').forEach(function(b){b.addEventListener('click',function(){last=b;open(b.closest('.card'),0)})});
  $('.lb-x').addEventListener('click',close);prev.addEventListener('click',function(){i=(i-1+list.length)%list.length;show()});next.addEventListener('click',function(){i=(i+1)%list.length;show()});
  lb.addEventListener('click',function(e){if(e.target===lb||e.target===scr)close()});
  d.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowRight')next.click();if(e.key==='ArrowLeft')prev.click()});
  var sx=null;lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});lb.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>60&&list.length>1)(dx<0?next:prev).click();sx=null})})();

/* timeline line */
(function(){var tl=$('#tl');if(!tl)return;function f(){var r=tl.getBoundingClientRect(),vh=w.innerHeight,p=(vh*.7-r.top)/r.height;tl.style.setProperty('--tl',Math.max(0,Math.min(1,p))*100+'%')}f();onScroll(f)})();

var y=$('#year');if(y)y.textContent=new Date().getFullYear();

/* pointer fx (desktop only) */
var mouse={x:0,y:0};
if(fine&&!rm){
  root.classList.add('has-cursor');
  var cur2=$('.cursor'),dot=$('.c-dot'),ring=$('.c-ring'),cx=w.innerWidth/2,cy=w.innerHeight/2,rx=cx,ry=cy;
  w.addEventListener('pointermove',function(e){cx=e.clientX;cy=e.clientY;mouse.x=cx/w.innerWidth*2-1;mouse.y=cy/w.innerHeight*2-1;dot.style.transform='translate('+cx+'px,'+cy+'px)'},{passive:true});
  (function loop(){rx+=(cx-rx)*.18;ry+=(cy-ry)*.18;ring.style.transform='translate('+rx+'px,'+ry+'px)';requestAnimationFrame(loop)})();
  d.addEventListener('pointerover',function(e){cur2.classList.toggle('hover',!!e.target.closest('a,button'))});
  $$('.tilt').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,yy=(e.clientY-r.top)/r.height;c.style.transform='perspective(900px) rotateY('+((x-.5)*8)+'deg) rotateX('+((.5-yy)*8)+'deg) translateZ(0)';c.style.setProperty('--mx',x*100+'%');c.style.setProperty('--my',yy*100+'%')});c.addEventListener('pointerleave',function(){c.style.transform=''})});
  $$('.card,.pk').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)/r.width*100+'%');c.style.setProperty('--my',(e.clientY-r.top)/r.height*100+'%')})});
  $$('.mag').forEach(function(b){b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.2)+'px,'+((e.clientY-r.top-r.height/2)*.3)+'px)'});b.addEventListener('pointerleave',function(){b.style.transform=''})});
  var holo=$('#holo');if(holo){w.addEventListener('pointermove',function(){if(w.scrollY>w.innerHeight)return;holo.style.transform='perspective(900px) rotateY('+(mouse.x*10)+'deg) rotateX('+(-mouse.y*10)+'deg)'},{passive:true})}
}else{
  w.addEventListener('deviceorientation',function(e){if(e.gamma==null)return;mouse.x=Math.max(-1,Math.min(1,e.gamma/40));mouse.y=Math.max(-1,Math.min(1,(e.beta-45)/40))},{passive:true});
  w.addEventListener('touchmove',function(e){var t=e.touches[0];mouse.x=t.clientX/w.innerWidth*2-1;mouse.y=t.clientY/w.innerHeight*2-1},{passive:true});
}

/* WebGL particle field */
(function(){var c=$('#fx');if(!c)return;var gl=c.getContext('webgl',{antialias:false,alpha:true,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl){c.style.display='none';return}
  var N=low?2400:7000,dpr=Math.min(w.devicePixelRatio||1,low?1.25:1.6);
  var A=[new Float32Array(N*3),new Float32Array(N*3),new Float32Array(N*3),new Float32Array(N*3)],RR=new Float32Array(N);
  function g(){return (Math.random()+Math.random()+Math.random()-1.5)/1.5}
  for(var i=0;i<N;i++){var r=Math.random();RR[i]=r;var k=i*3,p;
    if(i%7===0){var a=Math.random()*6.2832,rr=1.45+Math.random()*.45;p=[Math.cos(a)*rr,g()*.02,Math.sin(a)*rr]}else{var yy=1-2*(i+.5)/N,rad=Math.sqrt(1-yy*yy),th=i*2.39996,R=1+g()*.03;p=[Math.cos(th)*rad*R,yy*R,Math.sin(th)*rad*R]}
    A[0][k]=p[0];A[0][k+1]=p[1];A[0][k+2]=p[2];
    var t=Math.random()*6.2832,tr=.13*Math.sqrt(Math.random()),ta=Math.random()*6.2832,q=3,pp=2,rk=Math.cos(q*t)+2.2;
    A[1][k]=(rk*Math.cos(pp*t))*.42+Math.cos(ta)*tr;A[1][k+1]=(-Math.sin(q*t))*.42+Math.sin(ta)*tr;A[1][k+2]=(rk*Math.sin(pp*t))*.42+Math.cos(ta+1)*tr;
    var S=Math.ceil(Math.sqrt(N)),gx=(i%S)/S,gz=Math.floor(i/S)/S;
    A[2][k]=(gx-.5)*6;A[2][k+1]=-.85;A[2][k+2]=(gz-.5)*6;
    var arm=i%3,gr=Math.pow(Math.random(),.7)*2.3,ga=gr*2.1+arm*2.0944+g()*.35;
    A[3][k]=Math.cos(ga)*gr;A[3][k+1]=g()*.08*(2.4-gr);A[3][k+2]=Math.sin(ga)*gr;}
  var vs='attribute vec3 a0,a1,a2,a3;attribute float r;uniform float t,m,asp,sz,al,sc;uniform vec2 ms,off;varying float va;varying vec3 vc;'+
  'vec3 rY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}vec3 rX(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}'+
  'void main(){float k0=smoothstep(0.,1.,clamp(m,0.,1.)),k1=smoothstep(0.,1.,clamp(m-1.,0.,1.)),k2=smoothstep(0.,1.,clamp(m-2.,0.,1.));'+
  'vec3 p=mix(mix(mix(a0,a1,k0),a2,k1),a3,k2);float w2=k1*(1.-k2);'+
  'p.y+=w2*.22*sin(p.x*2.2+t*1.2)*cos(p.z*1.8+t*.9);'+
  'p+=.025*vec3(sin(t*.7+r*40.),cos(t*.9+r*31.),sin(t*.6+r*23.));'+
  'p=rY(p,t*.09*(1.-w2*.8)+ms.x*.5);p=rX(p,.28+ms.y*.3+w2*.25);'+
  'p*=sc;float z=p.z-3.4;gl_Position=vec4((p.x+off.x)*1.9/asp,(p.y+off.y)*1.9,0.,-z);'+
  'gl_PointSize=sz*(.5+r*1.3)/(-z);va=al*(.35+.65*smoothstep(-4.6,-2.4,z));'+
  'vc=mix(mix(vec3(.2,.94,1.),vec3(.55,.36,1.),r),vec3(1.,.24,.78),step(.9,r));}';
  var fs='precision mediump float;varying float va;varying vec3 vc;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);if(d>.5)discard;float a=pow(1.-d*2.,1.6);gl_FragColor=vec4(vc*(.6+a),a*va);}';
  function sh(tp,src){var s=gl.createShader(tp);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(s));return null}return s}
  var pr=gl.createProgram(),v1=sh(gl.VERTEX_SHADER,vs),f1=sh(gl.FRAGMENT_SHADER,fs);if(!v1||!f1){c.style.display='none';return}
  gl.attachShader(pr,v1);gl.attachShader(pr,f1);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){c.style.display='none';return}gl.useProgram(pr);
  function buf(data,name,size){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);var l=gl.getAttribLocation(pr,name);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0)}
  buf(A[0],'a0',3);buf(A[1],'a1',3);buf(A[2],'a2',3);buf(A[3],'a3',3);buf(RR,'r',1);
  var U={};['t','m','asp','sz','al','ms','off','sc'].forEach(function(n){U[n]=gl.getUniformLocation(pr,n)});
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.clearColor(0,0,0,0);
  var W2,H2;function rs(){W2=c.clientWidth;H2=c.clientHeight;c.width=Math.round(W2*dpr);c.height=Math.round(H2*dpr);gl.viewport(0,0,c.width,c.height)}rs();w.addEventListener('resize',rs);
  var mS=0,mx2=0,my2=0,t0=performance.now(),fr=0,last=0;
  function target(){var h=root.scrollHeight-w.innerHeight;return h>0?Math.min(1,w.scrollY/h)*3:0}
  function draw(now){var t=rm?2:(now-t0)/1000;var tg=target();mS+=(tg-mS)*(rm?1:.06);mx2+=(mouse.x-mx2)*.05;my2+=(mouse.y-my2)*.05;
    var wide=W2>=980,heroK=Math.max(0,1-mS*1.6);
    gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(U.t,t);gl.uniform1f(U.m,mS);gl.uniform1f(U.asp,W2/H2);
    var base=Math.min(W2,H2)*(wide?.034:.065)*dpr;gl.uniform1f(U.sz,base);
    gl.uniform1f(U.al,wide?.9:.85);gl.uniform1f(U.sc,wide?1:(.62+.38*(1-heroK))*Math.min(1,W2/H2*1.6+.25));gl.uniform2f(U.ms,mx2,my2);
    gl.uniform2f(U.off,wide?heroK*.95*(W2/H2):0,wide?0:heroK*.62);
    gl.drawArrays(gl.POINTS,0,N)}
  if(rm){draw(0);onScroll(function(){requestAnimationFrame(draw)});w.addEventListener('resize',function(){draw(0)});return}
  function loop(now){requestAnimationFrame(loop);if(d.hidden)return;fr++;if(low&&fr%2)return;draw(now)}requestAnimationFrame(loop);
})();
})();
