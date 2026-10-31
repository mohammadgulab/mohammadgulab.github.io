// Text Motion Studio presets. Each preset is plain CSS (+ optional JS) that runs on its own.
// Selectors: .tm = the text element, .w = each word, .c = each character.
// Variables: --color --accent --bg --dur --stagger --size, per char --i --d --r, per word --wi.
window.TM_CATS = ["Entrance","Focus","Shine","Glitch & Decoder","Typewriter","Titles","Loop & Wave"];
window.TM_FONTS = {
  "Inter": {css:"'Inter', system-ui, sans-serif", q:"Inter:wght@500;700;800;900"},
  "Poppins": {css:"'Poppins', system-ui, sans-serif", q:"Poppins:ital,wght@0,600;0,800;1,800"},
  "Playfair Display": {css:"'Playfair Display', Georgia, serif", q:"Playfair+Display:wght@600;700;800"},
  "Bebas Neue": {css:"'Bebas Neue', Impact, sans-serif", q:"Bebas+Neue"},
  "Space Mono": {css:"'Space Mono', ui-monospace, monospace", q:"Space+Mono:wght@400;700"},
  "Pacifico": {css:"'Pacifico', cursive", q:"Pacifico"}
};
window.TM_PRESETS = [
/* ---------------- Entrance ---------------- */
{id:"rise-up",name:"Rise Up",cat:"Entrance",split:"chars",font:"Inter",weight:800,dur:2.6,stagger:.04,
 desc:"Letters rise out of a hidden line one after another, hold, then lift away.",
 css:`.tm .w{overflow:hidden;padding:.05em 0 .12em;vertical-align:top}
.tm .c{animation:tm-rise var(--dur) cubic-bezier(.2,.8,.2,1) calc(var(--i)*var(--stagger)) infinite both}
@keyframes tm-rise{0%{transform:translateY(1.1em);opacity:0}22%,76%{transform:none;opacity:1}94%,100%{transform:translateY(-1.1em);opacity:0}}`},
{id:"line-cascade",name:"Line Cascade",cat:"Entrance",split:"chars",font:"Inter",weight:700,dur:2.8,stagger:.035,
 desc:"A soft left to right cascade. Each letter slides in and settles.",
 css:`.tm .c{animation:tm-cascade var(--dur) cubic-bezier(.25,.9,.3,1) calc(var(--i)*var(--stagger)) infinite both}
@keyframes tm-cascade{0%{transform:translateX(-.6em) skewX(-12deg);opacity:0}22%,78%{transform:none;opacity:1}100%{transform:translateX(.6em) skewX(12deg);opacity:0}}`},
{id:"from-center",name:"From Center",cat:"Entrance",split:"chars",font:"Poppins",weight:800,dur:2.6,stagger:.05,
 desc:"Pops open from the middle letter outwards with a little overshoot.",
 css:`.tm .c{animation:tm-center var(--dur) cubic-bezier(.34,1.56,.64,1) calc(var(--d)*var(--stagger)) infinite both}
@keyframes tm-center{0%{transform:scale(0);opacity:0}20%,78%{transform:scale(1);opacity:1}92%,100%{transform:scale(0);opacity:0}}`},
{id:"drop-bounce",name:"Drop Bounce",cat:"Entrance",split:"chars",font:"Poppins",weight:800,dur:3,stagger:.05,
 desc:"Letters fall from above and bounce twice before they settle.",
 css:`.tm .c{transform-origin:50% 100%;animation:tm-drop var(--dur) ease-out calc(var(--i)*var(--stagger)) infinite both}
@keyframes tm-drop{0%{transform:translateY(-1.4em);opacity:0}14%{transform:translateY(0) scale(1.1,.9);opacity:1}21%{transform:translateY(-.3em) scale(.97,1.03)}28%{transform:translateY(0) scale(1.04,.96)}34%{transform:translateY(-.08em)}40%,82%{transform:none;opacity:1}100%{transform:translateY(.4em);opacity:0}}`},
{id:"wipe-reveal",name:"Wipe Reveal",cat:"Entrance",split:"chars",font:"Inter",weight:900,dur:2.8,stagger:.06,
 desc:"Each word is wiped on from the left like a mask, then wiped off to the right.",
 css:`.tm .w{animation:tm-wipe var(--dur) cubic-bezier(.7,0,.2,1) calc(var(--wi)*var(--stagger)*3) infinite both}
@keyframes tm-wipe{0%{clip-path:inset(-10% 100% -10% 0);transform:translateX(-.25em)}28%,78%{clip-path:inset(-10% 0 -10% 0);transform:none}96%,100%{clip-path:inset(-10% 0 -10% 100%);transform:translateX(.25em)}}`},
{id:"zoom-pop",name:"Zoom Pop",cat:"Entrance",split:"chars",font:"Poppins",weight:800,dur:2.6,stagger:.045,
 desc:"Letters fly in from big and blurry and snap into place.",
 css:`.tm .c{animation:tm-zoom var(--dur) cubic-bezier(.2,.9,.25,1) calc(var(--i)*var(--stagger)) infinite both}
@keyframes tm-zoom{0%{transform:scale(2.6);filter:blur(10px);opacity:0}20%,78%{transform:none;filter:blur(0);opacity:1}100%{transform:scale(.6);filter:blur(6px);opacity:0}}`},
{id:"flip-up",name:"Flip Up",cat:"Entrance",split:"chars",font:"Inter",weight:800,dur:2.8,stagger:.05,
 desc:"Letters flip up in 3D like cards on a board.",
 css:`.tm .c{transform-origin:50% 100%;backface-visibility:hidden;animation:tm-flip var(--dur) cubic-bezier(.3,1.4,.5,1) calc(var(--i)*var(--stagger)) infinite both}
@keyframes tm-flip{0%{transform:perspective(500px) rotateX(-100deg);opacity:0}22%,78%{transform:perspective(500px) rotateX(0);opacity:1}100%{transform:perspective(500px) rotateX(95deg);opacity:0}}`},
/* ---------------- Focus ---------------- */
{id:"soft-focus",name:"Soft Focus",cat:"Focus",split:"chars",font:"Playfair Display",weight:700,dur:3.2,stagger:.06,
 desc:"Letters drift into focus from a soft blur. Calm and cinematic.",
 css:`.tm .c{animation:tm-soft var(--dur) ease-out calc(var(--i)*var(--stagger)) infinite both}
@keyframes tm-soft{0%{filter:blur(14px);opacity:0;transform:scale(1.25)}30%,78%{filter:blur(0);opacity:1;transform:none}100%{filter:blur(12px);opacity:0;transform:scale(.95)}}`},
{id:"tracking-in",name:"Tracking In",cat:"Focus",split:"none",font:"Inter",weight:800,dur:3,stagger:0,
 desc:"Wide spaced and blurred letters pull together into a tight title.",
 css:`.tm{animation:tm-track var(--dur) cubic-bezier(.2,.8,.2,1) infinite both}
@keyframes tm-track{0%{letter-spacing:.8em;filter:blur(12px);opacity:0}38%,80%{letter-spacing:.02em;filter:blur(0);opacity:1}100%{letter-spacing:.06em;filter:blur(10px);opacity:0}}`},
{id:"focus-pull",name:"Focus Pull",cat:"Focus",split:"chars",font:"Poppins",weight:800,dur:3.4,stagger:.1,
 desc:"Like a camera pulling focus, one word at a time comes sharp.",
 css:`.tm .w{animation:tm-pull var(--dur) ease-out calc(var(--wi)*var(--stagger)*3) infinite both}
@keyframes tm-pull{0%{filter:blur(12px);opacity:0;transform:scale(1.3)}24%,80%{filter:blur(0);opacity:1;transform:none}100%{filter:blur(10px);opacity:0;transform:scale(1.05)}}`},
/* ---------------- Shine ---------------- */
{id:"shine-sweep",name:"Shine Sweep",cat:"Shine",split:"none",font:"Inter",weight:900,dur:2.6,stagger:0,
 desc:"A bright band of light glides across the letters.",
 css:`.tm{background:linear-gradient(105deg,var(--color) 0 38%,#fff 46%,var(--accent) 50%,#fff 54%,var(--color) 62% 100%);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:tm-shine var(--dur) ease-in-out infinite both}
@keyframes tm-shine{0%{background-position:100% 0}65%,100%{background-position:0 0}}`},
{id:"neon-pulse",name:"Neon Pulse",cat:"Shine",split:"none",font:"Bebas Neue",weight:400,dur:2.4,stagger:0,
 desc:"A glowing neon tube that breathes and flickers now and then.",
 css:`.tm{color:#fff;letter-spacing:.04em;animation:tm-neon var(--dur) ease-in-out infinite both}
@keyframes tm-neon{0%,100%{text-shadow:0 0 .04em #fff,0 0 .15em var(--accent),0 0 .4em var(--accent),0 0 .9em var(--accent);opacity:1}45%{text-shadow:0 0 .02em #fff,0 0 .08em var(--accent),0 0 .2em var(--accent),0 0 .4em var(--accent);opacity:.85}52%{opacity:.35}54%{opacity:1}56%{opacity:.5}58%{opacity:1}}`},
{id:"glow-run",name:"Glow Run",cat:"Shine",split:"chars",font:"Inter",weight:800,dur:2.2,stagger:.06,
 desc:"A spark of light runs along the word, lighting each letter as it passes.",
 css:`.tm .c{animation:tm-glowrun var(--dur) ease-in-out calc(var(--i)*var(--stagger)) infinite both}
@keyframes tm-glowrun{0%,36%,100%{color:var(--color);text-shadow:none;transform:none}16%{color:var(--accent);text-shadow:0 0 .25em var(--accent),0 0 .6em var(--accent);transform:translateY(-.08em) scale(1.08)}}`},
/* ---------------- Glitch & Decoder ---------------- */
{id:"digital-decoder",name:"Digital Decoder",cat:"Glitch & Decoder",split:"chars",font:"Space Mono",weight:700,dur:3.6,stagger:.05,
 desc:"Random code characters scramble and lock into your text, cyber security style.",
 css:`.tm .c{text-align:center}
.tm .c.tm-scr{color:var(--accent);opacity:.85;text-shadow:0 0 .3em var(--accent)}`,
 js:`(function(){var el=document.querySelector('.tm');var cs=[].slice.call(el.querySelectorAll('.c'));var real=cs.map(function(c){return c.textContent});
cs.forEach(function(c){c.style.width=c.getBoundingClientRect().width+'px'});
var G='ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&*<>/\\\\=+?';function rg(){return G.charAt(Math.floor(Math.random()*G.length))}
var D=parseFloat(getComputedStyle(el).getPropertyValue('--dur'))*1000||3600,n=cs.length,t0=null,last=0;
var at=cs.map(function(_,i){return (i/Math.max(1,n-1))*0.45+Math.random()*0.08+0.05});
function tick(ts){requestAnimationFrame(tick);if(window.tmPaused){t0=null;return}if(t0===null)t0=ts-last;var p=((ts-t0)%D)/D;last=ts-t0;
if(ts-(tick.q||0)<45)return;tick.q=ts;
cs.forEach(function(c,i){if(p<at[i]||p>0.88){c.textContent=rg();c.classList.add('tm-scr');c.style.opacity=p>0.88?String(Math.max(0,1-(p-0.88)/0.12)):''}else{c.textContent=real[i];c.classList.remove('tm-scr');c.style.opacity=''}})}
requestAnimationFrame(tick)})();`},
{id:"rgb-glitch",name:"RGB Glitch",cat:"Glitch & Decoder",split:"none",font:"Inter",weight:900,dur:2.4,stagger:0,
 desc:"Red and cyan copies tear apart in sliced bursts, like a broken signal.",
 css:`.tm{position:relative;isolation:isolate;animation:tm-gskew var(--dur) steps(1) infinite}
.tm::before,.tm::after{content:attr(data-text);position:absolute;inset:0;padding:inherit;mix-blend-mode:screen;pointer-events:none}
.tm::before{color:#ff2d55;animation:tm-g1 var(--dur) steps(1) infinite}
.tm::after{color:#1fe3ff;animation:tm-g2 var(--dur) steps(1) infinite}
@keyframes tm-g1{0%{clip-path:inset(12% 0 58% 0);transform:translate(-.07em,.02em)}6%{clip-path:inset(62% 0 8% 0);transform:translate(.06em,0)}12%{clip-path:inset(35% 0 40% 0);transform:translate(-.09em,0)}18%{clip-path:inset(80% 0 2% 0);transform:translate(.04em,0)}24%,48%{clip-path:inset(0);transform:translate(-.02em,0)}52%{clip-path:inset(20% 0 50% 0);transform:translate(.08em,0)}56%,100%{clip-path:inset(0);transform:translate(-.015em,0)}}
@keyframes tm-g2{0%{clip-path:inset(55% 0 20% 0);transform:translate(.07em,0)}6%{clip-path:inset(5% 0 70% 0);transform:translate(-.06em,0)}12%{clip-path:inset(45% 0 30% 0);transform:translate(.09em,0)}18%{clip-path:inset(10% 0 75% 0);transform:translate(-.05em,0)}24%,48%{clip-path:inset(0);transform:translate(.02em,0)}52%{clip-path:inset(60% 0 15% 0);transform:translate(-.08em,0)}56%,100%{clip-path:inset(0);transform:translate(.015em,0)}}
@keyframes tm-gskew{0%{transform:skewX(-8deg)}6%{transform:skewX(6deg)}12%{transform:skewX(-3deg) translateX(.03em)}18%,50%{transform:none}52%{transform:skewX(5deg)}56%,100%{transform:none}}`},
{id:"flicker-on",name:"Flicker On",cat:"Glitch & Decoder",split:"chars",font:"Bebas Neue",weight:400,dur:3,stagger:.02,
 desc:"Letters stutter on like old neon tubes warming up.",
 css:`.tm{letter-spacing:.04em}
.tm .c{animation:tm-flick var(--dur) linear calc(var(--r)*var(--dur)*.25 + var(--i)*var(--stagger)) infinite both}
@keyframes tm-flick{0%,6%{opacity:.08;text-shadow:none}7%{opacity:1;text-shadow:0 0 .3em var(--accent)}9%{opacity:.15;text-shadow:none}11%{opacity:1;text-shadow:0 0 .3em var(--accent)}12%{opacity:.3}15%,84%{opacity:1;text-shadow:0 0 .2em var(--accent),0 0 .6em var(--accent)}86%{opacity:.2}88%{opacity:1}94%,100%{opacity:.08;text-shadow:none}}`},
/* ---------------- Typewriter ---------------- */
{id:"typewriter",name:"Typewriter",cat:"Typewriter",split:"chars",font:"Space Mono",weight:700,dur:3.6,stagger:.08,
 desc:"Typed out letter by letter with a blinking caret, then cleared and typed again.",
 css:`.tm-caret{display:inline-block;width:0;position:relative}
.tm-caret::after{content:"";position:absolute;left:.03em;bottom:-.16em;height:1.02em;width:.08em;background:var(--accent);animation:tm-blink 1s steps(1) infinite}
@keyframes tm-blink{0%,49%{opacity:1}50%,100%{opacity:0}}`,
 js:`(function(){var el=document.querySelector('.tm');var cs=[].slice.call(el.querySelectorAll('.c'));var car=document.createElement('span');car.className='tm-caret';
var D=parseFloat(getComputedStyle(el).getPropertyValue('--dur'))*1000||3600,n=cs.length,k=-1,phase=0;
function hideAll(){cs.forEach(function(c){c.style.visibility='hidden'});if(cs[0])cs[0].parentNode.insertBefore(car,cs[0]);k=-1}
function step(){if(window.tmPaused){return setTimeout(step,120)}
if(phase===0){k++;if(k<n){cs[k].style.visibility='visible';cs[k].parentNode.insertBefore(car,cs[k].nextSibling);return setTimeout(step,(D*.55/n)*(0.6+Math.random()*0.8))}phase=1;return setTimeout(step,D*.35)}
hideAll();phase=0;setTimeout(step,D*.1)}
hideAll();setTimeout(step,300)})();`},
{id:"type-delete",name:"Type and Delete",cat:"Typewriter",split:"chars",font:"Space Mono",weight:700,dur:4,stagger:.08,
 desc:"Types the line, waits, then backspaces it all, like someone changing their mind.",
 css:`.tm-caret{display:inline-block;width:0;position:relative}
.tm-caret::after{content:"";position:absolute;left:.03em;bottom:-.16em;height:1.02em;width:.08em;background:var(--accent);animation:tm-blink 1s steps(1) infinite}
@keyframes tm-blink{0%,49%{opacity:1}50%,100%{opacity:0}}`,
 js:`(function(){var el=document.querySelector('.tm');var cs=[].slice.call(el.querySelectorAll('.c'));var car=document.createElement('span');car.className='tm-caret';
var D=parseFloat(getComputedStyle(el).getPropertyValue('--dur'))*1000||4000,n=cs.length,k=-1,dir=1;
function place(){if(k<0){cs[0].parentNode.insertBefore(car,cs[0])}else{cs[k].parentNode.insertBefore(car,cs[k].nextSibling)}}
cs.forEach(function(c){c.style.visibility='hidden'});place();
function step(){if(window.tmPaused){return setTimeout(step,120)}
if(dir===1){if(k<n-1){k++;cs[k].style.visibility='visible';place();return setTimeout(step,(D*.4/n)*(0.6+Math.random()*0.8))}dir=-1;return setTimeout(step,D*.3)}
if(k>=0){cs[k].style.visibility='hidden';k--;place();return setTimeout(step,D*.15/n)}dir=1;setTimeout(step,D*.15)}
setTimeout(step,300)})();`},
{id:"word-by-word",name:"Word by Word",cat:"Typewriter",split:"chars",font:"Poppins",weight:800,dur:3.2,stagger:.12,
 desc:"Whole words pop in one at a time, the way captions appear in short videos.",
 css:`.tm .w{animation:tm-word var(--dur) cubic-bezier(.34,1.56,.64,1) calc(var(--wi)*var(--stagger)*3) infinite both}
@keyframes tm-word{0%{transform:translateY(.35em) scale(.7);opacity:0}12%,82%{transform:none;opacity:1}94%,100%{transform:scale(.9);opacity:0}}`},
/* ---------------- Titles ---------------- */
{id:"gold-serif",name:"Gold Serif",cat:"Titles",split:"none",font:"Playfair Display",weight:700,dur:3.6,stagger:0,upper:true,
 desc:"An elegant gold serif title that opens up and catches a slow light. Uses its own gold, not the text colour.",
 css:`.tm{letter-spacing:.14em;background:linear-gradient(110deg,transparent 0 40%,rgba(255,255,255,.95) 48%,transparent 56% 100%),linear-gradient(180deg,#fff4cf 0%,#f2cd72 38%,#b88a2e 58%,#f6dc8c 82%,#c99a3c 100%);background-size:300% 100%,100% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 .04em .06em rgba(0,0,0,.5));animation:tm-gold var(--dur) cubic-bezier(.2,.8,.2,1) infinite both}
@keyframes tm-gold{0%{letter-spacing:.5em;opacity:0;background-position:100% 0,0 0}25%{letter-spacing:.14em;opacity:1}60%{background-position:0 0,0 0}85%{opacity:1;letter-spacing:.16em}100%{opacity:0;letter-spacing:.2em;background-position:0 0,0 0}}`},
{id:"brush-reveal",name:"Brush Reveal",cat:"Titles",split:"none",font:"Poppins",weight:800,italic:true,dur:3,stagger:0,
 desc:"A bold brush stroke sweeps across and the title is painted on top of it.",
 css:`.tm{position:relative;isolation:isolate;padding:.15em .45em;animation:tm-brush-t var(--dur) cubic-bezier(.7,0,.2,1) infinite both}
.tm::before{content:"";position:absolute;left:0;right:0;top:14%;bottom:8%;z-index:-1;background:linear-gradient(176deg,var(--accent) 0 70%,color-mix(in srgb,var(--accent) 75%,#000) 100%);border-radius:.12em .5em .2em .6em;transform:skewX(-14deg) scaleX(0);transform-origin:0 50%;animation:tm-brush-b var(--dur) cubic-bezier(.7,0,.2,1) infinite both}
@keyframes tm-brush-b{0%{transform:skewX(-14deg) scaleX(0);transform-origin:0 50%}26%,82%{transform:skewX(-14deg) scaleX(1);transform-origin:0 50%}83%{transform-origin:100% 50%}97%,100%{transform:skewX(-14deg) scaleX(0);transform-origin:100% 50%}}
@keyframes tm-brush-t{0%,14%{clip-path:inset(-20% 100% -20% 0)}40%,84%{clip-path:inset(-20% 0 -20% 0)}96%,100%{clip-path:inset(-20% 0 -20% 100%)}}`},
{id:"color-glow",name:"Color Glow",cat:"Titles",split:"none",font:"Poppins",weight:800,dur:4,stagger:0,
 desc:"Warm colours flow through the title while it glows softly.",
 css:`.tm{background:linear-gradient(90deg,var(--accent),#ffd166,#ff4f8b,#8b5cff,var(--accent));background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:tm-flow var(--dur) linear infinite both,tm-glow calc(var(--dur)/2) ease-in-out infinite alternate both}
@keyframes tm-flow{0%{background-position:0 0}100%{background-position:150% 0}}
@keyframes tm-glow{0%{filter:drop-shadow(0 0 .04em color-mix(in srgb,var(--accent) 60%,transparent))}100%{filter:drop-shadow(0 0 .22em color-mix(in srgb,var(--accent) 90%,transparent))}}`},
{id:"outline-fill",name:"Outline Fill",cat:"Titles",split:"none",font:"Bebas Neue",weight:400,dur:3.2,stagger:0,
 desc:"Starts as a thin outline, then fills up from the bottom like liquid.",
 css:`.tm{letter-spacing:.03em;color:transparent;-webkit-text-stroke:.025em var(--accent);background:linear-gradient(0deg,var(--color) 50%,transparent 50%);background-size:100% 200%;background-position:0 0;-webkit-background-clip:text;background-clip:text;animation:tm-fill var(--dur) cubic-bezier(.6,0,.3,1) infinite both}
@keyframes tm-fill{0%,12%{background-position:0 0}50%,80%{background-position:0 100%}100%{background-position:0 0}}`},
/* ---------------- Loop & Wave ---------------- */
{id:"sine-wave",name:"Sine Wave",cat:"Loop & Wave",split:"chars",font:"Poppins",weight:800,dur:1.8,stagger:.08,
 desc:"A gentle wave rolls through the letters, forever.",
 css:`.tm .c{animation:tm-sine calc(var(--dur)/2) ease-in-out calc(var(--i)*var(--stagger)*-2) infinite alternate both}
@keyframes tm-sine{0%{transform:translateY(-.2em)}100%{transform:translateY(.2em)}}`},
{id:"bounce-wave",name:"Bounce Wave",cat:"Loop & Wave",split:"chars",font:"Poppins",weight:800,dur:2,stagger:.06,
 desc:"Letters jump one after another with a squash on landing.",
 css:`.tm .c{transform-origin:50% 100%;animation:tm-bwave var(--dur) ease-in-out calc(var(--i)*var(--stagger)) infinite both}
@keyframes tm-bwave{0%,45%,100%{transform:none}8%{transform:scale(1.15,.85)}20%{transform:translateY(-.5em) scale(.92,1.1)}32%{transform:scale(1.12,.88)}38%{transform:scale(.98,1.02)}}`},
{id:"jelly",name:"Jelly",cat:"Loop & Wave",split:"chars",font:"Poppins",weight:800,dur:2.2,stagger:.07,
 desc:"Rubbery letters wobble like jelly, one after another.",
 css:`.tm .c{animation:tm-jelly var(--dur) ease calc(var(--i)*var(--stagger)) infinite both}
@keyframes tm-jelly{0%,40%,100%{transform:none}8%{transform:scale(1.3,.72)}13%{transform:scale(.75,1.25)}18%{transform:scale(1.15,.85)}24%{transform:scale(.95,1.05)}30%{transform:scale(1.04,.96)}}`},
{id:"swing",name:"Swing",cat:"Loop & Wave",split:"chars",font:"Inter",weight:800,dur:2.4,stagger:.1,
 desc:"Each letter hangs from the top and swings like a little sign.",
 css:`.tm .c{transform-origin:50% 0;animation:tm-swing calc(var(--dur)/2) ease-in-out calc(var(--i)*var(--stagger)*-1.5) infinite alternate both}
@keyframes tm-swing{0%{transform:rotate(-14deg)}100%{transform:rotate(14deg)}}`}
];
