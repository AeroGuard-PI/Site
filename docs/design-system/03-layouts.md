# Layouts

## Dashboard operacional

Arquivos: [`public/css/dashboard.css`](../../public/css/dashboard.css), [`public/dashboard.html`](../../public/dashboard.html), [`public/visao-geral.html`](../../public/visao-geral.html) e [`public/maquinas.html`](../../public/maquinas.html).

Usa `.dashboard-page`, `.dashboard-layout`, sidebar `.dash__sidebar`, área `.dashboard-main`, `.dashboard-grid` e `.dashboard-kpis`. A sidebar é sticky, escura, com navegação de itens em pílula. Os grids usam cartões `.panel` e KPIs `.kpi`.

## Landing page

`.container` tem largura máxima de `80rem`; `.section` começa com padding vertical de `6rem`. A navegação pública está em `layout/navbar.css`. A demonstração comercial de dashboard está isolada em `sections/dashboard.css` sob `.dash-section` e `.dash`.

## Autenticação

`.auth-shell` é uma grade de duas colunas em desktop, com imagem e formulário. Até `800px`, a área visual desaparece e a marca móvel é exibida.
