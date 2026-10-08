import { BALANCE, RELICS, weightedRandom, rewardValue, type Chest, type ChestResult, type ResultType, type RunState, type SaveData } from '../balance';
import { FloorManager } from './FloorManager';
import { ChestTierManager } from './ChestTierManager';
import { SPECIAL_VAULTS, FINAL_CHEST, SPECIAL_BALANCE } from '../data/specialVaults';
import type { ChestTier } from '../types/chest';
import { addChestClues, clueAccuracy } from './ChestClueSystem';
import { applyRiskThresholdClues } from './VaultRiskThresholdSystem';
import { applyPersonalityWeights, personalityClueAccuracy, personalityRewardMultiplier, personalityRiskModifier, rollChestPersonality } from './ChestPersonalitySystem';
import type { ChestPersonalityId } from '../types/chestPersonality';
import { isMadnessRisk, madnessRewardMultiplier, madnessRisk, madnessTier } from './VaultMadnessSystem';

export function riskForRound(_round:number,_save:SaveData,run:RunState,tier:ChestTier='common',personality?:ChestPersonalityId):number {
 const floor=FloorManager.definition(run);
 const base=BALANCE.danger[Math.min(run.currentFloorRound-1,BALANCE.danger.length-1)]!;
 const room=run.activeSpecial&&run.phase==='special'?SPECIAL_VAULTS.find(v=>v.id===run.activeSpecial):null;
 const risk=base+floor.riskModifier+ChestTierManager.definition(tier).riskModifier+run.riskBonus+personalityRiskModifier(personality,run.phase==='special'?run.activeSpecial:null)+(run.relics.includes('contract')?10:0)-(run.character==='gambler'?2:0);
 return Math.min(85,Math.max(.5,risk)*(room?.riskMultiplier??1));
}
export function rewardWeights(save:SaveData,run:RunState,tier:ChestTier,personality?:ChestPersonalityId,riskOverride?:number):Record<ResultType,number> {
 const floor=FloorManager.definition(run),def=ChestTierManager.definition(tier);
 const w:Record<ResultType,number>={...BALANCE.baseWeights};
 w.gold+=(save.upgrades.fortune??0)*2;
 w.treasure+=(save.upgrades.treasure??0)*1.5+floor.treasureWeight;
 w.relic+=floor.relicWeight;w.jackpot+=floor.jackpotWeight;w.curse+=floor.curseWeight;
 if(run.relics.includes('crown')){w.jackpot+=3;w.curse+=4;}
 if(run.fever){w.jackpot+=2.5;w.treasure+=6;}
 for(const key of Object.keys(def.weights) as ResultType[])w[key]*=def.weights[key]!;
 applyPersonalityWeights(w,personality);
 if(run.phase==='special'&&run.activeSpecial==='gold'){w.curse=0;w.gold*=2;}
 if(run.phase==='special'&&run.activeSpecial==='blood'){w.jackpot*=2;w.curse*=2;}
 const risk=riskOverride??riskForRound(run.round,save,run,tier,personality);
 const safe=Object.entries(w).reduce((n,[k,v])=>n+(k==='ruin'?0:v),0);
 w.ruin=risk/(100-risk)*safe;
 return w;
}
function resultFor(type:ResultType,run:RunState,tier:ChestTier,random:()=>number,personality?:ChestPersonalityId,rewardBonus=1):ChestResult {
 const pick=<T>(xs:readonly T[])=>xs[Math.floor(random()*xs.length)]!;
 const floor=FloorManager.definition(run),room=run.phase==='special'?SPECIAL_VAULTS.find(v=>v.id===run.activeSpecial):null;
 const rewardScale=floor.rewardMultiplier*ChestTierManager.definition(tier).rewardMultiplier*(room?.rewardMultiplier??1)*personalityRewardMultiplier(personality,run.phase==='special'?run.activeSpecial:null)*rewardBonus;
 const base={type,rewardScale};
 if(type==='gold')return {...base,amount:pick(BALANCE.goldValues),name:'금화'};
 if(type==='multiplier')return {...base,amount:(pick([1.25,1.5,2,3])+(tier==='epic'?.5:tier==='legendary'?1:tier==='mythic'?2:0))*(room?.rewardMultiplier??1),name:'배율 상승'};
 if(type==='treasure'){const t=pick([['핏빛 다이아',900],['저주받은 왕관',1400],['악마의 동전',750],['황금 해골',1800]] as const);return {...base,amount:t[1],name:tier==='mythic'?'Mythic Treasure · 왕의 영혼':t[0]};}
 if(type==='relic'){const r=pick(RELICS);return {...base,name:r.name,detail:r.id};}
 if(type==='curse'){const loss=tier==='legendary'||tier==='mythic'?.4:.2;const detail=pick([`현재 골드 ${loss*100}% 감소`,'배율 한 단계 하락','위험도 +5%p']);return {...base,name:'저주',detail,curseLoss:loss};}
 if(type==='jackpot')return {...base,amount:Math.round(500*(1+run.streak*.35)),name:tier==='mythic'?'MASSIVE JACKPOT':'JACKPOT'};
 return {...base,name:'RUIN'};
}
export function applyHints(chests:Chest[],save:SaveData,run:RunState,random=Math.random){
 const insight=save.upgrades.insight??0;
 const accuracy=clueAccuracy(run.character,insight);
 for(const chest of chests)addChestClues([chest],random,personalityClueAccuracy(chest.personality,accuracy));
 if(run.character==='seer')for(const c of chests)c.hint=`예언자의 감응 · ${c.clue}`;
 if(run.relics.includes('eye')&&!run.relicUsed.includes('eye')){const c=chests[Math.floor(random()*chests.length)]!;c.hint=`간파 · ${c.result.name??c.result.type.toUpperCase()}`;run.relicUsed.push('eye');}
 if(run.relics.includes('thread')&&!run.relicUsed.includes('thread')){const c=chests.find(c=>c.result.type==='ruin');if(c){c.hint='운명의 실 · RUIN';run.relicUsed.push('thread');}}
}
export function createChests(save:SaveData,run:RunState,random=Math.random):Chest[]{
 const floor=FloorManager.definition(run);
 const curatedPersonality=run.phase==='special'&&(run.activeSpecial==='cursed'||run.activeSpecial==='relic');
 const specs=Array.from({length:3},()=>{
  const personality=curatedPersonality?undefined:rollChestPersonality(random);
  const tier=run.phase==='special'&&run.activeSpecial==='gold'?weightedRandom<ChestTier>([{value:'rare',weight:70},{value:'epic',weight:25},{value:'legendary',weight:5}],random):run.phase==='special'&&run.activeSpecial==='blood'?weightedRandom<ChestTier>([{value:'epic',weight:55},{value:'legendary',weight:35},{value:'mythic',weight:10}],random):ChestTierManager.roll(floor.chestTierWeights,random);
  return{personality,tier};
 });
 const madness=!curatedPersonality&&specs.some(({tier,personality})=>isMadnessRisk(riskForRound(run.round,save,run,tier,personality)));
 const chests:Chest[]=specs.map(({personality,tier:rolledTier})=>{
  const tier=madness?madnessTier(rolledTier):rolledTier;
  const baseRisk=riskForRound(run.round,save,run,tier,personality),ruinChance=madness?madnessRisk(baseRisk):baseRisk;
  const weights=rewardWeights(save,run,tier,personality,ruinChance);
  const type=weightedRandom(Object.entries(weights).map(([value,weight])=>({value:value as ResultType,weight})),random);
  return {tier,personality,ruinChance,clue:ChestTierManager.definition(tier).description,result:resultFor(type,run,tier,random,personality,madnessRewardMultiplier(madness))};
 });
 if(run.phase==='special'&&run.activeSpecial==='cursed'){
  // Same appearance on all three seals; shuffling conceals the single trap.
  for(let i=0;i<3;i++){const c=chests[i]!;c.personality=undefined;c.tier='epic';c.ruinChance=SPECIAL_BALANCE.cursedRuinChance/3*100;c.clue='세 봉인 중 하나가 저주받았다';c.result=resultFor(i<2?(i===0?'treasure':'jackpot'):(random()<SPECIAL_BALANCE.cursedRuinChance?'ruin':'curse'),run,'epic',random);if(i===2&&c.result.type==='curse'){c.result.detail='현재 골드 40% 감소';c.result.curseLoss=.4;}}
  for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[chests[i],chests[j]]=[chests[j]!,chests[i]!];}
 }
 if(run.phase==='special'&&run.activeSpecial==='relic'){
  const pool=[...RELICS];for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j]!,pool[i]!];}
  for(let i=0;i<3;i++){const relic=pool[i]!;chests[i]={tier:'rare',ruinChance:0,clue:relic.text,hint:relic.name,result:{type:'relic',name:relic.name,detail:relic.id}};}
 }else {applyHints(chests,save,run,random);applyRiskThresholdClues(chests,Math.max(0,...chests.map(c=>c.ruinChance)),random);}
 return chests;
}
export function finalChest(save:SaveData,run:RunState,random=Math.random):Chest {
 const w=FINAL_CHEST.weights;
 const type=weightedRandom(Object.entries(w).map(([value,weight])=>({value:value as ResultType,weight})),random);
 const r:ChestResult={type,name:type==='jackpot'?'MASSIVE JACKPOT':type==='treasure'?'Mythic Treasure · 악마의 왕관':type==='multiplier'?'악마의 ×10':'RUIN',amount:type==='jackpot'?FINAL_CHEST.jackpot:type==='treasure'?FINAL_CHEST.treasure:type==='multiplier'?FINAL_CHEST.multiplier:0,rewardScale:FloorManager.definition(run).rewardMultiplier*ChestTierManager.definition('mythic').rewardMultiplier};
 const c:Chest={tier:'mythic',ruinChance:w.ruin/Object.values(w).reduce((a,b)=>a+b,0)*100,clue:'JACKPOT · ×10 · 신화 보물 · RUIN',result:r};
 applyHints([c],save,run,random);return c;
}
export function grantRelic(run:RunState,id:string){if(!run.relics.includes(id))run.relics.push(id);run.relicUsed=run.relicUsed.filter(r=>r!==id);if(id==='insurance')run.insuranceUsed=false;}
export function applyReward(result:ChestResult,save:SaveData,run:RunState):number {
 const before=run.gold;
 if(['gold','treasure','jackpot'].includes(result.type)){run.gold+=rewardValue(result,save,run)+run.treasureGoldBonus;run.treasureGoldBonus=0;run.collected.push(result.name??'금화');if(run.whisperRewardMultiplier>1)run.whisperRewardMultiplier=1;}
 if(result.type==='multiplier')run.gold=Math.round(Math.max(run.gold,100)*(result.amount??1));
 if(result.type==='curse'){if(result.detail?.includes('감소'))run.gold=Math.floor(run.gold*(1-(result.curseLoss??.2)));else if(result.detail?.includes('배율'))run.streak=Math.max(0,run.streak-1);else if(result.detail?.includes('위험도'))run.riskBonus+=5;run.collected.push(`저주: ${result.detail}`);}
 if(result.type==='relic'&&result.detail)grantRelic(run,result.detail);
 if(run.relics.includes('hand')&&result.type==='gold'&&!run.relicUsed.includes('hand'))run.relicUsed.push('hand');
 return run.gold-before;
}
