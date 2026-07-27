"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { GetCountries, GetState, GetCity } from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";

export default function LeadsPage() {
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [loading, setLoading] = useState(false);
    const [leads, setLeads] = useState([]);
    const [error, setError] = useState("");
    const [savedLinks, setSavedLinks] = useState(new Set());
    const [savingLink, setSavingLink] = useState(null);
    const [toast, setToast] = useState("");

    // Location Dropdown States
    const [countriesList, setCountriesList] = useState([]);
    const [statesList, setStatesList] = useState([]);
    const [citiesList, setCitiesList] = useState([]);

    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedState, setSelectedState] = useState(null);

    // Fetch initial country list
    useEffect(() => {
        GetCountries().then((result) => setCountriesList(result));
    }, []);

    // Handle Country Selection -> Fetch States
    const handleCountryChange = (e) => {
        const countryId = Number(e.target.value);
        const country = countriesList.find((c) => c.id === countryId);

        setSelectedCountry(country || null);
        setSelectedState(null);
        setStatesList([]);
        setCitiesList([]);
        setLocation(country ? country.name : "");

        if (country) {
            GetState(country.id).then((result) => setStatesList(result));
        }
    };

    // Handle State Selection -> Fetch Cities
    const handleStateChange = (e) => {
        const stateId = Number(e.target.value);
        const state = statesList.find((s) => s.id === stateId);

        setSelectedState(state || null);
        setCitiesList([]);
        setLocation(state ? `${state.name}, ${selectedCountry?.name}` : selectedCountry?.name || "");

        if (selectedCountry && state) {
            GetCity(selectedCountry.id, state.id).then((result) => setCitiesList(result));
        }
    };

    // Handle City Selection
    const handleCityChange = (e) => {
        const cityName = e.target.value;
        if (cityName) {
            setLocation(`${cityName}, ${selectedCountry?.name}`);
        } else if (selectedState) {
            setLocation(`${selectedState.name}, ${selectedCountry?.name}`);
        }
    };

    async function handleSearch(e) {
        e.preventDefault();
        if (!query.trim()) {
            setError('Type something to search, like "Restaurants".');
            return;
        }
        setError("");
        setLoading(true);
        setLeads([]);
        setSavedLinks(new Set());

        try {
            const res = await fetch("/api/search-leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, location: location.trim() || "any" }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Search failed. Try again.");
            } else {
                console.log(data.leads)
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
        setSavingLink(lead.id);
        try {
            await addDoc(collection(db, "leads"), {
                title: lead.title,
                website: lead.website,
                hostname: lead.hostname,
                address: lead.address,
                mapLink: lead.mapLink,
                emails: lead.emails,
                phones: lead.phones,
                socials: lead.socials,
                searchQuery: query,
                location: location.trim() || "any",
                createdAt: serverTimestamp(),
            });
            setSavedLinks((prev) => new Set(prev).add(lead.id));
            showToast("Lead saved to Firebase.");
        } catch (err) {
            console.error(err);
            showToast("Couldn't save this lead. Try again.");
        } finally {
            setSavingLink(null);
        }
    }

    async function saveAll() {
        const unsaved = leads.filter((l) => !savedLinks.has(l.id));
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
                    className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4"
                >
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder='e.g. "Restaurants"'
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500 transition"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-medium rounded-lg px-6 py-3 text-sm transition"
                        >
                            {loading ? "Searching..." : "Search leads"}
                        </button>
                    </div>

                    {/* Cascading Location Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Country Select */}
                        <select
                            onChange={handleCountryChange}
                            defaultValue=""
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 text-slate-200 transition"
                        >
                            <option value="">Select Country (Optional)</option>
                            {countriesList.map((country) => (
                                <option key={country.id} value={country.id}>
                                    {country.name}
                                </option>
                            ))}
                        </select>

                        {/* State Select */}
                        <select
                            onChange={handleStateChange}
                            disabled={!statesList.length}
                            defaultValue=""
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 text-slate-200 disabled:opacity-40 transition"
                        >
                            <option value="">Select State / Region</option>
                            {statesList.map((state) => (
                                <option key={state.id} value={state.id}>
                                    {state.name}
                                </option>
                            ))}
                        </select>

                        {/* City Select */}
                        <select
                            onChange={handleCityChange}
                            disabled={!citiesList.length}
                            defaultValue=""
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 text-slate-200 disabled:opacity-40 transition"
                        >
                            <option value="">Select City</option>
                            {citiesList.map((city) => (
                                <option key={city.id} value={city.name}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </form>

                {error && <p className="text-rose-400 text-sm mt-3">{error}</p>}

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center gap-3 mt-10 text-slate-400 text-sm">
                        <span className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        Searching and visiting each website for contact details — this may take a while.
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
                                        <th className="text-left px-4 py-3 font-medium">Location</th>
                                        <th className="text-left px-4 py-3 font-medium">Emails</th>
                                        <th className="text-left px-4 py-3 font-medium">Phones</th>
                                        <th className="text-left px-4 py-3 font-medium">Social</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <tr
                                            key={lead.id}
                                            className="border-t border-slate-800 hover:bg-slate-900/50 transition"
                                        >
                                            <td className="px-4 py-3 align-top max-w-[220px]">
                                                <p className="font-medium text-white truncate">{lead.title}</p>
                                                {lead.website && (
                                                    <a
                                                        href={lead.website}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-emerald-400 hover:underline truncate block"
                                                    >
                                                        {lead.hostname}
                                                    </a>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 align-top max-w-[200px]">
                                                {lead.address && (
                                                    <p className="text-slate-400 text-xs truncate">{lead.address}</p>
                                                )}
                                                {lead.mapLink ? (
                                                    <a
                                                        href={lead.mapLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-sky-400 hover:underline"
                                                    >
                                                        View on map
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-600 text-xs">—</span>
                                                )}
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

                            {/* Toast Notifications */}
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