"use client";

import { useState, useEffect } from "react";

interface KpiStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalPortfolio: number;
  totalServices: number;
  pendingTestimonials: number;
}

interface RecentLog {
  id: string;
  action: string;
  entityType: string;
  description: string;
  createdAt: string;
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-5">
      <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: "text-emerald-400",
  UPDATE: "text-blue-400",
  DELETE: "text-red-400",
  BULK_DELETE: "text-red-400",
  APPROVE: "text-cyan-400",
  LOGIN: "text-purple-400",
  SETTINGS_UPDATE: "text-amber-400",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<KpiStats | null>(null);
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_data() {
      try {
        const [
          ordersRes,
          portfolioRes,
          servicesRes,
          testimonialsRes,
          logsRes,
          pendingRes,
          completedRes,
        ] = await Promise.all([
          fetch("/api/orders?pageSize=1"),
          fetch("/api/portfolio?pageSize=1"),
          fetch("/api/services"),
          fetch("/api/testimonials?pageSize=1"),
          fetch("/api/activity-logs?pageSize=10"),
          fetch("/api/orders?status=PENDING&pageSize=1"),
          fetch("/api/orders?status=COMPLETED&pageSize=1"),
        ]);

        const [
          ordersData,
          portfolioData,
          servicesData,
          testimonialsData,
          logsData,
          pendingData,
          completedData,
        ] = await Promise.all([
          ordersRes.json(),
          portfolioRes.json(),
          servicesRes.json(),
          testimonialsRes.json(),
          logsRes.json(),
          pendingRes.json(),
          completedRes.json(),
        ]);

        setStats({
          totalOrders: ordersData.data?.total ?? 0,
          pendingOrders: pendingData.data?.total ?? 0,
          completedOrders: completedData.data?.total ?? 0,
          totalPortfolio: portfolioData.data?.total ?? 0,
          totalServices: (servicesData.data as unknown[])?.length ?? 0,
          pendingTestimonials: testimonialsData.data?.total ?? 0,
        });

        setLogs(logsData.data?.items ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetch_data();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 admin-page-enter">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111827] border border-[#1f2d45] rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-24 mb-3" />
              <div className="h-8 bg-white/10 rounded w-16" />
            </div>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard label="Total Orders" value={stats.totalOrders} color="text-white" />
          <KpiCard label="Pending Orders" value={stats.pendingOrders} color="text-amber-400" />
          <KpiCard label="Completed Orders" value={stats.completedOrders} color="text-emerald-400" />
          <KpiCard label="Portfolio Items" value={stats.totalPortfolio} color="text-cyan-400" />
          <KpiCard label="Active Services" value={stats.totalServices} color="text-blue-400" />
          <KpiCard label="Total Testimonials" value={stats.pendingTestimonials} color="text-purple-400" />
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent Activity</h2>
          <a href="/admin/activity-logs" className="text-xs text-emerald-400 hover:text-emerald-300">View all →</a>
        </div>
        <div className="bg-[#111827] border border-[#1f2d45] rounded-xl divide-y divide-[#1f2d45]">
          {logs.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No activity yet</p>
          ) : logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3">
              <span className={`text-xs font-bold uppercase ${ACTION_COLOR[log.action] ?? "text-white/40"} flex-shrink-0 mt-0.5`}>
                {log.action}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{log.description}</p>
                <p className="text-xs text-white/30 mt-0.5">{log.entityType}</p>
              </div>
              <span className="text-xs text-white/30 flex-shrink-0">
                {new Date(log.createdAt).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/admin/orders", label: "View Orders", color: "text-amber-400" },
            { href: "/admin/portfolio", label: "Add Portfolio", color: "text-cyan-400" },
            { href: "/admin/testimonials", label: "Review Testimonials", color: "text-purple-400" },
            { href: "/admin/settings", label: "Settings", color: "text-emerald-400" },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="bg-[#111827] border border-[#1f2d45] hover:border-[#2a3a55] rounded-xl p-4 text-sm font-medium transition-colors hover:bg-[#1a2235]"
            >
              <span className={a.color}>{a.label} →</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

