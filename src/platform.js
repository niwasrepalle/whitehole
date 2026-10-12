import {Capacitor,registerPlugin} from '@capacitor/core';
import {Preferences} from '@capacitor/preferences';
import {LocalNotifications} from '@capacitor/local-notifications';
import {Haptics,ImpactStyle} from '@capacitor/haptics';
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {App} from '@capacitor/app';
import {newState,validateImport,dayKey,shiftDay,parseDay,dayStats,checkinStreak,todayHabits,entryFor,periodCounts} from './domain.js';
const KEY='whitehole.state.v1';
const WidgetBridge=registerPlugin('WhiteHoleWidget');
export const native=Capacitor.isNativePlatform();
export const platform=Capacitor.getPlatform();
export async function loadState() {
  const {value}=await Preferences.get({key:KEY});
  if(!value)return newState();
  const parsed=JSON.parse(value), validated=validateImport(parsed);
  validated.onboarded=!!parsed.onboarded;
  return validated;
}
let saveChain=Promise.resolve();
export function saveState(state) {
  const value=JSON.stringify(state);
  // Queue writes: a slower prior write must never overwrite a later swipe.
  saveChain=saveChain.catch(()=>{}).then(()=>Preferences.set({key:KEY,value}));
  return saveChain;
}
export async function tapHaptic(settings) {
  if(!settings.haptics||!native)return;
  try{await Haptics.impact({style:ImpactStyle.Light});}catch{}
}
export function notificationPlan(state,now=new Date()) {
  if(!state.settings.reminder)return [];
  const [hour,minute]=state.settings.reminderTime.split(':').map(Number), out=[];
  for(let i=0;i<30;i++) {
    const date=new Date(now); date.setDate(date.getDate()+i);date.setHours(hour,minute,0,0);
    if(date<=now)continue;
    const key=dayKey(date,state.settings.cutoff), st=dayStats(state,key);
    if(!st.pending)continue;
    out.push({id:Number(dayKey(date).replaceAll('-','')),title:'WhiteHole',body:'Night check-in',schedule:{at:date,allowWhileIdle:true},isExactNotification:false,channelId:'whitehole-quiet',extra:{day:key},threadIdentifier:'night-checkin'});
  }
  return out;
}
let reminderChain=Promise.resolve();
export function syncReminders(state) {
  const snapshot=JSON.parse(JSON.stringify(state));
  reminderChain=reminderChain.catch(()=>{}).then(async()=>{
    if(!native)return;
    const pending=await LocalNotifications.getPending();
    if(pending.notifications.length)await LocalNotifications.cancel({notifications:pending.notifications.map(n=>({id:n.id}))});
    if(!snapshot.settings.reminder)return;
    const permission=await LocalNotifications.checkPermissions();if(permission.display!=='granted')throw new Error('Notifications are disabled in your phone settings.');
    if(platform==='android')await LocalNotifications.createChannel({id:'whitehole-quiet',name:'Evening check-in',description:'One gentle reminder to review your day.',importance:3,visibility:1,vibration:false});
    const notifications=notificationPlan(snapshot);
    if(notifications.length)await LocalNotifications.schedule({notifications});
  });
  return reminderChain;
}
export async function enableReminders() {
  if(!native)throw new Error('Bedtime reminders work in the installed Android or iPhone app.');
  const p=await LocalNotifications.requestPermissions();
  if(p.display!=='granted')throw new Error('Allow notifications in your phone settings to enable reminders.');
}
export function widgetPayload(state,now=new Date()) {
  const key=dayKey(now,state.settings.cutoff), days={};
  for(let i=0;i<60;i++) {
    const k=shiftDay(key,i), stats=dayStats(state,k), h=todayHabits(state,k).filter(x=>entryFor(state,x.id,k)||periodCounts(state,x,k).done<periodCounts(state,x,k).target);
    days[k]={...stats,streak:checkinStreak(state,k),dots:h.slice(0,12).map(x=>entryFor(state,x.id,k)?.status==='done')};
  }
  return {updatedAt:now.toISOString(),cutoff:state.settings.cutoff,theme:state.settings.theme,days};
}
let widgetChain=Promise.resolve();
export function syncWidget(state) {
  if(!native)return Promise.resolve();
  const payload=JSON.stringify(widgetPayload(state));
  widgetChain=widgetChain.catch(()=>{}).then(()=>WidgetBridge.update({payload}));return widgetChain;
}
export async function requestWidget() {
  if(!native)return false;
  const result=await WidgetBridge.requestPin();return result.supported;
}
export async function exportFile(name,text,mime='application/json') {
  if(native) {
    const binary=text instanceof Uint8Array;let data=text;if(binary){let raw='';for(let i=0;i<text.length;i+=8192)raw+=String.fromCharCode(...text.subarray(i,i+8192));data=btoa(raw);}
    await Filesystem.writeFile({path:name,data,directory:Directory.Cache,...(binary?{}:{encoding:Encoding.UTF8})});
    const {uri}=await Filesystem.getUri({path:name,directory:Directory.Cache});
    await Share.share({title:'WhiteHole progress',files:[uri]});
  } else {
    const url=URL.createObjectURL(new Blob([text],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
export async function nativeListeners(onResume,onCheckin,onBack) {
  if(!native)return;
  window.addEventListener('whitehole:checkin',onCheckin);
  await App.addListener('appStateChange',({isActive})=>{if(isActive)onResume();});
  await App.addListener('appUrlOpen',()=>onCheckin());
  await LocalNotifications.addListener('localNotificationActionPerformed',()=>onCheckin());
  if(platform==='android')await App.addListener('backButton',()=>onBack());
}
