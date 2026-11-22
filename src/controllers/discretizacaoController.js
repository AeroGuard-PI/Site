var model = require("../models/discretizacaoModel");
function idOk(v) { return Number.isInteger(Number(v)) && Number(v) > 0; }
function erro(res, e) {
  if (e.codigo === "ASSOCIACAO_NAO_ENCONTRADA" || e.codigo === "CONFIGURACAO_NAO_ENCONTRADA") return res.status(404).json({ mensagem: "Configuração ou componente não encontrado para esta empresa." });
  if (e.codigo === "JA_CONFIGURADA") return res.status(409).json({ mensagem: "Este componente já possui limites configurados." });
  console.error(e);
  return res.status(500).json({ mensagem: "Não foi possível concluir a operação." });
}
function limites(req) {
  var a = req.body.limiteAlerta, c = req.body.limiteCritico;
  if (!Number.isInteger(a) || !Number.isInteger(c) || a < 0 || c > 100 || a >= c) return null;
  return [a, c];
}
function listarPorMaquina(req, res) {
  if (!idOk(req.params.idMaquina) || !idOk(req.params.empresaId)) return res.status(400).json({ mensagem: "Identificador inválido." });
  model.listarPorMaquina(Number(req.params.idMaquina), Number(req.params.empresaId)).then(r => res.json(r)).catch(e => erro(res, e));
}
function gravar(req, res, editar) {
  var cfg = Number(editar ? req.params.configMaquinaId : req.body.configMaquinaId), emp = Number(req.body.empresaId), l = limites(req);
  if (!idOk(cfg) || !idOk(emp)) return res.status(400).json({ mensagem: "Identificador inválido." });
  if (!l) return res.status(400).json({ mensagem: "Informe limites inteiros de 0 a 100, com ALERTA menor que CRÍTICO." });
  (editar ? model.editar(cfg, emp, l[0], l[1]) : model.cadastrar(cfg, emp, l[0], l[1])).then(() => res.status(200).json({ mensagem: "Limites salvos." })).catch(e => erro(res, e));
}
function cadastrar(req, res) { gravar(req, res, false); }
function editar(req, res) { gravar(req, res, true); }
function resetar(req, res) {
  var cfg = Number(req.params.configMaquinaId), emp = Number(req.body.empresaId);
  if (!idOk(cfg) || !idOk(emp)) return res.status(400).json({ mensagem: "Identificador inválido." });
  model.resetar(cfg, emp).then(() => res.json({ mensagem: "Limites restaurados para 80% e 90%." })).catch(e => erro(res, e));
}
module.exports = { listarPorMaquina, cadastrar, editar, resetar };
