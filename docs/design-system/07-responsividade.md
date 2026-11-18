# Responsividade

Breakpoints globais: `640px`, `768px`, `1024px` e `1280px` em `public/css/responsive.css`.

Dashboard operacional (`dashboard.css`):

- `1100px`: KPIs em três colunas.
- `820px`: sidebar compacta, painéis em coluna única.
- `560px`: navegação operacional horizontal, KPIs em duas colunas e padding reduzido.

Autenticação (`auth.css`): `1100px`, `800px` e `520px`; a imagem desaparece a partir de `800px`, e o cadastro torna-se uma coluna em `520px`.

Máquinas (`maquinas.css`): campos passam de três para uma coluna até `820px`; a tabela usa `.machine-table-wrap` com overflow horizontal. Partners possui regra em `768px` e FAQ em `48rem`.
