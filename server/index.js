/**
 * VSD backend – zero-dependency Node server (Node >= 22.5).
 * Serves the website files and the JSON API. Data lives in a SQLite file inside DATA_DIR.
 * Prices and stock are ALWAYS decided here – the browser is never trusted.
 * Moving to PostgreSQL later only means replacing the small data layer below (see docs/BACKEND_PLAN.md).
 */
'use strict';
const http = require('http'),
  fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

/* Optional .env file in the project folder (KEY=value per line). Real environment variables win. */
try {
  for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(l);
    if (m && !l.trim().startsWith('#') && !process.env[m[1]])
      process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
  }
} catch {
  /* no .env file – fine */
}

const ROOT = path.join(__dirname, '..');
const DATA =
  process.env.DATA_DIR ||
  (process.env.VERCEL ? path.join('/tmp', 'data') : path.join(ROOT, 'data'));
const PORT = +process.env.PORT || 3000;
const ST = [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];
const PAY = ['Pending', 'Paid', 'Failed', 'Refunded', 'COD'];
const THEMES = ['green', 'maroon', 'blue', 'brown'];

fs.mkdirSync(path.join(DATA, 'uploads'), { recursive: true });
const db = new DatabaseSync(path.join(DATA, 'vsd.db'));
db.exec(`CREATE TABLE IF NOT EXISTS doc(k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS orders(no TEXT PRIMARY KEY, created TEXT NOT NULL, phone TEXT NOT NULL, j TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ix_orders_created ON orders(created);
CREATE INDEX IF NOT EXISTS ix_orders_phone ON orders(phone);
CREATE TABLE IF NOT EXISTS orders_archive(no TEXT PRIMARY KEY, created TEXT NOT NULL, phone TEXT NOT NULL, j TEXT NOT NULL, archived_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ix_orders_archive_created ON orders_archive(created);`);

class HttpError extends Error {
  constructor(m, http = 400) {
    super(m);
    this.http = http;
  }
}
const E = (m, c) => new HttpError(m, c);
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

const CI_DEFAULTS = {
  'Dry Fruits': 'assets/images/k_dry.jpg',
  Nuts: 'assets/images/k_nuts.jpg',
  Seeds: 'assets/images/k_seeds.jpg',
  Dates: 'assets/images/k_dates.jpg',
  'Gift Box': 'assets/images/k_gift.jpg',
  Combos: 'assets/images/k_combo.jpg',
};

function normCat(cat, idx) {
  if (Array.isArray(cat)) {
    const name = String(cat[0] || '').trim();
    const emoji = String(cat[1] || '📦');
    return {
      id: idx + 1,
      name,
      desc: '',
      img: CI_DEFAULTS[name] || '',
      emoji,
      on: 1,
      0: name,
      1: emoji,
    };
  }
  const name = String(cat.name || cat.n || cat[0] || '').trim();
  const emoji = String(cat.emoji || cat.e || cat[1] || '📦');
  return {
    id: +cat.id || idx + 1,
    name,
    desc: String(cat.desc || '').trim(),
    img: String(cat.img || CI_DEFAULTS[name] || ''),
    emoji,
    on: cat.on !== undefined && cat.on !== null ? (cat.on ? 1 : 0) : 1,
    0: name,
    1: emoji,
  };
}

/* ---------- data layer ---------- */
const putC = (c) =>
  db
    .prepare('INSERT INTO doc(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v')
    .run('catalog', JSON.stringify(c));
function getC() {
  const r = db.prepare('SELECT v FROM doc WHERE k=?').get('catalog');
  if (r) {
    const c = JSON.parse(r.v);
    let dirty = false;
    if (Array.isArray(c.cats)) {
      c.cats = c.cats.map((cat, idx) => normCat(cat, idx));
      if (!c.cats.some((cat) => (cat.name || cat[0]) === 'Gift Box')) {
        c.cats.push(normCat(['Gift Box', '🎁'], c.cats.length));
        dirty = true;
      }
    }
    if (!Array.isArray(c.giftboxes)) {
      c.giftboxes = [
        {
          id: 1,
          n: 'Royal Dry Fruit Gift Box',
          desc: 'Luxurious assortment of hand-picked California Almonds, Cashews, Salted Pistachios, and Afghan Figs in a festive decorative box.',
          p: 999,
          img: 'assets/images/k_gift.jpg',
          on: 1,
        },
        {
          id: 2,
          n: 'Festive Celebration Gift Box',
          desc: 'Premium festive gift hamper containing Medjool Dates, Walnut kernels, Kismis, and Dry Fruit Chikki.',
          p: 699,
          img: 'assets/images/k_gift.jpg',
          on: 1,
        },
      ];
      c.gid = 3;
      dirty = true;
    }
    if (c.prods && c.prods.some((p) => p.c === 'Gift Box')) {
      c.prods = c.prods.filter((p) => p.c !== 'Gift Box');
      dirty = true;
    }
    if (!c.sm) {
      c.prods.forEach((p) => {
        if (p.id < 500 && p.sample === undefined) p.sample = 1;
      });
      c.combos.forEach((x) => {
        if (x.id < 200 && x.sample === undefined) x.sample = 1;
      });
      c.sm = 1;
      dirty = true;
    } // mark the starter items as sample data
    if (dirty) putC(c);
    return c;
  }
  const c = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed.json'), 'utf8'));
  if (Array.isArray(c.cats)) {
    c.cats = c.cats.map((cat, idx) => normCat(cat, idx));
  }
  putC(c);
  return c;
}
const tx = (fn) => {
  db.exec('BEGIN IMMEDIATE');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
};
const getOrder = (no) => {
  const r = db.prepare('SELECT j FROM orders WHERE no=?').get(no);
  return r && JSON.parse(r.j);
};
const saveOrder = (o) =>
  db
    .prepare(
      'INSERT INTO orders(no,created,phone,j) VALUES(?,?,?,?) ON CONFLICT(no) DO UPDATE SET j=excluded.j',
    )
    .run(o.no, o.d, o.phone, JSON.stringify(o));
/** Customers only get a capped stock number; the real quantity is admin-only. */
const publicCatalog = (c) => {
  const { log, ...r } = JSON.parse(JSON.stringify(c));
  r.prods.forEach((p) =>
    p.v.forEach((v) => {
      v.s = Math.min(v.s, 50);
    }),
  );
  r.giftboxes = (c.giftboxes || []).filter((g) => g.on);
  if (Array.isArray(r.cats)) {
    r.cats = r.cats.filter((cat) => (cat.on !== undefined ? cat.on : 1));
  }
  return r;
};
const clean = (s, n = 200) =>
  String(s ?? '')
    .replace(/[<>"'`]/g, '')
    .trim()
    .slice(0, n);

/* ---------- orders ---------- */
/** Resolve one cart line to its real name, price and the stock rows it consumes. */
function lineOf(c, x, activeOnly) {
  const q = Number(x.q);
  if (!Number.isInteger(q) || q < 1 || q > 500) throw E('Invalid quantity');
  if (x.t === 'p') {
    const p = c.prods.find((p) => p.id == x.id),
      v = p && p.v[x.vi];
    if (!v || (activeOnly && !p.on)) throw E('A product in your cart is no longer available');
    return { n: p.n + ' ' + v.w, c: p.c, price: v.p, q, use: [[v, q]] };
  }
  if (x.t === 'c') {
    const b = c.combos.find((b) => b.id == x.id);
    if (!b || (activeOnly && !b.on)) throw E('A combo in your cart is no longer available');
    return {
      n: b.n,
      c: 'Combos',
      price: b.p,
      q,
      use: b.items.map(([pid, vi, k]) => {
        const prod = c.prods.find((p) => p.id == pid),
          vr = prod && prod.v[vi];
        if (!vr) throw E('An item inside a combo is no longer available');
        return [vr, k * q];
      }),
    };
  }
  if (x.t === 'g') {
    const gb = (c.giftboxes || []).find((g) => g.id == x.id);
    if (!gb || (activeOnly && !gb.on)) throw E('A gift box in your cart is no longer available');
    return {
      n: gb.n,
      c: 'Gift Box',
      price: gb.p,
      q,
      use: [],
    };
  }
  throw E('Invalid item');
}
function createOrder(b) {
  const name = clean(b.name, 80),
    phone = String(b.phone || '').trim(),
    pin = String(b.pin || '').trim();
  if (
    name.length < 2 ||
    !/^[6-9]\d{9}$/.test(phone) ||
    !/^\d{6}$/.test(pin) ||
    clean(b.address).length < 5 ||
    !clean(b.city)
  )
    throw E('Please check name, phone, address, city and 6-digit PIN');
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50)
    throw E('Your cart is empty');
  return tx(() => {
    const c = getC(),
      now = new Date().toISOString(),
      no = `VSD-${now.slice(0, 4)}-${String(c.seq++).padStart(6, '0')}`;
    const items = [];
    let sub = 0;
    for (const x of b.items) {
      const l = lineOf(c, x, true);
      l.use.forEach(([v, k]) => {
        v.s -= k;
        if (v.s < 0) throw E('Sorry, some items just went out of stock', 409);
      });
      items.push({ t: x.t, id: x.id, vi: x.vi || 0, q: l.q, n: l.n, c: l.c, price: l.price });
      sub += l.price * l.q;
      c.log.unshift([now, `-${l.q} ${l.n} · Order ${no}`]);
    }
    const ship = sub >= c.settings.free ? 0 : c.settings.ship;
    const o = {
      no,
      d: now,
      cust: name,
      phone,
      email: clean(b.email, 100),
      addr: `${clean(b.address)}, ${clean(b.city, 60)}, ${clean(b.state || 'Andhra Pradesh', 40)} - ${pin}`,
      items,
      sub,
      disc: 0,
      ship,
      tot: sub + ship,
      pm: 'WhatsApp',
      pay: 'Pending',
      st: 'Pending',
      track: '',
    };
    c.log = c.log.slice(0, 300);
    saveOrder(o);
    putC(c);
    return o;
  });
}
function normPhone(p) {
  if (!p) return '';
  let s = String(p).replace(/\D+/g, '');
  if (s.length === 12 && s.startsWith('91')) s = s.slice(2);
  else if (s.length === 11 && s.startsWith('0')) s = s.slice(1);
  return s;
}

function patchOrder(no, b) {
  return tx(() => {
    const o = getOrder(no);
    if (!o) throw E('Order not found', 404);
    if (b.st !== undefined) {
      if (!ST.includes(b.st)) throw E('Invalid status');
      if (o.st === 'Cancelled' && b.st !== 'Cancelled') {
        // Reopen cancelled order: check stock availability before proceeding
        const c = getC(),
          now = new Date().toISOString();
        const needed = [];
        for (const x of o.items) {
          try {
            const l = lineOf(c, x, false);
            for (const [v, k] of l.use) {
              needed.push([v, k]);
            }
          } catch (err) {
            throw E(
              `Cannot reopen order: item in this order is no longer available (${err.message})`,
              409,
            );
          }
        }
        // Verify inventory availability across all items
        const totalUsed = new Map();
        for (const [v, k] of needed) {
          totalUsed.set(v, (totalUsed.get(v) || 0) + k);
        }
        for (const [v, req] of totalUsed.entries()) {
          if (v.s < req) {
            throw E(
              `Cannot reopen order: insufficient stock (available: ${v.s}, required: ${req})`,
              409,
            );
          }
        }
        // Deduct stock upon reopening
        for (const [v, k] of needed) {
          v.s -= k;
        }
        c.log.unshift([now, `- Reserved stock · Reopened ${no} as ${b.st}`]);
        putC(c);
      } else if (b.st === 'Cancelled' && o.st !== 'Cancelled') {
        // give the stock back
        const c = getC(),
          now = new Date().toISOString();
        o.items.forEach((x) => {
          try {
            lineOf(c, x, false).use.forEach(([v, k]) => {
              v.s += k;
            });
          } catch {
            /* product deleted */
          }
        });
        c.log.unshift([now, `+ Restored stock · Cancelled ${no}`]);
        putC(c);
      }
      o.st = b.st;
    }
    if (b.pay !== undefined) {
      if (!PAY.includes(b.pay)) throw E('Invalid payment status');
      o.pay = b.pay;
    }
    if (b.track !== undefined) {
      if (!/^[A-Za-z0-9]{0,30}$/.test(b.track)) throw E('Tracking number: letters and digits only');
      o.track = b.track;
    }
    saveOrder(o);
    return o;
  });
}

function clearOrderHistory() {
  return tx(() => {
    const now = new Date().toISOString();
    const rows = db.prepare('SELECT no, created, phone, j FROM orders').all();
    const toArchive = rows.filter((r) => {
      try {
        const o = JSON.parse(r.j);
        return o.st === 'Delivered' || o.st === 'Cancelled';
      } catch {
        return false;
      }
    });

    if (!toArchive.length) {
      return {
        clearedCount: 0,
        message: 'No eligible historical orders (Delivered or Cancelled) to clear.',
      };
    }

    const ins = db.prepare(
      'INSERT INTO orders_archive(no, created, phone, j, archived_at) VALUES(?,?,?,?,?) ON CONFLICT(no) DO UPDATE SET j=excluded.j, archived_at=excluded.archived_at',
    );
    const del = db.prepare('DELETE FROM orders WHERE no=?');

    for (const r of toArchive) {
      ins.run(r.no, r.created, r.phone, r.j, now);
      del.run(r.no);
    }

    const c = getC();
    c.log.unshift([now, `Cleared and archived ${toArchive.length} historical order(s)`]);
    putC(c);

    return {
      clearedCount: toArchive.length,
      message: `Successfully cleared and archived ${toArchive.length} historical order(s). Active orders and catalog remain intact.`,
    };
  });
}

/* ---------- category management ---------- */
function addCategory(b) {
  return tx(() => {
    const c = getC();
    const name = clean(b.name || b.n, 60);
    if (!name || name.length < 2) throw E('Category name must be at least 2 characters');
    if (c.cats.some((x) => (x.name || x[0]).toLowerCase() === name.toLowerCase())) {
      throw E(`Category "${name}" already exists`);
    }
    const maxId = Math.max(0, ...c.cats.map((x) => +x.id || 0));
    const newCat = {
      id: maxId + 1,
      name,
      desc: clean(b.desc, 500),
      img: String(b.img || CI_DEFAULTS[name] || '').trim(),
      emoji: clean(b.emoji || b.e || '📦', 10),
      on: b.on !== undefined ? (b.on ? 1 : 0) : 1,
      0: name,
      1: clean(b.emoji || b.e || '📦', 10),
    };
    c.cats.push(newCat);
    putC(c);
    return { category: newCat, cats: c.cats };
  });
}

function updateCategory(id, b) {
  return tx(() => {
    const c = getC();
    const cat = c.cats.find((x) => x.id == id);
    if (!cat) throw E('Category not found', 404);
    const oldName = cat.name || cat[0];
    const name = b.name !== undefined ? clean(b.name, 60) : oldName;
    if (!name || name.length < 2) throw E('Category name must be at least 2 characters');
    if (c.cats.some((x) => x.id != id && (x.name || x[0]).toLowerCase() === name.toLowerCase())) {
      throw E(`Category "${name}" already exists`);
    }
    cat.name = name;
    cat[0] = name;
    if (b.desc !== undefined) cat.desc = clean(b.desc, 500);
    if (b.img !== undefined) cat.img = String(b.img || '').trim();
    if (b.emoji !== undefined) {
      cat.emoji = clean(b.emoji, 10);
      cat[1] = cat.emoji;
    }
    if (b.on !== undefined) cat.on = b.on ? 1 : 0;

    // If category name was renamed, keep linked products linked
    if (oldName !== name && Array.isArray(c.prods)) {
      c.prods.forEach((p) => {
        if (p.c === oldName) p.c = name;
      });
    }
    putC(c);
    return { category: cat, cats: c.cats };
  });
}

function deleteCategory(id) {
  return tx(() => {
    const c = getC();
    const idx = c.cats.findIndex((x) => x.id == id);
    if (idx === -1) throw E('Category not found', 404);
    const oldName = c.cats[idx].name || c.cats[idx][0];
    c.cats.splice(idx, 1);
    // Safe deletion: protect associated products and orders by keeping products intact
    if (Array.isArray(c.prods)) {
      c.prods.forEach((p) => {
        if (p.c === oldName) p.c = 'General';
      });
    }
    putC(c);
    return { ok: true, cats: c.cats };
  });
}

function toggleCategory(id) {
  return tx(() => {
    const c = getC();
    const cat = c.cats.find((x) => x.id == id);
    if (!cat) throw E('Category not found', 404);
    cat.on = cat.on ? 0 : 1;
    putC(c);
    return { category: cat, cats: c.cats };
  });
}

/* ---------- admin catalogue ---------- */
function putCatalog(b) {
  return tx(() => {
    const c = getC();
    for (const k of ['cats', 'prods', 'combos', 'banners'])
      if (!Array.isArray(b[k])) throw E('Invalid data');
    if (b.cats !== undefined) {
      const seen = new Set();
      c.cats = b.cats.map((cat, idx) => {
        const name = clean(Array.isArray(cat) ? cat[0] : cat.name || cat.n || cat[0] || '', 60);
        if (!name) throw E('Category name cannot be empty');
        const lower = name.toLowerCase();
        if (seen.has(lower)) throw E(`Duplicate category name: "${name}"`);
        seen.add(lower);
        const desc = clean(Array.isArray(cat) ? '' : cat.desc || '', 500);
        const img = String(Array.isArray(cat) ? CI_DEFAULTS[name] || '' : cat.img || '').trim();
        const emoji = clean(Array.isArray(cat) ? cat[1] : cat.emoji || cat.e || cat[1] || '📦', 10);
        const on = Array.isArray(cat) ? 1 : cat.on !== undefined ? (cat.on ? 1 : 0) : 1;
        const id = Array.isArray(cat) ? idx + 1 : +cat.id || idx + 1;
        return { id, name, desc, img, emoji, on, 0: name, 1: emoji };
      });
    }
    if (b.giftboxes !== undefined && !Array.isArray(b.giftboxes)) throw E('Invalid giftboxes data');
    if (Array.isArray(b.giftboxes)) {
      b.giftboxes.forEach((g) => {
        if (!g.n || typeof g.n !== 'string' || !g.n.trim()) throw E('Gift box name is required');
        if (!g.desc || typeof g.desc !== 'string' || !g.desc.trim())
          throw E('Gift box description is required');
        if (typeof g.p !== 'number' || g.p <= 0 || isNaN(g.p))
          throw E('Gift box price must be greater than zero');
      });
      c.giftboxes = b.giftboxes.map((g) => ({
        id: +g.id,
        n: clean(g.n, 120),
        desc: clean(g.desc, 1000),
        p: Math.round(+g.p),
        img: String(g.img || 'assets/images/k_gift.jpg'),
        on: g.on ? 1 : 0,
      }));
      c.gid = Math.max(c.gid || 1, +b.gid || 1);
    }
    b.prods.forEach((p) => {
      // stock of existing sizes is owned by the server (orders change it)
      const old = c.prods.find((o) => o.id == p.id);
      p.v = (Array.isArray(p.v) ? p.v : []).map((v) => {
        const ov = old && old.v.find((x) => x.w == v.w || w2g(x.w) == w2g(v.w));
        return {
          w: String(v.w),
          mrp: +v.mrp || 0,
          p: +v.p || 0,
          low: +v.low || 0,
          s: ov ? ov.s : Math.max(0, Math.floor(+v.s || 0)),
        };
      });
    });
    const s = b.settings || {};
    c.settings = {
      ship: Math.max(0, +s.ship || 0),
      free: Math.max(0, +s.free || 0),
      wa: String(s.wa || c.settings.wa).replace(/\D/g, ''),
      ticker: String(s.ticker || c.settings.ticker).slice(0, 600),
    };
    Object.assign(c, {
      prods: b.prods,
      combos: b.combos,
      banners: b.banners,
      theme: THEMES.includes(b.theme) ? b.theme : c.theme,
    });
    ['pid', 'cid', 'gid', 'bid'].forEach((k) => {
      c[k] = Math.max(c[k] || 0, +b[k] || 0);
    });
    putC(c);
    return c;
  });
}
function setStock(b) {
  return tx(() => {
    const c = getC(),
      p = c.prods.find((p) => p.id == b.id),
      v = p && p.v[b.vi],
      s = Math.floor(+b.s);
    if (!v || !(s >= 0)) throw E('Invalid stock update');
    c.log.unshift([
      new Date().toISOString(),
      `${s - v.s >= 0 ? '+' : ''}${s - v.s} ${p.n} ${v.w} · Manual update (admin)`,
    ]);
    v.s = s;
    putC(c);
  });
}
function upload(b) {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.d || ''));
  if (!m) throw E('Please upload a JPG, PNG or WebP image');
  const buf = Buffer.from(m[2], 'base64'),
    sig = { jpeg: 'ffd8ff', png: '89504e47', webp: '52494646' }[m[1]];
  if (buf.length > 4e6 || buf.subarray(0, 4).toString('hex').indexOf(sig) !== 0)
    throw E('Invalid image file');
  const name =
    crypto.createHash('sha1').update(buf).digest('hex').slice(0, 20) +
    '.' +
    (m[1] === 'jpeg' ? 'jpg' : m[1]);
  fs.writeFileSync(path.join(DATA, 'uploads', name), buf);
  return { url: '/uploads/' + name };
}

/* ---------- auth (single admin from environment variables) ---------- */
// Values are trimmed: Windows `set X=pw && npm start` silently adds a trailing space to the password.
const ADMIN_USER = (process.env.ADMIN_USER || '').trim() || 'admin',
  ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim() || 'admin123';
const DEFAULT_PW = !(process.env.ADMIN_PASSWORD || '').trim();
console.log(
  `Admin sign-in -> username "${ADMIN_USER}" (not case-sensitive), password ${DEFAULT_PW ? 'is the DEFAULT "admin123" – set ADMIN_PASSWORD before going live!' : `loaded from ADMIN_PASSWORD (${ADMIN_PASSWORD.length} characters)`}`,
);
const salt = crypto
    .createHash('sha256')
    .update(ADMIN_PASSWORD + '_vsd_salt')
    .digest()
    .subarray(0, 16),
  hash = (p) => crypto.scryptSync(String(p), salt, 32),
  PW = hash(ADMIN_PASSWORD);
const SES = new Map(),
  HITS = new Map(),
  SESSION_MS = 8 * 3600e3;
const makeSid = () => {
  const rnd = crypto.randomBytes(16).toString('hex');
  const sig = crypto.createHmac('sha256', PW).update(rnd).digest('hex').slice(0, 16);
  return rnd + sig;
};
const checkSid = (val) => {
  if (!val || val.length !== 48) return null;
  const rnd = val.slice(0, 32);
  const sig = val.slice(32);
  const expected = crypto.createHmac('sha256', PW).update(rnd).digest('hex').slice(0, 16);
  return sig === expected ? val : null;
};
const limited = (k, max, ms) => {
  const n = Date.now(),
    a = (HITS.get(k) || []).filter((t) => t > n - ms);
  a.push(n);
  HITS.set(k, a);
  return a.length > max;
};
const ipOf = (r) =>
  (process.env.TRUST_PROXY &&
    String(r.headers['x-forwarded-for'] || '')
      .split(',')[0]
      .trim()) ||
  r.socket.remoteAddress;
const sessionOf = (r) => {
  const m = /(?:^|; )vsd_sid=([a-f0-9]{48})/.exec(r.headers.cookie || '');
  if (!m) return null;
  const sid = m[1];
  const exp = SES.get(sid);
  if (exp && exp > Date.now()) return sid;
  if (checkSid(sid)) return sid;
  return null;
};
const cookie = (res, v, age) =>
  res.setHeader(
    'Set-Cookie',
    `vsd_sid=${v}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  );

/* ---------- http ---------- */
const readBody = (req, max) => {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return Promise.resolve(req.body);
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve({});
    }
  }
  return new Promise((ok, no) => {
    let n = 0;
    const ch = [];
    req.on('data', (d) => {
      n += d.length;
      if (n > max) {
        no(E('Request too large', 413));
        req.destroy();
      } else ch.push(d);
    });
    req.on('end', () => {
      try {
        ok(ch.length ? JSON.parse(Buffer.concat(ch)) : {});
      } catch {
        no(E('Invalid JSON'));
      }
    });
  });
};
async function handleApi(req, res, u) {
  const m = req.method,
    p = u.pathname;
  if (m === 'GET' && p === '/api/catalog') return publicCatalog(getC());
  if (m === 'GET' && p === '/api/track') {
    const o = getOrder(u.searchParams.get('no') || '');
    if (!o || o.phone !== u.searchParams.get('phone')) throw E('Order not found', 404);
    return { order: o };
  }
  if (m === 'GET' && p === '/api/customer/orders') {
    if (limited('cs_' + ipOf(req), 40, 900e3))
      throw E('Too many search attempts. Please try again later.', 429);
    const phone = normPhone(u.searchParams.get('phone') || '');
    if (!/^[6-9]\d{9}$/.test(phone)) throw E('Please enter a valid 10-digit mobile number', 400);
    const rows = db.prepare('SELECT j FROM orders WHERE phone=? ORDER BY created DESC').all(phone);
    const orders = rows.map((r) => {
      const o = JSON.parse(r.j);
      return {
        no: o.no,
        d: o.d,
        st: o.st,
        pay: o.pay,
        tot: o.tot,
        items: (o.items || []).map((i) => ({
          n: i.n,
          q: i.q,
          price: i.price,
          c: i.c,
        })),
        track: o.track || '',
      };
    });
    return { orders };
  }
  if (m !== 'GET') {
    if (!/application\/json/.test(req.headers['content-type'] || ''))
      throw E('Unsupported content type', 415);
    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)
      throw E('Bad origin', 403);
  }
  const b = m === 'GET' ? {} : await readBody(req, p === '/api/admin/upload' ? 6e6 : 2e6);
  if (m === 'POST' && p === '/api/orders') {
    if (limited('o' + ipOf(req), 20, 3600e3)) throw E('Too many orders, try later', 429);
    return { order: createOrder(b) };
  }
  if (m === 'POST' && p === '/api/admin/login') {
    if (limited('l' + ipOf(req), 10, 900e3))
      throw E('Too many attempts. Try again in 15 minutes.', 429);
    const ok =
      String(b.user || '')
        .trim()
        .toLowerCase() === ADMIN_USER.toLowerCase() &&
      crypto.timingSafeEqual(hash(String(b.password || '').trim()), PW);
    if (!ok) throw E('Invalid credentials', 401);
    const id = makeSid();
    SES.set(id, Date.now() + SESSION_MS);
    cookie(res, id, SESSION_MS / 1000);
    return { ok: true };
  }
  if (!p.startsWith('/api/admin/')) throw E('Not found', 404);
  const sid = sessionOf(req);
  if (p === '/api/admin/logout') {
    SES.delete(sid);
    cookie(res, '', 0);
    return { ok: true };
  }
  if (!sid) throw E('Please sign in', 401);
  if (m === 'GET' && p === '/api/admin/me') return { ok: true };
  if (m === 'GET' && p === '/api/admin/data')
    return {
      catalog: getC(),
      orders: db
        .prepare('SELECT j FROM orders ORDER BY created')
        .all()
        .map((r) => JSON.parse(r.j)),
    };
  if (m === 'PUT' && p === '/api/admin/catalog') return { catalog: putCatalog(b) };
  if (m === 'POST' && p === '/api/admin/stock') {
    setStock(b);
    return { ok: true };
  }
  if (m === 'POST' && p === '/api/admin/upload') return upload(b);
  if (m === 'POST' && p === '/api/admin/orders/clear') return clearOrderHistory();
  if (m === 'POST' && p === '/api/admin/categories') return addCategory(b);
  const catMatch = /^\/api\/admin\/categories\/(\d+)(?:\/toggle)?$/.exec(p);
  if (catMatch) {
    const cid = +catMatch[1];
    if (m === 'PATCH' && p.endsWith('/toggle')) return toggleCategory(cid);
    if (m === 'PUT') return updateCategory(cid, b);
    if (m === 'DELETE') return deleteCategory(cid);
  }
  const om = /^\/api\/admin\/orders\/([^/]+)$/.exec(p);
  if (m === 'PATCH' && om) return { order: patchOrder(decodeURIComponent(om[1]), b) };
  throw E('Not found', 404);
}
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};
function serveStatic(res, rel) {
  // only index.html, css/, js/, assets/ (project) and uploads/ (data dir) are public
  if (rel === '/') rel = '/index.html';
  const up = rel.startsWith('/uploads/');
  if (!up && !/^\/(index\.html|css\/|js\/|assets\/)/.test(rel)) return false;
  const base = up ? DATA : ROOT,
    file = path.normalize(path.join(base, rel));
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile())
    return false;
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': up || rel.startsWith('/assets') ? 'public, max-age=86400' : 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
  return true;
}
const send = (res, code, o) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(o));
};
async function requestHandler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  try {
    const host = req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const u = new URL(req.url, `${proto}://${host}`);
    if (u.pathname.startsWith('/api/')) return send(res, 200, await handleApi(req, res, u));
    if (req.method === 'GET' && serveStatic(res, decodeURIComponent(u.pathname))) return;
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    if (!e.http) console.error(e);
    send(res, e.http || 500, { error: e.http ? e.message : 'Server error' });
  }
}

if (!process.env.VERCEL) {
  http
    .createServer(requestHandler)
    .listen(PORT, () => console.log(`VSD server running on http://localhost:${PORT}`));
}

module.exports = { requestHandler };
