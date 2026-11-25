# 山脊信使 RidgeLink — Android APK 工程

把 `ridge-link` 的静态网页打包成原生 Android App（WebView 容器），**完全离线**运行。

> 📱 **想直接拿到 APK？看 [`云打包教程.md`](./云打包教程.md)** —— 不装 Android Studio，用 GitHub Actions 云端编译，浏览器就能操作。

---

## 目录结构

```text
android-apk/                     ← 如果单独为它建仓库，仓库根目录必须是这一层
├── settings.gradle
├── build.gradle                 ← 故意留空：仓库来源统一在 settings.gradle
├── gradle.properties
├── sync-web.ps1                 ← 本地同步网页到 assets
├── 云打包教程.md
├── .github/workflows/
│   └── android-apk.yml          ← 云端构建工作流
└── app/
    ├── build.gradle
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/com/ridgelink/app/MainActivity.kt
        ├── res/
        │   ├── values/strings.xml
        │   └── layout/activity_main.xml
        └── assets/www/          ← 网页副本（由 sync-web.ps1 更新）
            ├── index.html
            ├── demo.html
            ├── scene.html
            ├── proposal.html
            ├── pitch.html
            ├── manifest.webmanifest
            ├── sw.js
            ├── icon-192.png
            ├── icon-512.png
            └── icon-180.png
```

---

## 技术参数

| 项目 | 值 |
|---|---|
| 包名 | `com.ridgelink.app` |
| minSdk | 21（Android 5.0+） |
| targetSdk / compileSdk | 34 |
| AGP | 8.5.2 |
| Gradle | 8.7 |
| Kotlin | 1.9.24 |
| JDK | 17 |
| 版本 | 1.1（versionCode 2） |
| 依赖 | 无（不使用 AndroidX / 第三方库） |

---

## 云端编译（推荐）

见 [`云打包教程.md`](./云打包教程.md)。核心就三步：

1. 把本文件夹推到 GitHub（仓库根 = 本文件夹内容）
2. 自动触发 `.github/workflows/android-apk.yml`
3. Actions → Artifacts → 下载 `RidgeLink-debug-APK` → 解压出 `app-debug.apk`

---

## 本地编译（可选）

需要本机有 JDK 17 + Android SDK：

```bash
cd android-apk
gradle assembleDebug
# 产物：app/build/outputs/apk/debug/app-debug.apk
```

或用 Android Studio 打开本文件夹，`Build → Build Bundle(s) / APK(s) → Build APK(s)`。

---

## 运行说明

- WebView 通过 `file:///android_asset/www/index.html` 加载本地资产，**断网也能用**
- 已开启 JavaScript、DOM Storage、file 协议访问
- 返回键：先在页面内后退，退到底才退出 App
- 屏幕旋转不重建 Activity（`configChanges`），避免页面刷新

---

## 手机适配与离线

- 五个页面都做了手机端单列布局：顶部导航可横向滑动、标签页 / 目录横向滚动、地图可左右滑动、路演页支持左右滑动翻页。
- 网页版（公网 / 局域网）支持 PWA：`manifest.webmanifest` + `sw.js` + 图标，Android Chrome / iOS Safari 可「添加到主屏幕」，首次打开后断网仍能进入。
- APK 本身就是本地 `file://` 资源，不依赖网络；Service Worker 在 `file://` 下会自动跳过注册，不影响使用。
- 改动页面后务必跑一次 `sync-web.ps1`，否则 APK 里仍是旧页面。

---

## 改了网页之后

网页在 APK 里是副本，必须同步：

```powershell
cd android-apk
powershell -ExecutionPolicy Bypass -File .\sync-web.ps1
```

然后 Commit + Push，云端会重新打包。
