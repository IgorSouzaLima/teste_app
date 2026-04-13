# Sistema de Entregas — Guia completo de instalação

## Estrutura dos projetos

```
/firebase-config/         ← Regras e schema do banco
/entregas-admin/          ← Painel web (React)
/entregas-motorista/      ← App Android (React Native + Expo)
```

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

**Storage:**
- Menu lateral → Storage → Primeiros passos
- Aceite as regras padrão (vamos substituir depois)

---

## PASSO 2 — Aplicar as regras de segurança

**Firestore Rules:**
- Menu lateral → Firestore → Aba "Regras"
- Cole o conteúdo de `firebase-config/firestore.rules`
- Clique em Publicar

**Storage Rules:**
- Menu lateral → Storage → Aba "Regras"
- Cole o conteúdo de `firebase-config/storage.rules`
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

Copie o `projectId` gerado e cole em `app.json` → `extra.eas.projectId`.

### Gerar o APK:
```bash
eas build -p android --profile preview
```

O build roda na nuvem (~5-10 min). Ao terminar, você recebe um link para baixar o `.apk`.

### Instalar no celular do motorista:
1. Baixe o `.apk` no celular
2. Nas configurações do Android: ative "Fontes desconhecidas" (ou "Instalar apps de outras fontes")
3. Abra o arquivo `.apk` e instale

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
6. App envia foto ao Firebase Storage
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
