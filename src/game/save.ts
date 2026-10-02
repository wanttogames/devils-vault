import { DEFAULT_SAVE, type SaveData } from './balance';
const KEY='devils-vault-save-v1';
export const SaveManager={
  load():SaveData { try { const raw=localStorage.getItem(KEY); if(!raw)return structuredClone(DEFAULT_SAVE); const saved=JSON.parse(raw) as Partial<SaveData>; return {...structuredClone(DEFAULT_SAVE),...saved,version:1,statistics:{...DEFAULT_SAVE.statistics,...saved.statistics},settings:{...DEFAULT_SAVE.settings,...saved.settings},upgrades:saved.upgrades??{},unlockedCharacters:saved.unlockedCharacters??['gambler','seer','collector','immortal'],achievements:saved.achievements??[]}; } catch { return structuredClone(DEFAULT_SAVE); } },
  save(data:SaveData) { localStorage.setItem(KEY,JSON.stringify({...data,version:1})); },
  reset() { localStorage.removeItem(KEY); return structuredClone(DEFAULT_SAVE); },
};
