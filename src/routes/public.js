const express = require('express');
const { db } = require('../db');
const { CATEGORIES, renderMarkdown, coverSvg } = require('../helpers');

const router = express.Router();
const PER_PAGE = 9;
const A_COLS = `a.id, a.slug, a.title, a.excerpt, a.category, a.author, a.cover, a.created_at, a.views, a.content`;

router.get('/', (req, res) => {
  const featured = db.prepare(`SELECT ${A_COLS} FROM articles a WHERE published = 1 ORDER BY featured DESC, created_at DESC LIMIT 1`).get();
  const latest = db.prepare(`SELECT ${A_COLS} FROM articles a WHERE published = 1 AND id != ? ORDER BY created_at DESC LIMIT 7`).all(featured ? featured.id : 0);
  const popular = db.prepare(`SELECT ${A_COLS} FROM articles a WHERE published = 1 ORDER BY views DESC, created_at DESC LIMIT 5`).all();
  const topGames = db.prepare('SELECT * FROM games ORDER BY rating DESC, created_at DESC LIMIT 6').all();
  const guides = db.prepare(`SELECT ${A_COLS} FROM articles a WHERE published = 1 AND category = 'panduan' ORDER BY created_at DESC LIMIT 3`).all();
  res.render('home', {
    featured, latest, popular, topGames, guides,
    meta: { description: 'Rejekibet — berita, ulasan, dan panduan game terbaru dalam bahasa Indonesia.' }
  });
});

function listArticles(req, res, category) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const where = category ? 'published = 1 AND category = ?' : 'published = 1';
  const args = category ? [category] : [];
  const total = db.prepare(`SELECT COUNT(*) c FROM articles WHERE ${where}`).get(...args).c;
  const items = db.prepare(`SELECT ${A_COLS} FROM articles a WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...args, PER_PAGE, (page - 1) * PER_PAGE);
  const cat = category ? CATEGORIES[category] : null;
  res.render('articles', {
    items, page, pages: Math.max(1, Math.ceil(total / PER_PAGE)), category, cat,
    basePath: category ? `/kategori/${category}` : '/artikel',
    meta: { title: cat ? cat.label : 'Semua Artikel', description: cat ? cat.desc : 'Semua berita, ulasan, dan panduan game di Rejekibet.' }
  });
}

router.get('/artikel', (req, res) => listArticles(req, res, null));
router.get('/kategori/:category', (req, res, next) => {
  if (!Object.hasOwn(CATEGORIES, req.params.category)) return next();
  listArticles(req, res, req.params.category);
});

router.get('/artikel/:slug', (req, res, next) => {
  const article = db.prepare(`SELECT a.*, g.slug game_slug, g.title game_title, g.rating game_rating, g.genre game_genre, g.cover game_cover
    FROM articles a LEFT JOIN games g ON g.id = a.game_id WHERE a.slug = ? AND a.published = 1`).get(req.params.slug);
  if (!article) return next();
  db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(article.id);
  const related = db.prepare(`SELECT ${A_COLS} FROM articles a WHERE published = 1 AND category = ? AND id != ? ORDER BY created_at DESC LIMIT 3`)
    .all(article.category, article.id);
  res.render('article', {
    article, related, html: renderMarkdown(article.content),
    meta: { title: article.title, description: article.excerpt, image: res.locals.coverUrl(article), type: 'article' }
  });
});

router.get('/game', (req, res) => {
  const genre = String(req.query.genre || '');
  const genres = db.prepare("SELECT DISTINCT genre FROM games WHERE genre != '' ORDER BY genre").all().map((r) => r.genre);
  const games = genre
    ? db.prepare('SELECT * FROM games WHERE genre = ? ORDER BY rating DESC').all(genre)
    : db.prepare('SELECT * FROM games ORDER BY rating DESC, title').all();
  res.render('games', { games, genres, genre, meta: { title: 'Direktori Game', description: 'Jelajahi game pilihan lengkap dengan skor dan ulasan redaksi Rejekibet.' } });
});

router.get('/game/:slug', (req, res, next) => {
  const game = db.prepare('SELECT * FROM games WHERE slug = ?').get(req.params.slug);
  if (!game) return next();
  const articles = db.prepare(`SELECT ${A_COLS} FROM articles a WHERE published = 1 AND game_id = ? ORDER BY created_at DESC LIMIT 6`).all(game.id);
  res.render('game', {
    game, articles, html: renderMarkdown(game.description),
    meta: { title: game.title, description: game.summary, image: res.locals.coverUrl(game) }
  });
});

router.get('/cari', (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  let items = [], games = [];
  if (q.length >= 2) {
    const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
    items = db.prepare(`SELECT ${A_COLS} FROM articles a WHERE published = 1 AND (title LIKE ? ESCAPE '\\' OR excerpt LIKE ? ESCAPE '\\') ORDER BY created_at DESC LIMIT 24`).all(like, like);
    games = db.prepare("SELECT * FROM games WHERE title LIKE ? ESCAPE '\\' OR genre LIKE ? ESCAPE '\\' ORDER BY rating DESC LIMIT 8").all(like, like);
  }
  res.render('search', { q, items, games, meta: { title: q ? `Hasil pencarian "${q}"` : 'Cari', noindex: true } });
});

router.get('/tentang', (req, res) => {
  res.render('about', { meta: { title: 'Tentang Kami', description: 'Mengenal Rejekibet dan cara kami menilai game.' } });
});

router.get('/cover/:slug.svg', (req, res) => {
  res.set({ 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=604800' });
  res.send(coverSvg(req.params.slug));
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /cari\nSitemap: ${res.locals.siteUrl}/sitemap.xml\n`);
});

router.get('/sitemap.xml', (req, res) => {
  const base = res.locals.siteUrl;
  const urls = ['/', '/artikel', '/game', '/tentang', ...Object.keys(CATEGORIES).map((c) => `/kategori/${c}`)].map((u) => ({ loc: u }));
  for (const a of db.prepare('SELECT slug, updated_at FROM articles WHERE published = 1').all()) urls.push({ loc: `/artikel/${a.slug}`, mod: a.updated_at.slice(0, 10) });
  for (const g of db.prepare('SELECT slug FROM games').all()) urls.push({ loc: `/game/${g.slug}` });
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `<url><loc>${base}${u.loc}</loc>${u.mod ? `<lastmod>${u.mod}</lastmod>` : ''}</url>`).join('\n') + '\n</urlset>'
  );
});

module.exports = router;
