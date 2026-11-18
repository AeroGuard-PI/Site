# Guia para criação de páginas operacionais

Use este guia ao adicionar uma página à dashboard operacional. Ele complementa as regras obrigatórias de [`AGENTS.md`](../../AGENTS.md) e o índice [`DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md).

## 1. Preparação obrigatória

1. Leia `AGENTS.md`, `DESIGN_SYSTEM.md` e os documentos de Design System relacionados ao trabalho.
2. Analise [`public/visao-geral.html`](../../public/visao-geral.html) e [`public/maquinas.html`](../../public/maquinas.html), além do template em [`docs/templates/dashboard/`](../templates/dashboard/README.md).
3. Identifique primeiro os componentes existentes em [`04-componentes.md`](04-componentes.md), os tokens em `public/css/base/tokens.css` e os breakpoints em [`07-responsividade.md`](07-responsividade.md).
4. Antes de integrar dados, siga a arquitetura `Routes → Controllers → Models → Database Config`; confira rotas, controllers e models existentes para evitar duplicação.
5. Preserve `sessionStorage.EMPRESA_ID` como identificador da empresa. Nunca consulte SQL no frontend, altere schema ou crie migration sem autorização específica.

## 2. Estrutura da página

Copie o template para `public/` e renomeie seus marcadores. A estrutura da área principal parte de `maquinas.html`, por ser a referência operacional mais adequada entre as duas páginas de referência: contém header, painéis, formulário e tabela. A página deve manter `body.dashboard-page`, `.dashboard-layout`, `.dash__sidebar`, `.dashboard-main` e o cabeçalho `.dashboard-header`. Carregue Space Grotesk e Kanit, depois `css/style.css`, `css/dashboard.css`, seu CSS local e seu JavaScript específico com `defer`.

Use uma classe de página em elementos próprios, por exemplo `.reports-grid` ou `.reports-filter`, sem redefinir componentes compartilhados. A sidebar é parte da navegação operacional, não um componente a ser recriado por página.

### Navegação de referência

A sidebar de `dashboard.html` é a referência do template porque contém os atributos de acessibilidade e não duplica o destino de Visão Geral. `visao-geral.html` e `maquinas.html` ainda possuem links duplicados para Visão Geral, e regras locais escondem um deles; isso é uma pendência documentada, não um padrão para páginas novas.

Ao adicionar um destino, inclua um link com `.dash__nav-item`, `aria-current="page"` somente na página ativa, ícone SVG com `.icon.icon--20` e texto visível. Preserve o grupo de usuário e a combinação `btn btn--secondary btn--logout` no link de saída.

## 3. Componentes reais e exemplos

Os exemplos abaixo usam somente classes existentes.

```html
<!-- Ação principal, complementar e destrutiva -->
<button class="btn btn--filled" type="button">Salvar</button>
<button class="btn btn--secondary" type="button">Cancelar</button>
<button class="btn btn--danger" type="button">Excluir</button>

<!-- KPI -->
<dl class="kpis">
  <div class="kpi">
    <dt class="kpi__label">Indicador</dt>
    <dd class="kpi__value">—</dd>
    <dd class="kpi__delta">Sem dados</dd>
  </div>
</dl>

<!-- Painel e badge -->
<section class="panel">
  <div class="panel__head">
    <h2 class="panel__title">Título do painel</h2>
    <span class="badge badge--success"><span class="dot dot--success dot--sm"></span>Operacional</span>
  </div>
</section>
```

| Necessidade | Classes e referência |
|---|---|
| Indicadores | `.dot`, `.dot--success`, `.dot--warning`, `.pulse`; `base/indicators.css` |
| Alertas | `.alerts`, `.alert`, `.alert__icon--warning`, `.alert__text`; `dashboard.css` |
| Formulários | `.machine-fields`, `.machine-actions` quando a estrutura for equivalente; `maquinas.css` |
| Tabelas | `.machine-table-wrap` e `.machine-table`; manter wrapper para overflow horizontal |
| Barras | `.kpi__bar`, `.disks__bar` ou `.meter`, conforme o componente já existente |
| Gráficos | `.timeseries` com `canvas`; use Chart.js já carregado na página quando necessário |

`.btn--filled` é principal; `.btn--secondary`, complementar; `.btn--danger`, destrutivo. `.btn--logout` já existe e deve ser usada somente junto da ação de saída. `.btn--outlined` é legado: não é a variante preferida para páginas novas.

## 4. Responsividade

Não crie uma escala paralela. Reutilize os breakpoints atuais: dashboard em `1100px`, `820px` e `560px`; globais em `640px`, `768px`, `1024px` e `1280px`.

- Use `grid-template-columns: repeat(n, minmax(0, 1fr))` para grades de KPIs e painéis.
- Até `820px`, mantenha grades operacionais em uma coluna quando o conteúdo não couber.
- Até `560px`, a sidebar operacional se torna navegação horizontal; não crie uma segunda navegação.
- Envolva tabelas em `.machine-table-wrap`.
- Garanta altura definida ou responsiva para áreas de gráfico, como `.timeseries`.

## 5. Integração com backend

Crie integração somente quando houver necessidade funcional aprovada. Registre rota em `src/routes/`, delegue à controller, mantenha acesso a dados no model e reutilize `src/database/config.js`. Preserve os contratos existentes, autenticação, autorização e escopo por `EMPRESA_ID`.

## 6. Manutenção de componentes

Um componente novo aprovado deve reutilizar tokens existentes, seguir nomenclatura e arquitetura CSS atuais, documentar todos os estados, registrar-se em [`04-componentes.md`](04-componentes.md), fornecer exemplo de uso e ser validado nas páginas em que for aplicado. Não duplique componentes similares com estilos diferentes.

Antes de integrar, execute o [`10-checklist-integracao.md`](10-checklist-integracao.md).
