// Chart Quest — live market price proxy (Market Identity System)
// ---------------------------------------------------------------------------
// WHY THIS EXISTS
// The game shows the player's chosen Home Market at TODAY'S real price. Crypto
// and gold can be fetched straight from the browser (Binance/Coinbase are
// CORS-open and keyless), but EQUITIES AND INDICES CANNOT:
//   • Yahoo sends no Access-Control-Allow-Origin  → a browser fetch is blocked.
//   • Finnhub / Twelve Data / Polygon / AlphaVantage need an API KEY, and this
//     game ships as a single static HTML file — any key in it is public.
// So equities are proxied here, where a key (if one is ever provisioned) lives
// in Deno.env and never reaches the client.
//
// CORS = '*' ON PURPOSE.
// This endpoint returns nothing but public, already-public market prices: no
// user data, no auth, no secrets, nothing that an origin check would protect.
// The project's other functions carry an ALLOWED_ORIGINS allowlist, and that
// allowlist has ALREADY caused one silent production outage (the Netlify →
// Cloudflare move 403'd every telemetry + cloud-save call because the list
// still named the old domain). Re-using that pattern here would buy zero
// security and re-arm the same landmine, so this function is deliberately open
// and defended by an IP rate limit instead.
//
// MUST BE DEPLOYED WITH --no-verify-jwt. Guests play without an account; a JWT
// requirement would make prices work only for signed-in users.
// ---------------------------------------------------------------------------
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const RATE_LIMIT = 60;              // requests per window, per IP
const RATE_WINDOW_S = 60;
const CACHE_TTL_MS = 90_000;        // ~90s: fresh enough to feel live, light on providers
const FETCH_TIMEOUT_MS = 4_000;     // a slow provider must never hang the game

// Optional keyed provider. If FINNHUB_KEY is set as a function secret we use it
// for equities (reliable, ToS-clean). If it is absent we fall back to Yahoo,
// which is keyless but unofficial and rate-limited — good enough to look alive,
// never load-bearing. Set with: supabase secrets set FINNHUB_KEY=...
const FINNHUB_KEY = Deno.env.get('FINNHUB_KEY') || '';

// The 8 shipped Home Markets. Adding a market = one line here + one line in the
// game's HOME_MARKETS registry. `kind` picks the upstream.
const MARKETS: Record<string, { kind: 'binance' | 'equity'; symbol: string; label: string }> = {
  BTC:  { kind: 'binance', symbol: 'BTCUSDT',  label: 'Bitcoin' },
  ETH:  { kind: 'binance', symbol: 'ETHUSDT',  label: 'Ethereum' },
  SOL:  { kind: 'binance', symbol: 'SOLUSDT',  label: 'Solana' },
  // PAXG is 1:1 redeemable for an ounce of LBMA gold and tracks XAU within a
  // fraction of a percent — it is the only spot-gold proxy available keyless
  // and CORS-open, so gold behaves like crypto rather than needing this proxy.
  GOLD: { kind: 'binance', symbol: 'PAXGUSDT', label: 'Gold' },
  AAPL: { kind: 'equity',  symbol: 'AAPL',     label: 'Apple' },
  TSLA: { kind: 'equity',  symbol: 'TSLA',     label: 'Tesla' },
  NVDA: { kind: 'equity',  symbol: 'NVDA',     label: 'NVIDIA' },
  SPX:  { kind: 'equity',  symbol: '^GSPC',    label: 'S&P 500' },
};

type Quote = { price: number; ts: number; source: string };
const cache = new Map<string, Quote>();          // warm-instance cache
const hits = new Map<string, { n: number; until: number }>();

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.until) { hits.set(ip, { n: 1, until: now + RATE_WINDOW_S * 1000 }); return false; }
  rec.n++;
  return rec.n > RATE_LIMIT;
}

async function jget(url: string, headers: Record<string, string> = {}): Promise<any> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
  finally { clearTimeout(t); }
}

async function fetchBinance(symbol: string): Promise<Quote | null> {
  const d = await jget(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
  const p = d && parseFloat(d.price);
  return Number.isFinite(p) && p > 0 ? { price: p, ts: Date.now(), source: 'binance' } : null;
}

async function fetchEquity(symbol: string): Promise<Quote | null> {
  if (FINNHUB_KEY && !symbol.startsWith('^')) {
    const d = await jget(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`);
    const p = d && Number(d.c);
    if (Number.isFinite(p) && p > 0) return { price: p, ts: Date.now(), source: 'finnhub' };
  }
  // Keyless fallback. Yahoo blocks default UAs, so present as a browser.
  const d = await jget(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
  );
  const meta = d?.chart?.result?.[0]?.meta;
  const p = meta && Number(meta.regularMarketPrice ?? meta.previousClose);
  return Number.isFinite(p) && p > 0 ? { price: p, ts: Date.now(), source: 'yahoo' } : null;
}

async function quoteFor(key: string): Promise<Quote | null> {
  const m = MARKETS[key];
  if (!m) return null;
  const c = cache.get(key);
  if (c && Date.now() - c.ts < CACHE_TTL_MS) return c;
  const q = m.kind === 'binance' ? await fetchBinance(m.symbol) : await fetchEquity(m.symbol);
  if (q) { cache.set(key, q); return q; }
  // A provider blip must not blank the HUD: serve the last good value, marked
  // stale, and let the client decide how to present it.
  return c ? { ...c, source: c.source + ':stale' } : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), {
      status: 429, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const want = (url.searchParams.get('markets') || Object.keys(MARKETS).join(','))
    .split(',').map(s => s.trim().toUpperCase()).filter(k => k in MARKETS).slice(0, 8);

  const settled = await Promise.all(want.map(async k => [k, await quoteFor(k)] as const));
  const prices: Record<string, Quote> = {};
  for (const [k, q] of settled) if (q) prices[k] = q;

  return new Response(JSON.stringify({ prices, ts: Date.now() }), {
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      // let the CDN absorb bursts too
      'Cache-Control': 'public, max-age=60',
    },
  });
});
