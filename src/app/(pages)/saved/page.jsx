"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import Link from "next/link";

export default function SavedLeadsPage() {
    const [allLeads, setAllLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null); // group key or null

    useEffect(() => {
        fetchLeads();
    }, []);

    async function fetchLeads() {
        setLoading(true);
        setError("");
        try {
            const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setAllLeads(docs);
        } catch (err) {
            console.error(err);
            setError("Couldn't load saved leads. Try refreshing.");
        } finally {
            setLoading(false);
        }
    }

    // Group leads by search query + location
    const groups = allLeads.reduce((acc, lead) => {
        const locationLabel =
            lead.location && lead.location !== "any" ? lead.location : "Any location";
        const key = `${lead.searchQuery || "Untitled search"} — ${locationLabel}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(lead);
        return acc;
    }, {});

    const groupKeys = Object.keys(groups);
    const activeLeads = selectedGroup ? groups[selectedGroup] : [];

    return (
        <div className="max-w-6xl mx-auto px-6 py-12 text-slate-100">
            {/* Header */}
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
                        Saved Leads
                    </p>
                    <h1 className="text-3xl font-semibold text-white">
                        {selectedGroup ? selectedGroup : "Your saved searches"}
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        {selectedGroup
                            ? `${activeLeads.length} lead${activeLeads.length !== 1 ? "s" : ""} saved from this search`
                            : "Every search you've saved leads from, grouped together."}
                    </p>
                </div>

                {selectedGroup && (
                    <button
                        onClick={() => setSelectedGroup(null)}
                        className="text-xs font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-4 py-2 transition"
                    >
                        ← Back to searches
                    </button>
                )}
            </div>

            {loading && (
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    Loading saved leads...
                </div>
            )}

            {error && <p className="text-rose-400 text-sm">{error}</p>}

            {/* Empty state */}
            {!loading && !error && groupKeys.length === 0 && (
                <div className="border border-dashed border-slate-800 rounded-xl px-6 py-16 text-center">
                    <p className="text-slate-400 text-sm">
                        No leads saved yet. Go to{" "}
                        <span className="text-emerald-400">Find Leads</span> to search and save some.
                    </p>
                </div>
            )}

            {/* Search title boxes */}
            {!loading && !selectedGroup && groupKeys.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupKeys.map((key) => (
                        <button
                            key={key}
                            onClick={() => setSelectedGroup(key)}
                            className="cursor-pointer text-left bg-slate-900 border border-slate-800 hover:border-emerald-600 rounded-xl p-5 transition group"
                        >
                            <p className="font-medium text-white group-hover:text-emerald-400 transition truncate">
                                {key}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                                {groups[key].length} lead{groups[key].length !== 1 ? "s" : ""}
                            </p>
                        </button>
                    ))}
                </div>
            )}

            {/* Leads table for selected group */}
            {!loading && selectedGroup && (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wide">
                                <th className="text-left px-4 py-3 font-medium">Business</th>
                                <th className="text-left px-4 py-3 font-medium">Emails</th>
                                <th className="text-left px-4 py-3 font-medium">Phones</th>
                                <th className="text-left px-4 py-3 font-medium">Social</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeLeads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    className="border-t border-slate-800 hover:bg-slate-900/50 transition"
                                >
                                    <td className="px-4 py-3 align-top max-w-[220px]">
                                        <p className="font-medium text-white truncate">{lead.title}</p>
                                        <Link
                                            href={lead.website}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-emerald-400 hover:underline truncate block"
                                        >
                                            {lead.hostname}
                                        </Link>
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        {lead.emails?.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {lead.emails.map((email) => (
                                                    <span key={email} className="text-emerald-300 text-xs">
                                                        {email}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-600 text-xs">—</span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        {lead.phones?.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {lead.phones.map((phone) => (
                                                    <span key={phone} className="text-sky-300 text-xs">
                                                        {phone}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-600 text-xs">—</span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        {lead.socials?.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {lead.socials.map((s) => (
                                                    <Link

                                                        key={s.url}
                                                        href={s.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-fuchsia-300 text-xs hover:underline"
                                                    >
                                                        {s.platform}
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-600 text-xs">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div >
            )
            }
        </div >
    );
}