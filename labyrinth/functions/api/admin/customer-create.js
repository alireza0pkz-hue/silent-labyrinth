export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.DB) {
      return Response.json(
        { error: "D1 binding با نام DB پیدا نشد." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const token = String(body.token || "").trim();
    const name = String(body.name || "").trim();
    const total_gb = Number(body.total_gb || 0);
    const used_gb = Number(body.used_gb || 0);
    const expire_date = String(body.expire_date || "").trim();
    const status = String(body.status || "active").trim();
    const note = String(body.note || "").trim();

    if (!token) {
      return Response.json({ error: "token خالی است." }, { status: 400 });
    }

    if (!name) {
      return Response.json({ error: "نام مشتری خالی است." }, { status: 400 });
    }

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS customers (
        token TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        total_gb REAL DEFAULT 0,
        used_gb REAL DEFAULT 0,
        expire_date TEXT,
        status TEXT DEFAULT 'active',
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const result = await env.DB.prepare(`
      INSERT INTO customers (
        token,
        name,
        total_gb,
        used_gb,
        expire_date,
        status,
        note,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      token,
      name,
      total_gb,
      used_gb,
      expire_date,
      status,
      note
    ).run();

    return Response.json({
      ok: true,
      message: "مشتری ثبت شد.",
      token,
      result
    });

  } catch (err) {
    return Response.json(
      {
        error: err.message || "خطا در ثبت مشتری"
      },
      { status: 500 }
    );
  }
}
