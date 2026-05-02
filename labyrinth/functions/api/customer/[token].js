export async function onRequest(context) {
  const { request, env, params } = context;
  const token = params.token;

  if (!token) {
    return json({ ok: false, error: "Token is required" }, 400);
  }

  const key = `customer:${token}`;

  if (request.method === "GET") {
    const data = await env.KV.get(key, "json");

    if (!data) {
      return json({ ok: false, error: "Customer not found" }, 404);
    }

    const totalVolume =
      num(data.totalVolume) ??
      num(data.total_mb) ??
      num(data.total) ??
      0;

    const usedVolume =
      num(data.usedVolume) ??
      num(data.used) ??
      0;

    const remainingVolume =
      num(data.remainingVolume) ??
      Math.max(0, totalVolume - usedVolume);

    return json({
      ok: true,
      customer: {
        token: data.token || token,
        name: data.name || "",
        note: data.note || "",
        status: data.status || "",
        expire_date: data.expire_date || "",
        totalVolume,
        usedVolume,
        remainingVolume
      }
    });
  }

  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}

    const oldData = (await env.KV.get(key, "json")) || {};

    const totalVolume =
      num(body.totalVolume) ??
      num(body.total_mb) ??
      num(body.total) ??
      num(oldData.totalVolume) ??
      num(oldData.total_mb) ??
      num(oldData.total) ??
      0;

    const usedVolume =
      num(body.usedVolume) ??
      num(body.used) ??
      num(oldData.usedVolume) ??
      num(oldData.used) ??
      0;

    const remainingVolume =
      num(body.remainingVolume) ??
      Math.max(0, totalVolume - usedVolume);

    const customer = {
      ...oldData,
      token,
      name: val(body.name, oldData.name),
      note: val(body.note, oldData.note),
      status: val(body.status, oldData.status),
      expire_date: val(body.expire_date, oldData.expire_date),
      totalVolume,
      usedVolume,
      remainingVolume
    };

    await env.KV.put(key, JSON.stringify(customer));

    return json({
      ok: true,
      customer
    });
  }

  return json({ ok: false, error: "Method not allowed" }, 405);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function val(newValue, oldValue) {
  return newValue !== undefined ? newValue : (oldValue ?? "");
}
