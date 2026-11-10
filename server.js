require('dotenv').config({ quiet: true });
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');

const { SqliteStore } = require('./src/db');
const { seedIfEmpty } = require('./src/seed');
const h = require('./src/helpers');

const app = express();
const PROD = process.env.NODE_ENV === 'production';
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');

if (PROD && !process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET wajib diisi di .env untuk mode production.');
  process.exit(1);
}
if (process.env.SEED !== 'off') seedIfEmpty();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      upgradeInsecureRequests: null
    }
  }
}));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: PROD ? '7d' : 0 }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use(session({
  name: 'rjk.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  store: new SqliteStore(),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: 7 * 864e5 }
}));

app.use((req, res, next) => {
  Object.assign(res.locals, h, {
    siteUrl: SITE_URL || `${req.protocol}://${req.get('host')}`,
    currentPath: req.path,
    year: new Date().getFullYear(),
    meta: {}
  });
  next();
});

app.use('/admin', require('./src/routes/admin'));
app.use('/', require('./src/routes/public'));

app.use((req, res) => {
  res.status(404).render('404', { meta: { title: 'Halaman tidak ditemukan' } });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500) console.error(err);
  res.status(status).render('404', {
    meta: { title: 'Terjadi kesalahan' },
    errorMessage: status === 413 ? 'Ukuran gambar terlalu besar (maksimal 5 MB).' : (err.expose ? err.message : 'Terjadi kesalahan pada server. Coba lagi sebentar.')
  });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`[rejekibet] Berjalan di http://localhost:${port}`));
