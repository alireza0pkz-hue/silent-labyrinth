export async function onRequestGet(context) {
  const { env, params } = context;

  const customer = await env.DB.prepare(
    `SELECT * FROM customers WHERE token = ?`
  ).bind(params.token).first();

  if (!customer) {
    return new Response(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>یافت نشد</title>
        <style>
          body{margin:0;background:#081120;color:#fff;font-family:Tahoma;padding:40px}
          .box{max-width:700px;margin:80px auto;background:#1e293b;padding:24px;border-radius:18px;text-align:center}
        </style>
      </head>
      <body>
        <div class="box">
          <h1>مشتری پیدا نشد</h1>
        </div>
      </body>
      </html>
    `, {
      status: 404,
      headers: { 'content-type': 'text/html; charset=UTF-8' }
    });
  }

  const remain = Math.max(0, Number(customer.total_gb) - Number(customer.used_gb));
  const percent = Number(customer.total_gb) > 0
    ? Math.min(100, (Number(customer.used_gb) / Number(customer.total_gb)) * 100)
    : 0;

  const statusText = customer.status === 'active' ? 'فعال' : 'غیرفعال';
  const statusColor = customer.status === 'active' ? '#86efac' : '#fca5a5';
  const statusBg = customer.status === 'active'
    ? 'rgba(34,197,94,0.18)'
    : 'rgba(239,68,68,0.18)';

  const html = `
  <!DOCTYPE html>
  <html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>وضعیت سرویس - ${customer.name}</title>
    <style>
      *{box-sizing:border-box}
      body{
        margin:0;
        font-family:Tahoma,Arial,sans-serif;
        color:#e5eefc;
        min-height:100vh;
        background:
          radial-gradient(circle at top right, rgba(59,130,246,.25), transparent 25%),
          radial-gradient(circle at bottom left, rgba(168,85,247,.18), transparent 25%),
          linear-gradient(135deg, #081120 0%, #0b1730 45%, #111827 100%);
      }
      .wrap{max-width:900px;margin:0 auto;padding:24px}
      .card{
        margin-top:60px;
        background:rgba(15,23,42,.82);
        border:1px solid rgba(148,163,184,.18);
        border-radius:24px;
        padding:28px;
        box-shadow:0 20px 60px rgba(0,0,0,.35);
        backdrop-filter:blur(10px);
      }
      .brand{color:#93c5fd;font-weight:bold;letter-spacing:2px;margin-bottom:8px}
      .head{
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        flex-wrap:wrap;
      }
      .badge{
        padding:8px 12px;
        border-radius:999px;
        font-size:13px;
        font-weight:bold;
        color:${statusColor};
        background:${statusBg};
      }
      .title{font-size:28px;font-weight:bold;margin:10px 0 6px}
      .muted{color:#b6c2d9}
      .stats{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:14px;
        margin-top:22px;
      }
      .stat{
        background:rgba(30,41,59,.85);
        border-radius:18px;
        padding:16px;
        text-align:center;
      }
      .label{font-size:13px;color:#94a3b8}
      .value{font-size:22px;font-weight:bold;margin-top:8px}
      .progress-wrap{margin-top:24px}
      .progress-head{
        display:flex;
        justify-content:space-between;
        margin-bottom:10px;
        color:#cbd5e1;
      }
      .progress{
        width:100%;
        height:18px;
        background:#334155;
        border-radius:999px;
        overflow:hidden;
      }
      .bar{
        height:100%;
        width:${percent}%;
        background:linear-gradient(90deg,#22c55e,#16a34a);
      }
      .foot{
        margin-top:18px;
        padding:14px;
        background:rgba(15,23,42,.8);
        border-radius:16px;
        color:#cbd5e1;
      }
      @media (max-width:700px){
        .stats{grid-template-columns:1fr}
        .title{font-size:22px}
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="brand">SILENT LABYRINTH</div>

        <div class="head">
          <div>
            <div class="title">${customer.name}</div>
            <div class="muted">وضعیت سرویس و مصرف حجم</div>
          </div>
          <div class="badge">${statusText}</div>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="label">حجم کل</div>
            <div class="value">${customer.total_gb} GB</div>
          </div>
          <div class="stat">
            <div class="label">مصرف‌شده</div>
            <div class="value">${customer.used_gb} GB</div>
          </div>
          <div class="stat">
            <div class="label">باقی‌مانده</div>
            <div class="value">${remain} GB</div>
          </div>
        </div>

        <div class="progress-wrap">
          <div class="progress-head">
            <span>درصد مصرف</span>
            <span>${percent.toFixed(1)}%</span>
          </div>
          <div class="progress">
            <div class="bar"></div>
          </div>
        </div>

        <div class="foot">
          <div>تاریخ انقضا: ${customer.expire_date || '-'}</div>
          <div style="margin-top:8px;">یادداشت: ${customer.note || '-'}</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=UTF-8' }
  });
}
