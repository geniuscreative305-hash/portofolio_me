"use client";

import { useState, useEffect, useCallback } from "react";
import { showToast } from "@/components/admin/Toast";
import type { OrderItem, OrderStatus } from "@/types";

const STATUS_OPTIONS: OrderStatus[] = ["PENDING", "IN_PROGRESS", "REVISION", "COMPLETED", "CANCELLED"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  IN_PROGRESS: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  REVISION: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  CANCELLED: "bg-red-500/15 text-red-400 border-red-500/25",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.data?.items ?? []);
      setTotal(data.data?.total ?? 0);
      setTotalPages(data.data?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast("Status updated", "success");
      fetchOrders();
    } else {
      showToast("Failed to update status", "error");
    }
  };

  const saveNote = async (id: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: noteValue }),
    });
    if (res.ok) {
      showToast("Note saved", "success");
      setEditingNote(null);
      fetchOrders();
    }
  };

  const bulkDelete = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} orders?`)) return;
    const res = await fetch("/api/orders/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], action: "delete" }),
    });
    if (res.ok) {
      showToast(`${selected.size} orders deleted`, "success");
      setSelected(new Set());
      fetchOrders();
    }
  };

  const exportCSV = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    window.open(`/api/orders/export?${params}`, "_blank");
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === orders.length ? new Set() : new Set(orders.map((o) => o.id)));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-white/40 text-sm mt-0.5">{total} total orders</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary text-sm py-2 flex items-center gap-2 self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or order code..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="admin-input flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="admin-input w-auto"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-[#1a2235] border border-[#1f2d45] rounded-lg px-4 py-2">
          <span className="text-sm text-white/70">{selected.size} selected</span>
          <button onClick={bulkDelete} className="btn-danger text-xs py-1 px-3">Delete Selected</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#111827] border border-[#1f2d45] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2d45] text-white/40 text-xs uppercase tracking-widest">
                <th className="px-4 py-3 text-left w-10">
                  <input type="checkbox" checked={selected.size === orders.length && orders.length > 0} onChange={toggleAll} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left">Order Code</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Service</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">Budget</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d45]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-white/30">No orders found</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-emerald-400">{order.orderCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.clientName}</p>
                    {order.adminNote && (
                      <p className="text-xs text-white/40 truncate max-w-[150px]" title={order.adminNote}>📝 {order.adminNote}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-white/60 text-xs">
                    {(order.service as { title: string })?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-white/60 text-xs">{order.budgetEstimate}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border font-semibold bg-transparent cursor-pointer ${STATUS_COLORS[order.status] ?? ""}`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#111827] text-white">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-white/40">
                    {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setEditingNote(order.id); setNoteValue(order.adminNote ?? ""); }}
                      className="text-xs text-white/50 hover:text-white transition-colors"
                      title="Add/Edit Note"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors">←</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors">→</button>
          </div>
        </div>
      )}

      {/* Admin Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold">Admin Note</h3>
            <textarea
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              rows={4}
              className="admin-input w-full resize-none"
              placeholder="Internal note (not visible to client)..."
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditingNote(null)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
              <button onClick={() => saveNote(editingNote)} className="btn-primary text-sm py-2 px-4">Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

