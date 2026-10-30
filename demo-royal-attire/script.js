(function(){
"use strict";
var hasG = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var W = innerWidth, H = innerHeight;
addEventListener("resize", function(){ W = innerWidth; H = innerHeight; });

/* clone the mascot into the showroom corner */
var heroOwl = document.querySelector(".hero .owl");
var peek = document.getElementById("peek");
if (heroOwl && peek) { var c = heroOwl.cloneNode(true); c.setAttribute("aria-hidden","true"); c.removeAttribute("role"); peek.appendChild(c); }

/* ---------- eyes follow pointer / touch ---------- */
var owls = Array.prototype.map.call(document.querySelectorAll(".owl"), function(svg){
  return { svg: svg, head: svg.querySelector(".head"), pupils: svg.querySelectorAll(".pupil"), cx:0, cy:0, hx:0, hy:0, hr:0 };
});
var target = { x: W/2, y: H*0.75 }, lastMove = 0, manual = false;
function setTarget(x, y){ target.x = x; target.y = y; lastMove = performance.now(); }
addEventListener("pointermove", function(e){ if(!manual) setTarget(e.clientX, e.clientY); }, {passive:true});
addEventListener("pointerdown", function(e){ if(!manual) setTarget(e.clientX, e.clientY); }, {passive:true});
addEventListener("touchmove", function(e){ if(!manual && e.touches[0]) setTarget(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});
/* QA / demo hook: make Raja look at a point */
window.__look = function(x, y){ manual = true; target.x = x; target.y = y; lastMove = performance.now(); };

var idleT = 0;
function tick(t){
  /* when idle, Raja looks around on his own */
  if (!manual && t - lastMove > 2600) {
    idleT += 0.012;
    target.x = W/2 + Math.sin(idleT*1.3) * W*0.42;
    target.y = H*0.55 + Math.cos(idleT*0.9) * H*0.35;
  }
  for (var i=0;i<owls.length;i++){
    var o = owls[i]; var r = o.svg.getBoundingClientRect();
    if (r.bottom < -50 || r.top > H + 50) continue;
    var cx = r.left + r.width/2, cy = r.top + r.height*0.43;
    var dx = target.x - cx, dy = target.y - cy, d = Math.hypot(dx, dy) || 1;
    var k = Math.min(1, d / 260);
    var px = dx/d*12*k, py = dy/d*11*k;
    o.cx += (px - o.cx)*0.18; o.cy += (py - o.cy)*0.18;
    for (var j=0;j<o.pupils.length;j++) o.pupils[j].setAttribute("transform","translate("+o.cx.toFixed(2)+" "+o.cy.toFixed(2)+")");
    var hr = Math.max(-9, Math.min(9, dx / W * 22)), hx = Math.max(-8, Math.min(8, dx/W*18)), hy = Math.max(-6, Math.min(6, dy/H*14));
    o.hr += (hr - o.hr)*0.08; o.hx += (hx - o.hx)*0.08; o.hy += (hy - o.hy)*0.08;
    o.head.setAttribute("transform","translate("+o.hx.toFixed(2)+" "+o.hy.toFixed(2)+") rotate("+o.hr.toFixed(2)+" 200 260)");
  }
  moveFly(t);
  requestAnimationFrame(tick);
}

/* ---------- butterfly ---------- */
var fly = document.getElementById("bfly"), fx = W*0.7, fy = H*0.3, fvx = 0, fvy = 0;
function moveFly(t){
  if (!fly) return;
  var tx = target.x + 46 + Math.sin(t/520)*34, ty = target.y - 62 + Math.cos(t/430)*26;
  if (scrollY > H*1.2 && t - lastMove > 1500) { tx = W - 90 + Math.sin(t/600)*30; ty = H*0.22 + Math.cos(t/500)*30; }
  fvx += (tx - fx)*0.012; fvy += (ty - fy)*0.012; fvx *= 0.9; fvy *= 0.9;
  fx += fvx; fy += fvy;
  fly.style.transform = "translate("+(fx-27).toFixed(1)+"px,"+(fy-20).toFixed(1)+"px) rotate("+Math.max(-35,Math.min(35,fvx*3)).toFixed(1)+"deg)";
}
requestAnimationFrame(tick);

/* ---------- nav state ---------- */
var nav = document.querySelector(".nav"), show = document.getElementById("showroom");
function navState(){
  nav.classList.toggle("scrolled", scrollY > 40);
  var r = show.getBoundingClientRect();
  nav.classList.toggle("dark", r.top < 60 && r.bottom > 60);
}
addEventListener("scroll", navState, {passive:true}); navState();

/* split the statement into words */
var stmt = document.getElementById("stmt");
if (stmt) {
  var html = ""; stmt.childNodes.forEach(function(n){
    if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(function(w){ html += /^\s+$/.test(w) ? w : (w ? '<span class="wd">'+w+'</span>' : ""); });
    else html += '<span class="wd">'+n.outerHTML+'</span>';
  }); stmt.innerHTML = html;
}

/* ---------- collection: pinned horizontal + drag/swipe ---------- */
var col = document.getElementById("collection"), track = document.getElementById("track"), wrap = document.getElementById("trackWrap");
var cards = Array.prototype.slice.call(track.querySelectorAll(".card"));
var cur = document.getElementById("cur"), bar = document.getElementById("bar");
function dist(){ return Math.max(0, track.scrollWidth - W); }
function cardX(i){ var pad = parseFloat(getComputedStyle(track).paddingLeft) || 0; return Math.min(dist(), Math.max(0, cards[i].offsetLeft - pad - (W - cards[i].offsetWidth)/2 + pad)); }
function updateUI(x){
  var d = dist() || 1, best = 0, bd = 1e9;
  for (var i=0;i<cards.length;i++){ var dd = Math.abs(cardX(i) - x); if (dd < bd){ bd = dd; best = i; } }
  cur.textContent = "0" + (best+1);
  bar.style.width = (20 + 80 * (x/d)) + "%";
  var mid = W/2;
  cards.forEach(function(c){
    var r = c.getBoundingClientRect(), off = (r.left + r.width/2 - mid) / W;
    var img = c.querySelector(".card-img img");
    img.style.transform = "translateX(" + (-off*60).toFixed(1) + "px) rotate(" + (off*-8).toFixed(2) + "deg)";
  });
}

if (!hasG) {
  wrap.style.overflowX = "auto"; wrap.style.scrollSnapType = "x mandatory"; cards.forEach(function(c){ c.style.scrollSnapAlign = "center"; });
  wrap.addEventListener("scroll", function(){ updateUI(wrap.scrollLeft); }, {passive:true});
  updateUI(0); return;
}

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/* intro */
if (!reduce) {
  gsap.from(".title .w", { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.1 });
  gsap.from(".hero .stage", { y: 120, scale: 0.7, opacity: 0, duration: 1.4, ease: "elastic.out(1,0.6)", delay: 0.35 });
  gsap.from(".bubble", { scale: 0, rotate: -20, duration: 0.7, ease: "back.out(2)", delay: 1.4 });
  gsap.from([".hero-l", ".hero-r", ".nav"], { y: 20, opacity: 0, duration: 0.8, stagger: 0.1, delay: 0.6, ease: "power3.out" });
}

/* hero scroll: title spreads, Raja rises and shrinks */
var ht = gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 } });
ht.to(".title .line:first-child", { xPercent: -18, opacity: 0.15 }, 0)
  .to(".title .line:last-child", { xPercent: 18, opacity: 0.15 }, 0)
  .to(".hero .stage", { y: -H*0.18, scale: 0.78 }, 0)
  .to(".bubble", { opacity: 0, y: -20 }, 0)
  .to(".sun", { scale: 1.5, opacity: 0.3 }, 0);

/* statement words light up */
gsap.fromTo("#stmt .wd", { opacity: 0.14, y: 24 }, { opacity: 1, y: 0, stagger: 0.12, ease: "none",
  scrollTrigger: { trigger: ".statement", start: "top 75%", end: "center 45%", scrub: true } });
gsap.from(".chips span", { y: 30, opacity: 0, stagger: 0.08, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: ".chips", start: "top 90%" } });

/* pinned horizontal gallery */
var tween = gsap.to(track, { x: function(){ return -dist(); }, ease: "none" });
var st = ScrollTrigger.create({
  trigger: col, start: "top top", end: function(){ return "+=" + dist(); }, pin: true, scrub: 0.5, animation: tween,
  invalidateOnRefresh: true, anticipatePin: 1,
  snap: { snapTo: function(p){ var d = dist() || 1, best = 0, bd = 9; for (var i=0;i<cards.length;i++){ var q = cardX(i)/d; if (Math.abs(q-p) < bd){ bd = Math.abs(q-p); best = q; } } return best; }, duration: { min: 0.2, max: 0.6 }, delay: 0.12, ease: "power2.inOut" },
  onUpdate: function(){ updateUI(-gsap.getProperty(track, "x")); }
});
gsap.ticker.add(function(){ if (st.isActive || true) updateUI(-gsap.getProperty(track, "x")); });

function scrollForX(x){ return st.start + Math.max(0, Math.min(dist(), x)); }
var scrollTw = null;
function goScroll(y, dur){
  if (scrollTw) scrollTw.kill();
  var o = { y: scrollY };
  scrollTw = gsap.to(o, { y: y, duration: dur || 0.7, ease: "power3.out", onUpdate: function(){ window.scrollTo(0, o.y); } });
}
function nearestIdx(x){ var b=0, bd=1e9; for (var i=0;i<cards.length;i++){ var d=Math.abs(cardX(i)-x); if(d<bd){bd=d;b=i;} } return b; }
function goCard(i){ i = Math.max(0, Math.min(cards.length-1, i)); goScroll(scrollForX(cardX(i)), 0.8); }
document.getElementById("next").addEventListener("click", function(){ goCard(nearestIdx(scrollY - st.start) + 1); });
document.getElementById("prev").addEventListener("click", function(){ goCard(nearestIdx(scrollY - st.start) - 1); });

/* drag / swipe: horizontal gestures move the same scroll position */
var drag = null, moved = false;
wrap.addEventListener("pointerdown", function(e){
  if (e.button && e.button !== 0) return;
  if (scrollTw) scrollTw.kill();
  drag = { x: e.clientX, y: e.clientY, s: scrollY, mode: null, lx: e.clientX, lt: performance.now(), v: 0, id: e.pointerId };
  moved = false;
});
wrap.addEventListener("pointermove", function(e){
  if (!drag) return;
  var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.mode) {
    if (Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy)) { drag.mode = "x"; wrap.classList.add("grab"); try { wrap.setPointerCapture(e.pointerId); } catch(_){} }
    else if (Math.abs(dy) > 10) { drag = null; return; }
    else return;
  }
  moved = true;
  var now = performance.now(), dt = Math.max(1, now - drag.lt);
  drag.v = 0.8*drag.v + 0.2*((e.clientX - drag.lx)/dt); drag.lx = e.clientX; drag.lt = now;
  if (st.progress === 0 && drag.s < st.start - 2) drag.s = st.start;
  var y = Math.max(st.start, Math.min(st.end, drag.s - dx * 1.15));
  window.scrollTo(0, y);
});
function endDrag(){
  if (!drag) return;
  wrap.classList.remove("grab");
  if (drag.mode === "x") {
    var x = scrollY - st.start, proj = x - drag.v * 260;
    goCard(nearestIdx(proj));
  }
  drag = null;
}
wrap.addEventListener("pointerup", endDrag); wrap.addEventListener("pointercancel", endDrag); wrap.addEventListener("lostpointercapture", endDrag);
wrap.addEventListener("click", function(e){ if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
cards.forEach(function(c){ c.addEventListener("dragstart", function(e){ e.preventDefault(); }); });

/* card reveal */
gsap.from(".col-head > *", { y: 40, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: col, start: "top 80%" } });
gsap.from(".card", { x: 160, opacity: 0, stagger: 0.08, duration: 1, ease: "expo.out", scrollTrigger: { trigger: col, start: "top 70%" } });

/* craft marquee */
gsap.fromTo("#mq", { xPercent: 0 }, { xPercent: -50, ease: "none", scrollTrigger: { trigger: ".craft", start: "top bottom", end: "bottom top", scrub: 0.4 } });
gsap.from(".cg", { y: 40, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".craft-grid", start: "top 85%" } });

/* showroom */
gsap.from(".sr-title span", { yPercent: 70, opacity: 0, stagger: 0.12, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".showroom", start: "top 70%" } });
gsap.from(".addr", { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: ".sr-grid", start: "top 88%" } });
gsap.from(".peek", { y: 80, rotate: 12, opacity: 0, duration: 1.2, ease: "elastic.out(1,0.6)", scrollTrigger: { trigger: ".showroom", start: "top 60%" } });

addEventListener("load", function(){ ScrollTrigger.refresh(); });
})();
