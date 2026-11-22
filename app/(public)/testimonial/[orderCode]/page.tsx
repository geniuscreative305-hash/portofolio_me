"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TestimonialPage() {
  const { orderCode } = useParams<{ orderCode: string }>();
  const router = useRouter();

  const [form, setForm] = useState({
    clientName: "",
    clientRole: "",
    rating: 5,
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, orderCode }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Submission failed");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="glass-card p-12 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-emerald-400">Terima Kasih!</h2>
          <p className="text-white/60">Testimonial Anda sudah diterima dan sedang menunggu review. Terima kasih telah mempercayakan proyek Anda kepada kami!</p>
          <button onClick={() => router.push("/")} className="btn-primary w-full">Kembali ke Beranda</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col">
      <nav className="border-b border-white/5 px-4 h-16 flex items-center">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <a href="/" className="text-lg font-bold gradient-text">Portfolio.</a>
        </div>
      </nav>

      <div className="flex-1 px-4 py-16 flex items-center justify-center">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Tulis Testimonial</h1>
            <p className="text-white/60 mt-2">Order: <span className="font-mono text-emerald-400">{orderCode}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: star }))}
                    className="transition-transform hover:scale-110"
                  >
                    <svg
                      className={`w-8 h-8 transition-colors ${star <= form.rating ? "text-amber-400" : "text-white/20 hover:text-amber-400/50"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Nama Anda *</label>
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
              <label className="block text-sm font-medium text-white/70 mb-2">Jabatan / Role *</label>
              <input
                type="text"
                required
                value={form.clientRole}
                onChange={(e) => setForm((f) => ({ ...f, clientRole: e.target.value }))}
                className="input-field"
                placeholder="CEO, TechVenture Indonesia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Testimonial *</label>
              <textarea
                required
                rows={5}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className="input-field resize-none"
                placeholder="Ceritakan pengalaman Anda bekerja sama dengan kami..."
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Mengirim..." : "Kirim Testimonial"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

