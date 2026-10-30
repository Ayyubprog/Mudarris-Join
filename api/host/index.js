import { db, events } from 'hatchable';
import { teacherFor } from 'lib/core.js';
export const access='user';
export const methods=['POST'];
function makePin(){return String(Math.floor(100000+Math.random()*900000));}
export default async function(req,res){
  const teacher=await teacherFor(req.user,db);
  const gameId=Number(req.body?.game_id);
  if(!Number.isSafeInteger(gameId)||gameId<1) return res.status(400).json({error:'Choose a game first.'});
  const owned=await db.query('SELECT id,title FROM games WHERE id=$1 AND teacher_id=$2',[gameId,teacher.auth_user_id]);
  if(!owned.rows.length) return res.status(404).json({error:'Game not found.'});
  const q=await db.query('SELECT COUNT(*)::int AS n FROM questions WHERE game_id=$1',[gameId]);
  if(!q.rows[0].n) return res.status(400).json({error:'This game has no questions.'});
  let pin,created=false;
  for(let i=0;i<8&&!created;i++){
    pin=makePin();
    const r=await db.query("INSERT INTO live_sessions (pin,game_id,teacher_id) VALUES ($1,$2,$3) ON CONFLICT (pin) DO NOTHING RETURNING id,pin,status",[pin,gameId,teacher.auth_user_id]);
    if(r.rows.length){created=true;break;}
  }
  if(!created) return res.status(503).json({error:'Could not create a game PIN. Please try again.'});
  await events.publish('session:'+pin,'lobby_changed',{type:'session_created'});
  res.status(201).json({session:{pin,game_id:gameId,title:owned.rows[0].title,status:'waiting'}});
}