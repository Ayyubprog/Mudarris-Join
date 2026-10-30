import { db, events } from 'hatchable';
import { teacherFor } from 'lib/core.js';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
  const teacher=await teacherFor(req.user,db);
  const pin=String(req.params.pin||'').replace(/\D/g,'').slice(0,6);
  const found=await db.query('SELECT s.id,s.pin,s.status,s.current_question,s.join_locked,s.question_started_at,s.game_id,g.title,g.mode FROM live_sessions s JOIN games g ON g.id=s.game_id WHERE s.pin=$1 AND s.teacher_id=$2',[pin,teacher.auth_user_id]);
  if(!found.rows.length) return res.status(404).json({error:'Session not found.'});
  const s=found.rows[0];
  if(req.method==='POST'){
    const action=String(req.body?.action||'');
    if(action==='start'){
      await db.query("UPDATE live_sessions SET status='playing',current_question=0,started_at=now(),question_started_at=now(),paused_at=NULL WHERE id=$1",[s.id]);
    }else if(action==='next'){
      const total=await db.query('SELECT COUNT(*)::int AS n FROM questions WHERE game_id=$1',[s.game_id]);
      const next=s.current_question+1;
      if(next>=total.rows[0].n) await db.query("UPDATE live_sessions SET status='finished',finished_at=now() WHERE id=$1",[s.id]);
      else await db.query('UPDATE live_sessions SET current_question=$1,question_started_at=now(),status=\'playing\',paused_at=NULL WHERE id=$2',[next,s.id]);
    }else if(action==='pause'){
      await db.query("UPDATE live_sessions SET status='paused',paused_at=now() WHERE id=$1",[s.id]);
    }else if(action==='resume'){
      await db.query("UPDATE live_sessions SET status='playing',question_started_at=now(),paused_at=NULL WHERE id=$1",[s.id]);
    }else if(action==='finish'){
      await db.query("UPDATE live_sessions SET status='finished',finished_at=now() WHERE id=$1",[s.id]);
    }else if(action==='lock'||action==='unlock'){
      await db.query('UPDATE live_sessions SET join_locked=$1 WHERE id=$2',[action==='lock',s.id]);
    }else if(action==='remove_player'){
      const playerId=Number(req.body?.player_id);
      if(!Number.isSafeInteger(playerId)) return res.status(400).json({error:'Invalid player.'});
      await db.query('DELETE FROM players WHERE id=$1 AND session_id=$2',[playerId,s.id]);
    }else return res.status(400).json({error:'Unknown host action.'});
    await events.publish('session:'+pin,'game_updated',{action});
  }
  const state=await db.query('SELECT status,current_question,join_locked,question_started_at FROM live_sessions WHERE id=$1',[s.id]);
  const players=await db.query('SELECT id,nickname,avatar,score,streak,joined_at FROM players WHERE session_id=$1 ORDER BY score DESC,joined_at',[s.id]);
  const questions=await db.query('SELECT id,position,question_type,prompt,options,correct_answer,time_limit,points FROM questions WHERE game_id=$1 ORDER BY position',[s.game_id]);
  const current=questions.rows[state.rows[0].current_question]||null;
  const answerStats=current?await db.query('SELECT COUNT(*)::int AS total,COUNT(*) FILTER (WHERE is_correct)::int AS correct FROM answers WHERE session_id=$1 AND question_id=$2',[s.id,current.id]):{rows:[{total:0,correct:0}]};
  res.json({session:{pin,title:s.title,mode:s.mode,...state.rows[0]},players:players.rows,questions:questions.rows.map(q=>({id:q.id,position:q.position,type:q.question_type,prompt:q.prompt,options:q.options,correct:q.correct_answer,time:q.time_limit,points:q.points})),current_question:current?{id:current.id,position:current.position,prompt:current.prompt,correct:current.correct_answer,time:current.time_limit,points:current.points}:null,answer_stats:answerStats.rows[0]});
}