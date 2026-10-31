import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState, story, requirements, localFragments, sceneOrder, moveTo, reconstruct, reconstructionAnswer, fragmentCount, eligible, epilogue} from './state';
import {loadGame, saveGame, validateSave, SAVE_KEY, LEGACY_KEY, migrateLegacy} from './storage';
function memoryStore(){const data=new Map<string,string>();return {getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};}
test('all narrative references, coordinates and IDs are valid',()=>{
  const ids=story.scenes.flatMap(s=>s.objects.map(o=>o.id));assert.equal(ids.length,new Set(ids).size);
  assert.equal(story.scenes.length,12);assert.equal(story.fragments.length,24);
  for(const s of story.scenes)for(const o of s.objects){
    assert.ok(o.x>0&&o.x<1&&o.y>0&&o.y<1);
    assert.ok(o.objective.length&&o.subjective.length);
    if(o.fragment)assert.ok(story.fragments.some(f=>f.id===o.fragment));
    if(o.dialogue)assert.ok(story.dialogues[o.dialogue].length);
  }
  for(const nodes of Object.values(story.dialogues))for(const node of nodes){assert.ok(['提图斯','卡斯蒂安','医生','萨拉马斯','过去的提图斯','过去的萨拉马斯'].includes(node.speaker));assert.ok(node.text.length);}
});
test('each scene requires its fragments and dialogue before transfer',()=>{
 const s=freshState();assert.equal(moveTo(s,'rift'),false);
 for(let i=0;i<sceneOrder.length-1;i++){
  const id=sceneOrder[i],next=sceneOrder[i+1];assert.equal(s.scene,id);
  assert.equal(moveTo(s,next),false);
  s.fragments.push(...localFragments(id));assert.equal(moveTo(s,next),false);
  const talk=story.scenes[i].objects.find(o=>o.dialogue)!.dialogue!;s.talked.push(talk);
  for(const p of story.scenes[i].requiredPuzzles)s.puzzles[p].solved=true;
  assert.deepEqual(requirements(s,id),[]);assert.equal(moveTo(s,next),true);
 }
 assert.equal(s.fragments.length,fragmentCount-1);
 assert.equal(moveTo(s,'hospital'),true);assert.equal(moveTo(s,'rift'),true);
});
test('reconstruction rejects swapped or uncollected fragments and accepts correct ordering',()=>{
 const s=freshState();s.scene='rift';s.reconstruction=[...reconstructionAnswer];assert.equal(reconstruct(s),false);
 s.fragments=story.fragments.map(f=>f.id);s.reconstruction=['model','ordinary','witness'];assert.equal(reconstruct(s),false);
 s.reconstruction=[...reconstructionAnswer];assert.equal(reconstruct(s),true);
});
test('save round trip preserves collected fragments, choices and settings',()=>{
 const store=memoryStore(),s=freshState();s.fragments=['pulse'];s.flags=['grounded'];s.settings.reducedEffects=true;
 const saved=saveGame(s,store);assert.equal(saved.ok,true);
 const loaded=loadGame(store);assert.equal(loaded.ok,true);
 if(loaded.ok){assert.deepEqual(loaded.state.fragments,['pulse']);assert.deepEqual(loaded.state.flags,['grounded']);assert.equal(loaded.state.settings.reducedEffects,true);assert.ok(loaded.state.savedAt);}
});
test('missing, malformed, outdated, unknown and duplicate data do not load',()=>{
 const store=memoryStore();assert.equal(loadGame(store).ok,false);
 for(const raw of ['{',JSON.stringify({...freshState(),version:99}),JSON.stringify({...freshState(),scene:'secret'}),JSON.stringify({...freshState(),fragments:['pulse','pulse']}),JSON.stringify({...freshState(),reconstructed:true}),JSON.stringify({...freshState(),ending:'voice'})]){
 store.setItem(SAVE_KEY,raw);assert.equal(loadGame(store).ok,false);assert.equal(store.getItem(SAVE_KEY),raw);
 }
 assert.equal(validateSave(null),null);
});
test('storage failures are reported without overwriting game state',()=>{
 const fail={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('quota');}};
 const s=freshState();assert.equal(saveGame(s,fail).ok,false);assert.equal(loadGame(fail).ok,false);assert.equal(s.savedAt,null);
});
test('three ending branches exist and bonus dialogue requires all fragments',()=>{
 const endingChoices=story.dialogues.finalTalk.flatMap(n=>n.choices??[]);
 assert.deepEqual(endingChoices.map(c=>c.ending),['voice','stay','mask']);
 assert.ok(story.dialogues.bedroomTalk.some(n=>n.condition==='preludeComplete'));
});

test('conditional dialogue follows previous choices rather than showing both paths',()=>{
 const s=freshState(),node={speaker:'医生',text:'test',ifFlag:'disclosed'};
 assert.equal(eligible(node,s),false);s.flags.push('disclosed');assert.equal(eligible(node,s),true);
 assert.equal(eligible({...node,ifFlag:undefined,unlessFlag:'disclosed'},s),false);
});
test('ending epilogues recall disclosure and the apartment boundary choice',()=>{
 const s=freshState();const privateText=epilogue(s,'voice').join('');
 s.flags=['disclosed','asserted'];const openText=epilogue(s,'voice').join('');
 assert.notEqual(privateText,openText);assert.match(openText,/另一个世界/);assert.match(openText,/先问我/);
});
test('legacy progress migrates into the first incomplete chapter without erasing v1 data',()=>{
 const store=memoryStore();const legacy={version:1,scene:'rift',fragments:['pulse','name','witness'],inspected:['monitor','identity','shadow'],talked:['hospitalTalk'],flags:['trust'],settings:{reducedEffects:true}};
 const raw=JSON.stringify(legacy);store.setItem(LEGACY_KEY,raw);const loaded=loadGame(store);
 assert.equal(loaded.ok,true);if(loaded.ok){assert.equal(loaded.state.version,3);assert.equal(loaded.state.scene,'past_armoury');assert.equal(loaded.state.ending,null);}
 assert.equal(store.getItem(LEGACY_KEY),raw);assert.equal(migrateLegacy({version:1}),null);
});
test('unknown decision pointers and overlong transcripts are rejected',()=>{
 const s=freshState();s.decisions={'assessmentTalk.0':'arbitrary'};assert.equal(validateSave(s),null);
 s.decisions={};s.transcript=Array.from({length:401},()=>({speaker:'卡斯蒂安',text:'x'}));assert.equal(validateSave(s),null);
});

test('puzzle progress survives save/load and malformed boards are rejected',()=>{
 const s=freshState(),store=memoryStore();s.puzzles.laptop.text='04';s.puzzles.laptop.evidence=['archive-mail'];
 assert.equal(saveGame(s,store).ok,true);const loaded=loadGame(store);assert.ok(loaded.ok);if(loaded.ok)assert.equal(loaded.state.puzzles.laptop.text,'04');
 s.puzzles.timeline.values=[0,0,1,2];assert.equal(validateSave(s),null);
});
