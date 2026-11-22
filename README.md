# Portfolio Admin — Deployment Guide

## ═══════════════════════════════════════════════════════════════
## SETUP INSTRUCTIONS
## ═══════════════════════════════════════════════════════════════

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.local` and fill in your actual values:

```env
# Neon PostgreSQL — from https://neon.tech
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/portfolio?sslmode=require"

# Vercel Blob — from your Vercel project > Storage > Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxx"

# JWT Secret — generate: openssl rand -base64 32
JWT_SECRET="your-random-secret-min-32-chars"

# App URL
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

### 3. Set Up Database
```bash
# Push schema to Neon PostgreSQL
npm run db:push

# Seed with sample data (default admin PIN: admin1234)
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## ═══════════════════════════════════════════════════════════════
## DEPLOY TO VERCEL
## ═══════════════════════════════════════════════════════════════

1. Push this repository to GitHub
2. Import on https://vercel.com/new
3. Add environment variables in Vercel project settings:
   - `DATABASE_URL` (from Neon)
   - `BLOB_READ_WRITE_TOKEN` (from Vercel Blob storage)
   - `JWT_SECRET` (generate a random string)
4. Deploy!

### Vercel Blob Setup:
- Go to your Vercel project → Storage → Create Blob Store
- Copy the `BLOB_READ_WRITE_TOKEN` to env vars

### Neon PostgreSQL Setup:
- Create account at https://neon.tech
- Create a new project → copy connection string
- Run `npm run db:push` to create tables

---

## ═══════════════════════════════════════════════════════════════
## APP ROUTES
## ═══════════════════════════════════════════════════════════════

### Public Routes
| Route | Description |
|-------|-------------|
| `/` | Portfolio homepage (hero, services, portfolio, order form, testimonials) |
| `/track?code=ORD-...` | Order tracker (no WhatsApp exposed) |
| `/testimonial/[orderCode]` | Submit testimonial (anti-spam gate) |

### Admin Routes (all protected via JWT middleware)
| Route | Description |
|-------|-------------|
| `/admin/login` | PIN login page |
| `/admin/dashboard` | KPI stats + recent activity log |
| `/admin/orders` | Orders table with status updates, notes, bulk delete, CSV export |
| `/admin/services` | CRUD services, active toggle |
| `/admin/portfolio` | WP-style editor, Vercel Blob upload, bulk publish/draft/delete |
| `/admin/testimonials` | Approve/unapprove/delete + bulk actions |
| `/admin/activity-logs` | Paginated audit trail |
| `/admin/settings` | Hero content, WA number, order toggle, PIN change |

### API Routes
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | GET, POST | List (admin) / Create (public) |
| `/api/orders/[id]` | PATCH, DELETE | Update status/note, delete |
| `/api/orders/export` | GET | CSV export |
| `/api/orders/bulk` | POST | Bulk delete |
| `/api/services` | GET, POST | List / Create |
| `/api/services/[id]` | PATCH, DELETE | Update / Delete |
| `/api/portfolio` | GET, POST | Paginated list / Create |
| `/api/portfolio/[id]` | PATCH, DELETE | Update (auto-cleanup blob) / Delete |
| `/api/portfolio/bulk` | POST | Bulk publish/draft/delete with blob cleanup |
| `/api/testimonials` | GET, POST | List / Public submit (anti-spam) |
| `/api/testimonials/[id]` | PATCH, DELETE | Approve/unapprove / Delete |
| `/api/testimonials/bulk` | POST | Bulk approve/unapprove/delete |
| `/api/upload` | POST | Vercel Blob upload (jpg/png/webp, max 4MB) |
| `/api/tracker` | GET | Public order tracker (hides WhatsApp) |
| `/api/auth/login` | POST | Admin PIN login → HTTP-only JWT cookie |
| `/api/auth/logout` | POST | Destroy session |
| `/api/settings` | GET, PATCH | Site settings |
| `/api/activity-logs` | GET | Paginated audit log |

---

## ═══════════════════════════════════════════════════════════════
## SECURITY FEATURES
## ═══════════════════════════════════════════════════════════════

- **Admin Auth:** PIN verified via bcrypt against stored hash. JWT stored in HTTP-only cookie (not accessible to JavaScript).
- **Middleware Protection:** `middleware.ts` intercepts all `/admin/*` requests (except `/admin/login`) and verifies JWT.
- **WhatsApp Privacy:** Public tracker endpoint deliberately excludes `clientWhatsapp` field.
- **Testimonial Anti-Spam:** Server-side check that `orderCode` exists AND `hasSubmittedTestimonial === false` before accepting submission.
- **Blob Cleanup:** `del()` from `@vercel/blob` automatically called whenever a portfolio thumbnail is replaced or a portfolio item is deleted.
- **Activity Logging:** Every admin mutation (CREATE, UPDATE, DELETE, APPROVE, etc.) writes to `ActivityLog` table.
- **ENV Secrets:** No secrets hardcoded in source. All sensitive values via environment variables.

---

## ═══════════════════════════════════════════════════════════════
## DEFAULT CREDENTIALS
## ═══════════════════════════════════════════════════════════════

After seeding, the default admin PIN is: **`porto123`**

**Change this immediately** via `/admin/settings` → "Change Admin PIN" before going to production!

