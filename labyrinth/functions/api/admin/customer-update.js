export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    const token = String(data.token || "").trim();
    const name = String(data.name || "").trim();
    const total_gb = Number(data.total_gb || 0);
    const used_gb = Number(data.used_gb || 0);
    const expire_date = String(data.expire_date || "").trim();
    const status = String(data.status || "active").trim();
    const note = String(data.note || "").trim();

    if (!token || !name) {
      return Response.json(
        { success: false, error: "اطلاعات ناقص است" },
        { status: 400 }
      );
    }

    await env.DB.prepare(`
      UPDATE customers
      SET
        name = ?,
        total_gb = ?,
        used_gb = ?,
        expire_date = ?,
        status = ?,
        note = ?,
        updated_at = datetime('now')
      WHERE token = ?
    `)
      .bind(name, total_gb, used_gb, expire_date, status, note, token)
      .run();

    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
