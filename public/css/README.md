# AeroGuard — CSS organizado

## Estrutura

```text
css/
├── style.css                 # ponto único de entrada
├── responsive.css            # breakpoints globais
├── base/
│   ├── tokens.css            # variáveis :root
│   ├── reset.css             # reset e estilos base
│   ├── utilities.css         # classes utilitárias
│   ├── typography.css        # estilos tipográficos compartilhados
│   ├── icons.css             # ícones SVG
│   ├── indicators.css        # dots, pulses e indicadores
│   ├── buttons.css           # botões
│   └── motion.css            # animações e efeitos de entrada
├── layout/
│   ├── helpers.css           # helpers de layout e grids
│   ├── navbar.css            # navegação
│   └── footer.css            # rodapé
└── sections/
    ├── hero.css
    ├── problem.css
    ├── solution.css
    ├── dashboard.css
    ├── how-it-works.css
    ├── architecture.css
    ├── reliability.css
    ├── partners.css
    ├── goal.css
    ├── cta.css
    └── faq.css
```

## Como conectar no HTML

Remova o link antigo para `styles.css` e use apenas:

```html
<link rel="stylesheet" href="css/style.css">
```

Se o HTML estiver dentro de uma pasta, ajuste o caminho relativo. Exemplo: para `pages/index.html`, pode ser `../css/style.css`.

## Manutenção

- Edite as variáveis globais em `base/tokens.css`.
- Estilos compartilhados ficam em `base/` e `layout/`.
- Cada seção da landing page tem seu próprio arquivo em `sections/`.
- Breakpoints gerais ficam em `responsive.css`; media queries específicas de FAQ e parceiros continuam junto das respectivas seções.
- `style.css` é o único arquivo CSS que precisa ser referenciado pelo HTML.

## Observação

A divisão preserva as regras existentes e sua ordem de carregamento, sem redesenhar os componentes. Após substituir o arquivo original, teste a página nos breakpoints principais e confira o console do navegador.
