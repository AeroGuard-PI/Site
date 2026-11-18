# Design System AeroGuard

## Objetivo

Este documento é a referência central para preservar a identidade visual do AeroGuard. Ele registra os padrões que já existem no produto; não autoriza reformulações visuais implícitas.

## Princípios

- Reutilizar tokens e componentes antes de criar variantes.
- Manter contraste, hierarquia técnica e paleta escura da plataforma operacional.
- Delimitar estilos da dashboard operacional com `.dashboard-page` e manter a demonstração comercial restrita à landing page.
- Tratar alterações responsivas e estados de interação como parte do componente.

## Fonte de verdade

Os tokens CSS oficiais estão em [`public/css/base/tokens.css`](public/css/base/tokens.css). O ponto de entrada compartilhado é [`public/css/style.css`](public/css/style.css).

## Referências

1. [Identidade visual](docs/design-system/01-identidade-visual.md)
2. [Tipografia](docs/design-system/02-tipografia.md)
3. [Layouts](docs/design-system/03-layouts.md)
4. [Componentes](docs/design-system/04-componentes.md)
5. [Iconografia](docs/design-system/05-iconografia.md)
6. [Interações](docs/design-system/06-interacoes.md)
7. [Responsividade](docs/design-system/07-responsividade.md)
8. [Inconsistências](docs/design-system/08-inconsistencias.md)
9. [Guia de criação de páginas operacionais](docs/design-system/09-guia-criacao-paginas.md)
10. [Checklist de integração](docs/design-system/10-checklist-integracao.md)

## Regras para novas páginas e componentes

Antes de implementar uma interface, consulte este índice e o documento específico do componente ou layout envolvido. Identifique classes existentes, reutilize os tokens de `tokens.css` e evite criar padrões visuais paralelos. Componentes novos aprovados para reutilização devem registrar: finalidade, classes, estados, responsividade, arquivo responsável e exemplo de uso neste conjunto de documentos.
