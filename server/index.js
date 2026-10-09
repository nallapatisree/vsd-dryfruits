/**
 * VSD backend – zero-dependency Node server (Node >= 22.5).
 * Serves the website files and the JSON API. Data lives in a SQLite file inside DATA_DIR.
 * Prices and stock are ALWAYS decided here – the browser is never trusted.
 * Moving to PostgreSQL later only means replacing the small data layer below (see docs/BACKEND_PLAN.md).
 */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.join(__dirname, '..');
const DATA = process.env.DATA_DIR || path.join(ROOT, 'data');
const PORT = +process.env.PORT || 3000;
const ST = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
const PAY = ['Pending', 'Paid', 'Failed', 'Refunded', 'COD'];
const THEMES = ['green', 'maroon', 'blue', 'brown'];

fs.mkdirSync(path.join(DATA, 'uploads'), { recursive: true });
const db = new DatabaseSync(path.join(DATA, 'vsd.db'));
db.exec(`CREATE TABLE IF NOT EXISTS doc(k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS orders(no TEXT PRIMARY KEY, created TEXT NOT NULL, phone TEXT NOT NULL, j TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ix_orders_created ON orders(created);`);

class HttpError extends Error { constructor(m, http = 400) { super(m); this.http = http; } }
const E = (m, c) => new HttpError(m, c);

/* ---------- data layer ---------- */
const putC = c => db.prepare('INSERT INTO doc(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').run('catalog', JSON.stringify(c));
function getC() {
  const r = db.prepare('SELECT v FROM doc WHERE k=?').get('catalog');
  if (r) return JSON.parse(r.v);
  const c = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed.json'), 'utf8')); putC(c); return c;
}
const tx = fn => { db.exec('BEGIN IMMEDIATE'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };
const getOrder = no => { const r = db.prepare('SELECT j FROM orders WHERE no=?').get(no); return r && JSON.parse(r.j); };
const saveOrder = o => db.prepare('INSERT INTO orders(no,created,phone,j) VALUES(?,?,?,?) ON CONFLICT(no) DO UPDATE SET j=excluded.j').run(o.no, o.d, o.phone, JSON.stringify(o));
/** Customers only get a capped stock number; the real quantity is admin-only. */
const publicCatalog = c => { const { log, ...r } = JSON.parse(JSON.stringify(c)); r.prods.forEach(p => p.v.forEach(v => { v.s = Math.min(v.s, 50); })); return r; };
const clean = (s, n = 200) => String(s ?? '').replace(/[<>"'`]/g, '').trim().slice(0, n);

/* ---------- orders ---------- */
/** Resolve one cart line to its real name, price and the stock rows it consumes. */
function lineOf(c, x, activeOnly) {
  const q = Number(x.q);
  if (!Number.isInteger(q) || q < 1 || q > 500) throw E('Invalid quantity');
  if (x.t === 'p') {
    const p = c.prods.find(p => p.id == x.id), v = p && p.v[x.vi];
    if (!v || (activeOnly && !p.on)) throw E('A product in your cart is no longer available');
    return { n: p.n + ' ' + v.w, c: p.c, price: v.p, q, use: [[v, q]] };
  }
  if (x.t === 'c') {
    const b = c.combos.find(b => b.id == x.id);
    if (!b || (activeOnly && !b.on)) throw E('A combo in your cart is no longer available');
    return { n: b.n, c: 'Combos', price: b.p, q, use: b.items.map(([pid, vi, k]) => [c.prods.find(p => p.id == pid).v[vi], k * q]) };
  }
  throw E('Invalid item');
}
function createOrder(b) {
  const name = clean(b.name, 80), phone = String(b.phone || '').trim(), pin = String(b.pin || '').trim();
  if (name.length < 2 || !/^[6-9]\d{9}$/.test(phone) || !/^\d{6}$/.test(pin) || clean(b.address).length < 5 || !clean(b.city))
    throw E('Please check name, phone, address, city and 6-digit PIN');
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50) throw E('Your cart is empty');
  return tx(() => {
    const c = getC(), now = new Date().toISOString(), no = `VSD-${now.slice(0, 4)}-${String(c.seq++).padStart(6, '0')}`;
    const items = []; let sub = 0;
    for (const x of b.items) {
      const l = lineOf(c, x, true);
      l.use.forEach(([v, k]) => { v.s -= k; if (v.s < 0) throw E('Sorry, some items just went out of stock', 409); });
      items.push({ t: x.t, id: x.id, vi: x.vi || 0, q: l.q, n: l.n, c: l.c, price: l.price });
      sub += l.price * l.q; c.log.unshift([now, `-${l.q} ${l.n} · Order ${no}`]);
    }
    const ship = sub >= c.settings.free ? 0 : c.settings.ship;
    const o = { no, d: now, cust: name, phone, email: clean(b.email, 100),
      addr: `${clean(b.address)}, ${clean(b.city, 60)}, ${clean(b.state || 'Andhra Pradesh', 40)} - ${pin}`,
      items, sub, disc: 0, ship, tot: sub + ship, pm: 'WhatsApp', pay: 'Pending', st: 'Pending', track: '' };
    c.log = c.log.slice(0, 300); saveOrder(o); putC(c); return o;
  });
}
function patchOrder(no, b) {
  return tx(() => {
    const o = getOrder(no); if (!o) throw E('Order not found', 404);
    if (b.st !== undefined) {
      if (!ST.includes(b.st)) throw E('Invalid status');
      if (o.st === 'Cancelled' && b.st !== 'Cancelled') throw E('Cancelled orders cannot be reopened');
      if (b.st === 'Cancelled' && o.st !== 'Cancelled') {            // give the stock back
        const c = getC(), now = new Date().toISOString();
        o.items.forEach(x => { try { lineOf(c, x, false).use.forEach(([v, k]) => { v.s += k; }); } catch { /* product deleted */ } });
        c.log.unshift([now, `+ Restored stock · Cancelled ${no}`]); putC(c);
      }
      o.st = b.st;
    }
    if (b.pay !== undefined) { if (!PAY.includes(b.pay)) throw E('Invalid payment status'); o.pay = b.pay; }
    if (b.track !== undefined) { if (!/^[A-Za-z0-9]{0,30}$/.test(b.track)) throw E('Tracking number: letters and digits only'); o.track = b.track; }
    saveOrder(o); return o;
  });
}

/* ---------- admin catalogue ---------- */
function putCatalog(b) {
  return tx(() => {
    const c = getC();
    for (const k of ['cats', 'prods', 'combos', 'banners']) if (!Array.isArray(b[k])) throw E('Invalid data');
    b.prods.forEach(p => {                       // stock of existing sizes is owned by the server (orders change it)
      const old = c.prods.find(o => o.id == p.id);
      p.v = (Array.isArray(p.v) ? p.v : []).map(v => { const ov = old && old.v.find(x => x.w == v.w);
        return { w: String(v.w), mrp: +v.mrp || 0, p: +v.p || 0, low: +v.low || 0, s: ov ? ov.s : Math.max(0, Math.floor(+v.s || 0)) }; });
    });
    const s = b.settings || {};
    c.settings = { ship: Math.max(0, +s.ship || 0), free: Math.max(0, +s.free || 0), wa: String(s.wa || c.settings.wa).replace(/\D/g, ''), ticker: String(s.ticker || c.settings.ticker).slice(0, 600) };
    Object.assign(c, { cats: b.cats, prods: b.prods, combos: b.combos, banners: b.banners, theme: THEMES.includes(b.theme) ? b.theme : c.theme });
    ['pid', 'cid', 'bid'].forEach(k => { c[k] = Math.max(c[k] || 0, +b[k] || 0); });
    putC(c); return c;
  });
}
function setStock(b) {
  return tx(() => {
    const c = getC(), p = c.prods.find(p => p.id == b.id), v = p && p.v[b.vi], s = Math.floor(+b.s);
    if (!v || !(s >= 0)) throw E('Invalid stock update');
    c.log.unshift([new Date().toISOString(), `${s - v.s >= 0 ? '+' : ''}${s - v.s} ${p.n} ${v.w} · Manual update (admin)`]); v.s = s; putC(c);
  });
}
function upload(b) {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.d || ''));
  if (!m) throw E('Please upload a JPG, PNG or WebP image');
  const buf = Buffer.from(m[2], 'base64'), sig = { jpeg: 'ffd8ff', png: '89504e47', webp: '52494646' }[m[1]];
  if (buf.length > 4e6 || buf.subarray(0, 4).toString('hex').indexOf(sig) !== 0) throw E('Invalid image file');
  const name = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 20) + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]);
  fs.writeFileSync(path.join(DATA, 'uploads', name), buf); return { url: '/uploads/' + name };
}

/* ---------- auth (single admin from environment variables) ---------- */
const ADMIN_USER = process.env.ADMIN_USER || 'admin', ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
if (!process.env.ADMIN_PASSWORD) console.warn('⚠  Using the default admin password. Set ADMIN_PASSWORD before going live!');
const salt = crypto.randomBytes(16), hash = p => crypto.scryptSync(String(p), salt, 32), PW = hash(ADMIN_PASSWORD);
const SES = new Map(), HITS = new Map(), SESSION_MS = 8 * 3600e3;
const limited = (k, max, ms) => { const n = Date.now(), a = (HITS.get(k) || []).filter(t => t > n - ms); a.push(n); HITS.set(k, a); return a.length > max; };
const ipOf = r => (process.env.TRUST_PROXY && String(r.headers['x-forwarded-for'] || '').split(',')[0].trim()) || r.socket.remoteAddress;
const sessionOf = r => { const m = /(?:^|; )vsd_sid=([a-f0-9]{48})/.exec(r.headers.cookie || ''), exp = m && SES.get(m[1]); return exp && exp > Date.now() ? m[1] : null; };
const cookie = (res, v, age) => res.setHeader('Set-Cookie', `vsd_sid=${v}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

/* ---------- http ---------- */
const readBody = (req, max) => new Promise((ok, no) => {
  let n = 0; const ch = [];
  req.on('data', d => { n += d.length; if (n > max) { no(E('Request too large', 413)); req.destroy(); } else ch.push(d); });
  req.on('end', () => { try { ok(ch.length ? JSON.parse(Buffer.concat(ch)) : {}); } catch { no(E('Invalid JSON')); } });
});
async function handleApi(req, res, u) {
  const m = req.method, p = u.pathname;
  if (m === 'GET' && p === '/api/catalog') return publicCatalog(getC());
  if (m === 'GET' && p === '/api/track') {
    const o = getOrder(u.searchParams.get('no') || ''); if (!o || o.phone !== u.searchParams.get('phone')) throw E('Order not found', 404);
    return { order: o };
  }
  if (m !== 'GET') {
    if (!/application\/json/.test(req.headers['content-type'] || '')) throw E('Unsupported content type', 415);
    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) throw E('Bad origin', 403);
  }
  const b = m === 'GET' ? {} : await readBody(req, p === '/api/admin/upload' ? 6e6 : 2e6);
  if (m === 'POST' && p === '/api/orders') { if (limited('o' + ipOf(req), 20, 3600e3)) throw E('Too many orders, try later', 429); return { order: createOrder(b) }; }
  if (m === 'POST' && p === '/api/admin/login') {
    if (limited('l' + ipOf(req), 10, 900e3)) throw E('Too many attempts. Try again in 15 minutes.', 429);
    const ok = String(b.user) === ADMIN_USER && crypto.timingSafeEqual(hash(b.password || ''), PW);
    if (!ok) throw E('Invalid credentials', 401);
    const id = crypto.randomBytes(24).toString('hex'); SES.set(id, Date.now() + SESSION_MS); cookie(res, id, SESSION_MS / 1000); return { ok: true };
  }
  if (!p.startsWith('/api/admin/')) throw E('Not found', 404);
  const sid = sessionOf(req);
  if (p === '/api/admin/logout') { SES.delete(sid); cookie(res, '', 0); return { ok: true }; }
  if (!sid) throw E('Please sign in', 401);
  if (m === 'GET' && p === '/api/admin/me') return { ok: true };
  if (m === 'GET' && p === '/api/admin/data')
    return { catalog: getC(), orders: db.prepare('SELECT j FROM orders ORDER BY created').all().map(r => JSON.parse(r.j)) };
  if (m === 'PUT' && p === '/api/admin/catalog') return { catalog: putCatalog(b) };
  if (m === 'POST' && p === '/api/admin/stock') { setStock(b); return { ok: true }; }
  if (m === 'POST' && p === '/api/admin/upload') return upload(b);
  const om = /^\/api\/admin\/orders\/([^/]+)$/.exec(p);
  if (m === 'PATCH' && om) return { order: patchOrder(decodeURIComponent(om[1]), b) };
  throw E('Not found', 404);
}
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function serveStatic(res, rel) {   // only index.html, css/, js/, assets/ (project) and uploads/ (data dir) are public
  if (rel === '/') rel = '/index.html';
  const up = rel.startsWith('/uploads/');
  if (!up && !/^\/(index\.html|css\/|js\/|assets\/)/.test(rel)) return false;
  const base = up ? DATA : ROOT, file = path.normalize(path.join(base, rel));
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': up || rel.startsWith('/assets') ? 'public, max-age=86400' : 'no-cache' });
  fs.createReadStream(file).pipe(res); return true;
}
const send = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Referrer-Policy', 'same-origin');
  try {
    const u = new URL(req.url, 'http://localhost');
    if (u.pathname.startsWith('/api/')) return send(res, 200, await handleApi(req, res, u));
    if (req.method === 'GET' && serveStatic(res, decodeURIComponent(u.pathname))) return;
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    if (!e.http) console.error(e);
    send(res, e.http || 500, { error: e.http ? e.message : 'Server error' });
  }
}).listen(PORT, () => console.log(`VSD server running on http://localhost:${PORT}`));
