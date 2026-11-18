# Identidade visual

## Tokens oficiais

Fonte: [`public/css/base/tokens.css`](../../public/css/base/tokens.css).

| Grupo | Tokens e valores |
|---|---|
| Fundos | `--bg #151c26`, `--bg-mais-claro #1c2533`, `--night #10161f` |
| Superfícies | `--surface #202936`, `--surface-container #1b2330`, `--surface-container-darker #10161F`, `--surface-high #283344` |
| Texto | `--fg #ffffff`, `--off-white #EAF0F6`, `--muted #b8c2cc`, `--muted-darker #505050` |
| Semântica | `--primary #007dc5`, `--signal #00aeef`, `--deep-blue #023774`, `--mem #5b8def`, `--warning #f2b84b`, `--problem #bc0707`, `--success #4fd1a1` |
| Contornos | `--border: rgb(184 194 204 / 0.12)`, `--outline: rgb(184 194 204 / 0.24)` |

`--radius-full` é `999px` e `--ease` é `cubic-bezier(0.2, 0, 0, 1)`.

## Superfícies e gradientes existentes

A área operacional usa fundo escuro e painéis `--surface`. Hero, CTA e autenticação aplicam imagens com overlays escuros; o hero usa gradiente horizontal de `#151c26` e transparências de `rgb(21 28 38 / …)`. A autenticação aplica brilho radial `rgb(0 125 197 / 0.055)`. Partners e FAQ são exceções claras: `--off-white` e `#F5F8FC`.

## Bordas, raios e sombras

As bordas mais usadas são `1px solid var(--border)` ou `var(--outline)`. Raios existentes: `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `28px` e pílula. Botões preenchidos usam sombras `0 1px 2px rgb(0 0 0 / .3)` e `0 2px 8px rgb(0 0 0 / .35)` no hover.
