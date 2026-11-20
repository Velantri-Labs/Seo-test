# Seo-test — Orbitra

A website created for testing **Septuple** SEO checks. It's a static site with no dependencies: an interactive 3D guide to the Solar System, with no login, no auth and no e-commerce.

## Pages

| URL | File | Notes |
| --- | --- | --- |
| `/` | `index.html` | 3D hero globe, scroll-driven 3D planet carousel, stats, timeline, FAQ |
| `/guides/how-to-see-planets-night-sky` | `guides/how-to-see-planets-night-sky.html` | Article + HowTo schema, image, table, TOC |
| `/about` | `about.html` | AboutPage schema |
| `/privacy` | `privacy.html` | |
| any unknown URL | `404.html` | `noindex` |

## SEO / AEO files

- `robots.txt`: allows all crawlers (AI crawlers included) and points to the sitemap
- `sitemap.xml`: every indexable URL, with `lastmod`, hreflang and image entries
- `llms.txt`: a summary for LLMs and answer engines
- `site.webmanifest`, `favicon.ico`, icons in `assets/img/`, and `og-image.png` (1200×630)
- `humans.txt` and `.well-known/security.txt`
- On every page: a unique title and meta description, canonical, hreflang, Open Graph, Twitter card and JSON-LD (Organization, WebSite, WebPage, FAQPage, Article, HowTo, BreadcrumbList)
- `vercel.json`: clean URLs, no trailing slash, security headers (CSP, HSTS and others) and caching

Every outbound link goes to an external authority domain (NASA, ESA, IAU, Wikipedia, Stellarium). There are no referral or affiliate links.

## Deploy on Vercel

1. Import the repo in Vercel. Set the framework preset to **Other**, leave the build command empty, and use the repo root as the output directory.
2. After the first deploy, put the real domain everywhere (canonical, OG, sitemap, robots, schema):

   ```bash
   node scripts/set-domain.mjs https://your-project.vercel.app
   ```

3. Commit and push. Vercel redeploys automatically.

## Run locally

```bash
npx serve .
```

`serve` handles clean URLs like `/about` the same way Vercel does.
