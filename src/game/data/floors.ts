import type { FloorDefinition } from '../types/floor';
export const FLOORS:FloorDefinition[] = [
 {id:'forgotten',name:'잊힌 금고',englishName:'FORGOTTEN VAULT',roundCount:3,rewardMultiplier:1,riskModifier:0,specialVaultChance:.05,chestTierWeights:{common:65,uncommon:25,rare:9,epic:1,legendary:0,mythic:0},treasureWeight:0,relicWeight:0,jackpotWeight:0,curseWeight:0,bonus:'gold'},
 {id:'greed',name:'탐욕의 금고',englishName:'GREED VAULT',roundCount:3,rewardMultiplier:1.4,riskModifier:3,specialVaultChance:.08,chestTierWeights:{common:45,uncommon:30,rare:18,epic:6,legendary:1,mythic:0},treasureWeight:2,relicWeight:1,jackpotWeight:.5,curseWeight:1,bonus:'relic'},
 {id:'blood',name:'피의 금고',englishName:'BLOOD VAULT',roundCount:4,rewardMultiplier:2,riskModifier:7,specialVaultChance:.12,chestTierWeights:{common:25,uncommon:30,rare:25,epic:15,legendary:5,mythic:0},treasureWeight:5,relicWeight:3,jackpotWeight:1,curseWeight:3,bonus:'treasure'},
 {id:'cursed',name:'저주받은 금고',englishName:'CURSED VAULT',roundCount:4,rewardMultiplier:3,riskModifier:12,specialVaultChance:.16,chestTierWeights:{common:12,uncommon:18,rare:30,epic:25,legendary:13,mythic:2},treasureWeight:7,relicWeight:4,jackpotWeight:2,curseWeight:6,bonus:'gauge'},
 {id:'devil',name:'악마의 심층 금고',englishName:"DEVIL'S VAULT",roundCount:5,rewardMultiplier:5,riskModifier:20,specialVaultChance:.22,chestTierWeights:{common:5,uncommon:10,rare:20,epic:30,legendary:25,mythic:10},treasureWeight:10,relicWeight:5,jackpotWeight:4,curseWeight:10,bonus:'deepest'},
];
export const FLOOR_BALANCE = { goldBonus:.05, gaugeBonus:25, deepestGold:5000, transitionMs:2400, reducedTransitionMs:180 };
