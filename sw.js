/* 山脊信使 RidgeLink · 离线缓存 Service Worker
 * 目的：手机「添加到主屏幕」后，断网也能打开官网 / 演示 / 真实场景 / 计划书 / 路演。
 * 策略：
 *   - 页面导航：先联网取最新，失败时回退缓存（离线可用）
 *   - 静态资源：缓存优先
 * 更新页面后，把 CACHE 版本号 +1 即可让所有客户端换新缓存。
 */
const CACHE = 'ridgelink-v7';

const CORE = [
  './',
  './index.html',
  './demo.html',
  './scene.html',
  './proposal.html',
  './pitch.html',
  './offline-mode.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  /* 页面导航：网络优先，离线 / 网关错误时回退缓存 */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(async res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
            return res;
          }
          const hit = await caches.match(req, { ignoreSearch: true });
          return hit || res;
        })
        .catch(async () => {
          const hit = await caches.match(req, { ignoreSearch: true });
          return hit || (await caches.match('./index.html'));
        })
    );
    return;
  }

  /* 静态资源：先给缓存（秒开），同时后台静默更新，下次打开就是新版 */
  event.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req)
        .then(res => {
          if (res && res.ok && !url.search) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
