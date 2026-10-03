import Phaser from 'phaser';

/** Browser text stays sharp at any device pixel ratio, independently of pixel art. */
export class WorldTextLayer {
 private readonly layer:HTMLDivElement;
 constructor(scene:Phaser.Scene,host:HTMLElement,private width:number,private height:number){
  this.layer=document.createElement('div');this.layer.className='vault-text-layer';
  host.querySelector('.vault-world-layer')!.append(this.layer);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.layer.remove());
 }
 text(x:number,y:number,value:string,style:Phaser.Types.GameObjects.Text.TextStyle={}):WorldText{
  const node=document.createElement('span');node.className='vault-world-text';
  node.style.fontSize=typeof style.fontSize==='number'?`${style.fontSize}px`:style.fontSize||'13px';
  node.style.color=typeof style.color==='string'?style.color:'#efdab6';node.style.fontWeight=style.fontStyle==='bold'?'700':'600';
  if(style.backgroundColor){node.classList.add('vault-world-text-panel');node.style.backgroundColor=style.backgroundColor;}
  if(style.wordWrap?.width)node.style.width=`${style.wordWrap.width}px`;
  this.layer.append(node);return new WorldText(node,this.width,this.height).setPosition(x,y).setText(value);
 }
}

export class WorldText {
 private px=0;private py=0;private opacity=1;
 constructor(readonly element:HTMLSpanElement,private width:number,private height:number){}
 get x():number{return this.px;}
 set x(value:number){this.px=value;this.element.style.left=`${Math.round(value)/this.width*100}%`;}
 get y():number{return this.py;}
 set y(value:number){this.py=value;this.element.style.top=`${Math.round(value)/this.height*100}%`;}
 get alpha():number{return this.opacity;}
 set alpha(value:number){this.opacity=value;this.element.style.opacity=String(value);}
 setPosition(x:number,y:number):this{this.x=x;this.y=y;return this;}
 setOrigin(x:number,y=x):this{this.element.style.transform=`translate(${-x*100}%,${-y*100}%)`;return this;}
 setText(value:string):this{if(this.element.textContent!==value)this.element.textContent=value;return this;}
 setDepth(value:number):this{this.element.style.zIndex=String(value);return this;}
 setVisible(value:boolean):this{this.element.hidden=!value;return this;}
 setAlpha(value:number):this{this.alpha=value;return this;}
}
