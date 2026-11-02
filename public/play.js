(()=>{
const $=s=>document.querySelector(s),root=$("#play-root"),pin=new URLSearchParams(location.search).get("pin")||"";
let player=null,data=null,lastQuestion=-2,answered=-1,timer=null,lastScreen="";
function avatarIcon(key){return window.MJAvatars?MJAvatars.render(key,"mj-avatar-art"):"🙂"}
const loadoutCatalog={
 shooter:[
  {id:"ranger",name:"Cho‘l qo‘riqchisi",icon:"🤠",tone:"#d49a42",desc:"Aniq nishon oluvchi"},
  {id:"cyber",name:"Neon jangchi",icon:"🦾",tone:"#5a9de8",desc:"Texno zirh"},
  {id:"knight",name:"Temir ritsar",icon:"🛡️",tone:"#a7aebc",desc:"Mustahkam himoya"},
  {id:"ninja",name:"Soya ninja",icon:"🥷",tone:"#8c65c9",desc:"Tezkor va chaqqon"},
  {id:"pilot",name:"Osmon uchuvchisi",icon:"🧑‍🚀",tone:"#51bca8",desc:"Maxsus jihozlar"}
 ],
 racing:[
  {id:"falcon",name:"APEX GP 01",icon:"🏎️",tone:"#ef4b55",desc:"Keskin va tezkor"},
  {id:"vortex",name:"VORTEX R",icon:"🏎️",tone:"#4e83e8",desc:"Barqaror boshqaruv"},
  {id:"comet",name:"COMET 09",icon:"🏎️",tone:"#8e62d2",desc:"Yengil aerodinamika"},
  {id:"titan",name:"TITAN RS",icon:"🏎️",tone:"#4da98a",desc:"Kuchli tezlanish"},
  {id:"blaze",name:"BLAZE X",icon:"🏎️",tone:"#df963b",desc:"Yuqori tezlik"}
 ]
};
const loadoutFor=(mode,id)=>(loadoutCatalog[mode]||[]).find(item=>item.id===id)||null;
function loadoutVisual(mode,id){
 const colors={ranger:"#d49a42",cyber:"#5a9de8",knight:"#a7aebc",ninja:"#8c65c9",pilot:"#51bca8",falcon:"#ef4b55",vortex:"#2476e8",comet:"#8e55d8",titan:"#22a98b",blaze:"#f0a532"},color=colors[id]||"#6b70a8";
 if(mode==="racing")return '<svg class="mj-loadout-svg mj-car-svg mj-f1-car-svg" viewBox="0 0 180 108" role="img" aria-label="Formula poyga mashinasi"><ellipse cx="90" cy="93" rx="72" ry="8" fill="#14233b33"/><path d="M13 67h26l10-18 23-7h42l24 8 17 17h12v10h-27l-8-9H49l-8 9H13Z" fill="'+color+'" stroke="#192539" stroke-width="3" stroke-linejoin="round"/><path d="m69 46 9-21h25l12 22-13 10H73Z" fill="#9eddf4" stroke="#192539" stroke-width="3"/><path d="M79 26q14-8 26 0" fill="none" stroke="#fff" stroke-width="3"/><path d="M46 48 26 42l-14 6v8h32m91-9 22-7 16 8v8h-32" fill="none" stroke="#172238" stroke-width="6" stroke-linejoin="round"/><path d="M12 80h42v5H12zm113 0h43v5h-43z" fill="#e8edf4" stroke="#172238" stroke-width="2"/><path d="M55 56h69" stroke="#fff" stroke-width="4" opacity=".8"/><path d="M90 58v15" stroke="#18243a" stroke-width="4"/><g fill="#101722" stroke="#8794a8" stroke-width="3"><circle cx="48" cy="76" r="15"/><circle cx="133" cy="76" r="15"/></g><g fill="#c9d4e0"><circle cx="48" cy="76" r="5"/><circle cx="133" cy="76" r="5"/></g><path d="M70 67 79 60h22l10 7" fill="none" stroke="#fff" stroke-width="3" opacity=".82"/></svg>';
 const visor=id==="ninja"?"<path d='M39 31q31-18 62 0l-5 12H44Z' fill='#1c2138'/>":id==="knight"?"<path d='m40 34 30-21 30 21-7 20H47Z' fill='#cbd3df' stroke='#39445a' stroke-width='3'/>":id==="pilot"?"<path d='M40 31q30-28 60 0v18H40Z' fill='#c3f2ff' stroke='#31536b' stroke-width='3'/>":id==="cyber"?"<path d='M39 34q30-23 62 0v18H39Z' fill='#202b46' stroke='#7de8ff' stroke-width='3'/>":"<path d='M35 37q35-27 70 0l-8 10H43Z' fill='#a66a2c' stroke='#603d28' stroke-width='3'/>";
 return '<svg class="mj-loadout-svg mj-hero-svg" viewBox="0 0 120 132" role="img" aria-label="Jangchi"><ellipse cx="60" cy="123" rx="35" ry="6" fill="#1d2b4533"/><path d="M27 116q-5-32 9-47 9-10 24-10t24 10q14 15 9 47Z" fill="'+color+'" stroke="#25334c" stroke-width="3"/><path d="M44 78q16 10 32 0l7 35H37Z" fill="#25334c" opacity=".18"/><circle cx="60" cy="45" r="29" fill="#d99b70" stroke="#704a42" stroke-width="3"/>'+visor+'<path d="M47 48h3m20 0h3" stroke="#202b3d" stroke-width="4" stroke-linecap="round"/><path d="M52 61q8 6 16 0" fill="none" stroke="#77473d" stroke-width="2.5" stroke-linecap="round"/><path d="M31 89 17 108l13 7 17-21m42-5 14 19-13 7-17-21" fill="'+color+'" stroke="#25334c" stroke-width="3" stroke-linejoin="round"/><path d="M46 116v8m28-8v8" stroke="#25334c" stroke-width="7" stroke-linecap="round"/></svg>';
}
const loadoutCard=(mode,item,selected)=>'<button type="button" class="mj-loadout-card '+(selected?"is-selected":"")+'" data-loadout="'+item.id+'" aria-pressed="'+selected+'" style="--loadout-tone:'+item.tone+'"><span class="mj-loadout-art">'+loadoutVisual(mode,item.id)+'</span><strong>'+item.name+'</strong><small>'+item.desc+'</small>'+(selected?'<i>✓</i>':"")+'</button>';

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(path,opts){const r=await fetch("/api/"+path,opts||{}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"So‘rov bajarilmadi");return d}
function showJoin(){
 if(lastScreen==="join")return;
 lastScreen="join";
 let joiningAvatar=MJAvatars.randomKey();
 const mode=data?.session?.mode||"classic",options=loadoutCatalog[mode]||[];
 let selectedLoadout=options[0]?.id||"";
 const isShooter=mode==="shooter",isRacing=mode==="racing";
 const modeTitle=isShooter?"JANGCHI TANLA":isRacing?"MASHINA TANLA":"TAXALLUS VA QAHRAMON";
 const modeCopy=isShooter?"Jangchingni tanla. To‘g‘ri javoblar bilan raqiblarni yeng!":isRacing?"Mashinangni tanla. Savollarga javob berib, raqiblaringdan o‘zib ket!":"Ismingni va o‘zing yoqtirgan qahramonni tanla.";
 root.innerHTML='<section class="student-card mj-onboard-v2"><div class="mj-onboard-top"><span class="mj-onboard-brand"><img src="/mudarris-book-purple.svg" alt=""> MUDARRIS <b>JOIN</b></span><span class="mj-onboard-step">1 <i>/</i> 1</span></div>'+
 '<div class="mj-onboard-content"><div class="mj-onboard-copy"><span class="mj-onboard-kicker">JONLI O‘YINGA QO‘SHILISH</span><h1 class="mj-onboard-title">O‘yinga xush kelibsan!</h1><p class="mj-onboard-subtitle">'+modeCopy+'</p><label class="mj-onboard-label" for="nickname">SENING TAXALLUSING</label><input class="mj-onboard-name" id="nickname" maxlength="24" minlength="2" required placeholder="Masalan, Ayyub" autocomplete="nickname"><div class="mj-onboard-name-help">2–24 belgi · Sinfdoshlaring seni shu nom bilan ko‘radi</div><div class="mj-onboard-error" id="join-error" role="alert" aria-live="polite"></div></div>'+
 '<div class="mj-onboard-preview"><div class="mj-onboard-preview-glow"></div><div class="mj-onboard-preview-art">'+(isShooter||isRacing?'<span class="mj-onboard-mode-emoji">'+(isShooter?"🎯":"🏁")+'</span>':'<span id="join-avatar-large">'+MJAvatars.render(joiningAvatar,"mj-onboard-avatar")+'</span>')+'</div><span class="mj-onboard-preview-tag">'+(isShooter?"JANG MAYDONI":isRacing?"AVTOMOBIL POYGASI":"SENING QAHRAMONING")+'</span><strong>'+(isShooter?"Jangga tayyorlan!":isRacing?"Start chizig‘iga!":"Qahramoning tayyor!")+'</strong><small>'+(isShooter?"Jangchi va qiyofangni tanla.":isRacing?"Mashina va qiyofangni tanla.":"Qahramon va aksessuaringni sozla.")+'</small></div></div>'+
 '<div class="mj-onboard-avatar-picker"><span class="mj-onboard-avatar-art" id="join-avatar-art">'+MJAvatars.render(joiningAvatar,"mj-avatar-art")+'</span><span class="mj-onboard-avatar-copy"><strong id="join-avatar-name">'+MJAvatars.parts(joiningAvatar).head.name+'</strong><small id="join-avatar-kind">ODDIY QAHRAMON · AKSESSUAR TANLANG</small></span><button type="button" id="edit-join-avatar">SOZLASH</button><button type="button" id="random-join-avatar" aria-label="Tasodifiy qahramon">🎲</button></div>'+
 (options.length?'<section class="mj-loadout-section"><div class="mj-loadout-heading"><div><span>'+modeTitle+'</span><small>'+modeCopy+'</small></div><b>'+options.length+' TA</b></div><div class="mj-loadout-grid">'+options.map(item=>loadoutCard(mode,item,item.id===selectedLoadout)).join("")+'</div></section>':'')+
 '<form id="join-player" class="mj-onboard-footer"><span class="mj-onboard-secure">✓ Akkaunt ochish shart emas</span><button class="mj-onboard-submit" type="submit"><span>O‘YINGA KIRISH</span><b>→</b></button></form></section>';
 const nameInput=$("#nickname");nameInput.focus({preventScroll:true});
 const updateAvatar=()=>{
  const parts=MJAvatars.parts(joiningAvatar),strip=$("#join-avatar-art"),large=$("#join-avatar-large");
  if(strip)strip.innerHTML=MJAvatars.render(joiningAvatar,"mj-avatar-art");
  if(large)large.innerHTML=MJAvatars.render(joiningAvatar,"mj-onboard-avatar");
  const name=$("#join-avatar-name");if(name)name.textContent=parts.head.name;
  const kind=$("#join-avatar-kind");if(kind)kind.textContent=parts.special?"AFSONAVIY · 1/1":"ODDIY QAHRAMON · "+parts.accessory.name.toLocaleUpperCase("uz");
 };
 $("#edit-join-avatar").addEventListener("click",()=>openAvatarStudio({preJoin:true,initialAvatar:joiningAvatar,onSave:key=>{joiningAvatar=key;updateAvatar()}}));
 $("#random-join-avatar").addEventListener("click",()=>{joiningAvatar=MJAvatars.randomKey();updateAvatar()});
 if(options.length)root.querySelector(".mj-loadout-grid").addEventListener("click",event=>{
  const button=event.target.closest("[data-loadout]");if(!button)return;
  selectedLoadout=button.dataset.loadout;
  root.querySelectorAll(".mj-loadout-card").forEach(card=>{
   const active=card===button;card.classList.toggle("is-selected",active);card.setAttribute("aria-pressed",String(active));
   const mark=card.querySelector("i");if(active&&!mark)card.insertAdjacentHTML("beforeend","<i>✓</i>");else if(!active&&mark)mark.remove();
  });
 });
 $("#join-player").onsubmit=async event=>{
  event.preventDefault();
  const nickname=nameInput.value.trim().replace(/\s+/g," "),button=root.querySelector("button[type=submit]"),error=$("#join-error");
  if(nickname.length<2){error.textContent="Taxallus kamida 2 ta belgidan iborat bo‘lsin.";nameInput.focus();return}
  if(options.length&&!selectedLoadout){error.textContent=isShooter?"Jangchi qahramonni tanlang.":"Poyga mashinasini tanlang.";return}
  button.disabled=true;button.querySelector("span").textContent="O‘YINGA QO‘SHILMOQDA...";
  try{
   const response=await api("join",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin,nickname,avatar:joiningAvatar,loadout:selectedLoadout})});
   player=response.player;sessionStorage.setItem("mj-player-"+pin,JSON.stringify(player));lastScreen="";await load();
  }catch(errorValue){error.textContent=errorValue.message;button.disabled=false;button.querySelector("span").textContent="O‘YINGA KIRISH"}
 };
}
function openAvatarStudio(options={}){
 if($("#avatar-studio"))return;
 const preJoin=!!options.preJoin,initialKey=options.initialAvatar||player?.avatar||MJAvatars.randomKey(),selected=MJAvatars.parts(initialKey);
 let selectedHead=selected.special?"fox":selected.head.id,selectedAccessory=selected.special?"none":selected.accessory.id,selectedSpecial=selected.special?initialKey:"",activeTab=selected.special?"specials":"heads",saving=false;
 const specialState=id=>(data?.specials||[]).find(item=>item.id===id)||{id,spawned:false,player_id:null};
 root.insertAdjacentHTML("beforeend",'<div class="mj-avatar-backdrop" id="avatar-studio"><section class="mj-avatar-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-studio-title"><header class="mj-avatar-modal-head"><div><span class="mj-avatar-modal-kicker">ODDIY VA MAXSUS QAHRAMONLAR</span><h2 id="avatar-studio-title">Qahramoningni sozla</h2><p>Yuzingni tanla, aksessuar qo‘sh va o‘zingga xos qiyofa yarat.</p></div><button type="button" id="close-avatar-picker" class="mj-avatar-close" aria-label="Yopish">×</button></header><div class="mj-avatar-selected-preview"><span id="avatar-modal-art">'+MJAvatars.render(initialKey,"mj-avatar-modal-art")+'</span><div><strong id="avatar-character-name">'+selected.head.name+'</strong><small id="avatar-accessory-name">'+(selected.special?"AFSONAVIY · 1/1":selected.accessory.name)+'</small></div><span class="mj-avatar-live-dot"></span></div><div class="mj-avatar-tabs" role="tablist" aria-label="Qahramon sozlamalari"><button type="button" class="mj-avatar-tab active" data-avatar-tab="heads" role="tab" aria-selected="true">Qahramonlar <span>'+MJAvatars.heads.length+'</span></button><button type="button" class="mj-avatar-tab" data-avatar-tab="hats" role="tab" aria-selected="false">Aksessuarlar <span>'+MJAvatars.hats.length+'</span></button><button type="button" class="mj-avatar-tab" data-avatar-tab="specials" role="tab" aria-selected="false">Maxsus <span>2</span></button></div><div class="mj-avatar-gallery-wrap"><div class="mj-avatar-gallery" id="avatar-gallery"></div></div><div id="avatar-save-error" class="mj-avatar-save-error" role="alert"></div><footer class="mj-avatar-modal-footer"><span id="avatar-rarity-note">'+(preJoin?"Maxsus qahramonlar o‘yinga qo‘shilgach ochiladi.":"Har bir maxsus qahramon 15% ehtimol bilan tushadi · 1/1")+'</span><div><button type="button" id="random-avatar-picker" class="mj-avatar-random">🎲 Tasodifiy</button><button type="button" id="done-avatar-picker" class="mj-avatar-done">TAYYOR <b>✓</b></button></div></footer></section></div>');
 document.body.classList.add("mj-avatar-picker-open");
 const studio=$("#avatar-studio"),getKey=()=>selectedSpecial||MJAvatars.key(selectedHead,selectedAccessory);
 const close=()=>{studio.remove();document.body.classList.remove("mj-avatar-picker-open");document.removeEventListener("keydown",onKey)};
 const onKey=event=>{if(event.key==="Escape")close()};
 const refreshPreview=()=>{
  const key=getKey(),parts=MJAvatars.parts(key);
  $("#avatar-modal-art").innerHTML=MJAvatars.render(key,"mj-avatar-modal-art");
  $("#avatar-character-name").textContent=parts.head.name;
  $("#avatar-accessory-name").textContent=parts.special?"AFSONAVIY · 1/1":parts.accessory.name;
 };
 const renderGallery=()=>{
  studio.querySelectorAll("[data-avatar-tab]").forEach(button=>{
   const active=button.dataset.avatarTab===activeTab;button.classList.toggle("active",active);button.setAttribute("aria-selected",String(active));
  });
  if(activeTab==="specials"){
   $("#avatar-gallery").innerHTML=MJAvatars.specials.map(item=>{
    const state=specialState(item.id),mine=!preJoin&&Number(state.player_id)===Number(player?.id),claimable=!preJoin&&state.spawned&&(!state.player_id||mine),chosen=selectedSpecial===item.key;
    const status=preJoin?"O‘YINGA QO‘SHILGACH OCHILADI":!state.spawned?"BU O‘YINDA CHIQMADI":mine?"SENIKI · 1/1":state.player_id?"OLINGAN · 1/1":"TOPILDI · 1/1";
    return '<button type="button" class="mj-avatar-choice mj-special-choice '+(chosen?"selected ":"")+(claimable?"":"mj-special-locked")+'" data-avatar-choice="'+item.key+'" aria-pressed="'+chosen+'" '+(claimable?"":"disabled")+'><span class="mj-avatar-choice-art">'+MJAvatars.render(item.key,"mj-avatar-choice-svg")+'</span><span class="mj-avatar-choice-name">'+item.name+'</span><small class="mj-special-rarity">✦ '+item.rarity+' · 15%</small><em class="mj-special-state">'+status+'</em>'+(chosen?'<span class="mj-avatar-choice-check">✓</span>':"")+'</button>';
   }).join("");
   if(preJoin||!MJAvatars.specials.some(item=>specialState(item.id).spawned))$("#avatar-gallery").insertAdjacentHTML("beforeend",'<p class="mj-special-empty">'+(preJoin?"Avval PIN orqali o‘yinga qo‘shil. Feniks yoki Soya Ajdari shu o‘yinda 15% ehtimol bilan paydo bo‘lishi mumkin.":"Bu o‘yinda maxsus qahramonlar chiqmagan. Keyingi o‘yinda yana omadni sinab ko‘r!")+'</p>');
   return;
  }
  const isHeads=activeTab==="heads",items=isHeads?MJAvatars.heads:MJAvatars.hats;
  $("#avatar-gallery").innerHTML=items.map(item=>{
   const key=MJAvatars.key(isHeads?item.id:selectedHead,isHeads?selectedAccessory:item.id),chosen=isHeads?item.id===selectedHead:item.id===selectedAccessory;
   return '<button type="button" class="mj-avatar-choice '+(chosen?"selected":"")+'" data-avatar-choice="'+item.id+'" aria-pressed="'+chosen+'"><span class="mj-avatar-choice-art">'+MJAvatars.render(key,"mj-avatar-choice-svg")+'</span><span class="mj-avatar-choice-name">'+item.name+'</span><small class="mj-avatar-common-tag">'+(isHeads?"ODDIY QAHRAMON":item.id==="none"?"AKSSESUARSIZ":"AKSESSUAR")+'</small>'+(chosen?'<span class="mj-avatar-choice-check">✓</span>':"")+'</button>';
  }).join("");
 };
 const setTab=tab=>{activeTab=tab;renderGallery()};
 renderGallery();
 studio.querySelectorAll("[data-avatar-tab]").forEach(button=>button.addEventListener("click",()=>setTab(button.dataset.avatarTab)));
 $("#avatar-gallery").addEventListener("click",event=>{
  const choice=event.target.closest("[data-avatar-choice]");if(!choice)return;
  if(activeTab==="specials")selectedSpecial=choice.dataset.avatarChoice;
  else{selectedSpecial="";if(activeTab==="heads")selectedHead=choice.dataset.avatarChoice;else selectedAccessory=choice.dataset.avatarChoice}
  refreshPreview();renderGallery();
 });
 $("#random-avatar-picker").addEventListener("click",()=>{
  const random=MJAvatars.parts(MJAvatars.randomKey());selectedHead=random.head.id;selectedAccessory=random.accessory.id;selectedSpecial="";activeTab="heads";refreshPreview();renderGallery();
 });
 $("#close-avatar-picker").addEventListener("click",close);
 studio.addEventListener("click",event=>{if(event.target===studio)close()});
 document.addEventListener("keydown",onKey);
 $("#done-avatar-picker").addEventListener("click",async()=>{
  if(saving)return;
  const button=$("#done-avatar-picker");saving=true;button.disabled=true;button.textContent="SAQLANMOQDA...";
  try{
   if(preJoin){options.onSave?.(getKey());close();return}
   const response=await api("player/avatar",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin,player_id:player.id,avatar:getKey()})});
   player.avatar=response.avatar||getKey();sessionStorage.setItem("mj-player-"+pin,JSON.stringify(player));
   const preview=$("#waiting-avatar-art");if(preview)preview.innerHTML=MJAvatars.render(player.avatar,"mj-avatar-art");
   close();
  }catch(error){
   const message=$("#avatar-save-error");if(message)message.textContent=error.message;
   button.disabled=false;button.innerHTML='TAYYOR <b>✓</b>';saving=false;
  }
 });
}
function waiting(){
 lastScreen="waiting";clearInterval(timer);
 const count=(data?.players||[]).length,mode=data?.session?.mode||"classic",specialMode=mode==="shooter"||mode==="racing",loadout=loadoutFor(mode,player.loadout),character=specialMode?loadoutVisual(mode,player.loadout):avatarIcon(player.avatar);
 const modeTitle=mode==="shooter"?"Jang maydoniga tayyorlan!":mode==="racing"?"Start chizig‘iga tayyor!":"Hamma tayyormi?";
 const modeCopy=mode==="shooter"?"Jangching: "+(loadout?.name||"Jangchi")+". To‘g‘ri javob bilan raqiblarni yeng!":mode==="racing"?"Mashina: "+(loadout?.name||"F1 mashinasi")+". Barcha sinf bilan bir trassaga chiqasan!":"O‘qituvchingiz o‘yinni boshlashi bilan savollar shu yerda paydo bo‘ladi. Sahifani yopmang!";
 const avatarControl=specialMode?'<div class="player-big student-player-avatar mj-waiting-avatar mj-waiting-loadout"><span id="waiting-avatar-art">'+character+'</span></div>':'<button type="button" class="player-big student-player-avatar mj-waiting-avatar" id="waiting-avatar"><span id="waiting-avatar-art">'+character+'</span><span class="mj-waiting-avatar-edit">✎</span></button>';
 const editLink=specialMode?'<div class="mj-waiting-edit-link mj-waiting-loadout-label">'+(mode==="shooter"?"⚔ JANGCHI TANLANDI":"🏁 F1 MASHINASI TANLANDI")+'</div>':'<button type="button" class="mj-waiting-edit-link" id="waiting-avatar-link">✎ Qahramonni o‘zgartirish</button>';
 root.innerHTML='<section class="student-card student-waiting-card"><div class="student-waiting-status"><i></i> O‘YINGA MUVAFFAQIYATLI QO‘SHILDING</div><div class="student-waiting-orbit"><span class="student-orbit-ring ring-one"></span><span class="student-orbit-ring ring-two"></span><span class="student-orbit-spark spark-one">✦</span><span class="student-orbit-spark spark-two">✧</span>'+avatarControl+'</div><div class="student-card-eyebrow">SALOM, '+esc(player.nickname.toUpperCase())+'!</div><h1 class="student-card-title">'+modeTitle+'</h1><p class="student-card-copy">'+modeCopy+'</p>'+editLink+'<div class="student-waiting-player-count" id="lobby-player-count">'+count+' nafar o‘quvchi o‘yinga qo‘shildi</div><div class="student-waiting-animation"><span></span><span></span><span></span><b>O‘QITUVCHI KUTILMOQDA</b></div><div class="student-waiting-footer"><span class="student-pin-badge">PIN '+pin+'</span><span class="student-score-pill">✦ MUDARRIS JOIN</span></div></section>';
 $("#waiting-avatar")?.addEventListener("click",openAvatarStudio);
 $("#waiting-avatar-link")?.addEventListener("click",openAvatarStudio);
}
function waitingForReveal(){
 if(lastScreen==="waiting-reveal")return;
 lastScreen="waiting-reveal";clearInterval(timer);
 const mode=data?.session?.mode||"classic",copy=mode==="racing"?"Mashinangiz trassada. O‘qituvchi javoblarni ochgach poyga natijasi ko‘rinadi.":mode==="shooter"?"Jang maydoni tayyor. O‘qituvchi natijani ochgach zarba va energiya holati ko‘rinadi.":"Javobingiz qabul qilindi. To‘g‘ri javob ochilishini kuting — ballaringiz va reytingingiz shundan keyin chiqadi.";
 const hero=mode==="racing"?'<div class="mj-await-art"><img src="/mode-racing.svg" alt="F1 poyga trassasi"></div>':mode==="shooter"?'<div class="mj-await-art"><img src="/mode-shooter.svg" alt="Shooter Arena"></div>':'<div class="mj-await-art"><img src="/mode-classic.svg" alt="Klassik jonli viktorina"></div>';
 const title=mode==="racing"?"PIT STOP — JAVOB QABUL QILINDI":mode==="shooter"?"NISHON KUTILMOQDA":"AJOYIB! JAVOBING SAQLANDI";
 root.innerHTML='<section class="student-card mj-wait-reveal"><div class="mj-await-top"><span>✦ MUDARRIS JOIN</span><span>SAVOL '+(Number(data.session.current_question)+1)+' · JAVOB QABUL QILINDI</span></div>'+hero+'<div class="mj-await-copy"><div class="mj-await-check">✓</div><div class="student-card-eyebrow">JAVOBINGIZ MUVAFFAQIYATLI YUBORILDI</div><h1>'+title+'</h1><p>'+copy+'</p><div class="mj-await-pulse"><i></i><i></i><i></i><b>O‘QITUVCHI NATIJANI OCHISHI KUTILMOQDA</b></div></div><div class="mj-await-footer"><span>'+esc(player.nickname)+'</span><span>Javob berildi · Natija yashirin</span></div></section>';
}
function paused(){
 lastScreen="paused";clearInterval(timer);
 root.innerHTML='<section class="student-card student-state-card student-paused-card"><div class="student-state-icon paused-icon">Ⅱ</div><div class="student-card-eyebrow">BIR OZ TANAFFUS</div><h1 class="student-card-title">O‘yin pauzada</h1><p class="student-card-copy">Xavotir olma! O‘qituvchingiz o‘yinni davom ettirishi bilan yana boshlaymiz.</p><div class="student-waiting-animation"><span></span><span></span><span></span><b>DAVOM ETISH KUTILMOQDA</b></div></section>';
}
function revealed(){
 lastScreen="revealed";clearInterval(timer);
 const q=data.current_question||{},mine=data.player_answer,free=["poll","word_cloud","open_ended","brainstorm","slide"].includes(q.type);
 const values=value=>{try{const parsed=JSON.parse(String(value??""));return Array.isArray(parsed)?parsed:[String(value??"")]}catch{return [String(value??"")]}};
 const answerText=value=>{if(value===null||value===undefined||value==="")return "Javob yuborilmadi";try{const parsed=JSON.parse(String(value));return Array.isArray(parsed)?parsed.join(" · "):String(value)}catch{return String(value)}};
 const correct=values(q.correct).filter(Boolean),correctText=q.type==="puzzle"?correct.join(" → "):q.type==="slider"?String(q.correct??"—"):correct.join(" · ");
 const myAnswer=mine?answerText(mine.answer):"Javob yuborilmadi",isCorrect=mine&&mine.correct!==null&&mine.correct!==undefined?Number(mine.correct)===1:null;
 const me=(data.players||[]).find(item=>Number(item.id)===Number(player.id));if(me)player={...player,...me};
 const resultLabel=!mine?"Bu savolga javob yubormadingiz":free?"Javobingiz qabul qilindi":isCorrect?"To‘g‘ri javob!":"Bu safar noto‘g‘ri",resultClass=!mine?"neutral":free?"recorded":isCorrect?"correct":"wrong",mode=data.session.mode||"classic";
 const scene=gameScene(mode,"revealed",isCorrect);
 root.innerHTML='<section class="student-card mj-result-v2 '+(isCorrect?"is-correct":isCorrect===false?"is-wrong":"")+'"><div class="mj-result-v2-top"><span>✦ MUDARRIS JOIN</span><span>SAVOL '+(Number(data.session.current_question)+1)+' NATIJASI</span></div><div class="mj-result-v2-hero"><div class="mj-result-burst">'+(isCorrect?"🏆":free?"💬":mine?"💥":"⏱")+'</div><div class="student-card-eyebrow">'+(mode==="shooter"?"JANG NATIJASI":mode==="racing"?"POYGA NATIJASI":"SAVOL NATIJASI")+'</div><h1 class="student-card-title">'+(isCorrect?"AJOYIB!":free?"JAVOBING QABUL QILINDI":mine?"KEYINGI SAFAR!":"VAQT TUGADI")+'</h1><div class="student-result-status '+resultClass+'">'+resultLabel+'</div></div>'+scene+'<div class="mj-result-v2-grid"><div class="mj-result-v2-stat"><small>BU SAVOLDAGI BALL</small><strong class="'+(isCorrect?"score-pop":"")+'">+'+Number(mine?.points||0).toLocaleString()+'</strong></div><div class="mj-result-v2-stat"><small>JAMI BALLARING</small><strong>'+Number(player.score||0).toLocaleString()+'</strong></div></div><div class="mj-result-v2-answer"><span>SENING JAVOBING</span><strong>'+esc(myAnswer)+'</strong>'+(free?"":'<small>TO‘G‘RI JAVOB: '+esc(correctText||"—")+'</small>')+'</div>'+studentLeaderboard()+'<div class="mj-result-v2-wait"><i></i><i></i><i></i><b>KEYINGI SAVOL KUTILMOQDA</b></div></section>';
}
function finish(){
 lastScreen="finished";clearInterval(timer);
 const list=data.leaderboard||[],me=list.findIndex(p=>Number(p.id)===Number(player.id)),place=me>=0?me+1:null,top=list.slice(0,3),order=top.length===3?[top[1],top[0],top[2]]:top;
 const podium=order.length?'<div class="mj-final-podium">'+order.map(p=>{const rank=top.findIndex(x=>Number(x.id)===Number(p.id))+1;return '<div class="mj-final-podium-item place-'+rank+'"><div class="mj-final-podium-avatar">'+avatarIcon(p.avatar)+'</div><span>'+(rank===1?"👑":rank===2?"🥈":"🥉")+'</span><strong>'+esc(p.nickname)+'</strong><b>'+Number(p.score||0).toLocaleString()+'</b><small>'+rank+'-O‘RIN</small><i></i></div>'}).join("")+'</div>':"";
 root.innerHTML='<section class="student-card student-finish-card mj-final-v2"><div class="student-trophy-stage"><span class="trophy-rays">✦</span><span class="trophy-icon">🏆</span><span class="trophy-confetti confetti-a">✦</span><span class="trophy-confetti confetti-b">✧</span></div><div class="student-card-eyebrow">BELLASHUV YAKUNLANDI</div><h1 class="student-card-title">Barakalla, '+esc(player.nickname)+'!</h1><p class="student-card-copy">Sen ajoyib qatnashding. Keyingi safar undan ham zo‘r natija ko‘rsat!</p><div class="student-final-score"><span>JAMI TO‘PLAGAN BALLARING</span><strong>'+Number(player.score||0).toLocaleString()+'</strong><small>ball</small></div>'+(place?'<div class="student-rank-note">🏅 Sen '+place+'-o‘rinni egallading!</div>':"")+podium+'<div class="student-leaderboard"><div class="student-leaderboard-head"><strong>🏆 Yakuniy reyting</strong><span>'+list.length+' o‘yinchi</span></div><div class="final-list">'+list.map((p,i)=>'<div class="'+(Number(p.id)===Number(player.id)?"is-me":"")+'"><strong><span class="student-rank-number">'+(i+1)+'</span>'+avatarIcon(p.avatar)+' '+esc(p.nickname)+(Number(p.id)===Number(player.id)?' <small>SEN</small>':"")+'</strong><b>'+Number(p.score||0).toLocaleString()+' ball</b></div>').join("")+'</div></div><a href="/" class="student-primary-button student-home-button"><span>BOSH SAHIFAGA QAYTISH</span><b>→</b></a></section>';
}
function raceBoard(){const list=(data.players||[]).slice().sort((a,b)=>b.score-a.score).slice(0,5),max=Math.max(1,...list.map(p=>p.score));return '<div class="race-board">'+list.map(p=>'<div class="race-row"><span>'+avatarIcon(p.avatar)+' '+esc(p.nickname)+'</span><div><i style="width:'+Math.max(5,p.score/max*100)+'%"></i></div><b>'+p.score+'</b></div>').join("")+'</div>'}
function startTimer(seconds){clearInterval(timer);const start=Date.now();timer=setInterval(()=>{const left=Math.max(0,seconds-(Date.now()-start)/1000),n=$("#timer-number"),bar=$("#timer-fill");if(n)n.textContent=Math.ceil(left);if(bar)bar.style.width=(left/seconds*100)+"%";if(left<=0){clearInterval(timer);answered=data?.session?.current_question??answered;waitingForReveal()}},150)}
let puzzleOrder=[],selectedMultiAnswers=new Set();
function studentMediaMarkup(value){if(!value)return "";if(/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/i.test(value))return '<div class="student-media"><img src="'+value+'" alt="Savol uchun rasm"></div>';try{const u=new URL(value);if(!["http:","https:"].includes(u.protocol))return "";const safe=esc(u.href),host=u.hostname.toLowerCase(),id=(host==="youtu.be"?u.pathname.slice(1):u.searchParams.get("v"))||"";if((host==="youtube.com"||host.endsWith(".youtube.com")||host==="youtu.be")&&/^[A-Za-z0-9_-]{6,15}$/.test(id))return '<div class="student-media"><iframe class="student-video-frame" src="https://www.youtube-nocookie.com/embed/'+esc(id)+'" title="Savol videosi" loading="lazy" allowfullscreen></iframe></div>';if(/\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(u.pathname))return '<div class="student-media"><img src="'+safe+'" alt="Savol uchun media"></div>';if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(u.pathname))return '<div class="student-media"><video src="'+safe+'" controls playsinline></video></div>';return '<div class="student-media student-media-link"><a href="'+safe+'" target="_blank" rel="noopener">Savolga biriktirilgan media ↗</a></div>'}catch{return ""}}
function gameScene(mode,phase="playing",correct=null){
 const players=(data?.players||[]).slice().sort((a,b)=>Number(b.score||0)-Number(a.score||0)),rank=Math.max(0,players.findIndex(p=>Number(p.id)===Number(player.id))),loadout=loadoutFor(mode,player.loadout),defeated=Math.max(0,Number(player.enemies_defeated)||0),health=Math.max(0,Math.min(100,Number(player.health??100)));
 if(mode==="shooter"){
  const hero=loadoutVisual("shooter",player.loadout),names=["Qaroqchi","Cho‘l banditi","Temir niqob","Soya boshliq","So‘nggi raqib"],enemy=names[Math.min(names.length-1,defeated%names.length)];
  return '<section class="mj-game-scene mj-shooter-scene '+(phase==="revealed"?(correct===true?"is-victory":correct===false?"is-damaged":""):"")+'"><div class="mj-shooter-backdrop"><img src="/mode-shooter.svg" alt="Shooter Arena jang maydoni"></div><div class="mj-shooter-game-header"><span>SHOOTER ARENA</span><b>RAQIB '+(defeated+1)+'</b></div><div class="mj-shooter-player"><div class="mj-shooter-player-art">'+hero+'</div><div class="mj-shooter-player-info"><strong>'+esc(loadout?.name||"Jangchi")+'</strong><small>JANGCHI</small><span class="mj-shooter-hp"><i style="width:'+health+'%"></i></span><b>'+health+' HP</b></div></div><div class="mj-shooter-target"><div class="mj-shooter-enemy-orbit">✦</div><div class="mj-shooter-enemy-avatar">👾</div><strong>'+enemy+'</strong><span class="mj-shooter-target-health"><i style="width:'+(phase==="revealed"&&correct===true?"0":"100")+'%"></i></span><small>'+defeated+' / 5 RAQIB YENGILDI</small></div>'+(phase==="revealed"?'<div class="mj-shooter-impact '+(correct===true?"good":"bad")+'">'+(correct===true?"⚡ ZARBA! RAQIB YENGILDI":correct===false?"💥 ZARBA QAYTDI · ENERGIYA KAMAYDI":"JANG DAVOM ETADI")+'</div>':'<div class="mj-shooter-attack-cue">TO‘G‘RI JAVOB = ZARBA</div>')+'</section>';
 }
 if(mode==="racing"){
  const racers=players.some(item=>Number(item.id)===Number(player.id))?players:[...players,{...player,score:Number(player.score||0)}];
  const sorted=racers.slice().sort((a,b)=>Number(b.score||0)-Number(a.score||0)),myRank=Math.max(0,sorted.findIndex(item=>Number(item.id)===Number(player.id))),score=Number(player.score||0),max=Math.max(1,...sorted.map(item=>Number(item.score||0)));
  const racerData=esc(JSON.stringify(sorted.map(item=>({id:item.id,nickname:item.nickname,loadout:item.loadout||"falcon",score:Number(item.score||0)}))));
  return '<section class="mj-game-scene mj-racing-scene '+(phase==="revealed"?(correct===true?"is-boost":correct===false?"is-slow":""):"")+'" data-racers="'+racerData+'" data-player-id="'+Number(player.id)+'"><canvas class="mj-race-world" aria-label="Barcha o‘yinchilar birga qatnashadigan Formula poyga trassasi"></canvas><div class="mj-race-topline"><span>MUDARRIS GRAND PRIX</span><b>'+String(index+1).padStart(2,"0")+' / '+String(data?.questions?.length||1).padStart(2,"0")+'</b></div><div class="mj-race-live-badge"><i></i> LIVE CIRCUIT</div><div class="mj-race-position-card"><small>SENING O‘RNING</small><strong>'+(phase==="revealed"?"#"+(myRank+1):"—")+'</strong><span>'+score.toLocaleString("uz-UZ")+' BALL</span></div><div class="mj-race-bottomline"><strong>'+esc(player.nickname)+'</strong><span>'+(phase==="revealed"?(correct===true?"TURBO BOOST!":correct===false?"KEYINGI SAVOLDA QAYT!":"POYGA DAVOM ETADI"):"JAVOB BILAN TEZLASH")+'</span></div></section>';
 }
 return "";
}
function studentLeaderboard(){
 const list=(data?.players||[]).slice().sort((a,b)=>Number(b.score||0)-Number(a.score||0)).slice(0,5);
 if(!list.length)return "";
 return '<section class="mj-student-leaderboard"><div class="mj-student-leaderboard-head"><span>🏆 SINFDAGI REYTING</span><small>TOP '+list.length+'</small></div><div class="mj-student-leaderboard-list">'+list.map((item,index)=>'<div class="mj-student-rank '+(Number(item.id)===Number(player.id)?"is-me":"")+' rank-'+(index+1)+'"><b class="mj-rank-position">'+(index===0?"👑":index+1)+'</b><span class="mj-rank-avatar">'+avatarIcon(item.avatar)+'</span><span class="mj-rank-name">'+(loadoutFor(data.session.mode,item.loadout)?.icon?loadoutFor(data.session.mode,item.loadout).icon+" ":"")+esc(item.nickname)+(Number(item.id)===Number(player.id)?' <small>SEN</small>':"")+'</span><strong>'+Number(item.score||0).toLocaleString()+'</strong></div>').join("")+'</div></section>';
}
function question(q){
 lastScreen="question";
 const mode=data.session.mode||"classic",modeNames={classic:"KLASSIK",racing:"F1 POYGASI",shooter:"SHOOTER ARENA"},modeLabel=modeNames[mode]||"KLASSIK",type=q.type||"quiz",mediaHtml=studentMediaMarkup(q.media||"");
 selectedMultiAnswers=new Set();puzzleOrder=[];let answerHtml="";
 if(type==="slider"){const min=Number(q.options?.[0]?.text??0),max=Number(q.options?.[1]?.text??100),step=Number(q.options?.[2]?.text??1),lo=Number.isFinite(min)?min:0,hi=Number.isFinite(max)&&max>lo?max:100,st=Number.isFinite(step)&&step>0?step:1,mid=lo+(hi-lo)/2;answerHtml='<form id="slider-answer-form" class="student-slider-answer"><div class="student-slider-value" id="slider-value">'+mid+'</div><input id="slider-input" type="range" min="'+lo+'" max="'+hi+'" step="'+st+'" value="'+mid+'"><div class="student-slider-limits"><span>'+lo+'</span><span>'+hi+'</span></div><button class="student-primary-button" type="submit">JAVOBNI YUBORISH →</button></form>'}
 else if(type==="puzzle"){puzzleOrder=(q.options||[]).map(o=>String(o.text||o));for(let i=puzzleOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[puzzleOrder[i],puzzleOrder[j]]=[puzzleOrder[j],puzzleOrder[i]]}answerHtml='<div class="student-puzzle-answer"><p>Javoblarni to‘g‘ri tartibga keltiring:</p><div id="puzzle-items">'+puzzleOrder.map((v,i)=>'<div class="student-puzzle-row"><span>'+(i+1)+'</span><strong>'+esc(v)+'</strong><div><button type="button" data-puzzle-move="'+i+'" data-direction="-1" '+(i===0?'disabled':'')+'>↑</button><button type="button" data-puzzle-move="'+i+'" data-direction="1" '+(i===puzzleOrder.length-1?'disabled':'')+'>↓</button></div></div>').join('')+'</div><button type="button" id="submit-puzzle" class="student-primary-button">TARTIBNI YUBORISH →</button></div>'}
 else if(type==="quiz"&&q.multi_select){answerHtml='<div class="student-multi-hint">Bir nechta to‘g‘ri javob bor. Barcha mos javoblarni belgilang.</div><div class="student-multi-grid">'+(q.options||[]).map((o,i)=>'<button type="button" class="student-multi-option '+["red","blue","yellow","green"][i%4]+'" data-multi-answer="'+esc(o.text||o)+'"><span class="student-multi-check"></span><span>'+esc(o.text||o)+'</span></button>').join('')+'</div><button type="button" id="submit-multi" class="student-primary-button" disabled>JAVOBLARNI YUBORISH →</button>'}
 else if(type==="slide"){answerHtml='<div class="student-slide-answer"><span>TAQDIMOT SLAYDI</span><p>Ma’lumotni ko‘rib chiqing va davom eting.</p><button type="button" class="student-primary-button" id="submit-slide">DAVOM ETISH →</button></div>'}
 else if(["type_answer","open_ended","word_cloud","brainstorm"].includes(type)){const word=type==="word_cloud",open=type==="open_ended",brain=type==="brainstorm",max=word?20:open?250:brain?400:type==="type_answer"?20:75,field=open||brain?'<textarea class="field" id="typed-answer" maxlength="'+max+'" rows="'+(brain?4:3)+'" placeholder="'+(brain?"Har bir g‘oyani yangi qatordan yozing…":open?"Fikringizni yozing…":"Javobingizni yozing…")+'"></textarea>':'<input class="field" id="typed-answer" maxlength="'+max+'" placeholder="'+(word?"Bitta so‘z yoki qisqa ibora…":type==="type_answer"?"Qisqa javob (20 belgigacha)…":"Javobingizni yozing…")+'" autocomplete="off">';answerHtml='<form id="answer-form" class="typed-answer student-typed-answer">'+field+'<button class="student-primary-button" type="submit"><span>JAVOBNI YUBORISH</span><b>→</b></button></form>'}
 else{answerHtml=(q.options||[]).map((o,i)=>'<button class="answer-tile student-answer-tile '+["red","blue","yellow","green"][i%4]+'" data-answer="'+esc(o.text||o)+'"><span class="answer-symbol">'+["▲","◆","●","■"][i%4]+'</span><span>'+esc(o.text||o)+'</span><b class="student-answer-arrow">→</b></button>').join('')}
 root.innerHTML='<section class="question-wrap student-question-stage mj-question-v2"><div class="question-top student-game-toolbar"><div class="student-game-title"><span class="student-mini-logo">✦</span><span>'+esc(data.session.title)+'</span></div><span class="pill student-mode-pill">'+esc(modeLabel)+'</span><span class="student-pin-badge">PIN '+pin+'</span><div class="student-player-chip"><span>'+avatarIcon(player.avatar)+'</span><b>'+esc(player.nickname)+'</b><i>★ '+Number(player.score||0).toLocaleString()+'</i></div></div><div class="mj-question-v2-card"><div class="mj-question-v2-meta"><span>SAVOL '+(data.session.current_question+1)+' / '+(data.questions?.length||"?")+'</span><span>'+esc(modeLabel)+'</span></div><h1 class="display student-question-title">'+esc(q.prompt)+'</h1>'+(mediaHtml?'<div class="mj-question-v2-media">'+mediaHtml+'</div>':'<div class="mj-question-v2-media mj-question-media-empty"><span>✦</span><small>SAVOLGA DIQQAT QILING</small></div>')+gameScene(mode,"playing")+'<div class="mj-question-v2-timer"><span>QOLGAN VAQT</span><div><i id="timer-fill"></i></div><strong id="timer-number">'+q.time+'</strong></div><div id="answer-area" class="answer-grid student-answer-grid">'+answerHtml+'</div><div id="answer-status" class="answer-status student-answer-status" aria-live="polite"></div></div><div class="student-game-footer"><span>✦ MUDARRIS JOIN</span><span>Javobni tanla — ballarni yut!</span></div></section>';
 
 const area=$("#answer-area");
 if(type==="quiz"&&q.multi_select){area.querySelectorAll("[data-multi-answer]").forEach(b=>b.addEventListener("click",()=>{const v=b.dataset.multiAnswer;if(selectedMultiAnswers.has(v)){selectedMultiAnswers.delete(v);b.classList.remove("selected")}else{selectedMultiAnswers.add(v);b.classList.add("selected")}$("#submit-multi").disabled=selectedMultiAnswers.size===0}));$("#submit-multi").addEventListener("click",()=>submit(JSON.stringify(Array.from(selectedMultiAnswers))))}
 else if(type==="slider"){const slider=$("#slider-input");slider.addEventListener("input",()=>$("#slider-value").textContent=slider.value);$("#slider-answer-form").onsubmit=e=>{e.preventDefault();submit(slider.value)}}
 else if(type==="puzzle"){$("#puzzle-items").addEventListener("click",e=>{const b=e.target.closest("[data-puzzle-move]");if(!b)return;const i=Number(b.dataset.puzzleMove),j=i+Number(b.dataset.direction);if(j<0||j>=puzzleOrder.length)return;[puzzleOrder[i],puzzleOrder[j]]=[puzzleOrder[j],puzzleOrder[i]];$("#puzzle-items").innerHTML=puzzleOrder.map((v,k)=>'<div class="student-puzzle-row"><span>'+(k+1)+'</span><strong>'+esc(v)+'</strong><div><button type="button" data-puzzle-move="'+k+'" data-direction="-1" '+(k===0?'disabled':'')+'>↑</button><button type="button" data-puzzle-move="'+k+'" data-direction="1" '+(k===puzzleOrder.length-1?'disabled':'')+'>↓</button></div></div>').join('')});$("#submit-puzzle").addEventListener("click",()=>submit(JSON.stringify(puzzleOrder)))}
 else if(["type_answer","open_ended","word_cloud","brainstorm"].includes(type))$("#answer-form").onsubmit=e=>{e.preventDefault();submit($("#typed-answer").value)};
 else if(type==="slide")$("#submit-slide").addEventListener("click",()=>submit("DAVOM ETISH"));
 else area.onclick=e=>{const b=e.target.closest("[data-answer]");if(b)submit(b.dataset.answer)};
 startTimer(Number(q.time)||20);
}
async function submit(answer){
 if(answer===undefined||answer===null||String(answer).trim()===""||answered===data.session.current_question)return;
 answered=data.session.current_question;clearInterval(timer);const area=$("#answer-area");if(area)area.querySelectorAll("button,input,textarea").forEach(x=>x.disabled=true);
 try{
  await api("answer",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin,player_id:player.id,answer})});
  data.player_answer={submitted:true};waitingForReveal();
 }catch(e){
  answered=-1;const st=$("#answer-status");if(st){st.classList.remove("is-correct","is-wrong");st.textContent=e.message}
  if(area)area.querySelectorAll("button,input,textarea").forEach(x=>x.disabled=false);
 }
}
function render(){
 if(!data)return;
 if(data.session.status==="waiting"){
  if(lastScreen!=="waiting")waiting();
  else{const count=$("#lobby-player-count");if(count)count.textContent=(data.players||[]).length+" nafar o‘quvchi o‘yinga qo‘shildi"}
  return;
 }
 if(data.session.status==="paused"){if(lastScreen!=="paused")paused();return}
 if(data.session.status==="revealed"){if(lastScreen!=="revealed")revealed();return}
 if(data.session.status==="finished"){if(lastScreen!=="finished")finish();return}
 if(data.player_answer?.submitted){if(lastScreen!=="waiting-reveal")waitingForReveal();return}
 if(lastScreen==="waiting-reveal"&&answered===data.session.current_question)return;
 const q=data.current_question;
 if(!q){if(lastScreen!=="waiting")waiting();return}
 if(data.session.current_question!==lastQuestion||lastScreen!=="question"){lastQuestion=data.session.current_question;answered=-1;question(q)}
}
async function load(){
 try{
  if(!player){try{const saved=sessionStorage.getItem("mj-player-"+pin);if(saved)player=JSON.parse(saved)}catch{sessionStorage.removeItem("mj-player-"+pin)}}
  data=await api("session/"+pin+(player?"?player_id="+encodeURIComponent(player.id):""));
  if(!player){
   if(data.session.status==="waiting"){if(lastScreen!=="join")showJoin()}
   else if(lastScreen!=="started"){lastScreen="started";root.innerHTML='<section class="student-card student-state-card student-error-card"><div class="student-state-icon">🚦</div><div class="student-card-eyebrow">O‘YIN BOSHLANIB BO‘LDI</div><h1 class="student-card-title">Kech qoldingmi?</h1><p class="student-card-copy">Bu o‘yin allaqachon boshlangan. O‘qituvchingizdan yangi PIN-kod so‘rang.</p><a href="/" class="student-primary-button student-home-button"><span>BOSHQA PIN KIRITISH</span><b>→</b></a></section>'}
   return;
  }
  const me=(data.players||[]).find(item=>Number(item.id)===Number(player.id));if(me){const visible=["revealed","finished"].includes(data.session.status);player={...player,...me,score:visible?Number(me.score||0):Number(player.score||0),health:visible?Number(me.health??100):Number(player.health??100),enemies_defeated:visible?Number(me.enemies_defeated||0):Number(player.enemies_defeated||0)};if(visible)sessionStorage.setItem("mj-player-"+pin,JSON.stringify(player))}
  render();
 }catch(error){
  const invalidPin=error.message==="O‘yin PIN-kodi topilmadi.",screen=invalidPin?"invalid-pin":"load-error";
  if(lastScreen!==screen){
   lastScreen=screen;
   if(invalidPin)root.innerHTML='<section class="student-card student-state-card student-error-card"><div class="student-state-icon student-invalid-pin-icon" aria-hidden="true">✕</div><div class="student-card-eyebrow">PIN-KOD TOPILMADI</div><h1 class="student-card-title">Kod xato</h1><p class="student-card-copy">Bu 6 xonali PIN-kod topilmadi. Kodni tekshirib, qayta kiriting.</p><a href="/" class="student-primary-button student-home-button"><span>BOSHQA KOD KIRITISH</span><b>→</b></a></section>';
   else root.innerHTML='<section class="student-card student-state-card student-error-card"><div class="student-state-icon">⚠️</div><div class="student-card-eyebrow">ULANISHDA XATOLIK</div><h1 class="student-card-title">O‘yinga ulanib bo‘lmadi</h1><p class="student-card-copy">'+esc(error.message)+'</p><a href="/" class="student-primary-button student-home-button"><span>QAYTA URINISH</span><b>→</b></a></section>';
  }
 }
}

if(!/^\d{6}$/.test(pin)){root.innerHTML='<section class="join-card card">O‘yin PIN-kodi noto‘g‘ri. <a href="/">Qayta urinib ko‘ring</a></section>';return}$("#pin-label").textContent="PIN "+pin;load();setInterval(load,1400);
})();