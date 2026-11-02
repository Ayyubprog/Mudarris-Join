const CDN="https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
const cars={falcon:0xef4b55,vortex:0x4e83e8,comet:0x8e62d2,titan:0x4da98a,blaze:0xdf963b};
const lanePositions=[-4.25,-1.4,1.4,4.25];
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function mountDriveControls(root){
 if(root.dataset.driveControls==="ready")return root._mjDriveControls;
 root.dataset.driveControls="ready";root.tabIndex=0;
 root.setAttribute("role","group");
 root.setAttribute("aria-label","3D poyga boshqaruvi. Chap va o‘ng strelkalar bilan buriling, Space bilan turbo, pastga strelka bilan tormoz.");
 const controls={left:false,right:false,boost:false,brake:false,lane:0,hits:0,lastHit:0,nitro:100,speed:0};
 root._mjDriveControls=controls;
 const ui=document.createElement("div");ui.className="mj-race-drive-ui";
 ui.innerHTML='<span class="mj-race-drive-tip">A / D yoki ← / → · PROBEL = TEZLASHISH</span><span class="mj-race-drive-feedback" aria-live="polite">TAYYOR</span><div class="mj-race-telemetry"><strong data-race-speed>0</strong><small>KM/SOAT</small><div><span>NITRO</span><i><b data-race-nitro style="width:100%"></b></i></div></div>';root.append(ui);
 const touch=document.createElement("div");touch.className="mj-race-touch-controls";
 touch.innerHTML='<div class="mj-race-touch-group"><button type="button" class="mj-race-touch-button" data-drive="left" aria-label="Chapga burilish">◀</button><button type="button" class="mj-race-touch-button" data-drive="right" aria-label="O‘ngga burilish">▶</button></div><div class="mj-race-touch-group"><button type="button" class="mj-race-touch-button" data-drive="brake" aria-label="Tormoz">TORMOZ</button><button type="button" class="mj-race-touch-button" data-drive="boost" aria-label="Turbo">TEZLA</button></div>';
 root.append(touch);
 const feedback=ui.querySelector(".mj-race-drive-feedback");
 controls.setFeedback=value=>{feedback.textContent=value};
 controls.setTelemetry=(speed,nitro)=>{const speedNode=ui.querySelector("[data-race-speed]"),nitroNode=ui.querySelector("[data-race-nitro]");if(speedNode)speedNode.textContent=Math.round(speed);if(nitroNode)nitroNode.style.width=nitro+"%"};
 const syncFallback=()=>controls.updateFallback?.();
 const keys={ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",Space:"boost",ArrowDown:"brake",KeyS:"brake",ShiftLeft:"boost",ShiftRight:"boost"};
 const onKeyDown=event=>{
  if(!root.contains(document.activeElement))return;
  const action=keys[event.code];if(!action)return;event.preventDefault();controls[action]=true;
  touch.querySelector('[data-drive="'+action+'"]')?.classList.add("is-pressed");
  if(!root.classList.contains("has-webgl")&&(action==="left"||action==="right"))controls.lane=clamp(controls.lane+(action==="left"?-.16:.16),-.92,.92);
  syncFallback();
 };
 const onKeyUp=event=>{
  const action=keys[event.code];if(!action)return;controls[action]=false;
  touch.querySelector('[data-drive="'+action+'"]')?.classList.remove("is-pressed");syncFallback();
 };
 const onBlur=()=>{controls.left=controls.right=controls.boost=controls.brake=false;touch.querySelectorAll(".is-pressed").forEach(button=>button.classList.remove("is-pressed"));syncFallback()};
 const focus=()=>{try{root.focus({preventScroll:true})}catch{root.focus()}};
 root.addEventListener("pointerdown",event=>{if(!event.target.closest(".mj-race-touch-button"))focus()},{passive:true});
 root.addEventListener("keydown",onKeyDown);window.addEventListener("keyup",onKeyUp);window.addEventListener("blur",onBlur);
 touch.querySelectorAll("[data-drive]").forEach(button=>{
  const action=button.dataset.drive;
  const down=event=>{
   event.preventDefault();event.stopPropagation();controls[action]=true;
   if(!root.classList.contains("has-webgl")&&(action==="left"||action==="right"))controls.lane=clamp(controls.lane+(action==="left"?-.16:.16),-.92,.92);
   button.classList.add("is-pressed");focus();syncFallback();
  };
  const up=event=>{event.preventDefault();controls[action]=false;button.classList.remove("is-pressed");syncFallback()};
  button.addEventListener("pointerdown",down);
  ["pointerup","pointercancel","pointerleave"].forEach(type=>button.addEventListener(type,up));
  button.addEventListener("contextmenu",event=>event.preventDefault());
 });
 controls.cleanup=()=>{
  root.removeEventListener("keydown",onKeyDown);window.removeEventListener("keyup",onKeyUp);window.removeEventListener("blur",onBlur);
  root.querySelector(".mj-race-drive-ui")?.remove();root.querySelector(".mj-race-touch-controls")?.remove();
 };
 return controls;
}

async function start(){
 const active=new WeakMap();let THREE=null;
 try{THREE=await import(CDN)}catch{}
 function addFallback(root){
  const controls=mountDriveControls(root),player=root.querySelector(".player-car");if(!player)return;
  controls.updateFallback=()=>{player.style.left="calc(50% + "+(controls.lane*5)+"px - 20px)";player.style.filter=controls.boost?"drop-shadow(0 0 14px #ffe05c)":""};
  controls.updateFallback();active.set(root,{fallback:true,controls});
 }
 function addCar(scene,id,x,z,player=false){
  const group=new THREE.Group(),color=cars[id]||cars.falcon;group.userData.wheels=[];
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
   const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.27,20),wheelMat);
   wheel.rotation.z=Math.PI/2;wheel.position.set(wx*1.02,.42,wz);wheel.castShadow=true;group.add(wheel);
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.29,16),hubMat);
   hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);group.add(hub);
   group.userData.wheels.push(wheel,hub);
  }
  const spoiler=new THREE.Mesh(new THREE.BoxGeometry(2.05,.12,.28),new THREE.MeshStandardMaterial({color:0x202b40,metalness:.4,roughness:.3}));
  spoiler.position.set(0,1.25,-1.62);group.add(spoiler);
  const lightMat=new THREE.MeshStandardMaterial({color:0xfff1b2,emissive:0xffd45b,emissiveIntensity:1.2});
  for(const lx of [-.62,.62]){const light=new THREE.Mesh(new THREE.BoxGeometry(.34,.14,.05),lightMat);light.position.set(lx,.77,1.78);group.add(light)}
  group.position.set(x,0,z);group.scale.setScalar(player?1.05:.84);scene.add(group);return group;
 }
 function createWorld(root){
  if(active.has(root))return;
  const controls=mountDriveControls(root);
  if(!THREE){addFallback(root);return}
  const canvas=document.createElement("canvas");canvas.className="mj-race-webgl";canvas.tabIndex=0;canvas.setAttribute("aria-label","3D poyga yo‘lagi");root.prepend(canvas);
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"low-power"})}
  catch{canvas.remove();addFallback(root);return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.55));renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
  const world=new THREE.Scene();world.background=new THREE.Color(0x91d5f6);world.fog=new THREE.Fog(0x91d5f6,48,145);
  const camera=new THREE.PerspectiveCamera(48,1,.1,220);camera.position.set(0,9,19);camera.lookAt(0,0,-13);
  world.add(new THREE.HemisphereLight(0xe8f8ff,0x597a58,2.1));
  const sun=new THREE.DirectionalLight(0xfff1d5,2.7);sun.position.set(-13,24,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);world.add(sun);
  const grass=new THREE.Mesh(new THREE.PlaneGeometry(170,220),new THREE.MeshStandardMaterial({color:0x6fae75,roughness:1}));
  grass.rotation.x=-Math.PI/2;grass.position.set(0,-.16,-70);grass.receiveShadow=true;world.add(grass);
  const road=new THREE.Mesh(new THREE.PlaneGeometry(13,220),new THREE.MeshStandardMaterial({color:0x343d4e,roughness:.92}));
  road.rotation.x=-Math.PI/2;road.position.set(0,0,-70);road.receiveShadow=true;world.add(road);
  const edgeMat=new THREE.MeshStandardMaterial({color:0xf3f5f7,roughness:.8}),railMat=new THREE.MeshStandardMaterial({color:0xe64b55,roughness:.65});
  for(const side of [-1,1]){
   const edge=new THREE.Mesh(new THREE.BoxGeometry(.22,.12,220),edgeMat);edge.position.set(side*6.35,.09,-70);world.add(edge);
   const rail=new THREE.Mesh(new THREE.BoxGeometry(.24,.65,220),railMat);rail.position.set(side*6.65,.35,-70);world.add(rail);
  }
  const laneMat=new THREE.MeshStandardMaterial({color:0xf9f6dc,emissive:0x333322});
  const roadMarks=[];
  for(const x of [-2.15,2.15])for(let i=0;i<34;i++){
   const dash=new THREE.Mesh(new THREE.BoxGeometry(.1,.025,2.1),laneMat);dash.position.set(x,.025,-i*6-3);world.add(dash);roadMarks.push(dash);
  }
  const hillMat=[0x5c9a79,0x78ad85,0x4d8c70];
  for(let i=0;i<14;i++){
   const side=i%2?1:-1,z=-i*11-8;
   const hill=new THREE.Mesh(new THREE.ConeGeometry(7+(i%3)*2,12+(i%4)*3,5),new THREE.MeshStandardMaterial({color:hillMat[i%3],roughness:1}));
   hill.position.set(side*(13+(i%3)*4),4,z);hill.scale.z=1.7;world.add(hill);
   for(let t=0;t<2;t++){
    const tree=new THREE.Group(),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.23,1.3,7),new THREE.MeshStandardMaterial({color:0x79533c}));
    trunk.position.y=.65;tree.add(trunk);
    const crown=new THREE.Mesh(new THREE.ConeGeometry(.9,2.4,7),new THREE.MeshStandardMaterial({color:i%2?0x2e7954:0x3c875c}));
    crown.position.y=2.2;tree.add(crown);tree.position.set(side*(8.7+t*1.8),0,z-t*5);world.add(tree);
   }
  }
  const obstacleMats=[new THREE.MeshStandardMaterial({color:0xf0a33c}),new THREE.MeshStandardMaterial({color:0xe84c54}),new THREE.MeshStandardMaterial({color:0x54a6d8})];
  const obstacles=[];
  for(let i=0;i<8;i++){
   const lane=lanePositions[(i*3+1)%lanePositions.length];
   const obstacle=new THREE.Mesh(i%2===0?new THREE.CylinderGeometry(.45,.58,1.2,12):new THREE.ConeGeometry(.55,1.4,10),obstacleMats[i%obstacleMats.length]);
   obstacle.position.set(lane,.68,-9-i*7.6);obstacle.castShadow=true;world.add(obstacle);obstacles.push(obstacle);
  }
  const playerCar=addCar(world,root.dataset.loadout,0,7,true);
  const rivalData=(root.dataset.rivals||"vortex:0,comet:0").split(",").filter(Boolean).map(value=>{const [id,score]=value.split(":");return {id,score:Number(score)||0}});
  const rivalCars=rivalData.map((item,i)=>addCar(world,item.id,lanePositions[i%lanePositions.length],-2-i*5));
  const finish=new THREE.Group();
  for(let i=0;i<11;i++){const block=new THREE.Mesh(new THREE.BoxGeometry(1.2,.2,.2),new THREE.MeshStandardMaterial({color:i%2?0x20283a:0xffffff}));block.position.set(-6+i*1.2,.08,-48);finish.add(block)}
  world.add(finish);
  const size=()=>{const w=Math.max(1,root.clientWidth),h=Math.max(1,root.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
  size();const observer=new ResizeObserver(size);
  observer.observe(root);
  const state={renderer,world,camera,playerCar,rivalCars,observer,frame:0,root,controls,obstacles,roadMarks,lastFrame:0};
  active.set(root,state);root.classList.add("has-webgl");
  const animate=()=>{
   if(!root.isConnected){observer.disconnect();renderer.dispose();active.delete(root);controls.cleanup?.();return}
   const slow=controls.brake||root.classList.contains("is-slow");
   const target=clamp(Number(root.dataset.progress)||12,0,100),now=performance.now()*.001;
   const delta=Math.min(.04,state.lastFrame?now-state.lastFrame:.016);state.lastFrame=now;
   const requestedBoost=controls.boost&&controls.nitro>0;
   if(requestedBoost)controls.nitro=Math.max(0,controls.nitro-delta*27);else controls.nitro=Math.min(100,controls.nitro+delta*9);
   const boost=requestedBoost||root.classList.contains("is-boost");
   const targetSpeed=slow?54:boost?245:145;controls.speed+=(targetSpeed-controls.speed)*Math.min(1,delta*3.5);
   controls.setTelemetry?.(controls.speed,controls.nitro);
   const steering=(controls.right?1:0)-(controls.left?1:0);
   controls.lane=clamp(controls.lane+steering*delta*2.9,-.92,.92);
   if(!steering)controls.lane*=Math.pow(.12,delta);
   playerCar.position.z=6-target*.28+(boost?2.1:0)-(slow?1.1:0);
   playerCar.position.x=controls.lane*4.15;
   playerCar.rotation.y=-steering*.12-controls.lane*.035;playerCar.rotation.z=-steering*.055;
   playerCar.userData.wheels.forEach(wheel=>{wheel.rotation.x+=delta*(boost?8:4)});
   camera.position.x+=(playerCar.position.x*.22-camera.position.x)*Math.min(1,delta*2.8);
   camera.lookAt(playerCar.position.x*.16,0,-13);
   const leaderScore=Math.max(1,Number(root.dataset.leaderScore)||1);
   rivalCars.forEach((car,i)=>{
    const ratio=clamp(rivalData[i].score/leaderScore,0,1);
    car.position.z=4-ratio*15-i*1.3+Math.sin(now*1.2+i)*.45;
    car.position.x=lanePositions[i%lanePositions.length]+Math.sin(now*.5+i)*.12;
    car.rotation.y=Math.sin(now*.6+i)*.025;
   });
   const trafficSpeed=boost?13:slow?4.5:8.5;
   roadMarks.forEach(mark=>{mark.position.z+=delta*trafficSpeed;if(mark.position.z>playerCar.position.z+5)mark.position.z-=205});
   let collision=false;
   obstacles.forEach((obstacle,i)=>{
    obstacle.rotation.y=now*.6+i;obstacle.position.z+=delta*trafficSpeed;
    if(obstacle.position.z>playerCar.position.z+2){obstacle.position.z=playerCar.position.z-62-i*2;obstacle.position.x=lanePositions[(i+controls.hits)%lanePositions.length]}
    if(Math.abs(obstacle.position.z-playerCar.position.z)<1.45&&Math.abs(obstacle.position.x-playerCar.position.x)<1.18){collision=true;obstacle.position.z=playerCar.position.z-70-i*2}
   });
   if(collision&&now-controls.lastHit>.7){
    controls.lastHit=now;controls.hits++;controls.setFeedback("TO‘SIQ! ×"+controls.hits);
    root.classList.remove("is-hit");void root.offsetWidth;root.classList.add("is-hit");
   }else if(!collision&&now-controls.lastHit>1.3&&!boost&&!slow)controls.setFeedback("O‘RIN "+(Number(root.dataset.rank||0)+1));
   renderer.render(world,camera);state.frame=requestAnimationFrame(animate);
  };
  animate();
 }
 const scan=()=>document.querySelectorAll(".mj-racing-scene").forEach(createWorld);
 scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
}
start();
