import { db } from 'hatchable';
import { teacherFor } from 'lib/core.js';
export const access = 'user';
export const methods = ['GET','PATCH'];
export default async function(req,res){
  const teacher = await teacherFor(req.user, db);
  if(req.method === 'PATCH'){
    const name = String(req.body?.display_name || '').trim().slice(0,80);
    if(name.length < 2) return res.status(400).json({error:'Name must be at least 2 characters.'});
    await db.query('UPDATE teacher_profiles SET display_name = $1, updated_at = now() WHERE auth_user_id = $2',[name,req.user.id]);
    return res.json({teacher:{...teacher,display_name:name}});
  }
  res.json({teacher});
}