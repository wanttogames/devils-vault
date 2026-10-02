import { RELICS, weightedRandom, type RunState } from '../balance';
import { SPECIAL_VAULTS, SPECIAL_BALANCE } from '../data/specialVaults';
import { FLOORS } from '../data/floors';
import { FloorManager } from './FloorManager';
import type { SpecialVaultId } from '../types/specialVault';
export const SpecialVaultManager = {
 discover(run:RunState,random=Math.random):SpecialVaultId|null {
  if(run.specialCooldown>0||run.specialCount>=SPECIAL_BALANCE.maxPerRun)return null;
  const floor=FloorManager.definition(run);
  const remaining=floor.roundCount-run.currentFloorRound+FLOORS.slice(run.currentFloor).reduce((sum,f)=>sum+f.roundCount-1,0);
  const forced=run.specialCount<SPECIAL_BALANCE.minPerRun&&remaining<=SPECIAL_BALANCE.minPerRun-run.specialCount;
  if(!forced&&random()>=floor.specialVaultChance)return null;
  const id=weightedRandom(SPECIAL_VAULTS.map(v=>({value:v.id,weight:v.weight})),random);
  run.specialCount++;run.specialVaultsDiscovered.push(id);run.activeSpecial=id;run.phase='special-offer';
  return id;
 },
 enter(run:RunState){if(!run.activeSpecial||run.phase!=='special-offer')return false;run.specialVaultsVisited.push(run.activeSpecial);run.phase='special';return true;},
 leave(run:RunState){run.specialCooldown=SPECIAL_BALANCE.cooldownRounds+1;FloorManager.nextRound(run);},
 offers(run:RunState){run.shopOffers=SPECIAL_BALANCE.shop.map(o=>{const relic=RELICS.find(r=>r.id===o.id)!;return {id:o.id,name:relic.name,description:relic.text,cost:o.cost,purchased:run.relics.includes(o.id)&&!run.relicUsed.includes(o.id)&&(o.id!=='insurance'||!run.insuranceUsed)};});},
 buy(run:RunState,id:string){if(run.phase!=='special'||run.activeSpecial!=='shop')return false;const offer=run.shopOffers.find(o=>o.id===id);if(!offer||offer.purchased||run.gold<offer.cost)return false;run.gold-=offer.cost;offer.purchased=true;if(!run.relics.includes(id))run.relics.push(id);run.relicUsed=run.relicUsed.filter(r=>r!==id);if(id==='insurance')run.insuranceUsed=false;return true;},
};
