import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const read=path=>readFileSync(resolve(process.cwd(),path),"utf8");
const quiz=read("public/create.js"),backend=read("functions/[[path]].js"),avatars=read("public/avatars.js"),join=read("public/play.js"),race=read("public/racing3d.js"),login=read("public/login.html"),workflow=read(".github/workflows/deploy-cloudflare-pages.yml");
for(const type of ["quiz","true_false","type_answer","puzzle","slider","poll","word_cloud","open_ended","brainstorm","slide"]){
 assert.ok(quiz.includes('"'+type+'"'),"creator type missing: "+type);
 assert.ok(backend.includes('"'+type+'"'),"backend type missing: "+type);
}
for(const id of ["fox","cat","bear","robot","alien","dragon","owl","bunny","tiger","panda","unicorn","dino","frog","koala","shark"])
 assert.ok(avatars.includes('id:"'+id+'"'),"common avatar missing: "+id);
for(const id of ["phoenix","shadowdragon"]){assert.ok(avatars.includes('id:"'+id+'"'),"rare avatar missing: "+id);assert.ok(backend.includes('"'+id+'"'),"rare server rule missing: "+id)}
assert.ok(join.includes("function openAvatarStudio(options={})"),"prejoin avatar studio missing");
assert.ok(join.includes("function setupShooterAim()"),"shooter controls missing");
assert.ok(join.includes("mj-shooter-live-shot"),"shooter shot feedback missing");
assert.ok(race.includes("obstacle.position.z+=delta*trafficSpeed"),"moving racing traffic missing");
assert.ok(race.includes("controls.nitro"),"racing boost control missing");
assert.ok(login.includes("data-password-toggle"),"password visibility control missing");
assert.ok(backend.includes("await env.DB.batch(statements)"),"answer updates must be atomic");
assert.ok(backend.includes("SELECT 1 AS ready"),"health endpoint must probe D1");
assert.ok(!workflow.includes("wrangler deploy --config cloudflare-worker"),"legacy Worker deploy must not block Pages");
console.log("MUDARRIS JOIN smoke checks passed.");
