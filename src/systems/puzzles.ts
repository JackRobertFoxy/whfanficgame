import type {PuzzleId,PuzzleProgress} from '../types';
export const puzzleIds:PuzzleId[]=['cogitator','laptop','phone','timeline'];
export const puzzleNames:Record<PuzzleId,string>={cogitator:'沉思者接线',laptop:'旧相册解锁',phone:'拨给萨拉马斯',timeline:'救援记录排序'};
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
 if(!p.evidence.includes(evidence))return {ok:false,message:id==='laptop'?'请先打开邮件，读到设置归档密码的说明。密码格式并不是凭空猜测的。':'请先查看提图斯留在桌上的提示卡，找到联系人解锁码。'};
 if(p.text!==code)return {ok:false,message:id==='laptop'?'密码不正确。邮件说明：四月十七日，按两位月份＋两位日期输入。':'解锁码不一致。请对照提示卡上的四位数重新输入；没有次数惩罚。'};
 return {ok:true,message:id==='laptop'?'相册已打开。四月十七日的订婚照片与原主留下的声音仍保存在电脑里，萨拉马斯正在等卡斯蒂安的反应。':'联系人已解锁。提图斯按照卡斯蒂安的要求拨给萨拉马斯，返回房间可以继续这通电话。'};
}
export const evidencePages={
 laptop:[
  {id:'archive-mail',app:'邮件',title:'相册归档 · 四月十七日',text:'收件人：萨拉马斯\n主题：订婚晚餐的照片\n\n四月十七日的原图和那段录音都已放进相册。仍用当晚的日期作密码：两位月份在前，两位日期在后。\n\n录音里还有餐厅的声音，没有另外处理。你说想把那天完整留下来。'},
  {id:'study-notes',app:'便签',title:'卡斯蒂安想知道的事',text:'萨拉马斯把电脑放在两个人都能看清的位置。\n\n卡斯蒂安已经记住，“电脑”才是这里正确的称呼。他想再看一次戒指，也想知道照片里那个人怎样和萨拉马斯说话。\n\n四月十七日。月、日各占两位，一共四位。'},
  {id:'archive-file',app:'相册',title:'加密相册 · engagement.album',text:'订婚照片与短录音。\n\n密码是四位月日，由萨拉马斯代为输入。打开相册以后，可以继续听两个人在书房里的谈话。'}
 ],
 phone:[
  {id:'clinic-card',app:'提示卡',title:'提图斯写下的解锁提示',text:'萨拉马斯 · 已保存的联系人\n联系人解锁码：4821\n\n提图斯怕卡斯蒂安记不住新手机的设置，把四位数写在桌边。想打电话便叫他过来，不用自己操作。'},
  {id:'phone-messages',app:'消息',title:'今天的约定',text:'萨拉马斯：会面结束以后告诉我，我处理完事情就去接你。\n\n卡斯蒂安已经等了两天。他不想催得太急，却始终不能把“会回来”和“已经到了”当成同一件事。\n\n他想请提图斯拨通电话，问一句什么时候出发。'},
  {id:'phone-contacts',app:'联系人',title:'萨拉马斯 · 等待拨出',text:'联系人已经保存，四位解锁码在桌上的提示卡里。\n\n提图斯负责按键与拨号，卡斯蒂安可以直接与电话另一端说话。通话仅在游戏剧情中发生。'}
 ]
};
export const timelineCards=[
 {time:'00:12',title:'进入囚所',text:'银色装甲的脚步进入走廊，通讯里报告找到目标房间。'},
 {time:'00:18',title:'确认卡斯蒂安身份',text:'提图斯反复叫出姓名，等待卡斯蒂安对自己的声音作出回应。'},
 {time:'00:24',title:'协助撤离',text:'卡斯蒂安被转移离开囚所，队伍回到运输载具。'},
 {time:'01:03',title:'医疗舱苏醒',text:'战舰药剂设备开始记录清醒后的指标，提图斯在床边确认位置。'}
];
