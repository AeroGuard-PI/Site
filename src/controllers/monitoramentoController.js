var monitoramentoModel = require("../models/monitoramentoModel");

function empresaValida(empresaId) {
    return Number.isInteger(Number(empresaId)) && Number(empresaId) > 0;
}

function obterPeriodo(periodo) {
    var horas = { "1h": 1, "6h": 6, "24h": 24, "7d": 168 }[periodo] || 6;
    return new Date(Date.now() - horas * 60 * 60 * 1000);
}

function idMaquinaValido(valor) {
    return valor === undefined || valor === "" || (Number.isInteger(Number(valor)) && Number(valor) > 0);
}

function obterJanelaPeriodo(periodo) {
    var horas = { "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720 }[periodo] || 24;
    var dataFinal = new Date();
    var dataInicial = new Date(dataFinal.getTime() - horas * 60 * 60 * 1000);
    var dataAnterior = new Date(dataInicial.getTime() - horas * 60 * 60 * 1000);
    return { dataInicial: dataInicial, dataFinal: dataFinal, dataAnterior: dataAnterior };
}

function dashboard(req, res) {
    var empresaId = Number(req.params.empresaId);
    var maquinaId = req.query.maquinaId ? Number(req.query.maquinaId) : null;
    if (!empresaValida(empresaId) || !idMaquinaValido(req.query.maquinaId)) return res.status(400).json({ mensagem: "Identificador inválido." });
    var dataInicial = obterPeriodo(req.query.periodo);
    monitoramentoModel.listarMaquinas(empresaId).then(function (maquinas) {
        var maquinaSelecionada = maquinaId || (maquinas[0] && maquinas[0].id);
        return Promise.all([
        monitoramentoModel.ultimasMetricas(empresaId, maquinaId),
        monitoramentoModel.seriePorComponente(empresaId, maquinaId, "CPU", dataInicial),
        monitoramentoModel.seriePorComponente(empresaId, maquinaId, "Memória", dataInicial),
        monitoramentoModel.seriePorComponente(empresaId, maquinaSelecionada, "Disco", dataInicial, 1),
        monitoramentoModel.disponibilidadePorEmpresa(empresaId),
        monitoramentoModel.alertasRecentes(empresaId)
        ]).then(function (resultados) {
        res.json({ maquinas: maquinas, maquinaSelecionada: maquinaSelecionada || null, metricas: resultados[0], cpu: resultados[1], memoria: resultados[2], disco: resultados[3], disponibilidade: resultados[4], alertas: resultados[5] });
        });
    }).catch(function (erro) {
        console.log(erro);
        res.status(500).json({ mensagem: "Não foi possível consultar o monitoramento." });
    });
}

function visaoGeral(req, res) {
    var empresaId = Number(req.params.empresaId);
    if (!empresaValida(empresaId)) return res.status(400).json({ mensagem: "Empresa inválida." });
    var dataInicial = obterPeriodo(req.query.periodo || "7d");
    Promise.all([
        monitoramentoModel.maximosHistoricos(empresaId),
        monitoramentoModel.seriePorComponente(empresaId, null, "CPU", dataInicial),
        monitoramentoModel.seriePorComponente(empresaId, null, "Memória", dataInicial),
        monitoramentoModel.seriePorComponente(empresaId, null, "Disco", dataInicial)
    ]).then(function (resultados) {
        res.json({ maximos: resultados[0], cpu: resultados[1], memoria: resultados[2], disco: resultados[3] });
    }).catch(function (erro) {
        console.log(erro);
        res.status(500).json({ mensagem: "Não foi possível consultar o histórico." });
    });
}

function analiseCpu(req, res) {
    var empresaId = Number(req.params.empresaId);
    var maquinaId = req.query.maquinaId ? Number(req.query.maquinaId) : null;
    if (!empresaValida(empresaId) || !idMaquinaValido(req.query.maquinaId)) {
        return res.status(400).json({ mensagem: "Identificador inválido." });
    }

    var janela = obterJanelaPeriodo(req.query.periodo);
    monitoramentoModel.listarMaquinas(empresaId).then(function (maquinas) {
        return Promise.all([
            monitoramentoModel.serieCpu(empresaId, maquinaId, janela.dataInicial, janela.dataFinal),
            monitoramentoModel.serieCpu(empresaId, maquinaId, janela.dataAnterior, janela.dataInicial),
            monitoramentoModel.limitesCpu(empresaId, maquinaId),
            monitoramentoModel.alertasCpu(empresaId, maquinaId, janela.dataInicial, janela.dataFinal)
        ]).then(function (resultados) {
            res.json({
                maquinas: maquinas,
                serie: resultados[0],
                serieAnterior: resultados[1],
                limites: resultados[2],
                alertas: resultados[3],
                periodo: { inicio: janela.dataInicial, fim: janela.dataFinal }
            });
        });
    }).catch(function (erro) {
        console.log(erro);
        res.status(500).json({ mensagem: "Não foi possível consultar a análise de CPU." });
    });
}

async function consultarRede(empresa, query = {}) {
    const idValido = v => typeof v === "string" && /^[1-9]\d*$/.test(v) && Number.isSafeInteger(Number(v));
    function falhar(status, mensagem) {
        throw Object.assign(new Error(mensagem), { status });
    }
    if (!idValido(String(empresa))) falhar(400, "Empresa inválida.");
    if (query.maquinaId !== undefined && !idValido(query.maquinaId)) falhar(400, "Máquina inválida.");
    if (query.interface !== undefined && (typeof query.interface !== "string" || !query.interface.length
        || query.interface.length > 49 || /[\u0000-\u001f]/.test(query.interface))) falhar(400, "Interface inválida.");
    const horas = { "1h": 1, "6h": 6, "24h": 24, "7d": 168 };
    const periodo = query.periodo || "6h";
    if (!Object.hasOwn(horas, periodo)) falhar(400, "Período inválido.");
    if (query.fonte !== undefined && query.fonte !== "basica") falhar(400, "Fonte inválida.");
    let fim = new Date(), inicio = new Date(fim.getTime() - horas[periodo] * 3600000);
    if (query.inicio !== undefined || query.fim !== undefined) {
        const iso = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
        if (typeof query.inicio !== "string" || typeof query.fim !== "string"
            || !iso.test(query.inicio) || !iso.test(query.fim)) falhar(400, "Janela inválida.");
        inicio = new Date(query.inicio); fim = new Date(query.fim);
        if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fim.getTime()) || fim <= inicio
            || fim - inicio > 168 * 3600000 || fim.getTime() > Date.now() + 1000
            || inicio.toISOString().slice(0, 19) !== query.inicio.slice(0, 19)
            || fim.toISOString().slice(0, 19) !== query.fim.slice(0, 19)) falhar(400, "Janela inválida.");
    }
    const empresaId = Number(empresa);
    const [empresas, maquinas, ampliada, configuracoes, slack] = await Promise.all([
        monitoramentoModel.empresaRede(empresaId), monitoramentoModel.listarMaquinas(empresaId),
        monitoramentoModel.possuiCapturaRede(), monitoramentoModel.configuracoesRede(empresaId),
        monitoramentoModel.configuracaoSlackRede(empresaId)
    ]);
    if (!empresas.length) falhar(404, "Empresa não encontrada.");
    const interfaces = await monitoramentoModel.interfacesRede(empresaId, ampliada);
    const maquina = query.maquinaId ? maquinas.find(m => m.id === Number(query.maquinaId)) : maquinas[0];
    if (query.maquinaId && !maquina) falhar(404, "Máquina não encontrada nesta empresa.");
    const disponiveis = interfaces.filter(i => i.maquinaId === maquina?.id);
    const interfaceNome = query.interface || disponiveis[0]?.interface || null;
    if (query.interface && !disponiveis.some(i => i.interface === query.interface)) falhar(404, "Interface não encontrada nesta máquina.");
    let fonte = ampliada && query.fonte !== "basica" ? "AMPLIADA" : "BASICA";
    let linhas = maquina && interfaceNome
        ? await monitoramentoModel.serieRede(empresaId, maquina.id, interfaceNome, inicio, fim, fonte === "AMPLIADA") : [];
    if (fonte === "AMPLIADA" && !linhas.length) {
        fonte = "BASICA";
        linhas = maquina && interfaceNome
            ? await monitoramentoModel.serieRede(empresaId, maquina.id, interfaceNome, inicio, fim, false) : [];
    }
    if (linhas.length > (fonte === "AMPLIADA" ? 200000 : 400000)) falhar(422, "Há muitas leituras. Selecione uma janela menor.");
    const analise = require("../models/analiseRede").analisarRede(linhas, fonte, inicio, fim);
    const ativa = id => configuracoes.find(c => c.maquina_id === id)?.disponibilidade === 1;
    if (maquina && !ativa(maquina.id)) analise.observacoes.unshift("A coleta de rede não está habilitada na configuração atual desta máquina.");
    return {
        empresa: empresas[0], maquinas, interfaces: interfaces.map(i => ({ ...i, ativa: ativa(i.maquinaId) })),
        selecao: { maquinaId: maquina?.id || null, hostname: maquina?.hostname || null,
            interface: interfaceNome, ativa: maquina ? ativa(maquina.id) : false },
        periodo: { id: periodo, inicio, fim }, geradoEm: new Date(), fonte, possuiColetaAmpliada: ampliada,
        configuracaoSlack: slack[0] || null,
        ...analise
    };
}

async function analiseRede(req, res) {
    try {
        res.json(await consultarRede(req.params.empresaId, req.query));
    } catch (erro) {
        res.status(erro.status || 500).json({ mensagem: erro.status ? erro.message : "Não foi possível consultar a análise de rede." });
    }
}

module.exports = { dashboard, visaoGeral, analiseCpu, analiseRede, consultarRede };
