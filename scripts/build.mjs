#!/usr/bin/env node
// Generates all inner pages, the shared header/footer (also injected into the
// hand-written index + stargazing guide), sitemap.xml and llms.txt.
// Usage: node scripts/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { planets, missions, missionFilters, glossary, guides } from "./data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = JSON.parse(fs.readFileSync(path.join(root, "scripts/site.json"), "utf8")).url.replace(/\/$/, "");
const TODAY = "2026-11-20";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ext = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
const write = (rel, html) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, html); };
const sphere = (p, extra = "") => `<div class="sphere ${p.slug}${p.slug === "saturn" ? " ringed" : ""}"${extra} role="img" aria-label="Illustration of ${p.name}"></div>`;

/* ------------------------------------------------------------------ icons */
const icon = {
  rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M14 4c3-1 6-1 6-1s0 3-1 6l-7 7-5-5z"/><circle cx="15" cy="9" r="1.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
  orbit: '<svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-25 12 12)"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  scope: '<svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14l14-7 2 4-14 7zM9 17l-3 5M11 16l3 6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
};
const guideIcon = { "how-to-see-planets-night-sky": icon.eye, "choosing-your-first-telescope": icon.scope, "moon-phases-explained": icon.moon };

/* ------------------------------------------------------------- header/nav */
const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset=".5" stop-color="#22d3ee"/><stop offset="1" stop-color="#f472b6"/></linearGradient></defs><circle cx="20" cy="20" r="9" fill="url(#lg)"/><ellipse cx="20" cy="20" rx="18" ry="6.5" fill="none" stroke="url(#lg)" stroke-width="2" transform="rotate(-24 20 20)"/></svg>`;

function header(current = "") {
  const sec = current.startsWith("/planets") ? "planets" : current.startsWith("/guides") ? "guides" : ["/missions", "/glossary"].includes(current) ? "explore" : "";
  const cur = (href) => (href === current ? ' aria-current="page"' : "");
  const btn = (id, label) => `<button class="menu-btn${sec === id ? " current" : ""}" aria-expanded="false" aria-controls="menu-${id}">${label}</button>`;
  return `  <a class="skip-link" href="#main">Skip to content</a>
  <div class="nebula" aria-hidden="true"></div>
  <canvas id="starfield" aria-hidden="true"></canvas>
  <div class="scroll-progress" aria-hidden="true"></div>
  <div class="topbar">New: <a href="/guides/moon-phases-explained">Moon phases explained</a> — our latest beginner's guide →</div>

  <header class="site-header">
    <nav class="container nav" aria-label="Primary">
      <a class="logo" href="/" aria-label="Orbitra home">
        ${LOGO}
        Orbitra
      </a>
      <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-links"><span></span></button>
      <ul class="nav-links" id="nav-links">
        <li class="has-menu">
          ${btn("planets", "Planets")}
          <div class="menu menu-mega" id="menu-planets">
${planets.map((p) => `            <a href="/planets/${p.slug}"${cur(`/planets/${p.slug}`)}><span class="dot ${p.slug}" aria-hidden="true"></span><span>${p.name}<small>${p.type}</small></span></a>`).join("\n")}
            <div class="menu-foot"><a href="/planets"${cur("/planets")}>All planets overview →</a></div>
          </div>
        </li>
        <li class="has-menu">
          ${btn("explore", "Explore")}
          <div class="menu" id="menu-explore">
            <a href="/#planets"><span class="mi">${icon.orbit}</span><span>3D planet tour<small>Scroll from Mercury to Neptune</small></span></a>
            <a href="/missions"${cur("/missions")}><span class="mi">${icon.rocket}</span><span>Space missions<small>16 missions that changed astronomy</small></span></a>
            <a href="/#milestones"><span class="mi">${icon.clock}</span><span>Milestones<small>Seven decades in a timeline</small></span></a>
            <a href="/glossary"${cur("/glossary")}><span class="mi">${icon.book}</span><span>Astronomy glossary<small>Key terms in plain English</small></span></a>
          </div>
        </li>
        <li class="has-menu">
          ${btn("guides", "Guides")}
          <div class="menu" id="menu-guides">
${guides.map((g) => `            <a href="/guides/${g.slug}"${cur(`/guides/${g.slug}`)}><span class="mi">${guideIcon[g.slug]}</span><span>${g.title}<small>${g.tag} · ${g.mins} min read</small></span></a>`).join("\n")}
            <div class="menu-foot" style="border-top:1px solid var(--border);margin-top:8px;padding-top:8px"><a href="/guides"${cur("/guides")}>All guides →</a></div>
          </div>
        </li>
        <li><a href="/about"${cur("/about")}>About</a></li>
        <li><a href="/#faq">FAQ</a></li>
      </ul>
      <a class="btn btn-ghost" href="/#planets">Start the 3D tour</a>
    </nav>
  </header>
`;
}

function footer() {
  return `  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="about">
          <a class="logo" href="/" aria-label="Orbitra home">
            <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="9" fill="#7c5cff"/><ellipse cx="20" cy="20" rx="18" ry="6.5" fill="none" stroke="#22d3ee" stroke-width="2" transform="rotate(-24 20 20)"/></svg>
            Orbitra
          </a>
          <p>A free, interactive 3D guide to the Solar System for students, teachers and anyone who loves the night sky.</p>
        </div>
        <div>
          <h2>Planets</h2>
          <ul>${planets.map((p) => `<li><a href="/planets/${p.slug}">${p.name}</a></li>`).join("")}</ul>
        </div>
        <div>
          <h2>Explore</h2>
          <ul><li><a href="/#planets">3D planet tour</a></li><li><a href="/planets">Planets overview</a></li><li><a href="/missions">Space missions</a></li><li><a href="/#milestones">Milestones</a></li><li><a href="/glossary">Glossary</a></li></ul>
        </div>
        <div>
          <h2>Guides</h2>
          <ul>${guides.map((g) => `<li><a href="/guides/${g.slug}">${g.title}</a></li>`).join("")}<li><a href="/guides">All guides</a></li></ul>
        </div>
        <div>
          <h2>Orbitra</h2>
          <ul><li><a href="/about">About</a></li><li><a href="/#faq">FAQ</a></li><li><a href="/privacy">Privacy</a></li><li><a href="/sitemap.xml">Sitemap</a></li></ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span data-year>2026</span> Orbitra. Educational project.</span>
        <span>Data sources: ${ext("https://science.nasa.gov/", "NASA")} · ${ext("https://www.esa.int/", "ESA")} · ${ext("https://www.iau.org/", "IAU")} · ${ext("https://www.isro.gov.in/", "ISRO")}</span>
      </div>
    </div>
  </footer>
`;
}

/* --------------------------------------------------------------- layout */
const crumbsLd = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, href], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + href })),
});
const crumbsHtml = (items) => `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map(([name, href], i) => i === items.length - 1 ? `<li aria-current="page">${name}</li>` : `<li><a href="${href}">${name}</a></li>`).join("")}</ol></nav>`;

const pages = []; // for sitemap + llms
function page({ path: p, title, desc, body, graph = [], robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1", type = "website", article, priority = 0.6, changefreq = "monthly", llm, image }) {
  const url = SITE + (p === "/" ? "/" : p);
  const noindex = robots.startsWith("noindex");
  const og = image || `${SITE}/assets/img/og-image.png`;
  const ld = graph.length ? `
  <script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2).replace(/^/gm, "  ")}
  </script>
` : "";
  const html = `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="author" content="Orbitra Team">
  <meta name="robots" content="${robots}">
  <meta name="theme-color" content="#05060f">
${noindex ? "" : `  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="en" href="${url}">
  <link rel="alternate" hreflang="x-default" href="${url}">
`}
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Orbitra">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${og}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Orbitra — a glowing 3D planet with an orbit ring on a starfield background">
${article ? `  <meta property="article:published_time" content="${article.published}">
  <meta property="article:modified_time" content="${article.modified}">
  <meta property="article:section" content="${article.section}">
` : ""}  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${og}">

  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap">
  <link rel="stylesheet" href="/assets/css/styles.css">
${ld}</head>
<body>
${header(p)}
  <main id="main">
${body}
  </main>

${footer()}
  <script src="/assets/js/main.js" defer></script>
</body>
</html>
`;
  write(p === "/404" ? "404.html" : `${p.slice(1)}.html`, html);
  if (!noindex) pages.push({ path: p, priority, changefreq, title, llm: llm || desc });
}

const pageHero = (crumbs, eyebrow, h1, lead, meta = "", narrow = false) => `    <section class="page-hero">
      <div class="container"${narrow ? " style=\"max-width:860px\"" : ""}>
        ${crumbsHtml(crumbs)}
        <p class="eyebrow">${eyebrow}</p>
        <h1>${h1}</h1>
        <p class="lead">${lead}</p>${meta}
      </div>
    </section>`;

const faqHtml = (faq) => `<div class="faq">${faq.map(([q, a]) => `
            <details><summary>${q}</summary><div class="answer"><p>${a}</p></div></details>`).join("")}
          </div>`;
const faqLd = (id, faq) => ({ "@type": "FAQPage", "@id": id, mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });

/* ----------------------------------------------------------- planet hub */
page({
  path: "/planets", priority: 0.9, changefreq: "monthly",
  title: "The 8 Planets of the Solar System: Facts | Orbitra",
  desc: "An overview of all eight planets in the Solar System, from Mercury to Neptune: size, distance from the Sun, orbital period and what makes each world unique.",
  llm: "Overview of all eight planets with size, distance, orbital period and links to detailed pages.",
  graph: [
    { "@type": "CollectionPage", "@id": `${SITE}/planets#webpage`, url: `${SITE}/planets`, name: "The 8 planets of the Solar System", isPartOf: { "@id": `${SITE}/#website` }, inLanguage: "en" },
    { "@type": "ItemList", name: "Planets of the Solar System", numberOfItems: 8, itemListElement: planets.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: `${SITE}/planets/${p.slug}` })) },
    crumbsLd([["Home", "/"], ["Planets", "/planets"]]),
  ],
  body: `${pageHero([["Home", "/"], ["Planets", "/planets"]], "The planets", 'Eight worlds, <span class="grad-text">one family</span>', "From scorched Mercury to windswept Neptune, every planet in our Solar System has a story. Choose a world to explore its key facts, missions and observing tips.")}
    <section class="section" style="padding-top:20px" aria-label="All planets">
      <div class="container">
        <div class="grid-4 reveal-stagger">
${planets.map((p, i) => `          <a class="card reveal" href="/planets/${p.slug}">
            <div class="sphere-wrap">${sphere(p)}</div>
            <span class="tag">${String(i + 1).padStart(2, "0")} · ${p.type}</span>
            <h2 style="font-size:26px">${p.name}</h2>
            <p>${p.short}.</p>
            <div class="meta-row"><span>${p.facts["Distance from Sun"]}</span><span>${p.facts["Orbital period"]}</span></div>
            <span class="more">Explore ${p.name} →</span>
          </a>`).join("\n")}
        </div>
      </div>
    </section>
    <section class="section" aria-labelledby="types-title">
      <div class="container">
        <div class="section-head reveal"><p class="eyebrow">Three families</p><h2 id="types-title">Rocky worlds, gas giants and ice giants</h2></div>
        <div class="strip reveal">
          <div><h3>Terrestrial planets</h3><p>Mercury, Venus, Earth and Mars are small, dense and rocky, with solid surfaces you could stand on.</p></div>
          <div><h3>Gas giants</h3><p>Jupiter and Saturn are huge balls of hydrogen and helium with no solid surface, dozens of moons and ring systems.</p></div>
          <div><h3>Ice giants</h3><p>Uranus and Neptune contain more water, ammonia and methane "ices", giving them their blue-green colours.</p></div>
        </div>
      </div>
    </section>`,
});

/* -------------------------------------------------------- planet pages */
planets.forEach((p, i) => {
  const prev = planets[i - 1], next = planets[i + 1];
  const pathP = `/planets/${p.slug}`;
  const crumbs = [["Home", "/"], ["Planets", "/planets"], [p.name, pathP]];
  page({
    path: pathP, priority: 0.8, type: "article",
    article: { published: `${TODAY}T09:00:00+00:00`, modified: `${TODAY}T09:00:00+00:00`, section: "Planets" },
    title: `${p.name} Facts: Size, Orbit, Moons & Missions | Orbitra`,
    desc: p.desc,
    llm: `${p.name} — ${p.short}. Key facts, atmosphere, surface, missions and observing tips.`,
    graph: [
      { "@type": "Article", "@id": `${SITE}${pathP}#article`, headline: `${p.name}: facts, missions and how to see it`, description: p.desc, image: `${SITE}/assets/img/og-image.png`, datePublished: `${TODAY}T09:00:00+00:00`, dateModified: `${TODAY}T09:00:00+00:00`, author: { "@type": "Organization", name: "Orbitra Team", url: `${SITE}/about` }, publisher: { "@id": `${SITE}/#organization` }, mainEntityOfPage: `${SITE}${pathP}`, about: { "@type": "Thing", name: p.name, sameAs: p.wiki }, inLanguage: "en" },
      faqLd(`${SITE}${pathP}#faq`, p.faq),
      crumbsLd(crumbs),
    ],
    body: `    <section class="planet-hero">
      <div class="container">
        ${crumbsHtml(crumbs)}
        <div class="split">
          <div>
            <p class="eyebrow">Planet ${String(i + 1).padStart(2, "0")} · ${p.type}</p>
            <h1>${p.name}</h1>
            <p class="lead">${p.short}. ${p.intro[0].split(". ")[0]}.</p>
          </div>
          <div class="sphere-wrap">${sphere(p)}</div>
        </div>
      </div>
    </section>
    <div class="container">
      <dl class="fact-grid reveal-stagger">
${Object.entries(p.facts).map(([k, v]) => `        <div class="fact reveal"><dt>${k}</dt><dd>${v}</dd></div>`).join("\n")}
      </dl>
      <div class="layout-aside" style="margin-top:60px">
        <div class="prose">
          <h2 id="overview" style="margin-top:0">Overview</h2>
${p.intro.map((t) => `          <p>${t}</p>`).join("\n")}
          <h2 id="atmosphere">Atmosphere</h2>
          <p>${p.atmosphere}</p>
          <h2 id="surface">${["jupiter", "saturn", "uranus", "neptune"].includes(p.slug) ? "Structure, rings and moons" : "Surface and geology"}</h2>
          <p>${p.surface}</p>
          <h2 id="highlights">Did you know?</h2>
          <ul>
${p.highlights.map((h) => `            <li>${h}</li>`).join("\n")}
          </ul>
          <h2 id="missions">Missions to ${p.name}</h2>
          <table>
            <thead><tr><th scope="col">Mission</th><th scope="col">Years</th><th scope="col">Achievement</th></tr></thead>
            <tbody>
${p.missions.map(([n, y, t]) => `              <tr><td><strong>${n}</strong></td><td>${y}</td><td>${t}</td></tr>`).join("\n")}
            </tbody>
          </table>
          <h2 id="observe">How to observe ${p.name}</h2>
          <p>${p.observe}</p>
          <p>New to stargazing? Read our guide on <a href="/guides/how-to-see-planets-night-sky">how to see the planets in the night sky</a>.</p>
          <h2 id="faq">${p.name} FAQ</h2>
          ${faqHtml(p.faq)}
          <h2 id="sources">Sources and further reading</h2>
          <ul>
            <li>${ext(p.nasa, `NASA Science: ${p.name}`)}</li>
            <li>${ext(p.wiki, `Wikipedia: ${p.name}`)}</li>
          </ul>
        </div>
        <aside class="aside-card" aria-label="On this page">
          <h2>On this page</h2>
          <ul><li><a href="#overview">Overview</a></li><li><a href="#atmosphere">Atmosphere</a></li><li><a href="#surface">${["jupiter", "saturn", "uranus", "neptune"].includes(p.slug) ? "Structure &amp; moons" : "Surface"}</a></li><li><a href="#highlights">Did you know?</a></li><li><a href="#missions">Missions</a></li><li><a href="#observe">How to observe</a></li><li><a href="#faq">FAQ</a></li></ul>
          <h2>Other planets</h2>
          <ul>${planets.filter((o) => o !== p).map((o) => `<li><a href="/planets/${o.slug}">${o.name}</a></li>`).join("")}</ul>
        </aside>
      </div>
      <nav class="pager" aria-label="Planet navigation">
        ${prev ? `<a class="prev" href="/planets/${prev.slug}" rel="prev"><span class="dot ${prev.slug}" aria-hidden="true"></span><span><small>← Previous planet</small><strong>${prev.name}</strong></span></a>` : `<a class="prev" href="/planets"><span><small>← Back to</small><strong>All planets</strong></span></a>`}
        ${next ? `<a class="next" href="/planets/${next.slug}" rel="next"><span><small>Next planet →</small><strong>${next.name}</strong></span><span class="dot ${next.slug}" aria-hidden="true"></span></a>` : `<a class="next" href="/missions"><span><small>Keep exploring →</small><strong>Space missions</strong></span></a>`}
      </nav>
    </div>`,
  });
});

/* ------------------------------------------------------------- missions */
page({
  path: "/missions", priority: 0.8,
  title: "16 Space Missions That Changed Astronomy | Orbitra",
  desc: "From Sputnik 1 to Chandrayaan-3: the landmark space missions by NASA, ESA, ISRO and the Soviet Union that shaped our understanding of the Solar System.",
  llm: "Sixteen landmark space missions from 1957 to 2023 by NASA, ESA, ISRO, CSA, ASI and the Soviet Union, filterable by category.",
  graph: [
    { "@type": "CollectionPage", "@id": `${SITE}/missions#webpage`, url: `${SITE}/missions`, name: "Space missions that changed astronomy", isPartOf: { "@id": `${SITE}/#website` }, inLanguage: "en" },
    { "@type": "ItemList", name: "Landmark space missions", numberOfItems: missions.length, itemListElement: missions.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: `${m.name} (${m.year})` })) },
    crumbsLd([["Home", "/"], ["Missions", "/missions"]]),
  ],
  body: `${pageHero([["Home", "/"], ["Missions", "/missions"]], "Space missions", 'Missions that <span class="grad-text">changed everything</span>', "Sixteen journeys — crewed and robotic, from four continents — that took us from the first satellite to the edge of the Solar System. Filter by destination to explore.")}
    <section class="section" style="padding-top:10px" aria-label="Mission list">
      <div class="container">
        <div class="filters" data-filters role="group" aria-label="Filter missions">
${missionFilters.map(([k, l], i) => `          <button type="button" data-filter="${k}" aria-pressed="${i === 0}">${l}</button>`).join("\n")}
        </div>
        <div class="grid-3">
${missions.map((m) => `          <article class="card mission" data-tags="${m.tags}">
            <span class="tag">${m.agency}</span>
            <p class="year grad-text">${m.year}</p>
            <h2 style="font-size:22px">${m.name}</h2>
            <p>${m.text}</p>
          </article>`).join("\n")}
        </div>
        <p style="color:var(--muted);margin-top:30px;font-size:14px">Years shown are the key year for each mission (launch, arrival or landing). Explore more at ${ext("https://science.nasa.gov/missions/", "NASA Missions")}, ${ext("https://www.esa.int/Science_Exploration/Space_Science", "ESA Space Science")} and ${ext("https://www.isro.gov.in/", "ISRO")}.</p>
      </div>
    </section>`,
});

/* ------------------------------------------------------------- glossary */
const letters = [...new Set(glossary.map(([t]) => t[0].toUpperCase()))];
const slugify = (s) => s.toLowerCase().replace(/\(.*?\)/g, "").trim().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");
page({
  path: "/glossary", priority: 0.7,
  title: "Astronomy Glossary: 24 Terms Explained | Orbitra",
  desc: "Plain-English definitions of essential astronomy terms — astronomical unit, ecliptic, opposition, Kuiper belt, Lagrange point, tidal locking and more.",
  llm: "Plain-English definitions of 24 essential astronomy terms (AU, ecliptic, opposition, light-year, Kuiper belt, Lagrange point and more).",
  graph: [
    { "@type": "DefinedTermSet", "@id": `${SITE}/glossary#terms`, name: "Orbitra astronomy glossary", url: `${SITE}/glossary`, hasDefinedTerm: glossary.map(([t, d]) => ({ "@type": "DefinedTerm", name: t, description: d, url: `${SITE}/glossary#${slugify(t)}` })) },
    crumbsLd([["Home", "/"], ["Glossary", "/glossary"]]),
  ],
  body: `${pageHero([["Home", "/"], ["Glossary", "/glossary"]], "Glossary", 'Astronomy terms, <span class="grad-text">made simple</span>', "Twenty-four essential words every stargazer meets sooner or later — explained clearly, without the jargon.", "", true)}
    <div class="container glossary" style="max-width:860px;padding-bottom:80px">
      <nav class="az" aria-label="Jump to letter">${letters.map((l) => `<a href="#letter-${l.toLowerCase()}">${l}</a>`).join("")}</nav>
      <dl>
${letters.map((l) => `        <h2 class="letter grad-text" id="letter-${l.toLowerCase()}">${l}</h2>
${glossary.filter(([t]) => t[0].toUpperCase() === l).map(([t, d]) => `        <div class="term" id="${slugify(t)}"><dt>${t}</dt><dd>${d}</dd></div>`).join("\n")}`).join("\n")}
      </dl>
    </div>`,
});

/* --------------------------------------------------------------- guides */
page({
  path: "/guides", priority: 0.8,
  title: "Free Astronomy Guides for Beginners | Orbitra",
  desc: "Beginner-friendly astronomy guides: how to see the planets, how to choose your first telescope and how the phases of the Moon work.",
  llm: "Index of Orbitra's beginner astronomy guides.",
  graph: [
    { "@type": "CollectionPage", "@id": `${SITE}/guides#webpage`, url: `${SITE}/guides`, name: "Astronomy guides", isPartOf: { "@id": `${SITE}/#website` }, inLanguage: "en" },
    { "@type": "ItemList", itemListElement: guides.map((g, i) => ({ "@type": "ListItem", position: i + 1, name: g.title, url: `${SITE}/guides/${g.slug}` })) },
    crumbsLd([["Home", "/"], ["Guides", "/guides"]]),
  ],
  body: `${pageHero([["Home", "/"], ["Guides", "/guides"]], "Guides", 'Start stargazing <span class="grad-text">tonight</span>', "Practical, jargon-free guides written for complete beginners. No expensive equipment required.")}
    <section class="section" style="padding-top:10px" aria-label="All guides">
      <div class="container">
        <div class="grid-3 reveal-stagger">
${guides.map((g) => `          <a class="card reveal" href="/guides/${g.slug}">
            <span class="tag">${g.tag}</span>
            <h2 style="font-size:24px">${g.title}</h2>
            <p>${g.summary}</p>
            <div class="meta-row"><span>${g.mins} min read</span><span>Updated ${TODAY}</span></div>
            <span class="more">Read the guide →</span>
          </a>`).join("\n")}
        </div>
      </div>
    </section>`,
});

function guidePage(slug, { title, metaTitle, desc, lead, body, faq, extraGraph = [] }) {
  const g = guides.find((x) => x.slug === slug);
  const p = `/guides/${slug}`;
  const crumbs = [["Home", "/"], ["Guides", "/guides"], [g.title, p]];
  const related = guides.filter((x) => x.slug !== slug);
  page({
    path: p, priority: 0.8, type: "article",
    article: { published: `${TODAY}T09:00:00+00:00`, modified: `${TODAY}T09:00:00+00:00`, section: g.tag },
    title: metaTitle, desc, llm: g.summary,
    graph: [
      { "@type": "Article", "@id": `${SITE}${p}#article`, headline: title, description: desc, image: `${SITE}/assets/img/og-image.png`, datePublished: `${TODAY}T09:00:00+00:00`, dateModified: `${TODAY}T09:00:00+00:00`, author: { "@type": "Organization", name: "Orbitra Team", url: `${SITE}/about` }, publisher: { "@id": `${SITE}/#organization` }, mainEntityOfPage: `${SITE}${p}`, inLanguage: "en" },
      ...(faq ? [faqLd(`${SITE}${p}#faq`, faq)] : []),
      ...extraGraph,
      crumbsLd(crumbs),
    ],
    body: `    <article>
${pageHero(crumbs, `${g.tag} guide`, title, lead, `
        <div class="meta"><span>By <a href="/about">Orbitra Team</a></span><span>Published <time datetime="${TODAY}">20 November 2026</time></span><span>${g.mins} min read</span></div>`, true)}
      <div class="container">
        <div class="prose">
${body}
${faq ? `          <h2 id="faq">Frequently asked questions</h2>
          ${faqHtml(faq)}` : ""}
          <h2>Keep reading</h2>
          <ul>${related.map((r) => `<li><a href="/guides/${r.slug}">${r.title}</a> — ${r.summary}</li>`).join("")}</ul>
        </div>
      </div>
    </article>`,
  });
}

guidePage("choosing-your-first-telescope", {
  title: "Choosing your first telescope",
  metaTitle: "How to Choose Your First Telescope | Orbitra",
  desc: "Refractor, reflector or Dobsonian? Learn what aperture, focal length and mounts mean, how to calculate magnification, and the mistakes beginners should avoid.",
  lead: "The right first telescope is the one you will actually use. Here's how to understand the jargon and pick an instrument that suits your sky and your patience.",
  body: `          <nav class="toc" aria-label="Table of contents"><strong>In this guide</strong><ol><li><a href="#binoculars">Start with binoculars</a></li><li><a href="#aperture">Aperture is king</a></li><li><a href="#types">The three main designs</a></li><li><a href="#mounts">Mounts matter</a></li><li><a href="#magnification">Understanding magnification</a></li><li><a href="#mistakes">Common beginner mistakes</a></li></ol></nav>
          <h2 id="binoculars">Start with binoculars</h2>
          <p>Before buying a telescope, try a pair of 7×50 or 10×50 binoculars. They are easy to use, show a wide field of view and reveal Jupiter's moons, lunar craters, star clusters and the Andromeda Galaxy. The first number is magnification; the second is the diameter of each front lens in millimetres.</p>
          <h2 id="aperture">Aperture is king</h2>
          <p>A telescope's most important specification is its <strong>aperture</strong> — the diameter of its main lens or mirror. A larger aperture gathers more light, revealing fainter objects and finer detail. Doubling the aperture collects four times as much light.</p>
          <blockquote>Rule of thumb: buy the largest aperture you can comfortably carry, set up and store. A big telescope that stays in the cupboard shows you nothing.</blockquote>
          <h2 id="types">The three main designs</h2>
          <table>
            <thead><tr><th scope="col">Type</th><th scope="col">How it works</th><th scope="col">Best for</th></tr></thead>
            <tbody>
              <tr><td><strong>Refractor</strong></td><td>Uses lenses to bend light to a focus.</td><td>Sharp views of the Moon and planets; low maintenance.</td></tr>
              <tr><td><strong>Reflector (Newtonian)</strong></td><td>Uses a curved primary mirror.</td><td>The most aperture for the money; galaxies and nebulae.</td></tr>
              <tr><td><strong>Catadioptric</strong></td><td>Combines mirrors and lenses in a compact tube.</td><td>Portability and long focal lengths for planets.</td></tr>
            </tbody>
          </table>
          <p>A <strong>Dobsonian</strong> is a Newtonian reflector on a simple rocking base. Many astronomers consider it the best-value beginner choice because it offers large aperture and intuitive point-and-look use.</p>
          <h2 id="mounts">Mounts matter</h2>
          <p>A wobbly mount ruins any telescope. <strong>Alt-azimuth</strong> mounts move up-down and left-right and are intuitive for beginners. <strong>Equatorial</strong> mounts are aligned with Earth's axis, making it easier to follow objects as the sky turns and essential for long-exposure astrophotography. Computerised "GoTo" mounts can find thousands of objects automatically.</p>
          <h2 id="magnification">Understanding magnification</h2>
          <p>Magnification depends on the eyepiece you use:</p>
          <blockquote><strong>Magnification = telescope focal length ÷ eyepiece focal length</strong><br>Example: a 1,200 mm telescope with a 25 mm eyepiece gives 48×.</blockquote>
          <p>The highest useful magnification is roughly twice the aperture in millimetres — about 200× for a 100 mm telescope — and our turbulent atmosphere often limits views to less. Be wary of any telescope advertised mainly by an enormous magnification figure.</p>
          <h2 id="mistakes">Common beginner mistakes</h2>
          <ul>
            <li><strong>Chasing magnification.</strong> Low power shows brighter, sharper and wider views.</li>
            <li><strong>Skipping the finder alignment.</strong> Align your finder scope on a distant object in daylight first.</li>
            <li><strong>Not letting it cool.</strong> Put the telescope outside 30 minutes before observing so the optics reach outdoor temperature.</li>
            <li><strong>Pointing at the Sun.</strong> Never look at the Sun through any optical instrument without a certified solar filter — it causes instant, permanent eye damage.</li>
          </ul>
          <p>Local astronomy clubs often run free "star parties" where you can try different telescopes before choosing one. The ${ext("https://www.iau.org/public/", "International Astronomical Union's public outreach pages")} are a good place to start.</p>`,
  faq: [
    ["What size telescope should a beginner get?", "A reflector or Dobsonian of 114–200 mm aperture, or a 70–100 mm refractor, is a good starting point. Choose something you can carry and set up easily."],
    ["Can I see galaxies with a small telescope?", "Yes. Bright galaxies such as Andromeda are visible even in binoculars, though they appear as faint smudges rather than the colourful spirals seen in long-exposure photographs."],
    ["What magnification do I need to see Saturn's rings?", "Around 25× is enough to show the rings; 75–150× gives a more detailed view on steady nights."],
  ],
});

const phases = [
  ["New Moon", "The Moon sits between Earth and the Sun, so its sunlit side faces away from us and it is invisible."],
  ["Waxing crescent", "A thin sliver appears in the western sky after sunset, growing night by night."],
  ["First quarter", "Half of the disc is lit. Craters along the terminator — the line between day and night — look especially dramatic."],
  ["Waxing gibbous", "More than half is lit and growing. The Moon rises in the afternoon and is visible most of the evening."],
  ["Full Moon", "Earth lies between the Sun and Moon, and the entire face is lit. It rises at sunset and sets at sunrise."],
  ["Waning gibbous", "The lit portion shrinks, and the Moon rises later each night."],
  ["Third quarter", "The opposite half is lit. It rises around midnight and is high in the morning sky."],
  ["Waning crescent", "A thin crescent visible before dawn in the east, shrinking toward the next New Moon."],
];
guidePage("moon-phases-explained", {
  title: "Moon phases explained",
  metaTitle: "Moon Phases Explained: All 8 Phases in Order | Orbitra",
  desc: "Why does the Moon change shape? Learn the eight Moon phases in order, the 29.5-day cycle, why we see one side and the best phase for observing.",
  lead: "The Moon doesn't change shape — our view of its sunlit half does. Here's how the 29.5-day cycle works and how to make the most of each phase.",
  extraGraph: [{ "@type": "ItemList", name: "The eight phases of the Moon", itemListElement: phases.map(([n], i) => ({ "@type": "ListItem", position: i + 1, name: n })) }],
  body: `          <nav class="toc" aria-label="Table of contents"><strong>In this guide</strong><ol><li><a href="#why">Why the Moon has phases</a></li><li><a href="#eight">The eight phases in order</a></li><li><a href="#same-side">Why we always see the same side</a></li><li><a href="#eclipses">Phases and eclipses</a></li><li><a href="#observing">Best time to observe</a></li></ol></nav>
          <h2 id="why">Why the Moon has phases</h2>
          <p>The Sun always lights up half of the Moon. As the Moon orbits Earth, about 384,400 km away, we see different proportions of that sunlit half. When the lit portion grows, the Moon is <strong>waxing</strong>; when it shrinks, it is <strong>waning</strong>.</p>
          <p>A complete cycle from New Moon to New Moon — the <strong>synodic month</strong> — takes about 29.5 days. That is slightly longer than the 27.3 days the Moon takes to orbit Earth, because Earth is also moving around the Sun.</p>
          <h2 id="eight">The eight phases in order</h2>
          <ol>
${phases.map(([n, d]) => `            <li><strong>${n}.</strong> ${d}</li>`).join("\n")}
          </ol>
          <h2 id="same-side">Why we always see the same side</h2>
          <p>The Moon is <a href="/glossary#tidal-locking">tidally locked</a>: it rotates once on its axis in exactly the time it takes to orbit Earth, so the same hemisphere always faces us. The "far side" is not permanently dark — it receives just as much sunlight; we simply never see it from Earth.</p>
          <h2 id="eclipses">Phases and eclipses</h2>
          <p>A <strong>solar eclipse</strong> can only happen at New Moon, when the Moon passes in front of the Sun. A <strong>lunar eclipse</strong> can only happen at Full Moon, when the Moon moves through Earth's shadow. Eclipses don't happen every month because the Moon's orbit is tilted about 5° relative to Earth's.</p>
          <h2 id="observing">Best time to observe the Moon</h2>
          <p>Surprisingly, the Full Moon is the worst time to look at craters: sunlight hits the surface head-on, so there are no shadows. The best views come around first and third quarter, when long shadows along the terminator make mountains and craters stand out in sharp relief.</p>
          <p>For daily Moon phase data and imagery, see ${ext("https://science.nasa.gov/moon/", "NASA's Moon page")} and ${ext("https://svs.gsfc.nasa.gov/", "NASA's Scientific Visualization Studio")}.</p>`,
  faq: [
    ["How long does each Moon phase last?", "The full cycle takes about 29.5 days. The four principal phases (New, First Quarter, Full, Third Quarter) are instants; the in-between phases each last roughly a week."],
    ["What is a blue moon?", "Commonly, a blue moon is the second Full Moon in a single calendar month. It happens about once every two to three years."],
    ["Is the Moon's far side dark?", "No. The far side gets the same amount of sunlight as the near side; it is simply always turned away from Earth."],
  ],
});

/* ------------------------------------------------------- about / legal */
page({
  path: "/about", priority: 0.6,
  title: "About Orbitra — Our Mission to Make Astronomy Accessible",
  desc: "Learn why Orbitra was built, how we check our facts against NASA, ESA and IAU data, and our commitment to free, accessible astronomy education for everyone.",
  graph: [
    { "@type": "AboutPage", "@id": `${SITE}/about#webpage`, url: `${SITE}/about`, name: "About Orbitra", isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#organization` }, inLanguage: "en" },
    crumbsLd([["Home", "/"], ["About", "/about"]]),
  ],
  body: `${pageHero([["Home", "/"], ["About", "/about"]], "About us", 'Making the cosmos <span class="grad-text">feel close</span>', "Orbitra is a small educational project with one goal: help anyone understand our Solar System through motion, depth and clear, honest explanations.", "", true)}
    <section class="section" style="padding-top:0" aria-label="Orbitra in numbers">
      <div class="container">
        <div class="stats reveal-stagger">
          <div class="stat reveal"><span class="num grad-text">18</span><p>In-depth pages covering planets, missions and guides.</p></div>
          <div class="stat reveal"><span class="num grad-text">8</span><p>Planets with full fact sheets, FAQs and observing tips.</p></div>
          <div class="stat reveal"><span class="num grad-text">${missions.length}</span><p>Landmark missions from five space agencies.</p></div>
          <div class="stat reveal"><span class="num grad-text">0</span><p>Cookies, trackers, ads or sign-ups. Ever.</p></div>
        </div>
      </div>
    </section>
    <div class="container">
      <div class="prose">
        <h2>Why we built Orbitra</h2>
        <p>Most of us first met the planets as a row of coloured circles in a textbook. That picture hides the most astonishing parts of the story — the vast distances, the tilted orbits, the storms bigger than Earth. Orbitra uses interactive 3D and scroll-driven animation to bring that scale back.</p>
        <h2>How we check our facts</h2>
        <p>Every number on the site — distances, orbital periods, mission dates — is compared against public data from ${ext("https://science.nasa.gov/solar-system/", "NASA")}, the ${ext("https://www.esa.int/", "European Space Agency")}, ${ext("https://www.isro.gov.in/", "ISRO")} and the ${ext("https://www.iau.org/", "International Astronomical Union")}. Where values change as discoveries are made, such as the number of known moons, we show a rounded figure.</p>
        <h2>Our principles</h2>
        <ul>
          <li><strong>Free forever.</strong> No accounts, no paywalls and no advertising.</li>
          <li><strong>Accessible.</strong> Semantic HTML, keyboard-friendly menus and full support for reduced-motion preferences.</li>
          <li><strong>Lightweight.</strong> No frameworks or heavy libraries — the 3D effects are hand-written for speed.</li>
          <li><strong>Private.</strong> We don't use tracking cookies. Read our <a href="/privacy">privacy notice</a>.</li>
        </ul>
        <h2>Start exploring</h2>
        <p>Take the <a href="/#planets">3D planet tour</a>, browse <a href="/planets">all eight planets</a>, read about <a href="/missions">the missions that changed astronomy</a> or learn <a href="/guides/how-to-see-planets-night-sky">how to see the planets yourself</a>.</p>
      </div>
    </div>`,
});

page({
  path: "/privacy", priority: 0.3, changefreq: "yearly",
  title: "Privacy Notice | Orbitra",
  desc: "Orbitra's privacy notice: we use no accounts, no tracking cookies and no advertising. Learn what limited technical data our hosting provider may process.",
  graph: [
    { "@type": "WebPage", "@id": `${SITE}/privacy#webpage`, url: `${SITE}/privacy`, name: "Privacy Notice", isPartOf: { "@id": `${SITE}/#website` }, inLanguage: "en", dateModified: TODAY },
    crumbsLd([["Home", "/"], ["Privacy", "/privacy"]]),
  ],
  body: `${pageHero([["Home", "/"], ["Privacy", "/privacy"]], "Legal", "Privacy notice", "Short version: Orbitra collects nothing about you. There are no accounts, no forms, no tracking cookies and no ads.", `
        <div class="meta"><span>Last updated <time datetime="${TODAY}">20 November 2026</time></span></div>`, true)}
    <div class="container">
      <div class="prose">
        <h2>Information we collect</h2>
        <p>None. Orbitra has no sign-up, login or contact forms, and does not set cookies.</p>
        <h2>Hosting and server logs</h2>
        <p>The site is hosted on ${ext("https://vercel.com/legal/privacy-policy", "Vercel")}. Like any web host, Vercel may process basic technical data such as IP addresses and request times to deliver and secure the site.</p>
        <h2>Third-party resources</h2>
        <p>Web fonts are loaded from ${ext("https://policies.google.com/privacy", "Google Fonts")}. Links to external sites such as NASA or ESA are governed by those sites' own privacy policies.</p>
        <h2>Changes</h2>
        <p>If this notice changes, we will update the date at the top of this page.</p>
      </div>
    </div>`,
});

page({
  path: "/404", robots: "noindex, follow",
  title: "Page Not Found (404) | Orbitra",
  desc: "This page drifted out of orbit. Head back to the Orbitra home page to continue exploring the Solar System in 3D.",
  body: `    <section class="notfound">
      <div>
        <p class="code grad-text">404</p>
        <h1>Lost in space</h1>
        <p class="lead" style="margin:0 auto 32px">The page you're looking for has drifted out of orbit. Try one of these instead:</p>
        <div class="hero-actions" style="justify-content:center"><a class="btn btn-primary" href="/">Return home</a><a class="btn btn-ghost" href="/planets">Browse the planets</a><a class="btn btn-ghost" href="/guides">Read a guide</a></div>
      </div>
    </section>`,
});

/* ------------------------------- inject header/footer into hand-written pages */
for (const [rel, cur, meta] of [
  ["index.html", "/", { priority: 1.0, changefreq: "weekly", title: "Orbitra — Explore the Solar System in Interactive 3D", llm: "Home: scroll-driven 3D tour of Mercury to Neptune, planet size comparison, statistics, a 1957–2021 exploration timeline, featured guides and an FAQ." }],
  ["guides/how-to-see-planets-night-sky.html", "/guides/how-to-see-planets-night-sky", { priority: 0.8, changefreq: "monthly", title: "How to see the planets in the night sky", llm: guides[0].summary }],
]) {
  const file = path.join(root, rel);
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/  <a class="skip-link"[\s\S]*?<\/header>\n/, header(cur));
  html = html.replace(/  <footer class="site-footer">[\s\S]*?<\/footer>\n/, footer());
  fs.writeFileSync(file, html);
  pages.push({ path: cur, ...meta });
}

/* ------------------------------------------------------- sitemap + llms */
const order = (p) => (p.path === "/" ? "" : p.path);
pages.sort((a, b) => b.priority - a.priority || order(a).localeCompare(order(b)));
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map((p) => {
  const loc = SITE + (p.path === "/" ? "/" : p.path);
  const img = p.path === "/" ? `${SITE}/assets/img/og-image.png` : p.path === "/guides/how-to-see-planets-night-sky" ? `${SITE}/assets/img/solar-system-diagram.svg` : "";
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority.toFixed(1)}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${loc}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>${img ? `
    <image:image>
      <image:loc>${img}</image:loc>
    </image:image>` : ""}
  </url>`;
}).join("\n")}
</urlset>
`);

const link = (p) => `- [${p.title.replace(/ \| Orbitra$/, "")}](${SITE}${p.path === "/" ? "/" : p.path}): ${p.llm}`;
const group = (pred) => pages.filter(pred).map(link).join("\n");
write("llms.txt", `# Orbitra

> Orbitra is a free, interactive 3D guide to the Solar System. It covers all eight planets with fact sheets, landmark space missions, an astronomy glossary and beginner stargazing guides. No accounts, no ads, no tracking.

## Main pages

${group((p) => ["/", "/planets", "/missions", "/glossary", "/guides"].includes(p.path))}

## Planets

${group((p) => p.path.startsWith("/planets/"))}

## Guides

${group((p) => p.path.startsWith("/guides/"))}

## About

${group((p) => ["/about", "/privacy"].includes(p.path))}

## Key facts

- The Solar System has eight planets; Pluto was reclassified as a dwarf planet by the IAU in 2006.
- Jupiter is the largest planet; Venus is the hottest (~465 °C); Saturn has the most known moons (270+).
- Sunlight takes about 8 minutes 20 seconds to reach Earth (1 AU ≈ 149.6 million km).
- The Sun holds about 99.86% of the Solar System's mass.

## Sources

- [NASA Science — Solar System](https://science.nasa.gov/solar-system/)
- [ESA Space Science](https://www.esa.int/Science_Exploration/Space_Science)
- [ISRO](https://www.isro.gov.in/)
- [International Astronomical Union](https://www.iau.org/)
`);

console.log(`Built ${pages.length} indexable pages + 404, sitemap.xml, llms.txt`);
