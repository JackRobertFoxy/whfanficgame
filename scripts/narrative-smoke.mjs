import {chromium,devices} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {freshState} from '../src/systems/state.ts';
import assert from 'node:assert/strict';
const url=process.env.DEMO_URL||'http://127.0.0.1:4173/whfanficgame/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('test-results',{recursive:true});
const legacy=JSON.stringify({...freshState(),version:3,scene:'rift',ending:'voice',flags:['disclosed','asserted'],fragments:['pulse'],settings:{audio:true,reducedEffects:true,textSize:'large'}});
async function gate(page){await page.locator('#adult').check();await page.locator('#gate-reduce').check();await page.locator('#enter').click();await page.locator('#continue-save').click();await page.locator('#loading').waitFor({state:'hidden'});}
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
 await ctx.addInitScript(v=>localStorage.setItem('quiet-world.save.v3',v),legacy);
 const page=await ctx.newPage();await page.goto(url);await gate(page);
 assert.equal(await page.locator('#scene-name').innerText(),'病房');assert.equal(await page.locator('#speaker').innerText(),'旁白');assert.match(await page.locator('#text').innerText(),/卡斯蒂安醒来的时候/);
 assert.match(await page.locator('#toast').innerText(),/旧版存档已保留/);assert.match(await page.locator('.prototype').innerText(),/v1.2/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('quiet-world.save.v3')),legacy);
 assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('large-text')),true);
 const oldText=await page.locator('#text').innerText();assert.equal(oldText.includes('玩家关注的是'),false);
 for(let i=0;i<20&&await page.locator('#advance').isVisible();i++)await page.locator('#advance').click();
 await page.locator('[data-object="monitor"]').click();
 for(let i=0;i<10&&await page.locator('#advance').isVisible();i++)await page.locator('#advance').click();
 const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('quiet-world.save.v4')));
 assert.equal(saved.version,4);assert.deepEqual(saved.flags,[]);assert.deepEqual(saved.decisions,{});assert.equal(saved.ending,null);
 assert.equal(await page.evaluate(()=>localStorage.getItem('quiet-world.save.v3')),legacy);await ctx.close();
 // Final generated text and the new warm bedroom must be readable in a touch viewport.
 const mobile=await browser.newContext({...devices['Pixel 7'],reducedMotion:'reduce'}),state=freshState();state.scene='homecoming';state.visited=['hospital','homecoming'];
 await mobile.addInitScript(s=>localStorage.setItem('quiet-world.save.v4',JSON.stringify(s)),state);
 const touch=await mobile.newPage();await touch.goto(url);await gate(touch);await touch.locator('[data-object="soupTray"]').tap();await touch.locator('#subjective-view').tap();await touch.locator('#advance').tap();
 assert.match(await touch.locator('#text').innerText(),/那口汤没有伤害他/);assert.ok(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await touch.screenshot({path:'test-results/android-homecoming-v12.png',fullPage:true});await mobile.close();
 const pc=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),study=freshState();study.scene='study';study.visited=['hospital','study'];
 await pc.addInitScript(s=>localStorage.setItem('quiet-world.save.v4',JSON.stringify(s)),study);
 const screen=await pc.newPage();await screen.goto(url);await gate(screen);await screen.locator('[data-object="studyLaptop"]').click();
 assert.match(await screen.locator('.operator').innerText(),/萨拉马斯陪在身边/);
 await screen.locator('#puzzle-input').fill('0417');await screen.locator('#verify-puzzle').click();assert.match(await screen.locator('.unlocked-file').innerText(),/原来的卡斯蒂安/);
 await screen.screenshot({path:'test-results/desktop-computer-v12.png',fullPage:true});await pc.close();
 const modern=await (await fetch(url+'art/bedroom.svg')).text();assert.equal(modern.includes('TABLETOP MINIATURES'),false);
 console.log('PASS: final v1.2 narrator, legacy v3 UI restart without loss, v4 isolation, warm bedroom long-text touch layout, delayed model reveal.');
}finally{await browser.close();}
