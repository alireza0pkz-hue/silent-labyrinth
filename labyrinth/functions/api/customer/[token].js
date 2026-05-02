const { kv } = require("@vercel/kv");

function generateToken(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

function normalizeBody(req) {
  if (!req.body) return {};

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
}

function normalizeCustomer(customer, token) {
  const total =
    Number(customer.totalVolume) ||
    Number(customer.total_volume) ||
    Number(customer.total_mb) ||
    Number(customer.total) ||
    Number(customer.volume) ||
    0;

  const used =
    Number(customer.usedVolume) ||
    Number(customer.used_volume) ||
    Number(customer.used_mb) ||
    Number(customer.used) ||
    Number(customer.consumed) ||
    0;

  let remaining =
    Number(customer.remainingVolume) ||
    Number(customer.remaining_volume) ||
    Number(customer.remaining_mb) ||
    Number(customer.remaining) ||
    Number(customer.left) ||
    0;

  if (!remaining && total > 0) {
    remaining = Math.max(total - used, 0);
  }

  return {
    token: customer.token || token,
    name: customer.name || customer.customer_name || "مشتری",
    note: customer.note || customer.description || "",
    status: customer.status || "active",
    expire_date:
      customer.expire_date ||
      customer.expire ||
      customer.expireDate ||
      "unlimited",
    totalVolume: total,
    usedVolume: used,
    remainingVolume: remaining,
    createdAt: customer.createdAt || null,
    updatedAt: customer.updatedAt || null
  };
}

module.exports = async function handler(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "token is required" });
    }

    const method = req.method;

    // ساخت مشتری جدید
    if (
      method === "POST" &&
      ["add", "new", "create"].includes(String(token).toLowerCase())
    ) {
      const body = normalizeBody(req);

      const name = String(body.name || body.customer_name || "").trim();
      const note = String(body.note || body.description || "").trim();
      const status = String(body.status || "active").trim();
      const expire_date = String(
        body.expire_date ||
          body.expire ||
          body.expireDate ||
          "unlimited"
      ).trim();

      const totalVolume =
        Number(body.totalVolume) ||
        Number(body.total_volume) ||
        Number(body.total_mb) ||
        Number(body.total) ||
        Number(body.volume) ||
        0;

      const usedVolume =
        Number(body.usedVolume) ||
        Number(body.used_volume) ||
        Number(body.used_mb) ||
        Number(body.used) ||
        Number(body.consumed) ||
        0;

      let remainingVolume =
        Number(body.remainingVolume) ||
        Number(body.remaining_volume) ||
        Number(body.remaining_mb) ||
        Number(body.remaining) ||
        Number(body.left) ||
        0;

      if (!remainingVolume && totalVolume > 0) {
        remainingVolume = Math.max(totalVolume - usedVolume, 0);
      }

      if (!name) {
        return res.status(400).json({ error: "name is required" });
      }

      let newToken = generateToken();

      for (let i = 0; i < 10; i++) {
        const exists = await kv.get(`customer:${newToken}`);
        if (!exists) break;
        newToken = generateToken();
      }

      const customerData = {
        token: newToken,
        name,
        note,
        status,
        expire_date,
        totalVolume,
        usedVolume,
        remainingVolume,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await kv.set(`customer:${newToken}`, customerData);

      return res.status(200).json({
        success: true,
        token: newToken,
        customer: customerData
      });
    }

    // ویرایش مشتری موجود
    if (method === "PUT" || method === "PATCH" || method === "POST") {
      const existing = await kv.get(`customer:${token}`);

      if (!existing) {
        return res.status(404).json({ error: "customer not found" });
      }

      const body = normalizeBody(req);

      const merged = {
        ...existing,
        ...body,
        token,
        name: body.name ?? body.customer_name ?? existing.name ?? existing.customer_name ?? "مشتری",
        note: body.note ?? body.description ?? existing.note ?? existing.description ?? "",
        status: body.status ?? existing.status ?? "active",
        expire_date:
          body.expire_date ??
          body.expire ??
          body.expireDate ??
          existing.expire_date ??
          existing.expire ??
          existing.expireDate ??
          "unlimited",
        updatedAt: new Date().toISOString()
      };

      const normalized = normalizeCustomer(merged, token);

      const customerData = {
        ...merged,
        ...normalized
      };

      await kv.set(`customer:${token}`, customerData);

      return res.status(200).json({
        success: true,
        token,
        customer: customerData
      });
    }

    // حذف مشتری
    if (method === "DELETE") {
      const existing = await kv.get(`customer:${token}`);

      if (!existing) {
        return res.status(404).json({ error: "customer not found" });
      }

      await kv.del(`customer:${token}`);

      return res.status(200).json({
        success: true,
        deleted: token
      });
    }

    // گرفتن اطلاعات مشتری
    if (method === "GET") {
      const customer = await kv.get(`customer:${token}`);

      if (!customer) {
        return res.status(404).json({ error: "customer not found" });
      }

      return res.status(200).json(normalizeCustomer(customer, token));
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (error) {
    return res.status(500).json({
      error: "internal server error",
      details: error.message
    });
  }
};
