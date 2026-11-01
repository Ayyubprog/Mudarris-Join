(()=>{
"use strict";
const $=selector=>document.querySelector(selector);
const root=$("#host-root");
const pin=new URLSearchParams(location.search).get("pin")||"";
const state={data:null,loading:false,timer:null};
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const avatars={tiger:"🐯",earth:"🌍",skull:"💀",alien:"👽",cat:"🐱",fox:"🦊",robot:"🤖",ghost:"👻",lion:"🦁",panda:"🐼",rocket:"🚀",crown:"👑"};
const modeNames={classic:"Klassik",team:"Jamoaviy",marble:"Sharlar poygasi",racing:"Avtomobil poygasi",accuracy:"Aniqlik",confidence:"Ishonch",kingdoms:"Ranglar qirolligi",tower:"Eng baland minora",treasure:"Xazina izlovchilar",submarine:"Suvosti jamoasi",robot:"Robotlar poygasi",cosmic:"Koinot sari"};
const statusNames={waiting:"Kutilmoqda",playing:"Davom etmoqda",paused:"Pauzada",finished:"Yakunlangan"};
async function api(path,options={}){
 const response=await fetch("/api/"+path,{credentials:"same-origin",headers:{"content-type":"application/json"},...options});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||"So‘rov bajarilmadi.");
 return data;
}
function arrayValue(value){try{const parsed=JSON.parse(String(value||""));return Array.isArray(parsed)?parsed:null}catch{return null}}
function mediaHtml(value){
 if(!value)return "";
 try{
  const url=new URL(value);if(!["http:","https:"].includes(url.protocol))return "";
  const safe=esc(url.href),host=url.hostname.toLowerCase(),videoId=(host==="youtu.be"?url.pathname.slice(1):url.searchParams.get("v"))||"";
  if((host==="youtube.com"||host.endsWith(".youtube.com")||host==="youtu.be")&&/^[A-Za-z0-9_-]{6,15}$/.test(videoId))return '<div class="host-question-media"><iframe src="https://www.youtube-nocookie.com/embed/'+esc(videoId)+'" title="Savol videosi" loading="lazy" allowfullscreen></iframe></div>';
  if(/\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(url.pathname))return '<div class="host-question-media"><img src="'+safe+'" alt="Savol uchun media"></div>';
  if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(url.pathname))return '<div class="host-question-media"><video src="'+safe+'" controls playsinline></video></div>';
  return '<div class="host-question-media"><a href="'+safe+'" target="_blank" rel="noopener">Biriktirilgan media ↗</a></div>';
 }catch{return ""}
}
function correctText(question){
 if(!question)return "—";
 if(["poll","word_cloud","open_ended","brainstorm"].includes(question.type))return "Avtomatik baholanmaydi";
 if(question.type==="slider")return String(question.correct||"—");
 if(question.type==="puzzle")return (arrayValue(question.correct)||[]).join(" → ")||"—";
 const values=arrayValue(question.correct);
 if(values)return values.join(" · ")||"—";
 return String(question.correct||"—");
}
function renderQuestion(question,data){
 if(!question)return '<div class="host-wait"><div class="host-symbol">✦</div><h2 class="display">Savol tayyorlanmoqda</h2></div>';
 const total=data.questions.length,index=data.session.current_question;
 const ungraded=["poll","word_cloud","open_ended","brainstorm"].includes(question.type);
 let answerHtml="";
 if(question.type==="slider"){
  answerHtml='<div class="host-answer-info"><strong>Siljitgich</strong><span>'+esc(question.options?.[0]?.text||"0")+' — '+esc(question.options?.[1]?.text||"100")+'</span></div>';
 }else if(question.type==="puzzle"){
  answerHtml='<div class="host-puzzle-order">'+(question.options||[]).map((option,i)=>'<div><b>'+(i+1)+'</b>'+esc(option.text||option)+'</div>').join("")+'</div>';
 }else if(ungraded){
  answerHtml='<div class="host-response-empty">O‘quvchilarning javoblari shu yerda ko‘rinadi.</div>';
 }else{
  const correct=arrayValue(question.correct)||[String(question.correct||"")];
  answerHtml='<div class="host-options">'+(question.options||[]).map((option,i)=>{
   const text=String(option.text||option),isCorrect=correct.some(value=>String(value)===text);
   return '<div class="answer-tile '+["red","blue","yellow","green"][i%4]+' '+(isCorrect?"host-correct-answer":"")+'"><span class="answer-symbol">'+["▲","◆","●","■"][i%4]+'</span><span>'+esc(text)+'</span>'+(isCorrect?'<b class="host-correct-mark">✓</b>':'')+'</div>';
  }).join("")+'</div>';
 }
 return '<div class="host-question-heading"><div><span class="eyebrow">SAVOL '+(index+1)+' / '+total+'</span><h2 class="display question-title">'+esc(question.prompt)+'</h2></div><span class="host-question-type">'+esc(question.type==="true_false"?"To‘g‘ri yoki noto‘g‘ri":question.type==="quiz"?"Viktorina":question.type==="poll"?"So‘rovnoma":question.type==="type_answer"?"Javob yozish":question.type==="puzzle"?"Boshqotirma":question.type==="slider"?"Siljitgich":question.type==="word_cloud"?"So‘zlar buluti":question.type==="open_ended"?"Ochiq savol":"G‘oyalar jamlanmasi")+'</span></div>'+mediaHtml(question.media)+'<div class="host-question-answer-preview">'+answerHtml+'</div><div class="host-meta"><span class="pill">◷ '+Number(question.time||20)+' soniya</span><span class="pill">★ '+Number(question.points||0).toLocaleString()+' ball</span><span class="pill">↗ '+Number(data.answer_stats?.total||0)+' ta javob</span></div><div class="correct-line">'+(ungraded?"Baholash: ":"To‘g‘ri javob: ")+'<strong>'+esc(correctText(question))+'</strong></div>';
}
function renderResponses(data,question){
 const responses=data.responses||[];
 if(!question||!["poll","word_cloud","open_ended","brainstorm"].includes(question.type))return "";
 return '<section class="card host-panel host-responses"><div class="players-head"><div><span class="eyebrow">O‘QUVCHILAR FIKRI</span><h2 class="display">Kelgan javoblar</h2></div><span class="pill">'+responses.length+' ta</span></div><div class="host-response-list">'+(responses.map(item=>'<article class="host-response-item"><strong>'+esc(item.nickname)+'</strong><p>'+esc(item.answer)+'</p></article>').join("")||'<div class="host-response-empty">Hozircha javob kelmadi. O‘quvchilar yuborganda shu yerda paydo bo‘ladi.</div>')+'</div></section>';
}
function render(data){
 state.data=data;
 const session=data.session,players=data.players||[],question=data.current_question;
 const waiting=session.status==="waiting",finished=session.status==="finished",paused=session.status==="paused";
 const pinUrl=location.origin+"/?pin="+encodeURIComponent(pin);
 root.innerHTML=
 '<div class="host-heading"><div class="host-heading-copy"><div class="eyebrow">MUDARRIS JOIN · O‘QITUVCHI MARKAZI</div><h1 class="display">'+esc(session.title)+'</h1><div class="host-heading-badges"><span class="pill">'+esc(modeNames[session.mode]||"Klassik")+'</span><span class="pill host-status-'+esc(session.status)+'">'+esc(statusNames[session.status]||session.status)+'</span></div></div><div class="pin-box"><div class="eyebrow">O‘YINGA QO‘SHILISH KODI</div><div class="display pin-number">'+esc(pin)+'</div><div class="host-pin-actions"><button type="button" data-copy-pin>Nusxalash</button><a href="/" target="_blank" rel="noopener">O‘quvchi sahifasi ↗</a></div><div class="muted host-pin-hint">O‘quvchilar PIN-kod va taxallus bilan kiradi</div></div></div>'+
 '<div class="host-stats"><article><span>♟</span><div><small>O‘yinchilar</small><strong>'+players.length+'</strong></div></article><article><span>▣</span><div><small>Savollar</small><strong>'+data.questions.length+'</strong></div></article><article><span>◷</span><div><small>Javoblar</small><strong>'+Number(data.answer_stats?.total||0)+'</strong></div></article><article><span>✓</span><div><small>To‘g‘ri javoblar</small><strong>'+Number(data.answer_stats?.correct||0)+'</strong></div></article></div>'+
 '<div class="host-grid"><section class="card host-panel host-main-panel"><div class="eyebrow">JONLI O‘YIN BOSHQARUVI</div>'+(waiting?'<div class="host-wait"><div class="host-symbol">✦</div><h2 class="display">O‘yinchilar ulanmoqda</h2><p class="muted">PIN-kodni doskaga chiqaring. O‘quvchilar qo‘shilishi bilan ro‘yxat yangilanadi.</p></div>':finished?'<div class="host-wait"><div class="host-symbol">🏆</div><h2 class="display">O‘yin yakunlandi</h2><p class="muted">Bellashuv muvaffaqiyatli yakunlandi. Natijalarni ko‘rib chiqing.</p></div>':paused?'<div class="host-wait"><div class="host-symbol">Ⅱ</div><h2 class="display">O‘yin vaqtincha to‘xtatildi</h2><p class="muted">Tayyor bo‘lganda o‘yinni davom ettiring.</p></div>':renderQuestion(question,data))+
 '<div class="host-actions">'+(waiting?'<button class="btn btn-primary" data-action="start" '+(!players.length?"disabled":"")+'>▶ O‘yinni boshlash</button>':'')+(session.status==="playing"?'<button class="btn btn-ghost" data-action="pause">Ⅱ Pauza</button><button class="btn btn-primary" data-action="next">'+(session.current_question+1>=data.questions.length?"O‘yinni yakunlash":"Keyingi savol →")+'</button>':'')+(paused?'<button class="btn btn-primary" data-action="resume">▶ Davom ettirish</button>':'')+(!finished?'<button class="btn btn-ghost" data-action="'+(session.join_locked?"unlock":"lock")+'">'+(session.join_locked?"Kutish xonasini ochish":"Kutish xonasini yopish")+'</button><button class="btn btn-danger" data-action="finish">Yakunlash</button>':'')+'</div></section>'+
 '<aside class="card host-panel host-player-panel"><div class="players-head"><div><span class="eyebrow">SINF FAOLLIGI</span><h2 class="display">O‘yinchilar</h2></div><span class="pill">'+players.length+' / 100</span></div><div class="players-list">'+(players.map(p=>'<div class="player-row"><span class="player-avatar">'+(avatars[p.avatar]||"🙂")+'</span><div class="player-name"><strong>'+esc(p.nickname)+'</strong><small>'+Number(p.streak||0)+' ketma-ket to‘g‘ri javob</small></div><strong>'+Number(p.score||0).toLocaleString()+'</strong><button class="btn btn-ghost remove-player" data-remove="'+Number(p.id)+'" aria-label="O‘yinchini olib tashlash">×</button></div>').join("")||'<div class="host-response-empty">O‘quvchilar kirishi kutilmoqda…</div>')+'</div></aside></div>'+
 renderResponses(data,question)+
 '<section class="card host-panel leaderboard"><div class="players-head"><div><span class="eyebrow">NATIJALAR</span><h2 class="display">Jonli reyting</h2></div><span class="muted">Ballar avtomatik yangilanadi</span></div><div class="leader-grid">'+players.slice().sort((a,b)=>b.score-a.score).slice(0,10).map((p,i)=>'<div class="leader-item"><small>#'+(i+1)+'</small><strong>'+(avatars[p.avatar]||"🙂")+' '+esc(p.nickname)+'</strong><b>'+Number(p.score||0).toLocaleString()+'</b></div>').join("")+'</div></section>';
}
async function load(){
 if(state.loading)return;
 state.loading=true;
 try{const data=await api("host/"+pin);render(data)}
 catch(error){root.innerHTML='<div class="card host-error" style="padding:25px">'+esc(error.message)+' <a href="/teacher.html">Kabinetga qaytish</a></div>'}
 finally{state.loading=false}
}
async function action(name,playerId){
 const button=document.querySelector('[data-action="'+name+'"]');
 if(button)button.disabled=true;
 try{await api("host/"+pin,{method:"POST",body:JSON.stringify({action:name,player_id:playerId})});await load()}
 catch(error){alert(error.message);if(button)button.disabled=false}
}
document.addEventListener("click",event=>{
 const button=event.target.closest("[data-action]");
 if(button){action(button.dataset.action);return}
 const remove=event.target.closest("[data-remove]");
 if(remove){if(confirm("Bu o‘yinchini o‘yindan olib tashlaysizmi?"))action("remove_player",Number(remove.dataset.remove));return}
 const copy=event.target.closest("[data-copy-pin]");
 if(copy){const textArea=document.createElement("textarea");textArea.value=pin;textArea.style.position="fixed";textArea.style.opacity="0";document.body.appendChild(textArea);textArea.select();try{if(navigator.clipboard?.writeText){navigator.clipboard.writeText(pin).then(()=>{copy.textContent="Nusxalandi ✓"}).catch(()=>{document.execCommand("copy");copy.textContent="Nusxalandi ✓"})}else{document.execCommand("copy");copy.textContent="Nusxalandi ✓"}}catch{alert("PIN-kod: "+pin)}finally{textArea.remove()}}
});
(async()=>{
 if(!/^\d{6}$/.test(pin)){root.textContent="O‘yin PIN-kodi noto‘g‘ri.";return}
 try{await api("auth/me");await load();state.timer=setInterval(load,1800)}
 catch{location.href="/login.html"}
})();
})();