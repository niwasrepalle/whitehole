import ExcelJS from 'exceljs';
import {dayKey,monthDays,habitVersion,eligible,habitProgress} from './domain.js';
const mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export {mime as excelMime};
export async function progressWorkbook(state,key=dayKey(new Date(),state.settings.cutoff)) {
  const book=new ExcelJS.Workbook();book.creator='Niwas Repalle & Sai Chand';book.created=new Date();
  const month=key.slice(0,7),days=monthDays(month),sheet=book.addWorksheet('Monthly Tracker');
  sheet.addRow(['WhiteHole',month]);sheet.addRow(['Exported',key]);
  sheet.addRow(['Done = completed · Skipped = reviewed · Excused = neutral · — = not scheduled']);sheet.addRow([]);
  sheet.addRow(['Habit',...days.map(d=>Number(d.slice(-2))),'Completed','Target','Progress']);
  for(const h of state.habits.filter(h=>h.createdDay<=days.at(-1)&&(!h.deletedDay||h.deletedDay>days[0]))) {
    const p=habitProgress(state,h,days,key);
    sheet.addRow([h.title,...days.map(d=>d>key?'':!eligible(h,d)?'—':({done:'Done',skipped:'Skipped',excused:'Excused'}[state.entries[h.id]?.[d]?.status]||'')),p.done,p.total,p.rate]);
  }
  sheet.getColumn(1).width=30;for(let c=2;c<=days.length+1;c++)sheet.getColumn(c).width=11;
  for(let c=days.length+2;c<=days.length+4;c++)sheet.getColumn(c).width=13;
  sheet.getColumn(days.length+4).numFmt='0%';sheet.views=[{state:'frozen',xSplit:1,ySplit:5}];sheet.autoFilter={from:{row:5,column:1},to:{row:Math.max(5,sheet.rowCount),column:days.length+4}};
  sheet.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0};
  const history=book.addWorksheet('Check-in History');history.addRow(['Date','Habit','Status','Frequency','Target']);
  const rows=[];for(const h of state.habits)for(const [date,e] of Object.entries(state.entries[h.id]||{})){const v=habitVersion(h,date);rows.push([date,v.title,e.status,v.frequency,v.target]);}
  rows.sort((a,b)=>a[0].localeCompare(b[0])||a[1].localeCompare(b[1]));rows.forEach(row=>history.addRow(row));
  const habits=book.addWorksheet('Habits');habits.addRow(['Habit','Frequency','Target','Scheduled days','Created','Status']);
  for(const h of state.habits)habits.addRow([h.title,h.frequency,h.target,h.days.map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', '),h.createdDay,h.deletedDay?'Archived':h.paused?'Paused':'Active']);
  const reflection=book.addWorksheet('Reflections');reflection.addRow(['Month','Reflection']);Object.entries(state.reflections).sort().forEach(r=>reflection.addRow(r));
  // Hidden metadata preserves an exact restore without exposing a separate JSON file.
  const backup=book.addWorksheet('_WhiteHole',{state:'veryHidden'});backup.addRow(['whitehole-backup-v1']);const text=JSON.stringify(state);for(let i=0;i<text.length;i+=30000)backup.addRow([text.slice(i,i+30000)]);
  for(const ws of [sheet,history,habits,reflection]){
    if(ws!==sheet){ws.views=[{state:'frozen',ySplit:1}];ws.columns.forEach((c,i)=>c.width=i===1?36:18);ws.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,ws.rowCount),column:ws.columnCount}};}
    const head=ws.getRow(ws===sheet?5:1);head.font={name:'Arial',bold:true,color:{argb:'FFFFFFFF'}};head.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF252525'}};head.height=25;
    ws.eachRow((row,n)=>{row.alignment={vertical:'middle',wrapText:true};if(n!==(ws===sheet?5:1)){row.font={name:'Arial',size:11,color:{argb:'FF000000'}};if(n%2===0)row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF1F1F1'}};}});
  }
  return new Uint8Array(await book.xlsx.writeBuffer());
}
export async function readWorkbookBackup(bytes){const book=new ExcelJS.Workbook();await book.xlsx.load(bytes);const sheet=book.getWorksheet('_WhiteHole');if(!sheet||sheet.getCell('A1').value!=='whitehole-backup-v1')throw new Error('This Excel file does not contain a WhiteHole backup.');let text='';for(let i=2;i<=sheet.rowCount;i++)text+=sheet.getCell(i,1).value||'';return JSON.parse(text);}
