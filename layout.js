/* ==========================================================
   LAYOUT
   Vsechno, co je spolecne pro (skoro) kazdou obrazovku, na
   jednom miste: spodni navigace, radialni rychle pridani a
   potvrzovaci dialog (nahrazuje prohlizecovy confirm() - stejny
   vzhled a chovani uplne vsude, misto ruzneho confirm() textu
   kopirovaneho do kazde obrazovky zvlast).
   ========================================================== */
const Layout = (function(){
  const nav = document.getElementById('bottom-nav');

  nav.querySelectorAll('.nav-item[data-route]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      setQaOpen(false);
      Router.go(btn.dataset.route);
    });
  });

  function applyNav(activeTab, show){
    nav.hidden = !show;
    nav.querySelectorAll('.nav-item[data-route]').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.route === activeTab);
    });
  }

  /* ---------- rychle pridani (radialni menu) ---------- */
  const qaBackdrop = document.getElementById('quick-add-backdrop');
  const qaRadial = document.getElementById('quick-add-radial');
  const qaSats = [...qaRadial.querySelectorAll('.qa-sat')];
  const R = 108, ANGLES = [-72,-36,0,36,72];
  qaSats.forEach((el,i)=>{
    const rad = ANGLES[i] * Math.PI/180;
    el.style.setProperty('--tx', (R*Math.sin(rad)) + 'px');
    el.style.setProperty('--ty', (-R*Math.cos(rad)) + 'px');
    el.style.transitionDelay = (i*0.03) + 's';
  });
  let qaOpen = false;
  function setQaOpen(v){
    qaOpen = v;
    qaBackdrop.hidden = false; qaRadial.hidden = false;
    qaBackdrop.classList.toggle('open', v);
    qaRadial.classList.toggle('open', v);
    qaSats.forEach(el=>{
      el.style.transform = v
        ? 'translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1)'
        : 'translate(-50%,-50%) scale(.3)';
    });
  }
  document.getElementById('navAddBtn').addEventListener('click', ()=> setQaOpen(!qaOpen));
  qaBackdrop.addEventListener('click', ()=> setQaOpen(false));
  qaSats.forEach(el=>{
    el.addEventListener('click', ()=>{
      setQaOpen(false);
      Router.go(el.dataset.target);
    });
  });

  /* ---------- potvrzovaci dialog (misto prohlizeoveho confirm()) ---------- */
  const confirmOverlay = document.getElementById('confirm-overlay');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmOkBtn = document.getElementById('confirm-ok-btn');
  const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

  function confirmDialog(message, okLabel){
    return new Promise(resolve=>{
      confirmMessage.textContent = message;
      confirmOkBtn.textContent = okLabel || 'Potvrdit';
      confirmOverlay.classList.add('open');
      function cleanup(result){
        confirmOverlay.classList.remove('open');
        confirmOkBtn.removeEventListener('click', onOk);
        confirmCancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      }
      function onOk(){ cleanup(true); }
      function onCancel(){ cleanup(false); }
      confirmOkBtn.addEventListener('click', onOk);
      confirmCancelBtn.addEventListener('click', onCancel);
    });
  }

  function getTheme(){
    // Motiv appky je docasne uzamceny na Skica (Neon prepinac je schovany
    // v Nastaveni, viz screen-settings.js) - kdyby uz nekdo mel v localStorage
    // ulozeny 'neon' ze starsi verze, appka by jinak nastartovala do motivu,
    // ktery uz nejde z appky prepnout zpet. Az se Neon zase zapne, staci
    // tenhle radek vratit na: return localStorage.getItem('ms_theme_v1') || 'sketch';
    return 'sketch';
  }
  function applyTheme(theme){
    const root = document.documentElement;
    if(theme === 'sketch'){ root.setAttribute('data-theme', 'sketch'); }
    else { root.removeAttribute('data-theme'); }
    localStorage.setItem('ms_theme_v1', theme);
  }

  // Sdilena "sourodá paleta" pro Skica motiv: cerna -> cihlova -> bila
  // podle pozice v rade (idx/total). Puvodne existovala jen na kolotoci
  // etap (screen-stagesWheel.js); ted ji pouziva i seznam etap a mrizka
  // pri zakladani nove etapy, aby vsechny obrazovky s etapami pusobily
  // jako jeden sourody celek a barva se "netrhala" az u fotky v detailu.
  function hexToRgb(hex){ const n=parseInt(hex.replace('#',''),16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
  function mixRgb(c1,c2,t){ return `rgb(${Math.round(c1.r+(c2.r-c1.r)*t)},${Math.round(c1.g+(c2.g-c1.g)*t)},${Math.round(c1.b+(c2.b-c1.b)*t)})`; }
  const GRAD_STOPS = ['#1d1e1c', '#a8503c', '#ffffff'].map(hexToRgb);
  function themedGradientColor(idx, total){
    if(total<=1) return `rgb(${GRAD_STOPS[1].r},${GRAD_STOPS[1].g},${GRAD_STOPS[1].b})`;
    const t = idx/(total-1);
    return t<0.5 ? mixRgb(GRAD_STOPS[0], GRAD_STOPS[1], t*2) : mixRgb(GRAD_STOPS[1], GRAD_STOPS[2], (t-0.5)*2);
  }

  return { applyNav, confirmDialog, closeQuickAdd(){ setQaOpen(false); }, getTheme, applyTheme, themedGradientColor };
})();
