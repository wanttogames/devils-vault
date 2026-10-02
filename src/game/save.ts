import { DEFAULT_SAVE, BALANCE, type SaveData } from './balance';
import { TIER_IDS, emptyTierStats } from './types/chest';
import { SPECIAL_IDS } from './types/specialVault';
const KEY='devils-vault-save-v1'; // Keep the original key so installed v1 saves migrate in place.
const count=(x:unknown,fallback=0)=>typeof x==='number'&&Number.isFinite(x)?Math.max(0,Math.floor(x)):fallback;
export function migrateSave(raw:unknown):SaveData {
 const base=structuredClone(DEFAULT_SAVE);
 if(!raw||typeof raw!=='object')return base;
 const saved=raw as Partial<SaveData>,stats=saved.statistics;
 for(const key of Object.keys(base.statistics) as (keyof typeof base.statistics)[]){if(typeof base.statistics[key]==='number')(base.statistics as unknown as Record<string,unknown>)[key]=count(stats?.[key]);}
 base.statistics.deepestFloorReached=Math.min(5,base.statistics.deepestFloorReached);
 base.statistics.chestTierStats=emptyTierStats();for(const tier of TIER_IDS)base.statistics.chestTierStats[tier]=count(stats?.chestTierStats?.[tier]);
 base.statistics.specialVaultTypes=[...new Set(Array.isArray(stats?.specialVaultTypes)?stats.specialVaultTypes.filter(v=>SPECIAL_IDS.includes(v)):[])];
 base.soulCoins=count(saved.soulCoins);base.jackpotGauge=Math.min(100,count(saved.jackpotGauge));
 for(const u of BALANCE.upgrades)base.upgrades[u.id]=Math.min(u.max,count(saved.upgrades?.[u.id]));
 base.achievements=Array.isArray(saved.achievements)?saved.achievements.filter((v):v is string=>typeof v==='string'):[];
 for(const key of Object.keys(base.settings) as (keyof typeof base.settings)[])if(typeof saved.settings?.[key]==='boolean')base.settings[key]=saved.settings[key]!;
 base.tutorialCompleted=saved.tutorialCompleted===true;base.introSeen=saved.introSeen===true;
 return base;
}
export const SaveManager={
 load():SaveData {try {const raw=localStorage.getItem(KEY);return raw?migrateSave(JSON.parse(raw)):structuredClone(DEFAULT_SAVE);}catch{return structuredClone(DEFAULT_SAVE);}},
 save(data:SaveData){localStorage.setItem(KEY,JSON.stringify({...data,version:2}));},
 reset(){localStorage.removeItem(KEY);return structuredClone(DEFAULT_SAVE);},
};
