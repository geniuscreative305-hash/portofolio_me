# PRD: Portfolio, Service Order & WordPress-Style Admin Web App
================================================================================
ZettBOT Core v4.1 | Status: APPROVED FOR EXECUTION
================================================================================

---

## ZONA ATAS: SPESIFIKASI KEBUTUHAN PRODUK (BLUEPRINT)

### 1. Nama Projek & Problem Statement
**Nama:** Portfolio & Order Management System  
**Masalah:** Freelancer/agency membutuhkan satu platform terpadu yang:
- Menampilkan portofolio dan layanan secara profesional (dark modern UI)
- Menerima order dari klien via WhatsApp checkout terintegrasi
- Memiliki panel admin WordPress-style untuk mengelola semua entitas
- Memungkinkan tracking order publik dan pengumpulan testimonial anti-spam

### 2. Peran Pengguna
- **Admin:** Akses penuh via `/admin` (autentikasi PIN + HTTP-only cookie)
- **Klien/Publik:** Browsing portfolio, pesan layanan, tracking order, submit testimonial

### 3. Arsitektur & Lingkungan Kerja
- **Framework:** Next.js 14 App Router (TypeScript)
- **Styling:** Tailwind CSS + Framer Motion
- **Database:** Prisma ORM → Neon PostgreSQL
- **Storage:** Vercel Blob (images, auto-cleanup on delete/replace)
- **Auth:** JWT → HTTP-only cookie, middleware.ts protects `/admin/*`
- **Deploy:** Vercel

### 4. Alur Kerja Aplikasi

#### Alur Klien:
1. Landing page → lihat Hero (typing animation) → scroll ke Services & Portfolio
2. Klik layanan → buka Order Form → isi data → submit
3. Backend: generate `orderCode` (ORD-YYYYMMDD-XXXX) → simpan ke DB → redirect WhatsApp checkout
4. Klien dapat tracking order di `/track?code=ORD-...`
5. Klien dengan order COMPLETED bisa submit testimonial (anti-spam: cek `hasSubmittedTestimonial`)

#### Alur Admin:
1. Login via `/admin/login` → PIN diverifikasi vs bcrypt hash di SiteSetting → set HTTP-only cookie
2. Dashboard: KPI stats + activity log
3. CRUD: Orders, Services, Portfolio (dengan Vercel Blob upload), Testimonials
4. Bulk actions, CSV export, audit log otomatis setiap mutasi

### 5. Database Schema

#### Service
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| title | String | |
| slug | String | unique |
| category | String | |
| shortDesc | String | |
| priceStart | Int | |
| features | String[] | |
| isActive | Boolean | default true |
| sortOrder | Int | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### Portfolio
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| title | String | |
| category | String | |
| shortDesc | String | |
| fullDescription | String (Text) | |
| thumbnailUrl | String | Vercel Blob URL |
| techStack | String[] | |
| liveDemoUrl | String? | |
| relatedServiceId | String? | FK → Service |
| status | Enum (DRAFT/PUBLISHED) | default DRAFT |
| isFeatured | Boolean | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### Order
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| orderCode | String | unique, e.g. ORD-20261122-0001 |
| clientName | String | |
| clientWhatsapp | String | |
| serviceId | String | FK → Service |
| projectBrief | String (Text) | |
| budgetEstimate | String | |
| status | Enum | PENDING/IN_PROGRESS/REVISION/COMPLETED/CANCELLED |
| adminNote | String? (Text) | |
| hasSubmittedTestimonial | Boolean | default false |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### Testimonial
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| orderCode | String | unique |
| clientName | String | |
| clientRole | String | |
| rating | Int | 1-5 |
| content | String (Text) | |
| isApproved | Boolean | default false |
| createdAt | DateTime | |

#### ActivityLog
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| action | String | CREATE/UPDATE/DELETE/BULK_DELETE etc. |
| entityType | String | Order/Portfolio/Service/Testimonial/Setting |
| entityId | String? | |
| description | String | |
| createdAt | DateTime | |

#### SiteSetting
| Field | Type | Notes |
|-------|------|-------|
| id | String | default "global" |
| heroRoles | String[] | typing animation roles |
| heroHeadline | String | |
| heroSubheadline | String | |
| whatsappNumber | String | |
| isOpenOrder | Boolean | |
| adminPinHash | String | bcrypt hash |
| updatedAt | DateTime | |

### 6. Aturan Validasi & Logika Khusus
- Order code: `ORD-YYYYMMDD-XXXX` daily sequential, generated di backend
- Admin PIN: bcrypt hash, verify server-side only
- Testimonial anti-spam: `orderCode` harus ada + `hasSubmittedTestimonial === false`
- Vercel Blob: max 4MB, jpg/png/webp only; auto `del()` on replace/delete
- Tracker: return order data WITHOUT clientWhatsapp field
- Bulk actions: use `prisma.updateMany` / `prisma.deleteMany` + cascade blob cleanup

### 7. Rencana Antarmuka

#### Public Routes:
- `/` — Hero, Services (with cursor spotlight), Portfolio grid (with modal), Order Form, Testimonials, Footer
- `/track` — Order tracker by orderCode
- `/testimonial/[orderCode]` — Submit testimonial form

#### Admin Routes (all protected via middleware):
- `/admin` → redirect to `/admin/dashboard`
- `/admin/login`
- `/admin/dashboard` — KPI + activity log
- `/admin/orders` — table + bulk + export CSV
- `/admin/services` — CRUD + toggle active
- `/admin/portfolio` — All/Published/Draft tabs + WP-style editor + blob uploader
- `/admin/testimonials` — approve/unapprove/delete + bulk
- `/admin/activity-logs` — paginated audit table
- `/admin/settings` — hero config + WA number + open/close toggle + change PIN

### 8. Kriteria Pengujian
- [ ] Public page renders services, published portfolio, approved testimonials
- [ ] Order form generates unique code and opens WA link
- [ ] Order tracker returns data without WA number
- [ ] Testimonial gate: reject if already submitted or code not found
- [ ] Admin login with correct PIN sets cookie and redirects
- [ ] Wrong PIN shows error, no cookie set
- [ ] Unauthenticated `/admin/*` redirects to login
- [ ] Portfolio image upload works via Vercel Blob
- [ ] Old blob URL auto-deleted when thumbnail replaced
- [ ] Bulk delete runs `deleteMany` and cleans up blobs
- [ ] ActivityLog entry created on every admin mutation
- [ ] CSV export downloads correct filtered data
- [ ] Settings update persists to SiteSetting

---

## ZONA BAWAH: MASTER CONTEXT & LOGIKA SISTEM TERKINI

### Status Arsitektur Aktif
- Next.js 14.2.x App Router (TypeScript strict)
- Tailwind CSS v3 + Framer Motion v11
- Prisma 5.x + Neon PostgreSQL (@prisma/client)
- @vercel/blob for media storage
- bcryptjs for PIN hashing
- jose for JWT (Edge-compatible)

### File Structure
```
portofolio/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── lib/
│   ├── prisma.ts
│   ├── blob.ts
│   ├── auth.ts
│   └── activity-logger.ts
├── middleware.ts
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── track/page.tsx
│   │   └── testimonial/[orderCode]/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── services/page.tsx
│   │   ├── portfolio/page.tsx
│   │   ├── testimonials/page.tsx
│   │   ├── activity-logs/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       ├── orders/route.ts
│       ├── orders/[id]/route.ts
│       ├── orders/export/route.ts
│       ├── orders/bulk/route.ts
│       ├── services/route.ts
│       ├── services/[id]/route.ts
│       ├── portfolio/route.ts
│       ├── portfolio/[id]/route.ts
│       ├── portfolio/bulk/route.ts
│       ├── testimonials/route.ts
│       ├── testimonials/[id]/route.ts
│       ├── testimonials/bulk/route.ts
│       ├── upload/route.ts
│       ├── tracker/route.ts
│       ├── auth/login/route.ts
│       ├── auth/logout/route.ts
│       └── settings/route.ts
├── components/
│   ├── public/
│   │   ├── HeroSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── PortfolioSection.tsx
│   │   ├── PortfolioModal.tsx
│   │   ├── OrderForm.tsx
│   │   ├── TestimonialsSection.tsx
│   │   └── Navbar.tsx
│   └── admin/
│       ├── AdminLayout.tsx
│       ├── AdminSidebar.tsx
│       ├── AdminTopBar.tsx
│       ├── Toast.tsx
│       ├── DataTable.tsx
│       └── BulkActions.tsx
└── types/
    └── index.ts
```

### Log Pembaruan
- v1.0.0 (2026-11-22): Initial build — full scaffold per PRD spec
- v1.1.0 (2026-11-23): Redesain UI/UX Pro-Max:
  - Interactive HTML5 Canvas Particle Network Background (Emerald/Cyan neon dots & mesh lines, mouse reactive).
  - 2-Column Hero layout with personal branding (Azi Ramdani, Vibe Coding, UI/UX Specialist, Copywriting).
  - Profile photo card with 3 interactive floating badges (`⚡ Vibe Coding`, `🎨 UI/UX Specialist`, `🔥 Copywriting`).
  - Section About (`#about`) with experience badge and 4-Step Workflow cards.
  - Navbar updated with Home (`#home`) and About (`#about`) links.
  - SiteSetting schema updated with `profilePhotoUrl`, `ownerName`, `aboutBio`, `experienceYears`.
  - Admin Settings (`/admin/settings`) equipped with Vercel Blob profile photo uploader and live preview.
- v1.2.0 (2026-11-23): Optimasi Performa Ekstrem & Filter Kategori Portofolio:
  - Server-Rendered Zero-Delay Homepage (Direct Prisma Queries, spinner loading dihapus total).
  - ParticleCanvas CPU optimization (dihapus shadowBlur, squared distance, tab blur pause).
  - Filter Tabs Portofolio: Semua, ⚡ Vibe Coding, 🎨 Design, 🔥 Copy Writing dengan animasi layout.
  - Admin Portfolio Quick-Select Chips untuk 3 kategori utama.
  - Admin PIN aktif dan terverifikasi: `porto123`.
- v1.3.0 (2026-11-23): Fitur Cek Order & Tracking Milestone Pekerjaan:
  - Menu "Cek Order" di Navbar Desktop dan Mobile.
  - Banner Quick Order Tracker pada halaman depan.
  - Halaman `/track` dengan visualisasi 4 Tahapan Milestone (Konfirmasi & Analisis → Proses Pengerjaan → Review & Revisi → Selesai & Handover).
  - Tampilan Catatan Perkembangan Real-Time dari Admin (`Admin Note`) dengan live badge.
  - Tombol Salin Kode Order & Tombol Konsultasi WhatsApp khusus perkembangan proyek.
  - Auto-search saat link membawa parameter `?code=...`.


