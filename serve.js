/* 山脊信使 RidgeLink · 本地静态服务
 * 用法：node serve.js  →  http://127.0.0.1:8931/
 * 说明：只为本地预览 + 测试 Service Worker 离线缓存（file:// 下 SW 不生效）。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8931);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.apk': 'application/vnd.android.package-archive',
  '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, code, body, type) {
  res.writeHead(code, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

/* 兼容两种部署：仓库根就是本目录，或本目录在 /ridge-link/ 子路径下 */
function stripPrefix(p) {
  const m = p.match(/^\/ridge-link(\/.*)?$/i);
  if (!m) return p;
  const rest = m[1] || '/';
  return fs.existsSync(path.join(ROOT, 'index.html')) ? rest : p;
}

http
  .createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(req.url.split('?')[0]);
    } catch {
      return send(res, 400, 'bad request');
    }

    urlPath = stripPrefix(urlPath);
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

    const target = path.join(ROOT, path.normalize(urlPath));
    if (!target.startsWith(ROOT)) return send(res, 403, 'forbidden');

    fs.stat(target, (err, st) => {
      let file = target;
      if (!err && st.isDirectory()) file = path.join(target, 'index.html');
      if (err) {
        /* 允许不带 .html 的简洁地址：/demo -> demo.html */
        if (!path.extname(target)) file = target + '.html';
      }
      fs.readFile(file, (e, data) => {
        if (e) return send(res, 404, '404 not found');
        send(res, 200, data, MIME[path.extname(file).toLowerCase()]);
      });
    });
  })
  .listen(PORT, '0.0.0.0', () => {
    console.log('UP  http://localhost:' + PORT + '/index.html');
  });
