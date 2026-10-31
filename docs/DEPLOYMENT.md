# GitHub Pages 与安卓网页发布

目标仓库：`JackRobertFoxy/whfanficgame`。预期站点为 `https://jackrobertfoxy.github.io/whfanficgame/`；这是由仓库名推导的目标地址，只有远端发布成功且 HTTP 与浏览器验证后才能称为已上线。

## 自动部署

工作流 `.github/workflows/pages.yml` 在 main 推送后执行：固定版本安装 → 11 项测试 → 类型检查与构建 → 上传 Pages artifact → 发布。也可在 Actions 手动运行。

如仓库尚未启用 Pages，工作流会尝试配置。GitHub 对创建 Pages 站点的权限可能高于 Actions 默认令牌权限；若首次运行提示无权创建站点，在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**，然后重跑工作流。无需向代码或聊天提供令牌。

发布的是 `dist/`，不公开原 PDF、node_modules、测试截图或环境凭据。自定义域名可在之后配置；本版不预设 CNAME。

`base: './'`、相对清单与作用域内资源路径允许部署在 `/whfanficgame/` 下。Service worker 缓存只管理自己的路径，使用内容摘要更新版本。

## 外部环境限制

本机通过平台代理读取 GitHub。最初访问 `api.github.com` 得到 CONNECT 403，是当前出站策略拦截，并不能据此认定 GitHub 仓库令牌失效。环境草稿已增加 `api.github.com` 与 `jackrobertfoxy.github.io`，保留既有包管理器网络组；草稿保存本身不会把规则应用到运行实例。

要从本环境自动管理／检查 Pages，需要在环境设置保存应用新增域名，然后重试 GitHub API 及站点检查。不能绕过代理、关闭 TLS 校验或提取注入凭据。

## 静态发布包

`npm run package` 生成 `release/quiet-world-web-v1.0.zip`。解压后可部署到任何支持静态 HTTPS 的网站，不需要数据库或 Node 服务端。禁止只上传 index.html；art、icons、assets、manifest、asset-manifest 和 sw.js 都需要保留。

安卓浏览器与电脑访问同一个站点。安卓安装是 PWA，不是 APK；没有原生系统权限或应用商店依赖。

## 更新

新版本缓存不会在玩家进行当前叙事时强制刷新。出现更新提示后，先存档，关闭本站所有标签页再重新打开。存档格式独立于美术缓存，v1 Demo 进度通过迁移进入首个未完成章节；原旧档不会删除。

## 发布后的必要验证

1. Actions 的 build 和 deploy 作业均成功，Pages 地址返回 200。
2. 该地址加载图像和脚本没有 404，触控与电脑均可确认成年并开始。
3. 站点作用域正确、离线缓存安装成功；首次完整加载后断网重开。
4. 存档可导出并在另一浏览器导入。真实安卓设备需另做设备验收，不能只依靠桌面模拟。

## v1.1 自动配置与下载

当前工作流在构建、测试、打包后先上传Actions下载产物与Release附件，再部署Pages。网页ZIP还会直接随源码提交在downloads目录，因此无需依赖工作区下载链接。

部署作业使用仓库工作流令牌尝试创建Pages，或把现有站点改为workflow构建；失败时保留GitHub返回的原因。report作业独立执行，将结果写入codex-pages-status分支的deployment.json，包含对应源SHA、构建／部署状态、实际page_url、Actions运行链接和失败原因。只有与当前源SHA匹配的success才能作为本次部署证据。

CI配置行为是在用户所选仓库中执行正常发布，不会将凭据放进网页、ZIP或状态分支。应用运行不需要任何GitHub令牌。当前云环境对管理API的网络拦截与GitHub工作流自己的发布权限分别判断，不再因为本机打不开API就直接让用户手动搬运源码。


已观测到的v1.1结果：构建和Release上传成功，但首次创建Pages返回403 Resource not accessible by integration。当前需要仓库所有者在上述Pages设置启用GitHub Actions来源。等待该状态变化后再重跑，不把重复运行当作权限修复。
