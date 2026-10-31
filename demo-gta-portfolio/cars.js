// Car models: free 3D models from Sketchfab under CC BY 4.0, compressed for the web.
export const CARS = [
  { id: 'mclaren', name: 'McLaren P1', brand: 'McLaren', model: 'P1', url: 'models/mclaren.glb?v=2', len: 4.59, acc: '#ff8a3d',
    paint: /^Carpaint$/, paintColor: '#ff6a00', metal: 0.45, rough: 0.3, glass: /^Windows/, lightsF: /^Headlights$/, lightsR: /^Taillights$/, wheel: /WHEEL_|Tyre_|RIM_/ },
  { id: 'lambo', name: 'Lamborghini Aventador SVJ', brand: 'Lamborghini', model: 'Aventador SVJ', url: 'models/lambo.glb?v=2', len: 4.94, acc: '#b46bff',
    paint: /^CARROSSERIE$/, lightsF: /^LightEmissiveWhite$/, lightsR: /^GlassRedLights$/, wheel: /Wheel(Fr|Rear)|WheelMetal|WheelTire/, noSpin: /Brake/ },
  { id: 'bugatti', name: 'Bugatti Chiron', brand: 'Bugatti', model: 'Chiron', url: 'models/bugatti.glb?v=2', len: 4.54, acc: '#2ef2ff',
    paint: /^Color1Mtl$/, hideMat: /^Sombra1Mtl$/, wheel: /Neumatico1Mtl|Rin1Mtl/ },
  { id: 'dodge', name: 'Dodge Challenger SRT', brand: 'Dodge', model: 'Challenger SRT', url: 'models/dodge.glb?v=2', len: 5.03, acc: '#ff3fa4',
    paint: /^Carosserie$/, lightsR: /^Light_RED$/, wheel: /RIMS_BLACK|:Tire(\/|$)/ },
];
export const CREDITS = [
  { what: 'McLaren P1', html: '"Mclaren P1 | www.vecarz.com" by <a href="https://sketchfab.com/heynic" target="_blank" rel="noopener">vecarz</a> on <a href="https://sketchfab.com/3d-models/mclaren-p1-wwwvecarzcom-adae2edc721e4ce7b31c1d06a581e30a" target="_blank" rel="noopener">Sketchfab</a>, licensed <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Compressed for the web.' },
  { what: 'Lamborghini Aventador SVJ', html: '"Lamborghini Aventador SVJ SDC ( FREE )" by <a href="https://sketchfab.com/Lambo_SC04" target="_blank" rel="noopener">SDC PERFORMANCE</a> on <a href="https://sketchfab.com/3d-models/lamborghini-aventador-svj-sdc-free-784e4656aca649cca55d6b18740a19b2" target="_blank" rel="noopener">Sketchfab</a>, licensed <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Simplified and compressed.' },
  { what: 'Bugatti Chiron', html: '"2023 Bugatti Chiron Profilee" by <a href="https://sketchfab.com/supercarmodels" target="_blank" rel="noopener">DisneyCars</a> on <a href="https://sketchfab.com/3d-models/2023-bugatti-chiron-profilee-6da5092ee455446cb050e4c6b4a3ac05" target="_blank" rel="noopener">Sketchfab</a>, licensed <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Compressed for the web.' },
  { what: 'Dodge Challenger SRT', html: '"( FREE ) Dodge Challenger SRT" by <a href="https://sketchfab.com/Lambo_SC04" target="_blank" rel="noopener">SDC PERFORMANCE</a> on <a href="https://sketchfab.com/3d-models/free-dodge-challenger-srt-38a1fd572beb433fa2d26d8c1070c8fa" target="_blank" rel="noopener">Sketchfab</a>, licensed <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Compressed for the web.' },
  { what: 'Traffic cars', html: 'Simplified from the Ferrari 458 Italia model by <a href="https://sketchfab.com/vicent091036" target="_blank" rel="noopener">vicent091036</a> (three.js examples), licensed <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>, badges removed.' }
];
