import Phaser from 'phaser';
import {asset} from '../systems/assets';
import {story} from '../systems/state';
import type { Hotspot, Perspective, SceneId } from '../types';
export class RoomScene extends Phaser.Scene {
  private picture?:Phaser.GameObjects.Image;
  private actor?:Phaser.GameObjects.Image;
  private markers:Phaser.GameObjects.Container[]=[];
  private current:SceneId='hospital';
  private perspective:Perspective='objective';
  private inspected:string[]=[];
  private reduced=false;
  private ready=false;
  private elapsed=0;
  private renderKey='';
  constructor(private onInspect:(o:Hotspot)=>void,private onReady:()=>void){super('room');}
  preload():void {
    for(const scene of story.scenes)this.load.svg(scene.id,asset(`art/${scene.id}.svg`),{width:1600,height:900});
    for(const id of ['titus','doctor','thalamas'])this.load.image(id,asset(`art/${id==='titus'?'titus-standing':id}.png`));
  }
  create():void {
    this.picture=this.add.image(800,450,this.current).setDisplaySize(1600,900);
    this.actor=this.add.image(1390,700,'titus').setOrigin(.5,1);
    this.ready=true;this.showRoom(this.current,this.perspective,this.inspected,this.reduced);this.onReady();
  }
  showRoom(id:SceneId,perspective:Perspective,inspected:string[],reduced:boolean):void {
    const changed=this.current!==id;
    this.current=id;this.perspective=perspective;this.inspected=inspected;this.reduced=reduced;
    if(!this.ready||!this.picture)return;
    const key=JSON.stringify([id,perspective,inspected,reduced]);
    // Opening an HTML panel only pauses input. Do not discard live hit areas
    // and replace them with pending Phaser objects during modal focus changes.
    if(key===this.renderKey)return;
    this.renderKey=key;
    this.picture.setTexture(id).setDisplaySize(1600,900).clearTint();
    if(perspective==='subjective')this.picture.setTint(0xb9b3d3);
    const placements:Partial<Record<SceneId,[number,number,number]>>={hospital:[1390,700,410],corridor:[1320,720,450],living:[202,710,420],bedroom:[1450,690,420],assessment:[1344,700,465],penthouse:[1408,760,510]};
    const placement=placements[id];
    if(this.actor){
      this.actor.setVisible(!!placement);
      if(placement){
        const [x,y,height]=placement;
        const actor=story.scenes.find(s=>s.id===id)!.actor;
        if(actor!=='none')this.actor.setTexture(actor);
        this.actor.setPosition(x,y).setDisplaySize(height*2/3,height);
        this.actor.setTint(perspective==='subjective'?0x9ba6bb:0xd3dfe1).setAlpha(.94);
      }
    }
    for(const marker of this.markers){this.tweens.killTweensOf(marker);marker.destroy();}this.markers=[];
    for(const [i,o] of story.scenes.find(s=>s.id===id)!.objects.entries()){
      const seen=inspected.includes(o.id),x=o.x*1600,y=o.y*900;
      const ring=this.add.circle(0,0,18,0x10252d,.8).setStrokeStyle(1.5,seen?0x74868b:0xc1d5cd,.85);
      const cross=this.add.text(0,-1,seen?'·':'+',{fontFamily:'monospace',fontSize:'23px',color:'#d0dfd8'}).setOrigin(.5);
      const label=this.add.text(0,31,o.name,{fontFamily:'"Noto Sans CJK SC", sans-serif',fontSize:'19px',color:'#dae1dc',backgroundColor:'#0b1720',padding:{x:10,y:6}}).setOrigin(.5,0);
      const container=this.add.container(x,y,[ring,cross,label]);
      const zone=this.add.zone(0,10,Math.max(90,o.name.length*22),100).setInteractive({useHandCursor:true});container.add(zone);
      zone.on('pointerover',()=>{ring.setFillStyle(0x769b96,.8);label.setColor('#ffffff');});
      zone.on('pointerout',()=>{ring.setFillStyle(0x10252d,.8);label.setColor('#dae1dc');});
      zone.on('pointerdown',()=>this.onInspect(o));
      this.markers.push(container);
      if(!reduced&&!seen)this.tweens.add({targets:ring,alpha:.5,duration:1700+i*150,yoyo:true,repeat:-1});
    }
    if(changed&&!reduced)this.cameras.main.fadeIn(450,7,15,22);
  }
  update(_time:number,delta:number):void {
    this.elapsed+=delta;
    if(this.picture){
      this.picture.y=450+(this.reduced?0:Math.sin(this.elapsed/3500)*1.2);
      this.picture.rotation=this.reduced||this.perspective==='objective'?0:Math.sin(this.elapsed/2100)*.0008;
    }
  }
  horror():void {
    if(!this.ready||this.reduced)return;
    this.cameras.main.shake(280,.0018);this.cameras.main.flash(110,69,80,100,false);
    const ghost=this.add.text(800,360,'你记得的，不是他们记得的。',{fontFamily:'serif',fontSize:'42px',color:'#c0b1c9',letterSpacing:8}).setOrigin(.5).setAlpha(.55);
    this.tweens.add({targets:ghost,alpha:0,duration:650,onComplete:()=>ghost.destroy()});
  }
}
export function createGame(parent:HTMLElement,scene:RoomScene):Phaser.Game {
  return new Phaser.Game({type:Phaser.AUTO,parent,width:1600,height:900,backgroundColor:'#0c1923',
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene],
    render:{antialias:true,powerPreference:'low-power'},audio:{noAudio:true},banner:false});
}
