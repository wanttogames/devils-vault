import type { ChestTierWeights } from './chest';
export interface FloorDefinition { id:string; name:string; englishName:string; roundCount:number; rewardMultiplier:number; riskModifier:number; specialVaultChance:number; chestTierWeights:ChestTierWeights; treasureWeight:number; relicWeight:number; jackpotWeight:number; curseWeight:number; bonus:'gold'|'relic'|'treasure'|'gauge'|'deepest'; }
