> 当前版本已升级为扩展篇v1.1（十二章、24碎片、存档v3）。本文件保留v1.0基线；当前变更见 [扩展设计](EXPANSION_V1_1.md)。

# 完整篇数据结构 · 存档 v2

权威定义：[src/types.ts](../src/types.ts)。剧情：[src/data/story.json](../src/data/story.json)。七章、15 碎片、34 关注点。

## 场景与交互

```ts
type SceneId = 'hospital'|'corridor'|'living'|'bedroom'|'assessment'|'penthouse'|'rift';
interface StoryScene {
 id: SceneId; title: string; subtitle: string; chapter: string;
 intro: string[]; objects: Hotspot[]; goal: string;
 time: string; nextLabel: string;
 actor: 'castian'|'titus'|'doctor'|'thalamas'|'none';
}
interface Hotspot {
 id: string; name: string; x: number; y: number; // 归一化坐标
 objective: string[]; subjective: string[];
 fragment?: string; dialogue?: string; effect?: boolean;
}
```

Phaser 负责背景、人物、空间热点、色调和镜头；DOM 提供物件列表、触控按钮、对白、选项、档案和存档操作。两种点击入口经过同一事件处理，不存在手机版漏掉某个细小热点的专用路径。

每章关键物件观察完成后按 ID 唯一发放碎片，收齐本章碎片后开启对白；对白完成后允许转场。最后一章还要求全 15 碎片和重构成功。

## 条件对白与选择

```ts
interface DialogueNode {
 speaker: string; text: string; choices?: Choice[];
 condition?: 'allFragments'|'preludeComplete';
 ifFlag?: string; unlessFlag?: string;
}
interface Choice {
 label: string; response: string; flag?: string;
 ending?: 'voice'|'stay'|'mask';
}
```

`eligible()` 解析条件。`ifFlag`／`unlessFlag` 使会面、返回公寓与最终陈述回应玩家先前的选择，避免两种互斥文本同时出现。`preludeComplete` 表示卧室的预约／照片已观察；`allFragments` 是通用全碎片条件。

`decisions` 以 `dialogueId.原始节点下标` 为键保存选项文字。因为使用过滤前原始下标，条件节点增减不会改变该次选择的定位。回看旧对白只播放已经选过的回应；末段结局选择可重选。新增节点会影响下标，后续改动应升级版本或提供迁移。

稳定标记包括 `trust / boundary`、`disclosed / private`、`asserted / contact` 等，不是善恶值。后日谈 `epilogue()` 还读取是否向医生透露记忆、是否向萨拉马斯提出界限。

## 记忆

`Fragment` 包含 ID、标题、来源场景、锚点、客观／主观文本和 PDF 页码定位。十五枚 ID：

`pulse, name, witness, badge, threshold, ordinary, care, appointment, childhood, consent, record, careplan, terms, model, self`。

重构答案：`[witness, ordinary, model]`，分别是过去的声音、现在的证据、尚未回答的问题。需要在裂隙、全部碎片已收集，分类不会消耗记忆。

## 存档

```ts
interface GameState {
 version: 2;
 scene: SceneId;
 perspective: 'objective'|'subjective';
 visited: SceneId[];
 fragments: string[]; inspected: string[]; talked: string[]; flags: string[];
 reconstruction: (string|null)[];
 reconstructed: boolean;
 ending: 'voice'|'stay'|'mask'|null;
 settings: {audio:boolean; reducedEffects:boolean; textSize:'normal'|'large'};
 savedAt: number|null;
 decisions: Record<string,string>;
 transcript: {speaker:string;text:string}[];
}
```

新键 `quiet-world.save.v2`；读取时优先新键，缺失才尝试旧键 `quiet-world.save.v1`。旧档迁移保留可识别碎片、观察、对白与标记，定位到新增主线的首个未完成场景；重构／结尾重新开放，原旧档不删除。

校验版本、ID 白名单、数组唯一性、结尾与重构条件、选项指针、设置、时间戳和最多 400 条记录。导入限制 2 MB，需玩家二次确认后覆盖当前进度；无效文件不改变当前状态。内容渲染转义，不能把导入的文字当 HTML 执行。

存档保存稳定进度而非展开中的阅读光标。中途加载后重新点击该互动从开头阅读；已选选项维持原结果。成年确认不由存档控制。读档后声音关闭，本次减弱效果优先。

## 网站与离线

- `assets.ts` 基于 Vite 的相对 base 解析资源，用于 GitHub Pages 子路径。
- `web.ts` 注册生产版 service worker 与安装提示；没有提示事件时给出安卓浏览器菜单路径。
- `scripts/offline.mjs` 在生产构建后计算内容摘要，写出完整资源清单与 service worker。
- 每个站点路径使用自己的缓存前缀；安装预存整篇资源，完整成功后才通知离线就绪。
- 页面导航联网优先、离线返回缓存入口；静态资源缓存优先。新缓存接管后仅清除本站旧版本。
- 不使用强制 `skipWaiting`，不在玩家阅读过程中强制刷新或丢失内存进度。
