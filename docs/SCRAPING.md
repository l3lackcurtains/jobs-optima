# Job Scanner Proxy / Bot Resolver

The job scanner uses Playwright with stealth plugins to crawl job sites. **It works fine without any proxy on residential IPs** (most self-hosters). Where you'll need one:

- Running on a cloud host (Vercel, AWS, GCP, Dokploy, Fly.io) — datacenter IPs are aggressively flagged by LinkedIn/Indeed
- Scaling beyond a few users on the hosted version
- Seeing repeated empty results, captchas, or `403 Forbidden` errors in the scan logs

## Status: optional

Leave the env vars unset and the scanner runs as-is — Playwright connects directly. No proxy code paths are exercised, no extra cost.

## How it works

When `SCRAPING_PROXY_SERVER` is set, every browser launched by the scanner routes its traffic through that proxy. Playwright handles the wiring; we just pass it through.

```
SCRAPING_PROXY_SERVER=http://proxy.example.com:8080
SCRAPING_PROXY_USERNAME=username           # optional
SCRAPING_PROXY_PASSWORD=password           # optional
SCRAPING_PROXY_BYPASS=localhost,127.0.0.1  # optional
```

The proxy is applied at browser launch via Playwright's native `proxy` option. No third-party dependencies. No vendor lock-in.

## Recommended providers

Listed cheapest to most premium. All work with the env vars above.

| Provider | Type | Approx. price | Notes |
|----------|------|---------------|-------|
| [Webshare](https://www.webshare.io/) | Datacenter / Residential | ~$3/mo for 100 IPs | Cheapest entry. Datacenter IPs may still get blocked on LinkedIn. |
| [Smartproxy](https://smartproxy.com/) | Residential | ~$8.50/GB | Solid mid-tier. Good for low-volume scanning. |
| [Oxylabs](https://oxylabs.io/) | Residential | ~$10/GB | Premium reliability, large IP pool. |
| [BrightData](https://brightdata.com/) | Residential / ISP | ~$15/GB | Industry leader, biggest pool. Overkill for small instances. |
| [ScraperAPI](https://scraperapi.com/) | Managed (handles captchas) | $49/mo for 100k requests | Use **proxy mode endpoint**, not API mode. |

For Jobs Optima at indie scale (10–100 users), **Webshare or Smartproxy** is plenty. You don't need BrightData unless you're scanning thousands of pages a day.

## Provider-specific examples

### Webshare

```bash
SCRAPING_PROXY_SERVER=http://p.webshare.io:80
SCRAPING_PROXY_USERNAME=your-username-rotate
SCRAPING_PROXY_PASSWORD=your-password
```

### BrightData (residential)

```bash
SCRAPING_PROXY_SERVER=http://brd.superproxy.io:22225
SCRAPING_PROXY_USERNAME=brd-customer-XYZ-zone-residential
SCRAPING_PROXY_PASSWORD=your-zone-password
```

### Smartproxy

```bash
SCRAPING_PROXY_SERVER=http://gate.smartproxy.com:7000
SCRAPING_PROXY_USERNAME=your-username
SCRAPING_PROXY_PASSWORD=your-password
```

### ScraperAPI (proxy mode)

```bash
SCRAPING_PROXY_SERVER=http://proxy-server.scraperapi.com:8001
SCRAPING_PROXY_USERNAME=scraperapi
SCRAPING_PROXY_PASSWORD=YOUR_API_KEY
```

## Verifying it works

1. Set the env vars, restart the API.
2. Watch logs on first scan — you should see:
   `Launching browser through proxy http://...`
3. Run a scan that previously failed with empty results. Should now return matches.
4. If you still get blocked, your proxy may be flagged too. Try a different residential pool.

## What this does NOT solve

- **Captchas:** if a site shows a hCaptcha/reCAPTCHA, the proxy alone won't bypass it. Add a captcha-solver service later (2Captcha, AntiCaptcha) — not implemented yet, file an issue if you need it.
- **Logged-in scraping:** scanning your own LinkedIn feed requires session cookies. Not in scope; use the Chrome extension for that.
- **Cloudflare bot pages:** stealth plugins help, residential proxies help, but neither is bulletproof. Consider Browserless or Cloudflare-aware services for those targets.

## Cost guardrails

If you're on a paid proxy, watch your bandwidth bill. Each scanned page is roughly 200 KB–2 MB. At Smartproxy's ~$8.50/GB you can scan thousands of pages for a few dollars — but a runaway scanner on a busy user could hit $20/day. Add a per-user `dailyScanCount` cap if this matters.

## Disabling the proxy

Unset (or leave empty) `SCRAPING_PROXY_SERVER` and restart. No code change needed.
