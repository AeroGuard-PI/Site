# Iconografia

O padrão principal é SVG com `<symbol>` e `<use>`. A classe compartilhada `.icon`, em [`public/css/base/icons.css`](../../public/css/base/icons.css), aplica `fill: none`, `stroke: currentColor`, `stroke-width: 1.75`, linhas e junções arredondadas.

Tamanhos disponíveis: `.icon--14`, `.icon--16`, `.icon--18`, `.icon--20` e `.icon--24`. Os símbolos são declarados inline nas páginas e existe o símbolo externo `i-settings` em [`public/assets/icons.svg`](../../public/assets/icons.svg). A cor deve vir de `currentColor`, normalmente com `--signal`, `--muted` ou `--fg`.

As marcas são SVG em `public/assets/brand/`: versão horizontal e vertical.
