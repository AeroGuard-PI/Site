# Tipografia

## Famílias

Fonte: [`public/css/base/tokens.css`](../../public/css/base/tokens.css).

- `--font-sans`: `Space Grotesk`, `ui-sans-serif`, `system-ui`, `sans-serif`; texto e títulos principais.
- `--font-mono`: `Kanit`, `sans-serif`; métricas, rótulos técnicos, navegação, badges e dados temporais.

As fontes são importadas do Google Fonts nas páginas principais. Os pesos efetivamente presentes incluem 400, 500, 550, 600, 650 e 700.

## Hierarquia existente

- `.h2`: `2.25rem`, chegando a `3.75rem` em `768px`.
- `.h3`: `1.25rem`.
- Hero e títulos de autenticação: escalas fluidas entre `2rem` e `5.5rem`, conforme o contexto.
- `.lead`: `1.125rem`, line-height `1.625`, `--muted`.
- Rótulos técnicos: 10–11px, Kanit, caixa alta e espaçamento de letras entre `.14em` e `.18em`.
- KPIs: `1.5rem`, Kanit, peso 500 e números tabulares.
