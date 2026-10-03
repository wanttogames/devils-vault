import Phaser from 'phaser';

export type Facing = 'down' | 'up' | 'left' | 'right';
export const DIRECTIONS: Facing[] = ['down', 'up', 'left', 'right'];
export const PLAYER_TEXTURE = 'contractor-base';
export const FRAME_SIZE = 24;
// Six frames per direction: two breathing idles, four alternating steps.
// Palette is deliberately separate so future skins can replace colors or the sheet.
export const contractorPalette = {
 outline: '#100e16', coat: '#302531', light: '#68535e', hood: '#453440',
 rim: '#b39872', scarf: '#a63240', scarflight: '#e16457', skin: '#bc9070',
 gold: '#e8bb63', boots: '#211c26', eye: '#ffe3a0'
};

export function registerPlayerSprites(scene: Phaser.Scene): void {
 if (!scene.textures.exists(PLAYER_TEXTURE)) {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_SIZE * 6; canvas.height = FRAME_SIZE * 4;
  const ctx = canvas.getContext('2d')!;
  const p = contractorPalette;
  DIRECTIONS.forEach((direction, row) => {
   for (let frame = 0; frame < 6; frame++) {
    const walking = frame >= 2, phase = walking ? frame - 2 : 0;
    const step = walking ? [0, 1, 0, -1][phase]! : 0;
    const bob = walking && phase % 2 === 1 ? -1 : 0;
    const ox = frame * 24, oy = row * 24;
    const rect = (x: number, y: number, w: number, h: number, color: string) => {
     ctx.fillStyle = color; ctx.fillRect(ox + x, oy + y, w, h);
    };
    // Feet move independently of the coat; contact frames differ from passing frames.
    rect(8, 19 + step, 3, 3, p.outline); rect(13, 19 - step, 3, 3, p.outline);
    rect(8, 20 + step, 3, 1, p.rim); rect(13, 20 - step, 3, 1, p.light);
    rect(6, 10 + bob, 12, 10, p.outline); rect(7, 10 + bob, 10, 9, p.coat);
    rect(5 - step, 13 + bob, 2, 4, p.outline); rect(17 + step, 13 + bob, 2, 4, p.outline);
    rect(6 - step, 15 + bob, 1, 2, p.skin); rect(17 + step, 15 + bob, 1, 2, p.skin);
    rect(7, 12 + bob, 2, 6, p.light); rect(15, 12 + bob, 1, 7, p.hood);
    rect(8, 18 + bob, 8, 1, p.rim); rect(9, 15 + bob, 7, 1, p.boots);
    rect(14, 15 + bob, 2, 3, p.gold); rect(15, 18 + bob, 2, 1, p.gold);
    // Angular hood with a warm rim keeps the silhouette readable on dark stone.
    rect(8, 2 + bob, 8, 1, p.outline); rect(6, 3 + bob, 12, 7, p.outline);
    rect(7, 4 + bob, 10, 5, p.hood); rect(8, 3 + bob, 8, 1, p.rim);
    rect(7, 4 + bob, 1, 4, p.light); rect(8, 9 + bob, 8, 2, p.outline);
    if (direction === 'up') {
     rect(9, 5 + bob, 6, 4, p.coat); rect(11, 5 + bob, 1, 4, p.light);
     rect(8, 11 + bob, 8, 2, p.scarf); rect(13 + step, 13 + bob, 2, 5, p.scarf);
    } else if (direction === 'down') {
     rect(9, 6 + bob, 6, 3, p.outline); rect(10, 8 + bob, 4, 2, p.skin);
     rect(9, 7 + bob, 1, 1, p.eye); rect(14, 7 + bob, 1, 1, p.eye);
     rect(8, 10 + bob, 8, 2, p.scarf); rect(9, 10 + bob, 5, 1, p.scarflight);
     rect(14 + step, 12 + bob, 2, 4, p.scarf);
    } else {
     const left = direction === 'left', face = left ? 7 : 13;
     rect(face, 6 + bob, 4, 4, p.outline); rect(face, 8 + bob, 3, 2, p.skin);
     rect(left ? 7 : 16, 7 + bob, 1, 1, p.eye);
     rect(8, 10 + bob, 8, 2, p.scarf); rect(left ? 14 + step : 8 - step, 12 + bob, 2, 5, p.scarf);
     rect(left ? 14 : 8, 13 + bob, 2, 5, p.light);
    }
    if (!walking && frame === 1) rect(8, 11, 7, 1, p.scarflight);
   }
  });
  const texture = scene.textures.addCanvas(PLAYER_TEXTURE, canvas)!;
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++)
   texture.add(row * 6 + col, 0, col * 24, row * 24, 24, 24);
 }
 DIRECTIONS.forEach((direction, row) => {
  for (const state of ['idle', 'walk'] as const) {
   const key = `player-${state}-${direction}`;
   if (!scene.anims.exists(key)) scene.anims.create({key,
    frames: scene.anims.generateFrameNumbers(PLAYER_TEXTURE, {start: row * 6 + (state === 'walk' ? 2 : 0), end: row * 6 + (state === 'walk' ? 5 : 1)}),
    frameRate: state === 'walk' ? 9 : 2, repeat: -1});
  }
 });
}
