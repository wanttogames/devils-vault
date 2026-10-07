import type { ResultType } from '../balance';
import type { SpecialVaultId } from '../types/specialVault';
import type { ChestPersonalityId } from '../types/chestPersonality';

export type ChestPersonality={
 id:ChestPersonalityId;
 name:string;
 glyph:string;
 short:string;
 description:string;
 color:string;
 riskModifier:number;
 rewardMultiplier:number;
 clueAccuracyModifier:number;
 weight:number;
};

export const CHEST_PERSONALITIES:readonly ChestPersonality[]=[
 {id:'greedy',name:'탐욕의 상자',glyph:'♛',short:'보상↑ · 위험↑',description:'더 큰 보상을 품지만 RUIN도 가까이 끌어당깁니다.',color:'#d8ae58',riskModifier:6,rewardMultiplier:1.35,clueAccuracyModifier:0,weight:28},
 {id:'coward',name:'겁쟁이 상자',glyph:'◇',short:'위험↓ · 보상↓',description:'죽음을 피하려 하지만 품고 있는 보상도 작습니다.',color:'#8eb9ad',riskModifier:-6,rewardMultiplier:.82,clueAccuracyModifier:0,weight:26},
 {id:'liar',name:'거짓말쟁이',glyph:'◈',short:'단서 신뢰↓',description:'위험은 평범하지만 보여주는 징조를 믿기 어렵습니다.',color:'#b28bd1',riskModifier:0,rewardMultiplier:1.05,clueAccuracyModifier:-.34,weight:24},
 {id:'blood',name:'피의 상자',glyph:'†',short:'JACKPOT·저주↑',description:'피 냄새를 따라 JACKPOT과 저주가 함께 몰려듭니다.',color:'#d86b61',riskModifier:4,rewardMultiplier:1.22,clueAccuracyModifier:0,weight:22}
];

export function chestPersonality(id?:ChestPersonalityId):ChestPersonality|undefined{return id?CHEST_PERSONALITIES.find(p=>p.id===id):undefined;}

export function rollChestPersonality(random=Math.random):ChestPersonalityId{
 const total=CHEST_PERSONALITIES.reduce((sum,p)=>sum+p.weight,0);let roll=random()*total;
 for(const personality of CHEST_PERSONALITIES){roll-=personality.weight;if(roll<0)return personality.id;}
 return CHEST_PERSONALITIES[CHEST_PERSONALITIES.length-1]!.id;
}

export function personalityRiskModifier(id?:ChestPersonalityId,room:SpecialVaultId|null=null):number{const value=chestPersonality(id)?.riskModifier??0;return room==='blood'?Math.max(0,value):value;}

export function personalityRewardMultiplier(id?:ChestPersonalityId,room:SpecialVaultId|null=null):number{
 const value=chestPersonality(id)?.rewardMultiplier??1;
 return room==='blood'?Math.max(1,value):value;
}

export function personalityClueAccuracy(id:ChestPersonalityId|undefined,base:number):number{
 return Math.max(.2,Math.min(.98,base+(chestPersonality(id)?.clueAccuracyModifier??0)));
}

export function applyPersonalityWeights(weights:Record<ResultType,number>,id?:ChestPersonalityId):void{
 if(id==='greedy'){weights.gold*=.92;weights.multiplier*=1.2;weights.treasure*=1.55;weights.relic*=1.1;weights.jackpot*=1.6;}
 else if(id==='coward'){weights.gold*=1.45;weights.multiplier*=.9;weights.treasure*=.72;weights.relic*=.9;weights.curse*=.72;weights.jackpot*=.5;}
 else if(id==='liar'){weights.gold*=1.02;weights.multiplier*=1.05;weights.treasure*=1.08;weights.relic*=1.08;}
 else if(id==='blood'){weights.gold*=.82;weights.treasure*=1.15;weights.curse*=1.75;weights.jackpot*=2.1;}
}
