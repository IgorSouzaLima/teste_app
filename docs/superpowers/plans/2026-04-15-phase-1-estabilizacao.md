# Fase 1 de Estabilização Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Blindar os fluxos críticos já existentes no admin e no cliente com lógica testável e cobertura automatizada, sem alterar regras de negócio nem o comportamento validado em produção.

**Architecture:** Extrair a lógica crítica hoje espalhada nas telas para utilitários puros dentro de cada app web, reaproveitar esses utilitários nas páginas existentes e cobrir os casos mais sensíveis com testes unitários do `react-scripts`. Complementar com um checklist de validação manual para os fluxos que ainda dependem de Firebase e do app motorista.

**Tech Stack:** React 18, CRA (`react-scripts`), Jest, Firebase Firestore, documentação Markdown.

---

### Escopo desta fase

- Blindar busca por nota e filtros por status/aba.
- Blindar resolução de comprovantes de entrega vindos da própria viagem ou da coleção `comprovantes`.
- Blindar parsing do lançamento de viagens no admin sem alterar o payload atual.
- Habilitar e documentar testes também no portal do cliente.
- Registrar um checklist de smoke test manual para web e mobile.

### Arquivos previstos

**Criar**
- `entregas-admin/src/lib/viagemView.js`
- `entregas-admin/src/lib/viagemView.test.js`
- `entregas-cliente/src/lib/viagemCliente.js`
- `entregas-cliente/src/lib/viagemCliente.test.js`
- `docs/superpowers/plans/2026-04-15-phase-1-estabilizacao.md`

**Modificar**
- `entregas-admin/src/pages/Dashboard.js`
- `entregas-admin/src/pages/Viagens.js`
- `entregas-cliente/src/components/CardViagem.js`
- `entregas-cliente/src/pages/Dashboard.js`
- `entregas-cliente/package.json`
- `LEIA-ME.md`

### Entrega desta fase

- `CI=true npm test -- --watch=false --runInBand src/lib/viagemView.test.js src/lib/authAccess.test.js src/lib/createAuthUser.test.js` passando no admin.
- `CI=true npm test -- --watch=false --runInBand src/lib/viagemCliente.test.js` passando no cliente.
- `npm run build` passando em `entregas-admin` e `entregas-cliente`.
- Checklist manual documentado para os fluxos ainda dependentes de Firebase e APK.
