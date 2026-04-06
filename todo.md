# ControlEStill - Sistema de Controle Financeiro

## Funcionalidades Planejadas

### 1. Dashboard Principal
- [x] Resumo de saldos bancários (C6, Itaú, Inter PF, Inter PJ, Real, Emerson)
- [x] Visão consolidada de investimentos
- [x] Total de devedores
- [ ] Gráficos de evolução mensal
- [x] Cards com indicadores principais (receitas, despesas, saldo)### 2. Módulo de Investimentos
- [x] Cadastro de FIIs (Fundos Imobiliários)
- [x] Cadastro de Ações
- [x] Cadastro de Fundos de Investimento
- [x] Cadastro de Renda Fixa
- [x] Cálculo automático de DY (Dividend Yield)
- [x] Cálculo de lucros e valorização
- [ ] Projeções futuras (1, 5, 10, 15 anos)
- [ ] Histórico de rendimentos [x] Gestão de múltiplas contas (C6, Itaú, Inter PF, Inter PJ, Real, Emerson)
- [x] Registro de transações (entradas/saídas)
- [x] Saldo atualizado em tempo real
- [x] Histórico completo de movimentações
- [x] Filtros por data, tipo, valor

### 4. Vendas e Serviços
- [x] Registro de vendas Shopee
- [x] Registro de vendas Mercado Pago
- [x] Registro de vendas diretas
- [x] Registro de serviços prestados
- [x] Cálculo automático de lucros
- [x] Relatório de vendas por período

### 5. Controle de Despesas
- [x] Categorização de despesas (Casa, Still, Fixas, Mercado, Supérfluos)
- [x] Registro de contas fixas com vencimentos
- [ ] Alertas de vencimento
- [x] Histórico de despesas
- [x] Resumo de despesas por categoria

### 6. Módulo de Devedores
- [x] Cadastro de devedores
- [x] Registro de valores pendentes
- [x] Histórico de pagamentos
- [x] Status de débito (pendente, pago parcial, quitado)
- [x] Cálculo de total a receber

### 7. Tabela de Preços
- [x] Cadastro de produtos e componentes
- [x] Cálculo automático de custo
- [x] Cálculo automático de lucro
- [x] Margem de lucro percentual
- [x] Preço de venda configurado

### 8. Relatórios Financeiros
- [ ] Relatório de fluxo de caixa
- [ ] Comparativo mensal de receitas/despesas
- [ ] Evolução patrimonial
- [ ] Análise de investimentos
- [ ] Exportação de relatórios (PDF)

### 9. Sincronização e Dados
- [x] Banco de dados centralizado
- [x] Sincronização em tempo real
- [ ] Backup automático
- [ ] Histórico de alterações

### 10. Sistema de Autenticação
- [x] Login com Manus OAuth
- [x] Controle de permissões (admin/user)
- [x] Múltiplos usuários
- [x] Perfil de usuário

## Design e UX
- [x] Identidade visual moderna e profissional
- [x] Interface responsiva (desktop e mobile)
- [x] Navegação intuitiva com sidebar
- [x] Tema de cores consistente
- [x] Ícones e feedback visual
- [x] Loading states e tratamento de erros

## Testes
- [x] Testes unitários das APIs
- [x] Testes de cálculos financeiros
- [x] Validação de fórmulas
- [x] Testes de permissões


## Implementação Completa - Módulos Restantes

### Módulos Frontend a Implementar
- [x] Página de Investimentos com CRUD completo
- [x] Página de Vendas com CRUD completo
- [x] Página de Serviços com CRUD completo
- [x] Página de Despesas com CRUD completo
- [x] Página de Devedores com CRUD completo
- [x] Página de Produtos com CRUD completo
- [ ] Página de Relatórios com gráficos
- [ ] Adicionar gráficos ao Dashboard


## Sistema de Alertas - Nova Funcionalidade

- [x] Widget de alertas no Dashboard
- [x] Notificações de despesas vencidas
- [x] Notificações de despesas a vencer (próximos 7 dias)
- [x] Indicadores visuais coloridos por status
- [x] Contagem de dias até vencimento


## Correções de Bugs Reportados

- [x] Corrigir atualização de saldo bancário ao registrar vendas/serviços
- [x] Corrigir erro na página de Relatórios
- [x] Implementar separação de dados por categoria "Casa" vs outros
- [x] Criar filtros para visualizar dados separados por origem


## Bugs Ainda Não Resolvidos

- [x] Investigar por que saldo bancário não está atualizando ao criar venda
- [x] Corrigir erro 404 na página de Relatórios (estava funcionando)
- [x] Refatorar lógica de atualização de saldo com precisão decimal


## Novas Funcionalidades Solicitadas

### Despesas e Lucro
- [x] Separar despesas em "Despesa Still" e "Despesa Edgar"
- [x] Despesa Edgar = Casa + Fixas + Mercado + Supérfluos
- [x] Ajustar cálculo de lucro líquido (receitas - despesa still apenas)

### Vendas
- [x] Adicionar campo de produto (relacionado com tabela produtos) - Backend
- [x] Adicionar campo de cliente - Backend
- [ ] Criar relatório de produtos mais vendidos
- [ ] Criar relatório de clientes que mais compraram
- [ ] Corrigir exibição de datas (problema timezone)
- [x] Adicionar opção "devedor" no campo origem - Backend
- [x] Criar automaticamente em devedores quando origem = devedor - Backend
- [x] Atualizar frontend de Vendas com novos campos

### Serviços
- [x] Adicionar campo cliente - Backend
- [x] Adicionar campo número de OS - Backend
- [x] Adicionar campo tipo de serviço (sem conserto, consertado, teste) - Backend
- [x] Valores de serviço vão direto para devedores - Backend
- [x] Atualizar frontend de Serviços com novos campos

### Devedores
- [ ] Agrupar despesas do mesmo cliente
- [ ] Ao clicar no cliente, mostrar resumo de todos os itens pendentes


## Sistema de Ordem de Serviço (OS) - Nova Implementação

### Estrutura de Banco de Dados
- [x] Criar tabela `service_orders` (OS principal)
- [x] Criar tabela `service_order_items` (itens da OS)
- [x] Implementar numeração automática sequencial (00001, 00002...)
- [x] Adicionar campo de status na OS (open, completed)

### Backend
- [x] Função para gerar próximo número de OS
- [x] CRUD de OS (criar, listar, atualizar, deletar)
- [x] CRUD de itens da OS
- [x] Lógica automática de status (concluída quando todos itens finalizados)
- [x] Integração com devedores (valor total da OS)

### Frontend
- [x] Página de listagem de OS (separar abertas e concluídas)
- [x] Formulário de criação de OS com cliente
- [x] Interface para adicionar múltiplos itens (00001-1, 00001-2...)
- [x] Cada item com: descrição, tipo de serviço, valor, custo
- [x] Visualização hierárquica (OS → Itens)
- [x] Marcar itens como concluídos individualmente
- [x] Cálculo automático de valor total da OS

### Regras de Negócio
- [x] OS só vai para concluída quando todos itens estiverem finalizados
- [x] Numeração sequencial nunca repete
- [x] Subitens seguem formato: OS-ITEM (ex: 00001-1, 00001-2)
- [x] Valor total da OS vai para devedores automaticamente


## Refatoração de OS - Baseado no Sistema Atual

### Ajustes no Schema
- [x] Adicionar campo `entryDate` (data de entrada automática)
- [x] Adicionar campo `exitDate` (data de saída)
- [x] Adicionar campo `deliveryDate` (entrega prevista)
- [ ] Adicionar campo `requestedService` (serviço solicitado)
- [ ] Adicionar campo `phoneNumber` no cliente
- [ ] Adicionar checkboxes de status nos itens (S/C, S/D, Ent)
- [ ] Adicionar campos de controle de qualidade (Som, Vídeo, Impressora, etc)

### Interface de OS
- [x] Número de OS automático no topo (não editável)
- [x] Seletor de cliente com busca
- [x] Data de entrada automática
- [x] Campo de entrega prevista
- [ ] Campo de serviço solicitado
- [x] Tabela de itens inline (adicionar múltiplos na mesma tela)
- [x] Checkboxes de status por item (Concluído)
- [ ] Popup de detalhes do item com controle de qualidade

### Cadastro de Clientes
- [ ] Criar tabela de clientes completa
- [ ] Nome, Endereço, Bairro, Cidade, Estado, CEP
- [ ] Telefone, Contato, Email
- [ ] Listagem alfabética de clientes


## Correções Urgentes - Interface de OS

- [x] Mostrar número de OS no topo do dialog (gerado automaticamente, não editável)
- [x] Mostrar data de entrada automaticamente (não editável)
- [x] Reorganizar campos: OS no topo, depois data de entrada, depois cliente
- [x] Garantir que número de OS seja gerado antes de abrir o dialog
- [x] Testar criação de OS com novos campos


## Correção da Página de Serviços

- [x] Remover campo manual de Número da OS
- [x] Gerar número de OS automaticamente
- [x] Remover campo manual de Data
- [x] Adicionar data de entrada automática (não editável)
- [x] Reorganizar campos: OS e data no topo
- [x] Permitir adicionar múltiplos itens na mesma OS
- [x] Cada item com descrição, valor, custo e tipo de serviço


## Ajustes no Formulário de Serviços

- [x] Adicionar campo "Número de Série" nos itens
- [x] Remover campo "Custo" (não precisa em serviços)
- [x] Remover campo "Valor" da criação inicial
- [x] Remover campo "Tipo" da criação inicial
- [x] Na abertura: apenas Descrição e Número de Série
- [x] Depois (quando realizar serviço): adicionar Tipo e Valor
- [x] Atualizar schema do banco de dados
- [x] Permitir edição posterior dos itens para preencher Tipo e Valor


## Implementação de Numeração Sequencial de OS

- [x] Criar função no backend para buscar próximo número de OS
- [x] Gerar número no formato 00001, 00002, 00003...
- [x] Criar endpoint tRPC para retornar próximo número
- [x] Atualizar frontend para buscar número ao abrir dialog
- [x] Exibir número real no topo do formulário
- [x] Usar número gerado ao salvar os itens


## Correção de Timezone nas Datas

- [ ] Identificar onde a data está sendo convertida incorretamente
- [ ] Corrigir conversão de data no frontend (Services.tsx)
- [ ] Garantir que data local seja usada sem conversão UTC
- [ ] Testar criação de OS e verificar data correta


## Bugs Reportados - 07/01/2026

- [x] Data ainda aparece errada na lista de serviços (mostra 6/1/26 em vez de 7/1/26)
- [x] Adicionar botão/ícone "Concluir" ao lado do botão editar na lista de serviços
- [x] Valor da OS não aparece em devedores (cliente aparece mas sem valor)


## Bugs Críticos - 07/01/2026 (Tarde)

- [x] Numeração de OS está se repetindo (sempre 00001) em vez de ser sequencial (00001, 00002, 00003...)
- [x] Valor da OS não está indo para devedores - quando marca item como consertado, devedor aparece com valor 0


## Refatoração - Remover Ordens de Serviço

- [x] Remover "Ordens de Serviço" do menu lateral
- [x] Remover rota /service-orders do App.tsx
- [x] Remover página ServiceOrders.tsx
- [x] Remover rotas serviceOrders do backend (routers.ts)
- [x] Manter apenas módulo "Serviços" original


## Bugs Módulo Serviços - 07/01/2026

- [x] ERRO 1: Adicionar botão "Concluído" para mover serviço de "Em Aberto" para "Concluídos"
- [x] ERRO 2: Valor do serviço (R$ 80,00) não está sendo somado automaticamente em Devedores
- [x] ERRO 3: Número de OS sempre fica 00001, precisa incrementar (00001, 00002, 00003...)


## Melhorias Solicitadas - 07/01/2026

### Serviços
- [x] Quando tipo for "Consertado" ou "Teste", mover automaticamente para "Concluídos" e gerar valor em Devedores

### Despesas
- [x] Abater valor do saldo da conta bancária selecionada ao cadastrar despesa

### Vendas
- [x] Remover campo "Conta que recebeu (opcional para vendedor)"
- [x] Quando origem for "Devedor (A Receber)", criar automaticamente em Devedores
- [x] Adicionar campo PRODUTO com seleção de produtos cadastrados (abatendo estoque) ou criar novo

### Produtos
- [x] Adicionar campo "Quantidade" (estoque)


## Funcionalidade de Edição - 09/02/2026

### Objetivo
Permitir edição de registros existentes em todos os módulos para corrigir dados incorretos

### Módulos a implementar
- [x] Vendas - adicionar botão editar e modal de edição (já implementado)
- [x] Despesas - adicionar botão editar e modal de edição (já implementado)
- [x] Serviços - adicionar botão editar e modal de edição (já implementado)
- [x] Devedores - adicionar botão editar e modal de edição (já implementado)
- [x] Contas Bancárias - adicionar botão editar e modal de edição (já implementado)
- [x] Investimentos - adicionar botão editar e modal de edição (já implementado)


## Bug Crítico - Deleção não atualiza relatórios - 10/02/2026

- [x] Quando venda/serviço/despesa é deletado, Dashboard e Relatórios não recalculam (ex: deletou venda de R$ 185 mas lucro continua R$ 185)
- [x] Verificar se deleção está realmente removendo do banco de dados (confirmado: está deletando corretamente)
- [x] Garantir que frontend invalide cache após deleção (adicionado await para forçar refetch)


## Filtros por Período - 12/02/2026

- [x] Vendas - adicionar seletor de mês/ano para filtrar registros
- [x] Despesas - adicionar seletor de mês/ano para filtrar registros
- [x] Serviços - adicionar seletor de mês/ano para filtrar registros


## Melhorias Solicitadas - 12/02/2026

### Vendas
- [ ] 1. Adicionar múltiplos itens em uma venda (ex: Cliente MMSHOP - Item 1: Gabinete R$ 45, Item 2: Placa Mãe, Item 3: Placa de Vídeo)
- [ ] 2. Permitir digitar novo produto diretamente no campo de seleção de produtos
- [ ] 3. Mover "Devedor a Receber" de Origem para novo campo "Pagamento" ao lado, incluindo todas as contas bancárias cadastradas

### Devedores
- [x] 4. Adicionar campo de busca por nome de cliente
- [ ] 5. Ao receber pagamento de devedor, selecionar banco e migrar valor automaticamente (ex: ADW deve R$ 800, pagou R$ 500 no Itaú → Itaú +R$ 500, ADW deve R$ 300)

### Contas Bancárias
- [ ] 6. Ao clicar no banco, mostrar histórico de depósitos e despesas
- [ ] 7. Criar campo "Transações" para transferências entre bancos (ex: Shopee R$ 2000 → Inter PJ)

### Novos Módulos
- [ ] 8. Criar módulo "Compras" com histórico de compras de fornecedores, contas a pagar, campo de pagamento com seleção de conta bancária (reduz valor automaticamente)
- [ ] 9. Adicionar opção em banco para inserir valores que não afetam lucro (ex: aluguel pessoal)
- [ ] 10. Vendas com origem específica (ex: Shopee) somam automaticamente no banco correspondente


## Bugs Críticos - Vendas - 12/02/2026

- [x] Vendas não estão aparecendo após registro (backend quebrado após mudanças)
- [x] Implementar interface de múltiplos itens em Vendas (similar a Serviços)
- [x] Permitir criar novo produto inline ao adicionar item


## Bugs Críticos - Vendas - 12/02/2026 (Tarde)

- [x] Valor da venda não está atualizando saldo bancário (falta campo de seleção de conta)
- [x] Quando origem for "Devedor (A Receber)", não está criando automaticamente em Devedores
- [x] Adicionar campo de seleção de conta bancária no formulário de vendas
- [x] Atualizar saldo da conta selecionada ao registrar venda


## Bugs e Melhorias - 12/02/2026 (Noite)

### Bugs Críticos
- [x] Filtro de vendas do mês atual não está funcionando (vem pré-selecionado fevereiro mas não mostra vendas)

### Melhorias Solicitadas
- [x] Implementar criação inline de produtos no campo de seleção (digitar nome novo sem abrir dialog)
- [x] Adicionar histórico de transações nas contas bancárias (mostrar entradas e saídas ao clicar na conta)
- [ ] Criar módulo de Compras com gestão de fornecedores e contas a pagar


## Novas Funcionalidades - 12/02/2026 (Final)

### Módulo de Compras
- [x] Criar schema de compras no banco (purchases table)
- [x] Implementar rotas de backend para CRUD de compras
- [x] Criar página de Compras no frontend
- [x] Adicionar seleção de fornecedor e conta bancária
- [x] Atualizar saldo bancário automaticamente ao registrar compra
- [x] Adicionar link de Compras na navegação lateral
- [x] Testar funcionalidade completa

### Transferências entre Bancos
- [x] Adicionar funcionalidade de transferência na página de Contas Bancárias
- [x] Implementar lógica de débito/crédito entre contas
- [x] Registrar transferência no histórico de ambas as contas
- [x] Adicionar botão "Transferir" ao lado de "Nova Conta"
- [x] Criar dialog com seleção de contas origem/destino
- [x] Testar funcionalidade completa


## Bugs Críticos - 12/02/2026 (Noite - Parte 2)

### Problema de Timezone
- [x] Vendas e serviços estão sendo criados com data de ontem (problema de conversão UTC)
- [x] Filtro de serviços por mês não está funcionando (não mostra OS de fevereiro)
- [x] Data de pagamento de devedores está sendo registrada incorretamente (problema de timezone)

### Devedores - Pagamento Parcial
- [x] Implementar funcionalidade de registrar pagamento parcial
- [x] Adicionar seleção de banco ao registrar pagamento
- [x] Abater valor pago da dívida automaticamente
- [x] Aumentar saldo do banco selecionado automaticamente
- [x] Exemplo: ADW deve R$ 500, pagou R$ 300 no Itaú → ADW deve R$ 200, Itaú +R$ 300


## Bug UI - Devedores - 12/02/2026

- [x] Cards de devedores muito pequenos, botão "Registrar Pagamento" não aparece
- [x] Aumentar altura dos cards para que todas as informações fiquem visíveis


## Bug UI - Vendas - 12/02/2026

- [x] Dialog de Nova Venda fica pequeno quando adiciona itens, não mostra todas as informações
- [x] Aumentar altura do dialog para que tabela de itens fique completamente visível
- [x] Implementar scroll interno para manter botões sempre visíveis


## Bug - Histórico de Transações - 12/02/2026

- [x] Pagamentos de devedores não aparecem no histórico de transações bancárias
- [x] Exemplo: ADW pagou R$ 180 na conta EMERSON, mas não aparece no histórico da conta
- [x] Verificar se transação está sendo criada ao registrar pagamento de devedor


## Bug - Filtro de Despesas - 12/02/2026

- [x] Filtro de despesas por mês não está funcionando (vem pré-selecionado fevereiro mas não mostra despesas)
- [x] Só mostra despesas quando clica em "Todos"
- [x] Aplicar mesma correção de filtro feita em Vendas e Serviços


## Melhoria UI - Histórico de Vendas - 12/02/2026

- [x] Reorganizar colunas da tabela de histórico de vendas
- [x] Colocar coluna "Cliente" antes da coluna "Descrição"


## Bug - Histórico de Transações Bancárias - 12/02/2026

- [x] Vendas não estão sendo registradas no histórico de transações bancárias
- [x] Histórico mostra apenas 1 transação mesmo após criar novas vendas
- [x] Verificar se transação está sendo criada ao registrar venda com conta bancária


## Bug - Histórico de Transações Bancárias (Vendas) - 12/02/2026 - Noite

- [ ] Transações de vendas ainda não estão aparecendo no histórico bancário
- [ ] Verificar se a correção anterior foi aplicada corretamente
- [ ] Testar criação de venda e verificar se transação é criada no banco


## Bug Crítico - Erro ao Criar Vendas - 12/02/2026

- [ ] Sistema está dando erro ao tentar criar vendas
- [ ] Investigar erro no console do navegador
- [ ] Verificar se erro está relacionado à última correção de transações


## Correções de Vendas - 12/02/2026

- [x] Corrigir botão "Adicionar Item" que não estava funcionando (validação de unitCost)
- [x] Corrigir problema de timezone em vendas (data aparecia como dia anterior)
- [x] Garantir que transações bancárias sejam criadas automaticamente ao registrar venda
- [x] Permitir custo unitário vazio (será tratado como zero)


## Configuração de Timezone - 13/02/2026

- [x] Configurar sistema para usar fuso horário de São Paulo (America/Sao_Paulo)
- [x] Garantir que todas as datas exibidas estejam corretas
- [x] Testar criação de vendas, serviços e despesas com data correta
- [x] Criar módulo utilitário timezone.ts com funções de data
- [x] Atualizar Sales.tsx para usar getCurrentDateString()
- [x] Atualizar Expenses.tsx para usar getCurrentDateString()
- [x] Atualizar Purchases.tsx para usar getCurrentDateString()
- [x] Atualizar Debtors.tsx para usar getCurrentDateString()


## Correção de Exibição de Datas - 13/02/2026

- [x] Investigar por que datas criadas hoje (13/02) aparecem como 12/02 no histórico
- [x] Corrigir função formatDate para considerar timezone de São Paulo
- [x] Garantir que todas as datas exibidas estejam corretas
- [x] Mudar T00:00:00 para T12:00:00 em Sales.tsx
- [x] Mudar T00:00:00 para T12:00:00 em Expenses.tsx
- [x] Mudar T00:00:00 para T12:00:00 em Purchases.tsx
- [x] Mudar T00:00:00 para T12:00:00 em Services.tsx
- [x] Mudar T00:00:00 para T12:00:00 em BankAccounts.tsx
- [x] Mudar T00:00:00 para T12:00:00 em Dashboard.tsx


## Investigação de Problema Persistente de Timezone - 13/02/2026

- [ ] Verificar se o problema está no cache do navegador
- [ ] Investigar se a data está sendo salva incorretamente no banco de dados
- [ ] Verificar conversão de data no backend (routers.ts)
- [ ] Implementar solução definitiva para garantir que datas sejam sempre corretas


## Correção DEFINITIVA de getCurrentDateString() - 13/02/2026

- [x] Investigar por que getCurrentDateString() retorna 12/02 em vez de 13/02
- [x] Corrigir conversão de data no backend (routers.ts linha 215-216)
- [x] Usar new Date(year, month - 1, day, 12, 0, 0) em vez de new Date(input.date + 'T12:00:00')
- [x] Testar em Nova Venda (campo de data padrão mostra 13/02 corretamente)
- [x] Testar registro de venda (agora salva como 13/02 em vez de 12/02)
- [x] Confirmar que todas as novas vendas aparecem com data correta no histórico


## Solução Alternativa para Registro de Data - 13/02/2026

- [x] Investigar por que a correção anterior não funciona no navegador do usuário
- [x] Implementar log de debug para verificar qual data está sendo enviada e recebida
- [x] Descobrir que o problema era conversão Date object para MySQL
- [x] Implementar solução: passar data como string pura (YYYY-MM-DD) sem conversão
- [x] Testar com venda real (teste 20) - FUNCIONOU!
- [x] Remover logs de debug do código


## Correção Global de Datas - Usar Relógio do Usuário - 13/02/2026

- [x] Aplicar correção de data (string pura) em módulo de Despesas (expenses)
- [x] Aplicar correção de data (string pura) em módulo de Compras (purchases)
- [x] Aplicar correção de data (string pura) em módulo de Serviços (services)
- [x] Aplicar correção de data (string pura) em módulo de Transações Bancárias (transactions)
- [x] Aplicar correção de data (string pura) em módulo de Retornos de Investimento
- [x] Aplicar correção de data (string pura) em módulo de Pagamentos de Devedores
- [x] Reiniciar servidor para aplicar mudanças
- [ ] Testar cada módulo para confirmar que a data é registrada corretamente


## Correção de Exibição de Datas no Frontend - 13/02/2026

- [x] Investigar função formatDate que está convertendo 13/02 para 12/02 na exibição
- [x] Corrigir formatDate para fazer parsing manual sem Date object
- [x] Aplicar correção em Sales.tsx, Expenses.tsx, Purchases.tsx
- [x] Aplicar correção em Services.tsx, BankAccounts.tsx, Dashboard.tsx
- [x] Testar e confirmar que datas aparecem corretamente (13/02 em vez de 12/02)


## Correção de Deleção de Vendas - 13/02/2026

- [x] Investigar por que transações bancárias não são deletadas ao deletar venda
- [x] Modificar deleteSale para buscar dados da venda antes de deletar
- [x] Adicionar lógica para reverter saldo da conta bancária
- [x] Adicionar lógica para deletar transação do histórico
- [ ] Testar deleção de venda e verificar se transação some do histórico bancário


## Limpeza de Transações Órfãs - 13/02/2026

- [x] Identificar transações de vendas cujas vendas não existem mais
- [x] Deletar 21 transações órfãs de vendas de teste do banco de dados
- [x] Recalcular saldos de todas as contas bancárias baseado nas transações existentes


## Mapeamento Automático de Origem para Conta Bancária - 13/02/2026

- [x] Criar mapeamento: SHOPEE → Conta SHOPEE
- [x] Criar mapeamento: Mercado Pago (Edgar) → Conta EDGAR
- [x] Criar mapeamento: Mercado Pago (Emerson) → Conta EMERSON
- [x] Modificar formulário de vendas para selecionar conta automaticamente baseado na origem
- [x] Implementar busca de conta por nome (case-insensitive)
- [ ] Testar criação de venda com origem SHOPEE


## Simplificação do Formulário de Vendas - 13/02/2026

- [x] Remover campo "Origem" do formulário de vendas
- [x] Adicionar "DEVEDOR" como primeira opção no campo "Conta que Recebeu"
- [x] Derivar source automaticamente baseado na conta selecionada
- [x] Implementar lógica: DEVEDOR → source="debtor", accountId=undefined
- [x] Implementar lógica: Conta SHOPEE → source="shopee"
- [x] Implementar lógica: Conta EDGAR → source="mp_edgar"
- [x] Implementar lógica: Conta EMERSON → source="mp_emerson"
- [x] Implementar lógica: Outras contas → source="direct"
- [ ] Testar criação de venda com DEVEDOR
- [ ] Testar criação de venda com conta SHOPEE


## Correção de Deleção de Vendas com Devedor - 13/02/2026

- [x] Modificar deleteSale para verificar se a venda tem devedor associado
- [x] Implementar lógica para subtrair valor da venda do total do devedor
- [x] Deletar registro de devedor se o novo total for zero ou negativo
- [x] Atualizar valores do devedor se ainda houver saldo pendente
- [ ] Testar deleção de venda com devedor


## Transação Bancária para Despesas - 13/02/2026

- [x] Modificar createExpense para criar transação bancária quando banco for selecionado
- [x] Atualizar saldo da conta bancária (subtrair valor da despesa)
- [x] Criar transação do tipo "expense" no histórico bancário
- [x] Modificar deleteExpense para reverter saldo e deletar transação
- [ ] Testar criação de despesa com banco selecionado
- [ ] Verificar se transação aparece no histórico do banco
- [ ] Testar deleção de despesa e verificar se transação é removida


## Módulo de Fornecedores - 13/02/2026

### Schema e Backend
- [ ] Adicionar campos address (endereço) e phone (celular) na tabela suppliers
- [ ] Executar migração do banco de dados (db:push)
- [ ] Criar função getSupplierHistory para buscar histórico de compras por fornecedor
- [ ] Criar função getSupplierPayments para buscar histórico de pagamentos por fornecedor

### Frontend - Aba Fornecedores
- [ ] Criar componente Suppliers.tsx
- [ ] Adicionar rota /fornecedores no App.tsx
- [ ] Adicionar item "Fornecedores" no menu de navegação
- [ ] Implementar lista de fornecedores com totais (comprado, pago, saldo devedor)
- [ ] Implementar modal de detalhes do fornecedor com histórico
- [ ] Mostrar histórico de compras do fornecedor
- [ ] Mostrar histórico de pagamentos (incluindo parciais)
- [ ] Adicionar campos de endereço e telefone no formulário de cadastro


## Correções Urgentes - Fornecedores - 13/02/2026

- [x] Adicionar DashboardLayout à página de Fornecedores (igual outros módulos)
- [x] Criar tabela supplierPayments no banco de dados
- [x] Implementar rotas backend para pagamentos de fornecedores
- [x] Expandir modal de histórico para tamanho maior (max-w-6xl)
- [x] Criar extrato tipo bancário com saldo acumulado (COMPRA +100, PAGO -50, SALDO = 50)
- [x] Adicionar botão "Novo Pagamento" dentro do modal de histórico
- [x] Criar formulário de pagamento com seleção de banco
- [x] Abater valor do banco selecionado ao registrar pagamento


## Melhorias Fornecedores - 13/02/2026 (Parte 2)

- [x] Aumentar modal de histórico para tela quase cheia (melhor visualização)
- [x] Adicionar botão de excluir pagamento em cada linha do extrato
- [x] Reverter saldo do banco ao excluir pagamento


## Ajustes Finais Fornecedores e Compras - 13/02/2026

- [x] Aumentar modal de histórico para tela REALMENTE cheia (98vw x 95vh)
- [x] Adicionar botão "Novo Pagamento" na página de Compras (embaixo de Nova Compra)
- [x] Criar formulário de pagamento em Compras igual ao de Fornecedores


## URGENTE - Modal Histórico Tela Cheia - 13/02/2026

- [x] Forçar modal de histórico para ocupar TODA a tela (usar !important ou classes customizadas)
- [x] Remover barra de rolagem desnecessária
- [x] Testar em tela cheia real


## Sistema de Kits de Produtos - 14/02/2026

- [ ] Criar tabela `productKits` no banco de dados
- [ ] Criar tabela `productKitItems` para relacionar produtos aos kits
- [ ] Implementar rotas backend para CRUD de kits
- [ ] Criar botão "Novo Kit" na página de Produtos
- [ ] Criar formulário de criação de kit com seleção múltipla de produtos
- [ ] Implementar listagem de kits na página de Produtos
- [ ] Integrar kits com sistema de vendas (baixa automática de estoque)
- [ ] Criar testes para funcionalidades de kits


## Sistema de Kits de Produtos - 14/02/2026

- [x] Criar tabelas productKits e productKitItems no banco de dados
- [x] Implementar funções CRUD de kits no backend (db.ts)
- [x] Criar rotas tRPC para kits (create, list, delete, checkStock, sellKit)
- [x] Adicionar botão "Novo Kit" na página de Produtos
- [x] Criar formulário de Novo Kit com seleção de produtos
- [x] Implementar listagem de kits na página de Produtos
- [x] Adicionar botão "Vender Kit" em cada kit
- [x] Criar dialog de venda de kit com seleção de quantidade
- [x] Implementar lógica de baixa automática de estoque ao vender kit


## Integração de Kits em Vendas - 14/02/2026

- [x] Adicionar kits à lista de produtos no formulário de Vendas
- [x] Identificar kits com prefixo ou marcador visual (ex: "Kit Gamer Completo [KIT]")
- [x] Implementar lógica de baixa automática de estoque dos produtos componentes ao vender kit via Vendas
- [x] Testar venda de kit e verificar baixa de estoque


## Bug Crítico - Devedores - Pagamento Parcial - 07/03/2026

- [x] Devedor some da lista após pagamento parcial (deveria permanecer com saldo restante)
- [x] Investigar lógica de status no backend (getDebtors)
- [x] Corrigir para só remover/ocultar devedor quando saldo for zero ou negativo


## Bug Crítico - Pagamento Fornecedor não aparece no Banco - 07/03/2026

- [x] Pagamento ao fornecedor não debita saldo do banco selecionado
- [x] Pagamento ao fornecedor não aparece no histórico de transações do banco
- [x] Investigar função createSupplierPayment no backend
- [x] Adicionar débito no banco e registro de transação ao criar pagamento de fornecedor

## Bug - Devedores com valor 0 - 12/03/2026

- [x] Sistema gera devedores com valor R$0 para itens já pagos/concluídos
- [x] Corrigir todas as funções que criam devedores para verificar se amount > 0 antes de criar/atualizar

## Edição de Kits de Produtos - 12/03/2026

- [x] Adicionar função updateProductKit no backend (db.ts)
- [x] Adicionar rota tRPC kits.update no routers.ts
- [x] Criar dialog de edição de kit no frontend (Products.tsx)
- [x] Adicionar botão Editar nos cards de kits
- [x] Pré-preencher formulário com dados do kit selecionado

## Edição de Componentes de Kits - 12/03/2026

- [x] Adicionar rota tRPC kits.updateWithItems para atualizar kit + componentes
- [x] Carregar produtos componentes atuais no dialog de edição
- [x] Permitir adicionar novos produtos ao kit existente
- [x] Permitir remover produtos do kit existente
- [x] Permitir ajustar quantidade de cada produto componente
- [x] Recalcular custo total e lucro ao alterar componentes

## Filtro por Mês em Compras - 12/03/2026

- [x] Adicionar seletor de mês/ano na página de Compras
- [x] Filtrar compras pelo mês/ano selecionado
- [x] Mostrar total do mês filtrado nos cards de resumo
- [x] Atualizar título da tabela com mês/ano selecionado

## Melhorias Múltiplas - 12/03/2026

- [ ] Bug: Pagamento a fornecedor não entra no histórico do banco
- [ ] Bug: Histórico do banco/vendas em ordem aleatória (deve ser sequencial/cronológico)
- [ ] Bug: Saldo Total em Contas não deve considerar Shopee e Mercado Livre
- [ ] Melhoria: Em Devedores mostrar saldo parcial somando Shopee e Mercado Livre
- [ ] Bug: Cancelar compra já paga não reverte o valor na conta selecionada
- [ ] Novo: Opção de lançamento pessoal no banco (não interfere no lucro da empresa)
- [ ] Novo: Relatório de vendas com produtos mais vendidos, lucro por produto e gráficos por dia
- [ ] Novo: Estoque mínimo no cadastro de produto e alertas de estoque acabando na tela


## Itens 7 e 8 - Relatório de Vendas e Alertas de Estoque

### Item 7 - Relatório de Vendas com Gráficos
- [x] Backend: funções getTopSellingProducts, getSalesByDay, getSalesSummary no db.ts
- [x] Backend: rotas tRPC reports.topSellingProducts, reports.salesByDay, reports.salesSummary
- [x] Frontend: Página de Relatórios com aba "Vendas" separada da aba "Financeiro"
- [x] Frontend: Cards de resumo (Total de Vendas, Receita Total, Lucro Total, Ticket Médio)
- [x] Frontend: Gráfico de linha "Vendas por Dia" com Receita e Lucro (recharts)
- [x] Frontend: Tabela + gráfico de barras "Produtos Mais Vendidos" (por quantidade)
- [x] Frontend: Tabela + gráfico de barras "Produtos Mais Lucrativos" (por lucro)
- [x] Frontend: Filtros de Mês e Ano para o período do relatório
- [x] Testes: 9 testes unitários passando para relatórios e estoque mínimo

### Item 8 - Alertas de Estoque Mínimo
- [x] Backend: campo minimumStock adicionado à tabela products no schema
- [x] Backend: migração do banco de dados executada (pnpm db:push)
- [x] Backend: função getLowStockProducts retorna produtos com estoque <= mínimo
- [x] Backend: rota tRPC products.getLowStock
- [x] Backend: campo minimumStock nas rotas create e update de produtos
- [x] Frontend: Campo "Estoque Mínimo" no formulário de criação/edição de produto
- [x] Frontend: Alerta visual (card amarelo) na página de Produtos quando há estoque baixo
- [x] Frontend: Ícone de alerta (triângulo) na coluna Quantidade da tabela de produtos
- [x] Frontend: Alerta de estoque baixo no Dashboard com lista de produtos críticos


## Melhorias de UX - Solicitadas 12/03/2026

- [x] Correção 1: Impedir fechamento acidental de modais em Serviços (clique fora não fecha)
- [x] Correção 1: Impedir fechamento acidental de modais em Vendas (clique fora não fecha)
- [x] Correção 2: Agrupar serviços por cliente na lista (expandir ao clicar para ver itens)
- [x] Correção 3: Campo de armazenamento em Serviços (onde o item está guardado)
- [x] Correção 4: Corrigir layout das tabelas em Vendas, Produtos, Compras (colunas fora da tela)

## Busca em Serviços - Solicitada 12/03/2026

- [x] Campo de busca na tela de Serviços (filtrar por cliente, OS, descrição, número de série)

## Melhorias - Solicitadas 12/03/2026 (lote 2)

- [x] Busca em Serviços por cliente, OS, descrição, número de série
- [x] Impressão/exportação de OS em PDF com todos os itens, valores e status
- [x] Proteger modal de Compras contra fechamento acidental (clique fora)
- [x] Ajustar tabela de Produtos para trazer mais colunas ao campo de visão

## Relatório Individual por Produto - Solicitado 12/03/2026

- [ ] Relatório individual por produto: gráfico de vendas por dia ao clicar no item

## Kits/Bundles de Produto - Solicitado 12/03/2026

- [ ] Criar produto composto (kit) com múltiplos itens e quantidades (ex: Note Dell + Fonte + 2x RAM + SSD)

## Colaboradores com Permissões - Solicitado 12/03/2026

- [x] Tabela de colaboradores (email Google, nome, status)
- [x] Tabela de permissões por seção (dashboard, vendas, serviços, compras, etc.)
- [x] Página de gerenciamento de colaboradores (convidar, editar permissões, remover)
- [x] Login de colaborador via conta Google (OAuth)
- [x] Restringir acesso às seções conforme permissões configuradas
- [x] Colaborador vê apenas as seções permitidas pelo dono

## Tabela de Preços - Solicitado 12/03/2026

- [x] Botão "Exportar Tabela de Preços" na página de Produtos
- [x] Gerar PDF formatado com nome, preço de venda e categoria dos produtos
- [x] Opção de exportar como CSV/Excel

## Kits na Tabela de Preços - Solicitado 12/03/2026

- [x] Incluir kits na exportação da tabela de preços (PDF e CSV)

## Status "Sem Conserto" em Serviços - Solicitado 12/03/2026

- [x] Itens com status "Sem Conserto" devem ir para a seção de concluídos (não ficar em abertos)

## Bug: Colaborador sem permissão de acesso - 12/03/2026

- [x] Corrigir fluxo de login de colaborador (colaborador recebe "sem permissão" ao tentar acessar)
