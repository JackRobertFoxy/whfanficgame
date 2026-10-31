import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
await mkdir('public/icons',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{const page=await browser.newPage();for(const size of [192,512]){
 await page.setViewportSize({width:size,height:size});
 await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#142730}svg{display:block;width:100vw;height:100vh}</style><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#142730"/><path d="M145 372V119h222v253M208 372V181h96v191M111 373h290" fill="none" stroke="#b4c8b8" stroke-width="10"/><path d="M256 180l-16 59l24 42l-14 90" fill="none" stroke="#65818a" stroke-width="6"/><circle cx="326" cy="268" r="7" fill="#b4c8b8"/></svg>`);
 await page.screenshot({path:`public/icons/icon-${size}.png`});
}}finally{await browser.close();}
