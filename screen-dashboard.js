/* ==========================================================
   DASHBOARD (Domu)
   ========================================================== */
const DashboardScreen = (function(){

  function todayISO(){
    const d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function formatToday(){
    const days = ['Neděle','Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota'];
    const months = ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];
    const d = new Date();
    return days[d.getDay()] + ', ' + d.getDate() + '. ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }
  function formatDateCz(iso){
    const d = new Date(iso+'T00:00:00');
    return d.getDate()+'. '+(d.getMonth()+1)+'. '+d.getFullYear();
  }
  function dayCount(startISO){ return msDayCount(startISO); }
  function monthsBetween(startISO, todayD){
    const s = new Date(startISO+'T00:00:00');
    return (todayD.getFullYear()-s.getFullYear())*12 + (todayD.getMonth()-s.getMonth());
  }
  function jubileeLabel(months){
    if(months<=0) return null;
    if(months % 12 === 0) return (months/12) + (months/12===1 ? ' rok' : (months/12<5 ? ' roky' : ' let'));
    return months + (months===1?' měsíc':(months<5?' měsíce':' měsíců'));
  }

  function render(container){
    const projects = msLoadProjects();
    const activeId = msGetActiveProjectId();
    let p = projects.find(x=>x.id===activeId) || projects[0];

    container.innerHTML = `
      <div class="topbar">
        <div class="dropdown" id="projDropdown" style="flex:1">
          <button class="dd-btn" id="projBtn" style="border:0;background:none;padding:0;justify-content:flex-start;gap:6px">
            <span style="text-align:left">
              <b style="display:block;font-size:16px">${p ? p.name : 'Projekt'}</b>
              <span style="display:block;font-size:10.5px;color:var(--muted);font-weight:600">${p ? p.location : ''}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="dd-panel" id="projPanel"></div>
        </div>
        <div class="top-actions">
          <div class="icon-btn" id="searchBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div>
          <div class="icon-btn" id="settingsBtn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09c0 .68.39 1.28 1 1.51.66.26 1.42.12 1.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06c-.45.4-.59 1.16-.33 1.82.23.61.83 1 1.51 1H21a2 2 0 010 4h-.09c-.68 0-1.28.39-1.51 1z"/></svg></div>
        </div>
      </div>

      <div id="searchWrap"></div>

      <div class="screen-scroll" style="padding-top:0;font-size:13px">
        <div style="position:relative;margin:8px -16px 6px">
          <img id="heroImgNeon" src="house.jpg" alt="Rodinný dům" class="house-neon" style="display:block" onerror="this.onerror=null;this.src='house.jpg'"/>
          <img id="heroImgSketch" src="house-sketch.jpg" alt="Rodinný dům" class="house-sketch" style="display:none" onerror="this.onerror=null;this.src='house-sketch.jpg'"/>
          <div class="hero-gradient" style="position:absolute;inset:0;background:linear-gradient(rgba(2,4,10,.55),rgba(2,4,10,0) 60%)"></div>
          <div id="heroText" style="position:absolute;left:0;top:0;padding:9px 16px 0"></div>
        </div>

        <div id="stageCardWrap"></div>
        <div id="dailyReminderWrap"></div>
        <div id="diaryReminderWrap"></div>
        <div id="moneyCardWrap"></div>
        <div class="tiles-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div id="galleryTileWrap"></div>
          <div id="eventTileWrap"></div>
        </div>
      </div>
    `;

    if(!p){
      // bez projektu appka neni k cemu - poslat na onboarding
      Router.go('onboarding');
      return { activeTab:'dashboard', showNav:false };
    }

    renderHero(p);
    renderHeroImage();
    renderStageCard();
    renderDailyReminder();
    renderDiaryReminder(p);
    renderMoneyCard();
    renderTiles();
    renderProjectSwitcher(p, projects, activeId);
    wireTopActions(p);
    checkJubilee(p);

    return { activeTab:'dashboard', showNav:true };

    // ---------- podfunkce ----------

    function renderDiaryReminder(p){
      const wrap = container.querySelector('#diaryReminderWrap');
      // denik pocitame az od zahajeni stavby - pred tim hlaska nedava smysl
      if(!p.started || !p.startDate){ wrap.innerHTML = ''; return; }
      const last = msLastDiaryEntryDate();
      const sinceISO = last || p.startDate;
      const daysSince = Math.floor((new Date(todayISO()+'T00:00:00') - new Date(sinceISO+'T00:00:00')) / 86400000);
      const queue = msDiaryQueueResolved();
      if(daysSince < 7 || queue.length === 0){ wrap.innerHTML = ''; return; }
      const shown = queue.slice(0,6);
      const extra = queue.length - shown.length;
      wrap.innerHTML = `
        <div id="diaryReminderCard" style="border:1px solid var(--accent);background:var(--card-bg-2);padding:10px 12px;margin-top:8px;cursor:pointer">
          <b style="font-size:11.5px;display:block;margin-bottom:7px">Už ${daysSince} dní jsme nezapsali do deníku – máme připravený tento materiál</b>
          <div style="display:flex;gap:5px;align-items:center">
            ${shown.map(it=> it.preview
              ? `<div style="width:26px;height:26px;border-radius:50%;background-image:url(${it.preview});background-size:cover;border:1px solid var(--accent);flex:0 0 auto"></div>`
              : `<div style="width:26px;height:26px;border-radius:50%;background:var(--card-bg);border:1px solid var(--accent);flex:0 0 auto;display:grid;place-items:center;color:var(--accent);font-size:10px">•</div>`
            ).join('')}
            ${extra>0 ? `<span style="font-size:10.5px;color:var(--muted);font-weight:800">+${extra}</span>` : ''}
          </div>
        </div>`;
      wrap.querySelector('#diaryReminderCard').addEventListener('click', ()=> Router.go('diary-add'));
    }

    function persistProject(patch){
      const list = msLoadProjects();
      const idx = list.findIndex(x=>x.id===p.id);
      if(idx!==-1){ list[idx] = Object.assign({}, list[idx], patch); msSaveProjects(list); p = list[idx]; }
    }

    function renderHero(p){
      const wrap = container.querySelector('#heroText');
      const sh = 'text-shadow:var(--hero-text-shadow)';
      if(p.finished){
        wrap.innerHTML = `<p style="margin:0;color:var(--hero-text);font-size:9px;text-transform:uppercase;letter-spacing:.1em;font-weight:800;${sh}">Stavba dokončena</p><strong style="display:block;font-size:28px;color:var(--hero-text-strong);${sh}">${dayCount(p.startDate)}</strong><small style="color:var(--hero-text);${sh}">zkolaudováno ${formatDateCz(p.finishDate)}</small>`;
      } else if(p.started){
        wrap.innerHTML = `<p style="margin:0;color:var(--hero-text);font-size:9px;text-transform:uppercase;letter-spacing:.1em;font-weight:800;${sh}">Den stavby</p><strong style="display:block;font-size:28px;color:var(--hero-text-strong);${sh}">${dayCount(p.startDate)}</strong>
          <span style="display:block;color:var(--hero-text);font-size:10.5px;margin-top:1px;${sh}">${formatToday()}</span>
          <button id="finishLink" class="finish-btn" style="margin-top:5px;font-size:10px;font-weight:800;color:#4dffab;background:var(--card-bg-2);border:1px solid #4dffab;padding:4px 9px;border-radius:3px;cursor:pointer;${sh}">Zkolaudovat stavbu</button>`;
        wrap.querySelector('#finishLink').addEventListener('click', async ()=>{
          if(!await Layout.confirmDialog('Zkolaudovat stavbu? Den stavby se zastaví na dnešním dni.', 'Zkolaudovat')) return;
          persistProject({ finished:true, finishDate: todayISO() });
          Router.go('celebration', { type:'done', title:'Stavba zkolaudována!', photos: msPhotos().length, money: msTotalExpenses() });
        });
      } else {
        wrap.innerHTML = `<p style="margin:0;color:var(--hero-text);font-size:9px;text-transform:uppercase;letter-spacing:.1em;font-weight:800;${sh}">${formatToday()}</p><button class="btn-primary" id="startBtn" style="margin-top:7px;width:auto;padding:9px 16px;display:inline-block;font-size:12px">Zahájit stavbu</button>`;
        wrap.querySelector('#startBtn').addEventListener('click', async ()=>{
          if(!await Layout.confirmDialog('Zahájit stavbu dnešním dnem?', 'Zahájit')) return;
          persistProject({ started:true, startDate: todayISO(), finished:false });
          renderHero(p);
        });
      }
    }

    function renderHeroImage(){
      const cur = msStageByKey(msGetCurrentStage());
      const key = cur ? cur.key : null;
      const neonImg = container.querySelector('#heroImgNeon');
      const sketchImg = container.querySelector('#heroImgSketch');
      // Konvence nazvu souboru: stage-{key}.jpg (Skica), stage-{key}-neon.jpg (Neon).
      // Pokud soubor pro danou etapu jeste neexistuje, onerror na <img> spadne
      // zpet na vychozi house.jpg / house-sketch.jpg - takze je bezpecne pridavat
      // obrazky postupne, jeden po druhem, bez rizika rozbiti dashboardu.
      neonImg.src = key ? `stage-${key}-neon.jpg` : 'house.jpg';
      sketchImg.src = key ? `stage-${key}.jpg` : 'house-sketch.jpg';
    }

    function renderStageCard(){
      const wrap = container.querySelector('#stageCardWrap');
      const cur = msStageByKey(msGetCurrentStage());
      const color = cur ? cur.color : '#94a0bc';
      wrap.innerHTML = `
        <div class="stage-card" id="stageCard" style="--stage-color:${color};border:1px solid color-mix(in srgb, ${color} 55%, transparent);
          background:var(--card-bg);border-radius:var(--radius);padding:10px;margin-top:9px;cursor:pointer;
          box-shadow:0 0 14px color-mix(in srgb, ${color} 18%, transparent)">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:44px;height:44px;border-radius:var(--radius);flex:0 0 44px;display:grid;place-items:center;color:${color};
              background:color-mix(in srgb, ${color} 8%, transparent);border:1px solid color-mix(in srgb, ${color} 55%, transparent)">
              ${msStageIconSvg(cur ? cur.key : null, 26)}
            </div>
            <div style="flex:1;min-width:0">
              <p style="margin:0 0 2px;color:#aeb7d6;text-transform:uppercase;letter-spacing:.1em;font-size:8.5px;font-weight:800">Aktuální etapa</p>
              <h2 style="margin:0 0 2px;font-size:14.5px">${cur ? cur.name : 'Zatím žádná etapa'}</h2>
              <p class="stage-status-line" style="display:flex;align-items:center;gap:5px;font-size:10.5px;color:#d8b8ff;margin:0"><i style="width:5px;height:5px;border-radius:50%;background:${color};display:inline-block;box-shadow:0 0 6px ${color}"></i>${cur ? msStageStatusLabel(cur.key) : 'Nevybráno'}</p>
            </div>
          </div>
          <button id="openStageBtn" style="width:100%;margin-top:8px;border:1px solid color-mix(in srgb, ${color} 55%, transparent);
            background:rgba(255,255,255,.02);color:#fff;font-weight:800;font-size:11.5px;padding:7px;cursor:pointer;border-radius:3px">Otevřít etapu →</button>
        </div>`;
      wrap.querySelector('#stageCard').addEventListener('click', (e)=>{
        if(e.target.closest('#openStageBtn')) return;
        Router.go(cur ? 'stage-detail' : 'stages', cur ? {key:cur.key} : {});
      });
      wrap.querySelector('#openStageBtn').addEventListener('click', ()=>{
        Router.go(cur ? 'stage-detail' : 'stages', cur ? {key:cur.key} : {});
      });
    }

    function renderMoneyCard(){
      const wrap = container.querySelector('#moneyCardWrap');
      const now = new Date();
      const ym = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
      const monthExp = msExpenses().filter(e=>e.type==='expense' && (e.date||'').startsWith(ym)).reduce((s,e)=>s+Number(e.amount||0),0);
      const planned = msTotalPlanned();
      wrap.innerHTML = `
        <div style="border:1px solid var(--line);background:var(--card-bg);border-radius:var(--radius);padding:10px;margin-top:8px;cursor:pointer" id="moneyCard">
          <div style="display:flex;align-items:center;gap:5px;color:#4dffab;text-transform:uppercase;font-size:8.5px;font-weight:800;letter-spacing:.09em">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/></svg>
            Zůstatek účtu
          </div>
          <div style="font-size:22px;font-weight:800;color:#4dffab;margin:3px 0 6px">${msBalance().toLocaleString('cs-CZ')} Kč</div>
          <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--muted)"><span>Výdaje celkem</span><b style="color:#dfe4f5">${msTotalExpenses().toLocaleString('cs-CZ')} Kč</b></div>
          <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--muted);margin-top:2px"><span>Tento měsíc</span><b style="color:#dfe4f5">${monthExp.toLocaleString('cs-CZ')} Kč</b></div>
          ${planned>0 ? `<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#ff9b32;margin-top:2px;border-top:1px solid var(--line);padding-top:5px"><span>Po budoucích výdajích (${planned.toLocaleString('cs-CZ')} Kč)</span><b>${msBalanceAfterPlanned().toLocaleString('cs-CZ')} Kč</b></div>` : ''}
        </div>`;
      wrap.querySelector('#moneyCard').addEventListener('click', ()=> Router.go('finance'));
    }

    function renderTiles(){
      const gWrap = container.querySelector('#galleryTileWrap');
      const lastPhotos = [...msPhotos()].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,2);
      const thumbsHtml = lastPhotos.length
        ? `<div style="display:flex;gap:5px;margin-top:6px;height:44px">${lastPhotos.map(p=>{
            const bg = p.thumb ? `background-image:url(${p.thumb});background-size:cover;background-position:center` : `background:rgba(179,76,255,.12)`;
            return `<div style="flex:1;height:44px;border-radius:3px;border:1px solid var(--line);${bg}"></div>`;
          }).join('')}</div>`
        : `<div style="flex:1;display:flex;align-items:center;justify-content:center"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="color:var(--muted);opacity:.4"><rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="11" r="2"/></svg></div>`;
      gWrap.innerHTML = `
        <div style="border:1px solid var(--line);background:var(--card-bg);border-radius:var(--radius);padding:12px;cursor:pointer;height:100%;min-height:118px;display:flex;flex-direction:column" id="galleryTile">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <b style="font-size:13px;color:#fff">Galerie</b>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--muted)"><rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="11" r="2"/></svg>
          </div>
          ${thumbsHtml}
          <p style="margin:6px 0 0;font-size:10px;color:var(--muted)">${msPhotos().length} fotek</p>
        </div>`;
      gWrap.querySelector('#galleryTile').addEventListener('click', ()=> Router.go('gallery'));

      const eWrap = container.querySelector('#eventTileWrap');
      const events = msEvents();
      const today = todayISO();
      const next = events.filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date))[0];
      const evDateLabel = next ? formatDateCz(next.date) + (next.time ? ' · '+next.time : ' · celý den') : '';
      eWrap.innerHTML = `
        <div style="border:1px solid var(--line);background:var(--card-bg);border-radius:var(--radius);padding:12px;cursor:pointer;height:100%;min-height:118px;display:flex;flex-direction:column" id="eventTile">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <b style="font-size:13px;color:#fff">Kalendář</b>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--muted)"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:3px">
            ${next ? `
              <p style="margin:0 0 2px;font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:800">Nejbližší událost</p>
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:24px;height:24px;border-radius:3px;background:rgba(37,183,255,.12);border:1px solid #25b7ff;color:#25b7ff;display:grid;place-items:center;flex:0 0 auto">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>
                </div>
                <p style="margin:0;font-size:11px;color:#fff;font-weight:700;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${next.title}</p>
              </div>
              <span style="font-size:9.5px;color:#c9a3ff">${evDateLabel}</span>
            ` : `<p style="margin:0;font-size:11px;color:var(--muted)">Žádná událost</p>`}
          </div>
        </div>`;
      eWrap.querySelector('#eventTile').addEventListener('click', ()=> Router.go('calendar'));
    }

    function renderProjectSwitcher(activeP, list, activeId){
      const panel = container.querySelector('#projPanel');
      panel.innerHTML = list.map(pr=>`
        <div class="dd-item ${pr.id===activeId?'is-active':''}" data-id="${pr.id}">
          <span>${pr.name} <small style="color:var(--muted)">· ${pr.location||''}</small></span>
        </div>`).join('') + `<div class="dd-item" id="projAddItem" style="color:#b34cff;font-weight:800">+ Přidat projekt</div>`;
      panel.querySelectorAll('.dd-item[data-id]').forEach(el=>{
        el.addEventListener('click', ()=>{
          msSetActiveProjectId(el.dataset.id);
          Router.go('dashboard');
        });
      });
      panel.querySelector('#projAddItem').addEventListener('click', ()=> Router.go('onboarding-project'));
      container.querySelector('#projBtn').addEventListener('click', ()=> panel.classList.toggle('open'));
      document.addEventListener('click', function outside(e){
        if(!container.contains(e.target)){ return; }
        if(!e.target.closest('#projDropdown')) panel.classList.remove('open');
      });
    }

    function wireTopActions(p){
      container.querySelector('#settingsBtn').addEventListener('click', ()=> Router.go('settings'));
      container.querySelector('#searchBtn').addEventListener('click', ()=> toggleSearch());
    }

    function toggleSearch(){
      const wrap = container.querySelector('#searchWrap');
      const isOpen = wrap.dataset.open === '1';
      if(isOpen){ wrap.innerHTML=''; wrap.dataset.open='0'; return; }
      wrap.dataset.open = '1';
      wrap.innerHTML = `
        <div style="padding:0 16px 8px">
          <input id="searchInput" class="f-input" placeholder="Hledat cokoliv - výdaj, zápis, etapu…" autofocus/>
          <div id="searchResults" style="margin-top:6px"></div>
        </div>
      `;
      const fmtDate = (iso)=>{ if(!iso) return ''; const d=new Date(iso+'T00:00:00'); return isNaN(d)?iso:`${d.getDate()}.${d.getMonth()+1}.`; };
      const index = [
        ...msSelectedStages().map(s=>({label:s.name, sub:'Etapa', color:s.color, route:'stage-detail', params:{key:s.key}})),
        {label:'Finance', sub:'Sekce', color:'#4dffab', route:'finance'},
        {label:'Galerie', sub:'Sekce', color:'#25b7ff', route:'gallery'},
        {label:'Deník', sub:'Sekce', color:'#ffd35c', route:'diary'},
        {label:'Projekt', sub:'Sekce', color:'#c9a3ff', route:'project'},
        {label:'Kalendář', sub:'Sekce', color:'#25b7ff', route:'calendar'},
        {label:'Nastavení', sub:'Sekce', color:'#94a0bc', route:'settings'},
        ...msExpenses().map(t=>({
          label: t.title || (t.type==='expense'?'Bez popisu':'Vklad na účet'),
          sub: `${t.type==='expense'?'Výdaj':'Vklad'} · ${Number(t.amount||0).toLocaleString('cs-CZ')} Kč · ${fmtDate(t.date)}`,
          color:'#4dffab', route:'expense-add', params:{edit:t.id},
        })),
        ...msDiary().map(e=>({
          label: e.text || (e.title||'Zápis do deníku'),
          sub: `Deník · ${(msStageByKey(e.stage)||{}).name||''} · ${fmtDate(e.date)}`,
          color:'#ffd35c', route:'diary', params:{stage:e.stage},
        })),
        ...msDocuments().map(d=>({
          label: d.name,
          sub: `Dokument · ${(msStageByKey(d.stage)||{}).name||''}`,
          color:'#25b7ff', route:'project', params:{stage:d.stage},
        })),
        ...msPhotos().filter(p=>p.caption).map(p=>({
          label: p.caption,
          sub: `Fotka · ${(msStageByKey(p.stage)||{}).name||''} · ${fmtDate(p.date)}`,
          color:'#b34cff', route:'gallery', params:{stage:p.stage},
        })),
        ...msEvents().map(e=>({
          label: e.title,
          sub: `Událost · ${fmtDate(e.date)}`,
          color:'#25b7ff', route:'calendar',
        })),
        ...msTasks().map(t=>({
          label: t.title,
          sub: `Úkol${t.done?' · hotovo':''} · ${t.dateMode==='none'?'bez termínu':fmtDate(t.date)}`,
          color:'#ff9b32', route:'calendar',
        })),
      ];
      const input = wrap.querySelector('#searchInput');
      const results = wrap.querySelector('#searchResults');
      input.addEventListener('input', ()=>{
        const q = input.value.trim().toLowerCase();
        if(!q){ results.innerHTML=''; return; }
        const matches = index.filter(i=>(i.label||'').toLowerCase().includes(q));
        results.innerHTML = matches.length
          ? matches.map((m,i)=>`<div class="sr-item" data-i="${i}" style="display:flex;align-items:center;gap:8px;padding:9px 0;border-top:1px solid var(--line);cursor:pointer">
              <i style="width:7px;height:7px;border-radius:50%;background:${m.color};display:inline-block;flex:0 0 auto"></i>
              <div style="min-width:0"><span style="display:block;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.label}</span>${m.sub?`<span style="display:block;font-size:9.5px;color:var(--muted)">${m.sub}</span>`:''}</div>
            </div>`).join('')
          : '<p style="font-size:11px;color:var(--muted);padding:8px 0">Nic nenalezeno.</p>';
        results.querySelectorAll('.sr-item').forEach(el=>{
          el.addEventListener('click', ()=>{
            const m = matches[Number(el.dataset.i)];
            Router.go(m.route, m.params||{});
          });
        });
      });
    }

    function checkJubilee(p){
      if(!p.started) return;
      const months = monthsBetween(p.startDate, new Date());
      const label = jubileeLabel(months);
      if(!label) return;
      const lastDone = p.lastMilestoneMonths || 0;
      if(months > lastDone && months > 0 && months % 1 === 0 && (months===1 || months%1===0) && label){
        // jednoduchy jubilejni banner jen jednou za dany pocet mesicu
      }
    }

    function renderDailyReminder(){
      const wrap = container.querySelector('#dailyReminderWrap');
      const t = todayISO();
      const alreadyShownToday = msLoad('ms_daily_reminder_shown_v1', ()=>null) === t;

      const addDays = (iso, n)=>{ const d = new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
      const tomorrow = addDays(t, 1), weekAhead = addDays(t, 7);

      const events = msEvents();
      const tasks = msTasks();
      // pouziva stejnou logiku jako Kalendar (msTaskVisibleOn), takze sem
      // spravne spadnou i "bez terminu" ukoly (kazdy den, dokud nejsou
      // splnene) a propadle terminy, co se "vlecou" pod dneskem
      const todayTaskVis = tasks.map(x=>({ x, vis: msTaskVisibleOn(x, t, t) })).filter(r=>r.vis.visible && !r.x.done);
      const todayItems = [
        ...events.filter(e=>e.date===t).map(e=>e.title),
        ...todayTaskVis.map(r=> r.vis.highlighted ? r.x.title+' (po termínu)' : r.x.title),
      ];
      const tomorrowItems = tasks.filter(x=>x.dateMode==='deadline' && x.date===tomorrow && !x.done).map(x=>x.title);
      const weekItems = tasks.filter(x=>x.dateMode==='deadline' && x.date===weekAhead && !x.done).map(x=>x.title);
      const hasAnything = todayItems.length || tomorrowItems.length || weekItems.length;

      if(!alreadyShownToday && hasAnything){
        const rows = [];
        if(todayItems.length) rows.push(`<b style="color:var(--accent)">Dnes</b> ${todayItems.join(', ')}`);
        if(tomorrowItems.length) rows.push(`<b style="color:var(--accent)">Zítra</b> ${tomorrowItems.join(', ')}`);
        if(weekItems.length) rows.push(`<b style="color:var(--accent)">Za týden</b> ${weekItems.join(', ')}`);
        wrap.innerHTML = `
          <div id="dailyReminderCard" style="border:1px solid var(--accent);background:var(--card-bg-2);padding:10px 12px;margin-top:8px;position:relative;cursor:pointer">
            <span id="dailyReminderClose" style="position:absolute;top:6px;right:8px;cursor:pointer;color:var(--muted);font-size:12px">✕</span>
            <div style="font-size:10.5px;line-height:1.7;padding-right:16px">${rows.join('<br/>')}</div>
          </div>`;
        wrap.querySelector('#dailyReminderClose').addEventListener('click', (e)=>{ e.stopPropagation(); wrap.innerHTML = ''; });
        wrap.querySelector('#dailyReminderCard').addEventListener('click', ()=> Router.go('calendar'));
        msSave('ms_daily_reminder_shown_v1', t);
      } else {
        wrap.innerHTML = '';
      }

      // volitelna OS notifikace navrch (jen kdyz uzivatel notifikace povolil) -
      // pouziva stejne "uz dnes zobrazeno" hlidani jako banner vyse
      if(hasAnything && localStorage.getItem('ms_notifications_enabled_v1')==='1'
         && typeof Notification!=='undefined' && Notification.permission==='granted' && !alreadyShownToday){
        const parts = [];
        if(todayItems.length) parts.push('Dnes: '+todayItems.join(', '));
        if(tomorrowItems.length) parts.push('Zítra: '+tomorrowItems.join(', '));
        if(weekItems.length) parts.push('Za týden: '+weekItems.join(', '));
        new Notification('Moje Stavba', { body: parts.join(' · ') });
      }
    }
  }

  return { render };
})();

Router.register('dashboard', DashboardScreen);
