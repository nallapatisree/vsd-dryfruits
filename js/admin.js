/**
 * Admin panel: login, dashboard analytics, orders, products, combos, inventory, Excel export, invoice.
 */
/* ADMIN */
function toggleAdmDrawer(open) {
  const sb = $('.sb');
  const bd = $('.adm-backdrop');
  if (open) {
    sb && sb.classList.add('open');
    bd && bd.classList.add('open');
    document.body.classList.add('no-scroll');
  } else {
    sb && sb.classList.remove('open');
    bd && bd.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }
}

function renderA(pg) {
  if (!adm) {
    $('#app').innerHTML =
      `<div class="sec lg"><div class=logo><img class=brand src="assets/images/logo.webp" alt="VSD Admin" style="height:78px;margin:0 auto"></div><label>Username</label><input id=au value=admin><label>Password</label><input id=ap type=password autocomplete=current-password onkeydown="if(event.key=='Enter')login()"><label style="display:flex;gap:6px;align-items:center"><input type=checkbox style=width:auto onchange="$('#ap').type=this.checked?'text':'password'">Show password</label><p><button class=btn style=width:100% onclick=login()>Sign in</button></p><p><a onclick=go('') style=cursor:pointer>← Back to store</a></p></div>`;
    return;
  }
  if (D.stale !== 0) {
    D.stale = 0;
    $('#app').innerHTML = '<p style="padding:30px">Loading…</p>';
    loadAdmin()
      .then(() => render())
      .catch(() => {
        adm = false;
        render();
      });
    return;
  }
  const M = [
    ['dash', '📊 Dashboard'],
    ['orders', '📦 Orders'],
    ['prods', '🛍️ Products'],
    ['cats', '🏷️ Categories'],
    ['combos', '🧺 Combos'],
    ['giftboxes', '🎁 Gift Boxes'],
    ['inv', '📋 Inventory'],
    ['theme', '🎨 Theme'],
    ['banners', '🖼️ Banners'],
    ['settings', '⚙️ Settings'],
  ];
  const fn =
    {
      dash: aDash,
      orders: aOrders,
      prods: aProds,
      cats: aCats,
      combos: aCombos,
      giftboxes: aGiftBoxes,
      inv: aInv,
      theme: aTheme,
      banners: aBanners,
      settings: aSettings,
    }[pg] || aDash;

  const curTitle = M.find((m) => m[0] === pg)?.[1]?.slice(3) || 'Dashboard';

  $('#app').innerHTML = `
    <div class="adm-top">
      <button class="adm-ham" onclick="toggleAdmDrawer(true)" aria-label="Open admin menu">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div class="adm-top-title">VSD Admin · ${curTitle}</div>
      <a onclick="toggleAdmDrawer(false);go('')" class="adm-top-store">🌐 Store</a>
    </div>
    <div class="adm-backdrop" onclick="toggleAdmDrawer(false)"></div>
    <div class="adm">
      <div class="sb">
        <div class="sb-head">
          <div class="logo"><img class="brand" src="assets/images/logo.webp" alt="VSD Admin" style="height:54px"></div>
          <button class="sb-close" onclick="toggleAdmDrawer(false)" aria-label="Close menu">×</button>
        </div>
        ${M.map((m) => `<a class="${pg == m[0] ? 'on' : ''}" onclick="toggleAdmDrawer(false);go('admin/${m[0]}')">${m[1]}</a>`).join('')}
        <a onclick="toggleAdmDrawer(false);go('')">🌐 View store</a>
        <a onclick="toggleAdmDrawer(false);logout()">🚪 Logout</a>
      </div>
      <div class="ct">${fn()}</div>
    </div>
    <nav class="adm-bottom-nav">
      <button class="abn-item ${pg === 'prods' ? 'on' : ''}" onclick="pf(0)">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span>Add Product</span>
      </button>
      <button class="abn-item ${pg === 'dash' ? 'on' : ''}" onclick="go('admin/dash')">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1"/>
          <rect x="14" y="3" width="7" height="5" rx="1"/>
          <rect x="14" y="12" width="7" height="9" rx="1"/>
          <rect x="3" y="16" width="7" height="5" rx="1"/>
        </svg>
        <span>Dashboard</span>
      </button>
      <button class="abn-item ${pg === 'combos' ? 'on' : ''}" onclick="cf(0)">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <span>Create Combo</span>
      </button>
      <button class="abn-item ${pg === 'giftboxes' ? 'on' : ''}" onclick="gbModal(0)">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"/>
          <rect x="2" y="7" width="20" height="5"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
        <span>Create Gift Box</span>
      </button>
    </nav>
  `;
}
function login() {
  api('/api/admin/login', {
    method: 'POST',
    body: { user: $('#au').value, password: $('#ap').value },
  })
    .then(() => {
      adm = true;
      D.stale = 1;
      go('admin/dash');
    })
    .catch((e) => toast(e.message));
}
function logout() {
  toggleAdmDrawer(false);
  api('/api/admin/logout', { method: 'POST' }).finally(() => {
    adm = false;
    D.orders = [];
    D.stale = 1;
    go('admin');
  });
}
const live = () => D.orders.filter((o) => o.st != 'Cancelled'),
  inR = (o, d) => new Date(o.d) >= new Date(Date.now() - d * 864e5);
function aDash() {
  const os = D.orders.filter((o) => inR(o, R)),
    lv = os.filter((o) => o.st != 'Cancelled'),
    rev = lv.reduce((a, o) => a + o.tot, 0),
    td = D.orders.filter(
      (o) => new Date(o.d).toDateString() == new Date().toDateString() && o.st != 'Cancelled',
    );
  const vs = D.prods
      .flatMap((p) => p.v.map((v) => (v.s <= v.low ? v.s : null)))
      .filter((x) => x !== null),
    first = {};
  D.orders.forEach((o) => (first[o.phone] = first[o.phone] || o.d));
  const g = {};
  lv.forEach((o) => {
    const k = R > 31 ? o.d.slice(0, 7) : o.d.slice(5, 10);
    g[k] = (g[k] || 0) + o.tot;
  });
  const ks = Object.keys(g).sort(),
    mx = Math.max(1, ...ks.map((k) => g[k]));
  const cs = {},
    ps = {};
  lv.forEach((o) =>
    o.items.forEach((i) => {
      cs[i.c] = (cs[i.c] || 0) + i.price * i.q;
      ps[i.n] = ps[i.n] || [0, 0];
      ps[i.n][0] += i.q;
      ps[i.n][1] += i.price * i.q;
    }),
  );
  const cm = Math.max(1, ...Object.values(cs));
  const sc = {};
  D.orders.forEach((o) => (sc[o.st] = (sc[o.st] || 0) + 1));
  return `<h2>Dashboard</h2><div class=bar><select onchange="R=+this.value;render()">${[
    [1, 'Today'],
    [7, 'Last 7 days'],
    [30, 'Last 30 days'],
    [90, 'Last 3 months'],
    [180, 'Last 6 months'],
    [365, 'This year'],
  ]
    .map((r) => `<option value=${r[0]} ${R == r[0] ? 'selected' : ''}>${r[1]}</option>`)
    .join(
      '',
    )}</select><button class="btn sm" onclick="xl(D.orders)">⬇ Export all to Excel</button></div>
<div class=kp><div><small>Today's orders</small><b>${td.length}</b></div><div><small>Today's revenue</small><b>${fm(td.reduce((a, o) => a + o.tot, 0))}</b></div><div><small>Orders (range)</small><b>${lv.length}</b></div><div><small>Revenue (range)</small><b>${fm(rev)}</b></div><div><small>Avg order value</small><b>${fm(rev / (lv.length || 1))}</b></div><div><small>Products sold</small><b>${lv.reduce((a, o) => a + o.items.reduce((s, i) => s + i.q, 0), 0)}</b></div><div><small>New customers</small><b>${Object.values(first).filter((d) => new Date(d) >= new Date(Date.now() - R * 864e5)).length}</b></div><div><small>Cancelled</small><b>${os.length - lv.length}</b></div><div><small>Pending orders</small><b>${D.orders.filter((o) => o.st == 'Pending').length}</b></div><div><small>Low / out of stock</small><b>${vs.length}</b></div><div><small>Customers</small><b>${Object.keys(first).length}</b></div><div><small>Total revenue</small><b>${fm(live().reduce((a, o) => a + o.tot, 0))}</b></div></div>
<div class=two><div class=sec><b>Revenue</b><div class=bars>${ks.map((k) => `<div title="${k}: ${fm(g[k])}"><i style="height:${(g[k] / mx) * 80}%"></i>${ks.length < 16 ? k.slice(-5) : ''}</div>`).join('') || '<p>No orders in this range.</p>'}</div></div><div class=sec><b>Order status</b>${Object.entries(
    sc,
  )
    .map(
      ([k, v]) =>
        `<div class=hb><span>${k}</span><i style="width:${(v / D.orders.length) * 100}%"></i>${v}</div>`,
    )
    .join('')}</div></div>
<div class=two><div class=sec><b>Sales by category</b>${Object.entries(cs)
    .map(
      ([k, v]) =>
        `<div class=hb><span>${k}</span><i style="width:${(v / cm) * 100}%"></i>${Math.round((v / lv.reduce((a, o) => a + o.sub, 0)) * 100)}%</div>`,
    )
    .join('')}</div><div class=sec><b>Best sellers</b><div class=tw><table>${Object.entries(ps)
    .sort((a, b) => b[1][1] - a[1][1])
    .slice(0, 6)
    .map(([k, v]) => `<tr><td>${k}</td><td>${v[0]}</td><td>${fm(v[1])}</td></tr>`)
    .join('')}</table></div></div></div>
<div class=sec><b>Recent orders</b> <a style="float:right;cursor:pointer;color:var(--g)" onclick="go('admin/orders')">View all →</a>${otab(D.orders.slice(-10).reverse())}</div>`;
}
const otab = (l) =>
  `<div class=tw><table><tr><th>Order</th><th>Customer</th><th>Date</th><th>Amount</th><th>Payment</th><th>Status</th><th>Tracking</th><th></th></tr>${l.map((o) => `<tr><td>${o.no}</td><td>${o.cust}<br><small>${o.phone}</small></td><td>${new Date(o.d).toLocaleDateString('en-IN')}</td><td>${fm(o.tot)}</td><td>${o.pay}</td><td><span class="pill ${o.st == 'Cancelled' ? 'r' : o.st == 'Pending' ? 'w1' : ''}">${o.st}</span></td><td>${o.track || '–'}</td><td><button class="btn sm" onclick="od('${o.no}')">View</button>${o.st === 'Cancelled' ? ` <button class="btn sm gd" onclick="reopenModal('${o.no}')">Reopen</button>` : ''}</td></tr>`).join('') || '<tr><td colspan=8>No orders yet.</td></tr>'}</table></div>`;
let OF = { q: '', s: '' };
function aOrders() {
  const l = D.orders
    .filter(
      (o) =>
        (!OF.q || (o.no + o.cust + o.phone).toLowerCase().includes(OF.q.toLowerCase())) &&
        (!OF.s || o.st == OF.s),
    )
    .reverse();
  return `<h2>Orders</h2><div class=bar><input placeholder="Order no / name / phone" value="${OF.q}" onchange="OF.q=this.value;render()"><select onchange="OF.s=this.value;render()"><option value="">All status</option>${ST.map((s) => `<option ${OF.s == s ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="btn sm" onclick="xl(window.__l)">⬇ Export to Excel</button><button class="btn sm rd" onclick="confirmClearHistory()">🗑 Clear Order History</button></div><div class=sec>${((window.__l = l), otab(l))}</div>`;
}
function od(no) {
  const o = D.orders.find((x) => x.no == no);
  modal(
    `<h2>${o.no}</h2><p>${o.cust} · ${o.phone}<br>${o.email}<br>${o.addr}</p>${o.items.map((i) => `<div>${i.q}× ${i.n} — ${fm(i.price * i.q)}</div>`).join('')}<p><b>Total ${fm(o.tot)}</b> <small>(ship ${fm(o.ship)}, disc ${fm(o.disc)})</small></p><label>Order status</label><select id=os>${ST.map((s) => `<option ${o.st == s ? 'selected' : ''}>${s}</option>`).join('')}</select><label>Payment status</label><select id=ops>${PAY.map((s) => `<option ${o.pay == s ? 'selected' : ''}>${s}</option>`).join('')}</select><label>India Post tracking number</label><input id=ot value="${o.track}" placeholder="EE123456789IN"><div class=bar><button class=btn onclick="so('${no}')">Save</button>${o.st === 'Cancelled' ? `<button class="btn gd sm" onclick="reopenModal('${no}')">🔄 Reopen Order</button>` : ''}<button class="btn o sm" onclick="navigator.clipboard.writeText($('#ot').value);toast('Copied')">Copy tracking</button><button class="btn gd sm" onclick="trk($('#ot').value)">Open India Post</button><button class="btn o sm" onclick="inv('${no}')">Invoice</button></div>`,
  );
}
function so(no) {
  api('/api/admin/orders/' + encodeURIComponent(no), {
    method: 'PATCH',
    body: { st: $('#os').value, pay: $('#ops').value, track: $('#ot').value.trim() },
  })
    .then(() => {
      D.stale = 1;
      cl();
      return api('/api/admin/data').then((d) => {
        D.catalog = d.catalog;
        D.orders = d.orders;
        D.stale = 0;
        render();
        toast('Order updated');
      });
    })
    .catch((e) => toast(e.message));
}
function reopenModal(no) {
  const o = D.orders.find((x) => x.no == no);
  if (!o) return toast('Order not found');
  const activeStatuses = [
    'Pending',
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Out for Delivery',
  ];
  modal(`<h2>Reopen Order ${no}</h2>
<p style="color:var(--muted)">Reopening will verify available stock and reserve inventory for this order.</p>
<label>Select status for reopened order:</label>
<select id="reopenSt">
  ${activeStatuses.map((s) => `<option value="${s}" ${s === 'Pending' ? 'selected' : ''}>${s}${s === 'Pending' ? ' (Default)' : ''}</option>`).join('')}
</select>
<div class="bar" style="margin-top:16px">
  <button id="reopenBtn" class="btn gd" onclick="doReopenOrder('${no}')">Confirm Reopen</button>
  <button class="btn o" onclick="cl()">Cancel</button>
</div>`);
}
function doReopenOrder(no) {
  const st = $('#reopenSt') ? $('#reopenSt').value : 'Pending';
  const btn = $('#reopenBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Reopening…';
  }
  api('/api/admin/orders/' + encodeURIComponent(no), {
    method: 'PATCH',
    body: { st },
  })
    .then(() => {
      D.stale = 1;
      cl();
      return api('/api/admin/data').then((d) => {
        D.catalog = d.catalog;
        D.orders = d.orders;
        D.stale = 0;
        render();
        toast(`Order ${no} reopened as ${st}`);
      });
    })
    .catch((e) => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Confirm Reopen';
      }
      toast(e.message);
    });
}
function confirmClearHistory() {
  modal(`<h2>Clear Order History</h2>
<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin:12px 0">
  <p style="margin:0 0 8px 0"><b>⚠️ Safe Archival Notice:</b></p>
  <ul style="margin:0;padding-left:20px;font-size:0.9em;line-height:1.5">
    <li>This will safely archive and remove completed (<b>Delivered</b>) and <b>Cancelled</b> orders from active order history.</li>
    <li><b>All active and pending orders are preserved</b> for processing and fulfillment.</li>
    <li><b>Products, variants, inventory, and customer data are completely untouched.</b></li>
    <li>Archived orders remain safely preserved in the database for financial reconciliation and legal recordkeeping.</li>
  </ul>
</div>
<p>Are you sure you want to clear completed historical orders?</p>
<div class="bar" style="margin-top:16px">
  <button id="doClearBtn" class="btn rd" onclick="doClearHistory()">Yes, Clear Completed Orders</button>
  <button class="btn o" onclick="cl()">Cancel</button>
</div>`);
}
function doClearHistory() {
  const btn = $('#doClearBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Clearing orders…';
  }
  api('/api/admin/orders/clear', { method: 'POST', body: {} })
    .then((res) => {
      D.stale = 1;
      cl();
      return api('/api/admin/data').then((d) => {
        D.catalog = d.catalog;
        D.orders = d.orders;
        D.stale = 0;
        render();
        toast(res.message || 'Order history cleared successfully');
      });
    })
    .catch((e) => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Yes, Clear Completed Orders';
      }
      toast(e.message);
    });
}
function inv(no) {
  const o = D.orders.find((x) => x.no == no);
  modal(
    `<div id=inv><h2>TAX INVOICE</h2><b>Venkata Sai Dry Fruits (VSD)</b><br>D.No. 23-6-15, Opp: Axis Bank, Patnam Bazar, Guntur – 522003<br>GSTIN 37BRLPK9740E1ZG · 88853 55666<hr><b>Invoice:</b> INV-${o.no.slice(4)} · <b>Order:</b> ${o.no}<br><b>Date:</b> ${new Date(o.d).toLocaleDateString('en-IN')}<br><b>Bill to:</b> ${o.cust}, ${o.addr}<table><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>${o.items.map((i) => `<tr><td>${i.n}</td><td>${i.q}</td><td>${fm(i.price)}</td><td>${fm(i.price * i.q)}</td></tr>`).join('')}</table><p>Subtotal ${fm(o.sub)} · Discount ${fm(o.disc)} · Shipping ${fm(o.ship)}<br><b>Grand total ${fm(o.tot)}</b><br>Payment: ${o.pm} (${o.pay})</p></div><button class=btn onclick=print()>🖨 Print / Save as PDF</button>`,
  );
}
function xl(l) {
  if (!window.XLSX) return toast('Excel library not loaded (check connection)');
  const h = [
      'Order ID',
      'Order Date',
      'Customer',
      'Phone',
      'Email',
      'Address',
      'Products',
      'Quantity',
      'Subtotal',
      'Discount',
      'Shipping',
      'Total',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'India Post Tracking',
    ],
    r = l.map((o) => [
      o.no,
      new Date(o.d).toLocaleDateString('en-IN'),
      o.cust,
      o.phone,
      o.email,
      o.addr,
      o.items.map((i) => i.n).join('; '),
      o.items.reduce((a, i) => a + i.q, 0),
      o.sub,
      o.disc,
      o.ship,
      o.tot,
      o.pm,
      o.pay,
      o.st,
      o.track,
    ]),
    ws = XLSX.utils.aoa_to_sheet([h, ...r]);
  ws['!cols'] = h.map((x, i) => ({ wch: i == 5 || i == 6 ? 40 : 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  XLSX.writeFile(wb, 'VSD-Orders-' + new Date().toISOString().slice(0, 7) + '.xlsx');
}
function aProds() {
  const prods = D.prods.filter((p) => p.c !== 'Gift Box');
  return `<h2>Products</h2><div class=bar><button class=btn onclick="pf(0)">+ Add product</button></div><div class=sec><div class=tw><table><tr><th></th><th>Name</th><th>Category</th><th>Variants</th><th>Stock</th><th>Status</th><th></th></tr>${prods.map((p) => `<tr><td class=tn style=font-size:26px>${ev(p)}</td><td>${p.n}</td><td>${p.c}</td><td>${p.v.map((v) => v.w + ' ' + fm(v.p)).join(', ')}</td><td>${p.v.map((v) => (v.s <= 0 ? '<span class=no>OUT</span>' : v.s <= v.low ? '<span class=low>LOW ' + v.s + '</span>' : v.s)).join(' / ')}</td><td><span class="pill ${p.on ? '' : 'r'}">${p.on ? 'Active' : 'Hidden'}</span></td><td><button class="btn sm" onclick="pf(${p.id})">Edit</button> <button class="btn o sm" onclick="pt(${p.id})">${p.on ? 'Hide' : 'Show'}</button> <button class="btn rd sm" onclick="pdel(${p.id})">Delete</button></td></tr>`).join('') || '<tr><td>No products found.</td></tr>'}</table></div></div>`;
}
const pt = (id) => {
    P(id).on = P(id).on ? 0 : 1;
    save();
    render();
  },
  pdel = (id) => {
    if (D.combos.some((c) => c.items.some((i) => i[0] == id)))
      return toast('Used in a combo – hide it instead');
    if (confirm('Delete this product?')) {
      D.prods = D.prods.filter((p) => p.id != id);
      save();
      render();
    }
  };

/* ---------- Category Management ---------- */
let CAT_IMG = '';
function aCats() {
  const cats = D.cats || [];
  const total = cats.length;
  const active = cats.filter((c) => c.on !== 0).length;
  const inactive = total - active;
  const totalProds = D.prods.length;

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
      <div>
        <h2 style="margin:0">Category Management</h2>
        <small style="color:var(--m)">Create, edit, activate/deactivate, and customize category images</small>
      </div>
      <button class="btn" onclick="catModal(0)">+ Add Category</button>
    </div>

    <div class="kp" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
      <div><b>${total}</b><small>Total Categories</small></div>
      <div><b>${active}</b><small>Active (Visible)</small></div>
      <div><b>${inactive}</b><small>Inactive (Hidden)</small></div>
      <div><b>${totalProds}</b><small>Total Products</small></div>
    </div>

    <div class="bar" style="margin-bottom:12px">
      <input id="cat-search" placeholder="🔍 Search categories..." oninput="filterCats(this.value)" style="flex:1;max-width:320px">
    </div>

    <div class="sec" id="cat-table-wrap">
      ${renderCatsTable(cats)}
    </div>
  `;
}

function renderCatsTable(cats) {
  if (!cats || !cats.length) {
    return `<p style="padding:24px;text-align:center;color:var(--m)">No categories found. Click "+ Add Category" to create one.</p>`;
  }
  return `
    <div class="tw">
      <table class="adm-table">
        <thead>
          <tr>
            <th style="width:60px">Image</th>
            <th>Category Name</th>
            <th>Description</th>
            <th style="text-align:center">Products</th>
            <th style="text-align:center">Status</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody id="cat-tbody">
          ${cats
            .map((c, i) => {
              const cid = c.id || i + 1;
              const cname = c.name || c[0];
              const cdesc = c.desc || '';
              const cimg = catImg(c);
              const cemj = catEmoji(c);
              const pCount = D.prods.filter((p) => p.c === cname).length;
              const isActive = c.on !== 0;

              return `
              <tr data-cat-id="${cid}">
                <td>
                  <div class="im cat-thumb" style="width:48px;height:48px;font-size:24px;border-radius:8px">
                    ${cimg ? `<img src="${cimg}" alt="${cname}">` : cemj}
                  </div>
                </td>
                <td>
                  <b>${cname}</b>
                </td>
                <td style="max-width:260px;font-size:13px;color:var(--m)">
                  ${cdesc || '<span style="opacity:0.5">—</span>'}
                </td>
                <td style="text-align:center">
                  <span class="pill" style="background:var(--l);color:var(--t)">${pCount} item${pCount === 1 ? '' : 's'}</span>
                </td>
                <td style="text-align:center">
                  <span class="pill ${isActive ? '' : 'r'}">${isActive ? '● Active' : '○ Inactive'}</span>
                </td>
                <td style="text-align:right;white-space:nowrap">
                  <button class="btn sm" onclick="catModal(${cid})">Edit</button>
                  <button class="btn o sm" onclick="toggleCat(${cid})">${isActive ? 'Deactivate' : 'Activate'}</button>
                  <button class="btn rd sm" onclick="delCat(${cid})">Delete</button>
                </td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filterCats(query) {
  const q = (query || '').trim().toLowerCase();
  const rows = document.querySelectorAll('#cat-tbody tr');
  rows.forEach((r) => {
    const text = r.textContent.toLowerCase();
    r.style.display = !q || text.includes(q) ? '' : 'none';
  });
}

function catModal(id) {
  const c = id ? D.cats.find((x) => x.id == id || (x.name || x[0]) == id) : null;
  const isEdit = !!c;
  const cid = c ? c.id || id : 0;
  const cname = c ? c.name || c[0] || '' : '';
  const cdesc = c ? c.desc || '' : '';
  const cemoji = c ? c.emoji || c[1] || '🌰' : '🌰';
  const con = c ? c.on !== 0 : true;
  CAT_IMG = c ? c.img || '' : '';

  modal(
    `
    <h2>${isEdit ? 'Edit Category' : 'Add New Category'}</h2>
    <div id="cat-err" style="display:none;color:#d32f2f;background:#ffebee;padding:8px 12px;border-radius:6px;margin-bottom:12px;font-size:13px"></div>

    <div class="form-group">
      <label class="form-label">Category Photo (optional)</label>
      <div class="photo-upload-row">
        <div class="im photo-preview-box" id="cat-img-prev">
          ${CAT_IMG ? `<img src="${CAT_IMG}">` : cemoji}
        </div>
        <div class="photo-upload-actions">
          <input type="file" id="cat-file" accept="image/*" style="display:none" onchange="upCatFile(this)">
          <button type="button" class="btn o sm" onclick="$('#cat-file').click()">📷 Choose / Replace Photo</button>
          <button type="button" class="btn o sm rd" id="cat-rm-btn" onclick="clearCatImg()" style="${CAT_IMG ? '' : 'display:none'}">✕ Remove Photo</button>
          <small style="color:var(--m);display:block">Any photo, any shape – it fits automatically · Displayed on storefront</small>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="cat-name">Category Name <span style="color:#d32f2f">*</span></label>
      <input id="cat-name" value="${cname.replace(/"/g, '&quot;')}" placeholder="e.g. Premium Dry Fruits, Exotic Berries">
    </div>

    <div class="form-group">
      <label class="form-label" for="cat-desc">Description (optional)</label>
      <textarea id="cat-desc" rows="3" placeholder="Brief description of products in this category...">${cdesc}</textarea>
    </div>

    <div class="form-row-2">
      <div class="form-group" style="flex:1">
        <label class="form-label" for="cat-emoji">Fallback Emoji Icon</label>
        <input id="cat-emoji" value="${cemoji}" placeholder="e.g. 🌰, 🥜, 🌻, 🌴">
      </div>
      <div class="form-group" style="flex:1;display:flex;align-items:flex-end">
        <label class="check-label" style="margin-bottom:8px">
          <input type="checkbox" id="cat-on" style="width:auto" ${con ? 'checked' : ''}>
          <span>Active (visible on website)</span>
        </label>
      </div>
    </div>

    <div class="wizard-actions" style="margin-top:16px">
      <button type="button" class="btn o" onclick="cl()">Cancel</button>
      <button type="button" class="btn" onclick="saveCat(${cid})">${isEdit ? 'Save Changes' : 'Create Category'}</button>
    </div>
  `,
    'wide',
  );
}

function upCatFile(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  const el = $('#cat-img-prev'),
    before = el ? el.innerHTML : '';
  if (el) el.innerHTML = '<span style="font-size:12px;color:var(--m)">Uploading…</span>';
  uploadFile(f)
    .then((url) => {
      CAT_IMG = url;
      if (el) el.innerHTML = `<img src="${url}" alt="">`;
      const rm = $('#cat-rm-btn');
      if (rm) rm.style.display = 'inline-block';
      toast('Photo uploaded ✓');
    })
    .catch(() => {
      if (el) el.innerHTML = before;
    })
    .finally(() => {
      input.value = '';
    });
}

function clearCatImg() {
  CAT_IMG = '';
  const emoji = $('#cat-emoji') ? $('#cat-emoji').value.trim() || '📦' : '📦';
  const el = $('#cat-img-prev');
  if (el) el.innerHTML = emoji;
  const rm = $('#cat-rm-btn');
  if (rm) rm.style.display = 'none';
}

function saveCat(id) {
  if (uploading()) return afterUploads(() => saveCat(id));
  const errEl = $('#cat-err');
  const showErr = (msg) => {
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    } else {
      toast(msg);
    }
  };

  const name = ($('#cat-name').value || '').trim();
  if (name.length < 2) return showErr('Please enter a category name of at least 2 characters');

  // Prevent duplicate category names (case-insensitive)
  const isDup = D.cats.some(
    (x) => (id ? x.id != id : true) && (x.name || x[0]).toLowerCase() === name.toLowerCase(),
  );
  if (isDup) return showErr(`Category "${name}" already exists. Please choose a different name.`);

  const desc = ($('#cat-desc').value || '').trim();
  const emoji = ($('#cat-emoji').value || '').trim() || '📦';
  const on = $('#cat-on').checked ? 1 : 0;
  const img = CAT_IMG;

  const existing = id ? D.cats.find((x) => x.id == id || (x.name || x[0]) == id) : null;
  if (existing) {
    const oldName = existing.name || existing[0];
    existing.name = name;
    existing[0] = name;
    existing.desc = desc;
    existing.emoji = emoji;
    existing[1] = emoji;
    existing.on = on;
    existing.img = img;
    // If name changed, rename in products
    if (oldName !== name) {
      D.prods.forEach((p) => {
        if (p.c === oldName) p.c = name;
      });
    }
  } else {
    const maxId = Math.max(0, ...D.cats.map((x) => +x.id || 0));
    D.cats.push({
      id: maxId + 1,
      name,
      desc,
      emoji,
      img,
      on,
      0: name,
      1: emoji,
    });
  }

  save()
    .then(() => {
      cl();
      render();
      toast(existing ? `Category "${name}" updated` : `Category "${name}" created`);
    })
    .catch(() => {});
}

function toggleCat(id) {
  const cat = D.cats.find((x) => x.id == id || (x.name || x[0]) == id);
  if (!cat) return toast('Category not found');
  cat.on = cat.on ? 0 : 1;
  save();
  render();
  toast(`Category "${cat.name || cat[0]}" is now ${cat.on ? 'Active' : 'Inactive'}`);
}

function delCat(id) {
  const cat = D.cats.find((x) => x.id == id || (x.name || x[0]) == id);
  if (!cat) return toast('Category not found');
  const catName = cat.name || cat[0];
  const linked = D.prods.filter((p) => p.c === catName).length;

  modal(`
    <h2>Delete Category</h2>
    <p>Are you sure you want to delete category <b>${catName}</b>?</p>
    ${
      linked > 0
        ? `<div style="background:#fff3cd;color:#856404;padding:12px;border-radius:8px;margin:12px 0;font-size:13px;line-height:1.5">
            ⚠️ <b>${linked} product(s)</b> currently belong to this category.<br>
            Deleting this category will <b>keep all products and orders intact</b>. These products will be reassigned to <i>General</i>.
          </div>`
        : `<p style="font-size:13px;color:var(--m)">This category has no assigned products.</p>`
    }
    <div class="wizard-actions" style="margin-top:16px">
      <button class="btn o" onclick="cl()">Cancel</button>
      <button class="btn rd" onclick="confirmDelCat(${id})">Yes, Delete Category</button>
    </div>
  `);
}

function confirmDelCat(id) {
  const idx = D.cats.findIndex((x) => x.id == id || (x.name || x[0]) == id);
  if (idx === -1) return toast('Category not found');
  const catName = D.cats[idx].name || D.cats[idx][0];
  // Reassign products safely to General
  D.prods.forEach((p) => {
    if (p.c === catName) p.c = 'General';
  });
  D.cats.splice(idx, 1);
  save();
  cl();
  render();
  toast(`Category "${catName}" deleted safely`);
}

function aCombos() {
  return `<h2>Combos</h2><div class=bar><button class=btn onclick="cf(0)">+ Create combo</button></div><div class=sec><div class=tw><table><tr><th></th><th>Name</th><th>Contains</th><th>MRP</th><th>Price</th><th>Available</th><th></th></tr>${D.combos.map((c) => `<tr><td class=tn style=font-size:26px>${ev(c)}</td><td>${c.n}</td><td>${c.items.map(([p, v, q]) => q + '×' + P(p).n.split(' ')[0] + ' ' + P(p).v[v].w).join(', ')}</td><td>${fm(cmrp(c))}</td><td>${fm(c.p)}</td><td>${cav(c)}</td><td><button class="btn sm" onclick="cf(${c.id})">Edit</button> <button class="btn o sm" onclick="D.combos.find(x=>x.id==${c.id}).on^=1;save();render()">${c.on ? 'Hide' : 'Show'}</button> <button class="btn rd sm" onclick="if(confirm('Delete?')){D.combos=D.combos.filter(x=>x.id!=${c.id});save();render()}">Del</button></td></tr>`).join('') || '<tr><td>No combos yet.</td></tr>'}</table></div></div>`;
}
function cf(id) {
  const c = id ? CB(id) : { n: '', e: '🧺', p: 0, items: [] };
  IMG = c.img || '';
  modal(
    `<h2>${id ? 'Edit' : 'Create'} combo</h2><label>Combo photo <small>(any photo, any shape)</small></label><div class=bar><div class=im id=cp style="width:76px;height:76px;font-size:34px">${ev(c)}</div><input type=file accept="image/*" onchange="up(this,'cp')"></div><label>Name</label><input id=cname value="${c.n}"><div class=bar><div style=flex:1><label>Combo price ₹</label><input id=cprice type=number value="${c.p}"></div><div style=flex:1><label>Emoji</label><input id=cem value="${c.e}"></div></div><label>Products inside (set quantity; pick variant)</label>${D.prods
      .map((p) => {
        const it = c.items.find((i) => i[0] == p.id);
        return `<div class=bar style=margin:4px 0><span style=flex:1>${p.e} ${p.n}</span><select class=cv data-p=${p.id}>${p.v.map((v, i) => `<option value=${i} ${it && it[1] == i ? 'selected' : ''}>${v.w}</option>`).join('')}</select><input class=cqq data-p=${p.id} type=number min=0 value="${it ? it[2] : 0}" style=width:64px></div>`;
      })
      .join('')}<button class=btn onclick="cs2(${id})">Save combo</button>`,
  );
}
function cs2(id) {
  if (uploading()) return afterUploads(() => cs2(id));
  const items = [...document.querySelectorAll('.cqq')]
      .map((i) => [
        +i.dataset.p,
        +document.querySelector(`.cv[data-p="${i.dataset.p}"]`).value,
        +i.value,
      ])
      .filter((x) => x[2] > 0),
    o = {
      n: $('#cname').value.trim(),
      p: +$('#cprice').value,
      e: $('#cem').value || '🧺',
      items,
      img: IMG,
    };
  if (!o.n || !o.p || !items.length) return toast('Add a name, price and at least one product');
  id ? Object.assign(CB(id), o) : D.combos.push({ id: D.cid++, on: 1, f: 1, ...o });
  save()
    .then(() => {
      cl();
      render();
      toast('Combo saved');
    })
    .catch(() => {});
}
function aGiftBoxes() {
  const gbs = D.giftboxes || [];
  return `<h2>Gift Box Management</h2><div class=bar><button class=btn onclick="gbModal(0)">+ Create Gift Box</button></div><div class=sec><div class=tw><table><tr><th></th><th>Name</th><th>Description</th><th>Price</th><th>Status</th><th>Actions</th></tr>${gbs.map((g) => `<tr><td class=tn style=font-size:26px>${ev({ img: g.img, e: g.e || '🎁' })}</td><td><b>${g.n}</b></td><td style="max-width:320px;white-space:pre-wrap;font-size:13px;color:#555">${g.desc || '—'}</td><td><b>${fm(g.p)}</b></td><td><span class="pill ${g.on ? '' : 'r'}">${g.on ? 'Published' : 'Hidden'}</span></td><td><button class="btn sm" onclick="gbModal(${g.id})">Edit</button> <button class="btn o sm" onclick="toggleGb(${g.id})">${g.on ? 'Hide' : 'Show'}</button> <button class="btn rd sm" onclick="delGb(${g.id})">Delete</button></td></tr>`).join('') || '<tr><td colspan=6 style="text-align:center;padding:24px;color:#777">No gift boxes found. Click "+ Create Gift Box" to add one.</td></tr>'}</table></div></div>`;
}
function gbModal(id) {
  const g = id ? GB(id) : { n: '', desc: '', p: '', e: '🎁', img: '', on: 1 };
  if (!g) return toast('Gift box not found');
  IMG = g.img || '';
  modal(
    `<h2>${id ? 'Edit Gift Box' : 'Create Gift Box'}</h2>
    <div id=gbErr style="display:none;color:#d32f2f;background:#ffebee;padding:8px 12px;border-radius:6px;margin-bottom:12px;font-size:13px"></div>
    <label>Gift Box Photo (optional)</label>
    <div class=bar>
      <div class=im id=gbp style="width:76px;height:76px;font-size:34px">${ev({ img: g.img, e: g.e || '🎁' })}</div>
      <input type=file accept="image/*" onchange="up(this,'gbp')">
    </div>
    <label>Gift Box Name <span style="color:#d32f2f">*</span></label>
    <input id=gbName value="${(g.n || '').replace(/"/g, '&quot;')}" placeholder="e.g. Royal Dry Fruit Gift Box">
    <label>Gift Box Description <span style="color:#d32f2f">*</span></label>
    <textarea id=gbDesc rows=4 placeholder="Describe the gift box, its contents and presentation...">${g.desc || ''}</textarea>
    <div class=bar>
      <div style=flex:1>
        <label>Gift Box Price (₹) <span style="color:#d32f2f">*</span></label>
        <input id=gbPrice type=number min=1 step=any value="${g.p || ''}" placeholder="e.g. 1499">
      </div>
      <div style=width:90px>
        <label>Emoji</label>
        <input id=gbEm value="${g.e || '🎁'}">
      </div>
    </div>
    <label style="display:flex;gap:6px;align-items:center;margin:10px 0">
      <input type=checkbox id=gbOn style=width:auto ${g.on !== 0 ? 'checked' : ''}> Publish on customer website
    </label>
    <div class=bar style="margin-top:16px;justify-content:flex-end">
      <button class="btn o" onclick="cl()">Cancel</button>
      <button id=gbSaveBtn class=btn onclick="saveGb(${id})">Save Gift Box</button>
    </div>`,
  );
}
function saveGb(id) {
  if (uploading()) return afterUploads(() => saveGb(id));
  const errBox = $('#gbErr');
  const showErr = (msg) => {
    if (errBox) {
      errBox.textContent = msg;
      errBox.style.display = 'block';
    }
    toast(msg);
  };
  if (errBox) errBox.style.display = 'none';

  const n = ($('#gbName')?.value || '').trim();
  const desc = ($('#gbDesc')?.value || '').trim();
  const pVal = $('#gbPrice')?.value;
  const p = parseFloat(pVal);
  const e = ($('#gbEm')?.value || '').trim() || '🎁';
  const on = $('#gbOn')?.checked ? 1 : 0;

  if (!n) return showErr('Gift Box Name is required.');
  if (!desc) return showErr('Gift Box Description is required.');
  if (isNaN(p) || p <= 0) return showErr('Gift Box Price must be greater than zero.');

  const btn = $('#gbSaveBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving…';
  }

  const payload = {
    n,
    desc,
    p: Math.round(p * 100) / 100,
    e,
    img: IMG,
    on,
  };

  if (!D.giftboxes) D.giftboxes = [];

  if (id) {
    const existing = GB(id);
    if (!existing) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Save Gift Box';
      }
      return showErr('Gift box not found');
    }
    Object.assign(existing, payload);
  } else {
    const nextId = D.gid || D.giftboxes.reduce((m, g) => Math.max(m, g.id || 0), 0) + 1;
    D.gid = nextId + 1;
    D.giftboxes.push({ id: nextId, ...payload });
  }

  save()
    .then(() => {
      cl();
      render();
      toast(id ? 'Gift box updated successfully' : 'Gift box created successfully');
    })
    .catch((err) => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Save Gift Box';
      }
      showErr('Failed to save gift box: ' + (err?.message || 'Database error'));
    });
}
function toggleGb(id) {
  const g = GB(id);
  if (!g) return;
  g.on = g.on ? 0 : 1;
  save()
    .then(() => {
      render();
      toast(g.on ? 'Gift box published' : 'Gift box hidden');
    })
    .catch((err) => toast('Failed to update: ' + (err?.message || 'Error')));
}
function delGb(id) {
  const g = GB(id);
  if (!g) return;
  if (confirm(`Delete "${g.n}" gift box?`)) {
    D.giftboxes = (D.giftboxes || []).filter((x) => x.id != id);
    save()
      .then(() => {
        render();
        toast('Gift box deleted');
      })
      .catch((err) => toast('Failed to delete: ' + (err?.message || 'Error')));
  }
}
let IF = '';
function aInv() {
  const rows = D.prods
    .filter((p) => p.c !== 'Gift Box')
    .flatMap((p) =>
      p.v.map((v, i) => ({
        p,
        v,
        i,
        st: v.s <= 0 ? 'Out of Stock' : v.s <= v.low ? 'Low Stock' : 'Healthy',
      })),
    )
    .filter((r) => !IF || r.st == IF);
  return `<h2>Inventory</h2><div class=bar><select onchange="IF=this.value;render()"><option value="">All</option><option ${IF == 'Healthy' ? 'selected' : ''}>Healthy</option><option ${IF == 'Low Stock' ? 'selected' : ''}>Low Stock</option><option ${IF == 'Out of Stock' ? 'selected' : ''}>Out of Stock</option></select></div><div class=sec><div class=tw><table><tr><th>Product</th><th>Variant</th><th>Stock</th><th>Low limit</th><th>Status</th></tr>${rows.map((r) => `<tr><td>${r.p.n}</td><td>${r.v.w}</td><td><input type=number min=0 value=${r.v.s} style=width:80px onchange="setS(${r.p.id},${r.i},+this.value)"></td><td>${r.v.low}</td><td><span class="pill ${r.st == 'Healthy' ? '' : r.st == 'Low Stock' ? 'w1' : 'r'}">${r.st == 'Healthy' ? 'Healthy Stock' : r.st.toUpperCase()}</span></td></tr>`).join('') || '<tr><td>No low stock products.</td></tr>'}</table></div></div><h3 style=margin:16px 0>Inventory log</h3><div class=sec>${
    D.log
      .slice(0, 10)
      .map(
        (l) =>
          `<div><small>${new Date(l[0]).toLocaleString('en-IN')} · admin</small> ${l[1]}</div>`,
      )
      .join('') || 'No changes yet.'
  }</div>`;
}
function setS(id, i, n) {
  api('/api/admin/stock', { method: 'POST', body: { id, vi: i, s: Math.max(0, Math.floor(n)) } })
    .then(() => {
      D.stale = 1;
      render();
      toast('Stock updated');
    })
    .catch((e) => toast(e.message));
}

/** Theme picker: four colour schemes for the customer website. */
function aTheme() {
  const cur = D.theme || 'green';
  return `<h2>Website theme</h2><p>Choose the colour scheme for the customer website. It applies instantly.</p><div class=kp style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">${THEMES.map((t) => `<div style="cursor:pointer;border-top:4px solid ${t[2]}" onclick="setTheme('${t[0]}')"><b style="font-size:20px">${t[1]}</b><div style="display:flex;gap:8px;margin:12px 0"><i style="width:44px;height:44px;border-radius:50%;background:${t[2]}"></i><i style="width:44px;height:44px;border-radius:50%;background:${t[3]}"></i></div>${cur == t[0] ? '<span class=pill>Active</span>' : '<small>Click to apply</small>'}</div>`).join('')}</div>`;
}

/* ---- Banners ---- */
function aBanners() {
  return `<h2>Banners</h2><div class=bar><button class=btn onclick="bf(0)">+ Add banner</button><small>Live banners rotate on the home page every 5 seconds.</small></div><div class=sec><div class=tw><table><tr><th>Image</th><th>Heading</th><th>Button → link</th><th>Status</th><th></th></tr>${D.banners.map((b) => `<tr><td class=tn>${ev({ img: b.img, e: '🖼️' })}</td><td>${b.h}</td><td>${b.btn || '–'} → ${b.link || '–'}</td><td><span class="pill ${b.on ? '' : 'r'}">${b.on ? 'Live' : 'Hidden'}</span></td><td><button class="btn sm" onclick="bf(${b.id})">Edit</button> <button class="btn o sm" onclick="bt(${b.id})">${b.on ? 'Hide' : 'Show'}</button> <button class="btn rd sm" onclick="bdel(${b.id})">Delete</button></td></tr>`).join('') || '<tr><td>No banners yet.</td></tr>'}</table></div></div>`;
}
function bf(id) {
  const b = id
    ? D.banners.find((x) => x.id == id)
    : { k: '', h: '', d: '', btn: 'Shop Now', link: 'shop', img: '', on: 1 };
  IMG = b.img || '';
  modal(
    `<h2>${id ? 'Edit' : 'Add'} banner</h2><label>Banner image (any photo works – it fits automatically)</label><div class=bar><div class=im id=bp style="width:150px;height:90px;font-size:30px">${ev({ img: b.img, e: '🖼️' })}</div><input type=file accept="image/*" onchange="up(this,'bp',1600)"></div><label>Small tag line</label><input id=bnk value="${b.k}"><label>Heading</label><input id=bnh value="${b.h}"><label>Description</label><textarea id=bnd rows=2>${b.d}</textarea><div class=bar><div style=flex:1><label>Button text</label><input id=bnb value="${b.btn}"></div><div style=flex:1><label>Button link</label><input id=bnl value="${b.link}"></div></div><small>Link examples: shop · shop/Combos · shop/Nuts · https://…</small><label style=display:flex;gap:6px><input type=checkbox id=bno style=width:auto ${b.on ? 'checked' : ''}>Show on website</label><p><button class=btn onclick="bs(${id})">Save banner</button></p>`,
  );
}
function bs(id) {
  if (uploading()) return afterUploads(() => bs(id));
  const o = {
    k: $('#bnk').value,
    h: $('#bnh').value.trim(),
    d: $('#bnd').value,
    btn: $('#bnb').value,
    link: $('#bnl').value.trim(),
    img: IMG,
    on: $('#bno').checked ? 1 : 0,
  };
  if (!o.h) return toast('Enter a heading');
  id
    ? Object.assign(
        D.banners.find((x) => x.id == id),
        o,
      )
    : D.banners.push({ id: D.bid++, ...o });
  save()
    .then(() => {
      cl();
      render();
      toast('Banner saved');
    })
    .catch(() => {});
}
const bt = (id) => {
    const b = D.banners.find((x) => x.id == id);
    b.on = b.on ? 0 : 1;
    save();
    render();
  },
  bdel = (id) => {
    if (confirm('Delete this banner?')) {
      D.banners = D.banners.filter((x) => x.id != id);
      save();
      render();
    }
  };
/* ---- Settings: shipping, WhatsApp number, scrolling strip ---- */
function aSettings() {
  const s = D.settings;
  return `<h2>Settings</h2><div class=sec><b>Shipping</b><div class=bar><div><label>Shipping charge (₹)</label><input id=sShip type=number min=0 value="${s.ship}"></div><div><label>Free shipping above (₹)</label><input id=sFree type=number min=0 value="${s.free}"></div></div><b>WhatsApp orders</b><label>WhatsApp number (with country code)</label><input id=sWa value="${s.wa}" style=max-width:260px><label>Scrolling text in the top strip</label><textarea id=sTick rows=2>${s.ticker}</textarea><p><button class=btn onclick=saveSet()>Save settings</button></p></div><div class=sec style=margin-top:14px><b>Sample data</b><p><small>The shop starts with sample products and prices so you can see how it looks (${D.prods.filter((p) => p.sample).length} products, ${D.combos.filter((c) => c.sample).length} combos). When ready, remove them and add your own with Products → Add product.</small></p><button class="btn rd" onclick=clearSamples()>Remove all sample products & combos</button></div>`;
}
function clearSamples() {
  const n = D.prods.filter((p) => p.sample).length,
    m = D.combos.filter((c) => c.sample).length;
  if (!n && !m) return toast('No sample items left');
  if (
    !confirm(
      `Remove ${n} sample products and ${m} sample combos from the website? Products you added or edited stay.`,
    )
  )
    return;
  D.prods = D.prods.filter((p) => !p.sample);
  D.combos = D.combos.filter((c) => !c.sample && c.items.every((i) => P(i[0])));
  save();
  render();
  toast('Sample items removed');
}
function saveSet() {
  const s = D.settings,
    n = $('#sWa').value.replace(/\D/g, '');
  s.ship = Math.max(0, +$('#sShip').value || 0);
  s.free = Math.max(0, +$('#sFree').value || 0);
  s.wa = n.length == 10 ? '91' + n : n || s.wa;
  s.ticker = $('#sTick').value.trim() || s.ticker;
  save();
  render();
  toast('Settings saved');
}

/* ---- Add / edit product: 3-step wizard  (1 details -> 2 weights & prices -> 3 review & publish) ---- */
let W = {};
const g2w = (g) => (g >= 1000 && g % 1000 == 0 ? [g / 1000, 'kg'] : [g, 'g']);

function pf(id) {
  const p = id ? P(id) : null;
  IMG = p ? p.img || '' : '';
  const firstCat = (D.cats || []).find((c) => (c.name || c[0]) !== 'Gift Box');
  const defCat = firstCat ? firstCat.name || firstCat[0] : 'Dry Fruits';

  W = {
    id,
    step: 1,
    n: p ? p.n : '',
    c: p ? p.c : defCat,
    e: p ? p.e : '🌰',
    f: p && p.f ? 1 : 0,
    on: p && p.on === 0 ? 0 : 1,
    img: IMG,
    v: p
      ? p.v.map((v) => ({
          g: w2g(v.w),
          mrp: v.mrp,
          p: v.p,
          s: v.s,
          low: v.low,
          origS: v.s,
          origW: v.w,
        }))
      : [{ g: 100, mrp: '', p: '', s: 0, low: 10, origS: 0 }],
  };
  wz();
}

function wRead() {
  if ($('#wn')) W.n = $('#wn').value.trim();
  if ($('#wc')) W.c = $('#wc').value;
  if ($('#we')) W.e = $('#we').value.trim() || '🌰';
  if ($('#wf')) W.f = $('#wf').checked ? 1 : 0;
  if ($('#wo')) W.on = $('#wo').checked ? 1 : 0;
}

const wv = (i, k, val) => {
    W.v[i][k] = val === '' ? '' : +val;
    wPrev();
  },
  wU = (i) => {
    const val = +$('#wq' + i).value || 0,
      u = $('#wu' + i).value;
    W.v[i].g = Math.round(val * (u == 'kg' ? 1000 : 1));
    wPrev();
  },
  wAdd = (g) => {
    W.v.push({ g, mrp: '', p: '', s: 0, low: 10 });
    wz();
  },
  wDel = (i) => {
    W.v.splice(i, 1);
    wz();
  };

function wCheck() {
  if (W.n.length < 2) return 'Enter the product name';
  const seen = {};
  for (const r of W.v) {
    if (!(r.g >= 50)) return 'Enter a weight of at least 50 g in every row';
    if (seen[r.g]) return 'Each weight can be added only once (' + wl(r.g) + ')';
    seen[r.g] = 1;
    if (!(+r.p > 0)) return 'Enter the selling price for ' + wl(r.g);
    if (r.mrp === '' || r.mrp == null) r.mrp = r.p;
    if (+r.mrp < +r.p) return 'MRP cannot be lower than the selling price (' + wl(r.g) + ')';
  }
  return '';
}

function wGo(n) {
  if (uploading()) return afterUploads(() => wGo(n));
  if (W.step == 1) wRead();
  if (n >= 2 && W.n.length < 2) return toast('Enter the product name first');
  if (n == 3) {
    const e = wCheck();
    if (e) return toast(e);
  }
  W.step = n;
  wz();
}

function wPrev() {
  const e = $('#wprev');
  if (!e) return;
  const l = W.v
    .filter((r) => r.g > 0 && +r.p > 0)
    .sort((a, b) => a.g - b.g)
    .map(
      (r) =>
        `<div>${wl(r.g)} → <b>${fm(+r.p)}</b>${+r.mrp > +r.p ? ` <small><s>${fm(+r.mrp)}</s> ${dsc(+r.mrp, +r.p)}% off</small>` : ''}</div>`,
    );
  e.innerHTML =
    '<small style="font-weight:600;display:block;margin-bottom:4px">Customers will see:</small>' +
    (l.join('') || '<div><small>Fill in a weight and price above</small></div>');
}

function upProdPhoto(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  const el = $('#wp'),
    before = el ? el.innerHTML : '';
  if (el) el.innerHTML = '<span style="font-size:12px;color:var(--m)">Uploading…</span>';
  uploadFile(f)
    .then((url) => {
      IMG = url;
      W.img = url;
      if (el) el.innerHTML = `<img src="${url}" alt="">`;
      const rm = $('#wp-rm');
      if (rm) rm.style.display = 'inline-block';
      toast('Photo uploaded ✓');
    })
    .catch(() => {
      if (el) el.innerHTML = before; // keep the current photo
    })
    .finally(() => {
      input.value = '';
    });
}

function clearProdPhoto() {
  IMG = '';
  W.img = '';
  const el = $('#wp');
  if (el) el.innerHTML = W.e || '🌰';
  const rm = $('#wp-rm');
  if (rm) rm.style.display = 'none';
}

function wz() {
  const S = ['Product details', 'Weights & prices', 'Review & publish'];
  let b = '';

  if (W.step == 1) {
    b = `
      <div class="form-group">
        <label class="form-label">Product Photo (optional)</label>
        <div class="photo-upload-row">
          <div class="im photo-preview-box" id="wp">
            ${ev({ img: W.img, e: W.e || '🌰' })}
          </div>
          <div class="photo-upload-actions">
            <input type="file" id="wp-file" accept="image/*" style="display:none" onchange="upProdPhoto(this)">
            <button type="button" class="btn o sm" onclick="$('#wp-file').click()">📷 Choose / Replace Photo</button>
            <button type="button" class="btn o sm rd" id="wp-rm" onclick="clearProdPhoto()" style="${W.img ? '' : 'display:none'}">✕ Remove Photo</button>
            <small style="color:var(--m);display:block">Any photo, any shape – it fits automatically</small>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="wn">Product Name <span style="color:#d32f2f">*</span></label>
        <input id="wn" value="${(W.n || '').replace(/"/g, '&quot;')}" placeholder="e.g. Premium California Almonds">
      </div>

      <div class="form-row-2">
        <div class="form-group" style="flex:1">
          <label class="form-label" for="wc">Category <span style="color:#d32f2f">*</span></label>
          <select id="wc">
            ${(D.cats || [])
              .filter((c) => (c.name || c[0]) !== 'Gift Box')
              .map((c) => {
                const cname = c.name || c[0];
                return `<option value="${cname}" ${W.c === cname ? 'selected' : ''}>${cname}</option>`;
              })
              .join('')}
          </select>
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label" for="we">Emoji (fallback icon)</label>
          <input id="we" value="${W.e || '🌰'}" placeholder="e.g. 🌰, 🥜">
        </div>
      </div>

      <div class="form-options">
        <label class="check-label">
          <input type="checkbox" id="wf" style="width:auto" ${W.f ? 'checked' : ''}>
          <span>Show in Featured products on homepage</span>
        </label>
        <label class="check-label">
          <input type="checkbox" id="wo" style="width:auto" ${W.on ? 'checked' : ''}>
          <span>Show on website (Active)</span>
        </label>
      </div>

      <div class="wizard-actions">
        <button type="button" class="btn o" onclick="cl()">Cancel</button>
        <button type="button" class="btn" onclick="wGo(2)">Next: Weights & Prices →</button>
      </div>
    `;
  }

  if (W.step == 2) {
    b = `
      <p style="margin-bottom:12px">
        <small>Add every weight you sell and its price. Customers choose a weight and see the price. <b>Stock</b> = number of packs you have of that weight.</small>
      </p>

      <div class="var-editor">
        <div class="var-header">
          <div style="flex:1.4">Weight Size</div>
          <div style="flex:1">MRP (₹)</div>
          <div style="flex:1">Selling (₹) *</div>
          <div style="flex:1">Stock (packs)</div>
          <div style="flex:1">Low Alert</div>
          <div style="width:36px"></div>
        </div>
        ${W.v
          .map((r, i) => {
            const [q, u] = g2w(r.g);
            return `
            <div class="var-row">
              <div class="var-field var-weight-field" style="flex:1.4">
                <label class="var-field-label">Weight</label>
                <div style="display:flex;gap:4px">
                  <input id="wq${i}" type="number" min="1" step="any" value="${r.g ? q : ''}" onchange="wU(${i})" placeholder="100" style="flex:1">
                  <select id="wu${i}" style="width:62px" onchange="wU(${i})">
                    <option ${u === 'g' ? 'selected' : ''}>g</option>
                    <option ${u === 'kg' ? 'selected' : ''}>kg</option>
                  </select>
                </div>
              </div>
              <div class="var-field" style="flex:1">
                <label class="var-field-label">MRP (₹)</label>
                <input type="number" min="0" value="${r.mrp}" placeholder="MRP" onchange="wv(${i},'mrp',this.value)">
              </div>
              <div class="var-field" style="flex:1">
                <label class="var-field-label">Selling (₹) *</label>
                <input type="number" min="0" value="${r.p}" placeholder="Price" onchange="wv(${i},'p',this.value)">
              </div>
              <div class="var-field" style="flex:1">
                <label class="var-field-label">Stock</label>
                <input type="number" min="0" value="${r.s !== undefined && r.s !== null ? r.s : 0}" placeholder="0" onchange="wv(${i},'s',this.value)">
              </div>
              <div class="var-field" style="flex:1">
                <label class="var-field-label">Alert</label>
                <input type="number" min="0" value="${r.low !== undefined && r.low !== null ? r.low : 10}" placeholder="10" onchange="wv(${i},'low',this.value)">
              </div>
              <div class="var-field var-del-wrap" style="width:auto;display:flex;align-items:flex-end">
                ${W.v.length > 1 ? `<button type="button" class="btn rd sm" onclick="wDel(${i})" title="Remove">✕</button>` : ''}
              </div>
            </div>
          `;
          })
          .join('')}
      </div>

      <div class="bar var-quick-add" style="margin-top:10px">
        <small style="font-weight:600">Quick add:</small>
        ${[100, 250, 500, 1000]
          .filter((g) => !W.v.some((r) => r.g == g))
          .map(
            (g) =>
              `<button type="button" class="btn o sm" onclick="wAdd(${g})">+ ${wl(g)}</button>`,
          )
          .join('')}
        <button type="button" class="btn o sm" onclick="wAdd(0)">+ Other Weight</button>
      </div>

      <div class="sec" id="wprev" style="margin:12px 0"></div>

      <div class="wizard-actions">
        <button type="button" class="btn o" onclick="wGo(1)">← Back</button>
        <button type="button" class="btn o" onclick="cl()">Cancel</button>
        <button type="button" class="btn" onclick="wGo(3)">Next: Review →</button>
      </div>
    `;
  }

  if (W.step == 3) {
    const v = [...W.v].sort((a, b) => a.g - b.g),
      f = v[0];
    b = `
      <p style="margin-bottom:12px">This is how customers will see it:</p>
      <div style="max-width:240px;margin:0 auto 14px;pointer-events:none">
        ${card({
          k: 'p',
          id: 0,
          n: W.n,
          c: W.c,
          e: ev({ img: W.img, e: W.e || '🌰' }),
          mrp: +f.mrp,
          p: +f.p,
          s: v.reduce((a, r) => a + (+r.s || 0), 0),
          low: 10,
          vv: v.map((r) => wl(r.g)).join(' · '),
        })}
      </div>
      <div class="sec" style="margin:12px 0;font-size:13px;line-height:1.6">
        ${v
          .map(
            (r) =>
              `${wl(r.g)} — <b>${fm(+r.p)}</b> <small>(MRP ${fm(+r.mrp)}) · stock ${+r.s || 0} packs · alert at ${+r.low || 0}</small>`,
          )
          .join('<br>')}
      </div>
      <p>
        <small style="color:var(--m)">${W.on ? '✔ Will appear on the website straight away.' : '● Set to HIDDEN – customers will not see it.'}</small>
      </p>
      <div class="wizard-actions">
        <button type="button" class="btn o" onclick="wGo(2)">← Back</button>
        <button type="button" class="btn o" onclick="cl()">Cancel</button>
        <button type="button" class="btn" onclick="wSave()">${W.id ? 'Save Changes' : 'Add Product to Website'}</button>
      </div>
    `;
  }

  modal(
    `
    <h2>${W.id ? 'Edit' : 'Add'} Product</h2>
    <div class="steps">
      ${S.map((s, i) => `<span class="${W.step == i + 1 ? 'on' : W.step > i + 1 ? 'done' : ''}">${i + 1}. ${s}</span>`).join('')}
    </div>
    ${b}
  `,
    'wide',
  );

  if (W.step == 2) wPrev();
}

function wSave() {
  if (uploading()) return afterUploads(() => wSave());
  const e = wCheck();
  if (e) return toast(e);
  const old = W.id ? P(W.id) : null;
  W.v.sort((a, b) => a.g - b.g);
  const v = W.v.map((r) => {
    const ex = old && old.v.find((x) => x.w === r.origW || w2g(x.w) === r.g);
    const wStr = ex ? ex.w : r.g >= 1000 && r.g % 1000 === 0 ? r.g / 1000 + 'kg' : r.g + 'g';
    return {
      w: wStr,
      mrp: +r.mrp || +r.p,
      p: +r.p,
      s: Math.max(0, Math.floor(+r.s || 0)),
      low: Math.max(0, Math.floor(+r.low || 0)),
    };
  });
  const o = { n: W.n, c: W.c, e: W.e, f: W.f, on: W.on, v, img: W.img };
  if (old) {
    Object.assign(old, o);
    delete old.sample;
  } else {
    D.prods.push({ id: D.pid++, ...o });
  }
  const saved = save();
  if (old) {
    W.v.forEach((r, idx) => {
      if (r.origS !== undefined && Math.max(0, Math.floor(+r.s || 0)) !== r.origS) {
        const ns = Math.max(0, Math.floor(+r.s || 0));
        pend = pend
          .then(() =>
            api('/api/admin/stock', { method: 'POST', body: { id: old.id, vi: idx, s: ns } }),
          )
          .then(() => {
            if (old.v[idx]) old.v[idx].s = ns;
          })
          .catch(() => {});
      }
    });
  }
  saved
    .then(() => {
      cl();
      render();
      toast(W.id ? 'Product updated' : 'Product added to the website');
    })
    .catch(() => {}); // the error message is already on screen; the form stays open
}
