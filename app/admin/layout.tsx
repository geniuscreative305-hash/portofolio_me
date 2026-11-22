"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ToastContainer } from "@/components/admin/Toast";

// ─── Route Progress Bar ───────────────────────────────────────────────────────
function RouteProgressBar({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[100] bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
  );
}

// ─── Sidebar Nav Items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/admin/services",
    label: "Services",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    href: "/admin/portfolio",
    label: "Portfolio",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    href: "/admin/activity-logs",
    label: "Activity Logs",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ─── Admin Layout ─────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const prevPathname = useRef(pathname);

  // Turn off loading indicator when pathname changes
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setPageLoading(false);
      prevPathname.current = pathname;
      setSidebarOpen(false);
    }
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    setPageLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }, [router]);

  if (pathname === "/admin/login") {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  const currentNav = NAV_ITEMS.find(
    (item) => pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))
  );

  return (
    <div className="h-screen w-full bg-[#080c17] text-white flex flex-col overflow-hidden">
      {/* ── Route Progress Bar ── */}
      <RouteProgressBar loading={pageLoading} />

      {/* ── Top Bar ── */}
      <header className="h-14 flex-shrink-0 bg-[#0f1623] border-b border-[#1e2d42] flex items-center px-4 sm:px-6 gap-4 z-30">
        {/* Mobile hamburger button */}
        <button
          className="md:hidden text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/30 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight hidden sm:block">Portfolio CMS</span>
            <span className="text-[10px] text-white/40 block -mt-0.5 hidden sm:block">Control Panel</span>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs text-white/40 ml-4 pl-4 border-l border-white/10">
          <span>Admin</span>
          <span>/</span>
          <span className="text-emerald-400 font-semibold">{currentNav?.label ?? "Dashboard"}</span>
        </div>

        <div className="flex-1" />

        {/* Loading Spinner Indicator */}
        {pageLoading && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 animate-pulse">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Memuat...</span>
          </div>
        )}

        {/* Visit Site */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
        >
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>Lihat Website</span>
        </a>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-white/60 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* ── Main Body Area ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Mobile backdrop overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/75 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-50 md:z-auto
            w-64 flex-shrink-0 h-full bg-[#0d1526] border-r border-[#1e2d42]
            flex flex-col transition-transform duration-200 ease-in-out
            ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Nav Items */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-2">
              Menu Navigasi
            </p>
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => {
                    setSidebarOpen(false);
                    if (pathname !== item.href) setPageLoading(true);
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-150 group relative
                    ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
                        : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  )}
                  <span
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? "text-emerald-400" : "text-white/40 group-hover:text-white/70"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-[#1e2d42] space-y-2">
            <div className="px-3 py-2.5 rounded-xl bg-[#111827] border border-[#1e2d42]">
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">
                Database &amp; Engine
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-xs text-white/80 font-medium">Neon PostgreSQL Online</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto min-w-0 bg-[#080c17]">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
