// Konten contoh. Semua judul game di bawah ini fiktif — ganti lewat panel admin.
const { db } = require('./db');

const games = [
  ['langit-nusantara', 'Langit Nusantara', 'RPG Dunia Terbuka', 'PC, Konsol', 'Studio Garuda Api', 2026, 9.1,
    'Petualangan dunia terbuka di kepulauan melayang yang terinspirasi mitologi Nusantara.',
    'Kamu berperan sebagai **Penjaga Angin**, pengelana yang menjelajahi tujuh pulau melayang.\n\n## Yang menonjol\n\n- Dunia luas tanpa layar pemuatan\n- Sistem cuaca yang memengaruhi pertarungan\n- Musik gamelan modern yang megah\n\n## Catatan\n\nButuh sekitar 45 jam untuk menamatkan cerita utama.'],
  ['balap-malam-jakarta', 'Balap Malam: Ibu Kota', 'Balapan Arkade', 'PC, Konsol, Mobile', 'Neon Kopaja', 2025, 8.3,
    'Balapan jalanan penuh neon dengan kendali arkade yang mudah dipelajari, sulit dikuasai.',
    'Lebih dari 60 mobil, mode karier 20 jam, dan balapan daring 12 pemain.\n\n## Yang menonjol\n\n- Rasa kecepatan yang luar biasa\n- Kustomisasi visual sangat dalam\n- Soundtrack funkot dan synthwave'],
  ['kerajaan-rempah', 'Kerajaan Rempah', 'Strategi', 'PC', 'Pala & Cengkih Interaktif', 2025, 8.8,
    'Bangun jalur dagang, jaga diplomasi, dan kuasai lautan di strategi bergilir bertema maritim.',
    'Setiap keputusan dagang punya konsekuensi politik.\n\n## Yang menonjol\n\n- Ekonomi yang rumit tapi terbaca jelas\n- Kampanye 4 babak dengan akhir bercabang\n- Mode multipemain asinkron'],
  ['pendekar-bayangan', 'Pendekar Bayangan', 'Aksi', 'PC, Konsol', 'Kelir Works', 2026, 8.6,
    'Aksi cepat bergaya wayang kulit dengan sistem tangkis yang menuntut ketepatan.',
    'Seluruh dunia digambar seperti panggung wayang — siluet tajam di atas cahaya hangat.\n\n## Yang menonjol\n\n- Pertarungan bos yang tak terlupakan\n- Arah visual unik\n- Tingkat kesulitan bisa diatur'],
  ['warung-simulator', 'Warung Sore', 'Simulasi Santai', 'PC, Mobile', 'Teh Hangat Games', 2024, 7.9,
    'Kelola warung kecil, kenali pelanggan tetapmu, dan nikmati sore yang tenang.',
    'Game santai tanpa tekanan waktu.\n\n## Yang menonjol\n\n- Cerita pelanggan yang menyentuh\n- Cocok dimainkan 15 menit sehari\n- Bisa dimainkan luring'],
  ['arena-lima', 'Arena Lima', 'MOBA', 'Mobile', 'Titik Temu Studio', 2025, 8.0,
    'MOBA 5v5 berdurasi 10 menit yang dirancang untuk ponsel kelas menengah.',
    'Ringan, cepat, dan kompetitif.\n\n## Yang menonjol\n\n- Pertandingan singkat\n- 48 hero di peluncuran\n- Sistem peringkat yang adil']
];

const articles = [
  ['ulasan-langit-nusantara', 'Ulasan Langit Nusantara: Dunia Terbuka yang Akhirnya Terasa Seperti Rumah', 'ulasan', 'Dimas Prakoso', 'langit-nusantara', 1,
    'Setelah 50 jam menjelajahi tujuh pulau melayang, kami yakin ini salah satu RPG terbaik tahun ini.',
    'Ada momen di jam kelima ketika kabut tersibak dan pulau kedua muncul di cakrawala. Di situlah **Langit Nusantara** menunjukkan ambisinya.\n\n## Dunia yang hidup\n\nSetiap pulau punya iklim, budaya, dan musiknya sendiri. Penduduknya punya jadwal harian, pasar berubah mengikuti musim, dan cuaca bukan sekadar hiasan — hujan membuat serangan petir lebih kuat, angin kencang mengubah arah panahmu.\n\n## Pertarungan\n\nSistemnya mudah dipahami tapi punya kedalaman. Kamu menggabungkan tiga elemen angin untuk membentuk kombo, dan musuh menuntutmu beradaptasi.\n\n> Ini game yang menghargai rasa ingin tahu. Hampir setiap sudut menyimpan sesuatu.\n\n## Kekurangan\n\n- Menu inventaris terasa lambat\n- Beberapa misi sampingan berulang\n- Performa turun di kota terbesar\n\n## Kesimpulan\n\nKekurangannya kecil dibanding pencapaiannya. **Skor: 9,1/10.**'],
  ['kerajaan-rempah-pembaruan-besar', 'Kerajaan Rempah Umumkan Pembaruan Besar: Peta Baru dan Mode Kerja Sama', 'berita', 'Sari Wulandari', 'kerajaan-rempah', 0,
    'Pengembang mengonfirmasi peta kepulauan timur dan mode kampanye dua pemain akan hadir bulan depan.',
    'Pala & Cengkih Interaktif mengumumkan pembaruan gratis terbesar untuk **Kerajaan Rempah**.\n\n## Isi pembaruan\n\n- Peta baru: kepulauan timur dengan 14 pelabuhan\n- Kampanye kerja sama untuk dua pemain\n- Penyeimbangan ulang harga komoditas\n- Perbaikan AI diplomasi\n\nPembaruan ini gratis untuk semua pemilik game dan dijadwalkan rilis bulan depan.'],
  ['panduan-pemula-arena-lima', 'Panduan Pemula Arena Lima: 7 Hal yang Wajib Kamu Tahu Sebelum Main Peringkat', 'panduan', 'Rizky Hidayat', 'arena-lima', 0,
    'Dari memilih peran sampai membaca peta — bekal lengkap supaya kamu tidak jadi beban tim.',
    'Pertandingan **Arena Lima** hanya 10 menit, jadi satu kesalahan kecil terasa mahal. Ini dasar-dasarnya.\n\n## 1. Kuasai satu peran dulu\n\nJangan berpindah-pindah. Pilih satu peran dan tiga hero, lalu mainkan sampai nyaman.\n\n## 2. Lihat peta setiap lima detik\n\nKebiasaan kecil ini mencegah sebagian besar kematian yang tidak perlu.\n\n## 3. Objektif lebih penting dari kill\n\nMenara dan monster hutan memenangkan pertandingan, bukan angka kill.\n\n## 4. Atur sensitivitas kontrol\n\nLuangkan 10 menit di mode latihan.\n\n## 5. Belajar kapan mundur\n\nMundur bukan kalah. Mati sia-sia memberi emas ke lawan.\n\n## 6. Komunikasi singkat\n\nGunakan ping, bukan ketikan panjang.\n\n## 7. Istirahat setelah dua kali kalah\n\nMain sambil emosi hampir selalu berakhir buruk.'],
  ['final-piala-arena-lima', 'Final Piala Arena Lima Pecahkan Rekor Penonton', 'esports', 'Sari Wulandari', 'arena-lima', 0,
    'Laga puncak berlangsung lima gim penuh dan ditutup dengan comeback dramatis.',
    'Final musim ini berjalan hingga gim kelima.\n\n## Jalannya laga\n\nTim penantang sempat tertinggal 0–2 sebelum membalikkan keadaan lewat tiga kemenangan beruntun.\n\n## Apa selanjutnya\n\nMusim berikutnya akan memakai format liga dengan 10 tim.'],
  ['ulasan-pendekar-bayangan', 'Ulasan Pendekar Bayangan: Indah, Keras, dan Sulit Dilepas', 'ulasan', 'Dimas Prakoso', 'pendekar-bayangan', 0,
    'Aksi bergaya wayang ini menuntut kesabaran, lalu membalasnya dengan pertarungan bos terbaik tahun ini.',
    'Sejak layar pertama, **Pendekar Bayangan** tampil beda: siluet hitam di atas cahaya lampu minyak.\n\n## Sistem tangkis\n\nSemuanya berpusat pada waktu. Tangkisan sempurna membuka celah, tangkisan telat menguras stamina.\n\n## Bos\n\nSetiap bos adalah ujian atas apa yang sudah kamu pelajari, bukan sekadar musuh berdarah tebal.\n\n## Kesimpulan\n\nBukan untuk semua orang, tapi yang bertahan akan sangat puas. **Skor: 8,6/10.**'],
  ['tips-hemat-balap-malam', '5 Cara Cepat Kumpulkan Kredit di Balap Malam: Ibu Kota', 'panduan', 'Rizky Hidayat', 'balap-malam-jakarta', 0,
    'Tidak perlu grinding berjam-jam. Ikuti urutan ini dan garasimu penuh dalam seminggu.',
    'Kredit adalah segalanya di mode karier.\n\n## 1. Selesaikan tantangan harian\n\nHadiahnya kecil, tapi bonus beruntunnya besar.\n\n## 2. Ulangi balapan ketahanan\n\nRasio kredit per menitnya paling tinggi.\n\n## 3. Jangan beli mobil kelas bawah\n\nTabung untuk kelas B ke atas.\n\n## 4. Jual suku cadang ganda\n\nCek gudangmu secara berkala.\n\n## 5. Ikut acara akhir pekan\n\nPengganda kredit aktif setiap Sabtu dan Minggu.'],
  ['warung-sore-versi-mobile', 'Warung Sore Resmi Hadir di Mobile dengan Fitur Simpan Lintas Perangkat', 'berita', 'Ayu Lestari', 'warung-simulator', 0,
    'Game simulasi santai favorit banyak orang kini bisa dimainkan di ponsel tanpa kehilangan progres.',
    'Teh Hangat Games merilis versi mobile **Warung Sore** hari ini.\n\n## Yang baru\n\n- Kontrol sentuh yang didesain ulang\n- Simpan lintas perangkat\n- Tiga pelanggan baru dengan ceritanya sendiri\n\nPemilik versi PC bisa menyambungkan akun untuk melanjutkan progres.'],
  ['game-santai-pelepas-penat', '5 Game Santai untuk Melepas Penat Sepulang Kerja', 'panduan', 'Ayu Lestari', null, 0,
    'Tidak semua game harus menegangkan. Ini pilihan redaksi untuk malam yang tenang.',
    'Kadang kita hanya ingin duduk dan bersantai.\n\n## Kriteria kami\n\n- Bisa dimainkan dalam sesi pendek\n- Tanpa tekanan waktu\n- Musik dan visual yang menenangkan\n\n## Pilihan teratas\n\n**Warung Sore** tetap jadi rekomendasi pertama kami. Sisanya bisa kamu temukan di direktori game.']
];

function seed() {
  const insG = db.prepare('INSERT INTO games (slug,title,genre,platforms,developer,release_year,rating,summary,description) VALUES (?,?,?,?,?,?,?,?,?)');
  const insA = db.prepare(`INSERT INTO articles (slug,title,category,author,game_id,featured,excerpt,content,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,datetime('now', ?),datetime('now', ?))`);
  db.transaction(() => {
    for (const g of games) insG.run(...g);
    articles.forEach((a, i) => {
      const game = a[4] ? db.prepare('SELECT id FROM games WHERE slug = ?').get(a[4]) : null;
      const offset = `-${i * 19 + 2} hours`;
      insA.run(a[0], a[1], a[2], a[3], game ? game.id : null, a[5], a[6], a[7], offset, offset);
    });
  })();
}

function seedIfEmpty() {
  const empty = !db.prepare('SELECT 1 FROM articles LIMIT 1').get() && !db.prepare('SELECT 1 FROM games LIMIT 1').get();
  if (empty) { seed(); console.log('[rejekibet] Konten contoh ditambahkan.'); }
}

if (require.main === module) { seedIfEmpty(); }
module.exports = { seedIfEmpty };
