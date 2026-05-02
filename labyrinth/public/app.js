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

  tableBody.innerHTML = `<tr><td colspan="8">در حال دریافت اطلاعات...</td></tr>`;

  try {
    const data = await fetchJson("/api/admin/customers");
    const customers = Array.isArray(data.customers) ? data.customers : [];

    if (!customers.length) {
      tableBody.innerHTML = `<tr><td colspan="8">هنوز مشتری ثبت نشده است.</td></tr>`;
      return;
    }

    tableBody.innerHTML = customers
      .map((c) => {
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
              <button type="button" onclick="editCustomer('${encodeURIComponent(c.token)}')">ویرایش</button>
              <button type="button" class="danger" onclick="deleteCustomer('${encodeURIComponent(c.token)}')">حذف</button>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="8">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function editCustomer(token) {
  try {
    const data = await fetchJson(`/api/customer/${encodeURIComponent(token)}`);
    if (!data.customer) {
      alert("اطلاعات مشتری پیدا نشد");
      return;
    }
    fillFormForEdit(data.customer);
  } catch (err) {
    alert(err.message || "خطا در دریافت اطلاعات مشتری");
  }
}

async function deleteCustomer(token) {
  if (!confirm("آیا از حذف این مشتری مطمئن هستید؟")) return;

  try {
    await fetchJson("/api/admin/customer-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });

    await loadCustomers();
    resetForm();
    alert("مشتری حذف شد");
  } catch (err) {
    alert(err.message || "خطا در حذف مشتری");
  }
}

function initAdminPage() {
  const form = $("#customerForm");
  const cancelEditBtn = $("#cancelEditBtn");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const editingToken = $("#editingToken")?.value?.trim();
    const name = $("#name")?.value?.trim();
    const totalMb = Number($("#total_mb")?.value || 0);
    const usedMb = Number($("#used_mb")?.value || 0);
    const expireDate = $("#expire_date")?.value?.trim();
    const status = $("#status")?.value || "active";
    const note = $("#note")?.value?.trim() || "";

    if (!name) {
      alert("نام مشتری را وارد کنید");
      return;
    }

    const payload = {
      name,
      total_gb: mbToGb(totalMb),
      used_gb: mbToGb(usedMb),
      expire_date: expireDate,
      status,
      note
    };

    try {
      if (editingToken) {
        await fetchJson("/api/admin/customer-update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token: editingToken,
            ...payload
          })
        });

        alert("اطلاعات مشتری ویرایش شد");
      } else {
        await fetchJson("/api/admin/customer-create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token: makeToken(),
            ...payload
          })
        });

        alert("مشتری جدید ثبت شد");
      }

      resetForm();
      await loadCustomers();
    } catch (err) {
      alert(err.message || "خطا در ذخیره اطلاعات");
    }
  });

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
      resetForm();
    });
  }

  loadCustomers();
}

/* =========================
   CUSTOMER PAGE
========================= */

async function loadCustomerStatus() {
  const path = window.location.pathname;

  if (
    path === "/" ||
    path === "/index.html" ||
    path === "/admin.html" ||
    path.startsWith("/api/")
  ) {
    return;
  }

  const token = decodeURIComponent(path.replace(/^\/+/, "").trim());
  if (!token) return;

  const customerName = $("#customerName");
  const totalBox = $("#totalBox");
  const usedBox = $("#usedBox");
  const remainBox = $("#remainBox");
  const expireBox = $("#expireBox");
  const statusBox = $("#statusBox");
  const noteBox = $("#noteBox");

  try {
    const data = await fetchJson(`/api/customer/${encodeURIComponent(token)}`);
    const c = data.customer;

    if (!c) {
      if (customerName) customerName.textContent = "مشتری پیدا نشد";
      return;
    }

    const totalMb = gbToMb(c.total_gb);
    const usedMb = gbToMb(c.used_gb);
    const remainMb = Math.max(totalMb - usedMb, 0);

    if (customerName) customerName.textContent = c.name || "-";
    if (totalBox) totalBox.textContent = `${totalMb} MB`;
    if (usedBox) usedBox.textContent = `${usedMb} MB`;
    if (remainBox) remainBox.textContent = `${remainMb} MB`;
    if (expireBox) expireBox.textContent = c.expire_date || "-";
    if (statusBox) statusBox.textContent = c.status === "active" ? "فعال" : "غیرفعال";
    if (noteBox) noteBox.textContent = c.note || "-";
  } catch (err) {
    if (customerName) customerName.textContent = err.message || "خطا در دریافت اطلاعات";
  }
}

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  initAdminPage();
  loadCustomerStatus();
});

window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
