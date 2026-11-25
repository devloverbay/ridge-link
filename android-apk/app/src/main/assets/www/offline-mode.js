/* 山脊信使 RidgeLink · 在线 / 离线模式状态条
 * 作用：在五个页面顶部显示当前网络状态。
 *   - 浏览器在线：在线
 *   - 浏览器断网：离线模式（本机推理）
 *   - APK（file://）：离线可用（本地资源）
 * 点击状态条可查看当前模式说明；断网 / 恢复时会弹出一条提示。
 */
(function () {
  'use strict';

  var PAGE = (function () {
    var p = location.pathname.split('/').pop().replace(/\.html?$/i, '');
    return p || 'index';
  })();
  document.documentElement.setAttribute('data-page', PAGE);

  var css = [
    '#netMode{display:inline-flex;align-items:center;justify-content:center;gap:6px;flex:none;',
    'min-width:76px;min-height:30px;padding:4px 12px;border-radius:999px;border:1px solid rgba(126,183,224,.26);',
    'background:rgba(10,24,38,.55);color:#9db8cf;',
    'font:700 11px/1 "PingFang SC","Microsoft YaHei",system-ui,sans-serif;letter-spacing:.5px;',
    'white-space:nowrap;cursor:pointer;font-family:inherit;transition:all .22s;',
    '-webkit-tap-highlight-color:transparent}',
    '#netMode:hover{border-color:rgba(126,183,224,.45);color:#dcecf8}',
    '#netMode i{width:7px;height:7px;border-radius:50%;background:#2ee6c5;box-shadow:0 0 8px #2ee6c5;flex:none}',
    '#netMode[data-state="offline"]{color:#ffc9a3;border-color:rgba(255,138,61,.5);background:rgba(255,138,61,.1)}',
    '#netMode[data-state="offline"] i{background:#ff8a3d;box-shadow:0 0 10px #ff8a3d;animation:nmPulse 1.3s infinite}',
    '@keyframes nmPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.72)}}',
    '#nmToast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));',
    'transform:translateX(-50%) translateY(10px);z-index:9999;max-width:calc(100vw - 28px);',
    'padding:10px 16px;border-radius:12px;border:1px solid rgba(255,138,61,.45);',
    'background:rgba(8,18,30,.97);color:#ffd9b3;',
    'font:600 12px/1.6 "PingFang SC","Microsoft YaHei",system-ui,sans-serif;letter-spacing:.4px;',
    'text-align:center;box-shadow:0 14px 40px rgba(0,0,0,.55);opacity:0;pointer-events:none;',
    'transition:opacity .25s,transform .25s}',
    '#nmToast.show{opacity:1;transform:translateX(-50%) translateY(0)}',
    '@media(max-width:760px){#nmToast{bottom:calc(80px + env(safe-area-inset-bottom))}}',
    '@media(max-width:760px){html[data-page="pitch"] .top-right .clock{display:none}}',
    '@media(max-width:720px){html[data-page="scene"] .top-right > .tag{display:none}}',
    /* 低端手机性能：关闭大面积模糊与光晕，减少滚动掉帧 */
    '@media(max-width:720px){.glow{display:none!important}.top,.tabs,.cases,.legend{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}}',
    '@media(max-width:560px){#netMode{min-width:70px;padding:5px 8px;font-size:10.5px}}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'netMode';
  btn.type = 'button';
  btn.setAttribute('data-state', 'online');
  btn.title = '离线模式 · 本机推理中，数据不出设备';
  btn.innerHTML = '<i></i><span id="netModeText">在线</span>';

  function mount() {
    var host = null;
    if (PAGE === 'index') host = document.querySelector('nav');
    else if (PAGE === 'demo') host = document.querySelector('.top');
    else host = document.querySelector('.top-right') || document.querySelector('.top');
    if (!host) return false;
    host.appendChild(btn);
    return true;
  }
  if (!mount()) document.addEventListener('DOMContentLoaded', mount, { once: true });

  var toastEl = document.createElement('div');
  toastEl.id = 'nmToast';
  document.body.appendChild(toastEl);
  var toastTimer = null;
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 4500);
  }

  var textEl = btn.querySelector('#netModeText');

  function state() {
    if (location.protocol === 'file:') return 'local';
    if (!navigator.onLine) return 'offline';
    return 'online';
  }

  function apply(announce) {
    var s = state();
    btn.setAttribute('data-state', s);
    document.documentElement.setAttribute('data-netmode', s);
    if (s === 'offline') {
      textEl.textContent = '离线模式';
      if (announce) toast('网络已断开 · 已切换离线模式，本机推理中，数据不出设备');
    } else if (s === 'local') {
      textEl.textContent = '离线可用';
      if (announce) toast('APK 本地运行 · 所有页面与计算都在本机，飞行模式可用');
    } else {
      textEl.textContent = '在线';
      if (announce) toast('网络已恢复 · 可同步云端');
    }
  }

  btn.addEventListener('click', function () {
    var s = state();
    if (s === 'offline') {
      toast('当前为真实断网：本地数据 + 本地推理，对外走北斗 / 卫星 / PDT');
    } else if (s === 'local') {
      toast('当前为 APK 本地模式：页面、地形与链路计算全部在本机完成');
    } else {
      toast('在线模式：可同步云端；断网后自动切换离线模式，本机推理不中断');
    }
  });

  window.addEventListener('online', function () { apply(true); });
  window.addEventListener('offline', function () { apply(true); });
  apply(false);

  /* 方便调试与答辩演示：window.__ridgeNet.state() */
  window.__ridgeNet = { state: state, apply: apply };
})();
