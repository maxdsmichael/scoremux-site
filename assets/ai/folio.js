import * as THREE from './vendor/three.module.min.js';
// Genuine PDF page textures on gently curved paper. No generated notation.
const root=document.querySelector('#folio-3d');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
if(root){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{root.classList.add('folio-fallback');}
 if(renderer){
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,0,9);
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;root.appendChild(renderer.domElement);
 renderer.domElement.setAttribute('aria-hidden','true');
 scene.add(new THREE.HemisphereLight(0xffffff,0xa594c9,2.7));const main=new THREE.DirectionalLight(0xffffff,3);main.position.set(-2,5,8);scene.add(main);const rim=new THREE.PointLight(0x48daff,12,8);rim.position.set(.1,1.7,1.3);scene.add(rim);const violet=new THREE.PointLight(0x9270ff,8,9);violet.position.set(-3,-2,1);scene.add(violet);
 const folio=new THREE.Group();scene.add(folio);folio.rotation.set(-.28,-.2,.16);
 const loader=new THREE.TextureLoader();const paths=['score-left.png','score-cornet.png'];let loaded=0;
 const textures=paths.map(p=>loader.load('/assets/ai/'+p,texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());loaded++;if(loaded>=2)root.classList.add('folio-loaded');},undefined,()=>{}));
 function paperGeometry(side,z=0){const g=new THREE.PlaneGeometry(2.15,3.05,36,40);const pos=g.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i)+side*1.085;const y=pos.getY(i);const u=Math.abs(x)/2.16;pos.setXYZ(i,x,y,z+.16*Math.sin(u*Math.PI)+.055*u*u+.025*Math.cos(y*1.2)*u);}g.computeVertexNormals();return g;}
 const pages=[];
 for(const side of [-1,1]){
  const cover=new THREE.Mesh(new THREE.BoxGeometry(2.27,3.17,.045),new THREE.MeshStandardMaterial({color:0x151c24,roughness:.92,metalness:.02}));cover.position.set(side*1.12,0,-.1);folio.add(cover);
  for(let j=0;j<6;j++){const under=new THREE.Mesh(paperGeometry(side,-.015-j*.01),new THREE.MeshStandardMaterial({color:j%2?0xe4e4dc:0xc8cbc7,roughness:1,side:THREE.DoubleSide}));under.position.x=side*j*.003;folio.add(under);}
  const g=paperGeometry(side,.018);const material=new THREE.MeshStandardMaterial({map:textures[side<0?0:1],color:0xffffff,roughness:.98,metalness:0,side:THREE.DoubleSide});const p=new THREE.Mesh(g,material);folio.add(p);pages.push({mesh:p,base:new Float32Array(g.attributes.position.array),side});
 }
 const spine=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,3.13,12),new THREE.MeshStandardMaterial({color:0x202a35,roughness:.6}));spine.position.z=-.04;folio.add(spine);
 // Fine cyan thread in the gutter, with the printed page left unaltered.
 const gutter=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,3.08,8),new THREE.MeshBasicMaterial({color:0x51dce8,transparent:true,opacity:.6}));gutter.position.z=.04;folio.add(gutter);
 const specks=new THREE.BufferGeometry(),positions=new Float32Array(80*3);for(let i=0;i<80;i++){positions[i*3]=(Math.sin(i*2.399)*(.5+i%7*.45));positions[i*3+1]=Math.cos(i*1.75)*2.7;positions[i*3+2]=Math.sin(i*.7)*1.5;}specks.setAttribute('position',new THREE.BufferAttribute(positions,3));const particles=new THREE.Points(specks,new THREE.PointsMaterial({color:0x82efff,size:.018,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(particles);
 let visible=true,px=0,py=0,lastTime=0;new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}).observe(root);
 const rect=()=>{const {width,height}=root.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.z=camera.aspect<1.2?10.6:8.9;camera.updateProjectionMatrix();};new ResizeObserver(rect).observe(root);rect();
 document.addEventListener('pointermove',e=>{if(reduced.matches||document.body.classList.contains('motion-paused'))return;px=(e.clientX/innerWidth-.5)*.2;py=(e.clientY/innerHeight-.5)*.16;},{passive:true});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();root.classList.remove('folio-loaded');});renderer.domElement.addEventListener('webglcontextrestored',()=>root.classList.add('folio-loaded'));
 function animate(ms){requestAnimationFrame(animate);if(!visible||document.hidden)return;const paused=reduced.matches||document.body.classList.contains('motion-paused');const t=paused?lastTime:ms*.001;lastTime=t;folio.rotation.x+=((-.28+py+Math.sin(t*.45)*.025)-folio.rotation.x)*.04;folio.rotation.y+=((-.2+px+Math.sin(t*.28)*.07)-folio.rotation.y)*.04;folio.rotation.z=.12+Math.sin(t*.32)*.025;folio.position.y=Math.sin(t*.6)*.055;particles.rotation.z=t*.02;
  for(const {mesh,base,side} of pages){const pos=mesh.geometry.attributes.position;for(let i=0;i<pos.count;i++){const x=base[i*3],y=base[i*3+1],u=Math.abs(x)/2.16;pos.setZ(i,base[i*3+2]+Math.pow(u,3)*.035*Math.sin(t*1.3+y*2+side));}pos.needsUpdate=true;mesh.geometry.computeVertexNormals();}
  renderer.render(scene,camera);
 }
 requestAnimationFrame(animate);
 window.addEventListener('pagehide',event=>{if(event.persisted)return;renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});textures.forEach(t=>t.dispose());},{once:true});
 }
}
