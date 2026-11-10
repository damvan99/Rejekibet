const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');

const CATEGORIES = {
  berita: { label: 'Berita', desc: 'Kabar terbaru dari dunia game.' },
  ulasan: { label: 'Ulasan', desc: 'Penilaian jujur setelah kami memainkannya sampai tuntas.' },
  panduan: { label: 'Panduan', desc: 'Tips, trik, dan strategi supaya kamu main lebih jago.' },
  esports: { label: 'Esports', desc: 'Turnamen, tim, dan cerita dari panggung kompetitif.' }
};

function slugify(text) {
  return String(text || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'tanpa-judul';
}

function renderMarkdown(md) {
  const html = marked.parse(String(md || ''), { gfm: true, breaks: false });
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'figure', 'figcaption']),
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'title', 'loading']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener nofollow' }),
      img: sanitizeHtml.simpleTransform('img', { loading: 'lazy' })
    }
  });
}

const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
function formatDate(iso) {
  const d = new Date(String(iso).replace(' ', 'T') + (String(iso).endsWith('Z') ? '' : 'Z'));
  return isNaN(d) ? '' : dateFmt.format(d);
}

function readingTime(md) {
  const words = String(md || '').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function coverUrl(item) {
  if (!item) return '/cover/rejekibet.svg';
  return item.cover ? '/uploads/' + item.cover : '/cover/' + item.slug + '.svg';
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Sampul generatif: setiap slug menghasilkan komposisi unik, jadi konten tanpa gambar tetap tampil rapi.
function coverSvg(seed) {
  let s = hash(seed);
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const palettes = [
    ['#1a1206', '#f5b83d', '#ff7a45'], ['#06141a', '#2ad4c0', '#f5b83d'],
    ['#120a1f', '#9b7bff', '#ff5d8f'], ['#071a10', '#5fe08a', '#f5e663'],
    ['#1a0a0a', '#ff5d5d', '#f5b83d'], ['#08101f', '#4da3ff', '#2ad4c0']
  ];
  const [bg, a, b] = palettes[Math.floor(rnd() * palettes.length)];
  let shapes = '';
  for (let i = 0; i < 7; i++) {
    const x = Math.round(rnd() * 800), y = Math.round(rnd() * 450), r = Math.round(30 + rnd() * 150);
    const c = rnd() > 0.5 ? a : b, o = (0.08 + rnd() * 0.3).toFixed(2), k = rnd();
    if (k < 0.4) shapes += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`;
    else if (k < 0.7) shapes += `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="${Math.round(r / 5)}" fill="none" stroke="${c}" stroke-width="${2 + Math.round(rnd() * 10)}" opacity="${o}" transform="rotate(${Math.round(rnd() * 90)} ${x} ${y})"/>`;
    else shapes += `<polygon points="${x},${y - r} ${x + r},${y + r} ${x - r},${y + r}" fill="${c}" opacity="${o}" transform="rotate(${Math.round(rnd() * 360)} ${x} ${y})"/>`;
  }
  let dots = '';
  const gx = Math.round(rnd() * 500) + 60, gy = Math.round(rnd() * 250) + 40;
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) dots += `<circle cx="${gx + i * 22}" cy="${gy + j * 22}" r="2.5" fill="${a}" opacity=".7"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${a}" stop-opacity=".35"/></linearGradient></defs><rect width="800" height="450" fill="${bg}"/><rect width="800" height="450" fill="url(#g)"/>${shapes}${dots}</svg>`;
}

module.exports = { CATEGORIES, slugify, renderMarkdown, formatDate, readingTime, coverUrl, coverSvg };
