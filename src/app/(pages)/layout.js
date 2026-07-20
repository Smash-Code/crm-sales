"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { href: "/leads", label: "Find Leads", icon: "🔍" },
    { href: "/saved", label: "Saved Leads", icon: "📁" },
];

export default function PagesLayout({ children }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-900/50 flex flex-col">
                <div className="px-6 py-6 border-b border-slate-800">
                    <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                        Lead Finder
                    </p>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active
                                    ? "bg-emerald-500 text-slate-950"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                                    }`}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-6 py-4 border-t border-slate-800">
                    <p className="text-xs text-slate-600">v1.0</p>
                </div>
            </aside>

            {/* Page content */}
            <main className="flex-1 min-w-0">{children}</main>
        </div>
    );
}