import { db } from 'hatchable';
import { teacherFor } from 'lib/core.js';
export const access='user';
export const methods=['GET'];
export default async function(req,res){
  const teacher=await teacherFor(req.user,db);
  const {rows}=await db.query(
    "SELECT s.id,s.pin,s.status,s.created_at,s.finished_at,g.title,g.subject,g.mode,COUNT(DISTINCT p.id)::int AS players,COALESCE(AVG(p.score),0)::int AS average_score,COUNT(DISTINCT a.id)::int AS answers,COUNT(DISTINCT a.id) FILTER (WHERE a.is_correct)::int AS correct_answers FROM live_sessions s JOIN games g ON g.id=s.game_id LEFT JOIN players p ON p.session_id=s.id LEFT JOIN answers a ON a.session_id=s.id WHERE s.teacher_id=$1 GROUP BY s.id,g.id ORDER BY s.created_at DESC LIMIT 100",
    [teacher.auth_user_id]
  );
  res.json({reports:rows});
}