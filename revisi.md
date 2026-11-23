# Antrean Revisi Sistem (revisi.md)

Status Antrean: **KOSONG / SELURUH REVISI TELAH DITERAPKAN & DISINKRONISASI KE PRD.MD**

---

### Riwayat Pembaruan Terakhir:
- **v1.6.0 (2026-11-23):** Full-Stack Security Audit & Hardening:
  1. `requireAdmin` server-side authorization di seluruh mutating/admin API routes (401 Unauthorized guard).
  2. Login brute-force rate limiter (5 failed attempts -> 15 min lock, 429 Too Many Requests).
  3. Secure Vercel Blob Upload (`requireAdmin`, MIME type whitelist, 4MB file size cap).
  4. Zero-PII Public Tracker (`select` ketat, PII dihapus total, non-guessable `orderCode` suffix).
  5. Anti-spam honeypot (`website_url`) + submission rate limit + strict server validation pada form Order & Testimoni.
  6. HTTP Security Headers di `next.config.mjs` + audit variabel lingkungan rahasia.
- **v1.5.2 (2026-11-23):** Mobile Navbar Open/Close Drawer + Responsive Grid Portofolio Beranda (Desktop 3 card 1x3 simetris, Mobile 4 card 2x2 simetris).
- **v1.5.0 (2026-11-23):** Navbar Sliding Gradient Pill Indicator (`layoutId="activeNav"`), Hero 2-Col Mobile & Tablet Alignment, 2-Col Mobile Grid Services & Portfolio, dan Rute Arsip Khusus `/portfolio`.
- **v1.4.0 (2026-11-23):** Perapihan Panel Admin (Bullet-proof layout, Route Progress Bar, fast prefetching, page transition animations, responsif `max-w-7xl`).
- **v1.3.0 (2026-11-23):** Penambahan Menu Cek Order & Sistem Tracking Progres Pekerjaan.
- **v1.2.0 (2026-11-23):** Server-Rendered Zero-Delay Homepage, Filter Kategori Portofolio, Admin PIN `porto123`.
- **v1.1.0 (2026-11-23):** Redesain UI/UX Pro-Max, Profil Azi Ramdani, 3 Floating Badges, Section About.

---
*Untuk mengajukan revisi atau fitur baru berikutnya, cukup ketikkan permintaan Anda langsung di jendela chat.*
