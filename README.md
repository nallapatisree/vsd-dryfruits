# VSD – Venkata Sai Dry Fruits

Online store + admin panel + backend for **Venkata Sai Dry Fruits** (wholesale & retail, Patnam Bazar, Guntur).

Customers browse, choose a weight, check out and the order opens in WhatsApp with address and details.
The owner manages everything from `/#/admin`. Orders, stock, banners, settings and photos are stored on the **server** (not in the browser).

## Run it (needs Node.js 22.5 or newer – nothing to install)
Easiest and safest on every system: copy `.env.example` to `.env`, put your admin password in it, then:
```bash
npm start
# open http://localhost:3000        admin: http://localhost:3000/#/admin
npm test                           # 14 API checks on a temporary database
npm run backup                     # safe copy of the database
npm run export                     # orders/products as CSV for Excel
```
Or set the password in the terminal:
```
Mac/Linux:   ADMIN_PASSWORD="my-password" npm start
PowerShell:  $env:ADMIN_PASSWORD="my-password"; npm start
cmd.exe:     set "ADMIN_PASSWORD=my-password"&& npm start      <- quotes + no space before && (otherwise a hidden space ends up in the password)
```
The server prints one line on start, e.g. `Admin sign-in -> username "admin", password loaded from ADMIN_PASSWORD (11 characters)`.
If the character count is not what you typed, the shell changed it (characters like `& ! ^ %` are risky in a terminal) – use the `.env` file instead.
Without any password setting the server uses `admin123` and says so – **never go live like that.** The username is not case-sensitive.

## Environment variables
| Name | Meaning | Default |
|---|---|---|
| `ADMIN_PASSWORD` | admin password (spaces at the ends are ignored) | `admin123` (dev only) |
| `ADMIN_USER` | admin username | `admin` |
| `PORT` | port | `3000` |
| `DATA_DIR` | where the database and uploaded photos are kept | `./data` |
| `NODE_ENV=production` | marks the login cookie `Secure` (use behind HTTPS) | – |
| `TRUST_PROXY=1` | read the client IP from `X-Forwarded-For` (behind a proxy, for rate limits) | – |

## Structure
```
index.html, css/, js/, assets/   the website (plain HTML/CSS/JS, no build step)
server/index.js                  API + static file server (no npm packages)
server/seed.json                 starting catalogue, loaded into an empty database (sample data!)
server/test.js                   API tests
data/                            created at run time: vsd.db + uploads/  (git-ignored – BACK THIS UP)
docs/CLIENT_SETUP_GUIDE.md        hosting, database viewing, backups, troubleshooting (give this to the client)
deploy/                          Linux service, nginx and settings templates
docs/BACKEND_PLAN.md             how to move to PostgreSQL / Next.js later
```

## What the server guarantees
- Prices, shipping and totals are **recalculated on the server**; the browser cannot change them.
- Stock is reduced inside one database transaction per order → **no overselling**; combos reduce their component stock; cancelling restores it.
- Admin API needs a login session (HTTP-only cookie, 8 h); login is rate-limited; admin password is compared with scrypt hashing.
- Customers see only *In stock / Only a few left / Out of stock*; the public API caps stock numbers at 50.
- Customer text is stripped of `< > " ' \`` characters; uploads are checked (JPG/PNG/WebP only).

## Hosting
Needs a host that runs a Node process **with a persistent disk** (Railway, Render with disk, a VPS, Fly.io volume).
**Not** Vercel / Netlify / GitHub Pages: they cannot run this server or keep the database file.
Set `ADMIN_PASSWORD`, `NODE_ENV=production`, mount a volume and point `DATA_DIR` at it, put it behind HTTPS.

## Known limits (be honest with the client)
- One server instance only (SQLite file + in-memory admin sessions; restarting logs the admin out).
- One admin account (from environment variables). No customer accounts: customers find orders by order number + phone.
- Orders are confirmed over WhatsApp; there is **no online payment** yet (Razorpay is the next step).
- Catalogue edits are saved as one document (last save wins if two admins edit at once).
- The Excel export loads its library from a CDN, so it needs internet.
- `server/seed.json` holds **placeholder** prices and stock – replace them in Admin before launch.
- Back up the `data/` folder regularly.

## Admin
Dashboard & analytics · Orders (status, payment, India Post tracking, invoice, Excel export) · Products & combos · Inventory with log · Theme (4 colours) · Banners · Settings (shipping, WhatsApp number, scrolling text).

## Business details
GSTIN 37BRLPK9740E1ZG · D.No. 23-6-15, Opp. Axis Bank, Patnam Bazar, Guntur 522003, A.P. · 88853 55666

## Branding files
`assets/images/logo.webp` (header, footer, admin) · `assets/images/watermark.webp` (faint watermark on every page – strength is the `opacity` in `css/styles.css`, `body::before`) · `assets/images/favicon.png` (browser tab). Replace the files (keep the names) to rebrand. Use PNG/WebP with a transparent background.
