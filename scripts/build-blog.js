const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const BLOG_DIR = path.join(ROOT, 'blog');
const INDEX_HTML = path.join(ROOT, 'index.html');
const BLOG_TEASER_START = '                <!-- BLOG_TEASER_START -->';
const BLOG_TEASER_END = '                <!-- BLOG_TEASER_END -->';
const BLOG_TEASER_MAX = 3;
const BASE_URL = 'https://oria.me';
const ORG_ID = `${BASE_URL}/#organization`;

const ORGANIZATION_NODE = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Oria AI',
  legalName: 'TheOther Intelligence LLC',
  url: BASE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE_URL}/assets/favicon.png`,
  },
  sameAs: [
    'https://x.com/OriaAI_official',
    'https://www.linkedin.com/company/theother-intelligence/',
    'https://instagram.com/oriaai.official',
    'https://discord.gg/Vxzb2NW9nx',
  ],
  description:
    'Oria AI builds evolvable personal AI that synthesizes longitudinal life data into unified, actionable insight—with explicit user agency, privacy, and consent.',
};

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function isoDate(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeFrontmatterAuthor(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'string') {
    const t = raw.trim();
    return t ? { name: t } : null;
  }
  if (typeof raw === 'object' && raw.name != null && String(raw.name).trim()) {
    const name = String(raw.name).trim();
    const jobTitle = raw.jobTitle != null ? String(raw.jobTitle).trim() : '';
    const url = raw.url != null ? String(raw.url).trim() : '';
    let sameAs = raw.sameAs;
    if (typeof sameAs === 'string') sameAs = [sameAs];
    if (!Array.isArray(sameAs)) sameAs = [];
    sameAs = sameAs.map((s) => String(s).trim()).filter(Boolean);
    return {
      name,
      jobTitle: jobTitle || undefined,
      url: url || undefined,
      sameAs: sameAs.length ? sameAs : undefined,
    };
  }
  return null;
}

function articleAuthorProfileUrl(personAuthor) {
  if (!personAuthor) return BASE_URL;
  if (personAuthor.url) return personAuthor.url;
  if (personAuthor.sameAs && personAuthor.sameAs[0]) return personAuthor.sameAs[0];
  return BASE_URL;
}

function buildArticleAuthorMetaContent(profileUrl) {
  const u = profileUrl && String(profileUrl).trim() ? String(profileUrl).trim() : BASE_URL;
  return escapeHtml(u);
}

function buildAuthorBylineHtml(personAuthor) {
  const orgName = 'Oria AI';
  const orgLegal = 'TheOther Intelligence LLC';
  const orgUrl = escapeHtml(BASE_URL);
  if (personAuthor) {
    const nameEsc = escapeHtml(personAuthor.name);
    const roleEsc = personAuthor.jobTitle ? escapeHtml(personAuthor.jobTitle) : '';
    const linkStart = personAuthor.url
      ? `<a href="${escapeHtml(personAuthor.url)}" class="blog-post-byline-author" rel="author">`
      : '<span class="blog-post-byline-author">';
    const linkEnd = personAuthor.url ? '</a>' : '</span>';
    const rolePart = roleEsc ? `<span class="blog-post-byline-role">, ${roleEsc}</span>` : '';
    return `<p class="blog-post-byline">${linkStart}${nameEsc}${linkEnd}${rolePart} · <a href="${orgUrl}" class="blog-post-byline-org-link">${escapeHtml(orgName)}</a><span class="blog-post-byline-org">, ${escapeHtml(orgLegal)}</span></p>`;
  }
  return `<p class="blog-post-byline">By <a href="${orgUrl}" rel="author">${escapeHtml(orgName)}</a><span class="blog-post-byline-org">, ${escapeHtml(orgLegal)}</span></p>`;
}

function buildRelatedArticlesHtml(relatedSlugs, allPosts) {
  if (!relatedSlugs || !Array.isArray(relatedSlugs) || relatedSlugs.length === 0) {
    return '';
  }

  const relatedPosts = relatedSlugs
    .map((slug) => allPosts.find((p) => p.slug === slug))
    .filter((p) => p); // filter out undefined

  if (relatedPosts.length === 0) {
    return '';
  }

  const relatedItems = relatedPosts
    .map((p) => {
      const titleEsc = escapeHtml(p.title);
      const url = `/blog/${p.slug}.html`;
      return `                <article class="blog-post-related-card">
                    <h3 class="blog-post-related-title"><a href="${url}">${titleEsc}</a></h3>
                    <a href="${url}" class="blog-post-related-link">Read article</a>
                </article>`;
    })
    .join('\n');

  return `            <section class="blog-post-related">
                <h2>Related Reading</h2>
                <div class="blog-post-related-grid">
${relatedItems}
                </div>
            </section>`;
}

function buildCtaHtml() {
  return `            <aside class="blog-post-cta">
                <p class="blog-post-cta-text">Ready to explore your evolvable digital self?</p>
                <a href="https://apps.apple.com/us/app/oria-ai-evolvable-personal-ai/id6758279152" class="blog-post-cta-link">Access with code PTUM9J</a>
            </aside>`;
}

function buildBlogPostingSchemaGraph(post, dateIso, postUrl, personAuthor) {
  const graph = [ORGANIZATION_NODE];
  let authorRef = { '@id': ORG_ID };

  if (personAuthor) {
    const authorId = `${postUrl}#author`;
    const personNode = {
      '@type': 'Person',
      '@id': authorId,
      name: personAuthor.name,
      worksFor: { '@id': ORG_ID },
    };
    if (personAuthor.jobTitle) personNode.jobTitle = personAuthor.jobTitle;
    if (personAuthor.url) personNode.url = personAuthor.url;
    if (personAuthor.sameAs && personAuthor.sameAs.length) personNode.sameAs = personAuthor.sameAs;
    graph.push(personNode);
    authorRef = { '@id': authorId };
  }

  graph.push({
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: dateIso,
    url: postUrl,
    image: `${BASE_URL}/assets/og-image.png`,
    author: authorRef,
    publisher: { '@id': ORG_ID },
  });

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const FONTS = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Mono:ital,wght@0,400;0,500;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;1,8..60,400;1,8..60,500&display=swap" rel="stylesheet">`;

const NAV = `
    <header class="site-header is-scrolled">
        <nav class="navbar" aria-label="Primary">
            <div class="nav-shell">
                <a href="/" class="brand-logo" aria-label="Oria AI home">ORIA</a>
                <div class="nav-links" id="nav-links">
                    <a href="/#vision" class="nav-item">Vision</a>
                    <a href="/#capabilities" class="nav-item">Capabilities</a>
                    <a href="/#values" class="nav-item">Values</a>
                    <a href="/blog/" class="nav-item">Blog</a>
                    <a href="/app/#/login" class="nav-item">Log in</a>
                    <a href="https://apps.apple.com/us/app/oria-ai-evolvable-personal-ai/id6758279152" class="nav-cta">Try Oria</a>
                </div>
                <button class="mobile-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">
                    <span></span><span></span>
                </button>
            </div>
        </nav>
    </header>`;

const FOOTER = `
    <footer class="site-footer">
        <div class="container footer-grid">
            <div class="footer-brand-block">
                <div class="footer-brand">ORIA</div>
                <p class="footer-tagline">An evolvable personal AI for intentional living.</p>
            </div>
            <div class="footer-cols">
                <div class="footer-col">
                    <p class="mono-label">Explore</p>
                    <a href="/#vision">Vision</a>
                    <a href="/#capabilities">Capabilities</a>
                    <a href="/blog/">Blog</a>
                    <a href="/about">About</a>
                </div>
                <div class="footer-col">
                    <p class="mono-label">Connect</p>
                    <a href="https://discord.gg/Vxzb2NW9nx" target="_blank" rel="noopener noreferrer">Discord</a>
                    <a href="https://x.com/OriaAI_official" target="_blank" rel="noopener noreferrer">X</a>
                    <a href="https://www.linkedin.com/company/theother-intelligence/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    <a href="https://instagram.com/oriaai.official" target="_blank" rel="noopener noreferrer">Instagram</a>
                </div>
                <div class="footer-col">
                    <p class="mono-label">Legal</p>
                    <a href="/contact">Contact</a>
                    <a href="/privacy">Privacy</a>
                    <a href="/terms">Terms</a>
                </div>
            </div>
            <div class="footer-bottom">
                <span>&copy; 2026 TheOther Intelligence LLC.</span>
            </div>
        </div>
    </footer>`;

function getPostTemplate() {
  return `<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-7YWQHLE5Q0"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-7YWQHLE5Q0');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{titleEsc}} - Oria AI Blog</title>
    <meta name="description" content="{{descriptionEsc}}">
    <link rel="canonical" href="{{postUrl}}">
    <link rel="icon" href="../assets/favicon.png" type="image/png">
    <!-- Open Graph -->
    <meta property="og:url" content="{{postUrl}}">
    <meta property="og:title" content="{{titleEsc}}">
    <meta property="og:description" content="{{descriptionEsc}}">
    <meta property="og:image" content="{{baseUrl}}/assets/og-image.png">
    <meta property="og:type" content="article">
    <meta property="article:published_time" content="{{dateIso}}">
{{articleAuthorMeta}}
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{titleEsc}}">
    <meta name="twitter:description" content="{{descriptionEsc}}">
    <meta name="twitter:image" content="{{baseUrl}}/assets/og-image.png">
    <link rel="stylesheet" href="../css/styles.css">
${FONTS}
    <script type="application/ld+json">{{blogPostingSchema}}</script>
</head>

<body>
${NAV}

    <article class="blog-post">
        <div class="container container-narrow">
            <a href="/blog/" class="back-link">← Back to Blog</a>
            <header class="blog-post-header">
                <div class="blog-post-meta-row">
                    <time datetime="{{dateIso}}" class="blog-post-date">{{dateFormatted}}</time>
                </div>
                {{authorByline}}
                <h1 class="blog-post-title">{{title}}</h1>
                <p class="blog-post-lead">{{lead}}</p>
            </header>
            <div class="blog-post-body">
{{body}}
            </div>
{{cta}}
{{relatedArticles}}
        </div>
    </article>
${FOOTER}

    <script src="../js/main.js"></script>
</body>

</html>`;
}

function getIndexTemplate() {
  return `<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-7YWQHLE5Q0"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-7YWQHLE5Q0');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - Oria AI</title>
    <meta name="description" content="Insights on personal AI, well-being, and your evolvable digital self.">
    <link rel="canonical" href="${BASE_URL}/blog/">
    <meta property="og:url" content="${BASE_URL}/blog/">
    <meta property="og:title" content="Blog - Oria AI">
    <meta property="og:description" content="Insights on personal AI, well-being, and your evolvable digital self.">
    <meta property="og:image" content="${BASE_URL}/assets/og-image.png">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Blog - Oria AI">
    <meta name="twitter:description" content="Insights on personal AI, well-being, and your evolvable digital self.">
    <meta name="twitter:image" content="${BASE_URL}/assets/og-image.png">
    <link rel="icon" href="../assets/favicon.png" type="image/png">
    <link rel="stylesheet" href="../css/styles.css">
${FONTS}
</head>

<body>
${NAV}

    <section class="blog-listing">
        <div class="container">
            <a href="/" class="back-link">← Back to Home</a>
            <div class="section-header">
                <p class="mono-label">Field notes</p>
                <h1>Blog</h1>
                <p>Insights on personal AI, well-being, and your evolvable digital self</p>
            </div>
            <div class="blog-grid">
{{postsHtml}}
            </div>
        </div>
    </section>
${FOOTER}

    <script src="../js/main.js"></script>
</body>

</html>`;
}

function buildPost(post, template, allPosts) {
  const titleEsc = escapeHtml(post.title);
  const descriptionEsc = escapeHtml(post.description);
  const dateFormatted = formatDate(post.date);
  const dateIso = isoDate(post.date);
  const lead = post.lead != null ? escapeHtml(post.lead) : descriptionEsc;
  const body = marked.parse(post.content);
  const postUrl = `${BASE_URL}/blog/${post.slug}.html`;
  const personAuthor = normalizeFrontmatterAuthor(post.author);
  const profileUrl = articleAuthorProfileUrl(personAuthor);
  const articleAuthorMeta = `    <meta property="article:author" content="${buildArticleAuthorMetaContent(profileUrl)}">`;
  const authorByline = buildAuthorBylineHtml(personAuthor);
  const blogPostingSchema = buildBlogPostingSchemaGraph(post, dateIso, postUrl, personAuthor);
  const relatedArticles = buildRelatedArticlesHtml(post.related, allPosts);
  const cta = buildCtaHtml();

  return template
    .replace(/\{\{titleEsc\}\}/g, titleEsc)
    .replace(/\{\{descriptionEsc\}\}/g, descriptionEsc)
    .replace(/\{\{dateFormatted\}\}/g, dateFormatted)
    .replace(/\{\{dateIso\}\}/g, dateIso)
    .replace(/\{\{lead\}\}/g, lead)
    .replace(/\{\{title\}\}/g, post.title)
    .replace(/\{\{body\}\}/g, body)
    .replace(/\{\{postUrl\}\}/g, postUrl)
    .replace(/\{\{baseUrl\}\}/g, BASE_URL)
    .replace(/\{\{articleAuthorMeta\}\}/g, articleAuthorMeta)
    .replace(/\{\{authorByline\}\}/g, authorByline)
    .replace(/\{\{relatedArticles\}\}/g, relatedArticles)
    .replace(/\{\{cta\}\}/g, cta)
    .replace(/\{\{blogPostingSchema\}\}/g, blogPostingSchema);
}

function buildIndex(posts, template) {
  const cards = posts.map((p) => {
    const dateFormatted = formatDate(p.date);
    const dateIso = isoDate(p.date);
    const desc = escapeHtml(p.description);
    const titleEsc = escapeHtml(p.title);
    const url = `/blog/${p.slug}.html`;
    return `                <article class="blog-card">
                    <div class="blog-card-meta">
                        <time datetime="${dateIso}">${dateFormatted}</time>
                    </div>
                    <h2><a href="${url}">${titleEsc}</a></h2>
                    <p>${desc}</p>
                    <a href="${url}" class="blog-read-more">
                        Read more <i class="fas fa-arrow-right"></i>
                    </a>
                </article>`;
  });
  return template.replace(/\{\{postsHtml\}\}/g, cards.join('\n'));
}

function buildSitemap(posts) {
  const urls = [
    { loc: `${BASE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${BASE_URL}/blog/`, changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}/privacy`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${BASE_URL}/terms`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${BASE_URL}/about`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${BASE_URL}/contact`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${BASE_URL}/slideshow`, changefreq: 'monthly', priority: '0.4' },
  ];

  for (const post of posts) {
    urls.push({
      loc: `${BASE_URL}/blog/${post.slug}.html`,
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: isoDate(post.date),
    });
  }

  const urlEntries = urls
    .map((u) => {
      let entry = `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>`;
      if (u.lastmod) {
        entry += `\n    <lastmod>${u.lastmod}</lastmod>`;
      }
      return entry + '\n  </url>';
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

function buildTeaserHtml(posts) {
  const latest = posts.slice(0, BLOG_TEASER_MAX);
  return latest
    .map((p) => {
      const dateFormatted = formatDate(p.date);
      const dateIso = isoDate(p.date);
      const titleEsc = escapeHtml(p.title);
      const url = `/blog/${p.slug}.html`;
      return `                <article class="editorial-card">
                    <div class="editorial-meta">${dateFormatted}</div>
                    <h3 class="editorial-title"><a href="${url}">${titleEsc}</a></h3>
                    <a href="${url}" class="editorial-link">Read essay →</a>
                </article>`;
    })
    .join('\n');
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    console.log('Created blog/posts/ (no .md files yet)');
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);
    const slug = data.slug || path.basename(file, '.md');
    if (!data.title || !data.date) {
      console.warn(`Skipping ${file}: missing title or date`);
      continue;
    }

    let related = [];
    if (data.related) {
      related = Array.isArray(data.related) ? data.related : [data.related];
    }

    posts.push({
      slug,
      title: data.title,
      date: data.date,
      description: data.description || '',
      lead: data.lead,
      author: data.author,
      related: related,
      content: content.trim(),
    });
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const postTemplate = getPostTemplate();
  const indexTemplate = getIndexTemplate();

  for (const post of posts) {
    const html = buildPost(post, postTemplate, posts);
    const outPath = path.join(BLOG_DIR, `${post.slug}.html`);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log('Wrote', outPath);
  }

  const indexHtml = buildIndex(posts, indexTemplate);
  fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), indexHtml, 'utf8');
  console.log('Wrote blog/index.html');

  const sitemapXml = buildSitemap(posts);
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXml, 'utf8');
  console.log('Wrote sitemap.xml');

  // Update homepage blog teaser with latest N posts
  if (fs.existsSync(INDEX_HTML)) {
    let homeHtml = fs.readFileSync(INDEX_HTML, 'utf8');
    if (homeHtml.includes(BLOG_TEASER_START) && homeHtml.includes(BLOG_TEASER_END)) {
      const teaserHtml = buildTeaserHtml(posts);
      const teaserBlock = new RegExp(
        BLOG_TEASER_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + BLOG_TEASER_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'g'
      );
      homeHtml = homeHtml.replace(teaserBlock, BLOG_TEASER_START + '\n' + teaserHtml + '\n' + BLOG_TEASER_END);
      fs.writeFileSync(INDEX_HTML, homeHtml, 'utf8');
      console.log('Updated index.html blog teaser with latest', Math.min(posts.length, BLOG_TEASER_MAX), 'posts');
    }
  }
}

main();
