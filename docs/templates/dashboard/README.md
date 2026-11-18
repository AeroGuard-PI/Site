# Template de página operacional

Use este template ao criar uma nova página dentro da dashboard AeroGuard. Ele é referência e não é carregado pela aplicação. Sua área principal toma `maquinas.html` como referência de página operacional; a sidebar normaliza os atributos acessíveis de `dashboard.html` para não reproduzir a duplicação de links presente nas outras páginas.

## Como usar

1. Copie `dashboard-page.html` para `public/nome-da-pagina.html`.
2. Copie `dashboard-page.css` para `public/css/nome-da-pagina.css`.
3. Crie `public/js/nome-da-pagina.js` somente se a página precisar de comportamento próprio.
4. Substitua todos os marcadores `NOME DA PÁGINA`, URLs e textos de orientação.
5. Mantenha os imports de fontes, `style.css`, `dashboard.css`, a sidebar, o logo e o script específico com `defer`.
6. Remova o import de Chart.js comentado apenas se a página não usar gráfico; descomente-o caso use.

## Navegação

O template usa a estrutura acessível de `dashboard.html`: links sem duplicação, `aria-label` no menu e `aria-current="page"` apenas no destino ativo. Ao adicionar a página à navegação, atualize os links das páginas operacionais necessárias em uma tarefa própria e preserve a mesma estrutura em todas elas.

`visao-geral.html` e `maquinas.html` contêm hoje links duplicados de Visão Geral e regras que escondem um deles. Não replique essa pendência no template.

## CSS e componentes

Não copie regras de `.btn`, `.panel`, `.kpi`, `.alert` ou `.dash__sidebar`: elas já vêm de `style.css` e `dashboard.css`. Escreva somente regras específicas, delimitadas por `.dashboard-page .nome-da-pagina-*`, e reutilize tokens. Use as variantes de botão documentadas em [`../../design-system/04-componentes.md`](../../design-system/04-componentes.md).

## Backend

Caso a página precise de dados, siga `Routes → Controllers → Models → Database Config`, reutilize `src/database/config.js`, preserve `sessionStorage.EMPRESA_ID` e não altere schema, contratos ou autorização sem aprovação.

Antes da integração, siga [`../../design-system/10-checklist-integracao.md`](../../design-system/10-checklist-integracao.md).
