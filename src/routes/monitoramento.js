var express = require("express");
var router = express.Router();
var monitoramentoController = require("../controllers/monitoramentoController");
var relatorioRedeController = require("../controllers/relatorioRedeController");

router.get("/dashboard/:empresaId", monitoramentoController.dashboard);
router.get("/visao-geral/:empresaId", monitoramentoController.visaoGeral);
router.get("/cpu/:empresaId", monitoramentoController.analiseCpu);
router.get("/redes/:empresaId", monitoramentoController.analiseRede);
router.post("/redes/:empresaId/relatorios", relatorioRedeController.gerar);
router.get("/redes/:empresaId/relatorios/:id", relatorioRedeController.consultar);
router.get("/redes/:empresaId/relatorios/:id/pdf", relatorioRedeController.baixar);

module.exports = router;
