import Phaser from 'phaser';

export const VAULT_THEMES = {
 forgotten: {stone:'#302923',wall:'#554237',edge:'#8f7151',accent:'#dfad65',wood:'#624334'},
 greed: {stone:'#332c20',wall:'#615039',edge:'#a88949',accent:'#f5cf6c',wood:'#76572e'},
 blood: {stone:'#302022',wall:'#593037',edge:'#945257',accent:'#e36361',wood:'#623039'},
 cursed: {stone:'#262331',wall:'#454059',edge:'#79658f',accent:'#b594e5',wood:'#48394d'},
 devil: {stone:'#30221e',wall:'#63372d',edge:'#a85b42',accent:'#f59a53',wood:'#663728'}
};
export type VaultTheme = keyof typeof VAULT_THEMES;
const tiers = ['common','uncommon','rare','epic','legendary','mythic'];
const metals = ['#93857c','#b4c9bf','#e8bd68','#d97eac','#ffdb83','#cab5ff'];
const dark = '#141017';
type Painter=(ctx:CanvasRenderingContext2D,rect:(x:number,y:number,w:number,h:number,c:string)=>void)=>void;
function texture(scene:Phaser.Scene,key:string,w:number,h:number,paint:Painter,frames?:{width:number;height:number;count:number}):void {
 if(scene.textures.exists(key))return;
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d')!;
 paint(ctx,(x,y,rw,rh,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),rw,rh)});
 const t=scene.textures.addCanvas(key,canvas)!;t.setFilter(Phaser.Textures.FilterMode.NEAREST);
 if(frames)for(let i=0;i<frames.count;i++)t.add(i,0,i*frames.width,0,frames.width,frames.height);
}

export function registerVaultArt(scene:Phaser.Scene):void {
 tiers.forEach((tier,index)=>texture(scene,`vault-chest-${tier}`,160,36,(_ctx,draw)=>{
  for(let frame=0;frame<4;frame++) {
   const r=(x:number,y:number,w:number,h:number,c:string)=>draw(x+frame*40,y,w,h,c),metal=metals[index]!;
   const wood=index===0?'#684637':index===1?'#405057':index===2?'#6e4933':index===3?'#543045':index===4?'#71502f':'#403452';
   // Stepped silhouette, timber planks, riveted straps, distinct grade ornaments.
   r(3,29,34,4,'#100d13');r(4,16,32,15,dark);r(5,17,30,12,wood);r(6,18,28,2,'#99705a');
   r(6,22,28,1,'#32242a');r(6,26,28,1,'#32242a');r(8,17,3,13,metal);r(29,17,3,13,metal);
   r(9,19,1,1,'#fff0bb');r(30,25,1,1,'#fff0bb');r(5,29,30,1,metal);
   if(frame<2) {
    r(4,10,32,7,dark);r(6,7,28,3,dark);r(7,8,26,2,metal);r(5,11,30,5,wood);
    r(7,11,26,1,'#b08b67');r(8,10,3,7,metal);r(29,10,3,7,metal);r(5,16,30,2,metal);
    r(17,16,6,7,dark);r(18,16,4,5,frame===1?'#fff2c3':metal);r(19,18,2,2,dark);
   }else {
    r(5,5,30,12,dark);r(6,6,28,9,wood);r(7,7,26,1,metal);r(8,6,3,10,metal);r(29,6,3,10,metal);
    r(6,15,28,2,metal);r(7,17,26,4,'#09080c');r(10,18,20,2,frame===3?'#fff1b2':metal);
    r(13,19,14,2,'#e3ab5b');
    if(frame===3){r(18,10,4,1,'#ffe8a3');r(19,8,2,6,'#ffe8a3');r(10,15,2,2,'#fff3ce');r(29,12,2,2,'#fff3ce');}
   }
   if(index>=2){r(14,23,2,2,metal);r(24,23,2,2,metal);}
   if(index>=3){r(2,12,2,5,metal);r(36,12,2,5,metal);r(1,10,2,3,metal);r(37,10,2,3,metal);}
   if(index>=4){r(15,4,2,4,metal);r(19,2,2,5,metal);r(23,4,2,4,metal);}
   if(index===5){r(18,24,4,1,'#e8ccff');r(19,22,2,5,'#e8ccff');}
  }
 },{width:40,height:36,count:4}));
 for(const kind of ['escape','continue'])texture(scene,`vault-door-${kind}`,40,56,(_ctx,r)=>{
  const warm=kind==='escape',metal=warm?'#bdaf87':'#a66c60',light=warm?'#fae3a0':'#e86851';
  r(2,51,36,4,'#0d0b10');r(3,7,34,45,dark);r(6,3,28,5,dark);r(8,1,24,3,dark);
  r(5,8,30,43,'#54403b');r(7,5,26,4,metal);r(9,3,22,2,metal);r(7,9,26,40,'#100e15');
  r(9,11,22,37,warm?'#776343':'#442a30');
  for(let x=9;x<31;x+=5){r(x,11,1,37,dark);r(x+1,12,1,34,warm?'#98815a':'#664047');}
  r(9,19,22,3,metal);r(9,38,22,3,metal);r(10,20,1,1,'#d9b78a');r(28,39,1,1,'#d9b78a');
  r(18,12,2,36,light);r(9,47,22,2,light);r(23,29,3,3,metal);r(24,30,1,1,dark);
  if(!warm){r(14,26,3,2,light);r(23,26,3,2,light);r(15,24,1,2,light);r(24,24,1,2,light);r(19,31,2,4,light);}
  for(let y=10;y<50;y+=9){r(4,y,3,1,metal);r(33,y,3,1,metal);}
 });
 texture(scene,'vault-candle',36,24,(_ctx,draw)=>{
  for(let f=0;f<3;f++){const r=(x:number,y:number,w:number,h:number,c:string)=>draw(x+f*12,y,w,h,c);
   r(2,21,8,2,dark);r(4,17,4,4,'#b68b58');r(5,9,2,9,'#e6caa0');r(4,12,1,3,'#e6caa0');
   r(4,4+f%2,4,5,'#d2583b');r(5,2+f%2,2,7,'#f3ad53');r(5+(f===2?1:0),5,1,3,'#fff1b4');
  }
 },{width:12,height:24,count:3});
 if(!scene.anims.exists('vault-candle-flicker'))scene.anims.create({key:'vault-candle-flicker',frames:scene.anims.generateFrameNumbers('vault-candle',{start:0,end:2}),frameRate:5,repeat:-1});
 texture(scene,'vault-coins',24,16,(_ctx,r)=>{
  r(2,12,20,3,dark);for(const [x,y]of [[3,10],[8,8],[13,10],[17,7],[10,4]]){r(x!,y!,5,3,'#9c672e');r(x!,y!,5,1,'#efc672');r(x!+1,y!-1,3,1,'#ffdf96');}
 });
 texture(scene,'vault-skull',16,16,(_ctx,r)=>{
  r(3,3,10,8,dark);r(4,2,8,9,'#9e8e7d');r(5,2,6,2,'#dbc9ad');r(5,5,2,3,dark);r(9,5,2,3,dark);r(7,8,2,2,dark);r(5,11,6,2,'#b5a18a');r(6,11,1,2,dark);r(9,11,1,2,dark);
 });
}

// The room is drawn at half resolution and enlarged with nearest-neighbor filtering.
// No random calls: cosmetic variations never consume reward RNG.
export function drawVaultRoom(scene:Phaser.Scene,w:number,h:number,theme:string):Phaser.Geom.Rectangle[] {
 const keyTheme=(theme in VAULT_THEMES?theme:'forgotten') as VaultTheme,p=VAULT_THEMES[keyTheme];
 const cw=Math.ceil(w/2),ch=Math.ceil(h/2),pillars:Phaser.Geom.Rectangle[]=[];
 texture(scene,`vault-room-${keyTheme}-${w}-${h}`,cw,ch,(ctx,r)=>{
  r(0,0,cw,ch,'#110f13');
  const tile=24;
  for(let y=22;y<ch-15;y+=tile)for(let x=14;x<cw-14;x+=tile) {
   const n=((x*13+y*7)%17),v=n%3;
   r(x,y,23,23,p.stone);r(x+1,y+1,21,1,v===0?p.wall:'#3b3030');r(x+1,y+2,1,19,p.wall);
   r(x+2,y+22,21,1,'#1c181e');r(x+22,y+2,1,20,'#1c181e');
   if(n<5){r(x+8,y+7,1,5,'#17141b');r(x+9,y+11,4,1,'#17141b');r(x+12,y+12,1,4,'#17141b');}
   if(n>11){r(x+5,y+18,3,1,p.wall);r(x+17,y+7,2,1,p.wall);}
   if(keyTheme==='blood'&&n<3){r(x+8,y+12,6,3,'#55252e');r(x+12,y+15,4,2,'#55252e');}
   if(keyTheme==='devil'&&n<4){r(x+14,y+6,1,6,'#b35c36');r(x+15,y+11,4,1,'#8d412f');}
  }
  // Brick courses and beveled borders give the wall actual depth.
  for(let y=0;y<22;y+=10)for(let x=-16+(y?12:0);x<cw;x+=32){r(x,y,31,9,p.wall);r(x+2,y+1,27,1,p.edge);r(x+2,y+7,28,2,'#2a2024');}
  r(12,22,cw-24,3,'#08080c');r(12,25,cw-24,5,'#19151b');
  for(let y=22;y<ch;y+=20){r(0,y,12,19,p.wall);r(2,y+1,2,16,p.edge);r(cw-12,y,12,19,p.wall);r(cw-4,y+1,2,16,p.edge);}
  r(0,ch-15,cw,15,p.wall);r(12,ch-15,cw-24,2,p.edge);r(12,ch-12,cw-24,3,'#292027');
  // Broken ritual circle, on the floor and behind all interactive objects.
  ctx.globalAlpha=.23;const cx=Math.floor(cw/2),cy=Math.floor(ch*.48);
  for(let a=0;a<32;a++){const angle=a*Math.PI/16;const x=Math.round(cx+Math.cos(angle)*30),y=Math.round(cy+Math.sin(angle)*15);r(x,y,2,2,p.accent);}
  r(cx-12,cy,24,1,p.accent);r(cx,cy-10,1,21,p.accent);r(cx-7,cy-6,2,2,p.accent);r(cx+6,cy+5,2,2,p.accent);ctx.globalAlpha=1;
  // Fixed collision pillars retain the existing traversal routes.
  const pw=Math.max(34,w*.045),ph=Math.max(88,h*.21),py=h*.49-ph/2;
  for(const px of [w*.12-pw/2,w*.88-pw/2]) {
   const x=Math.round(px/2),y=Math.round(py/2),width=Math.round(pw/2),height=Math.round(ph/2);
   r(x+2,y+5,width+3,height+3,'#111017');r(x,y,width,height,p.wall);
   r(x+1,y,2,height,p.edge);r(x+width-3,y,3,height,'#29212a');
   for(let sy=y+8;sy<y+height;sy+=12){r(x+3,sy,width-6,1,'#261f25');r(x+4,sy+1,width-8,1,p.edge);}
   r(x-2,y-2,width+4,4,p.edge);r(x-2,y+height-3,width+4,5,p.edge);
   pillars.push(new Phaser.Geom.Rectangle(px-15,py-15,pw+30,ph+30));
  }
  // Edge-only chains and runes keep the central path clear.
  for(const x of [22,cw-24])for(let y=30;y<57;y+=5){r(x,y,3,4,p.edge);r(x+1,y+1,1,2,dark);}
  if(keyTheme==='cursed'||keyTheme==='devil')for(const x of [34,cw-36]){r(x,68,1,12,p.accent);r(x-3,71,7,1,p.accent);r(x-2,78,5,1,p.accent);}
 });
 scene.add.image(w/2,h/2,`vault-room-${keyTheme}-${w}-${h}`).setDisplaySize(cw*2,ch*2).setDepth(0);
 const placements=[{x:w*.08,y:h*.17},{x:w*.92,y:h*.17}];
 for(const {x,y}of placements) {
  const light=scene.add.rectangle(x,y+5,48,56,Phaser.Display.Color.HexStringToColor(p.accent).color,.035).setDepth(1);
  scene.add.rectangle(x,y+8,28,40,Phaser.Display.Color.HexStringToColor(p.accent).color,.05).setDepth(1);
  scene.add.sprite(x,y,'vault-candle',0).setScale(2).setDepth(5).play('vault-candle-flicker');
  scene.tweens.add({targets:light,alpha:.06,duration:840,yoyo:true,repeat:-1});
 }
 const deco=keyTheme==='greed'?'vault-coins':'vault-skull';
 for(const x of [w*.075,w*.925])scene.add.image(x,h*.64,deco).setScale(2).setDepth(3).setAlpha(.8);
 return pillars;
}
