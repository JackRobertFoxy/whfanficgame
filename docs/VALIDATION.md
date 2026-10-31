# v1.2 验证记录

2026-10-31 UTC，本次云实例；Node24.19.0、npm11.9.0、系统Chromium。原作剧情依据见 [叙事重写说明](NARRATIVE_V1_2.md)，历史v1.0／v1.1记录已移到 [历史验收](history/VALIDATION_V1_1.md)。

## 本机已执行

| 检查 | 结果 |
| --- | --- |
| `npm test` | 13项状态／存档／剧情约束＋3项设备逻辑，共16通过，0失败／跳过 |
| `npm run package` | TypeScript、Vite、31项离线资源清单及ZIP成功生成 |
| 桌面Chromium全流程 | 十五章、三十碎片、四小游戏错误／正确路径、半途关闭保留、双认知、三个收尾、导入导出、回看与断网刷新通过 |
| Pixel7安卓触屏模拟 | 相同十五章全程点按，选择另一组对白与收尾，设备、读档、大字模式与离线恢复通过 |
| 人物与移动布局 | 军械间主角移动后停在陪同者左侧；四种手机设备面板无横向溢出 |
| 恐怖与音频 | 非减弱模式有演出，减弱模式关闭；主动开声后AudioContext运行，关闭后挂起 |
| 剧情数据 | 所有引用、条件标记与十五个场景素材存在；新版没有旧主线的坦白／界限／查证标记 |
| 最终构建专题回归 | v3旧档提示与保留、v4剧情隔离、第三人称旁白、安卓长文／新卧室、萨拉马斯操作相册通过 |
| 发布ZIP | ZIP CRC校验通过，入口／脚本／清单／新场景／三张全头盔PNG齐全，无PDF |

完整流程命令为 `npm run test:e2e`，默认指向本机 `/whfanficgame/` 子路径。人物／设备布局为 `node --import tsx scripts/movement.mjs`，效果为 `node scripts/effects.mjs`。最终文字润色与物件目标名称调整后，另以 `node --import tsx scripts/narrative-smoke.mjs` 检查最终构建的旧档提示、v4隔离、旁白、安卓长文与相册。

网页包：`downloads/quiet-world-web-v1.2.zip`，17,461,597字节。SHA-256：`a1130f41fa696c64dc13dfc0a45c665b0e7175b041a0a1a081ac662b51ab8a51`。该包与发布站点使用同一生产构建，包含31项离线资源。

## 发布结果

源码与仓库下载包已上传main，发布源提交：`8e8d47a0acf8579e0c89111dbfe00935ae27eef4`。

GitHub工作流 [41233000132](https://github.com/JackRobertFoxy/whfanficgame/actions/runs/41233000132) 对应同一源SHA的回执为：`build_status=success`、`deploy_status=success`、`http_status=200`、`assets_ok=true`。build作业已完成测试、打包与 `web-v1.2` Release附件上传；deploy作业已发布并读取线上文件。

实际站点：[直接游玩v1.2](https://jackrobertfoxy.github.io/whfanficgame/?v=1.2)。[下载Release网页包](https://github.com/JackRobertFoxy/whfanficgame/releases/download/web-v1.2/quiet-world-web-v1.2.zip)。仓库的downloads目录也保存相同版本的本机校验副本。

线上检查覆盖HTML、脚本、样式、离线清单、三个新增场景与三张全头盔PNG，并确认主要JS包含v1.2标识。最终回执由Git读取 `codex-pages-status` 分支确认。后续只补充文档的提交使用skip ci，不重复部署，也不把文档提交冒充发布源。

## 实际限制

安卓为桌面Chromium的Pixel7触屏模拟，没有安卓真机验证。未做真人阅读计时与听感评估；正文字符统计不能作为游玩时长。Phaser仍有大于500kB的构建体积提示，构建成功。人物为有限纸片移动，不是骨骼动画；网页和PWA不等于APK。

云执行器不能直接访问Pages公网域名与GitHub管理API。线上资源检查由部署作业执行，本机交互验证使用相同生产站点子路径；不冒充在公网进行过完整浏览器通关。
