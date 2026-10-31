/** All sounds synthesized locally; gain limited, no autoplay before consent. */
export class Soundscape {
  private context?:AudioContext;
  private master?:GainNode;
  private hum?:OscillatorNode;
  private enabled=false;
  enable(value:boolean):void {
    this.enabled=value;
    if(value){
      this.context ??= new AudioContext();
      if(!this.master){
        this.master=this.context.createGain();this.master.gain.value=.07;this.master.connect(this.context.destination);
        this.hum=this.context.createOscillator();this.hum.type='sine';this.hum.frequency.value=54;this.hum.connect(this.master);this.hum.start();
      }
      void this.context.resume();
    }else if(this.context){void this.context.suspend();}
  }
  cue(kind:'memory'|'horror'|'click'):void {
    if(!this.enabled||!this.context||!this.master)return;
    const c=this.context,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
    o.type=kind==='horror'?'triangle':'sine';
    o.frequency.setValueAtTime(kind==='memory'?523:kind==='horror'?113:280,t);
    o.frequency.exponentialRampToValueAtTime(kind==='horror'?47:kind==='memory'?261:170,t+.35);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(kind==='horror'?.23:.11,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+.65);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.7);
  }
}
