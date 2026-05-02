export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const token = String(data.token || "").trim();

    if (!token) {
      return Response.json(
        { success: false, error: "توکن نامعتبر است" },
        { status: 400 }
      );
    }

    await env.DB.prepare(`
      DELETE FROM customers
      WHERE token = ?
    `)
      .bind(token)
      .run();

    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
