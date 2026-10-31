# GitHub Pages与安卓网页发布

站点：[https://jackrobertfoxy.github.io/whfanficgame/](https://jackrobertfoxy.github.io/whfanficgame/)。仓库所有者已经启用GitHub Actions来源，无需再次配置Pages或提供令牌。当前版本发布证据见 [验证记录](VALIDATION.md)。

`.github/workflows/pages.yml`在main推送后执行固定版本安装、16项逻辑测试、类型检查、Vite构建与离线清单生成、网页ZIP打包、Release附件上传、Pages部署及线上资源检查。自动工作流发布 `web-v1.2`；仓库也保存 `downloads/quiet-world-web-v1.2.zip`，用户不依赖工作区链接下载。

发布目录为 `dist/`。ZIP为静态网站，需要HTTP／HTTPS托管；双击HTML不能运行模块脚本。电脑和安卓浏览器共用一个网址，可在完整缓存后离线重开或添加到主屏幕；不是原生APK，无数据库与后台账号。

部署检查验证HTML、脚本、样式、清单、三个全头盔PNG及三个新场景。主要JS还必须包含v1.2标识，避免把缓存的旧入口误判为本次上线。report作业将构建状态、部署状态、源SHA、实际URL、HTTP状态与资源检查结果写到 `codex-pages-status` 分支。只有与本次源码SHA对应的成功回执才用作发布证据。

当前云执行器对GitHub管理API及Pages公网域名仍有出站限制；使用现有Git代理读取工作流回执。本机的完整交互检查使用同一生产构建及 `/whfanficgame/` 子路径，不能声称本机直接打开公网进行了交互，也不能将Pixel7模拟当作安卓真机。

更新时先存档，关闭本站所有标签再打开，使等待中的service worker接管；网站不会在阅读中强制刷新。v1.2叙事已重写，旧v1—v3进度只保留阅读设置并从病房开始，旧浏览器键保持原样，详见数据模型。原PDF、环境凭据、node_modules与本地测试产物不进入站点。
