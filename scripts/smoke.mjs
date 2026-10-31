import {chromium,devices} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const story=JSON.parse(await readFile(new URL('../src/data/story.json',import.meta.url),'utf8'));
const url=(process.env.DEMO_URL||'http://127.0.0.1:4173/whfanficgame/').replace(/\/?$/,'/');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('test-results',{recursive:true});
async function run(touch){
 const name=touch?'android':'desktop';
 const context=await browser.newContext(touch?{...devices['Pixel 7'],reducedMotion:'reduce',acceptDownloads:true}:{viewport:{width:1440,height:1050},reducedMotion:'reduce',acceptDownloads:true});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const click=async selector=>{const el=page.locator(selector);if(touch)await el.tap();else await el.click();};
 async function drain(){for(let i=0;i<70;i++){
  const count=await page.locator('#choices button').count();
  if(count){const el=page.locator('#choices button').nth(touch?Math.min(1,count-1):0);if(touch)await el.tap();else await el.click();continue;}
  if(await page.locator('#advance').isVisible()){await click('#advance');continue;}return;
 }throw Error('Dialogue failed to end');}
 async function solve(id,objectId){
  await page.locator('#puzzle-root').waitFor();
  if(id==='cogitator'){
   await click('#verify-puzzle');assert.match(await page.locator('#puzzle-feedback').innerText(),/尚未连通/);
   for(const i of [3,4,5])await click(`[data-tile="${i}"]`);
  }else if(id==='timeline'){
   await click('#verify-puzzle');assert.match(await page.locator('#puzzle-feedback').innerText(),/顺序不一致/);
   for(const i of [1,3,2])await click(`[data-up="${i}"]`);
  }else{
   await page.locator('#puzzle-input').fill('00');await click('#finish-puzzle');await click(`[data-object="${objectId}"]`);assert.equal(await page.locator('#puzzle-input').inputValue(),'00');
   await page.locator('#puzzle-input').fill('0000');await click('#verify-puzzle');assert.match(await page.locator('#puzzle-feedback').innerText(),/不正确|不一致/);
   await page.locator('#puzzle-input').fill(id==='laptop'?'0417':'4821');
  }
  await page.screenshot({path:`test-results/${name}-${id}-device.png`,fullPage:true});
  await click('#verify-puzzle');assert.equal(await page.locator('#verify-puzzle').isHidden(),true);await click('#finish-puzzle');
 }
 async function gate(){await page.locator('#enter').waitFor();assert.equal(await page.locator('#enter').isDisabled(),true);assert.equal(await page.locator('canvas').count(),0);await page.locator('#adult').check();await page.locator('#gate-reduce').check();await click('#enter');}
 try{
  console.log(name+': age gate');await page.goto(url);await page.screenshot({path:`test-results/${name}-01-entry.png`,fullPage:true});
  await click('#decline');assert.equal(await page.locator('canvas').count(),0);await click('#back-gate');await gate();await click('#begin');await page.locator('#loading').waitFor({state:'hidden'});await drain();
  assert.equal(await page.locator('#next-scene').isDisabled(),true);
  await page.locator('#portrait').evaluate(i=>i.decode());await page.screenshot({path:`test-results/${name}-02-hospital.png`,fullPage:true});
  await click('#portrait-preview');assert.equal(await page.locator('#modal-title').innerText(),'卡斯蒂安');await click('#close-modal');
  if(!touch){
   await page.locator('canvas').scrollIntoViewIfNeeded();const box=await page.locator('canvas').boundingBox(),o=story.scenes[0].objects[0];await page.mouse.click(box.x+box.width*o.x,box.y+box.height*o.y);await page.locator('#advance').waitFor();await drain();
  }
  for(const [index,scene] of story.scenes.entries()){
   console.log(name+': '+scene.id);if(index>0)await drain();
   if(scene.id==='past_armoury'){const before=await page.locator('canvas').getAttribute('data-actor-x');await click('#move-left');await page.waitForFunction(x=>document.querySelector('canvas').dataset.actorX!==x,before);}
   assert.equal(await page.locator('#scene-name').innerText(),scene.title);
   for(const o of scene.objects.filter(o=>!o.dialogue)){
    if(o.puzzle){await click(`[data-object="${o.id}"]`);await solve(o.puzzle,o.id);continue;}
    await click(`[data-object="${o.id}"]`);await click('#objective-view');assert.ok((await page.locator('#text').innerText()).length);await click('#subjective-view');assert.ok((await page.locator('#text').innerText()).length);await drain();
   }
   if(scene.id==='rift')break;
   if(index===0){
    await click('#save');const before=await page.locator('#fragment-count').innerText();await page.reload();await gate();await click('#continue-save');assert.equal(await page.locator('#fragment-count').innerText(),before);
    await click('#settings');const exported=page.waitForEvent('download');await click('#export-save');assert.equal((await exported).suggestedFilename(),'quiet-world-save.json');
    const raw=await page.evaluate(()=>localStorage.getItem('quiet-world.save.v3'));
    await page.locator('#import-save').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(raw)});await click('#confirm-import');assert.equal(await page.locator('#fragment-count').innerText(),before);
   }
   await click(`[data-object="${scene.objects.find(o=>o.dialogue).id}"]`);await drain();assert.equal(await page.locator('#next-scene').isDisabled(),false);
   if(['past_armoury','past_cell','past_rescue','study','penthouse_night'].includes(scene.id))await page.screenshot({path:`test-results/${name}-${scene.id}.png`,fullPage:true});
   await click('#next-scene');
  }
  assert.match(await page.locator('#fragment-count').innerText(),/24 \/ 24/);await click('#memory');
  const selects=page.locator('[data-slot]');await selects.nth(0).selectOption('model');await selects.nth(1).selectOption('ordinary');await selects.nth(2).selectOption('witness');await click('#reconstruct');assert.match(await page.locator('#reconstruct-feedback').innerText(),/再看看/);
  await selects.nth(0).selectOption('witness');await selects.nth(2).selectOption('model');await click('#reconstruct');assert.match(await page.locator('#reconstruct-feedback').innerText(),/已经分开/);await click('#close-modal');
  await click('#next-scene');await drain();
  const expected=touch?'今晚的距离':'第一句自己的话';assert.equal(await page.locator('#modal-title').innerText(),expected);
  const epilogue=await page.locator('.epilogue').innerText();assert.match(epilogue,touch?/没有交出的部分/:/另一个世界/);
  await page.screenshot({path:`test-results/${name}-ending.png`,fullPage:true});
  if(!touch)for(const [i,title]of [[1,'今晚的距离'],[2,'正确的词']]){
   await click('#retry-ending');for(let j=0;j<15;j++){if(await page.locator('#choices button').count())break;await click('#advance');}
   await page.locator('#choices button').nth(i).click();await click('#advance');assert.equal(await page.locator('#modal-title').innerText(),title);
  }
  await click('#end-backlog');assert.ok(await page.locator('.backlog article').count()>30);await click('#close-modal');
  await click('#next-scene');assert.ok(await page.locator('.epilogue').isVisible());await click('#close-modal');
  await click('#settings');await page.locator('#setting-text').check();await click('#resume');assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('large-text')),true);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
  await click('#settings');await page.locator('#import-save').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});await page.waitForFunction(()=>/损坏|无法识别/.test(document.querySelector('#toast').textContent));await click('#resume');
  const saved=await page.evaluate(()=>localStorage.getItem('quiet-world.save.v3'));await page.evaluate(()=>localStorage.setItem('quiet-world.save.v3','{broken'));await click('#load');assert.match(await page.locator('#toast').innerText(),/损坏|读取/);await page.evaluate(s=>localStorage.setItem('quiet-world.save.v3',s),saved);
  // Production service worker and subpath URLs must survive complete disconnection.
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload();await gate();await click('#continue-save');await page.locator('.epilogue').waitFor();assert.equal(await page.locator('#modal-title').innerText(),touch?'今晚的距离':'正确的词');
  assert.deepEqual(errors,[]);console.log('PASS '+name+': 12 chapters, 24 fragments, 4 puzzles, helmeted past line, actual movement, branches, save/import/export, recap, endings, touch/layout, Pages subpath, offline reload.');
 }catch(e){await page.screenshot({path:`test-results/${name}-failure.png`,fullPage:true}).catch(()=>{});throw e;}finally{await context.close();}
}
try{if(process.env.E2E_TARGET!=='android')await run(false);if(process.env.E2E_TARGET!=='desktop')await run(true);}finally{await browser.close();}
