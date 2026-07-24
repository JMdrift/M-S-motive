/* ============================================================
   MOJE STAVBA — sdílená data (fotky, deník, dokumenty, výdaje)
   Jeden zdroj pravdy pro Detail etapy, Galerii, Deník a Finance.
   Ukládá se do localStorage, takže se dá přidávat/mazat a zůstane
   to uložené i po zavření appky (funguje ale jen přes lokální
   server, ne přes dvojklik na soubor - viz README).
   ============================================================ */

// kazdy projekt ma UPLNE vlastni data (jako by to byla samostatna
// instalace appky) - klice se automaticky "orazitkuji" aktivnim
// projektem, takze vsechno co jde pres msLoad/msSave je uz z podstaty
// izolovane. ms_projects_v1/ms_active_project_v1/ms_onboarded_v1 zustavaji
// zamerne globalni (jsou to udaje O projektech, ne udaje UVNITR projektu).
function msProjectKey(base){
  let pid = null;
  try{ pid = localStorage.getItem('ms_active_project_v1'); }catch(e){}
  return pid ? `${base}__${pid}` : base;
}
// jednorazova migrace: kdo uz mel data ulozena postara (neorazitkovana)
// cestou, at mu po tehle zmene nezmizi - zkopiruje se to pod aktualni
// projekt, jen kdyz tam jeste nic vlastniho neni.
function msMigrateLegacyDataToProject(){
  try{
    const pid = localStorage.getItem('ms_active_project_v1');
    if(!pid) return;
    if(localStorage.getItem('ms_migrated_to_scoped_v1')) return;
    const LEGACY_KEYS = [
      'ms_photos_v1','ms_diary_v1','ms_documents_v1','ms_expenses_v1','ms_events_v1',
      'ms_custom_stages_v1','ms_selected_stages_v1','ms_current_stage_v1','ms_closed_stages_v1',
      'ms_stage_order_v1','ms_diary_queue_v1','ms_diary_meta_v1','ms_stage_active_days_v1',
      'ms_important_v1','ms_offers_v1','ms_project_meta_v1','ms_folder_tree_v1',
    ];
    LEGACY_KEYS.forEach(base=>{
      const legacy = localStorage.getItem(base);
      const scopedKey = `${base}__${pid}`;
      if(legacy!==null && localStorage.getItem(scopedKey)===null){
        localStorage.setItem(scopedKey, legacy);
      }
    });
    localStorage.setItem('ms_migrated_to_scoped_v1', '1');
  }catch(e){}
}

const MS_STAGES = [
  {key:'pozemek',   name:'Pozemek',          color:'#4dffab'},
  {key:'projekt_povoleni', name:'Projekt a povolení', color:'#b34cff'},
  {key:'zahrada',   name:'Zahrada',          color:'#4dffab'},
  {key:'zaklady',   name:'Základy',          color:'#b34cff'},
  {key:'zemni',     name:'Zemní práce',      color:'#25e8ff'},
  {key:'demolice',  name:'Demolice / bourací práce', color:'#ff6a6a'},
  {key:'sanace_vlhkosti', name:'Sanace vlhkosti', color:'#25e8ff'},
  {key:'hruba',     name:'Hrubá stavba',     color:'#ff5e7b'},
  {key:'strecha',   name:'Střecha',          color:'#ff9b32'},
  {key:'okna',      name:'Okna a dveře',     color:'#25b7ff'},
  {key:'elektro',   name:'Elektro',          color:'#ffd35c'},
  {key:'voda',      name:'Voda/kanalizace',  color:'#25e8ff'},
  {key:'vytapeni',  name:'Vytápění',         color:'#ff5e7b'},
  {key:'zatepleni', name:'Zateplení a fasáda', color:'#25b7ff'},
  {key:'podlahy',   name:'Podlahy',          color:'#ff9b32'},
  {key:'interier',  name:'Interiér (omítky)', color:'#ffd35c'},
  {key:'malby_natery', name:'Malby a nátěry', color:'#4dffab'},
  {key:'koupelna',  name:'Koupelna',         color:'#25e8ff'},
  {key:'kuchyne',   name:'Kuchyně',          color:'#ff9b32'},
  {key:'naradi',    name:'Nářadí',           color:'#ff5e7b'},
  {key:'chytra_domacnost', name:'Chytrá domácnost', color:'#ffd35c'},
  {key:'rekuperace', name:'Rekuperace',      color:'#4dffab'},
  {key:'garaz',     name:'Garáž',            color:'#ff9b32'},
  {key:'bazen',     name:'Bazén',            color:'#25b7ff'},
  {key:'posledni_upravy', name:'Poslední úpravy', color:'#b34cff'},
  {key:'plot',      name:'Plot',             color:'#4dffab'},
];
function msStageByKey(key){ return MS_STAGES.find(s=>s.key===key) || msCustomStages().find(s=>s.key===key); }

/* ============================================================
   PRESET ETAP PODLE TYPU STAVBY - pri zalozeni projektu se podle
   zvoleneho typu rovnou predvybere smysluplna sada etap z katalogu
   (uzivatel si pak kdykoliv muze cokoliv pridat/odebrat sam).
   "Jine" zustava zamerne prazdne - nema smysl hadat.
   ============================================================ */
const MS_TYPE_STAGE_PRESETS = {
  'Rodinný dům': ['pozemek','projekt_povoleni','zemni','zaklady','hruba','strecha','okna','elektro','voda','vytapeni','zatepleni','interier','koupelna','kuchyne','naradi','rekuperace','posledni_upravy','zahrada','plot'],
  'Chata': ['pozemek','projekt_povoleni','zemni','zaklady','hruba','strecha','okna','elektro','voda','vytapeni','interier','naradi','posledni_upravy','zahrada','plot'],
  'Byt': ['projekt_povoleni','elektro','voda','podlahy','malby_natery','interier','koupelna','kuchyne','chytra_domacnost','naradi','posledni_upravy'],
  'Rekonstrukce': ['projekt_povoleni','demolice','sanace_vlhkosti','elektro','voda','vytapeni','podlahy','malby_natery','interier','koupelna','kuchyne','naradi','posledni_upravy'],
  'Komerční objekt': ['pozemek','projekt_povoleni','zemni','zaklady','hruba','strecha','okna','elektro','voda','vytapeni','zatepleni','interier','rekuperace','naradi','posledni_upravy'],
  'Jiné': [],
};

/* ============================================================
   VLASTNÍ ETAPY (uzivatel si muze vytvorit i neco mimo katalog)
   ============================================================ */
const MS_CUSTOM_STAGES_KEY = 'ms_custom_stages_v1';
function msCustomStages(){ return msLoad(MS_CUSTOM_STAGES_KEY, ()=>[]); }
function msSaveCustomStages(list){ msSave(MS_CUSTOM_STAGES_KEY, list); }
// katalog k vyberu v "Nova etapa" = vestavenych 9 + vlastni, ktere si uzivatel jiz vytvoril
function msStageCatalog(){ return [...MS_STAGES, ...msCustomStages()]; }
function msAddCustomStage(name, color){
  const list = msCustomStages();
  const stage = {key: msUid('custom_'), name, color, custom:true};
  list.push(stage);
  msSaveCustomStages(list);
  return stage;
}

/* ============================================================
   VYBRANÉ ETAPY (MS_STAGES je jen katalog možností; uživatel si
   vybere, které z nich se skutečně týkají jeho stavby - nulový
   stav = žádná vybraná, dokud si sám nepřidá)
   ============================================================ */
const MS_SELECTED_STAGES_KEY = 'ms_selected_stages_v1';
function msSelectedStageKeys(){ return msLoad(MS_SELECTED_STAGES_KEY, ()=>[]); }
function msSetSelectedStageKeys(keys){ msSave(MS_SELECTED_STAGES_KEY, keys); }
function msSelectedStages(){
  const keys = msSelectedStageKeys();
  return msStageCatalog().filter(s => keys.includes(s.key));
}
function msAddSelectedStage(key){
  const keys = msSelectedStageKeys();
  if(!keys.includes(key)){
    keys.push(key);
    msSetSelectedStageKeys(keys);
  }
}
function msRemoveSelectedStage(key){
  msSetSelectedStageKeys(msSelectedStageKeys().filter(k => k !== key));
}
// kontrola, jestli k etape uz neco patri (vydaje, fotky, dokumenty, denik) -
// pouzito pri mazani etapy, at uzivatel vi, ze data zustanou "osirela"
function msStageHasData(key){
  return msSumExpensesByStage(key) > 0
    || msPhotos().some(p=>p.stage===key)
    || msDocuments().some(d=>d.stage===key)
    || msDiary().some(e=>e.stage===key);
}
// smaze etapu ze seznamu vybranych (a uklidi navazany stav) - data k ni
// (vydaje/fotky/dokumenty/denik) se NEmazou, jen ta etapa zmizi ze vyberu
function msDeleteStage(key){
  msRemoveSelectedStage(key);
  msSetStageClosed(key, false);
  if(msGetCurrentStage()===key){
    try{ localStorage.removeItem(msProjectKey('ms_current_stage_v1')); }catch(e){}
  }
}

const MS_KEYS = {
  photos: 'ms_photos_v1',
  diary: 'ms_diary_v1',
  documents: 'ms_documents_v1',
  expenses: 'ms_expenses_v1',
  events: 'ms_events_v1',
};

function msEvents(){ return msLoad(MS_KEYS.events, ()=>[]); }
function msAddEvent(ev){
  const list = msEvents();
  const withId = Object.assign({id: msUid('e')}, ev);
  list.push(withId);
  msSave(MS_KEYS.events, list);
  return withId;
}
function msDeleteEvent(id){ msSave(MS_KEYS.events, msEvents().filter(e=>e.id!==id)); }
function msUpdateEvent(id, patch){
  const list = msEvents();
  const idx = list.findIndex(e=>e.id===id);
  if(idx===-1) return null;
  list[idx] = Object.assign({}, list[idx], patch);
  msSave(MS_KEYS.events, list);
  return list[idx];
}

// ukoly - podobne jako udalosti (maji datum, zobrazuji se v Kalendari),
// ale navic jdou odskrtnout jako hotove - to udalosti nemaji
function msTasks(){ return msLoad('ms_tasks_v1', ()=>[]); }
function msAddTask(t){
  const list = msTasks();
  const withId = Object.assign({id: msUid('task'), done:false}, t);
  list.push(withId);
  msSave('ms_tasks_v1', list);
  return withId;
}
function msUpdateTask(id, patch){
  const list = msTasks();
  const idx = list.findIndex(t=>t.id===id);
  if(idx===-1) return null;
  list[idx] = Object.assign({}, list[idx], patch);
  msSave('ms_tasks_v1', list);
  return list[idx];
}
function msDeleteTask(id){ msSave('ms_tasks_v1', msTasks().filter(t=>t.id!==id)); }

function msUid(prefix){
  return prefix + Date.now() + Math.random().toString(36).slice(2, 8);
}

// Urcuje, jestli/jak se ma ukol zobrazit na dany den (iso) v kalendari.
// Pravidla (viz diskuze s uzivatelem):
// - "bez terminu" (none): dokud neni splneny, vidi se kazdy den pod DNESKEM.
//   Po splneni zmizi odevsad a objevi se jen v den, kdy byl splnen.
// - "konkretni den" (date): vidi se jen v ten den. Kdyz den mine a ukol
//   neni splneny, zacne se navic "vlecti" pod dneskem, zvyrazneny, dokud
//   se nesplni. Po splneni zakotvi jen v den splneni.
// - "deadline": vidi se kazdy den pod dneskem od zalozeni, po prekroceni
//   terminu zvyrazneny. Po splneni zakotvi jen v den splneni.
function msTaskVisibleOn(t, iso, todayIso){
  if(t.done){
    return { visible: t.doneDate === iso, highlighted:false };
  }
  if(t.dateMode === 'none'){
    return { visible: iso===todayIso, highlighted:false };
  }
  if(t.dateMode === 'date'){
    if(iso === t.date) return { visible:true, highlighted:false };
    if(iso === todayIso && todayIso > t.date) return { visible:true, highlighted:true };
    return { visible:false, highlighted:false };
  }
  if(t.dateMode === 'deadline'){
    if(iso === todayIso) return { visible:true, highlighted: todayIso > t.date };
    return { visible:false, highlighted:false };
  }
  return { visible:false, highlighted:false };
}

// gesto "zpet": tazeni prstem od leveho okraje displeje doprava (jako na iOS)
// - v HTML/webovem rozhrani to neni tak spolehlive jako v opravdove nativni
//   appce (prohlizec si to muze brat pro sve vlastni gesto), ale jako doplnek
//   k historii appky to funguje. Volá Router.back() - vlastni historie appky,
//   ne historii prohlizece (uz nejde o skutecne stranky).
(function swipeBack(){
  let startX = null, startY = null, startT = 0;
  const EDGE = 24; // px od leveho okraje, kde gesto muze zacit
  document.addEventListener('touchstart', (e)=>{
    if(e.touches.length !== 1) return;
    const t = e.touches[0];
    if(t.clientX <= EDGE){
      startX = t.clientX; startY = t.clientY; startT = Date.now();
    } else {
      startX = null;
    }
  }, {passive:true});
  document.addEventListener('touchend', (e)=>{
    if(startX === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = Math.abs(t.clientY - startY);
    const dt = Date.now() - startT;
    if(dx > 70 && dy < 60 && dt < 600 && window.Router){
      Router.back();
    }
    startX = null;
  }, {passive:true});
})();

/* ============================================================
   ULOZISTE FOTEK/DOKUMENTU (IndexedDB) - localStorage ma pevny
   strop ~5-10 MB sdileny pro celou appku, coz na fotky/dokumenty
   ve slusne kvalite nestaci. Samotny obsah (velky base64 obrazek)
   ted zije v IndexedDB (radove stovky MB az GB, podle mista v
   telefonu), localStorage drzi jen male metadata (kdo, kdy, kam).
   Zbytek appky pozna zmenu jen minimalne - .thumb/.content pole
   zustavaji stejne pojmenovana, jen se doplni z pametove keše misto
   primo z ulozeneho zaznamu.
   ============================================================ */
const MS_BLOB_CACHE = new Map();
let msIdbPromise = null;
function msIdbOpen(){
  if(msIdbPromise) return msIdbPromise;
  msIdbPromise = new Promise((resolve)=>{
    if(!window.indexedDB){ resolve(null); return; }
    const req = indexedDB.open('moje-stavba-media', 1);
    req.onupgradeneeded = ()=>{ req.result.createObjectStore('blobs'); };
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> resolve(null);
  });
  return msIdbPromise;
}
function msIdbSet(key, value){
  return msIdbOpen().then(db=> new Promise(resolve=>{
    if(!db){ resolve(false); return; }
    try{
      const tx = db.transaction('blobs','readwrite');
      tx.objectStore('blobs').put(value, key);
      tx.oncomplete = ()=> resolve(true);
      tx.onerror = ()=> resolve(false);
    }catch(e){ resolve(false); }
  }));
}
function msIdbGet(key){
  return msIdbOpen().then(db=> new Promise(resolve=>{
    if(!db){ resolve(null); return; }
    try{
      const tx = db.transaction('blobs','readonly');
      const req = tx.objectStore('blobs').get(key);
      req.onsuccess = ()=> resolve(req.result || null);
      req.onerror = ()=> resolve(null);
    }catch(e){ resolve(null); }
  }));
}
function msIdbDelete(key){
  return msIdbOpen().then(db=> new Promise(resolve=>{
    if(!db){ resolve(false); return; }
    try{
      const tx = db.transaction('blobs','readwrite');
      tx.objectStore('blobs').delete(key);
      tx.oncomplete = ()=> resolve(true);
      tx.onerror = ()=> resolve(false);
    }catch(e){ resolve(false); }
  }));
}
function msIdbAllKeys(){
  return msIdbOpen().then(db=> new Promise(resolve=>{
    if(!db){ resolve([]); return; }
    try{
      const tx = db.transaction('blobs','readonly');
      const req = tx.objectStore('blobs').getAllKeys();
      req.onsuccess = ()=> resolve(req.result || []);
      req.onerror = ()=> resolve([]);
    }catch(e){ resolve([]); }
  }));
}
// blob klice se orazitkuji aktivnim projektem stejne jako localStorage klice
function msBlobKey(type, id){ return msProjectKey(`${type}_${id}`); }
// nacte VSECHNY fotky/dokumenty aktualniho projektu do pametove keše -
// zavola se jednou pri startu appky, pred prvnim vykreslenim
function msWalkFolderTree(nodes, fn){
  (nodes||[]).forEach(n=>{
    if(n.type==='file') fn(n);
    else if(n.type==='folder') msWalkFolderTree(n.children, fn);
  });
}
async function msHydrateBlobCache(){
  const photoIds = msPhotos().map(p=>p.id);
  const docIds = msDocuments().map(d=>d.id);
  const receiptIds = msLoad(MS_KEYS.expenses, msSeedExpenses).filter(t=>t.hasReceipt).map(t=>t.id);
  const fileIds = [];
  msWalkFolderTree(msLoadFolderTree(), n=>{ if(n.id) fileIds.push(n.id); });
  await Promise.all([
    ...photoIds.map(async id=>{ const v = await msIdbGet(msBlobKey('photo', id)); if(v) MS_BLOB_CACHE.set(msBlobKey('photo', id), v); }),
    ...docIds.map(async id=>{ const v = await msIdbGet(msBlobKey('doc', id)); if(v) MS_BLOB_CACHE.set(msBlobKey('doc', id), v); }),
    ...receiptIds.map(async id=>{ const v = await msIdbGet(msBlobKey('receipt', id)); if(v) MS_BLOB_CACHE.set(msBlobKey('receipt', id), v); }),
    ...fileIds.map(async id=>{ const v = await msIdbGet(msBlobKey('file', id)); if(v) MS_BLOB_CACHE.set(msBlobKey('file', id), v); }),
  ]);
}
// jednorazova migrace: kdo uz mel fotky/dokumenty ulozene primo v
// localStorage (stary zpusob), presune se obsah do IndexedDB a z
// localStorage zaznamu se smaze - tim se hned uvolni misto
async function msMigratePhotosDocsToIdb(){
  try{
    if(localStorage.getItem(msProjectKey('ms_migrated_to_idb_v1'))) return;
    const photos = msPhotos();
    let changed = false;
    for(const p of photos){
      if(p.thumb){ await msIdbSet(msBlobKey('photo', p.id), p.thumb); MS_BLOB_CACHE.set(msBlobKey('photo', p.id), p.thumb); delete p.thumb; changed = true; }
    }
    if(changed) msSave(MS_KEYS.photos, photos);
    const docs = msDocuments();
    let changed2 = false;
    for(const d of docs){
      if(d.content){ await msIdbSet(msBlobKey('doc', d.id), d.content); MS_BLOB_CACHE.set(msBlobKey('doc', d.id), d.content); delete d.content; changed2 = true; }
    }
    if(changed2) msSave(MS_KEYS.documents, docs);
    const tree = msLoadFolderTree();
    let changed3 = false;
    const migrateNode = async (n)=>{
      if(n.type==='file' && n.content){
        n.id = n.id || msUid('file');
        await msIdbSet(msBlobKey('file', n.id), n.content);
        MS_BLOB_CACHE.set(msBlobKey('file', n.id), n.content);
        delete n.content;
        changed3 = true;
      } else if(n.type==='folder'){
        for(const c of (n.children||[])) await migrateNode(c);
      }
    };
    for(const n of tree) await migrateNode(n);
    if(changed3) msSaveFolderTree(tree);
    localStorage.setItem(msProjectKey('ms_migrated_to_idb_v1'), '1');
  }catch(e){}
}

function msLoad(storageKey, seedFn){
  const key = msProjectKey(storageKey);
  try{
    const raw = localStorage.getItem(key);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  const seed = seedFn();
  try{ localStorage.setItem(key, JSON.stringify(seed)); }catch(e){}
  return seed;
}

/* ============================================================
   DIAGNOSTIKA A UKLID ULOZISTE - localStorage ma pevny strop
   (~5-10 MB) SDILENY pro CELOU appku napric vsemi projekty, ne
   zvlast pro kazdy. Komprese u NOVYCH fotek/dokumentu pomuze jen
   do budoucna - tohle umi zmensit i to, co uz je ulozene.
   ============================================================ */
function msStorageUsageBytes(){
  let total = 0;
  try{
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      const v = localStorage.getItem(k);
      total += (k?k.length:0) + (v?v.length:0);
    }
  }catch(e){}
  return total; // priblizne - 1 znak v JS retezci ~ 2 bajty, ale radove staci
}
function msStorageBreakdown(){
  const sizeOf = (v)=> v ? JSON.stringify(v).length : 0;
  return {
    fotky: msPhotos().reduce((a,p)=>a+sizeOf(p.thumb),0),
    dokumenty: msDocuments().reduce((a,d)=>a+sizeOf(d.content),0),
    denik: sizeOf(msDiary()),
    ostatni: 0, // dopocita se jako zbytek v UI
  };
}
function msResizeDataUrl(dataUrl, maxDim, quality){
  return new Promise(resolve=>{
    if(!dataUrl || !dataUrl.startsWith('data:image')){ resolve(dataUrl); return; }
    const img = new Image();
    img.onload = ()=>{
      let {width,height} = img;
      if(Math.max(width,height) <= maxDim){ resolve(dataUrl); return; } // uz dost male, netreba prepocitavat
      if(width>height){ height = height*maxDim/width; width = maxDim; }
      else { width = width*maxDim/height; height = maxDim; }
      const canvas = document.createElement('canvas');
      canvas.width=width; canvas.height=height;
      canvas.getContext('2d').drawImage(img,0,0,width,height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = ()=> resolve(dataUrl);
    img.src = dataUrl;
  });
}
// projde uz ulozene fotky a dokumenty teto etapy/projektu a znovu je
// zmensi na stejny strop, jaky uz plati pro nove nahravane veci - vraci
// kolik bajtu se uvolnilo, at je to videt v Nastaveni
async function msCompressExistingMedia(onProgress){
  let savedBytes = 0;
  const photos = msPhotos();
  for(let i=0;i<photos.length;i++){
    const key = msBlobKey('photo', photos[i].id);
    const before = JSON.stringify(photos[i].thumb||'').length;
    const resized = await msResizeDataUrl(photos[i].thumb, 480, 0.7);
    const after = JSON.stringify(resized||'').length;
    if(resized && after < before){ MS_BLOB_CACHE.set(key, resized); await msIdbSet(key, resized); savedBytes += (before-after); }
    if(onProgress) onProgress('fotky', i+1, photos.length);
  }
  const docs = msDocuments();
  for(let i=0;i<docs.length;i++){
    const key = msBlobKey('doc', docs[i].id);
    const before = JSON.stringify(docs[i].content||'').length;
    const resized = await msResizeDataUrl(docs[i].content, 1400, 0.75);
    const after = JSON.stringify(resized||'').length;
    if(resized && after < before){ MS_BLOB_CACHE.set(key, resized); await msIdbSet(key, resized); savedBytes += (before-after); }
    if(onProgress) onProgress('dokumenty', i+1, docs.length);
  }
  return savedBytes;
}
function msSave(storageKey, list){
  try{ localStorage.setItem(msProjectKey(storageKey), JSON.stringify(list)); return true; }
  catch(e){ return false; }
}

/* --- výchozí ukázková data --- */
function msSeedPhotos(){
  return [];
}
function msSeedDiary(){
  return [];
}
/* ============================================================
   FRONTA "PRIPRAVENO PRO DALSI ZAPIS" - kdyz uzivatel prida fotku,
   dokument nebo udalost (nebo dokonci etapu), muze/automaticky se to
   zarad do fronty. Pri dalsim zapisu do deniku se fronta nabidne jako
   dlaždice k vyrazeni/potvrzeni, a po ulozeni zapisu se cela vyprazdni -
   dalsi zapis pak sbira jen NOVE veci pridane od tohoto okamziku.
   ============================================================ */
const MS_DIARY_QUEUE_KEY = 'ms_diary_queue_v1';
function msDiaryQueue(){ return msLoad(MS_DIARY_QUEUE_KEY, ()=>[]); }
function msQueueForDiary(type, refId){
  const q = msDiaryQueue();
  if(q.some(it=>it.type===type && it.refId===refId)) return;
  q.push({ type, refId, addedAt: Date.now() });
  msSave(MS_DIARY_QUEUE_KEY, q);
}
function msUnqueueFromDiary(type, refId){
  msSave(MS_DIARY_QUEUE_KEY, msDiaryQueue().filter(it=>!(it.type===type && it.refId===refId)));
}
function msClearDiaryQueue(){ msSave(MS_DIARY_QUEUE_KEY, []); }
// fronta prevedena na zobrazitelne objekty (s nahledem/popiskem) - polozky,
// jejichz zdroj uz neexistuje (napr. smazana fotka), se tise vynechaji
function msDiaryQueueResolved(){
  const out = [];
  msDiaryQueue().forEach(it=>{
    if(it.type==='photo'){
      const p = msPhotos().find(x=>x.id===it.refId);
      if(p) out.push(Object.assign({}, it, {label: p.caption || 'Fotka', preview: p.thumb, stage: p.stage}));
    } else if(it.type==='document'){
      const d = msDocuments().find(x=>x.id===it.refId);
      if(d) out.push(Object.assign({}, it, {label: d.name, preview: null, stage: d.stage}));
    } else if(it.type==='event'){
      const e = msEvents().find(x=>x.id===it.refId);
      if(e) out.push(Object.assign({}, it, {label: e.title, preview: null, stage: null}));
    } else if(it.type==='stage_complete'){
      const s = msStageByKey(it.refId);
      if(s) out.push(Object.assign({}, it, {label: 'Dokončena etapa: '+s.name, preview: null, stage: it.refId}));
    }
  });
  return out.sort((a,b)=>a.addedAt-b.addedAt);
}
// datum posledniho zapisu do deniku (pro pripominku "uz tyden nic")
function msLastDiaryEntryDate(){
  const list = msDiary();
  if(!list.length) return null;
  return list.map(e=>e.date).sort().pop();
}
function msDayCount(startISO){
  const start = new Date(startISO+'T00:00:00');
  const now = new Date();
  return Math.max(1, Math.floor((now-start)/86400000)+1);
}
function msAddDiaryEntry(entry){
  const list = msDiary();
  const withId = Object.assign({id:msUid('d'), date: msTodayISO(), time: new Date().toTimeString().slice(0,5), author:'Stavebník'}, entry);
  list.push(withId);
  msSave(MS_KEYS.diary, list);
  return withId;
}
// vsechny zapisy serazene chronologicky (od nejstarsiho) s prirazenym poradovym cislem - napric etapami, jak to ma skutecny stavebni denik
function msDiaryNumbered(){
  const sorted = msDiary().slice().sort((a,b)=>{
    const da = a.date + ' ' + (a.time||'00:00');
    const db = b.date + ' ' + (b.time||'00:00');
    return da.localeCompare(db);
  });
  return sorted.map((e,i)=> Object.assign({}, e, {number: i+1}));
}

/* ============================================================
   METADATA PRO GENEROVANI STAVEBNIHO DENIKU (titulni strana)
   ============================================================ */
function msDiaryMeta(){
  return msLoad('ms_diary_meta_v1', ()=>({
    nazev:null, misto:null, stavebnik:null, projektant:null,
    dozor:null, parcela:null, katastr:null, povoleni:null
  }));
}
function msSetDiaryMeta(patch){
  const next = Object.assign({}, msDiaryMeta(), patch);
  msSave('ms_diary_meta_v1', next);
  return next;
}
function msSeedDocuments(){
  return [];
}
function msSeedExpenses(){
  return [];
}

function msDiary(){ return msLoad(MS_KEYS.diary, msSeedDiary); }
function msDocuments(){
  const list = msLoad(MS_KEYS.documents, msSeedDocuments);
  return list.map(d=> Object.assign({}, d, { content: d.content || MS_BLOB_CACHE.get(msBlobKey('doc', d.id)) || null }));
}
async function msAddDocument(doc){
  const list = msLoad(MS_KEYS.documents, msSeedDocuments);
  const withId = Object.assign({id:msUid('doc'), date: msTodayISO()}, doc);
  const content = withId.content;
  delete withId.content;
  list.push(withId);
  const ok = msSave(MS_KEYS.documents, list);
  if(!ok) return null;
  if(content){
    MS_BLOB_CACHE.set(msBlobKey('doc', withId.id), content);
    await msIdbSet(msBlobKey('doc', withId.id), content); // pockat na dokonceni zapisu
  }
  return Object.assign({}, withId, { content: content||null });
}
function msDeleteDocument(id){
  msSave(MS_KEYS.documents, msDocuments().filter(d=>d.id!==id).map(d=>{ const c={...d}; delete c.content; return c; }));
  MS_BLOB_CACHE.delete(msBlobKey('doc', id));
  msIdbDelete(msBlobKey('doc', id));
}
function msUpdateDocument(id, patch){
  const list = msLoad(MS_KEYS.documents, msSeedDocuments);
  const idx = list.findIndex(d=>d.id===id);
  if(idx===-1) return null;
  list[idx] = Object.assign({}, list[idx], patch);
  delete list[idx].content;
  msSave(MS_KEYS.documents, list);
  return msDocuments().find(d=>d.id===id);
}
function msExpenses(){
  const list = msLoad(MS_KEYS.expenses, msSeedExpenses);
  return list.map(t=> t.hasReceipt ? Object.assign({}, t, { receipt: MS_BLOB_CACHE.get(msBlobKey('receipt', t.id)) || null }) : t);
}

/* --- pomocne funkce pro pocty a soucty podle etapy --- */
function msCountByStage(list, stageKey){ return list.filter(i=>i.stage===stageKey).length; }
function msSumExpensesByStage(stageKey){
  return msExpenses().filter(e=>e.stage===stageKey && e.type==='expense').reduce((sum,e)=>sum+Number(e.amount||0), 0);
}
function msTotalExpenses(){
  return msExpenses().filter(e=>e.type==='expense').reduce((s,e)=>s+Number(e.amount||0),0);
}
function msTotalIncome(){
  return msExpenses().filter(e=>e.type==='income').reduce((s,e)=>s+Number(e.amount||0),0);
}
function msBalance(){ return msTotalIncome() - msTotalExpenses(); }
// budouci (planovane) vydaje - nepocitaji se do skutecneho zustatku (jeste
// se nestaly), ale da se z nich spocitat, kolik by zbylo, kdyby se zaplatily
function msTotalPlanned(){
  return msExpenses().filter(e=>e.type==='planned').reduce((s,e)=>s+Number(e.amount||0),0);
}
function msBalanceAfterPlanned(){ return msBalance() - msTotalPlanned(); }
// prevede planovany vydaj na skutecny (kdyz uz je fakt zaplaceny)
function msMarkPlannedAsPaid(id, paidDateISO){
  return msUpdateTransaction(id, { type:'expense', date: paidDateISO || msTodayISO() });
}
// zaplati planovany vydaj - cely, nebo jen cast. Pri castecne platbe se
// zaplacena cast zauctuje jako skutecny vydaj a zbytek zustane planovany
// (se snizenou castkou).
function msPayPlanned(id, paidAmount){
  const list = msExpenses();
  const idx = list.findIndex(t=>t.id===id);
  if(idx===-1) return null;
  const planned = list[idx];
  const plannedAmount = Number(planned.amount||0);
  paidAmount = Number(paidAmount||0);
  if(paidAmount<=0) return null;
  if(paidAmount>=plannedAmount) return msMarkPlannedAsPaid(id);
  msAddTransaction({
    type:'expense', title: planned.title, amount: paidAmount,
    date: msTodayISO(), stage: planned.stage, category: planned.category,
  });
  return msUpdateTransaction(id, { amount: plannedAmount - paidAmount });
}
function msMonthExpenses(){
  const now = new Date();
  const ym = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  return msExpenses().filter(e=>e.type==='expense' && (e.date||'').startsWith(ym)).reduce((s,e)=>s+Number(e.amount||0),0);
}
function msAddTransaction(tx){
  const list = msExpenses();
  const withId = Object.assign({id:msUid('tx'), date: msTodayISO()}, tx);
  list.push(withId);
  msSave(MS_KEYS.expenses, list);
  return withId;
}
function msUpdateTransaction(id, patch){
  const list = msExpenses();
  const idx = list.findIndex(t=>t.id===id);
  if(idx===-1) return null;
  list[idx] = Object.assign({}, list[idx], patch);
  msSave(MS_KEYS.expenses, list);
  return list[idx];
}
function msDeleteTransaction(id){
  msSave(MS_KEYS.expenses, msExpenses().filter(t=>t.id!==id));
  MS_BLOB_CACHE.delete(msBlobKey('receipt', id));
  msIdbDelete(msBlobKey('receipt', id));
}
function msTransactionById(id){
  return msExpenses().find(t=>t.id===id);
}
// ucteka - jedna fotka pripojena primo k jednomu konkretnimu vydaji.
// Obsah jde do IndexedDB stejne jako fotky/dokumenty, v localStorage
// zustane jen priznak hasReceipt.
async function msSetTransactionReceipt(id, dataUrl){
  const list = msLoad(MS_KEYS.expenses, msSeedExpenses);
  const idx = list.findIndex(t=>t.id===id);
  if(idx===-1) return false;
  const resized = await msResizeDataUrl(dataUrl, 1400, 0.75);
  const key = msBlobKey('receipt', id);
  MS_BLOB_CACHE.set(key, resized);
  await msIdbSet(key, resized);
  list[idx] = Object.assign({}, list[idx], { hasReceipt: true });
  msSave(MS_KEYS.expenses, list);
  return true;
}
function msRemoveTransactionReceipt(id){
  const list = msLoad(MS_KEYS.expenses, msSeedExpenses);
  const idx = list.findIndex(t=>t.id===id);
  if(idx===-1) return;
  list[idx] = Object.assign({}, list[idx], { hasReceipt: false });
  msSave(MS_KEYS.expenses, list);
  MS_BLOB_CACHE.delete(msBlobKey('receipt', id));
  msIdbDelete(msBlobKey('receipt', id));
}
function msStageStats(stageKey){
  return {
    photos: msCountByStage(msPhotos(), stageKey),
    documents: msCountByStage(msDocuments(), stageKey),
    diary: msCountByStage(msDiary(), stageKey),
    expensesCount: msExpenses().filter(e=>e.stage===stageKey && e.type==='expense').length,
    spent: msSumExpensesByStage(stageKey),
    important: msCountByStage(msImportant(), stageKey),
  };
}

/* ============================================================
   AKTUÁLNÍ ETAPA V ČASE
   - ktera etapa je prave "aktualni" (jen jedna v ramci projektu)
   - pro kazdou etapu si pamatujeme MNOZINU dnu, kdy byla aktualni
     (den se pocita, i kdyz byla aktualni treba jen minutu - proto
     mnozina dat, ne casovy rozsah)
   - "Zahajeno" = nejstarsi den v teto mnozine
   - "Den etapy" = pocet dnu v teto mnozine (ne rozdil dat!)
   ============================================================ */
const MS_CURRENT_STAGE_KEY = 'ms_current_stage_v1';
const MS_ACTIVE_DAYS_KEY = 'ms_stage_active_days_v1';

function msTodayISO(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function msAddDays(n){
  const d = new Date(); d.setDate(d.getDate()+n);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function msSeedActiveDays(){
  return {};
}
function msLoadActiveDaysMap(){
  return msLoad(MS_ACTIVE_DAYS_KEY, msSeedActiveDays);
}
function msSaveActiveDaysMap(map){ msSave(MS_ACTIVE_DAYS_KEY, map); }

function msGetCurrentStage(){
  const v = msLoad(MS_CURRENT_STAGE_KEY, ()=>null);
  if(v) return v;
  const selected = msSelectedStageKeys();
  return selected.length ? selected[0] : null;
}

// pripocita dnesni den do mnoziny aktivnich dnu dane etapy (bez ohledu na
// to, kolikrat/jak kratce se to za den stane - den se pocita jen jednou)
function msRecordActiveDay(key){
  if(!key) return;
  const map = msLoadActiveDaysMap();
  const today = msTodayISO();
  if(!map[key]) map[key] = [];
  if(!map[key].includes(today)) map[key].push(today);
  msSaveActiveDaysMap(map);
}

// nastavi etapu jako aktualni a pripocita dnesni den do jeji mnoziny aktivnich dnu
function msSetCurrentStage(key){
  msSave(MS_CURRENT_STAGE_KEY, key);
  msAddSelectedStage(key);
  msRecordActiveDay(key);
}

// zavola se pri kazdem startu appky: pokud uz nejaka etapa aktualni je,
// pripocita se ji dnesni den (bez tohohle by se "Den etapy" po prvnim
// oznaceni uz nikdy nehnul - viz historie: drive se den pripsal jen v
// momente kliknuti na "nastavit jako aktualni", ne kazdy dalsi den, kdy
// etapa aktualni zustavala)
function msEnsureCurrentStageDayRecorded(){
  const key = msGetCurrentStage();
  if(key) msRecordActiveDay(key);
}

function msStageActiveDays(key){
  const map = msLoadActiveDaysMap();
  return (map[key] || []).slice().sort();
}
function msStageZahajeno(key){
  const days = msStageActiveDays(key);
  return days.length ? days[0] : null;
}
function msStageDenEtapy(key){
  return msStageActiveDays(key).length;
}
// 'aktualni' | 'probiha' | 'nezahajeno'
const MS_CLOSED_STAGES_KEY = 'ms_closed_stages_v1';
function msClosedStageKeys(){ return msLoad(MS_CLOSED_STAGES_KEY, ()=>[]); }
function msIsStageClosed(key){ return msClosedStageKeys().includes(key); }
function msSetStageClosed(key, closed){
  const keys = msClosedStageKeys();
  const has = keys.includes(key);
  if(closed && !has){ keys.push(key); if(key!=='naradi') msQueueForDiary('stage_complete', key); }
  if(!closed && has) keys.splice(keys.indexOf(key), 1);
  msSave(MS_CLOSED_STAGES_KEY, keys);
}
// 'uzavrena' ma prednost pred vsim ostatnim - je to jen status, dal se do etapy da cokoliv pridavat
function msStageStatus(key){
  if(msIsStageClosed(key)) return 'uzavrena';
  if(msGetCurrentStage() === key) return 'aktualni';
  return msStageActiveDays(key).length > 0 ? 'probiha' : 'nezahajeno';
}
function msStageStatusLabel(key){
  const s = msStageStatus(key);
  if(s==='uzavrena') return 'Dokončeno';
  if(s==='aktualni') return 'Aktuální';
  if(s==='probiha') return 'Probíhá';
  return 'Nezahájeno';
}

/* ============================================================
   NABÍDKY A DŮLEŽITÉ (zakladni model, plna obrazovka prijde pozdeji)
   ============================================================ */
function msSeedOffers(){
  return [];
}
function msSeedImportant(){
  return [];
}
function msAddImportant(item){
  const list = msImportant();
  const withId = Object.assign({id:msUid('imp'), date: msTodayISO()}, item);
  list.push(withId);
  msSave('ms_important_v1', list);
  return withId;
}

/* ============================================================
   VLASTNÍ POŘADÍ ETAP (tažením za "..." v přehledu etap)
   - aktuální etapa se pri vykresleni vzdy da navrch zvlast,
     tohle uchovava jen poradi TĚCH OSTATNÍCH
   ============================================================ */
const MS_STAGE_ORDER_KEY = 'ms_stage_order_v1';
function msStageOrder(){ return msLoad(MS_STAGE_ORDER_KEY, ()=>MS_STAGES.map(s=>s.key)); }
function msSetStageOrder(orderKeys){ msSave(MS_STAGE_ORDER_KEY, orderKeys); }
// vrati kompletni serazeny seznam klicu etap: aktualni prvni, pak zbytek podle ulozeneho poradi
function msOrderedStageKeys(){
  const selected = msSelectedStageKeys();
  if(selected.length===0) return [];
  const cur = msGetCurrentStage();
  const order = msStageOrder().filter(k => k !== cur && selected.includes(k));
  selected.forEach(k=>{ if(k!==cur && !order.includes(k)) order.push(k); });
  return selected.includes(cur) ? [cur, ...order] : order;
}
function msOffers(){ return msLoad('ms_offers_v1', msSeedOffers); }
function msImportant(){ return msLoad('ms_important_v1', msSeedImportant); }

/* --- poslednich N zaznamu dane etapy, serazeno od nejnovejsiho --- */
function msLastN(list, stageKey, n){
  return list.filter(i=>i.stage===stageKey).sort((a,b)=> (b.date||'').localeCompare(a.date||'')).slice(0,n);
}
function msLastPhotos(key,n){ return msLastN(msPhotos(), key, n); }
function msLastDiary(key,n){ return msLastN(msDiary(), key, n); }
function msLastExpenses(key,n){ return msLastN(msExpenses(), key, n); }
function msLastOffers(key,n){ return msLastN(msOffers(), key, n); }
function msLastDocuments(key,n){ return msLastN(msDocuments(), key, n); }
function msLastImportant(key,n){ return msLastN(msImportant(), key, n); }
function msPhotos(){
  const list = msLoad(MS_KEYS.photos, msSeedPhotos);
  return list.map(p=> Object.assign({}, p, { thumb: p.thumb || MS_BLOB_CACHE.get(msBlobKey('photo', p.id)) || null }));
}
async function msAddPhoto(photo){
  const list = msLoad(MS_KEYS.photos, msSeedPhotos);
  const withId = Object.assign({id:msUid('ph'), date: msTodayISO()}, photo);
  const thumb = withId.thumb;
  delete withId.thumb; // obrazek samotny jde do IndexedDB, ne do localStorage
  list.push(withId);
  const ok = msSave(MS_KEYS.photos, list);
  if(!ok) return null;
  if(thumb){
    MS_BLOB_CACHE.set(msBlobKey('photo', withId.id), thumb);
    await msIdbSet(msBlobKey('photo', withId.id), thumb); // POCKAT na dokonceni zapisu, ne fire-and-forget
  }
  return Object.assign({}, withId, { thumb: thumb||null });
}
function msUpdatePhoto(id, patch){
  const list = msLoad(MS_KEYS.photos, msSeedPhotos);
  const idx = list.findIndex(p=>p.id===id);
  if(idx===-1) return null;
  list[idx] = Object.assign({}, list[idx], patch);
  delete list[idx].thumb;
  msSave(MS_KEYS.photos, list);
  return msPhotos().find(p=>p.id===id);
}
function msDeletePhoto(id){
  msSave(MS_KEYS.photos, msLoad(MS_KEYS.photos, msSeedPhotos).filter(p=>p.id!==id));
  MS_BLOB_CACHE.delete(msBlobKey('photo', id));
  msIdbDelete(msBlobKey('photo', id));
}

/* ============================================================
   ZAKLADNI METADATA PROJEKTU (plocha pozemku, zastavena plocha, typ)
   ============================================================ */
function msProjectMeta(){
  return msLoad('ms_project_meta_v1', ()=>({landArea:null, builtArea:null, type:null}));
}
function msSetProjectMeta(patch){
  const next = Object.assign({}, msProjectMeta(), patch);
  msSave('ms_project_meta_v1', next);
  return next;
}

/* ============================================================
   OBECNÝ STROM SLOŽEK V PROJEKTU (Smlouvy, Projektová dokumentace...)
   "Dokumenty etap" se resi zvlast pres msDocuments() - tady se
   uklada jen zbytek, ktery si uzivatel sam vytvari.
   ============================================================ */
function msLoadFolderTree(){
  return msLoad('ms_folder_tree_v1', () => ([
    {name:'Smlouvy', type:'folder', children:[]},
    {name:'Projektová dokumentace', type:'folder', children:[]},
    {name:'Stavební povolení', type:'folder', children:[]},
  ]));
}
function msSaveFolderTree(children){
  msSave('ms_folder_tree_v1', children);
}

/* ============================================================
   PROJEKTY (spravovano centralne - pouziva Dashboard, Onboarding i Nastaveni)
   ============================================================ */
const MS_PROJECTS_KEY = 'ms_projects_v1';
const MS_ACTIVE_PROJECT_KEY = 'ms_active_project_v1';
const MS_ONBOARDED_KEY = 'ms_onboarded_v1';

function msDefaultProjects(){ return []; } // bez onboardingu zadny projekt neexistuje
function msLoadProjects(){
  try{
    const raw = localStorage.getItem(MS_PROJECTS_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return msDefaultProjects();
}
function msSaveProjects(list){ try{ localStorage.setItem(MS_PROJECTS_KEY, JSON.stringify(list)); }catch(e){} }
function msGetActiveProjectId(){
  try{ return localStorage.getItem(MS_ACTIVE_PROJECT_KEY) || null; }catch(e){ return null; }
}
function msSetActiveProjectId(id){ try{ localStorage.setItem(MS_ACTIVE_PROJECT_KEY, id); }catch(e){} }

function msHasOnboarded(){
  try{ return localStorage.getItem(MS_ONBOARDED_KEY) === '1'; }catch(e){ return false; }
}
function msSetOnboarded(){ try{ localStorage.setItem(MS_ONBOARDED_KEY, '1'); }catch(e){} }

// vytvori novy projekt (pouziva se pri onboardingu i pri "Pridat projekt" v Nastaveni/Dashboardu)
function msCreateProject({name, type, location}){
  const list = msLoadProjects();
  const id = msUid('p');
  const project = {
    id, name, type: type || null, location: location || '',
    started:false, startDate:null, finished:false, finishDate:null, lastMilestoneMonths:0,
    currentStage:{name:'Bez etapy', color:'#94a0bc'},
    totalExpenses:0, monthExpenses:0, balance:0, photoCount:0
  };
  list.push(project);
  msSaveProjects(list);
  msSetActiveProjectId(id);
  if(type) msSetProjectMeta({type});
  return project;
}
function msUpdateProject(id, patch){
  const list = msLoadProjects();
  const idx = list.findIndex(p=>p.id===id);
  if(idx===-1) return null;
  list[idx] = Object.assign({}, list[idx], patch);
  msSaveProjects(list);
  return list[idx];
}
function msDeleteProject(id){
  let list = msLoadProjects();
  list = list.filter(p=>p.id!==id);
  msSaveProjects(list);
  if(msGetActiveProjectId()===id){
    msSetActiveProjectId(list.length ? list[0].id : null);
  }
}
