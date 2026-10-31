> 当前版本已升级为扩展篇v1.1（十二章、24碎片、存档v3）。本文件保留v1.0基线；当前变更见 [扩展设计](EXPANSION_V1_1.md)。

# 完整篇项目目录

```text
whfanficgame/
├── .github/workflows/pages.yml  # main 分支的 Pages 构建与部署
├── README.md
├── package.json / package-lock.json
├── vite.config.ts              # 相对路径与 Phaser 分包
├── tsconfig.json
├── index.html
├── public/
│   ├── manifest.webmanifest    # 安卓／桌面 PWA
│   ├── icons/                  # 192／512 应用图标
│   └── art/                    # 七个 SVG 场景、四名无脸角色、来源说明
├── src/
│   ├── main.ts                 # 入口、对话、阅读、存档操作、面板
│   ├── style.css               # 独立纸雕风 UI、触控与大字适配
│   ├── types.ts
│   ├── data/story.json         # 七章、34 关注点、15 碎片、分支与结尾
│   ├── game/RoomScene.ts       # Phaser 场景、角色、热点与演出
│   └── systems/
│       ├── state.ts            # 流程、条件对白、重构、记录与后日谈
│       ├── storage.ts          # v2 校验、v1 迁移、存读档
│       ├── assets.ts           # GitHub Pages 子路径资源
│       ├── web.ts              # PWA 注册与安装提示
│       ├── audio.ts
│       └── state.test.ts       # 11 项自动测试
├── scripts/
│   ├── create-art.py           # 重生成七个场景
│   ├── icons.mjs               # 本机浏览器渲染应用图标
│   ├── offline.mjs             # 构建后生成离线清单与 service worker
│   ├── package.mjs             # 静态网页 ZIP
│   ├── effects.mjs             # 恐怖效果与音效开关验证
│   └── smoke.mjs               # 桌面＋安卓触控模拟完整通关和离线回归
└── docs/
    ├── GDD.md
    ├── SCENE_FLOW.md
    ├── DATA_MODEL.md
    ├── PROJECT_STRUCTURE.md
    ├── DEPLOYMENT.md
    └── VALIDATION.md
```

生成且忽略：node_modules、dist、test-results、release。原 PDF 不随网页发布；网页不包含密钥或第三方运行时服务。
