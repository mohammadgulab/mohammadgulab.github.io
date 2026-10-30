(function(){
const $=s=>document.querySelector(s);
const hd=$('#hd');
$('#mb').addEventListener('click',()=>{const o=document.body.classList.toggle('menu');$('#mb').setAttribute('aria-expanded',o);});
document.querySelectorAll('.nv a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('menu')));
addEventListener('scroll',()=>hd.classList.toggle('solid',scrollY>innerHeight*0.9),{passive:true});
$('#form').addEventListener('submit',e=>{e.preventDefault();$('#ok').hidden=false;});
$('#cr').addEventListener('click',e=>{e.preventDefault();$('#crl').hidden=!$('#crl').hidden;});
$('#crl').innerHTML=Object.entries(window.CREDITS).map(([id,s])=>`<li><a href="https://www.pexels.com/photo/${s}/" target="_blank" rel="noopener">Pexels photo ${id}</a></li>`).join('');
// finishes
const F=[['Natural oak','Warm, light and calm. From SAR 1,450 per linear metre.','none'],['Smoked walnut','Deep and quiet, like a hotel suite. From SAR 1,750 per linear metre.','sepia(.45) saturate(1.3) brightness(.78) contrast(1.08)'],['Chalk white','Bright, clean, endless. From SAR 1,250 per linear metre.','saturate(.25) brightness(1.18) contrast(.92)'],['Graphite glass','Dark frames, smoked glass doors. From SAR 2,100 per linear metre.','grayscale(.85) brightness(.62) contrast(1.15)']];
document.querySelectorAll('#fin button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#fin button').forEach(x=>x.classList.toggle('on',x===b));const f=F[+b.dataset.f];$('#finImg').style.filter=f[2];$('#finCap').innerHTML=`<b>${f[0]}</b><span>${f[1]}</span>`;}));
// pinned fill
if(!window.gsap||!window.ScrollTrigger){return;}
gsap.registerPlugin(ScrollTrigger);
const ly=gsap.utils.toArray('.ly'), caps=gsap.utils.toArray('.cap');
const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#fill',start:'top top',end:()=>'+='+innerHeight*4.2,pin:true,scrub:0.6,anticipatePin:1,invalidateOnRefresh:true,
  onUpdate:s=>{$('#pbar').style.width=(s.progress*100)+'%'; $('#hint').style.opacity=s.progress>0.02?0:0.85;}}});
gsap.set(ly[0],{scale:1.06});
tl.to(ly[0],{scale:1,duration:1},0);
for(let i=1;i<ly.length;i++){
  const t=i-1+0.35;
  tl.to(caps[i-1],{opacity:0,y:-30,duration:0.3},t-0.05)
    .fromTo(ly[i],{clipPath:'inset(100% 0% 0% 0%)',scale:1.12},{clipPath:'inset(0% 0% 0% 0%)',scale:1,duration:0.75,ease:'power2.out'},t)
    .fromTo(caps[i],{opacity:0,y:40},{opacity:1,y:0,duration:0.35},t+0.4);
}
tl.to({},{duration:0.4});
const q=new URLSearchParams(location.search); if(q.has('p')){const st=tl.scrollTrigger; requestAnimationFrame(()=>scrollTo(0,st.start+(st.end-st.start)*parseFloat(q.get('p'))));}
})();