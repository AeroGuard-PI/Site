# Inconsistências e acompanhamento

## Corrigido nesta organização

- **Dependência acidental da landing:** componentes visuais usados pela dashboard operacional (`.kpi`, `.panel`, `.badge`, `.legend`, `.servers`, `.alert` e `.disks`, entre outros) receberam regras equivalentes delimitadas por `.dashboard-page` em `public/css/dashboard.css`. A landing continua com suas próprias regras em `public/css/sections/dashboard.css`.
- **Responsabilidade documentada:** `dashboard.css` é a fonte dos componentes da dashboard operacional; `sections/dashboard.css` permanece responsável apenas pela demonstração da landing.

## Pendências registradas, não alteradas nesta tarefa

- `.dashboard-layout` declara coluna de `5rem`, enquanto a sidebar desktop mede `15rem`.
- `.dashboard-main` usa `width: calc(100% - 10rem)` e `left: 10rem`.
- A navegação operacional é replicada em três HTMLs, com diferenças de links, ícones e atributos de acessibilidade.
- `maquinas.css` usa `var(--radius)`, que não existe em `tokens.css`, e `var(--accent, #0ea5e9)` sem token definido.
- Há variações de capitalização para cores iguais e estilos locais de Partners/FAQ que não usam somente tokens globais.
- Visão Geral e Máquinas carregam Kanit, mas não importam explicitamente Space Grotesk, definida como fonte sans padrão.
