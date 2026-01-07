import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
  const site = context.site || new URL('https://pulsetrack.vercel.app');
  
  // Get all pages from the pages directory
  const pages = await Astro.glob('../pages/**/*.{md,mdx,astro}');
  
  // Filter out 404, sitemap, and other special pages
  const validPages = pages.filter(page => {
    const path = page.file.split('/').pop() || '';
    return ![
      '404.astro',
      'sitemap.xml.js',
      'rss.xml.js',
      'api',
      '_',
      'private',
    ].some(exclude => path.startsWith(exclude));
  });

  // Generate sitemap entries
  const sitemapItems = validPages.map(page => {
    const url = new URL(page.url, site).href;
    const lastmod = page.frontmatter?.updatedDate || page.frontmatter?.pubDate || new Date();
    const priority = url.endsWith('/') ? 1.0 : 0.8; // Higher priority for main pages
    
    return {
      url,
      lastmod,
      changefreq: 'daily',
      priority: priority.toFixed(1),
    };
  });

  // Add static pages that might not be in the pages directory
  const staticPages = [
    { url: '/', priority: 1.0 },
    { url: '/features', priority: 0.9 },
    { url: '/pricing', priority: 0.8 },
    { url: '/blog', priority: 0.7 },
    { url: '/docs', priority: 0.7 },
  ];

  staticPages.forEach(page => {
    sitemapItems.push({
      url: new URL(page.url, site).href,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: page.priority.toFixed(1),
    });
  });

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" 
        xmlns:xhtml="http://www.w3.org/1999/xhtml" 
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" 
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${sitemapItems
    .map(
      (item) => `
    <url>
      <loc>${item.url}</loc>
      <lastmod>${new Date(item.lastmod).toISOString()}</lastmod>
      <changefreq>${item.changefreq}</changefreq>
      <priority>${item.priority}</priority>
    </url>
  `
    )
    .join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'X-Robots-Tag': 'noindex', // This prevents the sitemap from being indexed
    },
  });
}
