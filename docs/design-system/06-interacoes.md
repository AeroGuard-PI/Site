# Interações

## Estados existentes

- Botões: camada de hover com opacidade `.08`; foco `.12`; active `.16` e `scale(.98)`. `.btn--filled` mantém o destaque primário sem sombra de hover; `.btn--secondary` passa a signal azul no hover; `.btn--danger` tem contorno vermelho e conteúdo branco no estado normal e mantém o conteúdo branco sobre fundo vermelho no hover e active; `.btn--logout` mantém base secundária e recebe vermelho somente no hover.
- Foco global: `2px solid var(--signal)` com offset de `2px`.
- Campos de autenticação: hover de borda, foco com `--signal`, fundo `#1c2735` e anel azul translúcido.
- Navegação: hover em superfície elevada; ativo em fundo azul translúcido e texto signal.
- KPI: hover em `--surface-high`.
- FAQ: `.is-open` e `aria-expanded="true"` controlam expansão.

## Loading, sucesso e erro

Dashboard e formulários usam mensagens textuais dinâmicas. `.form-feedback` fica oculto até `.is-visible`; o JavaScript aplica `#4ade80` para sucesso e `#f87171` para erro. Não há spinner compartilhado. Campos Slack usam `disabled` por JavaScript, sem estilo próprio de disabled. Botões `.btn:disabled` e `.btn[aria-disabled="true"]` usam opacidade `.5`, cursor bloqueado e não recebem interação.

## Movimento

Há reveal, desenho de linhas, pulsos, radar, parallax e carrossel. `prefers-reduced-motion` reduz ou remove animações nos módulos correspondentes.
