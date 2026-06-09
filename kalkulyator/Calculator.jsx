// Калькулятор ЗП — top-level App
// Composes: corner micro-labels, header, upload zone, KPI block,
// controls + employees table, summary, sheet modal.

const { useState, useMemo, useCallback, useEffect } = React;

function App() {
  // Стартуем с пустого экрана — пользователь выбирает: загрузить файлы или демо.
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState('empty');             // 'empty' | 'demo' | 'real'
  const [sotrudniki, setSotrudniki] = useState([]);
  const [tabel, setTabel] = useState([]);
  const [kpi, setKpi] = useState({ period: '', revPlan: '', revFact: '', writeoff: '' });
  const [sotrudnikiInfo, setSotrudnikiInfo] = useState('');
  const [tabelInfo, setTabelInfo] = useState('');

  // Controls state
  const [search, setSearch] = useState('');
  const [filterDol, setFilterDol] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState('');

  // Sheet modal
  const [sheetRow, setSheetRow] = useState(null);

  const computed = useMemo(
    () => computeAll(sotrudniki, tabel, kpi),
    [sotrudniki, tabel, kpi]
  );

  const dolzhnosti = useMemo(
    () => [...new Set(sotrudniki.map(s => s.dolzhnost).filter(Boolean))],
    [sotrudniki]
  );

  const filteredRows = useMemo(() => {
    let data = computed.rows.slice();
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r => r.fio.toLowerCase().includes(q));
    }
    if (filterDol) data = data.filter(r => r.dolzhnost === filterDol);
    if (filterStatus === 'активен')    data = data.filter(r => r._active);
    if (filterStatus === 'неактивен')  data = data.filter(r => !r._active);
    if (sort === 'fio')         data.sort((a, b) => a.fio.localeCompare(b.fio, 'ru'));
    if (sort === 'dolzhnost')   data.sort((a, b) => a.dolzhnost.localeCompare(b.dolzhnost, 'ru'));
    if (sort === 'vyruchka')    data.sort((a, b) => (b.vyruchka || 0)   - (a.vyruchka || 0));
    if (sort === 'nachisleno')  data.sort((a, b) => (b.nachisleno || 0) - (a.nachisleno || 0));
    if (sort === 'vydacha')     data.sort((a, b) => (b.vydacha || 0)    - (a.vydacha || 0));
    return data;
  }, [computed.rows, search, filterDol, filterStatus, sort]);

  const handleLoadDemo = useCallback(() => {
    setSotrudniki(DEMO_SOTRUDNIKI);
    setTabel(DEMO_TABEL);
    setKpi(DEMO_KPI);
    setSotrudnikiInfo(`Демо · ${DEMO_SOTRUDNIKI.length} сотрудников`);
    setTabelInfo(`Демо · ${DEMO_TABEL.length} записей`);
    setLoaded(true);
    setMode('demo');
  }, []);
  const handleReset = useCallback(() => {
    setSotrudniki([]);
    setTabel([]);
    setKpi({ period: '', revPlan: '', revFact: '', writeoff: '' });
    setSotrudnikiInfo('');
    setTabelInfo('');
    setLoaded(false);
    setMode('empty');
    setSearch(''); setFilterDol(''); setFilterStatus(''); setSort('');
  }, []);

  const handleUploadSotrudniki = useCallback(async (file) => {
    try {
      const data = await readXlsxFile(file, 'sotrudniki');
      if (!data.length) throw new Error('В файле нет строк с ФИО');
      setSotrudniki(data);
      setSotrudnikiInfo(`✓ Загружено: ${data.length} сотрудников`);
      setMode('real');
      setLoaded(true);
    } catch (err) {
      alert('Ошибка чтения справочника: ' + (err.message || err));
    }
  }, []);

  const handleUploadTabel = useCallback(async (file) => {
    try {
      const data = await readXlsxFile(file, 'tabel');
      if (!data.length) throw new Error('В файле нет строк с ФИО');
      setTabel(data);
      setTabelInfo(`✓ Загружено: ${data.length} записей`);
      if (data[0] && data[0].period) {
        setKpi(prev => ({ ...prev, period: data[0].period }));
      }
      setMode('real');
      setLoaded(true);
    } catch (err) {
      alert('Ошибка чтения табеля: ' + (err.message || err));
    }
  }, []);

  const handleExportExcel = useCallback(() => {
    if (!filteredRows.length) { alert('Нет данных для экспорта.'); return; }
    downloadXlsxSummary(filteredRows, kpi.period);
  }, [filteredRows, kpi.period]);

  const handleExportPdf = useCallback(() => {
    if (!filteredRows.length) { alert('Нет данных для экспорта.'); return; }
    downloadPdfSummary(filteredRows, kpi.period, computed.totals);
  }, [filteredRows, kpi.period, computed.totals]);

  const handleSheetExportExcel = useCallback(() => {
    if (sheetRow) downloadXlsxSheet(sheetRow, kpi.period);
  }, [sheetRow, kpi.period]);

  const handleSheetExportPdf = useCallback(() => {
    if (sheetRow) downloadPdfSheet(sheetRow, kpi.period);
  }, [sheetRow, kpi.period]);

  const handleOpenSheet = useCallback((i) => {
    setSheetRow(filteredRows[i]);
  }, [filteredRows]);

  return (
    <>
      <div className="app">
        <Header period={kpi.period} count={computed.kpi.activeCount} totalFot={computed.kpi.totalFot} loaded={loaded} />

        <div className="section">
          <div className="section-head">
            <div>
              <Eyebrow>Шаг 1</Eyebrow>
              <div className="section-title">Загрузите файлы или используйте демо</div>
            </div>
          </div>
          <HowItWorks />
          <div style={{ height: 12 }} />
          <UploadZone
            loaded={loaded}
            mode={mode}
            sotrudnikiInfo={sotrudnikiInfo}
            tabelInfo={tabelInfo}
            onUploadSotrudniki={handleUploadSotrudniki}
            onUploadTabel={handleUploadTabel}
            onLoadDemo={handleLoadDemo}
            onReset={handleReset}
          />
        </div>

        {loaded ? (
          <>
            <div className="section">
              <div className="section-head">
                <div>
                  <Eyebrow>Шаг 2</Eyebrow>
                  <div className="section-title">Корневые данные месяца</div>
                </div>
                <Micro>{computed.kpi.planOk ? 'План списания · ОК' : 'План списания · ПРЕВЫШЕН'}</Micro>
              </div>
              <KpiBlock kpi={kpi} onKpiChange={setKpi} computed={computed.kpi} />
            </div>

            <div className="section">
              <div className="section-head">
                <div>
                  <Eyebrow tone="warm">Шаг 3</Eyebrow>
                  <div className="section-title">Расчёт по сотрудникам</div>
                </div>
                <Micro>
                  {filteredRows.length} {plural(filteredRows.length, ['строка', 'строки', 'строк'])}
                </Micro>
              </div>
              <ControlsBar
                search={search} onSearch={setSearch}
                filterDol={filterDol} onFilterDol={setFilterDol}
                filterStatus={filterStatus} onFilterStatus={setFilterStatus}
                sort={sort} onSort={setSort}
                dolzhnosti={dolzhnosti}
                onExportExcel={handleExportExcel}
                onExportPdf={handleExportPdf}
              />
              <EmployeesTable rows={filteredRows} onOpenSheet={handleOpenSheet} />
            </div>

            <div className="section">
              <div className="section-head">
                <div>
                  <Eyebrow>Итог</Eyebrow>
                  <div className="section-title">Сводка по команде</div>
                </div>
              </div>
              <SummaryBlock totals={computed.totals} />
            </div>
          </>
        ) : (
          <EmptyHero onLoadDemo={handleLoadDemo} />
        )}

        <Foot />
      </div>

      <SheetModal
        row={sheetRow}
        onClose={() => setSheetRow(null)}
        onExportExcel={handleSheetExportExcel}
        onExportPdf={handleSheetExportPdf}
      />
    </>
  );
}

/* -------------- Header -------------- */
function Header({ period, count, totalFot, loaded }) {
  if (!loaded) return null;
  return (
    <header className="statusbar">
      <span className="statusbar-period">{capitalize(period)}</span>
      <span className="statusbar-stat">
        {count} {plural(count, ['активный', 'активных', 'активных'])} · ФОТ {fmtMoney(totalFot)}
      </span>
    </header>
  );
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'; }

/* -------------- Empty hero -------------- */
function EmptyHero({ onLoadDemo }) {
  return (
    <div className="section">
      <GlassCard>
        <div className="empty">
          <h2 className="empty-title">Загрузите два файла<br />и получите расчёт</h2>
          <p className="empty-body">
            Калькулятор ждёт <strong style={{ color: 'var(--cream)' }}>справочник сотрудников</strong> и <strong style={{ color: 'var(--cream)' }}>табель с выручкой</strong>. Или нажмите ниже — посмотрим, как это выглядит.
          </p>
          <Button variant="primary" icon="zap" onClick={onLoadDemo}>
            Загрузить демо-данные
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

/* -------------- Foot -------------- */
function Foot() {
  return (
    <div className="foot">
      <span>AI-калькулятор от Марии Андреевой · версия 2026.1</span>
      <span>Расчёт упрощённый — сверьтесь с бухгалтером перед выплатой</span>
    </div>
  );
}

Object.assign(window, { App, Header, EmptyHero, Foot, capitalize });
