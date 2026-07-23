import { NextResponse } from "next/server";

const SOCIAL_DOMAINS = {
    "facebook.com": "Facebook",
    "instagram.com": "Instagram",
    "linkedin.com": "LinkedIn",
    "twitter.com": "Twitter",
    "x.com": "Twitter",
    "youtube.com": "YouTube",
    "tiktok.com": "TikTok",
    "wa.me": "WhatsApp",
    "whatsapp.com": "WhatsApp",
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const MAILTO_REGEX = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
const TEL_REGEX = /tel:([+\d][\d\s\-().]{6,20})/gi;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
const HREF_REGEX = /href=["']([^"']+)["']/gi;

// Domains that are never real leads, skip scraping these
const SKIP_DOMAINS = ["facebook.com", "instagram.com", "linkedin.com", "youtube.com", "yelp.com", "tripadvisor.com"];

function extractSocials(html, baseUrl) {
    const found = new Map();
    let match;
    while ((match = HREF_REGEX.exec(html)) !== null) {
        let href = match[1];
        try {
            const resolved = href.startsWith("http") ? href : new URL(href, baseUrl).href;
            const host = new URL(resolved).hostname.replace("www.", "");
            for (const domain in SOCIAL_DOMAINS) {
                if (host.includes(domain) && !found.has(SOCIAL_DOMAINS[domain])) {
                    found.set(SOCIAL_DOMAINS[domain], resolved);
                }
            }
        } catch { }
    }
    return Array.from(found, ([platform, url]) => ({ platform, url }));
}

function extractEmails(html) {
    const fromMailto = [...html.matchAll(MAILTO_REGEX)].map((m) => m[1]);
    const fromText = html.match(EMAIL_REGEX) || [];
    const all = [...fromMailto, ...fromText]
        .map((e) => e.trim().toLowerCase())
        .filter((e) => !e.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)); // filter image-name false positives
    return [...new Set(all)].slice(0, 5);
}

function extractPhones(html) {
    const fromTel = [...html.matchAll(TEL_REGEX)].map((m) => m[1].trim());
    const fromText = (html.match(PHONE_REGEX) || []).filter(
        (p) => p.replace(/\D/g, "").length >= 7 && p.replace(/\D/g, "").length <= 14
    );
    const all = [...fromTel, ...fromText];
    return [...new Set(all)].slice(0, 3);
}

async function scrapeWebsite(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            },
        });
        clearTimeout(timeout);

        if (!res.ok) return { emails: [], phones: [], socials: [] };

        const html = await res.text();
        return {
            emails: extractEmails(html),
            phones: extractPhones(html),
            socials: extractSocials(html, url),
        };
    } catch (err) {
        return { emails: [], phones: [], socials: [] };
    }
}

// 
const SERPER_RESULTS_COUNT = 50;
const SCRAPE_LIMIT = 50;
const PLACES_PAGES = 5; // each page ~20 places, so 2 pages ≈ 40 businesses

async function fetchPlaces(searchQuery, page) {
    const res = await fetch("https://google.serper.dev/places", {
        method: "POST",
        headers: {
            "X-API-KEY": process.env.SERPER_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: searchQuery, page }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.places || [];
}

export async function POST(request) {
    try {
        const { query, location } = await request.json();
        if (!query || !query.trim()) {
            return NextResponse.json({ error: "Search query is required" }, { status: 400 });
        }

        const searchQuery = location && location !== "any" ? `${query} in ${location}` : query;

        // Pull multiple pages of Places results to get closer to 50-60
        const pagesResults = await Promise.all(
            Array.from({ length: PLACES_PAGES }, (_, i) => fetchPlaces(searchQuery, i + 1))
        );
        const places = pagesResults.flat().filter((p) => p.website); // only ones with a website worth scraping

        // Scrape each business's own website for emails/socials (phone often already in Places data)
        const scraped = await Promise.all(
            places.slice(0, SCRAPE_LIMIT).map(async (place) => {
                const contactData = await scrapeWebsite(place.website);
                let hostname = "";
                try {
                    hostname = new URL(place.website).hostname.replace("www.", "");
                } catch { }

                return {
                    title: place.title || hostname,
                    website: place.website,
                    hostname,
                    address: place.address || "",
                    rating: place.rating || null,
                    emails: contactData.emails,
                    phones: place.phoneNumber ? [place.phoneNumber, ...contactData.phones] : contactData.phones,
                    socials: contactData.socials,
                };
            })
        );

        return NextResponse.json({ leads: scraped, query: searchQuery });
    } catch (err) {
        console.error("search-leads error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}