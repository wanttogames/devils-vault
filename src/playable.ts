import Phaser from 'phaser';
export { scene as activeVaultScene };
import './playable.css';
import { PlayerVisual } from './game/entities/Player';
import { WorldTextLayer } from './game/ui/WorldText';
import { playerSkin, type Facing } from './game/art/playerSprites';
import { registerVaultArt, drawVaultRoom } from './game/art/vaultSprites';

type Kind='chest'|'continue'|'escape';
type Chest={source:HTMLButtonElement;tier:string;title:string;risk:string;clue:string;revealed:boolean;selected:boolean};
type Door={source:HTMLButtonElement;kind:'continue'|'escape';title:string;subtitle:string};
type Room={host:HTMLElement;theme:string;floor:string;title:string;risk:number;riskLevel:string;chests:Chest[];doors:Door[]};
type Target={kind:Kind;x:number;y:number;r:number;title:string;subtitle:string;source:HTMLButtonElement;view:Phaser.GameObjects.Container;sprite:Phaser.GameObjects.Sprite;glow:Phaser.GameObjects.Ellipse};

const input={x:0,y:0};
let game:any=null,scene:VaultScene|null=null,host:HTMLElement|null=null,cleanupControls:(()=>void)|null=null,queued=false;
let preserve:{x:number;y:number;facing:Facing}|null=null;
const tierColor:Record<string,number>={common:0x8f8178,uncommon:0xb9c6c8,rare:0xe4b457,epic:0xb34d55,legendary:0xd59b34,mythic:0xd6b4ff};
const themes:Record<string,[number,number,number]>={forgotten:[0x191411,0x433027,0xb68a55],greed:[0x19150d,0x4c371c,0xe2b34f],blood:[0x180c0d,0x4c191e,0xd65454],cursed:[0x100f14,0x30243b,0xa974d6],devil:[0x120b09,0x48180f,0xe28542]};
const text=(root:ParentNode,selector:string,fallback='')=>root.querySelector<HTMLElement>(selector)?.textContent?.trim()||fallback;

function snapshot(el:HTMLElement):Room{
 const chests=[...el.querySelectorAll<HTMLButtonElement>('[data-chest]')].map((source,i):Chest=>({
  source,tier:text(source,'.tier-label','common').toLowerCase(),title:text(source,'.chest-body b',`SEAL ${String.fromCharCode(65+i)}`),
  risk:text(source,'.chest-risk','위험 미확인'),clue:text(source,'.chest-clue','봉인된 기운'),revealed:source.disabled||source.classList.contains('revealed'),selected:source.classList.contains('selected')
 }));
 const doors:Door[]=[];
 const next=document.querySelector<HTMLButtonElement>('[data-action="continue"]'),exit=document.querySelector<HTMLButtonElement>('[data-action="escape"]');
 if(next)doors.push({source:next,kind:'continue',title:'DEEPER',subtitle:'더 깊은 금고로'});
 if(exit)doors.push({source:exit,kind:'escape',title:'ESCAPE',subtitle:'현재 보상을 확정'});
 const rawRisk=Number(el.dataset.risk??0),risk=Number.isFinite(rawRisk)?Math.max(0,Math.min(100,rawRisk)):0;
 return{host:el,theme:document.documentElement.dataset.floor||'forgotten',floor:text(document,'.floor-hud strong','B1'),title:text(document,'.special-banner h3',text(document,'.game-heading h2','INNER VAULT')),risk,riskLevel:el.dataset.riskLevel||'calm',chests,doors};
}

class VaultScene extends Phaser.Scene{
 private textLayer!:WorldTextLayer;private room:Room;private player:any;private visual!:PlayerVisual;private interacting=false;private keys!:Record<string,any>;private targets:Target[]=[];private near:Target|null=null;private prompt:any;private info:any;private blockers:any[]=[];
 constructor(room:Room){super({key:`vault-world-${Date.now()}-${Math.random()}`});this.room=room;}
 create():void{
  scene=this;const w=this.scale.width,h=this.scale.height,[,,accent]=themes[this.room.theme]||themes.forgotten!;this.textLayer=new WorldTextLayer(this,this.room.host,w,h);registerVaultArt(this);this.blockers=drawVaultRoom(this,w,h,this.room.theme);this.addRiskAtmosphere(w,h);
  this.textLayer.text(w/2,27,`${this.room.floor} · ${this.room.title}`,{fontFamily:'Georgia,serif',fontSize:`${Math.max(13,Math.min(20,w/48))}px`,color:'#efdab6',wordWrap:{width:w-48}}).setOrigin(.5).setDepth(20);
  const xs=this.room.chests.length===1?[.5]:this.room.chests.length===2?[.36,.64]:[.22,.5,.78];this.room.chests.forEach((c,i)=>this.addChest(c,w*(xs[i]??.5),h*.32,i));
  const dx=this.room.doors.length>1?[.28,.72]:[.5];this.room.doors.forEach((d,i)=>this.addDoor(d,w*(dx[i]??.5),h*(w<600?.60:.72)));
  const spawn=preserve;preserve=null;this.player=this.add.container(w*(spawn?.x??.5),h*(spawn?.y??(this.room.doors.length?.48:.76))).setDepth(30);
  this.visual=new PlayerVisual(this,this.player,accent,playerSkin(document.querySelector<HTMLElement>('.run-identity')?.dataset.playerSkin));if(spawn){this.visual.facing=spawn.facing;this.visual.update(0,0,0,16);}
  this.prompt=this.textLayer.text(w/2,h-54,'',{fontFamily:'Georgia,serif',fontSize:w<600?'12px':'15px',color:'#f5d69a',backgroundColor:'rgba(10,7,6,.86)',padding:{x:12,y:7}}).setOrigin(.5).setDepth(40).setVisible(false);
  this.info=this.textLayer.text(w/2,h-28,'',{fontFamily:'Arial,sans-serif',fontSize:w<600?'12px':'13px',color:'#cbbca8',align:'center',wordWrap:{width:Math.min(340,w-40)}}).setOrigin(.5,0).setDepth(40).setVisible(false);
  this.keys=this.input.keyboard?.addKeys({W:Phaser.Input.Keyboard.KeyCodes.W,A:Phaser.Input.Keyboard.KeyCodes.A,S:Phaser.Input.Keyboard.KeyCodes.S,D:Phaser.Input.Keyboard.KeyCodes.D,UP:Phaser.Input.Keyboard.KeyCodes.UP,DOWN:Phaser.Input.Keyboard.KeyCodes.DOWN,LEFT:Phaser.Input.Keyboard.KeyCodes.LEFT,RIGHT:Phaser.Input.Keyboard.KeyCodes.RIGHT,E:Phaser.Input.Keyboard.KeyCodes.E,SPACE:Phaser.Input.Keyboard.KeyCodes.SPACE}) as Record<string,any>;
  let resizeTimer:Phaser.Time.TimerEvent|null=null;
  const resize=()=>{if(Math.abs(this.scale.width-w)<2&&Math.abs(this.scale.height-h)<2)return;resizeTimer?.remove();resizeTimer=this.time.delayedCall(120,()=>{if(this.interacting){resize();return;}preserve={x:this.player.x/w,y:this.player.y/h,facing:this.visual.facing};if(this.room.host.isConnected)mount(this.room.host);});};
  this.scale.on(Phaser.Scale.Events.RESIZE,resize);
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.scale.off(Phaser.Scale.Events.RESIZE,resize);if(scene===this)scene=null;});
 }
 private addRiskAtmosphere(w:number,h:number):void{
  const risk=Phaser.Math.Clamp(this.room.risk,0,100);if(risk<15)return;const level=this.room.riskLevel,color=level==='watch'?0xa85a32:level==='danger'?0xb4372f:0xd12626,strength=Phaser.Math.Clamp((risk-10)/70,.08,.82);
  const veil=this.add.rectangle(w/2,h/2,w,h,color,.025+strength*.07).setDepth(6),frame=this.add.rectangle(w/2,h/2,Math.max(40,w-10),Math.max(40,h-10)).setStrokeStyle(level==='extreme'?3:2,color,.12+strength*.32).setDepth(28);
  const reduced=document.documentElement.classList.contains('reduce-motion')||window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced)return;
  if(level==='danger'||level==='extreme')this.tweens.add({targets:[veil,frame],alpha:{from:.56,to:1},duration:level==='extreme'?720:1250,yoyo:true,repeat:-1,ease:'Sine.InOut'});
  const motes=level==='extreme'?9:level==='danger'?5:2;for(let i=0;i<motes;i++){const x=((i*97+41)%100)/100*w,y=h*(.72+((i*23)%20)/100),mote=this.add.rectangle(x,y,level==='extreme'?3:2,level==='extreme'?3:2,color,.32+strength*.3).setDepth(7);this.tweens.add({targets:mote,y:h*(.18+((i*19)%30)/100),x:x+((i%2?1:-1)*(10+(i%3)*7)),alpha:0,duration:2100+(i%4)*360,delay:i*120,repeat:-1,repeatDelay:220+(i%3)*130});}
 }
 private addChest(c:Chest,x:number,y:number,i:number):void{
  const compact=this.scale.width<600,scale=compact?2:3,color=tierColor[c.tier]??tierColor.common!,view=this.add.container(x,y).setDepth(12);
  const glow=this.add.ellipse(0,25,38*scale,14*scale,color,c.selected?.26:.08);
  const sprite=this.add.sprite(0,0,`vault-chest-${c.tier in tierColor?c.tier:'common'}`,c.revealed?2:0).setScale(scale);
  this.textLayer.text(x,y-(compact?49:66),c.tier.toUpperCase(),{fontFamily:'monospace',fontSize:compact?'11px':'12px',color:'#efdab6',wordWrap:{width:compact?88:140}}).setOrigin(.5);
  const name=this.textLayer.text(x,y+(compact?39:56),c.revealed?c.title:`SEAL ${String.fromCharCode(65+i)}`,{fontFamily:'monospace',fontSize:compact?'12px':'13px',color:c.selected?'#ffe6a6':'#cdbfa9',align:'center',wordWrap:{width:compact?82:125}}).setOrigin(.5,0);
  view.add([glow,sprite]);
  if(c.selected){name.setAlpha(0);this.tweens.add({targets:name,alpha:1,y:name.y-3,delay:120,duration:180});this.time.delayedCall(100,()=>sprite.setFrame(3));this.tweens.add({targets:glow,alpha:.12,duration:700,yoyo:true,repeat:-1});this.rewardSpark(x,y,color);}
  this.targets.push({kind:'chest',x,y:y+20,r:Math.max(62,Math.min(108,this.scale.width*.1)),title:c.title,subtitle:c.revealed?(c.selected?'당신이 연 상자':'NEAR MISS'):`${c.risk} · ${c.clue}`,source:c.source,view,sprite,glow});
 }
 private rewardSpark(x:number,y:number,color:number):void{
  for(let i=0;i<8;i++){const angle=i*Math.PI/4,particle=this.add.rectangle(Math.round(x+Math.cos(angle)*9),Math.round(y+Math.sin(angle)*5),3,3,color,.85).setDepth(25);this.tweens.add({targets:particle,x:Math.round(x+Math.cos(angle)*35),y:Math.round(y-18+Math.sin(angle)*24),alpha:0,duration:380,delay:i*18,onComplete:()=>particle.destroy()});}
 }
 private addDoor(d:Door,x:number,y:number):void{
  const compact=this.scale.width<600,scale=compact?2:3,color=d.kind==='escape'?0xf3d899:0xe56b51,view=this.add.container(x,y).setDepth(11);
  const glow=this.add.ellipse(0,45,40*scale,15*scale,color,.10),sprite=this.add.sprite(0,0,`vault-door-${d.kind}`).setScale(scale);
  view.add([glow,sprite]);this.textLayer.text(x,y+(compact?60:88),d.title,{fontFamily:'monospace',fontSize:compact?'12px':'13px',color:d.kind==='escape'?'#f7dfa3':'#f5a18a'}).setOrigin(.5);
  this.targets.push({kind:d.kind,x,y,r:Math.max(68,Math.min(115,this.scale.width*.115)),title:d.title,subtitle:d.subtitle,source:d.source,view,sprite,glow});
 }
 private blocked(x:number,y:number):boolean{return this.blockers.some(r=>Phaser.Geom.Rectangle.Contains(r,x,y));}
 private move(dx:number,dy:number,dt:number):void{
  if(this.interacting)return;const beforeX=this.player.x,beforeY=this.player.y;const len=Math.hypot(dx,dy);if(len<.06){this.visual.update(0,0,0,dt);return;}dx/=len;dy/=len;const w=this.scale.width,h=this.scale.height,s=Phaser.Math.Clamp(Math.min(w,h)*.42,175,290)*dt/1000,nx=Phaser.Math.Clamp(this.player.x+dx*s,48,w-48),ny=Phaser.Math.Clamp(this.player.y+dy*s,86,h-52);if(!this.blocked(nx,this.player.y))this.player.x=nx;if(!this.blocked(this.player.x,ny))this.player.y=ny;this.visual.update(dx,dy,Math.hypot(this.player.x-beforeX,this.player.y-beforeY),dt);
 }
 private scan():void{
  let best=Infinity,next:Target|null=null;for(const t of this.targets){if((t.kind==='chest'&&t.source.disabled)||!t.source.isConnected)continue;const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,t.x,t.y);if(d<t.r&&d<best){best=d;next=t;}}
  document.querySelector('.vault-interact')?.classList.toggle('is-ready',!!next);if(next!==this.near){this.near?.glow.setAlpha(.08);this.near=next;this.near?.glow.setAlpha(.3);}if(next){const verb=next.kind==='chest'?'봉인을 연다':next.kind==='escape'?'탈출한다':'더 깊이 간다';const compact=this.scale.width<600,py=next.kind==='chest'?next.y+(compact?76:100):next.y-(compact?89:114);this.prompt.setPosition(this.scale.width/2,py).setText(`${compact?'●':'E / SPACE'} · ${verb}`).setVisible(true);this.info.setPosition(this.scale.width/2,py+21).setText(next.subtitle).setVisible(true);}else{this.prompt.setVisible(false);this.info.setVisible(false);}
 }
 interact():void{const t=this.near;if(this.interacting||!t||!t.source.isConnected||t.source.disabled)return;this.interacting=true;this.visual.interact(t.x-this.player.x,t.y-this.player.y);preserve=t.kind==='chest'?{x:this.player.x/Math.max(1,this.scale.width),y:this.player.y/Math.max(1,this.scale.height),facing:this.visual.facing}:null;t.glow.setAlpha(.4);if(t.kind==='chest'){t.sprite.setFrame(1);this.time.delayedCall(100,()=>{t.sprite.setFrame(2);this.rewardSpark(t.x,t.y-15,0xffd991);});}this.time.delayedCall(t.kind==='chest'?320:180,()=>{this.interacting=false;if(t.source.isConnected&&!t.source.disabled)t.source.click();});}
 update(_time:number,dt:number):void{
  const kx=(this.keys.LEFT?.isDown||this.keys.A?.isDown?-1:0)+(this.keys.RIGHT?.isDown||this.keys.D?.isDown?1:0),ky=(this.keys.UP?.isDown||this.keys.W?.isDown?-1:0)+(this.keys.DOWN?.isDown||this.keys.S?.isDown?1:0);dt=Math.min(dt,50);this.move(Math.abs(input.x)>.08?input.x:kx,Math.abs(input.y)>.08?input.y:ky,dt);this.scan();if(Phaser.Input.Keyboard.JustDown(this.keys.E)||Phaser.Input.Keyboard.JustDown(this.keys.SPACE))this.interact();
 }
}

function controls(el:HTMLElement):()=>void{
 const box=document.createElement('div');box.className='vault-mobile-controls';box.innerHTML='<div class="vault-stick"><span></span></div><button class="vault-interact" type="button">상호작용<small>열기 / 문 사용</small></button>';el.append(box);const stick=box.querySelector<HTMLElement>('.vault-stick')!,knob=stick.querySelector<HTMLElement>('span')!,button=box.querySelector<HTMLButtonElement>('.vault-interact')!;let pid:number|null=null;
 const set=(e:PointerEvent)=>{const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.32;let x=e.clientX-cx,y=e.clientY-cy,l=Math.hypot(x,y);if(l>max){x=x/l*max;y=y/l*max;}input.x=x/max;input.y=y/max;knob.style.transform=`translate(${x}px,${y}px)`;};const down=(e:PointerEvent)=>{pid=e.pointerId;stick.setPointerCapture(pid);set(e);},move=(e:PointerEvent)=>{if(e.pointerId===pid)set(e);},up=(e:PointerEvent)=>{if(e.pointerId!==pid)return;pid=null;input.x=input.y=0;knob.style.transform='translate(0,0)';},use=()=>scene?.interact();stick.addEventListener('pointerdown',down);stick.addEventListener('pointermove',move);stick.addEventListener('pointerup',up);stick.addEventListener('pointercancel',up);button.addEventListener('click',use);
 return()=>{input.x=input.y=0;stick.removeEventListener('pointerdown',down);stick.removeEventListener('pointermove',move);stick.removeEventListener('pointerup',up);stick.removeEventListener('pointercancel',up);button.removeEventListener('click',use);box.remove();};
}
function destroy():void{cleanupControls?.();cleanupControls=null;scene=null;game?.destroy(true);game=null;host?.classList.remove('playable-active');host?.querySelectorAll('.vault-world-layer,.vault-world-help').forEach(el=>el.remove());host=null;document.body.classList.remove('playable-world-active');}
function mount(el:HTMLElement):void{
 destroy();const room=snapshot(el);if(!room.chests.length)return;host=el;el.classList.add('playable-active');document.body.classList.add('playable-world-active');const layer=document.createElement('div');layer.className='vault-world-layer';layer.setAttribute('aria-hidden','true');el.prepend(layer);const help=document.createElement('div');help.className='vault-world-help';help.innerHTML='<span class="desktop-help">WASD / 방향키 이동 · E / SPACE 상호작용</span><span class="mobile-help">왼쪽 패드 이동 · 오른쪽 버튼 상호작용</span>';el.append(help);cleanupControls=controls(el);game=new Phaser.Game({type:Phaser.CANVAS,parent:layer,transparent:true,scale:{mode:Phaser.Scale.RESIZE,width:Math.max(320,layer.clientWidth),height:Math.max(420,layer.clientHeight)},render:{antialias:false,pixelArt:true,roundPixels:true},scene:[new VaultScene(room)]});document.querySelectorAll<HTMLElement>('.choice-prompt p').forEach(p=>p.textContent='직접 금고 안을 움직여 상자 앞에서 봉인을 여세요.');
}
function sync():void{queued=false;const next=document.querySelector<HTMLElement>('.game-area .vault-door');if(!next){preserve=null;if(host)destroy();const rule=document.querySelector<HTMLElement>('.rules-strip p:first-of-type');if(rule)rule.innerHTML='<b>01</b> 상자 앞까지 이동한다';return;}if(next===host&&next.querySelector('.vault-world-layer'))return;mount(next);}
function queue():void{if(queued)return;queued=true;requestAnimationFrame(sync);}const app=document.querySelector<HTMLElement>('#app');if(app){new MutationObserver(queue).observe(app,{childList:true,subtree:true});queue();}window.addEventListener('beforeunload',destroy);
