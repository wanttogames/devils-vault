import type { Chest, ChestResult } from '../balance';

export type ClueSignal = 'fortune' | 'mystic' | 'danger';

const cues: Record<ClueSignal, readonly string[]> = {
 fortune: [
  '얇은 금속음이 세 번 울린다',
  '뚜껑 틈으로 따뜻한 금빛이 샌다',
  '안쪽에서 동전 굴러가는 소리가 난다',
  '금색 문양이 천천히 깜박인다'
 ],
 mystic: [
  '열쇠 구멍에서 낮은 속삭임이 샌다',
  '상자 주변에 보랏빛 안개가 맴돈다',
  '봉인 문양이 맥박처럼 뛰고 있다',
  '차가운 바람과 낯선 향이 느껴진다'
 ],
 danger: [
  '쇠사슬이 저절로 팽팽해진다',
  '주변 촛불이 한순간 낮아진다',
  '뚜껑 안쪽에서 둔탁한 두드림이 난다',
  '상자 가까이서 차가운 숨이 스친다'
 ]
};

export function signalForResult(result: ChestResult): ClueSignal {
 if (result.type === 'ruin') return 'danger';
 if (result.type === 'curse' || result.type === 'relic') return 'mystic';
 return 'fortune';
}

export function clueForResult(result: ChestResult, random: () => number, accuracy = .7): { signal: ClueSignal; text: string } {
 const actual = signalForResult(result);
 let signal = actual;
 if (random() >= accuracy) {
  const alternatives = (Object.keys(cues) as ClueSignal[]).filter(value => value !== actual);
  signal = alternatives[Math.floor(random() * alternatives.length)]!;
 }
 const lines = cues[signal];
 return {signal, text: lines[Math.floor(random() * lines.length)]!};
}

export function clueAccuracy(character: string, insightLevel: number): number {
 return Math.min(.96, .7 + (character === 'seer' ? .14 : 0) + Math.max(0, Math.min(3, insightLevel)) * .08);
}

export function addChestClues(chests: Chest[], random: () => number, accuracy: number): void {
 for (const chest of chests) {
  const clue = clueForResult(chest.result, random, accuracy);
  chest.clue = clue.text;
  chest.clueSignal = clue.signal;
 }
}
