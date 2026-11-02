import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const read=path=>readFileSync(resolve(process.cwd(),path),"utf8");
const files={
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
assert.ok(files.dashboard.includes("mudarris-book-purple.svg"),"dashboard must use Mudarris book mark");
assert.ok(files.studentPage.includes("grand-prix-circuit-20261102"),"3D race cache key missing");
assert.ok(files.hostPage.includes("grand-prix-host-20261102"),"host visual cache key missing");
console.log("MUDARRIS JOIN · F1 / Shooter / Classic smoke checks passed.");
