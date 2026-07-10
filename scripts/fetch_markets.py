#!/usr/bin/env python3
"""Fetch real daily OHLC for the ChartQuest "The World Runs on Charts" section.

Emits website/assets/market-data.js  ->  window.CQ_MARKETS = [...]
Authentic data, no API keys, baked at build time (no runtime CORS/CSP surface).
"""
import json
import urllib.request
import datetime
import sys

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

# label, yahoo symbol, price precision, short ticker
MARKETS = [
    ("Bitcoin",   "BTC-USD",  0, "BTC/USD"),
    ("Apple",     "AAPL",     2, "AAPL"),
    ("Tesla",     "TSLA",     2, "TSLA"),
    ("Gold",      "GC=F",     1, "XAU/USD"),
    ("S&P 500",   "^GSPC",    1, "SPX"),
    ("Ethereum",  "ETH-USD",  0, "ETH/USD"),
]

BARS = 64  # candles per market -> identical zoom/visual density across markets


def fetch(symbol):
    url = ("https://query1.finance.yahoo.com/v8/finance/chart/"
           + urllib.parse.quote(symbol, safe="")
           + "?range=6mo&interval=1d")
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.load(r)
    res = data["chart"]["result"][0]
    ts = res["timestamp"]
    q = res["indicators"]["quote"][0]
    rows = []
    for i, t in enumerate(ts):
        o, h, l, c = q["open"][i], q["high"][i], q["low"][i], q["close"][i]
        if None in (o, h, l, c):
            continue
        d = datetime.datetime.fromtimestamp(t, datetime.timezone.utc).strftime("%Y-%m-%d")
        rows.append((d, o, h, l, c))
    # de-dupe by date, keep ascending, take the most recent BARS
    seen, uniq = set(), []
    for r_ in rows:
        if r_[0] in seen:
            continue
        seen.add(r_[0])
        uniq.append(r_)
    return uniq[-BARS:]


def main():
    out = []
    for label, sym, prec, ticker in MARKETS:
        try:
            rows = fetch(sym)
        except Exception as e:
            print(f"FAIL {label} ({sym}): {e}", file=sys.stderr)
            return 1
        if len(rows) < 30:
            print(f"FAIL {label}: only {len(rows)} bars", file=sys.stderr)
            return 1
        candles = [[d, round(o, prec), round(h, prec), round(l, prec), round(c, prec)]
                   for (d, o, h, l, c) in rows]
        first_c, last_c = candles[0][4], candles[-1][4]
        pct = (last_c - first_c) / first_c * 100.0
        out.append({
            "name": label, "ticker": ticker, "precision": prec,
            "last": last_c, "changePct": round(pct, 1), "candles": candles,
        })
        print(f"ok  {label:10s} {len(candles):3d} bars  last={last_c}  {pct:+.1f}%")

    body = ",\n".join(
        "{n:%s,t:%s,p:%d,last:%s,chg:%s,c:%s}" % (
            json.dumps(m["name"]), json.dumps(m["ticker"]), m["precision"],
            json.dumps(m["last"]), json.dumps(m["changePct"]),
            json.dumps(m["candles"], separators=(",", ":")),
        ) for m in out
    )
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    js = (
        "/* ChartQuest — real daily OHLC snapshot (Yahoo Finance), baked %s.\n"
        "   Authentic market data; no runtime API/CORS. Regenerate:\n"
        "   python3 scripts/fetch_markets.py\n"
        "   Shape: {n:name, t:ticker, p:pricePrecision, last, chg:%%, c:[[date,o,h,l,c],...]} */\n"
        "window.CQ_MARKETS=[\n%s\n];\n" % (stamp, body)
    )
    path = "website/assets/market-data.js"
    with open(path, "w") as f:
        f.write(js)
    print(f"\nwrote {path}  ({len(js)/1024:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
