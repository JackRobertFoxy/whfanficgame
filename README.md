# 静室 · A Quiet World — 叙事重写版 v1.2

卡斯蒂安视角的2D点击式心理恐怖游戏，Phaser 3 + TypeScript + Vite。基于用户提供的《Warhammer 40k Fanfic Setup.pdf》，现代与过去双线交错；抽象无脸人物，过去阿斯塔特全封闭头盔。

## 当前发布状态

**已上线：[直接游玩《静室》](https://jackrobertfoxy.github.io/whfanficgame/)**。电脑和安卓浏览器共用此地址。v1.2工作流41233000132已构建、发布成功；线上检查确认新版脚本、三个新场景与全头盔立绘可访问。详见[验证文档](docs/VALIDATION.md)。首次进入请等待素材加载；确认成年后开始。

![过去线与全封闭头盔人物](screenshots/past-line.png)

[电脑解密界面](screenshots/computer.png) · [安卓手机界面](screenshots/android-phone.png) · [返家场景与长文](screenshots/android-homecoming.png)

## 下载与游玩

- [GitHub仓库内完整网页包](downloads/quiet-world-web-v1.2.zip)：进入文件页后选择下载原始文件。
- [Release页面](https://github.com/JackRobertFoxy/whfanficgame/releases/tag/web-v1.2)：自动工作流成功后提供同一网页包。
- [在线游玩](https://jackrobertfoxy.github.io/whfanficgame/)：电脑与安卓浏览器使用同一网址。
- [自动部署状态分支](https://github.com/JackRobertFoxy/whfanficgame/tree/codex-pages-status)：工作流完成后生成，含实际结果及错误。

静态网页包供HTTP/HTTPS托管，不能只双击HTML运行。线上电脑与安卓浏览器使用同一网址；支持首次完整缓存后的离线游玩和添加到桌面，不是原生APK。源码与网页包均推送到本仓库，当前版本已由Pages发布并完成线上资源检查。

## 本版内容

十五章：病房 → 泰坦军械间 → 旧囚室 → 返家与热汤 → 床头灯 → 两天期限 → 提图斯公寓 → 卧室排练 → 医生会面 → 等候电话 → 被接回 → 战舰医疗舱 → 订婚相册 → 模型广告 → 安宁。

30枚双认知碎片、65个互动点、三个收尾。场景与对白正文32,674字符（不含档案与收尾长文），旧版同口径13,228字符；真人阅读时长尚未测量。写法改为贴近人物的第三人称，动作、环境、误解与对话完整展开。

卡斯蒂安真心喜欢现代萨拉马斯。他隐瞒旧世界来历、学习现代常识，是怕被认出并失去眼前的安宁。现代人对他的反常平静感到恐惧；这是本篇心理悬疑的核心。旧版独立／坦白／提出界限的主线已撤下，不能作为续写依据。

四种小游戏：沉思者线路、救援记录排序、订婚相册解锁、手机联系萨拉马斯。现代设备由其他角色代操作，玩家决定查什么、输入什么；方向键／A、D或触控按钮移动陪同者，只有受伤前的军械间回忆能移动完整身体的卡斯蒂安。

自动／手动存档、JSON导入导出、最近400条旅程回看、小游戏部分进度保存与手机大字模式均保留。新版存档v4；读取v1—v3时只带入字号与减弱效果，从新版病房重新开始，原旧存档键保留。

## 运行与构建

Node 22.12+ 或24，npm。

```sh
npm ci
npm run dev
npm test
npm run build
npm run package
```

构建同时生成完整离线资源清单与service worker。打包输出 `release/quiet-world-web-v1.2.zip` 并同步到仓库的 `downloads/`。GitHub Actions会先发布下载附件，再尝试自动启用和部署Pages，即使Pages权限失败，下载包仍独立提供。

```sh
npm run preview -- --port 4173
# 另一终端；生产根目录验证
DEMO_URL=http://127.0.0.1:4173/ npm run test:e2e
```

浏览器测试默认使用 `/usr/bin/chromium` 与本机 `/whfanficgame/` 子路径，可用 `CHROMIUM_PATH`、`DEMO_URL` 改写。`E2E_TARGET=desktop`／`android` 可分别运行。触控模拟不是安卓真机验收。

## 文档与边界

- [完整主线剧本](docs/SCRIPT_V1_2.md) · [原作页码与人物关系](docs/NARRATIVE_V1_2.md)
- [当前设计](docs/GDD.md) · [十五章流程](docs/SCENE_FLOW.md) · [数据模型](docs/DATA_MODEL.md)
- [当前验证与发布结果](docs/VALIDATION.md)
- [部署说明](docs/DEPLOYMENT.md)
- [项目目录](docs/PROJECT_STRUCTURE.md)
- [角色美术说明](public/art/ART_NOTES.md)

现代主角失去四肢，转移始终依赖协助。游戏不包含战斗练级、云账号、配音或原生APK。角色移动是纸片式动画，不是骨骼动画。原PDF不打包、不外传，运行时没有外部图片、字体、AI或真实短信服务。
