var maquinaModel = require("../models/maquinaModel");

var macAddressValido = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;

function idValido(valor) {
    return Number.isInteger(Number(valor)) && Number(valor) > 0;
}

function dadosValidos(req) {
    var dados = req.body;
    var componentesIds = Array.isArray(dados.componentesIds) ? [...new Set(dados.componentesIds.map(Number))] : [];
    if (!dados.hostname || !dados.hostname.trim() || !dados.so || !dados.so.trim()) return { erro: "Informe hostname e sistema operacional." };
    if (!macAddressValido.test(dados.macAddress || "")) return { erro: "Informe um MAC Address válido." };
    if (!idValido(dados.empresaId)) return { erro: "Empresa inválida." };
    if (!componentesIds.length || componentesIds.some(function (id) { return !idValido(id); })) return { erro: "Selecione ao menos um componente válido." };
    return { hostname: dados.hostname.trim(), so: dados.so.trim(), macAddress: dados.macAddress.toUpperCase(), empresaId: Number(dados.empresaId), componentesIds: componentesIds };
}

function responderErro(res, erro) {
    if (erro && erro.codigo === "MAC_DUPLICADO") return res.status(409).json({ mensagem: "Já existe uma máquina com este MAC Address nesta empresa." });
    if (erro && erro.codigo === "COMPONENTE_INVALIDO") return res.status(400).json({ mensagem: "Um ou mais componentes selecionados são inválidos." });
    if (erro && erro.codigo === "NAO_ENCONTRADA") return res.status(404).json({ mensagem: "Máquina não encontrada para a empresa informada." });
    if (erro && (erro.codigo === "MAQUINA_COM_HISTORICO" || erro.codigo === "CONFIGURACAO_COM_HISTORICO")) return res.status(409).json({ mensagem: "A operação não pode ser realizada porque a máquina ou configuração possui histórico de capturas." });
    console.log(erro);
    return res.status(500).json({ mensagem: "Não foi possível concluir a operação." });
}

function listarComponentes(req, res) { maquinaModel.listarComponentes().then(function (resultado) { res.json(resultado); }).catch(function (erro) { responderErro(res, erro); }); }
function listarPorEmpresa(req, res) {
    if (!idValido(req.params.empresaId)) return res.status(400).json({ mensagem: "Empresa inválida." });
    maquinaModel.listarPorEmpresa(Number(req.params.empresaId)).then(function (resultado) { res.json(resultado); }).catch(function (erro) { responderErro(res, erro); });
}
function buscarPorId(req, res) {
    if (!idValido(req.params.idMaquina) || !idValido(req.params.empresaId)) return res.status(400).json({ mensagem: "Identificador inválido." });
    maquinaModel.buscarPorId(Number(req.params.idMaquina), Number(req.params.empresaId)).then(function (resultado) {
        if (!resultado.length) return res.status(404).json({ mensagem: "Máquina não encontrada para a empresa informada." });
        res.json(resultado);
    }).catch(function (erro) { responderErro(res, erro); });
}
function cadastrar(req, res) {
    var dados = dadosValidos(req);
    if (dados.erro) return res.status(400).json({ mensagem: dados.erro });
    maquinaModel.cadastrar(dados.hostname, dados.so, dados.macAddress, dados.empresaId, dados.componentesIds).then(function (resultado) { res.status(201).json(resultado); }).catch(function (erro) { responderErro(res, erro); });
}
function editar(req, res) {
    var dados = dadosValidos(req);
    if (!idValido(req.params.idMaquina)) return res.status(400).json({ mensagem: "Máquina inválida." });
    if (dados.erro) return res.status(400).json({ mensagem: dados.erro });
    maquinaModel.editar(Number(req.params.idMaquina), dados.hostname, dados.so, dados.macAddress, dados.empresaId, dados.componentesIds).then(function () { res.status(204).send(); }).catch(function (erro) { responderErro(res, erro); });
}
function deletar(req, res) {
    if (!idValido(req.params.idMaquina) || !idValido(req.params.empresaId)) return res.status(400).json({ mensagem: "Identificador inválido." });
    maquinaModel.deletar(Number(req.params.idMaquina), Number(req.params.empresaId)).then(function () { res.status(204).send(); }).catch(function (erro) { responderErro(res, erro); });
}

module.exports = { listarComponentes, listarPorEmpresa, buscarPorId, cadastrar, editar, deletar };
