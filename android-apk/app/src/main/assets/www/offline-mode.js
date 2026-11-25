/* 山脊信使 RidgeLink · 离线模式判定
 * 顶部「在线」状态条已下线，本文件只保留：
 *   - html[data-page] 标记（供各页响应式样式判断当前页）
 *   - html[data-netmode] 状态标记（online / offline / local）
 *   - 断网、恢复、APK 本地运行时的底部提示
 */
(function () {
  'use strict';

  var PAGE = (function () {
    var p = location.pathname.split('/').pop().replace(/\.html?$/i, '');
    return p || 'index';
  })();
  document.documentElement.setAttribute('data-page', PAGE);

  var css = [
    '#nmToast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));',
    'transform:translateX(-50%) translateY(10px);z-index:9999;max-width:calc(100vw - 28px);',
    'padding:10px 16px;border-radius:12px;border:1px solid rgba(191,106,16,.45);',
    'background:rgba(255,255,255,.98);color:#8f4f10;',
    'font:600 12px/1.6 "PingFang SC","Microsoft YaHei",system-ui,sans-serif;letter-spacing:.4px;',
    'text-align:center;box-shadow:0 14px 40px rgba(15,64,92,.18);opacity:0;pointer-events:none;',
    'transition:opacity .25s,transform .25s}',
    '#nmToast.show{opacity:1;transform:translateX(-50%) translateY(0)}',
    '@media(max-width:760px){#nmToast{bottom:calc(80px + env(safe-area-inset-bottom))}}',
    '@media(max-width:760px){html[data-page="pitch"] .top-right .clock{display:none}}',
    '@media(max-width:720px){html[data-page="scene"] .top-right > .tag{display:none}}',
    /* 低端手机性能：关闭大面积模糊与光晕，减少滚动掉帧 */
    '@media(max-width:720px){.glow{display:none!important}.top,.tabs,.cases,.legend{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}}',
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

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

  function state() {
    if (location.protocol === 'file:') return 'local';
    if (!navigator.onLine) return 'offline';
    return 'online';
  }

  function apply(announce) {
    var s = state();
    document.documentElement.setAttribute('data-netmode', s);
    if (!announce) return;
    if (s === 'offline') {
      toast('网络已断开 · 已切换离线模式，本机推理中，数据不出设备');
    } else if (s === 'local') {
      toast('APK 本地运行 · 所有页面与计算都在本机，飞行模式可用');
    } else {
      toast('网络已恢复 · 可同步云端');
    }
  }

  window.addEventListener('online', function () { apply(true); });
  window.addEventListener('offline', function () { apply(true); });
  apply(false);

  /* 方便调试与答辩演示：window.__ridgeNet.state() */
  window.__ridgeNet = { state: state, apply: apply };
})();
