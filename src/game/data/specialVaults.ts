import type { SpecialVaultDefinition } from '../types/specialVault';
export const SPECIAL_VAULTS:SpecialVaultDefinition[] = [
 {id:'gold',name:'황금 금고',englishName:'GOLD VAULT',description:'RARE 이상 · 골드 보상 ×2 · 저주와 RUIN 없음 · 하나만 선택',rewardMultiplier:2,riskMultiplier:0,weight:30},
 {id:'blood',name:'피의 금고',englishName:'BLOOD VAULT',description:'EPIC 이상 · 모든 보상 ×4 · RUIN 위험 ×2 · 입장 또는 지나가기',rewardMultiplier:4,riskMultiplier:2,weight:20},
 {id:'cursed',name:'저주받은 금고',englishName:'CURSED VAULT',description:'두 개의 큰 보상, 하나의 강한 저주 또는 RUIN. 단서와 유물을 살펴보세요.',rewardMultiplier:3,riskMultiplier:1,weight:20},
 {id:'relic',name:'유물 금고',englishName:'RELIC VAULT',description:'세 유물의 효과를 읽고 하나를 선택하세요.',rewardMultiplier:1,riskMultiplier:0,weight:18},
 {id:'shop',name:'악마의 거래소',englishName:"DEVIL’S SHOP",description:'이번 RUN 골드를 지불합니다. 구매한 만큼 탈출 보상이 줄어듭니다.',rewardMultiplier:1,riskMultiplier:0,weight:12},
];
export const SPECIAL_BALANCE = { minPerRun:0, maxPerRun:4, cooldownRounds:1, discoveryMs:1100, cursedRuinChance:.5, shop:[{id:'eye',cost:1200},{id:'contract',cost:2500},{id:'insurance',cost:4000}] };
export const FINAL_CHEST = { weights:{jackpot:30,multiplier:25,treasure:20,ruin:25}, multiplier:10, jackpot:10000, treasure:15000 };
