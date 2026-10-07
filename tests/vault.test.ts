import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SAVE, rewardValue } from '../src/game/balance';
import { migrateSave, SaveManager } from '../src/game/save';
import { FLOORS } from '../src/game/data/floors';
import { SPECIAL_BALANCE } from '../src/game/data/specialVaults';
import { CHEST_TIERS } from '../src/game/data/chestTiers';
import { TIER_IDS, emptyTierStats } from '../src/game/types/chest';
import { SPECIAL_IDS } from '../src/game/types/specialVault';
import { FloorManager } from '../src/game/systems/FloorManager';
import { SpecialVaultManager } from '../src/game/systems/SpecialVaultManager';
import { createRun, floorBonus, trackChest, trackFloor, summary } from '../src/game/systems/RunManager';
import { ChestTierManager } from '../src/game/systems/ChestTierManager';
import { createChests, rewardWeights, riskForRound, finalChest, applyReward } from '../src/game/systems/RewardManager';
import { clueAccuracy, clueForResult, signalForResult } from '../src/game/systems/ChestClueSystem';
import { vaultRiskPresentation } from '../src/game/systems/VaultRiskPresentation';
import { acceptWhisper, applyWhisperReveal, declineWhisper, rollWhisper, whisperChance } from '../src/game/systems/DevilWhisperSystem';
import { applyRiskThresholdClues, escapeLockedByRisk, riskThresholdEvents } from '../src/game/systems/VaultRiskThresholdSystem';
import { CHEST_PERSONALITIES, applyPersonalityWeights, personalityClueAccuracy, personalityRewardMultiplier, personalityRiskModifier, rollChestPersonality } from '../src/game/systems/ChestPersonalitySystem';
import { soundProfileForRisk } from '../src/game/audio/AudioProfile';
const fresh=()=>structuredClone(DEFAULT_SAVE);
const seeded=(seed=12345)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('B1–B5: 19 ordinary rounds, independent streak, explicit boundaries, bonus once',()=>{
 const run=createRun('gambler'),save=fresh();let total=0;
 for(const floor of FLOORS){assert.equal(run.currentFloor,FLOORS.indexOf(floor)+1);for(let r=1;r<=floor.roundCount;r++){assert.equal(run.currentFloorRound,r);run.streak=0;const clear=FloorManager.completeRound(run);total++;assert.equal(clear,r===floor.roundCount);if(!clear)FloorManager.nextRound(run);}
 assert.equal(run.phase,'floor-clear');floorBonus(save,run,seeded());const pot=run.gold;assert.equal(floorBonus(save,run),'');assert.equal(run.gold,pot);
 if(run.currentFloor<5){assert.equal(FloorManager.descend(run),true);trackFloor(save,run);}else assert.equal(FloorManager.descend(run),false);}
 assert.equal(total,19);assert.equal(run.deepestFloorReached,5);assert.equal(summary(run).completed,true);assert.equal(save.statistics.deepestFloorReached,5);
});
test('all tier distributions are normalized; Mythic absent B1–B3 and high tiers increase',()=>{
 const random=seeded(),observed=[];
 for(const floor of FLOORS){assert.equal(Object.values(floor.chestTierWeights).reduce((a,b)=>a+b,0),100);const counts=emptyTierStats();for(let i=0;i<100000;i++)counts[ChestTierManager.roll(floor.chestTierWeights,random)]++;
 for(const tier of TIER_IDS)assert.ok(Math.abs(counts[tier]/1000-floor.chestTierWeights[tier])<.6,`${floor.id}/${tier}`);
 observed.push(counts.epic+counts.legendary+counts.mythic);if(FLOORS.indexOf(floor)<3)assert.equal(counts.mythic,0);}
 for(let i=1;i<observed.length;i++)assert.ok(observed[i]>observed[i-1]);
});
test('tier, character, floor, contract and Blood risks match normalized reward weights',()=>{
 const save=fresh(),run=createRun('gambler');run.relics=['contract','crown'];run.fever=true;run.riskBonus=5;
 for(let floor=1;floor<=5;floor++)for(const tier of TIER_IDS){run.currentFloor=floor;run.currentFloorRound=3;for(const room of [null,'blood','gold'] as const){run.phase=room?'special':'normal';run.activeSpecial=room;const w=rewardWeights(save,run,tier);const actual=w.ruin/Object.values(w).reduce((a,b)=>a+b,0)*100;assert.ok(Math.abs(actual-riskForRound(3,save,run,tier))<1e-10);assert.ok(actual<=85);}}
});
test('higher tiers retain both dangerous and valuable outcomes',()=>{
 const save=fresh(),run=createRun('collector');run.currentFloor=5;const w=rewardWeights(save,run,'legendary');for(const t of ['gold','treasure','relic','jackpot','curse','ruin'])assert.ok(w[t]>0);
 let previous=0;for(const tier of CHEST_TIERS){const v=rewardValue({type:'gold',amount:100,rewardScale:tier.rewardMultiplier},save,run);assert.ok(v>previous);previous=v;}
});
test('Gold is safe, Rare+, one choice; Blood Epic+, increased risk and rewards',()=>{
 const save=fresh(),run=createRun('collector'),random=seeded();run.phase='special';run.activeSpecial='gold';for(let i=0;i<1000;i++)for(const c of createChests(save,run,random)){assert.ok(TIER_IDS.indexOf(c.tier)>=2);assert.equal(c.ruinChance,0);assert.ok(!['curse','ruin'].includes(c.result.type));}
 run.activeSpecial='blood';for(let i=0;i<1000;i++)for(const c of createChests(save,run,random)){assert.ok(TIER_IDS.indexOf(c.tier)>=3);assert.ok(c.result.rewardScale!>=14);assert.ok(c.ruinChance>=18);}
});
test('Cursed room has precisely two rewards and one shuffled trap; hints work',()=>{
 const save=fresh(),run=createRun('seer'),random=seeded();run.phase='special';run.activeSpecial='cursed';const badIndices=new Set<number>();for(let i=0;i<300;i++){const chests=createChests(save,run,random);const bad=chests.filter(c=>['curse','ruin'].includes(c.result.type));assert.equal(bad.length,1);badIndices.add(chests.indexOf(bad[0]!));assert.ok(chests.some(c=>c.hint?.includes('예언자')));assert.ok(chests.every(c=>Math.abs(c.ruinChance-100/6)<1e-10));}assert.equal(badIndices.size,3);
 run.relics=['eye','thread'];run.relicUsed=[];const chests=createChests(save,run,()=>0);assert.ok(chests.some(c=>c.hint));assert.ok(run.relicUsed.includes('eye'));
});
test('chest omens hint at outcome families, sometimes mislead, and improve with Seer/Insight',()=>{
 const fortune={type:'gold' as const},mystic={type:'relic' as const},danger={type:'ruin' as const};
 assert.equal(signalForResult(fortune),'fortune');assert.equal(signalForResult(mystic),'mystic');assert.equal(signalForResult(danger),'danger');
 assert.ok(clueAccuracy('gambler',0)<clueAccuracy('seer',0));assert.ok(clueAccuracy('gambler',0)<clueAccuracy('gambler',2));assert.equal(clueAccuracy('seer',3),.96);
 const sample=(accuracy:number)=>{const random=seeded(77);let correct=0;for(let i=0;i<12000;i++){const result=[fortune,mystic,danger][i%3]!;if(clueForResult(result,random,accuracy).signal===signalForResult(result))correct++;}return correct/12000;};
 const base=sample(clueAccuracy('gambler',0)),seer=sample(clueAccuracy('seer',0));
 assert.ok(Math.abs(base-.7)<.015,'base clue accuracy '+base);assert.ok(Math.abs(seer-.84)<.015,'Seer clue accuracy '+seer);
 const save=fresh(),run=createRun('gambler'),clues=createChests(save,run,seeded());
 assert.equal(clues.length,3);assert.ok(clues.every(c=>c.clue.length>12&&c.clueSignal));
 const seerRun=createRun('seer'),seerChests=createChests(save,seerRun,seeded());
 assert.ok(seerChests.every(c=>c.hint?.startsWith('예언자의 감응 · ')));
});
test('chest personalities change risk, rewards, odds and clue reliability',()=>{
 const random=seeded(991),seen=new Set<string>();for(let i=0;i<4000;i++)seen.add(rollChestPersonality(random));assert.deepEqual([...seen].sort(),CHEST_PERSONALITIES.map(p=>p.id).sort());
 assert.ok(personalityRiskModifier('greedy')>0);assert.ok(personalityRiskModifier('blood')>0);assert.ok(personalityRiskModifier('coward')<0);assert.equal(personalityRiskModifier('liar'),0);
 assert.ok(personalityRewardMultiplier('greedy',null)>1);assert.ok(personalityRewardMultiplier('coward',null)<1);assert.equal(personalityRewardMultiplier('coward','blood'),1);
 assert.ok(personalityClueAccuracy('liar',.84)<.55);assert.equal(personalityClueAccuracy('greedy',.84),.84);
 const base={gold:56,multiplier:18,treasure:11,relic:7,curse:6,ruin:2,jackpot:.5};const blood={...base};applyPersonalityWeights(blood,'blood');assert.ok(blood.jackpot>base.jackpot);assert.ok(blood.curse>base.curse);
 const greed={...base};applyPersonalityWeights(greed,'greedy');assert.ok(greed.treasure>base.treasure);assert.ok(greed.jackpot>base.jackpot);
 const save=fresh(),run=createRun('gambler'),chests=createChests(save,run,seeded(22));assert.ok(chests.every(c=>c.personality));for(const c of chests)assert.equal(c.ruinChance,riskForRound(run.round,save,run,c.tier,c.personality));
});
test('sound profile intensifies monotonically across RUIN thresholds',()=>{
 const risks=[0,15,30,45,60,85],profiles=risks.map(soundProfileForRisk);
 assert.deepEqual(profiles.map(p=>p.level),['quiet','watch','danger','severe','critical','critical']);
 for(let i=1;i<profiles.length;i++){assert.ok(profiles[i]!.droneGain>=profiles[i-1]!.droneGain);assert.ok(profiles[i]!.noiseGain>=profiles[i-1]!.noiseGain);assert.ok(profiles[i]!.heartbeatMs<=profiles[i-1]!.heartbeatMs);}
 assert.equal(soundProfileForRisk(Number.NaN).risk,0);assert.equal(soundProfileForRisk(500).risk,100);
});
test('vault threat presentation follows actual maximum RUIN probability',()=>{
 const cases:[[number,string,string],...Array<[number,string,string]>]=[[0,'calm','안정'],[14.9,'calm','안정'],[15,'watch','경계'],[29.9,'watch','경계'],[30,'danger','위험'],[44.9,'danger','위험'],[45,'extreme','치명적'],[85,'extreme','치명적']];
 for(const [risk,level,label] of cases){const state=vaultRiskPresentation(risk);assert.equal(state.level,level);assert.equal(state.label,label);assert.ok(state.title.length>5);}
 assert.equal(vaultRiskPresentation(-5).risk,0);assert.equal(vaultRiskPresentation(500).risk,100);assert.equal(vaultRiskPresentation(Number.NaN).risk,0);
});
test('risk thresholds obscure clues at 30, deceive at 45 and seal escape at 60',()=>{
 const base=()=>[
  {tier:'common' as const,ruinChance:62,clue:'gold cue',clueSignal:'fortune' as const,result:{type:'gold' as const,amount:100}},
  {tier:'common' as const,ruinChance:62,clue:'ruin cue',clueSignal:'danger' as const,result:{type:'ruin' as const}},
  {tier:'common' as const,ruinChance:62,clue:'relic cue',clueSignal:'mystic' as const,result:{type:'relic' as const,name:'악마의 눈',detail:'eye'}}
 ];
 const low=base();assert.equal(applyRiskThresholdClues(low,29.9,()=>0),0);assert.equal(low[0]!.clue,'gold cue');
 const fog=base();assert.equal(applyRiskThresholdClues(fog,30,()=>0),1);assert.ok(fog.some(c=>c.hint?.includes('핏빛 안개')));
 const lie=base();assert.equal(applyRiskThresholdClues(lie,45,()=>0),2);assert.equal(lie.filter(c=>c.hint?.includes('핏빛 안개')).length,1);assert.ok(lie.some(c=>c.clue.includes('거짓')||c.hint?.includes('거짓')));
 const protectedClues=base();protectedClues[0]!.hint='간파 · 금화';protectedClues[1]!.hint='운명의 실 · RUIN';protectedClues[2]!.hint='악마의 예언 · 유물';assert.equal(applyRiskThresholdClues(protectedClues,60,()=>0),0);assert.equal(protectedClues[0]!.hint,'간파 · 금화');
 assert.equal(escapeLockedByRisk(59.9,false),false);assert.equal(escapeLockedByRisk(60,false),true);assert.equal(escapeLockedByRisk(85,true),false);
 assert.deepEqual(riskThresholdEvents(29.9,false),[]);assert.equal(riskThresholdEvents(30,false).length,1);assert.equal(riskThresholdEvents(45,false).length,2);const critical=riskThresholdEvents(60,false);assert.equal(critical.length,3);assert.equal(critical[2]!.resolved,false);assert.equal(riskThresholdEvents(60,true)[2]!.resolved,true);
});
test('devil whispers respect eligibility, cooldown, costs and one-shot boons',()=>{
 const save=fresh(),run=createRun('gambler');assert.equal(rollWhisper(run,()=>0),null);run.completedRounds=1;assert.ok(whisperChance(run)>.2);
 const offered=rollWhisper(run,()=>0)!;assert.equal(offered.id,'blood-advance');assert.equal(run.whisperCount,1);assert.equal(run.whisperCooldown,3);run.gold=1000;const before=run.gold;const accepted=acceptWhisper(run);assert.ok(accepted.includes('피의 선금'));assert.ok(run.gold>before);assert.equal(run.riskBonus,6);assert.equal(run.pendingWhisper,null);
 run.pendingWhisper='black-prophecy';acceptWhisper(run);assert.equal(run.riskBonus,10);run.chests=[{tier:'common',ruinChance:12,clue:'',result:{type:'gold',amount:100,name:'금화'}},{tier:'common',ruinChance:12,clue:'',result:{type:'ruin',name:'RUIN'}},{tier:'common',ruinChance:12,clue:'',result:{type:'relic',name:'악마의 눈'}}];assert.equal(applyWhisperReveal(run,()=>.4),true);assert.ok(run.chests.some(c=>c.hint?.startsWith('악마의 예언 · ')));assert.equal(run.whisperReveal,false);
 run.pendingWhisper='greed-blessing';acceptWhisper(run);assert.equal(run.whisperRewardMultiplier,2);const gain=applyReward({type:'gold',amount:100},save,run);assert.ok(gain>=200);assert.equal(run.whisperRewardMultiplier,1);
 run.pendingWhisper='blood-advance';declineWhisper(run);assert.equal(run.pendingWhisper,null);
});
test('Relic room offers three distinct visible relics; shop charges run gold once',()=>{
 const save=fresh(),run=createRun('gambler');run.phase='special';run.activeSpecial='relic';const cs=createChests(save,run,seeded());assert.equal(new Set(cs.map(c=>c.result.detail)).size,3);for(const c of cs){assert.equal(c.result.type,'relic');assert.equal(c.hint,c.result.name);assert.equal(c.ruinChance,0);}
 applyReward(cs[0].result,save,run);assert.ok(run.relics.includes(cs[0].result.detail!));run.activeSpecial='shop';SpecialVaultManager.offers(run);assert.equal(SpecialVaultManager.buy(run,'contract'),false);run.gold=6000;const original=save.soulCoins;assert.equal(SpecialVaultManager.buy(run,'contract'),true);assert.equal(run.gold,3500);assert.equal(SpecialVaultManager.buy(run,'contract'),false);assert.equal(run.gold,3500);assert.equal(save.soulCoins,original);assert.ok(run.relics.includes('contract'));
});
test('room entry/skip resume next ordinary round; cooldown and max/min config',()=>{
 const run=createRun('gambler');FloorManager.completeRound(run);assert.equal(SpecialVaultManager.discover(run,()=>0),'gold');assert.equal(run.phase,'special-offer');assert.equal(SpecialVaultManager.enter(run),true);SpecialVaultManager.leave(run);assert.equal(run.currentFloorRound,2);assert.equal(run.activeSpecial,null);FloorManager.completeRound(run);assert.equal(SpecialVaultManager.discover(run,()=>0),null);
 run.specialCooldown=0;run.specialCount=SPECIAL_BALANCE.maxPerRun;assert.equal(SpecialVaultManager.discover(run,()=>0),null);
 const skipped=createRun('gambler');SpecialVaultManager.discover(skipped,()=>0);SpecialVaultManager.leave(skipped);assert.equal(skipped.specialVaultsVisited.length,0);assert.equal(skipped.specialVaultsDiscovered.length,1);
 const min=SPECIAL_BALANCE.minPerRun;SPECIAL_BALANCE.minPerRun=1;const deep=createRun('gambler');deep.currentFloor=5;deep.currentFloorRound=4;assert.ok(SpecialVaultManager.discover(deep,()=>.99));SPECIAL_BALANCE.minPerRun=min;
});
test('final chest is Mythic, all four outcomes and fixed 25% ruin',()=>{
 const save=fresh(),run=createRun('gambler');run.currentFloor=5;run.phase='final';const results=new Set();for(const roll of [.1,.4,.6,.9]){const c=finalChest(save,run,()=>roll);assert.equal(c.tier,'mythic');assert.equal(c.ruinChance,25);results.add(c.result.type);if(c.result.type==='multiplier')assert.equal(c.result.amount,10);}assert.equal(results.size,4);
});
test('counts include all grades; achievements and retry reset run state only',()=>{
 const save=fresh(),run=createRun('immortal');for(const tier of TIER_IDS){run.chests=[{tier,ruinChance:20,clue:'',result:{type:'gold'}}];run.selected=0;trackChest(save,run);}assert.equal(summary(run).highest,'mythic');assert.equal(summary(run).mythic,1);const next=createRun('gambler');assert.equal(next.currentFloor,1);assert.equal(next.currentFloorRound,1);assert.equal(next.specialCount,0);assert.equal(next.activeSpecial,null);assert.deepEqual(next.chestTierStats,emptyTierStats());assert.equal(save.statistics.chestTierStats.mythic,1);
});
test('v1 save migrates, corrupt values sanitize, nested counters round-trip',()=>{
 const old=migrateSave({version:1,soulCoins:37,upgrades:{greed:3},statistics:{runs:8,bestRun:30000},achievements:['first_escape'],settings:{sound:false}});assert.equal(old.version,2);assert.equal(old.soulCoins,37);assert.equal(old.statistics.runs,8);assert.equal(old.statistics.bestRun,30000);assert.deepEqual(old.statistics.chestTierStats,emptyTierStats());assert.equal(old.settings.sound,false);assert.ok(old.achievements.includes('first_escape'));
 const corrupt=migrateSave({soulCoins:-5,jackpotGauge:500,statistics:{runs:'x',deepestFloorReached:20,chestTierStats:{mythic:null}},upgrades:{greed:99}});assert.equal(corrupt.soulCoins,0);assert.equal(corrupt.jackpotGauge,100);assert.equal(corrupt.upgrades.greed,5);assert.equal(corrupt.statistics.deepestFloorReached,5);
 const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)} as Storage;old.statistics.chestTierStats.legendary=12;old.statistics.specialVaultTypes=['blood'];SaveManager.save(old);assert.deepEqual(SaveManager.load(),old);assert.equal(SaveManager.reset().statistics.runs,0);
});
test('curse risk really persists, ring/hand/collector/meta/Fever stack through existing reward value',()=>{
 const save=fresh(),run=createRun('collector',true);run.relics=['hand','contract','ring'];save.upgrades.treasure=2;applyReward({type:'curse',detail:'위험도 +5%p'},save,run);assert.equal(run.riskBonus,5);applyReward({type:'gold',amount:100,rewardScale:2},save,run);assert.equal(run.gold,1950);assert.ok(run.relicUsed.includes('hand'));assert.equal(rewardValue({type:'treasure',amount:100,rewardScale:2},save,run),1138);
});
test('seeded reward sampling: deeper floors increase average money and Ruin',()=>{
 const save=fresh(),random=seeded(829);let previous=0,previousRisk=0;const output=[];
 for(let floor=1;floor<=5;floor++){const run=createRun('gambler');run.currentFloor=floor;let money=0,ruins=0;for(let i=0;i<15000;i++)for(const c of createChests(save,run,random)){if(['gold','treasure','jackpot'].includes(c.result.type))money+=rewardValue(c.result,save,run);if(c.result.type==='ruin')ruins++;}const mean=money/45000,risk=ruins/450;assert.ok(mean>previous);assert.ok(risk>previousRisk);previous=mean;previousRisk=risk;output.push(`B${floor}: avg ${mean.toFixed(0)}G, ruin ${risk.toFixed(1)}%`);}console.log(output.join(' | '));
});
