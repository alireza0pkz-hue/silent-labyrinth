export async function onRequestGet({ params, env }) {
  try {
    const token = String(params.token || "").trim();

    if (!token) {
      return Response.json(
        { success: false, error: "توکن نامعتبر است" },
        { status: 400 }
      );
    }

    const result = await env.DB.prepare(`
      SELECT token, name, total_gb, used_gb, expire_date, status, note
      FROM customers
      WHERE token = ?
      LIMIT 1
    `)
      .bind(token)
      .first();

    if (!result) {
      return Response.json(
        { success: false, error: "مشتری پیدا نشد" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      customer: result
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
