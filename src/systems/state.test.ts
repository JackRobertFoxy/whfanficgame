import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState, story, requirements, localFragments, sceneOrder, moveTo, reconstruct, reconstructionAnswer, fragmentCount, eligible, epilogue} from './state';
import {loadGame, saveGame, validateSave, SAVE_KEY, LEGACY_KEY, migrateLegacy} from './storage';
function memoryStore(){const data=new Map<string,string>();return {getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};}
test('all narrative references, coordinates and IDs are valid',()=>{
  const ids=story.scenes.flatMap(s=>s.objects.map(o=>o.id));assert.equal(ids.length,new Set(ids).size);
  assert.equal(story.scenes.length,15);assert.equal(story.fragments.length,30);
  for(const s of story.scenes)for(const o of s.objects){
    assert.ok(o.x>0&&o.x<1&&o.y>0&&o.y<1);
    assert.ok(o.objective.length&&o.subjective.length);
    if(o.fragment)assert.ok(story.fragments.some(f=>f.id===o.fragment));
    if(o.dialogue)assert.ok(story.dialogues[o.dialogue].length);
  }
  for(const nodes of Object.values(story.dialogues))for(const node of nodes){assert.ok(['旁白','提图斯','卡斯蒂安','医生','萨拉马斯','过去的提图斯','过去的萨拉马斯'].includes(node.speaker));assert.ok(node.text.length);}
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
 const store=memoryStore(),s=freshState();s.fragments=['pulse'];s.flags=['safeTerms'];s.settings.reducedEffects=true;
 const saved=saveGame(s,store);assert.equal(saved.ok,true);
 const loaded=loadGame(store);assert.equal(loaded.ok,true);
 if(loaded.ok){assert.deepEqual(loaded.state.fragments,['pulse']);assert.deepEqual(loaded.state.flags,['safeTerms']);assert.equal(loaded.state.settings.reducedEffects,true);assert.ok(loaded.state.savedAt);}
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
 const bonus=story.dialogues.finalTalk.find(n=>n.condition==='allFragments')!;const state=freshState();assert.equal(eligible(bonus,state),false);state.fragments=story.fragments.map(f=>f.id);assert.equal(eligible(bonus,state),true);
});

test('conditional dialogue follows previous choices rather than showing both paths',()=>{
 const s=freshState(),node={speaker:'医生',text:'test',ifFlag:'hidOrigin'};
 assert.equal(eligible(node,s),false);s.flags.push('hidOrigin');assert.equal(eligible(node,s),true);
 assert.equal(eligible({...node,ifFlag:undefined,unlessFlag:'hidOrigin'},s),false);
});
test('ending epilogues preserve genuine affection and remember earlier experiences',()=>{
 const s=freshState(),base=epilogue(s,'stay').join('');
 assert.match(base,/他喜欢萨拉马斯/);assert.match(base,/唯有安宁永存/);
 s.flags=['replayedVoice'];assert.notEqual(epilogue(s,'stay').join(''),base);assert.match(epilogue(s,'stay').join(''),/旧录音/);
 s.flags=['sincereComfort'];assert.match(epilogue(s,'stay').join(''),/这里没有恶魔/);
});
test('rewritten story restarts old versions without importing retired decisions or deleting saves',()=>{
 for(const version of [1,2,3]){
  const store=memoryStore(),key='quiet-world.save.v'+version;
  const legacy={version,scene:'rift',fragments:['pulse','name','witness'],inspected:['monitor'],talked:['hospitalTalk'],flags:['trust','disclosed'],decisions:{'assessmentTalk.0':'old'},transcript:[{speaker:'医生',text:'old storyline'}],settings:{reducedEffects:true,textSize:'large'}};
  const raw=JSON.stringify(legacy);store.setItem(key,raw);const loaded=loadGame(store);
  assert.equal(loaded.ok,true);if(loaded.ok){assert.equal(loaded.state.version,4);assert.equal(loaded.state.scene,'hospital');assert.equal(loaded.state.ending,null);assert.deepEqual(loaded.state.flags,[]);assert.deepEqual(loaded.state.fragments,[]);assert.deepEqual(loaded.state.decisions,{});assert.deepEqual(loaded.state.transcript,[]);assert.equal(loaded.state.settings.textSize,'large');assert.equal(loaded.state.settings.reducedEffects,true);assert.match(loaded.message??'',/已保留/);}
  assert.equal(store.getItem(key),raw);
 }
 assert.equal(migrateLegacy({version:1}),null);
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

test('the identity mystery unfolds through care, concealment, original voice and the late advertisement',()=>{
 const order=story.scenes.map(s=>s.id);
 assert.ok(order.indexOf('homecoming')<order.indexOf('assessment'));
 assert.ok(order.indexOf('sleepless')<order.indexOf('assessment'));
 assert.ok(order.indexOf('study')<order.indexOf('advertisement'));
 assert.equal(story.scenes.find(s=>s.id==='study')?.actor,'thalamas');
 assert.equal(story.scenes.find(s=>s.id==='penthouse_night')?.actor,'titus');
 assert.match(story.dialogues.livingTalk.map(n=>n.text).join(''),/他.*没有很坏吧/);
 const flags=Object.values(story.dialogues).flatMap(nodes=>nodes.flatMap(n=>(n.choices??[]).map(c=>c.flag)));
 for(const retired of ['disclosed','asserted','savedEvidence','keptRecords','newArrangement'])assert.equal(flags.includes(retired),false);
 for(const s of story.scenes.filter(s=>s.era==='past'))assert.ok(s.actor.endsWith('-armour'));
 for(const id of ['voice','stay','mask'] as const){assert.ok(story.endings[id].paragraphs.length>=6);assert.match(epilogue(freshState(),id).join(''),/萨拉马斯/);}
 const prose=story.scenes.flatMap(s=>[...s.intro,...s.objects.flatMap(o=>[...o.objective,...o.subjective])]).join('')+Object.values(story.dialogues).flatMap(nodes=>nodes.map(n=>n.text+(n.choices??[]).map(c=>c.response).join(''))).join('');
 assert.ok(prose.length>30000,'rewritten story must retain developed scenes rather than short aphorisms');
});
