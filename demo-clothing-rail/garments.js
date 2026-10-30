/* VELOURA garments: one real hoodie photo (Pexels), cut out by hand and colour graded per colourway (see credits in the footer) */
(function(){
var C={
 sand:{hex:'#cdb89a',name:'Sand'},midnight:{hex:'#2b2a30',name:'Midnight'},lilac:{hex:'#bfb0dc',name:'Lilac'},ivory:{hex:'#e9e3d7',name:'Ivory'},
 forest:{hex:'#2c5a43',name:'Forest'},ash:{hex:'#a7a6ab',name:'Ash'},clay:{hex:'#b7735a',name:'Clay'},mist:{hex:'#9fb2c6',name:'Mist'},cobalt:{hex:'#2d55a8',name:'Cobalt'},
 heritage:{hex:'#24324d',name:'Navy block'},sageb:{hex:'#2c5a43',name:'Forest block',file:'sage'},mono:{hex:'#1f1e23',name:'Onyx block'},duneb:{hex:'#6b5a45',name:'Dune block',file:'dune'},lilacb:{hex:'#4b3f6b',name:'Plum block',file:'lilac'},
 indigo:{hex:'#3e5a80',name:'Indigo'},olive:{hex:'#6e6b48',name:'Olive'},black:{hex:'#2a2a2e',name:'Washed black'}
};
var TYPE={hoodie:['sand','midnight','lilac','ivory','forest','ash','clay','mist','cobalt','indigo','olive'],crew:['heritage','sageb','mono','duneb','lilacb'],denim:['indigo','black']};
var P=[
 {id:'dune',type:'hoodie',c:'sand',name:'Dune Heavyweight Hoodie',kind:'Hoodie',price:289,desc:'Our signature 480 gsm hoodie in a warm sand tone. Double layer hood, flat drawcords and a deep kangaroo pocket.'},
 {id:'midnight',type:'hoodie',c:'midnight',name:'Midnight Hoodie',kind:'Hoodie',price:299,desc:'A deep charcoal black that stays dark wash after wash. Brushed inside, clean outside, made for layering.'},
 {id:'lilac',type:'hoodie',c:'lilac',name:'Lilac Cloud Hoodie',kind:'Hoodie',price:289,desc:'The signature hoodie in a calm lilac with tone on tone chest embroidery.'},
 {id:'indigo',type:'hoodie',c:'indigo',name:'Indigo Wash Hoodie',kind:'Hoodie',price:309,desc:'Garment dyed in a deep indigo with a soft washed look. Heavy brushed fleece and a double layer hood.'},
 {id:'ivory',type:'hoodie',c:'ivory',name:'Ivory Oversized Hoodie',kind:'Hoodie',price:299,desc:'An off white hoodie cut extra roomy, with ribbed cuffs that keep the sleeves stacked.'},
 {id:'clay',type:'hoodie',c:'clay',name:'Clay Hoodie',kind:'Hoodie',price:289,desc:'Garment dyed in a burnt clay colour that softens with every wash.'},
 {id:'cobalt',type:'hoodie',c:'cobalt',name:'Cobalt Hoodie',kind:'Hoodie',price:299,desc:'A bold cobalt blue that keeps its colour. Heavy brushed fleece with a double layer hood.'},
 {id:'forest',type:'hoodie',c:'forest',big:true,name:'Forest Original Hoodie',kind:'Hoodie',price:319,desc:'Deep forest green, our most loved piece this season. Heavy, soft and built to keep its shape.'},
 {id:'ash',type:'hoodie',c:'ash',big:true,name:'Ash Grey Hoodie',kind:'Hoodie',price:299,desc:'Heather grey fleece that goes with everything in your wardrobe.'},
 {id:'olive',type:'hoodie',c:'olive',name:'Olive Field Hoodie',kind:'Hoodie',price:299,desc:'A muted olive that sits well with denim and neutrals. Brushed inside, clean outside.'},
 {id:'mist',type:'hoodie',c:'mist',name:'Mist Blue Hoodie',kind:'Hoodie',price:289,desc:'A soft mist blue, garment dyed for a lived in look from day one.'}
];
var BYHEX={};
P.forEach(function(p){
  var keys=TYPE[p.type].slice();keys.splice(keys.indexOf(p.c),1);keys.unshift(p.c);
  p.colors=keys.slice(0,p.type==='denim'?2:4).map(function(k){var o=C[k];BYHEX[p.type+o.hex]=p.type+'-'+(o.file||k);return {hex:o.hex,name:o.name}});
  p.color=C[p.c].hex;
});
function url(p,view,hex){return 'img/'+(BYHEX[p.type+(hex||p.color)]||(p.type+'-'+(C[p.c].file||p.c)))+'.webp?v=5';}
window.GARMENTS={products:P,url:url};
})();
