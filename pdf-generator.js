/* ==========================================================
   PDF GENERATOR - sdilene jadro pro generatory dokumentu
   (zatim: Stavebni denik). Postaveno na jsPDF (viz index.html).
   ========================================================== */
const MsPdf = (function(){
  const PAGE_W = 210, PAGE_H = 297, MARGIN = 20;
  const INK = [40,38,34], MUTED = [110,108,100], BRICK = [168,80,60], LINE = [201,195,180], CREAM = [242,239,230];

  function newDoc(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'mm', format:'a4' });
    doc.setFont('helvetica','normal');
    return doc;
  }

  function makeCursor(doc){
    let y = MARGIN, page = 1;
    function ensure(h){
      if(y + h > PAGE_H - MARGIN){ doc.addPage(); page++; y = MARGIN; pageBorder(doc); }
    }
    return {
      get y(){ return y; }, set y(v){ y = v; },
      get page(){ return page; },
      ensure,
    };
  }

  function pageBorder(doc){
    doc.setDrawColor(...LINE); doc.setLineWidth(0.6);
    doc.rect(10, 10, PAGE_W-20, PAGE_H-20);
  }

  function heading(doc, cur, text, size){
    cur.ensure(14);
    doc.setFont('helvetica','bold'); doc.setFontSize(size||15); doc.setTextColor(...INK);
    doc.text(text, MARGIN, cur.y);
    cur.y += 2;
    doc.setDrawColor(...BRICK); doc.setLineWidth(1);
    doc.line(MARGIN, cur.y, MARGIN+16, cur.y);
    cur.y += 9;
  }

  function paragraph(doc, cur, text, opts){
    opts = opts || {};
    doc.setFont('helvetica', opts.bold?'bold':'normal'); doc.setFontSize(opts.size||10.3);
    doc.setTextColor(...(opts.color||INK));
    String(text||'').split('\n').forEach((para, pi, arr)=>{
      const lines = doc.splitTextToSize(para, opts.width || (PAGE_W - MARGIN*2));
      lines.forEach(line=>{
        cur.ensure(opts.lineH||4.8);
        doc.text(line, MARGIN, cur.y);
        cur.y += opts.lineH||4.8;
      });
    });
  }

  function labelValueRow(doc, cur, label, value){
    cur.ensure(6.5);
    doc.setFont('helvetica','bold'); doc.setFontSize(8.3); doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), MARGIN, cur.y);
    doc.setFont('helvetica','normal'); doc.setFontSize(10.3); doc.setTextColor(...INK);
    doc.text(String(value||'—'), MARGIN + 52, cur.y);
    cur.y += 6.8;
  }

  function table(doc, cur, cols, rows){
    const colW = cols.map(c=>c.w);
    const totalW = colW.reduce((a,b)=>a+b,0);
    cur.ensure(9);
    doc.setFillColor(...CREAM);
    doc.rect(MARGIN-2, cur.y-4.5, totalW+4, 8, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8.3); doc.setTextColor(...MUTED);
    let x = MARGIN;
    cols.forEach((c,i)=>{ (c.align==='right' ? doc.text(c.label, x+colW[i], cur.y, {align:'right'}) : doc.text(c.label, x, cur.y)); x += colW[i]; });
    cur.y += 3;
    doc.setDrawColor(...LINE); doc.line(MARGIN, cur.y, MARGIN+totalW, cur.y);
    cur.y += 6;
    doc.setFont('helvetica','normal'); doc.setFontSize(9.8);
    rows.forEach((row,ri)=>{
      cur.ensure(7);
      if(ri % 2 === 1){ doc.setFillColor(248,246,240); doc.rect(MARGIN-2, cur.y-4, totalW+4, 7, 'F'); }
      doc.setTextColor(...INK);
      let x2 = MARGIN;
      row.forEach((val,i)=>{
        const align = cols[i].align||'left';
        (align==='right' ? doc.text(String(val), x2+colW[i], cur.y, {align:'right'}) : doc.text(String(val), x2, cur.y));
        x2 += colW[i];
      });
      cur.y += 7;
    });
  }

  function footer(doc){
    const pageCount = doc.internal.getNumberOfPages();
    for(let i=1;i<=pageCount;i++){
      doc.setPage(i);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text('Vygenerováno aplikací Moje Stavba', MARGIN, PAGE_H-10);
      doc.text(String(i)+' / '+pageCount, PAGE_W-MARGIN, PAGE_H-10, {align:'right'});
    }
  }

  // zjisti skutecny rozmer obrazku (nutne k tomu, aby slo spocitat, jak
  // se ma zmensit/zvetsit BEZ oriznuti a BEZ nataazeni - viz photoRow)
  function imageSize(dataUrl){
    return new Promise((resolve)=>{
      const img = new Image();
      img.onload = ()=> resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
      img.onerror = ()=> resolve(null);
      img.src = dataUrl;
    });
  }

  // vlozi az 2 fotky vedle sebe do slotu pevne dane velikosti (boxW x boxH).
  // Kazda fotka se zmensi/zvetsi tak, aby se CELA vlezla dovnitr (zadne
  // oriznuti), pomer stran se nemeni (zadne natazeni), a nikdy neprekroci
  // slot (zadna "obri" fotka pres stranku). Asynchronni - potrebuje znat
  // skutecny rozmer kazde fotky pred vypoctem.
  async function photoRow(doc, cur, photos, opts){
    opts = opts || {};
    if(!photos || !photos.length) return;
    const list = photos.slice(0,2).filter(Boolean);
    if(!list.length) return;
    const boxH = opts.h || 34;
    const gap = 4;
    const boxW = list.length===1 ? (PAGE_W - MARGIN*2) : (PAGE_W - MARGIN*2 - gap)/2;
    cur.ensure(boxH+3);
    for(let i=0;i<list.length;i++){
      const dataUrl = list[i];
      const x = MARGIN + i*(boxW+gap);
      const y = cur.y;
      doc.setDrawColor(...LINE); doc.setLineWidth(0.3);
      doc.rect(x, y, boxW, boxH);
      const size = await imageSize(dataUrl);
      if(!size){ continue; } // poskozena/nepodporovana fotka - slot zustane prazdny, negeneruje chybu
      const scale = Math.min(boxW/size.w, boxH/size.h);
      const dw = size.w*scale, dh = size.h*scale;
      const dx = x + (boxW-dw)/2, dy = y + (boxH-dh)/2;
      try{ doc.addImage(dataUrl, undefined, dx, dy, dw, dh, undefined, 'FAST'); }catch(e){ /* preskocit fotky, ktere jspdf neumi dekodovat */ }
    }
    cur.y += boxH + 6;
  }

  function coverPage(doc, cur, title, subtitle, meta, extraLines){
    pageBorder(doc);
    doc.setFont('helvetica','bold'); doc.setFontSize(26); doc.setTextColor(...INK);
    doc.text(title, MARGIN, 45);
    doc.setFont('helvetica','normal'); doc.setFontSize(13); doc.setTextColor(...MUTED);
    doc.text(subtitle, MARGIN, 54);
    doc.setDrawColor(...BRICK); doc.setLineWidth(1.2);
    doc.line(MARGIN, 60, MARGIN+30, 60);
    cur.y = 74;
    meta.forEach(([label,val])=>{ if(val) labelValueRow(doc, cur, label, val); });
    if(extraLines && extraLines.length){
      cur.y += 4;
      extraLines.forEach(line=>{ paragraph(doc, cur, line, {size:10.5, color:MUTED}); });
    }
  }

  function saveOrShare(doc, filename){
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type:'application/pdf' });
    if(navigator.canShare && navigator.canShare({ files:[file] })){
      navigator.share({ files:[file], title: filename }).catch(()=>{ doc.save(filename); });
    } else {
      doc.save(filename);
    }
  }

  return { newDoc, makeCursor, pageBorder, heading, paragraph, labelValueRow, table, footer, photoRow, coverPage, saveOrShare, PAGE_W, PAGE_H, MARGIN, INK, MUTED, BRICK, LINE };
})();
