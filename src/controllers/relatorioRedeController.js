"use strict";

const { randomUUID } = require("node:crypto");
const { execFile } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const monitoramento = require("./monitoramentoController");
const trabalhos = new Map();
const iniciando = new Set();

const limpeza = setInterval(() => {
    for (const [id, trabalho] of trabalhos) {
        if (Date.now() - trabalho.criadoEm > 15 * 60000 && trabalho.status !== "PROCESSANDO") {
            trabalhos.delete(id);
            fs.rm(trabalho.diretorio, { recursive: true, force: true }).catch(() => {});
        }
    }
}, 60000);
limpeza.unref();

async function gerar(req, res) {
    if (req.body.enviarSlack !== undefined && typeof req.body.enviarSlack !== "boolean") {
        return res.status(400).json({ mensagem: "Opção de envio inválida." });
    }
    const empresaId = String(req.params.empresaId);
    if (iniciando.has(empresaId) || [...trabalhos.values()].some(t => t.empresaId === empresaId && t.status === "PROCESSANDO")) {
        return res.status(429).json({ mensagem: "Já existe um relatório sendo gerado para esta empresa." });
    }
    if (iniciando.size + [...trabalhos.values()].filter(t => t.status === "PROCESSANDO").length >= 2) {
        return res.status(429).json({ mensagem: "Aguarde a conclusão dos relatórios em andamento." });
    }
    iniciando.add(empresaId);
    try {
        const dados = await monitoramento.consultarRede(empresaId, req.query);
        if (!dados.selecao.interface) return res.status(422).json({ mensagem: "Selecione uma máquina com interface registrada." });
        if ([...trabalhos.values()].filter(t => t.status === "PROCESSANDO").length >= 2) {
            return res.status(429).json({ mensagem: "Aguarde a conclusão dos relatórios em andamento." });
        }
        const diretorio = await fs.mkdtemp(path.join(os.tmpdir(), "aeroguard-redes-"));
        const arquivo = path.join(diretorio, "relatorio-rede.pdf");
        const id = randomUUID();
        const trabalho = { empresaId, diretorio, arquivo, criadoEm: Date.now(), status: "PROCESSANDO" };
        trabalhos.set(id, trabalho);
        const argumentos = [path.resolve(__dirname, "../../relatorios/redes/gerar_relatorio.py"),
            "--dados-stdin", "--saida", arquivo];
        if (req.body.enviarSlack) argumentos.push("--enviar-slack");
        const processo = execFile(process.env.RELATORIO_PYTHON || "python3", argumentos,
            { timeout: 120000, maxBuffer: 1024 * 1024 }, async (erro, stdout) => {
                if (!erro) {
                    try {
                        trabalho.resultado = JSON.parse(stdout);
                        trabalho.status = "CONCLUIDO";
                        return;
                    } catch {}
                }
                const pronto = await fs.stat(arquivo).then(s => s.isFile(), () => false);
                if (pronto) {
                    trabalho.status = "CONCLUIDO";
                    trabalho.resultado = { arquivo: "relatorio-rede.pdf", envio: {
                        status: "NAO_CONFIRMADO", mensagem: "PDF gerado. A conclusão do envio não foi confirmada."
                    } };
                } else {
                    trabalho.status = "ERRO";
                    trabalho.mensagem = "Não foi possível gerar o PDF. Confira o ambiente Python do relatório.";
                }
            });
        processo.stdin.on("error", () => {});
        processo.stdin.end(JSON.stringify(dados));
        res.status(202).json({ id, status: trabalho.status });
    } catch (erro) {
        res.status(erro.status || 500).json({ mensagem: erro.status ? erro.message : "Não foi possível iniciar o relatório." });
    } finally {
        iniciando.delete(empresaId);
    }
}

function consultar(req, res) {
    const trabalho = trabalhos.get(req.params.id);
    if (!trabalho || trabalho.empresaId !== req.params.empresaId) {
        return res.status(404).json({ mensagem: "Relatório não encontrado ou expirado." });
    }
    res.set("Cache-Control", "no-store");
    res.json({ status: trabalho.status, mensagem: trabalho.mensagem,
        resultado: trabalho.resultado, download: trabalho.status === "CONCLUIDO"
            ? `/monitoramento/redes/${trabalho.empresaId}/relatorios/${req.params.id}/pdf` : null });
}

function baixar(req, res) {
    const trabalho = trabalhos.get(req.params.id);
    if (!trabalho || trabalho.empresaId !== req.params.empresaId || trabalho.status !== "CONCLUIDO") {
        return res.status(404).json({ mensagem: "Relatório não encontrado ou expirado." });
    }
    res.set("Cache-Control", "no-store");
    res.download(trabalho.arquivo, "AeroGuard-Relatorio-Rede.pdf");
}

module.exports = { gerar, consultar, baixar };
