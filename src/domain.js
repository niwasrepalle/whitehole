/** Pure tracking rules. Dates are local calendar keys, never UTC slices. */
export const SCHEMA = 1;
export const statuses = ['done', 'skipped', 'excused'];
export function dayKey(date = new Date(), cutoff = 0) {
  const d = new Date(date);
  if (d.getHours() < cutoff) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function parseDay(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error('Invalid day');
  const [y,m,d] = key.split('-').map(Number);
  const date = new Date(y,m-1,d,12);
  if (dayKey(date) !== key) throw new Error('Invalid day');
  return date;
}
export function shiftDay(key, n) { const d=parseDay(key); d.setDate(d.getDate()+n); return dayKey(d); }
export function monthDays(month) {
  const d=parseDay(`${month}-01`); const n=new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  return Array.from({length:n}, (_,i)=>`${month}-${String(i+1).padStart(2,'0')}`);
}
export function weekStart(key) { const d=parseDay(key); return shiftDay(key, -(d.getDay()+6)%7); }
export function monthStart(key) { return key.slice(0,7)+'-01'; }
export function periodKey(habit, key) {
  return habit.frequency==='weekly'?weekStart(key):habit.frequency==='monthly'?monthStart(key):key;
}
export function habitVersion(habit, key) {
  const versions = habit.versions || [{from:habit.createdDay,title:habit.title,frequency:habit.frequency,days:habit.days,target:habit.target,paused:habit.paused,icon:habit.icon}];
  let v=versions[0];
  for (const version of versions) if(version.from<=key) v=version;
  return {...habit,...v};
}
export function eligible(habit,key) {
  if (key < habit.createdDay || (habit.deletedDay && key>=habit.deletedDay)) return false;
  const v=habitVersion(habit,key);
  if(v.paused) return false;
  return v.frequency!=='daily' || v.days.includes(parseDay(key).getDay());
}
export function entryFor(state, habitId, key) { return state.entries[habitId]?.[key] || null; }
export function todayHabits(state,key) { return state.habits.filter(h=>eligible(h,key)).sort((a,b)=>a.order-b.order); }
export function periodCounts(state,habit,key,through=key) {
  const v=habitVersion(habit,key), start=periodKey(v,key);
  let end=v.frequency==='weekly'?shiftDay(start,6):v.frequency==='monthly'?monthDays(start.slice(0,7)).at(-1):start;
  if(end>through) end=through;
  let done=0,skipped=0,excused=0;
  for(const [date,e] of Object.entries(state.entries[habit.id]||{})) if(date>=start&&date<=end&&eligible(habit,date)) {
    if(e.status==='done') done++; else if(e.status==='skipped') skipped++; else if(e.status==='excused') excused++;
  }
  return {done,skipped,excused,target:v.frequency==='daily'?1:v.target,start,end};
}
export function pendingHabits(state,key) {
  return todayHabits(state,key).filter(h=>!entryFor(state,h.id,key)&&periodCounts(state,h,key).done<periodCounts(state,h,key).target);
}
export function dayStats(state,key) {
  let done=0,skipped=0,excused=0,pending=0;
  const habits=todayHabits(state,key);
  for(const h of habits) {
    const e=entryFor(state,h.id,key), c=periodCounts(state,h,key);
    if(e?.status==='done') done++;
    else if(e?.status==='skipped') skipped++;
    else if(e?.status==='excused') excused++;
    else if(c.done<c.target) pending++;
  }
  const scheduled=done+skipped+excused+pending;
  return {done,skipped,excused,pending,scheduled,reviewed:done+skipped+excused,rate:scheduled-excused>0?done/(scheduled-excused):null};
}
export function checkinComplete(state,key) { const s=dayStats(state,key); return s.scheduled>0&&s.pending===0; }
/** Check-in streak counts reviewed scheduled days, including honestly skipped days. */
export function checkinStreak(state,key) {
  const first=state.habits.reduce((a,h)=>h.createdDay<a?h.createdDay:a,key);
  let cursor=checkinComplete(state,key)?key:shiftDay(key,-1), count=0;
  while(cursor>=first) {
    const s=dayStats(state,cursor);
    if(s.scheduled>0) { if(!checkinComplete(state,cursor)) break; count++; }
    cursor=shiftDay(cursor,-1);
  }
  return count;
}
export function habitStreak(state,habit,key) {
  const v=habitVersion(habit,key);
  if(v.frequency!=='daily') {
    let cursor=periodKey(v,key), count=0;
    if(periodCounts(state,habit,key).done<v.target) cursor=v.frequency==='weekly'?shiftDay(cursor,-7):monthStart(shiftDay(cursor,-1));
    while(cursor>=periodKey(v,habit.createdDay)) {
      const end=v.frequency==='weekly'?shiftDay(cursor,6):monthDays(cursor.slice(0,7)).at(-1);
      if(periodCounts(state,habit,cursor,end).done<habitVersion(habit,cursor).target) break;
      count++; cursor=v.frequency==='weekly'?shiftDay(cursor,-7):monthStart(shiftDay(cursor,-1));
    }
    return count;
  }
  let cursor=key, count=0, allowPendingToday=true;
  while(cursor>=habit.createdDay) {
    if(eligible(habit,cursor)) {
      const e=entryFor(state,habit.id,cursor);
      if(e?.status==='done') count++;
      else if(e?.status==='excused') {} else if(cursor===key&&allowPendingToday&&!e) {} else break;
    }
    cursor=shiftDay(cursor,-1); allowPendingToday=false;
  }
  return count;
}
export function setEntry(state,id,key,status) {
  if(!statuses.includes(status)) throw new Error('Invalid status');
  const h=state.habits.find(h=>h.id===id); if(!h||!eligible(h,key)) throw new Error('Habit is not scheduled');
  state.entries[id] ||= {}; state.entries[id][key]={status,at:new Date().toISOString()};
}
export function clearEntry(state,id,key) { if(state.entries[id]) delete state.entries[id][key]; }
export function newState() {
  return {schema:SCHEMA,habits:[],entries:{},reflections:{},profile:{name:''},settings:{reminder:false,reminderTime:'22:00',cutoff:0,theme:'dark',haptics:true,reducedMotion:false},onboarded:false};
}
export function addHabit(state,input,key) {
  const title=String(input.title||'').trim(); if(!title||title.length>100) throw new Error('Use a goal name between 1 and 100 characters.');
  const frequency=['daily','weekly','monthly'].includes(input.frequency)?input.frequency:'daily';
  const days=[...new Set((input.days||[0,1,2,3,4,5,6]).filter(n=>Number.isInteger(n)&&n>=0&&n<=6))];
  if(frequency==='daily'&&!days.length) throw new Error('Choose at least one day.');
  const target=frequency==='daily'?1:Number(input.target||1);
  if(!Number.isInteger(target)||target<1||target>(frequency==='weekly'?7:31)) throw new Error('Choose a valid target.');
  const id=globalThis.crypto?.randomUUID?.()||`h-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const h={id,title,frequency,days,target,icon:input.icon||'spark',customPaths:input.customPaths||null,paused:false,order:state.habits.length,createdDay:key,deletedDay:null};
  h.versions=[{from:key,title,frequency,days,target,icon:h.icon,customPaths:h.customPaths,paused:false}];
  state.habits.push(h); return h;
}
export function editHabit(state,id,input,key) {
  const h=state.habits.find(h=>h.id===id); if(!h) throw new Error('Habit not found');
  // Validate in isolation before applying, preserving stable ID and all history.
  const temp=newState(), candidate=addHabit(temp,{...h,...input},key);
  const version={from:key,title:candidate.title,frequency:candidate.frequency,days:candidate.days,target:candidate.target,icon:candidate.icon,customPaths:candidate.customPaths,paused:input.paused??h.paused};
  h.versions=h.versions.filter(v=>v.from!==key); h.versions.push(version); h.versions.sort((a,b)=>a.from.localeCompare(b.from));
  Object.assign(h,version); return h;
}
export function habitProgress(state,habit,days,today) {
  let done=0,total=0,excused=0;
  const periods=new Map();
  for(const key of days) {
    if(key>today||!eligible(habit,key)) continue;
    const v=habitVersion(habit,key), e=entryFor(state,habit.id,key);
    if(v.frequency==='daily') {total++; if(e?.status==='done')done++; if(e?.status==='excused')excused++;}
    else {
      const p=periodKey(v,key), previous=periods.get(p)||{target:v.target,done:0};
      if(e?.status==='done') previous.done++;
      periods.set(p,previous);
    }
  }
  for(const p of periods.values()){total+=p.target;done+=Math.min(p.done,p.target);}
  return {done,total:Math.max(0,total-excused),rate:total-excused>0?done/(total-excused):null};
}
export function validateImport(raw) {
  if(!raw||raw.schema!==SCHEMA||!Array.isArray(raw.habits)||typeof raw.entries!=='object'||!raw.entries||Array.isArray(raw.entries)) throw new Error('This is not a WhiteHole backup.');
  if(raw.habits.length>500) throw new Error('Backup is too large.');
  const clean=newState(), ids=new Set();
  for(const h of raw.habits) {
    if(typeof h.id!=='string'||h.id.length>100||ids.has(h.id)||['__proto__','constructor','prototype'].includes(h.id)) throw new Error('Invalid habit ID');
    ids.add(h.id); parseDay(h.createdDay); if(h.deletedDay)parseDay(h.deletedDay);
    const c=addHabit(clean,h,h.createdDay); c.id=h.id;c.order=Number.isFinite(h.order)?h.order:clean.habits.length;c.paused=!!h.paused;c.deletedDay=h.deletedDay||null;
    if(Array.isArray(h.versions)&&h.versions.length) {
      c.versions=[];
      for(const v of h.versions) {parseDay(v.from);const t=newState(),vc=addHabit(t,v,v.from); c.versions.push({...vc.versions[0],paused:!!v.paused});}
      c.versions.sort((a,b)=>a.from.localeCompare(b.from));
    }
    const entries=raw.entries[h.id]||{}; clean.entries[h.id]={};
    for(const [date,e] of Object.entries(entries)) {parseDay(date);if(!statuses.includes(e?.status))throw new Error('Invalid entry'); clean.entries[h.id][date]={status:e.status,at:typeof e.at==='string'?e.at:''};}
  }
  const s=raw.settings||{};
  clean.settings={...clean.settings,reminder:!!s.reminder,reminderTime:/^([01]\d|2[0-3]):[0-5]\d$/.test(s.reminderTime)?s.reminderTime:'22:00',cutoff:[0,2,4].includes(s.cutoff)?s.cutoff:0,theme:['dark','light','system'].includes(s.theme)?s.theme:'dark',haptics:s.haptics!==false,reducedMotion:!!s.reducedMotion};
  clean.profile.name=String(raw.profile?.name||'').slice(0,60);clean.onboarded=true;
  for(const [month,text] of Object.entries(raw.reflections||{})) if(/^\d{4}-\d{2}$/.test(month)&&typeof text==='string')clean.reflections[month]=text.slice(0,5000);
  return clean;
}
