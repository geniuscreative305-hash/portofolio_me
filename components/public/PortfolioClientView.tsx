"use client";

import { useState, useEffect, useRef, useCallback, useMemo, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ParticleCanvas from "@/components/public/ParticleCanvas";
import type {
  ServiceItem,
  PortfolioItem,
  TestimonialItem,
  SiteSettingItem,
  OrderFormData,
} from "@/types";

// ─── Hero Typing Animation ───────────────────────────────────────────────────
function TypingText({ roles }: { roles: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!roles || !roles.length) return;
    const current = roles[currentIndex % roles.length];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayText === current) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setCurrentIndex((i) => (i + 1) % roles.length);
    } else {
      const delta = isDeleting ? 45 : 85;
      timeout = setTimeout(() => {
        setDisplayText(
          isDeleting
            ? current.slice(0, displayText.length - 1)
            : current.slice(0, displayText.length + 1)
        );
      }, delta);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex, roles]);

  return (
    <span className="gradient-text font-bold">
      {displayText}
      <span className="animate-pulse text-emerald-400">|</span>
    </span>
  );
}

// ─── Spotlight Card ───────────────────────────────────────────────────────────
function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
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
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-amber-400" : "text-white/20"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
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
        <motion.div
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        <motion.div
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card z-10"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative h-64 w-full overflow-hidden rounded-t-2xl">
            <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] to-transparent" />
          </div>

          <div className="p-6 space-y-6">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                {item.category}
              </span>
              <h2 className="text-2xl font-bold mt-1">{item.title}</h2>
              <p className="text-white/60 mt-2">{item.shortDesc}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white/80"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
                Case Study
              </h3>
              <div className="text-white/70 leading-relaxed whitespace-pre-line text-sm">
                {item.fullDescription}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {item.liveDemoUrl && (
                <a
                  href={item.liveDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Live Demo
                </a>
              )}
              {item.relatedServiceId && (
                <button
                  onClick={() => {
                    onClose();
                    onOrder(item.relatedServiceId!);
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
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

// ─── Order Form Section ───────────────────────────────────────────────────────
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
    serviceId: defaultServiceId ?? services[0]?.id ?? "",
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
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
              <option value="" disabled>
                -- Pilih Layanan --
              </option>
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
              placeholder="Ceritakan detail proyek yang ingin dibuat, fitur yang diinginkan, dll."
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
                Kirim &amp; Checkout via WhatsApp
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

// ─── Main Interactive Client View ─────────────────────────────────────────────
type FilterCategory = "ALL" | "VIBE_CODING" | "DESIGN" | "COPYWRITING";

export default function PortfolioClientView({
  setting,
  services,
  initialPortfolio,
  testimonials,
}: {
  setting: SiteSettingItem;
  services: ServiceItem[];
  initialPortfolio: PortfolioItem[];
  testimonials: TestimonialItem[];
}) {
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(null);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("ALL");
  const orderFormRef = useRef<HTMLElement | null>(null);

  const scrollToOrder = useCallback((serviceId?: string) => {
    setPreselectedServiceId(serviceId);
    orderFormRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Filtered Portfolio (Instant 0ms response)
  const filteredPortfolio = useMemo(() => {
    if (activeCategory === "ALL") return initialPortfolio;
    if (activeCategory === "VIBE_CODING") {
      return initialPortfolio.filter((item) =>
        /vibe|code|coding|dev|web|app/i.test(item.category)
      );
    }
    if (activeCategory === "DESIGN") {
      return initialPortfolio.filter((item) =>
        /design|ui|ux|figma/i.test(item.category)
      );
    }
    if (activeCategory === "COPYWRITING") {
      return initialPortfolio.filter((item) =>
        /copy|writing|content/i.test(item.category)
      );
    }
    return initialPortfolio;
  }, [activeCategory, initialPortfolio]);

  const CATEGORY_TABS: { key: FilterCategory; label: string; icon: string }[] = [
    { key: "ALL", label: "Semua", icon: "✨" },
    { key: "VIBE_CODING", label: "Vibe Coding", icon: "⚡" },
    { key: "DESIGN", label: "Design", icon: "🎨" },
    { key: "COPYWRITING", label: "Copy Writing", icon: "🔥" },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] relative overflow-hidden">
      {/* ── Interactive Particle Canvas ── */}
      <ParticleCanvas />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-[#090d16]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="#home" className="text-lg font-bold gradient-text">
            Portfolio.
          </a>
          <div className="hidden sm:flex items-center gap-6 text-sm text-white/70">
            <a href="#home" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
            <a href="#services" className="hover:text-white transition-colors">
              Services
            </a>
            <a href="#portfolio" className="hover:text-white transition-colors">
              Portfolio
            </a>
            <a href="#testimonials" className="hover:text-white transition-colors">
              Reviews
            </a>
            <a
              href="/track"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all text-xs font-semibold"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Cek Order</span>
            </a>
            <button onClick={() => scrollToOrder()} className="btn-primary py-2 px-4 text-sm">
              Hire Me
            </button>
          </div>
          <div className="flex sm:hidden items-center gap-2">
            <a href="#about" className="text-xs text-white/70 py-1.5 px-2">
              About
            </a>
            <a href="/track" className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1 text-emerald-400 border-emerald-500/30">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Cek Order</span>
            </a>
            <button onClick={() => scrollToOrder()} className="btn-primary py-1.5 px-2.5 text-xs">
              Order
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero (Home) ── */}
      <section id="home" className="pt-32 pb-20 px-4 min-h-screen flex items-center relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column (Content) */}
            <motion.div
              className="lg:col-span-7 space-y-6 text-left"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium text-amber-400 shadow-sm">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                AVAILABLE FOR NEW PROJECTS
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.14]">
                Hi! I&apos;m{" "}
                <span className="text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                  {setting.ownerName || "Azi Ramdani"}
                </span>
                ,
                <br />
                <span className="text-white">Crafting High-Impact Digital Experiences.</span>
              </h1>

              <div className="text-xl sm:text-2xl font-semibold h-9 flex items-center">
                <TypingText
                  roles={
                    setting.heroRoles?.length
                      ? setting.heroRoles
                      : ["Full-Stack Vibe Coder", "UI/UX Specialist", "Persuasive Copywriter"]
                  }
                />
              </div>

              <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-xl">
                {setting.heroSubheadline ||
                  "Memadukan kepekaan estetika UI/UX kelas dunia, kecepatan eksekusi vibe coding (Apps Script & Web App), serta kekuatan seni copywriting yang berorientasi konversi."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a
                  href="#services"
                  className="btn-primary text-base px-7 py-3.5 text-center flex items-center justify-center gap-2"
                >
                  <span>Pilih Paket Jasa</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
                <a
                  href={`https://wa.me/${setting.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
                    "Halo " + (setting.ownerName || "Azi Ramdani") + "! Saya ingin konsultasi proyek."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-base px-7 py-3.5 text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.584 1.792.898 2.791.899 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.768-5.77-5.768zm3.36 8.246c-.14.394-.81.758-1.121.808-.312.05-.72.079-1.164-.066-.279-.092-.64-.22-1.12-.428-1.954-.848-3.235-2.825-3.332-2.956-.098-.131-.795-1.057-.795-2.016 0-.959.502-1.429.681-1.625.179-.196.39-.246.52-.246.13 0 .26.002.373.007.12.006.279-.046.438.334.16.381.545 1.332.593 1.431.049.098.081.213.016.344-.065.131-.098.213-.196.328-.098.114-.207.255-.296.343-.098.098-.201.206-.086.403.114.196.508.839 1.09 1.357.75.669 1.383.876 1.58.974.197.098.312.082.427-.049.115-.131.492-.573.623-.77.131-.197.262-.164.442-.098.18.066 1.144.54 1.341.639.197.098.328.148.377.23.049.082.049.475-.091.869z" />
                  </svg>
                  <span>Konsultasi WA</span>
                </a>
              </div>

              <div className="flex flex-wrap gap-5 pt-4 text-xs sm:text-sm text-white/50">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  100% Custom Code
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Mobile-First Design
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Free Post-Launch Support
                </span>
              </div>
            </motion.div>

            {/* Right Column (Photo & Floating Badges) */}
            <motion.div
              className="lg:col-span-5 relative flex justify-center pt-6 lg:pt-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/25 via-cyan-500/20 to-amber-500/15 rounded-3xl blur-2xl opacity-75" />

              <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[4/5] rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-white/10 to-[#111827] shadow-2xl">
                <Image
                  src={
                    setting.profilePhotoUrl ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
                  }
                  alt={setting.ownerName || "Azi Ramdani"}
                  fill
                  className="object-cover object-top"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent opacity-60" />
              </div>

              {/* Floating Badge 1: Vibe Coding */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -top-3 -left-2 sm:-left-6 z-20 px-4 py-2.5 rounded-2xl bg-[#111827]/90 backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-white hover:scale-105 transition-transform"
              >
                <span className="text-amber-400 text-base">⚡</span>
                <span>Vibe Coding</span>
              </motion.div>

              {/* Floating Badge 2: UI/UX Specialist */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut", delay: 0.4 }}
                className="absolute top-1/2 -right-3 sm:-right-8 z-20 px-4 py-2.5 rounded-2xl bg-[#111827]/90 backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-white hover:scale-105 transition-transform"
              >
                <span className="text-base">🎨</span>
                <span>UI/UX Specialist</span>
              </motion.div>

              {/* Floating Badge 3: Copywriting */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut", delay: 0.8 }}
                className="absolute -bottom-3 left-4 sm:left-6 z-20 px-4 py-2.5 rounded-2xl bg-[#111827]/90 backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-white hover:scale-105 transition-transform"
              >
                <span className="text-base">🔥</span>
                <span>Copywriting</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section About ── */}
      <section
        id="about"
        className="py-24 px-4 relative z-10 border-t border-white/5 bg-gradient-to-b from-transparent via-[#111827]/30 to-transparent"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column (Photo with Experience Badge) */}
            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 bg-[#111827] shadow-2xl">
                <Image
                  src={
                    setting.profilePhotoUrl ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
                  }
                  alt={setting.ownerName || "Azi Ramdani"}
                  fill
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent opacity-70" />

                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#0e1726]/90 border border-emerald-500/30 backdrop-blur-md shadow-lg flex items-center gap-4">
                  <div className="text-3xl font-black text-amber-400 leading-none">
                    {setting.experienceYears || 5}+
                  </div>
                  <div className="text-xs text-white/80 font-medium leading-snug">
                    Tahun Berpengalaman di Desain &amp; Automasi Web
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column (Bio & 4-Step Workflow) */}
            <motion.div
              className="lg:col-span-7 space-y-6"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3.5 py-1 text-xs font-semibold text-amber-400 uppercase tracking-widest">
                Tentang Saya
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                {setting.ownerName || "Azi Ramdani"}
              </h2>

              <p className="text-base sm:text-lg font-semibold gradient-text">
                Product Designer, Full-Stack Vibe Coder &amp; Persuasive Copywriter berbasis di Indonesia.
              </p>

              <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                {setting.aboutBio ||
                  "Dengan pengalaman mendalam dalam ekosistem digital, saya memadukan kepekaan estetika UI/UX kelas dunia, kecepatan eksekusi vibe coding (Apps Script & Web App), serta kekuatan seni copywriting yang berorientasi konversi."}
              </p>

              <div className="pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">
                  BAGAIMANA SAYA BEKERJA (4-STEP WORKFLOW)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    {
                      step: "01",
                      title: "Discovery & Strategy",
                      desc: "Membedah audiens, merancang USP, dan menyusun penawaran utama.",
                    },
                    {
                      step: "02",
                      title: "Design & Wireframing",
                      desc: "Rancangan visual interaktif berestetika tinggi dan navigasi intuitif.",
                    },
                    {
                      step: "03",
                      title: "Vibe Coding & Automation",
                      desc: "Pengembangan sistem cepat (SPA + Database API + WhatsApp).",
                    },
                    {
                      step: "04",
                      title: "Review & Handover",
                      desc: "Pengujian performa bebas error dan serah terima aset siap pakai.",
                    },
                  ].map((w) => (
                    <div
                      key={w.step}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/8"
                    >
                      <div className="flex items-center gap-2 font-mono font-bold text-amber-400 text-sm mb-1">
                        <span>{w.step}</span>
                        <span className="text-white/30">/</span>
                        <span className="text-white font-sans text-xs font-semibold">{w.title}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{w.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">What I Do</span>
            <h2 className="section-title mt-2">Services &amp; Pricing</h2>
            <p className="section-subtitle">Transparent pricing, premium quality. No hidden fees.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <SpotlightCard className="glass-card-hover p-6 h-full flex flex-col cursor-pointer">
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
                      {service.category}
                    </span>
                    <h3 className="text-lg font-bold mt-1">{service.title}</h3>
                    <p className="text-white/60 text-sm mt-2 leading-relaxed">{service.shortDesc}</p>
                  </div>

                  <ul className="space-y-2 flex-1 mb-6">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                        <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <p className="text-xs text-white/40 mb-1">Starting from</p>
                    <p className="text-xl font-bold gradient-text">
                      Rp {service.priceStart.toLocaleString("id-ID")}
                    </p>
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

      {/* ── Portfolio Section with Category Filter ── */}
      <section id="portfolio" className="py-24 px-4 bg-gradient-to-b from-transparent to-[#111827]/30 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">My Work</span>
            <h2 className="section-title mt-2">Featured Projects</h2>
            <p className="section-subtitle">Real projects. Real results. Click any project for the full case study.</p>
          </motion.div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={`
                    px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2
                    ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-105"
                        : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10"
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Portfolio Grid with Framer Motion Layout */}
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredPortfolio.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <SpotlightCard className="glass-card-hover overflow-hidden cursor-pointer group h-full flex flex-col">
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
                      <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
                        {item.category}
                      </span>
                      <h3 className="text-base font-bold mt-1 mb-2">{item.title}</h3>
                      <p className="text-white/60 text-sm flex-1 leading-relaxed">{item.shortDesc}</p>

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {item.techStack.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="text-xs bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/60"
                          >
                            {tech}
                          </span>
                        ))}
                        {item.techStack.length > 3 && (
                          <span className="text-xs text-white/40">+{item.techStack.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-4 flex gap-2">
                      <button
                        onClick={() => setSelectedPortfolio(item)}
                        className="flex-1 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors text-left"
                      >
                        View Case Study →
                      </button>
                    </div>
                  </SpotlightCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredPortfolio.length === 0 && (
            <div className="text-center py-16 text-white/40 text-sm glass-card max-w-md mx-auto p-8">
              Belum ada proyek untuk kategori ini.
            </div>
          )}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">Client Reviews</span>
            <h2 className="section-title mt-2">What Clients Say</h2>
            <p className="section-subtitle">Real testimonials from real clients. 100% verified orders.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
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
        services={services}
        defaultServiceId={preselectedServiceId}
        orderFormRef={orderFormRef}
        isOpenOrder={setting.isOpenOrder}
      />

      {/* ── Quick Order Tracker Banner ── */}
      <section className="py-12 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-black/40 to-blue-500/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Order Tracking
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Sudah Pernah Order Proyek?
              </h3>
              <p className="text-sm text-white/60 max-w-lg">
                Pantau progres dan milestone pekerjaan Anda secara real-time langsung menggunakan kode order.
              </p>
            </div>
            <a
              href="/track"
              className="btn-primary whitespace-nowrap px-6 py-3 text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
            >
              <span>Cek Status Order</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-4 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <span className="font-bold gradient-text text-base">Portfolio.</span>
          <div className="flex gap-6">
            <a href="#about" className="hover:text-white/70 transition-colors">
              About
            </a>
            <a href="/track" className="hover:text-white/70 transition-colors">
              Track Order
            </a>
            <a href="/admin" className="hover:text-white/70 transition-colors">
              Admin
            </a>
          </div>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
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

