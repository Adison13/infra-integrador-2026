# Registro de módulos

Um arquivo por módulo, em `modulos/{codigo}.json`, validado contra [schema.json](schema.json).
A plataforma carrega estes registros e a casca monta o menu a partir deles — entrar no
sistema não exige recompilar nada do Grupo 2 (Contrato §11).

| Campo | Regra |
|---|---|
| `codigo` | O mesmo do schema, da rota da API, do container e do prefixo das permissões |
| `urlFrontend` | Sempre `/modulos/{codigo}/` — o front é servido na mesma origem (§12.8) |
| `permissaoMenu` | `{codigo}.acessar`; sem ela o módulo não aparece no menu |
| `ordemMenu` | Posição no menu. Faixas: CRM 10–19, Produtos 20–29, Contratos 30–39, Financeiro 40–49, Chamados 50–59, Marketing 60–69, Landing 70–79 |
| `icone` | Nome de um ícone de [lucide.dev](https://lucide.dev), o mesmo pacote de ícones do shadcn/ui |
| `itensSubmenu` | Cada item tem a própria permissão; a casca esconde os que o usuário não pode ver |

Esconder um item do menu é usabilidade, não segurança: o back-end continua respondendo 403.
