"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [gateKey, setGateKey] = useState("");
  const [pin, setPin] = useState("");
  const [honeyTrap, setHoneyTrap] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _sec_gate_token: gateKey,
          _sec_adm_token: pin,
          _auth_usr_trap: honeyTrap,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Autentikasi gagal.");
        setPin("");
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      setError("Terjadi gangguan jaringan. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Shield Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-3 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
            <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Vault</h1>
          <p className="text-white/40 text-xs mt-1">Multi-Tier Protected Admin Gate</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="glass-card p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl rounded-2xl">
          {/* Honeypot trap field (hidden from human eyes, traps bots) */}
          <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
            <input
              type="text"
              name="_auth_usr_trap"
              value={honeyTrap}
              onChange={(e) => setHoneyTrap(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Tier 1: Security Gate Passkey */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white/70">1. Gate Access Passkey</label>
              <span className="text-[10px] text-cyan-400 font-mono">Tier-1 Auth</span>
            </div>
            <input
              type="password"
              required
              value={gateKey}
              onChange={(e) => setGateKey(e.target.value)}
              className="input-field text-sm font-mono tracking-wider placeholder:text-white/20"
              placeholder="Passkey Gerbang (ADMIN-PRO-2026)"
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Tier 2: Master Security PIN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white/70">2. Admin Master PIN</label>
              <span className="text-[10px] text-emerald-400 font-mono">Tier-2 Auth</span>
            </div>
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="input-field text-center text-xl tracking-[0.4em] font-mono"
              placeholder="••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-2.5 text-red-400 text-xs text-center leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin || !gateKey}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memverifikasi...
              </span>
            ) : (
              "Otorisasi & Masuk →"
            )}
          </button>
        </form>

        <p className="text-center text-white/20 text-[11px]">
          Dilindungi oleh Zero-Trust Multi-Tier Authentication &amp; Brute-Force Shield.
        </p>
      </div>
    </div>
  );
}

