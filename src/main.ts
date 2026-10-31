import './style.css';
import {mountPuzzle} from './ui/puzzleWindow';
import {puzzleNames} from './systems/puzzles';
import {RoomScene,createGame} from './game/RoomScene';
import {story, freshState, requirements, canEnter, moveTo, sceneOrder, addUnique, reconstruct, localFragments, fragmentCount, eligible, remember, epilogue} from './systems/state';
import {loadGame,saveGame,AGE_KEY,parseSave} from './systems/storage';
import {asset} from './systems/assets';
import {registerOffline,installApp} from './systems/web';
import {Soundscape} from './systems/audio';
import type {DialogueNode,GameState,Hotspot,Perspective,Choice,EndingId} from './types';

const $=<T extends HTMLElement=HTMLElement>(s:string):T=>document.querySelector<T>(s)!;
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const paragraphs=(s:string)=>s.split('|').map(t=>`<p>${esc(t)}</p>`).join('');
let state:GameState=freshState();
let room:RoomScene|undefined;
let playing=false,modalOpen=false,accepted=false,activeObject:Hotspot|undefined;
let activeDialogue='';
let sequence:DialogueNode[]=[],cursor=0,onFinish:(()=>void)|undefined,pendingChoice:Choice|undefined;
let returnFocus:HTMLElement|null=null;
const sound=new Soundscape();
const app=$('#app');
app.innerHTML=`
<div id="gate" class="gate">
  <div class="gate-art" aria-hidden="true"></div><div class="gate-shade"></div>
  <div class="gate-brand"><img src="${asset('art/sigil.svg')}" alt=""/> STILL ROOM ARCHIVE <span>叙事档案 / 001</span></div>
  <main class="gate-card">
    <p class="eyebrow">A QUIET WORLD · INTERACTIVE FICTION</p>
    <h1>静<span>室</span><i>。</i></h1>
    <p class="gate-tagline">他们记得你。<br/>可他们记得的，不是你。</p>
    <div class="content-note"><span>18+</span><div><strong>仅限成年玩家</strong><p>本作涉及囚禁、严重身体伤害的回忆、控制关系、创伤与身份错位。采用非露骨叙事，无色情画面。含轻微闪光、短暂幻视与音效变化，可关闭。</p></div></div>
    <label class="check"><input id="adult" type="checkbox"/> 我确认已年满 18 周岁，并愿意接触上述主题。</label>
    <label class="check quiet"><input id="gate-reduce" type="checkbox"/> 减弱恐怖效果（关闭闪光、抖动与幻视）</label>
    <div class="gate-actions"><button id="enter" class="primary" disabled>进入故事 <span>↗</span></button><button id="decline" class="text-button">我未满 18 岁 / 离开</button></div>
    <p class="gate-foot">卡斯蒂安的故事 · 点击式心理恐怖 · 扩展篇 v1.1<br/>建议佩戴耳机，音效默认关闭。含现代／过去双线与设备解密，随时可暂停。</p>
  </main><div class="gate-orbit" aria-hidden="true"><i></i><i></i><i></i></div><div class="gate-corner">一扇门。两个世界。<br/><span>AN UNOFFICIAL FAN GAME</span></div>
</div>
<div id="shell" hidden>
  <header class="topbar"><a class="brand" href="#" aria-label="静室，打开暂停菜单"><img src="${asset('art/sigil.svg')}" alt=""/><strong>静室<span> A QUIET WORLD</span></strong></a><div class="top-tools"><span class="prototype">扩展篇 / v1.1</span><button id="audio" title="切换音效">声音：关</button><button id="backlog">回看</button><button id="settings">设置 / 暂停</button><button id="save">存档</button><button id="load">读档</button></div></header>
  <div class="workspace"><aside class="sidebar"><div class="subject"><span class="eyebrow">SUBJECT / 001</span><h2>卡斯蒂安</h2><p>这一次，讲述的人是你。</p><div class="status"><span class="status-dot"></span>意识连接中 <span id="world-time">21:04</span></div></div>
    <div class="side-section"><p class="eyebrow">CURRENT OBJECTIVE</p><h3>当前要做的事</h3><p id="objective"></p><ul id="requirements"></ul></div>
    <div class="side-section fragments-side"><div class="section-title"><p class="eyebrow">MEMORY ARCHIVE</p><span id="fragment-count">00 / 15</span></div><button id="memory" class="archive-button">记忆档案 <span>↗</span></button><div id="recent-memories"></div></div>
    <div class="sidebar-bottom"><span class="little-sigil">⌑</span><p>看见的事物没有改变。<br/>改变的是它们的名字。</p><button id="help" class="text-button">操作与人物说明 ↗</button></div></aside>
    <main class="play-area"><div class="scene-heading"><div><p id="chapter" class="eyebrow"></p><h2 id="scene-name"></h2></div><div class="perspective" role="group" aria-label="认知视角"><button id="objective-view" aria-pressed="true">现实记录</button><button id="subjective-view" aria-pressed="false">我的认知</button></div></div>
    <div id="stage" class="stage"><div id="game" aria-label="点击场景中的发光标记进行观察"></div><div class="film-lines" aria-hidden="true"></div><div class="stage-top"><span id="scene-caption"></span><span class="recording">● <span id="view-label">REALITY RECORD</span></span></div><div class="stage-bottom"><span>点击标记观察 · 也可使用下方物件列表</span><span id="scene-number">01 / 07</span></div><div id="loading">正在建立场景…</div></div>
    <div class="movement-bar"><span id="movement-label">指示陪同者靠近物件</span><div><button id="move-left" aria-label="向左移动">← 向左</button><button id="move-right" aria-label="向右移动">向右 →</button></div><small>方向键 / A、D · 画布空地可点选位置</small></div><div id="object-list" class="object-list" role="group" aria-label="可交互物件"></div>
    <section id="dialogue" class="dialogue" aria-label="叙事与对话" aria-live="polite"><button id="portrait-preview" class="portrait" aria-label="查看角色完整立绘"><img id="portrait" src="${asset('art/castian.png')}" alt="卡斯蒂安半身像"/><span id="portrait-code">C / 001</span></button><div class="dialogue-body"><div class="dialogue-meta"><strong id="speaker">卡斯蒂安</strong><span id="dialogue-mode">内心独白</span><span id="line-counter"></span></div><div id="text"></div><div id="choices" class="choices"></div><div class="dialogue-footer"><span id="dialogue-hint"></span><button id="advance" class="text-button" hidden>继续 <span>→</span></button></div></div></section>
    <nav class="route" aria-label="场景流程"><div id="route-stops"></div><button id="next-scene" class="primary" disabled>请求转移 →</button></nav>
    <p class="local-note">进度仅保存在当前浏览器 · 选择不计善恶 · Esc 暂停 · M 记忆 · V 切换认知</p>
    </main></div>
</div>
<dialog id="modal" aria-labelledby="modal-title"><div class="modal-top"><span class="eyebrow" id="modal-kicker">ARCHIVE</span><button id="close-modal" aria-label="关闭面板">关闭 ×</button></div><h2 id="modal-title"></h2><div id="modal-content"></div></dialog>
<div id="toast" role="status" aria-live="polite"></div>
`;
const reducedDefault=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
$<HTMLInputElement>('#gate-reduce').checked=reducedDefault;
$<HTMLInputElement>('#adult').onchange=()=>{$<HTMLButtonElement>('#enter').disabled=!$<HTMLInputElement>('#adult').checked;};
$('#decline').onclick=()=>{
  $('.gate-card').innerHTML='<p class="eyebrow">SESSION CLOSED</p><h1>止步<span>于此</span></h1><p class="gate-tagline">故事尚未开始。</p><p>你可以安全地关闭这个页面。未加载游戏，也没有播放声音。</p><button id="back-gate" class="text-button">返回年龄确认 →</button>';
  $('#back-gate').onclick=()=>location.reload();
};
$('#enter').onclick=()=>{
  if(!$<HTMLInputElement>('#adult').checked)return;
  accepted=true;
  try{sessionStorage.setItem(AGE_KEY,'yes');}catch{/* Still require consent next time. */}
  state.settings.reducedEffects=$<HTMLInputElement>('#gate-reduce').checked;
  $('#gate').hidden=true;$('#shell').hidden=false;
  room=new RoomScene(inspect,()=>{$('#loading').hidden=true;});createGame($('#game'),room);
  applySettings();render();
  openModal('开始之前','PROLOGUE',`<p class="lead">你是卡斯蒂安。这里的人都认得你，<br/>你却不记得他们口中的那个人。</p><p>你记得自己是灰骑士——一个在遥远未来对抗恶魔的战士。如今，你在现代城市醒来，拥有同名警察的身份，身体行动需要他人协助。</p><p>点击场景中的标记，或下方物件名称来观察。切换视角，对照现实记录与主观记忆。收集碎片、完成对话，再前往下一个场景。</p><p>本篇有十二章，穿插现代与过去两条时间线，包含电脑、手机、沉思者接线与记录排序小游戏。现代场景由其他角色代操作设备；出征前的回忆中，卡斯蒂安可以穿着动力甲移动。不需要了解战锤背景；术语会在剧情与人物说明中解释。游戏不会要求你替卡斯蒂安证明创伤是否真实。</p><div class="modal-actions"><button id="begin" class="primary">从病房醒来 →</button><button id="continue-save">读取本地进度</button></div><p class="small">新故事不会立即覆盖已有存档；首次完成互动后会自动保存。读档将保留刚选择的减弱效果设置。</p>`);
  $('#begin').onclick=()=>{closeModal();intro();};
  $('#continue-save').onclick=()=>readSave();
};
function notice(message:string):void {
  $('#toast').textContent=message;$('#toast').classList.add('visible');
  window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('#toast').classList.remove('visible'),4200);
}
let toastTimer=0;
function persist(manual=false):void {
  const result=saveGame(state);
  if(result.ok){state.savedAt=result.state.savedAt;if(manual)notice('已保存。进行中的观察或对话将在读档后从头开始。');}
  else notice(result.message);
}
function applySettings():void {
  document.body.classList.toggle('reduced',state.settings.reducedEffects);
  document.body.classList.toggle('large-text',state.settings.textSize==='large');
  sound.enable(state.settings.audio);$('#audio').textContent=`声音：${state.settings.audio?'开':'关'}`;
  syncRoom();
}
function syncRoom():void {
  room?.showRoom(state.scene,state.perspective,state.inspected,state.settings.reducedEffects);
  room?.setPresentationPaused(modalOpen);
  if(room?.input)room.input.enabled=!playing&&!modalOpen&&!state.ending;
}
function setView(view:Perspective):void {
  state.perspective=view;
  $('#objective-view').setAttribute('aria-pressed',String(view==='objective'));
  $('#subjective-view').setAttribute('aria-pressed',String(view==='subjective'));
  $('#view-label').textContent=view==='objective'?'REALITY RECORD':'CASTIAN’S PERCEPTION';
  $('#stage').classList.toggle('subjective',view==='subjective');
  syncRoom();
  if(activeObject)showObjectText();
}
$('#objective-view').onclick=()=>setView('objective');
$('#subjective-view').onclick=()=>setView('subjective');
function scene(){return story.scenes.find(s=>s.id===state.scene)!;}
function render():void {
  const s=scene(),index=sceneOrder.indexOf(s.id),missing=requirements(state,s.id);
  document.body.dataset.era=s.era;
  $('#movement-label').textContent=s.id==='past_armoury'?'移动回忆中的卡斯蒂安（受伤前）':s.era==='past'?'移动回忆中的陪同人物':'指示陪同者移动 · 卡斯蒂安需要协助';
  for(const id of ['#move-left','#move-right'])$<HTMLButtonElement>(id).disabled=playing||!!state.ending;
  $('#scene-name').textContent=s.title;$('#chapter').textContent=s.chapter;$('#scene-caption').textContent=s.subtitle;
  $('#scene-number').textContent=`${String(index+1).padStart(2,'0')} / ${story.scenes.length}`;$('#world-time').textContent=s.time;
  $('#objective').textContent=s.goal;
  $('#requirements').innerHTML=missing.length?missing.map(m=>`<li>${esc(m)}</li>`).join(''):'<li class="done">本章关键步骤已完成</li>';
  $('#fragment-count').textContent=`${String(state.fragments.length).padStart(2,'0')} / ${fragmentCount}`;
  $('#recent-memories').innerHTML=state.fragments.slice(-3).reverse().map((id)=>{
    const f=story.fragments.find(f=>f.id===id)!;return `<button class="memory-mini" data-fragment="${id}"><span>◇</span><div>${esc(f.title)}<small>${esc(f.foundAt)}</small></div></button>`;
  }).join('')||'<p class="empty-note">碎片会留在这里。<br/>先看一看你周围的东西。</p>';
  document.querySelectorAll<HTMLButtonElement>('[data-fragment]').forEach(b=>b.onclick=()=>memoryPanel(b.dataset.fragment));
  $('#object-list').innerHTML=s.objects.map((o,i)=>`<button data-object="${o.id}" ${playing||state.ending?'disabled':''} class="${state.inspected.includes(o.id)?'observed':''}"><span>${String(i+1).padStart(2,'0')}</span>${esc(o.name)}${state.inspected.includes(o.id)?' ·':''}</button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-object]').forEach(b=>b.onclick=()=>inspect(s.objects.find(o=>o.id===b.dataset.object)!));
  $('#route-stops').innerHTML=story.scenes.map((s,i)=>`<button data-scene="${s.id}" ${!canEnter(state,s.id)||playing||state.ending?'disabled':''} class="${s.id===state.scene?'active':''}" ${s.id===state.scene?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span>${s.title}</button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach(b=>b.onclick=()=>changeScene(b.dataset.scene as GameState['scene']));
  const next=$<HTMLButtonElement>('#next-scene');
  next.disabled=playing||(s.id==='rift'?false:missing.length>0);
  next.textContent=state.ending?'回看结尾 →':s.id==='rift'?(state.reconstructed?'继续最后的谈话 →':'重构记忆 →'):s.nextLabel+' →';
  setView(state.perspective);syncRoom();
}
function intro():void {
  const s=scene();start(s.intro.map(text=>({speaker:'卡斯蒂安',text})),()=>idle());
}
function idle():void {
  $('#speaker').textContent='卡斯蒂安';$('#dialogue-mode').textContent='此刻';$('#line-counter').textContent='';
  $('#text').innerHTML=paragraphs(scene().subtitle+'|'+(requirements(state,state.scene).length?'观察周围的标记，找一个能说清楚的东西。':state.scene==='rift'?'记忆已经留在档案里。下一句话，由你决定。':scene().era==='past'?'这一段回忆已经核对完，可以继续故事，也可以再看一次场景里的物件。':'现在，你可以请求转移，也可以留下来再看一会儿。'));
  portrait('卡斯蒂安');$('#advance').hidden=true;$('#choices').innerHTML='';$('#dialogue-hint').textContent='视线可以停留，故事不催促你。';
}
function portrait(speaker:string):void {
  const ids:Record<string,string>={'提图斯':'titus','医生':'doctor','萨拉马斯':'thalamas'};
  let id=ids[speaker]??'castian';
  if(speaker==='过去的提图斯')id='titus-armour';
  if(speaker==='过去的萨拉马斯')id='thalamas-armour';
  if(speaker==='卡斯蒂安'&&scene().era==='past')id='castian-armour';
  const image=$<HTMLImageElement>('#portrait');
  image.src=asset(`art/${id}.png`);image.alt=`${speaker==='现实记录'?'卡斯蒂安':speaker}半身像`;
  image.classList.toggle('full-sprite',id==='titus'||id==='thalamas'||id.endsWith('-armour'));
  $('#portrait-code').textContent=({'titus':'T / 002','doctor':'D / 003','thalamas':'S / 004'} as Record<string,string>)[id]??'C / 001';
}
function start(nodes:DialogueNode[],finish?:()=>void):void {
  sequence=nodes.filter(n=>eligible(n,state));cursor=0;pendingChoice=undefined;onFinish=finish;playing=true;render();showLine();
}
function decisionKey():string {return activeDialogue?`${activeDialogue}.${story.dialogues[activeDialogue].indexOf(sequence[cursor])}`:'';}
function showLine():void {
  const node=sequence[cursor];
  if(!node){finishSequence();return;}
  $('#speaker').textContent=node.speaker;portrait(node.speaker);
  $('#dialogue-mode').textContent=node.speaker==='卡斯蒂安'?'内心独白 / 卡斯蒂安':`对话 / ${node.speaker}`;
  $('#line-counter').textContent=`${String(cursor+1).padStart(2,'0')} / ${String(sequence.length).padStart(2,'0')}`;
  $('#text').innerHTML=paragraphs(node.text);remember(state,node.speaker,node.text);
  $('#choices').innerHTML='';
  const hasChoices=!!node.choices?.length;
  $('#advance').hidden=hasChoices;$('#advance').textContent=cursor===sequence.length-1?'记住这些 →':'继续 →';
  $('#dialogue-hint').textContent=hasChoices?'选择会被记住；没有善恶评分。':'空格 / Enter 继续 · Esc 暂停';
  const previous=node.choices?.find(c=>c.label===state.decisions[decisionKey()]);
  if(previous&&!previous.ending){selectChoice(previous,true);return;}
  if(hasChoices)for(const choice of node.choices!){
    const b=document.createElement('button');b.textContent=choice.label;b.onclick=()=>selectChoice(choice);$('#choices').append(b);
  }
}
function selectChoice(choice:Choice,replay=false):void {
  const key=decisionKey();if(key)state.decisions[key]=choice.label;
  remember(state,'卡斯蒂安',choice.label+'|'+choice.response);
  if(choice.flag)addUnique(state.flags,choice.flag);
  if(!replay)persist();
  $('#choices').innerHTML='';$('#text').innerHTML=paragraphs(choice.response);$('#speaker').textContent='卡斯蒂安';portrait('卡斯蒂安');
  $('#dialogue-mode').textContent='这句话留在了房间里';pendingChoice=choice;$('#advance').hidden=false;$('#advance').textContent=choice.ending?'留在这个结尾 →':'继续 →';
}
function finishSequence():void {
  const callback=onFinish;activeDialogue='';playing=false;onFinish=undefined;sequence=[];activeObject=undefined;
  $('#advance').hidden=true;render();callback?.();
}
function inspect(o:Hotspot):void {
  if(playing||modalOpen||!accepted||state.ending)return;
  room?.approach(o.x*1600);
  if(o.puzzle){openDevice(o);return;}
  if(o.dialogue){
    if(o.dialogue==='finalTalk'&&!state.reconstructed){memoryPanel();notice('先在档案里完成三格重构。');return;}
    const missing=localFragments(state.scene).filter(f=>!state.fragments.includes(f));
    if(missing.length||scene().requiredPuzzles.some(p=>!state.puzzles[p].solved)){notice('先完成本章关键观察与设备小游戏，再进行角色对话。');return;}
    activeDialogue=o.dialogue;
    sound.cue('click');start(story.dialogues[o.dialogue],()=>{
      addUnique(state.talked,o.dialogue!);addUnique(state.inspected,o.id);persist();render();idle();
    });return;
  }
  playing=true;activeObject=o;cursor=0;render();showObjectText();
  sound.cue(o.effect?'horror':'click');if(o.effect)horror();
}
function openDevice(o:Hotspot):void {
  const id=o.puzzle!;
  openModal(puzzleNames[id],scene().era==='past'?'IMPERIAL TERMINAL / 过去线设备':'DEVICE SESSION / 代操作', '<div id="puzzle-root"></div>');
  $('#modal').classList.add('device-modal');
  mountPuzzle($('#puzzle-root'),id,state.puzzles[id],()=>persist(),()=>{
    addUnique(state.inspected,o.id);if(o.fragment)addUnique(state.fragments,o.fragment);
    remember(state,'设备记录',o.name+'已完成：'+o.objective.join('|'));
    sound.cue('memory');persist();render();
  },()=>{closeModal();render();idle();});
}
$('#move-left').onclick=()=>{if(!playing&&!modalOpen)room?.nudge(-1);};
$('#move-right').onclick=()=>{if(!playing&&!modalOpen)room?.nudge(1);};
function showObjectText():void {
  if(!activeObject)return;
  const o=activeObject,lines=o[state.perspective];cursor=Math.min(cursor,lines.length-1);
  $('#speaker').textContent=state.perspective==='objective'?'现实记录':'卡斯蒂安';portrait('卡斯蒂安');
  $('#dialogue-mode').textContent=o.name+' / '+(state.perspective==='objective'?'客观信息':'主观认知');
  $('#text').innerHTML=paragraphs(lines[cursor]);$('#line-counter').textContent=`${cursor+1} / ${lines.length}`;$('#choices').innerHTML='';
  $('#advance').hidden=false;$('#advance').textContent=cursor<lines.length-1?'继续观察 →':o.fragment&&!state.fragments.includes(o.fragment)?'收下这段记忆 ◇':'结束观察 →';
  $('#dialogue-hint').textContent='可随时切换上方「现实记录 / 我的认知」，比较两套文本。';
}
$('#advance').onclick=()=>advance();
function advance():void {
  if(!playing||modalOpen)return;
  if(activeObject){
    const o=activeObject;
    if(cursor<o[state.perspective].length-1){cursor++;showObjectText();return;}
    addUnique(state.inspected,o.id);remember(state,'观察 · '+o.name,o[state.perspective].join('|'));
    if(o.fragment&&!state.fragments.includes(o.fragment)){addUnique(state.fragments,o.fragment);sound.cue('memory');notice(`获得记忆：${story.fragments.find(f=>f.id===o.fragment)!.title}`);}
    activeObject=undefined;playing=false;persist();render();idle();return;
  }
  if(sequence[cursor]?.choices&&!pendingChoice)return;
  if(pendingChoice?.ending){const ending=pendingChoice.ending;pendingChoice=undefined;finishSequence();state.ending=ending;persist();render();endingPanel(ending);return;}
  pendingChoice=undefined;cursor++;showLine();
}
function horror():void {
  if(state.settings.reducedEffects)return;
  room?.horror();$('#stage').classList.remove('intrusion');void $('#stage').offsetWidth;$('#stage').classList.add('intrusion');
  setTimeout(()=>$('#stage').classList.remove('intrusion'),750);
}
function changeScene(id:GameState['scene']):void {
  if(playing||modalOpen||id===state.scene)return;
  const fresh=!state.visited.includes(id);
  if(!moveTo(state,id))return;
  persist();render();if(fresh)intro();else idle();
}
$('#next-scene').onclick=()=>{
  if(state.ending){endingPanel(state.ending);return;}
  if(state.scene==='rift'){if(state.reconstructed)inspect(scene().objects.find(o=>o.dialogue)!);else memoryPanel();return;}
  if(requirements(state,state.scene).length)return;
  changeScene(sceneOrder[sceneOrder.indexOf(state.scene)+1]);
};
function openModal(title:string,kicker:string,content:string):void {
  returnFocus=document.activeElement as HTMLElement;modalOpen=true;syncRoom();
  $('#modal').classList.remove('device-modal');
  $('#modal-title').textContent=title;$('#modal-kicker').textContent=kicker;$('#modal-content').innerHTML=content;
  if(!$<HTMLDialogElement>('#modal').open)$<HTMLDialogElement>('#modal').showModal();
}
function closeModal():void {
  $<HTMLDialogElement>('#modal').close();modalOpen=false;syncRoom();
  if(returnFocus?.isConnected)returnFocus.focus();
}
$('#close-modal').onclick=()=>{closeModal();if(!playing&&!$('#text').textContent)intro();};
$<HTMLDialogElement>('#modal').addEventListener('cancel',e=>{e.preventDefault();closeModal();if(!playing&&!$('#text').textContent)intro();});
function memoryPanel(selected?:string):void {
  const cards=story.fragments.filter(f=>state.fragments.includes(f.id));
  openModal('留在意识里的东西','MEMORY ARCHIVE / '+String(cards.length).padStart(2,'0')+' OF '+fragmentCount,`
    <p class="muted">碎片并不互相抵消。左侧是当下能确认的记录，右侧是卡斯蒂安的主观解释。</p>
    <div class="memory-grid">${cards.map(f=>`<article id="fragment-${f.id}" class="memory-card ${selected===f.id?'selected':''}"><p class="eyebrow">${esc(f.foundAt)}</p><h3>◇ ${esc(f.title)}</h3><div class="dual-copy"><div><span>现实记录</span><p>${esc(f.objective)}</p></div><div><span>我的认知</span><p>${esc(f.subjective)}</p></div></div><p class="source">原作定位：PDF 第 ${esc(f.source)} 页 · 互动改写</p></article>`).join('')||'<p>还没有收集碎片。先观察病房中的监护仪、身份卡和暗处。</p>'}</div>
    <section class="reconstruct"><p class="eyebrow">RECONSTRUCTION / 把三件事分开</p><h3>记得的事，知道的事，尚未回答的事。</h3><p>将「角落里的凡人」放入过去；将「这个世界的词」放入现在；将「塑料制成的战争」留在尚未回答的问题里。分类不会裁决记忆真假。</p><div class="slots">${['过去的声音','现在的证据','尚未回答的问题'].map((name,i)=>`<label><span>0${i+1} / ${name}</span><select data-slot="${i}" ${state.reconstructed?'disabled':''}><option value="">选择记忆碎片</option>${cards.map(f=>`<option value="${f.id}" ${state.reconstruction[i]===f.id?'selected':''}>${esc(f.title)}</option>`).join('')}</select></label>`).join('')}</div><p id="reconstruct-feedback" role="status">${state.reconstructed?'三种记录已经分开。回到门前，选择第一句陈述。':state.scene!=='rift'?'在记忆裂隙中完成最终重构。此刻可以先尝试归类。':cards.length<fragmentCount?'仍需找齐本篇全部记忆碎片。':'不必强迫它们给出同一个答案。'}</p><button id="reconstruct" class="primary" ${cards.length<fragmentCount||state.scene!=='rift'||state.reconstructed?'disabled':''}>确认重构 →</button></section>`);
  document.querySelectorAll<HTMLSelectElement>('[data-slot]').forEach(s=>s.onchange=()=>{state.reconstruction[Number(s.dataset.slot)]=s.value||null;});
  $('#reconstruct').onclick=()=>{
    if(state.scene!=='rift'||state.fragments.length!==fragmentCount)return;
    if(reconstruct(state)){sound.cue('memory');persist();render();memoryPanel();}
    else $('#reconstruct-feedback').textContent='再看看提示：罗伯特属于旧世界的过去；电脑是现代证据；模型广告留下身份问题。碎片没有消失，可以重新调整。';
  };
  if(selected)setTimeout(()=>document.getElementById(`fragment-${selected}`)?.scrollIntoView({block:'nearest'}),30);
}
$('#memory').onclick=()=>memoryPanel();
function settingsPanel():void {
  openModal('让房间安静一会儿','PAUSED / 随时可以停下',`
  <p>游戏已暂停。没有倒计时；打开面板时不会触发场景互动或恐怖演出。</p>
  <label class="check"><input id="setting-reduce" type="checkbox" ${state.settings.reducedEffects?'checked':''}/> 减弱恐怖效果（关闭闪光、幻视、抖动与轻微扭曲）</label>
  <label class="check"><input id="setting-audio" type="checkbox" ${state.settings.audio?'checked':''}/> 开启环境音与提示音（默认关闭，建议低音量）</label>
  <label class="check"><input id="setting-text" type="checkbox" ${state.settings.textSize==='large'?'checked':''}/> 放大正文文字（适合手机阅读）</label>
  <div class="modal-actions"><button id="export-save">导出存档文件</button><label class="file-button">导入存档文件<input id="import-save" type="file" accept="application/json,.json"/></label><button id="install">安装到桌面</button></div>
  <p id="offline-status" class="small"></p><p class="small">存档只保存在此浏览器。同一条观察或对话中途读档，将从该次互动的开头重新阅读。</p>
  <div class="modal-actions"><button id="resume" class="primary">继续故事 →</button><button id="restart">重新开始</button></div>`);
  $<HTMLInputElement>('#setting-reduce').onchange=()=>{state.settings.reducedEffects=$<HTMLInputElement>('#setting-reduce').checked;applySettings();};
  $<HTMLInputElement>('#setting-audio').onchange=()=>{state.settings.audio=$<HTMLInputElement>('#setting-audio').checked;applySettings();};
  $('#resume').onclick=()=>{persist();closeModal();};
  $<HTMLInputElement>('#setting-text').onchange=()=>{state.settings.textSize=$<HTMLInputElement>('#setting-text').checked?'large':'normal';applySettings();};
  $('#export-save').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='quiet-world-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('已导出进度。可在另一台设备上导入。');};
  $<HTMLInputElement>('#import-save').onchange=async()=>{
    const file=$<HTMLInputElement>('#import-save').files?.[0];if(!file)return;
    if(file.size>2_000_000){notice('存档文件太大，未导入。');return;}
    const imported=parseSave(await file.text());if(!imported){notice('无法识别或已损坏的存档。当前进度不变。');return;}
    openModal('导入这份进度？','IMPORT ARCHIVE',`<p>将恢复到「${esc(story.scenes.find(s=>s.id===imported.scene)!.title)}」。当前进度会被替换。</p><div class="modal-actions"><button id="confirm-import" class="primary">导入并恢复</button><button id="cancel-import">取消</button></div>`);
    $('#confirm-import').onclick=()=>{const reduced=state.settings.reducedEffects;state=imported;state.settings.audio=false;state.settings.reducedEffects=reduced;playing=false;activeObject=undefined;sequence=[];pendingChoice=undefined;activeDialogue='';persist();closeModal();applySettings();render();idle();if(state.ending)endingPanel(state.ending);};
    $('#cancel-import').onclick=()=>settingsPanel();
  };
  $('#install').onclick=async()=>notice(await installApp());
  $('#offline-status').textContent=navigator.onLine?'联网状态：在线。完整离线包准备好后会显示提示；首次打开请保持网络。':'联网状态：离线。已缓存的内容可以继续游玩。';
  $('#restart').onclick=()=>{
    openModal('重新开始？','NEW STORY','<p>将从病房重新开始。现有本地进度会在下一次自动存档时被覆盖；声音和减弱效果设置保留。</p><div class="modal-actions"><button id="confirm-restart" class="primary">重新开始</button><button id="cancel-restart">取消</button></div>');
    $('#cancel-restart').onclick=()=>settingsPanel();$('#confirm-restart').onclick=()=>{
      const settings=state.settings;state=freshState();state.settings=settings;playing=false;activeObject=undefined;pendingChoice=undefined;closeModal();applySettings();render();intro();
    };
  };
}
$('#portrait-preview').onclick=()=>{
  const image=$<HTMLImageElement>('#portrait');
  const title=image.alt.replace('半身像','');
  openModal(title,'CHARACTER PORTRAIT / 角色立绘',`<img class="portrait-large" src="${image.getAttribute('src')}" alt="${title}角色立绘"/><p class="small">AI 辅助生成 · 角色视觉原型。关闭后继续当前段落。</p>`);
};
$('#settings').onclick=settingsPanel;$('.brand').onclick=e=>{e.preventDefault();settingsPanel();};
$('#save').onclick=()=>persist(true);
$('#load').onclick=()=>{
  const loaded=loadGame();if(!loaded.ok){notice(loaded.message);return;}
  openModal('恢复本地进度？','LOAD ARCHIVE','<p>会结束当前尚未完成的观察或对话，并回到最近保存的状态。</p><div class="modal-actions"><button id="confirm-load" class="primary">恢复进度</button><button id="cancel-load">取消</button></div>');
  $('#confirm-load').onclick=()=>readSave();$('#cancel-load').onclick=()=>closeModal();
};
function readSave():void {
  const result=loadGame();if(!result.ok){notice(result.message);return;}
  const reduced=state.settings.reducedEffects;
  state=result.state;state.settings.reducedEffects=reduced;state.settings.audio=false;
  playing=false;activeObject=undefined;sequence=[];pendingChoice=undefined;onFinish=undefined;activeDialogue='';
  closeModal();applySettings();render();idle();notice('已恢复本地进度。');if(state.ending)endingPanel(state.ending);
}
$('#audio').onclick=()=>{state.settings.audio=!state.settings.audio;applySettings();notice(state.settings.audio?'音效已开启，可随时关闭。':'声音已关闭。');};
$('#help').onclick=()=>openModal('你不需要先了解另一个世界','FIELD GUIDE / 操作与人物',`
<div class="guide"><h3>如何游玩</h3><p>点击场景光点或物件列表查看内容；继续按钮或空格推进；上方切换现实 / 主观认知；M 打开记忆，V 切换认知，Esc 暂停。先找齐当前场景碎片，再与提图斯对话，随后请求协助转移。</p><h3>卡斯蒂安 / 主角</h3><p>他记得自己是灰骑士：遥远未来以对抗恶魔为职责的改造战士。现在，他在同名现代警察的身体里醒来。他失去四肢，场景转移依赖协助；你控制的是注意与表达。</p><h3>提图斯 / 两种经历中的同名者</h3><p>旧世界中的战友，与现代世界的警察拥有相同面孔。他们的行为与记忆不能直接互相证明。现代提图斯认识本地的卡斯蒂安。</p><h3>萨拉马斯 / 创伤背景中的控制者</h3><p>旧世界的施暴者，在现代对应为一个有权势、曾囚禁和伤害卡斯蒂安的男人。后来的照料不等于伤害已被抹去。</p><h3>罗伯特 / 前期回忆</h3><p>意外进入旧世界的凡人。他见证、也参与过伤害，之后死亡。他不出现在现代场景，不是本作主角。</p><h3>亚空间 / 沉思者</h3><p>亚空间是旧世界里与恶魔、灵能有关的异常领域；沉思者是那个世界的计算设备。这些是帮助理解记忆的术语，无需背诵。</p></div>`);
function endingPanel(id:EndingId):void {
  const endings={voice:['第一句自己的话','你把当下的恐惧说出了口。'],stay:['今晚的距离','你选择了陪伴，也保留了决定距离的权利。'],mask:['正确的词','你保留了自己的来历，决定明天再谈。']};
  openModal(endings[id][0],'CHAPTER CLOSED / 完整篇结局',`<p class="ending-mark">⌑</p><p class="lead">${endings[id][1]}</p><div class="epilogue">${epilogue(state,id).map(t=>`<p>${esc(t)}</p>`).join('')}</div><p class="muted">关于旧世界的全部答案仍未揭开，但这一篇从苏醒到陈述的旅程已经结束。结尾为互动改编，不是原作既定结局。</p><div class="ending-stats"><span>记忆碎片 <strong>${state.fragments.length} / ${fragmentCount}</strong></span><span>已完成章节 <strong>${state.visited.length} / ${story.scenes.length}</strong></span><span>做过的选择 <strong>${Object.keys(state.decisions).length}</strong></span></div><div class="modal-actions"><button id="review-end" class="primary">回看记忆</button><button id="retry-ending">重选最后一句话</button><button id="end-backlog">阅读旅程记录</button></div><p class="small">原作：用户提供的《Warhammer 40k Fanfic Setup.pdf》· 非官方同人游戏。无脸纸雕风人物为 AI 辅助生成，场景为原创矢量绘制，声音为本地合成。</p>`);
  $('#review-end').onclick=()=>memoryPanel();$('#end-backlog').onclick=()=>backlog();
  $('#retry-ending').onclick=()=>{state.ending=null;persist();closeModal();render();inspect(scene().objects.find(o=>o.dialogue)!);};
}
function backlog():void {
  openModal('已经说过的话','JOURNEY LOG / 旅程记录',`<p class="muted">保留最近四百条叙述。这里的回看不会改变选择。</p><div class="backlog">${state.transcript.map(t=>`<article><strong>${esc(t.speaker)}</strong>${paragraphs(t.text)}</article>`).join('')||'<p>故事还没有留下记录。</p>'}</div>`);
}
$('#backlog').onclick=backlog;
registerOffline(message=>notice(message));
document.addEventListener('keydown',e=>{
  if(!accepted || ['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))return;
  if(e.key==='Escape'&&!modalOpen){e.preventDefault();settingsPanel();return;}
  if(modalOpen)return;
  if(e.code==='Space'||(e.code==='Enter'&&(e.target as HTMLElement).tagName!=='BUTTON')){if(playing&&!$('#advance').hidden){e.preventDefault();advance();}}
  if(e.key.toLowerCase()==='m'){e.preventDefault();memoryPanel();}
  if(e.key.toLowerCase()==='v'){e.preventDefault();setView(state.perspective==='objective'?'subjective':'objective');}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&accepted&&!modalOpen)settingsPanel();sound.enable(!document.hidden&&state.settings.audio);});
