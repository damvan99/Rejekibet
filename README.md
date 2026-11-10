# Rejekibet

Portal berita, ulasan, dan panduan game berbahasa Indonesia — Node.js (Express + EJS + SQLite).

## Tính năng

- Trang công khai: trang chủ, danh mục (Berita / Ulasan / Panduan / Esports), bài viết, thư mục game có điểm số, tìm kiếm, trang giới thiệu, 404
- Trang quản trị `/admin`: đăng nhập, bảng điều khiển, thêm/sửa/xóa bài viết và game, tải ảnh bìa, đổi mật khẩu
- SEO: thẻ meta + Open Graph, `sitemap.xml`, `robots.txt`, URL thân thiện
- Bảo mật: bcrypt, session lưu trong SQLite, CSRF, Helmet (CSP), giới hạn số lần đăng nhập, lọc HTML của Markdown
- Ảnh bìa tự sinh (SVG) khi bài viết chưa có ảnh

## Chạy trên máy

```bash
npm install
cp .env.example .env   # rồi sửa giá trị
npm run dev
```

Mở http://localhost:3000 — trang quản trị ở `/admin`. Nếu không đặt `ADMIN_PASSWORD`, mật khẩu ngẫu nhiên được in ra console ở lần chạy đầu tiên.
Nội dung mẫu (game hư cấu) được thêm tự động khi cơ sở dữ liệu trống; đặt `SEED=off` để tắt.

## Deploy lên Hostinger VPS (Ubuntu)

```bash
# 1. Cài Node.js 22, công cụ build, Nginx, PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential nginx git
sudo npm i -g pm2

# 2. Lấy mã nguồn
git clone https://github.com/<tai-khoan>/rejekibet.git /var/www/rejekibet
cd /var/www/rejekibet
npm ci --omit=dev

# 3. Cấu hình
cp .env.example .env
nano .env    # đặt SITE_URL, SESSION_SECRET, ADMIN_PASSWORD

# 4. Chạy bằng PM2
pm2 start ecosystem.config.js
pm2 save && pm2 startup

# 5. Nginx + SSL
sudo cp deploy/nginx.conf /etc/nginx/sites-available/rejekibet   # sửa server_name
sudo ln -s /etc/nginx/sites-available/rejekibet /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.com -d www.domain-anda.com
```

Cập nhật phiên bản mới:

```bash
cd /var/www/rejekibet && git pull && npm ci --omit=dev && pm2 restart rejekibet
```

## Sao lưu

Toàn bộ dữ liệu nằm trong `data/rejekibet.db` và `public/uploads/`. Sao lưu hai mục này định kỳ.
