"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/components/admin/Toast";
import type { SiteSettingItem } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");
  const [heroRolesText, setHeroRolesText] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isOpenOrder, setIsOpenOrder] = useState(true);

  // PIN change
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [changingPin, setChangingPin] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const s: SiteSettingItem = data.data;
        setSettings(s);
        setHeroHeadline(s.heroHeadline);
        setHeroSubheadline(s.heroSubheadline);
        setHeroRolesText(s.heroRoles.join("\n"));
        setWhatsappNumber(s.whatsappNumber);
        setIsOpenOrder(s.isOpenOrder);
        setLoading(false);
      });
  }, []);

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroHeadline,
          heroSubheadline,
          heroRoles: heroRolesText.split("\n").map((r) => r.trim()).filter(Boolean),
          whatsappNumber,
          isOpenOrder,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Settings saved", "success");
        setSettings(data.data);
      } else {
        showToast(data.error ?? "Failed to save", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePin = async () => {
    if (!currentPin || !newPin) { showToast("Fill in all PIN fields", "warning"); return; }
    if (newPin !== confirmPin) { showToast("New PIN and confirm PIN don't match", "error"); return; }
    if (newPin.length < 6) { showToast("PIN must be at least 6 characters", "warning"); return; }

    setChangingPin(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("PIN changed successfully", "success");
        setCurrentPin(""); setNewPin(""); setConfirmPin("");
      } else {
        showToast(data.error ?? "Failed to change PIN", "error");
      }
    } finally {
      setChangingPin(false);
    }
  };

  if (loading) {
    return <div className="p-6"><div className="h-8 w-32 bg-white/10 rounded animate-pulse" /></div>;
  }

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-white/40 text-sm mt-0.5">Configure site content and preferences</p>
      </div>

      {/* General Settings */}
      <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-6 space-y-6">
        <h2 className="text-base font-semibold">General Settings</h2>

        {/* Order Toggle */}
        <div className="flex items-center justify-between p-4 bg-[#1a2235] rounded-xl">
          <div>
            <p className="font-medium text-sm">Order System</p>
            <p className="text-xs text-white/40 mt-0.5">Toggle to open/close the public order form</p>
          </div>
          <button
            onClick={() => setIsOpenOrder((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOpenOrder ? "bg-emerald-500" : "bg-white/20"}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isOpenOrder ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1 block">WhatsApp Number (digits only)</label>
          <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="admin-input w-full font-mono" placeholder="6281234567890" />
          <p className="text-xs text-white/30 mt-1">Include country code without +. Example: 6281234567890</p>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1 block">Hero Headline</label>
          <input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} className="admin-input w-full" />
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1 block">Hero Sub-headline</label>
          <textarea value={heroSubheadline} onChange={(e) => setHeroSubheadline(e.target.value)} rows={3} className="admin-input w-full resize-none" />
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1 block">Hero Typing Roles (one per line)</label>
          <textarea
            value={heroRolesText}
            onChange={(e) => setHeroRolesText(e.target.value)}
            rows={5}
            className="admin-input w-full resize-none font-mono text-xs"
            placeholder={"Full-Stack Developer\nUI/UX Designer\nMobile App Expert"}
          />
          <p className="text-xs text-white/30 mt-1">These will be cycled through the typing animation on the homepage</p>
        </div>

        {/* Preview */}
        {heroRolesText.trim() && (
          <div className="bg-black/20 rounded-xl p-4">
            <p className="text-xs text-white/40 mb-2">Preview roles:</p>
            <div className="flex flex-wrap gap-2">
              {heroRolesText.split("\n").filter(Boolean).map((r, i) => (
                <span key={i} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full">{r}</span>
              ))}
            </div>
          </div>
        )}

        {settings?.updatedAt && (
          <p className="text-xs text-white/30">Last updated: {new Date(settings.updatedAt).toLocaleString("id-ID")}</p>
        )}

        <button onClick={handleSaveGeneral} disabled={saving} className="btn-primary text-sm py-2 px-6 disabled:opacity-50">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Change PIN */}
      <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold">Change Admin PIN</h2>
        <p className="text-xs text-white/40">Your PIN is securely hashed with bcrypt. It is never stored in plain text.</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Current PIN</label>
            <input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} className="admin-input w-full" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">New PIN (min 6 chars)</label>
            <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} className="admin-input w-full" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Confirm New PIN</label>
            <input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} className="admin-input w-full" placeholder="••••••••" />
          </div>
        </div>

        <button onClick={handleChangePin} disabled={changingPin || !currentPin || !newPin} className="btn-primary text-sm py-2 px-6 disabled:opacity-50">
          {changingPin ? "Changing..." : "Change PIN"}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-3">
        <h2 className="text-base font-semibold text-red-400">System Info</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-white/40">Default Seed PIN</p>
            <code className="text-white/70 mt-1 block">admin1234</code>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-white/40">Session Duration</p>
            <code className="text-white/70 mt-1 block">7 days (HTTP-only JWT)</code>
          </div>
        </div>
      </div>
    </div>
  );
}

