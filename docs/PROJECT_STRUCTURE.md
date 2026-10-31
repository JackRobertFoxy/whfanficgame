# 项目目录 · v1.2

```text
whfanficgame/
├── .github/workflows/pages.yml  # 构建、下载附件、Pages与远端结果回执
├── README.md
├── package.json / package-lock.json
├── vite.config.ts              # 相对路径、Phaser分包
├── public/
│   ├── art/                    # 15个场景SVG、抽象人物与全头盔PNG
│   ├── icons/
│   └── manifest.webmanifest
├── src/
│   ├── main.ts                 # 入口、对白、档案、阅读与暂停操作
│   ├── style.css
│   ├── types.ts
│   ├── data/story.json         # 生成后的15章、65互动点、30碎片与收尾
│   ├── game/RoomScene.ts       # Phaser人物移动、热点与恐怖演出
│   ├── ui/puzzleWindow.ts      # 四种小游戏、设备窗口与代操作说明
│   └── systems/
│       ├── state.ts / state.test.ts
│       ├── storage.ts          # v4校验与旧剧情隔离
│       ├── puzzles.ts / puzzles.test.ts
│       ├── assets.ts / web.ts
│       └── audio.ts
├── scripts/
│   ├── narrative/              # 手写分章稿、碎片与条件回声
│   │   └── rewrite-v12.py      # 生成运行时JSON并输出实际正文统计
│   ├── create-art.py           # 重生成SVG，保留人物PNG
│   ├── offline.mjs             # 内容摘要、资源清单与service worker
│   ├── package.mjs             # 静态ZIP与仓库downloads副本
│   ├── smoke.mjs               # 电脑／Pixel7全流程
│   ├── movement.mjs / effects.mjs
│   └── icons.mjs
├── downloads/quiet-world-web-v1.2.zip
├── docs/                       # 当前设计、原作对应、流程、数据与验收
│   └── history/                # 历史验收，不作为当前剧情依据
├── screenshots/
├── dist/                       # 构建产物，不跟踪
├── release/                    # 本地打包输出，不跟踪
└── test-results/               # 本地测试截图，不跟踪
```

修改文本应改 `scripts/narrative/0*.py` 后生成JSON。原PDF仅作私有参考，不复制到发布目录；剧情依据优先阅读 [NARRATIVE_V1_2.md](NARRATIVE_V1_2.md)。
