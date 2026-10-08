import type { Chest } from '../balance';

export type NearMissKind='perfect'|'double-ruin'|'crossroads'|'ruin-dodge'|'jackpot-missed';
export type NearMissCue='near-perfect'|'near-death'|'near-jackpot';

export type NearMissResult={
 kind:NearMissKind;
 cue:NearMissCue;
 kicker:string;
 title:string;
 detail:string;
 ruinAvoided:number;
 jackpotsMissed:number;
 intensity:1|2|3|4;
};

export function nearMissAnalysis(chests:Chest[],selectedIndex:number):NearMissResult|null{
 if(!Number.isInteger(selectedIndex)||selectedIndex<0||selectedIndex>=chests.length||chests.length<2)return null;
 const selected=chests[selectedIndex]!;
 const others=chests.filter((_,i)=>i!==selectedIndex);
 const ruinAvoided=others.filter(c=>c.result.type==='ruin').length;
 const jackpotsMissed=others.filter(c=>c.result.type==='jackpot').length;

 if(selected.result.type==='jackpot'&&ruinAvoided>0){
  return{kind:'perfect',cue:'near-perfect',kicker:'PERFECT READ',title:'완벽한 선택',detail:`JACKPOT을 움켜쥐고 RUIN ${ruinAvoided}개를 피했다.`,ruinAvoided,jackpotsMissed,intensity:4};
 }
 if(ruinAvoided>=2){
  return{kind:'double-ruin',cue:'near-death',kicker:'ONE IN THREE',title:'1 / 3 생존',detail:'두 개의 RUIN 사이에서 살아남았다.',ruinAvoided,jackpotsMissed,intensity:4};
 }
 if(ruinAvoided===1&&jackpotsMissed>0){
  return{kind:'crossroads',cue:'near-death',kicker:'FATE CROSSED',title:'운명이 엇갈렸다',detail:'죽음은 피했지만 다른 봉인에는 JACKPOT이 있었다.',ruinAvoided,jackpotsMissed,intensity:3};
 }
 if(ruinAvoided===1){
  return{kind:'ruin-dodge',cue:'near-death',kicker:'NEAR MISS',title:'죽음을 비껴갔다',detail:'선택하지 않은 봉인 하나가 RUIN이었다.',ruinAvoided,jackpotsMissed,intensity:3};
 }
 if(jackpotsMissed>0&&selected.result.type!=='jackpot'){
  return{kind:'jackpot-missed',cue:'near-jackpot',kicker:'ONE CHEST AWAY',title:'한 칸 차이',detail:'선택하지 않은 봉인에 JACKPOT이 잠들어 있었다.',ruinAvoided,jackpotsMissed,intensity:2};
 }
 return null;
}

export function nearMissChestClass(chest:Chest,selected:boolean,revealed:boolean):string{
 if(!revealed||selected)return'';
 if(chest.result.type==='ruin')return'near-miss-ruin';
 if(chest.result.type==='jackpot')return'near-miss-jackpot';
 return'';
}
