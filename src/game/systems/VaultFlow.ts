import type { RunState, SaveData } from '../balance';
import { FLOORS, FLOOR_BALANCE } from '../data/floors';
import { SPECIAL_BALANCE } from '../data/specialVaults';
import { FloorManager } from './FloorManager';
import { SpecialVaultManager } from './SpecialVaultManager';
import { finalChest } from './RewardManager';
import { floorBonus, trackFloor } from './RunManager';
import { vaultArt } from '../ui/art';
interface Host { run():RunState|null; save():SaveData; active():boolean; render():void; deal():void; persist():void; notify(message:string):void; achievement(id:string):void; tone(freq:number,duration:number):void; }
export class VaultFlow {
 busy=false;
 private timer?:number;
 constructor(private host:Host){}
 cancel(){window.clearTimeout(this.timer);this.busy=false;document.querySelector('.vault-transition')?.remove();}
 transition(title:string,subtitle:string,callback:()=>void,special=false){
  this.cancel();this.busy=true;const run=this.host.run();
  const layer=document.createElement('div');layer.className=`vault-transition ${special?'discovery':''}`;layer.setAttribute('role','status');layer.innerHTML=`<div class="transition-door">${vaultArt()}</div><div class="transition-label"><small>${special?'숨겨진 문이 열렸다.':'잠금 장치가 닫힌다. 금고가 내려간다.'}</small><h2>${title}</h2><p>${subtitle}</p></div>`;document.body.append(layer);this.host.tone(110,.45);this.host.tone(220,.15);
  const reduced=this.host.save().settings.reducedMotion||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  this.timer=window.setTimeout(()=>{layer.remove();this.busy=false;if(this.host.run()===run&&this.host.active())callback();},reduced?FLOOR_BALANCE.reducedTransitionMs:special?SPECIAL_BALANCE.discoveryMs:FLOOR_BALANCE.transitionMs);
 }
 afterChest(){const run=this.host.run();if(!run)return;
  if(run.phase==='normal'&&FloorManager.completeRound(run)){this.host.notify(floorBonus(this.host.save(),run));if(run.currentFloor===FLOORS.length)run.phase='final-choice';}
  else if(run.phase==='special'&&run.activeSpecial==='blood')run.bloodSurvived=true;
 }
 continue(){const run=this.host.run();if(!run||!run.revealed||this.busy)return;
  if(run.phase==='special'){SpecialVaultManager.leave(run);this.host.deal();return;}
  if(run.phase!=='normal')return;
  if(SpecialVaultManager.discover(run)){
   const stats=this.host.save().statistics;stats.specialVaultsDiscovered++;
   if(!stats.specialVaultTypes.includes(run.activeSpecial!))stats.specialVaultTypes.push(run.activeSpecial!);
   if(stats.specialVaultTypes.length===5)this.host.achievement('explorer');this.host.persist();
   this.transition('SPECIAL VAULT DISCOVERED','봉인 뒤에 새로운 거래가 기다린다.',()=>this.host.render(),true);
  }else{FloorManager.nextRound(run);this.host.deal();}
 }
 action(name:string,id?:string):boolean {
  const run=this.host.run();if(!run||this.busy||run.pendingEscape)return false;
  switch(name){
   case 'descend':if(!FloorManager.descend(run))return true;trackFloor(this.host.save(),run).forEach(a=>this.host.achievement(a));this.host.persist();this.transition(`B${run.currentFloor}`,`${FloorManager.definition(run).englishName} · ${FloorManager.definition(run).name}`,()=>this.host.deal());return true;
   case 'special-enter':if(!SpecialVaultManager.enter(run))return true;if(run.activeSpecial==='shop'){SpecialVaultManager.offers(run);run.revealed=false;this.host.render();}else this.host.deal();return true;
   case 'special-skip':if(run.phase!=='special-offer')return true;SpecialVaultManager.leave(run);this.host.deal();return true;
   case 'special-leave':if(run.phase!=='special'||run.activeSpecial!=='shop')return true;SpecialVaultManager.leave(run);this.host.deal();return true;
   case 'shop-buy':if(SpecialVaultManager.buy(run,id??'')){this.host.tone(440,.15);this.host.render();}return true;
   case 'final-open':if(run.phase!=='final-choice')return true;run.phase='final';run.finalOpened=true;run.chests=[finalChest(this.host.save(),run)];run.selected=null;run.revealed=false;this.host.render();return true;
  }return false;
 }
}
