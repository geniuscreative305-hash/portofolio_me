"use client";

import { useState, useMemo, useEffect, useCallback, useRef, MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ParticleCanvas from "@/components/public/ParticleCanvas";
import type { PortfolioItem, SiteSettingItem } from "@/types";

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

// ─── Portfolio Modal Detail ──────────────────────────────────────────────────
function PortfolioModal({
  item,
  onClose,
  whatsappNumber,
}: {
  item: PortfolioItem;
  onClose: () => void;
  whatsappNumber?: string;
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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          className="fixed inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative bg-[#0f1623] border border-[#1e2d42] rounded-3xl max-w-3xl w-full z-10 overflow-hidden shadow-2xl my-8 max-h-[90vh] flex flex-col"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative h-56 sm:h-72 w-full overflow-hidden flex-shrink-0">
            {item.thumbnailUrl ? (
              <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#111827] to-[#1f2d45] flex items-center justify-center">
                <svg className="w-12 h-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1623] via-transparent to-transparent" />
          </div>

          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                {item.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-white">{item.title}</h2>
              <p className="text-white/70 mt-2 text-sm sm:text-base leading-relaxed">{item.shortDesc}</p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                Tech Stack &amp; Tools
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/80"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {item.fullDescription && (
              <div className="prose prose-invert prose-sm max-w-none border-t border-white/5 pt-6 text-white/80 leading-relaxed whitespace-pre-line">
                {item.fullDescription}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
              {item.liveDemoUrl && (
                <a
                  href={item.liveDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm py-3 px-6 text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Buka Live Demo</span>
                </a>
              )}
              <a
                href={`https://wa.me/${(whatsappNumber || "6281234567890").replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Halo Azi! Saya tertarik dengan proyek "${item.title}". Bisakah kita diskusikan proyek serupa?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm py-3 px-6 text-center flex-1 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.584 1.792.898 2.791.899 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.768-5.77-5.768zm3.36 8.246c-.14.394-.81.758-1.121.808-.312.05-.72.079-1.164-.066-.279-.092-.64-.22-1.12-.428-1.954-.848-3.235-2.825-3.332-2.956-.098-.131-.795-1.057-.795-2.016 0-.959.502-1.429.681-1.625.179-.196.39-.246.52-.246.13 0 .26.002.373.007.12.006.279-.046.438.334.16.381.545 1.332.593 1.431.049.098.081.213.016.344-.065.131-.098.213-.196.328-.098.114-.207.255-.296.343-.098.098-.201.206-.086.403.114.196.508.839 1.09 1.357.75.669 1.383.876 1.58.974.197.098.312.082.427-.049.115-.131.492-.573.623-.77.131-.197.262-.164.442-.098.18.066 1.144.54 1.341.639.197.098.328.148.377.23.049.082.049.475-.091.869z" />
                </svg>
                <span>Konsultasikan Proyek Serupa via WhatsApp</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Main Portfolio Archive View Component ────────────────────────────────────
type FilterCategory = "ALL" | "VIBE_CODING" | "DESIGN" | "COPYWRITING";

export default function PortfolioArchiveView({
  initialPortfolio,
  setting,
}: {
  initialPortfolio: PortfolioItem[];
  setting: SiteSettingItem;
}) {
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const CATEGORY_TABS: { key: FilterCategory; label: string; icon: string }[] = [
    { key: "ALL", label: "Semua", icon: "✨" },
    { key: "VIBE_CODING", label: "Vibe Coding", icon: "⚡" },
    { key: "DESIGN", label: "Design", icon: "🎨" },
    { key: "COPYWRITING", label: "Copy Writing", icon: "🔥" },
  ];

  // Filtered and Searched Portfolio Items
  const filteredPortfolio = useMemo(() => {
    let result = initialPortfolio;

    // Filter by Category
    if (activeCategory === "VIBE_CODING") {
      result = result.filter((item) =>
        /vibe|code|coding|dev|web|app/i.test(item.category)
      );
    } else if (activeCategory === "DESIGN") {
      result = result.filter((item) =>
        /design|ui|ux|figma/i.test(item.category)
      );
    } else if (activeCategory === "COPYWRITING") {
      result = result.filter((item) =>
        /copy|writing|content/i.test(item.category)
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.shortDesc.toLowerCase().includes(q) ||
          item.techStack.some((tech) => tech.toLowerCase().includes(q))
      );
    }

    return result;
  }, [activeCategory, searchQuery, initialPortfolio]);

  return (
    <div className="min-h-screen bg-[#090d16] text-white relative overflow-hidden flex flex-col">
      {/* ── Interactive Particle Canvas ── */}
      <ParticleCanvas />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-[#090d16]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-white/50 group-hover:text-white transition-colors text-sm">←</span>
            <span className="text-lg font-bold gradient-text">Portfolio.</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Beranda
            </Link>
            <Link
              href="/track"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all text-xs font-semibold"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Cek Order</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 pt-28 pb-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
              Project Archive &amp; Case Studies
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Arsip Lengkap Portofolio
            </h1>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed">
              Jelajahi seluruh karya, arsitektur sistem web app, rancangan UI/UX, dan copywriting berkonversi tinggi yang telah dirilis.
            </p>
          </div>

          {/* Search Bar & Stats */}
          <div className="max-w-xl mx-auto">
            <div className="glass-card p-2 rounded-2xl flex items-center border border-white/10 shadow-lg">
              <svg className="w-5 h-5 text-white/40 ml-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan judul, teknologi (Next.js, Figma), dll..."
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-white/40 hover:text-white px-3 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={`
                    px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2
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

          {/* 2-Column Grid on Mobile, 3/4 cols on Desktop */}
          <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
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
                      className="relative h-28 sm:h-44 overflow-hidden"
                      onClick={() => setSelectedPortfolio(item)}
                    >
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#111827] to-[#1f2d45] flex items-center justify-center">
                          <svg className="w-8 sm:w-10 h-8 sm:h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent" />
                      {item.isFeatured && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full">
                          Featured
                        </div>
                      )}
                    </div>

                    <div className="p-3 sm:p-5 flex-1 flex flex-col" onClick={() => setSelectedPortfolio(item)}>
                      <span className="text-[10px] sm:text-xs font-semibold text-cyan-400 uppercase tracking-widest">
                        {item.category}
                      </span>
                      <h3 className="text-xs sm:text-base font-bold mt-0.5 sm:mt-1 mb-1 line-clamp-1 sm:line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-white/60 text-[11px] sm:text-sm flex-1 leading-relaxed line-clamp-2">
                        {item.shortDesc}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-2 sm:mt-4">
                        {item.techStack.slice(0, 2).map((tech) => (
                          <span
                            key={tech}
                            className="text-[9px] sm:text-xs bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/60"
                          >
                            {tech}
                          </span>
                        ))}
                        {item.techStack.length > 2 && (
                          <span className="text-[9px] sm:text-xs text-white/40">+{item.techStack.length - 2}</span>
                        )}
                      </div>
                    </div>

                    <div className="px-3 sm:px-5 pb-3 sm:pb-4 flex gap-2">
                      <button
                        onClick={() => setSelectedPortfolio(item)}
                        className="flex-1 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors text-left"
                      >
                        View Case Study →
                      </button>
                    </div>
                  </SpotlightCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filteredPortfolio.length === 0 && (
            <div className="text-center py-20 text-white/40 text-sm glass-card max-w-md mx-auto p-8 space-y-3">
              <span className="text-3xl block">🔍</span>
              <p className="font-semibold text-white/80">Tidak ada proyek yang sesuai</p>
              <p className="text-xs text-white/50">
                Coba ubah kata kunci pencarian atau ganti kategori filter di atas.
              </p>
              <button
                onClick={() => {
                  setActiveCategory("ALL");
                  setSearchQuery("");
                }}
                className="btn-secondary text-xs py-2 px-4 mt-2"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-4 relative z-10 text-center text-xs text-white/40 space-y-2">
        <p>&copy; {new Date().getFullYear()} {setting.ownerName || "Azi Ramdani"}. All rights reserved.</p>
        <Link href="/" className="text-emerald-400 hover:underline">
          ← Kembali ke Halaman Utama
        </Link>
      </footer>

      {/* ── Portfolio Modal ── */}
      {selectedPortfolio && (
        <PortfolioModal
          item={selectedPortfolio}
          onClose={() => setSelectedPortfolio(null)}
          whatsappNumber={setting.whatsappNumber}
        />
      )}
    </div>
  );
}

