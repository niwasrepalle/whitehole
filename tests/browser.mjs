import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
const errors=[];
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,acceptDownloads:true});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
const settle=()=>page.waitForTimeout(400);
const shot=async name=>{await settle();await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`screenshots/${name}.png`});};
await fs.mkdir('screenshots',{recursive:true});
try {
  await page.goto(process.env.APP_URL||'http://127.0.0.1:5173');await settle();
  await page.getByRole('button',{name:'Begin',exact:true}).click();
  await page.getByRole('button',{name:'Make these mine',exact:true}).click();await settle();
  assert.equal(await page.locator('.habit-card.front .goal-title').textContent(),'Read for 10 minutes');
  assert.equal(await page.locator('.progress-dots i').count(),5);
  await shot('01-check-in');
  // A real pointer swipe, followed by keyboard-accessible swipe and undo.
  const card=await page.locator('#swipe-card').boundingBox();
  await page.mouse.move(card.x+card.width*.5,card.y+card.height*.5);await page.mouse.down();await page.mouse.move(card.x+card.width*.5+140,card.y+card.height*.5,{steps:12});await page.mouse.up();await settle();
  assert.equal(await page.locator('.goal-title').textContent(),'Take a walk');
  await page.keyboard.press('ArrowLeft');await settle();assert.equal(await page.locator('.goal-title').textContent(),'Learn something');
  await page.getByRole('button',{name:'Undo last check-in'}).click();await settle();assert.equal(await page.locator('.goal-title').textContent(),'Take a walk');
  await page.keyboard.press('ArrowRight');await settle();
  await page.getByRole('button',{name:'My Tracker',exact:true}).click();await settle();
  assert.equal(await page.locator('.tracker-grid .habit-label').count(),5);
  await shot('02-tracker');
  const done=page.locator('.dot-button:enabled').filter({has:page.locator('.dot.done')}).first();
  await done.click();await page.getByRole('button',{name:'Excused',exact:true}).click();await settle();
  assert.equal(await page.locator('.tracker-grid .dot.excused').count(),1);
  await page.getByRole('tab',{name:'Monthly'}).click();await page.getByRole('textbox',{name:'Monthly reflection'}).fill('A quiet first week.');await page.getByRole('textbox',{name:'Monthly reflection'}).blur();await settle();
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'My Habits',exact:true}).click();await settle();
  await shot('03-my-habits');
  await page.getByRole('button',{name:'Add habit',exact:true}).click();await page.getByRole('textbox',{name:'Goal',exact:true}).fill('Practice guitar');await page.getByRole('combobox',{name:'Repeat'}).selectOption('weekly');await page.getByRole('spinbutton',{name:'Times per week'}).fill('2');await page.locator('#habit-form .primary').click();await settle();
  assert.ok((await page.locator('.habit-row').allTextContents()).some(t=>t.includes('Practice guitar')&&t.includes('2 / week')));
  await page.locator('.habit-edit').filter({hasText:'Practice guitar'}).click();await page.getByRole('button',{name:'Change automatic icon'}).click();await page.getByRole('button',{name:'music',exact:true}).click();await page.getByRole('button',{name:'Save changes',exact:true}).click();await settle();
  await page.locator('.habit-edit').filter({hasText:'Practice guitar'}).click();await page.getByRole('button',{name:'Pause habit'}).click();await settle();assert.ok(await page.locator('.habit-row.paused').count());
  await page.locator('.habit-edit').filter({hasText:'Practice guitar'}).click();await page.getByRole('button',{name:'Resume habit'}).click();await settle();
  await page.getByRole('button',{name:'Reorder habits'}).click();const up=page.getByRole('button',{name:'Move habit up'}).last();await up.click();await settle();await page.getByRole('button',{name:'Finish reordering'}).click();
  await page.locator('.habit-edit').filter({hasText:'Practice guitar'}).click();await page.getByRole('button',{name:'Archive habit'}).click();await page.getByRole('button',{name:'Archive habit',exact:true}).click();await settle();assert.equal(await page.locator('.habit-row').count(),5);
  await page.getByRole('button',{name:'Settings',exact:true}).click();await shot('04-settings');
  await page.getByRole('button',{name:'Appearance Dark'}).click();await page.getByRole('button',{name:'Light',exact:true}).click();await settle();assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('light')),true);assert.equal(await page.locator('h1').evaluate(el=>getComputedStyle(el).color),'rgb(0, 0, 0)');await shot('07-light-theme');
  await page.getByRole('button',{name:'Appearance Light'}).click();await page.getByRole('button',{name:'Soft black',exact:true}).click();
  await page.getByRole('switch',{name:'Reduce motion'}).click();await settle();
  await page.getByRole('button',{name:'Home widget'}).click();await shot('06-widget');await page.getByRole('button',{name:'Open WhiteHole check-in'}).click();assert.ok(await page.locator('#swipe-card').count());
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Export progress'}).click();const download=await downloading;const backupPath=await download.path();assert.ok(download.suggestedFilename().endsWith('.xlsx'));const {readWorkbookBackup}=await import('../src/export.js');const backup=await readWorkbookBackup(await fs.readFile(backupPath));assert.equal(backup.habits.length,6);assert.equal(backup.reflections[Object.keys(backup.reflections)[0]],'A quiet first week.');
  await page.getByRole('button',{name:'Restore backup'}).click();await page.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schema":999}')});await settle();assert.ok((await page.locator('#toast').textContent()).includes('not a WhiteHole backup'));
  await page.reload();await settle();await page.getByRole('button',{name:'Settings',exact:true}).click();assert.ok((await page.locator('.settings-row').allTextContents()).some(t=>t.includes('Reduce motion')));
  await page.getByRole('button',{name:'Check-in',exact:true}).click();
  for(let i=0;i<10&&await page.locator('#swipe-card').count();i++){await page.keyboard.press('ArrowRight');await settle();}
  assert.ok((await page.locator('h1').textContent()).includes('Good night'));await shot('05-good-night');
  for(const size of [{width:320,height:568},{width:430,height:932},{width:1280,height:900}]){
    await page.setViewportSize(size);await page.getByRole('button',{name:'My Tracker',exact:true}).click();await settle();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('.nav').isVisible(),true);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: onboarding, touch swipe, keyboard swipe, undo, tracker history, reflection, automatic icon, edit, pause/resume, reorder, archive, appearance, persistence, backup/export, malformed import, good-night flow, three responsive sizes; no browser errors.');
}finally{await browser.close();}
