/* ==========================================================
   DENIK
   ========================================================== */
const DiaryScreen = (function(){
  const MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];

  function render(container, params){
    let activeStage = params.stage || 'all';
    let dateMode = null; // null | 'day' | 'range'
    let selectedDay = null, rangeStart = null, rangeEnd = null;
    let mcMode = 'day', rangePickStep = 'start';
    const today = new Date();
    let mcYear = today.getFullYear(), mcMonth = today.getMonth();

    function formatDateCz(iso){
      const d = new Date(iso+'T00:00:00');
      return d.getDate()+'. '+(d.getMonth()+1)+'. '+d.getFullYear();
    }

    container.innerHTML = `
      <div class="topbar">
        <h1>Deník</h1>
        <div style="flex:1"></div>
        <div class="icon-btn" id="calBtn" title="Filtrovat podle data"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M8 3v4M16 3v4M3 10h18"/></svg></div>
        <div class="icon-btn" id="queueBtn" title="K zápisu" style="position:relative"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></svg><span id="queueBadge" style="display:none;position:absolute;top:-4px;right:-4px;background:var(--accent);color:var(--card-bg);font-size:8px;font-weight:800;min-width:14px;height:14px;border-radius:7px;align-items:center;justify-content:center"></span></div>
        <div class="icon-btn" id="genBtn" title="Vygenerovat deník"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 3h9l3 3v15H6z"/><path d="M9 17l2-2 2 2 2-4"/></svg></div>
        <div class="icon-btn" id="addBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div>
      </div>
      <div class="screen-scroll">
        <div class="dropdown" id="stageDropdown" style="margin-bottom:10px">
          <button class="dd-btn" id="ddBtn"><span class="left"><i id="ddDot"></i><span id="ddLabel">Etapa: Vše</span></span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg></button>
          <div class="dd-panel" id="ddPanel"></div>
        </div>

        <div id="miniCalWrap" style="max-height:0;overflow:hidden;transition:max-height .2s ease">
          <div style="border:1px solid var(--line);background:var(--card-bg-2);border-radius:var(--radius);padding:10px;margin-bottom:8px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
              <button id="mcModeDay" style="height:30px;border:1px solid #b34cff;background:rgba(179,76,255,.1);color:#fff;font-size:11px;font-weight:800;cursor:pointer;border-radius:3px">Jeden den</button>
              <button id="mcModeRange" style="height:30px;border:1px solid var(--line);background:transparent;color:var(--muted);font-size:11px;font-weight:800;cursor:pointer;border-radius:3px">Období (od–do)</button>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <b id="mcLabel" style="font-size:12px"></b>
              <div style="display:flex;gap:6px">
                <button id="mcPrev" style="width:24px;height:24px;border:1px solid var(--line);background:transparent;color:#fff;cursor:pointer">‹</button>
                <button id="mcNext" style="width:24px;height:24px;border:1px solid var(--line);background:transparent;color:#fff;cursor:pointer">›</button>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:4px">
              ${['Po','Út','St','Čt','Pá','So','Ne'].map(d=>`<span style="text-align:center;font-size:8.5px;color:var(--muted);font-weight:800">${d}</span>`).join('')}
            </div>
            <div id="mcGrid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px"></div>
            <p id="mcClear" style="text-align:center;font-size:10.5px;color:#ff7a86;margin:8px 0 0;cursor:pointer">Zrušit výběr data</p>
          </div>
        </div>
        <div id="dateChip" style="display:none;align-items:center;gap:6px;font-size:10.5px;color:#b34cff;border:1px solid #b34cff;border-radius:3px;padding:4px 8px;margin-bottom:8px;width:fit-content"></div>

        <div id="entries"></div>
      </div>
    `;
    container.querySelector('#genBtn').addEventListener('click', ()=> Router.go('diary-export', {stage: activeStage}));
    container.querySelector('#addBtn').addEventListener('click', ()=> Router.go('diary-add'));
    container.querySelector('#queueBtn').addEventListener('click', ()=> Router.go('diary-queue'));
    const qCount = msDiaryQueue().length;
    if(qCount>0){
      const badge = container.querySelector('#queueBadge');
      badge.style.display = 'flex';
      badge.textContent = qCount>9 ? '9+' : String(qCount);
    }

    const ddBtn = container.querySelector('#ddBtn');
    const ddPanel = container.querySelector('#ddPanel');
    function buildDropdown(){
      ddPanel.innerHTML = '';
      const allItem = document.createElement('div');
      allItem.className = 'dd-item' + (activeStage==='all'?' is-active':'');
      allItem.innerHTML = '<i style="background:#fff;display:inline-block;width:8px;height:8px;margin-right:7px"></i>Vše';
      allItem.addEventListener('click', ()=>{ activeStage='all'; ddLabelUpdate(); ddPanel.classList.remove('open'); drawEntries(); });
      ddPanel.appendChild(allItem);
      msSelectedStages().filter(s=>s.key!=='naradi').forEach(s=>{
        const it = document.createElement('div');
        it.className = 'dd-item' + (activeStage===s.key?' is-active':'');
        it.style.color = s.color;
        it.innerHTML = `<i style="background:${s.color};display:inline-block;width:8px;height:8px;margin-right:7px"></i>${s.name}`;
        it.addEventListener('click', ()=>{ activeStage=s.key; ddLabelUpdate(); ddPanel.classList.remove('open'); drawEntries(); });
        ddPanel.appendChild(it);
      });
    }
    function ddLabelUpdate(){
      const s = msStageByKey(activeStage);
      container.querySelector('#ddLabel').textContent = 'Etapa: ' + (s?s.name:'Vše');
    }
    ddBtn.addEventListener('click', ()=> ddPanel.classList.toggle('open'));
    buildDropdown(); ddLabelUpdate();

    // --- kalendarni filtr: jeden den / obdobi ---
    const miniCalWrap = container.querySelector('#miniCalWrap');
    const dateChip = container.querySelector('#dateChip');
    container.querySelector('#calBtn').addEventListener('click', ()=>{
      const isOpen = miniCalWrap.style.maxHeight !== '0px' && miniCalWrap.style.maxHeight !== '';
      miniCalWrap.style.maxHeight = isOpen ? '0' : '360px';
      if(!isOpen) renderMiniCal();
    });
    function updateDateChip(){
      if(dateMode==='day' && selectedDay){
        dateChip.style.display = 'flex';
        dateChip.innerHTML = `${formatDateCz(selectedDay)} <span id="chipClear" style="cursor:pointer">✕</span>`;
      } else if(dateMode==='range' && rangeStart && rangeEnd){
        dateChip.style.display = 'flex';
        dateChip.innerHTML = `${formatDateCz(rangeStart)} – ${formatDateCz(rangeEnd)} <span id="chipClear" style="cursor:pointer">✕</span>`;
      } else {
        dateChip.style.display = 'none'; dateChip.innerHTML = '';
      }
      const clr = container.querySelector('#chipClear');
      if(clr) clr.addEventListener('click', clearDateFilter);
    }
    function clearDateFilter(){
      dateMode = null; selectedDay = null; rangeStart = null; rangeEnd = null;
      updateDateChip(); renderMiniCal(); drawEntries();
    }
    container.querySelector('#mcClear').addEventListener('click', clearDateFilter);
    function renderMiniCal(){
      container.querySelector('#mcLabel').textContent = MONTHS[mcMonth] + ' ' + mcYear;
      const grid = container.querySelector('#mcGrid');
      grid.innerHTML = '';
      const firstDay = new Date(mcYear, mcMonth, 1);
      let startWeekday = firstDay.getDay(); startWeekday = startWeekday===0?6:startWeekday-1;
      const daysInMonth = new Date(mcYear, mcMonth+1, 0).getDate();
      for(let i=0;i<startWeekday;i++) grid.appendChild(document.createElement('div'));
      for(let d=1; d<=daysInMonth; d++){
        const iso = mcYear+'-'+String(mcMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        const cell = document.createElement('div');
        let bg = 'transparent', color = '#c7cee6';
        if(mcMode==='day' && iso===selectedDay){ bg='#b34cff'; color='#fff'; }
        if(mcMode==='range' && rangeStart && rangeEnd && iso>=rangeStart && iso<=rangeEnd){ bg='rgba(179,76,255,.25)'; }
        if(mcMode==='range' && (iso===rangeStart || iso===rangeEnd)){ bg='#b34cff'; color='#fff'; }
        cell.style.cssText = `height:26px;display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;background:${bg};color:${color};border-radius:3px`;
        cell.textContent = d;
        cell.addEventListener('click', ()=>{
          if(mcMode==='day'){
            selectedDay = iso; dateMode = 'day'; rangeStart=null; rangeEnd=null;
          } else {
            if(rangePickStep==='start' || (rangeStart && iso<rangeStart)){
              rangeStart = iso; rangeEnd = null; rangePickStep = 'end';
            } else {
              rangeEnd = iso; dateMode = 'range'; rangePickStep = 'start';
            }
          }
          renderMiniCal(); updateDateChip(); drawEntries();
        });
        grid.appendChild(cell);
      }
    }
    container.querySelector('#mcModeDay').addEventListener('click', ()=>{
      mcMode = 'day';
      const dayBtn = container.querySelector('#mcModeDay'), rangeBtn = container.querySelector('#mcModeRange');
      dayBtn.style.borderColor = '#b34cff'; dayBtn.style.background='rgba(179,76,255,.1)'; dayBtn.style.color='#fff';
      rangeBtn.style.borderColor = 'var(--line)'; rangeBtn.style.background='transparent'; rangeBtn.style.color='var(--muted)';
    });
    container.querySelector('#mcModeRange').addEventListener('click', ()=>{
      mcMode = 'range'; rangePickStep = 'start';
      const dayBtn = container.querySelector('#mcModeDay'), rangeBtn = container.querySelector('#mcModeRange');
      rangeBtn.style.borderColor = '#b34cff'; rangeBtn.style.background='rgba(179,76,255,.1)'; rangeBtn.style.color='#fff';
      dayBtn.style.borderColor = 'var(--line)'; dayBtn.style.background='transparent'; dayBtn.style.color='var(--muted)';
    });
    container.querySelector('#mcPrev').addEventListener('click', ()=>{ mcMonth--; if(mcMonth<0){mcMonth=11;mcYear--;} renderMiniCal(); });
    container.querySelector('#mcNext').addEventListener('click', ()=>{ mcMonth++; if(mcMonth>11){mcMonth=0;mcYear++;} renderMiniCal(); });

    function drawEntries(){
      const wrap = container.querySelector('#entries');
      let entries = msDiaryNumbered().filter(e => activeStage==='all' || e.stage===activeStage);
      if(dateMode==='day' && selectedDay){ entries = entries.filter(e=>e.date===selectedDay); }
      else if(dateMode==='range' && rangeStart && rangeEnd){ entries = entries.filter(e=>e.date>=rangeStart && e.date<=rangeEnd); }
      if(entries.length===0){ wrap.innerHTML = '<p class="empty-msg">Žádné zápisy neodpovídají filtru.</p>'; return; }
      const important = entries.filter(e=>e.important).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
      const rest = entries.filter(e=>!e.important).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
      const ordered = [...important, ...rest];
      wrap.innerHTML = ordered.map(e=>{
        const s = msStageByKey(e.stage);
        const metaBits = [];
        if(e.worker) metaBits.push(`Kdo pracoval: ${e.worker}`);
        if(e.material) metaBits.push(`Materiál: ${e.material}`);
        const docItems = (e.items||[]).filter(it=>it.type==='document').map(it=> msDocuments().find(d=>d.id===it.refId)).filter(Boolean);
        const eventItems = (e.items||[]).filter(it=>it.type==='event').map(it=> msEvents().find(ev=>ev.id===it.refId)).filter(Boolean);
        const stageCompleteItems = (e.items||[]).filter(it=>it.type==='stage_complete');
        return `<div style="border-left:2px solid ${s?s.color:'#94a0bc'};padding:8px 0 8px 12px;margin-bottom:10px;${e.important?'background:rgba(255,211,92,.05)':''}">
          <div style="display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--muted);margin-bottom:3px">
            <span style="border:1px solid var(--line);padding:1px 5px;font-size:9px">č. ${e.number}</span>
            <b style="color:#fff">${s?s.name:''}</b>${e.important?' ⭐':''}
            <span>${e.date} ${e.time||''}</span>
          </div>
          ${e.title ? `<p style="margin:0 0 3px;font-weight:800;font-size:12.5px">${e.title}</p>` : ''}
          ${e.text ? `<p style="margin:0 0 4px;font-size:12px;color:#dfe4f5">${e.text}</p>` : ''}
          ${e.issue ? `<p style="margin:0 0 4px;font-size:11px;color:#ff9b32">Poznámka: ${e.issue}</p>` : ''}
          ${metaBits.length ? `<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:10px;color:var(--muted);margin-top:2px">${metaBits.map(m=>`<span>${m}</span>`).join('')}</div>` : ''}
          ${e.photos && e.photos.length ? `<div style="display:flex;gap:5px;margin-top:6px;flex-wrap:wrap">${e.photos.map(p=>`<div style="width:44px;height:44px;border-radius:3px;border:1px solid var(--line);background:${p?`url(${p}) center/cover`:'rgba(255,255,255,.05)'}"></div>`).join('')}</div>` : ''}
          ${(docItems.length || eventItems.length || stageCompleteItems.length) ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
            ${docItems.map(d=>`<span style="border:1px solid var(--line);padding:2px 7px;font-size:9.5px;color:var(--muted)">📎 ${d.name}</span>`).join('')}
            ${eventItems.map(ev=>`<span style="border:1px solid var(--line);padding:2px 7px;font-size:9.5px;color:var(--muted)">${ev.title}</span>`).join('')}
            ${stageCompleteItems.length ? `<span style="border:1px solid var(--accent);color:var(--accent);padding:2px 7px;font-size:9.5px">Etapa dokončena</span>` : ''}
          </div>` : ''}
        </div>`;
      }).join('');
    }
    drawEntries();

    return { activeTab:'diary' };
  }
  return { render };
})();
Router.register('diary', DiaryScreen);

/* ==========================================================
   K ZAPISU - sprava fronty pripravenych veci mimo samotne
   vytvareni zapisu. Odsud jde neco natrvalo odebrat, aniz by
   se to muselo resit primo ve formulari na novy zapis (tam uz
   klepnuti jen prepina, jestli se to ma zahrnout DO tohoto
   zapisu, ne jestli to ma zmizet navzdy).
   ========================================================== */
const DiaryQueueScreen = (function(){
  const ICONS = {
    photo: '<rect x="3" y="6" width="18" height="14" rx="1"/><circle cx="12" cy="13" r="3.5"/>',
    document: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6"/>',
    event: '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    stage_complete: '<path d="M5 13l4 4L19 7"/>',
  };
  const TYPE_LABEL = { photo:'Fotka', document:'Dokument', event:'Událost', stage_complete:'Dokončená etapa' };

  function render(container){
    function draw(){
      const items = msDiaryQueueResolved();
      container.innerHTML = `
        <div class="topbar">
          <div class="back-btn" id="backBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></div>
          <h1>K zápisu</h1>
        </div>
        <div class="screen-scroll">
          <p style="font-size:11px;color:var(--muted);margin:0 0 16px;line-height:1.5">Tady spravuješ, co čeká na příští zápis do deníku. Zápis samotný se dělá v Deníku – tady jen odebíráš věci, co už nechceš.</p>
          <div id="qList"></div>
        </div>
      `;
      container.querySelector('#backBtn').addEventListener('click', ()=> Router.go('diary'));
      const list = container.querySelector('#qList');
      if(items.length===0){
        list.innerHTML = '<p class="empty-msg">Zatím nic nečeká na zápis.</p>';
        return;
      }
      list.innerHTML = items.map((it,i)=>`
        <div style="display:flex;align-items:center;gap:10px;border:1px solid var(--line);padding:9px;margin-bottom:7px">
          <div style="width:38px;height:38px;flex:0 0 auto;border:1px solid var(--line);border-radius:3px;display:grid;place-items:center;overflow:hidden;${it.preview?`background-image:url(${it.preview});background-size:cover`:''}">
            ${it.preview ? '' : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[it.type]||ICONS.document}</svg>`}
          </div>
          <div style="flex:1;min-width:0">
            <b style="display:block;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.label}</b>
            <span style="font-size:10px;color:var(--muted)">${TYPE_LABEL[it.type]||''}${it.stage && msStageByKey(it.stage) ? ' · '+msStageByKey(it.stage).name : ''}</span>
          </div>
          <div class="q-remove" data-i="${i}" style="width:28px;height:28px;flex:0 0 auto;border:1px solid var(--line);display:grid;place-items:center;cursor:pointer;color:var(--muted)">✕</div>
        </div>
      `).join('');
      list.querySelectorAll('.q-remove').forEach(el=>{
        el.addEventListener('click', ()=>{
          const it = items[Number(el.dataset.i)];
          msUnqueueFromDiary(it.type, it.refId);
          draw();
        });
      });
    }
    draw();
    return { activeTab:'diary' };
  }
  return { render };
})();
Router.register('diary-queue', DiaryQueueScreen);
