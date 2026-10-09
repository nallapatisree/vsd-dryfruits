/** API tests: `npm test`. Starts the server on a temp database and checks the important rules. */
const { spawn } = require('child_process'), assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const port = 3100 + Math.floor(Math.random() * 800), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vsd-')), base = `http://127.0.0.1:${port}`;
  const srv = spawn('node', [path.join(__dirname, 'index.js')], { env: { ...process.env, PORT: port, DATA_DIR: dir, ADMIN_PASSWORD: 'test-pass' }, stdio: 'ignore' });
  const call = async (m, u, b, ck) => { const r = await fetch(base + u, { method: m, headers: { 'Content-Type': 'application/json', ...(ck ? { Cookie: ck } : {}) }, body: b && JSON.stringify(b) });
    return { s: r.status, j: await r.json().catch(() => ({})), ck: (r.headers.get('set-cookie') || '').split(';')[0] }; };
  for (let i = 0; i < 60; i++) { try { await fetch(base + '/api/catalog'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  let n = 0; const t = async (name, f) => { try { await f(); n++; console.log('✓', name); } catch (e) { console.log('✗', name, '-', e.message); process.exitCode = 1; } };
  const addr = { name: 'Test Buyer', phone: '9876543210', address: '12-3 Brodipet', city: 'Guntur', state: 'Andhra Pradesh', pin: '522002' };
  let ck = '', cat, no;
  await t('public catalog has products, no log, capped stock', async () => { const r = await call('GET', '/api/catalog'); cat = r.j; assert(cat.prods.length > 60 && !cat.log && cat.prods.every(p => p.v.every(v => v.s <= 50))); });
  await t('static site served, server files and traversal blocked', async () => {
    assert.equal((await fetch(base + '/')).status, 200); assert.equal((await fetch(base + '/server/index.js')).status, 404);
    assert.equal((await fetch(base + '/..%2fpackage.json')).status, 404); assert.equal((await fetch(base + '/js/seed.js')).status, 404); });
  await t('admin API needs login; wrong password rejected', async () => {
    assert.equal((await call('GET', '/api/admin/data')).s, 401); assert.equal((await call('POST', '/api/admin/login', { user: 'admin', password: 'nope' })).s, 401);
    const r = await call('POST', '/api/admin/login', { user: 'admin', password: 'test-pass' }); assert.equal(r.s, 200); ck = r.ck; assert(ck.startsWith('vsd_sid=')); });
  const stock = async () => (await call('GET', '/api/admin/data', null, ck)).j.catalog.prods[0].v[0].s;
  const before = await stock();
  await t('bad phone rejected', async () => assert.equal((await call('POST', '/api/orders', { ...addr, phone: '12345', items: [{ t: 'p', id: 1, vi: 0, q: 1 }] })).s, 400));
  await t('order uses SERVER prices and numbering; stock drops', async () => {
    const r = await call('POST', '/api/orders', { ...addr, items: [{ t: 'p', id: 1, vi: 0, q: 2, price: 1 }] }); assert.equal(r.s, 200); no = r.j.order.no;
    assert(/^VSD-\d{4}-000001$/.test(no)); const p = cat.prods[0].v[0].p * 2; assert.equal(r.j.order.sub, p); assert.equal(r.j.order.tot, p + (p >= cat.settings.free ? 0 : cat.settings.ship));
    assert.equal(await stock(), before - 2); });
  await t('overselling blocked (409) and nothing changes', async () => { assert.equal((await call('POST', '/api/orders', { ...addr, items: [{ t: 'p', id: 1, vi: 0, q: 500 }] })).s, 409); assert.equal(await stock(), before - 2); });
  await t('combo order reduces component stock', async () => { const cb = cat.combos[0], [pid, vi, q] = cb.items[0], s0 = (await call('GET', '/api/admin/data', null, ck)).j.catalog.prods.find(p => p.id == pid).v[vi].s;
    assert.equal((await call('POST', '/api/orders', { ...addr, items: [{ t: 'c', id: cb.id, vi: 0, q: 1 }] })).s, 200);
    assert.equal((await call('GET', '/api/admin/data', null, ck)).j.catalog.prods.find(p => p.id == pid).v[vi].s, s0 - q); });
  await t('tracking number + customer lookup needs matching phone', async () => {
    assert.equal((await call('PATCH', '/api/admin/orders/' + no, { st: 'Shipped', track: 'EE123456789IN' }, ck)).s, 200);
    assert.equal((await call('GET', `/api/track?no=${no}&phone=9876543210`)).j.order.track, 'EE123456789IN'); assert.equal((await call('GET', `/api/track?no=${no}&phone=9000000000`)).s, 404); });
  await t('cancel restores stock; cancelled cannot reopen', async () => {
    assert.equal((await call('PATCH', '/api/admin/orders/' + no, { st: 'Cancelled' }, ck)).s, 200); assert.equal(await stock(), before);
    assert.equal((await call('PATCH', '/api/admin/orders/' + no, { st: 'Pending' }, ck)).s, 400); });
  await t('catalogue save keeps server stock, applies settings; needs login', async () => {
    const d = (await call('GET', '/api/admin/data', null, ck)).j.catalog; d.prods[0].n = 'Badam Renamed'; d.prods[0].v[0].s = 9999; d.settings.ship = 80; d.theme = 'maroon';
    assert.equal((await call('PUT', '/api/admin/catalog', d)).s, 401); assert.equal((await call('PUT', '/api/admin/catalog', d, ck)).s, 200);
    const c = (await call('GET', '/api/catalog')).j; assert.equal(c.prods[0].n, 'Badam Renamed'); assert.equal(c.settings.ship, 80); assert.equal(c.theme, 'maroon'); assert.equal(await stock(), before); });
  await t('manual stock update + image upload validation', async () => {
    assert.equal((await call('POST', '/api/admin/stock', { id: 1, vi: 0, s: 7 }, ck)).s, 200); assert.equal(await stock(), 7);
    const jpg = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]).toString('base64'), r = await call('POST', '/api/admin/upload', { d: jpg }, ck);
    assert.equal(r.s, 200); assert.equal((await fetch(base + r.j.url)).status, 200); assert.equal((await call('POST', '/api/admin/upload', { d: 'data:image/jpeg;base64,AAAA' }, ck)).s, 400); });
  console.log(`\n${n} checks passed`); srv.kill(); fs.rmSync(dir, { recursive: true, force: true });
})();
