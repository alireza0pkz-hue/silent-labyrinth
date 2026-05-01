async function loadCustomers() {
  const box = document.getElementById('customers');
  if (!box) return;

  box.innerHTML = `<div class="empty-box">در حال دریافت اطلاعات...</div>`;

  const res = await fetch('/api/admin/customers');
  const data = await res.json();

  if (!data.length) {
    box.innerHTML = `<div class="empty-box">هنوز هیچ مشتری‌ای ثبت نشده است.</div>`;
    return;
  }

  box.innerHTML = '';

  data.forEach(c => {
    const remain = Math.max(0, Number(c.total_gb) - Number(c.used_gb));
    const percent = Number(c.total_gb) > 0
      ? Math.min(100, (Number(c.used_gb) / Number(c.total_gb)) * 100)
      : 0;

    const statusText = c.status === 'active' ? 'فعال' : 'غیرفعال';
    const statusClass = c.status === 'active' ? 'badge-active' : 'badge-inactive';
    const customerLink = `${window.location.origin}/api/customer/${c.token}`;

    const div = document.createElement('div');
    div.className = 'customer-card';
    div.innerHTML = `
      <div class="customer-top">
        <div>
          <div class="customer-name">${c.name}</div>
          <div class="muted">توکن: ${c.token}</div>
        </div>
        <div class="badge ${statusClass}">${statusText}</div>
      </div>

      <div class="stats">
        <div class="stat-box">
          <div class="stat-label">حجم کل</div>
          <div class="stat-value">${c.total_gb} GB</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">مصرف‌شده</div>
          <div class="stat-value">${c.used_gb} GB</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">باقی‌مانده</div>
          <div class="stat-value">${remain} GB</div>
        </div>
      </div>

      <div class="progress-wrap">
        <div class="progress-head">
          <span>میزان مصرف</span>
          <span>${percent.toFixed(1)}%</span>
        </div>
        <div class="progress">
          <div class="progress-bar" style="width:${percent}%"></div>
        </div>
      </div>

      <p class="muted" style="margin-top:12px;">تاریخ انقضا: ${c.expire_date || '-'}</p>
      <p class="muted">یادداشت: ${c.note || '-'}</p>

      <div class="link-box">${customerLink}</div>

      <div class="action-row">
        <a class="btn btn-secondary" href="${customerLink}" target="_blank">باز کردن صفحه مشتری</a>
        <button class="btn btn-danger" onclick="deleteCustomer(${c.id})">حذف مشتری</button>
      </div>
    `;
    box.appendChild(div);
  });
}

async function deleteCustomer(id) {
  const ok = confirm('این مشتری حذف شود؟');
  if (!ok) return;

  await fetch('/api/admin/customer-delete', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ id })
  });

  loadCustomers();
}

const form = document.getElementById('createForm');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      name: document.getElementById('name').value,
      total_gb: parseFloat(document.getElementById('total_gb').value),
      used_gb: parseFloat(document.getElementById('used_gb').value),
      expire_date: document.getElementById('expire_date').value,
      status: document.getElementById('status').value,
      note: document.getElementById('note').value
    };

    await fetch('/api/admin/customer-create', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });

    form.reset();
    loadCustomers();
  });

  loadCustomers();
}
