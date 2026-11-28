/* ==========================================================================
   山脊信使 · 手机 App 外壳脚本（ui/app.js）
   --------------------------------------------------------------------------
   只在手机端加载：由各页面 <head> 里的内联脚本判断（窄屏 + 触摸）后动态注入，
   桌面浏览器完全不加载、不执行，网页版不受影响。

   做三件事：
     1) 顶部状态栏 + 底部三块导航（地图 / 场景 / 我的）
     2) 官网页面收成"功能区"：隐藏 8 个滚动区块，换成功能入口卡
     3) 交互演示页：地图独占一屏，场景/智能体/结果改成底部抽屉
   不修改任何业务逻辑与数据，只改呈现。
   ========================================================================== */
(function () {
  'use strict';

  var page = (document.body && document.body.dataset && document.body.dataset.rlPage) || '';
  var IS_SCENE = page === 'scene';
  var IS_DEMO  = page === 'demo';

  var ICONS = {
    map: '<svg viewBox="0 0 24 24"><path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6z"/><path d="M9 3v15M15 6v15"/></svg>',
    scene: '<svg viewBox="0 0 24 24"><path d="M3 18l5.5-9 4 6 3-4L21 18z"/><circle cx="17" cy="6" r="2"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10v10h11V10"/></svg>',
    layers: '<svg viewBox="0 0 24 24"><path d="M12 3 3 8l9 5 9-5z"/><path d="M3 14l9 5 9-5"/></svg>',
    bot: '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 3v4M9 13h.01M15 13h.01"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>'
  };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ---------------- 顶部状态栏 ---------------- */
  var TITLES = { scene: '真实场景', demo: '应急推演', index: '我的' };
  var SUBS   = { scene: '贵州 · 2021—2026', demo: '离线边缘模式', index: '山脊信使 RidgeLink' };

  function buildTopbar() {
    var bar = el('header', 'rl-topbar');
    var t = el('div', 'rl-title',
      '<img src="icon-192.png" alt="">' + (TITLES[page] || '山脊信使'));
    bar.appendChild(t);
    var sub = SUBS[page];
    if (sub) bar.appendChild(el('span', 'rl-sub', sub));
    document.body.insertBefore(bar, document.body.firstChild);
  }

  /* ---------------- 底部三块导航 ---------------- */
  function buildTabbar() {
    var bar = el('nav', 'rl-tabbar');

    if (IS_SCENE) {
      /* 真实场景页：底栏就是页面的三个 Tab，功能直接对应 */
      var tabs = [
        { key: 'map',   label: '地图', icon: ICONS.map },
        { key: 'cases', label: '案例', icon: ICONS.scene },
        { key: 'tools', label: '复盘', icon: ICONS.layers }
      ];
      tabs.forEach(function (t) {
        var a = el('a', t.key === 'map' ? 'on' : '', t.icon + '<span>' + t.label + '</span>');
        a.href = 'javascript:void 0';
        a.setAttribute('role', 'button');
        a.addEventListener('click', function (e) {
          e.preventDefault();
          var btn = document.querySelector('.tab[data-tab="' + t.key + '"]');
          if (btn) btn.click();
          Array.prototype.forEach.call(bar.children, function (n) { n.classList.remove('on'); });
          a.classList.add('on');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        bar.appendChild(a);
      });
      document.body.appendChild(bar);
      /* 让页面内 Tab 的切换同步底栏高亮（点卡片里的跳转也会变） */
      document.addEventListener('click', function (e) {
        var t = e.target.closest('.tab[data-tab]');
        if (!t) return;
        Array.prototype.forEach.call(bar.children, function (n, i) {
          n.classList.toggle('on', tabs[i].key === t.dataset.tab);
        });
      });
      return;
    }

    var items = [
      { key: 'map',   label: '地图', href: IS_DEMO ? 'demo.html' : 'scene.html', icon: ICONS.map,   on: IS_DEMO },
      { key: 'scene', label: '场景', href: 'scene.html',                          icon: ICONS.scene, on: false },
      { key: 'home',  label: '我的', href: 'index.html',                          icon: ICONS.home,  on: page === 'index' }
    ];
    items.forEach(function (it) {
      var a = el('a', it.on ? 'on' : '', it.icon + '<span>' + it.label + '</span>');
      a.href = it.href;
      if (it.on) a.setAttribute('aria-current', 'page');
      bar.appendChild(a);
    });
    document.body.appendChild(bar);
  }

  /* ---------------- 官网：长网页收成功能区 ---------------- */
  function buildHome() {
    if (page !== 'index') return;
    var home = el('div', 'rl-home');
    home.innerHTML =
      '<div class="rl-home-h">开始</div>' +
      '<a class="rl-card hot" href="scene.html">' +
        '<span class="ic">' + ICONS.map + '</span>' +
        '<span><b>进入真实场景</b><span>贵州四类灾害地图 · 2021—2026</span></span>' +
        '<em class="go">›</em>' +
      '</a>' +
      '<div class="rl-home-h">功能</div>' +
      '<a class="rl-card" href="demo.html">' +
        '<span class="ic">' + ICONS.bot + '</span><b>应急推演</b>' +
        '<span>五智能体 · 链路与调度</span>' +
      '</a>' +
      '<a class="rl-card" href="scene.html">' +
        '<span class="ic">' + ICONS.scene + '</span><b>灾情案例</b>' +
        '<span>四类灾害 · 时间线与处置</span>' +
      '</a>' +
      '<a class="rl-card" href="scene.html">' +
        '<span class="ic">' + ICONS.layers + '</span><b>复盘工具</b>' +
        '<span>时间线 · 值班链路 · 导入</span>' +
      '</a>' +
      '<a class="rl-card" href="download/RidgeLink-2.2.apk?v=2.2" download>' +
        '<span class="ic">' + ICONS.list + '</span><b>下载 APK</b>' +
        '<span>离线安装 · 无需网络</span>' +
      '</a>' +
      '<div class="rl-home-note">山脊信使 RidgeLink · 山区应急通信辅助智能体<br>' +
      '贵州电子科技职业学院 · 现代通信技术 · 2026</div>';
    var main = document.querySelector('main');
    if (main && main.parentNode) main.parentNode.insertBefore(home, main.nextSibling);
  }

  /* ---------------- 演示页：底部抽屉 ---------------- */
  function buildDemoSheets() {
    if (!IS_DEMO) return;
    var mask = el('div', 'rl-sheet-mask');
    document.body.appendChild(mask);

    /* 注意：外层用 div，避免继承页面的 .btn 样式（宽高会被撑坏） */
    var quick = el('div', 'rl-quick');
    quick.innerHTML =
      '<button type="button" data-sheet="left">' + ICONS.list + '<span>场景与资源</span></button>' +
      '<button type="button" data-sheet="right">' + ICONS.bot + '<span>智能体</span></button>' +
      '<button type="button" data-sheet="bottom">' + ICONS.layers + '<span>推演结果</span></button>';
    document.body.appendChild(quick);

    function closeAll() {
      ['left', 'right', 'bottom'].forEach(function (k) {
        var n = document.querySelector('.stage > .' + k);
        if (n) n.classList.remove('open');
      });
      mask.classList.remove('on');
      quick.classList.remove('hidden');
      document.body.classList.remove('rl-sheet-on');
    }
    function open(k) {
      closeAll();
      var n = document.querySelector('.stage > .' + k);
      if (!n) return;
      n.classList.add('open');
      mask.classList.add('on');
      quick.classList.add('hidden');
      document.body.classList.add('rl-sheet-on');
    }

    quick.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-sheet]');
      if (b) open(b.dataset.sheet);
    });
    mask.addEventListener('click', closeAll);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  }

  /* ---------------- 启动 ---------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  function boot() {
    document.body.classList.add('rl-app', 'rl-page-' + (page || 'index'));
    buildTopbar();
    buildTabbar();
    buildHome();
    buildDemoSheets();
  }
})();
