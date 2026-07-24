# Vercel Deployment Rules for Ankara Project

## Critical: vercel.json Configuration

When using `builds` in `vercel.json`, Vercel **ONLY** deploys what's explicitly listed. You must include:

1. **API serverless function** — `@vercel/node` for `api/handler.js`
2. **Static HTML files** — `@vercel/static` for `*.html`
3. **Static assets** — `@vercel/static` for `assets/**`

### Working vercel.json Pattern
```json
{
  "version": 2,
  "builds": [
    { "src": "api/handler.js", "use": "@vercel/node" },
    { "src": "*.html", "use": "@vercel/static" },
    { "src": "assets/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/handler.js" },
    { "src": "/assets/(.*)", "dest": "/assets/$1" },
    { "src": "/(.*\\.html)", "dest": "/$1" },
    { "src": "/", "dest": "/index.html" }
  ]
}
```

## Common Mistakes to NEVER Repeat

1. **Do NOT put `index.js` in the project root** — Vercel auto-detects it as a serverless function and routes ALL requests through it, causing crashes.
2. **Do NOT use `"functions"` with `"runtime": "@vercel/node@5"`** — invalid syntax, causes "Function Runtimes must have a valid version" error.
3. **Do NOT use only `rewrites` without `builds`** — causes "No entrypoint found" error.
4. **Do NOT omit `@vercel/static` builds for HTML/assets** — causes 404 NOT_FOUND on the homepage.

## Architecture
- Static HTML/CSS/JS → Served by Vercel CDN (fast, no function invocation)
- `/api/*` routes → Handled by Express in `api/handler.js` (serverless function)
- API function re-exported from `api/index.js` for local dev compatibility
