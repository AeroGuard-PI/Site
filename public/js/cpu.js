(() => {
  "use strict";
  const empresaId = sessionStorage.EMPRESA_ID, select = document.querySelector("#machine-select"), feedback = document.querySelector("#feedback"), history = document.querySelector("#alert-history"), more = document.querySelector("#show-more-alerts"), storageKey = `aeroguard.dashboard.maquina.${empresaId}`;
  let periodo = "6h", maquina = localStorage.getItem(storageKey) || "", historyChart, distributionChart, loading = false, queued = false, loaded = false, allEpisodes = [], expanded = false;
  const date = value => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  const exactDate = value => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
  const axisDate = value => new Intl.DateTimeFormat("pt-BR", periodo === "7d" ? { day: "2-digit", month: "2-digit" } : { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
  const number = value => Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const percent = value => `${number(value)} %`;
  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  const median = values => { if (!values.length) return null; const ordered = values.map(Number).sort((a, b) => a - b), middle = Math.floor(ordered.length / 2); return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2; };
  const duration = ms => { if (ms == null) return "Indisponível"; const min = Math.round(ms / 60000); return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}min`; };
  const setFeedback = (message = "", visible = false) => { feedback.textContent = message; feedback.hidden = !visible; };

  function fillMachines(machines) {
    select.replaceChildren(); machines.forEach(machine => select.add(new Option(machine.hostname, machine.id)));
    maquina = machines.some(machine => String(machine.id) === maquina) ? maquina : (machines[0] ? String(machines[0].id) : "");
    select.value = maquina; if (maquina) localStorage.setItem(storageKey, maquina);
    document.querySelector("[data-machine-title]").textContent = maquina ? select.selectedOptions[0].textContent : "Nenhum servidor disponível";
  }
  function limits(rows) { const warning = rows.find(row => String(row.nivel_alerta).toUpperCase().includes("ALERTA")), critical = rows.find(row => String(row.nivel_alerta).toUpperCase().includes("CR")); return { warning: warning ? Number(warning.limite) : null, critical: critical ? Number(critical.limite) : null }; }
  function intervals(series) {
    const gaps = series.slice(1).map((item, index) => new Date(item.data_hora) - new Date(series[index].data_hora)).filter(value => value > 0), typical = median(gaps);
    if (typical == null) return { values: [], gaps: 0 };
    const maxGap = typical * 1.5; let omitted = 0;
    const values = series.slice(1).flatMap((next, index) => { const current = series[index], ms = new Date(next.data_hora) - new Date(current.data_hora); if (ms > 0 && ms <= maxGap) return [{ current, next, ms }]; if (ms > maxGap) omitted += 1; return []; });
    return { values, gaps: omitted };
  }
  function sustained(series) {
    let best = null;
    series.forEach((start, index) => { const startMs = new Date(start.data_hora).getTime(), window = series.slice(index).filter(item => new Date(item.data_hora).getTime() - startMs <= 300000); if (window.length > 1) { const value = median(window.map(item => item.valor)); if (!best || value > best.value) best = { value, start: window[0].data_hora, end: window.at(-1).data_hora, count: window.length }; } });
    return best;
  }
  function kpis(series) {
    const current = series.at(-1), peak = series.length ? series.reduce((best, item) => Number(item.valor) > Number(best.valor) ? item : best) : null, sustain = sustained(series), values = { current: current && current.valor, median: median(series.map(item => item.valor)), peak: peak && peak.valor, sustained: sustain && sustain.value };
    Object.entries(values).forEach(([name, value]) => { document.querySelector(`[data-kpi="${name}"]`).textContent = value == null ? "—" : percent(value); document.querySelector(`[data-kpi-bar="${name}"]`).style.width = `${clamp(value)}%`; });
    document.querySelector('[data-kpi-info="current"]').textContent = current ? `${current.hostname} · ${date(current.data_hora)}` : "Sem dados";
    document.querySelector('[data-kpi-info="median"]').textContent = series.length ? `${series.length} capturas no período` : "Sem dados";
    document.querySelector('[data-kpi-info="peak"]').textContent = peak ? date(peak.data_hora) : "Sem dados";
    document.querySelector('[data-kpi-info="sustained"]').textContent = sustain ? `${sustain.count} capturas · ${date(sustain.start)}–${date(sustain.end)}` : "São necessárias duas capturas em 5 minutos";
    return { ...values, peak, sustain };
  }
  function update(chart, canvas, config) { if (!chart) return new Chart(canvas, config); chart.data = config.data; chart.options = config.options; chart.update("none"); return chart; }
  function historyGraph(series, threshold) {
    const meta = document.querySelector("#chart-meta"); if (!series.length) { meta.textContent = "Sem dados"; return; }
    const line = (value, label, color) => value == null ? null : { label, data: series.map(() => value), borderColor: color, borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0 };
    const datasets = [{ label: "Utilização da CPU", data: series.map(item => Number(item.valor)), borderColor: "#00aeef", backgroundColor: "rgba(0,174,239,.16)", fill: true, tension: .2, borderWidth: 2, pointRadius: 0 }, line(threshold.warning, "Limite de atenção", "#f2b84b"), line(threshold.critical, "Limite crítico", "#bc0707")].filter(Boolean);
    historyChart = update(historyChart, document.querySelector("#cpu-chart"), { type: "line", data: { labels: series.map(item => axisDate(item.data_hora)), datasets }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: contexts => exactDate(series[contexts[0].dataIndex].data_hora), label: context => `${context.dataset.label}: ${percent(context.parsed.y)}` } } }, scales: { x: { grid: { display: false }, ticks: { color: "rgba(184,194,204,.65)", autoSkip: true, autoSkipPadding: 12, includeBounds: true, maxTicksLimit: 7, maxRotation: 0 } }, y: { min: 0, suggestedMax: 100, grid: { color: "rgba(184,194,204,.07)" }, ticks: { color: "rgba(184,194,204,.65)", callback: value => `${value}%` } } } } });
    meta.textContent = `${series.length} amostras · ${series[0].unidade}`;
  }
  function distribution(series, threshold) {
    const samples = intervals(series); if (!samples.values.length || threshold.warning == null || threshold.critical == null) return { ...samples, bands: [], total: 0 };
    const ends = [20, 40, 60, threshold.warning, threshold.critical, 100], bands = ends.map((end, index) => ({ start: index ? ends[index - 1] : 0, end, ms: 0 }));
    samples.values.forEach(({ current, ms }) => { const value = clamp(current.valor), index = bands.findIndex((band, position) => value < band.end || position === bands.length - 1); bands[index].ms += ms; });
    return { ...samples, bands, total: bands.reduce((sum, band) => sum + band.ms, 0) };
  }
  function distributionGraph(result) {
    const meta = document.querySelector("#distribution-meta"), message = document.querySelector("#distribution-feedback");
    if (!result.total) { message.hidden = false; message.textContent = "São necessárias duas capturas consecutivas, sem lacunas, para calcular a distribuição."; meta.textContent = "Sem dados suficientes"; return; }
    message.hidden = true; const names = ["Baixa", "Moderada", "Intermediária", "Elevada", "Atenção", "Criticidade"], values = result.bands.map(band => band.ms * 100 / result.total);
    distributionChart = update(distributionChart, document.querySelector("#distribution-chart"), { type: "bar", data: { labels: result.bands.map((band, index) => `${band.start}–${band.end}% · ${names[index]}`), datasets: [{ label: "Tempo observado", data: values, backgroundColor: ["#00aeef", "#5b8def", "#007dc5", "#f2b84b", "#f2b84b", "#bc0707"], borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${number(context.parsed.y)}% do tempo observado` } } }, scales: { x: { grid: { display: false }, ticks: { color: "rgba(184,194,204,.65)", font: { size: 10 }, maxRotation: 45, minRotation: 45 } }, y: { beginAtZero: true, max: 100, grid: { color: "rgba(184,194,204,.07)" }, ticks: { color: "rgba(184,194,204,.65)", callback: value => `${value}%` } } } } });
    meta.textContent = `${duration(result.total)} observados`;
  }
  function episodes(series, threshold, sampleIntervals) {
    if (threshold.warning == null || threshold.critical == null) return { list: [], attention: null, critical: null, longest: null, gaps: sampleIntervals.gaps };
    const byId = new Map(sampleIntervals.values.map(item => [item.current.id, item])); let active, attention = 0, critical = 0; const list = [];
    series.forEach((item, index) => { const over = Number(item.valor) >= threshold.warning, previous = series[index - 1], contiguous = active && previous && Number(previous.valor) >= threshold.warning && byId.has(previous.id);
      if (over && !contiguous) { if (active) list.push(active); active = { start: item.data_hora, end: item.data_hora, ms: 0, peak: Number(item.valor), critical: Number(item.valor) >= threshold.critical }; }
      if (!over && active) { list.push(active); active = null; }
      if (active && over) { active.end = item.data_hora; active.peak = Math.max(active.peak, Number(item.valor)); active.critical ||= Number(item.valor) >= threshold.critical; }
      const interval = byId.get(item.id); if (interval) { if (Number(item.valor) >= threshold.critical) critical += interval.ms; else if (over) attention += interval.ms; if (active && over) active.ms += interval.ms; }
    }); if (active) list.push(active);
    return { list, attention, critical, longest: list.length ? Math.max(...list.map(item => item.ms)) : 0, gaps: sampleIntervals.gaps };
  }
  function overload(result) { document.querySelector("#attention-duration").textContent = duration(result.attention); document.querySelector("#critical-duration").textContent = duration(result.critical); document.querySelector("#overload-episodes").textContent = result.list.length; document.querySelector("#episode-duration").textContent = duration(result.longest); document.querySelector("#overload-note").textContent = result.attention == null ? "São necessárias capturas consecutivas para estimar duração." : result.gaps ? "Lacunas entre capturas foram desconsideradas nas durações." : "Durações estimadas somente entre capturas consecutivas."; }
  function insight(list, title, text, variant = "info") { const item = document.createElement("li"); item.className = "alert"; item.innerHTML = `<span class="alert__icon alert__icon--${variant}" aria-hidden="true">i</span><div class="alert__text"><strong></strong><p></p></div>`; item.querySelector("strong").textContent = title; item.querySelector("p").textContent = text; list.append(item); }
  function diagnosis(data, previous, dist, overloads) { const list = document.querySelector("#insights"); list.replaceChildren(); if (data.median == null) { insight(list, "Sem dados suficientes", "Não há capturas suficientes para gerar diagnóstico."); return; } const behavior = !dist.total ? "Sem dados suficientes" : !overloads.list.length ? "Estável" : overloads.list.some(item => item.ms >= 300000) ? "Sobrecarga sustentada" : overloads.list.length >= 3 ? "Pressão recorrente" : "Picos isolados"; insight(list, "Padrão de comportamento", `${behavior}. Mediana de ${percent(data.median)} e pico de ${data.peak ? percent(data.peak.valor) : "—"}.`, behavior === "Estável" ? "success" : "warning"); if (data.sustain) insight(list, "Maior carga sustentada", `Mediana de ${percent(data.sustain.value)} em janela móvel de 5 minutos (${data.sustain.count} capturas).`); const previousMedian = median(previous.map(item => item.valor)); if (previousMedian == null) insight(list, "Evolução", "Não há dados suficientes do período anterior para comparação."); else { const delta = data.median - previousMedian, status = Math.abs(delta) < 2 ? "estável" : delta > 0 ? "em crescimento" : "em redução"; insight(list, "Evolução", `Utilização ${status}: ${number(delta)} p.p. em relação à mediana anterior.`); } const recommendation = behavior === "Picos isolados" ? "Acompanhe o comportamento; não há evidência para aumento imediato de capacidade." : behavior === "Pressão recorrente" ? "Investigue horários de maior processamento e a carga das aplicações durante os episódios." : behavior === "Sobrecarga sustentada" ? "Avalie otimização das aplicações e o dimensionamento de vCPUs com base nos episódios sustentados." : "Mantenha o acompanhamento periódico da utilização da CPU."; insight(list, "Recomendação", recommendation, behavior === "Estável" || behavior === "Picos isolados" ? "success" : "warning"); }
  function episodeHistory(episodes) { history.replaceChildren(); const shown = expanded ? episodes : episodes.slice(0, 5); document.querySelector("#alert-count").textContent = `${shown.length} de ${episodes.length} episódio${episodes.length === 1 ? "" : "s"}`; more.hidden = episodes.length <= 5; if (!more.hidden) more.textContent = expanded ? "Ver menos" : "Ver mais"; if (!episodes.length) { history.innerHTML = '<tr><td colspan="5">Nenhum episódio de sobrecarga identificado no período.</td></tr>'; return; } shown.forEach(episode => { const row = document.createElement("tr"); row.innerHTML = '<td></td><td></td><td><span class="cpu-level"></span></td><td></td><td></td>'; const cells = row.querySelectorAll("td"); cells[0].textContent = date(episode.start); cells[1].textContent = date(episode.end); cells[2].firstElementChild.classList.add(episode.critical ? "cpu-level--critical" : "cpu-level--warning"); cells[2].firstElementChild.textContent = episode.critical ? "Crítico" : "Atenção"; cells[3].textContent = percent(episode.peak); cells[4].textContent = duration(episode.ms); history.append(row); }); }
  async function load() { if (!empresaId) { setFeedback("Faça login para consultar a análise de CPU.", true); return; } if (loading) { queued = true; return; } loading = true; const requestedMachine = maquina, requestedPeriod = periodo; try { const params = new URLSearchParams({ periodo }); if (requestedMachine) params.set("maquinaId", requestedMachine); const response = await fetch(`/monitoramento/cpu/${encodeURIComponent(empresaId)}?${params}`), data = await response.json(); if (!response.ok) throw new Error(data.mensagem || "Não foi possível carregar a análise."); fillMachines(data.maquinas); if (periodo !== requestedPeriod || maquina !== requestedMachine) { queued = true; return; } const threshold = limits(data.limites), indicator = kpis(data.serie), dist = distribution(data.serie, threshold), overloads = episodes(data.serie, threshold, dist); historyGraph(data.serie, threshold); distributionGraph(dist); overload(overloads); diagnosis(indicator, data.serieAnterior, dist, overloads); allEpisodes = overloads.list; episodeHistory(allEpisodes); setFeedback(); loaded = true; } catch (error) { setFeedback(error.message, true); if (!loaded) history.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`; } finally { loading = false; if (queued) { queued = false; load(); } } }
  document.querySelectorAll("[data-user-name]").forEach(element => element.textContent = sessionStorage.NOME_USUARIO || "Usuário");
  select.addEventListener("change", () => { maquina = select.value; localStorage.setItem(storageKey, maquina); expanded = false; load(); });
  document.querySelectorAll("[data-period]").forEach(button => button.addEventListener("click", () => { periodo = button.dataset.period; expanded = false; document.querySelectorAll("[data-period]").forEach(item => { const active = item === button; item.classList.toggle("is-active", active); item.setAttribute("aria-pressed", String(active)); }); load(); }));
  more.addEventListener("click", () => { expanded = !expanded; episodeHistory(allEpisodes); });
  load(); window.setInterval(load, 15000);
})();
