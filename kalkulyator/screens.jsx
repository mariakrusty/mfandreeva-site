// Калькулятор ЗП — major screen sections
// UploadZone · KpiBlock · ControlsBar · EmployeesTable · SummaryBlock · SheetModal

const { useState: useS, useMemo: useM } = React;

/* ============================================================
   UploadZone — two file tiles + demo data button
   ============================================================ */
function HowItWorks() {
  const [open, setOpen] = useS(false);
  return (
    <GlassCard className={`how-card ${open ? 'how-card--open' : ''}`}>
      <button type="button" className="how-toggle" onClick={() => setOpen(o => !o)}>
        <Icon name="info" size={16} />
        <span className="how-toggle-text">Как работает калькулятор</span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
      </button>

      {open && (
        <div className="how-body">
          <p className="how-lead">
            Калькулятор работает с <strong>двумя простыми табличками</strong>, которые вы заполняете за 5 минут
            из своей базы данных. Связывает их по ФИО, считает зарплату и формирует расчётные листы.
          </p>

          <div className="how-table-pair">
            <div>
              <div className="how-table-title">→ Справочник сотрудников</div>
              <div className="how-table-sub">Постоянный · один раз настроили — пользуетесь</div>
              <div className="how-table-wrap">
                <table className="how-table">
                  <thead><tr>
                    <th>ФИО</th><th>Должность</th><th className="r">Ставка/день</th><th className="r">% с продаж</th><th className="r">% за стаж</th><th>Статус</th>
                  </tr></thead>
                  <tbody>
                    <tr><td>Иванова А.</td><td>Старший флорист</td><td className="r">1 800 ₽</td><td className="r">8%</td><td className="r">5%</td><td>активный</td></tr>
                    <tr><td>Петрова М.</td><td>Флорист</td><td className="r">1 500 ₽</td><td className="r">6%</td><td className="r">0%</td><td>активный</td></tr>
                  </tbody>
                </table>
              </div>
              <a
                className="how-template-btn"
                href="templates/Шаблон — Справочник сотрудников.xlsx"
                download="Шаблон — Справочник сотрудников.xlsx"
              >
                <Icon name="download" size={14} />
                <span>Скачать шаблон Excel</span>
              </a>
            </div>

            <div>
              <div className="how-table-title">→ Табель за месяц</div>
              <div className="how-table-sub">Обновляете в конце каждого месяца</div>
              <div className="how-table-wrap">
                <table className="how-table">
                  <thead><tr>
                    <th>ФИО</th><th className="r">Отраб. дней</th><th className="r">Выручка с продаж</th><th className="r">Отзывы Яндекс</th><th className="r">Аванс</th><th className="r">Штрафы</th>
                  </tr></thead>
                  <tbody>
                    <tr><td>Иванова А.</td><td className="r">14</td><td className="r">320 000 ₽</td><td className="r">7</td><td className="r">15 000 ₽</td><td className="r">0 ₽</td></tr>
                    <tr><td>Петрова М.</td><td className="r">12</td><td className="r">180 000 ₽</td><td className="r">3</td><td className="r">10 000 ₽</td><td className="r">500 ₽</td></tr>
                  </tbody>
                </table>
              </div>
              <a
                className="how-template-btn"
                href="templates/Шаблон — Табель за месяц.xlsx"
                download="Шаблон — Табель за месяц.xlsx"
              >
                <Icon name="download" size={14} />
                <span>Скачать шаблон Excel</span>
              </a>
            </div>
          </div>

          <ul className="how-notes">
            <li>Калькулятор связывает таблички <strong>по ФИО</strong>.</li>
            <li><strong>Неактивные</strong> сотрудники в расчёт не идут.</li>
            <li>Если сотрудник есть в справочнике, но нет в табеле — статус <strong>«нет данных за месяц»</strong>.</li>
          </ul>
        </div>
      )}
    </GlassCard>
  );
}

function UploadZone({ loaded, mode, sotrudnikiInfo, tabelInfo, onUploadSotrudniki, onUploadTabel, onLoadDemo, onReset }) {
  const sotRef = React.useRef(null);
  const tabRef = React.useRef(null);

  const handleFile = (e, fn) => {
    const f = e.target.files && e.target.files[0];
    if (f) fn(f);
    e.target.value = '';
  };

  return (
    <GlassCard className="upload-zone">
      <label className={`upload-tile clickable ${sotrudnikiInfo ? 'ok' : ''}`}>
        <div className="upload-tile-icon">
          <Icon name={sotrudnikiInfo ? 'check' : 'file-spreadsheet'} size={18} />
        </div>
        <div className="upload-tile-text">
          <div className="upload-tile-name">Справочник сотрудников</div>
          <div className="upload-tile-status">{sotrudnikiInfo || 'sotrudniki.xlsx — нажмите, чтобы выбрать'}</div>
        </div>
        <input ref={sotRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
               onChange={(e) => handleFile(e, onUploadSotrudniki)} />
      </label>

      <label className={`upload-tile clickable ${tabelInfo ? 'ok' : ''}`}>
        <div className="upload-tile-icon">
          <Icon name={tabelInfo ? 'check' : 'calendar-days'} size={18} />
        </div>
        <div className="upload-tile-text">
          <div className="upload-tile-name">Табель с выручкой</div>
          <div className="upload-tile-status">{tabelInfo || 'tabel-s-vyruchkoi.xlsx — нажмите, чтобы выбрать'}</div>
        </div>
        <input ref={tabRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
               onChange={(e) => handleFile(e, onUploadTabel)} />
      </label>

      <div className="upload-demo-col">
        <Micro>{loaded ? (mode === 'real' ? 'Загружено' : 'Демо') : 'Без файлов'}</Micro>
        {loaded ? (
          <Button variant="secondary" size="sm" icon="rotate-ccw" onClick={onReset}>
            Сбросить
          </Button>
        ) : (
          <Button variant="primary" size="sm" icon="zap" onClick={onLoadDemo}>
            Загрузить демо
          </Button>
        )}
      </div>
    </GlassCard>
  );
}

/* ============================================================
   KpiBlock — period inputs + 8 KPI cards
   ============================================================ */
function KpiBlock({ kpi, onKpiChange, computed }) {
  return (
    <GlassCard>
      <div className="kpi-inputs">
        <Field label="Период">
          <input
            className="input"
            value={kpi.period}
            onChange={e => onKpiChange({ ...kpi, period: e.target.value })}
            placeholder="апрель 2026"
          />
        </Field>
        <Field label="План выручки">
          <MoneyInput value={kpi.revPlan} onChange={v => onKpiChange({ ...kpi, revPlan: v })} placeholder="0 ₽" />
        </Field>
        <Field label="Выручка факт">
          <MoneyInput value={kpi.revFact} onChange={v => onKpiChange({ ...kpi, revFact: v })} placeholder="0 ₽" />
        </Field>
        <Field label="Списание факт">
          <MoneyInput value={kpi.writeoff} onChange={v => onKpiChange({ ...kpi, writeoff: v })} placeholder="0 ₽" />
        </Field>
      </div>

      <div className="kpi-cards">
        <Kpi label="Выручка факт" value={fmtMoney(computed.revFact)} />
        <Kpi label="План выручки"
             value={computed.revenuePlanOk ? 'Выполнен' : 'Не выполнен'}
             tone={computed.revenuePlanOk ? 'success' : 'error'}
             valueSm />
        <Kpi label="Допустимое списание (3%)" value={fmtMoney(computed.allowedWriteoff)} />
        <Kpi label="План по списанию"
             value={computed.planOk ? 'Выполнен' : 'Превышен'}
             tone={computed.planOk ? 'success' : 'error'}
             valueSm />
        <Kpi label="Бонусный фонд"
             value={fmtMoney(computed.bonusFund)}
             tone={computed.planOk ? 'glow' : undefined} />
        <Kpi label="Бонус на сотрудника" value={fmtMoney(computed.bonusPerPerson)} />
        <Kpi label="Активных сотрудников" value={String(computed.activeCount)} />
        <Kpi label="Общий ФОТ" value={fmtMoney(computed.totalFot)} />
      </div>
    </GlassCard>
  );
}

function Kpi({ label, value, tone, valueSm }) {
  const cls = `kpi${tone ? ' ' + tone : ''}`;
  return (
    <div className={cls}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${valueSm ? 'kpi-value-sm' : ''}`}>{value}</div>
    </div>
  );
}

/* ============================================================
   ControlsBar — search, filters, sort, export
   ============================================================ */
function ControlsBar({ search, onSearch, filterDol, onFilterDol, filterStatus, onFilterStatus, sort, onSort, dolzhnosti, onExportExcel, onExportPdf }) {
  return (
    <div className="controls">
      <TextInput value={search} onChange={onSearch} placeholder="Поиск по ФИО" icon="search" />
      <select className="select" value={filterDol} onChange={e => onFilterDol(e.target.value)}>
        <option value="">Все должности</option>
        {dolzhnosti.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <select className="select" value={filterStatus} onChange={e => onFilterStatus(e.target.value)}>
        <option value="">Все статусы</option>
        <option value="активен">Активные</option>
        <option value="неактивен">Неактивные</option>
      </select>
      <select className="select" value={sort} onChange={e => onSort(e.target.value)}>
        <option value="">Сортировка: по умолчанию</option>
        <option value="fio">По ФИО</option>
        <option value="dolzhnost">По должности</option>
        <option value="vyruchka">По выручке ↓</option>
        <option value="nachisleno">По начислению ↓</option>
        <option value="vydacha">К выдаче ↓</option>
      </select>
      <div className="ml-auto" style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" icon="file-spreadsheet" onClick={onExportExcel}>Скачать Excel</Button>
        <Button variant="secondary" icon="file-text" onClick={onExportPdf}>Скачать PDF</Button>
      </div>
    </div>
  );
}

/* ============================================================
   EmployeesTable
   ============================================================ */
function EmployeesTable({ rows, onOpenSheet }) {
  if (!rows.length) {
    return (
      <div className="table-wrap" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
        Никто не найден по этим фильтрам.
      </div>
    );
  }
  return (
    <div className="table-wrap">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Статус</th>
              <th className="right">Отраб. дней</th>
              <th className="right">Оплата за дни</th>
              <th className="right">Σ %</th>
              <th className="right">Бонусы</th>
              <th className="right">Удержания</th>
              <th className="right">Начислено</th>
              <th className="right">К&nbsp;выдаче</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <EmployeeRow key={r.fio} row={r} onOpenSheet={() => onOpenSheet(i)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmployeeRow({ row, onOpenSheet }) {
  if (row._nodata) {
    return (
      <tr className="nodata">
        <td>
          <div className="cell-fio">
            <div className="cell-fio-name">{shortName(row.fio)}</div>
            <div className="cell-fio-role">{row.dolzhnost}</div>
          </div>
        </td>
        <td><Chip tone="warn" dot>Нет данных</Chip></td>
        <td colSpan="7" className="muted">Нет записей в табеле за этот период</td>
        <td className="cell-action"><button onClick={onOpenSheet}>Лист →</button></td>
      </tr>
    );
  }
  const bonuses = (row.oplOtzyvy || 0) + (row.nadStazh || 0) + (row.bonus || 0);
  const withholds = (row.avans || 0) + (row.uderzhaniya || 0);
  return (
    <tr className={row._active ? '' : 'inactive'}>
      <td>
        <div className="cell-fio">
          <div className="cell-fio-name">{shortName(row.fio)}</div>
          <div className="cell-fio-role">{row.dolzhnost}</div>
        </div>
      </td>
      <td>
        {row._active
          ? <Chip tone="success" dot>Активен</Chip>
          : <Chip tone="mute" dot>Неактивен</Chip>}
      </td>
      <td className="right">{row.vyhody}</td>
      <td className="right">{fmtMoney(row.oplVyhody)}</td>
      <td className="right">{fmtMoney(row.sumPct)}</td>
      <td className="right">{fmtMoney(bonuses)}</td>
      <td className="right muted">−{fmtMoney(withholds).replace('−','')}</td>
      <td className="right">{fmtMoney(row.nachisleno)}</td>
      <td className="right net">{fmtMoney(row.vydacha)}</td>
      <td className="cell-action"><button onClick={onOpenSheet}>Лист →</button></td>
    </tr>
  );
}

function shortName(fio) {
  // "Иванова Анна Сергеевна" → "Иванова А.С."
  const parts = fio.trim().split(/\s+/);
  if (parts.length < 2) return fio;
  const last = parts[0];
  const initials = parts.slice(1).map(p => p.charAt(0) + '.').join('\u00A0');
  return `${last} ${initials}`;
}

/* ============================================================
   SummaryBlock
   ============================================================ */
function SummaryBlock({ totals }) {
  const items = [
    { l: 'Общий ФОТ',             v: fmtMoney(totals.fot) },
    { l: 'Личная выручка (Σ)',    v: fmtMoney(totals.vyruchka) },
    { l: 'Средняя выплата',       v: fmtMoney(totals.avgPay) },
    { l: 'Сумма авансов',         v: fmtMoney(totals.avans) },
    { l: 'Сумма удержаний',       v: fmtMoney(totals.ud) },
    { l: 'К выдаче (всего)',      v: fmtMoney(totals.vydacha) },
    { l: 'Сотрудников',           v: `${totals.activeCount} / ${totals.count}` },
    { l: 'С бонусом по списанию', v: String(totals.withBonus) },
  ];
  return (
    <GlassCard className="summary">
      <div className="summary-grid">
        {items.map(it => (
          <div key={it.l} className="s-item">
            <div className="s-label">{it.l}</div>
            <div className="s-value">{it.v}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ============================================================
   SheetModal — расчётный лист per employee
   ============================================================ */
function SheetModal({ row, onClose, onExportExcel, onExportPdf }) {
  if (!row) return null;
  const isOpen = !!row;
  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={e => {
      if (e.target.classList.contains('modal-overlay')) onClose();
    }}>
      <div className="modal">
        <div className="modal-head">
          <div className="modal-eyebrow">Расчётный лист</div>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-title">{row.fio}</div>
          <div className="modal-sub">{row.dolzhnost} · {row.period || '—'}</div>

          {row._nodata ? (
            <div style={{ padding: '32px 0', color: 'var(--text-3)', textAlign: 'center', fontStyle: 'italic' }}>
              Нет данных для расчёта за этот период.
            </div>
          ) : (
            <>
              <SheetSection title="1. Основные данные">
                <SheetRow l="Ставка за день"          amt={fmtMoney(row.stavka)} />
                <SheetRow l="Рабочих дней"               amt={String(row.vyhody)} />
                <SheetRow l="Личная выручка"          amt={fmtMoney(row.vyruchka)} />
                <SheetRow l="% с выручки"                amt={fmtPct(row.pctVyruchka)} />
                <SheetRow l="Надбавка за стаж"        amt={fmtPct(row.pctStazh)} />
              </SheetSection>

              <SheetSection title="2. Начисления">
                <SheetRow l="Оплата за отработанные дни" f={`${fmtNum(row.stavka)} × ${row.vyhody} дн.`}
                          amt={fmtMoney(row.oplVyhody)} />
                <SheetRow l="Процент с продаж" f={`${fmtMoney(row.vyruchka)} × ${fmtPct(row.pctVyruchka)}`}
                          amt={fmtMoney(row.sumPct)} />
                <SheetRow l="Оплата за отзывы на Яндекс" f={`${row.otzyvy} × 200 ₽`}
                          amt={fmtMoney(row.oplOtzyvy)} />
                <SheetRow l="Надбавка за стаж" f={`оплата за дни × ${fmtPct(row.pctStazh)}`}
                          amt={fmtMoney(row.nadStazh)} />
                <SheetRow l="Бонус по плану списания"
                          f={row._planOk ? `${fmtMoney(row._bonusFund)} / ${row._activeCount} чел.` : 'план не выполнен'}
                          amt={fmtMoney(row.bonus)} />
                <SheetRow total l="Итого начислено" amt={fmtMoney(row.nachisleno)} />
              </SheetSection>

              <SheetSection title="3. Удержания">
                <SheetRow l="Аванс"                       amt={'− ' + fmtMoney(row.avans).replace('−','')} />
                <SheetRow l="Прочие удержания и штрафы"   amt={'− ' + fmtMoney(row.uderzhaniya).replace('−','')} />
              </SheetSection>

              <div className="sheet-net">
                <div className="lbl">К выдаче</div>
                <div className="amt">{fmtMoney(row.vydacha)}</div>
              </div>

              <div className="print-attribution">
                Расчёт произведён с помощью AI-калькулятора Марии Андреевой
              </div>
            </>
          )}
        </div>

        <div className="modal-actions">
          <Button variant="primary"   icon="printer"          onClick={() => window.print()}>Распечатать</Button>
          <Button variant="secondary" icon="file-spreadsheet" onClick={onExportExcel}>Скачать Excel</Button>
          <Button variant="secondary" icon="file-text"        onClick={onExportPdf}>Скачать PDF</Button>
          <Button variant="ghost" onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    </div>
  );
}

function SheetSection({ title, children }) {
  return (
    <div className="sheet-section">
      <h4>{title}</h4>
      {children}
    </div>
  );
}
function SheetRow({ l, f, amt, total }) {
  return (
    <div className={`sheet-row ${total ? 'total' : ''}`}>
      <span className="lbl">
        {l}
        {f ? <span className="formula"> {f}</span> : null}
      </span>
      <span className="amt">{amt}</span>
    </div>
  );
}

Object.assign(window, {
  HowItWorks, UploadZone, KpiBlock, ControlsBar, EmployeesTable, SummaryBlock, SheetModal,
});
