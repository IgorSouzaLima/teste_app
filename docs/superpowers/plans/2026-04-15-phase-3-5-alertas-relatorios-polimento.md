# Fases 3 a 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar alertas operacionais, filtros/exportação e um polimento final de UX sem alterar os fluxos estáveis de viagens, comprovantes e rastreamento.

**Architecture:** As novas regras de exibição ficam concentradas em helpers puros no admin e no cliente, reaproveitando snapshots já existentes de `viagens` e `comprovantes`. Os componentes só consomem dados derivados para mostrar alertas, filtros e exportações, evitando criar backend novo ou efeitos colaterais extras em produção.

**Tech Stack:** React, Firebase Firestore, React Native/Expo, Jest, date-fns

---

### Task 1: Travar a lógica de alertas e relatórios com testes

**Files:**
- Create: `entregas-admin/src/lib/operacaoView.js`
- Create: `entregas-admin/src/lib/operacaoView.test.js`
- Create: `entregas-cliente/src/lib/painelCliente.js`
- Create: `entregas-cliente/src/lib/painelCliente.test.js`

- [ ] Escrever testes vermelhos para alertas, filtros por período e exportação CSV no admin.
- [ ] Rodar o arquivo de teste do admin e confirmar falha inicial.
- [ ] Implementar o helper mínimo do admin para passar nos cenários.
- [ ] Rodar o teste do admin e confirmar verde.
- [ ] Escrever testes vermelhos para alertas, filtros por aba/status e exportação CSV no cliente.
- [ ] Rodar o arquivo de teste do cliente e confirmar falha inicial.
- [ ] Implementar o helper mínimo do cliente para passar nos cenários.
- [ ] Rodar o teste do cliente e confirmar verde.

### Task 2: Encaixar alertas e exportação no admin com baixo risco

**Files:**
- Modify: `entregas-admin/src/pages/Dashboard.js`
- Modify: `entregas-admin/src/pages/Viagens.js`
- Modify: `entregas-admin/src/components/Layout.js`
- Modify: `entregas-admin/src/styles/global.css`

- [ ] Consumir os helpers do admin para mostrar alertas operacionais e filtros de período.
- [ ] Adicionar exportação CSV do conjunto filtrado de viagens.
- [ ] Refinar toolbar e painéis para a nova visualização.
- [ ] Validar que nenhuma ação de criação/cancelamento/confirmação mudou de comportamento.

### Task 3: Encaixar alertas, filtros e exportação no cliente

**Files:**
- Modify: `entregas-cliente/src/pages/Dashboard.js`
- Modify: `entregas-cliente/src/components/CardViagem.js`
- Modify: `entregas-cliente/src/styles/global.css`

- [ ] Substituir as abas simplificadas por filtros de status mais completos.
- [ ] Mostrar alertas derivados do estado das entregas do cliente.
- [ ] Adicionar exportação CSV do conjunto filtrado.
- [ ] Manter comprovantes e mapa ao vivo intactos.

### Task 4: Complementar UX do app motorista sem alterar fluxo operacional

**Files:**
- Modify: `entregas-motorista/src/screens/HomeScreen.js`

- [ ] Adicionar uma central de avisos derivada do estado das viagens.
- [ ] Melhorar a leitura visual dos cards e dos estados vazios sem alterar navegação.

### Task 5: Verificação final, documentação e publicação

**Files:**
- Modify: `LEIA-ME.md`

- [ ] Rodar testes do admin.
- [ ] Rodar testes do cliente.
- [ ] Rodar build do admin.
- [ ] Rodar build do cliente.
- [ ] Atualizar a documentação com os novos recursos.
- [ ] Commitar e publicar no GitHub.
