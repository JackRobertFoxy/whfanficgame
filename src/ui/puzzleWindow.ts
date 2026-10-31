import type {PuzzleId,PuzzleProgress} from '../types';
import {puzzleNames,puzzleAnswer,tileMask,poweredTiles,evidencePages,timelineCards} from '../systems/puzzles';
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function mountPuzzle(root:HTMLElement,id:PuzzleId,p:PuzzleProgress,save:()=>void,solved:()=>void,close:()=>void):void {
 let page=0;
 const operator=id==='cogitator'?'过去的卡斯蒂安操作动力甲接口':id==='timeline'?'过去的提图斯代为播放记录':id==='laptop'?'提图斯代为使用电脑':'萨拉马斯按口述操作，提图斯在相邻房间核对';
 function render():void {
  root.innerHTML=`<section class="device ${id==='phone'?'phone-device':''} ${id==='cogitator'||id==='timeline'?'imperial-device':''}"><div class="device-header"><span class="device-led"></span><strong>${puzzleNames[id]}</strong><span>${id==='phone'?'本机剧情通信':'LOCAL ARCHIVE'}</span></div><div class="operator"><span>当前操作</span>${operator}<small>玩家选择关注与指令；现代卡斯蒂安不会自行伸手操作。</small></div><div id="device-work"></div><p id="puzzle-feedback" role="status" class="puzzle-feedback">${p.solved?'记录已保存。本次解密已经完成，可以继续阅读剧情。':'线索就在设备里。可以随时关闭，进度会保留；错误没有惩罚。'}</p><div class="device-actions"><button id="verify-puzzle" class="primary" ${p.solved?'hidden':''}>${id==='cogitator'?'检查通讯线路':id==='timeline'?'确认记录顺序':'让对方输入并确认'} →</button><button id="finish-puzzle">${p.solved?'返回剧情 →':'稍后再看'}</button></div></section>`;
  const work=root.querySelector<HTMLElement>('#device-work')!;
  if(id==='cogitator'){
   const powered=poweredTiles(p.values);
   work.innerHTML=`<div class="machine-instructions"><p>将左侧的电源连到右侧通讯出口。点击任意线路片可顺时针旋转，绿色表示已经通电。</p></div><div class="circuit-shell"><span>电源 →</span><div class="circuit" aria-label="三行三列接线板">${p.values.map((v,i)=>{const mask=tileMask(i,v);return `<button class="circuit-tile ${powered.includes(i)?'powered':''}" data-tile="${i}" aria-label="旋转第${i+1}块线路" ${p.solved?'disabled':''}><svg viewBox="0 0 80 80" aria-hidden="true">${[[1,40,0],[2,80,40],[4,40,80],[8,0,40]].filter(([bit])=>mask&bit).map(([,x,y])=>`<path d="M40 40L${x} ${y}"/>`).join('')}<circle cx="40" cy="40" r="7"/></svg></button>`;}).join('')}</div><span>→ 通讯</span></div><p class="device-note">沉思者的厚重外壳上有红色蜡封。这里是出征前的回忆，那时卡斯蒂安的四肢完整。</p>`;
   work.querySelectorAll<HTMLButtonElement>('[data-tile]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.tile);p.values[i]=(p.values[i]+1)%4;save();render();});
  }else if(id==='timeline'){
   work.innerHTML=`<p class="machine-instructions">对照时间，从最早到最晚排列。用上下按钮移动记录，手机上同样可以点按，不需要拖动。</p><div class="timeline-puzzle">${p.values.map((v,i)=>{const c=timelineCards[v];return `<article><b>${i+1}</b><div><time>${c.time}</time><h3>${c.title}</h3><p>${c.text}</p></div><div><button data-up="${i}" aria-label="上移${c.title}" ${i===0||p.solved?'disabled':''}>↑</button><button data-down="${i}" aria-label="下移${c.title}" ${i===3||p.solved?'disabled':''}>↓</button></div></article>`;}).join('')}</div>`;
   for(const direction of ['up','down'])work.querySelectorAll<HTMLButtonElement>(`[data-${direction}]`).forEach(b=>b.onclick=()=>{const i=Number(b.dataset[direction]),j=i+(direction==='up'?-1:1);[p.values[i],p.values[j]]=[p.values[j],p.values[i]];save();render();});
  }else{
   const pages=evidencePages[id],current=pages[page];
   if(!p.evidence.includes(current.id)){p.evidence.push(current.id);save();}
   work.innerHTML=`<div class="os-workspace"><nav class="device-apps" aria-label="设备应用">${pages.map((a,i)=>`<button data-app="${i}" aria-pressed="${page===i}"><span>${['▤','▥','▣'][i]}</span>${a.app}${p.evidence.includes(a.id)?' ·':''}</button>`).join('')}</nav><article class="document-window"><div class="window-chrome"><span>● ● ●</span><small>由卡斯蒂安决定阅读内容</small></div><h3>${esc(current.title)}</h3><div class="document-text">${esc(current.text)}</div>${p.solved?`<aside class="unlocked-file"><h4>${id==='laptop'?'已打开 · 原始转运记录':'已核验 · 提图斯的回复'}</h4><p>${id==='laptop'?'失踪前的邮件提到调查、车辆和更换住所，收件人为萨拉马斯。副本已经按卡斯蒂安的要求保留，接下来可以与提图斯逐条核对。':'「是我，提图斯。记录我已经留下了。明天的联系按你口述的时间来，我不会替你改动要说的话。」'}</p></aside>`:''}</article></div><label class="passcode-label" for="puzzle-input">${id==='laptop'?'档案密码（邮件中的四位月日）':'联系人核验码（对照纸卡）'}</label><div class="passcode-entry"><input id="puzzle-input" inputmode="numeric" autocomplete="off" maxlength="4" value="${esc(p.text)}" ${p.solved?'disabled':''} aria-label="四位数字"/><span>由代操作者输入</span></div><div class="device-keypad">${['1','2','3','4','5','6','7','8','9','清空','0','退格'].map(key=>`<button data-key="${key}" ${p.solved?'disabled':''}>${key}</button>`).join('')}</div>`;
   work.querySelectorAll<HTMLButtonElement>('[data-app]').forEach(b=>b.onclick=()=>{page=Number(b.dataset.app);render();});
   const input=work.querySelector<HTMLInputElement>('#puzzle-input')!;
   input.oninput=()=>{p.text=input.value.replace(/\D/g,'').slice(0,4);input.value=p.text;save();};
   input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();verify();}};
   work.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(b=>b.onclick=()=>{const key=b.dataset.key!;p.text=key==='清空'?'':key==='退格'?p.text.slice(0,-1):(p.text+key).slice(0,4);input.value=p.text;save();});
  }
  root.querySelector<HTMLButtonElement>('#verify-puzzle')!.onclick=verify;
  root.querySelector<HTMLButtonElement>('#finish-puzzle')!.onclick=close;
 }
 function verify():void {
  const answer=puzzleAnswer(id,p);if(answer.ok){const first=!p.solved;p.solved=true;save();if(first)solved();render();}else{p.attempts++;save();}
  root.querySelector<HTMLElement>('#puzzle-feedback')!.textContent=answer.message;
 }
 render();
}
