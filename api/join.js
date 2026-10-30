import { db, events } from 'hatchable';
import { cleanText } from 'lib/core.js';
export const access='public';
export const methods=['POST'];
const blocked=/\b(fuck|shit|bitch|asshole|nigger|porn|sex)\b/i;
export default async function(req,res){
  const pin=String(req.body?.pin||'').replace(/\D/g,'').slice(0,6);
  const nickname=cleanText(req.body?.nickname,18);
  const avatar=cleanText(req.body?.avatar||'tiger',24);
  if(!/^\d{6}$/.test(pin)) return res.status(400).json({error:'Enter a valid 6-digit PIN.'});
  if(nickname.length<2||blocked.test(nickname)) return res.status(400).json({error:'Choose a different nickname.'});
  const found=await db.query("SELECT id,status,join_locked FROM live_sessions WHERE pin=$1 AND status IN ('waiting','playing')",[pin]);
  if(!found.rows.length) return res.status(404).json({error:'That game PIN was not found or the game has ended.'});
  const session=found.rows[0];
  if(session.join_locked) return res.status(423).json({error:'The teacher has locked this lobby.'});
  const count=await db.query('SELECT COUNT(*)::int AS n FROM players WHERE session_id=$1',[session.id]);
  if(count.rows[0].n>=100) return res.status(409).json({error:'This game has reached its player limit.'});
  const exists=await db.query('SELECT id FROM players WHERE session_id=$1 AND lower(nickname)=lower($2)',[session.id,nickname]);
  if(exists.rows.length) return res.status(409).json({error:'That nickname is already in this game. Try another.'});
  const {rows}=await db.query('INSERT INTO players (session_id,nickname,avatar) VALUES ($1,$2,$3) RETURNING id,nickname,avatar,score,streak',[session.id,nickname,avatar]);
  await events.publish('session:'+pin,'lobby_changed',{type:'player_joined'});
  res.status(201).json({player:rows[0],pin});
}