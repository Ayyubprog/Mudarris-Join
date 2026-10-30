import { db } from 'hatchable';
import { teacherFor, cleanText } from 'lib/core.js';
export const access='user';
export const methods=['GET','POST'];
function code(){return Math.random().toString(36).slice(2,8).toUpperCase();}
export default async function(req,res){
  const teacher=await teacherFor(req.user,db);
  if(req.method==='GET'){
    const {rows}=await db.query('SELECT c.id,c.name,c.grade,c.join_code,c.created_at,COUNT(s.id)::int AS student_count FROM classes c LEFT JOIN class_students s ON s.class_id=c.id WHERE c.teacher_id=$1 GROUP BY c.id ORDER BY c.created_at DESC',[teacher.auth_user_id]);
    return res.json({classes:rows});
  }
  const name=cleanText(req.body?.name,80);
  if(name.length<2) return res.status(400).json({error:'Enter a class name.'});
  let joinCode,rows=[];
  for(let i=0;i<5&&!rows.length;i++){
    joinCode=code();
    const r=await db.query('INSERT INTO classes (teacher_id,name,grade,join_code) VALUES ($1,$2,$3,$4) ON CONFLICT (join_code) DO NOTHING RETURNING id,name,grade,join_code',[teacher.auth_user_id,name,cleanText(req.body?.grade,30),joinCode]);
    rows=r.rows;
  }
  if(!rows.length) return res.status(503).json({error:'Could not create class. Try again.'});
  res.status(201).json({class:rows[0]});
}