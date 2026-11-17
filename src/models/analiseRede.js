"use strict";

function numero(valor) {
    if (valor === null || valor === undefined) return null;
    const n = Number(valor);
    return Number.isFinite(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : null;
}

function instante(valor) {
    if (!valor) return null;
    const n = new Date(valor).getTime();
    return Number.isFinite(n) ? n : null;
}

function resumirSerie(serie, limite = 360) {
    if (serie.length <= limite) return serie;
    const passo = Math.ceil(serie.length / Math.floor(limite / 7));
    const resultado = [];
    for (let i = 0; i < serie.length; i += passo) {
        const grupo = serie.slice(i, i + passo);
        const indices = new Set([0, grupo.length - 1]);
        const lacuna = grupo.findIndex(p => p.rx === null && p.tx === null);
        if (lacuna >= 0) indices.add(lacuna);
        for (const campo of ["rx", "tx"]) {
            const validos = grupo.map((p, j) => ({ valor: p[campo], j })).filter(p => p.valor !== null);
            if (validos.length) {
                indices.add(validos.reduce((a, b) => a.valor < b.valor ? a : b).j);
                indices.add(validos.reduce((a, b) => a.valor > b.valor ? a : b).j);
            }
        }
        [...indices].sort((a, b) => a - b).forEach(j => resultado.push(grupo[j]));
    }
    return resultado;
}

function analisarRede(linhas, fonte, inicio, fim) {
    const de = new Date(inicio).getTime();
    const ate = new Date(fim).getTime();
    const ampliada = fonte === "AMPLIADA";
    const pontos = [];
    const porInstante = new Map();
    const contadores = { errosRx: [], errosTx: [], descartesRx: [] };
    const campos = { errosRx: "delta_rx_erros", errosTx: "delta_tx_erros", descartesRx: "delta_rx_descartes" };
    const integridade = Array.from({ length: 60 }, (_, i) => ({
        instante: de + (i + 0.5) * (ate - de) / 60, errosRx: null, errosTx: null, descartesRx: null
    }));
    let bytesRx = 0, bytesTx = 0, duracaoNs = 0, incluidos = 0, rejeitados = 0;
    let fimAnterior = null, ultimo = null, fimCobertura = null, coberturaMs = 0;
    let inicioCoberto = null, fimCoberto = null;

    for (const linha of linhas) {
        const t = instante(linha.coletado_em || linha.data_hora);
        if (t === null || t < de || t >= ate) continue;
        ultimo = linha;
        if (!ampliada) {
            const valor = numero(linha.valor);
            const ponto = porInstante.get(t) || { instante: t, rx: null, tx: null };
            if (linha.tipo.startsWith("Download - ")) ponto.rx = valor;
            if (linha.tipo.startsWith("Upload - ")) ponto.tx = valor;
            porInstante.set(t, ponto);
            continue;
        }
        const inicioMs = instante(linha.inicio_em);
        const ns = numero(linha.duracao_ns);
        const rx = numero(linha.delta_rx_bytes), tx = numero(linha.delta_tx_bytes);
        const valido = !linha.motivo_intervalo && inicioMs !== null && ns > 0 && rx !== null && tx !== null && inicioMs < t
            && Math.abs((t - inicioMs) * 1e6 - ns) <= 1e9;
        if (!valido || (fimAnterior !== null && inicioMs < fimAnterior)) {
            pontos.push({ instante: t, rx: null, tx: null });
            rejeitados++;
            continue;
        }
        if (fimAnterior !== null && inicioMs > fimAnterior + 1) {
            pontos.push({ instante: fimAnterior + 1, rx: null, tx: null });
        }
        fimAnterior = t;
        pontos.push({ instante: t, rx: rx * 8000 / ns, tx: tx * 8000 / ns });
        const comeco = Math.max(de, inicioMs);
        coberturaMs += Math.max(0, t - Math.max(comeco, fimCobertura === null ? comeco : fimCobertura));
        fimCobertura = t;
        if (inicioMs < de) continue;
        bytesRx += rx;
        bytesTx += tx;
        duracaoNs += ns;
        incluidos++;
        inicioCoberto = inicioCoberto === null ? inicioMs : inicioCoberto;
        fimCoberto = t;
        const indice = Math.min(59, Math.floor((t - de) / (ate - de) * 60));
        for (const [campo, origem] of Object.entries(campos)) {
            const valor = numero(linha[origem]);
            contadores[campo].push(valor);
            if (valor !== null) integridade[indice][campo] = (integridade[indice][campo] ?? 0) + valor;
        }
    }

    if (!ampliada) {
        let anterior = null;
        for (const ponto of [...porInstante.values()].sort((a, b) => a.instante - b.instante)) {
            if (anterior !== null && ponto.instante - anterior > 15000) {
                pontos.push({ instante: anterior + 1, rx: null, tx: null });
            }
            pontos.push(ponto);
            anterior = ponto.instante;
        }
    }
    function pico(campo) {
        const valores = pontos.map(p => p[campo]).filter(v => v !== null);
        return valores.length ? valores.reduce((a, b) => Math.max(a, b)) : null;
    }
    function atual(campo) {
        const final = pontos[pontos.length - 1];
        return final ? final[campo] : null;
    }
    const indicadores = {
        rxAtual: atual("rx"), txAtual: atual("tx"), picoRx: pico("rx"), picoTx: pico("tx"),
        mediaRx: duracaoNs ? bytesRx * 8000 / duracaoNs : null,
        mediaTx: duracaoNs ? bytesTx * 8000 / duracaoNs : null,
        volumeRxBytes: incluidos ? bytesRx : null, volumeTxBytes: incluidos ? bytesTx : null,
        coberturaPct: ampliada ? Math.min(100, coberturaMs / (ate - de) * 100) : null,
        intervalosValidos: ampliada ? incluidos : null, intervalosInvalidos: ampliada ? rejeitados : null,
        inicioCoberto: inicioCoberto === null ? null : new Date(inicioCoberto).toISOString(),
        fimCoberto: fimCoberto === null ? null : new Date(fimCoberto).toISOString(),
        ultimoColetadoEm: ultimo ? new Date(ultimo.coletado_em || ultimo.data_hora).toISOString() : null,
        ultimoRecebidoEm: ampliada && ultimo?.recebido_em ? new Date(ultimo.recebido_em).toISOString() : null,
        estado: ampliada && ultimo ? ultimo.estado_operacional : null,
        contadoresParciais: false
    };
    for (const campo of Object.keys(campos)) {
        const validos = contadores[campo].filter(v => v !== null);
        indicadores[campo] = validos.length ? validos.reduce((a, b) => a + b, 0) : null;
        if (validos.length < contadores[campo].length) indicadores.contadoresParciais = true;
    }
    const observacoes = [];
    if (!pontos.some(p => p.rx !== null || p.tx !== null)) observacoes.push("Não há taxas válidas na janela selecionada.");
    if (!ampliada) observacoes.push("O histórico básico de Mbps não contém duração, volume exato, contadores ou cobertura.");
    if (ampliada && coberturaMs + 1 < ate - de) observacoes.push("A janela contém trechos sem intervalos registrados, inclusive nas bordas da consulta. A cobertura mede evidência de coleta, sem representar disponibilidade da rede.");
    if (rejeitados) observacoes.push(`${rejeitados} leitura(s) sem intervalo comparável foram preservadas sem calcular uma taxa.`);
    if (indicadores.contadoresParciais) observacoes.push("Os contadores locais têm leituras indisponíveis; seus totais são parciais.");
    if (["errosRx", "errosTx", "descartesRx"].some(c => indicadores[c] > 0)) observacoes.push("Foram observados erros ou descartes locais. Investigue a interface e o sistema; estes contadores não medem perda de ponta a ponta.");
    if (["DOWN", "LOWER_LAYER_DOWN"].includes(indicadores.estado)) observacoes.push("A última leitura reportou interface sem condição operacional de transmissão. Verifique seu contexto e dependências locais.");
    observacoes.push("As taxas descrevem tráfego observado. Latência, saturação e causa de uma interrupção exigem outras evidências.");
    return { indicadores, serie: resumirSerie(pontos), integridade: ampliada ? integridade : [], observacoes };
}

module.exports = { analisarRede, resumirSerie };
