import { db, events } from 'hatchable';
import { scoreAnswer } from 'lib/core.js';
export const access='public';
export const methods=['POST'];
export default async function(req,res){
  const pin=String(req.body?.pin||'').replace(/\D/g,'').slice(0,6);
  const playerId=Number(req.body?.player_id);
  const answer=String(req.body?.answer??'').trim().slice(0,300);
  if(!/^\d{6}$/.test(pin)||!Number.isSafeInteger(playerId)||playerId<1) return res.status(400).json({error:'Invalid answer submission.'});
  const {rows}=await db.query("SELECT s.id AS session_id,s.status,s.current_question,s.question_started_at,p.id AS player_id,p.score,p.streak,p.last_answered_question,q.id AS question_id,q.correct_answer,q.time_limit,q.points FROM live_sessions s JOIN players p ON p.session_id=s.id JOIN questions q ON q.game_id=s.game_id AND q.position=s.current_question WHERE s.pin=$1 AND p.id=$2",[pin,playerId]);
  if(!rows.length||rows[0].status!=='playing') return res.status(409).json({error:'This question is not accepting answers.'});
  const x=rows[0];
  if(x.last_answered_question===x.current_question) return res.status(409).json({error:'You already answered this question.'});
  const elapsed=Math.max(0,Date.now()-new Date(x.question_started_at).getTime());
  const correct=elapsed<=x.time_limit*1000&&String(answer).trim().toLocaleLowerCase()===String(x.correct_answer).trim().toLocaleLowerCase();
  const earned=scoreAnswer(correct,elapsed,x.time_limit,x.points,x.streak);
  const inserted=await db.query('INSERT INTO answers (session_id,player_id,question_id,answer_text,is_correct,points_awarded,response_ms) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (player_id,question_id) DO NOTHING RETURNING id',[x.session_id,playerId,x.question_id,answer,correct,earned.points,elapsed]);
  if(!inserted.rows.length) return res.status(409).json({error:'You already answered this question.'});
  await db.query('UPDATE players SET score=score+$1,streak=$2,last_answered_question=$3 WHERE id=$4',[earned.points,earned.streak,x.current_question,playerId]);
  await events.publish('session:'+pin,'answer_received',{question:x.current_question});
  res.json({ok:true,correct,points:earned.points,total:x.score+earned.points});
}