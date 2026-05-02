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
  return String(value)
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
  $("#editingToken").value = customer.token || "";
  $("#name").value = customer.name || "";
  $("#total_mb").value = gbToMb(customer.total_gb || 0);
  $("#used_mb").value = gbToMb(customer.used_gb || 0);
  $("#expire_date").value = customer.expire_date || "";
  $("#status").value = customer.status || "active";
  $("#note").value = customer.note || "";

  $("#submitBtn").textContent = "ذخیره ویرایش";
  $("#cancelEditBtn").classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadCustomers() {
  const tableBody = $("#customersTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="9">در حال دریافت اطلاعات...</td></tr>`;

  try {
    const data = await fetchJson("/api/admin/customers");
    const customers = data.customers || [];

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
            <a class="customer-link" href="/${c.token}" target="_blank">مشاهده</a>
          </td>
          <td>
            <button class="btn edit" data-edit="${c.token}">ویرایش</button>
          </td>
          <td>
            <button class="btn delete" data-delete="${c.token}">حذف</button>
          </td>
        </tr>
      `;
    }).join("");

    tableBody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const token = btn.getAttribute("data-edit");
        const customer = customers.find((x) => x.token === token);
        if (customer) fillFormForEdit(customer);
      });
    });

    tableBody.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const token = btn.getAttribute("data-delete");
        if (!confirm("این مشتری حذف شود؟")) return;

        try {
          await fetchJson("/api/admin/customer-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
          });

          await loadCustomers();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="9">خطا: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function handleCustomerSubmit(e) {
  e.preventDefault();

  const editingToken = $("#editingToken").value.trim();
  const name = $("#name").value.trim();
  const totalMb = Number($("#total_mb").value || 0);
  const usedMb = Number($("#used_mb").value || 0);
  const expireDate = $("#expire_date").value.trim();
  const status = $("#status").value;
  const note = $("#note").value.trim();

  if (!name) {
    alert("نام مشتری را وارد کن.");
    return;
  }

  if (totalMb < 0 || usedMb < 0) {
    alert("مقدار حجم نامعتبر است.");
    return;
  }

  const payload = {
    token: editingToken || makeToken(),
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      alert("مشتری ویرایش شد.");
    } else {
      await fetchJson("/api/admin/customer-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      alert("مشتری ثبت شد.");
    }

    resetForm();
    await loadCustomers();
  } catch (err) {
    alert(err.message);
  }
}

/* =========================
   CUSTOMER PAGE
========================= */

async function loadCustomerStatus() {
  const box = $("#customerStatusBox");
  if (!box) return;

  const path = location.pathname.replace(/^\/+/, "").trim();

  if (!path || path === "admin.html" || path === "index.html") {
    return;
  }

  try {
    const data = await fetchJson(`/api/customer/${path}`);
    const c = data.customer;

    const totalMb = gbToMb(c.total_gb);
    const usedMb = gbToMb(c.used_gb);
    const remainMb = Math.max(totalMb - usedMb, 0);
    const percent = totalMb > 0 ? Math.min(Math.round((usedMb / totalMb) * 100), 100) : 0;

    box.innerHTML = `
      <div class="customer-card">
        <div class="customer-top">
          <h1>${escapeHtml(c.name || "مشتری")}</h1>
          <span class="status-badge ${c.status === "active" ? "active" : "inactive"}">
            ${c.status === "active" ? "فعال" : "غیرفعال"}
          </span>
        </div>

        <div class="big-remaining">
          <strong>${remainMb} MB</strong>
          <span>حجم باقی‌مانده</span>
        </div>

        <div>میزان مصرف: ${percent}%</div>
        <div class="progress">
          <div class="progress-bar" style="width:${percent}%"></div>
        </div>

        <div class="stats">
          <div class="stat">
            <span>حجم کل</span>
            <strong>${totalMb} MB</strong>
          </div>
          <div class="stat">
            <span>مصرف‌شده</span>
            <strong>${usedMb} MB</strong>
          </div>
          <div class="stat">
            <span>باقی‌مانده</span>
            <strong>${remainMb} MB</strong>
          </div>
          <div class="stat">
            <span>تاریخ انقضا</span>
            <strong>${escapeHtml(c.expire_date || "-")}</strong>
          </div>
        </div>

        ${c.note ? `<div class="note-box">${escapeHtml(c.note)}</div>` : ""}
      </div>
    `;
  } catch (err) {
    box.innerHTML = `<div class="error-box">اطلاعات این مشتری پیدا نشد.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = $("#customerForm");
  const cancelBtn = $("#cancelEditBtn");
  const customerBox = $("#customerStatusBox");

  if (form) {
    form.addEventListener("submit", handleCustomerSubmit);
    loadCustomers();
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetForm);
  }

  if (customerBox) {
    loadCustomerStatus();
  }
});
