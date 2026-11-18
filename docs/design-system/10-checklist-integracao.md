# Checklist de integração de página operacional

Use esta lista antes de integrar uma nova página à branch principal.

## Identidade visual

- [ ] Carrega Space Grotesk e Kanit conforme o template.
- [ ] Usa tokens de `public/css/base/tokens.css`.
- [ ] Respeita tipografia, espaçamentos, bordas e raios existentes.
- [ ] Reutiliza componentes reais antes de criar estilos específicos.

## Estrutura e navegação

- [ ] Mantém `dashboard-page`, `dashboard-layout`, sidebar e área principal.
- [ ] Mantém a sidebar operacional, seus links e estados `aria-current`.
- [ ] Organiza o conteúdo em header, KPIs, painéis e seções quando aplicável.
- [ ] Não duplica CSS compartilhado nem cria seletores globais desnecessários.

## Componentes

- [ ] Usa `.btn--filled` para ação principal, `.btn--secondary` para complementar e `.btn--danger` para exclusão.
- [ ] Reserva `.btn--logout` para saída e evita `.btn--outlined` em novas interfaces.
- [ ] Reutiliza padrões de KPI, painel, tabela, alerta, barra e indicador quando aplicáveis.
- [ ] Usa `.icon` e tamanhos existentes para iconografia.
- [ ] Implementa estados hover, focus, active, disabled, loading e feedback coerentes com o componente.

## Responsividade

- [ ] Não há overflow horizontal indevido.
- [ ] Sidebar e navegação funcionam nos breakpoints existentes.
- [ ] Grades, tabelas, formulários, painéis e gráficos permanecem legíveis em desktop e mobile.
- [ ] O layout desktop não foi alterado ao corrigir mobile.

## Funcionalidade e backend

- [ ] Respeita `Routes → Controllers → Models → Database Config`.
- [ ] Reutiliza `src/database/config.js` e não executa SQL no frontend.
- [ ] Mantém autenticação, autorização e `sessionStorage.EMPRESA_ID`.
- [ ] Não modifica o schema do banco sem autorização.

## Qualidade

- [ ] Não há erros no console do navegador.
- [ ] Não há erros no servidor.
- [ ] Não foram instaladas dependências desnecessárias.
- [ ] Foram validadas as versões desktop e mobile.
- [ ] Novos componentes aprovados foram documentados em `04-componentes.md`.

## Pendências da revisão

| Pendência | Impacto | Responsável | Próximo passo |
|---|---|---|---|
|  |  |  |  |
