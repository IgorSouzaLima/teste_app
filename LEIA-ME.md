# Sistema de Entregas — Guia completo de instalação

## Estrutura dos projetos

```
/firebase-config/         ← Regras e schema do banco
/entregas-admin/          ← Painel web (React)
/entregas-cliente/        ← Portal web do cliente (React)
/entregas-motorista/      ← App Android (React Native + Expo)
```

## Fase 1 — Estabilização e checagem segura

Antes de avançar para melhorias maiores, esta fase protege os fluxos críticos do sistema com testes e uma checagem rápida de smoke test.

### Testes automatizados web

Admin:
```bash
cd entregas-admin
CI=true npm test -- --watch=false --runInBand src/lib/viagemView.test.js src/lib/authAccess.test.js src/lib/createAuthUser.test.js
npm run build
```

Cliente:
```bash
cd entregas-cliente
CI=true npm test -- --watch=false --runInBand src/lib/viagemCliente.test.js
npm run build
```

### Smoke test manual recomendado

1. Admin:
   - entrar com usuário admin
   - lançar uma viagem nova
   - filtrar por status
   - buscar por número de nota
   - abrir `Auditoria` e conferir se a ação foi registrada
   - abrir `Ações` e conferir comprovante em viagem entregue
2. Cliente:
   - entrar com usuário cliente
   - alternar entre `Em andamento` e `Histórico`
   - buscar por número de nota
   - abrir uma entrega concluída e conferir o comprovante correto
3. Motorista:
   - iniciar uma viagem
   - confirmar se o admin recebe localização
   - concluir entrega e enviar comprovante

### Auditoria operacional

O painel admin agora pode registrar ações importantes na coleção `auditoria`, como:
- criação e atualização de clientes
- criação e atualização de motoristas
- criação e atualização de veículos
- criação, cancelamento e confirmação de comprovante em viagens

Para visualizar:
- entre no admin
- abra a seção `Auditoria`

### Fases 3 a 5 — Alertas, relatórios e refinamento visual

Sem alterar o fluxo principal, o sistema agora também oferece:
- `admin`
  - alertas operacionais derivados das viagens
  - filtro por período no `Dashboard` e em `Viagens`
  - exportação `CSV` das viagens filtradas
- `cliente`
  - painel com alertas de rota, comprovante disponível e cargas agendadas
  - filtros por status, período e nota fiscal
  - exportação `CSV` das entregas visíveis no filtro atual
- `motorista`
  - central de avisos na tela inicial com resumo de cargas agendadas, em andamento e concluídas

### Smoke test adicional recomendado

1. Admin:
   - abrir `Dashboard`
   - mudar o período entre `Hoje`, `7 dias` e `30 dias`
   - exportar o `CSV`
   - abrir `Viagens`, aplicar filtro por status e exportar novamente
2. Cliente:
   - alternar entre `Todas`, `Agendadas`, `Em rota`, `Entregues` e `Canceladas`
   - buscar por nota fiscal
   - mudar o período e exportar o `CSV`
3. Motorista:
   - abrir a tela inicial
   - conferir a central de avisos e o total de viagens em cada estado

---

## PASSO 1 — Criar o projeto Firebase

1. Acesse https://console.firebase.google.com
2. Clique em "Adicionar projeto" → dê um nome (ex: "entregas-prod")
3. Desative o Google Analytics (opcional) → Criar projeto

### Ativar os serviços:

**Authentication:**
- Menu lateral → Authentication → Primeiros passos
- Ative: "E-mail/senha"

**Firestore:**
- Menu lateral → Firestore Database → Criar banco de dados
- Escolha "Iniciar no modo de produção"
- Selecione a região: `southamerica-east1` (São Paulo)

---

## PASSO 2 — Aplicar as regras de segurança

**Firestore Rules:**
- Menu lateral → Firestore → Aba "Regras"
- Cole o conteúdo de `firebase-config/firestore.rules`
- Clique em Publicar

**Indexes:**
- Menu lateral → Firestore → Aba "Índices"
- Clique em "Importar índices" → cole o JSON de `firebase-config/firestore.indexes.json`

---

## PASSO 3 — Pegar as credenciais Firebase

1. No console Firebase → Configurações do projeto (ícone ⚙️)
2. Role para baixo → "Seus aplicativos" → clique em "</>  Web"
3. Registre o app com qualquer nome
4. Copie o objeto `firebaseConfig`
5. Cole nas duas configurações:
   - `entregas-admin/src/lib/firebase.js`
   - `entregas-motorista/src/lib/firebase.js`

---

## PASSO 4 — Criar o usuário admin manualmente

No console Firebase → Authentication → Usuários → Adicionar usuário:
- E-mail: admin@suaempresa.com
- Senha: (escolha uma forte)

Depois, no Firestore → Coleções → Nova coleção `users`:
- Document ID: (o UID do usuário criado acima — aparece na lista de Authentication)
- Campos:
  ```
  uid:    "mesmo UID acima"
  email:  "admin@suaempresa.com"
  nome:   "Administrador"
  role:   "admin"
  ativo:  true
  ```

---

## PASSO 5 — Rodar o painel admin

```bash
cd entregas-admin
npm install
npm start
```

Abra http://localhost:3000 → faça login com o usuário admin criado acima.

### Deploy do painel admin no Vercel

Crie um projeto novo no Vercel apontando para este mesmo repositório, mas com:

- Root Directory: `entregas-admin`
- Build Command: `npm run build`
- Output Directory: `build`

O arquivo `entregas-admin/vercel.json` já faz o rewrite de SPA para rotas como `/login`, `/viagens` e `/clientes`.

URL publicada:
- https://teste-app-admin.vercel.app

### Deploy do painel admin (para acessar online):

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # selecione seu projeto, pasta: build, SPA: sim
npm run build
firebase deploy
```

Seu painel ficará em: `https://seu-projeto.web.app`

---

## PASSO 6 — Gerar o APK do app motorista

### Instalar dependências:
```bash
cd entregas-motorista
npm install
npm install -g eas-cli
```

### Configurar conta Expo:
```bash
eas login          # crie conta gratuita em expo.dev se não tiver
eas build:configure
```

Este projeto já está vinculado ao EAS:
- Conta: `igor_lima`
- Projeto: `@igor_lima/entregas-motorista`
- `projectId`: `a8d40471-ca1c-4e52-bb79-0a9b7f2a831d`

### Gerar o APK:
```bash
eas build -p android --profile preview
```

O build roda na nuvem (~5-10 min). Ao terminar, você recebe um link para baixar o `.apk`.

Build mais recente:
- https://expo.dev/accounts/igor_lima/projects/entregas-motorista/builds/545dc410-aa43-4308-bbef-1572d42c1c5d

### Instalar no celular do motorista:
1. Baixe o `.apk` no celular
2. Nas configurações do Android: ative "Fontes desconhecidas" (ou "Instalar apps de outras fontes")
3. Abra o arquivo `.apk` e instale

### Configurar o Cloudinary para comprovantes

Este projeto usa Firebase para login e banco, mas usa `Cloudinary` para armazenar as fotos dos comprovantes sem depender do Firebase Storage.

1. Crie uma conta gratuita em https://cloudinary.com
2. No painel, copie o `Cloud name`
3. Vá em `Settings` → `Upload`
4. Crie um `Upload preset` com modo `Unsigned`
5. Edite [entregas-motorista/app.json](/Users/igor/Downloads/codex/primeiro app/files/entregas-motorista/app.json) e preencha:

```json
"cloudinary": {
  "cloudName": "SEU_CLOUD_NAME",
  "uploadPreset": "SEU_UPLOAD_PRESET"
}
```

6. Gere um novo APK depois dessa configuração

---

## PASSO 7 — Cadastrar motoristas e clientes

Com o painel admin rodando:
1. Vá em "Motoristas" → "Novo motorista" → preencha nome, placa, e-mail e senha
2. Vá em "Clientes" → "Novo cliente" → preencha razão social, e-mail e senha
3. Informe ao motorista o e-mail e senha para fazer login no app
4. Informe ao cliente o e-mail e senha para acessar o portal

---

## Portal do cliente

O portal do cliente é uma página web separada que você ainda pode criar.
O cliente acessa com o e-mail e senha cadastrados e vê:
- Viagens em andamento com mapa ao vivo
- Histórico de entregas
- Comprovantes recebidos

Pode ser hospedado no mesmo Firebase Hosting como uma rota separada,
ou como um projeto React separado apontando para o mesmo banco Firebase.

### Deploy do portal do cliente no Vercel

Crie um segundo projeto no Vercel apontando para este mesmo repositório, mas com:

- Root Directory: `entregas-cliente`
- Build Command: `npm run build`
- Output Directory: `build`

O arquivo `entregas-cliente/vercel.json` já faz o rewrite de SPA para rotas como `/login`.

URL publicada:
- https://teste-app-cliente.vercel.app

---

## Fluxo completo de uma entrega

```
1. Admin lança viagem (painel web)
      ↓
2. Motorista vê a viagem no app Android
      ↓
3. Motorista toca em "Iniciar viagem"
      ↓  GPS ativa em segundo plano
4. Cliente acompanha posição em tempo real no portal
      ↓
5. Motorista chega no destino → fotografa comprovante
      ↓
6. App envia foto ao Cloudinary
      ↓
7. Admin vê comprovante na aba "Comprovantes" e confirma
8. Cliente vê comprovante automaticamente no portal
```

---

## Custos (Firebase Spark — plano gratuito)

| Recurso         | Limite gratuito       | Estimativa para 30 viagens/dia |
|-----------------|----------------------|-------------------------------|
| Firestore reads | 50.000/dia           | ~10.000/dia ✅                |
| Firestore writes| 20.000/dia           | ~8.000/dia ✅                 |
| Storage         | 5 GB                 | ~50 fotos/dia ≈ 150MB/mês ✅  |
| Auth            | Ilimitado            | ✅                            |

Para escala maior, o plano Blaze (pay-as-you-go) fica em torno de R$ 30-80/mês.

---

## Suporte e próximos passos

- **Portal do cliente:** Solicite o código completo do portal
- **Notificações push:** Integrar Firebase Cloud Messaging (FCM)
- **Relatórios:** Exportar viagens em Excel por período
- **Múltiplas empresas:** Separar dados por CNPJ (multi-tenant)
