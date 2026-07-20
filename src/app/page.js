import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-6 py-12">
      <div className="max-w-xl w-full text-center bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">

        {/* Subtle decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Visual Badge/Icon Replacement */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 mb-6 text-emerald-400 text-2xl font-mono shadow-inner">
          🔍
        </div>

        {/* Messaging */}
        <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-3">
          Lead Automation Engine
        </p>

        <h1 className="text-3xl font-semibold text-white tracking-tight mb-4">
          Scrape Latest Leads from Google Search
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Need fresh, targeted contact data? Run live deep-searches across Google Maps and local business listings. Extract active phone numbers, public emails, and verified socials instantly back to Firebase.
        </p>

        {/* Route Redirect Action Button */}
        <Link href="/leads">
          <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl px-8 py-4 shadow-lg shadow-emerald-950/20 hover:scale-[1.01] active:scale-[0.99] transition duration-200 cursor-pointer">
            <span>Generate Leads Panel</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </Link>

      </div>
    </div>
  );
}