export const TIER_IDS = ['common','uncommon','rare','epic','legendary','mythic'] as const;
export type ChestTier = typeof TIER_IDS[number];
export type ChestTierWeights = Record<ChestTier, number>;
export type TierDefinition = { id:ChestTier; name:string; rewardMultiplier:number; riskModifier:number; color:string; description:string; weights:Partial<Record<import('../balance').ResultType,number>> };
export const emptyTierStats = ():ChestTierWeights => ({ common:0,uncommon:0,rare:0,epic:0,legendary:0,mythic:0 });
