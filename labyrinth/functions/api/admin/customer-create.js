function generateToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  const token = generateToken();

  await env.DB.prepare(`
    INSERT INTO customers (token, name, total_gb, used_gb, expire_date, status, note, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    token,
    body.name,
    body.total_gb,
    body.used_gb,
    body.expire_date || '',
    body.status || 'active',
    body.note || ''
  ).run();

  return Response.json({ success: true, token });
}
