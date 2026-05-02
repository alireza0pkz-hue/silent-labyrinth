const { kv } = require("@vercel/kv");

module.exports = async function handler(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "token is required" });
    }

    const customer = await kv.get(`customer:${token}`);

    if (!customer) {
      return res.status(404).json({ error: "customer not found" });
    }

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

    return res.status(200).json({
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
      remainingVolume: remaining
    });
  } catch (error) {
    return res.status(500).json({
      error: "internal server error",
      details: error.message
    });
  }
};
