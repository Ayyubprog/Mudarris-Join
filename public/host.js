(()=>{
"use strict";
const $=selector=>document.querySelector(selector);
const root=$("#host-root");
const pin=new URLSearchParams(location.search).get("pin")||"";
const state={data:null,loading:false,timer:null,clock:null,lastHtml:"",autoRevealKey:""};
const avatarIcon=key=>window.MJAvatars?MJAvatars.render(key,"live-player-avatar-svg"):"🙂";
const modes={classic:"KLASSIK",team:"JAMOAVIY",accuracy:"ANIQLIK",confidence:"ISHONCH",marble:"SHARLAR POYGASI",racing:"RACE CAR",shooter:"SHOOTER",kingdoms:"RANGLAR QIROLLIGI",tower:"ENG BALAND MINORA",treasure:"XAZINA IZLOVCHILAR",submarine:"SUVOSTI JAMOASI",robot:"ROBOTLAR POYGASI",cosmic:"KOINOT SARI"};
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const safeArray=value=>{try{const parsed=JSON.parse(String(value??""));return Array.isArray(parsed)?parsed:null}catch{return null}};
const colors=["red","blue","yellow","green"],shapes=["▲","◆","●","■"];
async function api(path,options={}){
 const response=await fetch("/api/"+path,{credentials:"same-origin",headers:{"content-type":"application/json"},...options});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||"So‘rov bajarilmadi. Qayta urinib ko‘ring.");
 return data;
}
function mediaHtml(value){
 if(!value)return "";
 if(/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/i.test(value))return '<div class="live-question-media"><img src="'+value+'" alt="Savolga biriktirilgan rasm"></div>';
 try{
  const url=new URL(value);if(!["http:","https:"].includes(url.protocol))return "";
  const safe=esc(url.href),host=url.hostname.toLowerCase(),videoId=(host==="youtu.be"?url.pathname.slice(1):url.searchParams.get("v"))||"";
  if((host==="youtube.com"||host.endsWith(".youtube.com")||host==="youtu.be")&&/^[A-Za-z0-9_-]{6,15}$/.test(videoId))return '<div class="live-question-media"><iframe src="https://www.youtube-nocookie.com/embed/'+esc(videoId)+'" title="Savol videosi" loading="lazy" allowfullscreen></iframe></div>';
  if(/\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(url.pathname))return '<div class="live-question-media"><img src="'+safe+'" alt="Savolga biriktirilgan rasm"></div>';
  if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(url.pathname))return '<div class="live-question-media"><video src="'+safe+'" controls playsinline></video></div>';
  return '<div class="live-question-media"><a href="'+safe+'" target="_blank" rel="noopener">Savol media faylini ochish ↗</a></div>';
 }catch{return ""}
}
function correctValues(question){
 const parsed=safeArray(question.correct);
 return parsed||[String(question.correct??"")];
}
function questionOptions(question,revealed){
 if(question.type==="type_answer")return '<div class="live-question-note">⌨ O‘quvchilar javobni telefonidan yozadi'+(revealed?' · To‘g‘ri javob: <strong>'+esc(question.correct)+'</strong>':'')+'</div>';
 if(question.type==="slider"){
  const min=question.options?.[0]?.text??"0",max=question.options?.[1]?.text??"100";
  return '<div class="live-question-note">📱 O‘quvchilar telefonidagi siljitgich yordamida qiymatni tanlaydi'+(revealed?' · To‘g‘ri qiymat: <strong>'+esc(question.correct)+'</strong>':'')+'</div>';
 }
 if(question.type==="puzzle"){
  const order=safeArray(question.correct)||[];
  const pieces=(revealed?order:(question.options||[]).map(item=>item.text||item));
  return '<div class="live-answer-grid">'+pieces.map((item,i)=>'<div class="live-answer-tile live-answer-'+colors[i%4]+'"><span class="shape">'+(i+1)+'</span><strong>'+esc(item)+'</strong>'+(revealed?'<span class="live-answer-check">✓</span>':'')+'</div>').join("")+'</div>';
 }
 if(["poll","word_cloud","open_ended","brainstorm"].includes(question.type)){
  return '<div class="live-question-note">'+(question.type==="poll"?"📱 O‘quvchilar tanlovini telefondan yuboradi":"✍ O‘quvchilar javoblarini telefonidan yozib yuboradi")+'</div>';
 }
 const correct=correctValues(question);
 return '<div class="live-answer-grid">'+(question.options||[]).map((item,i)=>{
  const label=String(item.text??item),right=correct.some(value=>String(value)===label);
  return '<div class="live-answer-tile live-answer-'+colors[i%4]+' '+(revealed&&right?"is-correct":"")+'"><span class="shape">'+shapes[i%4]+'</span><strong>'+esc(label)+'</strong>'+(revealed&&right?'<span class="live-answer-check">✓</span>':'')+'</div>';
 }).join("")+'</div>';
}
function playerWall(players,editable=false){
 if(!players.length)return '<div class="live-player-empty"><div><span>🎮</span><strong>Birinchi o‘yinchi kutilmoqda</strong><small>O‘quvchilar saytga kirib, PIN-kod va taxallusini yozishi bilan shu yerda ko‘rinadi.</small></div></div>';
 return players.map((player,index)=>'<div class="live-player-chip"><span class="live-player-avatar">'+avatarIcon(player.avatar)+'</span><strong title="'+esc(player.nickname)+'">'+esc(player.nickname)+'</strong>'+(String(player.avatar||"").startsWith("special_")?'<span class="live-player-special" style="font-size:9px;font-weight:900;letter-spacing:.06em;color:#9a68e7;background:#f1e8ff;border-radius:6px;padding:4px 5px;white-space:nowrap">1/1 MAXSUS</span>':'')+(editable?'<button type="button" data-remove="'+Number(player.id)+'" aria-label="O‘yinchini olib tashlash" title="O‘yinchidan chiqarish" style="margin-left:auto;border:0;background:transparent;color:#ae8195;font-size:16px;cursor:pointer">×</button>':'')+'</div>').join("");
}
function lobbyView(data){
 const players=data.players||[],session=data.session,locked=!!session.join_locked;
 return '<section class="live-stage"><div class="live-lobby"><section class="live-panel live-invite-panel"><div class="live-kicker">MUDARRIS JOIN · JONLI BELLASHUV</div><h1 class="live-lobby-title">Sinfingizni o‘yinga taklif qiling!</h1><p class="live-lobby-copy">O‘quvchilar telefon yoki kompyuterida saytni ochib, quyidagi PIN-kodni kiritadi. Keyin taxallus va avatarini tanlaydi.</p><div class="live-pin-block"><div class="live-pin-caption">O‘YINGA QO‘SHILISH PIN-KODI</div><div class="live-big-pin">'+esc(pin)+'</div><div class="live-join-url"><span>Sayt:</span><strong>'+esc(location.host)+'</strong><button class="live-pin-copy" type="button" data-copy-pin>Nusxalash</button></div></div><div class="live-invite-tip"><i></i><span>'+(locked?"Kutish xonasi yopilgan — yangi o‘quvchilar kira olmaydi.": "Yangi o‘quvchilar qo‘shilishi bilan ro‘yxat avtomatik yangilanadi.")+'</span></div></section><section class="live-panel live-players-panel"><div class="live-players-head"><h2>O‘yinchilar</h2><span class="live-count"><i></i><b>'+players.length+'</b> / 100</span></div><div class="live-player-wall">'+playerWall(players,true)+'</div></section></div><footer class="live-stage-footer"><div class="live-stage-hint"><strong>'+(players.length?players.length+" nafar o‘quvchi tayyor.":"O‘quvchilarni kutyapmiz.")+'</strong><br>'+(players.length?"Hammasi tayyor bo‘lsa, o‘yinni boshlang.":"Kamida bitta o‘quvchi qo‘shilgach, boshlash tugmasi faollashadi.")+'</div><div class="live-controls"><button class="live-control-button live-secondary" type="button" data-action="'+(locked?"unlock":"lock")+'">'+(locked?"Kirishni ochish":"Kirishni yopish")+'</button><button class="live-control-button live-primary" type="button" data-action="start" '+(!players.length?"disabled":"")+'>▶ O‘yinni boshlash · '+players.length+'</button></div></footer></section>';
}
function hostModeScene(mode,index,players){
 if(mode==="shooter")return '<div class="mj-host-game-scene mj-host-shooter"><div class="mj-host-sun"></div><span class="mj-host-mesa"></span><div class="mj-host-battle-title">⚔ SHOOTER ARENA <small>RAQIB '+(index+1)+'</small></div><div class="mj-host-duel-hero">🦸</div><div class="mj-host-duel-enemy">🤠</div><div class="mj-host-battle-ground"></div></div>';
 if(mode==="racing")return '<div class="mj-host-game-scene mj-host-racing"><div class="mj-host-race-hills"></div><div class="mj-host-race-road"><i></i><i></i><b>🏎️</b><em>🚙</em></div><div class="mj-host-race-caption">🏁 RACE CAR · SAVOL '+(index+1)+'</div></div>';
 return "";
}
function roundLeaderboard(players){
 const top=players.slice().sort((a,b)=>Number(b.score||0)-Number(a.score||0)).slice(0,5);
 if(!top.length)return "";
 return '<div class="live-round-leaderboard"><div class="live-round-leaderboard-title">🏆 SAVOLDAN KEYINGI REYTING</div><div class="live-round-ranks">'+top.map((p,i)=>'<div class="live-round-rank rank-'+(i+1)+'"><b>'+(i===0?"👑":i+1)+'</b><span>'+avatarIcon(p.avatar)+'</span><strong>'+esc(p.nickname)+'</strong><em>'+Number(p.score||0).toLocaleString("uz-UZ")+' ball</em></div>').join("")+'</div></div>';
}
function questionView(data,revealed){
 const q=data.current_question,session=data.session,players=data.players||[],index=Number(session.current_question||0),total=data.questions.length,time=Number(q?.time||20);
 if(!q)return '<section class="live-panel live-error">Savol topilmadi. <a href="/teacher.html">Kabinetga qayting</a>.</section>';
 const answerCount=Number(data.answer_stats?.total||0),correctCount=Number(data.answer_stats?.correct||0);
 const free=["poll","word_cloud","open_ended","brainstorm"].includes(q.type);
 const typeLabels={quiz:"VIKTORINA",true_false:"TO‘G‘RI / NOTO‘G‘RI",type_answer:"JAVOB YOZISH",puzzle:"TARTIBLASH",slider:"SILJITGICH",poll:"SO‘ROVNOMA",word_cloud:"SO‘ZLAR BULUTI",open_ended:"OCHIQ SAVOL",brainstorm:"G‘OYALAR"};
 let responseHtml="";
 if(revealed&&(free||q.type==="type_answer")){
  responseHtml='<div class="live-free-responses">'+(data.responses||[]).map(item=>'<article class="live-free-response"><strong>'+esc(item.nickname)+'</strong><p>'+esc(item.answer)+'</p></article>').join("")+'</div>';
 }
 return '<section class="live-stage live-question-shell"><div class="live-question-top"><div class="live-progress-copy">SAVOL '+(index+1)+' / '+total+' · '+esc(typeLabels[q.type]||"VIKTORINA")+'</div><div class="live-timer"><strong class="live-timer-number" id="live-timer-number">'+(revealed?"✓":String(time).padStart(2,"0"))+'</strong><div class="live-timer-track"><div class="live-timer-fill" id="live-timer-fill" style="width:'+(revealed?0:100)+'%"></div></div></div><div class="live-progress-copy">'+(revealed?"NATIJALAR":"PIN "+esc(pin))+'</div></div>'+hostModeScene(session.mode,index,players)+'<section class="live-question-card">'+(revealed?'<div class="live-reveal-banner">✓ NATIJALAR KO‘RSATILMOQDA</div>':'')+'<div class="live-question-index">MUDARRIS JOIN · '+(index+1)+'-SAVOL</div><h1 class="live-question-prompt">'+esc(q.prompt)+'</h1>'+mediaHtml(q.media)+questionOptions(q,revealed)+(revealed?roundLeaderboard(players):"")+'<div class="live-question-stats"><span class="live-stat-pill">👥 '+players.length+' o‘yinchi</span><span class="live-stat-pill">✉ '+answerCount+' ta javob</span>'+(revealed?'<span class="live-stat-pill">✓ '+correctCount+' ta to‘g‘ri</span>':'<span class="live-stat-pill">⏱ '+time+' soniya</span>')+'</div>'+responseHtml+'</section><footer class="live-stage-footer"><div class="live-stage-hint"><strong>'+(revealed?"O‘quvchilar o‘z natijasini telefonida ko‘rmoqda.": "O‘quvchilar javobni telefonida tanlaydi yoki yozadi.")+'</strong><br>'+(revealed?"Keyingi savolga o‘tishingiz mumkin.": "Vaqt tugagach natijalar avtomatik ochiladi.")+'</div><div class="live-controls">'+(session.status==="playing"?'<button class="live-control-button live-secondary" type="button" data-action="pause">Ⅱ Pauza</button><button class="live-control-button live-primary" type="button" data-action="reveal">✓ Natijalarni ko‘rsatish</button>':'')+(session.status==="revealed"?'<button class="live-control-button live-secondary" type="button" data-action="finish">Yakunlash</button><button class="live-control-button live-primary" type="button" data-action="next">'+(index+1>=total?"🏆 Yakuniy natijalar":"Keyingi savol →")+'</button>':'')+(session.status==="paused"?'<button class="live-control-button live-primary" type="button" data-action="resume">▶ Davom ettirish</button>':'')+'</div></footer></section>';
}
function finishView(data){
 const players=(data.players||[]).slice().sort((a,b)=>Number(b.score||0)-Number(a.score||0)),top=players.slice(0,3);
 const items=top.map((player,i)=>({player,rank:i}));
 const order=items.length===3?[items[1],items[0],items[2]]:items;
 return '<section class="live-stage"><section class="live-finish-card"><div class="live-finish-trophy">🏆</div><div class="live-kicker">MUDARRIS JOIN · BELLASHUV YAKUNLANDI</div><h1 class="live-finish-title">Ajoyib o‘yin bo‘ldi!</h1><p style="margin:0;color:#8d8198;font-size:12px">'+players.length+' nafar o‘quvchi qatnashdi</p><div class="live-podium">'+order.map(({player,rank})=>'<div class="live-podium-item '+(rank===0?"first":rank===1?"second":"third")+'"><span>'+(rank===0?"🥇":rank===1?"🥈":"🥉")+'</span><strong>'+esc(player.nickname)+'</strong><small>'+Number(player.score||0).toLocaleString("uz-UZ")+' ball</small></div>').join("")+'</div><div class="live-controls"><a class="live-control-button live-secondary" style="text-decoration:none;display:inline-flex;align-items:center" href="/teacher.html#reports">Hisobotlarni ko‘rish</a><a class="live-control-button live-primary" style="text-decoration:none;display:inline-flex;align-items:center" href="/teacher.html">Kabinetga qaytish</a></div></section></section>';
}
function pausedView(){
 return '<section class="live-stage"><section class="live-finish-card"><div class="live-finish-trophy">Ⅱ</div><div class="live-kicker">BIR OZ TANAFFUS</div><h1 class="live-finish-title">O‘yin pauzada</h1><p style="max-width:500px;color:#8d8198;font-size:13px;line-height:1.6">O‘quvchilar kutishmoqda. Davom ettirish tugmasini bosganingizda savol va vaqt yana ishga tushadi.</p><div class="live-controls"><button class="live-control-button live-primary" type="button" data-action="resume">▶ Davom ettirish</button><button class="live-control-button live-danger" type="button" data-action="finish">Yakunlash</button></div></section></section>';
}
function render(data){
 state.data=data;
 const session=data.session;
 $("#live-title").textContent=session.title||"Jonli viktorina";
 $("#live-mode").textContent=modes[session.mode]||"SINF UCHUN BELLASHUV";
 $("#live-pin").textContent=pin;
 let html="";
 if(session.status==="waiting")html=lobbyView(data);
 else if(session.status==="finished")html=finishView(data);
 else if(session.status==="paused")html=pausedView();
 else html=questionView(data,session.status==="revealed");
 if(html!==state.lastHtml){root.innerHTML=html;state.lastHtml=html}
 updateClock();
}
function updateClock(){
 const data=state.data;if(!data||data.session.status!=="playing")return;
 const q=data.current_question,seconds=Math.max(5,Number(q?.time||20));
 const started=Number(data.session.question_started_at)||Date.now();
 const left=Math.max(0,(started+seconds*1000-Date.now())/1000);
 const number=$("#live-timer-number"),fill=$("#live-timer-fill");
 if(number)number.textContent=String(Math.ceil(left)).padStart(2,"0");
 if(fill)fill.style.width=Math.max(0,left/seconds*100)+"%";
 const key=String(data.session.current_question);
 if(left<=0&&state.autoRevealKey!==key){state.autoRevealKey=key;action("reveal")}
}
async function load(){
 if(state.loading)return;
 state.loading=true;
 try{const data=await api("host/"+pin);render(data)}
 catch(error){root.innerHTML='<div class="live-error">'+esc(error.message)+' <a href="/teacher.html">Kabinetga qaytish</a></div>';state.lastHtml=""}
 finally{state.loading=false}
}
async function action(name,playerId){
 const button=document.querySelector('[data-action="'+name+'"]');
 if(button)button.disabled=true;
 try{
  await api("host/"+pin,{method:"POST",body:JSON.stringify({action:name,player_id:playerId})});
  state.lastHtml="";await load();
 }catch(error){alert(error.message);if(button)button.disabled=false}
}
async function copyPin(button){
 try{
  if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(pin);
  else{const field=document.createElement("textarea");field.value=pin;field.style.position="fixed";field.style.opacity="0";document.body.appendChild(field);field.select();if(!document.execCommand("copy"))throw Error();field.remove()}
  if(button){button.textContent="Nusxalandi ✓";setTimeout(()=>{button.textContent="Nusxalash"},1800)}
 }catch{alert("O‘yin PIN-kodi: "+pin)}
}
document.addEventListener("click",event=>{
 const actionButton=event.target.closest("[data-action]");
 if(actionButton){action(actionButton.dataset.action);return}
 const remove=event.target.closest("[data-remove]");
 if(remove){if(confirm("Bu o‘yinchini o‘yindan chiqarishni xohlaysizmi?"))action("remove_player",Number(remove.dataset.remove));return}
 const copy=event.target.closest("[data-copy-pin]");
 if(copy){copyPin(copy);return}
 const fullscreen=event.target.closest("[data-fullscreen]");
 if(fullscreen){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>{});else document.exitFullscreen?.();return}
});
if(!/^\d{6}$/.test(pin)){root.innerHTML='<div class="live-error">O‘yin PIN-kodi noto‘g‘ri. <a href="/teacher.html">Kabinetga qaytish</a></div>'}
else{
 (async()=>{try{await api("auth/me");await load();state.timer=setInterval(load,1200);state.clock=setInterval(updateClock,120)}catch{location.href="/login.html"}})();
}
})();