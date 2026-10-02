export const SPECIAL_IDS = ['gold','blood','cursed','relic','shop'] as const;
export type SpecialVaultId = typeof SPECIAL_IDS[number];
export type RunPhase = 'normal'|'floor-clear'|'special-offer'|'special'|'final-choice'|'final'|'ended';
export interface SpecialVaultDefinition { id:SpecialVaultId; name:string; englishName:string; description:string; rewardMultiplier:number; riskMultiplier:number; weight:number; }
export interface ShopOffer { id:string; name:string; description:string; cost:number; purchased:boolean; }
