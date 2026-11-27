# Componentes

| Componente | Classes | Arquivo | Uso |
|---|---|---|---|
| Botão | `.btn`, `.btn--filled`, `.btn--secondary`, `.btn--danger`, `.btn--logout`, `.btn--outlined`, `.btn--lg`, `.btn--block` | `base/buttons.css` | `<button class="btn btn--filled">Salvar</button>` |
| KPI | `.kpis`, `.kpi`, `.kpi__label`, `.kpi__value`, `.kpi__bar`, `.kpi__delta` | `dashboard.css` para operacional; `sections/dashboard.css` para demonstração | indicadores de monitoramento |
| Painel | `.panel`, `.panel__head`, `.panel__title`, `.panel__meta` | mesmos arquivos do KPI | gráficos, listas e formulários |
| Badge | `.badge`, `.badge--success` | `dashboard.css` e `sections/dashboard.css` | estado operacional |
| Indicador | `.dot`, `.pulse`, variantes | `base/indicators.css` | status de máquinas |
| Medidor | `.meter` | `sections/hero.css` | telemetria; barras da dashboard usam `.kpi__bar` e `.disks__bar` |
| Campo | `.field`, `.field__control`, `.check-field` | `auth.css` | login e cadastro |
| Tabela | `.machine-table`, `.machine-table-wrap` | `maquinas.css` | máquinas cadastradas |
| Segmentado | `.segmented`, `.is-active` | `dashboard.css` e `sections/dashboard.css` | período de gráfico |
| Alerta | `.alert`, `.alert__icon`, variantes | `dashboard.css` e `sections/dashboard.css` | alertas recentes |

Os componentes de dashboard têm regras equivalentes, mas delimitadas: `.dashboard-page …` para a área operacional e seletores sem esse escopo para a demonstração dentro de `.dash` na landing.

## Variantes oficiais de botão

- `.btn--filled`: ação principal, como cadastrar, salvar e confirmar. Exemplo: `<button class="btn btn--filled">Salvar máquina</button>`. Mantém sua cor primária e usa somente a camada de estado no hover, sem sombra de elevação.
- `.btn--secondary`: ação complementar, como editar, cancelar, sair, voltar ou visualizar. Exemplo: `<button class="btn btn--secondary">Cancelar</button>`.
- `.btn--danger`: ação destrutiva, exclusivamente para remover dados. Exemplo: `<button class="btn btn--danger">Excluir</button>`. Usa contorno `--problem` com texto e ícones internos brancos no estado normal; no hover e active, recebe fundo `--problem` e mantém o conteúdo branco.
- `.btn--logout`: complemento de `.btn--secondary` para a saída da conta. Exemplo: `<a class="btn btn--secondary btn--logout">Sair</a>`. Mantém a aparência secundária normal e recebe fundo vermelho apenas no hover.

`.btn--outlined` continua disponível como variante legada neutra. Vermelho (`--problem`) é reservado à `.btn--danger` e à interação explícita `.btn--logout`; não deve ser aplicado a botões pelo texto, pela posição ou por seletores genéricos.

## Composição da análise de rede

`public/redes.html` reutiliza sidebar, KPI, painel, segmentado e tabela operacionais. `public/css/redes.css` contém apenas a composição específica: `.redes-filters`, `.redes-context`, `.redes-counters`, `.redes-summary` e `.redes-report-links`.

Os filtros identificam máquina e interface; os contadores mantêm RX, TX e descartes separados. Carregamento, falha, ausência de registros e campos sem suporte têm mensagens próprias. A geração do relatório desabilita a ação enquanto está em andamento e mantém resultado de envio separado do download.

RX utiliza `--signal`, TX utiliza `--mem`; os rótulos mantêm o significado sem depender da cor. Até 1100px, filtros e cartões usam duas colunas; até 820px, painéis passam a uma coluna; até 560px, filtros e resumos ficam em uma coluna, mantendo os cartões em duas. A navegação e o overflow da tabela seguem os componentes compartilhados.
