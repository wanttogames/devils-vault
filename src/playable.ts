import Phaser from 'phaser';
import './playable.css';

type Kind='chest'|'continue'|'escape';
type Chest={source:HTMLButtonElement;tier:string;title:string;risk:string;clue:string;revealed:boolean;selected:boolean};
type Door={source:HTMLButtonElement;kind:'continue'|'escape';title:string;subtitle:string};
type Room={host:HTMLElement;theme:string;floor:string;title:string;chests:Chest[];doors:Door[]};
type Target={kind:Kind;x:number;y:number;r:number;title:string;subtitle:string;source:HTMLButtonElement;view:any};

const input={x:0,y:0};
let game:any=null,scene:VaultScene|null=null,host:HTMLElement|null=null,cleanupControls:(()=>void)|null=null,queued=false;
let preserve:{x:number;y:number}|null=null;
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
 return{host:el,theme:document.documentElement.dataset.floor||'forgotten',floor:text(document,'.floor-hud strong','B1'),title:text(document,'.special-banner h3',text(document,'.game-heading h2','INNER VAULT')),chests,doors};
}

class VaultScene extends Phaser.Scene{
 private room:Room;private player:any;private shadow:any;private keys!:Record<string,any>;private targets:Target[]=[];private near:Target|null=null;private prompt:any;private info:any;private blockers:any[]=[];
 constructor(room:Room){super({key:`vault-world-${Date.now()}-${Math.random()}`});this.room=room;}
 create():void{
  scene=this;const w=this.scale.width,h=this.scale.height,[floor,wall,accent]=themes[this.room.theme]||themes.forgotten!;const g=this.add.graphics();
  g.fillStyle(0x070606).fillRect(0,0,w,h);g.fillStyle(floor).fillRoundedRect(16,16,w-32,h-32,20);g.lineStyle(4,wall).strokeRoundedRect(16,16,w-32,h-32,20);
  g.lineStyle(1,accent,.16);const tile=Math.max(42,Math.min(70,w/11));for(let x=42;x<w-30;x+=tile)g.lineBetween(x,58,x,h-44);for(let y=58;y<h-38;y+=tile)g.lineBetween(38,y,w-38,y);
  g.fillStyle(wall,.95).fillRect(0,0,w,44).fillRect(0,h-30,w,30).fillRect(0,0,28,h).fillRect(w-28,0,28,h);
  const pw=Math.max(34,w*.045),ph=Math.max(88,h*.21),py=h*.49-ph/2;for(const px of [w*.12-pw/2,w*.88-pw/2]){g.fillStyle(0x0b0909).fillRoundedRect(px-6,py-6,pw+12,ph+12,8);g.fillStyle(wall).fillRoundedRect(px,py,pw,ph,6);g.lineStyle(1,accent,.55).strokeRoundedRect(px,py,pw,ph,6);this.blockers.push(new Phaser.Geom.Rectangle(px-15,py-15,pw+30,ph+30));}
  this.add.text(w/2,27,`${this.room.floor} · ${this.room.title}`,{fontFamily:'Georgia,serif',fontSize:`${Math.max(13,Math.min(20,w/48))}px`,color:'#d7bd8b'}).setOrigin(.5).setDepth(20);
  const xs=this.room.chests.length===1?[.5]:this.room.chests.length===2?[.36,.64]:[.27,.5,.73];this.room.chests.forEach((c,i)=>this.addChest(c,w*(xs[i]??.5),h*.34,i));
  const dx=this.room.doors.length>1?[.31,.69]:[.5];this.room.doors.forEach((d,i)=>this.addDoor(d,w*(dx[i]??.5),h*.78));
  const spawn=preserve;preserve=null;this.player=this.add.container(w*(spawn?.x??.5),h*(spawn?.y??(this.room.doors.length?.60:.76))).setDepth(30);
  this.shadow=this.add.ellipse(0,18,42,16,0x000000,.55);const cloak=this.add.triangle(0,8,-18,20,18,20,0,-20,0x541916).setStrokeStyle(2,0xd0a35e,.8);const body=this.add.ellipse(0,2,34,26,0x241516).setStrokeStyle(2,0x7e3b2f,.9);const head=this.add.circle(0,-12,12,0x171111).setStrokeStyle(2,0xd0a35e,.7);const face=this.add.circle(0,-11,5,0xd5ad84);this.player.add([this.shadow,cloak,body,head,face]);
  this.prompt=this.add.text(w/2,h-54,'',{fontFamily:'Georgia,serif',fontSize:'18px',color:'#f5d69a',backgroundColor:'rgba(10,7,6,.86)',padding:{x:12,y:7}}).setOrigin(.5).setDepth(40).setVisible(false);
  this.info=this.add.text(w/2,h-28,'',{fontFamily:'Arial,sans-serif',fontSize:'11px',color:'#cbbca8',align:'center',wordWrap:{width:340}}).setOrigin(.5,0).setDepth(40).setVisible(false);
  this.keys=this.input.keyboard?.addKeys({W:Phaser.Input.Keyboard.KeyCodes.W,A:Phaser.Input.Keyboard.KeyCodes.A,S:Phaser.Input.Keyboard.KeyCodes.S,D:Phaser.Input.Keyboard.KeyCodes.D,UP:Phaser.Input.Keyboard.KeyCodes.UP,DOWN:Phaser.Input.Keyboard.KeyCodes.DOWN,LEFT:Phaser.Input.Keyboard.KeyCodes.LEFT,RIGHT:Phaser.Input.Keyboard.KeyCodes.RIGHT,E:Phaser.Input.Keyboard.KeyCodes.E,SPACE:Phaser.Input.Keyboard.KeyCodes.SPACE}) as Record<string,any>;
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{if(scene===this)scene=null;});
 }
 private addChest(c:Chest,x:number,y:number,i:number):void{
  const color=tierColor[c.tier]??tierColor.common!,view=this.add.container(x,y).setDepth(12);const glow=this.add.ellipse(0,18,126,58,color,c.revealed?.2:.11),base=this.add.rectangle(0,8,104,62,0x211715).setStrokeStyle(3,color,.9),lid=this.add.rectangle(0,c.revealed?-31:-20,112,32,c.revealed?0x39231f:0x2a1d1a).setStrokeStyle(3,color,.95),band=this.add.rectangle(0,8,12,58,color,.42),label=this.add.text(0,-58,c.tier.toUpperCase(),{fontFamily:'Arial',fontSize:'11px',color:'#e7d8bd'}).setOrigin(.5),name=this.add.text(0,52,c.revealed?c.title:`SEAL ${String.fromCharCode(65+i)}`,{fontFamily:'Georgia',fontSize:'13px',color:c.selected?'#ffe6a6':'#cdbfa9'}).setOrigin(.5,0);view.add([glow,base,lid,band,label,name]);if(c.revealed)view.add(this.add.text(0,2,c.selected?'✦':'◇',{fontFamily:'Georgia',fontSize:'26px',color:c.selected?'#ffd77a':'#8d7f76'}).setOrigin(.5));
  this.targets.push({kind:'chest',x,y:y+20,r:Math.max(72,Math.min(108,this.scale.width*.1)),title:c.title,subtitle:c.revealed?(c.selected?'당신이 연 상자':'NEAR MISS'):`${c.risk} · ${c.clue}`,source:c.source,view});
 }
 private addDoor(d:Door,x:number,y:number):void{
  const color=d.kind==='escape'?0xb9a27a:0xcd694b,view=this.add.container(x,y).setDepth(11);view.add([this.add.ellipse(0,18,128,68,color,.1),this.add.rectangle(0,0,106,122,0x100d0c).setStrokeStyle(4,color,.72),this.add.rectangle(0,4,78,96,d.kind==='escape'?0x1a1814:0x26120f).setStrokeStyle(1,color,.5),this.add.text(0,-5,d.kind==='escape'?'◇':'✦',{fontFamily:'Georgia',fontSize:'27px',color:'#d7bd8b'}).setOrigin(.5),this.add.text(0,72,d.title,{fontFamily:'Georgia',fontSize:'13px',color:'#e8d2aa'}).setOrigin(.5)]);this.targets.push({kind:d.kind,x,y,r:Math.max(78,Math.min(115,this.scale.width*.115)),title:d.title,subtitle:d.subtitle,source:d.source,view});
 }
 private blocked(x:number,y:number):boolean{return this.blockers.some(r=>Phaser.Geom.Rectangle.Contains(r,x,y));}
 private move(dx:number,dy:number,dt:number):void{
  const len=Math.hypot(dx,dy);if(len<.06)return;dx/=len;dy/=len;const w=this.scale.width,h=this.scale.height,s=Phaser.Math.Clamp(Math.min(w,h)*.42,175,290)*dt/1000,nx=Phaser.Math.Clamp(this.player.x+dx*s,48,w-48),ny=Phaser.Math.Clamp(this.player.y+dy*s,86,h-52);if(!this.blocked(nx,this.player.y))this.player.x=nx;if(!this.blocked(this.player.x,ny))this.player.y=ny;this.player.rotation=Phaser.Math.Angle.RotateTo(this.player.rotation,Math.atan2(dy,dx)+Math.PI/2,.22);
 }
 private scan():void{
  let best=Infinity,next:Target|null=null;for(const t of this.targets){if((t.kind==='chest'&&t.source.disabled)||!t.source.isConnected)continue;const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,t.x,t.y);if(d<t.r&&d<best){best=d;next=t;}}
  if(next!==this.near){this.near?.view.setScale(1);this.near=next;this.near?.view.setScale(1.055);}if(next){const verb=next.kind==='chest'?'봉인을 연다':next.kind==='escape'?'탈출한다':'더 깊이 간다';this.prompt.setText(`E / SPACE · ${verb}`).setVisible(true);this.info.setText(`${next.title}\n${next.subtitle}`).setVisible(true);}else{this.prompt.setVisible(false);this.info.setVisible(false);}
 }
 interact():void{const t=this.near;if(!t||!t.source.isConnected||t.source.disabled)return;preserve=t.kind==='chest'?{x:this.player.x/Math.max(1,this.scale.width),y:this.player.y/Math.max(1,this.scale.height)}:null;t.view.setScale(.97);this.time.delayedCall(80,()=>{if(t.source.isConnected&&!t.source.disabled)t.source.click();});}
 update(time:number,dt:number):void{
  const kx=(this.keys.LEFT?.isDown||this.keys.A?.isDown?-1:0)+(this.keys.RIGHT?.isDown||this.keys.D?.isDown?1:0),ky=(this.keys.UP?.isDown||this.keys.W?.isDown?-1:0)+(this.keys.DOWN?.isDown||this.keys.S?.isDown?1:0);this.move(Math.abs(input.x)>.08?input.x:kx,Math.abs(input.y)>.08?input.y:ky,dt);this.scan();if(Phaser.Input.Keyboard.JustDown(this.keys.E)||Phaser.Input.Keyboard.JustDown(this.keys.SPACE))this.interact();this.shadow.y=18-Math.sin(time/260)*.4;
 }
}

function controls(el:HTMLElement):()=>void{
 const box=document.createElement('div');box.className='vault-mobile-controls';box.innerHTML='<div class="vault-stick"><span></span></div><button class="vault-interact" type="button">상호작용<small>열기 / 문 사용</small></button>';el.append(box);const stick=box.querySelector<HTMLElement>('.vault-stick')!,knob=stick.querySelector<HTMLElement>('span')!,button=box.querySelector<HTMLButtonElement>('.vault-interact')!;let pid:number|null=null;
 const set=(e:PointerEvent)=>{const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.32;let x=e.clientX-cx,y=e.clientY-cy,l=Math.hypot(x,y);if(l>max){x=x/l*max;y=y/l*max;}input.x=x/max;input.y=y/max;knob.style.transform=`translate(${x}px,${y}px)`;};const down=(e:PointerEvent)=>{pid=e.pointerId;stick.setPointerCapture(pid);set(e);},move=(e:PointerEvent)=>{if(e.pointerId===pid)set(e);},up=(e:PointerEvent)=>{if(e.pointerId!==pid)return;pid=null;input.x=input.y=0;knob.style.transform='translate(0,0)';},use=()=>scene?.interact();stick.addEventListener('pointerdown',down);stick.addEventListener('pointermove',move);stick.addEventListener('pointerup',up);stick.addEventListener('pointercancel',up);button.addEventListener('click',use);
 return()=>{input.x=input.y=0;stick.removeEventListener('pointerdown',down);stick.removeEventListener('pointermove',move);stick.removeEventListener('pointerup',up);stick.removeEventListener('pointercancel',up);button.removeEventListener('click',use);box.remove();};
}
function destroy():void{cleanupControls?.();cleanupControls=null;scene=null;game?.destroy(true);game=null;host?.classList.remove('playable-active');host=null;document.body.classList.remove('playable-world-active');}
function mount(el:HTMLElement):void{
 destroy();const room=snapshot(el);if(!room.chests.length)return;host=el;el.classList.add('playable-active');document.body.classList.add('playable-world-active');const layer=document.createElement('div');layer.className='vault-world-layer';layer.setAttribute('aria-hidden','true');el.prepend(layer);const help=document.createElement('div');help.className='vault-world-help';help.innerHTML='<span class="desktop-help">WASD / 방향키 이동 · E / SPACE 상호작용</span><span class="mobile-help">왼쪽 패드 이동 · 오른쪽 버튼 상호작용</span>';el.append(help);cleanupControls=controls(el);game=new Phaser.Game({type:Phaser.CANVAS,parent:layer,transparent:true,scale:{mode:Phaser.Scale.RESIZE,width:Math.max(320,layer.clientWidth),height:Math.max(420,layer.clientHeight)},render:{antialias:true,roundPixels:true},scene:[new VaultScene(room)]});document.querySelectorAll<HTMLElement>('.choice-prompt p').forEach(p=>p.textContent='직접 금고 안을 움직여 상자 앞에서 봉인을 여세요.');
}
function sync():void{queued=false;const next=document.querySelector<HTMLElement>('.game-area .vault-door');if(!next){if(host)destroy();const rule=document.querySelector<HTMLElement>('.rules-strip p:first-of-type');if(rule)rule.innerHTML='<b>01</b> 상자 앞까지 이동한다';return;}if(next===host&&next.querySelector('.vault-world-layer'))return;mount(next);}
function queue():void{if(queued)return;queued=true;requestAnimationFrame(sync);}const app=document.querySelector<HTMLElement>('#app');if(app){new MutationObserver(queue).observe(app,{childList:true,subtree:true});queue();}window.addEventListener('beforeunload',destroy);
