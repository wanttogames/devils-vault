import { RELICS, rewardValue, type RunState, type SaveData } from '../balance';
import { FLOORS, FLOOR_BALANCE } from '../data/floors';
import { FloorManager } from './FloorManager';
import { ChestTierManager } from './ChestTierManager';
import { applyReward, grantRelic } from './RewardManager';
export function createRun(character:string,fever=false):RunState {
 return {gold:0,streak:0,round:1,chests:[],selected:null,revealed:false,relics:[],relicUsed:[],character,insuranceUsed:false,extraLifeUsed:false,doubleUsed:false,fever,pendingEscape:false,collected:[],treasureGoldBonus:0,...FloorManager.initialState()};
}
export function trackFloor(save:SaveData,run:RunState){save.statistics.deepestFloorReached=Math.max(save.statistics.deepestFloorReached,run.deepestFloorReached);return run.currentFloor===5?['welcome_hell','no_fear']:run.currentFloor===3?['going_deeper']:[];}
export function trackChest(save:SaveData,run:RunState){const c=run.chests[run.selected??0]!;run.chestTierStats[c.tier]++;save.statistics.chestTierStats[c.tier]++;return [...(save.statistics.chestTierStats.legendary>=10?['treasure_hunter']:[]),...(c.tier==='mythic'?['forbidden_vault']:[])];}
export function floorBonus(save:SaveData,run:RunState,random=Math.random):string {
 if(run.clearedFloors.includes(run.currentFloor))return '';
 run.clearedFloors.push(run.currentFloor);const bonus=FloorManager.definition(run).bonus;
 if(bonus==='gold'){const gold=Math.max(1,Math.round(run.gold*FLOOR_BALANCE.goldBonus));run.gold+=gold;return `층 클리어 · +${gold.toLocaleString()} G (+5%)`;}
 if(bonus==='relic'){const r=RELICS[Math.floor(random()*RELICS.length)]!;grantRelic(run,r.id);return `층 클리어 · ${r.name}`;}
 if(bonus==='gauge'){save.jackpotGauge=Math.min(100,save.jackpotGauge+FLOOR_BALANCE.gaugeBonus);return `층 클리어 · JACKPOT 게이지 +${FLOOR_BALANCE.gaugeBonus}%p`;}
 const r={type:'treasure' as const,amount:bonus==='deepest'?FLOOR_BALANCE.deepestGold:1500,name:bonus==='deepest'?'심층의 왕관':'피의 보석',rewardScale:FloorManager.definition(run).rewardMultiplier};
 const value=rewardValue(r,save,run);applyReward(r,save,run);return `층 클리어 · ${r.name} +${value.toLocaleString()} G`;
}
export function summary(run:RunState){return {deepest:run.deepestFloorReached,highest:ChestTierManager.highest(run.chestTierStats),tiers:run.chestTierStats,specials:run.specialVaultsDiscovered.length,mythic:run.chestTierStats.mythic,completed:run.clearedFloors.length===FLOORS.length};}
