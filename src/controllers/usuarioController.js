var usuarioModel = require("../models/usuarioModel");
var empresaModel = require("../models/empresaModel");
var cargoModel = require("../models/cargoModel");

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined || email == "") {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined || senha == "") {
        res.status(400).send("Sua senha está indefinida!");
    } else {
        usuarioModel.autenticar(email, senha)
            .then(function (resultadoAutenticar) {
                if (resultadoAutenticar.length == 1) {
                    res.json({
                        id: resultadoAutenticar[0].id,
                        email: resultadoAutenticar[0].email,
                        nome: resultadoAutenticar[0].nome,
                        telefone: resultadoAutenticar[0].telefone,
                        cpf: resultadoAutenticar[0].cpf,
                        empresaId: resultadoAutenticar[0].empresaId,
                        cargoId: resultadoAutenticar[0].cargoId
                    });
                } else if (resultadoAutenticar.length == 0) {
                    res.status(403).send("Email e/ou senha inválido(s)");
                } else {
                    res.status(403).send("Mais de um usuário com o mesmo login e senha!");
                }
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function cadastrar(req, res) {
    var nome = req.body.nomeServer;
    var telefone = req.body.telefoneServer;
    var email = req.body.emailServer;
    var cpf = req.body.cpfServer;
    var senha = req.body.senhaServer;
    var codigoEmpresa = req.body.codigoEmpresaServer;
    var cargo = req.body.cargoServer;

    if (nome == undefined || nome == "") {
        res.status(400).send("Seu nome está indefinido!");
    } else if (telefone == undefined || telefone == "") {
        res.status(400).send("Seu telefone está indefinido!");
    } else if (email == undefined || email == "") {
        res.status(400).send("Seu email está indefinido!");
    } else if (cpf == undefined || cpf == "") {
        res.status(400).send("Seu CPF está indefinido!");
    } else if (senha == undefined || senha == "") {
        res.status(400).send("Sua senha está indefinida!");
    } else if (codigoEmpresa == undefined || codigoEmpresa == "") {
        res.status(400).send("O código da empresa está indefinido!");
    } else if (cargo == undefined || cargo == "") {
        res.status(400).send("Seu cargo está indefinido!");
    } else {
        empresaModel.buscarPorCodigoAutenticacao(codigoEmpresa)
            .then(function (resultadoEmpresa) {
                if (resultadoEmpresa.length == 0) {
                    res.status(400).send("Código da empresa inválido ou não encontrado!");
                    return;
                }

                var empresaId = resultadoEmpresa[0].id;

                cargoModel.buscarPorIdOuNome(cargo)
                    .then(function (resultadoCargo) {
                        if (resultadoCargo.length == 0) {
                            res.status(400).send("Cargo não encontrado ou inválido!");
                            return;
                        }

                        var cargoId = resultadoCargo[0].id;

                        usuarioModel.cadastrar(nome, telefone, email, cpf, senha, empresaId, cargoId)
                            .then(function (resultadoCadastro) {
                                res.status(201).json(resultadoCadastro);
                            })
                            .catch(function (erroCadastro) {
                                console.log(erroCadastro);
                                res.status(500).json(erroCadastro.sqlMessage);
                            });
                    })
                    .catch(function (erroCargo) {
                        console.log(erroCargo);
                        res.status(500).json(erroCargo.sqlMessage);
                    });
            })
            .catch(function (erroEmpresa) {
                console.log(erroEmpresa);
                res.status(500).json(erroEmpresa.sqlMessage);
            });
    }
}

module.exports = {
    autenticar,
    cadastrar
};
