import { db, events } from 'hatchable';
export const access='public';
export const methods=['GET'];
export default async function(req,res){
  const pin=String(req.query?.pin||'').replace(/\D/g,'').slice(0,6);
  if(!/^\d{6}$/.test(pin)) return res.status(400).json({error:'Invalid session.'});
  const {rows}=await db.query('SELECT id FROM live_sessions WHERE pin=$1',[pin]);
  if(!rows.length) return res.status(404).json({error:'Session not found.'});
  res.json(await events.grant(['session:'+pin]));
}