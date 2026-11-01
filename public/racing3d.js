const CDN="https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
const cars={falcon:0xef4b55,vortex:0x4e83e8,comet:0x8e62d2,titan:0x4da98a,blaze:0xdf963b};
async function start(){
 let THREE;
 try{THREE=await import(CDN)}catch{return}
 const active=new WeakMap();
 function addCar(scene,id,x,z,player=false){
  const group=new THREE.Group(),color=cars[id]||cars.falcon;
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.9,.52,3.5),new THREE.MeshStandardMaterial({color,metalness:.42,roughness:.35}));
  body.position.y=.72;body.castShadow=true;group.add(body);
  const hood=new THREE.Mesh(new THREE.BoxGeometry(1.72,.22,1.05),new THREE.MeshStandardMaterial({color:new THREE.Color(color).multiplyScalar(1.12),metalness:.45,roughness:.3}));
  hood.position.set(0,1.02,.92);group.add(hood);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.38,.72,1.55),new THREE.MeshStandardMaterial({color:0x9bdaf1,metalness:.15,roughness:.18,transparent:true,opacity:.9}));
  cabin.position.set(0,1.27,-.38);group.add(cabin);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.32,.09,1.45),new THREE.MeshStandardMaterial({color:0x26334a,metalness:.25,roughness:.4}));
  roof.position.set(0,1.67,-.38);group.add(roof);
  const wheelMat=new THREE.MeshStandardMaterial({color:0x172033,roughness:.8}),hubMat=new THREE.MeshStandardMaterial({color:0xc9d3e4,metalness:.75,roughness:.25});
  for(const wx of [-1,1])for(const wz of [-1.05,1.05]){
   const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.27,20),wheelMat);wheel.rotation.z=Math.PI/2;wheel.position.set(wx*1.02,.42,wz);wheel.castShadow=true;group.add(wheel);
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.29,16),hubMat);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);group.add(hub);
  }
  const spoiler=new THREE.Mesh(new THREE.BoxGeometry(2.05,.12,.28),new THREE.MeshStandardMaterial({color:0x202b40,metalness:.4,roughness:.3}));
  spoiler.position.set(0,1.25,-1.62);group.add(spoiler);
  const lightMat=new THREE.MeshStandardMaterial({color:0xfff1b2,emissive:0xffd45b,emissiveIntensity:1.2});
  for(const lx of [-.62,.62]){const light=new THREE.Mesh(new THREE.BoxGeometry(.34,.14,.05),lightMat);light.position.set(lx,.77,1.78);group.add(light)}
  group.position.set(x,0,z);group.scale.setScalar(player?1.05:.84);scene.add(group);return group;
 }
 function createWorld(root){
  if(active.has(root))return;
  const canvas=document.createElement("canvas");canvas.className="mj-race-webgl";canvas.setAttribute("aria-label","3D poyga yo‘lagi");
  root.prepend(canvas);
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"low-power"})}catch{canvas.remove();return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const world=new THREE.Scene();world.background=new THREE.Color(0x91d5f6);world.fog=new THREE.Fog(0x91d5f6,48,145);
  const camera=new THREE.PerspectiveCamera(48,1,.1,220);camera.position.set(0,9,19);camera.lookAt(0,0,-13);
  world.add(new THREE.HemisphereLight(0xe8f8ff,0x597a58,2.1));
  const sun=new THREE.DirectionalLight(0xfff1d5,2.7);sun.position.set(-13,24,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);world.add(sun);
  const grass=new THREE.Mesh(new THREE.PlaneGeometry(170,220),new THREE.MeshStandardMaterial({color:0x6fae75,roughness:1}));grass.rotation.x=-Math.PI/2;grass.position.set(0,-.16,-70);grass.receiveShadow=true;world.add(grass);
  const road=new THREE.Mesh(new THREE.PlaneGeometry(13,220),new THREE.MeshStandardMaterial({color:0x343d4e,roughness:.92}));road.rotation.x=-Math.PI/2;road.position.set(0,0,-70);road.receiveShadow=true;world.add(road);
  const edgeMat=new THREE.MeshStandardMaterial({color:0xf3f5f7,roughness:.8}),railMat=new THREE.MeshStandardMaterial({color:0xe64b55,roughness:.65});
  for(const side of [-1,1]){
   const edge=new THREE.Mesh(new THREE.BoxGeometry(.22,.12,220),edgeMat);edge.position.set(side*6.35,.09,-70);world.add(edge);
   const rail=new THREE.Mesh(new THREE.BoxGeometry(.24,.65,220),railMat);rail.position.set(side*6.65,.35,-70);world.add(rail);
  }
  const laneMat=new THREE.MeshStandardMaterial({color:0xf9f6dc,emissive:0x333322});
  for(const x of [-2.15,2.15])for(let i=0;i<34;i++){
   const dash=new THREE.Mesh(new THREE.BoxGeometry(.1,.025,2.1),laneMat);dash.position.set(x,.025,-i*6-3);world.add(dash);
  }
  const hillMat=[0x5c9a79,0x78ad85,0x4d8c70];
  for(let i=0;i<14;i++){
   const side=i%2?1:-1,z=-i*11-8;
   const hill=new THREE.Mesh(new THREE.ConeGeometry(7+(i%3)*2,12+(i%4)*3,5),new THREE.MeshStandardMaterial({color:hillMat[i%3],roughness:1}));
   hill.position.set(side*(13+(i%3)*4),4,z);hill.scale.z=1.7;world.add(hill);
   for(let t=0;t<2;t++){
    const tree=new THREE.Group(),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.23,1.3,7),new THREE.MeshStandardMaterial({color:0x79533c}));trunk.position.y=.65;tree.add(trunk);
    const crown=new THREE.Mesh(new THREE.ConeGeometry(.9,2.4,7),new THREE.MeshStandardMaterial({color:i%2?0x2e7954:0x3c875c}));crown.position.y=2.2;tree.add(crown);tree.position.set(side*(8.7+t*1.8),0,z-t*5);world.add(tree);
   }
  }
  const playerCar=addCar(world,root.dataset.loadout,0,7,true),rivalIds=(root.dataset.rivals||"vortex,comet").split(",").filter(Boolean);
  const rivalCars=[addCar(world,rivalIds[0]||"vortex",-3.4,-1),addCar(world,rivalIds[1]||"comet",3.4,-12),addCar(world,rivalIds[2]||"titan",0,-22)];
  const finish=new THREE.Group();
  for(let i=0;i<11;i++){const block=new THREE.Mesh(new THREE.BoxGeometry(1.2,.2,.2),new THREE.MeshStandardMaterial({color:i%2?0x20283a:0xffffff}));block.position.set(-6+i*1.2,.08,-48);finish.add(block)}
  world.add(finish);
  const size=()=>{const w=Math.max(1,root.clientWidth),h=Math.max(1,root.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
  size();const observer=new ResizeObserver(size);observer.observe(root);
  const state={renderer,world,camera,playerCar,rivalCars,observer,frame:0,root};active.set(root,state);root.classList.add("has-webgl");
  const animate=()=>{
   if(!root.isConnected){observer.disconnect();renderer.dispose();active.delete(root);return}
   const boost=root.classList.contains("is-boost"),slow=root.classList.contains("is-slow"),target=Math.max(0,Math.min(100,Number(root.dataset.progress)||12));
   const now=performance.now()*.001;
   playerCar.position.z=7-(target*.12)+(boost?2:0)-(slow?1:0);
   playerCar.position.x=Math.sin(now*.45)*.12;
   playerCar.rotation.y=Math.sin(now*.7)*.025;
   rivalCars.forEach((car,i)=>{car.position.z=-1-i*10+Math.sin(now*1.2+i)*.6;car.position.x=(i===0?-3.4:i===1?3.4:0)+Math.sin(now*.5+i)*.18});
   renderer.render(world,camera);state.frame=requestAnimationFrame(animate);
  };
  animate();
 }
 const scan=()=>document.querySelectorAll(".mj-racing-scene").forEach(createWorld);
 scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
}
start();
