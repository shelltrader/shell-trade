import {
  appCorsHeaders,
  appOriginAllowed,
  enforceAppRateLimit,
  optionsResponse,
} from '../../_lib/app.js';
import { authError } from '../../_lib/app_auth.js';

const MARKETS = Object.freeze({
  BTC:  { kind: 'binance', symbol: 'BTCUSDT' },
  ETH:  { kind: 'binance', symbol: 'ETHUSDT' },
  SOL:  { kind: 'binance', symbol: 'SOLUSDT' },
  GOLD: { kind: 'binance', symbol: 'PAXGUSDT' },
  AAPL: { kind: 'equity', symbol: 'AAPL' },
  TSLA: { kind: 'equity', symbol: 'TSLA' },
  NVDA: { kind: 'equity', symbol: 'NVDA' },
  SPX:  { kind: 'equity', symbol: '^GSPC' },
});

const BINANCE_SYMBOLS = new Set(Object.values(MARKETS).filter((item) => item.kind === 'binance').map((item) => item.symbol));
const INTERVALS = new Set(['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']);

async function jsonFetch(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, Object.assign({ signal: controller.signal, redirect: 'error' }, options || {}));
    if (!response.ok) return null;
    return await response.json();
  } catch (_) { return null; }
  finally { clearTimeout(timeout); }
}

async function marketQuote(market, env) {
  if (market.kind === 'binance') {
    const data = await jsonFetch(`https://api.binance.com/api/v3/ticker/price?symbol=${market.symbol}`);
    const price = Number(data?.price);
    return Number.isFinite(price) && price > 0 ? { price, ts: Date.now(), source: 'binance' } : null;
  }
  const finnhubKey = typeof env?.APP_FINNHUB_KEY === 'string' ? env.APP_FINNHUB_KEY : '';
  if (finnhubKey && !market.symbol.startsWith('^')) {
    const data = await jsonFetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(market.symbol)}&token=${encodeURIComponent(finnhubKey)}`);
    const price = Number(data?.c);
    if (Number.isFinite(price) && price > 0) return { price, ts: Date.now(), source: 'finnhub' };
  }
  const data = await jsonFetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(market.symbol)}?interval=1d&range=1d`,
    { headers: { 'User-Agent': 'ChartQuest/1.0 market display' } },
  );
  const meta = data?.chart?.result?.[0]?.meta;
  const price = Number(meta?.regularMarketPrice ?? meta?.previousClose);
  return Number.isFinite(price) && price > 0 ? { price, ts: Date.now(), source: 'yahoo' } : null;
}

async function quoteResponse(url, env) {
  const requested = (url.searchParams.get('markets') || Object.keys(MARKETS).join(','))
    .split(',').map((item) => item.trim().toUpperCase()).filter(Boolean);
  if (!requested.length || requested.length > 8 || requested.some((key) => !MARKETS[key])) return null;
  const unique = [...new Set(requested)];
  const settled = await Promise.all(unique.map(async (key) => [key, await marketQuote(MARKETS[key], env)]));
  const prices = {};
  for (const [key, quote] of settled) if (quote) prices[key] = quote;
  return { prices, ts: Date.now() };
}

async function candleResponse(url) {
  const symbol = (url.searchParams.get('symbol') || '').toUpperCase();
  const interval = url.searchParams.get('interval') || '1m';
  const limit = Number(url.searchParams.get('limit') || 100);
  if (!BINANCE_SYMBOLS.has(symbol) || !INTERVALS.has(interval) || !Number.isInteger(limit) || limit < 10 || limit > 200) return null;
  const rows = await jsonFetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  if (!Array.isArray(rows)) throw new Error('market provider unavailable');
  const candles = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 7) throw new Error('invalid market response');
    const values = [Number(row[1]), Number(row[2]), Number(row[3]), Number(row[4]), Number(row[5])];
    if (values.some((number) => !Number.isFinite(number)) || values.slice(0, 4).some((number) => number <= 0) ||
        values[1] < Math.max(values[0], values[3]) || values[2] > Math.min(values[0], values[3]) ||
        values[1] < values[2]) {
      throw new Error('invalid market response');
    }
    candles.push({
      open_time: Number(row[0]), open: values[0], high: values[1], low: values[2],
      close: values[3], volume: values[4], close_time: Number(row[6]),
    });
  }
  return { symbol, interval, candles, source: 'binance', fetched_at: new Date().toISOString() };
}

function marketJson(request, status, body) {
  const headers = new Headers(appCorsHeaders(request.headers.get('Origin') || '', 'GET, OPTIONS'));
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', status === 200 ? 'public, max-age=60, s-maxage=60' : 'no-store');
  return new Response(JSON.stringify(body), { status, headers });
}

export async function onRequest(context) {
  const request = context.request;
  if (request.method === 'OPTIONS') return optionsResponse(request, 'GET, OPTIONS');
  if (request.method !== 'GET') return authError(request, 405, 'method_not_allowed', 'Method not allowed.');
  const origin = request.headers.get('Origin') || '';
  if (origin && !appOriginAllowed(origin)) return authError(request, 403, 'forbidden_origin', 'Request origin is not allowed.');
  const fetchSite = (request.headers.get('Sec-Fetch-Site') || '').toLowerCase();
  if (fetchSite === 'cross-site') return authError(request, 403, 'cross_site_request', 'Cross-site requests are not allowed.');
  if (!context.env?.APP_DB) return authError(request, 503, 'app_unavailable', 'Market service is unavailable.');
  try {
    const rate = await enforceAppRateLimit(context.env.APP_DB, request, context.env, 'market', 60, 60);
    if (!rate.allowed) return authError(request, 429, 'rate_limited', 'Too many requests. Try again shortly.');
    const url = new URL(request.url);
    const market = url.searchParams.has('symbol')
      ? await candleResponse(url)
      : await quoteResponse(url, context.env);
    if (!market) return marketJson(request, 400, { error: 'invalid_market_query', message: 'Market query is invalid.' });
    return marketJson(request, 200, { ok: true, market });
  } catch (_) {
    return marketJson(request, 503, { error: 'market_unavailable', message: 'Live market data is temporarily unavailable.' });
  }
}
