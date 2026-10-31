(function(){
"use strict";
var P = window.TM_PRESETS, CATS = window.TM_CATS, FONTS = window.TM_FONTS;
var $ = function(id){return document.getElementById(id)};
var DEF = {text:"Make it move", font:"auto", upper:false, speed:1, stagger:1, size:72, color:"#ffffff", accent:"#ff7a2f", bg:"#0d0b0a"};
var SW = {
  color:["#ffffff","#ffe9d6","#ff9a52","#111111"],
  accent:["#ff7a2f","#ffc94d","#ff3d6e","#3ad6ff"],
  bg:["#0d0b0a","#000000","#1b1e3a","#f6efe6"]
};
var st = load();
var cur = P.find(function(p){return p.id===st.preset}) || P[0];
var cat = "All", q = "", paused = false;
var favs = loadFavs();

function load(){
  var s = {}; try{ s = JSON.parse(localStorage.getItem("tms-settings")||"{}") }catch(e){}
  var o = {}; for (var k in DEF) o[k] = (s[k]!==undefined ? s[k] : DEF[k]); o.preset = s.preset; return o;
}
function save(){ try{ localStorage.setItem("tms-settings", JSON.stringify(Object.assign({}, st, {preset:cur.id}))) }catch(e){} }
function loadFavs(){ try{ return JSON.parse(localStorage.getItem("tms-favs")||"[]") }catch(e){ return [] } }
function saveFavs(){ try{ localStorage.setItem("tms-favs", JSON.stringify(favs)) }catch(e){} }
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;") }
function r2(n){ return Math.round(n*100)/100 }

/* ---------- snippet generator: one self-contained HTML file ---------- */
var SPLIT_JS = "(function(){var el=document.querySelector('.tm');var txt=el.textContent.replace(/\\s+/g,' ').trim();el.setAttribute('data-text',txt);el.setAttribute('aria-label',txt);\n"+
"if(el.getAttribute('data-split')!=='none'){var seg=(window.Intl&&Intl.Segmenter)?new Intl.Segmenter():null;var words=txt.split(' ');el.textContent='';var i=0,all=[];\n"+
"words.forEach(function(w,wi){var ws=document.createElement('span');ws.className='w';ws.setAttribute('aria-hidden','true');ws.style.setProperty('--wi',wi);\n"+
"var chars=seg?Array.from(seg.segment(w),function(x){return x.segment}):Array.from(w);\n"+
"chars.forEach(function(ch){var c=document.createElement('span');c.className='c';c.textContent=ch;c.style.setProperty('--i',i);c.style.setProperty('--r',Math.random().toFixed(3));all.push(c);i++;ws.appendChild(c)});\n"+
"el.appendChild(ws);if(wi<words.length-1)el.appendChild(document.createTextNode(' '))});\n"+
"all.forEach(function(c,k){c.style.setProperty('--d',Math.abs(k-(all.length-1)/2).toFixed(1))});el.style.setProperty('--n',all.length)}\n"+
"function fit(){el.classList.add('tm-fit');el.style.fontSize='';var s=parseFloat(getComputedStyle(el).fontSize),W=window.innerWidth*0.94,H=window.innerHeight*0.86;\n"+
"while((el.scrollWidth>W||el.offsetWidth>W||el.offsetHeight>H)&&s>10){s-=2;el.style.fontSize=s+'px'}void el.offsetWidth;el.classList.remove('tm-fit')}\n"+
"fit();var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(fit,150)})})();";

function settingsFor(p){
  var fontName = st.font==="auto" ? p.font : st.font;
  var f = FONTS[fontName] || FONTS.Inter;
  var weight = (st.font==="auto" ? p.weight : (fontName==="Bebas Neue"||fontName==="Pacifico" ? 400 : 800));
  return {
    fontName:fontName, f:f, weight:weight, italic: !!p.italic && st.font==="auto",
    dur: r2(p.dur/ st.speed), stagger: r2(p.stagger*st.stagger/ st.speed),
    upper: st.upper || !!p.upper
  };
}
function buildSnippet(p, forPreview){
  var s = settingsFor(p);
  var text = (st.text||"").trim() || "Make it move";
  var css =
"  :root{\n    --color:"+st.color+";\n    --accent:"+st.accent+";\n    --bg:"+st.bg+";\n    --dur:"+s.dur+"s;\n    --stagger:"+s.stagger+"s;\n    --size:"+st.size+"px;\n  }\n"+
"  *{box-sizing:border-box}\n  html,body{height:100%;margin:0}\n"+
"  body{display:flex;align-items:center;justify-content:center;background:var(--bg);overflow:hidden;-webkit-font-smoothing:antialiased}\n"+
"  .tm{margin:0;max-width:100%;padding:.15em .3em;font-family:"+s.f.css+";font-weight:"+s.weight+";"+(s.italic?"font-style:italic;":"")+"font-size:var(--size);line-height:1.15;color:var(--color);text-align:center;"+(s.upper?"text-transform:uppercase;":"")+"}\n"+
"  .tm .w{display:inline-block;white-space:nowrap}\n  .tm .c{display:inline-block;white-space:pre}\n"+
"  .tm.tm-fit,.tm.tm-fit *,.tm.tm-fit::before,.tm.tm-fit::after{animation:none!important}\n"+
"  /* preset: "+p.name+" */\n  "+p.css.replace(/\n/g,"\n  ")+"\n"+
"  @media (prefers-reduced-motion:reduce){.tm,.tm *,.tm::before,.tm::after{animation-duration:calc(var(--dur)*3)!important}}\n";
  if (forPreview) css += "  body.tm-paused *,body.tm-paused,body.tm-paused .tm::before,body.tm-paused .tm::after{animation-play-state:paused!important}\n";
  var html = "<!doctype html>\n<!-- "+p.name+" · made with Text Motion Studio. Change the text in the h1 and the values in :root. -->\n"+
"<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>"+esc(text)+"</title>\n"+
"<link href=\"https://fonts.googleapis.com/css2?family="+s.f.q+"&display=swap\" rel=\"stylesheet\">\n"+
"<style>\n"+css+"</style>\n</head>\n<body>\n"+
"<h1 class=\"tm\" data-split=\""+p.split+"\">"+esc(text)+"</h1>\n"+
"<script>\n"+SPLIT_JS+(p.js?"\n"+p.js:"")+"\n<\/script>\n</body>\n</html>\n";
  return html;
}
window.TMS_buildSnippet = function(id){ var p = P.find(function(x){return x.id===id}) || cur; return buildSnippet(p,false) };

/* ---------- UI: chips + grid ---------- */
function renderChips(){
  var counts = {All:P.length}; CATS.forEach(function(c){counts[c]=P.filter(function(p){return p.cat===c}).length});
  var list = ["All"].concat(CATS).concat(["Favourites"]);
  $("chips").innerHTML = list.map(function(c){
    var n = c==="Favourites" ? favs.length : counts[c];
    var label = c==="Favourites" ? "★ Favourites" : c;
    return '<button class="chip'+(c===cat?' on':'')+'" role="tab" aria-selected="'+(c===cat)+'" data-cat="'+esc(c)+'">'+esc(label)+' <span class="n">'+n+'</span></button>';
  }).join("");
}
function visible(){
  return P.filter(function(p){
    if (cat==="Favourites" && favs.indexOf(p.id)<0) return false;
    if (cat!=="All" && cat!=="Favourites" && p.cat!==cat) return false;
    if (q && (p.name+" "+p.cat+" "+p.desc).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
}
function renderGrid(){
  var v = visible();
  $("grid").innerHTML = v.map(function(p){
    var fav = favs.indexOf(p.id)>=0;
    return '<button class="tile'+(p.id===cur.id?' on':'')+'" data-id="'+p.id+'" aria-pressed="'+(p.id===cur.id)+'">'+
      '<span class="ic" aria-hidden="true">T</span><span class="nm">'+esc(p.name)+'</span><span class="ct">'+esc(p.cat)+'</span>'+
      (fav?'<span class="fs" aria-label="favourite">★</span>':'')+'</button>';
  }).join("");
  $("empty").hidden = v.length>0;
  if (cat==="Favourites" && !favs.length){ $("empty").hidden=false; $("empty").textContent="No favourites yet. Tap the star on a preset to keep it here."; }
  else $("empty").textContent="No preset matches that search.";
}

/* ---------- detail + preview ---------- */
var frame = $("frame"), buildT = null, codeOn = false;
function renderDetail(){
  $("pName").textContent = cur.name; $("pCat").textContent = cur.cat; $("pDesc").textContent = cur.desc;
  var s = settingsFor(cur);
  $("pSpec").textContent = s.dur+" s loop · "+(cur.split==="none"?"whole line":(/\.w\{[^}]*animation/.test(cur.css)?"per word":(cur.js&&cur.id.indexOf("type")===0?"letter by letter":"per letter")));
  var f = favs.indexOf(cur.id)>=0;
  $("favBtn").setAttribute("aria-pressed", f); $("favBtn").querySelector(".star").textContent = f?"★":"☆";
  $("favBtn").querySelector(".fav-label").textContent = f?"In favourites":"Add to favourites";
  $("favBtn").setAttribute("aria-label", f?"Remove from favourites":"Add to favourites");
}
function highlight(code){
  return esc(code).replace(/(--[a-z]+)(?=:)/g,'<span class="k">$1</span>');
}
function rebuild(now){
  clearTimeout(buildT);
  var go = function(){
    var html = buildSnippet(cur,true);
    frame.srcdoc = html;
    $("code").innerHTML = highlight(buildSnippet(cur,false));
    if (paused) setPaused(false);
    $("status").textContent = "Playing · "+cur.name;
  };
  if (now) go(); else buildT = setTimeout(go,160);
}
function setPaused(v){
  paused = v;
  try{ var w = frame.contentWindow; w.tmPaused = v; w.document.body.classList.toggle("tm-paused", v) }catch(e){}
  $("pauseBtn").setAttribute("aria-label", v?"Play":"Pause");
  $("pauseIcon").innerHTML = v ? '<path d="M7 5l12 7-12 7z" fill="currentColor"/>' : '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>';
  $("status").textContent = (v?"Paused · ":"Playing · ")+cur.name;
}
function select(id){
  var p = P.find(function(x){return x.id===id}); if(!p) return;
  cur = p; save(); renderGrid(); renderDetail(); if (codeOn) showCode(false); rebuild(true);
}
function showCode(on){
  codeOn = on;
  $("code").hidden = !on; frame.style.visibility = on ? "hidden" : "visible";
  $("tabCode").classList.toggle("on",on); $("tabPrev").classList.toggle("on",!on);
  $("tabCode").setAttribute("aria-selected",on); $("tabPrev").setAttribute("aria-selected",!on);
  $("stageLabel").textContent = on ? "Code · one HTML file" : "Live preview";
  $("codeBtn").setAttribute("aria-pressed", on); $("codeBtn").setAttribute("aria-label", on?"Show preview":"Show code");
}

/* ---------- copy / download ---------- */
var toastT;
function toast(msg){ var t=$("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(function(){t.classList.remove("show")},2600) }
function copy(){
  var code = buildSnippet(cur,false);
  var done = function(){ toast("Code copied. Paste it into an .html file and open it."); $("status").textContent="Copied · "+cur.name };
  var fallback = function(){
    var ta = document.createElement("textarea"); ta.value = code; ta.setAttribute("readonly",""); ta.style.position="fixed"; ta.style.top="-1000px"; document.body.appendChild(ta); ta.select();
    var ok=false; try{ ok = document.execCommand("copy") }catch(e){}
    document.body.removeChild(ta);
    if (ok) done(); else { showCode(true); toast("Copy was blocked here. The code is shown, select it by hand."); }
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(code).then(done, fallback); else fallback();
}
function download(){
  var blob = new Blob([buildSnippet(cur,false)], {type:"text/html"});
  var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "text-motion-"+cur.id+".html";
  document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove() }, 1000);
  toast("Saved text-motion-"+cur.id+".html");
}

/* ---------- controls ---------- */
function setRangeFill(el){ var p=(el.value-el.min)/(el.max-el.min)*100; el.style.setProperty("--p",p+"%") }
function syncControls(){
  $("txt").value = st.text; $("font").value = st.font;
  $("upper").setAttribute("aria-checked", st.upper);
  $("speed").value = st.speed; $("stagger").value = st.stagger; $("size").value = st.size;
  $("speedOut").textContent = Number(st.speed).toFixed(1)+"×"; $("stagOut").textContent = Number(st.stagger).toFixed(1)+"×"; $("sizeOut").textContent = st.size+" px";
  ["speed","stagger","size"].forEach(function(k){setRangeFill($(k))});
  renderSwatches();
}
function renderSwatches(){
  document.querySelectorAll(".sw").forEach(function(box){
    var k = box.getAttribute("data-key"), list = SW[k], v = st[k].toLowerCase();
    var custom = list.indexOf(v)<0;
    box.innerHTML = list.map(function(c){
      return '<button style="background:'+c+'" class="'+(c===v?'on':'')+'" data-c="'+c+'" aria-label="'+k+' '+c+'"></button>';
    }).join("") + '<label class="'+(custom?'on':'')+'" aria-label="Custom '+k+' colour" style="'+(custom?'box-shadow:0 0 0 2px var(--or);border-color:#fff':'')+'"><span style="--c:'+v+'"></span><input type="color" value="'+v+'" data-k="'+k+'"></label>';
  });
}
function change(){ save(); renderDetail(); rebuild(false) }

function init(){
  $("font").innerHTML = '<option value="auto">Preset default</option>' + Object.keys(FONTS).map(function(f){return '<option>'+f+'</option>'}).join("");
  $("count").textContent = P.length+" presets · "+CATS.length+" categories";
  renderChips(); renderGrid(); renderDetail(); syncControls(); rebuild(true);
  document.body.setAttribute("data-mpane","presets");

  $("chips").addEventListener("click", function(e){ var b=e.target.closest(".chip"); if(!b) return; cat=b.getAttribute("data-cat"); renderChips(); renderGrid() });
  $("grid").addEventListener("click", function(e){ var b=e.target.closest(".tile"); if(!b) return; select(b.getAttribute("data-id"));
    if (window.matchMedia("(max-width:860px)").matches){ var sw=document.querySelector(".stage-wrap"); if (sw.getBoundingClientRect().top>0) window.scrollTo({top:window.scrollY+sw.getBoundingClientRect().top,behavior:"smooth"}) } });
  $("search").addEventListener("input", function(){ q=this.value.trim().toLowerCase(); renderGrid() });
  $("favBtn").addEventListener("click", function(){ var i=favs.indexOf(cur.id); if(i>=0) favs.splice(i,1); else favs.push(cur.id); saveFavs(); renderChips(); renderGrid(); renderDetail();
    toast(i>=0?"Removed from favourites":"Added to favourites") });
  $("replayBtn").addEventListener("click", function(){ rebuild(true) });
  $("pauseBtn").addEventListener("click", function(){ setPaused(!paused) });
  $("copyBtn").addEventListener("click", copy);
  $("dlBtn").addEventListener("click", download);
  $("tabPrev").addEventListener("click", function(){ showCode(false) });
  $("tabCode").addEventListener("click", function(){ showCode(true) });
  $("codeBtn").addEventListener("click", function(){ showCode(!codeOn) });
  $("mPresets").addEventListener("click", function(){ document.body.setAttribute("data-mpane","presets"); this.classList.add("on"); $("mCustom").classList.remove("on"); this.setAttribute("aria-selected","true"); $("mCustom").setAttribute("aria-selected","false") });
  $("mCustom").addEventListener("click", function(){ document.body.setAttribute("data-mpane","custom"); this.classList.add("on"); $("mPresets").classList.remove("on"); this.setAttribute("aria-selected","true"); $("mPresets").setAttribute("aria-selected","false") });

  $("txt").addEventListener("input", function(){ st.text=this.value; change() });
  $("font").addEventListener("change", function(){ st.font=this.value; change() });
  $("upper").addEventListener("click", function(){ st.upper=!st.upper; this.setAttribute("aria-checked",st.upper); change() });
  [["speed","speedOut","×",1],["stagger","stagOut","×",1],["size","sizeOut"," px",0]].forEach(function(a){
    $(a[0]).addEventListener("input", function(){ st[a[0]] = Number(this.value); $(a[1]).textContent = (a[3]?Number(this.value).toFixed(1):this.value)+a[2]; setRangeFill(this); change() });
  });
  document.querySelector(".colors").addEventListener("click", function(e){ var b=e.target.closest("button[data-c]"); if(!b) return; var k=b.parentNode.getAttribute("data-key"); st[k]=b.getAttribute("data-c"); renderSwatches(); change() });
  document.querySelector(".colors").addEventListener("input", function(e){ var i=e.target; if(i.type!=="color") return; st[i.getAttribute("data-k")]=i.value; i.previousElementSibling.style.setProperty("--c",i.value); change() });
  document.querySelector(".colors").addEventListener("change", function(e){ if(e.target.type==="color") renderSwatches() });
  $("resetBtn").addEventListener("click", function(){ var keep=cur.id; st = Object.assign({}, DEF); cur = P.find(function(p){return p.id===keep}); save(); syncControls(); renderDetail(); rebuild(true); toast("Settings reset") });
  document.addEventListener("keydown", function(e){
    if (e.target.matches("input,select,textarea")) return;
    if (e.key===" "){ e.preventDefault(); setPaused(!paused) }
    if (e.key==="ArrowDown"||e.key==="ArrowUp"){ var v=visible(), i=v.indexOf(cur); if(i<0) return; e.preventDefault(); var n=v[(i+(e.key==="ArrowDown"?2:-2)+v.length)%v.length]; select(n.id) }
  });
}
init();
})();
