/**
 * Customer website: header, home, shop, product/combo modals, cart, checkout, My Orders.
 */
const items = () => [
  ...D.prods
    .filter((p) => p.on && p.c !== 'Gift Box')
    .map((p) => ({
      k: 'p',
      id: p.id,
      n: p.n,
      c: p.c,
      e: ev(p),
      f: p.f,
      mrp: p.v[0] ? p.v[0].mrp : 0,
      p: p.v[0] ? p.v[0].p : 0,
      s: p.v.reduce((a, v) => a + v.s, 0),
      low: 10,
      vv: p.v.map((v) => v.w).join(' · '),
    })),
  ...D.combos
    .filter((c) => c.on)
    .map((c) => ({
      k: 'c',
      id: c.id,
      n: c.n,
      c: 'Combos',
      e: ev(c),
      f: c.f,
      mrp: c.p, // one price, like a gift box: no per-item prices, no strike-through
      p: c.p,
      s: cav(c),
      low: 3,
      vv: c.items.length + ' products',
      inc: c.items
        .filter((i) => P(i[0]) && P(i[0]).v[i[1]])
        .map(([p, v, q]) => `${q} × ${P(p).n.replace(/ \(.*\)/, '')} ${P(p).v[v].w}`),
    })),
  ...(D.giftboxes || [])
    .filter((g) => g.on)
    .map((g) => ({
      k: 'g',
      id: g.id,
      n: g.n,
      c: 'Gift Box',
      e: ev({ img: g.img || IM.k_gift, e: '🎁' }),
      f: 0,
      mrp: g.p,
      p: g.p,
      s: 50,
      low: 5,
      vv: 'Gift Box',
      desc: g.desc || '',
    })),
];
const card = (x) =>
  `<div class="card ${x.s <= 0 ? 'oos' : ''}" onclick="${x.k == 'p' ? 'pd' : x.k == 'c' ? 'cb' : 'gb'}(${x.id})"><div class=im>${x.e}${x.s <= 0 ? '<span class=sold>Out of stock</span>' : dsc(x.mrp, x.p) ? `<span class=off>${dsc(x.mrp, x.p)}% OFF</span>` : ''}</div><b>${x.n}</b><small>${x.c} · ${x.vv}</small>${x.desc ? `<p style="font-size:12px;color:var(--muted);margin:4px 0;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${x.desc}</p>` : ''}${x.inc ? `<ul class=inc>${x.inc.map((l) => `<li>${l}</li>`).join('')}</ul>` : ''}<div>${x.k == 'p' ? '<small>from</small> ' : ''}${x.mrp > x.p ? `<s>${fm(x.mrp)}</s> ` : ''}<strong>${fm(x.p)}</strong></div><small>${lab(x.s, x.low)}</small><button class="btn sm" ${x.s <= 0 ? 'disabled' : ''} onclick="event.stopPropagation();qa('${x.k}',${x.id})">${x.s <= 0 ? 'Out of Stock' : 'Add to Cart'}</button></div>`;
const hdr = () =>
  `<div class=top><div class=tk>${[0, 1, 2, 3].map(() => `<span>${D.settings.ticker}</span>`).join('')}</div></div><header><div class="w hd"><img class=brand src="assets/images/logo.webp" alt="Venkata Sai Dry Fruits" onclick="go('')"><div class=sr><input id=sq placeholder="Search almonds, cashews, combos…" oninput=sug(this.value) autocomplete=off><div id=dd class=dd style=display:none></div></div><button class="ic mm" onclick="document.querySelector('nav').classList.toggle('open')">☰ Menu</button><nav><a onclick="go('')">Home</a><a onclick="go('shop')">Shop</a><a onclick="go('shop/Combos')">Combos</a><a onclick="go('shop?offers')">Offers</a><a onclick="go('orders')">My Orders</a><a href="${IP}" target="_blank" rel="noopener noreferrer" id="navTrackOrder">Track Order</a><a onclick="go('about')">Contact</a></nav><button class=ic onclick=cartM()>🛒 <b>${cart.reduce((a, x) => a + x.q, 0)}</b></button></div></header>`;
const ftr = () =>
  `<footer><div class=w><div><img class=brand src="assets/images/logo.webp" alt="Venkata Sai Dry Fruits" style="height:120px;margin-bottom:8px"><p>Wholesale & Retail premium dry fruits, nuts, dates & gift boxes since years in Guntur.</p><small>GSTIN: 37BRLPK9740E1ZG</small></div><div><b>Visit us</b><p>D.No. 23-6-15, Opp: Axis Bank, Patnam Bazar, Guntur – 522003, A.P.</p></div><div><b>Contact</b><p>📞 <a href="tel:8885355666">88853 55666</a><br>K. Vinod Kumar</p><a onclick=go('admin') style=cursor:pointer;font-size:12px>Admin login</a></div></div><div class=w style=display:block;margin-top:14px><small>© 2026 VSD – Venkata Sai Dry Fruits · Privacy · Terms · Shipping · Refund Policy</small></div></footer><a class=wa href="https://wa.me/${waNo()}?text=Hi%20VSD%2C%20I%20want%20to%20order" target=_blank aria-label="Chat on WhatsApp"><svg viewBox="0 0 24 24" width="32" height="32" fill="#fff" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>`;
const go = (h) => {
  location.hash = '#/' + h;
  cl();
  if (typeof toggleAdmDrawer === 'function') toggleAdmDrawer(false);
};
function sug(v) {
  const d = $('#dd');
  v = v.trim().toLowerCase();
  if (!v) {
    d.style.display = 'none';
    return;
  }
  const r = items()
    .filter((x) => (x.n + x.c).toLowerCase().includes(v))
    .slice(0, 6);
  d.innerHTML =
    r
      .map(
        (x) =>
          `<div onclick="${x.k == 'p' ? 'pd' : 'cb'}(${x.id});$('#dd').style.display='none'">${x.e} ${x.n} <small>${x.c}</small></div>`,
      )
      .join('') || '<div>No match</div>';
  d.style.display = 'block';
}
function render(k) {
  const h = location.hash.slice(2) || '';
  if (h.startsWith('admin')) return renderA(h.split('/')[1] || 'dash');
  const [pg, qs] = h.split('?'),
    [pp, cc] = pg.split('/');
  let b = '';
  if (pp == '') {
    const it = items();
    b = `<div class=w>${heroV()}
<div class=tr><div>🏅 Premium Quality</div><div>📦 Freshly Packed</div><div>🔒 Secure Payments</div><div>🚚 Pan-India Shipping</div><div>✅ Quality Checked</div></div>
<h2 class=s>Shop by Category</h2><div class=cats>${(D.cats || [])
      .filter((c) => c.on !== 0)
      .map(
        (c) =>
          `<div class=cat onclick="go('shop/${encodeURIComponent(catName(c))}')"><span>${cem(c)}</span>${catName(c)}</div>`,
      )
      .join(
        '',
      )}<div class=cat onclick="go('shop/Combos')"><span>${cem(['Combos'])}</span>Combos</div></div>
<h2 class=s>Popular Combos <a onclick="go('shop/Combos')">View all →</a></h2><div class=grid>${it
      .filter((x) => x.k == 'c')
      .map(card)
      .join('')}</div>
<h2 class=s>Featured Products <a onclick="go('shop')">View all →</a></h2><div class=grid>${it
      .filter((x) => x.k == 'p' && x.f)
      .slice(0, 8)
      .map(card)
      .join('')}</div>
<h2 class=s>Best Sellers</h2><div class=grid>${bestS().slice(0, 4).map(card).join('')}</div>
<h2 class=s>Loved by customers</h2><div class=rv>${[
      ['Ravi T.', 'Almonds were super fresh and crunchy. Delivery was quick!'],
      ['Lakshmi P.', 'The festival gift combo was beautifully packed.'],
      ['Suresh B.', 'Best wholesale rates in Guntur. Highly recommended.'],
    ]
      .map((r) => `<div class=sec>⭐⭐⭐⭐⭐<p>${r[1]}</p><b>${r[0]}</b></div>`)
      .join('')}</div></div>`;
  } else if (pp == 'shop') {
    let it = items();
    const c = cc ? decodeURIComponent(cc) : F.c;
    if (c) it = it.filter((x) => x.c == c);
    if (qs == 'offers')
      it = it.filter((x) => dsc(x.mrp, x.p) > 0).sort((a, b) => dsc(b.mrp, b.p) - dsc(a.mrp, a.p));
    if (F.st) it = it.filter((x) => x.s > 0);
    if (F.s == 'l') it.sort((a, b) => a.p - b.p);
    if (F.s == 'h') it.sort((a, b) => b.p - a.p);
    if (F.s == 'd') it.sort((a, b) => dsc(b.mrp, b.p) - dsc(a.mrp, a.p));
    const activeCats = (D.cats || []).filter((x) => x.on !== 0);
    b = `<div class=w><h2 class=s>${qs == 'offers' ? 'Special Offers' : c || 'All Products'} <small>${it.length} items</small></h2><div class=cats><div class="cat ${!c ? 'on' : ''}" onclick="go('shop')"><span>🛍️</span>All</div>${[...activeCats, { name: 'Combos', emoji: '🧺' }].map((x) => `<div class="cat ${c == catName(x) ? 'on' : ''}" onclick="go('shop/${encodeURIComponent(catName(x))}')"><span>${cem(x)}</span>${catName(x)}</div>`).join('')}</div><div class=bar><select onchange="F.s=this.value;render()"><option value="">Sort: Popular</option><option value=l ${F.s == 'l' ? 'selected' : ''}>Price: Low → High</option><option value=h ${F.s == 'h' ? 'selected' : ''}>Price: High → Low</option><option value=d ${F.s == 'd' ? 'selected' : ''}>Highest Discount</option></select><label style="margin:0;display:flex;gap:6px;align-items:center"><input type=checkbox style=width:auto ${F.st ? 'checked' : ''} onchange="F.st=this.checked?1:0;render()">In stock only</label></div><div class=grid>${it.map(card).join('') || '<p>No products found.</p>'}</div></div>`;
  } else if (pp == 'orders') b = ordersV();
  else
    b = `<div class=w><div class=sec style=margin-top:20px><h2>Contact Us</h2><p>📍 D.No. 23-6-15, Opp: Axis Bank, Patnam Bazar, Guntur – 522003, A.P.<br>📞 88853 55666 · GSTIN 37BRLPK9740E1ZG<br>Proprietor: K. Vinod Kumar</p><a class=btn href="https://wa.me/${waNo()}" target=_blank>Chat on WhatsApp</a></div></div>`;
  $('#app').innerHTML = hdr() + b + ftr() + custNav(pp, cc);
  k || window.scrollTo(0, 0);
}
function custNav(pp, cc) {
  const isHome = pp === '';
  const isShop = pp === 'shop' && cc !== 'Combos';
  const isOrders = pp === 'orders';
  const isCombos = pp === 'shop' && cc === 'Combos';

  return `<nav class="mob-bottom-nav">
    <button class="mbn-item ${isHome ? 'on' : ''}" onclick="go('')">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <span>Home</span>
    </button>
    <button class="mbn-item ${isShop ? 'on' : ''}" onclick="go('shop')">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      <span>Products</span>
    </button>
    <button class="mbn-item ${isOrders ? 'on' : ''}" onclick="go('orders')">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
      <span>My Orders</span>
    </button>
    <button class="mbn-item" onclick="window.open(IP, '_blank')">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span>Track Order</span>
    </button>
    <button class="mbn-item ${isCombos ? 'on' : ''}" onclick="go('shop/Combos')">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
      <span>Combos</span>
    </button>
  </nav>`;
}
function bestS() {
  const m = {};
  D.orders.forEach((o) => o.items.forEach((i) => (m[i.id] = (m[i.id] || 0) + i.q)));
  return items().sort((a, b) => (m[b.id] || 0) - (m[a.id] || 0));
}
let sv = {};
/* ---- Weight chooser: buyer picks a configured variant or custom weight, price is computed from variant tiers ---- */
const wmin = (p) => Math.min(...p.v.map((v) => w2g(v.w) || 100));
/** Split a weight (grams) into the available packs (largest first). Returns lines [[variantIndex,packs]], price, mrp, ok. */
function plan(p, g) {
  let rem = g,
    lines = [],
    price = 0,
    mrp = 0;
  [...p.v.keys()]
    .sort((a, b) => w2g(p.v[b].w) - w2g(p.v[a].w))
    .forEach((i) => {
      const v = p.v[i],
        w = w2g(v.w) || 100,
        have = (cart.find((c) => c.t == 'p' && c.id == p.id && c.vi == i) || { q: 0 }).q,
        n = Math.max(0, Math.min(Math.floor(rem / w), v.s - have));
      if (n) {
        lines.push([i, n]);
        rem -= n * w;
        price += n * v.p;
        mrp += n * v.mrp;
      }
    });
  return { lines, price, mrp, ok: rem == 0 && g > 0 };
}
function pd(id) {
  const p = P(id);
  const defVi = p && p.v && p.v.length === 1 ? 0 : -1;
  const defG = defVi === 0 ? w2g(p.v[0].w) : 0;
  sv = { t: 'p', id, vi: defVi, g: defG };
  pdv();
}
function pdv() {
  const p = P(sv.id);
  if (!p) return;
  const mn = wmin(p),
    oos = p.v.every((v) => v.s <= 0);
  const hasVar = sv.vi >= 0 && sv.vi < p.v.length;
  const curV = hasVar ? p.v[sv.vi] : null;
  const curHave = hasVar
    ? (cart.find((c) => c.t == 'p' && c.id == p.id && c.vi == sv.vi) || { q: 0 }).q
    : 0;
  const varInStock = curV ? curV.s - curHave > 0 : false;
  const pl = !hasVar && sv.g > 0 ? plan(p, sv.g) : null;
  const canBuy = hasVar ? varInStock : pl ? pl.ok : false;
  const dispPrice = hasVar ? curV.p : pl && pl.ok ? pl.price : 0;
  const dispMrp = hasVar ? curV.mrp : pl && pl.ok ? pl.mrp : 0;
  const dispG = hasVar ? w2g(curV.w) : sv.g || 0;
  const varLabel = (v) => {
    const g = w2g(v.w);
    return v.w && !/\d/.test(v.w) ? v.w : wl(g);
  };
  modal(
    `<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:16px" class=pg><div class=im style="height:230px;font-size:110px">${ev(p)}</div><div><h2>${p.n}</h2><small>${p.c} · ⭐ 4.8 (245 reviews)</small><label>${p.v.length > 1 ? 'Choose weight / variant' : 'Package size'}</label><div class=vr>${p.v
      .map((v, i) => {
        const g = w2g(v.w),
          inStock = v.s > 0,
          lbl = varLabel(v);
        return `<button class="${i === sv.vi ? 'on' : ''}" ${inStock ? '' : 'disabled title="Out of stock"'} onclick="sv.vi=${i};sv.g=${g};pdv()">${lbl}</button>`;
      })
      .join(
        '',
      )}</div>${false ? `<div class=bar><small>Or set your own weight</small><span class=q><button onclick="changeG(-${mn})">−</button><input type=number value="${dispG || ''}" placeholder=0 min=${mn} step=${mn} style="width:84px;border:0;text-align:center" onchange="setCustomG(this.value)"><button onclick="changeG(${mn})">+</button></span><small>grams</small></div>` : ''}<div class=sec style="margin:10px 0">${oos ? '<span class=no style="font-size:18px">● Out of stock – currently unavailable</span>' : !dispG && !hasVar ? '<span style=color:var(--m)>👆 Choose a weight above to see the price</span>' : canBuy ? `<small>${curV ? varLabel(curV) : wl(dispG)} of ${p.n}</small><div>${dispMrp > dispPrice ? `<s>${fm(dispMrp)}</s> ` : ''}<strong style="font-size:28px;color:var(--g)">${fm(dispPrice)}</strong> ${dsc(dispMrp, dispPrice) > 0 ? `<span class=pill>${dsc(dispMrp, dispPrice)}% OFF</span>` : ''}</div><span class=ok>● In stock</span>` : `<span class=no>● ${hasVar ? 'Out of stock' : 'This quantity is not available right now. Try a smaller weight.'}</span>`}</div><div class=bar><button class="btn ${canBuy ? '' : 'disabled'}" onclick="addProdVariant(0)">${oos ? 'Out of Stock' : dispG || hasVar ? 'Add to Cart' : 'Choose weight first'}</button><button class="btn gd ${canBuy ? '' : 'disabled'}" onclick="addProdVariant(1)">Buy Now</button></div><a class="btn o" style=text-decoration:none;display:block;text-align:center href="https://wa.me/${waNo()}?text=${encodeURIComponent('Hi, I want ' + (curV ? curV.w + ' ' : dispG ? wl(dispG) + ' ' : '') + p.n)}" target=_blank>💬 Ask on WhatsApp</a><p><small>✔ Premium quality · ✔ Hygienically packed · ✔ Delivery across India via India Post. Store in an airtight container in a cool, dry place.</small></p></div></div>`,
  );
}
function changeG(d) {
  const p = P(sv.id);
  if (!p) return;
  const mn = wmin(p),
    g = Math.max(mn, (sv.g || 0) + d);
  setCustomG(g);
}
function setCustomG(v) {
  const p = P(sv.id);
  if (!p) return;
  const mn = wmin(p),
    g = +v ? Math.max(mn, Math.round(+v / mn) * mn) : 0;
  if (!g) {
    sv.vi = -1;
    sv.g = 0;
    pdv();
    return;
  }
  const i = p.v.findIndex((x) => w2g(x.w) === g);
  sv.vi = i;
  sv.g = g;
  pdv();
}
function addProdVariant(buy) {
  const p = P(sv.id);
  if (!p) return;
  if (sv.vi >= 0 && sv.vi < p.v.length) {
    const v = p.v[sv.vi],
      have = (cart.find((c) => c.t == 'p' && c.id == p.id && c.vi == sv.vi) || { q: 0 }).q;
    if (v.s - have < 1) return toast('This variant is out of stock');
    add('p', p.id, sv.vi, 1, buy);
  } else if (sv.g > 0) {
    addW(buy);
  }
}
function addW(buy) {
  const p = P(sv.id);
  if (!p) return;
  if (sv.vi >= 0 && sv.vi < p.v.length) return addProdVariant(buy);
  const pl = plan(p, sv.g);
  if (!pl.ok) return toast('This quantity is not available right now');
  pl.lines.forEach(([vi, n]) => {
    const x = cart.find((c) => c.t == 'p' && c.id == p.id && c.vi == vi);
    x ? (x.q += n) : cart.push({ t: 'p', id: p.id, vi, q: n });
  });
  save();
  toast('Added ' + wl(sv.g) + ' ' + p.n);
  buy ? cartM() : (cl(), render(1));
}
function cb(id) {
  sv = { t: 'c', id, vi: 0, q: 1 };
  cbv();
}
/** Combo popup: clear list of every product inside, savings, quantity, add to cart. */
/** Combo popup: same layout and mechanism as the gift box popup (one price), plus what is inside – without per-item prices. */
function cbv() {
  const c = CB(sv.id),
    av = cav(c);
  if (!c) return;
  const inside = c.items
    .filter(([p, v]) => P(p) && P(p).v[v])
    .map(([p, v, k]) => {
      const pr = P(p),
        vr = pr.v[v];
      return `<div class=insrow><span class=insimg>${ev(pr)}</span><div><b>${pr.n}</b><br><small>${vr.w}${k > 1 ? ' × ' + k : ''}</small></div></div>`;
    })
    .join('');
  modal(
    `<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:16px" class=pg><div class=im style="height:230px;font-size:110px">${ev(c)}</div><div><h2>${c.n}</h2><small>Combo Pack · Handcrafted & Premium</small><h3 style="margin:12px 0 6px;font-size:16px">What's inside (${c.items.length} products)</h3><div class=ins>${inside}</div><div class=sec style="margin:12px 0"><div><strong style="font-size:28px;color:var(--g)">${fm(c.p)}</strong> <small>all items included</small></div>${lab(av, 3)}</div><div class=bar><button class=btn ${av < 1 ? 'disabled' : ''} onclick="add('c',${c.id},0,1)">${av < 1 ? 'Out of Stock' : 'Add to Cart'}</button><button class="btn gd" ${av < 1 ? 'disabled' : ''} onclick="add('c',${c.id},0,1,1)">Buy Now</button></div><a class="btn o" style=text-decoration:none;display:block;text-align:center href="https://wa.me/${waNo()}?text=${encodeURIComponent('Hi, I want to order ' + c.n + ' (' + fm(c.p) + ')')}" target=_blank>💬 Ask on WhatsApp</a><p><small>✔ Premium packing · ✔ Fresh, hygienically packed dry fruits · ✔ Safe delivery across India via India Post.</small></p></div></div>`,
  );
}
function add(t, id, vi, q, buy) {
  const x = cart.find((c) => c.t == t && c.id == id && c.vi == vi),
    have = x ? x.q : 0;
  if (have + q > avN(t, id, vi)) return toast('Sorry, not enough stock available');
  x ? (x.q += q) : cart.push({ t, id, vi, q });
  save();
  toast('Added to cart ✓');
  buy ? cartM() : (cl(), render(1));
}
function gb(id) {
  const g = GB(id);
  if (!g) return;
  modal(
    `<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:16px" class=pg><div class=im style="height:230px;font-size:110px">${ev({ img: g.img || IM.k_gift, e: '🎁' })}</div><div><h2>${g.n}</h2><small>Gift Box · Handcrafted & Premium</small><p style="margin:12px 0;line-height:1.5;color:var(--t)">${g.desc || 'Premium festive dry fruits & nuts gift box.'}</p><div class=sec style="margin:12px 0"><div><strong style="font-size:28px;color:var(--g)">${fm(g.p)}</strong></div><span class=ok>● In stock · Ready to dispatch</span></div><div class=bar><button class=btn onclick="add('g',${g.id},0,1)">Add to Cart</button><button class="btn gd" onclick="add('g',${g.id},0,1,1)">Buy Now</button></div><a class="btn o" style=text-decoration:none;display:block;text-align:center href="https://wa.me/${waNo()}?text=${encodeURIComponent('Hi, I want to order ' + g.n + ' (' + fm(g.p) + ')')}" target=_blank>💬 Ask on WhatsApp</a><p><small>✔ Premium gift packaging · ✔ Fresh, hygienically packed dry fruits & nuts · ✔ Safe delivery across India via India Post.</small></p></div></div>`,
  );
}
function qa(k, id) {
  if (k === 'g') add('g', id, 0, 1);
  else if (k === 'p') pd(id);
  else add('c', id, 0, 1); // a combo has nothing to choose: Add to Cart adds it straight away
}
const line = (x) =>
  x.t == 'p'
    ? {
        n: P(x.id).n + ' ' + P(x.id).v[x.vi].w,
        e: ev(P(x.id)),
        pr: P(x.id).v[x.vi].p,
        c: P(x.id).c,
      }
    : x.t == 'c'
      ? { n: CB(x.id).n, e: ev(CB(x.id)), pr: CB(x.id).p, c: 'Combos' }
      : {
          n: (GB(x.id) || {}).n || 'Gift Box',
          e: ev({ img: (GB(x.id) || {}).img || IM.k_gift, e: '🎁' }),
          pr: (GB(x.id) || {}).p || 0,
          c: 'Gift Box',
        };
const tot = (cp) => {
  const sub = cart.reduce((a, x) => a + line(x).pr * x.q, 0),
    d = cp ? Math.min(Math.round(sub * 0.1), 500) : 0,
    sh = sub - d >= D.settings.free || !sub ? 0 : D.settings.ship;
  return { sub, d, sh, t: sub - d + sh };
};
function cartM() {
  const t = tot();
  modal(
    `<h2>Your Cart</h2>${
      cart
        .map((x, i) => {
          const l = line(x);
          return `<div class=ci><span class=e>${l.e}</span><div><b>${l.n}</b><br>${fm(l.pr)}</div><span class=q><button onclick="cq(${i},-1)">−</button>${x.q}<button onclick="cq(${i},1)">+</button></span></div>`;
        })
        .join('') || '<p>Your cart is empty.</p>'
    }${cart.length ? `<p>Subtotal: <b>${fm(t.sub)}</b><br>Shipping: <b>${t.sh ? fm(t.sh) : 'FREE'}</b> <small>(free above ${fm(D.settings.free)})</small><br><span style=font-size:20px>Total: <b>${fm(t.t)}</b></span></p><button class=btn style=width:100% onclick=chk()>Proceed to Checkout</button>` : ''}`,
    'dr',
  );
}
function cq(i, d) {
  const x = cart[i];
  if (d > 0 && x.q + 1 > avN(x.t, x.id, x.vi)) return toast('No more stock available');
  x.q += d;
  if (x.q < 1) cart.splice(i, 1);
  save();
  cartM();
  $('#app').innerHTML = hdr() + $('#app').innerHTML.split('</header>')[1];
}
let cpn = '';
function chk() {
  if (!cart.length) return;
  const t = tot(cpn);
  modal(
    `<h2>Checkout</h2><label>Full name</label><input id=cn><label>Phone (10-digit Indian mobile)</label><input id=cp inputmode=numeric maxlength=10><label>Email</label><input id=ce><label>Address</label><textarea id=ca rows=2></textarea><div class=bar><div style=flex:1><label>City</label><input id=cc></div><div style=flex:1><label>PIN code</label><input id=cz maxlength=6 inputmode=numeric></div></div><label>State</label><input id=cs value="Andhra Pradesh"><p>Total: <b style=font-size:20px>${fm(t.t)}</b> <small>(incl. shipping ${t.sh ? fm(t.sh) : 'FREE'}${t.d ? ', discount ' + fm(t.d) : ''})</small></p><p><small>After you tap the button, WhatsApp opens with your address and order details. Press Send to confirm.</small></p><button class=btn style=width:100% id=placeBtn onclick=place()>Place Order via WhatsApp</button>`,
  );
}
function place() {
  const g = (i) => $('#' + i).value.trim(),
    ph = g('cp');
  if (
    g('cn').length < 2 ||
    !/^[6-9]\d{9}$/.test(ph) ||
    !/^\d{6}$/.test(g('cz')) ||
    g('ca').length < 5 ||
    !g('cc')
  )
    return toast('Please check name, phone, address, city & 6-digit PIN');
  const b = $('#placeBtn');
  b.disabled = true;
  b.textContent = 'Placing order…';
  api('/api/orders', {
    method: 'POST',
    body: {
      name: g('cn'),
      phone: ph,
      email: g('ce'),
      address: g('ca'),
      city: g('cc'),
      state: g('cs'),
      pin: g('cz'),
      items: cart.map((x) => ({ t: x.t, id: x.id, vi: x.vi, q: x.q })),
    },
  })
    .then(({ order: o }) => {
      cart = [];
      save();
      try {
        const l = JSON.parse(localStorage.vlist || '[]');
        l.unshift({ no: o.no, phone: o.phone });
        localStorage.vlist = JSON.stringify(l.slice(0, 20));
        localStorage.vlastphone = o.phone;
      } catch (e) {}
      loadCatalog()
        .then(() => render(1))
        .catch(() => {});
      const wu = waUrl(o);
      window.open(wu, '_blank');
      modal(
        `<h2>🎉 Order placed!</h2><p>Order <b>${o.no}</b> is saved. WhatsApp should have opened with your address and order details – press <b>Send</b> there to confirm.</p><a class=btn href="${wu}" target=_blank style="display:block;text-align:center;text-decoration:none">Open WhatsApp again</a><p><button class="btn o" onclick="go('orders')">My orders</button></p>`,
      );
    })
    .catch((e) => {
      b.disabled = false;
      b.textContent = 'Place Order via WhatsApp';
      toast(e.message);
    });
}
const waUrl = (o) =>
  `https://wa.me/${waNo()}?text=` +
  encodeURIComponent(
    `*New Order ${o.no}*\n\nName: ${o.cust}\nPhone: ${o.phone}\nAddress: ${o.addr}\n\n*Items*\n` +
      o.items.map((i) => `• ${i.n} × ${i.q} = ${fm(i.price * i.q)}`).join('\n') +
      `\n\nSubtotal: ${fm(o.sub)}\nShipping: ${o.ship ? fm(o.ship) : 'FREE'}\n*Total: ${fm(o.tot)}*`,
  );
/* hero banner slider (banners come from Admin > Banners) */
let hi = 0;
const slideH = (x) =>
  `<div><small style=color:#ffd98a;letter-spacing:2px>${x.k || ''}</small><h1>${x.h}</h1><p>${x.d || ''}</p><div class=bar>${x.btn ? `<button class="btn gd" onclick="bgo(${x.id})">${x.btn}</button>` : ''}<a class="btn o" style="color:#fff;border-color:#fff;text-decoration:none" href="https://wa.me/${waNo()}" target=_blank>Order on WhatsApp</a></div></div><div class=bowl>${x.img ? `<img src="${x.img}" alt="" style="width:100%;display:block;border-radius:22px;box-shadow:0 20px 50px #0007">` : '🥣'}</div>`;
/* Arrow button style is written inline so the arrows always show, even if the CSS file has no .harr rules */
const ARR =
  'position:absolute;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:50%;border:0;background:rgba(0,0,0,.55);color:#fff;font-size:28px;line-height:1;cursor:pointer;z-index:5;display:flex;align-items:center;justify-content:center;padding:0';
function heroV() {
  const b = D.banners.filter((x) => x.on);
  if (!b.length) return '';
  hi %= b.length;
  return `<div class="hero${b.length > 1 ? ' hasarr' : ''}" id=hero style="position:relative">${b.length > 1 ? `<button type=button class="harr harr-l" onclick="hgo(-1)" aria-label="Previous banner" style="${ARR};left:12px">&#8249;</button><button type=button class="harr harr-r" onclick="hgo(1)" aria-label="Next banner" style="${ARR};right:12px">&#8250;</button>` : ''}${slideH(b[hi])}${b.length > 1 ? `<div class=dots>${b.map((_, i) => `<i class="${i == hi ? 'on' : ''}" onclick="hi=${i};hpause=Date.now()+10000;hup()"></i>`).join('')}</div>` : ''}</div>`;
}
const hup = () => {
  const h = $('#hero');
  if (h) h.outerHTML = heroV();
};
let hpause = 0;
const hgo = (d) => {
  const n = D.banners.filter((x) => x.on).length;
  if (n < 2) return;
  hi = (((hi + d) % n) + n) % n;
  hpause = Date.now() + 10000;
  hup();
};
let htx = 0;
document.addEventListener(
  'touchstart',
  (e) => {
    htx = e.target.closest && e.target.closest('#hero') ? e.touches[0].clientX : 0;
  },
  { passive: true },
);
document.addEventListener('touchend', (e) => {
  if (!htx) return;
  const dx = e.changedTouches[0].clientX - htx;
  htx = 0;
  if (Math.abs(dx) > 50) hgo(dx < 0 ? 1 : -1);
});
function bgo(id) {
  const l = (D.banners.find((b) => b.id == id).link || '').trim();
  if (/^https?:/.test(l)) window.open(l, '_blank');
  else go(l.replace(/^#?\/?/, ''));
}
const lg = (t) => D.log.unshift([new Date().toISOString(), t]);
function normCustPhone(p) {
  if (!p) return '';
  let s = String(p).replace(/\D+/g, '');
  if (s.length === 12 && s.startsWith('91')) s = s.slice(2);
  else if (s.length === 11 && s.startsWith('0')) s = s.slice(1);
  return s;
}

const ordCard = (o) =>
  `<div class=sec style="margin-bottom:12px;border:1px solid var(--l);border-radius:10px;padding:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
      <div><b>${o.no}</b> <span class="pill ${o.st == 'Cancelled' ? 'r' : o.st == 'Pending' ? 'w1' : ''}">${o.st}</span></div>
      <small style="color:var(--muted)">Ordered on ${new Date(o.d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
    </div>
    <div style="margin:10px 0;padding:10px;background:var(--bg);border-radius:8px">
      <small style="font-weight:600;display:block;margin-bottom:4px;color:var(--muted)">ITEMS ORDERED:</small>
      ${(o.items || []).map((i) => `<div>${i.q} × ${i.n} <span style="float:right;color:var(--muted)">${fm(i.price * i.q)}</span></div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:8px">
      <div><b>Total: ${fm(o.tot)}</b> <small style="color:var(--muted)">· Payment: ${o.pay}</small></div>
      ${o.track ? `<div class=bar style="margin:0"><small>Tracking: <b>${o.track}</b></small><button class="btn sm gd" onclick="trk('${o.track}')">📍 Track Order</button></div>` : ''}
    </div>
  </div>`;

function ordersV() {
  setTimeout(() => {
    let savedPhone = localStorage.vlastphone || '';
    if (!savedPhone) {
      try {
        const l = JSON.parse(localStorage.vlist || '[]');
        if (l.length && l[0].phone) savedPhone = l[0].phone;
      } catch (e) {}
    }
    const inp = $('#op');
    if (inp && savedPhone) {
      inp.value = savedPhone;
      searchOrders();
    } else {
      const ol = $('#ol');
      if (ol)
        ol.innerHTML =
          '<div class=sec style="text-align:center;color:var(--muted);padding:24px"><p>Enter your 10-digit registered mobile number above to view your orders.</p></div>';
    }
  }, 0);

  return `<div class=w>
    <h2 class=s>My Orders</h2>
    <p style="color:var(--muted);margin-bottom:12px">Search and track your orders using your registered mobile number.</p>
    <div class=bar style="margin-bottom:16px">
      <input id=op type="tel" placeholder="Enter 10-digit mobile number" maxlength=15 style="max-width:280px" onkeydown="if(event.key==='Enter')searchOrders()">
      <button id=searchBtn class=btn onclick=searchOrders()>Search Orders</button>
    </div>
    <div id=orderMsg style="display:none;margin-bottom:12px"></div>
    <div id=ol><div class=sec style="text-align:center;padding:24px">Loading…</div></div>
  </div>`;
}

async function searchOrders() {
  const inp = $('#op');
  const btn = $('#searchBtn');
  const ol = $('#ol');
  const msg = $('#orderMsg');
  if (!inp || !ol) return;

  const rawPhone = inp.value.trim();
  const phone = normCustPhone(rawPhone);

  if (msg) {
    msg.style.display = 'none';
    msg.innerHTML = '';
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    if (msg) {
      msg.style.display = 'block';
      msg.innerHTML = `<div class=sec style="border-left:4px solid var(--r);color:var(--r);padding:10px 14px">Please enter a valid 10-digit mobile number (e.g., 9876543210).</div>`;
    }
    inp.focus();
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Searching…';
  }
  ol.innerHTML = `<div class=sec style="text-align:center;padding:28px"><p style="color:var(--muted)">Searching orders for <b>+91 ${phone}</b>…</p></div>`;

  try {
    const res = await api(`/api/customer/orders?phone=${encodeURIComponent(phone)}`);
    const orders = res.orders || [];
    localStorage.vlastphone = phone;

    if (!orders.length) {
      ol.innerHTML = `<div class=sec style="text-align:center;padding:32px 16px"><p style="font-size:16px;color:var(--muted);margin-bottom:8px">No orders found for mobile number <b>+91 ${phone}</b>.</p><small style="color:var(--muted)">Please verify that you entered the mobile number used when placing your order.</small></div>`;
    } else {
      ol.innerHTML = orders.map(ordCard).join('');
    }
  } catch (err) {
    ol.innerHTML = '';
    if (msg) {
      msg.style.display = 'block';
      msg.innerHTML = `<div class=sec style="border-left:4px solid var(--r);color:var(--r);padding:12px 14px"><b>Error:</b> ${err.message || 'Unable to load orders. Please try again.'}</div>`;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Search Orders';
    }
  }
}

function trk(n) {
  if (n) {
    navigator.clipboard && navigator.clipboard.writeText(n).catch(() => {});
    toast('Tracking number ' + n + ' copied – paste it on India Post');
  }
  window.open(IP, '_blank');
}