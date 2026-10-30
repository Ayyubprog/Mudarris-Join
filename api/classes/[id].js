import { db } from 'hatchable';
import { teacherFor, cleanText } from 'lib/core.js';
export const access='user';
export const methods=['GET','POST','DELETE'];
export default async function(req,res){
  const teacher=await teacherFor(req.user,db),id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1) return res.status(400).json({error:'Invalid class.'});
  const own=await db.query('SELECT id,name,grade,join_code FROM classes WHERE id=$1 AND teacher_id=$2',[id,teacher.auth_user_id]);
  if(!own.rows.length) return res.status(404).json({error:'Class not found.'});
  if(req.method==='POST'){
    const names=Array.isArray(req.body?.students)?req.body.students.slice(0,100):[req.body?.name];
    let added=0;
    for(const raw of names){const name=cleanText(raw,80);if(name.length<2)continue;await db.query('INSERT INTO class_students (class_id,display_name) VALUES ($1,$2)',[id,name]);added++;}
    return res.json({ok:true,added});
  }
  if(req.method==='DELETE'){
    const studentId=Number(req.body?.student_id);
    if(!Number.isSafeInteger(studentId)) return res.status(400).json({error:'Invalid student.'});
    await db.query('DELETE FROM class_students WHERE id=$1 AND class_id=$2',[studentId,id]);
    return res.json({ok:true});
  }
  const students=await db.query('SELECT id,display_name,external_ref,created_at FROM class_students WHERE class_id=$1 ORDER BY display_name',[id]);
  res.json({class:own.rows[0],students:students.rows});
}