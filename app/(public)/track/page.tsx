"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { TrackerOrderItem } from "@/types";

function TrackContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [result, setResult] = useState<TrackerOrderItem | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const STATUS_STEPS = ["PENDING", "IN_PROGRESS", "REVISION", "COMPLETED"];
  const STATUS_LABELS: Record<string, string> = {
    PENDING: "Menunggu Konfirmasi",
    IN_PROGRESS: "Sedang Dikerjakan",
    REVISION: "Revisi",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  const STATUS_COLORS: Record<string, string> = {
    PENDING: "text-amber-400",
    IN_PROGRESS: "text-blue-400",
    REVISION: "text-purple-400",
    COMPLETED: "text-emerald-400",
    CANCELLED: "text-red-400",
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/tracker?code=${encodeURIComponent(code.trim().toUpperCase())}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Order not found");
      } else {
        setResult(data.data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const status = result?.status as string | undefined;
  const stepIndex = STATUS_STEPS.indexOf(status ?? "");

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col">
      <nav className="border-b border-white/5 px-4 h-16 flex items-center">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <a href="/" className="text-lg font-bold gradient-text">Portfolio.</a>
          <span className="text-white/60 text-sm">Order Tracker</span>
        </div>
      </nav>

      <div className="flex-1 px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Track Your Order</h1>
            <p className="text-white/60 mt-2">Enter your order code to check the status</p>
          </div>

          <form onSubmit={handleSearch} className="glass-card p-6 flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. ORD-20261122-0001"
              className="input-field flex-1 font-mono uppercase"
            />
            <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap disabled:opacity-50">
              {loading ? "..." : "Track"}
            </button>
          </form>

          {error && (
            <div className="glass-card p-6 border-red-500/20 bg-red-500/5">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Order Code</p>
                    <p className="font-mono text-xl font-bold gradient-text mt-1">{result.orderCode as string}</p>
                  </div>
                  <span className={`font-semibold text-sm ${STATUS_COLORS[status ?? ""] ?? "text-white/60"}`}>
                    {STATUS_LABELS[status ?? ""] ?? status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/40 text-xs">Client</p>
                    <p className="font-medium text-sm mt-0.5">{result.clientName as string}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Service</p>
                    <p className="font-medium text-sm mt-0.5">{(result.service as { title: string })?.title ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Budget</p>
                    <p className="font-medium text-sm mt-0.5">{result.budgetEstimate as string}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Date</p>
                    <p className="font-medium text-sm mt-0.5">
                      {new Date(result.createdAt as string).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Progress Steps */}
                {status !== "CANCELLED" && (
                  <div className="mt-6">
                    <div className="flex items-center gap-0">
                      {STATUS_STEPS.map((step, i) => (
                        <div key={step} className="flex-1 flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all
                            ${i <= stepIndex ? "bg-emerald-500 text-white" : "bg-white/10 text-white/30"}`}>
                            {i < stepIndex ? "✓" : i + 1}
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 ${i < stepIndex ? "bg-emerald-500" : "bg-white/10"}`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      {STATUS_STEPS.map((step) => (
                        <span key={step} className="text-xs text-white/40 text-center flex-1 first:text-left last:text-right">
                          {STATUS_LABELS[step]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Boolean(result.adminNote) && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Admin Note</p>
                    <p className="text-white/80 text-sm">{result.adminNote}</p>
                  </div>
                )}

                {status === "COMPLETED" && !result.hasSubmittedTestimonial && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                    <p className="text-emerald-400 font-semibold mb-2">🎉 Proyek selesai!</p>
                    <p className="text-white/60 text-sm mb-3">Bagikan pengalaman Anda untuk membantu klien lain.</p>
                    <a
                      href={`/testimonial/${result.orderCode}`}
                      className="btn-primary text-sm py-2 px-4 inline-block"
                    >
                      Tulis Testimonial
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense>
      <TrackContent />
    </Suspense>
  );
}

