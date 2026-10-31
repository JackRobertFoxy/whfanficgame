import {asset} from './assets';
interface InstallPrompt extends Event {prompt():Promise<void>;userChoice:Promise<{outcome:string}>}
let pending:InstallPrompt|undefined;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pending=e as InstallPrompt;});
export async function installApp():Promise<string>{
 if(pending){await pending.prompt();const choice=await pending.userChoice;pending=undefined;return choice.outcome==='accepted'?'已发起安装。':'已取消安装，仍可在浏览器游玩。';}
 return '安卓 Chrome：打开浏览器菜单，选择「安装应用」或「添加到主屏幕」。需要 HTTPS 地址，首次完整加载后可离线游玩。';
}
export function registerOffline(notify:(message:string)=>void):void {
 if(!import.meta.env.PROD||!('serviceWorker' in navigator))return;
 navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='OFFLINE_READY')notify('完整离线包已就绪。下次即使断网，也可从本机继续。');});
 void navigator.serviceWorker.register(asset('sw.js'),{scope:import.meta.env.BASE_URL}).then(reg=>{
  reg.addEventListener('updatefound',()=>{const installing=reg.installing;installing?.addEventListener('statechange',()=>{if(installing.state==='installed'&&navigator.serviceWorker.controller)notify('新版本已下载。请先存档，关闭本站所有标签页后重新打开即可更新。');});});
 }).catch(()=>notify('离线缓存未能启动，联网游玩不受影响。'));
}
