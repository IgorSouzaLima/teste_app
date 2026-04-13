# Deploy Vercel E APK Expo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar `entregas-admin` e `entregas-cliente` para deploy separado no Vercel e deixar `entregas-motorista` apto para gerar um APK Android de teste via EAS Build.

**Architecture:** Cada site web recebe configuração própria de SPA no diretório do app, sem tentar forçar deploy pela raiz do repositório. O app Expo remove dependências de assets ausentes e usa configuração Android de teste estável, mantendo o vínculo com EAS como último passo dependente de autenticação do usuário.

**Tech Stack:** Create React App, Vercel, Expo SDK 50, EAS Build.

---

### Task 1: Configurar deploy SPA para `entregas-admin`

**Files:**
- Create: `entregas-admin/vercel.json`
- Modify: `LEIA-ME.md`

- [ ] Adicionar `vercel.json` com rewrite de SPA para `index.html`.
- [ ] Documentar que o projeto deve ser criado no Vercel com `Root Directory = entregas-admin`.

### Task 2: Configurar deploy SPA para `entregas-cliente`

**Files:**
- Create: `entregas-cliente/vercel.json`
- Modify: `LEIA-ME.md`

- [ ] Adicionar `vercel.json` com rewrite de SPA para `index.html`.
- [ ] Documentar que o projeto deve ser criado no Vercel com `Root Directory = entregas-cliente`.

### Task 3: Remover bloqueios de build do app Expo

**Files:**
- Modify: `entregas-motorista/app.json`
- Modify: `LEIA-ME.md`

- [ ] Remover referências a assets ausentes ou placeholder que impedem build rápido de teste.
- [ ] Ajustar `android.package` para um identificador único e estável.
- [ ] Explicar no guia que `eas build:configure` deve preencher `extra.eas.projectId`.

### Task 4: Verificar e orientar publicação

**Files:**
- Modify: `LEIA-ME.md`

- [ ] Rodar `npm run build` em `entregas-admin`.
- [ ] Rodar `npm run build` em `entregas-cliente`.
- [ ] Rodar `npx expo export --platform android` em `entregas-motorista`.
- [ ] Tentar `eas build:configure` / `eas build` se houver autenticação disponível.
