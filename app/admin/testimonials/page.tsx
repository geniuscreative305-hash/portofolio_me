"use client";

import { useState, useEffect, useCallback } from "react";
import { showToast } from "@/components/admin/Toast";
import type { TestimonialItem } from "@/types";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < rating ? "text-amber-400" : "text-white/15"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<TestimonialItem | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    const res = await fetch(`/api/testimonials?${params}`);
    const data = await res.json();
    setItems(data.data?.items ?? []);
    setTotal(data.data?.total ?? 0);
    setTotalPages(data.data?.totalPages ?? 1);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const toggleApproval = async (id: string, current: boolean) => {
    const res = await fetch(`/api/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: !current }),
    });
    if (res.ok) {
      showToast(`Testimonial ${!current ? "approved" : "unapproved"}`, "success");
      fetchItems();
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("Testimonial deleted", "success"); fetchItems(); }
  };

  const bulkAction = async (action: string) => {
    if (!selected.size) return;
    if (action === "delete" && !confirm(`Delete ${selected.size} testimonials?`)) return;
    const res = await fetch("/api/testimonials/bulk", {
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <p className="text-white/40 text-sm mt-0.5">{total} total</p>
      </div>

      {/* Bulk */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-[#1a2235] border border-[#1f2d45] rounded-lg px-4 py-2 flex-wrap">
          <span className="text-sm text-white/70">{selected.size} selected</span>
          <button onClick={() => bulkAction("approve")} className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded">Approve All</button>
          <button onClick={() => bulkAction("unapprove")} className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded">Unapprove All</button>
          <button onClick={() => bulkAction("delete")} className="btn-danger text-xs py-1 px-3">Delete</button>
        </div>
      )}

      <div className="bg-[#111827] border border-[#1f2d45] rounded-xl divide-y divide-[#1f2d45]">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-4 animate-pulse flex gap-4">
              <div className="w-4 h-4 bg-white/10 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-32" />
                <div className="h-3 bg-white/5 rounded w-full" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-12">No testimonials yet</p>
        ) : items.map((item) => (
          <div key={item.id} className="px-4 py-4 flex items-start gap-3 hover:bg-white/2 transition-colors">
            <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="mt-1 rounded" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <StarRating rating={item.rating} />
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${item.isApproved ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-amber-500/15 text-amber-400 border-amber-500/25"}`}>
                  {item.isApproved ? "Approved" : "Pending"}
                </span>
                <span className="font-mono text-xs text-white/30">{item.orderCode}</span>
              </div>
              <p className="font-semibold text-sm mt-1">{item.clientName} <span className="font-normal text-white/40 text-xs">· {item.clientRole}</span></p>
              <p className="text-xs text-white/60 mt-1 line-clamp-2">&quot;{item.content}&quot;</p>
              <p className="text-xs text-white/30 mt-1">{new Date(item.createdAt).toLocaleDateString("id-ID")}</p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setPreview(item)} className="text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded px-2 py-1 transition-colors">View</button>
              <button onClick={() => toggleApproval(item.id, item.isApproved)} className={`text-xs rounded px-2 py-1 transition-colors ${item.isApproved ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"}`}>
                {item.isApproved ? "Unapprove" : "Approve"}
              </button>
              <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded px-2 py-1 transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-end">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded disabled:opacity-30">←</button>
          <span className="px-3 py-1.5 text-sm text-white/50">{page}/{totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded disabled:opacity-30">→</button>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Testimonial Preview</h3>
              <button onClick={() => setPreview(null)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <StarRating rating={preview.rating} />
            <blockquote className="text-white/80 text-sm leading-relaxed italic">&quot;{preview.content}&quot;</blockquote>
            <div className="border-t border-[#1f2d45] pt-3">
              <p className="font-semibold text-sm">{preview.clientName}</p>
              <p className="text-white/40 text-xs">{preview.clientRole}</p>
              <p className="text-white/30 text-xs mt-1">Order: {preview.orderCode}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { toggleApproval(preview.id, preview.isApproved); setPreview(null); }} className={`flex-1 text-sm py-2 rounded-lg font-medium transition-colors ${preview.isApproved ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>
                {preview.isApproved ? "Unapprove" : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

