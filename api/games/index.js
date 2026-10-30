import { db } from 'hatchable';
import { teacherFor, cleanText, cleanQuestion } from 'lib/core.js';
export const access = 'user';
export const methods = ['GET','POST'];
export default async function(req,res){
  const teacher = await teacherFor(req.user,db);
  if(req.method === 'GET'){
    const {rows} = await db.query(
      'SELECT g.id,g.title,g.subject,g.grade,g.description,g.mode,g.created_at,COUNT(q.id)::int AS question_count FROM games g LEFT JOIN questions q ON q.game_id=g.id WHERE g.teacher_id=$1 GROUP BY g.id ORDER BY g.updated_at DESC LIMIT 100',
      [teacher.auth_user_id]
    );
    return res.json({games:rows});
  }
  const body=req.body||{};
  const title=cleanText(body.title,90);
  if(title.length<3) return res.status(400).json({error:'Give your game a title.'});
  const questions=Array.isArray(body.questions)?body.questions.slice(0,60):[];
  if(!questions.length) return res.status(400).json({error:'Add at least one question.'});
  const mode=['classic','team','marble','tower','typing','treasure'].includes(body.mode)?body.mode:'classic';
  const {rows}=await db.query(
    'INSERT INTO games (teacher_id,title,subject,grade,description,mode,settings) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING id,title,subject,grade,description,mode,created_at',
    [teacher.auth_user_id,title,cleanText(body.subject,60),cleanText(body.grade,30),cleanText(body.description,240),mode,JSON.stringify(body.settings||{})]
  );
  const game=rows[0];
  for(let i=0;i<questions.length;i++){
    const q=cleanQuestion(questions[i],i);
    if(!q.prompt) continue;
    await db.query(
      'INSERT INTO questions (game_id,position,question_type,prompt,options,correct_answer,time_limit,points,media_url) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)',
      [game.id,q.position,q.type,q.prompt,JSON.stringify(q.options),q.correct,q.time,q.points,q.media]
    );
  }
  res.status(201).json({game});
}