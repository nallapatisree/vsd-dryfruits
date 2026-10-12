/**
 * App state, localStorage persistence, small helpers (price/stock maths, toast, modal).
 */
let pend = Promise.resolve(),
  D = {
    cats: [],
    prods: [],
    combos: [],
    giftboxes: [],
    banners: [],
    orders: [],
    log: [],
    theme: 'green',
    settings: {},
  },
  cart = [],
  F = { q: '', c: '', s: '', st: 0 },
  R = 30,
  adm = false;
try {
  cart = JSON.parse(localStorage.vcart || '[]');
} catch (e) {}
const $ = (s) => document.querySelector(s),
  fm = (n) => '₹' + Math.round(n).toLocaleString('en-IN'),
  save = () => {
    try {
      localStorage.vcart = JSON.stringify(cart);
    } catch (e) {}
    if (!adm) return Promise.resolve();
    const run = pend.then(pushCatalog); // rejects when the server refuses the save
    pend = run.catch(() => {}); // the queue itself must keep working after an error
    run.catch(() => {}); // the error is already shown by pushCatalog
    return run;
  };
document.documentElement.dataset.theme = D.theme || 'green';
D.settings = Object.assign(
  {
    ship: 50,
    free: 500,
    wa: '918885355666',
    ticker:
      '🚚 Wholesale & Retail  ·  All-India delivery  ·  Free shipping on big orders  ·  Fresh, hygienically packed dry fruits  ·  📞 88853 55666  ·  Patnam Bazar, Guntur',
  },
  D.settings || {},
);
D.banners = D.banners || [
  {
    id: 1,
    k: 'GOODNESS IN EVERY BITE',
    h: 'Premium Dry Fruits for a Healthier Tomorrow',
    d: '100% natural · Hand-picked · Hygienically packed. Wholesale & retail from Patnam Bazar, Guntur.',
    btn: 'Shop Now →',
    link: 'shop',
    img: IM.hero,
    on: 1,
  },
  {
    id: 2,
    k: 'FESTIVE SPECIAL',
    h: 'Gift Boxes & Combos for Every Occasion',
    d: 'Beautifully packed combos of almonds, cashews, dates and more.',
    btn: 'View Combos',
    link: 'shop/Combos',
    img: IM.k_gift,
    on: 1,
  },
];
D.bid = D.bid || 10;
const waNo = () => D.settings.wa || WA;
const w2g = (w) => {
  if (typeof w === 'number') return w;
  const s = String(w || '')
      .trim()
      .toLowerCase(),
    m = s.match(/^([\d.]+)\s*(kg|kilo|g|gm|grams?)?$/);
  if (!m) return parseInt(s) || 0;
  const num = parseFloat(m[1]) || 0;
  return m[2] && m[2].startsWith('k') ? Math.round(num * 1000) : Math.round(num);
};
const wl = (g) => (g >= 1000 ? g / 1000 + ' kg' : g + ' g');
const ev = (o) => (o.img ? `<img src="${o.img}" alt="">` : o.e),
  P = (id) => D.prods.find((p) => p.id == id),
  CB = (id) => D.combos.find((c) => c.id == id),
  GB = (id) => (D.giftboxes || []).find((g) => g.id == id),
  dsc = (a, b) => (a > b ? Math.round(((a - b) / a) * 100) : 0);
const cmrp = (c) =>
  c.items.reduce((a, [p, v, q]) => {
    const pr = P(p),
      vr = pr && pr.v[v];
    return a + (vr ? vr.mrp * q : 0);
  }, 0);
const cav = (c) =>
  Math.min(
    ...c.items.map(([p, v, q]) => {
      const pr = P(p),
        vr = pr && pr.v[v];
      return vr ? Math.floor(vr.s / q) : 0;
    }),
  );
const avN = (t, id, vi) => (t == 'p' ? P(id).v[vi].s : t == 'c' ? cav(CB(id)) : 50);
const lab = (n, low) =>
  n <= 0
    ? '<span class=no>● Out of stock</span>'
    : n <= low
      ? '<span class=low>● Only a few left</span>'
      : '<span class=ok>● In stock</span>';
const toast = (t, ms = 2200) => {
  const e = $('#toast');
  e.textContent = t;
  e.style.display = 'block';
  clearTimeout(e.t);
  e.t = setTimeout(() => (e.style.display = 'none'), ms);
};
const modal = (h, c = '') => {
    $('#m').innerHTML =
      `<div class=mb onclick="if(event.target==this)cl()"><div class="md ${c}"><button class=x onclick=cl()>×</button>${h}</div></div>`;
  },
  cl = () => ($('#m').innerHTML = '');

/** Apply and remember the website colour theme. */
function setTheme(t) {
  D.theme = t;
  save();
  document.documentElement.dataset.theme = t;
  render();
  toast('Theme applied');
}

/* ---------- server API ---------- */
/** JSON fetch helper. Throws Error(message) when the server replies with an error. */
const api = (u, o = {}) =>
  fetch(u, {
    credentials: 'same-origin',
    ...o,
    headers: { 'Content-Type': 'application/json' },
    body: o.body && JSON.stringify(o.body),
  }).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(j.error || 'Request failed');
    return j;
  });
/** Public catalogue (products, combos, banners, settings, theme). */
async function loadCatalog() {
  Object.assign(D, await api('/api/catalog'));
  document.documentElement.dataset.theme = D.theme || 'green';
}
/** Admin only: full catalogue (real stock + log) and all orders. */
async function loadAdmin() {
  await pend;
  const j = await api('/api/admin/data');
  Object.assign(D, j.catalog, { orders: j.orders });
  document.documentElement.dataset.theme = D.theme || 'green';
}
/** Admin only: save catalogue edits. The server keeps its own stock numbers for existing sizes. */
function pushCatalog() {
  const { cats, prods, combos, giftboxes, banners, settings, theme, pid, cid, gid, bid } = D;
  return api('/api/admin/catalog', {
    method: 'PUT',
    body: { cats, prods, combos, giftboxes, banners, settings, theme, pid, cid, gid, bid },
  })
    .then((j) => {
      j.catalog.prods.forEach((q) => {
        const p = D.prods.find((x) => x.id == q.id);
        p &&
          p.v.forEach((v) => {
            const w = q.v.find((x) => x.w == v.w || w2g(x.w) == w2g(v.w));
            if (w) v.s = w.s;
          });
      });
    })
    .catch((e) => {
      const signIn = /sign in/i.test(e.message);
      toast('NOT SAVED – ' + e.message + (signIn ? '. Please sign in again and repeat your change.' : ''), 7000);
      if (signIn) {
        adm = false;
        render();
      }
      throw e; // callers must not show "saved" when it was not
    });
}
