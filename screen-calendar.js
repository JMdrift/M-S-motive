/* ==========================================================
   KALENDAR
   ========================================================== */
const CalendarScreen = (function(){
  const MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
  function formatDateCz(iso){
    const d = new Date(iso+'T00:00:00');
    return d.getDate()+'. '+(d.getMonth()+1)+'.';
  }

  function render(container){
    const today = new Date();
    let viewYear = today.getFullYear(), viewMonth = today.getMonth();
    let selectedDate = today.toISOString().slice(0,10);

    container.innerHTML = `
      <div class="topbar">
        <div class="back-btn" id="backBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></div>
        <h1>Kalendář</h1>
        <div class="icon-btn" id="addBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div>
      </div>
      <div class="screen-scroll">
        <div style="border:1px solid var(--line);padding:12px;margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <b id="monthLabel" style="font-size:13px"></b>
            <div style="display:flex;gap:6px">
              <button id="prevBtn" style="width:24px;height:24px;border:1px solid var(--line);background:transparent;color:#fff;cursor:pointer">‹</button>
              <button id="nextBtn" style="width:24px;height:24px;border:1px solid var(--line);background:transparent;color:#fff;cursor:pointer">›</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:4px">
            ${['Po','Út','St','Čt','Pá','So','Ne'].map(d=>`<span style="text-align:center;font-size:8.5px;color:var(--muted);font-weight:800">${d}</span>`).join('')}
          </div>
          <div id="grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px"></div>
        </div>
        <p class="section-label" id="listLabel">Události a úkoly tento den</p>
        <div id="eventList"></div>
        <p class="section-label">Nadcházející události</p>
        <div id="allEvents"></div>
      </div>
    `;
    container.querySelector('#backBtn').addEventListener('click', ()=> Router.back());
    container.querySelector('#addBtn').addEventListener('click', ()=> Router.go('event-add'));
    container.querySelector('#prevBtn').addEventListener('click', ()=>{ viewMonth--; if(viewMonth<0){viewMonth=11;viewYear--;} draw(); });
    container.querySelector('#nextBtn').addEventListener('click', ()=>{ viewMonth++; if(viewMonth>11){viewMonth=0;viewYear++;} draw(); });

    function draw(){
      container.querySelector('#monthLabel').textContent = MONTHS[viewMonth]+' '+viewYear;
      const events = msEvents();
      const tasks = msTasks();
      const grid = container.querySelector('#grid');
      grid.innerHTML = '';
      const firstDay = new Date(viewYear, viewMonth, 1);
      let startWeekday = firstDay.getDay(); startWeekday = startWeekday===0?6:startWeekday-1;
      const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
      for(let i=0;i<startWeekday;i++) grid.appendChild(document.createElement('div'));
      const todayIso = today.toISOString().slice(0,10);
      for(let d=1; d<=daysInMonth; d++){
        const iso = viewYear+'-'+String(viewMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        const has = events.some(e=>e.date===iso) || tasks.some(t=>msTaskVisibleOn(t, iso, todayIso).visible);
        const cell = document.createElement('div');
        cell.style.cssText = `aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;cursor:pointer;
          border:1px solid ${iso===selectedDate?'#25b7ff':'transparent'};color:${iso===selectedDate?'#fff':'#c7cee6'}`;
        cell.innerHTML = d + (has?'<i style="width:3px;height:3px;background:#25b7ff;display:block;margin-top:1px"></i>':'');
        cell.addEventListener('click', ()=>{ selectedDate = iso; draw(); });
        grid.appendChild(cell);
      }
      const list = container.querySelector('#eventList');
      const dayEvents = events.filter(e=>e.date===selectedDate).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
      let dayTasks = tasks.filter(t=>msTaskVisibleOn(t, selectedDate, todayIso).visible);
      if(dayEvents.length===0 && dayTasks.length===0){ list.innerHTML = '<p class="empty-msg">Žádné události ani úkoly tento den.</p>'; }
      else {
      list.innerHTML = dayEvents.map(e=>`
        <div style="border:1px solid var(--line);padding:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
          <div><b style="display:block;font-size:12.5px">${e.title}</b><span style="font-size:10.5px;color:var(--muted)">${e.time?e.time:'Celý den'}</span></div>
          <div style="display:flex;align-items:center;gap:12px">
            <span class="edit-ev" data-id="${e.id}" style="cursor:pointer;color:var(--muted)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></span>
            <span class="del-ev" data-id="${e.id}" style="color:#ff7a86;cursor:pointer;font-size:11px">Smazat</span>
          </div>
        </div>`).join('') + dayTasks.map(t=>{
        const vis = msTaskVisibleOn(t, selectedDate, todayIso);
        const isEcho = !t.done && selectedDate===todayIso && t.date && t.date!==selectedDate; // sem se dostal jen jako "visici" pripominac, ne v den sveho terminu
        let sub = '';
        if(t.done){
          sub = 'Splněno';
        } else if(t.dateMode==='deadline'){
          sub = vis.highlighted ? `Po termínu (byl ${formatDateCz(t.date)})` : (isEcho ? `Do ${formatDateCz(t.date)}` : 'Dokončit do tohoto dne');
        } else if(t.dateMode==='date'){
          sub = vis.highlighted ? `Po termínu (byl ${formatDateCz(t.date)})` : '';
        }
        return `
        <div style="border:1px solid ${vis.highlighted?'#ff7a86':'var(--line)'};padding:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;${t.done?'opacity:.5':''}">
          <div style="display:flex;align-items:center;gap:9px;min-width:0">
            <span class="task-check" data-id="${t.id}" style="width:19px;height:19px;flex:0 0 auto;border:1px solid ${t.done?'#ff9b32':'var(--line)'};background:${t.done?'#ff9b32':'transparent'};display:grid;place-items:center;cursor:pointer;border-radius:3px">${t.done?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#04070f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>':''}</span>
            <div style="min-width:0"><b style="display:block;font-size:12.5px;text-decoration:${t.done?'line-through':'none'}">${t.title}</b>${sub?`<span style="font-size:10px;color:${vis.highlighted?'#ff7a86':'var(--muted)'}">${sub}</span>`:''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex:0 0 auto">
            <span class="edit-task" data-id="${t.id}" style="cursor:pointer;color:var(--muted)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></span>
            <span class="del-task" data-id="${t.id}" style="color:#ff7a86;cursor:pointer;font-size:11px">Smazat</span>
          </div>
        </div>`;}).join('');
      list.querySelectorAll('.edit-ev').forEach(el=>{
        el.addEventListener('click', ()=> Router.go('event-add', {eventId: el.dataset.id}));
      });
      list.querySelectorAll('.del-ev').forEach(el=>{
        el.addEventListener('click', async ()=>{
          if(!await Layout.confirmDialog('Smazat tuhle událost?', 'Smazat')) return;
          msDeleteEvent(el.dataset.id); draw();
        });
      });
      list.querySelectorAll('.task-check').forEach(el=>{
        el.addEventListener('click', ()=>{
          const t = dayTasks.find(x=>x.id===el.dataset.id);
          const nowDone = !t.done;
          msUpdateTask(t.id, { done: nowDone, doneDate: nowDone ? todayIso : null }); draw();
        });
      });
      list.querySelectorAll('.edit-task').forEach(el=>{
        el.addEventListener('click', ()=> Router.go('task-add', {taskId: el.dataset.id}));
      });
      list.querySelectorAll('.del-task').forEach(el=>{
        el.addEventListener('click', async ()=>{
          if(!await Layout.confirmDialog('Smazat tenhle úkol?', 'Smazat')) return;
          msDeleteTask(el.dataset.id); draw();
        });
      });
      }

      renderAllEvents(events);
    }

    function renderAllEvents(events){
      const wrap = container.querySelector('#allEvents');
      const todayIso = today.toISOString().slice(0,10);
      const upcoming = events.filter(e=>e.date>=todayIso).sort((a,b)=>a.date.localeCompare(b.date));
      if(upcoming.length===0){ wrap.innerHTML = '<p class="empty-msg">Žádné nadcházející události.</p>'; return; }
      const nextId = upcoming[0].id;
      wrap.innerHTML = upcoming.map(e=>{
        const d = new Date(e.date+'T00:00:00');
        return `<div class="upcoming-ev" data-date="${e.date}" style="display:flex;align-items:center;gap:10px;border:1px solid var(--line);padding:9px;margin-bottom:6px;cursor:pointer">
          <div style="width:38px;height:38px;border:1px solid #25b7ff;border-radius:var(--radius);display:flex;flex-direction:column;align-items:center;justify-content:center;flex:0 0 auto;color:#25b7ff">
            <b style="font-size:13px;line-height:1">${d.getDate()}</b><span style="font-size:7px;text-transform:uppercase">${MONTHS[d.getMonth()].slice(0,3)}</span>
          </div>
          <div style="flex:1;min-width:0"><b style="display:block;font-size:12px">${e.title}</b><span style="font-size:10px;color:var(--muted)">${e.time?e.time:'Celý den'}</span></div>
          ${e.id===nextId ? '<span style="font-size:8px;font-weight:800;color:#4dffab;border:1px solid #4dffab;padding:2px 5px;border-radius:3px;flex:0 0 auto">Nejbližší</span>' : ''}
        </div>`;
      }).join('');
      wrap.querySelectorAll('.upcoming-ev').forEach(el=>{
        el.addEventListener('click', ()=>{
          const d = new Date(el.dataset.date+'T00:00:00');
          selectedDate = el.dataset.date; viewYear = d.getFullYear(); viewMonth = d.getMonth();
          draw();
          container.closest('.screen-scroll').scrollTop = 0;
        });
      });
    }
    draw();
    return { activeTab:'dashboard' };
  }
  return { render };
})();
Router.register('calendar', CalendarScreen);
