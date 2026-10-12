# Update notes – gift-box style combos, reliable photo saving

## 1. Combos now work like Gift Boxes
- Combo **card**: one price (no struck-through price, no "% OFF"), contents listed without prices, Add to Cart adds it straight away.
- Combo **popup**: same two-column layout as the gift box popup – photo, name, "What's inside" (products + weights, **no per-item prices, no "total if bought separately"**), one price, stock label, Add to Cart / Buy Now / Ask on WhatsApp.
- Cards no longer print a struck-through price when it equals the selling price (gift boxes showed "₹999 ₹999").
- **Bug fixed:** `main.js` defined a second `qa()` that overrode the one in `storefront.js`, so the **gift box** card's Add to Cart tried to add a *combo* with the gift box's id. There is now exactly one `qa()`.

## 2. Photos: any image, always saved, always fits
Why photos "went back to the old one":
1. Pressing Next/Save while the photo was still uploading saved the old photo; the new one arrived after the form had closed.
2. `save()` always reported success, even when the server rejected the change, so the form said "saved" and the next page load brought the old data back.
3. Photos over 5 MB (normal for phones) and anything except JPG/PNG/WebP were refused.

Changes:
- `uploadFile()` accepts any image the browser can read (up to 40 MB), shrinks it, keeps transparency for PNG/WebP. No ratio rules.
- Every Save (`wGo`, `wSave`, `cs2`, `bs`, `saveGb`, `saveCat`) waits for pending uploads (`uploading()` / `afterUploads()` in `main.js`).
- `save()` now rejects when the server refuses; the screen shows a red **NOT SAVED – reason** message (7 s) and the form stays open. Product, banner, combo and category forms only say "saved" after the server confirmed.
- A failed upload keeps the current photo and says why ("Photo not changed: …", e.g. iPhone HEIC).
- CSS: photos use `object-fit: contain` (whole picture visible); the toast no longer blocks clicks on buttons below it.

## 3. Housekeeping
- `.env.example` restored (README refers to it).
- `server/test.js`: added the missing `document.addEventListener` stub (the "frontend product popup" test failed before), and two new tests (combo popup, single `qa`). The "India Post" test needs internet access.

Files changed: `css/styles.css`, `js/state.js`, `js/main.js`, `js/storefront.js`, `js/admin.js`, `server/test.js`, `docs/CLIENT_SETUP_GUIDE.md`, `.env.example` (+ this file).
