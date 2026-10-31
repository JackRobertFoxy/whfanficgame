import Phaser from 'phaser';
import {asset} from '../systems/assets';
import {story} from '../systems/state';
import type {Hotspot,Perspective,SceneId,CharacterId} from '../types';
export class RoomScene extends Phaser.Scene {
 private picture?:Phaser.GameObjects.Image;
 private actor?:Phaser.GameObjects.Image;
 private hero?:Phaser.GameObjects.Image;
 private shadow?:Phaser.GameObjects.Ellipse;
 private markers:Phaser.GameObjects.Container[]=[];
 private motes:Phaser.GameObjects.Rectangle[]=[];
 private current:SceneId='hospital';private perspective:Perspective='objective';private inspected:string[]=[];
 private reduced=false;private ready=false;private pausedPresentation=false;private elapsed=0;private renderKey='';
 private moving=false;private actorY=700;private actorHeight=410;private heroY=770;
 constructor(private onInspect:(o:Hotspot)=>void,private onReady:()=>void){super('room');}
 preload():void {
  for(const scene of story.scenes)this.load.svg(scene.id,asset(`art/${scene.id}.svg`),{width:1600,height:900});
  for(const id of ['castian','titus','doctor','thalamas','castian-armour','titus-armour','thalamas-armour'])this.load.image(id,asset(`art/${id==='titus'?'titus-standing':id}.png`));
  this.load.on('loaderror',()=>this.game.events.emit('asset-error'));
 }
 create():void {
  this.picture=this.add.image(800,450,this.current).setDisplaySize(1600,900).setDepth(0);
  this.shadow=this.add.ellipse(1390,695,180,28,0x020911,.45).setDepth(2);
  this.actor=this.add.image(1390,700,'titus').setOrigin(.5,1).setDepth(3);
  this.hero=this.add.image(390,770,'castian-armour').setOrigin(.5,1).setDepth(4).setVisible(false);
  for(let i=0;i<35;i++)this.motes.push(this.add.rectangle((i*173)%1600,(i*97)%900,1,i%3===0?20:4,0xa9bec3,.09).setDepth(1));
  this.input.on('pointerdown',(pointer:Phaser.Input.Pointer,over:Phaser.GameObjects.GameObject[])=>{if(!over.length&&pointer.y>590)this.approach(pointer.x);});
  this.input.keyboard?.on('keydown',(e:KeyboardEvent)=>{
   if(!this.input.enabled||['INPUT','SELECT','TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName))return;
   if(['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)){e.preventDefault();this.nudge(e.key==='ArrowLeft'||e.key.toLowerCase()==='a'?-1:1);}
  });
  this.ready=true;this.showRoom(this.current,this.perspective,this.inspected,this.reduced);this.onReady();
 }
 setPresentationPaused(value:boolean):void {this.pausedPresentation=value;if(this.ready)this.tweens.timeScale=value?0:1;}
 private controlled():Phaser.GameObjects.Image|undefined{return this.current==='past_armoury'?this.hero:this.actor;}
 nudge(direction:number):void {if(!this.ready||this.pausedPresentation)return;const actor=this.controlled();if(actor?.visible)this.approach(actor.x+direction*140);}
 approach(x:number):void {
  if(!this.ready||this.pausedPresentation)return;const target=this.controlled();if(!target?.visible)return;
  const maxX=this.current==='past_armoury'&&this.actor?this.actor.x-260:1450;
  const destination=Phaser.Math.Clamp(x,150,maxX);
  this.tweens.killTweensOf(target);const dx=destination-target.x;
  if(Math.abs(dx)<4)return;
  this.moving=true;
  this.tweens.add({targets:target,x:destination,duration:Phaser.Math.Clamp(Math.abs(dx)*1.8,300,1400),ease:'Sine.easeInOut',onComplete:()=>{this.moving=false;target.rotation=0;}});
 }
 showRoom(id:SceneId,perspective:Perspective,inspected:string[],reduced:boolean):void {
  const changed=this.current!==id;this.current=id;this.perspective=perspective;this.inspected=inspected;this.reduced=reduced;
  if(!this.ready||!this.picture)return;
  const key=JSON.stringify([id,perspective,inspected,reduced]);if(key===this.renderKey)return;this.renderKey=key;
  this.picture.setTexture(id).setDisplaySize(1600,900).clearTint();if(perspective==='subjective')this.picture.setTint(0xb9b3d3);
  const s=story.scenes.find(s=>s.id===id)!;
  const placements:Partial<Record<SceneId,[number,number,number]>>={hospital:[1390,700,410],homecoming:[1320,760,480],sleepless:[1330,760,480],corridor:[1320,720,450],living:[202,710,420],bedroom:[1450,690,420],assessment:[1344,700,465],penthouse:[1408,760,510],past_armoury:[1310,765,565],past_cell:[1360,780,590],past_rescue:[1360,750,550],study:[1320,760,480],penthouse_night:[1330,760,490]};
  const placement=placements[id];
  this.actor?.setVisible(!!placement);this.shadow?.setVisible(!!placement);
  if(placement&&this.actor){
   const [x,y,height]=placement;
   if(s.actor!=='none')this.actor.setTexture(s.actor as CharacterId);
   this.actorY=y;this.actorHeight=height;
   if(changed||this.actor.displayHeight===0){this.tweens.killTweensOf(this.actor);this.actor.setPosition(x,y);this.moving=false;}
   this.actor.setDisplaySize(height*2/3,height).setTint(perspective==='subjective'?0x9ba6bb:0xd3dfe1).setAlpha(.96);
  }
  this.hero?.setVisible(id==='past_armoury');if(this.hero&&id==='past_armoury'){this.hero.setDisplaySize(365,548);if(changed)this.hero.setPosition(390,this.heroY);}
  for(const marker of this.markers){this.tweens.killTweensOf(marker);marker.destroy();}this.markers=[];
  for(const [i,o]of s.objects.entries()){
   const seen=inspected.includes(o.id),x=o.x*1600,y=o.y*900;
   const ring=this.add.circle(0,0,18,0x10252d,.8).setStrokeStyle(1.5,seen?0x74868b:s.era==='past'?0xc8af7d:0xc1d5cd,.85);
   const cross=this.add.text(0,-1,seen?'·':o.puzzle?'◇':'+',{fontFamily:'monospace',fontSize:'23px',color:'#d0dfd8'}).setOrigin(.5);
   const label=this.add.text(0,31,o.name,{fontFamily:'"Noto Sans CJK SC",sans-serif',fontSize:'19px',color:'#dae1dc',backgroundColor:'#0b1720',padding:{x:10,y:6}}).setOrigin(.5,0);
   const container=this.add.container(x,y,[ring,cross,label]).setDepth(10);
   const zone=this.add.zone(0,10,Math.max(90,o.name.length*22),100).setInteractive({useHandCursor:true});container.add(zone);
   zone.on('pointerover',()=>ring.setFillStyle(0x769b96,.8));zone.on('pointerout',()=>ring.setFillStyle(0x10252d,.8));zone.on('pointerdown',()=>this.onInspect(o));
   this.markers.push(container);if(!reduced&&!seen)this.tweens.add({targets:ring,alpha:.55,duration:1700+i*150,yoyo:true,repeat:-1});
  }
  for(const m of this.motes)m.setVisible(!reduced);
  if(changed&&!reduced)this.cameras.main.fadeIn(500,7,15,22);
 }
 update(_time:number,delta:number):void {
  if(this.pausedPresentation)return;this.elapsed+=delta;
  if(this.picture){this.picture.y=450+(this.reduced?0:Math.sin(this.elapsed/3500)*1.2);this.picture.rotation=this.reduced||this.perspective==='objective'?0:Math.sin(this.elapsed/2100)*.0008;}
  const target=this.controlled();
  if(target?.visible){const y=this.current==='past_armoury'?this.heroY:this.actorY;target.y=y+(this.reduced?0:this.moving?Math.abs(Math.sin(this.elapsed/85))*-5:Math.sin(this.elapsed/1700)*1.5);target.rotation=this.reduced?0:this.moving?Math.sin(this.elapsed/100)*.009:0;}
  if(target?.visible)this.game.canvas.dataset.actorX=String(Math.round(target.x));
  if(this.shadow&&this.actor)this.shadow.setPosition(this.actor.x,this.actorY-4);
  if(!this.reduced)for(const [i,m]of this.motes.entries()){m.y+=delta*(this.current.startsWith('past_')?.011:.025)*(1+i%3);m.x+=Math.sin(this.elapsed/1800+i)*.06;if(m.y>870)m.y=40;}
 }
 horror():void {
  if(!this.ready||this.reduced)return;this.cameras.main.shake(280,.0018);this.cameras.main.flash(110,69,80,100,false);
  const ghost=this.add.text(800,360,'那时的声音，正在覆盖眼前的房间。',{fontFamily:'serif',fontSize:'38px',color:'#c0b1c9',letterSpacing:5}).setOrigin(.5).setAlpha(.55).setDepth(20);
  this.tweens.add({targets:ghost,alpha:0,duration:650,onComplete:()=>ghost.destroy()});
 }
}
export function createGame(parent:HTMLElement,scene:RoomScene):Phaser.Game {
 const game=new Phaser.Game({type:Phaser.AUTO,parent,width:1600,height:900,backgroundColor:'#0c1923',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene],render:{antialias:true,powerPreference:'low-power'},audio:{noAudio:true},banner:false});
 game.events.on('asset-error',()=>{const loading=document.getElementById('loading');if(loading){loading.hidden=false;loading.textContent='有场景素材未能加载，请保持联网后刷新；当前存档不会被删除。';}});return game;
}
