var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

//Recebendo os dados do html e direcionando para a função cadastrar de usuarioController.js
router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
})

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});

router.get("/listar/:empresaId", function (req, res) {
    usuarioController.listarPorEmpresa(req, res);
});

router.put("/editar/:id", function (req, res) {
    usuarioController.editar(req, res);
});

router.delete("/deletar/:id/:empresaId", function (req, res) {
    usuarioController.deletar(req, res);
});

router.post("/instalar", function (req, res) {
    usuarioController.instalar(req, res);
});

module.exports = router;
