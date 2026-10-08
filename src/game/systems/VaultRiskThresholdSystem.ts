import type { Chest } from '../balance';
import { signalForResult, type ClueSignal } from './ChestClueSystem';

export type RiskThresholdEvent={
 level:30|45|60|75;
 code:string;
 name:string;
 description:string;
 resolved?:boolean;
};

const protectedHint=(chest:Chest)=>Boolean(chest.hint&&(chest.hint.startsWith('간파 · ')||chest.hint.startsWith('운명의 실 · ')||chest.hint.startsWith('악마의 예언 · ')));

const falseCue:Record<ClueSignal,string>={
 fortune:'거짓 금빛 · 안쪽에서 동전이 구르는 듯한 소리가 난다',
 mystic:'거짓 속삭임 · 봉인 틈에서 낮은 목소리가 샌다',
 danger:'거짓 경고 · 쇠사슬이 저절로 팽팽해진다'
};

const pickIndex=(indices:number[],random:()=>number)=>indices.length?indices[Math.min(indices.length-1,Math.floor(random()*indices.length))]!:null;

export function applyRiskThresholdClues(chests:Chest[],risk:number,random=Math.random):number{
 if(risk<30||!chests.length)return 0;
 let changed=0;
 const eligible=()=>chests.map((c,i)=>({c,i})).filter(({c})=>!protectedHint(c)&&!c.hint?.startsWith('핏빛 안개 · ')).map(({i})=>i);
 const fogIndex=pickIndex(eligible(),random);
 if(fogIndex!==null){
  const chest=chests[fogIndex]!;
  chest.hint='핏빛 안개 · 단서가 끊겨 아무것도 읽을 수 없다';
  chest.clueSignal='mystic';
  changed++;
 }
 if(risk<45)return changed;
 const lieIndex=pickIndex(eligible().filter(i=>i!==fogIndex),random);
 if(lieIndex!==null){
  const chest=chests[lieIndex]!,actual=signalForResult(chest.result);
  const signals=(['fortune','mystic','danger'] as ClueSignal[]).filter(signal=>signal!==actual);
  const fake=signals[Math.min(signals.length-1,Math.floor(random()*signals.length))]!;
  const cue=falseCue[fake];
  chest.clueSignal=fake;chest.clue=cue;
  if(chest.hint?.startsWith('예언자의 감응 · '))chest.hint=`예언자의 감응 · ${cue}`;
  else chest.hint=`거짓 징조 · ${cue}`;
  changed++;
 }
 return changed;
}

export function escapeLockedByRisk(risk:number,revealed:boolean):boolean{
 return Number.isFinite(risk)&&risk>=60&&!revealed;
}

export function riskThresholdEvents(risk:number,revealed:boolean):RiskThresholdEvent[]{
 if(!Number.isFinite(risk))return[];
 const events:RiskThresholdEvent[]=[];
 if(risk>=30)events.push({level:30,code:'30',name:'핏빛 안개',description:'상자 단서 1개가 소실됩니다'});
 if(risk>=45)events.push({level:45,code:'45',name:'거짓 속삭임',description:'별도 단서 1개가 거짓 징조로 오염됩니다'});
 if(risk>=60)events.push({level:60,code:'60',name:'출구 봉쇄',description:revealed?'상자를 열어 탈출문이 다시 열렸습니다':'상자 하나를 열기 전 탈출할 수 없습니다',resolved:revealed});
 if(risk>=75)events.push({level:75,code:'75',name:'광기 상태',description:'모든 상자 Rare+ · 금전 보상 ×1.5 · RUIN +5%p'});
 return events;
}
