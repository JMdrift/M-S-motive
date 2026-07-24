/* ==========================================================
   ONBOARDING - uvodni slidy + zalozeni projektu (prvniho i dalsiho)
   ========================================================== */
const OnboardingScreen = (function(){
  const slides = [
    { color:'#b34cff', title:'Sleduj svou stavbu', text:'Den stavby, aktuální etapa a přehled financí na jednom místě.' },
    { color:'#25e8ff', title:'Etapy, deník i finance', text:'Procházej etapami, zapisuj do deníku a sleduj výdaje podle etapy i za celý projekt.' },
    { color:'#ffd35c', title:'Rychlé přidání kdekoli', text:'Prostřední tlačítko dole je vždycky po ruce - zápis, výdaj, událost i fotka bez hledání záložky.' },
  ];

  function drawNotifications(container, onDone){
    // Uvitani je vzdy ve Skica motivu (vychozi a jediny nabizeny pri prvnim
    // spusteni - Neon zustava schovany, jde zapnout jen v Nastaveni).
    Layout.applyTheme('sketch');
    function askPermission(){
      if(window.Notification && Notification.requestPermission){
        Notification.requestPermission().finally(onDone);
      } else {
        onDone();
      }
    }
    container.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:28px 22px calc(24px + env(safe-area-inset-bottom))">
        <div style="width:72px;height:72px;border:1px solid var(--accent);color:var(--accent);display:grid;place-items:center;margin:0 auto 22px">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);font-weight:800;margin:0 0 6px;text-align:center">Oznámení</p>
        <h1 style="margin:0 0 8px;font-size:23px;text-align:center">Nenech si ujít důležité momenty</h1>
        <p style="margin:0;font-size:13px;color:var(--muted);line-height:1.5;text-align:center">Appka umí připomenout, když dlouho nepřibyl zápis do deníku, nebo upozornit na blížící se událost v kalendáři. Kdykoli později to jde vypnout v Nastavení.</p>
      </div>
      <div style="padding:8px 22px calc(20px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:8px">
        <button class="btn-primary" id="notifYesBtn">Povolit oznámení</button>
        <button class="btn-ghost" id="notifNoBtn">Teď ne</button>
      </div>
    `;
    container.querySelector('#notifYesBtn').addEventListener('click', askPermission);
    container.querySelector('#notifNoBtn').addEventListener('click', onDone);
  }

  function render(container){
    let i = 0;
    function draw(){
      const s = slides[i];
      container.innerHTML = `
        <div style="display:flex;justify-content:flex-end;align-items:center;padding:calc(14px + env(safe-area-inset-top)) 16px 4px">
          <div id="skipBtn" style="font-size:12.5px;color:var(--muted);font-weight:700;cursor:pointer">Přeskočit</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 30px;text-align:center">
          <div class="ob-icon" style="width:96px;height:96px;border:1px solid ${s.color};color:${s.color};display:grid;place-items:center;margin-bottom:28px;filter:drop-shadow(0 0 14px ${s.color})">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          </div>
          <h2 style="margin:0 0 12px;font-size:21px">${s.title}</h2>
          <p style="margin:0;font-size:13.5px;color:var(--muted);line-height:1.6;max-width:280px">${s.text}</p>
        </div>
        <div style="padding:8px 24px calc(24px + env(safe-area-inset-bottom))">
          <div style="display:flex;justify-content:center;gap:7px;margin-bottom:20px">
            ${slides.map((_,idx)=>`<i class="ob-dot" data-active="${idx===i}" style="width:${idx===i?18:6}px;height:6px;background:${idx===i?'var(--accent)':'var(--line)'};display:inline-block;transition:width .2s"></i>`).join('')}
          </div>
          <button class="btn-primary ob-next-btn" id="nextBtn" style="background:linear-gradient(90deg,#25e8ff,#b34cff);color:#04070f;border:0">${i===slides.length-1?'Pokračovat':'Další'}</button>
        </div>
      `;
      container.querySelector('#skipBtn').addEventListener('click', ()=> Router.go('onboarding-project'));
      container.querySelector('#nextBtn').addEventListener('click', ()=>{
        if(i < slides.length-1){ i++; draw(); } else { Router.go('onboarding-project'); }
      });
    }
    drawNotifications(container, draw);
    return { showNav:false };
  }
  return { render };
})();
Router.register('onboarding', OnboardingScreen);


const OnboardingProjectScreen = (function(){
  // Vyber typu stavby (Rodinny dum/Chata/Byt/Rekonstrukce/Komercni objekt/Jine)
  // je docasne schovany - momentalne je vsechno "Rodinny dum". Puvodni seznam
  // necham tu jen jako poznamku, kdyby se vyber v budoucnu zase vratil:
  // const TYPES = ['Rodinný dům','Chata','Byt','Rekonstrukce','Komerční objekt','Jiné'];
  const FIXED_TYPE = 'Rodinný dům';

  function render(container){
    const isAdditional = msLoadProjects().length > 0;

    container.innerHTML = `
      <div style="padding:calc(14px + env(safe-area-inset-top)) 16px 6px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);font-weight:800;margin:0 0 4px">${isAdditional?'Nový projekt':'Poslední krok'}</p>
        <h1 style="margin:0;font-size:21px">${isAdditional?'Založ další projekt':'Založ svůj první projekt'}</h1>
        <p style="margin:8px 0 0;font-size:12px;color:var(--muted);line-height:1.5">${isAdditional?'Vyplň základní údaje o dalším projektu.':'Appka bez projektu neví, co má sledovat. Další projekty pak přidáš kdykoliv v nastavení.'}</p>
      </div>
      <div class="screen-scroll">
        <div class="field-block"><p class="f-label">Název projektu *</p><input class="f-input" id="fName" placeholder="Např. Rodinný dům"/></div>
        <div class="field-block"><p class="f-label">Místo stavby *</p><input class="f-input" id="fLocation" placeholder="Např. Malé Březno u Mostu"/></div>
      </div>
      <div style="padding:12px 16px calc(20px + env(safe-area-inset-bottom))">
        <button class="btn-primary" id="continueBtn" style="background:linear-gradient(90deg,#25e8ff,#b34cff);color:#04070f;border:0">${isAdditional?'Vytvořit projekt':'Vytvořit projekt a spustit appku'}</button>
        ${isAdditional?'<p style="text-align:center;font-size:11px;color:var(--muted);margin-top:8px;text-decoration:underline;cursor:pointer" id="cancelLink">Zrušit a vrátit se do nastavení</p>':''}
      </div>
    `;

    if(isAdditional){
      container.querySelector('#cancelLink').addEventListener('click', ()=> Router.go('settings'));
    }
    container.querySelector('#continueBtn').addEventListener('click', ()=>{
      const name = container.querySelector('#fName').value.trim();
      const location_ = container.querySelector('#fLocation').value.trim();
      if(!name || !location_){
        alert('Vyplň prosím název projektu a místo.');
        return;
      }
      // Typ stavby je docasne uzamceny na "Rodinny dum" (vyber Chata/Byt/
      // Rekonstrukce/apod. je schovany, viz komentar u TYPES vyse) - az se
      // bude vyber zase chtit zapnout, staci vratit typeGrid do HTML sablony.
      msCreateProject({ name, type:FIXED_TYPE, location:location_ });
      const preset = MS_TYPE_STAGE_PRESETS[FIXED_TYPE] || [];
      if(preset.length) msSetSelectedStageKeys(preset);
      msSetOnboarded();
      Router.go(isAdditional ? 'settings' : 'dashboard');
    });

    return { showNav:false };
  }
  return { render };
})();
Router.register('onboarding-project', OnboardingProjectScreen);
