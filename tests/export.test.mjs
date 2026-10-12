import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {newState,addHabit,setEntry,validateImport} from '../src/domain.js';
import {progressWorkbook,readWorkbookBackup} from '../src/export.js';
test('Excel export has readable tracking and restores exact history',async()=>{
 const state=newState();const habit=addHabit(state,{title:'=A title, not a formula'},'2026-10-01');setEntry(state,habit.id,'2026-10-01','done');setEntry(state,habit.id,'2026-10-02','skipped');state.reflections['2026-10']='A quiet month.';
 const bytes=await progressWorkbook(state,'2026-10-02');assert.equal(bytes[0],80);assert.equal(bytes[1],75);
 const book=new ExcelJS.Workbook();await book.xlsx.load(bytes);const tracker=book.getWorksheet('Monthly Tracker');assert.equal(tracker.getCell('B6').value,'Done');assert.equal(tracker.getCell('C6').value,'Skipped');assert.equal(tracker.getCell('A6').value,habit.title);assert.equal(tracker.getCell('A6').type,ExcelJS.ValueType.String);
 assert.equal(book.creator,'Niwas Repalle & Sai Chand');assert.equal(book.getWorksheet('_WhiteHole').state,'veryHidden');assert.deepEqual(validateImport(await readWorkbookBackup(bytes)).entries,state.entries);
 const bad=new ExcelJS.Workbook();bad.addWorksheet('Other');await assert.rejects(readWorkbookBackup(await bad.xlsx.writeBuffer()),/does not contain/);
});
