import type { TierDefinition } from '../types/chest';
export const CHEST_TIERS:TierDefinition[] = [
 {id:'common',name:'낡은 상자',rewardMultiplier:1,riskModifier:0,color:'#9b9789',description:'작은 보상 · 낮은 변동성',weights:{treasure:.6,relic:.7,jackpot:0}},
 {id:'uncommon',name:'은 상자',rewardMultiplier:1.35,riskModifier:1,color:'#bed0d4',description:'더 나은 보상 · 배율의 기회',weights:{multiplier:1.3,relic:1.15,jackpot:.3}},
 {id:'rare',name:'황금 상자',rewardMultiplier:2,riskModifier:3,color:'#e5bd67',description:'큰 보상 · 보물과 JACKPOT',weights:{treasure:1.6,jackpot:2}},
 {id:'epic',name:'피의 상자',rewardMultiplier:3.5,riskModifier:7,color:'#df6b73',description:'매우 큰 보상 · 저주 증가',weights:{treasure:2,relic:1.5,jackpot:4,curse:1.5,multiplier:1.5}},
 {id:'legendary',name:'악마 상자',rewardMultiplier:6,riskModifier:12,color:'#f0c97c',description:'극대 보상 · 높은 위험',weights:{gold:.6,treasure:3,relic:2,jackpot:9,curse:2,multiplier:1.6}},
 {id:'mythic',name:'왕의 봉인 금고',rewardMultiplier:10,riskModifier:20,color:'#edd6ff',description:'신화 보상 · 치명적인 위험',weights:{gold:.5,treasure:4,relic:2.5,jackpot:15,curse:3,multiplier:2}},
];
