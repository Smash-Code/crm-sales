// Serper integration

// import { NextResponse } from "next/server";
// import { parsePhoneNumberFromString } from "libphonenumber-js";

// // npm install libphonenumber-js

// const SOCIAL_DOMAINS = {
//     "facebook.com": "Facebook",
//     "instagram.com": "Instagram",
//     "linkedin.com": "LinkedIn",
//     "twitter.com": "Twitter",
//     "x.com": "Twitter",
//     "youtube.com": "YouTube",
//     "tiktok.com": "TikTok",
//     "wa.me": "WhatsApp",
//     "whatsapp.com": "WhatsApp",
// };

// const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// const MAILTO_REGEX = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
// const TEL_REGEX = /tel:([+\d][\d\s\-().]{6,20})/gi;
// const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
// const HREF_REGEX = /href=["']([^"']+)["']/gi;

// // Domains that are never real leads, skip scraping these
// const SKIP_DOMAINS = ["facebook.com", "instagram.com", "linkedin.com", "youtube.com", "yelp.com", "tripadvisor.com"];

// // ---------------------------------------------------------------
// // Email quality filtering
// // ---------------------------------------------------------------

// // Domains that are never a real business contact email, even though
// // they match the email regex (placeholders, tooling, CDNs, schema noise, etc.)
// const EMAIL_DOMAIN_BLOCKLIST = new Set([
//     "example.com",
//     "example.org",
//     "example.net",
//     "test.com",
//     "email.com",
//     "domain.com",
//     "yourdomain.com",
//     "yourcompany.com",
//     "yoursite.com",
//     "company.com",
//     "sentry.io",
//     "wixpress.com",
//     "godaddy.com",
//     "cloudflare.com",
//     "schema.org",
//     "w3.org",
//     "google.com",
//     "gstatic.com",
//     "googleapis.com",
//     "wordpress.com",
//     "wp.com",
//     "placeholder.com",
//     "localhost",
//     "site.com",
// ]);

// // Local-part patterns that indicate a placeholder/system email rather than
// // a real contact address (e.g. "info@example.com", "noreply@...", "test@...")
// const EMAIL_LOCALPART_BLOCKLIST = [
//     /^noreply$/i,
//     /^no-reply$/i,
//     /^donotreply$/i,
//     /^do-not-reply$/i,
//     /^test$/i,
//     /^example$/i,
//     /^yourname$/i,
//     /^youremail$/i,
//     /^name$/i,
//     /^user$/i,
//     /^admin@localhost$/i,
//     /^sample$/i,
//     /^placeholder$/i,
// ];

// const IMAGE_EXT_REGEX = /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp)$/i;

// function isDummyEmail(email) {
//     const lower = email.trim().toLowerCase();

//     if (IMAGE_EXT_REGEX.test(lower)) return true;

//     const atIndex = lower.lastIndexOf("@");
//     if (atIndex === -1) return true;

//     const localPart = lower.slice(0, atIndex);
//     const domain = lower.slice(atIndex + 1);

//     if (EMAIL_DOMAIN_BLOCKLIST.has(domain)) return true;

//     // Reject domains that look like version numbers, hashes, or minified
//     // asset names picked up accidentally from JS/CSS bundles
//     if (/^[a-f0-9]{6,}$/i.test(domain.split(".")[0])) return true;

//     if (EMAIL_LOCALPART_BLOCKLIST.some((re) => re.test(localPart))) return true;

//     return false;
// }

// // Matches social URLs appearing anywhere in the raw HTML/JS text, not just
// // inside href="..." attributes — catches links injected by JS frameworks,
// // embedded in JSON blobs, data-* attributes, or inline onclick handlers.
// const SOCIAL_URL_REGEX = /https?:\/\/(?:www\.)?(facebook|instagram|linkedin|twitter|x|youtube|tiktok|wa|whatsapp)\.(?:com|me)\/[^\s"'<>)\]]*/gi;

// function extractSocials(html, baseUrl) {
//     const found = new Map();

//     // Pass 1: proper <a href="..."> links (most reliable, resolves relative URLs)
//     let match;
//     while ((match = HREF_REGEX.exec(html)) !== null) {
//         let href = match[1];
//         try {
//             const resolved = href.startsWith("http") ? href : new URL(href, baseUrl).href;
//             const host = new URL(resolved).hostname.replace("www.", "");
//             for (const domain in SOCIAL_DOMAINS) {
//                 if (host.includes(domain) && !found.has(SOCIAL_DOMAINS[domain])) {
//                     found.set(SOCIAL_DOMAINS[domain], resolved);
//                 }
//             }
//         } catch { }
//     }

//     // Pass 2: raw social URLs anywhere else in the page (JS-rendered nav/footers,
//     // JSON-LD structured data, data-* attributes, inline scripts, etc.)
//     const rawUrls = html.match(SOCIAL_URL_REGEX) || [];
//     for (const rawUrl of rawUrls) {
//         try {
//             const host = new URL(rawUrl).hostname.replace("www.", "");
//             for (const domain in SOCIAL_DOMAINS) {
//                 if (host.includes(domain) && !found.has(SOCIAL_DOMAINS[domain])) {
//                     found.set(SOCIAL_DOMAINS[domain], rawUrl.replace(/[.,;]+$/, ""));
//                 }
//             }
//         } catch { }
//     }

//     return Array.from(found, ([platform, url]) => ({ platform, url }));
// }

// // ---------------------------------------------------------------
// // Country detection (from Google Places address string)
// // ---------------------------------------------------------------

// // Maps common country names/variants (as they appear in Google Places
// // addresses) to ISO 3166-1 alpha-2 codes used by libphonenumber-js.
// const COUNTRY_NAME_TO_ISO = {
//     "united states": "US", "usa": "US", "united states of america": "US",
//     "united kingdom": "GB", "uk": "GB", "great britain": "GB",
//     "pakistan": "PK",
//     "india": "IN",
//     "canada": "CA",
//     "australia": "AU",
//     "united arab emirates": "AE", "uae": "AE",
//     "saudi arabia": "SA",
//     "germany": "DE",
//     "france": "FR",
//     "spain": "ES",
//     "italy": "IT",
//     "netherlands": "NL",
//     "belgium": "BE",
//     "switzerland": "CH",
//     "austria": "AT",
//     "ireland": "IE",
//     "portugal": "PT",
//     "sweden": "SE",
//     "norway": "NO",
//     "denmark": "DK",
//     "finland": "FI",
//     "poland": "PL",
//     "russia": "RU",
//     "turkey": "TR",
//     "china": "CN",
//     "japan": "JP",
//     "south korea": "KR", "korea": "KR",
//     "singapore": "SG",
//     "malaysia": "MY",
//     "indonesia": "ID",
//     "thailand": "TH",
//     "vietnam": "VN",
//     "philippines": "PH",
//     "bangladesh": "BD",
//     "sri lanka": "LK",
//     "nepal": "NP",
//     "egypt": "EG",
//     "nigeria": "NG",
//     "kenya": "KE",
//     "south africa": "ZA",
//     "brazil": "BR",
//     "mexico": "MX",
//     "argentina": "AR",
//     "chile": "CL",
//     "colombia": "CO",
//     "new zealand": "NZ",
//     "qatar": "QA",
//     "kuwait": "KW",
//     "bahrain": "BH",
//     "oman": "OM",
//     "jordan": "JO",
//     "iraq": "IQ",
//     "israel": "IL",
//     "greece": "GR",
//     "ukraine": "UA",
//     "romania": "RO",
//     "czech republic": "CZ", "czechia": "CZ",
//     "hungary": "HU",
//     "portugal": "PT",
// };

// /**
//  * Extracts an ISO country code from any free-text location string
//  * (a Google Places address, or a user-supplied "location" search term),
//  * e.g. "123 Main St, Faisalabad, Punjab, Pakistan" -> "PK",
//  * or just "Pakistan" / "Faisalabad, Pakistan" -> "PK".
//  * Returns null if nothing matches.
//  */
// function detectCountryFromText(text) {
//     if (!text) return null;

//     const segments = text.split(",").map((s) => s.trim().toLowerCase());

//     // Country is almost always the last segment, but check the last
//     // couple in case of trailing postal codes etc.
//     for (const segment of segments.slice(-2).reverse()) {
//         // Strip trailing postal codes / numbers, e.g. "Pakistan 38000"
//         const cleaned = segment.replace(/\d+/g, "").trim();
//         if (COUNTRY_NAME_TO_ISO[cleaned]) {
//             return COUNTRY_NAME_TO_ISO[cleaned];
//         }
//     }

//     // Last resort: check if any known country name appears anywhere in the text
//     const lowerText = text.toLowerCase();
//     for (const name in COUNTRY_NAME_TO_ISO) {
//         if (lowerText.includes(name)) {
//             return COUNTRY_NAME_TO_ISO[name];
//         }
//     }

//     return null;
// }

// // Kept as an alias for clarity at call sites that specifically pass an address.
// const detectCountryFromAddress = detectCountryFromText;

// // ---------------------------------------------------------------
// // Google Maps link builder
// // ---------------------------------------------------------------

// /**
//  * Builds the best available Google Maps link for a Serper Places result,
//  * in order of precision:
//  * 1. cid (Google's unique place identifier) -> opens the exact business
//  *    listing on Maps, same as clicking it in normal Google search results.
//  * 2. latitude/longitude -> drops a pin at the exact coordinates.
//  * 3. address text -> falls back to a Maps text search, still points to
//  *    the right general spot even without exact coordinates.
//  * Returns null only if none of the above are available.
//  */
// function buildMapLink(place) {
//     if (place.cid) {
//         return `https://www.google.com/maps?cid=${place.cid}`;
//     }

//     if (place.latitude != null && place.longitude != null) {
//         return `https://www.google.com/maps?q=${place.latitude},${place.longitude}`;
//     }

//     if (place.address) {
//         const query = place.title
//             ? `${place.title}, ${place.address}`
//             : place.address;
//         return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
//     }

//     return null;
// }

// // ---------------------------------------------------------------
// // Phone number normalization
// // ---------------------------------------------------------------

// /**
//  * Parses a raw phone string and returns a clean, validated,
//  * internationally-formatted number (e.g. "+92 300 1234567").
//  * Returns null if the number can't be validated — invalid/garbage
//  * numbers are dropped rather than shown in a broken format.
//  */
// function formatPhone(raw, defaultCountry = "PK") {
//     if (!raw) return null;

//     const cleaned = raw.trim();

//     // Try parsing as-is first (handles numbers that already include +countrycode)
//     let phoneNumber = parsePhoneNumberFromString(cleaned);

//     // Fall back to assuming the default country if no country code present
//     if (!phoneNumber || !phoneNumber.isValid()) {
//         phoneNumber = parsePhoneNumberFromString(cleaned, defaultCountry);
//     }

//     if (!phoneNumber || !phoneNumber.isValid()) return null;

//     return phoneNumber.formatInternational(); // e.g. "+92 300 1234567"
// }

// function formatPhoneList(rawPhones, defaultCountry = "PK") {
//     const formatted = rawPhones
//         .map((p) => formatPhone(p, defaultCountry))
//         .filter(Boolean);
//     return [...new Set(formatted)];
// }

// // Pulls social profile links out of a Serper organic search response
// // (result link fields), for businesses that don't have their own website.
// function extractSocialsFromSearchResults(data) {
//     const found = new Map();
//     const organic = data.organic || [];

//     for (const result of organic) {
//         if (!result.link) continue;
//         try {
//             const host = new URL(result.link).hostname.replace("www.", "");
//             for (const domain in SOCIAL_DOMAINS) {
//                 if (host.includes(domain) && !found.has(SOCIAL_DOMAINS[domain])) {
//                     found.set(SOCIAL_DOMAINS[domain], result.link);
//                 }
//             }
//         } catch { }
//     }

//     return Array.from(found, ([platform, url]) => ({ platform, url }));
// }

// async function findBusinessContact(place, defaultCountry) {
//     const contactQuery = `"${place.title}" "${place.address}" phone`;
//     const socialQuery = `"${place.title}" "${place.address}" (facebook.com OR instagram.com OR linkedin.com)`;

//     const [contactRes, socialRes] = await Promise.all([
//         fetch("https://google.serper.dev/search", {
//             method: "POST",
//             headers: {
//                 "X-API-KEY": process.env.SERPER_API_KEY,
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ q: contactQuery, num: 10 }),
//         }),
//         fetch("https://google.serper.dev/search", {
//             method: "POST",
//             headers: {
//                 "X-API-KEY": process.env.SERPER_API_KEY,
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ q: socialQuery, num: 10 }),
//         }),
//     ]);

//     const result = { phones: [], emails: [], socials: [] };

//     if (contactRes.ok) {
//         const data = await contactRes.json();
//         const text = JSON.stringify(data);
//         // Phone numbers from general web search are reasonably safe since
//         // they're numeric and tied to the exact business+address query.
//         result.phones = extractPhones(text, defaultCountry);
//         // Emails from general web search are unreliable — they may belong
//         // to directory/review sites rather than the business itself — so we
//         // still filter dummies, but treat this as best-effort only.
//         result.emails = extractEmails(text);
//     }

//     if (socialRes.ok) {
//         const socialData = await socialRes.json();
//         result.socials = extractSocialsFromSearchResults(socialData);
//     }

//     return result;
// }

// function extractEmails(html) {
//     const fromMailto = [...html.matchAll(MAILTO_REGEX)].map((m) => m[1]);
//     const fromText = html.match(EMAIL_REGEX) || [];
//     const all = [...fromMailto, ...fromText]
//         .map((e) => e.trim().toLowerCase())
//         .filter((e) => !isDummyEmail(e));
//     return [...new Set(all)].slice(0, 5);
// }

// function extractPhones(html, defaultCountry = "PK") {
//     const fromTel = [...html.matchAll(TEL_REGEX)].map((m) => m[1].trim());
//     const fromText = (html.match(PHONE_REGEX) || []).filter(
//         (p) => p.replace(/\D/g, "").length >= 7 && p.replace(/\D/g, "").length <= 14
//     );
//     const all = [...fromTel, ...fromText];
//     return formatPhoneList(all, defaultCountry);
// }

// async function scrapeWebsite(url, defaultCountry) {
//     try {
//         const controller = new AbortController();
//         const timeout = setTimeout(() => controller.abort(), 6000);

//         const res = await fetch(url, {
//             signal: controller.signal,
//             headers: {
//                 "User-Agent":
//                     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
//             },
//         });
//         clearTimeout(timeout);

//         if (!res.ok) return { emails: [], phones: [], socials: [] };

//         const html = await res.text();
//         return {
//             emails: extractEmails(html),
//             phones: extractPhones(html, defaultCountry),
//             socials: extractSocials(html, url),
//         };
//     } catch (err) {
//         return { emails: [], phones: [], socials: [] };
//     }
// }

// // 
// const SERPER_RESULTS_COUNT = 50;
// const SCRAPE_LIMIT = 50;
// const PLACES_PAGES = 5; // each page ~20 places, so 2 pages ≈ 40 businesses

// async function fetchPlaces(searchQuery, page) {
//     const res = await fetch("https://google.serper.dev/places", {
//         method: "POST",
//         headers: {
//             "X-API-KEY": process.env.SERPER_API_KEY,
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ q: searchQuery, page }),
//     });
//     if (!res.ok) return [];
//     const data = await res.json();
//     return data.places || [];
// }

// export async function POST(request) {
//     try {
//         const { query, location, country } = await request.json();

//         if (!query || !query.trim()) {
//             return NextResponse.json(
//                 { error: "Search query is required" },
//                 { status: 400 }
//             );
//         }

//         // Fallback ISO country code chain, in order of trust:
//         // 1. Country detected directly from each business's own address (most accurate)
//         // 2. Country detected from the search "location" the user typed
//         //    (e.g. "Faisalabad, Pakistan" or "New York, USA")
//         // 3. Explicit "country" field passed in the request body
//         // 4. Hardcoded "PK" as an absolute last resort
//         const locationCountry = detectCountryFromText(location);
//         const defaultCountry = locationCountry || country || "PK";

//         const searchQuery =
//             location && location !== "any"
//                 ? `${query} in ${location}`
//                 : query;

//         // Fetch multiple pages of Google Places results
//         const pagesResults = await Promise.all(
//             Array.from(
//                 { length: PLACES_PAGES },
//                 (_, i) => fetchPlaces(searchQuery, i + 1)
//             )
//         );

//         // Get all places
//         const places = pagesResults.flat();

//         // Remove duplicate businesses
//         const uniquePlaces = Array.from(
//             new Map(
//                 places.map((place) => [
//                     `${place.title}-${place.address}`,
//                     place,
//                 ])
//             ).values()
//         );

//         // Separate businesses with and without websites
//         const placesWithoutWebsite = uniquePlaces.filter(
//             (place) => !place.website
//         );

//         const placesWithWebsite = uniquePlaces.filter(
//             (place) => place.website
//         );

//         // ---------------------------------------------------
//         // 1. Process businesses WITHOUT websites first
//         // ---------------------------------------------------
//         const noWebsiteLeads = await Promise.all(
//             placesWithoutWebsite.map(async (place, i) => {

//                 // Use the country embedded in this specific place's address
//                 // (e.g. "...Faisalabad, Punjab, Pakistan" -> PK) so a US
//                 // lead doesn't get parsed as if it were Pakistani, etc.
//                 const placeCountry = detectCountryFromAddress(place.address) || defaultCountry;

//                 const contactData =
//                     await findBusinessContact(place, placeCountry);

//                 // Prefer the phone number Google Places itself has on file
//                 // (most reliable) and merge with web-search-derived ones.
//                 const placesPhone = place.phoneNumber
//                     ? formatPhoneList([place.phoneNumber], placeCountry)
//                     : [];

//                 return {
//                     id: `no-website-${i}-${place.title || ""}`,
//                     title: place.title || "",
//                     website: null,
//                     hostname: "",

//                     address: place.address || "",
//                     rating: place.rating || null,
//                     mapLink: buildMapLink(place),

//                     phones: [
//                         ...new Set([...placesPhone, ...contactData.phones]),
//                     ],

//                     emails: [
//                         ...new Set(contactData.emails),
//                     ],

//                     socials: contactData.socials,

//                     hasWebsite: false,
//                     priority: "high",
//                 };
//             })
//         );

//         // ---------------------------------------------------
//         // 2. Scrape businesses WITH websites
//         // ---------------------------------------------------

//         const websiteLeads = await Promise.all(
//             placesWithWebsite
//                 .slice(0, SCRAPE_LIMIT)
//                 .map(async (place, i) => {
//                     const placeCountry = detectCountryFromAddress(place.address) || defaultCountry;

//                     const contactData = await scrapeWebsite(place.website, placeCountry);

//                     let hostname = "";

//                     try {
//                         hostname = new URL(place.website)
//                             .hostname
//                             .replace("www.", "");
//                     } catch { }

//                     const placesPhone = place.phoneNumber
//                         ? formatPhoneList([place.phoneNumber], placeCountry)
//                         : [];

//                     return {
//                         id: `website-${i}-${hostname || place.title || ""}`,
//                         title: place.title || hostname,
//                         website: place.website,
//                         hostname,

//                         address: place.address || "",
//                         rating: place.rating || null,
//                         mapLink: buildMapLink(place),

//                         emails: contactData.emails,

//                         phones: [
//                             ...new Set([...placesPhone, ...contactData.phones]),
//                         ],

//                         socials: contactData.socials,

//                         hasWebsite: true,
//                         priority: "normal",
//                     };
//                 })
//         );

//         // ---------------------------------------------------
//         // 3. Put businesses WITHOUT websites first
//         // ---------------------------------------------------

//         const leads = [
//             ...noWebsiteLeads,
//             ...websiteLeads,
//         ];

//         return NextResponse.json({
//             leads,
//             query: searchQuery,

//             // Optional statistics for your frontend
//             stats: {
//                 total: leads.length,
//                 withoutWebsite: noWebsiteLeads.length,
//                 withWebsite: websiteLeads.length,
//             },
//         });

//     } catch (err) {
//         console.error("search-leads error:", err);

//         return NextResponse.json(
//             { error: "Something went wrong" },
//             { status: 500 }
//         );
//     }
// }


import { NextResponse } from "next/server";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// npm install libphonenumber-js

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

// ---------------------------------------------------------------
// Email quality filtering
// ---------------------------------------------------------------

const EMAIL_DOMAIN_BLOCKLIST = new Set([
    "example.com", "example.org", "example.net", "test.com", "email.com",
    "domain.com", "yourdomain.com", "yourcompany.com", "yoursite.com",
    "company.com", "sentry.io", "wixpress.com", "godaddy.com", "cloudflare.com",
    "schema.org", "w3.org", "google.com", "gstatic.com", "googleapis.com",
    "wordpress.com", "wp.com", "placeholder.com", "localhost", "site.com",
]);

const EMAIL_LOCALPART_BLOCKLIST = [
    /^noreply$/i, /^no-reply$/i, /^donotreply$/i, /^do-not-reply$/i,
    /^test$/i, /^example$/i, /^yourname$/i, /^youremail$/i, /^name$/i,
    /^user$/i, /^admin@localhost$/i, /^sample$/i, /^placeholder$/i,
];

const IMAGE_EXT_REGEX = /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp)$/i;

function isDummyEmail(email) {
    const lower = email.trim().toLowerCase();
    if (IMAGE_EXT_REGEX.test(lower)) return true;

    const atIndex = lower.lastIndexOf("@");
    if (atIndex === -1) return true;

    const localPart = lower.slice(0, atIndex);
    const domain = lower.slice(atIndex + 1);

    if (EMAIL_DOMAIN_BLOCKLIST.has(domain)) return true;
    if (/^[a-f0-9]{6,}$/i.test(domain.split(".")[0])) return true;
    if (EMAIL_LOCALPART_BLOCKLIST.some((re) => re.test(localPart))) return true;

    return false;
}

// Matches social URLs appearing anywhere in the raw HTML/JS text, not just
// inside href="..." attributes — catches links injected by JS frameworks,
// embedded in JSON blobs, data-* attributes, or inline onclick handlers.
const SOCIAL_URL_REGEX = /https?:\/\/(?:www\.)?(facebook|instagram|linkedin|twitter|x|youtube|tiktok|wa|whatsapp)\.(?:com|me)\/[^\s"'<>)\]]*/gi;

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

    const rawUrls = html.match(SOCIAL_URL_REGEX) || [];
    for (const rawUrl of rawUrls) {
        try {
            const host = new URL(rawUrl).hostname.replace("www.", "");
            for (const domain in SOCIAL_DOMAINS) {
                if (host.includes(domain) && !found.has(SOCIAL_DOMAINS[domain])) {
                    found.set(SOCIAL_DOMAINS[domain], rawUrl.replace(/[.,;]+$/, ""));
                }
            }
        } catch { }
    }

    return Array.from(found, ([platform, url]) => ({ platform, url }));
}

// ---------------------------------------------------------------
// Country detection (from Google Places address string)
// ---------------------------------------------------------------

const COUNTRY_NAME_TO_ISO = {
    "united states": "US", "usa": "US", "united states of america": "US",
    "united kingdom": "GB", "uk": "GB", "great britain": "GB",
    "pakistan": "PK", "india": "IN", "canada": "CA", "australia": "AU",
    "united arab emirates": "AE", "uae": "AE", "saudi arabia": "SA",
    "germany": "DE", "france": "FR", "spain": "ES", "italy": "IT",
    "netherlands": "NL", "belgium": "BE", "switzerland": "CH", "austria": "AT",
    "ireland": "IE", "portugal": "PT", "sweden": "SE", "norway": "NO",
    "denmark": "DK", "finland": "FI", "poland": "PL", "russia": "RU",
    "turkey": "TR", "china": "CN", "japan": "JP", "south korea": "KR",
    "korea": "KR", "singapore": "SG", "malaysia": "MY", "indonesia": "ID",
    "thailand": "TH", "vietnam": "VN", "philippines": "PH", "bangladesh": "BD",
    "sri lanka": "LK", "nepal": "NP", "egypt": "EG", "nigeria": "NG",
    "kenya": "KE", "south africa": "ZA", "brazil": "BR", "mexico": "MX",
    "argentina": "AR", "chile": "CL", "colombia": "CO", "new zealand": "NZ",
    "qatar": "QA", "kuwait": "KW", "bahrain": "BH", "oman": "OM", "jordan": "JO",
    "iraq": "IQ", "israel": "IL", "greece": "GR", "ukraine": "UA",
    "romania": "RO", "czech republic": "CZ", "czechia": "CZ", "hungary": "HU",
};

function detectCountryFromText(text) {
    if (!text) return null;

    const segments = text.split(",").map((s) => s.trim().toLowerCase());

    for (const segment of segments.slice(-2).reverse()) {
        const cleaned = segment.replace(/\d+/g, "").trim();
        if (COUNTRY_NAME_TO_ISO[cleaned]) {
            return COUNTRY_NAME_TO_ISO[cleaned];
        }
    }

    const lowerText = text.toLowerCase();
    for (const name in COUNTRY_NAME_TO_ISO) {
        if (lowerText.includes(name)) {
            return COUNTRY_NAME_TO_ISO[name];
        }
    }

    return null;
}

const detectCountryFromAddress = detectCountryFromText;

// ---------------------------------------------------------------
// Google Maps link builder
// ---------------------------------------------------------------

/**
 * Google Places API (New) returns a ready-made `googleMapsUri` for every
 * place when you include it in the field mask — that's always the most
 * precise link, equivalent to the old cid-based link. We only fall back
 * to building one ourselves (lat/lng, then address text search) if that
 * field is somehow missing from the response.
 */
function buildMapLink(place) {
    if (place.googleMapsUri) {
        return place.googleMapsUri;
    }

    if (place.location?.latitude != null && place.location?.longitude != null) {
        return `https://www.google.com/maps?q=${place.location.latitude},${place.location.longitude}`;
    }

    if (place.formattedAddress) {
        const query = place.displayName?.text
            ? `${place.displayName.text}, ${place.formattedAddress}`
            : place.formattedAddress;
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }

    return null;
}

// ---------------------------------------------------------------
// Phone number normalization
// ---------------------------------------------------------------

function formatPhone(raw, defaultCountry = "PK") {
    if (!raw) return null;

    const cleaned = raw.trim();

    let phoneNumber = parsePhoneNumberFromString(cleaned);

    if (!phoneNumber || !phoneNumber.isValid()) {
        phoneNumber = parsePhoneNumberFromString(cleaned, defaultCountry);
    }

    if (!phoneNumber || !phoneNumber.isValid()) return null;

    return phoneNumber.formatInternational();
}

function formatPhoneList(rawPhones, defaultCountry = "PK") {
    const formatted = rawPhones
        .map((p) => formatPhone(p, defaultCountry))
        .filter(Boolean);
    return [...new Set(formatted)];
}

function extractEmails(html) {
    const fromMailto = [...html.matchAll(MAILTO_REGEX)].map((m) => m[1]);
    const fromText = html.match(EMAIL_REGEX) || [];
    const all = [...fromMailto, ...fromText]
        .map((e) => e.trim().toLowerCase())
        .filter((e) => !isDummyEmail(e));
    return [...new Set(all)].slice(0, 5);
}

function extractPhones(html, defaultCountry = "PK") {
    const fromTel = [...html.matchAll(TEL_REGEX)].map((m) => m[1].trim());
    const fromText = (html.match(PHONE_REGEX) || []).filter(
        (p) => p.replace(/\D/g, "").length >= 7 && p.replace(/\D/g, "").length <= 14
    );
    const all = [...fromTel, ...fromText];
    return formatPhoneList(all, defaultCountry);
}

async function scrapeWebsite(url, defaultCountry) {
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
            phones: extractPhones(html, defaultCountry),
            socials: extractSocials(html, url),
        };
    } catch (err) {
        return { emails: [], phones: [], socials: [] };
    }
}

// ---------------------------------------------------------------
// Google Places API (New) — Text Search
// ---------------------------------------------------------------

const SCRAPE_LIMIT = 50;
const PAGE_SIZE = 20; // Places API (New) max per page
const MAX_PAGES = 3; // Text Search (New) returns a max of 60 results across all pages total

const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.websiteUri",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.rating",
    "places.location",
    "places.googleMapsUri",
    "nextPageToken",
].join(",");

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPlacesFromGoogle(searchQuery) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_MAPS_API_KEY is not set");
    }

    let allPlaces = [];
    let pageToken = undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
        const body = {
            textQuery: searchQuery,
            pageSize: PAGE_SIZE,
        };
        if (pageToken) body.pageToken = pageToken;

        const res = await fetch(PLACES_TEXT_SEARCH_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": FIELD_MASK,
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            console.error("Places API error:", res.status, errBody);
            break;
        }

        const data = await res.json();
        const places = data.places || [];
        allPlaces = allPlaces.concat(places);

        if (!data.nextPageToken) break;
        pageToken = data.nextPageToken;

        // Google requires a short delay before a freshly issued pageToken becomes valid.
        await sleep(2000);
    }

    return allPlaces;
}

export async function POST(request) {
    try {
        const { query, location, country } = await request.json();

        if (!query || !query.trim()) {
            return NextResponse.json(
                { error: "Search query is required" },
                { status: 400 }
            );
        }

        // Fallback ISO country code chain, in order of trust:
        // 1. Country detected directly from each business's own address (most accurate)
        // 2. Country detected from the search "location" the user typed
        // 3. Explicit "country" field passed in the request body
        // 4. Hardcoded "PK" as an absolute last resort
        const locationCountry = detectCountryFromText(location);
        const defaultCountry = locationCountry || country || "PK";

        const searchQuery =
            location && location !== "any"
                ? `${query} in ${location}`
                : query;

        const rawPlaces = await fetchPlacesFromGoogle(searchQuery);

        // Remove duplicate businesses
        const uniquePlaces = Array.from(
            new Map(
                rawPlaces.map((place) => [
                    `${place.displayName?.text}-${place.formattedAddress}`,
                    place,
                ])
            ).values()
        );

        // Separate businesses with and without websites
        const placesWithoutWebsite = uniquePlaces.filter((place) => !place.websiteUri);
        const placesWithWebsite = uniquePlaces.filter((place) => place.websiteUri);

        // ---------------------------------------------------
        // 1. Businesses WITHOUT a website
        //    Google Places already gives us a validated phone number
        //    directly, so no extra lookup is needed here. Email/socials
        //    can't be discovered without a general web-search API, so
        //    those arrays are left empty for this group.
        // ---------------------------------------------------
        const noWebsiteLeads = placesWithoutWebsite.map((place, i) => {
            const placeCountry = detectCountryFromAddress(place.formattedAddress) || defaultCountry;
            const placePhone = place.nationalPhoneNumber || place.internationalPhoneNumber;

            return {
                id: `no-website-${i}-${place.id || place.displayName?.text || ""}`,
                title: place.displayName?.text || "",
                website: null,
                hostname: "",

                address: place.formattedAddress || "",
                rating: place.rating ?? null,
                mapLink: buildMapLink(place),

                phones: placePhone ? formatPhoneList([placePhone], placeCountry).slice(0, 3) : [],
                emails: [],
                socials: [],

                hasWebsite: false,
                priority: "high",
            };
        });

        // ---------------------------------------------------
        // 2. Businesses WITH a website — scrape for emails/phones/socials
        // ---------------------------------------------------
        const websiteLeads = await Promise.all(
            placesWithWebsite.slice(0, SCRAPE_LIMIT).map(async (place, i) => {
                const placeCountry = detectCountryFromAddress(place.formattedAddress) || defaultCountry;
                const contactData = await scrapeWebsite(place.websiteUri, placeCountry);

                let hostname = "";
                try {
                    hostname = new URL(place.websiteUri).hostname.replace("www.", "");
                } catch { }

                const placePhone = place.nationalPhoneNumber || place.internationalPhoneNumber;
                const placesPhoneFormatted = placePhone
                    ? formatPhoneList([placePhone], placeCountry)
                    : [];

                return {
                    id: `website-${i}-${hostname || place.displayName?.text || ""}`,
                    title: place.displayName?.text || hostname,
                    website: place.websiteUri,
                    hostname,

                    address: place.formattedAddress || "",
                    rating: place.rating ?? null,
                    mapLink: buildMapLink(place),

                    emails: contactData.emails,
                    phones: [...new Set([...placesPhoneFormatted, ...contactData.phones])].slice(0, 3),
                    socials: contactData.socials,

                    hasWebsite: true,
                    priority: "normal",
                };
            })
        );

        // Businesses without a website surface first — they're the
        // higher-priority leads since nobody else has scraped them yet.
        const leads = [...noWebsiteLeads, ...websiteLeads];

        return NextResponse.json({
            leads,
            query: searchQuery,
            stats: {
                total: leads.length,
                withoutWebsite: noWebsiteLeads.length,
                withWebsite: websiteLeads.length,
            },
        });
    } catch (err) {
        console.error("search-leads error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}