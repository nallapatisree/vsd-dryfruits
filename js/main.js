/**
 * Image upload helper, quick-add, event wiring and first render.
 */
let IMG = '';
/** Photos that are still uploading. Every Save waits for these, so a photo can never be lost. */
const pendingUploads = new Set();
const uploading = () => pendingUploads.size > 0;
function afterUploads(cb) {
  toast('Finishing the photo upload…');
  return Promise.allSettled([...pendingUploads]).then(cb);
}
const readImage = (f) =>
  new Promise((ok, no) => {
    const u = URL.createObjectURL(f),
      m = new Image();
    m.onload = () => {
      URL.revokeObjectURL(u);
      ok(m);
    };
    m.onerror = () => {
      URL.revokeObjectURL(u);
      no(
        new Error(
          'this file is not an image the browser can read (iPhone HEIC photos are not supported – use JPG, PNG or WebP)',
        ),
      );
    };
    m.src = u;
  });
/**
 * Any image, any shape, any phone-photo size: it is shrunk in the browser and uploaded.
 * Resolves with the stored URL. Transparent PNG/WebP keep their transparency.
 */
function uploadFile(f, opt = {}) {
  if (!f) return Promise.reject(new Error('No file selected'));
  if (f.size > 40 * 1024 * 1024) {
    const err = 'This file is over 40 MB. Please choose a smaller photo.';
    toast(err, 6000);
    return Promise.reject(new Error(err));
  }
  const job = readImage(f)
    .then((img) => {
      const k = Math.min(1, (opt.mx || 1000) / Math.max(img.width, img.height)),
        c = document.createElement('canvas'),
        x = c.getContext('2d');
      c.width = Math.max(1, Math.round(img.width * k));
      c.height = Math.max(1, Math.round(img.height * k));
      let d;
      if (/png|webp|gif|svg/i.test(f.type) || /\.(png|webp|gif|svg)$/i.test(f.name || '')) {
        x.drawImage(img, 0, 0, c.width, c.height);
        d = c.toDataURL('image/png');
      }
      if (!d || d.length > 3.2e6) {
        x.fillStyle = '#fff';
        x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, 0, 0, c.width, c.height);
        d = c.toDataURL('image/jpeg', 0.85);
      }
      return api('/api/admin/upload', { method: 'POST', body: { d } });
    })
    .then((j) => j.url)
    .catch((e) => {
      toast('Photo not changed: ' + e.message, 6000);
      throw e;
    });
  pendingUploads.add(job);
  const done = () => pendingUploads.delete(job);
  job.then(done, done); // registered first, so it runs before anything waiting on the upload
  return job;
}

/** File-picker helper: shows "Uploading…", then the stored photo. On failure the old photo stays. */
function up(i, t, mx, cb) {
  const f = i.files && i.files[0];
  if (!f) return;
  const el = typeof t === 'string' ? $('#' + t) : t,
    before = el ? el.innerHTML : '',
    keep = IMG;
  if (el) el.innerHTML = '<span style="font-size:12px;color:var(--m)">Uploading…</span>';
  uploadFile(f, { mx })
    .then((url) => {
      IMG = url;
      if (el) el.innerHTML = '<img src="' + url + '" alt="">';
      toast('Photo uploaded ✓');
      if (typeof cb === 'function') cb(url);
    })
    .catch(() => {
      IMG = keep;
      if (el) el.innerHTML = before;
    })
    .finally(() => {
      i.value = '';
    });
}
addEventListener('hashchange', () => {
  D.stale = 1;
  cl();
  render();
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.sr')) {
    const d = $('#dd');
    d && (d.style.display = 'none');
  }
});
boot();

// setInterval(() => {
//   if (!document.hidden && D.banners.filter((x) => x.on).length > 1 && $('#hero') && Date.now() > hpause) {
//     hi++;
//     hup();
//   }
// }, 5000);

/** Start-up: load the catalogue from the server, check for an admin session, then draw the page. */
async function boot() {
  try {
    await loadCatalog();
  } catch (e) {
    $('#app').innerHTML =
      '<p style="padding:40px;text-align:center">Could not reach the server. Start it with <b>npm start</b> and open http://localhost:3000</p>';
    return;
  }
  try {
    await api('/api/admin/me');
    adm = true;
  } catch (e) {}
  render();
}
