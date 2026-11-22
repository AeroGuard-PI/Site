var usuarioModel = require("../models/usuarioModel");
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
                        cargoId: resultadoAutenticar[0].cargoId,
                        cargoNome: resultadoAutenticar[0].cargoNome,
                        isAdmin: Boolean(resultadoAutenticar[0].isAdmin)
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

function instalar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;
    if (typeof email !== "string" || !email.trim() || typeof senha !== "string" || !senha) {
        return res.status(400).json({ mensagem: "Informe e-mail e senha." });
    }
    usuarioModel.autenticar(email.trim(), senha).then(function (usuarios) {
        if (usuarios.length !== 1) {
            return res.status(403).json({ mensagem: "E-mail ou senha inválidos." });
        }
        if (!process.env.COLETOR_DB_HOST || !process.env.COLETOR_DB_USER || !process.env.COLETOR_DB_PASSWORD) {
            return res.status(503).json({ mensagem: "A conexão dos coletores não foi configurada na central." });
        }
        var usuario = usuarios[0];
        res.set("Cache-Control", "no-store");
        res.json({
            empresa: { cnpj: usuario.empresaCnpj, nome: usuario.empresaNome },
            banco: {
                host: process.env.COLETOR_DB_HOST,
                porta: Number(process.env.COLETOR_DB_PORT || 3306),
                usuario: process.env.COLETOR_DB_USER,
                senha: process.env.COLETOR_DB_PASSWORD
            }
        });
    }).catch(function () {
        res.status(500).json({ mensagem: "Não foi possível consultar o usuário." });
    });
}

function cadastrar(req, res) {
    var nome = req.body.nomeServer;
    var telefone = req.body.telefoneServer;
    var email = req.body.emailServer;
    var cpf = req.body.cpfServer;
    var senha = req.body.senhaServer;
    var empresaId = req.body.empresaIdServer;
    var cargo = req.body.cargoServer;

    if (nome == undefined || nome == "") {
        res.status(400).send("O nome está indefinido!");
    } else if (telefone == undefined || telefone == "") {
        res.status(400).send("O telefone está indefinido!");
    } else if (email == undefined || email == "") {
        res.status(400).send("O email está indefinido!");
    } else if (cpf == undefined || cpf == "") {
        res.status(400).send("O CPF está indefinido!");
    } else if (senha == undefined || senha == "") {
        res.status(400).send("A senha está indefinida!");
    } else if (empresaId == undefined || empresaId == "") {
        res.status(400).send("A empresa está indefinida!");
    } else if (cargo == undefined || cargo == "") {
        res.status(400).send("O cargo está indefinido!");
    } else {
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
                        if (erroCadastro.code === "ER_DUP_ENTRY") {
                            return res.status(409).send("E-mail ou CPF já cadastrado.");
                        }
                        res.status(500).json(erroCadastro.sqlMessage);
                    });
            })
            .catch(function (erroCargo) {
                console.log(erroCargo);
                res.status(500).json(erroCargo.sqlMessage);
            });
    }
}

function listarPorEmpresa(req, res) {
    var empresaId = req.params.empresaId;
    if (!empresaId) {
        return res.status(400).send("Empresa não informada!");
    }
    usuarioModel.listarPorEmpresa(empresaId)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function editar(req, res) {
    var id = Number(req.params.id);
    var nome = req.body.nomeServer;
    var telefone = req.body.telefoneServer;
    var email = req.body.emailServer;
    var cpf = req.body.cpfServer;
    var senha = req.body.senhaServer;
    var empresaId = req.body.empresaIdServer;
    var cargo = req.body.cargoServer;

    if (!id || id <= 0) {
        return res.status(400).send("O id do usuário é inválido!");
    } else if (nome == undefined || nome == "") {
        return res.status(400).send("O nome está indefinido!");
    } else if (telefone == undefined || telefone == "") {
        return res.status(400).send("O telefone está indefinido!");
    } else if (email == undefined || email == "") {
        return res.status(400).send("O email está indefinido!");
    } else if (cpf == undefined || cpf == "") {
        return res.status(400).send("O CPF está indefinido!");
    } else if (empresaId == undefined || empresaId == "") {
        return res.status(400).send("A empresa está indefinida!");
    } else if (cargo == undefined || cargo == "") {
        return res.status(400).send("O cargo está indefinido!");
    }

    cargoModel.buscarPorIdOuNome(cargo)
        .then(function (resultadoCargo) {
            if (resultadoCargo.length == 0) {
                return res.status(400).send("Cargo não encontrado ou inválido!");
            }

            var cargoId = resultadoCargo[0].id;

            usuarioModel.editar(id, nome, telefone, email, cpf, senha, empresaId, cargoId)
                .then(function (resultadoEdicao) {
                    if (resultadoEdicao.affectedRows === 0) {
                        return res.status(404).send("Usuário não encontrado.");
                    }
                    res.status(200).json(resultadoEdicao);
                })
                .catch(function (erroEdicao) {
                    console.log(erroEdicao);
                    if (erroEdicao.code === "ER_DUP_ENTRY") {
                        return res.status(409).send("E-mail ou CPF já cadastrado.");
                    }
                    res.status(500).json(erroEdicao.sqlMessage);
                });
        })
        .catch(function (erroCargo) {
            console.log(erroCargo);
            res.status(500).json(erroCargo.sqlMessage);
        });
}

function deletar(req, res) {
    var id = Number(req.params.id);
    var empresaId = Number(req.params.empresaId);

    if (!id || id <= 0) {
        return res.status(400).send("O id do usuário é inválido!");
    }
    if (!empresaId || empresaId <= 0) {
        return res.status(400).send("A empresa não foi informada!");
    }

    usuarioModel.deletar(id, empresaId)
        .then(function (resultadoExclusao) {
            if (resultadoExclusao.affectedRows === 0) {
                return res.status(404).send("Usuário não encontrado.");
            }
            res.status(200).json(resultadoExclusao);
        })
        .catch(function (erroExclusao) {
            console.log(erroExclusao);
            res.status(500).json(erroExclusao.sqlMessage);
        });
}

module.exports = {
    autenticar,
    instalar,
    cadastrar,
    listarPorEmpresa,
    editar,
    deletar
};
