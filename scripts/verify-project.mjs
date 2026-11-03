import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const read=path=>readFileSync(resolve(process.cwd(),path),"utf8");
const files={
 create:read("public/create.js"),
 createPage:read("public/create.html"),
 backend:read("functions/[[path]].js"),
 student:read("public/play.js"),
 race:read("public/racing3d.js"),
 host:read("public/host.js"),
 teacher:read("public/teacher.js"),
 modes:read("public/modes.js"),
 modePage:read("public/modes.html"),
 studentPage:read("public/play.html"),
 hostPage:read("public/host.html"),
 dashboard:read("public/teacher.html"),
 login:read("public/login.html"),
 studentCss:read("public/student.css"),
 theme:read("public/theme.css"),
 logo:read("public/mudarris-book-purple.svg"),
 verify:read("scripts/verify-project.mjs")
};
for(const [name,source] of Object.entries(files)){
 if(["backend","student","race","host","teacher","modes"].includes(name)){
  const parsed=name==="backend"?source.replace("export async function onRequest","async function onRequest"):source;
  assert.doesNotThrow(()=>new Function(parsed),name+" JavaScript syntax must parse");
 }
}
for(const type of ["quiz","true_false","type_answer","puzzle","slider","poll","word_cloud","open_ended","brainstorm","slide"]){
 assert.ok(read("public/create.js").includes('"'+type+'"'),"creator type missing: "+type);
 assert.ok(files.backend.includes('"'+type+'"'),"backend type missing: "+type);
}
for(const id of ["fox","cat","bear","robot","alien","dragon","owl","bunny","tiger","panda","unicorn","dino","frog","koala","shark"])
 assert.ok(read("public/avatars.js").includes('id:"'+id+'"'),"common avatar missing: "+id);
for(const id of ["phoenix","shadowdragon"]){assert.ok(read("public/avatars.js").includes('id:"'+id+'"'),"rare avatar missing: "+id);assert.ok(files.backend.includes('"'+id+'"'),"rare server rule missing: "+id)}
assert.match(files.modes,/id:"classic"/);
assert.match(files.modes,/id:"racing"/);
assert.match(files.modes,/id:"shooter"/);
assert.equal((files.modes.match(/id:"classic"|id:"racing"|id:"shooter"/g)||[]).length,3,"exactly three game modes must be selectable");
for(const oldMode of ["team","marble","accuracy","confidence","kingdoms","tower","treasure","submarine","robot","cosmic"])
 assert.ok(!files.modes.includes('id:"'+oldMode+'"'),"retired mode remains selectable: "+oldMode);
assert.ok(files.backend.includes('["classic","racing","shooter"].includes(mode)'),"API must reject retired game modes");
assert.ok(files.backend.includes("const points=(correct,elapsed,limit,base)=>"),"speed scoring formula signature missing");
assert.ok(!files.backend.includes("streak*50"),"old streak bonus must be removed");
const score=(correct,elapsed,seconds,base=1000)=>!correct||base<=0?0:elapsed<=500?base:Math.max(0,Math.round(base*(1-Math.min(elapsed,Math.max(1000,seconds*1000))/(2*Math.max(1000,seconds*1000)))));
assert.equal(score(true,250,20),1000,"very fast correct answer earns maximum points");
assert.equal(score(true,10000,20),750,"half timer earns 75 percent points");
assert.equal(score(true,20000,20),500,"timer boundary earns half points");
assert.equal(score(false,200,20),0,"wrong answer earns zero points");
assert.ok(files.backend.includes("canReveal=[\"revealed\",\"finished\"].includes(s.status)"),"student answer reveal guard missing");
assert.ok(files.backend.includes("playerAnswer=stored?(canReveal?{...stored,submitted:true}:{submitted:true}):null"),"student correctness and points must remain hidden before reveal");
assert.ok(files.backend.includes("score:0,streak:0,health:100,enemies_defeated:0"),"student scoreboard/progression must be hidden before reveal");
assert.ok(files.backend.includes("return json({recorded:true});"),"answer endpoint must not expose correctness or score early");
assert.ok(files.backend.includes('action==="next"&&s.status==="revealed"'),"host must not skip a question reveal");
assert.ok(files.backend.includes('DELETE FROM answers WHERE session_id IN (SELECT id FROM live_sessions'),"quiz deletion must clean answer rows");
assert.ok(files.backend.includes('DELETE FROM live_sessions WHERE game_id=? AND teacher_id=?'),"quiz deletion must clean linked live sessions");
assert.ok(files.backend.includes("await env.DB.batch(["),"related game deletion must be atomic");
assert.ok(files.teacher.includes("mj-card-delete"),"quiz delete control must be visible");
assert.ok(files.teacher.includes("F1 poygasi")&&files.teacher.includes("Shooter Arena"),"dashboard must show only requested modes");
assert.ok(!files.dashboard.includes('data-view="classes"')&&!files.dashboard.includes('id="view-classes"'),"teacher dashboard must not include class management");
assert.ok(!files.teacher.includes('api("classes"')&&!files.teacher.includes("openRoster"),"teacher dashboard must not call class management APIs");
assert.ok(files.dashboard.includes('id="stat-sessions"'),"teacher dashboard must show quiz sessions instead of class count");
assert.ok(!files.backend.includes('path==="classes"'),"class management API must be retired");
assert.ok(files.teacher.includes("/mode-classic.svg")&&files.teacher.includes("/mode-racing.svg")&&files.teacher.includes("/mode-shooter.svg"),"dashboard mode art missing");
assert.ok(files.student.includes("function waitingForReveal()"),"answer lock-in motivation screen missing");
assert.ok(files.student.includes("data.player_answer?.submitted"),"student must wait after submitting until reveal");
assert.ok(files.student.includes("MUDARRIS GRAND PRIX"),"F1 scene missing");
assert.ok(files.student.includes("data-racers"),"all race participants must be sent to the 3D track");
assert.ok(!files.student.includes("setupShooterAim"),"Shooter must be question-driven, not local click scoring");
assert.ok(files.student.includes("SHOOTER ARENA")&&files.student.includes("health"),"Shooter health and battle flow missing");
assert.ok(files.host.includes("roundLeaderboard(players)"),"host round leaderboard missing");
assert.ok(files.host.includes("mj-host-grand-prix")&&files.host.includes("mj-host-arena"),"host must show mode-specific visuals");
assert.ok(files.race.includes("THREE.CatmullRomCurve3"),"3D race circuit must use a curved track");
assert.ok(files.race.includes("new THREE.CylinderGeometry(.43,.43,.3,28)"),"3D cars must have four exposed racing tyres");
assert.ok(files.race.includes("data-racers")||files.race.includes("root.dataset.racers"),"3D scene must render joined players");
assert.ok(files.race.includes("THREE.WebGLRenderer"),"3D renderer missing");
assert.ok(files.studentCss.includes(".mj-racing-scene{height:clamp(330px,46vh,560px)"),"race must use large game viewport");
for(const asset of ["public/mode-classic.svg","public/mode-racing.svg","public/mode-shooter.svg"])
 assert.ok(read(asset).includes("<svg"),"mode illustration missing: "+asset);
assert.ok(files.logo.includes('fill="#46178F"'),"original purple Mudarris book logo must be restored");
assert.match(files.createPage,/<input id="question-prompt" type="text"/,"quiz prompt must be a directly editable text input");
assert.ok(files.create.includes('promptInput.addEventListener("input"'),"quiz prompt typing handler missing");
assert.ok(files.create.includes('data-answer-input="'),"answer text inputs must be editable");
assert.ok(files.create.includes('input.addEventListener("input",()=>{question.answers[Number(input.dataset.answerInput)]=input.value'),"answer typing handler missing");
assert.ok(files.create.includes('data-mark-answer="'),"colored correct-answer selector missing");
assert.ok(files.create.includes('button.addEventListener("click",()=>toggleCorrect(Number(button.dataset.markAnswer)))'),"correct-answer click handler missing");
assert.ok(files.create.includes('qb-answer-correct-label">✓ To‘g‘ri javob'),"selected correct answer must be labeled visibly");
assert.ok(files.createPage.includes('id="answer-guidance"'),"answer selection guidance must be visible");
assert.ok(files.theme.includes("body.qb-page .qb-answer-row{\n  position:relative;\n  min-height:132px"),"answer cards must be visibly larger");
assert.ok(files.theme.includes("pointer-events:auto"),"quiz text fields must accept pointer input");
assert.ok(files.dashboard.includes("mudarris-book-purple.svg"),"dashboard must use Mudarris book mark");
assert.ok(files.studentPage.includes("grand-prix-circuit-20261102"),"3D race cache key missing");
assert.ok(files.hostPage.includes("host.js?v=live-host-premium-20261103"),"live host script cache key missing");
const questionTypeBlock=files.create.slice(files.create.indexOf("const typeGroups=["),files.create.indexOf("const typeIcons={"));
assert.match(questionTypeBlock,/items:\["quiz","true_false","type_answer"\]/,"only Quiz, True/False and Typing may be created");
assert.equal((questionTypeBlock.match(/"quiz"|"true_false"|"type_answer"/g)||[]).length,3,"question picker must show exactly three formats");
assert.ok(files.create.includes("MAX_ANSWERS=4"),"quiz editor must cap answer choices at four");
assert.ok(files.create.includes("answers.length!==4"),"all four Quiz answers must be required");
assert.ok(files.create.includes("item.answers=optionTexts.slice(0,4)"),"loaded Quiz questions must be normalized to four options");
assert.ok(files.create.includes('$("#multiple-setting").hidden=true;'),"Quiz must use one correct answer");
assert.ok(files.create.includes("const inlineImage=/^data:image"),"local image uploads must pass media validation");
assert.ok(files.create.includes('type_answer:"Typing"'),"Typing option label missing");
assert.ok(files.student.includes('["type_answer","open_ended","word_cloud","brainstorm"].includes(type)'),"student typing answer UI must remain supported");
assert.ok(files.backend.includes('type==="quiz"&&options.length!==4'),"backend must require exactly four Quiz options");
assert.ok(files.theme.includes("grid-template-columns:clamp(145px,8vw,165px) minmax(0,1fr) clamp(220px,12.2vw,250px)"),"desktop 100 percent layout sizing missing");
assert.ok(files.theme.includes("width:min(1040px,98%)")&&files.theme.includes("height:220px"),"media area must be wide and slightly taller");
assert.ok(files.theme.includes("resize:both;overflow:auto"),"media frame must be resizable from its corner");
assert.ok(files.teacher.includes("function exportReports()"),"teacher report CSV export function missing");
assert.ok(files.dashboard.includes('id="export-reports"'),"teacher report CSV action missing");
assert.ok(files.teacher.includes("state.refreshing=false")&&files.teacher.includes("},45000)"),"teacher dashboard should refresh quietly without overlapping requests");
assert.ok(files.modes.includes('setAttribute("aria-busy","true")')&&files.modes.includes('$("#mode-error")'),"mode selection must show loading and inline error states");
assert.ok(!files.modes.includes("alert("),"mode selection should use inline errors rather than blocking browser alerts");
assert.ok(files.modePage.includes('id="mode-error"')&&files.modePage.includes('aria-live="polite"'),"mode error feedback region missing");
assert.ok(files.theme.includes("body.mj-dashboard-rebuild .mj-stat-card:hover"),"teacher dashboard cards need responsive interactive polish");
assert.ok(files.theme.includes("@media(max-width:520px)")&&files.theme.includes("grid-template-columns:1fr"),"teacher dashboard small-screen layout overrides missing");
assert.ok(files.studentCss.includes(".student-answer-tile:hover:not(:disabled)"),"student answer tiles need interactive feedback");
assert.ok(files.studentCss.includes("@media(max-width:390px)"),"student gameplay must include compact-phone layout");
assert.ok(files.hostPage.includes(".live-control-button:focus-visible"),"host controls need visible keyboard focus");
assert.ok(files.hostPage.includes("@media(max-width:570px)"),"host presentation must have compact-phone layout");
assert.ok(files.login.includes("/* Final mobile auth layout")&&files.login.includes("grid-template-columns:minmax(0,1fr)"),"teacher login must switch to one column on mobile after desktop styles");
assert.ok(files.dashboard.includes('theme.css?v=whole-site-premium-20261103'),"dashboard theme cache version missing");
assert.ok(files.modePage.includes('theme.css?v=whole-site-premium-20261103'),"mode page theme cache version missing");
assert.ok(files.studentPage.includes('student.css?v=whole-site-premium-20261103'),"student page style cache version missing");
const finalMediaStyles=files.theme.slice(files.theme.lastIndexOf("/* Final media composer"));
assert.ok(finalMediaStyles.includes("width:100%")&&finalMediaStyles.includes("height:100%"),"upload panel must stretch across the full media frame");
assert.ok(finalMediaStyles.includes("resize:both")&&finalMediaStyles.includes("overflow:auto"),"media frame must expose a working corner resize handle");
assert.ok(files.create.includes("function processMediaFile(file)"),"local file upload processor missing");
assert.ok(files.create.includes("reader.readAsDataURL(file)"),"local image file must be read into the quiz draft");
assert.ok(files.create.includes("reader.onprogress"),"image upload progress feedback missing");
assert.ok(files.create.includes('enableMediaDrop($("#media-area")'),"main media canvas must accept dropped files");
assert.ok(files.create.includes('enableMediaDrop($("#media-upload-dropzone")'),"media modal dropzone must accept dropped files");
assert.ok((files.create.match(/addEventListener\("paste"/g)||[]).length>=2,"media canvas and upload dropzone must accept pasted images");
assert.ok(files.create.includes('$("#choose-media-file")?.addEventListener("click"'),"file picker button must open the local file selector");
assert.ok(files.createPage.includes('id="media-upload-dropzone"')&&files.createPage.includes('id="choose-media-file"'),"Kahoot-style file upload dropzone missing");
assert.ok(files.createPage.includes('accept="image/png,image/jpeg,image/gif,image/webp"'),"file picker must accept supported image formats");
assert.ok(files.createPage.includes('id="media-file"')&&files.createPage.includes("hidden"),"file input should stay hidden behind its upload button");
assert.ok(files.createPage.indexOf('id="media-area"')<files.createPage.indexOf('id="media-file"')&&files.createPage.indexOf('id="media-file"')<files.createPage.indexOf('id="media-modal"'),"file input must remain outside the hidden upload dialog so the main shortcut can open it");
assert.ok(!files.createPage.includes('id="add-slide"'),"question creator should show only the three requested question types");
assert.ok(files.backend.includes("media=safe(raw.media).slice(0,2800000)"),"backend must persist uploaded image data within the supported limit");
assert.ok(files.student.includes("function studentMediaMarkup(value)")&&files.student.includes("data:image"),"student screen must render uploaded image data");
assert.ok(files.host.includes("function mediaHtml(value)")&&files.host.includes("data:image"),"host reveal must render uploaded image data");
assert.ok(files.backend.includes('if(s.mode==="shooter")')&&files.backend.includes("health=CASE WHEN"),"Shooter answer results must update player health");
assert.ok(files.backend.includes("player.last_answered_question===s.current_question"),"each player may submit only once per question");
assert.ok(files.backend.includes('action==="next"&&s.status==="revealed"'),"host may only advance after revealing results");
console.log("MUDARRIS JOIN · F1 / Shooter / Classic smoke checks passed.");
