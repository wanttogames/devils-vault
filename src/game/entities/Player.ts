import Phaser from 'phaser';
import { registerPlayerSprites, PLAYER_TEXTURE, type Facing } from '../art/playerSprites';

export class PlayerVisual {
 readonly sprite: Phaser.GameObjects.Sprite;
 readonly shadow: Phaser.GameObjects.Ellipse;
 facing: Facing = 'down';
 private previous = {x: 0, y: 0};
 private distance = 0;
 private baseScale = 3;
 constructor(private scene: Phaser.Scene, readonly root: Phaser.GameObjects.Container, accent: number) {
  registerPlayerSprites(scene);
  this.shadow = scene.add.ellipse(0, 21, 36, 12, 0x000000, .55);
  const light = scene.add.ellipse(0, 20, 44, 14, accent, .13);
  this.sprite = scene.add.sprite(0, 0, PLAYER_TEXTURE, 0).setScale(this.baseScale);
  root.add([light, this.shadow, this.sprite]);
  this.play(false);
 }
 face(x: number, y: number): void {
  if (Math.hypot(x, y) < .06) return;
  // On diagonals preserve the established axis until the other axis is stronger.
  const horizontal = Math.abs(x) > Math.abs(y) + .12 ||
   (Math.abs(Math.abs(x) - Math.abs(y)) <= .12 && (this.facing === 'left' || this.facing === 'right'));
  this.facing = horizontal ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down');
 }
 private play(walking: boolean): void { this.sprite.play(`player-${walking ? 'walk' : 'idle'}-${this.facing}`, true); }
 update(dx: number, dy: number, distance: number, dt: number): void {
  // Newly pressed keyboard axis wins an exact diagonal, avoiding direction flicker.
  if (dx && !this.previous.x && dy && this.previous.y) this.facing = dx < 0 ? 'left' : 'right';
  if (dy && !this.previous.y && dx && this.previous.x) this.facing = dy < 0 ? 'up' : 'down';
  this.face(dx, dy); this.previous = {x: dx, y: dy};
  const walking = distance > .05;
  this.play(walking);
  this.sprite.anims.timeScale = walking ? Phaser.Math.Clamp(distance / Math.max(dt, 1) * 1000 / 210, .65, 1.4) : 1;
  // The sheet supplies body bobbing; the shadow stays planted on the floor.
  this.shadow.setScale(walking ? .94 : 1, 1);
  this.distance += distance;
  if (walking && this.distance >= 24) {
   this.distance %= 24;
   const dust = this.scene.add.rectangle(Math.round(this.root.x), Math.round(this.root.y + 24), 3, 3, 0xb39b7c, .3).setDepth(29);
   this.scene.tweens.add({targets: dust, x: dust.x - dx * 8, y: dust.y - dy * 6, alpha: 0, duration: 220, onComplete: () => dust.destroy()});
  }
 }
 interact(x: number, y: number): void {
  this.face(x, y); this.play(false);
  this.scene.tweens.add({targets: this.sprite, scaleX: this.baseScale * 1.05, scaleY: this.baseScale * .94,
   x: Math.sign(x) * 3, y: Math.sign(y) * 2, duration: 90, yoyo: true});
 }
}
