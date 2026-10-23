var database = require("../database/config");

function buscarPorNome(nomeCargo) {
    var instrucaoSql = `SELECT id, nome FROM cargo WHERE nome = '${nomeCargo}' LIMIT 1;`;
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarPorNome
};
