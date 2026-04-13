# Estrutura do Banco de Dados — Firebase Firestore

## Coleções

### /users/{uid}
Criado automaticamente ao cadastrar qualquer usuário.
```json
{
  "uid": "string (Firebase Auth UID)",
  "email": "string",
  "nome": "string",
  "role": "admin | motorista | cliente",
  "clienteId": "string (apenas para role=cliente)",
  "motoristaId": "string (apenas para role=motorista)",
  "criadoEm": "timestamp",
  "ativo": true
}
```

### /motoristas/{motoristaId}
```json
{
  "id": "string",
  "userId": "string (Firebase Auth UID)",
  "nome": "string",
  "cpf": "string",
  "telefone": "string",
  "placa": "string",
  "veiculo": "string",
  "cnh": "string",
  "ativo": true,
  "criadoEm": "timestamp",
  "ultimaLocalizacao": {
    "lat": "number",
    "lng": "number",
    "timestamp": "timestamp"
  }
}
```

### /clientes/{clienteId}
```json
{
  "id": "string",
  "userId": "string (Firebase Auth UID — para login)",
  "razaoSocial": "string",
  "cnpj": "string",
  "contato": "string",
  "telefone": "string",
  "email": "string",
  "cidade": "string",
  "ativo": true,
  "criadoEm": "timestamp"
}
```

### /viagens/{viagemId}
```json
{
  "id": "string",
  "motoristaId": "string (ref /motoristas)",
  "motoristaNome": "string (denormalizado)",
  "motoristaPlaca": "string (denormalizado)",
  "clienteId": "string (ref /clientes)",
  "clienteNome": "string (denormalizado)",
  "notas": ["NF 4521", "NF 4522"],
  "cidadeDestino": "string",
  "status": "agendada | em_rota | entregue | cancelada",
  "criadoEm": "timestamp",
  "saidaEm": "timestamp | null",
  "entregaEm": "timestamp | null",
  "criadoPor": "string (admin uid)",
  "observacoes": "string",
  "localizacaoAtual": {
    "lat": "number",
    "lng": "number",
    "atualizadoEm": "timestamp"
  }
}
```

### /viagens/{viagemId}/localizacoes/{locId}
Sub-coleção — histórico de posições GPS do motorista.
```json
{
  "lat": "number",
  "lng": "number",
  "velocidade": "number (km/h)",
  "precisao": "number (metros)",
  "timestamp": "timestamp"
}
```

### /comprovantes/{compId}
```json
{
  "id": "string",
  "viagemId": "string",
  "motoristaId": "string",
  "clienteId": "string",
  "fotoUrl": "string (Firebase Storage URL)",
  "fotoPath": "string (Storage path)",
  "notas": ["NF 4521", "NF 4522"],
  "latitude": "number",
  "longitude": "number",
  "criadoEm": "timestamp",
  "status": "pendente | confirmado"
}
```

## Fluxo de status de uma viagem

agendada → (motorista aceita) → em_rota → (motorista envia foto) → entregue

## Regras de segurança resumidas

| Ação              | Admin | Motorista (própria) | Cliente (própria) |
|-------------------|-------|---------------------|-------------------|
| Ler viagens       | ✅    | ✅                  | ✅                |
| Criar viagem      | ✅    | ❌                  | ❌                |
| Atualizar viagem  | ✅    | ✅ (status/GPS)     | ❌                |
| Enviar GPS        | ❌    | ✅                  | ❌                |
| Enviar comprovante| ❌    | ✅                  | ❌                |
| Ver comprovante   | ✅    | ✅                  | ✅                |
