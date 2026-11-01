(()=>{
const $=s=>document.querySelector(s),root=$("#play-root"),pin=new URLSearchParams(location.search).get("pin")||"";
let player=null,data=null,lastQuestion=-2,answered=-1,timer=null,lastScreen="";
function avatarIcon(key){return window.MJAvatars?MJAvatars.render(key,"mj-avatar-art"):"🙂"}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(path,opts){const r=await fetch("/api/"+path,opts||{}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"So‘rov bajarilmadi");return d}
function showJoin(){
 if(lastScreen==="join")return;
 lastScreen="join";
 let selected=window.MJAvatars?MJAvatars.parts(MJAvatars.randomKey()):{head:{id:"fox"},accessory:{id:"none"},key:"fox:none"};
 let selectedHead=selected.head.id,selectedAccessory=selected.accessory.id,activeTab="heads";
 root.innerHTML=`<section class="student-card student-onboard-card mj-join-card">
  <div class="mj-join-kicker"><span class="mj-join-kicker-dot"></span> MUDARRIS JOIN · O‘YINCHI PROFILI</div>
  <h1 class="student-card-title mj-join-title">O‘yinga qo‘shil!</h1>
  <p class="student-card-copy mj-join-copy">Taxallusingni yoz. Senga tasodifiy qahramon tanladik — uni o‘zingga moslab olishing mumkin.</p>
  <button type="button" id="avatar-preview" class="mj-avatar-preview" aria-label="Qahramonni o‘zgartirish">
   <span id="avatar-preview-art">${MJAvatars.render(selected.key,"mj-avatar-large")}</span>
   <span class="mj-avatar-edit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg></span>
  </button>
  <button type="button" id="open-avatar-picker" class="mj-avatar-customize-link">Qahramonni o‘zgartirish <span>✦</span></button>
  <form id="join-player" class="student-player-form mj-join-form">
   <label for="nickname">TAXALLUSING</label>
   <input class="field student-nickname-input mj-join-nickname" id="nickname" maxlength="24" minlength="2" required placeholder="Ismingni yoz..." autocomplete="nickname">
   <button class="student-primary-button student-enter-button mj-join-submit" type="submit"><span>BELLASHUVGA QO‘SHILISH</span><b>→</b></button>
   <div id="join-error" class="student-form-error" role="alert" aria-live="polite"></div>
  </form>
  <div class="student-privacy-note mj-join-privacy"><span>✓</span> Akkaunt kerak emas · Faqat taxallus bilan kir</div>
  <div class="mj-avatar-backdrop" id="avatar-studio" hidden>
   <section class="mj-avatar-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-studio-title">
    <header class="mj-avatar-modal-head">
     <div><span class="mj-avatar-modal-kicker">SENING QIYOFANG</span><h2 id="avatar-studio-title">Qahramoningni yarat</h2></div>
     <button type="button" id="close-avatar-picker" class="mj-avatar-close" aria-label="Yopish">×</button>
    </header>
    <div class="mj-avatar-selected-preview"><span id="avatar-modal-art">${MJAvatars.render(selected.key,"mj-avatar-modal-art")}</span><div><strong id="avatar-character-name">${selected.head.name}</strong><small id="avatar-accessory-name">${selected.accessory.name}</small></div><span class="mj-avatar-live-dot"></span></div>
    <div class="mj-avatar-tabs" role="tablist" aria-label="Qahramon sozlamalari">
     <button type="button" class="mj-avatar-tab active" data-avatar-tab="heads" role="tab" aria-selected="true">Qahramonlar <span>${MJAvatars.heads.length}</span></button>
     <button type="button" class="mj-avatar-tab" data-avatar-tab="hats" role="tab" aria-selected="false">Aksessuarlar <span>${MJAvatars.hats.length}</span></button>
    </div>
    <div class="mj-avatar-gallery-wrap"><div class="mj-avatar-gallery" id="avatar-gallery"></div></div>
    <footer class="mj-avatar-modal-footer"><span>O‘zingga yoqqanini tanla ✨</span><button type="button" id="done-avatar-picker" class="mj-avatar-done">TAYYOR <b>✓</b></button></footer>
   </section>
  </div>
 </section>`;
 const getKey=()=>MJAvatars.key(selectedHead,selectedAccessory);
 const refreshPreview=()=>{
  const key=getKey(),parts=MJAvatars.parts(key);
  $("#avatar-preview-art").innerHTML=MJAvatars.render(key,"mj-avatar-large");
  $("#avatar-modal-art").innerHTML=MJAvatars.render(key,"mj-avatar-modal-art");
  $("#avatar-character-name").textContent=parts.head.name;
  $("#avatar-accessory-name").textContent=parts.accessory.name;
 };
 const renderGallery=()=>{
  const isHeads=activeTab==="heads",items=isHeads?MJAvatars.heads:MJAvatars.hats;
  document.querySelectorAll("[data-avatar-tab]").forEach(button=>{
   const active=button.dataset.avatarTab===activeTab;
   button.classList.toggle("active",active);button.setAttribute("aria-selected",String(active));
  });
  $("#avatar-gallery").innerHTML=items.map(item=>{
   const head=isHeads?item.id:selectedHead,accessory=isHeads?selectedAccessory:item.id;
   const key=MJAvatars.key(head,accessory),chosen=isHeads?item.id===selectedHead:item.id===selectedAccessory;
   return `<button type="button" class="mj-avatar-choice ${chosen?"selected":""}" data-avatar-choice="${item.id}" aria-pressed="${chosen}">
    <span class="mj-avatar-choice-art">${MJAvatars.render(key,"mj-avatar-choice-svg")}</span>
    <span class="mj-avatar-choice-name">${item.name}</span>
    ${chosen?'<span class="mj-avatar-choice-check">✓</span>':""}
   </button>`;
  }).join("");
 };
 const openPicker=()=>{
  $("#avatar-studio").hidden=false;activeTab="heads";refreshPreview();renderGallery();
  document.body.classList.add("mj-avatar-picker-open");
 };
 const closePicker=()=>{
  $("#avatar-studio").hidden=true;document.body.classList.remove("mj-avatar-picker-open");
 };
 $("#avatar-preview").addEventListener("click",openPicker);
 $("#open-avatar-picker").addEventListener("click",openPicker);
 $("#close-avatar-picker").addEventListener("click",closePicker);
 $("#done-avatar-picker").addEventListener("click",closePicker);
 $("#avatar-studio").addEventListener("click",event=>{if(event.target===$("#avatar-studio"))closePicker()});
 document.querySelectorAll("[data-avatar-tab]").forEach(button=>button.addEventListener("click",()=>{activeTab=button.dataset.avatarTab;renderGallery()}));
 $("#avatar-gallery").addEventListener("click",event=>{
  const choice=event.target.closest("[data-avatar-choice]");if(!choice)return;
  if(activeTab==="heads")selectedHead=choice.dataset.avatarChoice;
  else selectedAccessory=choice.dataset.avatarChoice;
  refreshPreview();renderGallery();
 });
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!$("#avatar-studio").hidden)closePicker()});
 $("#nickname").focus({preventScroll:true});
 $("#join-player").onsubmit=async event=>{
  event.preventDefault();
  const nickname=$("#nickname").value.trim().replace(/\s+/g," "),button=root.querySelector("button[type=submit]"),error=$("#join-error");
  if(nickname.length<2){error.textContent="Taxallus kamida 2 ta belgidan iborat bo‘lsin.";return}
  button.disabled=true;button.querySelector("span").textContent="O‘YINGA QO‘SHILMOQDA...";
  try{
   const response=await api("join",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin,nickname,avatar:getKey()})});
   player=response.player;sessionStorage.setItem("mj-player-"+pin,JSON.stringify(player));lastScreen="";await load();
  }catch(errorValue){error.textContent=errorValue.message;button.disabled=false;button.querySelector("span").textContent="BELLASHUVGA QO‘SHILISH"}
 };
}
function waiting(){
 lastScreen="waiting";clearInterval(timer);
 const count=(data?.players||[]).length;
 root.innerHTML='<section class="student-card student-waiting-card"><div class="student-waiting-status"><i></i> O‘YINGA MUVAFFAQIYATLI QO‘SHILDING</div><div class="student-waiting-orbit"><span class="student-orbit-ring ring-one"></span><span class="student-orbit-ring ring-two"></span><span class="student-orbit-spark spark-one">✦</span><span class="student-orbit-spark spark-two">✧</span><div class="player-big student-player-avatar">'+avatarIcon(player.avatar)+'</div></div><div class="student-card-eyebrow">SALOM, '+esc(player.nickname.toUpperCase())+'!</div><h1 class="student-card-title">Hamma tayyormi?</h1><p class="student-card-copy">O‘qituvchingiz o‘yinni boshlashi bilan savollar shu yerda paydo bo‘ladi. Sahifani yopmang!</p><div class="student-waiting-player-count" id="lobby-player-count">'+count+' nafar o‘quvchi o‘yinga qo‘shildi</div><div class="student-waiting-animation"><span></span><span></span><span></span><b>O‘YIN KUTILMOQDA</b></div><div class="student-waiting-footer"><span class="student-pin-badge">PIN '+pin+'</span><span class="student-score-pill">★ '+Number(player.score||0).toLocaleString()+' ball</span></div></section>';
}
function revealed(){
 lastScreen="revealed";clearInterval(timer);
 const q=data.current_question||{},mine=data.player_answer,free=["poll","word_cloud","open_ended","brainstorm"].includes(q.type);
 const values=value=>{try{const parsed=JSON.parse(String(value??""));return Array.isArray(parsed)?parsed:[String(value??"")]}catch{return [String(value??"")]}};
 const answerText=value=>{if(value===null||value===undefined||value==="")return "Javob yuborilmadi";try{const parsed=JSON.parse(String(value));return Array.isArray(parsed)?parsed.join(" · "):String(value)}catch{return String(value)}};
 const correct=values(q.correct).filter(Boolean),correctText=q.type==="puzzle"?correct.join(" → "):q.type==="slider"?String(q.correct??"—"):correct.join(" · ");
 const myAnswer=mine?answerText(mine.answer):"Javob yuborilmadi";
 const isCorrect=mine&&mine.correct!==null&&mine.correct!==undefined?Number(mine.correct)===1:null;
 const me=(data.players||[]).find(item=>Number(item.id)===Number(player.id));if(me)player={...player,...me};
 const resultLabel=!mine?"Bu savolga javob yubormadingiz":free?"Javobingiz qabul qilindi":isCorrect?"To‘g‘ri javob!":"Bu safar noto‘g‘ri";
 const resultClass=!mine?"neutral":free?"recorded":isCorrect?"correct":"wrong";
 root.innerHTML='<section class="student-card student-reveal-card"><div class="student-reveal-icon">'+(isCorrect?"🎉":free?"💬":mine?"💡":"⏱")+'</div><div class="student-card-eyebrow">SAVOL '+(Number(data.session.current_question)+1)+' NATIJASI</div><h1 class="student-card-title">'+(isCorrect?"Ajoyib!":free?"Fikringiz yuborildi":mine?"Keyingi safar uddalaysiz!":"Vaqt tugadi")+'</h1><div class="student-result-status '+resultClass+'">'+resultLabel+'</div><div class="student-result-question">'+esc(q.prompt||"")+'</div><div class="student-result-answer"><small>SENING JAVOBING</small><strong>'+esc(myAnswer)+'</strong></div>'+(free?'<div class="student-result-correct"><small>BAHOLASH</small><strong>Bu savol avtomatik baholanmaydi</strong></div>':'<div class="student-result-correct"><small>TO‘G‘RI JAVOB</small><strong>'+esc(correctText||"—")+'</strong></div>')+'<div class="student-result-score"><span>BU SAVOLDAGI BALL</span><strong>+'+Number(mine?.points||0).toLocaleString()+'</strong><small>JAMI: '+Number(player.score||0).toLocaleString()+' ball</small></div><div class="student-waiting-animation"><span></span><span></span><span></span><b>KEYINGI SAVOL KUTILMOQDA</b></div></section>';
}

function finish(){
 lastScreen="finished";clearInterval(timer);
 const list=data.leaderboard||[],me=list.findIndex(p=>p.id===player.id),place=me>=0?me+1:null;
 root.innerHTML='<section class="student-card student-finish-card"><div class="student-trophy-stage"><span class="trophy-rays">✦</span><span class="trophy-icon">🏆</span><span class="trophy-confetti confetti-a">✦</span><span class="trophy-confetti confetti-b">✧</span></div><div class="student-card-eyebrow">BELLASHUV YAKUNLANDI</div><h1 class="student-card-title">Barakalla, '+esc(player.nickname)+'!</h1><p class="student-card-copy">Sen ajoyib qatnashding. Keyingi safar undan ham zo‘r natija ko‘rsat!</p><div class="student-final-score"><span>JAMI TO‘PLAGAN BALLARING</span><strong>'+Number(player.score||0).toLocaleString()+'</strong><small>ball</small></div>'+(place?'<div class="student-rank-note">🏅 Sen '+place+'-o‘rinni egallading!</div>':"")+'<div class="student-leaderboard"><div class="student-leaderboard-head"><strong>🏆 Yakuniy reyting</strong><span>'+list.length+' o‘yinchi</span></div><div class="final-list">'+list.map((p,i)=>'<div class="'+(p.id===player.id?"is-me":"")+'"><strong><span class="student-rank-number">'+(i+1)+'</span>'+avatarIcon(p.avatar)+' '+esc(p.nickname)+(p.id===player.id?' <small>SEN</small>':"")+'</strong><b>'+Number(p.score||0).toLocaleString()+' ball</b></div>').join("")+'</div></div><a href="/" class="student-primary-button student-home-button"><span>BOSH SAHIFAGA QAYTISH</span><b>→</b></a></section>';
}
function raceBoard(){const list=(data.players||[]).slice().sort((a,b)=>b.score-a.score).slice(0,5),max=Math.max(1,...list.map(p=>p.score));return '<div class="race-board">'+list.map(p=>'<div class="race-row"><span>'+avatarIcon(p.avatar)+' '+esc(p.nickname)+'</span><div><i style="width:'+Math.max(5,p.score/max*100)+'%"></i></div><b>'+p.score+'</b></div>').join("")+'</div>'}
function startTimer(seconds){clearInterval(timer);const start=Date.now();timer=setInterval(()=>{const left=Math.max(0,seconds-(Date.now()-start)/1000),n=$("#timer-number"),bar=$("#timer-fill");if(n)n.textContent=Math.ceil(left);if(bar)bar.style.width=(left/seconds*100)+"%";if(left<=0){clearInterval(timer);answered=data?.session?.current_question??answered;const area=$("#answer-area");if(area)area.querySelectorAll("button,input,textarea").forEach(x=>x.disabled=true);const st=$("#answer-status");if(st)st.textContent="Vaqt tugadi — keyingi savolni kuting."}},150)}
let puzzleOrder=[],selectedMultiAnswers=new Set();
function studentMediaMarkup(value){if(!value)return "";try{const u=new URL(value);if(!["http:","https:"].includes(u.protocol))return "";const safe=esc(u.href),host=u.hostname.toLowerCase(),id=(host==="youtu.be"?u.pathname.slice(1):u.searchParams.get("v"))||"";if((host==="youtube.com"||host.endsWith(".youtube.com")||host==="youtu.be")&&/^[A-Za-z0-9_-]{6,15}$/.test(id))return '<div class="student-media"><iframe class="student-video-frame" src="https://www.youtube-nocookie.com/embed/'+esc(id)+'" title="Savol videosi" loading="lazy" allowfullscreen></iframe></div>';if(/\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(u.pathname))return '<div class="student-media"><img src="'+safe+'" alt="Savol uchun media"></div>';if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(u.pathname))return '<div class="student-media"><video src="'+safe+'" controls playsinline></video></div>';return '<div class="student-media student-media-link"><a href="'+safe+'" target="_blank" rel="noopener">Savolga biriktirilgan media ↗</a></div>'}catch{return ""}}
function question(q){
 lastScreen="question";const mode=data.session.mode||"classic",modeNames={classic:"KLASSIK",team:"JAMOAVIY",marble:"SHARLAR POYGASI",racing:"AVTOMOBIL POYGASI",accuracy:"ANIQLIK",confidence:"ISHONCH",kingdoms:"RANGLAR QIROLLIGI",tower:"ENG BALAND MINORA",treasure:"XAZINA IZLOVCHILAR",submarine:"SUVOSTI JAMOASI",robot:"ROBOTLAR POYGASI",cosmic:"KOINOT SARI"},modeLabel=modeNames[mode]||"KLASSIK",type=q.type||"quiz",mediaHtml=studentMediaMarkup(q.media||"");selectedMultiAnswers=new Set();puzzleOrder=[];let answerHtml="";
 if(type==="slider"){const min=Number(q.options?.[0]?.text??0),max=Number(q.options?.[1]?.text??100),step=Number(q.options?.[2]?.text??1),lo=Number.isFinite(min)?min:0,hi=Number.isFinite(max)&&max>lo?max:100,st=Number.isFinite(step)&&step>0?step:1,mid=lo+(hi-lo)/2;answerHtml='<form id="slider-answer-form" class="student-slider-answer"><div class="student-slider-value" id="slider-value">'+mid+'</div><input id="slider-input" type="range" min="'+lo+'" max="'+hi+'" step="'+st+'" value="'+mid+'"><div class="student-slider-limits"><span>'+lo+'</span><span>'+hi+'</span></div><button class="student-primary-button" type="submit">JAVOBNI YUBORISH →</button></form>'}
 else if(type==="puzzle"){puzzleOrder=(q.options||[]).map(o=>String(o.text||o));for(let i=puzzleOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[puzzleOrder[i],puzzleOrder[j]]=[puzzleOrder[j],puzzleOrder[i]]}answerHtml='<div class="student-puzzle-answer"><p>Javoblarni to‘g‘ri tartibga keltiring:</p><div id="puzzle-items">'+puzzleOrder.map((v,i)=>'<div class="student-puzzle-row"><span>'+(i+1)+'</span><strong>'+esc(v)+'</strong><div><button type="button" data-puzzle-move="'+i+'" data-direction="-1" '+(i===0?'disabled':'')+'>↑</button><button type="button" data-puzzle-move="'+i+'" data-direction="1" '+(i===puzzleOrder.length-1?'disabled':'')+'>↓</button></div></div>').join('')+'</div><button type="button" id="submit-puzzle" class="student-primary-button">TARTIBNI YUBORISH →</button></div>'}
 else if(type==="quiz"&&q.multi_select){answerHtml='<div class="student-multi-hint">Bir nechta to‘g‘ri javob bor. Barcha mos javoblarni belgilang.</div><div class="student-multi-grid">'+(q.options||[]).map((o,i)=>'<button type="button" class="student-multi-option '+["red","blue","yellow","green"][i%4]+'" data-multi-answer="'+esc(o.text||o)+'"><span class="student-multi-check"></span><span>'+esc(o.text||o)+'</span></button>').join('')+'</div><button type="button" id="submit-multi" class="student-primary-button" disabled>JAVOBLARNI YUBORISH →</button>'}
 else if(["type_answer","open_ended","word_cloud","brainstorm"].includes(type)){const word=type==="word_cloud",open=type==="open_ended",brain=type==="brainstorm",max=word?20:open?250:brain?400:75,field=open||brain?'<textarea class="field" id="typed-answer" maxlength="'+max+'" rows="'+(brain?4:3)+'" placeholder="'+(brain?"Har bir g‘oyani yangi qatordan yozing…":open?"Fikringizni yozing…":"Javobingizni yozing…")+'"></textarea>':'<input class="field" id="typed-answer" maxlength="'+max+'" placeholder="'+(word?"Bitta so‘z yoki qisqa ibora…":"Javobingizni yozing…")+'" autocomplete="off">';answerHtml='<form id="answer-form" class="typed-answer student-typed-answer">'+field+'<button class="student-primary-button" type="submit"><span>JAVOBNI YUBORISH</span><b>→</b></button></form>'}
 else{answerHtml=(q.options||[]).map((o,i)=>'<button class="answer-tile student-answer-tile '+["red","blue","yellow","green"][i%4]+'" data-answer="'+esc(o.text||o)+'"><span class="answer-symbol">'+["▲","◆","●","■"][i%4]+'</span><span>'+esc(o.text||o)+'</span><b class="student-answer-arrow">→</b></button>').join('')}
 root.innerHTML='<section class="question-wrap student-question-stage"><div class="question-top student-game-toolbar"><div class="student-game-title"><span class="student-mini-logo">✦</span><span>'+esc(data.session.title)+'</span></div><span class="pill student-mode-pill">'+esc(modeLabel)+'</span><span class="student-pin-badge">PIN '+pin+'</span><div class="student-player-chip"><span>'+avatarIcon(player.avatar)+'</span><b>'+esc(player.nickname)+'</b><i>★ '+Number(player.score||0).toLocaleString()+'</i></div></div><div class="question-card card student-question-card"><div class="student-question-meta"><span class="student-question-step">SAVOL <b>'+(data.session.current_question+1)+'</b></span><span class="student-question-hint">'+(type==="poll"?"FIKRINGIZNI BILDIRING":type==="puzzle"?"TARTIBNI TO‘G‘RI JOYLASHTIRING":"DIQQAT BILAN TANLANG")+'</span></div><h1 class="display student-question-title">'+esc(q.prompt)+'</h1>'+mediaHtml+'<div class="question-timer student-question-timer"><span class="student-timer-label">QOLGAN VAQT</span><div><i id="timer-fill"></i></div><strong id="timer-number">'+q.time+'</strong></div><div id="answer-area" class="answer-grid student-answer-grid">'+answerHtml+'</div><div id="answer-status" class="answer-status student-answer-status" aria-live="polite"></div>'+(mode==="marble"||mode==="racing"?raceBoard():"")+'</div><div class="student-game-footer"><span>✦ MUDARRIS JOIN</span><span>Har bir javob muhim!</span></div></section>';
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
 try{const d=await api("answer",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin,player_id:player.id,answer})});player.score=d.total;sessionStorage.setItem("mj-player-"+pin,JSON.stringify(player));const st=$("#answer-status");if(st){st.classList.toggle("is-correct",d.correct===true);st.classList.toggle("is-wrong",d.correct===false);st.classList.toggle("is-recorded",d.correct===null);st.textContent=d.correct===null?"✓ Javobingiz qabul qilindi!":(d.correct?"✓ To‘g‘ri javob! +":"✕ Bu safar noto‘g‘ri. +")+d.points+" ball"}}
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