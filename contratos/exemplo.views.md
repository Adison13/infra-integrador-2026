# Views públicas — exemplo

*Views* somente-leitura que o módulo publica para relatórios e agregações (Contrato §9.8).
Copie este arquivo como `{modulo}.views.md`. Tela operacional nunca lê *view*: usa API.

## `exemplo.vw_pub_itens`

Itens ativos, sem os excluídos.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | Identificador do item |
| `tenant_id` | `uuid` | Tenant dono do registro — **quem lê filtra por ele**, com o valor do token do usuário |
| `nome` | `varchar(200)` | Nome do item |
| `created_at` | `timestamptz` | Quando foi criado, em UTC |

**Quem pode ler:** `usr_chamados` (motor de relatórios).

**Concedido na migration** `V1__exemplo.sql`, rodando como `own_exemplo`. O `IF EXISTS`
deixa a mesma migration rodar nos testes, onde `usr_chamados` não existe:

```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'usr_chamados') THEN
    GRANT USAGE  ON SCHEMA exemplo       TO usr_chamados;
    GRANT SELECT ON exemplo.vw_pub_itens TO usr_chamados;
  END IF;
END $$;
```

**Histórico:** criada na versão 0.1.0. Remover ou renomear coluna exige
`vw_pub_itens_v2` convivendo com esta até o consumidor migrar.
