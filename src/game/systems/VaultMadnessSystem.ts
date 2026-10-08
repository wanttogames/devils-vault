import type { ChestTier } from '../types/chest';

export const MADNESS_THRESHOLD=75;
export const MADNESS_RISK_BONUS=5;
export const MADNESS_RISK_CAP=90;
export const MADNESS_REWARD_MULTIPLIER=1.5;

export function isMadnessRisk(risk:number):boolean{return Number.isFinite(risk)&&risk>=MADNESS_THRESHOLD;}

export function madnessTier(tier:ChestTier):ChestTier{return tier==='common'||tier==='uncommon'?'rare':tier;}

export function madnessRisk(risk:number):number{
 const safe=Number.isFinite(risk)?Math.max(0,risk):0;
 return Math.min(MADNESS_RISK_CAP,safe+MADNESS_RISK_BONUS);
}

export function madnessRewardMultiplier(active:boolean):number{return active?MADNESS_REWARD_MULTIPLIER:1;}
