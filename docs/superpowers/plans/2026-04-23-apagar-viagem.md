# Apagar Viagem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir exclusão permanente de viagens agendadas ou canceladas no painel admin com confirmação, auditoria e cobertura de teste.

**Architecture:** A regra de permissão de exclusão será extraída para uma função pequena e testável em `viagemView.js`. A página `Viagens.js` vai consumir essa regra para exibir o botão e executar a exclusão via Firestore com auditoria e atualização imediata da interface.

**Tech Stack:** React, Firebase Firestore, Jest, react-hot-toast

---

### Task 1: Cobrir a regra de exclusão por status

**Files:**
- Modify: `entregas-admin/src/lib/viagemView.js`
- Modify: `entregas-admin/src/lib/viagemView.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('permite apagar apenas viagens agendadas ou canceladas', () => {
  expect(canDeleteViagem({ status: 'agendada' })).toBe(true);
  expect(canDeleteViagem({ status: 'cancelada' })).toBe(true);
  expect(canDeleteViagem({ status: 'em_rota' })).toBe(false);
  expect(canDeleteViagem({ status: 'entregue' })).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npm test -- --watch=false --runInBand src/lib/viagemView.test.js`
Expected: FAIL because `canDeleteViagem` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```javascript
export function canDeleteViagem(viagem) {
  return ['agendada', 'cancelada'].includes(viagem?.status);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npm test -- --watch=false --runInBand src/lib/viagemView.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add entregas-admin/src/lib/viagemView.js entregas-admin/src/lib/viagemView.test.js
git commit -m "test: cover trip delete permission"
```

### Task 2: Exibir e executar a exclusão no painel

**Files:**
- Modify: `entregas-admin/src/pages/Viagens.js`
- Modify: `entregas-admin/src/lib/viagemView.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('permite apagar apenas viagens agendadas ou canceladas', () => {
  expect(canDeleteViagem({ status: 'agendada' })).toBe(true);
  expect(canDeleteViagem({ status: 'cancelada' })).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npm test -- --watch=false --runInBand src/lib/viagemView.test.js`
Expected: FAIL until the helper is implemented and imported correctly.

- [ ] **Step 3: Write minimal implementation**

```javascript
const apagarViagem = async (viagem) => {
  if (!canDeleteViagem(viagem)) {
    toast.error('Apenas viagens agendadas ou canceladas podem ser apagadas.');
    return;
  }

  if (!window.confirm('Apagar esta viagem permanentemente?')) return;

  await registrarAuditoria({ ... });
  await deleteDoc(doc(db, 'viagens', viagem.id));
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npm test -- --watch=false --runInBand src/lib/viagemView.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add entregas-admin/src/pages/Viagens.js entregas-admin/src/lib/viagemView.js
git commit -m "feat: allow deleting invalid trips from admin panel"
```
