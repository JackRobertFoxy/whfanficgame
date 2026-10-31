import raw from '../data/story.json';
import type {DialogueNode,GameState,SceneId,Story,EndingId} from '../types';
export const story=raw as Story;
export const sceneOrder=story.scenes.map(s=>s.id);
export const fragmentCount=story.fragments.length;
export const reconstructionAnswer=['witness','ordinary','model'];
export const flagNames=['identity','grounded','trust','boundary','honest','mask','witnessed','disclosed','private','asserted','contact'];
export function freshState():GameState {
 return {version:2,scene:'hospital',perspective:'objective',visited:['hospital'],fragments:[],inspected:[],talked:[],flags:[],reconstruction:[null,null,null],reconstructed:false,ending:null,settings:{audio:false,reducedEffects:false,textSize:'normal'},savedAt:null,decisions:{},transcript:[]};
}
export function addUnique<T>(list:T[],item:T):void {if(!list.includes(item))list.push(item);}
export function localFragments(id:SceneId):string[]{return story.scenes.find(s=>s.id===id)!.objects.flatMap(o=>o.fragment?[o.fragment]:[]);}
export function requirements(state:GameState,id:SceneId):string[]{
 const missing=localFragments(id).filter(f=>!state.fragments.includes(f)).map(f=>`观察「${story.fragments.find(x=>x.id===f)!.foundAt.split(' · ')[1]}」`);
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
 const base={voice:['通话结束后，卡斯蒂安同意把今天说过的话保留下来。不是为了证明另一个宇宙，而是让今后的安排不再只有别人的版本。','第二天，他再次要求在做决定之前听见完整说明。他仍会害怕，也仍会有说不出话的时候；这一次，沉默不再被自动写成同意。'],stay:['电话没有立刻挂断。提图斯谈起窗外的雨，卡斯蒂安纠正了他一句：这里已经停了。这个小小的不同，终于不需要被藏起来。','第二天的安排还没有全部解决。卡斯蒂安却记得，是自己决定让这段通话持续到什么时候。'],mask:['他把电脑、电灯、医生三个词重新念了一遍。那些词不再只是伪装，也开始成为要求帮助的工具。','他没有交出全部来历。明天的通话仍然约好了。隐藏与讲述之间，还有一条可以由他自己决定速度的路。']}[id];
 return [...base,s.flags.includes('disclosed')?'医生的记录里保留了那句「我记得另一个世界」。卡斯蒂安第一次知道，一句话可以被留下，而不必立刻被裁决。':'医生的记录停在他愿意讲述的位置。没有交出的部分，仍由他保存。',s.flags.includes('asserted')?'他还记得自己对萨拉马斯说过：先问我。那句话不是让一切痊愈的口令，而是下一次可以继续提出的要求。':'他提出的那次联系请求，成为一条具体的约定。卡斯蒂安开始把想要什么说得更清楚，而不是只说自己能忍受什么。'];
}
