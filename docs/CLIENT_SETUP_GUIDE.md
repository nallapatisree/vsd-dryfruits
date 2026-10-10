# VSD – Setup & Handover Guide

For the client's team. Plain steps, no database knowledge needed.

> **Honesty note:** the website, server, backup and export tools were tested on a development machine.
> The hosting steps below (Option A and B) were **not** run on a live hosting account, and hosting company screens change,
> so use their current documentation for exact button names. Do a full test order after going live.

---

## 1. What you are setting up

| Part | What it is | Where it lives |
|---|---|---|
| Website + admin panel | the pages customers and the owner see | the project folder (`index.html`, `css/`, `js/`) |
| Server | a small program (`server/index.js`) that serves the site and handles orders | runs on the hosting machine |
| **Database** | **one file: `data/vsd.db`** – orders, products, stock, banners, settings | the `data/` folder, created automatically on first start |
| Product photos | images uploaded in admin | `data/uploads/` |

There is **nothing to install for the database**. It is created by the server the first time it runs.
The `data/` folder is the whole business – protect it and back it up.

## 2. What the client must prepare

1. **A hosting account** in the client's own name (so they own the data).
2. **A domain name** (e.g. `venkatasaidryfruits.in`) – optional at first.
3. **A strong admin password** (12+ characters). Only the owner should know it.
4. The final **logo, product list, prices, photos, policies**.

---

## 3. Option A – Managed host (easiest: Railway / Render / similar)

You need a host that (1) runs **Node.js 22.5 or newer**, (2) supports a **persistent disk / volume**. Without a persistent disk the database is erased on every restart.

1. Put the project in a GitHub repository (the client creates the account and the developer pushes the code).
2. In the host: **New project → Deploy from GitHub** → pick the repository.
3. Start command: `npm start` (build command: none).
4. **Add a volume / disk** and mount it at `/data`.
5. Set these **environment variables**:
   - `ADMIN_PASSWORD` = the strong password
   - `DATA_DIR` = `/data`
   - `NODE_ENV` = `production`
   - `TRUST_PROXY` = `1`
6. Deploy. Open the address the host gives you. The shop loads; admin is at `…/#/admin`.
7. (Optional) Add the client's domain in the host's *Domains* screen and follow its DNS instructions. HTTPS is added by the host.

## 4. Option B – Your own Linux server (VPS, Ubuntu)

Needs someone comfortable with a terminal. Files for this are in the `deploy/` folder.

```bash
# 1. Node 22+ and git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# 2. Get the code
sudo useradd -r -m vsd
sudo git clone <repository-url> /opt/vsd
sudo mkdir -p /var/lib/vsd && sudo chown vsd /var/lib/vsd

# 3. Settings (edit the password!)
sudo cp /opt/vsd/deploy/vsd.env.example /etc/vsd.env
sudo nano /etc/vsd.env
sudo chmod 600 /etc/vsd.env

# 4. Run it as a service that restarts automatically
sudo cp /opt/vsd/deploy/vsd.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now vsd
sudo systemctl status vsd          # should say "active (running)"

# 5. Web address + free HTTPS (edit the domain inside the file first)
sudo cp /opt/vsd/deploy/nginx.conf /etc/nginx/sites-available/vsd
sudo ln -s /etc/nginx/sites-available/vsd /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d shop.example.com
```
The database will be at `/var/lib/vsd/vsd.db`.

## 5. First-day checklist (do in this order)

1. Open `…/#/admin`, sign in. **Wrong password must be rejected.**
2. **Admin → Settings:** WhatsApp number (with 91), shipping charge, free-shipping amount, scrolling text.
3. **Admin → Settings → "Remove all sample products & combos"**, then **Products → Add product** (a 3-step form: details → weights & prices → review) for every real product. Combos are added in **Combos**. Products that are out of stock are shown to customers as "Out of Stock" and cannot be added.
4. **Admin → Banners / Theme:** set banners and the colour theme.
5. Place a **test order** from a phone: it should reach WhatsApp, appear in **Admin → Orders**, and reduce stock.
6. Mark it Shipped with a tracking number, check **TRACK ORDER** on the customer side, then Cancel it and confirm stock returns.
7. Make a backup (section 7).

> The sample catalogue (`server/seed.json`) uses **placeholder prices and stock**. Never launch with it.
> If you want an empty start: stop the server, delete the `data/` folder, start again – you get the sample catalogue back, then edit it.

---

## 6. How to view the database / your data

**Way 1 – the admin panel (normal daily use).** Orders, products, inventory (with change log) and the dashboard are all there. *Orders → Export to Excel* downloads orders as `.xlsx`.

**Way 2 – CSV files for Excel.** On the server run:
```bash
npm run export
```
This writes `orders-DATE.csv` and `products-DATE.csv` into `data/exports/`. Open them in Excel.

**Way 3 – look inside the database file (for the technical person).**
1. Install the free **DB Browser for SQLite** (sqlitebrowser.org) on your PC.
2. Copy a **backup** file (`vsd-DATE.db`) to your PC – do not open the live file on the server.
3. *File → Open Database Read Only*.
4. Tables:
   - `orders` – one row per order; the `j` column holds the full order as text (JSON).
   - `doc` – one row `catalog` holding products, combos, banners and settings as JSON.

**Never edit the database file by hand** – use the admin panel. A wrong edit can break orders or stock.

## 7. Backups (very important)

```bash
npm run backup
```
Creates `data/backups/vsd-DATE.db` (a safe copy, can run while the shop is live; keeps the last 14).
**Photos** are separate: also copy the `data/uploads/` folder.

- **Automatic daily backup (Linux):** `sudo crontab -u vsd -e` and add
  `0 2 * * * cd /opt/vsd && DATA_DIR=/var/lib/vsd npm run backup`
- **A backup on the same server is not enough.** Download the `backups/` and `uploads/` folders to another place (owner's PC, Google Drive) at least **weekly**.
- **Restore:** stop the server, replace `data/vsd.db` with the backup file (rename it to `vsd.db`), put the `uploads/` folder back, start the server.
- On a managed host, ask the host whether volume snapshots/backups are available and switch them on.

## 8. Everyday operations

| Task | How |
|---|---|
| Change admin password | change `ADMIN_PASSWORD` in the host settings / `/etc/vsd.env`, restart. Everyone is signed out. |
| Update the website to a new version | developer pulls the new code (`git pull`) and restarts. **`data/` is not touched.** |
| Restart (Linux) | `sudo systemctl restart vsd` |
| See errors (Linux) | `sudo journalctl -u vsd -n 100` |
| Move to another server | stop the old one, copy `data/` to the new one, start there |

## 9. Troubleshooting

| Problem | Likely cause / fix |
|---|---|
| Page says "Could not reach the server" | the server is not running – start it / check logs |
| "Invalid credentials" at admin login | the password the server loaded is not the one you typed. Read the line `Admin sign-in -> …` printed when the server starts (it shows the username and the password length). Use a `.env` file instead of typing the password in the terminal; avoid `& ! ^ %` in terminal commands. Remember: the default is `admin` / `admin123` only when no password is set. |
| Admin sign-in loops back to login | open the site on **https** (cookie is HTTPS-only in production) and make sure `TRUST_PROXY` / proxy headers are set |
| "Too many attempts" at login | wait 15 minutes (protection against password guessing) |
| Data disappears after restart | no persistent disk – `DATA_DIR` must point to a mounted volume |
| Photos upload fails | image too large (limit about 4 MB) or proxy blocks big uploads (`client_max_body_size`) |
| Excel export button does nothing | needs internet (loads a library) – or use `npm run export` |
| Server won't start: "node:sqlite" error | Node is older than 22.5 – upgrade Node |

## 10. What this version does NOT do yet (tell the owner)

- No online payment – orders are confirmed over WhatsApp (Razorpay is the next feature).
- One admin login only; no customer accounts (customers find orders by order number + phone).
- No email notifications; new orders arrive by WhatsApp message.
- One server only (fine for a single shop). If traffic grows a lot, move to PostgreSQL (`docs/BACKEND_PLAN.md`).
- Privacy / terms / refund policy pages still need to be written by the client.
