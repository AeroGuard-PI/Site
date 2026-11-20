import argparse
import json
import math
import os
import sys
from datetime import datetime
from html import escape
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Flowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError


AZUL = colors.HexColor("#007dc5")
RECEPCAO = colors.HexColor("#007dc5")
TRANSMISSAO = colors.HexColor("#5b8def")
ESCURO = colors.HexColor("#151c26")
CINZA = colors.HexColor("#526477")
CLARO = colors.HexColor("#eef4f8")
FUSO = ZoneInfo("America/Sao_Paulo")
LARGURA = A4[0] - 88
ESTILOS = {
    "texto": ParagraphStyle("texto", fontName="Helvetica", fontSize=9.5, leading=14, spaceAfter=8, textColor=ESCURO),
    "titulo": ParagraphStyle("titulo", fontName="Helvetica-Bold", fontSize=21, leading=26, spaceAfter=14, textColor=ESCURO),
    "secao": ParagraphStyle("secao", fontName="Helvetica-Bold", fontSize=12, leading=16, spaceBefore=12, spaceAfter=8, textColor=AZUL, keepWithNext=True),
    "celula": ParagraphStyle("celula", fontName="Helvetica", fontSize=8.5, leading=12, textColor=ESCURO),
}


def texto(valor, estilo="texto"):
    return Paragraph(escape(str(valor)), ESTILOS[estilo])


def numero(valor, casas=2):
    if valor is None:
        return "Indisponível"
    return f"{valor:,.{casas}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def taxa(valor):
    casas = min(8, 2 - math.floor(math.log10(valor))) if valor is not None and 0 < valor < .01 else 2
    return numero(valor, casas)


def data(valor):
    if not valor:
        return "Indisponível"
    return datetime.fromisoformat(valor.replace("Z", "+00:00")).astimezone(FUSO).strftime("%d/%m/%Y %H:%M:%S")


def volume(valor):
    if valor is None:
        return "Indisponível"
    for unidade in ["B", "kB", "MB", "GB"]:
        if valor < 1000 or unidade == "GB":
            return numero(valor) + " " + unidade
        valor /= 1000


def tabela(linhas, larguras):
    conteudo = [[texto(v, "celula") for v in linha] for linha in linhas]
    t = Table(conteudo, colWidths=larguras, repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dceaf4")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [CLARO, colors.white]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


class GraficoRede(Flowable):
    def __init__(self, pontos, campos, inicio, fim, unidade, barras=False):
        super().__init__()
        self.width, self.height = LARGURA, 190
        self.pontos, self.campos = pontos, campos
        self.inicio = datetime.fromisoformat(inicio.replace("Z", "+00:00")).timestamp() * 1000
        self.fim = datetime.fromisoformat(fim.replace("Z", "+00:00")).timestamp() * 1000
        self.unidade, self.barras = unidade, barras

    def draw(self):
        c = self.canv
        x0, y0, w, h = 53, 35, self.width - 65, 124
        paleta = [RECEPCAO, TRANSMISSAO, colors.HexColor("#f2b84b")]
        valores = [p.get(chave) for p in self.pontos for chave, _ in self.campos if p.get(chave) is not None]
        maximo = max(valores, default=0) or 1
        if self.barras:
            passo = max(1, math.ceil(maximo / 4))
            marcas = list(range(0, math.ceil(maximo) + passo, passo))
            maximo = marcas[-1]
        else:
            marcas = [maximo * i / 4 for i in range(5)]
        c.setFont("Helvetica", 7)
        for valor in marcas:
            yy = y0 + h * valor / maximo
            c.setStrokeColor(colors.HexColor("#d7e0e8"))
            c.line(x0, yy, x0 + w, yy)
            c.setFillColor(CINZA)
            casas = 0 if self.barras else min(8, max(2, 1 - math.floor(math.log10(maximo))))
            c.drawRightString(x0 - 7, yy - 2, numero(valor, casas))
        c.drawString(0, y0 + h + 12, self.unidade)
        for i in range(5):
            tempo = self.inicio + (self.fim - self.inicio) * i / 4
            label = datetime.fromtimestamp(tempo / 1000, FUSO).strftime("%d/%m %H:%M")
            c.drawCentredString(x0 + w * i / 4, y0 - 15, label)
        for j, (campo, nome) in enumerate(self.campos):
            c.setStrokeColor(paleta[j])
            c.setFillColor(paleta[j])
            c.setLineWidth(1.2)
            anterior = None
            for p in self.pontos:
                valor = p.get(campo)
                if valor is None:
                    anterior = None
                    continue
                xx = x0 + (p["instante"] - self.inicio) / (self.fim - self.inicio) * w
                yy = y0 + valor / maximo * h
                if self.barras:
                    largura = w / max(len(self.pontos), 1) / 4
                    c.rect(xx + (j - 1) * largura, y0, max(.7, largura), max(0, yy - y0), fill=1, stroke=0)
                else:
                    if anterior:
                        c.line(*anterior, xx, yy)
                    else:
                        c.circle(xx, yy, 1.4, fill=1, stroke=0)
                    anterior = (xx, yy)
            c.setFont("Helvetica", 8)
            c.rect(x0 + j * 130, 6, 6, 6, fill=1, stroke=0)
            c.setFillColor(CINZA)
            c.drawString(x0 + j * 130 + 10, 7, nome)
        if not valores:
            c.setFillColor(CINZA)
            c.setFont("Helvetica", 10)
            c.drawCentredString(x0 + w / 2, y0 + h / 2, "Sem leituras disponíveis neste recorte")


def gerar_pdf(dados, saida):
    k = dados["indicadores"]
    selecao, periodo = dados["selecao"], dados["periodo"]
    basica = dados["fonte"] != "AMPLIADA"
    documento = SimpleDocTemplate(str(saida), pagesize=A4, leftMargin=44, rightMargin=44, topMargin=63, bottomMargin=48,
                                 title="AeroGuard | Relatório de rede", author="AeroGuard")
    corpo = [texto("Relatório de rede", "titulo"), texto(dados["empresa"]["nome"]),
        tabela([
            ["Máquina e interface", "Janela analisada · America/Sao_Paulo"],
            [f'{selecao["hostname"]} · {selecao["interface"]}', f'{data(periodo["inicio"])} até {data(periodo["fim"])}'],
            ["Origem dos dados", "Geração do relatório"],
            ["Histórico básico de Mbps" if basica else "Coleta ampliada por intervalo", data(dados["geradoEm"])],
        ], [LARGURA / 2] * 2), Spacer(1, 12),
        texto("Tráfego e integridade local", "secao"),
        tabela([
            ["Indicador", "Recepção (RX)", "Transmissão (TX)"],
            ["Última taxa válida (Mbps)", taxa(k["rxAtual"]), taxa(k["txAtual"])],
            ["Maior taxa observada (Mbps)", taxa(k["picoRx"]), taxa(k["picoTx"])],
            ["Média ponderada (Mbps)", taxa(k["mediaRx"]), taxa(k["mediaTx"])],
            ["Volume nos intervalos completos", volume(k["volumeRxBytes"]), volume(k["volumeTxBytes"])],
            ["Erros locais contados", numero(k["errosRx"], 0), numero(k["errosTx"], 0)],
            ["Descartes locais contados", numero(k["descartesRx"], 0), "Não coletado"],
        ], [LARGURA * .46, LARGURA * .27, LARGURA * .27]),
        texto("Recepção e transmissão ao longo do período", "secao"),
        GraficoRede(dados["serie"], [("rx", "Recepção RX"), ("tx", "Transmissão TX")], periodo["inicio"], periodo["fim"], "Mbps"),
        texto("A apresentação preserva extremos e lacunas. Os indicadores utilizam as leituras válidas anteriores a qualquer redução visual."),
        texto("Qualidade da evidência", "secao"),
        tabela([
            ["Informação", "Valor"],
            ["Estado operacional reportado", k["estado"] or "Indisponível nesta versão"],
            ["Última coleta", data(k["ultimoColetadoEm"])],
            ["Última chegada ao banco", data(k["ultimoRecebidoEm"])],
            ["Cobertura da janela", numero(k["coberturaPct"]) + ("%" if k["coberturaPct"] is not None else "")],
            ["Intervalos completos válidos", numero(k["intervalosValidos"], 0)],
            ["Limites dos totais por intervalo", f'{data(k["inicioCoberto"])} até {data(k["fimCoberto"])}'],
            ["Contadores parciais", "Sim" if k["contadoresParciais"] else "Sem leituras parciais nos intervalos incluídos" if not basica else "Não registrados"],
        ], [LARGURA * .43, LARGURA * .57]),
        texto("Erros e descartes locais por janela", "secao"),
        GraficoRede(dados["integridade"], [("errosRx", "Erros RX"), ("errosTx", "Erros TX"), ("descartesRx", "Descartes RX")],
                    periodo["inicio"], periodo["fim"], "Contagem", barras=True),
        texto("Observações para investigação", "secao")]
    corpo.extend(texto("• " + observacao) for observacao in dados["observacoes"])
    corpo.extend([texto("Como interpretar", "secao"),
        texto("Mbps representa tráfego, não tempo de resposta ou percentual de capacidade. Erros e descartes são contadores locais, não uma medição de perda de ponta a ponta. Estado UP não garante o funcionamento de uma aplicação."),
        texto("Cobertura representa a duração dos intervalos válidos observados. Não é uptime. Volumes e contadores incluem intervalos completos dentro da janela; suas bordas não são estimadas. Zero observado é diferente de informação indisponível."),
        texto("Use o período e a interface identificados para encaminhar a investigação. Confirme manutenção, estado da coleta e contexto operacional antes de atribuir uma causa.")])

    def rodape(c, doc):
        c.setFont("Helvetica-Bold", 10); c.setFillColor(AZUL)
        c.drawString(44, A4[1] - 34, "AEROGUARD")
        c.setFont("Helvetica", 8); c.setFillColor(CINZA)
        c.drawRightString(A4[0] - 44, A4[1] - 34, "Análise operacional de rede")
        c.drawString(44, 25, "Fuso: America/Sao_Paulo · Evidências de coleta por máquina e interface")
        c.drawRightString(A4[0] - 44, 25, str(doc.page))

    saida.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    documento.build(corpo, onFirstPage=rodape, onLaterPages=rodape)


def enviar_slack(dados, saida):
    configuracao = dados.get("configuracaoSlack") or {}
    if not configuracao.get("ativo"):
        return {"status": "DESATIVADO", "mensagem": "PDF gerado. O envio ao Slack está desativado para esta empresa."}
    canal = configuracao.get("canal", "")
    if not canal.startswith(("C", "G")) or not canal.isalnum():
        return {"status": "FALHOU", "codigo": "canal_invalido", "mensagem": "PDF gerado. Cadastre o ID do canal no banco para enviar o arquivo."}
    token = os.getenv("SLACK_BOT_TOKEN", "").strip()
    if not token:
        return {"status": "FALHOU", "codigo": "token_ausente", "mensagem": "PDF gerado. Configure o token de integração para enviar o arquivo."}
    try:
        selecao = dados["selecao"]
        resposta = WebClient(token=token, timeout=30).files_upload_v2(
            channel=canal, file=str(saida), title="AeroGuard | Relatório de rede.pdf",
            initial_comment=f'Relatório de rede · {selecao["hostname"]} · {selecao["interface"]}\n'
                            f'{data(dados["periodo"]["inicio"])} até {data(dados["periodo"]["fim"])} (Brasília)')
        arquivos = resposta.get("files", [])
        return {"status": "ENVIADO", "mensagem": "PDF enviado ao Slack.", "url": arquivos[0].get("permalink") if arquivos else None}
    except SlackApiError as erro:
        codigo = erro.response.get("error", "slack_indisponivel")
        mensagens = {
            "missing_scope": "O aplicativo precisa da permissão files:write para enviar o PDF.",
            "not_in_channel": "Adicione o aplicativo ao canal configurado.",
            "channel_not_found": "Confira o ID do canal e o acesso do aplicativo.",
            "invalid_auth": "O token de integração não foi aceito.",
            "token_revoked": "O token de integração foi revogado.",
        }
        return {"status": "FALHOU", "codigo": codigo, "mensagem": "PDF gerado. " + mensagens.get(codigo, "O Slack não concluiu o envio.")}
    except (OSError, TimeoutError):
        return {"status": "FALHOU", "codigo": "conexao", "mensagem": "PDF gerado. Não foi possível concluir a conexão com o Slack."}


def main():
    parser = argparse.ArgumentParser(description="Gerar relatório de rede do AeroGuard")
    parser.add_argument("--dados-stdin", action="store_true")
    parser.add_argument("--empresa", type=int)
    parser.add_argument("--maquina", type=int)
    parser.add_argument("--interface")
    parser.add_argument("--periodo", choices=["1h", "6h", "24h", "7d"], default="6h")
    parser.add_argument("--api-url", default=os.getenv("AEROGUARD_API_URL", "http://127.0.0.1:3333"))
    parser.add_argument("--saida", type=Path, default=Path("relatorios-gerados/relatorio-rede.pdf"))
    parser.add_argument("--enviar-slack", action="store_true")
    args = parser.parse_args()
    load_dotenv(os.getenv("AEROGUARD_ENV", ".env"))
    if args.dados_stdin:
        dados = json.load(sys.stdin)
    else:
        if not args.empresa or args.empresa < 1:
            parser.error("Informe --empresa com um identificador positivo.")
        consulta = {"periodo": args.periodo}
        if args.maquina is not None: consulta["maquinaId"] = args.maquina
        if args.interface: consulta["interface"] = args.interface
        with urlopen(args.api_url.rstrip("/") + f"/monitoramento/redes/{args.empresa}?" + urlencode(consulta), timeout=30) as resposta:
            dados = json.load(resposta)
    if not dados["selecao"]["interface"]:
        parser.error("A máquina não possui interface registrada.")
    parcial = args.saida.with_suffix(".pdf.parcial")
    gerar_pdf(dados, parcial)
    parcial.replace(args.saida)
    args.saida.chmod(0o600)
    envio = enviar_slack(dados, args.saida) if args.enviar_slack else {"status": "NAO_SOLICITADO", "mensagem": "PDF disponível para download."}
    print(json.dumps({"arquivo": args.saida.name, "envio": envio}, ensure_ascii=False))


if __name__ == "__main__":
    main()
