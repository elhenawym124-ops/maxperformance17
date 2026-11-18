const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'apps', 'frontend', 'src', 'seo', 'public-routes.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const origin = data._origin || 'https://maxp.online';
const routes = data.routes.filter(r => r.sitemap && r.sitemap.include !== false);

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
for (const r of routes) {
  let loc = r.sitemap?.loc || r.canonicalUrl || `${origin}${r.path === '/' ? '/' : r.path}`;
  if (loc.startsWith(`${origin}/portal/course/`) || loc.startsWith(`${origin}/academy/course/`)) {
    loc = loc.replace(origin, 'https://max-p.maxp.online');
  }
  xml += '  <url>\n';
  xml += `    <loc>${loc}</loc>\n`;
  if (r.sitemap.changefreq) xml += `    <changefreq>${r.sitemap.changefreq}</changefreq>\n`;
  if (r.sitemap.priority) xml += `    <priority>${r.sitemap.priority}</priority>\n`;
  xml += '  </url>\n';
}
xml += '</urlset>\n';

const outPath = path.join(__dirname, '..', 'apps', 'frontend', 'public', 'sitemap.xml');
fs.writeFileSync(outPath, xml, 'utf8');
console.log(`Successfully generated ${outPath} with ${routes.length} URLs.`);
