import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();page.setDefaultTimeout(10000);
 await page.addInitScript(()=>{const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(...args){super(...args);window.__audioContext=this;}};});
 await page.goto(process.env.DEMO_URL||'http://127.0.0.1:4173/whfanficgame/');
 await page.locator('#adult').check();await page.locator('#gate-reduce').uncheck();await page.locator('#enter').click();await page.locator('#begin').click();await page.locator('#loading').waitFor({state:'hidden'});
 for(let i=0;i<10&&await page.locator('#advance').isVisible();i++)await page.locator('#advance').click();
 await page.locator('[data-object="shadow"]').click();assert.equal(await page.locator('#stage').evaluate(e=>e.classList.contains('intrusion')),true);
 for(let i=0;i<10&&await page.locator('#advance').isVisible();i++)await page.locator('#advance').click();
 await page.locator('#settings').click();await page.locator('#setting-reduce').check();await page.locator('#setting-audio').check();await page.waitForFunction(()=>window.__audioContext?.state==='running');await page.locator('#resume').click();
 await page.locator('[data-object="shadow"]').click();assert.equal(await page.locator('#stage').evaluate(e=>e.classList.contains('intrusion')),false);
 await page.locator('#audio').click();await page.waitForFunction(()=>window.__audioContext?.state==='suspended');
 console.log('PASS: non-reduced horror event, reduced-mode suppression, audio opt-in running, audio off suspended. No subjective loudness assessment.');
}finally{await browser.close();}
