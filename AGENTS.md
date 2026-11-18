# AGENTS.md — AeroGuard

## 1. Sobre o projeto

O AeroGuard é uma plataforma de monitoramento de infraestrutura tecnológica, voltada ao acompanhamento de recursos computacionais de sistemas críticos, como CPU, memória RAM e armazenamento em disco.

O projeto possui interface web, backend e integração com banco de dados MySQL.

## 2. Tecnologias e arquitetura

- Backend: Node.js com Express.
- Banco de dados: MySQL.
- Frontend: HTML, CSS e JavaScript.
- Gráficos: Chart.js.
- Controle de versão: Git e GitHub.

### Organização do backend

Respeitar a arquitetura existente:

`Routes → Controllers → Models → Database Config`

Regras:
- Reutilizar a configuração existente em `src/database/config.js`.
- Manter a organização atual dos módulos.
- Não introduzir camadas ou abstrações desnecessárias.
- Não duplicar funcionalidades já implementadas.
- Reutilizar componentes, funções e padrões existentes sempre que possível.

## 3. Design System

O Design System original do AeroGuard deve ser tratado como referência obrigatória para qualquer alteração visual.

Antes de implementar ou modificar interfaces:
1. Consulte os arquivos CSS e HTML existentes.
2. Identifique os padrões visuais já estabelecidos.
3. Reutilize cores, tipografia, espaçamentos, bordas, sombras, gradientes e componentes.
4. Preserve a consistência entre todas as páginas.

### Regras visuais

- Não inventar novos padrões de interface sem necessidade.
- Não substituir componentes existentes por versões visualmente diferentes.
- Não modificar a identidade visual durante tarefas que não envolvam redesign.
- Preservar alinhamentos, dimensões, proporções e hierarquia visual.
- Manter consistência entre estados normais, hover, ativo e desabilitado.

### Navegação

O projeto possui duas páginas principais:
- Visão Geral.
- Máquinas.

A navegação compartilhada deve manter a mesma estrutura, aparência, dimensões, ícones e comportamento nas duas páginas.

Evitar implementações duplicadas ou visualmente divergentes de elementos compartilhados.

## 4. Frontend e responsividade

- Utilizar HTML, CSS e JavaScript conforme os padrões existentes.
- Priorizar a reutilização de estilos e componentes.
- Evitar regras CSS redundantes e conflitos entre seletores.
- Não utilizar posicionamentos absolutos quando uma estrutura flexível ou grid resolver melhor o problema.
- Respeitar os breakpoints existentes.
- Garantir que os elementos não apresentem sobreposição, cortes ou overflow horizontal.
- Testar alterações responsivas em diferentes dimensões de tela.
- Preservar o layout desktop ao realizar correções mobile.

## 5. Backend e banco de dados

**Regra crítica: não modificar a estrutura do banco de dados.**

É proibido realizar alterações não autorizadas em:
- Tabelas.
- Colunas.
- Tipos de dados.
- Índices.
- Chaves primárias e estrangeiras.
- Relacionamentos.
- Estrutura geral do schema.

Não criar migrations ou executar comandos que alterem a estrutura do banco.

Utilizar as tabelas e os campos existentes.

Também preservar:
- Rotas existentes.
- Contratos dos endpoints.
- Regras de negócio.
- Integrações já implementadas.
- Mecanismo atual de autenticação e identificação da empresa.

Não substituir ou modificar o mecanismo existente de identificação da empresa armazenado no sessionStorage (`EMPRESA_ID`).

## 6. Regras de implementação

Antes de qualquer alteração:

1. Identificar os arquivos envolvidos na tarefa.
2. Analisar como a funcionalidade está implementada atualmente.
3. Verificar dependências entre os arquivos.
4. Identificar possíveis impactos em outras funcionalidades.
5. Implementar somente o necessário para atender à solicitação.

Durante a implementação:
- Não reescrever arquivos inteiros quando uma alteração pontual for suficiente.
- Não remover funcionalidades existentes.
- Não criar arquivos desnecessários.
- Não instalar dependências sem justificativa.
- Não alterar funcionalidades fora do escopo solicitado.
- Não duplicar código que possa ser reutilizado.

## 7. Validação

Toda alteração deve ser validada de acordo com seu escopo.

Quando aplicável:
- Verificar erros no console do navegador.
- Verificar erros no terminal e no backend.
- Testar os fluxos afetados.
- Validar integrações com o banco de dados.
- Testar responsividade.
- Verificar possíveis regressões em funcionalidades existentes.

Não afirmar que algo foi testado visualmente ou funcionalmente sem realmente executar a validação correspondente.

## 8. Relatório de conclusão

Ao finalizar cada tarefa, apresentar um resumo contendo:

1. O que foi implementado.
2. Quais arquivos foram alterados.
3. Quais problemas foram corrigidos.
4. Quais testes foram realizados.
5. Se existem pendências ou limitações.

## 9. Prioridade das instruções

Em caso de conflito entre uma solicitação específica e estas diretrizes:

- Respeitar as restrições de integridade do banco de dados.
- Preservar a arquitetura existente.
- Preservar funcionalidades já implementadas.
- Seguir as instruções específicas da tarefa dentro desses limites.

O objetivo é evoluir o AeroGuard incrementalmente, mantendo estabilidade, consistência visual e qualidade de implementação.
