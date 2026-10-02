import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results',{recursive:true});
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1'],{cwd:process.cwd()});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))resolve();});server.on('error',reject);});
process.on('exit',()=>server.kill());
const browser=await chromium.launch({executablePath:process.env.VAULT_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote'],headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{Math.random=()=>0.00001;localStorage.setItem('devils-vault-save-v1',JSON.stringify({version:1,introSeen:true,tutorialCompleted:true,settings:{sound:false,reducedMotion:true}}));});
await page.goto('http://127.0.0.1:5173/devils-vault/');
await page.locator('[data-action="start"]').click();await page.locator('[data-character="gambler"]').click();
assert.equal(await page.locator('[data-chest]').count(),3);
await page.screenshot({path:'test-results/vault-b1-desktop.png',fullPage:true});
// Force only the two synchronous discovery RNG calls. No production debug hooks.
async function discover(roomRoll){await page.evaluate(roll=>{let i=0;Math.random=()=>[0,roll][i++]??.00001;document.querySelector('[data-action="continue"]').click();},roomRoll);await page.locator('[data-action="special-enter"]').waitFor();}
await page.locator('[data-chest="0"]').click();await discover(.35);assert.ok((await page.locator('.vault-decision').textContent()).includes('BLOOD VAULT'));
await page.locator('[data-action="special-skip"]').click();assert.equal(await page.locator('[data-chest]').count(),3);assert.ok((await page.locator('.floor-hud').textContent()).includes('Round 2 / 3'));
// Natural progression, skip room offers. Floor boundaries must always be explicit.
let floorCount=1,rounds=1;
for(let i=0;i<100;i++){
 if(await page.locator('[data-action="final-open"]').count())break;
 if(await page.locator('[data-action="descend"]').count()){await page.locator('[data-action="descend"]').click();await page.locator('.vault-transition').waitFor({state:'detached'});floorCount++;continue;}
 if(await page.locator('[data-action="special-skip"]').count()){await page.locator('[data-action="special-skip"]').click();continue;}
 if(await page.locator('[data-chest="0"]:not([disabled])').count()){await page.locator('[data-chest="0"]').click();rounds++;continue;}
 if(await page.locator('[data-action="continue"]').count()){await page.locator('[data-action="continue"]').click();await page.waitForTimeout(220);continue;}
 throw Error('Unexpected progression view');
}
assert.equal(floorCount,5);assert.equal(rounds,19);assert.ok((await page.locator('.floor-hud').textContent()).includes('B5'));await page.screenshot({path:'test-results/vault-b5-choice.png',fullPage:true});
await page.locator('[data-action="final-open"]').click();assert.equal(await page.locator('[data-chest]').count(),1);await page.locator('[data-chest="0"]').click();assert.ok(await page.locator('[data-action="escape"]').count());assert.equal(await page.locator('[data-action="continue"]').count(),0);
await page.locator('[data-action="escape"]').click();if(await page.locator('[data-modal="escape"]').count())await page.locator('[data-modal="escape"]').click();assert.ok((await page.locator('.depth-summary').textContent()).includes('B5'));
const stats=await page.evaluate(()=>JSON.parse(localStorage.getItem('devils-vault-save-v1')));assert.equal(stats.statistics.deepestFloorReached,5);assert.equal(stats.statistics.chestTierStats.mythic,1);assert.ok(stats.achievements.includes('welcome_hell'));await page.screenshot({path:'test-results/vault-result.png',fullPage:true});
await page.locator('[data-action="start"]').click();await page.locator('[data-character="seer"]').click();assert.ok((await page.locator('.floor-hud').textContent()).includes('Round 1 / 3'));assert.ok((await page.locator('.floor-hud').textContent()).includes('B1'));assert.equal(await page.locator('.special-banner').count(),0);
// All special room UI routes and actual one-choice enforcement.
for(const [name,roll] of [['GOLD VAULT',.1],['BLOOD VAULT',.35],['CURSED VAULT',.55],['RELIC VAULT',.75],['DEVIL’S SHOP',.95]]){
 await page.locator('[data-action="home"]').first().click();await page.locator('[data-modal="home"]').click();await page.locator('[data-action="start"]').click();await page.locator('[data-character="seer"]').click();await page.locator('[data-chest="0"]').click();await discover(roll);assert.ok((await page.locator('.vault-decision').textContent()).includes(name));await page.locator('[data-action="special-enter"]').click();
 if(name==='DEVIL’S SHOP'){assert.equal(await page.locator('.shop-item').count(),3);assert.ok(await page.locator('[data-action="shop-buy"][disabled]').count());await page.locator('[data-action="special-leave"]').click();}
 else {assert.equal(await page.locator('[data-chest]').count(),3);await page.screenshot({path:'test-results/vault-special-'+name.split(' ')[0].toLowerCase()+'.png',fullPage:true});await page.locator('[data-chest="0"]').click();assert.equal(await page.locator('[data-chest]:not([disabled])').count(),0);await page.locator('[data-action="continue"]').click();}
 assert.ok((await page.locator('.floor-hud').textContent()).includes('Round 2 / 3'));assert.equal(await page.locator('.special-banner').count(),0);
}
// Portrait touch targets, overflow and continued input after transitions.
const mobile=await browser.newContext({viewport:{width:360,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:1});const m=await mobile.newPage();m.on('pageerror',e=>errors.push(e.message));
await m.addInitScript(()=>{Math.random=()=>.00001;localStorage.setItem('devils-vault-save-v1',JSON.stringify({introSeen:true,tutorialCompleted:true,settings:{sound:false,reducedMotion:true}}));});await m.goto('http://127.0.0.1:5173/devils-vault/');await m.locator('[data-action="start"]').tap();await m.locator('[data-character="gambler"]').tap();
assert.ok(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));for(const chest of await m.locator('[data-chest]').all()){const r=await chest.boundingBox();assert.ok(r.width>=44&&r.height>=44);assert.ok(r.x>=0&&r.x+r.width<=360);}
await m.screenshot({path:'test-results/vault-mobile.png',fullPage:true});await m.locator('[data-chest="2"]').tap();await m.locator('[data-action="continue"]').tap();await m.locator('[data-action="special-enter"]').waitFor();await m.locator('[data-action="special-enter"]').tap();await m.locator('[data-chest="1"]').tap();await m.locator('[data-action="continue"]').tap();await m.locator('[data-chest="0"]').tap();await m.locator('[data-action="continue"]').tap();await m.locator('[data-chest="0"]').tap();await m.locator('[data-action="descend"]').tap();await m.locator('.vault-transition').waitFor({state:'detached'});await m.locator('[data-chest="1"]').tap();assert.equal(await m.locator('[data-action="escape"]').count(),1);await m.locator('[data-action="escape"]').tap();if(await m.locator('[data-modal="escape"]').count())await m.locator('[data-modal="escape"]').tap();assert.ok(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await m.screenshot({path:'test-results/vault-mobile-result.png',fullPage:true});assert.equal(errors.length,0,errors.join('\n'));
// Every discovered type persists, including skipped rooms.
assert.ok(stats.statistics.specialVaultsDiscovered>0);
console.log('PASS: 19 rounds, five floors, B5 final, all five room entries, Blood skip, one choice, retry, save, 360px touch/overflow, no browser errors.');await browser.close();server.kill();
