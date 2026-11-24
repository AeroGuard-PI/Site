(() => {
  "use strict";
  const empresaId = sessionStorage.EMPRESA_ID, select = document.querySelector("#machine-select"), feedback = document.querySelector("#feedback"), history = document.querySelector("#alert-history"), more = document.querySelector("#show-more-alerts"), storageKey = `aeroguard.dashboard.maquina.${empresaId}`;
  const analytics = window.CpuAnalysis;
  let periodo = "6h", maquina = localStorage.getItem(storageKey) || "", historyChart, distributionChart, loading = false, queued = false, loaded = false, allEpisodes = [], expanded = false;
  const date = value => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  const exactDate = value => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
  const axisDate = value => new Intl.DateTimeFormat("pt-BR", periodo === "7d" ? { day: "2-digit", month: "2-digit" } : { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
  const number = value => Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const percent = value => `${number(value)} %`;
  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  const median = analytics.median;
  const duration = ms => { if (ms == null) return "Indisponível"; if (ms < 60000) return `${Math.round(ms / 1000)} s`; const min = Math.round(ms / 60000); return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}min`; };
  const setFeedback = (message = "", visible = false) => { feedback.textContent = message; feedback.hidden = !visible; };

  function fillMachines(machines) {
    select.replaceChildren(); machines.forEach(machine => select.add(new Option(machine.hostname, machine.id)));
    maquina = machines.some(machine => String(machine.id) === maquina) ? maquina : (machines[0] ? String(machines[0].id) : "");
    select.value = maquina; if (maquina) localStorage.setItem(storageKey, maquina);
    document.querySelector("[data-machine-title]").textContent = maquina ? select.selectedOptions[0].textContent : "Nenhum servidor disponível";
  }
  function limits(rows) { const warning = rows.find(row => String(row.nivel_alerta).toUpperCase().includes("ALERTA")), critical = rows.find(row => String(row.nivel_alerta).toUpperCase().includes("CR")); return { warning: warning ? Number(warning.limite) : null, critical: critical ? Number(critical.limite) : null }; }
  const intervals = series => analytics.intervalos(series, maquina, { normalizada: true });
  const sustained = series => analytics.sustentada(series, maquina, { normalizada: true });
  function kpis(series) {
    const current = series.at(-1), peak = series.length ? series.reduce((best, item) => Number(item.valor) > Number(best.valor) ? item : best) : null, sustain = sustained(series), values = { current: current && current.valor, median: median(series.map(item => item.valor)), peak: peak && peak.valor, sustained: sustain && sustain.valor };
    Object.entries(values).forEach(([name, value]) => { document.querySelector(`[data-kpi="${name}"]`).textContent = value == null ? "—" : percent(value); document.querySelector(`[data-kpi-bar="${name}"]`).style.width = `${clamp(value)}%`; });
    document.querySelector('[data-kpi-info="current"]').textContent = current ? `${current.hostname} · ${date(current.data_hora)}` : "Sem dados";
    document.querySelector('[data-kpi-info="median"]').textContent = series.length ? `${series.length} capturas no período` : "Sem dados";
    document.querySelector('[data-kpi-info="peak"]').textContent = peak ? date(peak.data_hora) : "Sem dados";
    document.querySelector('[data-kpi-info="sustained"]').textContent = sustain ? `${sustain.quantidade} capturas · ${date(sustain.inicio)}–${date(sustain.fim)}` : "Cobertura insuficiente para uma janela de 5 minutos";
    return { ...values, peak, sustain, serie };
  }
  function update(chart, canvas, config) { if (!chart) return new Chart(canvas, config); chart.data = config.data; chart.options = config.options; chart.update("none"); return chart; }
  function historyGraph(series, threshold) {
    const meta = document.querySelector("#chart-meta"); if (!series.length) { if (historyChart) { historyChart.destroy(); historyChart = undefined; } meta.textContent = "Sem dados"; return; }
    const intervalosSerie = intervals(series), cortes = new Set(intervalosSerie.amostras.slice(0, -1).filter((item, index) => new Date(intervalosSerie.amostras[index + 1].data_hora) - new Date(item.data_hora) > intervalosSerie.limiteLacuna).map(item => item.id)), labels = [], pontos = [], fonte = [];
    series.forEach(item => { labels.push(axisDate(item.data_hora)); pontos.push(Number(item.valor)); fonte.push(item); if (cortes.has(item.id)) { labels.push(""); pontos.push(null); fonte.push(null); } });
    const line = (value, label, color) => value == null ? null : { label, data: pontos.map(point => point == null ? null : value), borderColor: color, borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0 };
    const datasets = [{ label: "Utilização da CPU", data: pontos, borderColor: "#00aeef", backgroundColor: "rgba(0,174,239,.16)", fill: true, tension: .2, borderWidth: 2, pointRadius: 0 }, line(threshold.warning, "Limite de atenção", "#f2b84b"), line(threshold.critical, "Limite crítico", "#bc0707")].filter(Boolean);
    historyChart = update(historyChart, document.querySelector("#cpu-chart"), { type: "line", data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false, spanGaps: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: contexts => exactDate(fonte[contexts[0].dataIndex].data_hora), label: context => `${context.dataset.label}: ${percent(context.parsed.y)}` } } }, scales: { x: { grid: { display: false }, ticks: { color: "rgba(184,194,204,.65)", autoSkip: true, autoSkipPadding: 12, includeBounds: true, maxTicksLimit: 7, maxRotation: 0 } }, y: { min: 0, suggestedMax: 100, grid: { color: "rgba(184,194,204,.07)" }, ticks: { color: "rgba(184,194,204,.65)", callback: value => `${value}%` } } } } });
    meta.textContent = `${series.length} amostras · ${series[0].unidade}`;
  }
  function distribution(series, threshold) {
    const resultado = analytics.distribuicao(intervals(series), { alerta: threshold.warning, critico: threshold.critical });
    return { ...resultado, bands: resultado.bandas.map(band => ({ start: band.inicio, end: band.fim, ms: band.ms })) };
  }
  function distributionGraph(result) {
    const meta = document.querySelector("#distribution-meta"), message = document.querySelector("#distribution-feedback");
    if (!result.total) { if (distributionChart) { distributionChart.destroy(); distributionChart = undefined; } message.hidden = false; message.textContent = "São necessárias duas capturas consecutivas, sem lacunas, para calcular a distribuição."; meta.textContent = "Sem dados suficientes"; return; }
    message.hidden = true; const names = ["Baixa", "Moderada", "Intermediária", "Elevada", "Atenção", "Criticidade"], values = result.bands.map(band => band.ms * 100 / result.total);
    distributionChart = update(distributionChart, document.querySelector("#distribution-chart"), { type: "bar", data: { labels: result.bands.map((band, index) => `${band.start}–${band.end}% · ${names[index]}`), datasets: [{ label: "Tempo observado", data: values, backgroundColor: ["#00aeef", "#5b8def", "#007dc5", "#f2b84b", "#f2b84b", "#bc0707"], borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${number(context.parsed.y)}% do tempo observado` } } }, scales: { x: { grid: { display: false }, ticks: { color: "rgba(184,194,204,.65)", font: { size: 10 }, maxRotation: 45, minRotation: 45 } }, y: { beginAtZero: true, max: 100, grid: { color: "rgba(184,194,204,.07)" }, ticks: { color: "rgba(184,194,204,.65)", callback: value => `${value}%` } } } } });
    meta.textContent = `${duration(result.total)} observados`;
  }
  function episodes(series, threshold) { return analytics.episodios(series, { alerta: threshold.warning, critico: threshold.critical }, maquina, { normalizada: true }); }
  function overload(result) { document.querySelector("#attention-duration").textContent = duration(result.atencao); document.querySelector("#critical-duration").textContent = duration(result.criticidade); document.querySelector("#overload-episodes").textContent = result.lista.length; document.querySelector("#episode-duration").textContent = duration(result.maior); document.querySelector("#overload-note").textContent = result.atencao == null ? "São necessárias capturas consecutivas para estimar duração." : result.lacunas ? "Lacunas entre capturas foram desconsideradas nas durações." : "Durações estimadas somente entre capturas consecutivas."; }
  function insight(list, title, text, variant = "info") { const item = document.createElement("li"); item.className = "alert"; item.innerHTML = `<span class="alert__icon alert__icon--${variant}" aria-hidden="true">i</span><div class="alert__text"><strong></strong><p></p></div>`; item.querySelector("strong").textContent = title; item.querySelector("p").textContent = text; list.append(item); }
  function diagnosis(data, currentIntervals, previousIntervals, overloads) {
    const list = document.querySelector("#insights"), resultado = analytics.diagnostico(currentIntervals, previousIntervals, overloads);
    list.replaceChildren();
    if (!resultado.configuracaoSuficiente) { insight(list, "Configuração insuficiente", "Os limites de atenção e criticidade precisam ser valores válidos, ordenados e entre 0% e 100%."); return; }
    if (!resultado.eventosConfiaveis) { insight(list, "Dados insuficientes", "A continuidade das capturas não permite uma conclusão estatisticamente confiável."); return; }
    insight(list, "Padrão de comportamento", `${resultado.comportamento}. Mediana de ${percent(resultado.medianaAtual)} e pico de ${data.peak ? percent(data.peak.valor) : "—"}.`, resultado.comportamento === "Operação normal" ? "success" : "warning");
    if (resultado.limitacaoDados) insight(list, "Limitação dos dados", resultado.limitacaoDados, "warning");
    if (data.sustain) insight(list, "Maior carga sustentada", `Mediana de ${percent(data.sustain.valor)} em janela válida de cinco minutos (${data.sustain.quantidade} capturas).`);
    if (resultado.comparacaoConfiavel) insight(list, "Evolução", `Mediana atual: ${percent(resultado.medianaAtual)}; anterior: ${percent(resultado.medianaAnterior)}; diferença: ${number(resultado.diferenca)} p.p. (${resultado.evolucao}).`);
    else insight(list, "Evolução", "Histórico anterior insuficiente para uma comparação confiável.");
    const recomendacao = resultado.comportamento === "Picos isolados" ? "Acompanhe o comportamento; um pico isolado não justifica redimensionamento." : resultado.comportamento.includes("sustentada crítica") ? "Priorize a otimização das aplicações e avalie capacidade com base na recorrência e duração observadas." : resultado.comportamento.includes("sustentada") || resultado.comportamento === "Pressão recorrente" ? "Investigue a carga nos horários recorrentes e planeje uma revisão de capacidade." : "Mantenha o acompanhamento periódico da utilização.";
    insight(list, "Recomendação", recomendacao, resultado.comportamento === "Operação normal" || resultado.comportamento === "Picos isolados" ? "success" : "warning");
  }
  function episodeHistory(episodes) { history.replaceChildren(); const shown = expanded ? episodes.slice(0, 10) : episodes.slice(0, 5); document.querySelector("#alert-count").textContent = `${shown.length} de ${episodes.length} episódio${episodes.length === 1 ? "" : "s"}`; more.hidden = episodes.length <= 5; if (!more.hidden) more.textContent = expanded ? "Ver menos" : "Ver mais"; if (!episodes.length) { history.innerHTML = '<tr><td colspan="5">Nenhum episódio de sobrecarga identificado no período.</td></tr>'; return; } shown.forEach(episode => { const row = document.createElement("tr"); row.innerHTML = '<td></td><td></td><td><span class="cpu-level"></span></td><td></td><td></td>'; const cells = row.querySelectorAll("td"); cells[0].textContent = date(episode.inicio); cells[1].textContent = date(episode.fim); cells[2].firstElementChild.classList.add(episode.critica ? "cpu-level--critical" : "cpu-level--warning"); cells[2].firstElementChild.textContent = episode.classificacao; cells[3].textContent = percent(episode.pico); cells[4].textContent = duration(episode.duracao); history.append(row); }); }
  async function load() { if (!empresaId) { setFeedback("Faça login para consultar a análise de CPU.", true); return; } if (loading) { queued = true; return; } loading = true; const requestedMachine = maquina, requestedPeriod = periodo; try { const params = new URLSearchParams({ periodo }); if (requestedMachine) params.set("maquinaId", requestedMachine); const response = await fetch(`/monitoramento/cpu/${encodeURIComponent(empresaId)}?${params}`), data = await response.json(); if (!response.ok) throw new Error(data.mensagem || "Não foi possível carregar a análise."); fillMachines(data.maquinas); if (periodo !== requestedPeriod || maquina !== requestedMachine) { queued = true; return; } const serie = analytics.normalizar(data.serie, maquina), anterior = analytics.normalizar(data.serieAnterior, maquina), threshold = limits(data.limites), indicator = kpis(serie), dist = distribution(serie, threshold), overloads = episodes(serie, threshold); const inicio = new Date(data.periodo && data.periodo.inicio).getTime(), fim = new Date(data.periodo && data.periodo.fim).getTime(), janela = fim - inicio, currentIntervals = analytics.intervalos(serie, maquina, { normalizada: true, inicio, fim }), previousIntervals = analytics.intervalos(anterior, maquina, { normalizada: true, inicio: inicio - janela, fim: inicio }); historyGraph(serie, threshold); distributionGraph(dist); overload(overloads); diagnosis(indicator, currentIntervals, previousIntervals, overloads); allEpisodes = overloads.lista; episodeHistory(allEpisodes); setFeedback(); loaded = true; } catch (error) { setFeedback(error.message, true); if (!loaded) history.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`; } finally { loading = false; if (queued) { queued = false; load(); } } }
  document.querySelectorAll("[data-user-name]").forEach(element => element.textContent = sessionStorage.NOME_USUARIO || "Usuário");
  select.addEventListener("change", () => { maquina = select.value; localStorage.setItem(storageKey, maquina); expanded = false; load(); });
  document.querySelectorAll("[data-period]").forEach(button => button.addEventListener("click", () => { periodo = button.dataset.period; expanded = false; document.querySelectorAll("[data-period]").forEach(item => { const active = item === button; item.classList.toggle("is-active", active); item.setAttribute("aria-pressed", String(active)); }); load(); }));
  more.addEventListener("click", () => { expanded = !expanded; episodeHistory(allEpisodes); });
  load(); window.setInterval(load, 15000);
})();
