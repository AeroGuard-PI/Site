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

function dashboard(req, res) {
    var empresaId = Number(req.params.empresaId);
    var maquinaId = req.query.maquinaId ? Number(req.query.maquinaId) : null;
    if (!empresaValida(empresaId) || !idMaquinaValido(req.query.maquinaId)) return res.status(400).json({ mensagem: "Identificador inválido." });
    var dataInicial = obterPeriodo(req.query.periodo);
    Promise.all([
        monitoramentoModel.listarMaquinas(empresaId),
        monitoramentoModel.ultimasMetricas(empresaId, maquinaId),
        monitoramentoModel.seriePorComponente(empresaId, maquinaId, "CPU", dataInicial),
        monitoramentoModel.seriePorComponente(empresaId, maquinaId, "Memória", dataInicial),
        monitoramentoModel.seriePorComponente(empresaId, maquinaId, "Disco", dataInicial),
        monitoramentoModel.disponibilidadePorEmpresa(empresaId),
        monitoramentoModel.alertasRecentes(empresaId)
    ]).then(function (resultados) {
        res.json({ maquinas: resultados[0], metricas: resultados[1], cpu: resultados[2], memoria: resultados[3], disco: resultados[4], disponibilidade: resultados[5], alertas: resultados[6] });
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

module.exports = { dashboard, visaoGeral };
