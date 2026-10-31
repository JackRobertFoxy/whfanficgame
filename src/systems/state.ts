import {freshPuzzles,puzzleNames} from './puzzles';
import raw from '../data/story.json';
import type {DialogueNode,GameState,SceneId,Story,EndingId} from '../types';
export const story=raw as Story;
export const sceneOrder=story.scenes.map(s=>s.id);
export const fragmentCount=story.fragments.length;
export const reconstructionAnswer=['witness','ordinary','model'];
export const flagNames=[...new Set(Object.values(story.dialogues).flatMap(nodes=>nodes.flatMap(node=>(node.choices??[]).flatMap(c=>c.flag?[c.flag]:[]))))];
export function freshState():GameState {
 return {version:4,scene:'hospital',perspective:'objective',visited:['hospital'],fragments:[],inspected:[],talked:[],flags:[],reconstruction:[null,null,null],reconstructed:false,ending:null,settings:{audio:false,reducedEffects:false,textSize:'normal'},savedAt:null,decisions:{},transcript:[],puzzles:freshPuzzles()};
}
export function addUnique<T>(list:T[],item:T):void {if(!list.includes(item))list.push(item);}
export function localFragments(id:SceneId):string[]{return story.scenes.find(s=>s.id===id)!.objects.flatMap(o=>o.fragment?[o.fragment]:[]);}
export function requirements(state:GameState,id:SceneId):string[]{
 const missing=story.scenes.find(s=>s.id===id)!.objects.filter(o=>o.fragment&&!state.fragments.includes(o.fragment)).map(o=>`观察「${o.name}」`);
 for(const p of story.scenes.find(x=>x.id===id)!.requiredPuzzles)if(!state.puzzles[p].solved)missing.push('完成'+puzzleNames[p]);
 if(id==='rift'){if(!state.reconstructed)missing.push('在记忆档案中完成三格重构');return missing;}
 const talk=story.scenes.find(s=>s.id===id)!.objects.find(o=>o.dialogue)?.dialogue;
 if(talk&&!state.talked.includes(talk))missing.push('完成本章角色对话');
 return missing;
}
export function canEnter(s:GameState,id:SceneId):boolean {const i=sceneOrder.indexOf(id);return s.visited.includes(id)||(i>0&&s.visited.includes(sceneOrder[i-1])&&requirements(s,sceneOrder[i-1]).length===0);}
export function moveTo(s:GameState,id:SceneId):boolean{if(!canEnter(s,id))return false;s.scene=id;addUnique(s.visited,id);return true;}
export function reconstruct(s:GameState):boolean {
 const ok=s.scene==='rift'&&s.fragments.length===fragmentCount&&s.reconstruction.every((f,i)=>f===reconstructionAnswer[i]&&s.fragments.includes(f));if(ok)s.reconstructed=true;return ok;
}
export function eligible(node:DialogueNode,s:GameState):boolean {
 if(node.ifFlag&&!s.flags.includes(node.ifFlag))return false;
 if(node.unlessFlag&&s.flags.includes(node.unlessFlag))return false;
 if(node.condition==='allFragments'&&s.fragments.length!==fragmentCount)return false;
 if(node.condition==='preludeComplete'&&!['appointment','childhood'].every(f=>s.fragments.includes(f)))return false;
 return true;
}
export function remember(s:GameState,speaker:string,text:string):void {
 const previous=s.transcript.at(-1);if(previous?.speaker===speaker&&previous.text===text)return;
 s.transcript.push({speaker,text});s.transcript=s.transcript.slice(-400);
}
export function epilogue(s:GameState,id:EndingId):string[] {
 const echo=s.flags.includes('replayedVoice')?'那段旧录音仍然留在电脑里。他已经学会原主怎样叫萨拉马斯的名字，却不能用一次模仿填上两个人共同经历过的全部年月。':s.flags.includes('sincereComfort')?'他还记得那个床头灯亮着的晚上，自己曾真心安慰萨拉马斯：这里没有恶魔。直到现在，他也不知道对方为什么听完以后，反而抱得更紧。':null;
 return [...story.endings[id].paragraphs,...(echo?[echo]:[])];
}
