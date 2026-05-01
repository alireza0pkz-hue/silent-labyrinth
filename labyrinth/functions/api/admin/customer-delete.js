export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  await env.DB.prepare(
    `DELETE FROM customers WHERE id = ?`
  ).bind(body.id).run();

  return Response.json({ success: true });
}
