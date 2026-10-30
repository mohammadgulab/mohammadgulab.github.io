(function(){
const $=s=>document.querySelector(s);
// menu
const M=[[['Ravioli al pomodoro','Ricotta and lemon, slow tomato, basil oil',78],['Tagliatelle al ragu','Twelve hour beef ragu, aged parmesan',86],['Tortellini in brodo','Hand twisted, clear chicken broth',72],['Pappardelle ai funghi','Wild mushrooms, thyme, brown butter',82],['Cacio e pepe','Fresh tonnarelli, pecorino, black pepper',68],['Agnolotti del plin','Pinched by hand, sage butter',92]],[['Burrata','Heirloom tomato, basil, olive oil',58],['Arancini','Saffron rice, mozzarella heart',42],['Carpaccio di manzo','Rocket, capers, parmesan',64],['Focaccia','Rosemary, sea salt, baked at noon',24]],[['Tiramisu','Made at the table',44],['Panna cotta','Vanilla, seasonal berries',38],['Cannoli','Ricotta, pistachio, orange',36],['Affogato','Vanilla gelato, espresso',32]]];
function show(t){$('#list').innerHTML=M[t].map((m,i)=>`<div class="it-row" style="animation-delay:${i*50}ms"><h3>${m[0]}</h3><i></i><b>SAR ${m[2]}</b><p>${m[1]}</p></div>`).join('');}
show(0);
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));show(+b.dataset.t);}));
document.querySelectorAll('#g button').forEach(b=>b.addEventListener('click',()=>document.querySelectorAll('#g button').forEach(x=>x.classList.toggle('on',x===b))));
const d=new Date();d.setDate(d.getDate()+2);$('#dt').value=d.toISOString().slice(0,10);
$('#form').addEventListener('submit',e=>{e.preventDefault();$('#ok').hidden=false;});
$('#cr').addEventListener('click',e=>{e.preventDefault();$('#crl').hidden=!$('#crl').hidden;});
$('#crl').innerHTML=Object.entries(window.CREDITS).map(([id,s])=>`<li><a href="https://www.pexels.com/photo/${s}/" target="_blank" rel="noopener">Pexels photo ${id}</a></li>`).join('');
// flour canvas
const cv=$('#flour'),cx=cv.getContext('2d');let W=0,H=0,dpr=1;const N=innerWidth<600?260:520;const P=[];
function rs(){dpr=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);}
rs();addEventListener('resize',rs);
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
for(let i=0;i<N;i++){const a=rnd()*Math.PI*2;P.push({a,v:.25+rnd()*.75,r:.6+rnd()*2.2,o:.3+rnd()*.6,ph:rnd()*6.28,fx:(rnd()-.5)*.5,fy:.15+rnd()*.35});}
const st={burst:0,settle:0};
function draw(time){
  cx.clearRect(0,0,W,H);
  const cxp=W*.5,cyp=H*(innerWidth<600?.6:.54),R=Math.max(W,H)*.62,b=st.burst,s=st.settle;
  const eb=1-Math.pow(1-b,3);
  for(const p of P){
    let x=cxp+Math.cos(p.a)*p.v*R*eb+Math.sin(time/1400+p.ph)*6*b;
    let y=cyp+Math.sin(p.a)*p.v*R*eb*.75+Math.cos(time/1700+p.ph)*5*b;
    // idle dust near the nest before burst
    if(b<.02){x=cxp+Math.cos(p.a)*p.v*120+Math.sin(time/900+p.ph)*10;y=cyp-40+Math.sin(p.a)*p.v*70+Math.cos(time/1100+p.ph)*8;}
    // settle: drift down onto the plate
    if(s>0){const pr=Math.min(W*.46,320)*(0.95+p.v*.35);const tx=cxp+Math.cos(p.a)*pr,ty=cyp+Math.sin(p.a)*pr;x+=(tx-x)*s;y+=(ty-y)*s;}
    const al=p.o*(b<.02?.35:(1-b*.35))*(s>0?1-s*.4:1);
    cx.globalAlpha=al;cx.fillStyle='#f4efe6';cx.beginPath();cx.arc(x,y,p.r*(1+b*.4),0,6.283);cx.fill();
  }
  cx.globalAlpha=1;requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
if(!window.gsap||!window.ScrollTrigger)return;
gsap.registerPlugin(ScrollTrigger);
const igs=gsap.utils.toArray('.ig');
gsap.to('#nest',{y:'-=14',rotation:3,duration:2.4,yoyo:true,repeat:-1,ease:'sine.inOut'});
gsap.set(igs,{xPercent:-50,yPercent:-50,x:0,y:0,scale:.1,rotation:0});
gsap.set(['#nest','#plate'],{xPercent:-50,yPercent:-50,x:0,y:0});
const vw=v=>v*Math.min(innerWidth,1400)/100, vh=v=>v*innerHeight/100;
const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#hero',start:'top top',end:()=>'+='+innerHeight*3.4,pin:true,scrub:.7,anticipatePin:1,invalidateOnRefresh:true}});
tl.to('#ttl',{y:-60,opacity:.12,duration:.8},0)
  .to('#sc',{opacity:0,duration:.2},0)
  .to('#nest',{scale:.55,rotation:-25,opacity:.0,duration:.9,ease:'power2.in'},0)
  .to(st,{burst:1,duration:1,ease:'power2.out'},0.05)
  .to(igs,{x:i=>vw(+igs[i].dataset.x*(innerWidth<600?1.05:.8)),y:i=>vh(+igs[i].dataset.y*(innerWidth<600?.7:.85)),rotation:i=>+igs[i].dataset.r,scale:i=>+igs[i].dataset.s,opacity:1,duration:1,ease:'power3.out',stagger:.02},0.05)
  .to('#cap2',{opacity:1,y:0,duration:.35},.6)
  .to(igs,{rotation:i=>+igs[i].dataset.r*1.25,x:i=>'+='+(+igs[i].dataset.x*.9),y:i=>'+='+(+igs[i].dataset.y*.7),duration:.6},1.1)
  .to('#cap2',{opacity:0,y:-30,duration:.3},1.6)
  .to(igs,{x:0,y:0,scale:.15,rotation:i=>+igs[i].dataset.r*2.5,opacity:0,duration:.9,ease:'power2.in',stagger:.015},1.7)
  .fromTo('#plate',{scale:.45,rotation:-35,opacity:0},{scale:1,rotation:0,opacity:1,duration:.8,ease:'power2.out'},2.2)
  .to(st,{settle:1,duration:.8,ease:'power2.inOut'},2.1)
  .fromTo('#cap3',{opacity:0,y:30},{opacity:1,y:0,duration:.35},2.7)
  .to({}, {duration:.5});
gsap.set('#cap2',{y:30});
const q=new URLSearchParams(location.search); if(q.has('p')){const s=tl.scrollTrigger;requestAnimationFrame(()=>scrollTo(0,s.start+(s.end-s.start)*parseFloat(q.get('p'))));}
})();