"use client";

import { useState, useEffect, useCallback } from "react";
import { showToast } from "@/components/admin/Toast";
import type { ServiceItem } from "@/types";

interface ServiceForm {
  title: string;
  slug: string;
  category: string;
  shortDesc: string;
  priceStart: string;
  features: string;
  isActive: boolean;
  sortOrder: string;
}

const EMPTY_FORM: ServiceForm = { title: "", slug: "", category: "", shortDesc: "", priceStart: "", features: "", isActive: true, sortOrder: "0" };

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal("create"); };
  const openEdit = (s: ServiceItem) => {
    setForm({ title: s.title, slug: s.slug, category: s.category, shortDesc: s.shortDesc, priceStart: String(s.priceStart), features: s.features.join("\n"), isActive: s.isActive, sortOrder: String(s.sortOrder) });
    setEditId(s.id);
    setModal("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, priceStart: parseInt(form.priceStart, 10), sortOrder: parseInt(form.sortOrder, 10), features: form.features.split("\n").filter(Boolean) };
      const isEdit = modal === "edit" && editId;
      const res = await fetch(isEdit ? `/api/services/${editId}` : "/api/services", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(isEdit ? "Service updated" : "Service created", "success");
        setModal(null);
        fetchServices();
      } else {
        showToast(data.error ?? "Failed to save", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current }) });
    if (res.ok) { showToast(`Service ${!current ? "activated" : "deactivated"}`, "success"); fetchServices(); }
  };

  const deleteService = async (id: string, title: string) => {
    if (!confirm(`Delete service "${title}"?`)) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("Service deleted", "success"); fetchServices(); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 admin-page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Services</h1>
          <p className="text-white/40 text-xs sm:text-sm mt-0.5">Paket layanan dan penawaran jasa · <span className="text-emerald-400 font-semibold">{services.length} layanan</span></p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2.5 px-4 flex items-center gap-2 self-start sm:self-auto shadow-lg hover:scale-105 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-[#111827] border border-[#1f2d45] rounded-xl p-5 h-48 animate-pulse" />)
        ) : services.map((s) => (
          <div key={s.id} className="bg-[#111827] border border-[#1f2d45] rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-cyan-400 font-semibold uppercase">{s.category}</span>
                <h3 className="font-semibold mt-0.5">{s.title}</h3>
              </div>
              <button
                onClick={() => toggleActive(s.id, s.isActive)}
                className={`flex-shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${s.isActive ? "bg-emerald-500" : "bg-white/20"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${s.isActive ? "translate-x-[18px]" : "translate-x-0.5"}`} />
              </button>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">{s.shortDesc}</p>
            <p className="text-sm font-bold gradient-text">Rp {s.priceStart.toLocaleString("id-ID")}</p>
            <div className="flex gap-2 mt-auto">
              <button onClick={() => openEdit(s)} className="flex-1 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg py-2 transition-colors">Edit</button>
              <button onClick={() => deleteService(s.id, s.title)} className="flex-1 text-xs text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 rounded-lg py-2 transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-6 w-full max-w-lg space-y-4 my-4">
            <h3 className="font-semibold text-lg">{modal === "create" ? "New Service" : "Edit Service"}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-white/50 mb-1 block">Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))} className="admin-input w-full" placeholder="Web App Development" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Slug *</label>
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="admin-input w-full font-mono text-xs" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Category *</label>
                <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="admin-input w-full" placeholder="Development" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-white/50 mb-1 block">Short Description *</label>
                <textarea value={form.shortDesc} onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))} rows={2} className="admin-input w-full resize-none" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Price Start (IDR) *</label>
                <input type="number" value={form.priceStart} onChange={(e) => setForm((f) => ({ ...f, priceStart: e.target.value }))} className="admin-input w-full" placeholder="5000000" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} className="admin-input w-full" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-white/50 mb-1 block">Features (one per line) *</label>
                <textarea value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} rows={5} className="admin-input w-full resize-none font-mono text-xs" placeholder={"Next.js / TypeScript\nREST API\n3 Months Support"} />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                <label htmlFor="isActive" className="text-sm text-white/70">Active (visible to public)</label>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">{saving ? "Saving..." : "Save Service"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

