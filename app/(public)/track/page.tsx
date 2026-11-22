"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { TrackerOrderItem } from "@/types";

const STAGES = [
  {
    key: "PENDING",
    title: "1. Konfirmasi & Analisis",
    subtitle: "Brief diterima & penjadwalan antrean",
    description: "Pesanan telah masuk ke sistem. Kami sedang menganalisis brief dan menyiapkan roadmap pengerjaan.",
    icon: "📋",
  },
  {
    key: "IN_PROGRESS",
    title: "2. Proses Pengerjaan",
    subtitle: "Eksekusi desain & koding intensif",
    description: "Proyek sedang dalam tahap produksi aktif (Desain UI/UX, Vibe Coding Next.js, atau Copywriting).",
    icon: "⚡",
  },
  {
    key: "REVISION",
    title: "3. Review & Sesi Revisi",
    subtitle: "Pratinjau hasil kerja & perbaikan",
    description: "Hasil demo telah diserahkan untuk dievaluasi oleh Anda. Sesi penyesuaian dan revisi berlangsung.",
    icon: "🔍",
  },
  {
    key: "COMPLETED",
    title: "4. Selesai & Handover",
    subtitle: "Serah terima aset & deployment live",
    description: "Proyek telah rampung 100%. Seluruh aset, akses hosting/repositori telah diserahkan siap pakai.",
    icon: "🎉",
  },
];

const STATUS_MAP: Record<string, { label: string; badge: string; color: string }> = {
  PENDING: {
    label: "Menunggu Konfirmasi",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    color: "text-amber-400",
  },
  IN_PROGRESS: {
    label: "Sedang Dikerjakan",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    color: "text-blue-400",
  },
  REVISION: {
    label: "Dalam Tahap Revisi",
    badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    color: "text-purple-400",
  },
  COMPLETED: {
    label: "Proyek Selesai",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    color: "text-emerald-400",
  },
  CANCELLED: {
    label: "Pesanan Dibatalkan",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    color: "text-red-400",
  },
};

function TrackContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") ?? "";
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<TrackerOrderItem | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchOrder = useCallback(async (targetCode: string) => {
    if (!targetCode.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/tracker?code=${encodeURIComponent(targetCode.trim().toUpperCase())}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Pesanan tidak ditemukan. Mohon pastikan kode order Anda benar.");
      } else {
        setResult(data.data);
      }
    } catch {
      setError("Gagal terhubung ke server. Silakan periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search if code parameter exists on page load
  useEffect(() => {
    if (initialCode) {
      fetchOrder(initialCode);
    }
  }, [initialCode, fetchOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(code);
  };

  const handleCopy = () => {
    if (!result?.orderCode) return;
    navigator.clipboard.writeText(result.orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const status = result?.status as string | undefined;
  const stageIndex = STAGES.findIndex((s) => s.key === status);
  const isCancelled = status === "CANCELLED";

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* ── Navbar ── */}
      <nav className="border-b border-white/5 bg-[#090d16]/80 backdrop-blur-md px-4 h-16 flex items-center sticky top-0 z-40">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-sm text-white/50 group-hover:text-white transition-colors">←</span>
            <span className="text-lg font-bold gradient-text">Portfolio.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Beranda
            </Link>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Tracker
            </span>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 px-4 py-12 relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header Title */}
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Pelacak Pesanan
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Kontrol Progres Pekerjaan
            </h1>
            <p className="text-white/60 text-sm sm:text-base max-w-lg mx-auto">
              Pantau tahapan pengerjaan proyek Anda secara transparan dan real-time dari konfirmasi hingga serah terima aset.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="glass-card p-2.5 sm:p-3 rounded-2xl flex flex-col sm:flex-row gap-2 border border-white/10 shadow-xl">
            <div className="relative flex-1 flex items-center">
              <svg className="w-5 h-5 text-white/40 absolute left-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Masukkan Kode Order (cth: ORD-20261122-0001)"
                className="w-full bg-transparent pl-12 pr-4 py-3 text-sm font-mono text-white placeholder-white/30 focus:outline-none uppercase"
                required
              />
              {code && (
                <button
                  type="button"
                  onClick={() => setCode("")}
                  className="text-white/40 hover:text-white px-3 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-3 px-7 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Mengecek...</span>
                </>
              ) : (
                <>
                  <span>Cek Progres</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Error Alert */}
          {error && (
            <div className="glass-card p-5 rounded-2xl border-red-500/30 bg-red-500/10 text-center space-y-2">
              <p className="text-red-400 font-semibold text-sm">⚠️ {error}</p>
              <p className="text-white/50 text-xs">
                Periksa kembali kode pesanan yang Anda terima saat submit order via WhatsApp.
              </p>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="space-y-6">
              {/* Order Overview Header */}
              <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div>
                    <span className="text-xs text-white/40 uppercase tracking-widest font-semibold block">
                      Kode Pesanan Anda
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-2xl font-black gradient-text">
                        {result.orderCode}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all flex items-center gap-1"
                        title="Salin Kode Order"
                      >
                        {copied ? (
                          <span className="text-emerald-400 font-semibold">Tersalin ✓</span>
                        ) : (
                          <span>Salin</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                        STATUS_MAP[status ?? ""]?.badge ?? "bg-white/10 text-white/60 border-white/10"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      {STATUS_MAP[status ?? ""]?.label ?? status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-white/40">Nama Pemesan</p>
                    <p className="text-sm font-semibold text-white">{result.clientName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-white/40">Layanan</p>
                    <p className="text-sm font-semibold text-emerald-400">
                      {result.service?.title ?? "Kustom"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-white/40">Estimasi Budget</p>
                    <p className="text-sm font-semibold text-white">{result.budgetEstimate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-white/40">Tanggal Order</p>
                    <p className="text-sm font-semibold text-white">
                      {new Date(result.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Brief Summary */}
                {result.projectBrief && (
                  <div className="pt-4 border-t border-white/5 space-y-1">
                    <p className="text-xs text-white/40">Brief Proyek:</p>
                    <p className="text-xs text-white/70 italic line-clamp-3 bg-black/20 p-3 rounded-xl border border-white/5">
                      &quot;{result.projectBrief}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* ── 4-Stage Milestone Progress Tracker ── */}
              {!isCancelled ? (
                <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Tahapan Eksekusi Pekerjaan</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-normal">
                        Fase {stageIndex >= 0 ? stageIndex + 1 : 1} dari 4
                      </span>
                    </h3>
                    <p className="text-xs text-white/50 mt-1">
                      Status diperbarui langsung oleh pengembang selama pengerjaan berlangsung.
                    </p>
                  </div>

                  {/* Horizontal Bar (Desktop) */}
                  <div className="hidden sm:flex items-center justify-between relative px-4">
                    <div className="absolute top-5 left-10 right-10 h-1 bg-white/10 -z-0">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
                        style={{
                          width: `${Math.max(0, Math.min(100, (stageIndex / (STAGES.length - 1)) * 100))}%`,
                        }}
                      />
                    </div>

                    {STAGES.map((s, idx) => {
                      const isDone = idx < stageIndex;
                      const isCurrent = idx === stageIndex;
                      return (
                        <div key={s.key} className="flex flex-col items-center text-center relative z-10 w-36">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold transition-all shadow-lg ${
                              isDone
                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                : isCurrent
                                ? "bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400 ring-4 ring-emerald-500/20 scale-110"
                                : "bg-[#111827] text-white/30 border border-white/10"
                            }`}
                          >
                            {isDone ? "✓" : s.icon}
                          </div>
                          <p
                            className={`text-xs font-semibold mt-3 ${
                              isCurrent ? "text-emerald-400 font-bold" : isDone ? "text-white" : "text-white/40"
                            }`}
                          >
                            {s.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vertical Stepper Cards (Mobile & Detailed View) */}
                  <div className="space-y-3 pt-2">
                    {STAGES.map((s, idx) => {
                      const isDone = idx < stageIndex;
                      const isCurrent = idx === stageIndex;
                      const isUpcoming = idx > stageIndex;

                      return (
                        <div
                          key={s.key}
                          className={`p-4 rounded-2xl border transition-all ${
                            isCurrent
                              ? "bg-gradient-to-r from-emerald-500/15 via-[#111827] to-cyan-500/10 border-emerald-500/40 shadow-lg"
                              : isDone
                              ? "bg-white/5 border-white/10 opacity-85"
                              : "bg-white/[0.02] border-white/5 opacity-50"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                                isDone
                                  ? "bg-emerald-500 text-white"
                                  : isCurrent
                                  ? "bg-emerald-500 text-white animate-pulse"
                                  : "bg-white/10 text-white/30"
                              }`}
                            >
                              {isDone ? "✓" : idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h4
                                  className={`text-sm font-bold ${
                                    isCurrent ? "text-emerald-300" : isDone ? "text-white" : "text-white/60"
                                  }`}
                                >
                                  {s.title}
                                </h4>
                                {isCurrent && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                                    Sedang Berlangsung
                                  </span>
                                )}
                                {isDone && (
                                  <span className="text-[10px] text-white/40">Selesai ✓</span>
                                )}
                              </div>
                              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                                {s.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="glass-card p-6 rounded-3xl border border-red-500/30 bg-red-500/10 text-center space-y-2">
                  <h3 className="text-lg font-bold text-red-400">Pesanan Dibatalkan</h3>
                  <p className="text-sm text-white/60 max-w-md mx-auto">
                    Pesanan ini telah dibatalkan. Silakan hubungi kami via WhatsApp jika terdapat kekeliruan atau ingin membuat pesanan baru.
                  </p>
                </div>
              )}

              {/* ── Live Admin Note ── */}
              {Boolean(result.adminNote) && (
                <div className="glass-card p-6 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-[#111827] to-cyan-500/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    Catatan Perkembangan Terkini dari Pengembang
                  </div>
                  <p className="text-white text-sm sm:text-base leading-relaxed pl-4 border-l-2 border-blue-400/50">
                    &ldquo;{result.adminNote}&rdquo;
                  </p>
                  <p className="text-[11px] text-white/40 pt-1">
                    Terakhir diperbarui: {new Date(result.updatedAt).toLocaleString("id-ID")}
                  </p>
                </div>
              )}

              {/* ── Action Buttons (WA & Testimonial) ── */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={`https://wa.me/${(result.adminWhatsapp || "6281234567890").replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Halo Azi! Saya ingin menanyakan update progres untuk kode order: ${result.orderCode} atas nama ${result.clientName}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm py-3 px-5 flex-1 flex items-center justify-center gap-2 border-emerald-500/30 text-white hover:border-emerald-500/60"
                >
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.584 1.792.898 2.791.899 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.768-5.77-5.768zm3.36 8.246c-.14.394-.81.758-1.121.808-.312.05-.72.079-1.164-.066-.279-.092-.64-.22-1.12-.428-1.954-.848-3.235-2.825-3.332-2.956-.098-.131-.795-1.057-.795-2.016 0-.959.502-1.429.681-1.625.179-.196.39-.246.52-.246.13 0 .26.002.373.007.12.006.279-.046.438.334.16.381.545 1.332.593 1.431.049.098.081.213.016.344-.065.131-.098.213-.196.328-.098.114-.207.255-.296.343-.098.098-.201.206-.086.403.114.196.508.839 1.09 1.357.75.669 1.383.876 1.58.974.197.098.312.082.427-.049.115-.131.492-.573.623-.77.131-.197.262-.164.442-.098.18.066 1.144.54 1.341.639.197.098.328.148.377.23.049.082.049.475-.091.869z" />
                  </svg>
                  <span>Tanya Progres via WhatsApp</span>
                </a>

                {status === "COMPLETED" && !result.hasSubmittedTestimonial && (
                  <Link
                    href={`/testimonial/${result.orderCode}`}
                    className="btn-primary text-sm py-3 px-6 flex-1 flex items-center justify-center gap-2"
                  >
                    <span>🎉 Beri Ulasan / Testimoni</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-4 text-center text-xs text-white/40">
        <p>&copy; {new Date().getFullYear()} Portfolio & Service Order System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-white/60">
          Memuat pelacak pesanan...
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
