/* ==========================================================
   DETAIL ETAPY - 6 karet s nahledem obsahu (foto, denik, vydaje,
   nabidky, dokumenty, dulezite), presne podle puvodniho HTML
   ========================================================== */
const StageDetailScreen = (function(){
  function render(container, params){
    const key = params.key || msGetCurrentStage();
    const s = msStageByKey(key);
    if(!s){ Router.go('stages'); return { showNav:false }; }

    container.innerHTML = `
      <div class="topbar" style="position:relative;text-align:center">
        <div class="back-btn" id="backBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></div>
        <div style="flex:1">
          <h1 id="stageTitle" style="margin:0;font-size:17px">${s.name}</h1>
          <div style="display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;color:${s.color};margin-top:2px;font-weight:700">
            <i style="width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 6px currentColor"></i><span id="stageStatusText"></span>
          </div>
        </div>
        <button class="menu-btn" id="menuBtn" style="width:32px;height:32px;border-radius:3px;border:1px solid var(--line);background:var(--card-bg-2);display:grid;place-items:center;color:#fff;cursor:pointer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg></button>
        <div id="stageMenu" style="position:absolute;top:52px;right:16px;z-index:30;border:1px solid var(--line);background:var(--card-bg-2);
          max-height:0;overflow:hidden;transition:max-height .18s ease;box-shadow:0 12px 30px rgba(0,0,0,.5);text-align:left">
          <div class="mi" data-c="current" style="display:flex;align-items:center;gap:9px;padding:11px 14px;font-size:12.5px;cursor:pointer;white-space:nowrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>Nastavit jako aktuální</div>
          <div class="mi" data-c="closed" style="display:flex;align-items:center;gap:9px;padding:11px 14px;font-size:12.5px;cursor:pointer;white-space:nowrap;border-top:1px solid var(--line)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="11" rx="1"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg><span id="menuClosedLabel">Uzavřít etapu</span></div>
          <div class="mi" data-c="delete" style="display:flex;align-items:center;gap:9px;padding:11px 14px;font-size:12.5px;cursor:pointer;white-space:nowrap;border-top:1px solid var(--line);color:var(--accent)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>Odstranit etapu</div>
        </div>
      </div>
      <div class="screen-scroll">
        <div style="margin:0 -16px 10px">
          <img id="stageHeroNeon" src="" alt="" class="house-neon" onerror="this.onerror=null;this.src='house.jpg'"/>
          <img id="stageHeroSketch" src="" alt="" class="house-sketch" onerror="this.onerror=null;this.src='house-sketch.jpg'"/>
        </div>
        <div style="display:flex;margin:0 -16px 10px" id="heroStats"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px" id="cardsGrid"></div>
      </div>
    `;
    container.querySelector('#stageHeroNeon').src = `stage-${key}-neon.jpg`;
    container.querySelector('#stageHeroSketch').src = `stage-${key}.jpg`;
    container.querySelector('#backBtn').addEventListener('click', ()=> Router.back());

    const menu = container.querySelector('#stageMenu');
    container.querySelector('#menuBtn').addEventListener('click', (e)=>{
      e.stopPropagation();
      menu.style.maxHeight = menu.style.maxHeight==='0px'||!menu.style.maxHeight ? '120px' : '0';
    });
    document.addEventListener('click', function outsideClose(e){
      if(!container.contains(e.target)) return;
      if(!e.target.closest('#stageMenu') && e.target.id!=='menuBtn' && !e.target.closest('#menuBtn')) menu.style.maxHeight='0';
    });
    menu.addEventListener('click', async (e)=>{
      const mi = e.target.closest('.mi'); if(!mi) return;
      menu.style.maxHeight = '0';
      if(mi.dataset.c==='current'){
        if(await Layout.confirmDialog(`Nastavit "${s.name}" jako aktuální etapu?`, 'Nastavit')){
          msSetCurrentStage(key); refresh();
        }
      } else if(mi.dataset.c==='delete'){
        const hasData = msStageHasData(key);
        const msg = hasData
          ? `Etapa "${s.name}" už má připojené výdaje, fotky, dokumenty nebo zápisy v deníku. Ty zůstanou uložené, ale nikde se k nim nedostaneš, dokud etapu znovu nezaložíš. Opravdu odstranit?`
          : `Odstranit etapu "${s.name}"? Etapa zatím nemá nic připojeného.`;
        if(await Layout.confirmDialog(msg, 'Odstranit')){
          msDeleteStage(key);
          Router.go('stages');
        }
      } else {
        const isClosed = msIsStageClosed(key);
        if(isClosed){
          if(await Layout.confirmDialog(`Znovu otevřít etapu "${s.name}"?`, 'Otevřít')){
            msSetStageClosed(key, false); refresh();
          }
        } else {
          if(await Layout.confirmDialog(`Uzavřít etapu "${s.name}"? Bude označená jako dokončená, ale dál se do ní dá cokoliv přidávat. Jde to kdykoliv vzít zpět.`, 'Uzavřít')){
            msSetStageClosed(key, true);
            refresh();
            Router.go('celebration', { title:`Etapa "${s.name}" dokončena!`, photos: msStageStats(key).photos, money: msStageStats(key).spent });
          }
        }
      }
    });

    function heroStat(label, val, accent){
      return `<div style="flex:1;text-align:center;padding:0 4px;border-right:1px solid var(--line)">
        <p style="font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:800;margin:0 0 3px">${label}</p>
        <p style="font-size:13px;font-weight:800;margin:0;color:${accent||'#fff'}">${val}</p>
      </div>`;
    }

    function card(id, color, iconSvg, title, count, bodyHtml, onClick){
      return `<div class="dcard" data-id="${id}" style="border:1px solid ${color};background:var(--card-bg-2);padding:8px;display:flex;flex-direction:column;min-height:122px;cursor:pointer;color:${color}">
        <div style="display:flex;align-items:center;gap:6px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px currentColor)">${iconSvg}</svg>
          <b style="font-size:12px;color:#fff;flex:1">${title}</b>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="3" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>
        </div>
        <p style="font-size:9px;color:var(--muted);margin:2px 0 5px">${count}</p>
        <div style="flex:1;display:flex;flex-direction:column;gap:5px;min-height:0">${bodyHtml}</div>
      </div>`;
    }

    function refresh(){
      const statusLabel = msStageStatusLabel(key);
      container.querySelector('#stageStatusText').textContent = statusLabel;
      const isCur = msGetCurrentStage()===key;
      const isClosed = msIsStageClosed(key);
      menu.querySelector('[data-c="current"]').style.display = isCur ? 'none' : 'flex';
      menu.querySelector('#menuClosedLabel').textContent = isClosed ? 'Znovu otevřít etapu' : 'Uzavřít etapu';

      const stats = msStageStats(key);
      const zahajeno = msStageZahajeno(key);
      container.querySelector('#heroStats').innerHTML =
        heroStat('Utraceno', stats.spent.toLocaleString('cs-CZ')+' Kč', s.color) +
        heroStat('Zahájeno', zahajeno ? zahajeno.slice(8,10)+'. '+zahajeno.slice(5,7)+'.' : '—') +
        heroStat('Den etapy', zahajeno ? msStageDenEtapy(key) : '—') +
        `<div style="flex:1;text-align:center;padding:0 4px"><p style="font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:800;margin:0 0 3px">Stav</p><p style="font-size:13px;font-weight:800;margin:0;color:${s.color}">${statusLabel}</p></div>`;

      const lastPhotos = msLastPhotos(key, 2);
      const photosBody = lastPhotos.length===0
        ? '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:10px">Zatím žádné fotky</div>'
        : `<div style="display:flex;gap:5px;flex:1">${lastPhotos.map(p=>`<div style="flex:1;border-radius:2px;border:1px solid var(--line);position:relative;${p.thumb?`background:url(${p.thumb}) center/cover`:'background:linear-gradient(135deg,rgba(255,255,255,.1),rgba(255,255,255,.02))'}"><span style="position:absolute;left:3px;bottom:3px;font-size:7px;color:#c7cee6;background:rgba(0,0,0,.5);padding:1px 3px">${(p.date||'').slice(8,10)}.${(p.date||'').slice(5,7)}.</span></div>`).join('')}</div>`;

      const lastDiary = msLastDiary(key, 1)[0];
      const diaryBody = `<div style="flex:1;border:1px solid var(--line);background:rgba(255,255,255,.02);padding:7px;font-size:10.5px;line-height:1.35;color:#dfe4f5;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden">${lastDiary ? lastDiary.text : 'Zatím žádné zápisy'}</div>`;

      const lastExpense = msLastExpenses(key, 1)[0];
      const expBody = `<div style="flex:1;border:1px solid var(--line);background:rgba(255,255,255,.02);padding:8px;display:flex;flex-direction:column;justify-content:center;position:relative">
        <span style="font-size:10px;color:#cfd4ea">${lastExpense ? lastExpense.title : 'Zatím žádné výdaje'}</span>
        ${lastExpense ? `<b style="font-size:14px;color:#ff6a6a;margin-top:3px">-${lastExpense.amount.toLocaleString('cs-CZ')} Kč</b>` : ''}
      </div>`;

      const offers = msLastOffers(key, 99);
      const offersBody = `<div style="flex:1;border:1px solid var(--line);background:rgba(255,255,255,.02);padding:8px;display:flex;flex-direction:column;justify-content:center;gap:5px">
        <span style="font-size:10px;color:#dfe4f5;line-height:1.3">${offers[0] ? offers[0].title : 'Zatím žádné nabídky'}</span>
      </div>`;

      const lastDocs = msLastDocuments(key, 3);
      const docsBody = lastDocs.length
        ? `<div style="flex:1;display:flex;flex-direction:column;gap:4px;justify-content:center">${lastDocs.map(d=>`<div style="display:flex;align-items:center;gap:6px"><span style="width:20px;height:14px;border-radius:2px;background:${s.color};color:#04060c;font-size:6.5px;font-weight:900;display:grid;place-items:center;flex:0 0 auto">PDF</span><span style="font-size:9.5px;color:#dfe4f5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.name}</span></div>`).join('')}</div>`
        : '<div style="flex:1;display:flex;align-items:center;justify-content:center"><span style="color:var(--muted);font-size:10px">Zatím žádné dokumenty</span></div>';

      const lastImportant = msLastImportant(key, 3);
      const impBody = lastImportant.length
        ? `<div style="flex:1;display:flex;flex-direction:column;gap:4px;justify-content:center">${lastImportant.map(i=>`<div style="display:flex;align-items:center;gap:6px"><span style="width:5px;height:5px;border-radius:50%;background:${s.color};flex:0 0 auto"></span><span style="font-size:9.5px;color:#dfe4f5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.title}</span></div>`).join('')}</div>`
        : '<div style="flex:1;display:flex;align-items:center;justify-content:center"><span style="color:var(--muted);font-size:10px">Zatím nic důležitého</span></div>';

      container.querySelector('#cardsGrid').innerHTML =
        card('photos', '#b34cff', '<rect x="3" y="6" width="18" height="14" rx="1"/><circle cx="12" cy="13" r="3.5"/>', 'Fotografie', stats.photos+' fotografií', photosBody) +
        (key==='naradi' ? '' : card('diary', '#ffd35c', '<path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6"/>', 'Deník', stats.diary+' zápisů', diaryBody)) +
        card('expenses', '#4dffab', '<path d="M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M16 12h4"/>', 'Výdaje', stats.expensesCount+' výdajů', expBody) +
        card('offers', '#ff9b32', '<path d="M20.5 12.5L12 21l-9-9V4h8z"/><circle cx="7.5" cy="7.5" r="1.2"/>', 'Nabídky', offers.length+' nabídek', offersBody) +
        card('docs', '#25b7ff', '<path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6"/>', 'Dokumenty', stats.documents+' dokumentů', docsBody) +
        card('important', '#25e8ff', '<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>', 'Důležité', stats.important+' položky', impBody);

      container.querySelectorAll('.dcard').forEach(el=>{
        el.addEventListener('click', ()=>{
          const id = el.dataset.id;
          if(id==='photos') Router.go('gallery', {stage:key});
          else if(id==='diary') Router.go('diary', {stage:key});
          else if(id==='expenses') Router.go('stage-expenses', {stage:key});
          else if(id==='offers') Router.go('offers', {stage:key});
          else if(id==='docs') Router.go('project', {stage:key});
          else if(id==='important') Router.go('important', {stage:key});
        });
      });
    }

    refresh();
    return { activeTab:'stages' };
  }
  return { render };
})();
Router.register('stage-detail', StageDetailScreen);
