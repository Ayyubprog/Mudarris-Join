import { db } from 'hatchable';
export const access='user';
export const methods=['GET','POST','DELETE'];
export default async function(req,res){
  const email=String(req.user.email||'').trim().toLowerCase();
  const admin=await db.query('SELECT email FROM school_admins WHERE email=$1',[email]);
  if(!admin.rows.length) return res.status(403).json({error:'Only a school administrator can manage teacher invitations.'});
  if(req.method==='POST'){
    const target=String(req.body?.email||'').trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) return res.status(400).json({error:'Enter a valid teacher email.'});
    await db.query('INSERT INTO invited_users (email) VALUES (lower($1)) ON CONFLICT DO NOTHING',[target]);
    return res.json({ok:true,message:'Teacher invitation added.'});
  }
  if(req.method==='DELETE'){
    const target=String(req.body?.email||'').trim().toLowerCase();
    await db.query('DELETE FROM invited_users WHERE email=lower($1)',[target]);
    return res.json({ok:true,message:'Pending invitation removed.'});
  }
  const {rows}=await db.query('SELECT email,invited_at FROM invited_users ORDER BY invited_at DESC');
  res.json({invites:rows});
}