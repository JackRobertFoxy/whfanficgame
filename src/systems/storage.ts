import type {GameState} from '../types';
import {story,sceneOrder,freshState,reconstructionAnswer,flagNames,fragmentCount,requirements} from './state';
export const SAVE_KEY='quiet-world.save.v2';
export const LEGACY_KEY='quiet-world.save.v1';
export const AGE_KEY='quiet-world.adult-session';
interface Store {getItem(key:string):string|null;setItem(key:string,value:string):void}
export type SaveResult={ok:true;state:GameState}|{ok:false;message:string};
const strings=(v:unknown,allowed?:string[]):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==='string'&&(!allowed||allowed.includes(x)))&&new Set(v).size===v.length;
export function validateSave(value:unknown):GameState|null {
 if(!value||typeof value!=='object')return null;
 const v=value as Record<string,unknown>;
 if(v.version!==2||!sceneOrder.includes(v.scene as never)||!['objective','subjective'].includes(v.perspective as string))return null;
 if(!strings(v.visited,sceneOrder)||!v.visited.includes('hospital')||!v.visited.includes(v.scene as string))return null;
 if(!strings(v.fragments,story.fragments.map(f=>f.id))||!strings(v.inspected,story.scenes.flatMap(s=>s.objects.map(o=>o.id)))||!strings(v.talked,Object.keys(story.dialogues))||!strings(v.flags,flagNames))return null;
 if(!Array.isArray(v.reconstruction)||v.reconstruction.length!==3||!v.reconstruction.every(x=>x===null||(typeof x==='string'&&(v.fragments as string[]).includes(x))))return null;
 if(typeof v.reconstructed!=='boolean'||(v.reconstructed&&((v.fragments as string[]).length!==fragmentCount||!v.reconstruction.every((x,i)=>x===reconstructionAnswer[i]))))return null;
 if(v.ending!==null&&(!['voice','stay','mask'].includes(v.ending as string)||!v.reconstructed||v.scene!=='rift'))return null;
 const settings=v.settings as Record<string,unknown>|undefined;
 if(!settings||typeof settings.audio!=='boolean'||typeof settings.reducedEffects!=='boolean'||!['normal','large'].includes(settings.textSize as string))return null;
 if(v.savedAt!==null&&(typeof v.savedAt!=='number'||!Number.isFinite(v.savedAt)||v.savedAt<0))return null;
 if(!v.decisions||typeof v.decisions!=='object'||Array.isArray(v.decisions))return null;
 for(const [key,label] of Object.entries(v.decisions)){
  const match=key.match(/^([A-Za-z]+)\.(\d+)$/);if(!match||typeof label!=='string')return null;
  const node=story.dialogues[match[1]]?.[Number(match[2])];if(!node?.choices?.some(c=>c.label===label))return null;
 }
 if(!Array.isArray(v.transcript)||v.transcript.length>400||!v.transcript.every(x=>x&&typeof x==='object'&&typeof x.speaker==='string'&&x.speaker.length<50&&typeof x.text==='string'&&x.text.length<10000))return null;
 return structuredClone(value as GameState);
}
export function migrateLegacy(value:unknown):GameState|null {
 if(!value||typeof value!=='object'||(value as {version?:number}).version!==1)return null;
 const old=value as Record<string,unknown>;
 if(!strings(old.fragments)||!strings(old.inspected)||!strings(old.talked)||!strings(old.flags))return null;
 const s=freshState();s.fragments=old.fragments.filter(f=>story.fragments.some(x=>x.id===f));s.inspected=old.inspected.filter(id=>story.scenes.some(x=>x.objects.some(o=>o.id===id)));s.talked=old.talked.filter(id=>id!=='finalTalk'&&!!story.dialogues[id]);s.flags=old.flags.filter(f=>flagNames.includes(f));
 const settings=old.settings as Record<string,unknown>|undefined;
 s.settings.reducedEffects=settings?.reducedEffects===true;
 s.visited=[];
 for(const id of sceneOrder){s.visited.push(id);s.scene=id;if(requirements(s,id).length)break;}
 return validateSave(s);
}
export function parseSave(text:string):GameState|null {try{const v:unknown=JSON.parse(text);return validateSave(v)||migrateLegacy(v);}catch{return null;}}
export function loadGame(store?:Store):SaveResult {
 try{const storage=store??localStorage;const raw=storage.getItem(SAVE_KEY)??storage.getItem(LEGACY_KEY);if(!raw)return {ok:false,message:'还没有本地存档。'};const state=parseSave(raw);return state?{ok:true,state}:{ok:false,message:'存档版本不兼容或数据损坏。原存档未被覆盖，可以继续当前故事。'};}
 catch{return {ok:false,message:'无法读取本地存档。请检查浏览器是否允许站点存储。'};}
}
export function saveGame(s:GameState,store?:Store):SaveResult {
 const next={...s,savedAt:Date.now()};if(!validateSave(next))return {ok:false,message:'当前进度未通过校验，未覆盖存档。'};
 try{(store??localStorage).setItem(SAVE_KEY,JSON.stringify(next));return {ok:true,state:next};}catch{return {ok:false,message:'保存失败：浏览器存储被禁用或空间不足。可在设置中导出进度文件。'};}
}
