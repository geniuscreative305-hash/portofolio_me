"use client";

import { useState, useEffect, useRef, useCallback, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { ServiceItem, PortfolioItem, TestimonialItem, SiteSettingItem, OrderFormData } from "@/types";

// ─── Hero Typing Animation ───────────────────────────────────────────────────
function TypingText({ roles }: { roles: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!roles.length) return;
    const current = roles[currentIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayText === current) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setCurrentIndex((i) => (i + 1) % roles.length);
    } else {
      const delta = isDeleting ? 50 : 100;
      timeout = setTimeout(() => {
        setDisplayText(isDeleting ? current.slice(0, displayText.length - 1) : current.slice(0, displayText.length + 1));
      }, delta);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex, roles]);

  return (
    <span className="gradient-text">
      {displayText}
      <span className="animate-pulse text-emerald-400">|</span>
    </span>
  );
}

// ─── Spotlight Card ───────────────────────────────────────────────────────────
function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || !ref.current) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    ref.current.style.setProperty("--mouse-x", `${x}%`);
    ref.current.style.setProperty("--mouse-y", `${y}%`);
  }, []);

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className={`spotlight-card ${className}`}>
      {children}
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < rating ? "text-amber-400" : "text-white/20"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  IN_PROGRESS: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  REVISION: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  CANCELLED: "bg-red-500/15 text-red-400 border-red-500/25",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? "bg-white/10 text-white/60 border-white/10"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Portfolio Modal ──────────────────────────────────────────────────────────
function PortfolioModal({
  item,
  onClose,
  onOrder,
}: {
  item: PortfolioItem;
  onClose: () => void;
  onOrder: (serviceId: string) => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card z-10"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          <div className="relative h-64 w-full overflow-hidden rounded-t-2xl">
            <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] to-transparent" />
          </div>

          <div className="p-6 space-y-6">
            {/* Header */}
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">{item.category}</span>
              <h2 className="text-2xl font-bold mt-1">{item.title}</h2>
              <p className="text-white/60 mt-2">{item.shortDesc}</p>
            </div>

            {/* Tech Stack */}
            <div>
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {item.techStack.map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white/80">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Full Description */}
            <div>
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Case Study</h3>
              <div className="text-white/70 leading-relaxed whitespace-pre-line text-sm">
                {item.fullDescription}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {item.liveDemoUrl && (
                <a
                  href={item.liveDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Live Demo
                </a>
              )}
              {item.relatedServiceId && (
                <button
                  onClick={() => { onClose(); onOrder(item.relatedServiceId!); }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Pesan Layanan Serupa
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Order Form ───────────────────────────────────────────────────────────────
function OrderSection({
  services,
  defaultServiceId,
  orderFormRef,
  isOpenOrder,
}: {
  services: ServiceItem[];
  defaultServiceId?: string;
  orderFormRef: React.RefObject<HTMLElement | null>;
  isOpenOrder: boolean;
}) {
  const [form, setForm] = useState<OrderFormData>({
    clientName: "",
    clientWhatsapp: "",
    serviceId: defaultServiceId ?? (services[0]?.id ?? ""),
    projectBrief: "",
    budgetEstimate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ orderCode: string; waUrl: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultServiceId) setForm((f) => ({ ...f, serviceId: defaultServiceId }));
  }, [defaultServiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOpenOrder) return;
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to submit order");
      } else {
        setResult(data.data);
        window.open(data.data.waUrl, "_blank");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpenOrder) {
    return (
      <section ref={orderFormRef as React.RefObject<HTMLElement>} id="order" className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card p-12">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-amber-400 mb-2">Order Sedang Ditutup</h3>
            <p className="text-white/60">Maaf, kami sedang tidak menerima order baru saat ini. Silakan cek kembali nanti.</p>
          </div>
        </div>
      </section>
    );
  }

  if (result) {
    return (
      <section ref={orderFormRef as React.RefObject<HTMLElement>} id="order" className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div className="glass-card p-12" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-emerald-400 mb-2">Order Berhasil Dibuat!</h3>
            <p className="text-white/60 mb-4">Kode order Anda:</p>
            <div className="bg-black/30 rounded-xl px-6 py-4 font-mono text-2xl font-bold gradient-text mb-6">
              {result.orderCode}
            </div>
            <p className="text-white/60 text-sm mb-6">Tab WhatsApp sudah dibuka. Jika belum terbuka, klik tombol di bawah.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={result.waUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Buka WhatsApp
              </a>
              <a href={`/track?code=${result.orderCode}`} className="btn-secondary">
                Track Order
              </a>
              <button onClick={() => setResult(null)} className="btn-secondary">
                Order Lagi
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section ref={orderFormRef as React.RefObject<HTMLElement>} id="order" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">Start a Project</span>
          <h2 className="section-title mt-2">Mulai Proyek Bersama</h2>
          <p className="section-subtitle">Ceritakan ide Anda. Kami akan bantu wujudkan.</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="glass-card p-8 max-w-2xl mx-auto space-y-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                className="input-field"
                placeholder="Ahmad Fauzi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">WhatsApp *</label>
              <input
                type="tel"
                required
                value={form.clientWhatsapp}
                onChange={(e) => setForm((f) => ({ ...f, clientWhatsapp: e.target.value }))}
                className="input-field"
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Pilih Layanan *</label>
            <select
              required
              value={form.serviceId}
              onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
              className="input-field appearance-none"
            >
              <option value="" disabled>-- Pilih Layanan --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#111827]">
                  {s.title} — Mulai dari Rp {s.priceStart.toLocaleString("id-ID")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Brief Proyek *</label>
            <textarea
              required
              rows={4}
              value={form.projectBrief}
              onChange={(e) => setForm((f) => ({ ...f, projectBrief: e.target.value }))}
              className="input-field resize-none"
              placeholder="Ceritakan detail proyek yang ingin dibuat, fitur-fitur yang diinginkan, referensi yang dimiliki, dll."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Estimasi Budget *</label>
            <input
              type="text"
              required
              value={form.budgetEstimate}
              onChange={(e) => setForm((f) => ({ ...f, budgetEstimate: e.target.value }))}
              className="input-field"
              placeholder="Contoh: Rp 5.000.000 - Rp 10.000.000"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memproses...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Kirim & Checkout via WhatsApp
              </span>
            )}
          </button>

          <p className="text-center text-white/40 text-xs">
            Setelah submit, Anda akan diarahkan ke WhatsApp untuk konfirmasi order.
          </p>
        </motion.form>
      </div>
    </section>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
interface HomeData {
  setting: SiteSettingItem;
  services: ServiceItem[];
  portfolio: PortfolioItem[];
  testimonials: TestimonialItem[];
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(null);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>();
  const orderFormRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    async function fetchAll() {
      const [settingRes, servicesRes, portfolioRes, testimonialsRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/services?active=true"),
        fetch("/api/portfolio?status=PUBLISHED&pageSize=12"),
        fetch("/api/testimonials?approved=true&pageSize=10"),
      ]);

      const [settingData, servicesData, portfolioData, testimonialsData] = await Promise.all([
        settingRes.json(),
        servicesRes.json(),
        portfolioRes.json(),
        testimonialsRes.json(),
      ]);

      setData({
        setting: settingData.data,
        services: servicesData.data ?? [],
        portfolio: portfolioData.data?.items ?? [],
        testimonials: testimonialsData.data?.items ?? [],
      });
    }
    fetchAll();
  }, []);

  const scrollToOrder = useCallback((serviceId?: string) => {
    setPreselectedServiceId(serviceId);
    orderFormRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16]">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-[#090d16]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-lg font-bold gradient-text">Portfolio.</span>
          <div className="hidden sm:flex items-center gap-6 text-sm text-white/70">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#portfolio" className="hover:text-white transition-colors">Portfolio</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
            <button onClick={() => scrollToOrder()} className="btn-primary py-2 px-4 text-sm">
              Hire Me
            </button>
          </div>
          <div className="flex sm:hidden gap-3">
            <button onClick={() => scrollToOrder()} className="btn-primary py-2 px-3 text-xs">Order</button>
            <a href="/track" className="btn-secondary py-2 px-3 text-xs">Track</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-4 min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 text-sm text-emerald-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              {data.setting.isOpenOrder ? "Open for new projects" : "Currently unavailable"}
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              {data.setting.heroHeadline}
            </h1>

            <div className="text-2xl sm:text-3xl font-semibold h-10">
              <TypingText roles={data.setting.heroRoles} />
            </div>

            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              {data.setting.heroSubheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button onClick={() => scrollToOrder()} className="btn-primary text-base px-8 py-4">
                Start a Project →
              </button>
              <a href="#portfolio" className="btn-secondary text-base px-8 py-4">
                View My Work
              </a>
            </div>

            <div className="flex flex-wrap gap-6 justify-center pt-8 text-sm text-white/50">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                100% Custom Code
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Mobile-First Design
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Free Post-Launch Support
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">What I Do</span>
            <h2 className="section-title mt-2">Services & Pricing</h2>
            <p className="section-subtitle">Transparent pricing, premium quality. No hidden fees.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <SpotlightCard className="glass-card-hover p-6 h-full flex flex-col cursor-pointer" >
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">{service.category}</span>
                    <h3 className="text-lg font-bold mt-1">{service.title}</h3>
                    <p className="text-white/60 text-sm mt-2 leading-relaxed">{service.shortDesc}</p>
                  </div>

                  <ul className="space-y-2 flex-1 mb-6">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                        <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <p className="text-xs text-white/40 mb-1">Starting from</p>
                    <p className="text-xl font-bold gradient-text">Rp {service.priceStart.toLocaleString("id-ID")}</p>
                    <button
                      onClick={() => scrollToOrder(service.id)}
                      className="btn-primary w-full mt-4 py-2 text-sm"
                    >
                      Pesan Sekarang
                    </button>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portfolio ── */}
      <section id="portfolio" className="py-24 px-4 bg-gradient-to-b from-transparent to-[#111827]/30">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">My Work</span>
            <h2 className="section-title mt-2">Featured Projects</h2>
            <p className="section-subtitle">Real projects. Real results. Click any project for the full case study.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.portfolio.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <SpotlightCard
                  className="glass-card-hover overflow-hidden cursor-pointer group h-full flex flex-col"
                >
                  <div
                    className="relative h-48 overflow-hidden"
                    onClick={() => setSelectedPortfolio(item)}
                  >
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent" />
                    {item.isFeatured && (
                      <div className="absolute top-3 right-3 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold px-2 py-1 rounded-full">
                        Featured
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col" onClick={() => setSelectedPortfolio(item)}>
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">{item.category}</span>
                    <h3 className="text-base font-bold mt-1 mb-2">{item.title}</h3>
                    <p className="text-white/60 text-sm flex-1 leading-relaxed">{item.shortDesc}</p>

                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {item.techStack.slice(0, 3).map((tech) => (
                        <span key={tech} className="text-xs bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/60">{tech}</span>
                      ))}
                      {item.techStack.length > 3 && (
                        <span className="text-xs text-white/40">+{item.techStack.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-4 flex gap-2">
                    <button onClick={() => setSelectedPortfolio(item)} className="flex-1 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                      View Case Study →
                    </button>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">Client Reviews</span>
            <h2 className="section-title mt-2">What Clients Say</h2>
            <p className="section-subtitle">Real testimonials from real clients. 100% verified orders.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.testimonials.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="glass-card p-6 h-full flex flex-col">
                  <StarRating rating={t.rating} />
                  <blockquote className="text-white/70 text-sm leading-relaxed mt-4 flex-1">
                    &quot;{t.content}&quot;
                  </blockquote>
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <p className="font-semibold text-sm">{t.clientName}</p>
                    <p className="text-white/40 text-xs mt-0.5">{t.clientRole}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Order Form ── */}
      <OrderSection
        services={data.services}
        defaultServiceId={preselectedServiceId}
        orderFormRef={orderFormRef}
        isOpenOrder={data.setting.isOpenOrder}
      />

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <span className="font-bold gradient-text text-base">Portfolio.</span>
          <div className="flex gap-6">
            <a href="/track" className="hover:text-white/70 transition-colors">Track Order</a>
            <a href="/admin" className="hover:text-white/70 transition-colors">Admin</a>
          </div>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>

      {/* ── Portfolio Modal ── */}
      {selectedPortfolio && (
        <PortfolioModal
          item={selectedPortfolio}
          onClose={() => setSelectedPortfolio(null)}
          onOrder={(serviceId) => {
            setSelectedPortfolio(null);
            scrollToOrder(serviceId);
          }}
        />
      )}
    </div>
  );
}

