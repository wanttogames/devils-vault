import { soundProfileForRisk, type VaultSoundRiskLevel } from './AudioProfile';

export type VaultAudioScene='menu'|'vault'|'whisper'|'result';
export type VaultAudioCue='ui'|'focus'|'chest-open'|'door'|'gold'|'treasure'|'multiplier'|'relic'|'curse'|'ruin'|'jackpot'|'whisper'|'contract'|'reject'|'escape'|'blocked'|'reward';

export class VaultAudio{
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private ambience:GainNode|null=null;
 private effects:GainNode|null=null;
 private droneA:OscillatorNode|null=null;
 private droneB:OscillatorNode|null=null;
 private noiseFilter:BiquadFilterNode|null=null;
 private heartbeat:number|null=null;
 private heartbeatMs=0;
 private enabled=true;
 private unlocked=false;
 private scene:VaultAudioScene='menu';
 private risk=0;
 private lastLevel:VaultSoundRiskLevel='quiet';
 private focusAt=0;

 setEnabled(enabled:boolean):void{
  this.enabled=enabled;
  if(this.master&&this.context)this.master.gain.setTargetAtTime(enabled?0.8:0,this.context.currentTime,.04);
  if(enabled&&this.unlocked){this.ensureAmbience();this.applyMix();}
  if(!enabled)this.stopHeartbeat();
 }

 unlock():void{
  if(!this.enabled)return;this.unlocked=true;const ctx=this.ensureContext();if(!ctx)return;
  if(ctx.state==='suspended')void ctx.resume();this.ensureAmbience();this.applyMix();
 }

 setScene(scene:VaultAudioScene,risk=0):void{
  const previous=this.lastLevel;this.scene=scene;this.risk=Number.isFinite(risk)?Math.max(0,Math.min(100,risk)):0;
  const profile=soundProfileForRisk(this.risk);this.lastLevel=profile.level;
  if(this.unlocked&&this.enabled){this.ensureAmbience();this.applyMix();if(scene==='vault'&&this.rank(profile.level)>this.rank(previous))this.cue('blocked');}
 }

 tone(freq:number,duration:number):void{this.osc(freq,Math.max(.04,duration),'sine',.035);}

 cue(name:VaultAudioCue):void{
  if(!this.enabled||!this.unlocked)return;const ctx=this.ensureContext();if(!ctx)return;
  switch(name){
   case'ui':this.osc(330,.045,'triangle',.018);break;
   case'focus':{const now=performance.now();if(now-this.focusAt<180)return;this.focusAt=now;this.osc(145,.055,'sine',.018);this.osc(218,.04,'triangle',.008,.018);break;}
   case'chest-open':this.noiseBurst(.075,.055,620);this.osc(92,.16,'sine',.055);this.osc(184,.08,'square',.018,.05);break;
   case'door':this.noiseBurst(.16,.045,280);this.osc(74,.24,'sine',.055);break;
   case'gold':this.chime([392,523,659],.035,.08);break;
   case'treasure':this.chime([262,392,523,784],.04,.11);break;
   case'multiplier':this.chime([220,330,495],.035,.07);break;
   case'relic':this.chime([196,294,440,587],.03,.12);this.noiseBurst(.12,.018,1500);break;
   case'curse':this.osc(180,.24,'sawtooth',.035);this.osc(123,.3,'sine',.045,.05);break;
   case'ruin':this.noiseBurst(.38,.09,190);this.slide(92,38,.62,'sawtooth',.065);this.osc(43,.7,'sine',.075);break;
   case'jackpot':this.chime([392,523,659,784,1047],.055,.075);this.noiseBurst(.18,.04,2200);window.setTimeout(()=>this.chime([523,659,784,1047],.045,.06),180);break;
   case'whisper':this.noiseBurst(.32,.026,720);this.slide(132,88,.55,'sine',.038);this.osc(66,.65,'triangle',.028);break;
   case'contract':this.osc(88,.28,'sine',.06);this.chime([176,264,352],.03,.09);break;
   case'reject':this.slide(240,150,.18,'triangle',.026);break;
   case'escape':this.chime([262,330,392,523],.045,.11);break;
   case'blocked':this.osc(58,.16,'square',.045);this.osc(46,.22,'sine',.05,.07);break;
   case'reward':this.chime([330,440],.025,.08);break;
  }
 }

 private ensureContext():AudioContext|null{
  if(this.context)return this.context;
  try{
   const ctx=new AudioContext(),master=ctx.createGain(),ambience=ctx.createGain(),effects=ctx.createGain();
   master.gain.value=this.enabled?0.8:0;ambience.gain.value=0;effects.gain.value=.72;
   ambience.connect(master);effects.connect(master);master.connect(ctx.destination);
   this.context=ctx;this.master=master;this.ambience=ambience;this.effects=effects;return ctx;
  }catch{return null;}
 }

 private ensureAmbience():void{
  const ctx=this.ensureContext();if(!ctx||!this.ambience||this.droneA)return;
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=260;filter.Q.value=.8;filter.connect(this.ambience);
  const a=ctx.createOscillator(),b=ctx.createOscillator();a.type='sine';b.type='triangle';a.frequency.value=43;b.frequency.value=64.5;
  const ag=ctx.createGain(),bg=ctx.createGain();ag.gain.value=.65;bg.gain.value=.12;a.connect(ag).connect(filter);b.connect(bg).connect(filter);a.start();b.start();this.droneA=a;this.droneB=b;
  const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.42;
  const noise=ctx.createBufferSource(),nf=ctx.createBiquadFilter(),ng=ctx.createGain();noise.buffer=buffer;noise.loop=true;nf.type='bandpass';nf.frequency.value=420;nf.Q.value=.5;ng.gain.value=.15;noise.connect(nf).connect(ng).connect(filter);noise.start();this.noiseFilter=nf;
 }

 private applyMix():void{
  const ctx=this.context;if(!ctx||!this.ambience)return;const p=soundProfileForRisk(this.risk),now=ctx.currentTime;
  const sceneScale=this.scene==='vault'?1:this.scene==='whisper'?1.18:this.scene==='menu'?0.42:0.2;
  this.ambience.gain.setTargetAtTime((p.droneGain+p.noiseGain)*sceneScale,now,.18);
  if(this.noiseFilter)this.noiseFilter.frequency.setTargetAtTime(p.lowpassHz,now,.25);
  if(this.droneB)this.droneB.detune.setTargetAtTime(this.scene==='whisper'?-24:p.risk*.32,now,.25);
  if((this.scene==='vault'||this.scene==='whisper')&&p.risk>=15)this.startHeartbeat(p.heartbeatMs);else this.stopHeartbeat();
 }

 private startHeartbeat(interval:number):void{
  if(this.heartbeat!==null&&Math.abs(this.heartbeatMs-interval)<70)return;this.stopHeartbeat();this.heartbeatMs=interval;this.pulse();this.heartbeat=window.setInterval(()=>this.pulse(),interval);
 }

 private stopHeartbeat():void{if(this.heartbeat!==null){window.clearInterval(this.heartbeat);this.heartbeat=null;}this.heartbeatMs=0;}

 private pulse():void{
  if(!this.enabled||!this.unlocked||!(this.scene==='vault'||this.scene==='whisper'))return;const p=soundProfileForRisk(this.risk),strength=.018+Math.min(.05,p.risk/1500);
  this.osc(57,.11,'sine',strength);window.setTimeout(()=>this.osc(49,.13,'sine',strength*.78),115);
 }

 private osc(freq:number,duration:number,type:OscillatorType='sine',gainValue=.03,delay=0):void{
  const ctx=this.ensureContext();if(!ctx||!this.effects||!this.enabled)return;const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+delay,end=start+duration;
  osc.type=type;osc.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,gainValue),start+.012);gain.gain.exponentialRampToValueAtTime(.0001,end);
  osc.connect(gain).connect(this.effects);osc.start(start);osc.stop(end+.02);
 }

 private slide(from:number,to:number,duration:number,type:OscillatorType,gainValue:number):void{
  const ctx=this.ensureContext();if(!ctx||!this.effects||!this.enabled)return;const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime,end=start+duration;
  osc.type=type;osc.frequency.setValueAtTime(from,start);osc.frequency.exponentialRampToValueAtTime(Math.max(1,to),end);gain.gain.setValueAtTime(gainValue,start);gain.gain.exponentialRampToValueAtTime(.0001,end);
  osc.connect(gain).connect(this.effects);osc.start(start);osc.stop(end+.02);
 }

 private chime(notes:number[],gain=.035,spacing=.08):void{notes.forEach((note,i)=>this.osc(note,.18+i*.015,'sine',gain,spacing*i));}

 private noiseBurst(duration:number,gainValue:number,frequency:number):void{
  const ctx=this.ensureContext();if(!ctx||!this.effects||!this.enabled)return;const length=Math.max(1,Math.floor(ctx.sampleRate*duration)),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.value=gainValue;source.connect(filter).connect(gain).connect(this.effects);source.start();
 }

 private rank(level:VaultSoundRiskLevel):number{return['quiet','watch','danger','severe','critical'].indexOf(level);}
}
