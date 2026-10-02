import type { RunState } from '../balance';
import { FLOORS } from '../data/floors';
import { emptyTierStats } from '../types/chest';
export const FloorManager = {
 definition(run:RunState){return FLOORS[run.currentFloor-1]!;},
 initialState(){return {currentFloor:1,currentFloorRound:1,deepestFloorReached:1,completedRounds:0,clearedFloors:[] as number[],phase:'normal' as const,specialVaultsVisited:[] as import('../types/specialVault').SpecialVaultId[],specialVaultsDiscovered:[] as import('../types/specialVault').SpecialVaultId[],specialCount:0,specialCooldown:0,activeSpecial:null as import('../types/specialVault').SpecialVaultId|null,chestTierStats:emptyTierStats(),riskBonus:0,shopOffers:[] as import('../types/specialVault').ShopOffer[],finalOpened:false,bloodSurvived:false};},
 completeRound(run:RunState){run.completedRounds++;run.specialCooldown=Math.max(0,run.specialCooldown-1);if(run.currentFloorRound>=this.definition(run).roundCount){run.phase='floor-clear';return true;}return false;},
 nextRound(run:RunState){run.currentFloorRound++;run.round=run.completedRounds+1;run.phase='normal';run.activeSpecial=null;},
 descend(run:RunState){if(run.phase!=='floor-clear'||run.currentFloor>=FLOORS.length)return false;run.currentFloor++;run.deepestFloorReached=Math.max(run.deepestFloorReached,run.currentFloor);run.currentFloorRound=1;run.round=run.completedRounds+1;run.activeSpecial=null;run.phase='normal';return true;},
};
