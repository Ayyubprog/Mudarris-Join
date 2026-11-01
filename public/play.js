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
  {id:"falcon",name:"Falcon GT",icon:"🏎️",tone:"#ef4b55",desc:"Tez start"},
  {id:"vortex",name:"Vortex X",icon:"🚙",tone:"#4e83e8",desc:"Muvozanatli"},
  {id:"comet",name:"Comet R",icon:"🚗",tone:"#8e62d2",desc:"Yengil kuzov"},
  {id:"titan",name:"Titan Turbo",icon:"🚘",tone:"#4da98a",desc:"Kuchli motor"},
  {id:"blaze",name:"Blaze RS",icon:"🏁",tone:"#df963b",desc:"Poyga afsonasi"}
 ]
};
const loadoutFor=(mode,id)=>(loadoutCatalog[mode]||[]).find(item=>item.id===id)||null;
function loadoutVisual(mode,id){
 const colors={ranger:"#d49a42",cyber:"#5a9de8",knight:"#a7aebc",ninja:"#8c65c9",pilot:"#51bca8",falcon:"#ef4b55",vortex:"#4e83e8",comet:"#8e62d2",titan:"#4da98a",blaze:"#df963b"},color=colors[id]||"#6b70a8";
 if(mode==="racing")return '<svg class="mj-loadout-svg mj-car-svg" viewBox="0 0 140 82" role="img" aria-label="Poyga mashinasi"><ellipse cx="70" cy="70" rx="53" ry="7" fill="#1d2b4533"/><path d="M16 53 25 36q5-8 18-10l17-15h33l18 15q12 2 17 13l-1 14q-1 7-10 7H25q-9 0-9-7Z" fill="'+color+'" stroke="#25334c" stroke-width="3" stroke-linejoin="round"/><path d="m49 29 15-13h27l15 13Z" fill="#bfeaff" stroke="#25334c" stroke-width="2.5" stroke-linejoin="round"/><path d="M68 17v12m-44 11h93" stroke="#fff" stroke-opacity=".75" stroke-width="3"/><path d="M17 51h14m84 0h9" stroke="#ffe79a" stroke-width="5" stroke-linecap="round"/><circle cx="40" cy="59" r="11" fill="#202b3d" stroke="#fff" stroke-width="3"/><circle cx="104" cy="59" r="11" fill="#202b3d" stroke="#fff" stroke-width="3"/><circle cx="40" cy="59" r="4" fill="#9ca8bd"/><circle cx="104" cy="59" r="4" fill="#9ca8bd"/><path d="M31 34h15m52 0h12" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>';
 const visor=id==="ninja"?"<path d='M39 31q31-18 62 0l-5 12H44Z' fill='#1c2138'/>":id==="knight"?"<path d='m40 34 30-21 30 21-7 20H47Z' fill='#cbd3df' stroke='#39445a' stroke-width='3'/>":id==="pilot"?"<path d='M40 31q30-28 60 0v18H40Z' fill='#c3f2ff' stroke='#31536b' stroke-width='3'/>":id==="cyber"?"<path d='M39 34q30-23 62 0v18H39Z' fill='#202b46' stroke='#7de8ff' stroke-width='3'/>":"<path d='M35 37q35-27 70 0l-8 10H43Z' fill='#a66a2c' stroke='#603d28' stroke-width='3'/>";
 return '<svg class="mj-loadout-svg mj-hero-svg" viewBox="0 0 120 132" role="img" aria-label="Jangchi"><ellipse cx="60" cy="123" rx="35" ry="6" fill="#1d2b4533"/><path d="M27 116q-5-32 9-47 9-10 24-10t24 10q14 15 9 47Z" fill="'+color+'" stroke="#25334c" stroke-width="3"/><path d="M44 78q16 10 32 0l7 35H37Z" fill="#25334c" opacity=".18"/><circle cx="60" cy="45" r="29" fill="#d99b70" stroke="#704a42" stroke-width="3"/>'+visor+'<path d="M47 48h3m20 0h3" stroke="#202b3d" stroke-width="4" stroke-linecap="round"/><path d="M52 61q8 6 16 0" fill="none" stroke="#77473d" stroke-width="2.5" stroke-linecap="round"/><path d="M31 89 17 108l13 7 17-21m42-5 14 19-13 7-17-21" fill="'+color+'" stroke="#25334c" stroke-width="3" stroke-linejoin="round"/><path d="M46 116v8m28-8v8" stroke="#25334c" stroke-width="7" stroke-linecap="round"/></svg>';
}
const loadoutCard=(mode,item,selected)=>'<button type="button" class="mj-loadout-card '+(selected?"is-selected":"")+'" data-loadout="'+item.id+'" aria-pressed="'+selected+'" style="--loadout-tone:'+item.tone+'"><span class="mj-loadout-art">'+loadoutVisual(mode,item.id)+'</span><strong>'+item.name+'</strong><small>'+item.desc+'</small>'+(selected?'<i>✓</i>':"")+'</button>';

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(path,opts){const r=await fetch("/api/"+path,opts||{}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"So‘rov bajarilmadi");return d}
function showJoin(){
 if(lastScreen==="join")return;
 lastScreen="join";
 const joiningAvatar=MJAvatars.randomKey(),mode=data?.session?.mode||"classic",options=loadoutCatalog[mode]||[];
 let selectedLoadout=options[0]?.id||"";
 const isShooter=mode==="shooter",isRacing=mode==="racing",modeTitle=isShooter?"JANGCHI TANLA":isRacing?"MASHINA TANLA":"TAXALLUS VA QAHRAMON";
 const modeCopy=isShooter?"Bu jangda qaysi qahramon bilan qatnashasan?":isRacing?"Poygaga qaysi mashina bilan chiqasan?":"Senga tasodifiy qahramon berildi. O‘yinga kirgach uni o‘zgartirishing mumkin.";
 root.innerHTML='<section class="student-card mj-onboard-v2"><div class="mj-onboard-top"><span class="mj-onboard-brand"><img src="/mudarris-book-purple.svg" alt=""> MUDARRIS <b>JOIN</b></span><span class="mj-onboard-step">1 <i>/</i> 1</span></div><div class="mj-onboard-content"><div class="mj-onboard-copy"><span class="mj-onboard-kicker">JONLI O‘YINGA QO‘SHILISH</span><h1 class="mj-onboard-title">O‘yinga xush kelibsan!</h1><p class="mj-onboard-subtitle">Ismingni yoz. Sinfdoshlaring seni shu nom bilan ko‘radi.</p><label class="mj-onboard-label" for="nickname">SENING TAXALLUSING</label><input class="mj-onboard-name" id="nickname" maxlength="24" minlength="2" required placeholder="Masalan, Ayyub" autocomplete="nickname"><div class="mj-onboard-name-help">2–24 belgi · Isming yoki o‘zing yoqtirgan taxallus</div><div class="mj-onboard-error" id="join-error" role="alert" aria-live="polite"></div></div><div class="mj-onboard-preview"><div class="mj-onboard-preview-glow"></div><div class="mj-onboard-preview-art">'+(isShooter||isRacing?'<span class="mj-onboard-mode-emoji">'+(isShooter?"🎯":"🏁")+'</span>':MJAvatars.render(joiningAvatar,"mj-onboard-avatar"))+'</div><span class="mj-onboard-preview-tag">'+(isShooter?"JANGCHI TANLOVI":isRacing?"POYGA GARAJI":"TASODIFIY QAHRAMON")+'</span><strong>'+(isShooter?"Jangga tayyorlan!":isRacing?"Start chizig‘ida ko‘rishamiz!":"Sening qahramoning tayyor!")+'</strong><small>'+(isShooter?"O‘zingga mos jangchini tanla.":isRacing?"O‘zingga mos mashinani tanla.":"Kutish xonasida qahramoningni sozlashing mumkin.")+'</small></div></div>'+(options.length?'<section class="mj-loadout-section"><div class="mj-loadout-heading"><div><span>'+modeTitle+'</span><small>'+modeCopy+'</small></div><b>'+options.length+' TA</b></div><div class="mj-loadout-grid">'+options.map(item=>loadoutCard(mode,item,item.id===selectedLoadout)).join("")+'</div></section>':'')+'<form id="join-player" class="mj-onboard-footer"><span class="mj-onboard-secure">✓ Akkaunt ochish shart emas</span><button class="mj-onboard-submit" type="submit"><span>O‘YINGA KIRISH</span><b>→</b></button></form></section>';
 const nameInput=$("#nickname");nameInput.focus({preventScroll:true});
 if(options.length)$("#play-root").querySelector(".mj-loadout-grid").addEventListener("click",event=>{const button=event.target.closest("[data-loadout]");if(!button)return;selectedLoadout=button.dataset.loadout;$("#play-root").querySelectorAll("[data-loadout]").forEach(card=>{const active=card===button;card.classList.toggle("is-selected",active);card.setAttribute("aria-pressed",String(active));const mark=card.querySelector("i");if(active&&!mark)card.insertAdjacentHTML("beforeend","<i>✓</i>");else if(!active&&mark)mark.remove()})});
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
function openAvatarStudio(){
 if($("#avatar-studio"))return;
 const selected=MJAvatars.parts(player.avatar);
 let selectedHead=selected.special?"fox":selected.head.id,selectedAccessory=selected.special?"none":selected.accessory.id,selectedSpecial=selected.special?player.avatar:"",activeTab=selected.special?"specials":"heads",saving=false;
 const specialState=id=>(data?.specials||[]).find(item=>item.id===id)||{id,spawned:false,player_id:null};
 root.insertAdjacentHTML("beforeend",'<div class="mj-avatar-backdrop" id="avatar-studio"><section class="mj-avatar-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-studio-title"><header class="mj-avatar-modal-head"><div><span class="mj-avatar-modal-kicker">SENING O‘YINCHI QIYOFANG</span><h2 id="avatar-studio-title">Qahramoningni tanla</h2></div><button type="button" id="close-avatar-picker" class="mj-avatar-close" aria-label="Yopish">×</button></header><div class="mj-avatar-selected-preview"><span id="avatar-modal-art">'+MJAvatars.render(player.avatar,"mj-avatar-modal-art")+'</span><div><strong id="avatar-character-name">'+selected.head.name+'</strong><small id="avatar-accessory-name">'+(selected.special?"AFSONAVIY · 1/1":selected.accessory.name)+'</small></div><span class="mj-avatar-live-dot"></span></div><div class="mj-avatar-tabs" role="tablist" aria-label="Qahramon sozlamalari"><button type="button" class="mj-avatar-tab active" data-avatar-tab="heads" role="tab" aria-selected="true">Qahramonlar <span>'+MJAvatars.heads.length+'</span></button><button type="button" class="mj-avatar-tab" data-avatar-tab="hats" role="tab" aria-selected="false">Aksessuarlar <span>'+MJAvatars.hats.length+'</span></button><button type="button" class="mj-avatar-tab" data-avatar-tab="specials" role="tab" aria-selected="false">✨ Maxsus <span>2</span></button></div><div class="mj-avatar-gallery-wrap"><div class="mj-avatar-gallery" id="avatar-gallery"></div></div><div id="avatar-save-error" class="mj-avatar-save-error" role="alert"></div><footer class="mj-avatar-modal-footer"><span>Maxsus qahramonlar har biri 15% ehtimol bilan paydo bo‘ladi · 1/1</span><button type="button" id="done-avatar-picker" class="mj-avatar-done">TAYYOR <b>✓</b></button></footer></section></div>');
 document.body.classList.add("mj-avatar-picker-open");
 const studio=$("#avatar-studio");
 const getKey=()=>selectedSpecial||MJAvatars.key(selectedHead,selectedAccessory);
 const close=()=>{studio.remove();document.body.classList.remove("mj-avatar-picker-open");document.removeEventListener("keydown",onKey)};
 const onKey=event=>{if(event.key==="Escape")close()};
 const refreshPreview=()=>{
  const key=getKey(),parts=MJAvatars.parts(key);
  $("#avatar-modal-art").innerHTML=MJAvatars.render(key,"mj-avatar-modal-art");
  $("#avatar-character-name").textContent=parts.head.name;
  $("#avatar-accessory-name").textContent=parts.special?"AFSONAVIY · 1/1":parts.accessory.name;
 };
 const renderGallery=()=>{
  studio.querySelectorAll("[data-avatar-tab]").forEach(button=>{const active=button.dataset.avatarTab===activeTab;button.classList.toggle("active",active);button.setAttribute("aria-selected",String(active))});
  if(activeTab==="specials"){
   $("#avatar-gallery").innerHTML=MJAvatars.specials.map(item=>{
    const state=specialState(item.id),mine=Number(state.player_id)===Number(player.id),claimable=state.spawned&&(!state.player_id||mine),chosen=selectedSpecial===item.key;
    const status=!state.spawned?"BU O‘YINDA CHIQMADI":mine?"SENIKI · 1/1":state.player_id?"OLINGAN · 1/1":"TOPILDI · 1/1";
    return '<button type="button" class="mj-avatar-choice mj-special-choice '+(chosen?"selected ":"")+(claimable?"":"mj-special-locked")+'" data-avatar-choice="'+item.key+'" aria-pressed="'+chosen+'" '+(claimable?"":"disabled")+'><span class="mj-avatar-choice-art">'+MJAvatars.render(item.key,"mj-avatar-choice-svg")+'</span><span class="mj-avatar-choice-name">'+item.name+'</span><small class="mj-special-rarity">✦ '+item.rarity+' · 15%</small><em class="mj-special-state">'+status+'</em>'+(chosen?'<span class="mj-avatar-choice-check">✓</span>':"")+'</button>';
   }).join("");
   if(!MJAvatars.specials.some(item=>specialState(item.id).spawned))$("#avatar-gallery").insertAdjacentHTML("beforeend",'<p class="mj-special-empty">Bu o‘yinda maxsus qahramonlar chiqmagan. Keyingi o‘yinda yana omadni sinab ko‘r! 🍀</p>');
   return;
  }
  const isHeads=activeTab==="heads",items=isHeads?MJAvatars.heads:MJAvatars.hats;
  $("#avatar-gallery").innerHTML=items.map(item=>{
   const key=MJAvatars.key(isHeads?item.id:selectedHead,isHeads?selectedAccessory:item.id),chosen=isHeads?item.id===selectedHead:item.id===selectedAccessory;
   return '<button type="button" class="mj-avatar-choice '+(chosen?"selected":"")+'" data-avatar-choice="'+item.id+'" aria-pressed="'+chosen+'"><span class="mj-avatar-choice-art">'+MJAvatars.render(key,"mj-avatar-choice-svg")+'</span><span class="mj-avatar-choice-name">'+item.name+'</span>'+(chosen?'<span class="mj-avatar-choice-check">✓</span>':"")+'</button>';
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
 $("#close-avatar-picker").addEventListener("click",close);
 studio.addEventListener("click",event=>{if(event.target===studio)close()});
 document.addEventListener("keydown",onKey);
 $("#done-avatar-picker").addEventListener("click",async()=>{
  if(saving)return;
  saving=true;const button=$("#done-avatar-picker");button.disabled=true;button.textContent="SAQLANMOQDA...";
  try{
   const response=await api("player/avatar",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin,player_id:player.id,avatar:getKey()})});
   player.avatar=response.avatar||getKey();sessionStorage.setItem("mj-player-"+pin,JSON.stringify(player));
   const preview=$("#waiting-avatar-art");if(preview)preview.innerHTML=MJAvatars.render(player.avatar,"mj-avatar-art");
   close();
  }catch(error){const message=$("#avatar-save-error");if(message)message.textContent=error.message;button.disabled=false;button.innerHTML='TAYYOR <b>✓</b>';saving=false}
 });
}
function waiting(){
 lastScreen="waiting";clearInterval(timer);
 const count=(data?.players||[]).length,mode=data?.session?.mode||"classic",specialMode=mode==="shooter"||mode==="racing",loadout=loadoutFor(mode,player.loadout),character=specialMode?loadoutVisual(mode,player.loadout):avatarIcon(player.avatar);
 const modeTitle=mode==="shooter"?"Jang maydoniga tayyorlan!":mode==="racing"?"Start chizig‘iga tayyor!":"Hamma tayyormi?";
 const modeCopy=mode==="shooter"?"Jangching: "+(loadout?.name||"Jangchi")+". To‘g‘ri javob bilan banditlarni yeng!":mode==="racing"?"Mashinang: "+(loadout?.name||"Poyga mashinasi")+". To‘g‘ri javob bilan tezlikni oshir!":"O‘qituvchingiz o‘yinni boshlashi bilan savollar shu yerda paydo bo‘ladi. Sahifani yopmang!";
 const avatarControl=specialMode?'<div class="player-big student-player-avatar mj-waiting-avatar mj-waiting-loadout" aria-label="'+(mode==="shooter"?"Tanlangan jangchi":"Tanlangan mashina")+'"><span id="waiting-avatar-art">'+character+'</span></div>':'<button type="button" class="player-big student-player-avatar mj-waiting-avatar" id="waiting-avatar" aria-label="Qahramonni o‘zgartirish"><span id="waiting-avatar-art">'+character+'</span><span class="mj-waiting-avatar-edit">✎</span></button>';
 const editLink=specialMode?'<div class="mj-waiting-edit-link mj-waiting-loadout-label">'+(mode==="shooter"?"⚔ JANGCHI TANLANDI":"🏁 MASHINA TANLANDI")+'</div>':'<button type="button" class="mj-waiting-edit-link" id="waiting-avatar-link">✎ Qahramonni o‘zgartirish</button>';
 root.innerHTML='<section class="student-card student-waiting-card"><div class="student-waiting-status"><i></i> O‘YINGA MUVAFFAQIYATLI QO‘SHILDING</div><div class="student-waiting-orbit"><span class="student-orbit-ring ring-one"></span><span class="student-orbit-ring ring-two"></span><span class="student-orbit-spark spark-one">✦</span><span class="student-orbit-spark spark-two">✧</span>'+avatarControl+'</div><div class="student-card-eyebrow">SALOM, '+esc(player.nickname.toUpperCase())+'!</div><h1 class="student-card-title">'+modeTitle+'</h1><p class="student-card-copy">'+modeCopy+'</p>'+editLink+'<div class="student-waiting-player-count" id="lobby-player-count">'+count+' nafar o‘quvchi o‘yinga qo‘shildi</div><div class="student-waiting-animation"><span></span><span></span><span></span><b>O‘YIN KUTILMOQDA</b></div><div class="student-waiting-footer"><span class="student-pin-badge">PIN '+pin+'</span><span class="student-score-pill">★ '+Number(player.score||0).toLocaleString()+' ball</span></div></section>';
 $("#waiting-avatar")?.addEventListener("click",openAvatarStudio);
 $("#waiting-avatar-link")?.addEventListener("click",openAvatarStudio);
}
function paused(){
 lastScreen="paused";clearInterval(timer);
 root.innerHTML='<section class="student-card student-state-card student-paused-card"><div class="student-state-icon paused-icon">Ⅱ</div><div class="student-card-eyebrow">BIR OZ TANAFFUS</div><h1 class="student-card-title">O‘yin pauzada</h1><p class="student-card-copy">Xavotir olma! O‘qituvchingiz o‘yinni davom ettirishi bilan yana boshlaymiz.</p><div class="student-waiting-animation"><span></span><span></span><span></span><b>DAVOM ETISH KUTILMOQDA</b></div></section>';
}
function revealed(){
 lastScreen="revealed";clearInterval(timer);
 const q=data.current_question||{},mine=data.player_answer,free=["poll","word_cloud","open_ended","brainstorm"].includes(q.type);
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
 const list=data.leaderboard||[],me=list.findIndex(p=>p.id===player.id),place=me>=0?me+1:null;
 root.innerHTML='<section class="student-card student-finish-card"><div class="student-trophy-stage"><span class="trophy-rays">✦</span><span class="trophy-icon">🏆</span><span class="trophy-confetti confetti-a">✦</span><span class="trophy-confetti confetti-b">✧</span></div><div class="student-card-eyebrow">BELLASHUV YAKUNLANDI</div><h1 class="student-card-title">Barakalla, '+esc(player.nickname)+'!</h1><p class="student-card-copy">Sen ajoyib qatnashding. Keyingi safar undan ham zo‘r natija ko‘rsat!</p><div class="student-final-score"><span>JAMI TO‘PLAGAN BALLARING</span><strong>'+Number(player.score||0).toLocaleString()+'</strong><small>ball</small></div>'+(place?'<div class="student-rank-note">🏅 Sen '+place+'-o‘rinni egallading!</div>':"")+'<div class="student-leaderboard"><div class="student-leaderboard-head"><strong>🏆 Yakuniy reyting</strong><span>'+list.length+' o‘yinchi</span></div><div class="final-list">'+list.map((p,i)=>'<div class="'+(p.id===player.id?"is-me":"")+'"><strong><span class="student-rank-number">'+(i+1)+'</span>'+avatarIcon(p.avatar)+' '+esc(p.nickname)+(p.id===player.id?' <small>SEN</small>':"")+'</strong><b>'+Number(p.score||0).toLocaleString()+' ball</b></div>').join("")+'</div></div><a href="/" class="student-primary-button student-home-button"><span>BOSH SAHIFAGA QAYTISH</span><b>→</b></a></section>';
}
function raceBoard(){const list=(data.players||[]).slice().sort((a,b)=>b.score-a.score).slice(0,5),max=Math.max(1,...list.map(p=>p.score));return '<div class="race-board">'+list.map(p=>'<div class="race-row"><span>'+avatarIcon(p.avatar)+' '+esc(p.nickname)+'</span><div><i style="width:'+Math.max(5,p.score/max*100)+'%"></i></div><b>'+p.score+'</b></div>').join("")+'</div>'}
function startTimer(seconds){clearInterval(timer);const start=Date.now();timer=setInterval(()=>{const left=Math.max(0,seconds-(Date.now()-start)/1000),n=$("#timer-number"),bar=$("#timer-fill");if(n)n.textContent=Math.ceil(left);if(bar)bar.style.width=(left/seconds*100)+"%";if(left<=0){clearInterval(timer);answered=data?.session?.current_question??answered;const area=$("#answer-area");if(area)area.querySelectorAll("button,input,textarea").forEach(x=>x.disabled=true);const st=$("#answer-status");if(st)st.textContent="Vaqt tugadi — keyingi savolni kuting."}},150)}
let puzzleOrder=[],selectedMultiAnswers=new Set();
function studentMediaMarkup(value){if(!value)return "";if(/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/i.test(value))return '<div class="student-media"><img src="'+value+'" alt="Savol uchun rasm"></div>';try{const u=new URL(value);if(!["http:","https:"].includes(u.protocol))return "";const safe=esc(u.href),host=u.hostname.toLowerCase(),id=(host==="youtu.be"?u.pathname.slice(1):u.searchParams.get("v"))||"";if((host==="youtube.com"||host.endsWith(".youtube.com")||host==="youtu.be")&&/^[A-Za-z0-9_-]{6,15}$/.test(id))return '<div class="student-media"><iframe class="student-video-frame" src="https://www.youtube-nocookie.com/embed/'+esc(id)+'" title="Savol videosi" loading="lazy" allowfullscreen></iframe></div>';if(/\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(u.pathname))return '<div class="student-media"><img src="'+safe+'" alt="Savol uchun media"></div>';if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(u.pathname))return '<div class="student-media"><video src="'+safe+'" controls playsinline></video></div>';return '<div class="student-media student-media-link"><a href="'+safe+'" target="_blank" rel="noopener">Savolga biriktirilgan media ↗</a></div>'}catch{return ""}}
function gameScene(mode,phase="playing",correct=null){
 const index=Number(data?.session?.current_question||0),players=(data?.players||[]).slice().sort((a,b)=>Number(b.score||0)-Number(a.score||0)),rank=Math.max(0,players.findIndex(p=>Number(p.id)===Number(player.id))),loadout=loadoutFor(mode,player.loadout),defeated=Math.max(0,Number(player.enemies_defeated)||0),health=Math.max(0,Math.min(100,Number(player.health??100)));
 if(mode==="shooter"){
  const hero=loadoutVisual("shooter",player.loadout),bandit='<svg class="mj-bandit-svg" viewBox="0 0 90 110" aria-label="Bandit"><ellipse cx="45" cy="103" rx="27" ry="5" fill="#2b1b2544"/><path d="M17 102q1-35 28-35t28 35Z" fill="#583e39" stroke="#2e2528" stroke-width="3"/><circle cx="45" cy="43" r="25" fill="#d39a6b" stroke="#69483d" stroke-width="3"/><path d="M12 36 28 13h34l16 23Z" fill="#a96d31" stroke="#5e3a24" stroke-width="3"/><path d="M7 36h76" stroke="#4a2d24" stroke-width="6" stroke-linecap="round"/><path d="M34 44h5m12 0h5" stroke="#2a2022" stroke-width="4" stroke-linecap="round"/><path d="M36 59q9-6 18 0" fill="none" stroke="#5e332d" stroke-width="3"/><path d="M31 75 45 86l14-11" fill="none" stroke="#d5b38b" stroke-width="3"/></svg>',names=["Qaroqchi","Cho‘l banditi","Temir niqob","Soya boshliq","So‘nggi raqib"],enemyIndex=phase==="revealed"&&correct===true?Math.max(0,defeated-1):defeated,enemy=names[Math.min(names.length-1,enemyIndex%names.length)];
  return '<div class="mj-game-scene mj-shooter-scene '+(phase==="revealed"?(correct===true?"is-victory":correct===false?"is-damaged":""):"")+'"><div class="mj-shooter-sky"><span class="mj-shooter-sun"></span><i class="mj-shooter-cloud cloud-a"></i><i class="mj-shooter-cloud cloud-b"></i><div class="mj-shooter-mesa mesa-back"></div><div class="mj-shooter-mesa mesa-front"></div><div class="mj-shooter-ground"></div><div class="mj-shooter-dust dust-a"></div><div class="mj-shooter-dust dust-b"></div><div class="mj-shooter-battle-label"><b>DUEL ARENA</b><span>RAQIB '+(defeated+1)+'</span></div><div class="mj-shooter-hero"><span class="mj-shooter-shadow"></span><b>'+hero+'</b><small>'+esc(loadout?.name||"Jangchi")+'</small><span class="mj-player-health"><i style="width:'+health+'%"></i></span><small class="mj-health-label">HP '+health+'</small></div><div class="mj-shooter-projectile"></div><div class="mj-shooter-enemy"><span class="mj-enemy-health"><i style="width:'+(phase==="revealed"&&correct===true?"0":"100")+'%"></i></span><b>'+bandit+'</b><small>'+enemy+'</small></div>'+(phase==="revealed"?'<div class="mj-shooter-impact">'+(correct===true?"💥 ZARB! RAQIBGA TEGDI":correct===false?"💢 SEN ZARAR OLDING":"JANG DAVOM ETADI")+'</div>':'')+'</div></div>';
 }
 if(mode==="racing"){
  const car=loadoutVisual("racing",player.loadout),progress=Math.max(8,Math.min(94,12+rank*13+Number(player.score||0)/Math.max(1,players[0]?.score||1)*28));
  const rivals=players.filter(item=>Number(item.id)!==Number(player.id)).slice(0,8).map(item=>(item.loadout||"vortex")+":"+Number(item.score||0)).join(","),leaderScore=Number(players[0]?.score||0);
  return '<div class="mj-game-scene mj-racing-scene '+(phase==="revealed"?(correct===true?"is-boost":correct===false?"is-slow":""):"")+'" data-loadout="'+(player.loadout||"falcon")+'" data-progress="'+progress+'" data-rank="'+rank+'" data-rivals="'+rivals+'" data-leader-score="'+leaderScore+'"><div class="mj-race-sky"><span class="mj-race-sun"></span><i class="mj-race-hill hill-a"></i><i class="mj-race-hill hill-b"></i></div><div class="mj-race-track"><div class="mj-race-barrier barrier-left"></div><div class="mj-race-barrier barrier-right"></div><div class="mj-race-lane lane-one"></div><div class="mj-race-lane lane-two"></div><div class="mj-race-car rival rival-one">'+(loadoutVisual("racing",players[1]?.loadout)||loadoutVisual("racing","vortex"))+'</div><div class="mj-race-car rival rival-two">'+(loadoutVisual("racing",players[2]?.loadout)||loadoutVisual("racing","falcon"))+'</div><div class="mj-race-car player-car" style="--car-progress:'+progress+'%">'+car+'</div><div class="mj-race-speed-lines"></div><div class="mj-race-finish">FINISH</div></div><div class="mj-race-hud"><span>🏁 POG‘ONA <b>'+(rank+1)+'</b></span><span>⚡ BALL <b>'+Number(player.score||0).toLocaleString()+'</b></span><span>'+(phase==="revealed"?(correct===true?"TURBO! 🚀":correct===false?"TEZLIK KAMAYDI":"DAVOM ETAMIZ"):"TO‘G‘RI JAVOB = TEZLIK ↑")+'</span></div></div>';
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
 const mode=data.session.mode||"classic",modeNames={classic:"KLASSIK",team:"JAMOAVIY",marble:"SHARLAR POYGASI",racing:"AVTOMOBIL POYGASI",shooter:"SHOOTER",accuracy:"ANIQLIK",confidence:"ISHONCH",kingdoms:"RANGLAR QIROLLIGI",tower:"ENG BALAND MINORA",treasure:"XAZINA IZLOVCHILAR",submarine:"SUVOSTI JAMOASI",robot:"ROBOTLAR POYGASI",cosmic:"KOINOT SARI"},modeLabel=modeNames[mode]||"KLASSIK",type=q.type||"quiz",mediaHtml=studentMediaMarkup(q.media||"");
 selectedMultiAnswers=new Set();puzzleOrder=[];let answerHtml="";
 if(type==="slider"){const min=Number(q.options?.[0]?.text??0),max=Number(q.options?.[1]?.text??100),step=Number(q.options?.[2]?.text??1),lo=Number.isFinite(min)?min:0,hi=Number.isFinite(max)&&max>lo?max:100,st=Number.isFinite(step)&&step>0?step:1,mid=lo+(hi-lo)/2;answerHtml='<form id="slider-answer-form" class="student-slider-answer"><div class="student-slider-value" id="slider-value">'+mid+'</div><input id="slider-input" type="range" min="'+lo+'" max="'+hi+'" step="'+st+'" value="'+mid+'"><div class="student-slider-limits"><span>'+lo+'</span><span>'+hi+'</span></div><button class="student-primary-button" type="submit">JAVOBNI YUBORISH →</button></form>'}
 else if(type==="puzzle"){puzzleOrder=(q.options||[]).map(o=>String(o.text||o));for(let i=puzzleOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[puzzleOrder[i],puzzleOrder[j]]=[puzzleOrder[j],puzzleOrder[i]]}answerHtml='<div class="student-puzzle-answer"><p>Javoblarni to‘g‘ri tartibga keltiring:</p><div id="puzzle-items">'+puzzleOrder.map((v,i)=>'<div class="student-puzzle-row"><span>'+(i+1)+'</span><strong>'+esc(v)+'</strong><div><button type="button" data-puzzle-move="'+i+'" data-direction="-1" '+(i===0?'disabled':'')+'>↑</button><button type="button" data-puzzle-move="'+i+'" data-direction="1" '+(i===puzzleOrder.length-1?'disabled':'')+'>↓</button></div></div>').join('')+'</div><button type="button" id="submit-puzzle" class="student-primary-button">TARTIBNI YUBORISH →</button></div>'}
 else if(type==="quiz"&&q.multi_select){answerHtml='<div class="student-multi-hint">Bir nechta to‘g‘ri javob bor. Barcha mos javoblarni belgilang.</div><div class="student-multi-grid">'+(q.options||[]).map((o,i)=>'<button type="button" class="student-multi-option '+["red","blue","yellow","green"][i%4]+'" data-multi-answer="'+esc(o.text||o)+'"><span class="student-multi-check"></span><span>'+esc(o.text||o)+'</span></button>').join('')+'</div><button type="button" id="submit-multi" class="student-primary-button" disabled>JAVOBLARNI YUBORISH →</button>'}
 else if(["type_answer","open_ended","word_cloud","brainstorm"].includes(type)){const word=type==="word_cloud",open=type==="open_ended",brain=type==="brainstorm",max=word?20:open?250:brain?400:type==="type_answer"?20:75,field=open||brain?'<textarea class="field" id="typed-answer" maxlength="'+max+'" rows="'+(brain?4:3)+'" placeholder="'+(brain?"Har bir g‘oyani yangi qatordan yozing…":open?"Fikringizni yozing…":"Javobingizni yozing…")+'"></textarea>':'<input class="field" id="typed-answer" maxlength="'+max+'" placeholder="'+(word?"Bitta so‘z yoki qisqa ibora…":type==="type_answer"?"Qisqa javob (20 belgigacha)…":"Javobingizni yozing…")+'" autocomplete="off">';answerHtml='<form id="answer-form" class="typed-answer student-typed-answer">'+field+'<button class="student-primary-button" type="submit"><span>JAVOBNI YUBORISH</span><b>→</b></button></form>'}
 else{answerHtml=(q.options||[]).map((o,i)=>'<button class="answer-tile student-answer-tile '+["red","blue","yellow","green"][i%4]+'" data-answer="'+esc(o.text||o)+'"><span class="answer-symbol">'+["▲","◆","●","■"][i%4]+'</span><span>'+esc(o.text||o)+'</span><b class="student-answer-arrow">→</b></button>').join('')}
 root.innerHTML='<section class="question-wrap student-question-stage mj-question-v2"><div class="question-top student-game-toolbar"><div class="student-game-title"><span class="student-mini-logo">✦</span><span>'+esc(data.session.title)+'</span></div><span class="pill student-mode-pill">'+esc(modeLabel)+'</span><span class="student-pin-badge">PIN '+pin+'</span><div class="student-player-chip"><span>'+avatarIcon(player.avatar)+'</span><b>'+esc(player.nickname)+'</b><i>★ '+Number(player.score||0).toLocaleString()+'</i></div></div><div class="mj-question-v2-card"><div class="mj-question-v2-meta"><span>SAVOL '+(data.session.current_question+1)+' / '+(data.questions?.length||"?")+'</span><span>'+esc(modeLabel)+'</span></div><h1 class="display student-question-title">'+esc(q.prompt)+'</h1>'+(mediaHtml?'<div class="mj-question-v2-media">'+mediaHtml+'</div>':'<div class="mj-question-v2-media mj-question-media-empty"><span>✦</span><small>SAVOLGA DIQQAT QILING</small></div>')+gameScene(mode,"playing")+'<div class="mj-question-v2-timer"><span>QOLGAN VAQT</span><div><i id="timer-fill"></i></div><strong id="timer-number">'+q.time+'</strong></div><div id="answer-area" class="answer-grid student-answer-grid">'+answerHtml+'</div><div id="answer-status" class="answer-status student-answer-status" aria-live="polite"></div></div><div class="student-game-footer"><span>✦ MUDARRIS JOIN</span><span>Javobni tanla — ballarni yut!</span></div></section>';
 const area=$("#answer-area");
 if(type==="quiz"&&q.multi_select){area.querySelectorAll("[data-multi-answer]").forEach(b=>b.addEventListener("click",()=>{const v=b.dataset.multiAnswer;if(selectedMultiAnswers.has(v)){selectedMultiAnswers.delete(v);b.classList.remove("selected")}else{selectedMultiAnswers.add(v);b.classList.add("selected")}$("#submit-multi").disabled=selectedMultiAnswers.size===0}));$("#submit-multi").addEventListener("click",()=>submit(JSON.stringify(Array.from(selectedMultiAnswers))))}
 else if(type==="slider"){const slider=$("#slider-input");slider.addEventListener("input",()=>$("#slider-value").textContent=slider.value);$("#slider-answer-form").onsubmit=e=>{e.preventDefault();submit(slider.value)}}
 else if(type==="puzzle"){$("#puzzle-items").addEventListener("click",e=>{const b=e.target.closest("[data-puzzle-move]");if(!b)return;const i=Number(b.dataset.puzzleMove),j=i+Number(b.dataset.direction);if(j<0||j>=puzzleOrder.length)return;[puzzleOrder[i],puzzleOrder[j]]=[puzzleOrder[j],puzzleOrder[i]];$("#puzzle-items").innerHTML=puzzleOrder.map((v,k)=>'<div class="student-puzzle-row"><span>'+(k+1)+'</span><strong>'+esc(v)+'</strong><div><button type="button" data-puzzle-move="'+k+'" data-direction="-1" '+(k===0?'disabled':'')+'>↑</button><button type="button" data-puzzle-move="'+k+'" data-direction="1" '+(k===puzzleOrder.length-1?'disabled':'')+'>↓</button></div></div>').join('')});$("#submit-puzzle").addEventListener("click",()=>submit(JSON.stringify(puzzleOrder)))}
 else if(["type_answer","open_ended","word_cloud","brainstorm"].includes(type))$("#answer-form").onsubmit=e=>{e.preventDefault();submit($("#typed-answer").value)};
 else area.onclick=e=>{const b=e.target.closest("[data-answer]");if(b)submit(b.dataset.answer)};
 startTimer(Number(q.time)||20);
}
async function submit(answer){
 if(answer===undefined||answer===null||String(answer).trim()===""||answered===data.session.current_question)return;
 answered=data.session.current_question;clearInterval(timer);const area=$("#answer-area");if(area)area.querySelectorAll("button,input,textarea").forEach(x=>x.disabled=true);
 try{const d=await api("answer",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin,player_id:player.id,answer})});player.score=d.total;if(d.health!==null&&d.health!==undefined)player.health=d.health;if(d.enemies_defeated!==null&&d.enemies_defeated!==undefined)player.enemies_defeated=d.enemies_defeated;sessionStorage.setItem("mj-player-"+pin,JSON.stringify(player));const st=$("#answer-status");if(st){st.classList.toggle("is-correct",d.correct===true);st.classList.toggle("is-wrong",d.correct===false);st.classList.toggle("is-recorded",d.correct===null);st.textContent=d.correct===null?"✓ Javobingiz qabul qilindi!":(d.correct?"✓ To‘g‘ri javob! +":"✕ Bu safar noto‘g‘ri. +")+d.points+" ball"}}
 catch(e){answered=-1;const st=$("#answer-status");if(st){st.classList.remove("is-correct","is-wrong");st.textContent=e.message}if(area)area.querySelectorAll("button,input,textarea").forEach(x=>x.disabled=false)}
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
  const me=(data.players||[]).find(item=>Number(item.id)===Number(player.id));if(me)player={...player,...me};
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