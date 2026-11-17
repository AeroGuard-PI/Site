var mysql = require("mysql2");

var mySqlConfig = {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    timezone: "Z",
    supportBigNumbers: true,
    bigNumberStrings: true
};

function configurarConexao(conexao, operacao, reject) {
    conexao.on("error", reject);
    conexao.query("SET time_zone = '+00:00'", function (erro) {
        if (erro) {
            conexao.destroy();
            return reject(erro);
        }
        operacao();
    });
}

function executar(instrucao, parametros = []) {

    if (process.env.AMBIENTE_PROCESSO !== "producao" && process.env.AMBIENTE_PROCESSO !== "desenvolvimento") {
        console.log("\nO AMBIENTE (produção OU desenvolvimento) NÃO FOI DEFINIDO EM .env OU dev.env OU app.js\n");
        return Promise.reject("AMBIENTE NÃO CONFIGURADO EM .env");
    }

    return new Promise(function (resolve, reject) {
        var conexao = mysql.createConnection(mySqlConfig);
        configurarConexao(conexao, function () {
            conexao.query(instrucao, parametros, function (erro, resultados) {
                if (erro) {
                    conexao.destroy();
                    return reject(erro);
                }
                conexao.end();
                resolve(resultados);
            });
        }, reject);
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
        configurarConexao(conexao, function () {
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

                Promise.resolve().then(function () { return operacao(executarNaTransacao); }).then(function (resultado) {
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
        }, reject);
    });
}

module.exports = {
    executar,
    executarTransacao
};
