/* VELOURA garments: one real product photo per piece (Pexels, credited in the footer), cut out and hung on its own hanger. No recolours. */
(function(){
var NECK={"navy": 0.1716, "beige": 0.1362, "cardigan2": 0.1612, "grey": 0.1716, "whiteshirt": 0.1457, "vest": 0.144, "wls": 0.1509, "orange": 0.1672};
var P=[
 {id:'white',file:'whiteshirt',kind:'Shirt',name:'White Band Collar Shirt',price:189,colors:[{hex:'#f1efea',name:'White',file:'whiteshirt'}],desc:'A crisp short sleeve shirt with a neat band collar and a full button front. Light, breathable and easy to wear open or closed.'},
 {id:'navy',file:'navy',kind:'Tee',name:'Navy Linen Tee',price:139,colors:[{hex:'#252c3f',name:'Navy',file:'navy'}],desc:'A relaxed tee in a soft slub fabric with a natural linen look. Deep navy, dropped shoulders and a straight hem.'},
 {id:'sand',file:'beige',kind:'Shirt',name:'Sand Linen Overshirt',price:249,colors:[{hex:'#d8c6a8',name:'Sand',file:'beige'}],desc:'A long sleeve overshirt in a warm sand tone. Wear it buttoned up or open over a tee.'},
 {id:'cherry',file:'cardigan2',kind:'Knit',name:'Cherry Knit Cardigan',price:279,colors:[{hex:'#9e2a2b',name:'Cherry',file:'cardigan2'}],desc:'A soft knit cardigan in rich cherry red with ribbed cuffs, hem and button band.'},
 {id:'stone',file:'grey',kind:'Tee',name:'Stone Grey Tee',price:129,colors:[{hex:'#a3a19c',name:'Stone',file:'grey'}],desc:'An easy everyday tee in a heathered stone grey, with a relaxed body and a soft crew neck.'},
 {id:'tangerine',file:'orange',kind:'Tee',name:'Tangerine Cotton Tee',price:119,colors:[{hex:'#e8742c',name:'Tangerine',file:'orange'}],desc:'A bright cotton tee in a warm tangerine. Classic fit with a ribbed crew neck.'},
 {id:'vest',file:'vest',kind:'Tank',name:'Black Linen Tank',price:159,colors:[{hex:'#1d1d1f',name:'Black',file:'vest'}],desc:'A sleeveless tank in a light linen look fabric. Clean black, easy to layer or wear alone in the heat.'},
 {id:'oxford',file:'wls',kind:'Shirt',name:'White Long Sleeve Shirt',price:219,colors:[{hex:'#f4f3ef',name:'White',file:'wls'}],desc:'A long sleeve white shirt with a band collar and buttoned cuffs. Smart enough for work, relaxed enough for the weekend.'}
];
P.forEach(function(p){p.color=p.colors[0].hex;p.neck=NECK[p.file]||.15;p.type=p.kind.toLowerCase();});
function url(p,view,hex){return 'img/r7-'+p.file+'.webp?v=7';}
window.GARMENTS={products:P,url:url};
})();
