import './styles.css';
import {newState,dayKey,parseDay,shiftDay,monthDays,weekStart,habitVersion,eligible,entryFor,todayHabits,pendingHabits,dayStats,checkinStreak,habitStreak,addHabit,editHabit,setEntry,clearEntry,habitProgress,validateImport} from './domain.js';
import {icon,inferIcon,resolveIcon,goalIcons} from './icons.js';
import {native,platform,loadState,saveState,tapHaptic,syncReminders,enableReminders,syncWidget,requestWidget,exportFile,nativeListeners} from './platform.js';
const root=document.querySelector('#app');
let state, route='checkin', modal=null, undoStack=[], busy=false, drag=null, month, week, mode='daily', detailId=null, reorder=false, setupStage=0;
let selectedStarter=new Set(['Read for 10 minutes','Take a walk','Learn something','Write a journal','Stretch']);
const today=()=>dayKey(new Date(),state?.settings.cutoff||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const weekdays=['S','M','T','W','T','F','S'];
const shortDays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const iconBtn=(name,action,label,extra='')=>`<button class="icon-button" data-action="${action}" aria-label="${esc(label)}" title="${esc(label)}" ${extra}>${icon(name,22)}</button>`;
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),3500);}
function applyTheme(){const systemLight=matchMedia('(prefers-color-scheme: light)').matches;const light=state.settings.theme==='light'||(state.settings.theme==='system'&&systemLight);document.documentElement.classList.toggle('light',light);document.documentElement.classList.toggle('reduce-motion',state.settings.reducedMotion);document.querySelector('meta[name=theme-color]').content=light?'#f1f1ee':'#151515';}
async function commit(change,{renderPage=true,schedule=true}={}){
  const before=JSON.stringify(state);
  try{change();await saveState(state);if(renderPage)render();if(schedule)syncReminders(state).catch(e=>toast(e.message));syncWidget(state).catch(()=>{});return true;}
  catch(e){state=JSON.parse(before);render();toast(e.message||'Could not save. Your previous data is safe.');return false;}
}
function go(next){modal=null;route=next;detailId=null;render();}
function nav(){return `<nav class="nav" aria-label="Main navigation">${['checkin','tracker','settings'].map((r,i)=>`<button data-action="nav" data-route="${r}" class="${route===r?'active':''}" aria-label="${['Check-in','My Tracker','Settings'][i]}" ${route===r?'aria-current="page"':''}>${icon(['check','chart','settings'][i],25)}</button>`).join('')}</nav>`;}
function dots(habits,key){return `<div class="progress-dots" aria-label="${dayStats(state,key).reviewed} of ${habits.length} habits reviewed">${habits.slice(0,16).map(h=>{const s=entryFor(state,h.id,key)?.status;return `<i class="${s==='done'?'done':s?'reviewed':''}"></i>`;}).join('')}</div>`;}
function checkin(){
  const key=today(), habits=todayHabits(state,key), pending=pendingHabits(state,key), h=pending[0];
  const activeCount=state.habits.filter(x=>!x.deletedDay&&!x.paused).length;
  let body;
  if(!activeCount)body=`<div class="empty-state">${icon('spark',42)}<h2>Make room for a habit.</h2><button class="primary" data-action="add">Add a habit</button></div>`;
  else if(!habits.length)body=`<div class="goodnight">${icon('moon',48)}<h1>A quiet day.</h1><button class="text-link" data-action="nav" data-route="tracker">View tracker</button></div>`;
  else if(!h)body=`<div class="goodnight">${icon('moon',53)}<h1>Good night${state.profile.name?', '+esc(state.profile.name):''}.</h1><button class="text-link" data-action="nav" data-route="tracker">View tracker</button></div>`;
  else {const v=habitVersion(h,key);body=`<div class="deck-area"><div class="card-stack">${pending.length>2?'<div class="habit-card back-two" aria-hidden="true"></div>':''}${pending.length>1?'<div class="habit-card back-one" aria-hidden="true"></div>':''}<div class="habit-card front enter" id="swipe-card" tabindex="0" role="group" aria-roledescription="Swipe card" aria-label="${esc(v.title)}" aria-describedby="gesture-help" data-id="${h.id}"><span class="swipe-mark right">${icon('check',30)}</span><span class="swipe-mark left">${icon('close',30)}</span><div class="goal-icon">${icon(v.icon,52,v.customPaths)}</div><div class="goal-title">${esc(v.title)}</div><span class="sr-only" id="gesture-help">Swipe right or press the right arrow to mark done. Swipe left or press the left arrow to skip.</span><button class="sr-only" data-action="accessible-done">Mark done</button><button class="sr-only" data-action="accessible-skip">Skip</button></div></div></div>`;}
  return `<main class="page checkin-page"><header class="page-head"><span class="wordmark">WhiteHole</span>${dots(habits,key)}</header>${body}<div class="checkin-footer">${undoStack.at(-1)?.key===key?`<button class="undo-button" data-action="undo" aria-label="Undo last check-in" title="Undo">${icon('undo',20)}</button>`:''}</div></main>`;
}
function cadence(h){if(h.frequency==='weekly')return `${h.target} / week`;if(h.frequency==='monthly')return `${h.target} / month`;if(h.days.length===7)return 'Daily';return h.days.map(d=>weekdays[d]).join(' ');}
function monthLabel(m=month){return parseDay(m+'-01').toLocaleDateString(undefined,{month:'long',year:parseDay(m+'-01').getFullYear()!==new Date().getFullYear()?'numeric':undefined});}
function monthControl(){return `<div class="month-control">${iconBtn('back','month-prev','Previous month')}<button class="month" data-action="month-current" aria-label="Return to current month">${esc(monthLabel())}</button>${iconBtn('next','month-next','Next month',month>=today().slice(0,7)?'disabled':'')}</div>`;}
function visibleHabits(){const first=month+'-01',last=monthDays(month).at(-1);return state.habits.filter(h=>h.createdDay<=last&&(!h.deletedDay||h.deletedDay>first)).sort((a,b)=>a.order-b.order);}
function stateDot(h,k){if(k>today()||!eligible(h,k))return 'unavailable';return entryFor(state,h.id,k)?.status||'pending';}
function grid(habits,days){return `<div class="tracker-grid"><span></span>${days.map(k=>`<span class="day-heading ${k===today()?'today':''}">${shortDays[parseDay(k).getDay()]}<span>${parseDay(k).getDate()}</span></span>`).join('')}${habits.map(h=>`<button class="habit-label" data-action="detail" data-id="${h.id}">${esc(habitVersion(h,days[0]).title)}</button>${days.map(k=>`<button class="dot-button" data-action="entry" data-id="${h.id}" data-day="${k}" ${k>today()||!eligible(h,k)?'disabled':''} aria-label="${esc(h.title)}, ${k}, ${stateDot(h,k)}"><i class="dot ${stateDot(h,k)}"></i></button>`).join('')}`).join('')}</div>`;}
function lineChart(days,habit=null){
  const points=days.map(k=>{if(k>today())return null;if(habit){if(!eligible(habit,k))return null;return entryFor(state,habit.id,k)?.status==='done'?1:0;}return dayStats(state,k).rate;});
  if(!points.some(x=>x!==null))return '<div class="chart-empty">Your progress will appear here.</div>';
  const w=320,h=130,left=26,right=10,top=8,bottom=24,iw=w-left-right,ih=h-top-bottom;
  const xy=(v,i)=>[left+iw*i/Math.max(1,days.length-1),top+ih*(1-v)];let d='',segments=[],active=false;
  points.forEach((v,i)=>{if(v===null){active=false;return;}const [x,y]=xy(v,i);d+=`${active?'L':'M'}${x.toFixed(1)},${y.toFixed(1)} `;active=true;segments.push(`<circle cx="${x}" cy="${y}" r="2.8" fill="var(--text)"/>`);});
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Completion rate for the selected period"><g font-family="DM Sans Variable, sans-serif" font-size="9" fill="var(--muted)">${[0,.5,1].map(v=>`<text x="0" y="${top+ih*(1-v)+3}">${v*100}</text><line x1="${left}" x2="${w-right}" y1="${top+ih*(1-v)}" y2="${top+ih*(1-v)}" stroke="var(--line)" stroke-dasharray="2 4"/>`).join('')}<path d="${d}" fill="none" stroke="var(--text)" stroke-width="1.4"/>${segments.join('')}${days.map((k,i)=>days.length>8&&i%Math.ceil(days.length/7)!==0?'':`<text x="${xy(0,i)[0]}" y="${h-5}" text-anchor="middle">${days.length<=7?shortDays[parseDay(k).getDay()]:parseDay(k).getDate()}</text>`).join('')}</g></svg>`;
}
function summaries(habits,days=monthDays(month)){return habits.map(h=>{const p=habitProgress(state,h,days,today());return `<button class="habit-summary" data-action="detail" data-id="${h.id}" style="display:block;width:100%;text-align:left"><div class="metric-row"><span>${esc(h.title)}</span><small>${p.done} / ${p.total}</small></div><div class="progress-bar"><i style="width:${Math.round((p.rate||0)*100)}%"></i></div></button>`;}).join('');}
function calendar(habit=null){const days=monthDays(month),offset=(parseDay(days[0]).getDay()+6)%7;return `<div class="calendar">${['M','T','W','T','F','S','S'].map(d=>`<span class="day-name">${d}</span>`).join('')}${'<span></span>'.repeat(offset)}${days.map(k=>{const s=habit?stateDot(habit,k):dayStats(state,k).rate===1?'done':dayStats(state,k).reviewed?'skipped':'pending';return `<button class="${k===today()?'today':''} ${k>today()?'future':''}" data-action="${habit?'entry':'day-detail'}" data-day="${k}" ${habit?`data-id="${habit.id}"`:''} ${k>today()||(habit&&!eligible(habit,k))?'disabled':''} aria-label="${k}">${parseDay(k).getDate()}<i class="dot ${s}"></i></button>`;}).join('')}</div>`;}
function tracker(){
  const habits=visibleHabits(), days=Array.from({length:7},(_,i)=>shiftDay(week,i));
  let content='';
  if(!habits.length)content='<div class="empty-state"><h2>No habits this month.</h2><button class="text-link" data-action="add">Add a habit</button></div>';
  else if(mode==='daily')content=grid(habits,days)+`<div class="week-arrows">${iconBtn('back','week-prev','Previous week')}<span>${parseDay(days[0]).toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${parseDay(days[6]).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span>${iconBtn('next','week-next','Next week',week>=weekStart(today())?'disabled':'')}</div><div class="chart-wrap">${lineChart(days)}</div>`;
  else if(mode==='weekly')content=`<div class="week-arrows">${iconBtn('back','week-prev','Previous week')}<span>${parseDay(days[0]).toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${parseDay(days[6]).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span>${iconBtn('next','week-next','Next week',week>=weekStart(today())?'disabled':'')}</div>${summaries(habits,days)}<div class="chart-wrap">${lineChart(days)}</div>`;
  else content=calendar()+`<div class="section-label">HABIT PROGRESS</div>${summaries(habits)}<div class="reflection"><div class="section-label">MONTHLY REFLECTION</div><textarea id="reflection" aria-label="Monthly reflection" placeholder="A thought to keep…" maxlength="5000">${esc(state.reflections[month]||'')}</textarea></div>`;
  return `<main class="page"><header class="page-head"><h1>My Tracker</h1></header>${monthControl()}<div class="segments" role="tablist" aria-label="Tracker view">${['daily','weekly','monthly'].map(m=>`<button role="tab" aria-selected="${mode===m}" class="${mode===m?'selected':''}" data-action="mode" data-mode="${m}">${m[0].toUpperCase()+m.slice(1)}</button>`).join('')}</div>${content}</main>`;
}
function habits(){const active=state.habits.filter(h=>!h.deletedDay).sort((a,b)=>a.order-b.order);return `<main class="page ${reorder?'reorder':''}"><header class="page-head"><h1>My Habits</h1><div style="display:flex">${active.length>1?iconBtn('grip','reorder',reorder?'Finish reordering':'Reorder habits'):''}${iconBtn('plus','add','Add habit')}</div></header><div class="habit-list">${active.map((h,i)=>`<div class="habit-row ${h.paused?'paused':''}"><button class="habit-edit" data-action="edit" data-id="${h.id}">${icon(h.icon,25,h.customPaths)}<span class="name">${esc(h.title)}</span><span class="cadence">${h.paused?'Paused':esc(cadence(h))}</span></button>${reorder?`<div class="habit-actions">${iconBtn('back','move-up','Move habit up',`data-id="${h.id}" ${i===0?'disabled':''}`)}${iconBtn('next','move-down','Move habit down',`data-id="${h.id}" ${i===active.length-1?'disabled':''}`)}</div>`:''}</div>`).join('')}</div>${!active.length?'<div class="empty-state"><button class="primary" data-action="add">Add your first habit</button></div>':''}${state.habits.some(h=>h.deletedDay)?'<button class="text-link" data-action="archived" style="margin-top:25px">Archived habits</button>':''}</main>`;}
function settingRow(sym,label,action,value='',toggle=null){return `<button class="settings-row" data-action="${action}" ${toggle!==null?`role="switch" aria-checked="${toggle}"`:''}>${icon(sym,21)}<span class="label">${label}</span>${toggle!==null?`<span class="toggle ${toggle?'on':''}"><i></i></span>`:`<span class="value">${esc(value)}</span>${icon('next',15)}`}</button>`;}
function settings(){const s=state.settings;return `<main class="page"><header class="page-head"><h1>Settings</h1></header><div class="settings-group">${settingRow('bell','Reminder','reminder','',s.reminder)}${settingRow('clock','Time','reminder-time',formatTime(s.reminderTime))}${settingRow('moon','Day ends','cutoff',s.cutoff?`${s.cutoff}:00 AM`:'Midnight')}${settingRow('spark','Appearance','theme',s.theme[0].toUpperCase()+s.theme.slice(1))}${settingRow('phone','Haptics','haptics','',s.haptics)}${settingRow('pause','Reduce motion','motion','',s.reducedMotion)}</div><div class="settings-group">${settingRow('journal','My Habits','nav-habits')}${settingRow('chart','Home widget','widget')}${settingRow('people','Your name','name',state.profile.name||'Optional')}${settingRow('export','Export progress','export')}${settingRow('journal','Restore backup','import')}${settingRow('book','About WhiteHole','about')}</div><p class="settings-foot">WhiteHole · 1.0<br>Your habits stay on this device.</p><input type="file" id="import-file" accept=".xlsx,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></main>`;}
function formatTime(value){const [h,m]=value.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;}
function widget(){const k=today(),s=dayStats(state,k),hs=todayHabits(state,k);return `<main class="page"><header class="page-head"><h1>Home widget</h1>${iconBtn('back','back-settings','Back to settings')}</header><div class="widget-preview" role="button" tabindex="0" data-action="nav" data-route="checkin" aria-label="Open WhiteHole check-in"><div class="top"><span>WhiteHole</span><span class="streak" aria-label="${checkinStreak(state,k)} day check-in streak">🔥 ${checkinStreak(state,k)}</span></div><div class="bottom">${dots(hs,k)}<span class="count">${s.done}/${s.scheduled}</span></div></div><p class="help-copy">A small glimpse of today. The streak counts days you checked in, even when you skipped a habit.</p><button class="primary" data-action="pin-widget" style="width:100%;margin-top:18px">${platform==='android'?'Add to home screen':'How to add'}</button></main>`;}
function detail(){const h=state.habits.find(x=>x.id===detailId);if(!h){route='tracker';return tracker();}const p=habitProgress(state,h,monthDays(month),today());return `<main class="page"><header class="page-head"><h1>${esc(h.title)}</h1>${iconBtn('back','back-tracker','Back to tracker')}</header><div class="detail-meta"><div><strong>${p.done}/${p.total}</strong><span>This month</span></div><div><strong>${habitStreak(state,h,today())}</strong><span>${h.frequency==='daily'?'Day':h.frequency==='weekly'?'Week':'Month'} streak</span></div></div>${monthControl()}${calendar(h)}<div class="chart-wrap">${lineChart(monthDays(month),h)}</div><button class="text-link" data-action="edit" data-id="${h.id}" style="margin-top:20px">Edit habit</button></main>`;}
function onboarding(){if(setupStage===0)return `<section class="onboarding"><span class="wordmark">WhiteHole</span><div class="intro">${icon('moon',48)}<h1>A quieter end<br>to your day.</h1><p>A few habits. A few swipes.<br>Then, good night.</p></div><button class="primary" data-action="begin">Begin</button></section>`;const options=[['Read for 10 minutes','book'],['Take a walk','walk'],['Learn something','learn'],['Write a journal','journal'],['Stretch','stretch']];return `<section class="onboarding"><span class="wordmark">WhiteHole</span><div class="intro" style="gap:12px"><h1 style="font-size:30px">Start small.</h1><p>Choose a few, or make your own later.</p><div class="setup-list">${options.map(([title,sym])=>`<button class="setup-item ${selectedStarter.has(title)?'selected':''}" data-action="starter" data-title="${title}" aria-pressed="${selectedStarter.has(title)}">${icon(sym,23)}<span>${title}</span><span class="selection">${selectedStarter.has(title)?icon('check',18):''}</span></button>`).join('')}</div></div><button class="primary" data-action="finish-setup">${selectedStarter.size?'Make these mine':'Start with a blank page'}</button></section>`;}
function sheetContent(){
  const m=modal;
  if(m.type==='habit'){const h=m.id?state.habits.find(x=>x.id===m.id):null,values=m.values||h||{title:'',frequency:'daily',days:[0,1,2,3,4,5,6],target:1,icon:'spark'};m.values={...values,days:[...values.days]};return `<div class="sheet-head"><h2>${h?'Edit habit':'A new habit'}</h2>${iconBtn('close','close','Close')}</div><form id="habit-form"><div class="field"><label for="goal-name">Goal</label><div class="goal-input"><button type="button" class="icon-button" data-action="icon-picker" aria-label="Change automatic icon" id="auto-icon">${icon(values.icon,25,values.customPaths)}</button><input id="goal-name" name="title" placeholder="What would you like to do?" value="${esc(values.title)}" maxlength="100" required autocomplete="off"></div></div><div class="field"><label for="frequency">Repeat</label><select id="frequency" name="frequency"><option value="daily" ${values.frequency==='daily'?'selected':''}>On selected days</option><option value="weekly" ${values.frequency==='weekly'?'selected':''}>A target each week</option><option value="monthly" ${values.frequency==='monthly'?'selected':''}>A target each month</option></select></div><div class="field" id="schedule-field">${scheduleField(values)}</div>${h?`<button type="button" class="settings-row" data-action="pause-habit" data-id="${h.id}">${icon(h.paused?'play':'pause',20)}<span class="label">${h.paused?'Resume':'Pause'} habit</span></button>`:''}<p class="error" id="form-error" role="alert"></p><button class="primary" type="submit">${h?'Save changes':'Add habit'}</button>${h?`<button type="button" class="danger" data-action="delete-habit" data-id="${h.id}">Archive habit</button>`:''}</form>`;}
  if(m.type==='icons')return `<div class="sheet-head"><h2>Choose a symbol</h2>${iconBtn('back','back-habit','Back')}</div><div class="icon-grid">${goalIcons.map(n=>`<button data-action="choose-icon" data-icon="${n}" aria-label="${n}" class="${m.parent.values.icon===n?'selected':''}">${icon(n,25)}</button>`).join('')}</div>`;
  if(m.type==='entry'){const h=state.habits.find(h=>h.id===m.id),e=entryFor(state,m.id,m.day);return `<div class="sheet-head"><h2>${esc(h?.title)}</h2>${iconBtn('close','close','Close')}</div><p class="help-copy">${parseDay(m.day).toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</p><div class="status-options">${[['done','check','Done'],['skipped','close','Skipped'],['excused','pause','Excused'],['clear','undo','Not logged']].map(([s,i,t])=>`<button data-action="set-status" data-status="${s}" class="${e?.status===s?'selected':''}">${icon(i,21)}${t}</button>`).join('')}</div>`;}
  if(m.type==='day')return `<div class="sheet-head"><h2>${parseDay(m.day).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</h2>${iconBtn('close','close','Close')}</div><div class="status-options">${todayHabits(state,m.day).map(h=>`<button data-action="entry" data-id="${h.id}" data-day="${m.day}">${icon(h.icon,21,h.customPaths)}<span style="flex:1">${esc(h.title)}</span><small>${entryFor(state,h.id,m.day)?.status||'Not logged'}</small></button>`).join('')||'<p class="help-copy">No habits scheduled.</p>'}</div>`;
  if(m.type==='theme')return choices('Appearance',[['dark','Soft black'],['light','Light'],['system','Match phone']],state.settings.theme,'set-theme');
  if(m.type==='cutoff')return choices('Day ends',[['0','Midnight'],['2','2:00 AM'],['4','4:00 AM']],String(state.settings.cutoff),'set-cutoff');
  if(m.type==='time')return `<div class="sheet-head"><h2>Evening reminder</h2>${iconBtn('close','close','Close')}</div><form id="time-form"><input type="time" name="time" value="${state.settings.reminderTime}" aria-label="Reminder time" required><button type="submit" class="primary">Save time</button></form>`;
  if(m.type==='name')return `<div class="sheet-head"><h2>Your name</h2>${iconBtn('close','close','Close')}</div><form id="name-form"><input name="name" maxlength="60" value="${esc(state.profile.name)}" placeholder="Optional" aria-label="Your name"><button class="primary">Save</button></form>`;
  if(m.type==='about')return `<div class="sheet-head"><h2>WhiteHole</h2>${iconBtn('close','close','Close')}</div><p class="help-copy">A quieter end to your day.<br>Made by Niwas Repalle &amp; Sai Chand · Version 1.0</p><p class="help-copy">Right swipe completes a habit. Left swipe skips it. Use Undo to correct a swipe, or tap any tracker dot to edit history.</p><p class="help-copy">Daily habits count only scheduled days. Weekly and monthly habits leave your deck once their target is met. Excused days are neutral.</p><p class="help-copy">Your data stays on this device. Export your Excel progress before moving phones or uninstalling. Custom icon generation, when configured, sends only the goal name to the icon service.</p>`;
  if(m.type==='widget-help')return `<div class="sheet-head"><h2>Your home widget</h2>${iconBtn('close','close','Close')}</div><p class="help-copy">${native?'Touch and hold an empty space on your home screen. Choose Add Widget, search for WhiteHole, then add the small dots widget.':'The widget is available in the installed Android and iPhone apps. This preview shows its appearance.'}</p><p class="help-copy">It follows your appearance setting and opens check-in when tapped.</p>`;
  if(m.type==='delete')return `<div class="sheet-head"><h2>Archive this habit?</h2>${iconBtn('close','close','Close')}</div><p class="help-copy">It leaves your check-in deck. Your past progress stays in the tracker.</p><button class="primary" data-action="confirm-delete" data-id="${m.id}">Archive habit</button>`;
  if(m.type==='restore')return `<div class="sheet-head"><h2>Restore this backup?</h2>${iconBtn('close','close','Close')}</div><p class="help-copy">${m.backup.habits.length} habits. This replaces the data currently on this device. Export your current progress first if you want to keep it.</p><button class="secondary" data-action="export" style="width:100%">Export current data</button><button class="primary" data-action="confirm-restore">Restore backup</button>`;
  if(m.type==='archived')return `<div class="sheet-head"><h2>Archived habits</h2>${iconBtn('close','close','Close')}</div><div class="choice-list">${state.habits.filter(h=>h.deletedDay).map(h=>`<button data-action="restore-habit" data-id="${h.id}">${esc(h.title)}<small>Restore</small></button>`).join('')}</div>`;
  return '';
}
function choices(title,options,current,action){return `<div class="sheet-head"><h2>${title}</h2>${iconBtn('close','close','Close')}</div><div class="choice-list">${options.map(([v,t])=>`<button data-action="${action}" data-value="${v}" class="${v===current?'selected':''}">${t}${v===current?icon('check',19):''}</button>`).join('')}</div>`;}
function scheduleField(v){return v.frequency==='daily'?`<label>Days</label><div class="day-picks">${[1,2,3,4,5,6,0].map(d=>`<button type="button" data-action="toggle-day" data-day="${d}" class="${v.days.includes(d)?'selected':''}" aria-pressed="${v.days.includes(d)}" aria-label="${shortDays[d]}">${weekdays[d]}</button>`).join('')}</div>`:`<label for="target">Times per ${v.frequency==='weekly'?'week':'month'}</label><input id="target" name="target" type="number" min="1" max="${v.frequency==='weekly'?7:31}" value="${v.target}" required>`;}
function render(){
  applyTheme();if(!state.onboarded){root.innerHTML=`<div class="shell">${onboarding()}</div>`;return;}
  const content=route==='checkin'?checkin():route==='tracker'?tracker():route==='habits'?habits():route==='widget'?widget():route==='detail'?detail():settings();
  root.innerHTML=`<div class="shell"><div id="page-content" ${modal?'inert aria-hidden="true"':''}>${content}${nav()}</div>${modal?`<div class="overlay"><section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(modal.type)}"><div class="sheet-handle"></div>${sheetContent()}</section></div>`:''}</div>`;
  if(modal){const focus=root.querySelector('.sheet input:not([type=number]), .sheet select, .sheet button');setTimeout(()=>focus?.focus({preventScroll:true}),80);}
}
function openHabit(id=null){modal={type:'habit',id};render();}
function readHabitForm(){if(modal?.type!=='habit')return;const form=root.querySelector('#habit-form');if(!form)return;modal.values.title=form.elements.title.value;modal.values.frequency=form.elements.frequency.value;if(form.elements.target)modal.values.target=Number(form.elements.target.value);}
async function swipe(status){
  if(busy)return;const key=today(),h=pendingHabits(state,key)[0];if(!h)return;busy=true;
  const card=document.querySelector('#swipe-card'), previous=entryFor(state,h.id,key);tapHaptic(state.settings);
  if(card){card.classList.remove('enter');card.style.transition=state.settings.reducedMotion?'none':'transform .3s cubic-bezier(.3,.7,.3,1),opacity .3s';card.style.transform=`translateX(${status==='done'?600:-600}px) rotate(${status==='done'?16:-16}deg)`;card.style.opacity='0';}
  if(!state.settings.reducedMotion&&!matchMedia('(prefers-reduced-motion: reduce)').matches)await new Promise(r=>setTimeout(r,260));
  undoStack.push({id:h.id,key,previous});const saved=await commit(()=>setEntry(state,h.id,key,status));if(!saved)undoStack.pop();busy=false;
}
root.addEventListener('click',async event=>{
  const b=event.target.closest('[data-action]');
  if(!b){if(event.target.classList.contains('overlay')){modal=null;render();}return;}if(b.disabled)return;
  const a=b.dataset.action,id=b.dataset.id;
  if(a==='nav'){go(b.dataset.route);return;}
  if(a==='begin'){setupStage=1;render();return;}
  if(a==='starter'){const t=b.dataset.title;selectedStarter.has(t)?selectedStarter.delete(t):selectedStarter.add(t);render();return;}
  if(a==='finish-setup'){await commit(()=>{for(const title of selectedStarter)addHabit(state,{title,icon:inferIcon(title)},today());state.onboarded=true;});return;}
  if(a==='add'){openHabit();return;}if(a==='edit'){openHabit(id);return;}
  if(a==='close'){modal=null;render();return;}
  if(a==='undo'){if(busy)return;const u=undoStack.pop();if(!u)return;await commit(()=>{if(u.previous){state.entries[u.id]||={};state.entries[u.id][u.key]=u.previous;}else clearEntry(state,u.id,u.key);});return;}
  if(a==='accessible-done'||a==='accessible-skip'){await swipe(a==='accessible-done'?'done':'skipped');return;}
  if(a==='mode'){mode=b.dataset.mode;render();return;}
  if(a==='month-prev'||a==='month-next'){const d=parseDay(month+'-01');d.setMonth(d.getMonth()+(a==='month-prev'?-1:1));month=dayKey(d).slice(0,7);week=weekStart(month===today().slice(0,7)?today():month+'-01');render();return;}
  if(a==='month-current'){month=today().slice(0,7);week=weekStart(today());render();return;}
  if(a==='week-prev'||a==='week-next'){week=shiftDay(week,a==='week-prev'?-7:7);month=shiftDay(week,3).slice(0,7);render();return;}
  if(a==='entry'){modal={type:'entry',id,day:b.dataset.day};render();return;}
  if(a==='day-detail'){modal={type:'day',day:b.dataset.day};render();return;}
  if(a==='detail'){route='detail';detailId=id;render();return;}
  if(a==='back-tracker'){go('tracker');return;}if(a==='back-settings'){go('settings');return;}
  if(a==='set-status'){const m=modal;modal=null;await commit(()=>{if(b.dataset.status==='clear')clearEntry(state,m.id,m.day);else setEntry(state,m.id,m.day,b.dataset.status);});undoStack=[];return;}
  if(a==='reorder'){reorder=!reorder;render();return;}
  if(a==='move-up'||a==='move-down'){const hs=state.habits.filter(h=>!h.deletedDay).sort((a,b)=>a.order-b.order),i=hs.findIndex(h=>h.id===id),j=i+(a==='move-up'?-1:1);if(!hs[j])return;await commit(()=>{[hs[i].order,hs[j].order]=[hs[j].order,hs[i].order];});return;}
  if(a==='toggle-day'){readHabitForm();const d=Number(b.dataset.day),v=modal.values;v.days.includes(d)?v.days=v.days.filter(x=>x!==d):v.days.push(d);b.classList.toggle('selected');b.setAttribute('aria-pressed',v.days.includes(d));return;}
  if(a==='icon-picker'){readHabitForm();modal={type:'icons',parent:modal};render();return;}
  if(a==='back-habit'){modal=modal.parent;render();return;}
  if(a==='choose-icon'){modal.parent.values.icon=b.dataset.icon;modal.parent.values.customPaths=null;modal.parent.manualIcon=true;modal=modal.parent;render();return;}
  if(a==='pause-habit'){const h=state.habits.find(h=>h.id===id);modal=null;await commit(()=>editHabit(state,id,{paused:!h.paused},today()));return;}
  if(a==='delete-habit'){modal={type:'delete',id};render();return;}
  if(a==='confirm-delete'){modal=null;await commit(()=>{editHabit(state,id,{paused:true},today());state.habits.find(h=>h.id===id).deletedDay=today();});return;}
  if(a==='archived'){modal={type:'archived'};render();return;}
  if(a==='restore-habit'){modal=null;await commit(()=>{const h=state.habits.find(h=>h.id===id);h.deletedDay=null;editHabit(state,id,{paused:false},today());});return;}
  if(a==='reminder'){
    if(state.settings.reminder){await commit(()=>state.settings.reminder=false);return;}
    try{await enableReminders();await commit(()=>state.settings.reminder=true);toast('Evening reminder enabled.');}catch(e){toast(e.message);}return;
  }
  if(a==='haptics'||a==='motion'){await commit(()=>state.settings[a==='haptics'?'haptics':'reducedMotion']=!state.settings[a==='haptics'?'haptics':'reducedMotion']);return;}
  if(a==='reminder-time'){modal={type:'time'};render();return;}
  if(['theme','cutoff','name','about'].includes(a)){modal={type:a};render();return;}
  if(a==='set-theme'){modal=null;await commit(()=>state.settings.theme=b.dataset.value);return;}
  if(a==='set-cutoff'){modal=null;undoStack=[];await commit(()=>state.settings.cutoff=Number(b.dataset.value));return;}
  if(a==='nav-habits'){go('habits');return;}if(a==='widget'){go('widget');return;}
  if(a==='pin-widget'){try{if(platform==='android'&&await requestWidget()){toast('Choose where to place your widget.');return;}}catch{}modal={type:'widget-help'};render();return;}
  if(a==='export'){try{const {progressWorkbook,excelMime}=await import('./export.js');await exportFile(`WhiteHole-${today()}.xlsx`,await progressWorkbook(state,today()),excelMime);}catch(e){toast(e.message||'Export could not be completed.');}return;}
  if(a==='import'){root.querySelector('#import-file').click();return;}
  if(a==='confirm-restore'){const backup=modal.backup;modal=null;undoStack=[];await commit(()=>state=backup);toast('Backup restored.');return;}
});
root.addEventListener('input',event=>{
  if(event.target.id==='goal-name'&&modal?.type==='habit'){modal.values.title=event.target.value;if(!modal.manualIcon){modal.values.icon=inferIcon(event.target.value);modal.values.customPaths=null;root.querySelector('#auto-icon').innerHTML=icon(modal.values.icon,25);}}
});
root.addEventListener('change',async event=>{
  if(event.target.id==='frequency'){readHabitForm();root.querySelector('#schedule-field').innerHTML=scheduleField(modal.values);}
  if(event.target.id==='reflection'){const value=event.target.value;await commit(()=>state.reflections[month]=value,{renderPage:false,schedule:false});}
  if(event.target.id==='import-file'){try{const file=event.target.files[0];if(!file)return;if(file.size>3_000_000)throw new Error('Choose a backup smaller than 3 MB.');const data=file.name.toLowerCase().endsWith('.xlsx')?await (await import('./export.js')).readWorkbookBackup(await file.arrayBuffer()):JSON.parse(await file.text());const backup=validateImport(data);modal={type:'restore',backup};render();}catch(e){toast(e.message||'Could not read this backup.');}}
});
root.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.target;
  if(form.id==='habit-form'){
    readHabitForm();const m=modal,button=form.querySelector('.primary'),error=form.querySelector('#form-error');button.disabled=true;button.textContent='Saving…';
    try{
      let result={icon:m.values.icon,customPaths:m.values.customPaths};
      const existing=m.id?state.habits.find(h=>h.id===m.id):null;
      const generate=!m.manualIcon&&(!existing||existing.title!==m.values.title);
      if(generate)result={icon:inferIcon(m.values.title),customPaths:null};
      const input={...m.values,...result};
      // Pre-validate so errors stay in the editor without losing typed text.
      const check=newState();addHabit(check,input,today());
      modal=null;
      let savedHabit;
      const saved=await commit(()=>savedHabit=m.id?editHabit(state,m.id,input,today()):addHabit(state,input,today()));
      if(!saved){modal=m;render();}
      else {if(route==='checkin'&&existing)render();tapHaptic(state.settings);
        if(generate&&result.icon==='spark')resolveIcon(input.title).then(async drawing=>{const h=state.habits.find(x=>x.id===savedHabit.id);if(drawing.source==='generated'&&h&&!h.deletedDay&&h.title===input.title&&h.icon==='spark')await commit(()=>editHabit(state,h.id,{icon:drawing.icon,customPaths:drawing.customPaths},today()),{schedule:false});});
      }
    }catch(e){error.textContent=e.message;button.disabled=false;button.textContent=m.id?'Save changes':'Add habit';}
  }
  if(form.id==='time-form'){const value=form.elements.time.value;if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return;modal=null;await commit(()=>state.settings.reminderTime=value);}
  if(form.id==='name-form'){const value=form.elements.name.value.trim();modal=null;await commit(()=>state.profile.name=value);}
});
root.addEventListener('pointerdown',event=>{
  const card=event.target.closest('#swipe-card');if(!card||busy||modal||event.button!==0||event.target.closest('button'))return;
  card.classList.remove('enter','snap');card.style.transition='none';card.setPointerCapture(event.pointerId);
  drag={card,startX:event.clientX,startY:event.clientY,x:0,y:0,lastX:event.clientX,lastTime:performance.now(),velocity:0,pointer:event.pointerId,frame:0};
});
root.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.pointer)return;const d=drag,time=performance.now();d.x=event.clientX-d.startX;d.y=event.clientY-d.startY;d.velocity=(event.clientX-d.lastX)/Math.max(1,time-d.lastTime);d.lastX=event.clientX;d.lastTime=time;
  if(!d.frame)d.frame=requestAnimationFrame(()=>{d.frame=0;d.card.classList.add('dragging');d.card.style.transform=`translate(${d.x}px,${d.y*.18}px) rotate(${d.x*.035}deg)`;d.card.querySelector('.right').style.opacity=String(Math.max(0,Math.min(1,d.x/110)));d.card.querySelector('.left').style.opacity=String(Math.max(0,Math.min(1,-d.x/110)));});
});
function finishDrag(event,cancel=false){if(!drag||event.pointerId!==drag.pointer)return;const d=drag;drag=null;if(d.frame)cancelAnimationFrame(d.frame);d.card.classList.remove('dragging');const threshold=Math.min(95,d.card.clientWidth*.27);if(!cancel&&(Math.abs(d.x)>threshold||(Math.abs(d.x)>40&&Math.abs(d.velocity)>.6))){swipe(d.x>0?'done':'skipped');return;}d.card.classList.add('snap');d.card.style.transition='';d.card.style.transform='';d.card.querySelector('.right').style.opacity='0';d.card.querySelector('.left').style.opacity='0';}
root.addEventListener('pointerup',e=>finishDrag(e));root.addEventListener('pointercancel',e=>finishDrag(e,true));
document.addEventListener('keydown',event=>{
  if(modal){if(event.key==='Escape'){modal=null;render();}if(event.key==='Tab'){const focusables=[...root.querySelectorAll('.sheet button:not(:disabled),.sheet input,.sheet select,.sheet textarea')];const first=focusables[0],last=focusables.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}return;}
  if(route==='checkin'&&state?.onboarded&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){if(event.key==='ArrowRight'){event.preventDefault();swipe('done');}if(event.key==='ArrowLeft'){event.preventDefault();swipe('skipped');}}
});
let lastDay;
async function resume(){if(!state)return;const k=today();if(k!==lastDay){lastDay=k;undoStack=[];month=k.slice(0,7);week=weekStart(k);render();}syncReminders(state).catch(()=>{});syncWidget(state).catch(()=>{});}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)resume();});
matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>state&&applyTheme());
root.innerHTML='<div class="loading">WhiteHole</div>';
try{
  state=await loadState();lastDay=today();month=today().slice(0,7);week=weekStart(today());render();
  await nativeListeners(resume,()=>go('checkin'),()=>{if(modal){modal=null;render();}else if(route!=='checkin')go('checkin');});
  resume();setInterval(()=>{if(!document.hidden&&today()!==lastDay)resume();},30000);
  if('serviceWorker' in navigator&&!native)navigator.serviceWorker.register('/sw.js').catch(()=>{});
}catch(e){
  root.innerHTML=`<div class="shell"><section class="onboarding"><span class="wordmark">WhiteHole</span><div class="intro"><h1>Your data needs<br>a little care.</h1><p>We couldn't read the saved backup. Nothing has been overwritten. Restore from a backup or export the original data for recovery.</p><button class="secondary" id="recover-export">Export original data</button><input id="recover-import" type="file" accept=".json" aria-label="Restore backup"></div></section></div>`;
  document.querySelector('#recover-export').onclick=async()=>{const {Preferences}=await import('@capacitor/preferences');const {value}=await Preferences.get({key:'whitehole.state.v1'});await exportFile('whitehole-recovery.json',value||'{}');};
  document.querySelector('#recover-import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;state=validateImport(JSON.parse(await file.text()));await saveState(state);location.reload();}catch(e){toast(e.message);}};
}
