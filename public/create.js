(()=>{
"use strict";
const $=selector=>document.querySelector(selector);
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const MAX_QUESTIONS=200,MAX_ANSWERS=6;
const noPoints=new Set(["poll","word_cloud","open_ended","brainstorm"]);
const textTypes=new Set(["type_answer","open_ended","word_cloud","brainstorm"]);
const labels={
  quiz:"Viktorina",true_false:"To‘g‘ri yoki noto‘g‘ri",type_answer:"Javob yozish",
  puzzle:"Boshqotirma",slider:"Siljitgich",poll:"So‘rovnoma",
  word_cloud:"So‘zlar buluti",open_ended:"Ochiq savol",brainstorm:"G‘oyalar jamlanmasi"
};
const descriptions={
  quiz:"Bir nechta variantdan to‘g‘ri javobni tanlang",
  true_false:"Fikr to‘g‘ri yoki noto‘g‘ri ekanini belgilang",
  type_answer:"O‘quvchi javobni o‘zi yozadi",
  puzzle:"Javoblarni to‘g‘ri ketma-ketlikka keltiring",
  slider:"Sonli qiymatni siljitgich orqali toping",
  poll:"Sinf fikrini to‘plang — ball berilmaydi",
  word_cloud:"Qisqa javoblar bilan so‘zlar bulutini yarating",
  open_ended:"O‘quvchilar erkin fikr bildirsin",
  brainstorm:"Bir nechta g‘oyani bitta joyga jamlang"
};
const typeGroups=[
  {title:"Bilimni tekshirish",items:["quiz","true_false","type_answer","puzzle","slider"]},
  {title:"Fikr va g‘oyalar",items:["poll","word_cloud","open_ended","brainstorm"]}
];
const typeIcons={
  quiz:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="m7.5 12.5 3 3 6-7"/></svg>',
  true_false:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="5"/><circle cx="17" cy="12" r="5"/><path d="m6 12 1.5 1.5L10 10m5-1 1 1 2-2"/></svg>',
  type_answer:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h11M4 18h7m6-3v6m-3-3h6"/></svg>',
  puzzle:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v3a2 2 0 1 0 4 0V4h6v6h-3a2 2 0 1 0 0 4h3v6h-6v-3a2 2 0 1 0-4 0v3H4v-6h3a2 2 0 1 0 0-4H4V4Z"/></svg>',
  slider:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5"/><circle cx="15" cy="17" r="2.5"/></svg>',
  poll:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5m0 14h16"/><rect x="7" y="12" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="9" rx="1"/><rect x="17" y="4" width="3" height="13" rx="1"/></svg>',
  word_cloud:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18.5h12a4 4 0 0 0 .3-8A6.3 6.3 0 0 0 6 9a4.8 4.8 0 0 0 0 9.5Z"/><path d="M9 13h6m-3-3v6"/></svg>',
  open_ended:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v13H9l-5 3V4Z"/><path d="M8 9h8m-8 4h5"/></svg>',
  brainstorm:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6m-5 3h4m-5.5-5.5a6 6 0 1 1 7 0c-.8.6-1.2 1.2-1.3 2H9.8c-.1-.8-.5-1.4-1.3-2Z"/><path d="M12 5v4m-4-2 2 2m6-2-2 2"/></svg>'
};
const state={gameId:null,questions:[],current:0,busy:false,dirty:false,mediaKind:"image",previewIndex:0,dragIndex:null,gameUpdatedAt:null};
let draftTimer=null;
const newDraftKey="mudarris-join-quiz-draft-v2";
function fresh(type="quiz"){
  return {
    type,prompt:"",
    answers:type==="true_false"?["To‘g‘ri","Noto‘g‘ri"]:type==="poll"?["",""]:["","","",""],
    correct:type==="quiz"||type==="true_false"?[0]:[],
    multiple:false,correctText:"",
    time:20,points:1000,media:"",
    slider:{min:0,max:100,step:1,target:50,tolerance:0}
  };
}
function current(){return state.questions[state.current]}
function toast(message){
  const root=$("#toast-root");
  root.innerHTML='<div class="mj-toast qb-toast">'+escapeHtml(message)+'</div>';
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>{root.innerHTML=""},3400);
}
function setSaveState(label,kind="dirty"){
  const node=$("#save-state");
  node.className="qb-save-state "+kind;
  node.innerHTML='<i></i><span>'+escapeHtml(label)+'</span>';
}
async function api(path,options={}){
  const response=await fetch("/api/"+path,{
    credentials:"same-origin",cache:"no-store",
    headers:{"content-type":"application/json",...(options.headers||{})},
    ...options
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||"So‘rov bajarilmadi. Qayta urinib ko‘ring.");
  return data;
}
function parseJsonArray(value){
  if(typeof value!=="string")return null;
  try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:null}catch{return null}
}
function normalizeLoadedQuestion(question){
  const type=labels[question.type]?question.type:"quiz";
  const item=fresh(type);
  item.prompt=String(question.prompt||"");
  item.time=Number(question.time)||20;
  item.points=Number.isFinite(Number(question.points))?Number(question.points):1000;
  item.media=String(question.media||"");
  const optionTexts=(question.options||[]).map(option=>String(option?.text??option??""));
  if(type==="true_false"){
    item.answers=["To‘g‘ri","Noto‘g‘ri"];
    item.correct=[String(question.correct||"").toLocaleLowerCase("uz").startsWith("to‘g‘ri")?0:1];
  }else if(type==="quiz"){
    item.answers=optionTexts.length?optionTexts:["","","",""];
    const multi=parseJsonArray(question.correct);
    if(multi){
      item.multiple=!!question.multiple_select||multi.length>1;
      item.correct=multi.map(text=>item.answers.findIndex(answer=>answer===String(text))).filter(index=>index>=0);
    }else{
      const index=item.answers.findIndex(answer=>answer===String(question.correct||""));
      item.correct=index>=0?[index]:[];
    }
    if(!item.correct.length)item.correct=[0];
  }else if(type==="poll"){
    item.answers=optionTexts.length?optionTexts:["",""];
    item.correct=[];
  }else if(type==="puzzle"){
    const ordered=parseJsonArray(question.correct);
    if(ordered){
      item.answers=ordered.map(String);
    }else if(optionTexts.length){
      item.answers=optionTexts;
      item.correctText=String(question.correct||"");
    }else{
      item.answers=["","","",""];
      item.correctText=String(question.correct||"");
    }
  }else if(type==="slider"){
    item.correctText=String(question.correct||"");
    const options=optionTexts;
    item.slider={
      min:Number(options[0]??0),max:Number(options[1]??100),
      step:Number(options[2]??1),target:Number(question.correct||options[3]||50),
      tolerance:Number(options[3]??0)
    };
    if(!Number.isFinite(item.slider.min))item.slider.min=0;
    if(!Number.isFinite(item.slider.max)||item.slider.max<=item.slider.min)item.slider.max=100;
    if(!Number.isFinite(item.slider.step)||item.slider.step<=0)item.slider.step=1;
    if(!Number.isFinite(item.slider.target))item.slider.target=item.slider.min;
  }else if(type==="type_answer"){
    item.correctText=String(question.correct||"");
    item.answers=[];
  }else{
    item.answers=[];
    item.correct=[];
  }
  return item;
}
function currentIsFreeResponse(type){return ["word_cloud","open_ended","brainstorm"].includes(type)}
function activeAnswers(question=current()){
  return question.answers.map((text,index)=>({text:String(text||""),index})).filter(item=>item.text.trim());
}
function validationError(question){
  if(!question.prompt.trim())return "Savol matnini kiriting.";
  if(question.prompt.length>120)return "Savol matni 120 belgidan oshmasligi kerak.";
  if(!Number.isFinite(question.time)||question.time<5||question.time>240)return "Vaqt 5 soniyadan 4 daqiqagacha bo‘lishi kerak.";
  if(noPoints.has(question.type)===false&&![0,1000,2000].includes(Number(question.points)))return "Ball miqdorini tanlang.";
  if(["quiz","poll"].includes(question.type)){
    const answers=activeAnswers(question);
    if(answers.length<2)return question.type==="poll"?"So‘rovnomada kamida 2 ta javob bo‘lishi kerak.":"Viktorinada kamida 2 ta javob bo‘lishi kerak.";
    if(answers.length>6)return "Ko‘pi bilan 6 ta javob kiritish mumkin.";
    if(answers.some(item=>item.text.length>75))return "Javoblar 75 belgidan oshmasligi kerak.";
    if(question.type==="quiz"&&!question.correct.some(index=>answers.some(item=>item.index===index)))return "Kamida bitta to‘g‘ri javobni belgilang.";
    if(question.type==="quiz"&&question.multiple&&question.correct.length<2)return "Bir nechta to‘g‘ri javob rejimida kamida 2 ta javobni belgilang.";if(question.type==="quiz"&&!question.multiple&&question.correct.length>1)return "Bir nechta to‘g‘ri javob uchun mos sozlamani yoqing.";
  }
  if(question.type==="true_false"&&question.correct.length!==1)return "To‘g‘ri yoki noto‘g‘ri javobni belgilang.";
  if(question.type==="type_answer"&&!question.correctText.trim())return "To‘g‘ri javobni kiriting.";
  if(question.type==="puzzle"){
    if(question.answers.length<2||question.answers.length>6||question.answers.some(answer=>!answer.trim()))return "Boshqotirma uchun 2–6 ta to‘liq javob kiriting.";
    if(question.answers.some(answer=>answer.length>75))return "Javoblar 75 belgidan oshmasligi kerak.";
    if(question.correctText.trim())return "Eski boshqotirma javobini yangi tartib bilan almashtiring.";
  }
  if(question.type==="slider"){
    const {min,max,step,target}=question.slider;
    if(![min,max,step,target].every(Number.isFinite)||max<=min||step<=0||target<min||target>max)return "Siljitgich chegaralari va to‘g‘ri qiymatini tekshiring.";
  }
  if(question.type==="word_cloud"&&question.time<20)return "So‘zlar buluti uchun kamida 20 soniya belgilang.";
  if(question.type==="open_ended"&&question.time<20)return "Ochiq savol uchun kamida 20 soniya belgilang.";
  if(question.type==="brainstorm"&&question.time<30)return "G‘oyalar jamlanmasi uchun kamida 30 soniya belgilang.";
  if(question.media){
    try{const url=new URL(question.media);if(!["http:","https:"].includes(url.protocol))throw Error()}catch{return "Media havolasi noto‘g‘ri."}
  }
  return "";
}
function allValidationErrors(){
  const title=$("#quiz-title").value.trim();
  if(title.length<3)return "Viktorina nomi kamida 3 belgidan iborat bo‘lishi kerak.";
  if(title.length>90)return "Viktorina nomi 90 belgidan oshmasligi kerak.";
  for(let i=0;i<state.questions.length;i++){
    const error=validationError(state.questions[i]);
    if(error){state.current=i;render();return "Savol "+(i+1)+": "+error}
  }
  if(!state.questions.length)return "Kamida bitta savol qo‘shing.";
  return "";
}
function markDirty(message="Saqlanmagan o‘zgarishlar"){
  state.dirty=true;
  setSaveState(message,"dirty");
  const error=$("#question-error");if(error)error.textContent="";
  scheduleDraftSave();
  renderQuestionList();
  updateQuestionStatus();
}
function scheduleDraftSave(){
  clearTimeout(draftTimer);
  draftTimer=setTimeout(()=>{
    try{
      if(!state.gameId){
        const data={
          version:2,title:$("#quiz-title").value,subject:$("#quiz-subject").value,
          grade:$("#quiz-grade").value,description:$("#quiz-description").value,
          questions:state.questions,current:state.current,savedAt:Date.now()
        };
        localStorage.setItem(newDraftKey,JSON.stringify(data));
        $("#autosave-label").textContent="Qoralama brauzeringizda saqlandi.";
        setSaveState("Qoralama saqlandi","local");
      }
    }catch{
      $("#autosave-label").textContent="Brauzer qoralamani saqlay olmadi.";
    }
  },500);
}
function updateQuestionStatus(){
  const question=current(),error=validationError(question);
  const status=$("#question-status");
  status.className="qb-question-status "+(error?"is-incomplete":"is-ready");
  status.innerHTML='<i></i> '+(error?"To‘ldirilmoqda":"Tayyor");
  const errorNode=$("#question-error");
  if(errorNode&&errorNode.textContent&&!error)errorNode.textContent="";
}
function icon(type){return typeIcons[type]||typeIcons.quiz}
function renderTypeModal(){
  $("#type-grid").innerHTML=typeGroups.map(group=>
    '<section class="qb-type-group"><h3>'+group.title+'</h3><div>'+
    group.items.map(type=>
      '<button type="button" class="qb-type-option" data-new-type="'+type+'"><span class="qb-type-option-icon">'+icon(type)+'</span><span><strong>'+labels[type]+'</strong><small>'+descriptions[type]+'</small></span><b>＋</b></button>'
    ).join("")+'</div></section>'
  ).join("");
}
function renderQuestionList(){
  const list=$("#question-list");
  list.innerHTML=state.questions.map((question,index)=>{
    const error=validationError(question);
    const prompt=question.prompt.trim()||"Yangi savol";
    return '<button type="button" class="qb-question-item '+(index===state.current?"active":"")+'" data-question-index="'+index+'" draggable="true">'+
      '<span class="qb-question-item-icon">'+icon(question.type)+'</span>'+
      '<span class="qb-question-item-copy"><strong>'+String(index+1).padStart(2,"0")+'. '+escapeHtml(prompt)+'</strong><small>'+escapeHtml(labels[question.type])+' · '+Number(question.time||20)+' soniya</small></span>'+
      '<span class="qb-question-item-state '+(error?"is-incomplete":"is-ready")+'" title="'+(error?"To‘ldirish kerak":"Savol tayyor")+'">'+(error?"!":"✓")+'</span>'+
    '</button>';
  }).join("");
  $("#question-count").textContent=state.questions.length+" / "+MAX_QUESTIONS;
  $("#question-progress").style.width=Math.min(100,state.questions.length/MAX_QUESTIONS*100)+"%";
  $("#footer-add-question").disabled=state.questions.length>=MAX_QUESTIONS;
  $("#open-question-types").disabled=state.questions.length>=MAX_QUESTIONS;
}
function currentTypeInfo(){
  const question=current();
  $("#question-eyebrow").textContent=(state.current+1)+"-SAVOL · "+labels[question.type].toLocaleUpperCase("uz");
  $("#question-heading").textContent=question.prompt.trim()?"Savolingizni tahrirlang":"Savolni yarating";
  $("#current-type-icon").innerHTML=icon(question.type);
  $("#settings-type-icon").innerHTML=icon(question.type);
  $("#current-type-name").textContent=labels[question.type];
  $("#current-type-description").textContent=descriptions[question.type];
  $("#settings-type-name").textContent=labels[question.type];
  $("#question-prompt").value=question.prompt;
  $("#prompt-counter").textContent=question.prompt.length+" / 120";
  $("#setting-time").value=String(question.time);
  $("#points-options").querySelectorAll("[data-points]").forEach(button=>{
    button.classList.toggle("active",Number(button.dataset.points)===Number(question.points));
  });
  $("#points-setting").hidden=noPoints.has(question.type);
  $("#multiple-setting").hidden=question.type!=="quiz";
  $("#multiple-answers").checked=!!question.multiple;
  $("#media-preview").innerHTML=mediaMarkup(question.media,true);
  $("#media-preview").hidden=!question.media;
  $("#media-area").classList.toggle("has-media",!!question.media);
  $("#add-answer").hidden=!["quiz","poll","puzzle"].includes(question.type)||question.type==="true_false"||question.answers.length>=MAX_ANSWERS;
  $("#answer-count").textContent=question.answers.filter(answer=>answer.trim()).length+" / "+(question.type==="puzzle"?MAX_ANSWERS:MAX_ANSWERS);
  $("#answers-title").textContent=question.type==="puzzle"?"To‘g‘ri ketma-ketlik":question.type==="poll"?"Javob variantlari":question.type==="true_false"?"Javobni tanlang":"Javob variantlari";
  $("#answers-help").textContent=question.type==="poll"?"Ishtirokchilar bittasini tanlaydi":question.type==="puzzle"?"Javoblarni to‘g‘ri tartibda joylashtiring":noPoints.has(question.type)?"Erkin javoblar qabul qilinadi":question.multiple?"Barcha to‘g‘ri javoblarni belgilang":"To‘g‘ri javobni belgilang";
  renderAnswerEditor(question);
  updateQuestionStatus();
}
function renderAnswerEditor(question){
  const editor=$("#answer-editor"),special=$("#special-editor");
  special.hidden=true;special.innerHTML="";
  if(["quiz","true_false","poll"].includes(question.type)){
    editor.hidden=false;
    editor.innerHTML=question.answers.map((answer,index)=>{
      const selected=question.correct.includes(index);
      const locked=question.type==="true_false";
      return '<div class="qb-answer-row answer-'+index%4+' '+(selected?"is-correct":"")+'" data-answer-index="'+index+'">'+
        '<button type="button" class="qb-answer-mark" data-mark-answer="'+index+'" '+(question.type==="poll"?"disabled":"")+' aria-label="'+(selected?"To‘g‘ri javob":"To‘g‘ri deb belgilash")+'" title="'+(question.type==="poll"?"So‘rovnoma javoblari baholanmaydi":"To‘g‘ri javobni belgilash")+'">'+
          (question.type==="poll"?'<span class="qb-answer-letter">'+String.fromCharCode(65+index)+'</span>':selected?'<svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>':'<span class="qb-answer-letter">'+String.fromCharCode(65+index)+'</span>')+
        '</button>'+
        '<input type="text" class="qb-answer-input" data-answer-input="'+index+'" maxlength="75" value="'+escapeHtml(answer)+'" placeholder="Javob varianti '+(index+1)+'" '+(locked?"disabled":"")+'>'+
        (question.type!=="true_false"&&question.answers.length>2?'<button type="button" class="qb-answer-remove" data-remove-answer="'+index+'" aria-label="Javobni olib tashlash">×</button>':'')+
      '</div>';
    }).join("");
  }else if(question.type==="type_answer"){
    editor.hidden=true;
    special.hidden=false;
    special.innerHTML='<label class="qb-special-label" for="correct-text">Qabul qilinadigan to‘g‘ri javob</label><input type="text" id="correct-text" maxlength="75" value="'+escapeHtml(question.correctText)+'" placeholder="Masalan, Toshkent"><p>Javob katta-kichik harflarni hisobga olmasdan tekshiriladi.</p>';
  }else if(question.type==="puzzle"){
    editor.hidden=true;
    special.hidden=false;
    special.innerHTML='<div class="qb-special-heading"><strong>To‘g‘ri tartibdagi javoblar</strong><small>O‘quvchi ularni qayta tartiblaydi.</small></div><div class="qb-puzzle-items">'+question.answers.map((answer,index)=>
      '<div class="qb-puzzle-row" draggable="true" data-puzzle-index="'+index+'"><span class="qb-puzzle-grip">⠿</span><b>'+(index+1)+'</b><input type="text" data-puzzle-input="'+index+'" maxlength="75" value="'+escapeHtml(answer)+'" placeholder="Tartib '+(index+1)+'"><div><button type="button" data-puzzle-move="'+index+'" data-direction="-1" '+(index===0?"disabled":"")+' aria-label="Yuqoriga">↑</button><button type="button" data-puzzle-move="'+index+'" data-direction="1" '+(index===question.answers.length-1?"disabled":"")+' aria-label="Pastga">↓</button></div></div>'
    ).join("")+'</div>';
    $("#add-answer").hidden=question.answers.length>=MAX_ANSWERS;
  }else if(question.type==="slider"){
    editor.hidden=true;
    special.hidden=false;
    const slider=question.slider;
    special.innerHTML='<div class="qb-special-heading"><strong>Sonli javob chegaralari</strong><small>O‘quvchi siljitgichdan qiymat tanlaydi.</small></div><div class="qb-slider-fields"><label>Eng kichik qiymat<input type="number" id="slider-min" value="'+slider.min+'"></label><label>Eng katta qiymat<input type="number" id="slider-max" value="'+slider.max+'"></label><label>Qadam<input type="number" id="slider-step" min="0.01" value="'+slider.step+'"></label><label>To‘g‘ri javob<input type="number" id="slider-target" value="'+slider.target+'"></label></div><p>To‘g‘ri qiymat tanlangan diapazon ichida bo‘lishi kerak.</p>';
  }else{
    editor.hidden=true;
    special.hidden=false;
    const settings={
      poll:["O‘quvchilar bitta variantni tanlaydi","Javoblar ball bilan baholanmaydi."],
      word_cloud:["Qisqa javoblar yig‘iladi","Har bir o‘quvchi bitta so‘z yoki qisqa ibora yuboradi."],
      open_ended:["Erkin javoblar qabul qilinadi","O‘quvchilar savolga o‘z fikrini yozadi."],
      brainstorm:["Bir nechta g‘oyani yuborish","Bir nechta fikrni yangi qatordan yozish mumkin."]
    }[question.type]||["Javob yuboriladi","Bu tur avtomatik ball bermaydi."];
    special.innerHTML='<div class="qb-response-info"><span>'+icon(question.type)+'</span><div><strong>'+settings[0]+'</strong><p>'+settings[1]+'</p><small>Bu savol turi uchun to‘g‘ri yoki noto‘g‘ri belgisi yo‘q.</small></div></div>';
  }
  editor.querySelectorAll("[data-answer-input]").forEach(input=>{
    input.addEventListener("input",()=>{question.answers[Number(input.dataset.answerInput)]=input.value;markDirty();$("#answer-count").textContent=question.answers.filter(answer=>answer.trim()).length+" / 6"});
  });
  editor.querySelectorAll("[data-mark-answer]").forEach(button=>button.addEventListener("click",()=>toggleCorrect(Number(button.dataset.markAnswer))));
  editor.querySelectorAll("[data-remove-answer]").forEach(button=>button.addEventListener("click",()=>removeAnswer(Number(button.dataset.removeAnswer))));
  special.querySelectorAll("[data-puzzle-input]").forEach(input=>input.addEventListener("input",()=>{question.answers[Number(input.dataset.puzzleInput)]=input.value;markDirty()}));
  special.querySelectorAll("[data-puzzle-move]").forEach(button=>button.addEventListener("click",()=>movePuzzle(Number(button.dataset.puzzleMove),Number(button.dataset.direction))));
  const correctInput=$("#correct-text");if(correctInput)correctInput.addEventListener("input",()=>{question.correctText=correctInput.value;markDirty()});
  for(const [id,key] of [["slider-min","min"],["slider-max","max"],["slider-step","step"],["slider-target","target"]]){
    const input=$("#"+id);if(input)input.addEventListener("input",()=>{question.slider[key]=Number(input.value);markDirty()});
  }
}
function toggleCorrect(index){
  const question=current();
  if(question.type==="poll"||question.type==="true_false")return;
  if(question.multiple){
    if(question.correct.includes(index))question.correct=question.correct.filter(item=>item!==index);
    else question.correct.push(index);
  }else question.correct=[index];
  renderAnswerEditor(question);markDirty();updateQuestionStatus();
}
function removeAnswer(index){
  const question=current();
  if(question.answers.length<=2){toast("Kamida 2 ta javob varianti qolishi kerak.");return}
  question.answers.splice(index,1);
  question.correct=question.correct.filter(value=>value!==index).map(value=>value>index?value-1:value);
  if(question.type==="quiz"&&!question.correct.length)question.correct=[0];
  renderAnswerEditor(question);markDirty();
}
function movePuzzle(index,direction){
  const question=current(),target=index+direction;
  if(target<0||target>=question.answers.length)return;
  [question.answers[index],question.answers[target]]=[question.answers[target],question.answers[index]];
  renderAnswerEditor(question);markDirty();
}
function render(){
  renderQuestionList();currentTypeInfo();renderTypeModal();
}
function addQuestion(type="quiz"){
  if(state.questions.length>=MAX_QUESTIONS){toast("Bitta viktorinada 200 tagacha savol bo‘lishi mumkin.");return}
  const previous=current();
  const next=fresh(type);
  next.prompt="";
  next.time=previous?.time||20;
  next.points=noPoints.has(type)?0:(previous?.points??1000);
  next.media="";
  state.questions.splice(state.current+1,0,next);
  state.current++;
  $("#type-modal").hidden=true;
  render();markDirty("Yangi savol");
  $("#question-prompt").focus();
}
function changeType(type){
  if(!labels[type])return;
  const old=current();
  if(old.type===type){$("#type-modal").hidden=true;return}
  const next=fresh(type);
  next.prompt=old.prompt;next.time=old.time;next.media=old.media;
  next.points=noPoints.has(type)?0:old.points;
  if(type==="poll")next.answers=old.answers.length?old.answers.slice(0,MAX_ANSWERS):["",""];
  if(type==="quiz")next.answers=old.answers.length?old.answers.slice(0,MAX_ANSWERS):["","","",""];
  if(type==="puzzle")next.answers=old.answers.length?old.answers.slice(0,MAX_ANSWERS):["","","",""];
  if(type==="type_answer")next.correctText=old.correctText||"";
  if(type==="slider")next.slider={...old.slider};
  state.questions[state.current]=next;
  $("#type-modal").hidden=true;render();markDirty("Savol turi o‘zgardi");
}
function duplicateQuestion(){
  if(state.questions.length>=MAX_QUESTIONS){toast("Savollar limiti 200 ta.");return}
  const copy=JSON.parse(JSON.stringify(current()));
  state.questions.splice(state.current+1,0,copy);state.current++;
  render();markDirty("Savol nusxalandi");
}
function deleteQuestion(){
  if(state.questions.length<=1){toast("Viktorinada kamida bitta savol bo‘lishi kerak.");return}
  if(!confirm((state.current+1)+"-savolni o‘chirmoqchimisiz?"))return;
  state.questions.splice(state.current,1);state.current=Math.max(0,state.current-1);
  render();markDirty("Savol o‘chirildi");
}
function reorderQuestions(from,to){
  if(from===to||from<0||to<0||from>=state.questions.length||to>=state.questions.length)return;
  const [item]=state.questions.splice(from,1);state.questions.splice(to,0,item);
  state.current=to;render();markDirty("Savollar tartibi o‘zgardi");
}
function mediaMarkup(value,withRemove=false){
  if(!value)return "";
  let url;try{url=new URL(value)}catch{return '<div class="qb-media-invalid">Media havolasi noto‘g‘ri.</div>'}
  if(!["http:","https:"].includes(url.protocol))return "";
  const safe=escapeHtml(url.href),host=url.hostname.toLowerCase();
  const id=(host==="youtu.be"?url.pathname.slice(1):url.searchParams.get("v"))||"";
  let content="";
  if((host==="youtube.com"||host.endsWith(".youtube.com")||host==="youtu.be")&&/^[A-Za-z0-9_-]{6,15}$/.test(id)){
    content='<div class="qb-media-embed"><iframe src="https://www.youtube-nocookie.com/embed/'+escapeHtml(id)+'" title="YouTube video" loading="lazy" allowfullscreen></iframe></div>';
  }else if(/.(png|jpe?g|gif|webp|avif)(?.*)?$/i.test(url.pathname)){
    content='<img src="'+safe+'" alt="Savol uchun rasm">';
  }else if(/.(mp4|webm|ogg)(?.*)?$/i.test(url.pathname)){
    content='<video src="'+safe+'" controls playsinline></video>';
  }else{
    content='<a href="'+safe+'" target="_blank" rel="noopener">Media havolasini ochish ↗</a>';
  }
  return '<div class="qb-media-preview-inner">'+content+(withRemove?'<button type="button" id="remove-media" class="qb-remove-media">Media olib tashlash</button>':'')+'</div>';
}
function applyMedia(){
  const value=$("#media-url").value.trim();
  if(!value){toast("Avval media havolasini kiriting.");return}
  try{const url=new URL(value);if(!["http:","https:"].includes(url.protocol))throw Error();current().media=url.href;$("#media-modal").hidden=true;render();markDirty("Media qo‘shildi");}
  catch{toast("To‘g‘ri http yoki https havolasini kiriting.")}
}
function removeMedia(){current().media="";render();markDirty("Media olib tashlandi")}
function applyTimeToAll(){
  const time=Number($("#setting-time").value);
  for(const question of state.questions)question.time=time;
  currentTypeInfo();markDirty("Vaqt barcha savollarga qo‘llandi");toast("Vaqt barcha savollarga qo‘llandi.");
}
function updateDraftFromStorage(){
  try{
    const raw=localStorage.getItem(newDraftKey);
    if(!raw)return false;
    const draft=JSON.parse(raw);
    if(draft.version!==2||!Array.isArray(draft.questions)||!draft.questions.length)return false;
    if(!confirm("Saqlanmagan viktorina qoralamasi topildi. Uni tiklaysizmi?")){localStorage.removeItem(newDraftKey);return false}
    $("#quiz-title").value=draft.title||"Yangi viktorina";
    $("#quiz-subject").value=draft.subject||"";
    $("#quiz-grade").value=draft.grade||"";
    $("#quiz-description").value=draft.description||"";
    state.questions=draft.questions.map(question=>({...fresh(question.type),...question,slider:{...fresh(question.type).slider,...(question.slider||{})}}));
    state.current=Math.min(Math.max(0,Number(draft.current)||0),state.questions.length-1);
    state.dirty=true;setSaveState("Tiklangan qoralama","dirty");
    return true;
  }catch{return false}
}
function mediaPreviewReset(){const node=$("#media-preview");node.hidden=!current().media;node.innerHTML=mediaMarkup(current().media,true)}
function updateTitle(){
  const title=$("#quiz-title").value.trim();
  document.title=(title||"Viktorina yaratish")+" — MUDARRIS JOIN";
}
function payloadQuestions(){
  return state.questions.map(question=>{
    const payload={
      type:question.type,prompt:question.prompt.trim(),time:Number(question.time)||20,
      points:noPoints.has(question.type)?0:Number(question.points)||0,
      media:question.media||"",options:[],correct:""
    };
    if(question.type==="quiz"||question.type==="true_false"){
      const active=activeAnswers(question);
      const indexes=question.correct.filter(index=>active.some(answer=>answer.index===index));
      payload.options=active.map(answer=>answer.text);
      const texts=indexes.map(index=>question.answers[index]);
      payload.correct=question.multiple?JSON.stringify(texts):String(texts[0]||"");
    }else if(question.type==="poll"){
      payload.options=activeAnswers(question).map(answer=>answer.text);payload.correct="";
    }else if(question.type==="puzzle"){
      payload.options=question.answers.map(answer=>answer.trim());payload.correct=JSON.stringify(question.answers.map(answer=>answer.trim()));
    }else if(question.type==="slider"){
      const slider=question.slider;
      payload.options=[String(slider.min),String(slider.max),String(slider.step),String(slider.tolerance||0)];
      payload.correct=String(slider.target);
    }else if(question.type==="type_answer"){
      payload.correct=question.correctText.trim();
    }
    return payload;
  });
}
async function saveQuiz(){
  if(state.busy)return null;
  const validation=allValidationErrors();
  if(validation){toast(validation);$("#question-error").textContent=validation;return null}
  const payload={
    title:$("#quiz-title").value.trim(),
    subject:$("#quiz-subject").value.trim(),
    grade:$("#quiz-grade").value.trim(),
    description:$("#quiz-description").value.trim(),
    questions:payloadQuestions()
  };
  state.busy=true;
  setSaveState("Saqlanmoqda…","saving");
  $("#save-quiz").disabled=true;$("#save-quiz-top").disabled=true;$("#save-and-play").disabled=true;
  try{
    if(state.gameId){
      await api("games/"+encodeURIComponent(state.gameId),{method:"PUT",body:JSON.stringify(payload)});
      toast("Viktorina yangilandi.");
    }else{
      const data=await api("games",{method:"POST",body:JSON.stringify(payload)});
      if(!data.game?.id)throw Error("Viktorina saqlandi, ammo ID qaytmadi.");
      state.gameId=data.game.id;
      history.replaceState(null,"","/create.html?id="+encodeURIComponent(state.gameId));
      localStorage.removeItem(newDraftKey);
    }
    state.dirty=false;setSaveState("Barcha o‘zgarishlar saqlandi","saved");
    $("#autosave-label").textContent="Viktorina serverda saqlandi.";
    return state.gameId;
  }catch(error){
    setSaveState("Saqlashda xatolik","error");
    toast(error.message);
    return null;
  }finally{
    state.busy=false;
    $("#save-quiz").disabled=false;$("#save-quiz-top").disabled=false;$("#save-and-play").disabled=false;
  }
}
function renderPreview(){
  const question=state.questions[state.previewIndex];
  if(!question)return;
  $("#preview-step").textContent=(state.previewIndex+1)+" / "+state.questions.length;
  $("#preview-title").textContent=question.prompt||"Savol matni shu yerda ko‘rinadi.";
  $("#preview-media").innerHTML=mediaMarkup(question.media);
  let answers="";
  if(["quiz","true_false","poll"].includes(question.type)){
    answers=question.answers.filter(answer=>answer.trim()).map((answer,index)=>{
      const correct=question.correct.includes(index);
      return '<div class="qb-preview-answer answer-'+index%4+'"><span>'+String.fromCharCode(65+index)+'</span>'+escapeHtml(answer)+(question.type!=="poll"&&correct?'<b>✓</b>':'')+'</div>';
    }).join("");
  }else if(question.type==="puzzle"){
    answers=question.answers.map((answer,index)=>'<div class="qb-preview-puzzle"><b>'+(index+1)+'</b>'+escapeHtml(answer)+'</div>').join("");
  }else if(question.type==="slider"){
    answers='<div class="qb-preview-slider"><span>'+question.slider.min+'</span><input type="range" min="'+question.slider.min+'" max="'+question.slider.max+'" step="'+question.slider.step+'" value="'+question.slider.target+'" disabled><span>'+question.slider.max+'</span></div>';
  }else if(question.type==="type_answer"){
    answers='<div class="qb-preview-typed">Javobingizni yozing…</div>';
  }else{
    answers='<div class="qb-preview-typed">'+escapeHtml(question.type==="word_cloud"?"Bitta so‘z yoki ibora kiriting":question.type==="brainstorm"?"G‘oyalaringizni yozing":"Javobingizni yozing…")+'</div>';
  }
  $("#preview-answers").innerHTML=answers;
  $("#preview-previous").disabled=state.previewIndex===0;
  $("#preview-next").disabled=state.previewIndex===state.questions.length-1;
}
function openPreview(){state.previewIndex=state.current;renderPreview();$("#preview-modal").hidden=false}
function closeModal(){
  document.querySelectorAll(".qb-modal-backdrop").forEach(modal=>modal.hidden=true);
}
function parseCsv(text){
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){
    const char=text[i],next=text[i+1];
    if(char==='"'&&quoted&&next==='"'){cell+='"';i++}
    else if(char==='"'){quoted=!quoted}
    else if((char===","||char==="\t")&&!quoted){row.push(cell);cell=""}
    else if((char==="\n"||char==="\r")&&!quoted){
      if(char==="\r"&&next==="\n")i++;
      row.push(cell);if(row.some(value=>String(value).trim()))rows.push(row);row=[];cell="";
    }else cell+=char;
  }
  row.push(cell);if(row.some(value=>String(value).trim()))rows.push(row);
  return rows;
}
async function importCsv(file){
  if(!file)return;
  if(state.questions.length>=MAX_QUESTIONS){toast("Savollar limiti 200 ta.");return}
  try{
    const rows=parseCsv(await file.text());
    if(!rows.length)throw Error("Faylda savollar topilmadi.");
    const first=rows[0].map(value=>value.trim().toLocaleLowerCase("uz"));
    const hasHeader=first.some(value=>["savol","question","javob 1","answer 1","to‘g‘ri javob","correct"].includes(value));
    const dataRows=hasHeader?rows.slice(1):rows;
    const imported=[];
    for(const row of dataRows){
      const prompt=String(row[0]||"").trim();
      if(!prompt)continue;
      const question=fresh("quiz");
      question.prompt=prompt.slice(0,120);
      question.answers=row.slice(1,7).map(value=>String(value||"").trim().slice(0,75));
      while(question.answers.length<4)question.answers.push("");
      const correctRaw=String(row[7]||"1").trim();
      const byText=question.answers.findIndex(answer=>answer.toLocaleLowerCase("uz")===correctRaw.toLocaleLowerCase("uz"));
      const numeric=Number(correctRaw);
      const correctIndex=byText>=0?byText:Number.isInteger(numeric)&&numeric>=1&&numeric<=6?numeric-1:0;
      question.correct=[Math.min(correctIndex,question.answers.length-1)];
      const time=Number(row[8]);if([5,10,20,30,60,90,120,180,240].includes(time))question.time=time;
      const points=Number(row[9]);if([0,1000,2000].includes(points))question.points=points;
      imported.push(question);
    }
    if(!imported.length)throw Error("CSV ichida savol satrlari topilmadi.");
    const available=MAX_QUESTIONS-state.questions.length;
    const toAdd=imported.slice(0,available);
    state.questions.splice(state.current+1,0,...toAdd);state.current++;
    render();markDirty(toAdd.length+" ta savol import qilindi");
    toast(toAdd.length+" ta savol import qilindi.");
  }catch(error){toast(error.message||"CSV faylini o‘qib bo‘lmadi.")}
  finally{$("#import-file").value=""}
}
function bindEvents(){
  $("#question-prompt").addEventListener("input",event=>{
    const question=current();question.prompt=event.target.value;
    $("#prompt-counter").textContent=question.prompt.length+" / 120";
    $("#question-heading").textContent=question.prompt.trim()?"Savolingizni tahrirlang":"Savolni yarating";
    markDirty();
  });
  for(const id of ["quiz-title","quiz-subject","quiz-grade","quiz-description"]){
    $("#"+id).addEventListener("input",()=>{updateTitle();markDirty()});
  }
  $("#setting-time").addEventListener("change",event=>{current().time=Number(event.target.value);markDirty();renderQuestionList()});
  $("#points-options").addEventListener("click",event=>{
    const button=event.target.closest("[data-points]");if(!button)return;
    current().points=Number(button.dataset.points);
    $("#points-options").querySelectorAll("[data-points]").forEach(node=>node.classList.toggle("active",node===button));
    markDirty();
  });
  $("#multiple-answers").addEventListener("change",event=>{
    const question=current();question.multiple=event.target.checked;
    if(!question.multiple&&question.correct.length>1)question.correct=[question.correct[0]];
    renderAnswerEditor(question);markDirty();
  });
  $("#add-answer").addEventListener("click",()=>{
    const question=current();
    if(question.answers.length>=MAX_ANSWERS){toast("Ko‘pi bilan 6 ta javob qo‘shish mumkin.");return}
    question.answers.push("");
    renderAnswerEditor(question);markDirty();
    const input=$('[data-answer-input="'+(question.answers.length-1)+'"]');if(input)input.focus();
  });
  $("#open-question-types").addEventListener("click",()=>{$("#type-modal").hidden=false});
  $("#change-question-type").addEventListener("click",()=>{$("#type-modal").hidden=false});
  $("#type-grid").addEventListener("click",event=>{
    const button=event.target.closest("[data-new-type]");if(!button)return;
    if(button.dataset.newType==="quiz"&&current().type==="quiz"){
      addQuestion("quiz");
    }else if(button.dataset.newType===current().type){
      addQuestion(button.dataset.newType);
    }else{
      changeType(button.dataset.newType);
    }
  });
  $("#duplicate-question").addEventListener("click",duplicateQuestion);
  $("#delete-question").addEventListener("click",deleteQuestion);
  $("#footer-add-question").addEventListener("click",()=>{$("#type-modal").hidden=false});
  $("#question-list").addEventListener("click",event=>{
    const item=event.target.closest("[data-question-index]");if(!item)return;
    state.current=Number(item.dataset.questionIndex);render();
  });
  $("#question-list").addEventListener("dragstart",event=>{
    const item=event.target.closest("[data-question-index]");if(!item)return;
    state.dragIndex=Number(item.dataset.questionIndex);event.dataTransfer.setData("text/plain",String(state.dragIndex));event.dataTransfer.effectAllowed="move";
    item.classList.add("is-dragging");
  });
  $("#question-list").addEventListener("dragend",event=>event.target.closest("[data-question-index]")?.classList.remove("is-dragging"));
  $("#question-list").addEventListener("dragover",event=>{if(event.target.closest("[data-question-index]"))event.preventDefault()});
  $("#question-list").addEventListener("drop",event=>{
    const item=event.target.closest("[data-question-index]");if(!item)return;
    event.preventDefault();const from=Number(event.dataTransfer.getData("text/plain")),to=Number(item.dataset.questionIndex);
    if(Number.isInteger(from))reorderQuestions(from,to);
  });
  $("#open-media-modal").addEventListener("click",()=>{$("#media-url").value=current().media||"";$("#media-modal").hidden=false});
  $("#apply-media").addEventListener("click",applyMedia);
  $("#media-url").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();applyMedia()}});
  $("#media-preview").addEventListener("click",event=>{if(event.target.closest("#remove-media"))removeMedia()});
  $("#media-kind-tabs")?.addEventListener("click",event=>{const button=event.target.closest("[data-media-kind]");if(button){state.mediaKind=button.dataset.mediaKind;document.querySelectorAll("[data-media-kind]").forEach(item=>item.classList.toggle("active",item===button))}});
  $("#apply-time-all").addEventListener("click",applyTimeToAll);
  $("#save-quiz").addEventListener("click",saveQuiz);
  $("#save-quiz-top").addEventListener("click",saveQuiz);
  $("#save-and-play").addEventListener("click",async()=>{const id=await saveQuiz();if(id)location.href="/modes.html?game_id="+encodeURIComponent(id)});
  $("#preview-quiz").addEventListener("click",openPreview);
  $("#preview-quiz-top").addEventListener("click",openPreview);
  $("#close-preview").addEventListener("click",()=>{$("#preview-modal").hidden=true});
  $("#preview-modal").addEventListener("click",event=>{if(event.target.id==="preview-modal")$("#preview-modal").hidden=true});
  $("#preview-previous").addEventListener("click",()=>{state.previewIndex=Math.max(0,state.previewIndex-1);renderPreview()});
  $("#preview-next").addEventListener("click",()=>{state.previewIndex=Math.min(state.questions.length-1,state.previewIndex+1);renderPreview()});
  document.querySelectorAll("[data-close-modal]").forEach(button=>button.addEventListener("click",()=>{button.closest(".qb-modal-backdrop").hidden=true}));
  document.querySelectorAll("[data-media-kind]").forEach(button=>button.addEventListener("click",()=>{
    state.mediaKind=button.dataset.mediaKind;
    document.querySelectorAll("[data-media-kind]").forEach(item=>item.classList.toggle("active",item===button));
    const placeholders={image:"Rasm yoki GIF URL",video:"Video URL (MP4 / WebM)",youtube:"YouTube havolasi"};
    $("#media-url").placeholder=placeholders[state.mediaKind]||"https://...";
  }));
  $("#editor-profile-button").addEventListener("click",()=>{
    const popover=$("#editor-profile-popover"),opening=popover.hidden;
    popover.hidden=!opening;$("#editor-profile-button").setAttribute("aria-expanded",String(opening));
  });
  $("#editor-signout").addEventListener("click",async()=>{try{await api("auth/logout",{method:"POST"})}finally{location.href="/login.html"}});
  $("#import-questions").addEventListener("click",()=>$("#import-file").click());
  $("#import-file").addEventListener("change",event=>importCsv(event.target.files?.[0]));
  document.addEventListener("click",event=>{
    if(!event.target.closest(".qb-profile-wrap")){$("#editor-profile-popover").hidden=true;$("#editor-profile-button").setAttribute("aria-expanded","false")}
    if(event.target.classList.contains("qb-modal-backdrop"))event.target.hidden=true;
  });
  document.addEventListener("keydown",event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="s"){event.preventDefault();saveQuiz()}
    if(event.key==="Escape")closeModal();
  });
  window.addEventListener("beforeunload",event=>{
    if(state.dirty&&!state.gameId){event.preventDefault();event.returnValue=""}
  });
}
async function init(){
  bindEvents();
  try{
    const auth=await api("auth/me");
    $("#editor-teacher-name").textContent=auth.teacher.display_name||auth.teacher.email;
    $("#teacher-initial").textContent=(auth.teacher.display_name||auth.teacher.email||"T").trim().slice(0,1).toUpperCase();
    const params=new URLSearchParams(location.search);
    const id=params.get("id");
    if(id){
      if(!/^\d+$/.test(id))throw Error("Viktorina manzili noto‘g‘ri.");
      const data=await api("games/"+encodeURIComponent(id));
      const game=data.game;
      if(!game)throw Error("Viktorina topilmadi.");
      state.gameId=String(game.id);state.gameUpdatedAt=game.updated_at||null;
      $("#quiz-title").value=game.title||"Yangi viktorina";
      $("#quiz-subject").value=game.subject||"";
      $("#quiz-grade").value=game.grade||"";
      $("#quiz-description").value=game.description||"";
      state.questions=(game.questions||[]).map(normalizeLoadedQuestion);
      if(!state.questions.length)state.questions=[fresh("quiz")];
      setSaveState("Serverdagi nusxa","saved");
      $("#autosave-label").textContent="Saqlangan viktorina tahrirlanmoqda.";
    }else{
      state.questions=[fresh("quiz")];
      const restored=updateDraftFromStorage();
      if(!restored)setSaveState("Yangi qoralama","local");
      if(restored)toast("Qoralama tiklandi.");
    }
    state.current=Math.min(state.current,state.questions.length-1);
    updateTitle();render();
  }catch(error){
    if(/kirish|tizimga/i.test(error.message))location.replace("/login.html");
    else{toast(error.message);setSaveState("Yuklashda xatolik","error")}
  }
}
init();
})();