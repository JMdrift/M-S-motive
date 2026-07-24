/* ==========================================================
   MAIN - spusti se jako posledni, az jsou zaregistrovane vsechny
   obrazovky. Rozhodne, jestli appka bude ukazovat onboarding
   (prvni spusteni / bez projektu), nebo rovnou dashboard.
   ========================================================== */
(async function(){
  msMigrateLegacyDataToProject();
  await msMigratePhotosDocsToIdb();
  await msHydrateBlobCache();
  Layout.applyTheme(Layout.getTheme());
  msEnsureCurrentStageDayRecorded();

  // #app-shell je position:fixed;inset:0 + viewport-fit=cover v <meta viewport>,
  // takze appka presne kopiruje viditelnou plochu telefonu VCETNE bezpecnych
  // zon (home indicator atd.) uplne bez JS - viz komentar nahore v app.css.
  //
  // POZNAMKA K HISTORII: driv tu byla i JS logika, ktera se snazila
  // rucne kompenzovat drobny "posun" pri focusu pole pres
  // visualViewport.offsetTop a transform. Postupne ale zpusobila tri
  // ruzne regrese (menu "odlepene" od okraje, extremni vyrolovani
  // uvitaciho formulare, a nakonec cely chat s Martinem odjel mimo
  // obrazovku) - pokazde na jinem miste appky. Misto dalsiho dolad'ovani
  // je tahle logika radeji cela pryc: spolehame se jen na nativni
  // position:fixed;inset:0, ktere uz spolehlive funguje vsude jinde
  // v appce bez jakekoliv JS pomoci.

  if(!msHasOnboarded() || msLoadProjects().length===0){
    if(!location.hash || location.hash === '#/dashboard'){
      location.hash = '#/onboarding';
    }
  }
  Router.renderCurrent();
})();
