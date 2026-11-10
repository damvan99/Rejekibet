const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { rateLimit } = require('express-rate-limit');
const { db, uniqueSlug } = require('../db');
const { CATEGORIES, slugify } = require('../helpers');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXT[file.mimetype])
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, Object.hasOwn(EXT, file.mimetype))
});

function removeUpload(name) {
  if (name && /^[a-f0-9]{24}\.(jpg|png|webp)$/.test(name)) fs.rm(path.join(UPLOAD_DIR, name), { force: true }, () => {});
}

router.use((req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.csrf = req.session.csrf;
  res.locals.admin = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// Token CSRF: field _csrf (form biasa) atau query ?_csrf= (form multipart)
function csrf(req, res, next) {
  const token = String((req.body && req.body._csrf) || req.query._csrf || '');
  const a = Buffer.from(token), b = Buffer.from(req.session.csrf || '');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    if (req.file) removeUpload(req.file.filename);
    const err = new Error('Sesi formulir kedaluwarsa. Muat ulang halaman lalu coba lagi.');
    err.status = 403; err.expose = true;
    return next(err);
  }
  next();
}
router.post(/.*/, (req, res, next) => (req.is('multipart/form-data') ? next() : csrf(req, res, next)));

const requireAuth = (req, res, next) => (req.session.user ? next() : res.redirect('/admin/login'));
const flash = (req, type, text) => { req.session.flash = { type, text }; };

// ---------- Login ----------
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).render('admin/login', { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' }) });

router.post('/login', loginLimiter, (req, res, next) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(req.body.username || ''));
  const ok = bcrypt.compareSync(String(req.body.password || ''), user ? user.password_hash : '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!user || !ok) return res.status(401).render('admin/login', { error: 'Username atau password salah.' });
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.user = { id: user.id, username: user.username };
    res.redirect('/admin');
  });
});

router.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/admin/login')));

router.use(requireAuth);

// ---------- Dashboard ----------
router.get('/', (req, res) => {
  const stats = {
    articles: db.prepare('SELECT COUNT(*) c FROM articles').get().c,
    drafts: db.prepare('SELECT COUNT(*) c FROM articles WHERE published = 0').get().c,
    games: db.prepare('SELECT COUNT(*) c FROM games').get().c,
    views: db.prepare('SELECT COALESCE(SUM(views),0) c FROM articles').get().c
  };
  const recent = db.prepare('SELECT id, slug, title, category, published, views, created_at FROM articles ORDER BY created_at DESC LIMIT 6').all();
  const top = db.prepare('SELECT id, slug, title, views FROM articles ORDER BY views DESC LIMIT 5').all();
  res.render('admin/dashboard', { stats, recent, top, section: 'dashboard' });
});

// ---------- Artikel ----------
router.get('/artikel', (req, res) => {
  const items = db.prepare('SELECT id, slug, title, category, author, published, featured, views, created_at FROM articles ORDER BY created_at DESC').all();
  res.render('admin/articles', { items, section: 'artikel' });
});

const gameOptions = () => db.prepare('SELECT id, title FROM games ORDER BY title').all();
const blankArticle = { title: '', excerpt: '', content: '', category: 'berita', author: 'Redaksi', published: 1, featured: 0, game_id: null };

router.get('/artikel/baru', (req, res) => {
  res.render('admin/article-form', { item: blankArticle, games: gameOptions(), error: null, section: 'artikel' });
});

router.get('/artikel/:id', (req, res, next) => {
  const item = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!item) return next();
  res.render('admin/article-form', { item, games: gameOptions(), error: null, section: 'artikel' });
});

function saveArticle(req, res, next) {
  const id = req.params.id ? Number(req.params.id) : null;
  const old = id ? db.prepare('SELECT * FROM articles WHERE id = ?').get(id) : null;
  if (id && !old) { if (req.file) removeUpload(req.file.filename); return next(); }
  const b = req.body;
  const data = {
    title: String(b.title || '').trim().slice(0, 160),
    excerpt: String(b.excerpt || '').trim().slice(0, 300),
    content: String(b.content || ''),
    category: Object.hasOwn(CATEGORIES, b.category) ? b.category : 'berita',
    author: String(b.author || '').trim().slice(0, 60) || 'Redaksi',
    game_id: Number(b.game_id) || null,
    featured: b.featured ? 1 : 0,
    published: b.published ? 1 : 0
  };
  if (!data.title) {
    if (req.file) removeUpload(req.file.filename);
    return res.status(400).render('admin/article-form', { item: { ...old, ...data, id }, games: gameOptions(), error: 'Judul wajib diisi.', section: 'artikel' });
  }
  let cover = old ? old.cover : null;
  if (req.file) { removeUpload(cover); cover = req.file.filename; }
  else if (b.remove_cover) { removeUpload(cover); cover = null; }
  const slug = uniqueSlug('articles', slugify(b.slug || data.title), id);
  db.transaction(() => {
    if (data.featured) db.prepare('UPDATE articles SET featured = 0').run();
    if (id) {
      db.prepare(`UPDATE articles SET slug=?, title=?, excerpt=?, content=?, category=?, author=?, game_id=?, featured=?, published=?, cover=?, updated_at=datetime('now') WHERE id=?`)
        .run(slug, data.title, data.excerpt, data.content, data.category, data.author, data.game_id, data.featured, data.published, cover, id);
    } else {
      db.prepare('INSERT INTO articles (slug,title,excerpt,content,category,author,game_id,featured,published,cover) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(slug, data.title, data.excerpt, data.content, data.category, data.author, data.game_id, data.featured, data.published, cover);
    }
  })();
  flash(req, 'ok', `Artikel "${data.title}" disimpan.`);
  res.redirect('/admin/artikel');
}
router.post('/artikel/baru', upload.single('cover'), csrf, saveArticle);
router.post('/artikel/:id', upload.single('cover'), csrf, saveArticle);

router.post('/artikel/:id/hapus', (req, res) => {
  const item = db.prepare('SELECT cover, title FROM articles WHERE id = ?').get(req.params.id);
  if (item) {
    db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
    removeUpload(item.cover);
    flash(req, 'ok', `Artikel "${item.title}" dihapus.`);
  }
  res.redirect('/admin/artikel');
});

// ---------- Game ----------
router.get('/game', (req, res) => {
  const items = db.prepare('SELECT g.*, (SELECT COUNT(*) FROM articles a WHERE a.game_id = g.id) article_count FROM games g ORDER BY title').all();
  res.render('admin/games', { items, section: 'game' });
});

const blankGame = { title: '', genre: '', platforms: '', developer: '', release_year: '', rating: '', summary: '', description: '' };
router.get('/game/baru', (req, res) => res.render('admin/game-form', { item: blankGame, error: null, section: 'game' }));
router.get('/game/:id', (req, res, next) => {
  const item = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
  if (!item) return next();
  res.render('admin/game-form', { item, error: null, section: 'game' });
});

function saveGame(req, res, next) {
  const id = req.params.id ? Number(req.params.id) : null;
  const old = id ? db.prepare('SELECT * FROM games WHERE id = ?').get(id) : null;
  if (id && !old) { if (req.file) removeUpload(req.file.filename); return next(); }
  const b = req.body;
  const data = {
    title: String(b.title || '').trim().slice(0, 120),
    genre: String(b.genre || '').trim().slice(0, 60),
    platforms: String(b.platforms || '').trim().slice(0, 80),
    developer: String(b.developer || '').trim().slice(0, 80),
    release_year: Number.parseInt(b.release_year, 10) || null,
    rating: Math.min(10, Math.max(0, Number.parseFloat(String(b.rating).replace(',', '.')) || 0)),
    summary: String(b.summary || '').trim().slice(0, 300),
    description: String(b.description || '')
  };
  if (!data.title) {
    if (req.file) removeUpload(req.file.filename);
    return res.status(400).render('admin/game-form', { item: { ...old, ...data, id }, error: 'Judul wajib diisi.', section: 'game' });
  }
  let cover = old ? old.cover : null;
  if (req.file) { removeUpload(cover); cover = req.file.filename; }
  else if (b.remove_cover) { removeUpload(cover); cover = null; }
  const slug = uniqueSlug('games', slugify(b.slug || data.title), id);
  const vals = [slug, data.title, data.genre, data.platforms, data.developer, data.release_year, data.rating, data.summary, data.description, cover];
  if (id) db.prepare('UPDATE games SET slug=?, title=?, genre=?, platforms=?, developer=?, release_year=?, rating=?, summary=?, description=?, cover=? WHERE id=?').run(...vals, id);
  else db.prepare('INSERT INTO games (slug,title,genre,platforms,developer,release_year,rating,summary,description,cover) VALUES (?,?,?,?,?,?,?,?,?,?)').run(...vals);
  flash(req, 'ok', `Game "${data.title}" disimpan.`);
  res.redirect('/admin/game');
}
router.post('/game/baru', upload.single('cover'), csrf, saveGame);
router.post('/game/:id', upload.single('cover'), csrf, saveGame);

router.post('/game/:id/hapus', (req, res) => {
  const item = db.prepare('SELECT cover, title FROM games WHERE id = ?').get(req.params.id);
  if (item) {
    db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
    removeUpload(item.cover);
    flash(req, 'ok', `Game "${item.title}" dihapus.`);
  }
  res.redirect('/admin/game');
});

// ---------- Akun ----------
router.get('/akun', (req, res) => res.render('admin/account', { error: null, section: 'akun' }));
router.post('/akun', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  const next = String(req.body.new_password || '');
  let error = null;
  if (!bcrypt.compareSync(String(req.body.current_password || ''), user.password_hash)) error = 'Password saat ini salah.';
  else if (next.length < 10) error = 'Password baru minimal 10 karakter.';
  else if (next !== req.body.confirm_password) error = 'Konfirmasi password tidak sama.';
  if (error) return res.status(400).render('admin/account', { error, section: 'akun' });
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 12), user.id);
  flash(req, 'ok', 'Password berhasil diganti.');
  res.redirect('/admin/akun');
});

module.exports = router;
