import { db } from 'hatchable';
export const access='public';
export const methods=['GET'];
export default async function(req,res){
  const pin=String(req.params.pin||'').replace(/\D/g,'').slice(0,6);
  const {rows}=await db.query('SELECT s.id,s.pin,s.status,s.current_question,s.join_locked,s.question_started_at,g.title,g.mode FROM live_sessions s JOIN games g ON g.id=s.game_id WHERE s.pin=$1',[pin]);
  if(!rows.length) return res.status(404).json({error:'Game not found.'});
  const s=rows[0];
  const players=await db.query('SELECT id,nickname,avatar,score,streak,last_answered_question FROM players WHERE session_id=$1 ORDER BY joined_at',[s.id]);
  let question=null;
  if(s.status==='playing'&&s.current_question>=0){
    const q=await db.query('SELECT id,position,question_type,prompt,options,time_limit,points,media_url FROM questions WHERE game_id=(SELECT game_id FROM live_sessions WHERE id=$1) AND position=$2',[s.id,s.current_question]);
    if(q.rows.length) question=q.rows[0];
  }
  const leaderboard=s.status==='finished'?players.rows.slice().sort((a,b)=>b.score-a.score):[];
  res.json({session:{pin:s.pin,status:s.status,current_question:s.current_question,join_locked:s.join_locked,title:s.title,mode:s.mode,question_started_at:s.question_started_at},players:players.rows,question,leaderboard});
}