# Permissões

Uma lista por módulo, em `permissoes/{modulo}.yaml`, validada contra
[schema.json](schema.json). O identity carrega todas no catálogo global e as mostra na tela de
montagem de perfis (Requisitos RF19 a RF22).

- **Formato do código:** `modulo.recurso.acao` em minúsculas, ou `modulo.acessar` para
  aparecer no menu.
- **Ações:** `ver`, `criar`, `editar`, `excluir`, `exportar`, `aprovar`, `administrar`,
  `compartilhar`. Precisou de outra? Proponha no *pull request* e explique o motivo.
- **`perfisPadrao`:** perfis que já nascem com a permissão quando um tenant é criado. O
  administrador do tenant pode mudar depois.
- **Permissão fraca de resumo:** se o seu módulo é dono de entidade que outros exibem
  (empresa, contrato, produto), crie `{modulo}.{recurso}.ver_resumo` e dê a todos os perfis
  operacionais (Contrato §9.3).

Permissão que não está aqui nunca aparece em token. Se o seu código exige uma permissão e
o teste recebe 403, confira primeiro se ela foi cadastrada.
