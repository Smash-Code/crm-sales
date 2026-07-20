// "use client";

// import { useState } from "react";
// import { collection, addDoc, serverTimestamp } from "firebase/firestore";
// import { db } from "@/app/db/firebase";

// const LOCATIONS = [
//     { value: "any", label: "Any location" },
//     { value: "New York, USA", label: "New York, USA" },
//     { value: "Los Angeles, USA", label: "Los Angeles, USA" },
//     { value: "London, UK", label: "London, UK" },
//     { value: "Toronto, Canada", label: "Toronto, Canada" },
//     { value: "Dubai, UAE", label: "Dubai, UAE" },
//     { value: "Karachi, Pakistan", label: "Karachi, Pakistan" },
//     { value: "Lahore, Pakistan", label: "Lahore, Pakistan" },
//     { value: "Faisalabad, Pakistan", label: "Faisalabad, Pakistan" },
// ];

// export default function LeadsPage() {
//     const [query, setQuery] = useState("");
//     const [location, setLocation] = useState("any");
//     const [loading, setLoading] = useState(false);
//     const [leads, setLeads] = useState([]);
//     const [error, setError] = useState("");
//     const [savedLinks, setSavedLinks] = useState(new Set());
//     const [savingLink, setSavingLink] = useState(null);
//     const [toast, setToast] = useState("");

//     async function handleSearch(e) {
//         e.preventDefault();
//         if (!query.trim()) {
//             setError('Type something to search, like "Restaurants".');
//             return;
//         }
//         setError("");
//         setLoading(true);
//         setLeads([]);

//         try {
//             const res = await fetch("/api/search-leads", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ query, location }),
//             });
//             const data = await res.json();

//             if (!res.ok) {
//                 setError(data.error || "Search failed. Try again.");
//             } else {
//                 setLeads(data.leads);
//                 if (data.leads.length === 0) {
//                     setError("No results found for that search.");
//                 }
//             }
//         } catch (err) {
//             setError("Network error — check your connection and try again.");
//         } finally {
//             setLoading(false);
//         }
//     }

//     async function saveLead(lead) {
//         setSavingLink(lead.website);
//         try {
//             await addDoc(collection(db, "leads"), {
//                 title: lead.title,
//                 website: lead.website,
//                 hostname: lead.hostname,
//                 emails: lead.emails,
//                 phones: lead.phones,
//                 socials: lead.socials,
//                 searchQuery: query,
//                 location,
//                 createdAt: serverTimestamp(),
//             });
//             setSavedLinks((prev) => new Set(prev).add(lead.website));
//             showToast("Lead saved to Firebase.");
//         } catch (err) {
//             console.error(err);
//             showToast("Couldn't save this lead. Try again.");
//         } finally {
//             setSavingLink(null);
//         }
//     }

//     async function saveAll() {
//         const unsaved = leads.filter((l) => !savedLinks.has(l.website));
//         for (const lead of unsaved) {
//             await saveLead(lead);
//         }
//     }

//     function showToast(msg) {
//         setToast(msg);
//         setTimeout(() => setToast(""), 2500);
//     }

//     return (
//         <div className="min-h-screen bg-slate-950 text-slate-100">
//             <div className="max-w-6xl mx-auto px-6 py-12">
//                 {/* Header */}
//                 <div className="mb-10">
//                     <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
//                         Lead Finder
//                     </p>
//                     <h1 className="text-3xl font-semibold text-white">
//                         Find leads, pull contacts, save to Firebase
//                     </h1>
//                     <p className="text-slate-400 mt-2 text-sm">
//                         Search a business type and location. Claude visits each result's website
//                         and pulls emails, phone numbers, and social links directly from the page.
//                     </p>
//                 </div>

//                 {/* Search form */}
//                 <form
//                     onSubmit={handleSearch}
//                     className="flex flex-col sm:flex-row gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4"
//                 >
//                     <input
//                         type="text"
//                         value={query}
//                         onChange={(e) => setQuery(e.target.value)}
//                         placeholder='e.g. "Restaurants"'
//                         className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500 transition"
//                     />

//                     <select
//                         value={location}
//                         onChange={(e) => setLocation(e.target.value)}
//                         className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500 transition sm:w-56"
//                     >
//                         {LOCATIONS.map((loc) => (
//                             <option key={loc.value} value={loc.value}>
//                                 {loc.label}
//                             </option>
//                         ))}
//                     </select>

//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-medium rounded-lg px-6 py-3 text-sm transition"
//                     >
//                         {loading ? "Searching..." : "Search leads"}
//                     </button>
//                 </form>

//                 {error && <p className="text-rose-400 text-sm mt-3">{error}</p>}

//                 {/* Loading state */}
//                 {loading && (
//                     <div className="flex items-center gap-3 mt-10 text-slate-400 text-sm">
//                         <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
//                         Searching and visiting each website for contact details — this can take
//                         10–20 seconds...
//                     </div>
//                 )}

//                 {/* Results table */}
//                 {!loading && leads.length > 0 && (
//                     <div className="mt-10">
//                         <div className="flex items-center justify-between mb-4">
//                             <p className="text-sm text-slate-400">
//                                 {leads.length} result{leads.length !== 1 ? "s" : ""} found
//                             </p>
//                             <button
//                                 onClick={saveAll}
//                                 className="text-xs font-medium text-emerald-400 hover:text-emerald-300 border border-emerald-800 hover:border-emerald-600 rounded-lg px-3 py-1.5 transition"
//                             >
//                                 Save
//                             </button>
//                         </div>

//                         <div className="overflow-x-auto border border-slate-800 rounded-xl">
//                             <table className="w-full text-sm">
//                                 <thead>
//                                     <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wide">
//                                         <th className="text-left px-4 py-3 font-medium">Business</th>
//                                         <th className="text-left px-4 py-3 font-medium">Emails</th>
//                                         <th className="text-left px-4 py-3 font-medium">Phones</th>
//                                         <th className="text-left px-4 py-3 font-medium">Social</th>
//                                         {/* <th className="text-right px-4 py-3 font-medium">Action</th> */}
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {leads.map((lead) => {
//                                         const isSaved = savedLinks.has(lead.website);
//                                         const isSaving = savingLink === lead.website;
//                                         const hasContact = lead.emails.length || lead.phones.length || lead.socials.length;

//                                         return (
//                                             <tr
//                                                 key={lead.website}
//                                                 className="border-t border-slate-800 hover:bg-slate-900/50 transition"
//                                             >
//                                                 <td className="px-4 py-3 align-top max-w-[220px]">
//                                                     <p className="font-medium text-white truncate">{lead.title}</p>
//                                                     <a
//                                                         href={lead.website}
//                                                         target="_blank"
//                                                         rel="noreferrer"
//                                                         className="text-xs text-emerald-400 hover:underline truncate block"
//                                                     >
//                                                         {lead.hostname}
//                                                     </a>
//                                                 </td>

//                                                 <td className="px-4 py-3 align-top">
//                                                     {lead.emails.length > 0 ? (
//                                                         <div className="flex flex-col gap-1">
//                                                             {lead.emails.map((email) => (
//                                                                 <span key={email} className="text-emerald-300 text-xs">
//                                                                     {email}
//                                                                 </span>
//                                                             ))}
//                                                         </div>
//                                                     ) : (
//                                                         <span className="text-slate-600 text-xs">—</span>
//                                                     )}
//                                                 </td>

//                                                 <td className="px-4 py-3 align-top">
//                                                     {lead.phones.length > 0 ? (
//                                                         <div className="flex flex-col gap-1">
//                                                             {lead.phones.map((phone) => (
//                                                                 <span key={phone} className="text-sky-300 text-xs">
//                                                                     {phone}
//                                                                 </span>
//                                                             ))}
//                                                         </div>
//                                                     ) : (
//                                                         <span className="text-slate-600 text-xs">—</span>
//                                                     )}
//                                                 </td>

//                                                 <td className="px-4 py-3 align-top">
//                                                     {lead.socials.length > 0 ? (
//                                                         <div className="flex flex-col gap-1">
//                                                             {lead.socials.map((s) => (
//                                                                 <a
//                                                                     key={s.url}
//                                                                     href={s.url}
//                                                                     target="_blank"
//                                                                     rel="noreferrer"
//                                                                     className="text-fuchsia-300 text-xs hover:underline"
//                                                                 >
//                                                                     {s.platform}
//                                                                 </a>
//                                                             ))}
//                                                         </div>
//                                                     ) : (
//                                                         <span className="text-slate-600 text-xs">—</span>
//                                                     )}
//                                                 </td>

//                                                 {/* <td className="px-4 py-3 align-top text-right">
//                                                     <button
//                                                         onClick={() => saveLead(lead)}
//                                                         disabled={isSaved || isSaving || !hasContact}
//                                                         title={!hasContact ? "No contact info to save" : ""}
//                                                         className="text-xs font-medium rounded-lg px-3 py-2 transition disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500"
//                                                     >
//                                                         {isSaved ? "Saved" : isSaving ? "..." : "Save"}
//                                                     </button>
//                                                 </td> */}
//                                             </tr>
//                                         );
//                                     })}
//                                 </tbody>
//                             </table>

//                             {/* Toast Notifications container included inside the template wrapper structure safely */}
//                             {toast && (
//                                 <div className="fixed bottom-6 right-6 bg-emerald-500 text-slate-950 text-sm font-medium px-4 py-3 rounded-lg shadow-lg z-50">
//                                     {toast}
//                                 </div>
//                             )}
//                         </div>
//                     </div >
//                 )};
//             </div >
//         </div >
//     )
// }


"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/db/firebase";

export default function LeadsPage() {
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState(""); // Changed default from "any" to an empty string
    const [loading, setLoading] = useState(false);
    const [leads, setLeads] = useState([]);
    const [error, setError] = useState("");
    const [savedLinks, setSavedLinks] = useState(new Set());
    const [savingLink, setSavingLink] = useState(null);
    const [toast, setToast] = useState("");

    async function handleSearch(e) {
        e.preventDefault();
        if (!query.trim()) {
            setError('Type something to search, like "Restaurants".');
            return;
        }
        setError("");
        setLoading(true);
        setLeads([]);

        try {
            const res = await fetch("/api/search-leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, location: location.trim() || "any" }), // Fallback to "any" if string is empty
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Search failed. Try again.");
            } else {
                setLeads(data.leads);
                if (data.leads.length === 0) {
                    setError("No results found for that search.");
                }
            }
        } catch (err) {
            setError("Network error — check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }

    async function saveLead(lead) {
        setSavingLink(lead.website);
        try {
            await addDoc(collection(db, "leads"), {
                title: lead.title,
                website: lead.website,
                hostname: lead.hostname,
                emails: lead.emails,
                phones: lead.phones,
                socials: lead.socials,
                searchQuery: query,
                location: location.trim() || "any",
                createdAt: serverTimestamp(),
            });
            setSavedLinks((prev) => new Set(prev).add(lead.website));
            showToast("Lead saved to Firebase.");
        } catch (err) {
            console.error(err);
            showToast("Couldn't save this lead. Try again.");
        } finally {
            setSavingLink(null);
        }
    }

    async function saveAll() {
        const unsaved = leads.filter((l) => !savedLinks.has(l.website));
        for (const lead of unsaved) {
            await saveLead(lead);
        }
    }

    function showToast(msg) {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
                        Lead Finder
                    </p>
                    <h1 className="text-3xl font-semibold text-white">
                        Find leads, pull contacts, save to Firebase
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        Search a business type and location. Claude visits each result's website
                        and pulls emails, phone numbers, and social links directly from the page.
                    </p>
                </div>

                {/* Search form */}
                <form
                    onSubmit={handleSearch}
                    className="flex flex-col sm:flex-row gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4"
                >
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder='e.g. "Restaurants"'
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500 transition"
                    />

                    {/* New Location Text Input box */}
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder='e.g. "New York" or "Any"'
                        className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500 transition sm:w-56"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-medium rounded-lg px-6 py-3 text-sm transition"
                    >
                        {loading ? "Searching..." : "Search leads"}
                    </button>
                </form>

                {error && <p className="text-rose-400 text-sm mt-3">{error}</p>}

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center gap-3 mt-10 text-slate-400 text-sm">
                        <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        Searching and visiting each website for contact details — this can take
                        10–20 seconds...
                    </div>
                )}

                {/* Results table */}
                {!loading && leads.length > 0 && (
                    <div className="mt-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-slate-400">
                                {leads.length} result{leads.length !== 1 ? "s" : ""} found
                            </p>
                            <button
                                onClick={saveAll}
                                className="cursor-pointer text-xs font-medium text-emerald-400 hover:text-emerald-300 border border-emerald-800 hover:border-emerald-600 rounded-lg px-3 py-1.5 transition"
                            >
                                Save Lead
                            </button>
                        </div>

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
                                    {leads.map((lead) => (
                                        <tr
                                            key={lead.website}
                                            className="border-t border-slate-800 hover:bg-slate-900/50 transition"
                                        >
                                            <td className="px-4 py-3 align-top max-w-[220px]">
                                                <p className="font-medium text-white truncate">{lead.title}</p>
                                                <a
                                                    href={lead.website}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs text-emerald-400 hover:underline truncate block"
                                                >
                                                    {lead.hostname}
                                                </a>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                {lead.emails.length > 0 ? (
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
                                                {lead.phones.length > 0 ? (
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
                                                {lead.socials.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {lead.socials.map((s) => (
                                                            <a
                                                                key={s.url}
                                                                href={s.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-fuchsia-300 text-xs hover:underline"
                                                            >
                                                                {s.platform}
                                                            </a>
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

                            {/* Toast Notifications container safely mounted */}
                            {toast && (
                                <div className="fixed bottom-6 right-6 bg-emerald-500 text-slate-950 text-sm font-medium px-4 py-3 rounded-lg shadow-lg z-50">
                                    {toast}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}