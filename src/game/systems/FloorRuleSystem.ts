import type { ResultType, RunState } from '../balance';

export type FloorRuleId='echo'|'gold-fever'|'blood-pulse'|'veil'|'devils-law';

export type FloorRule={
 floor:number;
 id:FloorRuleId;
 code:string;
 name:string;
 short:string;
 description:string;
};

export const FLOOR_RULES:readonly FloorRule[]=[
 {floor:1,id:'echo',code:'ECHO',name:'기억의 잔향',short:'단서 정확도 +10%p',description:'잊힌 금고의 흔적이 상자 징조를 조금 더 선명하게 만듭니다.'},
 {floor:2,id:'gold-fever',code:'GREED',name:'황금 열병',short:'금전 보상 ×1.15',description:'탐욕이 금전 보상을 키우지만 선택을 더 유혹합니다.'},
 {floor:3,id:'blood-pulse',code:'BLOOD',name:'피의 맥박',short:'JACKPOT·저주 확률 ↑',description:'피의 금고에서는 큰 행운과 저주가 함께 더 자주 나타납니다.'},
 {floor:4,id:'veil',code:'VEIL',name:'망각의 장막',short:'RUIN 수치 은폐 · 단서 정확도 -10%p',description:'상자를 열기 전에는 정확한 RUIN 수치를 읽을 수 없습니다.'},
 {floor:5,id:'devils-law',code:'LAW',name:'악마의 법칙',short:'첫 상자 전 탈출 금지 · 금전 보상 ×1.25',description:'매 라운드 반드시 하나의 봉인을 풀어야 하며 보상도 더욱 커집니다.'}
];

export function floorRule(floor:number):FloorRule{return FLOOR_RULES[Math.max(0,Math.min(FLOOR_RULES.length-1,Math.floor(floor)-1))]!;}

export function floorClueAccuracy(floor:number,base:number,phase:RunState['phase']='normal'):number{
 if(phase!=='normal')return base;
 const delta=floor===1?.10:floor===4?-.10:0;
 return Math.max(.2,Math.min(.98,base+delta));
}

export function floorRewardMultiplier(floor:number,phase:RunState['phase']='normal'):number{
 if(phase!=='normal')return 1;
 return floor===2?1.15:floor===5?1.25:1;
}

export function applyFloorWeightRules(weights:Record<ResultType,number>,floor:number,phase:RunState['phase']='normal'):void{
 if(phase!=='normal')return;
 if(floor===3){weights.jackpot*=1.35;weights.curse*=1.35;weights.gold*=.94;}
}

export function floorHidesRisk(floor:number,phase:RunState['phase']='normal'):boolean{return phase==='normal'&&floor===4;}

export function floorForcesChoice(floor:number,revealed:boolean,phase:RunState['phase']='normal'):boolean{return phase==='normal'&&floor===5&&!revealed;}
