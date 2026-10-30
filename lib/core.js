export function cleanText(value, max = 180) {
  return String(value ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
}
export function cleanQuestion(q, index) {
  const type = ['quiz','true_false','type_answer','poll','puzzle','slider','word_cloud','open_ended','brainstorm'].includes(q?.type) ? q.type : 'quiz';
  const prompt = cleanText(q?.prompt, 500);
  const rawOptions = Array.isArray(q?.options) ? q.options : [];
  const options = rawOptions.slice(0, 4).map((o, i) => ({
    id: String(i), text: cleanText(typeof o === 'string' ? o : o?.text, 140)
  }));
  return {
    position: index,
    type,
    prompt,
    options,
    correct: cleanText(q?.correct, 140),
    time: Math.min(120, Math.max(5, Number(q?.time) || 20)),
    points: Math.min(2000, Math.max(0, Number(q?.points) || 1000)),
    media: cleanText(q?.media, 500)
  };
}
export function isCorrect(question, answer) {
  const expected = String(question.correct_answer ?? '').trim().toLocaleLowerCase();
  const actual = String(answer ?? '').trim().toLocaleLowerCase();
  return !!expected && actual === expected;
}
export function scoreAnswer(correct, responseMs, timeLimit, basePoints, streak) {
  if (!correct) return { points: 0, streak: 0 };
  const remaining = Math.max(0, timeLimit * 1000 - responseMs);
  const speed = Math.round((remaining / (timeLimit * 1000)) * Math.min(500, basePoints * 0.5));
  const bonus = Math.min(300, Math.max(0, streak) * 50);
  return { points: Math.max(100, basePoints + speed + bonus), streak: streak + 1 };
}
export async function teacherFor(user, db) {
  const email = String(user.email || '').toLowerCase();
  const name = user.name || email.split('@')[0] || 'Teacher';
  await db.query(
    'INSERT INTO teacher_profiles (auth_user_id, email, display_name) VALUES ($1, $2, $3) ON CONFLICT (auth_user_id) DO UPDATE SET email = EXCLUDED.email, updated_at = now()',
    [user.id, email, name]
  );
  const { rows } = await db.query('SELECT auth_user_id, email, display_name FROM teacher_profiles WHERE auth_user_id = $1', [user.id]);
  return rows[0];
}