var express = require("express");
var router = express.Router();
var monitoramentoController = require("../controllers/monitoramentoController");

router.get("/dashboard/:empresaId", monitoramentoController.dashboard);
router.get("/visao-geral/:empresaId", monitoramentoController.visaoGeral);

module.exports = router;
