"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { showToast } from "@/components/admin/Toast";
import type { SiteSettingItem } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Profile & About state
  const [ownerName, setOwnerName] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [aboutBio, setAboutBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("5");

  // Hero & Order state
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
        setOwnerName(s.ownerName || "Azi Ramdani");
        setProfilePhotoUrl(s.profilePhotoUrl || "");
        setAboutBio(s.aboutBio || "");
        setExperienceYears(String(s.experienceYears || 5));
        setHeroHeadline(s.heroHeadline || "");
        setHeroSubheadline(s.heroSubheadline || "");
        setHeroRolesText((s.heroRoles || []).join("\n"));
        setWhatsappNumber(s.whatsappNumber || "");
        setIsOpenOrder(s.isOpenOrder);
        setLoading(false);
      });
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "profile");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setProfilePhotoUrl(data.data.url);
        showToast("Profile photo uploaded to Vercel Blob", "success");
      } else {
        showToast(data.error ?? "Failed to upload photo", "error");
      }
    } catch {
      showToast("Network error during photo upload", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName,
          profilePhotoUrl,
          aboutBio,
          experienceYears: parseInt(experienceYears, 10) || 5,
          heroHeadline,
          heroSubheadline,
          heroRoles: heroRolesText.split("\n").map((r) => r.trim()).filter(Boolean),
          whatsappNumber,
          isOpenOrder,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Settings saved successfully", "success");
        setSettings(data.data);
      } else {
        showToast(data.error ?? "Failed to save settings", "error");
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

      {/* Profile & About Me Settings */}
      <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold">Profile &amp; About Me</h2>
          <p className="text-xs text-white/40 mt-0.5">Kelola foto profil, nama pemilik, dan deskripsi diri untuk halaman publik.</p>
        </div>

        {/* Profile Photo Uploader */}
        <div className="p-4 bg-[#1a2235] rounded-xl flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-28 h-36 rounded-2xl overflow-hidden border border-white/15 bg-black/30 flex-shrink-0">
            {profilePhotoUrl ? (
              <Image src={profilePhotoUrl} alt="Profile preview" fill className="object-cover object-top" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/30 text-xs">
                <span>No Photo</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3 w-full">
            <p className="font-medium text-sm">Foto Profil Utama</p>
            <p className="text-xs text-white/40">Foto ini tampil di Hero Section dengan floating badges dan di Section About.</p>

            <div className="flex flex-wrap gap-2">
              <label className="btn-primary text-xs py-2 px-4 cursor-pointer inline-flex items-center gap-2">
                {uploadingPhoto ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span>Upload Foto Baru (Vercel Blob)</span>
                  </>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
              </label>

              {profilePhotoUrl && (
                <button
                  type="button"
                  onClick={() => setProfilePhotoUrl("")}
                  className="btn-danger text-xs py-2 px-3"
                >
                  Hapus Foto
                </button>
              )}
            </div>

            <div>
              <label className="text-[11px] text-white/40 mb-1 block">Atau masukkan URL gambar langsung</label>
              <input
                type="text"
                value={profilePhotoUrl}
                onChange={(e) => setProfilePhotoUrl(e.target.value)}
                className="admin-input w-full text-xs font-mono"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">Nama Pemilik (Owner Name)</label>
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="admin-input w-full"
              placeholder="Azi Ramdani"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Pengalaman (Tahun)</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="admin-input w-full font-mono"
              placeholder="5"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1 block">Deskripsi Profil (About Me Bio)</label>
          <textarea
            value={aboutBio}
            onChange={(e) => setAboutBio(e.target.value)}
            rows={4}
            className="admin-input w-full resize-none text-sm leading-relaxed"
            placeholder="Dengan pengalaman mendalam dalam ekosistem digital, saya memadukan kepekaan estetika UI/UX kelas dunia, kecepatan eksekusi vibe coding..."
          />
        </div>
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

