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

module.exports = { dashboard, visaoGeral, analiseCpu };
