import type {PuzzleId,PuzzleProgress} from '../types';
export const puzzleIds:PuzzleId[]=['cogitator','laptop','phone','timeline'];
export const puzzleNames:Record<PuzzleId,string>={cogitator:'沉思者接线',laptop:'电脑归档解密',phone:'手机联系人核验',timeline:'救援记录排序'};
export function freshPuzzles():Record<PuzzleId,PuzzleProgress>{
 return {cogitator:{solved:false,values:[0,2,1,0,0,0,1,3,2],text:'',evidence:[],attempts:0},laptop:{solved:false,values:[],text:'',evidence:[],attempts:0},phone:{solved:false,values:[],text:'',evidence:[],attempts:0},timeline:{solved:false,values:[2,0,3,1],text:'',evidence:[],attempts:0}};
}
// N/E/S/W bitmasks; the actual connected network is checked, not a target array.
export function tileMask(index:number,turns:number):number {
 let mask=index>=3&&index<=5?5:3;
 for(let n=0;n<turns;n++)mask=((mask<<1)&15)|(mask>>3);
 return mask;
}
export function poweredTiles(values:number[]):number[]{
 if(values.length!==9||!(tileMask(3,values[3])&8))return [];
 const todo=[3],seen=new Set<number>();
 while(todo.length){const i=todo.pop()!;if(seen.has(i))continue;seen.add(i);const mask=tileMask(i,values[i]);
  for(const [bit,opposite,dx,dy]of [[1,4,0,-1],[2,8,1,0],[4,1,0,1],[8,2,-1,0]]){
   const x=i%3+dx,y=Math.floor(i/3)+dy;if(x<0||x>2||y<0||y>2||!(mask&bit))continue;
   const j=y*3+x;if(tileMask(j,values[j])&opposite)todo.push(j);
  }
 }return [...seen];
}
export function puzzleAnswer(id:PuzzleId,p:PuzzleProgress):{ok:boolean;message:string}{
 if(id==='cogitator')return poweredTiles(p.values).includes(5)&&!!(tileMask(5,p.values[5])&2)?{ok:true,message:'左侧电源已经连到右侧出口。撤离频道恢复回应，任务坐标可以查看。'}:{ok:false,message:'线路尚未连通。点击线路片旋转，检查相邻管口是否相接；绿色表示当前已经通电。'};
 if(id==='timeline')return p.values.length===4&&p.values.every((v,i)=>v===i)?{ok:true,message:'记录顺序已确认：进入囚所、确认身份、撤离、医疗舱苏醒。你可以继续听提图斯的解释。'}:{ok:false,message:'顺序不一致。请对照每条记录的时间，从最早的 00:12 排到最后的 01:03。使用上下箭头即可移动卡片。'};
 const evidence=id==='laptop'?'archive-mail':'clinic-card',code=id==='laptop'?'0417':'4821';
 if(!p.evidence.includes(evidence))return {ok:false,message:id==='laptop'?'请先打开邮件，读到设置归档密码的说明。密码格式并不是凭空猜测的。':'请先查看诊所纸卡。核验号码需要来自纸卡的四位校验码，不能只相信联系人显示的姓名。'};
 if(p.text!==code)return {ok:false,message:id==='laptop'?'密码不正确。邮件说明：四月十七日，按两位月份＋两位日期输入。':'校验码不一致。请对照纸卡上的四位数重新输入；没有次数惩罚。'};
 return {ok:true,message:id==='laptop'?'档案已打开：转运记录早于失踪登记，邮件注明萨拉马斯知道调查。这些记录已保存为剧情证据。':'号码核验通过，电话另一端确认是提图斯。你口述的消息已由代操作者输入，并保留在本机剧情记录中。'};
}
export const evidencePages={
 laptop:[
  {id:'archive-mail',app:'邮件',title:'归档设置 · 四月十七日',text:'发件人：公寓事务助理\n收件人：萨拉马斯\n\n本次转运安排与四月十七日签署的文件归在一起。按之前约定，归档密码使用签署日期的四位月日数字：两位月份在前，两位日期在后。\n\n附注：对方正在核对公司往来，请保留原邮件，不要重新覆盖时间。'},
  {id:'study-notes',app:'备忘',title:'提图斯的核对笔记',text:'卡斯蒂安口述：先看原邮件，不要只看后来打印的安排。\n\n提图斯记录：档案中的表格并不等于全部事实，先对照文件日期、失踪登记与车辆安排，再决定下一步。\n\n归档密码只有四位。比如一月二日应写成 0102；本次日期在邮件里。'},
  {id:'archive-file',app:'文件',title:'加密归档 · transfer.archive',text:'加密档案需要四位密码。\n\n将由提图斯代为输入，卡斯蒂安决定输入内容。打开后获得「囚禁前的往来」，可以继续书房对白。'}
 ],
 phone:[
  {id:'clinic-card',app:'纸卡',title:'诊所留下的联系人纸卡',text:'紧急联系人：提图斯\n登记号码尾号：0219\n联系人核验码：4821\n\n请将核验码与消息应用的确认提示比对，再拨给登记联系人。纸卡是在此前会面后留下的，并非手机自动生成。'},
  {id:'phone-messages',app:'消息',title:'暂存消息 · 等待核验',text:'提图斯：我就在相邻房间。需要的话可以叫我，也可以先发消息。\n\n待发送草稿（卡斯蒂安口述）：我已经看过归档。请保留那些记录，明天再按我说的时间联系。\n\n输入纸卡的四位核验码后，由代操作者完成确认与发送。'},
  {id:'phone-contacts',app:'联系人',title:'提图斯 · 等待确认',text:'屏幕显示的是一个名字，名字本身不能完成核验。\n\n登记尾号：0219，与诊所纸卡一致。确认核验码后再继续，不会联系现实中的任何号码。'}
 ]
};
export const timelineCards=[
 {time:'00:12',title:'进入囚所',text:'银色装甲的脚步进入走廊，通讯里报告找到目标房间。'},
 {time:'00:18',title:'确认卡斯蒂安身份',text:'提图斯反复叫出姓名，等待卡斯蒂安对自己的声音作出回应。'},
 {time:'00:24',title:'协助撤离',text:'卡斯蒂安被转移离开囚所，队伍回到运输载具。'},
 {time:'01:03',title:'医疗舱苏醒',text:'战舰药剂设备开始记录清醒后的指标，提图斯在床边确认位置。'}
];
