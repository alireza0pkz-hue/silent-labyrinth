export async function onRequestGet(context) {
  try {
    const { env, params } = context;
    const token = params.token;

    if (!token) {
      return Response.json(
        { error: "توکن ارسال نشده است" },
        { status: 400 }
      );
    }

    const customer = await env.DB.prepare(`
      SELECT
        token,
        name,
        total_gb,
        used_gb,
        expire_date,
        status,
        note,
        created_at
      FROM customers
      WHERE token = ?
      LIMIT 1
    `)
      .bind(token)
      .first();

    if (!customer) {
      return Response.json(
        { error: "توکن نامعتبر است" },
        { status: 404 }
      );
    }

    return Response.json({ customer });
  } catch (err) {
    return Response.json(
      { error: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
