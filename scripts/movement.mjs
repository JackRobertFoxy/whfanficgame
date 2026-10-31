import {chromium,devices} from '@playwright/test';
import {freshState,story} from '../src/systems/state.ts';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const url=process.env.DEMO_URL||'http://127.0.0.1:4173/whfanficgame/';
async function open(touch,scene){
 const context=await browser.newContext(touch?{...devices['Pixel 7'],reducedMotion:'reduce'}:{viewport:{width:1440,height:1050},reducedMotion:'reduce'});
 const state=freshState();state.scene=scene;state.visited=story.scenes.map(s=>s.id);state.settings.reducedEffects=true;
 await context.addInitScript(s=>localStorage.setItem('quiet-world.save.v4',JSON.stringify(s)),state);
 const page=await context.newPage();await page.goto(url);await page.locator('#adult').check();await page.locator('#enter').click();await page.locator('#continue-save').click();await page.locator('#loading').waitFor({state:'hidden'});return {page,context};
}
try{
 const {page,context}=await open(false,'past_armoury');
 for(let i=0;i<7;i++){await page.locator('#move-right').click();await page.waitForTimeout(450);}
 const x=Number(await page.locator('canvas').getAttribute('data-actor-x'));assert.equal(x,1050,'movement stops before overlapping the other armored character');
 await page.locator('#move-left').click();await page.waitForTimeout(450);assert.ok(Number(await page.locator('canvas').getAttribute('data-actor-x'))<x);
 await page.screenshot({path:'test-results/past-movement-separated.png',fullPage:true});await context.close();
 for(const [scene,id]of [['past_armoury','cogitatorTerminal'],['past_rescue','shipLog'],['study','studyLaptop'],['penthouse_night','nightPhone']]){
  const {page,context}=await open(true,scene);await page.locator(`[data-object="${id}"]`).tap();
  assert.ok(await page.locator('#modal').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'device dialog horizontal overflow: '+scene);
  await context.close();
 }
 console.log('PASS: separated armored character movement and four Android device dialog layouts.');
}finally{await browser.close();}
