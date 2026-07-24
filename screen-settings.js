/* ==========================================================
   NASTAVENI
   ========================================================== */
const SettingsScreen = (function(){
  function render(container){
    container.innerHTML = `
      <div class="topbar">
        <div class="back-btn" id="backBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></div>
        <h1>Nastavení</h1>
      </div>
      <div class="screen-scroll">
        <p class="section-label" style="margin-top:4px">Projekty</p>
        <div id="projectsCard" style="border:1px solid var(--line)"></div>

        <p class="section-label">Předvolby</p>
        <div style="border:1px solid var(--line);margin-bottom:14px">
          <!-- Motiv appky (Skica/Neon) docasne schovany - viz komentar u SHOW_THEME_SWITCHER
               nize. Appka bezi natvrdo na Skica. Kod prepinace zustava funkcni,
               jen se nevykresluje. -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px">
            <div><b style="display:block;font-size:12.5px">Oznámení</b><span id="notifStatus" style="font-size:10.5px;color:var(--muted)">Posílat události přímo jako notifikaci</span></div>
            <div id="notifSwitch" style="width:38px;height:22px;border-radius:11px;border:1px solid var(--line);position:relative;cursor:pointer"><i style="position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--muted)"></i></div>
          </div>
        </div>

        <p class="section-label">Generátory a export</p>
        <div style="border:1px solid var(--line)">
          <div class="row-item" id="rowDiaryGen" style="padding:12px;cursor:pointer"><b style="font-size:12.5px">Stavební deník</b><span style="display:block;font-size:10.5px;color:var(--muted)">Chronologický deník podle etap, s fotkami</span></div>
        </div>

        <p class="section-label">Úložiště</p>
        <div style="border:1px solid var(--line)">
          <div style="padding:12px;border-bottom:1px solid var(--line)">
            <div id="storageBar" style="height:6px;background:var(--card-bg-2);border:1px solid var(--line);margin-bottom:8px;overflow:hidden"><div id="storageBarFill" style="height:100%;background:var(--accent);width:0%"></div></div>
            <span id="storageText" style="font-size:11px;color:var(--muted)">Počítám…</span>
          </div>
          <div class="row-item" id="rowCompress" style="padding:12px;cursor:pointer"><b style="font-size:12.5px">Zmenšit uložené fotky a dokumenty</b><span style="display:block;font-size:10.5px;color:var(--muted)">Uvolní místo bez ztráty obsahu - hodí se, když appka hlásí plné úložiště</span></div>
        </div>

        <p class="section-label">Zálohování dat</p>
        <div style="border:1px solid var(--line)">
          <div class="row-item" id="rowExport" style="padding:12px;cursor:pointer;border-bottom:1px solid var(--line)"><b style="font-size:12.5px">Exportovat zálohu</b><span style="display:block;font-size:10.5px;color:var(--muted)">Stáhne všechna data appky jako soubor</span></div>
          <div class="row-item" id="rowImport" style="padding:12px;cursor:pointer"><b style="font-size:12.5px">Obnovit ze zálohy</b><span style="display:block;font-size:10.5px;color:var(--muted)">Nahraje dříve stažený soubor</span></div>
          <input type="file" id="importFile" accept="application/json" style="display:none"/>
        </div>

        <p class="section-label">Podpora</p>
        <div style="border:1px solid var(--line)">
          <div class="row-item soon" style="padding:12px;border-bottom:1px solid var(--line)"><b style="font-size:12.5px">Nápověda a podpora</b><span style="display:block;font-size:10.5px;color:var(--muted)">Připravujeme</span></div>
          <div class="row-item" id="rowDeleteAll" style="padding:12px;cursor:pointer;color:#ff7a86"><b style="font-size:12.5px">Smazat všechna data appky</b><span style="display:block;font-size:10.5px;color:var(--muted)">Nevratné</span></div>
        </div>

        <p class="section-label">O aplikaci</p>
        <div style="border:1px solid var(--line);padding:16px;text-align:center">
          <b style="display:block;font-size:14px">Moje Stavba</b>
          <span style="font-size:11px;color:var(--muted)">Verze 1.0 (nová architektura)</span>
        </div>
      </div>
    `;
    container.querySelector('#backBtn').addEventListener('click', ()=> Router.back());
    container.querySelector('#rowDiaryGen').addEventListener('click', ()=> Router.go('diary-export', {}));

    function renderProjects(){
      const wrap = container.querySelector('#projectsCard');
      const projects = msLoadProjects();
      const activeId = msGetActiveProjectId();
      wrap.innerHTML = projects.map(p=>`
        <div class="proj-row" data-id="${p.id}" style="display:flex;align-items:center;gap:10px;padding:11px 12px;border-bottom:1px solid var(--line);cursor:pointer">
          <div style="width:8px;height:8px;border-radius:50%;background:${p.currentStage?p.currentStage.color:'#94a0bc'}"></div>
          <div style="flex:1;min-width:0"><b style="display:block;font-size:13px">${p.name}</b><span style="font-size:10.5px;color:var(--muted)">${p.type?p.type+' · ':''}${p.location||''}</span></div>
          ${p.id===activeId?'<span style="font-size:8.5px;font-weight:800;color:var(--accent);border:1px solid var(--accent);padding:2px 5px">Aktivní</span>':''}
          <span class="edit-btn" data-id="${p.id}" style="font-size:11px;color:#25b7ff;font-weight:700">Upravit</span>
        </div>
      `).join('') + `<div id="addProjectRow" style="display:flex;align-items:center;gap:8px;padding:12px;color:#b34cff;font-size:12.5px;font-weight:800;cursor:pointer">+ Přidat projekt</div>`;

      wrap.querySelectorAll('.proj-row').forEach(row=>{
        row.addEventListener('click', (e)=>{
          if(e.target.closest('.edit-btn')) return;
          msSetActiveProjectId(row.dataset.id);
          renderProjects();
        });
      });
      wrap.querySelectorAll('.edit-btn').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
          e.stopPropagation();
          const p = projects.find(x=>x.id===btn.dataset.id);
          const name = prompt('Název projektu:', p.name);
          if(name===null) return;
          const loc = prompt('Místo stavby:', p.location||'');
          if(loc===null) return;
          msUpdateProject(p.id, {name:name.trim()||p.name, location:loc.trim()});
          renderProjects();
        });
      });
      wrap.querySelector('#addProjectRow').addEventListener('click', ()=> Router.go('onboarding-project'));
    }
    renderProjects();

    // motiv appky
    const themeButtons = container.querySelectorAll('#themeSeg button');
    function refreshThemeButtons(){
      const active = Layout.getTheme();
      themeButtons.forEach(b=>{
        const isActive = b.dataset.theme === active;
        b.style.borderColor = isActive ? 'var(--accent)' : 'var(--line)';
        b.style.color = isActive ? 'var(--accent)' : 'var(--text-main)';
        b.style.background = isActive ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent';
      });
    }
    themeButtons.forEach(b=>{
      b.addEventListener('click', ()=>{
        Layout.applyTheme(b.dataset.theme);
        refreshThemeButtons();
      });
    });
    refreshThemeButtons();

    // notifikace
    const notifSwitch = container.querySelector('#notifSwitch');
    const notifStatus = container.querySelector('#notifStatus');
    const NOTIF_KEY = 'ms_notifications_enabled_v1';
    function refreshNotif(){
      const enabled = localStorage.getItem(NOTIF_KEY)==='1' && (typeof Notification!=='undefined' && Notification.permission==='granted');
      notifSwitch.style.borderColor = enabled ? 'var(--accent)' : 'var(--line)';
      notifSwitch.querySelector('i').style.left = enabled ? '18px' : '2px';
      notifSwitch.querySelector('i').style.background = enabled ? 'var(--accent)' : 'var(--muted)';
      if(typeof Notification==='undefined') notifStatus.textContent = 'Tento prohlížeč oznámení nepodporuje';
      else if(Notification.permission==='denied') notifStatus.textContent = 'Zablokováno v nastavení prohlížeče';
      else if(enabled) notifStatus.textContent = 'Zapnuto';
      else notifStatus.textContent = 'Posílat události přímo jako notifikaci';
    }
    notifSwitch.addEventListener('click', async ()=>{
      if(typeof Notification==='undefined'){ alert('Prohlížeč oznámení nepodporuje.'); return; }
      if(localStorage.getItem(NOTIF_KEY)==='1'){ localStorage.setItem(NOTIF_KEY,'0'); refreshNotif(); return; }
      const perm = await Notification.requestPermission();
      if(perm==='granted'){ localStorage.setItem(NOTIF_KEY,'1'); new Notification('Moje Stavba', {body:'Oznámení jsou zapnutá.'}); }
      refreshNotif();
    });
    refreshNotif();

    // zaloha
    // uloziste - realny odhad primo z prohlizece (pokryva IndexedDB, kde
    // ted zijou fotky/dokumenty - ma mnohem vetsi strop nez drivejsi
    // localStorage, typicky stovky MB az GB podle mista v telefonu)
    async function refreshStorageBar(){
      container.querySelector('#storageText').textContent = 'Počítám…';
      let est = null;
      if(navigator.storage && navigator.storage.estimate){
        try{ est = await navigator.storage.estimate(); }catch(e){}
      }
      if(est && est.quota){
        const usedMb = (est.usage/1024/1024).toFixed(1);
        const quotaMb = (est.quota/1024/1024/1024).toFixed(1);
        const pct = Math.min(100, Math.round(est.usage/est.quota*100));
        container.querySelector('#storageBarFill').style.width = pct+'%';
        container.querySelector('#storageBarFill').style.background = pct>85 ? '#ff6a6a' : 'var(--accent)';
        container.querySelector('#storageText').textContent = `Využito ${usedMb} MB z ~${quotaMb} GB dostupných na telefonu`;
      } else {
        const used = msStorageUsageBytes();
        container.querySelector('#storageBarFill').style.width = '0%';
        container.querySelector('#storageText').textContent = `Drobná data appky: ${(used/1024).toFixed(0)} kB (fotky/dokumenty se počítají zvlášť, telefon jejich přesnou velikost nesděluje)`;
      }
    }
    refreshStorageBar();
    container.querySelector('#rowCompress').addEventListener('click', async ()=>{
      const row = container.querySelector('#rowCompress');
      const originalHtml = row.innerHTML;
      row.innerHTML = '<b style="font-size:12.5px">Zmenšuji…</b>';
      const saved = await msCompressExistingMedia((cat, i, n)=>{
        row.innerHTML = `<b style="font-size:12.5px">Zmenšuji ${cat} (${i}/${n})…</b>`;
      });
      row.innerHTML = originalHtml;
      refreshStorageBar();
      alert(saved>0 ? `Hotovo, uvolnilo se přibližně ${(saved/1024).toFixed(0)} kB.` : 'Všechno už bylo v optimální velikosti, nebylo co zmenšit.');
    });

    container.querySelector('#rowExport').addEventListener('click', ()=>{
      const data = {};
      for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith('ms_')) data[k]=localStorage.getItem(k); }
      const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='moje-stavba-zaloha-'+new Date().toISOString().slice(0,10)+'.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    });
    container.querySelector('#rowImport').addEventListener('click', ()=> container.querySelector('#importFile').click());
    container.querySelector('#importFile').addEventListener('change', (e)=>{
      const file = e.target.files[0]; if(!file) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        try{
          const data = JSON.parse(reader.result);
          Object.keys(data).forEach(k=>{ if(k.startsWith('ms_')) localStorage.setItem(k, data[k]); });
          alert('Záloha byla obnovena.');
          Router.go('dashboard');
        }catch(err){ alert('Tenhle soubor se nepodařilo přečíst jako zálohu.'); }
      };
      reader.readAsText(file);
    });

    container.querySelector('#rowDeleteAll').addEventListener('click', async ()=>{
      if(!await Layout.confirmDialog('Opravdu smazat úplně všechna data appky? Tohle je nevratné.', 'Smazat vše')) return;
      const keys = [];
      for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith('ms_')) keys.push(k); }
      keys.forEach(k=>localStorage.removeItem(k));
      Router.go('onboarding');
    });

    return { activeTab:'', showNav:true };
  }
  return { render };
})();
Router.register('settings', SettingsScreen);
