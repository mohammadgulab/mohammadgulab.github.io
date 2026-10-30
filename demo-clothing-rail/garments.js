/* VELOURA garment artwork, drawn as SVG in code */
(function(){
function hx(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function shade(h,p){var c=hx(h);var t=p<0?0:255,f=Math.abs(p)/100;return 'rgb('+c.map(function(v){return Math.round(v+(t-v)*f)}).join(',')+')'}

var P=[
 {id:'dune',type:'hoodie',color:'#cdb89a',accent:'#cdb89a',print:'#a8916f',name:'Dune Heavyweight Hoodie',kind:'Hoodie',price:289,desc:'Our signature 480 gsm hoodie in a warm sand tone. Double layer hood, flat drawcords and a deep kangaroo pocket.'},
 {id:'midnight',type:'zip',color:'#2b2a30',accent:'#2b2a30',print:'#4a4852',name:'Midnight Zip Hoodie',kind:'Zip hoodie',price:329,desc:'Full zip with a matte black metal pull. Brushed inside, clean outside, made for layering.'},
 {id:'sage',type:'crew',color:'#a9b8a0',accent:'#a9b8a0',print:'#86977c',name:'Sage Crewneck',kind:'Sweatshirt',price:249,desc:'A soft garment dyed crewneck with a wide rib collar and dropped shoulders.'},
 {id:'lilac',type:'hoodie',color:'#bfb0dc',accent:'#bfb0dc',print:'#9a89bf',name:'Lilac Cloud Hoodie',kind:'Hoodie',price:289,desc:'The signature hoodie in a calm lilac. Tone on tone embroidery on the chest, big back print.'},
 {id:'varsity',type:'bomber',color:'#24324d',accent:'#efe6d4',print:'#efe6d4',name:'Varsity Bomber',kind:'Jacket',price:449,desc:'Wool blend body with cream sleeves, striped rib trims and a quilted lining.'},
 {id:'ivory',type:'hoodie',color:'#ece6da',accent:'#ece6da',print:'#cfc6b4',name:'Ivory Oversized Hoodie',kind:'Hoodie',price:299,desc:'An off white hoodie cut extra roomy, with ribbed cuffs that keep the sleeves stacked.'},
 {id:'clay',type:'halfzip',color:'#b7735a',accent:'#b7735a',print:'#94573f',name:'Clay Half Zip',kind:'Sweatshirt',price:279,desc:'A half zip sweatshirt with a stand collar, in a burnt clay colour that suits every season.'},
 {id:'mist',type:'puffer',color:'#9fb2c6',accent:'#9fb2c6',print:'#7f93a8',name:'Mist Puffer Jacket',kind:'Jacket',price:499,desc:'Light, warm and packable. Matte shell, recycled fill and a high stand collar.'},
 {id:'forest',type:'hoodie',big:true,color:'#24503a',accent:'#24503a',print:'#efe6d4',name:'Forest Original Hoodie',kind:'Hoodie',price:319,desc:'Deep forest green with a cracked cream varsity print across the chest. Our most loved piece this season.'},
 {id:'ash',type:'hoodie',big:true,color:'#a7a6ab',accent:'#a7a6ab',print:'#3c3a41',name:'Ash Grey Hoodie',kind:'Hoodie',price:299,desc:'Heather grey fleece with a charcoal chest print. Easy to wear with anything.'},
 {id:'onyx',type:'crew',color:'#1f1e23',accent:'#1f1e23',print:'#3d3b44',name:'Onyx Crewneck',kind:'Sweatshirt',price:249,desc:'A true black crewneck that stays black, thanks to a reactive garment dye.'},
 {id:'cream',type:'crew',color:'#e6dcc6',accent:'#e6dcc6',print:'#bfb293',name:'Cream Crewneck',kind:'Sweatshirt',price:249,desc:'Warm cream with tone on tone embroidery. Soft enough to sleep in.'}
];
var ALT={hoodie:['#2b2a30','#a7a6ab','#24503a','#cdb89a','#bfb0dc','#ece6da'],zip:['#2b2a30','#5a5f6b','#cdb89a'],crew:['#a9b8a0','#1f1e23','#e6dcc6','#24324d'],bomber:['#24324d','#2b2a30','#24503a'],halfzip:['#b7735a','#24324d','#cdb89a'],puffer:['#9fb2c6','#2b2a30','#e8e4dc']};
var NAMES={'#2b2a30':'Midnight','#a7a6ab':'Ash','#24503a':'Forest','#cdb89a':'Sand','#bfb0dc':'Lilac','#ece6da':'Ivory','#5a5f6b':'Slate','#a9b8a0':'Sage','#1f1e23':'Onyx','#e6dcc6':'Cream','#24324d':'Navy','#b7735a':'Clay','#9fb2c6':'Mist','#e8e4dc':'Bone'};
P.forEach(function(p){var l=ALT[p.type].slice();if(l.indexOf(p.color)<0)l.unshift(p.color);else{l.splice(l.indexOf(p.color),1);l.unshift(p.color);}p.colors=l.slice(0,4).map(function(h){return {hex:h,name:NAMES[h]||'Original'}});});
function printFor(p,hex){if(hex===p.color)return p.print;var c=hx(hex),l=(c[0]*.3+c[1]*.59+c[2]*.11);if(p.big)return l<120?'#efe6d4':'#2e2c33';return shade(hex,l<90?18:-18);}

var uid=0;
function svg(p,view,hex){
  if(hex&&hex!==p.color){var q={};for(var k in p)q[k]=p[k];q.print=printFor(p,hex);q.color=hex;if(p.type!=='bomber')q.accent=hex;p=q;}
  var id='g'+(uid++), back=view==='back', c=p.color, t=p.type;
  var hooded=(t==='hoodie'||t==='zip'), puffer=t==='puffer';
  var body= puffer
   ? 'M114 54 C128 64 172 64 186 54 L232 72 C244 78 246 94 242 112 L230 162 L232 318 C192 328 108 328 68 318 L70 162 L58 112 C54 94 56 78 68 72 Z'
   : 'M116 56 C128 66 172 66 184 56 L228 74 C238 78 240 92 236 110 L222 160 L224 316 C190 324 110 324 76 316 L78 160 L64 110 C60 92 62 78 72 74 Z';
  var slL = puffer
   ? 'M68 74 C50 84 44 106 42 134 L30 298 C46 306 64 306 80 300 L90 172 Z'
   : 'M72 76 C56 84 50 104 48 130 L36 296 C50 302 66 302 80 298 L90 170 Z';
  var slR='<g transform="translate(300 0) scale(-1 1)"><path d="'+slL+'"/></g>';
  var sleeveCol = t==='bomber'?p.accent:c;
  var hoodBack='M104 70 C98 40 124 30 150 30 C176 30 202 40 196 70 C190 86 110 86 104 70 Z';
  var hoodDown='M102 62 C94 40 124 26 150 26 C176 26 206 40 198 62 C210 104 198 146 150 156 C102 146 90 104 102 62 Z';
  var s=[];
  s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="600" height="800">');
  s.push('<defs>'+
   '<filter id="'+id+'n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="'+(uid%9)+'"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0"/></filter>'+
   '<filter id="'+id+'d" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#2a2140" flood-opacity=".22"/></filter>'+
   '<linearGradient id="'+id+'h" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".26"/><stop offset=".22" stop-color="#000" stop-opacity=".04"/><stop offset=".5" stop-color="#fff" stop-opacity=".10"/><stop offset=".78" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>'+
   '<linearGradient id="'+id+'v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>'+
   '<linearGradient id="'+id+'q" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>'+
   '<radialGradient id="'+id+'r" cx=".5" cy=".3" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'+
   '<pattern id="'+id+'rib" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="'+shade(c,-8)+'"/><rect width="1.6" height="4" fill="'+shade(c,-22)+'" opacity=".55"/></pattern>'+
   '<pattern id="'+id+'ribA" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="'+shade(sleeveCol,-8)+'"/><rect width="1.6" height="4" fill="'+shade(sleeveCol,-22)+'" opacity=".55"/></pattern>'+
   '<clipPath id="'+id+'c"><path d="'+body+'"/><path d="'+slL+'"/><path transform="translate(300 0) scale(-1 1)" d="'+slL+'"/>'+(hooded&&!back?'<path d="'+hoodBack+'"/>':'')+(hooded&&back?'<path d="'+hoodDown+'"/>':'')+'</clipPath>'+
   '<clipPath id="'+id+'b"><path d="'+body+'"/></clipPath>'+
   '<path id="'+id+'arc" d="M84 214 Q150 170 216 214"/><path id="'+id+'arc2" d="M86 160 Q150 118 214 160"/>'+
   '</defs>');
  // hanger hook
  s.push('<g fill="none" stroke-linecap="round"><path d="M150 46 L150 18 C150 8 160 4 166 9 C171 14 168 21 162 22" stroke="#6f6a75" stroke-width="3.6"/><path d="M150 46 L150 18 C150 8 160 4 166 9" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/></g>');
  s.push('<g filter="url(#'+id+'d)">');
  // hood behind (front view)
  if(hooded&&!back) s.push('<path d="'+hoodBack+'" fill="'+shade(c,-14)+'"/>');
  // sleeves
  s.push('<g fill="'+sleeveCol+'"><path d="'+slL+'"/>'+slR+'</g>');
  // torso
  s.push('<path d="'+body+'" fill="'+c+'"/>');
  // hood down the back (back view)
  if(hooded&&back) s.push('<path d="'+hoodDown+'" fill="'+shade(c,-4)+'"/><path d="M150 28 L150 154" stroke="'+shade(c,-22)+'" stroke-width="1.4"/><path d="'+hoodDown+'" fill="url(#'+id+'h)"/>');
  // cuffs and hem
  var cuffY = puffer?284:280;
  s.push('<path d="M'+(puffer?31:37)+' '+cuffY+' L'+(puffer?81:81)+' '+(cuffY+4)+' L80 '+(puffer?300:298)+' C66 302 50 302 '+(puffer?30:36)+' '+(puffer?298:296)+' Z" fill="url(#'+id+'ribA)"/>');
  s.push('<g transform="translate(300 0) scale(-1 1)"><path d="M'+(puffer?31:37)+' '+cuffY+' L81 '+(cuffY+4)+' L80 '+(puffer?300:298)+' C66 302 50 302 '+(puffer?30:36)+' '+(puffer?298:296)+' Z" fill="url(#'+id+'ribA)"/></g>');
  if(!puffer) s.push('<path d="M76 296 C110 304 190 304 224 296 L224 316 C190 324 110 324 76 316 Z" fill="url(#'+id+'rib)"/>');
  if(t==='bomber'){ // stripes on rib
    s.push('<g stroke="'+p.accent+'" stroke-width="2.2" opacity=".9"><path d="M76 304 C110 312 190 312 224 304" fill="none"/><path d="M76 309 C110 317 190 317 224 309" fill="none"/><path d="M37 288 L81 292" /><path d="M219 292 L263 288"/></g>');
  }
  // puffer quilting
  if(puffer){
    var q='';
    for(var y=96;y<330;y+=34){q+='<rect x="20" y="'+y+'" width="260" height="34" fill="url(#'+id+'q)"/><path d="M20 '+y+' L280 '+y+'" stroke="'+shade(c,-30)+'" stroke-width="1.3" opacity=".7"/>';}
    s.push('<g clip-path="url(#'+id+'c)">'+q+'</g>');
  }
  // necklines
  if(!back){
    if(hooded){
      s.push('<path d="M122 58 C132 50 168 50 178 58 C172 82 158 96 150 100 C142 96 128 82 122 58 Z" fill="'+shade(c,-38)+'"/>');
      s.push('<path d="M118 56 C124 74 140 94 150 102 C160 94 176 74 182 56" fill="none" stroke="'+shade(c,10)+'" stroke-width="4" stroke-linecap="round" opacity=".55"/>');
    } else if(t==='crew'){
      s.push('<path d="M120 50 C132 66 168 66 180 50 C170 44 130 44 120 50 Z" fill="'+shade(c,-36)+'"/><path d="M112 54 C126 78 174 78 188 54 L180 50 C168 68 132 68 120 50 Z" fill="url(#'+id+'rib)"/>');
    } else if(t==='bomber'){
      s.push('<path d="M120 50 C132 62 168 62 180 50 C170 44 130 44 120 50 Z" fill="'+shade(c,-36)+'"/><path d="M110 54 C124 80 176 80 190 54 L180 48 C168 70 132 70 120 48 Z" fill="url(#'+id+'rib)"/><path d="M111 60 C125 84 175 84 189 60" stroke="'+p.accent+'" stroke-width="2" fill="none"/>');
    } else { // halfzip, puffer: stand collar
      s.push('<path d="M118 44 C130 54 170 54 182 44 L186 60 C172 72 128 72 114 60 Z" fill="'+(puffer?shade(c,-6):'url(#'+id+'rib)')+'"/><path d="M118 44 C130 38 170 38 182 44 C170 50 130 50 118 44 Z" fill="'+shade(c,-36)+'"/>');
    }
  } else {
    if(!hooded) s.push('<path d="M114 52 C128 64 172 64 186 52 L180 47 C168 57 132 57 120 47 Z" fill="'+(puffer?shade(c,-6):'url(#'+id+'rib)')+'"/>');
  }
  // zips
  if(!back&&(t==='zip'||t==='bomber'||t==='puffer'||t==='halfzip')){
    var zEnd = t==='halfzip'?150:318, zTop = (t==='zip')?100:(t==='bomber'?72:46);
    s.push('<path d="M150 '+zTop+' L150 '+zEnd+'" stroke="'+shade(c,-40)+'" stroke-width="5"/><path d="M150 '+zTop+' L150 '+zEnd+'" stroke="#c9c4cf" stroke-width="2.4" stroke-dasharray="1.6 1.6"/>');
    s.push('<rect x="146.5" y="'+(zTop+4)+'" width="7" height="16" rx="2.5" fill="#3b3842"/><rect x="148.3" y="'+(zTop+7)+'" width="3.4" height="9" rx="1.5" fill="#8e8996"/>');
  }
  // kangaroo pocket
  if(!back&&t==='hoodie'){
    s.push('<path d="M104 226 C130 222 170 222 196 226 L208 292 C170 296 130 296 92 292 Z" fill="'+shade(c,-3)+'"/><path d="M104 226 L92 292 M196 226 L208 292" stroke="'+shade(c,-30)+'" stroke-width="2.2" fill="none"/><path d="M104 226 C130 222 170 222 196 226" stroke="'+shade(c,-18)+'" stroke-width="1.4" fill="none"/>');
  }
  if(!back&&t==='zip'){
    s.push('<path d="M100 228 L146 226 L146 294 L90 292 Z M200 228 L154 226 L154 294 L210 292 Z" fill="'+shade(c,4)+'" opacity=".55"/><path d="M100 228 L90 292 M200 228 L210 292" stroke="'+shade(c,-40)+'" stroke-width="2.2" fill="none"/>');
  }
  if(!back&&t==='bomber'){
    s.push('<path d="M96 230 L112 268 M204 230 L188 268" stroke="'+shade(c,-40)+'" stroke-width="4" stroke-linecap="round"/><path d="M96 230 L112 268 M204 230 L188 268" stroke="'+shade(c,22)+'" stroke-width="1" stroke-linecap="round" opacity=".6"/>');
  }
  // drawcords
  if(!back&&hooded){
    s.push('<g stroke-linecap="round" fill="none"><path d="M138 94 C136 120 140 140 134 172" stroke="#f4efe6" stroke-width="3.2"/><path d="M162 94 C164 124 160 146 167 178" stroke="#f4efe6" stroke-width="3.2"/></g><rect x="131" y="170" width="6" height="11" rx="2" fill="#5b5662"/><rect x="164" y="176" width="6" height="11" rx="2" fill="#5b5662"/>');
  }
  s.push('</g>');
  // shading overlays clipped to silhouette
  s.push('<g clip-path="url(#'+id+'c)" style="pointer-events:none">'+
   '<rect x="0" y="0" width="300" height="400" fill="url(#'+id+'h)"/>'+
   '<rect x="0" y="0" width="300" height="400" fill="url(#'+id+'v)"/>'+
   '<ellipse cx="150" cy="130" rx="90" ry="90" fill="url(#'+id+'r)"/>'+
   '<g fill="none" stroke-linecap="round"><path d="M98 170 C108 204 100 244 110 286" stroke="#000" stroke-opacity=".07" stroke-width="7"/><path d="M204 166 C194 204 202 246 190 288" stroke="#000" stroke-opacity=".07" stroke-width="7"/><path d="M118 150 C122 190 118 230 124 270" stroke="#fff" stroke-opacity=".08" stroke-width="5"/><path d="M60 150 C58 200 54 240 52 280" stroke="#fff" stroke-opacity=".08" stroke-width="4"/><path d="M240 150 C242 200 246 240 248 280" stroke="#000" stroke-opacity=".08" stroke-width="4"/><path d="M80 166 L80 296 M220 166 L220 296" stroke="#000" stroke-opacity=".14" stroke-width="3"/></g>'+
   '<rect x="0" y="0" width="300" height="400" filter="url(#'+id+'n)" opacity=".16"/>'+
   '</g>');
  // prints
  var font='font-family="Helvetica Neue,Arial,sans-serif" font-weight="800"';
  if(!back){
    var py = t==='hoodie'?150:(t==='zip'||t==='puffer'||t==='bomber'?0:140);
    if(p.big&&t==='hoodie'){py=0;s.push('<text '+font+' font-size="30" letter-spacing="1" fill="'+p.print+'" stroke="'+shade(p.color,-30)+'" stroke-width=".6"><textPath href="#'+id+'arc2" startOffset="50%" text-anchor="middle">VELOURA</textPath></text><text x="150" y="178" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="15" letter-spacing="2" fill="'+p.print+'">Original</text>');}
    if(py) s.push('<text x="150" y="'+py+'" text-anchor="middle" '+font+' font-size="13" letter-spacing="4" fill="'+p.print+'">VELOURA</text>');
    if(t==='zip'||t==='puffer') s.push('<text x="'+(t==='puffer'?192:186)+'" y="'+(t==='puffer'?140:128)+'" text-anchor="middle" '+font+' font-size="8" letter-spacing="2" fill="'+p.print+'">VELOURA</text>');
    if(t==='bomber') s.push('<g><circle cx="116" cy="130" r="15" fill="none" stroke="'+p.accent+'" stroke-width="2.4"/><text x="116" y="136" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="17" fill="'+p.accent+'">V</text></g>');
  } else {
    if(puffer){s.push('<text x="150" y="112" text-anchor="middle" '+font+' font-size="12" letter-spacing="4" fill="'+p.print+'">VELOURA</text>');s.push('</svg>');return s.join('');}
    var by = hooded?0:-34;
    s.push('<g transform="translate(0 '+by+')"><text '+font+' font-size="25" letter-spacing="3" fill="'+p.print+'"><textPath href="#'+id+'arc" startOffset="50%" text-anchor="middle">VELOURA</textPath></text>'+
      '<text x="150" y="238" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="14" fill="'+p.print+'">Studio</text>'+
      '<text x="150" y="262" text-anchor="middle" '+font+' font-size="9" letter-spacing="3.5" fill="'+p.print+'">EST. RIYADH 26</text></g>');
  }
  s.push('</svg>');
  return s.join('');
}
var cache={};
function url(p,view,hex){hex=hex||p.color;var k=p.id+(view||'front')+hex;if(!cache[k]){cache[k]=URL.createObjectURL(new Blob([svg(p,view,hex)],{type:'image/svg+xml'}));}return cache[k];}
window.GARMENTS={products:P,svg:svg,url:url};
})();
