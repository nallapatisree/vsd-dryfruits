/**
 * Maintenance tools.   npm run backup   -> safe copy of the database into data/backups/ (keeps the last 14)
 *                      npm run export   -> orders + products as CSV files (open in Excel) in data/exports/
 */
'use strict';
const { DatabaseSync } = require('node:sqlite'), fs = require('fs'), path = require('path');
const DATA = process.env.DATA_DIR || path.join(__dirname, '..', 'data'), DB = path.join(DATA, 'vsd.db');
if (!fs.existsSync(DB)) { console.error(`No database found at ${DB}. Start the server once first (npm start).`); process.exit(1); }
const db = new DatabaseSync(DB), day = new Date().toISOString().slice(0, 10), cmd = process.argv[2];
const csv = rows => '\ufeff' + rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');

if (cmd === 'backup') {
  const dir = path.join(DATA, 'backups'), file = path.join(dir, `vsd-${day}.db`);
  fs.mkdirSync(dir, { recursive: true }); fs.rmSync(file, { force: true });
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);        // consistent copy, safe while the server is running
  fs.readdirSync(dir).filter(n => /^vsd-.*\.db$/.test(n)).sort().slice(0, -14).forEach(n => fs.rmSync(path.join(dir, n)));
  console.log('Backup saved:', file, '\nAlso copy the folder', path.join(DATA, 'uploads'), '(product photos) to keep photos safe.');
} else if (cmd === 'export') {
  const dir = path.join(DATA, 'exports'); fs.mkdirSync(dir, { recursive: true });
  const orders = db.prepare('SELECT j FROM orders ORDER BY created').all().map(r => JSON.parse(r.j));
  fs.writeFileSync(path.join(dir, `orders-${day}.csv`), csv([['Order','Date','Customer','Phone','Email','Address','Items','Subtotal','Shipping','Total','Payment','Status','India Post tracking'],
    ...orders.map(o => [o.no, o.d.slice(0, 16).replace('T', ' '), o.cust, o.phone, o.email, o.addr, o.items.map(i => `${i.q} x ${i.n}`).join('; '), o.sub, o.ship, o.tot, o.pay, o.st, o.track])]));
  const cat = JSON.parse(db.prepare("SELECT v FROM doc WHERE k='catalog'").get().v);
  fs.writeFileSync(path.join(dir, `products-${day}.csv`), csv([['Product','Category','Size','MRP','Price','Stock','Low-stock limit','Active'],
    ...cat.prods.flatMap(p => p.v.map(v => [p.n, p.c, v.w, v.mrp, v.p, v.s, v.low, p.on ? 'yes' : 'no']))]));
  console.log(`Exported ${orders.length} orders and ${cat.prods.length} products to ${dir}`);
} else console.log('Usage: npm run backup | npm run export');
