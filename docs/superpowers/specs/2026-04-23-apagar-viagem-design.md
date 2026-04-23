# Design: Apagar Viagem no Painel de Entregas

## Objetivo

Permitir que o admin apague viagens criadas por engano no painel de entregas, mas somente quando a viagem ainda estiver em estado seguro para remoção.

## Escopo

- Exibir a ação `Apagar` para viagens com status `agendada` ou `cancelada`.
- Manter a exclusão bloqueada para viagens com status `em_rota` ou `entregue`.
- Exigir confirmação explícita antes da exclusão.
- Registrar a ação em `auditoria` com a ação `viagem.apagada`.
- Fechar o modal de detalhes se a viagem removida estiver aberta.

## Fluxo

1. O admin visualiza a viagem na tabela ou no modal de detalhes.
2. Se o status for `agendada` ou `cancelada`, a interface mostra a ação `Apagar`.
3. Ao confirmar a exclusão, o painel valida novamente o status no cliente.
4. O documento é removido da coleção `viagens`.
5. O painel registra a auditoria e mostra feedback de sucesso.

## Regras

- Viagens em rota ou entregues não podem ser apagadas.
- Em caso de falha na exclusão, a interface deve manter a viagem visível e informar o erro.
- A solução deve reaproveitar os padrões já usados na página `Viagens`.

## Testes

- Cobrir a regra que define quando uma viagem pode ser apagada.
- Garantir que apenas `agendada` e `cancelada` retornem permissão para exclusão.
