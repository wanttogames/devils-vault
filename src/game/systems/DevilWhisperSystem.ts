import type { RunState } from '../balance';
import type { WhisperId } from '../types/whisper';

export type DevilWhisper={
 id:WhisperId;
 title:string;
 quote:string;
 cost:string;
 risk:number;
 benefit:(run:RunState)=>string;
};

const advanceGold=(run:RunState)=>Math.max(500,Math.round(Math.max(1000,run.gold)*.3));

export const DEVIL_WHISPERS:readonly DevilWhisper[]=[
 {id:'blood-advance',title:'피의 선금',quote:'네 것이 될 금화를 지금 먼저 주마.',cost:'이번 RUN RUIN +6%p',risk:6,benefit:run=>`즉시 +${advanceGold(run).toLocaleString('ko-KR')} G`},
 {id:'black-prophecy',title:'검은 예언',quote:'상자 하나의 진실을 보여주지. 대신 나도 더 가까이 간다.',cost:'이번 RUN RUIN +4%p',risk:4,benefit:()=> '이번 라운드 상자 하나의 실제 결과 공개'},
 {id:'greed-blessing',title:'탐욕의 축복',quote:'다음 보상을 두 배로 만들어 주마. 목숨값은 별도다.',cost:'이번 RUN RUIN +8%p',risk:8,benefit:()=> '다음 금전 보상 ×2'}
];

export function whisperById(id:WhisperId):DevilWhisper|undefined{return DEVIL_WHISPERS.find(w=>w.id===id);}

export function whisperChance(run:RunState):number{
 return Math.min(.48,.18+run.currentFloor*.04+Math.min(run.streak,6)*.015+Math.min(.06,run.riskBonus*.003));
}

export function rollWhisper(run:RunState,random=Math.random):DevilWhisper|null{
 if(run.pendingWhisper)return whisperById(run.pendingWhisper)??null;
 if(run.phase!=='normal'||run.completedRounds<1||run.whisperCount>=3||run.whisperCooldown>0)return null;
 if(random()>=whisperChance(run))return null;
 const candidates=DEVIL_WHISPERS.filter(w=>!(w.id==='greed-blessing'&&run.whisperRewardMultiplier>1));
 const offer=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))]!;
 run.pendingWhisper=offer.id;run.whisperCount++;run.whisperCooldown=3;return offer;
}

export function declineWhisper(run:RunState):void{run.pendingWhisper=null;}

export function acceptWhisper(run:RunState):string{
 const id=run.pendingWhisper;if(!id)return '속삭임은 이미 사라졌습니다.';
 const offer=whisperById(id);if(!offer){run.pendingWhisper=null;return '속삭임은 이미 사라졌습니다.';}
 run.riskBonus+=offer.risk;
 let message=`${offer.title} 계약 성립 · RUIN +${offer.risk}%p`;
 if(id==='blood-advance'){const gold=advanceGold(run);run.gold+=gold;run.collected.push(`악마의 선금 +${gold.toLocaleString('ko-KR')} G`);message=`${offer.title} · +${gold.toLocaleString('ko-KR')} G / RUIN +${offer.risk}%p`;}
 if(id==='black-prophecy')run.whisperReveal=true;
 if(id==='greed-blessing')run.whisperRewardMultiplier=Math.max(2,run.whisperRewardMultiplier);
 run.pendingWhisper=null;return message;
}

export function applyWhisperReveal(run:RunState,random=Math.random):boolean{
 if(!run.whisperReveal||!run.chests.length)return false;
 const index=Math.min(run.chests.length-1,Math.floor(random()*run.chests.length)),chest=run.chests[index]!;
 const result=chest.result;const label=result.type==='ruin'?'RUIN':result.type==='curse'?(result.name??'저주'):result.type==='gold'?'금화':result.type==='treasure'?(result.name??'보물'):result.type==='jackpot'?'JACKPOT':result.type==='multiplier'?`배율 ×${result.amount}`:(result.name??'유물');
 chest.hint=`악마의 예언 · ${label}`;run.whisperReveal=false;return true;
}
