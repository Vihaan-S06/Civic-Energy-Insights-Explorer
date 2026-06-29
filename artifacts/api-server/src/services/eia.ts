/**
 * EIA (U.S. Energy Information Administration) data service.
 *
 * Architecture:
 *  1. Attempt to fetch live data from the EIA Open Data API v2
 *     (requires EIA_API_KEY env var — free registration at eia.gov/opendata)
 *  2. On any failure (missing key, network error, parse error, timeout)
 *     fall back to the bundled hardcoded datasets and flag the response
 *     as "estimated" so the UI can show the appropriate badge.
 *
 * Callers should always call the region-specific helper (e.g. fetchOverview)
 * rather than hitting the EIA API directly so that caching and fallbacks are
 * applied consistently.
 */

const EIA_API_KEY = process.env["EIA_API_KEY"] ?? "";
const EIA_BASE = "https://api.eia.gov/v2";
const TIMEOUT_MS = 5_000;
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EiaResult<T> {
  data: T;
  isEstimated: boolean;  // true when we fell back to hardcoded data
  source: "eia-live" | "estimated";
  fetchedAt: string;     // ISO timestamp
}

// ---------------------------------------------------------------------------
// Core fetch helper — timeout + caching
// ---------------------------------------------------------------------------

async function eiaFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  if (!EIA_API_KEY) throw new Error("EIA_API_KEY not configured");

  const url = new URL(`${EIA_BASE}${path}`);
  url.searchParams.set("api_key", EIA_API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`EIA responded with ${res.status}`);
    const json = await res.json() as T;
    cache.set(cacheKey, { data: json, expiresAt: Date.now() + CACHE_TTL_MS });
    return json;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Public helpers — each returns EiaResult<T> and never throws
// ---------------------------------------------------------------------------

/**
 * Wrap a fallback-first pattern: try `fetcher`, fall back to `fallback`.
 */
export async function withFallback<T>(
  fetcher: () => Promise<T>,
  fallback: T,
): Promise<EiaResult<T>> {
  if (!EIA_API_KEY) {
    return {
      data: fallback,
      isEstimated: true,
      source: "estimated",
      fetchedAt: new Date().toISOString(),
    };
  }

  try {
    const data = await fetcher();
    return {
      data,
      isEstimated: false,
      source: "eia-live",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return {
      data: fallback,
      isEstimated: true,
      source: "estimated",
      fetchedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// EIA series IDs used by this app (for documentation/future use)
// ---------------------------------------------------------------------------
// Electricity generation by source (monthly, all sectors):
//   ELEC.GEN.{source}-{state}-99.M
//   sources: COL (coal), NG (natural gas), NUC (nuclear), WND (wind),
//            SUN (solar), HYC (hydro conventional), OTH (other)
//
// Retail electricity price:
//   ELEC.PRICE.{state}-ALL.M
//
// CO₂ intensity is not directly provided by EIA; it must be derived from
// fuel consumption data (series ELEC.CONS_EG.{source}-{state}-99.M) and
// emission factors from the EIA/EPA emissions factors tables.
// ---------------------------------------------------------------------------

export { eiaFetch };
