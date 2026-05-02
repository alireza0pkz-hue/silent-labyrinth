const $ = (s) => document.querySelector(s);

function mbToGb(mb) {
  return Number(mb || 0) / 1024;
}

function gbToMb(gb) {
  return Math.round(Number(gb || 0) * 1024);
}

function makeToken(length = 24) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "خطا در ارتباط با سرور");
  }

  return data;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   ADMIN
========================= */

function resetForm() {
  const form = $("#customerForm");
  if (form) form.reset();

  const editingToken = $("#editingToken");
  const submitBtn = $("#submitBtn");
  const cancelEditBtn = $("#cancelEditBtn");

  if (editingToken) editingToken.value = "";
  if (submitBtn) submitBtn.textContent = "ثبت مشتری";
  if (cancelEditBtn) cancelEditBtn.classList.add("hidden");
}

function fillFormForEdit(customer) {
  const editingToken = $("#editingToken");
  const name = $("#name");
  const totalMb = $("#total_mb");
  const usedMb = $("#used_mb");
  const expireDate = $("#expire_date");
  const status = $("#status");
  const note = $("#note");
  const submitBtn = $("#submitBtn");
  const cancelEditBtn = $("#cancelEditBtn");

  if (editingToken) editingToken.value = customer.token || "";
  if (name) name.value = customer.name || "";
  if (totalMb) totalMb.value = gbToMb(customer.total_gb || 0);
  if (usedMb) usedMb.value = gbToMb(customer.used_gb || 0);
  if (expireDate) expireDate.value = customer.expire_date || "";
  if (status) status.value = customer.status || "active";
  if (note) note.value = customer.note || "";

  if (submitBtn) submitBtn.textContent = "ذخیره ویرایش";
  if (cancelEditBtn) cancelEditBtn.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadCustomers() {
  const tableBody = $("#customersTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="9">در حال دریافت اطلاعات...</td></tr>`;

  try {
    const data = await fetchJson("/api/admin/customers");
    const customers = Array.isArray(data.customers) ? data.customers : [];

    if (!customers.length) {
      tableBody.innerHTML = `<tr><td colspan="9">هنوز مشتری ثبت نشده است.</td></tr>`;
      return;
    }

    tableBody.innerHTML = customers.map((c) => {
      const totalMb = gbToMb(c.total_gb);
      const usedMb = gbToMb(c.used_gb);
      const remainMb = Math.max(totalMb - usedMb, 0);

      return `
        <tr>
          <td>${escapeHtml(c.name || "-")}</td>
          <td>${totalMb} MB</td>
          <td>${usedMb} MB</td>
          <td>${remainMb} MB</td>
          <td>${escapeHtml(c.expire_date || "-")}</td>
          <td>
            <span class="status-badge ${c.status === "active" ? "active" : "inactive"}">
              ${c.status === "active" ? "فعال" : "غیرفعال"}
            </span>
          </td>
          <td>
            <a class="customer-link" href="/${encodeURIComponent(c.token)}" target="_blank">مشاهده</a>
          </td>
          <td>
            <button
