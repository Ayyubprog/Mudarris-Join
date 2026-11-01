(()=>{
const $=s=>document.querySelector(s),root=$("#play-root"),pin=new URLSearchParams(location.search).get("pin")||"";
let player=null,data=null,lastQuestion=-2,answered=-1,timer=null,lastScreen="";
const avatars=["🐯","🌍","💀","👽","🐱","🦊","🤖","👻","🦁","🐼","🚀","👑"];
const avatarKeys=["tiger","earth","skull","alien","cat","fox","robot","ghost","lion","panda","rocket","crown"];
const avatarIcons={tiger:"🐯",earth:"🌍",skull:"💀",alien:"👽",cat:"🐱",fox:"🦊",robot:"🤖",ghost:"👻",lion:"🦁",panda:"🐼",rocket:"🚀",crown:"👑"};
function avatarIcon(key){return avatarIcons[key]||"🙂"}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(path,opts){const r=await fetch("/api/"+path,opts||{}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"So‘rov bajarilmadi");return d}
function showJoin(){
 if(lastScreen==="join")return;
 lastScreen="join";
 root.innerHTML='<section class="student-card student-onboard-card"><div class="student-card-heading"><span class="student-step-chip">01</span><span class="student-card-eyebrow">O‘YINGA TAYYORLAN</span><span class="student-heading-spark">✦</span></div><div class="student-avatar-stage"><span class="student-avatar-halo"></span><span class="student-avatar-stage-icon">🎯</span></div><h1 class="student-card-title">Ismingni tanla!</h1><p class="student-card-copy">Do‘stlaring seni qanday nom bilan ko‘rishini xohlaysan?</p><form id="join-player" class="student-player-form"><label for="nickname">TAXALLUSING</label><input class="field student-nickname-input" id="nickname" maxlength="24" minlength="2" required placeholder="Ismingni yoz..." autocomplete="nickname"><div class="student-avatar-heading"><span>AVATARINGNI TANLA</span><small>O‘zingga yoqqanini tanla</small></div><div class="avatar-grid student-avatar-grid">'+avatars.map((a,i)=>'<button type="button" class="avatar student-avatar '+(i===0?"selected":"")+'" data-avatar="'+i+'" aria-label="Avatar '+(i+1)+'" aria-pressed="'+(i===0?"true":"false")+'">'+a+'</button>').join("")+'</div><button class="student-primary-button student-enter-button" type="submit"><span>KUTISH XONASIGA KIRISH</span><b>→</b></button><div id="join-error" class="student-form-error" role="alert" aria-live="polite"></div></form><div class="student-privacy-note"><span>✓</span> Ro‘yxatdan o‘tish shart emas</div></section>';
 let chosen=0;
 root.querySelectorAll("[data-avatar]").forEach(b=>b.onclick=()=>{chosen=Number(b.dataset.avatar);root.querySelectorAll(".student-avatar").forEach(x=>{const selected=x===b;x.classList.toggle("selected",selected);x.setAttribute("aria-pressed",String(selected))})});
 $("#nickname").focus({preventScroll:true});
 $("#join-player").onsubmit=async e=>{
  e.preventDefault();
  const button=root.querySelector("button[type=submit]"),error=$("#join-error");
  if($("#nickname").value.trim().length<2){error.textContent="Taxallus kamida 2 ta belgidan iborat bo‘lsin.";return}
  button.disabled=true;button.querySelector("span").textContent="QO‘SHILMOQDA...";
  try{const d=await api("join",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin,nickname:$("#nickname").value,avatar:avatarKeys[chosen]})});player=d.player;sessionStorage.setItem("mj-player-"+pin,JSON.stringify(player));lastScreen="";await load()}
  catch(x){error.textContent=x.message;button.disabled=false;button.querySelector("span").textContent="KUTISH XONASIGA KIRISH"}
 };
}
function waiting(){
 lastScreen="waiting";
 root.innerHTML='<section class="student-card student-waiting-card"><div class="student-waiting-status"><i></i> O‘YINGA MUVAFFAQIYATLI QO‘SHILDING</div><div class="student-waiting-orbit"><span class="student-orbit-ring ring-one"></span><span class="student-orbit-ring ring-two"></span><span class="student-orbit-spark spark-one">✦</span><span class="student-orbit-spark spark-two">✧</span><div class="player-big student-player-avatar">'+avatarIcon(player.avatar)+'</div></div><div class="student-card-eyebrow">SALOM, '+esc(player.nickname.toUpperCase())+'!</div><h1 class="student-card-title">Hamma tayyormi?</h1><p class="student-card-copy">O‘qituvchingiz o‘yinni boshlashi bilan savollar shu yerda paydo bo‘ladi. Sahifani yopmang!</p><div class="student-waiting-animation"><span></span><span></span><span></span><b>O‘YIN KUTILMOQDA</b></div><div class="student-waiting-footer"><span class="student-pin-badge">PIN '+pin+'</span><span class="student-score-pill">★ '+Number(player.score||0).toLocaleString()+' ball</span></div></section>';
}
function paused(){
 lastScreen="paused";clearInterval(timer);
 root.innerHTML='<section class="student-card student-state-card student-paused-card"><div class="student-state-icon paused-icon">Ⅱ</div><div class="student-card-eyebrow">BIR OZ TANAFFUS</div><h1 class="student-card-title">O‘yin pauzada</h1><p class="student-card-copy">Xavotir olma! O‘qituvchingiz o‘yinni davom ettirishi bilan yana boshlaymiz.</p><div class="student-waiting-animation"><span></span><span></span><span></span><b>DAVOM ETISH KUTILMOQDA</b></div></section>';
}
function finish(){
 lastScreen="finished";clearInterval(timer);
 const list=data.leaderboard||[],me=list.findIndex(p=>p.id===player.id),place=me>=0?me+1:null;
 root.innerHTML='<section class="student-card student-finish-card"><div class="student-trophy-stage"><span class="trophy-rays">✦</span><span class="trophy-icon">🏆</span><span class="trophy-confetti confetti-a">✦</span><span class="trophy-confetti confetti-b">✧</span></div><div class="student-card-eyebrow">BELLASHUV YAKUNLANDI</div><h1 class="student-card-title">Barakalla, '+esc(player.nickname)+'!</h1><p class="student-card-copy">Sen ajoyib qatnashding. Keyingi safar undan ham zo‘r natija ko‘rsat!</p><div class="student-final-score"><span>JAMI TO‘PLAGAN BALLARING</span><strong>'+Number(player.score||0).toLocaleString()+'</strong><small>ball</small></div>'+(place?'<div class="student-rank-note">🏅 Sen '+place+'-o‘rinni egallading!</div>':"")+'<div class="student-leaderboard"><div class="student-leaderboard-head"><strong>🏆 Yakuniy reyting</strong><span>'+list.length+' o‘yinchi</span></div><div class="final-list">'+list.map((p,i)=>'<div class="'+(p.id===player.id?"is-me":"")+'"><strong><span class="student-rank-number">'+(i+1)+'</span>'+avatarIcon(p.avatar)+' '+esc(p.nickname)+(p.id===player.id?' <small>SEN</small>':"")+'</strong><b>'+Number(p.score||0).toLocaleString()+' ball</b></div>').join("")+'</div></div><a href="/" class="student-primary-button student-home-button"><span>BOSH SAHIFAGA QAYTISH</span><b>→</b></a></section>';
}
function raceBoard(){const list=(data.players||[]).slice().sort((a,b)=>b.score-a.score).slice(0,5),max=Math.max(1,...list.map(p=>p.score));return '<div class="race-board">'+list.map(p=>'<div class="race-row"><span>'+avatarIcon(p.avatar)+' '+esc(p.nickname)+'</span><div><i style="width:'+Math.max(5,p.score/max*100)+'%"></i></div><b>'+p.score+'</b></div>').join("")+'</div>'}
function startTimer(seconds){clearInterval(timer);const start=Date.now();timer=setInterval(()=>{const left=Math.max(0,seconds-(Date.now()-start)/1000),n=$("#timer-number"),bar=$("#timer-fill");if(n)n.textContent=Math.ceil(left);if(bar)bar.style.width=(left/seconds*100)+"%";if(left<=0){clearInterval(timer);const area=$("#answer-area");if(area)area.querySelectorAll("button,input").forEach(x=>x.disabled=true);const st=$("#answer-status");if(st)st.textContent="Vaqt tugadi — keyingi savolni kuting."}},150)}
function question(q){
 lastScreen="question";
 const mode=data.session.mode||"classic",modeNames={classic:"KLASSIK",team:"JAMOAVIY",marble:"SHARLAR POYGASI",racing:"AVTOMOBIL POYGASI",accuracy:"ANIQLIK",confidence:"ISHONCH",kingdoms:"RANGLAR QIROLLIGI",tower:"ENG BALAND MINORA",treasure:"XAZINA IZLOVCHILAR",submarine:"SUVOSTI JAMOASI",robot:"ROBOTLAR POYGASI",cosmic:"KOINOT SARI"},modeLabel=modeNames[mode]||"KLASSIK",textTypes=["type_answer","open_ended","word_cloud","brainstorm","slider","puzzle"].includes(q.type),media=q.media||"",mediaHtml="";
 if(media){try{const u=new URL(media);if(["http:","https:"].includes(u.protocol)){const safe=esc(u.href);if(/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(u.pathname))mediaHtml='<div class="student-media"><img src="'+safe+'" alt="Savol uchun media"></div>';else mediaHtml='<div class="student-media student-media-link"><a href="'+safe+'" target="_blank" rel="noopener">Savolga biriktirilgan media ↗</a></div>'}}catch{mediaHtml=""}}
 root.innerHTML='<section class="question-wrap student-question-stage"><div class="question-top student-game-toolbar"><div class="student-game-title"><span class="student-mini-logo">✦</span><span>'+esc(data.session.title)+'</span></div><span class="pill student-mode-pill">'+esc(modeLabel)+'</span><span class="student-pin-badge">PIN '+pin+'</span><div class="student-player-chip"><span>'+avatarIcon(player.avatar)+'</span><b>'+esc(player.nickname)+'</b><i>★ '+Number(player.score||0).toLocaleString()+'</i></div></div><div class="question-card card student-question-card"><div class="student-question-meta"><span class="student-question-step">SAVOL <b>'+(data.session.current_question+1)+'</b></span><span class="student-question-hint">DIQQAT BILAN TANLA!</span></div><h1 class="display student-question-title">'+esc(q.prompt)+'</h1>'+mediaHtml+'<div class="question-timer student-question-timer"><span class="student-timer-label">QOLGAN VAQT</span><div><i id="timer-fill"></i></div><strong id="timer-number">'+q.time+'</strong></div><div id="answer-area" class="answer-grid student-answer-grid">'+(textTypes?'<form id="answer-form" class="typed-answer student-typed-answer"><input class="field" id="typed-answer" placeholder="Javobingizni yozing…" autocomplete="off"><button class="student-primary-button" type="submit"><span>JAVOBNI YUBORISH</span><b>→</b></button></form>':(q.options||[]).map((o,i)=>'<button class="answer-tile student-answer-tile '+["red","blue","yellow","green"][i%4]+'" data-answer="'+esc(o.text||o)+'"><span class="answer-symbol">'+["▲","◆","●","■"][i%4]+'</span><span>'+esc(o.text||o)+'</span><b class="student-answer-arrow">→</b></button>').join(""))+'</div><div id="answer-status" class="answer-status student-answer-status" aria-live="polite"></div>'+(mode==="marble"||mode==="racing"?raceBoard():"")+'</div><div class="student-game-footer"><span>✦ MUDARRIS JOIN</span><span>Har bir javob muhim!</span></div></section>';
 const area=$("#answer-area");
 if(textTypes)$("#answer-form").onsubmit=e=>{e.preventDefault();submit($("#typed-answer").value)};
 else area.onclick=e=>{const b=e.target.closest("[data-answer]");if(b)submit(b.dataset.answer)};
 startTimer(Number(q.time)||20);
}
async function submit(answer){if(!answer||answered===data.session.current_question)return;answered=data.session.current_question;clearInterval(timer);const area=$("#answer-area");if(area)area.querySelectorAll("button,input").forEach(x=>x.disabled=true);try{const d=await api("answer",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin,player_id:player.id,answer})});player.score=d.total;sessionStorage.setItem("mj-player-"+pin,JSON.stringify(player));const st=$("#answer-status");if(st){st.classList.toggle("is-correct",!!d.correct);st.classList.toggle("is-wrong",!d.correct);st.textContent=(d.correct?"✓ To‘g‘ri javob! +":"✕ Bu safar noto‘g‘ri. +")+d.points+" ball"}}catch(e){const st=$("#answer-status");if(st)st.textContent=e.message}}
function render(){
 if(!data)return;
 if(data.session.status==="waiting"){if(lastScreen!=="waiting")waiting();return}
 if(data.session.status==="paused"){if(lastScreen!=="paused")paused();return}
 if(data.session.status==="finished"){if(lastScreen!=="finished")finish();return}
 const q=data.current_question;
 if(!q){if(lastScreen!=="waiting")waiting();return}
 if(data.session.current_question!==lastQuestion||lastScreen!=="question"){lastQuestion=data.session.current_question;answered=-1;question(q)}
}
async function load(){
 try{
  data=await api("session/"+pin);
  if(!player){const saved=sessionStorage.getItem("mj-player-"+pin);if(saved)player=JSON.parse(saved)}
  if(!player){
   if(data.session.status==="waiting"){if(lastScreen!=="join")showJoin()}
   else if(lastScreen!=="started"){lastScreen="started";root.innerHTML='<section class="student-card student-state-card student-error-card"><div class="student-state-icon">🚦</div><div class="student-card-eyebrow">O‘YIN BOSHLANIB BO‘LDI</div><h1 class="student-card-title">Kech qoldingmi?</h1><p class="student-card-copy">Bu o‘yin allaqachon boshlangan. O‘qituvchingizdan yangi PIN-kod so‘rang.</p><a href="/" class="student-primary-button student-home-button"><span>BOSHQA PIN KIRITISH</span><b>→</b></a></section>'}
   return;
  }
  const me=(data.players||[]).find(p=>p.id===player.id);if(me)player={...player,...me};render();
 }catch(e){
  const invalidPin=e.message==="O‘yin PIN-kodi topilmadi.";
  const screen=invalidPin?"invalid-pin":"load-error";
  if(lastScreen!==screen){
   lastScreen=screen;
   if(invalidPin){
    root.innerHTML='<section class="student-card student-state-card student-error-card"><div class="student-state-icon student-invalid-pin-icon" aria-hidden="true">✕</div><div class="student-card-eyebrow">PIN-KOD TOPILMADI</div><h1 class="student-card-title">Kod xato</h1><p class="student-card-copy">Bu 6 xonali PIN-kod topilmadi. Kodni tekshirib, qayta kiriting.</p><a href="/" class="student-primary-button student-home-button"><span>BOSHQA KOD KIRITISH</span><b>→</b></a></section>';
   }else{
    root.innerHTML='<section class="student-card student-state-card student-error-card"><div class="student-state-icon">⚠️</div><div class="student-card-eyebrow">ULANISHDA XATOLIK</div><h1 class="student-card-title">O‘yinga ulanib bo‘lmadi</h1><p class="student-card-copy">'+esc(e.message)+'</p><a href="/" class="student-primary-button student-home-button"><span>QAYTA URINISH</span><b>→</b></a></section>';
   }
  }
 }
}

if(!/^\d{6}$/.test(pin)){root.innerHTML='<section class="join-card card">O‘yin PIN-kodi noto‘g‘ri. <a href="/">Qayta urinib ko‘ring</a></section>';return}$("#pin-label").textContent="PIN "+pin;load();setInterval(load,1400);
})();