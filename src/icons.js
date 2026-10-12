// One optical system: 24px viewbox, 1.45px strokes, round caps/joins.
export const paths = {
  book:['M12 5v15','M12 6C9 4 5 4 2.5 5.5v14C5 18 9 18 12 20c3-2 7-2 9.5-.5v-14C19 4 15 4 12 6Z'],
  walk:['M14 1a2 2 0 1 0 0 4a2 2 0 1 0 0-4','M12 7l-3 5-4 2','M12 7l3 4 4 1','M12 7l-1 8-5 6','M11 15l5 6'],
  gym:['M6 12h12','M4 8h3v8H4z','M17 8h3v8h-3z','M2 10v4','M22 10v4'],
  food:['M3 12h18c0 5-3 8-9 8s-9-3-9-8Z','M8 22h8','M12 9c0-5 3-7 8-7 0 5-3 7-8 7Z','M12 9l5-4'],
  water:['M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z','M8 15c0 2 1 3 3 3'],
  journal:['M5 3h14v18H5z','M8 7h8','M8 11h8','M8 15h5'],
  learn:['M2 9l10-6 10 6-10 6-10-6Z','M6 12v6c4 3 8 3 12 0v-6','M22 9v8'],
  moon:['M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z'],
  meditate:['M12 2a2 2 0 1 0 0 4a2 2 0 1 0 0-4','M8 11l4-3 4 3','M12 8v8','M12 16l-5 4H3l4-7','M12 16l5 4h4l-4-7'],
  run:['M15 1a2 2 0 1 0 0 4a2 2 0 1 0 0-4','M9 7l4-1 3 5 4 1','M13 6l-3 8-6 1','M10 14l5 2 1 5'],
  plant:['M12 22V11','M12 15C5 15 3 11 3 6c6 0 9 3 9 9Z','M12 11c0-6 3-9 9-9 0 6-3 9-9 9Z'],
  guitar:['M14 11l6-7 2 2-7 6','M13 9c-3-2-6-1-6 2-5 1-5 6-2 9s8 2 9-3c3 0 4-3 2-6','M8 12a2 2 0 1 0 0 4a2 2 0 1 0 0-4','M6 18l2 2'],
  code:['M8 6l-6 6 6 6','M16 6l6 6-6 6','M14 3l-4 18'],
  art:['M12 3C6 3 2 7 2 12s4 9 9 9c3 0 4-2 2-4-1-1 0-3 2-3h3c6 0 4-11-6-11Z','M7 8h.01','M12 6h.01','M17 8h.01','M5 13h.01'],
  music:['M9 18V5l11-2v13','M9 5l11-2','M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z','M17 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  clean:['M15 2l-5 12','M10 12l7 3-4 7H3l7-10Z','M8 17l-2 5','M11 18l-1 4'],
  money:['M3 6h18v14H3z','M3 6l14-3v3','M16 11h5v5h-5z','M17.5 13.5h.01'],
  people:['M9 4a3 3 0 1 0 0 6a3 3 0 1 0 0-6','M3 21v-3a6 6 0 0 1 12 0v3','M17 5a3 3 0 0 1 0 6','M18 14a5 5 0 0 1 4 5v2'],
  phone:['M7 2h10v20H7z','M10 18h4'],
  pet:['M5 8a2 3 0 1 0 0 .01','M10 5a2 3 0 1 0 0 .01','M15 5a2 3 0 1 0 0 .01','M20 8a2 3 0 1 0 0 .01','M6 18c0-2 4-7 6-7s6 5 6 7-4 3-6 2c-2 1-6 0-6-2Z'],
  bike:['M5 13a4 4 0 1 0 0 8a4 4 0 1 0 0-8','M19 13a4 4 0 1 0 0 8a4 4 0 1 0 0-8','M5 17l5-9 5 9H5','M10 8h7l2 9','M9 5h4','M17 5h3'],
  swim:['M7 7l5-3 5 3','M12 4l-2 8','M16 1a2 2 0 1 0 0 4a2 2 0 1 0 0-4','M2 16c3-3 4 3 7 0s4 3 7 0 4 3 6 0','M2 21c3-3 4 3 7 0s4 3 7 0 4 3 6 0'],
  stretch:['M12 1a2 2 0 1 0 0 4a2 2 0 1 0 0-4','M12 7v7','M3 8l9 3 9-3','M12 14l-6 7','M12 14l6 7'],
  cook:['M7 12c-7-2-4-9 1-7 1-5 7-5 8 0 5-2 8 5 1 7v8H7Z','M7 16h10'],
  coffee:['M3 8h13v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Z','M16 9h2a3 3 0 0 1 0 6h-2','M6 3v2','M10 2v3','M14 3v2'],
  brush:['M7 22V8h10V2H7v6','M10 2v6','M14 2v6'],
  work:['M3 8h18v13H3z','M8 8V3h8v5','M3 13h18','M10 13v3h4v-3'],
  camera:['M3 7h5l2-3h4l2 3h5v14H3z','M12 10a4 4 0 1 0 0 8a4 4 0 1 0 0-8'],
  heart:['M12 21S2 14 2 8c0-6 7-7 10-2 3-5 10-4 10 2 0 6-10 13-10 13Z'],
  language:['M3 5h12','M9 2v3','M5 5c0 6 4 10 9 12','M13 5c0 6-4 10-10 12','M14 22l4-10 4 10','M16 18h4'],
  mail:['M3 5h18v14H3z','M3 5l9 8 9-8'],
  clock:['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18','M12 7v5l3 2'],
  spark:['M12 3l2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Z'],
  check:['M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20','M7 12l3 3 7-7'],
  chart:['M5 20v-8','M12 20V4','M19 20V8'],
  settings:['M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8','M9 2h6l1 3 3 1 3 4-2 2 1 3-4 4-3-1-2 3-5-1v-3l-3-2-2-4 2-2-1-3 4-3 3 1 1-4Z'],
  plus:['M12 5v14','M5 12h14'],
  back:['M15 5l-7 7 7 7'],
  next:['M9 5l7 7-7 7'],
  close:['M6 6l12 12','M18 6L6 18'],
  undo:['M8 5L3 10l5 5','M3 10h11a6 6 0 0 1 0 12'],
  pause:['M8 5v14','M16 5v14'],
  play:['M7 4l14 8-14 8V4Z'],
  export:['M12 15V2','M7 7l5-5 5 5','M4 12v9h16v-9'],
  bell:['M5 17V9a7 7 0 0 1 14 0v8l2 2H3l2-2Z','M9 22h6'],
  grip:['M8 5h.01','M16 5h.01','M8 12h.01','M16 12h.01','M8 19h.01','M16 19h.01'],
  trash:['M3 6h18','M8 6V3h8v3','M5 6l1 15h12l1-15','M10 10v7','M14 10v7'],
};
const rules = [
  ['book',/\b(read|book|novel|literature|reading)\b/],['walk',/\b(walk|walking|steps|stroll)\b/],
  ['gym',/\b(gym|workout|lift|lifting|weights|strength|exercise|fitness)\b/],['food',/\b(healthy|vegetable|fruit|diet|nutrition|eat|eating|food)\b/],
  ['water',/\b(water|hydrate|hydration|drink water)\b/],['journal',/\b(journal|diary|write|writing|gratitude)\b/],
  ['learn',/\b(learn|study|course|lesson|practice exam|revision|assignment)\b/],['moon',/\b(sleep|bed|rest|nap)\b/],
  ['meditate',/\b(meditate|meditation|breathe|breathing|mindful|prayer|pray)\b/],['run',/\b(run|running|jog|jogging)\b/],
  ['plant',/\b(plant|plants|garden|gardening|grow)\b/],['guitar',/\b(guitar|ukulele)\b/],['code',/\b(code|coding|program|programming|software|debug)\b/],
  ['art',/\b(paint|draw|sketch|art|creative|pottery)\b/],['music',/\b(music|piano|sing|singing|instrument)\b/],
  ['clean',/\b(clean|tidy|declutter|laundry|organize|organise)\b/],['money',/\b(save|budget|finances|money|invest|bills)\b/],
  ['people',/\b(family|friend|friends|call|connect|parents|social)\b/],['phone',/\b(screen|phone|scroll|digital|social media)\b/],
  ['pet',/\b(dog|cat|pet|puppy)\b/],['bike',/\b(bike|cycling|cycle)\b/],['swim',/\b(swim|swimming|pool)\b/],
  ['stretch',/\b(yoga|stretch|stretching|mobility)\b/],['cook',/\b(cook|cooking|meal prep|bake)\b/],
  ['coffee',/\b(coffee|tea|caffeine)\b/],['brush',/\b(brush|teeth|floss|dental)\b/],['work',/\b(work|office|project|portfolio|job)\b/],
  ['camera',/\b(photo|photography|camera)\b/],['heart',/\b(kind|love|volunteer|help|care)\b/],['language',/\b(language|telugu|english|spanish|french|vocabulary)\b/],['mail',/\b(email|emails|inbox)\b/],
];
export function inferIcon(title) {
  const text=String(title).toLowerCase();
  // Specific multiword activities outrank broad words (e.g. water my plants).
  if(/\bplant(s)?\b/.test(text))return 'plant';
  if(/\bsocial media\b/.test(text))return 'phone';
  return rules.find(([,regex])=>regex.test(text))?.[0]||'spark';
}
export function validPaths(value) {
  return Array.isArray(value)&&value.length>0&&value.length<=12&&value.every(p=>typeof p==='string'&&p.length<=1000&&/^[MmLlHhVvCcSsQqTtAaZz0-9\s.,+\-]+$/.test(p));
}
export function icon(name='spark',size=24,customPaths=null) {
  const drawing=validPaths(customPaths)?customPaths:(paths[name]||paths.spark);
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing.map(p=>`<path d="${p}"/>`).join('')}</svg>`;
}
export const goalIcons=Object.keys(paths).slice(0,Object.keys(paths).indexOf('check'));
export async function resolveIcon(title) {
  const name=inferIcon(title);
  if(name!=='spark')return {icon:name,customPaths:null,source:'matched'};
  const endpoint=import.meta.env?.VITE_ICON_API || (import.meta.env?.DEV?location.origin:null);
  if(endpoint) {
    try {
      const response=await fetch(`${endpoint.replace(/\/$/,'')}/api/icon`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal:title}),signal:AbortSignal.timeout(10000)});
      if(response.ok) {const data=await response.json();if(validPaths(data.paths))return {icon:'custom',customPaths:data.paths,source:'generated'};}
    } catch { /* Offline-safe fallback keeps goal creation available. */ }
  }
  return {icon:'spark',customPaths:null,source:'fallback'};
}
