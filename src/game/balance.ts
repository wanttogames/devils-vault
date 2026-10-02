export const BALANCE = {
  multipliers: [1, 1.25, 1.5, 2, 2.8, 4, 6, 9, 13, 20],
  danger: [2, 3, 5, 8, 12, 17, 23, 30, 38, 48],
  baseWeights: { gold: 56, multiplier: 18, treasure: 11, relic: 7, curse: 6, ruin: 2, jackpot: 0.5 },
  goldValues: [50, 100, 150, 250, 500],
  upgrades: [
    { id: 'fortune', name: '악마의 눈금', desc: '금괴·보물 등장 확률 +2%p', max: 5, cost: [20, 35, 55, 80, 110] },
    { id: 'greed', name: '탐욕의 서약', desc: '연승 배율 +4%', max: 5, cost: [25, 45, 70, 100, 140] },
    { id: 'insight', name: '핏빛 통찰', desc: '상자 단서를 더 선명하게 읽습니다', max: 3, cost: [30, 60, 100] },
    { id: 'insurance', name: '영혼 보험', desc: 'RUN당 RUIN을 한 번 막아냅니다', max: 1, cost: [120] },
    { id: 'treasure', name: '도굴꾼의 삽', desc: '희귀 보물 가치 +20%', max: 5, cost: [25, 45, 70, 100, 140] },
  ],
} as const;
export const RELICS = [
  { id: 'eye', name: '악마의 눈', icon: '◉', text: '상자 하나의 결과를 미리 꿰뚫어 봅니다.' },
  { id: 'hand', name: '황금 손', icon: '✦', text: '다음 골드 보상이 3배가 됩니다.' },
  { id: 'thread', name: '운명의 실', icon: '⌁', text: 'RUIN 상자를 붉게 표시합니다.' },
  { id: 'contract', name: '피의 계약', icon: '♜', text: '모든 보상이 2배, 위험도도 +10%p.' },
  { id: 'insurance', name: '악마의 보험', icon: '⛨', text: 'RUIN을 한 번 막고 보상을 지킵니다.' },
  { id: 'ring', name: '탐욕의 반지', icon: '◌', text: '연승 배율 +30%, 탈출 보상은 -10%.' },
  { id: 'coin', name: '검은 동전', icon: '●', text: '상자를 고른 뒤 결과가 싫으면 한 번 재선택.' },
  { id: 'crown', name: '부서진 왕관', icon: '♛', text: 'JACKPOT과 CURSE 확률이 함께 증가합니다.' },
] as const;
export const CHARACTERS = [
  { id: 'gambler', name: '도박사', title: '운명은 흔드는 자의 편', desc: '기본 RUIN 확률 -2%p', icon: '♠' },
  { id: 'seer', name: '예언자', title: '금고의 속삭임을 듣는다', desc: '매 라운드 가장 안전한 상자에 희미한 빛', icon: '◉' },
  { id: 'collector', name: '수집가', title: '빈손으로 돌아가지 않는다', desc: '보물 골드 +25%', icon: '♜' },
  { id: 'immortal', name: '불사자', title: '죽음과 한 번 거래했다', desc: '첫 RUIN을 체력 1로 견딤', icon: '†' },
] as const;
export type ResultType = 'gold'|'multiplier'|'treasure'|'relic'|'curse'|'ruin'|'jackpot';
export type ChestResult = { type: ResultType; amount?: number; name?: string; detail?: string };
export type Chest = { clue: string; result: ChestResult; hint?: string };
export type Settings = { sound: boolean; shake: boolean; reducedMotion: boolean };
export type Stats = { runs: number; escapes: number; ruins: number; bestStreak: number; bestRun: number; jackpots: number; lifetimeGold: number; doubleWins: number };
export type SaveData = { version: number; soulCoins: number; jackpotGauge: number; upgrades: Record<string,number>; unlockedCharacters: string[]; achievements: string[]; statistics: Stats; settings: Settings; tutorialCompleted: boolean; introSeen: boolean };
export type RunState = { gold: number; streak: number; round: number; chests: Chest[]; selected: number|null; revealed: boolean; relics: string[]; relicUsed: string[]; character: string; insuranceUsed: boolean; extraLifeUsed: boolean; doubleUsed: boolean; fever: boolean; treasureGoldBonus: number; pendingEscape: boolean; collected: string[] };
export const DEFAULT_SAVE: SaveData = { version: 1, soulCoins: 0, jackpotGauge: 0, upgrades: {}, unlockedCharacters: ['gambler','seer','collector','immortal'], achievements: [], statistics: { runs:0, escapes:0, ruins:0, bestStreak:0, bestRun:0, jackpots:0, lifetimeGold:0, doubleWins:0 }, settings: { sound:true, shake:true, reducedMotion:false }, tutorialCompleted:false, introSeen:false };
export function weightedRandom<T>(items: Array<{ value:T; weight:number }>, random=Math.random): T {
  const total = items.reduce((n,item)=>n+Math.max(0,item.weight),0);
  if (total <= 0) throw new Error('weightedRandom requires a positive total weight');
  let roll = random()*total;
  for (const item of items) { roll -= Math.max(0,item.weight); if (roll < 0) return item.value; }
  return items[items.length-1].value;
}
export function riskForRound(round:number, _save:SaveData, run:RunState):number {
  const base = BALANCE.danger[Math.min(Math.max(round-1,0),BALANCE.danger.length-1)] ?? 48;
  const character = run.character === 'gambler' ? 2 : 0;
  const curse = run.relics.includes('contract') ? 10 : 0;
  return Math.max(.5, Math.min(85, base-character+curse));
}
export function createChests(save:SaveData,run:RunState):Chest[] {
  const risk = riskForRound(run.round,save,run);
  return Array.from({length:3},(_,i)=>{
    const weights:Record<ResultType,number> = { ...BALANCE.baseWeights, gold: BALANCE.baseWeights.gold + (save.upgrades.fortune ?? 0)*2, treasure: BALANCE.baseWeights.treasure+(save.upgrades.treasure ?? 0)*1.5 };
    if(run.relics.includes('crown')) { weights.jackpot+=3; weights.curse+=4; }
    if(run.fever) { weights.jackpot+=2.5; weights.treasure+=6; }
    // Normalize RUIN to the same per-chest probability shown in the HUD.
    const safeWeight=Object.entries(weights).reduce((sum,[key,value])=>sum+(key==='ruin'?0:value),0);
    weights.ruin=Math.max(.05, risk/(100-risk)*safeWeight);
    const type=weightedRandom<ResultType>(Object.entries(weights).map(([value,weight])=>({value:value as ResultType,weight})));
    const gold= BALANCE.goldValues[Math.floor(Math.random()*BALANCE.goldValues.length)] ?? 100;
    const treasures:[string,number][]=[['핏빛 다이아',900],['저주받은 왕관',1400],['악마의 동전',750],['황금 해골',1800]];
    let result:ChestResult;
    if(type==='gold') result={type,amount:gold,name:'금화'};
    else if(type==='multiplier') result={type,amount:[1.25,1.5,2,3][Math.floor(Math.random()*4)],name:'배율 상승'};
    else if(type==='treasure') { const treasure=treasures[Math.floor(Math.random()*treasures.length)]!; result={type,amount:treasure[1],name:treasure[0]}; }
    else if(type==='relic') { const relic=RELICS[Math.floor(Math.random()*RELICS.length)]!; result={type,name:relic.name,detail:relic.id}; }
    else if(type==='curse') result={type,name:'저주',detail:['현재 골드 20% 감소','배율 한 단계 하락','위험도 +5%p'][Math.floor(Math.random()*3)]!};
    else if(type==='jackpot') result={type,amount:Math.round(500*(1+run.streak*.35)),name:'JACKPOT'};
    else result={type,name:'RUIN'};
    const clues:Record<ResultType,string[]>={gold:['금빛 먼지','잔잔한 금속음','따뜻한 빛'],multiplier:['문양이 회전한다','쇠사슬이 풀렸다','붉은 각인'],treasure:['상자 안쪽의 광채','묵직한 진동','황금 향'],relic:['오래된 속삭임','푸른 불꽃','낯선 문장'],curse:['식은 촛불','검은 안개','갈라진 봉인'],ruin:['붉게 맥동하는 봉인','상자 밑의 검은 연기','날카로운 진동'],jackpot:['금고 안에서 울리는 종','붉은 문양이 황금빛으로','멈추지 않는 금속음']};
    let clue=clues[type][Math.floor(Math.random()*clues[type].length)]!;
    if(save.upgrades.insight) clue=`${clue}${save.upgrades.insight>=2?` · ${type==='ruin'?'위험':'안정'}한 기운`:''}`;
    if(run.character==='seer'&&type!=='ruin'&&i===Math.floor(Math.random()*3)) clue+=` · 예언자의 빛`;
    return { clue, result };
  });
}
export function rewardValue(result:ChestResult,save:SaveData,run:RunState):number {
  const multiplier=BALANCE.multipliers[Math.min(Math.max(run.streak-1,0),BALANCE.multipliers.length-1)]!*(1+(save.upgrades.greed??0)*.04)*(run.relics.includes('ring')?1.3:1)*(run.fever?1.25:1)*(run.relics.includes('contract')?2:1);
  const raw=result.amount??0;
  const collector=run.character==='collector'&&result.type==='treasure'?1.25:1;
  const bonus=result.type==='treasure'?1+(save.upgrades.treasure??0)*.2:1;
  const hand=run.relics.includes('hand')&&!run.relicUsed.includes('hand')&&result.type==='gold'?3:1;
  return Math.max(0,Math.round(raw*multiplier*collector*bonus*hand));
}
