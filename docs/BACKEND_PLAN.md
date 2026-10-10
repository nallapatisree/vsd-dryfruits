> **Status:** phase 1 is done – a working Node + SQLite backend (`server/`). This document describes the later move to PostgreSQL / Next.js / Razorpay.

# Backend plan (phase 2)

**Stack:** Next.js 14 + TypeScript, PostgreSQL (Neon/Supabase), Prisma, Razorpay, Cloudinary, deploy on Vercel.

## Data model (Prisma)
User(role: ADMIN|CUSTOMER) · Address · Category · Product · ProductImage · ProductVariant(sku, weight, mrp, price, stock, lowStockLimit) ·
Combo · ComboItem(variantId, qty) · Cart/CartItem · Wishlist · Order · OrderItem · Payment · Coupon · Review · Banner · InventoryTransaction · Setting.
Order: orderNo `VSD-YYYY-000001`, status, paymentStatus, trackingNumber, totals, gst fields.

## Mapping from this demo
| Demo (`js/…`) | Production |
|---|---|
| `seed.js` / localStorage `D` | Postgres tables + `prisma/seed.ts` |
| `place()` stock deduction | DB transaction with row locks (no overselling) |
| `login()` | hashed passwords, HTTP-only session cookie, rate limiting |
| image upload to data-URI | Cloudinary upload, store URL |
| `xl()` Excel | server-side export (SheetJS) |
| `inv()` invoice | server-rendered PDF |

## Phases
1. Auth, schema, admin shell · 2. Catalogue, variants, inventory · 3. Storefront + cart · 4. Checkout, orders, Razorpay (webhook-verified) ·
5. Analytics, reports, exports, invoices · 6. CMS (banners, policies, settings), SEO · 7. Security review, tests, deploy.

## Security checklist
Zod validation on every API · never trust client prices (recompute server-side) · verify Razorpay signatures · admin routes protected in middleware and API · secrets only in env vars.
