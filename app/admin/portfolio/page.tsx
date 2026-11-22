"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { showToast } from "@/components/admin/Toast";
import type { PortfolioItem, ServiceItem } from "@/types";

type TabFilter = "all" | "PUBLISHED" | "DRAFT";

interface PortfolioForm {
  title: string;
  category: string;
  shortDesc: string;
  fullDescription: string;
  thumbnailUrl: string;
  techStack: string;
  liveDemoUrl: string;
  relatedServiceId: string;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
}

const EMPTY_FORM: PortfolioForm = { title: "", category: "", shortDesc: "", fullDescription: "", thumbnailUrl: "", techStack: "", liveDemoUrl: "", relatedServiceId: "", status: "DRAFT", isFeatured: false };

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState<TabFilter>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PortfolioForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "12" });
    if (tab !== "all") params.set("status", tab);
    const [itemsRes, servicesRes] = await Promise.all([
      fetch(`/api/portfolio?${params}`),
      fetch("/api/services"),
    ]);
    const [itemsData, servicesData] = await Promise.all([itemsRes.json(), servicesRes.json()]);
    setItems(itemsData.data?.items ?? []);
    setTotal(itemsData.data?.total ?? 0);
    setTotalPages(itemsData.data?.totalPages ?? 1);
    setServices(servicesData.data ?? []);
    setLoading(false);
  }, [page, tab]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal("create"); };
  const openEdit = (item: PortfolioItem) => {
    setForm({ title: item.title, category: item.category, shortDesc: item.shortDesc, fullDescription: item.fullDescription, thumbnailUrl: item.thumbnailUrl, techStack: item.techStack.join(", "), liveDemoUrl: item.liveDemoUrl ?? "", relatedServiceId: item.relatedServiceId ?? "", status: item.status, isFeatured: item.isFeatured });
    setEditId(item.id);
    setModal("edit");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "portfolio");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm((f) => ({ ...f, thumbnailUrl: data.data.url }));
        showToast("Image uploaded", "success");
      } else {
        showToast(data.error ?? "Upload failed", "error");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, techStack: form.techStack.split(",").map((t) => t.trim()).filter(Boolean), liveDemoUrl: form.liveDemoUrl || null, relatedServiceId: form.relatedServiceId || null };
      const isEdit = modal === "edit" && editId;
      const res = await fetch(isEdit ? `/api/portfolio/${editId}` : "/api/portfolio", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(isEdit ? "Portfolio updated" : "Portfolio created", "success");
        setModal(null);
        fetchItems();
      } else {
        showToast(data.error ?? "Failed to save", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("Portfolio item deleted", "success"); fetchItems(); }
  };

  const bulkAction = async (action: string) => {
    if (!selected.size) return;
    if (action === "delete" && !confirm(`Delete ${selected.size} items?`)) return;
    const res = await fetch("/api/portfolio/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], action }),
    });
    if (res.ok) {
      showToast(`Bulk ${action} completed`, "success");
      setSelected(new Set());
      fetchItems();
    }
  };

  const toggleSelect = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size === items.length ? new Set() : new Set(items.map((i) => i.id)));

  const TABS: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "PUBLISHED", label: "Published" },
    { key: "DRAFT", label: "Draft" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Portfolio</h1><p className="text-white/40 text-sm mt-0.5">{total} items</p></div>
        <button onClick={openCreate} className="btn-primary text-sm py-2 flex items-center gap-2 self-start">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Portfolio
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111827] border border-[#1f2d45] rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }} className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${tab === t.key ? "bg-emerald-500/15 text-emerald-400" : "text-white/50 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-[#1a2235] border border-[#1f2d45] rounded-lg px-4 py-2 flex-wrap">
          <span className="text-sm text-white/70">{selected.size} selected</span>
          <button onClick={() => bulkAction("publish")} className="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded">Publish</button>
          <button onClick={() => bulkAction("draft")} className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-1 rounded">Set Draft</button>
          <button onClick={() => bulkAction("delete")} className="btn-danger text-xs py-1 px-3">Delete</button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-[#111827] border border-[#1f2d45] rounded-xl h-64 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-white/30">No portfolio items found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-[#111827] border border-[#1f2d45] rounded-xl overflow-hidden flex flex-col">
              <div className="relative h-40">
                <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" />
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${item.status === "PUBLISHED" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-amber-500/15 text-amber-400 border-amber-500/25"}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-white/40 mt-1 flex-1">{item.category}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(item)} className="flex-1 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg py-2 transition-colors">Edit</button>
                  <button onClick={() => deleteItem(item.id, item.title)} className="flex-1 text-xs text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 rounded-lg py-2 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-end">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded disabled:opacity-30">←</button>
          <span className="px-3 py-1.5 text-sm text-white/50">{page}/{totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded disabled:opacity-30">→</button>
        </div>
      )}

      {/* WP-Style Editor Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70">
          <div className="min-h-screen flex items-start justify-center p-4 py-8">
            <div className="bg-[#0f1623] border border-[#1f2d45] rounded-xl w-full max-w-4xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2d45]">
                <h2 className="font-semibold text-lg">{modal === "create" ? "New Portfolio Item" : "Edit Portfolio Item"}</h2>
                <button onClick={() => setModal(null)} className="text-white/40 hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content (2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Title *</label>
                    <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="admin-input w-full text-base font-semibold" placeholder="Project Title" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Short Description *</label>
                    <textarea value={form.shortDesc} onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))} rows={2} className="admin-input w-full resize-none" placeholder="One-line project description" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Full Case Study / Description * (Markdown supported)</label>
                    <textarea value={form.fullDescription} onChange={(e) => setForm((f) => ({ ...f, fullDescription: e.target.value }))} rows={12} className="admin-input w-full resize-y font-mono text-xs" placeholder="## Project Overview&#10;&#10;Describe the project in detail..." />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Tech Stack (comma separated) *</label>
                    <input value={form.techStack} onChange={(e) => setForm((f) => ({ ...f, techStack: e.target.value }))} className="admin-input w-full" placeholder="Next.js, TypeScript, Prisma, PostgreSQL" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Live Demo URL</label>
                    <input value={form.liveDemoUrl} onChange={(e) => setForm((f) => ({ ...f, liveDemoUrl: e.target.value }))} className="admin-input w-full" placeholder="https://..." />
                  </div>
                </div>

                {/* Publish Box (1 col) */}
                <div className="space-y-4">
                  {/* Publish Box */}
                  <div className="bg-[#1a2235] border border-[#1f2d45] rounded-xl p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-white/70">Publish</h3>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Status</label>
                      <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "DRAFT" | "PUBLISHED" }))} className="admin-input w-full">
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} />
                      <label htmlFor="isFeatured" className="text-xs text-white/70">Featured (shown first)</label>
                    </div>
                    <button onClick={handleSave} disabled={saving} className="btn-primary w-full text-sm py-2 disabled:opacity-50">
                      {saving ? "Saving..." : modal === "create" ? "Publish" : "Update"}
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="bg-[#1a2235] border border-[#1f2d45] rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-white/70">Thumbnail</h3>
                    {form.thumbnailUrl && (
                      <div className="relative h-32 w-full rounded-lg overflow-hidden">
                        <Image src={form.thumbnailUrl} alt="thumbnail" fill className="object-cover" />
                      </div>
                    )}
                    <label className="block w-full">
                      <span className="btn-secondary text-xs py-2 w-full text-center block cursor-pointer">
                        {uploading ? "Uploading..." : "Upload Image (max 4MB)"}
                      </span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" disabled={uploading} />
                    </label>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Or paste URL</label>
                      <input value={form.thumbnailUrl} onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))} className="admin-input w-full text-xs" placeholder="https://..." />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="bg-[#1a2235] border border-[#1f2d45] rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-white/70">Meta</h3>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Category *</label>
                      <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="admin-input w-full" placeholder="Development" />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Related Service</label>
                      <select value={form.relatedServiceId} onChange={(e) => setForm((f) => ({ ...f, relatedServiceId: e.target.value }))} className="admin-input w-full">
                        <option value="">None</option>
                        {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

