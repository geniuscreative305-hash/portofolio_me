"use client";

import { useState, useEffect, useCallback } from "react";
import type { ActivityLogItem } from "@/types";

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  UPDATE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  BULK_DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  BULK_UPDATE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  APPROVE: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  UNAPPROVE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  EXPORT: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  LOGIN: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  LOGOUT: "bg-white/10 text-white/50 border-white/10",
  SETTINGS_UPDATE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/activity-logs?page=${page}&pageSize=30`);
    const data = await res.json();
    setLogs(data.data?.items ?? []);
    setTotal(data.data?.total ?? 0);
    setTotalPages(data.data?.totalPages ?? 1);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 admin-page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Activity Logs</h1>
          <p className="text-white/40 text-xs sm:text-sm mt-0.5">
            Riwayat lengkap aksi sistem, update data, dan otentikasi admin · <span className="text-emerald-400 font-semibold">{total} entri</span>
          </p>
        </div>
      </div>

      <div className="bg-[#0f1623] border border-[#1e2d42] rounded-2xl divide-y divide-[#1e2d42] overflow-hidden shadow-lg">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="px-4 py-4 animate-pulse flex gap-4">
              <div className="h-5 w-20 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-24" />
              </div>
              <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
          ))
        ) : logs.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-12">No activity logs yet</p>
        ) : logs.map((log) => (
          <div key={log.id} className="px-4 py-3.5 flex items-start gap-3 hover:bg-white/2 transition-colors">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${ACTION_STYLES[log.action] ?? "bg-white/10 text-white/40 border-white/10"}`}>
              {log.action}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80">{log.description}</p>
              <p className="text-xs text-white/30 mt-0.5">{log.entityType}{log.entityId ? ` · ${log.entityId.slice(0, 8)}...` : ""}</p>
            </div>
            <span className="text-xs text-white/30 flex-shrink-0 text-right">
              {new Date(log.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>Page {page} of {totalPages} · {total} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded disabled:opacity-30">←</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded disabled:opacity-30">→</button>
          </div>
        </div>
      )}
    </div>
  );
}

