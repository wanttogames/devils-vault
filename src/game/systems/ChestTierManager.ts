import { weightedRandom } from '../balance';
import { CHEST_TIERS } from '../data/chestTiers';
import { TIER_IDS, type ChestTier, type ChestTierWeights } from '../types/chest';
export const ChestTierManager = {
 definition(tier:ChestTier){ return CHEST_TIERS.find(t=>t.id===tier)!; },
 roll(weights:ChestTierWeights,random=Math.random):ChestTier { return weightedRandom(TIER_IDS.map(value=>({value,weight:weights[value]})),random); },
 highest(stats:ChestTierWeights):ChestTier|null { return [...TIER_IDS].reverse().find(t=>stats[t]>0)??null; },
};
