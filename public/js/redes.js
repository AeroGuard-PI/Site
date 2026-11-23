(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const empresaId = sessionStorage.EMPRESA_ID;
  const chave = `aeroguard:redes:${empresaId}:${sessionStorage.ID_USUARIO || "visitante"}`;
  const datas = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "medium" });
  const numero = (n, casas = 2) => n === null || n === undefined ? "—" : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: casas }).format(n);
  const taxa = n => n === null || n === undefined ? "—" : `${new Intl.NumberFormat("pt-BR", n > 0 && n < .01 ? { maximumSignificantDigits: 3 } : { maximumFractionDigits: 2 }).format(n)} Mbps`;
  const data = d => d ? datas.format(new Date(d)) : "Sem registro";
  const volume = n => {
    if (n === null || n === undefined) return "—";
    const i = n ? Math.min(3, Math.floor(Math.log10(n) / 3)) : 0;
    return `${numero(n / 1000 ** i)} ${["B", "kB", "MB", "GB"][i]}`;
  };
  const estado = e => ({ UP: "UP · operacional", DOWN: "DOWN · sem operação", UNKNOWN: "UNKNOWN · desconhecido",
    LOWER_LAYER_DOWN: "Dependência local sem operação", DORMANT: "Dormente", TESTING: "Em verificação", NOT_PRESENT: "Não presente" }[e] || "Não registrado");
  let preferencias = {};
  try { preferencias = JSON.parse(localStorage.getItem(chave)) || {}; } catch { preferencias = {}; }
  let periodo = ["1h", "6h", "24h", "7d"].includes(preferencias.periodo) ? preferencias.periodo : "6h";
  let maquinaId = preferencias.maquinaId || "", interfaceNome = preferencias.interface || "";
  let dados = null, pausado = false, requisicao = null, relatorioEmAndamento = false, reiniciouFiltros = false;
  let recebidoNoNavegador = 0;
  const graficos = {};
  $("basic-history").checked = preferencias.basica === true;

  function feedback(mensagem) {
    $("feedback").textContent = mensagem;
    $("feedback").hidden = !mensagem;
  }

  function opcoes(select, itens, selecionado) {
    select.replaceChildren();
    for (const [valor, rotulo] of itens) select.add(new Option(rotulo, valor));
    select.value = String(selecionado || "");
    select.disabled = !itens.length;
    if (!itens.length) select.add(new Option("Sem registros", ""));
  }

  function parametros(congelar = false) {
    const p = new URLSearchParams({ periodo: congelar && dados ? dados.periodo.id : periodo });
    const maquina = congelar && dados ? dados.selecao.maquinaId : maquinaId;
    const interfaceSelecionada = congelar && dados ? dados.selecao.interface : interfaceNome;
    if (maquina) p.set("maquinaId", maquina);
    if (interfaceSelecionada) p.set("interface", interfaceSelecionada);
    if (congelar && dados ? dados.fonte === "BASICA" : $("basic-history").checked) p.set("fonte", "basica");
    if (congelar && dados) {
      p.set("inicio", dados.periodo.inicio); p.set("fim", dados.periodo.fim);
    }
    return p;
  }

  function atualizarIdade() {
    if (!dados) return;
    const k = dados.indicadores;
    const instante = k.ultimoRecebidoEm || k.ultimoColetadoEm;
    if (!instante) { $("freshness").textContent = "—"; return; }
    const agora = new Date(dados.geradoEm).getTime() + performance.now() - recebidoNoNavegador;
    const segundos = Math.floor((agora - new Date(instante).getTime()) / 1000);
    $("freshness").textContent = segundos < 0 ? "Relógio divergente" : segundos < 60 ? `${segundos} s` : segundos < 3600 ? `${Math.floor(segundos / 60)} min` : `${numero(segundos / 3600, 1)} h`;
  }

  function desenhar(canvasId, series, barras = false) {
    if (!window.Chart) return;
    const css = getComputedStyle(document.documentElement);
    const paleta = ["--signal", "--mem", "--warning"].map(c => css.getPropertyValue(c).trim());
    const fg = css.getPropertyValue("--muted").trim();
    const datasets = series.map(([campo, label], i) => ({
      label, data: (barras ? dados.integridade : dados.serie).map(p => ({ x: p.instante, y: p[campo] })),
      borderColor: paleta[i], backgroundColor: paleta[i] + (barras ? "bb" : "15"),
      borderWidth: barras ? 0 : 2, pointRadius: 0, pointHitRadius: 8, spanGaps: false,
      tension: 0, fill: false, maxBarThickness: 10
    }));
    if (graficos[canvasId]) {
      const grafico = graficos[canvasId];
      grafico.data.datasets = datasets;
      grafico.options.scales.x.min = new Date(dados.periodo.inicio).getTime();
      grafico.options.scales.x.max = new Date(dados.periodo.fim).getTime();
      grafico.update("none");
      return;
    }
    graficos[canvasId] = new Chart($(canvasId), {
      type: barras ? "bar" : "line", data: { datasets }, options: {
        responsive: true, maintainAspectRatio: false, animation: false, parsing: false,
        interaction: { mode: "nearest", intersect: false },
        scales: {
          x: { type: "linear", min: new Date(dados.periodo.inicio).getTime(), max: new Date(dados.periodo.fim).getTime(),
            grid: { color: css.getPropertyValue("--border").trim() }, ticks: { color: fg, maxTicksLimit: 6,
              callback: v => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", ...(periodo === "7d" ? { day: "2-digit", month: "2-digit" } : {}) }).format(new Date(v)) } },
          y: { beginAtZero: true, grid: { color: css.getPropertyValue("--border").trim() }, title: { display: true, text: barras ? "Contagem" : "Mbps", color: fg }, ticks: { color: fg, ...(barras ? { precision: 0 } : {}), callback: v => numero(v, barras ? 0 : 4) } }
        },
        plugins: { legend: { labels: { color: fg, usePointStyle: true } }, tooltip: { callbacks: {
          title: itens => itens.length ? data(itens[0].parsed.x) + " · Brasília" : "",
          label: item => `${item.dataset.label}: ${barras ? numero(item.parsed.y, 0) : taxa(item.parsed.y)}`
        } } }
      }
    });
  }

  function renderizar() {
    const k = dados.indicadores, ampliada = dados.fonte === "AMPLIADA";
    maquinaId = String(dados.selecao.maquinaId || ""); interfaceNome = dados.selecao.interface || "";
    opcoes($("machine-select"), dados.maquinas.map(m => [m.id, m.hostname]), maquinaId);
    opcoes($("interface-select"), dados.interfaces.filter(i => String(i.maquinaId) === maquinaId).map(i => [i.interface, i.interface]), interfaceNome);
    $("source").textContent = ampliada ? "Coleta ampliada por intervalo" : "Histórico básico de Mbps";
    $("interface-state").textContent = `Estado reportado: ${estado(k.estado)}${dados.selecao.ativa ? "" : " · coleta desabilitada"}`;
    $("interface-state").classList.toggle("redes-state-down", ["DOWN", "LOWER_LAYER_DOWN"].includes(k.estado));
    $("update-time").textContent = `Atualizado ${data(dados.geradoEm)} · Brasília`;
    $("rx-current").textContent = taxa(k.rxAtual); $("tx-current").textContent = taxa(k.txAtual);
    $("rx-peak").textContent = `Maior taxa observada: ${taxa(k.picoRx)}`;
    $("tx-peak").textContent = `Maior taxa observada: ${taxa(k.picoTx)}`;
    $("rx-errors").textContent = numero(k.errosRx, 0); $("tx-errors").textContent = numero(k.errosTx, 0); $("rx-drops").textContent = numero(k.descartesRx, 0);
    $("counter-note").textContent = !ampliada ? "Indisponível no histórico básico" : k.contadoresParciais ? "Totais parciais: há contadores indisponíveis" : "Contadores locais; não medem perda de ponta a ponta";
    $("freshness-label").textContent = ampliada ? "Último registro recebido" : "Última captura registrada";
    $("capture-time").textContent = `Coleta: ${data(k.ultimoColetadoEm)}${ampliada ? "" : " · relógio da máquina"}`;
    $("weighted-average").textContent = `${taxa(k.mediaRx)} / ${taxa(k.mediaTx)}`;
    $("volume").textContent = `${volume(k.volumeRxBytes)} / ${volume(k.volumeTxBytes)}`;
    $("coverage").textContent = k.coberturaPct === null ? "Indisponível" : `${numero(k.coberturaPct)}%`;
    $("valid-intervals").textContent = numero(k.intervalosValidos, 0);
    $("covered-window").textContent = k.inicioCoberto ? `Totais entre ${data(k.inicioCoberto)} e ${data(k.fimCoberto)} · Brasília` : "Volumes e duração exigem intervalos completos registrados.";
    $("traffic-meta").textContent = `${dados.selecao.hostname || "Sem máquina"} · ${interfaceNome || "Sem interface"} · ${data(dados.periodo.inicio)} até ${data(dados.periodo.fim)} · Brasília`;
    $("traffic-empty").hidden = dados.serie.some(p => p.rx !== null || p.tx !== null);
    $("integrity-empty").hidden = dados.integridade.some(p => p.errosRx !== null || p.errosTx !== null || p.descartesRx !== null);
    $("integrity-empty").textContent = ampliada ? "Sem contadores válidos nesta janela." : "Indisponível no histórico básico.";
    $("integrity-meta").textContent = k.contadoresParciais ? "Contagens parciais por janela de tempo." : "Contagens por janela de tempo, separadas por categoria.";
    $("observations").replaceChildren(...dados.observacoes.map(s => { const li = document.createElement("li"); li.textContent = s; return li; }));
    $("interface-table").replaceChildren();
    for (const i of dados.interfaces) {
      const tr = document.createElement("tr");
      tr.classList.toggle("redes-selected-row", String(i.maquinaId) === maquinaId && i.interface === interfaceNome);
      for (const s of [i.hostname, i.interface, estado(i.estado), data(i.coletadoEm), i.ativa ? "Habilitada" : "Desabilitada"]) {
        const td = document.createElement("td"); td.textContent = s; tr.append(td);
      }
      const td = document.createElement("td"), botao = document.createElement("button");
      botao.className = "btn btn--secondary"; botao.type = "button"; botao.textContent = "Investigar";
      botao.setAttribute("aria-label", `Investigar ${i.hostname}, interface ${i.interface}`);
      botao.addEventListener("click", () => { maquinaId = String(i.maquinaId); interfaceNome = i.interface; carregar(); window.scrollTo({ top: 0, behavior: "smooth" }); });
      td.append(botao); tr.append(td); $("interface-table").append(tr);
    }
    if (!dados.interfaces.length) {
      const tr = document.createElement("tr"), td = document.createElement("td"); td.colSpan = 6; td.textContent = "Nenhuma interface com capturas nesta empresa."; tr.append(td); $("interface-table").append(tr);
    }
    document.querySelectorAll("[data-period]").forEach(b => { const ativo = b.dataset.period === periodo; b.classList.toggle("is-active", ativo); b.setAttribute("aria-pressed", String(ativo)); });
    $("generate-report").disabled = !interfaceNome || relatorioEmAndamento;
    $("send-slack").disabled = !dados.configuracaoSlack?.ativo;
    if ($("send-slack").disabled) $("send-slack").checked = false;
    $("slack-destination").textContent = dados.configuracaoSlack?.ativo ? `Canal configurado: ${dados.configuracaoSlack.canal}` : "O envio ao Slack está desativado na configuração da empresa.";
    desenhar("traffic-chart", [["rx", "Recepção RX"], ["tx", "Transmissão TX"]]);
    desenhar("integrity-chart", [["errosRx", "Erros RX"], ["errosTx", "Erros TX"], ["descartesRx", "Descartes RX"]], true);
    atualizarIdade();
    try { localStorage.setItem(chave, JSON.stringify({ maquinaId, interface: interfaceNome, periodo, basica: $("basic-history").checked })); } catch {}
  }

  async function carregar() {
    requisicao?.abort();
    const controle = new AbortController(); requisicao = controle;
    $("refresh").disabled = true;
    try {
      const resposta = await fetch(`/monitoramento/redes/${empresaId}?${parametros()}`, { signal: controle.signal });
      const conteudo = await resposta.json();
      if (!resposta.ok) {
        if (resposta.status === 404 && !reiniciouFiltros) { reiniciouFiltros = true; maquinaId = ""; interfaceNome = ""; return carregar(); }
        throw new Error(conteudo.mensagem || "Não foi possível consultar a análise.");
      }
      dados = conteudo; recebidoNoNavegador = performance.now(); renderizar();
      feedback(window.Chart ? "" : "Os gráficos não puderam ser carregados. Os indicadores e o relatório continuam disponíveis.");
    } catch (erro) {
      if (erro.name !== "AbortError") feedback(erro.message || "Falha de conexão. Atualize a análise.");
    } finally {
      if (requisicao === controle) $("refresh").disabled = false;
    }
  }

  async function gerarRelatorio() {
    if (!dados || relatorioEmAndamento) return;
    relatorioEmAndamento = true; $("generate-report").disabled = true;
    $("report-download").hidden = true; $("report-slack").hidden = true;
    const contexto = `${dados.selecao.hostname} · ${dados.selecao.interface}`;
    $("report-feedback").textContent = `Gerando PDF de ${contexto}...`;
    try {
      const resposta = await fetch(`/monitoramento/redes/${empresaId}/relatorios?${parametros(true)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enviarSlack: $("send-slack").checked })
      });
      const criado = await resposta.json();
      if (!resposta.ok) throw new Error(criado.mensagem);
      const limite = performance.now() + 130000;
      while (performance.now() < limite) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const statusResposta = await fetch(`/monitoramento/redes/${empresaId}/relatorios/${criado.id}`);
        const status = await statusResposta.json();
        if (!statusResposta.ok || status.status === "ERRO") throw new Error(status.mensagem || "Falha na geração do relatório.");
        if (status.status !== "CONCLUIDO") continue;
        $("report-feedback").textContent = `${contexto}: ${status.resultado.envio.mensagem}`;
        $("report-download").href = status.download; $("report-download").hidden = false;
        const url = status.resultado.envio.url;
        if (typeof url === "string" && url.startsWith("https://")) { $("report-slack").href = url; $("report-slack").hidden = false; }
        return;
      }
      throw new Error("A geração demorou mais que o previsto. Consulte novamente em instantes.");
    } catch (erro) {
      $("report-feedback").textContent = erro.message || "Não foi possível gerar o relatório.";
    } finally {
      relatorioEmAndamento = false; $("generate-report").disabled = !dados?.selecao.interface;
    }
  }

  $("machine-select").addEventListener("change", () => { maquinaId = $("machine-select").value; interfaceNome = ""; carregar(); });
  $("interface-select").addEventListener("change", () => { interfaceNome = $("interface-select").value; carregar(); });
  $("basic-history").addEventListener("change", carregar);
  $("refresh").addEventListener("click", carregar);
  $("pause").addEventListener("click", () => { pausado = !pausado; $("pause").setAttribute("aria-pressed", String(pausado)); $("pause").textContent = pausado ? "Retomar atualização" : "Pausar atualização"; });
  $("generate-report").addEventListener("click", gerarRelatorio);
  document.querySelectorAll("[data-period]").forEach(b => b.addEventListener("click", () => { periodo = b.dataset.period; carregar(); }));
  if (!/^[1-9]\d*$/.test(empresaId || "")) { feedback("Entre na sua conta para selecionar a empresa."); return; }
  carregar();
  setInterval(() => { if (!pausado && !document.hidden && !requisicao?.signal.aborted && !$("refresh").disabled) carregar(); }, 15000);
  setInterval(atualizarIdade, 1000);
})();
