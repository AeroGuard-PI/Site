var mysql = require("mysql2");

var mySqlConfig = {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
};

function executar(instrucao, parametros = []) {

    if (process.env.AMBIENTE_PROCESSO !== "producao" && process.env.AMBIENTE_PROCESSO !== "desenvolvimento") {
        console.log("\nO AMBIENTE (produção OU desenvolvimento) NÃO FOI DEFINIDO EM .env OU dev.env OU app.js\n");
        return Promise.reject("AMBIENTE NÃO CONFIGURADO EM .env");
    }

    return new Promise(function (resolve, reject) {
        var conexao = mysql.createConnection(mySqlConfig);
        conexao.query(instrucao, parametros, function (erro, resultados) {
            conexao.end();
            if (erro) {
                return reject(erro);
            }
            resolve(resultados);
        });
    });
}

// Mantém uma única conexão aberta somente durante operações que precisam ser
// concluídas juntas (por exemplo, máquina e suas configurações).
function executarTransacao(operacao) {
    if (process.env.AMBIENTE_PROCESSO !== "producao" && process.env.AMBIENTE_PROCESSO !== "desenvolvimento") {
        return Promise.reject("AMBIENTE NÃO CONFIGURADO EM .env");
    }

    return new Promise(function (resolve, reject) {
        var conexao = mysql.createConnection(mySqlConfig);
        conexao.beginTransaction(function (erroInicio) {
            if (erroInicio) {
                conexao.end();
                return reject(erroInicio);
            }

            function executarNaTransacao(instrucao, parametros = []) {
                return new Promise(function (resolveConsulta, rejectConsulta) {
                    conexao.query(instrucao, parametros, function (erro, resultados) {
                        if (erro) return rejectConsulta(erro);
                        resolveConsulta(resultados);
                    });
                });
            }

            Promise.resolve(operacao(executarNaTransacao)).then(function (resultado) {
                conexao.commit(function (erroCommit) {
                    conexao.end();
                    if (erroCommit) return reject(erroCommit);
                    resolve(resultado);
                });
            }).catch(function (erro) {
                conexao.rollback(function () {
                    conexao.end();
                    reject(erro);
                });
            });
        });
    });
}

module.exports = {
    executar,
    executarTransacao
};
