import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5175']);
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))resolve()});server.on('error',reject)});
let browser;
try {
 browser=await chromium.launch({executablePath:process.env.VAULT_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const mobile of [false,true]) {
  const context=await browser.newContext({viewport:mobile?{width:360,height:800}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack)});page.on('console',m=>{if(m.type()==='error')console.error(m.text())});
  await page.addInitScript(()=>localStorage.setItem('devils-vault-save-v1',JSON.stringify({introSeen:true,tutorialCompleted:true,settings:{sound:false}})));
  await page.goto('http://127.0.0.1:5175/devils-vault/');await page.locator('[data-action="start"]').click();await page.locator('[data-character="gambler"]').click();await page.locator('.vault-world-layer canvas').waitFor();
  await page.evaluate(async()=>{const module=await import('/devils-vault/src/playable.ts');window.playerModule=module;});
  await page.waitForFunction(()=>window.playerModule.activeVaultScene?.visual?.sprite.anims.currentAnim);
  const state=()=>page.evaluate(()=>{const s=window.playerModule.activeVaultScene;return {x:s.player.x,y:s.player.y,key:s.visual.sprite.anims.currentAnim.key,facing:s.visual.facing}});
  for(const [key,direction] of [['ArrowUp','up'],['ArrowLeft','left'],['ArrowDown','down'],['ArrowRight','right']]) {
   await page.keyboard.down(key);await page.waitForTimeout(150);assert.equal((await state()).key,`player-walk-${direction}`);await page.keyboard.up(key);await page.waitForTimeout(80);assert.equal((await state()).key,`player-idle-${direction}`);
  }
  await page.keyboard.down('ArrowUp');await page.keyboard.down('ArrowRight');await page.waitForTimeout(80);assert.equal((await state()).facing,'right');await page.keyboard.up('ArrowUp');await page.keyboard.up('ArrowRight');
  // Position within interaction range, then use production E / mobile input.
  await page.evaluate(()=>{const s=window.playerModule.activeVaultScene;s.player.setPosition(s.targets[1].x,s.targets[1].y+50);s.scan()});
  if(mobile) {
   const stick=page.locator('.vault-stick');await stick.scrollIntoViewIfNeeded();const r=await stick.boundingBox();
   const touch=await context.newCDPSession(page);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2-30}]});await page.waitForTimeout(100);assert.equal((await state()).key,'player-walk-up');await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(50);assert.equal((await state()).key,'player-idle-up');
   await page.locator('.vault-interact').tap();
  }else await page.keyboard.press('e',{delay:40});
  if(!mobile){await page.waitForTimeout(40);assert.equal(await page.evaluate(()=>window.playerModule.activeVaultScene.interacting),true);assert.equal((await state()).facing,'up');} 
  await page.waitForTimeout(350);assert.equal(await page.locator('[data-chest]:not([disabled])').count(),0);
  await page.waitForFunction(()=>window.playerModule.activeVaultScene?.visual);assert.equal((await state()).facing,'up');
  const frames=await page.evaluate(()=>{const s=window.playerModule.activeVaultScene;return ['down','up','left','right'].map(d=>[s.anims.get(`player-idle-${d}`).frames.length,s.anims.get(`player-walk-${d}`).frames.length])});assert.deepEqual(frames,[[2,4],[2,4],[2,4],[2,4]]);
  await mkdir('test-results',{recursive:true});await page.locator('.vault-world-layer canvas').screenshot({path:`test-results/player-${mobile?'mobile':'desktop'}.png`});assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS: four directions, walk/idle, last facing, diagonal, E and touch joystick/button, 24 animation frames, no browser errors.');
} finally {await browser?.close();server.kill()}
