const $ = (selector) => document.querySelector(selector);

function gbToMb(gb) {
  return Math.round(Number(gb || 0) * 1024);
}

function mbToGb(mb) {
  return Number((Number(mb || 0) / 1024).toFixed(4));
}

function makeToken(length = 18) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "خطا در ارتباط با سرور");
  }

  return data;
}

/* =========================
   صفحه ادمین
========================= */

async function loadAdminCustomers() {
  const tableBody = $("#customersTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="9">در حال دریافت اطلاعات...</td>
    </tr>
  `;

  try {
    const data = await fetchJson("/api/admin/customers");
    const customers = data.customers || [];

    if (!customers.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9">هنوز مشتری ثبت نشده است.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = customers.map((c) => {
      const totalMb = gbToMb(c.total_gb);
      const usedMb = gbToMb(c.used_gb);
      const remainMb = Math.max(totalMb - usedMb, 0);

      return `
        <tr>
          <td>${c.name || "-"}</td>
          <td>${totalMb} MB</td>
          <td>${usedMb} MB</td>
          <td>${remainMb} MB</td>
          <td>${c.expire_date || "-"}</td>
          <td>
            <span class="status-badge ${c.status === "active" ? "active" : "inactive"}">
              ${c.status === "active" ? "فعال" : "غیرفعال"}
            </span>
          </td>
          <td>
            <a class="customer-link" href="/u/${c.token}" target="_blank">باز کردن</a>
          </td>
          <td>
            <button class="edit-btn" onclick='editCustomer(${JSON.stringify(c)})'>ویرایش</button>
          </td>
          <td>
            <button class="delete-btn" onclick="deleteCustomer('${c.token}')">حذف</button>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9">خطا: ${err.message}</td>
      </tr>
    `;
  }
}

function editCustomer(c) {
  $("#editingToken").value = c.token;
  $("#name").value = c.name || "";
  $("#total_mb").value = gbToMb(c.total_gb);
  $("#used_mb").value = gbToMb(c.used_gb);
  $("#expire_date").value = c.expire_date || "";
  $("#status").value = c.status || "active";
  $("#note").value = c.note || "";

  $("#submitBtn").textContent = "ذخیره ویرایش";
  $("#cancelEditBtn").style.display = "inline-flex";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function cancelEdit() {
  $("#customerForm").reset();
  $("#editingToken").value = "";
  $("#submitBtn").textContent = "ثبت مشتری";
  $("#cancelEditBtn").style.display = "none";
}

async function submitCustomer(e) {
  e.preventDefault();

  const editingToken = $("#editingToken").value.trim();

  const payload = {
    token: editingToken || makeToken(),
    name: $("#name").value.trim(),
    total_gb: mbToGb($("#total_mb").value),
    used_gb: mbToGb($("#used_mb").value),
    expire_date: $("#expire_date").value,
    status: $("#status").value,
    note: $("#note").value.trim()
  };

  if (!payload.name) {
    alert("نام مشتری را وارد کن.");
    return;
  }

  try {
    if (editingToken) {
      await fetchJson("/api/admin/customer-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      alert("اطلاعات مشتری ویرایش شد.");
    } else {
      await fetchJson("/api/admin/customer-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      alert("مشتری جدید ثبت شد.");
    }

    cancelEdit();
    loadAdminCustomers();
  } catch (err) {
    alert("خطا: " + err.message);
  }
}

async function deleteCustomer(token) {
  if (!confirm("این مشتری حذف شود؟")) return;

  try {
    await fetchJson("/api/admin/customer-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });

    loadAdminCustomers();
  } catch (err) {
    alert("خطا: " + err.message);
  }
}

/* =========================
   صفحه مشتری
========================= */

async function loadCustomerPage() {
  const box = $("#customerStatusBox");
  if (!box) return;

  const token = location.pathname.split("/").filter(Boolean).pop();

  if (!token) {
    box.innerHTML = `<div class="error-box">لینک نامعتبر است.</div>`;
    return;
  }

  try {
    const data = await fetchJson(`/api/customer/${token}`);
    const c = data.customer;

    const totalMb = gbToMb(c.total_gb);
    const usedMb = gbToMb(c.used_gb);
    const remainMb = Math.max(totalMb - usedMb, 0);

    const percent = totalMb > 0 ? Math.min(Math.round((usedMb / totalMb) * 100), 100) : 0;

    box.innerHTML = `
      <div class="client-card">
        <div class="client-header">
          <h1>${c.name || "کاربر"}</h1>
          <span class="status-badge ${c.status === "active" ? "active" : "inactive"}">
            ${c.status === "active" ? "فعال" : "غیرفعال"}
          </span>
        </div>

        <div class="usage-circle">
          <div class="circle-inner">
            <strong>${remainMb}</strong>
            <span>MB باقی‌مانده</span>
          </div>
        </div>

        <div class="progress-box">
          <div class="progress-info">
            <span>مصرف‌شده</span>
            <strong>${percent}%</strong>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${percent}%"></div>
          </div>
        </div>

        <div class="stats-grid">
          <div>
            <span>حجم کل</span>
            <strong>${totalMb} MB</strong>
          </div>
          <div>
            <span>مصرف‌شده</span>
            <strong>${usedMb} MB</strong>
          </div>
          <div>
            <span>باقی‌مانده</span>
            <strong>${remainMb} MB</strong>
          </div>
          <div>
            <span>تاریخ انقضا</span>
            <strong>${c.expire_date || "-"}</strong>
          </div>
        </div>

        ${c.note ? `<div class="note-box">${c.note}</div>` : ""}

        <div class="made-by">Made by Alirez∆</div>
      </div>
    `;
  } catch (err) {
    box.innerHTML = `<div class="error-box">اطلاعاتی برای این لینک پیدا نشد.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = $("#customerForm");

  if (form) {
    form.addEventListener("submit", submitCustomer);
    loadAdminCustomers();
  }

  const cancelBtn = $("#cancelEditBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", cancelEdit);
  }

  loadCustomerPage();
});
