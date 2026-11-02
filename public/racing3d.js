const CDN="https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
const LIVERIES={falcon:0xf13b4f,vortex:0x2476e8,comet:0x8b55d8,titan:0x22a98b,blaze:0xf0a532};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const racersFrom=root=>{
 try{
  const value=JSON.parse(root.dataset.racers||"[]");
  return Array.isArray(value)?value.slice(0,32):[];
 }catch{return []}
};
function fallback(root){
 const canvas=root.querySelector("canvas");if(!canvas)return;
 const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)return;
 const racers=racersFrom(root),dpr=Math.min(2,window.devicePixelRatio||1);
 const resize=()=>{const w=Math.max(320,root.clientWidth),h=Math.max(300,root.clientHeight);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(dpr,0,0,dpr,0,0)};
 resize();const observer=new ResizeObserver(resize);observer.observe(root);
 let frame=0;
 const draw=()=>{
  if(!root.isConnected){observer.disconnect();return}
  const w=root.clientWidth,h=root.clientHeight,now=performance.now()*.001;
  ctx.fillStyle="#112d27";ctx.fillRect(0,0,w,h);
  ctx.fillStyle="#214b36";for(let i=0;i<18;i++){const x=(i*83+Math.sin(now+i)*13)%w,y=(i*53)%h;ctx.beginPath();ctx.arc(x,y,18+(i%4)*5,0,Math.PI*2);ctx.fill()}
  const cx=w*.5,cy=h*.55,rx=Math.min(w*.37,310),ry=Math.min(h*.31,175);
  ctx.save();ctx.translate(cx,cy);
  ctx.strokeStyle="#111820";ctx.lineWidth=Math.min(70,w*.13);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle="#e5e7eb";ctx.lineWidth=2;ctx.setLineDash([12,12]);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle="#f7f8fb";ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(0,0,rx-23,ry-23,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  const max=Math.max(1,...racers.map(p=>Number(p.score)||0));
  const sorted=racers.slice().sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0));
  sorted.forEach((p,i)=>{
   const progress=.03+(Number(p.score||0)/max)*.73+i*.0005,angle=-Math.PI*.5+progress*Math.PI*2;
   const x=cx+Math.cos(angle)*rx,y=cy+Math.sin(angle)*ry,livery=LIVERIES[p.loadout]||LIVERIES.falcon;
   ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);
   ctx.fillStyle="#05080d";ctx.fillRect(-15,-8,30,16);ctx.fillStyle="#fff";ctx.fillRect(-17,-11,8,4);ctx.fillRect(9,-11,8,4);
   ctx.fillStyle="#"+livery.toString(16).padStart(6,"0");ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(11,8);ctx.lineTo(0,14);ctx.lineTo(-11,8);ctx.closePath();ctx.fill();
   ctx.restore();
   ctx.font="700 11px system-ui";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.fillText((i+1)+" · "+String(p.nickname||"Racer").slice(0,14),x,y-22);
  });
  frame=requestAnimationFrame(draw);
 };
 draw();
 return ()=>{cancelAnimationFrame(frame);observer.disconnect()};
}
async function start(){
 let THREE;
 try{THREE=await import(CDN)}catch{document.querySelectorAll(".mj-racing-scene").forEach(fallback);new MutationObserver(()=>document.querySelectorAll(".mj-racing-scene:not([data-race-ready])").forEach(root=>{root.dataset.raceReady="1";fallback(root)})).observe(document.body,{childList:true,subtree:true});return}
 const active=new WeakMap();
 const makeMaterial=(color,roughness=.72,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const addBox=(parent,geometry,material,x,y,z,rx=0,ry=0,rz=0)=>{
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,rz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 };
 function ribbon(curve,width,y,colorSegments){
  const count=300,positions=[],colors=[],indices=[];
  const base=new THREE.Color(colorSegments.base),edge=new THREE.Color(colorSegments.edge);
  for(let i=0;i<=count;i++){
   const t=i/count,p=curve.getPointAt(t),tan=curve.getTangentAt(t).normalize(),normal=new THREE.Vector3(-tan.z,0,tan.x);
   for(const side of [-1,1]){
    const point=p.clone().addScaledVector(normal,side*width/2);positions.push(point.x,y,point.z);
    const c=colorSegments.strip&&i%10<2?edge:base;colors.push(c.r,c.g,c.b);
   }
   if(i<count){const a=i*2,b=a+1,c=a+2,d=a+3;indices.push(a,b,c,b,d,c)}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  return new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,side:THREE.DoubleSide}));
 }
 function createCourse(scene){
  const grass=makeMaterial(0x2f6749),asphalt=makeMaterial(0x252b32,.95),kerbRed=makeMaterial(0xf23c4b),kerbWhite=makeMaterial(0xf4f5f5),lineMat=new THREE.MeshBasicMaterial({color:0xe9e9e9});
  addBox(scene,new THREE.PlaneGeometry(240,200),grass,0,-.16,0,-Math.PI/2);
  const points=[
   [-18,-5],[-17,-16],[-9,-21],[2,-21],[15,-17],[22,-9],[23,2],[18,12],[10,18],[-1,18],[-12,14],[-21,7],[-23,-1]
  ].map(([x,z])=>new THREE.Vector3(x,0,z));
  const curve=new THREE.CatmullRomCurve3(points,true,"catmullrom",.22);
  const road=ribbon(curve,12,.05,{base:0x333940,edge:0x333940});road.material=asphalt;road.receiveShadow=true;scene.add(road);
  const outer=ribbon(curve,14,.045,{base:0xf23c4b,edge:0xf3f3f3,strip:true});outer.receiveShadow=true;scene.add(outer);
  const shoulder=ribbon(curve,11.9,.068,{base:0x343a41,edge:0x343a41});scene.add(shoulder);
  for(let i=0;i<160;i+=2){
   const p=curve.getPointAt(i/160),tan=curve.getTangentAt(i/160),normal=new THREE.Vector3(-tan.z,0,tan.x);
   const dash=addBox(scene,new THREE.BoxGeometry(.16,.018,1.3),lineMat,p.x,.09,p.z);
   dash.rotation.y=Math.atan2(tan.x,tan.z);
  }
  const curbMat=makeMaterial(0xf1f1f0),dark=makeMaterial(0x151b20);
  for(const side of [-1,1]){
   const edgePoints=[];
   for(let i=0;i<80;i++){const p=curve.getPointAt(i/80),tan=curve.getTangentAt(i/80),n=new THREE.Vector3(-tan.z,0,tan.x);p.addScaledVector(n,side*7.4);edgePoints.push(p)}
   edgePoints.forEach((p,i)=>{if(i%3!==0)return;const box=addBox(scene,new THREE.BoxGeometry(.68,.13,.8),(Math.floor(i/3)%2?curbMat:kerbRed),p.x,.12,p.z);const tan=curve.getTangentAt(i/80*3);box.rotation.y=Math.atan2(tan.x,tan.z)});
  }
  // Start/finish gantry, timing towers and perimeter barriers.
  const gantry=addBox(scene,new THREE.BoxGeometry(13,.42,.5),dark,0,6,-20);gantry.position.y=6;
  addBox(scene,new THREE.BoxGeometry(.3,6,.3),dark,-6.2,3,-20);addBox(scene,new THREE.BoxGeometry(.3,6,.3),dark,6.2,3,-20);
  const sign=addBox(scene,new THREE.BoxGeometry(8,1.25,.25),makeMaterial(0x25113f,.35,.3),0,5.15,-20);
  sign.castShadow=false;
  // Pit lane and pit buildings.
  addBox(scene,new THREE.BoxGeometry(17,.25,3.2),makeMaterial(0x454b53),-1,.02,-27);
  for(let i=0;i<5;i++){
   const wall=addBox(scene,new THREE.BoxGeometry(3.1,2.2,2.2),makeMaterial([0x3c4450,0x566172,0x3c4450][i%3]),-10+i*4,1.1,-30);
   addBox(scene,new THREE.BoxGeometry(2.7,.08,2.25),makeMaterial(i%2?0x6b36b2:0x16a2a2),-10+i*4,2.25,-30);
  }
  // Grandstands, spectators and animated flag poles.
  const standMat=makeMaterial(0x313848),seatMat=makeMaterial(0x786a9a);
  [[-31,-13,0],[31,-12,Math.PI],[0,29,Math.PI/2],[-2,-34,-Math.PI/2]].forEach(([x,z,rot],idx)=>{
   const stand=new THREE.Group();scene.add(stand);stand.position.set(x,.3,z);stand.rotation.y=rot;
   addBox(stand,new THREE.BoxGeometry(17,3,3),standMat,0,1.5,0);
   for(let row=0;row<5;row++)addBox(stand,new THREE.BoxGeometry(15,.22,.5),seatMat,0,2.9+row*.3,1.5-row*.34);
   for(let pole=0;pole<4;pole++){const flag=addBox(stand,new THREE.BoxGeometry(.08,3,.08),dark,-7+pole*4,5,0);addBox(stand,new THREE.BoxGeometry(1.25,.7,.06),makeMaterial([0xf23c4b,0xffffff,0x2476e8,0xf0a532][(idx+pole)%4]),-7+pole*4,5.9,0)}
  });
  // Trackside light masts and palms.
  const poleMat=makeMaterial(0x171d26,.4,.65),lampMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffe7b3,emissiveIntensity:1.8});
  for(let i=0;i<12;i++){
   const p=curve.getPointAt(i/12),tan=curve.getTangentAt(i/12),n=new THREE.Vector3(-tan.z,0,tan.x);
   for(const side of [-1,1]){
    const pos=p.clone().addScaledVector(n,side*11);
    addBox(scene,new THREE.CylinderGeometry(.06,.11,6,8),poleMat,pos.x,3,pos.z);
    const light=addBox(scene,new THREE.BoxGeometry(1.4,.14,.36),lampMat,pos.x,6.1,pos.z);
   }
  }
  const trees=makeMaterial(0x1d4c35),trunk=makeMaterial(0x735235);
  for(let i=0;i<28;i++){
   const angle=i/28*Math.PI*2,x=Math.cos(angle)*38,z=Math.sin(angle)*30;
   addBox(scene,new THREE.CylinderGeometry(.16,.24,2,7),trunk,x,1,z);
   const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.4,1),trees);crown.position.set(x,2.5,z);crown.castShadow=true;scene.add(crown);
  }
  return curve;
 }
 function createCar(scene,id,name,index){
  const color=LIVERIES[id]||LIVERIES.falcon,paint=new THREE.Color(color);
  const body= new THREE.MeshStandardMaterial({color,metalness:.58,roughness:.27});
  const bodyLight=new THREE.MeshStandardMaterial({color:paint.clone().multiplyScalar(1.2),metalness:.52,roughness:.24});
  const carbon=makeMaterial(0x141a22,.42,.72),rubber=makeMaterial(0x080b10,.94),silver=makeMaterial(0xabb7c4,.26,.85),glass=new THREE.MeshPhysicalMaterial({color:0x9ee4ff,metalness:.2,roughness:.08,transparent:true,opacity:.55,clearcoat:1});
  const car=new THREE.Group();car.userData.wheels=[];car.userData.name=name;car.userData.id=id;
  addBox(car,new THREE.BoxGeometry(1.2,.34,2.75),body,0,.48,-.05);
  const nose=new THREE.Mesh(new THREE.CylinderGeometry(.12,.5,2.6,5),bodyLight);nose.rotation.x=Math.PI/2;nose.position.set(0,.48,1.65);nose.castShadow=true;car.add(nose);
  addBox(car,new THREE.BoxGeometry(1.12,.28,1.45),body,0,.67,-.65);
  addBox(car,new THREE.BoxGeometry(.6,.32,.85),carbon,0,.75,-.45);
  addBox(car,new THREE.BoxGeometry(1.02,.18,.7),glass,0,.93,-.35);
  // Driver helmet and Halo safety hoop.
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),makeMaterial(0xffffff,.25,.15));helmet.position.set(0,1.12,-.2);helmet.castShadow=true;car.add(helmet);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.35,.045,8,26,Math.PI),silver);halo.rotation.z=Math.PI;halo.rotation.y=0;halo.position.set(0,1.18,-.35);car.add(halo);
  // Side pods, front and rear wing planes.
  for(const side of [-1,1]){
   addBox(car,new THREE.BoxGeometry(.52,.48,1.25),bodyLight,side*.72,.56,-.32);
   addBox(car,new THREE.BoxGeometry(.48,.1,1.35),carbon,side*.72,.32,-.3);
   const mirror=addBox(car,new THREE.BoxGeometry(.22,.13,.28),body,side*.86,.95,.3);
   mirror.rotation.y=side*.2;
  }
  addBox(car,new THREE.BoxGeometry(2.7,.13,.42),bodyLight,0,.34,2.25);
  for(const side of [-1,1])addBox(car,new THREE.BoxGeometry(.13,.42,.5),body,side*1.28,.48,2.25);
  addBox(car,new THREE.BoxGeometry(2.1,.16,.38),body,0,.98,-1.65);
  for(const side of [-1,1])addBox(car,new THREE.BoxGeometry(.14,.72,.45),body,side*.98,.82,-1.65);
  // Suspension wishbones and four exposed Pirelli-style tyres.
  const wheelPositions=[[-1.04,.42,1.45],[1.04,.42,1.45],[-1.04,.42,-1.22],[1.04,.42,-1.22]];
  wheelPositions.forEach(([x,y,z])=>{
   const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.3,28),rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(x,y,z);wheel.castShadow=true;car.add(wheel);car.userData.wheels.push(wheel);
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.315,20),silver);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);car.add(hub);
   const center=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.326,16),carbon);center.rotation.z=Math.PI/2;center.position.copy(wheel.position);car.add(center);
   const strut=addBox(car,new THREE.BoxGeometry(.055,.055,1.08),silver,x*.55,.52,z>0?.92:-.85,0,0,x>0?.24:-.24);
  });
  // Livery stripe and racing number.
  addBox(car,new THREE.BoxGeometry(.16,.025,2.35),makeMaterial(0xffffff,.3,.15),0,.84,.05);
  const group=new THREE.Group();group.position.set(0,1.28,-1.0);car.add(group);
  const badge=new THREE.Mesh(new THREE.BoxGeometry(.42,.32,.035),makeMaterial(0xffffff,.25,.2));group.add(badge);
  addBox(car,new THREE.BoxGeometry(.2,.1,.1),bodyLight,0,.8,-1.65);
  return car;
 }
 function nameSprite(THREE,name,rank){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=112;const ctx=canvas.getContext("2d");
  ctx.fillStyle="rgba(13,18,29,.88)";ctx.beginPath();ctx.roundRect(8,8,496,96,28);ctx.fill();
  ctx.fillStyle=rank===0?"#ffd46a":"#ffffff";ctx.font="bold 38px system-ui";ctx.fillText((rank+1)+"  "+String(name||"RACER").slice(0,17),28,69);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  sprite.scale.set(4.4,.96,1);return sprite;
 }
 function mount(root){
  if(active.has(root))return;
  const canvas=root.querySelector("canvas");if(!canvas)return;
  const racers=racersFrom(root);if(!racers.length){fallback(root);return}
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x8cc5dc);scene.fog=new THREE.Fog(0x8cc5dc,75,145);
  const camera=new THREE.PerspectiveCamera(43,1,.1,240);camera.position.set(39,42,49);camera.lookAt(0,0,0);
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"})}
  catch(error){root.dataset.raceReady="fallback";fallback(root);return}
  renderer.setPixelRatio(Math.min(1.7,window.devicePixelRatio||1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  scene.add(new THREE.HemisphereLight(0xd9f2ff,0x18301f,2.2));
  const sun=new THREE.DirectionalLight(0xfff4dd,3.2);sun.position.set(-35,65,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;scene.add(sun);
  const course=createCourse(scene);
  const sorted=racers.slice().sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0));
  const maxScore=Math.max(1,...sorted.map(p=>Number(p.score)||0));
  const cars=[];
  sorted.forEach((p,i)=>{
   const car=createCar(scene,p.loadout||"falcon",p.nickname,i);
   const label=nameSprite(THREE,p.nickname,i);car.add(label);label.position.set(0,2.5,0);
   scene.add(car);
   const fraction=.055+(Number(p.score||0)/maxScore)*.69;
   const lane=((i%3)-1)*1.45;
   cars.push({car,label,player:p,target:fraction,lane,index:i,progress:.025+((i%3)*.012)});
  });
  // Start gantry lamps and animated track lighting.
  const lampGroup=new THREE.Group();scene.add(lampGroup);
  for(let i=0;i<5;i++){const bulb=new THREE.Mesh(new THREE.SphereGeometry(.18,12,12),new THREE.MeshStandardMaterial({color:0xf22f45,emissive:0xf22f45,emissiveIntensity:2}));bulb.position.set(-4+i*2,6.5,-20);lampGroup.add(bulb)}
  const resize=()=>{if(!root.isConnected)return;const width=Math.max(320,root.clientWidth),height=Math.max(300,root.clientHeight);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()};
  const observer=new ResizeObserver(resize);observer.observe(root);resize();
  const state={frame:0,observer,renderer};
  const animate=()=>{
   if(!root.isConnected){cancelAnimationFrame(state.frame);observer.disconnect();renderer.dispose();active.delete(root);return}
   const now=performance.now()*.001;
   cars.forEach((entry)=>{
    entry.progress+=(entry.target-entry.progress)*.018;
    const at=course.getPointAt(clamp(entry.progress,0,.94)),tan=course.getTangentAt(clamp(entry.progress,0,.94)).normalize(),normal=new THREE.Vector3(-tan.z,0,tan.x);
    const offset=normal.clone().multiplyScalar(entry.lane);
    entry.car.position.set(at.x+offset.x,.12,at.z+offset.z);
    entry.car.rotation.y=Math.atan2(tan.x,tan.z);
    entry.car.userData.wheels.forEach(w=>{w.rotation.x+=.06});
    entry.label.material.opacity=1;
   });
   lampGroup.children.forEach((light,i)=>{light.material.emissiveIntensity=1.3+Math.sin(now*3+i)*.45});
   renderer.render(scene,camera);state.frame=requestAnimationFrame(animate);
  };
  active.set(root,state);root.dataset.raceReady="1";animate();
 }
 const scan=()=>document.querySelectorAll(".mj-racing-scene").forEach(mount);
 scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
}
start();