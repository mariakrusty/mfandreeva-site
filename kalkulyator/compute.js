// Калькулятор ЗП — pure JS helpers
// Demo data, calculation logic, formatters
// Matches the business rules from the original product (uploads/salary_calculator.html)

/* ===== Formatters ===== */
function fmtMoney(n) {
  if (n == null || isNaN(n)) return '— ₽';
  const num = Math.round(Number(n));
  const neg = num < 0;
  const parts = Math.abs(num).toString().split('').reverse();
  const out = [];
  parts.forEach((d, i) => { if (i && i % 3 === 0) out.push('\u00A0'); out.push(d); });
  return (neg ? '−' : '') + out.reverse().join('') + '\u00A0₽';
}
function fmtNum(n) {
  if (n == null || isNaN(n)) return '—';
  const num = Math.round(Number(n));
  return num.toLocaleString('ru-RU');
}
function fmtPct(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + '%';
}

/* ===== Demo data (matches the original product's loadDemo()) ===== */
const DEMO_SOTRUDNIKI = [
  { fio: 'Иванова Анна Сергеевна',     dolzhnost: 'Флорист',           stavka: 1200, pctVyruchka: 5, pctStazh: 3, status: 'активен' },
  { fio: 'Петрова Марина Олеговна',    dolzhnost: 'Флорист',           stavka: 1100, pctVyruchka: 5, pctStazh: 0, status: 'активен' },
  { fio: 'Сидорова Елена Ивановна',    dolzhnost: 'Старший флорист',   stavka: 1500, pctVyruchka: 7, pctStazh: 5, status: 'активен' },
  { fio: 'Козлова Ольга Петровна',     dolzhnost: 'Кассир',            stavka:  900, pctVyruchka: 0, pctStazh: 2, status: 'активен' },
  { fio: 'Новикова Татьяна Дмитриевна',dolzhnost: 'Флорист',           stavka: 1100, pctVyruchka: 5, pctStazh: 0, status: 'неактивен' },
  { fio: 'Морозова Светлана Алексеевна',dolzhnost:'Администратор',     stavka: 1300, pctVyruchka: 2, pctStazh: 4, status: 'активен' },
];

const DEMO_TABEL = [
  { fio: 'Иванова Анна Сергеевна',      vyhody: 21, vyruchka: 85000,  otzyvy: 4, avans: 15000, uderzhaniya: 0 },
  { fio: 'Петрова Марина Олеговна',     vyhody: 18, vyruchka: 62000,  otzyvy: 2, avans: 10000, uderzhaniya: 500 },
  { fio: 'Сидорова Елена Ивановна',     vyhody: 22, vyruchka: 118000, otzyvy: 6, avans: 20000, uderzhaniya: 0 },
  { fio: 'Козлова Ольга Петровна',      vyhody: 20, vyruchka: 0,      otzyvy: 3, avans:  8000, uderzhaniya: 0 },
  // Новикова отсутствует — "нет данных"
  { fio: 'Морозова Светлана Алексеевна',vyhody: 22, vyruchka: 28000,  otzyvy: 5, avans: 12000, uderzhaniya: 1000 },
];

const DEMO_KPI = {
  period: 'апрель 2026',
  revPlan: 350000,
  revFact: 385000,
  writeoff: 22000,
};

/* ===== Core calculation =====
   Mirrors the recalc() function from the source HTML. */
function computeAll(sotrudniki, tabel, kpi) {
  const revFact   = Number(kpi.revFact)   || 0;
  const revPlan   = Number(kpi.revPlan)   || 0;
  const writeoff  = Number(kpi.writeoff)  || 0;

  const allowedWriteoff = revFact * 0.03;
  const planOk = writeoff <= allowedWriteoff;
  const bonusFund = planOk ? revFact * 0.01 : 0;

  const tabelMap = {};
  tabel.forEach(t => { tabelMap[t.fio.trim().toLowerCase()] = t; });

  const active = sotrudniki.filter(s => s.status.toLowerCase() !== 'неактивен');
  const bonusPerPerson = active.length && planOk ? bonusFund / active.length : 0;

  const rows = sotrudniki.map(s => {
    const t = tabelMap[s.fio.trim().toLowerCase()];
    const isActive = s.status.toLowerCase() !== 'неактивен';
    if (!t) {
      return { ...s, _nodata: true, _active: isActive, period: kpi.period };
    }
    const oplVyhody  = s.stavka * t.vyhody;
    const sumPct     = t.vyruchka * (s.pctVyruchka / 100);
    const oplOtzyvy  = t.otzyvy * 200;
    const nadStazh   = oplVyhody * (s.pctStazh / 100);
    const bonus      = isActive ? bonusPerPerson : 0;
    const nachisleno = oplVyhody + sumPct + oplOtzyvy + nadStazh + bonus;
    const vydacha    = nachisleno - t.avans - t.uderzhaniya;
    return {
      ...s, ...t,
      oplVyhody, sumPct, oplOtzyvy, nadStazh, bonus, nachisleno, vydacha,
      _nodata: false, _active: isActive,
      period: kpi.period,
      _revFact: revFact, _planOk: planOk,
      _bonusFund: bonusFund, _bonusPerPerson: bonusPerPerson,
      _activeCount: active.length,
    };
  });

  // Totals
  const totals = rows.filter(r => !r._nodata && r._active).reduce((acc, r) => {
    acc.fot      += r.nachisleno || 0;
    acc.vyruchka += r.vyruchka   || 0;
    acc.avans    += r.avans      || 0;
    acc.ud       += r.uderzhaniya|| 0;
    acc.vydacha  += r.vydacha    || 0;
    return acc;
  }, { fot: 0, vyruchka: 0, avans: 0, ud: 0, vydacha: 0 });
  totals.avgPay = totals.fot && rows.filter(r => !r._nodata && r._active).length
    ? totals.fot / rows.filter(r => !r._nodata && r._active).length : 0;
  totals.withBonus = rows.filter(r => (r.bonus || 0) > 0).length;
  totals.count = rows.length;
  totals.activeCount = active.length;

  return {
    rows,
    totals,
    kpi: {
      ...kpi,
      revFact, revPlan, writeoff,
      allowedWriteoff,
      planOk,
      revenuePlanOk: revFact >= revPlan,
      bonusFund,
      bonusPerPerson,
      activeCount: active.length,
      totalFot: totals.fot,
      fotPct: revFact > 0 ? (totals.fot / revFact * 100) : 0,
    },
  };
}

// ===== XLSX parsing (ported from original product) =====
function normKey(s) { return String(s || '').trim().toLowerCase(); }

function parsePeriod(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return cap(d.toLocaleString('ru-RU', { month: 'long', year: 'numeric' }));
  }
  const s = String(val).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return cap(d.toLocaleString('ru-RU', { month: 'long', year: 'numeric' }));
  const m1 = s.match(/^(\d{1,2})\.(\d{4})$/);
  if (m1) return cap(new Date(+m1[2], +m1[1] - 1, 1).toLocaleString('ru-RU', { month: 'long', year: 'numeric' }));
  const m2 = s.match(/^(\d{1,2})\.(\d{2})\.(\d{4})$/);
  if (m2) return cap(new Date(+m2[3], +m2[2] - 1, 1).toLocaleString('ru-RU', { month: 'long', year: 'numeric' }));
  return cap(s);
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// Excel хранит ячейки с форматом "%" как доли (0.04 = 4%).
// А вручную набранные числа — как есть (4 = 4%). Нормализуем — если число < 1, считаем долей.
function _normPercent(v) {
  const n = parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
  if (n > 0 && n < 1) return n * 100;
  return n;
}

function parseSotrudnikiFromRaw(raw) {
  return raw.map(r => {
    const keys = Object.keys(r);
    const get = (...variants) => {
      for (const v of variants) {
        const k = keys.find(k => normKey(k).includes(normKey(v)));
        if (k !== undefined && r[k] !== '') return r[k];
      }
      return '';
    };
    return {
      fio: String(get('фио', 'имя', 'сотрудник') || '').trim(),
      dolzhnost: String(get('должность') || '').trim(),
      stavka: parseFloat(String(get('ставка оклад', 'ставка', 'оклад') || 0).replace(/[^\d.]/g, '')) || 0,
      pctVyruchka: _normPercent(get('% с личной', '% с продаж', '% выручки', 'процент с личной', 'процент с продаж')),
      pctStazh: _normPercent(get('% за стаж', 'стаж')),
      status: String(get('статус') || 'активен').trim().toLowerCase(),
    };
  }).filter(s => s.fio);
}

function parseTabelFromRaw(raw) {
  return raw.map(r => {
    const keys = Object.keys(r);
    const get = (...variants) => {
      for (const v of variants) {
        const k = keys.find(k => normKey(k).includes(normKey(v)));
        if (k !== undefined && r[k] !== '') return r[k];
      }
      return '';
    };
    return {
      fio: String(get('фио', 'имя', 'сотрудник') || '').trim(),
      vyhody: parseFloat(String(get('выходы', 'дней', 'выход') || 0).replace(/[^\d.]/g, '')) || 0,
      vyruchka: parseFloat(String(get('выручка персональная', 'выручка без', 'персональная') || 0).replace(/[^\d.]/g, '')) || 0,
      otzyvy: parseFloat(String(get('доплата за отзывы', 'отзывы яндекс', 'отзывы') || 0).replace(/[^\d.]/g, '')) || 0,
      avans: parseFloat(String(get('аванс') || 0).replace(/[^\d.]/g, '')) || 0,
      period: parsePeriod(get('период')),
      uderzhaniya: parseFloat(String(get('прочие удержания', 'удержания', 'штрафы') || 0).replace(/[^\d.]/g, '')) || 0,
    };
  }).filter(s => s.fio);
}

// Чтение xlsx-файла → массив строк, готовых для setSotrudniki / setTabel
function readXlsxFile(file, kind) {
  return new Promise((resolve, reject) => {
    if (typeof XLSX === 'undefined') {
      reject(new Error('Библиотека xlsx ещё не загрузилась — обновите страницу.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const parsed = kind === 'sotrudniki' ? parseSotrudnikiFromRaw(raw) : parseTabelFromRaw(raw);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// CSV экспорт — порт логики из оригинала
function buildCsv(rows, period) {
  const headers = ['ФИО', 'Должность', 'Статус', 'Ставка/день', 'Отраб. дней', 'Опл. за дни', 'Выручка с продаж', '% с продаж', 'Σ % с продаж', '% стаж', 'Надбавка стаж', 'Отзывы Яндекс', 'Опл. отзывов', 'Бонус списания', 'Аванс', 'Удержания', 'Итого начислено', 'К выдаче'];
  const data = rows.filter(c => !c._nodata).map(c => [
    c.fio, c.dolzhnost, c._active ? 'активен' : 'неактивен',
    c.stavka, c.vyhody, Math.round(c.oplVyhody || 0),
    c.vyruchka || 0, c.pctVyruchka, Math.round(c.sumPct || 0),
    c.pctStazh, Math.round(c.nadStazh || 0),
    c.otzyvy || 0, Math.round(c.oplOtzyvy || 0),
    Math.round(c.bonus || 0), c.avans || 0, c.uderzhaniya || 0,
    Math.round(c.nachisleno || 0), Math.round(c.vydacha || 0)
  ]);
  const csv = [headers, ...data].map(r => r.map(v => `"${v}"`).join(';')).join('\n');
  return { csv: '﻿' + csv, filename: `zarplata_${period || 'mesyac'}.csv` };
}

// Универсальный «скачать blob» — на десктопе срабатывает download-атрибут,
// на iOS Safari подхватывается FileSaver.js (через Share → Files).
function _saveBlob(blob, filename) {
  if (typeof saveAs === 'function') {
    saveAs(blob, filename);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

function _saveWorkbook(wb, filename) {
  if (typeof XLSX === 'undefined') {
    alert('Библиотека xlsx ещё не загрузилась — обновите страницу.');
    return;
  }
  const data = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  _saveBlob(blob, filename);
}

function downloadCsv(rows, period) {
  const { csv, filename } = buildCsv(rows, period);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  _saveBlob(blob, filename);
}

// ===== XLSX стили =====
const MONEY_FMT = '#\\ ##0\\ "₽";-#\\ ##0\\ "₽"';
const PCT_FMT = '0"%"';
const INT_FMT = '#\\ ##0';

const STYLE_HEADER = {
  font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'B85320' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top:    { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left:   { style: 'thin', color: { rgb: '000000' } },
    right:  { style: 'thin', color: { rgb: '000000' } },
  },
};
const STYLE_TOTALS = {
  font: { bold: true, sz: 11, color: { rgb: '1A1410' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFE9D5' } },
  border: {
    top:    { style: 'medium', color: { rgb: '000000' } },
    bottom: { style: 'medium', color: { rgb: '000000' } },
  },
};
const STYLE_CELL = {
  border: {
    top:    { style: 'thin', color: { rgb: 'DDDDDD' } },
    bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
    left:   { style: 'thin', color: { rgb: 'EEEEEE' } },
    right:  { style: 'thin', color: { rgb: 'EEEEEE' } },
  },
};
const STYLE_LBL = { font: { bold: true, sz: 11 } };
const STYLE_BIG = { font: { bold: true, sz: 14, color: { rgb: 'B85320' } }, alignment: { horizontal: 'right' } };

function _setCell(ws, addr, value, options = {}) {
  const t = (typeof value === 'number') ? 'n' : 's';
  ws[addr] = { v: value, t };
  if (options.z) ws[addr].z = options.z;
  if (options.s) ws[addr].s = options.s;
}

function _colLetter(i) {
  let s = ''; let n = i;
  do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return s;
}

// ===== XLSX экспорт — общая ведомость =====
function downloadXlsxSummary(rows, period) {
  if (typeof XLSX === 'undefined') {
    alert('Библиотека xlsx ещё не загрузилась — обновите страницу.');
    return;
  }
  const headers = ['ФИО', 'Должность', 'Статус', 'Ставка/день', 'Отраб. дней', 'Опл. за дни', 'Выручка с продаж', '% с продаж', 'Σ % с продаж', '% стаж', 'Надбавка стаж', 'Отзывы Яндекс', 'Опл. отзывов', 'Бонус списания', 'Аванс', 'Удержания', 'Итого начислено', 'К выдаче'];
  const data = rows.filter(c => !c._nodata).map(c => [
    c.fio, c.dolzhnost, c._active ? 'активен' : 'неактивен',
    Number(c.stavka) || 0,
    Number(c.vyhody) || 0,
    Math.round(c.oplVyhody || 0),
    Number(c.vyruchka) || 0,
    Number(c.pctVyruchka) || 0,
    Math.round(c.sumPct || 0),
    Number(c.pctStazh) || 0,
    Math.round(c.nadStazh || 0),
    Number(c.otzyvy) || 0,
    Math.round(c.oplOtzyvy || 0),
    Math.round(c.bonus || 0),
    Number(c.avans) || 0,
    Number(c.uderzhaniya) || 0,
    Math.round(c.nachisleno || 0),
    Math.round(c.vydacha || 0)
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers]);
  // Применяем стиль заголовку
  headers.forEach((h, c) => {
    const addr = _colLetter(c) + '1';
    ws[addr] = { v: h, t: 's', s: STYLE_HEADER };
  });

  // Колонки с деньгами / процентами
  const moneyCols = new Set([3, 5, 6, 10, 12, 13, 14, 15, 16, 17]);
  const pctCols   = new Set([7, 9]);
  const sumCols   = new Set([8]); // Σ % — это сумма рублей

  // Данные
  data.forEach((row, i) => {
    row.forEach((v, c) => {
      const addr = _colLetter(c) + (i + 2);
      const s = { ...STYLE_CELL };
      if (i === 0) {} // overwrite handled later if needed
      let z;
      if (moneyCols.has(c) || sumCols.has(c)) z = MONEY_FMT;
      else if (pctCols.has(c)) z = PCT_FMT;
      else if (c === 4 || c === 11) z = INT_FMT;
      _setCell(ws, addr, v, { z, s });
    });
  });

  // Итоговая строка
  const totalRowIdx = data.length + 2; // +1 заголовок, +1 пустая строка
  const totalsRow = ['ИТОГО', '', '', '', '',
    data.reduce((s, r) => s + (r[5] || 0), 0),
    data.reduce((s, r) => s + (r[6] || 0), 0),
    '', data.reduce((s, r) => s + (r[8] || 0), 0),
    '', data.reduce((s, r) => s + (r[10] || 0), 0),
    data.reduce((s, r) => s + (r[11] || 0), 0),
    data.reduce((s, r) => s + (r[12] || 0), 0),
    data.reduce((s, r) => s + (r[13] || 0), 0),
    data.reduce((s, r) => s + (r[14] || 0), 0),
    data.reduce((s, r) => s + (r[15] || 0), 0),
    data.reduce((s, r) => s + (r[16] || 0), 0),
    data.reduce((s, r) => s + (r[17] || 0), 0)
  ];
  totalsRow.forEach((v, c) => {
    const addr = _colLetter(c) + (totalRowIdx + 1);
    const s = { ...STYLE_TOTALS };
    let z;
    if (moneyCols.has(c) || sumCols.has(c)) z = MONEY_FMT;
    else if (c === 4 || c === 11) z = INT_FMT;
    _setCell(ws, addr, v, { z, s });
  });

  // Атрибуция — пустая строка + подпись от калькулятора
  const attrRowIdx = totalRowIdx + 3; // +2 пустых строки после итогов
  const attr = 'Расчёт произведён с помощью AI-калькулятора Марии Андреевой';
  _setCell(ws, 'A' + (attrRowIdx + 1), attr, {
    s: { font: { italic: true, sz: 10, color: { rgb: 'B85320' } } }
  });
  ws['!merges'] = (ws['!merges'] || []).concat([{
    s: { r: attrRowIdx, c: 0 }, e: { r: attrRowIdx, c: headers.length - 1 }
  }]);

  // Расширение листа: A1 → последняя ячейка (включая атрибуцию)
  ws['!ref'] = `A1:${_colLetter(headers.length - 1)}${attrRowIdx + 1}`;
  ws['!cols'] = [
    { wch: 28 }, { wch: 18 }, { wch: 12 }, { wch: 13 }, { wch: 9 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 10 },
    { wch: 14 }, { wch: 15 }, { wch: 12 }, { wch: 13 }, { wch: 16 }, { wch: 15 }
  ];
  ws['!rows'] = [{ hpt: 28 }]; // заголовок повыше
  ws['!freeze'] = { xSplit: 1, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  const sheetName = ((period || 'Ведомость') + '').slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  _saveWorkbook(wb, `vedomost_${(period || 'mesyac').replace(/\s+/g, '_')}.xlsx`);
}

// ===== XLSX экспорт — расчётный лист одного сотрудника =====
function downloadXlsxSheet(row, period) {
  if (typeof XLSX === 'undefined') {
    alert('Библиотека xlsx ещё не загрузилась — обновите страницу.');
    return;
  }
  if (!row || row._nodata) {
    alert('Нет данных по этому сотруднику.');
    return;
  }
  const num = (n) => Math.round(Number(n) || 0);

  const ws = {};
  const set = (addr, v, opts = {}) => _setCell(ws, addr, v, opts);

  const TITLE = { font: { bold: true, sz: 16, color: { rgb: 'B85320' } } };
  const SECTION = {
    font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: '5A4A3A' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  };
  const LABEL = { font: { sz: 11 } };
  const SUBTOTAL = {
    font: { bold: true, sz: 12 },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFE9D5' } },
    border: { top: { style: 'medium', color: { rgb: '000000' } } },
  };
  const FINAL = {
    font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'E97A3A' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } },
  };

  // Шапка
  set('A1', 'РАСЧЁТНЫЙ ЛИСТ', { s: TITLE });
  set('A2', 'Период',     { s: LABEL });           set('B2', period || '', { s: { font: { bold: true } } });
  set('A3', 'Сотрудник',  { s: LABEL });           set('B3', row.fio, { s: { font: { bold: true } } });
  set('A4', 'Должность',  { s: LABEL });           set('B4', row.dolzhnost || '', { s: LABEL });
  set('A5', 'Статус',     { s: LABEL });           set('B5', row._active ? 'активен' : 'неактивен', { s: LABEL });

  // 1. Данные
  set('A7', '1. ДАННЫЕ', { s: SECTION });
  set('A8', 'Ставка / день',   { s: LABEL });     set('B8',  Number(row.stavka) || 0,    { z: MONEY_FMT });
  set('A9', 'Отработано дней',   { s: LABEL });     set('B9',  Number(row.vyhody) || 0,    { z: INT_FMT });
  set('A10', 'Выручка с продаж', { s: LABEL });     set('B10', Number(row.vyruchka) || 0,  { z: MONEY_FMT });
  set('A11', '% с продаж',       { s: LABEL });     set('B11', Number(row.pctVyruchka) || 0, { z: PCT_FMT });
  set('A12', '% за стаж',        { s: LABEL });     set('B12', Number(row.pctStazh) || 0,  { z: PCT_FMT });

  // 2. Начисления
  set('A14', '2. НАЧИСЛЕНИЯ', { s: SECTION });
  set('A15', 'Оплата за отработанные дни  (ставка × дни)',  { s: LABEL });  set('B15', num(row.oplVyhody),  { z: MONEY_FMT });
  set('A16', 'Процент с продаж  (выручка × % с продаж)',    { s: LABEL });  set('B16', num(row.sumPct),     { z: MONEY_FMT });
  set('A17', 'Оплата за отзывы на Яндекс',                   { s: LABEL });  set('B17', num(row.oplOtzyvy),  { z: MONEY_FMT });
  set('A18', 'Надбавка за стаж  (оплата за дни × % стажа)', { s: LABEL });  set('B18', num(row.nadStazh),   { z: MONEY_FMT });
  set('A19', 'Бонус по плану списания',                     { s: LABEL });  set('B19', num(row.bonus),      { z: MONEY_FMT });
  set('A20', 'ИТОГО НАЧИСЛЕНО', { s: SUBTOTAL });           set('B20', num(row.nachisleno), { z: MONEY_FMT, s: SUBTOTAL });

  // 3. Удержания
  set('A22', '3. УДЕРЖАНИЯ', { s: SECTION });
  set('A23', 'Аванс',                          { s: LABEL });   set('B23', -Math.abs(num(row.avans)),       { z: MONEY_FMT });
  set('A24', 'Прочие удержания и штрафы',      { s: LABEL });   set('B24', -Math.abs(num(row.uderzhaniya)), { z: MONEY_FMT });

  // Итог к выдаче
  set('A26', 'К ВЫДАЧЕ', { s: FINAL });        set('B26', num(row.vydacha), { z: MONEY_FMT, s: FINAL });

  // Атрибуция
  set('A28', 'Расчёт произведён с помощью AI-калькулятора Марии Андреевой', {
    s: { font: { italic: true, sz: 10, color: { rgb: 'B85320' } } }
  });

  ws['!ref'] = 'A1:B28';
  ws['!cols'] = [{ wch: 48 }, { wch: 22 }];
  ws['!rows'] = [];
  ws['!rows'][0] = { hpt: 26 };
  ws['!rows'][6] = { hpt: 22 };
  ws['!rows'][13] = { hpt: 22 };
  ws['!rows'][21] = { hpt: 22 };
  ws['!rows'][25] = { hpt: 32 };
  // Объединение заголовка и строки атрибуции
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 27, c: 0 }, e: { r: 27, c: 1 } }, // атрибуция на A28:B28
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = row.fio.split(' ').slice(0, 2).join(' ').slice(0, 31) || 'Лист';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const safe = row.fio.replace(/[^а-яёa-z0-9\s_-]/gi, '').replace(/\s+/g, '_').slice(0, 50);
  _saveWorkbook(wb, `raschet_${safe}_${(period || 'mesyac').replace(/\s+/g, '_')}.xlsx`);
}

// ===== PDF экспорт =====
// Под капотом html2pdf (html2canvas + jsPDF) — рисует чистый светлый макет на A4.
const PDF_BASE_STYLE = `
  font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
  color: #1A1410; background: #fff; padding: 32px; width: 720px;
`;

function _buildSheetHtml(row, period) {
  const fmt = (n) => fmtMoney(Math.round(Number(n) || 0));
  return `
    <div style="${PDF_BASE_STYLE}">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1A1410;padding-bottom:12px;margin-bottom:18px;">
        <div>
          <div style="font-size:11px;letter-spacing:.2em;color:#888;text-transform:uppercase;">Расчётный лист</div>
          <div style="font-size:26px;font-weight:600;margin-top:6px;">${row.fio}</div>
          <div style="font-size:13px;color:#666;margin-top:4px;">${row.dolzhnost || ''} · ${row._active ? 'активен' : 'неактивен'}</div>
        </div>
        <div style="text-align:right;font-size:13px;color:#666;">
          <div>Период</div>
          <div style="font-size:16px;color:#1A1410;font-weight:600;margin-top:2px;">${period || '—'}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
        <div><div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.1em;">Ставка / день</div><div style="font-size:15px;margin-top:2px;">${fmt(row.stavka)}</div></div>
        <div><div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.1em;">Отработано дней</div><div style="font-size:15px;margin-top:2px;">${Number(row.vyhody) || 0}</div></div>
        <div><div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.1em;">Выручка с продаж</div><div style="font-size:15px;margin-top:2px;">${fmt(row.vyruchka)}</div></div>
        <div><div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.1em;">% с продаж · % стаж</div><div style="font-size:15px;margin-top:2px;">${Number(row.pctVyruchka) || 0}% · ${Number(row.pctStazh) || 0}%</div></div>
      </div>

      <h3 style="font-size:14px;color:#B85320;text-transform:uppercase;letter-spacing:.1em;margin:18px 0 8px;">Начисления</h3>
      ${_pdfRow('Оплата за отработанные дни', `ставка × ${Number(row.vyhody) || 0} дн.`, fmt(row.oplVyhody))}
      ${_pdfRow('Процент с продаж', `${fmtMoney(row.vyruchka)} × ${Number(row.pctVyruchka) || 0}%`, fmt(row.sumPct))}
      ${_pdfRow('Оплата за отзывы на Яндекс', `${Number(row.otzyvy) || 0} × 200 ₽`, fmt(row.oplOtzyvy))}
      ${_pdfRow('Надбавка за стаж', `оплата за дни × ${Number(row.pctStazh) || 0}%`, fmt(row.nadStazh))}
      ${_pdfRow('Бонус по плану списания', row._planOk ? `${fmtMoney(row._bonusFund)} / ${row._activeCount} чел.` : 'план не выполнен', fmt(row.bonus))}
      ${_pdfRow('Итого начислено', '', fmt(row.nachisleno), true)}

      <h3 style="font-size:14px;color:#B85320;text-transform:uppercase;letter-spacing:.1em;margin:18px 0 8px;">Удержания</h3>
      ${_pdfRow('Аванс', '', '− ' + fmtMoney(Math.abs(Math.round(row.avans || 0))))}
      ${_pdfRow('Прочие удержания и штрафы', '', '− ' + fmtMoney(Math.abs(Math.round(row.uderzhaniya || 0))))}

      <div style="margin-top:24px;background:#FFF5EC;border:2px solid #E97A3A;border-radius:6px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#B85320;">К выдаче</div>
        <div style="font-size:34px;font-weight:700;color:#B85320;">${fmt(row.vydacha)}</div>
      </div>

      <div style="margin-top:24px;font-size:11px;color:#999;text-align:right;">Расчёт упрощённый — сверьтесь с бухгалтером перед выплатой.</div>
      <div style="margin-top:6px;font-size:11px;color:#B85320;text-align:right;font-style:italic;">Расчёт произведён с помощью AI-калькулятора Марии Андреевой</div>
    </div>
  `;
}
function _pdfRow(lbl, formula, amt, total) {
  return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px ${total ? 'solid #1A1410' : 'dotted #ddd'};${total ? 'font-weight:700;margin-top:6px;' : ''}">
    <span><span style="color:${total ? '#1A1410' : '#444'};">${lbl}</span>${formula ? `<span style="color:#999;font-style:italic;font-size:12px;margin-left:8px;">${formula}</span>` : ''}</span>
    <span style="font-variant-numeric:tabular-nums;">${amt}</span>
  </div>`;
}

function _buildSummaryHtml(rows, period, totals) {
  const fmt = (n) => fmtMoney(Math.round(Number(n) || 0));
  const visibleRows = rows.filter(c => !c._nodata);
  return `
    <div style="${PDF_BASE_STYLE} width:1000px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1A1410;padding-bottom:12px;margin-bottom:18px;">
        <div>
          <div style="font-size:11px;letter-spacing:.2em;color:#888;text-transform:uppercase;">Сводная ведомость · цветочный магазин</div>
          <div style="font-size:26px;font-weight:600;margin-top:6px;">Расчёт зарплаты</div>
        </div>
        <div style="text-align:right;font-size:13px;color:#666;">
          <div>Период</div>
          <div style="font-size:16px;color:#1A1410;font-weight:600;margin-top:2px;">${period || '—'}</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
          <tr style="background:#F5EFE6;color:#5A4A3A;text-transform:uppercase;letter-spacing:.05em;">
            <th style="padding:8px 6px;text-align:left;border-bottom:1px solid #B85320;">ФИО</th>
            <th style="padding:8px 6px;text-align:left;border-bottom:1px solid #B85320;">Должность</th>
            <th style="padding:8px 6px;text-align:right;border-bottom:1px solid #B85320;">Отраб. дней</th>
            <th style="padding:8px 6px;text-align:right;border-bottom:1px solid #B85320;">Оплата за дни</th>
            <th style="padding:8px 6px;text-align:right;border-bottom:1px solid #B85320;">Σ %</th>
            <th style="padding:8px 6px;text-align:right;border-bottom:1px solid #B85320;">Бонусы</th>
            <th style="padding:8px 6px;text-align:right;border-bottom:1px solid #B85320;">Удержания</th>
            <th style="padding:8px 6px;text-align:right;border-bottom:1px solid #B85320;">Начислено</th>
            <th style="padding:8px 6px;text-align:right;border-bottom:1px solid #B85320;color:#B85320;font-weight:700;">К выдаче</th>
          </tr>
        </thead>
        <tbody>
          ${visibleRows.map(c => `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:7px 6px;">${c.fio}</td>
              <td style="padding:7px 6px;color:#666;">${c.dolzhnost || ''}</td>
              <td style="padding:7px 6px;text-align:right;">${Number(c.vyhody) || 0}</td>
              <td style="padding:7px 6px;text-align:right;font-variant-numeric:tabular-nums;">${fmt(c.oplVyhody)}</td>
              <td style="padding:7px 6px;text-align:right;font-variant-numeric:tabular-nums;">${fmt(c.sumPct)}</td>
              <td style="padding:7px 6px;text-align:right;font-variant-numeric:tabular-nums;">${fmt((c.oplOtzyvy||0)+(c.nadStazh||0)+(c.bonus||0))}</td>
              <td style="padding:7px 6px;text-align:right;color:#888;font-variant-numeric:tabular-nums;">− ${fmtMoney(Math.abs(Math.round((c.avans||0)+(c.uderzhaniya||0))))}</td>
              <td style="padding:7px 6px;text-align:right;font-variant-numeric:tabular-nums;">${fmt(c.nachisleno)}</td>
              <td style="padding:7px 6px;text-align:right;font-weight:700;color:#B85320;font-variant-numeric:tabular-nums;">${fmt(c.vydacha)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background:#FFF5EC;font-weight:700;">
            <td colspan="7" style="padding:10px 6px;text-align:right;text-transform:uppercase;letter-spacing:.1em;font-size:10px;">Итого · ${visibleRows.length} чел.</td>
            <td style="padding:10px 6px;text-align:right;font-variant-numeric:tabular-nums;">${fmt(totals.nachisleno)}</td>
            <td style="padding:10px 6px;text-align:right;font-variant-numeric:tabular-nums;color:#B85320;">${fmt(totals.vydacha)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:18px;font-size:11px;color:#999;text-align:right;">Расчёт упрощённый — сверьтесь с бухгалтером перед выплатой.</div>
      <div style="margin-top:6px;font-size:11px;color:#B85320;text-align:right;font-style:italic;">Расчёт произведён с помощью AI-калькулятора Марии Андреевой</div>
    </div>
  `;
}

function _renderPdf(html, filename, orientation = 'portrait') {
  // Открываем подготовленный макет в новом окне и вызываем нативную печать.
  // В диалоге печати пользователь выбирает «Сохранить как PDF» — получает чистый
  // PDF со 100% корректным Cyrillic, любыми flex/grid и без растеризации.
  const title = filename.replace(/\.pdf$/i, '');
  const win = window.open('', '_blank');
  if (!win) {
    alert(
      'Браузер заблокировал открытие окна с PDF.\n' +
      'Разрешите всплывающие окна для этого сайта и попробуйте снова.'
    );
    return;
  }
  const page = orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait';
  win.document.write(
    '<!DOCTYPE html>' +
    '<html lang="ru"><head>' +
    '<meta charset="utf-8">' +
    '<title>' + title + '</title>' +
    '<style>' +
      '@page { size: ' + page + '; margin: 14mm; }' +
      '*{ box-sizing: border-box; }' +
      'html,body{ margin:0; padding:0; background:#fff; color:#1A1410;' +
        " font-family: -apple-system, 'Segoe UI', Arial, sans-serif; }" +
      '@media print { .no-print { display:none !important; } }' +
      '.print-hint { position:fixed; top:14px; left:14px; right:14px;' +
        ' background:#1A1410; color:#fff; padding:14px 18px; border-radius:8px;' +
        ' font-size:14px; z-index:9999; box-shadow:0 4px 16px rgba(0,0,0,.25); }' +
      '.print-hint b { color:#E97A3A; }' +
    '</style>' +
    '</head><body>' +
    '<div class="print-hint no-print">' +
      '⌘ + P → <b>Сохранить как PDF</b> · окно закроется автоматически' +
    '</div>' +
    html +
    '<script>' +
      'window.addEventListener("load", function(){' +
        'setTimeout(function(){' +
          'window.focus();' +
          'window.print();' +
          'setTimeout(function(){ window.close(); }, 800);' +
        '}, 350);' +
      '});' +
    '</script>' +
    '</body></html>'
  );
  win.document.close();
}

function downloadPdfSummary(rows, period, totals) {
  if (!rows.length) { alert('Нет данных для экспорта.'); return; }
  // Сводная ведомость шире — печатаем в альбомной ориентации
  _renderPdf(_buildSummaryHtml(rows, period, totals), `vedomost_${(period || 'mesyac').replace(/\s+/g, '_')}.pdf`, 'landscape');
}

// ===== XLSX шаблоны =====
function _templateHeaderStyle() {
  return {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'B85320' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top:    { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left:   { style: 'thin', color: { rgb: '000000' } },
      right:  { style: 'thin', color: { rgb: '000000' } },
    },
  };
}
function _templateCellStyle() {
  return {
    border: {
      top:    { style: 'thin', color: { rgb: 'DDDDDD' } },
      bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
      left:   { style: 'thin', color: { rgb: 'EEEEEE' } },
      right:  { style: 'thin', color: { rgb: 'EEEEEE' } },
    },
  };
}

function _buildTemplateSheet(headers, rows, colsCfg, formats = {}) {
  const ws = {};
  const HSTYLE = _templateHeaderStyle();
  const CSTYLE = _templateCellStyle();

  headers.forEach((h, c) => {
    const addr = _colLetter(c) + '1';
    ws[addr] = { v: h, t: 's', s: HSTYLE };
  });
  rows.forEach((row, i) => {
    row.forEach((v, c) => {
      const addr = _colLetter(c) + (i + 2);
      const t = (typeof v === 'number') ? 'n' : 's';
      const cell = { v, t, s: CSTYLE };
      if (formats[c]) cell.z = formats[c];
      ws[addr] = cell;
    });
  });
  ws['!ref'] = `A1:${_colLetter(headers.length - 1)}${rows.length + 1}`;
  ws['!cols'] = colsCfg;
  ws['!rows'] = [{ hpt: 28 }];
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  return ws;
}

function downloadTemplateSotrudniki() {
  if (typeof XLSX === 'undefined') {
    alert('Библиотека xlsx ещё не загрузилась — обновите страницу.');
    return;
  }
  const headers = ['ФИО', 'Должность', 'Ставка/день', '% с продаж', '% за стаж', 'Статус'];
  const rows = [
    ['Иванова А. С.', 'Старший флорист', 1800, 8, 5, 'активный'],
    ['Петрова М. И.', 'Флорист',         1500, 6, 0, 'активный'],
    ['Сидорова Е. П.','Флорист',         1500, 6, 0, 'неактивный'],
  ];
  const colsCfg = [{ wch: 26 }, { wch: 20 }, { wch: 13 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
  const formats = { 2: MONEY_FMT, 3: PCT_FMT, 4: PCT_FMT };
  const ws = _buildTemplateSheet(headers, rows, colsCfg, formats);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Справочник');
  _saveWorkbook(wb, 'Шаблон — Справочник сотрудников.xlsx');
}

function downloadTemplateTabel() {
  if (typeof XLSX === 'undefined') {
    alert('Библиотека xlsx ещё не загрузилась — обновите страницу.');
    return;
  }
  const headers = ['ФИО', 'Отработано дней', 'Выручка с продаж', 'Отзывы на Яндекс', 'Аванс', 'Штрафы', 'Период'];
  const rows = [
    ['Иванова А. С.', 14, 320000, 7, 15000, 0,    'Апрель 2026'],
    ['Петрова М. И.', 12, 180000, 3, 10000, 500,  'Апрель 2026'],
  ];
  const colsCfg = [{ wch: 26 }, { wch: 16 }, { wch: 18 }, { wch: 17 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];
  const formats = { 1: INT_FMT, 2: MONEY_FMT, 3: INT_FMT, 4: MONEY_FMT, 5: MONEY_FMT };
  const ws = _buildTemplateSheet(headers, rows, colsCfg, formats);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Табель');
  _saveWorkbook(wb, 'Шаблон — Табель за месяц.xlsx');
}

function downloadPdfSheet(row, period) {
  if (!row || row._nodata) { alert('Нет данных по этому сотруднику.'); return; }
  const safe = row.fio.replace(/[^а-яёa-z0-9\s_-]/gi, '').replace(/\s+/g, '_').slice(0, 50);
  _renderPdf(_buildSheetHtml(row, period), `raschet_${safe}_${(period || 'mesyac').replace(/\s+/g, '_')}.pdf`);
}

Object.assign(window, {
  fmtMoney, fmtNum, fmtPct,
  DEMO_SOTRUDNIKI, DEMO_TABEL, DEMO_KPI,
  computeAll,
  readXlsxFile, downloadCsv, parsePeriod,
  downloadXlsxSummary, downloadXlsxSheet,
  downloadPdfSheet, downloadPdfSummary,
  downloadTemplateSotrudniki, downloadTemplateTabel,
});
