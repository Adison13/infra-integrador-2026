import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { chamar, entrarComUsuarioDeTeste, ErroDaApi, type Pagina } from './plataforma/api'
import { aoMudarSessao, estaEmbutido, notificarCasca, sessaoAtual, type Sessao } from './plataforma/sessao'

interface Item {
  id: string
  nome: string
  descricao: string | null
  criadoEm: string
}

type Estado =
  | { fase: 'carregando' }
  | { fase: 'erro'; mensagem: string }
  | { fase: 'pronto'; pagina: Pagina<Item> }

const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function App() {
  const [sessao, setSessao] = useState<Sessao | null>(sessaoAtual())
  useEffect(() => aoMudarSessao(setSessao), [])

  if (!sessao) {
    return estaEmbutido() ? <Aguardando /> : <EntradaDeTeste />
  }
  return <Itens sessao={sessao} />
}

function Aguardando() {
  return (
    <main className="grid min-h-40 place-items-center p-6 text-sm text-muted-foreground">
      Aguardando a sessão da plataforma…
    </main>
  )
}

/** Modo direto, só para desenvolvimento: login com um usuário de docs/usuarios-de-teste.md. */
function EntradaDeTeste() {
  const [email, setEmail] = useState('administrador@empresa-a.dev')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      await entrarComUsuarioDeTeste(email, senha)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Modo direto · desenvolvimento</p>
      <h1 className="mt-2 text-xl font-semibold">Entrar com usuário de teste</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Dentro da plataforma, este passo não existe: a casca entrega a sessão.
      </p>
      <form onSubmit={entrar} className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm">
          E-mail
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-input bg-card px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          Senha
          <input id="senha" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
            className="rounded-md border border-input bg-card px-3 py-2" />
        </label>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        <button type="submit" disabled={enviando}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}

function Itens({ sessao }: { sessao: Sessao }) {
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' })

  const carregar = useCallback(async () => {
    setEstado({ fase: 'carregando' })
    try {
      const pagina = await chamar<Pagina<Item>>('/api/exemplo/itens?tamanho=50')
      setEstado({ fase: 'pronto', pagina })
    } catch (e) {
      const mensagem = e instanceof ErroDaApi && e.status === 403
        ? 'Seu perfil não tem a permissão exemplo.item.ver.'
        : e instanceof Error ? e.message : 'Não foi possível carregar os itens.'
      setEstado({ fase: 'erro', mensagem })
    }
  }, [])

  // Recarrega quando o token muda (renovação feita pela casca)
  useEffect(() => {
    void carregar()
  }, [carregar, sessao.token])

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold">Itens</h1>
          <p className="text-sm text-muted-foreground">Módulo de exemplo · {sessao.usuario.nome}</p>
        </div>
        {estado.fase === 'pronto' && (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {estado.pagina.total} {estado.pagina.total === 1 ? 'item' : 'itens'}
          </span>
        )}
      </header>

      <NovoItem aoCriar={carregar} />

      <section className="mt-6" aria-live="polite">
        {estado.fase === 'carregando' && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {estado.fase === 'erro' && (
          <div role="alert" className="rounded-md border border-destructive/40 p-4 text-sm">
            <p className="text-destructive">{estado.mensagem}</p>
            <button type="button" onClick={() => void carregar()} className="mt-2 underline">Tentar de novo</button>
          </div>
        )}
        {estado.fase === 'pronto' && estado.pagina.itens.length === 0 && (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum item ainda. Crie o primeiro acima.
          </p>
        )}
        {estado.fase === 'pronto' && estado.pagina.itens.length > 0 && (
          <ul className="divide-y rounded-md border bg-card">
            {estado.pagina.itens.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                <div>
                  <p className="font-medium">{item.nome}</p>
                  {item.descricao && <p className="text-sm text-muted-foreground">{item.descricao}</p>}
                </div>
                <time dateTime={item.criadoEm} className="font-mono text-xs text-muted-foreground">
                  {dataHora.format(new Date(item.criadoEm))}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function NovoItem({ aoCriar }: { aoCriar: () => Promise<void> }) {
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function criar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      await chamar('/api/exemplo/itens', { method: 'POST', body: JSON.stringify({ nome }) })
      setNome('')
      notificarCasca('sucesso', 'Item criado.')
      await aoCriar()
    } catch (e) {
      const detalhe = e instanceof ErroDaApi ? e.envelope?.errors[0]?.detalhe : undefined
      setErro(detalhe ?? (e instanceof Error ? e.message : 'Não foi possível criar o item.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={criar} className="mt-6 flex flex-wrap items-start gap-2">
      <label htmlFor="novo-item" className="sr-only">Nome do novo item</label>
      <input id="novo-item" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do novo item"
        maxLength={200} className="min-w-0 flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm" />
      <button type="submit" disabled={enviando || !nome.trim()}
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
        {enviando ? 'Criando…' : 'Criar item'}
      </button>
      {erro && <p role="alert" className="basis-full text-sm text-destructive">{erro}</p>}
    </form>
  )
}
