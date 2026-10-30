import { db } from 'hatchable';
import { teacherFor, cleanText, cleanQuestion } from 'lib/core.js';
export const access = 'user';
export const methods = ['GET','PUT','DELETE'];
export default async function(req,res){
  const teacher=await teacherFor(req.user,db);
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1) return res.status(400).json({error:'Invalid game.'});
  const owned=await db.query('SELECT id FROM games WHERE id=$1 AND teacher_id=$2',[id,teacher.auth_user_id]);
  if(!owned.rows.length) return res.status(404).json({error:'Game not found.'});
  if(req.method==='DELETE'){
    await db.query('DELETE FROM games WHERE id=$1 AND teacher_id=$2',[id,teacher.auth_user_id]);
    return res.json({ok:true});
  }
  if(req.method==='PUT'){
    const b=req.body||{},title=cleanText(b.title,90);
    if(title.length<3) return res.status(400).json({error:'Give your game a title.'});
    const mode=['classic','team','marble','tower','typing','treasure'].includes(b.mode)?b.mode:'classic';
    const questions=Array.isArray(b.questions)?b.questions.slice(0,60):[];
    if(!questions.length) return res.status(400).json({error:'Add at least one question.'});
    await db.query('UPDATE games SET title=$1,subject=$2,grade=$3,description=$4,mode=$5,settings=$6::jsonb,updated_at=now() WHERE id=$7 AND teacher_id=$8',
      [title,cleanText(b.subject,60),cleanText(b.grade,30),cleanText(b.description,240),mode,JSON.stringify(b.settings||{}),id,teacher.auth_user_id]);
    await db.query('DELETE FROM questions WHERE game_id=$1',[id]);
    for(let i=0;i<questions.length;i++){
      const q=cleanQuestion(questions[i],i);
      if(!q.prompt) continue;
      await db.query('INSERT INTO questions (game_id,position,question_type,prompt,options,correct_answer,time_limit,points,media_url) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)',
        [id,q.position,q.type,q.prompt,JSON.stringify(q.options),q.correct,q.time,q.points,q.media]);
    }
  }
  const {rows}=await db.query('SELECT g.id,g.title,g.subject,g.grade,g.description,g.mode,g.settings,g.created_at,q.id AS question_id,q.position,q.question_type,q.prompt,q.options,q.correct_answer,q.time_limit,q.points,q.media_url FROM games g LEFT JOIN questions q ON q.game_id=g.id WHERE g.id=$1 AND g.teacher_id=$2 ORDER BY q.position',[id,teacher.auth_user_id]);
  const first=rows[0];
  res.json({game:{id:first.id,title:first.title,subject:first.subject,grade:first.grade,description:first.description,mode:first.mode,settings:first.settings,created_at:first.created_at,questions:rows.filter(x=>x.question_id).map(x=>({id:x.question_id,type:x.question_type,prompt:x.prompt,options:x.options,correct:x.correct_answer,time:x.time_limit,points:x.points,media:x.media_url}))}});
}