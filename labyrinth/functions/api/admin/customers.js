export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(`
      SELECT token, name, total_gb, used_gb, expire_date, status, note, created_at, updated_at
      FROM customers
      ORDER BY created_at DESC
    `).all();

    return Response.json({
      success: true,
      customers: result.results || []
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
