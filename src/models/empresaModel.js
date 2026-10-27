var database = require("../database/config");

function buscarPorId(id) {
  var instrucaoSql = "SELECT * FROM empresa WHERE id = ?";
  return database.executar(instrucaoSql, [id]);
}

function listar() {
  var instrucaoSql = `SELECT id, razao_social, cnpj, codigoAutenticacao, codigoAutenticacao AS codigo_ativacao FROM empresa`;
  return database.executar(instrucaoSql);
}

function buscarPorCnpj(cnpj) {
  var instrucaoSql = "SELECT * FROM empresa WHERE cnpj = ?";
  return database.executar(instrucaoSql, [cnpj]);
}

function buscarPorCodigoAutenticacao(codigoAutenticacao) {
  var instrucaoSql = "SELECT id, razao_social, cnpj, codigoAutenticacao FROM empresa WHERE codigoAutenticacao = ? LIMIT 1";
  return database.executar(instrucaoSql, [codigoAutenticacao]);
}

function cadastrar(razaoSocial, cnpj) {
  var instrucaoSql = `INSERT INTO empresa (razao_social, cnpj) VALUES ('${razaoSocial}', '${cnpj}')`;
  return database.executar(instrucaoSql);
}

module.exports = {
  buscarPorCnpj,
  buscarPorId,
  buscarPorCodigoAutenticacao,
  cadastrar,
  listar,
};
